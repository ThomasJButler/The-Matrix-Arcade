import { MenuScene } from '@/lib/phaser/scenes/MenuScene';
import { SCENE_KEYS } from '@/lib/phaser/types';

export class MatrixCloudMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'MATRIX CLOUD',
      subtitle: 'Navigate the digital storm',
      gameScene: SCENE_KEYS.GAME,
    });
  }

  create(): void {
    super.create();
    const { width, height } = this.scale;
    this.createMatrixText(width / 2, height * 0.52, 'SPACE / Click to flap', 8, '#00ff00');
    this.createMatrixText(width / 2, height * 0.58, 'Fly through the gaps', 8, '#00ff00');
    this.createMatrixText(width / 2, height * 0.64, 'Collect power-ups, defeat bosses', 8, '#00ff00');
  }
}
