import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CanvasBridge } from './bridge/canvas-bridge';
import { registerCanvasTools } from './tools/canvas-tools';
import { registerShapeTools } from './tools/shape-tools';
import { registerConnectorTools } from './tools/connector-tools';
import { registerDiagramTools } from './tools/diagram-tools';

export function createMcpServer(bridge: CanvasBridge): McpServer {
  const server = new McpServer({
    name: 'slate-whiteboard',
    version: '1.0.0',
  });

  registerCanvasTools(server, bridge);
  registerShapeTools(server, bridge);
  registerConnectorTools(server, bridge);
  registerDiagramTools(server, bridge);

  return server;
}
