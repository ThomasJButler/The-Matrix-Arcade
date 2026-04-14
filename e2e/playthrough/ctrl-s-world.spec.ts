import { test, expect, navigateToGame, startGame, exitGame } from '../fixtures/arcade.fixture';
import { getCtrlSWorldState } from '../fixtures/test-utils';

/**
 * CTRL-S | The World — DOM-based text adventure (no Phaser scenes).
 * Walk through the opening screen, command-prompt entry, the chapter hub, and
 * a couple of paragraphs of story.
 */
test.describe('CTRL-S | The World', () => {
  test('full human playthrough', async ({ gameplayPage: page }) => {
    test.setTimeout(60_000);

    await navigateToGame(page, 'ctrl-s-world');
    await expect(page).toHaveScreenshot('ctrl-s-world-01-portal.png');

    await startGame(page);
    // autoStart=false — CtrlSWorld shows the command prompt first.
    await expect.poll(async () => (await getCtrlSWorldState(page))?.phase, { timeout: 15_000 }).toBe('command_prompt');
    await page.keyboard.type('save-the-world');
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await getCtrlSWorldState(page))?.phase, { timeout: 15_000 }).toBe('chapter_hub');
    await expect(page).toHaveScreenshot('ctrl-s-world-02-chapter-hub.png');

    // Click the first chapter card to begin reading.
    const chapterCard = page.locator('button, [role="button"]').filter({ hasText: /Chapter|Prologue|Begin|Start/i }).first();
    if (await chapterCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chapterCard.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await expect
      .poll(async () => (await getCtrlSWorldState(page))?.phase, { timeout: 15_000 })
      .toMatch(/playing|chapter_hub/);
    await page.waitForTimeout(2_500);
    await expect(page).toHaveScreenshot('ctrl-s-world-03-mid-story.png');

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(800);
    }
    await expect(page).toHaveScreenshot('ctrl-s-world-04-after-pages.png');

    await exitGame(page);
  });
});
