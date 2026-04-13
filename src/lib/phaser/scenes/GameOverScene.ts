/**
 * GameOverScene - Base game over screen with Matrix theme
 *
 * Shows final score, high score, and restart/exit options.
 * Receives score data from game scene.
 */

import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, type GameOverStat } from '../types';

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
  stats?: GameOverStat[];
}

export class GameOverScene extends BaseScene {
  protected override allowPause = false;
  protected finalScore = 0;
  protected highScore = 0;
  protected reason?: string;
  protected stats: GameOverStat[] = [];
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
    this.stats = data.stats ?? [];
  }

  create(): void {
    this.createMatrixBackground();
    this.rainGroup = this.addMatrixRain(20);

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;
    const hasStats = this.stats.length > 0;

    const titleY = hasStats ? 0.08 : 0.15;
    const reasonY = hasStats ? 0.16 : 0.25;
    const scoreY = hasStats ? 0.25 : 0.40;
    const scoreValueY = hasStats ? 0.31 : 0.48;
    const highScoreY = hasStats ? 0.38 : 0.58;
    const restartY = hasStats ? 0.78 : 0.72;
    const menuY = hasStats ? 0.88 : 0.82;

    this.createMatrixText(centerX, height * titleY, 'GAME OVER', hasStats ? 24 : 28, MATRIX_COLORS.RED_HEX);

    if (this.reason) {
      this.createMatrixText(centerX, height * reasonY, this.reason, 11, MATRIX_COLORS.YELLOW_HEX);
    }

    this.createMatrixText(centerX, height * scoreY, 'SCORE', 12);
    this.createMatrixText(centerX, height * scoreValueY, this.finalScore.toString(), hasStats ? 20 : 24);

    const isNewHighScore = this.finalScore >= this.highScore && this.finalScore > 0;
    if (isNewHighScore) {
      this.createMatrixText(centerX, height * highScoreY, 'NEW HIGH SCORE!', 14, MATRIX_COLORS.YELLOW_HEX);
      this.createFlashingEffect(centerX, height * highScoreY);
    } else {
      this.createMatrixText(centerX, height * highScoreY, `HIGH SCORE: ${this.highScore}`, 11);
    }

    if (hasStats) {
      this.renderStatsGrid(centerX, height * 0.46, width, height);
    }

    this.createButton(centerX, height * restartY, 'RESTART', () => this.restartGame());
    this.createButton(centerX, height * menuY, 'MENU', () => this.goToMenu());

    this.setupGameOverInput();
    this.setupCommonInputs();
  }

  update(_time: number, delta: number): void {
    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }
    this.exposeTestState({ score: this.finalScore, highScore: this.highScore });
  }

  /**
   * Render per-game stats in a two-column grid
   */
  protected renderStatsGrid(centerX: number, startY: number, width: number, _height: number): void {
    const stats = this.stats;
    if (stats.length === 0) return;

    const separator = this.add.graphics();
    separator.lineStyle(1, MATRIX_COLORS.DARK_GREEN, 0.6);
    const lineW = Math.min(width * 0.6, 400);
    separator.lineBetween(centerX - lineW / 2, startY - 20, centerX + lineW / 2, startY - 20);

    const columns = stats.length === 1 ? 1 : 2;
    const columnGap = Math.min(width * 0.38, 300);
    const rowHeight = 28;

    for (let i = 0; i < stats.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);

      const colOffset = columns === 1 ? 0 : (col - 0.5) * columnGap;
      const x = centerX + colOffset;
      const y = startY + row * rowHeight;

      this.add.text(x - 8, y, stats[i].label.toUpperCase(), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#338833',
        align: 'right',
      }).setOrigin(1, 0.5);

      this.add.text(x + 8, y, String(stats[i].value), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: MATRIX_COLORS.PRIMARY_HEX,
        align: 'left',
      }).setOrigin(0, 0.5);
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
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.on('down', () => this.restartGame());

      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => this.restartGame());

      const rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      rKey.on('down', () => this.restartGame());

      // Q key navigates to menu (M is reserved for mute toggle in BaseScene)
      const qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      qKey.on('down', () => {
        this.playSound('menu');
        this.goToMenu();
      });
    });
  }

  shutdown(): void {
    this.tweens?.killAll();
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    super.shutdown();
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
