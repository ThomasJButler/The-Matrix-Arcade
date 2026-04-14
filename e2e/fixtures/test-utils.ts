import { Page } from '@playwright/test';

/** Returns the per-frame Phaser state written by BaseScene.exposeTestState(). */
export async function getPhaserState(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => (window as unknown as { __PHASER_GAME_STATE__?: Record<string, unknown> }).__PHASER_GAME_STATE__ ?? null);
}

/** CtrlSWorld state seam exposed in test mode. */
export async function getCtrlSWorldState(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => (window as unknown as { __CTRLS_STATE__?: Record<string, unknown> }).__CTRLS_STATE__ ?? null);
}

/**
 * Wait for a Phaser scene to be the active update()-driven scene. Backed by
 * BaseScene.exposeTestState which publishes `__PHASER_GAME_STATE__.scene`
 * each frame (only GameScene update loops emit, so this reliably detects when
 * gameplay has begun — Menu/GameOver scenes are detected via the React DOM).
 */
export async function waitForGameReady(page: Page, sceneKey: string, timeout = 15000): Promise<void> {
  await page.waitForFunction(
    (key) => {
      const state = (window as unknown as { __PHASER_GAME_STATE__?: { scene?: string } }).__PHASER_GAME_STATE__;
      if (state?.scene === key) return true;
      // Menu / GameOver scenes don't update() — fall back to body marker.
      return document.body.dataset.gameReady === key;
    },
    sceneKey,
    { timeout }
  );
}

export async function waitForPhaserScene(page: Page, sceneKey: string, timeout = 15000): Promise<void> {
  await page.waitForFunction(
    (key) => (window as unknown as { __PHASER_GAME_STATE__?: { scene?: string } }).__PHASER_GAME_STATE__?.scene === key,
    sceneKey,
    { timeout }
  );
}

export async function waitForScore(page: Page, minScore: number, timeout = 20000): Promise<void> {
  await page.waitForFunction(
    (min) => {
      const phaser = (window as unknown as { __PHASER_GAME_STATE__?: { score?: number } }).__PHASER_GAME_STATE__;
      if (phaser && typeof phaser.score === 'number' && phaser.score >= min) return true;
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

export async function waitForGameOver(page: Page, timeout = 30000): Promise<void> {
  await page.waitForFunction(
    () => {
      const phaser = (window as unknown as { __PHASER_GAME_STATE__?: { scene?: string } }).__PHASER_GAME_STATE__;
      if (phaser?.scene === 'GameOverScene' || phaser?.scene === 'GameOver') return true;
      if (document.body.dataset.gameReady === 'GameOverScene') return true;
      const el = document.querySelector('[data-game-phase]');
      if (el?.getAttribute('data-game-phase') === 'gameOver') return true;
      return false;
    },
    undefined,
    { timeout }
  );
}

export async function getReactGamePhase(page: Page): Promise<string | null> {
  return page.getAttribute('[data-game-phase]', 'data-game-phase');
}

export async function getReactScore(page: Page): Promise<number | null> {
  const val = await page.getAttribute('[data-score]', 'data-score');
  return val !== null ? Number(val) : null;
}

/** Click the Phaser canvas wrapper to give it keyboard focus. */
export async function ensurePhaserFocus(page: Page): Promise<void> {
  const container = page.locator('[data-phaser-game="true"]');
  if (await container.isVisible().catch(() => false)) {
    await container.click({ position: { x: 10, y: 10 } });
  }
}

export async function loseFocus(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

export async function recoverFocus(page: Page): Promise<void> {
  await ensurePhaserFocus(page);
}
