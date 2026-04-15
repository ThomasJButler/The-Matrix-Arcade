import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { CTRLS_SCENE_KEYS, GAME_CONFIG } from '../config';
import { TypewriterEngine } from '../engine/TypewriterEngine';

interface NarrativeSceneData {
  chapterIndex: number;
  paragraphs?: string[];
}

const MAX_VISIBLE_COMPLETED = 4;

export class CtrlSNarrativeScene extends BaseScene {
  private chapterIndex = 0;
  private chapterTitle?: Phaser.GameObjects.Text;
  private bodyText?: Phaser.GameObjects.Text;
  private completedTexts: Phaser.GameObjects.Text[] = [];
  private cursorBlink?: Phaser.GameObjects.Text;
  private promptText?: Phaser.GameObjects.Text;
  private rainGroup?: Phaser.GameObjects.Group;
  private engine: TypewriterEngine;
  private cursorTween?: Phaser.Tweens.Tween;

  constructor() {
    super(CTRLS_SCENE_KEYS.NARRATIVE);
    this.engine = new TypewriterEngine();
  }

  init(data: NarrativeSceneData): void {
    this.chapterIndex = data.chapterIndex ?? 0;

    this.engine.setSpeed(GAME_CONFIG.TEXT.TYPEWRITER_SPEED_MEDIUM);
    this.engine.setCallbacks({
      onParagraphComplete: () => this.onParagraphComplete(),
      onAllComplete: () => this.onAllComplete(),
    });

    const paragraphs = data.paragraphs ?? [
      'Story content will render here.',
      'The typewriter engine reveals text character by character with user-controlled pacing.',
      'Press SPACE, ENTER, or click to advance.',
    ];
    this.engine.load(paragraphs);
  }

  create(): void {
    this.createMatrixBackground();
    this.rainGroup = this.addMatrixRain(15);

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const margin = GAME_CONFIG.TEXT.MARGIN_X;

    this.chapterTitle = this.add.text(margin, 30, `Chapter ${this.chapterIndex}`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '16px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });

    this.bodyText = this.add.text(margin, GAME_CONFIG.TEXT.MARGIN_Y, '', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
      wordWrap: { width: width - margin * 2 },
      lineSpacing: 8,
    });

    this.cursorBlink = this.add.text(margin, GAME_CONFIG.TEXT.MARGIN_Y, '█', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.cursorTween = this.tweens.add({
      targets: this.cursorBlink,
      alpha: { from: 1, to: 0 },
      duration: 530,
      yoyo: true,
      repeat: -1,
    });

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

    this.engine.start();
  }

  update(_time: number, delta: number): void {
    if (this.isPaused) {
      this.exposeTestState(this.buildTestState());
      return;
    }

    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }

    this.engine.update(delta);
    this.renderCurrentText();
    this.exposeTestState(this.buildTestState());
  }

  private renderCurrentText(): void {
    if (!this.bodyText || !this.cursorBlink) return;

    const revealed = this.engine.revealedText;
    this.bodyText.setText(revealed);

    const bounds = this.bodyText.getBounds();
    if (this.engine.state === 'TYPING') {
      this.cursorBlink.setVisible(true);
      this.cursorBlink.setPosition(bounds.right + 2, bounds.bottom - 14);
    } else {
      this.cursorBlink.setVisible(this.engine.state === 'WAITING');
      if (this.engine.state === 'WAITING') {
        this.cursorBlink.setPosition(bounds.right + 2, bounds.bottom - 14);
      }
    }
  }

  private onParagraphComplete(): void {
    this.playSound('menu');
    this.promoteCompletedParagraph();
  }

  private promoteCompletedParagraph(): void {
    if (!this.bodyText) return;

    const width = Number(this.game.config.width);
    const margin = GAME_CONFIG.TEXT.MARGIN_X;

    const completedText = this.add.text(margin, 0, this.engine.currentFullParagraph, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.DEEP_GREEN_HEX,
      wordWrap: { width: width - margin * 2 },
      lineSpacing: 8,
    });
    completedText.setAlpha(0.6);
    this.completedTexts.push(completedText);

    while (this.completedTexts.length > MAX_VISIBLE_COMPLETED) {
      const oldest = this.completedTexts.shift();
      oldest?.destroy();
    }

    this.layoutCompletedTexts();
  }

  private layoutCompletedTexts(): void {
    let y = GAME_CONFIG.TEXT.MARGIN_Y;
    for (const text of this.completedTexts) {
      text.setPosition(GAME_CONFIG.TEXT.MARGIN_X, y);
      y += text.height + GAME_CONFIG.TEXT.LINE_HEIGHT;
    }
    if (this.bodyText) {
      this.bodyText.setPosition(GAME_CONFIG.TEXT.MARGIN_X, y);
    }
  }

  private onAllComplete(): void {
    this.playSound('levelUp');
    this.promptText?.setText('Chapter complete');

    this.time.delayedCall(1500, () => {
      this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
    });
  }

  private setupNarrativeInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => this.handleAdvance());

      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.on('down', () => this.handleAdvance());

      const iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
      iKey.on('down', () => this.toggleInventory());
    });

    this.input.on('pointerdown', () => this.handleAdvance());
  }

  private handleAdvance(): void {
    if (this.isPaused) return;
    this.engine.advance();
  }

  private toggleInventory(): void {
    this.emitGameEvent({ type: 'pause', data: { action: 'openInventory' } });
  }

  protected handleExit(): void {
    this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
  }

  private buildTestState(): Record<string, unknown> {
    const snapshot = this.engine.getSnapshot();
    return {
      chapterIndex: this.chapterIndex,
      phase: 'narrative',
      typewriter: snapshot,
    };
  }

  shutdown(): void {
    this.rainGroup?.destroy(true);
    this.rainGroup = undefined;
    this.chapterTitle?.destroy();
    this.bodyText?.destroy();
    this.cursorBlink?.destroy();
    this.cursorTween?.destroy();
    this.promptText?.destroy();
    for (const text of this.completedTexts) {
      text.destroy();
    }
    this.completedTexts = [];
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    this.input.off('pointerdown');
    super.shutdown();
  }
}
