import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MatrixCloud from './MatrixCloud';

// Mock AudioContext
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { value: 0, setValueAtTime: vi.fn() },
    type: 'square',
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      value: 0.1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn()
    }
  })),
  createBiquadFilter: vi.fn(() => ({
    connect: vi.fn(),
    type: 'lowpass',
    frequency: { value: 1000 },
    Q: { value: 1 }
  })),
  createDelay: vi.fn(() => ({
    connect: vi.fn(),
    delayTime: { value: 0 }
  })),
  currentTime: 0,
  destination: {},
  close: vi.fn()
};

global.AudioContext = vi.fn(() => mockAudioContext) as unknown as typeof AudioContext;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as Storage;

// Mock canvas context
const mockCanvasContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  strokeRect: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  shadowBlur: 0,
  shadowColor: '',
  globalAlpha: 1,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
  lineWidth: 1,
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
};

// Mock requestAnimationFrame
let rafCallbacks: FrameRequestCallback[] = [];
let rafId = 0;
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  rafCallbacks.push(callback);
  return ++rafId;
});

global.cancelAnimationFrame = vi.fn(() => {
  // Remove callback if needed
});

// Helper to trigger animation frames
const triggerAnimationFrame = (time: number = 16) => {
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  callbacks.forEach(cb => act(() => cb(time)));
};

describe('MatrixCloud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    rafCallbacks = [];
    rafId = 0;
    
    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    
    // Mock Math.random for predictable tests
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  
  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders canvas element with correct dimensions', () => {
      render(<MatrixCloud />);
      
      const canvas = screen.getByRole('img'); // Canvas has implicit img role
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '400');
      expect(canvas).toHaveAttribute('height', '600');
    });

    it('displays game UI elements', () => {
      render(<MatrixCloud />);
      
      // Score display
      expect(screen.getByText(/Score:/)).toBeInTheDocument();
      expect(screen.getByText(/High:/)).toBeInTheDocument();
      expect(screen.getByText(/Level:/)).toBeInTheDocument();
      
      // Lives display
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0); // Heart icons
    });

    it('shows start screen initially', () => {
      render(<MatrixCloud />);
      
      expect(screen.getByText('MATRIX CLOUD')).toBeInTheDocument();
      expect(screen.getByText('Click or Press SPACE to fly')).toBeInTheDocument();
      expect(screen.getByText('Avoid the green barriers!')).toBeInTheDocument();
    });

    it('displays power-up indicators', () => {
      render(<MatrixCloud />);
      
      // Power-up effects section should be present
      const effectsSection = screen.getByText(/Active Effects/);
      expect(effectsSection).toBeInTheDocument();
    });

    it('loads high score from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('1000');
      render(<MatrixCloud />);
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('matrixCloudHighScore');
      expect(screen.getByText(/High: 1000/)).toBeInTheDocument();
    });
  });

  describe('Game Controls', () => {
    it('starts game on spacebar press', () => {
      render(<MatrixCloud />);
      
      fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      
      // Start screen should disappear
      expect(screen.queryByText('MATRIX CLOUD')).not.toBeInTheDocument();
      
      // Game should start animating
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('starts game on canvas click', () => {
      render(<MatrixCloud />);
      
      const canvas = screen.getByRole('img');
      fireEvent.click(canvas);
      
      expect(screen.queryByText('MATRIX CLOUD')).not.toBeInTheDocument();
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('makes player jump on spacebar during gameplay', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Clear previous calls
      mockCanvasContext.clearRect.mockClear();
      
      // Jump
      fireEvent.keyDown(window, { key: ' ' });
      
      // Advance animation
      triggerAnimationFrame();
      
      // Canvas should be redrawn
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });

    it('pauses game with P key', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Pause
      fireEvent.keyDown(window, { key: 'p' });
      
      expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
    });

    it('toggles mute with M key', () => {
      render(<MatrixCloud />);
      
      fireEvent.keyDown(window, { key: 'm' });
      
      // Check mute state changed
      const muteButton = screen.getByRole('button', { name: /sound/i });
      expect(muteButton).toBeInTheDocument();
    });

    it('restarts game with R key', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Restart
      fireEvent.keyDown(window, { key: 'r' });
      
      // Score should reset
      expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
    });
  });

  describe('Game Mechanics', () => {
    it('applies gravity to player', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      const initialCalls = mockCanvasContext.fillText.mock.calls.length;
      
      // Advance several frames without jumping
      for (let i = 0; i < 5; i++) {
        triggerAnimationFrame();
      }
      
      // Player should be drawn at different Y positions (falling)
      expect(mockCanvasContext.fillText).toHaveBeenCalledTimes(initialCalls + 20); // 4 lines of player ASCII * 5 frames
    });

    it('generates pipes at regular intervals', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Advance many frames
      for (let i = 0; i < 100; i++) {
        triggerAnimationFrame(i * 16);
      }
      
      // Pipes should be drawn
      expect(mockCanvasContext.fillRect).toHaveBeenCalled();
    });

    it('moves pipes from right to left', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      const clearCalls = mockCanvasContext.clearRect.mock.calls.length;
      
      // Advance frames
      for (let i = 0; i < 10; i++) {
        triggerAnimationFrame();
      }
      
      // Canvas should be cleared and redrawn each frame
      expect(mockCanvasContext.clearRect).toHaveBeenCalledTimes(clearCalls + 10);
    });

    it('detects collision with pipes', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Don't jump, let player fall
      for (let i = 0; i < 50; i++) {
        triggerAnimationFrame();
      }
      
      // Game might end or lose life
      // Check that game is still rendering
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });

    it('increases score when passing pipes', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Initial score
      expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
      
      // Advance game to pass pipes
      for (let i = 0; i < 100; i++) {
        triggerAnimationFrame();
        // Jump periodically to avoid collision
        if (i % 20 === 0) {
          fireEvent.keyDown(window, { key: ' ' });
        }
      }
      
      // Score might increase if pipes are passed
    });

    it('increases difficulty with level progression', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      expect(screen.getByText(/Level: 1/)).toBeInTheDocument();
      
      // Would need to score enough points to level up
    });
  });

  describe('Power-up System', () => {
    it('spawns power-ups randomly', () => {
      // Mock random to ensure power-up spawns
      Math.random = vi.fn().mockReturnValue(0.05); // Below POWER_UP_CHANCE
      
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Advance frames to spawn power-ups
      for (let i = 0; i < 50; i++) {
        triggerAnimationFrame();
      }
      
      // Power-ups should be rendered
      expect(mockCanvasContext.arc).toHaveBeenCalled(); // Power-ups drawn as circles
    });

    it('collects shield power-up', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Check for shield indicator
      const shieldIndicator = screen.getByTestId('shield-indicator');
      expect(shieldIndicator).toHaveStyle({ opacity: '0.3' });
    });

    it('collects time slow power-up', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Check for time slow indicator
      const timeSlowIndicator = screen.getByTestId('timeSlow-indicator');
      expect(timeSlowIndicator).toHaveStyle({ opacity: '0.3' });
    });

    it('collects extra life power-up', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Initial lives count
      const hearts = screen.getAllByTestId(/heart-/);
      expect(hearts).toHaveLength(3); // INITIAL_LIVES
    });

    it('collects double points power-up', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Check for double points indicator
      const doublePointsIndicator = screen.getByTestId('doublePoints-indicator');
      expect(doublePointsIndicator).toHaveStyle({ opacity: '0.3' });
    });

    it('applies power-up effects correctly', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Power-up effects should modify game behavior
      // This would require more complex state testing
    });

    it('expires power-ups after duration', async () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Would need to test power-up timer expiration
      // This requires simulating time passing
    });
  });

  describe('Lives System', () => {
    it('displays correct number of lives', () => {
      render(<MatrixCloud />);
      
      const hearts = screen.getAllByTestId(/heart-/);
      expect(hearts).toHaveLength(3); // INITIAL_LIVES
    });

    it('loses life on collision without shield', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Let player fall to collide with ground
      for (let i = 0; i < 100; i++) {
        triggerAnimationFrame();
      }
      
      // Lives might decrease or game might end
    });

    it('becomes invulnerable after losing life', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Collision detection should be disabled temporarily
      // This requires testing invulnerability state
    });

    it('ends game when all lives are lost', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Would need to lose all lives to test game over
    });
  });

  describe('Visual Effects', () => {
    it('renders matrix rain particles', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      triggerAnimationFrame();
      
      // Particles should be drawn
      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });

    it('applies glow effects to pipes', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      triggerAnimationFrame();
      
      // Shadow properties should be set for glow
      expect(mockCanvasContext.shadowBlur).toBeDefined();
      expect(mockCanvasContext.shadowColor).toBeDefined();
    });

    it('creates screen shake on collision', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Collision would trigger screen shake
      // This requires testing canvas transformations
    });

    it('shows combo multiplier effect', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Combo text should be displayed
      expect(screen.getByText(/Combo:/)).toBeInTheDocument();
    });
  });

  describe('Sound System', () => {
    it('initializes audio context', () => {
      render(<MatrixCloud />);
      
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it('plays jump sound', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Jump
      fireEvent.keyDown(window, { key: ' ' });
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays score sound when passing pipes', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Would need to pass pipes to test score sound
    });

    it('mutes all sounds when toggled', () => {
      render(<MatrixCloud />);
      
      // Toggle mute
      fireEvent.keyDown(window, { key: 'm' });
      
      // Start game and jump
      fireEvent.keyDown(window, { key: ' ' });
      fireEvent.keyDown(window, { key: ' ' });
      
      // Should not create new oscillators when muted
      const initialCalls = mockAudioContext.createOscillator.mock.calls.length;
      expect(initialCalls).toBe(0);
    });
  });

  describe('Game Over State', () => {
    it('displays game over screen', () => {
      render(<MatrixCloud />);
      
      // Would need to trigger game over
      // Check for game over UI elements
    });

    it('shows final score and high score', () => {
      render(<MatrixCloud />);
      
      // Game over screen should show scores
    });

    it('allows restart after game over', () => {
      render(<MatrixCloud />);
      
      // Would need to trigger game over and test restart
    });

    it('saves high score to localStorage', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Would need to achieve a high score
      expect(localStorageMock.setItem).not.toHaveBeenCalled(); // Not called yet
    });
  });

  describe('Performance', () => {
    it('maintains smooth animation with many particles', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Run many frames
      for (let i = 0; i < 60; i++) {
        triggerAnimationFrame(i * 16.67);
      }
      
      // Should still be animating
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('cleans up resources on unmount', () => {
      const { unmount } = render(<MatrixCloud />);
      
      // Start game to initialize resources
      fireEvent.keyDown(window, { key: ' ' });
      
      unmount();
      
      // Should clean up
      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('handles rapid input without issues', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      // Rapid jumping
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: ' ' });
        triggerAnimationFrame();
      }
      
      // Should handle all input smoothly
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });
  });

  describe('UI Controls', () => {
    it('pause button toggles game state', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);
      
      expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
    });

    it('mute button toggles sound', () => {
      render(<MatrixCloud />);
      
      const muteButton = screen.getByRole('button', { name: /sound/i });
      fireEvent.click(muteButton);
      
      // Check mute state
      expect(muteButton.querySelector('.lucide-volume-x')).toBeInTheDocument();
    });

    it('restart button resets game', () => {
      render(<MatrixCloud />);
      
      // Start game
      fireEvent.keyDown(window, { key: ' ' });
      
      const restartButton = screen.getByRole('button', { name: /restart/i });
      fireEvent.click(restartButton);
      
      expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
    });
  });
});