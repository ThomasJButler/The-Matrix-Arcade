import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Matrix Cloud', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(75_000);
    await runPlaythrough(page, {
      gameId: 'matrix-cloud',
      hooks: {
        // One Enter to leave the menu; flap repeatedly so the bird stays alive
        // long enough for waitForGameReady('GameScene') to observe the state.
        beginPlay: async (p) => {
          await p.keyboard.press('Enter');
          // Keep flapping during the countdown so we don't die on first frame.
          for (let i = 0; i < 6; i++) {
            await p.waitForTimeout(800);
            await p.keyboard.press('Space');
          }
        },
        firstAction: async (p) => { await p.keyboard.press('Space'); await p.waitForTimeout(200); },
        scoreLoop: async (p) => { await p.keyboard.press('Space'); await p.waitForTimeout(250); },
        triggerGameOver: async (p) => {
          // Stop flapping — gravity drops the bird into the floor.
          await p.waitForTimeout(8_000);
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'matrix-cloud');
  });
});
