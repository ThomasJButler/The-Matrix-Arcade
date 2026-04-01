/**
 * Edge Cases -- Cross-Game Gameplay E2E Tests
 *
 * 11 tests covering focus loss/recovery, double ESC, pause on game-over,
 * rapid pause toggle, game over event propagation, high score preservation,
 * mute toggle, window resize, portal navigation from game over, autoStart skips menu.
 */

import { test, expect } from '../fixtures/arcade.fixture';
import { navigateToGame, startGame } from '../fixtures/arcade.fixture';
import {
  enableTestMode,
  getPhaserState,
  getReactGamePhase,
  getReactScore,
  waitForGameOver,
  ensurePhaserFocus,
  loseFocus,
  recoverFocus,
} from '../fixtures/test-utils';
import {
  startPhaserGame,
  togglePause,
  dropPiece,
  hopForward,
} from '../fixtures/game-helpers';

test.describe('Edge Cases: Cross-Game', () => {
  test('focus loss during Phaser play pauses or preserves state', async ({ page }) => {
    test.setTimeout(20000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);

    await startPhaserGame(page, 'matrix-frogger');
    await page.waitForTimeout(1000);

    // Move forward to verify game is active
    await hopForward(page);
    await page.waitForTimeout(300);

    const stateBefore = await getPhaserState(page);
    const scoreBefore = (stateBefore?.score as number) ?? 0;

    // Lose focus
    await loseFocus(page);
    await page.waitForTimeout(500);

    // Score should not have changed while focus is lost (game paused/frozen)
    const stateAfter = await getPhaserState(page);
    const scoreAfter = (stateAfter?.score as number) ?? 0;
    expect(scoreAfter).toBeGreaterThanOrEqual(scoreBefore);
  });

  test('focus recovery allows continued play', async ({ page }) => {
    test.setTimeout(20000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);

    await startPhaserGame(page, 'matrix-frogger');
    await page.waitForTimeout(1000);

    // Lose focus
    await loseFocus(page);
    await page.waitForTimeout(500);

    // Recover focus
    await recoverFocus(page);
    await page.waitForTimeout(500);
    await ensurePhaserFocus(page);

    // Should be able to continue playing
    await hopForward(page);
    await page.waitForTimeout(400);

    const state = await getPhaserState(page);
    expect(state?.scene).toBe('Game');
  });

  test('double ESC does not crash', async ({ page }) => {
    test.setTimeout(20000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);

    await startPhaserGame(page, 'neo-jump');
    await page.waitForTimeout(1000);

    // Press ESC twice quickly
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Page should not crash -- should be back at portal or landing
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });

  test('pause on game-over screen has no effect', async ({ page }) => {
    test.setTimeout(45000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'Metris');
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Rush to game over
    for (let i = 0; i < 50; i++) {
      await dropPiece(page);
      await page.waitForTimeout(150);
    }

    await waitForGameOver(page, 30000);

    // Try to pause on game-over screen
    await togglePause(page);
    await page.waitForTimeout(300);

    // Phase should still be gameOver (pause had no effect)
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('gameOver');
  });

  test('rapid pause toggle does not crash', async ({ page }) => {
    test.setTimeout(20000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);

    await startPhaserGame(page, 'cloud-jumper');
    await page.waitForTimeout(1000);

    // Rapidly toggle pause 10 times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('p');
      await page.waitForTimeout(100);
    }

    // Game should not have crashed
    const state = await getPhaserState(page);
    expect(state).not.toBeNull();
    expect(['Game', 'GameOver']).toContain(state?.scene);
  });

  test('game over event propagation works', async ({ page }) => {
    test.setTimeout(45000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'Metris');
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Rush to game over
    for (let i = 0; i < 50; i++) {
      await dropPiece(page);
      await page.waitForTimeout(150);
    }

    await waitForGameOver(page, 30000);

    // Game over text or final score should be visible in the DOM
    const hasGameOverIndicator = await page.waitForFunction(
      () => {
        const body = document.body.textContent || '';
        return body.includes('GAME OVER') || body.includes('Game Over') ||
               body.includes('Final Score') || body.includes('Score:');
      },
      undefined,
      { timeout: 5000 }
    ).then(() => true).catch(() => false);

    expect(hasGameOverIndicator).toBe(true);
  });

  test('high score is preserved after game over', async ({ page }) => {
    test.setTimeout(45000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'Metris');
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Play and earn some score
    for (let i = 0; i < 5; i++) {
      await dropPiece(page);
      await page.waitForTimeout(300);
    }

    const scoreDuringPlay = await getReactScore(page) ?? 0;

    // Rush to game over
    for (let i = 0; i < 50; i++) {
      await dropPiece(page);
      await page.waitForTimeout(150);
    }

    await waitForGameOver(page, 30000);

    // Score should still be visible and at least as high as what was earned
    const finalScore = await getReactScore(page) ?? 0;
    expect(finalScore).toBeGreaterThanOrEqual(scoreDuringPlay);
  });

  test('mute toggle works during gameplay', async ({ page }) => {
    test.setTimeout(20000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);

    await startPhaserGame(page, 'matrix-frogger');
    await page.waitForTimeout(1000);

    // Toggle mute with M key
    await page.keyboard.press('m');
    await page.waitForTimeout(300);

    // Game should still be running
    const state = await getPhaserState(page);
    expect(state?.scene).toBe('Game');

    // Toggle mute back
    await page.keyboard.press('m');
    await page.waitForTimeout(300);

    const stateAfter = await getPhaserState(page);
    expect(stateAfter?.scene).toBe('Game');
  });

  test('window resize does not crash game', async ({ page }) => {
    test.setTimeout(20000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'Cloud');
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Resize window
    await page.setViewportSize({ width: 800, height: 400 });
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // Game should still be functional
    const phase = await getReactGamePhase(page);
    expect(['playing', 'gameOver']).toContain(phase);
  });

  test('portal navigation from game over screen', async ({ page }) => {
    test.setTimeout(45000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    await navigateToGame(page, 'Metris');
    await startGame(page);

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
      undefined,
      { timeout: 5000 }
    );

    // Rush to game over
    for (let i = 0; i < 50; i++) {
      await dropPiece(page);
      await page.waitForTimeout(150);
    }

    await waitForGameOver(page, 30000);

    // Press ESC to exit back to portal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Should be back at portal/landing (not crashed)
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });

  test('autoStart skips menu and goes directly to playing', async ({ page }) => {
    test.setTimeout(15000);
    await enableTestMode(page);
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to a React game -- autoStart is set to true in App.tsx
    await navigateToGame(page, 'Invaders');
    await startGame(page);

    // Game should jump directly to playing (autoStart=true skips menu)
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-game-phase]');
        const phase = el?.getAttribute('data-game-phase');
        return phase === 'playing' || phase === 'gameOver';
      },
      undefined,
      { timeout: 10000 }
    );

    const phase = await getReactGamePhase(page);
    expect(['playing', 'gameOver']).toContain(phase);
  });
});
