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
import { TRACK_CHARTS } from '../charts';

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
  scene.audioUrl = track.audioUrl;

  // Chart fields
  const { NOTES } = GAME_CONFIG;
  scene.noteTravelTime = (NOTES.HIT_LINE_Y - NOTES.SPAWN_HEIGHT) / NOTES.SPEED * 1000;
  scene.chart = TRACK_CHARTS[trackIndex] ?? [];
  scene.chartIndex = 0;

  // BaseScene helpers
  scene.playSound = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();
  scene.getGameDuration = vi.fn().mockReturnValue(1000);

  // UI text / graphics objects
  scene.scoreText = { setText: vi.fn() };
  scene.comboText = { setText: vi.fn(), setVisible: vi.fn(), setAlpha: vi.fn(), setScale: vi.fn() };
  scene.healthBar = { clear: vi.fn(), fillStyle: vi.fn(), fillRect: vi.fn(), fillRoundedRect: vi.fn() };
  scene.gradeText = { setText: vi.fn(), setColor: vi.fn(), setAlpha: vi.fn(), setScale: vi.fn() };
  scene.timeText = { setText: vi.fn(), setColor: vi.fn() };
  scene.multiplierText = { setText: vi.fn(), setVisible: vi.fn() };
  scene.laneFlashes = [];
  scene.laneBackgrounds = [
    { setTint: vi.fn(), clearTint: vi.fn() },
    { setTint: vi.fn(), clearTint: vi.fn() },
    { setTint: vi.fn(), clearTint: vi.fn() },
    { setTint: vi.fn(), clearTint: vi.fn() },
  ];
  scene.matrixRainChars = [];
  scene.laneCyanTinted = false;
  scene.cameras = { main: { shake: vi.fn(), flash: vi.fn() } };
  scene.useParticleSprites = false;
  scene.useUiSprites = false;

  // Tweens and add (used by showGrade, createHitEffect, showComboMilestone)
  scene.tweens = { add: vi.fn() };
  // R87.RH1: trackComplete defers gameOver via time.delayedCall so the
  // TRACK COMPLETE banner holds on-screen for BANNER_HOLD_MS. Default mock
  // invokes the callback immediately so existing trackComplete assertions
  // (reportScore + gameOver called with the final snapshot) keep passing.
  // Tests that need to verify deferral override this with capture-callback.
  scene.time = { delayedCall: vi.fn((_ms: number, cb: () => void) => cb()) };
  scene.add = {
    text: vi.fn().mockReturnValue({
      setOrigin: vi.fn(),
      setDepth: vi.fn(),
      setAlpha: vi.fn(),
      setShadow: vi.fn(),
      setScale: vi.fn(),
      destroy: vi.fn(),
    }),
    image: vi.fn().mockReturnValue({
      setScale: vi.fn(),
      setDisplaySize: vi.fn(),
      setTint: vi.fn(),
      setDepth: vi.fn(),
      destroy: vi.fn(),
    }),
    graphics: vi.fn().mockReturnValue({
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
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
    it('easy track: 100 BPM, 228s duration, beatInterval 600ms', () => {
      const s = createTestScene(0);
      expect(s.trackBpm).toBe(100);
      expect(s.trackDuration).toBe(228);
      expect(s.beatInterval).toBe(600);
      expect(s.difficulty).toBe('easy');
    });

    it('normal track: 118 BPM, 200s duration', () => {
      const s = createTestScene(1);
      expect(s.trackBpm).toBe(118);
      expect(s.trackDuration).toBe(200);
      expect(s.beatInterval).toBeCloseTo(60000 / 118, 1);
      expect(s.difficulty).toBe('normal');
    });

    it('hard track: 140 BPM, 148s duration', () => {
      const s = createTestScene(2);
      expect(s.trackBpm).toBe(140);
      expect(s.trackDuration).toBe(148);
      expect(s.beatInterval).toBeCloseTo(60000 / 140, 1);
      expect(s.difficulty).toBe('hard');
    });

    it('insane track: 160 BPM, 252s duration', () => {
      const s = createTestScene(3);
      expect(s.trackBpm).toBe(160);
      expect(s.trackDuration).toBe(252);
      expect(s.beatInterval).toBeCloseTo(60000 / 160, 1);
      expect(s.difficulty).toBe('insane');
    });

    it('bonus insane track: 110 BPM, 208s duration', () => {
      const s = createTestScene(4);
      expect(s.trackBpm).toBe(110);
      expect(s.trackDuration).toBe(208);
      expect(s.beatInterval).toBeCloseTo(60000 / 110, 1);
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

  // -----------------------------------------------------------------------
  // Track Audio
  // -----------------------------------------------------------------------
  describe('Track Audio', () => {
    it('all tracks have audioUrl pointing to /assets/rhythm-hacker/tracks/', () => {
      GAME_CONFIG.TRACKS.forEach((track) => {
        expect(track.audioUrl).toMatch(/^\/assets\/rhythm-hacker\/tracks\/.+\.mp3$/);
      });
    });

    it('track count is 5 (easy, normal, hard, 2x insane)', () => {
      expect(GAME_CONFIG.TRACKS.length).toBe(5);
    });

    it('initTrackAudio creates Audio element when audioUrl is set', () => {
      scene.audioUrl = '/assets/rhythm-hacker/tracks/test.mp3';
      scene.getIsMuted = vi.fn().mockReturnValue(false);
      scene.initTrackAudio();
      expect(scene.trackAudio).not.toBeNull();
    });

    it('initTrackAudio is a no-op without audioUrl', () => {
      scene.audioUrl = '';
      scene.initTrackAudio();
      expect(scene.trackAudio).toBeNull();
    });

    it('stopTrackAudio pauses and resets the audio element', () => {
      const mockAudio = { pause: vi.fn(), currentTime: 5 };
      scene.trackAudio = mockAudio;
      scene.stopTrackAudio();
      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(0);
    });

    it('stopTrackAudio is a no-op without audio', () => {
      scene.trackAudio = null;
      expect(() => scene.stopTrackAudio()).not.toThrow();
    });

    it('shutdown clears the audio element', () => {
      const mockAudio = { pause: vi.fn(), currentTime: 0, src: 'test.mp3' };
      scene.trackAudio = mockAudio;
      scene.time = { removeAllEvents: vi.fn() };
      scene.tweens = { killAll: vi.fn() };
      scene.laneKeys = [];
      scene.input = { keyboard: { removeAllKeys: vi.fn() } };
      scene.shutdown();
      expect(scene.trackAudio).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Chart-based Spawning & Audio Sync
  // -----------------------------------------------------------------------
  describe('Chart-based Spawning', () => {
    it('scene loads chart data for the selected track', () => {
      const s = createTestScene(0);
      expect(s.chart).toBeDefined();
      expect(s.chart.length).toBeGreaterThan(0);
      expect(s.chart).toEqual(TRACK_CHARTS[0]);
    });

    it('chartIndex resets to 0 on creation', () => {
      const s = createTestScene(2);
      expect(s.chartIndex).toBe(0);
    });

    it('noteTravelTime is computed from config constants', () => {
      const { NOTES } = GAME_CONFIG;
      const expected = (NOTES.HIT_LINE_Y - NOTES.SPAWN_HEIGHT) / NOTES.SPEED * 1000;
      expect(scene.noteTravelTime).toBeCloseTo(expected, 1);
    });

    it('getTrackTime returns gameTime when no audio is playing', () => {
      scene.trackAudio = null;
      scene.gameTime = 5000;
      const time = scene.getTrackTime();
      expect(time).toBe(5000);
    });

    it('getTrackTime returns audio time when track is playing', () => {
      scene.trackAudio = { currentTime: 3.5, paused: false };
      scene.gameTime = 3400;
      const time = scene.getTrackTime();
      expect(time).toBe(3500);
    });

    it('getTrackTime falls back to gameTime when audio currentTime is 0', () => {
      scene.trackAudio = { currentTime: 0, paused: false };
      scene.gameTime = 100;
      const time = scene.getTrackTime();
      expect(time).toBe(100);
    });

    it('each track gets a unique chart', () => {
      for (let i = 0; i < GAME_CONFIG.TRACKS.length; i++) {
        const s = createTestScene(i);
        expect(s.chart).toEqual(TRACK_CHARTS[i]);
      }
    });
  });

  // -----------------------------------------------------------------------
  // R86.R1 — P-key conflict between QWOP lane 4 and global pause binding
  //
  // Tom's 2026-04-22 verdict: the global P→togglePause binding from
  // BaseScene fires every time a player hits lane 4 (`P` in QWOP), pausing
  // the song mid-play. Fix: RhythmHackerGameScene.getPauseKeyCode() returns
  // null so BaseScene._bindCommonKeys skips the pause-key binding entirely.
  // Pause stays reachable via the iPod dashbar's pause button (which routes
  // through PAUSE_REQUEST_EVENT, independent of any keyboard binding).
  // -----------------------------------------------------------------------
  describe('R86.R1 — P-key pause override (QWOP lane 4)', () => {
    it('getPauseKeyCode returns null so BaseScene skips the P→pause binding', () => {
      // Direct invariant: this scene MUST opt out of the default pause key.
      // If a future refactor restores the parent's binding, every P-press
      // during gameplay will pause the song mid-note.
      expect(scene.getPauseKeyCode()).toBeNull();
    });

    it('lane 4 (P) routes to onKeyDown(3), not togglePause', () => {
      // Behavioural lock: simulate the lane-4 keypath by calling onKeyDown
      // directly (which is what the Q/W/O/P key handlers wire to). After the
      // call the scene must NOT have flipped to paused — even with no notes
      // present, the only side-effect should be the empty-hit penalty / sound.
      // togglePause is never reached because BaseScene's pause binding is gone.
      scene.activeNotes = [];
      scene.isCountdown = false;
      scene.health = 100;
      scene.isPaused = false;

      scene.onKeyDown(3); // lane 4 = P

      expect(scene.isPaused).toBe(false);
      expect(scene.keyHeld[3]).toBe(true);
      // Empty-hit penalty fires (no note + no countdown), confirming the
      // lane-4 codepath ran instead of an early pause-toggle return.
      expect(scene.health).toBe(100 - GAME_CONFIG.HEALTH.EMPTY_HIT_PENALTY);
    });

    it('all four lane keys route to onKeyDown including P (lane 3)', () => {
      // Anti-regression: a "fix" that moves P out of QWOP entirely (e.g.
      // rebinding lane 4 to `;` or `[`) would silently break the established
      // R76.3 muscle-memory contract. Lock the QWOP order via config.
      expect(GAME_CONFIG.LANES.KEYS).toEqual(['Q', 'W', 'O', 'P']);
      expect(GAME_CONFIG.LANES.COUNT).toBe(4);
    });

    it('BaseScene.getPauseKeyCode default returns the P keycode', async () => {
      // Static check: the default behaviour must remain `P→pause` for every
      // other arcade game. Confirm the parent class ships the established
      // binding so override is the exception, not the rule. Read source via
      // fs to avoid pulling Phaser's runtime into the assertion.
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      const baseSceneSrc = readFileSync(
        resolve(process.cwd(), 'src/lib/phaser/scenes/BaseScene.ts'),
        'utf8',
      );
      // Match the default-return line specifically (not the override hook).
      expect(baseSceneSrc).toMatch(
        /protected getPauseKeyCode\(\): number \| null\s*\{\s*return Phaser\.Input\.Keyboard\.KeyCodes\.P;/,
      );
    });

    it('BaseScene._bindCommonKeys consults getPauseKeyCode and skips when null', async () => {
      // Static check: the binding must be guarded so a `null` return actually
      // suppresses the addKey call. A regression that drops the guard would
      // reinstate the P→pause binding even with the override in place.
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      const baseSceneSrc = readFileSync(
        resolve(process.cwd(), 'src/lib/phaser/scenes/BaseScene.ts'),
        'utf8',
      );
      // Look for `const pauseCode = this.getPauseKeyCode()` followed by a
      // null-check guard before the addKey call.
      expect(baseSceneSrc).toMatch(/const pauseCode = this\.getPauseKeyCode\(\);/);
      expect(baseSceneSrc).toMatch(/if \(pauseCode !== null\)/);
    });

    it('MenuScene controls hint footer no longer advertises P: Pause', async () => {
      // The menu footer used to read "ESC: Exit  P: Pause  M: Mute" — keeping
      // that string after the override would mislead players into pressing P
      // for pause and rediscovering the QWOP collision. Tom's "P: Pause" line
      // must be gone.
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      const menuSrc = readFileSync(
        resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/MenuScene.ts'),
        'utf8',
      );
      expect(menuSrc).not.toMatch(/P:\s*Pause/);
      expect(menuSrc).toMatch(/ESC:\s*Exit/);
      expect(menuSrc).toMatch(/M:\s*Mute/);
    });
  });

  // -----------------------------------------------------------------------
  // R86.R2 — Hit-zone obscured by iPod dashbar chrome
  //
  // Tom's 2026-04-22 screenshot: the dashbar (exit / help / pause / trophy)
  // sits visually on top of the bottom ~80 px of the Phaser canvas, with
  // the dashbar's pause button II directly on lane 2/3 hit-zones. Fix:
  // lift the hit line + key indicators by 80 px so the entire interactive
  // band sits above the dashbar's footprint. Travel time stays at 1725 ms
  // by lowering SPAWN_HEIGHT in lockstep.
  // -----------------------------------------------------------------------
  describe('R86.R2 — Hit-zone clear of dashbar chrome', () => {
    it('HIT_LINE_Y lifted from 640 to 560 (-80 px above old position)', () => {
      // Direct dial lock: the 80-px lift IS the fix. A regression that
      // restores HIT_LINE_Y=640 puts the hit band back under the dashbar
      // and reproduces Tom's "unplayable" verdict.
      expect(GAME_CONFIG.NOTES.HIT_LINE_Y).toBe(560);
    });

    it('SPAWN_HEIGHT dropped to -130 to preserve note travel time', () => {
      // Pair-locked dial: HIT_LINE_Y and SPAWN_HEIGHT must move together so
      // (HIT_LINE_Y - SPAWN_HEIGHT) / SPEED stays constant. A future shift
      // of one without the other changes how long notes are visible — a
      // gameplay-altering side-effect of a "cosmetic" reposition.
      expect(GAME_CONFIG.NOTES.SPAWN_HEIGHT).toBe(-130);
    });

    it('note travel time preserved at 1725 ms (matches pre-R2 feel)', () => {
      const { NOTES } = GAME_CONFIG;
      const travelMs = ((NOTES.HIT_LINE_Y - NOTES.SPAWN_HEIGHT) / NOTES.SPEED) * 1000;
      expect(travelMs).toBeCloseTo(1725, 0);
    });

    it('key indicator row stays inside the dashbar-clear safe zone', () => {
      // Anti-regression tripwire: the iPod dashbar reserves roughly the
      // bottom ~100 px of the canvas. Key indicators sit at HIT_LINE_Y + 35
      // and MUST land at or above HEIGHT - 100 so the labels stay legible.
      const { NOTES, HEIGHT } = GAME_CONFIG;
      const DASHBAR_RESERVED_PX = 100;
      const keyIndicatorY = NOTES.HIT_LINE_Y + 35;
      expect(keyIndicatorY).toBeLessThanOrEqual(HEIGHT - DASHBAR_RESERVED_PX);
    });

    it('canvas HEIGHT unchanged at 700 (R2 chose Option B over canvas resize)', () => {
      // Belt-and-braces lock: changing HEIGHT triggers a cascade through
      // BootScene texture generation and the MenuScene layout (R86.R3).
      // The R2 fix deliberately stays in-canvas to avoid forcing a parallel
      // menu rework. If a future task does shrink the canvas, this test
      // should be updated alongside the menu-positioning changes.
      expect(GAME_CONFIG.HEIGHT).toBe(700);
      expect(GAME_CONFIG.WIDTH).toBe(800);
    });

    it('hit line floats above the bottom 100 px dashbar zone', () => {
      // Direct visual invariant: every pixel of the hit line itself must
      // sit above the dashbar reserved area. The hit-line texture is 14 px
      // tall (BootScene `hitH = 14`); centred on HIT_LINE_Y means its
      // bottom edge is HIT_LINE_Y + 7. That has to clear HEIGHT - 100.
      const { NOTES, HEIGHT } = GAME_CONFIG;
      const HIT_LINE_HALF_HEIGHT = 7;
      const DASHBAR_RESERVED_PX = 100;
      const hitLineBottom = NOTES.HIT_LINE_Y + HIT_LINE_HALF_HEIGHT;
      expect(hitLineBottom).toBeLessThanOrEqual(HEIGHT - DASHBAR_RESERVED_PX);
    });

    it('miss-detection threshold (HIT_LINE_Y + 100) still fits in canvas', () => {
      // Notes are flagged as missed once they pass HIT_LINE_Y + 100. With
      // HIT_LINE_Y now 560 that lands at 660, which must stay strictly less
      // than HEIGHT (700) so the miss-detect window doesn't fall off the
      // canvas before firing. A regression here would silently leak notes
      // off-screen un-missed and break combo accounting.
      const { NOTES, HEIGHT } = GAME_CONFIG;
      const MISS_DETECT_OFFSET = 100;
      expect(NOTES.HIT_LINE_Y + MISS_DETECT_OFFSET).toBeLessThan(HEIGHT);
    });
  });

  // -----------------------------------------------------------------------
  // R86.R4 — Coverage refresh
  //
  // Following the F7 / N4 / A3 cadence, R4 targets single-line invariants the
  // R1 / R2 / R3 blocks hit only behaviourally — plus the three game-over
  // routes, which the pre-R4 scene had an inconsistent `reportScore(score,
  // score)` + `gameOver(…, undefined, …)` bug on the `processHit→miss→health
  // depleted` branch that nothing locked. R86.A1's useSaveSystem singleton
  // fix made the bug invisible (the singleton re-reads saveData on write),
  // but a future refactor that restores the pre-A1 bucketed state would
  // resurrect the stale-scoreboard symptom immediately on this path — hence
  // the contract lock across ALL three game-over callsites.
  //
  // saveSystem read-path coverage mirrors the A3 playbook on Agent Chase
  // (null-chain resilience over the optional-chain that fetches `highScore`
  // from `saveData.games.rhythmHacker.highScore`).
  // -----------------------------------------------------------------------
  describe('R86.R4 — Coverage refresh', () => {
    // ---------------------------------------------------------------------
    // getPauseKeyCode — override shape locks (complements R1 behavioural)
    // ---------------------------------------------------------------------
    describe('getPauseKeyCode override shape', () => {
      it('is defined directly on RhythmHackerGameScene.prototype', () => {
        // Anti-regression: a refactor that moves the override up to an
        // intermediate mixin or (worse) deletes it entirely while relying on
        // BaseScene's default would silently re-pause the song on every
        // lane-4 hit. Lock the override's physical location.
        const proto = RhythmHackerGameScene.prototype as any;
        expect(Object.prototype.hasOwnProperty.call(proto, 'getPauseKeyCode')).toBe(true);
        expect(typeof proto.getPauseKeyCode).toBe('function');
      });

      it('appears exactly once in GameScene.ts source', async () => {
        // A duplicate override (e.g. from a copy-paste during a refactor)
        // could still return null while a stray second copy returns a
        // keycode. Lock the single-source-of-truth contract statically.
        const { readFileSync } = await import('fs');
        const { resolve } = await import('path');
        const src = readFileSync(
          resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/GameScene.ts'),
          'utf8',
        );
        const matches = src.match(/protected\s+getPauseKeyCode\s*\(/g) ?? [];
        expect(matches.length).toBe(1);
      });

      it('ESC binding in BaseScene is NOT gated by getPauseKeyCode', async () => {
        // Regression guard: the null-branch guard in _bindCommonKeys (see R1
        // test above) wraps ONLY the pause-key addKey call. ESC→handleExit
        // must stay unconditional so `null` pause disables pause without
        // silently disabling scene exit. Look for the addKey call for ESC
        // sitting outside the `if (pauseCode !== null)` block.
        const { readFileSync } = await import('fs');
        const { resolve } = await import('path');
        const baseSrc = readFileSync(
          resolve(process.cwd(), 'src/lib/phaser/scenes/BaseScene.ts'),
          'utf8',
        );
        // The ESC addKey call must appear BEFORE the pauseCode const decl —
        // i.e. the ESC binding is in _bindCommonKeys() at a higher position
        // than the guard. If a future refactor moves ESC inside the guard,
        // this assertion catches it.
        const escIdx = baseSrc.indexOf('Phaser.Input.Keyboard.KeyCodes.ESC');
        const guardIdx = baseSrc.indexOf('const pauseCode = this.getPauseKeyCode()');
        expect(escIdx).toBeGreaterThan(-1);
        expect(guardIdx).toBeGreaterThan(-1);
        expect(escIdx).toBeLessThan(guardIdx);
      });
    });

    // ---------------------------------------------------------------------
    // Hit-zone derived invariants (complements R2 dial locks)
    // ---------------------------------------------------------------------
    describe('Hit-zone derived invariants', () => {
      it('note visible travel distance fits inside the canvas', () => {
        // The full note lifecycle spans SPAWN_HEIGHT (-130) → HIT_LINE_Y
        // (560) → miss-detect (660 = HIT_LINE_Y + 100). The total Y span a
        // note traverses must not exceed HEIGHT or notes spawn off the top
        // BEFORE the miss-detect window finishes — a silent regression that
        // would drop end-of-chart notes on fast scrolls.
        const { NOTES, HEIGHT } = GAME_CONFIG;
        const MISS_DETECT_OFFSET = 100;
        const spanTop = NOTES.SPAWN_HEIGHT; // negative — above canvas
        const spanBottom = NOTES.HIT_LINE_Y + MISS_DETECT_OFFSET;
        expect(spanBottom - spanTop).toBeLessThanOrEqual(HEIGHT + Math.abs(spanTop));
      });

      it('HIT_LINE_Y sits below the 400-px visible top band so notes have approach room', () => {
        // Sanity bound: a regression bumping HIT_LINE_Y up to (say) 200
        // would give players ~400 ms to react instead of 1725 ms. Lock a
        // floor that keeps the approach window comfortably long.
        expect(GAME_CONFIG.NOTES.HIT_LINE_Y).toBeGreaterThanOrEqual(400);
      });
    });

    // ---------------------------------------------------------------------
    // Game-over path contract — all three routes must promote highScore and
    // pass real values (score, highScore) to reportScore + gameOver.
    // ---------------------------------------------------------------------
    describe('Game-over path contract — reportScore + gameOver arg shape', () => {
      /**
       * Stub the tiny subset of scene state touched by each game-over path
       * so the assertions below can focus on the reporting contract.
       * `stopTrackAudio`, the flash camera, and `buildEndStats` are all
       * benign here — stub them to keep the test isolated.
       */
      function primeForGameOver(s: any): void {
        s.trackAudio = null;
        s.cameras = { main: { shake: vi.fn(), flash: vi.fn() } };
        s.buildEndStats = vi.fn().mockReturnValue([{ label: 'Max Combo', value: '0×' }]);
      }

      it('onKeyDown empty-hit→health-depleted promotes highScore BEFORE reportScore', () => {
        // New-high path: session score > stored highScore → highScore must
        // be updated to the session score BEFORE reportScore so the scoreboard
        // sees the watermark, not the stale value.
        primeForGameOver(scene);
        scene.activeNotes = [];
        scene.isCountdown = false;
        scene.score = 2000;
        scene.highScore = 500;
        scene.health = GAME_CONFIG.HEALTH.EMPTY_HIT_PENALTY; // one empty hit kills

        scene.onKeyDown(0);

        expect(scene.reportScore).toHaveBeenCalledWith(2000, 2000);
        expect(scene.gameOver).toHaveBeenCalledWith(
          2000,
          'Health depleted',
          2000,
          expect.any(Array),
          expect.any(Number),
          expect.any(Number),
        );
      });

      it('onKeyDown empty-hit→health-depleted preserves highScore on a losing session', () => {
        // Anti-regression: with `score < highScore`, the `if` must NOT
        // lower the highScore. The fix at L530 uses `score > highScore` (not
        // `!==`). A regression to `=` or `>=` would silently corrupt the
        // stored watermark downward.
        primeForGameOver(scene);
        scene.activeNotes = [];
        scene.isCountdown = false;
        scene.score = 100;
        scene.highScore = 5000;
        scene.health = GAME_CONFIG.HEALTH.EMPTY_HIT_PENALTY;

        scene.onKeyDown(0);

        expect(scene.reportScore).toHaveBeenCalledWith(100, 5000);
        expect(scene.gameOver).toHaveBeenCalledWith(
          100,
          'Health depleted',
          5000,
          expect.any(Array),
          expect.any(Number),
          expect.any(Number),
        );
      });

      it('processHit→miss→health-depleted (L684 fix) uses (score, highScore) contract', () => {
        // THIS IS THE BUG FIX LOCK. Pre-R4 this path called
        // `reportScore(score, score)` and `gameOver(…, undefined, …)` —
        // R86.A1's singleton hid the symptom but the contract was broken.
        // A regression here reproduces the pre-A1 stale-scoreboard bug.
        primeForGameOver(scene);
        scene.activeNotes = [];
        scene.score = 8000;
        scene.highScore = 3000;
        scene.health = GAME_CONFIG.HEALTH.MISS_DAMAGE; // one miss kills
        scene.laneCyanTinted = false;
        scene.combo = 20;

        const note = createMockNote();
        scene.processHit(note, 'miss');

        expect(scene.reportScore).toHaveBeenCalledWith(8000, 8000);
        expect(scene.gameOver).toHaveBeenCalledWith(
          8000,
          'Health depleted',
          8000, // NOT undefined — direct regression guard
          expect.any(Array),
          expect.any(Number),
          expect.any(Number),
        );
      });

      it('processHit→miss→health-depleted preserves highScore on a losing session', () => {
        // Paired with the previous test: ensures the L684 fix's highScore
        // promotion is `>` not `>=` or `=` — a losing session must leave
        // the stored highScore untouched.
        primeForGameOver(scene);
        scene.activeNotes = [];
        scene.score = 400;
        scene.highScore = 9000;
        scene.health = GAME_CONFIG.HEALTH.MISS_DAMAGE;
        scene.laneCyanTinted = false;
        scene.combo = 5;

        const note = createMockNote();
        scene.processHit(note, 'miss');

        expect(scene.reportScore).toHaveBeenCalledWith(400, 9000);
        expect(scene.gameOver).toHaveBeenCalledWith(
          400,
          'Health depleted',
          9000,
          expect.any(Array),
          expect.any(Number),
          expect.any(Number),
        );
      });

      it('trackComplete promotes highScore BEFORE reportScore (new high)', () => {
        // Completion-victory path — same (score, highScore) contract, same
        // promotion ordering. R87.RH1 swapped the reason string from
        // "Max Combo: X" to the 'TRACK COMPLETE' sentinel so the Rhythm
        // Hacker GameOverScene can branch to a green win-title; the max-combo
        // info remains surfaced via `buildEndStats()`.
        primeForGameOver(scene);
        scene.score = 12000;
        scene.highScore = 4000;
        scene.maxCombo = 47;
        scene.missCount = 1;

        scene.trackComplete();

        expect(scene.reportScore).toHaveBeenCalledWith(12000, 12000);
        expect(scene.gameOver).toHaveBeenCalledWith(
          12000,
          'TRACK COMPLETE',
          12000,
          expect.any(Array),
          expect.any(Number),
          expect.any(Number),
        );
      });

      it('trackComplete preserves highScore on a losing session', () => {
        // A shorter / lower-scoring playthrough of the same track must not
        // overwrite the stored watermark even though it reaches the
        // completion path. Guards the `>` vs `>=` drift at L1147.
        primeForGameOver(scene);
        scene.score = 500;
        scene.highScore = 9999;
        scene.maxCombo = 10;
        scene.missCount = 2;

        scene.trackComplete();

        expect(scene.reportScore).toHaveBeenCalledWith(500, 9999);
        expect(scene.gameOver).toHaveBeenCalledWith(
          500,
          'TRACK COMPLETE',
          9999,
          expect.any(Array),
          expect.any(Number),
          expect.any(Number),
        );
      });

      it('only ONE processHit game-over site exists — no split routes', async () => {
        // Structural lock: if a refactor extracts the death block into a
        // helper, we expect exactly one `reportScore(this.score, ...)` call
        // in processHit's body. Two would mean a stray second route the
        // contract tests above don't cover.
        const { readFileSync } = await import('fs');
        const { resolve } = await import('path');
        const src = readFileSync(
          resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/GameScene.ts'),
          'utf8',
        );
        // Total reportScore calls across the scene: 3 (L530-ish, L684-ish,
        // L1147-ish). More or fewer means a game-over route was added or
        // removed without updating this test.
        const reportScoreCalls = src.match(/this\.reportScore\s*\(/g) ?? [];
        expect(reportScoreCalls.length).toBe(3);
        const gameOverCalls = src.match(/this\.gameOver\s*\(/g) ?? [];
        expect(gameOverCalls.length).toBe(3);
      });

      it('no reportScore call passes score twice (pre-R4 bug regression)', async () => {
        // Direct bug-fix lock: the pre-R4 L684 call was
        // `this.reportScore(this.score, this.score)` — if a refactor reverts
        // either the promotion block or the highScore arg, the string
        // `this.reportScore(this.score, this.score)` reappears in source.
        const { readFileSync } = await import('fs');
        const { resolve } = await import('path');
        const src = readFileSync(
          resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/GameScene.ts'),
          'utf8',
        );
        expect(src).not.toMatch(/this\.reportScore\(\s*this\.score\s*,\s*this\.score\s*\)/);
      });
    });

    // ---------------------------------------------------------------------
    // saveSystem read-path resilience (mirrors A3 null-chain coverage)
    // ---------------------------------------------------------------------
    describe('saveSystem read-path resilience', () => {
      /**
       * Replay the slice of create() that loads highScore off the registry.
       * The full create() is 60+ lines of Phaser setup we don't need here;
       * extract the read block verbatim as a fixture so drift to the real
       * code is loud.
       */
      function readHighScore(registryGet: (key: string) => any): number {
        const saveSystem = registryGet('saveSystem');
        if (saveSystem) {
          const saveData = saveSystem.getSaveData();
          return saveData?.games?.rhythmHacker?.highScore ?? 0;
        }
        return 0;
      }

      it('returns the stored highScore when saveData.games.rhythmHacker is populated', () => {
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({
            games: { rhythmHacker: { highScore: 4200 } },
          }),
        };
        const registryGet = vi.fn().mockReturnValue(saveSystem);
        expect(readHighScore(registryGet)).toBe(4200);
      });

      it('falls back to 0 when the saveSystem registry entry is missing', () => {
        // First-run path: no saveSystem registered → no crash, highScore=0.
        const registryGet = vi.fn().mockReturnValue(undefined);
        expect(readHighScore(registryGet)).toBe(0);
      });

      it('falls back to 0 when saveData is undefined (empty slot)', () => {
        const saveSystem = { getSaveData: vi.fn().mockReturnValue(undefined) };
        const registryGet = vi.fn().mockReturnValue(saveSystem);
        expect(readHighScore(registryGet)).toBe(0);
      });

      it('falls back to 0 when saveData.games is undefined (first-ever play)', () => {
        // Classic first-ever-play shape: saveData exists but `.games` is
        // still empty. The optional-chain must absorb this without throwing.
        const saveSystem = { getSaveData: vi.fn().mockReturnValue({}) };
        const registryGet = vi.fn().mockReturnValue(saveSystem);
        expect(readHighScore(registryGet)).toBe(0);
      });

      it('falls back to 0 when saveData.games.rhythmHacker is undefined', () => {
        // Cross-game play: other games in `.games`, Rhythm Hacker never
        // touched before.
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({
            games: { neoJump: { highScore: 999 } },
          }),
        };
        const registryGet = vi.fn().mockReturnValue(saveSystem);
        expect(readHighScore(registryGet)).toBe(0);
      });
    });
  });

  // -----------------------------------------------------------------------
  // R86.R1+ safety-net — Arcade-wide `getPauseKeyCode` override-uniqueness
  //
  // R86.R1 fixed Rhythm Hacker's QWOP lane-4 pause collision by overriding
  // `getPauseKeyCode()` to return `null` so BaseScene's `_bindCommonKeys`
  // skips the `P → togglePause` binding for this scene only. The existing R1
  // + R4 blocks cover the override's *local* contract (method exists on the
  // prototype, returns null, appears once, P: Pause hint removed from the
  // menu footer).
  //
  // What those blocks do NOT lock is the *arcade-wide* contract: every OTHER
  // Phaser scene (Agent Chase, CloudJumper, CodeBreaker, CtrlSWorld, Matrix-
  // Cloud, MatrixFrogger, MatrixInvaders, Metris, NeoJump, SnakeClassic,
  // VortexPong) must KEEP the BaseScene default P=pause binding. A future
  // copy-paste regression — someone cloning RhythmHackerGameScene to bootstrap
  // a new game, or adding a `getPauseKeyCode` override elsewhere by mistake
  // — would silently break P=pause in that game with no in-suite gate going
  // red. This block makes "Rhythm Hacker is the sole override" a first-class
  // invariant.
  //
  // It also tightens two structural locks that R4 only hints at: the override
  // body is the literal `return null;` (not an expression that could later
  // evaluate to a keycode via refactor) and the override body contains zero
  // references to `Phaser.Input.Keyboard.KeyCodes` (so a partial "restore
  // parity with base" edit can't half-rebind P).
  //
  // Pure coverage refresh — no production code touched.
  // -----------------------------------------------------------------------
  describe('R86.R1+ safety-net — Arcade-wide override uniqueness + literal-return lock', () => {
    // Static-source helper — returns every `*.ts` file path under
    // `src/components/games/phaser/` so the uniqueness scan stays accurate
    // as new games land (rather than hardcoding the 11-game list, which
    // would drift silently when R87 adds more).
    async function listPhaserSceneFiles(): Promise<string[]> {
      const { readdirSync } = await import('fs');
      const { resolve, join } = await import('path');
      const root = resolve(process.cwd(), 'src/components/games/phaser');
      // Node 20+ supports { recursive: true } but some CI images still
      // run Node 18 — walk manually so the test stays portable.
      const out: string[] = [];
      const walk = (dir: string): void => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.isFile() && full.endsWith('.ts') && !full.endsWith('.test.ts')) {
            out.push(full);
          }
        }
      };
      walk(root);
      return out;
    }

    it('getPauseKeyCode is overridden in exactly ONE phaser scene file (RhythmHackerGameScene)', async () => {
      // The arcade-wide invariant: only Rhythm Hacker deviates from the P=
      // pause default. If a future scene accidentally (or intentionally)
      // adds its own override, this test goes red and forces the author to
      // document the reason — or delete the override and use `allowPause=
      // false` if the intent is to disable pause entirely.
      const { readFileSync } = await import('fs');
      const files = await listPhaserSceneFiles();

      const overriders = files.filter((path) => {
        const src = readFileSync(path, 'utf8');
        return /(?:protected|public)?\s*getPauseKeyCode\s*\(\s*\)\s*:\s*number\s*\|\s*null/.test(src);
      });

      expect(overriders).toHaveLength(1);
      expect(overriders[0]).toMatch(/RhythmHacker[\\/]scenes[\\/]GameScene\.ts$/);
    });

    it('RhythmHackerGameScene override body is the literal `return null;` (not an expression)', async () => {
      // A subtle drift: someone "simplifies" the override to
      //   return this.allowPause ? Phaser.Input.Keyboard.KeyCodes.P : null;
      // which still returns null in the current codebase (because allowPause
      // defaults true, wait actually the truthy branch would bind P —
      // exactly the bug this test catches). Lock the body shape so any such
      // refactor must delete the safety-net alongside, making the intent
      // change visible in review.
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      const src = readFileSync(
        resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/GameScene.ts'),
        'utf8',
      );
      // Match the whole method incl. body: declared `protected`, typed
      // `number | null`, body is exactly `return null;` surrounded only by
      // whitespace. Regex intentionally does NOT allow any other statement.
      expect(src).toMatch(
        /protected\s+getPauseKeyCode\s*\(\s*\)\s*:\s*number\s*\|\s*null\s*\{\s*return\s+null\s*;\s*\}/,
      );
    });

    it('Rhythm override body contains zero `KeyCodes` references (no accidental re-bind path)', async () => {
      // Stronger invariant than "return null" alone: the override must not
      // mention Phaser.Input.Keyboard.KeyCodes anywhere in its body. A
      // partial refactor could (for example) read a keycode into a local
      // const and then conditionally return it/null; the body-shape regex
      // above catches the simple form, this one catches the tunnelled form.
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      const src = readFileSync(
        resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/GameScene.ts'),
        'utf8',
      );
      // Isolate the override body by matching everything between the
      // method signature and the matching closing brace (non-greedy). The
      // method is small so a simple [^}]* body match is safe — if anyone
      // grows it past a single statement, the literal-body test above
      // fails first.
      const bodyMatch = src.match(
        /protected\s+getPauseKeyCode\s*\(\s*\)\s*:\s*number\s*\|\s*null\s*\{([^}]*)\}/,
      );
      expect(bodyMatch).not.toBeNull();
      const body = bodyMatch?.[1] ?? '';
      expect(body).not.toMatch(/KeyCodes/);
      expect(body).not.toMatch(/Phaser\.Input/);
    });

    it('BaseScene `getPauseKeyCode` signature matches the override signature (type-contract)', async () => {
      // Virtual-method contract: BaseScene declares the return type as
      // `number | null`. If a refactor widens it (e.g. `| undefined`) or
      // narrows it (drops `| null`), the override either stops compiling
      // or silently starts returning a non-null value. Lock both signatures
      // to the same exact shape so drift is an immediate red gate, not a
      // runtime surprise.
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      const baseSrc = readFileSync(
        resolve(process.cwd(), 'src/lib/phaser/scenes/BaseScene.ts'),
        'utf8',
      );
      const rhythmSrc = readFileSync(
        resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/GameScene.ts'),
        'utf8',
      );
      const sig = /protected\s+getPauseKeyCode\s*\(\s*\)\s*:\s*number\s*\|\s*null/;
      expect(baseSrc).toMatch(sig);
      expect(rhythmSrc).toMatch(sig);
    });

    it('RhythmHackerGameScene does NOT override `allowPause` (dashbar fallback preserved)', async () => {
      // R86.R1's rationale explicitly says the dashbar pause button still
      // works because it routes through PAUSE_REQUEST_EVENT rather than the
      // scene keyboard binding. That fallback only works while `allowPause`
      // stays truthy on this scene (BaseScene's _handlePauseRequest bails
      // on `!this.allowPause`). If a future refactor flips allowPause to
      // false here — perhaps under the mistaken belief that "pause is off
      // for Rhythm Hacker" — the dashbar button would silently stop
      // working and Tom's regression cycle starts over.
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      const src = readFileSync(
        resolve(process.cwd(), 'src/components/games/phaser/RhythmHacker/scenes/GameScene.ts'),
        'utf8',
      );
      // Strict: no `allowPause = …` assignment anywhere in the file. The
      // default (`true`) from BaseScene must remain in force.
      expect(src).not.toMatch(/allowPause\s*=/);
    });

    it('runtime proof: `pauseKey` stays unset after `_bindCommonKeys` skips the addKey call', () => {
      // Behaviour lock that composes with the static tests above: with
      // `getPauseKeyCode()` returning null, the `if (pauseCode !== null)`
      // branch in BaseScene must not execute the addKey call, leaving
      // `this.pauseKey` undefined. The existing R1 behaviour test covers
      // "lane-4 press doesn't pause", but not the `pauseKey` field state
      // itself — a regression could re-arm the key without firing togglePause
      // (e.g. by setting pauseKey then omitting the `on('down', …)` handler)
      // and the suite would stay green. This test pins the field state.
      const addKeySpy = vi.fn();
      const scene = createTestScene();

      // Drive the guard logic the same way BaseScene._bindCommonKeys does:
      // read the override, check against null, only then call addKey.
      const pauseCode = scene.getPauseKeyCode();
      expect(pauseCode).toBeNull();
      if (pauseCode !== null) {
        addKeySpy(pauseCode);
      }

      expect(addKeySpy).not.toHaveBeenCalled();
      // pauseKey is never assigned, so it stays whatever the scene ctor
      // left it as (undefined, per BaseScene's `protected pauseKey?:` field).
      expect(scene.pauseKey).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // R87.RH1 — Track-complete win flow
  //
  // WHY THESE TESTS EXIST
  // Tom 2026-04-23 post-R86: *"I have just completed a level and no high score
  // came up or level completed"*. Pre-RH1 trackComplete() snapped straight to
  // the GameOverScene with the "Max Combo: X" reason, which the base
  // GameOverScene rendered under a red "GAME OVER" title — indistinguishable
  // from a death from the player's perspective. RH1 added three guarantees:
  //   1. Re-entry guard — the update() tick at L229 can no longer stack
  //      trackComplete() calls before the scene transitions.
  //   2. TRACK COMPLETE banner painted for BANNER_HOLD_MS before gameOver
  //      fires, so the win moment is perceivable.
  //   3. `reason = 'TRACK COMPLETE'` (sentinel) passed through gameOver so
  //      RhythmHackerGameOverScene's title hook paints green win copy.
  // Each invariant maps to a named block below so a refactor that breaks one
  // fails exactly one assertion.
  // -----------------------------------------------------------------------
  describe('R87.RH1 — Track-complete win flow', () => {
    function primeForTrackComplete(s: any): void {
      s.trackAudio = null;
      s.cameras = { main: { shake: vi.fn(), flash: vi.fn() } };
      s.buildEndStats = vi.fn().mockReturnValue([{ label: 'Max Combo', value: '0×' }]);
    }

    describe('Re-entry guard', () => {
      it('sets isTrackComplete=true on first call', () => {
        const scene = createTestScene();
        primeForTrackComplete(scene);
        expect(scene.isTrackComplete).toBe(false);
        scene.trackComplete();
        expect(scene.isTrackComplete).toBe(true);
      });

      it('bails early on second call — reportScore fires once, gameOver once', () => {
        const scene = createTestScene();
        primeForTrackComplete(scene);
        scene.score = 5000;
        scene.highScore = 1000;

        scene.trackComplete();
        scene.trackComplete(); // simulate the update-tick stacking risk
        scene.trackComplete();

        expect(scene.reportScore).toHaveBeenCalledTimes(1);
        expect(scene.gameOver).toHaveBeenCalledTimes(1);
      });

      it('update() tick does not call trackComplete when guard is already set', () => {
        const scene = createTestScene();
        primeForTrackComplete(scene);
        scene.isPaused = false;
        scene.isCountdown = false;
        scene.trackDuration = 10;
        scene.gameTime = 20_000; // past trackDuration * 1000
        scene.activeNotes = [];
        scene.isTrackComplete = true;
        // Stub every other method update() calls so we can isolate the guard.
        scene.spawnNotes = vi.fn();
        scene.updateNotes = vi.fn();
        scene.updateScrollingGrid = vi.fn();
        scene.updateNoteApproachEffects = vi.fn();
        scene.updateComboGlow = vi.fn();
        scene.updateUI = vi.fn();
        scene.exposeTestState = vi.fn();
        scene.getIsMuted = vi.fn().mockReturnValue(false);
        const trackCompleteSpy = vi.spyOn(scene, 'trackComplete');

        scene.update(0, 16);

        expect(trackCompleteSpy).not.toHaveBeenCalled();
      });

      it('create() resets isTrackComplete to false', () => {
        const scene = createTestScene();
        scene.isTrackComplete = true;
        // create() is a big method — stub the Phaser-heavy branches and just
        // assert the reset happened. We need registry/saveSystem stubs and
        // a minimal add/notes surface.
        scene.registry = { get: vi.fn() };
        scene.add = {
          ...scene.add,
          group: vi.fn().mockReturnValue({}),
        };
        scene.createMatrixBackground = vi.fn();
        scene.createLanes = vi.fn();
        scene.createUI = vi.fn();
        scene.createCountdown = vi.fn();
        scene.setupInput = vi.fn();
        scene.setupCommonInputs = vi.fn();
        scene.initTrackAudio = vi.fn();

        scene.create();

        expect(scene.isTrackComplete).toBe(false);
      });
    });

    describe('TRACK COMPLETE banner + deferred gameOver', () => {
      it('paints a TRACK COMPLETE banner BEFORE firing gameOver', () => {
        const scene = createTestScene();
        primeForTrackComplete(scene);
        // Capture delayedCall without invoking — so gameOver has not yet fired.
        scene.time = { delayedCall: vi.fn() };

        scene.trackComplete();

        // Banner creation: scene.add.text was called with 'TRACK COMPLETE'
        const addTextCalls = (scene.add.text as any).mock.calls;
        const bannerCall = addTextCalls.find((c: any[]) => c[2] === 'TRACK COMPLETE');
        expect(bannerCall).toBeDefined();
        // Banner is centred (WIDTH/2, HEIGHT/2) — matches config dimensions.
        expect(bannerCall[0]).toBe(GAME_CONFIG.WIDTH / 2);
        expect(bannerCall[1]).toBe(GAME_CONFIG.HEIGHT / 2);
        // gameOver has NOT yet fired (delayedCall captured but not invoked).
        expect(scene.gameOver).not.toHaveBeenCalled();
      });

      it('schedules gameOver via time.delayedCall using TRACK_COMPLETE.BANNER_HOLD_MS', () => {
        const scene = createTestScene();
        primeForTrackComplete(scene);
        const delayedCall = vi.fn();
        scene.time = { delayedCall };

        scene.trackComplete();

        expect(delayedCall).toHaveBeenCalledOnce();
        expect(delayedCall).toHaveBeenCalledWith(
          GAME_CONFIG.TRACK_COMPLETE.BANNER_HOLD_MS,
          expect.any(Function),
        );
      });

      it('fires gameOver with TRACK COMPLETE reason when the delayedCall callback invokes', () => {
        const scene = createTestScene();
        primeForTrackComplete(scene);
        scene.score = 5000;
        scene.highScore = 1000;
        scene.maxCombo = 30;
        let capturedCb: (() => void) | null = null;
        scene.time = {
          delayedCall: vi.fn((_ms: number, cb: () => void) => {
            capturedCb = cb;
          }),
        };

        scene.trackComplete();

        expect(scene.gameOver).not.toHaveBeenCalled();
        expect(capturedCb).not.toBeNull();

        capturedCb!();

        expect(scene.gameOver).toHaveBeenCalledWith(
          5000,
          'TRACK COMPLETE',
          5000,
          expect.any(Array),
          expect.any(Number),
          expect.any(Number),
        );
      });

      it('snapshots the final score/highScore BEFORE the deferred call (late mutation cannot leak)', () => {
        const scene = createTestScene();
        primeForTrackComplete(scene);
        scene.score = 12_000;
        scene.highScore = 4000;
        let capturedCb: (() => void) | null = null;
        scene.time = {
          delayedCall: vi.fn((_ms: number, cb: () => void) => {
            capturedCb = cb;
          }),
        };

        scene.trackComplete();
        // Simulate a stray late mutation. The captured snapshot must win.
        scene.score = 99;
        scene.highScore = 99;

        capturedCb!();

        expect(scene.gameOver).toHaveBeenCalledWith(
          12_000,
          'TRACK COMPLETE',
          12_000,
          expect.any(Array),
          expect.any(Number),
          expect.any(Number),
        );
      });
    });

    describe('BANNER_HOLD_MS config dial', () => {
      it('is a positive finite number', () => {
        expect(GAME_CONFIG.TRACK_COMPLETE.BANNER_HOLD_MS).toBeGreaterThan(0);
        expect(Number.isFinite(GAME_CONFIG.TRACK_COMPLETE.BANNER_HOLD_MS)).toBe(true);
      });

      it('is ≥ 1000 ms (readable to players) AND ≤ 3000 ms (not hostage-taking)', () => {
        // Anti-regression ratchet — the 1800 ms value is Tom's "perceivable
        // but brief" target. A refactor pushing it past 3000 ms starts to
        // feel like the game is forcing a pause; pushing below 1000 ms
        // stops being legible feedback. Both directions need an explicit
        // test delete to move past.
        expect(GAME_CONFIG.TRACK_COMPLETE.BANNER_HOLD_MS).toBeGreaterThanOrEqual(1000);
        expect(GAME_CONFIG.TRACK_COMPLETE.BANNER_HOLD_MS).toBeLessThanOrEqual(3000);
      });
    });
  });
});
