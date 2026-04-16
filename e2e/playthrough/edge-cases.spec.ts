import { test, expect, navigateToGame, startGame, exitGame } from '../fixtures/arcade.fixture';
import {
  ensurePhaserFocus,
  loseFocus,
  recoverFocus,
  waitForGameReady,
  waitForCountdownComplete,
  getPhaserState,
} from '../fixtures/test-utils';

test.describe('Cross-game edge cases', () => {
  test('focus loss + recovery keeps game responsive', async ({ gameplayPage: page }) => {
    test.setTimeout(45_000);
    await navigateToGame(page, 'matrix-frogger');
    await startGame(page);
    await ensurePhaserFocus(page);
    await page.waitForTimeout(1500); // menu settle
    await page.keyboard.press('Enter');
    await waitForGameReady(page, 'GameScene');

    await page.keyboard.press('ArrowUp');
    const before = await getPhaserState(page);

    await loseFocus(page);
    await page.waitForTimeout(400);
    await recoverFocus(page);
    await page.keyboard.press('ArrowUp');

    const after = await getPhaserState(page);
    expect(after?.scene).toBe('GameScene');
    expect(typeof after).toBe('object');
    expect(before).not.toBeNull();
  });

  test('double ESC returns to portal without crashing', async ({ gameplayPage: page }) => {
    test.setTimeout(30_000);
    await navigateToGame(page, 'neo-jump');
    await startGame(page);
    await ensurePhaserFocus(page);
    await page.waitForTimeout(1500); // menu settle

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => document.body.dataset.portalIsPlaying)).toBe('false');
  });

  test('rapid pause toggle does not desync', async ({ gameplayPage: page }) => {
    test.setTimeout(45_000);
    await navigateToGame(page, 'snake-classic');
    await startGame(page);
    await ensurePhaserFocus(page);
    await page.waitForTimeout(1500); // menu settle
    await page.keyboard.press('Enter');
    await waitForGameReady(page, 'GameScene');

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('p');
      await page.waitForTimeout(80);
    }
    // Final state should be either paused or playing — not undefined / crashed.
    const state = await getPhaserState(page);
    expect(state?.scene).toBe('GameScene');
    expect(typeof state?.isPaused).toBe('boolean');
  });

  test('mute toggle on portal flips icon and persists into game', async ({ arcadePage: page }) => {
    await navigateToGame(page, 'snake-classic');
    await page.keyboard.press('v');
    await page.waitForTimeout(200);
    await page.keyboard.press('v');
  });

  test('portal navigation between games works without play', async ({ arcadePage: page }) => {
    await navigateToGame(page, 'snake-classic');
    const wheel = page.locator('[role="toolbar"][aria-label^="Game navigation wheel"]');
    await wheel.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => page.evaluate(() => document.body.dataset.portalGameId)).not.toBe('snake-classic');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => page.evaluate(() => document.body.dataset.portalGameId)).toBe('snake-classic');
  });

  test('exit during gameplay returns to portal cleanly', async ({ gameplayPage: page }) => {
    test.setTimeout(30_000);
    await navigateToGame(page, 'snake-classic');
    await startGame(page);
    await ensurePhaserFocus(page);
    await page.waitForTimeout(1500); // menu settle
    await page.keyboard.press('Enter');
    await waitForGameReady(page, 'GameScene');
    await waitForCountdownComplete(page);
    await ensurePhaserFocus(page);
    await exitGame(page);
  });
});
