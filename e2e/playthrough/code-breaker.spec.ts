import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Code Breaker', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(60_000);
    await runPlaythrough(page, {
      gameId: 'code-breaker',
      hooks: {
        firstAction: async (p) => { await p.keyboard.press('Space'); await p.waitForTimeout(300); },
        scoreLoop: async (p) => {
          await p.keyboard.down('ArrowRight'); await p.waitForTimeout(200); await p.keyboard.up('ArrowRight');
          await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(200); await p.keyboard.up('ArrowLeft');
        },
        triggerGameOver: async (p) => {
          // Park the paddle off-side; ball drops past it.
          await p.keyboard.down('ArrowLeft');
          await p.waitForTimeout(2_000);
          await p.keyboard.up('ArrowLeft');
          await p.waitForTimeout(15_000);
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'code-breaker');
  });
});
