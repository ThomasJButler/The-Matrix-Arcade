import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { GamePortal } from './GamePortal';

function makeProps(overrides: Partial<React.ComponentProps<typeof GamePortal>> = {}) {
  return {
    games: [],
    selectedGame: 0,
    isTransitioning: false,
    transitionDirection: 'right' as const,
    containerRef: createRef<HTMLDivElement>(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onPlay: vi.fn(),
    onExit: vi.fn(),
    onShowInstructions: vi.fn(),
    onShowHighScores: vi.fn(),
    onJumpToGame: vi.fn(),
    isPlayDisabled: false,
    isPlaying: false,
    isMuted: false,
    achievementManager: null,
    ...overrides,
  };
}

describe('GamePortal empty / edge-state rendering', () => {
  it('renders the NO SIGNAL fallback when the games list is empty', () => {
    render(<GamePortal {...makeProps()} />);

    expect(screen.getByTestId('game-portal-empty')).toBeInTheDocument();
    expect(screen.getByText('NO SIGNAL')).toBeInTheDocument();
    expect(
      screen.getByText(/arcade has no games loaded/i),
    ).toBeInTheDocument();
  });

  it('announces the empty state to assistive tech via role="alert"', () => {
    render(<GamePortal {...makeProps()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/no games are available/i);
  });

  it('does not render interactive clickwheel / dashbar controls in empty state', () => {
    render(<GamePortal {...makeProps()} />);

    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /play game/i })).not.toBeInTheDocument();
  });

  it('renders the NO SIGNAL fallback when selectedGame is out of range', () => {
    const games = [
      {
        id: 'snake-classic',
        title: 'Snake Classic',
        description: 'test',
        preview: 'preview.png',
        category: 'Arcade' as const,
        inspiration: '',
        inspirationNote: '',
        controls: '',
        component: () => null,
        icon: null,
      },
    ];

    render(<GamePortal {...makeProps({ games, selectedGame: 5 })} />);

    expect(screen.getByTestId('game-portal-empty')).toBeInTheDocument();
    expect(screen.getByText('NO SIGNAL')).toBeInTheDocument();
  });
});
