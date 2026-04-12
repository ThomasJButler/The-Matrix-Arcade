/**
 * Rhythm Hacker - Boot Scene
 */

import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG } from '../config';

export class RhythmHackerBootScene extends BootScene {
  constructor() {
    super({
      key: SCENE_KEYS.BOOT,
      nextScene: SCENE_KEYS.MENU,
    });
  }

  preload(): void {
    super.preload();
  }

  create(): void {
    this.createNoteTextures();
    this.createLaneTextures();
    this.createEffectTextures();

    super.create();
  }

  /**
   * Create note textures for each lane — circular data-node design
   * with glowing rings, more recognisable than plain rectangles.
   */
  private createNoteTextures(): void {
    const { LANES, NOTES } = GAME_CONFIG;
    const noteSize = NOTES.HEIGHT; // 30px — used as both width and height for circular notes

    LANES.COLORS.forEach((color, index) => {
      // Normal note — glowing data node (circle with ring and core)
      const g = this.add.graphics();
      const cx = noteSize / 2;
      const cy = noteSize / 2;
      const outerR = noteSize / 2 - 2;
      const innerR = outerR * 0.55;

      // Outer glow ring
      g.lineStyle(3, color, 0.8);
      g.strokeCircle(cx, cy, outerR);
      // Filled core
      g.fillStyle(color, 1);
      g.fillCircle(cx, cy, innerR);
      // Bright highlight dot
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(cx - 2, cy - 2, innerR * 0.4);

      g.generateTexture(`note_${index}`, noteSize, noteSize);
      g.destroy();

      // Hold note body
      const hg = this.add.graphics();
      hg.fillStyle(color, 0.5);
      hg.fillRect(0, 0, NOTES.HOLD_WIDTH, 10);
      hg.lineStyle(1, color, 0.3);
      hg.strokeRect(0, 0, NOTES.HOLD_WIDTH, 10);
      hg.generateTexture(`hold_${index}`, NOTES.HOLD_WIDTH, 10);
      hg.destroy();

      // Hold note tail — smaller circle at end of hold
      const tg = this.add.graphics();
      const tailR = noteSize / 4;
      tg.fillStyle(color, 0.8);
      tg.fillCircle(tailR, tailR, tailR);
      tg.generateTexture(`hold_tail_${index}`, noteSize / 2, noteSize / 2);
      tg.destroy();
    });

    // Double note indicator — pulsing outer diamond/ring
    const dg = this.add.graphics();
    const dcx = noteSize / 2;
    const dcy = noteSize / 2;
    dg.lineStyle(3, MATRIX_COLORS.CYAN, 1);
    // Diamond shape around the note
    dg.beginPath();
    dg.moveTo(dcx, 1);
    dg.lineTo(noteSize - 1, dcy);
    dg.lineTo(dcx, noteSize - 1);
    dg.lineTo(1, dcy);
    dg.closePath();
    dg.strokePath();
    dg.generateTexture('double_indicator', noteSize, noteSize);
    dg.destroy();
  }

  /**
   * Create lane background textures
   */
  private createLaneTextures(): void {
    const { LANES, HEIGHT } = GAME_CONFIG;

    // Lane background
    const lg = this.add.graphics();
    lg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.3);
    lg.fillRect(0, 0, LANES.WIDTH, HEIGHT);
    lg.generateTexture('lane_bg', LANES.WIDTH, HEIGHT);
    lg.destroy();

    // Hit line
    const hg = this.add.graphics();
    hg.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    hg.fillRect(0, 0, LANES.WIDTH * 4 + LANES.SPACING * 3 + 40, 4);
    hg.generateTexture('hit_line', LANES.WIDTH * 4 + LANES.SPACING * 3 + 40, 4);
    hg.destroy();

    // Lane key indicator
    LANES.COLORS.forEach((color, index) => {
      const kg = this.add.graphics();
      kg.fillStyle(color, 0.3);
      kg.fillRoundedRect(0, 0, LANES.WIDTH - 10, 40, 8);
      kg.lineStyle(2, color, 1);
      kg.strokeRoundedRect(0, 0, LANES.WIDTH - 10, 40, 8);
      kg.generateTexture(`key_${index}`, LANES.WIDTH - 10, 40);
      kg.destroy();

      // Pressed state
      const pg = this.add.graphics();
      pg.fillStyle(color, 0.8);
      pg.fillRoundedRect(0, 0, LANES.WIDTH - 10, 40, 8);
      pg.lineStyle(3, 0xffffff, 1);
      pg.strokeRoundedRect(0, 0, LANES.WIDTH - 10, 40, 8);
      pg.generateTexture(`key_pressed_${index}`, LANES.WIDTH - 10, 40);
      pg.destroy();
    });
  }

  /**
   * Create effect textures
   */
  private createEffectTextures(): void {
    // Hit effect particles — Matrix green palette
    const colors = ['perfect', 'great', 'good', 'miss'];
    const effectColors = [0x00ffff, 0x00ff00, 0x00aa00, 0x660000];

    colors.forEach((name, index) => {
      const g = this.add.graphics();
      g.fillStyle(effectColors[index], 1);
      g.fillCircle(16, 16, 12);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(12, 12, 6);
      g.generateTexture(`effect_${name}`, 32, 32);
      g.destroy();
    });
  }
}
