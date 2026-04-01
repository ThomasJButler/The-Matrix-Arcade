import { Page } from '@playwright/test';
import { navigateToGame, startGame } from './arcade.fixture';
import { ensurePhaserFocus } from './test-utils';

/**
 * Navigate to a Phaser game, start it, and ensure focus.
 */
export async function startPhaserGame(page: Page, gameName: string): Promise<void> {
  await navigateToGame(page, gameName);
  await startGame(page);
  // Wait for menu scene to transition to game scene
  await page.waitForTimeout(500);
  await ensurePhaserFocus(page);
  // Press Enter/Space to start from menu scene
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  await ensurePhaserFocus(page);
}

/**
 * Move snake in a direction.
 */
export async function moveSnake(page: Page, direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
  const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  await page.keyboard.press(keyMap[direction]);
  await page.waitForTimeout(50);
}

/**
 * Trigger snake death by running into a wall.
 */
export async function triggerSnakeDeath(page: Page): Promise<void> {
  // Press a direction and hold — snake will eventually hit a wall
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
  }
}

/**
 * Drop a piece in Metris using hard drop.
 */
export async function dropPiece(page: Page): Promise<void> {
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
}

/**
 * Shoot in Matrix Invaders.
 */
export async function shootInvader(page: Page): Promise<void> {
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
}

/**
 * Flap in Matrix Cloud.
 */
export async function flap(page: Page): Promise<void> {
  await page.keyboard.press('Space');
  await page.waitForTimeout(50);
}

/**
 * Move paddle in Vortex Pong.
 */
export async function movePaddle(page: Page, direction: 'up' | 'down', duration = 200): Promise<void> {
  const key = direction === 'up' ? 'ArrowUp' : 'ArrowDown';
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
}

/**
 * Hop forward in Matrix Frogger.
 */
export async function hopForward(page: Page): Promise<void> {
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);
}

/**
 * Move in maze (Agent Chase).
 */
export async function moveInMaze(page: Page, direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
  const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  await page.keyboard.press(keyMap[direction]);
  await page.waitForTimeout(50);
}

/**
 * Select track in Rhythm Hacker menu.
 */
export async function selectTrack(page: Page, direction: 'next' | 'prev'): Promise<void> {
  await page.keyboard.press(direction === 'next' ? 'ArrowRight' : 'ArrowLeft');
  await page.waitForTimeout(200);
}

/**
 * Hit notes in Rhythm Hacker (press lane keys).
 */
export async function hitNotes(page: Page, keys: string[] = ['d', 'f', 'j', 'k']): Promise<void> {
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(50);
  }
}

/**
 * Jump in NeoJump / CloudJumper.
 */
export async function jump(page: Page): Promise<void> {
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
}

/**
 * Move horizontally in NeoJump / CloudJumper.
 */
export async function moveHorizontal(page: Page, direction: 'left' | 'right'): Promise<void> {
  await page.keyboard.press(direction === 'left' ? 'ArrowLeft' : 'ArrowRight');
  await page.waitForTimeout(50);
}

/**
 * Activate jetpack in NeoJump.
 */
export async function activateJetpack(page: Page): Promise<void> {
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(100);
}

/**
 * Pause and resume a game.
 */
export async function togglePause(page: Page): Promise<void> {
  await page.keyboard.press('p');
  await page.waitForTimeout(300);
}

/**
 * Restart a game.
 */
export async function restartGame(page: Page): Promise<void> {
  await page.keyboard.press('r');
  await page.waitForTimeout(500);
}
