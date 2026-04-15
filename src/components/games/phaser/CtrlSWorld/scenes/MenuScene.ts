/**
 * CTRL-S World - Menu Scene
 *
 * Matrix-themed title screen for the narrative game.
 * Shows ASCII title art, matrix rain, and start button.
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { CTRLS_SCENE_KEYS, MUSIC_TRACKS } from '../config';
import { MATRIX_COLORS } from '../../../../../lib/phaser/types';

export class CtrlSMenuScene extends MenuScene {
  constructor() {
    super({
      key: CTRLS_SCENE_KEYS.MENU,
      title: 'CTRL-S',
      subtitle: 'Save the World',
      gameScene: CTRLS_SCENE_KEYS.CHAPTER_HUB,
    });
  }

  create(): void {
    super.create();
    this.playBackgroundMusic(MUSIC_TRACKS.MENU);

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    this.createMatrixText(
      centerX,
      height * 0.50,
      'A Hacker\'s Odyssey',
      12,
      MATRIX_COLORS.CYAN_HEX,
    );

    this.createMatrixText(
      centerX,
      height * 0.76,
      '5 Chapters | 19 Puzzles | 1 World to Save',
      9,
      MATRIX_COLORS.DIM_GREEN_HEX,
    );
  }

  protected startGame(): void {
    this.playSound('menu');
    this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
  }
}
