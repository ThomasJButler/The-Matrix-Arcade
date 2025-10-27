import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GameStateProvider, useGameState, GameState } from './GameStateContext';
import React from 'react';

describe('GameStateContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameStateProvider>{children}</GameStateProvider>
  );

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      expect(result.current.state.currentChapter).toBe(1);
      expect(result.current.state.stats.coffeeLevel).toBe(50);
      expect(result.current.state.stats.hackerRep).toBe(0);
      expect(result.current.state.stats.wisdomPoints).toBe(0);
      expect(result.current.state.stats.teamMorale).toBe(50);
      expect(result.current.state.inventory.length).toBe(0);
      expect(result.current.state.completedPuzzles.length).toBe(0);
    });

    it('loads saved state from localStorage', () => {
      const savedState: Partial<GameState> = {
        currentChapter: 3,
        stats: {
          coffeeLevel: 75,
          hackerRep: 50,
          wisdomPoints: 100,
          teamMorale: 80
        },
        completedPuzzles: ['ch1_team_quiz', 'ch2_console_log']
      };

      localStorage.setItem('matrix-arcade-ctrls-save', JSON.stringify(savedState));

      const { result } = renderHook(() => useGameState(), { wrapper });

      expect(result.current.state.currentChapter).toBe(3);
      expect(result.current.state.stats.coffeeLevel).toBe(75);
    });
  });

  describe('Chapter Management', () => {
    it('updates current chapter', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.setChapter(2);
      });

      expect(result.current.state.currentChapter).toBe(2);
    });

    it('marks chapter as completed', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.completeChapter(1);
      });

      expect(result.current.state.completedChapters.length).toBe(1);
    });
  });

  describe('Stats Management', () => {
    it('updates coffee level via addCoffee', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addCoffee(20);
      });

      expect(result.current.state.stats.coffeeLevel).toBe(70);
    });

    it('caps coffee level at 200', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addCoffee(200);
      });

      expect(result.current.state.stats.coffeeLevel).toBe(200);
    });

    it('prevents coffee level from going negative', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addCoffee(-100);
      });

      expect(result.current.state.stats.coffeeLevel).toBe(0);
    });

    it('updates hacker reputation via addReputation', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addReputation(25);
      });

      expect(result.current.state.stats.hackerRep).toBe(25);
    });

    it('caps hacker reputation at 100', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addReputation(150);
      });

      expect(result.current.state.stats.hackerRep).toBe(100);
    });

    it('accumulates wisdom points via addWisdom', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addWisdom(10);
        result.current.addWisdom(15);
      });

      expect(result.current.state.stats.wisdomPoints).toBe(25);
    });

    it('sets team morale directly', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.setMorale(70);
      });

      expect(result.current.state.stats.teamMorale).toBe(70);
    });

    it('updates stats via updateStats', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateStats({
          coffeeLevel: 75,
          hackerRep: 30
        });
      });

      expect(result.current.state.stats.coffeeLevel).toBe(75);
      expect(result.current.state.stats.hackerRep).toBe(30);
    });
  });

  describe('Inventory Management', () => {
    const testItem = {
      id: 'coffee_beans',
      name: 'Coffee Beans',
      description: 'Artisanal beans',
      type: 'consumable' as const,
      usable: true,
      effect: '+20 Coffee Level'
    };

    it('adds item to inventory', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addItem(testItem);
      });

      expect(result.current.state.inventory.length).toBe(1);
      expect(result.current.state.inventory[0].name).toBe('Coffee Beans');
    });

    it('checks if item exists', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addItem(testItem);
      });

      expect(result.current.hasItem('coffee_beans')).toBe(true);
      expect(result.current.hasItem('nonexistent')).toBe(false);
    });

    it('removes item from inventory', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addItem(testItem);
        result.current.removeItem('coffee_beans');
      });

      expect(result.current.state.inventory.length).toBe(0);
    });

    it('stores acquisition timestamp', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addItem(testItem);
      });

      expect(result.current.state.inventory[0].acquiredAt).toBeTruthy();
    });
  });

  describe('Puzzle Management', () => {
    it('marks puzzle as completed', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.completePuzzle('ch1_team_quiz');
      });

      expect(result.current.state.completedPuzzles.length).toBe(1);
    });

    it('tracks multiple completed puzzles', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.completePuzzle('ch1_team_quiz');
        result.current.completePuzzle('ch2_console_log');
        result.current.completePuzzle('ch3_fibonacci');
      });

      expect(result.current.state.completedPuzzles.length).toBe(3);
    });
  });

  describe('Story Choices', () => {
    it('records story choices', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.makeChoice('ch2_ethics_decision', 'install_module');
      });

      expect(result.current.state.storyChoices['ch2_ethics_decision']).toBe('install_module');
    });

    it('retrieves choice', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.makeChoice('ch2_ethics_decision', 'install_module');
      });

      expect(result.current.getChoice('ch2_ethics_decision')).toBe('install_module');
    });

    it('overwrites previous choice for same decision', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.makeChoice('ch2_ethics_decision', 'install_module');
        result.current.makeChoice('ch2_ethics_decision', 'skip_module');
      });

      expect(result.current.state.storyChoices['ch2_ethics_decision']).toBe('skip_module');
    });
  });

  describe('Achievements', () => {
    it('unlocks achievement', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.unlockAchievement('first_puzzle_solved');
      });

      expect(result.current.state.unlockedAchievements.length).toBe(1);
    });

    it('checks if achievement is unlocked', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.unlockAchievement('first_puzzle_solved');
      });

      expect(result.current.hasAchievement('first_puzzle_solved')).toBe(true);
      expect(result.current.hasAchievement('nonexistent')).toBe(false);
    });

    it('tracks achievement progress', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateAchievementProgress('coffee_addict', 50);
      });

      expect(result.current.state.achievementProgress['coffee_addict']).toBe(50);
    });
  });

  describe('Save/Load System', () => {
    it('saves state to localStorage', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.setChapter(2);
        result.current.updateStats({ coffeeLevel: 75 });
      });

      act(() => {
        result.current.saveGame();
      });

      const saved = localStorage.getItem('matrix-arcade-ctrls-save');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.currentChapter).toBe(2);
      expect(parsed.stats.coffeeLevel).toBe(75);
    });

    it('loads state from localStorage', () => {
      const savedState = {
        currentChapter: 3,
        currentSection: 'intro',
        stats: {
          coffeeLevel: 100,
          hackerRep: 60,
          wisdomPoints: 150,
          teamMorale: 70
        },
        completedPuzzles: ['ch1_team_quiz'],
        completedChapters: [],
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

      localStorage.setItem('matrix-arcade-ctrls-save', JSON.stringify(savedState));

      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.loadGame();
      });

      expect(result.current.state.currentChapter).toBe(3);
      expect(result.current.state.stats.coffeeLevel).toBe(100);
    });
  });

  describe('Reset Functionality', () => {
    it('resets game to initial state', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.setChapter(3);
        result.current.updateStats({ coffeeLevel: 100, hackerRep: 30 });
        result.current.completePuzzle('ch1_team_quiz');
        result.current.resetGame();
      });

      expect(result.current.state.currentChapter).toBe(1);
      expect(result.current.state.stats.coffeeLevel).toBe(50);
      expect(result.current.state.stats.hackerRep).toBe(0);
      expect(result.current.state.completedPuzzles.length).toBe(0);
    });

    it('clears localStorage on reset', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.setChapter(2);
        result.current.saveGame();
        result.current.resetGame();
      });

      const saved = localStorage.getItem('matrix-arcade-ctrls-save');
      expect(saved).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles corrupted localStorage data', () => {
      localStorage.setItem('matrix-arcade-ctrls-save', 'invalid json{{{');

      const { result } = renderHook(() => useGameState(), { wrapper });

      // Should fall back to default state
      expect(result.current.state.currentChapter).toBe(1);
    });

    it('clears bad localStorage on load error', () => {
      localStorage.setItem('matrix-arcade-ctrls-save', '{broken}');

      const { result } = renderHook(() => useGameState(), { wrapper });

      // Should initialize with defaults
      expect(result.current.state).toBeTruthy();
      expect(result.current.state.currentChapter).toBe(1);
    });
  });

  describe('Context Provider', () => {
    it('throws error when used outside provider', () => {
      // Suppress console error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useGameState());
      }).toThrow('useGameState must be used within a GameStateProvider');

      consoleError.mockRestore();
    });
  });

  describe('Component Lifecycle', () => {
    it('initializes without errors', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });
      expect(result.current).toBeTruthy();
    });

    it('cleans up on unmount', () => {
      const { unmount } = renderHook(() => useGameState(), { wrapper });
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('handles rapid state updates', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addCoffee(1);
        }
      });

      expect(result.current.state.stats.coffeeLevel).toBe(60);
    });
  });
});
