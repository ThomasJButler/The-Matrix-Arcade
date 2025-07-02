import { useCallback, useRef } from 'react';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CullableObject extends Bounds {
  visible?: boolean;
}

interface ViewportOptions {
  padding?: number;
  updateFrequency?: number;
}

export function useViewportCulling<T extends CullableObject>(
  canvasWidth: number,
  canvasHeight: number,
  options: ViewportOptions = {}
) {
  const { padding = 50, updateFrequency = 1 } = options;
  const frameCountRef = useRef(0);
  
  // Viewport bounds with padding
  const viewportRef = useRef<Bounds>({
    x: -padding,
    y: -padding,
    width: canvasWidth + padding * 2,
    height: canvasHeight + padding * 2
  });

  // Update viewport bounds
  const updateViewport = useCallback((scrollX: number = 0, scrollY: number = 0) => {
    viewportRef.current = {
      x: scrollX - padding,
      y: scrollY - padding,
      width: canvasWidth + padding * 2,
      height: canvasHeight + padding * 2
    };
  }, [canvasWidth, canvasHeight, padding]);

  // Check if object is in viewport
  const isInViewport = useCallback((obj: CullableObject): boolean => {
    const viewport = viewportRef.current;
    
    return !(
      obj.x + obj.width < viewport.x ||
      obj.x > viewport.x + viewport.width ||
      obj.y + obj.height < viewport.y ||
      obj.y > viewport.y + viewport.height
    );
  }, []);

  // Cull array of objects
  const cullObjects = useCallback((objects: T[]): T[] => {
    frameCountRef.current++;
    
    // Only update visibility every N frames
    if (frameCountRef.current % updateFrequency !== 0) {
      return objects.filter(obj => obj.visible !== false);
    }
    
    // Update visibility flags
    objects.forEach(obj => {
      obj.visible = isInViewport(obj);
    });
    
    return objects.filter(obj => obj.visible);
  }, [isInViewport, updateFrequency]);

  // Spatial partitioning for large object counts
  const createSpatialGrid = useCallback((
    objects: T[],
    cellSize: number = 100
  ) => {
    const grid = new Map<string, T[]>();
    
    objects.forEach(obj => {
      const startX = Math.floor(obj.x / cellSize);
      const endX = Math.floor((obj.x + obj.width) / cellSize);
      const startY = Math.floor(obj.y / cellSize);
      const endY = Math.floor((obj.y + obj.height) / cellSize);
      
      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const key = `${x},${y}`;
          if (!grid.has(key)) {
            grid.set(key, []);
          }
          grid.get(key)!.push(obj);
        }
      }
    });
    
    return grid;
  }, []);

  // Get visible objects from spatial grid
  const getVisibleFromGrid = useCallback((
    grid: Map<string, T[]>,
    cellSize: number = 100
  ): T[] => {
    const viewport = viewportRef.current;
    const visible = new Set<T>();
    
    const startX = Math.floor(viewport.x / cellSize);
    const endX = Math.floor((viewport.x + viewport.width) / cellSize);
    const startY = Math.floor(viewport.y / cellSize);
    const endY = Math.floor((viewport.y + viewport.height) / cellSize);
    
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        const objects = grid.get(key);
        if (objects) {
          objects.forEach(obj => {
            if (isInViewport(obj)) {
              visible.add(obj);
            }
          });
        }
      }
    }
    
    return Array.from(visible);
  }, [isInViewport]);

  // Frustum culling for 3D-like effects
  const frustumCull = useCallback((
    objects: T[],
    cameraZ: number = 1000,
    fov: number = 60
  ): T[] => {
    const halfFov = (fov * Math.PI) / 360;
    const frustumHeight = 2 * Math.tan(halfFov) * cameraZ;
    const frustumWidth = frustumHeight * (canvasWidth / canvasHeight);
    
    return objects.filter(obj => {
      // Simple frustum check
      const distanceZ = cameraZ - (obj as any).z || cameraZ;
      const scale = cameraZ / distanceZ;
      
      const projectedX = obj.x * scale;
      const projectedY = obj.y * scale;
      const projectedWidth = obj.width * scale;
      const projectedHeight = obj.height * scale;
      
      return !(
        projectedX + projectedWidth < -frustumWidth / 2 ||
        projectedX > frustumWidth / 2 ||
        projectedY + projectedHeight < -frustumHeight / 2 ||
        projectedY > frustumHeight / 2
      );
    });
  }, [canvasWidth, canvasHeight]);

  return {
    updateViewport,
    isInViewport,
    cullObjects,
    createSpatialGrid,
    getVisibleFromGrid,
    frustumCull,
    viewport: viewportRef.current
  };
}