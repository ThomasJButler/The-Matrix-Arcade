export type TypewriterState = 'IDLE' | 'TYPING' | 'WAITING' | 'DONE';

export interface TypewriterCallbacks {
  onCharRevealed?: (char: string, charIndex: number) => void;
  onParagraphStart?: (paragraphIndex: number, text: string) => void;
  onParagraphComplete?: (paragraphIndex: number, text: string) => void;
  onAllComplete?: () => void;
  onStateChange?: (state: TypewriterState) => void;
}

export class TypewriterEngine {
  private paragraphs: string[] = [];
  private currentParagraphIndex = 0;
  private currentCharIndex = 0;
  private _state: TypewriterState = 'IDLE';
  private speedMin = 15;
  private speedMax = 15;
  // Burst-flush state (R83.CTRLS.16). When burstChance > 0 each char has a
  // small chance to kick off a 2-3 char window at 2-5 ms/char — mimics a real
  // typist flushing a memorised phrase in a single motion before slowing again.
  // When disabled (min === max, burstChance === 0) behaviour is fully
  // deterministic and all existing fixed-speed tests stay green.
  private burstChance = 0;
  private burstLengthRemaining = 0;
  private nextCharDelay = 15;
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
    this.speedMin = msPerChar;
    this.speedMax = msPerChar;
    this.burstChance = 0;
    this.burstLengthRemaining = 0;
    this.nextCharDelay = msPerChar;
  }

  /**
   * Enable variable-speed typing with optional buffer-flush bursts
   * (R83.CTRLS.16). Each char's delay is sampled from `[minMs, maxMs]`; with
   * probability `burstChance` on a given char, the next 2-3 chars reveal at
   * 2-5 ms each (the "flush"). Setting min === max and burstChance === 0 is
   * equivalent to the fixed-speed `setSpeed` path.
   */
  setVariableSpeed(minMs: number, maxMs: number, burstChance = 0): void {
    this.speedMin = Math.max(1, Math.min(minMs, maxMs));
    this.speedMax = Math.max(this.speedMin, maxMs);
    this.burstChance = Math.max(0, Math.min(1, burstChance));
    this.burstLengthRemaining = 0;
    this.nextCharDelay = this.rollNextDelay();
  }

  private rollNextDelay(): number {
    if (this.burstLengthRemaining > 0) {
      this.burstLengthRemaining--;
      return 2 + Math.random() * 3;
    }
    if (this.burstChance > 0 && Math.random() < this.burstChance) {
      this.burstLengthRemaining = 2 + Math.floor(Math.random() * 2);
    }
    if (this.speedMin === this.speedMax) return this.speedMin;
    return this.speedMin + Math.random() * (this.speedMax - this.speedMin);
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
    this.nextCharDelay = this.rollNextDelay();
    this.setState('TYPING');
    this.callbacks.onParagraphStart?.(0, this.paragraphs[0]);
  }

  startFromParagraph(index: number): void {
    if (index < 0 || index >= this.paragraphs.length) return;
    this.currentParagraphIndex = index;
    this.currentCharIndex = 0;
    this.elapsed = 0;
    this.completedParagraphs = [];
    this.nextCharDelay = this.rollNextDelay();
    this.setState('TYPING');
    this.callbacks.onParagraphStart?.(index, this.paragraphs[index]);
  }

  update(deltaMs: number): void {
    if (this._state !== 'TYPING') return;

    this.elapsed += deltaMs;
    while (this.elapsed >= this.nextCharDelay && this._state === 'TYPING') {
      this.elapsed -= this.nextCharDelay;
      this.revealNextChar();
      this.nextCharDelay = this.rollNextDelay();
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
    this.nextCharDelay = this.rollNextDelay();
    this.setState('TYPING');
    this.callbacks.onParagraphStart?.(this.currentParagraphIndex, this.paragraphs[this.currentParagraphIndex]);
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
