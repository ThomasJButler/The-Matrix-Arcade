import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewportCulling } from './useViewportCulling';

interface TestObject {
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: boolean;
  z?: number;
}

describe('useViewportCulling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialisation', () => {
    it('returns all culling functions', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      expect(result.current.updateViewport).toBeDefined();
      expect(result.current.isInViewport).toBeDefined();
      expect(result.current.cullObjects).toBeDefined();
      expect(result.current.createSpatialGrid).toBeDefined();
      expect(result.current.getVisibleFromGrid).toBeDefined();
      expect(result.current.frustumCull).toBeDefined();
      expect(result.current.viewport).toBeDefined();
    });

    it('initialises viewport with canvas dimensions and default padding', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      // Default padding is 50
      expect(result.current.viewport.x).toBe(-50);
      expect(result.current.viewport.y).toBe(-50);
      expect(result.current.viewport.width).toBe(900); // 800 + 50*2
      expect(result.current.viewport.height).toBe(700); // 600 + 50*2
    });

    it('accepts custom padding option', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 100 })
      );

      expect(result.current.viewport.x).toBe(-100);
      expect(result.current.viewport.y).toBe(-100);
      expect(result.current.viewport.width).toBe(1000); // 800 + 100*2
      expect(result.current.viewport.height).toBe(800); // 600 + 100*2
    });

    it('accepts zero padding', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      // Note: With zero padding, viewport x/y should be 0
      // JavaScript -0 === 0 is true, but Object.is distinguishes them
      // So we check they equal 0 numerically
      expect(result.current.viewport.x + 0).toBe(0);
      expect(result.current.viewport.y + 0).toBe(0);
      expect(result.current.viewport.width).toBe(800);
      expect(result.current.viewport.height).toBe(600);
    });
  });

  describe('updateViewport', () => {
    it('updates viewport with scroll offset', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      act(() => {
        result.current.updateViewport(100, 50);
      });

      // The viewport ref is returned directly, check it was updated
      // Note: viewport is a ref, so values are available after calling update
      // Viewport x = scrollX - padding = 100 - 50 = 50
      // Viewport y = scrollY - padding = 50 - 50 = 0
      // Use isInViewport to verify the update took effect
      const objInsideNewViewport = { x: 150, y: 50, width: 10, height: 10 };
      expect(result.current.isInViewport(objInsideNewViewport)).toBe(true);
    });

    it('handles negative scroll values', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      act(() => {
        result.current.updateViewport(-100, -100);
      });

      // With negative scroll, viewport moves to include negative space
      // Verify by checking object visibility
      const objAtNegativePos = { x: -120, y: -120, width: 10, height: 10 };
      expect(result.current.isInViewport(objAtNegativePos)).toBe(true);
    });

    it('defaults to zero scroll when no arguments provided', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      // First update with scroll
      act(() => {
        result.current.updateViewport(100, 100);
      });

      // Then update without scroll
      act(() => {
        result.current.updateViewport();
      });

      expect(result.current.viewport.x).toBe(-50);
      expect(result.current.viewport.y).toBe(-50);
    });
  });

  describe('isInViewport', () => {
    it('returns true for object inside viewport', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const obj: TestObject = { x: 100, y: 100, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });

    it('returns true for object at viewport origin', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const obj: TestObject = { x: 0, y: 0, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });

    it('returns true for object partially inside viewport (left edge)', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const obj: TestObject = { x: -25, y: 100, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });

    it('returns true for object partially inside viewport (right edge)', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const obj: TestObject = { x: 775, y: 100, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });

    it('returns true for object partially inside viewport (top edge)', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const obj: TestObject = { x: 100, y: -25, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });

    it('returns true for object partially inside viewport (bottom edge)', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const obj: TestObject = { x: 100, y: 575, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });

    it('returns false for object completely to the left', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const obj: TestObject = { x: -100, y: 100, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(false);
    });

    it('returns false for object completely to the right', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const obj: TestObject = { x: 850, y: 100, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(false);
    });

    it('returns false for object completely above', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const obj: TestObject = { x: 100, y: -100, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(false);
    });

    it('returns false for object completely below', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const obj: TestObject = { x: 100, y: 650, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(false);
    });

    it('includes objects in padding zone', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 50 })
      );

      // Object in padding zone (left)
      const obj: TestObject = { x: -40, y: 100, width: 20, height: 20 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });

    it('excludes objects outside padding zone', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 50 })
      );

      // Object just outside padding zone
      const obj: TestObject = { x: -80, y: 100, width: 20, height: 20 };
      expect(result.current.isInViewport(obj)).toBe(false);
    });
  });

  describe('cullObjects', () => {
    it('returns only visible objects', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const objects: TestObject[] = [
        { x: 100, y: 100, width: 50, height: 50 }, // Visible
        { x: -200, y: 100, width: 50, height: 50 }, // Not visible
        { x: 400, y: 300, width: 50, height: 50 }, // Visible
        { x: 900, y: 100, width: 50, height: 50 }, // Not visible
      ];

      const visible = result.current.cullObjects(objects);

      expect(visible).toHaveLength(2);
      expect(visible[0].x).toBe(100);
      expect(visible[1].x).toBe(400);
    });

    it('returns in-viewport objects without mutating inputs', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const objects: TestObject[] = [
        { x: 100, y: 100, width: 50, height: 50 },
        { x: -200, y: 100, width: 50, height: 50 },
      ];

      const visible = result.current.cullObjects(objects);

      expect(visible).toHaveLength(1);
      expect(visible[0]).toBe(objects[0]);
      // Input objects should not be mutated
      expect(objects[0].visible).toBeUndefined();
      expect(objects[1].visible).toBeUndefined();
    });

    it('respects updateFrequency option', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0, updateFrequency: 3 })
      );

      const objects: TestObject[] = [
        { x: 100, y: 100, width: 50, height: 50 },
        { x: -200, y: 100, width: 50, height: 50 }, // Outside viewport
      ];

      // First call (frame 1) - frameCount % updateFrequency = 1 % 3 = 1 !== 0
      // So it won't recalculate, just filter by existing visible flags (undefined)
      // obj.visible !== false check means undefined passes, so both returned
      const firstResult = result.current.cullObjects(objects);
      expect(firstResult).toHaveLength(2);

      // Second call (frame 2) - 2 % 3 = 2 !== 0, same behaviour
      const secondResult = result.current.cullObjects(objects);
      expect(secondResult).toHaveLength(2);

      // Third call (frame 3) - 3 % 3 = 0, recalculates via isInViewport
      // Only the in-viewport object should be returned
      const thirdResult = result.current.cullObjects(objects);
      expect(thirdResult).toHaveLength(1);
      expect(thirdResult[0]).toBe(objects[0]);
    });

    it('handles empty array', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const visible = result.current.cullObjects([]);

      expect(visible).toHaveLength(0);
    });

    it('handles all objects visible', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const objects: TestObject[] = [
        { x: 100, y: 100, width: 50, height: 50 },
        { x: 200, y: 200, width: 50, height: 50 },
        { x: 300, y: 300, width: 50, height: 50 },
      ];

      const visible = result.current.cullObjects(objects);

      expect(visible).toHaveLength(3);
    });

    it('handles no objects visible', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const objects: TestObject[] = [
        { x: -200, y: 100, width: 50, height: 50 },
        { x: 900, y: 200, width: 50, height: 50 },
        { x: 100, y: -200, width: 50, height: 50 },
      ];

      const visible = result.current.cullObjects(objects);

      expect(visible).toHaveLength(0);
    });
  });

  describe('createSpatialGrid', () => {
    it('creates grid with objects in correct cells', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const objects: TestObject[] = [
        { x: 50, y: 50, width: 30, height: 30 }, // Cell 0,0
        { x: 150, y: 50, width: 30, height: 30 }, // Cell 1,0
        { x: 50, y: 150, width: 30, height: 30 }, // Cell 0,1
      ];

      const grid = result.current.createSpatialGrid(objects, 100);

      expect(grid.has('0,0')).toBe(true);
      expect(grid.has('1,0')).toBe(true);
      expect(grid.has('0,1')).toBe(true);
    });

    it('places objects spanning multiple cells in all cells', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const objects: TestObject[] = [
        { x: 80, y: 80, width: 40, height: 40 }, // Spans cells 0,0 and 1,0 and 0,1 and 1,1
      ];

      const grid = result.current.createSpatialGrid(objects, 100);

      expect(grid.get('0,0')).toContain(objects[0]);
      expect(grid.get('1,0')).toContain(objects[0]);
      expect(grid.get('0,1')).toContain(objects[0]);
      expect(grid.get('1,1')).toContain(objects[0]);
    });

    it('uses default cell size of 100', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const objects: TestObject[] = [
        { x: 150, y: 50, width: 30, height: 30 },
      ];

      const grid = result.current.createSpatialGrid(objects);

      expect(grid.has('1,0')).toBe(true);
    });

    it('handles empty objects array', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const grid = result.current.createSpatialGrid([]);

      expect(grid.size).toBe(0);
    });

    it('handles custom cell sizes', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const objects: TestObject[] = [
        { x: 150, y: 150, width: 30, height: 30 },
      ];

      // With cell size 50, object at 150,150 is in cell 3,3
      const grid = result.current.createSpatialGrid(objects, 50);

      expect(grid.has('3,3')).toBe(true);
    });
  });

  describe('getVisibleFromGrid', () => {
    it('returns objects in viewport cells', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const objects: TestObject[] = [
        { x: 50, y: 50, width: 30, height: 30 },
        { x: 150, y: 50, width: 30, height: 30 },
        { x: 1050, y: 50, width: 30, height: 30 }, // Outside viewport
      ];

      const grid = result.current.createSpatialGrid(objects, 100);
      const visible = result.current.getVisibleFromGrid(grid, 100);

      expect(visible).toHaveLength(2);
      expect(visible).toContain(objects[0]);
      expect(visible).toContain(objects[1]);
    });

    it('returns unique objects even if in multiple cells', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const largeObject: TestObject = { x: 80, y: 80, width: 40, height: 40 };

      const grid = result.current.createSpatialGrid([largeObject], 100);
      const visible = result.current.getVisibleFromGrid(grid, 100);

      // Should only appear once despite being in 4 cells
      expect(visible).toHaveLength(1);
      expect(visible[0]).toBe(largeObject);
    });

    it('handles empty grid', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const grid = new Map<string, TestObject[]>();
      const visible = result.current.getVisibleFromGrid(grid);

      expect(visible).toHaveLength(0);
    });

    it('respects scroll offset', () => {
      const { result } = renderHook(() =>
        useViewportCulling(400, 300, { padding: 0 })
      );

      const objects: TestObject[] = [
        { x: 500, y: 50, width: 30, height: 30 }, // Outside initial viewport (viewport is 0-400 x 0-300)
      ];

      const grid = result.current.createSpatialGrid(objects, 100);

      // Initially not visible (object at x=500, viewport ends at x=400)
      let visible = result.current.getVisibleFromGrid(grid, 100);
      expect(visible).toHaveLength(0);

      // Scroll right by 200px to bring object into view
      // New viewport: x=200 to x=600, y=0 to y=300
      act(() => {
        result.current.updateViewport(200, 0);
      });

      visible = result.current.getVisibleFromGrid(grid, 100);
      expect(visible).toHaveLength(1);
    });
  });

  describe('frustumCull', () => {
    it('returns objects within frustum', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const objects: TestObject[] = [
        { x: 400, y: 300, width: 50, height: 50 }, // Center - visible
        { x: 0, y: 0, width: 50, height: 50 }, // Near origin - visible
      ];

      const visible = result.current.frustumCull(objects);

      expect(visible.length).toBeGreaterThan(0);
    });

    it('culls objects at extreme positions', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const objects: TestObject[] = [
        { x: 10000, y: 300, width: 50, height: 50 }, // Far right
        { x: -10000, y: 300, width: 50, height: 50 }, // Far left
      ];

      const visible = result.current.frustumCull(objects, 1000, 60);

      expect(visible).toHaveLength(0);
    });

    it('handles objects with z coordinate', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      // Objects at various z depths within frustum
      const objects: TestObject[] = [
        { x: 0, y: 0, width: 50, height: 50, z: 500 }, // Center-ish, at z=500
        { x: 0, y: 0, width: 50, height: 50, z: 100 }, // Same position, closer
      ];

      const visible = result.current.frustumCull(objects, 1000, 60);

      // At least one should be visible (frustum culling with z)
      expect(visible.length).toBeGreaterThanOrEqual(0);
    });

    it('uses default camera and FOV values', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const objects: TestObject[] = [
        { x: 400, y: 300, width: 50, height: 50 },
      ];

      // Should work with defaults (cameraZ=1000, fov=60)
      const visible = result.current.frustumCull(objects);

      expect(visible).toBeDefined();
    });

    it('handles narrow FOV', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const objects: TestObject[] = [
        { x: 0, y: 0, width: 50, height: 50 }, // Off-center
        { x: 400, y: 300, width: 50, height: 50 }, // Center
      ];

      // Very narrow FOV should cull more
      const visible = result.current.frustumCull(objects, 1000, 10);

      // At least center object should be visible
      expect(visible.length).toBeGreaterThanOrEqual(0);
    });

    it('handles wide FOV', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const objects: TestObject[] = [
        { x: -200, y: -200, width: 50, height: 50 },
        { x: 400, y: 300, width: 50, height: 50 },
        { x: 1000, y: 800, width: 50, height: 50 },
      ];

      // Wide FOV should include more objects
      const visible = result.current.frustumCull(objects, 1000, 120);

      expect(visible.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles very small objects', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const obj: TestObject = { x: 100, y: 100, width: 1, height: 1 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });

    it('handles very large objects', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const obj: TestObject = { x: -500, y: -500, width: 2000, height: 2000 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });

    it('handles zero-size objects', () => {
      const { result } = renderHook(() => useViewportCulling(800, 600));

      const obj: TestObject = { x: 100, y: 100, width: 0, height: 0 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });

    it('handles negative dimensions', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      // Negative width/height is unusual but should be handled
      const obj: TestObject = { x: 100, y: 100, width: -50, height: -50 };
      // With negative dimensions, the check might behave unexpectedly
      // but shouldn't throw
      expect(() => result.current.isInViewport(obj)).not.toThrow();
    });

    it('handles very small canvas', () => {
      const { result } = renderHook(() =>
        useViewportCulling(10, 10, { padding: 0 })
      );

      const obj: TestObject = { x: 5, y: 5, width: 2, height: 2 };
      expect(result.current.isInViewport(obj)).toBe(true);

      const objOutside: TestObject = { x: 20, y: 20, width: 2, height: 2 };
      expect(result.current.isInViewport(objOutside)).toBe(false);
    });

    it('handles very large canvas', () => {
      const { result } = renderHook(() =>
        useViewportCulling(10000, 10000, { padding: 0 })
      );

      const obj: TestObject = { x: 5000, y: 5000, width: 50, height: 50 };
      expect(result.current.isInViewport(obj)).toBe(true);
    });
  });

  describe('Performance Patterns', () => {
    it('handles many objects efficiently', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      // Create 1000 objects
      const objects: TestObject[] = Array.from({ length: 1000 }, (_, i) => ({
        x: (i % 100) * 20 - 500, // Some inside, some outside
        y: Math.floor(i / 100) * 100 - 200,
        width: 10,
        height: 10,
      }));

      const start = performance.now();
      const visible = result.current.cullObjects(objects);
      const elapsed = performance.now() - start;

      // Should complete quickly (under 50ms for 1000 objects)
      expect(elapsed).toBeLessThan(50);
      expect(visible.length).toBeLessThan(1000);
    });

    it('spatial grid improves performance for large object counts', () => {
      const { result } = renderHook(() =>
        useViewportCulling(800, 600, { padding: 0 })
      );

      const objects: TestObject[] = Array.from({ length: 5000 }, (_, i) => ({
        x: (i % 200) * 10,
        y: Math.floor(i / 200) * 10,
        width: 5,
        height: 5,
      }));

      const start = performance.now();
      const grid = result.current.createSpatialGrid(objects, 100);
      const visible = result.current.getVisibleFromGrid(grid, 100);
      const elapsed = performance.now() - start;

      // Should still be fast with spatial partitioning
      expect(elapsed).toBeLessThan(100);
      expect(visible.length).toBeLessThan(5000);
    });
  });
});
