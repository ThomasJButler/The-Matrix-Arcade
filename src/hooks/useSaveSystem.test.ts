import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSaveSystem, GAME_ACHIEVEMENTS, GLOBAL_ACHIEVEMENTS, type GlobalSaveData, migrateSaveData } from './useSaveSystem';

// Storage key constants matching the hook
const STORAGE_KEY = 'matrix-arcade-save-data';
const BACKUP_KEY = 'matrix-arcade-backup';
const CURRENT_VERSION = '1.1.0';

describe('useSaveSystem', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialisation', () => {
    it('creates default save data when localStorage is empty', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.saveData.version).toBe(CURRENT_VERSION);
      expect(result.current.saveData.games.snakeClassic).toBeDefined();
      expect(result.current.saveData.games.vortexPong).toBeDefined();
      expect(result.current.saveData.games.matrixCloud).toBeDefined();
      expect(result.current.saveData.games.ctrlSWorld).toBeDefined();
      expect(result.current.saveData.games.matrixInvaders).toBeDefined();
      expect(result.current.saveData.games.metris).toBeDefined();
    });

    it('loads existing save data from localStorage', async () => {
      const existingData: GlobalSaveData = {
        version: '1.0.0',
        games: {
          snakeClassic: {
            highScore: 500,
            level: 3,
            achievements: ['snake_first_apple'],
            stats: { gamesPlayed: 10, totalScore: 2500 },
            lastPlayed: Date.now()
          },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: {
          totalPlayTime: 3600,
          favoriteGame: 'snakeClassic',
          globalAchievements: ['global_first_game'],
          firstPlayDate: Date.now()
        },
        settings: { autoSave: true }
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));

      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.saveData.games.snakeClassic.highScore).toBe(500);
      expect(result.current.saveData.games.snakeClassic.achievements).toContain('snake_first_apple');
      expect(result.current.saveData.globalStats.totalPlayTime).toBe(3600);
    });

    it('handles corrupted localStorage data gracefully', async () => {
      localStorage.setItem(STORAGE_KEY, 'not valid json{{{');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load save data');
      expect(result.current.saveData.version).toBe(CURRENT_VERSION);
      consoleSpy.mockRestore();
    });

    it('merges partial save data with defaults', async () => {
      // Old save data missing some games
      const partialData = {
        version: '1.0.0',
        games: {
          snakeClassic: {
            highScore: 100,
            level: 2,
            achievements: [],
            stats: { gamesPlayed: 5, totalScore: 500 },
            lastPlayed: Date.now()
          }
        },
        globalStats: {
          totalPlayTime: 1000,
          favoriteGame: '',
          globalAchievements: [],
          firstPlayDate: Date.now()
        },
        settings: { autoSave: true }
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(partialData));

      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have the saved snake data
      expect(result.current.saveData.games.snakeClassic.highScore).toBe(100);
      // Should have defaults for missing games
      expect(result.current.saveData.games.vortexPong).toBeDefined();
    });

    it('persists default data to localStorage on first load', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(CURRENT_VERSION);
    });
  });

  describe('updateGameSave', () => {
    it('updates high score for a game', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGameSave('snakeClassic', { highScore: 1000 });
      });

      expect(result.current.saveData.games.snakeClassic.highScore).toBe(1000);
    });

    it('updates game stats', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGameSave('vortexPong', {
          stats: {
            gamesPlayed: 5,
            totalScore: 2500,
            bestCombo: 10
          }
        });
      });

      expect(result.current.saveData.games.vortexPong.stats.gamesPlayed).toBe(5);
      expect(result.current.saveData.games.vortexPong.stats.totalScore).toBe(2500);
      expect(result.current.saveData.games.vortexPong.stats.bestCombo).toBe(10);
    });

    it('updates lastPlayed timestamp automatically', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const beforeUpdate = Date.now();

      act(() => {
        result.current.updateGameSave('matrixCloud', { level: 5 });
      });

      expect(result.current.saveData.games.matrixCloud.lastPlayed).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('auto-saves to localStorage when autoSave is enabled', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGameSave('metris', { highScore: 5000 });
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.games.metris.highScore).toBe(5000);
    });

    it('preserves existing data when updating', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGameSave('snakeClassic', { highScore: 100 });
      });

      act(() => {
        result.current.updateGameSave('snakeClassic', { level: 5 });
      });

      expect(result.current.saveData.games.snakeClassic.highScore).toBe(100);
      expect(result.current.saveData.games.snakeClassic.level).toBe(5);
    });

    it('updates preferences field', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

  });

  describe('unlockAchievement', () => {
    it('unlocks a game achievement', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      expect(result.current.saveData.games.snakeClassic.achievements).toContain('snake_first_apple');
    });

    it('does not duplicate achievements', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      const count = result.current.saveData.games.snakeClassic.achievements.filter(
        a => a === 'snake_first_apple'
      ).length;
      expect(count).toBe(1);
    });

    it('unlocks multiple different achievements', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_score_100');
      });

      expect(result.current.saveData.games.snakeClassic.achievements).toContain('snake_first_apple');
      expect(result.current.saveData.games.snakeClassic.achievements).toContain('snake_score_100');
    });

    it('auto-saves achievement unlock to localStorage', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('vortexPong', 'pong_first_point');
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.games.vortexPong.achievements).toContain('pong_first_point');
    });
  });

  describe('updateGlobalStats', () => {
    it('updates total play time', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGlobalStats({ totalPlayTime: 7200 });
      });

      expect(result.current.saveData.globalStats.totalPlayTime).toBe(7200);
    });

    it('updates favourite game', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGlobalStats({ favoriteGame: 'metris' });
      });

      expect(result.current.saveData.globalStats.favoriteGame).toBe('metris');
    });

    it('updates global achievements', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGlobalStats({
          globalAchievements: ['global_first_game', 'global_all_games']
        });
      });

      expect(result.current.saveData.globalStats.globalAchievements).toContain('global_first_game');
      expect(result.current.saveData.globalStats.globalAchievements).toContain('global_all_games');
    });

    it('preserves existing global stats when updating', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGlobalStats({ totalPlayTime: 5000 });
      });

      act(() => {
        result.current.updateGlobalStats({ favoriteGame: 'snakeClassic' });
      });

      expect(result.current.saveData.globalStats.totalPlayTime).toBe(5000);
      expect(result.current.saveData.globalStats.favoriteGame).toBe('snakeClassic');
    });
  });

  describe('clearSaveData', () => {
    it('resets save data to defaults', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGameSave('snakeClassic', { highScore: 9999 });
      });

      act(() => {
        result.current.clearSaveData();
      });

      expect(result.current.saveData.games.snakeClassic.highScore).toBe(0);
    });

    it('removes data from localStorage', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGameSave('snakeClassic', { highScore: 9999 });
      });

      act(() => {
        result.current.clearSaveData();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(BACKUP_KEY)).toBeNull();
    });

    it('returns true on success', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = false;
      act(() => {
        success = result.current.clearSaveData();
      });

      expect(success).toBe(true);
    });

    it('clears any previous errors', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.clearSaveData();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('saveNow', () => {
    it('manually saves current data to localStorage', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear localStorage to test manual save
      localStorage.clear();

      act(() => {
        result.current.saveNow();
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
    });

    it('returns true on successful save', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = false;
      act(() => {
        success = result.current.saveNow();
      });

      expect(success).toBe(true);
    });

    it('creates backup before saving', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First save
      act(() => {
        result.current.saveNow();
      });

      // Modify data
      act(() => {
        result.current.updateGameSave('snakeClassic', { highScore: 5000 });
      });

      // Check backup exists
      const backup = localStorage.getItem(BACKUP_KEY);
      expect(backup).not.toBeNull();
    });
  });

  describe('restoreFromBackup', () => {
    it('restores data from backup', async () => {
      const backupData: GlobalSaveData = {
        version: '1.0.0',
        games: {
          snakeClassic: { highScore: 999, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 0, favoriteGame: '', globalAchievements: [], firstPlayDate: Date.now() },
        settings: { autoSave: true }
      };

      localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));

      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = false;
      act(() => {
        success = result.current.restoreFromBackup();
      });

      expect(success).toBe(true);
      expect(result.current.saveData.games.snakeClassic.highScore).toBe(999);
    });

    it('returns false when no backup exists', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = true;
      act(() => {
        success = result.current.restoreFromBackup();
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('No backup found');
    });

    it('handles corrupted backup data', async () => {
      localStorage.setItem(BACKUP_KEY, 'invalid json');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = true;
      act(() => {
        success = result.current.restoreFromBackup();
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to restore from backup');
      consoleSpy.mockRestore();
    });
  });

  describe('loadSaveData', () => {
    it('reloads data from localStorage', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Externally modify localStorage
      const newData = {
        ...result.current.saveData,
        games: {
          ...result.current.saveData.games,
          snakeClassic: {
            ...result.current.saveData.games.snakeClassic,
            highScore: 12345
          }
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

      // Reload
      act(() => {
        result.current.loadSaveData();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.saveData.games.snakeClassic.highScore).toBe(12345);
    });
  });

  describe('isAchievementUnlocked', () => {
    it('returns true for unlocked achievements', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      expect(result.current.isAchievementUnlocked('snakeClassic', 'snake_first_apple')).toBe(true);
    });

    it('returns false for locked achievements', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAchievementUnlocked('snakeClassic', 'snake_first_apple')).toBe(false);
    });
  });

  describe('getGameAchievements', () => {
    it('returns achievement definitions for a game', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const achievements = result.current.getGameAchievements('snakeClassic');

      expect(achievements.length).toBeGreaterThan(0);
      expect(achievements[0]).toHaveProperty('id');
      expect(achievements[0]).toHaveProperty('name');
      expect(achievements[0]).toHaveProperty('description');
    });

    it('returns empty array for unknown game', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const achievements = result.current.getGameAchievements('unknownGame' as keyof GlobalSaveData['games']);
      expect(achievements).toEqual([]);
    });
  });

  describe('achievements computed property', () => {
    it('returns all achievements with unlock status', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.unlockAchievement('snakeClassic', 'snake_first_apple');
      });

      const allAchievements = result.current.achievements;

      // Should include game achievements
      const snakeAchievement = allAchievements.find(a => a.id === 'snake_first_apple');
      expect(snakeAchievement).toBeDefined();
      expect(snakeAchievement?.unlocked).toBe(true);

      // Should include locked achievements
      const lockedAchievement = allAchievements.find(a => a.id === 'snake_score_500');
      expect(lockedAchievement).toBeDefined();
      expect(lockedAchievement?.unlocked).toBe(false);

      // Should include global achievements
      const globalAchievement = allAchievements.find(a => a.id === 'global_first_game');
      expect(globalAchievement).toBeDefined();
    });

    it('includes all games achievements', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const allAchievements = result.current.achievements;

      // Count total expected achievements
      const gameAchievementCount = Object.values(GAME_ACHIEVEMENTS).reduce(
        (sum, achievements) => sum + achievements.length,
        0
      );
      const globalAchievementCount = GLOBAL_ACHIEVEMENTS.length;
      const expectedTotal = gameAchievementCount + globalAchievementCount;

      expect(allAchievements.length).toBe(expectedTotal);
    });
  });

  describe('GAME_ACHIEVEMENTS constant', () => {
    it('has achievements for all 6 games', () => {
      expect(GAME_ACHIEVEMENTS.snakeClassic).toBeDefined();
      expect(GAME_ACHIEVEMENTS.vortexPong).toBeDefined();
      expect(GAME_ACHIEVEMENTS.matrixCloud).toBeDefined();
      expect(GAME_ACHIEVEMENTS.matrixInvaders).toBeDefined();
      expect(GAME_ACHIEVEMENTS.ctrlSWorld).toBeDefined();
      expect(GAME_ACHIEVEMENTS.metris).toBeDefined();
    });

    it('has valid achievement structures', () => {
      Object.entries(GAME_ACHIEVEMENTS).forEach(([_gameId, achievements]) => {
        achievements.forEach(achievement => {
          expect(achievement.id).toBeTruthy();
          expect(achievement.name).toBeTruthy();
          expect(achievement.description).toBeTruthy();
          expect(achievement.game).toBeTruthy();
        });
      });
    });

    it('has unique achievement IDs', () => {
      const allIds: string[] = [];
      Object.values(GAME_ACHIEVEMENTS).forEach(achievements => {
        achievements.forEach(achievement => {
          expect(allIds).not.toContain(achievement.id);
          allIds.push(achievement.id);
        });
      });
    });
  });

  describe('GLOBAL_ACHIEVEMENTS constant', () => {
    it('has meta achievements defined', () => {
      expect(GLOBAL_ACHIEVEMENTS.length).toBeGreaterThan(0);
    });

    it('has valid achievement structures', () => {
      GLOBAL_ACHIEVEMENTS.forEach(achievement => {
        expect(achievement.id).toBeTruthy();
        expect(achievement.name).toBeTruthy();
        expect(achievement.description).toBeTruthy();
      });
    });

    it('has unique achievement IDs', () => {
      const ids = GLOBAL_ACHIEVEMENTS.map(a => a.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('includes expected global achievements', () => {
      const ids = GLOBAL_ACHIEVEMENTS.map(a => a.id);
      expect(ids).toContain('global_first_game');
      expect(ids).toContain('global_all_games');
      expect(ids).toContain('global_10_achievements');
    });
  });

  describe('Edge Cases', () => {
    it('handles concurrent updates correctly', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Multiple rapid updates
      act(() => {
        result.current.updateGameSave('snakeClassic', { highScore: 100 });
        result.current.updateGameSave('snakeClassic', { highScore: 200 });
        result.current.updateGameSave('snakeClassic', { highScore: 300 });
      });

      expect(result.current.saveData.games.snakeClassic.highScore).toBe(300);
    });

    it('handles empty achievements array gracefully', async () => {
      const dataWithEmptyAchievements = {
        version: '1.0.0',
        games: {
          snakeClassic: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 0, favoriteGame: '', globalAchievements: [], firstPlayDate: Date.now() },
        settings: { autoSave: true }
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithEmptyAchievements));

      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not throw when checking achievements
      expect(result.current.isAchievementUnlocked('snakeClassic', 'snake_first_apple')).toBe(false);
    });

    it('handles very large high scores', async () => {
      const { result } = renderHook(() => useSaveSystem());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateGameSave('snakeClassic', { highScore: Number.MAX_SAFE_INTEGER });
      });

      expect(result.current.saveData.games.snakeClassic.highScore).toBe(Number.MAX_SAFE_INTEGER);

      // Should persist correctly
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.games.snakeClassic.highScore).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('migrateSaveData', () => {
    it('migrates from 1.0.0 to 1.1.0', () => {
      const oldData: GlobalSaveData = {
        version: '1.0.0',
        games: {
          snakeClassic: { highScore: 100, level: 2, achievements: ['snake_first_apple'], stats: { gamesPlayed: 5, totalScore: 500 }, lastPlayed: Date.now() },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 1000, favoriteGame: 'snakeClassic', globalAchievements: [], firstPlayDate: Date.now() },
        settings: { autoSave: true }
      };

      const migrated = migrateSaveData(oldData);

      expect(migrated.version).toBe('1.1.0');
      // Should preserve existing data
      expect(migrated.games.snakeClassic.highScore).toBe(100);
      expect(migrated.games.snakeClassic.achievements).toContain('snake_first_apple');
      expect(migrated.globalStats.totalPlayTime).toBe(1000);
    });

    it('adds missing ctrlSWorld lifelineData and ctrlSGameState', () => {
      const oldData: GlobalSaveData = {
        version: '1.0.0',
        games: {
          snakeClassic: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 0, favoriteGame: '', globalAchievements: [], firstPlayDate: Date.now() },
        settings: { autoSave: true }
      };

      const migrated = migrateSaveData(oldData);

      expect(migrated.games.ctrlSWorld.lifelineData).toBeDefined();
      expect(migrated.games.ctrlSWorld.lifelineData?.freeAnswersRemaining).toBe(10);
      expect(migrated.games.ctrlSWorld.ctrlSGameState).toBeDefined();
      expect(migrated.games.ctrlSWorld.ctrlSGameState?.currentChapter).toBe(1);
    });

    it('adds missing playDates array to globalStats', () => {
      const oldData = {
        version: '1.0.0',
        games: {
          snakeClassic: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          terminalQuest: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 0, favoriteGame: '', globalAchievements: [], firstPlayDate: Date.now() },
        settings: { autoSave: true }
      } as GlobalSaveData;

      const migrated = migrateSaveData(oldData);

      expect(migrated.globalStats.playDates).toBeDefined();
      expect(Array.isArray(migrated.globalStats.playDates)).toBe(true);
    });

    it('fills in missing stats fields with defaults', () => {
      const oldData = {
        version: '1.0.0',
        games: {
          snakeClassic: { highScore: 100, level: 2, achievements: [], stats: { gamesPlayed: 5 }, lastPlayed: Date.now() },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: {}, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          terminalQuest: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 0, favoriteGame: '', globalAchievements: [], firstPlayDate: Date.now() },
        settings: { autoSave: true }
      } as GlobalSaveData;

      const migrated = migrateSaveData(oldData);

      // Should preserve existing value
      expect(migrated.games.snakeClassic.stats.gamesPlayed).toBe(5);
      // Should add missing fields with defaults
      expect(migrated.games.snakeClassic.stats.totalScore).toBe(0);
      expect(migrated.games.snakeClassic.stats.bestCombo).toBe(0);
      expect(migrated.games.vortexPong.stats.gamesPlayed).toBe(0);
    });

    it('handles data without version (pre-1.0.0)', () => {
      const oldData = {
        games: {
          snakeClassic: { highScore: 50, level: 1, achievements: [], stats: { gamesPlayed: 2, totalScore: 100 }, lastPlayed: Date.now() },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          terminalQuest: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 0, favoriteGame: '', globalAchievements: [], firstPlayDate: Date.now() },
        settings: { autoSave: true }
      } as GlobalSaveData;

      const migrated = migrateSaveData(oldData);

      expect(migrated.version).toBe('1.1.0');
      expect(migrated.games.snakeClassic.highScore).toBe(50);
    });

    it('handles unknown version gracefully', () => {
      const oldData = {
        version: '0.5.0',
        games: {
          snakeClassic: { highScore: 25, level: 1, achievements: [], stats: { gamesPlayed: 1, totalScore: 50 }, lastPlayed: Date.now() },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          terminalQuest: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 0, favoriteGame: '', globalAchievements: [], firstPlayDate: Date.now() },
        settings: { autoSave: true }
      } as GlobalSaveData;

      const migrated = migrateSaveData(oldData);

      expect(migrated.version).toBe('1.1.0');
      expect(migrated.games.snakeClassic.highScore).toBe(25);
    });

    it('does not modify data at current version', () => {
      const currentData: GlobalSaveData = {
        version: '1.1.0',
        games: {
          snakeClassic: { highScore: 200, level: 3, achievements: ['snake_first_apple', 'snake_score_100'], stats: { gamesPlayed: 10, totalScore: 1000, bestCombo: 5 }, lastPlayed: Date.now() },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          terminalQuest: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 5000, favoriteGame: 'snakeClassic', globalAchievements: ['global_first_game'], firstPlayDate: Date.now(), playDates: ['2026-01-26'] },
        settings: { autoSave: true }
      };

      const migrated = migrateSaveData(currentData);

      expect(migrated.version).toBe('1.1.0');
      expect(migrated.games.snakeClassic.highScore).toBe(200);
      expect(migrated.globalStats.totalPlayTime).toBe(5000);
    });

    it('adds missing game entries', () => {
      const oldData = {
        version: '1.0.0',
        games: {
          snakeClassic: { highScore: 100, level: 2, achievements: [], stats: { gamesPlayed: 5, totalScore: 500 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 0, favoriteGame: '', globalAchievements: [], firstPlayDate: Date.now() },
        settings: { autoSave: true }
      } as unknown as GlobalSaveData;

      const migrated = migrateSaveData(oldData);

      // Should preserve existing game
      expect(migrated.games.snakeClassic.highScore).toBe(100);
      // Should add missing games
      expect(migrated.games.vortexPong).toBeDefined();
      expect(migrated.games.matrixCloud).toBeDefined();
      expect(migrated.games.ctrlSWorld).toBeDefined();
      expect(migrated.games.matrixInvaders).toBeDefined();
      expect(migrated.games.metris).toBeDefined();
      expect(migrated.games.terminalQuest).toBeDefined();
    });

    it('preserves achievements array during migration', () => {
      const oldData: GlobalSaveData = {
        version: '1.0.0',
        games: {
          snakeClassic: { highScore: 500, level: 5, achievements: ['snake_first_apple', 'snake_score_100', 'snake_score_500'], stats: { gamesPlayed: 20, totalScore: 5000 }, lastPlayed: Date.now() },
          vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
          terminalQuest: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() }
        },
        globalStats: { totalPlayTime: 3600, favoriteGame: 'snakeClassic', globalAchievements: ['global_first_game', 'global_10_achievements'], firstPlayDate: Date.now() },
        settings: { autoSave: true }
      };

      const migrated = migrateSaveData(oldData);

      expect(migrated.games.snakeClassic.achievements).toHaveLength(3);
      expect(migrated.games.snakeClassic.achievements).toContain('snake_first_apple');
      expect(migrated.games.snakeClassic.achievements).toContain('snake_score_100');
      expect(migrated.games.snakeClassic.achievements).toContain('snake_score_500');
      expect(migrated.globalStats.globalAchievements).toHaveLength(2);
    });
  });
});
