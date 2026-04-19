import { describe, it, expect } from 'vitest';
import {
  PUZZLES,
  getPuzzleById,
  getPuzzlesByChapter,
  getBonusPuzzles,
  getTotalPuzzles,
  getTotalPoints,
} from './puzzles';
import { CHAPTERS } from './ctrlsChapters';

/**
 * R83.CTRLS.20 — puzzle verification + repair.
 *
 * Locks the shape invariants that the PuzzleScene assumes so a future
 * data edit (rename, typo in an option, swapped answer) fails the gate
 * rather than stranding the player on a puzzle they can't solve.
 *
 * Three invariants matter:
 *   1. Every puzzle triggered by a chapter exists in PUZZLES — otherwise
 *      NarrativeScene launches the puzzle overlay with an undefined
 *      puzzleId and the player stares at a blank modal.
 *   2. Every multiple-choice puzzle's `answer[]` contains the exact
 *      (case-insensitive, trimmed) text of one of its options — that's
 *      what PuzzleScene.computeAnswer / isCorrect compare against.
 *   3. Math/riddle puzzles whose answer is computed from the question
 *      (Fibonacci, PEMDAS, '2' + 2) stay consistent with the stated maths.
 */

const normalise = (s: string) => s.trim().toLowerCase();

describe('puzzles.ts', () => {
  describe('shape invariants', () => {
    it('every puzzle has a non-empty id matching its key', () => {
      for (const [key, puzzle] of Object.entries(PUZZLES)) {
        expect(puzzle.id).toBe(key);
      }
    });

    it('every puzzle has a non-empty question, hints and at least one accepted answer', () => {
      for (const puzzle of Object.values(PUZZLES)) {
        expect(puzzle.question.length, `${puzzle.id} question`).toBeGreaterThan(0);
        expect(puzzle.hints.length, `${puzzle.id} hints`).toBeGreaterThan(0);
        expect(puzzle.answer.length, `${puzzle.id} answer[]`).toBeGreaterThan(0);
        for (const accepted of puzzle.answer) {
          expect(accepted.length, `${puzzle.id} accepted answer empty`).toBeGreaterThan(0);
        }
      }
    });

    it('every puzzle declares a valid difficulty', () => {
      const allowed = new Set(['easy', 'medium', 'hard']);
      for (const puzzle of Object.values(PUZZLES)) {
        expect(allowed.has(puzzle.difficulty), `${puzzle.id} difficulty ${puzzle.difficulty}`).toBe(true);
      }
    });

    it('timeLimit, when declared, is a positive integer second count', () => {
      for (const puzzle of Object.values(PUZZLES)) {
        if (puzzle.timeLimit === undefined) continue;
        expect(puzzle.timeLimit, `${puzzle.id} timeLimit`).toBeGreaterThan(0);
        expect(Number.isInteger(puzzle.timeLimit), `${puzzle.id} timeLimit integer`).toBe(true);
      }
    });

    it('accepted answers within one puzzle have no duplicates after normalisation', () => {
      for (const puzzle of Object.values(PUZZLES)) {
        const seen = new Set<string>();
        for (const accepted of puzzle.answer) {
          const key = normalise(accepted);
          expect(seen.has(key), `${puzzle.id} duplicate accepted answer "${accepted}"`).toBe(false);
          seen.add(key);
        }
      }
    });
  });

  describe('multiple-choice answer ↔ option alignment', () => {
    // PuzzleScene.isMultipleChoice() returns true when optionA AND optionB
    // are both present; computeAnswer() returns the selected option label
    // verbatim. isCorrect() trim+lowercases both sides and matches. So the
    // accepted answers must include the full option text — anything shorter
    // (e.g. just "C") would silently fail for every player.
    it('every multiple-choice puzzle has at least one accepted answer matching an option', () => {
      for (const puzzle of Object.values(PUZZLES)) {
        if (!puzzle.optionA || !puzzle.optionB) continue;

        const options = [puzzle.optionA, puzzle.optionB, puzzle.optionC, puzzle.optionD]
          .filter((o): o is string => typeof o === 'string' && o.length > 0)
          .map(normalise);

        const accepted = puzzle.answer.map(normalise);
        const intersects = accepted.some((a) => options.includes(a));
        expect(intersects, `${puzzle.id} accepted[${puzzle.answer.join(', ')}] ↔ options[${options.join(', ')}]`).toBe(true);
      }
    });
  });

  describe('chapter wiring', () => {
    it('every chapter-triggered puzzleId resolves to a puzzle in PUZZLES', () => {
      for (const chapter of CHAPTERS) {
        for (const trigger of chapter.puzzleTriggers ?? []) {
          const puzzle = getPuzzleById(trigger.puzzleId);
          expect(puzzle, `chapter ${chapter.id} paragraph ${trigger.afterParagraphIndex} → ${trigger.puzzleId}`).toBeDefined();
        }
      }
    });
  });

  describe('math consistency (R83.CTRLS.20 regression locks)', () => {
    // Fibonacci fix: the answer 26 requires 0-indexed Fibonacci
    // (F0=0, F1=1, F2=1, F3=2, F4=3, F5=5, F6=8, F7=13, F8=21, F9=34).
    // Hints must mention 8 and 34 — the legacy 13/55 pair gave 42 not 26.
    it('ch3_fibonacci answer matches the 0-indexed interpretation the hints now declare', () => {
      const puzzle = PUZZLES.ch3_fibonacci;
      expect(puzzle.answer).toContain('26');

      const fibonacci = [0, 1];
      for (let i = 2; i <= 10; i++) {
        fibonacci.push(fibonacci[i - 1] + fibonacci[i - 2]);
      }
      // 0-indexed 10th term = F(9) = 34, 7th term = F(6) = 8.
      expect(fibonacci[9] - fibonacci[6]).toBe(26);

      const hintsJoined = puzzle.hints.join(' ');
      expect(hintsJoined, 'hints should reference the 0-indexed pair 8 and 34').toMatch(/\b8\b/);
      expect(hintsJoined, 'hints should reference the 0-indexed pair 8 and 34').toMatch(/\b34\b/);
      // And the misleading 1-indexed pair from the pre-fix hints must not sneak back in.
      expect(hintsJoined).not.toMatch(/\b13\b/);
      expect(hintsJoined).not.toMatch(/\b55\b/);
    });

    // Ethics module fix: the expression 7 + 3 * (10 / (12 / (3 + 1) - 1))
    // evaluates to 22 by PEMDAS. The legacy answer was 20 (straight Python
    // port bug), which rejected the mathematically correct input.
    it('ch2_ethics_module_activation answer matches the PEMDAS evaluation of its question', () => {
      const puzzle = PUZZLES.ch2_ethics_module_activation;
      const pemdas = 7 + 3 * (10 / (12 / (3 + 1) - 1));
      expect(pemdas).toBe(22);
      expect(puzzle.answer).toContain('22');
      expect(puzzle.answer, 'legacy 20 answer must not linger').not.toContain('20');
      // Final hint used to end with "7+15 = 22... wait, recalculate!" which
      // gaslit the player. The new final hint terminates with "?".
      expect(puzzle.hints[puzzle.hints.length - 1]).toMatch(/\?$/);
    });

    it('ch2_console_log answer matches JS type-coercion of the question', () => {
      // Lock the canonical JS result so a future refactor of the
      // question string can't silently drift the accepted answer.
      const result = String('2') + String(2);
      expect(result).toBe('22');
      expect(PUZZLES.ch2_console_log.answer.map(normalise)).toContain('22');
    });

    it('ch3_array_length answer matches JS sparse-array semantics', () => {
      const arr: unknown[] = [1, 2, 3];
      arr[10] = 99;
      expect(arr.length).toBe(11);
      expect(PUZZLES.ch3_array_length.answer).toContain('11');
    });

    it('bonus_binary answer matches the literal binary conversion', () => {
      expect(parseInt('1010', 2)).toBe(10);
      expect(PUZZLES.bonus_binary.answer).toContain('10');
    });
  });

  describe('helper functions', () => {
    it('getPuzzleById resolves a known id and returns undefined for unknown', () => {
      expect(getPuzzleById('ch1_team_quiz')).toBe(PUZZLES.ch1_team_quiz);
      expect(getPuzzleById('does-not-exist')).toBeUndefined();
    });

    it('getPuzzlesByChapter returns every puzzle for that chapter prefix', () => {
      const ch2 = getPuzzlesByChapter(2);
      expect(ch2.length).toBeGreaterThan(0);
      for (const puzzle of ch2) {
        expect(puzzle.id.startsWith('ch2_')).toBe(true);
      }
    });

    it('getBonusPuzzles returns only bonus_ prefixed puzzles', () => {
      const bonus = getBonusPuzzles();
      expect(bonus.length).toBeGreaterThan(0);
      for (const puzzle of bonus) {
        expect(puzzle.id.startsWith('bonus_')).toBe(true);
      }
    });

    it('getTotalPuzzles matches the PUZZLES key count', () => {
      expect(getTotalPuzzles()).toBe(Object.keys(PUZZLES).length);
    });

    it('getTotalPoints is the sum of every puzzle.points', () => {
      const expected = Object.values(PUZZLES).reduce((sum, p) => sum + p.points, 0);
      expect(getTotalPoints()).toBe(expected);
    });
  });
});
