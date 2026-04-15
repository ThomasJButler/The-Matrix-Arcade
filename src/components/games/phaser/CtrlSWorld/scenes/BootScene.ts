import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { CTRLS_SCENE_KEYS } from '../config';

const PORTRAIT_BASE = 'assets/ctrl-s/portraits';

const PORTRAIT_ASSETS: { key: string; path: string }[] = [
  { key: 'portrait-protagonist', path: `${PORTRAIT_BASE}/protagonist-idle.png` },
  { key: 'portrait-protagonist-action', path: `${PORTRAIT_BASE}/protagonist-action.png` },
  { key: 'portrait-protagonist-attack', path: `${PORTRAIT_BASE}/protagonist-attack.png` },
  { key: 'portrait-protagonist-idle2', path: `${PORTRAIT_BASE}/protagonist-idle-2.png` },
];

export class CtrlSBootScene extends BootScene {
  constructor() {
    super({
      key: CTRLS_SCENE_KEYS.BOOT,
      nextScene: CTRLS_SCENE_KEYS.MENU,
    });
  }

  protected loadCommonAssets(): void {
    for (const asset of PORTRAIT_ASSETS) {
      this.load.image(asset.key, asset.path);
    }
  }

  create(): void {
    const autoStart = this.getAutoStart();
    const targetScene = autoStart ? CTRLS_SCENE_KEYS.CHAPTER_HUB : CTRLS_SCENE_KEYS.MENU;
    this.scene.start(targetScene);
  }
}
