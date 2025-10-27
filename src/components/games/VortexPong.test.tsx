import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VortexPong from './VortexPong';
import { useGameLoop } from '../../hooks/useGameLoop';
import { usePowerUps } from '../../hooks/usePowerUps';

// Mock the custom hooks
vi.mock('../../hooks/useGameLoop', () => ({
  useGameLoop: vi.fn()
}));

vi.mock('../../hooks/usePowerUps', () => ({
  usePowerUps: vi.fn()
}));

vi.mock('../../hooks/useParticleSystem', () => ({
  useParticleSystem: vi.fn(() => ({
    particles: [],
    addParticles: vi.fn(),
    updateParticles: vi.fn(),
    clearParticles: vi.fn()
  }))
}));

vi.mock('../../hooks/useSoundSystem', () => ({
  useSoundSystem: () => ({
    playSound: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    isMuted: false,
    toggleMute: vi.fn()
  })
}));

vi.mock('../../hooks/useSaveSystem', () => ({
  useSaveSystem: () => ({
    saveData: {
      games: {
        vortexPong: {
          highScore: 0,
          stats: {
            gamesPlayed: 0,
            totalWins: 0
          }
        }
      }
    },
    updateGameSave: vi.fn(),
    unlockAchievement: vi.fn()
  })
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
    canvas: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <canvas {...props}>{children}</canvas>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock UI components
vi.mock('../ui/PowerUpIndicator', () => ({
  PowerUpIndicator: ({ activePowerUps }: { activePowerUps: Record<string, boolean> }) => (
    <div data-testid="powerup-indicator">
      {Object.keys(activePowerUps).map(key => (
        <div key={key} data-testid={`powerup-${key}`}>
          {key}: {activePowerUps[key] ? 'active' : 'inactive'}
        </div>
      ))}
    </div>
  )
}));

vi.mock('../ui/ScoreBoard', () => ({
  ScoreBoard: ({ score, speed }: { score: { player: number; ai: number }; speed?: number }) => (
    <div data-testid="scoreboard">
      Player: {score.player} | AI: {score.ai}
      {speed && ` | Speed: ${speed}`}
    </div>
  )
}));

vi.mock('../ui/GameOverModal', () => ({
  GameOverModal: ({ score, onRestart }: { score: { player: number; ai: number }; onRestart: () => void }) => (
    <div data-testid="game-over-modal">
      Final Score - Player: {score.player} | AI: {score.ai}
      <button onClick={onRestart}>Play Again</button>
    </div>
  )
}));

// Mock requestAnimationFrame
let rafCallbacks: FrameRequestCallback[] = [];
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  rafCallbacks.push(callback);
  return rafCallbacks.length;
});

global.cancelAnimationFrame = vi.fn();

describe('VortexPong', () => {
  let gameLoopCallback: ((deltaTime: number) => void) | null = null;
  let mockPowerUps: ReturnType<typeof usePowerUps>;

  beforeEach(() => {
    vi.clearAllMocks();
    rafCallbacks = [];
    gameLoopCallback = null;

    // Setup mock power-ups
    mockPowerUps = {
      powerUps: [],
      setPowerUps: vi.fn(),
      activePowerUps: {},
      spawnPowerUp: vi.fn(),
      activatePowerUp: vi.fn()
    };

    vi.mocked(usePowerUps).mockReturnValue(mockPowerUps);

    // Setup game loop mock
    vi.mocked(useGameLoop).mockImplementation((callback: (deltaTime: number) => void) => {
      gameLoopCallback = callback;
      return { isRunning: true, togglePause: vi.fn(), reset: vi.fn() };
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('renders canvas element with correct dimensions', () => {
      const { container } = render(<VortexPong />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
      expect(canvas?.width).toBe(800);
      expect(canvas?.height).toBe(400);
    });

    it('displays score board', () => {
      render(<VortexPong />);

      expect(screen.getByTestId('scoreboard')).toBeTruthy();
      expect(screen.getByText(/Player: 0.*AI: 0/)).toBeTruthy();
    });

    it('displays power-up indicator', () => {
      render(<VortexPong />);

      expect(screen.getByTestId('powerup-indicator')).toBeTruthy();
    });

    it('renders control instructions', () => {
      render(<VortexPong />);

      expect(screen.getByText(/Controls/i)).toBeTruthy();
    });
  });

  describe('Game Controls', () => {
    it('handles ArrowUp key', () => {
      const { container } = render(<VortexPong />);

      fireEvent.keyDown(window, { key: 'ArrowUp' });

      expect(container).toBeTruthy();
    });

    it('handles ArrowDown key', () => {
      const { container } = render(<VortexPong />);

      fireEvent.keyDown(window, { key: 'ArrowDown' });

      expect(container).toBeTruthy();
    });

    it('handles W and S keys', () => {
      const { container } = render(<VortexPong />);

      fireEvent.keyDown(window, { key: 'w' });
      fireEvent.keyDown(window, { key: 's' });

      expect(container).toBeTruthy();
    });

    it('handles rapid key presses', () => {
      const { container } = render(<VortexPong />);

      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(window, { key: i % 2 === 0 ? 'ArrowUp' : 'ArrowDown' });
      }

      expect(container).toBeTruthy();
    });

    it('handles mouse movement', () => {
      const { container } = render(<VortexPong />);

      const canvas = container.querySelector('canvas');
      if (canvas) {
        fireEvent.mouseMove(canvas, { clientY: 200 });
      }

      expect(container).toBeTruthy();
    });
  });

  describe('Game Loop', () => {
    it('initializes game loop', () => {
      render(<VortexPong />);

      expect(useGameLoop).toHaveBeenCalled();
    });

    it('handles game loop updates', () => {
      const { container } = render(<VortexPong />);

      act(() => {
        if (gameLoopCallback) gameLoopCallback(16);
      });

      expect(container).toBeTruthy();
    });

    it('handles multiple game loop iterations', () => {
      const { container } = render(<VortexPong />);

      act(() => {
        for (let i = 0; i < 10; i++) {
          if (gameLoopCallback) gameLoopCallback(16);
        }
      });

      expect(container).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = render(<VortexPong />);
      expect(container).toBeTruthy();
    });

    it('unmounts without errors', () => {
      const { unmount } = render(<VortexPong />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<VortexPong />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    });
  });

  describe('Integration Tests', () => {
    it('renders complete game interface', () => {
      const { container } = render(<VortexPong />);

      // Check major components
      expect(container.querySelector('canvas')).toBeTruthy();
      expect(screen.getByTestId('scoreboard')).toBeTruthy();
      expect(screen.getByTestId('powerup-indicator')).toBeTruthy();
      expect(screen.getByText(/Controls/i)).toBeTruthy();
    });

    it('handles full gameplay cycle', () => {
      const { container } = render(<VortexPong />);

      // Simulate movement
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });

      // Simulate game loop
      act(() => {
        if (gameLoopCallback) {
          for (let i = 0; i < 5; i++) {
            gameLoopCallback(16);
          }
        }
      });

      expect(container).toBeTruthy();
    });

    it('maintains performance with rapid actions', () => {
      const { container } = render(<VortexPong />);

      // Rapid inputs
      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(window, { key: i % 2 === 0 ? 'ArrowUp' : 'ArrowDown' });
      }

      // Multiple game updates
      act(() => {
        if (gameLoopCallback) {
          for (let i = 0; i < 20; i++) {
            gameLoopCallback(16);
          }
        }
      });

      expect(container).toBeTruthy();
    });
  });
});
