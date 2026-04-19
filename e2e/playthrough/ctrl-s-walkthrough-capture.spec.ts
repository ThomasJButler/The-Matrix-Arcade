import { test } from '../fixtures/arcade.fixture';
import { getPhaserState } from '../fixtures/test-utils';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CTRL-S World — one-off Round-2 walkthrough capture for R83.CTRLS.21.
 *
 * Produces the 6-shot review set Tom asked for (Menu, Hub, Prologue opening,
 * Mid-chapter, Puzzle, CTRL-S climax) into `manual-testing-sessions/screenshots/R83-round2/`
 * with ISO-timestamped filenames. NOT a regression gate — `page.screenshot()` writes
 * files rather than diffing against baselines, and the whole spec is skipped
 * unless `CAPTURE_WALKTHROUGH=1` is set so the regular battery never trips it.
 *
 * Jumps straight to the chapter 5 terminal climax via `startFromParagraph` on
 * NarrativeScene init — the 25-paragraph play-through to reach the climax is
 * not worth re-running manually every capture.
 */

const ENABLED = process.env.CAPTURE_WALKTHROUGH === '1';
const OUTPUT_DIR = path.join(process.cwd(), 'manual-testing-sessions', 'screenshots', 'R83-round2');
const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, 'Z');

test.describe('CTRL-S walkthrough capture (R83 Round 2)', () => {
  test.skip(!ENABLED, 'Set CAPTURE_WALKTHROUGH=1 to enable this capture spec.');
  test.describe.configure({ mode: 'serial' });

  test('capture 6-shot walkthrough', async ({ page }) => {
    test.setTimeout(120_000);

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const shot = (slug: string) => path.join(OUTPUT_DIR, `${timestamp}-${slug}.png`);

    await page.goto('/?test=1&seed=42');
    await page.waitForSelector('body[data-landing-ready="true"]', { timeout: 15_000 });

    const card = page.locator('[role="button"][aria-label="Play CTRL-S | The World"]');
    await card.click();
    await page.waitForFunction(
      () => document.body.dataset.portalReady === 'true' && document.body.dataset.portalGameId === 'ctrl-s-world',
      undefined,
      { timeout: 15_000 },
    );

    const wheel = page.locator('[role="toolbar"][aria-label^="Game navigation wheel"]');
    await wheel.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => document.body.dataset.portalIsPlaying === 'true',
      undefined,
      { timeout: 10_000 },
    );

    // 1. Menu — ASCII title + start prompt.
    await page.waitForTimeout(2_500);
    await page.screenshot({ path: shot('01-menu') });

    // 2. Hub — chapter select grid (all chapters locked except prologue).
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: shot('02-hub') });

    // 3. Prologue opening — first paragraph of chapter 0, dread atmosphere
    //    pass visible (darkened palette, vignette, scanlines).
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3_500);
    await page.screenshot({ path: shot('03-prologue-opening') });

    // 4. Mid-chapter — advance 2 paragraphs into chapter 0 to show portrait +
    //    body text in the two-pane layout once the chapter ASCII has faded.
    //    Each paragraph takes 1 skip-to-end press + 1 advance press with a
    //    900-1400 ms beat in between, plus ~7 s of typewriter at dread cadence;
    //    2_500 ms settles each paragraph at WAITING before the screenshot.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(2_500);
    }
    await page.screenshot({ path: shot('04-mid-chapter') });

    // 5. Puzzle — prologue has a puzzle trigger at paragraph 4. Keep pressing
    //    Space until the PuzzleScene goes active, with a hard cap so a
    //    mis-wire can't loop forever. Waiting on the scene name is more robust
    //    than guessing advance counts against the dread-pass variable cadence.
    const puzzleSceneActive = async () =>
      page.evaluate(() => {
        type PhaserGameLike = { scene: { isActive: (key: string) => boolean } };
        const gi = (window as unknown as { __PHASER_GAME__?: PhaserGameLike }).__PHASER_GAME__;
        return gi?.scene.isActive('CtrlSPuzzleScene') ?? false;
      });
    for (let i = 0; i < 12 && !(await puzzleSceneActive()); i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(2_000);
    }
    await page.waitForTimeout(1_200); // settle puzzle scene after launch
    const puzzleState = await getPhaserState(page);
    test.info().annotations.push({ type: 'phaser-scene', description: String(puzzleState?.scene ?? 'unknown') });
    await page.screenshot({ path: shot('05-puzzle') });

    // 6. Climax — kick the narrative scene straight to chapter 5 paragraph 25
    //    where the terminal-entry trigger fires. Bypasses the 25-paragraph drive
    //    through the earlier chapters; the seam is `init(data)` on NarrativeScene.
    //    Uses scene.stop on the puzzle overlay rather than ESC — ESC would
    //    unwind all the way back to the portal and lose the game instance.
    await page.evaluate(() => {
      type PhaserSceneLike = { scene: { key: string } };
      type PhaserGameLike = {
        scene: {
          getScenes: (isActive: boolean) => PhaserSceneLike[];
          stop: (key: string) => unknown;
          start: (key: string, data?: Record<string, unknown>) => unknown;
        };
      };
      const gameInstance = (window as unknown as { __PHASER_GAME__?: PhaserGameLike }).__PHASER_GAME__;
      if (!gameInstance) return;
      gameInstance.scene.getScenes(true).forEach((s) => {
        if (s.scene.key !== 'CtrlSNarrativeScene') gameInstance.scene.stop(s.scene.key);
      });
      gameInstance.scene.start('CtrlSNarrativeScene', { chapterIndex: 5, startFromParagraph: 25 });
    });
    // Give the scene a generous wait for typewriter + paragraph-beat delay.
    await page.waitForTimeout(6_000);
    // Skip typewriter + advance through beat until the terminal trigger fires.
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(2_000);
    }
    await page.screenshot({ path: shot('06-ctrl-s-climax') });
  });
});
