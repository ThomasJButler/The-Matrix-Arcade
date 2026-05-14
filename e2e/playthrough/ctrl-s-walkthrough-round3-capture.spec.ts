import { test } from '../fixtures/arcade.fixture';
import { getPhaserState } from '../fixtures/test-utils';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CTRL-S World — one-off Round 3 walkthrough capture for R83.CTRLS.27.
 *
 * Re-walks the same six-shot path as the Round 2 spec for side-by-side
 * comparison (Menu, Hub, Prologue opening, Mid-chapter, Puzzle, CTRL-S
 * climax) AND adds four new shots that prove the Round 3 polish:
 *   07 — trailing fade mid-transition (proves R83.CTRLS.23). Captured at
 *        T+250 ms after an inter-paragraph advance, where the ghost copy of
 *        the just-finished paragraph is still ~0.7 alpha (Sine.easeIn over
 *        500 ms) while the new paragraph has cleared the 100-200 ms beat
 *        and started typing underneath.
 *   08 — Protector speaker (proves R83.CTRLS.24 + .26). Prologue paragraph
 *        6 is the first 'protector' line; this shot proves the antagonist
 *        portrait now renders properly (not the red-P fallback Tom flagged
 *        in his Round 2 image 1) AND that the per-speaker tick / pacing
 *        path is wired (CHARACTERS.protector → SPEAKER_SPEED_MULTIPLIERS).
 *   09 — Aver-Ag speaker (proves R83.CTRLS.24). Prologue paragraph 12 is
 *        the first 'averag' line; pairing with shot 08 lets Tom eyeball
 *        per-speaker variance in a single review.
 *   10 — Funky-layout overview (proves R83.CTRLS.25). A clean WAITING-state
 *        shot with portrait middle-left, body text top-right, chapter sigil
 *        in the upper-left zone, and the L-bracket borders + scattered
 *        atmosphere glyphs visible — i.e. the asymmetric composition Tom
 *        sketched on his Round 2 annotated screenshot.
 *
 * Not a regression gate — `page.screenshot({ path })` writes files rather
 * than diffing against baselines, and the whole spec is skipped unless
 * `CAPTURE_WALKTHROUGH=1` is set so the regular battery never trips it.
 *
 * Same teleport seam as the Round 2 spec: `?test=1` exposes
 * `window.__PHASER_GAME__`, so we can call
 * `scene.start('CtrlSNarrativeScene', { chapterIndex, startFromParagraph })`
 * to jump past the puzzle gate at prologue paragraph 4 (and to chapter 5
 * paragraph 25 for the climax) without forcing a 25-paragraph play-through
 * every capture run.
 */

const ENABLED = process.env.CAPTURE_WALKTHROUGH === '1';
const OUTPUT_DIR = path.join(process.cwd(), 'manual-testing-sessions', 'screenshots', 'R83-round3');
const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, 'Z');

type PhaserSceneLike = { scene: { key: string; restart?: (data?: Record<string, unknown>) => unknown } };
type PhaserGameLike = {
  scene: {
    isActive: (key: string) => boolean;
    getScene: (key: string) => PhaserSceneLike | null;
    getScenes: (isActive: boolean) => PhaserSceneLike[];
    stop: (key: string) => unknown;
    start: (key: string, data?: Record<string, unknown>) => unknown;
  };
};

test.describe('CTRL-S walkthrough capture (R83 Round 3)', () => {
  test.skip(!ENABLED, 'Set CAPTURE_WALKTHROUGH=1 to enable this capture spec.');
  test.describe.configure({ mode: 'serial' });

  test('capture 10-shot walkthrough', async ({ page }) => {
    test.setTimeout(180_000);

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
    //    pass visible (darkened palette, vignette, scanlines) plus the
    //    funky-layout chrome from .25 (chapter sigil top-left, body text
    //    top-right with ~440 px wrap, ambient glyph scatter).
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3_500);
    await page.screenshot({ path: shot('03-prologue-opening') });

    // 4. Mid-chapter — advance two paragraphs into chapter 0 to show
    //    portrait + body text in the funky layout once the chapter ASCII
    //    has faded. With Round 3's 28-38 ms typewriter + 100-200 ms beat,
    //    each paragraph settles in well under 2.5 s; we keep the same
    //    settle window the Round 2 spec used so timings are comparable.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(2_500);
    }
    await page.screenshot({ path: shot('04-mid-chapter') });

    // 5. Puzzle — prologue has a puzzle trigger at paragraph 4. Keep
    //    pressing Space until the PuzzleScene goes active, with a hard cap
    //    so a mis-wire can't loop forever. Waiting on the scene name is
    //    more robust than guessing advance counts against the variable
    //    typewriter cadence.
    const puzzleSceneActive = async () =>
      page.evaluate(() => {
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

    // ---- Shots 6-10 ----
    // EXECUTION ORDER NOTE: shot 6 (chapter 5 climax) is captured LAST, after
    // shots 7-10 (chapter 0). Filenames stay numbered 01..10 so the review
    // sequence reads like the story, but a backwards ch5→ch0 teleport leaks
    // `terminalState` from chapter 5 into the new chapter 0 init (the
    // terminal trigger fires at ch5/p25 and `NarrativeScene.init()` resets
    // `waitingForTerminal=false` but never wipes `terminalState`/
    // `terminalTrigger`). The leak freezes the typewriter at charIndex≈5 on
    // the new paragraph and leaves the body unrendered. Capturing the
    // chapter-0 shots first sidesteps the leak entirely — the scene is fresh
    // from the puzzle path, never poisoned by a prior climax.
    //
    // Shared teleport helper: stop every OTHER active scene first (so puzzle/
    // inventory/terminal overlays from prior shots don't bleed in), then call
    // scene.restart() on the narrative scene itself. restart() is the
    // documented atomic primitive: it queues shutdown → init → create in the
    // correct order with new init data. The earlier stop+start approach
    // raced — start() ran before the queued stop() actually shut the scene
    // down.
    const teleportTo = async (chapterIndex: number, startFromParagraph: number) =>
      page.evaluate(
        ({ chapterIndex, startFromParagraph }) => {
          const gameInstance = (window as unknown as { __PHASER_GAME__?: PhaserGameLike }).__PHASER_GAME__;
          if (!gameInstance) return;
          gameInstance.scene.getScenes(true).forEach((s) => {
            if (s.scene.key !== 'CtrlSNarrativeScene') gameInstance.scene.stop(s.scene.key);
          });
          const narrative = gameInstance.scene.getScene('CtrlSNarrativeScene');
          narrative?.scene.restart?.({ chapterIndex, startFromParagraph });
        },
        { chapterIndex, startFromParagraph },
      );

    // Helper: poll the engine state via getPhaserState until the typewriter
    // is WAITING **on the expected paragraph index**. Without the
    // expectedParagraphIndex check this returned early on stale state from a
    // prior teleport (engine still reported WAITING@p25 from chapter 5 for the
    // first ~250 ms after a teleport to chapter 0 fired) — the screenshot
    // beat the new paragraph's render and saved an empty body.
    const waitForWaiting = async (expectedParagraphIndex: number, maxWaitMs = 12_000) => {
      const pollIntervalMs = 200;
      const start = Date.now();
      while (Date.now() - start < maxWaitMs) {
        const state = await getPhaserState(page);
        const tw = (state as { typewriter?: { state?: string; paragraphIndex?: number } } | null)?.typewriter;
        if (tw?.state === 'WAITING' && tw.paragraphIndex === expectedParagraphIndex) return;
        await page.waitForTimeout(pollIntervalMs);
      }
    };

    // 7. Trailing fade mid-transition (proves R83.CTRLS.23). Teleport to
    //    prologue paragraph 1 so paragraph 1 is the line on screen, poll
    //    until WAITING, then press Space ONCE — that's the inter-paragraph
    //    advance which spawns the ghost (cloned paragraph 1 text), waits
    //    100-200 ms beat, then starts typing paragraph 2. Screenshot at
    //    T+250 ms post-press: ghost α ≈ 0.707 (Sine.easeIn at t=0.5,
    //    1 − cos(π/4)) and paragraph 2 has cleared the beat with the first
    //    1-3 chars typing — the precise moment Tom's spec calls out.
    await teleportTo(0, 1);
    await waitForWaiting(1);
    await page.keyboard.press('Space');
    await page.waitForTimeout(250);
    await page.screenshot({ path: shot('07-trailing-fade-mid-transition') });

    // 8. Protector speaker (proves R83.CTRLS.26 + .24). Prologue paragraph
    //    6 is the first 'protector' line. Settle to WAITING so the body
    //    text is fully revealed and the Protector portrait has finished
    //    its fade-in. Proves the red-P fallback is gone — the antagonist
    //    portrait now renders as proper ASCII with the red eye-aperture
    //    tint per .26.
    await teleportTo(0, 6);
    await waitForWaiting(6);
    await page.screenshot({ path: shot('08-speaker-protector') });

    // 9. Aver-Ag speaker (proves R83.CTRLS.24). Prologue paragraph 12 is
    //    the first 'averag' line. Pairing with shot 08 lets Tom eyeball
    //    per-speaker variance side-by-side: protagonist portrait +
    //    Aver-Ag's pacing here vs Protector's antagonist portrait +
    //    cadence in shot 08.
    await teleportTo(0, 12);
    await waitForWaiting(12);
    await page.screenshot({ path: shot('09-speaker-averag') });

    // 10. Funky-layout overview (proves R83.CTRLS.25). Same scene as 09
    //     but held for an extra 2 s so the cursor blink, L-bracket
    //     borders, and atmosphere-glyph drift are all visible. Compare
    //     side-by-side with the Round 2 04-mid-chapter shot to confirm
    //     the rigid 40/60 split is gone and the diagonal composition
    //     (portrait middle-left, body text top-right, scatter glyphs)
    //     has landed.
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: shot('10-funky-layout-overview') });

    // 6. Climax — kick the narrative scene straight to chapter 5 paragraph
    //    25 where the terminal-entry trigger fires. Bypasses the
    //    25-paragraph drive through the earlier chapters; the seam is
    //    `init(data)` on NarrativeScene. Captured LAST so the resulting
    //    terminalState leak (see header above) can't poison shots 7-10.
    await teleportTo(5, 25);
    await page.waitForTimeout(6_000);
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(2_000);
    }
    await page.screenshot({ path: shot('06-ctrl-s-climax') });
  });
});
