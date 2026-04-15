import { test, expect, navigateToGame } from '../../fixtures/arcade.fixture';

test.describe('Portal view', () => {
  test('snake portal preview is stable', async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'snake-classic');
    await expect(arcadePage).toHaveScreenshot('portal-snake.png');
  });

  test('clickwheel navigates to next game', async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'snake-classic');
    // Clickwheel zones use clip-path which Playwright's hit-testing can't resolve,
    // so navigate via keyboard (ArrowRight triggers onNext on the toolbar)
    const wheel = arcadePage.locator('[role="toolbar"][aria-label="Game navigation wheel"]');
    await wheel.focus();
    await arcadePage.keyboard.press('ArrowRight');
    await expect.poll(() => arcadePage.evaluate(() => document.body.dataset.portalGameId)).not.toBe('snake-classic');
    await expect(arcadePage).toHaveScreenshot('portal-after-next.png');
  });
});
