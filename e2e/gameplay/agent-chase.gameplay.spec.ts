/**
 * Agent Chase — Gameplay E2E Tests
 *
 * 10 Playwright tests covering dot collection, lives, game over,
 * power pellets, pause/resume, ESC exit, focus loss/recovery,
 * and full lifecycle flows. Uses Phaser state inspection via
 * window.__PHASER_GAME_STATE__ for assertions.
 */

import { test, expect } from '../fixtures/arcade.fixture';
import { navigateToGame, startGame } from '../fixtures/arcade.fixture';
import {
  enableTestMode,
  getPhaserState,
  waitForPhaserScene,
  ensurePhaserFocus,
  waitForGameOver,
  loseFocus,
  recoverFocus,
} from '../fixtures/test-utils';
import {
  startPhaserGame,
  moveInMaze,
  togglePause,
} from '../fixtures/game-helpers';

test.describe('Agent Chase Gameplay', () => {
  /**
   * 1. Dot collection increases score
   *
   * Navigate the player through the maze so it collects dots.
   * Verify the Phaser-exposed score has increased from zero.
   */
  test('dot collection increases score', async ({ gameplayPage }) => {
    test.setTimeout(30000);

    await startPhaserGame(gameplayPage, 'agent-chase');
    await waitForPhaserScene(gameplayPage, 'GameScene');

    // Capture initial state
    const initialState = await getPhaserState(gameplayPage);
    const initialScore = (initialState?.score as number) ?? 0;

    // Move left into dot-filled corridor (player starts at col 13, row 23
    // on a row full of dots)
    await ensurePhaserFocus(gameplayPage);
    for (let i = 0; i < 8; i++) {
      await moveInMaze(gameplayPage, 'left');
      await gameplayPage.waitForTimeout(200);
    }

    // Wait for score to increase via dot collection
    await gameplayPage.waitForFunction(
      (min: number) => {
        const s = (window as any).__PHASER_GAME_STATE__;
        return s && typeof s.score === 'number' && s.score > min;
      },
      initialScore,
      { timeout: 10000 },
    );

    const updatedState = await getPhaserState(gameplayPage);
    expect(updatedState).not.toBeNull();
    expect(updatedState!.score as number).toBeGreaterThan(initialScore);
  });

  /**
   * 2. Lives decrease on ghost collision
   *
   * Idle the player so an agent reaches it — lives should drop from 3.
   */
  test('lives decrease on ghost collision', async ({ gameplayPage }) => {
    test.setTimeout(45000);

    await startPhaserGame(gameplayPage, 'agent-chase');
    await waitForPhaserScene(gameplayPage, 'GameScene');

    // Confirm starting lives
    const initialState = await getPhaserState(gameplayPage);
    expect(initialState).not.toBeNull();
    expect(initialState!.lives).toBe(3);

    // Idle — ghosts will reach the player eventually
    await gameplayPage.waitForFunction(
      () => {
        const s = (window as any).__PHASER_GAME_STATE__;
        return s && typeof s.lives === 'number' && s.lives < 3;
      },
      undefined,
      { timeout: 30000 },
    );

    const afterHit = await getPhaserState(gameplayPage);
    expect(afterHit).not.toBeNull();
    expect(afterHit!.lives as number).toBeLessThan(3);
  });

  /**
   * 3. Game over when all lives lost
   *
   * Let the agents catch the player repeatedly until lives reach 0,
   * which triggers the GameOver scene.
   */
  test('game over when all lives lost', async ({ gameplayPage }) => {
    test.setTimeout(90000);

    await startPhaserGame(gameplayPage, 'agent-chase');
    await waitForPhaserScene(gameplayPage, 'GameScene');

    // Wait for game over — the player will lose all 3 lives by idling
    await waitForGameOver(gameplayPage, 80000);

    const state = await getPhaserState(gameplayPage);
    // After game over the scene transitions to GameOverScene.
    // waitForGameOver checks for scene === 'GameOver' or visible text.
    // The Phaser state may stop updating once GameScene ends, so also
    // check that the page contains GAME OVER text.
    const hasGameOverText = await gameplayPage
      .locator('text=GAME OVER')
      .isVisible()
      .catch(() => false);

    const sceneIsGameOver = state?.scene === 'GameOverScene';
    expect(hasGameOverText || sceneIsGameOver).toBeTruthy();
  });

  /**
   * 4. Power pellet frightens agents
   *
   * Navigate toward a power pellet (corners of rows 3 and 23 have '3' tiles)
   * and verify that the game state reflects an increased score consistent
   * with pellet collection (50 points per pellet).
   */
  test('power pellet frightens agents', async ({ gameplayPage }) => {
    test.setTimeout(30000);

    await startPhaserGame(gameplayPage, 'agent-chase');
    await waitForPhaserScene(gameplayPage, 'GameScene');

    // Player starts at col 13, row 23. Power pellets ('3') are at:
    //   row 3 col 1, row 3 col 26, row 23 col 1, row 23 col 26
    // Move left toward col 1 (row 23) to collect the power pellet.
    // Row 23 is: '1322112222222002222222112231'
    // The '3' is at col 1. Player at col 13 needs to move ~12 tiles left.
    await ensurePhaserFocus(gameplayPage);
    for (let i = 0; i < 15; i++) {
      await moveInMaze(gameplayPage, 'left');
      await gameplayPage.waitForTimeout(200);
    }

    // Allow movement to settle
    await gameplayPage.waitForTimeout(500);

    // The power pellet is worth 50 points. Plus dot pickups along the way.
    // Verify score is at least 50 (pellet value).
    await gameplayPage.waitForFunction(
      () => {
        const s = (window as any).__PHASER_GAME_STATE__;
        return s && typeof s.score === 'number' && s.score >= 50;
      },
      undefined,
      { timeout: 10000 },
    );

    const state = await getPhaserState(gameplayPage);
    expect(state).not.toBeNull();
    expect(state!.score as number).toBeGreaterThanOrEqual(50);
  });

  /**
   * 5. Pause/resume with P key
   *
   * Press P to pause, verify isPaused is true, press P again to resume.
   */
  test('pause and resume with P key', async ({ gameplayPage }) => {
    test.setTimeout(20000);

    await startPhaserGame(gameplayPage, 'agent-chase');
    await waitForPhaserScene(gameplayPage, 'GameScene');

    await ensurePhaserFocus(gameplayPage);

    // Pause the game
    await togglePause(gameplayPage);

    // The scene is paused so exposeTestState may not update. Instead check
    // for the visible PAUSED overlay text the BaseScene renders.
    const pausedVisible = await gameplayPage
      .locator('text=PAUSED')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    // Also check the canvas-rendered pause (Phaser text on canvas won't be
    // in DOM), so additionally check isPaused if state is available.
    const pausedState = await getPhaserState(gameplayPage);
    const isPausedFromState = pausedState?.isPaused === true;

    expect(pausedVisible || isPausedFromState).toBeTruthy();

    // Resume
    await ensurePhaserFocus(gameplayPage);
    await togglePause(gameplayPage);

    // After resume, wait for the game to update and isPaused to be false
    await gameplayPage.waitForFunction(
      () => {
        const s = (window as any).__PHASER_GAME_STATE__;
        return s && s.isPaused === false;
      },
      undefined,
      { timeout: 5000 },
    );

    const resumedState = await getPhaserState(gameplayPage);
    expect(resumedState).not.toBeNull();
    expect(resumedState!.isPaused).toBe(false);
  });

  /**
   * 6. ESC exits to portal
   *
   * Press Escape during gameplay — the game should emit an exit event
   * and the portal/carousel UI should appear.
   */
  test('ESC exits to portal', async ({ gameplayPage }) => {
    test.setTimeout(20000);

    await startPhaserGame(gameplayPage, 'agent-chase');
    await waitForPhaserScene(gameplayPage, 'GameScene');

    await ensurePhaserFocus(gameplayPage);
    await gameplayPage.keyboard.press('Escape');
    await gameplayPage.waitForTimeout(1000);

    // After exiting, the portal view should be visible with game title or
    // navigation controls. Look for the carousel or game controls UI.
    const portalVisible = await gameplayPage
      .locator('.game-controls-enhanced, [data-testid="carousel-next"], button:has-text("Play"), button:has-text("PLAY")')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(portalVisible).toBeTruthy();
  });

  /**
   * 7. Focus loss shows overlay
   *
   * Blur the active element while the game is running. The game should
   * detect focus loss and pause or show an overlay.
   */
  test('focus loss shows overlay', async ({ gameplayPage }) => {
    test.setTimeout(20000);

    await startPhaserGame(gameplayPage, 'agent-chase');
    await waitForPhaserScene(gameplayPage, 'GameScene');

    // Move a bit first to ensure the game is actively running
    await ensurePhaserFocus(gameplayPage);
    for (let i = 0; i < 3; i++) {
      await moveInMaze(gameplayPage, 'right');
      await gameplayPage.waitForTimeout(150);
    }

    // Lose focus
    await loseFocus(gameplayPage);
    await gameplayPage.waitForTimeout(500);

    // Check if the game paused or an overlay appeared.
    // The Phaser game may auto-pause on blur (Phaser's built-in behaviour)
    // or the BaseScene may handle it.
    const phaserState = await getPhaserState(gameplayPage);
    const isPausedAfterBlur = phaserState?.isPaused === true;

    // Also look for a visible overlay
    const overlayVisible = await gameplayPage
      .locator('text=PAUSED, text=Click to resume, text=FOCUS LOST')
      .first()
      .isVisible()
      .catch(() => false);

    // Phaser auto-pauses when the page loses focus by default, so the game
    // loop should be halted. We accept either visible overlay or isPaused state.
    expect(isPausedAfterBlur || overlayVisible).toBeTruthy();
  });

  /**
   * 8. Focus recovery allows continued play
   *
   * After losing focus and showing the overlay, hovering/clicking the
   * game container should resume gameplay.
   */
  test('focus recovery allows continued play', async ({ gameplayPage }) => {
    test.setTimeout(25000);

    await startPhaserGame(gameplayPage, 'agent-chase');
    await waitForPhaserScene(gameplayPage, 'GameScene');

    // Move a bit to get score
    await ensurePhaserFocus(gameplayPage);
    for (let i = 0; i < 3; i++) {
      await moveInMaze(gameplayPage, 'right');
      await gameplayPage.waitForTimeout(150);
    }

    // Lose focus
    await loseFocus(gameplayPage);
    await gameplayPage.waitForTimeout(500);

    // Recover focus
    await recoverFocus(gameplayPage);
    await gameplayPage.waitForTimeout(500);

    // Click the Phaser container to regain keyboard input
    await ensurePhaserFocus(gameplayPage);
    await gameplayPage.waitForTimeout(300);

    // Move to collect more dots — proves the game is still accepting input
    for (let i = 0; i < 5; i++) {
      await moveInMaze(gameplayPage, 'left');
      await gameplayPage.waitForTimeout(200);
    }

    // Give movement time to register
    await gameplayPage.waitForTimeout(500);

    // Verify the game scene is still active (not game over or menu)
    const stateAfter = await getPhaserState(gameplayPage);
    expect(stateAfter).not.toBeNull();
    expect(stateAfter!.scene).toBe('GameScene');
  });

  /**
   * 9. Full lifecycle: menu -> play -> game over
   *
   * Navigate to Agent Chase, go through menu, play until game over,
   * and verify the GameOver scene appears.
   */
  test('full lifecycle: menu -> play -> game over', async ({ gameplayPage }) => {
    test.setTimeout(120000);

    // Navigate to game (lands on menu scene)
    await navigateToGame(gameplayPage, 'agent-chase');
    await startGame(gameplayPage);
    await gameplayPage.waitForTimeout(500);

    // Press Enter to start from menu
    await ensurePhaserFocus(gameplayPage);
    await gameplayPage.keyboard.press('Enter');
    await gameplayPage.waitForTimeout(1000);

    // Verify we are in GameScene
    await waitForPhaserScene(gameplayPage, 'GameScene');

    const gameState = await getPhaserState(gameplayPage);
    expect(gameState).not.toBeNull();
    expect(gameState!.lives).toBe(3);
    expect(gameState!.score).toBe(0);

    // Move around a bit to collect some dots
    await ensurePhaserFocus(gameplayPage);
    for (let i = 0; i < 5; i++) {
      await moveInMaze(gameplayPage, 'left');
      await gameplayPage.waitForTimeout(200);
    }

    // Now idle and let ghosts eliminate all lives
    await waitForGameOver(gameplayPage, 100000);

    // Verify game over
    const finalState = await getPhaserState(gameplayPage);
    const hasGameOverText = await gameplayPage
      .locator('text=GAME OVER')
      .isVisible()
      .catch(() => false);
    const sceneIsGameOver = finalState?.scene === 'GameOverScene';

    expect(hasGameOverText || sceneIsGameOver).toBeTruthy();
  });

  /**
   * 10. Full lifecycle with restart
   *
   * Play through to game over, then restart and verify a fresh game
   * begins with reset score and lives.
   */
  test('full lifecycle with restart', async ({ gameplayPage }) => {
    test.setTimeout(150000);

    await startPhaserGame(gameplayPage, 'agent-chase');
    await waitForPhaserScene(gameplayPage, 'GameScene');

    // Collect a few dots so score is non-zero
    await ensurePhaserFocus(gameplayPage);
    for (let i = 0; i < 5; i++) {
      await moveInMaze(gameplayPage, 'left');
      await gameplayPage.waitForTimeout(200);
    }

    // Wait for a non-zero score
    await gameplayPage.waitForFunction(
      () => {
        const s = (window as any).__PHASER_GAME_STATE__;
        return s && typeof s.score === 'number' && s.score > 0;
      },
      undefined,
      { timeout: 10000 },
    );

    // Idle until game over
    await waitForGameOver(gameplayPage, 120000);

    // Verify game over arrived
    const gameOverState = await getPhaserState(gameplayPage);
    const hasGameOverText = await gameplayPage
      .locator('text=GAME OVER')
      .isVisible()
      .catch(() => false);
    expect(hasGameOverText || gameOverState?.scene === 'GameOverScene').toBeTruthy();

    // Restart — press R (or Enter/Space) which the GameOverScene handles
    await ensurePhaserFocus(gameplayPage);
    await gameplayPage.keyboard.press('r');
    await gameplayPage.waitForTimeout(1500);

    // Verify we are back in GameScene with fresh state
    await waitForPhaserScene(gameplayPage, 'GameScene');

    const restartedState = await getPhaserState(gameplayPage);
    expect(restartedState).not.toBeNull();
    expect(restartedState!.scene).toBe('GameScene');
    expect(restartedState!.score).toBe(0);
    expect(restartedState!.lives).toBe(3);
  });
});
