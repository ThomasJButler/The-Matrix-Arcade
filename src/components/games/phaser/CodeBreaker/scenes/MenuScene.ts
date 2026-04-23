import { MenuScene } from '@/lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS } from '@/lib/phaser/types';
import { POWERUP_DEFS, POWERUP_LEGEND } from '../config';

/**
 * CodeBreaker menu layout.
 *
 * Y-ratios are exported so MenuScene.test.ts can assert the HOW TO PLAY stack
 * + POWER-UPS legend never drift into the START button hitbox. The shared
 * BaseScene button is centred on 0.75 with ~50 px height, so everything must
 * stay strictly below 0.70 on the 450-px canvas.
 *
 * R87.K7 adds the POWER-UPS legend (icon row + label row) — Tom: *"we need
 * some sort of info about this before we start playing the game, because it's
 * a bit of guessing what power up is what"*. The icon tuple comes from
 * POWERUP_LEGEND.ENTRIES (config.ts) so a future 7th power-up added there
 * automatically surfaces in both the menu panel and the on-pickup overlay.
 */

export const HOW_TO_PLAY_Y_RATIO = 0.40;
export const CONTROLS_LINE_1_Y_RATIO = 0.44;
export const CONTROLS_LINE_2_Y_RATIO = 0.48;
export const CONTROLS_LINE_3_Y_RATIO = 0.52;
export const LEGEND_HEADING_Y_RATIO = 0.56;
export const LEGEND_ICON_Y_RATIO = 0.605;
export const LEGEND_LABEL_Y_RATIO = 0.65;

/** Rendered icon size in menu pixels — power-up textures are scaled to this square. */
export const LEGEND_ICON_SIZE = 20;

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

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const cx = width / 2;

    this.createMatrixText(cx, height * HOW_TO_PLAY_Y_RATIO, 'HOW TO PLAY', 12, MATRIX_COLORS.CYAN_HEX);
    this.createMatrixText(cx, height * CONTROLS_LINE_1_Y_RATIO, 'Arrow keys / Mouse: Move paddle', 8, MATRIX_COLORS.PRIMARY_HEX);
    this.createMatrixText(cx, height * CONTROLS_LINE_2_Y_RATIO, 'Destroy bricks to charge BULLET TIME', 8, MATRIX_COLORS.PRIMARY_HEX);
    this.createMatrixText(cx, height * CONTROLS_LINE_3_Y_RATIO, 'B: Activate (when READY) | P: Pause', 8, MATRIX_COLORS.PRIMARY_HEX);

    // POWER-UPS legend heading + icon/label columns.
    this.createMatrixText(cx, height * LEGEND_HEADING_Y_RATIO, 'POWER-UPS', 12, MATRIX_COLORS.CYAN_HEX);

    const iconY = height * LEGEND_ICON_Y_RATIO;
    const labelY = height * LEGEND_LABEL_Y_RATIO;
    const columnCount = POWERUP_LEGEND.ENTRIES.length;
    // Symmetric column spacing with 60 px side padding.
    const usableWidth = width - 120;
    const columnSpacing = usableWidth / (columnCount - 1);
    const firstX = (width - usableWidth) / 2;

    POWERUP_LEGEND.ENTRIES.forEach((entry, i) => {
      const x = firstX + columnSpacing * i;
      const def = POWERUP_DEFS[entry.type];
      const icon = this.add.image(x, iconY, `powerup_${entry.type}`);
      icon.setDisplaySize(LEGEND_ICON_SIZE, LEGEND_ICON_SIZE);
      const colour = `#${def.color.toString(16).padStart(6, '0')}`;
      this.createMatrixText(x, labelY, entry.name, 7, colour);
    });
  }
}
