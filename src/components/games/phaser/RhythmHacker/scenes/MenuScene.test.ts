/**
 * RhythmHackerMenuScene — Layout Regression Tests (R86.R3)
 *
 * Why this exists
 * ---------------
 * Tom's 2026-04-22 playtest screenshot showed the HOW TO PLAY band rendering
 * on top of the RESONANCE difficulty card (5th / last track). The old layout
 * used `HEIGHT - X` offsets that were correct when the menu had 4 tracks but
 * silently regressed when RESONANCE was added as a 5th entry — pushing the
 * last track's bottom edge (y=570) below the HOW TO PLAY title top (y=513).
 *
 * The fix (see `MenuScene.ts`) moves all layout Y values into named, exported
 * constants so the geometry can be audited in one place. These tests lock the
 * invariant that guarantees the overlap cannot come back:
 *
 *     lastTrackBottom + CLEARANCE_PX <= HOW_TO_PLAY_TITLE_Y - TITLE_HALF_HEIGHT
 *
 * Any future change that (a) adds a 6th track, (b) increases track spacing,
 * (c) grows the button height, or (d) moves the HOW TO PLAY band closer to
 * the tracks, will break one of the explicit tripwires below — rather than
 * silently re-creating Tom's "unplayable menu" situation inside Phaser.
 *
 * No Phaser runtime is instantiated here. The exported layout constants are
 * pure numbers; geometric invariants can be asserted directly without mounting
 * a scene. (This matches the Frogger MenuScene.test.ts philosophy: treat
 * layout maths as a pure contract; leave the "did the scene actually render"
 * check to visual regression under R86.V1.)
 */

import { describe, it, expect } from 'vitest';
import {
  TRACK_START_Y,
  TRACK_SPACING_Y,
  TRACK_BUTTON_HEIGHT,
  CLEARANCE_PX,
  HOW_TO_PLAY_TITLE_Y,
  HOW_TO_PLAY_LINE_1_Y,
  HOW_TO_PLAY_LINE_2_Y,
  CONTROLS_PROMPT_Y,
  CONTROLS_FOOTER_Y,
} from './MenuScene';
import { GAME_CONFIG } from '../config';

// Phaser `Text` with `setOrigin(0.5)` centres the glyph box on (x, y). A
// 14 px title therefore extends ±7 px vertically from its anchor.
const TITLE_FONT_SIZE_PX = 14;
const TITLE_HALF_HEIGHT = TITLE_FONT_SIZE_PX / 2;

// Last track button bottom edge (derived, not magic). The `+ TRACK_BUTTON_HEIGHT / 2`
// comes from the fact that the button background is drawn via
// `fillRoundedRect(-250, -30, 500, 60, 8)` centred on the button's `y`.
function lastTrackBottomEdge(): number {
  const trackCount = GAME_CONFIG.TRACKS.length;
  return TRACK_START_Y + (trackCount - 1) * TRACK_SPACING_Y + TRACK_BUTTON_HEIGHT / 2;
}

describe('RhythmHackerMenuScene — Layout (R86.R3)', () => {
  describe('Dial locks', () => {
    it('TRACK_START_Y pinned to 150', () => {
      // Restoring the pre-R86.R3 value of 180 re-overlaps the RESONANCE card
      // with the HOW TO PLAY title. The 30-px shift upward IS the fix.
      expect(TRACK_START_Y).toBe(150);
    });

    it('TRACK_SPACING_Y pinned to 90', () => {
      // Spacing matches the pre-R86.R3 feel so players returning from earlier
      // builds see the same per-card rhythm. A change here forces rework of
      // the clearance calculation — the geometry test below will catch it.
      expect(TRACK_SPACING_Y).toBe(90);
    });

    it('TRACK_BUTTON_HEIGHT pinned to 60 (matches fillRoundedRect draw)', () => {
      // The button bg is `fillRoundedRect(-250, -30, 500, 60, 8)` — this
      // constant MUST match the `60` literal in `createTrackButton`. A drift
      // between them would lie about where the bottom edge sits and silently
      // break the clearance invariant.
      expect(TRACK_BUTTON_HEIGHT).toBe(60);
    });

    it('CLEARANCE_PX is 10 (matches task brief)', () => {
      // R86.R3 plan text: "reposition so there's ≥10 px clearance". Tightening
      // below 10 would reinstate visual crowding; loosening silently accepts a
      // slimmer safety margin. Lock the contract at exactly the brief.
      expect(CLEARANCE_PX).toBe(10);
    });

    it('HOW_TO_PLAY_TITLE_Y pinned to 560', () => {
      // With TRACK_START_Y=150, TRACK_SPACING_Y=90, TRACK_BUTTON_HEIGHT=60,
      // the last track bottom sits at 540. A title at 560 (14 px → top 553)
      // gives 13 px of air ≥ the 10 px clearance contract.
      expect(HOW_TO_PLAY_TITLE_Y).toBe(560);
    });

    it('instruction line Ys pinned (580 / 595)', () => {
      expect(HOW_TO_PLAY_LINE_1_Y).toBe(580);
      expect(HOW_TO_PLAY_LINE_2_Y).toBe(595);
    });

    it('controls rows pinned (625 prompt / 655 footer)', () => {
      expect(CONTROLS_PROMPT_Y).toBe(625);
      expect(CONTROLS_FOOTER_Y).toBe(655);
    });
  });

  describe('Geometric invariants', () => {
    it('last track bottom computed correctly (540 for 5 tracks)', () => {
      // 5 tracks × 90 px spacing, first at 150, last centre at 510, box bottom
      // at 510 + 30 = 540. This is the core number the clearance check relies
      // on — asserting it directly makes failure messages unambiguous.
      expect(GAME_CONFIG.TRACKS.length).toBe(5);
      expect(lastTrackBottomEdge()).toBe(540);
    });

    it('HOW TO PLAY title top clears the last track by ≥CLEARANCE_PX', () => {
      // THE INVARIANT that Tom's playtest bug would violate. If a future
      // change adds a 6th track (TRACK_SPACING_Y × 6 + bottom = 630) without
      // moving HOW_TO_PLAY_TITLE_Y, this assertion fails immediately.
      const titleTop = HOW_TO_PLAY_TITLE_Y - TITLE_HALF_HEIGHT;
      const clearance = titleTop - lastTrackBottomEdge();
      expect(clearance).toBeGreaterThanOrEqual(CLEARANCE_PX);
    });

    it('layout rows are strictly increasing (no reorder regressions)', () => {
      // A "tidy-up" that reorders HOW_TO_PLAY_LINE_1 below LINE_2 or slides
      // CONTROLS_PROMPT above the instructions would break reading flow.
      // Encoding the top-to-bottom ordering as a sorted list makes any swap
      // loudly visible in test output.
      const ordered = [
        TRACK_START_Y,
        TRACK_START_Y + (GAME_CONFIG.TRACKS.length - 1) * TRACK_SPACING_Y,
        HOW_TO_PLAY_TITLE_Y,
        HOW_TO_PLAY_LINE_1_Y,
        HOW_TO_PLAY_LINE_2_Y,
        CONTROLS_PROMPT_Y,
        CONTROLS_FOOTER_Y,
      ];
      for (let i = 1; i < ordered.length; i++) {
        expect(ordered[i]).toBeGreaterThan(ordered[i - 1]);
      }
    });

    it('instruction lines have non-overlapping vertical bands', () => {
      // Instruction lines are 10 px tall → ±5 from anchor. Line 1 bottom
      // must sit above Line 2 top with at least 1 px of air, otherwise the
      // text glyphs kiss each other visually (and sometimes overlap due to
      // descender metrics).
      const LINE_HALF = 5;
      const line1Bottom = HOW_TO_PLAY_LINE_1_Y + LINE_HALF;
      const line2Top = HOW_TO_PLAY_LINE_2_Y - LINE_HALF;
      expect(line2Top).toBeGreaterThan(line1Bottom);
    });

    it('controls footer stays above the canvas bottom edge', () => {
      // `CONTROLS_FOOTER_Y` is the lowest painted row. It must leave at least
      // a footer half-height of margin above `HEIGHT` to stay fully visible.
      // With HEIGHT=700, footer at 655 (10 px → ±5) leaves 40 px of margin.
      const FOOTER_HALF = 5;
      expect(CONTROLS_FOOTER_Y + FOOTER_HALF).toBeLessThanOrEqual(GAME_CONFIG.HEIGHT);
    });

    it('HOW TO PLAY band does not drift into the dashbar reserved zone', () => {
      // GameScene.test.ts locks a 100 px dashbar reserved area at the canvas
      // bottom. The MenuScene doesn't draw the dashbar, but the portal chrome
      // still paints over that area — so menu text inside the bottom 100 px
      // risks getting occluded by the same chrome that hit R86.R2. The title
      // + first instruction line sit in the clear zone; the rest (line 2,
      // controls prompt, footer) are intentionally light informational text
      // that's acceptable-but-not-ideal if slightly obscured. Lock only the
      // primary read (title + line 1) out of the dashbar zone.
      const DASHBAR_RESERVED_PX = 100;
      const dashbarTop = GAME_CONFIG.HEIGHT - DASHBAR_RESERVED_PX;
      expect(HOW_TO_PLAY_TITLE_Y).toBeLessThan(dashbarTop);
      expect(HOW_TO_PLAY_LINE_1_Y).toBeLessThan(dashbarTop);
    });
  });

  describe('Source-code contract', () => {
    it('MenuScene.ts has no stale HEIGHT-offset magic numbers in executable code', async () => {
      // The pre-R86.R3 code used HEIGHT-minus-180 / 160 / 145 / 100 / 70
      // offsets for layout. The fix routes everything through named constants.
      // A "tidy" commit that re-inlines one of these offsets would break the
      // single-source-of-truth contract — this check catches it via static
      // source inspection. Comments are stripped first so the WHY block can
      // reference the old values in prose without tripping the tripwire.
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      const raw = readFileSync(
        resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/MenuScene.ts'),
        'utf8',
      );
      const codeOnly = raw
        .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
        .replace(/\/\/.*$/gm, ''); // line comments
      for (const offset of [180, 160, 145, 100, 70]) {
        const stalePattern = new RegExp(`HEIGHT\\s*-\\s*${offset}\\b`);
        expect(codeOnly).not.toMatch(stalePattern);
      }
    });

    it('MenuScene.ts actually uses the exported layout constants', async () => {
      // Belt-and-braces: the constants exist AND are referenced by `create()`.
      // A refactor that exported the constants but forgot to wire them into
      // the scene would let the tests pass but leave the canvas broken.
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      const src = readFileSync(
        resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/MenuScene.ts'),
        'utf8',
      );
      expect(src).toMatch(/TRACK_START_Y\s*\+\s*index\s*\*\s*TRACK_SPACING_Y/);
      expect(src).toMatch(/HOW_TO_PLAY_TITLE_Y/);
      expect(src).toMatch(/CONTROLS_FOOTER_Y/);
    });
  });
});
