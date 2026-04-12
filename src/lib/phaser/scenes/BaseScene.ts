/**
 * BaseScene - Abstract base class for all Phaser scenes
 *
 * Provides common functionality:
 * - Registry helpers for accessing React props
 * - Sound system integration
 * - Achievement manager access
 * - Event emission to React
 * - Keyboard shortcut handling (ESC, P, M)
 */

import Phaser from 'phaser';
import {
  REGISTRY_KEYS,
  SCENE_KEYS,
  MATRIX_COLORS,
  type AchievementManager,
  type GameEvent,
} from '../types';

export abstract class BaseScene extends Phaser.Scene {
  protected isPaused = false;
  protected escKey?: Phaser.Input.Keyboard.Key;
  protected pauseKey?: Phaser.Input.Keyboard.Key;
  protected muteKey?: Phaser.Input.Keyboard.Key;
  private pauseOverlayBg?: Phaser.GameObjects.Graphics;
  private pauseOverlayText?: Phaser.GameObjects.Text;
  private pauseOverlayHint?: Phaser.GameObjects.Text;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
  }

  /**
   * Standard create setup - call from child create() method
   * Sets up keyboard shortcuts and common bindings
   */
  protected setupCommonInputs(): void {
    if (!this.input.keyboard) {
      this.time.delayedCall(100, () => this.setupCommonInputs());
      return;
    }

    // ESC - Exit game
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.handleExit());

    // P - Pause/unpause
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.pauseKey.on('down', () => this.togglePause());

    // M - Toggle mute
    this.muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.muteKey.on('down', () => this.toggleMute());
  }

  /**
   * Handle exit - emit event to React
   */
  protected handleExit(): void {
    this.emitGameEvent({ type: 'exit' });
  }

  /**
   * Toggle pause state with visible overlay
   */
  protected togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.showPauseOverlay();
      this.scene.pause();
      this.emitGameEvent({ type: 'pause' });
    } else {
      this.hidePauseOverlay();
      this.scene.resume();
      this.emitGameEvent({ type: 'resume' });
    }
  }

  /**
   * Show dimmed pause overlay with text — must be called BEFORE scene.pause()
   * because scene.pause() stops the update loop (but rendering continues)
   */
  private showPauseOverlay(): void {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);

    // Semi-transparent dark overlay
    this.pauseOverlayBg = this.add.graphics();
    this.pauseOverlayBg.fillStyle(0x000000, 0.6);
    this.pauseOverlayBg.fillRect(0, 0, width, height);
    this.pauseOverlayBg.setDepth(9998);

    // PAUSED text
    this.pauseOverlayText = this.add.text(width / 2, height / 2 - 20, 'PAUSED', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.pauseOverlayText.setOrigin(0.5);
    this.pauseOverlayText.setDepth(9999);

    // Hint text
    this.pauseOverlayHint = this.add.text(width / 2, height / 2 + 30, 'Press P to resume', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.pauseOverlayHint.setOrigin(0.5);
    this.pauseOverlayHint.setAlpha(0.7);
    this.pauseOverlayHint.setDepth(9999);
  }

  /**
   * Remove pause overlay — called BEFORE scene.resume()
   */
  private hidePauseOverlay(): void {
    this.pauseOverlayBg?.destroy();
    this.pauseOverlayText?.destroy();
    this.pauseOverlayHint?.destroy();
    this.pauseOverlayBg = undefined;
    this.pauseOverlayText = undefined;
    this.pauseOverlayHint = undefined;
  }

  /**
   * Toggle mute - updates registry and emits event
   */
  protected toggleMute(): void {
    const currentMuted = this.getIsMuted();
    this.registry.set(REGISTRY_KEYS.IS_MUTED, !currentMuted);
    this.emitGameEvent({ type: 'mute', data: { muted: !currentMuted } });
  }

  /**
   * Get achievement manager from registry
   */
  protected getAchievementManager(): AchievementManager | undefined {
    return this.registry.get(REGISTRY_KEYS.ACHIEVEMENT_MANAGER);
  }

  /**
   * Get mute state from registry
   */
  protected getIsMuted(): boolean {
    return this.registry.get(REGISTRY_KEYS.IS_MUTED) ?? false;
  }

  /**
   * Get game ID from registry
   */
  protected getGameId(): string {
    return this.registry.get(REGISTRY_KEYS.GAME_ID) ?? 'unknown';
  }

  /**
   * Check if auto-start is enabled
   */
  protected getAutoStart(): boolean {
    return this.registry.get('autoStart') ?? false;
  }

  /**
   * Emit game event to React handler
   */
  protected emitGameEvent(event: GameEvent): void {
    const handler = this.registry.get(REGISTRY_KEYS.ON_GAME_EVENT);
    if (typeof handler === 'function') {
      handler(event);
    }
  }

  /**
   * Play sound effect via React's sound system
   */
  protected playSound(key: string): void {
    const soundSystem = this.registry.get(REGISTRY_KEYS.SOUND_SYSTEM);
    if (soundSystem && typeof soundSystem.play === 'function' && !soundSystem.isMuted) {
      soundSystem.play(key);
    }
  }

  /**
   * Unlock achievement via both manager and save system
   */
  protected unlockAchievement(achievementId: string): void {
    this.emitGameEvent({
      type: 'achievement',
      data: { achievementId },
    });
  }

  /**
   * Report score to React for saving
   */
  protected reportScore(score: number, highScore?: number): void {
    this.emitGameEvent({
      type: 'score',
      data: { score, highScore },
    });
  }

  /**
   * Expose game state for E2E testing.
   * Writes state to window.__PHASER_GAME_STATE__ each frame when window.__TEST__ is set.
   * Call at the end of update() in each GameScene.
   */
  protected exposeTestState(state: Record<string, unknown>): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).__TEST__) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__PHASER_GAME_STATE__ = {
        scene: this.scene.key,
        isPaused: this.isPaused,
        ...state,
      };
    }
  }

  /**
   * Transition to game over scene
   */
  protected gameOver(score: number, reason?: string, highScore?: number): void {
    // Sound is played by PhaserGame.tsx when it receives the gameOver event —
    // do NOT also play here, or the sound fires twice.
    this.emitGameEvent({
      type: 'gameOver',
      data: { score, reason },
    });
    this.scene.start(SCENE_KEYS.GAME_OVER, { score, reason, highScore: highScore ?? score });
  }

  /**
   * Create Matrix-themed text with glow effect
   */
  protected createMatrixText(
    x: number,
    y: number,
    text: string,
    fontSize = 24,
    color = MATRIX_COLORS.PRIMARY_HEX
  ): Phaser.GameObjects.Text {
    const textObj = this.add.text(x, y, text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: `${fontSize}px`,
      color,
      align: 'center',
    });
    textObj.setOrigin(0.5);

    // Add glow effect via post pipeline if available
    if (this.renderer.type === Phaser.WEBGL) {
      textObj.setStyle({
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: color,
          blur: 8,
          fill: true,
        },
      });
    }

    return textObj;
  }

  /**
   * Create standard Matrix background
   */
  protected createMatrixBackground(): void {
    this.cameras.main.setBackgroundColor(MATRIX_COLORS.BACKGROUND);
  }

  /**
   * Add matrix rain effect (simple version)
   */
  protected addMatrixRain(density = 50): Phaser.GameObjects.Group {
    const rainGroup = this.add.group();
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';

    for (let i = 0; i < density; i++) {
      const x = Phaser.Math.Between(0, Number(this.game.config.width));
      const y = Phaser.Math.Between(-600, Number(this.game.config.height));
      const speed = Phaser.Math.Between(50, 150);
      const char = chars[Phaser.Math.Between(0, chars.length - 1)];
      const alpha = Phaser.Math.FloatBetween(0.1, 0.5);

      const text = this.add.text(x, y, char, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: MATRIX_COLORS.PRIMARY_HEX,
      });
      text.setAlpha(alpha);
      text.setData('speed', speed);
      text.setData('chars', chars);
      rainGroup.add(text);
    }

    return rainGroup;
  }

  /**
   * Update matrix rain animation
   */
  protected updateMatrixRain(rainGroup: Phaser.GameObjects.Group, delta: number): void {
    const gameHeight = Number(this.game.config.height);
    const gameWidth = Number(this.game.config.width);

    rainGroup.getChildren().forEach((obj) => {
      const text = obj as Phaser.GameObjects.Text;
      const speed = text.getData('speed') as number;
      const chars = text.getData('chars') as string;

      text.y += speed * (delta / 1000);

      // Reset when off screen
      if (text.y > gameHeight + 20) {
        text.y = -20;
        text.x = Phaser.Math.Between(0, gameWidth);
        text.setText(chars[Phaser.Math.Between(0, chars.length - 1)]);
      }

      // Occasionally change character
      if (Math.random() < 0.01) {
        text.setText(chars[Phaser.Math.Between(0, chars.length - 1)]);
      }
    });
  }
}
