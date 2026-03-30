/**
 * Neo Jump - Menu Scene
 *
 * Title screen with Matrix rain effect and start button.
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';

export class NeoJumpMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'NEO JUMP',
      subtitle: 'Reach the highest altitude!',
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
    this.createMatrixText(centerX, height * 0.58, 'Arrow left/right: Move | SPACE: Jetpack', 10);
    this.createMatrixText(centerX, height * 0.63, 'Goal: Jump through layers to reach The Source', 10);
  }
}
