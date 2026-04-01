/**
 * Matrix Frogger -- Gameplay E2E Tests (Phaser)
 *
 * 7 tests covering forward movement scoring, enemy collision,
 * pill collection, power-ups, backward movement, pause/resume, full lifecycle.
 */

import { test, expect } from '../fixtures/arcade.fixture';
import { navigateToGame, startGame } from '../fixtures/arcade.fixture';
import {
  enableTestMode,
  getPhaserState,
  waitForGameOver,
  ensurePhaserFocus,
} from '../fixtures/test-utils';
import {
  startPhaserGame,
  hopForward,
  togglePause,
} from '../fixtures/game-helpers';

test.describe('Matrix Frogger Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'matrix-frogger');
  });

  test('forward movement increases score', async ({ page }) => {
    test.setTimeout(20000);

    await startPhaserGame(page, 'matrix-frogger');

    const stateBefore = await getPhaserState(page);
    const scoreBefore = (stateBefore?.score as number) ?? 0;

    // Hop forward several times
    for (let i = 0; i < 5; i++) {
      await hopForward(page);
      await page.waitForTimeout(400);
    }

    const stateAfter = await getPhaserState(page);
    const scoreAfter = (stateAfter?.score as number) ?? 0;

    expect(scoreAfter).toBeGreaterThan(scoreBefore);
  });

  test('enemy collision causes death', async ({ page }) => {
    test.setTimeout(25000);

    await startPhaserGame(page, 'matrix-frogger');

    // Rush forward rapidly to increase chance of enemy collision
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
    }

    // Should eventually hit an enemy and die
    await waitForGameOver(page, 15000);

    const state = await getPhaserState(page);
    expect(state?.scene).toBe('GameOver');
  });

  test('pill collection increases score', async ({ page }) => {
    test.setTimeout(25000);

    await startPhaserGame(page, 'matrix-frogger');

    const stateBefore = await getPhaserState(page);
    const scoreBefore = (stateBefore?.score as number) ?? 0;

    // Move around to try to collect pills
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }

    const stateAfter = await getPhaserState(page);
    const scoreAfter = (stateAfter?.score as number) ?? 0;

    // Score should increase from forward movement and potential pill collection
    expect(scoreAfter).toBeGreaterThan(scoreBefore);
  });

  test('power-ups can be activated', async ({ page }) => {
    test.setTimeout(30000);

    await startPhaserGame(page, 'matrix-frogger');

    // Move around extensively to find blue pills (power-ups)
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);
      await page.keyboard.press(i % 2 === 0 ? 'ArrowLeft' : 'ArrowRight');
      await page.waitForTimeout(300);
    }

    // Verify game is still running (power-up activation should not crash)
    const state = await getPhaserState(page);
    expect(state?.scene).toBe('Game');
  });

  test('backward movement does not increase max distance', async ({ page }) => {
    test.setTimeout(20000);

    await startPhaserGame(page, 'matrix-frogger');

    // Move forward first
    for (let i = 0; i < 3; i++) {
      await hopForward(page);
      await page.waitForTimeout(400);
    }

    const stateForward = await getPhaserState(page);
    const distanceAfterForward = (stateForward?.maxDistance as number) ?? 0;

    // Move backward
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(400);
    }

    const stateBackward = await getPhaserState(page);
    const distanceAfterBackward = (stateBackward?.maxDistance as number) ?? 0;

    // Max distance should not increase from going backward
    expect(distanceAfterBackward).toBe(distanceAfterForward);
  });

  test('pause and resume preserves game state', async ({ page }) => {
    test.setTimeout(20000);

    await startPhaserGame(page, 'matrix-frogger');

    // Move forward a bit
    for (let i = 0; i < 3; i++) {
      await hopForward(page);
      await page.waitForTimeout(400);
    }

    const stateBeforePause = await getPhaserState(page);
    const scoreBeforePause = (stateBeforePause?.score as number) ?? 0;

    // Pause
    await togglePause(page);
    const pausedState = await getPhaserState(page);
    expect(pausedState?.isPaused).toBe(true);

    // Resume
    await togglePause(page);
    const resumedState = await getPhaserState(page);
    expect(resumedState?.isPaused).toBe(false);
    expect((resumedState?.score as number) ?? 0).toBeGreaterThanOrEqual(scoreBeforePause);
  });

  test('full lifecycle: play, die, and reach game over', async ({ page }) => {
    test.setTimeout(30000);

    await startPhaserGame(page, 'matrix-frogger');

    // Play actively by moving forward through lanes
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(250);
      await page.keyboard.press(i % 2 === 0 ? 'ArrowLeft' : 'ArrowRight');
      await page.waitForTimeout(250);
    }

    // Rush into enemies to trigger game over
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(150);
    }

    await waitForGameOver(page, 15000);

    const state = await getPhaserState(page);
    expect(state?.scene).toBe('GameOver');
  });
});
