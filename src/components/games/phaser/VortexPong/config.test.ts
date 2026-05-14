/**
 * Vortex Pong — config helpers for R84.P3 difficulty tiers.
 *
 * These tests cover the tier storage round-trip + the cycle helper that
 * MenuScene drives on pointer-click. Kept separate from GameScene.test.ts
 * so AI-scene integration tests do not drag the whole scene mock in for
 * tiny pure-function assertions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTY_ORDER,
  DIFFICULTY_STORAGE_KEY,
  DIFFICULTY_TIERS,
  cycleDifficulty,
  readStoredDifficulty,
  writeStoredDifficulty,
} from './config';

describe('VortexPong difficulty helpers (R84.P3)', () => {
  beforeEach(() => {
    window.localStorage.removeItem(DIFFICULTY_STORAGE_KEY);
  });

  it('DIFFICULTY_ORDER lists easy → normal → hard', () => {
    expect(DIFFICULTY_ORDER).toEqual(['easy', 'normal', 'hard']);
  });

  it('DEFAULT_DIFFICULTY is normal so fresh players meet the tuned baseline', () => {
    expect(DEFAULT_DIFFICULTY).toBe('normal');
  });

  it('each tier defines all four AI scaling multipliers', () => {
    for (const tier of DIFFICULTY_ORDER) {
      const params = DIFFICULTY_TIERS[tier];
      expect(params).toHaveProperty('trackingMultiplier');
      expect(params).toHaveProperty('maxSpeedFactor');
      expect(params).toHaveProperty('errorMultiplier');
      expect(params).toHaveProperty('outgoingTrackingFactor');
      expect(params.label).toMatch(/^[A-Z]+$/);
    }
  });

  it('Hard has stricter tracking + smaller error than Normal', () => {
    const hard = DIFFICULTY_TIERS.hard;
    const normal = DIFFICULTY_TIERS.normal;
    expect(hard.trackingMultiplier).toBeGreaterThan(normal.trackingMultiplier);
    expect(hard.maxSpeedFactor).toBeGreaterThan(normal.maxSpeedFactor);
    expect(hard.errorMultiplier).toBeLessThan(normal.errorMultiplier);
  });

  it('Easy is slower + more error-prone than Normal', () => {
    const easy = DIFFICULTY_TIERS.easy;
    const normal = DIFFICULTY_TIERS.normal;
    expect(easy.trackingMultiplier).toBeLessThan(normal.trackingMultiplier);
    expect(easy.maxSpeedFactor).toBeLessThan(normal.maxSpeedFactor);
    expect(easy.errorMultiplier).toBeGreaterThan(normal.errorMultiplier);
  });

  // R84.P12 — Normal tier must preserve the R83.V1a baseline exactly.
  // The behavioural regression guard lives in GameScene.test.ts ("Normal tier
  // preserves R83.V1a baseline numbers"); this is the corresponding config
  // contract — a refactor that edits these values will be caught before the
  // scene-level test even loads, which is useful in Ralph's iteration loop
  // where tsc + unit tests run before the slower scene harness spins up.
  it('Normal tier pins all four multipliers to exactly 1.0 (R84.P12 baseline)', () => {
    const normal = DIFFICULTY_TIERS.normal;
    expect(normal.trackingMultiplier).toBe(1.0);
    // maxSpeedFactor is intentionally 0.95 not 1.0 — mirrors the R83.V1a
    // paddle cap tuning. Re-assert to freeze the exact baseline.
    expect(normal.maxSpeedFactor).toBe(0.95);
    expect(normal.errorMultiplier).toBe(1.0);
    // outgoingTrackingFactor 0.45 is the R83.V1a "lazy on outgoing" constant.
    expect(normal.outgoingTrackingFactor).toBe(0.45);
  });

  it('tier labels are EASY / NORMAL / HARD (MenuScene render contract)', () => {
    // MenuScene cycles this button label verbatim — it is not derived from
    // the tier key. If a label changes the MenuScene must be updated too.
    expect(DIFFICULTY_TIERS.easy.label).toBe('EASY');
    expect(DIFFICULTY_TIERS.normal.label).toBe('NORMAL');
    expect(DIFFICULTY_TIERS.hard.label).toBe('HARD');
  });

  it('outgoingTrackingFactor ordering easy < normal < hard (R84.P12)', () => {
    // Stricter-tier AI should keep tracking the ball even after it flies past
    // centre on the return trip; Easy gives up sooner. The ordering was
    // asserted implicitly via Stream B integration tests but never pinned
    // on the config itself — a future tuning pass is one typo away from
    // inverting this.
    const easy = DIFFICULTY_TIERS.easy.outgoingTrackingFactor;
    const normal = DIFFICULTY_TIERS.normal.outgoingTrackingFactor;
    const hard = DIFFICULTY_TIERS.hard.outgoingTrackingFactor;
    expect(easy).toBeLessThan(normal);
    expect(normal).toBeLessThan(hard);
  });

  it('DIFFICULTY_TIERS keys align exactly with DIFFICULTY_ORDER (R84.P12)', () => {
    // Prevents a rogue tier key from slipping into DIFFICULTY_TIERS (which
    // MenuScene would skip over when cycling) or from dropping out of
    // DIFFICULTY_ORDER (which would leave an unreachable tier entry).
    expect(Object.keys(DIFFICULTY_TIERS).sort()).toEqual([...DIFFICULTY_ORDER].sort());
  });

  describe('cycleDifficulty', () => {
    it('cycles easy → normal', () => {
      expect(cycleDifficulty('easy')).toBe('normal');
    });
    it('cycles normal → hard', () => {
      expect(cycleDifficulty('normal')).toBe('hard');
    });
    it('wraps hard → easy', () => {
      expect(cycleDifficulty('hard')).toBe('easy');
    });
  });

  describe('read/write storage round-trip', () => {
    it('returns default when localStorage is empty', () => {
      expect(readStoredDifficulty()).toBe(DEFAULT_DIFFICULTY);
    });

    it('round-trips a written tier', () => {
      writeStoredDifficulty('hard');
      expect(readStoredDifficulty()).toBe('hard');
    });

    it('returns default when storage holds garbage', () => {
      window.localStorage.setItem(DIFFICULTY_STORAGE_KEY, 'impossible');
      expect(readStoredDifficulty()).toBe(DEFAULT_DIFFICULTY);
    });

    it('survives a localStorage throw (private-browsing simulation)', () => {
      const original = window.localStorage.getItem.bind(window.localStorage);
      window.localStorage.getItem = () => { throw new Error('blocked'); };
      try {
        expect(readStoredDifficulty()).toBe(DEFAULT_DIFFICULTY);
      } finally {
        window.localStorage.getItem = original;
      }
    });
  });
});
