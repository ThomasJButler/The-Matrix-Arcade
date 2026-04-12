/**
 * Vortex Pong — Menu Scene
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';

export class VortexPongMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'VORTEX PONG',
      subtitle: 'Battle a ruthless AI in hypnotic pong!',
      gameScene: SCENE_KEYS.GAME,
    });
  }

  create(): void {
    super.create();

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    this.createMatrixText(centerX, height * 0.52, 'HOW TO PLAY', 14, MATRIX_COLORS.CYAN_HEX);
    this.createMatrixText(
      centerX,
      height * 0.58,
      'Arrow keys / WASD / Mouse: Move paddle',
      10,
    );
    this.createMatrixText(
      centerX,
      height * 0.63,
      'Collect power-ups | First to 10 wins!',
      10,
    );
  }
}
