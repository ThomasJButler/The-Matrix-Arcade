import { MenuScene } from '@/lib/phaser/scenes/MenuScene';
import { SCENE_KEYS } from '@/lib/phaser/types';

export class SnakeMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'SNAKE CLASSIC',
      subtitle: 'Navigate the Matrix, collect data fragments',
      gameScene: SCENE_KEYS.GAME,
    });
  }

  create(): void {
    super.create();
    const { width, height } = this.scale;
    this.createMatrixText(width / 2, height * 0.52, 'ARROWS / WASD: Move', 8, '#00ff00');
    this.createMatrixText(width / 2, height * 0.58, 'Collect food to grow longer', 8, '#00ff00');
    this.createMatrixText(width / 2, height * 0.64, 'Avoid walls and your own tail', 8, '#00ff00');
  }
}
