import { BootScene } from '@/lib/phaser/scenes/BootScene';
import { SCENE_KEYS } from '@/lib/phaser/types';
import { TETROMINO_DEFS, TETROMINO_TYPES } from '../config';

export class MetrisBootScene extends BootScene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT, nextScene: SCENE_KEYS.MENU });
  }

  protected loadCommonAssets(): void {
    for (const t of TETROMINO_TYPES) {
      this.load.image(`tile_${t.toLowerCase()}`, `/assets/metris/tile_${t.toLowerCase()}.png`);
    }
  }

  create(): void {
    let loaded = 0;
    for (const t of TETROMINO_TYPES) {
      if (this.textures.exists(`tile_${t.toLowerCase()}`)) loaded++;
    }

    if (loaded < TETROMINO_TYPES.length) {
      this.generateFallbackTiles();
    }

    this.registry.set('tileSpriteMode', loaded === TETROMINO_TYPES.length);
    super.create();
  }

  private generateFallbackTiles(): void {
    const size = 32;
    for (const t of TETROMINO_TYPES) {
      const key = `tile_${t.toLowerCase()}`;
      if (this.textures.exists(key)) continue;

      const color = TETROMINO_DEFS[t].color;
      const r = (color >> 16) & 0xff;
      const gn = (color >> 8) & 0xff;
      const b = color & 0xff;

      const dark = (Math.max(0, r - 100) << 16) | (Math.max(0, gn - 100) << 8) | Math.max(0, b - 100);
      const light = (Math.min(255, r + 80) << 16) | (Math.min(255, gn + 80) << 8) | Math.min(255, b + 80);
      const highlight = (Math.min(255, r + 40) << 16) | (Math.min(255, gn + 40) << 8) | Math.min(255, b + 40);

      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(dark, 1);
      g.fillRect(0, 0, size, size);
      g.fillStyle(light, 1);
      g.fillRect(1, 1, size - 2, 3);
      g.fillRect(1, 1, 3, size - 2);
      g.fillStyle(color, 1);
      g.fillRect(4, 4, size - 8, size - 8);
      g.fillStyle(highlight, 1);
      g.fillRect(size / 2 - 4, size / 2 - 4, 8, 8);
      g.fillStyle(color, 1);
      g.fillRect(size / 2 - 3, size / 2 - 3, 6, 6);
      g.generateTexture(key, size, size);
      g.destroy();
    }
  }
}
