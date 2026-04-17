import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { GamePortal } from './GamePortal';
import {
  PAUSE_REQUEST_EVENT,
  PAUSE_STATE_CHANGED_EVENT,
  type PauseStateChangedDetail,
} from '../lib/phaser/types';

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

describe('GamePortal paused-state indicator', () => {
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

  const dispatchPauseState = (isPaused: boolean) => {
    const detail: PauseStateChangedDetail = { isPaused };
    act(() => {
      window.dispatchEvent(new CustomEvent(PAUSE_STATE_CHANGED_EVENT, { detail }));
    });
  };

  it('centre dashbar button defaults to "Pause game" while playing', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: true })} />);
    expect(screen.getByRole('button', { name: 'Pause game' })).toBeInTheDocument();
  });

  it('swaps to "Resume game" when a PAUSE_STATE_CHANGED event reports paused', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: true })} />);
    dispatchPauseState(true);
    const resumeBtn = screen.getByRole('button', { name: 'Resume game' });
    expect(resumeBtn).toBeInTheDocument();
    expect(resumeBtn).toHaveAttribute('aria-pressed', 'true');
    expect(resumeBtn.className).toMatch(/is-paused/);
  });

  it('swaps back to "Pause game" when the scene resumes', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: true })} />);
    dispatchPauseState(true);
    expect(screen.getByRole('button', { name: 'Resume game' })).toBeInTheDocument();
    dispatchPauseState(false);
    expect(screen.getByRole('button', { name: 'Pause game' })).toBeInTheDocument();
  });

  it('ignores PAUSE_STATE_CHANGED events while not playing (no dashbar mounted)', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: false })} />);
    dispatchPauseState(true);
    // Dashbar not rendered → neither label exists; the listener is also detached
    // so internal state stays clean for the next play boundary.
    expect(screen.queryByRole('button', { name: 'Pause game' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resume game' })).not.toBeInTheDocument();
  });

  // R82.13 — screen-level pause overlay. Dashbar amber alone wasn't enough for
  // eyes-on-canvas players; these tests lock in that the overlay mounts only
  // while `isPlaying && isPaused`, and disappears the moment either flips.
  it('renders the screen pause overlay when paused while playing', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: true })} />);
    expect(screen.queryByTestId('ipod-pause-overlay')).not.toBeInTheDocument();
    dispatchPauseState(true);
    const overlay = screen.getByTestId('ipod-pause-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveTextContent('PAUSED');
    expect(overlay).toHaveTextContent(/PRESS P/);
    // Inert by design — pointer-events: none keeps the canvas hit-testable.
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });

  it('removes the screen pause overlay when the scene resumes', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: true })} />);
    dispatchPauseState(true);
    expect(screen.getByTestId('ipod-pause-overlay')).toBeInTheDocument();
    dispatchPauseState(false);
    expect(screen.queryByTestId('ipod-pause-overlay')).not.toBeInTheDocument();
  });

  it('never renders the screen pause overlay outside of play mode', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: false })} />);
    dispatchPauseState(true);
    expect(screen.queryByTestId('ipod-pause-overlay')).not.toBeInTheDocument();
  });
});

describe('GamePortal dashbar mute toggle', () => {
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

  it('renders no mute control while unmuted (preserves resting dashbar visuals)', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: true, isMuted: false })} />);
    expect(screen.queryByRole('button', { name: /unmute audio/i })).not.toBeInTheDocument();
  });

  it('renders a click-to-unmute button when muted and fires onToggleMute', () => {
    const onToggleMute = vi.fn();
    render(
      <GamePortal
        {...makeProps({ games: makeGames(), isPlaying: true, isMuted: true, onToggleMute })}
      />,
    );

    const unmuteBtn = screen.getByRole('button', { name: /unmute audio/i });
    expect(unmuteBtn).toHaveAttribute('aria-pressed', 'true');
    expect(unmuteBtn).not.toBeDisabled();

    fireEvent.click(unmuteBtn);
    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('disables the mute pill when no onToggleMute handler is provided', () => {
    render(
      <GamePortal {...makeProps({ games: makeGames(), isPlaying: true, isMuted: true })} />,
    );
    const unmuteBtn = screen.getByRole('button', { name: /unmute audio/i });
    expect(unmuteBtn).toBeDisabled();
  });
});

describe('GamePortal dashbar keyboard navigation', () => {
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

  it('ArrowRight rotates focus from EXIT to PAUSE within the dashbar', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: true })} />);

    const toolbar = screen.getByRole('toolbar', { name: /in-game controls/i });
    const exitBtn = screen.getByRole('button', { name: 'Exit game' });
    const pauseBtn = screen.getByRole('button', { name: 'Pause game' });

    exitBtn.focus();
    expect(document.activeElement).toBe(exitBtn);

    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(pauseBtn);
  });

  it('ArrowLeft wraps from EXIT to the last enabled button (PAUSE when not muted)', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: true })} />);

    const toolbar = screen.getByRole('toolbar', { name: /in-game controls/i });
    const exitBtn = screen.getByRole('button', { name: 'Exit game' });
    const pauseBtn = screen.getByRole('button', { name: 'Pause game' });

    exitBtn.focus();
    fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(pauseBtn);
  });

  it('includes MUTE in the rove when muted with an onToggleMute handler', () => {
    render(
      <GamePortal
        {...makeProps({
          games: makeGames(),
          isPlaying: true,
          isMuted: true,
          onToggleMute: vi.fn(),
        })}
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: /in-game controls/i });
    const pauseBtn = screen.getByRole('button', { name: 'Pause game' });
    const muteBtn = screen.getByRole('button', { name: /unmute audio/i });

    pauseBtn.focus();
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(muteBtn);
  });

  it('Home focuses EXIT, End focuses the last enabled button', () => {
    render(
      <GamePortal
        {...makeProps({
          games: makeGames(),
          isPlaying: true,
          isMuted: true,
          onToggleMute: vi.fn(),
        })}
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: /in-game controls/i });
    const exitBtn = screen.getByRole('button', { name: 'Exit game' });
    const muteBtn = screen.getByRole('button', { name: /unmute audio/i });

    fireEvent.keyDown(toolbar, { key: 'End' });
    expect(document.activeElement).toBe(muteBtn);

    fireEvent.keyDown(toolbar, { key: 'Home' });
    expect(document.activeElement).toBe(exitBtn);
  });

  it('Enter on the focused EXIT button calls onExit', () => {
    const onExit = vi.fn();
    render(
      <GamePortal {...makeProps({ games: makeGames(), isPlaying: true, onExit })} />,
    );

    const toolbar = screen.getByRole('toolbar', { name: /in-game controls/i });
    const exitBtn = screen.getByRole('button', { name: 'Exit game' });

    exitBtn.focus();
    fireEvent.keyDown(toolbar, { key: 'Enter' });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('Space on the focused PAUSE button dispatches a PAUSE_REQUEST_EVENT', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: true })} />);

    const toolbar = screen.getByRole('toolbar', { name: /in-game controls/i });
    const pauseBtn = screen.getByRole('button', { name: 'Pause game' });

    pauseBtn.focus();
    fireEvent.keyDown(toolbar, { key: ' ' });

    const pauseDispatches = dispatchSpy.mock.calls.filter(
      ([event]) => event instanceof Event && event.type === PAUSE_REQUEST_EVENT,
    );
    expect(pauseDispatches).toHaveLength(1);
    dispatchSpy.mockRestore();
  });

  it('Enter with no focused dashbar slot does not activate anything', () => {
    const onExit = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(
      <GamePortal {...makeProps({ games: makeGames(), isPlaying: true, onExit })} />,
    );

    const toolbar = screen.getByRole('toolbar', { name: /in-game controls/i });
    // Toolbar itself has focus, not a button slot
    toolbar.focus();
    fireEvent.keyDown(toolbar, { key: 'Enter' });

    expect(onExit).not.toHaveBeenCalled();
    const pauseDispatches = dispatchSpy.mock.calls.filter(
      ([event]) => event instanceof Event && event.type === PAUSE_REQUEST_EVENT,
    );
    expect(pauseDispatches).toHaveLength(0);
    dispatchSpy.mockRestore();
  });

  it('exposes sr-only keyboard hints to screen readers via aria-describedby', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: true })} />);

    const toolbar = screen.getByRole('toolbar', { name: /in-game controls/i });
    expect(toolbar).toHaveAttribute('aria-describedby', 'ipod-dashbar-instructions');

    const hints = document.getElementById('ipod-dashbar-instructions');
    expect(hints).not.toBeNull();
    expect(hints).toHaveClass('sr-only');
    expect(hints?.textContent ?? '').toMatch(/arrow keys/i);
    expect(hints?.textContent ?? '').toMatch(/home/i);
    expect(hints?.textContent ?? '').toMatch(/end/i);
    expect(hints?.textContent ?? '').toMatch(/enter or space/i);
    expect(hints?.textContent ?? '').toMatch(/escape/i);
  });

  it('does not render dashbar keyboard hints while in browse mode (dashbar unmounted)', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), isPlaying: false })} />);

    expect(document.getElementById('ipod-dashbar-instructions')).toBeNull();
  });
});

describe('GamePortal clickwheel jump-nav rotation feedback', () => {
  // Three-game fixture lets us test forward, backward, and same-slot jumps.
  const makeGames = () =>
    ['snake-classic', 'vortex-pong', 'metris'].map((id) => ({
      id,
      title: id,
      description: 'test',
      preview: 'preview.png',
      category: 'Arcade' as const,
      inspiration: '',
      inspirationNote: '',
      controls: '',
      component: () => null,
      icon: null,
    }));

  const getWheel = () => document.querySelector('.ipod-clickwheel') as HTMLElement;

  // triggerRotation schedules setWheelRotation inside a requestAnimationFrame,
  // which jsdom defers past the synchronous act() block. Stubbing rAF to
  // invoke its callback immediately lets the className reflect the state
  // update in the same tick the keyDown fires.
  let rafSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
      (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      },
    );
  });
  afterEach(() => {
    rafSpy.mockRestore();
  });

  it('forward jump (pressing 3 from index 0) adds rotating-right to the wheel', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), selectedGame: 0 })} />);
    const wheel = getWheel();
    act(() => {
      fireEvent.keyDown(wheel, { key: '3' });
    });
    expect(wheel.className).toMatch(/rotating-right/);
  });

  it('backward jump (pressing 1 from index 2) adds rotating-left to the wheel', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), selectedGame: 2 })} />);
    const wheel = getWheel();
    act(() => {
      fireEvent.keyDown(wheel, { key: '1' });
    });
    expect(wheel.className).toMatch(/rotating-left/);
  });

  it('same-slot jump (pressing 1 from index 0) does not add a rotation class', () => {
    render(<GamePortal {...makeProps({ games: makeGames(), selectedGame: 0 })} />);
    const wheel = getWheel();
    act(() => {
      fireEvent.keyDown(wheel, { key: '1' });
    });
    expect(wheel.className).not.toMatch(/rotating-/);
  });

  it('End from index 0 spins right; Home from the last index spins left', () => {
    const { rerender } = render(
      <GamePortal {...makeProps({ games: makeGames(), selectedGame: 0 })} />,
    );
    let wheel = getWheel();
    act(() => {
      fireEvent.keyDown(wheel, { key: 'End' });
    });
    expect(wheel.className).toMatch(/rotating-right/);

    rerender(<GamePortal {...makeProps({ games: makeGames(), selectedGame: 2 })} />);
    wheel = getWheel();
    act(() => {
      fireEvent.keyDown(wheel, { key: 'Home' });
    });
    expect(wheel.className).toMatch(/rotating-left/);
  });

  it('still calls onJumpToGame with the correct index', () => {
    const onJumpToGame = vi.fn();
    render(
      <GamePortal {...makeProps({ games: makeGames(), selectedGame: 0, onJumpToGame })} />,
    );
    const wheel = getWheel();
    fireEvent.keyDown(wheel, { key: '2' });
    expect(onJumpToGame).toHaveBeenCalledWith(1);
  });
});
