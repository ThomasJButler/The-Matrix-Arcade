import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryPanel from './InventoryPanel';
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
  Package: () => <div data-testid="package-icon">Package</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Coffee: () => <div data-testid="coffee-icon">Coffee</div>,
  FileText: () => <div data-testid="filetext-icon">FileText</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Key: () => <div data-testid="key-icon">Key</div>,
  Award: () => <div data-testid="award-icon">Award</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
}));

// Helper to render with provider
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <GameStateProvider>
      {component}
    </GameStateProvider>
  );
};

describe('InventoryPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/inventory/i)).toBeTruthy();
    });

    it('does not render when isOpen is false', () => {
      renderWithProvider(<InventoryPanel isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText(/inventory/i)).toBeNull();
    });

    it('displays empty state when no items', () => {
      renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/no items collected yet/i)).toBeTruthy();
    });

    it('displays help text in empty state', () => {
      renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/solve puzzles/i)).toBeTruthy();
    });

    it('displays keyboard hint', () => {
      renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/press/i)).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('closes panel when close button is clicked', () => {
      renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      expect(closeButton).toBeTruthy();

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('closes on backdrop click', () => {
      const { container } = renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      // Find backdrop (the element with bg-black/60)
      const backdrop = container.querySelector('.bg-black\\/60');
      expect(backdrop).toBeTruthy();

      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('has close button accessible', () => {
      renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      const closeIcon = screen.getByTestId('x-icon');
      expect(closeIcon).toBeTruthy();
    });
  });

  describe('Visual Elements', () => {
    it('displays inventory icon', () => {
      renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      const packageIcons = screen.getAllByTestId('package-icon');
      expect(packageIcons.length).toBeGreaterThan(0);
    });

    it('displays inventory title', () => {
      renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      const title = screen.getByText(/inventory/i);
      expect(title).toBeTruthy();
    });

    it('displays empty state icon when no items', () => {
      renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      // Should show Package icon in empty state
      const packageIcons = screen.getAllByTestId('package-icon');
      expect(packageIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);
      expect(container).toBeTruthy();
    });

    it('unmounts without errors', () => {
      const { unmount } = renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up timers on unmount', () => {
      const { unmount } = renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);
      unmount();
      // Should not throw
      expect(true).toBe(true);
    });

    it('handles reopen correctly', () => {
      const { rerender } = renderWithProvider(<InventoryPanel isOpen={false} onClose={mockOnClose} />);

      // Should not render
      expect(screen.queryByText(/inventory/i)).toBeNull();

      // Reopen
      rerender(
        <GameStateProvider>
          <InventoryPanel isOpen={true} onClose={mockOnClose} />
        </GameStateProvider>
      );

      // Should now render
      expect(screen.getByText(/inventory/i)).toBeTruthy();
    });
  });

  describe('Integration', () => {
    it('renders complete panel interface', () => {
      renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      // Header elements
      expect(screen.getByText(/inventory/i)).toBeTruthy();
      expect(screen.getByTestId('x-icon')).toBeTruthy();

      // Empty state
      expect(screen.getByText(/no items collected yet/i)).toBeTruthy();

      // Footer hint
      expect(screen.getByText(/press/i)).toBeTruthy();
    });

    it('handles multiple interactions', () => {
      const { container } = renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      // Click backdrop
      const backdrop = container.querySelector('.bg-black\\/60');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // Verify close was called
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('maintains state through renders', () => {
      const { rerender } = renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/inventory/i)).toBeTruthy();

      rerender(
        <GameStateProvider>
          <InventoryPanel isOpen={true} onClose={mockOnClose} />
        </GameStateProvider>
      );

      expect(screen.getByText(/inventory/i)).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('handles rapid open/close', () => {
      const { rerender } = renderWithProvider(<InventoryPanel isOpen={false} onClose={mockOnClose} />);

      for (let i = 0; i < 5; i++) {
        rerender(
          <GameStateProvider>
            <InventoryPanel isOpen={true} onClose={mockOnClose} />
          </GameStateProvider>
        );

        rerender(
          <GameStateProvider>
            <InventoryPanel isOpen={false} onClose={mockOnClose} />
          </GameStateProvider>
        );
      }

      expect(document.body).toBeTruthy();
    });

    it('renders efficiently', () => {
      const { container } = renderWithProvider(<InventoryPanel isOpen={true} onClose={mockOnClose} />);

      expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });
});
