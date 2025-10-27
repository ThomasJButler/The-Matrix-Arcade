import { useState, useCallback, useEffect } from 'react';

// ============================================================================
// LIFELINE MANAGER HOOK
// Manages lifeline state across all puzzles in CTRL-S The World
// ============================================================================

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

const STORAGE_KEY = 'ctrlsworld_lifelines';
const INITIAL_FREE_ANSWERS = 10;

const getInitialState = (): LifelineState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert arrays back to Sets
      return {
        ...parsed,
        usedLifelines: {
          fiftyFifty: new Set(parsed.usedLifelines.fiftyFifty || []),
          sentientAI: new Set(parsed.usedLifelines.sentientAI || []),
          characters: new Set(parsed.usedLifelines.characters || []),
        }
      };
    }
  } catch (error) {
    console.warn('Failed to load lifeline state:', error);
  }

  return {
    freeAnswersRemaining: INITIAL_FREE_ANSWERS,
    usedLifelines: {
      fiftyFifty: new Set(),
      sentientAI: new Set(),
      characters: new Set(),
    },
    stats: {
      totalFreeAnswersUsed: 0,
      totalFiftyFiftyUsed: 0,
      totalSentientAIUsed: 0,
      totalCharactersUsed: 0,
      totalPuzzlesCompletedWithHelp: 0,
    }
  };
};

export const useLifelineManager = () => {
  const [state, setState] = useState<LifelineState>(getInitialState);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      const toStore = {
        ...state,
        usedLifelines: {
          fiftyFifty: Array.from(state.usedLifelines.fiftyFifty),
          sentientAI: Array.from(state.usedLifelines.sentientAI),
          characters: Array.from(state.usedLifelines.characters),
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.warn('Failed to save lifeline state:', error);
    }
  }, [state]);

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

    setState(prev => ({
      ...prev,
      freeAnswersRemaining: prev.freeAnswersRemaining - 1,
      stats: {
        ...prev.stats,
        totalFreeAnswersUsed: prev.stats.totalFreeAnswersUsed + 1,
        totalPuzzlesCompletedWithHelp: prev.stats.totalPuzzlesCompletedWithHelp + 1,
      }
    }));

    return {
      success: true,
      remaining: state.freeAnswersRemaining - 1,
      penalties: {
        wisdom: -5,
        reputation: -3
      }
    };
  }, [state.freeAnswersRemaining]);

  // Use 50/50 lifeline
  const useFiftyFifty = useCallback((puzzleId: string): boolean => {
    if (state.usedLifelines.fiftyFifty.has(puzzleId)) {
      return false;
    }

    setState(prev => ({
      ...prev,
      usedLifelines: {
        ...prev.usedLifelines,
        fiftyFifty: new Set([...prev.usedLifelines.fiftyFifty, puzzleId])
      },
      stats: {
        ...prev.stats,
        totalFiftyFiftyUsed: prev.stats.totalFiftyFiftyUsed + 1,
      }
    }));

    return true;
  }, [state.usedLifelines.fiftyFifty]);

  // Use Sentient AI lifeline
  const useSentientAI = useCallback((puzzleId: string): boolean => {
    if (state.usedLifelines.sentientAI.has(puzzleId)) {
      return false;
    }

    setState(prev => ({
      ...prev,
      usedLifelines: {
        ...prev.usedLifelines,
        sentientAI: new Set([...prev.usedLifelines.sentientAI, puzzleId])
      },
      stats: {
        ...prev.stats,
        totalSentientAIUsed: prev.stats.totalSentientAIUsed + 1,
      }
    }));

    return true;
  }, [state.usedLifelines.sentientAI]);

  // Use Ask Characters lifeline
  const useCharacters = useCallback((puzzleId: string): boolean => {
    if (state.usedLifelines.characters.has(puzzleId)) {
      return false;
    }

    setState(prev => ({
      ...prev,
      usedLifelines: {
        ...prev.usedLifelines,
        characters: new Set([...prev.usedLifelines.characters, puzzleId])
      },
      stats: {
        ...prev.stats,
        totalCharactersUsed: prev.stats.totalCharactersUsed + 1,
      }
    }));

    return true;
  }, [state.usedLifelines.characters]);

  // Reset all lifelines (for new game)
  const resetLifelines = useCallback(() => {
    setState(getInitialState());
  }, []);

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
