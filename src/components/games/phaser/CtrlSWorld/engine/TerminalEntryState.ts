export type TerminalPhase = 'idle' | 'awaiting' | 'resolved';
export type TerminalOutcome = 'success' | 'failure';
export type SubmitResult = { outcome: 'success' } | { outcome: 'retry' } | { outcome: 'failure' };

export interface TerminalEntryConfig {
  expected: string;
  maxAttempts: number;
  initialTimeoutMs: number;
  retryTimeoutMs: number;
  inputBufferSize?: number;
}

const INPUT_ALIASES = ['CTRL-S', 'CTRLS', 'CTRL+S', 'C-S'];

function normalise(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, '');
}

export class TerminalEntryState {
  phase: TerminalPhase = 'idle';
  outcome?: TerminalOutcome;
  input = '';
  attemptsUsed = 0;
  timeoutMs: number;
  elapsedMs = 0;

  private readonly expected: string;
  private readonly maxAttempts: number;
  private readonly initialTimeoutMs: number;
  private readonly retryTimeoutMs: number;
  private readonly inputBufferSize: number;

  constructor(config: TerminalEntryConfig) {
    if (config.maxAttempts < 1) {
      throw new Error('TerminalEntryState: maxAttempts must be >= 1');
    }
    if (config.initialTimeoutMs <= 0 || config.retryTimeoutMs <= 0) {
      throw new Error('TerminalEntryState: timeouts must be > 0');
    }
    this.expected = normalise(config.expected);
    this.maxAttempts = config.maxAttempts;
    this.initialTimeoutMs = config.initialTimeoutMs;
    this.retryTimeoutMs = config.retryTimeoutMs;
    this.inputBufferSize = config.inputBufferSize ?? 16;
    this.timeoutMs = config.initialTimeoutMs;
  }

  get attemptsRemaining(): number {
    return Math.max(0, this.maxAttempts - this.attemptsUsed);
  }

  get timeRemainingMs(): number {
    return Math.max(0, this.timeoutMs - this.elapsedMs);
  }

  begin(): void {
    this.phase = 'awaiting';
    this.outcome = undefined;
    this.input = '';
    this.elapsedMs = 0;
    this.attemptsUsed = 0;
    this.timeoutMs = this.initialTimeoutMs;
  }

  tick(deltaMs: number): 'timeout' | null {
    if (this.phase !== 'awaiting') return null;
    this.elapsedMs += deltaMs;
    if (this.elapsedMs >= this.timeoutMs) {
      return 'timeout';
    }
    return null;
  }

  submit(value: string): SubmitResult {
    if (this.phase !== 'awaiting') {
      return { outcome: 'retry' };
    }
    if (this.matches(value)) {
      this.phase = 'resolved';
      this.outcome = 'success';
      return { outcome: 'success' };
    }
    return this.failAttempt();
  }

  timeout(): SubmitResult {
    if (this.phase !== 'awaiting') {
      return { outcome: 'retry' };
    }
    return this.failAttempt();
  }

  appendChar(char: string): void {
    if (this.phase !== 'awaiting') return;
    if (!char) return;
    this.input = (this.input + char.toUpperCase()).slice(-this.inputBufferSize);
  }

  backspace(): void {
    if (this.phase !== 'awaiting') return;
    this.input = this.input.slice(0, -1);
  }

  clearInput(): void {
    if (this.phase !== 'awaiting') return;
    this.input = '';
  }

  matchesCurrentInput(): boolean {
    return this.matches(this.input);
  }

  private matches(raw: string): boolean {
    const value = normalise(raw);
    if (value === this.expected) return true;
    return INPUT_ALIASES.includes(value);
  }

  private failAttempt(): SubmitResult {
    this.attemptsUsed += 1;
    this.input = '';
    this.elapsedMs = 0;
    if (this.attemptsUsed >= this.maxAttempts) {
      this.phase = 'resolved';
      this.outcome = 'failure';
      return { outcome: 'failure' };
    }
    this.timeoutMs = this.retryTimeoutMs;
    return { outcome: 'retry' };
  }
}
