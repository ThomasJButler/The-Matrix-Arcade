import type { ComponentProps, ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

// Mutable container hoisted so tests can flip reduced-motion mid-suite without
// re-mocking the module (vi.mock itself is hoisted).
const framerMock = vi.hoisted(() => ({ reducedMotion: false }));

// Strip framer-motion animations so `mode="wait"` exit/enter doesn't hold the
// old slide in the DOM while the test asserts against the new one. This mirrors
// the shared pattern used across the UI test suite (AchievementNotification,
// AudioSettings, etc.) — assertions target the final render, not the animation.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  useReducedMotion: () => framerMock.reducedMotion,
}));

// MatrixRainCanvas spins a requestAnimationFrame loop in its effect; in fake-
// timer tests that either no-ops (raf ignored) or advances strangely.  Stub to
// a trivial div so the component renders without drag on timer advancement.
vi.mock('../ui/MatrixRainCanvas', () => ({
  MatrixRainCanvas: () => <div data-testid="matrix-rain-stub" />,
}));

import {
  AttractMode,
  CYCLE_ADVANCE_NOTES,
  CYCLE_ADVANCE_STAGGER_MS,
} from './AttractMode';
import { R84_PRIORITY_TRIO, selectAttractCycle } from './attractCycle';
import {
  SCOREBOARD_GAME_IDS,
  type ScoreEntry,
  type ScoreboardGameId,
} from '../../hooks/useSaveSystem';

type Scoreboards = Record<ScoreboardGameId, ScoreEntry[]>;

const emptyBoards = (): Scoreboards =>
  Object.fromEntries(SCOREBOARD_GAME_IDS.map((id) => [id, []])) as Scoreboards;

const entry = (score: number, initials = 'ABC'): ScoreEntry => ({
  initials,
  score,
  level: 1,
  durationMs: 60_000,
  date: '2026-04-20T00:00:00.000Z',
});

describe('selectAttractCycle (R84.CI-10)', () => {
  it('falls back to priority trio when no scoreboards are populated', () => {
    // Prevents attract screen from collapsing to a single empty slide on a
    // fresh install — the trio still cycles through "NO SCORES YET" placeholders
    // so the landing page signals "play these games" rather than nothing.
    expect(selectAttractCycle(emptyBoards())).toEqual([...R84_PRIORITY_TRIO]);
  });

  it('returns only populated priority-trio games, in priority order', () => {
    const boards = emptyBoards();
    boards.vortexPong = [entry(100)];
    boards.matrixCloud = [entry(80)];
    // snakeClassic intentionally empty — it should be skipped.
    expect(selectAttractCycle(boards)).toEqual(['vortexPong', 'matrixCloud']);
  });

  it('places priority trio before non-trio games when both are populated', () => {
    const boards = emptyBoards();
    boards.matrixInvaders = [entry(500)]; // non-trio
    boards.vortexPong = [entry(100)]; // trio
    boards.snakeClassic = [entry(42)]; // trio
    const cycle = selectAttractCycle(boards);
    expect(cycle[0]).toBe('snakeClassic');
    expect(cycle[1]).toBe('vortexPong');
    expect(cycle).toContain('matrixInvaders');
    expect(cycle.indexOf('matrixInvaders')).toBeGreaterThan(cycle.indexOf('vortexPong'));
  });

  it('skips games with empty score arrays when siblings are populated', () => {
    // Existing AttractMode used to cycle all 11 IDs including empty boards,
    // producing a long string of "NO SCORES YET" slides. Filter skips them
    // once at least one real scoreboard exists.
    const boards = emptyBoards();
    boards.metris = [entry(250)];
    boards.codeBreaker = [entry(10)];
    const cycle = selectAttractCycle(boards);
    expect(cycle).toEqual(['metris', 'codeBreaker']);
    expect(cycle).not.toContain('snakeClassic');
    expect(cycle).not.toContain('vortexPong');
    expect(cycle).not.toContain('matrixCloud');
  });

  it('does not duplicate priority-trio ids even if present in both sources', () => {
    // Tripwire: a refactor that flattens trio + SCOREBOARD_GAME_IDS without a
    // Set-based de-dupe would double-count the trio ids. This test fails fast.
    const boards = emptyBoards();
    for (const id of SCOREBOARD_GAME_IDS) boards[id] = [entry(1)];
    const cycle = selectAttractCycle(boards);
    expect(new Set(cycle).size).toBe(cycle.length);
    expect(cycle.length).toBe(SCOREBOARD_GAME_IDS.length);
    expect(cycle.slice(0, 3)).toEqual([...R84_PRIORITY_TRIO]);
  });

  it('preserves SCOREBOARD_GAME_IDS ordering for non-trio games', () => {
    const boards = emptyBoards();
    const nonTrio: ScoreboardGameId[] = SCOREBOARD_GAME_IDS.filter(
      (id) => !(R84_PRIORITY_TRIO as readonly ScoreboardGameId[]).includes(id),
    );
    for (const id of nonTrio) boards[id] = [entry(5)];
    const cycle = selectAttractCycle(boards);
    expect(cycle).toEqual(nonTrio);
  });

  it('does not mutate the input scoreboards object', () => {
    const boards = emptyBoards();
    boards.vortexPong = [entry(100)];
    const snapshot = JSON.stringify(boards);
    selectAttractCycle(boards);
    expect(JSON.stringify(boards)).toBe(snapshot);
  });

  it('is idempotent — repeated calls return equivalent arrays', () => {
    const boards = emptyBoards();
    boards.snakeClassic = [entry(10)];
    boards.neoJump = [entry(20)];
    const a = selectAttractCycle(boards);
    const b = selectAttractCycle(boards);
    expect(a).toEqual(b);
    expect(a).not.toBe(b); // fresh array each call so callers can't mutate cached state
  });

  it('handles missing scoreboard entries defensively (undefined/null arrays)', () => {
    // Defensive — a partially-migrated save file might omit entries; the
    // helper should treat them as empty rather than throwing.
    const boards = { snakeClassic: undefined } as unknown as Scoreboards;
    expect(() => selectAttractCycle(boards)).not.toThrow();
    expect(selectAttractCycle(boards)).toEqual([...R84_PRIORITY_TRIO]);
  });

  it('pins priority trio as Snake→Pong→Bird (R84 polish order)', () => {
    // Load-bearing: the component renders cycle[0] first, so reordering this
    // constant silently changes the very first slide users see after idle.
    expect(R84_PRIORITY_TRIO).toEqual(['snakeClassic', 'vortexPong', 'matrixCloud']);
  });
});

describe('AttractMode component (R84.CI-10)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    framerMock.reducedMotion = false;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    framerMock.reducedMotion = false;
  });

  const renderAttract = (
    overrides: Partial<ComponentProps<typeof AttractMode>> = {},
  ) =>
    render(
      <AttractMode
        scoreboards={overrides.scoreboards ?? emptyBoards()}
        lastInitials={overrides.lastInitials ?? 'ABC'}
        enabled={overrides.enabled ?? true}
      />,
    );

  it('renders nothing before the idle timeout fires', () => {
    renderAttract();
    expect(screen.queryByText('HIGH SCORES')).not.toBeInTheDocument();
  });

  it('renders nothing when disabled (landing-page gate off)', () => {
    renderAttract({ enabled: false });
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.queryByText('HIGH SCORES')).not.toBeInTheDocument();
  });

  it('activates after 10s idle + shows the first cycle entry', () => {
    const boards = emptyBoards();
    boards.vortexPong = [entry(999)];
    renderAttract({ scoreboards: boards });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('HIGH SCORES')).toBeInTheDocument();
    expect(screen.getByText('Vortex Pong')).toBeInTheDocument();
  });

  it('prioritises the trio — shows Matrix Snake first when it has a score', () => {
    const boards = emptyBoards();
    boards.snakeClassic = [entry(100)];
    boards.matrixInvaders = [entry(50)];
    renderAttract({ scoreboards: boards });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('Matrix Snake')).toBeInTheDocument();
  });

  it('falls back to priority trio + "NO SCORES YET" when the arcade is fresh', () => {
    renderAttract({ scoreboards: emptyBoards() });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('Matrix Snake')).toBeInTheDocument();
    expect(screen.getByText('NO SCORES YET')).toBeInTheDocument();
  });

  it('advances to next cycle entry after 5s', () => {
    const boards = emptyBoards();
    boards.snakeClassic = [entry(100)];
    boards.vortexPong = [entry(200)];
    renderAttract({ scoreboards: boards });
    act(() => {
      vi.advanceTimersByTime(10_000);
    }); // enter attract
    expect(screen.getByText('Matrix Snake')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByText('Vortex Pong')).toBeInTheDocument();
  });

  it('wraps to first cycle entry after N * 5s (mod cycle length)', () => {
    // Pin the modulo — without it a long idle session would walk off the end
    // of the cycle array and render undefined.
    const boards = emptyBoards();
    boards.snakeClassic = [entry(1)];
    boards.vortexPong = [entry(2)];
    renderAttract({ scoreboards: boards });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    act(() => {
      vi.advanceTimersByTime(5_000);
    }); // wraps to cycle[0]
    expect(screen.getByText('Matrix Snake')).toBeInTheDocument();
  });

  it('exits attract when the overlay is clicked', () => {
    const boards = emptyBoards();
    boards.snakeClassic = [entry(100)];
    const { container } = renderAttract({ scoreboards: boards });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('HIGH SCORES')).toBeInTheDocument();

    const overlay = container.querySelector('.fixed.inset-0.z-50');
    expect(overlay).toBeTruthy();
    act(() => {
      fireEvent.click(overlay!);
    });
    expect(screen.queryByText('HIGH SCORES')).not.toBeInTheDocument();
  });

  it('exits attract on a user pointermove', () => {
    renderAttract({ scoreboards: emptyBoards() });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('HIGH SCORES')).toBeInTheDocument();
    act(() => {
      fireEvent(window, new Event('pointermove'));
    });
    expect(screen.queryByText('HIGH SCORES')).not.toBeInTheDocument();
  });

  it('exits attract on a keydown', () => {
    renderAttract({ scoreboards: emptyBoards() });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('HIGH SCORES')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByText('HIGH SCORES')).not.toBeInTheDocument();
  });

  it('does not schedule a cycle timer when the cycle has a single entry', () => {
    // A 1-entry cycle (e.g. only Snake has scores in priority mode would never
    // happen since fallback forces 3, but a future tweak might allow it) must
    // not flip between entries because there's nowhere to go. We assert the
    // label stays stable across 5s.
    const boards = emptyBoards();
    // Force a 1-entry populated cycle by giving one game a score while the
    // fallback path stays out of reach (at least one populated entry disables
    // the fallback).
    boards.metris = [entry(1)];
    renderAttract({ scoreboards: boards });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('Metris')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(screen.getByText('Metris')).toBeInTheDocument();
  });
});

describe('AttractMode reduced-motion (R84.CI-11)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    framerMock.reducedMotion = false;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    framerMock.reducedMotion = false;
  });

  const renderAttract = () =>
    render(
      <AttractMode
        scoreboards={emptyBoards()}
        lastInitials="ABC"
        enabled
      />,
    );

  const activate = () => {
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
  };

  it('renders the pulse CTA with animate-pulse when motion is allowed', () => {
    // Baseline: with reduced-motion false the CTA should keep the
    // Tailwind pulse class so sighted users see the "insert coin" breath.
    framerMock.reducedMotion = false;
    renderAttract();
    activate();
    const cta = screen.getByText('INSERT COIN TO CONTINUE');
    expect(cta.className).toContain('animate-pulse');
  });

  it('strips animate-pulse from the CTA when reduced-motion is requested', () => {
    // Load-bearing a11y contract: attract is decorative, so vestibular-trigger
    // pulse animations must drop away under prefers-reduced-motion: reduce.
    framerMock.reducedMotion = true;
    renderAttract();
    activate();
    const cta = screen.getByText('INSERT COIN TO CONTINUE');
    expect(cta.className).not.toContain('animate-pulse');
    // The layout class must stay — the CTA still needs its top margin.
    expect(cta.className).toContain('mt-8');
  });

  it('marks the overlay root with data-reduced-motion="false" by default', () => {
    // Observable tripwire for the shouldReduceMotion wiring — exposes the
    // framer hook decision to DOM-level tests without needing to reflect on
    // framer internals (which the module mock flattens).
    framerMock.reducedMotion = false;
    const { container } = renderAttract();
    activate();
    const overlay = container.querySelector('[data-reduced-motion]');
    expect(overlay?.getAttribute('data-reduced-motion')).toBe('false');
  });

  it('marks the overlay root with data-reduced-motion="true" when requested', () => {
    framerMock.reducedMotion = true;
    const { container } = renderAttract();
    activate();
    const overlay = container.querySelector('[data-reduced-motion]');
    expect(overlay?.getAttribute('data-reduced-motion')).toBe('true');
  });

  it('still cycles between entries under reduced-motion (motion gated, logic intact)', () => {
    // Reduced-motion must suppress the visual transitions, not the cycle
    // advancement — AT users still need the scoreboard rotation to surface
    // different games over time. Regression tripwire for a refactor that
    // mistakenly halts the interval when motion is disabled.
    framerMock.reducedMotion = true;
    const boards = emptyBoards();
    boards.snakeClassic = [entry(100)];
    boards.vortexPong = [entry(200)];
    render(
      <AttractMode scoreboards={boards} lastInitials="ABC" enabled />,
    );
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('Matrix Snake')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByText('Vortex Pong')).toBeInTheDocument();
  });

  it('tolerates a null return from useReducedMotion (server / first paint)', () => {
    // Framer returns `null` before the media-query probe has run. The
    // component coerces via `?? false`, so a null reading must behave
    // identically to false. Spy the mock to force-return null and assert
    // the overlay stays in the motion-allowed shape.
    const originalMock = Object.getOwnPropertyDescriptor(framerMock, 'reducedMotion');
    Object.defineProperty(framerMock, 'reducedMotion', {
      configurable: true,
      get: () => null as unknown as boolean,
    });
    try {
      const { container } = renderAttract();
      activate();
      const overlay = container.querySelector('[data-reduced-motion]');
      expect(overlay?.getAttribute('data-reduced-motion')).toBe('false');
      const cta = screen.getByText('INSERT COIN TO CONTINUE');
      expect(cta.className).toContain('animate-pulse');
    } finally {
      if (originalMock) {
        Object.defineProperty(framerMock, 'reducedMotion', originalMock);
      } else {
        // Restore simple data-property shape so later tests can mutate freely.
        Object.defineProperty(framerMock, 'reducedMotion', {
          configurable: true,
          writable: true,
          value: false,
        });
      }
    }
  });
});

describe('AttractMode cycle-position dots (R84.CI-12)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    framerMock.reducedMotion = false;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    framerMock.reducedMotion = false;
  });

  const renderBoards = (boards: Scoreboards) =>
    render(<AttractMode scoreboards={boards} lastInitials="ABC" enabled />);

  const activate = () => {
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
  };

  it('renders one dot per cycle entry when the cycle has >1 entries', () => {
    // Empty-arcade fallback forces the 3-entry priority trio, so a fresh
    // install exercises the dots row out of the box.
    const { getByTestId } = renderBoards(emptyBoards());
    activate();
    const dotsRow = getByTestId('attract-cycle-dots');
    expect(dotsRow.children).toHaveLength(3);
  });

  it('marks the first dot as active on the first slide', () => {
    // Tripwire: data-active wiring must track gameIndex. Without this pin a
    // refactor that forgets to pass `i === gameIndex` would leave every dot
    // in the dim colour and break the navigation signal.
    const { getByTestId } = renderBoards(emptyBoards());
    activate();
    const dots = getByTestId('attract-cycle-dots').children;
    expect(dots[0].getAttribute('data-active')).toBe('true');
    expect(dots[1].getAttribute('data-active')).toBe('false');
    expect(dots[2].getAttribute('data-active')).toBe('false');
  });

  it('shifts the active dot to the next index after a 5s cycle advance', () => {
    // Regression pin: the dots must track cycle advancement so the user
    // sees a visible "progress" signal during long idle.
    const { getByTestId } = renderBoards(emptyBoards());
    activate();
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    const dots = getByTestId('attract-cycle-dots').children;
    expect(dots[0].getAttribute('data-active')).toBe('false');
    expect(dots[1].getAttribute('data-active')).toBe('true');
    expect(dots[2].getAttribute('data-active')).toBe('false');
  });

  it('hides the dots row entirely when the cycle has a single entry', () => {
    // A lone populated non-trio game produces a 1-entry cycle. The dots row
    // is a navigation indicator — one dot is visual noise, not a signal.
    const boards = emptyBoards();
    boards.metris = [entry(1)];
    const { queryByTestId } = renderBoards(boards);
    activate();
    expect(queryByTestId('attract-cycle-dots')).toBeNull();
  });

  it('updates aria-label with the current position for screen-reader users', () => {
    // Load-bearing a11y contract: a row of bullet chars is unreadable by
    // screen readers, so the group-level label is the spoken signal. Must
    // update on every cycle advance, not just mount.
    const { getByTestId } = renderBoards(emptyBoards());
    activate();
    const dotsRow = getByTestId('attract-cycle-dots');
    expect(dotsRow.getAttribute('aria-label')).toBe('Cycle position: slide 1 of 3');
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(dotsRow.getAttribute('aria-label')).toBe('Cycle position: slide 2 of 3');
  });

  it('applies transition: none on dots under reduced motion', () => {
    // CI-11 gates every direct motion under `shouldReduceMotion`; the new
    // dots row has its own CSS transition (colour + text-shadow) that must
    // follow the same contract. Tripwire for a future dots tweak that
    // hard-codes a transition regardless of the hook.
    framerMock.reducedMotion = true;
    const { getByTestId } = renderBoards(emptyBoards());
    activate();
    const activeDot = getByTestId('attract-cycle-dots').children[0] as HTMLElement;
    expect(activeDot.style.transition).toBe('none');
  });

  it('keeps the smooth colour transition on dots when motion is allowed', () => {
    // Baseline pin: under motion-allowed the transition string must be the
    // 200ms ease pair so a regression dropping transitions entirely goes red.
    framerMock.reducedMotion = false;
    const { getByTestId } = renderBoards(emptyBoards());
    activate();
    const activeDot = getByTestId('attract-cycle-dots').children[0] as HTMLElement;
    expect(activeDot.style.transition).toContain('200ms');
    expect(activeDot.style.transition).toContain('color');
    expect(activeDot.style.transition).toContain('text-shadow');
  });

  it('marks individual dots aria-hidden so screen readers only read the group label', () => {
    // Tripwire for a refactor that adds per-dot labels — the group label is
    // the single spoken string, so dots stay hidden from AT.
    const { getByTestId } = renderBoards(emptyBoards());
    activate();
    const dots = getByTestId('attract-cycle-dots').children;
    for (const dot of Array.from(dots)) {
      expect(dot.getAttribute('aria-hidden')).toBe('true');
    }
  });
});

describe('AttractMode cycle-advance pluck (R84.CI-14)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    framerMock.reducedMotion = false;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    framerMock.reducedMotion = false;
  });

  const renderWithSFX = (playSFX: ReturnType<typeof vi.fn>, isMuted = false) => {
    const boards = emptyBoards();
    boards.snakeClassic = [entry(100)];
    boards.vortexPong = [entry(200)];
    boards.matrixCloud = [entry(300)];
    return render(
      <AttractMode
        scoreboards={boards}
        lastInitials="ABC"
        enabled
        playSFX={playSFX}
        isMuted={isMuted}
      />,
    );
  };

  const activate = () => {
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
  };

  it('is silent on the first slide after attract activation', () => {
    // The cue means "transition happened", not "attract exists". Firing on
    // the initial slide would collide with whatever audio was playing in the
    // last second of landing-page interaction.
    const playSFX = vi.fn();
    renderWithSFX(playSFX);
    activate();
    // Let any 0ms setTimeout flush.
    act(() => {
      vi.advanceTimersByTime(CYCLE_ADVANCE_STAGGER_MS * CYCLE_ADVANCE_NOTES.length);
    });
    expect(playSFX).not.toHaveBeenCalled();
  });

  it('fires the 3-note ascending pluck on the first cycle advance', () => {
    // Load-bearing: without this pin the cue could silently disappear under a
    // refactor that breaks the gameIndex-change effect.
    const playSFX = vi.fn();
    renderWithSFX(playSFX);
    activate();
    // 5s cycle advance schedules three setTimeouts at 0/70/140ms.
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    // Note 1 fires at t+0ms.
    act(() => {
      vi.advanceTimersByTime(0);
    });
    // Note 2 fires at t+70ms.
    act(() => {
      vi.advanceTimersByTime(CYCLE_ADVANCE_STAGGER_MS);
    });
    // Note 3 fires at t+140ms.
    act(() => {
      vi.advanceTimersByTime(CYCLE_ADVANCE_STAGGER_MS);
    });
    expect(playSFX).toHaveBeenCalledTimes(3);
    const calls = playSFX.mock.calls;
    expect(calls[0][0]).toBe('ctrlsAdvance');
    expect(calls[1][0]).toBe('ctrlsAdvance');
    expect(calls[2][0]).toBe('ctrlsAdvance');
    expect(calls[0][1]?.frequency).toEqual({
      start: CYCLE_ADVANCE_NOTES[0],
      end: CYCLE_ADVANCE_NOTES[0],
    });
    expect(calls[1][1]?.frequency).toEqual({
      start: CYCLE_ADVANCE_NOTES[1],
      end: CYCLE_ADVANCE_NOTES[1],
    });
    expect(calls[2][1]?.frequency).toEqual({
      start: CYCLE_ADVANCE_NOTES[2],
      end: CYCLE_ADVANCE_NOTES[2],
    });
  });

  it('pins notes as an ascending sequence (no regression to a flat chord)', () => {
    // Constant-level pin: a future tweak that flattens the three notes to the
    // same pitch would lose the "ascending arpeggio" character Tom asked for
    // in the R83.G9-style cue — keep the increasing-frequency invariant.
    for (let i = 1; i < CYCLE_ADVANCE_NOTES.length; i++) {
      expect(CYCLE_ADVANCE_NOTES[i]).toBeGreaterThan(CYCLE_ADVANCE_NOTES[i - 1]);
    }
  });

  it('is silent when isMuted is true, even after multiple advances', () => {
    // Load-bearing mute contract: the "Audio muted" toast announces silence,
    // so the attract cue must honour the toggle. playSFX also no-ops when the
    // sound system is muted internally, but the explicit prop gate keeps the
    // attract-side contract observable in tests.
    const playSFX = vi.fn();
    renderWithSFX(playSFX, /* isMuted */ true);
    activate();
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    act(() => {
      vi.advanceTimersByTime(CYCLE_ADVANCE_STAGGER_MS * CYCLE_ADVANCE_NOTES.length);
    });
    expect(playSFX).not.toHaveBeenCalled();
  });

  it('does nothing when playSFX is not provided (optional prop)', () => {
    // Regression pin for a reverted App.tsx wiring that drops the prop — the
    // component must still operate visually without an audio sink.
    const boards = emptyBoards();
    boards.snakeClassic = [entry(1)];
    boards.vortexPong = [entry(2)];
    expect(() => {
      render(<AttractMode scoreboards={boards} lastInitials="ABC" enabled />);
      act(() => {
        vi.advanceTimersByTime(10_000 + 5_000 + 200);
      });
    }).not.toThrow();
  });

  // Advance a cycle tick + flush the staggered note setTimeouts in two
  // act() blocks so React effects fire between the interval callback and
  // the resulting setTimeouts. A single combined advanceTimersByTime() would
  // fire the cycle-interval callback (queueing the three 0/70/140ms timers)
  // but the effect that schedules them runs after act() drains — so those
  // setTimeouts don't exist yet when the bigger advance runs. Two act()s
  // bridge the React → timer handoff.
  const flushCycleAdvance = () => {
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    act(() => {
      vi.advanceTimersByTime(CYCLE_ADVANCE_STAGGER_MS * CYCLE_ADVANCE_NOTES.length);
    });
  };

  it('passes volumeScale=0.08 so the cue sits below in-game SFX levels', () => {
    // Mix-balance pin: the attract screen is background ambience; the cue
    // must not clip or overpower a returning user's next interaction audio.
    const playSFX = vi.fn();
    renderWithSFX(playSFX);
    activate();
    flushCycleAdvance();
    for (const call of playSFX.mock.calls) {
      expect(call[1]?.volumeScale).toBe(0.08);
    }
  });

  it('resets the previous-index tracker when attract exits, so the next activation is silent', () => {
    // Without the ref reset the cue would fire on the first slide of the
    // next attract session (because previousIndexRef still holds the last
    // seen gameIndex from the previous session). Pin prevents that leak.
    const playSFX = vi.fn();
    renderWithSFX(playSFX);
    activate();
    flushCycleAdvance();
    expect(playSFX).toHaveBeenCalledTimes(3);
    playSFX.mockClear();

    // User interaction exits attract.
    act(() => {
      fireEvent(window, new Event('pointermove'));
    });
    // Next idle activation — should be silent on the first slide.
    activate();
    act(() => {
      vi.advanceTimersByTime(CYCLE_ADVANCE_STAGGER_MS * CYCLE_ADVANCE_NOTES.length);
    });
    expect(playSFX).not.toHaveBeenCalled();
  });

  it('fires on every subsequent cycle advance, not just the first', () => {
    // Regression tripwire for a refactor that caches "has fired once" and
    // suppresses later advances — each 5s rotation is its own event.
    const playSFX = vi.fn();
    renderWithSFX(playSFX);
    activate();
    flushCycleAdvance();
    expect(playSFX).toHaveBeenCalledTimes(3);
    playSFX.mockClear();
    flushCycleAdvance();
    expect(playSFX).toHaveBeenCalledTimes(3);
  });

  it('still fires under reduced-motion (audio and motion are independent a11y dimensions)', () => {
    // Reduced-motion suppresses visual transitions; it does NOT mute. AT users
    // who rely on audio landmarks still benefit from the cue, and the WCAG
    // reduced-motion contract is scoped to vestibular triggers, not audio.
    framerMock.reducedMotion = true;
    const playSFX = vi.fn();
    renderWithSFX(playSFX);
    activate();
    flushCycleAdvance();
    expect(playSFX).toHaveBeenCalledTimes(3);
  });
});
