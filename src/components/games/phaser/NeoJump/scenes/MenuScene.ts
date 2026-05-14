/**
 * Neo Jump — Menu Scene.
 *
 * R86.N3: expanded the HOW TO PLAY band into a proper CONTROLS panel —
 * Tom 2026-04-22 flagged "We need to show the player what the controls are"
 * after his Neo Jump playtest. The fix adopts the Snake R83.S1 / Frogger
 * R86.F5 legend pattern: exported Y-ratios + a `CONTROLS_ITEMS` tuple so
 * the layout is verifiable from unit tests and cannot silently drift above
 * the shared START button (`BaseScene.MENU_START_BUTTON_Y_RATIO = 0.75`,
 * ~50 px tall → top edge ~0.708 on a 600-px canvas).
 *
 * Why text cues instead of icons (c.f. Frogger's 6-sprite legend):
 *  - Neo Jump's canvas is 400 × 600 (vs Frogger's 800 × 600). Six icon
 *    columns with 22-px sprites + 60-px side padding would leave each
 *    column ~56 px wide, cramping the labels.
 *  - Tom asked for *controls* specifically (arrows, jetpack, shoot, pause)
 *    — a keycap-style text list reads cleaner than arbitrary icons.
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';

/**
 * Y-ratios for the CONTROLS panel stack (heading + 5 rows).
 *
 * Upper-bound guard: the shared START button centre sits at
 * `BaseScene.MENU_START_BUTTON_Y_RATIO = 0.75`. With a 50-px button the
 * top edge lands at ratio ~0.708 on a 600-px canvas. Every row below
 * MUST stay strictly < 0.70 to preserve the same ≥10-px clearance that
 * Frogger R86.F5 and Invaders R85.I5 pin as a regression tripwire.
 */
export const CONTROLS_HEADING_Y_RATIO = 0.46;
export const CONTROLS_FIRST_ROW_Y_RATIO = 0.52;
export const CONTROLS_ROW_SPACING_Y_RATIO = 0.035;

/**
 * Five control cues are called out — movement, jetpack, shoot, pause,
 * exit. Order mirrors gameplay frequency: you'll press arrows every
 * moment, jetpack every few seconds, SPACE to dispatch enemies, and
 * P/ESC only on demand. The `key` column is rendered left, `action`
 * right — a two-column keycap list.
 *
 * CONTROLS_ITEMS is frozen as `as const` so the test suite can iterate
 * it and assert the render order without stringly-typed lookups.
 */
export const CONTROLS_ITEMS = [
  { key: '← →', action: 'MOVE' },
  { key: '↑ / W', action: 'JETPACK' },
  { key: 'SPACE', action: 'SHOOT' },
  { key: 'P', action: 'PAUSE' },
  { key: 'ESC', action: 'EXIT' },
] as const;

/** Rendered font size for the heading + cue rows (px). Kept explicit so
 *  it can be asserted from tests (ensures a future font-size tweak cannot
 *  accidentally push rows into the button band). */
export const CONTROLS_HEADING_FONT_PX = 14;
export const CONTROLS_ROW_FONT_PX = 10;

export class NeoJumpMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'NEO JUMP',
      subtitle: 'Reach the highest altitude!',
      gameScene: SCENE_KEYS.GAME,
    });
  }

  create(): void {
    super.create();

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    // CONTROLS heading — cyan for section parity with Frogger R86.F5's
    // "GAME OBJECTS" heading and Invaders R85.I5's instruction band.
    this.createMatrixText(
      centerX,
      height * CONTROLS_HEADING_Y_RATIO,
      'CONTROLS',
      CONTROLS_HEADING_FONT_PX,
      MATRIX_COLORS.CYAN_HEX,
    );

    // Cue rows — two-column `[KEY]  ACTION` layout. Keys are right-aligned
    // to centre-X with a small gutter; actions are left-aligned past it.
    // The 120-px total panel width is within the 400-px canvas bounds
    // with room to spare (140 px of margin each side).
    const keyX = centerX - 40;
    const actionX = centerX + 20;
    CONTROLS_ITEMS.forEach((item, i) => {
      const rowY = height * (CONTROLS_FIRST_ROW_Y_RATIO + CONTROLS_ROW_SPACING_Y_RATIO * i);
      this.createMatrixText(keyX, rowY, item.key, CONTROLS_ROW_FONT_PX, MATRIX_COLORS.CYAN_HEX);
      this.createMatrixText(actionX, rowY, item.action, CONTROLS_ROW_FONT_PX, MATRIX_COLORS.PRIMARY_HEX);
    });
  }
}
