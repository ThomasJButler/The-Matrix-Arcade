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
const FLYING_ENEMY_SPRITE = { key: 'enemy_flying_sprite', path: 'assets/neo-jump/enemy-flying.png' };
const PROJECTILE_SPRITE = { key: 'projectile_sprite', path: 'assets/neo-jump/projectile.png' };

const COLLECTIBLE_SPRITES = [
  { key: 'collectible_sprite_fuel', path: 'assets/neo-jump/collectible-fuel.png' },
  { key: 'collectible_sprite_score', path: 'assets/neo-jump/collectible-score.png' },
  { key: 'collectible_sprite_shield', path: 'assets/neo-jump/collectible-shield.png' },
];

const JETPACK_FLAME_SPRITE = { key: 'jetpack_flame_sprite', path: 'assets/neo-jump/jetpack-flame.png' };

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
    this.load.image(FLYING_ENEMY_SPRITE.key, FLYING_ENEMY_SPRITE.path);
    this.load.image(PROJECTILE_SPRITE.key, PROJECTILE_SPRITE.path);
    for (const { key, path } of COLLECTIBLE_SPRITES) {
      this.load.image(key, path);
    }
    this.load.image(JETPACK_FLAME_SPRITE.key, JETPACK_FLAME_SPRITE.path);
  }

  create(): void {
    const playerSpritesLoaded = this.textures.exists('player_sprite_idle');
    this.game.registry.set('playerSpriteMode', playerSpritesLoaded);

    const platformSpritesLoaded = this.textures.exists('platform_sprite_normal');
    this.game.registry.set('platformSpriteMode', platformSpritesLoaded);

    const enemySpriteLoaded = this.textures.exists('enemy_sprite');
    this.game.registry.set('enemySpriteMode', enemySpriteLoaded);

    const flyingEnemySpriteLoaded = this.textures.exists('enemy_flying_sprite');
    this.game.registry.set('flyingEnemySpriteMode', flyingEnemySpriteLoaded);

    const projectileSpriteLoaded = this.textures.exists('projectile_sprite');
    this.game.registry.set('projectileSpriteMode', projectileSpriteLoaded);

    const collectibleSpritesLoaded = this.textures.exists('collectible_sprite_fuel');
    this.game.registry.set('collectibleSpriteMode', collectibleSpritesLoaded);

    this.createPlatformTextures();
    this.createPlayerTexture();
    this.createProjectileTexture();
    this.createEnemyTexture();
    this.createCollectibleTextures();
    this.createJetpackFlameTexture();
    this.createParallaxTextures();

    super.create();
  }

  private createPlayerTexture(): void {
    if (this.textures.exists('player_sprite_idle')) return;

    const g = this.add.graphics();
    const w = GAME_CONFIG.PLAYER.WIDTH;
    const h = GAME_CONFIG.PLAYER.HEIGHT;

    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillRoundedRect(4, 0, w - 8, h * 0.6, 4);
    g.fillStyle(MATRIX_COLORS.MEDIUM_GREEN, 1);
    g.fillCircle(w / 2, h * 0.15, 6);
    g.fillStyle(MATRIX_COLORS.DEEP_GREEN, 1);
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
    if (this.textures.exists('projectile_sprite')) return;

    const g = this.add.graphics();
    g.fillStyle(MATRIX_COLORS.CYAN, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 3, 2);
    g.generateTexture('projectile', 8, 8);
    g.destroy();
  }

  private createCollectibleTextures(): void {
    const size = 24;

    if (!this.textures.exists('collectible_sprite_fuel')) {
      const g = this.add.graphics();
      g.fillStyle(MATRIX_COLORS.CYAN, 1);
      g.fillRoundedRect(2, 2, size - 4, size - 4, 4);
      g.fillStyle(0xffffff, 1);
      g.fillRect(8, 6, 8, 4);
      g.fillRect(10, 4, 4, 8);
      g.generateTexture('collectible_fuel', size, size);
      g.destroy();
    }

    if (!this.textures.exists('collectible_sprite_score')) {
      const g = this.add.graphics();
      g.fillStyle(MATRIX_COLORS.YELLOW, 1);
      g.fillCircle(size / 2, size / 2, size / 2 - 2);
      g.fillStyle(0x000000, 1);
      g.fillRect(9, 7, 6, 10);
      g.generateTexture('collectible_score', size, size);
      g.destroy();
    }

    if (!this.textures.exists('collectible_sprite_shield')) {
      const g = this.add.graphics();
      g.fillStyle(MATRIX_COLORS.MAGENTA, 1);
      g.fillTriangle(size / 2, 2, 2, size - 2, size - 2, size - 2);
      g.fillStyle(0xffffff, 0.5);
      g.fillTriangle(size / 2, 6, 6, size - 4, size - 6, size - 4);
      g.generateTexture('collectible_shield', size, size);
      g.destroy();
    }
  }

  private createJetpackFlameTexture(): void {
    if (this.textures.exists('jetpack_flame_sprite')) return;

    const g = this.add.graphics();
    g.fillStyle(0xff6600, 1);
    g.fillTriangle(8, 0, 0, 16, 16, 16);
    g.fillStyle(MATRIX_COLORS.YELLOW, 1);
    g.fillTriangle(8, 4, 3, 14, 13, 14);
    g.generateTexture('jetpack_flame', 16, 16);
    g.destroy();
  }

  private createEnemyTexture(): void {
    if (this.textures.exists('enemy_sprite')) return;

    const g = this.add.graphics();
    g.fillStyle(0xff0000, 1);
    g.fillCircle(14, 14, 12);
    g.lineStyle(2, 0x880000, 1);
    g.strokeCircle(14, 14, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(9, 11, 3);
    g.fillCircle(19, 11, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(9, 11, 1);
    g.fillCircle(19, 11, 1);
    g.lineStyle(2, 0x000000, 1);
    g.lineBetween(7, 7, 12, 9);
    g.lineBetween(21, 7, 16, 9);
    g.generateTexture('enemy', 28, 28);
    g.destroy();
  }

  private createParallaxTextures(): void {
    const W = 400;
    const H = 300;

    // Skyline — tall building silhouettes
    const sky = this.add.graphics();
    const skyBuildings = [
      { x: 10, w: 40, h: 220 }, { x: 70, w: 35, h: 180 }, { x: 130, w: 50, h: 260 },
      { x: 200, w: 30, h: 150 }, { x: 250, w: 45, h: 240 }, { x: 320, w: 55, h: 200 },
      { x: 380, w: 20, h: 170 },
    ];
    sky.fillStyle(0x004400, 0.4);
    for (const b of skyBuildings) {
      sky.fillRect(b.x, H - b.h, b.w, b.h);
    }
    sky.generateTexture('skyline', W, H);
    sky.destroy();

    // Mid buildings — medium structures with window dots
    const mid = this.add.graphics();
    const midBuildings = [
      { x: 5, w: 30, h: 120 }, { x: 50, w: 45, h: 160 }, { x: 110, w: 35, h: 100 },
      { x: 160, w: 50, h: 140 }, { x: 230, w: 40, h: 180 }, { x: 290, w: 30, h: 110 },
      { x: 340, w: 55, h: 150 }, { x: 390, w: 10, h: 90 },
    ];
    mid.fillStyle(MATRIX_COLORS.DEEP_GREEN, 0.35);
    for (const b of midBuildings) {
      mid.fillRect(b.x, H - b.h, b.w, b.h);
      mid.fillStyle(MATRIX_COLORS.FOREST_GREEN, 0.3);
      for (let wy = H - b.h + 8; wy < H - 4; wy += 16) {
        for (let wx = b.x + 5; wx < b.x + b.w - 3; wx += 10) {
          mid.fillRect(wx, wy, 4, 6);
        }
      }
      mid.fillStyle(MATRIX_COLORS.DEEP_GREEN, 0.35);
    }
    mid.generateTexture('mid_buildings', W, H);
    mid.destroy();

    // Near arches — rounded column structures
    const arch = this.add.graphics();
    arch.fillStyle(MATRIX_COLORS.DIM_GREEN, 0.2);
    const archPositions = [30, 130, 230, 330];
    for (const ax of archPositions) {
      arch.fillRect(ax, 80, 12, 220);
      arch.fillRect(ax + 28, 80, 12, 220);
      arch.fillStyle(MATRIX_COLORS.DIM_GREEN, 0.15);
      arch.fillCircle(ax + 20, 80, 20);
      arch.fillStyle(0x000000, 1);
      arch.fillCircle(ax + 20, 80, 10);
      arch.fillStyle(MATRIX_COLORS.DIM_GREEN, 0.2);
    }
    arch.generateTexture('near_arches', W, H);
    arch.destroy();
  }
}
