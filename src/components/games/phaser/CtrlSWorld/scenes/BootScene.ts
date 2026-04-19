import Phaser from 'phaser';
import { BootScene } from '../../../../../lib/phaser/scenes/BootScene';
import { CTRLS_SCENE_KEYS } from '../config';

const PORTRAIT_BASE = 'assets/ctrl-s/portraits';
const BG_BASE = 'assets/ctrl-s/backgrounds';
const ICON_BASE = 'assets/ctrl-s/icons';

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

const ICON_ASSETS: { key: string; path: string }[] = [
  { key: 'icon-checkmark', path: `${ICON_BASE}/checkmark.png` },
  { key: 'icon-star', path: `${ICON_BASE}/star.png` },
  { key: 'icon-network-node', path: `${ICON_BASE}/network-node.png` },
];

// R83.CTRLS.14 — pixel-art textures (24×24 portraits, ~32px icons) get scaled
// up 2.75× in-scene (e.g. portrait 24 → panel 66 via setDisplaySize). The game
// runs with `antialias: true` / `pixelArt: false` (see config.ts) which forces
// bilinear sampling on every texture — fine for the 800×600 native-size
// backgrounds, but softens every upscaled pixel portrait into a blur. Applying
// NEAREST at the texture level is a per-texture override that doesn't affect
// backgrounds/text canvases, so we keep bilinear where it helps (photoreal
// backgrounds) and get crisp edges where it hurts (character faces, UI icons).
const PIXEL_ART_KEYS = [
  ...PORTRAIT_ASSETS.map((a) => a.key),
  ...ICON_ASSETS.map((a) => a.key),
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
    for (const asset of ICON_ASSETS) {
      this.load.image(asset.key, asset.path);
    }

    // Register the filter application AFTER the loader finishes — textures
    // don't exist in the texture manager until the 'complete' event fires, so
    // calling setFilter earlier silently no-ops.
    this.load.once('complete', () => this.applyPixelArtFilter());
  }

  private applyPixelArtFilter(): void {
    for (const key of PIXEL_ART_KEYS) {
      if (!this.textures.exists(key)) continue;
      const texture = this.textures.get(key);
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }

  create(): void {
    const autoStart = this.getAutoStart();
    const targetScene = autoStart ? CTRLS_SCENE_KEYS.CHAPTER_HUB : CTRLS_SCENE_KEYS.MENU;
    this.scene.start(targetScene);
  }
}
