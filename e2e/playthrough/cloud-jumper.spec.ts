import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Cloud Jumper', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(60_000);
    await runPlaythrough(page, {
      gameId: 'cloud-jumper',
      hooks: {
        firstAction: async (p) => { await p.keyboard.press('Space'); await p.waitForTimeout(300); },
        scoreLoop: async (p) => {
          await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
          await p.keyboard.press('Space'); await p.waitForTimeout(300);
        },
        triggerGameOver: async (p) => {
          // Walk off the starting cloud and let the player fall.
          for (let i = 0; i < 40; i++) {
            await p.keyboard.press('ArrowLeft');
            await p.waitForTimeout(80);
          }
          await p.waitForTimeout(4_000);
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'cloud-jumper');
  });
});
