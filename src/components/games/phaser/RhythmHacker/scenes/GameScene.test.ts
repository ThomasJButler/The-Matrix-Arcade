/**
 * RhythmHackerGameScene — Unit Tests
 *
 * Phaser is fully mocked (jsdom cannot do WebGL).
 * We instantiate the scene, override BaseScene helpers with mocks,
 * set internal state directly, and call private methods via (scene as any).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RhythmHackerGameScene } from './GameScene';
import { GAME_CONFIG, NOTE_PROBABILITIES, ACHIEVEMENTS } from '../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a scene instance with all BaseScene / Phaser hooks stubbed out.
 *
 * The Phaser.Scene mock returns a plain object from its constructor, which
 * means class prototype methods are not automatically present on the
 * instance. We therefore copy them from the real prototype so that methods
 * like processHit, calculateScore, etc. can be called in tests.
 */
function createTestScene(trackIndex = 0) {
  const scene = new RhythmHackerGameScene() as any;

  // Copy prototype methods onto the mock instance
  const proto = RhythmHackerGameScene.prototype as any;
  Object.getOwnPropertyNames(proto).forEach((name) => {
    if (name !== 'constructor' && typeof proto[name] === 'function') {
      scene[name] = proto[name].bind(scene);
    }
  });

  // Set track parameters (mirrors what init() does)
  const track = GAME_CONFIG.TRACKS[trackIndex];
  scene.trackIndex = trackIndex;
  scene.trackDuration = track.duration;
  scene.trackBpm = track.bpm;
  scene.difficulty = track.difficulty;
  scene.beatInterval = 60000 / track.bpm;

  // BaseScene helpers
  scene.playSound = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();

  // UI text / graphics objects
  scene.scoreText = { setText: vi.fn() };
  scene.comboText = { setText: vi.fn(), setVisible: vi.fn(), setAlpha: vi.fn(), setScale: vi.fn() };
  scene.healthBar = { clear: vi.fn(), fillStyle: vi.fn(), fillRect: vi.fn() };
  scene.gradeText = { setText: vi.fn(), setColor: vi.fn(), setAlpha: vi.fn(), setScale: vi.fn() };
  scene.timeText = { setText: vi.fn() };

  // Tweens and add (used by showGrade and createHitEffect)
  scene.tweens = { add: vi.fn() };
  scene.add = {
    text: vi.fn().mockReturnValue({
      setOrigin: vi.fn(),
      setDepth: vi.fn(),
      destroy: vi.fn(),
    }),
    image: vi.fn().mockReturnValue({
      setScale: vi.fn(),
      setDepth: vi.fn(),
      destroy: vi.fn(),
    }),
    graphics: vi.fn().mockReturnValue({
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
    }),
  };

  // Input stubs (four lanes: Q, W, O, P)
  scene.laneKeys = [
    { isDown: false },
    { isDown: false },
    { isDown: false },
    { isDown: false },
  ];
  scene.keyHeld = [false, false, false, false];
  scene.keyIndicators = [
    { setTexture: vi.fn() },
    { setTexture: vi.fn() },
    { setTexture: vi.fn() },
    { setTexture: vi.fn() },
  ];

  // Notes
  scene.activeNotes = [];

  return scene;
}

/** Create a mock note matching the Note interface shape. */
function createMockNote(lane = 0, overrides: Record<string, any> = {}) {
  return {
    lane,
    noteType: 'normal' as const,
    hitTime: 0,
    isHit: false,
    isHeld: false,
    holdDuration: undefined,
    holdProgress: undefined,
    pairedNote: undefined,
    x: 100,
    y: GAME_CONFIG.NOTES.HIT_LINE_Y, // exactly on the hit line by default
    setDepth: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RhythmHackerGameScene', () => {
  let scene: any;

  beforeEach(() => {
    scene = createTestScene();
  });

  // -----------------------------------------------------------------------
  // Initial State
  // -----------------------------------------------------------------------
  describe('Initial State', () => {
    it('score starts at 0', () => {
      expect(scene.score).toBe(0);
    });

    it('combo starts at 0', () => {
      expect(scene.combo).toBe(0);
    });

    it('health starts at 100', () => {
      expect(scene.health).toBe(GAME_CONFIG.HEALTH.MAX);
    });

    it('missCount starts at 0', () => {
      expect(scene.missCount).toBe(0);
    });

    it('isCountdown starts true', () => {
      expect(scene.isCountdown).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Track Initialisation
  // -----------------------------------------------------------------------
  describe('Track Initialisation', () => {
    it('easy track: 100 BPM, 60s duration, beatInterval 600ms', () => {
      const s = createTestScene(0);
      expect(s.trackBpm).toBe(100);
      expect(s.trackDuration).toBe(60);
      expect(s.beatInterval).toBe(600);
      expect(s.difficulty).toBe('easy');
    });

    it('normal track: 120 BPM, 90s duration, beatInterval 500ms', () => {
      const s = createTestScene(1);
      expect(s.trackBpm).toBe(120);
      expect(s.trackDuration).toBe(90);
      expect(s.beatInterval).toBe(500);
      expect(s.difficulty).toBe('normal');
    });

    it('hard track: 140 BPM, 120s duration', () => {
      const s = createTestScene(2);
      expect(s.trackBpm).toBe(140);
      expect(s.trackDuration).toBe(120);
      expect(s.beatInterval).toBeCloseTo(60000 / 140, 1);
      expect(s.difficulty).toBe('hard');
    });

    it('insane track: 180 BPM, 150s duration', () => {
      const s = createTestScene(3);
      expect(s.trackBpm).toBe(180);
      expect(s.trackDuration).toBe(150);
      expect(s.beatInterval).toBeCloseTo(60000 / 180, 1);
      expect(s.difficulty).toBe('insane');
    });

    it('defaults to trackIndex 0 when not specified', () => {
      const s = createTestScene();
      expect(s.trackIndex).toBe(0);
      expect(s.difficulty).toBe('easy');
    });
  });

  // -----------------------------------------------------------------------
  // Timing Windows (config values)
  // -----------------------------------------------------------------------
  describe('Timing Windows', () => {
    it('PERFECT window is 40ms', () => {
      expect(GAME_CONFIG.TIMING.PERFECT).toBe(40);
    });

    it('GREAT window is 80ms', () => {
      expect(GAME_CONFIG.TIMING.GREAT).toBe(80);
    });

    it('GOOD window is 120ms', () => {
      expect(GAME_CONFIG.TIMING.GOOD).toBe(120);
    });
  });

  // -----------------------------------------------------------------------
  // Scoring
  // -----------------------------------------------------------------------
  describe('Scoring', () => {
    it('perfect awards 300 base points', () => {
      const note = createMockNote();
      scene.processHit(note, 'perfect');
      expect(scene.score).toBe(300);
    });

    it('great awards 200 base points', () => {
      const note = createMockNote();
      scene.processHit(note, 'great');
      expect(scene.score).toBe(200);
    });

    it('good awards 100 base points', () => {
      const note = createMockNote();
      scene.processHit(note, 'good');
      expect(scene.score).toBe(100);
    });

    it('miss awards 0 points', () => {
      const note = createMockNote();
      scene.processHit(note, 'miss');
      expect(scene.score).toBe(0);
    });

    it('combo multiplier is 1.0x at combo 0-9', () => {
      scene.combo = 5;
      expect(scene.calculateScore(300)).toBe(300);
    });

    it('combo multiplier is 1.1x at combo 10-19', () => {
      scene.combo = 10;
      expect(scene.calculateScore(300)).toBe(Math.floor(300 * 1.1));
    });

    it('combo multiplier is 1.2x at combo 20-29', () => {
      scene.combo = 20;
      expect(scene.calculateScore(300)).toBe(Math.floor(300 * 1.2));
    });

    it('empty hit penalty is 2 health damage', () => {
      expect(GAME_CONFIG.HEALTH.EMPTY_HIT_PENALTY).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Combo System
  // -----------------------------------------------------------------------
  describe('Combo System', () => {
    it('combo increments on a perfect hit', () => {
      scene.processHit(createMockNote(), 'perfect');
      expect(scene.combo).toBe(1);
    });

    it('combo increments on a great hit', () => {
      scene.processHit(createMockNote(), 'great');
      expect(scene.combo).toBe(1);
    });

    it('combo increments on a good hit', () => {
      scene.processHit(createMockNote(), 'good');
      expect(scene.combo).toBe(1);
    });

    it('combo resets to 0 on miss', () => {
      scene.combo = 15;
      scene.processHit(createMockNote(), 'miss');
      expect(scene.combo).toBe(0);
    });

    it('maxCombo tracks the highest combo reached', () => {
      // Build combo to 3
      for (let i = 0; i < 3; i++) {
        scene.processHit(createMockNote(), 'perfect');
      }
      expect(scene.maxCombo).toBe(3);

      // Miss resets combo, but maxCombo stays at 3
      scene.processHit(createMockNote(), 'miss');
      expect(scene.combo).toBe(0);
      expect(scene.maxCombo).toBe(3);
    });

    it('multiplier formula: 1 + floor(combo/10) * 0.1', () => {
      scene.combo = 35;
      // 1 + floor(35/10) * 0.1 = 1 + 3 * 0.1 = 1.3
      expect(scene.calculateScore(100)).toBe(Math.floor(100 * 1.3));
    });
  });

  // -----------------------------------------------------------------------
  // Health System
  // -----------------------------------------------------------------------
  describe('Health System', () => {
    it('starts at 100', () => {
      expect(scene.health).toBe(100);
    });

    it('miss deals 10 damage', () => {
      scene.processHit(createMockNote(), 'miss');
      expect(scene.health).toBe(100 - GAME_CONFIG.HEALTH.MISS_DAMAGE);
    });

    it('empty hit deals 2 damage via onKeyDown with no active note', () => {
      scene.isCountdown = false;
      scene.onKeyDown(0);
      expect(scene.health).toBe(100 - GAME_CONFIG.HEALTH.EMPTY_HIT_PENALTY);
    });

    it('perfect heals 5', () => {
      scene.health = 80;
      scene.processHit(createMockNote(), 'perfect');
      expect(scene.health).toBe(85);
    });

    it('great heals 2', () => {
      scene.health = 80;
      scene.processHit(createMockNote(), 'great');
      expect(scene.health).toBe(82);
    });

    it('good heals 1', () => {
      scene.health = 80;
      scene.processHit(createMockNote(), 'good');
      expect(scene.health).toBe(81);
    });

    it('health is clamped at 100 max', () => {
      scene.health = 98;
      scene.processHit(createMockNote(), 'perfect'); // +5 would be 103
      expect(scene.health).toBe(GAME_CONFIG.HEALTH.MAX);
    });

    it('game over triggers when health reaches 0', () => {
      scene.health = 10;
      scene.processHit(createMockNote(), 'miss'); // -10 -> 0
      expect(scene.gameOver).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Achievement Conditions
  // -----------------------------------------------------------------------
  describe('Achievement Conditions', () => {
    it('unlocks FIRST_PERFECT on the first perfect hit', () => {
      scene.processHit(createMockNote(), 'perfect');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_PERFECT);
    });

    it('unlocks COMBO_50 when combo reaches 50', () => {
      scene.combo = 49;
      scene.processHit(createMockNote(), 'perfect');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_50);
    });

    it('unlocks COMBO_100 when combo reaches 100', () => {
      scene.combo = 99;
      scene.processHit(createMockNote(), 'perfect');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_100);
    });

    it('unlocks COMPLETE_EASY on easy track completion', () => {
      const s = createTestScene(0);
      s.missCount = 1;
      s.trackComplete();
      expect(s.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMPLETE_EASY);
    });

    it('unlocks COMPLETE_NORMAL on normal track completion', () => {
      const s = createTestScene(1);
      s.missCount = 1;
      s.trackComplete();
      expect(s.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMPLETE_NORMAL);
    });

    it('unlocks COMPLETE_HARD on hard track completion', () => {
      const s = createTestScene(2);
      s.missCount = 1;
      s.trackComplete();
      expect(s.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMPLETE_HARD);
    });

    it('unlocks COMPLETE_INSANE on insane track completion', () => {
      const s = createTestScene(3);
      s.missCount = 1;
      s.trackComplete();
      expect(s.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMPLETE_INSANE);
    });

    it('unlocks NO_MISS and FULL_COMBO when missCount is 0 at track end', () => {
      scene.missCount = 0;
      scene.trackComplete();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.NO_MISS);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FULL_COMBO);
    });

    it('does NOT unlock NO_MISS when there have been misses', () => {
      scene.missCount = 3;
      scene.trackComplete();
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.NO_MISS);
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.FULL_COMBO);
    });
  });

  // -----------------------------------------------------------------------
  // Note Probabilities (config values)
  // -----------------------------------------------------------------------
  describe('Note Probabilities', () => {
    it('easy is 100% normal', () => {
      expect(NOTE_PROBABILITIES.easy.normal).toBe(1.0);
      expect(NOTE_PROBABILITIES.easy.hold).toBe(0.0);
      expect(NOTE_PROBABILITIES.easy.double).toBe(0.0);
    });

    it('normal has 10% hold notes', () => {
      expect(NOTE_PROBABILITIES.normal.hold).toBe(0.1);
      expect(NOTE_PROBABILITIES.normal.double).toBe(0.0);
    });

    it('hard has 15% hold and 10% double', () => {
      expect(NOTE_PROBABILITIES.hard.hold).toBe(0.15);
      expect(NOTE_PROBABILITIES.hard.double).toBe(0.1);
    });

    it('insane has 25% hold and 15% double', () => {
      expect(NOTE_PROBABILITIES.insane.hold).toBe(0.25);
      expect(NOTE_PROBABILITIES.insane.double).toBe(0.15);
    });
  });

  // -----------------------------------------------------------------------
  // Countdown
  // -----------------------------------------------------------------------
  describe('Countdown', () => {
    it('starts in countdown mode', () => {
      expect(scene.isCountdown).toBe(true);
    });

    it('countdown duration is 5000ms', () => {
      expect(GAME_CONFIG.COUNTDOWN.DURATION).toBe(5000);
    });
  });
});
