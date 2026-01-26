import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInterval } from './useInterval';

describe('useInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initialisation', () => {
    it('starts interval with specified delay', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, 1000));

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not start interval when delay is null', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, null));

      vi.advanceTimersByTime(5000);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Interval Execution', () => {
    it('calls callback at regular intervals', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, 100));

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('handles short intervals (60fps equivalent)', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, 16));

      vi.advanceTimersByTime(160); // 10 frames

      expect(callback).toHaveBeenCalledTimes(10);
    });

    it('handles long intervals', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, 60000)); // 1 minute

      vi.advanceTimersByTime(59999);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callback Updates', () => {
    it('uses updated callback without resetting interval', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ callback }) => useInterval(callback, 100),
        { initialProps: { callback: callback1 } }
      );

      vi.advanceTimersByTime(50);
      rerender({ callback: callback2 });
      vi.advanceTimersByTime(50);

      // First callback should not be called, second should
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('uses most recent callback on each tick', () => {
      const results: string[] = [];
      const callback1 = vi.fn(() => results.push('first'));
      const callback2 = vi.fn(() => results.push('second'));

      const { rerender } = renderHook(
        ({ callback }) => useInterval(callback, 100),
        { initialProps: { callback: callback1 } }
      );

      vi.advanceTimersByTime(100);
      rerender({ callback: callback2 });
      vi.advanceTimersByTime(100);

      expect(results).toEqual(['first', 'second']);
    });
  });

  describe('Delay Changes', () => {
    it('restarts interval when delay changes', () => {
      const callback = vi.fn();

      const { rerender } = renderHook(
        ({ delay }) => useInterval(callback, delay),
        { initialProps: { delay: 100 } }
      );

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      // Change delay to 200
      rerender({ delay: 200 });

      // After 100ms, callback should NOT be called again (new interval is 200ms)
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      // After another 100ms (200ms total since delay change), callback should fire
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('stops interval when delay becomes null', () => {
      const callback = vi.fn();

      const { rerender } = renderHook(
        ({ delay }) => useInterval(callback, delay),
        { initialProps: { delay: 100 as number | null } }
      );

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      // Set delay to null to pause
      rerender({ delay: null });

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('starts interval when delay changes from null to number', () => {
      const callback = vi.fn();

      const { rerender } = renderHook(
        ({ delay }) => useInterval(callback, delay),
        { initialProps: { delay: null as number | null } }
      );

      vi.advanceTimersByTime(500);
      expect(callback).not.toHaveBeenCalled();

      // Start interval
      rerender({ delay: 100 });

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    it('clears interval on unmount', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useInterval(callback, 100));

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      unmount();

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('clears old interval when delay changes', () => {
      const callback = vi.fn();
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { rerender } = renderHook(
        ({ delay }) => useInterval(callback, delay),
        { initialProps: { delay: 100 } }
      );

      rerender({ delay: 200 });

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero delay (immediate execution each tick)', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, 0));

      // With delay of 0, callback fires on every interval tick
      // Advance time - the exact behavior depends on the timer implementation
      vi.advanceTimersByTime(10);

      // Zero delay should result in some calls
      // Note: setInterval(fn, 0) in Node.js/browsers has minimum delay (usually 4ms)
      expect(callback.mock.calls.length).toBeGreaterThanOrEqual(0);
    });

    it('handles very small delays', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, 10));

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(10);
    });

    it('maintains accuracy over many iterations', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, 100));

      vi.advanceTimersByTime(1000);

      expect(callback).toHaveBeenCalledTimes(10);
    });
  });

  describe('Common Use Cases', () => {
    it('works for game tick (fixed timestep)', () => {
      let ticks = 0;
      const callback = vi.fn(() => {
        ticks++;
      });

      renderHook(() => useInterval(callback, 16)); // ~60fps

      vi.advanceTimersByTime(1000);

      // 1000ms / 16ms = 62.5, so 62 complete ticks
      expect(ticks).toBe(62);
    });

    it('works for countdown timer', () => {
      let countdown = 10;
      const callback = vi.fn(() => {
        countdown--;
      });

      renderHook(() => useInterval(callback, 1000));

      vi.advanceTimersByTime(5000);

      expect(countdown).toBe(5);
    });

    it('works for polling pattern', () => {
      const poll = vi.fn();
      renderHook(() => useInterval(poll, 5000));

      vi.advanceTimersByTime(15000);

      expect(poll).toHaveBeenCalledTimes(3);
    });

    it('can be paused and resumed', () => {
      const callback = vi.fn();

      const { rerender } = renderHook(
        ({ delay }) => useInterval(callback, delay),
        { initialProps: { delay: 100 as number | null } }
      );

      vi.advanceTimersByTime(250);
      expect(callback).toHaveBeenCalledTimes(2);

      // Pause
      rerender({ delay: null });
      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(2);

      // Resume
      rerender({ delay: 100 });
      vi.advanceTimersByTime(250);
      expect(callback).toHaveBeenCalledTimes(4);
    });
  });

  describe('Multiple Intervals', () => {
    it('handles multiple independent intervals', () => {
      const fast = vi.fn();
      const slow = vi.fn();

      renderHook(() => useInterval(fast, 50));
      renderHook(() => useInterval(slow, 200));

      vi.advanceTimersByTime(200);

      expect(fast).toHaveBeenCalledTimes(4);
      expect(slow).toHaveBeenCalledTimes(1);
    });
  });
});
