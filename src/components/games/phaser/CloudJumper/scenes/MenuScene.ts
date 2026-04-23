/**
 * Cloud Jumper - Menu Scene
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';

export class CloudJumperMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'CLOUD JUMPER',
      subtitle: 'Jump between the clouds!',
      gameScene: SCENE_KEYS.GAME,
    });
  }

  create(): void {
    super.create();
    // Override background to dark Matrix-green (must be after super.create which sets Matrix black)
    this.cameras.main.setBackgroundColor(MATRIX_COLORS.NEAR_BLACK);

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    // HOW TO PLAY section
    this.createMatrixText(centerX, height * 0.48, 'HOW TO PLAY', 14, MATRIX_COLORS.CYAN_HEX);
    this.createMatrixText(centerX, height * 0.54, 'SPACE/UP/W: Jump | Click/Tap: Jump', 10);
    this.createMatrixText(centerX, height * 0.59, 'LEFT/A · RIGHT/D: Move | Release: Stop', 10);
    this.createMatrixText(centerX, height * 0.64, 'Goal: Collect data and avoid falling', 10);
  }
}
