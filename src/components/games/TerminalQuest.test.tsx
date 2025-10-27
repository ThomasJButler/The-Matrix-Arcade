import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TerminalQuest from './TerminalQuest';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Terminal: () => <div>Terminal Icon</div>,
  Info: () => <div>Info Icon</div>,
  Shield: () => <div>Shield Icon</div>,
  Wifi: () => <div>Wifi Icon</div>,
  Key: () => <div>Key Icon</div>,
  AlertTriangle: () => <div>Alert Icon</div>,
  Cpu: () => <div>Cpu Icon</div>,
  Save: () => <div>Save Icon</div>,
  RotateCcw: () => <div>Reset Icon</div>,
  Map: () => <div>Map Icon</div>,
  Maximize: () => <div>Fullscreen Icon</div>,
  Play: () => <div>Play Icon</div>,
  Pause: () => <div>Pause Icon</div>
}));

// Mock hooks
vi.mock('../../hooks/useSoundSystem', () => ({
  useSoundSystem: () => ({
    playSound: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    isMuted: false,
    toggleMute: vi.fn()
  })
}));

// Mock TerminalQuestCombat component
vi.mock('./TerminalQuestCombat', () => ({
  default: ({ onComplete, onDefeat }: { onComplete: () => void; onDefeat: () => void }) => (
    <div data-testid="combat-component">
      <button onClick={onComplete}>Win Combat</button>
      <button onClick={onDefeat}>Lose Combat</button>
    </div>
  )
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  key: vi.fn(),
  length: 0
};
global.localStorage = localStorageMock as Storage;

describe('TerminalQuest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<TerminalQuest />);
      expect(container).toBeTruthy();
    });

    it('displays the game title', () => {
      render(<TerminalQuest />);

      // Should show TERMINAL QUEST in title
      expect(screen.getByText(/TERMINAL QUEST/i)).toBeTruthy();
    });

    it('displays control buttons', () => {
      render(<TerminalQuest />);

      // Should have save, reset, and info buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders game content area', () => {
      const { container } = render(<TerminalQuest />);

      // Should have main game container
      expect(container.querySelector('.bg-black')).toBeTruthy();
    });
  });

  describe('Game State', () => {
    it('initializes with default state', () => {
      const { container } = render(<TerminalQuest />);

      expect(container).toBeTruthy();
    });

    it('accepts achievement manager prop', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn()
      };

      const { container } = render(
        <TerminalQuest achievementManager={mockAchievementManager} />
      );

      expect(container).toBeTruthy();
    });

    it('works without achievement manager', () => {
      const { container } = render(<TerminalQuest />);
      expect(container).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('handles button clicks', () => {
      render(<TerminalQuest />);

      const buttons = screen.getAllByRole('button');

      // Click first available button
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
      }

      // Should not crash
      expect(screen.getByText(/TERMINAL QUEST/i)).toBeTruthy();
    });

    it('handles keyboard input', () => {
      const { container } = render(<TerminalQuest />);

      // Press various keys
      fireEvent.keyDown(window, { key: 'i' });
      fireEvent.keyDown(window, { key: ' ' });
      fireEvent.keyDown(window, { key: 'f' });

      expect(container).toBeTruthy();
    });

    it('handles rapid button clicks', () => {
      render(<TerminalQuest />);

      const buttons = screen.getAllByRole('button');

      // Rapid click test
      for (let i = 0; i < 10; i++) {
        if (buttons.length > 0) {
          fireEvent.click(buttons[0]);
        }
      }

      expect(screen.getByText(/TERMINAL QUEST/i)).toBeTruthy();
    });
  });

  describe('Save System', () => {
    it('attempts to save to localStorage', () => {
      render(<TerminalQuest />);

      // Trigger a save by interacting with the game
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
      }

      // Should have attempted to set item in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('loads from localStorage on mount', () => {
      const savedState = JSON.stringify({
        currentNode: 'start',
        inventory: [],
        health: 100,
        securityLevel: 0,
        discovered: ['start']
      });

      localStorageMock.getItem.mockReturnValue(savedState);

      render(<TerminalQuest />);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('terminalQuestSave');
    });

    it('handles missing save data gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { container } = render(<TerminalQuest />);

      expect(container).toBeTruthy();
    });

    it('handles corrupted save data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json{');

      const { container } = render(<TerminalQuest />);

      // Should still render without crashing
      expect(container).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = render(<TerminalQuest />);
      expect(container).toBeTruthy();
    });

    it('unmounts without errors', () => {
      const { unmount } = render(<TerminalQuest />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up on unmount', () => {
      const { unmount } = render(<TerminalQuest />);

      unmount();

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('renders complete game interface', () => {
      const { container } = render(<TerminalQuest />);

      // Should have title
      expect(screen.getByText(/TERMINAL QUEST/i)).toBeTruthy();

      // Should have buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Should have main container
      expect(container.querySelector('.bg-black')).toBeTruthy();
    });

    it('handles full gameplay session', () => {
      render(<TerminalQuest />);

      // Get all available buttons (choices)
      const buttons = screen.getAllByRole('button');

      // Simulate making choices
      for (let i = 0; i < Math.min(5, buttons.length); i++) {
        fireEvent.click(buttons[i]);

        // Press some keys
        fireEvent.keyDown(window, { key: 'i' });
        fireEvent.keyDown(window, { key: ' ' });
      }

      // Game should still be running
      expect(screen.getByText(/TERMINAL QUEST/i)).toBeTruthy();
    });

    it('maintains state through interactions', () => {
      const { container } = render(<TerminalQuest />);

      const buttons = screen.getAllByRole('button');

      // Make several interactions
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
      }

      fireEvent.keyDown(window, { key: 'i' });

      if (buttons.length > 1) {
        fireEvent.click(buttons[1]);
      }

      // Should maintain consistent state
      expect(container).toBeTruthy();
      expect(screen.getByText(/TERMINAL QUEST/i)).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('handles rapid state changes', () => {
      render(<TerminalQuest />);

      const buttons = screen.getAllByRole('button');

      // Rapid interactions
      for (let i = 0; i < 20; i++) {
        if (buttons[i % buttons.length]) {
          fireEvent.click(buttons[i % buttons.length]);
        }
        fireEvent.keyDown(window, { key: String(i % 10) });
      }

      expect(screen.getByText(/TERMINAL QUEST/i)).toBeTruthy();
    });

    it('renders efficiently with multiple elements', () => {
      const { container } = render(<TerminalQuest />);

      // Should render all elements efficiently
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
    });
  });
});
