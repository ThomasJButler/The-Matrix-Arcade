import { MenuScene } from '@/lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS } from '@/lib/phaser/types';

export class CodeBreakerMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'CODE BREAKER',
      subtitle: 'Break Through the Firewall',
      gameScene: SCENE_KEYS.GAME,
    });
  }

  create(): void {
    super.create();

    const h = this.cameras.main.height;
    const instructions = [
      'HOW TO PLAY',
      'Arrow keys / Mouse: Move paddle',
      'B: Bullet time | P: Pause',
      'Break all bricks to advance!',
    ];

    const startY = h * 0.52;
    instructions.forEach((text, i) => {
      this.createMatrixText(
        this.cameras.main.width / 2,
        startY + i * 20,
        text,
        i === 0 ? 10 : 8,
        i === 0 ? MATRIX_COLORS.CYAN_HEX : MATRIX_COLORS.PRIMARY_HEX
      );
    });
  }
}
