import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CanvasBridge } from '../bridge/canvas-bridge';
import {
  GetCanvasStateSchema,
  GetCanvasSummarySchema,
  ClearCanvasSchema,
  UndoLastOperationSchema,
  ExportDiagramSchema,
} from '../validation/schemas';

export function registerCanvasTools(server: McpServer, bridge: CanvasBridge): void {
  server.registerTool(
    'get_canvas_state',
    {
      description: 'Retrieve full or paginated canvas state from the active whiteboard, including element IDs, types, positions, bounds, connectors, and groups.',
      inputSchema: GetCanvasStateSchema,
    },
    async (args) => {
      try {
        const result = await bridge.getCanvasState(args);
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
          content: [{ type: 'text', text: `Failed to get canvas state: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'get_canvas_summary',
    {
      description: 'Get a concise overview of the diagram: element counts, labeled shapes, connectors, and groups.',
      inputSchema: GetCanvasSummarySchema,
    },
    async (args) => {
      try {
        const result = await bridge.getCanvasSummary(args);
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
          content: [{ type: 'text', text: `Failed to get canvas summary: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'clear_canvas',
    {
      description: 'Clear all elements from the whiteboard canvas. Requires explicit confirmation parameter confirm: true.',
      inputSchema: ClearCanvasSchema,
    },
    async (args) => {
      try {
        const result = await bridge.clearCanvas(args);
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
          content: [{ type: 'text', text: `Failed to clear canvas: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'undo_last_operation',
    {
      description: 'Undo the last drawing operation on the whiteboard using native canvas history.',
      inputSchema: UndoLastOperationSchema,
    },
    async (args) => {
      try {
        const result = await bridge.undoLast(args);
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
          content: [{ type: 'text', text: `Failed to undo last operation: ${(err as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    'export_diagram',
    {
      description: 'Export the current whiteboard diagram to SVG, PNG (data URL), or JSON format.',
      inputSchema: ExportDiagramSchema,
    },
    async (args) => {
      try {
        const result = await bridge.exportDiagram(args);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to export diagram: ${(err as Error).message}` }],
        };
      }
    }
  );
}
