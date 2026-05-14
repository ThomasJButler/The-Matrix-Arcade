import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Metris', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(60_000);
    await runPlaythrough(page, {
      gameId: 'metris',
      hooks: {
        firstAction: async (p) => { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200); },
        scoreLoop: async (p) => {
          await p.keyboard.press('Space'); // hard drop
          await p.waitForTimeout(300);
        },
        triggerGameOver: async (p) => {
          // Repeated hard-drops with no horizontal movement stack pieces straight up.
          for (let i = 0; i < 30; i++) {
            await p.keyboard.press('Space');
            await p.waitForTimeout(150);
          }
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'metris');
  });
});
