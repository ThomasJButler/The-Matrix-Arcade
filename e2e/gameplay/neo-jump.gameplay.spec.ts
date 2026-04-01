/**
 * Neo Jump -- Gameplay E2E Tests (Phaser)
 *
 * 6 tests covering altitude gain, horizontal movement,
 * fall game over, jetpack fuel depletion, pause/resume, full lifecycle.
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
  moveHorizontal,
  activateJetpack,
  togglePause,
} from '../fixtures/game-helpers';

test.describe('Neo Jump Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'neo-jump');
  });

  test('altitude increases during play', async ({ page }) => {
    test.setTimeout(20000);

    await startPhaserGame(page, 'neo-jump');

    // Wait for auto-bounce to build some altitude
    await page.waitForTimeout(3000);

    const state = await getPhaserState(page);
    const altitude = (state?.altitude as number) ?? 0;

    // Player auto-bounces, altitude should increase from initial position
    expect(altitude).toBeGreaterThan(0);
  });

  test('horizontal movement works', async ({ page }) => {
    test.setTimeout(20000);

    await startPhaserGame(page, 'neo-jump');
    await page.waitForTimeout(1000);

    // Move left and right while auto-bouncing
    for (let i = 0; i < 10; i++) {
      await moveHorizontal(page, i % 2 === 0 ? 'left' : 'right');
      await page.waitForTimeout(300);
    }

    // Game should still be running (movement doesn't cause crash)
    const state = await getPhaserState(page);
    expect(state?.scene).toBe('Game');
    expect(state?.isGameOver).toBe(false);
  });

  test('falling below screen causes game over', async ({ page }) => {
    test.setTimeout(30000);

    await startPhaserGame(page, 'neo-jump');

    // Move to one side to miss platforms and fall
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);
    }

    // Wait for player to fall off screen
    await waitForGameOver(page, 20000);

    const state = await getPhaserState(page);
    expect(state?.scene).toBe('GameOver');
  });

  test('jetpack fuel depletes when used', async ({ page }) => {
    test.setTimeout(20000);

    await startPhaserGame(page, 'neo-jump');
    await page.waitForTimeout(1000);

    const stateBefore = await getPhaserState(page);
    const fuelBefore = (stateBefore?.jetpackFuel as number) ?? 100;

    // Hold up arrow to use jetpack
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(2000);
    await page.keyboard.up('ArrowUp');

    const stateAfter = await getPhaserState(page);
    const fuelAfter = (stateAfter?.jetpackFuel as number) ?? 100;

    // Fuel should have decreased
    expect(fuelAfter).toBeLessThan(fuelBefore);
  });

  test('pause and resume preserves altitude', async ({ page }) => {
    test.setTimeout(20000);

    await startPhaserGame(page, 'neo-jump');
    await page.waitForTimeout(3000);

    const stateBeforePause = await getPhaserState(page);
    const altBefore = (stateBeforePause?.altitude as number) ?? 0;

    // Pause
    await togglePause(page);
    const pausedState = await getPhaserState(page);
    expect(pausedState?.isPaused).toBe(true);

    // Resume
    await togglePause(page);
    const resumedState = await getPhaserState(page);
    expect(resumedState?.isPaused).toBe(false);
    expect((resumedState?.altitude as number) ?? 0).toBeGreaterThanOrEqual(altBefore);
  });

  test('full lifecycle: gain altitude, use jetpack, fall, game over', async ({ page }) => {
    test.setTimeout(30000);

    await startPhaserGame(page, 'neo-jump');

    // Move around with lateral movement
    for (let i = 0; i < 10; i++) {
      await moveHorizontal(page, i % 2 === 0 ? 'left' : 'right');
      await page.waitForTimeout(300);
    }

    // Use jetpack
    await activateJetpack(page);
    await page.waitForTimeout(1000);

    const state = await getPhaserState(page);
    const altitude = (state?.altitude as number) ?? 0;
    expect(altitude).toBeGreaterThan(0);

    // Now intentionally fall by moving to edge and waiting
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);
    }

    await waitForGameOver(page, 20000);

    const finalState = await getPhaserState(page);
    expect(finalState?.scene).toBe('GameOver');
  });
});
