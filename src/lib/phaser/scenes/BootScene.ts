/**
 * BootScene - Base boot scene for asset loading
 *
 * Extend this class for game-specific asset loading.
 * Shows Matrix-themed loading bar and transitions to menu or game.
 */

import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../types';

export interface BootSceneConfig {
  /** Scene key for this boot scene */
  key?: string;
  /** Scene to transition to after loading (default: MenuScene) */
  nextScene?: string;
  /** Asset loading callback - implement in subclass */
  loadAssets?: (scene: Phaser.Scene) => void;
}

export class BootScene extends BaseScene {
  protected nextScene: string;
  protected loadAssetsCallback?: (scene: Phaser.Scene) => void;

  constructor(config?: BootSceneConfig) {
    super(config?.key ?? SCENE_KEYS.BOOT);
    this.nextScene = config?.nextScene ?? SCENE_KEYS.MENU;
    this.loadAssetsCallback = config?.loadAssets;
  }

  preload(): void {
    this.createLoadingScreen();
    this.setupLoadingEvents();
    this.loadCommonAssets();

    // Call subclass asset loading
    if (this.loadAssetsCallback) {
      this.loadAssetsCallback(this);
    }
  }

  create(): void {
    // Check if we should skip menu and auto-start
    const autoStart = this.getAutoStart();
    const targetScene = autoStart ? SCENE_KEYS.GAME : this.nextScene;
    this.scene.start(targetScene);
  }

  /**
   * Create Matrix-themed loading screen
   */
  private createLoadingScreen(): void {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;
    const centerY = height / 2;

    // Background
    this.cameras.main.setBackgroundColor(MATRIX_COLORS.BACKGROUND);

    // Loading text
    const loadingText = this.add.text(centerX, centerY - 50, 'LOADING...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    loadingText.setOrigin(0.5);

    // Progress bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(MATRIX_COLORS.DARK_GREEN, 1);
    barBg.fillRect(centerX - 160, centerY, 320, 30);

    // Progress bar fill
    const barFill = this.add.graphics();
    barFill.setData('barWidth', 316);
    barFill.setData('barX', centerX - 158);
    barFill.setData('barY', centerY + 2);

    // Progress text
    const progressText = this.add.text(centerX, centerY + 50, '0%', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    progressText.setOrigin(0.5);

    // Store references for progress updates
    this.data.set('barFill', barFill);
    this.data.set('progressText', progressText);
  }

  /**
   * Set up loading progress events
   */
  private setupLoadingEvents(): void {
    this.load.on('progress', (value: number) => {
      const barFill = this.data.get('barFill') as Phaser.GameObjects.Graphics;
      const progressText = this.data.get('progressText') as Phaser.GameObjects.Text;

      if (barFill) {
        const barWidth = barFill.getData('barWidth') as number;
        const barX = barFill.getData('barX') as number;
        const barY = barFill.getData('barY') as number;

        barFill.clear();
        barFill.fillStyle(MATRIX_COLORS.PRIMARY, 1);
        barFill.fillRect(barX, barY, barWidth * value, 26);
      }

      if (progressText) {
        progressText.setText(`${Math.round(value * 100)}%`);
      }
    });

    this.load.on('complete', () => {
      const progressText = this.data.get('progressText') as Phaser.GameObjects.Text;
      if (progressText) {
        progressText.setText('READY');
      }
    });
  }

  /**
   * Load common assets used by most games
   * Override or extend in subclasses for game-specific assets
   */
  protected loadCommonAssets(): void {
    // Placeholder - subclasses will load their own assets
    // Common assets like fonts are loaded via CSS, not Phaser
  }
}
