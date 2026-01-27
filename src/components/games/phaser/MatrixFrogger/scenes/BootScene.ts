/**
 * Matrix Frogger - Boot Scene
 *
 * Loads all game assets with Matrix-themed loading screen.
 */

import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';

export class FroggerBootScene extends BootScene {
  constructor() {
    super({
      key: SCENE_KEYS.BOOT,
      nextScene: SCENE_KEYS.MENU,
    });
  }

  preload(): void {
    // Call parent to show loading screen
    super.preload();

    // Load player spritesheet (128x64, 2 frames of 64x64)
    this.load.spritesheet('player', '/assets/TopView_Robot_Asset_Pack/Player.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Load enemy sprites - using individual static sprites
    // We'll create colored rectangles as fallback if images don't load
    this.load.image('enemy_agent', '/assets/TopView_Robot_Asset_Pack/EnemyId_10006_origin.png');
    this.load.image(
      'enemy_sentinel',
      '/assets/TopView_Robot_Asset_Pack/EnemyId_140012_origin.png'
    );

    // Load death animation (512x64, 8 frames of 64x64)
    this.load.spritesheet(
      'enemy_death',
      '/assets/TopView_Robot_Asset_Pack/Animation_Sheet/Enemy_dead_10006.png',
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );

    // Create pill textures programmatically (will be done in create)
    // These are simple colored circles
  }

  create(): void {
    // Create pill textures
    this.createPillTextures();

    // Create player animations
    this.createAnimations();

    // Call parent create to transition to next scene
    super.create();
  }

  /**
   * Create pill pickup textures programmatically
   */
  private createPillTextures(): void {
    // Red pill (points)
    const redPill = this.add.graphics();
    redPill.fillStyle(0xff0000, 1);
    redPill.fillCircle(12, 12, 10);
    redPill.fillStyle(0xff6666, 1);
    redPill.fillCircle(9, 9, 4);
    redPill.generateTexture('red_pill', 24, 24);
    redPill.destroy();

    // Blue pill (power-up)
    const bluePill = this.add.graphics();
    bluePill.fillStyle(0x0066ff, 1);
    bluePill.fillCircle(12, 12, 10);
    bluePill.fillStyle(0x66aaff, 1);
    bluePill.fillCircle(9, 9, 4);
    bluePill.generateTexture('blue_pill', 24, 24);
    bluePill.destroy();

    // Power-up indicators
    const powerupColors = {
      bullet_time: MATRIX_COLORS.YELLOW,
      ghost: MATRIX_COLORS.CYAN,
      shield: MATRIX_COLORS.PRIMARY,
      magnet: MATRIX_COLORS.MAGENTA,
    };

    Object.entries(powerupColors).forEach(([name, color]) => {
      const g = this.add.graphics();
      g.fillStyle(color, 0.8);
      g.fillRoundedRect(0, 0, 32, 32, 4);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeRoundedRect(0, 0, 32, 32, 4);
      g.generateTexture(`powerup_${name}`, 32, 32);
      g.destroy();
    });
  }

  /**
   * Create sprite animations
   */
  private createAnimations(): void {
    // Player idle animation (frame 0)
    this.anims.create({
      key: 'player_idle',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });

    // Player hop animation (frame 0 to 1)
    this.anims.create({
      key: 'player_hop',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
      frameRate: 8,
      repeat: 0,
    });

    // Enemy death animation
    this.anims.create({
      key: 'enemy_death',
      frames: this.anims.generateFrameNumbers('enemy_death', { start: 0, end: 7 }),
      frameRate: 16,
      repeat: 0,
      hideOnComplete: true,
    });
  }
}
