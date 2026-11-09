import { executeCanvasOperation } from './excalidraw-ops';

export class CanvasBridgeClient {
  constructor(options = {}) {
    this.bridgeUrl = options.bridgeUrl || 'ws://127.0.0.1:4444';
    this.sessionId = options.sessionId || `slate_session_${Math.random().toString(36).substring(2, 8)}`;
    this.excalidrawAPI = null;
    this.socket = null;
    this.status = 'disconnected'; // 'connected' | 'connecting' | 'disconnected'
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.listeners = new Set();
    this.lastOperation = null;
  }

  setExcalidrawAPI(api) {
    this.excalidrawAPI = api;
    if (typeof window !== 'undefined') {
      window.__EXCALIDRAW_API__ = api;
    }
  }

  getAPI() {
    return this.excalidrawAPI || (typeof window !== 'undefined' ? window.__EXCALIDRAW_API__ : null);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Send immediate initial status
    listener({ status: this.status, sessionId: this.sessionId, lastOperation: this.lastOperation });
    return () => this.listeners.delete(listener);
  }

  notify(event) {
    for (const listener of this.listeners) {
      try {
        listener({
          status: this.status,
          sessionId: this.sessionId,
          lastOperation: this.lastOperation,
          event,
        });
      } catch (e) {
        console.warn('Listener error in CanvasBridgeClient:', e);
      }
    }
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.status = 'connecting';
    this.notify({ type: 'status_change', status: 'connecting' });

    try {
      this.socket = new WebSocket(this.bridgeUrl);

      this.socket.onopen = () => {
        this.status = 'connected';
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Register session with bridge
        const elementCount = this.excalidrawAPI ? this.excalidrawAPI.getSceneElements().length : 0;
        this.socket.send(
          JSON.stringify({
            id: `reg_${Date.now()}`,
            type: 'SESSION_REGISTER',
            sessionId: this.sessionId,
            payload: {
              sessionId: this.sessionId,
              boardName: 'Slate',
              elementCount,
            },
            timestamp: Date.now(),
          })
        );

        // Periodic ping
        this.pingTimer = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
          }
        }, 10000);

        this.notify({ type: 'status_change', status: 'connected' });
        console.log(`[Slate Bridge] Connected to MCP bridge at ${this.bridgeUrl} (session: ${this.sessionId})`);
      };

      this.socket.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'EXECUTE_OPERATION') {
            await this.handleOperation(msg);
          }
        } catch (err) {
          console.error('[Slate Bridge] Message processing error:', err);
        }
      };

      this.socket.onclose = () => {
        this.cleanup();
        this.status = 'disconnected';
        this.notify({ type: 'status_change', status: 'disconnected' });

        // Schedule auto-reconnect
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 2000);
        }
      };

      this.socket.onerror = () => {
        // Handled in onclose
      };
    } catch {
      this.cleanup();
      this.status = 'disconnected';
      this.notify({ type: 'status_change', status: 'disconnected' });
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    }
  }

  cleanup() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanup();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.status = 'disconnected';
    this.notify({ type: 'status_change', status: 'disconnected' });
  }

  async handleOperation(msg) {
    const { id, payload } = msg;
    const { operation, params } = payload;
    const api = this.getAPI();

    if (!api) {
      this.sendResult(id, operation, false, null, {
        code: 'CANVAS_NOT_INITIALIZED',
        message: 'Canvas API is not ready in this browser tab yet.',
      });
      return;
    }

    try {
      const data = await executeCanvasOperation(api, operation, params);
      this.lastOperation = {
        operation,
        success: true,
        timestamp: Date.now(),
      };
      this.sendResult(id, operation, true, data);
      this.notify({ type: 'operation_success', operation });
    } catch (err) {
      this.lastOperation = {
        operation,
        success: false,
        error: err.message,
        timestamp: Date.now(),
      };
      this.sendResult(id, operation, false, null, {
        code: err.code || 'OPERATION_FAILED',
        message: err.message || 'Operation failed on canvas.',
      });
      this.notify({ type: 'operation_error', operation, error: err.message });
    }
  }

  sendResult(id, operation, success, data, error) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const response = {
      id,
      type: 'OPERATION_RESULT',
      sessionId: this.sessionId,
      payload: {
        operation,
        success,
        data,
        error,
      },
      timestamp: Date.now(),
    };

    this.socket.send(JSON.stringify(response));
  }
}

// Global singleton instance for the browser session
export const canvasClient = new CanvasBridgeClient();
