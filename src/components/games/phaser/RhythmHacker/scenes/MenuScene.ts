/**
 * Rhythm Hacker - Menu Scene with Track Selection
 *
 * Layout notes (R86.R3)
 * ----------------------
 * Tom's 2026-04-22 playtest screenshot showed the HOW TO PLAY band rendering
 * directly on top of the RESONANCE difficulty card (5th / last track). When
 * RESONANCE was added as a 5th entry (see `GAME_CONFIG.TRACKS`), the old
 * layout — which pinned the HOW TO PLAY title to `HEIGHT - 180 = 520` and
 * walked tracks down from `y = 180` at `+90` spacing — silently regressed: the
 * 5th card's background graphic sits at y=540 and spans y=510..570, while the
 * HOW TO PLAY title (14 px, origin 0.5) rendered at y=520 spans y=513..527 —
 * squarely on top of the card's top edge. The instruction lines at y=540 and
 * y=555 landed inside the card body.
 *
 * This file now sources all vertical positions from the named constants below
 * so the geometry is auditable in one place. The invariant locked in
 * `MenuScene.test.ts` is:
 *
 *   lastTrackBottom + CLEARANCE_PX <= HOW_TO_PLAY_TITLE_Y - TITLE_HALF_HEIGHT
 *
 * which gives the HOW TO PLAY title at least `CLEARANCE_PX` (10 px) of air
 * above the last track button's bottom edge. A future change that adds a 6th
 * track — or grows a track button — will break the geometry test immediately
 * rather than silently re-overlapping in a Phaser canvas.
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG } from '../config';

// ---------------------------------------------------------------------------
// Layout constants (exported for MenuScene.test.ts geometry tripwires).
//
// All values are absolute pixels on the 800×700 canvas. Why absolute instead
// of ratios (the pattern Frogger's MenuScene.test.ts uses)? The Rhythm Hacker
// canvas dimensions are already locked by R86.R2's GAME_CONFIG dial tests;
// introducing ratios would churn through every track-button coordinate and
// buy nothing. Absolute values keep the relationship between TRACK_* and
// HOW_TO_PLAY_* trivial to reason about when auditing the next layout tweak.
// ---------------------------------------------------------------------------

/** First track button centre Y. Tracks walk downward at `TRACK_SPACING_Y`. */
export const TRACK_START_Y = 150;

/** Vertical spacing between track button centres. */
export const TRACK_SPACING_Y = 90;

/**
 * Track button total height (background graphic). The button bg is drawn via
 * `fillRoundedRect(-250, -30, 500, 60, 8)` centred on the button's `y`, so
 * its bottom edge sits at `y + TRACK_BUTTON_HEIGHT / 2`.
 */
export const TRACK_BUTTON_HEIGHT = 60;

/** Minimum vertical gap between last track's bottom and HOW TO PLAY title top. */
export const CLEARANCE_PX = 10;

/** HOW TO PLAY section heading Y (14 px text, origin 0.5 → top = Y − 7). */
export const HOW_TO_PLAY_TITLE_Y = 560;

/** HOW TO PLAY first instruction line Y (10 px text). */
export const HOW_TO_PLAY_LINE_1_Y = 580;

/** HOW TO PLAY second instruction line Y (10 px text). */
export const HOW_TO_PLAY_LINE_2_Y = 595;

/** "Select difficulty and press ENTER" prompt Y (12 px text). */
export const CONTROLS_PROMPT_Y = 625;

/** Bottom controls footer ("ESC: Exit  M: Mute") Y (10 px text). */
export const CONTROLS_FOOTER_Y = 655;

export class RhythmHackerMenuScene extends BaseScene {
  private selectedTrack = 0;
  private rainGroup!: Phaser.GameObjects.Group;
  private trackButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(): void {
    this.createMatrixBackground();
    this.trackButtons = [];
    this.rainGroup = this.addMatrixRain(20);

    const { WIDTH } = GAME_CONFIG;

    // Title
    this.createMatrixText(WIDTH / 2, 60, 'RHYTHM HACKER', 28);
    this.createMatrixText(WIDTH / 2, 100, 'Select Difficulty', 14, MATRIX_COLORS.CYAN_HEX);

    // Track selection buttons — walk downward from TRACK_START_Y at TRACK_SPACING_Y.
    GAME_CONFIG.TRACKS.forEach((track, index) => {
      const y = TRACK_START_Y + index * TRACK_SPACING_Y;
      const button = this.createTrackButton(WIDTH / 2, y, track.name, index);
      this.trackButtons.push(button);
    });

    // HOW TO PLAY section — anchored so the title top clears the last track
    // button's bottom by at least CLEARANCE_PX (see MenuScene.test.ts invariant).
    this.createMatrixText(WIDTH / 2, HOW_TO_PLAY_TITLE_Y, 'HOW TO PLAY', 14, MATRIX_COLORS.CYAN_HEX);
    this.createMatrixText(WIDTH / 2, HOW_TO_PLAY_LINE_1_Y, 'Q W O P: Hit notes in time | Hold keys for hold notes', 10);
    this.createMatrixText(WIDTH / 2, HOW_TO_PLAY_LINE_2_Y, 'Goal: Hit falling code fragments to the beat', 10);

    // Controls info
    this.createMatrixText(WIDTH / 2, CONTROLS_PROMPT_Y, 'Select difficulty and press ENTER to start', 12);
    // R86.R1 — Pause key omitted (P is reserved for QWOP lane 4). The dashbar
    // pause button still works because it dispatches PAUSE_REQUEST_EVENT which
    // BaseScene honours independently of any keyboard binding.
    this.createMatrixText(WIDTH / 2, CONTROLS_FOOTER_Y, 'ESC: Exit  M: Mute', 10, MATRIX_COLORS.PRIMARY_HEX).setAlpha(0.3);

    // Keyboard input
    this.setupInput();
    this.setupCommonInputs();

    // Highlight first track
    this.highlightTrack(0);
  }

  update(_time: number, delta: number): void {
    this.updateMatrixRain(this.rainGroup, delta);
  }

  /**
   * Create track selection button
   */
  private createTrackButton(x: number, y: number, name: string, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.5);
    bg.fillRoundedRect(-250, -30, 500, 60, 8);
    bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.5);
    bg.strokeRoundedRect(-250, -30, 500, 60, 8);

    // Track name
    const text = this.add.text(0, -5, name, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '16px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    text.setOrigin(0.5);

    // Track info
    const track = GAME_CONFIG.TRACKS[index];
    const info = this.add.text(0, 18, `${track.bpm} BPM | ${track.duration}s`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.CYAN_HEX,
    });
    info.setOrigin(0.5);

    container.add([bg, text, info]);
    container.setData('bg', bg);
    container.setData('text', text);

    // Interactive
    const hitArea = new Phaser.Geom.Rectangle(-250, -30, 500, 60);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => this.highlightTrack(index));
    container.on('pointerdown', () => this.selectTrack(index));

    return container;
  }

  /**
   * Setup keyboard input
   */
  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      const downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      upKey.on('down', () => {
        this.selectedTrack = Math.max(0, this.selectedTrack - 1);
        this.highlightTrack(this.selectedTrack);
      });

      downKey.on('down', () => {
        this.selectedTrack = Math.min(GAME_CONFIG.TRACKS.length - 1, this.selectedTrack + 1);
        this.highlightTrack(this.selectedTrack);
      });

      enterKey.on('down', () => this.selectTrack(this.selectedTrack));
      spaceKey.on('down', () => this.selectTrack(this.selectedTrack));
    });
  }

  /**
   * Highlight track button
   */
  private highlightTrack(index: number): void {
    this.selectedTrack = index;

    this.trackButtons.forEach((button, i) => {
      const bg = button.getData('bg') as Phaser.GameObjects.Graphics;
      const text = button.getData('text') as Phaser.GameObjects.Text;

      bg.clear();
      if (i === index) {
        bg.fillStyle(MATRIX_COLORS.PRIMARY, 0.3);
        bg.fillRoundedRect(-250, -30, 500, 60, 8);
        bg.lineStyle(3, MATRIX_COLORS.PRIMARY, 1);
        bg.strokeRoundedRect(-250, -30, 500, 60, 8);
        text.setColor(MATRIX_COLORS.WHITE_HEX);
      } else {
        bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.5);
        bg.fillRoundedRect(-250, -30, 500, 60, 8);
        bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.5);
        bg.strokeRoundedRect(-250, -30, 500, 60, 8);
        text.setColor(MATRIX_COLORS.PRIMARY_HEX);
      }
    });

    this.playSound('menu');
  }

  /**
   * Select track and start game
   */
  private selectTrack(index: number): void {
    this.playSound('score');
    this.scene.start(SCENE_KEYS.GAME, { trackIndex: index });
  }

  shutdown(): void {
    this.rainGroup?.destroy(true);
    this.trackButtons = [];
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    super.shutdown();
  }
}
