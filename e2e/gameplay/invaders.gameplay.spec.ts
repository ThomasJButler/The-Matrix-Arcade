/**
 * Matrix Invaders — Gameplay E2E Tests
 *
 * Tests bottom camping with tank hits and skilled shoot-and-dodge.
 */

import {
  test,
  expect,
  takeScreenshot,
  navigateToGame,
  startGame,
} from '../fixtures/arcade.fixture';

test.describe('Matrix Invaders Gameplay', () => {
  test.beforeEach(async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'Invaders');
    await arcadePage.waitForTimeout(500);
  });

  test('bottom camping — tank hits', async ({ arcadePage }) => {
    test.setTimeout(30000);
    await startGame(arcadePage);

    // Don't move, don't shoot — see how long player survives with 100 health
    await arcadePage.waitForTimeout(10000);
    await takeScreenshot(arcadePage, 'gameplay-invaders-camping-10s');

    await arcadePage.waitForTimeout(10000);
    await takeScreenshot(arcadePage, 'gameplay-invaders-camping-20s');

    // Check for game over
    const gameOver = await arcadePage
      .locator('text=GAME OVER')
      .isVisible()
      .catch(() => false);
    console.log(`Invaders camping game over after 20s: ${gameOver}`);
  });

  test('shoot and dodge', async ({ arcadePage }) => {
    test.setTimeout(20000);
    await startGame(arcadePage);

    // Move Left/Right and Space to shoot for 10s
    for (let i = 0; i < 50; i++) {
      // Move
      await arcadePage.keyboard.press(
        i % 4 < 2 ? 'ArrowLeft' : 'ArrowRight'
      );
      await arcadePage.waitForTimeout(100);

      // Shoot
      await arcadePage.keyboard.press('Space');
      await arcadePage.waitForTimeout(100);
    }

    await takeScreenshot(arcadePage, 'gameplay-invaders-shoot-dodge');

    // Verify game didn't crash
    const pageTitle = await arcadePage.title();
    expect(pageTitle).toBeTruthy();
  });
});
