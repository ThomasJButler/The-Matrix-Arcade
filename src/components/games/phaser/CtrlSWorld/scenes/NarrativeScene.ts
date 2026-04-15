import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { CTRLS_SCENE_KEYS, GAME_CONFIG, CHARACTERS, PORTRAIT_CONFIG, PARALLAX_CONFIG, type CharacterDef } from '../config';
import { TypewriterEngine } from '../engine/TypewriterEngine';
import {
  getChapter,
  getPuzzleTriggersForParagraph,
  getAsciiPanelForParagraph,
  getChoiceTriggerForParagraph,
  getSpeakerForParagraph,
  type Chapter,
  type ChoiceOption,
  type ParticleTheme,
} from '../../../../../data/ctrlsChapters';

export interface NarrativeSceneData {
  chapterIndex: number;
  startFromParagraph?: number;
}

const MAX_VISIBLE_COMPLETED = 4;
const ASCII_FONT_SIZE = '7px';
const ASCII_LINE_HEIGHT = 9;
const CHOICE_BUTTON_WIDTH = 450;
const CHOICE_BUTTON_HEIGHT = 36;
const CHOICE_BUTTON_GAP = 10;
const CHOICE_FADE_DURATION = 400;

export class CtrlSNarrativeScene extends BaseScene {
  private chapterIndex = 0;
  private chapter?: Chapter;
  private chapterTitle?: Phaser.GameObjects.Text;
  private chapterAscii?: Phaser.GameObjects.Text;
  private bodyText?: Phaser.GameObjects.Text;
  private completedTexts: Phaser.GameObjects.Text[] = [];
  private asciiPanels: Phaser.GameObjects.Text[] = [];
  private cursorBlink?: Phaser.GameObjects.Text;
  private promptText?: Phaser.GameObjects.Text;
  private rainGroup?: Phaser.GameObjects.Group;
  private engine: TypewriterEngine;
  private cursorTween?: Phaser.Tweens.Tween;
  private waitingForPuzzle = false;
  private waitingForChoice = false;
  private waitingForInventory = false;
  private choiceContainer?: Phaser.GameObjects.Container;
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private activeChoices: ChoiceOption[] = [];
  private selectedChoiceIndex = 0;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private startFromParagraph = 0;
  private portraitContainer?: Phaser.GameObjects.Container;
  private portraitImage?: Phaser.GameObjects.Image;
  private portraitMonogram?: Phaser.GameObjects.Text;
  private portraitBorder?: Phaser.GameObjects.Graphics;
  private portraitName?: Phaser.GameObjects.Text;
  private currentSpeakerId?: string;
  private bgImage?: Phaser.GameObjects.Image;
  private bgBaseX = 0;
  private bgElapsed = 0;
  private themeParticles: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(CTRLS_SCENE_KEYS.NARRATIVE);
    this.engine = new TypewriterEngine();
  }

  init(data: NarrativeSceneData): void {
    this.chapterIndex = data.chapterIndex ?? 0;
    this.startFromParagraph = data.startFromParagraph ?? 0;
    this.chapter = getChapter(this.chapterIndex);
    this.waitingForPuzzle = false;
    this.waitingForInventory = false;

    this.engine.setSpeed(GAME_CONFIG.TEXT.TYPEWRITER_SPEED_MEDIUM);
    this.engine.setCallbacks({
      onParagraphComplete: (idx: number) => this.onParagraphComplete(idx),
      onAllComplete: () => this.onAllComplete(),
    });

    const paragraphs = this.chapter?.paragraphs ?? [
      'Story content will render here.',
      'The typewriter engine reveals text character by character with user-controlled pacing.',
      'Press SPACE, ENTER, or click to advance.',
    ];
    this.engine.load(paragraphs);
  }

  create(): void {
    this.createMatrixBackground();
    this.createParallaxBackground();
    this.createThemeParticles();
    this.rainGroup = this.addMatrixRain(15);

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const margin = GAME_CONFIG.TEXT.MARGIN_X;

    const title = this.chapter?.title ?? `Chapter ${this.chapterIndex}`;
    this.chapterTitle = this.add.text(margin, 20, title, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });

    let contentStartY = GAME_CONFIG.TEXT.MARGIN_Y;

    if (this.chapter?.ascii && this.startFromParagraph === 0) {
      const asciiText = this.chapter.ascii.join('\n');
      this.chapterAscii = this.add.text(margin, 45, asciiText, {
        fontFamily: MATRIX_FONTS.MONO,
        fontSize: ASCII_FONT_SIZE,
        color: MATRIX_COLORS.DIM_GREEN_HEX,
        lineSpacing: 1,
      });
      this.chapterAscii.setAlpha(0.7);

      const asciiHeight = this.chapter.ascii.length * ASCII_LINE_HEIGHT;
      contentStartY = 45 + asciiHeight + 15;

      this.tweens.add({
        targets: this.chapterAscii,
        alpha: { from: 0, to: 0.7 },
        duration: 1500,
        ease: 'Power2',
      });
    }

    this.bodyText = this.add.text(margin, contentStartY, '', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
      wordWrap: { width: width - margin * 2 },
      lineSpacing: 8,
    });

    this.cursorBlink = this.add.text(margin, contentStartY, '█', {
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

    if (this.startFromParagraph > 0) {
      this.engine.startFromParagraph(this.startFromParagraph);
      this.updatePortraitForParagraph(this.startFromParagraph);
    } else {
      this.engine.start();
      this.updatePortraitForParagraph(0);
    }
  }

  update(_time: number, delta: number): void {
    if (this.isPaused) {
      this.exposeTestState(this.buildTestState());
      return;
    }

    this.updateParallaxBackground(delta);
    this.updateThemeParticles(delta);

    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }

    if (!this.waitingForPuzzle && !this.waitingForChoice && !this.waitingForInventory) {
      this.engine.update(delta);
    }
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

  private onParagraphComplete(paragraphIndex: number): void {
    this.playSound('menu');
    this.promoteCompletedParagraph();

    if (!this.chapter) return;

    const nextIndex = paragraphIndex + 1;
    if (nextIndex < this.chapter.paragraphs.length) {
      this.updatePortraitForParagraph(nextIndex);
    }

    const asciiPanel = getAsciiPanelForParagraph(this.chapter, paragraphIndex);
    if (asciiPanel) {
      this.showInlineAscii(asciiPanel.art);
    }

    const puzzleTrigger = getPuzzleTriggersForParagraph(this.chapter, paragraphIndex);
    if (puzzleTrigger) {
      this.waitingForPuzzle = true;
      this.promptText?.setText('Puzzle incoming...');
      this.playSound('powerUp');

      this.time.delayedCall(800, () => {
        this.emitGameEvent({
          type: 'pause',
          data: {
            action: 'openPuzzle',
            puzzleId: puzzleTrigger.puzzleId,
            chapterIndex: this.chapterIndex,
            paragraphIndex,
          },
        });
      });
      return;
    }

    const choiceTrigger = getChoiceTriggerForParagraph(this.chapter, paragraphIndex);
    if (choiceTrigger) {
      this.waitingForChoice = true;
      this.promptText?.setText('Use ↑↓ and ENTER to choose');
      this.playSound('powerUp');
      this.time.delayedCall(300, () => {
        this.showChoiceUI(choiceTrigger.choices, choiceTrigger.prompt);
      });
    }
  }

  private showInlineAscii(art: string[]): void {
    if (!this.bodyText) return;

    const margin = GAME_CONFIG.TEXT.MARGIN_X;
    const currentY = this.bodyText.y;

    const asciiText = this.add.text(margin, currentY, art.join('\n'), {
      fontFamily: MATRIX_FONTS.MONO,
      fontSize: ASCII_FONT_SIZE,
      color: MATRIX_COLORS.MEDIUM_GREEN_HEX,
      lineSpacing: 1,
    });
    asciiText.setAlpha(0);
    this.asciiPanels.push(asciiText);

    this.tweens.add({
      targets: asciiText,
      alpha: { from: 0, to: 0.8 },
      duration: 800,
      ease: 'Power2',
    });

    const asciiHeight = art.length * ASCII_LINE_HEIGHT + 10;
    this.bodyText.setY(currentY + asciiHeight);
  }

  resumeAfterPuzzle(): void {
    this.waitingForPuzzle = false;
    this.promptText?.setText('Press SPACE or ENTER to advance');
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

    if (this.chapterAscii) {
      const asciiHeight = this.chapterAscii.height;
      y = 45 + asciiHeight + 15;
    }

    for (const text of this.completedTexts) {
      text.setPosition(GAME_CONFIG.TEXT.MARGIN_X, y);
      y += text.height + GAME_CONFIG.TEXT.LINE_HEIGHT;
    }

    for (const ascii of this.asciiPanels) {
      if (ascii.active) {
        ascii.setPosition(GAME_CONFIG.TEXT.MARGIN_X, y);
        y += ascii.height + 10;
      }
    }

    const textX = this.currentSpeakerId ? PORTRAIT_CONFIG.TEXT_INDENT : GAME_CONFIG.TEXT.MARGIN_X;
    if (this.bodyText) {
      this.bodyText.setPosition(textX, y);
    }
    this.syncPortraitY();
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
      enterKey.on('down', () => {
        if (this.waitingForChoice && this.activeChoices.length > 0) {
          this.confirmChoice(this.selectedChoiceIndex);
        } else {
          this.handleAdvance();
        }
      });

      const iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
      iKey.on('down', () => this.toggleInventory());

      this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.upKey.on('down', () => this.navigateChoice(-1));

      this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      this.downKey.on('down', () => this.navigateChoice(1));
    });

    this.input.on('pointerdown', () => this.handleAdvance());
  }

  private handleAdvance(): void {
    if (this.isPaused || this.waitingForPuzzle || this.waitingForChoice || this.waitingForInventory) return;

    if (this.chapterAscii && this.engine.paragraphIndex === 0 && this.engine.state === 'IDLE') {
      this.tweens.add({
        targets: this.chapterAscii,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.chapterAscii?.destroy();
          this.chapterAscii = undefined;
          this.layoutCompletedTexts();
        },
      });
    }

    this.engine.advance();
  }

  private toggleInventory(): void {
    this.waitingForInventory = true;
    this.emitGameEvent({ type: 'pause', data: { action: 'openInventory' } });
  }

  resumeAfterInventory(): void {
    this.waitingForInventory = false;
  }

  private showChoiceUI(choices: ChoiceOption[], prompt?: string): void {
    if (!this.bodyText) return;

    const width = Number(this.game.config.width);
    const startY = this.bodyText.getBounds().bottom + 30;

    this.activeChoices = choices;
    this.selectedChoiceIndex = 0;
    this.choiceButtons = [];

    this.choiceContainer = this.add.container(0, 0);
    this.choiceContainer.setAlpha(0);

    if (prompt) {
      const promptLabel = this.add.text(width / 2, startY - 20, prompt, {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '10px',
        color: MATRIX_COLORS.DIM_GREEN_HEX,
      });
      promptLabel.setOrigin(0.5);
      this.choiceContainer.add(promptLabel);
    }

    choices.forEach((choice, i) => {
      const buttonY = startY + i * (CHOICE_BUTTON_HEIGHT + CHOICE_BUTTON_GAP);
      const button = this.createChoiceButton(choice.label, width / 2, buttonY, i);
      this.choiceButtons.push(button);
      this.choiceContainer!.add(button);
    });

    this.highlightChoice(0);

    this.tweens.add({
      targets: this.choiceContainer,
      alpha: 1,
      duration: CHOICE_FADE_DURATION,
      ease: 'Power2',
    });
  }

  private createChoiceButton(
    label: string,
    x: number,
    y: number,
    index: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.lineStyle(1, MATRIX_COLORS.DARK_GREEN, 0.8);
    bg.fillStyle(MATRIX_COLORS.BACKGROUND, 0.9);
    bg.fillRoundedRect(
      -CHOICE_BUTTON_WIDTH / 2, -CHOICE_BUTTON_HEIGHT / 2,
      CHOICE_BUTTON_WIDTH, CHOICE_BUTTON_HEIGHT, 4,
    );
    bg.strokeRoundedRect(
      -CHOICE_BUTTON_WIDTH / 2, -CHOICE_BUTTON_HEIGHT / 2,
      CHOICE_BUTTON_WIDTH, CHOICE_BUTTON_HEIGHT, 4,
    );

    const text = this.add.text(0, 0, label, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
      wordWrap: { width: CHOICE_BUTTON_WIDTH - 30 },
      align: 'center',
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(CHOICE_BUTTON_WIDTH, CHOICE_BUTTON_HEIGHT);

    const hitArea = new Phaser.Geom.Rectangle(
      -CHOICE_BUTTON_WIDTH / 2, -CHOICE_BUTTON_HEIGHT / 2,
      CHOICE_BUTTON_WIDTH, CHOICE_BUTTON_HEIGHT,
    );
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      this.selectedChoiceIndex = index;
      this.highlightChoice(index);
    });

    container.on('pointerdown', () => {
      this.confirmChoice(index);
    });

    container.setData('bg', bg);
    container.setData('text', text);

    return container;
  }

  private highlightChoice(index: number): void {
    this.choiceButtons.forEach((button, i) => {
      const bg = button.getData('bg') as Phaser.GameObjects.Graphics;
      const text = button.getData('text') as Phaser.GameObjects.Text;

      bg.clear();
      if (i === index) {
        bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
        bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.6);
        text.setColor(MATRIX_COLORS.PRIMARY_HEX);
      } else {
        bg.lineStyle(1, MATRIX_COLORS.DARK_GREEN, 0.8);
        bg.fillStyle(MATRIX_COLORS.BACKGROUND, 0.9);
        text.setColor(MATRIX_COLORS.DIM_GREEN_HEX);
      }
      bg.fillRoundedRect(
        -CHOICE_BUTTON_WIDTH / 2, -CHOICE_BUTTON_HEIGHT / 2,
        CHOICE_BUTTON_WIDTH, CHOICE_BUTTON_HEIGHT, 4,
      );
      bg.strokeRoundedRect(
        -CHOICE_BUTTON_WIDTH / 2, -CHOICE_BUTTON_HEIGHT / 2,
        CHOICE_BUTTON_WIDTH, CHOICE_BUTTON_HEIGHT, 4,
      );
    });

    this.playSound('menu');
  }

  private navigateChoice(direction: number): void {
    if (!this.waitingForChoice || this.activeChoices.length === 0) return;

    const newIndex = this.selectedChoiceIndex + direction;
    if (newIndex < 0 || newIndex >= this.activeChoices.length) return;

    this.selectedChoiceIndex = newIndex;
    this.highlightChoice(newIndex);
  }

  private confirmChoice(index: number): void {
    if (!this.waitingForChoice || index >= this.activeChoices.length) return;

    const choice = this.activeChoices[index];
    this.playSound('score');

    this.spawnChoiceParticles(this.choiceButtons[index]);

    this.emitGameEvent({
      type: 'pause',
      data: {
        action: 'choice',
        choiceId: choice.choiceId,
        label: choice.label,
        chapterIndex: this.chapterIndex,
      },
    });

    this.tweens.add({
      targets: this.choiceContainer,
      alpha: 0,
      duration: CHOICE_FADE_DURATION,
      ease: 'Power2',
      onComplete: () => {
        this.destroyChoiceUI();
        this.waitingForChoice = false;
        this.promptText?.setText('Press SPACE or ENTER to advance');

        if (choice.nextParagraphIndex !== undefined) {
          this.engine.startFromParagraph(choice.nextParagraphIndex);
        }
      },
    });
  }

  private spawnChoiceParticles(button: Phaser.GameObjects.Container): void {
    const bounds = button.getBounds();
    const cx = bounds.centerX;
    const cy = bounds.centerY;
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 200);
      const particle = this.add.text(cx, cy, '█', {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: MATRIX_COLORS.PRIMARY_HEX,
      });
      particle.setOrigin(0.5);

      this.tweens.add({
        targets: particle,
        x: cx + Math.cos(angle) * speed,
        y: cy + Math.sin(angle) * speed,
        alpha: 0,
        scale: { from: 1.5, to: 0 },
        duration: Phaser.Math.Between(400, 700),
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private destroyChoiceUI(): void {
    this.choiceContainer?.destroy(true);
    this.choiceContainer = undefined;
    this.choiceButtons = [];
    this.activeChoices = [];
    this.selectedChoiceIndex = 0;
  }

  private updatePortraitForParagraph(paragraphIndex: number): void {
    if (!this.chapter) return;

    const speakerId = getSpeakerForParagraph(this.chapter, paragraphIndex);
    if (speakerId === this.currentSpeakerId) return;

    const character = speakerId ? CHARACTERS[speakerId] : undefined;

    if (!character) {
      this.hidePortrait();
      this.currentSpeakerId = undefined;
      return;
    }

    this.currentSpeakerId = speakerId;
    this.showPortrait(character);
  }

  private showPortrait(character: CharacterDef): void {
    const margin = GAME_CONFIG.TEXT.MARGIN_X;
    const size = PORTRAIT_CONFIG.SIZE;
    const panelX = margin;
    const panelY = this.bodyText?.y ?? GAME_CONFIG.TEXT.MARGIN_Y;

    if (!this.portraitContainer) {
      this.portraitContainer = this.add.container(panelX, panelY);
      this.portraitContainer.setAlpha(0);
    }

    this.portraitContainer.removeAll(true);
    this.portraitImage = undefined;
    this.portraitMonogram = undefined;
    this.portraitBorder = undefined;
    this.portraitName = undefined;

    this.portraitBorder = this.add.graphics();
    this.portraitBorder.lineStyle(2, character.colour, 0.8);
    this.portraitBorder.fillStyle(MATRIX_COLORS.BACKGROUND, 0.9);
    this.portraitBorder.fillRect(0, 0, size, size);
    this.portraitBorder.strokeRect(0, 0, size, size);
    this.portraitContainer.add(this.portraitBorder);

    if (character.portraitKey && this.textures.exists(character.portraitKey)) {
      this.portraitImage = this.add.image(size / 2, size / 2, character.portraitKey);
      this.portraitImage.setDisplaySize(size - 4, size - 4);
      this.portraitContainer.add(this.portraitImage);
    } else {
      this.portraitMonogram = this.add.text(size / 2, size / 2, character.initial, {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '28px',
        color: character.colourHex,
      });
      this.portraitMonogram.setOrigin(0.5);
      this.portraitContainer.add(this.portraitMonogram);
    }

    this.portraitName = this.add.text(size / 2, size + PORTRAIT_CONFIG.NAME_OFFSET_Y, character.name, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '7px',
      color: character.colourHex,
    });
    this.portraitName.setOrigin(0.5, 0);
    this.portraitContainer.add(this.portraitName);

    this.portraitContainer.setPosition(panelX, panelY);

    this.tweens.add({
      targets: this.portraitContainer,
      alpha: 1,
      duration: PORTRAIT_CONFIG.FADE_DURATION,
      ease: 'Power2',
    });

    this.indentTextForPortrait(true);
  }

  private hidePortrait(): void {
    if (!this.portraitContainer) return;

    this.tweens.add({
      targets: this.portraitContainer,
      alpha: 0,
      duration: PORTRAIT_CONFIG.FADE_DURATION,
      ease: 'Power2',
    });

    this.indentTextForPortrait(false);
  }

  private indentTextForPortrait(indented: boolean): void {
    if (!this.bodyText) return;

    const width = Number(this.game.config.width);
    const targetX = indented ? PORTRAIT_CONFIG.TEXT_INDENT : GAME_CONFIG.TEXT.MARGIN_X;
    const targetWidth = width - targetX - GAME_CONFIG.TEXT.MARGIN_X;

    this.tweens.add({
      targets: this.bodyText,
      x: targetX,
      duration: PORTRAIT_CONFIG.FADE_DURATION,
      ease: 'Power2',
      onUpdate: () => {
        this.bodyText?.setWordWrapWidth(targetWidth);
      },
    });
  }

  private syncPortraitY(): void {
    if (!this.portraitContainer || !this.bodyText) return;
    if (this.portraitContainer.alpha <= 0) return;

    this.portraitContainer.setY(this.bodyText.y);
  }

  private createParallaxBackground(): void {
    if (!this.chapter?.backgroundKey) return;
    if (!this.textures.exists(this.chapter.backgroundKey)) return;

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);

    this.bgImage = this.add.image(width / 2, height / 2, this.chapter.backgroundKey);
    this.bgImage.setDisplaySize(width + PARALLAX_CONFIG.BG_DRIFT_AMPLITUDE * 2, height + 10);
    this.bgImage.setAlpha(PARALLAX_CONFIG.BG_ALPHA);

    if (this.chapter.backgroundTint) {
      this.bgImage.setTint(this.chapter.backgroundTint);
    }

    this.bgBaseX = width / 2;
    this.bgElapsed = 0;
  }

  private updateParallaxBackground(delta: number): void {
    if (!this.bgImage) return;

    this.bgElapsed += delta;
    const drift = Math.sin(this.bgElapsed / 1000 * PARALLAX_CONFIG.BG_DRIFT_SPEED * 0.1) * PARALLAX_CONFIG.BG_DRIFT_AMPLITUDE;
    this.bgImage.setX(this.bgBaseX + drift);
  }

  private createThemeParticles(): void {
    const theme = this.chapter?.particleTheme;
    if (!theme) return;

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const count = PARALLAX_CONFIG.PARTICLE_COUNT;
    const chars = this.getParticleChars(theme);

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const char = chars[Phaser.Math.Between(0, chars.length - 1)];

      const particle = this.add.text(x, y, char, {
        fontFamily: 'monospace',
        fontSize: this.getParticleFontSize(theme),
        color: this.getParticleColour(theme),
      });
      particle.setAlpha(Phaser.Math.FloatBetween(PARALLAX_CONFIG.PARTICLE_MIN_ALPHA, PARALLAX_CONFIG.PARTICLE_MAX_ALPHA));
      particle.setData('speedX', this.getParticleSpeedX(theme));
      particle.setData('speedY', this.getParticleSpeedY(theme));
      particle.setData('theme', theme);

      this.themeParticles.push(particle);
    }
  }

  private updateThemeParticles(delta: number): void {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const dt = delta / 1000;

    for (const p of this.themeParticles) {
      const speedX = p.getData('speedX') as number;
      const speedY = p.getData('speedY') as number;
      const theme = p.getData('theme') as ParticleTheme;

      p.x += speedX * dt;
      p.y += speedY * dt;

      if (theme === 'temporal') {
        p.setAlpha(0.15 + Math.sin(p.x * 0.05 + p.y * 0.03) * 0.15);
      }

      if (p.y > height + 10) {
        p.y = -10;
        p.x = Phaser.Math.Between(0, width);
      } else if (p.y < -10) {
        p.y = height + 10;
        p.x = Phaser.Math.Between(0, width);
      }
      if (p.x > width + 10) {
        p.x = -10;
      } else if (p.x < -10) {
        p.x = width + 10;
      }
    }
  }

  private getParticleChars(theme: ParticleTheme): string[] {
    switch (theme) {
      case 'binary': return ['0', '1', '0', '1', '0', '1'];
      case 'scanlines': return ['─', '═', '─', '━'];
      case 'datastreams': return ['>', '>>', '→', '▶', '»'];
      case 'temporal': return ['◊', '✦', '·', '○', '◈'];
      case 'organic': return ['✿', '❋', '·', '°', '○'];
      case 'rising-light': return ['✧', '·', '°', '☀', '✦'];
    }
  }

  private getParticleColour(theme: ParticleTheme): string {
    switch (theme) {
      case 'binary': return MATRIX_COLORS.DIM_GREEN_HEX;
      case 'scanlines': return MATRIX_COLORS.DARK_GREEN_HEX;
      case 'datastreams': return MATRIX_COLORS.MEDIUM_GREEN_HEX;
      case 'temporal': return MATRIX_COLORS.CYAN_HEX;
      case 'organic': return MATRIX_COLORS.FOREST_GREEN_HEX;
      case 'rising-light': return MATRIX_COLORS.YELLOW_HEX;
    }
  }

  private getParticleFontSize(theme: ParticleTheme): string {
    switch (theme) {
      case 'scanlines': return '4px';
      case 'datastreams': return '8px';
      default: return '6px';
    }
  }

  private getParticleSpeedX(theme: ParticleTheme): number {
    switch (theme) {
      case 'datastreams': return Phaser.Math.FloatBetween(30, 80);
      case 'temporal': return Phaser.Math.FloatBetween(-15, 15);
      case 'scanlines': return Phaser.Math.FloatBetween(-2, 2);
      default: return Phaser.Math.FloatBetween(-5, 5);
    }
  }

  private getParticleSpeedY(theme: ParticleTheme): number {
    switch (theme) {
      case 'binary': return Phaser.Math.FloatBetween(10, 25);
      case 'scanlines': return Phaser.Math.FloatBetween(3, 8);
      case 'datastreams': return Phaser.Math.FloatBetween(-3, 3);
      case 'temporal': return Phaser.Math.FloatBetween(-10, 10);
      case 'organic': return Phaser.Math.FloatBetween(-8, -2);
      case 'rising-light': return Phaser.Math.FloatBetween(-20, -8);
    }
  }

  protected handleExit(): void {
    this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
  }

  private buildTestState(): Record<string, unknown> {
    const snapshot = this.engine.getSnapshot();
    return {
      chapterIndex: this.chapterIndex,
      chapterId: this.chapter?.id,
      phase: 'narrative',
      waitingForPuzzle: this.waitingForPuzzle,
      waitingForChoice: this.waitingForChoice,
      waitingForInventory: this.waitingForInventory,
      activeChoices: this.activeChoices.map((c) => c.label),
      selectedChoiceIndex: this.selectedChoiceIndex,
      currentSpeaker: this.currentSpeakerId ?? null,
      portraitVisible: (this.portraitContainer?.alpha ?? 0) > 0,
      typewriter: snapshot,
    };
  }

  shutdown(): void {
    this.bgImage?.destroy();
    this.bgImage = undefined;
    for (const p of this.themeParticles) {
      p.destroy();
    }
    this.themeParticles = [];
    this.rainGroup?.destroy(true);
    this.rainGroup = undefined;
    this.chapterTitle?.destroy();
    this.chapterAscii?.destroy();
    this.chapterAscii = undefined;
    this.bodyText?.destroy();
    this.cursorBlink?.destroy();
    this.cursorTween?.destroy();
    this.promptText?.destroy();
    for (const text of this.completedTexts) {
      text.destroy();
    }
    this.completedTexts = [];
    for (const ascii of this.asciiPanels) {
      ascii.destroy();
    }
    this.asciiPanels = [];
    this.destroyChoiceUI();
    this.portraitContainer?.destroy(true);
    this.portraitContainer = undefined;
    this.portraitImage = undefined;
    this.portraitMonogram = undefined;
    this.portraitBorder = undefined;
    this.portraitName = undefined;
    this.currentSpeakerId = undefined;
    this.waitingForPuzzle = false;
    this.waitingForChoice = false;
    this.waitingForInventory = false;
    this.upKey?.destroy();
    this.downKey?.destroy();
    this.upKey = undefined;
    this.downKey = undefined;
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    this.input.off('pointerdown');
    super.shutdown();
  }
}
