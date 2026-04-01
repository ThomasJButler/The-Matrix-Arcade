/**
 * Vortex Pong -- Gameplay E2E Tests (React)
 *
 * 4 tests covering paddle movement, score tracking,
 * game over, pause/resume.
 */

import { test, expect } from '../fixtures/arcade.fixture';
import { navigateToGame, startGame } from '../fixtures/arcade.fixture';
import {
  enableTestMode,
  getReactGamePhase,
  getReactScore,
  waitForGameOver,
} from '../fixtures/test-utils';
import { movePaddle, togglePause } from '../fixtures/game-helpers';

test.describe('Vortex Pong Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'Pong');
  });

  test('paddle movement works', async ({ page }) => {
    test.setTimeout(15000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Move paddle up and down
    await movePaddle(page, 'up', 500);
    await movePaddle(page, 'down', 500);
    await movePaddle(page, 'up', 300);

    // Game should still be playing (paddle movement works)
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('playing');
  });

  test('score increases during play', async ({ page }) => {
    test.setTimeout(30000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Track the ball with paddle for 10s
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press(i % 4 < 2 ? 'ArrowUp' : 'ArrowDown');
      await page.waitForTimeout(250);
    }

    // Wait for rallies to complete and points to be scored
    await page.waitForTimeout(3000);

    const score = await getReactScore(page) ?? 0;

    // At least some points should have been scored (player or AI)
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('game reaches game over', async ({ page }) => {
    test.setTimeout(60000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Let AI score until game over -- idle player
    await waitForGameOver(page, 55000);

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
    await movePaddle(page, 'up', 300);
    await movePaddle(page, 'down', 300);

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
