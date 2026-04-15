import { test, expect } from '../fixtures/arcade.fixture';
import { getPhaserState } from '../fixtures/test-utils';

/**
 * CTRL-S World (Phaser) — E2E smoke test for the Phaser rewrite.
 * Navigates: landing → portal → menu → chapter hub → prologue paragraph.
 * Coexists with the React version's test until R80.25 cut-over.
 */
test.describe('CTRL-S World (Phaser)', () => {
  test('smoke: menu → hub → prologue first paragraphs', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto('/?test=1&seed=42');
    await page.waitForSelector('body[data-landing-ready="true"]', { timeout: 15_000 });

    const card = page.locator('[role="button"][aria-label="Play CTRL-S | The World"]');
    await card.click();
    await page.waitForFunction(
      () => document.body.dataset.portalReady === 'true' && document.body.dataset.portalGameId === 'ctrl-s-world',
      undefined,
      { timeout: 15_000 },
    );
    await expect(page).toHaveScreenshot('ctrl-s-phaser-01-portal.png');

    const playButton = page.locator('button[aria-label*="Start" i], button:has-text("PLAY")').first();
    if (await playButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await playButton.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await page.waitForFunction(
      () => document.body.dataset.portalIsPlaying === 'true',
      undefined,
      { timeout: 10_000 },
    );

    await page.waitForTimeout(2_000);
    await expect(page).toHaveScreenshot('ctrl-s-phaser-02-menu.png');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(1_500);

    const hubState = await getPhaserState(page);
    expect(hubState).toBeTruthy();
    await expect(page).toHaveScreenshot('ctrl-s-phaser-03-chapter-hub.png');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(3_000);

    const narrativeState = await getPhaserState(page);
    expect(narrativeState).toBeTruthy();
    await expect(page).toHaveScreenshot('ctrl-s-phaser-04-prologue.png');

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(1_000);
    }
    await expect(page).toHaveScreenshot('ctrl-s-phaser-05-after-advances.png');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});
