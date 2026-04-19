import { test, expect } from '../fixtures/arcade.fixture';

/**
 * Landing page (game grid) visual + structural baselines.
 * Test mode disables the animated rain so screenshots are pixel-stable.
 */
test.describe('Landing page', () => {
  test('header + hero + grid render correctly', async ({ arcadePage }) => {
    // All 12 game cards are present and clickable.
    const cards = arcadePage.locator('[role="button"][aria-label^="Play "]');
    await expect(cards).toHaveCount(12);
    await expect(arcadePage).toHaveTitle(/Matrix|Arcade/i);
    await expect(arcadePage).toHaveScreenshot('landing-full.png', { fullPage: true });
  });

  test('header chrome', async ({ arcadePage }) => {
    const header = arcadePage.locator('header').first();
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('landing-header.png');
  });

  test('keyboard controls panel toggles open', async ({ arcadePage }) => {
    const toggle = arcadePage.locator('button[aria-label="Keyboard controls"]');
    await toggle.click();
    const panel = arcadePage.locator('#keyboard-controls-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveScreenshot('landing-controls-panel.png');
  });

  test('category filter pills', async ({ arcadePage }) => {
    const arcade = arcadePage.locator('button[aria-pressed]:has-text("Arcade")');
    await arcade.click();
    await expect(arcade).toHaveAttribute('aria-pressed', 'true');
    // Filtering should reduce visible cards.
    const cards = arcadePage.locator('[role="button"][aria-label^="Play "]');
    await expect(cards.first()).toBeVisible();
    await expect(arcadePage.locator('section').nth(1)).toHaveScreenshot('landing-arcade-filter.png');
  });

  test('first card focused state', async ({ arcadePage }) => {
    const card = arcadePage.locator('[role="button"][aria-label^="Play "]').first();
    await card.focus();
    await expect(card).toBeFocused();
    // Let the focus ring paint settle to avoid sub-pixel jitter between runs
    await arcadePage.waitForTimeout(150);
    await expect(card).toHaveScreenshot('landing-card-focused.png');
  });

  test('clicking card opens portal view', async ({ arcadePage }) => {
    await arcadePage.locator('[role="button"][aria-label="Play Matrix Snake"]').click();
    await expect.poll(() => arcadePage.evaluate(() => document.body.dataset.portalReady)).toBe('true');
    await expect(arcadePage.locator('[role="toolbar"][aria-label^="Game navigation wheel"]')).toBeVisible();
    await expect(arcadePage).toHaveScreenshot('portal-from-landing.png');
  });
});
