import { test } from '../fixtures/arcade.fixture';
import { runPlaythrough, runExitToPortal } from '../fixtures/playthrough';

test.describe('Rhythm Hacker', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(90_000);
    await runPlaythrough(page, {
      gameId: 'rhythm-hacker',
      hooks: {
        // Track-select screen → Enter to confirm → 5s countdown.
        beginPlay: async (p) => { await p.keyboard.press('Enter'); await p.waitForTimeout(500); await p.keyboard.press('Enter'); await p.waitForTimeout(5500); },
        firstAction: async (p) => { await p.keyboard.press('q'); await p.waitForTimeout(150); },
        scoreLoop: async (p) => {
          for (const k of ['q', 'w', 'o', 'p']) {
            await p.keyboard.press(k);
            await p.waitForTimeout(180);
          }
        },
        triggerGameOver: async (p) => {
          // Miss every note → health depletes.
          await p.waitForTimeout(30_000);
        },
      },
    });
  });

  test('exits to portal cleanly', async ({ gameplayPage: page }) => {
    await runExitToPortal(page, 'rhythm-hacker');
  });
});
