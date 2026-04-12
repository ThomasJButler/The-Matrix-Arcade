import { BootScene } from '@/lib/phaser/scenes/BootScene';
import { SCENE_KEYS } from '@/lib/phaser/types';

export class MetrisBootScene extends BootScene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT, nextScene: SCENE_KEYS.MENU });
  }

  create(): void {
    super.create();
  }
}
