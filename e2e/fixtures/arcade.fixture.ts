import { test as base, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Screenshot output directory
const SCREENSHOT_DIR = path.join(process.cwd(), 'e2e', 'screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Custom test fixture for Matrix Arcade visual testing.
 */
export const test = base.extend<{
  arcadePage: Page;
  screenshotDir: string;
}>({
  // Arcade page with common setup
  arcadePage: async ({ page }, use) => {
    // Navigate to the arcade
    await page.goto('/');

    // Wait for the app to load (Matrix rain should be visible)
    await page.waitForSelector('[data-testid="matrix-rain"], .matrix-rain, canvas', {
      timeout: 10000,
    }).catch(() => {
      // Matrix rain might not have a test id, just wait for page load
    });

    // Wait for any initial animations to settle
    await page.waitForTimeout(1000);

    await use(page);
  },

  // Screenshot directory path provided to tests that need direct file path access
  screenshotDir: async ({ }, use) => {
    await use(SCREENSHOT_DIR);
  },
});

export { expect };

/**
 * Helper to take a named screenshot and save it to the screenshots directory.
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options?: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  }
): Promise<string> {
  const filename = `${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  await page.screenshot({
    path: filepath,
    fullPage: options?.fullPage ?? false,
    clip: options?.clip,
  });

  console.log(`Screenshot saved: ${filepath}`);
  return filepath;
}

/**
 * Game name mappings - short names to patterns that match the carousel titles.
 * Note: Game titles are case-insensitive matched.
 */
const GAME_NAME_PATTERNS: Record<string, string[]> = {
  'snake': ['snake classic'],
  'pong': ['vortex pong'],
  'cloud': ['matrix cloud'],
  'metris': ['metris'],
  'invaders': ['matrix invaders'],
  'ctrl-s': ['ctrl-s | the world'],
  'matrix-frogger': ['matrix frogger'],
  'neo-jump': ['neo jump'],
  'agent-chase': ['agent chase'],
  'rhythm-hacker': ['rhythm hacker'],
  'cloud-jumper': ['cloud jumper'],
};

/**
 * Helper to check if the target game is the currently selected game in the portal view.
 * Looks for the game title in the portal's h2 heading (single visible game).
 */
async function isGameSelectedInPortal(page: Page, gameName: string): Promise<boolean> {
  const patterns = GAME_NAME_PATTERNS[gameName.toLowerCase()] || [gameName.toLowerCase()];

  // In the portal view, only one h2 is prominent — the selected game's title
  const portalHeading = page.locator('.game-controls-enhanced h2, .flex-1.text-center h2').first();
  const text = await portalHeading.textContent().catch(() => '');
  if (text) {
    const normalizedText = text.toLowerCase().trim();
    for (const pattern of patterns) {
      if (normalizedText === pattern.toLowerCase()) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Helper to navigate to a specific game.
 *
 * Strategy:
 * 1. If the landing page grid is visible, click the matching game card directly
 * 2. If already in the portal view, use carousel arrows to find the game
 */
export async function navigateToGame(page: Page, gameName: string): Promise<void> {
  const patterns = GAME_NAME_PATTERNS[gameName.toLowerCase()] || [gameName.toLowerCase()];

  // Strategy 1: Landing page grid — click the game card directly
  // Game cards have role="button" and aria-label="Play {title}"
  for (const pattern of patterns) {
    const cardByAria = page.locator(`[role="button"][aria-label*="${pattern}" i]`).first();
    if (await cardByAria.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cardByAria.click();
      await page.waitForTimeout(800); // Wait for landing page to close & portal to appear
      console.log(`Clicked game card "${pattern}" on landing page grid`);
      return;
    }
  }

  // Strategy 2: Try clicking a card by matching h3/h2 text within the grid
  const allCards = page.locator('[role="button"]');
  const cardCount = await allCards.count();
  for (let i = 0; i < cardCount; i++) {
    const card = allCards.nth(i);
    const cardText = await card.textContent().catch(() => '');
    if (cardText) {
      const normalizedText = cardText.toLowerCase();
      for (const pattern of patterns) {
        if (normalizedText.includes(pattern.toLowerCase())) {
          if (await card.isVisible().catch(() => false)) {
            await card.scrollIntoViewIfNeeded().catch(() => {});
            await card.click();
            await page.waitForTimeout(800);
            console.log(`Clicked game card containing "${pattern}" text`);
            return;
          }
        }
      }
    }
  }

  // Strategy 3: Already in portal view — use carousel arrows
  if (await isGameSelectedInPortal(page, gameName)) {
    console.log(`Game "${gameName}" is already selected in portal`);
    return;
  }

  const rightArrow = page.locator('[data-testid="carousel-next"]').first();
  const leftArrow = page.locator('[data-testid="carousel-prev"]').first();
  const maxAttempts = 12;

  for (let i = 0; i < maxAttempts; i++) {
    if (await isGameSelectedInPortal(page, gameName)) {
      console.log(`Found game "${gameName}" after ${i} carousel clicks`);
      return;
    }

    if (await rightArrow.isVisible().catch(() => false)) {
      await rightArrow.click();
      await page.waitForTimeout(400);
    } else {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400);
    }
  }

  console.warn(`Could not navigate to game "${gameName}", capturing current state`);
}

/**
 * Helper to start a game (press Enter or click start button).
 */
export async function startGame(page: Page): Promise<void> {
  // Try clicking a start button first
  const startSelectors = [
    'button:has-text("Start")',
    'button:has-text("Play")',
    'button:has-text("Begin")',
    '[data-testid="start-button"]',
  ];

  for (const selector of startSelectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      await page.waitForTimeout(500);
      return;
    }
  }

  // Fallback: press Enter
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

/**
 * Helper to pause a game.
 */
export async function pauseGame(page: Page): Promise<void> {
  await page.keyboard.press('p');
  await page.waitForTimeout(300);
}

/**
 * Helper to exit a game (press Escape).
 */
export async function exitGame(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

/**
 * Helper to wait for game to be in a specific state.
 */
export async function waitForGameState(
  page: Page,
  state: 'playing' | 'paused' | 'gameover' | 'menu',
  timeout = 5000
): Promise<void> {
  const stateSelectors: Record<string, string[]> = {
    playing: ['canvas', '[data-state="playing"]', '.game-active'],
    paused: ['[data-state="paused"]', '.paused', ':text("PAUSED")'],
    gameover: [':text("GAME OVER")', ':text("Game Over")', '[data-state="gameover"]'],
    menu: ['.game-menu', '[data-state="menu"]', '.start-screen'],
  };

  const selectors = stateSelectors[state] || [];

  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: timeout / selectors.length });
      return;
    } catch {
      // Try next selector
    }
  }
}

/**
 * Helper to simulate gameplay for a brief period.
 */
export async function simulateGameplay(page: Page, durationMs = 2000): Promise<void> {
  const endTime = Date.now() + durationMs;

  while (Date.now() < endTime) {
    // Random arrow key press
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    await page.keyboard.press(randomKey);
    await page.waitForTimeout(100 + Math.random() * 200);
  }
}
