/**
 * Agent Chase - Menu Scene
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';

export class AgentChaseMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'AGENT CHASE',
      subtitle: 'Collect data. Escape the Agents.',
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
    this.createMatrixText(centerX, height * 0.58, 'Arrow keys: Move | Goal: Collect all data pills', 10);
    this.createMatrixText(centerX, height * 0.63, 'Evade Agent Smith throughout the maze', 10);
  }
}
