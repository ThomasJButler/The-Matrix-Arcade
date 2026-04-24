/**
 * RhythmHackerGameOverScene — R87.RH1 title-branch tests
 *
 * WHY THIS FILE EXISTS
 * The Rhythm Hacker variant of GameOverScene overrides the base class's
 * `getTitleText()` / `getTitleColor()` hooks so the natural-end-of-track win
 * path paints a green "TRACK COMPLETE" title instead of the death-flavoured
 * red "GAME OVER". Before RH1, Tom 2026-04-23 finished a track and saw
 * "GAME OVER" in red — which directly contradicted the win-state the player
 * had just earned. These tests lock the contract that routes on `this.reason`
 * so any future refactor that changes the sentinel string, swaps the
 * override direction, or drops the override entirely fails an obvious
 * assertion here.
 */

import { describe, it, expect } from 'vitest';
import { RhythmHackerGameOverScene, TRACK_COMPLETE_REASON } from './GameOverScene';
import { MATRIX_COLORS } from '../../../../../lib/phaser/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

function createOverScene(): any {
  const scene = new RhythmHackerGameOverScene() as any;
  const proto = RhythmHackerGameOverScene.prototype as any;
  Object.getOwnPropertyNames(proto).forEach((name) => {
    if (name !== 'constructor' && typeof proto[name] === 'function') {
      scene[name] = proto[name].bind(scene);
    }
  });
  return scene;
}

describe('RhythmHackerGameOverScene — R87.RH1 title branch', () => {
  describe('getTitleText()', () => {
    it('returns "TRACK COMPLETE" when reason === TRACK_COMPLETE_REASON', () => {
      const scene = createOverScene();
      scene.reason = TRACK_COMPLETE_REASON;
      expect(scene.getTitleText()).toBe('TRACK COMPLETE');
    });

    it('returns "GAME OVER" when reason is any loss string (Health depleted)', () => {
      const scene = createOverScene();
      scene.reason = 'Health depleted';
      expect(scene.getTitleText()).toBe('GAME OVER');
    });

    it('returns "GAME OVER" when reason is undefined (defensive)', () => {
      const scene = createOverScene();
      scene.reason = undefined;
      expect(scene.getTitleText()).toBe('GAME OVER');
    });

    it('is strict equality — any substring-match near miss must NOT win (pre-R87 drift guard)', () => {
      const scene = createOverScene();
      scene.reason = 'TRACK COMPLETE!!';
      // "!!" suffix breaks the sentinel match → should fall back to GAME OVER
      expect(scene.getTitleText()).toBe('GAME OVER');
    });
  });

  describe('getTitleColor()', () => {
    it('returns Matrix green (PRIMARY_HEX) on track complete', () => {
      const scene = createOverScene();
      scene.reason = TRACK_COMPLETE_REASON;
      expect(scene.getTitleColor()).toBe(MATRIX_COLORS.PRIMARY_HEX);
    });

    it('returns red (RED_HEX) on loss (Health depleted)', () => {
      const scene = createOverScene();
      scene.reason = 'Health depleted';
      expect(scene.getTitleColor()).toBe(MATRIX_COLORS.RED_HEX);
    });

    it('returns red (RED_HEX) when reason is undefined', () => {
      const scene = createOverScene();
      scene.reason = undefined;
      expect(scene.getTitleColor()).toBe(MATRIX_COLORS.RED_HEX);
    });
  });

  describe('TRACK_COMPLETE_REASON sentinel', () => {
    it('is the exact string "TRACK COMPLETE" — GameScene / GameOverScene must agree', () => {
      // Direct string lock — if a refactor renames the sentinel in one file
      // but not the other, title routing silently breaks. This test pairs
      // with the GameScene.test.ts assertion that gameOver is called with
      // 'TRACK COMPLETE' so drift here fails both files.
      expect(TRACK_COMPLETE_REASON).toBe('TRACK COMPLETE');
    });
  });
});
