import { describe, it, expect } from 'vitest';
import { TerminalEntryState } from './TerminalEntryState';

function make(overrides: Partial<ConstructorParameters<typeof TerminalEntryState>[0]> = {}) {
  return new TerminalEntryState({
    expected: 'CTRL-S',
    maxAttempts: 3,
    initialTimeoutMs: 20_000,
    retryTimeoutMs: 10_000,
    ...overrides,
  });
}

describe('TerminalEntryState', () => {
  describe('initialisation', () => {
    it('starts idle with no outcome', () => {
      const state = make();
      expect(state.phase).toBe('idle');
      expect(state.outcome).toBeUndefined();
      expect(state.attemptsRemaining).toBe(3);
    });

    it('rejects invalid config', () => {
      expect(() => make({ maxAttempts: 0 })).toThrow();
      expect(() => make({ initialTimeoutMs: 0 })).toThrow();
      expect(() => make({ retryTimeoutMs: 0 })).toThrow();
    });
  });

  describe('begin()', () => {
    it('transitions to awaiting and sets timeoutMs to initial', () => {
      const state = make();
      state.begin();
      expect(state.phase).toBe('awaiting');
      expect(state.timeoutMs).toBe(20_000);
      expect(state.elapsedMs).toBe(0);
    });
  });

  describe('submit()', () => {
    it('resolves success on exact expected', () => {
      const state = make();
      state.begin();
      const result = state.submit('CTRL-S');
      expect(result.outcome).toBe('success');
      expect(state.phase).toBe('resolved');
      expect(state.outcome).toBe('success');
    });

    it('accepts common aliases (case/whitespace insensitive)', () => {
      for (const input of ['ctrl-s', ' CTRLS ', 'ctrl+s', 'c-s']) {
        const state = make();
        state.begin();
        expect(state.submit(input).outcome).toBe('success');
      }
    });

    it('returns retry on wrong input while attempts remain', () => {
      const state = make();
      state.begin();
      const result = state.submit('WRONG');
      expect(result.outcome).toBe('retry');
      expect(state.phase).toBe('awaiting');
      expect(state.attemptsRemaining).toBe(2);
    });

    it('shrinks timeout to retryTimeoutMs after a failed attempt', () => {
      const state = make();
      state.begin();
      state.submit('BAD');
      expect(state.timeoutMs).toBe(10_000);
      expect(state.elapsedMs).toBe(0);
      expect(state.input).toBe('');
    });

    it('resolves failure when all attempts exhausted', () => {
      const state = make({ maxAttempts: 2 });
      state.begin();
      expect(state.submit('NO').outcome).toBe('retry');
      const last = state.submit('STILL NO');
      expect(last.outcome).toBe('failure');
      expect(state.phase).toBe('resolved');
      expect(state.outcome).toBe('failure');
      expect(state.attemptsRemaining).toBe(0);
    });

    it('rejects submissions after resolution', () => {
      const state = make();
      state.begin();
      state.submit('CTRL-S');
      expect(state.submit('CTRL-S').outcome).toBe('retry');
    });
  });

  describe('tick() and timeout()', () => {
    it('returns null while within timeout window', () => {
      const state = make({ initialTimeoutMs: 1000 });
      state.begin();
      expect(state.tick(400)).toBeNull();
      expect(state.tick(500)).toBeNull();
      expect(state.timeRemainingMs).toBe(100);
    });

    it('returns timeout once elapsed exceeds timeoutMs', () => {
      const state = make({ initialTimeoutMs: 1000 });
      state.begin();
      state.tick(500);
      expect(state.tick(600)).toBe('timeout');
    });

    it('consumes an attempt on timeout() and shrinks the timer', () => {
      const state = make({ maxAttempts: 3, initialTimeoutMs: 1000, retryTimeoutMs: 500 });
      state.begin();
      state.tick(1200);
      const res = state.timeout();
      expect(res.outcome).toBe('retry');
      expect(state.timeoutMs).toBe(500);
      expect(state.attemptsRemaining).toBe(2);
    });

    it('resolves failure when timeout exhausts the final attempt', () => {
      const state = make({ maxAttempts: 1, initialTimeoutMs: 1000 });
      state.begin();
      state.tick(1001);
      const res = state.timeout();
      expect(res.outcome).toBe('failure');
      expect(state.outcome).toBe('failure');
    });
  });

  describe('input buffer', () => {
    it('appends chars uppercased with a rolling buffer', () => {
      const state = make({ inputBufferSize: 4 });
      state.begin();
      state.appendChar('c');
      state.appendChar('t');
      state.appendChar('r');
      state.appendChar('l');
      state.appendChar('s');
      expect(state.input).toBe('TRLS');
    });

    it('ignores input when not awaiting', () => {
      const state = make();
      state.appendChar('x');
      expect(state.input).toBe('');
    });

    it('backspace removes a trailing char', () => {
      const state = make();
      state.begin();
      state.appendChar('a');
      state.appendChar('b');
      state.backspace();
      expect(state.input).toBe('A');
    });

    it('matchesCurrentInput reflects buffered value', () => {
      const state = make();
      state.begin();
      'CTRL-S'.split('').forEach((c) => state.appendChar(c));
      expect(state.matchesCurrentInput()).toBe(true);
    });

    it('clearInput wipes the buffer without consuming an attempt', () => {
      const state = make();
      state.begin();
      state.appendChar('x');
      state.clearInput();
      expect(state.input).toBe('');
      expect(state.attemptsRemaining).toBe(3);
    });
  });
});
