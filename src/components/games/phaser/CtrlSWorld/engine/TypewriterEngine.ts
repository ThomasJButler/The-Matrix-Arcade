export type TypewriterState = 'IDLE' | 'TYPING' | 'WAITING' | 'DONE';

// R83.CTRLS.24 — capitalisation-pause helpers. Only cares about ASCII A-Z /
// a-z; unicode-aware case detection would over-match on Matrix glyphs and
// combining marks rendered during idle glyph-flicker.
function isUpperLetter(char: string | undefined): boolean {
  if (!char || char.length !== 1) return false;
  const code = char.charCodeAt(0);
  return code >= 65 && code <= 90;
}

function isLowerLetter(char: string | undefined): boolean {
  if (!char || char.length !== 1) return false;
  const code = char.charCodeAt(0);
  return code >= 97 && code <= 122;
}

export interface TypewriterCallbacks {
  onCharRevealed?: (char: string, charIndex: number) => void;
  onParagraphStart?: (paragraphIndex: number, text: string) => void;
  onParagraphComplete?: (paragraphIndex: number, text: string) => void;
  onAllComplete?: () => void;
  onStateChange?: (state: TypewriterState) => void;
}

export interface PunctuationPauseRule {
  chars: string;
  minMs: number;
  maxMs: number;
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
  // R83.CTRLS.24 — staggered text entry modulators. All default to "off" so
  // the existing fixed-speed / variable-speed tests stay deterministic; the
  // scene enables each one via explicit setter. Modulation compounds on top
  // of the base speed sample inside rollNextDelay.
  private jitterMs = 0;
  private speakerMultiplier = 1;
  private paragraphStartDelayMin = 0;
  private paragraphStartDelayMax = 0;
  private capitalisationPauseMs = 0;
  private punctuationRules: PunctuationPauseRule[] = [];
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

  /**
   * Per-character jitter (R83.CTRLS.24). Each rolled delay picks up a
   * symmetric +/- jitterMs offset. Set to 0 to disable.
   */
  setJitter(jitterMs: number): void {
    this.jitterMs = Math.max(0, jitterMs);
  }

  /**
   * Per-speaker speed multiplier (R83.CTRLS.24). Scales every rolled delay
   * (base + jitter + punctuation + capitalisation + paragraph-start stagger).
   * Called by NarrativeScene in `onParagraphStart` once the speaker for the
   * new paragraph is known. If invoked mid-TYPING the upcoming char's delay
   * is re-rolled so the new speed takes effect immediately (otherwise the
   * first char of the new paragraph would slip through at the previous
   * speaker's cadence).
   */
  setSpeakerMultiplier(multiplier: number): void {
    this.speakerMultiplier = Math.max(0.1, multiplier);
    if (this._state === 'TYPING') {
      this.nextCharDelay = this.rollNextDelay();
    }
  }

  /**
   * Per-paragraph stagger (R83.CTRLS.24). The first char of every paragraph
   * gets an additional random [minMs..maxMs] delay so multi-paragraph beats
   * feel individually "dialled in" rather than autopilot.
   */
  setParagraphStartDelay(minMs: number, maxMs: number): void {
    this.paragraphStartDelayMin = Math.max(0, Math.min(minMs, maxMs));
    this.paragraphStartDelayMax = Math.max(this.paragraphStartDelayMin, maxMs);
  }

  /**
   * Capitalisation pause (R83.CTRLS.24). Extra delay before revealing a
   * capital letter that follows a lowercase letter — proper nouns mid-
   * sentence, new sentence mid-paragraph after "." etc. Set to 0 to disable.
   */
  setCapitalisationPause(ms: number): void {
    this.capitalisationPauseMs = Math.max(0, ms);
  }

  /**
   * Punctuation pause rules (R83.CTRLS.24). Each rule lengthens the delay
   * BEFORE the next char whenever the just-revealed char appears in the
   * rule's `chars` string. Rules are checked in order; the first match wins.
   * Pass `[]` to clear.
   */
  setPunctuationRules(rules: PunctuationPauseRule[]): void {
    this.punctuationRules = rules.map((rule) => ({
      chars: rule.chars,
      minMs: Math.max(0, Math.min(rule.minMs, rule.maxMs)),
      maxMs: Math.max(0, Math.max(rule.minMs, rule.maxMs)),
    }));
  }

  private rollNextDelay(): number {
    // Burst-flush fires deliberately — keep it first and short-circuit all
    // per-char modulators so a "typist flushing a memorised phrase" always
    // reads as a flush (2-5 ms), not a slightly-less-slow normal reveal.
    if (this.burstLengthRemaining > 0) {
      this.burstLengthRemaining--;
      return 2 + Math.random() * 3;
    }
    if (this.burstChance > 0 && Math.random() < this.burstChance) {
      this.burstLengthRemaining = 2 + Math.floor(Math.random() * 2);
    }

    // Base speed sample (fixed or variable range).
    let delay = this.speedMin === this.speedMax
      ? this.speedMin
      : this.speedMin + Math.random() * (this.speedMax - this.speedMin);

    // Per-char jitter — symmetric +/- around the base sample.
    if (this.jitterMs > 0) {
      delay += (Math.random() * 2 - 1) * this.jitterMs;
    }

    const paragraph = this.paragraphs[this.currentParagraphIndex];

    // Punctuation pause — the just-revealed char (at currentCharIndex - 1,
    // since reveal runs before the next roll) lengthens the delay before the
    // next char. Skipped when currentCharIndex === 0 (no prior char yet).
    if (paragraph && this.currentCharIndex > 0 && this.punctuationRules.length > 0) {
      const lastRevealed = paragraph[this.currentCharIndex - 1];
      for (const rule of this.punctuationRules) {
        if (rule.chars.includes(lastRevealed)) {
          delay += rule.minMs + Math.random() * (rule.maxMs - rule.minMs);
          break;
        }
      }
    }

    // Capitalisation pause — extra delay before a capital letter that
    // follows a lowercase letter. Checked against (prev, next) where next is
    // the char about to be revealed at currentCharIndex.
    if (
      paragraph &&
      this.capitalisationPauseMs > 0 &&
      this.currentCharIndex > 0 &&
      this.currentCharIndex < paragraph.length
    ) {
      const prev = paragraph[this.currentCharIndex - 1];
      const next = paragraph[this.currentCharIndex];
      if (isUpperLetter(next) && isLowerLetter(prev)) {
        delay += this.capitalisationPauseMs;
      }
    }

    // Paragraph-start stagger — only fires for the very first char of each
    // paragraph (currentCharIndex === 0 at roll time). Compounds on top of
    // the base + jitter + speaker multiplier.
    if (this.currentCharIndex === 0 && this.paragraphStartDelayMax > 0) {
      delay += this.paragraphStartDelayMin
        + Math.random() * (this.paragraphStartDelayMax - this.paragraphStartDelayMin);
    }

    // Per-speaker multiplier scales the whole compounded delay last so
    // antagonist (1.15×) / protagonist (0.9×) / system (0.7×) feels applied
    // to the final cadence, not just the base.
    delay *= this.speakerMultiplier;

    return Math.max(1, delay);
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
