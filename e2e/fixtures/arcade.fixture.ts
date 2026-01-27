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
  // Legacy React/Canvas games (still in carousel)
  'snake': ['snake classic'],
  'pong': ['vortex pong'],
  'cloud': ['matrix cloud'],
  'metris': ['metris'],
  'invaders': ['matrix invaders'],
  'ctrl-s': ['ctrl-s | the world'],  // Full title with pipe to match App.tsx exactly
  'terminal-quest': ['terminal quest'],
  // Phaser games - exact titles from App.tsx
  'matrix-frogger': ['matrix frogger'],
  'neo-jump': ['neo jump'],
  'agent-chase': ['agent chase'],
  'rhythm-hacker': ['rhythm hacker'],
  'cloud-jumper': ['cloud jumper'],
  // Legacy game name aliases - redirect to Phaser games
  'crossy-road': ['matrix frogger'],
  'matrix-ascension': ['neo jump'],
  'agent-escape': ['agent chase'],
  'jimmy-matrix': ['rhythm hacker'],
};

/**
 * Helper to check if the current carousel card matches the target game.
 * Looks for the game title in prominent heading elements.
 */
async function isTargetGameVisible(page: Page, gameName: string): Promise<boolean> {
  const patterns = GAME_NAME_PATTERNS[gameName.toLowerCase()] || [gameName.toLowerCase()];

  // Primary strategy: look for h2 headings which contain game titles
  // The carousel shows game titles in h2 elements
  const headings = page.locator('h2');
  const headingCount = await headings.count();

  for (let i = 0; i < headingCount; i++) {
    const text = await headings.nth(i).textContent().catch(() => '');
    if (text) {
      const normalizedText = text.toLowerCase().trim();
      for (const pattern of patterns) {
        // EXACT MATCH ONLY - no partial matching to prevent false positives
        if (normalizedText === pattern.toLowerCase()) {
          // Verify this heading is visible (part of current carousel view)
          const isVisible = await headings.nth(i).isVisible().catch(() => false);
          if (isVisible) {
            return true;
          }
        }
      }
    }
  }

  // Fallback: check main content area for prominent text
  const mainContent = await page.locator('main').textContent().catch(() => '');
  if (mainContent) {
    const normalizedContent = mainContent.toLowerCase();
    for (const pattern of patterns) {
      if (normalizedContent.includes(pattern.toLowerCase())) {
        // Check if there's a visible PLAY button indicating this is the active card
        const playButton = page.locator('button:has-text("PLAY")').first();
        if (await playButton.isVisible().catch(() => false)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Helper to navigate to a specific game using the carousel.
 */
export async function navigateToGame(page: Page, gameName: string): Promise<void> {
  const maxAttempts = 10; // Maximum carousel clicks to find the game

  // First check if the target game is already visible
  if (await isTargetGameVisible(page, gameName)) {
    console.log(`Game "${gameName}" is already visible`);
    return;
  }

  // Find the carousel navigation arrows using data-testid attributes
  const rightArrow = page.locator('[data-testid="carousel-next"]').first();
  const leftArrow = page.locator('[data-testid="carousel-prev"]').first();

  // Try clicking right arrow to find the game
  for (let i = 0; i < maxAttempts; i++) {
    // Check if we found the game
    if (await isTargetGameVisible(page, gameName)) {
      console.log(`Found game "${gameName}" after ${i} clicks`);
      return;
    }

    // Try to click the right arrow
    if (await rightArrow.isVisible().catch(() => false)) {
      await rightArrow.click();
      await page.waitForTimeout(400); // Wait for carousel animation
    } else if (await leftArrow.isVisible().catch(() => false)) {
      await leftArrow.click();
      await page.waitForTimeout(400);
    } else {
      // No arrows found, try keyboard navigation
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400);
    }
  }

  // If we still haven't found it, try the other direction
  for (let i = 0; i < maxAttempts; i++) {
    if (await isTargetGameVisible(page, gameName)) {
      console.log(`Found game "${gameName}" going left after ${i} clicks`);
      return;
    }

    if (await leftArrow.isVisible().catch(() => false)) {
      await leftArrow.click();
      await page.waitForTimeout(400);
    } else {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(400);
    }
  }

  // Last resort: just capture whatever is on screen
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
