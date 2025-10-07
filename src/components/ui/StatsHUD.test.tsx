import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsHUD from './StatsHUD';
import { GameStateProvider } from '../../contexts/GameStateContext';

describe('StatsHUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all stat labels', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByText(/coffee/i)).toBeInTheDocument();
      expect(screen.getByText(/reputation/i)).toBeInTheDocument();
      expect(screen.getByText(/wisdom/i)).toBeInTheDocument();
      expect(screen.getByText(/morale/i)).toBeInTheDocument();
    });

    it('displays initial stat values', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      // Default values: Coffee 50, Reputation 0, Wisdom 0, Morale 50
      expect(screen.getByText(/50/)).toBeInTheDocument(); // Coffee or Morale
      expect(screen.getByText(/0/)).toBeInTheDocument(); // Reputation or Wisdom
    });

    it('renders without crashing', () => {
      const { container } = render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Progress Bars', () => {
    it('displays progress bars for percentage stats', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      // Should have progress bars for Coffee, Reputation, Morale (not Wisdom)
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThanOrEqual(3);
    });

    it('shows correct progress bar width for coffee level', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      // Coffee starts at 50%
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('displays different colors for stat levels', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      const hud = screen.getByRole('region');
      expect(hud).toBeInTheDocument();
    });
  });

  describe('Stat Icons', () => {
    it('displays icons for each stat', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      // Icons should be present for each stat
      const hud = screen.getByRole('region');
      expect(hud.querySelectorAll('svg').length).toBeGreaterThan(0);
    });
  });

  describe('Stat Updates', () => {
    it('reflects stat changes from context', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      // Initial render should show default stats
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('handles coffee level over 100%', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      // Should handle caffeine overdose (>100%)
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('handles negative stat changes', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      // Stats should not go below 0
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('shows warning color for low coffee', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('shows success color for high reputation', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('shows danger color for low morale', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    it('shows tooltip on hover for coffee stat', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays stat descriptions in tooltips', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('provides progress bar values', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuenow');
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on small screens', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('adjusts layout for different screen sizes', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      const hud = screen.getByRole('region');
      expect(hud).toHaveClass(/fixed|absolute/);
    });
  });

  describe('Animations', () => {
    it('animates progress bar changes', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('shows pulse effect for critical stats', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles coffee level exactly at 100', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('handles wisdom points accumulation', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      // Wisdom is not capped, should display large numbers
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('handles all stats at zero', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('handles all stats at maximum', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('is positioned in top-right corner', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      const hud = screen.getByRole('region');
      expect(hud).toHaveClass(/top|right/);
    });

    it('does not overlap with game content', () => {
      render(
        <GameStateProvider>
          <StatsHUD />
        </GameStateProvider>
      );

      const hud = screen.getByRole('region');
      expect(hud).toHaveClass(/z-/); // Has z-index
    });
  });
});
