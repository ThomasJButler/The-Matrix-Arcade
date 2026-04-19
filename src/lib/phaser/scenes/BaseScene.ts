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
  PAUSE_REQUEST_EVENT,
  PAUSE_STATE_CHANGED_EVENT,
  REGISTRY_KEYS,
  SCENE_KEYS,
  MATRIX_COLORS,
  MATRIX_FONTS,
  type GameEvent,
  type GameOverStat,
  type PauseStateChangedDetail,
} from '../types';
import { MAX_BOARD_SIZE } from '../../../hooks/useSaveSystem';

export abstract class BaseScene extends Phaser.Scene {
  /**
   * Shared menu layout constants — override per-game only when the menu has
   * non-standard content stacking above the button. The defaults are tuned so
   * that a subclass rendering instruction text at the conventional 0.52–0.64
   * ratio band leaves clear air above the start button (which is ~50 px tall
   * and centred on this ratio). Previous default of 0.60 put the button
   * physically on top of those instruction rows on every canvas height 400–600
   * — see R83.G4 (Tom 2026-04-19 playtest).
   */
  protected static readonly MENU_START_BUTTON_Y_RATIO = 0.75;
  protected static readonly MENU_CONTROLS_HINT_Y_RATIO = 0.92;

  protected isPaused = false;
  protected allowPause = true;
  protected gameStartTime = 0;
  protected escKey?: Phaser.Input.Keyboard.Key;
  protected pauseKey?: Phaser.Input.Keyboard.Key;
  protected muteKey?: Phaser.Input.Keyboard.Key;
  private static readonly MAX_KEYBOARD_RETRIES = 10;
  private static readonly KEYBOARD_RETRY_MS = 50;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
  }

  /**
   * Wait for Phaser's keyboard plugin to initialise, then run the callback.
   * Polls every 50ms up to 10 times (500ms). If polling exhausts, falls back
   * to the scene's first update tick where the plugin is guaranteed ready.
   */
  protected waitForKeyboard(callback: () => void, retries = 0): void {
    if (this.input.keyboard) {
      callback();
      return;
    }

    if (retries < BaseScene.MAX_KEYBOARD_RETRIES) {
      this.time.delayedCall(BaseScene.KEYBOARD_RETRY_MS, () => this.waitForKeyboard(callback, retries + 1));
    } else {
      this.events.once('update', () => {
        if (this.input.keyboard) {
          callback();
        }
      });
    }
  }

  /**
   * Standard create setup - call from child create() method
   * Sets up keyboard shortcuts and common bindings
   */
  protected setupCommonInputs(): void {
    this.waitForKeyboard(() => this._bindCommonKeys());
    // Listen for pause requests dispatched by the React portal dashbar.
    // Registered outside waitForKeyboard so the hook is in place even before
    // Phaser's keyboard plugin finishes initialising.
    if (typeof window !== 'undefined') {
      window.addEventListener(PAUSE_REQUEST_EVENT, this._handlePauseRequest);
    }
  }

  /**
   * Honour React-side pause requests with the same gating as the in-game P key:
   * only toggles when this scene is the active one and pause is currently
   * allowed (not during countdown, not on scenes that opt out via allowPause).
   */
  private _handlePauseRequest = (): void => {
    if (!this.allowPause) return;
    if (this.isCountingDown) return;
    if (!this.scene.isActive()) return;
    this.togglePause();
  };

  private _bindCommonKeys(): void {
    if (!this.input.keyboard) return;

    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.handleExit());

    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.pauseKey.on('down', () => {
      if (!this.allowPause) return;
      this.togglePause();
    });

    this.muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.muteKey.on('down', () => this.toggleMute());
  }

  /**
   * Clean up common resources on scene shutdown.
   * All subclass shutdown() methods should call super.shutdown().
   */
  shutdown(): void {
    this.tweens?.killAll();
    this.time?.removeAllEvents();
    if (this.isPaused) {
      if (this.physics?.world) this.physics.resume();
      this.time.paused = false;
    }
    this.isPaused = false;
    this.countdownText?.destroy();
    this.countdownText = undefined;
    this.isCountingDown = false;
    if (this.input?.keyboard) {
      this.escKey?.destroy();
      this.pauseKey?.destroy();
      this.muteKey?.destroy();
    }
    this.escKey = undefined;
    this.pauseKey = undefined;
    this.muteKey = undefined;
    if (typeof window !== 'undefined') {
      window.removeEventListener(PAUSE_REQUEST_EVENT, this._handlePauseRequest);
    }
  }

  /**
   * Handle exit - emit event to React
   */
  protected handleExit(): void {
    this.emitGameEvent({ type: 'exit' });
  }

  /**
   * Toggle pause state. Presentation is owned by the React portal's dashbar
   * scrim (see `.ipod-pause-overlay` in GamePortal.tsx), which subscribes to
   * PAUSE_STATE_CHANGED_EVENT. Scenes only own the state flip and the engine
   * pause (physics, tweens, timers).
   */
  protected togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      if (this.physics?.world) this.physics.pause();
      this.tweens.pauseAll();
      this.time.paused = true;
      this.emitGameEvent({ type: 'pause' });
      this._dispatchPauseStateChanged(true);
    } else {
      this.resumeGame();
    }
  }

  protected resumeGame(): void {
    this.isPaused = false;
    if (this.physics?.world) this.physics.resume();
    this.tweens.resumeAll();
    this.time.paused = false;
    this.game.canvas.focus();
    this.emitGameEvent({ type: 'resume' });
    this._dispatchPauseStateChanged(false);
  }

  // Notifies the React portal's dashbar that the active scene's pause state
  // changed. Window-level event mirrors the inbound PAUSE_REQUEST_EVENT — both
  // sides of the bridge stay decoupled from per-game wrappers.
  private _dispatchPauseStateChanged(isPaused: boolean): void {
    if (typeof window === 'undefined') return;
    const detail: PauseStateChangedDetail = { isPaused };
    window.dispatchEvent(new CustomEvent(PAUSE_STATE_CHANGED_EVENT, { detail }));
  }

  // ---------------------------------------------------------------------------
  // Countdown overlay — 5-4-3-2-1-GO before gameplay
  // ---------------------------------------------------------------------------

  protected isCountingDown = false;
  protected countdownValue = 0;
  private countdownText?: Phaser.GameObjects.Text;

  protected startCountdown(seconds: number, onComplete: () => void): void {
    this.isCountingDown = true;
    this.countdownValue = seconds;
    this.allowPause = false;

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);

    this.countdownText = this.add.text(width / 2, height / 2, String(this.countdownValue), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '64px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.countdownText.setOrigin(0.5);
    this.countdownText.setDepth(200);

    this.tickCountdownStep(onComplete);
  }

  private tickCountdownStep(onComplete: () => void): void {
    if (this.countdownValue <= 0) {
      if (this.countdownText) {
        this.countdownText.setText('GO!');
        this.countdownText.setColor(MATRIX_COLORS.CYAN_HEX);
      }
      this.playSound('levelUp');

      this.tweens.add({
        targets: this.countdownText,
        alpha: 0,
        scale: 2,
        duration: 500,
        onComplete: () => {
          this.countdownText?.destroy();
          this.countdownText = undefined;
          this.isCountingDown = false;
          this.allowPause = true;
          this.gameStartTime = Date.now();
          onComplete();
        },
      });
      return;
    }

    if (this.countdownText) {
      this.countdownText.setText(String(this.countdownValue));
      this.countdownText.setScale(1);
      this.countdownText.setAlpha(1);
    }
    this.playSound('hit');

    this.tweens.add({
      targets: this.countdownText,
      scale: 0.6,
      alpha: 0.5,
      duration: 800,
      ease: 'Quad.easeIn',
    });

    this.countdownValue--;
    this.time.delayedCall(1000, () => this.tickCountdownStep(onComplete));
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
    return this.registry.get(REGISTRY_KEYS.AUTO_START) ?? false;
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
   * Play looping background music via React's sound system.
   * `ambientMultiplier` (0–1, default 1) lets a scene soften the mix locally
   * without permanently lowering the user's music slider.
   */
  protected playBackgroundMusic(src: string, ambientMultiplier = 1): void {
    const soundSystem = this.registry.get(REGISTRY_KEYS.SOUND_SYSTEM);
    if (soundSystem && typeof soundSystem.playBgMusic === 'function') {
      soundSystem.playBgMusic(src, ambientMultiplier);
    }
  }

  /**
   * Stop background music
   */
  protected stopBackgroundMusic(): void {
    const soundSystem = this.registry?.get(REGISTRY_KEYS.SOUND_SYSTEM);
    if (soundSystem && typeof soundSystem.stopBgMusic === 'function') {
      soundSystem.stopBgMusic();
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
        isCountingDown: this.isCountingDown,
        ...state,
      };
      // E2E ready marker — surfaced as a DOM attribute so Playwright can poll
      // it without evaluating page JS each tick. Updated every frame so it
      // reliably tracks scene transitions (vs hooking the CREATE event, which
      // misses scenes that fire during teardown timing windows).
      if (typeof document !== 'undefined') {
        document.body.dataset.gameReady = this.scene.key;
      }
    }
  }

  /**
   * Transition to game over scene
   */
  protected getGameDuration(): number {
    return this.gameStartTime > 0 ? Date.now() - this.gameStartTime : 0;
  }

  protected gameOver(
    score: number,
    reason?: string,
    highScore?: number,
    stats?: GameOverStat[],
    level?: number,
    durationMs?: number,
  ): void {
    this.stopBackgroundMusic();
    this.emitGameEvent({
      type: 'gameOver',
      data: { score, reason },
    });

    const gameOverData = { score, reason, highScore: highScore ?? score, stats };

    if (score > 0 && this.scene.manager.getScene(SCENE_KEYS.HIGH_SCORE_ENTRY)) {
      const saveSystem = this.game.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
      const gameId = this.game.registry.get(REGISTRY_KEYS.GAME_ID);
      if (saveSystem && gameId) {
        const saveData = saveSystem.getSaveData();
        const board = saveData?.scoreboards?.[gameId] ?? [];
        const qualifies = board.length < MAX_BOARD_SIZE || score > (board[board.length - 1]?.score ?? 0);
        if (qualifies) {
          this.scene.start(SCENE_KEYS.HIGH_SCORE_ENTRY, {
            ...gameOverData,
            level: level ?? 1,
            durationMs: durationMs ?? 0,
          });
          return;
        }
      }
    }

    this.scene.start(SCENE_KEYS.GAME_OVER, gameOverData);
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
      fontFamily: MATRIX_FONTS.PRIMARY,
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
    // In E2E test mode, skip rain entirely — Phaser uses its own RNG which the
    // ?test=1 seam can't seed, so rain animation produces non-stable pixels
    // across runs and breaks visual baselines.
    if (typeof window !== 'undefined' && (window as { __TEST__?: boolean }).__TEST__) {
      return rainGroup;
    }
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
