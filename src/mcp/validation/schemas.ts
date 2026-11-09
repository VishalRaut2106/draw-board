import { z } from 'zod';

export const ShapeTypeEnum = z.enum(['rectangle', 'ellipse', 'diamond']);
export const FillStyleEnum = z.enum(['hachure', 'cross-hatch', 'solid', 'zigzag']);
export const StrokeStyleEnum = z.enum(['solid', 'dashed', 'dotted']);
export const ArrowheadEnum = z.enum(['arrow', 'bar', 'dot']).nullable();
export const LayoutDirectionEnum = z.enum(['left-to-right', 'top-to-bottom', 'hierarchical', 'grid']);

export const GetCanvasStateSchema = z.object({
  sessionId: z.string().optional().describe('Optional canvas session ID'),
  limit: z.number().int().positive().max(500).optional().describe('Maximum number of elements to return'),
  includeDeleted: z.boolean().optional().default(false).describe('Whether to include deleted elements'),
});

export const GetCanvasSummarySchema = z.object({
  sessionId: z.string().optional().describe('Optional canvas session ID'),
});

export const ShapeLabelSchema = z.union([
  z.string(),
  z.object({
    text: z.string(),
    fontSize: z.number().positive().max(120).optional(),
    textAlign: z.enum(['left', 'center', 'right']).optional(),
    verticalAlign: z.enum(['top', 'middle', 'bottom']).optional(),
  }),
]);

export const CreateShapeSchema = z.object({
  type: ShapeTypeEnum.describe('The shape type: rectangle, ellipse, or diamond'),
  id: z.string().optional().describe('Optional custom element ID (auto-generated if omitted)'),
  x: z.number().optional().describe('X coordinate on the canvas (defaults to viewport center or auto-layout)'),
  y: z.number().optional().describe('Y coordinate on the canvas (defaults to viewport center or auto-layout)'),
  width: z.number().positive().max(5000).optional().default(160).describe('Width of the shape in pixels'),
  height: z.number().positive().max(5000).optional().default(80).describe('Height of the shape in pixels'),
  label: ShapeLabelSchema.optional().describe('Text label to embed inside the shape'),
  backgroundColor: z.string().optional().describe('Background/fill color (e.g. #1e1e1e, #1e293b, #3b82f6)'),
  strokeColor: z.string().optional().describe('Border stroke color (e.g. #60a5fa, #e2e8f0, #10b981)'),
  strokeWidth: z.number().min(0.5).max(20).optional().describe('Border width in pixels'),
  strokeStyle: StrokeStyleEnum.optional().describe('Border stroke style: solid, dashed, or dotted'),
  fillStyle: FillStyleEnum.optional().describe('Fill style: solid, hachure, cross-hatch, or zigzag'),
  roundness: z.union([z.boolean(), z.object({ type: z.number(), value: z.number().optional() })]).optional().describe('Corner roundness'),
  roughness: z.number().min(0).max(3).optional().describe('Roughness for hand-drawn sketch style (0 = clean, 1-2 = hand-drawn)'),
  opacity: z.number().min(0).max(100).optional().describe('Opacity from 0 to 100'),
  groupIds: z.array(z.string()).optional().describe('Optional array of group IDs this shape belongs to'),
  customData: z.record(z.string(), z.unknown()).optional().describe('Optional custom metadata attached to the shape'),
  sessionId: z.string().optional().describe('Target session ID if multiple boards are open'),
});

export const CreateTextSchema = z.object({
  id: z.string().optional().describe('Optional custom element ID'),
  text: z.string().min(1).describe('The text string to display'),
  x: z.number().describe('X coordinate on the canvas'),
  y: z.number().describe('Y coordinate on the canvas'),
  fontSize: z.number().positive().max(120).optional().default(20).describe('Font size in pixels'),
  fontFamily: z.number().int().min(1).max(3).optional().default(1).describe('Font family: 1 = hand-drawn Virgil, 2 = clean Helvetica, 3 = Monospace'),
  textAlign: z.enum(['left', 'center', 'right']).optional().default('left').describe('Horizontal text alignment'),
  strokeColor: z.string().optional().describe('Text font color'),
  groupIds: z.array(z.string()).optional().describe('Optional array of group IDs'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const UpdateShapeSchema = z.object({
  id: z.string().min(1).describe('ID of the element to update'),
  label: z.string().optional().describe('New text label for the shape'),
  x: z.number().optional().describe('New X coordinate'),
  y: z.number().optional().describe('New Y coordinate'),
  width: z.number().positive().max(5000).optional().describe('New width'),
  height: z.number().positive().max(5000).optional().describe('New height'),
  backgroundColor: z.string().optional().describe('New background color'),
  strokeColor: z.string().optional().describe('New stroke color'),
  strokeWidth: z.number().min(0.5).max(20).optional().describe('New stroke width'),
  strokeStyle: StrokeStyleEnum.optional().describe('New stroke style'),
  fillStyle: FillStyleEnum.optional().describe('New fill style'),
  opacity: z.number().min(0).max(100).optional().describe('New opacity'),
  locked: z.boolean().optional().describe('Lock/unlock element'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const DeleteShapeSchema = z.object({
  id: z.string().min(1).describe('ID of the shape/element to delete'),
  deleteConnectedConnectors: z.boolean().optional().default(true).describe('Whether to also delete connected connector arrows (prevents dangling arrows)'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const DuplicateShapeSchema = z.object({
  id: z.string().min(1).describe('ID of the shape to duplicate'),
  offset: z.object({
    x: z.number().default(40),
    y: z.number().default(40),
  }).optional().default({ x: 40, y: 40 }).describe('Pixel offset from original shape'),
  newLabel: z.string().optional().describe('Optional new label for duplicated shape'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const ConnectShapesSchema = z.object({
  id: z.string().optional().describe('Optional custom ID for the connector arrow'),
  sourceId: z.string().min(1).describe('ID of the origin shape'),
  targetId: z.string().min(1).describe('ID of the destination shape'),
  label: z.string().optional().describe('Optional text label along the arrow'),
  startArrowhead: ArrowheadEnum.optional().default(null).describe('Arrowhead at start: arrow, bar, dot, or null'),
  endArrowhead: ArrowheadEnum.optional().default('arrow').describe('Arrowhead at end: arrow, bar, dot, or null'),
  strokeColor: z.string().optional().describe('Arrow line color'),
  strokeWidth: z.number().min(0.5).max(20).optional().describe('Arrow line width'),
  strokeStyle: StrokeStyleEnum.optional().default('solid').describe('Arrow stroke style: solid, dashed, or dotted'),
  routing: z.enum(['straight', 'curved', 'orthogonal']).optional().default('straight').describe('Arrow routing style'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const UpdateConnectorSchema = z.object({
  id: z.string().min(1).describe('ID of the connector arrow to update'),
  label: z.string().optional().describe('New or updated arrow label'),
  sourceId: z.string().optional().describe('Re-bind start to this shape ID'),
  targetId: z.string().optional().describe('Re-bind end to this shape ID'),
  startArrowhead: ArrowheadEnum.optional().describe('Start arrowhead'),
  endArrowhead: ArrowheadEnum.optional().describe('End arrowhead'),
  strokeColor: z.string().optional().describe('Arrow color'),
  strokeWidth: z.number().optional().describe('Arrow width'),
  strokeStyle: StrokeStyleEnum.optional().describe('Arrow stroke style'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const DeleteConnectorSchema = z.object({
  id: z.string().min(1).describe('ID of the connector arrow to delete'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const GroupElementsSchema = z.object({
  elementIds: z.array(z.string().min(1)).min(2).describe('Array of at least 2 element IDs to group together'),
  groupId: z.string().optional().describe('Optional custom group ID (auto-generated if omitted)'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const ArrangeDiagramSchema = z.object({
  direction: LayoutDirectionEnum.optional().default('left-to-right').describe('Layout direction: left-to-right, top-to-bottom, hierarchical, or grid'),
  elementIds: z.array(z.string()).optional().describe('Optional subset of element IDs to arrange (if omitted, arranges all canvas elements)'),
  spacingX: z.number().min(20).max(1000).optional().default(100).describe('Horizontal spacing between columns/elements'),
  spacingY: z.number().min(20).max(1000).optional().default(80).describe('Vertical spacing between rows/elements'),
  startX: z.number().optional().describe('Starting X coordinate (defaults to current minimum X)'),
  startY: z.number().optional().describe('Starting Y coordinate (defaults to current minimum Y)'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const MoveElementsSchema = z.object({
  elementIds: z.array(z.string().min(1)).min(1).describe('Array of element IDs to translate'),
  deltaX: z.number().describe('Distance to move in X direction (pixels)'),
  deltaY: z.number().describe('Distance to move in Y direction (pixels)'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const ClearCanvasSchema = z.object({
  confirm: z.boolean().refine((val) => val === true, {
    message: 'Destructive operation safeguard: you must set confirm: true to clear the canvas',
  }).describe('Must explicitly pass true to confirm clearing the whiteboard canvas'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const UndoLastOperationSchema = z.object({
  sessionId: z.string().optional().describe('Target session ID'),
});

export const ExportDiagramSchema = z.object({
  format: z.enum(['svg', 'png', 'json']).optional().default('svg').describe('Export format: svg, png (base64 data URL), or json'),
  sessionId: z.string().optional().describe('Target session ID'),
});

export const SingleShapeDefinitionSchema = z.object({
  id: z.string().optional(),
  type: ShapeTypeEnum.default('rectangle'),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().max(5000).optional().default(160),
  height: z.number().positive().max(5000).optional().default(80),
  label: ShapeLabelSchema.optional(),
  backgroundColor: z.string().optional(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().min(0.5).max(20).optional(),
  strokeStyle: StrokeStyleEnum.optional(),
  fillStyle: FillStyleEnum.optional(),
  roundness: z.union([z.boolean(), z.object({ type: z.number(), value: z.number().optional() })]).optional(),
  roughness: z.number().min(0).max(3).optional(),
  opacity: z.number().min(0).max(100).optional(),
  groupIds: z.array(z.string()).optional(),
});

export const SingleConnectorDefinitionSchema = z.object({
  id: z.string().optional(),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  label: z.string().optional(),
  startArrowhead: ArrowheadEnum.optional().default(null),
  endArrowhead: ArrowheadEnum.optional().default('arrow'),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().optional(),
  strokeStyle: StrokeStyleEnum.optional(),
  routing: z.enum(['straight', 'curved', 'orthogonal']).optional(),
});

export const CreateDiagramSchema = z.object({
  shapes: z.array(SingleShapeDefinitionSchema).min(1).describe('Array of shape definitions to create'),
  connectors: z.array(SingleConnectorDefinitionSchema).optional().describe('Array of connector arrows linking the shapes'),
  layout: z.enum(['left-to-right', 'top-to-bottom', 'hierarchical', 'grid', 'none']).optional().default('left-to-right').describe('Auto-layout mode: left-to-right, top-to-bottom, hierarchical, grid, or none'),
  startX: z.number().optional().default(100).describe('Starting X coordinate for layout'),
  startY: z.number().optional().default(100).describe('Starting Y coordinate for layout'),
  spacingX: z.number().optional().default(100).describe('Horizontal spacing between shapes'),
  spacingY: z.number().optional().default(80).describe('Vertical spacing between shapes'),
  groups: z.array(z.object({
    id: z.string().optional(),
    elementIds: z.array(z.string()),
    name: z.string().optional(),
  })).optional().describe('Logical groups of elements'),
  sessionId: z.string().optional().describe('Target session ID'),
});
