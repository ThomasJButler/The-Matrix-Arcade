import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Neo Jump', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(60_000);
    await runPlaythrough(page, {
      gameId: 'neo-jump',
      hooks: {
        firstAction: async (p) => { await p.keyboard.press('Space'); await p.waitForTimeout(300); },
        scoreLoop: async (p) => {
          await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
          await p.keyboard.press('Space'); await p.waitForTimeout(300);
        },
        triggerGameOver: async (p) => {
          // Walk left off the world edge.
          for (let i = 0; i < 30; i++) {
            await p.keyboard.press('ArrowLeft');
            await p.waitForTimeout(120);
          }
          await p.waitForTimeout(4_000);
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'neo-jump');
  });
});
