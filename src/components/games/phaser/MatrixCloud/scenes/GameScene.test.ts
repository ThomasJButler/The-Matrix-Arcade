import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { MatrixCloudGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS, SLOW_MODE, POWERUP_DEFS, PIPE_VARIANTS, PARALLAX } from '../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

const C = GAME_CONFIG;

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

function createMockGraphics() {
  const g: any = {
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    fillRoundedRect: vi.fn().mockReturnThis(),
    fillTriangle: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    strokeCircle: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    beginPath: vi.fn().mockReturnThis(),
    strokePath: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setDepth: vi.fn().mockReturnThis(),
    generateTexture: vi.fn().mockReturnThis(),
  };
  return g;
}

function createMockText() {
  return {
    setText: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    x: 0,
    y: 0,
  };
}

function createMockSprite(x = 0, y = 0) {
  return {
    x,
    y,
    setX: vi.fn().mockImplementation(function (this: any, v: number) { this.x = v; return this; }),
    setY: vi.fn().mockImplementation(function (this: any, v: number) { this.y = v; return this; }),
    setPosition: vi.fn().mockImplementation(function (this: any, px: number, py: number) { this.x = px; this.y = py; return this; }),
    setAlpha: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setTint: vi.fn().mockReturnThis(),
    clearTint: vi.fn().mockReturnThis(),
    setDisplaySize: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    visible: true,
    destroy: vi.fn(),
  };
}

function createMockRect(x = 0, y = 0, w = 0, h = 0) {
  return {
    x, y, width: w, height: h,
    setX: vi.fn().mockImplementation(function (this: any, v: number) { this.x = v; return this; }),
    // R84.B4: moving pipes call setY/setSize every frame to animate their
    // vertical drift, so the mock rect has to expose both. The previous mock
    // only had setX because pre-variant pipes were purely horizontal.
    setY: vi.fn().mockImplementation(function (this: any, v: number) { this.y = v; return this; }),
    setSize: vi.fn().mockImplementation(function (this: any, nw: number, nh: number) { this.width = nw; this.height = nh; return this; }),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
}

function createTestScene(): any {
  const scene = new MatrixCloudGameScene() as any;

  for (const name of collectPrototypeMethods(MatrixCloudGameScene)) {
    const fn = MatrixCloudGameScene.prototype[name as keyof typeof MatrixCloudGameScene.prototype];
    if (typeof fn === 'function') {
      scene[name] = (fn as any).bind(scene);
    }
  }

  scene.playSound = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.createMatrixText = vi.fn().mockReturnValue(createMockText());
  scene.createMatrixBackground = vi.fn();
  scene.addMatrixRain = vi.fn().mockReturnValue({ getChildren: () => [] });
  scene.updateMatrixRain = vi.fn();
  scene.setupCommonInputs = vi.fn();
  scene.exposeTestState = vi.fn();

  scene.cameras = { main: { shake: vi.fn(), flash: vi.fn(), setBackgroundColor: vi.fn() } };
  scene.tweens = { add: vi.fn().mockReturnValue({ destroy: vi.fn() }), killTweensOf: vi.fn(), killAll: vi.fn() };
  scene.time = {
    addEvent: vi.fn().mockReturnValue({ destroy: vi.fn(), delay: 0 }),
    delayedCall: vi.fn().mockReturnValue({ destroy: vi.fn() }),
    removeAllEvents: vi.fn(),
  };
  scene.input = {
    keyboard: {
      addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }),
      removeAllKeys: vi.fn(),
      createCursorKeys: vi.fn().mockReturnValue({}),
    },
    on: vi.fn(),
    off: vi.fn(),
    activePointer: { isDown: false },
  };
  scene.add = {
    graphics: vi.fn().mockReturnValue(createMockGraphics()),
    rectangle: vi.fn().mockImplementation((x: number, y: number, w: number, h: number) => createMockRect(x, y, w, h)),
    sprite: vi.fn().mockImplementation((x: number, y: number) => createMockSprite(x, y)),
    text: vi.fn().mockReturnValue(createMockText()),
    circle: vi.fn().mockImplementation((x: number, y: number, r: number) => ({
      x, y, radius: r, setDepth: vi.fn().mockReturnThis(), destroy: vi.fn(),
    })),
    image: vi.fn().mockImplementation((x: number, y: number) => createMockSprite(x, y)),
  };
  scene.make = {
    graphics: vi.fn().mockReturnValue(createMockGraphics()),
  };
  scene.game = { config: { width: C.WIDTH, height: C.HEIGHT }, renderer: { type: 1 }, registry: { get: vi.fn().mockReturnValue(false) } };
  scene.scene = { restart: vi.fn(), start: vi.fn(), stop: vi.fn() };
  scene.scale = { width: C.WIDTH, height: C.HEIGHT };
  scene.events = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };
  scene.sys = { game: scene.game };
  scene.registry = { get: vi.fn().mockReturnValue(undefined), set: vi.fn() };
  scene.isPaused = false;

  scene.resetState();

  return scene;
}

const s = (scene: any, key: string) => scene[key];
const call = (scene: any, method: string, ...args: any[]) => scene[method](...args);

let scene: any;

beforeEach(() => {
  scene = createTestScene();

  scene.player = createMockSprite(C.PLAYER_X, C.HEIGHT * 0.4);
  scene.groundRect = createMockRect(C.WIDTH / 2, C.HEIGHT - C.GROUND_HEIGHT / 2, C.WIDTH, C.GROUND_HEIGHT);
  scene.scoreText = createMockText();
  scene.highScoreText = createMockText();
  scene.levelText = createMockText();
  scene.comboText = createMockText();
  scene.livesText = createMockText();
  scene.matrixRainGroup = { getChildren: () => [] };
  scene.spaceKey = { isDown: false };
  scene.enterKey = { isDown: false };

  (Phaser.Input.Keyboard as any).JustDown = vi.fn().mockReturnValue(false);
  (Phaser as any).Math = {
    Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
  };
});

describe('MatrixCloudGameScene', () => {
  describe('Initial State', () => {
    it('score starts at 0', () => {
      expect(s(scene, 'score')).toBe(0);
    });

    it('lives starts at INITIAL_LIVES', () => {
      expect(s(scene, 'lives')).toBe(C.INITIAL_LIVES);
    });

    it('level starts at 1', () => {
      expect(s(scene, 'level')).toBe(1);
    });

    it('combo starts at 1.0', () => {
      expect(s(scene, 'combo')).toBe(1.0);
    });

    it('playerVelocity starts at 0', () => {
      expect(s(scene, 'playerVelocity')).toBe(0);
    });

    it('isGameOver starts false', () => {
      expect(s(scene, 'isGameOver')).toBe(false);
    });

    it('inBossBattle starts false', () => {
      expect(s(scene, 'inBossBattle')).toBe(false);
    });

    it('shieldActive starts false', () => {
      expect(s(scene, 'shieldActive')).toBe(false);
    });

    it('powerUpsCollected starts at 0', () => {
      expect(s(scene, 'powerUpsCollected')).toBe(0);
    });

    it('no pipes initially', () => {
      expect(s(scene, 'pipes')).toHaveLength(0);
    });
  });

  describe('Player Physics', () => {
    it('gravity increases velocity', () => {
      scene.playerVelocity = 0;
      call(scene, 'updatePlayer', 1 / 60);
      expect(scene.playerVelocity).toBeGreaterThan(0);
    });

    it('velocity capped at terminal velocity', () => {
      scene.playerVelocity = C.TERMINAL_VELOCITY + 100;
      call(scene, 'updatePlayer', 1 / 60);
      expect(scene.playerVelocity).toBeLessThanOrEqual(C.TERMINAL_VELOCITY);
    });

    it('ceiling clamp prevents negative Y', () => {
      scene.playerY = -10;
      scene.playerVelocity = -200;
      call(scene, 'updatePlayer', 1 / 60);
      expect(scene.playerY).toBe(0);
      expect(scene.playerVelocity).toBe(0);
    });

    // R83.B1(b): ground touch is instant death, routed via handleGroundDeath
    // rather than handleCollision — shields no longer soak a ground hit.
    it('ground collision triggers handleGroundDeath', () => {
      const handleGroundDeath = vi.spyOn(scene, 'handleGroundDeath');
      scene.playerY = C.HEIGHT - C.GROUND_HEIGHT;
      scene.playerVelocity = 100;
      call(scene, 'updatePlayer', 1 / 60);
      expect(handleGroundDeath).toHaveBeenCalled();
    });

    it('handleGroundDeath zeroes lives and ends the run even with shield active', () => {
      scene.shieldActive = true;
      scene.lives = 3;
      const handleGameOver = vi.spyOn(scene, 'handleGameOver');
      call(scene, 'handleGroundDeath');
      expect(scene.lives).toBe(0);
      expect(handleGameOver).toHaveBeenCalled();
    });
  });

  describe('Jump', () => {
    it('sets velocity to JUMP_VELOCITY', () => {
      call(scene, 'jump');
      expect(scene.playerVelocity).toBe(C.JUMP_VELOCITY);
    });

    // R83.B1(d): Matrix Bird's flap now drives the procedural-only birdFlap
    // preset instead of the shared `jump` MP3 (the latter was flagged as
    // "horrendous" in Tom's playtest). Cloud Jumper / Neo Jump still map to
    // `jump`, so a global `jump` key lookup would regress them.
    it('plays birdFlap sound (not jump)', () => {
      call(scene, 'jump');
      expect(scene.playSound).toHaveBeenCalledWith('birdFlap');
    });

    // R83.B1(e): while the slow power-up is active, flap impulse scales with
    // TIME_SLOW_FACTOR so apparent gap-clear height stays constant across
    // speed modes. Without the scale, slow mode would perversely over-lift.
    it('scales impulse by TIME_SLOW_FACTOR during slow power-up', () => {
      scene.timeSlowActive = true;
      call(scene, 'jump');
      expect(scene.playerVelocity).toBeCloseTo(C.JUMP_VELOCITY * C.TIME_SLOW_FACTOR);
    });

    it('unlocks FIRST_FLIGHT on first jump', () => {
      call(scene, 'jump');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_FLIGHT);
    });

    it('does not re-unlock FIRST_FLIGHT on subsequent jumps', () => {
      call(scene, 'jump');
      call(scene, 'jump');
      expect(scene.unlockAchievement).toHaveBeenCalledTimes(1);
    });
  });

  // R84.B6 (2026-04-19): Tom's post-R83.B1 playtest flagged the flap SFX as
  // "the worst"; jump key branched to a lower scale via JUMP_VOLUME_SCALE.
  // R84.B9 (2026-04-19 night): Tom's follow-up note "SFX too loud" persisted
  // for non-jump SFX — master scale dropped 0.75 → 0.65 while jump stays at
  // 0.60. These tests are the only guard against a regression that re-mixes
  // any of the three pinned values.
  describe('playSound override (R84.B6 + R84.B9)', () => {
    // Build a minimal scene that keeps the real playSound override intact —
    // createTestScene stubs `playSound = vi.fn()` for the rest of the suite so
    // unrelated tests can assert on the key alone.
    const buildScene = () => {
      const s: any = new MatrixCloudGameScene();
      const playSoundFn = (MatrixCloudGameScene.prototype as any).playSound;
      s.playSound = playSoundFn.bind(s);
      const soundSystem = { play: vi.fn(), isMuted: false };
      s.registry = {
        get: vi.fn().mockImplementation((k: string) =>
          k === 'soundSystem' ? soundSystem : undefined,
        ),
      };
      return { scene: s, soundSystem };
    };

    it('passes 0.6 volumeScale for BIRD_FLAP', () => {
      const { scene, soundSystem } = buildScene();
      scene.playSound('birdFlap');
      expect(soundSystem.play).toHaveBeenCalledWith('birdFlap', { volumeScale: 0.6 });
    });

    it('passes 0.65 volumeScale for non-flap SFX (score)', () => {
      const { scene, soundSystem } = buildScene();
      scene.playSound('score');
      expect(soundSystem.play).toHaveBeenCalledWith('score', { volumeScale: 0.65 });
    });

    it('passes 0.65 volumeScale for hit', () => {
      const { scene, soundSystem } = buildScene();
      scene.playSound('hit');
      expect(soundSystem.play).toHaveBeenCalledWith('hit', { volumeScale: 0.65 });
    });

    // R84.B9: regression guard covering every non-jump SFX the scene uses.
    // A refactor that branches the wrong key would otherwise silently regress
    // only the one key its test misses — sweeping every non-flap key here
    // means any future mis-branching surfaces as a test failure the same day.
    it('applies 0.65 master scale to every non-flap SFX key used by the scene', () => {
      const nonFlapKeys = [
        'menu',
        'score',
        'hit',
        'levelUp',
        'combo',
        'collectible',
        'dangerWarning',
        'gameOver',
        'glassBreak',
      ];
      for (const key of nonFlapKeys) {
        const { scene, soundSystem } = buildScene();
        scene.playSound(key);
        expect(soundSystem.play).toHaveBeenCalledWith(key, { volumeScale: 0.65 });
      }
    });

    // R84.B9: pin the jump-vs-master invariant so a future tune-pass can't
    // silently raise the jump above or level it with the master — Tom's B6
    // calibration depends on jump reading perceptibly quieter than the rest.
    it('keeps jump volumeScale strictly below the non-jump master', () => {
      const { scene, soundSystem } = buildScene();
      scene.playSound('birdFlap');
      scene.playSound('score');
      const flapCall = soundSystem.play.mock.calls.find((c: any) => c[0] === 'birdFlap');
      const scoreCall = soundSystem.play.mock.calls.find((c: any) => c[0] === 'score');
      expect(flapCall?.[1].volumeScale).toBeLessThan(scoreCall?.[1].volumeScale);
    });
  });

  describe('Pipe Collision', () => {
    it('detects top pipe collision', () => {
      const pipe: any = {
        x: C.PLAYER_X - 10,
        gapY: 20,
        passed: false,
        hit: false,
        topRect: createMockRect(),
        bottomRect: createMockRect(),
      };
      scene.playerY = 10;
      call(scene, 'checkPipeCollision', pipe);
      expect(pipe.hit).toBe(true);
    });

    it('detects bottom pipe collision', () => {
      const pipe: any = {
        x: C.PLAYER_X - 10,
        gapY: 50,
        passed: false,
        hit: false,
        topRect: createMockRect(),
        bottomRect: createMockRect(),
      };
      scene.playerY = 50 + C.PIPE_GAP + 5;
      call(scene, 'checkPipeCollision', pipe);
      expect(pipe.hit).toBe(true);
    });

    it('no collision when player is in the gap', () => {
      const pipe: any = {
        x: C.PLAYER_X - 10,
        gapY: 100,
        passed: false,
        hit: false,
        topRect: createMockRect(),
        bottomRect: createMockRect(),
      };
      scene.playerY = 100 + C.PIPE_GAP / 2;
      call(scene, 'checkPipeCollision', pipe);
      expect(pipe.hit).toBe(false);
    });

    it('no collision when pipe is far away', () => {
      const pipe: any = {
        x: C.PLAYER_X + C.PIPE_WIDTH + 50,
        gapY: 100,
        passed: false,
        hit: false,
        topRect: createMockRect(),
        bottomRect: createMockRect(),
      };
      scene.playerY = 10;
      call(scene, 'checkPipeCollision', pipe);
      expect(pipe.hit).toBe(false);
    });
  });

  describe('Pipe Scoring', () => {
    it('awards base score per pipe', () => {
      call(scene, 'scorePipe');
      expect(scene.score).toBe(C.SCORE_PER_PIPE);
    });

    it('increments combo on score', () => {
      call(scene, 'scorePipe');
      expect(scene.combo).toBeCloseTo(1.0 + C.COMBO_INCREMENT, 5);
    });

    it('caps combo at MAX_COMBO', () => {
      scene.combo = C.MAX_COMBO;
      call(scene, 'scorePipe');
      expect(scene.combo).toBe(C.MAX_COMBO);
    });

    it('applies combo multiplier to score', () => {
      scene.combo = 2.0;
      call(scene, 'scorePipe');
      expect(scene.score).toBe(Math.floor(C.SCORE_PER_PIPE * 2.0));
    });

    it('doublePoints doubles score', () => {
      scene.doublePointsActive = true;
      call(scene, 'scorePipe');
      expect(scene.score).toBe(Math.floor(C.SCORE_PER_PIPE * 1.0 * 2));
    });

    it('reports score after pipe', () => {
      call(scene, 'scorePipe');
      expect(scene.reportScore).toHaveBeenCalled();
    });

    it('plays score sound', () => {
      call(scene, 'scorePipe');
      expect(scene.playSound).toHaveBeenCalledWith('score');
    });

    // R83.G6: regression — Matrix Bird used to leak its new high score
    // because scorePipe reported `this.highScore` without first lifting it
    // to match `this.score`. Without this guard the dashbar trophy modal
    // shows the previously-loaded value forever.
    it('lifts highScore when score exceeds it before reporting', () => {
      scene.highScore = 10;
      scene.score = 50;
      call(scene, 'scorePipe');
      expect(scene.highScore).toBeGreaterThanOrEqual(scene.score);
      const lastReport = scene.reportScore.mock.calls.at(-1) as [number, number];
      expect(lastReport[1]).toBe(scene.highScore);
    });

    it('keeps highScore intact when score is still below it', () => {
      scene.highScore = 10_000;
      scene.score = 100;
      call(scene, 'scorePipe');
      expect(scene.highScore).toBe(10_000);
      const lastReport = scene.reportScore.mock.calls.at(-1) as [number, number];
      expect(lastReport[1]).toBe(10_000);
    });
  });

  describe('Level Progression', () => {
    it('level increases at LEVEL_THRESHOLD', () => {
      scene.score = C.LEVEL_THRESHOLD - C.SCORE_PER_PIPE;
      scene.combo = 1.0;
      call(scene, 'scorePipe');
      expect(scene.level).toBe(2);
    });

    it('plays levelUp sound on level change', () => {
      scene.score = C.LEVEL_THRESHOLD - C.SCORE_PER_PIPE;
      scene.combo = 1.0;
      call(scene, 'scorePipe');
      expect(scene.playSound).toHaveBeenCalledWith('levelUp');
    });

    it('camera shakes on level up', () => {
      scene.score = C.LEVEL_THRESHOLD - C.SCORE_PER_PIPE;
      scene.combo = 1.0;
      call(scene, 'scorePipe');
      expect(scene.cameras.main.shake).toHaveBeenCalled();
    });

    it('calculates level correctly from score', () => {
      scene.score = C.LEVEL_THRESHOLD * 3 - C.SCORE_PER_PIPE;
      scene.combo = 1.0;
      call(scene, 'scorePipe');
      expect(scene.level).toBe(4);
    });
  });

  describe('Power-Up Collection', () => {
    it('increments powerUpsCollected', () => {
      const pu: any = { sprite: createMockSprite(), type: 'shield', x: 0, y: 0 };
      call(scene, 'collectPowerUp', pu);
      expect(scene.powerUpsCollected).toBe(1);
    });

    it('plays powerUp sound', () => {
      const pu: any = { sprite: createMockSprite(), type: 'shield', x: 0, y: 0 };
      call(scene, 'collectPowerUp', pu);
      expect(scene.playSound).toHaveBeenCalledWith('collectible');
    });
  });

  describe('Power-Up Activation', () => {
    it('shield sets shieldActive', () => {
      call(scene, 'activatePowerUp', 'shield');
      expect(scene.shieldActive).toBe(true);
    });

    it('timeSlow sets timeSlowActive', () => {
      call(scene, 'activatePowerUp', 'timeSlow');
      expect(scene.timeSlowActive).toBe(true);
    });

    it('extraLife adds a life', () => {
      scene.lives = 2;
      call(scene, 'activatePowerUp', 'extraLife');
      expect(scene.lives).toBe(3);
    });

    it('extraLife caps at MAX_LIVES', () => {
      scene.lives = C.MAX_LIVES;
      call(scene, 'activatePowerUp', 'extraLife');
      expect(scene.lives).toBe(C.MAX_LIVES);
    });

    it('doublePoints sets doublePointsActive', () => {
      call(scene, 'activatePowerUp', 'doublePoints');
      expect(scene.doublePointsActive).toBe(true);
    });
  });

  // R84.B3: slow-mode momentum + trail. Two separate contracts tested here:
  //   (1) updatePlayer scales gravity + integration by TIME_SLOW_FACTOR only
  //       while timeSlowActive, giving the bird coherent hang-time that
  //       matches the slowed world (fixes Tom's "not enough momentum" note).
  //   (2) Yellow trail particles emit behind the bird for the power-up's
  //       lifetime — visual state-change signal, cleaned up on reset /
  //       shutdown / expiry.
  describe('R84.B3 — Slow-mode player physics scaling', () => {
    it('scales gravity accumulation when timeSlowActive', () => {
      scene.timeSlowActive = true;
      scene.playerVelocity = 0;
      scene.playerY = 100;
      call(scene, 'updatePlayer', 1 / 60);
      // velocity += GRAVITY × dt × TIME_SLOW_FACTOR = 1400 × 1/60 × 0.6 ≈ 14
      expect(scene.playerVelocity).toBeCloseTo(
        C.GRAVITY * (1 / 60) * C.TIME_SLOW_FACTOR,
        2,
      );
    });

    it('does NOT scale gravity when slow inactive (preserves full-rate fall)', () => {
      scene.timeSlowActive = false;
      scene.playerVelocity = 0;
      scene.playerY = 100;
      call(scene, 'updatePlayer', 1 / 60);
      // velocity += GRAVITY × dt = 1400 × 1/60 ≈ 23.33
      expect(scene.playerVelocity).toBeCloseTo(C.GRAVITY * (1 / 60), 2);
    });

    it('scales vertical position integration when timeSlowActive', () => {
      scene.timeSlowActive = true;
      scene.playerVelocity = 100;
      scene.playerY = 100;
      call(scene, 'updatePlayer', 1 / 60);
      // velocity after gravity: 100 + 1400 × 1/60 × 0.6 = 114
      // position delta: 114 × 1/60 × 0.6 = 1.14
      const expectedV = 100 + C.GRAVITY * (1 / 60) * C.TIME_SLOW_FACTOR;
      const expectedY = 100 + expectedV * (1 / 60) * C.TIME_SLOW_FACTOR;
      expect(scene.playerY).toBeCloseTo(expectedY, 3);
    });

    it('does NOT scale position integration when slow inactive', () => {
      scene.timeSlowActive = false;
      scene.playerVelocity = 100;
      scene.playerY = 100;
      call(scene, 'updatePlayer', 1 / 60);
      const expectedV = 100 + C.GRAVITY * (1 / 60);
      const expectedY = 100 + expectedV * (1 / 60);
      expect(scene.playerY).toBeCloseTo(expectedY, 3);
    });

    it('velocity terminal clamp stays absolute under slow mode', () => {
      // The raw velocity cap is a safety ceiling on the physical state; only
      // the integration rate scales. This keeps the bird's recorded velocity
      // comparable across speed modes for debug / score / telemetry.
      scene.timeSlowActive = true;
      scene.playerVelocity = C.TERMINAL_VELOCITY + 200;
      scene.playerY = 100;
      call(scene, 'updatePlayer', 1 / 60);
      expect(scene.playerVelocity).toBeLessThanOrEqual(C.TERMINAL_VELOCITY);
    });
  });

  describe('R84.B3 — Slow-mode trail lifecycle', () => {
    it('slowTrailTimer starts null', () => {
      expect(scene.slowTrailTimer).toBeNull();
      expect(scene.slowTrailParticles).toHaveLength(0);
    });

    it('activatePowerUp(timeSlow) starts trail timer', () => {
      call(scene, 'activatePowerUp', 'timeSlow');
      expect(scene.slowTrailTimer).not.toBeNull();
      expect(scene.time.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          delay: SLOW_MODE.TRAIL_EMIT_INTERVAL_MS,
          loop: true,
        }),
      );
    });

    it('startSlowTrail is idempotent (re-activation preserves existing timer)', () => {
      call(scene, 'startSlowTrail');
      const first = scene.slowTrailTimer;
      call(scene, 'startSlowTrail');
      expect(scene.slowTrailTimer).toBe(first);
    });

    it('stopSlowTrail destroys the timer and clears the field', () => {
      call(scene, 'startSlowTrail');
      const timer = scene.slowTrailTimer;
      call(scene, 'stopSlowTrail');
      expect(timer.destroy).toHaveBeenCalled();
      expect(scene.slowTrailTimer).toBeNull();
    });

    it('emitSlowTrailParticle spawns a yellow circle at the player position', () => {
      scene.player = createMockSprite(120, 210);
      call(scene, 'emitSlowTrailParticle');
      expect(scene.add.circle).toHaveBeenCalledWith(
        120,
        210,
        SLOW_MODE.TRAIL_PARTICLE_RADIUS,
        SLOW_MODE.TRAIL_COLOR,
        SLOW_MODE.TRAIL_PARTICLE_ALPHA,
      );
      expect(scene.slowTrailParticles).toHaveLength(1);
    });

    it('emitSlowTrailParticle registers a fade tween to zero alpha', () => {
      scene.player = createMockSprite(50, 50);
      call(scene, 'emitSlowTrailParticle');
      expect(scene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          alpha: 0,
          duration: SLOW_MODE.TRAIL_PARTICLE_LIFESPAN_MS,
        }),
      );
    });

    it('emitSlowTrailParticle no-ops when paused', () => {
      scene.player = createMockSprite(50, 50);
      scene.isPaused = true;
      call(scene, 'emitSlowTrailParticle');
      expect(scene.add.circle).not.toHaveBeenCalled();
      expect(scene.slowTrailParticles).toHaveLength(0);
    });

    it('emitSlowTrailParticle no-ops when gameOver', () => {
      scene.player = createMockSprite(50, 50);
      scene.isGameOver = true;
      call(scene, 'emitSlowTrailParticle');
      expect(scene.add.circle).not.toHaveBeenCalled();
      expect(scene.slowTrailParticles).toHaveLength(0);
    });

    it('resetState tears down trail timer and destroys live particles', () => {
      scene.player = createMockSprite(80, 80);
      call(scene, 'startSlowTrail');
      call(scene, 'emitSlowTrailParticle');
      call(scene, 'emitSlowTrailParticle');
      const live = [...scene.slowTrailParticles];
      expect(live).toHaveLength(2);
      call(scene, 'resetState');
      expect(scene.slowTrailTimer).toBeNull();
      expect(scene.slowTrailParticles).toHaveLength(0);
      for (const p of live) expect(p.destroy).toHaveBeenCalled();
    });

    it('shutdown tears down trail timer and destroys live particles', () => {
      scene.player = createMockSprite(80, 80);
      call(scene, 'startSlowTrail');
      call(scene, 'emitSlowTrailParticle');
      const live = [...scene.slowTrailParticles];
      expect(live).toHaveLength(1);
      call(scene, 'shutdown');
      expect(scene.slowTrailTimer).toBeNull();
      expect(scene.slowTrailParticles).toHaveLength(0);
      for (const p of live) expect(p.destroy).toHaveBeenCalled();
    });
  });

  describe('R84.B3 — SLOW_MODE config sanity', () => {
    it('trail colour matches POWERUP_DEFS.timeSlow so HUD chip + trail read as one state', () => {
      expect(SLOW_MODE.TRAIL_COLOR).toBe(POWERUP_DEFS.timeSlow.color);
    });

    it('trail depth sits below the player depth (10)', () => {
      // Player is drawn at depth 10 (createPlayer); the trail must slot in
      // behind so breadcrumbs read as "left behind" not "in front of".
      expect(SLOW_MODE.TRAIL_DEPTH).toBeLessThan(10);
    });

    it('emit interval is positive and strictly shorter than particle lifespan', () => {
      // If interval ≥ lifespan, the first particle would fully fade before the
      // next emit — no visible trail, only flashes. Must overlap.
      expect(SLOW_MODE.TRAIL_EMIT_INTERVAL_MS).toBeGreaterThan(0);
      expect(SLOW_MODE.TRAIL_EMIT_INTERVAL_MS).toBeLessThan(SLOW_MODE.TRAIL_PARTICLE_LIFESPAN_MS);
    });

    it('particle alpha sits in (0, 1]', () => {
      expect(SLOW_MODE.TRAIL_PARTICLE_ALPHA).toBeGreaterThan(0);
      expect(SLOW_MODE.TRAIL_PARTICLE_ALPHA).toBeLessThanOrEqual(1);
    });

    it('particle radius is positive (visible size)', () => {
      expect(SLOW_MODE.TRAIL_PARTICLE_RADIUS).toBeGreaterThan(0);
    });
  });

  describe('Shield Mechanics', () => {
    it('shield absorbs collision without losing life', () => {
      scene.shieldActive = true;
      scene.lives = 3;
      call(scene, 'handleCollision');
      expect(scene.shieldActive).toBe(false);
      expect(scene.lives).toBe(3);
    });

    it('shield starts invulnerability', () => {
      scene.shieldActive = true;
      call(scene, 'handleCollision');
      expect(scene.isInvulnerable).toBe(true);
    });

    it('shield break plays hit sound', () => {
      scene.shieldActive = true;
      call(scene, 'handleCollision');
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });
  });

  describe('Collision and Damage', () => {
    it('loses a life on collision', () => {
      scene.lives = 3;
      call(scene, 'handleCollision');
      expect(scene.lives).toBe(2);
    });

    it('resets combo on collision', () => {
      scene.combo = 3.5;
      scene.lives = 3;
      call(scene, 'handleCollision');
      expect(scene.combo).toBe(1.0);
    });

    it('plays hit sound', () => {
      scene.lives = 3;
      call(scene, 'handleCollision');
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('starts invulnerability after hit', () => {
      scene.lives = 3;
      call(scene, 'handleCollision');
      expect(scene.isInvulnerable).toBe(true);
    });

    it('invulnerability prevents further damage', () => {
      scene.lives = 3;
      call(scene, 'handleCollision');
      call(scene, 'handleCollision');
      expect(scene.lives).toBe(2);
    });

    it('camera shakes on collision', () => {
      scene.lives = 3;
      call(scene, 'handleCollision');
      expect(scene.cameras.main.shake).toHaveBeenCalled();
    });
  });

  describe('Game Over', () => {
    it('triggers on 0 lives', () => {
      scene.lives = 1;
      call(scene, 'handleCollision');
      expect(scene.isGameOver).toBe(true);
    });

    it('calls gameOver with score and reason', () => {
      scene.lives = 1;
      scene.score = 150;
      scene.level = 3;
      call(scene, 'handleCollision');
      expect(scene.time.delayedCall).toHaveBeenCalled();
    });

    it('updates highScore if score is higher', () => {
      scene.lives = 1;
      scene.score = 500;
      scene.highScore = 100;
      call(scene, 'handleCollision');
      expect(scene.highScore).toBe(500);
    });

    it('does not update highScore if score is lower', () => {
      scene.lives = 1;
      scene.score = 50;
      scene.highScore = 100;
      call(scene, 'handleCollision');
      expect(scene.highScore).toBe(100);
    });
  });

  describe('Boss Battle', () => {
    it('startBossBattle sets inBossBattle', () => {
      call(scene, 'startBossBattle', 'agent_smith');
      expect(scene.inBossBattle).toBe(true);
    });

    it('startBossBattle creates boss with correct health', () => {
      call(scene, 'startBossBattle', 'agent_smith');
      expect(scene.boss).not.toBeNull();
      expect(scene.boss.health).toBe(150);
      expect(scene.boss.maxHealth).toBe(150);
    });

    it('startBossBattle clears pipes', () => {
      scene.pipes = [
        { topRect: createMockRect(), bottomRect: createMockRect(), x: 100, gapY: 100, passed: false, hit: false },
      ];
      call(scene, 'startBossBattle', 'agent_smith');
      expect(scene.pipes).toHaveLength(0);
    });

    it('startBossBattle clears field power-ups', () => {
      scene.fieldPowerUps = [{ sprite: createMockSprite(), type: 'shield', x: 100, y: 100 }];
      call(scene, 'startBossBattle', 'agent_smith');
      expect(scene.fieldPowerUps).toHaveLength(0);
    });

    it('defeatBoss awards score bonus', () => {
      call(scene, 'startBossBattle', 'agent_smith');
      const prevScore = scene.score;
      call(scene, 'defeatBoss');
      expect(scene.score).toBe(prevScore + 150 * 2);
    });

    it('defeatBoss unlocks agent_smith achievement', () => {
      call(scene, 'startBossBattle', 'agent_smith');
      call(scene, 'defeatBoss');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.BOSS_SLAYER);
    });

    it('defeatBoss unlocks sentinel achievement', () => {
      call(scene, 'startBossBattle', 'sentinel');
      call(scene, 'defeatBoss');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SENTINEL_DEFEAT);
    });

    it('defeatBoss unlocks architect achievement', () => {
      call(scene, 'startBossBattle', 'architect');
      call(scene, 'defeatBoss');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.ARCHITECT_DEFEAT);
    });

    it('defeating all 3 bosses unlocks ALL_BOSSES', () => {
      call(scene, 'startBossBattle', 'agent_smith');
      call(scene, 'defeatBoss');
      call(scene, 'startBossBattle', 'sentinel');
      call(scene, 'defeatBoss');
      call(scene, 'startBossBattle', 'architect');
      call(scene, 'defeatBoss');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.ALL_BOSSES);
    });

    it('endBossBattle resets inBossBattle', () => {
      call(scene, 'startBossBattle', 'agent_smith');
      call(scene, 'endBossBattle', true);
      expect(scene.inBossBattle).toBe(false);
    });

    it('endBossBattle cleans up boss', () => {
      call(scene, 'startBossBattle', 'agent_smith');
      call(scene, 'endBossBattle', true);
      expect(scene.boss).toBeNull();
    });

    it('boss attack collision detection respects invulnerability', () => {
      scene.isInvulnerable = true;
      const attack: any = { sprite: createMockSprite(C.PLAYER_X, scene.playerY), vx: -300, vy: 0, life: 1 };
      const result = call(scene, 'checkAttackPlayerCollision', attack);
      expect(result).toBe(false);
    });
  });

  describe('Achievements', () => {
    it('HIGH_FLYER at score 1000', () => {
      scene.score = 1000;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.HIGH_FLYER);
    });

    it('LEVEL_5 at level 5', () => {
      scene.level = 5;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.LEVEL_5);
    });

    it('POWER_COLLECTOR at 20 power-ups', () => {
      scene.powerUpsCollected = 20;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.POWER_COLLECTOR);
    });

    it('does not unlock achievements below thresholds', () => {
      scene.score = 999;
      scene.level = 4;
      scene.powerUpsCollected = 19;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).not.toHaveBeenCalled();
    });

    it('achievements only unlock once', () => {
      scene.score = 1000;
      call(scene, 'checkAchievements');
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledTimes(1);
    });
  });

  describe('Power-Up Collision Detection', () => {
    it('detects overlap when close', () => {
      const pu: any = { sprite: createMockSprite(), type: 'shield', x: C.PLAYER_X, y: scene.playerY };
      expect(call(scene, 'checkPowerUpCollision', pu)).toBe(true);
    });

    it('no overlap when far away', () => {
      const pu: any = { sprite: createMockSprite(), type: 'shield', x: C.PLAYER_X + 200, y: scene.playerY };
      expect(call(scene, 'checkPowerUpCollision', pu)).toBe(false);
    });
  });

  describe('Speed Multiplier', () => {
    it('timeSlow reduces speed', () => {
      scene.timeSlowActive = true;
      const speedMult = scene.timeSlowActive ? C.TIME_SLOW_FACTOR : 1.0;
      expect(speedMult).toBe(C.TIME_SLOW_FACTOR);
    });

    it('normal speed when no slow', () => {
      const speedMult = scene.timeSlowActive ? C.TIME_SLOW_FACTOR : 1.0;
      expect(speedMult).toBe(1.0);
    });
  });

  describe('Test State Exposure', () => {
    it('getTestState returns all required fields', () => {
      const state = call(scene, 'getTestState');
      expect(state).toHaveProperty('score');
      expect(state).toHaveProperty('lives');
      expect(state).toHaveProperty('level');
      expect(state).toHaveProperty('combo');
      expect(state).toHaveProperty('playerY');
      expect(state).toHaveProperty('playerVelocity');
      expect(state).toHaveProperty('isGameOver');
      expect(state).toHaveProperty('inBossBattle');
      expect(state).toHaveProperty('shieldActive');
      expect(state).toHaveProperty('powerUpsCollected');
      expect(state).toHaveProperty('pipeCount');
    });
  });

  describe('Spawn Pipe', () => {
    it('creates a pipe pair', () => {
      call(scene, 'spawnPipe');
      expect(scene.pipes).toHaveLength(1);
    });

    it('pipe has required properties', () => {
      call(scene, 'spawnPipe');
      const pipe = scene.pipes[0];
      expect(pipe).toHaveProperty('topRect');
      expect(pipe).toHaveProperty('bottomRect');
      expect(pipe).toHaveProperty('x');
      expect(pipe).toHaveProperty('gapY');
      expect(pipe.passed).toBe(false);
      expect(pipe.hit).toBe(false);
    });

    it('pipe gapY is within valid range', () => {
      for (let i = 0; i < 20; i++) {
        call(scene, 'spawnPipe');
      }
      for (const pipe of scene.pipes) {
        expect(pipe.gapY).toBeGreaterThanOrEqual(C.PIPE_MIN_HEIGHT);
        expect(pipe.gapY + C.PIPE_GAP).toBeLessThanOrEqual(C.HEIGHT - C.GROUND_HEIGHT);
      }
    });
  });

  describe('Sprite Mode', () => {
    it('uses procedural player texture when spriteMode is false', () => {
      scene.game.registry.get = vi.fn().mockReturnValue(false);
      scene.player = createMockSprite(C.PLAYER_X, C.HEIGHT * 0.4);
      call(scene, 'updatePlayerTexture');
      expect(scene.player.setTexture).toHaveBeenCalledWith('player');
    });

    it('uses tinting instead of texture swap in sprite mode', () => {
      scene.game.registry.get = vi.fn().mockReturnValue(true);
      scene.player = createMockSprite(C.PLAYER_X, C.HEIGHT * 0.4);
      scene.isInvulnerable = false;
      scene.shieldActive = false;
      call(scene, 'updatePlayerTexture');
      expect(scene.player.clearTint).toHaveBeenCalled();
    });

    it('tints red when damaged in sprite mode', () => {
      scene.game.registry.get = vi.fn().mockReturnValue(true);
      scene.player = createMockSprite(C.PLAYER_X, C.HEIGHT * 0.4);
      scene.isInvulnerable = true;
      call(scene, 'updatePlayerTexture');
      expect(scene.player.setTint).toHaveBeenCalledWith(0xff4444);
    });

    it('tints magenta when shielded in sprite mode', () => {
      scene.game.registry.get = vi.fn().mockReturnValue(true);
      scene.player = createMockSprite(C.PLAYER_X, C.HEIGHT * 0.4);
      scene.isInvulnerable = false;
      scene.shieldActive = true;
      call(scene, 'updatePlayerTexture');
      expect(scene.player.setTint).toHaveBeenCalledWith(0xff00ff);
    });
  });

  describe('Cleanup', () => {
    it('shutdown destroys all pipes', () => {
      call(scene, 'spawnPipe');
      call(scene, 'spawnPipe');
      const pipes = [...scene.pipes];
      call(scene, 'shutdown');
      for (const pipe of pipes) {
        expect(pipe.topRect.destroy).toHaveBeenCalled();
        expect(pipe.bottomRect.destroy).toHaveBeenCalled();
      }
    });

    it('shutdown clears boss state', () => {
      call(scene, 'startBossBattle', 'agent_smith');
      call(scene, 'shutdown');
      expect(scene.boss).toBeNull();
      expect(scene.bossAttacks).toHaveLength(0);
    });

    it('shutdown removes keyboard listeners', () => {
      call(scene, 'shutdown');
      expect(scene.input.keyboard.removeAllKeys).toHaveBeenCalled();
    });
  });

  // R84.B4: pipe-variant progression. Each subdescribe pins a slice of the
  // moving/zapper/bonus behaviour so future refactors either keep the
  // specified shape or fail loudly.
  describe('R84.B4 Pipe variants', () => {
    describe('pickPipeKind (score gating)', () => {
      it('returns "normal" at score 0 regardless of random roll', () => {
        scene.score = 0;
        const rolls = [0.0, 0.25, 0.5, 0.75, 0.99];
        for (const r of rolls) {
          vi.spyOn(Math, 'random').mockReturnValueOnce(r);
          expect(call(scene, 'pickPipeKind')).toBe('normal');
        }
      });

      it('never picks "moving" below MOVING_UNLOCK_SCORE', () => {
        scene.score = PIPE_VARIANTS.MOVING_UNLOCK_SCORE - 1;
        for (let i = 0; i < 10; i++) {
          vi.spyOn(Math, 'random').mockReturnValueOnce(0.95);
          expect(call(scene, 'pickPipeKind')).toBe('normal');
        }
      });

      it('can pick "moving" at MOVING_UNLOCK_SCORE', () => {
        scene.score = PIPE_VARIANTS.MOVING_UNLOCK_SCORE;
        // bag = {normal:10, moving:3}, total 13. Moving bucket is roll ≥ 10.
        vi.spyOn(Math, 'random').mockReturnValueOnce(0.95);
        expect(call(scene, 'pickPipeKind')).toBe('moving');
      });

      it('can pick "zapper" at ZAPPER_UNLOCK_SCORE', () => {
        scene.score = PIPE_VARIANTS.ZAPPER_UNLOCK_SCORE;
        // bag total = 10+3+2 = 15. Zapper bucket is roll ≥ 13 → random ≥ 13/15.
        vi.spyOn(Math, 'random').mockReturnValueOnce(0.95);
        expect(call(scene, 'pickPipeKind')).toBe('zapper');
      });

      it('can pick "bonus" at BONUS_UNLOCK_SCORE', () => {
        scene.score = PIPE_VARIANTS.BONUS_UNLOCK_SCORE;
        // bag total = 10+3+2+1 = 16. Bonus bucket is roll ≥ 15 → random ≥ 15/16.
        vi.spyOn(Math, 'random').mockReturnValueOnce(0.99);
        expect(call(scene, 'pickPipeKind')).toBe('bonus');
      });
    });

    describe('Moving pipe drift', () => {
      function makeMovingPipe(baseGapY = 150) {
        return {
          topRect: createMockRect(),
          bottomRect: createMockRect(),
          x: 400,
          gapY: baseGapY,
          baseGapY,
          passed: false,
          hit: false,
          kind: 'moving' as const,
          gap: C.PIPE_GAP,
          driftAmp: PIPE_VARIANTS.MOVING_DRIFT_AMP,
          driftFreqHz: PIPE_VARIANTS.MOVING_DRIFT_FREQ_HZ,
          driftPhase: 0,
          elapsedMs: 0,
        };
      }

      it('gapY reaches baseGapY + amplitude at quarter cycle', () => {
        const pipe = makeMovingPipe(150);
        const quarterMs = 1000 / (4 * PIPE_VARIANTS.MOVING_DRIFT_FREQ_HZ);
        call(scene, 'updateMovingPipe', pipe, quarterMs);
        expect(pipe.gapY).toBeCloseTo(150 + PIPE_VARIANTS.MOVING_DRIFT_AMP, 0);
      });

      it('elapsedMs accumulates by delta', () => {
        const pipe = makeMovingPipe(150);
        call(scene, 'updateMovingPipe', pipe, 100);
        expect(pipe.elapsedMs).toBe(100);
        call(scene, 'updateMovingPipe', pipe, 50);
        expect(pipe.elapsedMs).toBe(150);
      });

      it('clamps gapY to playable bounds', () => {
        const pipe = makeMovingPipe(C.PIPE_MIN_HEIGHT);
        pipe.driftAmp = 1000; // Way beyond the bounds
        pipe.driftPhase = Math.PI; // sin goes strongly negative first quarter
        const quarterMs = 1000 / (4 * PIPE_VARIANTS.MOVING_DRIFT_FREQ_HZ);
        call(scene, 'updateMovingPipe', pipe, quarterMs);
        expect(pipe.gapY).toBeGreaterThanOrEqual(C.PIPE_MIN_HEIGHT);
        const playableHeight = C.HEIGHT - C.GROUND_HEIGHT;
        expect(pipe.gapY + C.PIPE_GAP).toBeLessThanOrEqual(playableHeight);
      });

      it('resizes top and bottom rects each tick', () => {
        const pipe = makeMovingPipe(150);
        call(scene, 'updateMovingPipe', pipe, 50);
        expect(pipe.topRect.setSize).toHaveBeenCalled();
        expect(pipe.bottomRect.setSize).toHaveBeenCalled();
      });
    });

    describe('Zapper pipe cycle + collision', () => {
      function makeZapperPipe(overrides: Record<string, unknown> = {}) {
        return {
          topRect: createMockRect(),
          bottomRect: createMockRect(),
          arc: createMockGraphics(),
          x: C.PLAYER_X - 10,
          gapY: 50,
          baseGapY: 50,
          passed: false,
          hit: false,
          kind: 'zapper' as const,
          gap: C.PIPE_GAP,
          arcElapsedMs: 0,
          arcActive: false,
          arcTelegraphed: false,
          bonusSpawned: false,
          ...overrides,
        };
      }

      it('arc active at start of cycle', () => {
        const pipe = makeZapperPipe({ arcElapsedMs: 0 });
        call(scene, 'updateZapperPipe', pipe, 10);
        expect(pipe.arcActive).toBe(true);
      });

      it('arc inactive past ZAPPER_ACTIVE_FRACTION of cycle', () => {
        const pipe = makeZapperPipe();
        call(scene, 'updateZapperPipe', pipe, PIPE_VARIANTS.ZAPPER_CYCLE_MS * 0.5);
        expect(pipe.arcActive).toBe(false);
      });

      it('plays danger warning on arc activation edge', () => {
        const pipe = makeZapperPipe();
        scene.playSound.mockClear();
        call(scene, 'updateZapperPipe', pipe, 10);
        expect(scene.playSound).toHaveBeenCalledWith('dangerWarning');
      });

      it('checkZapperCollision zeroes lives when player is in gap', () => {
        const pipe = makeZapperPipe({ arcActive: true });
        scene.playerY = 50 + C.PIPE_GAP / 2;
        scene.lives = 3;
        const handleGameOver = vi.spyOn(scene, 'handleGameOver');
        call(scene, 'checkZapperCollision', pipe);
        expect(scene.lives).toBe(0);
        expect(handleGameOver).toHaveBeenCalled();
      });

      it('zapper bypasses shield — shielded player still dies', () => {
        const pipe = makeZapperPipe({ arcActive: true });
        scene.shieldActive = true;
        scene.playerY = 50 + C.PIPE_GAP / 2;
        const handleGameOver = vi.spyOn(scene, 'handleGameOver');
        call(scene, 'checkZapperCollision', pipe);
        expect(handleGameOver).toHaveBeenCalled();
        expect(scene.lives).toBe(0);
      });

      it('no zapper death when player is in pipe BODY (above gap)', () => {
        const pipe = makeZapperPipe({ arcActive: true });
        scene.playerY = 10; // above gap
        const handleGameOver = vi.spyOn(scene, 'handleGameOver');
        call(scene, 'checkZapperCollision', pipe);
        expect(handleGameOver).not.toHaveBeenCalled();
      });

      it('no zapper death when pipe is far from player x', () => {
        const pipe = makeZapperPipe({ arcActive: true, x: C.PLAYER_X + 400 });
        scene.playerY = 50 + C.PIPE_GAP / 2;
        const handleGameOver = vi.spyOn(scene, 'handleGameOver');
        call(scene, 'checkZapperCollision', pipe);
        expect(handleGameOver).not.toHaveBeenCalled();
      });
    });

    describe('handleZapperDeath', () => {
      it('zeroes lives even with shield active', () => {
        scene.shieldActive = true;
        scene.lives = 5;
        const handleGameOver = vi.spyOn(scene, 'handleGameOver');
        call(scene, 'handleZapperDeath');
        expect(scene.lives).toBe(0);
        expect(handleGameOver).toHaveBeenCalled();
      });

      it('plays glassBreak SFX', () => {
        scene.playSound.mockClear();
        call(scene, 'handleZapperDeath');
        expect(scene.playSound).toHaveBeenCalledWith('glassBreak');
      });

      it('breaks combo back to 1.0', () => {
        scene.combo = 4.2;
        call(scene, 'handleZapperDeath');
        expect(scene.combo).toBe(1.0);
      });
    });

    describe('Bonus pipe', () => {
      beforeEach(() => {
        scene.score = PIPE_VARIANTS.BONUS_UNLOCK_SCORE;
        scene.pickPipeKind = () => 'bonus';
      });

      it('spawnPipe with bonus kind narrows the gap', () => {
        call(scene, 'spawnPipe');
        const pipe = scene.pipes[0];
        expect(pipe.kind).toBe('bonus');
        expect(pipe.gap).toBe(Math.round(C.PIPE_GAP * PIPE_VARIANTS.BONUS_GAP_SCALE));
      });

      it('bonus pipe seeds a power-up in the gap centre', () => {
        call(scene, 'spawnPipe');
        const pipe = scene.pipes[0];
        expect(scene.fieldPowerUps).toHaveLength(1);
        const pu = scene.fieldPowerUps[0];
        expect(pu.x).toBeCloseTo(pipe.x + C.PIPE_WIDTH / 2, 0);
        const expectedY = pipe.gapY + (pipe.gap ?? C.PIPE_GAP) / 2;
        expect(pu.y).toBeCloseTo(expectedY, 0);
      });

      it('scorePipe awards BONUS_SCORE_MULT × base for bonus', () => {
        const bonusPipe = { kind: 'bonus' } as any;
        scene.combo = 1.0;
        scene.score = 0;
        call(scene, 'scorePipe', bonusPipe);
        expect(scene.score).toBe(Math.floor(C.SCORE_PER_PIPE * PIPE_VARIANTS.BONUS_SCORE_MULT));
      });

      it('scorePipe plays levelUp cue on bonus', () => {
        scene.playSound.mockClear();
        call(scene, 'scorePipe', { kind: 'bonus' } as any);
        expect(scene.playSound).toHaveBeenCalledWith('levelUp');
      });

      it('does NOT play levelUp cue on normal pipe scoring', () => {
        // Reset score so scorePipe doesn't cross a LEVEL_THRESHOLD boundary
        // and trigger the unrelated onLevelUp cue.
        scene.score = 0;
        scene.combo = 1.0;
        scene.level = 1;
        scene.playSound.mockClear();
        call(scene, 'scorePipe');
        expect(scene.playSound).not.toHaveBeenCalledWith('levelUp');
      });
    });

    describe('checkPipeCollision honours per-pipe gap', () => {
      it('narrower bonus gap triggers collision where normal gap would not', () => {
        const narrowGap = Math.round(C.PIPE_GAP * PIPE_VARIANTS.BONUS_GAP_SCALE);
        const pipe: any = {
          x: C.PLAYER_X - 10,
          gapY: 100,
          gap: narrowGap,
          kind: 'bonus',
          passed: false,
          hit: false,
          topRect: createMockRect(),
          bottomRect: createMockRect(),
        };
        scene.playerY = 100 + narrowGap + 10; // Below narrow gap, would still be inside normal gap
        call(scene, 'checkPipeCollision', pipe);
        expect(pipe.hit).toBe(true);
      });
    });

    describe('Pipe styling', () => {
      it('getPipeStyle returns four distinct fill colours (normal/moving/zapper/bonus)', () => {
        const kinds = ['normal', 'moving', 'zapper', 'bonus'] as const;
        const fills = kinds.map(k => call(scene, 'getPipeStyle', k).fill);
        expect(new Set(fills).size).toBe(4);
      });

      it('getPipeStyle returns four distinct stroke colours', () => {
        const kinds = ['normal', 'moving', 'zapper', 'bonus'] as const;
        const strokes = kinds.map(k => call(scene, 'getPipeStyle', k).stroke);
        expect(new Set(strokes).size).toBe(4);
      });
    });

    describe('destroyPipe lifecycle', () => {
      it('destroys arc graphic when present on pipe', () => {
        const arc = createMockGraphics();
        const pipe: any = {
          topRect: createMockRect(),
          bottomRect: createMockRect(),
          arc,
        };
        call(scene, 'destroyPipe', pipe);
        expect(arc.destroy).toHaveBeenCalled();
        expect(pipe.topRect.destroy).toHaveBeenCalled();
        expect(pipe.bottomRect.destroy).toHaveBeenCalled();
      });

      it('does not throw when pipe has no arc', () => {
        const pipe: any = {
          topRect: createMockRect(),
          bottomRect: createMockRect(),
        };
        expect(() => call(scene, 'destroyPipe', pipe)).not.toThrow();
      });
    });
  });

  describe('R84.B5 — 3-layer parallax', () => {
    describe('PARALLAX config sanity', () => {
      it('scrollFactors step far < mid < near', () => {
        expect(PARALLAX.FAR.SCROLL_FACTOR).toBeLessThan(PARALLAX.MID.SCROLL_FACTOR);
        expect(PARALLAX.MID.SCROLL_FACTOR).toBeLessThan(PARALLAX.NEAR.SCROLL_FACTOR);
      });

      it('depths step far (0) < mid (1) < near (2), all beneath pipes (3)', () => {
        expect(PARALLAX.FAR.DEPTH).toBe(0);
        expect(PARALLAX.MID.DEPTH).toBe(1);
        expect(PARALLAX.NEAR.DEPTH).toBe(2);
        expect(PARALLAX.NEAR.DEPTH).toBeLessThan(3);
      });

      it('alphas scale up far < mid < near so closer reads brighter', () => {
        expect(PARALLAX.FAR.ALPHA).toBeLessThan(PARALLAX.MID.ALPHA);
        expect(PARALLAX.MID.ALPHA).toBeLessThan(PARALLAX.NEAR.ALPHA);
        expect(PARALLAX.NEAR.ALPHA).toBeLessThanOrEqual(1);
      });

      it('near font size > mid font size (closer = bigger glyphs)', () => {
        expect(PARALLAX.NEAR.FONT_SIZE).toBeGreaterThan(PARALLAX.MID.FONT_SIZE);
      });

      it('vertical speed ranges are positive and min <= max per layer', () => {
        expect(PARALLAX.MID.VERTICAL_SPEED_MIN).toBeGreaterThan(0);
        expect(PARALLAX.MID.VERTICAL_SPEED_MAX).toBeGreaterThanOrEqual(PARALLAX.MID.VERTICAL_SPEED_MIN);
        expect(PARALLAX.NEAR.VERTICAL_SPEED_MIN).toBeGreaterThan(0);
        expect(PARALLAX.NEAR.VERTICAL_SPEED_MAX).toBeGreaterThanOrEqual(PARALLAX.NEAR.VERTICAL_SPEED_MIN);
      });

      it('near vertical speeds exceed mid vertical speeds (closer = faster fall)', () => {
        expect(PARALLAX.NEAR.VERTICAL_SPEED_MIN).toBeGreaterThan(PARALLAX.MID.VERTICAL_SPEED_MIN);
        expect(PARALLAX.NEAR.VERTICAL_SPEED_MAX).toBeGreaterThan(PARALLAX.MID.VERTICAL_SPEED_MAX);
      });

      it('densities positive for both rain layers', () => {
        expect(PARALLAX.MID.DENSITY).toBeGreaterThan(0);
        expect(PARALLAX.NEAR.DENSITY).toBeGreaterThan(0);
      });
    });

    describe('createParallaxFarLayer', () => {
      it('no-ops when bg_city texture is absent', () => {
        scene.textures = { exists: vi.fn().mockReturnValue(false) };
        scene.add.tileSprite = vi.fn();
        call(scene, 'createParallaxFarLayer');
        expect(scene.add.tileSprite).not.toHaveBeenCalled();
        expect(s(scene, 'parallaxFar')).toBeNull();
      });

      it('creates a tinted TileSprite at FAR depth when bg_city exists', () => {
        scene.textures = { exists: vi.fn().mockReturnValue(true) };
        const mockTile: any = {
          setAlpha: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setTint: vi.fn().mockReturnThis(),
          tilePositionX: 0,
          destroy: vi.fn(),
        };
        scene.add.tileSprite = vi.fn().mockReturnValue(mockTile);
        call(scene, 'createParallaxFarLayer');
        expect(scene.add.tileSprite).toHaveBeenCalledWith(
          GAME_CONFIG.WIDTH / 2,
          GAME_CONFIG.HEIGHT / 2,
          GAME_CONFIG.WIDTH,
          GAME_CONFIG.HEIGHT,
          'bg_city',
        );
        expect(mockTile.setAlpha).toHaveBeenCalledWith(PARALLAX.FAR.ALPHA);
        expect(mockTile.setDepth).toHaveBeenCalledWith(PARALLAX.FAR.DEPTH);
        expect(mockTile.setTint).toHaveBeenCalled();
        expect(s(scene, 'parallaxFar')).toBe(mockTile);
      });
    });

    describe('updateParallaxLayers', () => {
      it('advances parallaxFar.tilePositionX at FAR.SCROLL_FACTOR × pipe speed', () => {
        const mockTile: any = { tilePositionX: 0 };
        scene.parallaxFar = mockTile;
        scene.parallaxMidRain = null;
        scene.parallaxNearRain = null;
        call(scene, 'updateParallaxLayers', 1000, 1.0);
        // 1000 ms × 1.0 mult × PIPE_SPEED × 0.1 = 200 × 1 × 0.1 = 20 px
        expect(mockTile.tilePositionX).toBeCloseTo(GAME_CONFIG.PIPE_SPEED * PARALLAX.FAR.SCROLL_FACTOR, 5);
      });

      it('scales horizontal drift by speedMult (time-slow dampens parallax)', () => {
        const mockTile: any = { tilePositionX: 0 };
        scene.parallaxFar = mockTile;
        scene.parallaxMidRain = null;
        scene.parallaxNearRain = null;
        call(scene, 'updateParallaxLayers', 1000, GAME_CONFIG.TIME_SLOW_FACTOR);
        expect(mockTile.tilePositionX).toBeCloseTo(
          GAME_CONFIG.PIPE_SPEED * GAME_CONFIG.TIME_SLOW_FACTOR * PARALLAX.FAR.SCROLL_FACTOR,
          5,
        );
      });

      it('safely no-ops when all three parallax fields are null', () => {
        scene.parallaxFar = null;
        scene.parallaxMidRain = null;
        scene.parallaxNearRain = null;
        expect(() => call(scene, 'updateParallaxLayers', 16, 1.0)).not.toThrow();
      });
    });

    describe('updateParallaxRainLayer', () => {
      const makeRainChar = (x: number, y: number, verticalSpeed: number) => {
        const data: Record<string, unknown> = { verticalSpeed };
        const text: any = {
          x, y,
          setText: vi.fn().mockReturnThis(),
          getData: vi.fn((k: string) => data[k]),
          setData: vi.fn((k: string, v: unknown) => { data[k] = v; }),
        };
        return text;
      };

      it('drifts characters LEFT at SCROLL_FACTOR × PIPE_SPEED × dt', () => {
        const char = makeRainChar(500, 100, 60);
        const group = { getChildren: () => [char] };
        // delta 1000 ms, mult 1.0, MID scrollFactor 0.3 → 200 × 0.3 × 1.0 × 1.0 = 60 px
        call(scene, 'updateParallaxRainLayer', group, PARALLAX.MID, 1000, 1.0);
        // horizontal minus 60, vertical plus 60 (vertical speed × 1s)
        expect(char.x).toBeCloseTo(500 - GAME_CONFIG.PIPE_SPEED * PARALLAX.MID.SCROLL_FACTOR, 5);
        expect(char.y).toBeCloseTo(100 + 60, 5);
      });

      it('wraps characters that drift past left edge to WIDTH + fontSize', () => {
        const char = makeRainChar(-PARALLAX.MID.FONT_SIZE - 1, 50, 50);
        const group = { getChildren: () => [char] };
        (Phaser as any).Math.Between = vi.fn().mockReturnValue(0);
        call(scene, 'updateParallaxRainLayer', group, PARALLAX.MID, 16, 1.0);
        expect(char.x).toBe(GAME_CONFIG.WIDTH + PARALLAX.MID.FONT_SIZE);
        expect(char.setText).toHaveBeenCalled();
      });

      it('wraps characters that fall past bottom to y = -20 with new x + char', () => {
        const char = makeRainChar(100, GAME_CONFIG.HEIGHT + 25, 50);
        const group = { getChildren: () => [char] };
        (Phaser as any).Math.Between = vi.fn().mockReturnValue(400);
        call(scene, 'updateParallaxRainLayer', group, PARALLAX.MID, 16, 1.0);
        expect(char.y).toBe(-20);
        expect(char.x).toBe(400);
        expect(char.setText).toHaveBeenCalled();
      });

      it('no-ops when group is null', () => {
        expect(() => call(scene, 'updateParallaxRainLayer', null, PARALLAX.MID, 16, 1.0)).not.toThrow();
      });

      it('treats missing verticalSpeed data as 0 (defensive)', () => {
        const data: Record<string, unknown> = {}; // no verticalSpeed key
        const char: any = {
          x: 400, y: 50,
          setText: vi.fn().mockReturnThis(),
          getData: vi.fn((k: string) => data[k]),
        };
        const group = { getChildren: () => [char] };
        call(scene, 'updateParallaxRainLayer', group, PARALLAX.MID, 1000, 1.0);
        // y should stay put (0 * dt), x should drift left by 60
        expect(char.y).toBe(50);
        expect(char.x).toBeCloseTo(400 - GAME_CONFIG.PIPE_SPEED * PARALLAX.MID.SCROLL_FACTOR, 5);
      });

      it('near layer drifts faster than mid layer per frame', () => {
        const midChar = makeRainChar(500, 100, 50);
        const nearChar = makeRainChar(500, 100, 50);
        call(scene, 'updateParallaxRainLayer', { getChildren: () => [midChar] }, PARALLAX.MID, 1000, 1.0);
        call(scene, 'updateParallaxRainLayer', { getChildren: () => [nearChar] }, PARALLAX.NEAR, 1000, 1.0);
        // near.x should be smaller (drifted further left)
        expect(nearChar.x).toBeLessThan(midChar.x);
      });
    });

    describe('destroyParallaxLayers', () => {
      it('destroys all three layer handles and nulls the fields', () => {
        const farMock: any = { destroy: vi.fn() };
        const midMock: any = { destroy: vi.fn() };
        const nearMock: any = { destroy: vi.fn() };
        scene.parallaxFar = farMock;
        scene.parallaxMidRain = midMock;
        scene.parallaxNearRain = nearMock;
        call(scene, 'destroyParallaxLayers');
        expect(farMock.destroy).toHaveBeenCalled();
        expect(midMock.destroy).toHaveBeenCalledWith(true);
        expect(nearMock.destroy).toHaveBeenCalledWith(true);
        expect(s(scene, 'parallaxFar')).toBeNull();
        expect(s(scene, 'parallaxMidRain')).toBeNull();
        expect(s(scene, 'parallaxNearRain')).toBeNull();
      });

      it('is safe to call when no layers exist', () => {
        scene.parallaxFar = null;
        scene.parallaxMidRain = null;
        scene.parallaxNearRain = null;
        expect(() => call(scene, 'destroyParallaxLayers')).not.toThrow();
      });
    });
  });

  // R84.B8: pause→resume 5-second countdown. BaseScene's togglePause() routes
  // the un-pause branch through resumeGame(); MatrixCloudGameScene overrides
  // that to re-run startCountdown(5,...) after super unfreezes physics. The
  // override was shipped in R83.B1(c) but had zero test coverage — these pins
  // the contract so a future refactor can't silently drop the countdown and
  // leave the bird plummeting from an invisible spawn the instant the overlay
  // lifts. Tests stub the BaseScene super call's missing-from-global-mock
  // touch-points (physics/tweens.resumeAll/canvas.focus) inline rather than
  // adding them to createTestScene, because the 150+ unrelated existing tests
  // assume the minimal surface.
  describe('R84.B8 — Pause→resume 5s countdown', () => {
    beforeEach(() => {
      scene.physics = { world: {}, resume: vi.fn(), pause: vi.fn() };
      scene.tweens.resumeAll = vi.fn();
      scene.tweens.pauseAll = vi.fn();
      scene.game.canvas = { focus: vi.fn() };
      scene.isGameOver = false;
      scene.isCountingDown = false;
      scene.isPaused = true;
    });

    it('starts a 5-second countdown when not gameOver and not already counting', () => {
      scene.startCountdown = vi.fn();
      call(scene, 'resumeGame');
      expect(scene.startCountdown).toHaveBeenCalledTimes(1);
      expect(scene.startCountdown).toHaveBeenCalledWith(5, expect.any(Function));
    });

    it('skips countdown when isGameOver is true', () => {
      scene.isGameOver = true;
      scene.startCountdown = vi.fn();
      call(scene, 'resumeGame');
      expect(scene.startCountdown).not.toHaveBeenCalled();
    });

    it('skips countdown when a countdown is already running', () => {
      // Super's resumeGame doesn't touch isCountingDown — the override guard
      // is the only protection against stacking a second countdown on a
      // rapid double-resume (e.g. dashbar click while initial countdown is
      // still ticking). Pinning the guard here blocks a refactor from
      // inverting the early-return.
      scene.isCountingDown = true;
      scene.startCountdown = vi.fn();
      call(scene, 'resumeGame');
      expect(scene.startCountdown).not.toHaveBeenCalled();
    });

    it('unfreezes physics/tweens/time BEFORE starting the countdown', () => {
      // The ordering invariant matters: startCountdown uses time.delayedCall
      // to tick digits; if super ran AFTER it, time.paused would still be
      // true and the countdown would hang on "5" forever. We verify order
      // via invocationCallOrder on the super-side side-effects.
      const order: string[] = [];
      scene.physics.resume = vi.fn(() => order.push('physics.resume'));
      scene.tweens.resumeAll = vi.fn(() => order.push('tweens.resumeAll'));
      const originalDescriptor = Object.getOwnPropertyDescriptor(scene.time, 'paused');
      let timePausedValue = true;
      Object.defineProperty(scene.time, 'paused', {
        configurable: true,
        get: () => timePausedValue,
        set: (v: boolean) => {
          timePausedValue = v;
          if (!v) order.push('time.paused=false');
        },
      });
      scene.startCountdown = vi.fn(() => order.push('startCountdown'));

      try {
        call(scene, 'resumeGame');
      } finally {
        if (originalDescriptor) {
          Object.defineProperty(scene.time, 'paused', originalDescriptor);
        }
      }

      const countdownIdx = order.indexOf('startCountdown');
      expect(countdownIdx).toBeGreaterThan(-1);
      expect(order.indexOf('physics.resume')).toBeLessThan(countdownIdx);
      expect(order.indexOf('tweens.resumeAll')).toBeLessThan(countdownIdx);
      expect(order.indexOf('time.paused=false')).toBeLessThan(countdownIdx);
    });

    it('update() early-returns while countdown is active so physics stays frozen', () => {
      // With isCountingDown=true, update() must skip its physics/pipe/HUD
      // pipeline — the player shouldn't fall and pipes shouldn't scroll
      // during the 5-second re-orient window. exposeTestState is the last
      // line of update(), so its absence proves the early-return fired.
      scene.isCountingDown = true;
      scene.isPaused = false;
      scene.isGameOver = false;
      scene.exposeTestState.mockClear();
      scene.handleInput = vi.fn();
      scene.updatePlayer = vi.fn();
      scene.updatePipes = vi.fn();
      scene.updateHUD = vi.fn();
      scene.updateParallaxLayers = vi.fn();

      call(scene, 'update', 1000, 16);

      expect(scene.exposeTestState).not.toHaveBeenCalled();
      expect(scene.updatePlayer).not.toHaveBeenCalled();
      expect(scene.updatePipes).not.toHaveBeenCalled();
      expect(scene.updateHUD).not.toHaveBeenCalled();
    });

    it('passes a no-op onComplete callback (countdown merely gates, no post-tick logic)', () => {
      // The override intentionally passes `() => {}` — unlike the initial-run
      // create() countdown that might fire extra onComplete logic, the
      // pause-resume path just needs the isCountingDown gate released, which
      // BaseScene.tickCountdownStep already does internally. If a future
      // refactor accidentally forwards a non-noop callback here, it'd fire
      // a second time after the bird has been playing for 5s — nonsensical
      // state. This test pins the noop.
      const spy = vi.fn();
      scene.startCountdown = spy;
      call(scene, 'resumeGame');
      const callback = spy.mock.calls[0]?.[1];
      expect(typeof callback).toBe('function');
      expect(() => callback()).not.toThrow();
      // Noop: returns undefined, produces no observable side-effect on scene.
      expect(callback()).toBeUndefined();
    });
  });
});
