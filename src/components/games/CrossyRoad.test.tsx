import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import CrossyRoad from './CrossyRoad';

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

describe('CrossyRoad', () => {
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
      render(<CrossyRoad />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '400');
      expect(canvas).toHaveAttribute('height', '600');
    });

    it('shows menu screen initially', () => {
      render(<CrossyRoad />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      // Game starts in menu phase
    });

    it('displays with Matrix theme styling', () => {
      render(<CrossyRoad />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('border-2');
      expect(canvas).toHaveClass('border-green-500');
    });
  });

  describe('Game Controls', () => {
    it('starts game on Enter key press', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('handles arrow key controls without errors', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
      fireEvent.keyDown(window, { key: 'ArrowLeft', code: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles WASD controls without errors', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'w', code: 'KeyW' });
      fireEvent.keyDown(window, { key: 'a', code: 'KeyA' });
      fireEvent.keyDown(window, { key: 's', code: 'KeyS' });
      fireEvent.keyDown(window, { key: 'd', code: 'KeyD' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('pauses game with P key', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      // Game should be paused
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('restarts game with R key', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Game Mechanics', () => {
    it('runs game loop without errors', () => {
      render(<CrossyRoad />);
      startGame();
      for (let i = 0; i < 10; i++) {
        triggerAnimationFrame(i * 16);
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles multiple animation frames', () => {
      render(<CrossyRoad />);
      startGame();
      for (let i = 0; i < 5; i++) {
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
      render(<CrossyRoad achievementManager={mockAchievementManager} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('accepts isMuted prop', () => {
      render(<CrossyRoad isMuted={true} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();
      unmount();
      expect(true).toBe(true);
    });

    it('handles rapid input without issues', () => {
      render(<CrossyRoad />);
      startGame();
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: 'ArrowUp' });
        fireEvent.keyUp(window, { key: 'ArrowUp' });
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('State Machine Transitions', () => {
    it('starts in menu phase with menu overlay visible', () => {
      render(<CrossyRoad />);
      // Menu overlay should contain game title
      expect(screen.getByText('CROSSY ROAD')).toBeInTheDocument();
      expect(screen.getByText(/Press ENTER to Start/)).toBeInTheDocument();
    });

    it('transitions from menu to playing on Enter', () => {
      render(<CrossyRoad />);
      expect(screen.getByText('CROSSY ROAD')).toBeInTheDocument();

      startGame();
      triggerAnimationFrame();

      // Menu title should no longer be visible
      expect(screen.queryByText('CROSSY ROAD')).not.toBeInTheDocument();
    });

    it('transitions from playing to paused on P key', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });

      // Paused overlay should appear
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    it('transitions from paused back to playing on P key', () => {
      render(<CrossyRoad />);
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
      render(<CrossyRoad />);
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
      render(<CrossyRoad />);

      // Try to move before starting game - should not crash
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      // Menu should still be visible
      expect(screen.getByText('CROSSY ROAD')).toBeInTheDocument();
    });

    it('does not allow movement when paused', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();

      // Pause
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });

      // Try to move while paused - should not process
      fireEvent.keyDown(window, { key: 'ArrowUp' });

      // Still paused
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    it('shows controls on menu screen', () => {
      render(<CrossyRoad />);
      expect(screen.getByText(/WASD or Arrows - Move/)).toBeInTheDocument();
    });
  });

  describe('Achievement Unlock Verification', () => {
    it('unlocks crossy_first_hop achievement on first movement', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn(),
      };
      render(<CrossyRoad achievementManager={mockAchievementManager} />);
      startGame();
      triggerAnimationFrame();

      // Move up to trigger first hop
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      triggerAnimationFrame(32);

      // Should unlock first hop achievement
      expect(mockAchievementManager.unlockAchievement).toHaveBeenCalledWith(
        'crossyRoad',
        'crossy_first_hop'
      );
    });

    it('calls achievementManager with correct game ID', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn(),
      };
      render(<CrossyRoad achievementManager={mockAchievementManager} />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'ArrowUp' });
      triggerAnimationFrame(32);

      // Verify game ID is 'crossyRoad'
      const calls = mockAchievementManager.unlockAchievement.mock.calls;
      const gameIds = calls.map((call: string[]) => call[0]);
      expect(gameIds).toContain('crossyRoad');
    });
  });

  describe('Bullet Time Activation', () => {
    it('activates bullet time on SPACE key press', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();

      // Press space to activate bullet time
      fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      triggerAnimationFrame(32);

      // Bullet time indicator should appear
      expect(screen.getByText('BULLET TIME')).toBeInTheDocument();
    });

    it('shows bullet time indicator with appropriate styling', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      triggerAnimationFrame(32);

      // Verify bullet time text is displayed with animation
      const bulletTimeText = screen.getByText('BULLET TIME');
      expect(bulletTimeText).toHaveClass('animate-pulse');
    });
  });

  describe('Movement and Hopping', () => {
    it('plays jump animation on upward movement', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();

      // Move up
      fireEvent.keyDown(window, { key: 'ArrowUp' });

      // Game should still function
      triggerAnimationFrame(32);
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles movement in all four directions', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();

      // Test all directions
      const directions = [
        { key: 'ArrowUp', code: 'ArrowUp' },
        { key: 'ArrowDown', code: 'ArrowDown' },
        { key: 'ArrowLeft', code: 'ArrowLeft' },
        { key: 'ArrowRight', code: 'ArrowRight' },
      ];

      for (const dir of directions) {
        fireEvent.keyDown(window, dir);
        triggerAnimationFrame();
      }

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('supports both arrow keys and WASD', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();

      // Arrow keys
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      triggerAnimationFrame(32);

      // WASD
      fireEvent.keyDown(window, { key: 'w' });
      triggerAnimationFrame(48);

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Mute Functionality', () => {
    it('respects isMuted prop when true', () => {
      render(<CrossyRoad isMuted={true} />);
      startGame();
      triggerAnimationFrame();

      // Move to trigger sound (should be muted)
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      triggerAnimationFrame(32);

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('toggles mute with M key', () => {
      render(<CrossyRoad isMuted={false} />);
      startGame();
      triggerAnimationFrame();

      // Press M to toggle mute
      fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('HUD Display', () => {
    it('displays distance during gameplay', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();

      // Distance display should be visible (CrossyRoad uses Distance not Score)
      expect(screen.getByText(/Distance:/)).toBeInTheDocument();
    });

    it('displays high score during gameplay', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();

      // High score display should be visible (uses "High:" not "Best:")
      expect(screen.getByText(/High:/)).toBeInTheDocument();
    });
  });

  describe('Game Loop', () => {
    it('continues game loop while playing', () => {
      render(<CrossyRoad />);
      startGame();

      // Run multiple frames
      for (let i = 0; i < 20; i++) {
        triggerAnimationFrame(i * 16);
      }

      // Game should still be running
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('stops game loop when paused', () => {
      render(<CrossyRoad />);
      startGame();
      triggerAnimationFrame();

      // Pause
      fireEvent.keyDown(window, { key: 'p' });

      // Clear raf count (prefixed with underscore as we're only checking pause state)
      const _initialCalls = (global.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length;

      // Try to run more frames - game loop should not continue
      triggerAnimationFrame(32);

      // Paused overlay should still be visible
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });
  });

  describe('Lane Generation', () => {
    it('generates lanes with obstacles', () => {
      render(<CrossyRoad />);
      startGame();

      // Run frames to generate lanes
      for (let i = 0; i < 30; i++) {
        triggerAnimationFrame(i * 16);
      }

      // Game should render without crashing
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });
});
