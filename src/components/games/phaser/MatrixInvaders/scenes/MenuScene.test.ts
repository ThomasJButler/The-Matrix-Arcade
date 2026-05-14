/**
 * Matrix Invaders — MenuScene start-button / control-hint overlap tripwire
 * (R85.I5).
 *
 * Why this exists: Tom's 2026-04-21 Invaders playtest caught the START button
 * painting directly on top of the "Arrow keys / WASD / SPACE / B" hint stack.
 * Root cause was the subclass placing the 3 hint lines at height * 0.72 + i*22
 * (y = 324/346/368 on a 450-px canvas), while the shared START button sits at
 * BaseScene.MENU_START_BUTTON_Y_RATIO = 0.75 with ~50 px height (y band
 * 312-362). The two overlapped squarely.
 *
 * These tests lock the fix at two levels:
 *
 *  1. Pure maths: the exported `CONTROL_HINT_Y_RATIOS` tuple sits in the
 *     conventional 0.52-0.64 instruction band (same band as Snake, MatrixCloud,
 *     NeoJump, etc.) so the stack stays above the START button's 0.75 anchor.
 *     Overlap is also checked against a concrete 50-px-tall button hitbox at
 *     450-px and 400-px canvas heights — belt-and-braces in case BaseScene's
 *     ratio ever drifts.
 *
 *  2. Wiring: `create()` iterates the three exported ratios in order and
 *     positions each line at `height * CONTROL_HINT_Y_RATIOS[i]`. If a future
 *     edit regresses to the old `0.72 + i*22` pattern (or any ad-hoc maths)
 *     the wiring test catches it before Tom does.
 *
 * Phaser is mocked globally in src/test/setup.ts; the prototype chain is
 * broken by the mock Scene factory, so we re-bind subclass methods manually
 * (same trick VortexPongMenuScene.test.ts uses) and stub `super.create()` via
 * a temporary prototype override rather than trying to exercise the real
 * base-class body.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MatrixInvadersMenuScene, CONTROL_HINT_Y_RATIOS } from './MenuScene';
import { MenuScene as BaseMenuScene } from '@/lib/phaser/scenes/MenuScene';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Shared constants cribbed from BaseScene — kept literal here so a drift in
// BaseScene's ratio produces a visible test failure rather than a silent
// compensating change.
const START_BUTTON_Y_RATIO = 0.75;
const START_BUTTON_HEIGHT_PX = 50;

function collectPrototypeMethods(cls: any): string[] {
  const methods = new Set<string>();
  let proto = cls.prototype;
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key !== 'constructor' && typeof proto[key] === 'function') {
        methods.add(key);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return [...methods];
}

function createTestMenu(width = 800, height = 450) {
  const scene = new MatrixInvadersMenuScene() as any;
  for (const name of collectPrototypeMethods(MatrixInvadersMenuScene)) {
    const fn = (MatrixInvadersMenuScene.prototype as any)[name];
    if (typeof fn === 'function') scene[name] = fn.bind(scene);
  }

  scene.scale = { width, height };

  const createMatrixText = vi.fn().mockImplementation(() => ({
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
  }));
  scene.createMatrixText = createMatrixText;

  return { scene, createMatrixText };
}

describe('MatrixInvadersMenuScene — R85.I5 start-button / hint overlap invariant', () => {
  let origBaseCreate: typeof BaseMenuScene.prototype.create;

  beforeEach(() => {
    // Stub super.create() — we only want to exercise the subclass body.
    // The base-class create paints title, subtitle, button, rain etc. and
    // that machinery belongs to BaseMenuScene's own tests.
    origBaseCreate = BaseMenuScene.prototype.create;
    BaseMenuScene.prototype.create = vi.fn();
  });

  afterEach(() => {
    BaseMenuScene.prototype.create = origBaseCreate;
  });

  describe('CONTROL_HINT_Y_RATIOS tuple (static invariants)', () => {
    it('exports exactly three ratios — one per hint line', () => {
      expect(CONTROL_HINT_Y_RATIOS).toHaveLength(3);
    });

    it('every ratio sits in the conventional 0.52–0.64 instruction band', () => {
      // Upper bound is 0.64 rather than 0.75 because the START button is
      // *centred* on 0.75 — the button's top edge reaches ~0.69 on a 450-px
      // canvas (337 - 25 = 312 → 312/450 ≈ 0.693), and we want a clear gap.
      for (const r of CONTROL_HINT_Y_RATIOS) {
        expect(r).toBeGreaterThanOrEqual(0.52);
        expect(r).toBeLessThanOrEqual(0.64);
      }
    });

    it('ratios are strictly increasing (no overlapping lines)', () => {
      for (let i = 1; i < CONTROL_HINT_Y_RATIOS.length; i++) {
        expect(CONTROL_HINT_Y_RATIOS[i]).toBeGreaterThan(CONTROL_HINT_Y_RATIOS[i - 1]);
      }
    });

    it('lowest hint line clears the start button top edge on 450-px canvas', () => {
      const canvasHeight = 450;
      const buttonTopY = canvasHeight * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const lastHintY = canvasHeight * CONTROL_HINT_Y_RATIOS[CONTROL_HINT_Y_RATIOS.length - 1];
      // 8-px font baseline sits roughly centred on the y coord — add a small
      // guard band (8 px half-height) for the hint glyph + a comfortable gap.
      expect(lastHintY + 8).toBeLessThan(buttonTopY);
    });

    it('lowest hint line clears the start button top edge on 400-px canvas (Snake size)', () => {
      const canvasHeight = 400;
      const buttonTopY = canvasHeight * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const lastHintY = canvasHeight * CONTROL_HINT_Y_RATIOS[CONTROL_HINT_Y_RATIOS.length - 1];
      expect(lastHintY + 8).toBeLessThan(buttonTopY);
    });

    it('does not regress to the broken 0.72-stack pattern', () => {
      // Tom-repro: the old implementation placed lines at 0.72 + i * (22/height),
      // which on 450 px collapses to 0.72, 0.769, 0.818 — squarely on the button.
      // Locking against >= 0.70 keeps the escape hatch from reopening.
      for (const r of CONTROL_HINT_Y_RATIOS) {
        expect(r).toBeLessThan(0.70);
      }
    });
  });

  describe('create() places hints exactly on the exported ratios', () => {
    it('calls createMatrixText three times, one per hint line', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      expect(createMatrixText).toHaveBeenCalledTimes(3);
    });

    it('each hint y matches height * CONTROL_HINT_Y_RATIOS[i] exactly', () => {
      const height = 450;
      const { scene, createMatrixText } = createTestMenu(800, height);
      scene.create();
      for (let i = 0; i < CONTROL_HINT_Y_RATIOS.length; i++) {
        const callArgs = createMatrixText.mock.calls[i];
        // Signature: createMatrixText(x, y, text, size, colour?)
        expect(callArgs[1]).toBeCloseTo(height * CONTROL_HINT_Y_RATIOS[i], 6);
      }
    });

    it('renders the three expected hint strings in order', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      const texts = createMatrixText.mock.calls.map((c: unknown[]) => c[2]);
      expect(texts).toEqual([
        'Arrow keys / WASD: Move',
        'SPACE: Fire',
        'B: Bullet Time',
      ]);
    });

    it('none of the hint y values land inside the start-button band', () => {
      const height = 450;
      const buttonTopY = height * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const buttonBottomY = height * START_BUTTON_Y_RATIO + START_BUTTON_HEIGHT_PX / 2;
      const { scene, createMatrixText } = createTestMenu(800, height);
      scene.create();
      for (const call of createMatrixText.mock.calls) {
        const y = call[1] as number;
        expect(y < buttonTopY || y > buttonBottomY).toBe(true);
      }
    });

    it('hint y values scale with canvas height (ratios honoured, not hard-coded)', () => {
      const { scene: sceneTall, createMatrixText: textTall } = createTestMenu(800, 600);
      sceneTall.create();
      const tallY = textTall.mock.calls[0][1] as number;

      const { scene: sceneShort, createMatrixText: textShort } = createTestMenu(800, 400);
      sceneShort.create();
      const shortY = textShort.mock.calls[0][1] as number;

      expect(tallY).toBeCloseTo(600 * CONTROL_HINT_Y_RATIOS[0], 6);
      expect(shortY).toBeCloseTo(400 * CONTROL_HINT_Y_RATIOS[0], 6);
      expect(tallY).toBeGreaterThan(shortY);
    });
  });
});
