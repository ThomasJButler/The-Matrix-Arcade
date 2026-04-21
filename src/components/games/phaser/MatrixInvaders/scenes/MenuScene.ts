import { MenuScene } from '@/lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS } from '@/lib/phaser/types';

/**
 * Invaders control-hint stack. Must sit in the 0.52–0.64 instruction band
 * (convention — see Snake, MatrixCloud, NeoJump, etc.) so the stack stays
 * clear of the start button (centred on BaseScene.MENU_START_BUTTON_Y_RATIO =
 * 0.75, ~50 px tall → y 312–362 on the 450-px canvas). R85.I5 regression
 * tripwire in MenuScene.test.ts locks this invariant; Tom 2026-04-21 playtest
 * caught the previous 0.72 stack painting directly on top of the START button.
 */
export const CONTROL_HINT_Y_RATIOS = [0.52, 0.58, 0.64] as const;

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
      const t = this.createMatrixText(
        width / 2,
        height * CONTROL_HINT_Y_RATIOS[i],
        text,
        8,
        MATRIX_COLORS.PRIMARY_HEX,
      );
      t.setDepth(10);
    });
  }
}
