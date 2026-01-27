/**
 * Neo Jump - Menu Scene
 *
 * Title screen with Matrix rain effect and start button.
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS } from '../../../../../lib/phaser/types';

export class NeoJumpMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'NEO JUMP',
      subtitle: 'Reach the highest altitude!',
      gameScene: SCENE_KEYS.GAME,
    });
  }
}
