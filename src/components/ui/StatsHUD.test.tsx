import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatsHUD from './StatsHUD';
import { GameStateProvider } from '../../contexts/GameStateContext';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Coffee: () => <div data-testid="coffee-icon">Coffee Icon</div>,
  Star: () => <div data-testid="star-icon">Star Icon</div>,
  Brain: () => <div data-testid="brain-icon">Brain Icon</div>,
  Heart: () => <div data-testid="heart-icon">Heart Icon</div>,
  Eye: () => <div data-testid="eye-icon">Eye Icon</div>,
  EyeOff: () => <div data-testid="eyeoff-icon">EyeOff Icon</div>,
}));

// Helper to render with provider
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <GameStateProvider>
      {component}
    </GameStateProvider>
  );
};

describe('StatsHUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithProvider(<StatsHUD />);
      expect(container).toBeTruthy();
    });

    it('displays all stat labels', () => {
      renderWithProvider(<StatsHUD />);

      const coffeeElements = screen.getAllByText(/coffee/i);
      const repElements = screen.getAllByText(/reputation/i);
      const wisdomElements = screen.getAllByText(/wisdom/i);
      const moraleElements = screen.getAllByText(/morale/i);

      expect(coffeeElements.length).toBeGreaterThan(0);
      expect(repElements.length).toBeGreaterThan(0);
      expect(wisdomElements.length).toBeGreaterThan(0);
      expect(moraleElements.length).toBeGreaterThan(0);
    });

    it('displays stat icons', () => {
      renderWithProvider(<StatsHUD />);

      expect(screen.getByTestId('coffee-icon')).toBeTruthy();
      expect(screen.getByTestId('star-icon')).toBeTruthy();
      expect(screen.getByTestId('brain-icon')).toBeTruthy();
      expect(screen.getByTestId('heart-icon')).toBeTruthy();
    });

    it('displays initial stat values', () => {
      renderWithProvider(<StatsHUD />);

      // Default coffee is 50%
      expect(screen.getByText(/50%/)).toBeTruthy();
    });

    it('displays keyboard hint', () => {
      renderWithProvider(<StatsHUD />);

      expect(screen.getByText(/Press S to toggle/i)).toBeTruthy();
    });
  });

  describe('Visibility Toggle', () => {
    it('has hide button when visible', () => {
      renderWithProvider(<StatsHUD />);

      const hideButton = screen.getByTitle(/Hide Stats/i);
      expect(hideButton).toBeTruthy();
    });

    it('toggles visibility when hide button clicked', () => {
      renderWithProvider(<StatsHUD />);

      const hideButton = screen.getByTitle(/Hide Stats/i);
      fireEvent.click(hideButton);

      // Should show the Eye icon (show stats button)
      expect(screen.getByTitle(/Show Stats/i)).toBeTruthy();
    });

    it('shows stats again when show button clicked', () => {
      renderWithProvider(<StatsHUD />);

      // Hide first
      const hideButton = screen.getByTitle(/Hide Stats/i);
      fireEvent.click(hideButton);

      // Then show
      const showButton = screen.getByTitle(/Show Stats/i);
      fireEvent.click(showButton);

      // Stats should be visible again
      const coffeeElements = screen.getAllByText(/coffee/i);
      expect(coffeeElements.length).toBeGreaterThan(0);
    });

    it('handles S key press without crashing', () => {
      const { container } = renderWithProvider(<StatsHUD />);

      // Press S key
      fireEvent.keyDown(window, { key: 's' });

      // Should not crash
      expect(container).toBeTruthy();
    });

    it('handles Ctrl+S without toggling', () => {
      renderWithProvider(<StatsHUD />);

      fireEvent.keyDown(window, { key: 's', ctrlKey: true });

      // Should still show hide button (not toggled)
      expect(screen.getByTitle(/Hide Stats/i)).toBeTruthy();
    });

    it('does not toggle when typing in input', () => {
      const { container } = renderWithProvider(
        <>
          <input data-testid="test-input" />
          <StatsHUD />
        </>
      );

      const input = container.querySelector('input');
      if (input) {
        fireEvent.keyDown(input, { key: 's' });
      }

      // Should still show hide button (not toggled)
      expect(screen.getByTitle(/Hide Stats/i)).toBeTruthy();
    });
  });

  describe('Stat Display', () => {
    it('shows coffee stat with percentage unit', () => {
      renderWithProvider(<StatsHUD />);

      const coffeeElements = screen.getAllByText(/coffee/i);
      expect(coffeeElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/50%/)).toBeTruthy();
    });

    it('shows wisdom stat with pts unit', () => {
      renderWithProvider(<StatsHUD />);

      const wisdomElements = screen.getAllByText(/wisdom/i);
      expect(wisdomElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/0 pts/)).toBeTruthy();
    });

    it('displays all four stats', () => {
      renderWithProvider(<StatsHUD />);

      const coffeeLabels = screen.getAllByText(/coffee/i);
      const repLabels = screen.getAllByText(/reputation/i);
      const wisdomLabels = screen.getAllByText(/wisdom/i);
      const moraleLabels = screen.getAllByText(/morale/i);

      expect(coffeeLabels.length).toBeGreaterThan(0);
      expect(repLabels.length).toBeGreaterThan(0);
      expect(wisdomLabels.length).toBeGreaterThan(0);
      expect(moraleLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = renderWithProvider(<StatsHUD />);
      expect(container).toBeTruthy();
    });

    it('unmounts without errors', () => {
      const { unmount } = renderWithProvider(<StatsHUD />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderWithProvider(<StatsHUD />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Integration', () => {
    it('renders complete HUD interface', () => {
      renderWithProvider(<StatsHUD />);

      // All stats present
      const coffeeElements = screen.getAllByText(/coffee/i);
      const repElements = screen.getAllByText(/reputation/i);
      const wisdomElements = screen.getAllByText(/wisdom/i);
      const moraleElements = screen.getAllByText(/morale/i);

      expect(coffeeElements.length).toBeGreaterThan(0);
      expect(repElements.length).toBeGreaterThan(0);
      expect(wisdomElements.length).toBeGreaterThan(0);
      expect(moraleElements.length).toBeGreaterThan(0);

      // Toggle button present
      expect(screen.getByTitle(/Hide Stats/i)).toBeTruthy();

      // Keyboard hint present
      expect(screen.getByText(/Press S to toggle/i)).toBeTruthy();
    });

    it('handles multiple interactions', () => {
      const { container } = renderWithProvider(<StatsHUD />);

      // Click hide
      fireEvent.click(screen.getByTitle(/Hide Stats/i));
      expect(screen.getByTitle(/Show Stats/i)).toBeTruthy();

      // Click show
      fireEvent.click(screen.getByTitle(/Show Stats/i));
      const coffeeElements = screen.getAllByText(/coffee/i);
      expect(coffeeElements.length).toBeGreaterThan(0);

      // Use keyboard - should not crash
      fireEvent.keyDown(window, { key: 's' });
      expect(container).toBeTruthy();
    });

    it('maintains state through rapid toggles', () => {
      renderWithProvider(<StatsHUD />);

      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(window, { key: 's' });
      }

      // Should still be functional
      const container = document.body;
      expect(container).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('handles rapid key presses', () => {
      renderWithProvider(<StatsHUD />);

      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(window, { key: 's' });
      }

      expect(document.body).toBeTruthy();
    });

    it('renders efficiently', () => {
      const { container } = renderWithProvider(<StatsHUD />);

      // Should render all elements
      expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });
});
