import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Agent Chase', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(75_000);
    await runPlaythrough(page, {
      gameId: 'agent-chase',
      hooks: {
        firstAction: async (p) => { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); },
        scoreLoop: async (p) => {
          // Eat dots around the start cell.
          await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
          await p.keyboard.press('ArrowDown'); await p.waitForTimeout(250);
          await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(250);
          await p.keyboard.press('ArrowUp'); await p.waitForTimeout(250);
        },
        triggerGameOver: async (p) => {
          // Stand still: ghosts will eventually catch up across all lives.
          await p.waitForTimeout(20_000);
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'agent-chase');
  });
});
