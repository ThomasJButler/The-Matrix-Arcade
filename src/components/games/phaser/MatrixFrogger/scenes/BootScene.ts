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
    super.preload();

    // Load frog pixel art sprites (16x16, scaled to 64x64 in-game)
    this.load.image('frog_idle', '/assets/matrix-frogger/frog_idle.png');
    this.load.image('frog_hop', '/assets/matrix-frogger/frog_hop.png');
    this.load.image('fly_sprite', '/assets/matrix-frogger/fly.png');

    // Load flower ground tiles for safe zones (16x16 pixel art)
    this.load.image('flower_ground_1', '/assets/matrix-frogger/flower_ground_1.png');
    this.load.image('flower_ground_2', '/assets/matrix-frogger/flower_ground_2.png');

    // Load vehicle sprites for road lane variety (16x16 pixel art)
    const vehicleKeys = ['vehicle_car1', 'vehicle_car2', 'vehicle_car3', 'vehicle_truck', 'vehicle_tractor'];
    for (const key of vehicleKeys) {
      this.load.image(key, `/assets/matrix-frogger/${key}.png`);
    }

    // Load Neo player sprites (24x24 Cyberpunk pixel art)
    this.load.image('neo_idle', '/assets/matrix-frogger/neo_idle.png');
    this.load.image('neo_hop', '/assets/matrix-frogger/neo_hop.png');

    // Load enemy sprites (64x64 robot pack — replaces procedural fallbacks)
    this.load.image('enemy_agent', '/assets/matrix-frogger/agent_smith.png');
    this.load.image('enemy_sentinel', '/assets/matrix-frogger/sentinel.png');

    // Load power-up icons (hologram interface sprites)
    this.load.image('powerup_icon_speed', '/assets/matrix-frogger/powerup_icon_speed.png');
    this.load.image('powerup_icon_shield', '/assets/matrix-frogger/powerup_icon_shield.png');
    this.load.image('powerup_icon_ghost', '/assets/matrix-frogger/powerup_icon_ghost.png');
    this.load.image('powerup_icon_magnet', '/assets/matrix-frogger/powerup_icon_magnet.png');
  }

  create(): void {
    const frogSpritesLoaded = this.textures.exists('frog_idle') && this.textures.exists('frog_hop');
    this.game.registry.set('frogSpriteMode', frogSpritesLoaded);

    const neoSpritesLoaded = this.textures.exists('neo_idle') && this.textures.exists('neo_hop');
    this.game.registry.set('neoSpriteMode', neoSpritesLoaded);

    this.createPillTextures();
    this.createAbilityTextures();
    this.createVehicleTextures();
    this.createEnemyTextures();
    this.createRoadDashTexture();
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

  private createRoadDashTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x003300, 0.8);
    for (let x = 0; x < 128; x += 40) {
      g.fillRect(x, 0, 20, 4);
    }
    g.generateTexture('road_dashes', 128, 4);
    g.destroy();
  }

  /**
   * Create procedural fallback textures for enemy sprites.
   * Used when no external sprite sheet is available.
   */
  private createEnemyTextures(): void {
    // Agent enemy — red humanoid silhouette
    if (!this.textures.exists('enemy_agent')) {
      const agent = this.add.graphics();
      agent.fillStyle(0xcc0000, 1);
      agent.fillRect(6, 0, 12, 12);  // head
      agent.fillRect(4, 12, 16, 18); // body
      agent.fillRect(2, 30, 8, 14);  // left leg
      agent.fillRect(14, 30, 8, 14); // right leg
      agent.fillStyle(0xff4444, 1);
      agent.fillRect(8, 3, 8, 6);    // face highlight
      agent.generateTexture('enemy_agent', 24, 44);
      agent.destroy();
    }

    // Sentinel enemy — purple mechanical shape
    if (!this.textures.exists('enemy_sentinel')) {
      const sentinel = this.add.graphics();
      sentinel.fillStyle(0x6600cc, 1);
      sentinel.fillCircle(16, 12, 10); // body core
      sentinel.fillStyle(0x9933ff, 1);
      sentinel.fillCircle(16, 12, 6);  // inner glow
      sentinel.fillStyle(0x440088, 1);
      sentinel.fillRect(10, 22, 4, 10); // tentacle 1
      sentinel.fillRect(18, 22, 4, 10); // tentacle 2
      sentinel.fillRect(6, 20, 4, 8);   // tentacle 3
      sentinel.fillRect(22, 20, 4, 8);  // tentacle 4
      sentinel.generateTexture('enemy_sentinel', 32, 32);
      sentinel.destroy();
    }
  }
}
