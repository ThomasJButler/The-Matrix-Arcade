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

    // Load vehicle sprites for road lane variety (16x16 pixel art)
    const vehicleKeys = ['vehicle_car1', 'vehicle_car2', 'vehicle_car3', 'vehicle_truck', 'vehicle_tractor'];
    for (const key of vehicleKeys) {
      this.load.image(key, `/assets/matrix-frogger/${key}.png`);
    }
  }

  create(): void {
    // Create pill textures
    this.createPillTextures();

    // Create ability textures
    this.createAbilityTextures();

    // Create vehicle fallback textures (skipped if sprites loaded)
    this.createVehicleTextures();

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
   * Create procedural fallbacks for vehicle sprites if image loading failed.
   */
  private createVehicleTextures(): void {
    const vehicles: Array<{ key: string; w: number; h: number; color: number }> = [
      { key: 'vehicle_car1', w: 16, h: 16, color: 0xcc3333 },
      { key: 'vehicle_car2', w: 16, h: 16, color: 0x3366cc },
      { key: 'vehicle_car3', w: 16, h: 16, color: 0x33cc33 },
      { key: 'vehicle_truck', w: 32, h: 16, color: 0x66aa66 },
      { key: 'vehicle_tractor', w: 16, h: 16, color: 0x999999 },
    ];

    for (const { key, w, h, color } of vehicles) {
      if (this.textures.exists(key)) continue;
      const g = this.add.graphics();
      g.fillStyle(color, 1);
      g.fillRect(1, 2, w - 2, h - 4);
      g.fillStyle(0x222222, 1);
      g.fillCircle(4, h - 2, 2);
      g.fillCircle(w - 4, h - 2, 2);
      g.generateTexture(key, w, h);
      g.destroy();
    }
  }

  /**
   * Create Kung Fu and NEO mode textures
   */
  private createAbilityTextures(): void {
    // Kung Fu charge icon (fist shape)
    const fist = this.add.graphics();
    fist.fillStyle(MATRIX_COLORS.YELLOW, 1);
    fist.fillCircle(12, 12, 10);
    fist.fillStyle(0xffff66, 1);
    fist.fillCircle(10, 10, 4);
    fist.lineStyle(2, 0x888800, 1);
    fist.strokeCircle(12, 12, 10);
    fist.generateTexture('kung_fu_icon', 24, 24);
    fist.destroy();

    // Kung Fu empty charge icon (dimmed)
    const fistEmpty = this.add.graphics();
    fistEmpty.fillStyle(0x333300, 0.5);
    fistEmpty.fillCircle(12, 12, 10);
    fistEmpty.lineStyle(1, 0x555500, 0.5);
    fistEmpty.strokeCircle(12, 12, 10);
    fistEmpty.generateTexture('kung_fu_icon_empty', 24, 24);
    fistEmpty.destroy();

    // NEO mode pickup (golden/cyan glowing orb)
    const neo = this.add.graphics();
    neo.fillStyle(MATRIX_COLORS.CYAN, 0.3);
    neo.fillCircle(16, 16, 14);
    neo.fillStyle(MATRIX_COLORS.CYAN, 0.7);
    neo.fillCircle(16, 16, 10);
    neo.fillStyle(0xffffff, 1);
    neo.fillCircle(14, 14, 4);
    neo.generateTexture('neo_pickup', 32, 32);
    neo.destroy();

    // NEO mode power-up indicator
    const neoIcon = this.add.graphics();
    neoIcon.fillStyle(MATRIX_COLORS.CYAN, 0.8);
    neoIcon.fillRoundedRect(0, 0, 32, 32, 4);
    neoIcon.lineStyle(2, 0xffffff, 1);
    neoIcon.strokeRoundedRect(0, 0, 32, 32, 4);
    neoIcon.generateTexture('powerup_neo_mode', 32, 32);
    neoIcon.destroy();
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
