/**
 * Matrix Frogger - Menu Scene
 *
 * Title screen with Matrix rain effect and start button.
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';

export class FroggerMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'MATRIX FROGGER',
      subtitle: 'Cross the lanes. Avoid the Agents.',
      gameScene: SCENE_KEYS.GAME,
    });
  }

  create(): void {
    super.create();

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    // HOW TO PLAY section
    this.createMatrixText(centerX, height * 0.52, 'HOW TO PLAY', 14, MATRIX_COLORS.CYAN_HEX);
    this.createMatrixText(centerX, height * 0.58, 'Arrow keys: Move | Goal: Cross all lanes without hitting Agents', 10);
  }
}
