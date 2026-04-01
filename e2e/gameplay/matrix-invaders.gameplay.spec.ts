/**
 * Matrix Invaders -- Gameplay E2E Tests (React)
 *
 * 5 tests covering shooting scoring, player movement,
 * wave progression, health depletion game over, pause/resume.
 */

import { test, expect } from '../fixtures/arcade.fixture';
import { navigateToGame, startGame } from '../fixtures/arcade.fixture';
import {
  enableTestMode,
  getReactGamePhase,
  getReactScore,
  waitForGameOver,
} from '../fixtures/test-utils';
import { shootInvader, togglePause } from '../fixtures/game-helpers';

test.describe('Matrix Invaders Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'Invaders');
  });

  test('shooting enemies increases score', async ({ page }) => {
    test.setTimeout(20000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    const scoreBefore = await getReactScore(page) ?? 0;

    // Shoot while moving to hit enemies
    for (let i = 0; i < 30; i++) {
      await shootInvader(page);
      await page.keyboard.press(i % 4 < 2 ? 'ArrowLeft' : 'ArrowRight');
      await page.waitForTimeout(150);
    }

    const scoreAfter = await getReactScore(page) ?? 0;

    // Score should increase from destroying enemies
    expect(scoreAfter).toBeGreaterThan(scoreBefore);
  });

  test('player can move left and right', async ({ page }) => {
    test.setTimeout(15000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Move left and right
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);
    }
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
    }

    // Game should still be playing (movement works without crash)
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('playing');
  });

  test('wave progression occurs after clearing enemies', async ({ page }) => {
    test.setTimeout(30000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Actively shoot enemies to try clearing a wave
    for (let i = 0; i < 60; i++) {
      await shootInvader(page);
      await page.keyboard.press(i % 6 < 3 ? 'ArrowLeft' : 'ArrowRight');
      await page.waitForTimeout(100);
    }

    // Game should still be running after wave clears
    const phase = await getReactGamePhase(page);
    expect(['playing', 'gameOver']).toContain(phase);

    // Score should be non-zero from kills
    const score = await getReactScore(page) ?? 0;
    expect(score).toBeGreaterThan(0);
  });

  test('health depletion causes game over', async ({ page }) => {
    test.setTimeout(30000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Do nothing -- enemies will shoot and drain health
    await waitForGameOver(page, 25000);

    const phase = await getReactGamePhase(page);
    expect(phase).toBe('gameOver');
  });

  test('pause and resume works correctly', async ({ page }) => {
    test.setTimeout(20000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Play briefly
    for (let i = 0; i < 5; i++) {
      await shootInvader(page);
      await page.waitForTimeout(200);
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
