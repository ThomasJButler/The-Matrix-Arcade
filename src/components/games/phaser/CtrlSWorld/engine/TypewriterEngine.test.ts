import { describe, it, expect, vi } from 'vitest';
import { TypewriterEngine } from './TypewriterEngine';

describe('TypewriterEngine', () => {
  function createEngine(paragraphs: string[], speed = 10) {
    const engine = new TypewriterEngine();
    engine.setSpeed(speed);
    engine.load(paragraphs);
    return engine;
  }

  describe('initialisation', () => {
    it('starts in IDLE state', () => {
      const engine = createEngine(['Hello']);
      expect(engine.state).toBe('IDLE');
    });

    it('reports correct total paragraphs', () => {
      const engine = createEngine(['A', 'B', 'C']);
      expect(engine.totalParagraphs).toBe(3);
    });

    it('handles empty paragraphs gracefully', () => {
      const engine = createEngine([]);
      engine.start();
      expect(engine.state).toBe('IDLE');
    });
  });

  describe('typing', () => {
    it('transitions to TYPING on start', () => {
      const engine = createEngine(['Hello']);
      engine.start();
      expect(engine.state).toBe('TYPING');
    });

    it('reveals characters over time', () => {
      const engine = createEngine(['Hello'], 10);
      engine.start();
      engine.update(25);
      expect(engine.revealedText).toBe('He');
      expect(engine.charIndex).toBe(2);
    });

    it('reveals multiple characters when delta exceeds speed', () => {
      const engine = createEngine(['Hi'], 5);
      engine.start();
      engine.update(15);
      expect(engine.revealedText).toBe('Hi');
    });

    it('fires onCharRevealed callback', () => {
      const onChar = vi.fn();
      const engine = createEngine(['AB'], 10);
      engine.setCallbacks({ onCharRevealed: onChar });
      engine.start();
      engine.update(10);
      expect(onChar).toHaveBeenCalledWith('A', 1);
    });

    it('transitions to WAITING when paragraph finishes', () => {
      const engine = createEngine(['Hi'], 5);
      engine.start();
      engine.update(100);
      expect(engine.state).toBe('WAITING');
    });

    it('fires onParagraphComplete callback', () => {
      const onComplete = vi.fn();
      const engine = createEngine(['Hi'], 5);
      engine.setCallbacks({ onParagraphComplete: onComplete });
      engine.start();
      engine.update(100);
      expect(onComplete).toHaveBeenCalledWith(0, 'Hi');
    });
  });

  describe('advance (user input)', () => {
    it('skips to end of paragraph during TYPING', () => {
      const engine = createEngine(['Hello world'], 10);
      engine.start();
      engine.update(10);
      expect(engine.revealedText).toBe('H');

      engine.advance();
      expect(engine.state).toBe('WAITING');
      expect(engine.revealedText).toBe('Hello world');
    });

    it('moves to next paragraph from WAITING', () => {
      const engine = createEngine(['First', 'Second'], 5);
      engine.start();
      engine.update(500);
      expect(engine.state).toBe('WAITING');

      engine.advance();
      expect(engine.state).toBe('TYPING');
      expect(engine.paragraphIndex).toBe(1);
      expect(engine.revealedText).toBe('');
    });

    it('transitions to DONE after last paragraph', () => {
      const onAllComplete = vi.fn();
      const engine = createEngine(['Only'], 5);
      engine.setCallbacks({ onAllComplete });
      engine.start();
      engine.update(500);
      expect(engine.state).toBe('WAITING');

      engine.advance();
      expect(engine.state).toBe('DONE');
      expect(onAllComplete).toHaveBeenCalled();
    });

    it('does nothing in IDLE state', () => {
      const engine = createEngine(['Hello']);
      engine.advance();
      expect(engine.state).toBe('IDLE');
    });

    it('does nothing in DONE state', () => {
      const engine = createEngine(['Only'], 5);
      engine.start();
      engine.update(500);
      engine.advance();
      expect(engine.state).toBe('DONE');
      engine.advance();
      expect(engine.state).toBe('DONE');
    });
  });

  describe('completed paragraphs', () => {
    it('tracks completed paragraphs', () => {
      const engine = createEngine(['A', 'B'], 5);
      engine.start();
      engine.update(500);
      expect(engine.completed).toEqual(['A']);

      engine.advance();
      engine.update(500);
      expect(engine.completed).toEqual(['A', 'B']);
    });
  });

  describe('pause handling', () => {
    it('does not advance when update is not called', () => {
      const engine = createEngine(['Hello'], 10);
      engine.start();
      expect(engine.charIndex).toBe(0);
      expect(engine.state).toBe('TYPING');
    });

    it('resumes correctly after gap in updates', () => {
      const engine = createEngine(['Hello'], 10);
      engine.start();
      engine.update(20);
      expect(engine.revealedText).toBe('He');

      engine.update(30);
      expect(engine.revealedText).toBe('Hello');
    });
  });

  describe('speed', () => {
    it('respects speed changes', () => {
      const engine = createEngine(['ABCDEF'], 10);
      engine.start();
      engine.update(30);
      expect(engine.revealedText).toBe('ABC');

      engine.setSpeed(100);
      engine.update(50);
      expect(engine.revealedText).toBe('ABC');

      engine.update(50);
      expect(engine.revealedText).toBe('ABCD');
    });
  });

  describe('snapshot', () => {
    it('returns correct snapshot', () => {
      const engine = createEngine(['Hi', 'World'], 5);
      engine.start();
      engine.update(100);

      const snapshot = engine.getSnapshot();
      expect(snapshot.state).toBe('WAITING');
      expect(snapshot.paragraphIndex).toBe(0);
      expect(snapshot.charIndex).toBe(2);
      expect(snapshot.totalParagraphs).toBe(2);
      expect(snapshot.completedCount).toBe(1);
    });
  });

  describe('startFromParagraph', () => {
    it('starts from a specific paragraph index', () => {
      const engine = createEngine(['A', 'B', 'C'], 5);
      engine.startFromParagraph(1);
      expect(engine.state).toBe('TYPING');
      expect(engine.paragraphIndex).toBe(1);
    });

    it('rejects out-of-bounds index', () => {
      const engine = createEngine(['A', 'B'], 5);
      engine.startFromParagraph(5);
      expect(engine.state).toBe('IDLE');
    });
  });

  describe('isLastParagraph', () => {
    it('returns true for single-paragraph content', () => {
      const engine = createEngine(['Only']);
      engine.start();
      expect(engine.isLastParagraph).toBe(true);
    });

    it('returns false when more paragraphs remain', () => {
      const engine = createEngine(['A', 'B']);
      engine.start();
      expect(engine.isLastParagraph).toBe(false);
    });
  });

  describe('onParagraphStart callback', () => {
    it('fires when engine starts on paragraph 0', () => {
      const onParagraphStart = vi.fn();
      const engine = createEngine(['Hello', 'World'], 5);
      engine.setCallbacks({ onParagraphStart });
      engine.start();
      expect(onParagraphStart).toHaveBeenCalledWith(0, 'Hello');
    });

    it('fires when advancing to the next paragraph', () => {
      const onParagraphStart = vi.fn();
      const engine = createEngine(['Hi', 'There'], 5);
      engine.setCallbacks({ onParagraphStart });
      engine.start();
      onParagraphStart.mockClear();

      engine.update(500);
      engine.advance();

      expect(onParagraphStart).toHaveBeenCalledWith(1, 'There');
    });

    it('fires when using startFromParagraph', () => {
      const onParagraphStart = vi.fn();
      const engine = createEngine(['A', 'B', 'C'], 5);
      engine.setCallbacks({ onParagraphStart });
      engine.startFromParagraph(2);
      expect(onParagraphStart).toHaveBeenCalledWith(2, 'C');
    });

    it('does not fire when all paragraphs are complete', () => {
      const onParagraphStart = vi.fn();
      const engine = createEngine(['Only'], 5);
      engine.setCallbacks({ onParagraphStart });
      engine.start();
      onParagraphStart.mockClear();

      engine.update(500);
      engine.advance();

      expect(onParagraphStart).not.toHaveBeenCalled();
    });
  });

  describe('onStateChange callback', () => {
    it('fires on every state transition', () => {
      const onStateChange = vi.fn();
      const engine = createEngine(['Hi'], 5);
      engine.setCallbacks({ onStateChange });
      engine.start();
      expect(onStateChange).toHaveBeenCalledWith('TYPING');

      engine.update(500);
      expect(onStateChange).toHaveBeenCalledWith('WAITING');

      engine.advance();
      expect(onStateChange).toHaveBeenCalledWith('DONE');
    });
  });

  describe('R83.CTRLS.24 — jitter, punctuation, capitalisation, speaker multiplier, paragraph stagger', () => {
    // All of these tests run with Math.random() locked to a fixed value via
    // vi.spyOn so the random branches inside rollNextDelay become
    // deterministic. 0 picks the minimum of any [min..max] range; 0.5 picks
    // the midpoint; 0.999 picks ~max. That lets us assert cadence effects
    // without asserting exact ms counts.

    describe('setJitter', () => {
      it('shifts reveal cadence symmetrically around the base speed', () => {
        // Random = 0 → jitter term (Math.random() * 2 - 1) = -1, so delay =
        // base - jitterMs. With base 20, jitter 8 → delay = 12 ms/char.
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(20);
        engine.setJitter(8);
        engine.load(['AB']);
        engine.start();

        engine.update(11);
        expect(engine.revealedText).toBe('');
        engine.update(1);
        expect(engine.revealedText).toBe('A');
        engine.update(12);
        expect(engine.revealedText).toBe('AB');
        rand.mockRestore();
      });

      it('jitter=0 is equivalent to fixed speed', () => {
        const engine = new TypewriterEngine();
        engine.setSpeed(10);
        engine.setJitter(0);
        engine.load(['AB']);
        engine.start();
        engine.update(20);
        expect(engine.revealedText).toBe('AB');
      });
    });

    describe('setPunctuationRules', () => {
      it('extends delay after "." before the next char', () => {
        // Random = 0 picks the minimum of any range. Base 10 ms/char; after
        // "." add +120 ms. So 'A' at T=10, '.' at T=20, next char needs
        // T=20+10+120=150 for the second 'A' to appear.
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(10);
        engine.setPunctuationRules([{ chars: '.!?', minMs: 120, maxMs: 180 }]);
        engine.load(['A.A']);
        engine.start();

        engine.update(10);
        expect(engine.revealedText).toBe('A');
        engine.update(10);
        expect(engine.revealedText).toBe('A.');

        // +10 ms base + 120 ms punctuation = 130 ms until next reveal.
        engine.update(129);
        expect(engine.revealedText).toBe('A.');
        engine.update(1);
        expect(engine.revealedText).toBe('A.A');
        rand.mockRestore();
      });

      it('applies a smaller pause after "," than after "."', () => {
        // With Random = 0: comma adds +60 ms, full stop adds +120 ms. Run
        // both sides with the same base speed and confirm the comma branch
        // lands a char sooner.
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(10);
        engine.setPunctuationRules([
          { chars: '.!?', minMs: 120, maxMs: 180 },
          { chars: ',;', minMs: 60, maxMs: 90 },
        ]);
        engine.load([',X']);
        engine.start();

        engine.update(10); // ',' revealed at T=10
        expect(engine.revealedText).toBe(',');
        // Next char needs 10 + 60 = 70 ms total; at T = 10 + 69 still ','.
        engine.update(69);
        expect(engine.revealedText).toBe(',');
        engine.update(1);
        expect(engine.revealedText).toBe(',X');
        rand.mockRestore();
      });

      it('does not apply a pause when the paragraph has not yet revealed a char', () => {
        // currentCharIndex === 0 at the start of a paragraph → no prior-char
        // lookup → no punctuation pause on the first reveal.
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(10);
        engine.setPunctuationRules([{ chars: '.', minMs: 500, maxMs: 500 }]);
        engine.load(['.X']);
        engine.start();
        engine.update(10);
        expect(engine.revealedText).toBe('.');
        rand.mockRestore();
      });
    });

    describe('setCapitalisationPause', () => {
      it('extends delay before a capital letter that follows a lowercase letter', () => {
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(10);
        engine.setCapitalisationPause(40);
        engine.load(['aBc']);
        engine.start();

        engine.update(10);
        expect(engine.revealedText).toBe('a');
        // 'B' next: prev 'a' lowercase + next 'B' upper → +40 ms.
        engine.update(49);
        expect(engine.revealedText).toBe('a');
        engine.update(1);
        expect(engine.revealedText).toBe('aB');
        rand.mockRestore();
      });

      it('does not fire for consecutive capitals (BB has no prior lowercase)', () => {
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(10);
        engine.setCapitalisationPause(40);
        engine.load(['BB']);
        engine.start();
        engine.update(20);
        expect(engine.revealedText).toBe('BB');
        rand.mockRestore();
      });

      it('does not fire for the first char of a paragraph (even if capital)', () => {
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(10);
        engine.setCapitalisationPause(40);
        engine.load(['Bb']);
        engine.start();
        engine.update(10);
        expect(engine.revealedText).toBe('B');
        rand.mockRestore();
      });
    });

    describe('setSpeakerMultiplier', () => {
      it('scales the rolled delay (1.15x slows, 0.9x speeds up)', () => {
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(20);
        engine.setSpeakerMultiplier(1.5);
        engine.load(['AB']);
        engine.start();
        // 20 × 1.5 = 30 ms/char.
        engine.update(29);
        expect(engine.revealedText).toBe('');
        engine.update(1);
        expect(engine.revealedText).toBe('A');
        rand.mockRestore();
      });

      it('re-rolls the next char delay when updated mid-TYPING so the new speed takes effect immediately', () => {
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(20);
        engine.load(['AB']);
        engine.start();
        // Before any update, multiplier 2x → next char delay becomes 40.
        engine.setSpeakerMultiplier(2.0);
        engine.update(39);
        expect(engine.revealedText).toBe('');
        engine.update(1);
        expect(engine.revealedText).toBe('A');
        rand.mockRestore();
      });

      it('clamps below 0.1 so callers cannot accidentally stall the engine', () => {
        const engine = new TypewriterEngine();
        engine.setSpeed(10);
        engine.setSpeakerMultiplier(0);
        engine.load(['AB']);
        engine.start();
        // Clamp to 0.1 → 10 × 0.1 = 1 ms/char minimum.
        engine.update(5);
        expect(engine.revealedText).toBe('AB');
      });
    });

    describe('setParagraphStartDelay', () => {
      it('delays the first char of each paragraph by the configured range', () => {
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(10);
        engine.setParagraphStartDelay(80, 220);
        engine.load(['ABC']);
        engine.start();
        // Min stagger 80 ms at Random = 0; +10 base = 90 ms until 'A'.
        engine.update(89);
        expect(engine.revealedText).toBe('');
        engine.update(1);
        expect(engine.revealedText).toBe('A');
        // Subsequent chars (currentCharIndex > 0) get only the 10 ms base.
        engine.update(10);
        expect(engine.revealedText).toBe('AB');
        rand.mockRestore();
      });

      it('re-applies the stagger on each paragraph start (not just the first)', () => {
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(10);
        engine.setParagraphStartDelay(80, 80);
        engine.load(['A', 'B']);
        engine.start();
        engine.update(90);
        expect(engine.state).toBe('WAITING');
        engine.advance();
        // New paragraph → fresh stagger. 'B' needs another 90 ms.
        engine.update(89);
        expect(engine.revealedText).toBe('');
        engine.update(1);
        expect(engine.revealedText).toBe('B');
        rand.mockRestore();
      });
    });

    describe('modulators compound additively before the speaker multiplier', () => {
      it('applies jitter + punctuation + capitalisation + stagger, then scales by speaker', () => {
        // Random = 0 → min of every range, jitter = -jitterMs.
        // Walk through "A.Bc":
        //   char 0 'A': base 10 + jitter (-8) + stagger 80 = 82.  speaker 2 → 164 ms.
        //   char 1 '.': prev 'A' not punct; prev 'A' upper + next '.' not letter → no cap pause; no stagger.
        //              base 10 + jitter (-8) = 2 ms. speaker 2 → 4 ms.
        //   char 2 'B': prev '.' punct match → +120 base 10 + jitter (-8) = 122; prev '.' not letter → no cap.
        //              speaker 2 → 244 ms.
        //   char 3 'c': prev 'B' upper, next 'c' lower → no cap fire (only fires upper-after-lower). base 10 - 8 = 2 ms.
        //              speaker 2 → 4 ms.
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
        const engine = new TypewriterEngine();
        engine.setSpeed(10); // fixed, simplifies math
        engine.setJitter(8);
        engine.setCapitalisationPause(40);
        engine.setParagraphStartDelay(80, 80);
        engine.setPunctuationRules([{ chars: '.', minMs: 120, maxMs: 120 }]);
        engine.setSpeakerMultiplier(2);
        engine.load(['A.Bc']);
        engine.start();

        engine.update(164);
        expect(engine.revealedText).toBe('A');
        engine.update(4);
        expect(engine.revealedText).toBe('A.');
        engine.update(244);
        expect(engine.revealedText).toBe('A.B');
        engine.update(4);
        expect(engine.revealedText).toBe('A.Bc');
        rand.mockRestore();
      });
    });
  });

  describe('rapid advance (spacebar mash) — R83.CTRLS.13', () => {
    it('survives a sequence of advance() calls faster than the typewriter cadence', () => {
      // Spacebar-mash simulation: the user taps advance every few ms through
      // a 3-paragraph chapter. Each tap must be absorbed correctly regardless
      // of current state (TYPING → skip, WAITING → next). Paragraphs must
      // deliver in order and the engine must land cleanly on DONE.
      const onParagraphStart = vi.fn();
      const engine = createEngine(['First line', 'Second line', 'Third line'], 10);
      engine.setCallbacks({ onParagraphStart });
      engine.start();

      for (let i = 0; i < 20; i++) {
        engine.advance();
        engine.update(1);
      }

      expect(engine.state).toBe('DONE');
      expect(engine.completed).toEqual(['First line', 'Second line', 'Third line']);
      expect(onParagraphStart).toHaveBeenCalledTimes(3);
    });

    it('does not corrupt charIndex when advance is called repeatedly mid-TYPING', () => {
      const engine = createEngine(['Hello world'], 10);
      engine.start();
      engine.update(10);
      expect(engine.charIndex).toBe(1);

      engine.advance();
      engine.advance();
      engine.advance();

      // After the first advance skips to end, subsequent advances in WAITING
      // or DONE state must not roll charIndex backward or past bounds.
      expect(engine.revealedText).toBe('Hello world');
      expect(engine.state).toBe('DONE');
    });
  });
});
