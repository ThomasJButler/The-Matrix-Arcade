/**
 * Matrix Cloud -- Gameplay E2E Tests (React)
 *
 * 5 tests covering flap altitude, gravity pull,
 * obstacle scoring, collision game over, pause/resume.
 */

import { test, expect } from '../fixtures/arcade.fixture';
import { navigateToGame, startGame } from '../fixtures/arcade.fixture';
import {
  enableTestMode,
  getReactGamePhase,
  getReactScore,
  waitForGameOver,
} from '../fixtures/test-utils';
import { flap, togglePause } from '../fixtures/game-helpers';

test.describe('Matrix Cloud Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'Cloud');
  });

  test('flap increases altitude (prevents falling)', async ({ page }) => {
    test.setTimeout(20000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Flap several times to keep the bird/player aloft
    for (let i = 0; i < 10; i++) {
      await flap(page);
      await page.waitForTimeout(400);
    }

    // After flapping, game should still be playing (not dead from hitting ground)
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('playing');
  });

  test('gravity pulls player down without input', async ({ page }) => {
    test.setTimeout(35000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Do nothing -- gravity should eventually cause death
    await waitForGameOver(page, 30000);

    const phase = await getReactGamePhase(page);
    expect(phase).toBe('gameOver');
  });

  test('passing obstacles increases score', async ({ page }) => {
    test.setTimeout(20000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Flap consistently to survive and pass obstacles
    for (let i = 0; i < 20; i++) {
      await flap(page);
      await page.waitForTimeout(400);
    }

    const score = await getReactScore(page) ?? 0;

    // Score should increase from passing obstacles
    expect(score).toBeGreaterThan(0);
  });

  test('collision with obstacle triggers game over', async ({ page }) => {
    test.setTimeout(25000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Flap rapidly to go too high (or let gravity pull down) -- either way hit an obstacle
    for (let i = 0; i < 30; i++) {
      await flap(page);
      await page.waitForTimeout(50);
    }

    // After over-flapping, wait for collision
    await waitForGameOver(page, 20000);

    const phase = await getReactGamePhase(page);
    expect(phase).toBe('gameOver');
  });

  test('pause and resume preserves score', async ({ page }) => {
    test.setTimeout(20000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Play for a few seconds
    for (let i = 0; i < 6; i++) {
      await flap(page);
      await page.waitForTimeout(500);
    }

    const scoreBefore = await getReactScore(page) ?? 0;

    // Pause
    await togglePause(page);
    const pausedPhase = await getReactGamePhase(page);
    expect(pausedPhase).toBe('paused');

    // Resume
    await togglePause(page);
    const resumedPhase = await getReactGamePhase(page);
    expect(resumedPhase).toBe('playing');

    const scoreAfter = await getReactScore(page) ?? 0;
    expect(scoreAfter).toBeGreaterThanOrEqual(scoreBefore);
  });
});
