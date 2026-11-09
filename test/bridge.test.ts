import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { BridgeServer } from '../src/mcp/bridge/bridge-server';

describe('Bridge Server & WebSocket Protocol', () => {
  const TEST_PORT = 4466;
  let server: BridgeServer;

  beforeAll(async () => {
    server = new BridgeServer({ port: TEST_PORT });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should reject operation if no browser is connected', async () => {
    await expect(server.executeOperation('GET_STATE', {})).rejects.toThrow(
      /No active Slate whiteboard session is connected/
    );
  });

  it('should register browser session and handle operation execution', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${TEST_PORT}`);

    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        // Send registration
        ws.send(
          JSON.stringify({
            id: 'reg-1',
            type: 'SESSION_REGISTER',
            sessionId: 'test-session-123',
            payload: {
              sessionId: 'test-session-123',
              boardName: 'Slate Test',
              elementCount: 0,
            },
            timestamp: Date.now(),
          })
        );
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'SESSION_REGISTER_ACK') {
          resolve();
        }
      });
    });

    expect(server.getSessionCount()).toBe(1);
    expect(server.getActiveSessionId()).toBe('test-session-123');

    // Set up responder on client for operations
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'EXECUTE_OPERATION') {
        const { operation, params } = msg.payload;
        if (operation === 'CREATE_SHAPE') {
          ws.send(
            JSON.stringify({
              id: msg.id,
              type: 'OPERATION_RESULT',
              sessionId: 'test-session-123',
              payload: {
                success: true,
                operation,
                data: {
                  elementId: 'shape-abc',
                  shape: { id: 'shape-abc', type: params.type, label: params.label },
                },
              },
              timestamp: Date.now(),
            })
          );
        }
      }
    });

    // Execute operation from server
    const result = await server.executeOperation<{ elementId: string; shape: { id: string } }>(
      'CREATE_SHAPE',
      { type: 'rectangle', label: 'Test Gateway' }
    );

    expect(result.elementId).toBe('shape-abc');
    expect(result.shape.id).toBe('shape-abc');

    // Clean up client
    ws.close();
    await new Promise((r) => setTimeout(r, 100));
    expect(server.getSessionCount()).toBe(0);
  });

  it('should support idempotency cache for repeated requests', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${TEST_PORT}`);

    let executionCount = 0;

    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            id: 'reg-2',
            type: 'SESSION_REGISTER',
            sessionId: 'test-session-idemp',
            payload: { sessionId: 'test-session-idemp' },
            timestamp: Date.now(),
          })
        );
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'SESSION_REGISTER_ACK') {
          resolve();
        } else if (msg.type === 'EXECUTE_OPERATION') {
          executionCount++;
          ws.send(
            JSON.stringify({
              id: msg.id,
              type: 'OPERATION_RESULT',
              sessionId: 'test-session-idemp',
              payload: {
                success: true,
                operation: msg.payload.operation,
                data: { created: true, runNumber: executionCount },
              },
              timestamp: Date.now(),
            })
          );
        }
      });
    });

    const idempotencyKey = 'key-test-999';

    // First call
    const res1 = await server.executeOperation<{ runNumber: number }>(
      'CREATE_SHAPE',
      { type: 'rectangle' },
      { idempotencyKey }
    );
    expect(res1.runNumber).toBe(1);

    // Second call with same idempotency key - should return cached result without contacting browser again
    const res2 = await server.executeOperation<{ runNumber: number }>(
      'CREATE_SHAPE',
      { type: 'rectangle' },
      { idempotencyKey }
    );
    expect(res2.runNumber).toBe(1);
    expect(executionCount).toBe(1);

    ws.close();
  });
});
