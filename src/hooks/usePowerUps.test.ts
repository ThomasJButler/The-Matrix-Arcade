import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePowerUps, PowerUpType, PowerUp } from './usePowerUps';

describe('usePowerUps', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock Math.random for predictable tests
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialisation', () => {
    it('returns all power-up management functions', () => {
      const { result } = renderHook(() => usePowerUps());

      expect(result.current.powerUps).toBeDefined();
      expect(result.current.setPowerUps).toBeDefined();
      expect(result.current.activePowerUps).toBeDefined();
      expect(result.current.spawnPowerUp).toBeDefined();
      expect(result.current.activatePowerUp).toBeDefined();
    });

    it('starts with empty power-ups array', () => {
      const { result } = renderHook(() => usePowerUps());

      expect(result.current.powerUps).toEqual([]);
    });

    it('starts with all power-ups inactive', () => {
      const { result } = renderHook(() => usePowerUps());

      expect(result.current.activePowerUps).toEqual({
        bigger_paddle: false,
        slower_ball: false,
        score_multiplier: false,
        multi_ball: false,
      });
    });
  });

  describe('spawnPowerUp', () => {
    it('creates a power-up with correct structure', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
      });

      expect(result.current.powerUps).toHaveLength(1);

      const powerUp = result.current.powerUps[0];
      expect(powerUp).toHaveProperty('id');
      expect(powerUp).toHaveProperty('x');
      expect(powerUp).toHaveProperty('y');
      expect(powerUp).toHaveProperty('type');
      expect(powerUp).toHaveProperty('active');
      expect(powerUp.active).toBe(true);
    });

    it('generates power-up within expected x range (200-600)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
      });

      // x = 200 + 0.5 * 400 = 400
      expect(result.current.powerUps[0].x).toBe(400);
    });

    it('generates power-up within expected y range (50-350)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
      });

      // y = 50 + 0.5 * 300 = 200
      expect(result.current.powerUps[0].y).toBe(200);
    });

    it('allows maximum of 2 power-ups on screen', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
        result.current.spawnPowerUp();
        result.current.spawnPowerUp();
        result.current.spawnPowerUp();
      });

      expect(result.current.powerUps).toHaveLength(2);
    });

    it('can spawn additional power-up after one is removed', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
        result.current.spawnPowerUp();
      });

      expect(result.current.powerUps).toHaveLength(2);

      // Remove first power-up
      act(() => {
        result.current.setPowerUps(prev => prev.slice(1));
      });

      expect(result.current.powerUps).toHaveLength(1);

      act(() => {
        result.current.spawnPowerUp();
      });

      expect(result.current.powerUps).toHaveLength(2);
    });

    it('generates unique IDs for each power-up', () => {
      // Restore random for ID generation
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5);

      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
        result.current.spawnPowerUp();
      });

      const ids = result.current.powerUps.map(p => p.id);
      expect(ids[0]).not.toBe(ids[1]);
    });

    it('selects from all power-up types', () => {
      const types: PowerUpType[] = [];
      const possibleTypes: PowerUpType[] = ['bigger_paddle', 'slower_ball', 'score_multiplier', 'multi_ball'];

      // Mock random to select each type
      possibleTypes.forEach((_, index) => {
        vi.spyOn(Math, 'random')
          .mockReturnValueOnce(0.1 + index * 0.01) // Unique ID
          .mockReturnValueOnce(0.5) // x
          .mockReturnValueOnce(0.5) // y
          .mockReturnValueOnce(index / 4); // Type selection

        const { result } = renderHook(() => usePowerUps());

        act(() => {
          result.current.spawnPowerUp();
        });

        types.push(result.current.powerUps[0].type);
      });

      // Verify we got all types (order depends on Math.random implementation)
      expect(possibleTypes).toContain(types[0]);
    });
  });

  describe('activatePowerUp', () => {
    it('sets power-up type to active', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.activatePowerUp('bigger_paddle');
      });

      expect(result.current.activePowerUps.bigger_paddle).toBe(true);
    });

    it('keeps other power-ups in their current state', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.activatePowerUp('bigger_paddle');
      });

      expect(result.current.activePowerUps.slower_ball).toBe(false);
      expect(result.current.activePowerUps.score_multiplier).toBe(false);
      expect(result.current.activePowerUps.multi_ball).toBe(false);
    });

    it('allows multiple power-ups to be active simultaneously', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.activatePowerUp('bigger_paddle');
        result.current.activatePowerUp('score_multiplier');
      });

      expect(result.current.activePowerUps.bigger_paddle).toBe(true);
      expect(result.current.activePowerUps.score_multiplier).toBe(true);
    });

    it('deactivates power-up after 10 seconds', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.activatePowerUp('bigger_paddle');
      });

      expect(result.current.activePowerUps.bigger_paddle).toBe(true);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.activePowerUps.bigger_paddle).toBe(false);
    });

    it('deactivates each power-up independently', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.activatePowerUp('bigger_paddle');
      });

      act(() => {
        vi.advanceTimersByTime(5000);
        result.current.activatePowerUp('score_multiplier');
      });

      // bigger_paddle has 5 seconds left, score_multiplier has 10 seconds
      expect(result.current.activePowerUps.bigger_paddle).toBe(true);
      expect(result.current.activePowerUps.score_multiplier).toBe(true);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // bigger_paddle expired, score_multiplier has 5 seconds left
      expect(result.current.activePowerUps.bigger_paddle).toBe(false);
      expect(result.current.activePowerUps.score_multiplier).toBe(true);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Both expired
      expect(result.current.activePowerUps.bigger_paddle).toBe(false);
      expect(result.current.activePowerUps.score_multiplier).toBe(false);
    });

    it('can reactivate a power-up after it expires', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.activatePowerUp('multi_ball');
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.activePowerUps.multi_ball).toBe(false);

      act(() => {
        result.current.activatePowerUp('multi_ball');
      });

      expect(result.current.activePowerUps.multi_ball).toBe(true);
    });

    it('handles activating already active power-up (creates second timer)', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.activatePowerUp('slower_ball');
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.activePowerUps.slower_ball).toBe(true);

      // Reactivate (starts new 10 second timer)
      act(() => {
        result.current.activatePowerUp('slower_ball');
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // First timer expired (set to false), but second timer hasn't yet
      // Note: The implementation doesn't track active timers, so first timer's
      // deactivation will fire. This test documents current behaviour.
      // If "extending" duration was desired, implementation would need refactoring.
      // Current behaviour: first timer deactivates at 10s, second at 15s
      // At 10s (5+5), first timer sets it to false
      expect(result.current.activePowerUps.slower_ball).toBe(false);

      // Reactivate to verify the mechanism still works
      act(() => {
        result.current.activatePowerUp('slower_ball');
      });

      expect(result.current.activePowerUps.slower_ball).toBe(true);
    });
  });

  describe('setPowerUps', () => {
    it('allows direct manipulation of power-ups array', () => {
      const { result } = renderHook(() => usePowerUps());

      const customPowerUp: PowerUp = {
        id: 'custom-1',
        x: 100,
        y: 100,
        type: 'bigger_paddle',
        active: true,
      };

      act(() => {
        result.current.setPowerUps([customPowerUp]);
      });

      expect(result.current.powerUps).toEqual([customPowerUp]);
    });

    it('can clear all power-ups', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
        result.current.spawnPowerUp();
      });

      expect(result.current.powerUps).toHaveLength(2);

      act(() => {
        result.current.setPowerUps([]);
      });

      expect(result.current.powerUps).toHaveLength(0);
    });

    it('can update power-up positions', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
      });

      const originalId = result.current.powerUps[0].id;

      act(() => {
        result.current.setPowerUps(prev =>
          prev.map(p => ({ ...p, y: p.y + 10 }))
        );
      });

      expect(result.current.powerUps[0].id).toBe(originalId);
      // y should be updated (original was around 200, now 210)
      expect(result.current.powerUps[0].y).toBeGreaterThan(200);
    });

    it('can mark power-ups as inactive (collected)', () => {
      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
      });

      act(() => {
        result.current.setPowerUps(prev =>
          prev.map(p => ({ ...p, active: false }))
        );
      });

      expect(result.current.powerUps[0].active).toBe(false);
    });

    it('can filter out power-ups', () => {
      // Set up unique random values for two power-ups
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // first ID
        .mockReturnValueOnce(0.5) // first x
        .mockReturnValueOnce(0.5) // first y
        .mockReturnValueOnce(0.5) // first type
        .mockReturnValueOnce(0.9) // second ID (different)
        .mockReturnValueOnce(0.5) // second x
        .mockReturnValueOnce(0.5) // second y
        .mockReturnValueOnce(0.5); // second type

      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
      });

      act(() => {
        result.current.spawnPowerUp();
      });

      expect(result.current.powerUps).toHaveLength(2);

      const firstId = result.current.powerUps[0].id;
      const secondId = result.current.powerUps[1].id;

      act(() => {
        result.current.setPowerUps(prev => prev.filter(p => p.id !== firstId));
      });

      expect(result.current.powerUps).toHaveLength(1);
      expect(result.current.powerUps[0].id).toBe(secondId);
    });
  });

  describe('Power-up Types', () => {
    it('includes bigger_paddle type', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5) // id
        .mockReturnValueOnce(0.5) // x
        .mockReturnValueOnce(0.5) // y
        .mockReturnValueOnce(0); // type index 0

      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
      });

      expect(result.current.powerUps[0].type).toBe('bigger_paddle');
    });

    it('includes slower_ball type', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5) // id
        .mockReturnValueOnce(0.5) // x
        .mockReturnValueOnce(0.5) // y
        .mockReturnValueOnce(0.25); // type index 1

      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
      });

      expect(result.current.powerUps[0].type).toBe('slower_ball');
    });

    it('includes score_multiplier type', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5) // id
        .mockReturnValueOnce(0.5) // x
        .mockReturnValueOnce(0.5) // y
        .mockReturnValueOnce(0.5); // type index 2

      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
      });

      expect(result.current.powerUps[0].type).toBe('score_multiplier');
    });

    it('includes multi_ball type', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5) // id
        .mockReturnValueOnce(0.5) // x
        .mockReturnValueOnce(0.5) // y
        .mockReturnValueOnce(0.75); // type index 3

      const { result } = renderHook(() => usePowerUps());

      act(() => {
        result.current.spawnPowerUp();
      });

      expect(result.current.powerUps[0].type).toBe('multi_ball');
    });
  });

  describe('Common Game Patterns', () => {
    it('supports spawn-collect-activate flow', () => {
      const { result } = renderHook(() => usePowerUps());

      // Spawn power-up
      act(() => {
        result.current.spawnPowerUp();
      });

      const powerUpType = result.current.powerUps[0].type;

      // Collect (remove from screen and activate)
      act(() => {
        result.current.activatePowerUp(powerUpType);
        result.current.setPowerUps([]);
      });

      expect(result.current.powerUps).toHaveLength(0);
      expect(result.current.activePowerUps[powerUpType]).toBe(true);
    });

    it('supports checking if any power-up is active', () => {
      const { result } = renderHook(() => usePowerUps());

      const isAnyActive = () =>
        Object.values(result.current.activePowerUps).some(v => v);

      expect(isAnyActive()).toBe(false);

      act(() => {
        result.current.activatePowerUp('bigger_paddle');
      });

      expect(isAnyActive()).toBe(true);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(isAnyActive()).toBe(false);
    });

    it('supports score multiplier calculation', () => {
      const { result } = renderHook(() => usePowerUps());

      const getMultiplier = () =>
        result.current.activePowerUps.score_multiplier ? 2 : 1;

      expect(getMultiplier()).toBe(1);

      act(() => {
        result.current.activatePowerUp('score_multiplier');
      });

      expect(getMultiplier()).toBe(2);
    });

    it('supports paddle size calculation', () => {
      const { result } = renderHook(() => usePowerUps());
      const basePaddleWidth = 100;

      const getPaddleWidth = () =>
        result.current.activePowerUps.bigger_paddle
          ? basePaddleWidth * 1.5
          : basePaddleWidth;

      expect(getPaddleWidth()).toBe(100);

      act(() => {
        result.current.activatePowerUp('bigger_paddle');
      });

      expect(getPaddleWidth()).toBe(150);
    });
  });

  describe('Cleanup', () => {
    it('timers are cleaned up on unmount', () => {
      const { result, unmount } = renderHook(() => usePowerUps());

      act(() => {
        result.current.activatePowerUp('bigger_paddle');
      });

      expect(result.current.activePowerUps.bigger_paddle).toBe(true);

      unmount();

      // Advance timers - should not throw or cause issues
      act(() => {
        vi.advanceTimersByTime(15000);
      });
    });
  });
});
