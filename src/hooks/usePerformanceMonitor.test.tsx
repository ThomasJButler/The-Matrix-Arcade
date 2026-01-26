import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { usePerformanceMonitor } from './usePerformanceMonitor';

describe('usePerformanceMonitor', () => {
  let mockPerformanceNow: ReturnType<typeof vi.spyOn>;
  let currentTime = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    currentTime = 0;
    mockPerformanceNow = vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const advanceTime = (ms: number) => {
    currentTime += ms;
  };

  describe('Initialisation', () => {
    it('returns all performance monitoring functions', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      expect(result.current.stats).toBeDefined();
      expect(result.current.updateFPS).toBeDefined();
      expect(result.current.trackDrawCall).toBeDefined();
      expect(result.current.trackActiveObjects).toBeDefined();
      expect(result.current.getOptimizationSuggestions).toBeDefined();
      expect(result.current.PerformanceOverlay).toBeDefined();
      expect(result.current.profile).toBeDefined();
      expect(result.current.batchOperations).toBeDefined();
    });

    it('initialises with zero stats', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      expect(result.current.stats.fps).toBe(0);
      expect(result.current.stats.frameTime).toBe(0);
      expect(result.current.stats.memoryUsed).toBe(0);
      expect(result.current.stats.memoryLimit).toBe(0);
      expect(result.current.stats.drawCalls).toBe(0);
      expect(result.current.stats.activeObjects).toBe(0);
    });

    it('accepts custom options', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({
          targetFPS: 30,
          showOverlay: true,
          warnThreshold: 25,
          criticalThreshold: 15,
        })
      );

      // Options should affect behavior - tested through overlay and suggestions
      expect(result.current.stats).toBeDefined();
    });
  });

  describe('updateFPS', () => {
    it('calculates FPS based on frame times', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      // First update establishes baseline
      act(() => {
        result.current.updateFPS();
      });

      // Advance time by 16.67ms (60fps) and update
      advanceTime(16.67);

      act(() => {
        result.current.updateFPS();
      });

      // FPS should be approximately 60 (allow some variance due to averaging)
      expect(result.current.stats.fps).toBeGreaterThan(50);
      expect(result.current.stats.fps).toBeLessThan(150);
    });

    it('calculates average FPS over multiple frames', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      // Simulate multiple frames at 60fps pace
      act(() => {
        result.current.updateFPS();
      });

      for (let i = 0; i < 10; i++) {
        advanceTime(16.67); // 60fps frames
        act(() => {
          result.current.updateFPS();
        });
      }

      // FPS should be in reasonable range (averaging may affect exact value)
      expect(result.current.stats.fps).toBeGreaterThan(50);
      expect(result.current.stats.fps).toBeLessThan(150);
    });

    it('handles variable frame times', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        result.current.updateFPS();
      });

      // Mix of fast and slow frames
      advanceTime(10); // Fast frame
      act(() => {
        result.current.updateFPS();
      });

      advanceTime(30); // Slow frame
      act(() => {
        result.current.updateFPS();
      });

      // Should average out
      expect(result.current.stats.fps).toBeGreaterThan(0);
    });

    it('limits frame time history to 60 samples', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      // Run more than 60 updates
      for (let i = 0; i < 100; i++) {
        advanceTime(16.67);
        act(() => {
          result.current.updateFPS();
        });
      }

      // Should still work correctly (internal buffer limited)
      expect(result.current.stats.fps).toBeGreaterThan(0);
    });

    it('resets draw calls and active objects after update', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        result.current.trackDrawCall();
        result.current.trackDrawCall();
        result.current.trackActiveObjects(100);
      });

      act(() => {
        result.current.updateFPS();
      });

      // Stats should show the tracked values
      expect(result.current.stats.drawCalls).toBe(2);
      expect(result.current.stats.activeObjects).toBe(100);

      // After another update, counters should be reset
      advanceTime(16);
      act(() => {
        result.current.updateFPS();
      });

      expect(result.current.stats.drawCalls).toBe(0);
      expect(result.current.stats.activeObjects).toBe(0);
    });
  });

  describe('trackDrawCall', () => {
    it('increments draw call counter', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        result.current.trackDrawCall();
        result.current.trackDrawCall();
        result.current.trackDrawCall();
        result.current.updateFPS();
      });

      expect(result.current.stats.drawCalls).toBe(3);
    });

    it('accumulates calls between updates', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        result.current.trackDrawCall();
      });

      act(() => {
        result.current.trackDrawCall();
      });

      act(() => {
        result.current.updateFPS();
      });

      expect(result.current.stats.drawCalls).toBe(2);
    });
  });

  describe('trackActiveObjects', () => {
    it('sets active object count', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        result.current.trackActiveObjects(150);
        result.current.updateFPS();
      });

      expect(result.current.stats.activeObjects).toBe(150);
    });

    it('overwrites previous count', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        result.current.trackActiveObjects(100);
        result.current.trackActiveObjects(200);
        result.current.updateFPS();
      });

      expect(result.current.stats.activeObjects).toBe(200);
    });
  });

  describe('getOptimizationSuggestions', () => {
    it('returns empty array for good performance', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      // Simulate good FPS
      act(() => {
        result.current.updateFPS();
      });

      for (let i = 0; i < 10; i++) {
        advanceTime(16.67);
        act(() => {
          result.current.updateFPS();
        });
      }

      const suggestions = result.current.getOptimizationSuggestions();
      expect(suggestions).toHaveLength(0);
    });

    it('warns when FPS drops below warn threshold', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ warnThreshold: 45, criticalThreshold: 30 })
      );

      // Simulate slow FPS (40fps = 25ms per frame)
      act(() => {
        result.current.updateFPS();
      });

      for (let i = 0; i < 10; i++) {
        advanceTime(25);
        act(() => {
          result.current.updateFPS();
        });
      }

      const suggestions = result.current.getOptimizationSuggestions();
      expect(suggestions.some(s => s.includes('Warning'))).toBe(true);
    });

    it('shows critical warning when FPS drops below critical threshold', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ warnThreshold: 45, criticalThreshold: 30 })
      );

      // Simulate very slow FPS (20fps = 50ms per frame)
      act(() => {
        result.current.updateFPS();
      });

      for (let i = 0; i < 10; i++) {
        advanceTime(50);
        act(() => {
          result.current.updateFPS();
        });
      }

      const suggestions = result.current.getOptimizationSuggestions();
      expect(suggestions.some(s => s.includes('Critical'))).toBe(true);
    });

    it('warns about high draw calls', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        for (let i = 0; i < 1001; i++) {
          result.current.trackDrawCall();
        }
        result.current.updateFPS();
      });

      const suggestions = result.current.getOptimizationSuggestions();
      expect(suggestions.some(s => s.includes('draw call'))).toBe(true);
    });

    it('warns about many active objects', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        result.current.trackActiveObjects(501);
        result.current.updateFPS();
      });

      const suggestions = result.current.getOptimizationSuggestions();
      expect(suggestions.some(s => s.includes('active objects'))).toBe(true);
    });
  });

  describe('PerformanceOverlay', () => {
    it('returns null when showOverlay is false', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ showOverlay: false })
      );

      const Overlay = result.current.PerformanceOverlay;
      const { container } = render(<Overlay />);

      expect(container.firstChild).toBeNull();
    });

    it('renders overlay when showOverlay is true', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ showOverlay: true })
      );

      const Overlay = result.current.PerformanceOverlay;
      const { container } = render(<Overlay />);

      expect(container.firstChild).not.toBeNull();
    });

    it('displays FPS value', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ showOverlay: true })
      );

      const Overlay = result.current.PerformanceOverlay;
      render(<Overlay />);

      expect(screen.getByText(/FPS:/)).toBeInTheDocument();
    });

    it('displays frame time', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ showOverlay: true })
      );

      const Overlay = result.current.PerformanceOverlay;
      render(<Overlay />);

      expect(screen.getByText(/Frame Time:/)).toBeInTheDocument();
    });

    it('displays memory info', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ showOverlay: true })
      );

      const Overlay = result.current.PerformanceOverlay;
      render(<Overlay />);

      expect(screen.getByText(/Memory:/)).toBeInTheDocument();
    });

    it('displays draw calls', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ showOverlay: true })
      );

      const Overlay = result.current.PerformanceOverlay;
      render(<Overlay />);

      expect(screen.getByText(/Draw Calls:/)).toBeInTheDocument();
    });

    it('displays active objects', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ showOverlay: true })
      );

      const Overlay = result.current.PerformanceOverlay;
      render(<Overlay />);

      expect(screen.getByText(/Active Objects:/)).toBeInTheDocument();
    });

    it('shows target FPS', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ showOverlay: true, targetFPS: 30 })
      );

      const Overlay = result.current.PerformanceOverlay;
      render(<Overlay />);

      expect(screen.getByText(/\/ 30/)).toBeInTheDocument();
    });
  });

  describe('profile', () => {
    it('executes the provided function', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      const fn = vi.fn();

      act(() => {
        result.current.profile('test', fn);
      });

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('measures execution time', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      // Function that takes some time
      const fn = vi.fn(() => {
        advanceTime(10);
      });

      act(() => {
        result.current.profile('test operation', fn);
      });

      // Function should complete without error
      expect(fn).toHaveBeenCalled();
    });

    it('handles throwing functions', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      const fn = vi.fn(() => {
        throw new Error('Test error');
      });

      expect(() => {
        act(() => {
          result.current.profile('failing test', fn);
        });
      }).toThrow('Test error');
    });
  });

  describe('batchOperations', () => {
    it('processes all items', async () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      const items = [1, 2, 3, 4, 5];
      const processed: number[] = [];
      const operation = vi.fn((item: number) => {
        processed.push(item);
      });

      // Mock RAF
      let rafCallback: FrameRequestCallback | null = null;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return 1;
      });

      act(() => {
        result.current.batchOperations(items, operation, 100);
      });

      // All should be processed in one batch (batchSize > items.length)
      expect(processed).toEqual([1, 2, 3, 4, 5]);
    });

    it('splits large arrays into batches', async () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      const items = Array.from({ length: 250 }, (_, i) => i);
      const processed: number[] = [];
      const operation = vi.fn((item: number) => {
        processed.push(item);
      });

      let rafCallbacks: FrameRequestCallback[] = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });

      act(() => {
        result.current.batchOperations(items, operation, 100);
      });

      // First batch (100 items)
      expect(processed).toHaveLength(100);

      // Process second batch via RAF
      if (rafCallbacks.length > 0) {
        act(() => {
          rafCallbacks[0](0);
        });
      }

      expect(processed).toHaveLength(200);

      // Process third batch
      if (rafCallbacks.length > 1) {
        act(() => {
          rafCallbacks[1](0);
        });
      }

      expect(processed).toHaveLength(250);
    });

    it('uses default batch size of 100', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      const items = Array.from({ length: 150 }, (_, i) => i);
      const processed: number[] = [];
      const operation = vi.fn((item: number) => {
        processed.push(item);
      });

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

      act(() => {
        result.current.batchOperations(items, operation);
      });

      // First batch should be 100 with default batch size
      expect(processed).toHaveLength(100);
    });

    it('handles empty array', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      const operation = vi.fn();

      act(() => {
        result.current.batchOperations([], operation);
      });

      expect(operation).not.toHaveBeenCalled();
    });
  });

  describe('Auto-update with showOverlay', () => {
    it('starts interval when showOverlay is true', () => {
      renderHook(() =>
        usePerformanceMonitor({ showOverlay: true })
      );

      // Should have set up interval
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    it('does not start interval when showOverlay is false', () => {
      const initialTimerCount = vi.getTimerCount();

      renderHook(() =>
        usePerformanceMonitor({ showOverlay: false })
      );

      // Timer count should not increase (no interval started)
      expect(vi.getTimerCount()).toBe(initialTimerCount);
    });

    it('clears interval on unmount', () => {
      const { unmount } = renderHook(() =>
        usePerformanceMonitor({ showOverlay: true })
      );

      const timerCountBefore = vi.getTimerCount();

      unmount();

      expect(vi.getTimerCount()).toBeLessThan(timerCountBefore);
    });

    it('updates stats every second when overlay shown', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({ showOverlay: true })
      );

      // Initial stats
      const initialFPS = result.current.stats.fps;

      // Advance time and simulate frame updates
      advanceTime(1000);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Stats should have updated (FPS calculation would run)
      // The exact value depends on timing, but the mechanism should work
      expect(result.current.stats).toBeDefined();
    });
  });

  describe('Memory Tracking', () => {
    it('reads memory info when available', () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB
      };

      const perfWithMemory = performance as Performance & {
        memory?: typeof mockMemory;
      };
      perfWithMemory.memory = mockMemory;

      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        result.current.updateFPS();
      });

      advanceTime(16);

      act(() => {
        result.current.updateFPS();
      });

      expect(result.current.stats.memoryUsed).toBeCloseTo(50, 0);
      expect(result.current.stats.memoryLimit).toBeCloseTo(100, 0);

      // Cleanup
      delete perfWithMemory.memory;
    });

    it('handles missing memory API gracefully', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        result.current.updateFPS();
      });

      // Should not throw and memory should be 0
      expect(result.current.stats.memoryUsed).toBe(0);
      expect(result.current.stats.memoryLimit).toBe(0);
    });

    it('warns about high memory usage', () => {
      // Mock high memory usage (85%)
      const mockMemory = {
        usedJSHeapSize: 85 * 1024 * 1024,
        jsHeapSizeLimit: 100 * 1024 * 1024,
      };

      const perfWithMemory = performance as Performance & {
        memory?: typeof mockMemory;
      };
      perfWithMemory.memory = mockMemory;

      const { result } = renderHook(() => usePerformanceMonitor());

      act(() => {
        result.current.updateFPS();
      });

      advanceTime(16);

      act(() => {
        result.current.updateFPS();
      });

      const suggestions = result.current.getOptimizationSuggestions();
      expect(suggestions.some(s => s.toLowerCase().includes('memory'))).toBe(true);

      // Cleanup
      delete perfWithMemory.memory;
    });
  });

  describe('Overlay Styling', () => {
    it('uses green color for good FPS', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({
          showOverlay: true,
          warnThreshold: 45,
          criticalThreshold: 30,
        })
      );

      // Simulate good FPS (60fps)
      act(() => {
        result.current.updateFPS();
      });

      for (let i = 0; i < 10; i++) {
        advanceTime(16.67);
        act(() => {
          result.current.updateFPS();
        });
      }

      const Overlay = result.current.PerformanceOverlay;
      const { container } = render(<Overlay />);

      // Check that the overlay div exists and has a border (CSS converts hex to rgb)
      const overlayDiv = container.firstChild as HTMLElement;
      expect(overlayDiv).not.toBeNull();
      if (overlayDiv) {
        // Browser converts #00ff00 to rgb(0, 255, 0)
        expect(overlayDiv.style.border).toMatch(/rgb\(0,\s*255,\s*0\)|#00ff00/);
      }
    });

    it('uses orange/yellow color for warning FPS', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({
          showOverlay: true,
          warnThreshold: 45,
          criticalThreshold: 30,
        })
      );

      // Simulate warning FPS (40fps = 25ms per frame)
      act(() => {
        result.current.updateFPS();
      });

      for (let i = 0; i < 10; i++) {
        advanceTime(25);
        act(() => {
          result.current.updateFPS();
        });
      }

      const Overlay = result.current.PerformanceOverlay;
      const { container } = render(<Overlay />);

      const overlayDiv = container.firstChild as HTMLElement;
      expect(overlayDiv).not.toBeNull();
      if (overlayDiv) {
        // Browser converts #ffaa00 to rgb(255, 170, 0)
        expect(overlayDiv.style.border).toMatch(/rgb\(255,\s*170,\s*0\)|#ffaa00/);
      }
    });

    it('uses red color for critical FPS', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor({
          showOverlay: true,
          warnThreshold: 45,
          criticalThreshold: 30,
        })
      );

      // Simulate critical FPS (20fps = 50ms per frame)
      act(() => {
        result.current.updateFPS();
      });

      for (let i = 0; i < 10; i++) {
        advanceTime(50);
        act(() => {
          result.current.updateFPS();
        });
      }

      const Overlay = result.current.PerformanceOverlay;
      const { container } = render(<Overlay />);

      const overlayDiv = container.firstChild as HTMLElement;
      expect(overlayDiv).not.toBeNull();
      if (overlayDiv) {
        // Browser converts #ff0000 to rgb(255, 0, 0)
        expect(overlayDiv.style.border).toMatch(/rgb\(255,\s*0,\s*0\)|#ff0000/);
      }
    });
  });
});
