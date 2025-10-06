import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PlayerStats {
  coffeeLevel: number;      // 0-200% (can go over 100!)
  hackerRep: number;         // 0-100
  wisdomPoints: number;      // Accumulates from choices
  teamMorale: number;        // 0-100
}

export interface GameItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  usesRemaining?: number;
  collectible: boolean;
}

export interface GameState {
  // Progress tracking
  currentChapter: number;
  currentSection: string;
  completedPuzzles: string[];
  completedChapters: number[];

  // Player stats
  stats: PlayerStats;

  // Inventory
  inventory: GameItem[];

  // Story choices made
  storyChoices: Record<string, string>;

  // Achievements
  unlockedAchievements: string[];
  achievementProgress: Record<string, number>;

  // Settings
  difficulty: 'easy' | 'normal' | 'hard';
  hintsEnabled: boolean;

  // Meta
  playtime: number; // in seconds
  startDate: string;
  lastSaved: string;
}

export interface GameStateContextType {
  state: GameState;

  // Progress
  setChapter: (chapter: number) => void;
  setSection: (section: string) => void;
  completePuzzle: (puzzleId: string) => void;
  completeChapter: (chapterId: number) => void;

  // Stats
  updateStats: (stats: Partial<PlayerStats>) => void;
  addCoffee: (amount: number) => void;
  addWisdom: (amount: number) => void;
  addReputation: (amount: number) => void;
  setMorale: (value: number) => void;

  // Inventory
  addItem: (item: GameItem) => void;
  removeItem: (itemId: string) => void;
  useItem: (itemId: string) => void;
  hasItem: (itemId: string) => boolean;

  // Choices
  makeChoice: (choiceId: string, optionSelected: string) => void;
  getChoice: (choiceId: string) => string | undefined;

  // Achievements
  unlockAchievement: (achievementId: string) => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;
  hasAchievement: (achievementId: string) => boolean;

  // Settings
  setDifficulty: (difficulty: 'easy' | 'normal' | 'hard') => void;
  toggleHints: () => void;

  // Save/Load
  saveGame: () => void;
  loadGame: () => void;
  resetGame: () => void;

  // Meta
  getPlaytime: () => number;
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

const DEFAULT_STATE: GameState = {
  currentChapter: 1,
  currentSection: 'intro',
  completedPuzzles: [],
  completedChapters: [],

  stats: {
    coffeeLevel: 50,
    hackerRep: 0,
    wisdomPoints: 0,
    teamMorale: 50
  },

  inventory: [],
  storyChoices: {},

  unlockedAchievements: [],
  achievementProgress: {},

  difficulty: 'normal',
  hintsEnabled: true,

  playtime: 0,
  startDate: new Date().toISOString(),
  lastSaved: new Date().toISOString()
};

// ============================================================================
// CONTEXT
// ============================================================================

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

const STORAGE_KEY = 'matrix-arcade-ctrls-save';

// ============================================================================
// PROVIDER
// ============================================================================

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(() => {
    // Try to load from localStorage on init
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as GameState;
      } catch (e) {
        console.error('Failed to parse saved game:', e);
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame();
    }, 30000);

    return () => clearInterval(interval);
  }, [state]);

  // Track playtime
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        playtime: prev.playtime + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ========== PROGRESS ==========
  const setChapter = useCallback((chapter: number) => {
    setState(prev => ({
      ...prev,
      currentChapter: chapter
    }));
  }, []);

  const setSection = useCallback((section: string) => {
    setState(prev => ({
      ...prev,
      currentSection: section
    }));
  }, []);

  const completePuzzle = useCallback((puzzleId: string) => {
    setState(prev => ({
      ...prev,
      completedPuzzles: [...prev.completedPuzzles, puzzleId]
    }));
  }, []);

  const completeChapter = useCallback((chapterId: number) => {
    setState(prev => ({
      ...prev,
      completedChapters: [...prev.completedChapters, chapterId]
    }));
  }, []);

  // ========== STATS ==========
  const updateStats = useCallback((newStats: Partial<PlayerStats>) => {
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        ...newStats
      }
    }));
  }, []);

  const addCoffee = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        coffeeLevel: Math.max(0, Math.min(200, prev.stats.coffeeLevel + amount))
      }
    }));
  }, []);

  const addWisdom = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        wisdomPoints: prev.stats.wisdomPoints + amount
      }
    }));
  }, []);

  const addReputation = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        hackerRep: Math.max(0, Math.min(100, prev.stats.hackerRep + amount))
      }
    }));
  }, []);

  const setMorale = useCallback((value: number) => {
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        teamMorale: Math.max(0, Math.min(100, value))
      }
    }));
  }, []);

  // ========== INVENTORY ==========
  const addItem = useCallback((item: GameItem) => {
    setState(prev => ({
      ...prev,
      inventory: [...prev.inventory, item]
    }));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(item => item.id !== itemId)
    }));
  }, []);

  const useItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(item => {
        if (item.id === itemId && item.usesRemaining) {
          const remaining = item.usesRemaining - 1;
          return remaining > 0
            ? { ...item, usesRemaining: remaining }
            : null;
        }
        return item;
      }).filter(Boolean) as GameItem[]
    }));
  }, []);

  const hasItem = useCallback((itemId: string) => {
    return state.inventory.some(item => item.id === itemId);
  }, [state.inventory]);

  // ========== CHOICES ==========
  const makeChoice = useCallback((choiceId: string, optionSelected: string) => {
    setState(prev => ({
      ...prev,
      storyChoices: {
        ...prev.storyChoices,
        [choiceId]: optionSelected
      }
    }));
  }, []);

  const getChoice = useCallback((choiceId: string) => {
    return state.storyChoices[choiceId];
  }, [state.storyChoices]);

  // ========== ACHIEVEMENTS ==========
  const unlockAchievement = useCallback((achievementId: string) => {
    setState(prev => {
      if (prev.unlockedAchievements.includes(achievementId)) {
        return prev;
      }
      return {
        ...prev,
        unlockedAchievements: [...prev.unlockedAchievements, achievementId]
      };
    });
  }, []);

  const updateAchievementProgress = useCallback((achievementId: string, progress: number) => {
    setState(prev => ({
      ...prev,
      achievementProgress: {
        ...prev.achievementProgress,
        [achievementId]: progress
      }
    }));
  }, []);

  const hasAchievement = useCallback((achievementId: string) => {
    return state.unlockedAchievements.includes(achievementId);
  }, [state.unlockedAchievements]);

  // ========== SETTINGS ==========
  const setDifficulty = useCallback((difficulty: 'easy' | 'normal' | 'hard') => {
    setState(prev => ({
      ...prev,
      difficulty
    }));
  }, []);

  const toggleHints = useCallback(() => {
    setState(prev => ({
      ...prev,
      hintsEnabled: !prev.hintsEnabled
    }));
  }, []);

  // ========== SAVE/LOAD ==========
  const saveGame = useCallback(() => {
    const toSave = {
      ...state,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    console.log('Game saved successfully');
  }, [state]);

  const loadGame = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loaded = JSON.parse(saved) as GameState;
        setState(loaded);
        console.log('Game loaded successfully');
      } catch (e) {
        console.error('Failed to load game:', e);
      }
    }
  }, []);

  const resetGame = useCallback(() => {
    setState(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
    console.log('Game reset');
  }, []);

  // ========== META ==========
  const getPlaytime = useCallback(() => {
    return state.playtime;
  }, [state.playtime]);

  const value: GameStateContextType = {
    state,
    setChapter,
    setSection,
    completePuzzle,
    completeChapter,
    updateStats,
    addCoffee,
    addWisdom,
    addReputation,
    setMorale,
    addItem,
    removeItem,
    useItem,
    hasItem,
    makeChoice,
    getChoice,
    unlockAchievement,
    updateAchievementProgress,
    hasAchievement,
    setDifficulty,
    toggleHints,
    saveGame,
    loadGame,
    resetGame,
    getPlaytime
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

export default GameStateContext;
