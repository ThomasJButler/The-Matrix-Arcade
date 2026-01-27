/**
 * Agent Chase - Menu Scene
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS } from '../../../../../lib/phaser/types';

export class AgentChaseMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'AGENT CHASE',
      subtitle: 'Collect data. Escape the Agents.',
      gameScene: SCENE_KEYS.GAME,
    });
  }
}
