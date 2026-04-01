/**
 * Cloud Jumper - Game Over Scene
 */

import { GameOverScene } from '../../../../../lib/phaser/scenes/GameOverScene';
import { SCENE_KEYS } from '../../../../../lib/phaser/types';

export class CloudJumperGameOverScene extends GameOverScene {
  constructor() {
    super({
      key: SCENE_KEYS.GAME_OVER,
      gameScene: SCENE_KEYS.GAME,
      menuScene: SCENE_KEYS.MENU,
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0a1a0a);
    super.create();
  }
}
