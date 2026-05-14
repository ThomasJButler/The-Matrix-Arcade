import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PowerUpIndicator } from './PowerUpIndicator';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
}));

describe('PowerUpIndicator', () => {
  describe('Rendering', () => {
    it('renders without crashing with no active power-ups', () => {
      const { container } = render(<PowerUpIndicator activePowerUps={{}} />);
      expect(container).toBeTruthy();
    });

    it('renders empty container when no power-ups active', () => {
      render(
        <PowerUpIndicator activePowerUps={{ bigger_paddle: false, slower_ball: false }} />
      );

      // Should not show any power-up indicators
      expect(screen.queryByText('BIG PADDLE')).not.toBeInTheDocument();
      expect(screen.queryByText('SLOW BALL')).not.toBeInTheDocument();
    });
  });

  describe('Power-Up Display', () => {
    it('displays bigger_paddle power-up when active', () => {
      render(<PowerUpIndicator activePowerUps={{ bigger_paddle: true }} />);

      expect(screen.getByText('BIG PADDLE')).toBeInTheDocument();
    });

    it('displays slower_ball power-up when active', () => {
      render(<PowerUpIndicator activePowerUps={{ slower_ball: true }} />);

      expect(screen.getByText('SLOW BALL')).toBeInTheDocument();
    });

    it('displays score_multiplier power-up when active', () => {
      render(<PowerUpIndicator activePowerUps={{ score_multiplier: true }} />);

      expect(screen.getByText('SCORE x2')).toBeInTheDocument();
    });

    it('displays multi_ball power-up when active', () => {
      render(<PowerUpIndicator activePowerUps={{ multi_ball: true }} />);

      expect(screen.getByText('MULTI BALL')).toBeInTheDocument();
    });
  });

  describe('Multiple Power-Ups', () => {
    it('displays multiple active power-ups', () => {
      render(
        <PowerUpIndicator
          activePowerUps={{
            bigger_paddle: true,
            slower_ball: true,
            score_multiplier: true
          }}
        />
      );

      expect(screen.getByText('BIG PADDLE')).toBeInTheDocument();
      expect(screen.getByText('SLOW BALL')).toBeInTheDocument();
      expect(screen.getByText('SCORE x2')).toBeInTheDocument();
    });

    it('only displays active power-ups', () => {
      render(
        <PowerUpIndicator
          activePowerUps={{
            bigger_paddle: true,
            slower_ball: false,
            score_multiplier: true
          }}
        />
      );

      expect(screen.getByText('BIG PADDLE')).toBeInTheDocument();
      expect(screen.queryByText('SLOW BALL')).not.toBeInTheDocument();
      expect(screen.getByText('SCORE x2')).toBeInTheDocument();
    });
  });

  describe('Emojis', () => {
    it('displays paddle emoji for bigger_paddle', () => {
      render(<PowerUpIndicator activePowerUps={{ bigger_paddle: true }} />);
      expect(screen.getByText('BIG PADDLE').parentElement).toHaveTextContent('🏓');
    });

    it('displays snail emoji for slower_ball', () => {
      render(<PowerUpIndicator activePowerUps={{ slower_ball: true }} />);
      expect(screen.getByText('SLOW BALL').parentElement).toHaveTextContent('🐌');
    });

    it('displays star emoji for score_multiplier', () => {
      render(<PowerUpIndicator activePowerUps={{ score_multiplier: true }} />);
      expect(screen.getByText('SCORE x2').parentElement).toHaveTextContent('⭐');
    });

    it('displays ball emoji for multi_ball', () => {
      render(<PowerUpIndicator activePowerUps={{ multi_ball: true }} />);
      expect(screen.getByText('MULTI BALL').parentElement).toHaveTextContent('⚽');
    });
  });

  describe('Unknown Power-Ups', () => {
    it('handles unknown power-up types gracefully', () => {
      render(<PowerUpIndicator activePowerUps={{ unknown_power: true }} />);

      // Should display the type with underscores replaced by spaces
      expect(screen.getByText('unknown power')).toBeInTheDocument();
    });

    it('displays question mark emoji for unknown power-ups', () => {
      render(<PowerUpIndicator activePowerUps={{ unknown_power: true }} />);
      expect(screen.getByText('unknown power').parentElement).toHaveTextContent('❓');
    });
  });

  describe('Styling', () => {
    it('has correct container classes', () => {
      const { container } = render(<PowerUpIndicator activePowerUps={{ bigger_paddle: true }} />);
      expect(container.firstChild).toHaveClass('w-full', 'flex', 'flex-wrap', 'justify-center');
    });

    it('applies green background for bigger_paddle', () => {
      render(<PowerUpIndicator activePowerUps={{ bigger_paddle: true }} />);

      const indicator = screen.getByText('BIG PADDLE').closest('div');
      expect(indicator).toHaveClass('bg-green-500');
    });

    it('applies cyan background for slower_ball', () => {
      render(<PowerUpIndicator activePowerUps={{ slower_ball: true }} />);

      const indicator = screen.getByText('SLOW BALL').closest('div');
      expect(indicator).toHaveClass('bg-cyan-500');
    });

    it('applies yellow background for score_multiplier', () => {
      render(<PowerUpIndicator activePowerUps={{ score_multiplier: true }} />);

      const indicator = screen.getByText('SCORE x2').closest('div');
      expect(indicator).toHaveClass('bg-yellow-500');
    });

    it('applies purple background for multi_ball', () => {
      render(<PowerUpIndicator activePowerUps={{ multi_ball: true }} />);

      const indicator = screen.getByText('MULTI BALL').closest('div');
      expect(indicator).toHaveClass('bg-purple-500');
    });

    it('applies gray background for unknown power-ups', () => {
      render(<PowerUpIndicator activePowerUps={{ mystery: true }} />);

      const indicator = screen.getByText('mystery').closest('div');
      expect(indicator).toHaveClass('bg-gray-500');
    });
  });

  describe('Responsive Design', () => {
    it('has responsive gap classes', () => {
      const { container } = render(<PowerUpIndicator activePowerUps={{ bigger_paddle: true }} />);
      expect(container.firstChild).toHaveClass('gap-2', 'md:gap-4');
    });

    it('has responsive padding classes on indicators', () => {
      render(<PowerUpIndicator activePowerUps={{ bigger_paddle: true }} />);

      const indicator = screen.getByText('BIG PADDLE').closest('div');
      expect(indicator).toHaveClass('px-3', 'py-1', 'md:px-4', 'md:py-2');
    });

    it('has responsive text size classes', () => {
      render(<PowerUpIndicator activePowerUps={{ bigger_paddle: true }} />);

      const indicator = screen.getByText('BIG PADDLE').closest('div');
      expect(indicator).toHaveClass('text-sm', 'md:text-base');
    });
  });

  describe('Edge Cases', () => {
    it('handles all power-ups being false', () => {
      const { container } = render(
        <PowerUpIndicator
          activePowerUps={{
            bigger_paddle: false,
            slower_ball: false,
            score_multiplier: false,
            multi_ball: false
          }}
        />
      );

      // Container should be empty
      expect(container.firstChild?.childNodes.length).toBe(0);
    });

    it('handles all power-ups being active', () => {
      render(
        <PowerUpIndicator
          activePowerUps={{
            bigger_paddle: true,
            slower_ball: true,
            score_multiplier: true,
            multi_ball: true
          }}
        />
      );

      expect(screen.getByText('BIG PADDLE')).toBeInTheDocument();
      expect(screen.getByText('SLOW BALL')).toBeInTheDocument();
      expect(screen.getByText('SCORE x2')).toBeInTheDocument();
      expect(screen.getByText('MULTI BALL')).toBeInTheDocument();
    });

    it('handles dynamic updates to power-ups', () => {
      const { rerender } = render(
        <PowerUpIndicator activePowerUps={{ bigger_paddle: true }} />
      );

      expect(screen.getByText('BIG PADDLE')).toBeInTheDocument();

      rerender(<PowerUpIndicator activePowerUps={{ bigger_paddle: false, slower_ball: true }} />);

      expect(screen.queryByText('BIG PADDLE')).not.toBeInTheDocument();
      expect(screen.getByText('SLOW BALL')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="status" and aria-live="polite" on container', () => {
      render(<PowerUpIndicator activePowerUps={{ bigger_paddle: true }} />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-label', 'Active power-ups');
    });
  });
});
