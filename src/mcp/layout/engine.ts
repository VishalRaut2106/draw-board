import type { LayoutDirection } from '../types/canvas';

export interface LayoutNode {
  id: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
}

export interface LayoutEdge {
  sourceId: string;
  targetId: string;
}

export interface LayoutOptions {
  direction?: LayoutDirection;
  startX?: number;
  startY?: number;
  spacingX?: number;
  spacingY?: number;
}

export interface LayoutResult {
  nodes: Array<{ id: string; x: number; y: number; width: number; height: number }>;
}

export function computeDiagramLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[] = [],
  options: LayoutOptions = {}
): LayoutResult {
  if (nodes.length === 0) {
    return { nodes: [] };
  }

  const direction = options.direction ?? 'left-to-right';
  const startX = options.startX ?? 100;
  const startY = options.startY ?? 100;
  const spacingX = options.spacingX ?? 100;
  const spacingY = options.spacingY ?? 80;

  const nodeMap = new Map<string, LayoutNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, {
      ...node,
      width: node.width || 160,
      height: node.height || 80,
    });
  }

  // Filter edges to only those connecting existing nodes
  const validEdges = edges.filter(
    (e) => nodeMap.has(e.sourceId) && nodeMap.has(e.targetId)
  );

  if (direction === 'grid') {
    return computeGridLayout(nodes, nodeMap, startX, startY, spacingX, spacingY);
  }

  // Layered / hierarchical assignment
  // Compute in-degree
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of validEdges) {
    inDegree.set(edge.targetId, (inDegree.get(edge.targetId) || 0) + 1);
    adj.get(edge.sourceId)?.push(edge.targetId);
  }

  // Assign layers (ranks)
  const rank = new Map<string, number>();
  const visited = new Set<string>();

  // Queue roots (in-degree == 0)
  const roots: string[] = [];
  for (const node of nodes) {
    if ((inDegree.get(node.id) || 0) === 0) {
      roots.push(node.id);
    }
  }

  // If there is a cycle and no zero-in-degree nodes, pick the first node
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0].id);
  }

  // Assign ranks via BFS / longest path
  for (const root of roots) {
    rank.set(root, 0);
  }

  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift()!;
    visited.add(current);
    const currentRank = rank.get(current) ?? 0;
    const neighbors = adj.get(current) || [];

    for (const n of neighbors) {
      const existingRank = rank.get(n);
      const nextRank = currentRank + 1;
      if (existingRank === undefined || nextRank > existingRank) {
        rank.set(n, nextRank);
      }
      if (!visited.has(n)) {
        queue.push(n);
      }
    }
  }

  // Assign any remaining unvisited nodes
  for (const node of nodes) {
    if (!rank.has(node.id)) {
      rank.set(node.id, 0);
    }
  }

  // Group nodes by rank
  const layers = new Map<number, string[]>();
  for (const [id, r] of rank.entries()) {
    if (!layers.has(r)) {
      layers.set(r, []);
    }
    layers.get(r)!.push(id);
  }

  const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b);

  if (direction === 'left-to-right' || direction === 'hierarchical') {
    return layoutLeftToRight(sortedLayerKeys, layers, nodeMap, startX, startY, spacingX, spacingY);
  } else {
    // top-to-bottom
    return layoutTopToBottom(sortedLayerKeys, layers, nodeMap, startX, startY, spacingX, spacingY);
  }
}

function layoutLeftToRight(
  layerKeys: number[],
  layers: Map<number, string[]>,
  nodeMap: Map<string, LayoutNode>,
  startX: number,
  startY: number,
  spacingX: number,
  spacingY: number
): LayoutResult {
  const result: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];

  // Find max layer height to center vertically
  let maxColumnHeight = 0;
  for (const key of layerKeys) {
    const ids = layers.get(key) || [];
    let colH = 0;
    for (let i = 0; i < ids.length; i++) {
      const n = nodeMap.get(ids[i])!;
      colH += n.height + (i > 0 ? spacingY : 0);
    }
    if (colH > maxColumnHeight) {
      maxColumnHeight = colH;
    }
  }

  let currentX = startX;

  for (const key of layerKeys) {
    const ids = layers.get(key) || [];
    let maxWidthInCol = 0;

    let colH = 0;
    for (let i = 0; i < ids.length; i++) {
      const n = nodeMap.get(ids[i])!;
      colH += n.height + (i > 0 ? spacingY : 0);
      if (n.width > maxWidthInCol) maxWidthInCol = n.width;
    }

    // Center this column relative to the tallest column
    const verticalOffset = (maxColumnHeight - colH) / 2;
    let currentY = startY + verticalOffset;

    for (const id of ids) {
      const n = nodeMap.get(id)!;
      result.push({
        id,
        x: Math.round(currentX),
        y: Math.round(currentY),
        width: n.width,
        height: n.height,
      });
      currentY += n.height + spacingY;
    }

    currentX += maxWidthInCol + spacingX;
  }

  return { nodes: result };
}

function layoutTopToBottom(
  layerKeys: number[],
  layers: Map<number, string[]>,
  nodeMap: Map<string, LayoutNode>,
  startX: number,
  startY: number,
  spacingX: number,
  spacingY: number
): LayoutResult {
  const result: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];

  // Find max row width to center horizontally
  let maxRowWidth = 0;
  for (const key of layerKeys) {
    const ids = layers.get(key) || [];
    let rowW = 0;
    for (let i = 0; i < ids.length; i++) {
      const n = nodeMap.get(ids[i])!;
      rowW += n.width + (i > 0 ? spacingX : 0);
    }
    if (rowW > maxRowWidth) {
      maxRowWidth = rowW;
    }
  }

  let currentY = startY;

  for (const key of layerKeys) {
    const ids = layers.get(key) || [];
    let maxHeightInRow = 0;

    let rowW = 0;
    for (let i = 0; i < ids.length; i++) {
      const n = nodeMap.get(ids[i])!;
      rowW += n.width + (i > 0 ? spacingX : 0);
      if (n.height > maxHeightInRow) maxHeightInRow = n.height;
    }

    // Center this row relative to widest row
    const horizontalOffset = (maxRowWidth - rowW) / 2;
    let currentX = startX + horizontalOffset;

    for (const id of ids) {
      const n = nodeMap.get(id)!;
      result.push({
        id,
        x: Math.round(currentX),
        y: Math.round(currentY),
        width: n.width,
        height: n.height,
      });
      currentX += n.width + spacingX;
    }

    currentY += maxHeightInRow + spacingY;
  }

  return { nodes: result };
}

function computeGridLayout(
  nodes: LayoutNode[],
  nodeMap: Map<string, LayoutNode>,
  startX: number,
  startY: number,
  spacingX: number,
  spacingY: number
): LayoutResult {
  const result: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];
  const cols = Math.ceil(Math.sqrt(nodes.length));

  let maxW = 0;
  let maxH = 0;
  for (const n of nodes) {
    if ((n.width || 160) > maxW) maxW = n.width || 160;
    if ((n.height || 80) > maxH) maxH = n.height || 80;
  }

  for (let i = 0; i < nodes.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const n = nodeMap.get(nodes[i].id)!;
    const x = startX + col * (maxW + spacingX);
    const y = startY + row * (maxH + spacingY);

    result.push({
      id: n.id,
      x: Math.round(x),
      y: Math.round(y),
      width: n.width,
      height: n.height,
    });
  }

  return { nodes: result };
}
