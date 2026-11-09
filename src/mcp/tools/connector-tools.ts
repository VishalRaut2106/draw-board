import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CanvasBridge } from '../bridge/canvas-bridge';
import {
  ConnectShapesSchema,
  UpdateConnectorSchema,
  DeleteConnectorSchema,
} from '../validation/schemas';

export function registerConnectorTools(server: McpServer, bridge: CanvasBridge): void {
  server.registerTool(
    'connect_shapes',
    {
      description: 'Connect two existing shapes with a directional arrow. The connector binds to both shapes and follows them if moved.',
      inputSchema: ConnectShapesSchema,
    },
    async (args) => {
      try {
        const result = await bridge.connectShapes(args as Record<string, unknown>);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to connect shapes: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'update_connector',
    {
      description: 'Update properties, label, style, or endpoints of an existing connector arrow.',
      inputSchema: UpdateConnectorSchema,
    },
    async (args) => {
      try {
        const result = await bridge.updateConnector(args as Record<string, unknown>);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to update connector: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'delete_connector',
    {
      description: 'Delete a connector arrow from the canvas without deleting the connected shapes.',
      inputSchema: DeleteConnectorSchema,
    },
    async (args) => {
      try {
        const result = await bridge.deleteConnector(args as Record<string, unknown>);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to delete connector: ${(err as Error).message}` }],
        };
      }
    }
  );
}
