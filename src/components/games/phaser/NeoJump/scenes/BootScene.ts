/**
 * Neo Jump - Boot Scene
 *
 * Loads all game assets with Matrix-themed loading screen.
 */

import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG } from '../config';

export class NeoJumpBootScene extends BootScene {
  constructor() {
    super({
      key: SCENE_KEYS.BOOT,
      nextScene: SCENE_KEYS.MENU,
    });
  }

  preload(): void {
    super.preload();

    // Load character spritesheets from Legacy Fantasy
    this.load.spritesheet(
      'player_idle',
      '/assets/Legacy-Fantasy - High Forest 2.3/Character/Idle/Idle-Sheet.png',
      { frameWidth: 32, frameHeight: 80 }
    );

    this.load.spritesheet(
      'player_jump',
      '/assets/Legacy-Fantasy - High Forest 2.3/Character/Jumlp-All/Jump-All-Sheet.png',
      { frameWidth: 80, frameHeight: 64 }
    );

    this.load.spritesheet(
      'player_dead',
      '/assets/Legacy-Fantasy - High Forest 2.3/Character/Dead/Dead-Sheet.png',
      { frameWidth: 80, frameHeight: 64 }
    );
  }

  create(): void {
    // Create platform textures
    this.createPlatformTextures();

    // Create player animations
    this.createAnimations();

    // Create projectile texture
    this.createProjectileTexture();

    // Create enemy texture
    this.createEnemyTexture();

    // Call parent to transition
    super.create();
  }

  /**
   * Create platform textures programmatically
   */
  private createPlatformTextures(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG.PLATFORMS;

    // Normal platform - green
    this.createPlatformTexture('platform_normal', MATRIX_COLORS.PRIMARY, WIDTH, HEIGHT);

    // Moving platform - cyan
    this.createPlatformTexture('platform_moving', MATRIX_COLORS.CYAN, WIDTH, HEIGHT);

    // Spring platform - yellow with spring indicator
    this.createSpringPlatformTexture('platform_spring', WIDTH, HEIGHT);

    // Disappearing platform - white/faded
    this.createPlatformTexture('platform_disappearing', 0x888888, WIDTH, HEIGHT);

    // Breakable platform - red/orange
    this.createPlatformTexture('platform_breakable', 0xff6600, WIDTH, HEIGHT);
  }

  /**
   * Create a basic platform texture
   */
  private createPlatformTexture(key: string, color: number, width: number, height: number): void {
    const g = this.add.graphics();

    // Main body
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, width, height, 4);

    // Highlight
    g.fillStyle(0xffffff, 0.3);
    g.fillRoundedRect(2, 2, width - 4, 4, 2);

    // Border
    g.lineStyle(1, 0x000000, 0.5);
    g.strokeRoundedRect(0, 0, width, height, 4);

    g.generateTexture(key, width, height);
    g.destroy();
  }

  /**
   * Create spring platform texture with bounce indicator
   */
  private createSpringPlatformTexture(key: string, width: number, height: number): void {
    const g = this.add.graphics();

    // Main body - yellow
    g.fillStyle(MATRIX_COLORS.YELLOW, 1);
    g.fillRoundedRect(0, 0, width, height, 4);

    // Spring coil indicator
    g.lineStyle(2, 0xff0000, 1);
    const coilWidth = 20;
    const startX = (width - coilWidth) / 2;
    for (let i = 0; i < 4; i++) {
      g.lineBetween(startX + i * 5, height / 2 - 3, startX + i * 5 + 5, height / 2 + 3);
    }

    g.generateTexture(key, width, height);
    g.destroy();
  }

  /**
   * Create projectile texture
   */
  private createProjectileTexture(): void {
    const g = this.add.graphics();

    // Bullet shape
    g.fillStyle(MATRIX_COLORS.CYAN, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 3, 2);

    g.generateTexture('projectile', 8, 8);
    g.destroy();
  }

  /**
   * Create enemy texture
   */
  private createEnemyTexture(): void {
    const g = this.add.graphics();

    // Enemy body - menacing red circle with eyes
    g.fillStyle(0xff0000, 1);
    g.fillCircle(20, 20, 18);

    // Dark outline
    g.lineStyle(2, 0x880000, 1);
    g.strokeCircle(20, 20, 18);

    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(14, 16, 4);
    g.fillCircle(26, 16, 4);

    // Pupils
    g.fillStyle(0x000000, 1);
    g.fillCircle(14, 16, 2);
    g.fillCircle(26, 16, 2);

    // Angry eyebrows
    g.lineStyle(2, 0x000000, 1);
    g.lineBetween(10, 10, 18, 13);
    g.lineBetween(30, 10, 22, 13);

    g.generateTexture('enemy', 40, 40);
    g.destroy();
  }

  /**
   * Create sprite animations
   */
  private createAnimations(): void {
    // Player idle
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });

    // Player jump
    this.anims.create({
      key: 'player_jump',
      frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 3 }),
      frameRate: 12,
      repeat: 0,
    });

    // Player fall
    this.anims.create({
      key: 'player_fall',
      frames: this.anims.generateFrameNumbers('player_jump', { start: 4, end: 7 }),
      frameRate: 8,
      repeat: 0,
    });

    // Player death
    this.anims.create({
      key: 'player_death',
      frames: this.anims.generateFrameNumbers('player_dead', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: 0,
      hideOnComplete: true,
    });
  }
}
