/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description React Context provider for CTRL-S game state management.
 *              Handles story progression, inventory, player stats, puzzles, and auto-save.
 *              Uses useSaveSystem internally for unified persistence across all games.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import {
  useSaveSystem,
  CtrlSGameState,
  CtrlSPlayerStats,
  CtrlSGameItem,
  createDefaultCtrlSGameState
} from '../hooks/useSaveSystem';

// Re-export types for backwards compatibility with existing consumers
export type PlayerStats = CtrlSPlayerStats;
export type GameItem = CtrlSGameItem;
export type GameState = CtrlSGameState;

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
  addItem: (item: Omit<GameItem, 'quantity' | 'acquiredAt'>) => void;
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

const LEGACY_STORAGE_KEY = 'matrix-arcade-ctrls-save';

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

/**
 * Provider component for game state context
 * Uses useSaveSystem internally for unified persistence, maintaining same external API
 * @param {Object} props
 * @param {ReactNode} props.children - Child components
 * @return {JSX.Element}
 * @constructor
 */
export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { saveData, updateGameSave, isLoading } = useSaveSystem();
  const migrationAttemptedRef = useRef(false);

  // Local state that mirrors the save system - enables immediate updates while save persists
  const [state, setState] = useState<GameState>(() => {
    // Start with default state, will be synced from saveData once loaded
    return createDefaultCtrlSGameState();
  });

  // One-time migration from legacy localStorage key to unified save system
  useEffect(() => {
    if (isLoading || migrationAttemptedRef.current) return;
    migrationAttemptedRef.current = true;

    const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyData) {
      try {
        const parsed = JSON.parse(legacyData) as GameState;
        // Migrate to unified save system
        updateGameSave('ctrlSWorld', { ctrlSGameState: parsed });
        // Remove legacy key after successful migration
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to migrate legacy CTRL-S save data:', e);
        // Remove corrupted legacy data
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
  }, [isLoading, updateGameSave]);

  // Sync local state from save system when it loads or changes
  useEffect(() => {
    if (!isLoading && saveData?.games?.ctrlSWorld?.ctrlSGameState) {
      setState(saveData.games.ctrlSWorld.ctrlSGameState);
    }
  }, [isLoading, saveData?.games?.ctrlSWorld?.ctrlSGameState]);

  // Track playtime - increments every second while mounted
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        playtime: prev.playtime + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const toSave = {
        ...state,
        lastSaved: new Date().toISOString()
      };
      updateGameSave('ctrlSWorld', { ctrlSGameState: toSave });
    }, 30000);

    return () => clearInterval(interval);
  }, [state, updateGameSave]);

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
  const addItem = useCallback((item: Omit<GameItem, 'quantity' | 'acquiredAt'>) => {
    const fullItem: GameItem = {
      ...item,
      quantity: 1,
      acquiredAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      inventory: [...prev.inventory, fullItem]
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
        if (item.id === itemId && item.quantity) {
          const remaining = item.quantity - 1;
          return remaining > 0
            ? { ...item, quantity: remaining }
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
    updateGameSave('ctrlSWorld', { ctrlSGameState: toSave });
  }, [state, updateGameSave]);

  const loadGame = useCallback(() => {
    // Reload from save system
    if (saveData?.games?.ctrlSWorld?.ctrlSGameState) {
      setState(saveData.games.ctrlSWorld.ctrlSGameState);
    }
  }, [saveData]);

  const resetGame = useCallback(() => {
    const defaultState = createDefaultCtrlSGameState();
    setState(defaultState);
    updateGameSave('ctrlSWorld', { ctrlSGameState: defaultState });
  }, [updateGameSave]);

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
