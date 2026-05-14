import { test, expect, navigateToGame } from '../fixtures/arcade.fixture';

test.describe('Scoreboard modal', () => {
  test('opens via Trophy button on landing and shows 11 game tabs', async ({ arcadePage: page }) => {
    // Landing page renders its own High Scores button (last in DOM, on top of portal's).
    const trophyBtn = page.getByRole('button', { name: /high scores/i }).last();
    await expect(trophyBtn).toBeVisible({ timeout: 5000 });
    await trophyBtn.click();

    const heading = page.getByRole('heading', { name: /high scores/i });
    await expect(heading).toBeVisible({ timeout: 3000 });

    const tabs = page.locator('[role="tab"], button').filter({ hasText: /Snake|Pong|Bird|Invaders|Metris|Frogger|Neo Jump|Agent|Rhythm|Cloud|Code/i });
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(11);
  });

  test('ESC closes scoreboard', async ({ arcadePage: page }) => {
    const trophyBtn = page.getByRole('button', { name: /high scores/i }).last();
    await trophyBtn.click();

    const heading = page.getByRole('heading', { name: /high scores/i });
    await expect(heading).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(heading).not.toBeVisible({ timeout: 3000 });
  });

  test('displays seeded score data', async ({ arcadePage: page }) => {
    await page.evaluate(() => {
      const saved = localStorage.getItem('matrix-arcade-save-data');
      const data = saved ? JSON.parse(saved) : {};
      data.version = '1.3.0';
      data.scoreboards = data.scoreboards || {};
      data.scoreboards.snakeClassic = [
        { initials: 'ACE', score: 9999, level: 10, durationMs: 120000, date: '2026-01-15T12:00:00Z' },
        { initials: 'BOB', score: 5000, level: 5, durationMs: 60000, date: '2026-01-14T12:00:00Z' },
      ];
      data.lastInitials = 'ACE';
      localStorage.setItem('matrix-arcade-save-data', JSON.stringify(data));
    });

    await page.reload();
    await page.waitForSelector('body[data-landing-ready="true"]', { timeout: 15000 });

    const trophyBtn = page.getByRole('button', { name: /high scores/i }).last();
    await trophyBtn.click();

    const heading = page.getByRole('heading', { name: /high scores/i });
    await expect(heading).toBeVisible({ timeout: 3000 });

    const snakeTab = page.locator('button').filter({ hasText: 'Snake' }).first();
    await snakeTab.click();

    await expect(page.getByRole('cell', { name: 'ACE' })).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('9,999').or(page.getByText('9999'))).toBeVisible();
    await expect(page.getByRole('cell', { name: 'BOB' })).toBeVisible();
  });

  test('opens via Trophy button in portal view', async ({ arcadePage: page }) => {
    await navigateToGame(page, 'snake-classic');

    const trophyBtn = page.getByRole('button', { name: /high scores/i }).first();
    await expect(trophyBtn).toBeVisible({ timeout: 5000 });
    await trophyBtn.click();

    const heading = page.getByRole('heading', { name: /high scores/i });
    await expect(heading).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Attract mode', () => {
  test('fires after idle on landing page', async ({ arcadePage: page }) => {
    await page.evaluate(() => {
      const saved = localStorage.getItem('matrix-arcade-save-data');
      const data = saved ? JSON.parse(saved) : {};
      data.version = '1.3.0';
      data.scoreboards = data.scoreboards || {};
      data.scoreboards.snakeClassic = [
        { initials: 'TST', score: 1234, level: 3, durationMs: 30000, date: '2026-04-01T00:00:00Z' },
      ];
      localStorage.setItem('matrix-arcade-save-data', JSON.stringify(data));
    });
    await page.reload();
    await page.waitForSelector('body[data-landing-ready="true"]', { timeout: 15000 });

    await page.waitForSelector('text=INSERT COIN TO CONTINUE', { timeout: 20000 });

    await page.keyboard.press('Space');
    await expect(page.locator('text=INSERT COIN TO CONTINUE')).not.toBeVisible({ timeout: 3000 });
  });
});
