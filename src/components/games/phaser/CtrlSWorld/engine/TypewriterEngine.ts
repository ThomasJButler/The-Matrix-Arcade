export type TypewriterState = 'IDLE' | 'TYPING' | 'WAITING' | 'DONE';

export interface TypewriterCallbacks {
  onCharRevealed?: (char: string, charIndex: number) => void;
  onParagraphComplete?: (paragraphIndex: number, text: string) => void;
  onAllComplete?: () => void;
  onStateChange?: (state: TypewriterState) => void;
}

export class TypewriterEngine {
  private paragraphs: string[] = [];
  private currentParagraphIndex = 0;
  private currentCharIndex = 0;
  private _state: TypewriterState = 'IDLE';
  private speed = 15;
  private elapsed = 0;
  private callbacks: TypewriterCallbacks = {};
  private completedParagraphs: string[] = [];

  get state(): TypewriterState {
    return this._state;
  }

  get paragraphIndex(): number {
    return this.currentParagraphIndex;
  }

  get charIndex(): number {
    return this.currentCharIndex;
  }

  get revealedText(): string {
    if (this._state === 'IDLE' || this.paragraphs.length === 0) return '';
    const paragraph = this.paragraphs[this.currentParagraphIndex];
    if (!paragraph) return '';
    return paragraph.slice(0, this.currentCharIndex);
  }

  get currentFullParagraph(): string {
    return this.paragraphs[this.currentParagraphIndex] ?? '';
  }

  get completed(): string[] {
    return this.completedParagraphs;
  }

  get totalParagraphs(): number {
    return this.paragraphs.length;
  }

  get isLastParagraph(): boolean {
    return this.currentParagraphIndex >= this.paragraphs.length - 1;
  }

  setCallbacks(callbacks: TypewriterCallbacks): void {
    this.callbacks = callbacks;
  }

  setSpeed(msPerChar: number): void {
    this.speed = msPerChar;
  }

  load(paragraphs: string[]): void {
    this.paragraphs = [...paragraphs];
    this.currentParagraphIndex = 0;
    this.currentCharIndex = 0;
    this.elapsed = 0;
    this.completedParagraphs = [];
    this.setState('IDLE');
  }

  start(): void {
    if (this.paragraphs.length === 0) return;
    this.currentParagraphIndex = 0;
    this.currentCharIndex = 0;
    this.elapsed = 0;
    this.completedParagraphs = [];
    this.setState('TYPING');
  }

  startFromParagraph(index: number): void {
    if (index < 0 || index >= this.paragraphs.length) return;
    this.currentParagraphIndex = index;
    this.currentCharIndex = 0;
    this.elapsed = 0;
    this.completedParagraphs = [];
    this.setState('TYPING');
  }

  update(deltaMs: number): void {
    if (this._state !== 'TYPING') return;

    this.elapsed += deltaMs;
    while (this.elapsed >= this.speed && this._state === 'TYPING') {
      this.elapsed -= this.speed;
      this.revealNextChar();
    }
  }

  advance(): void {
    switch (this._state) {
      case 'TYPING':
        this.skipToEndOfParagraph();
        break;
      case 'WAITING':
        this.nextParagraph();
        break;
    }
  }

  private revealNextChar(): void {
    const paragraph = this.paragraphs[this.currentParagraphIndex];
    if (!paragraph) return;

    if (this.currentCharIndex < paragraph.length) {
      const char = paragraph[this.currentCharIndex];
      this.currentCharIndex++;
      this.callbacks.onCharRevealed?.(char, this.currentCharIndex);
    }

    if (this.currentCharIndex >= paragraph.length) {
      this.finishParagraph();
    }
  }

  private skipToEndOfParagraph(): void {
    const paragraph = this.paragraphs[this.currentParagraphIndex];
    if (!paragraph) return;
    this.currentCharIndex = paragraph.length;
    this.finishParagraph();
  }

  private finishParagraph(): void {
    const paragraph = this.paragraphs[this.currentParagraphIndex];
    this.completedParagraphs.push(paragraph);
    this.callbacks.onParagraphComplete?.(this.currentParagraphIndex, paragraph);
    this.setState('WAITING');
  }

  private nextParagraph(): void {
    if (this.currentParagraphIndex >= this.paragraphs.length - 1) {
      this.setState('DONE');
      this.callbacks.onAllComplete?.();
      return;
    }
    this.currentParagraphIndex++;
    this.currentCharIndex = 0;
    this.elapsed = 0;
    this.setState('TYPING');
  }

  private setState(state: TypewriterState): void {
    this._state = state;
    this.callbacks.onStateChange?.(state);
  }

  getSnapshot(): TypewriterSnapshot {
    return {
      state: this._state,
      paragraphIndex: this.currentParagraphIndex,
      charIndex: this.currentCharIndex,
      totalParagraphs: this.paragraphs.length,
      completedCount: this.completedParagraphs.length,
    };
  }
}

export interface TypewriterSnapshot {
  state: TypewriterState;
  paragraphIndex: number;
  charIndex: number;
  totalParagraphs: number;
  completedCount: number;
}
