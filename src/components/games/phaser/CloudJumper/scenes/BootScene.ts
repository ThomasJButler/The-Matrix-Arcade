/**
 * Cloud Jumper - Boot Scene
 */

import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG } from '../config';

const CLOUD_SPRITES = [
  { key: 'cloud_sprite_normal', path: 'assets/cloud-jumper/cloud-wide.png' },
  { key: 'cloud_sprite_moving', path: 'assets/cloud-jumper/cloud-compact.png' },
  { key: 'cloud_sprite_disappearing', path: 'assets/cloud-jumper/cloud-small.png' },
  { key: 'cloud_sprite_storm', path: 'assets/cloud-jumper/cloud-peak.png' },
];

const PLAYER_SPRITES = [
  { key: 'player_sprite_idle', path: 'assets/cloud-jumper/player-idle.png' },
  { key: 'player_sprite_jump', path: 'assets/cloud-jumper/player-jump.png' },
  { key: 'player_sprite_fall', path: 'assets/cloud-jumper/player-fall.png' },
];

const COLLECTIBLE_SPRITES = [
  { key: 'collectible_sprite_coin', path: 'assets/cloud-jumper/collectible-coin.png' },
  { key: 'collectible_sprite_gem', path: 'assets/cloud-jumper/collectible-gem.png' },
  { key: 'collectible_sprite_star', path: 'assets/cloud-jumper/collectible-star.png' },
];

const OBSTACLE_SPRITES = [
  { key: 'obstacle_sprite_bird', path: 'assets/cloud-jumper/obstacle-bird.png' },
  { key: 'obstacle_sprite_plane', path: 'assets/cloud-jumper/obstacle-plane.png' },
];

const BG_SPRITES = [
  { key: 'bg_sprite_cloud1', path: 'assets/cloud-jumper/bg_cloud1.png' },
  { key: 'bg_sprite_cloud2', path: 'assets/cloud-jumper/bg_cloud2.png' },
];

export class CloudJumperBootScene extends BootScene {
  constructor() {
    super({
      key: SCENE_KEYS.BOOT,
      nextScene: SCENE_KEYS.MENU,
    });
  }

  protected loadCommonAssets(): void {
    this.load.image('cloud_base', '/assets/Treasure Hunters/Palm Tree Island/Sprites/Background/Big Clouds.png');
    for (const { key, path } of CLOUD_SPRITES) {
      this.load.image(key, path);
    }
    for (const { key, path } of PLAYER_SPRITES) {
      this.load.image(key, path);
    }
    for (const { key, path } of COLLECTIBLE_SPRITES) {
      this.load.image(key, path);
    }
    for (const { key, path } of OBSTACLE_SPRITES) {
      this.load.image(key, path);
    }
    for (const { key, path } of BG_SPRITES) {
      this.load.image(key, path);
    }
  }

  create(): void {
    const spritesLoaded = this.textures.exists('cloud_sprite_normal');
    this.game.registry.set('spriteMode', spritesLoaded);

    const playerSpritesLoaded = this.textures.exists('player_sprite_idle');
    this.game.registry.set('playerSpriteMode', playerSpritesLoaded);

    const collectibleSpritesLoaded = this.textures.exists('collectible_sprite_coin');
    this.game.registry.set('collectibleSpriteMode', collectibleSpritesLoaded);

    const obstacleSpritesLoaded = this.textures.exists('obstacle_sprite_bird');
    this.game.registry.set('obstacleSpriteMode', obstacleSpritesLoaded);

    const bgSpritesLoaded = this.textures.exists('bg_sprite_cloud1');
    this.game.registry.set('bgSpriteMode', bgSpritesLoaded);

    this.createPlayerTexture();
    if (!spritesLoaded) {
      this.createCloudTextures();
    }
    if (!collectibleSpritesLoaded) {
      this.createCollectibleTextures();
    }
    if (!obstacleSpritesLoaded) {
      this.createObstacleTextures();
    }
    if (!bgSpritesLoaded) {
      this.createBackgroundLayers();
    }

    super.create();
  }

  /**
   * Create player sprite texture
   */
  private createPlayerTexture(): void {
    const g = this.add.graphics();
    const size = GAME_CONFIG.PLAYER.WIDTH;

    // Matrix-themed character — green figure
    g.fillStyle(MATRIX_COLORS.MEDIUM_GREEN, 1);
    // Body
    g.fillRoundedRect(8, 12, 16, 16, 4);
    // Head
    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillCircle(16, 8, 6);
    // Legs
    g.fillStyle(MATRIX_COLORS.DEEP_GREEN, 1);
    g.fillRect(10, 26, 4, 6);
    g.fillRect(18, 26, 4, 6);
    // Arms (spread for flying pose)
    g.fillStyle(MATRIX_COLORS.MEDIUM_GREEN, 1);
    g.fillRect(2, 14, 8, 4);
    g.fillRect(22, 14, 8, 4);

    g.generateTexture('player', size, size);
    g.destroy();

    // Player falling texture
    const fg = this.add.graphics();
    fg.fillStyle(MATRIX_COLORS.MEDIUM_GREEN, 1);
    fg.fillRoundedRect(8, 12, 16, 16, 4);
    fg.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    fg.fillCircle(16, 8, 6);
    fg.fillStyle(MATRIX_COLORS.DEEP_GREEN, 1);
    fg.fillRect(10, 26, 4, 6);
    fg.fillRect(18, 26, 4, 6);
    // Arms up
    fg.fillStyle(MATRIX_COLORS.MEDIUM_GREEN, 1);
    fg.fillRect(6, 4, 4, 10);
    fg.fillRect(22, 4, 4, 10);
    fg.generateTexture('player_fall', size, size);
    fg.destroy();

    // Player death texture — glitch/dissolve effect
    const dg = this.add.graphics();
    // Fragmented body — glitch blocks scattered
    dg.fillStyle(0x660000, 0.8);
    dg.fillRect(6, 10, 8, 8);
    dg.fillRect(18, 14, 6, 6);
    dg.fillRect(10, 22, 10, 4);
    // Static noise fragments
    dg.fillStyle(MATRIX_COLORS.PRIMARY, 0.4);
    dg.fillRect(4, 6, 4, 4);
    dg.fillRect(24, 8, 4, 4);
    dg.fillRect(14, 2, 4, 4);
    dg.fillStyle(0xff0000, 0.6);
    dg.fillRect(12, 16, 4, 4);
    dg.fillRect(20, 22, 4, 4);
    // X-eyes
    dg.lineStyle(2, 0xff0000, 1);
    dg.lineBetween(12, 6, 16, 10);
    dg.lineBetween(16, 6, 12, 10);
    dg.lineBetween(20, 6, 24, 10);
    dg.lineBetween(24, 6, 20, 10);
    dg.generateTexture('player_dead', size, size);
    dg.destroy();
  }

  /**
   * Create cloud textures
   */
  private createCloudTextures(): void {
    const types = ['normal', 'moving', 'disappearing', 'storm'];
    // Matrix palette: green, cyan, dim green (fragile), dark red (danger)
    const colors = [MATRIX_COLORS.MEDIUM_GREEN, 0x00dddd, 0x338833, 0x663333];
    const highlights = [0x00ff00, 0x00ffff, 0x66aa66, 0x442222];

    types.forEach((type, index) => {
      const g = this.add.graphics();
      const width = 120;
      const height = GAME_CONFIG.CLOUDS.HEIGHT;

      // Cloud shape - fluffy
      g.fillStyle(colors[index], 1);

      // Main body
      g.fillEllipse(width / 2, height / 2, width * 0.8, height * 0.8);

      // Bumps
      g.fillEllipse(width * 0.25, height * 0.4, width * 0.4, height * 0.6);
      g.fillEllipse(width * 0.75, height * 0.4, width * 0.4, height * 0.6);
      g.fillEllipse(width * 0.5, height * 0.3, width * 0.5, height * 0.5);

      // Highlight
      g.fillStyle(highlights[index], 0.4);
      g.fillEllipse(width * 0.4, height * 0.35, width * 0.3, height * 0.25);

      // Storm cloud has dark bottom
      if (type === 'storm') {
        g.fillStyle(0x440000, 0.5);
        g.fillEllipse(width / 2, height * 0.7, width * 0.7, height * 0.4);
      }

      g.generateTexture(`cloud_${type}`, width, height);
      g.destroy();
    });
  }

  /**
   * Create collectible textures
   */
  private createCollectibleTextures(): void {
    // Star — cyan glow
    const sg = this.add.graphics();
    sg.fillStyle(0x00ffff, 1);
    this.drawStar(sg, 12, 12, 5, 10, 5);
    sg.generateTexture('star', 24, 24);
    sg.destroy();

    // Gem — green crystal
    const gg = this.add.graphics();
    gg.fillStyle(0x00ff66, 1);
    gg.beginPath();
    gg.moveTo(12, 2);
    gg.lineTo(22, 10);
    gg.lineTo(12, 22);
    gg.lineTo(2, 10);
    gg.closePath();
    gg.fillPath();
    gg.fillStyle(MATRIX_COLORS.PRIMARY, 0.5);
    gg.fillTriangle(12, 4, 8, 10, 12, 10);
    gg.generateTexture('gem', 24, 24);
    gg.destroy();

    // Coin — green data token
    const cg = this.add.graphics();
    cg.fillStyle(MATRIX_COLORS.MEDIUM_GREEN, 1);
    cg.fillCircle(12, 12, 10);
    cg.fillStyle(MATRIX_COLORS.FOREST_GREEN, 1);
    cg.fillCircle(12, 12, 7);
    cg.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    cg.fillCircle(12, 12, 5);
    cg.generateTexture('coin', 24, 24);
    cg.destroy();
  }

  /**
   * Draw star shape
   */
  private drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, points: number, outer: number, inner: number): void {
    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) {
        g.moveTo(x, y);
      } else {
        g.lineTo(x, y);
      }
    }
    g.closePath();
    g.fillPath();
  }

  /**
   * Create obstacle textures — Matrix-coded dangers
   */
  private createObstacleTextures(): void {
    // Bird — dark sentinel
    const bg = this.add.graphics();
    bg.fillStyle(0x660000, 1);
    // Body
    bg.fillEllipse(20, 16, 24, 16);
    // Wing
    bg.fillTriangle(12, 8, 28, 8, 20, 0);
    // Beak
    bg.fillStyle(0xff0000, 1);
    bg.fillTriangle(32, 16, 40, 14, 32, 12);
    // Eye
    bg.fillStyle(0xff0000, 1);
    bg.fillCircle(26, 14, 3);
    bg.fillStyle(0x000000, 1);
    bg.fillCircle(27, 14, 1.5);
    bg.generateTexture('bird', 40, 32);
    bg.destroy();

    // Plane — dark machine
    const pg = this.add.graphics();
    pg.fillStyle(0x444444, 1);
    // Fuselage
    pg.fillEllipse(30, 20, 50, 16);
    // Wing
    pg.fillRect(15, 12, 30, 6);
    // Tail
    pg.fillTriangle(5, 20, 15, 10, 15, 20);
    // Windows — red glow
    pg.fillStyle(0xff0000, 1);
    pg.fillCircle(35, 18, 3);
    pg.fillCircle(42, 18, 3);
    pg.fillCircle(49, 18, 3);
    pg.generateTexture('plane', 60, 40);
    pg.destroy();
  }

  /**
   * Create parallax background layers
   */
  private createBackgroundLayers(): void {
    // Far clouds — faint green haze
    const fc = this.add.graphics();
    fc.fillStyle(0x003300, 0.4);
    for (let i = 0; i < 5; i++) {
      const x = i * 200 + 50;
      fc.fillEllipse(x, 50, 100, 40);
      fc.fillEllipse(x + 30, 60, 60, 30);
    }
    fc.generateTexture('bg_far', GAME_CONFIG.WIDTH * 2, 150);
    fc.destroy();

    // Mid clouds — subtle green wisps
    const mc = this.add.graphics();
    mc.fillStyle(0x004400, 0.5);
    for (let i = 0; i < 4; i++) {
      const x = i * 250 + 100;
      mc.fillEllipse(x, 40, 80, 35);
      mc.fillEllipse(x + 25, 50, 50, 25);
    }
    mc.generateTexture('bg_mid', GAME_CONFIG.WIDTH * 2, 100);
    mc.destroy();

    // Near clouds — visible green shapes
    const nc = this.add.graphics();
    nc.fillStyle(0x005500, 0.6);
    for (let i = 0; i < 3; i++) {
      const x = i * 300 + 150;
      nc.fillEllipse(x, 30, 60, 25);
    }
    nc.generateTexture('bg_near', GAME_CONFIG.WIDTH * 2, 60);
    nc.destroy();
  }
}
