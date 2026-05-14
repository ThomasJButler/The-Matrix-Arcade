/**
 * CodeBreaker — MenuScene legend + start-button overlap tripwire (R87.K7).
 *
 * Why this exists: Tom 2026-04-22 playtest asked for a power-up legend in the
 * menu ("we need some sort of info about this before we start playing the
 * game, because it's a bit of guessing what power up is what"). The fix adds
 * a 6-icon POWER-UPS row to the HOW TO PLAY block; without a tripwire a
 * future tweak to the Y-ratios could silently drift into the shared START
 * button hitbox at BaseScene.MENU_START_BUTTON_Y_RATIO = 0.75.
 *
 * Tests split into two layers:
 *
 *  1. Pure maths: every exported Y-ratio sits strictly below 0.70 and above
 *     0.40 on the 450-px canvas, LEGEND_ICON_Y_RATIO < LEGEND_LABEL_Y_RATIO
 *     (icon above label, not overlapping), and LEGEND_LABEL_Y_RATIO + 8-px
 *     baseline guard stays clear of the 50-px-tall START button centred on
 *     0.75. Belt-and-braces at 400-px canvas height too.
 *
 *  2. Wiring: create() iterates the exported ratios + POWERUP_LEGEND.ENTRIES
 *     tuple so a future edit that hardcodes ad-hoc maths or drops a power-up
 *     from the panel fails the render-count / content assertions.
 *
 * Phaser is mocked globally in src/test/setup.ts; the prototype chain is
 * broken by the mock Scene factory, so we re-bind subclass methods manually
 * (same trick MatrixInvadersMenuScene.test.ts uses) and stub super.create()
 * via a temporary prototype override.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CodeBreakerMenuScene,
  HOW_TO_PLAY_Y_RATIO,
  CONTROLS_LINE_1_Y_RATIO,
  CONTROLS_LINE_2_Y_RATIO,
  CONTROLS_LINE_3_Y_RATIO,
  LEGEND_HEADING_Y_RATIO,
  LEGEND_ICON_Y_RATIO,
  LEGEND_LABEL_Y_RATIO,
  LEGEND_ICON_SIZE,
} from './MenuScene';
import { MenuScene as BaseMenuScene } from '@/lib/phaser/scenes/MenuScene';
import { POWERUP_LEGEND, POWERUP_DEFS } from '../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Shared BaseScene constants — kept literal so a drift in BaseScene produces a
// visible test failure rather than a silent compensating change.
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
  const scene = new CodeBreakerMenuScene() as any;
  for (const name of collectPrototypeMethods(CodeBreakerMenuScene)) {
    const fn = (CodeBreakerMenuScene.prototype as any)[name];
    if (typeof fn === 'function') scene[name] = fn.bind(scene);
  }

  scene.game = { config: { width, height } };
  scene.scale = { width, height };

  const createMatrixText = vi.fn().mockImplementation(() => ({
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
  }));
  scene.createMatrixText = createMatrixText;

  const imageSpy = vi.fn().mockImplementation(() => ({
    setDisplaySize: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
  }));
  scene.add = { image: imageSpy };

  return { scene, createMatrixText, imageSpy };
}

describe('CodeBreakerMenuScene — R87.K7 power-up legend + overlap invariant', () => {
  let origBaseCreate: typeof BaseMenuScene.prototype.create;

  beforeEach(() => {
    // Stub super.create() — we only want to exercise the subclass body.
    // BaseMenuScene paints title + button + rain; that machinery has its own
    // tests in BaseMenuScene.test.ts.
    origBaseCreate = BaseMenuScene.prototype.create;
    BaseMenuScene.prototype.create = vi.fn();
  });

  afterEach(() => {
    BaseMenuScene.prototype.create = origBaseCreate;
  });

  describe('Exported Y-ratios (static invariants)', () => {
    it('all ratios sit strictly between 0.40 and 0.70', () => {
      for (const r of [
        HOW_TO_PLAY_Y_RATIO,
        CONTROLS_LINE_1_Y_RATIO,
        CONTROLS_LINE_2_Y_RATIO,
        CONTROLS_LINE_3_Y_RATIO,
        LEGEND_HEADING_Y_RATIO,
        LEGEND_ICON_Y_RATIO,
        LEGEND_LABEL_Y_RATIO,
      ]) {
        expect(r).toBeGreaterThanOrEqual(0.40);
        expect(r).toBeLessThan(0.70);
      }
    });

    it('ratios are strictly increasing top-to-bottom', () => {
      const seq = [
        HOW_TO_PLAY_Y_RATIO,
        CONTROLS_LINE_1_Y_RATIO,
        CONTROLS_LINE_2_Y_RATIO,
        CONTROLS_LINE_3_Y_RATIO,
        LEGEND_HEADING_Y_RATIO,
        LEGEND_ICON_Y_RATIO,
        LEGEND_LABEL_Y_RATIO,
      ];
      for (let i = 1; i < seq.length; i++) {
        expect(seq[i]).toBeGreaterThan(seq[i - 1]);
      }
    });

    it('LEGEND_ICON_Y_RATIO is above LEGEND_LABEL_Y_RATIO with room for the icon', () => {
      const height = 450;
      const gap = (LEGEND_LABEL_Y_RATIO - LEGEND_ICON_Y_RATIO) * height;
      // Icon is LEGEND_ICON_SIZE tall (centred on its y). Label baseline sits
      // roughly centred on its y too. Requires gap > (ICON_SIZE/2 + label font
      // half-height ≈ 3-4 px) so they never collide.
      expect(gap).toBeGreaterThan(LEGEND_ICON_SIZE / 2 + 4);
    });

    it('lowest legend row (label) clears the START button top on 450-px canvas', () => {
      const canvasHeight = 450;
      const buttonTopY = canvasHeight * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const lastRowY = canvasHeight * LEGEND_LABEL_Y_RATIO;
      // 8-px guard band accounts for the label glyph half-height.
      expect(lastRowY + 8).toBeLessThan(buttonTopY);
    });

    it('lowest legend row clears the START button top on 400-px canvas too', () => {
      const canvasHeight = 400;
      const buttonTopY = canvasHeight * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const lastRowY = canvasHeight * LEGEND_LABEL_Y_RATIO;
      expect(lastRowY + 8).toBeLessThan(buttonTopY);
    });

    it('no ratio lands inside the START button band at 450 px', () => {
      const height = 450;
      const buttonTopY = height * START_BUTTON_Y_RATIO - START_BUTTON_HEIGHT_PX / 2;
      const buttonBottomY = height * START_BUTTON_Y_RATIO + START_BUTTON_HEIGHT_PX / 2;
      for (const r of [
        HOW_TO_PLAY_Y_RATIO,
        CONTROLS_LINE_1_Y_RATIO,
        CONTROLS_LINE_2_Y_RATIO,
        CONTROLS_LINE_3_Y_RATIO,
        LEGEND_HEADING_Y_RATIO,
        LEGEND_ICON_Y_RATIO,
        LEGEND_LABEL_Y_RATIO,
      ]) {
        const y = r * height;
        expect(y < buttonTopY || y > buttonBottomY).toBe(true);
      }
    });
  });

  describe('create() wiring', () => {
    it('renders HOW TO PLAY heading + 3 controls lines + POWER-UPS heading (5 text calls before the legend)', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      // First 5 createMatrixText calls are: HOW TO PLAY, line 1, line 2,
      // line 3, POWER-UPS heading. Then 1 label per legend entry.
      expect(createMatrixText).toHaveBeenCalledTimes(5 + POWERUP_LEGEND.ENTRIES.length);
    });

    it('first 5 createMatrixText calls land on the exported control-band ratios', () => {
      const height = 450;
      const { scene, createMatrixText } = createTestMenu(800, height);
      scene.create();
      const expectedRatios = [
        HOW_TO_PLAY_Y_RATIO,
        CONTROLS_LINE_1_Y_RATIO,
        CONTROLS_LINE_2_Y_RATIO,
        CONTROLS_LINE_3_Y_RATIO,
        LEGEND_HEADING_Y_RATIO,
      ];
      for (let i = 0; i < expectedRatios.length; i++) {
        const callArgs = createMatrixText.mock.calls[i];
        expect(callArgs[1]).toBeCloseTo(height * expectedRatios[i], 6);
      }
    });

    it('renders one icon per POWERUP_LEGEND entry at LEGEND_ICON_Y_RATIO', () => {
      const height = 450;
      const { scene, imageSpy } = createTestMenu(800, height);
      scene.create();
      expect(imageSpy).toHaveBeenCalledTimes(POWERUP_LEGEND.ENTRIES.length);
      for (const imageCall of imageSpy.mock.calls) {
        expect(imageCall[1]).toBeCloseTo(height * LEGEND_ICON_Y_RATIO, 6);
      }
    });

    it('icon texture keys match the POWERUP_LEGEND.ENTRIES type field', () => {
      const { scene, imageSpy } = createTestMenu();
      scene.create();
      const keys = imageSpy.mock.calls.map((c: unknown[]) => c[2]);
      const expected = POWERUP_LEGEND.ENTRIES.map((e) => `powerup_${e.type}`);
      expect(keys).toEqual(expected);
    });

    it('icon display size honours LEGEND_ICON_SIZE', () => {
      const { scene, imageSpy } = createTestMenu();
      scene.create();
      const iconResult = imageSpy.mock.results[0].value as {
        setDisplaySize: ReturnType<typeof vi.fn>;
      };
      expect(iconResult.setDisplaySize).toHaveBeenCalledWith(LEGEND_ICON_SIZE, LEGEND_ICON_SIZE);
    });

    it('one label per entry lands at LEGEND_LABEL_Y_RATIO with the entry name text', () => {
      const height = 450;
      const { scene, createMatrixText } = createTestMenu(800, height);
      scene.create();
      // Legend labels are the last N createMatrixText calls.
      const labelCalls = createMatrixText.mock.calls.slice(-POWERUP_LEGEND.ENTRIES.length);
      POWERUP_LEGEND.ENTRIES.forEach((entry, i) => {
        const args = labelCalls[i];
        expect(args[1]).toBeCloseTo(height * LEGEND_LABEL_Y_RATIO, 6);
        expect(args[2]).toBe(entry.name);
      });
    });

    it('label colour matches POWERUP_DEFS colour (hex) — visual parity with pickup overlay', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      const labelCalls = createMatrixText.mock.calls.slice(-POWERUP_LEGEND.ENTRIES.length);
      POWERUP_LEGEND.ENTRIES.forEach((entry, i) => {
        const args = labelCalls[i];
        const expectedHex = `#${POWERUP_DEFS[entry.type].color.toString(16).padStart(6, '0')}`;
        // createMatrixText signature: (x, y, text, size, colour?)
        expect(args[4]).toBe(expectedHex);
      });
    });

    it('icon columns are symmetric around the canvas centre', () => {
      const width = 800;
      const { scene, imageSpy } = createTestMenu(width, 450);
      scene.create();
      const xs = imageSpy.mock.calls.map((c: unknown[]) => c[0] as number);
      // Symmetry check: first x + last x ≈ width.
      expect(xs[0] + xs[xs.length - 1]).toBeCloseTo(width, 6);
    });

    it('icon columns are monotonic left-to-right', () => {
      const { scene, imageSpy } = createTestMenu();
      scene.create();
      const xs = imageSpy.mock.calls.map((c: unknown[]) => c[0] as number);
      for (let i = 1; i < xs.length; i++) {
        expect(xs[i]).toBeGreaterThan(xs[i - 1]);
      }
    });

    it('renders the three expected controls strings in order', () => {
      const { scene, createMatrixText } = createTestMenu();
      scene.create();
      const texts = createMatrixText.mock.calls.slice(0, 5).map((c: unknown[]) => c[2]);
      expect(texts).toEqual([
        'HOW TO PLAY',
        'Arrow keys / Mouse: Move paddle',
        'Destroy bricks to charge BULLET TIME',
        'B: Activate (when READY) | P: Pause',
        'POWER-UPS',
      ]);
    });

    it('layout scales with canvas height — ratios honoured, not hard-coded', () => {
      const { scene: sceneTall, createMatrixText: textTall } = createTestMenu(800, 600);
      sceneTall.create();
      const tallY = textTall.mock.calls[0][1] as number;

      const { scene: sceneShort, createMatrixText: textShort } = createTestMenu(800, 400);
      sceneShort.create();
      const shortY = textShort.mock.calls[0][1] as number;

      expect(tallY).toBeCloseTo(600 * HOW_TO_PLAY_Y_RATIO, 6);
      expect(shortY).toBeCloseTo(400 * HOW_TO_PLAY_Y_RATIO, 6);
      expect(tallY).toBeGreaterThan(shortY);
    });
  });
});
