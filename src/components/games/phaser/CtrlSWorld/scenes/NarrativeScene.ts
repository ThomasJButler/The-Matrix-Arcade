import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { CTRLS_SCENE_KEYS, GAME_CONFIG, CHARACTERS, PORTRAIT_CONFIG, PARALLAX_CONFIG, CHARACTER_TICK_MAP, NARRATOR_TICK, STINGER_KEYS, type CharacterDef } from '../config';
import { TypewriterEngine } from '../engine/TypewriterEngine';
import { TerminalEntryState } from '../engine/TerminalEntryState';
import {
  getChapter,
  getPuzzleTriggersForParagraph,
  getAsciiPanelForParagraph,
  getChoiceTriggerForParagraph,
  getTerminalTriggerForParagraph,
  getSpeakerForParagraph,
  type Chapter,
  type ChoiceOption,
  type ParticleTheme,
  type TerminalTrigger,
} from '../../../../../data/ctrlsChapters';

export interface NarrativeSceneData {
  chapterIndex: number;
  startFromParagraph?: number;
}

const ASCII_FONT_SIZE = '7px';
const ASCII_LINE_HEIGHT = 9;
const CURSOR_GAP_Y = 6;
const INLINE_ASCII_GAP_Y = 16;
const CHOICE_FADE_DURATION = 400;
// Inline terminal-prompt choice UI (R83.CTRLS.3). Choices render as
// `> [1] Label` lines below the active paragraph, mirroring a Matrix
// terminal. No buttons, no boxes — just text.
const CHOICE_PROMPT_GAP_Y = 18;
const CHOICE_LINE_GAP_Y = 4;
const CHOICE_LINE_FONT_SIZE = '12px';
const CHOICE_HINT_FONT_SIZE = '9px';
// Terminal-entry climax (R83.CTRLS.4). Rendered as a block below the final
// paragraph of a chapter: prompt, blinking `> _` input line, timer readout,
// attempts indicator. Player types `CTRL-S` or hits the Ctrl+S chord to save
// the world. Timeout/wrong → retry with shrinking timer; exhaust attempts →
// failure ending. Each ending line reveals on a fixed cadence then fades out
// to the chapter hub.
const TERMINAL_BLOCK_GAP_Y = 18;
const TERMINAL_LINE_GAP_Y = 4;
const TERMINAL_FONT_SIZE = '12px';
const TERMINAL_HINT_FONT_SIZE = '9px';
const TERMINAL_ENDING_LINE_DELAY_MS = 900;
const TERMINAL_ENDING_HOLD_MS = 1400;

export class CtrlSNarrativeScene extends BaseScene {
  private chapterIndex = 0;
  private chapter?: Chapter;
  private chapterTitle?: Phaser.GameObjects.Text;
  private chapterAscii?: Phaser.GameObjects.Text;
  private bodyText?: Phaser.GameObjects.Text;
  private asciiPanels: Phaser.GameObjects.Text[] = [];
  private cursorBlink?: Phaser.GameObjects.Text;
  private promptText?: Phaser.GameObjects.Text;
  private rainGroup?: Phaser.GameObjects.Group;
  private engine: TypewriterEngine;
  private cursorTween?: Phaser.Tweens.Tween;
  private waitingForPuzzle = false;
  private waitingForChoice = false;
  private waitingForInventory = false;
  private waitingForTerminal = false;
  private terminalResolved = false;
  private terminalState?: TerminalEntryState;
  private terminalTrigger?: TerminalTrigger;
  private terminalContainer?: Phaser.GameObjects.Container;
  private terminalPromptLabel?: Phaser.GameObjects.Text;
  private terminalInputLine?: Phaser.GameObjects.Text;
  private terminalStatusLine?: Phaser.GameObjects.Text;
  private terminalHintLabel?: Phaser.GameObjects.Text;
  private terminalEndingLines: Phaser.GameObjects.Text[] = [];
  private terminalCaretTween?: Phaser.Tweens.Tween;
  private terminalKeyHandler?: (event: KeyboardEvent) => void;
  private terminalCaretTimer = 0;
  private terminalCaretVisible = true;
  private choiceContainer?: Phaser.GameObjects.Container;
  private choiceLines: Phaser.GameObjects.Text[] = [];
  private choicePromptLabel?: Phaser.GameObjects.Text;
  private choiceHintLabel?: Phaser.GameObjects.Text;
  private activeChoices: ChoiceOption[] = [];
  private selectedChoiceIndex = 0;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private numberKeys: Phaser.Input.Keyboard.Key[] = [];
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
  private tickCounter = 0;

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
    this.waitingForTerminal = false;
    this.terminalResolved = false;

    this.engine.setSpeed(GAME_CONFIG.TEXT.TYPEWRITER_SPEED_MEDIUM);
    this.tickCounter = 0;
    this.engine.setCallbacks({
      onCharRevealed: () => this.onCharTick(),
      onParagraphStart: () => this.onParagraphStart(),
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

    if (this.chapter?.musicTrack) {
      this.playBackgroundMusic(this.chapter.musicTrack);
    }
    if (this.startFromParagraph === 0) {
      this.playSound(STINGER_KEYS.CHAPTER_START);
    }

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

    // When a modal Phaser scene (PuzzleScene, InventoryScene) stops and
    // resumes us, clear the blocking flag so advance/input resumes.
    this.events.on(Phaser.Scenes.Events.RESUME, this.onSceneResume, this);

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

    if (
      !this.waitingForPuzzle &&
      !this.waitingForChoice &&
      !this.waitingForInventory &&
      !this.waitingForTerminal
    ) {
      this.engine.update(delta);
    }
    this.renderCurrentText();
    this.tickTerminalEntry(delta);
    this.exposeTestState(this.buildTestState());
  }

  private renderCurrentText(): void {
    if (!this.bodyText || !this.cursorBlink) return;

    const revealed = this.engine.revealedText;
    this.bodyText.setText(revealed);

    const showCursor = this.engine.state === 'TYPING' || this.engine.state === 'WAITING';
    this.cursorBlink.setVisible(showCursor);
    if (!showCursor) return;

    // Cursor lives on its own line below the paragraph. When an inline ASCII
    // panel has been drawn below the paragraph (WAITING state), drop the
    // cursor below it so it does not overlap the art.
    let cursorY = this.bodyText.y + this.bodyText.height + CURSOR_GAP_Y;
    for (const ascii of this.asciiPanels) {
      if (!ascii.active) continue;
      const asciiBottom = ascii.y + ascii.height + CURSOR_GAP_Y;
      if (asciiBottom > cursorY) cursorY = asciiBottom;
    }
    this.cursorBlink.setPosition(this.bodyText.x, cursorY);
  }

  private computeContentStartY(): number {
    if (this.chapterAscii && this.chapterAscii.active) {
      return 45 + this.chapterAscii.height + 15;
    }
    return GAME_CONFIG.TEXT.MARGIN_Y;
  }

  private onCharTick(): void {
    this.tickCounter++;
    if (this.tickCounter % 3 !== 0) return;

    const tickKey = this.currentSpeakerId
      ? (CHARACTER_TICK_MAP[this.currentSpeakerId] ?? NARRATOR_TICK)
      : NARRATOR_TICK;
    this.playSound(tickKey);
  }

  private onParagraphStart(): void {
    // Single-paragraph region: every new paragraph starts from a clean slate.
    // Destroy any inline ASCII left over from the previous paragraph and snap
    // bodyText back to the baseline Y so the paragraph always appears in the
    // same place rather than scrolling downward.
    for (const ascii of this.asciiPanels) {
      ascii.destroy();
    }
    this.asciiPanels = [];

    if (this.bodyText) {
      this.bodyText.setY(this.computeContentStartY());
    }
    this.syncPortraitY();
  }

  private onParagraphComplete(paragraphIndex: number): void {
    this.tickCounter = 0;

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
      this.playSound(STINGER_KEYS.PUZZLE_APPEAR);

      this.time.delayedCall(800, () => {
        // Still emit the event so React can record which puzzle is active
        // (used by the puzzleComplete handler for item rewards + gameState).
        this.emitGameEvent({
          type: 'pause',
          data: {
            action: 'openPuzzle',
            puzzleId: puzzleTrigger.puzzleId,
            chapterIndex: this.chapterIndex,
            paragraphIndex,
          },
        });
        this.scene.pause();
        this.scene.launch(CTRLS_SCENE_KEYS.PUZZLE, {
          puzzleId: puzzleTrigger.puzzleId,
          chapterIndex: this.chapterIndex,
          paragraphIndex,
        });
      });
      return;
    }

    const choiceTrigger = getChoiceTriggerForParagraph(this.chapter, paragraphIndex);
    if (choiceTrigger) {
      this.waitingForChoice = true;
      this.promptText?.setText('Use ↑↓ and ENTER to choose');
      this.playSound(STINGER_KEYS.REVEAL);
      this.time.delayedCall(300, () => {
        this.showChoiceUI(choiceTrigger.choices, choiceTrigger.prompt);
      });
      return;
    }

    const terminalTrigger = getTerminalTriggerForParagraph(this.chapter, paragraphIndex);
    if (terminalTrigger) {
      this.waitingForTerminal = true;
      this.promptText?.setText('Incoming: terminal entry');
      this.playSound(STINGER_KEYS.DRAMATIC_STING);
      this.time.delayedCall(400, () => {
        this.startTerminalEntry(terminalTrigger);
      });
    }
  }

  private showInlineAscii(art: string[]): void {
    if (!this.bodyText) return;

    const margin = GAME_CONFIG.TEXT.MARGIN_X;
    // Place the panel below the active paragraph without moving the paragraph.
    // The cursor auto-repositions below the panel via renderCurrentText().
    const asciiY = this.bodyText.y + this.bodyText.height + INLINE_ASCII_GAP_Y;

    const asciiText = this.add.text(margin, asciiY, art.join('\n'), {
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
  }

  resumeAfterPuzzle(): void {
    this.waitingForPuzzle = false;
    this.promptText?.setText('Press SPACE or ENTER to advance');
    this.playSound(STINGER_KEYS.REVEAL);

    if (this.bodyText) {
      this.bodyText.setAlpha(0);
      this.tweens.add({
        targets: this.bodyText,
        alpha: 1,
        duration: 300,
        ease: 'Power2',
      });
    }
  }

  private onSceneResume(): void {
    if (this.waitingForPuzzle) {
      this.resumeAfterPuzzle();
    }
    if (this.waitingForInventory) {
      this.resumeAfterInventory();
    }
  }

  private onAllComplete(): void {
    // Terminal-entry chapters own their own transition — the ending lines
    // and hub fade fire after the player resolves the Ctrl+S payoff, not
    // when the final paragraph finishes typing.
    if (this.waitingForTerminal || this.terminalResolved) return;

    this.playSound(STINGER_KEYS.CHAPTER_COMPLETE);
    this.promptText?.setText('Chapter complete');

    this.emitGameEvent({
      type: 'pause',
      data: { action: 'chapterComplete', chapterIndex: this.chapterIndex },
    });

    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
      });
    });
  }

  private setupNarrativeInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => this.handleAdvance());

      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.on('down', () => {
        if (this.waitingForTerminal && this.terminalState?.phase === 'awaiting') {
          this.submitTerminalInput();
        } else if (this.waitingForChoice && this.activeChoices.length > 0) {
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

      // Number keys 1-9 for direct terminal-style choice selection
      // (R83.CTRLS.3). Mirrors the `> [1] ...` inline prompt — typing the
      // digit confirms that choice. Capped at 9 because the prompt only
      // displays single-digit indices.
      const numberKeyCodes = [
        Phaser.Input.Keyboard.KeyCodes.ONE,
        Phaser.Input.Keyboard.KeyCodes.TWO,
        Phaser.Input.Keyboard.KeyCodes.THREE,
        Phaser.Input.Keyboard.KeyCodes.FOUR,
        Phaser.Input.Keyboard.KeyCodes.FIVE,
        Phaser.Input.Keyboard.KeyCodes.SIX,
        Phaser.Input.Keyboard.KeyCodes.SEVEN,
        Phaser.Input.Keyboard.KeyCodes.EIGHT,
        Phaser.Input.Keyboard.KeyCodes.NINE,
      ];
      this.numberKeys = numberKeyCodes.map((code, index) => {
        const key = this.input.keyboard!.addKey(code);
        key.on('down', () => this.handleNumberKey(index));
        return key;
      });
    });

    this.input.on('pointerdown', () => this.handleAdvance());
  }

  private handleNumberKey(index: number): void {
    if (!this.waitingForChoice || index >= this.activeChoices.length) return;
    this.selectedChoiceIndex = index;
    this.confirmChoice(index);
  }

  private handleAdvance(): void {
    if (
      this.isPaused ||
      this.waitingForPuzzle ||
      this.waitingForChoice ||
      this.waitingForInventory ||
      this.waitingForTerminal
    ) return;

    this.playSound('menu');
    if (this.cursorBlink && this.cursorBlink.visible) {
      this.tweens.add({
        targets: this.cursorBlink,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 60,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }

    if (this.chapterAscii && this.engine.paragraphIndex === 0 && this.engine.state === 'IDLE') {
      this.tweens.add({
        targets: this.chapterAscii,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.chapterAscii?.destroy();
          this.chapterAscii = undefined;
          this.bodyText?.setY(this.computeContentStartY());
          this.syncPortraitY();
        },
      });
    }

    this.engine.advance();
  }

  private startTerminalEntry(trigger: TerminalTrigger): void {
    if (!this.bodyText) return;

    this.terminalTrigger = trigger;
    this.terminalState = new TerminalEntryState({
      expected: trigger.expected,
      maxAttempts: trigger.maxAttempts,
      initialTimeoutMs: trigger.initialTimeoutMs,
      retryTimeoutMs: trigger.retryTimeoutMs,
    });
    this.terminalState.begin();

    this.cursorBlink?.setVisible(false);
    this.promptText?.setText('> awaiting keystroke');
    this.playSound(STINGER_KEYS.TRANSITION);

    const margin = GAME_CONFIG.TEXT.MARGIN_X;
    const width = Number(this.game.config.width);
    const wrapWidth = width - margin * 2;
    const startY = this.bodyText.y + this.bodyText.height + TERMINAL_BLOCK_GAP_Y;

    this.terminalContainer = this.add.container(0, 0);
    let cursorY = startY;

    this.terminalPromptLabel = this.add.text(this.bodyText.x, cursorY, `> ${trigger.prompt}`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: TERMINAL_FONT_SIZE,
      color: MATRIX_COLORS.PRIMARY_HEX,
      wordWrap: { width: wrapWidth },
    });
    this.terminalContainer.add(this.terminalPromptLabel);
    cursorY += this.terminalPromptLabel.height + TERMINAL_LINE_GAP_Y;

    this.terminalInputLine = this.add.text(this.bodyText.x, cursorY, this.renderTerminalInputLine(), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: TERMINAL_FONT_SIZE,
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.terminalContainer.add(this.terminalInputLine);
    cursorY += this.terminalInputLine.height + TERMINAL_LINE_GAP_Y;

    this.terminalStatusLine = this.add.text(this.bodyText.x, cursorY, this.renderTerminalStatusLine(), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: TERMINAL_HINT_FONT_SIZE,
      color: MATRIX_COLORS.MEDIUM_GREEN_HEX,
    });
    this.terminalContainer.add(this.terminalStatusLine);
    cursorY += this.terminalStatusLine.height + TERMINAL_LINE_GAP_Y;

    this.terminalHintLabel = this.add.text(this.bodyText.x, cursorY, trigger.hint, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: TERMINAL_HINT_FONT_SIZE,
      color: MATRIX_COLORS.DIM_GREEN_HEX,
      wordWrap: { width: wrapWidth },
    });
    this.terminalHintLabel.setAlpha(0.85);
    this.terminalContainer.add(this.terminalHintLabel);

    this.terminalCaretTimer = 0;
    this.terminalCaretVisible = true;
    this.attachTerminalKeyListener();
  }

  private attachTerminalKeyListener(): void {
    if (typeof window === 'undefined') return;
    const handler = (event: KeyboardEvent) => this.onTerminalKeyDown(event);
    this.terminalKeyHandler = handler;
    window.addEventListener('keydown', handler, true);
  }

  private detachTerminalKeyListener(): void {
    if (typeof window === 'undefined' || !this.terminalKeyHandler) return;
    window.removeEventListener('keydown', this.terminalKeyHandler, true);
    this.terminalKeyHandler = undefined;
  }

  private onTerminalKeyDown(event: KeyboardEvent): void {
    if (!this.waitingForTerminal || !this.terminalState) return;
    if (this.terminalState.phase !== 'awaiting') return;

    // Ctrl+S / Cmd+S chord short-circuits to instant success and prevents
    // the browser's "Save Page As..." dialog hijacking the keystroke.
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      event.stopPropagation();
      this.resolveTerminalSuccess('chord');
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      this.terminalState.backspace();
      this.refreshTerminalInput();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.terminalState.clearInput();
      this.refreshTerminalInput();
      return;
    }

    if (event.key === 'Enter') {
      // ENTER is also handled via Phaser keyboard; guard by stopping propagation
      // only when the terminal is actually accepting input so we don't double-fire.
      event.preventDefault();
      this.submitTerminalInput();
      return;
    }

    if (event.key.length === 1) {
      const allowed = /^[A-Za-z0-9+\-_]$/;
      if (!allowed.test(event.key)) return;
      event.preventDefault();
      this.terminalState.appendChar(event.key);
      this.refreshTerminalInput();
      this.playSound(NARRATOR_TICK);
    }
  }

  private submitTerminalInput(): void {
    if (!this.terminalState) return;
    if (this.terminalState.phase !== 'awaiting') return;
    const buffered = this.terminalState.input;
    const result = this.terminalState.submit(buffered);
    if (result.outcome === 'success') {
      this.resolveTerminalSuccess('typed');
    } else if (result.outcome === 'failure') {
      this.resolveTerminalFailure();
    } else {
      this.onTerminalRetry();
    }
  }

  private tickTerminalEntry(delta: number): void {
    if (!this.terminalInputLine) return;

    this.terminalCaretTimer += delta;
    if (this.terminalCaretTimer >= 530) {
      this.terminalCaretTimer = 0;
      this.terminalCaretVisible = !this.terminalCaretVisible;
      this.terminalInputLine.setText(this.renderTerminalInputLine());
    }

    if (!this.waitingForTerminal || !this.terminalState) return;
    if (this.terminalState.phase !== 'awaiting') return;

    const tickResult = this.terminalState.tick(delta);
    this.terminalStatusLine?.setText(this.renderTerminalStatusLine());
    if (tickResult === 'timeout') {
      const res = this.terminalState.timeout();
      if (res.outcome === 'failure') {
        this.resolveTerminalFailure();
      } else {
        this.onTerminalRetry();
      }
    }
  }

  private onTerminalRetry(): void {
    this.playSound(STINGER_KEYS.PUZZLE_FAILED);
    this.cameras.main.shake(180, 0.005);
    this.refreshTerminalInput();
    this.terminalStatusLine?.setText(this.renderTerminalStatusLine());
  }

  private refreshTerminalInput(): void {
    this.terminalInputLine?.setText(this.renderTerminalInputLine());
  }

  private renderTerminalInputLine(): string {
    const buffered = this.terminalState?.input ?? '';
    const caret = this.terminalCaretVisible ? '_' : ' ';
    return `> ${buffered}${caret}`;
  }

  private renderTerminalStatusLine(): string {
    if (!this.terminalState || !this.terminalTrigger) return '';
    const remaining = Math.ceil(this.terminalState.timeRemainingMs / 1000);
    const attempts = this.terminalState.attemptsRemaining;
    const total = this.terminalTrigger.maxAttempts;
    return `[ ${remaining.toString().padStart(2, '0')}s ]  attempts: ${attempts}/${total}`;
  }

  private resolveTerminalSuccess(via: 'chord' | 'typed'): void {
    if (!this.terminalState || !this.terminalTrigger) return;
    if (via === 'chord') {
      this.terminalState.phase = 'resolved';
      this.terminalState.outcome = 'success';
    }
    this.playSound('score');
    this.playSound(STINGER_KEYS.CHAPTER_COMPLETE);
    this.cameras.main.flash(250, 0, 255, 0);
    this.renderTerminalEnding(this.terminalTrigger.successLines, 'success');
  }

  private resolveTerminalFailure(): void {
    if (!this.terminalTrigger) return;
    this.playSound('gameOver');
    this.cameras.main.shake(420, 0.012);
    this.renderTerminalEnding(this.terminalTrigger.failureLines, 'failure');
  }

  private renderTerminalEnding(lines: string[], outcome: 'success' | 'failure'): void {
    if (!this.terminalContainer) return;

    this.terminalResolved = true;
    this.detachTerminalKeyListener();
    this.terminalInputLine?.setText('> ');
    this.terminalStatusLine?.setText(outcome === 'success' ? '[ committed ]' : '[ flushed ]');
    this.terminalStatusLine?.setColor(outcome === 'success' ? MATRIX_COLORS.PRIMARY_HEX : MATRIX_COLORS.DARK_GREEN_HEX);
    this.terminalHintLabel?.setVisible(false);

    const margin = GAME_CONFIG.TEXT.MARGIN_X;
    const width = Number(this.game.config.width);
    const wrapWidth = width - margin * 2;
    let cursorY = (this.terminalStatusLine?.y ?? 0) + (this.terminalStatusLine?.height ?? 0) + TERMINAL_BLOCK_GAP_Y;

    lines.forEach((text, i) => {
      const line = this.add.text(this.bodyText!.x, cursorY, text, {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: TERMINAL_FONT_SIZE,
        color: outcome === 'success' ? MATRIX_COLORS.PRIMARY_HEX : MATRIX_COLORS.DIM_GREEN_HEX,
        wordWrap: { width: wrapWidth },
      });
      line.setAlpha(0);
      this.terminalEndingLines.push(line);
      this.terminalContainer!.add(line);

      this.tweens.add({
        targets: line,
        alpha: 1,
        duration: 350,
        delay: i * TERMINAL_ENDING_LINE_DELAY_MS,
        ease: 'Power2',
      });

      cursorY += line.height + TERMINAL_LINE_GAP_Y;
    });

    const holdDelay = lines.length * TERMINAL_ENDING_LINE_DELAY_MS + TERMINAL_ENDING_HOLD_MS;
    this.time.delayedCall(holdDelay, () => {
      this.emitGameEvent({
        type: 'pause',
        data: {
          action: 'chapterComplete',
          chapterIndex: this.chapterIndex,
          terminalOutcome: outcome,
        },
      });
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
      });
    });
  }

  private destroyTerminalUI(): void {
    this.detachTerminalKeyListener();
    this.terminalCaretTween?.stop();
    this.terminalCaretTween = undefined;
    this.terminalContainer?.destroy(true);
    this.terminalContainer = undefined;
    this.terminalPromptLabel = undefined;
    this.terminalInputLine = undefined;
    this.terminalStatusLine = undefined;
    this.terminalHintLabel = undefined;
    this.terminalEndingLines = [];
    this.terminalState = undefined;
    this.terminalTrigger = undefined;
  }

  private toggleInventory(): void {
    if (this.waitingForInventory) return;
    this.waitingForInventory = true;
    this.scene.pause();
    this.scene.launch(CTRLS_SCENE_KEYS.INVENTORY);
  }

  resumeAfterInventory(): void {
    this.waitingForInventory = false;
  }

  private showChoiceUI(choices: ChoiceOption[], prompt?: string): void {
    if (!this.bodyText) return;

    const margin = GAME_CONFIG.TEXT.MARGIN_X;
    const width = Number(this.game.config.width);
    const wrapWidth = width - margin * 2;

    this.activeChoices = choices;
    this.selectedChoiceIndex = 0;
    this.choiceLines = [];

    // Cursor lives below the choices once they render — hide it under the
    // active paragraph so it doesn't sit between body and the prompt list.
    this.cursorBlink?.setVisible(false);

    this.choiceContainer = this.add.container(0, 0);

    // Anchor the prompt block to the same X as the body text so it reads
    // as a continuation of the same terminal stream — not a centred modal.
    const startY = this.bodyText.y + this.bodyText.height + CHOICE_PROMPT_GAP_Y;
    let cursorY = startY;

    if (prompt) {
      // Render the optional decision prompt as a `> Choose:` style line.
      const promptLine = `> ${prompt}`;
      this.choicePromptLabel = this.add.text(this.bodyText.x, cursorY, promptLine, {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: CHOICE_LINE_FONT_SIZE,
        color: MATRIX_COLORS.DIM_GREEN_HEX,
        wordWrap: { width: wrapWidth },
      });
      this.choicePromptLabel.setAlpha(0);
      this.choiceContainer.add(this.choicePromptLabel);
      this.tweens.add({
        targets: this.choicePromptLabel,
        alpha: 1,
        duration: CHOICE_FADE_DURATION,
        ease: 'Power2',
      });
      cursorY += this.choicePromptLabel.height + CHOICE_LINE_GAP_Y;
    }

    const STAGGER_MS = 60;

    choices.forEach((choice, i) => {
      const line = this.createChoiceLine(choice, i, this.bodyText!.x, cursorY, wrapWidth);
      line.setAlpha(0);
      const targetY = line.y;
      line.y = targetY + 6;
      this.choiceLines.push(line);
      this.choiceContainer!.add(line);

      this.tweens.add({
        targets: line,
        alpha: 1,
        y: targetY,
        duration: CHOICE_FADE_DURATION,
        delay: i * STAGGER_MS,
        ease: 'Power2',
      });

      cursorY += line.height + CHOICE_LINE_GAP_Y;
    });

    // Trailing hint anchored below the last choice — small, always visible.
    this.choiceHintLabel = this.add.text(
      this.bodyText.x,
      cursorY + 4,
      '> _ press 1-' + choices.length + ', or use \u2191\u2193 + ENTER',
      {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: CHOICE_HINT_FONT_SIZE,
        color: MATRIX_COLORS.DARK_GREEN_HEX,
      },
    );
    this.choiceHintLabel.setAlpha(0);
    this.choiceContainer.add(this.choiceHintLabel);
    this.tweens.add({
      targets: this.choiceHintLabel,
      alpha: 0.85,
      duration: CHOICE_FADE_DURATION,
      delay: choices.length * STAGGER_MS,
      ease: 'Power2',
    });

    this.highlightChoice(0);
  }

  private createChoiceLine(
    choice: ChoiceOption,
    index: number,
    x: number,
    y: number,
    wrapWidth: number,
  ): Phaser.GameObjects.Text {
    // `> [1] Wake Up` — single line of text, terminal-flavoured.
    // Pointer events live on the Text bounds, no container/graphics needed.
    const text = this.add.text(x, y, this.formatChoiceLine(choice, index, false), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: CHOICE_LINE_FONT_SIZE,
      color: MATRIX_COLORS.DIM_GREEN_HEX,
      wordWrap: { width: wrapWidth },
    });
    text.setInteractive({ useHandCursor: true });
    text.on('pointerover', () => {
      this.selectedChoiceIndex = index;
      this.highlightChoice(index);
    });
    text.on('pointerdown', () => {
      // Scene-level pointerdown also fires, but handleAdvance() guards on
      // waitingForChoice so it no-ops while the prompt is up.
      this.confirmChoice(index);
    });
    return text;
  }

  private formatChoiceLine(choice: ChoiceOption, index: number, selected: boolean): string {
    const marker = selected ? '>' : ' ';
    return `${marker} [${index + 1}] ${choice.label}`;
  }

  private highlightChoice(index: number): void {
    this.choiceLines.forEach((line, i) => {
      const choice = this.activeChoices[i];
      if (!choice) return;
      const selected = i === index;
      line.setText(this.formatChoiceLine(choice, i, selected));
      line.setColor(selected ? MATRIX_COLORS.PRIMARY_HEX : MATRIX_COLORS.DIM_GREEN_HEX);
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

    const targetLine = this.choiceLines[index];
    if (targetLine) {
      this.spawnChoiceParticles(targetLine);
    }

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

  private spawnChoiceParticles(target: Phaser.GameObjects.Text): void {
    const bounds = target.getBounds();
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
    this.choiceLines = [];
    this.choicePromptLabel = undefined;
    this.choiceHintLabel = undefined;
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
      waitingForTerminal: this.waitingForTerminal,
      terminalPhase: this.terminalState?.phase ?? null,
      terminalOutcome: this.terminalState?.outcome ?? null,
      terminalInput: this.terminalState?.input ?? '',
      terminalAttemptsRemaining: this.terminalState?.attemptsRemaining ?? null,
      terminalTimeRemainingMs: this.terminalState?.timeRemainingMs ?? null,
      activeChoices: this.activeChoices.map((c) => c.label),
      selectedChoiceIndex: this.selectedChoiceIndex,
      currentSpeaker: this.currentSpeakerId ?? null,
      portraitVisible: (this.portraitContainer?.alpha ?? 0) > 0,
      typewriter: snapshot,
    };
  }

  shutdown(): void {
    this.events.off(Phaser.Scenes.Events.RESUME, this.onSceneResume, this);
    this.stopBackgroundMusic();
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
    for (const ascii of this.asciiPanels) {
      ascii.destroy();
    }
    this.asciiPanels = [];
    this.destroyChoiceUI();
    this.destroyTerminalUI();
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
    this.waitingForTerminal = false;
    this.terminalResolved = false;
    this.upKey?.destroy();
    this.downKey?.destroy();
    this.upKey = undefined;
    this.downKey = undefined;
    for (const key of this.numberKeys) {
      key.destroy();
    }
    this.numberKeys = [];
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    this.input.off('pointerdown');
    super.shutdown();
  }
}
