/**
 * Matrix Frogger - Menu Scene
 *
 * Title screen with Matrix rain, HOW TO PLAY band, and — as of R86.F5 — a
 * GAME OBJECTS legend that inventories every sprite the player will meet in
 * the round (enemies, ability, pickups) alongside a one-word meaning.
 *
 * Tom 2026-04-21 flagged "we need to have what the different game objects are
 * in the game menu" — the fix adopts the Snake (R83) / Pong (R84) / Invaders
 * (R85.I5) legend pattern: exported ratio + item tuples so the layout stays
 * verifiable from unit tests and can't silently drift above the START button.
 */

import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';

/**
 * Y-ratios for the HOW TO PLAY + GAME OBJECTS stack.
 *
 * Upper bound (0.68) is a hard invariant — the BaseScene START button is
 * centred on 0.75 with ~50 px height, so its top edge lands at ~0.708 on a
 * 600-px canvas (y=425). The label row MUST stay strictly below 0.70 to
 * preserve a visible gap. MenuScene.test.ts pins this contract.
 */
export const HOW_TO_PLAY_Y_RATIO = 0.47;
export const CONTROLS_Y_RATIO = 0.52;
export const LEGEND_HEADING_Y_RATIO = 0.58;
export const LEGEND_ICON_Y_RATIO = 0.64;
export const LEGEND_LABEL_Y_RATIO = 0.675;

/**
 * Six objects are called out — 2 enemies, 1 ability, 3 pickups. Order is
 * intentional: danger (agent, sentinel) → your weapon (kung-fu) → rewards
 * (points, power-up, neo). Sprite keys match the textures loaded/generated in
 * BootScene.ts; if a new pickup is added there the legend test will force the
 * author to update this tuple rather than forget it.
 */
export const LEGEND_ITEMS = [
  { textureKey: 'enemy_agent', label: 'AGENT' },
  { textureKey: 'enemy_sentinel', label: 'SENTINEL' },
  { textureKey: 'kung_fu_icon', label: 'KUNG FU' },
  { textureKey: 'red_pill', label: 'POINTS' },
  { textureKey: 'blue_pill', label: 'POWER-UP' },
  { textureKey: 'neo_pickup', label: 'NEO' },
] as const;

/** Rendered icon size in menu pixels — sprites are scaled to this square. */
export const LEGEND_ICON_SIZE = 22;

export class FroggerMenuScene extends MenuScene {
  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'MATRIX FROGGER',
      subtitle: 'Cross the lanes. Avoid the Agents.',
      gameScene: SCENE_KEYS.GAME,
    });
  }

  create(): void {
    super.create();

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    // HOW TO PLAY band — short, kept above the legend.
    this.createMatrixText(centerX, height * HOW_TO_PLAY_Y_RATIO, 'HOW TO PLAY', 14, MATRIX_COLORS.CYAN_HEX);
    this.createMatrixText(
      centerX,
      height * CONTROLS_Y_RATIO,
      'Arrows / WASD: Move  ·  K: Kung Fu Strike (3 charges)',
      10,
    );

    // GAME OBJECTS legend — Tom R86.F5.
    this.createMatrixText(centerX, height * LEGEND_HEADING_Y_RATIO, 'GAME OBJECTS', 12, MATRIX_COLORS.CYAN_HEX);

    const iconY = height * LEGEND_ICON_Y_RATIO;
    const labelY = height * LEGEND_LABEL_Y_RATIO;
    const columnCount = LEGEND_ITEMS.length;
    // Symmetric column spacing across the canvas. 60 px side padding leaves
    // generous breathing room at 800 px canvas widths.
    const usableWidth = width - 120;
    const columnSpacing = usableWidth / (columnCount - 1);
    const firstX = (width - usableWidth) / 2;

    LEGEND_ITEMS.forEach((item, i) => {
      const x = firstX + columnSpacing * i;
      const icon = this.add.image(x, iconY, item.textureKey);
      icon.setDisplaySize(LEGEND_ICON_SIZE, LEGEND_ICON_SIZE);
      this.createMatrixText(x, labelY, item.label, 8, MATRIX_COLORS.PRIMARY_HEX);
    });
  }
}
