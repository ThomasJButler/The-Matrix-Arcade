import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Snake Classic', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(60_000);
    await runPlaythrough(page, {
      gameId: 'snake-classic',
      hooks: {
        firstAction: async (p) => { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200); },
        scoreLoop: async (p) => {
          await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200);
          await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
        },
        triggerGameOver: async (p) => {
          // March straight into the right wall.
          for (let i = 0; i < 40; i++) {
            await p.keyboard.press('ArrowRight');
            await p.waitForTimeout(80);
          }
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'snake-classic');
  });
});
