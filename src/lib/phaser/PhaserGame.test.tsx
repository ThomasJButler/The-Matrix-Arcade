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
import { buildGameOverAnnouncement, buildScoreMilestoneAnnouncement, buildMatchPointAnnouncement } from './a11y';

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

// R84.CI-6: focus-visible refinement. Before this iteration, the wrapper
// painted the 2 px green focus ring via a `hasFocus` useState flipped by
// `onFocus`/`onBlur`. The ring fired on every focus event — including the
// programmatic `.focus()` calls inside `onClick` and `onMouseEnter` — so
// mouse users saw a bright ring flash whenever they clicked or hovered the
// game. These specs pin the new CSS-driven approach: the container exposes
// a `phaser-game-container` class so the shared animations.css rule can
// target `:focus-visible`, and the inline `box-shadow`/`outline` props are
// gone so nothing paints unconditionally.
describe('PhaserGame focus-visible ring wiring (R84.CI-6)', () => {
  it('applies the phaser-game-container class for the CSS focus-visible rule', () => {
    // The class must match the selector in `src/styles/animations.css`
    // (`.phaser-game-container:focus-visible`) — rename this class and the
    // CSS rule becomes a dead selector, so this test is also a
    // keep-in-sync tripwire for a rename across the two files.
    const { container } = render(
      <PhaserGame gameId="vortexPong" config={{ type: 0, width: 800, height: 600 }} />,
    );
    const root = container.querySelector('[data-phaser-game="true"]');
    expect(root).not.toBeNull();
    expect(root?.classList.contains('phaser-game-container')).toBe(true);
  });

  it('does not paint an inline box-shadow focus ring', () => {
    // A future regression re-introducing `style={{ boxShadow: hasFocus ?
    // ... }}` would bypass `:focus-visible` and re-flash the ring on every
    // mouse click. Pinning "no inline box-shadow on the container" catches
    // that at unit-test time rather than waiting for an a11y audit.
    const { container } = render(
      <PhaserGame gameId="vortexPong" config={{ type: 0, width: 800, height: 600 }} />,
    );
    const root = container.querySelector('[data-phaser-game="true"]') as HTMLElement;
    expect(root.style.boxShadow).toBe('');
    // The previous implementation used a transparent 2 px outline as a
    // layout hack around the old ring — now unused, so any inline outline
    // would be dead code or a regression.
    expect(root.style.outline).toBe('');
  });

  it('preserves tabIndex=0 so keyboard users can Tab into the container', () => {
    // tabIndex=0 is load-bearing: Phaser's keyboard plugin subscribes on
    // `window` (see PhaserGame.tsx useEffect input config) but the
    // container is still the first DOM surface a Tab key lands on.
    // Dropping tabIndex would leave Tab users stranded on the page chrome.
    const { container } = render(
      <PhaserGame gameId="vortexPong" config={{ type: 0, width: 800, height: 600 }} />,
    );
    const root = container.querySelector('[data-phaser-game="true"]') as HTMLElement;
    expect(root.tabIndex).toBe(0);
  });
});

// R84.CI-2: short pattern-matched announcement so AT users hear the same
// milestone beats sighted players hear as a COLLECTIBLE stinger. The
// builder returns '' (not a guess string) when the payload is malformed so
// the wrapper's `if (msg)` guard can no-op rather than announce garbage.
describe('buildScoreMilestoneAnnouncement', () => {
  it('renders a full-stop terminated phrase for a valid threshold', () => {
    // Trailing period gives the screen reader an audible pause before the
    // next live-region update, matching the gameOver announcement shape.
    expect(buildScoreMilestoneAnnouncement({ value: 100 })).toBe('Score milestone 100.');
  });

  it('echoes the threshold value rather than a current-score proxy', () => {
    // Bird fires the 50 milestone the moment score crosses 50 — which can
    // land at 55 or 60 depending on combo. The announcement must always
    // read the round threshold so AT users pattern-match the milestone,
    // not the noisy current score.
    expect(buildScoreMilestoneAnnouncement({ value: 50 })).toBe('Score milestone 50.');
    expect(buildScoreMilestoneAnnouncement({ value: 250 })).toBe('Score milestone 250.');
  });

  it('returns an empty string for undefined data', () => {
    // Defensive: a scene that forgets the payload shouldn't trigger a
    // garbled announcement. Empty string fails the `if (msg)` guard in
    // PhaserGame.tsx so the region stays on its previous announcement.
    expect(buildScoreMilestoneAnnouncement()).toBe('');
  });

  it('returns an empty string for an empty-object payload', () => {
    expect(buildScoreMilestoneAnnouncement({})).toBe('');
  });

  it('returns an empty string for a non-finite value', () => {
    // NaN or Infinity sneaking through a future emitter mishap shouldn't
    // render `Score milestone NaN.` into the live region.
    expect(buildScoreMilestoneAnnouncement({ value: Number.NaN })).toBe('');
    expect(buildScoreMilestoneAnnouncement({ value: Number.POSITIVE_INFINITY })).toBe('');
  });
});

// R84.CI-5: dedicated announcement for Vortex Pong's win-condition-based
// tension beat. Pong scoring is first-to-WIN_SCORE so "match point" is a
// semantic side-aware state, not a cumulative numeric threshold — hence a
// distinct event + builder rather than overloading scoreMilestone.
describe('buildMatchPointAnnouncement', () => {
  it('renders the player-side phrase when side is "player"', () => {
    // Bare "Match point." mirrors tennis/pong sports-announcer vernacular;
    // trailing period gives the screen reader an audible pause before the
    // next live-region update, same shape as the other builders.
    expect(buildMatchPointAnnouncement({ side: 'player' })).toBe('Match point.');
  });

  it('renders the opponent-side phrase when side is "opponent"', () => {
    // "Opponent" rather than "AI" so the announcement stays game-agnostic
    // if a future 2-player Pong lands — the wording still works when the
    // opponent is a second human.
    expect(buildMatchPointAnnouncement({ side: 'opponent' })).toBe('Opponent match point.');
  });

  it('returns an empty string for undefined data', () => {
    // Defensive: a scene that forgets the payload shouldn't trigger a
    // garbled announcement. Empty string fails the `if (msg)` guard in
    // PhaserGame.tsx so the region stays on its previous announcement.
    expect(buildMatchPointAnnouncement()).toBe('');
  });

  it('returns an empty string for an empty-object payload', () => {
    expect(buildMatchPointAnnouncement({})).toBe('');
  });

  it('returns an empty string for an unknown side value', () => {
    // Typo or future third side ("referee"?) shouldn't render garbage into
    // the live region; the `if (msg)` guard in the wrapper no-ops on ''.
    expect(buildMatchPointAnnouncement({ side: 'neither' as 'player' })).toBe('');
  });
});
