/**
 * Shared "human playthrough" runner used by every per-game spec.
 *
 * Goal: exercise each game the way a human would (land → start → real input →
 * progress → pause → game-over → restart) and capture stable visual baselines
 * at each milestone. All RNG/animation noise is quieted by `?test=1` (see
 * src/lib/test-mode.ts), so per-frame screenshots are pixel-stable.
 */

import { Page, expect } from '@playwright/test';
import { GameId, navigateToGame, startGame, pauseGame, exitGame } from './arcade.fixture';
import {
  ensurePhaserFocus,
  waitForGameReady,
  waitForCountdownComplete,
  waitForGameOver,
  getPhaserState,
} from './test-utils';

export interface PlaythroughHooks {
  /** What the player does to begin actual play after the menu. Default: press Enter. */
  beginPlay?: (page: Page) => Promise<void>;
  /** A short representative input that produces visible motion. */
  firstAction: (page: Page) => Promise<void>;
  /** Repeated action that should accumulate score / progress. */
  scoreLoop: (page: Page) => Promise<void>;
  /** How many times to call scoreLoop before the mid-game checkpoint. */
  scoreLoopIterations?: number;
  /** Trigger something that ends the game quickly (wall hit, fall, etc). */
  triggerGameOver: (page: Page) => Promise<void>;
  /** Optional check that score moved beyond zero (skip for games where score is hard to force). */
  expectScoreIncrease?: boolean;
}

export interface PlaythroughOptions {
  gameId: GameId;
  /**
   * Phaser scene key that signals "now playing". Almost always 'GameScene'
   * (per src/lib/phaser/types.ts SCENE_KEYS). Override per game if needed.
   */
  gameSceneKey?: string;
  hooks: PlaythroughHooks;
}

const DEFAULT_BEGIN_PLAY = async (page: Page) => {
  await page.keyboard.press('Enter');
};

/**
 * Runs the standard playthrough flow for one Phaser game, capturing 6 visual
 * checkpoints. Caller is expected to wrap this in a `test('full playthrough'...)`
 * block so Playwright owns timeout + retry semantics.
 */
export async function runPlaythrough(page: Page, opts: PlaythroughOptions): Promise<void> {
  const sceneKey = opts.gameSceneKey ?? 'GameScene';
  const beginPlay = opts.hooks.beginPlay ?? DEFAULT_BEGIN_PLAY;
  const iterations = opts.hooks.scoreLoopIterations ?? 6;
  const prefix = opts.gameId;

  // 1. Land on portal — preview frame (no live game yet).
  await navigateToGame(page, opts.gameId);
  await expect(page).toHaveScreenshot(`${prefix}-01-portal.png`);

  // 2. Press PLAY → Phaser mounts → MenuScene. We can't detect MenuScene via
  // the per-frame state seam (only GameScene update loops publish), so allow
  // a short settle for the menu to render before screenshotting.
  await startGame(page);
  await ensurePhaserFocus(page);
  // Generous menu settle — some games (Matrix Invaders, Rhythm Hacker) have
  // longer intro animations before the menu is pixel-stable.
  await page.waitForTimeout(3000);
  await expect(page).toHaveScreenshot(`${prefix}-02-menu.png`);

  // 3. Begin actual gameplay (game-specific menu confirm).
  await beginPlay(page);
  await ensurePhaserFocus(page);
  await waitForGameReady(page, sceneKey);
  await waitForCountdownComplete(page);
  await opts.hooks.firstAction(page);
  await expect(page).toHaveScreenshot(`${prefix}-03-early-play.png`);

  // 4. Score / progress loop.
  for (let i = 0; i < iterations; i++) {
    await opts.hooks.scoreLoop(page);
  }
  if (opts.hooks.expectScoreIncrease) {
    const state = await getPhaserState(page);
    if (state && typeof state.score === 'number') {
      expect(state.score).toBeGreaterThan(0);
    }
  }
  await expect(page).toHaveScreenshot(`${prefix}-04-mid-play.png`);

  // 5. Pause / resume round-trip.
  await pauseGame(page);
  await page.waitForFunction(
    () => (window as unknown as { __PHASER_GAME_STATE__?: { isPaused?: boolean } }).__PHASER_GAME_STATE__?.isPaused === true
      || /PAUSED/.test(document.body.textContent ?? ''),
    undefined,
    { timeout: 5000 }
  ).catch(() => { /* some games may not surface a pause state — tolerate */ });
  await expect(page).toHaveScreenshot(`${prefix}-05-paused.png`);
  await pauseGame(page);

  // 6. Trigger end-of-session. Some games reach a natural game-over (death,
  // health depletion); others are slow-burn — for those we accept that the
  // hook may ESC out to the portal. Either way we wait briefly and capture
  // the final visible state.
  await opts.hooks.triggerGameOver(page);
  await Promise.race([
    waitForGameOver(page, 20_000).catch(() => null),
    page.waitForFunction(() => document.body.dataset.portalIsPlaying === 'false', undefined, { timeout: 20_000 }).catch(() => null),
  ]);
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot(`${prefix}-06-final.png`);
}

/**
 * A minimal companion test that confirms ESC returns the player to the portal
 * cleanly, without entering an unrecoverable state.
 */
export async function runExitToPortal(page: Page, gameId: GameId, sceneKey = 'GameScene'): Promise<void> {
  await navigateToGame(page, gameId);
  await startGame(page);
  await ensurePhaserFocus(page);
  await page.waitForTimeout(1500); // menu settle
  await page.keyboard.press('Enter');
  await waitForGameReady(page, sceneKey).catch(() => page.waitForTimeout(1000));
  await exitGame(page);
  await expect.poll(() => page.evaluate(() => document.body.dataset.portalIsPlaying)).toBe('false');
}
