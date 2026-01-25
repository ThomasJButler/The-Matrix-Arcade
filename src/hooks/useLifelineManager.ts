import { useState, useCallback, useEffect, useRef } from 'react';
import { useSaveSystem, createDefaultLifelineData, type LifelineData } from './useSaveSystem';

// ============================================================================
// LIFELINE MANAGER HOOK
// Manages lifeline state across all puzzles in CTRL-S The World
// Now integrated with useSaveSystem for unified persistence
// ============================================================================

// Legacy localStorage key - used for one-time migration only
const LEGACY_STORAGE_KEY = 'ctrlsworld_lifelines';
const INITIAL_FREE_ANSWERS = 10;

// Internal state with Sets for efficient lookup (converted to/from arrays for storage)
export interface LifelineState {
  freeAnswersRemaining: number;
  usedLifelines: {
    fiftyFifty: Set<string>;      // puzzle IDs where 50/50 was used
    sentientAI: Set<string>;       // puzzle IDs where AI was asked
    characters: Set<string>;       // puzzle IDs where characters were asked
  };
  stats: {
    totalFreeAnswersUsed: number;
    totalFiftyFiftyUsed: number;
    totalSentientAIUsed: number;
    totalCharactersUsed: number;
    totalPuzzlesCompletedWithHelp: number;
  };
}

// Convert storage format (arrays) to internal format (Sets)
const storageToState = (data: LifelineData): LifelineState => ({
  ...data,
  usedLifelines: {
    fiftyFifty: new Set(data.usedLifelines.fiftyFifty || []),
    sentientAI: new Set(data.usedLifelines.sentientAI || []),
    characters: new Set(data.usedLifelines.characters || []),
  }
});

// Convert internal format (Sets) to storage format (arrays)
const stateToStorage = (state: LifelineState): LifelineData => ({
  ...state,
  usedLifelines: {
    fiftyFifty: Array.from(state.usedLifelines.fiftyFifty),
    sentientAI: Array.from(state.usedLifelines.sentientAI),
    characters: Array.from(state.usedLifelines.characters),
  }
});

// Check for and migrate legacy localStorage data
const migrateLegacyData = (): LifelineData | null => {
  try {
    const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyData) {
      const parsed = JSON.parse(legacyData);
      // Convert legacy format to new format (arrays are already arrays in storage)
      const migrated: LifelineData = {
        freeAnswersRemaining: parsed.freeAnswersRemaining ?? INITIAL_FREE_ANSWERS,
        usedLifelines: {
          fiftyFifty: parsed.usedLifelines?.fiftyFifty || [],
          sentientAI: parsed.usedLifelines?.sentientAI || [],
          characters: parsed.usedLifelines?.characters || [],
        },
        stats: {
          totalFreeAnswersUsed: parsed.stats?.totalFreeAnswersUsed || 0,
          totalFiftyFiftyUsed: parsed.stats?.totalFiftyFiftyUsed || 0,
          totalSentientAIUsed: parsed.stats?.totalSentientAIUsed || 0,
          totalCharactersUsed: parsed.stats?.totalCharactersUsed || 0,
          totalPuzzlesCompletedWithHelp: parsed.stats?.totalPuzzlesCompletedWithHelp || 0,
        }
      };
      // Remove legacy key after successful migration
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return migrated;
    }
  } catch (error) {
    console.warn('Failed to migrate legacy lifeline data:', error);
  }
  return null;
};

export const useLifelineManager = () => {
  const { saveData, updateGameSave, isLoading } = useSaveSystem();
  const hasMigrated = useRef(false);

  // Get lifeline data from save system, with migration and defaults
  const getLifelineData = useCallback((): LifelineData => {
    // Check for legacy data migration (once per session)
    if (!hasMigrated.current) {
      hasMigrated.current = true;
      const legacyData = migrateLegacyData();
      if (legacyData) {
        // Persist migrated data to save system
        updateGameSave('ctrlSWorld', { lifelineData: legacyData });
        return legacyData;
      }
    }

    // Return data from save system or defaults
    return saveData.games.ctrlSWorld.lifelineData || createDefaultLifelineData();
  }, [saveData.games.ctrlSWorld.lifelineData, updateGameSave]);

  // Local state for efficient Set-based lookups
  const [state, setState] = useState<LifelineState>(() =>
    storageToState(getLifelineData())
  );

  // Sync local state when save data changes (e.g., after load or migration)
  useEffect(() => {
    if (!isLoading) {
      setState(storageToState(getLifelineData()));
    }
  }, [getLifelineData, isLoading]);

  // Persist state changes to save system
  const persistState = useCallback((newState: LifelineState) => {
    updateGameSave('ctrlSWorld', { lifelineData: stateToStorage(newState) });
  }, [updateGameSave]);

  // Check if a lifeline is available for a specific puzzle
  const isLifelineAvailable = useCallback((
    lifeline: 'freeAnswer' | 'fiftyFifty' | 'sentientAI' | 'characters',
    puzzleId: string
  ): boolean => {
    if (lifeline === 'freeAnswer') {
      return state.freeAnswersRemaining > 0;
    }

    // Other lifelines can only be used once per puzzle
    return !state.usedLifelines[lifeline].has(puzzleId);
  }, [state]);

  // Use a free answer (deducts from pool, returns consequences)
  const useFreeAnswer = useCallback((): {
    success: boolean;
    remaining: number;
    penalties: { wisdom: number; reputation: number };
  } => {
    if (state.freeAnswersRemaining <= 0) {
      return {
        success: false,
        remaining: 0,
        penalties: { wisdom: 0, reputation: 0 }
      };
    }

    const newState: LifelineState = {
      ...state,
      freeAnswersRemaining: state.freeAnswersRemaining - 1,
      usedLifelines: state.usedLifelines,
      stats: {
        ...state.stats,
        totalFreeAnswersUsed: state.stats.totalFreeAnswersUsed + 1,
        totalPuzzlesCompletedWithHelp: state.stats.totalPuzzlesCompletedWithHelp + 1,
      }
    };

    setState(newState);
    persistState(newState);

    return {
      success: true,
      remaining: state.freeAnswersRemaining - 1,
      penalties: {
        wisdom: -5,
        reputation: -3
      }
    };
  }, [state, persistState]);

  // Use 50/50 lifeline
  const useFiftyFifty = useCallback((puzzleId: string): boolean => {
    if (state.usedLifelines.fiftyFifty.has(puzzleId)) {
      return false;
    }

    const newState: LifelineState = {
      ...state,
      usedLifelines: {
        ...state.usedLifelines,
        fiftyFifty: new Set([...state.usedLifelines.fiftyFifty, puzzleId])
      },
      stats: {
        ...state.stats,
        totalFiftyFiftyUsed: state.stats.totalFiftyFiftyUsed + 1,
      }
    };

    setState(newState);
    persistState(newState);

    return true;
  }, [state, persistState]);

  // Use Sentient AI lifeline
  const useSentientAI = useCallback((puzzleId: string): boolean => {
    if (state.usedLifelines.sentientAI.has(puzzleId)) {
      return false;
    }

    const newState: LifelineState = {
      ...state,
      usedLifelines: {
        ...state.usedLifelines,
        sentientAI: new Set([...state.usedLifelines.sentientAI, puzzleId])
      },
      stats: {
        ...state.stats,
        totalSentientAIUsed: state.stats.totalSentientAIUsed + 1,
      }
    };

    setState(newState);
    persistState(newState);

    return true;
  }, [state, persistState]);

  // Use Ask Characters lifeline
  const useCharacters = useCallback((puzzleId: string): boolean => {
    if (state.usedLifelines.characters.has(puzzleId)) {
      return false;
    }

    const newState: LifelineState = {
      ...state,
      usedLifelines: {
        ...state.usedLifelines,
        characters: new Set([...state.usedLifelines.characters, puzzleId])
      },
      stats: {
        ...state.stats,
        totalCharactersUsed: state.stats.totalCharactersUsed + 1,
      }
    };

    setState(newState);
    persistState(newState);

    return true;
  }, [state, persistState]);

  // Reset all lifelines (for new game)
  const resetLifelines = useCallback(() => {
    const defaultState = storageToState(createDefaultLifelineData());
    setState(defaultState);
    persistState(defaultState);
  }, [persistState]);

  // Get stats summary
  const getStats = useCallback(() => state.stats, [state.stats]);

  return {
    // State
    freeAnswersRemaining: state.freeAnswersRemaining,
    stats: state.stats,

    // Check availability
    isLifelineAvailable,

    // Use lifelines
    useFreeAnswer,
    useFiftyFifty,
    useSentientAI,
    useCharacters,

    // Utils
    resetLifelines,
    getStats,
  };
};
