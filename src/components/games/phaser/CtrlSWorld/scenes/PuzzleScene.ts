import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { CTRLS_SCENE_KEYS, STINGER_KEYS } from '../config';
import { getPuzzleById } from '../../../../../data/puzzles';
import type { PuzzleData } from '../types';

export interface PuzzleSceneData {
  puzzleId: string;
  chapterIndex: number;
  paragraphIndex: number;
}

const MAX_ATTEMPTS = 3;
const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;
const PANEL_WIDTH = 560;
const PANEL_HEIGHT = 440;
const INPUT_MAX = 40;
// R83.CTRLS.14 — crisp text resolution. See NarrativeScene for full rationale.
const TEXT_RESOLUTION = 2;

/**
 * Phaser-native puzzle modal. Launched in parallel on top of NarrativeScene.
 * Replaces the React `PuzzleModal` overlay so the game container is
 * pure-Phaser — see R83.CTRLS.1.
 *
 * Deliberately minimum-viable: question + options/input + hints + submit.
 * The rich lifeline flow (Sentient AI, character chat) from the React modal
 * is NOT ported — those features are scoped out by R83.CTRLS.3/.7/.8 and
 * would be thrown away anyway.
 */
export class CtrlSPuzzleScene extends BaseScene {
  private puzzle?: PuzzleData;
  private chapterIndex = 0;
  private paragraphIndex = 0;
  private userAnswer = '';
  private selectedOption = 0;
  private hintsUsed = 0;
  private currentHintIndex = -1;
  private attempts = 0;
  private timeRemaining = 0;
  private settled = false;

  private panel?: Phaser.GameObjects.Graphics;
  private questionText?: Phaser.GameObjects.Text;
  private contextText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private attemptsText?: Phaser.GameObjects.Text;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private inputBg?: Phaser.GameObjects.Graphics;
  private inputText?: Phaser.GameObjects.Text;
  private hintText?: Phaser.GameObjects.Text;
  private helpText?: Phaser.GameObjects.Text;
  private resultText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private keyHandler?: (event: KeyboardEvent) => void;

  constructor() {
    super(CTRLS_SCENE_KEYS.PUZZLE);
  }

  init(data: PuzzleSceneData): void {
    this.puzzle = getPuzzleById(data.puzzleId);
    this.chapterIndex = data.chapterIndex;
    this.paragraphIndex = data.paragraphIndex;
    this.userAnswer = '';
    this.selectedOption = 0;
    this.hintsUsed = 0;
    this.currentHintIndex = -1;
    this.attempts = 0;
    this.timeRemaining = this.puzzle?.timeLimit ?? 0;
    this.settled = false;
  }

  create(): void {
    if (!this.puzzle) {
      this.closeAndResume(false);
      return;
    }

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const panelX = (width - PANEL_WIDTH) / 2;
    const panelY = (height - PANEL_HEIGHT) / 2;

    // Dim backdrop + panel frame
    const backdrop = this.add.graphics();
    backdrop.fillStyle(MATRIX_COLORS.BACKGROUND, 0.85);
    backdrop.fillRect(0, 0, width, height);

    this.panel = this.add.graphics();
    this.panel.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
    this.panel.fillStyle(MATRIX_COLORS.BACKGROUND, 0.95);
    this.panel.fillRoundedRect(panelX, panelY, PANEL_WIDTH, PANEL_HEIGHT, 8);
    this.panel.strokeRoundedRect(panelX, panelY, PANEL_WIDTH, PANEL_HEIGHT, 8);

    this.playSound(STINGER_KEYS.PUZZLE_APPEAR);

    const contentX = panelX + 24;
    const contentTop = panelY + 20;

    // R83.CTRLS.14 — setResolution(2) on every text object in the puzzle
    // modal. Puzzle text is the second-highest density block after the hub
    // grid; small fonts (7-12px) render visibly crisper with the 2× canvas.
    const header = this.add.text(contentX, contentTop, `PUZZLE — ${this.puzzle.difficulty.toUpperCase()}`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    header.setResolution(TEXT_RESOLUTION);

    if (this.puzzle.timeLimit) {
      this.timerText = this.add.text(panelX + PANEL_WIDTH - 24, contentTop, '', {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '10px',
        color: MATRIX_COLORS.CYAN_HEX,
      });
      this.timerText.setOrigin(1, 0);
      this.timerText.setResolution(TEXT_RESOLUTION);
      this.updateTimerDisplay();
    }

    if (this.puzzle.context) {
      this.contextText = this.add.text(contentX, contentTop + 22, this.puzzle.context, {
        fontFamily: MATRIX_FONTS.MONO,
        fontSize: '11px',
        color: MATRIX_COLORS.DIM_GREEN_HEX,
        wordWrap: { width: PANEL_WIDTH - 48 },
        lineSpacing: 2,
      });
      this.contextText.setResolution(TEXT_RESOLUTION);
    }

    const questionY = this.contextText
      ? this.contextText.y + this.contextText.height + 16
      : contentTop + 22;

    this.questionText = this.add.text(contentX, questionY, this.puzzle.question, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.PRIMARY_HEX,
      wordWrap: { width: PANEL_WIDTH - 48 },
      lineSpacing: 4,
    });
    this.questionText.setResolution(TEXT_RESOLUTION);

    const afterQuestionY = this.questionText.y + this.questionText.height + 18;
    if (this.isMultipleChoice()) {
      this.renderOptions(contentX, afterQuestionY);
    } else {
      this.renderInput(contentX, afterQuestionY);
    }

    this.attemptsText = this.add.text(contentX, panelY + PANEL_HEIGHT - 70, '', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '9px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
    });
    this.attemptsText.setResolution(TEXT_RESOLUTION);
    this.updateAttemptsDisplay();

    this.hintText = this.add.text(contentX, panelY + PANEL_HEIGHT - 54, '', {
      fontFamily: MATRIX_FONTS.MONO,
      fontSize: '10px',
      color: MATRIX_COLORS.YELLOW_HEX,
      wordWrap: { width: PANEL_WIDTH - 48 },
    });
    this.hintText.setResolution(TEXT_RESOLUTION);

    this.helpText = this.add.text(
      panelX + PANEL_WIDTH / 2,
      panelY + PANEL_HEIGHT - 22,
      this.helpCopy(),
      {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '8px',
        color: MATRIX_COLORS.DIM_GREEN_HEX,
      },
    );
    this.helpText.setOrigin(0.5, 0.5);
    this.helpText.setResolution(TEXT_RESOLUTION);

    this.resultText = this.add.text(panelX + PANEL_WIDTH / 2, panelY + PANEL_HEIGHT / 2, '', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '18px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.resultText.setOrigin(0.5);
    this.resultText.setResolution(TEXT_RESOLUTION);
    this.resultText.setVisible(false);

    this.bindKeyboard();
    this.startTimer();
  }

  private helpCopy(): string {
    if (this.isMultipleChoice()) {
      return '1-4 select  ENTER submit  H hint  ESC give up';
    }
    return 'TYPE answer  ENTER submit  BKSP delete  H hint  ESC give up';
  }

  private isMultipleChoice(): boolean {
    return !!(this.puzzle?.optionA && this.puzzle?.optionB);
  }

  private renderOptions(x: number, y: number): void {
    const options = [
      this.puzzle?.optionA,
      this.puzzle?.optionB,
      this.puzzle?.optionC,
      this.puzzle?.optionD,
    ].filter((o): o is string => typeof o === 'string' && o.length > 0);

    const lineHeight = 26;
    options.forEach((label, i) => {
      const text = this.add.text(x, y + i * lineHeight, this.formatOption(i, label, false), {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '11px',
        color: MATRIX_COLORS.DIM_GREEN_HEX,
        wordWrap: { width: PANEL_WIDTH - 60 },
      });
      text.setResolution(TEXT_RESOLUTION);
      this.optionTexts.push(text);
    });

    this.highlightOption(0);
  }

  private formatOption(index: number, label: string, selected: boolean): string {
    const marker = selected ? '▶' : ' ';
    return `${marker} [${OPTION_KEYS[index]}] ${label}`;
  }

  private highlightOption(index: number): void {
    const count = this.optionTexts.length;
    if (count === 0) return;
    const clamped = Phaser.Math.Clamp(index, 0, count - 1);
    this.selectedOption = clamped;

    this.optionTexts.forEach((text, i) => {
      const label = this.getOptionLabel(i);
      text.setText(this.formatOption(i, label, i === clamped));
      text.setColor(i === clamped ? MATRIX_COLORS.PRIMARY_HEX : MATRIX_COLORS.DIM_GREEN_HEX);
    });
  }

  private getOptionLabel(i: number): string {
    switch (i) {
      case 0: return this.puzzle?.optionA ?? '';
      case 1: return this.puzzle?.optionB ?? '';
      case 2: return this.puzzle?.optionC ?? '';
      case 3: return this.puzzle?.optionD ?? '';
      default: return '';
    }
  }

  private renderInput(x: number, y: number): void {
    const boxWidth = PANEL_WIDTH - 60;
    const boxHeight = 32;

    this.inputBg = this.add.graphics();
    this.inputBg.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.8);
    this.inputBg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.4);
    this.inputBg.fillRoundedRect(x, y, boxWidth, boxHeight, 4);
    this.inputBg.strokeRoundedRect(x, y, boxWidth, boxHeight, 4);

    this.inputText = this.add.text(x + 10, y + boxHeight / 2, '_', {
      fontFamily: MATRIX_FONTS.MONO,
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.inputText.setOrigin(0, 0.5);
    this.inputText.setResolution(TEXT_RESOLUTION);
  }

  private updateInputDisplay(): void {
    if (!this.inputText) return;
    this.inputText.setText(this.userAnswer.length > 0 ? `${this.userAnswer}_` : '_');
  }

  private updateTimerDisplay(): void {
    if (!this.timerText || !this.puzzle?.timeLimit) return;
    const seconds = Math.max(0, Math.ceil(this.timeRemaining));
    this.timerText.setText(`⏱ ${seconds}s`);
    this.timerText.setColor(seconds <= 10 ? MATRIX_COLORS.RED_HEX : MATRIX_COLORS.CYAN_HEX);
  }

  private updateAttemptsDisplay(): void {
    if (!this.attemptsText) return;
    this.attemptsText.setText(`Attempts: ${this.attempts}/${MAX_ATTEMPTS}   Hints: ${this.hintsUsed}/${this.puzzle?.hints.length ?? 0}`);
  }

  private startTimer(): void {
    if (!this.puzzle?.timeLimit) return;

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.settled) return;
        this.timeRemaining -= 1;
        this.updateTimerDisplay();
        if (this.timeRemaining <= 0) {
          this.timerEvent?.remove(false);
          this.handleSubmit(true);
        }
      },
    });
  }

  private bindKeyboard(): void {
    this.keyHandler = (event: KeyboardEvent) => {
      if (this.settled) return;
      const key = event.key;

      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (key === 'Escape') {
        event.preventDefault();
        this.closeAndResume(false);
        return;
      }

      if (key === 'Enter') {
        event.preventDefault();
        this.handleSubmit(false);
        return;
      }

      if (key === 'h' || key === 'H') {
        event.preventDefault();
        this.showNextHint();
        return;
      }

      if (this.isMultipleChoice()) {
        if (key === 'ArrowUp') {
          event.preventDefault();
          this.highlightOption(this.selectedOption - 1);
          this.playSound('menu');
          return;
        }
        if (key === 'ArrowDown') {
          event.preventDefault();
          this.highlightOption(this.selectedOption + 1);
          this.playSound('menu');
          return;
        }
        if (['1', '2', '3', '4'].includes(key)) {
          event.preventDefault();
          const index = Number(key) - 1;
          if (index < this.optionTexts.length) {
            this.highlightOption(index);
            this.playSound('menu');
          }
          return;
        }
        return;
      }

      // Fill-in typing
      if (key === 'Backspace') {
        event.preventDefault();
        if (this.userAnswer.length > 0) {
          this.userAnswer = this.userAnswer.slice(0, -1);
          this.updateInputDisplay();
        }
        return;
      }

      if (key.length === 1 && this.userAnswer.length < INPUT_MAX) {
        event.preventDefault();
        this.userAnswer += key;
        this.updateInputDisplay();
      }
    };

    window.addEventListener('keydown', this.keyHandler);
  }

  private showNextHint(): void {
    if (!this.puzzle) return;
    if (this.currentHintIndex >= this.puzzle.hints.length - 1) return;

    this.currentHintIndex += 1;
    this.hintsUsed = Math.max(this.hintsUsed, this.currentHintIndex + 1);
    this.hintText?.setText(`💡 ${this.puzzle.hints[this.currentHintIndex]}`);
    this.updateAttemptsDisplay();
    this.playSound('menu');
  }

  private computeAnswer(): string {
    if (this.isMultipleChoice()) {
      return this.getOptionLabel(this.selectedOption);
    }
    return this.userAnswer;
  }

  private isCorrect(answer: string): boolean {
    if (!this.puzzle) return false;
    const accepted = Array.isArray(this.puzzle.answer) ? this.puzzle.answer : [this.puzzle.answer];
    const normalised = answer.trim().toLowerCase();
    return accepted.some((a) => a.trim().toLowerCase() === normalised);
  }

  private handleSubmit(timeUp: boolean): void {
    if (this.settled || !this.puzzle) return;

    const answer = this.computeAnswer();
    const correct = !timeUp && this.isCorrect(answer);
    this.attempts += 1;

    if (correct) {
      this.settled = true;
      this.playSound(STINGER_KEYS.PUZZLE_SOLVED);
      this.showResult('CORRECT', MATRIX_COLORS.PRIMARY_HEX);
      this.time.delayedCall(900, () => this.closeAndResume(true));
      return;
    }

    this.updateAttemptsDisplay();

    if (this.attempts >= MAX_ATTEMPTS || timeUp) {
      this.settled = true;
      this.playSound(STINGER_KEYS.PUZZLE_FAILED);
      this.showResult(timeUp ? 'TIME UP' : 'FAILED', MATRIX_COLORS.RED_HEX);
      this.time.delayedCall(1100, () => this.closeAndResume(false));
      return;
    }

    this.playSound(STINGER_KEYS.PUZZLE_FAILED);
    this.flashResult(`INCORRECT — ${MAX_ATTEMPTS - this.attempts} attempt(s) left`);
    if (!this.isMultipleChoice()) {
      this.userAnswer = '';
      this.updateInputDisplay();
    }
  }

  private flashResult(message: string): void {
    if (!this.resultText) return;
    this.resultText.setText(message);
    this.resultText.setColor(MATRIX_COLORS.RED_HEX);
    this.resultText.setVisible(true);
    this.tweens.add({
      targets: this.resultText,
      alpha: { from: 1, to: 0 },
      duration: 700,
      ease: 'Power2',
      onComplete: () => {
        this.resultText?.setVisible(false);
        this.resultText?.setAlpha(1);
      },
    });
  }

  private showResult(message: string, colour: string): void {
    if (!this.resultText) return;
    this.resultText.setText(message);
    this.resultText.setColor(colour);
    this.resultText.setVisible(true);
    this.resultText.setScale(0.6);
    this.tweens.add({
      targets: this.resultText,
      scale: 1,
      duration: 350,
      ease: 'Back.easeOut',
    });
  }

  private closeAndResume(success: boolean): void {
    if (!this.puzzle) {
      this.scene.stop();
      this.scene.resume(CTRLS_SCENE_KEYS.NARRATIVE);
      return;
    }

    this.emitGameEvent({
      type: 'pause',
      data: {
        action: 'puzzleComplete',
        puzzleId: this.puzzle.id,
        chapterIndex: this.chapterIndex,
        paragraphIndex: this.paragraphIndex,
        success,
        hintsUsed: this.hintsUsed,
        lifelinesUsed: 0,
      },
    });

    this.scene.stop();
    this.scene.resume(CTRLS_SCENE_KEYS.NARRATIVE);
  }

  protected handleExit(): void {
    this.closeAndResume(false);
  }

  shutdown(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = undefined;
    }
    this.timerEvent?.remove(false);
    this.timerEvent = undefined;
    this.optionTexts = [];
    super.shutdown();
  }
}
