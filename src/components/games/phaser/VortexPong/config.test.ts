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
