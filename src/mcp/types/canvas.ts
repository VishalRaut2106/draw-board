export type ShapeType = 'rectangle' | 'ellipse' | 'diamond';

export type FillStyle = 'hachure' | 'cross-hatch' | 'solid' | 'zigzag';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type Arrowhead = 'arrow' | 'bar' | 'dot' | null;
export type LayoutDirection = 'left-to-right' | 'top-to-bottom' | 'hierarchical' | 'grid';

export interface ShapeDefinition {
  id?: string;
  type: ShapeType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label?: string | {
    text: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
  };
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  fillStyle?: FillStyle;
  roundness?: boolean | { type: number; value?: number };
  roughness?: number;
  opacity?: number;
  groupIds?: string[];
  customData?: Record<string, unknown>;
}

export interface TextDefinition {
  id?: string;
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: number; // 1: Virgil, 2: Helvetica, 3: Cascadia
  textAlign?: 'left' | 'center' | 'right';
  strokeColor?: string;
  groupIds?: string[];
}

export interface ConnectorDefinition {
  id?: string;
  sourceId: string;
  targetId: string;
  label?: string;
  startArrowhead?: Arrowhead;
  endArrowhead?: Arrowhead;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  routing?: 'straight' | 'curved' | 'orthogonal';
}

export interface GroupDefinition {
  id?: string;
  elementIds: string[];
  name?: string;
}

export interface DiagramDefinition {
  shapes: ShapeDefinition[];
  connectors?: ConnectorDefinition[];
  groups?: GroupDefinition[];
  layout?: LayoutDirection;
  startX?: number;
  startY?: number;
  spacingX?: number;
  spacingY?: number;
}

export interface CanvasElementSummary {
  id: string;
  type: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  groupIds?: readonly string[];
  containerId?: string | null;
}

export interface ConnectorSummary {
  id: string;
  sourceId?: string | null;
  sourceLabel?: string;
  targetId?: string | null;
  targetLabel?: string;
  label?: string;
}

export interface CanvasSummary {
  sessionId: string;
  totalElements: number;
  shapeCounts: Record<string, number>;
  shapes: CanvasElementSummary[];
  connectors: ConnectorSummary[];
  groups: { groupId: string; elementIds: string[] }[];
}
