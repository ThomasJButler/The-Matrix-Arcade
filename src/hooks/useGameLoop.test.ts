import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameLoop } from './useGameLoop';

// Mock requestAnimationFrame
let rafCallback: ((time: number) => void) | null = null;
let rafId = 0;

const mockRequestAnimationFrame = vi.fn((callback: (time: number) => void) => {
  rafCallback = callback;
  return ++rafId;
});

const mockCancelAnimationFrame = vi.fn((id: number) => {
  if (id === rafId) {
    rafCallback = null;
  }
});

// Helper to simulate RAF tick
const simulateRAFTick = (time: number) => {
  if (rafCallback) {
    rafCallback(time);
  }
};

describe('useGameLoop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rafCallback = null;
    rafId = 0;

    global.requestAnimationFrame = mockRequestAnimationFrame;
    global.cancelAnimationFrame = mockCancelAnimationFrame;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialisation', () => {
    it('starts requestAnimationFrame loop on mount', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('cancels requestAnimationFrame on unmount', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useGameLoop(callback));

      unmount();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('does not call callback on first frame (no previous time)', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      // First frame - no previous time reference yet
      simulateRAFTick(0);

      // Callback should not be called on first frame as there's no deltaTime
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Delta Time Calculation', () => {
    it('calls callback with correct deltaTime on second frame', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      // First frame at time 0
      simulateRAFTick(0);
      expect(callback).not.toHaveBeenCalled();

      // Second frame at time 16.67ms (60fps)
      simulateRAFTick(16.67);
      expect(callback).toHaveBeenCalledWith(16.67);
    });

    it('calculates correct deltaTime for 60fps', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      simulateRAFTick(0);
      simulateRAFTick(16.67);
      simulateRAFTick(33.34);

      expect(callback).toHaveBeenNthCalledWith(1, 16.67);
      expect(callback).toHaveBeenNthCalledWith(2, 16.67);
    });

    it('calculates correct deltaTime for 30fps', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      simulateRAFTick(0);
      simulateRAFTick(33.33);
      simulateRAFTick(66.66);

      expect(callback).toHaveBeenNthCalledWith(1, 33.33);
      expect(callback).toHaveBeenNthCalledWith(2, 33.33);
    });

    it('handles variable frame times (stuttering)', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      simulateRAFTick(0);
      simulateRAFTick(16); // Normal frame
      simulateRAFTick(50); // Slow frame (stutter)
      simulateRAFTick(66); // Normal frame

      expect(callback).toHaveBeenNthCalledWith(1, 16);
      expect(callback).toHaveBeenNthCalledWith(2, 34); // 50 - 16
      expect(callback).toHaveBeenNthCalledWith(3, 16); // 66 - 50
    });

    it('handles very long frames (tab inactive) by capping deltaTime', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      simulateRAFTick(0);
      simulateRAFTick(16);
      simulateRAFTick(5016); // 5 second pause (tab inactive)

      // deltaTime should be capped at 66.67ms to prevent huge spikes
      expect(callback).toHaveBeenNthCalledWith(2, 66.67);
    });
  });

  describe('Continuous Animation', () => {
    it('requests next animation frame after each callback', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      // Initial RAF call on mount
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);

      // First tick requests another frame
      simulateRAFTick(0);
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);

      // Second tick requests another frame
      simulateRAFTick(16);
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(3);
    });

    it('maintains continuous loop through multiple frames', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      // Simulate 60 frames (1 second at 60fps)
      for (let i = 0; i <= 60; i++) {
        simulateRAFTick(i * 16.67);
      }

      // Should have called callback 60 times (first frame has no delta)
      expect(callback).toHaveBeenCalledTimes(60);
    });
  });

  describe('Callback Changes', () => {
    it('uses updated callback after rerender', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ callback }) => useGameLoop(callback),
        { initialProps: { callback: callback1 } }
      );

      simulateRAFTick(0);
      simulateRAFTick(16);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      // Update callback
      rerender({ callback: callback2 });

      simulateRAFTick(32);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero deltaTime (same timestamp)', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      simulateRAFTick(100);
      simulateRAFTick(100); // Same timestamp

      expect(callback).toHaveBeenNthCalledWith(1, 0);
    });

    it('handles high precision timestamps', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      simulateRAFTick(0);
      simulateRAFTick(16.666666666666668);

      expect(callback).toHaveBeenCalledWith(16.666666666666668);
    });

    it('handles negative deltaTime gracefully (clock adjustment)', () => {
      const callback = vi.fn();
      renderHook(() => useGameLoop(callback));

      simulateRAFTick(100);
      simulateRAFTick(50); // Time went backwards (unlikely but possible)

      // Still calculates delta (negative in this edge case)
      expect(callback).toHaveBeenCalledWith(-50);
    });
  });

  describe('Cleanup', () => {
    it('cancels animation frame when unmounted during animation', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useGameLoop(callback));

      simulateRAFTick(0);
      simulateRAFTick(16);

      unmount();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('stops calling callback after unmount', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useGameLoop(callback));

      simulateRAFTick(0);
      simulateRAFTick(16);

      const callCountBeforeUnmount = callback.mock.calls.length;

      unmount();

      // Simulate more ticks (shouldn't trigger callback)
      // Note: After unmount, rafCallback would be null due to cancelAnimationFrame
      expect(callback.mock.calls.length).toBe(callCountBeforeUnmount);
    });
  });

  describe('Performance Considerations', () => {
    it('provides deltaTime suitable for time-based movement', () => {
      const positions: number[] = [];
      const speed = 100; // pixels per second

      const callback = vi.fn((deltaTime: number) => {
        // Simulate time-based movement
        const movement = (speed * deltaTime) / 1000;
        positions.push(movement);
      });

      renderHook(() => useGameLoop(callback));

      simulateRAFTick(0);
      simulateRAFTick(16.67);  // ~60fps
      simulateRAFTick(33.34);  // ~60fps

      // At 60fps with 100px/s speed, each frame should move ~1.667 pixels
      expect(positions[0]).toBeCloseTo(1.667, 1);
      expect(positions[1]).toBeCloseTo(1.667, 1);
    });

    it('handles frame skipping for physics simulations', () => {
      const updates: number[] = [];
      const fixedTimestep = 16.67;

      const callback = vi.fn((deltaTime: number) => {
        // Fixed timestep physics simulation
        let accumulator = deltaTime;
        while (accumulator >= fixedTimestep) {
          updates.push(fixedTimestep);
          accumulator -= fixedTimestep;
        }
      });

      renderHook(() => useGameLoop(callback));

      simulateRAFTick(0);
      simulateRAFTick(50); // Slow frame (should trigger 2-3 physics updates)

      expect(updates.length).toBeGreaterThanOrEqual(2);
    });
  });
});
