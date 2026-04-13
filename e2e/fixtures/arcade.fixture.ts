import { test as base, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Screenshot output directory for ad-hoc captures (kept for debugging — visual
// regression assertions use Playwright's built-in toHaveScreenshot baselines).
const SCREENSHOT_DIR = path.join(process.cwd(), 'e2e', 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Test-mode URL: ?test=1 enables the seam in src/lib/test-mode.ts (seeded RNG +
// noise-free rain). seed=42 is arbitrary but stable.
const TEST_URL = '/?test=1&seed=42';

interface Fixtures {
  arcadePage: Page;
  gameplayPage: Page;
  screenshotDir: string;
}

export const test = base.extend<Fixtures>({
  arcadePage: async ({ page }, use) => {
    await preparePage(page);
    await page.goto(TEST_URL);
    await page.waitForSelector('body[data-landing-ready="true"]', { timeout: 15000 });
    await use(page);
    await assertNoConsoleErrors(page);
  },

  gameplayPage: async ({ page }, use) => {
    await preparePage(page);
    await page.goto(TEST_URL);
    await page.waitForSelector('body[data-landing-ready="true"]', { timeout: 15000 });
    await use(page);
    await assertNoConsoleErrors(page);
  },

  screenshotDir: async ({}, use) => {
    await use(SCREENSHOT_DIR);
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Console / page error capture
// ---------------------------------------------------------------------------
const consoleErrors = new WeakMap<Page, string[]>();

async function preparePage(page: Page): Promise<void> {
  consoleErrors.set(page, []);
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore expected dev-server / hot-reload noise.
      if (/Failed to load resource/.test(text) && /favicon|sw\.js|manifest/.test(text)) return;
      // Phaser's loader prints `Failed to process file` at console.error severity for missing
      // optional sprite assets that the game gracefully falls back from. Pre-existing — not
      // a regression introduced by tests.
      if (/Failed to process file/.test(text)) return;
      consoleErrors.get(page)?.push(`console.error: ${text}`);
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.get(page)?.push(`pageerror: ${err.message}`);
  });
}

async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors = consoleErrors.get(page) ?? [];
  if (errors.length > 0) {
    throw new Error(`Page produced console errors:\n${errors.join('\n')}`);
  }
}

// ---------------------------------------------------------------------------
// Ad-hoc screenshot helper (debug-only)
// ---------------------------------------------------------------------------
export async function takeScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean; clip?: { x: number; y: number; width: number; height: number } }
): Promise<string> {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: options?.fullPage ?? false, clip: options?.clip });
  return filepath;
}

// ---------------------------------------------------------------------------
// Game navigation
// ---------------------------------------------------------------------------
export const GAME_IDS = [
  'ctrl-s-world',
  'snake-classic',
  'vortex-pong',
  'matrix-cloud',
  'matrix-invaders',
  'metris',
  'matrix-frogger',
  'neo-jump',
  'agent-chase',
  'rhythm-hacker',
  'cloud-jumper',
  'code-breaker',
] as const;
export type GameId = typeof GAME_IDS[number];

const GAME_DISPLAY_TITLES: Record<GameId, string> = {
  'ctrl-s-world': 'CTRL-S | The World',
  'snake-classic': 'Snake Classic',
  'vortex-pong': 'Vortex Pong',
  'matrix-cloud': 'Matrix Cloud',
  'matrix-invaders': 'Matrix Invaders',
  'metris': 'Metris',
  'matrix-frogger': 'Matrix Frogger',
  'neo-jump': 'Neo Jump',
  'agent-chase': 'Agent Chase',
  'rhythm-hacker': 'Rhythm Hacker',
  'cloud-jumper': 'Cloud Jumper',
  'code-breaker': 'Code Breaker',
};

/**
 * Navigate from the landing grid to a specific game's portal view.
 * After this call, `body[data-portal-ready="true"]` is set and the named game
 * is the selected game in the carousel.
 */
export async function navigateToGame(page: Page, gameId: GameId): Promise<void> {
  // From landing — click the matching aria-label.
  const card = page.locator(`[role="button"][aria-label="Play ${GAME_DISPLAY_TITLES[gameId]}"]`);
  if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
    await card.click();
  }

  await page.waitForFunction(
    (id) => document.body.dataset.portalReady === 'true' && document.body.dataset.portalGameId === id,
    gameId,
    { timeout: 15000 }
  );
}

/**
 * Press PLAY on the portal view to actually start the selected game.
 * After this returns, the React/Phaser game has mounted (but may still be on
 * its menu screen — use waitForGameReady to wait for a specific scene).
 */
export async function startGame(page: Page): Promise<void> {
  const playButton = page.locator('button[aria-label*="Start" i], button:has-text("PLAY")').first();
  if (await playButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await playButton.click();
  } else {
    await page.keyboard.press('Enter');
  }
  await page.waitForFunction(() => document.body.dataset.portalIsPlaying === 'true', undefined, { timeout: 10000 });
}

export async function pauseGame(page: Page): Promise<void> {
  await page.keyboard.press('p');
}

export async function exitGame(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.body.dataset.portalIsPlaying === 'false', undefined, { timeout: 5000 });
}
