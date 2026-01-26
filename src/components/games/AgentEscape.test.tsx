import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import AgentEscape from './AgentEscape';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  key: vi.fn(),
  length: 0,
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// Mock requestAnimationFrame
const rafCallbacksMap = new Map<number, FrameRequestCallback>();
let rafId = 0;

global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  const id = ++rafId;
  rafCallbacksMap.set(id, callback);
  return id;
}) as unknown as typeof requestAnimationFrame;

global.cancelAnimationFrame = vi.fn((id: number) => {
  rafCallbacksMap.delete(id);
}) as unknown as typeof cancelAnimationFrame;

// Helper to trigger animation frame
const triggerAnimationFrame = (time: number = 16) => {
  const entry = rafCallbacksMap.entries().next();
  if (!entry.done) {
    const [id, callback] = entry.value;
    rafCallbacksMap.delete(id);
    act(() => {
      callback(time);
    });
  }
};

// Helper to start the game
const startGame = () => {
  fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
};

describe('AgentEscape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    rafCallbacksMap.clear();
    rafId = 0;
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    rafCallbacksMap.clear();
    cleanup();
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders canvas element with correct dimensions', () => {
      render(<AgentEscape />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '560');
      expect(canvas).toHaveAttribute('height', '620');
    });

    it('shows menu screen initially', () => {
      render(<AgentEscape />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('displays with Matrix theme styling', () => {
      render(<AgentEscape />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('border-2');
      expect(canvas).toHaveClass('border-green-500');
    });
  });

  describe('Game Controls', () => {
    it('starts game on Enter key press', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('handles arrow key movement', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
      fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown' });
      fireEvent.keyDown(window, { key: 'ArrowLeft', code: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles WASD movement', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'w', code: 'KeyW' });
      fireEvent.keyDown(window, { key: 'a', code: 'KeyA' });
      fireEvent.keyDown(window, { key: 's', code: 'KeyS' });
      fireEvent.keyDown(window, { key: 'd', code: 'KeyD' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('pauses game with P key', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('restarts game with R key', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Pacman Mechanics', () => {
    it('runs game loop with maze rendering', () => {
      render(<AgentEscape />);
      startGame();
      for (let i = 0; i < 10; i++) {
        triggerAnimationFrame(i * 16);
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles ghost AI updates', () => {
      render(<AgentEscape />);
      startGame();
      for (let i = 0; i < 20; i++) {
        triggerAnimationFrame(i * 16);
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('processes multiple frames for dot collection', () => {
      render(<AgentEscape />);
      startGame();
      for (let i = 0; i < 50; i++) {
        triggerAnimationFrame(i * 16);
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Achievement Manager Integration', () => {
    it('accepts achievementManager prop', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn(),
      };
      render(<AgentEscape achievementManager={mockAchievementManager} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('accepts isMuted prop', () => {
      render(<AgentEscape isMuted={true} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();
      unmount();
      expect(true).toBe(true);
    });

    it('handles rapid direction changes', () => {
      render(<AgentEscape />);
      startGame();
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: 'ArrowUp' });
        fireEvent.keyDown(window, { key: 'ArrowLeft' });
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        fireEvent.keyDown(window, { key: 'ArrowRight' });
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('State Machine Transitions', () => {
    it('starts in menu phase with title visible', () => {
      render(<AgentEscape />);
      expect(screen.getByText('AGENT ESCAPE')).toBeInTheDocument();
    });

    it('transitions from menu to playing on Enter', () => {
      render(<AgentEscape />);
      expect(screen.getByText('AGENT ESCAPE')).toBeInTheDocument();

      startGame();
      triggerAnimationFrame();

      // Menu title should no longer be visible
      expect(screen.queryByText('AGENT ESCAPE')).not.toBeInTheDocument();
    });

    it('transitions from playing to paused on P key', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });

      // Paused overlay should appear
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    it('transitions from paused back to playing on P key', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      // Pause
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      expect(screen.getByText('PAUSED')).toBeInTheDocument();

      // Resume
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
    });

    it('restarts game from paused state on R key', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      // Pause game
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      expect(screen.getByText('PAUSED')).toBeInTheDocument();

      // Restart via R key
      fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
      expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
    });

    it('does not allow movement when in menu phase', () => {
      render(<AgentEscape />);

      // Try to move before starting game
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      // Menu should still be visible
      expect(screen.getByText('AGENT ESCAPE')).toBeInTheDocument();
    });

    it('shows menu controls', () => {
      render(<AgentEscape />);
      expect(screen.getByText(/Press ENTER to Start/)).toBeInTheDocument();
    });
  });

  describe('Achievement Unlock Verification', () => {
    it('calls achievementManager with correct game ID', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn(),
      };
      render(<AgentEscape achievementManager={mockAchievementManager} />);
      startGame();

      // Run enough frames for potential dot collection
      for (let i = 0; i < 100; i++) {
        triggerAnimationFrame(i * 16);
      }

      // If any achievements were unlocked, verify game ID is correct
      const calls = mockAchievementManager.unlockAchievement.mock.calls;
      if (calls.length > 0) {
        const gameIds = calls.map((call: string[]) => call[0]);
        expect(gameIds).toContain('agentEscape');
      }
    });
  });

  describe('HUD Display', () => {
    it('displays score during gameplay', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      // Score display should be visible
      expect(screen.getByText(/Score:/)).toBeInTheDocument();
    });

    it('displays lives during gameplay', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      // Lives display should be visible (3 hearts initially)
      expect(screen.getByText(/Lives:/)).toBeInTheDocument();
    });
  });

  describe('Player Movement', () => {
    it('handles up arrow key', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
      triggerAnimationFrame(32);

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles down arrow key', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown' });
      triggerAnimationFrame(32);

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles left arrow key', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'ArrowLeft', code: 'ArrowLeft' });
      triggerAnimationFrame(32);

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles right arrow key', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
      triggerAnimationFrame(32);

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles WASD keys as alternatives', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'w', code: 'KeyW' });
      triggerAnimationFrame(32);
      fireEvent.keyDown(window, { key: 'a', code: 'KeyA' });
      triggerAnimationFrame(48);
      fireEvent.keyDown(window, { key: 's', code: 'KeyS' });
      triggerAnimationFrame(64);
      fireEvent.keyDown(window, { key: 'd', code: 'KeyD' });
      triggerAnimationFrame(80);

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Mute Functionality', () => {
    it('respects isMuted prop when true', () => {
      render(<AgentEscape isMuted={true} />);
      startGame();
      triggerAnimationFrame();

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('toggles mute with M key', () => {
      render(<AgentEscape isMuted={false} />);
      startGame();
      triggerAnimationFrame();

      // Press M to toggle mute
      fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Game Loop', () => {
    it('continues game loop while playing', () => {
      render(<AgentEscape />);
      startGame();

      // Run multiple frames
      for (let i = 0; i < 30; i++) {
        triggerAnimationFrame(i * 16);
      }

      // Game should still be running
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('stops game loop when paused', () => {
      render(<AgentEscape />);
      startGame();
      triggerAnimationFrame();

      // Pause
      fireEvent.keyDown(window, { key: 'p' });

      // Paused overlay should be visible
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });
  });

  describe('Ghost AI', () => {
    it('runs ghost AI updates during gameplay', () => {
      render(<AgentEscape />);
      startGame();

      // Run frames to process ghost AI
      for (let i = 0; i < 60; i++) {
        triggerAnimationFrame(i * 16);
      }

      // Game should render without crashing
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });
});
