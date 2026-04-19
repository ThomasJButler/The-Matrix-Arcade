/**
 * Vortex Pong — Menu Scene
 */

import Phaser from 'phaser';
import { MenuScene } from '../../../../../lib/phaser/scenes/MenuScene';
import { SCENE_KEYS, MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import {
  type DifficultyTier,
  DIFFICULTY_TIERS,
  cycleDifficulty,
  readStoredDifficulty,
  writeStoredDifficulty,
} from '../config';

export const DIFFICULTY_REGISTRY_KEY = 'vortexPong.difficulty';

export class VortexPongMenuScene extends MenuScene {
  private difficulty: DifficultyTier = 'normal';
  private difficultyLabelText?: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: SCENE_KEYS.MENU,
      title: 'VORTEX PONG',
      subtitle: 'Battle a ruthless AI in hypnotic pong!',
      gameScene: SCENE_KEYS.GAME,
    });
  }

  create(): void {
    super.create();

    this.difficulty = readStoredDifficulty();
    this.registry.set(DIFFICULTY_REGISTRY_KEY, this.difficulty);

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    this.createMatrixText(centerX, height * 0.52, 'HOW TO PLAY', 14, MATRIX_COLORS.CYAN_HEX);
    this.createMatrixText(
      centerX,
      height * 0.58,
      'Arrow keys / WASD / Mouse: Move paddle',
      10,
    );
    this.createMatrixText(
      centerX,
      height * 0.63,
      'Collect power-ups | First to 10 wins!',
      10,
    );

    // R84.P3 — difficulty selector sits in the gap between the instruction
    // band (0.52–0.63) and the shared start-button ratio (0.75), so the
    // existing menu layout is untouched.
    this.createDifficultySelector(centerX, height * 0.70);
  }

  private createDifficultySelector(x: number, y: number): void {
    this.createMatrixText(x, y - 16, 'DIFFICULTY', 10, MATRIX_COLORS.CYAN_HEX).setAlpha(0.8);

    const container = this.add.container(x, y + 8);

    const bg = this.add.graphics();
    const drawBg = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? MATRIX_COLORS.PRIMARY : MATRIX_COLORS.DARK_GREEN, hover ? 0.3 : 1);
      bg.fillRoundedRect(-70, -16, 140, 32, 6);
      bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
      bg.strokeRoundedRect(-70, -16, 140, 32, 6);
    };
    drawBg(false);

    const label = this.add.text(0, 0, DIFFICULTY_TIERS[this.difficulty].label, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    label.setOrigin(0.5);
    this.difficultyLabelText = label;

    container.add([bg, label]);
    const hitArea = new Phaser.Geom.Rectangle(-70, -16, 140, 32);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      drawBg(true);
      label.setColor(MATRIX_COLORS.WHITE_HEX);
    });
    container.on('pointerout', () => {
      drawBg(false);
      label.setColor(MATRIX_COLORS.PRIMARY_HEX);
    });
    container.on('pointerdown', () => {
      this.cycleDifficulty();
    });
  }

  /**
   * Test-visible so the Phaser mock suite can exercise cycle + persistence
   * without synthesising pointer events.
   */
  cycleDifficulty(): DifficultyTier {
    this.difficulty = cycleDifficulty(this.difficulty);
    this.registry.set(DIFFICULTY_REGISTRY_KEY, this.difficulty);
    writeStoredDifficulty(this.difficulty);
    if (this.difficultyLabelText) {
      this.difficultyLabelText.setText(DIFFICULTY_TIERS[this.difficulty].label);
    }
    this.playSound('menu');
    return this.difficulty;
  }

  /**
   * Exposed so tests can assert the currently-selected tier without prodding
   * at internal state.
   */
  getDifficulty(): DifficultyTier {
    return this.difficulty;
  }
}
