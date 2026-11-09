import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcp/server';
import { CanvasBridge } from '../src/mcp/bridge/canvas-bridge';
import type { BridgeServer } from '../src/mcp/bridge/bridge-server';

describe('MCP Server End-to-End Tools', () => {
  let client: Client;
  let mockBridgeServer: Partial<BridgeServer>;
  let canvasBridge: CanvasBridge;

  beforeAll(async () => {
    // Mock BridgeServer to simulate browser canvas responses
    mockBridgeServer = {
      getSessionCount: () => 1,
      getActiveSessionId: () => 'mock-session-1',
      executeOperation: async (operation, params) => {
        if (operation === 'CREATE_SHAPE') {
          return {
            elementId: 'shape-101',
            shape: { id: 'shape-101', type: params.type, label: params.label },
          };
        }
        if (operation === 'CONNECT_SHAPES') {
          return {
            connectorId: 'arrow-201',
            sourceId: params.sourceId,
            targetId: params.targetId,
            label: params.label,
          };
        }
        if (operation === 'GET_SUMMARY') {
          return {
            sessionId: 'mock-session-1',
            totalElements: 2,
            shapes: [{ id: 'shape-101', type: 'rectangle', label: 'Client' }],
            connectors: [],
            groups: [],
          };
        }
        if (operation === 'CLEAR_CANVAS') {
          return { success: true, clearedCount: 2 };
        }
        return { success: true, operation, params };
      },
    };

    canvasBridge = new CanvasBridge(mockBridgeServer as BridgeServer);
    const mcpServer = createMcpServer(canvasBridge);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: 'test-antigravity', version: '1.0.0' });

    await mcpServer.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
  });

  it('should discover all registered MCP whiteboard tools', async () => {
    const response = await client.listTools();
    const toolNames = response.tools.map((t) => t.name);

    expect(toolNames).toContain('get_canvas_state');
    expect(toolNames).toContain('get_canvas_summary');
    expect(toolNames).toContain('create_shape');
    expect(toolNames).toContain('create_text');
    expect(toolNames).toContain('update_shape');
    expect(toolNames).toContain('delete_shape');
    expect(toolNames).toContain('duplicate_shape');
    expect(toolNames).toContain('connect_shapes');
    expect(toolNames).toContain('update_connector');
    expect(toolNames).toContain('delete_connector');
    expect(toolNames).toContain('group_elements');
    expect(toolNames).toContain('arrange_diagram');
    expect(toolNames).toContain('move_elements');
    expect(toolNames).toContain('clear_canvas');
    expect(toolNames).toContain('undo_last_operation');
    expect(toolNames).toContain('export_diagram');
    expect(toolNames).toContain('create_diagram');

    expect(toolNames.length).toBeGreaterThanOrEqual(17);
  });

  it('should call create_shape and receive real element ID', async () => {
    const result = await client.callTool({
      name: 'create_shape',
      arguments: {
        type: 'rectangle',
        label: 'API Gateway',
        width: 180,
        height: 80,
      },
    });

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    expect(parsed.elementId).toBe('shape-101');
    expect(parsed.shape.label).toBe('API Gateway');
  });

  it('should call connect_shapes to link two elements', async () => {
    const result = await client.callTool({
      name: 'connect_shapes',
      arguments: {
        sourceId: 'shape-101',
        targetId: 'shape-102',
        label: 'gRPC',
      },
    });

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    expect(parsed.connectorId).toBe('arrow-201');
    expect(parsed.sourceId).toBe('shape-101');
    expect(parsed.targetId).toBe('shape-102');
  });

  it('should reject clear_canvas if confirm is not true', async () => {
    const result = await client.callTool({
      name: 'clear_canvas',
      arguments: {
        confirm: false,
      },
    });

    expect(result.isError).toBe(true);
  });

  it('should allow clear_canvas when confirm is true', async () => {
    const result = await client.callTool({
      name: 'clear_canvas',
      arguments: {
        confirm: true,
      },
    });

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    expect(parsed.clearedCount).toBe(2);
  });
});
