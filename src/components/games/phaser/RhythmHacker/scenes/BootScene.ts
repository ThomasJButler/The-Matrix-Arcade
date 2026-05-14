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
   * Diamond-shaped note gems with layered glow — rhythm-game style.
   */
  private createNoteTextures(): void {
    const { LANES, NOTES } = GAME_CONFIG;
    const size = NOTES.HEIGHT;

    LANES.COLORS.forEach((color, index) => {
      const g = this.add.graphics();
      const cx = size / 2;
      const cy = size / 2;
      const inset = 3;

      // Soft circular glow behind the diamond
      g.fillStyle(color, 0.12);
      g.fillCircle(cx, cy, size / 2);

      // Outer diamond stroke
      g.lineStyle(2, color, 0.9);
      g.beginPath();
      g.moveTo(cx, inset);
      g.lineTo(size - inset, cy);
      g.lineTo(cx, size - inset);
      g.lineTo(inset, cy);
      g.closePath();
      g.strokePath();

      // Filled diamond body
      g.fillStyle(color, 0.75);
      g.beginPath();
      g.moveTo(cx, inset + 2);
      g.lineTo(size - inset - 2, cy);
      g.lineTo(cx, size - inset - 2);
      g.lineTo(inset + 2, cy);
      g.closePath();
      g.fillPath();

      // Inner bright core diamond
      g.fillStyle(0xffffff, 0.35);
      g.beginPath();
      g.moveTo(cx, cy - 5);
      g.lineTo(cx + 5, cy);
      g.lineTo(cx, cy + 5);
      g.lineTo(cx - 5, cy);
      g.closePath();
      g.fillPath();

      // Specular highlight
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(cx - 3, cy - 4, 2);

      g.generateTexture(`note_${index}`, size, size);
      g.destroy();

      // Hold body — glowing ribbon with bright centre beam
      const hg = this.add.graphics();
      hg.fillStyle(color, 0.2);
      hg.fillRect(0, 0, NOTES.HOLD_WIDTH, 10);
      hg.fillStyle(color, 0.5);
      hg.fillRect(NOTES.HOLD_WIDTH * 0.2, 1, NOTES.HOLD_WIDTH * 0.6, 8);
      hg.fillStyle(0xffffff, 0.15);
      hg.fillRect(NOTES.HOLD_WIDTH * 0.35, 3, NOTES.HOLD_WIDTH * 0.3, 4);
      hg.lineStyle(1, color, 0.3);
      hg.strokeRect(0, 0, NOTES.HOLD_WIDTH, 10);
      hg.generateTexture(`hold_${index}`, NOTES.HOLD_WIDTH, 10);
      hg.destroy();

      // Hold tail — small diamond matching note shape
      const tailSize = Math.floor(size / 2);
      const tg = this.add.graphics();
      const tcx = tailSize / 2;
      const tcy = tailSize / 2;
      tg.fillStyle(color, 0.7);
      tg.beginPath();
      tg.moveTo(tcx, 1);
      tg.lineTo(tailSize - 1, tcy);
      tg.lineTo(tcx, tailSize - 1);
      tg.lineTo(1, tcy);
      tg.closePath();
      tg.fillPath();
      tg.lineStyle(1, color, 0.9);
      tg.strokePath();
      tg.generateTexture(`hold_tail_${index}`, tailSize, tailSize);
      tg.destroy();
    });

    // Double note indicator — pulsing outer ring with corner flares
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
    // Corner flare dots
    dg.fillStyle(MATRIX_COLORS.CYAN, 0.8);
    dg.fillCircle(dcx, 2, 2.5);
    dg.fillCircle(size - 2, dcy, 2.5);
    dg.fillCircle(dcx, size - 2, 2.5);
    dg.fillCircle(2, dcy, 2.5);
    // Inner glow fill
    dg.fillStyle(MATRIX_COLORS.CYAN, 0.15);
    dg.beginPath();
    dg.moveTo(dcx, 4);
    dg.lineTo(size - 4, dcy);
    dg.lineTo(dcx, size - 4);
    dg.lineTo(4, dcy);
    dg.closePath();
    dg.fillPath();
    dg.generateTexture('double_indicator', size, size);
    dg.destroy();
  }

  /**
   * Lane backgrounds with highway grid, enhanced hit line, and bevelled key indicators.
   */
  private createLaneTextures(): void {
    const { LANES, HEIGHT } = GAME_CONFIG;
    const GRID_SPACING = 40;

    // Lane background — dark fill with horizontal grid lines for highway feel
    const lg = this.add.graphics();
    lg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.2);
    lg.fillRect(0, 0, LANES.WIDTH, HEIGHT);
    // Edge accent lines (brighter for lane definition)
    lg.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.15);
    lg.lineBetween(0, 0, 0, HEIGHT);
    lg.lineBetween(LANES.WIDTH - 1, 0, LANES.WIDTH - 1, HEIGHT);
    // Horizontal grid lines — scrolled in GameScene for highway motion
    lg.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.05);
    for (let y = 0; y < HEIGHT; y += GRID_SPACING) {
      lg.lineBetween(2, y, LANES.WIDTH - 2, y);
    }
    // Centre guide line
    lg.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.03);
    lg.lineBetween(LANES.WIDTH / 2, 0, LANES.WIDTH / 2, HEIGHT);
    lg.generateTexture('lane_bg', LANES.WIDTH, HEIGHT);
    lg.destroy();

    // Lane flash overlay — brighter for more impactful beat pulse
    const fg = this.add.graphics();
    fg.fillStyle(MATRIX_COLORS.PRIMARY, 0.18);
    fg.fillRect(0, 0, LANES.WIDTH, HEIGHT);
    fg.generateTexture('lane_flash', LANES.WIDTH, HEIGHT);
    fg.destroy();

    // Hit line — multi-layered glow (wider, more prominent)
    const hitW = LANES.WIDTH * 4 + LANES.SPACING * 3 + 40;
    const hitH = 14;
    const hg = this.add.graphics();
    // Wide soft glow fringe
    hg.fillStyle(MATRIX_COLORS.PRIMARY, 0.12);
    hg.fillRect(0, 0, hitW, hitH);
    // Medium glow band
    hg.fillStyle(MATRIX_COLORS.PRIMARY, 0.35);
    hg.fillRect(0, 2, hitW, hitH - 4);
    // Bright core stripe
    hg.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    hg.fillRect(0, 4, hitW, 6);
    // White specular centre
    hg.fillStyle(0xffffff, 0.25);
    hg.fillRect(0, 6, hitW, 2);
    hg.generateTexture('hit_line', hitW, hitH);
    hg.destroy();

    // Lane divider — thin vertical glow line between lanes
    const divH = HEIGHT;
    const divg = this.add.graphics();
    divg.fillStyle(MATRIX_COLORS.PRIMARY, 0.08);
    divg.fillRect(0, 0, 3, divH);
    divg.fillStyle(MATRIX_COLORS.PRIMARY, 0.2);
    divg.fillRect(1, 0, 1, divH);
    divg.generateTexture('lane_divider', 3, divH);
    divg.destroy();

    // Key indicators — bevelled buttons with inner shadow
    LANES.COLORS.forEach((color, index) => {
      const kw = LANES.WIDTH - 10;
      const kh = 40;

      const kg = this.add.graphics();
      kg.fillStyle(color, 0.2);
      kg.fillRoundedRect(0, 0, kw, kh, 8);
      kg.fillStyle(color, 0.1);
      kg.fillRoundedRect(2, 2, kw - 4, kh / 2 - 2, { tl: 6, tr: 6, bl: 0, br: 0 });
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
   * Effect textures — star-burst shapes for hits, used as fallback when firework particles are unavailable.
   */
  private createEffectTextures(): void {
    const grades = ['perfect', 'great', 'good', 'miss'] as const;
    const effectColors = [0x00ffff, 0x00ff00, MATRIX_COLORS.DIM_GREEN, 0x660000];

    grades.forEach((name, index) => {
      const g = this.add.graphics();
      const cx = 16;
      const cy = 16;
      const color = effectColors[index];

      // Outer soft glow
      g.fillStyle(color, 0.2);
      g.fillCircle(cx, cy, 15);

      if (name === 'perfect') {
        // 4-point star burst for perfect hits
        g.fillStyle(color, 0.9);
        g.beginPath();
        const points = 4;
        const outerR = 12;
        const innerR = 5;
        for (let p = 0; p < points * 2; p++) {
          const angle = (p * Math.PI) / points - Math.PI / 2;
          const r = p % 2 === 0 ? outerR : innerR;
          if (p === 0) g.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
          else g.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        }
        g.closePath();
        g.fillPath();
      } else {
        // Diamond shape for other grades
        g.fillStyle(color, 0.8);
        g.beginPath();
        g.moveTo(cx, cy - 10);
        g.lineTo(cx + 10, cy);
        g.lineTo(cx, cy + 10);
        g.lineTo(cx - 10, cy);
        g.closePath();
        g.fillPath();
      }

      // White specular highlight
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(cx - 2, cy - 3, 3);

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
