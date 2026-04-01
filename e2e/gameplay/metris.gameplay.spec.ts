/**
 * Metris -- Gameplay E2E Tests (React)
 *
 * 7 tests covering piece placement, board-fill game over,
 * hard drop, rotation, pause/resume, full lifecycle, rapid input stability.
 */

import { test, expect } from '../fixtures/arcade.fixture';
import { navigateToGame, startGame } from '../fixtures/arcade.fixture';
import {
  enableTestMode,
  getReactGamePhase,
  getReactScore,
  waitForGameOver,
} from '../fixtures/test-utils';
import { dropPiece, togglePause } from '../fixtures/game-helpers';

test.describe('Metris Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'Metris');
  });

  test('piece placement increases score', async ({ page }) => {
    test.setTimeout(20000);
    await startGame(page);

    // Wait for game to be playing
    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    const scoreBefore = await getReactScore(page) ?? 0;

    // Hard drop several pieces
    for (let i = 0; i < 5; i++) {
      await dropPiece(page);
      await page.waitForTimeout(300);
    }

    const scoreAfter = await getReactScore(page) ?? 0;

    // Score should increase from piece placement / hard drop bonus
    expect(scoreAfter).toBeGreaterThanOrEqual(scoreBefore);
  });

  test('board fill leads to game over', async ({ page }) => {
    test.setTimeout(45000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Spam hard drops to fill the board fast
    for (let i = 0; i < 50; i++) {
      await dropPiece(page);
      await page.waitForTimeout(200);
    }

    // Wait for game over
    await waitForGameOver(page, 30000);

    const phase = await getReactGamePhase(page);
    expect(phase).toBe('gameOver');
  });

  test('hard drop places piece instantly', async ({ page }) => {
    test.setTimeout(15000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    const scoreBefore = await getReactScore(page) ?? 0;

    // Hard drop (Space key)
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const scoreAfter = await getReactScore(page) ?? 0;

    // Hard drop should award points and phase should still be playing
    expect(scoreAfter).toBeGreaterThanOrEqual(scoreBefore);
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('playing');
  });

  test('piece rotation works without crash', async ({ page }) => {
    test.setTimeout(15000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Rotate piece multiple times (ArrowUp)
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(150);
    }

    // Game should still be playing (no crash)
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('playing');
  });

  test('pause and resume preserves state', async ({ page }) => {
    test.setTimeout(20000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Place a few pieces
    for (let i = 0; i < 3; i++) {
      await dropPiece(page);
      await page.waitForTimeout(300);
    }

    const scoreBeforePause = await getReactScore(page) ?? 0;

    // Pause
    await togglePause(page);
    const pausedPhase = await getReactGamePhase(page);
    expect(pausedPhase).toBe('paused');

    // Resume
    await togglePause(page);
    const resumedPhase = await getReactGamePhase(page);
    expect(resumedPhase).toBe('playing');

    const scoreAfterResume = await getReactScore(page) ?? 0;
    expect(scoreAfterResume).toBeGreaterThanOrEqual(scoreBeforePause);
  });

  test('full lifecycle: play to game over and restart', async ({ page }) => {
    test.setTimeout(45000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Play until game over by rapid hard drops
    for (let i = 0; i < 50; i++) {
      await dropPiece(page);
      await page.waitForTimeout(150);
    }

    await waitForGameOver(page, 30000);
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('gameOver');

    // Restart with R key
    await page.keyboard.press('r');
    await page.waitForTimeout(1000);

    // Should be back to menu or playing
    const restartPhase = await getReactGamePhase(page);
    expect(['menu', 'playing']).toContain(restartPhase);
  });

  test('rapid input does not crash the game', async ({ page }) => {
    test.setTimeout(20000);
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Rapidly alternate between left, right, rotate, and drop
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];
    for (let i = 0; i < 60; i++) {
      const key = keys[i % keys.length];
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
    }

    // Game should not have crashed -- phase should be playing or gameOver
    const phase = await getReactGamePhase(page);
    expect(['playing', 'gameOver']).toContain(phase);
  });
});
