import { MenuScene } from '@/lib/phaser/scenes/MenuScene';
import { SCENE_KEYS } from '@/lib/phaser/types';

export class MetrisMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'METRIS',
      subtitle: '←→ Move  ↑/X Rotate  ↓ Soft Drop\nSPACE Hard Drop  C Hold  B Bullet Time',
      gameScene: SCENE_KEYS.GAME,
    });
  }
}
