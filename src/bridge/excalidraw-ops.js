import {
  convertToExcalidrawElements,
  exportToSvg,
  serializeAsJSON,
} from '@excalidraw/excalidraw';
import { computeDiagramLayout } from '../mcp/layout/engine';

// Stack for reliable AI operation undoing
const aiHistoryStack = [];

export function recordHistorySnapshot(excalidrawAPI, operationName) {
  const elements = excalidrawAPI.getSceneElementsIncludingDeleted();
  aiHistoryStack.push({
    operation: operationName,
    elements: JSON.parse(JSON.stringify(elements)),
    timestamp: Date.now(),
  });
  if (aiHistoryStack.length > 30) {
    aiHistoryStack.shift();
  }
}

/**
 * Helper to extract text from an element or its bound text element
 */
function getElementLabel(element, allElements) {
  if (element.text) return element.text;
  if (element.boundElements) {
    for (const bound of element.boundElements) {
      if (bound.type === 'text') {
        const textEl = allElements.find((e) => e.id === bound.id && !e.isDeleted);
        if (textEl && textEl.text) return textEl.text;
      }
    }
  }
  return '';
}

export function executeCanvasOperation(excalidrawAPI, operation, params = {}) {
  switch (operation) {
    case 'GET_STATE':
      return handleGetState(excalidrawAPI, params);
    case 'GET_SUMMARY':
      return handleGetSummary(excalidrawAPI, params);
    case 'CREATE_SHAPE':
      return handleCreateShape(excalidrawAPI, params);
    case 'CREATE_TEXT':
      return handleCreateText(excalidrawAPI, params);
    case 'UPDATE_SHAPE':
      return handleUpdateShape(excalidrawAPI, params);
    case 'DELETE_SHAPE':
      return handleDeleteShape(excalidrawAPI, params);
    case 'DUPLICATE_SHAPE':
      return handleDuplicateShape(excalidrawAPI, params);
    case 'CONNECT_SHAPES':
      return handleConnectShapes(excalidrawAPI, params);
    case 'UPDATE_CONNECTOR':
      return handleUpdateConnector(excalidrawAPI, params);
    case 'DELETE_CONNECTOR':
      return handleDeleteConnector(excalidrawAPI, params);
    case 'GROUP_ELEMENTS':
      return handleGroupElements(excalidrawAPI, params);
    case 'ARRANGE_DIAGRAM':
      return handleArrangeDiagram(excalidrawAPI, params);
    case 'MOVE_ELEMENTS':
      return handleMoveElements(excalidrawAPI, params);
    case 'CLEAR_CANVAS':
      return handleClearCanvas(excalidrawAPI, params);
    case 'UNDO_LAST':
      return handleUndoLast(excalidrawAPI, params);
    case 'EXPORT_DIAGRAM':
      return handleExportDiagram(excalidrawAPI, params);
    case 'CREATE_DIAGRAM':
      return handleCreateDiagram(excalidrawAPI, params);
    default:
      throw new Error(`Unsupported canvas operation: "${operation}"`);
  }
}

function handleGetState(excalidrawAPI, params) {
  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const elements = params.includeDeleted ? allElements : allElements.filter((e) => !e.isDeleted);
  const appState = excalidrawAPI.getAppState();

  const limitedElements = params.limit ? elements.slice(0, params.limit) : elements;

  return {
    sessionId: params.sessionId || 'slate-active-session',
    totalElements: elements.length,
    returnedElements: limitedElements.length,
    appState: {
      zoom: appState.zoom.value,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      viewBackgroundColor: appState.viewBackgroundColor,
      theme: appState.theme,
    },
    elements: limitedElements.map((e) => ({
      id: e.id,
      type: e.type,
      x: e.x,
      y: e.y,
      width: e.width,
      height: e.height,
      label: getElementLabel(e, allElements),
      backgroundColor: e.backgroundColor,
      strokeColor: e.strokeColor,
      strokeWidth: e.strokeWidth,
      strokeStyle: e.strokeStyle,
      fillStyle: e.fillStyle,
      roundness: e.roundness,
      roughness: e.roughness,
      opacity: e.opacity,
      groupIds: e.groupIds,
      boundElements: e.boundElements,
      containerId: e.containerId,
      startBinding: e.startBinding,
      endBinding: e.endBinding,
      isDeleted: e.isDeleted,
    })),
  };
}

function handleGetSummary(excalidrawAPI, params) {
  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const activeElements = allElements.filter((e) => !e.isDeleted);

  const shapeCounts = {};
  const shapes = [];
  const connectors = [];
  const groupMap = new Map();

  for (const el of activeElements) {
    shapeCounts[el.type] = (shapeCounts[el.type] || 0) + 1;

    if (['rectangle', 'ellipse', 'diamond'].includes(el.type)) {
      shapes.push({
        id: el.id,
        type: el.type,
        label: getElementLabel(el, allElements),
        x: Math.round(el.x),
        y: Math.round(el.y),
        width: Math.round(el.width),
        height: Math.round(el.height),
        groupIds: el.groupIds,
      });
    } else if (el.type === 'arrow' || el.type === 'line') {
      const sourceId = el.startBinding?.elementId || el.customData?.sourceId || null;
      const targetId = el.endBinding?.elementId || el.customData?.targetId || null;
      const sourceEl = sourceId ? activeElements.find((e) => e.id === sourceId) : null;
      const targetEl = targetId ? activeElements.find((e) => e.id === targetId) : null;

      connectors.push({
        id: el.id,
        sourceId,
        sourceLabel: sourceEl ? getElementLabel(sourceEl, allElements) : undefined,
        targetId,
        targetLabel: targetEl ? getElementLabel(targetEl, allElements) : undefined,
        label: getElementLabel(el, allElements),
      });
    }

    if (el.groupIds && el.groupIds.length > 0) {
      for (const gid of el.groupIds) {
        if (!groupMap.has(gid)) groupMap.set(gid, []);
        groupMap.get(gid).push(el.id);
      }
    }
  }

  return {
    sessionId: params.sessionId || 'slate-active-session',
    totalElements: activeElements.length,
    shapeCounts,
    shapes,
    connectors,
    groups: Array.from(groupMap.entries()).map(([groupId, elementIds]) => ({
      groupId,
      elementIds,
    })),
  };
}

function handleCreateShape(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'CREATE_SHAPE');

  const appState = excalidrawAPI.getAppState();
  const currentElements = excalidrawAPI.getSceneElementsIncludingDeleted();

  const shapeId = params.id || `shape_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const x = params.x ?? Math.round(-appState.scrollX + window.innerWidth / 2 - 80);
  const y = params.y ?? Math.round(-appState.scrollY + window.innerHeight / 2 - 40);
  const width = params.width || 160;
  const height = params.height || 80;

  const skeleton = {
    id: shapeId,
    type: params.type || 'rectangle',
    x,
    y,
    width,
    height,
    backgroundColor: params.backgroundColor || '#1e1e1e',
    strokeColor: params.strokeColor || '#60a5fa',
    strokeWidth: params.strokeWidth ?? 2,
    strokeStyle: params.strokeStyle || 'solid',
    fillStyle: params.fillStyle || 'solid',
    roundness: params.roundness !== undefined ? (params.roundness === true ? { type: 3 } : params.roundness) : { type: 3 },
    roughness: params.roughness ?? 1,
    opacity: params.opacity ?? 100,
    groupIds: params.groupIds || [],
  };

  if (params.label) {
    skeleton.label = typeof params.label === 'string'
      ? { text: params.label, textAlign: 'center', verticalAlign: 'middle', fontSize: 18 }
      : params.label;
  }

  const newElements = convertToExcalidrawElements([skeleton], { regenerateIds: false });

  // Merge into scene
  const updatedSceneElements = [...currentElements, ...newElements];
  excalidrawAPI.updateScene({ elements: updatedSceneElements, commitToHistory: true });

  const createdShape = newElements.find((e) => e.id === shapeId) || newElements[0];
  const labelText = params.label ? (typeof params.label === 'string' ? params.label : params.label.text) : '';

  return {
    success: true,
    elementId: shapeId,
    shape: {
      id: shapeId,
      type: createdShape.type,
      x: createdShape.x,
      y: createdShape.y,
      width: createdShape.width,
      height: createdShape.height,
      label: labelText,
      backgroundColor: createdShape.backgroundColor,
      strokeColor: createdShape.strokeColor,
    },
  };
}

function handleCreateText(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'CREATE_TEXT');

  const currentElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const textId = params.id || `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const skeleton = {
    id: textId,
    type: 'text',
    text: params.text,
    x: params.x,
    y: params.y,
    fontSize: params.fontSize || 20,
    fontFamily: params.fontFamily || 1,
    textAlign: params.textAlign || 'left',
    strokeColor: params.strokeColor || '#f8fafc',
    groupIds: params.groupIds || [],
  };

  const newElements = convertToExcalidrawElements([skeleton], { regenerateIds: false });
  const updatedSceneElements = [...currentElements, ...newElements];
  excalidrawAPI.updateScene({ elements: updatedSceneElements, commitToHistory: true });

  return {
    success: true,
    elementId: textId,
    text: params.text,
    x: params.x,
    y: params.y,
  };
}

function handleUpdateShape(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'UPDATE_SHAPE');

  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const targetIndex = allElements.findIndex((e) => e.id === params.id && !e.isDeleted);

  if (targetIndex === -1) {
    throw new Error(`Shape with ID "${params.id}" not found on the canvas.`);
  }

  const target = allElements[targetIndex];
  const deltaX = params.x !== undefined ? params.x - target.x : 0;
  const deltaY = params.y !== undefined ? params.y - target.y : 0;

  // Clone elements array
  const updatedElements = allElements.map((el) => {
    if (el.id === params.id) {
      const updated = { ...el, version: el.version + 1, updated: Date.now() };
      if (params.x !== undefined) updated.x = params.x;
      if (params.y !== undefined) updated.y = params.y;
      if (params.width !== undefined) updated.width = params.width;
      if (params.height !== undefined) updated.height = params.height;
      if (params.backgroundColor !== undefined) updated.backgroundColor = params.backgroundColor;
      if (params.strokeColor !== undefined) updated.strokeColor = params.strokeColor;
      if (params.strokeWidth !== undefined) updated.strokeWidth = params.strokeWidth;
      if (params.strokeStyle !== undefined) updated.strokeStyle = params.strokeStyle;
      if (params.fillStyle !== undefined) updated.fillStyle = params.fillStyle;
      if (params.opacity !== undefined) updated.opacity = params.opacity;
      if (params.locked !== undefined) updated.locked = params.locked;
      return updated;
    }

    // If bound text and container moved, shift text
    if (el.containerId === params.id && (deltaX !== 0 || deltaY !== 0)) {
      return {
        ...el,
        x: el.x + deltaX,
        y: el.y + deltaY,
        version: el.version + 1,
        updated: Date.now(),
      };
    }

    return el;
  });

  // If label changed, update bound text or create it
  if (params.label !== undefined) {
    const boundTextIndex = updatedElements.findIndex(
      (e) => e.containerId === params.id && !e.isDeleted
    );
    if (boundTextIndex !== -1) {
      updatedElements[boundTextIndex] = {
        ...updatedElements[boundTextIndex],
        text: params.label,
        originalText: params.label,
        version: updatedElements[boundTextIndex].version + 1,
        updated: Date.now(),
      };
    } else {
      // Create new bound text
      const shape = updatedElements.find((e) => e.id === params.id);
      const textSkeleton = convertToExcalidrawElements(
        [
          {
            type: 'text',
            text: params.label,
            x: shape.x + shape.width / 2,
            y: shape.y + shape.height / 2,
            containerId: shape.id,
            textAlign: 'center',
            verticalAlign: 'middle',
            fontSize: 18,
            strokeColor: shape.strokeColor,
          },
        ],
        { regenerateIds: false }
      );
      if (textSkeleton.length > 0) {
        const textEl = textSkeleton[0];
        updatedElements.push(textEl);
        // Link to shape boundElements
        const shapeIdx = updatedElements.findIndex((e) => e.id === params.id);
        const existingBounds = updatedElements[shapeIdx].boundElements || [];
        updatedElements[shapeIdx] = {
          ...updatedElements[shapeIdx],
          boundElements: [...existingBounds, { id: textEl.id, type: 'text' }],
        };
      }
    }
  }

  excalidrawAPI.updateScene({ elements: updatedElements, commitToHistory: true });

  const finalShape = updatedElements.find((e) => e.id === params.id);
  return {
    success: true,
    elementId: params.id,
    shape: {
      id: finalShape.id,
      x: finalShape.x,
      y: finalShape.y,
      width: finalShape.width,
      height: finalShape.height,
      label: getElementLabel(finalShape, updatedElements),
    },
  };
}

function handleDeleteShape(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'DELETE_SHAPE');

  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const target = allElements.find((e) => e.id === params.id && !e.isDeleted);

  if (!target) {
    throw new Error(`Shape with ID "${params.id}" not found on the canvas.`);
  }

  const deleteConnectors = params.deleteConnectedConnectors !== false;
  const deletedConnectorIds = [];

  const updatedElements = allElements.map((el) => {
    // Delete target shape
    if (el.id === params.id) {
      return { ...el, isDeleted: true, version: el.version + 1, updated: Date.now() };
    }

    // Delete bound text
    if (el.containerId === params.id) {
      return { ...el, isDeleted: true, version: el.version + 1, updated: Date.now() };
    }

    // Delete bound connectors if requested
    if (deleteConnectors && (el.type === 'arrow' || el.type === 'line')) {
      if (el.startBinding?.elementId === params.id || el.endBinding?.elementId === params.id) {
        deletedConnectorIds.push(el.id);
        return { ...el, isDeleted: true, version: el.version + 1, updated: Date.now() };
      }
    }

    return el;
  });

  excalidrawAPI.updateScene({ elements: updatedElements, commitToHistory: true });

  return {
    success: true,
    deletedId: params.id,
    deletedConnectors: deletedConnectorIds,
  };
}

function handleDuplicateShape(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'DUPLICATE_SHAPE');

  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const original = allElements.find((e) => e.id === params.id && !e.isDeleted);

  if (!original) {
    throw new Error(`Shape with ID "${params.id}" not found.`);
  }

  const offset = params.offset || { x: 40, y: 40 };
  const newId = `shape_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const labelText = params.newLabel !== undefined ? params.newLabel : getElementLabel(original, allElements);

  const skeleton = {
    id: newId,
    type: original.type,
    x: original.x + (offset.x || 40),
    y: original.y + (offset.y || 40),
    width: original.width,
    height: original.height,
    backgroundColor: original.backgroundColor,
    strokeColor: original.strokeColor,
    strokeWidth: original.strokeWidth,
    strokeStyle: original.strokeStyle,
    fillStyle: original.fillStyle,
    roundness: original.roundness,
    roughness: original.roughness,
    opacity: original.opacity,
    label: labelText ? { text: labelText, textAlign: 'center', verticalAlign: 'middle', fontSize: 18 } : undefined,
  };

  const newElements = convertToExcalidrawElements([skeleton], { regenerateIds: false });
  excalidrawAPI.updateScene({ elements: [...allElements, ...newElements], commitToHistory: true });

  return {
    success: true,
    originalId: params.id,
    newId,
    shape: {
      id: newId,
      x: skeleton.x,
      y: skeleton.y,
      width: skeleton.width,
      height: skeleton.height,
      label: labelText,
    },
  };
}

function handleConnectShapes(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'CONNECT_SHAPES');

  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const source = allElements.find((e) => e.id === params.sourceId && !e.isDeleted);
  const target = allElements.find((e) => e.id === params.targetId && !e.isDeleted);

  if (!source) throw new Error(`Source shape with ID "${params.sourceId}" not found.`);
  if (!target) throw new Error(`Target shape with ID "${params.targetId}" not found.`);

  const arrowId = params.id || `arrow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const sourceCx = source.x + source.width / 2;
  const sourceCy = source.y + source.height / 2;
  const targetCx = target.x + target.width / 2;
  const targetCy = target.y + target.height / 2;

  const dxTotal = targetCx - sourceCx;
  const dyTotal = targetCy - sourceCy;

  let startX, startY, endX, endY;

  // Determine dominant orientation
  if (Math.abs(dyTotal) > Math.abs(dxTotal) * 1.2) {
    // Primarily vertical connection
    if (dyTotal > 0) {
      // Target is below source
      startX = sourceCx;
      startY = source.y + source.height;
      endX = targetCx;
      endY = target.y;
    } else {
      // Target is above source
      startX = sourceCx;
      startY = source.y;
      endX = targetCx;
      endY = target.y + target.height;
    }
  } else {
    // Primarily horizontal connection
    if (dxTotal > 0) {
      // Target is to the right
      startX = source.x + source.width;
      startY = sourceCy;
      endX = target.x;
      endY = targetCy;
    } else {
      // Target is to the left
      startX = source.x;
      startY = sourceCy;
      endX = target.x + target.width;
      endY = targetCy;
    }
  }

  const dx = endX - startX;
  const dy = endY - startY;

  // Convert via convertToExcalidrawElements
  const arrowSkeleton = {
    id: arrowId,
    type: 'arrow',
    x: startX,
    y: startY,
    points: [[0, 0], [dx, dy]],
    width: Math.abs(dx) || 1,
    height: Math.abs(dy) || 1,
    start: { id: source.id },
    end: { id: target.id },
    label: params.label ? { text: params.label } : undefined,
    strokeColor: params.strokeColor || '#94a3b8',
    strokeWidth: params.strokeWidth ?? 2,
    strokeStyle: params.strokeStyle || 'solid',
    startArrowhead: params.startArrowhead ?? null,
    endArrowhead: params.endArrowhead ?? 'arrow',
    roundness: params.routing === 'curved' ? { type: 2 } : { type: 1 },
    customData: { sourceId: source.id, targetId: target.id },
  };

  const createdElements = convertToExcalidrawElements([arrowSkeleton], { regenerateIds: false });

  const arrowEl = createdElements.find((e) => e.type === 'arrow') || createdElements[0];
  const realArrowId = arrowEl ? arrowEl.id : arrowId;

  // Update source and target boundElements
  const updatedElements = allElements.map((el) => {
    if (el.id === source.id || el.id === target.id) {
      const existingBounds = (el.boundElements || []).filter((b) => b.id !== realArrowId);
      return {
        ...el,
        boundElements: [...existingBounds, { id: realArrowId, type: 'arrow' }],
        version: el.version + 1,
        updated: Date.now(),
      };
    }
    return el;
  });

  const arrowElementsWithBindings = createdElements.map((el) => {
    if (el.type === 'arrow' || el.id === arrowId || el.id === realArrowId) {
      return {
        ...el,
        id: realArrowId,
        startBinding: { elementId: source.id, focus: 0, gap: 4 },
        endBinding: { elementId: target.id, focus: 0, gap: 4 },
        customData: { ...(el.customData || {}), sourceId: source.id, targetId: target.id },
      };
    }
    return el;
  });

  updatedElements.push(...arrowElementsWithBindings);
  excalidrawAPI.updateScene({ elements: updatedElements, commitToHistory: true });

  return {
    success: true,
    connectorId: realArrowId,
    sourceId: source.id,
    targetId: target.id,
    label: params.label || '',
  };
}

function handleUpdateConnector(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'UPDATE_CONNECTOR');

  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const target = allElements.find((e) => e.id === params.id && !e.isDeleted);

  if (!target || (target.type !== 'arrow' && target.type !== 'line')) {
    throw new Error(`Connector with ID "${params.id}" not found.`);
  }

  const updatedElements = allElements.map((el) => {
    if (el.id === params.id) {
      const updated = { ...el, version: el.version + 1, updated: Date.now() };
      if (params.strokeColor) updated.strokeColor = params.strokeColor;
      if (params.strokeWidth) updated.strokeWidth = params.strokeWidth;
      if (params.strokeStyle) updated.strokeStyle = params.strokeStyle;
      if (params.startArrowhead !== undefined) updated.startArrowhead = params.startArrowhead;
      if (params.endArrowhead !== undefined) updated.endArrowhead = params.endArrowhead;
      return updated;
    }
    // Update label if bound text exists
    if (params.label !== undefined && el.containerId === params.id) {
      return {
        ...el,
        text: params.label,
        originalText: params.label,
        version: el.version + 1,
        updated: Date.now(),
      };
    }
    return el;
  });

  excalidrawAPI.updateScene({ elements: updatedElements, commitToHistory: true });

  return {
    success: true,
    connectorId: params.id,
    label: params.label,
  };
}

function handleDeleteConnector(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'DELETE_CONNECTOR');

  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const target = allElements.find((e) => e.id === params.id && !e.isDeleted);

  if (!target) {
    throw new Error(`Connector with ID "${params.id}" not found.`);
  }

  const updatedElements = allElements.map((el) => {
    if (el.id === params.id || el.containerId === params.id) {
      return { ...el, isDeleted: true, version: el.version + 1, updated: Date.now() };
    }
    return el;
  });

  excalidrawAPI.updateScene({ elements: updatedElements, commitToHistory: true });

  return {
    success: true,
    deletedId: params.id,
  };
}

function handleGroupElements(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'GROUP_ELEMENTS');

  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const targetIds = new Set(params.elementIds);
  const groupId = params.groupId || `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const updatedElements = allElements.map((el) => {
    if (targetIds.has(el.id)) {
      const existing = el.groupIds || [];
      if (!existing.includes(groupId)) {
        return {
          ...el,
          groupIds: [...existing, groupId],
          version: el.version + 1,
          updated: Date.now(),
        };
      }
    }
    return el;
  });

  excalidrawAPI.updateScene({ elements: updatedElements, commitToHistory: true });

  return {
    success: true,
    groupId,
    groupedElementIds: params.elementIds,
  };
}

function handleArrangeDiagram(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'ARRANGE_DIAGRAM');

  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const activeElements = allElements.filter((e) => !e.isDeleted);

  // Filter shapes to arrange
  const targetShapes = activeElements.filter((el) => {
    if (!['rectangle', 'ellipse', 'diamond'].includes(el.type)) return false;
    if (params.elementIds && !params.elementIds.includes(el.id)) return false;
    return true;
  });

  if (targetShapes.length === 0) {
    return { success: true, message: 'No shapes to arrange', repositionedCount: 0 };
  }

  // Find connectors between target shapes
  const targetShapeIds = new Set(targetShapes.map((s) => s.id));
  const edges = activeElements
    .filter((el) => (el.type === 'arrow' || el.type === 'line') && !el.isDeleted)
    .filter((el) => {
      const src = el.startBinding?.elementId || el.customData?.sourceId;
      const dst = el.endBinding?.elementId || el.customData?.targetId;
      return src && dst && targetShapeIds.has(src) && targetShapeIds.has(dst);
    })
    .map((el) => ({
      sourceId: el.startBinding?.elementId || el.customData?.sourceId,
      targetId: el.endBinding?.elementId || el.customData?.targetId,
    }));

  const startX = params.startX ?? (targetShapes.length > 0 ? Math.min(...targetShapes.map((s) => s.x)) : 100);
  const startY = params.startY ?? (targetShapes.length > 0 ? Math.min(...targetShapes.map((s) => s.y)) : 100);

  const layoutResult = computeDiagramLayout(
    targetShapes.map((s) => ({ id: s.id, width: s.width, height: s.height })),
    edges,
    {
      direction: params.direction || 'left-to-right',
      startX,
      startY,
      spacingX: params.spacingX ?? 100,
      spacingY: params.spacingY ?? 80,
    }
  );

  const posMap = new Map(layoutResult.nodes.map((n) => [n.id, n]));
  const deltaMap = new Map();

  for (const node of layoutResult.nodes) {
    const orig = targetShapes.find((s) => s.id === node.id);
    if (orig) {
      deltaMap.set(node.id, { dx: node.x - orig.x, dy: node.y - orig.y });
    }
  }

  const updatedElements = allElements.map((el) => {
    if (posMap.has(el.id)) {
      const pos = posMap.get(el.id);
      return {
        ...el,
        x: pos.x,
        y: pos.y,
        version: el.version + 1,
        updated: Date.now(),
      };
    }

    // Shift bound text with its container
    if (el.containerId && deltaMap.has(el.containerId)) {
      const { dx, dy } = deltaMap.get(el.containerId);
      return {
        ...el,
        x: el.x + dx,
        y: el.y + dy,
        version: el.version + 1,
        updated: Date.now(),
      };
    }

    // Adjust arrow endpoints if both source and target shapes were rearranged
    if ((el.type === 'arrow' || el.type === 'line') && !el.isDeleted) {
      const srcId = el.startBinding?.elementId || el.customData?.sourceId;
      const dstId = el.endBinding?.elementId || el.customData?.targetId;
      if (srcId && dstId && posMap.has(srcId) && posMap.has(dstId)) {
        const srcPos = posMap.get(srcId);
        const dstPos = posMap.get(dstId);
        const sX = srcPos.x + srcPos.width;
        const sY = srcPos.y + srcPos.height / 2;
        const eX = dstPos.x;
        const eY = dstPos.y + dstPos.height / 2;
        const dx = eX - sX;
        const dy = eY - sY;
        return {
          ...el,
          x: sX,
          y: sY,
          points: [[0, 0], [dx, dy]],
          width: Math.abs(dx) || 1,
          height: Math.abs(dy) || 1,
          version: el.version + 1,
          updated: Date.now(),
        };
      }
    }

    return el;
  });

  excalidrawAPI.updateScene({ elements: updatedElements, commitToHistory: true });
  excalidrawAPI.scrollToContent();

  return {
    success: true,
    repositionedCount: layoutResult.nodes.length,
    direction: params.direction || 'left-to-right',
    positions: layoutResult.nodes,
  };
}

function handleMoveElements(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'MOVE_ELEMENTS');

  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const targetIds = new Set(params.elementIds);
  const dx = params.deltaX || 0;
  const dy = params.deltaY || 0;

  const updatedElements = allElements.map((el) => {
    if (targetIds.has(el.id) || (el.containerId && targetIds.has(el.containerId))) {
      return {
        ...el,
        x: el.x + dx,
        y: el.y + dy,
        version: el.version + 1,
        updated: Date.now(),
      };
    }
    return el;
  });

  excalidrawAPI.updateScene({ elements: updatedElements, commitToHistory: true });

  return {
    success: true,
    movedCount: params.elementIds.length,
    deltaX: dx,
    deltaY: dy,
  };
}

function handleClearCanvas(excalidrawAPI, params) {
  if (params.confirm !== true) {
    throw new Error('Destructive safeguard: confirm must be set to true to clear canvas.');
  }

  recordHistorySnapshot(excalidrawAPI, 'CLEAR_CANVAS');

  const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const activeCount = allElements.filter((e) => !e.isDeleted).length;

  const clearedElements = allElements.map((el) => ({
    ...el,
    isDeleted: true,
    version: el.version + 1,
    updated: Date.now(),
  }));

  excalidrawAPI.updateScene({ elements: clearedElements, commitToHistory: true });

  return {
    success: true,
    clearedCount: activeCount,
  };
}

function handleUndoLast(excalidrawAPI) {
  if (aiHistoryStack.length === 0) {
    return {
      success: false,
      message: 'No previous AI operations to undo.',
    };
  }

  const snapshot = aiHistoryStack.pop();
  excalidrawAPI.updateScene({ elements: snapshot.elements, commitToHistory: true });

  return {
    success: true,
    message: `Reverted operation "${snapshot.operation}".`,
  };
}

async function handleExportDiagram(excalidrawAPI, params) {
  const format = params.format || 'svg';
  const elements = excalidrawAPI.getSceneElements();
  const appState = excalidrawAPI.getAppState();
  const files = excalidrawAPI.getFiles();

  if (elements.length === 0) {
    throw new Error('Cannot export empty canvas.');
  }

  if (format === 'json') {
    return {
      format: 'json',
      data: serializeAsJSON(elements, appState, files, 'local'),
    };
  }

  if (format === 'svg') {
    const svgEl = await exportToSvg(elements, appState, files);
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    return {
      format: 'svg',
      data: svgString,
    };
  }

  throw new Error(`Unsupported export format "${format}". Supported formats: svg, json.`);
}

function handleCreateDiagram(excalidrawAPI, params) {
  recordHistorySnapshot(excalidrawAPI, 'CREATE_DIAGRAM');

  const currentElements = excalidrawAPI.getSceneElementsIncludingDeleted();
  const shapes = params.shapes || [];
  const connectors = params.connectors || [];

  const skeletons = [];

  // Convert shapes
  for (const s of shapes) {
    const shapeId = s.id || `shape_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const skel = {
      id: shapeId,
      type: s.type || 'rectangle',
      x: s.x ?? 100,
      y: s.y ?? 100,
      width: s.width || 160,
      height: s.height || 80,
      backgroundColor: s.backgroundColor || '#1e1e1e',
      strokeColor: s.strokeColor || '#60a5fa',
      strokeWidth: s.strokeWidth ?? 2,
      strokeStyle: s.strokeStyle || 'solid',
      fillStyle: s.fillStyle || 'solid',
      roundness: s.roundness !== undefined ? (s.roundness === true ? { type: 3 } : s.roundness) : { type: 3 },
      roughness: s.roughness ?? 1,
      opacity: s.opacity ?? 100,
      groupIds: s.groupIds || [],
    };

    if (s.label) {
      skel.label = typeof s.label === 'string'
        ? { text: s.label, textAlign: 'center', verticalAlign: 'middle', fontSize: 18 }
        : s.label;
    }

    skeletons.push(skel);
  }

  // Convert connectors
  for (const c of connectors) {
    const arrowId = c.id || `arrow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    skeletons.push({
      id: arrowId,
      type: 'arrow',
      start: { id: c.sourceId },
      end: { id: c.targetId },
      label: c.label ? { text: c.label } : undefined,
      strokeColor: c.strokeColor || '#94a3b8',
      strokeWidth: c.strokeWidth ?? 2,
      strokeStyle: c.strokeStyle || 'solid',
      startArrowhead: c.startArrowhead ?? null,
      endArrowhead: c.endArrowhead ?? 'arrow',
      roundness: { type: 2 },
    });
  }

  const newElements = convertToExcalidrawElements(skeletons, { regenerateIds: false });
  const updatedSceneElements = [...currentElements, ...newElements];

  excalidrawAPI.updateScene({ elements: updatedSceneElements, commitToHistory: true });
  excalidrawAPI.scrollToContent();

  if (excalidrawAPI.setToast) {
    excalidrawAPI.setToast({
      message: `✨ AI created ${shapes.length} shapes and ${connectors.length} connectors`,
      closable: true,
      duration: 3500,
    });
  }

  return {
    success: true,
    shapesCreated: shapes.length,
    connectorsCreated: connectors.length,
    shapeIds: shapes.map((s) => s.id),
  };
}
