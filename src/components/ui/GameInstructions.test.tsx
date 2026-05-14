import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameInstructions } from './GameInstructions';
import type { GameEntry } from '../../data/gameRegistry';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  Gamepad2: () => <span>Gamepad2</span>,
  Info: () => <span>Info</span>,
  Sparkles: () => <span>Sparkles</span>,
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

const mockGame: GameEntry = {
  id: 'matrix-frogger',
  title: 'Matrix Frogger',
  description: 'Cross the digital highway',
  preview: '/preview.png',
  category: 'Arcade',
  inspiration: 'Frogger',
  inspirationNote: 'The classic road-crossing game',
  controls: 'Arrow keys to move',
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  game: mockGame,
  icon: <span>icon</span>,
};

describe('GameInstructions', () => {
  describe('Accessibility', () => {
    it('has role="dialog" and aria-modal on the modal wrapper', () => {
      render(<GameInstructions {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'game-instructions-title');
    });

    it('heading has matching id for aria-labelledby', () => {
      render(<GameInstructions {...defaultProps} />);
      const heading = screen.getByText('Matrix Frogger');
      expect(heading).toHaveAttribute('id', 'game-instructions-title');
    });

    it('close button has aria-label', () => {
      render(<GameInstructions {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Close instructions' })).toBeInTheDocument();
    });

    it('renders nothing when closed', () => {
      const { container } = render(<GameInstructions {...defaultProps} isOpen={false} />);
      expect(container.innerHTML).toBe('');
    });
  });
});
