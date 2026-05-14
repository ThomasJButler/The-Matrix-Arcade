import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameHighScores } from './GameHighScores';
import type { GameEntry } from '../../data/gameRegistry';
import type { GlobalSaveData } from '../../hooks/useSaveSystem';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  Trophy: () => <span>Trophy</span>,
  BarChart3: () => <span>BarChart3</span>,
  Clock: () => <span>Clock</span>,
  Target: () => <span>Target</span>,
  Lock: () => <span>Lock</span>,
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

const mockGame: GameEntry = {
  id: 'snake-classic',
  title: 'Snake Classic',
  description: 'A classic snake game',
  preview: '/preview.png',
  category: 'Classic',
  inspiration: 'Nokia Snake',
  inspirationNote: 'The original mobile game',
  controls: 'Arrow keys to move',
};

const mockSaveData: GlobalSaveData = {
  version: '1.3.0',
  games: {
    snakeClassic: { highScore: 100, lastPlayed: Date.now(), stats: { gamesPlayed: 5, totalScore: 500 } },
    ctrlSWorld: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
    vortexPong: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
    matrixCloud: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
    matrixInvaders: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
    metris: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
    matrixFrogger: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
    neoJump: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
    agentChase: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
    rhythmHacker: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
    cloudJumper: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
    codeBreaker: { highScore: 0, lastPlayed: 0, stats: { gamesPlayed: 0, totalScore: 0 } },
  },
  achievements: {},
  settings: { isMuted: false },
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  game: mockGame,
  icon: <span>icon</span>,
  saveData: mockSaveData,
  achievements: [],
};

describe('GameHighScores', () => {
  describe('Accessibility', () => {
    it('has role="dialog" and aria-modal on the modal wrapper', () => {
      render(<GameHighScores {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'game-highscores-title');
    });

    it('heading has matching id for aria-labelledby', () => {
      render(<GameHighScores {...defaultProps} />);
      const heading = screen.getByText('Snake Classic');
      expect(heading).toHaveAttribute('id', 'game-highscores-title');
    });

    it('close button has aria-label', () => {
      render(<GameHighScores {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Close high scores' })).toBeInTheDocument();
    });

    it('renders nothing when closed', () => {
      const { container } = render(<GameHighScores {...defaultProps} isOpen={false} />);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('R83.G6 — achievements filter matches by registry display title', () => {
    it('lists achievements whose game field equals the registry title', () => {
      const achievements = [
        { id: 'snake_first_apple', name: 'First Bite', description: 'Eat the first', unlocked: true, game: 'Snake Classic' },
        { id: 'cloud_first_flight', name: 'Digital Pilot', description: 'Fly first', unlocked: false, game: 'Matrix Bird' },
      ];
      render(<GameHighScores {...defaultProps} achievements={achievements} />);
      expect(screen.getByText('First Bite')).toBeInTheDocument();
      expect(screen.queryByText('Digital Pilot')).not.toBeInTheDocument();
    });

    it('does NOT match the save key against the achievement game field', () => {
      // Regression: the broken filter compared `a.game` (display title) against
      // the camelCase save key, so it never matched anything.
      const achievements = [
        { id: 'snake_first_apple', name: 'First Bite', description: 'Eat the first', unlocked: true, game: 'snakeClassic' },
      ];
      render(<GameHighScores {...defaultProps} achievements={achievements} />);
      expect(screen.queryByText('First Bite')).not.toBeInTheDocument();
    });

    it('renders the persisted high score from the matching save slot', () => {
      // Matrix Bird carries id `matrix-cloud` for storage stability after the
      // R83.B1 rename — verify the save slot lookup still resolves via the id.
      const matrixBirdGame: GameEntry = {
        id: 'matrix-cloud',
        title: 'Matrix Bird',
        description: 'Through the storm',
        preview: '/preview.png',
        category: 'Arcade',
        inspiration: 'Flappy Bird',
        inspirationNote: '',
        controls: 'Space',
      };
      const saveData: GlobalSaveData = {
        ...mockSaveData,
        games: {
          ...mockSaveData.games,
          matrixCloud: { highScore: 4242, lastPlayed: Date.now(), stats: { gamesPlayed: 7, totalScore: 9999 } },
        },
      };
      render(
        <GameHighScores
          {...defaultProps}
          game={matrixBirdGame}
          saveData={saveData}
        />,
      );
      expect(screen.getByText('4,242')).toBeInTheDocument();
    });
  });
});
