import { test, takeScreenshot, navigateToGame, startGame, pauseGame } from '../../fixtures/arcade.fixture';

test.describe('Code Breaker Visual Tests', () => {
  test.beforeEach(async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'code-breaker');
    await arcadePage.waitForTimeout(500);
  });

  test('capture code-breaker menu screen', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(500);
    await takeScreenshot(arcadePage, 'code-breaker-menu');
  });

  test('capture code-breaker gameplay - level 1', async ({ arcadePage }) => {
    await startGame(arcadePage);
    await arcadePage.waitForTimeout(1000);
    // Press Enter to start from Phaser menu
    await arcadePage.keyboard.press('Enter');
    await arcadePage.waitForTimeout(1000);

    await takeScreenshot(arcadePage, 'code-breaker-level1');
  });

  test('capture code-breaker ball launch', async ({ arcadePage }) => {
    await startGame(arcadePage);
    await arcadePage.waitForTimeout(500);
    await arcadePage.keyboard.press('Enter');
    await arcadePage.waitForTimeout(1000);

    // Launch ball
    await arcadePage.keyboard.press('Space');
    await arcadePage.waitForTimeout(300);

    await takeScreenshot(arcadePage, 'code-breaker-ball-launch');
  });

  test('capture code-breaker paddle movement', async ({ arcadePage }) => {
    await startGame(arcadePage);
    await arcadePage.waitForTimeout(500);
    await arcadePage.keyboard.press('Enter');
    await arcadePage.waitForTimeout(500);

    // Move paddle right
    await arcadePage.keyboard.down('ArrowRight');
    await arcadePage.waitForTimeout(400);
    await arcadePage.keyboard.up('ArrowRight');

    await takeScreenshot(arcadePage, 'code-breaker-paddle-move');
  });

  test('capture code-breaker brick destruction', async ({ arcadePage }) => {
    await startGame(arcadePage);
    await arcadePage.waitForTimeout(500);
    await arcadePage.keyboard.press('Enter');
    await arcadePage.waitForTimeout(500);

    // Launch ball and wait for bricks to break
    await arcadePage.keyboard.press('Space');
    await arcadePage.waitForTimeout(3000);

    await takeScreenshot(arcadePage, 'code-breaker-bricks');
  });

  test('capture code-breaker pause screen', async ({ arcadePage }) => {
    await startGame(arcadePage);
    await arcadePage.waitForTimeout(500);
    await arcadePage.keyboard.press('Enter');
    await arcadePage.waitForTimeout(500);

    await pauseGame(arcadePage);
    await arcadePage.waitForTimeout(300);

    await takeScreenshot(arcadePage, 'code-breaker-paused');
  });

  test('capture code-breaker bullet time', async ({ arcadePage }) => {
    await startGame(arcadePage);
    await arcadePage.waitForTimeout(500);
    await arcadePage.keyboard.press('Enter');
    await arcadePage.waitForTimeout(500);

    // Launch and activate bullet time
    await arcadePage.keyboard.press('Space');
    await arcadePage.waitForTimeout(300);
    await arcadePage.keyboard.press('b');
    await arcadePage.waitForTimeout(500);

    await takeScreenshot(arcadePage, 'code-breaker-bullet-time');
  });

  test('capture code-breaker scoring', async ({ arcadePage }) => {
    await startGame(arcadePage);
    await arcadePage.waitForTimeout(500);
    await arcadePage.keyboard.press('Enter');
    await arcadePage.waitForTimeout(500);

    // Play to accumulate score
    await arcadePage.keyboard.press('Space');
    for (let i = 0; i < 20; i++) {
      await arcadePage.keyboard.press(i % 4 < 2 ? 'ArrowLeft' : 'ArrowRight');
      await arcadePage.waitForTimeout(200);
    }

    await takeScreenshot(arcadePage, 'code-breaker-score');
  });

  test('capture code-breaker game over', async ({ arcadePage }) => {
    await startGame(arcadePage);
    await arcadePage.waitForTimeout(500);
    await arcadePage.keyboard.press('Enter');
    await arcadePage.waitForTimeout(500);

    // Launch ball and let it fall repeatedly to lose lives
    for (let i = 0; i < 4; i++) {
      await arcadePage.keyboard.press('Space');
      // Move paddle away
      await arcadePage.keyboard.down('ArrowLeft');
      await arcadePage.waitForTimeout(1500);
      await arcadePage.keyboard.up('ArrowLeft');
      await arcadePage.waitForTimeout(3000);
    }

    // Wait extra time for game over
    await arcadePage.waitForTimeout(5000);

    await takeScreenshot(arcadePage, 'code-breaker-gameover');
  });
});
