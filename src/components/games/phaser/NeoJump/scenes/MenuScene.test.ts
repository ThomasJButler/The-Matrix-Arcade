/**
 * Neo Jump — MenuScene CONTROLS panel tripwire (R86.N3).
 *
 * Why this exists: Tom 2026-04-22 Neo Jump playtest asked "we need to show
 * the player what the controls are." R86.N3 adds a CONTROLS heading + a
 * five-row keycap legend (arrows, jetpack, shoot, pause, exit) so the
 * gameplay bindings are visible before START.
 *
 * Two contracts are locked here:
 *
 *  1. Pure maths: the three exported Y ratios (heading + first-row + row
 *     spacing) and the derived per-row positions sit strictly below the
 *     shared START button (`BaseScene.MENU_START_BUTTON_Y_RATIO = 0.75`,
 *     ~50 px tall → top edge ~0.708 on a 600-px canvas), stay inside the
 *     conventional 0.40–0.70 instruction band, and preserve the ≥10-px
 *     clearance Frogger R86.F5 + Invaders R85.I5 pinned as regression
 *     tripwires. If a future author raises any ratio past 0.70 or
 *     stretches row spacing, this test turns red.
 *
 *  2. Wiring: `create()` emits the heading in call 0, then five cue rows,
 *     each producing TWO `createMatrixText` calls (key + action) on the
 *     same Y — so a 5-item tuple yields 1 + 5 × 2 = 11 text calls in a
 *     deterministic order. Key strings must match `CONTROLS_ITEMS` so
 *     copy drift in the scene file is caught immediately.
 *
 * Phaser is mocked globally in src/test/setup.ts; the mock Scene factory
 * returns a plain object that breaks the prototype chain, so we re-bind
 * subclass methods manually (same trick the Frogger R86.F5 MenuScene
 * test uses) and stub `super.create()` via a temporary prototype
 * override.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NeoJumpMenuScene,
  CONTROLS_HEADING_Y_RATIO,
  CONTROLS_FIRST_ROW_Y_RATIO,
  CONTROLS_ROW_SPACING_Y_RATIO,
  CONTROLS_HEADING_FONT_PX,
  CONTROLS_ROW_FONT_PX,
  CONTROLS_ITEMS,
} from './MenuScene';
import { MenuScene as BaseMenuScene } from '@/lib/phaser/scenes/MenuScene';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Shared constants cribbed from BaseScene — kept literal here so a drift
 *  in BaseScene's ratio produces a visible test failure rather than a
 *  silent compensating change. */
const START_BUTTON_Y_RATIO = 0.75;
const START_BUTTON_HEIGHT_PX = 50;
/** Neo Jump's canvas is 400 × 600 (see `GAME_CONFIG.WIDTH/HEIGHT`). */
const NEO_JUMP_CANVAS_W = 400;
const NEO_JUMP_CANVAS_H = 600;

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

function createTestMenu(width = NEO_JUMP_CANVAS_W, height = NEO_JUMP_CANVAS_H) {
  const scene = new NeoJumpMenuScene() as any;
  for (const name of collectPrototypeMethods(NeoJumpMenuScene)) {
    const fn = (NeoJumpMenuScene.prototype as any)[name];
    if (typeof fn === 'function') scene[name] = fn.bind(scene);
  }

  // NeoJumpMenuScene.create() reads from this.game.config (not this.scale).
  scene.game = { config: { width, height } };

  const createMatrixText = vi.fn().mockImplementation(() => ({
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
  }));
  scene.createMatrixText = createMatrixText;

  return { scene, createMatrixText };
}

/** Compute the Y position for a given row index (0 = first row). */
function rowYRatio(index: number): number {
  return CONTROLS_FIRST_ROW_Y_RATIO + CONTROLS_ROW_SPACING_Y_RATIO * index;
}

describe('NeoJumpMenuScene — R86.N3 CONTROLS panel', () => {
  let origBaseCreate: typeof BaseMenuScene.prototype.create;

  beforeEach(() => {
    // Stub super.create() — exercise only the subclass body.
    origBaseCreate = BaseMenuScene.prototype.create;
    BaseMenuScene.prototype.create = vi.fn();
  });

  afterEach(() => {
    BaseMenuScene.prototype.create = origBaseCreate;
  });

  describe('Y-ratio tuple — static layout invariants', () => {
    it('heading + first-row ratios sit in the conventional 0.40–0.70 instruction band', () => {
      expect(CONTROLS_HEADING_Y_RATIO).toBeGreaterThanOrEqual(0.40);
      expect(CONTROLS_HEADING_Y_RATIO).toBeLessThanOrEqual(0.70);
      expect(CONTROLS_FIRST_ROW_Y_RATIO).toBeGreaterThanOrEqual(0.40);
      expect(CONTROLS_FIRST_ROW_Y_RATIO).toBeLessThanOrEqual(0.70);
    });

    it('row spacing is a small positive ratio — no overlap, no giant gaps', () => {
      expect(CONTROLS_ROW_SPACING_Y_RATIO).toBeGreaterThan(0);
      // Upper bound: a 10-px row font on 600-px canvas occupies ~1.7% of
      // height. Spacing above 5% would look absurdly sparse.
      expect(CONTROLS_ROW_SPACING_Y_RATIO).toBeLessThanOrEqual(0.05);
    });

    it('heading sits strictly above the first cue row', () => {
      expect(CONTROLS_HEADING_Y_RATIO).toBeLessThan(CONTROLS_FIRST_ROW_Y_RATIO);
    });

    it('last cue row clears the START button on the 600-px Neo Jump canvas', () => {
      const buttonTopY = NEO_JUMP_CANVAS_H * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const lastRowY = NEO_JUMP_CANVAS_H * rowYRatio(CONTROLS_ITEMS.length - 1);
      // Half-height (5 px) + 4 px safety gutter.
      expect(lastRowY + CONTROLS_ROW_FONT_PX / 2 + 4).toBeLessThan(buttonTopY);
    });

    it('maintains ≥10-px clearance between last-row baseline and button top', () => {
      // Guard against tuple drift: locking the same 10-px margin as Frogger
      // R86.F5 prevents a future author bumping the spacing and re-creating
      // the Invaders R85.I5 overlap.
      const buttonTopY = NEO_JUMP_CANVAS_H * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const lastRowBottomY = NEO_JUMP_CANVAS_H * rowYRatio(CONTROLS_ITEMS.length - 1) + CONTROLS_ROW_FONT_PX / 2;
      expect(buttonTopY - lastRowBottomY).toBeGreaterThanOrEqual(10);
    });

    it('no row ratio equals or exceeds 0.70 (anti-regression ratchet)', () => {
      // Mirrors the Frogger R86.F5 / Invaders R85.I5 tripwire — a future
      // row-spacing bump that pushes any row ≥ 0.70 is a hard fail.
      for (let i = 0; i < CONTROLS_ITEMS.length; i++) {
        expect(rowYRatio(i)).toBeLessThan(0.70);
      }
    });
  });

  describe('CONTROLS_ITEMS tuple — cue inventory', () => {
    it('exposes exactly 5 entries (MOVE, JETPACK, SHOOT, PAUSE, EXIT)', () => {
      expect(CONTROLS_ITEMS).toHaveLength(5);
    });

    it('declaration order groups gameplay cues first, exit last', () => {
      const actions = CONTROLS_ITEMS.map((c) => c.action);
      expect(actions).toEqual(['MOVE', 'JETPACK', 'SHOOT', 'PAUSE', 'EXIT']);
    });

    it('every key string is short (≤ 6 chars) so a 10-px font fits in the key column', () => {
      for (const item of CONTROLS_ITEMS) {
        expect(item.key.length).toBeLessThanOrEqual(6);
      }
    });

    it('exposes the arrow + jetpack + shoot cues — Tom N3 playtest checklist', () => {
      const keys = CONTROLS_ITEMS.map((c) => c.key);
      expect(keys).toContain('← →');
      expect(keys).toContain('↑ / W');
      expect(keys).toContain('SPACE');
    });
  });

  describe('create() — wiring contract', () => {
    it('emits heading first, then five key+action pairs (11 text calls total)', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      // 1 heading + 5 rows × 2 columns = 11.
      expect(createMatrixText).toHaveBeenCalledTimes(1 + CONTROLS_ITEMS.length * 2);
    });

    it('renders the CONTROLS heading as call 0 with the exported font size', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      const headingCall = createMatrixText.mock.calls[0];
      // Signature: createMatrixText(x, y, text, size, colour?)
      expect(headingCall[2]).toBe('CONTROLS');
      expect(headingCall[3]).toBe(CONTROLS_HEADING_FONT_PX);
    });

    it('places the heading on CONTROLS_HEADING_Y_RATIO (not a hard-coded y)', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      expect(createMatrixText.mock.calls[0][1]).toBeCloseTo(
        NEO_JUMP_CANVAS_H * CONTROLS_HEADING_Y_RATIO,
        6,
      );
    });

    it('emits key + action strings in declared CONTROLS_ITEMS order', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      // Rows start at call 1 (call 0 is the heading). Pairs are
      // (key, action) — key first, action second for each row.
      const rowCalls = createMatrixText.mock.calls.slice(1);
      const pairs: Array<[string, string]> = [];
      for (let i = 0; i < rowCalls.length; i += 2) {
        pairs.push([rowCalls[i][2] as string, rowCalls[i + 1][2] as string]);
      }
      expect(pairs).toEqual(CONTROLS_ITEMS.map((c) => [c.key, c.action]));
    });

    it('positions each row on the derived Y ratio (first row + spacing × index)', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      const rowCalls = createMatrixText.mock.calls.slice(1);
      for (let i = 0; i < CONTROLS_ITEMS.length; i++) {
        const keyCall = rowCalls[i * 2];
        const actionCall = rowCalls[i * 2 + 1];
        const expectedY = NEO_JUMP_CANVAS_H * rowYRatio(i);
        expect(keyCall[1]).toBeCloseTo(expectedY, 6);
        expect(actionCall[1]).toBeCloseTo(expectedY, 6);
      }
    });

    it('keys sit left of actions inside each row (two-column keycap layout)', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      const rowCalls = createMatrixText.mock.calls.slice(1);
      for (let i = 0; i < CONTROLS_ITEMS.length; i++) {
        const keyX = rowCalls[i * 2][0] as number;
        const actionX = rowCalls[i * 2 + 1][0] as number;
        expect(keyX).toBeLessThan(actionX);
      }
    });

    it('honours canvas-height scaling — legend rescales with a shorter canvas', () => {
      const { scene: sceneTall, createMatrixText: textTall } = createTestMenu(NEO_JUMP_CANVAS_W, 600);
      sceneTall.create();
      const tallHeadingY = textTall.mock.calls[0][1] as number;

      const { scene: sceneShort, createMatrixText: textShort } = createTestMenu(NEO_JUMP_CANVAS_W, 400);
      sceneShort.create();
      const shortHeadingY = textShort.mock.calls[0][1] as number;

      expect(tallHeadingY).toBeCloseTo(600 * CONTROLS_HEADING_Y_RATIO, 6);
      expect(shortHeadingY).toBeCloseTo(400 * CONTROLS_HEADING_Y_RATIO, 6);
      expect(tallHeadingY).toBeGreaterThan(shortHeadingY);
    });

    it('rows share their key + action Y position (pair ordering does not skew the baseline)', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      const rowCalls = createMatrixText.mock.calls.slice(1);
      for (let i = 0; i < CONTROLS_ITEMS.length; i++) {
        const keyY = rowCalls[i * 2][1] as number;
        const actionY = rowCalls[i * 2 + 1][1] as number;
        expect(keyY).toBeCloseTo(actionY, 6);
      }
    });
  });
});
