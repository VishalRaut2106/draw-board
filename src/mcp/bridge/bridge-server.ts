import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { BridgeMessage, OperationType, OperationResultPayload, SessionRegisterPayload } from '../types/bridge';

export interface WebSocketSession {
  sessionId: string;
  boardName?: string;
  socket: WebSocket;
  connectedAt: number;
  lastPing: number;
  elementCount?: number;
}

export interface BridgeServerOptions {
  port?: number;
  host?: string;
  allowedOrigins?: string[];
  requestTimeoutMs?: number;
}

export class BridgeServer {
  private wss: WebSocketServer | null = null;
  private sessions = new Map<string, WebSocketSession>();
  private defaultSessionId: string | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (data: unknown) => void;
      reject: (error: Error) => void;
      timer: NodeJS.Timeout;
      sessionId: string;
      operation: OperationType;
      idempotencyKey?: string;
    }
  >();
  private idempotencyCache = new Map<string, { result: unknown; timestamp: number }>();
  private readonly port: number;
  private readonly host: string;
  private readonly requestTimeoutMs: number;
  private readonly allowedOrigins: string[];

  constructor(options: BridgeServerOptions = {}) {
    this.port = options.port ?? (process.env.BRIDGE_PORT ? parseInt(process.env.BRIDGE_PORT, 10) : 4444);
    this.host = options.host ?? '127.0.0.1';
    this.requestTimeoutMs = options.requestTimeoutMs ?? 15000;
    this.allowedOrigins = options.allowedOrigins ?? [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      'https://draw.vishalraut.me',
    ];
  }

  public async start(): Promise<void> {
    if (this.wss) return;

    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          port: this.port,
          host: this.host,
          verifyClient: (info: { origin: string; req: IncomingMessage }) => {
            const origin = info.origin;
            if (!origin) return true; // non-browser or direct curl/test
            // Allow localhost origins and draw.vishalraut.me
            const isLocal = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
            const isAllowed = isLocal || this.allowedOrigins.includes(origin);
            return isAllowed;
          },
        });

        this.wss.on('listening', () => {
          resolve();
        });

        this.wss.on('error', (err) => {
          reject(err);
        });

        this.wss.on('connection', (ws: WebSocket) => {
          this.handleConnection(ws);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  public async stop(): Promise<void> {
    // Reject all pending requests
    for (const [_id, req] of this.pendingRequests.entries()) {
      clearTimeout(req.timer);
      req.reject(new Error(`Bridge server stopped while operation ${req.operation} was in progress`));
    }
    this.pendingRequests.clear();

    for (const session of this.sessions.values()) {
      session.socket.close();
    }
    this.sessions.clear();
    this.defaultSessionId = null;

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve());
      });
      this.wss = null;
    }
  }

  public getSessionCount(): number {
    return this.sessions.size;
  }

  public getActiveSessionId(preferredId?: string): string | null {
    if (preferredId && this.sessions.has(preferredId)) {
      return preferredId;
    }
    if (this.defaultSessionId && this.sessions.has(this.defaultSessionId)) {
      return this.defaultSessionId;
    }
    const first = this.sessions.keys().next().value;
    return first ?? null;
  }

  public getSessions(): Array<{ sessionId: string; boardName?: string; connectedAt: number; elementCount?: number }> {
    return Array.from(this.sessions.values()).map((s) => ({
      sessionId: s.sessionId,
      boardName: s.boardName,
      connectedAt: s.connectedAt,
      elementCount: s.elementCount,
    }));
  }

  public async executeOperation<T = unknown>(
    operation: OperationType,
    params: Record<string, unknown>,
    options: {
      sessionId?: string;
      timeoutMs?: number;
      idempotencyKey?: string;
    } = {}
  ): Promise<T> {
    // Check idempotency cache
    if (options.idempotencyKey && this.idempotencyCache.has(options.idempotencyKey)) {
      return this.idempotencyCache.get(options.idempotencyKey)!.result as T;
    }

    const targetSessionId = this.getActiveSessionId(options.sessionId);
    if (!targetSessionId) {
      throw new Error(
        'No active Slate whiteboard session is connected.\n' +
        'Please open http://localhost:5173 (or your Slate whiteboard app) in your browser so the AI agent can interact with the canvas.'
      );
    }

    const session = this.sessions.get(targetSessionId);
    if (!session || session.socket.readyState !== WebSocket.OPEN) {
      throw new Error(
        `Slate session "${targetSessionId}" is disconnected or closed. Please refresh the whiteboard page.`
      );
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timeoutMs = options.timeoutMs ?? this.requestTimeoutMs;

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(
          new Error(
            `Timeout waiting for whiteboard to respond to operation "${operation}" after ${timeoutMs}ms.`
          )
        );
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve: resolve as (data: unknown) => void,
        reject,
        timer,
        sessionId: targetSessionId,
        operation,
        idempotencyKey: options.idempotencyKey,
      });

      const message: BridgeMessage = {
        id: requestId,
        type: 'EXECUTE_OPERATION',
        sessionId: targetSessionId,
        payload: {
          operation,
          params,
          idempotencyKey: options.idempotencyKey,
        },
        timestamp: Date.now(),
      };

      try {
        session.socket.send(JSON.stringify(message));
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(new Error(`Failed to transmit command to whiteboard session: ${(err as Error).message}`));
      }
    });
  }

  private handleConnection(ws: WebSocket): void {
    let currentSessionId: string | null = null;

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString()) as BridgeMessage;

        if (msg.type === 'SESSION_REGISTER') {
          const payload = msg.payload as SessionRegisterPayload;
          currentSessionId = payload.sessionId || `session_${Math.random().toString(36).substring(2, 9)}`;
          const session: WebSocketSession = {
            sessionId: currentSessionId,
            boardName: payload.boardName,
            socket: ws,
            connectedAt: Date.now(),
            lastPing: Date.now(),
            elementCount: payload.elementCount,
          };
          this.sessions.set(currentSessionId, session);
          this.defaultSessionId = currentSessionId;

          // Acknowledge registration
          ws.send(
            JSON.stringify({
              id: msg.id,
              type: 'SESSION_REGISTER_ACK',
              sessionId: currentSessionId,
              payload: { registered: true, sessionId: currentSessionId },
              timestamp: Date.now(),
            })
          );
          return;
        }

        if (msg.type === 'OPERATION_RESULT') {
          const req = this.pendingRequests.get(msg.id);
          if (req) {
            clearTimeout(req.timer);
            this.pendingRequests.delete(msg.id);

            const payload = msg.payload as OperationResultPayload;
            if (payload.success) {
              if (req.idempotencyKey) {
                this.idempotencyCache.set(req.idempotencyKey, {
                  result: payload.data,
                  timestamp: Date.now(),
                });
              }
              req.resolve(payload.data);
            } else {
              const errMsg = payload.error?.message || `Operation ${payload.operation} failed on canvas`;
              const err = new Error(errMsg);
              (err as unknown as { code?: string }).code = payload.error?.code;
              req.reject(err);
            }
          }
          return;
        }

        if (msg.type === 'PING') {
          if (currentSessionId && this.sessions.has(currentSessionId)) {
            this.sessions.get(currentSessionId)!.lastPing = Date.now();
          }
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          return;
        }
      } catch {
        // invalid message format
      }
    });

    ws.on('close', () => {
      if (currentSessionId) {
        this.sessions.delete(currentSessionId);
        if (this.defaultSessionId === currentSessionId) {
          this.defaultSessionId = this.sessions.keys().next().value ?? null;
        }

        // Fail pending requests that were routed to this session
        for (const [id, req] of this.pendingRequests.entries()) {
          if (req.sessionId === currentSessionId) {
            clearTimeout(req.timer);
            this.pendingRequests.delete(id);
            req.reject(new Error(`Whiteboard session "${currentSessionId}" disconnected before completing operation.`));
          }
        }
      }
    });
  }
}
