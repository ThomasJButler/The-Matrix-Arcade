import { BootScene } from '@/lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '@/lib/phaser/types';
import { GAME_CONFIG, ENEMY_DEFS, POWERUP_DEFS, type EnemyType, type PowerUpType } from '../config';

const SPRITE_ASSETS = [
  { key: 'sprite_player', path: 'assets/matrix-invaders/player.png' },
  { key: 'sprite_enemy_code', path: 'assets/matrix-invaders/enemy_code.png' },
  { key: 'sprite_enemy_agent', path: 'assets/matrix-invaders/enemy_agent.png' },
  { key: 'sprite_enemy_sentinel', path: 'assets/matrix-invaders/enemy_sentinel.png' },
  { key: 'sprite_enemy_virus', path: 'assets/matrix-invaders/enemy_virus.png' },
  { key: 'sprite_bullet_player', path: 'assets/matrix-invaders/bullet_player.png' },
  { key: 'sprite_bullet_enemy', path: 'assets/matrix-invaders/bullet_enemy.png' },
  { key: 'laser_green', path: 'assets/matrix-invaders/laser_green.png' },
  { key: 'laser_red', path: 'assets/matrix-invaders/laser_red.png' },
  { key: 'backdrop', path: 'assets/matrix-invaders/backdrop.png' },
];

export class MatrixInvadersBootScene extends BootScene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT, nextScene: SCENE_KEYS.MENU });
  }

  protected loadCommonAssets(): void {
    for (const { key, path } of SPRITE_ASSETS) {
      this.load.image(key, path);
    }
  }

  create(): void {
    const spritesLoaded = this.textures.exists('sprite_player');
    this.game.registry.set('spriteMode', spritesLoaded);

    if (!spritesLoaded) {
      this.createPlayerTextures();
      this.createEnemyTextures();
    }
    this.createBossTexture();
    if (!this.textures.exists('sprite_bullet_player')) {
      this.createBulletTextures();
    }
    this.createPowerUpTextures();
    super.create();
  }

  private createPlayerTextures(): void {
    const W = GAME_CONFIG.PLAYER_WIDTH;
    const H = GAME_CONFIG.PLAYER_HEIGHT;

    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(MATRIX_COLORS.MEDIUM_GREEN, 1);
    g.fillRect(4, Math.floor(H * 0.4), W - 8, Math.ceil(H * 0.6));
    g.fillTriangle(W / 2, 0, 4, Math.floor(H * 0.4), W - 4, Math.floor(H * 0.4));
    g.fillStyle(0xffffff, 1);
    g.fillCircle(W / 2, Math.floor(H * 0.35), 3);
    g.fillStyle(MATRIX_COLORS.CYAN, 0.8);
    g.fillRect(8, H - 4, 6, 4);
    g.fillRect(W - 14, H - 4, 6, 4);
    g.generateTexture('player', W, H);
    g.destroy();

    const gs = this.make.graphics({ x: 0, y: 0 });
    gs.fillStyle(MATRIX_COLORS.MEDIUM_GREEN, 1);
    gs.fillRect(4, Math.floor(H * 0.4), W - 8, Math.ceil(H * 0.6));
    gs.fillTriangle(W / 2, 0, 4, Math.floor(H * 0.4), W - 4, Math.floor(H * 0.4));
    gs.fillStyle(0xffffff, 1);
    gs.fillCircle(W / 2, Math.floor(H * 0.35), 3);
    gs.fillStyle(MATRIX_COLORS.CYAN, 0.8);
    gs.fillRect(8, H - 4, 6, 4);
    gs.fillRect(W - 14, H - 4, 6, 4);
    gs.lineStyle(2, MATRIX_COLORS.MAGENTA, 0.7);
    gs.strokeCircle(W / 2, H / 2, Math.max(W, H) * 0.55);
    gs.generateTexture('player_shield', W, H);
    gs.destroy();
  }

  private createEnemyTextures(): void {
    const W = GAME_CONFIG.ENEMY_WIDTH;
    const H = GAME_CONFIG.ENEMY_HEIGHT;

    for (const [type, def] of Object.entries(ENEMY_DEFS) as [EnemyType, (typeof ENEMY_DEFS)[EnemyType]][]) {
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(def.color, 0.8);
      g.fillRoundedRect(2, 2, W - 4, H - 4, 4);
      g.lineStyle(1, def.color, 1);
      g.strokeRoundedRect(2, 2, W - 4, H - 4, 4);

      g.fillStyle(0xffffff, 1);
      g.fillCircle(Math.floor(W * 0.35), Math.floor(H * 0.35), 3);
      g.fillCircle(Math.floor(W * 0.65), Math.floor(H * 0.35), 3);

      if (type === 'virus') {
        g.lineStyle(2, 0xffffff, 1);
        g.lineBetween(W * 0.3, H * 0.55, W / 2, H * 0.8);
        g.lineBetween(W / 2, H * 0.8, W * 0.7, H * 0.55);
      } else if (type === 'agent') {
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(Math.floor(W * 0.2), Math.floor(H * 0.55), Math.floor(W * 0.6), 3);
        g.fillRect(Math.floor(W * 0.35), Math.floor(H * 0.62), Math.floor(W * 0.3), 3);
      } else if (type === 'sentinel') {
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(Math.floor(W * 0.3), Math.floor(H * 0.55), Math.floor(W * 0.4), 2);
        g.fillRect(Math.floor(W * 0.3), Math.floor(H * 0.7), Math.floor(W * 0.4), 2);
      } else {
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(Math.floor(W * 0.35), Math.floor(H * 0.65), 2);
        g.fillCircle(Math.floor(W * 0.65), Math.floor(H * 0.65), 2);
      }

      g.generateTexture(`enemy_${type}`, W, H);
      g.destroy();
    }
  }

  private createBossTexture(): void {
    const W = GAME_CONFIG.BOSS_WIDTH;
    const H = GAME_CONFIG.BOSS_HEIGHT;

    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(MATRIX_COLORS.MAGENTA, 0.6);
    g.fillRoundedRect(4, 4, W - 8, H - 8, 6);
    g.lineStyle(2, MATRIX_COLORS.MAGENTA, 1);
    g.strokeRoundedRect(4, 4, W - 8, H - 8, 6);

    g.fillStyle(0xffffff, 1);
    g.fillCircle(Math.floor(W * 0.35), Math.floor(H * 0.35), 5);
    g.fillCircle(Math.floor(W * 0.65), Math.floor(H * 0.35), 5);
    g.fillStyle(MATRIX_COLORS.RED, 1);
    g.fillCircle(Math.floor(W * 0.35), Math.floor(H * 0.35), 2);
    g.fillCircle(Math.floor(W * 0.65), Math.floor(H * 0.35), 2);

    g.lineStyle(2, MATRIX_COLORS.RED, 0.8);
    g.strokeRect(Math.floor(W * 0.3), Math.floor(H * 0.6), Math.floor(W * 0.4), Math.floor(H * 0.15));

    g.fillStyle(MATRIX_COLORS.RED, 0.8);
    g.fillRect(Math.floor(W * 0.2), H - 8, 8, 8);
    g.fillRect(Math.floor(W / 2) - 4, H - 8, 8, 8);
    g.fillRect(Math.floor(W * 0.8) - 8, H - 8, 8, 8);

    g.generateTexture('boss', W, H);
    g.destroy();
  }

  private createBulletTextures(): void {
    const gp = this.make.graphics({ x: 0, y: 0 });
    gp.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    gp.fillRect(0, 0, GAME_CONFIG.PLAYER_BULLET_WIDTH, GAME_CONFIG.PLAYER_BULLET_HEIGHT);
    gp.generateTexture('bullet_player', GAME_CONFIG.PLAYER_BULLET_WIDTH, GAME_CONFIG.PLAYER_BULLET_HEIGHT);
    gp.destroy();

    const ge = this.make.graphics({ x: 0, y: 0 });
    ge.fillStyle(MATRIX_COLORS.RED, 1);
    ge.fillRect(0, 0, GAME_CONFIG.ENEMY_BULLET_WIDTH, GAME_CONFIG.ENEMY_BULLET_HEIGHT);
    ge.generateTexture('bullet_enemy', GAME_CONFIG.ENEMY_BULLET_WIDTH, GAME_CONFIG.ENEMY_BULLET_HEIGHT);
    ge.destroy();
  }

  private createPowerUpTextures(): void {
    const S = GAME_CONFIG.POWERUP_SIZE;

    for (const [type, def] of Object.entries(POWERUP_DEFS) as [PowerUpType, (typeof POWERUP_DEFS)[PowerUpType]][]) {
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(def.color, 0.3);
      g.fillCircle(S / 2, S / 2, S / 2);
      g.lineStyle(2, def.color, 1);
      g.strokeCircle(S / 2, S / 2, S / 2 - 1);

      g.fillStyle(def.color, 1);
      if (type === 'rapidFire') {
        g.fillRect(Math.floor(S * 0.25), Math.floor(S * 0.3), 2, Math.floor(S * 0.4));
        g.fillRect(Math.floor(S * 0.5) - 1, Math.floor(S * 0.25), 2, Math.floor(S * 0.5));
        g.fillRect(Math.floor(S * 0.75) - 2, Math.floor(S * 0.3), 2, Math.floor(S * 0.4));
      } else if (type === 'shield') {
        g.fillCircle(S / 2, S / 2, Math.floor(S * 0.25));
      } else if (type === 'scoreMultiplier') {
        g.lineStyle(2, def.color, 1);
        g.lineBetween(S * 0.3, S * 0.3, S * 0.7, S * 0.7);
        g.lineBetween(S * 0.7, S * 0.3, S * 0.3, S * 0.7);
      } else {
        g.fillCircle(S / 2, S / 2, Math.floor(S * 0.2));
        g.lineStyle(2, def.color, 1);
        g.lineBetween(S / 2, Math.floor(S * 0.3), Math.floor(S * 0.65), Math.floor(S * 0.15));
      }

      g.generateTexture(`powerup_${type}`, S, S);
      g.destroy();
    }
  }
}
