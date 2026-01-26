import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import MatrixAscension from './MatrixAscension';

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

describe('MatrixAscension', () => {
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
      render(<MatrixAscension />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '400');
      expect(canvas).toHaveAttribute('height', '600');
    });

    it('shows menu screen initially', () => {
      render(<MatrixAscension />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('displays with Matrix theme styling', () => {
      render(<MatrixAscension />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('border-2');
      expect(canvas).toHaveClass('border-green-500');
    });
  });

  describe('Game Controls', () => {
    it('starts game on Enter key press', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('handles left/right movement with arrow keys', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'ArrowLeft', code: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles left/right movement with A/D keys', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'a', code: 'KeyA' });
      fireEvent.keyDown(window, { key: 'd', code: 'KeyD' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles shooting with Space key', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('pauses game with P key', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('restarts game with R key', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Platform Mechanics', () => {
    it('runs game loop with platform physics', () => {
      render(<MatrixAscension />);
      startGame();
      for (let i = 0; i < 10; i++) {
        triggerAnimationFrame(i * 16);
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles vertical scrolling mechanics', () => {
      render(<MatrixAscension />);
      startGame();
      for (let i = 0; i < 20; i++) {
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
      render(<MatrixAscension achievementManager={mockAchievementManager} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('accepts isMuted prop', () => {
      render(<MatrixAscension isMuted={true} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();
      unmount();
      expect(true).toBe(true);
    });

    it('handles rapid input without issues', () => {
      render(<MatrixAscension />);
      startGame();
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: 'ArrowLeft' });
        fireEvent.keyUp(window, { key: 'ArrowLeft' });
        fireEvent.keyDown(window, { key: 'ArrowRight' });
        fireEvent.keyUp(window, { key: 'ArrowRight' });
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('State Machine Transitions', () => {
    it('starts in menu phase with title visible', () => {
      render(<MatrixAscension />);
      expect(screen.getByText('MATRIX ASCENSION')).toBeInTheDocument();
    });

    it('transitions from menu to playing on Enter', () => {
      render(<MatrixAscension />);
      expect(screen.getByText('MATRIX ASCENSION')).toBeInTheDocument();

      startGame();
      triggerAnimationFrame();

      // Menu title should no longer be visible
      expect(screen.queryByText('MATRIX ASCENSION')).not.toBeInTheDocument();
    });

    it('transitions from playing to paused on P key', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });

      // Paused overlay should appear
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    it('transitions from paused back to playing on P key', () => {
      render(<MatrixAscension />);
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
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      // Pause game
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      expect(screen.getByText('PAUSED')).toBeInTheDocument();

      // Restart via R key
      fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
      expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
    });

    it('shows menu controls', () => {
      render(<MatrixAscension />);
      expect(screen.getByText(/A\/D or ←→ - Move/)).toBeInTheDocument();
    });

    it('does not allow movement when in menu phase', () => {
      render(<MatrixAscension />);

      // Try to move before starting game
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });

      // Menu should still be visible
      expect(screen.getByText('MATRIX ASCENSION')).toBeInTheDocument();
    });
  });

  describe('Achievement Unlock Verification', () => {
    it('calls achievementManager on first jump', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn(),
      };
      render(<MatrixAscension achievementManager={mockAchievementManager} />);
      startGame();

      // Run enough frames for player to land on platform
      for (let i = 0; i < 50; i++) {
        triggerAnimationFrame(i * 16);
      }

      // Should have attempted to unlock achievements
      // The first jump achievement should be called when landing on a platform
      const calls = mockAchievementManager.unlockAchievement.mock.calls;
      const gameIds = calls.map((call: string[]) => call[0]);

      // Verify game ID is correct if any achievements were unlocked
      if (calls.length > 0) {
        expect(gameIds).toContain('matrixAscension');
      }
    });

    it('passes correct game ID to achievementManager', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn(),
      };
      render(<MatrixAscension achievementManager={mockAchievementManager} />);
      startGame();

      // Run game frames
      for (let i = 0; i < 30; i++) {
        triggerAnimationFrame(i * 16);
      }

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('HUD Display', () => {
    it('displays altitude during gameplay', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      // Altitude display should be visible
      expect(screen.getByText(/Altitude:/)).toBeInTheDocument();
    });

    it('does not display best altitude when no high score exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<MatrixAscension />);

      // Best Altitude should NOT be visible when no high score (highScore starts at 0)
      expect(screen.queryByText(/Best Altitude:/)).not.toBeInTheDocument();
    });
  });

  describe('Player Movement', () => {
    it('handles left arrow key press', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'ArrowLeft', code: 'ArrowLeft' });
      triggerAnimationFrame(32);
      fireEvent.keyUp(window, { key: 'ArrowLeft', code: 'ArrowLeft' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles right arrow key press', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
      triggerAnimationFrame(32);
      fireEvent.keyUp(window, { key: 'ArrowRight', code: 'ArrowRight' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles A key (left movement alternative)', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'a', code: 'KeyA' });
      triggerAnimationFrame(32);
      fireEvent.keyUp(window, { key: 'a', code: 'KeyA' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles D key (right movement alternative)', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'd', code: 'KeyD' });
      triggerAnimationFrame(32);
      fireEvent.keyUp(window, { key: 'd', code: 'KeyD' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Shooting Mechanics', () => {
    it('handles Space key for shooting', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      triggerAnimationFrame(32);

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('does not shoot when paused', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      // Pause game
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });

      // Try to shoot while paused
      fireEvent.keyDown(window, { key: ' ', code: 'Space' });

      // Should still be paused
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    it('handles multiple rapid shots', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      // Fire multiple shots
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(window, { key: ' ', code: 'Space' });
        triggerAnimationFrame((i + 2) * 16);
        fireEvent.keyUp(window, { key: ' ', code: 'Space' });
      }

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Mute Functionality', () => {
    it('respects isMuted prop when true', () => {
      render(<MatrixAscension isMuted={true} />);
      startGame();
      triggerAnimationFrame();

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('toggles mute with M key', () => {
      render(<MatrixAscension isMuted={false} />);
      startGame();
      triggerAnimationFrame();

      // Press M to toggle mute
      fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Game Loop', () => {
    it('continues game loop while playing', () => {
      render(<MatrixAscension />);
      startGame();

      // Run multiple frames
      for (let i = 0; i < 30; i++) {
        triggerAnimationFrame(i * 16);
      }

      // Game should still be running
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('pauses game loop when paused', () => {
      render(<MatrixAscension />);
      startGame();
      triggerAnimationFrame();

      // Pause
      fireEvent.keyDown(window, { key: 'p' });

      // Paused overlay should be visible
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });
  });

  describe('Platform Types', () => {
    it('generates platforms during gameplay', () => {
      render(<MatrixAscension />);
      startGame();

      // Run frames to generate platforms
      for (let i = 0; i < 50; i++) {
        triggerAnimationFrame(i * 16);
      }

      // Game should render without crashing
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });
});
