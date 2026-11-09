import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CanvasBridge } from '../bridge/canvas-bridge';
import {
  GroupElementsSchema,
  ArrangeDiagramSchema,
  MoveElementsSchema,
  CreateDiagramSchema,
} from '../validation/schemas';

export function registerDiagramTools(server: McpServer, bridge: CanvasBridge): void {
  server.registerTool(
    'group_elements',
    {
      description: 'Group two or more elements together so they can be selected, moved, and organized as a single unit.',
      inputSchema: GroupElementsSchema,
    },
    async (args) => {
      try {
        const result = await bridge.groupElements(args as Record<string, unknown>);
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
          content: [{ type: 'text', text: `Failed to group elements: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'arrange_diagram',
    {
      description: 'Automatically organize whiteboard elements into a clean, non-overlapping layout (left-to-right, top-to-bottom, hierarchical, or grid).',
      inputSchema: ArrangeDiagramSchema,
    },
    async (args) => {
      try {
        const result = await bridge.arrangeDiagram(args as Record<string, unknown>);
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
          content: [{ type: 'text', text: `Failed to arrange diagram: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'move_elements',
    {
      description: 'Move multiple elements on the canvas by deltaX and deltaY while preserving their relative positions and attached connectors.',
      inputSchema: MoveElementsSchema,
    },
    async (args) => {
      try {
        const result = await bridge.moveElements(args as Record<string, unknown>);
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
          content: [{ type: 'text', text: `Failed to move elements: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'create_diagram',
    {
      description: 'Create a complete multi-component diagram (shapes, connectors, groups, and auto-layout) in a single batch operation.',
      inputSchema: CreateDiagramSchema,
    },
    async (args) => {
      try {
        const result = await bridge.createDiagram(args as Parameters<typeof bridge.createDiagram>[0]);
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
          content: [{ type: 'text', text: `Failed to create diagram: ${(err as Error).message}` }],
        };
      }
    }
  );
}
