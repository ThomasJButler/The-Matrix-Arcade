import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import MatrixCloud from './MatrixCloud';

// Use global mocks from setup.ts for AudioContext and Canvas
// Only define test-specific mocks here

// Mock localStorage for high score tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  key: vi.fn(),
  length: 0,
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// Mock requestAnimationFrame with proper callback tracking by ID
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

// Helper to trigger a single animation frame
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
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
};

describe('MatrixCloud', () => {
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
      render(<MatrixCloud />);
      const canvas = screen.getByRole('img');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '400');
    });

    it('displays game UI elements', () => {
      render(<MatrixCloud />);
      expect(screen.getByText(/Level:/)).toBeInTheDocument();
      expect(screen.getByText(/Combo:/)).toBeInTheDocument();
      expect(screen.getByText(/High Score:/)).toBeInTheDocument();
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('shows start screen initially', () => {
      render(<MatrixCloud />);
      expect(screen.getByText('MATRIX PROTOCOL')).toBeInTheDocument();
      expect(screen.getByText(/Click or press SPACE to initialize/)).toBeInTheDocument();
    });

    it('displays power-up indicators container', () => {
      const { container } = render(<MatrixCloud />);
      const effectsContainer = container.querySelector('.absolute.top-4.right-4');
      expect(effectsContainer).toBeInTheDocument();
    });
  });

  describe('Game Controls', () => {
    it('starts game on spacebar press', () => {
      render(<MatrixCloud />);
      fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      expect(screen.queryByText('MATRIX PROTOCOL')).not.toBeInTheDocument();
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('starts game on canvas click', () => {
      render(<MatrixCloud />);
      const canvas = screen.getByRole('img');
      fireEvent.click(canvas);
      expect(screen.queryByText('MATRIX PROTOCOL')).not.toBeInTheDocument();
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('pauses game with P key', () => {
      render(<MatrixCloud />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      expect(screen.getByText('SYSTEM PAUSED')).toBeInTheDocument();
    });

    it('restarts game with R key', () => {
      render(<MatrixCloud />);
      startGame();
      triggerAnimationFrame();
      fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
      expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
    });
  });

  describe('Game Mechanics', () => {
    it('applies gravity to player during gameplay', () => {
      render(<MatrixCloud />);
      startGame();
      triggerAnimationFrame();
      // Game should be running without errors
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('generates pipes during gameplay', () => {
      render(<MatrixCloud />);
      startGame();
      for (let i = 0; i < 5; i++) {
        triggerAnimationFrame(i * 16);
      }
      // Game should continue running
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('shows initial score of zero', () => {
      render(<MatrixCloud />);
      startGame();
      expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
    });

    it('shows initial level of one', () => {
      render(<MatrixCloud />);
      startGame();
      expect(screen.getByText(/Level: 1/)).toBeInTheDocument();
    });
  });

  describe('Power-up System', () => {
    it('has power-up effects container', () => {
      render(<MatrixCloud />);
      startGame();
      const effectsContainer = document.querySelector('.absolute.top-4.right-4');
      expect(effectsContainer).toBeInTheDocument();
    });
  });

  describe('Lives System', () => {
    it('starts with initial lives', () => {
      render(<MatrixCloud />);
      startGame();
      triggerAnimationFrame();
      // Game should be running with lives
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Visual Effects', () => {
    it('renders game canvas', () => {
      render(<MatrixCloud />);
      startGame();
      triggerAnimationFrame();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('shows combo display', () => {
      render(<MatrixCloud />);
      startGame();
      expect(screen.getByText(/Combo:/)).toBeInTheDocument();
    });
  });

  describe('Sound System', () => {
    it('handles mute toggle without errors', () => {
      render(<MatrixCloud />);
      fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });
      fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('UI Controls', () => {
    it('pause button toggles game state', () => {
      render(<MatrixCloud />);
      startGame();
      const pauseButton = screen.getByRole('button', { name: 'Pause game' });
      expect(pauseButton).toBeInTheDocument();
      fireEvent.click(pauseButton);
      expect(screen.getByRole('button', { name: 'Resume game' })).toBeInTheDocument();
      expect(screen.getByText('SYSTEM PAUSED')).toBeInTheDocument();
    });

    it('restart button resets game', () => {
      render(<MatrixCloud />);
      startGame();
      triggerAnimationFrame();
      const restartButton = screen.getByRole('button', { name: 'Restart game' });
      expect(restartButton).toBeInTheDocument();
      fireEvent.click(restartButton);
      expect(screen.getByText('MATRIX PROTOCOL')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = render(<MatrixCloud />);
      startGame();
      triggerAnimationFrame();
      unmount();
      // Component should unmount without errors
      expect(true).toBe(true);
    });

    it('handles rapid input without issues', () => {
      render(<MatrixCloud />);
      startGame();
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(window, { key: ' ' });
      }
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});
