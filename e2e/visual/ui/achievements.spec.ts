import { test, expect } from '../../fixtures/arcade.fixture';

test.describe('Achievements', () => {
  test('achievements panel opens via A key on landing', async ({ arcadePage }) => {
    await arcadePage.keyboard.press('a');
    const panel = arcadePage.locator(':text("Achievements"), [role="dialog"]').first();
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(arcadePage).toHaveScreenshot('achievements-open.png');
  });
});
