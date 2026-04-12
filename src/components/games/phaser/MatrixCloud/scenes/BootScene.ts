import { BootScene } from '@/lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '@/lib/phaser/types';
import { GAME_CONFIG, POWERUP_DEFS, BOSS_DEFS, type PowerUpType, type BossType } from '../config';

export class MatrixCloudBootScene extends BootScene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT, nextScene: SCENE_KEYS.MENU });
  }

  create(): void {
    this.createPlayerTextures();
    this.createPowerUpTextures();
    this.createBossTextures();
    this.createAttackTextures();
    super.create();
  }

  private createPlayerTextures(): void {
    const w = GAME_CONFIG.PLAYER_WIDTH;
    const h = GAME_CONFIG.PLAYER_HEIGHT;

    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x00cc00, 1);
    g.fillRoundedRect(2, 4, w - 4, h - 8, 4);
    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillTriangle(w - 4, h * 0.3, w + 4, h * 0.5, w - 4, h * 0.7);
    g.fillStyle(MATRIX_COLORS.WHITE, 1);
    g.fillCircle(w * 0.6, h * 0.35, 2);
    g.fillCircle(w * 0.6, h * 0.65, 2);
    g.fillStyle(0x008800, 1);
    g.fillTriangle(2, h * 0.2, -4, h * 0.1, 2, h * 0.4);
    g.fillTriangle(2, h * 0.6, -4, h * 0.9, 2, h * 0.8);
    g.generateTexture('player', w + 6, h);
    g.destroy();

    const sg = this.make.graphics({ x: 0, y: 0 });
    sg.fillStyle(0x00cc00, 1);
    sg.fillRoundedRect(2, 4, w - 4, h - 8, 4);
    sg.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    sg.fillTriangle(w - 4, h * 0.3, w + 4, h * 0.5, w - 4, h * 0.7);
    sg.fillStyle(MATRIX_COLORS.WHITE, 1);
    sg.fillCircle(w * 0.6, h * 0.35, 2);
    sg.fillCircle(w * 0.6, h * 0.65, 2);
    sg.lineStyle(2, MATRIX_COLORS.MAGENTA, 0.7);
    sg.strokeCircle(w / 2, h / 2, h * 0.55);
    sg.generateTexture('player_shield', w + 6, h);
    sg.destroy();

    const dg = this.make.graphics({ x: 0, y: 0 });
    dg.fillStyle(MATRIX_COLORS.RED, 0.6);
    dg.fillRoundedRect(2, 4, w - 4, h - 8, 4);
    dg.fillStyle(MATRIX_COLORS.RED, 1);
    dg.fillTriangle(w - 4, h * 0.3, w + 4, h * 0.5, w - 4, h * 0.7);
    dg.fillStyle(MATRIX_COLORS.WHITE, 1);
    dg.fillCircle(w * 0.6, h * 0.35, 2);
    dg.fillCircle(w * 0.6, h * 0.65, 2);
    dg.generateTexture('player_damaged', w + 6, h);
    dg.destroy();
  }

  private createPowerUpTextures(): void {
    const s = GAME_CONFIG.POWERUP_SIZE;

    for (const [type, def] of Object.entries(POWERUP_DEFS) as [PowerUpType, (typeof POWERUP_DEFS)[PowerUpType]][]) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(def.color, 0.2);
      g.fillCircle(s / 2, s / 2, s * 0.45);
      g.lineStyle(2, def.color, 1);
      g.strokeCircle(s / 2, s / 2, s * 0.45);

      if (type === 'shield') {
        g.fillStyle(def.color, 1);
        g.fillCircle(s / 2, s / 2, s * 0.2);
      } else if (type === 'timeSlow') {
        g.fillStyle(def.color, 1);
        g.fillRect(s * 0.35, s * 0.3, s * 0.3, s * 0.4);
      } else if (type === 'extraLife') {
        g.fillStyle(def.color, 1);
        g.fillTriangle(s / 2, s * 0.25, s * 0.3, s * 0.7, s * 0.7, s * 0.7);
      } else {
        g.fillStyle(def.color, 1);
        g.fillRect(s * 0.33, s * 0.3, 3, s * 0.4);
        g.fillRect(s * 0.55, s * 0.3, 3, s * 0.4);
      }

      g.generateTexture(`powerup_${type}`, s, s);
      g.destroy();
    }
  }

  private createBossTextures(): void {
    const bossColors: Record<BossType, number> = {
      agent_smith: MATRIX_COLORS.RED,
      sentinel: MATRIX_COLORS.MAGENTA,
      architect: MATRIX_COLORS.YELLOW,
    };

    for (const [type, def] of Object.entries(BOSS_DEFS) as [BossType, (typeof BOSS_DEFS)[BossType]][]) {
      const s = def.size;
      const color = bossColors[type];
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(color, 0.15);
      g.fillRect(0, 0, s, s);
      g.lineStyle(2, color, 1);
      g.strokeRect(1, 1, s - 2, s - 2);

      g.fillStyle(color, 1);
      if (type === 'agent_smith') {
        g.fillRect(s * 0.2, s * 0.15, s * 0.6, s * 0.2);
        g.fillRect(s * 0.35, s * 0.35, s * 0.3, s * 0.5);
        g.fillStyle(MATRIX_COLORS.WHITE, 1);
        g.fillCircle(s * 0.35, s * 0.25, 3);
        g.fillCircle(s * 0.65, s * 0.25, 3);
      } else if (type === 'sentinel') {
        g.fillCircle(s / 2, s / 2, s * 0.35);
        g.fillStyle(0x000000, 1);
        g.fillCircle(s / 2, s / 2, s * 0.2);
        g.fillStyle(color, 1);
        g.fillCircle(s / 2, s / 2, s * 0.08);
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const tx = s / 2 + Math.cos(angle) * s * 0.4;
          const ty = s / 2 + Math.sin(angle) * s * 0.4;
          g.fillRect(tx - 3, ty - 3, 6, 6);
        }
      } else {
        g.fillRect(s * 0.1, s * 0.1, s * 0.8, s * 0.3);
        g.fillRect(s * 0.3, s * 0.4, s * 0.4, s * 0.5);
        g.fillStyle(MATRIX_COLORS.WHITE, 1);
        g.fillCircle(s * 0.35, s * 0.25, 4);
        g.fillCircle(s * 0.65, s * 0.25, 4);
        g.lineStyle(1, color, 1);
        for (let i = 0; i < 3; i++) {
          g.strokeRect(s * 0.35, s * 0.5 + i * 12, s * 0.3, 8);
        }
      }

      g.generateTexture(`boss_${type}`, s, s);
      g.destroy();
    }
  }

  private createAttackTextures(): void {
    const s = GAME_CONFIG.BOSS_ATTACK_SIZE;

    const lg = this.make.graphics({ x: 0, y: 0 });
    lg.fillStyle(MATRIX_COLORS.RED, 1);
    lg.fillRect(0, s * 0.3, s, s * 0.4);
    lg.fillStyle(0xff6666, 1);
    lg.fillRect(0, s * 0.4, s, s * 0.2);
    lg.generateTexture('attack_laser', s, s);
    lg.destroy();

    const mg = this.make.graphics({ x: 0, y: 0 });
    mg.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    mg.fillRect(1, 0, 4, s);
    mg.fillRect(7, 2, 4, s - 4);
    mg.fillRect(13, 1, 3, s - 2);
    mg.generateTexture('attack_matrix_rain', s, s);
    mg.destroy();

    const cg = this.make.graphics({ x: 0, y: 0 });
    cg.fillStyle(MATRIX_COLORS.YELLOW, 0.3);
    cg.fillCircle(s / 2, s / 2, s * 0.45);
    cg.fillStyle(MATRIX_COLORS.YELLOW, 1);
    cg.fillCircle(s / 2, s / 2, s * 0.25);
    cg.generateTexture('attack_code_bomb', s, s);
    cg.destroy();
  }
}
