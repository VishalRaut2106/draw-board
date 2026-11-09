import { describe, it, expect } from 'vitest';
import { computeDiagramLayout } from '../src/mcp/layout/engine';

describe('Diagram Layout Engine', () => {
  it('should arrange nodes in left-to-right order based on connector dependencies', () => {
    const nodes = [
      { id: 'client', width: 160, height: 80 },
      { id: 'gateway', width: 160, height: 80 },
      { id: 'backend', width: 160, height: 80 },
      { id: 'database', width: 160, height: 80 },
    ];

    const edges = [
      { sourceId: 'client', targetId: 'gateway' },
      { sourceId: 'gateway', targetId: 'backend' },
      { sourceId: 'backend', targetId: 'database' },
    ];

    const result = computeDiagramLayout(nodes, edges, {
      direction: 'left-to-right',
      startX: 100,
      startY: 100,
      spacingX: 100,
      spacingY: 80,
    });

    expect(result.nodes).toHaveLength(4);
    const client = result.nodes.find((n) => n.id === 'client')!;
    const gateway = result.nodes.find((n) => n.id === 'gateway')!;
    const backend = result.nodes.find((n) => n.id === 'backend')!;
    const database = result.nodes.find((n) => n.id === 'database')!;

    // Client should be to the left of Gateway
    expect(client.x).toBeLessThan(gateway.x);
    // Gateway should be to the left of Backend
    expect(gateway.x).toBeLessThan(backend.x);
    // Backend should be to the left of Database
    expect(backend.x).toBeLessThan(database.x);

    // X separation should respect width + spacingX
    expect(gateway.x - client.x).toBeGreaterThanOrEqual(160 + 100);
    expect(backend.x - gateway.x).toBeGreaterThanOrEqual(160 + 100);
    expect(database.x - backend.x).toBeGreaterThanOrEqual(160 + 100);
  });

  it('should arrange branching nodes in columns without vertical overlap', () => {
    const nodes = [
      { id: 'gateway', width: 160, height: 80 },
      { id: 'auth_service', width: 160, height: 80 },
      { id: 'product_service', width: 160, height: 80 },
    ];

    const edges = [
      { sourceId: 'gateway', targetId: 'auth_service' },
      { sourceId: 'gateway', targetId: 'product_service' },
    ];

    const result = computeDiagramLayout(nodes, edges, {
      direction: 'left-to-right',
      startX: 100,
      startY: 100,
      spacingX: 100,
      spacingY: 80,
    });

    const auth = result.nodes.find((n) => n.id === 'auth_service')!;
    const product = result.nodes.find((n) => n.id === 'product_service')!;

    // Both should be in the second column
    expect(auth.x).toBe(product.x);
    // One should be placed above the other with at least spacingY gap
    const verticalGap = Math.abs(auth.y - product.y);
    expect(verticalGap).toBeGreaterThanOrEqual(80 + 80);
  });

  it('should arrange nodes top-to-bottom', () => {
    const nodes = [
      { id: 'step1', width: 160, height: 80 },
      { id: 'step2', width: 160, height: 80 },
    ];

    const edges = [{ sourceId: 'step1', targetId: 'step2' }];

    const result = computeDiagramLayout(nodes, edges, {
      direction: 'top-to-bottom',
      startX: 100,
      startY: 100,
      spacingY: 60,
    });

    const s1 = result.nodes.find((n) => n.id === 'step1')!;
    const s2 = result.nodes.find((n) => n.id === 'step2')!;

    expect(s1.y).toBeLessThan(s2.y);
    expect(s2.y - s1.y).toBeGreaterThanOrEqual(80 + 60);
  });

  it('should arrange nodes in grid mode', () => {
    const nodes = [
      { id: 'a', width: 100, height: 60 },
      { id: 'b', width: 100, height: 60 },
      { id: 'c', width: 100, height: 60 },
      { id: 'd', width: 100, height: 60 },
    ];

    const result = computeDiagramLayout(nodes, [], {
      direction: 'grid',
      startX: 50,
      startY: 50,
      spacingX: 40,
      spacingY: 40,
    });

    expect(result.nodes).toHaveLength(4);
    // In 2x2 grid, node a and b are row 0, c and d are row 1
    const a = result.nodes[0];
    const b = result.nodes[1];
    const c = result.nodes[2];

    expect(b.x).toBeGreaterThan(a.x);
    expect(c.y).toBeGreaterThan(a.y);
  });
});
