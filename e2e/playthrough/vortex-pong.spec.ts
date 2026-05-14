import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Vortex Pong', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(60_000);
    await runPlaythrough(page, {
      gameId: 'vortex-pong',
      hooks: {
        firstAction: async (p) => { await p.keyboard.down('ArrowUp'); await p.waitForTimeout(300); await p.keyboard.up('ArrowUp'); },
        scoreLoop: async (p) => {
          await p.keyboard.down('ArrowDown'); await p.waitForTimeout(250); await p.keyboard.up('ArrowDown');
          await p.keyboard.down('ArrowUp'); await p.waitForTimeout(250); await p.keyboard.up('ArrowUp');
        },
        triggerGameOver: async (p) => {
          // Sit still and let the AI score. Pong's game-over takes a while; nudge with ESC after grace.
          await p.waitForTimeout(15_000);
          await p.keyboard.press('Escape');
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'vortex-pong');
  });
});
