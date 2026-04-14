import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Matrix Invaders', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(90_000);
    await runPlaythrough(page, {
      gameId: 'matrix-invaders',
      hooks: {
        firstAction: async (p) => { await p.keyboard.press('Space'); await p.waitForTimeout(200); },
        scoreLoop: async (p) => {
          await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(150);
          await p.keyboard.press('Space'); await p.waitForTimeout(150);
          await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
          await p.keyboard.press('Space'); await p.waitForTimeout(150);
        },
        triggerGameOver: async (p) => {
          // Sit still under the alien horde — they reach the bottom.
          await p.waitForTimeout(15_000);
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'matrix-invaders');
  });
});
