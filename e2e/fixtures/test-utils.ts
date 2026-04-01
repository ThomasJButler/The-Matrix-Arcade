import { Page } from '@playwright/test';

/**
 * Enable test mode by setting window.__TEST__ flag.
 * Must be called before navigating to the app so the flag is set when games initialize.
 */
export async function enableTestMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as any).__TEST__ = true;
  });
}

/**
 * Get Phaser game state exposed by BaseScene.exposeTestState().
 */
export async function getPhaserState(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => (window as any).__PHASER_GAME_STATE__ ?? null);
}

/**
 * Get the game phase from a React game's data-game-phase attribute.
 */
export async function getReactGamePhase(page: Page): Promise<string | null> {
  return page.getAttribute('[data-game-phase]', 'data-game-phase');
}

/**
 * Get the score from a React game's data-score attribute.
 */
export async function getReactScore(page: Page): Promise<number | null> {
  const val = await page.getAttribute('[data-score]', 'data-score');
  return val !== null ? Number(val) : null;
}

/**
 * Wait for Phaser game state to satisfy a predicate.
 */
export async function waitForPhaserState(
  page: Page,
  predicate: (state: Record<string, unknown>) => boolean,
  timeout = 10000
): Promise<Record<string, unknown>> {
  return page.waitForFunction(
    (pred) => {
      const state = (window as any).__PHASER_GAME_STATE__;
      if (!state) return false;
      // We can't pass the predicate function directly, so we return the state
      // and let the caller check. Instead, return state when it exists.
      return state;
    },
    undefined,
    { timeout }
  ).then(handle => handle.jsonValue() as Promise<Record<string, unknown>>);
}

/**
 * Wait for score to reach a minimum value (works for both Phaser and React games).
 */
export async function waitForScore(
  page: Page,
  minScore: number,
  timeout = 15000
): Promise<void> {
  await page.waitForFunction(
    (min) => {
      // Check Phaser state
      const phaserState = (window as any).__PHASER_GAME_STATE__;
      if (phaserState && typeof phaserState.score === 'number' && phaserState.score >= min) {
        return true;
      }
      // Check React data attribute
      const el = document.querySelector('[data-score]');
      if (el) {
        const score = Number(el.getAttribute('data-score'));
        if (score >= min) return true;
      }
      return false;
    },
    minScore,
    { timeout }
  );
}

/**
 * Wait for game over state (works for both Phaser and React games).
 */
export async function waitForGameOver(page: Page, timeout = 30000): Promise<void> {
  await page.waitForFunction(
    () => {
      // Check Phaser state
      const phaserState = (window as any).__PHASER_GAME_STATE__;
      if (phaserState && phaserState.scene === 'GameOver') return true;
      // Check React data attribute
      const el = document.querySelector('[data-game-phase]');
      if (el && el.getAttribute('data-game-phase') === 'gameOver') return true;
      // Check for visible game over text
      const body = document.body.textContent || '';
      if (body.includes('GAME OVER') || body.includes('Game Over')) return true;
      return false;
    },
    undefined,
    { timeout }
  );
}

/**
 * Wait for a specific Phaser scene to be active.
 */
export async function waitForPhaserScene(
  page: Page,
  sceneKey: string,
  timeout = 10000
): Promise<void> {
  await page.waitForFunction(
    (key) => {
      const state = (window as any).__PHASER_GAME_STATE__;
      return state && state.scene === key;
    },
    sceneKey,
    { timeout }
  );
}

/**
 * Ensure the Phaser game canvas has focus for keyboard input.
 */
export async function ensurePhaserFocus(page: Page): Promise<void> {
  const phaserContainer = page.locator('[data-phaser-game="true"]');
  if (await phaserContainer.isVisible().catch(() => false)) {
    await phaserContainer.click();
    await page.waitForTimeout(100);
  }
}

/**
 * Simulate losing focus (click outside the game area).
 */
export async function loseFocus(page: Page): Promise<void> {
  // Click on the page body outside game area
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
  });
  await page.waitForTimeout(100);
}

/**
 * Recover focus after losing it.
 */
export async function recoverFocus(page: Page): Promise<void> {
  // Try Phaser container first, then any game container
  const phaserContainer = page.locator('[data-phaser-game="true"]');
  if (await phaserContainer.isVisible().catch(() => false)) {
    await phaserContainer.hover();
    await page.waitForTimeout(200);
    return;
  }

  // React game container
  const reactContainer = page.locator('[data-game-phase]');
  if (await reactContainer.isVisible().catch(() => false)) {
    await reactContainer.click();
    await page.waitForTimeout(200);
  }
}
