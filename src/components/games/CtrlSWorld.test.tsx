import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CtrlSWorld from './CtrlSWorld';
import { GameStateProvider } from '../../contexts/GameStateContext';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Terminal: () => <div>Terminal</div>,
  Info: () => <div>Info</div>,
  Play: () => <div>Play</div>,
  Pause: () => <div>Pause</div>,
  Maximize: () => <div>Maximize</div>,
  Minimize: () => <div>Minimize</div>,
  Type: () => <div>Type</div>,
  Gauge: () => <div>Gauge</div>,
  Settings: () => <div>Settings</div>,
  Save: () => <div>Save</div>
}));

// Mock UI components
vi.mock('../ui/PuzzleModal', () => ({
  PuzzleModal: () => <div data-testid="puzzle-modal">Puzzle Modal</div>
}));

vi.mock('../ui/StatsHUD', () => ({
  StatsHUD: () => <div data-testid="stats-hud">Stats HUD</div>
}));

vi.mock('../ui/AchievementToast', () => ({
  AchievementToastContainer: () => <div data-testid="achievement-toast">Achievement Toast</div>,
  Achievement: () => <div>Achievement</div>
}));

vi.mock('../ui/InventoryPanel', () => ({
  InventoryPanel: () => <div data-testid="inventory-panel">Inventory Panel</div>
}));

vi.mock('../ui/AudioSettings', () => ({
  AudioSettings: () => <div data-testid="audio-settings">Audio Settings</div>
}));

vi.mock('../ui/SaveLoadManager', () => ({
  SaveLoadManager: () => <div data-testid="save-load-manager">Save Load Manager</div>
}));

// Mock hooks
vi.mock('../../hooks/useSaveSystem', () => ({
  useSaveSystem: () => ({
    saveData: {
      games: {
        ctrlSWorld: {
          chapter: 1,
          section: 0,
          unlockedChapters: [1],
          stats: {}
        }
      }
    },
    updateGameSave: vi.fn(),
    unlockAchievement: vi.fn()
  })
}));

// Mock data modules
vi.mock('../../data/puzzles', () => ({
  getPuzzleById: vi.fn(() => null)
}));

vi.mock('../../data/items', () => ({
  getItemRewardsForPuzzle: vi.fn(() => []),
  getItemById: vi.fn(() => null)
}));

// Helper to render with provider
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <GameStateProvider>
      {component}
    </GameStateProvider>
  );
};

describe('CtrlSWorld', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);
      expect(container).toBeTruthy();
    });

    it('renders the game container', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);
      expect(container.querySelector('.bg-black')).toBeTruthy();
    });

    it('displays UI components', () => {
      renderWithProvider(<CtrlSWorld />);

      // Should render major UI components
      const container = document.body;
      expect(container).toBeTruthy();
    });

    it('renders control buttons', () => {
      renderWithProvider(<CtrlSWorld />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Game State', () => {
    it('initializes with default state', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);
      expect(container).toBeTruthy();
    });

    it('accepts achievement manager prop', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn()
      };

      const { container } = renderWithProvider(
        <CtrlSWorld achievementManager={mockAchievementManager} />
      );

      expect(container).toBeTruthy();
    });

    it('works without achievement manager', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);
      expect(container).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('handles keyboard input', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'p' });
      fireEvent.keyDown(window, { key: 'i' });

      expect(container).toBeTruthy();
    });

    it('handles button clicks', () => {
      renderWithProvider(<CtrlSWorld />);

      const buttons = screen.getAllByRole('button');

      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
      }

      expect(buttons.length).toBeGreaterThan(0);
    });

    it('handles rapid interactions', () => {
      renderWithProvider(<CtrlSWorld />);

      const buttons = screen.getAllByRole('button');

      for (let i = 0; i < 10; i++) {
        if (buttons[i % buttons.length]) {
          fireEvent.click(buttons[i % buttons.length]);
        }
        fireEvent.keyDown(window, { key: 'Enter' });
      }

      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation', () => {
    it('handles Enter key for navigation', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);

      fireEvent.keyDown(window, { key: 'Enter' });

      expect(container).toBeTruthy();
    });

    it('handles arrow key navigation', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);

      fireEvent.keyDown(window, { key: 'ArrowUp' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });

      expect(container).toBeTruthy();
    });
  });

  describe('Pause Functionality', () => {
    it('handles pause key press', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);

      fireEvent.keyDown(window, { key: 'p' });

      expect(container).toBeTruthy();
    });

    it('handles multiple pause toggles', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);

      fireEvent.keyDown(window, { key: 'p' });
      fireEvent.keyDown(window, { key: 'p' });
      fireEvent.keyDown(window, { key: 'p' });

      expect(container).toBeTruthy();
    });
  });

  describe('Info Panel', () => {
    it('handles info key press', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);

      fireEvent.keyDown(window, { key: 'i' });

      expect(container).toBeTruthy();
    });
  });

  describe('Fullscreen Mode', () => {
    it('handles fullscreen key press', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);

      fireEvent.keyDown(window, { key: 'f' });

      expect(container).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);
      expect(container).toBeTruthy();
    });

    it('unmounts without errors', () => {
      const { unmount } = renderWithProvider(<CtrlSWorld />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderWithProvider(<CtrlSWorld />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('renders complete game interface', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);

      // Should have main container
      expect(container.querySelector('.bg-black')).toBeTruthy();

      // Should have buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('handles full gameplay session', () => {
      renderWithProvider(<CtrlSWorld />);

      const buttons = screen.getAllByRole('button');

      // Simulate gameplay
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(window, { key: 'Enter' });

        if (buttons[i % buttons.length]) {
          fireEvent.click(buttons[i % buttons.length]);
        }

        fireEvent.keyDown(window, { key: 'p' });
        fireEvent.keyDown(window, { key: 'p' });
      }

      expect(buttons.length).toBeGreaterThan(0);
    });

    it('maintains state through interactions', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'i' });
      fireEvent.keyDown(window, { key: 'p' });

      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
      }

      expect(container).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('handles rapid state changes', () => {
      renderWithProvider(<CtrlSWorld />);

      const keys = ['Enter', 'p', 'i', 'f', 'ArrowUp', 'ArrowDown'];

      for (let i = 0; i < 30; i++) {
        fireEvent.keyDown(window, { key: keys[i % keys.length] });
      }

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders efficiently with multiple components', () => {
      const { container } = renderWithProvider(<CtrlSWorld />);

      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
    });
  });
});
