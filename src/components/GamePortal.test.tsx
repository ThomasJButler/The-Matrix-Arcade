import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { GamePortal } from './GamePortal';
import { PAUSE_REQUEST_EVENT } from '../lib/phaser/types';

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

describe('GamePortal dashbar EXIT vs PAUSE', () => {
  const makeGames = () => [
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

  it('dashbar EXIT button calls onExit without dispatching a pause request', () => {
    const onExit = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <GamePortal
        {...makeProps({ games: makeGames(), isPlaying: true, onExit })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Exit game' }));

    expect(onExit).toHaveBeenCalledTimes(1);
    const pauseDispatches = dispatchSpy.mock.calls.filter(
      ([event]) => event instanceof Event && event.type === PAUSE_REQUEST_EVENT,
    );
    expect(pauseDispatches).toHaveLength(0);

    dispatchSpy.mockRestore();
  });

  it('dashbar PAUSE button dispatches pause request without calling onExit', () => {
    const onExit = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <GamePortal
        {...makeProps({ games: makeGames(), isPlaying: true, onExit })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }));

    expect(onExit).not.toHaveBeenCalled();
    const pauseDispatches = dispatchSpy.mock.calls.filter(
      ([event]) => event instanceof Event && event.type === PAUSE_REQUEST_EVENT,
    );
    expect(pauseDispatches).toHaveLength(1);

    dispatchSpy.mockRestore();
  });
});
