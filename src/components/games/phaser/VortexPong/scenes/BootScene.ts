/**
 * Vortex Pong — Boot Scene
 *
 * Generates procedural textures for paddles, ball, and power-ups.
 */

import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { SCENE_KEYS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG, POWERUP_DEFS } from '../config';

export class VortexPongBootScene extends BootScene {
  constructor() {
    super({
      key: SCENE_KEYS.BOOT,
      nextScene: SCENE_KEYS.MENU,
    });
  }

  create(): void {
    this.createPaddleTextures();
    this.createBallTexture();
    this.createPowerUpTextures();
    super.create();
  }

  private createPaddleTextures(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG.PADDLE;

    const pg = this.add.graphics();
    pg.fillStyle(0x00ff00, 1);
    pg.fillRoundedRect(0, 0, WIDTH, HEIGHT, 3);
    pg.lineStyle(1, 0x00cc00, 0.6);
    pg.strokeRoundedRect(0, 0, WIDTH, HEIGHT, 3);
    pg.generateTexture('paddle_player', WIDTH, HEIGHT);
    pg.destroy();

    const ag = this.add.graphics();
    ag.fillStyle(0x00bb00, 1);
    ag.fillRoundedRect(0, 0, WIDTH, HEIGHT, 3);
    ag.lineStyle(1, 0x009900, 0.6);
    ag.strokeRoundedRect(0, 0, WIDTH, HEIGHT, 3);
    ag.generateTexture('paddle_ai', WIDTH, HEIGHT);
    ag.destroy();
  }

  private createBallTexture(): void {
    const r = GAME_CONFIG.BALL.RADIUS;
    const size = r * 2 + 4;
    const center = size / 2;

    const g = this.add.graphics();
    g.fillStyle(0x00ff00, 1);
    g.fillCircle(center, center, r);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(center - 1, center - 1, r * 0.4);
    g.generateTexture('ball', size, size);
    g.destroy();
  }

  private createPowerUpTextures(): void {
    const radius = GAME_CONFIG.POWERUP.DISPLAY_RADIUS;
    const size = radius * 2 + 6;
    const center = size / 2;

    for (const [type, def] of Object.entries(POWERUP_DEFS)) {
      const g = this.add.graphics();
      g.fillStyle(def.color, 0.3);
      g.fillCircle(center, center, radius);
      g.lineStyle(2, def.color, 1);
      g.strokeCircle(center, center, radius);
      g.fillStyle(def.color, 0.8);
      g.fillCircle(center, center, radius * 0.4);
      g.generateTexture(`powerup_${type}`, size, size);
      g.destroy();
    }
  }
}
