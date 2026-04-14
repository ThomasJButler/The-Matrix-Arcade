import { test, expect, navigateToGame } from '../../fixtures/arcade.fixture';

test.describe('Portal view', () => {
  test('snake portal preview is stable', async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'snake-classic');
    await expect(arcadePage).toHaveScreenshot('portal-snake.png');
  });

  test('next / prev arrows cycle games', async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'snake-classic');
    const next = arcadePage.locator('[data-testid="carousel-next"]');
    await next.click();
    await expect.poll(() => arcadePage.evaluate(() => document.body.dataset.portalGameId)).not.toBe('snake-classic');
    await expect(arcadePage).toHaveScreenshot('portal-after-next.png');
  });
});
