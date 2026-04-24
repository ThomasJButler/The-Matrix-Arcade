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

// -------------------------------------------------------------------------
// R87.RH1+ safety-net — base GameOverScene hook visibility + default return
// contract (pre-Tom-tick tripwire layer)
//
// WHY THIS SAFETY-NET EXISTS
// RH1 added `getTitleText()` / `getTitleColor()` hooks to base
// GameOverScene so any of the 12 Phaser games can swap the red "GAME OVER"
// default for a win-themed variant. The Rhythm Hacker override relies on
// these hooks being `protected` (not `private`) — TypeScript strict mode
// would flag a private override at compile time in the current override,
// but a future compiler-relaxation, a change to `any`-casted access, or a
// refactor that accidentally privatises the base hook would silently
// re-default every subclass's title back to red. This block locks the
// visibility modifier at the source level and locks the default return
// values so the 11 OTHER subclasses (CodeBreaker, Invaders, Frogger,
// Metris, Snake, Pong, NeoJump, AgentChase, CloudJumper, MatrixCloud,
// CtrlSWorld) keep their red "GAME OVER" title unaffected by Rhythm
// Hacker's win branch.
// -------------------------------------------------------------------------
describe('R87.RH1+ safety-net — base GameOverScene hook visibility + default returns (pre-Tom-tick)', () => {
  async function readBaseSource(): Promise<string> {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    return readFileSync(
      resolve(process.cwd(), 'src/lib/phaser/scenes/GameOverScene.ts'),
      'utf8',
    );
  }

  async function readRhythmOverrideSource(): Promise<string> {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    return readFileSync(
      resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/GameOverScene.ts'),
      'utf8',
    );
  }

  describe('Base class hook visibility', () => {
    it('base `getTitleText` is declared `protected` (not `private`)', async () => {
      // Subclass override requires `protected` visibility. A private-ification
      // would break the Rhythm Hacker override at compile time (and any
      // future win-variant in the 11 other games).
      const src = await readBaseSource();
      expect(src).toMatch(/protected\s+getTitleText\s*\(\)\s*:\s*string\s*{/);
      expect(src).not.toMatch(/private\s+getTitleText\s*\(\)/);
    });

    it('base `getTitleColor` is declared `protected` (not `private`)', async () => {
      // Paired lock with getTitleText — both hooks must stay overridable.
      const src = await readBaseSource();
      expect(src).toMatch(/protected\s+getTitleColor\s*\(\)\s*:\s*string\s*{/);
      expect(src).not.toMatch(/private\s+getTitleColor\s*\(\)/);
    });

    it('base `getTitleText` default return is the literal "GAME OVER"', async () => {
      // The 11 non-Rhythm-Hacker games inherit this default. A refactor that
      // changes the default to e.g. "DISCONNECTED" silently repaints every
      // other game's death screen. Pair this with the behaviour assertion
      // that RhythmHackerGameOverScene falls back to 'GAME OVER' on
      // undefined reason.
      const src = await readBaseSource();
      expect(src).toMatch(
        /protected\s+getTitleText\s*\(\)\s*:\s*string\s*{\s*\n\s*return\s*['"]GAME OVER['"]\s*;/,
      );
    });

    it('base `getTitleColor` default return is MATRIX_COLORS.RED_HEX', async () => {
      // Death convention — red conveys loss. A silent swap (e.g. to a
      // Matrix green "pass" colour) inverts the entire arcade's game-over
      // read without touching any subclass. This test pairs with the
      // getTitleText default lock to keep both axes stable.
      const src = await readBaseSource();
      expect(src).toMatch(
        /protected\s+getTitleColor\s*\(\)\s*:\s*string\s*{\s*\n\s*return\s*MATRIX_COLORS\.RED_HEX\s*;/,
      );
    });
  });

  describe('RhythmHackerGameOverScene override syntax', () => {
    it('override uses `protected override` for getTitleText', async () => {
      // `override` modifier requires strict mode + TS 4.3+; dropping it
      // silently permits a method that happens to match the base signature
      // but doesn't guarantee override semantics. `protected override` is
      // the supported form and keeps the intent explicit.
      const src = await readRhythmOverrideSource();
      expect(src).toMatch(/protected\s+override\s+getTitleText\s*\(\)\s*:\s*string\s*{/);
    });

    it('override uses `protected override` for getTitleColor', async () => {
      const src = await readRhythmOverrideSource();
      expect(src).toMatch(/protected\s+override\s+getTitleColor\s*\(\)\s*:\s*string\s*{/);
    });
  });
});

