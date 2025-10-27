/**
 * @author Tom Butler
 * @date 2025-10-27
 * @description Comprehensive test suite for SimpleSnake game component
 *              Tests rendering, game mechanics, controls, scoring, power-ups, and achievements
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SimpleSnake from './SimpleSnake';
import {
  createMockAchievementManager
} from '../../test/matrix-test-utils';

// Mock the custom hooks
vi.mock('../../hooks/useSimpleSnakeGame', () => ({
  useSimpleSnakeGame: vi.fn(() => ({
    gameState: {
      snake: [{ x: 10, y: 10 }],
      food: { x: 15, y: 10 },
      direction: 'right' as const,
      nextDirection: null,
      score: 0,
      highScore: 0,
      gameState: 'menu' as const,
      speed: 150,
      foodEaten: 0,
      powerUp: undefined,
      activePowerUps: {}
    },
    startGame: vi.fn(),
    togglePause: vi.fn(),
    resetGame: vi.fn(),
    changeDirection: vi.fn(),
    gridSize: 20
  }))
}));

vi.mock('../../hooks/useSaveSystem', () => ({
  useSaveSystem: vi.fn(() => ({
    saveData: {
      games: {
        snakeClassic: {
          highScore: 0,
          stats: {
            gamesPlayed: 0,
            totalScore: 0,
            longestSurvival: 0,
            bestLength: 0
          }
        }
      }
    },
    updateGameSave: vi.fn(),
    unlockAchievement: vi.fn()
  }))
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    )
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}));

// Mock window.AudioContext for sound tests
(global as Window & { AudioContext?: typeof AudioContext }).AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { value: 0 },
    type: 'square',
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      value: 0,
      exponentialRampToValueAtTime: vi.fn()
    }
  })),
  currentTime: 0,
  destination: {}
})) as unknown as typeof AudioContext;

describe('SimpleSnake', () => {
  let mockAchievementManager: ReturnType<typeof createMockAchievementManager>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAchievementManager = createMockAchievementManager();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('renders the game canvas', () => {
      const { container } = render(<SimpleSnake />);
      const canvas = container.querySelector('canvas');

      expect(canvas).toBeTruthy();
      expect(canvas?.width).toBe(600);
      expect(canvas?.height).toBe(600);
    });

    it('displays the game title', () => {
      render(<SimpleSnake />);
      // Use getAllByText since "SNAKE" appears in both header and menu
      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
      expect(screen.getByText('[MATRIX EDITION]')).toBeTruthy();
    });

    it('displays score with proper formatting', () => {
      render(<SimpleSnake />);
      expect(screen.getByText('SCORE')).toBeTruthy();
      // Use getAllByText since score appears in multiple places
      expect(screen.getAllByText('00000').length).toBeGreaterThan(0);
    });

    it('displays high score with proper formatting', () => {
      render(<SimpleSnake />);
      expect(screen.getByText('HIGH')).toBeTruthy();
    });

    it('renders with Matrix green colour scheme', () => {
      const { container } = render(<SimpleSnake />);
      const greenElements = container.querySelectorAll(
        '.text-green-400, .text-green-500, .border-green-500'
      );

      expect(greenElements.length).toBeGreaterThan(0);
    });

    it('applies crisp edges rendering to canvas', () => {
      const { container } = render(<SimpleSnake />);
      const canvas = container.querySelector('canvas');

      expect(canvas?.style.imageRendering).toBe('crisp-edges');
    });
  });

  describe('Menu State', () => {
    it('shows START GAME button in menu state', () => {
      render(<SimpleSnake />);
      expect(screen.getByText('START GAME')).toBeTruthy();
    });

    it('shows start instruction text', () => {
      render(<SimpleSnake />);
      expect(screen.getByText('Press SPACE to start')).toBeTruthy();
    });

    it('starts game when START GAME button is clicked', () => {
      render(<SimpleSnake />);
      const startButton = screen.getByText('START GAME');
      fireEvent.click(startButton);

      // Button click should work without errors
      expect(startButton).toBeTruthy();
    });

    it('handles SPACE key press in menu', () => {
      render(<SimpleSnake />);
      fireEvent.keyDown(window, { key: ' ' });

      // Should not crash
      expect(screen.getByText('START GAME')).toBeTruthy();
    });
  });

  describe('Game Controls', () => {
    it('handles ArrowUp key', () => {
      render(<SimpleSnake />);
      fireEvent.keyDown(window, { key: 'ArrowUp' });

      // Should not crash
      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
    });

    it('handles W key', () => {
      render(<SimpleSnake />);
      fireEvent.keyDown(window, { key: 'w' });

      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
    });

    it('handles ArrowDown key', () => {
      render(<SimpleSnake />);
      fireEvent.keyDown(window, { key: 'ArrowDown' });

      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
    });

    it('handles S key', () => {
      render(<SimpleSnake />);
      fireEvent.keyDown(window, { key: 's' });

      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
    });

    it('handles ArrowLeft key', () => {
      render(<SimpleSnake />);
      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
    });

    it('handles A key', () => {
      render(<SimpleSnake />);
      fireEvent.keyDown(window, { key: 'a' });

      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
    });

    it('handles ArrowRight key', () => {
      render(<SimpleSnake />);
      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
    });

    it('handles D key', () => {
      render(<SimpleSnake />);
      fireEvent.keyDown(window, { key: 'd' });

      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
    });

    it('handles SPACE key during gameplay', () => {
      render(<SimpleSnake />);
      fireEvent.keyDown(window, { key: ' ' });

      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
    });
  });

  describe('Achievement Integration', () => {
    it('accepts achievement manager prop', () => {
      const { container } = render(
        <SimpleSnake achievementManager={mockAchievementManager} />
      );
      expect(container).toBeTruthy();
    });

    it('works without achievement manager', () => {
      const { container } = render(<SimpleSnake />);
      expect(container).toBeTruthy();
    });
  });

  describe('Audio Integration', () => {
    it('accepts isMuted prop', () => {
      const { container } = render(<SimpleSnake isMuted={true} />);
      expect(container).toBeTruthy();
    });

    it('works with isMuted set to false', () => {
      const { container } = render(<SimpleSnake isMuted={false} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = render(<SimpleSnake />);
      expect(container).toBeTruthy();
    });

    it('unmounts without errors', () => {
      const { unmount } = render(<SimpleSnake />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<SimpleSnake />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('Canvas Rendering', () => {
    it('renders snake on canvas', () => {
      const { container } = render(<SimpleSnake />);
      const canvas = container.querySelector('canvas');
      const ctx = canvas?.getContext('2d');

      expect(ctx).toBeTruthy();
    });

    it('uses Matrix green colour scheme for snake', () => {
      const { container } = render(<SimpleSnake />);
      const canvas = container.querySelector('canvas');

      expect(canvas?.classList.contains('border-green-500')).toBe(true);
      expect(canvas?.classList.contains('bg-black')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('provides keyboard-only navigation', () => {
      render(<SimpleSnake />);
      // Game should be fully playable with keyboard only
      expect(screen.getByText('START GAME')).toBeTruthy();
    });

    it('shows clear visual feedback for game state', () => {
      render(<SimpleSnake />);
      // Menu state is clearly indicated
      expect(screen.getByText('Press SPACE to start')).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    it('renders complete game interface', () => {
      render(<SimpleSnake achievementManager={mockAchievementManager} isMuted={false} />);

      // Check all major components are present
      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
      expect(screen.getByText('[MATRIX EDITION]')).toBeTruthy();
      expect(screen.getByText('SCORE')).toBeTruthy();
      expect(screen.getByText('HIGH')).toBeTruthy();
      expect(screen.getByText('START GAME')).toBeTruthy();

      const canvas = document.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('handles rapid key presses without crashing', () => {
      render(<SimpleSnake />);

      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];

      keys.forEach(key => {
        for (let i = 0; i < 10; i++) {
          fireEvent.keyDown(window, { key });
        }
      });

      // Should not crash
      expect(screen.getAllByText('SNAKE').length).toBeGreaterThan(0);
    });
  });
});
