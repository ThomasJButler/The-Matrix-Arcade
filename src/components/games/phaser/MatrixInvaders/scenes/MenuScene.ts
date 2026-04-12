import { MenuScene } from '@/lib/phaser/scenes/MenuScene';
import { SCENE_KEYS } from '@/lib/phaser/types';

export class MatrixInvadersMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'MATRIX INVADERS',
      subtitle: 'Defend against waves of code invaders',
      gameScene: SCENE_KEYS.GAME,
    });
  }

  create(): void {
    super.create();
    const { width, height } = this.scale;
    const lines = [
      'Arrow keys / WASD: Move',
      'SPACE: Fire',
      'B: Bullet Time',
    ];
    lines.forEach((text, i) => {
      const t = this.createMatrixText(width / 2, height * 0.72 + i * 22, text, 8);
      t.setDepth(10);
    });
  }
}
