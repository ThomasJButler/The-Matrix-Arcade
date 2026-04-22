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
});
