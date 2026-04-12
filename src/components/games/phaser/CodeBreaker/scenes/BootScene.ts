import { BootScene } from '@/lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '@/lib/phaser/types';
import { POWERUP_DEFS, GAME_CONFIG, type PowerUpType } from '../config';

const C = GAME_CONFIG;

export class CodeBreakerBootScene extends BootScene {
  constructor() {
    super(SCENE_KEYS.BOOT, SCENE_KEYS.MENU);
  }

  create(): void {
    this.createPaddleTexture();
    this.createBallTexture();
    this.createBrickTextures();
    this.createAgentTexture();
    this.createBossTexture();
    this.createPowerUpTextures();
    this.createLaserTexture();
    this.createFirewallTexture();
    this.createPortalTexture();
    super.create();
  }

  private createPaddleTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillRoundedRect(0, 0, C.PADDLE_WIDTH, C.PADDLE_HEIGHT, 4);
    g.lineStyle(1, 0x00cc00, 0.8);
    g.strokeRoundedRect(0, 0, C.PADDLE_WIDTH, C.PADDLE_HEIGHT, 4);
    g.fillStyle(0x00cc00, 0.6);
    g.fillRect(4, 3, C.PADDLE_WIDTH - 8, 3);
    g.generateTexture('paddle', C.PADDLE_WIDTH, C.PADDLE_HEIGHT);
    g.destroy();

    const gw = this.make.graphics({ x: 0, y: 0 });
    gw.fillStyle(MATRIX_COLORS.YELLOW, 1);
    gw.fillRoundedRect(0, 0, C.PADDLE_WIDE_WIDTH, C.PADDLE_HEIGHT, 4);
    gw.lineStyle(1, 0xccaa00, 0.8);
    gw.strokeRoundedRect(0, 0, C.PADDLE_WIDE_WIDTH, C.PADDLE_HEIGHT, 4);
    gw.fillStyle(0xccaa00, 0.6);
    gw.fillRect(4, 3, C.PADDLE_WIDE_WIDTH - 8, 3);
    gw.generateTexture('paddle_wide', C.PADDLE_WIDE_WIDTH, C.PADDLE_HEIGHT);
    gw.destroy();

    const gl = this.make.graphics({ x: 0, y: 0 });
    gl.fillStyle(MATRIX_COLORS.MAGENTA, 1);
    gl.fillRoundedRect(0, 0, C.PADDLE_WIDTH, C.PADDLE_HEIGHT, 4);
    gl.lineStyle(1, 0xcc00cc, 0.8);
    gl.strokeRoundedRect(0, 0, C.PADDLE_WIDTH, C.PADDLE_HEIGHT, 4);
    gl.fillStyle(0xff44ff, 0.5);
    gl.fillRect(C.PADDLE_WIDTH / 2 - 3, 2, 6, C.PADDLE_HEIGHT - 4);
    gl.generateTexture('paddle_laser', C.PADDLE_WIDTH, C.PADDLE_HEIGHT);
    gl.destroy();
  }

  private createBallTexture(): void {
    const r = C.BALL_RADIUS;
    const size = r * 2 + 2;
    const cx = size / 2;
    const cy = size / 2;

    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillCircle(cx, cy, r);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(cx - 1, cy - 1, r * 0.4);
    g.generateTexture('ball', size, size);
    g.destroy();
  }

  private createBrickTextures(): void {
    const brickTypes: Array<{ key: string; color: number }> = [
      { key: 'brick_code', color: 0x00ff00 },
      { key: 'brick_agent', color: 0xccaa00 },
      { key: 'brick_sentinel', color: 0xff0000 },
      { key: 'brick_unbreakable', color: 0x666666 },
    ];

    for (const { key, color } of brickTypes) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(color, 1);
      g.fillRoundedRect(0, 0, C.BRICK_WIDTH, C.BRICK_HEIGHT, 2);
      g.lineStyle(1, 0xffffff, 0.15);
      g.strokeRoundedRect(0, 0, C.BRICK_WIDTH, C.BRICK_HEIGHT, 2);

      if (key !== 'brick_unbreakable') {
        g.fillStyle(0xffffff, 0.2);
        g.fillRect(2, 2, C.BRICK_WIDTH - 4, 4);
      } else {
        g.lineStyle(1, 0x888888, 0.4);
        g.lineBetween(C.BRICK_WIDTH / 3, 0, C.BRICK_WIDTH / 3, C.BRICK_HEIGHT);
        g.lineBetween((C.BRICK_WIDTH * 2) / 3, 0, (C.BRICK_WIDTH * 2) / 3, C.BRICK_HEIGHT);
        g.lineBetween(0, C.BRICK_HEIGHT / 2, C.BRICK_WIDTH, C.BRICK_HEIGHT / 2);
      }

      g.generateTexture(key, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      g.destroy();
    }

    const gc = this.make.graphics({ x: 0, y: 0 });
    gc.lineStyle(2, 0xffffff, 0.5);
    gc.lineBetween(4, 4, C.BRICK_WIDTH - 4, C.BRICK_HEIGHT - 4);
    gc.lineBetween(C.BRICK_WIDTH - 4, 4, 4, C.BRICK_HEIGHT - 4);
    gc.generateTexture('brick_crack', C.BRICK_WIDTH, C.BRICK_HEIGHT);
    gc.destroy();
  }

  private createAgentTexture(): void {
    const w = C.AGENT_WIDTH;
    const h = C.AGENT_HEIGHT;
    const g = this.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0x003300, 1);
    g.fillRect(4, 0, w - 8, h * 0.7);
    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillRect(2, h * 0.3, w - 4, h * 0.4);
    g.fillStyle(MATRIX_COLORS.RED, 1);
    g.fillCircle(w * 0.35, h * 0.2, 2);
    g.fillCircle(w * 0.65, h * 0.2, 2);
    g.fillStyle(0x003300, 1);
    g.fillRect(0, h * 0.7, w, h * 0.3);

    g.generateTexture('agent_smith', w, h);
    g.destroy();
  }

  private createBossTexture(): void {
    const w = C.BOSS_WIDTH;
    const h = C.BOSS_HEIGHT;
    const g = this.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0x880000, 1);
    g.fillRoundedRect(0, 0, w, h, 4);
    g.lineStyle(2, MATRIX_COLORS.RED, 1);
    g.strokeRoundedRect(0, 0, w, h, 4);
    g.fillStyle(MATRIX_COLORS.RED, 0.5);
    g.fillRect(10, 4, w - 20, h - 8);

    for (let i = 0; i < 5; i++) {
      g.fillStyle(MATRIX_COLORS.YELLOW, 0.6);
      g.fillRect(15 + i * 20, 6, 8, 4);
    }

    g.generateTexture('boss_brick', w, h);
    g.destroy();
  }

  private createPowerUpTextures(): void {
    const types = Object.entries(POWERUP_DEFS) as Array<[PowerUpType, typeof POWERUP_DEFS[PowerUpType]]>;
    const size = C.POWERUP_SIZE;
    const r = size / 2;

    for (const [type, def] of types) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(def.color, 0.3);
      g.fillCircle(r, r, r);
      g.lineStyle(2, def.color, 1);
      g.strokeCircle(r, r, r - 1);
      g.fillStyle(def.color, 1);
      g.fillCircle(r, r, r * 0.5);
      g.generateTexture(`powerup_${type}`, size, size);
      g.destroy();
    }
  }

  private createLaserTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(MATRIX_COLORS.MAGENTA, 1);
    g.fillRect(0, 0, C.LASER_WIDTH, C.LASER_HEIGHT);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(1, 0, 2, C.LASER_HEIGHT);
    g.generateTexture('laser_beam', C.LASER_WIDTH, C.LASER_HEIGHT);
    g.destroy();
  }

  private createFirewallTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(MATRIX_COLORS.CYAN, 0.6);
    g.fillRect(0, 0, C.WIDTH, C.FIREWALL_HEIGHT);
    g.lineStyle(1, MATRIX_COLORS.CYAN, 1);
    g.lineBetween(0, 0, C.WIDTH, 0);
    g.lineBetween(0, C.FIREWALL_HEIGHT, C.WIDTH, C.FIREWALL_HEIGHT);
    g.generateTexture('firewall', C.WIDTH, C.FIREWALL_HEIGHT);
    g.destroy();
  }

  private createPortalTexture(): void {
    const size = 48;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(MATRIX_COLORS.CYAN, 0.3);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.lineStyle(3, MATRIX_COLORS.CYAN, 0.8);
    g.strokeCircle(size / 2, size / 2, size / 2 - 2);
    g.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.6);
    g.strokeCircle(size / 2, size / 2, size / 3);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(size / 2, size / 2, 4);
    g.generateTexture('portal', size, size);
    g.destroy();
  }
}
