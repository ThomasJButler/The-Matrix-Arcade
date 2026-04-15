/**
 * CTRL-S World - Narrative Scene
 *
 * Core gameplay scene: typewriter text rendering, paragraph-by-paragraph reveal,
 * user-controlled pacing (SPACE/ENTER/click to advance), puzzle triggers,
 * and chapter transitions.
 *
 * R80.3 will build the typewriter engine. R80.4+ will wire story data.
 * This is the structural skeleton with scene lifecycle and state management.
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { CTRLS_SCENE_KEYS, GAME_CONFIG } from '../config';

interface NarrativeSceneData {
  chapterIndex: number;
}

export class CtrlSNarrativeScene extends BaseScene {
  private chapterIndex = 0;
  private chapterTitle?: Phaser.GameObjects.Text;
  private bodyText?: Phaser.GameObjects.Text;
  private promptText?: Phaser.GameObjects.Text;
  private rainGroup?: Phaser.GameObjects.Group;

  constructor() {
    super(CTRLS_SCENE_KEYS.NARRATIVE);
  }

  init(data: NarrativeSceneData): void {
    this.chapterIndex = data.chapterIndex ?? 0;
  }

  create(): void {
    this.createMatrixBackground();
    this.rainGroup = this.addMatrixRain(15);

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const margin = GAME_CONFIG.TEXT.MARGIN_X;

    // Chapter title
    this.chapterTitle = this.add.text(margin, 30, `Chapter ${this.chapterIndex}`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '16px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });

    // Placeholder body text — R80.3 typewriter engine will replace this
    this.bodyText = this.add.text(margin, 80, 'Story content will render here.\n\nThe typewriter engine (R80.3) will reveal\ntext character by character with user-\ncontrolled pacing.', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
      wordWrap: { width: width - margin * 2 },
      lineSpacing: 8,
    });

    // Advance prompt
    this.promptText = this.add.text(width / 2, height - 40, 'Press SPACE or ENTER to advance', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
    });
    this.promptText.setOrigin(0.5);
    this.tweens.add({
      targets: this.promptText,
      alpha: { from: 1, to: 0.3 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    this.setupNarrativeInput();
    this.setupCommonInputs();
  }

  update(_time: number, delta: number): void {
    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }
    this.exposeTestState({
      chapterIndex: this.chapterIndex,
      phase: 'narrative',
    });
  }

  private setupNarrativeInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => this.advanceText());

      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.on('down', () => this.advanceText());

      // I key for inventory (R80.13)
      const iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
      iKey.on('down', () => this.toggleInventory());
    });

    // Click/tap to advance
    this.input.on('pointerdown', () => this.advanceText());
  }

  private advanceText(): void {
    // Placeholder — R80.3 typewriter engine will implement full logic:
    // 1. If typing in progress → skip to end of current paragraph
    // 2. If paragraph complete → advance to next paragraph
    // 3. If chapter complete → transition to next chapter or game over

    // For now, return to chapter hub as a functional demonstration
    this.playSound('menu');
    this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
  }

  private toggleInventory(): void {
    // R80.13 will implement inventory overlay via React modal bridge
    this.emitGameEvent({ type: 'pause', data: { action: 'openInventory' } });
  }

  protected handleExit(): void {
    this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
  }

  shutdown(): void {
    this.rainGroup?.destroy(true);
    this.rainGroup = undefined;
    this.chapterTitle?.destroy();
    this.bodyText?.destroy();
    this.promptText?.destroy();
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    this.input.off('pointerdown');
    super.shutdown();
  }
}
