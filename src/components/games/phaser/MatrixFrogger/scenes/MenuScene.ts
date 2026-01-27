/**
 * Matrix Frogger - Menu Scene
 *
 * Title screen with Matrix rain effect and start button.
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS } from '../../../../../lib/phaser/types';

export class FroggerMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'MATRIX FROGGER',
      subtitle: 'Cross the lanes. Avoid the Agents.',
      gameScene: SCENE_KEYS.GAME,
    });
  }
}
