import { test, expect, takeScreenshot } from '../fixtures/arcade.fixture';

test.describe('Landing Page Visual Tests', () => {
  test('capture full landing page', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(2000);
    await takeScreenshot(arcadePage, 'landing-page', { fullPage: true });
    await expect(arcadePage).toHaveTitle(/Matrix|Arcade/i);
  });

  test('capture landing page header with title', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(1000);
    const header = arcadePage.locator('header').first();
    if (await header.isVisible().catch(() => false)) {
      await header.screenshot({ path: 'e2e/screenshots/landing-header.png' });
    } else {
      await takeScreenshot(arcadePage, 'landing-header');
    }
  });

  test('capture welcome section', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(1000);
    const welcome = arcadePage.locator('h2:has-text("Welcome")').first();
    if (await welcome.isVisible().catch(() => false)) {
      await welcome.screenshot({ path: 'e2e/screenshots/landing-welcome.png' });
    } else {
      await takeScreenshot(arcadePage, 'landing-welcome');
    }
  });

  test('capture global controls section', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(1000);
    const controls = arcadePage.locator('h3:has-text("Global Controls")').locator('..').locator('..');
    if (await controls.isVisible().catch(() => false)) {
      await controls.screenshot({ path: 'e2e/screenshots/landing-global-controls.png' });
    } else {
      await takeScreenshot(arcadePage, 'landing-global-controls');
    }
  });

  test('capture game grid with all cards', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(1000);

    // Verify all 11 game cards are present
    const gameCards = arcadePage.locator('[role="button"][aria-label*="Play"]');
    const count = await gameCards.count();
    console.log(`Found ${count} game cards in grid`);
    expect(count).toBe(11);

    // Screenshot the full grid
    await takeScreenshot(arcadePage, 'landing-game-grid', { fullPage: true });
  });

  test('capture individual game cards', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(1000);

    const gameCards = arcadePage.locator('[role="button"][aria-label*="Play"]');
    const count = await gameCards.count();

    for (let i = 0; i < count; i++) {
      const card = gameCards.nth(i);
      await card.scrollIntoViewIfNeeded();
      await card.waitFor({ state: 'visible' });
      const label = await card.getAttribute('aria-label') || `game-${i}`;
      const name = label.replace('Play ', '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || `game-${i}`;

      // Use boundingBox to ensure the full card is captured, not just a sliver
      const box = await card.boundingBox();
      if (box && box.width > 10 && box.height > 10) {
        await card.screenshot({ path: `e2e/screenshots/card-${name}.png` });
      }
    }
  });

  test('capture game card hover state', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(1000);

    const firstCard = arcadePage.locator('[role="button"][aria-label*="Play"]').first();
    await firstCard.hover();
    await arcadePage.waitForTimeout(400); // Wait for hover transition

    await firstCard.screenshot({ path: 'e2e/screenshots/card-hover-state.png' });
  });

  test('game card click navigates to portal', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(1000);

    // Click the Snake Classic card
    const snakeCard = arcadePage.locator('[role="button"][aria-label="Play Snake Classic"]');
    await expect(snakeCard).toBeVisible();
    await snakeCard.click();
    await arcadePage.waitForTimeout(800);

    // Verify we're in the portal view - carousel controls should be visible
    const prevButton = arcadePage.locator('[data-testid="carousel-prev"]');
    const nextButton = arcadePage.locator('[data-testid="carousel-next"]');
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();

    // Verify the selected game title is shown
    const gameTitle = arcadePage.locator('h2:has-text("Snake Classic")');
    await expect(gameTitle).toBeVisible();

    await takeScreenshot(arcadePage, 'portal-from-landing');
  });

  test('capture landing page footer', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(500);

    // Scroll to footer
    await arcadePage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await arcadePage.waitForTimeout(500);

    const footer = arcadePage.locator('footer').first();
    if (await footer.isVisible().catch(() => false)) {
      await footer.screenshot({ path: 'e2e/screenshots/landing-footer.png' });
    } else {
      await takeScreenshot(arcadePage, 'landing-footer');
    }
  });

  test('capture landing page at scroll positions', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(1000);

    // Top of page
    await takeScreenshot(arcadePage, 'landing-top');

    // Scroll to middle — find the scrollable container (overflow-y-auto div or main content)
    await arcadePage.evaluate(() => {
      const scrollable = document.querySelector('[class*="overflow-y"]') || document.querySelector('main') || document.documentElement;
      scrollable.scrollTop = scrollable.scrollHeight / 2;
    });
    await arcadePage.waitForTimeout(500);
    await takeScreenshot(arcadePage, 'landing-middle');

    // Scroll to bottom
    await arcadePage.evaluate(() => {
      const scrollable = document.querySelector('[class*="overflow-y"]') || document.querySelector('main') || document.documentElement;
      scrollable.scrollTop = scrollable.scrollHeight;
    });
    await arcadePage.waitForTimeout(500);
    await takeScreenshot(arcadePage, 'landing-bottom');
  });

  test('verify keyboard accessibility on game cards', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(1000);

    // Tab to the first game card
    const firstCard = arcadePage.locator('[role="button"][aria-label*="Play"]').first();
    await firstCard.focus();
    await arcadePage.waitForTimeout(300);

    // Verify the card has focus styling and correct attributes
    await expect(firstCard).toBeFocused();
    await expect(firstCard).toHaveAttribute('tabindex', '0');

    // Capture focused state
    await firstCard.screenshot({ path: 'e2e/screenshots/card-focused.png' });
  });

  test('back to arcade button returns to landing page', async ({ arcadePage }) => {
    await arcadePage.waitForTimeout(1000);

    // Click a game card to go to portal
    const firstCard = arcadePage.locator('[role="button"][aria-label*="Play"]').first();
    await firstCard.click();
    await arcadePage.waitForTimeout(800);

    // Find and click the Arcade button to return
    const arcadeButton = arcadePage.locator('button:has-text("Arcade")').first();
    if (await arcadeButton.isVisible().catch(() => false)) {
      await arcadeButton.click();
      await arcadePage.waitForTimeout(800);

      // Verify landing page grid is visible again
      const gameCards = arcadePage.locator('[role="button"][aria-label*="Play"]');
      const count = await gameCards.count();
      expect(count).toBe(11);

      await takeScreenshot(arcadePage, 'landing-returned');
    }
  });
});
