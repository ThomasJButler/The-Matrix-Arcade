/**
 * Agent Chase - Boot Scene
 *
 * Loads game assets with Matrix-themed loading screen.
 * Integrates 32rogues pixel art sprites (player, agents, walls) with
 * procedural texture fallbacks for unit test and offline resilience.
 */

import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG } from '../config';

const SPRITE_ASSETS: Array<{ key: string; path: string }> = [
  { key: 'player_open', path: 'assets/agent-chase/player.png' },
  { key: 'player_closed', path: 'assets/agent-chase/player.png' },
  { key: 'agent_smith', path: 'assets/agent-chase/agent_smith_sprite.png' },
  { key: 'agent_brown', path: 'assets/agent-chase/agent_brown_sprite.png' },
  { key: 'agent_jones', path: 'assets/agent-chase/agent_jones_sprite.png' },
  { key: 'agent_johnson', path: 'assets/agent-chase/agent_johnson_sprite.png' },
  { key: 'agent_frightened', path: 'assets/agent-chase/agent_frightened_sprite.png' },
  { key: 'wall', path: 'assets/agent-chase/wall_brick.png' },
];

export class AgentChaseBootScene extends BootScene {
  constructor() {
    super({
      key: SCENE_KEYS.BOOT,
      nextScene: SCENE_KEYS.MENU,
    });
  }

  protected loadCommonAssets(): void {
    for (const { key, path } of SPRITE_ASSETS) {
      this.load.image(key, path);
    }
  }

  create(): void {
    const spritesLoaded = this.textures.exists('agent_smith');
    this.game.registry.set('spriteMode', spritesLoaded);

    if (spritesLoaded) {
      this.resizeSpritesToGameSize();
    }

    this.createPlayerTexture();
    this.createAgentTextures();
    this.createDotTextures();
    this.createFruitTextures();
    this.createWallTexture();

    super.create();
  }

  private resizeSpritesToGameSize(): void {
    const ps = GAME_CONFIG.PLAYER.SIZE;
    const ts = GAME_CONFIG.TILE_SIZE;

    const targets: Array<{ key: string; w: number; h: number }> = [
      { key: 'player_open', w: ps, h: ps },
      { key: 'player_closed', w: ps, h: ps },
      { key: 'agent_smith', w: ps, h: ps },
      { key: 'agent_brown', w: ps, h: ps },
      { key: 'agent_jones', w: ps, h: ps },
      { key: 'agent_johnson', w: ps, h: ps },
      { key: 'agent_frightened', w: ps, h: ps },
      { key: 'wall', w: ts, h: ts },
    ];

    for (const { key, w, h } of targets) {
      this.resizeLoadedSprite(key, w, h);
    }
  }

  private resizeLoadedSprite(key: string, width: number, height: number): void {
    try {
      if (!this.textures.exists(key)) return;
      const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
      if (source.width === width && source.height === height) return;

      this.textures.remove(key);
      const canvas = this.textures.createCanvas(key, width, height);
      if (!canvas) return;
      const ctx = canvas.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, 0, 0, width, height);
      canvas.refresh();
    } catch {
      // Sprite resize failed — procedural fallback will handle this texture
    }
  }

  private createPlayerTexture(): void {
    if (this.textures.exists('player_open')) return;

    const size = GAME_CONFIG.PLAYER.SIZE;
    const g = this.add.graphics();

    g.fillStyle(MATRIX_COLORS.YELLOW, 1);
    g.slice(size / 2, size / 2, size / 2 - 1, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(330), false);
    g.fillPath();
    g.generateTexture('player_open', size, size);
    g.clear();

    g.fillStyle(MATRIX_COLORS.YELLOW, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 1);
    g.generateTexture('player_closed', size, size);
    g.destroy();
  }

  private createAgentTextures(): void {
    const size = GAME_CONFIG.PLAYER.SIZE;
    const agents = GAME_CONFIG.AGENT_TYPES;

    Object.entries(agents).forEach(([key, config]) => {
      const textureKey = `agent_${key.toLowerCase()}`;
      if (!this.textures.exists(textureKey)) {
        this.createGhostTexture(textureKey, config.color, size);
      }
    });

    if (!this.textures.exists('agent_frightened')) {
      this.createGhostTexture('agent_frightened', 0x0000ff, size);
    }

    this.createGhostTexture('agent_frightened_warning', 0xffffff, size);

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

  private createGhostTexture(key: string, color: number, size: number): void {
    const g = this.add.graphics();

    g.fillStyle(color, 1);
    g.beginPath();
    g.arc(size / 2, size * 0.4, size * 0.4, Math.PI, 0, false);
    g.lineTo(size * 0.9, size * 0.85);
    g.lineTo(size * 0.8, size * 0.75);
    g.lineTo(size * 0.65, size * 0.85);
    g.lineTo(size * 0.5, size * 0.75);
    g.lineTo(size * 0.35, size * 0.85);
    g.lineTo(size * 0.2, size * 0.75);
    g.lineTo(size * 0.1, size * 0.85);
    g.lineTo(size * 0.1, size * 0.4);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xffffff, 1);
    g.fillCircle(size * 0.35, size * 0.4, 3);
    g.fillCircle(size * 0.65, size * 0.4, 3);

    g.fillStyle(0x0000ff, 1);
    g.fillCircle(size * 0.35, size * 0.4, 1.5);
    g.fillCircle(size * 0.65, size * 0.4, 1.5);

    g.generateTexture(key, size, size);
    g.destroy();
  }

  private createDotTextures(): void {
    let g = this.add.graphics();
    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillCircle(4, 4, 2);
    g.generateTexture('dot', 8, 8);
    g.destroy();

    g = this.add.graphics();
    g.fillStyle(MATRIX_COLORS.PRIMARY, 0.5);
    g.fillCircle(8, 8, 7);
    g.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    g.fillCircle(8, 8, 5);
    g.generateTexture('power_pellet', 16, 16);
    g.destroy();
  }

  private createFruitTextures(): void {
    const fruits = ['cherry', 'strawberry', 'orange', 'apple', 'grape', 'banana'];
    const colors = [0xff0000, 0xff0066, 0xff8800, 0x00ff00, 0x9900ff, 0xffff00];

    fruits.forEach((fruit, index) => {
      const g = this.add.graphics();
      g.fillStyle(colors[index], 1);
      g.fillCircle(10, 10, 8);
      g.fillStyle(0x00ff00, 1);
      g.fillRect(8, 2, 4, 4);
      g.generateTexture(`fruit_${fruit}`, 20, 20);
      g.destroy();
    });
  }

  private createWallTexture(): void {
    if (this.textures.exists('wall')) return;

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
