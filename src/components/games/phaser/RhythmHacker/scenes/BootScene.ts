/**
 * Rhythm Hacker - Boot Scene
 *
 * Loads hologram UI panels and firework particles from shared assets,
 * then generates improved procedural textures for notes, lanes, and effects.
 */

import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG } from '../config';

const UI_SPRITES = [
  { key: 'ui_panel_green', path: '/assets/ui/cards/hologram-panel-green.png' },
  { key: 'ui_panel_red', path: '/assets/ui/cards/hologram-panel-red.png' },
  { key: 'ui_panel_empty', path: '/assets/ui/cards/hologram-panel-empty.png' },
] as const;

const PARTICLE_FRAMES = [
  { key: 'particle_pink_1', path: '/assets/shared/particles/firework-pink-1.png' },
  { key: 'particle_pink_2', path: '/assets/shared/particles/firework-pink-2.png' },
  { key: 'particle_pink_3', path: '/assets/shared/particles/firework-pink-3.png' },
  { key: 'particle_purple_1', path: '/assets/shared/particles/firework-purple-1.png' },
  { key: 'particle_purple_2', path: '/assets/shared/particles/firework-purple-2.png' },
  { key: 'particle_yellow_1', path: '/assets/shared/particles/firework-yellow-1.png' },
  { key: 'particle_yellow_2', path: '/assets/shared/particles/firework-yellow-2.png' },
] as const;

export class RhythmHackerBootScene extends BootScene {
  constructor() {
    super({
      key: SCENE_KEYS.BOOT,
      nextScene: SCENE_KEYS.MENU,
    });
  }

  protected loadCommonAssets(): void {
    for (const { key, path } of UI_SPRITES) {
      if (!this.textures.exists(key)) {
        this.load.image(key, path);
      }
    }
    for (const { key, path } of PARTICLE_FRAMES) {
      if (!this.textures.exists(key)) {
        this.load.image(key, path);
      }
    }
  }

  create(): void {
    this.createNoteTextures();
    this.createLaneTextures();
    this.createEffectTextures();
    this.createUITextures();

    const hasSprites = this.textures.exists('ui_panel_green');
    this.registry.set('uiSpriteMode', hasSprites);
    this.registry.set('particleSpriteMode', this.textures.exists('particle_pink_1'));

    super.create();
  }

  /**
   * Hexagonal data-node notes with layered glow rings.
   */
  private createNoteTextures(): void {
    const { LANES, NOTES } = GAME_CONFIG;
    const size = NOTES.HEIGHT;

    LANES.COLORS.forEach((color, index) => {
      const g = this.add.graphics();
      const cx = size / 2;
      const cy = size / 2;
      const outerR = size / 2 - 2;
      const innerR = outerR * 0.5;

      // Outer glow halo
      g.fillStyle(color, 0.15);
      g.fillCircle(cx, cy, outerR + 1);
      // Outer ring
      g.lineStyle(3, color, 0.9);
      g.strokeCircle(cx, cy, outerR);
      // Mid ring
      g.lineStyle(1, color, 0.4);
      g.strokeCircle(cx, cy, outerR * 0.75);
      // Filled core
      g.fillStyle(color, 1);
      g.fillCircle(cx, cy, innerR);
      // Specular highlight
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(cx - 2, cy - 3, innerR * 0.35);

      g.generateTexture(`note_${index}`, size, size);
      g.destroy();

      // Hold body — gradient-feel with bright centre stripe
      const hg = this.add.graphics();
      hg.fillStyle(color, 0.25);
      hg.fillRect(0, 0, NOTES.HOLD_WIDTH, 10);
      hg.fillStyle(color, 0.6);
      hg.fillRect(NOTES.HOLD_WIDTH * 0.3, 2, NOTES.HOLD_WIDTH * 0.4, 6);
      hg.lineStyle(1, color, 0.4);
      hg.strokeRect(0, 0, NOTES.HOLD_WIDTH, 10);
      hg.generateTexture(`hold_${index}`, NOTES.HOLD_WIDTH, 10);
      hg.destroy();

      // Hold tail — ring with dot
      const tg = this.add.graphics();
      const tailR = size / 4;
      tg.lineStyle(2, color, 0.8);
      tg.strokeCircle(tailR, tailR, tailR - 1);
      tg.fillStyle(color, 1);
      tg.fillCircle(tailR, tailR, tailR * 0.4);
      tg.generateTexture(`hold_tail_${index}`, size / 2, size / 2);
      tg.destroy();
    });

    // Double note indicator — diamond with corner dots
    const dg = this.add.graphics();
    const dcx = size / 2;
    const dcy = size / 2;
    dg.lineStyle(2, MATRIX_COLORS.CYAN, 1);
    dg.beginPath();
    dg.moveTo(dcx, 1);
    dg.lineTo(size - 1, dcy);
    dg.lineTo(dcx, size - 1);
    dg.lineTo(1, dcy);
    dg.closePath();
    dg.strokePath();
    dg.fillStyle(MATRIX_COLORS.CYAN, 0.6);
    const dotR = 2;
    dg.fillCircle(dcx, 2, dotR);
    dg.fillCircle(size - 2, dcy, dotR);
    dg.fillCircle(dcx, size - 2, dotR);
    dg.fillCircle(2, dcy, dotR);
    dg.generateTexture('double_indicator', size, size);
    dg.destroy();
  }

  /**
   * Lane backgrounds with subtle grid lines and improved key indicators.
   */
  private createLaneTextures(): void {
    const { LANES, HEIGHT } = GAME_CONFIG;

    // Lane background with vertical grid lines
    const lg = this.add.graphics();
    lg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.25);
    lg.fillRect(0, 0, LANES.WIDTH, HEIGHT);
    // Edge accent lines
    lg.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.08);
    lg.lineBetween(1, 0, 1, HEIGHT);
    lg.lineBetween(LANES.WIDTH - 2, 0, LANES.WIDTH - 2, HEIGHT);
    // Centre line
    lg.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.04);
    lg.lineBetween(LANES.WIDTH / 2, 0, LANES.WIDTH / 2, HEIGHT);
    lg.generateTexture('lane_bg', LANES.WIDTH, HEIGHT);
    lg.destroy();

    // Lane flash overlay — bright version for beat pulse
    const fg = this.add.graphics();
    fg.fillStyle(MATRIX_COLORS.PRIMARY, 0.12);
    fg.fillRect(0, 0, LANES.WIDTH, HEIGHT);
    fg.generateTexture('lane_flash', LANES.WIDTH, HEIGHT);
    fg.destroy();

    // Hit line — wider with glow fringe
    const hitW = LANES.WIDTH * 4 + LANES.SPACING * 3 + 40;
    const hg = this.add.graphics();
    hg.fillStyle(MATRIX_COLORS.PRIMARY, 0.3);
    hg.fillRect(0, 0, hitW, 8);
    hg.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    hg.fillRect(0, 2, hitW, 4);
    hg.generateTexture('hit_line', hitW, 8);
    hg.destroy();

    // Key indicators — bevelled buttons with inner shadow
    LANES.COLORS.forEach((color, index) => {
      const kw = LANES.WIDTH - 10;
      const kh = 40;

      const kg = this.add.graphics();
      // Background fill
      kg.fillStyle(color, 0.2);
      kg.fillRoundedRect(0, 0, kw, kh, 8);
      // Top highlight
      kg.fillStyle(color, 0.1);
      kg.fillRoundedRect(2, 2, kw - 4, kh / 2 - 2, { tl: 6, tr: 6, bl: 0, br: 0 });
      // Border
      kg.lineStyle(2, color, 0.7);
      kg.strokeRoundedRect(0, 0, kw, kh, 8);
      kg.generateTexture(`key_${index}`, kw, kh);
      kg.destroy();

      // Pressed — bright fill with white glow edge
      const pg = this.add.graphics();
      pg.fillStyle(color, 0.7);
      pg.fillRoundedRect(0, 0, kw, kh, 8);
      pg.fillStyle(0xffffff, 0.15);
      pg.fillRoundedRect(2, 2, kw - 4, kh / 2 - 2, { tl: 6, tr: 6, bl: 0, br: 0 });
      pg.lineStyle(3, 0xffffff, 0.9);
      pg.strokeRoundedRect(0, 0, kw, kh, 8);
      pg.generateTexture(`key_pressed_${index}`, kw, kh);
      pg.destroy();
    });
  }

  /**
   * Effect textures — used as fallback when firework particles are unavailable.
   */
  private createEffectTextures(): void {
    const grades = ['perfect', 'great', 'good', 'miss'] as const;
    const effectColors = [0x00ffff, 0x00ff00, 0x00aa00, 0x660000];

    grades.forEach((name, index) => {
      const g = this.add.graphics();
      // Outer glow
      g.fillStyle(effectColors[index], 0.3);
      g.fillCircle(16, 16, 15);
      // Core
      g.fillStyle(effectColors[index], 1);
      g.fillCircle(16, 16, 10);
      // Highlight
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(13, 13, 5);
      g.generateTexture(`effect_${name}`, 32, 32);
      g.destroy();
    });
  }

  /**
   * Procedural UI panel textures — fallback when hologram sprites are unavailable.
   */
  private createUITextures(): void {
    if (!this.textures.exists('ui_panel_green')) {
      const pg = this.add.graphics();
      pg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.6);
      pg.fillRoundedRect(0, 0, 113, 65, 4);
      pg.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.5);
      pg.strokeRoundedRect(0, 0, 113, 65, 4);
      pg.generateTexture('ui_panel_green', 113, 65);
      pg.destroy();
    }

    if (!this.textures.exists('ui_panel_red')) {
      const rg = this.add.graphics();
      rg.fillStyle(0x330000, 0.6);
      rg.fillRoundedRect(0, 0, 113, 65, 4);
      rg.lineStyle(1, MATRIX_COLORS.RED, 0.5);
      rg.strokeRoundedRect(0, 0, 113, 65, 4);
      rg.generateTexture('ui_panel_red', 113, 65);
      rg.destroy();
    }

    if (!this.textures.exists('ui_panel_empty')) {
      const eg = this.add.graphics();
      eg.fillStyle(0x111111, 0.5);
      eg.fillRoundedRect(0, 0, 113, 65, 4);
      eg.lineStyle(1, 0x444444, 0.4);
      eg.strokeRoundedRect(0, 0, 113, 65, 4);
      eg.generateTexture('ui_panel_empty', 113, 65);
      eg.destroy();
    }
  }
}
