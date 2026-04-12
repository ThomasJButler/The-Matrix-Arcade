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

  // Phaser camera
  scene.cameras = {
    main: { shake: vi.fn(), setBackgroundColor: vi.fn() },
  };

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
    scene.playerPaddle = { x: GAME_CONFIG.PADDLE.OFFSET_X + GAME_CONFIG.PADDLE.WIDTH / 2, y: 225, width: GAME_CONFIG.PADDLE.WIDTH, height: GAME_CONFIG.PADDLE.HEIGHT, setSize: vi.fn(), destroy: vi.fn() };
    scene.aiPaddle = { x: GAME_CONFIG.WIDTH - GAME_CONFIG.PADDLE.OFFSET_X - GAME_CONFIG.PADDLE.WIDTH / 2, y: 225, width: GAME_CONFIG.PADDLE.WIDTH, height: GAME_CONFIG.PADDLE.HEIGHT, setSize: vi.fn(), destroy: vi.fn() };
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
      expect(scene.playSound).toHaveBeenCalledWith('pongBounce');
    });

    it('bounces off bottom wall', () => {
      const ball = createBall(scene, 400, GAME_CONFIG.HEIGHT - 2, 0, 420);
      scene.updateBalls(0.016);
      expect(ball.vy).toBeLessThan(0);
      expect(scene.playSound).toHaveBeenCalledWith('pongBounce');
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
      expect(scene.playSound).toHaveBeenCalledWith('pongBounce');
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

    it('applies scoreMultiplier to player score', () => {
      scene.scoreMultiplier = 2;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.playerScore).toBe(2);
    });

    it('applies combo bonus when no score multiplier', () => {
      scene.combo = 6;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.playerScore).toBe(3); // 1 base + floor(6/3) = 3
    });

    it('does not apply combo bonus when score multiplier active', () => {
      scene.scoreMultiplier = 2;
      scene.combo = 6;
      createBall(scene, GAME_CONFIG.WIDTH + 10, 225, 420, 0);
      scene.checkGoals();
      expect(scene.playerScore).toBe(2); // 2x multiplier, no combo
    });

    it('applies scoreMultiplier to AI score', () => {
      scene.scoreMultiplier = 2;
      createBall(scene, -10, 225, -420, 0);
      scene.checkGoals();
      expect(scene.aiScore).toBe(2);
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
      expect(scene.reportScore).toHaveBeenCalledWith(scene.playerScore);
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
      const origRandom = Math.random;
      let call = 0;
      // First call: error offset = 0; second call: no mistake
      Math.random = () => { call++; return call === 1 ? 0.5 : 0.99; };
      try {
        createBall(scene, 600, 100, 200, 0);
        scene.aiPaddle.y = 300;
        scene.aiPaddleVelocity = 0;
        scene.updateAI(0.1);
        expect(scene.aiPaddleVelocity).toBeLessThan(0);
      } finally {
        Math.random = origRandom;
      }
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
      expect(scene.playSound).toHaveBeenCalledWith('powerup');
    });

    it('does not collect distant power-up', () => {
      createBall(scene, 100, 100, 100, 0);
      const mockSprite = { x: 500, y: 400, destroy: vi.fn() };
      scene.fieldPowerUps = [{ sprite: mockSprite, type: 'bigger_paddle' as const }];
      scene.checkPowerUpCollisions();
      expect(scene.fieldPowerUps.length).toBe(1);
    });
  });
});
