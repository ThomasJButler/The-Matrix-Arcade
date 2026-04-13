/**
 * Code Breaker -- Gameplay E2E Tests (Phaser)
 *
 * 6 tests covering paddle movement, ball launch/scoring,
 * life loss, pause/resume, bullet time, and game over.
 */

import { test, expect } from '../fixtures/arcade.fixture';
import { navigateToGame, startGame } from '../fixtures/arcade.fixture';
import {
  enableTestMode,
  getPhaserState,
  waitForGameOver,
  ensurePhaserFocus,
} from '../fixtures/test-utils';
import { moveBreakerPaddle, launchBall, togglePause } from '../fixtures/game-helpers';

async function startCodeBreaker(page: import('@playwright/test').Page) {
  await navigateToGame(page, 'code-breaker');
  await startGame(page);
  await page.waitForTimeout(500);
  await ensurePhaserFocus(page);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  await ensurePhaserFocus(page);
}

async function waitForGameScene(page: import('@playwright/test').Page, timeout = 8000) {
  await page.waitForFunction(
    () => {
      const state = (window as any).__PHASER_GAME_STATE__;
      return state && state.scene === 'Game';
    },
    undefined,
    { timeout }
  );
}

test.describe('Code Breaker Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('paddle moves left and right', async ({ page }) => {
    test.setTimeout(20000);
    await startCodeBreaker(page);
    await waitForGameScene(page);

    const stateBefore = await getPhaserState(page);
    const paddleXBefore = (stateBefore as any)?.paddleX ?? 400;

    await moveBreakerPaddle(page, 'left', 400);
    const stateAfterLeft = await getPhaserState(page);
    const paddleXLeft = (stateAfterLeft as any)?.paddleX ?? 400;

    await moveBreakerPaddle(page, 'right', 800);
    const stateAfterRight = await getPhaserState(page);
    const paddleXRight = (stateAfterRight as any)?.paddleX ?? 400;

    expect(paddleXLeft).toBeLessThan(paddleXBefore);
    expect(paddleXRight).toBeGreaterThan(paddleXLeft);
  });

  test('launching ball and breaking bricks scores points', async ({ page }) => {
    test.setTimeout(25000);
    await startCodeBreaker(page);
    await waitForGameScene(page);

    const stateBefore = await getPhaserState(page);
    expect((stateBefore as any)?.isBallAttached).toBe(true);

    await launchBall(page);
    await page.waitForTimeout(500);

    const stateAfterLaunch = await getPhaserState(page);
    expect((stateAfterLaunch as any)?.isBallAttached).toBe(false);

    // Wait for ball to hit bricks and score points
    await page.waitForFunction(
      () => {
        const state = (window as any).__PHASER_GAME_STATE__;
        return state && state.score > 0;
      },
      undefined,
      { timeout: 10000 }
    );

    const stateWithScore = await getPhaserState(page);
    expect((stateWithScore as any)?.score).toBeGreaterThan(0);
  });

  test('losing ball decrements lives and re-attaches ball', async ({ page }) => {
    test.setTimeout(30000);
    await startCodeBreaker(page);
    await waitForGameScene(page);

    const initialState = await getPhaserState(page);
    expect((initialState as any)?.lives).toBe(3);

    // Launch ball and wait for it to fall off screen
    await launchBall(page);

    // Move paddle out of the way so ball misses
    await moveBreakerPaddle(page, 'left', 1500);

    // Wait for life loss (ball re-attaches)
    await page.waitForFunction(
      () => {
        const state = (window as any).__PHASER_GAME_STATE__;
        return state && state.lives < 3;
      },
      undefined,
      { timeout: 15000 }
    );

    const stateAfterLoss = await getPhaserState(page);
    expect((stateAfterLoss as any)?.lives).toBeLessThan(3);
    expect((stateAfterLoss as any)?.isBallAttached).toBe(true);
  });

  test('pause and resume works correctly', async ({ page }) => {
    test.setTimeout(20000);
    await startCodeBreaker(page);
    await waitForGameScene(page);

    await launchBall(page);
    await page.waitForTimeout(500);

    // Pause
    await togglePause(page);
    const pausedState = await getPhaserState(page);
    expect((pausedState as any)?.isPaused).toBe(true);

    // Resume
    await togglePause(page);
    await page.waitForTimeout(300);
    const resumedState = await getPhaserState(page);
    expect((resumedState as any)?.isPaused).toBe(false);
  });

  test('bullet time activation slows gameplay', async ({ page }) => {
    test.setTimeout(20000);
    await startCodeBreaker(page);
    await waitForGameScene(page);

    await launchBall(page);
    await page.waitForTimeout(300);

    // Activate bullet time with B key
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    const state = await getPhaserState(page);
    expect((state as any)?.bulletTimeActive).toBe(true);
    expect((state as any)?.bulletTimeUses).toBeGreaterThanOrEqual(1);
  });

  test('losing all lives triggers game over', async ({ page }) => {
    test.setTimeout(60000);
    await startCodeBreaker(page);
    await waitForGameScene(page);

    // Repeatedly launch ball and dodge to lose lives
    for (let life = 0; life < 3; life++) {
      await launchBall(page);
      // Move paddle away so ball falls
      await moveBreakerPaddle(page, 'left', 1500);
      // Wait for life loss or game over
      await page.waitForFunction(
        () => {
          const state = (window as any).__PHASER_GAME_STATE__;
          if (!state) return false;
          return state.isBallAttached === true || state.scene === 'GameOver';
        },
        undefined,
        { timeout: 15000 }
      );

      const currentState = await getPhaserState(page);
      if ((currentState as any)?.scene === 'GameOver') break;
    }

    await waitForGameOver(page, 10000);

    const finalState = await getPhaserState(page);
    expect((finalState as any)?.scene).toBe('GameOver');
  });
});
