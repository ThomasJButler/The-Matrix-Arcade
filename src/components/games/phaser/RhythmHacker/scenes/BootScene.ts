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
   * Create note textures for each lane
   */
  private createNoteTextures(): void {
    const { LANES, NOTES } = GAME_CONFIG;

    LANES.COLORS.forEach((color, index) => {
      // Normal note
      const g = this.add.graphics();
      g.fillStyle(color, 1);
      g.fillRoundedRect(0, 0, LANES.WIDTH - 10, NOTES.HEIGHT, 8);
      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeRoundedRect(0, 0, LANES.WIDTH - 10, NOTES.HEIGHT, 8);
      // Highlight
      g.fillStyle(0xffffff, 0.3);
      g.fillRoundedRect(4, 4, LANES.WIDTH - 18, 8, 4);
      g.generateTexture(`note_${index}`, LANES.WIDTH - 10, NOTES.HEIGHT);
      g.destroy();

      // Hold note body
      const hg = this.add.graphics();
      hg.fillStyle(color, 0.6);
      hg.fillRect(0, 0, NOTES.HOLD_WIDTH, 10);
      hg.generateTexture(`hold_${index}`, NOTES.HOLD_WIDTH, 10);
      hg.destroy();

      // Hold note tail
      const tg = this.add.graphics();
      tg.fillStyle(color, 1);
      tg.fillRoundedRect(0, 0, LANES.WIDTH - 10, NOTES.HEIGHT / 2, 4);
      tg.generateTexture(`hold_tail_${index}`, LANES.WIDTH - 10, NOTES.HEIGHT / 2);
      tg.destroy();
    });

    // Double note indicator (cyan border)
    const dg = this.add.graphics();
    dg.lineStyle(4, MATRIX_COLORS.CYAN, 1);
    dg.strokeRoundedRect(2, 2, LANES.WIDTH - 14, NOTES.HEIGHT - 4, 6);
    dg.generateTexture('double_indicator', LANES.WIDTH - 10, NOTES.HEIGHT);
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
