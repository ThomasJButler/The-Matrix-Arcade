import { test, expect } from '../fixtures/arcade.fixture';

/**
 * CTRL-S World (Phaser) — visual regression baselines.
 * Captures MenuScene, ChapterHubScene, NarrativeScene (prologue start),
 * and a mid-story checkpoint for pixel-stable comparison.
 *
 * Test mode (?test=1&seed=42) disables animated rain for determinism.
 */
test.describe('CTRL-S Phaser — visual baselines', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=1&seed=42');
    await page.waitForSelector('body[data-landing-ready="true"]', { timeout: 15_000 });

    const card = page.locator('[role="button"][aria-label="Play CTRL-S | The World"]');
    await card.click();
    await page.waitForFunction(
      () => document.body.dataset.portalReady === 'true' && document.body.dataset.portalGameId === 'ctrl-s-world',
      undefined,
      { timeout: 15_000 },
    );

    const wheel = page.locator('[role="toolbar"][aria-label^="Game navigation wheel"]');
    await wheel.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => document.body.dataset.portalIsPlaying === 'true',
      undefined,
      { timeout: 10_000 },
    );
  });

  test('MenuScene — ASCII title + start button', async ({ page }) => {
    test.setTimeout(30_000);
    await page.waitForTimeout(2_500);
    await expect(page).toHaveScreenshot('ctrl-s-phaser-menu.png');
  });

  test('ChapterHubScene — mission select grid', async ({ page }) => {
    test.setTimeout(30_000);
    await page.waitForTimeout(1_500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2_000);
    await expect(page).toHaveScreenshot('ctrl-s-phaser-hub.png');
  });

  test('NarrativeScene — prologue opening', async ({ page }) => {
    test.setTimeout(45_000);
    await page.waitForTimeout(1_500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1_500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3_000);
    await expect(page).toHaveScreenshot('ctrl-s-phaser-prologue-start.png');
  });

  test('NarrativeScene — mid-story after advances', async ({ page }) => {
    test.setTimeout(45_000);
    await page.waitForTimeout(1_500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1_500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3_000);

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(1_200);
    }
    await expect(page).toHaveScreenshot('ctrl-s-phaser-mid-story.png');
  });
});
