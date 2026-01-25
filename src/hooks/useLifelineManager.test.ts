import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLifelineManager } from './useLifelineManager';
import { createDefaultLifelineData } from './useSaveSystem';

// Mock useSaveSystem to control its behaviour in tests
const mockUpdateGameSave = vi.fn();
let mockLifelineData = createDefaultLifelineData();

vi.mock('./useSaveSystem', async () => {
  const actual = await vi.importActual('./useSaveSystem');
  return {
    ...actual,
    useSaveSystem: () => ({
      saveData: {
        games: {
          ctrlSWorld: {
            lifelineData: mockLifelineData
          }
        }
      },
      updateGameSave: mockUpdateGameSave,
      isLoading: false
    })
  };
});

// Legacy localStorage key matching the hook
const LEGACY_STORAGE_KEY = 'ctrlsworld_lifelines';

describe('useLifelineManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset mock lifeline data to defaults
    mockLifelineData = createDefaultLifelineData();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialisation', () => {
    it('initialises with default lifeline state', () => {
      const { result } = renderHook(() => useLifelineManager());

      expect(result.current.freeAnswersRemaining).toBe(10);
      expect(result.current.stats.totalFreeAnswersUsed).toBe(0);
      expect(result.current.stats.totalFiftyFiftyUsed).toBe(0);
      expect(result.current.stats.totalSentientAIUsed).toBe(0);
      expect(result.current.stats.totalCharactersUsed).toBe(0);
      expect(result.current.stats.totalPuzzlesCompletedWithHelp).toBe(0);
    });

    it('loads existing lifeline data from save system', () => {
      mockLifelineData = {
        freeAnswersRemaining: 5,
        usedLifelines: {
          fiftyFifty: ['puzzle1', 'puzzle2'],
          sentientAI: ['puzzle3'],
          characters: []
        },
        stats: {
          totalFreeAnswersUsed: 5,
          totalFiftyFiftyUsed: 2,
          totalSentientAIUsed: 1,
          totalCharactersUsed: 0,
          totalPuzzlesCompletedWithHelp: 3
        }
      };

      const { result } = renderHook(() => useLifelineManager());

      expect(result.current.freeAnswersRemaining).toBe(5);
      expect(result.current.stats.totalFreeAnswersUsed).toBe(5);
      expect(result.current.stats.totalFiftyFiftyUsed).toBe(2);
    });

    it('handles corrupted legacy data gracefully', () => {
      localStorage.setItem(LEGACY_STORAGE_KEY, 'not valid json{{{');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useLifelineManager());

      // Should fall back to defaults
      expect(result.current.freeAnswersRemaining).toBe(10);
      consoleSpy.mockRestore();
    });
  });

  describe('isLifelineAvailable', () => {
    it('returns true for freeAnswer when answers remain', () => {
      const { result } = renderHook(() => useLifelineManager());

      expect(result.current.isLifelineAvailable('freeAnswer', 'any_puzzle')).toBe(true);
    });

    it('returns false for freeAnswer when none remain', () => {
      mockLifelineData = {
        ...createDefaultLifelineData(),
        freeAnswersRemaining: 0
      };

      const { result } = renderHook(() => useLifelineManager());

      expect(result.current.isLifelineAvailable('freeAnswer', 'any_puzzle')).toBe(false);
    });

    it('returns true for fiftyFifty on new puzzle', () => {
      const { result } = renderHook(() => useLifelineManager());

      expect(result.current.isLifelineAvailable('fiftyFifty', 'new_puzzle')).toBe(true);
    });

    it('returns false for fiftyFifty on already-used puzzle', () => {
      mockLifelineData = {
        ...createDefaultLifelineData(),
        usedLifelines: {
          fiftyFifty: ['used_puzzle'],
          sentientAI: [],
          characters: []
        }
      };

      const { result } = renderHook(() => useLifelineManager());

      expect(result.current.isLifelineAvailable('fiftyFifty', 'used_puzzle')).toBe(false);
      expect(result.current.isLifelineAvailable('fiftyFifty', 'other_puzzle')).toBe(true);
    });

    it('returns true for sentientAI on new puzzle', () => {
      const { result } = renderHook(() => useLifelineManager());

      expect(result.current.isLifelineAvailable('sentientAI', 'new_puzzle')).toBe(true);
    });

    it('returns false for sentientAI on already-used puzzle', () => {
      mockLifelineData = {
        ...createDefaultLifelineData(),
        usedLifelines: {
          fiftyFifty: [],
          sentientAI: ['used_puzzle'],
          characters: []
        }
      };

      const { result } = renderHook(() => useLifelineManager());

      expect(result.current.isLifelineAvailable('sentientAI', 'used_puzzle')).toBe(false);
    });

    it('returns true for characters on new puzzle', () => {
      const { result } = renderHook(() => useLifelineManager());

      expect(result.current.isLifelineAvailable('characters', 'new_puzzle')).toBe(true);
    });

    it('returns false for characters on already-used puzzle', () => {
      mockLifelineData = {
        ...createDefaultLifelineData(),
        usedLifelines: {
          fiftyFifty: [],
          sentientAI: [],
          characters: ['used_puzzle']
        }
      };

      const { result } = renderHook(() => useLifelineManager());

      expect(result.current.isLifelineAvailable('characters', 'used_puzzle')).toBe(false);
    });
  });

  describe('useFreeAnswer', () => {
    it('decrements free answers and returns success', () => {
      const { result } = renderHook(() => useLifelineManager());

      let response: ReturnType<typeof result.current.useFreeAnswer>;
      act(() => {
        response = result.current.useFreeAnswer();
      });

      expect(response!.success).toBe(true);
      expect(response!.remaining).toBe(9);
      expect(response!.penalties).toEqual({ wisdom: -5, reputation: -3 });
      expect(result.current.freeAnswersRemaining).toBe(9);
    });

    it('updates stats when using free answer', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useFreeAnswer();
      });

      expect(result.current.stats.totalFreeAnswersUsed).toBe(1);
      expect(result.current.stats.totalPuzzlesCompletedWithHelp).toBe(1);
    });

    it('persists state change to save system', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useFreeAnswer();
      });

      expect(mockUpdateGameSave).toHaveBeenCalledWith('ctrlSWorld', {
        lifelineData: expect.objectContaining({
          freeAnswersRemaining: 9,
          stats: expect.objectContaining({
            totalFreeAnswersUsed: 1
          })
        })
      });
    });

    it('returns failure when no free answers remain', () => {
      mockLifelineData = {
        ...createDefaultLifelineData(),
        freeAnswersRemaining: 0
      };

      const { result } = renderHook(() => useLifelineManager());

      let response: ReturnType<typeof result.current.useFreeAnswer>;
      act(() => {
        response = result.current.useFreeAnswer();
      });

      expect(response!.success).toBe(false);
      expect(response!.remaining).toBe(0);
      expect(response!.penalties).toEqual({ wisdom: 0, reputation: 0 });
    });

    it('allows using multiple free answers in sequence', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useFreeAnswer();
      });

      act(() => {
        result.current.useFreeAnswer();
      });

      act(() => {
        result.current.useFreeAnswer();
      });

      expect(result.current.freeAnswersRemaining).toBe(7);
      expect(result.current.stats.totalFreeAnswersUsed).toBe(3);
    });
  });

  describe('useFiftyFifty', () => {
    it('marks puzzle as used and returns true on first use', () => {
      const { result } = renderHook(() => useLifelineManager());

      let success: boolean;
      act(() => {
        success = result.current.useFiftyFifty('puzzle_1');
      });

      expect(success!).toBe(true);
      expect(result.current.stats.totalFiftyFiftyUsed).toBe(1);
    });

    it('returns false when already used on same puzzle', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useFiftyFifty('puzzle_1');
      });

      let secondAttempt: boolean;
      act(() => {
        secondAttempt = result.current.useFiftyFifty('puzzle_1');
      });

      expect(secondAttempt!).toBe(false);
      expect(result.current.stats.totalFiftyFiftyUsed).toBe(1); // Still 1
    });

    it('allows use on different puzzles', () => {
      const { result } = renderHook(() => useLifelineManager());

      let first: boolean;
      act(() => {
        first = result.current.useFiftyFifty('puzzle_1');
      });

      let second: boolean;
      act(() => {
        second = result.current.useFiftyFifty('puzzle_2');
      });

      expect(first!).toBe(true);
      expect(second!).toBe(true);
      expect(result.current.stats.totalFiftyFiftyUsed).toBe(2);
    });

    it('persists used puzzle to save system', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useFiftyFifty('test_puzzle');
      });

      expect(mockUpdateGameSave).toHaveBeenCalledWith('ctrlSWorld', {
        lifelineData: expect.objectContaining({
          usedLifelines: expect.objectContaining({
            fiftyFifty: ['test_puzzle']
          })
        })
      });
    });
  });

  describe('useSentientAI', () => {
    it('marks puzzle as used and returns true on first use', () => {
      const { result } = renderHook(() => useLifelineManager());

      let success: boolean;
      act(() => {
        success = result.current.useSentientAI('ai_puzzle');
      });

      expect(success!).toBe(true);
      expect(result.current.stats.totalSentientAIUsed).toBe(1);
    });

    it('returns false when already used on same puzzle', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useSentientAI('ai_puzzle');
      });

      let secondAttempt: boolean;
      act(() => {
        secondAttempt = result.current.useSentientAI('ai_puzzle');
      });

      expect(secondAttempt!).toBe(false);
    });

    it('persists used puzzle to save system', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useSentientAI('ai_test');
      });

      expect(mockUpdateGameSave).toHaveBeenCalledWith('ctrlSWorld', {
        lifelineData: expect.objectContaining({
          usedLifelines: expect.objectContaining({
            sentientAI: ['ai_test']
          })
        })
      });
    });
  });

  describe('useCharacters', () => {
    it('marks puzzle as used and returns true on first use', () => {
      const { result } = renderHook(() => useLifelineManager());

      let success: boolean;
      act(() => {
        success = result.current.useCharacters('char_puzzle');
      });

      expect(success!).toBe(true);
      expect(result.current.stats.totalCharactersUsed).toBe(1);
    });

    it('returns false when already used on same puzzle', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useCharacters('char_puzzle');
      });

      let secondAttempt: boolean;
      act(() => {
        secondAttempt = result.current.useCharacters('char_puzzle');
      });

      expect(secondAttempt!).toBe(false);
    });

    it('persists used puzzle to save system', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useCharacters('char_test');
      });

      expect(mockUpdateGameSave).toHaveBeenCalledWith('ctrlSWorld', {
        lifelineData: expect.objectContaining({
          usedLifelines: expect.objectContaining({
            characters: ['char_test']
          })
        })
      });
    });
  });

  describe('resetLifelines', () => {
    it('resets all lifeline state to defaults', () => {
      mockLifelineData = {
        freeAnswersRemaining: 2,
        usedLifelines: {
          fiftyFifty: ['p1', 'p2'],
          sentientAI: ['p3'],
          characters: ['p4', 'p5']
        },
        stats: {
          totalFreeAnswersUsed: 8,
          totalFiftyFiftyUsed: 2,
          totalSentientAIUsed: 1,
          totalCharactersUsed: 2,
          totalPuzzlesCompletedWithHelp: 5
        }
      };

      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.resetLifelines();
      });

      expect(result.current.freeAnswersRemaining).toBe(10);
      expect(result.current.stats.totalFreeAnswersUsed).toBe(0);
      expect(result.current.stats.totalFiftyFiftyUsed).toBe(0);
      expect(result.current.stats.totalSentientAIUsed).toBe(0);
      expect(result.current.stats.totalCharactersUsed).toBe(0);
    });

    it('persists reset state to save system', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useFreeAnswer();
      });

      act(() => {
        result.current.useFiftyFifty('puzzle');
      });

      mockUpdateGameSave.mockClear();

      act(() => {
        result.current.resetLifelines();
      });

      expect(mockUpdateGameSave).toHaveBeenCalledWith('ctrlSWorld', {
        lifelineData: expect.objectContaining({
          freeAnswersRemaining: 10,
          stats: expect.objectContaining({
            totalFreeAnswersUsed: 0
          })
        })
      });
    });

    it('allows using lifelines again after reset', () => {
      const { result } = renderHook(() => useLifelineManager());

      // Use a lifeline
      act(() => {
        result.current.useFiftyFifty('puzzle_1');
      });

      expect(result.current.isLifelineAvailable('fiftyFifty', 'puzzle_1')).toBe(false);

      // Reset
      act(() => {
        result.current.resetLifelines();
      });

      // Should be available again
      expect(result.current.isLifelineAvailable('fiftyFifty', 'puzzle_1')).toBe(true);
    });
  });

  describe('getStats', () => {
    it('returns current stats object', () => {
      const { result } = renderHook(() => useLifelineManager());

      const stats = result.current.getStats();

      expect(stats).toEqual({
        totalFreeAnswersUsed: 0,
        totalFiftyFiftyUsed: 0,
        totalSentientAIUsed: 0,
        totalCharactersUsed: 0,
        totalPuzzlesCompletedWithHelp: 0
      });
    });

    it('reflects changes after using lifelines', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useFreeAnswer();
      });

      act(() => {
        result.current.useFiftyFifty('puzzle_1');
      });

      act(() => {
        result.current.useSentientAI('puzzle_2');
      });

      act(() => {
        result.current.useCharacters('puzzle_3');
      });

      const stats = result.current.getStats();

      expect(stats.totalFreeAnswersUsed).toBe(1);
      expect(stats.totalFiftyFiftyUsed).toBe(1);
      expect(stats.totalSentientAIUsed).toBe(1);
      expect(stats.totalCharactersUsed).toBe(1);
      expect(stats.totalPuzzlesCompletedWithHelp).toBe(1);
    });
  });

  describe('Multiple lifelines on same puzzle', () => {
    it('allows different lifeline types on the same puzzle', () => {
      const { result } = renderHook(() => useLifelineManager());

      let fifty: boolean;
      act(() => {
        fifty = result.current.useFiftyFifty('puzzle_1');
      });

      let ai: boolean;
      act(() => {
        ai = result.current.useSentientAI('puzzle_1');
      });

      let char: boolean;
      act(() => {
        char = result.current.useCharacters('puzzle_1');
      });

      expect(fifty!).toBe(true);
      expect(ai!).toBe(true);
      expect(char!).toBe(true);
    });

    it('tracks each lifeline type independently per puzzle', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useFiftyFifty('puzzle_1');
      });

      // Different lifeline types should still be available
      expect(result.current.isLifelineAvailable('sentientAI', 'puzzle_1')).toBe(true);
      expect(result.current.isLifelineAvailable('characters', 'puzzle_1')).toBe(true);

      // But fiftyFifty should not
      expect(result.current.isLifelineAvailable('fiftyFifty', 'puzzle_1')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('handles empty puzzle ID', () => {
      const { result } = renderHook(() => useLifelineManager());

      let success: boolean;
      act(() => {
        success = result.current.useFiftyFifty('');
      });

      expect(success!).toBe(true);

      // Should still track it
      expect(result.current.isLifelineAvailable('fiftyFifty', '')).toBe(false);
    });

    it('handles special characters in puzzle ID', () => {
      const { result } = renderHook(() => useLifelineManager());

      const specialId = 'puzzle-with_special.chars!@#$%';

      let success: boolean;
      act(() => {
        success = result.current.useFiftyFifty(specialId);
      });

      expect(success!).toBe(true);
      expect(result.current.isLifelineAvailable('fiftyFifty', specialId)).toBe(false);
    });

    it('handles rapid successive calls correctly', () => {
      const { result } = renderHook(() => useLifelineManager());

      // Use all free answers one at a time
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.useFreeAnswer();
        });
      }

      // Try one more - should fail
      let lastResponse: ReturnType<typeof result.current.useFreeAnswer>;
      act(() => {
        lastResponse = result.current.useFreeAnswer();
      });

      // Should cap at 0
      expect(result.current.freeAnswersRemaining).toBe(0);
      expect(result.current.stats.totalFreeAnswersUsed).toBe(10);
      expect(lastResponse!.success).toBe(false);
    });

    it('maintains state consistency across multiple operations', () => {
      const { result } = renderHook(() => useLifelineManager());

      act(() => {
        result.current.useFreeAnswer();
      });

      act(() => {
        result.current.useFiftyFifty('p1');
      });

      act(() => {
        result.current.useFreeAnswer();
      });

      act(() => {
        result.current.useSentientAI('p2');
      });

      act(() => {
        result.current.useCharacters('p1');
      });

      act(() => {
        result.current.useFiftyFifty('p2');
      });

      expect(result.current.freeAnswersRemaining).toBe(8);
      expect(result.current.stats.totalFreeAnswersUsed).toBe(2);
      expect(result.current.stats.totalFiftyFiftyUsed).toBe(2);
      expect(result.current.stats.totalSentientAIUsed).toBe(1);
      expect(result.current.stats.totalCharactersUsed).toBe(1);
      expect(result.current.stats.totalPuzzlesCompletedWithHelp).toBe(2);
    });
  });

  describe('Legacy migration', () => {
    it('calls updateGameSave when legacy data is found', () => {
      const legacyData = {
        freeAnswersRemaining: 5,
        usedLifelines: {
          fiftyFifty: ['old_puzzle'],
          sentientAI: [],
          characters: []
        },
        stats: {
          totalFreeAnswersUsed: 5,
          totalFiftyFiftyUsed: 1,
          totalSentientAIUsed: 0,
          totalCharactersUsed: 0,
          totalPuzzlesCompletedWithHelp: 1
        }
      };

      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyData));

      renderHook(() => useLifelineManager());

      // Should have called updateGameSave with migrated data
      expect(mockUpdateGameSave).toHaveBeenCalledWith('ctrlSWorld', {
        lifelineData: expect.objectContaining({
          freeAnswersRemaining: 5
        })
      });

      // Legacy key should be removed after migration
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });

    it('handles missing stats in legacy data', () => {
      const partialLegacy = {
        freeAnswersRemaining: 7
        // Missing usedLifelines and stats
      };

      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(partialLegacy));

      renderHook(() => useLifelineManager());

      // Should call updateGameSave with defaults for missing fields
      expect(mockUpdateGameSave).toHaveBeenCalledWith('ctrlSWorld', {
        lifelineData: expect.objectContaining({
          freeAnswersRemaining: 7,
          stats: expect.objectContaining({
            totalFreeAnswersUsed: 0
          })
        })
      });
    });

    it('only migrates once per session', () => {
      const legacyData = {
        freeAnswersRemaining: 3,
        usedLifelines: { fiftyFifty: [], sentientAI: [], characters: [] },
        stats: {
          totalFreeAnswersUsed: 0,
          totalFiftyFiftyUsed: 0,
          totalSentientAIUsed: 0,
          totalCharactersUsed: 0,
          totalPuzzlesCompletedWithHelp: 0
        }
      };

      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyData));

      const { rerender } = renderHook(() => useLifelineManager());

      // First render should migrate
      expect(mockUpdateGameSave).toHaveBeenCalledTimes(1);

      // Add legacy data again (simulating it wasn't properly removed)
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyData));

      // Rerender
      rerender();

      // Should not migrate again within same session
      // (hasMigrated ref prevents duplicate migrations)
      expect(mockUpdateGameSave).toHaveBeenCalledTimes(1);
    });
  });
});
