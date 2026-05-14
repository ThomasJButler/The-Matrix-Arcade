import { test, expect } from '../fixtures/arcade.fixture';

/**
 * Responsive visual baselines for the mobile/tablet "DESKTOP REQUIRED" gate.
 * These specs run under the `mobile` (375×667) and `tablet` (768×1024) Playwright
 * projects — the app blocks gameplay on those viewports and shows MobileWarning.
 */
test.describe('Mobile gate', () => {
  test('desktop-required warning renders', async ({ arcadePage }) => {
    const warning = arcadePage.locator('text=DESKTOP REQUIRED');
    await expect(warning).toBeVisible({ timeout: 5000 });
    await expect(arcadePage).toHaveScreenshot('mobile-gate-full.png', { fullPage: true });
  });

  test('warning card layout and content', async ({ arcadePage }) => {
    const card = arcadePage.locator('.bg-gray-900.border-green-500').first();
    await expect(card).toBeVisible({ timeout: 5000 });
    await expect(card).toContainText('keyboard controls');
    await expect(card).toContainText('desktop browser');
    await expect(card).toHaveScreenshot('mobile-gate-card.png');
  });
});
