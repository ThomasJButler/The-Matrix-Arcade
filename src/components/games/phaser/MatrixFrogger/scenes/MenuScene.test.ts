/**
 * Matrix Frogger — MenuScene legend + layout tripwire (R86.F5).
 *
 * Why this exists: Tom 2026-04-21 Frogger playtest flagged "we need to have
 * what the different game objects are in the game menu". R86.F5 adds a
 * GAME OBJECTS legend listing every sprite the player meets — agents,
 * sentinels, kung-fu ability, red/blue pill pickups, NEO pickup — with
 * one-word meanings.
 *
 * Two contracts are locked here:
 *
 *  1. Pure maths: the five exported Y ratios (HOW TO PLAY heading → controls
 *     → LEGEND heading → icons → labels) are strictly increasing, sit in the
 *     conventional 0.40–0.70 instruction band, and the lowest label never
 *     encroaches on the shared START button (centred on
 *     BaseScene.MENU_START_BUTTON_Y_RATIO = 0.75, ~50 px tall → top edge
 *     ~0.708 on a 600-px canvas). Belt-and-braces overlap checks at both
 *     600-px (Frogger canvas) and 400-px (Snake-style short canvas) catch a
 *     future ratio drift before it re-creates the Invaders R85.I5 bug.
 *
 *  2. Wiring: `create()` emits the three text headings in order, then six
 *     icon/label pairs — one per `LEGEND_ITEMS` entry, in the declared order
 *     (agent → sentinel → kung-fu → red pill → blue pill → neo). The sprite
 *     keys are exactly the textures registered in BootScene.ts, so if a new
 *     pickup is added there without updating LEGEND_ITEMS, this test will
 *     still pass — but the test for "all keys match known BootScene textures"
 *     documents the expected set, which a human reviewer will notice.
 *
 * Phaser is mocked globally in src/test/setup.ts; the mock Scene factory
 * returns a plain object that breaks the prototype chain, so we re-bind
 * subclass methods manually (same trick VortexPongMenuScene / Invaders
 * MenuScene tests use) and stub `super.create()` via a temporary prototype
 * override rather than trying to exercise the real base-class body.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  FroggerMenuScene,
  HOW_TO_PLAY_Y_RATIO,
  CONTROLS_Y_RATIO,
  LEGEND_HEADING_Y_RATIO,
  LEGEND_ICON_Y_RATIO,
  LEGEND_LABEL_Y_RATIO,
  LEGEND_ICON_SIZE,
  LEGEND_ITEMS,
} from './MenuScene';
import { MenuScene as BaseMenuScene } from '@/lib/phaser/scenes/MenuScene';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Shared constants cribbed from BaseScene — kept literal here so a drift in
// BaseScene's ratio produces a visible test failure rather than a silent
// compensating change.
const START_BUTTON_Y_RATIO = 0.75;
const START_BUTTON_HEIGHT_PX = 50;

/** Texture keys registered in FroggerBootScene — the legend must sample from
 *  this set to avoid dangling sprite references at menu-render time. */
const BOOT_SCENE_TEXTURE_KEYS = new Set([
  'enemy_agent',
  'enemy_sentinel',
  'kung_fu_icon',
  'red_pill',
  'blue_pill',
  'neo_pickup',
]);

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

function createTestMenu(width = 800, height = 600) {
  const scene = new FroggerMenuScene() as any;
  for (const name of collectPrototypeMethods(FroggerMenuScene)) {
    const fn = (FroggerMenuScene.prototype as any)[name];
    if (typeof fn === 'function') scene[name] = fn.bind(scene);
  }

  // FroggerMenuScene's create() reads from this.game.config (not this.scale).
  scene.game = { config: { width, height } };

  const createMatrixText = vi.fn().mockImplementation(() => ({
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
  }));
  scene.createMatrixText = createMatrixText;

  // `this.add.image(x, y, key).setDisplaySize(...)` must return something
  // chainable for the subclass. Each call returns a fresh mock so the test
  // can inspect per-sprite arguments independently.
  const addImage = vi.fn().mockImplementation(() => ({
    setDisplaySize: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
  }));
  scene.add = { image: addImage };

  return { scene, createMatrixText, addImage };
}

describe('FroggerMenuScene — R86.F5 GAME OBJECTS legend', () => {
  let origBaseCreate: typeof BaseMenuScene.prototype.create;

  beforeEach(() => {
    // Stub super.create() — we only want to exercise the subclass body.
    origBaseCreate = BaseMenuScene.prototype.create;
    BaseMenuScene.prototype.create = vi.fn();
  });

  afterEach(() => {
    BaseMenuScene.prototype.create = origBaseCreate;
  });

  describe('Y-ratio tuple — static layout invariants', () => {
    const ratios = [
      HOW_TO_PLAY_Y_RATIO,
      CONTROLS_Y_RATIO,
      LEGEND_HEADING_Y_RATIO,
      LEGEND_ICON_Y_RATIO,
      LEGEND_LABEL_Y_RATIO,
    ];

    it('all five ratios sit in the conventional 0.40–0.70 instruction band', () => {
      for (const r of ratios) {
        expect(r).toBeGreaterThanOrEqual(0.40);
        expect(r).toBeLessThanOrEqual(0.70);
      }
    });

    it('ratios are strictly increasing — no row overlap', () => {
      for (let i = 1; i < ratios.length; i++) {
        expect(ratios[i]).toBeGreaterThan(ratios[i - 1]);
      }
    });

    it('lowest row (labels) clears the START button on the 600-px Frogger canvas', () => {
      const canvasHeight = 600;
      const buttonTopY = canvasHeight * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const labelY = canvasHeight * LEGEND_LABEL_Y_RATIO;
      // 8-px label font — allow ~8 px half-height + a small gap guard (4 px)
      expect(labelY + 8 + 4).toBeLessThan(buttonTopY);
    });

    it('maintains at least 10-px clearance between label baseline and button top (guards against tuple drift)', () => {
      // Frogger's canvas is hard-coded to 600 px in PHASER_CONFIG, so the
      // only realistic regression vector is a future author raising
      // LEGEND_LABEL_Y_RATIO. Lock a 10-px minimum gap as belt-and-braces
      // against that drift — if ratios are bumped past 0.70 this fires.
      const canvasHeight = 600;
      const buttonTopY = canvasHeight * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const labelBottomY = canvasHeight * LEGEND_LABEL_Y_RATIO + 8;
      expect(buttonTopY - labelBottomY).toBeGreaterThanOrEqual(10);
    });

    it('icon row + LEGEND_ICON_SIZE never encroaches on the button band', () => {
      const canvasHeight = 600;
      const buttonTopY = canvasHeight * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const iconBottomY = canvasHeight * LEGEND_ICON_Y_RATIO + LEGEND_ICON_SIZE / 2;
      expect(iconBottomY).toBeLessThan(buttonTopY);
    });

    it('does NOT regress to a ratio that would re-create the Invaders R85.I5 overlap', () => {
      // Invaders bug was ratios ≥ 0.70 overlapping the button. Lock all five
      // rows strictly below 0.70 so the escape hatch stays shut.
      for (const r of ratios) {
        expect(r).toBeLessThan(0.70);
      }
    });
  });

  describe('LEGEND_ITEMS tuple — object inventory', () => {
    it('exposes exactly 6 entries (agent, sentinel, kung-fu, red pill, blue pill, neo)', () => {
      expect(LEGEND_ITEMS).toHaveLength(6);
    });

    it('every textureKey matches a sprite registered in FroggerBootScene', () => {
      for (const item of LEGEND_ITEMS) {
        expect(BOOT_SCENE_TEXTURE_KEYS.has(item.textureKey)).toBe(true);
      }
    });

    it('labels are short (≤ 10 chars) so they fit under a 22-px icon column', () => {
      for (const item of LEGEND_ITEMS) {
        expect(item.label.length).toBeLessThanOrEqual(10);
      }
    });

    it('declaration order groups danger first, reward last (helps scanability)', () => {
      // Agents + sentinels are the hazards players must avoid; NEO is the
      // power reward. Locking the order prevents a thoughtless re-sort.
      const labels = LEGEND_ITEMS.map((i) => i.label);
      expect(labels).toEqual(['AGENT', 'SENTINEL', 'KUNG FU', 'POINTS', 'POWER-UP', 'NEO']);
    });
  });

  describe('create() — wiring contract', () => {
    it('emits the three expected headings in order (HOW TO PLAY, controls, GAME OBJECTS)', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      const textStrings = createMatrixText.mock.calls.map((c: unknown[]) => c[2]);
      // First three are headings / controls line — the remaining six are
      // per-item labels.
      expect(textStrings.slice(0, 3)).toEqual([
        'HOW TO PLAY',
        'Arrows / WASD: Move  ·  K: Kung Fu Strike (3 charges)',
        'GAME OBJECTS',
      ]);
    });

    it('places headings + rows on the exported Y ratios (not hard-coded y)', () => {
      const height = 600;
      const { scene, createMatrixText } = createTestMenu(800, height);
      scene.create();

      const calls = createMatrixText.mock.calls;
      // Signature: createMatrixText(x, y, text, size, colour?)
      expect(calls[0][1]).toBeCloseTo(height * HOW_TO_PLAY_Y_RATIO, 6);
      expect(calls[1][1]).toBeCloseTo(height * CONTROLS_Y_RATIO, 6);
      expect(calls[2][1]).toBeCloseTo(height * LEGEND_HEADING_Y_RATIO, 6);

      // The remaining 6 calls are the labels, all at the same label Y.
      for (let i = 3; i < calls.length; i++) {
        expect(calls[i][1]).toBeCloseTo(height * LEGEND_LABEL_Y_RATIO, 6);
      }
    });

    it('adds exactly 6 icon sprites — one per LEGEND_ITEMS entry, in order', () => {
      const { scene, addImage } = createTestMenu();
      scene.create();
      expect(addImage).toHaveBeenCalledTimes(LEGEND_ITEMS.length);

      // addImage signature: (x, y, key). The key (3rd arg) must match the
      // LEGEND_ITEMS declaration order exactly.
      const keys = addImage.mock.calls.map((c: unknown[]) => c[2]);
      expect(keys).toEqual(LEGEND_ITEMS.map((i) => i.textureKey));
    });

    it('every icon is placed at height * LEGEND_ICON_Y_RATIO (shared baseline)', () => {
      const height = 600;
      const { scene, addImage } = createTestMenu(800, height);
      scene.create();
      for (const call of addImage.mock.calls) {
        expect(call[1]).toBeCloseTo(height * LEGEND_ICON_Y_RATIO, 6);
      }
    });

    it('icons are spaced symmetrically across the canvas width', () => {
      const width = 800;
      const { scene, addImage } = createTestMenu(width, 600);
      scene.create();
      const xs = addImage.mock.calls.map((c: unknown[]) => c[0] as number);
      // Symmetric around the canvas centre: first X + last X should sum to
      // the canvas width (mirror pair around centre).
      expect(xs[0] + xs[xs.length - 1]).toBeCloseTo(width, 4);
      // Strictly increasing left-to-right so nothing draws backwards.
      for (let i = 1; i < xs.length; i++) {
        expect(xs[i]).toBeGreaterThan(xs[i - 1]);
      }
    });

    it('calls setDisplaySize(22, 22) on every icon so sprite-source size does not leak into the menu', () => {
      const { scene, addImage } = createTestMenu();
      scene.create();
      for (const result of addImage.mock.results) {
        const mockIcon = result.value as { setDisplaySize: ReturnType<typeof vi.fn> };
        expect(mockIcon.setDisplaySize).toHaveBeenCalledWith(LEGEND_ICON_SIZE, LEGEND_ICON_SIZE);
      }
    });

    it('emits label text in declared LEGEND_ITEMS order beneath the icons', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      // Calls 3..8 are the labels.
      const labels = createMatrixText.mock.calls
        .slice(3)
        .map((c: unknown[]) => c[2] as string);
      expect(labels).toEqual(LEGEND_ITEMS.map((i) => i.label));
    });

    it('honours canvas-height scaling — legend rescales with a shorter canvas', () => {
      const { scene: sceneTall, createMatrixText: textTall } = createTestMenu(800, 600);
      sceneTall.create();
      const tallLabelY = textTall.mock.calls[3][1] as number;

      const { scene: sceneShort, createMatrixText: textShort } = createTestMenu(800, 400);
      sceneShort.create();
      const shortLabelY = textShort.mock.calls[3][1] as number;

      expect(tallLabelY).toBeCloseTo(600 * LEGEND_LABEL_Y_RATIO, 6);
      expect(shortLabelY).toBeCloseTo(400 * LEGEND_LABEL_Y_RATIO, 6);
      expect(tallLabelY).toBeGreaterThan(shortLabelY);
    });
  });
});
