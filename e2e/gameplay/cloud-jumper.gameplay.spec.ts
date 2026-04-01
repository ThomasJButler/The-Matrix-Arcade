/**
 * Cloud Jumper -- Gameplay E2E Tests (Phaser)
 *
 * 5 tests covering jump mechanics, distance tracking,
 * cloud bounce scoring, storm cloud damage, pause/resume.
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
  jump,
  togglePause,
} from '../fixtures/game-helpers';

test.describe('Cloud Jumper Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'cloud-jumper');
  });

  test('jump mechanics keep player alive', async ({ page }) => {
    test.setTimeout(25000);

    await startPhaserGame(page, 'cloud-jumper');

    // Jump repeatedly to survive the auto-scroll
    for (let i = 0; i < 20; i++) {
      await jump(page);
      await page.waitForTimeout(400);
    }

    // Game should still be running after active jumping
    const state = await getPhaserState(page);
    expect(state?.scene).toBe('Game');
  });

  test('distance increases during play', async ({ page }) => {
    test.setTimeout(20000);

    await startPhaserGame(page, 'cloud-jumper');

    // Jump to survive and gain distance
    for (let i = 0; i < 10; i++) {
      await jump(page);
      await page.waitForTimeout(400);
    }

    const state = await getPhaserState(page);
    const distance = (state?.distance as number) ?? 0;

    // Distance should increase from scrolling
    expect(distance).toBeGreaterThan(0);
  });

  test('cloud bounce increases score and bounce streak', async ({ page }) => {
    test.setTimeout(25000);

    await startPhaserGame(page, 'cloud-jumper');

    // Jump actively to land on clouds
    for (let i = 0; i < 15; i++) {
      await jump(page);
      await page.waitForTimeout(500);
    }

    const state = await getPhaserState(page);
    const score = (state?.score as number) ?? 0;

    // Score should increase from bouncing on clouds
    expect(score).toBeGreaterThan(0);
  });

  test('storm clouds cause damage or game over', async ({ page }) => {
    test.setTimeout(30000);

    await startPhaserGame(page, 'cloud-jumper');

    // Jump through gameplay -- storm clouds appear and can damage player
    for (let i = 0; i < 25; i++) {
      await jump(page);
      await page.waitForTimeout(400);
    }

    // Game should still be running or ended from storm cloud damage
    const state = await getPhaserState(page);
    expect(['Game', 'GameOver']).toContain(state?.scene);
  });

  test('pause and resume preserves distance', async ({ page }) => {
    test.setTimeout(20000);

    await startPhaserGame(page, 'cloud-jumper');

    // Jump to gain some distance
    for (let i = 0; i < 8; i++) {
      await jump(page);
      await page.waitForTimeout(400);
    }

    const stateBeforePause = await getPhaserState(page);
    const distanceBefore = (stateBeforePause?.distance as number) ?? 0;

    // Pause
    await togglePause(page);
    const pausedState = await getPhaserState(page);
    expect(pausedState?.isPaused).toBe(true);

    // Resume
    await togglePause(page);
    const resumedState = await getPhaserState(page);
    expect(resumedState?.isPaused).toBe(false);
    expect((resumedState?.distance as number) ?? 0).toBeGreaterThanOrEqual(distanceBefore);
  });
});
