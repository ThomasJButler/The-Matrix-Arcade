import React, { useRef, useCallback, useEffect, useState } from 'react';

interface PerformanceStats {
  fps: number;
  frameTime: number;
  memoryUsed: number;
  memoryLimit: number;
  drawCalls: number;
  activeObjects: number;
}

interface PerformanceOptions {
  targetFPS?: number;
  showOverlay?: boolean;
  warnThreshold?: number;
  criticalThreshold?: number;
}

export function usePerformanceMonitor(options: PerformanceOptions = {}) {
  const {
    targetFPS = 60,
    showOverlay = false,
    warnThreshold = 45,
    criticalThreshold = 30
  } = options;

  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    frameTime: 0,
    memoryUsed: 0,
    memoryLimit: 0,
    drawCalls: 0,
    activeObjects: 0
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const drawCallsRef = useRef<number>(0);
  const activeObjectsRef = useRef<number>(0);

  // Update FPS calculation
  const updateFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;

    // Store frame times for averaging
    frameTimesRef.current.push(delta);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    // Calculate average FPS
    const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
    const fps = 1000 / avgFrameTime;

    // Get memory usage if available
    let memoryUsed = 0;
    let memoryLimit = 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsed = memory.usedJSHeapSize / 1048576; // Convert to MB
      memoryLimit = memory.jsHeapSizeLimit / 1048576;
    }

    setStats({
      fps: Math.round(fps),
      frameTime: Math.round(avgFrameTime * 100) / 100,
      memoryUsed: Math.round(memoryUsed * 10) / 10,
      memoryLimit: Math.round(memoryLimit),
      drawCalls: drawCallsRef.current,
      activeObjects: activeObjectsRef.current
    });

    // Reset counters
    drawCallsRef.current = 0;
    activeObjectsRef.current = 0;
  }, []);

  // Track draw calls
  const trackDrawCall = useCallback(() => {
    drawCallsRef.current++;
  }, []);

  // Track active objects
  const trackActiveObjects = useCallback((count: number) => {
    activeObjectsRef.current = count;
  }, []);

  // Performance optimization suggestions
  const getOptimizationSuggestions = useCallback((): string[] => {
    const suggestions: string[] = [];
    
    if (stats.fps < criticalThreshold) {
      suggestions.push('Critical: FPS below ' + criticalThreshold);
      suggestions.push('Reduce particle count or visual effects');
      suggestions.push('Enable object pooling for better performance');
    } else if (stats.fps < warnThreshold) {
      suggestions.push('Warning: FPS below optimal (' + warnThreshold + ')');
      suggestions.push('Consider reducing active objects');
    }

    if (stats.drawCalls > 1000) {
      suggestions.push('High draw call count - consider batching');
    }

    if (stats.memoryUsed > stats.memoryLimit * 0.8) {
      suggestions.push('High memory usage - clear unused resources');
    }

    if (stats.activeObjects > 500) {
      suggestions.push('Many active objects - implement culling');
    }

    return suggestions;
  }, [stats, criticalThreshold, warnThreshold]);

  // Create performance overlay component
  const PerformanceOverlay = useCallback(() => {
    if (!showOverlay) return null;

    const isWarning = stats.fps < warnThreshold;
    const isCritical = stats.fps < criticalThreshold;
    const color = isCritical ? '#ff0000' : isWarning ? '#ffaa00' : '#00ff00';

    return (
      <div
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: color,
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '12px',
          borderRadius: '5px',
          border: `1px solid ${color}`,
          zIndex: 9999,
          minWidth: '200px'
        }}
      >
        <div>FPS: {stats.fps} / {targetFPS}</div>
        <div>Frame Time: {stats.frameTime}ms</div>
        <div>Memory: {stats.memoryUsed}MB / {stats.memoryLimit}MB</div>
        <div>Draw Calls: {stats.drawCalls}</div>
        <div>Active Objects: {stats.activeObjects}</div>
        {getOptimizationSuggestions().length > 0 && (
          <div style={{ marginTop: '10px', borderTop: '1px solid #666', paddingTop: '10px' }}>
            {getOptimizationSuggestions().map((suggestion, i) => (
              <div key={i} style={{ fontSize: '10px', marginTop: '2px' }}>
                • {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [showOverlay, stats, targetFPS, warnThreshold, criticalThreshold, getOptimizationSuggestions]);

  // Auto-update FPS
  useEffect(() => {
    if (!showOverlay) return;

    const interval = setInterval(updateFPS, 1000);
    return () => clearInterval(interval);
  }, [showOverlay, updateFPS]);

  // Performance profiling
  const profile = useCallback((name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  }, []);

  // Batch operations for better performance
  const batchOperations = useCallback(<T,>(
    items: T[],
    operation: (item: T) => void,
    batchSize: number = 100
  ) => {
    let index = 0;
    
    const processBatch = () => {
      const end = Math.min(index + batchSize, items.length);
      
      for (let i = index; i < end; i++) {
        operation(items[i]);
      }
      
      index = end;
      
      if (index < items.length) {
        requestAnimationFrame(processBatch);
      }
    };
    
    processBatch();
  }, []);

  return {
    stats,
    updateFPS,
    trackDrawCall,
    trackActiveObjects,
    getOptimizationSuggestions,
    PerformanceOverlay,
    profile,
    batchOperations
  };
}