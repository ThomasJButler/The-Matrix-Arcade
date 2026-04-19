/**
 * VortexPongGameScene — Unit Tests
 *
 * Phaser is fully mocked (jsdom cannot do WebGL). We construct the scene,
 * bind prototype methods onto the mock instance, then stub out BaseScene
 * helpers and Phaser APIs. This lets us test game logic in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VortexPongGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS } from '../config';

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

  // Timer
  scene.time = {
    addEvent: vi.fn().mockReturnValue({ destroy: vi.fn(), delay: 0 }),
    delayedCall: vi.fn().mockReturnValue({ destroy: vi.fn() }),
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

  // Graphics (for center line)
  scene.add = {
    graphics: vi.fn().mockReturnValue({
      lineStyle: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokePath: vi.fn(),
      fillStyle: vi.fn(),
      fillCircle: vi.fn(),
      strokeCircle: vi.fn(),
      generateTexture: vi.fn(),
      destroy: vi.fn(),
      setStrokeStyle: vi.fn(),
      setScale: vi.fn(),
      setAlpha: vi.fn(),
    }),
    rectangle: vi.fn().mockImplementation((x: number, y: number, w: number, h: number) => ({
      x, y, width: w, height: h,
      setSize: vi.fn(),
      destroy: vi.fn(),
    })),
    image: vi.fn().mockImplementation((x: number, y: number) => ({
      x, y,
      setDisplaySize: vi.fn(),
      setDepth: vi.fn(),
      setAlpha: vi.fn(),
      destroy: vi.fn(),
    })),
    sprite: vi.fn().mockImplementation((x: number, y: number) => ({
      x, y,
      setAlpha: vi.fn(),
      destroy: vi.fn(),
    })),
    circle: vi.fn().mockImplementation((x: number, y: number, r: number) => ({
      x, y, radius: r,
      setStrokeStyle: vi.fn(),
      setScale: vi.fn(),
      setAlpha: vi.fn(),
      destroy: vi.fn(),
    })),
    text: vi.fn().mockReturnValue({
      setText: vi.fn(),
      setAlpha: vi.fn(),
      destroy: vi.fn(),
    }),
  };

  // Game config (accessed by BaseScene for width/height)
  scene.game = { config: { width: GAME_CONFIG.WIDTH, height: GAME_CONFIG.HEIGHT } };

  // Phaser scene manager
  scene.scene = { restart: vi.fn(), start: vi.fn() };

  // Initialise state by calling resetState
  scene.resetState();

  return scene;
}

function createBall(scene: any, x = 400, y = 225, vx = 420, vy = 0) {
  const sprite = { x, y, destroy: vi.fn() };
  const ball = { sprite, vx, vy };
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

  describe('R83.V1e paddle-hit particle trail', () => {
    it('emits 10 particles on player paddle hit', () => {
      const before = scene.add.circle.mock.calls.length;
      const paddleRight = scene.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2;
      createBall(scene, paddleRight, scene.playerPaddle.y, -420, 0);
      scene.checkPaddleCollisions();
      const after = scene.add.circle.mock.calls.length;
      // Impact effect creates 2 circles (ring + glow); trail adds 10 more.
      expect(after - before).toBeGreaterThanOrEqual(10);
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
        expect(after - before).toBeLessThan(10);
      } finally {
        window.matchMedia = original;
      }
    });
  });
});
