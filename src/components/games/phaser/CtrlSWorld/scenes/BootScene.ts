/**
 * CTRL-S World - Boot Scene
 *
 * Loads assets and transitions to menu or chapter hub.
 */

import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { CTRLS_SCENE_KEYS } from '../config';

export class CtrlSBootScene extends BootScene {
  constructor() {
    super({
      key: CTRLS_SCENE_KEYS.BOOT,
      nextScene: CTRLS_SCENE_KEYS.MENU,
    });
  }

  create(): void {
    const autoStart = this.getAutoStart();
    const targetScene = autoStart ? CTRLS_SCENE_KEYS.CHAPTER_HUB : CTRLS_SCENE_KEYS.MENU;
    this.scene.start(targetScene);
  }
}
