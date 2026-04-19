/**
 * R84.CI (a11y priority 1): screen-reader announcement coverage for the
 * shared Phaser React wrapper. Before this iteration, all 12 Phaser scenes
 * emitted `gameOver` events into the React layer but no DOM surface
 * announced the outcome to assistive tech — sighted players saw the
 * GameOverScene, screen-reader users heard nothing. The wrapper now
 * renders a visually-hidden `role="status"` + `aria-live="polite"` div
 * that updates via `buildGameOverAnnouncement`. This file pins the
 * helper's string shape + the rendered region's initial state so a refactor
 * can't quietly regress either.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PhaserGame } from './PhaserGame';
import { buildGameOverAnnouncement } from './a11y';

// The shared Phaser mock in src/test/setup.ts wires `events.on / .off` but
// not `.once`, and PhaserGame.tsx subscribes to `game.events.once('ready', …)`
// inside its mount useEffect. Supply a self-contained mock locally — the
// real phaser module cannot be imported under vitest because it transitively
// requires `phaser3spectorjs` which expects a WebGL runtime. Mirrors just
// enough of the shape PhaserGame.tsx touches inside useEffect.
vi.mock('phaser', () => {
  const makeGame = () => ({
    destroy: vi.fn(),
    registry: {
      get: vi.fn(),
      set: vi.fn(),
      events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    },
    events: { on: vi.fn(), off: vi.fn(), once: vi.fn() },
    scene: { start: vi.fn(), add: vi.fn(), keys: {} },
    sound: { mute: false },
  });
  const GameCtor = vi.fn().mockImplementation(makeGame);
  const Scale = { FIT: 'FIT', CENTER_BOTH: 'CENTER_BOTH', NO_ZOOM: 'NO_ZOOM' };
  return {
    default: { Game: GameCtor, Scale },
    Game: GameCtor,
    Scale,
  };
});

describe('buildGameOverAnnouncement', () => {
  it('returns the bare phrase when no data is given', () => {
    expect(buildGameOverAnnouncement()).toBe('Game over.');
  });

  it('includes the score when provided', () => {
    expect(buildGameOverAnnouncement({ score: 250 })).toBe('Game over. Final score 250.');
  });

  it('includes the reason when provided', () => {
    // A reason like "Hit by sentinel" is typical for Bird / Snake — the
    // trailing period is appended so the screen reader audibly pauses
    // before any subsequent live-region update.
    expect(buildGameOverAnnouncement({ reason: 'Hit by sentinel' })).toBe(
      'Game over. Hit by sentinel.',
    );
  });

  it('combines both score and reason in a stable order', () => {
    // Order is score-first → reason-last because the score is the headline
    // result, and reasons are supplementary. Keeping the order stable means
    // screen-reader users can pattern-match the announcement mentally.
    expect(buildGameOverAnnouncement({ score: 1200, reason: 'Out of lives' })).toBe(
      'Game over. Final score 1200. Out of lives.',
    );
  });

  it('tolerates an empty-object data blob', () => {
    // Defensive against BaseScene.gameOver() callers that forget the data
    // payload. Without this, an undefined.score would throw at render time
    // and the whole wrapper would unmount mid-run.
    expect(buildGameOverAnnouncement({})).toBe('Game over.');
  });
});

describe('PhaserGame SR announcement region', () => {
  it('renders an empty sr-only aria-live region on mount', () => {
    // The region must exist from mount onwards; deferring it until a
    // gameOver event would mean screen readers don't register the live
    // region as an announcement target, and the first gameOver would be
    // silently ignored by most ATs.
    const { getByTestId } = render(
      <PhaserGame gameId="vortexPong" config={{ type: 0, width: 800, height: 600 }} />,
    );
    const region = getByTestId('phaser-sr-announcement');
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region.className).toContain('sr-only');
    expect(region.textContent).toBe('');
  });
});
