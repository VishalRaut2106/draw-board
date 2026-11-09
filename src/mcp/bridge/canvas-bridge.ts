import type { BridgeServer } from './bridge-server';
import type { OperationType } from '../types/bridge';
import { computeDiagramLayout } from '../layout/engine';

export class CanvasBridge {
  private server: BridgeServer;

  constructor(server: BridgeServer) {
    this.server = server;
  }

  public getSessionCount(): number {
    return this.server.getSessionCount();
  }

  public getActiveSessionId(preferredId?: string): string | null {
    return this.server.getActiveSessionId(preferredId);
  }

  public async execute<T = unknown>(
    operation: OperationType,
    params: Record<string, unknown>,
    options?: { sessionId?: string; timeoutMs?: number; idempotencyKey?: string }
  ): Promise<T> {
    return this.server.executeOperation<T>(operation, params, options);
  }

  public async getCanvasState(params: { sessionId?: string; limit?: number; includeDeleted?: boolean }) {
    return this.execute('GET_STATE', params, { sessionId: params.sessionId });
  }

  public async getCanvasSummary(params: { sessionId?: string }) {
    return this.execute('GET_SUMMARY', params, { sessionId: params.sessionId });
  }

  public async createShape(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('CREATE_SHAPE', params, { sessionId: params.sessionId });
  }

  public async createText(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('CREATE_TEXT', params, { sessionId: params.sessionId });
  }

  public async updateShape(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('UPDATE_SHAPE', params, { sessionId: params.sessionId });
  }

  public async deleteShape(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('DELETE_SHAPE', params, { sessionId: params.sessionId });
  }

  public async duplicateShape(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('DUPLICATE_SHAPE', params, { sessionId: params.sessionId });
  }

  public async connectShapes(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('CONNECT_SHAPES', params, { sessionId: params.sessionId });
  }

  public async updateConnector(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('UPDATE_CONNECTOR', params, { sessionId: params.sessionId });
  }

  public async deleteConnector(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('DELETE_CONNECTOR', params, { sessionId: params.sessionId });
  }

  public async groupElements(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('GROUP_ELEMENTS', params, { sessionId: params.sessionId });
  }

  public async arrangeDiagram(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('ARRANGE_DIAGRAM', params, { sessionId: params.sessionId });
  }

  public async moveElements(params: Record<string, unknown> & { sessionId?: string }) {
    return this.execute('MOVE_ELEMENTS', params, { sessionId: params.sessionId });
  }

  public async clearCanvas(params: { confirm: boolean; sessionId?: string }) {
    return this.execute('CLEAR_CANVAS', params, { sessionId: params.sessionId });
  }

  public async undoLast(params: { sessionId?: string }) {
    return this.execute('UNDO_LAST', params, { sessionId: params.sessionId });
  }

  public async exportDiagram(params: { format?: 'svg' | 'png' | 'json'; sessionId?: string }) {
    return this.execute('EXPORT_DIAGRAM', params, { sessionId: params.sessionId });
  }

  public async createDiagram(params: {
    shapes: Array<{ id?: string; type?: string; x?: number; y?: number; width?: number; height?: number; label?: unknown }>;
    connectors?: Array<{ id?: string; sourceId: string; targetId: string; label?: string }>;
    groups?: Array<{ id?: string; elementIds: string[]; name?: string }>;
    layout?: 'left-to-right' | 'top-to-bottom' | 'hierarchical' | 'grid' | 'none';
    startX?: number;
    startY?: number;
    spacingX?: number;
    spacingY?: number;
    sessionId?: string;
  }) {
    // If layout is specified and not 'none', compute layout coordinates
    const layoutMode = params.layout ?? 'left-to-right';
    if (layoutMode !== 'none') {
      // Ensure all shapes have IDs so edges can reference them
      const shapesWithIds = params.shapes.map((s, idx) => ({
        ...s,
        id: s.id || `shape_${Date.now()}_${idx}`,
        width: s.width || 160,
        height: s.height || 80,
      }));

      const edges = (params.connectors || []).map((c) => ({
        sourceId: c.sourceId,
        targetId: c.targetId,
      }));

      const layoutResult = computeDiagramLayout(
        shapesWithIds.map((s) => ({ id: s.id!, width: s.width!, height: s.height! })),
        edges,
        {
          direction: layoutMode,
          startX: params.startX ?? 100,
          startY: params.startY ?? 100,
          spacingX: params.spacingX ?? 100,
          spacingY: params.spacingY ?? 80,
        }
      );

      const posMap = new Map(layoutResult.nodes.map((n) => [n.id, n]));
      const positionedShapes = shapesWithIds.map((s) => {
        const pos = posMap.get(s.id!);
        return {
          ...s,
          x: pos ? pos.x : s.x ?? 100,
          y: pos ? pos.y : s.y ?? 100,
        };
      });

      return this.execute(
        'CREATE_DIAGRAM',
        {
          ...params,
          shapes: positionedShapes,
        },
        { sessionId: params.sessionId }
      );
    }

    return this.execute('CREATE_DIAGRAM', params, { sessionId: params.sessionId });
  }
}
