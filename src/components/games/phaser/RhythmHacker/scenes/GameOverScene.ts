/**
 * Rhythm Hacker - Game Over Scene
 */

import { GameOverScene } from '../../../../../lib/phaser/scenes/GameOverScene';
import { SCENE_KEYS } from '../../../../../lib/phaser/types';

export class RhythmHackerGameOverScene extends GameOverScene {
  constructor() {
    super({
      key: SCENE_KEYS.GAME_OVER,
      gameScene: SCENE_KEYS.GAME,
      menuScene: SCENE_KEYS.MENU,
    });
  }
}
