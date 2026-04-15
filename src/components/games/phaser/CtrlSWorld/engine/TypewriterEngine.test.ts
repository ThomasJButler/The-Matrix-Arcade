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
});
