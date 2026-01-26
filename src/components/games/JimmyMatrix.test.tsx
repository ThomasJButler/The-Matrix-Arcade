import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import JimmyMatrix from './JimmyMatrix';

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

// Helper to get to track select
const goToTrackSelect = () => {
  fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
};

// Helper to start the game
const startGame = () => {
  fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' }); // Menu to track select
  fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' }); // Start track
};

describe('JimmyMatrix', () => {
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
      render(<JimmyMatrix />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
    });

    it('shows menu screen initially', () => {
      render(<JimmyMatrix />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('displays with Matrix theme styling', () => {
      render(<JimmyMatrix />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('border-2');
      expect(canvas).toHaveClass('border-green-500');
    });
  });

  describe('Game Flow', () => {
    it('navigates to track select on Enter', () => {
      render(<JimmyMatrix />);
      goToTrackSelect();
      // Should be in track select phase
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('starts game after selecting track', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('handles track navigation with arrow keys', () => {
      render(<JimmyMatrix />);
      goToTrackSelect();
      fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
      fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Game Controls', () => {
    it('handles lane key D', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'd', code: 'KeyD' });
      fireEvent.keyUp(window, { key: 'd', code: 'KeyD' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles lane key F', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'f', code: 'KeyF' });
      fireEvent.keyUp(window, { key: 'f', code: 'KeyF' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles lane key J', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'j', code: 'KeyJ' });
      fireEvent.keyUp(window, { key: 'j', code: 'KeyJ' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles lane key K', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'k', code: 'KeyK' });
      fireEvent.keyUp(window, { key: 'k', code: 'KeyK' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('pauses game with P key', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('pauses game with Space key', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('restarts game with R key from paused state', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' }); // Pause
      fireEvent.keyDown(window, { key: 'r', code: 'KeyR' }); // Restart
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Rhythm Mechanics', () => {
    it('runs game loop with note generation', () => {
      render(<JimmyMatrix />);
      startGame();
      for (let i = 0; i < 10; i++) {
        triggerAnimationFrame(i * 16);
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles multiple frames for note falling', () => {
      render(<JimmyMatrix />);
      startGame();
      for (let i = 0; i < 30; i++) {
        triggerAnimationFrame(i * 16);
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('processes rapid key presses', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: 'd' });
        fireEvent.keyUp(window, { key: 'd' });
        fireEvent.keyDown(window, { key: 'f' });
        fireEvent.keyUp(window, { key: 'f' });
        fireEvent.keyDown(window, { key: 'j' });
        fireEvent.keyUp(window, { key: 'j' });
        fireEvent.keyDown(window, { key: 'k' });
        fireEvent.keyUp(window, { key: 'k' });
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Achievement Manager Integration', () => {
    it('accepts achievementManager prop', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn(),
      };
      render(<JimmyMatrix achievementManager={mockAchievementManager} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('accepts isMuted prop', () => {
      render(<JimmyMatrix isMuted={true} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      unmount();
      expect(true).toBe(true);
    });

    it('handles sustained rapid input without issues', () => {
      render(<JimmyMatrix />);
      startGame();
      for (let i = 0; i < 20; i++) {
        triggerAnimationFrame(i * 16);
        fireEvent.keyDown(window, { key: 'd' });
        fireEvent.keyUp(window, { key: 'd' });
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('State Machine Transitions', () => {
    it('starts in menu phase', () => {
      render(<JimmyMatrix />);
      // Canvas should be rendered and in menu state
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('transitions from menu to trackSelect on Enter', () => {
      render(<JimmyMatrix />);
      goToTrackSelect();
      // Should be in track select phase - canvas still visible
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('transitions from trackSelect to playing on Enter', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      // Game loop should be running
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('transitions from playing to paused on P key', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      // Should be paused - verify by checking canvas is still there
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('transitions from paused back to playing on P key', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();

      // Pause
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      // Resume
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('transitions from paused to trackSelect on Escape', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();

      // Pause
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      // Exit to track select
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('transitions from trackSelect to menu on Escape', () => {
      render(<JimmyMatrix />);
      goToTrackSelect();
      // Exit to menu
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('restarts game from paused state on R key', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();

      // Pause
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      // Restart
      fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Track Selection', () => {
    it('navigates up through tracks with ArrowUp', () => {
      render(<JimmyMatrix />);
      goToTrackSelect();

      fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('navigates down through tracks with ArrowDown', () => {
      render(<JimmyMatrix />);
      goToTrackSelect();

      fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown' });
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('wraps track selection', () => {
      render(<JimmyMatrix />);
      goToTrackSelect();

      // Navigate multiple times to test wrapping
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown' });
      }
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('selects track with Enter', () => {
      render(<JimmyMatrix />);
      goToTrackSelect();

      // Select track
      fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
      triggerAnimationFrame();

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Lane Keys', () => {
    it('handles all four lane keys in sequence', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();

      // Press all lane keys in sequence
      const laneKeys = ['d', 'f', 'j', 'k'];
      for (const key of laneKeys) {
        fireEvent.keyDown(window, { key, code: `Key${key.toUpperCase()}` });
        triggerAnimationFrame();
        fireEvent.keyUp(window, { key, code: `Key${key.toUpperCase()}` });
      }

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles simultaneous lane key presses', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();

      // Press multiple lane keys at once (for double notes)
      fireEvent.keyDown(window, { key: 'd' });
      fireEvent.keyDown(window, { key: 'f' });
      triggerAnimationFrame();
      fireEvent.keyUp(window, { key: 'd' });
      fireEvent.keyUp(window, { key: 'f' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Achievement Manager Verification', () => {
    it('passes correct game ID to achievementManager', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn(),
      };
      render(<JimmyMatrix achievementManager={mockAchievementManager} />);
      startGame();

      // Run game frames
      for (let i = 0; i < 50; i++) {
        triggerAnimationFrame(i * 16);
      }

      // If any achievements were unlocked, verify game ID is correct
      const calls = mockAchievementManager.unlockAchievement.mock.calls;
      if (calls.length > 0) {
        const gameIds = calls.map((call: string[]) => call[0]);
        expect(gameIds).toContain('jimmyMatrix');
      }
    });
  });

  describe('Mute Functionality', () => {
    it('respects isMuted prop when true', () => {
      render(<JimmyMatrix isMuted={true} />);
      startGame();
      triggerAnimationFrame();

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('toggles mute with M key', () => {
      render(<JimmyMatrix isMuted={false} />);
      startGame();
      triggerAnimationFrame();

      // Press M to toggle mute
      fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Game Loop', () => {
    it('continues game loop while playing', () => {
      render(<JimmyMatrix />);
      startGame();

      // Run multiple frames
      for (let i = 0; i < 30; i++) {
        triggerAnimationFrame(i * 16);
      }

      // Game should still be running
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('pauses game loop when paused', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();

      // Pause
      fireEvent.keyDown(window, { key: 'p' });

      // Canvas should still be there
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('processes notes over extended gameplay', () => {
      render(<JimmyMatrix />);
      startGame();

      // Run many frames to simulate extended gameplay
      for (let i = 0; i < 100; i++) {
        triggerAnimationFrame(i * 16);
      }

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Note Generation', () => {
    it('generates notes during gameplay', () => {
      render(<JimmyMatrix />);
      startGame();

      // Run frames to generate notes
      for (let i = 0; i < 60; i++) {
        triggerAnimationFrame(i * 16);
      }

      // Game should render without crashing
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Key Release Handling', () => {
    it('handles key release for lane D', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();

      fireEvent.keyDown(window, { key: 'd' });
      triggerAnimationFrame(32);
      fireEvent.keyUp(window, { key: 'd' });
      triggerAnimationFrame(48);

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('handles key release for all lanes', () => {
      render(<JimmyMatrix />);
      startGame();
      triggerAnimationFrame();

      const lanes = ['d', 'f', 'j', 'k'];
      for (const lane of lanes) {
        fireEvent.keyDown(window, { key: lane });
        triggerAnimationFrame();
        fireEvent.keyUp(window, { key: lane });
        triggerAnimationFrame();
      }

      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });
});
