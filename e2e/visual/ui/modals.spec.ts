import { test, expect, navigateToGame } from '../../fixtures/arcade.fixture';

test.describe('Modals', () => {
  test('save data manager toggles', async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'snake-classic');
    const saveBtn = arcadePage.locator('button[aria-label="Save Data Manager"]');
    await saveBtn.click();
    // SaveLoadManager renders inline; rather than asserting role=dialog (which
    // it doesn't use) we capture a full-page screenshot of the toggled state.
    await arcadePage.waitForTimeout(400);
    await expect(arcadePage).toHaveScreenshot('modal-save-manager.png');
  });

  test('high scores panel opens via H key', async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'snake-classic');
    await arcadePage.keyboard.press('h');
    const panel = arcadePage.locator(':text("High Score")').first();
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(arcadePage).toHaveScreenshot('modal-high-scores.png');
  });

  test('instructions panel opens via I key', async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'snake-classic');
    await arcadePage.keyboard.press('i');
    const panel = arcadePage.locator(':text("Instructions"), :text("Controls")').first();
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(arcadePage).toHaveScreenshot('modal-instructions.png');
  });
});
