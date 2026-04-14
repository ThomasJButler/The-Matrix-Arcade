/**
 * Cloud Jumper - Game Over Scene
 */

import { GameOverScene } from '../../../../../lib/phaser/scenes/GameOverScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';

export class CloudJumperGameOverScene extends GameOverScene {
  constructor() {
    super({
      key: SCENE_KEYS.GAME_OVER,
      gameScene: SCENE_KEYS.GAME,
      menuScene: SCENE_KEYS.MENU,
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(MATRIX_COLORS.NEAR_BLACK);
    super.create();
  }
}
