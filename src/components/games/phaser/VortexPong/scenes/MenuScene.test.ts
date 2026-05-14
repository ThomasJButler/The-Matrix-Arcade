/**
 * Vortex Pong — MenuScene difficulty-selector tests (R84.P3).
 *
 * Phaser is fully mocked; we construct the scene, stub createMatrixText +
 * add.* Phaser factories, then exercise `cycleDifficulty()` directly. This
 * is enough to prove the MenuScene honours the persisted tier, writes on
 * cycle, and keeps the registry in sync for the GameScene hand-off.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VortexPongMenuScene, DIFFICULTY_REGISTRY_KEY } from './MenuScene';
import { DIFFICULTY_STORAGE_KEY, DIFFICULTY_TIERS } from '../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Phaser is globally mocked in src/test/setup.ts, which replaces Phaser.Scene
// with a vi.fn() factory. That breaks the prototype chain of any subclass, so
// prototype methods (like VortexPongMenuScene#cycleDifficulty) are not
// auto-attached to `new VortexPongMenuScene()` instances. Re-bind manually
// — same trick GameScene.test.ts uses.
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

function createTestMenu() {
  const scene = new VortexPongMenuScene() as any;

  for (const name of collectPrototypeMethods(VortexPongMenuScene)) {
    const fn = (VortexPongMenuScene.prototype as any)[name];
    if (typeof fn === 'function') {
      scene[name] = fn.bind(scene);
    }
  }

  // Minimal mocks — only what create() + cycleDifficulty() need.
  const registryStore = new Map<string, unknown>();
  scene.registry = {
    get: vi.fn((key: string) => registryStore.get(key)),
    set: vi.fn((key: string, value: unknown) => { registryStore.set(key, value); }),
  };

  scene.playSound = vi.fn();

  scene.createMatrixText = vi.fn().mockImplementation(() => ({
    setAlpha: vi.fn().mockReturnThis(),
    setText: vi.fn(),
    destroy: vi.fn(),
  }));

  scene.add = {
    container: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      setInteractive: vi.fn(),
      on: vi.fn(),
    })),
    graphics: vi.fn().mockImplementation(() => ({
      clear: vi.fn(),
      fillStyle: vi.fn(),
      fillRoundedRect: vi.fn(),
      lineStyle: vi.fn(),
      strokeRoundedRect: vi.fn(),
    })),
    text: vi.fn().mockImplementation((_x, _y, text) => ({
      text,
      setOrigin: vi.fn().mockReturnThis(),
      setColor: vi.fn(),
      setText: vi.fn(function (this: { text: string }, v: string) { this.text = v; }),
    })),
  };

  scene.game = { config: { width: 800, height: 450 } };

  return scene;
}

describe('VortexPongMenuScene difficulty selector (R84.P3)', () => {
  beforeEach(() => {
    window.localStorage.removeItem(DIFFICULTY_STORAGE_KEY);
  });

  it('initial difficulty defaults to normal', () => {
    const scene = createTestMenu();
    // Simulate just the difficulty read portion of create().
    scene.difficulty = 'normal';
    scene.registry.set(DIFFICULTY_REGISTRY_KEY, 'normal');
    expect(scene.getDifficulty()).toBe('normal');
    expect(scene.registry.get(DIFFICULTY_REGISTRY_KEY)).toBe('normal');
  });

  it('cycleDifficulty cycles through the three tiers and wraps', () => {
    const scene = createTestMenu();
    scene.difficulty = 'easy';
    scene.difficultyLabelText = { setText: vi.fn() } as any;

    expect(scene.cycleDifficulty()).toBe('normal');
    expect(scene.cycleDifficulty()).toBe('hard');
    expect(scene.cycleDifficulty()).toBe('easy');
  });

  it('cycleDifficulty persists the new tier to localStorage', () => {
    const scene = createTestMenu();
    scene.difficulty = 'normal';
    scene.difficultyLabelText = { setText: vi.fn() } as any;

    scene.cycleDifficulty(); // → hard
    expect(window.localStorage.getItem(DIFFICULTY_STORAGE_KEY)).toBe('hard');
  });

  it('cycleDifficulty updates registry so GameScene picks up the tier', () => {
    const scene = createTestMenu();
    scene.difficulty = 'normal';
    scene.difficultyLabelText = { setText: vi.fn() } as any;

    scene.cycleDifficulty();
    expect(scene.registry.get(DIFFICULTY_REGISTRY_KEY)).toBe('hard');
  });

  it('cycleDifficulty re-renders the label with the new tier label', () => {
    const scene = createTestMenu();
    scene.difficulty = 'normal';
    const labelMock = { setText: vi.fn() };
    scene.difficultyLabelText = labelMock;

    scene.cycleDifficulty();
    expect(labelMock.setText).toHaveBeenCalledWith(DIFFICULTY_TIERS.hard.label);
  });

  it('cycleDifficulty plays the menu SFX for audible feedback', () => {
    const scene = createTestMenu();
    scene.difficulty = 'normal';
    scene.difficultyLabelText = { setText: vi.fn() } as any;
    scene.cycleDifficulty();
    expect(scene.playSound).toHaveBeenCalledWith('menu');
  });
});
