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

      expect(result.current.state.currentChapter).toBe(0);
      expect(result.current.state.stats.coffeeLevel).toBe(50);
      expect(result.current.state.stats.hackerRep).toBe(0);
      expect(result.current.state.stats.wisdomPoints).toBe(0);
      expect(result.current.state.stats.teamMorale).toBe(50);
      expect(result.current.state.inventory).toEqual([]);
      expect(result.current.state.completedPuzzles).toEqual([]);
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

      localStorage.setItem('ctrls_game_state', JSON.stringify(savedState));

      const { result } = renderHook(() => useGameState(), { wrapper });

      expect(result.current.state.currentChapter).toBe(3);
      expect(result.current.state.stats.coffeeLevel).toBe(75);
      expect(result.current.state.completedPuzzles).toContain('ch1_team_quiz');
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

      expect(result.current.state.completedChapters).toContain(1);
    });

    it('does not duplicate completed chapters', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.completeChapter(1);
        result.current.completeChapter(1);
      });

      expect(result.current.state.completedChapters).toEqual([1]);
    });
  });

  describe('Stats Management', () => {
    it('updates coffee level', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateStats({ coffeeLevel: 20 });
      });

      expect(result.current.state.stats.coffeeLevel).toBe(70);
    });

    it('caps coffee level at 200', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateStats({ coffeeLevel: 200 });
      });

      expect(result.current.state.stats.coffeeLevel).toBe(200);
    });

    it('prevents coffee level from going negative', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateStats({ coffeeLevel: -100 });
      });

      expect(result.current.state.stats.coffeeLevel).toBe(0);
    });

    it('updates hacker reputation', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateStats({ hackerRep: 25 });
      });

      expect(result.current.state.stats.hackerRep).toBe(25);
    });

    it('caps hacker reputation at 100', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateStats({ hackerRep: 150 });
      });

      expect(result.current.state.stats.hackerRep).toBe(100);
    });

    it('accumulates wisdom points', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateStats({ wisdomPoints: 10 });
        result.current.updateStats({ wisdomPoints: 15 });
      });

      expect(result.current.state.stats.wisdomPoints).toBe(25);
    });

    it('updates team morale', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateStats({ teamMorale: -10 });
      });

      expect(result.current.state.stats.teamMorale).toBe(40);
    });

    it('caps team morale between 0 and 100', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateStats({ teamMorale: 60 });
      });
      expect(result.current.state.stats.teamMorale).toBe(100);

      act(() => {
        result.current.updateStats({ teamMorale: -150 });
      });
      expect(result.current.state.stats.teamMorale).toBe(0);
    });

    it('updates multiple stats at once', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.updateStats({
          coffeeLevel: 10,
          hackerRep: 5,
          wisdomPoints: 20,
          teamMorale: 15
        });
      });

      expect(result.current.state.stats).toEqual({
        coffeeLevel: 60,
        hackerRep: 5,
        wisdomPoints: 20,
        teamMorale: 65
      });
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

      expect(result.current.state.inventory).toHaveLength(1);
      expect(result.current.state.inventory[0].name).toBe('Coffee Beans');
    });

    it('increments quantity for duplicate items', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addItem(testItem);
        result.current.addItem(testItem);
      });

      expect(result.current.state.inventory).toHaveLength(1);
      expect(result.current.state.inventory[0].quantity).toBe(2);
    });

    it('removes item from inventory', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addItem(testItem);
        result.current.removeItem('coffee_beans');
      });

      expect(result.current.state.inventory).toHaveLength(0);
    });

    it('decrements quantity when removing stacked items', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addItem(testItem);
        result.current.addItem(testItem);
        result.current.removeItem('coffee_beans');
      });

      expect(result.current.state.inventory).toHaveLength(1);
      expect(result.current.state.inventory[0].quantity).toBe(1);
    });

    it('stores acquisition timestamp', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.addItem(testItem);
      });

      expect(result.current.state.inventory[0].acquiredAt).toBeDefined();
    });
  });

  describe('Puzzle Management', () => {
    it('marks puzzle as completed', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.completePuzzle('ch1_team_quiz');
      });

      expect(result.current.state.completedPuzzles).toContain('ch1_team_quiz');
    });

    it('does not duplicate completed puzzles', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.completePuzzle('ch1_team_quiz');
        result.current.completePuzzle('ch1_team_quiz');
      });

      expect(result.current.state.completedPuzzles).toEqual(['ch1_team_quiz']);
    });

    it('tracks multiple completed puzzles', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.completePuzzle('ch1_team_quiz');
        result.current.completePuzzle('ch2_console_log');
        result.current.completePuzzle('ch3_fibonacci');
      });

      expect(result.current.state.completedPuzzles).toHaveLength(3);
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

      expect(result.current.state.unlockedAchievements).toContain('first_puzzle_solved');
    });

    it('does not duplicate unlocked achievements', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.unlockAchievement('first_puzzle_solved');
        result.current.unlockAchievement('first_puzzle_solved');
      });

      expect(result.current.state.unlockedAchievements).toEqual(['first_puzzle_solved']);
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
        result.current.updateStats({ coffeeLevel: 25 });
        result.current.saveGame();
      });

      const saved = localStorage.getItem('ctrls_game_state');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.currentChapter).toBe(2);
      expect(parsed.stats.coffeeLevel).toBe(75);
    });

    it('loads state from localStorage', () => {
      const savedState = {
        currentChapter: 3,
        stats: {
          coffeeLevel: 100,
          hackerRep: 60,
          wisdomPoints: 150,
          teamMorale: 70
        },
        completedPuzzles: ['ch1_team_quiz']
      };

      localStorage.setItem('ctrls_game_state', JSON.stringify(savedState));

      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.loadGame();
      });

      expect(result.current.state.currentChapter).toBe(3);
      expect(result.current.state.stats.coffeeLevel).toBe(100);
    });

    it('auto-saves periodically', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.setChapter(2);
      });

      // Fast-forward 30 seconds (auto-save interval)
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      const saved = localStorage.getItem('ctrls_game_state');
      expect(saved).toBeTruthy();

      vi.useRealTimers();
    });
  });

  describe('Reset Functionality', () => {
    it('resets game to initial state', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.setChapter(3);
        result.current.updateStats({ coffeeLevel: 50, hackerRep: 30 });
        result.current.completePuzzle('ch1_team_quiz');
        result.current.resetGame();
      });

      expect(result.current.state.currentChapter).toBe(0);
      expect(result.current.state.stats.coffeeLevel).toBe(50);
      expect(result.current.state.stats.hackerRep).toBe(0);
      expect(result.current.state.completedPuzzles).toEqual([]);
    });

    it('clears localStorage on reset', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result.current.setChapter(2);
        result.current.saveGame();
        result.current.resetGame();
      });

      const saved = localStorage.getItem('ctrls_game_state');
      expect(saved).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles corrupted localStorage data', () => {
      localStorage.setItem('ctrls_game_state', 'invalid json{{{');

      const { result } = renderHook(() => useGameState(), { wrapper });

      // Should fall back to default state
      expect(result.current.state.currentChapter).toBe(0);
    });

    it('handles missing properties in saved state', () => {
      const incompleteSave = {
        currentChapter: 2
        // Missing stats, inventory, etc.
      };

      localStorage.setItem('ctrls_game_state', JSON.stringify(incompleteSave));

      const { result } = renderHook(() => useGameState(), { wrapper });

      // Should merge with defaults
      expect(result.current.state.stats).toBeDefined();
      expect(result.current.state.inventory).toBeDefined();
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
});
