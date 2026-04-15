import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { CTRLS_SCENE_KEYS } from '../config';

const PORTRAIT_BASE = 'assets/ctrl-s/portraits';
const BG_BASE = 'assets/ctrl-s/backgrounds';

const PORTRAIT_ASSETS: { key: string; path: string }[] = [
  { key: 'portrait-protagonist', path: `${PORTRAIT_BASE}/protagonist-idle.png` },
  { key: 'portrait-protagonist-action', path: `${PORTRAIT_BASE}/protagonist-action.png` },
  { key: 'portrait-protagonist-attack', path: `${PORTRAIT_BASE}/protagonist-attack.png` },
  { key: 'portrait-protagonist-idle2', path: `${PORTRAIT_BASE}/protagonist-idle-2.png` },
];

const BACKGROUND_ASSETS: { key: string; path: string }[] = [
  { key: 'bg-cyberpunk-city', path: `${BG_BASE}/cyberpunk-city-1.png` },
  { key: 'bg-cyberpunk-city-mid', path: `${BG_BASE}/cyberpunk-city-mid.png` },
  { key: 'bg-digital-construct', path: `${BG_BASE}/digital-construct.png` },
  { key: 'bg-dystopian-streets', path: `${BG_BASE}/dystopian-streets.png` },
  { key: 'bg-new-dawn', path: `${BG_BASE}/new-dawn.png` },
  { key: 'bg-hub-node', path: `${BG_BASE}/hub-node-1.png` },
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
    for (const asset of BACKGROUND_ASSETS) {
      this.load.image(asset.key, asset.path);
    }
  }

  create(): void {
    const autoStart = this.getAutoStart();
    const targetScene = autoStart ? CTRLS_SCENE_KEYS.CHAPTER_HUB : CTRLS_SCENE_KEYS.MENU;
    this.scene.start(targetScene);
  }
}
