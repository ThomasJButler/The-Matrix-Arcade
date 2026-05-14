import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Matrix Frogger', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(60_000);
    await runPlaythrough(page, {
      gameId: 'matrix-frogger',
      hooks: {
        firstAction: async (p) => { await p.keyboard.press('ArrowUp'); await p.waitForTimeout(250); },
        scoreLoop: async (p) => {
          await p.keyboard.press('ArrowUp'); await p.waitForTimeout(300);
        },
        triggerGameOver: async (p) => {
          // Walk into the road and stand still.
          for (let i = 0; i < 4; i++) {
            await p.keyboard.press('ArrowUp');
            await p.waitForTimeout(300);
          }
          await p.waitForTimeout(8_000);
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'matrix-frogger');
  });
});
