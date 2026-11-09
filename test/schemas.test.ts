import { describe, it, expect } from 'vitest';
import {
  CreateShapeSchema,
  ConnectShapesSchema,
  ClearCanvasSchema,
  GroupElementsSchema,
  ArrangeDiagramSchema,
  CreateDiagramSchema,
} from '../src/mcp/validation/schemas';

describe('Validation Schemas', () => {
  describe('CreateShapeSchema', () => {
    it('should validate a correct shape request', () => {
      const valid = {
        type: 'rectangle',
        width: 180,
        height: 90,
        label: 'API Gateway',
        backgroundColor: '#1e293b',
        strokeColor: '#3b82f6',
      };
      const parsed = CreateShapeSchema.parse(valid);
      expect(parsed.type).toBe('rectangle');
      expect(parsed.width).toBe(180);
      expect(parsed.label).toBe('API Gateway');
    });

    it('should reject invalid shape types', () => {
      const invalid = {
        type: 'triangle', // unsupported shape type
      };
      expect(() => CreateShapeSchema.parse(invalid)).toThrow();
    });

    it('should reject non-positive dimensions', () => {
      const invalid = {
        type: 'rectangle',
        width: -50,
      };
      expect(() => CreateShapeSchema.parse(invalid)).toThrow();
    });
  });

  describe('ConnectShapesSchema', () => {
    it('should validate connector endpoints', () => {
      const valid = {
        sourceId: 'node-1',
        targetId: 'node-2',
        label: 'HTTP GET',
        endArrowhead: 'arrow',
      };
      const parsed = ConnectShapesSchema.parse(valid);
      expect(parsed.sourceId).toBe('node-1');
      expect(parsed.targetId).toBe('node-2');
      expect(parsed.endArrowhead).toBe('arrow');
    });

    it('should reject empty source or target ID', () => {
      expect(() => ConnectShapesSchema.parse({ sourceId: '', targetId: 'b' })).toThrow();
      expect(() => ConnectShapesSchema.parse({ sourceId: 'a', targetId: '' })).toThrow();
    });
  });

  describe('ClearCanvasSchema', () => {
    it('should accept when confirm is explicitly true', () => {
      const parsed = ClearCanvasSchema.parse({ confirm: true });
      expect(parsed.confirm).toBe(true);
    });

    it('should reject when confirm is false or omitted', () => {
      expect(() => ClearCanvasSchema.parse({ confirm: false })).toThrow(
        /Destructive operation safeguard/
      );
      expect(() => ClearCanvasSchema.parse({})).toThrow();
    });
  });

  describe('GroupElementsSchema', () => {
    it('should require at least 2 elements to form a group', () => {
      expect(() => GroupElementsSchema.parse({ elementIds: ['single'] })).toThrow();
      const parsed = GroupElementsSchema.parse({ elementIds: ['a', 'b'] });
      expect(parsed.elementIds).toEqual(['a', 'b']);
    });
  });

  describe('ArrangeDiagramSchema', () => {
    it('should use sensible defaults', () => {
      const parsed = ArrangeDiagramSchema.parse({});
      expect(parsed.direction).toBe('left-to-right');
      expect(parsed.spacingX).toBe(100);
      expect(parsed.spacingY).toBe(80);
    });
  });

  describe('CreateDiagramSchema', () => {
    it('should validate full architecture payload', () => {
      const payload = {
        shapes: [
          { id: 'client', type: 'rectangle', label: 'Client' },
          { id: 'server', type: 'rectangle', label: 'Server' },
        ],
        connectors: [{ sourceId: 'client', targetId: 'server', label: 'REST' }],
        layout: 'left-to-right',
      };
      const parsed = CreateDiagramSchema.parse(payload);
      expect(parsed.shapes).toHaveLength(2);
      expect(parsed.connectors).toHaveLength(1);
    });
  });
});
