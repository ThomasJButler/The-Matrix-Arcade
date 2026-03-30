import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAchievementManager } from './useAchievementManager';

// Storage key constants matching useSaveSystem
const STORAGE_KEY = 'matrix-arcade-save-data';

describe('useAchievementManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialisation', () => {
    it('initialises with empty notification queue', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.notificationQueue).toEqual([]);
      });
    });

    it('initialises with display closed', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isDisplayOpen).toBe(false);
      });
    });

    it('provides achievement stats on initialisation', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.stats).toBeDefined();
        expect(result.current.stats.total).toBeGreaterThan(0);
        expect(result.current.stats.unlocked).toBe(0);
        expect(result.current.stats.percentage).toBe(0);
      });
    });

    it('provides achievements array on initialisation', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.achievements).toBeDefined();
        expect(Array.isArray(result.current.achievements)).toBe(true);
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });
    });

    it('loads existing achievements from localStorage', async () => {
      // Set up existing save data with unlocked achievements
      const existingData = {
        version: '1.0.0',
        games: {
          snakeClassic: {
            highScore: 100,
            level: 1,
            achievements: ['snake_first_apple'],
            stats: { gamesPlayed: 5, totalScore: 500 },
            lastPlayed: Date.now()
          },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: {
          totalPlayTime: 0,
          favoriteGame: '',
          globalAchievements: [],
          firstPlayDate: Date.now()
        },
        settings: { autoSave: true }
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));

      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(true);
      });
    });
  });

  describe('Notification Queue Management', () => {
    it('initialises with empty queue', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.notificationQueue).toEqual([]);
      });
    });

    it('dismissNotification handles empty queue gracefully', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.notificationQueue).toEqual([]);
      });

      // Should not throw
      act(() => {
        result.current.dismissNotification(0);
      });

      expect(result.current.notificationQueue).toEqual([]);
    });

    it('clearNotifications on empty queue does not throw', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.notificationQueue).toEqual([]);
      });

      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notificationQueue).toEqual([]);
    });
  });

  describe('Display Modal Controls', () => {
    it('toggleDisplay opens closed display', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isDisplayOpen).toBe(false);
      });

      act(() => {
        result.current.toggleDisplay();
      });

      expect(result.current.isDisplayOpen).toBe(true);
    });

    it('toggleDisplay closes open display', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isDisplayOpen).toBe(false);
      });

      // Open first
      act(() => {
        result.current.openDisplay();
      });

      expect(result.current.isDisplayOpen).toBe(true);

      // Toggle to close
      act(() => {
        result.current.toggleDisplay();
      });

      expect(result.current.isDisplayOpen).toBe(false);
    });

    it('openDisplay sets display to open', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isDisplayOpen).toBe(false);
      });

      act(() => {
        result.current.openDisplay();
      });

      expect(result.current.isDisplayOpen).toBe(true);
    });

    it('openDisplay is idempotent when already open', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isDisplayOpen).toBe(false);
      });

      act(() => {
        result.current.openDisplay();
      });

      expect(result.current.isDisplayOpen).toBe(true);

      act(() => {
        result.current.openDisplay();
      });

      expect(result.current.isDisplayOpen).toBe(true);
    });

    it('closeDisplay sets display to closed', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isDisplayOpen).toBe(false);
      });

      act(() => {
        result.current.openDisplay();
      });

      expect(result.current.isDisplayOpen).toBe(true);

      act(() => {
        result.current.closeDisplay();
      });

      expect(result.current.isDisplayOpen).toBe(false);
    });

    it('closeDisplay is idempotent when already closed', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isDisplayOpen).toBe(false);
      });

      act(() => {
        result.current.closeDisplay();
      });

      expect(result.current.isDisplayOpen).toBe(false);
    });
  });

  describe('Achievement Statistics', () => {
    it('getStats returns correct total count', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        // Should have all achievements from all games plus global achievements
        expect(result.current.stats.total).toBeGreaterThan(50);
      });
    });

    it('getStats returns zero unlocked initially', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.stats.unlocked).toBe(0);
        expect(result.current.stats.percentage).toBe(0);
      });
    });

    it('getStats updates after unlocking achievement', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.stats.unlocked).toBe(0);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      await waitFor(() => {
        expect(result.current.stats.unlocked).toBe(1);
        expect(result.current.stats.percentage).toBeGreaterThan(0);
      });
    });

    it('getStats provides breakdown by game', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.stats.byGame).toBeDefined();
        expect(result.current.stats.byGame['Snake Classic']).toBeDefined();
        expect(result.current.stats.byGame['Snake Classic'].total).toBeGreaterThan(0);
        expect(result.current.stats.byGame['Snake Classic'].unlocked).toBe(0);
      });
    });

    it('getStats byGame updates correctly after unlocking', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.stats.byGame['Snake Classic'].unlocked).toBe(0);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      await waitFor(() => {
        expect(result.current.stats.byGame['Snake Classic'].unlocked).toBe(1);
      });
    });

    it('calculates percentage correctly', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.stats.percentage).toBe(0);
      });

      const totalAchievements = result.current.stats.total;

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      await waitFor(() => {
        const expectedPercentage = Math.round((1 / totalAchievements) * 100);
        expect(result.current.stats.percentage).toBe(expectedPercentage);
      });
    });

    it('stats byGame handles general category for global achievements', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        // Global achievements should appear under 'General' category
        expect(result.current.stats.byGame['General']).toBeDefined();
        expect(result.current.stats.byGame['General'].total).toBeGreaterThan(0);
      });
    });
  });

  describe('unlockAchievement', () => {
    it('unlocks achievement successfully', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(true);
      });
    });

    it('ignores duplicate unlock attempts', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(true);
      });

      // Second attempt should be a no-op
      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      // Achievement should still be unlocked
      expect(result.current.isUnlocked('snake_first_apple')).toBe(true);
      // Stats should still show 1 unlocked
      expect(result.current.stats.unlocked).toBe(1);
    });

    it('persists unlocked achievement to localStorage', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(true);
      });

      // Check localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.games.snakeClassic.achievements).toContain('snake_first_apple');
    });

    it('unlocks achievements for different games', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(false);
        expect(result.current.isUnlocked('pong_first_point')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
        result.current.unlockAchievement('vortexPong', 'pong_first_point');
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(true);
        expect(result.current.isUnlocked('pong_first_point')).toBe(true);
      });
    });
  });

  describe('isUnlocked', () => {
    it('returns false for locked achievement', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(false);
      });
    });

    it('returns true for unlocked achievement', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(true);
      });
    });

    it('returns false for non-existent achievement', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('non_existent_achievement')).toBe(false);
      });
    });
  });

  describe('getAchievements (achievements property)', () => {
    it('returns all achievements with enhanced data', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);

        const firstAchievement = result.current.achievements[0];
        expect(firstAchievement).toHaveProperty('id');
        expect(firstAchievement).toHaveProperty('name');
        expect(firstAchievement).toHaveProperty('description');
        expect(firstAchievement).toHaveProperty('unlocked');
        expect(firstAchievement).toHaveProperty('progress');
        expect(firstAchievement).toHaveProperty('maxProgress');
        expect(firstAchievement).toHaveProperty('percentComplete');
      });
    });

    it('sets percentComplete to 0 for locked achievements', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        const lockedAchievement = result.current.achievements.find(a => !a.unlocked);
        expect(lockedAchievement).toBeDefined();
        expect(lockedAchievement!.percentComplete).toBe(0);
      });
    });

    it('sets percentComplete to 100 for unlocked achievements', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      await waitFor(() => {
        const unlockedAchievement = result.current.achievements.find(a => a.id === 'snake_first_apple');
        expect(unlockedAchievement).toBeDefined();
        expect(unlockedAchievement!.percentComplete).toBe(100);
      });
    });

    it('updates unlocked status after unlock', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        const achievement = result.current.achievements.find(a => a.id === 'snake_first_apple');
        expect(achievement!.unlocked).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      await waitFor(() => {
        const achievement = result.current.achievements.find(a => a.id === 'snake_first_apple');
        expect(achievement!.unlocked).toBe(true);
      });
    });
  });

  describe('Save System Pass-through Methods', () => {
    it('exposes getSaveData method', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(typeof result.current.getSaveData).toBe('function');
        const saveData = result.current.getSaveData();
        expect(saveData).toBeDefined();
        expect(saveData.version).toBe('1.1.0');
      });
    });

    it('exposes clearSaveData method', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(typeof result.current.clearSaveData).toBe('function');
      });
    });

    it('exposes exportSaveData method', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(typeof result.current.exportSaveData).toBe('function');
      });
    });

    it('exposes importSaveData method', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(typeof result.current.importSaveData).toBe('function');
      });
    });

    it('exposes updateGlobalStats method', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(typeof result.current.updateGlobalStats).toBe('function');
      });
    });
  });

  describe('Function Stability', () => {
    it('dismissNotification maintains reference stability', async () => {
      const { result, rerender } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.dismissNotification).toBeDefined();
      });

      const firstRef = result.current.dismissNotification;
      rerender();
      const secondRef = result.current.dismissNotification;

      expect(firstRef).toBe(secondRef);
    });

    it('clearNotifications maintains reference stability', async () => {
      const { result, rerender } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.clearNotifications).toBeDefined();
      });

      const firstRef = result.current.clearNotifications;
      rerender();
      const secondRef = result.current.clearNotifications;

      expect(firstRef).toBe(secondRef);
    });

    it('toggleDisplay maintains reference stability', async () => {
      const { result, rerender } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.toggleDisplay).toBeDefined();
      });

      const firstRef = result.current.toggleDisplay;
      rerender();
      const secondRef = result.current.toggleDisplay;

      expect(firstRef).toBe(secondRef);
    });

    it('openDisplay maintains reference stability', async () => {
      const { result, rerender } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.openDisplay).toBeDefined();
      });

      const firstRef = result.current.openDisplay;
      rerender();
      const secondRef = result.current.openDisplay;

      expect(firstRef).toBe(secondRef);
    });

    it('closeDisplay maintains reference stability', async () => {
      const { result, rerender } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.closeDisplay).toBeDefined();
      });

      const firstRef = result.current.closeDisplay;
      rerender();
      const secondRef = result.current.closeDisplay;

      expect(firstRef).toBe(secondRef);
    });
  });

  describe('Game-specific Achievements', () => {
    it('supports VortexPong achievements', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('pong_first_point')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('vortexPong', 'pong_first_point');
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('pong_first_point')).toBe(true);
      });
    });

    it('supports MatrixCloud achievements', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('cloud_first_flight')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('matrixCloud', 'cloud_first_flight');
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('cloud_first_flight')).toBe(true);
      });
    });

    it('supports MatrixInvaders achievements', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('invaders_first_kill')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('matrixInvaders', 'invaders_first_kill');
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('invaders_first_kill')).toBe(true);
      });
    });

    it('supports CtrlSWorld achievements', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('ctrl_first_puzzle')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('ctrlSWorld', 'ctrl_first_puzzle');
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('ctrl_first_puzzle')).toBe(true);
      });
    });

    it('supports Metris achievements', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('first_line')).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('metris', 'first_line');
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('first_line')).toBe(true);
      });
    });
  });

  describe('Multiple Hook Instances', () => {
    it('multiple hook instances share same localStorage data', async () => {
      const { result: result1 } = renderHook(() => useAchievementManager());
      const { result: result2 } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result1.current.isUnlocked('snake_first_apple')).toBe(false);
        expect(result2.current.isUnlocked('snake_first_apple')).toBe(false);
      });

      // Unlock in first instance
      act(() => {
        result1.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      await waitFor(() => {
        expect(result1.current.isUnlocked('snake_first_apple')).toBe(true);
      });

      // Verify localStorage was updated
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.games.snakeClassic.achievements).toContain('snake_first_apple');
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid operations without crashing', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(false);
      });

      // Rapid operations
      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
        result.current.unlockAchievement('snakeClassic', 'snake_score_100');
        result.current.unlockAchievement('snakeClassic', 'snake_score_500');
        result.current.toggleDisplay();
        result.current.toggleDisplay();
        result.current.clearNotifications();
      });

      await waitFor(() => {
        expect(result.current.isUnlocked('snake_first_apple')).toBe(true);
        expect(result.current.isUnlocked('snake_score_100')).toBe(true);
        expect(result.current.isUnlocked('snake_score_500')).toBe(true);
      });
    });

    it('handles unlocking multiple achievements across games', async () => {
      const { result } = renderHook(() => useAchievementManager());

      await waitFor(() => {
        expect(result.current.stats.unlocked).toBe(0);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
        result.current.unlockAchievement('vortexPong', 'pong_first_point');
        result.current.unlockAchievement('matrixCloud', 'cloud_first_flight');
        result.current.unlockAchievement('matrixInvaders', 'invaders_first_kill');
      });

      await waitFor(() => {
        expect(result.current.stats.unlocked).toBe(4);
      });
    });
  });
});
