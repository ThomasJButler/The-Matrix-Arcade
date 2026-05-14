/**
 * CTRL-S World - Game Over Scene
 *
 * Shows completion stats when the player finishes all chapters.
 * For a narrative game, "game over" means "story complete".
 */

import { GameOverScene } from '../../../../../lib/phaser/scenes/GameOverScene';
import { CTRLS_SCENE_KEYS } from '../config';

export class CtrlSGameOverScene extends GameOverScene {
  constructor() {
    super({
      key: CTRLS_SCENE_KEYS.GAME_OVER,
      gameScene: CTRLS_SCENE_KEYS.NARRATIVE,
      menuScene: CTRLS_SCENE_KEYS.MENU,
    });
  }
}
