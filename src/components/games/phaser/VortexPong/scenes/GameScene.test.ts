/**
 * VortexPongGameScene — Unit Tests
 *
 * Phaser is fully mocked (jsdom cannot do WebGL). We construct the scene,
 * bind prototype methods onto the mock instance, then stub out BaseScene
 * helpers and Phaser APIs. This lets us test game logic in isolation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VortexPongGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS, POWERUP_LEGEND, type GoalFlashPreset } from '../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function createTestScene() {
  const scene = new VortexPongGameScene() as any;

  for (const name of collectPrototypeMethods(VortexPongGameScene)) {
    const fn = VortexPongGameScene.prototype[name as keyof typeof VortexPongGameScene.prototype];
    if (typeof fn === 'function') {
      scene[name] = (fn as any).bind(scene);
    }
  }

  // BaseScene helpers
  scene.playSound = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();
  scene.createMatrixText = vi.fn().mockReturnValue({
    setText: vi.fn(),
    setAlpha: vi.fn(),
    destroy: vi.fn(),
  });
  scene.createMatrixBackground = vi.fn();
  scene.addMatrixRain = vi.fn().mockReturnValue({ getChildren: vi.fn().mockReturnValue([]) });
  scene.updateMatrixRain = vi.fn();
  scene.exposeTestState = vi.fn();
  scene.setupCommonInputs = vi.fn();
  scene.stopBackgroundMusic = vi.fn();

  // Phaser camera
  scene.cameras = {
    main: { shake: vi.fn(), flash: vi.fn(), setBackgroundColor: vi.fn() },
  };

  // Phaser sound manager (used by stopAllAudio for R-restart)
  scene.sound = { stopAll: vi.fn(), mute: false };

  // Tweens
  scene.tweens = {
    add: vi.fn(),
    killTweensOf: vi.fn(),
    killAll: vi.fn(),
  };

  // Timer — R84.P5 adds `.remove()` so the legend hide timer can be
  // cancelled safely without invoking its callback.
  scene.time = {
    addEvent: vi.fn().mockReturnValue({ destroy: vi.fn(), remove: vi.fn(), delay: 0 }),
    delayedCall: vi.fn().mockImplementation((_ms: number, cb: () => void) => ({
      destroy: vi.fn(),
      remove: vi.fn(),
      callback: cb,
    })),
    removeAllEvents: vi.fn(),
  };

  // Input
  scene.input = {
    keyboard: {
      addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }),
      removeAllKeys: vi.fn(),
    },
    activePointer: { isDown: false, wasTouch: false, y: 0 },
  };

  // Graphics — fresh instance per call so vortex backdrop, scanline overlay
  // and centre-line don't share the same mock and stomp on each other's
  // call records.
  scene.add = {
    graphics: vi.fn().mockImplementation(() => {
      const g: any = {
        lineStyle: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        strokePath: vi.fn(),
        fillStyle: vi.fn(),
        fillCircle: vi.fn(),
        strokeCircle: vi.fn(),
        fillRect: vi.fn(),
        generateTexture: vi.fn(),
        setStrokeStyle: vi.fn(),
        // R84.P4 — atmosphere uses these chainable setters.
        setPosition: vi.fn(function (this: any, x: number, y: number) { this.x = x; this.y = y; return this; }),
        setDepth: vi.fn(function (this: any, z: number) { this.depth = z; return this; }),
        setScale: vi.fn(function (this: any, sx: number, sy?: number) {
          this.scaleX = sx; this.scaleY = sy ?? sx; return this;
        }),
        setAlpha: vi.fn(function (this: any, a: number) { this.alpha = a; return this; }),
        rotation: 0,
        destroy: vi.fn(),
      };
      return g;
    }),
    rectangle: vi.fn().mockImplementation((x: number, y: number, w: number, h: number, color?: number, alpha?: number) => {
      const r: any = {
        x, y, width: w, height: h, color, alpha, scale: 1,
        setSize: vi.fn(),
        setDepth: vi.fn(function (this: any, z: number) { this.depth = z; return this; }),
        setAlpha: vi.fn(function (this: any, a: number) { this.alpha = a; return this; }),
        setScale: vi.fn(function (this: any, s: number) { this.scale = s; return this; }),
        destroy: vi.fn(),
      };
      return r;
    }),
    image: vi.fn().mockImplementation((x: number, y: number) => ({
      x, y,
      setDisplaySize: vi.fn(),
      setDepth: vi.fn(),
      setAlpha: vi.fn(),
      destroy: vi.fn(),
    })),
    // R84.P6 — sprite mock tracks `setTint` + `tint` so multi-ball cyan-tint
    // assertions can read the applied colour directly from the mock instance.
    sprite: vi.fn().mockImplementation((x: number, y: number, texture?: string) => {
      const s: any = {
        x, y, texture,
        tint: 0xffffff,
        setAlpha: vi.fn(),
        setTint: vi.fn(function (this: any, colour: number) { this.tint = colour; return this; }),
        destroy: vi.fn(),
      };
      return s;
    }),
    circle: vi.fn().mockImplementation((x: number, y: number, r: number) => ({
      x, y, radius: r,
      setStrokeStyle: vi.fn(),
      setScale: vi.fn(),
      setAlpha: vi.fn(),
      destroy: vi.fn(),
    })),
    // R84.P5 — fresh text instance per call so per-line state (alpha/depth/
    // origin/style) on the 4-row power-up legend can be asserted separately.
    text: vi.fn().mockImplementation((x: number, y: number, content?: string, style?: any) => {
      const t: any = {
        x, y, text: content, style,
        alpha: 1,
        depth: 0,
        originX: 0, originY: 0,
        setText: vi.fn(function (this: any, s: string) { this.text = s; return this; }),
        setAlpha: vi.fn(function (this: any, a: number) { this.alpha = a; return this; }),
        setDepth: vi.fn(function (this: any, z: number) { this.depth = z; return this; }),
        setOrigin: vi.fn(function (this: any, ox: number, oy?: number) {
          this.originX = ox; this.originY = oy ?? ox; return this;
        }),
        destroy: vi.fn(),
      };
      return t;
    }),
  };

  // Game config (accessed by BaseScene for width/height)
  scene.game = { config: { width: GAME_CONFIG.WIDTH, height: GAME_CONFIG.HEIGHT } };

  // Phaser scene manager
  scene.scene = { restart: vi.fn(), start: vi.fn() };

  // Phaser registry (R84.P3 — scene reads vortexPong.difficulty on reset)
  const registryStore = new Map<string, unknown>();
  scene.registry = {
    get: vi.fn((key: string) => registryStore.get(key)),
    set: vi.fn((key: string, value: unknown) => { registryStore.set(key, value); }),
  };

  // Initialise state by calling resetState
  scene.resetState();

  return scene;
}

function createBall(scene: any, x = 400, y = 225, vx = 420, vy = 0, isMultiBall = false) {
  const sprite = { x, y, destroy: vi.fn(), setTint: vi.fn() };
  const ball = { sprite, vx, vy, isMultiBall };
  scene.balls.push(ball);
  return ball;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VortexPongGameScene', () => {
  let scene: any;

  beforeEach(() => {
    scene = createTestScene();
    scene.balls = [];
    scene.fieldPowerUps = [];
    scene.impactEffects = [];
    scene.activePowerUps = new Map();
    scene.powerUpIndicators = [];
    // Create mock paddles
    scene.playerPaddle = { x: GAME_CONFIG.PADDLE.OFFSET_X + GAME_CONFIG.PADDLE.WIDTH / 2, y: 225, setDisplaySize: vi.fn(), destroy: vi.fn() };
    scene.aiPaddle = { x: GAME_CONFIG.WIDTH - GAME_CONFIG.PADDLE.OFFSET_X - GAME_CONFIG.PADDLE.WIDTH / 2, y: 225, setDisplaySize: vi.fn(), destroy: vi.fn() };
    // UI mocks
    scene.playerScoreText = { setText: vi.fn(), setAlpha: vi.fn(), destroy: vi.fn() };
    scene.aiScoreText = { setText: vi.fn(), setAlpha: vi.fn(), destroy: vi.fn() };
    scene.comboText = { setText: vi.fn(), setAlpha: vi.fn(), destroy: vi.fn() };
    // R84.P8 — top-centre rally counter. updateRallyCounter/hideRallyCounter
    // read setText/setAlpha; scale is stored as a mutable field for assertion.
    scene.rallyCounterText = {
      text: '', alpha: 0, scale: 1,
      setText: vi.fn(function (this: any, s: string) { this.text = s; return this; }),
      setAlpha: vi.fn(function (this: any, a: number) { this.alpha = a; return this; }),
      destroy: vi.fn(),
    };
    scene.centerLineGraphics = { destroy: vi.fn() };
    scene.rainGroup = undefined;
    scene.previousPlayerY = 225;
  });

  // -----------------------------------------------------------------------
  // Initial State
  // -----------------------------------------------------------------------
  describe('Initial State', () => {
    it('playerScore starts at 0', () => {
      expect(scene.playerScore).toBe(0);
    });

    it('aiScore starts at 0', () => {
      expect(scene.aiScore).toBe(0);
    });

    it('combo starts at 0', () => {
      expect(scene.combo).toBe(0);
    });

    it('rallyCount starts at 0', () => {
      expect(scene.rallyCount).toBe(0);
    });

    it('aiDifficulty starts at INITIAL_DIFFICULTY', () => {
      expect(scene.aiDifficulty).toBe(GAME_CONFIG.AI.INITIAL_DIFFICULTY);
    });

    it('hasFirstPoint starts as false', () => {
      expect(scene.hasFirstPoint).toBe(false);
    });

    it('powerUpsCollected starts at 0', () => {
      expect(scene.powerUpsCollected).toBe(0);
    });

    it('scoreMultiplier starts at 1', () => {
      expect(scene.scoreMultiplier).toBe(1);
    });

    it('currentPaddleHeight starts at PADDLE.HEIGHT', () => {
      expect(scene.currentPaddleHeight).toBe(GAME_CONFIG.PADDLE.HEIGHT);
    });

    it('isSlowBall starts as false', () => {
      expect(scene.isSlowBall).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Speed Multiplier
  // -----------------------------------------------------------------------
  describe('Speed Multiplier', () => {
    it('returns 1.0 at start (timeSinceLastGoal = 0)', () => {
      scene.timeSinceLastGoal = 0;
      expect(scene.getSpeedMultiplier()).toBeCloseTo(1.0);
    });

    it('ramps up over time', () => {
      scene.timeSinceLastGoal = 5;
      const result = scene.getSpeedMultiplier();
      expect(result).toBeCloseTo(1.5);
    });

    it('caps at MAX_SPEED / INITIAL_SPEED', () => {
      scene.timeSinceLastGoal = 100;
      const max = GAME_CONFIG.BALL.MAX_SPEED / GAME_CONFIG.BALL.INITIAL_SPEED;
      expect(scene.getSpeedMultiplier()).toBeCloseTo(max);
    });

    it('returns 0.6 when slowBall is active', () => {
      scene.isSlowBall = true;
      scene.timeSinceLastGoal = 50;
      expect(scene.getSpeedMultiplier()).toBeCloseTo(0.6);
    });
  });

  // -----------------------------------------------------------------------
  // Ball Movement
  // -----------------------------------------------------------------------
  describe('Ball Movement', () => {
    it('moves ball by velocity * multiplier * dt', () => {
      const ball = createBall(scene, 400, 225, 420, 0);
      scene.timeSinceLastGoal = 0;
      scene.updateBalls(1.0); // 1 second
      expect(ball.sprite.x).toBeCloseTo(820);
    });

    it('bounces off top wall', () => {
      const ball = createBall(scene, 400, 2, 0, -420);
      scene.updateBalls(0.016);
      expect(ball.vy).toBeGreaterThan(0);
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('bounces off bottom wall', () => {
      const ball = createBall(scene, 400, GAME_CONFIG.HEIGHT - 2, 0, 420);
      scene.updateBalls(0.016);
      expect(ball.vy).toBeLessThan(0);
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });
  });

  // -----------------------------------------------------------------------
  // Paddle Collision
  // -----------------------------------------------------------------------
  describe('Paddle Collision', () => {
    it('detects player paddle hit', () => {
      const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
      const ball = createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
      scene.checkPaddleCollisions();
      expect(ball.vx).toBeGreaterThan(0);
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('increments combo on player hit', () => {
      const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
      createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
      scene.checkPaddleCollisions();
      expect(scene.combo).toBe(1);
    });

    it('increases AI difficulty on player hit', () => {
      const initial = scene.aiDifficulty;
      const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
      createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
      scene.checkPaddleCollisions();
      expect(scene.aiDifficulty).toBeCloseTo(initial + GAME_CONFIG.AI.DIFFICULTY_INCREMENT);
    });

    it('detects AI paddle hit and reverses direction', () => {
      const paddleLeft = scene.aiPaddle.x - GAME_CONFIG.PADDLE.WIDTH / 2;
      const ball = createBall(scene, paddleLeft, scene.aiPaddle.y, 420, 0);
      scene.checkPaddleCollisions();
      expect(ball.vx).toBeLessThan(0);
    });

    it('unlocks COMBO_KING at 5 rallies', () => {
      scene.rallyCount = 4;
      const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
      createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
      scene.checkPaddleCollisions();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_KING);
    });

    it('unlocks RALLY_MASTER at 20 rallies', () => {
      scene.rallyCount = 19;
      const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
      createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
      scene.checkPaddleCollisions();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.RALLY_MASTER);
    });
  });

  // -----------------------------------------------------------------------
  // Scoring / Goals
  // -----------------------------------------------------------------------
  describe('Goals', () => {
    it('AI scores when ball exits left', () => {
      createBall(scene, -10, 225, -420, 0);
      scene.checkGoals();
      expect(scene.aiScore).toBe(1);
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('player scores when ball exits right', () => {
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.playerScore).toBe(1);
      expect(scene.playSound).toHaveBeenCalledWith('score');
    });

    it('unlocks FIRST_POINT on first player goal', () => {
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_POINT);
      expect(scene.hasFirstPoint).toBe(true);
    });

    it('does not unlock FIRST_POINT twice', () => {
      scene.hasFirstPoint = true;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_POINT);
    });

    it('resets combo and rally on goal', () => {
      scene.combo = 5;
      scene.rallyCount = 10;
      createBall(scene, -10, 225, -420, 0);
      scene.checkGoals();
      expect(scene.combo).toBe(0);
      expect(scene.rallyCount).toBe(0);
    });

    it('resets timeSinceLastGoal', () => {
      scene.timeSinceLastGoal = 8;
      createBall(scene, -10, 225, -420, 0);
      scene.checkGoals();
      expect(scene.timeSinceLastGoal).toBe(0);
    });

    // R84.P2: match score is tight classic-Pong (+1 per goal). scoreMultiplier
    // and combo bonuses no longer inflate the match score — they feed the
    // weighted High Score formula instead. See "R84.P2 High Score formula"
    // describe block below.
    it('player goal is always +1 regardless of scoreMultiplier', () => {
      scene.scoreMultiplier = 2;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.playerScore).toBe(1);
    });

    it('player goal is always +1 regardless of combo', () => {
      scene.combo = 6;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.playerScore).toBe(1);
    });

    it('AI goal is always +1 regardless of scoreMultiplier', () => {
      scene.scoreMultiplier = 2;
      createBall(scene, -10, 225, -420, 0);
      scene.checkGoals();
      expect(scene.aiScore).toBe(1);
    });

    it('removes scored ball from array', () => {
      createBall(scene, -10, 225, -420, 0);
      expect(scene.balls.length).toBe(1);
      scene.checkGoals();
      expect(scene.balls.length).toBe(0);
    });

    it('destroys scored ball sprite', () => {
      const ball = createBall(scene, -10, 225, -420, 0);
      scene.checkGoals();
      expect(ball.sprite.destroy).toHaveBeenCalled();
    });

    it('schedules respawn when all balls removed', () => {
      createBall(scene, -10, 225, -420, 0);
      scene.checkGoals();
      expect(scene.time.delayedCall).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Win Conditions
  // -----------------------------------------------------------------------
  describe('Win Conditions', () => {
    it('player wins at WIN_SCORE', () => {
      scene.playerScore = GAME_CONFIG.WIN_SCORE - 1;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.BEAT_AI);
      expect(scene.playSound).toHaveBeenCalledWith('levelUp');
    });

    it('unlocks PERFECT_GAME when AI has 0 points', () => {
      scene.playerScore = GAME_CONFIG.WIN_SCORE - 1;
      scene.aiScore = 0;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.PERFECT_GAME);
    });

    it('does not unlock PERFECT_GAME when AI scored', () => {
      scene.playerScore = GAME_CONFIG.WIN_SCORE - 1;
      scene.aiScore = 3;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.PERFECT_GAME);
    });

    it('unlocks MULTI_BALL when 3+ balls active at win', () => {
      scene.playerScore = GAME_CONFIG.WIN_SCORE - 1;
      createBall(scene, 200, 200, 100, 0);
      createBall(scene, 300, 200, 100, 0);
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.MULTI_BALL);
    });

    it('AI wins at WIN_SCORE', () => {
      scene.aiScore = GAME_CONFIG.WIN_SCORE - 1;
      createBall(scene, -10, 225, -420, 0);
      scene.checkGoals();
      // R84.P2: reportScore receives the computed weighted High Score, not
      // the raw match playerScore. Both args are numeric.
      expect(scene.reportScore).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
    });
  });

  // -----------------------------------------------------------------------
  // Power-Ups
  // -----------------------------------------------------------------------
  describe('Power-Ups', () => {
    it('activates bigger_paddle', () => {
      scene.activatePowerUp('bigger_paddle');
      expect(scene.currentPaddleHeight).toBe(
        GAME_CONFIG.PADDLE.HEIGHT * GAME_CONFIG.PADDLE.BIGGER_MULTIPLIER,
      );
    });

    it('activates slower_ball', () => {
      scene.activatePowerUp('slower_ball');
      expect(scene.isSlowBall).toBe(true);
    });

    it('activates score_multiplier', () => {
      scene.activatePowerUp('score_multiplier');
      expect(scene.scoreMultiplier).toBe(2);
    });

    it('spawns multi balls', () => {
      createBall(scene);
      scene.activatePowerUp('multi_ball');
      expect(scene.balls.length).toBeGreaterThan(1);
    });

    it('caps multi balls at 3', () => {
      createBall(scene);
      createBall(scene);
      createBall(scene);
      scene.activatePowerUp('multi_ball');
      expect(scene.balls.length).toBe(3);
    });

    it('deactivates bigger_paddle', () => {
      scene.activatePowerUp('bigger_paddle');
      scene.deactivatePowerUp('bigger_paddle');
      expect(scene.currentPaddleHeight).toBe(GAME_CONFIG.PADDLE.HEIGHT);
    });

    it('deactivates slower_ball', () => {
      scene.activatePowerUp('slower_ball');
      scene.deactivatePowerUp('slower_ball');
      expect(scene.isSlowBall).toBe(false);
    });

    it('deactivates score_multiplier', () => {
      scene.activatePowerUp('score_multiplier');
      scene.deactivatePowerUp('score_multiplier');
      expect(scene.scoreMultiplier).toBe(1);
    });

    it('collectPowerUp increments counter', () => {
      const mockSprite = { x: 300, y: 200, destroy: vi.fn() };
      scene.fieldPowerUps = [{ sprite: mockSprite, type: 'bigger_paddle' as const }];
      scene.collectPowerUp(scene.fieldPowerUps[0]);
      expect(scene.powerUpsCollected).toBe(1);
    });

    it('unlocks POWER_MASTER at 5 collected', () => {
      scene.powerUpsCollected = 4;
      const mockSprite = { x: 300, y: 200, destroy: vi.fn() };
      scene.fieldPowerUps = [{ sprite: mockSprite, type: 'bigger_paddle' as const }];
      scene.collectPowerUp(scene.fieldPowerUps[0]);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.POWER_MASTER);
    });

    it('getPowerUpInterval decreases with total score', () => {
      scene.playerScore = 0;
      scene.aiScore = 0;
      const initial = scene.getPowerUpInterval();
      scene.playerScore = 5;
      scene.aiScore = 5;
      const later = scene.getPowerUpInterval();
      expect(later).toBeLessThan(initial);
    });

    it('getPowerUpInterval does not go below MIN_INTERVAL', () => {
      scene.playerScore = 50;
      scene.aiScore = 50;
      expect(scene.getPowerUpInterval()).toBe(GAME_CONFIG.POWERUP.MIN_INTERVAL);
    });

    it('does not spawn more than MAX_ON_FIELD power-ups', () => {
      scene.fieldPowerUps = [
        { sprite: { x: 100, y: 100, destroy: vi.fn(), setAlpha: vi.fn() }, type: 'bigger_paddle' },
        { sprite: { x: 200, y: 200, destroy: vi.fn(), setAlpha: vi.fn() }, type: 'slower_ball' },
      ];
      scene.spawnPowerUp();
      expect(scene.fieldPowerUps.length).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Impact Effects
  // -----------------------------------------------------------------------
  describe('Impact Effects', () => {
    it('adds an impact effect', () => {
      scene.addImpactEffect(100, 200, 10);
      expect(scene.impactEffects.length).toBe(1);
      expect(scene.impactEffects[0].life).toBe(1.0);
    });

    it('caps impact effects at MAX_IMPACT_EFFECTS', () => {
      for (let i = 0; i < GAME_CONFIG.MAX_IMPACT_EFFECTS + 5; i++) {
        scene.addImpactEffect(i * 10, 100, 5);
      }
      expect(scene.impactEffects.length).toBeLessThanOrEqual(GAME_CONFIG.MAX_IMPACT_EFFECTS + 1);
    });

    it('decays effect life over time', () => {
      scene.addImpactEffect(100, 200, 10);
      const initialLife = scene.impactEffects[0].life;
      scene.updateImpactEffects(0.1);
      expect(scene.impactEffects[0].life).toBeLessThan(initialLife);
    });

    it('removes expired effects', () => {
      scene.addImpactEffect(100, 200, 10);
      scene.impactEffects[0].life = 0.01;
      scene.updateImpactEffects(0.1);
      expect(scene.impactEffects.length).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // AI
  // -----------------------------------------------------------------------
  describe('AI', () => {
    it('moves toward the closest ball', () => {
      createBall(scene, 600, 100, 200, 0);
      scene.aiPaddle.y = 300;
      const initialY = scene.aiPaddle.y;
      scene.updateAI(0.1);
      // Ball is above paddle (y=100 < y=300), so paddle should move up
      expect(scene.aiPaddle.y).toBeLessThan(initialY);
    });

    it('does nothing with no balls', () => {
      const initialY = scene.aiPaddle.y;
      scene.updateAI(0.1);
      expect(scene.aiPaddle.y).toBe(initialY);
    });

    it('selects ball with highest x as closest', () => {
      createBall(scene, 200, 100, 100, 0);
      createBall(scene, 600, 300, 100, 0);
      const closest = scene.getClosestBallToAI();
      expect(closest.sprite.x).toBe(600);
    });
  });

  // -----------------------------------------------------------------------
  // Power-Up Collision
  // -----------------------------------------------------------------------
  describe('Power-Up Collision Detection', () => {
    it('collects power-up when ball is close enough', () => {
      createBall(scene, 300, 200, 100, 0);
      const mockSprite = { x: 305, y: 200, destroy: vi.fn() };
      scene.fieldPowerUps = [{ sprite: mockSprite, type: 'bigger_paddle' as const }];
      scene.checkPowerUpCollisions();
      expect(scene.fieldPowerUps.length).toBe(0);
      expect(scene.playSound).toHaveBeenCalledWith('specialAbility');
    });

    it('does not collect distant power-up', () => {
      createBall(scene, 100, 100, 100, 0);
      const mockSprite = { x: 500, y: 400, destroy: vi.fn() };
      scene.fieldPowerUps = [{ sprite: mockSprite, type: 'bigger_paddle' as const }];
      scene.checkPowerUpCollisions();
      expect(scene.fieldPowerUps.length).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // R83.V1 polish — keyboard input fix, AI predictive lookahead,
  // goal-flash brightness, R-restart audio cleanup, paddle-hit trail.
  // -----------------------------------------------------------------------
  describe('R83.V1 keyboard "springs back to centre" fix', () => {
    beforeEach(() => {
      scene.upKey = { isDown: false };
      scene.downKey = { isDown: false };
      scene.wKey = { isDown: false };
      scene.sKey = { isDown: false };
      scene.input.activePointer = { isDown: false, wasTouch: false, y: 100, event: undefined };
    });

    it('does not snap to pointer when keys released and mouse is stationary', () => {
      scene.playerPaddle.y = 250;
      scene.lastPointerY = 100;
      scene.lastPointerMoveTime = 0;
      scene.input.activePointer.y = 100;

      scene.handlePlayerInput(0.016);

      expect(scene.playerPaddle.y).toBe(250);
    });

    it('follows mouse while it is actively moving', () => {
      scene.playerPaddle.y = 250;
      scene.input.activePointer.y = 320;
      scene.input.activePointer.isDown = true;

      scene.handlePlayerInput(0.016);

      expect(scene.playerPaddle.y).toBe(320);
    });

    it('keyboard up moves paddle up', () => {
      scene.playerPaddle.y = 250;
      scene.upKey = { isDown: true };
      scene.handlePlayerInput(0.1);
      expect(scene.playerPaddle.y).toBeLessThan(250);
    });

    it('keyboard down moves paddle down', () => {
      scene.playerPaddle.y = 200;
      scene.downKey = { isDown: true };
      scene.handlePlayerInput(0.1);
      expect(scene.playerPaddle.y).toBeGreaterThan(200);
    });
  });

  describe('R83.V1a AI predictive lookahead', () => {
    it('uses extrapolated intercept rather than raw ball Y', () => {
      // Ball at x=400 y=100 moving down-right; intercept at AI x≈784.
      // With pure tracking the AI would chase y=100; with lookahead it
      // anticipates the descent.
      scene.aiPaddle.y = 225;
      createBall(scene, 400, 100, 200, 200);
      scene.updateAI(0.5);
      expect(scene.aiPaddle.y).toBeGreaterThan(225);
    });

    it('reflects predicted intercept off bottom wall', () => {
      // Ball heading down past the bottom — intercept reflects upward.
      scene.aiPaddle.y = 50;
      createBall(scene, 400, GAME_CONFIG.HEIGHT - 100, 300, 600);
      const prevY = scene.aiPaddle.y;
      scene.updateAI(0.5);
      expect(scene.aiPaddle.y).toBeGreaterThan(prevY);
    });
  });

  describe('R83.V1c goal flash', () => {
    it('halves green channel on player goal (no longer pure 255)', () => {
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      const flashCalls = scene.cameras.main.flash.mock.calls;
      const greenFlash = flashCalls.find((c: number[]) => c[2] === 128 && c[1] === 0 && c[3] === 0);
      expect(greenFlash).toBeDefined();
    });

    it('halves red channel on AI goal (no longer pure 255)', () => {
      createBall(scene, -10, 225, -420, 0);
      scene.checkGoals();
      const flashCalls = scene.cameras.main.flash.mock.calls;
      const redFlash = flashCalls.find((c: number[]) => c[1] === 128 && c[2] === 0 && c[3] === 0);
      expect(redFlash).toBeDefined();
    });

    it('skips flash entirely under prefers-reduced-motion', () => {
      const original = window.matchMedia;
      // @ts-expect-error overriding for test
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      try {
        createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
        scene.checkGoals();
        expect(scene.cameras.main.flash).not.toHaveBeenCalled();
      } finally {
        window.matchMedia = original;
      }
    });
  });

  describe('R83.V1d R-restart audio cleanup', () => {
    it('stopAllAudio stops both BGM and Phaser sound manager', () => {
      scene.stopAllAudio();
      expect(scene.stopBackgroundMusic).toHaveBeenCalled();
      expect(scene.sound.stopAll).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // R84.P9 — Goal-flash epilepsy safety floor (config cap + PEAT throttle)
  // -----------------------------------------------------------------------
  describe('R84.P9 goal-flash safety', () => {
    const GOAL_FLASH = GAME_CONFIG.GOAL_FLASH;

    describe('config sanity', () => {
      it('MAX_CHANNEL_VALUE is 160 — matches the boosted-win ceiling', () => {
        expect(GOAL_FLASH.MAX_CHANNEL_VALUE).toBe(160);
      });

      it('MAX_DURATION_MS is ≤ 200 (below PEAT 1s window)', () => {
        expect(GOAL_FLASH.MAX_DURATION_MS).toBeLessThanOrEqual(200);
      });

      it('MIN_INTERVAL_MS is ≥ 334 (enforces ≤ 3Hz WCAG 2.3.1 cap)', () => {
        expect(GOAL_FLASH.MIN_INTERVAL_MS).toBeGreaterThanOrEqual(334);
      });

      it('every preset rgb channel stays ≤ MAX_CHANNEL_VALUE', () => {
        for (const preset of [GOAL_FLASH.PLAYER_GOAL, GOAL_FLASH.AI_GOAL, GOAL_FLASH.PLAYER_WIN, GOAL_FLASH.AI_WIN]) {
          for (const channel of preset.rgb) {
            expect(channel).toBeLessThanOrEqual(GOAL_FLASH.MAX_CHANNEL_VALUE);
          }
        }
      });

      it('every preset saturates at most one channel (no white/yellow flashes)', () => {
        for (const preset of [GOAL_FLASH.PLAYER_GOAL, GOAL_FLASH.AI_GOAL, GOAL_FLASH.PLAYER_WIN, GOAL_FLASH.AI_WIN]) {
          const nonZero = preset.rgb.filter((c) => c > 0).length;
          expect(nonZero).toBe(1);
        }
      });

      it('every preset duration stays ≤ MAX_DURATION_MS', () => {
        for (const preset of [GOAL_FLASH.PLAYER_GOAL, GOAL_FLASH.AI_GOAL, GOAL_FLASH.PLAYER_WIN, GOAL_FLASH.AI_WIN]) {
          expect(preset.durationMs).toBeLessThanOrEqual(GOAL_FLASH.MAX_DURATION_MS);
        }
      });
    });

    describe('PEAT throttle', () => {
      let dateNowSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
      });

      afterEach(() => {
        dateNowSpy.mockRestore();
      });

      it('fires the first flash after resetState (lastGoalFlashAt starts at 0)', () => {
        scene.goalFlash(GOAL_FLASH.PLAYER_GOAL);
        expect(scene.cameras.main.flash).toHaveBeenCalledTimes(1);
      });

      it('suppresses a second flash within MIN_INTERVAL_MS', () => {
        scene.goalFlash(GOAL_FLASH.PLAYER_GOAL);
        dateNowSpy.mockReturnValue(1_000_000 + GOAL_FLASH.MIN_INTERVAL_MS - 1);
        scene.goalFlash(GOAL_FLASH.AI_GOAL);
        expect(scene.cameras.main.flash).toHaveBeenCalledTimes(1);
      });

      it('fires a second flash after MIN_INTERVAL_MS has elapsed', () => {
        scene.goalFlash(GOAL_FLASH.PLAYER_GOAL);
        dateNowSpy.mockReturnValue(1_000_000 + GOAL_FLASH.MIN_INTERVAL_MS + 1);
        scene.goalFlash(GOAL_FLASH.AI_GOAL);
        expect(scene.cameras.main.flash).toHaveBeenCalledTimes(2);
      });

      it('overrideThrottle bypasses the suppression window (win flash path)', () => {
        scene.goalFlash(GOAL_FLASH.PLAYER_GOAL);
        dateNowSpy.mockReturnValue(1_000_000 + 50);
        scene.goalFlash(GOAL_FLASH.PLAYER_WIN, { overrideThrottle: true });
        expect(scene.cameras.main.flash).toHaveBeenCalledTimes(2);
        const winCall = scene.cameras.main.flash.mock.calls[1];
        // flash(duration, r, g, b, force) — PLAYER_WIN is [0, 160, 0], 200ms
        expect(winCall).toEqual([200, 0, 160, 0, false]);
      });
    });

    describe('clamping', () => {
      it('clamps rgb channels above MAX_CHANNEL_VALUE down to the cap', () => {
        const rogue: GoalFlashPreset = {
          rgb: [255, 0, 0],
          durationMs: 100,
        };
        scene.goalFlash(rogue);
        const call = scene.cameras.main.flash.mock.calls[0];
        expect(call[1]).toBe(GOAL_FLASH.MAX_CHANNEL_VALUE);
      });

      it('clamps duration above MAX_DURATION_MS down to the cap', () => {
        const rogue: GoalFlashPreset = {
          rgb: [0, 128, 0],
          durationMs: 900,
        };
        scene.goalFlash(rogue);
        const call = scene.cameras.main.flash.mock.calls[0];
        expect(call[0]).toBe(GOAL_FLASH.MAX_DURATION_MS);
      });
    });

    describe('reduced-motion + resetState', () => {
      it('resetState clears lastGoalFlashAt so R-restart does not suppress the first flash', () => {
        const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(2_000_000);
        try {
          scene.goalFlash(GOAL_FLASH.PLAYER_GOAL);
          expect(scene.lastGoalFlashAt).toBe(2_000_000);
          scene.resetState();
          expect(scene.lastGoalFlashAt).toBe(0);
          // First post-restart flash fires even though Date.now hasn't advanced.
          dateNowSpy.mockReturnValue(2_000_050);
          scene.goalFlash(GOAL_FLASH.AI_GOAL);
          expect(scene.cameras.main.flash).toHaveBeenCalledTimes(2);
        } finally {
          dateNowSpy.mockRestore();
        }
      });

      it('reduced-motion path returns before touching lastGoalFlashAt', () => {
        const original = window.matchMedia;
        // @ts-expect-error overriding for test
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        try {
          scene.lastGoalFlashAt = 0;
          scene.goalFlash(GOAL_FLASH.PLAYER_GOAL);
          expect(scene.cameras.main.flash).not.toHaveBeenCalled();
          expect(scene.lastGoalFlashAt).toBe(0);
        } finally {
          window.matchMedia = original;
        }
      });
    });
  });

  // -----------------------------------------------------------------------
  // R84.P2 — Weighted High Score formula + multi-ball counter
  // -----------------------------------------------------------------------
  describe('R84.P2 High Score formula', () => {
    it('multiBallsTriggered starts at 0', () => {
      expect(scene.multiBallsTriggered).toBe(0);
    });

    it('increments multiBallsTriggered each time multi_ball power-up fires', () => {
      createBall(scene);
      scene.activatePowerUp('multi_ball');
      scene.activatePowerUp('multi_ball');
      expect(scene.multiBallsTriggered).toBe(2);
    });

    it('computes 0 at initial state', () => {
      expect(scene.computeHighScore()).toBe(0);
    });

    it('weights match_score_diff at 100 per point', () => {
      scene.playerScore = 5;
      scene.aiScore = 2;
      expect(scene.computeHighScore()).toBe(3 * 100);
    });

    it('clamps negative match_score_diff to 0 on losses', () => {
      scene.playerScore = 2;
      scene.aiScore = 8;
      scene.powerUpsCollected = 3;
      expect(scene.computeHighScore()).toBe(3 * 50);
    });

    it('weights powerUpsCollected at 50 each', () => {
      scene.powerUpsCollected = 4;
      expect(scene.computeHighScore()).toBe(4 * 50);
    });

    it('weights multiBallsTriggered at 200 each', () => {
      scene.multiBallsTriggered = 2;
      expect(scene.computeHighScore()).toBe(2 * 200);
    });

    it('weights maxRally at 10 per hit', () => {
      scene.maxRally = 15;
      expect(scene.computeHighScore()).toBe(15 * 10);
    });

    it('awards 500 win bonus when playerScore >= WIN_SCORE', () => {
      scene.playerScore = GAME_CONFIG.WIN_SCORE;
      scene.aiScore = GAME_CONFIG.WIN_SCORE;
      expect(scene.computeHighScore()).toBe(500);
    });

    it('does not award win bonus below WIN_SCORE', () => {
      scene.playerScore = GAME_CONFIG.WIN_SCORE - 1;
      scene.aiScore = 0;
      expect(scene.computeHighScore()).toBe(9 * 100);
    });

    it('combines all components correctly for a 10-4 win', () => {
      scene.playerScore = 10;
      scene.aiScore = 4;
      scene.powerUpsCollected = 5;
      scene.multiBallsTriggered = 1;
      scene.maxRally = 12;
      // 6 × 100 + 5 × 50 + 1 × 200 + 12 × 10 + 500 = 600 + 250 + 200 + 120 + 500
      expect(scene.computeHighScore()).toBe(1670);
    });

    it('combines all components correctly for a 10-0 flawless win', () => {
      scene.playerScore = 10;
      scene.aiScore = 0;
      scene.powerUpsCollected = 8;
      scene.multiBallsTriggered = 2;
      scene.maxRally = 20;
      // 10 × 100 + 8 × 50 + 2 × 200 + 20 × 10 + 500 = 1000 + 400 + 400 + 200 + 500
      expect(scene.computeHighScore()).toBe(2500);
    });

    it('reports the computed high score at player win (not raw playerScore)', () => {
      scene.playerScore = GAME_CONFIG.WIN_SCORE - 1;
      scene.powerUpsCollected = 3;
      scene.multiBallsTriggered = 1;
      scene.maxRally = 8;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      // After the goal: playerScore = WIN_SCORE, matchDiff = 10,
      // formula = 1000 + 150 + 200 + 80 + 500 = 1930
      expect(scene.reportScore).toHaveBeenCalledWith(1930, 1930);
    });

    it('reports the computed high score on AI win (weighted, not 0)', () => {
      scene.aiScore = GAME_CONFIG.WIN_SCORE - 1;
      scene.powerUpsCollected = 2;
      scene.maxRally = 5;
      createBall(scene, -10, 225, -420, 0);
      scene.checkGoals();
      // matchDiff clamped to 0 (player lost), + 2 × 50 + 0 + 5 × 10 + 0 = 150
      expect(scene.reportScore).toHaveBeenCalledWith(150, expect.any(Number));
    });

    it('highScore persists the session best after a win', () => {
      scene.highScore = 500;
      scene.playerScore = GAME_CONFIG.WIN_SCORE - 1;
      scene.powerUpsCollected = 5;
      scene.multiBallsTriggered = 1;
      scene.maxRally = 10;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      // Computed = 1000 + 250 + 200 + 100 + 500 = 2050 > 500, so highScore updates.
      expect(scene.highScore).toBe(2050);
    });

    it('resets multiBallsTriggered on scene reset', () => {
      scene.multiBallsTriggered = 5;
      scene.resetState();
      expect(scene.multiBallsTriggered).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // R84.P3 — AI difficulty second-pass (Easy/Normal/Hard tiers)
  // -----------------------------------------------------------------------
  describe('R84.P3 AI difficulty tiers', () => {
    beforeEach(() => {
      // Clean slate for localStorage so stored tier from a prior test leaks.
      window.localStorage.removeItem('matrixArcade.vortexPong.difficulty');
    });

    it('defaults to normal tier when registry + localStorage are empty', () => {
      scene.resetState();
      expect(scene.aiDifficultyTier).toBe('normal');
    });

    it('honours MenuScene-seeded registry tier on resetState', () => {
      scene.registry.set('vortexPong.difficulty', 'hard');
      scene.resetState();
      expect(scene.aiDifficultyTier).toBe('hard');
    });

    it('falls back to localStorage when registry is unset', () => {
      window.localStorage.setItem('matrixArcade.vortexPong.difficulty', 'easy');
      // Force registry miss — mock returns undefined for unset keys.
      scene.resetState();
      expect(scene.aiDifficultyTier).toBe('easy');
    });

    it('ignores invalid localStorage values and defaults to normal', () => {
      window.localStorage.setItem('matrixArcade.vortexPong.difficulty', 'impossible');
      scene.resetState();
      expect(scene.aiDifficultyTier).toBe('normal');
    });

    it('Hard moves AI paddle farther per frame than Easy for the same frame', () => {
      // Identical starting conditions: ball in flight toward AI, paddle at top.
      const runTier = (tier: 'easy' | 'normal' | 'hard') => {
        scene.balls = [];
        scene.aiPaddle.y = 50;
        scene.aiDifficultyTier = tier;
        createBall(scene, 400, 300, 300, 0);
        scene.updateAI(0.1);
        return scene.aiPaddle.y;
      };

      const easyY = runTier('easy');
      const normalY = runTier('normal');
      const hardY = runTier('hard');

      // All tiers track downward toward the ball; Hard should travel farther
      // than Normal, which travels farther than Easy.
      expect(hardY).toBeGreaterThan(normalY);
      expect(normalY).toBeGreaterThan(easyY);
    });

    it('Normal tier preserves R83.V1a baseline numbers (regression guard)', () => {
      // Normal should match the pre-R84.P3 behaviour. Pick a scenario where
      // the paddle would move to the ball — the old code used baseTracking 4.0
      // and maxSpeed factor 0.95, which normal's multipliers of 1.0 preserve.
      scene.balls = [];
      scene.aiPaddle.y = 100;
      scene.aiDifficultyTier = 'normal';
      createBall(scene, 400, 400, 300, 0);
      // Step at max diff so the paddle clamps to tier maxSpeed.
      scene.updateAI(1.0);
      // maxSpeed = 480 * 0.95 = 456 px/s → moveAmount = 456.
      // Paddle starts at y=100, moves down by 456 but gets clamped by
      // clampPaddle to height-paddleHeight/2 = 450-40 = 410.
      expect(scene.aiPaddle.y).toBeLessThanOrEqual(GAME_CONFIG.HEIGHT - GAME_CONFIG.PADDLE.HEIGHT / 2);
      expect(scene.aiPaddle.y).toBeGreaterThan(100);
    });
  });

  // -----------------------------------------------------------------------
  // R84.P4 — Vortex atmosphere amp-up (rotating backdrop + scanline overlay
  // + paddle-glow pulse on ball approach). Why these tests exist: the whole
  // feature is procedural (no assets), so the only way to verify it lands
  // correctly in the jsdom suite is by checking the scene wires up the right
  // Phaser-side calls and that the per-frame drive functions respond to
  // state the way the design brief prescribes.
  // -----------------------------------------------------------------------
  describe('R84.P4 vortex atmosphere', () => {
    describe('config', () => {
      it('exposes an ATMOSPHERE block with vortex, scanline and paddle-glow sub-config', () => {
        expect(GAME_CONFIG.ATMOSPHERE).toBeDefined();
        expect(GAME_CONFIG.ATMOSPHERE.VORTEX).toBeDefined();
        expect(GAME_CONFIG.ATMOSPHERE.SCANLINE).toBeDefined();
        expect(GAME_CONFIG.ATMOSPHERE.PADDLE_GLOW).toBeDefined();
      });

      it('keeps the vortex rotation period inside the 30–60s band the plan specifies', () => {
        expect(GAME_CONFIG.ATMOSPHERE.VORTEX.ROTATION_SECONDS).toBeGreaterThanOrEqual(30);
        expect(GAME_CONFIG.ATMOSPHERE.VORTEX.ROTATION_SECONDS).toBeLessThanOrEqual(60);
      });

      it('scanline alpha is +30% over Snake\'s 0.18 baseline', () => {
        // Tolerate rounding — 0.18 × 1.30 = 0.234.
        expect(GAME_CONFIG.ATMOSPHERE.SCANLINE.ALPHA).toBeCloseTo(0.234, 2);
      });

      it('vortex aspect ratio is non-circular so rotation is visible', () => {
        const { ASPECT_X, ASPECT_Y } = GAME_CONFIG.ATMOSPHERE.VORTEX;
        expect(ASPECT_X).not.toBe(ASPECT_Y);
      });
    });

    describe('createVortexBackdrop', () => {
      it('creates a graphics layer at depth -20 centred on the canvas', () => {
        scene.createVortexBackdrop();
        expect(scene.vortexBackdrop).toBeDefined();
        expect(scene.vortexBackdrop.depth).toBe(-20);
        expect(scene.vortexBackdrop.x).toBe(GAME_CONFIG.WIDTH / 2);
        expect(scene.vortexBackdrop.y).toBe(GAME_CONFIG.HEIGHT / 2);
      });

      it('applies the configured base alpha', () => {
        scene.createVortexBackdrop();
        expect(scene.vortexBackdrop.alpha).toBeCloseTo(GAME_CONFIG.ATMOSPHERE.VORTEX.BASE_ALPHA);
      });

      it('paints base disc plus RING_COUNT+1 rings so every radius step is drawn', () => {
        scene.createVortexBackdrop();
        // Base disc is 1 fillCircle; loop from RING_COUNT..0 inclusive adds
        // another RING_COUNT + 1, total = RING_COUNT + 2.
        const expected = GAME_CONFIG.ATMOSPHERE.VORTEX.RING_COUNT + 2;
        expect(scene.vortexBackdrop.fillCircle).toHaveBeenCalledTimes(expected);
      });

      it('stretches the disc elliptically via setScale', () => {
        scene.createVortexBackdrop();
        expect(scene.vortexBackdrop.scaleX).toBeCloseTo(GAME_CONFIG.ATMOSPHERE.VORTEX.ASPECT_X);
        expect(scene.vortexBackdrop.scaleY).toBeCloseTo(GAME_CONFIG.ATMOSPHERE.VORTEX.ASPECT_Y);
      });
    });

    describe('updateVortexRotation', () => {
      it('advances rotation by 2π / ROTATION_SECONDS per second of dt', () => {
        scene.createVortexBackdrop();
        scene.vortexBackdrop.rotation = 0;
        scene.updateVortexRotation(1.0); // one second
        const expected = (Math.PI * 2) / GAME_CONFIG.ATMOSPHERE.VORTEX.ROTATION_SECONDS;
        expect(scene.vortexBackdrop.rotation).toBeCloseTo(expected, 5);
      });

      it('no-ops when backdrop is not created', () => {
        scene.vortexBackdrop = undefined;
        expect(() => scene.updateVortexRotation(1.0)).not.toThrow();
      });

      it('skips rotation under prefers-reduced-motion', () => {
        const original = window.matchMedia;
        // @ts-expect-error overriding for test
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        try {
          scene.createVortexBackdrop();
          scene.vortexBackdrop.rotation = 0;
          scene.updateVortexRotation(1.0);
          expect(scene.vortexBackdrop.rotation).toBe(0);
        } finally {
          window.matchMedia = original;
        }
      });
    });

    describe('createScanlineOverlay', () => {
      it('creates a graphics layer at depth 90 so it paints above gameplay objects', () => {
        scene.createScanlineOverlay();
        expect(scene.scanlineOverlay).toBeDefined();
        expect(scene.scanlineOverlay.depth).toBe(90);
      });

      it('paints one fillRect per scanline row when reduced motion is off', () => {
        scene.createScanlineOverlay();
        const expectedRows = Math.ceil(
          GAME_CONFIG.HEIGHT / GAME_CONFIG.ATMOSPHERE.SCANLINE.STRIDE_PX,
        );
        expect(scene.scanlineOverlay.fillRect).toHaveBeenCalledTimes(expectedRows);
      });

      it('skips scanline drawing under prefers-reduced-motion (but keeps the object for cleanup)', () => {
        const original = window.matchMedia;
        // @ts-expect-error overriding for test
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        try {
          scene.createScanlineOverlay();
          expect(scene.scanlineOverlay).toBeDefined();
          expect(scene.scanlineOverlay.fillRect).not.toHaveBeenCalled();
        } finally {
          window.matchMedia = original;
        }
      });
    });

    describe('createPaddleGlows', () => {
      it('creates both player + AI glow rectangles at depth -5 (behind paddles)', () => {
        scene.createPaddleGlows();
        expect(scene.playerPaddleGlow).toBeDefined();
        expect(scene.aiPaddleGlow).toBeDefined();
        expect(scene.playerPaddleGlow.depth).toBe(-5);
        expect(scene.aiPaddleGlow.depth).toBe(-5);
      });

      it('sizes each glow as padded paddle dimensions so the halo extends past the paddle edges', () => {
        scene.createPaddleGlows();
        const pg = GAME_CONFIG.ATMOSPHERE.PADDLE_GLOW;
        expect(scene.playerPaddleGlow.width).toBe(GAME_CONFIG.PADDLE.WIDTH + pg.WIDTH_PAD);
        expect(scene.playerPaddleGlow.height).toBe(GAME_CONFIG.PADDLE.HEIGHT + pg.HEIGHT_PAD);
      });

      it('starts at MIN_ALPHA (faint halo) so there is no glow without a ball', () => {
        scene.createPaddleGlows();
        expect(scene.playerPaddleGlow.alpha).toBeCloseTo(GAME_CONFIG.ATMOSPHERE.PADDLE_GLOW.MIN_ALPHA);
      });
    });

    describe('updatePaddleGlows', () => {
      beforeEach(() => {
        scene.createPaddleGlows();
      });

      it('holds glow at MIN_ALPHA when no balls exist', () => {
        scene.balls = [];
        scene.updatePaddleGlows();
        expect(scene.playerPaddleGlow.alpha).toBeCloseTo(GAME_CONFIG.ATMOSPHERE.PADDLE_GLOW.MIN_ALPHA);
        expect(scene.aiPaddleGlow.alpha).toBeCloseTo(GAME_CONFIG.ATMOSPHERE.PADDLE_GLOW.MIN_ALPHA);
      });

      it('ramps glow toward MAX_ALPHA as the ball closes on the player paddle', () => {
        // Ball sitting right on the player paddle → norm = 1 → alpha = MAX_ALPHA.
        createBall(scene, scene.playerPaddle.x, scene.playerPaddle.y, 0, 0);
        scene.updatePaddleGlows();
        expect(scene.playerPaddleGlow.alpha).toBeCloseTo(GAME_CONFIG.ATMOSPHERE.PADDLE_GLOW.MAX_ALPHA);
      });

      it('holds player glow at MIN_ALPHA when ball is beyond THRESHOLD_PX away', () => {
        // Ball parked at the AI side, well beyond the player-glow threshold.
        const farX = scene.playerPaddle.x + GAME_CONFIG.ATMOSPHERE.PADDLE_GLOW.THRESHOLD_PX + 50;
        createBall(scene, farX, 225, 0, 0);
        scene.updatePaddleGlows();
        expect(scene.playerPaddleGlow.alpha).toBeCloseTo(GAME_CONFIG.ATMOSPHERE.PADDLE_GLOW.MIN_ALPHA);
      });

      it('tracks paddle Y so the glow sticks to the paddle vertically', () => {
        scene.playerPaddle.y = 123;
        scene.aiPaddle.y = 321;
        createBall(scene, 400, 200, 0, 0);
        scene.updatePaddleGlows();
        expect(scene.playerPaddleGlow.y).toBe(123);
        expect(scene.aiPaddleGlow.y).toBe(321);
      });

      it('boosts glow scale on closest approach when reduced motion is off', () => {
        createBall(scene, scene.playerPaddle.x, scene.playerPaddle.y, 0, 0);
        scene.updatePaddleGlows();
        expect(scene.playerPaddleGlow.scale).toBeCloseTo(1 + GAME_CONFIG.ATMOSPHERE.PADDLE_GLOW.SCALE_BOOST);
      });

      it('pins glow scale to 1 under prefers-reduced-motion (no pulsing swell)', () => {
        const original = window.matchMedia;
        // @ts-expect-error overriding for test
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        try {
          createBall(scene, scene.playerPaddle.x, scene.playerPaddle.y, 0, 0);
          scene.updatePaddleGlows();
          expect(scene.playerPaddleGlow.scale).toBe(1);
        } finally {
          window.matchMedia = original;
        }
      });

      it('no-ops safely when glow rectangles are not yet created', () => {
        scene.playerPaddleGlow = undefined;
        scene.aiPaddleGlow = undefined;
        expect(() => scene.updatePaddleGlows()).not.toThrow();
      });
    });
  });

  describe('R83.V1e + R84.P7 paddle-hit particle trail', () => {
    it('emits at least BASE_COUNT particles on a fresh-serve player hit', () => {
      const before = scene.add.circle.mock.calls.length;
      const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
      createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
      scene.timeSinceLastGoal = 0;
      scene.checkPaddleCollisions();
      const after = scene.add.circle.mock.calls.length;
      // Impact effect creates 2 circles; trail adds BASE_COUNT (12) more.
      expect(after - before).toBeGreaterThanOrEqual(GAME_CONFIG.PADDLE_TRAIL.BASE_COUNT);
    });

    it('skips particle trail under prefers-reduced-motion', () => {
      const original = window.matchMedia;
      // @ts-expect-error overriding for test
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      try {
        const before = scene.add.circle.mock.calls.length;
        const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
        createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
        scene.checkPaddleCollisions();
        const after = scene.add.circle.mock.calls.length;
        // Only the impact effect (2 circles) — no trail.
        expect(after - before).toBeLessThan(GAME_CONFIG.PADDLE_TRAIL.BASE_COUNT);
      } finally {
        window.matchMedia = original;
      }
    });
  });

  // ----------------------------------------------------------------------
  // R84.P7 — Trail count scales with ball speed tier
  // ----------------------------------------------------------------------
  describe('R84.P7 — Trail amplification', () => {
    it('config defines BASE_COUNT and MAX_COUNT with amplification headroom', () => {
      expect(GAME_CONFIG.PADDLE_TRAIL.BASE_COUNT).toBe(12);
      expect(GAME_CONFIG.PADDLE_TRAIL.MAX_COUNT).toBe(20);
      expect(GAME_CONFIG.PADDLE_TRAIL.MAX_COUNT).toBeGreaterThan(GAME_CONFIG.PADDLE_TRAIL.BASE_COUNT);
    });

    it('computeTrailParticleCount returns BASE_COUNT at fresh-serve multiplier (1.0)', () => {
      scene.isSlowBall = false;
      scene.timeSinceLastGoal = 0;
      expect(scene.computeTrailParticleCount()).toBe(GAME_CONFIG.PADDLE_TRAIL.BASE_COUNT);
    });

    it('computeTrailParticleCount returns MAX_COUNT at ball speed cap', () => {
      scene.isSlowBall = false;
      // Push well past the speed ramp cap; clamp should bind to MAX_COUNT.
      scene.timeSinceLastGoal = 1000;
      expect(scene.computeTrailParticleCount()).toBe(GAME_CONFIG.PADDLE_TRAIL.MAX_COUNT);
    });

    it('computeTrailParticleCount scales linearly between base and max', () => {
      scene.isSlowBall = false;
      // Halfway through the speed ramp. MAX/INITIAL = 900/420 ≈ 2.143.
      // Target multiplier ≈ 1 + 0.5*(2.143 - 1) = 1.5715 → t = 5.715 seconds.
      scene.timeSinceLastGoal = 5.715;
      const count = scene.computeTrailParticleCount();
      const midpoint = (GAME_CONFIG.PADDLE_TRAIL.BASE_COUNT + GAME_CONFIG.PADDLE_TRAIL.MAX_COUNT) / 2;
      // Allow ±1 particle due to rounding.
      expect(Math.abs(count - midpoint)).toBeLessThanOrEqual(1);
    });

    it('slower_ball power-up holds trail at BASE_COUNT (never thins below base)', () => {
      scene.isSlowBall = true;
      scene.timeSinceLastGoal = 0;
      expect(scene.computeTrailParticleCount()).toBe(GAME_CONFIG.PADDLE_TRAIL.BASE_COUNT);
    });

    it('player hit at top-tier speed emits MAX_COUNT particles', () => {
      scene.timeSinceLastGoal = 1000;
      const before = scene.add.circle.mock.calls.length;
      const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
      createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
      scene.checkPaddleCollisions();
      const after = scene.add.circle.mock.calls.length;
      // Impact effect (2) + MAX_COUNT (20) — expected ≥ 22.
      expect(after - before).toBeGreaterThanOrEqual(GAME_CONFIG.PADDLE_TRAIL.MAX_COUNT);
    });

    it('every particle uses the configured radius + alpha', () => {
      scene.timeSinceLastGoal = 0;
      const before = scene.add.circle.mock.calls.length;
      const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
      createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
      scene.checkPaddleCollisions();
      const trailCalls = scene.add.circle.mock.calls.slice(before).filter(
        (c: any[]) => c[2] === GAME_CONFIG.PADDLE_TRAIL.PARTICLE_RADIUS,
      );
      expect(trailCalls.length).toBe(GAME_CONFIG.PADDLE_TRAIL.BASE_COUNT);
      for (const c of trailCalls) {
        expect(c[4]).toBe(GAME_CONFIG.PADDLE_TRAIL.PARTICLE_ALPHA);
      }
    });
  });

  // ----------------------------------------------------------------------
  // R84.P5 — Power-up in-HUD legend
  // ----------------------------------------------------------------------
  describe('R84.P5 — Power-up legend', () => {
    function collectFresh(type: 'bigger_paddle' | 'slower_ball' | 'score_multiplier' | 'multi_ball') {
      const pu = {
        type,
        sprite: { x: 100, y: 100, destroy: vi.fn() },
      } as any;
      scene.fieldPowerUps.push(pu);
      scene.collectPowerUp(pu);
      return pu;
    }

    describe('config sanity', () => {
      it('POWERUP_LEGEND ships exactly 4 entries', () => {
        expect(POWERUP_LEGEND.ENTRIES).toHaveLength(4);
      });

      it('every entry carries name + effect + duration copy', () => {
        for (const e of POWERUP_LEGEND.ENTRIES) {
          expect(e.name.length).toBeGreaterThan(0);
          expect(e.effect.length).toBeGreaterThan(0);
          expect(e.duration.length).toBeGreaterThan(0);
        }
      });

      it('covers all four PowerUpType values', () => {
        const types = POWERUP_LEGEND.ENTRIES.map((e) => e.type).sort();
        expect(types).toEqual(['bigger_paddle', 'multi_ball', 'score_multiplier', 'slower_ball']);
      });

      it('display window is ~4 seconds (plan target)', () => {
        expect(POWERUP_LEGEND.DISPLAY_MS).toBeGreaterThanOrEqual(3000);
        expect(POWERUP_LEGEND.DISPLAY_MS).toBeLessThanOrEqual(5000);
      });

      it('inactive alpha dims but stays visible', () => {
        expect(POWERUP_LEGEND.INACTIVE_ALPHA).toBeGreaterThan(0);
        expect(POWERUP_LEGEND.INACTIVE_ALPHA).toBeLessThan(POWERUP_LEGEND.ACTIVE_ALPHA);
      });
    });

    describe('showPowerUpLegend rendering', () => {
      beforeEach(() => {
        scene.add.text.mockClear();
      });

      it('spawns 4 text instances on pickup', () => {
        // activatePowerUp also adds an indicator text; the legend itself owns
        // exactly 4 rows, tracked by the `powerUpLegend` array.
        collectFresh('bigger_paddle');
        expect(scene.powerUpLegend).toHaveLength(4);
      });

      it('lines are centred on canvas mid-x', () => {
        collectFresh('slower_ball');
        const cx = GAME_CONFIG.WIDTH / 2;
        for (const t of scene.powerUpLegend) {
          expect(t.x).toBe(cx);
          expect(t.originX).toBe(0.5);
        }
      });

      it('each line uses the correct power-up colour', () => {
        collectFresh('bigger_paddle');
        const colours = scene.powerUpLegend.map((t: any) => t.style.color);
        expect(colours).toEqual(['#00ff00', '#00ffff', '#ffff00', '#ff00ff']);
      });

      it('line text includes name, effect and duration', () => {
        collectFresh('multi_ball');
        const texts = scene.powerUpLegend.map((t: any) => t.text);
        expect(texts[0]).toContain('BIG');
        expect(texts[0]).toContain('PADDLE +50%');
        expect(texts[0]).toContain('10s');
        expect(texts[3]).toContain('MULTI');
        expect(texts[3]).toContain('NOW');
      });

      it('stacks lines vertically at LINE_HEIGHT spacing', () => {
        collectFresh('bigger_paddle');
        const ys = scene.powerUpLegend.map((t: any) => t.y);
        expect(ys[1] - ys[0]).toBe(POWERUP_LEGEND.LINE_HEIGHT);
        expect(ys[3] - ys[0]).toBe(POWERUP_LEGEND.LINE_HEIGHT * 3);
      });

      it('baseY anchors to BASE_Y_RATIO of canvas height', () => {
        collectFresh('bigger_paddle');
        expect(scene.powerUpLegend[0].y).toBeCloseTo(GAME_CONFIG.HEIGHT * POWERUP_LEGEND.BASE_Y_RATIO);
      });

      it('paints every row at render depth 100 (above gameplay)', () => {
        collectFresh('slower_ball');
        for (const t of scene.powerUpLegend) {
          expect(t.depth).toBe(100);
        }
      });

      it('schedules an auto-hide timer for DISPLAY_MS', () => {
        collectFresh('bigger_paddle');
        // activatePowerUp also registers a POWERUP.DURATION (10000ms) expiry
        // timer, so assert the legend's own 4000ms call is present.
        const legendCall = scene.time.delayedCall.mock.calls.find(
          (c: any[]) => c[0] === POWERUP_LEGEND.DISPLAY_MS,
        );
        expect(legendCall).toBeTruthy();
      });
    });

    describe('active-row highlighting', () => {
      it('tweens activated row to ACTIVE_ALPHA', () => {
        scene.tweens.add.mockClear();
        collectFresh('score_multiplier');
        const tweenCalls = scene.tweens.add.mock.calls;
        const activeTween = tweenCalls.find((c: any[]) => c[0].alpha === POWERUP_LEGEND.ACTIVE_ALPHA);
        expect(activeTween).toBeTruthy();
      });

      it('tweens non-activated rows to INACTIVE_ALPHA', () => {
        scene.tweens.add.mockClear();
        collectFresh('score_multiplier');
        const tweenCalls = scene.tweens.add.mock.calls;
        const inactiveTweens = tweenCalls.filter((c: any[]) => c[0].alpha === POWERUP_LEGEND.INACTIVE_ALPHA);
        expect(inactiveTweens).toHaveLength(3);
      });

      it('each pickup type highlights a different row', () => {
        for (const type of ['bigger_paddle', 'slower_ball', 'score_multiplier', 'multi_ball'] as const) {
          scene.clearPowerUpLegend();
          scene.tweens.add.mockClear();
          collectFresh(type);
          const activeTweens = scene.tweens.add.mock.calls.filter(
            (c: any[]) => c[0].alpha === POWERUP_LEGEND.ACTIVE_ALPHA,
          );
          expect(activeTweens).toHaveLength(1);
        }
      });
    });

    describe('repeat pickup refresh', () => {
      it('clears previous legend before spawning new cohort', () => {
        collectFresh('bigger_paddle');
        const firstCohort = scene.powerUpLegend;
        const firstDestroy = firstCohort.map((t: any) => t.destroy);
        collectFresh('slower_ball');
        for (const d of firstDestroy) expect(d).toHaveBeenCalled();
        expect(scene.powerUpLegend).not.toBe(firstCohort);
        expect(scene.powerUpLegend).toHaveLength(4);
      });

      it('cancels the prior hide timer so callbacks do not fire on dead text', () => {
        collectFresh('bigger_paddle');
        const firstTimer = scene.powerUpLegendHideTimer;
        collectFresh('slower_ball');
        expect(firstTimer.remove).toHaveBeenCalledWith(false);
        expect(scene.powerUpLegendHideTimer).not.toBe(firstTimer);
      });
    });

    describe('reduced-motion handling', () => {
      const withReducedMotion = (fn: () => void) => {
        const original = window.matchMedia;
        // @ts-expect-error overriding for test
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        try { fn(); } finally { window.matchMedia = original; }
      };

      it('skips fade-in tween and sets alpha directly', () => {
        withReducedMotion(() => {
          scene.tweens.add.mockClear();
          collectFresh('bigger_paddle');
          expect(scene.tweens.add).not.toHaveBeenCalled();
          expect(scene.powerUpLegend[0].alpha).toBe(POWERUP_LEGEND.ACTIVE_ALPHA);
          expect(scene.powerUpLegend[1].alpha).toBe(POWERUP_LEGEND.INACTIVE_ALPHA);
        });
      });

      it('hidePowerUpLegend clears text immediately when reduced-motion is set', () => {
        withReducedMotion(() => {
          collectFresh('bigger_paddle');
          scene.tweens.add.mockClear();
          scene.hidePowerUpLegend();
          expect(scene.tweens.add).not.toHaveBeenCalled();
          expect(scene.powerUpLegend).toHaveLength(0);
        });
      });
    });

    describe('safety', () => {
      it('hidePowerUpLegend is a no-op when no legend is visible', () => {
        scene.tweens.add.mockClear();
        scene.hidePowerUpLegend();
        expect(scene.tweens.add).not.toHaveBeenCalled();
      });

      it('clearPowerUpLegend kills tweens + destroys all text', () => {
        collectFresh('bigger_paddle');
        const cohort = scene.powerUpLegend;
        const destroyFns = cohort.map((t: any) => t.destroy);
        scene.clearPowerUpLegend();
        for (const d of destroyFns) expect(d).toHaveBeenCalled();
        expect(scene.powerUpLegend).toHaveLength(0);
        expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(cohort);
      });
    });
  });

  // ----------------------------------------------------------------------
  // R84.P6 — Multi-ball visual distinction (CYAN tint)
  // ----------------------------------------------------------------------
  describe('R84.P6 — Multi-ball CYAN tint', () => {
    beforeEach(() => {
      scene.balls = [];
    });

    it('spawnBall with no options flags the ball as primary (isMultiBall=false)', () => {
      scene.spawnBall();
      expect(scene.balls).toHaveLength(1);
      expect(scene.balls[0].isMultiBall).toBe(false);
    });

    it('primary ball sprite does NOT receive setTint', () => {
      scene.spawnBall();
      expect(scene.balls[0].sprite.setTint).not.toHaveBeenCalled();
    });

    it('spawnBall with isMultiBall:true flags the ball as multi', () => {
      scene.spawnBall(200, 200, 100, 50, { isMultiBall: true });
      expect(scene.balls[0].isMultiBall).toBe(true);
    });

    it('multi-ball sprite receives setTint(CYAN=0x00ffff)', () => {
      scene.spawnBall(200, 200, 100, 50, { isMultiBall: true });
      expect(scene.balls[0].sprite.setTint).toHaveBeenCalledWith(0x00ffff);
      expect(scene.balls[0].sprite.tint).toBe(0x00ffff);
    });

    it('spawnMultiBalls produces tinted balls only', () => {
      // Seed a primary ball so spawnMultiBalls adds 2 extras.
      scene.spawnBall();
      const countBefore = scene.balls.length;
      scene.spawnMultiBalls();
      const spawned = scene.balls.slice(countBefore);
      expect(spawned.length).toBeGreaterThan(0);
      for (const b of spawned) {
        expect(b.isMultiBall).toBe(true);
        expect(b.sprite.setTint).toHaveBeenCalledWith(0x00ffff);
      }
    });

    it('original primary ball keeps its green sprite after spawnMultiBalls', () => {
      scene.spawnBall();
      const primary = scene.balls[0];
      scene.spawnMultiBalls();
      expect(primary.isMultiBall).toBe(false);
      expect(primary.sprite.setTint).not.toHaveBeenCalled();
    });

    it('post-goal respawn (empty balls array) spawns untinted primary ball', () => {
      // Simulate a multi-ball run being cleared out.
      scene.spawnBall();
      scene.spawnMultiBalls();
      scene.balls.forEach((b: any) => b.sprite.destroy());
      scene.balls = [];
      scene.spawnBall();
      expect(scene.balls).toHaveLength(1);
      expect(scene.balls[0].isMultiBall).toBe(false);
      expect(scene.balls[0].sprite.setTint).not.toHaveBeenCalled();
    });

    it('spawnMultiBalls caps at min(2, 3 - balls.length) — starts with 1, adds 2', () => {
      scene.spawnBall();
      scene.spawnMultiBalls();
      expect(scene.balls).toHaveLength(3);
    });

    it('spawnMultiBalls caps at 1 extra when 2 balls already in play', () => {
      scene.spawnBall();
      scene.spawnBall(100, 100, 100, 0, { isMultiBall: true });
      expect(scene.balls).toHaveLength(2);
      scene.spawnMultiBalls();
      expect(scene.balls).toHaveLength(3);
    });
  });

  // ----------------------------------------------------------------------
  // R84.P8 — Ball rally counter UI
  // ----------------------------------------------------------------------
  describe('R84.P8 — Rally counter UI', () => {
    describe('config sanity', () => {
      it('RALLY_COUNTER block is present with all pulse fields', () => {
        const rc = GAME_CONFIG.RALLY_COUNTER;
        expect(rc.Y).toBeGreaterThan(0);
        expect(rc.FONT_SIZE).toBeGreaterThan(0);
        expect(rc.COLOR).toMatch(/^#[0-9a-f]{6}$/i);
        expect(rc.PULSE_FROM).toBeGreaterThan(rc.PULSE_TO);
        expect(rc.PULSE_DURATION_MS).toBeGreaterThan(0);
      });

      it('counter sits above the score digits (y=30)', () => {
        expect(GAME_CONFIG.RALLY_COUNTER.Y).toBeLessThan(30);
      });

      it('colour is the CYAN rally/multi-ball family', () => {
        expect(GAME_CONFIG.RALLY_COUNTER.COLOR.toLowerCase()).toBe('#00ffff');
      });
    });

    describe('updateRallyCounter', () => {
      beforeEach(() => {
        scene.tweens.add.mockClear();
        scene.tweens.killTweensOf.mockClear();
      });

      it('renders "RALLY xN" for the current rallyCount', () => {
        scene.rallyCount = 3;
        scene.updateRallyCounter();
        expect(scene.rallyCounterText.text).toBe('RALLY x3');
      });

      it('snaps alpha to 1 when the counter updates', () => {
        scene.rallyCount = 1;
        scene.updateRallyCounter();
        expect(scene.rallyCounterText.alpha).toBe(1);
      });

      it('fires a scale-pulse tween keyed at PULSE_FROM → PULSE_TO', () => {
        scene.rallyCount = 2;
        scene.updateRallyCounter();
        const rc = GAME_CONFIG.RALLY_COUNTER;
        const pulseCall = scene.tweens.add.mock.calls.find(
          (c: any[]) => c[0].targets === scene.rallyCounterText
            && c[0].scale?.from === rc.PULSE_FROM
            && c[0].scale?.to === rc.PULSE_TO,
        );
        expect(pulseCall).toBeTruthy();
        expect(pulseCall[0].duration).toBe(rc.PULSE_DURATION_MS);
        expect(pulseCall[0].ease).toBe(rc.PULSE_EASE);
      });

      it('kills any in-flight pulse before spawning a new one', () => {
        scene.rallyCount = 1;
        scene.updateRallyCounter();
        scene.rallyCount = 2;
        scene.updateRallyCounter();
        expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(scene.rallyCounterText);
      });

      it('skips the tween under prefers-reduced-motion but still updates text + alpha', () => {
        const original = window.matchMedia;
        // @ts-expect-error overriding for test
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        try {
          scene.rallyCount = 4;
          scene.updateRallyCounter();
          expect(scene.tweens.add).not.toHaveBeenCalled();
          expect(scene.rallyCounterText.text).toBe('RALLY x4');
          expect(scene.rallyCounterText.alpha).toBe(1);
        } finally {
          window.matchMedia = original;
        }
      });

      it('is a safe no-op when rallyCounterText is not yet created', () => {
        scene.rallyCounterText = undefined;
        expect(() => scene.updateRallyCounter()).not.toThrow();
      });
    });

    describe('paddle-hit integration', () => {
      it('player paddle hit pulses the counter with the incremented count', () => {
        scene.tweens.add.mockClear();
        const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
        createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
        scene.checkPaddleCollisions();
        expect(scene.rallyCounterText.text).toBe('RALLY x1');
        expect(scene.rallyCounterText.alpha).toBe(1);
      });

      it('AI paddle hit does NOT touch the rally counter (rallyCount unchanged)', () => {
        // onAIPaddleHit doesn't increment rallyCount by design, so the
        // counter should stay at whatever the last player-hit state was.
        scene.rallyCount = 3;
        scene.rallyCounterText.text = 'RALLY x3';
        const paddleLeft = scene.aiPaddle.x - GAME_CONFIG.PADDLE.WIDTH / 2;
        createBall(scene, paddleLeft, scene.aiPaddle.y, 420, 0);
        scene.checkPaddleCollisions();
        expect(scene.rallyCount).toBe(3);
        expect(scene.rallyCounterText.text).toBe('RALLY x3');
      });

      it('counter advances across successive player returns', () => {
        for (let i = 1; i <= 3; i++) {
          // Re-seed a ball each return (previous one was bounced back past the paddle).
          scene.balls = [];
          const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
          createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
          scene.checkPaddleCollisions();
          expect(scene.rallyCounterText.text).toBe(`RALLY x${i}`);
        }
      });
    });

    describe('hide on goal', () => {
      it('player-goal resets counter text + alpha to hidden', () => {
        scene.rallyCount = 7;
        scene.rallyCounterText.setText('RALLY x7');
        scene.rallyCounterText.setAlpha(1);
        createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
        scene.checkGoals();
        expect(scene.rallyCounterText.alpha).toBe(0);
        expect(scene.rallyCounterText.text).toBe('');
      });

      it('AI-goal also resets counter text + alpha to hidden', () => {
        scene.rallyCount = 4;
        scene.rallyCounterText.setText('RALLY x4');
        scene.rallyCounterText.setAlpha(1);
        createBall(scene, -10, 225, -420, 0);
        scene.checkGoals();
        expect(scene.rallyCounterText.alpha).toBe(0);
        expect(scene.rallyCounterText.text).toBe('');
      });

      it('hideRallyCounter kills any lingering pulse tween', () => {
        scene.tweens.killTweensOf.mockClear();
        scene.hideRallyCounter();
        expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(scene.rallyCounterText);
      });

      it('hideRallyCounter is a safe no-op when the text is not yet created', () => {
        scene.rallyCounterText = undefined;
        expect(() => scene.hideRallyCounter()).not.toThrow();
      });
    });

    describe('createUI wiring', () => {
      it('createUI creates the rally counter and hides it on fresh serve', () => {
        // Use a fresh createMatrixText that yields per-call instances so we
        // can inspect the 4th (rally) call independently from score/combo.
        const created: any[] = [];
        scene.createMatrixText = vi.fn().mockImplementation((x: number, y: number, content: string, size: number, colour: string) => {
          const t: any = {
            x, y, text: content, size, colour,
            alpha: 1, scale: 1,
            setText: vi.fn(function (this: any, s: string) { this.text = s; return this; }),
            setAlpha: vi.fn(function (this: any, a: number) { this.alpha = a; return this; }),
            destroy: vi.fn(),
          };
          created.push(t);
          return t;
        });
        scene.createUI();
        // 4 texts: playerScore, aiScore, combo, rally
        expect(created).toHaveLength(4);
        const rally = created[3];
        expect(rally.x).toBe(GAME_CONFIG.WIDTH / 2);
        expect(rally.y).toBe(GAME_CONFIG.RALLY_COUNTER.Y);
        expect(rally.size).toBe(GAME_CONFIG.RALLY_COUNTER.FONT_SIZE);
        expect(rally.colour).toBe(GAME_CONFIG.RALLY_COUNTER.COLOR);
        expect(rally.alpha).toBe(0);
      });
    });
  });
});
