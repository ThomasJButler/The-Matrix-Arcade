import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverModal } from './GameOverModal';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <h2 {...props}>{children}</h2>,
    button: ({ children, onClick, ...props }: { children?: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
}));

describe('GameOverModal', () => {
  const defaultProps = {
    score: { player: 5, ai: 3 },
    onRestart: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<GameOverModal {...defaultProps} />);
      expect(container).toBeTruthy();
    });

    it('displays player score', () => {
      render(<GameOverModal {...defaultProps} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays AI score', () => {
      render(<GameOverModal {...defaultProps} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays FINAL SCORE text', () => {
      render(<GameOverModal {...defaultProps} />);
      expect(screen.getByText('FINAL SCORE')).toBeInTheDocument();
    });

    it('displays PLAYER label', () => {
      render(<GameOverModal {...defaultProps} />);
      expect(screen.getByText('PLAYER')).toBeInTheDocument();
    });

    it('displays AI label', () => {
      render(<GameOverModal {...defaultProps} />);
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('displays PLAY AGAIN button', () => {
      render(<GameOverModal {...defaultProps} />);
      expect(screen.getByText('PLAY AGAIN')).toBeInTheDocument();
    });
  });

  describe('Win/Loss States', () => {
    it('displays YOU WIN! when player wins', () => {
      render(<GameOverModal score={{ player: 10, ai: 5 }} onRestart={vi.fn()} />);
      expect(screen.getByText('YOU WIN!')).toBeInTheDocument();
    });

    it('displays GAME OVER when player loses', () => {
      render(<GameOverModal score={{ player: 3, ai: 7 }} onRestart={vi.fn()} />);
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    });

    it('displays GAME OVER on tie (player does not win)', () => {
      render(<GameOverModal score={{ player: 5, ai: 5 }} onRestart={vi.fn()} />);
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    });

    it('applies green color when player wins', () => {
      render(<GameOverModal score={{ player: 10, ai: 5 }} onRestart={vi.fn()} />);
      const heading = screen.getByText('YOU WIN!');
      expect(heading).toHaveClass('text-green-500');
    });

    it('applies red color when player loses', () => {
      render(<GameOverModal score={{ player: 3, ai: 7 }} onRestart={vi.fn()} />);
      const heading = screen.getByText('GAME OVER');
      expect(heading).toHaveClass('text-red-500');
    });
  });

  describe('Restart Callback', () => {
    it('calls onRestart when PLAY AGAIN button is clicked', () => {
      const onRestart = vi.fn();
      render(<GameOverModal score={{ player: 5, ai: 3 }} onRestart={onRestart} />);

      const button = screen.getByText('PLAY AGAIN');
      fireEvent.click(button);

      expect(onRestart).toHaveBeenCalledTimes(1);
    });

    it('allows multiple clicks on restart button', () => {
      const onRestart = vi.fn();
      render(<GameOverModal score={{ player: 5, ai: 3 }} onRestart={onRestart} />);

      const button = screen.getByText('PLAY AGAIN');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onRestart).toHaveBeenCalledTimes(3);
    });
  });

  describe('Styling', () => {
    it('has full-screen overlay', () => {
      const { container } = render(<GameOverModal {...defaultProps} />);
      const overlay = container.firstChild;
      expect(overlay).toHaveClass('fixed', 'inset-0');
    });

    it('centers content', () => {
      const { container } = render(<GameOverModal {...defaultProps} />);
      const overlay = container.firstChild;
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('has dark background overlay', () => {
      const { container } = render(<GameOverModal {...defaultProps} />);
      const overlay = container.firstChild;
      expect(overlay).toHaveClass('bg-black', 'bg-opacity-90');
    });

    it('has high z-index', () => {
      const { container } = render(<GameOverModal {...defaultProps} />);
      const overlay = container.firstChild;
      expect(overlay).toHaveClass('z-50');
    });

    it('uses monospace font', () => {
      const { container } = render(<GameOverModal {...defaultProps} />);
      const modal = container.querySelector('.font-mono');
      expect(modal).toBeTruthy();
    });

    it('has green border on modal box', () => {
      const { container } = render(<GameOverModal {...defaultProps} />);
      const modalBox = container.querySelector('.border-green-500');
      expect(modalBox).toBeTruthy();
    });
  });

  describe('Score Display', () => {
    it('displays zero scores correctly', () => {
      render(<GameOverModal score={{ player: 0, ai: 0 }} onRestart={vi.fn()} />);
      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(2);
    });

    it('displays large scores correctly', () => {
      render(<GameOverModal score={{ player: 999, ai: 888 }} onRestart={vi.fn()} />);
      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.getByText('888')).toBeInTheDocument();
    });

    it('handles player winning by one point', () => {
      render(<GameOverModal score={{ player: 10, ai: 9 }} onRestart={vi.fn()} />);
      expect(screen.getByText('YOU WIN!')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('handles AI winning by large margin', () => {
      render(<GameOverModal score={{ player: 2, ai: 50 }} onRestart={vi.fn()} />);
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    it('button has green background', () => {
      render(<GameOverModal {...defaultProps} />);
      const button = screen.getByText('PLAY AGAIN');
      expect(button).toHaveClass('bg-green-500');
    });

    it('button has black text', () => {
      render(<GameOverModal {...defaultProps} />);
      const button = screen.getByText('PLAY AGAIN');
      expect(button).toHaveClass('text-black');
    });

    it('button has rounded corners', () => {
      render(<GameOverModal {...defaultProps} />);
      const button = screen.getByText('PLAY AGAIN');
      expect(button).toHaveClass('rounded-lg');
    });

    it('button has bold font', () => {
      render(<GameOverModal {...defaultProps} />);
      const button = screen.getByText('PLAY AGAIN');
      expect(button).toHaveClass('font-bold');
    });
  });

  describe('Accessibility', () => {
    it('button is clickable', () => {
      const onRestart = vi.fn();
      render(<GameOverModal score={{ player: 5, ai: 3 }} onRestart={onRestart} />);

      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      expect(button).toBeTruthy();
      fireEvent.click(button);
      expect(onRestart).toHaveBeenCalled();
    });

    it('score elements are visible', () => {
      render(<GameOverModal {...defaultProps} />);

      expect(screen.getByText('PLAYER')).toBeVisible();
      expect(screen.getByText('AI')).toBeVisible();
      expect(screen.getByText('5')).toBeVisible();
      expect(screen.getByText('3')).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('handles negative scores (edge case)', () => {
      render(<GameOverModal score={{ player: -1, ai: -5 }} onRestart={vi.fn()} />);
      expect(screen.getByText('-1')).toBeInTheDocument();
      expect(screen.getByText('-5')).toBeInTheDocument();
      // Player still wins because -1 > -5
      expect(screen.getByText('YOU WIN!')).toBeInTheDocument();
    });

    it('handles very large numbers', () => {
      render(<GameOverModal score={{ player: 1000000, ai: 999999 }} onRestart={vi.fn()} />);
      expect(screen.getByText('1000000')).toBeInTheDocument();
      expect(screen.getByText('999999')).toBeInTheDocument();
    });
  });
});
