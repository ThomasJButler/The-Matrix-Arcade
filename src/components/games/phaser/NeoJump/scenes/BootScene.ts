import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG } from '../config';

const PLAYER_SPRITES = [
  { key: 'player_sprite_idle', path: 'assets/neo-jump/player-idle.png' },
  { key: 'player_sprite_jump', path: 'assets/neo-jump/player-jump.png' },
  { key: 'player_sprite_fall', path: 'assets/neo-jump/player-fall.png' },
  { key: 'player_sprite_shoot', path: 'assets/neo-jump/player-shoot.png' },
  { key: 'player_sprite_death', path: 'assets/neo-jump/player-death.png' },
];

const PLATFORM_SPRITES = [
  { key: 'platform_sprite_normal', path: 'assets/neo-jump/platform-normal.png' },
  { key: 'platform_sprite_moving', path: 'assets/neo-jump/platform-moving.png' },
  { key: 'platform_sprite_spring', path: 'assets/neo-jump/platform-spring.png' },
  { key: 'platform_sprite_disappearing', path: 'assets/neo-jump/platform-disappearing.png' },
  { key: 'platform_sprite_breakable', path: 'assets/neo-jump/platform-breakable.png' },
];

const ENEMY_SPRITE = { key: 'enemy_sprite', path: 'assets/neo-jump/enemy.png' };

export class NeoJumpBootScene extends BootScene {
  constructor() {
    super({
      key: SCENE_KEYS.BOOT,
      nextScene: SCENE_KEYS.MENU,
    });
  }

  protected loadCommonAssets(): void {
    for (const { key, path } of PLAYER_SPRITES) {
      this.load.image(key, path);
    }
    for (const { key, path } of PLATFORM_SPRITES) {
      this.load.image(key, path);
    }
    this.load.image(ENEMY_SPRITE.key, ENEMY_SPRITE.path);
  }

  create(): void {
    const playerSpritesLoaded = this.textures.exists('player_sprite_idle');
    this.game.registry.set('playerSpriteMode', playerSpritesLoaded);

    const platformSpritesLoaded = this.textures.exists('platform_sprite_normal');
    this.game.registry.set('platformSpriteMode', platformSpritesLoaded);

    const enemySpriteLoaded = this.textures.exists('enemy_sprite');
    this.game.registry.set('enemySpriteMode', enemySpriteLoaded);

    this.createPlatformTextures();
    this.createPlayerTexture();
    this.createProjectileTexture();
    this.createEnemyTexture();

    super.create();
  }

  private createPlayerTexture(): void {
    if (this.textures.exists('player_sprite_idle')) return;

    const g = this.add.graphics();
    const w = GAME_CONFIG.PLAYER.WIDTH;
    const h = GAME_CONFIG.PLAYER.HEIGHT;

    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillRoundedRect(4, 0, w - 8, h * 0.6, 4);
    g.fillStyle(0x00cc00, 1);
    g.fillCircle(w / 2, h * 0.15, 6);
    g.fillStyle(0x006600, 1);
    g.fillRect(8, h * 0.6, 6, h * 0.3);
    g.fillRect(w - 14, h * 0.6, 6, h * 0.3);
    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillRect(0, h * 0.25, 6, 4);
    g.fillRect(w - 6, h * 0.25, 6, 4);

    g.generateTexture('player_idle', w, h);
    g.destroy();
  }

  private createPlatformTextures(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG.PLATFORMS;

    if (!this.textures.exists('platform_sprite_normal')) {
      this.createPlatformTexture('platform_normal', MATRIX_COLORS.PRIMARY, WIDTH, HEIGHT);
    }
    if (!this.textures.exists('platform_sprite_moving')) {
      this.createPlatformTexture('platform_moving', MATRIX_COLORS.CYAN, WIDTH, HEIGHT);
    }
    if (!this.textures.exists('platform_sprite_spring')) {
      this.createSpringPlatformTexture('platform_spring', WIDTH, HEIGHT);
    }
    if (!this.textures.exists('platform_sprite_disappearing')) {
      this.createPlatformTexture('platform_disappearing', 0x888888, WIDTH, HEIGHT);
    }
    if (!this.textures.exists('platform_sprite_breakable')) {
      this.createPlatformTexture('platform_breakable', 0xff6600, WIDTH, HEIGHT);
    }
  }

  private createPlatformTexture(key: string, color: number, width: number, height: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, width, height, 4);
    g.fillStyle(0xffffff, 0.3);
    g.fillRoundedRect(2, 2, width - 4, 4, 2);
    g.lineStyle(1, 0x000000, 0.5);
    g.strokeRoundedRect(0, 0, width, height, 4);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private createSpringPlatformTexture(key: string, width: number, height: number): void {
    const g = this.add.graphics();
    g.fillStyle(MATRIX_COLORS.YELLOW, 1);
    g.fillRoundedRect(0, 0, width, height, 4);
    g.lineStyle(2, 0xff0000, 1);
    const coilWidth = 20;
    const startX = (width - coilWidth) / 2;
    for (let i = 0; i < 4; i++) {
      g.lineBetween(startX + i * 5, height / 2 - 3, startX + i * 5 + 5, height / 2 + 3);
    }
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private createProjectileTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(MATRIX_COLORS.CYAN, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 3, 2);
    g.generateTexture('projectile', 8, 8);
    g.destroy();
  }

  private createEnemyTexture(): void {
    if (this.textures.exists('enemy_sprite')) return;

    const g = this.add.graphics();
    g.fillStyle(0xff0000, 1);
    g.fillCircle(20, 20, 18);
    g.lineStyle(2, 0x880000, 1);
    g.strokeCircle(20, 20, 18);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(14, 16, 4);
    g.fillCircle(26, 16, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(14, 16, 2);
    g.fillCircle(26, 16, 2);
    g.lineStyle(2, 0x000000, 1);
    g.lineBetween(10, 10, 18, 13);
    g.lineBetween(30, 10, 22, 13);
    g.generateTexture('enemy', 40, 40);
    g.destroy();
  }
}
