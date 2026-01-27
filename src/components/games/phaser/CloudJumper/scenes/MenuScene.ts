/**
 * Cloud Jumper - Menu Scene
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS } from '../../../../../lib/phaser/types';

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
    // Override background to sky blue
    this.cameras.main.setBackgroundColor(0x87ceeb);
    super.create();
  }
}
