import { BootScene } from '@/lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '@/lib/phaser/types';
import { GAME_CONFIG, POWERUP_DEFS, type PowerUpType } from '../config';

const SPRITE_ASSETS = [
  { key: 'snake_sprite_head', path: 'assets/snake/head.png' },
  { key: 'snake_sprite_body', path: 'assets/snake/body.png' },
  { key: 'snake_sprite_tail', path: 'assets/snake/tail.png' },
  { key: 'snake_sprite_dead', path: 'assets/snake/dead.png' },
  { key: 'food_sprite', path: 'assets/snake/apple.png' },
];

export class SnakeBootScene extends BootScene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT, nextScene: SCENE_KEYS.MENU });
  }

  protected loadCommonAssets(): void {
    for (const { key, path } of SPRITE_ASSETS) {
      this.load.image(key, path);
    }
  }

  create(): void {
    const spritesLoaded = this.textures.exists('snake_sprite_head');
    this.game.registry.set('spriteMode', spritesLoaded);

    if (!spritesLoaded) {
      this.createSnakeTextures();
      this.createFoodTexture();
    }
    this.createPowerUpTextures();
    super.create();
  }

  private createSnakeTextures(): void {
    const s = GAME_CONFIG.CELL_SIZE;

    const headG = this.make.graphics({ x: 0, y: 0 });
    headG.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    headG.fillRoundedRect(1, 1, s - 2, s - 2, 3);
    headG.fillStyle(MATRIX_COLORS.WHITE, 1);
    headG.fillCircle(s * 0.7, s * 0.3, 2);
    headG.fillCircle(s * 0.7, s * 0.7, 2);
    headG.generateTexture('snake_head', s, s);
    headG.destroy();

    const bodyG = this.make.graphics({ x: 0, y: 0 });
    bodyG.fillStyle(0x00cc00, 1);
    bodyG.fillRoundedRect(2, 2, s - 4, s - 4, 2);
    bodyG.generateTexture('snake_body', s, s);
    bodyG.destroy();

    const tailG = this.make.graphics({ x: 0, y: 0 });
    tailG.fillStyle(0x008800, 1);
    tailG.fillCircle(s / 2, s / 2, s * 0.25);
    tailG.generateTexture('snake_tail', s, s);
    tailG.destroy();
  }

  private createFoodTexture(): void {
    const s = GAME_CONFIG.CELL_SIZE;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(MATRIX_COLORS.RED, 0.3);
    g.fillCircle(s / 2, s / 2, s * 0.45);
    g.fillStyle(MATRIX_COLORS.RED, 1);
    g.fillCircle(s / 2, s / 2, s * 0.3);
    g.fillStyle(0xff6666, 1);
    g.fillCircle(s / 2 - 2, s / 2 - 2, 2);
    g.generateTexture('food', s, s);
    g.destroy();
  }

  private createPowerUpTextures(): void {
    const s = GAME_CONFIG.CELL_SIZE;
    for (const [type, def] of Object.entries(POWERUP_DEFS) as [PowerUpType, (typeof POWERUP_DEFS)[PowerUpType]][]) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(def.color, 0.2);
      g.fillCircle(s / 2, s / 2, s * 0.45);
      g.lineStyle(2, def.color, 1);
      g.strokeCircle(s / 2, s / 2, s * 0.45);
      g.fillStyle(def.color, 1);
      g.fillCircle(s / 2, s / 2, s * 0.15);
      g.generateTexture(`powerup_${type}`, s, s);
      g.destroy();
    }
  }
}
