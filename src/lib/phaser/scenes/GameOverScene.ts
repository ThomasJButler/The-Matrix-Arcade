/**
 * GameOverScene - Base game over screen with Matrix theme
 *
 * Shows final score, high score, and restart/exit options.
 * Receives score data from game scene.
 */

import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../types';

export interface GameOverSceneConfig {
  /** Scene key for this game over scene */
  key?: string;
  /** Scene to restart to */
  gameScene?: string;
  /** Scene for menu */
  menuScene?: string;
}

export interface GameOverData {
  score: number;
  highScore?: number;
  reason?: string;
}

export class GameOverScene extends BaseScene {
  protected finalScore = 0;
  protected highScore = 0;
  protected reason?: string;
  protected gameScene: string;
  protected menuScene: string;
  protected rainGroup?: Phaser.GameObjects.Group;

  constructor(config?: GameOverSceneConfig) {
    super(config?.key ?? SCENE_KEYS.GAME_OVER);
    this.gameScene = config?.gameScene ?? SCENE_KEYS.GAME;
    this.menuScene = config?.menuScene ?? SCENE_KEYS.MENU;
  }

  init(data: GameOverData): void {
    this.finalScore = data.score ?? 0;
    this.highScore = data.highScore ?? this.finalScore;
    this.reason = data.reason;
  }

  create(): void {
    this.createMatrixBackground();
    this.rainGroup = this.addMatrixRain(20);

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    // Game Over title
    this.createMatrixText(centerX, height * 0.15, 'GAME OVER', 28, MATRIX_COLORS.RED_HEX);

    // Reason (if provided)
    if (this.reason) {
      this.createMatrixText(centerX, height * 0.25, this.reason, 12, MATRIX_COLORS.YELLOW_HEX);
    }

    // Score display
    this.createMatrixText(centerX, height * 0.4, 'SCORE', 14);
    this.createMatrixText(centerX, height * 0.48, this.finalScore.toString(), 24);

    // High score
    const isNewHighScore = this.finalScore >= this.highScore && this.finalScore > 0;
    if (isNewHighScore) {
      this.createMatrixText(
        centerX,
        height * 0.58,
        'NEW HIGH SCORE!',
        16,
        MATRIX_COLORS.YELLOW_HEX
      );
      this.createFlashingEffect(centerX, height * 0.58);
    } else {
      this.createMatrixText(centerX, height * 0.58, `HIGH SCORE: ${this.highScore}`, 12);
    }

    // Restart button
    this.createButton(centerX, height * 0.72, 'RESTART', () => this.restartGame());

    // Menu button
    this.createButton(centerX, height * 0.82, 'MENU', () => this.goToMenu());

    // Keyboard input
    this.setupGameOverInput();
    this.setupCommonInputs();
  }

  update(_time: number, delta: number): void {
    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }
  }

  /**
   * Create interactive button
   */
  protected createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 1);
    bg.fillRoundedRect(-80, -20, 160, 40, 6);
    bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
    bg.strokeRoundedRect(-80, -20, 160, 40, 6);

    // Button text
    const text = this.add.text(0, 0, label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(-80, -20, 160, 40);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Hover effect
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(MATRIX_COLORS.PRIMARY, 0.3);
      bg.fillRoundedRect(-80, -20, 160, 40, 6);
      bg.lineStyle(3, MATRIX_COLORS.PRIMARY, 1);
      bg.strokeRoundedRect(-80, -20, 160, 40, 6);
      text.setColor(MATRIX_COLORS.WHITE_HEX);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 1);
      bg.fillRoundedRect(-80, -20, 160, 40, 6);
      bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
      bg.strokeRoundedRect(-80, -20, 160, 40, 6);
      text.setColor(MATRIX_COLORS.PRIMARY_HEX);
    });

    container.on('pointerdown', () => {
      this.playSound('menu');
      onClick();
    });

    return container;
  }

  /**
   * Create flashing effect for new high score
   */
  protected createFlashingEffect(x: number, y: number): void {
    const flash = this.add.graphics();
    flash.fillStyle(MATRIX_COLORS.YELLOW, 0.2);
    flash.fillRoundedRect(x - 120, y - 15, 240, 30, 4);

    this.tweens.add({
      targets: flash,
      alpha: { from: 1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Set up keyboard input — ENTER, SPACE, and R all restart
   */
  protected setupGameOverInput(): void {
    if (!this.input.keyboard) {
      this.time.delayedCall(100, () => this.setupGameOverInput());
      return;
    }

    const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    enterKey.on('down', () => this.restartGame());

    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.on('down', () => this.restartGame());

    const rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    rKey.on('down', () => this.restartGame());

    // M key navigates to menu (keyboard-only users had no way to reach menu)
    const mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    mKey.on('down', () => {
      this.playSound('menu');
      this.goToMenu();
    });
  }

  /**
   * Restart the game
   */
  protected restartGame(): void {
    this.playSound('menu');
    this.scene.start(this.gameScene);
  }

  /**
   * Return to menu
   */
  protected goToMenu(): void {
    this.scene.start(this.menuScene);
  }
}
