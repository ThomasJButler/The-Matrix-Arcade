/**
 * Agent Chase - Boot Scene
 *
 * Loads all game assets with Matrix-themed loading screen.
 */

import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG } from '../config';

export class AgentChaseBootScene extends BootScene {
  constructor() {
    super({
      key: SCENE_KEYS.BOOT,
      nextScene: SCENE_KEYS.MENU,
    });
  }

  preload(): void {
    super.preload();
  }

  create(): void {
    // Create all textures programmatically
    this.createPlayerTexture();
    this.createAgentTextures();
    this.createDotTextures();
    this.createFruitTextures();
    this.createWallTexture();

    super.create();
  }

  /**
   * Create player (Pacman) texture
   */
  private createPlayerTexture(): void {
    const size = GAME_CONFIG.PLAYER.SIZE;
    const g = this.add.graphics();

    // Open mouth Pacman
    g.fillStyle(MATRIX_COLORS.YELLOW, 1);
    g.slice(size / 2, size / 2, size / 2 - 1, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(330), false);
    g.fillPath();
    g.generateTexture('player_open', size, size);
    g.clear();

    // Closed mouth Pacman
    g.fillStyle(MATRIX_COLORS.YELLOW, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 1);
    g.generateTexture('player_closed', size, size);
    g.destroy();
  }

  /**
   * Create agent/ghost textures
   */
  private createAgentTextures(): void {
    const size = GAME_CONFIG.PLAYER.SIZE;
    const agents = GAME_CONFIG.AGENT_TYPES;

    // Create texture for each agent type
    Object.entries(agents).forEach(([key, config]) => {
      this.createGhostTexture(`agent_${key.toLowerCase()}`, config.color, size);
    });

    // Frightened texture (blue)
    this.createGhostTexture('agent_frightened', 0x0000ff, size);

    // Frightened warning texture (white)
    this.createGhostTexture('agent_frightened_warning', 0xffffff, size);

    // Eyes only (returning to house)
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size * 0.3, size * 0.4, 3);
    g.fillCircle(size * 0.7, size * 0.4, 3);
    g.fillStyle(0x0000ff, 1);
    g.fillCircle(size * 0.3, size * 0.4, 1.5);
    g.fillCircle(size * 0.7, size * 0.4, 1.5);
    g.generateTexture('agent_eyes', size, size);
    g.destroy();
  }

  /**
   * Create ghost-shaped texture
   */
  private createGhostTexture(key: string, color: number, size: number): void {
    const g = this.add.graphics();

    // Body (rounded top, wavy bottom)
    g.fillStyle(color, 1);

    // Draw ghost shape
    g.beginPath();
    // Top arc
    g.arc(size / 2, size * 0.4, size * 0.4, Math.PI, 0, false);
    // Right side
    g.lineTo(size * 0.9, size * 0.85);
    // Wavy bottom
    g.lineTo(size * 0.8, size * 0.75);
    g.lineTo(size * 0.65, size * 0.85);
    g.lineTo(size * 0.5, size * 0.75);
    g.lineTo(size * 0.35, size * 0.85);
    g.lineTo(size * 0.2, size * 0.75);
    g.lineTo(size * 0.1, size * 0.85);
    // Left side
    g.lineTo(size * 0.1, size * 0.4);
    g.closePath();
    g.fillPath();

    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size * 0.35, size * 0.4, 3);
    g.fillCircle(size * 0.65, size * 0.4, 3);

    // Pupils
    g.fillStyle(0x0000ff, 1);
    g.fillCircle(size * 0.35, size * 0.4, 1.5);
    g.fillCircle(size * 0.65, size * 0.4, 1.5);

    g.generateTexture(key, size, size);
    g.destroy();
  }

  /**
   * Create dot and power pellet textures
   */
  private createDotTextures(): void {
    // Small dot
    let g = this.add.graphics();
    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillCircle(4, 4, 2);
    g.generateTexture('dot', 8, 8);
    g.destroy();

    // Power pellet (larger, glowing)
    g = this.add.graphics();
    g.fillStyle(MATRIX_COLORS.PRIMARY, 0.5);
    g.fillCircle(8, 8, 7);
    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillCircle(8, 8, 5);
    g.generateTexture('power_pellet', 16, 16);
    g.destroy();
  }

  /**
   * Create fruit textures
   */
  private createFruitTextures(): void {
    const fruits = ['cherry', 'strawberry', 'orange', 'apple', 'grape', 'banana'];
    const colors = [0xff0000, 0xff0066, 0xff8800, 0x00ff00, 0x9900ff, 0xffff00];

    fruits.forEach((fruit, index) => {
      const g = this.add.graphics();
      g.fillStyle(colors[index], 1);
      g.fillCircle(10, 10, 8);
      g.fillStyle(0x00ff00, 1);
      g.fillRect(8, 2, 4, 4); // Stem
      g.generateTexture(`fruit_${fruit}`, 20, 20);
      g.destroy();
    });
  }

  /**
   * Create wall texture
   */
  private createWallTexture(): void {
    const size = GAME_CONFIG.TILE_SIZE;
    const g = this.add.graphics();

    g.fillStyle(MATRIX_COLORS.PRIMARY, 0.3);
    g.fillRect(0, 0, size, size);
    g.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.8);
    g.strokeRect(1, 1, size - 2, size - 2);

    g.generateTexture('wall', size, size);
    g.destroy();
  }
}
