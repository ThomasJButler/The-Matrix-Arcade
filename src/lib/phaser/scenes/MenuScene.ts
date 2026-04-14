/**
 * MenuScene - Base menu scene with Matrix theme
 *
 * Shows title, start button, and matrix rain background.
 * Override for game-specific menu options.
 */

import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../types';

export interface MenuSceneConfig {
  /** Scene key for this menu scene */
  key?: string;
  /** Game title to display */
  title?: string;
  /** Subtitle or instructions */
  subtitle?: string;
  /** Scene to start on play */
  gameScene?: string;
}

export class MenuScene extends BaseScene {
  protected override allowPause = false;
  protected title: string;
  protected subtitle: string;
  protected gameScene: string;
  protected rainGroup?: Phaser.GameObjects.Group;

  constructor(config?: MenuSceneConfig) {
    super(config?.key ?? SCENE_KEYS.MENU);
    this.title = config?.title ?? 'GAME';
    this.subtitle = config?.subtitle ?? 'Press ENTER or click START';
    this.gameScene = config?.gameScene ?? SCENE_KEYS.GAME;
  }

  create(): void {
    this.createMatrixBackground();
    this.rainGroup = this.addMatrixRain(30);

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    // Title
    this.createMatrixText(centerX, height * 0.25, this.title, 32);

    // Subtitle
    this.createMatrixText(centerX, height * 0.4, this.subtitle, 12, MATRIX_COLORS.CYAN_HEX);

    // Start button
    this.createStartButton(centerX, height * 0.6);

    // Controls info
    this.createMatrixText(
      centerX,
      height * 0.85,
      'ESC: Exit  P: Pause  M: Mute',
      10,
      MATRIX_COLORS.PRIMARY_HEX
    ).setAlpha(0.3);

    // Keyboard input
    this.setupMenuInput();

    // Common inputs (ESC, P, M)
    this.setupCommonInputs();
  }

  update(_time: number, delta: number): void {
    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }
    this.exposeTestState({});
  }

  /**
   * Create interactive start button
   */
  protected createStartButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 1);
    bg.fillRoundedRect(-80, -25, 160, 50, 8);
    bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
    bg.strokeRoundedRect(-80, -25, 160, 50, 8);

    // Button text
    const text = this.add.text(0, 0, 'START', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(-80, -25, 160, 50);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Hover effect
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(MATRIX_COLORS.PRIMARY, 0.3);
      bg.fillRoundedRect(-80, -25, 160, 50, 8);
      bg.lineStyle(3, MATRIX_COLORS.PRIMARY, 1);
      bg.strokeRoundedRect(-80, -25, 160, 50, 8);
      text.setColor(MATRIX_COLORS.WHITE_HEX);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 1);
      bg.fillRoundedRect(-80, -25, 160, 50, 8);
      bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
      bg.strokeRoundedRect(-80, -25, 160, 50, 8);
      text.setColor(MATRIX_COLORS.PRIMARY_HEX);
    });

    // Click to start
    container.on('pointerdown', () => {
      this.startGame();
    });

    return container;
  }

  /**
   * Set up keyboard input for menu
   */
  protected setupMenuInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.on('down', () => this.startGame());

      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => this.startGame());
    });
  }

  shutdown(): void {
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    super.shutdown();
  }

  /**
   * Start the game
   */
  protected startGame(): void {
    this.playSound('menu');
    this.scene.start(this.gameScene);
  }
}
