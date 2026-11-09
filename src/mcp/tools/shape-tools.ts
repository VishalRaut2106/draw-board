import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CanvasBridge } from '../bridge/canvas-bridge';
import {
  CreateShapeSchema,
  CreateTextSchema,
  UpdateShapeSchema,
  DeleteShapeSchema,
  DuplicateShapeSchema,
} from '../validation/schemas';

export function registerShapeTools(server: McpServer, bridge: CanvasBridge): void {
  server.registerTool(
    'create_shape',
    {
      description: 'Create an editable shape (rectangle, ellipse, diamond) with an optional text label on the canvas. Returns created element ID and properties.',
      inputSchema: CreateShapeSchema,
    },
    async (args) => {
      try {
        const result = await bridge.createShape(args as Record<string, unknown>);
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
          content: [{ type: 'text', text: `Failed to create shape: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'create_text',
    {
      description: 'Create an editable standalone text element on the canvas at specified coordinates.',
      inputSchema: CreateTextSchema,
    },
    async (args) => {
      try {
        const result = await bridge.createText(args as Record<string, unknown>);
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
          content: [{ type: 'text', text: `Failed to create text: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'update_shape',
    {
      description: 'Update properties, position, dimensions, label, or styles of an existing shape on the canvas.',
      inputSchema: UpdateShapeSchema,
    },
    async (args) => {
      try {
        const result = await bridge.updateShape(args as Record<string, unknown>);
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
          content: [{ type: 'text', text: `Failed to update shape: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'delete_shape',
    {
      description: 'Delete a shape from the canvas, automatically removing dependent connectors to prevent dangling arrows.',
      inputSchema: DeleteShapeSchema,
    },
    async (args) => {
      try {
        const result = await bridge.deleteShape(args as Record<string, unknown>);
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
          content: [{ type: 'text', text: `Failed to delete shape: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'duplicate_shape',
    {
      description: 'Duplicate an existing shape with an offset, assigning a new unique ID and optional new label.',
      inputSchema: DuplicateShapeSchema,
    },
    async (args) => {
      try {
        const result = await bridge.duplicateShape(args as Record<string, unknown>);
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
          content: [{ type: 'text', text: `Failed to duplicate shape: ${(err as Error).message}` }],
        };
      }
    }
  );
}
