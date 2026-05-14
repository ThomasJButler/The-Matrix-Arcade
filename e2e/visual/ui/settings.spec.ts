import { test, expect, navigateToGame } from '../../fixtures/arcade.fixture';

test.describe('Settings + audio chrome', () => {
  test('audio settings dialog opens', async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'snake-classic');
    const settingsBtn = arcadePage.locator('button[aria-label*="Audio" i], button[aria-label*="Settings" i]').first();
    if (await settingsBtn.isVisible().catch(() => false)) {
      await settingsBtn.click();
      await expect(arcadePage).toHaveScreenshot('audio-settings-open.png');
    }
  });

  test('mute toggle (V key) flips icon', async ({ arcadePage }) => {
    await navigateToGame(arcadePage, 'snake-classic');
    await expect(arcadePage).toHaveScreenshot('audio-unmuted.png');
    await arcadePage.keyboard.press('v');
    await arcadePage.waitForTimeout(200);
    await expect(arcadePage).toHaveScreenshot('audio-muted.png');
  });
});
