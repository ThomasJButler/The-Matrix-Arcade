/**
 * R83.CTRLS.28 — ASCII art library smoke tests.
 *
 * Assertions:
 * 1. Every ChapterId has a non-empty sigil in CHAPTER_SIGILS.
 * 2. Every CharacterId has a non-empty portrait in CHARACTER_PORTRAITS.
 * 3. TRANSITION_BEATS.length >= 8.
 * 4. DECORATIVE_GLYPHS has >= 10 entries.
 * 5. Every piece (sigil, portrait, beat) passes assertMonospace.
 */

import { describe, it, expect } from 'vitest';
import {
  CHAPTER_SIGILS,
  CHARACTER_PORTRAITS,
  TRANSITION_BEATS,
  DECORATIVE_GLYPHS,
  assertMonospace,
  buildMonogramCard,
  type ChapterId,
  type CharacterId,
} from '../asciiArt';
import { CHARACTERS } from '../config';

const CHAPTER_IDS: ChapterId[] = [
  'prologue',
  'chapter1',
  'chapter2',
  'chapter3',
  'chapter4',
  'chapter5',
];

const CHARACTER_IDS: CharacterId[] = [
  'averag',
  'senora',
  'elon',
  'steve',
  'billiam',
  'samuel',
  'protector',
];

describe('CHAPTER_SIGILS', () => {
  it('covers every ChapterId', () => {
    for (const id of CHAPTER_IDS) {
      expect(CHAPTER_SIGILS).toHaveProperty(id);
      expect(CHAPTER_SIGILS[id].length).toBeGreaterThan(0);
    }
  });

  it('every sigil passes assertMonospace', () => {
    for (const id of CHAPTER_IDS) {
      expect(() => assertMonospace(CHAPTER_SIGILS[id])).not.toThrow();
    }
  });

  it('every sigil is visually distinct (different first line from others)', () => {
    const firstLines = CHAPTER_IDS.map((id) => CHAPTER_SIGILS[id].split('\n')[0]);
    const unique = new Set(firstLines);
    // Each sigil should have a unique opening line
    expect(unique.size).toBe(CHAPTER_IDS.length);
  });
});

describe('CHARACTER_PORTRAITS', () => {
  it('covers every CharacterId', () => {
    for (const id of CHARACTER_IDS) {
      expect(CHARACTER_PORTRAITS).toHaveProperty(id);
      expect(CHARACTER_PORTRAITS[id].length).toBeGreaterThan(0);
    }
  });

  it('every portrait passes assertMonospace', () => {
    for (const id of CHARACTER_IDS) {
      expect(() => assertMonospace(CHARACTER_PORTRAITS[id])).not.toThrow();
    }
  });

  it('protector portrait is non-trivial (not a single character)', () => {
    // Ensures the red-P placeholder is replaced with multi-line art
    const portrait = CHARACTER_PORTRAITS.protector;
    const lines = portrait.split('\n').filter((l) => l.length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(5);
  });
});

describe('TRANSITION_BEATS', () => {
  it('has at least 8 entries', () => {
    expect(TRANSITION_BEATS.length).toBeGreaterThanOrEqual(8);
  });

  it('every beat passes assertMonospace', () => {
    for (let i = 0; i < TRANSITION_BEATS.length; i++) {
      expect(() => assertMonospace(TRANSITION_BEATS[i])).not.toThrow();
    }
  });

  it('beats are varied (at least 5 distinct first lines)', () => {
    const firstLines = new Set(TRANSITION_BEATS.map((b) => b.split('\n')[0]));
    expect(firstLines.size).toBeGreaterThanOrEqual(5);
  });
});

describe('DECORATIVE_GLYPHS', () => {
  it('has at least 10 entries', () => {
    expect(Object.keys(DECORATIVE_GLYPHS).length).toBeGreaterThanOrEqual(10);
  });

  it('every glyph has a non-empty string value', () => {
    for (const [key, value] of Object.entries(DECORATIVE_GLYPHS)) {
      expect(value.length, `glyph "${key}" is empty`).toBeGreaterThan(0);
    }
  });
});

// R83.CTRLS.26 — parity guard. Every character registered in the
// CHARACTERS config must have an explicit portrait entry. This closes the
// loop on the red-P bug: adding a new character without a portrait fails
// CI before it can ship. The `buildMonogramCard` fallback in
// NarrativeScene.showPortrait() is a safety net for regressions, not a
// substitute for explicit art.
describe('CHARACTER_PORTRAITS vs config.CHARACTERS parity (R83.CTRLS.26)', () => {
  it('every CHARACTERS entry has a non-empty CHARACTER_PORTRAITS entry', () => {
    for (const id of Object.keys(CHARACTERS)) {
      expect(
        CHARACTER_PORTRAITS,
        `CHARACTERS["${id}"] has no portrait — would fall through to the monogram-card fallback. Add a dedicated entry to CHARACTER_PORTRAITS.`,
      ).toHaveProperty(id);
      expect(CHARACTER_PORTRAITS[id as CharacterId].length).toBeGreaterThan(0);
    }
  });

  it('CharacterId union and CHARACTERS keys match (no orphan portraits)', () => {
    const portraitIds = new Set(Object.keys(CHARACTER_PORTRAITS));
    const configIds = new Set(Object.keys(CHARACTERS));
    expect(portraitIds).toEqual(configIds);
  });
});

// R83.CTRLS.26 — monogram-card fallback. Unreachable in production today
// (parity test above asserts every character has a dedicated portrait) but
// must render as an intentional Matrix-terminal card rather than a raw
// letter if ever reached.
describe('buildMonogramCard (R83.CTRLS.26 defensive fallback)', () => {
  it('produces a monospace 10-column card for a single-char initial', () => {
    const card = buildMonogramCard('X', 'TEST');
    expect(() => assertMonospace(card)).not.toThrow();
    const firstLine = card.split('\n')[0];
    expect(firstLine).toHaveLength(10);
  });

  it('doubles a 1-char initial into a centred stencil glyph', () => {
    const card = buildMonogramCard('Z', 'ZED');
    expect(card).toContain('## ZZ ##');
  });

  it('keeps a 2-char initial as-is without re-doubling', () => {
    const card = buildMonogramCard('AB', 'ALPHA');
    expect(card).toContain('## AB ##');
  });

  it('falls back to "?" when initial is empty', () => {
    const card = buildMonogramCard('', '');
    expect(() => assertMonospace(card)).not.toThrow();
    expect(card).toContain('## ?? ##');
    expect(card).toContain('UNKNOW');
  });

  it('centres a short label in the 6-char name slot', () => {
    const card = buildMonogramCard('H', 'HI');
    const nameLine = card.split('\n')[9];
    expect(nameLine).toBe('|   HI   |');
  });

  it('truncates a long label to 6 chars', () => {
    const card = buildMonogramCard('X', 'THISISLONG');
    const nameLine = card.split('\n')[9];
    expect(nameLine).toBe('| THISIS |');
  });

  it('uppercases the initial and label', () => {
    const card = buildMonogramCard('a', 'neo');
    expect(card).toContain('## AA ##');
    expect(card).toContain('|  NEO   |');
  });

  it('matches the 11-line height of the fixed character portraits', () => {
    const card = buildMonogramCard('X', 'TEST');
    const fixed = CHARACTER_PORTRAITS.protector;
    expect(card.split('\n').length).toBe(fixed.split('\n').length);
  });
});

describe('assertMonospace helper', () => {
  it('passes on uniform-width piece', () => {
    expect(() => assertMonospace('abc\ndef\nghi')).not.toThrow();
  });

  it('throws on misaligned piece', () => {
    expect(() => assertMonospace('abc\nde\nghi')).toThrow(/assertMonospace/);
  });

  it('passes on empty string', () => {
    expect(() => assertMonospace('')).not.toThrow();
  });
});
