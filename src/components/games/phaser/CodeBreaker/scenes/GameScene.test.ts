import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { CodeBreakerGameScene } from './GameScene';
import {
  GAME_CONFIG,
  ACHIEVEMENTS,
  POWERUP_DEFS,
  POWERUP_LEGEND,
  LEVELS,
  BRICK_DEFS,
  getBrickType,
  type PowerUpType,
} from '../config';

const C = GAME_CONFIG;

function collectPrototypeMethods(cls: new (...args: unknown[]) => unknown): string[] {
  const methods: string[] = [];
  let proto = cls.prototype;
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key !== 'constructor' && typeof proto[key] === 'function' && !methods.includes(key)) {
        methods.push(key);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return methods;
}

function createMockGraphics() {
  const g: Record<string, unknown> = {
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    fillRoundedRect: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    lineBetween: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    strokeRoundedRect: vi.fn().mockReturnThis(),
    strokeCircle: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
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
    visible: true,
  };
}

function createMockSprite(x = 0, y = 0) {
  const sprite: Record<string, unknown> = {
    x,
    y,
    active: true,
    visible: true,
    width: 40,
    height: 30,
    setAlpha: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
    setDisplaySize: vi.fn().mockReturnThis(),
    setVisible: vi.fn(function (this: Record<string, unknown>, v: boolean) { this.visible = v; return this; }),
    setScale: vi.fn().mockReturnThis(),
    setTint: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    clearTint: vi.fn().mockReturnThis(),
    destroy: vi.fn(function (this: Record<string, unknown>) { this.active = false; }),
  };
  return sprite;
}

function createMockRect(x = 0, y = 0, w = 10, h = 10) {
  return {
    x,
    y,
    width: w,
    height: h,
    setAlpha: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
}

function createMockCircle(x = 0, y = 0, r = 6) {
  return {
    x,
    y,
    radius: r,
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTestScene(): any {
  const scene = new CodeBreakerGameScene();

  for (const name of collectPrototypeMethods(CodeBreakerGameScene)) {
    const fn = CodeBreakerGameScene.prototype[name as keyof typeof CodeBreakerGameScene.prototype];
    if (typeof fn === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scene[name] = (fn as any).bind(scene);
    }
  }

  scene.playSound = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.createMatrixText = vi.fn().mockImplementation(() => createMockText());
  scene.createMatrixBackground = vi.fn();
  scene.addMatrixRain = vi.fn().mockReturnValue({ getChildren: () => [] });
  scene.updateMatrixRain = vi.fn();
  scene.setupCommonInputs = vi.fn();
  scene.exposeTestState = vi.fn();

  scene.cameras = { main: { shake: vi.fn(), flash: vi.fn(), setBackgroundColor: vi.fn() } };
  scene.tweens = {
    add: vi.fn().mockReturnValue({ destroy: vi.fn() }),
    killTweensOf: vi.fn(),
    killAll: vi.fn(),
  };
  scene.time = {
    addEvent: vi.fn().mockReturnValue({ destroy: vi.fn(), delay: 0, remove: vi.fn() }),
    // R87.K7 — mock mirrors Phaser.Time.TimerEvent's `remove` API so
    // clearPowerUpLegend() can cancel the hide-timer without NPE-ing.
    delayedCall: vi.fn().mockReturnValue({ destroy: vi.fn(), remove: vi.fn() }),
    removeAllEvents: vi.fn(),
  };
  scene.input = {
    keyboard: {
      addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }),
      removeAllKeys: vi.fn(),
      createCursorKeys: vi.fn().mockReturnValue({
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false },
      }),
    },
    on: vi.fn(),
    off: vi.fn(),
    activePointer: { isDown: false, x: C.WIDTH / 2 },
  };
  scene.add = {
    graphics: vi.fn().mockImplementation(() => createMockGraphics()),
    rectangle: vi.fn().mockImplementation((x: number, y: number, w: number, h: number) => createMockRect(x, y, w, h)),
    sprite: vi.fn().mockImplementation((x: number, y: number) => createMockSprite(x, y)),
    text: vi.fn().mockImplementation(() => createMockText()),
    circle: vi.fn().mockImplementation((x: number, y: number, r: number) => createMockCircle(x, y, r)),
    image: vi.fn().mockImplementation((x: number, y: number) => createMockSprite(x, y)),
  };
  scene.make = {
    graphics: vi.fn().mockImplementation(() => createMockGraphics()),
  };
  scene.game = { config: { width: C.WIDTH, height: C.HEIGHT }, renderer: { type: 1 } };
  scene.scene = { restart: vi.fn(), start: vi.fn(), stop: vi.fn() };
  scene.scale = { width: C.WIDTH, height: C.HEIGHT };
  scene.events = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };
  scene.sys = { game: scene.game };
  scene.registry = { get: vi.fn().mockReturnValue(undefined), set: vi.fn() };
  scene.isPaused = false;

  scene.resetState();
  return scene;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const s = (scene: any, key: string) => scene[key];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = (scene: any, method: string, ...args: unknown[]) => scene[method](...args);

describe('CodeBreakerGameScene', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let scene: any;

  beforeEach(() => {
    scene = createTestScene();

    scene.paddle = createMockSprite(C.WIDTH / 2, C.PADDLE_Y);
    scene.scoreText = createMockText();
    scene.levelText = createMockText();
    scene.livesText = createMockText();
    scene.comboText = createMockText();
    scene.highScoreText = createMockText();
    scene.bulletTimeText = { ...createMockText(), visible: false };
    // R87.K6 — bullet-time HUD elements (label + meter bar). Present in
    // every test so updateHUD() can paint without NPE-ing when tests
    // exercise paths that flow through updateBulletTimeHUD.
    scene.bulletTimeMeterText = createMockText();
    scene.bulletTimeMeterBar = createMockGraphics();
    scene.levelCompleteText = { ...createMockText(), visible: false };
    scene.attachHintText = createMockText();
    scene.matrixRainGroup = { getChildren: () => [] };

    scene.cursors = {
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false },
    };
    scene.spaceKey = { isDown: false };
    scene.wasdA = { isDown: false };
    scene.wasdD = { isDown: false };
    scene.numpadLeft = { isDown: false };
    scene.numpadRight = { isDown: false };
    scene.bulletTimeKey = { isDown: false };

    (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(false);
    (Phaser as Record<string, unknown>).Math = {
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
    };
  });

  describe('Initial State', () => {
    it('starts with score 0', () => {
      expect(s(scene, 'score')).toBe(0);
    });

    it('starts with level 1', () => {
      expect(s(scene, 'level')).toBe(1);
    });

    it('starts with 3 lives', () => {
      expect(s(scene, 'lives')).toBe(C.LIVES);
    });

    it('starts with combo 0', () => {
      expect(s(scene, 'combo')).toBe(0);
    });

    it('starts not game over', () => {
      expect(s(scene, 'isGameOver')).toBe(false);
    });

    it('starts with level not complete', () => {
      expect(s(scene, 'isLevelComplete')).toBe(false);
    });

    it('starts with ball attached', () => {
      expect(s(scene, 'isBallAttached')).toBe(true);
    });

    it('starts with bullet time inactive', () => {
      expect(s(scene, 'bulletTimeActive')).toBe(false);
    });

    it('starts with no agents killed', () => {
      expect(s(scene, 'agentsKilled')).toBe(0);
    });

    it('starts with empty arrays', () => {
      expect(s(scene, 'balls')).toHaveLength(0);
      expect(s(scene, 'bricks')).toHaveLength(0);
      expect(s(scene, 'agents')).toHaveLength(0);
      expect(s(scene, 'lasers')).toHaveLength(0);
      expect(s(scene, 'fieldPowerUps')).toHaveLength(0);
      expect(s(scene, 'particles')).toHaveLength(0);
    });

    it('starts with no boss', () => {
      expect(s(scene, 'boss')).toBeNull();
    });

    it('starts with no firewall', () => {
      expect(s(scene, 'firewallActive')).toBe(false);
    });

    it('starts with standard paddle width', () => {
      expect(s(scene, 'paddleWidth')).toBe(C.PADDLE_WIDTH);
    });
  });

  describe('Paddle Movement', () => {
    it('moves left when left arrow pressed', () => {
      scene.cursors.left.isDown = true;
      scene.input.activePointer.x = scene.paddle.x;
      const startX = scene.paddle.x;
      call(scene, 'handlePaddleMovement', 1 / 60);
      expect(scene.paddle.x).toBeLessThan(startX);
    });

    it('moves right when right arrow pressed', () => {
      scene.cursors.right.isDown = true;
      scene.input.activePointer.x = scene.paddle.x;
      const startX = scene.paddle.x;
      call(scene, 'handlePaddleMovement', 1 / 60);
      expect(scene.paddle.x).toBeGreaterThan(startX);
    });

    it('moves left with A key', () => {
      scene.wasdA.isDown = true;
      scene.input.activePointer.x = scene.paddle.x;
      const startX = scene.paddle.x;
      call(scene, 'handlePaddleMovement', 1 / 60);
      expect(scene.paddle.x).toBeLessThan(startX);
    });

    it('moves right with D key', () => {
      scene.wasdD.isDown = true;
      scene.input.activePointer.x = scene.paddle.x;
      const startX = scene.paddle.x;
      call(scene, 'handlePaddleMovement', 1 / 60);
      expect(scene.paddle.x).toBeGreaterThan(startX);
    });

    it('clamps to left boundary', () => {
      scene.paddle.x = 5;
      scene.cursors.left.isDown = true;
      scene.input.activePointer.x = 5;
      call(scene, 'handlePaddleMovement', 1);
      expect(scene.paddle.x).toBe(C.PADDLE_WIDTH / 2);
    });

    it('clamps to right boundary', () => {
      scene.paddle.x = C.WIDTH - 5;
      scene.cursors.right.isDown = true;
      scene.input.activePointer.x = C.WIDTH - 5;
      call(scene, 'handlePaddleMovement', 1);
      expect(scene.paddle.x).toBe(C.WIDTH - C.PADDLE_WIDTH / 2);
    });

    it('attached ball follows paddle', () => {
      scene.isBallAttached = true;
      const ball = createMockCircle(scene.paddle.x, scene.paddle.y - 20);
      scene.balls = [{ sprite: ball, vx: 0, vy: 0 }];
      scene.cursors.right.isDown = true;
      scene.input.activePointer.x = scene.paddle.x;
      call(scene, 'handlePaddleMovement', 1 / 60);
      expect(ball.x).toBe(scene.paddle.x);
    });
  });

  describe('Ball Launch', () => {
    it('launches ball on space press', () => {
      scene.isBallAttached = true;
      const ball = { sprite: createMockCircle(), vx: 0, vy: 0 };
      scene.balls = [ball];

      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      call(scene, 'handleLaunch');
      expect(s(scene, 'isBallAttached')).toBe(false);
      expect(ball.vy).toBeLessThan(0);
    });

    it('does not launch when already launched', () => {
      scene.isBallAttached = false;
      scene.balls = [{ sprite: createMockCircle(), vx: 100, vy: -200 }];

      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      call(scene, 'handleLaunch');
      expect(scene.balls[0].vy).toBe(-200);
    });
  });

  describe('Ball Physics', () => {
    it('moves ball by velocity * dt', () => {
      scene.isBallAttached = false;
      const ball = { sprite: createMockCircle(100, 200), vx: 300, vy: -300 };
      scene.balls = [ball];
      call(scene, 'updateBalls', 1 / 60);
      expect(ball.sprite.x).toBeCloseTo(100 + 300 / 60, 1);
      expect(ball.sprite.y).toBeCloseTo(200 - 300 / 60, 1);
    });

    it('does not move attached ball', () => {
      scene.isBallAttached = true;
      const ball = { sprite: createMockCircle(100, 200), vx: 300, vy: -300 };
      scene.balls = [ball];
      call(scene, 'updateBalls', 1 / 60);
      expect(ball.sprite.x).toBe(100);
      expect(ball.sprite.y).toBe(200);
    });
  });

  describe('Wall Collisions', () => {
    it('bounces off left wall', () => {
      scene.isBallAttached = false;
      const ball = { sprite: createMockCircle(2, 200), vx: -300, vy: -200 };
      scene.balls = [ball];
      call(scene, 'checkBallWallCollisions');
      expect(ball.vx).toBeGreaterThan(0);
    });

    it('bounces off right wall', () => {
      scene.isBallAttached = false;
      const ball = { sprite: createMockCircle(C.WIDTH - 2, 200), vx: 300, vy: -200 };
      scene.balls = [ball];
      call(scene, 'checkBallWallCollisions');
      expect(ball.vx).toBeLessThan(0);
    });

    it('bounces off top wall', () => {
      scene.isBallAttached = false;
      const ball = { sprite: createMockCircle(200, 2), vx: 200, vy: -300 };
      scene.balls = [ball];
      call(scene, 'checkBallWallCollisions');
      expect(ball.vy).toBeGreaterThan(0);
    });
  });

  describe('Brick Collision', () => {
    it('destroys 1HP brick on hit', () => {
      scene.isBallAttached = false;
      const ball = { sprite: createMockCircle(200, 100), vx: 0, vy: -300 };
      scene.balls = [ball];

      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite,
        type: 'code',
        health: 1,
        maxHealth: 1,
        value: 10,
        row: 0,
        col: 0,
        width: C.BRICK_WIDTH,
        height: C.BRICK_HEIGHT,
      }];

      call(scene, 'checkBallBrickCollisions');
      expect(scene.bricks).toHaveLength(0);
    });

    it('damages 2HP brick without destroying', () => {
      scene.isBallAttached = false;
      const ball = { sprite: createMockCircle(200, 100), vx: 0, vy: -300 };
      scene.balls = [ball];

      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite,
        type: 'agent',
        health: 2,
        maxHealth: 2,
        value: 30,
        row: 0,
        col: 0,
        width: C.BRICK_WIDTH,
        height: C.BRICK_HEIGHT,
      }];

      call(scene, 'checkBallBrickCollisions');
      expect(scene.bricks).toHaveLength(1);
      expect(scene.bricks[0].health).toBe(1);
    });

    it('does not destroy unbreakable bricks', () => {
      scene.isBallAttached = false;
      const ball = { sprite: createMockCircle(200, 100), vx: 0, vy: -300 };
      scene.balls = [ball];

      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite,
        type: 'unbreakable',
        health: 999,
        maxHealth: 999,
        value: 0,
        row: 0,
        col: 0,
        width: C.BRICK_WIDTH,
        height: C.BRICK_HEIGHT,
      }];

      call(scene, 'checkBallBrickCollisions');
      expect(scene.bricks).toHaveLength(1);
      expect(scene.bricks[0].health).toBe(999);
    });
  });

  describe('Scoring', () => {
    it('awards points on brick destroy', () => {
      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite, type: 'code', health: 1, maxHealth: 1,
        value: 10, row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
      }];
      call(scene, 'destroyBrick', 0);
      expect(s(scene, 'score')).toBe(11);
    });

    it('increments combo on each brick destroyed', () => {
      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite, type: 'code', health: 1, maxHealth: 1,
        value: 10, row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
      }];
      call(scene, 'destroyBrick', 0);
      expect(s(scene, 'combo')).toBe(1);
    });

    it('applies combo multiplier to score', () => {
      scene.combo = 5;
      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite, type: 'code', health: 1, maxHealth: 1,
        value: 10, row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
      }];
      call(scene, 'destroyBrick', 0);
      expect(s(scene, 'score')).toBe(Math.floor(10 * (1 + 6 * C.COMBO_MULTIPLIER)));
    });

    it('reports score on brick destroy', () => {
      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite, type: 'code', health: 1, maxHealth: 1,
        value: 10, row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
      }];
      call(scene, 'destroyBrick', 0);
      expect(scene.reportScore).toHaveBeenCalled();
    });

    it('plays score sound', () => {
      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite, type: 'code', health: 1, maxHealth: 1,
        value: 10, row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
      }];
      call(scene, 'destroyBrick', 0);
      expect(scene.playSound).toHaveBeenCalledWith('score');
    });

    it('updates high score when exceeded', () => {
      scene.highScore = 0;
      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite, type: 'sentinel', health: 1, maxHealth: 3,
        value: 50, row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
      }];
      call(scene, 'destroyBrick', 0);
      expect(s(scene, 'highScore')).toBeGreaterThan(0);
    });
  });

  describe('Bullet Time', () => {
    // R87.K6 — B-press now requires a full charge meter. The shared setup
    // seeds bulletTimeMeter to MAX so these tests continue to exercise the
    // activation path; see the `R87.K6 — Manual bullet-time charge meter`
    // block below for the gate + meter-accumulation behaviour tests.
    beforeEach(() => {
      scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX;
    });

    it('activates on B key press', () => {
      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      scene.bulletTimeKey = { isDown: true };
      call(scene, 'handleBulletTime');
      expect(s(scene, 'bulletTimeActive')).toBe(true);
    });

    it('increments usage counter', () => {
      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      scene.bulletTimeKey = { isDown: true };
      call(scene, 'handleBulletTime');
      expect(s(scene, 'bulletTimeUses')).toBe(1);
    });

    it('plays power-up sound', () => {
      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      scene.bulletTimeKey = { isDown: true };
      call(scene, 'handleBulletTime');
      expect(scene.playSound).toHaveBeenCalledWith('specialAbility');
    });

    it('does not activate when already active', () => {
      scene.bulletTimeActive = true;
      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      scene.bulletTimeKey = { isDown: true };
      call(scene, 'handleBulletTime');
      expect(s(scene, 'bulletTimeUses')).toBe(0);
    });

    it('shows bullet time text', () => {
      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      scene.bulletTimeKey = { isDown: true };
      call(scene, 'handleBulletTime');
      expect(scene.bulletTimeText.setVisible).toHaveBeenCalledWith(true);
    });

    it('schedules deactivation', () => {
      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      scene.bulletTimeKey = { isDown: true };
      call(scene, 'handleBulletTime');
      expect(scene.time.delayedCall).toHaveBeenCalledWith(
        POWERUP_DEFS.bulletTime.duration,
        expect.any(Function)
      );
    });
  });

  describe('Lives', () => {
    it('loses a life when all balls fall', () => {
      scene.isBallAttached = false;
      scene.balls = [];
      call(scene, 'loseLife');
      expect(s(scene, 'lives')).toBe(C.LIVES - 1);
    });

    it('resets combo on life loss', () => {
      scene.combo = 10;
      call(scene, 'loseLife');
      expect(s(scene, 'combo')).toBe(0);
    });

    it('marks ball lost this level', () => {
      call(scene, 'loseLife');
      expect(s(scene, 'ballLostThisLevel')).toBe(true);
    });

    it('plays hit sound on life loss', () => {
      call(scene, 'loseLife');
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('shakes camera on life loss', () => {
      call(scene, 'loseLife');
      expect(scene.cameras.main.shake).toHaveBeenCalled();
    });

    it('triggers game over at 0 lives', () => {
      scene.lives = 1;
      call(scene, 'loseLife');
      expect(scene.gameOver).toHaveBeenCalled();
    });

    it('spawns new attached ball after life loss', () => {
      scene.lives = 3;
      call(scene, 'loseLife');
      expect(s(scene, 'isBallAttached')).toBe(true);
      expect(s(scene, 'balls')).toHaveLength(1);
    });
  });

  describe('Power-Up Activation', () => {
    it('multi-ball spawns 2 extra balls', () => {
      scene.balls = [{ sprite: createMockCircle(), vx: 100, vy: -200 }];
      call(scene, 'activateMultiBall');
      expect(scene.balls.length).toBe(3);
    });

    it('wide paddle increases width', () => {
      call(scene, 'activateWidePaddle');
      expect(s(scene, 'paddleWidth')).toBe(C.PADDLE_WIDE_WIDTH);
      expect(s(scene, 'widePaddleActive')).toBe(true);
    });

    it('wide paddle schedules revert', () => {
      call(scene, 'activateWidePaddle');
      expect(scene.time.delayedCall).toHaveBeenCalledWith(
        POWERUP_DEFS.widePaddle.duration,
        expect.any(Function)
      );
    });

    it('laser activates laser mode', () => {
      call(scene, 'activateLaser');
      expect(s(scene, 'laserActive')).toBe(true);
    });

    it('laser schedules deactivation', () => {
      call(scene, 'activateLaser');
      expect(scene.time.delayedCall).toHaveBeenCalledWith(
        POWERUP_DEFS.laser.duration,
        expect.any(Function)
      );
    });

    it('firewall sets active', () => {
      call(scene, 'activateFirewall');
      expect(s(scene, 'firewallActive')).toBe(true);
    });

    it('firewall creates sprite', () => {
      call(scene, 'activateFirewall');
      expect(s(scene, 'firewall')).not.toBeNull();
    });

    it('firewall does not stack', () => {
      call(scene, 'activateFirewall');
      scene.firewallActive = true;
      call(scene, 'activateFirewall');
      expect(scene.add.sprite).toHaveBeenCalledTimes(1);
    });

    it('EMP destroys bricks in radius', () => {
      scene.paddle.x = 200;
      scene.bricks = [
        {
          sprite: createMockRect(200, 150, C.BRICK_WIDTH, C.BRICK_HEIGHT),
          type: 'code', health: 1, maxHealth: 1, value: 10,
          row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
        },
        {
          sprite: createMockRect(700, 150, C.BRICK_WIDTH, C.BRICK_HEIGHT),
          type: 'code', health: 1, maxHealth: 1, value: 10,
          row: 0, col: 8, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
        },
      ];
      call(scene, 'activateEMP');
      expect(scene.bricks.length).toBeLessThan(2);
    });

    it('EMP flashes camera', () => {
      scene.bricks = [];
      call(scene, 'activateEMP');
      expect(scene.cameras.main.flash).toHaveBeenCalled();
    });

    it('plays power-up sound on activation', () => {
      call(scene, 'activatePowerUp', 'multiBall');
      expect(scene.playSound).toHaveBeenCalledWith('specialAbility');
    });
  });

  describe('Boss', () => {
    it('spawns boss on boss levels', () => {
      call(scene, 'spawnBoss');
      expect(s(scene, 'boss')).not.toBeNull();
    });

    it('boss has health based on level', () => {
      scene.level = 6;
      call(scene, 'spawnBoss');
      expect(s(scene, 'boss').health).toBe(C.BOSS_BASE_HEALTH + 5 * C.BOSS_HEALTH_PER_LEVEL);
    });

    it('boss moves horizontally', () => {
      call(scene, 'spawnBoss');
      const startX = scene.boss.sprite.x;
      call(scene, 'updateBoss', 0.5);
      expect(scene.boss.sprite.x).not.toBe(startX);
    });

    it('boss reverses at boundaries', () => {
      call(scene, 'spawnBoss');
      scene.boss.sprite.x = C.WIDTH;
      scene.boss.direction = 1;
      call(scene, 'updateBoss', 0.016);
      expect(scene.boss.direction).toBe(-1);
    });

    it('boss fires at paddle', () => {
      call(scene, 'spawnBoss');
      scene.boss.fireTimer = C.BOSS_FIRE_INTERVAL;
      call(scene, 'updateBoss', 0.016);
      expect(s(scene, 'bossBullets').length).toBeGreaterThan(0);
    });

    it('hitting boss reduces health', () => {
      call(scene, 'spawnBoss');
      const initialHealth = scene.boss.health;
      call(scene, 'hitBoss', 1);
      expect(scene.boss.health).toBe(initialHealth - 1);
    });

    it('defeating boss awards score', () => {
      call(scene, 'spawnBoss');
      scene.boss.health = 1;
      call(scene, 'hitBoss', 1);
      expect(s(scene, 'score')).toBe(C.BOSS_VALUE);
    });

    it('defeating boss unlocks achievement', () => {
      call(scene, 'spawnBoss');
      scene.boss.health = 1;
      call(scene, 'hitBoss', 1);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.BOSS_DEFEAT);
    });

    it('defeating boss plays level up sound', () => {
      call(scene, 'spawnBoss');
      scene.boss.health = 1;
      call(scene, 'hitBoss', 1);
      expect(scene.playSound).toHaveBeenCalledWith('levelUp');
    });

    it('defeating boss clears boss bullets', () => {
      call(scene, 'spawnBoss');
      scene.bossBullets = [{ sprite: createMockRect(), vx: 0, vy: 100 }];
      scene.boss.health = 1;
      call(scene, 'hitBoss', 1);
      expect(s(scene, 'bossBullets')).toHaveLength(0);
    });
  });

  describe('Agent Smith', () => {
    it('spawns agent', () => {
      call(scene, 'spawnAgent', 200, 100);
      expect(s(scene, 'agents')).toHaveLength(1);
    });

    it('agent moves downward', () => {
      call(scene, 'spawnAgent', 200, 100);
      const startY = scene.agents[0].sprite.y;
      call(scene, 'updateAgents', 0.5);
      expect(scene.agents[0].sprite.y).toBeGreaterThan(startY);
    });

    it('removes agent when off screen', () => {
      call(scene, 'spawnAgent', 200, C.HEIGHT + 30);
      call(scene, 'updateAgents', 0.016);
      expect(s(scene, 'agents')).toHaveLength(0);
    });

    it('agent-paddle collision causes life loss', () => {
      const agent = {
        sprite: createMockSprite(scene.paddle.x, scene.paddle.y),
        vy: C.AGENT_SPEED,
        width: C.AGENT_WIDTH,
        height: C.AGENT_HEIGHT,
      };
      scene.agents = [agent];
      call(scene, 'checkAgentPaddleCollisions');
      expect(s(scene, 'lives')).toBeLessThan(C.LIVES);
    });
  });

  describe('Laser', () => {
    it('fires laser when active', () => {
      scene.laserActive = true;
      call(scene, 'fireLaser');
      expect(s(scene, 'lasers')).toHaveLength(1);
    });

    it('laser moves upward', () => {
      scene.laserActive = true;
      call(scene, 'fireLaser');
      const startY = scene.lasers[0].sprite.y;
      call(scene, 'updateLasers', 0.5);
      expect(scene.lasers[0].sprite.y).toBeLessThan(startY);
    });

    it('removes laser when off screen', () => {
      scene.lasers = [{ sprite: createMockRect(200, -20), vy: -C.LASER_SPEED }];
      call(scene, 'updateLasers', 0.016);
      expect(s(scene, 'lasers')).toHaveLength(0);
    });

    it('laser destroys brick', () => {
      scene.lasers = [{ sprite: createMockRect(200, 100, C.LASER_WIDTH, C.LASER_HEIGHT), vy: -C.LASER_SPEED }];
      scene.bricks = [{
        sprite: createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT),
        type: 'code', health: 1, maxHealth: 1, value: 10,
        row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
      }];
      call(scene, 'checkLaserBrickCollisions');
      expect(scene.bricks).toHaveLength(0);
      expect(scene.lasers).toHaveLength(0);
    });

    it('plays shoot sound on fire', () => {
      call(scene, 'fireLaser');
      expect(scene.playSound).toHaveBeenCalledWith('shoot');
    });
  });

  describe('Firewall', () => {
    it('catches ball at bottom', () => {
      scene.firewallActive = true;
      scene.firewall = createMockSprite(C.WIDTH / 2, C.FIREWALL_Y);
      scene.isBallAttached = false;
      scene.balls = [{
        sprite: createMockCircle(200, C.FIREWALL_Y),
        vx: 100, vy: 300,
      }];
      call(scene, 'checkBallBottomCollisions');
      expect(scene.balls).toHaveLength(1);
      expect(scene.balls[0].vy).toBeLessThan(0);
      expect(s(scene, 'firewallActive')).toBe(false);
    });
  });

  describe('Level Completion', () => {
    it('spawns portal when all breakable bricks cleared', () => {
      scene.bricks = [{
        sprite: createMockRect(), type: 'unbreakable', health: 999,
        maxHealth: 999, value: 0, row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
      }];
      call(scene, 'checkLevelComplete');
      expect(s(scene, 'portal')).not.toBeNull();
    });

    it('does not spawn portal while boss alive', () => {
      scene.bricks = [];
      scene.boss = { sprite: createMockRect(), health: 10 };
      call(scene, 'checkLevelComplete');
      expect(s(scene, 'portal')).toBeNull();
    });

    it('completes level on portal collision', () => {
      scene.portal = createMockSprite(200, 150);
      scene.portal.x = 200;
      scene.isBallAttached = false;
      scene.balls = [{ sprite: createMockCircle(200, 150), vx: 0, vy: -100 }];
      call(scene, 'checkPortalCollision');
      expect(s(scene, 'isLevelComplete')).toBe(true);
    });

    it('unlocks NO_MISS when no balls lost', () => {
      scene.ballLostThisLevel = false;
      scene.portal = createMockSprite(200, 150);
      scene.portal.x = 200;
      scene.isBallAttached = false;
      scene.balls = [{ sprite: createMockCircle(200, 150), vx: 0, vy: -100 }];
      call(scene, 'checkPortalCollision');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.NO_MISS);
    });

    it('does not unlock NO_MISS when ball was lost', () => {
      scene.ballLostThisLevel = true;
      scene.portal = createMockSprite(200, 150);
      scene.portal.x = 200;
      scene.isBallAttached = false;
      scene.balls = [{ sprite: createMockCircle(200, 150), vx: 0, vy: -100 }];
      call(scene, 'checkPortalCollision');
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.NO_MISS);
    });

    it('game over on final level completion', () => {
      scene.level = C.TOTAL_LEVELS;
      scene.ballLostThisLevel = false;
      call(scene, 'completeLevel');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.LEVEL_10);
    });

    it('unlocks LEVEL_5 at level 5', () => {
      scene.level = 5;
      call(scene, 'completeLevel');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.LEVEL_5);
    });
  });

  describe('Achievements', () => {
    it('unlocks FIRST_BREAK on first brick', () => {
      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite, type: 'code', health: 1, maxHealth: 1,
        value: 10, row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
      }];
      call(scene, 'destroyBrick', 0);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_BREAK);
    });

    it('unlocks COMBO_15 at 15 combo', () => {
      scene.combo = 14;
      const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
      scene.bricks = [{
        sprite: brickSprite, type: 'code', health: 1, maxHealth: 1,
        value: 10, row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
      }];
      call(scene, 'destroyBrick', 0);
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_15);
    });

    it('unlocks HIGH_SCORE at 10000 points', () => {
      scene.score = 10000;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.HIGH_SCORE);
    });

    it('unlocks BULLET_TIME after 5 uses', () => {
      scene.bulletTimeUses = 5;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.BULLET_TIME);
    });

    it('unlocks MULTI_BALL with 3+ balls', () => {
      scene.balls = [
        { sprite: createMockCircle(), vx: 0, vy: 0 },
        { sprite: createMockCircle(), vx: 0, vy: 0 },
        { sprite: createMockCircle(), vx: 0, vy: 0 },
      ];
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.MULTI_BALL);
    });

    it('does not double-unlock achievements', () => {
      scene.score = 10000;
      call(scene, 'checkAchievements');
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledTimes(1);
    });

    it('unlocks SMITH_SLAYER after 10 kills', () => {
      scene.agentsKilled = 10;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SMITH_SLAYER);
    });
  });

  describe('Game Over', () => {
    it('triggers game over when lives reach 0', () => {
      scene.lives = 1;
      call(scene, 'loseLife');
      expect(scene.gameOver).toHaveBeenCalled();
    });

    it('sets isGameOver flag', () => {
      call(scene, 'handleGameOver');
      expect(s(scene, 'isGameOver')).toBe(true);
    });

    it('does not trigger twice', () => {
      call(scene, 'handleGameOver');
      call(scene, 'handleGameOver');
      expect(scene.gameOver).toHaveBeenCalledTimes(1);
    });

    it('includes level in reason', () => {
      scene.level = 5;
      call(scene, 'handleGameOver');
      expect(scene.gameOver).toHaveBeenCalledWith(
        expect.any(Number),
        expect.stringContaining('5'),
        expect.any(Number),
        expect.any(Array),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Particle Effects', () => {
    it('spawns particles on explosion', () => {
      call(scene, 'spawnExplosion', 200, 100, 0x00ff00, 8);
      expect(s(scene, 'particles')).toHaveLength(8);
    });

    it('particles decay over time', () => {
      call(scene, 'spawnExplosion', 200, 100, 0x00ff00, 4);
      const initialLife = scene.particles[0].life;
      call(scene, 'updateParticles', 0.5);
      expect(scene.particles[0].life).toBeLessThan(initialLife);
    });

    it('removes dead particles', () => {
      call(scene, 'spawnExplosion', 200, 100, 0x00ff00, 4);
      call(scene, 'updateParticles', 2);
      expect(s(scene, 'particles')).toHaveLength(0);
    });
  });

  describe('Power-Up Spawning', () => {
    it('spawns power-up at position', () => {
      call(scene, 'spawnPowerUp', 200, 100);
      expect(s(scene, 'fieldPowerUps')).toHaveLength(1);
    });

    it('power-up falls downward', () => {
      call(scene, 'spawnPowerUp', 200, 100);
      const startY = scene.fieldPowerUps[0].sprite.y;
      call(scene, 'updateFieldPowerUps', 0.5);
      expect(scene.fieldPowerUps[0].sprite.y).toBeGreaterThan(startY);
    });

    it('removes power-up when off screen', () => {
      call(scene, 'spawnPowerUp', 200, C.HEIGHT + 20);
      call(scene, 'updateFieldPowerUps', 0.016);
      expect(s(scene, 'fieldPowerUps')).toHaveLength(0);
    });
  });

  describe('Boss Bullet Collision', () => {
    it('boss bullet hitting paddle causes life loss', () => {
      scene.bossBullets = [{
        sprite: createMockRect(scene.paddle.x, scene.paddle.y, 6, 6),
        vx: 0, vy: 100,
      }];
      call(scene, 'checkBossBulletPaddleCollisions');
      expect(s(scene, 'lives')).toBeLessThan(C.LIVES);
    });

    it('removes bullet on hit', () => {
      scene.bossBullets = [{
        sprite: createMockRect(scene.paddle.x, scene.paddle.y, 6, 6),
        vx: 0, vy: 100,
      }];
      call(scene, 'checkBossBulletPaddleCollisions');
      expect(s(scene, 'bossBullets')).toHaveLength(0);
    });
  });

  describe('Level Loading', () => {
    it('loads bricks from level layout', () => {
      call(scene, 'loadLevel', 1);
      expect(s(scene, 'bricks').length).toBeGreaterThan(0);
    });

    it('clears previous level state', () => {
      scene.bricks = [{ sprite: createMockRect() }];
      scene.agents = [{ sprite: createMockSprite() }];
      call(scene, 'loadLevel', 1);
      expect(s(scene, 'agents')).toHaveLength(0);
    });

    it('spawns boss on boss levels', () => {
      // R87.K5 — boss cadence shifted from [3, 6, 9] to [5, 8, 11] following
      // the insertion of two warm-up layouts at the front of LEVELS.
      call(scene, 'loadLevel', 5);
      expect(s(scene, 'boss')).not.toBeNull();
    });

    it('does not spawn boss on non-boss levels', () => {
      call(scene, 'loadLevel', 1);
      expect(s(scene, 'boss')).toBeNull();
    });
  });

  describe('Ball Spawn', () => {
    it('spawns attached ball at paddle position', () => {
      call(scene, 'spawnBall', true);
      expect(s(scene, 'balls')).toHaveLength(1);
      expect(scene.balls[0].sprite.x).toBe(scene.paddle.x);
    });

    it('spawns free ball with velocity', () => {
      call(scene, 'spawnBall', false);
      expect(s(scene, 'balls')).toHaveLength(1);
    });
  });

  describe('HUD Updates', () => {
    it('updates score text', () => {
      scene.score = 500;
      call(scene, 'updateHUD');
      expect(scene.scoreText.setText).toHaveBeenCalledWith('SCORE: 500');
    });

    it('updates level text', () => {
      scene.level = 3;
      call(scene, 'updateHUD');
      expect(scene.levelText.setText).toHaveBeenCalledWith('LEVEL: 3');
    });

    it('updates lives text', () => {
      scene.lives = 2;
      call(scene, 'updateHUD');
      expect(scene.livesText.setText).toHaveBeenCalledWith('LIVES: 2');
    });

    it('shows combo when active', () => {
      scene.combo = 5;
      call(scene, 'updateHUD');
      expect(scene.comboText.setText).toHaveBeenCalledWith('COMBO: 5x');
    });

    it('hides combo when zero', () => {
      scene.combo = 0;
      call(scene, 'updateHUD');
      expect(scene.comboText.setText).toHaveBeenCalledWith('');
    });
  });

  describe('Test State Exposure', () => {
    it('returns complete state object', () => {
      const state = call(scene, 'getTestState');
      expect(state).toHaveProperty('score');
      expect(state).toHaveProperty('lives');
      expect(state).toHaveProperty('level');
      expect(state).toHaveProperty('combo');
      expect(state).toHaveProperty('isGameOver');
      expect(state).toHaveProperty('isBallAttached');
      expect(state).toHaveProperty('ballCount');
      expect(state).toHaveProperty('brickCount');
      expect(state).toHaveProperty('bossHealth');
      expect(state).toHaveProperty('hasPortal');
    });

    it('reflects current game state', () => {
      scene.score = 1234;
      scene.level = 7;
      scene.lives = 2;
      const state = call(scene, 'getTestState');
      expect(state.score).toBe(1234);
      expect(state.level).toBe(7);
      expect(state.lives).toBe(2);
    });
  });

  describe('Cleanup', () => {
    it('destroys all balls on shutdown', () => {
      const ball1 = { sprite: createMockCircle(), vx: 0, vy: 0 };
      const ball2 = { sprite: createMockCircle(), vx: 0, vy: 0 };
      scene.balls = [ball1, ball2];
      call(scene, 'shutdown');
      expect(ball1.sprite.destroy).toHaveBeenCalled();
      expect(ball2.sprite.destroy).toHaveBeenCalled();
      expect(s(scene, 'balls')).toHaveLength(0);
    });

    it('destroys all bricks on shutdown', () => {
      const brick = { sprite: createMockRect() };
      scene.bricks = [brick];
      call(scene, 'shutdown');
      expect(brick.sprite.destroy).toHaveBeenCalled();
    });

    it('destroys boss on shutdown', () => {
      call(scene, 'spawnBoss');
      const boss = scene.boss;
      call(scene, 'shutdown');
      expect(boss.sprite.destroy).toHaveBeenCalled();
      expect(s(scene, 'boss')).toBeNull();
    });

    it('removes keyboard on shutdown', () => {
      call(scene, 'shutdown');
      expect(scene.input.keyboard.removeAllKeys).toHaveBeenCalled();
    });

    it('destroys agents on shutdown', () => {
      const agent = { sprite: createMockSprite() };
      scene.agents = [agent];
      call(scene, 'shutdown');
      expect(agent.sprite.destroy).toHaveBeenCalled();
    });

    it('destroys particles on shutdown', () => {
      call(scene, 'spawnExplosion', 100, 100, 0x00ff00, 4);
      call(scene, 'shutdown');
      expect(s(scene, 'particles')).toHaveLength(0);
    });

    it('destroys firewall on shutdown', () => {
      scene.firewall = createMockSprite();
      call(scene, 'shutdown');
      expect(s(scene, 'firewall')).toBeNull();
    });

    it('destroys portal on shutdown', () => {
      scene.portal = createMockSprite();
      call(scene, 'shutdown');
      expect(s(scene, 'portal')).toBeNull();
    });
  });

  // R87.K1 + K2 + K3 — CodeBreaker P0 blockers.
  //   K1: miss-last-ball + grab power-up leaves scene ball-less (soft-lock).
  //   K2: multiple collision paths in one frame can double-debit lives →
  //       spontaneous game-over mid-level after a power-up pickup.
  //   K3: keyboard paddle input silently overridden by pointer-tracking
  //       every frame because `pointer.x !== paddle.x` is almost always true.
  describe('R87.K1+K2+K3 — power-up soft-lock + multi-life guard + keyboard controls', () => {
    describe('K3 — keyboard paddle input', () => {
      it('arrow keys move paddle even when pointer sits at a different x', () => {
        // Simulate Tom's actual scenario: mouse is over the canvas somewhere
        // (NOT on paddle.x) but not pressed; keyboard should still win.
        scene.input.activePointer = { isDown: false, x: 50 };
        scene.paddle.x = 400;
        scene.lastPointerX = 50; // pointer has not moved this frame
        scene.cursors.left.isDown = true;

        call(scene, 'handlePaddleMovement', 1 / 60);
        expect(scene.paddle.x).toBeLessThan(400);
      });

      it('WASD D key moves paddle right even when pointer sits elsewhere', () => {
        scene.input.activePointer = { isDown: false, x: 700 };
        scene.paddle.x = 200;
        scene.lastPointerX = 700;
        scene.wasdD.isDown = true;

        call(scene, 'handlePaddleMovement', 1 / 60);
        expect(scene.paddle.x).toBeGreaterThan(200);
      });

      it('numpad 4 moves paddle left', () => {
        scene.input.activePointer = { isDown: false, x: 100 };
        scene.paddle.x = 400;
        scene.lastPointerX = 100;
        scene.numpadLeft.isDown = true;

        call(scene, 'handlePaddleMovement', 1 / 60);
        expect(scene.paddle.x).toBeLessThan(400);
      });

      it('numpad 6 moves paddle right', () => {
        scene.input.activePointer = { isDown: false, x: 100 };
        scene.paddle.x = 200;
        scene.lastPointerX = 100;
        scene.numpadRight.isDown = true;

        call(scene, 'handlePaddleMovement', 1 / 60);
        expect(scene.paddle.x).toBeGreaterThan(200);
      });

      it('idle pointer at arbitrary x does NOT override keyboard', () => {
        // Regression guard for the actual Tom bug: the previous condition
        // `pointer.x !== paddle.x` fired every frame because the cursor
        // rarely sits exactly on paddle.x, so keyboard input was silently
        // cancelled by pointer-tracking.
        scene.input.activePointer = { isDown: false, x: 123 };
        scene.paddle.x = 400;
        scene.lastPointerX = 123; // pointer hasn't moved
        scene.cursors.right.isDown = true;
        const startX = scene.paddle.x;

        call(scene, 'handlePaddleMovement', 1 / 60);
        expect(scene.paddle.x).toBeGreaterThan(startX);
      });

      it('idle pointer with no keyboard input leaves paddle still', () => {
        scene.input.activePointer = { isDown: false, x: 50 };
        scene.paddle.x = 400;
        scene.lastPointerX = 50; // pointer has not moved

        call(scene, 'handlePaddleMovement', 1 / 60);
        expect(scene.paddle.x).toBe(400);
      });

      it('moving pointer (without keyboard) pulls paddle toward it', () => {
        scene.input.activePointer = { isDown: false, x: 200 };
        scene.paddle.x = 400;
        scene.lastPointerX = 100; // pointer moved 100 → 200 since last frame

        call(scene, 'handlePaddleMovement', 1 / 60);
        expect(scene.paddle.x).toBeLessThan(400);
      });

      it('pointer pressed (click/drag) drives paddle even if stationary', () => {
        scene.input.activePointer = { isDown: true, x: 200 };
        scene.paddle.x = 400;
        scene.lastPointerX = 200; // not moved, but pressed

        call(scene, 'handlePaddleMovement', 1 / 60);
        expect(scene.paddle.x).toBeLessThan(400);
      });

      it('pointer outside canvas does not drag paddle off-screen', () => {
        scene.input.activePointer = { isDown: false, x: -50 };
        scene.paddle.x = 400;
        scene.lastPointerX = 100; // moved

        call(scene, 'handlePaddleMovement', 1 / 60);
        expect(scene.paddle.x).toBe(400);
      });

      it('first-frame (lastPointerX === -1) treats pointer as idle', () => {
        // Sentinel value prevents a spurious "moved from -1 to current" on
        // the very first update after reset, which would otherwise yank the
        // paddle to the pointer position before the player has touched
        // either keyboard or mouse.
        scene.input.activePointer = { isDown: false, x: 50 };
        scene.paddle.x = 400;
        scene.lastPointerX = -1;

        call(scene, 'handlePaddleMovement', 1 / 60);
        expect(scene.paddle.x).toBe(400);
      });
    });

    describe('K2 — loseLife guard (no double-debit per frame)', () => {
      it('fires only once per frame even when called twice in sequence', () => {
        scene.lives = 3;
        call(scene, 'loseLife');
        call(scene, 'loseLife'); // agent-paddle collision same frame
        expect(s(scene, 'lives')).toBe(2);
      });

      it('three collision paths in one frame debit exactly one life', () => {
        scene.lives = 3;
        // Simulate: ball drops → checkBallBottomCollisions → loseLife
        //           agent hits paddle same frame → loseLife
        //           boss bullet hits paddle same frame → loseLife
        call(scene, 'loseLife');
        call(scene, 'loseLife');
        call(scene, 'loseLife');
        expect(s(scene, 'lives')).toBe(2);
      });

      it('does not fire when isGameOver is true', () => {
        scene.lives = 3;
        scene.isGameOver = true;
        call(scene, 'loseLife');
        expect(s(scene, 'lives')).toBe(3);
      });

      it('does not fire when isLevelComplete is true', () => {
        scene.lives = 3;
        scene.isLevelComplete = true;
        call(scene, 'loseLife');
        expect(s(scene, 'lives')).toBe(3);
      });

      it('resets livesLostThisFrame at top of each update tick', () => {
        scene.lives = 3;
        call(scene, 'loseLife');
        expect(s(scene, 'lives')).toBe(2);
        expect(s(scene, 'livesLostThisFrame')).toBe(true);

        // Simulate the next frame — update() resets the flag.
        scene.livesLostThisFrame = false;
        call(scene, 'loseLife');
        expect(s(scene, 'lives')).toBe(1);
      });

      it('prevents game-over from 2 lives in one chaotic frame', () => {
        // Tom's K2 repro: 2 lives, ball drops AND agent hits paddle AND
        // power-up bomb fires in one frame. Without the guard, 2→1→0 game
        // over. With the guard, 2→1 and player keeps playing.
        scene.lives = 2;
        call(scene, 'loseLife');
        call(scene, 'loseLife');
        expect(s(scene, 'lives')).toBe(1);
        expect(s(scene, 'isGameOver')).toBe(false);
        expect(scene.gameOver).not.toHaveBeenCalled();
      });
    });

    describe('K2 — activatePowerUp guard', () => {
      it('does not fire when isGameOver is true', () => {
        scene.isGameOver = true;
        call(scene, 'activatePowerUp', 'multiBall');
        expect(scene.playSound).not.toHaveBeenCalledWith('specialAbility');
      });

      it('does not fire when isLevelComplete is true', () => {
        scene.isLevelComplete = true;
        call(scene, 'activatePowerUp', 'laser');
        expect(s(scene, 'laserActive')).toBe(false);
      });

      it('multiBall does not spawn balls during level transition', () => {
        scene.isLevelComplete = true;
        scene.balls = [{ sprite: createMockCircle(), vx: 0, vy: 0 }];
        call(scene, 'activatePowerUp', 'multiBall');
        expect(s(scene, 'balls')).toHaveLength(1);
      });

      it('EMP does not destroy bricks after game-over', () => {
        scene.isGameOver = true;
        scene.bricks = [
          {
            sprite: createMockRect(200, 150, C.BRICK_WIDTH, C.BRICK_HEIGHT),
            type: 'code', health: 1, maxHealth: 1, value: 10,
            row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
          },
        ];
        scene.paddle.x = 200;
        call(scene, 'activatePowerUp', 'emp');
        expect(s(scene, 'bricks')).toHaveLength(1);
      });
    });

    describe('K1 — reconcileBallState (ball-state invariant)', () => {
      it('no-ops when isGameOver is true', () => {
        scene.isGameOver = true;
        scene.balls = [];
        scene.isBallAttached = false;
        call(scene, 'reconcileBallState');
        expect(s(scene, 'balls')).toHaveLength(0);
        expect(scene.playSound).not.toHaveBeenCalled();
      });

      it('no-ops when isLevelComplete is true', () => {
        scene.isLevelComplete = true;
        scene.balls = [];
        scene.isBallAttached = false;
        call(scene, 'reconcileBallState');
        expect(s(scene, 'balls')).toHaveLength(0);
      });

      it('no-ops when at least one ball exists', () => {
        const ball = { sprite: createMockCircle(), vx: 0, vy: 0 };
        scene.balls = [ball];
        scene.isBallAttached = false;
        call(scene, 'reconcileBallState');
        expect(s(scene, 'balls')).toHaveLength(1);
      });

      it('respawns attached ball when isBallAttached=true but balls empty', () => {
        // Defensive invariant — if any code path destroys the attached ball
        // without spawning a replacement, recover rather than soft-lock.
        scene.balls = [];
        scene.isBallAttached = true;
        scene.lives = 2;
        scene.isGameOver = false;
        scene.isLevelComplete = false;
        call(scene, 'reconcileBallState');
        expect(s(scene, 'balls').length).toBeGreaterThanOrEqual(1);
      });

      it('calls loseLife when balls empty AND not attached (Tom K1 scenario)', () => {
        // Tom's K1 repro: last ball fell, power-up was grabbed, no
        // respawn happened. The reconciler treats it as a belated life-loss
        // rather than leaving the scene ball-less forever.
        scene.balls = [];
        scene.isBallAttached = false;
        scene.lives = 3;
        scene.isGameOver = false;
        scene.isLevelComplete = false;
        scene.livesLostThisFrame = false;
        call(scene, 'reconcileBallState');
        expect(s(scene, 'lives')).toBeLessThan(3);
        expect(s(scene, 'balls').length).toBeGreaterThanOrEqual(1);
        expect(s(scene, 'isBallAttached')).toBe(true);
      });

      it('respects livesLostThisFrame guard when reconciling', () => {
        // Reconciler calls loseLife, but if a prior collision already
        // fired it this frame the life count does not double-debit.
        scene.balls = [];
        scene.isBallAttached = false;
        scene.lives = 3;
        scene.livesLostThisFrame = true;
        call(scene, 'reconcileBallState');
        expect(s(scene, 'lives')).toBe(3);
      });
    });
  });

  // R87.K4 — ball-speed rebound cap. Tom's 2026-04-22 playtest:
  // "Ball speed is very, very quick when it rebounds... Especially if we're
  // going to have a lot of packed grids". Three-layer dampening: lowered
  // BALL_MAX_SPEED ceiling (paddle progression still applies, just capped
  // lower), gentler BALL_SPEED_INCREMENT (slower ramp), and new
  // BALL_BRICK_REBOUND_DAMPEN + BALL_STEEP_ANGLE_DAMPEN applied in
  // applyBrickReboundDampen() after every brick or boss collision.
  describe('R87.K4 — ball-speed rebound cap', () => {
    describe('Config dials (exact values)', () => {
      it('BALL_MAX_SPEED locked at 460', () => {
        expect(C.BALL_MAX_SPEED).toBe(460);
      });

      it('BALL_SPEED_INCREMENT locked at 6', () => {
        expect(C.BALL_SPEED_INCREMENT).toBe(6);
      });

      it('BALL_BRICK_REBOUND_DAMPEN locked at 0.985', () => {
        expect(C.BALL_BRICK_REBOUND_DAMPEN).toBe(0.985);
      });

      it('BALL_STEEP_ANGLE_THRESHOLD locked at 0.92', () => {
        expect(C.BALL_STEEP_ANGLE_THRESHOLD).toBe(0.92);
      });

      it('BALL_STEEP_ANGLE_DAMPEN locked at 0.93', () => {
        expect(C.BALL_STEEP_ANGLE_DAMPEN).toBe(0.93);
      });
    });

    describe('Anti-regression ratchets', () => {
      // Future tuning can tighten further but cannot re-loosen without an
      // explicit test delete — ensures Tom's "too quick on rebound"
      // complaint can't silently return via a config-refactor.
      it('BALL_MAX_SPEED stays below 500', () => {
        expect(C.BALL_MAX_SPEED).toBeLessThan(500);
      });

      it('BALL_MAX_SPEED still exceeds BALL_SPEED (paddle-ramp progression preserved)', () => {
        // If someone lowers the ceiling below start speed the paddle
        // progression beat silently dies — this guards the "ball gets
        // faster as you play" contract that Breakout-family games need.
        expect(C.BALL_MAX_SPEED).toBeGreaterThan(C.BALL_SPEED);
      });

      it('BALL_BRICK_REBOUND_DAMPEN never exceeds 1 (cannot add speed)', () => {
        expect(C.BALL_BRICK_REBOUND_DAMPEN).toBeLessThanOrEqual(1);
        expect(C.BALL_BRICK_REBOUND_DAMPEN).toBeGreaterThan(0);
      });

      it('BALL_STEEP_ANGLE_DAMPEN never exceeds 1 (cannot add speed)', () => {
        expect(C.BALL_STEEP_ANGLE_DAMPEN).toBeLessThanOrEqual(1);
        expect(C.BALL_STEEP_ANGLE_DAMPEN).toBeGreaterThan(0);
      });

      it('BALL_STEEP_ANGLE_THRESHOLD in valid |vy|/speed range (0-1]', () => {
        expect(C.BALL_STEEP_ANGLE_THRESHOLD).toBeGreaterThan(0);
        expect(C.BALL_STEEP_ANGLE_THRESHOLD).toBeLessThanOrEqual(1);
      });

      it('BALL_SPEED_INCREMENT stays below legacy +10 (gentler ramp locked)', () => {
        // Ratchet — can tighten to 5/4 in a later pass, but must never
        // climb back toward the pre-R87 +10 that Tom flagged as too sharp.
        expect(C.BALL_SPEED_INCREMENT).toBeLessThan(10);
        expect(C.BALL_SPEED_INCREMENT).toBeGreaterThan(0);
      });
    });

    describe('applyBrickReboundDampen — speed scaling', () => {
      it('shallow-angle rebound loses exactly BALL_BRICK_REBOUND_DAMPEN factor', () => {
        // 45° trajectory: equal horizontal + vertical components, well
        // below the steep-angle threshold. Only the flat dampen applies.
        const ball = { sprite: createMockCircle(), vx: 300, vy: -300 };
        const preSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        call(scene, 'applyBrickReboundDampen', ball);
        const postSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        expect(postSpeed).toBeCloseTo(preSpeed * C.BALL_BRICK_REBOUND_DAMPEN, 2);
      });

      it('steep-angle rebound loses BRICK_DAMPEN × STEEP_DAMPEN combined', () => {
        // Near-vertical: |vy|/speed ~= 0.98 (above 0.92 threshold).
        const ball = { sprite: createMockCircle(), vx: 50, vy: -300 };
        const preSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        call(scene, 'applyBrickReboundDampen', ball);
        const postSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        const expected = preSpeed * C.BALL_BRICK_REBOUND_DAMPEN * C.BALL_STEEP_ANGLE_DAMPEN;
        expect(postSpeed).toBeCloseTo(expected, 2);
      });

      it('shallow-angle rebound skips the steep-angle dampen', () => {
        // |vy|/speed = 0 — pure horizontal, as shallow as it gets.
        const shallow = { sprite: createMockCircle(), vx: 300, vy: 0 };
        const preShallow = Math.sqrt(shallow.vx ** 2 + shallow.vy ** 2);
        call(scene, 'applyBrickReboundDampen', shallow);
        const postShallow = Math.sqrt(shallow.vx ** 2 + shallow.vy ** 2);
        // Must equal preSpeed × BRICK_DAMPEN exactly (no steep multiplier).
        expect(postShallow).toBeCloseTo(preShallow * C.BALL_BRICK_REBOUND_DAMPEN, 2);
        expect(postShallow).toBeGreaterThan(preShallow * C.BALL_BRICK_REBOUND_DAMPEN * C.BALL_STEEP_ANGLE_DAMPEN + 0.01);
      });

      it('rebound never increases ball speed (monotonic non-increase)', () => {
        // Sweep a range of vx/vy combinations — every single one must
        // end up at or below its starting speed. This is the core
        // "brick rebound cannot add speed" contract.
        const cases = [
          { vx: 100, vy: -100 },
          { vx: 300, vy: -200 },
          { vx: 50, vy: -400 },
          { vx: -250, vy: 150 },
          { vx: 400, vy: -300 },
        ];
        for (const c of cases) {
          const ball = { sprite: createMockCircle(), vx: c.vx, vy: c.vy };
          const pre = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
          call(scene, 'applyBrickReboundDampen', ball);
          const post = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
          expect(post).toBeLessThanOrEqual(pre + 0.001);
        }
      });

      it('clamps post-rebound speed to BALL_MAX_SPEED (defensive)', () => {
        // Belt-and-braces guard: even if some upstream path ever
        // injects a ball moving faster than the ceiling (e.g. future
        // power-up that boosts speed), a brick hit must never carry
        // that over-ceiling speed forward.
        const overSpeed = C.BALL_MAX_SPEED * 2; // 920
        const ball = { sprite: createMockCircle(), vx: overSpeed, vy: 0 };
        call(scene, 'applyBrickReboundDampen', ball);
        const postSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        expect(postSpeed).toBeLessThanOrEqual(C.BALL_MAX_SPEED + 0.001);
      });

      it('preserves velocity direction (sign unchanged)', () => {
        // Dampen scales magnitude but must not flip any component.
        const ball = { sprite: createMockCircle(), vx: 200, vy: -250 };
        call(scene, 'applyBrickReboundDampen', ball);
        expect(ball.vx).toBeGreaterThan(0);
        expect(ball.vy).toBeLessThan(0);
      });

      it('no-op on a zero-velocity ball (divide-by-zero guard)', () => {
        // Edge case — steep-angle check divides by speed, must not NaN.
        const ball = { sprite: createMockCircle(), vx: 0, vy: 0 };
        call(scene, 'applyBrickReboundDampen', ball);
        expect(ball.vx).toBe(0);
        expect(ball.vy).toBe(0);
      });
    });

    describe('Integration — checkBallBrickCollisions applies dampen', () => {
      it('dampen fires on brick collision (post-reflect speed dropped)', () => {
        scene.isBallAttached = false;
        // Ball sits just above the brick top edge so dy<0 and the reflection
        // flips vy negative. Identical positions fall into the dy=0 fallback
        // sign branch which leaves vy sign unchanged.
        const ball = { sprite: createMockCircle(200, 95), vx: 0, vy: 300 };
        scene.balls = [ball];
        const brickSprite = createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT);
        scene.bricks = [{
          sprite: brickSprite,
          type: 'code',
          health: 1,
          maxHealth: 1,
          value: 10,
          row: 0,
          col: 0,
          width: C.BRICK_WIDTH,
          height: C.BRICK_HEIGHT,
        }];

        call(scene, 'checkBallBrickCollisions');

        // vy reflected (now negative) AND dampened. |vy| < 300 because
        // of steep-angle dampen (pure vertical is steepest possible).
        expect(ball.vy).toBeLessThan(0);
        expect(Math.abs(ball.vy)).toBeLessThan(300);
        const expectedSpeed = 300 * C.BALL_BRICK_REBOUND_DAMPEN * C.BALL_STEEP_ANGLE_DAMPEN;
        expect(Math.abs(ball.vy)).toBeCloseTo(expectedSpeed, 1);
      });
    });

    describe('Paddle rebound still caps at lowered BALL_MAX_SPEED', () => {
      it('paddle bounce clamps incoming above-ceiling speed to new 460', () => {
        // Simulate a ball carrying near-ceiling speed hitting the paddle.
        // The +BALL_SPEED_INCREMENT push plus the clamp must land at
        // BALL_MAX_SPEED exactly, not the pre-R87 550 ceiling.
        scene.isBallAttached = false;
        scene.paddleWidth = C.PADDLE_WIDTH;
        const near = C.BALL_MAX_SPEED - 2; // 458
        const ball = {
          sprite: createMockCircle(scene.paddle.x, C.PADDLE_Y - 4),
          vx: 0,
          vy: near,
        };
        scene.balls = [ball];
        call(scene, 'checkBallPaddleCollisions');
        const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        expect(speed).toBeLessThanOrEqual(C.BALL_MAX_SPEED + 0.001);
        expect(speed).toBeCloseTo(C.BALL_MAX_SPEED, 0);
      });
    });
  });

  // R87.K5 — L1 difficulty retier (pre-R87 L1 → L3). Tom's 2026-04-22
  // playtest: "First level is a bit too difficult... Need to make the current
  // level one, level three." Two warm-up layouts were inserted at the front
  // of LEVELS so the curve now ramps 30 HP → 44 HP → 120 HP across L1/L2/L3.
  // This block locks the retier intent so a future level-data edit cannot
  // silently re-hostile the warm-up zone.
  describe('R87.K5 — L1 difficulty retier', () => {
    // Pre-R87 L1 layout — used to verify the retier preserves it as new L3.
    const PRE_R87_L1: number[][] = [
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // Helper: total HP of breakable bricks in a layout (ignores 0/empty and
    // 9/unbreakable — what the player actually has to smash through to clear).
    const breakableHP = (layout: number[][]): number =>
      layout.reduce((rowSum, row) => {
        return rowSum + row.reduce((colSum, code) => {
          const type = getBrickType(code);
          if (!type || type === 'unbreakable') return colSum;
          return colSum + BRICK_DEFS[type].health;
        }, 0);
      }, 0);

    describe('Level count + boss cadence', () => {
      it('LEVELS array has exactly 12 entries', () => {
        expect(LEVELS).toHaveLength(12);
      });

      it('TOTAL_LEVELS is 12', () => {
        expect(C.TOTAL_LEVELS).toBe(12);
      });

      it('BOSS_LEVELS is [5, 8, 11] — shifted +2 from pre-R87 [3, 6, 9]', () => {
        expect([...C.BOSS_LEVELS]).toEqual([5, 8, 11]);
      });

      it('boss cadence preserves 3-level spacing', () => {
        const gaps: number[] = [];
        for (let i = 1; i < C.BOSS_LEVELS.length; i++) {
          gaps.push(C.BOSS_LEVELS[i] - C.BOSS_LEVELS[i - 1]);
        }
        expect(gaps).toEqual([3, 3]);
      });

      it('first boss sits at L5 (post-warm-up) not L3', () => {
        // Critical anti-regression: if a future refactor merges the warm-up
        // levels back with the original L1, this keeps L3 boss-free.
        expect(C.BOSS_LEVELS[0]).toBeGreaterThan(3);
        expect((C.BOSS_LEVELS as readonly number[]).includes(3)).toBe(false);
      });

      it('final level is still a non-boss gauntlet', () => {
        // The Source (L12) is boss-adjacent difficulty but not in BOSS_LEVELS —
        // the Architect at L11 is the last boss. Preserves the pre-R87
        // design where the final level is a brick-dense finale.
        expect((C.BOSS_LEVELS as readonly number[]).includes(C.TOTAL_LEVELS)).toBe(false);
      });
    });

    describe('Warm-up character of L1 + L2', () => {
      it('L1 contains only code bricks (no agents / sentinels / unbreakables)', () => {
        const l1 = LEVELS[0];
        const allCodes = l1.flat();
        // Code=1 or empty=0 only; no 2/3/9.
        for (const code of allCodes) {
          expect([0, 1]).toContain(code);
        }
      });

      it('L1 total HP ≤ 40 (strict warm-up ceiling)', () => {
        // Below the threshold Tom flagged as "too many blocks that take too
        // many hits". 40 HP ≈ 40 seconds of play with a fresh paddle, which
        // is the warm-up budget we're targeting.
        expect(breakableHP(LEVELS[0])).toBeLessThanOrEqual(40);
      });

      it('L1 is clearable in a single pass (≥1 row but ≤4 rows)', () => {
        expect(LEVELS[0].length).toBeGreaterThanOrEqual(1);
        expect(LEVELS[0].length).toBeLessThanOrEqual(4);
      });

      it('L2 introduces a handful of multi-hit bricks (1 < agent count ≤ 8)', () => {
        const agentCount = LEVELS[1].flat().filter((c) => c === 2).length;
        expect(agentCount).toBeGreaterThan(1);
        expect(agentCount).toBeLessThanOrEqual(8);
      });

      it('L2 contains no sentinel (3-hit) bricks yet', () => {
        // Sentinels are reserved for L3+ — the "hump" difficulty Tom wants
        // players to hit after two levels of warm-up.
        const sentinelCount = LEVELS[1].flat().filter((c) => c === 3).length;
        expect(sentinelCount).toBe(0);
      });

      it('L2 total HP ≤ 60 (still warm-up, but harder than L1)', () => {
        expect(breakableHP(LEVELS[1])).toBeLessThanOrEqual(60);
      });
    });

    describe('Monotonic difficulty ramp L1 → L2 → L3', () => {
      it('L1 total HP < L2 total HP', () => {
        expect(breakableHP(LEVELS[0])).toBeLessThan(breakableHP(LEVELS[1]));
      });

      it('L2 total HP < L3 total HP (warm-up → hump)', () => {
        expect(breakableHP(LEVELS[1])).toBeLessThan(breakableHP(LEVELS[2]));
      });

      it('L3 is the pre-R87 L1 layout — the "hump" Tom requested', () => {
        // Direct layout equality lock: if someone edits the warm-ups back
        // into the pre-R87 L1 position, this catches it. Independent of
        // HP counting so a future sentinel-swap in pre-R87 L1 can't pass
        // silently.
        expect(LEVELS[2]).toEqual(PRE_R87_L1);
      });

      it('L3 HP ≥ 100 — the retier preserves the pre-R87 L1 weight', () => {
        expect(breakableHP(LEVELS[2])).toBeGreaterThanOrEqual(100);
      });
    });

    describe('Pre-R87 level data preserved at new indices', () => {
      // Each pre-R87 level should now sit at new index = oldIndex + 2.
      // Locks the "insert-at-front" intent against a future refactor that
      // might reorder in place.
      it('pre-R87 L2 layout preserved at new L4', () => {
        const preR87L2: number[][] = [
          [2, 1, 1, 2, 1, 1, 2, 1, 1, 2],
          [1, 2, 1, 1, 2, 2, 1, 1, 2, 1],
          [1, 1, 2, 1, 1, 1, 1, 2, 1, 1],
          [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ];
        expect(LEVELS[3]).toEqual(preR87L2);
      });

      it('pre-R87 boss L3 (V-pattern) now at new L5', () => {
        // Spot-check: new L5 is the old V-pattern AND is flagged as a boss
        // level — ties together layout preservation + boss-cadence shift.
        expect(LEVELS[4][0]).toEqual([3, 0, 0, 0, 0, 0, 0, 0, 0, 3]);
        expect((C.BOSS_LEVELS as readonly number[]).includes(5)).toBe(true);
      });

      it('pre-R87 final-gauntlet (The Source) preserved at new L12', () => {
        expect(LEVELS[11][0]).toEqual([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]);
      });
    });

    describe('loadLevel wiring with retiered indices', () => {
      // Uses the outer `scene` + its `beforeEach` (line 187) via closure.

      it('loadLevel(1) populates warm-up bricks only (all type=code)', () => {
        call(scene, 'loadLevel', 1);
        const bricks = s(scene, 'bricks') as Array<{ type: string }>;
        expect(bricks.length).toBeGreaterThan(0);
        for (const b of bricks) {
          expect(b.type).toBe('code');
        }
      });

      it('loadLevel(1) does not spawn a boss', () => {
        call(scene, 'loadLevel', 1);
        expect(s(scene, 'boss')).toBeNull();
      });

      it('loadLevel(5) spawns a boss (first boss level post-retier)', () => {
        call(scene, 'loadLevel', 5);
        expect(s(scene, 'boss')).not.toBeNull();
      });

      it('loadLevel(3) does NOT spawn a boss (was old boss level, now regular)', () => {
        call(scene, 'loadLevel', 3);
        expect(s(scene, 'boss')).toBeNull();
      });

      it('loadLevel clamps out-of-range levels to the last layout', () => {
        // `loadLevel(13)` should still produce bricks (clamped to LEVELS[11]).
        // Guards against a future off-by-one in the clamp logic.
        call(scene, 'loadLevel', 13);
        const bricks = s(scene, 'bricks') as unknown[];
        expect(bricks.length).toBeGreaterThan(0);
      });
    });
  });

  // R87.K6 — manual bullet-time on B. Charge meter fills as bricks are
  // destroyed (+BULLET_TIME_METER_PER_BRICK each) and on boss hits
  // (+BULLET_TIME_METER_PER_BOSS_HIT each). Activation on B press requires
  // the meter at MAX; the bulletTime field power-up no longer auto-triggers
  // slow-mo, it now fills the meter as an instant top-up.
  describe('R87.K6 — Manual bullet-time charge meter + B-key gate', () => {
    describe('Config dials', () => {
      it('BULLET_TIME_METER_MAX === 100', () => {
        expect(C.BULLET_TIME_METER_MAX).toBe(100);
      });

      it('BULLET_TIME_METER_PER_BRICK === 4', () => {
        expect(C.BULLET_TIME_METER_PER_BRICK).toBe(4);
      });

      it('BULLET_TIME_METER_PER_BOSS_HIT === 8', () => {
        expect(C.BULLET_TIME_METER_PER_BOSS_HIT).toBe(8);
      });

      it('meter dials are positive (never zero-out silently)', () => {
        expect(C.BULLET_TIME_METER_PER_BRICK).toBeGreaterThan(0);
        expect(C.BULLET_TIME_METER_PER_BOSS_HIT).toBeGreaterThan(0);
      });

      it('single brick cannot fill the meter instantly', () => {
        // Anti-regression ratchet: a future tuning that bumps PER_BRICK to
        // >= MAX would silently revert K6 to an "every brick is a free
        // bullet-time" regime, which defeats the purpose of the scarce-
        // activation design Tom asked for.
        expect(C.BULLET_TIME_METER_PER_BRICK).toBeLessThan(C.BULLET_TIME_METER_MAX);
      });

      it('boss hits charge faster than brick hits', () => {
        // Keeps boss-fight activation frequency roughly equal to
        // brick-breaking-phase frequency despite bosses having fewer total
        // hits per fight.
        expect(C.BULLET_TIME_METER_PER_BOSS_HIT).toBeGreaterThan(C.BULLET_TIME_METER_PER_BRICK);
      });
    });

    describe('addBulletTimeCharge', () => {
      it('accumulates additive amounts', () => {
        scene.bulletTimeMeter = 0;
        call(scene, 'addBulletTimeCharge', 10);
        call(scene, 'addBulletTimeCharge', 15);
        expect(s(scene, 'bulletTimeMeter')).toBe(25);
      });

      it('clamps at BULLET_TIME_METER_MAX (no overflow)', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX - 5;
        call(scene, 'addBulletTimeCharge', 20);
        expect(s(scene, 'bulletTimeMeter')).toBe(C.BULLET_TIME_METER_MAX);
      });

      it('clamps oversized single additions', () => {
        scene.bulletTimeMeter = 0;
        call(scene, 'addBulletTimeCharge', 500);
        expect(s(scene, 'bulletTimeMeter')).toBe(C.BULLET_TIME_METER_MAX);
      });
    });

    describe('destroyBrick + hitBoss integration', () => {
      it('destroyBrick adds BULLET_TIME_METER_PER_BRICK charge', () => {
        scene.bulletTimeMeter = 0;
        scene.bricks = [{
          sprite: createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT),
          type: 'code', health: 1, maxHealth: 1, value: 10,
          row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
        }];
        call(scene, 'destroyBrick', 0);
        expect(s(scene, 'bulletTimeMeter')).toBe(C.BULLET_TIME_METER_PER_BRICK);
      });

      it('hitBoss adds BULLET_TIME_METER_PER_BOSS_HIT charge', () => {
        scene.bulletTimeMeter = 0;
        scene.boss = {
          sprite: createMockRect(C.WIDTH / 2, 80, C.BOSS_WIDTH, C.BOSS_HEIGHT),
          healthBar: createMockGraphics(),
          healthBg: createMockGraphics(),
          health: 50, maxHealth: 50, value: 500,
          width: C.BOSS_WIDTH, height: C.BOSS_HEIGHT,
          direction: 1, speed: C.BOSS_SPEED, fireTimer: 0,
        };
        call(scene, 'hitBoss', 1);
        expect(s(scene, 'bulletTimeMeter')).toBe(C.BULLET_TIME_METER_PER_BOSS_HIT);
      });

      it('destroyBrick charge stacks across multiple destructions up to cap', () => {
        scene.bulletTimeMeter = 0;
        for (let i = 0; i < 30; i++) {
          scene.bricks = [{
            sprite: createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT),
            type: 'code', health: 1, maxHealth: 1, value: 10,
            row: 0, col: 0, width: C.BRICK_WIDTH, height: C.BRICK_HEIGHT,
          }];
          call(scene, 'destroyBrick', 0);
        }
        // 30 × PER_BRICK would overflow; must clamp at MAX.
        expect(s(scene, 'bulletTimeMeter')).toBe(C.BULLET_TIME_METER_MAX);
      });
    });

    describe('B-key manual gate (handleBulletTime)', () => {
      it('no-op when meter below MAX — bullet-time does NOT activate', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX - 1;
        scene.bulletTimeActive = false;
        (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
        scene.bulletTimeKey = { isDown: true };
        call(scene, 'handleBulletTime');
        expect(s(scene, 'bulletTimeActive')).toBe(false);
        expect(s(scene, 'bulletTimeUses')).toBe(0);
      });

      it('meter unchanged on sub-MAX B press (no silent consume)', () => {
        // Guard against a refactor that consumes the meter on every B press
        // regardless of cap — would make the gate feel broken.
        scene.bulletTimeMeter = 50;
        (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
        scene.bulletTimeKey = { isDown: true };
        call(scene, 'handleBulletTime');
        expect(s(scene, 'bulletTimeMeter')).toBe(50);
      });

      it('activates when meter === MAX', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX;
        (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
        scene.bulletTimeKey = { isDown: true };
        call(scene, 'handleBulletTime');
        expect(s(scene, 'bulletTimeActive')).toBe(true);
      });

      it('consumes the full meter on activation (resets to 0)', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX;
        (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
        scene.bulletTimeKey = { isDown: true };
        call(scene, 'handleBulletTime');
        expect(s(scene, 'bulletTimeMeter')).toBe(0);
      });

      it('re-entry blocked while active even when meter refilled', () => {
        // A future brick burst during a live slow-mo could top the meter
        // back to MAX; B press must still no-op so the current session
        // plays out fully before the next activation is earned.
        scene.bulletTimeActive = true;
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX;
        scene.bulletTimeUses = 1;
        (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
        scene.bulletTimeKey = { isDown: true };
        call(scene, 'handleBulletTime');
        expect(s(scene, 'bulletTimeUses')).toBe(1);
        expect(s(scene, 'bulletTimeMeter')).toBe(C.BULLET_TIME_METER_MAX);
      });

      it('does nothing if B not just-pressed (key held)', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX;
        (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(false);
        scene.bulletTimeKey = { isDown: true };
        call(scene, 'handleBulletTime');
        expect(s(scene, 'bulletTimeActive')).toBe(false);
      });
    });

    describe('Activation chain (shared by B-press + power-up paths)', () => {
      it('activateBulletTime increments bulletTimeUses', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX;
        call(scene, 'activateBulletTime');
        expect(s(scene, 'bulletTimeUses')).toBe(1);
      });

      it('activateBulletTime plays specialAbility sound', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX;
        call(scene, 'activateBulletTime');
        expect(scene.playSound).toHaveBeenCalledWith('specialAbility');
      });

      it('activateBulletTime schedules deactivation at POWERUP_DEFS.bulletTime.duration', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX;
        call(scene, 'activateBulletTime');
        expect(scene.time.delayedCall).toHaveBeenCalledWith(
          POWERUP_DEFS.bulletTime.duration,
          expect.any(Function),
        );
      });

      it('activateBulletTime no-ops when already active (no double-increment)', () => {
        scene.bulletTimeActive = true;
        scene.bulletTimeUses = 3;
        call(scene, 'activateBulletTime');
        expect(s(scene, 'bulletTimeUses')).toBe(3);
      });
    });

    describe('Power-up pickup re-route (activateBulletTimePowerUp)', () => {
      it('fills meter to MAX instead of auto-activating slow-mo', () => {
        scene.bulletTimeMeter = 0;
        scene.bulletTimeActive = false;
        call(scene, 'activateBulletTimePowerUp');
        expect(s(scene, 'bulletTimeMeter')).toBe(C.BULLET_TIME_METER_MAX);
      });

      it('does NOT set bulletTimeActive = true (removes auto-activation)', () => {
        scene.bulletTimeActive = false;
        call(scene, 'activateBulletTimePowerUp');
        expect(s(scene, 'bulletTimeActive')).toBe(false);
      });

      it('does NOT increment bulletTimeUses (pickup is not an activation)', () => {
        scene.bulletTimeUses = 0;
        call(scene, 'activateBulletTimePowerUp');
        expect(s(scene, 'bulletTimeUses')).toBe(0);
      });

      it('does NOT schedule a deactivation timer (auto-deactivation path gone)', () => {
        scene.time.delayedCall = vi.fn();
        call(scene, 'activateBulletTimePowerUp');
        // Any delayedCall using POWERUP_DEFS.bulletTime.duration would be
        // the removed auto-deactivation path.
        const calls = (scene.time.delayedCall as ReturnType<typeof vi.fn>).mock.calls;
        const hadAutoDeactivateCall = calls.some(
          (args: unknown[]) => args[0] === POWERUP_DEFS.bulletTime.duration,
        );
        expect(hadAutoDeactivateCall).toBe(false);
      });

      it('does not over-fill when meter already full (clamp)', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX;
        call(scene, 'activateBulletTimePowerUp');
        expect(s(scene, 'bulletTimeMeter')).toBe(C.BULLET_TIME_METER_MAX);
      });
    });

    describe('State reset', () => {
      it('resetState zeros the meter', () => {
        scene.bulletTimeMeter = 75;
        call(scene, 'resetState');
        expect(s(scene, 'bulletTimeMeter')).toBe(0);
      });

      it('initial state has bulletTimeMeter === 0', () => {
        expect(s(scene, 'bulletTimeMeter')).toBe(0);
      });
    });

    describe('HUD painting (updateBulletTimeHUD)', () => {
      it('charging: label shows percentage and PRIMARY colour', () => {
        scene.bulletTimeMeter = 40;
        scene.bulletTimeActive = false;
        call(scene, 'updateBulletTimeHUD');
        expect(scene.bulletTimeMeterText.setText).toHaveBeenCalledWith('BULLET TIME: 40%');
        expect(scene.bulletTimeMeterText.setColor).toHaveBeenCalledWith('#00ff00');
      });

      it('full-idle: label shows READY [B] and YELLOW colour', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_METER_MAX;
        scene.bulletTimeActive = false;
        call(scene, 'updateBulletTimeHUD');
        expect(scene.bulletTimeMeterText.setText).toHaveBeenCalledWith('BULLET TIME: READY [B]');
        expect(scene.bulletTimeMeterText.setColor).toHaveBeenCalledWith('#ffff00');
      });

      it('active: label shows ACTIVE and CYAN colour', () => {
        scene.bulletTimeActive = true;
        call(scene, 'updateBulletTimeHUD');
        expect(scene.bulletTimeMeterText.setText).toHaveBeenCalledWith('BULLET TIME: ACTIVE');
        expect(scene.bulletTimeMeterText.setColor).toHaveBeenCalledWith('#00ffff');
      });

      it('meter bar redraws each update (clear + stroke + fill)', () => {
        scene.bulletTimeMeter = 50;
        call(scene, 'updateBulletTimeHUD');
        expect(scene.bulletTimeMeterBar.clear).toHaveBeenCalled();
        expect(scene.bulletTimeMeterBar.strokeRect).toHaveBeenCalled();
        expect(scene.bulletTimeMeterBar.fillRect).toHaveBeenCalled();
      });
    });

    describe('Test-state exposure', () => {
      it('getTestState includes bulletTimeMeter', () => {
        scene.bulletTimeMeter = 33;
        const state = call(scene, 'getTestState') as Record<string, unknown>;
        expect(state.bulletTimeMeter).toBe(33);
      });
    });
  });

  // --------------------------------------------------------------------
  // R87.K7 — power-up legend overlay on pickup.
  //
  // Scope: activating any of the 6 power-ups (either by field-drop pickup or
  // by the manual B-press charge path) must paint a 6-line legend showing the
  // active entry at ACTIVE_ALPHA + its def colour and the remaining 5 at
  // INACTIVE_ALPHA. The overlay auto-hides after POWERUP_LEGEND.DISPLAY_MS.
  //
  // Back-to-back pickups must rebuild the cohort without leaking Text nodes
  // or firing a stale hide against the newer cohort — identical reference-
  // capture pattern to Invaders R85.I6 (hidePowerUpLegend captures
  // `this.powerUpLegend` as a local `targets` so show() resetting the field
  // to a fresh array produces a detached reference that the stale tween
  // operates on in isolation).
  // --------------------------------------------------------------------
  describe('R87.K7 — power-up legend on pickup + menu legend contract', () => {
    beforeEach(() => {
      // Unlock activatePowerUp — the K1/K2 guard blocks effects under
      // isGameOver/isLevelComplete so these tests need both flags cleared.
      scene.isGameOver = false;
      scene.isLevelComplete = false;
      // Reset legend state. Fresh scene never shows the legend until an
      // activation fires.
      scene.powerUpLegend = [];
      scene.powerUpLegendHideTimer = undefined;
    });

    describe('POWERUP_LEGEND config contract', () => {
      it('exports exactly one entry per PowerUpType key', () => {
        expect(POWERUP_LEGEND.ENTRIES).toHaveLength(Object.keys(POWERUP_DEFS).length);
      });

      it('every entry references a real PowerUpType + has name + effect + duration', () => {
        for (const entry of POWERUP_LEGEND.ENTRIES) {
          expect(POWERUP_DEFS[entry.type]).toBeDefined();
          expect(entry.name.length).toBeGreaterThan(0);
          expect(entry.effect.length).toBeGreaterThan(0);
          expect(entry.duration.length).toBeGreaterThan(0);
        }
      });

      it('entries appear in POWERUP_DEFS declaration order — future adds surface auto', () => {
        const defOrder = Object.keys(POWERUP_DEFS) as PowerUpType[];
        const legendOrder = POWERUP_LEGEND.ENTRIES.map((e) => e.type);
        expect(legendOrder).toEqual(defOrder);
      });

      it('display + fade dials are positive finite numbers', () => {
        expect(POWERUP_LEGEND.DISPLAY_MS).toBeGreaterThan(0);
        expect(POWERUP_LEGEND.FADE_IN_MS).toBeGreaterThan(0);
        expect(POWERUP_LEGEND.FADE_OUT_MS).toBeGreaterThan(0);
      });

      it('DISPLAY_MS ≥ 2000 — anti-regression ratchet (below 2s reads as flicker)', () => {
        // Tom's 4s brief matches Pong/Invaders/Frogger cadence; a future
        // refactor that drops it to 500ms would strip the "read the effect"
        // window and revive Tom's "guessing what power-up is what" complaint.
        expect(POWERUP_LEGEND.DISPLAY_MS).toBeGreaterThanOrEqual(2000);
      });

      it('INACTIVE_ALPHA < ACTIVE_ALPHA so the active entry reads visually distinct', () => {
        expect(POWERUP_LEGEND.INACTIVE_ALPHA).toBeLessThan(POWERUP_LEGEND.ACTIVE_ALPHA);
      });

      it('BASE_Y_RATIO sits in mid-canvas band 0.45–0.75 (below bricks, above paddle)', () => {
        // Brick grid can reach y≈248 on 9-row levels → ratio 0.55. Paddle at
        // y=420 → ratio 0.93. Legend must land strictly between these bands.
        expect(POWERUP_LEGEND.BASE_Y_RATIO).toBeGreaterThanOrEqual(0.45);
        expect(POWERUP_LEGEND.BASE_Y_RATIO).toBeLessThanOrEqual(0.75);
      });

      it('LINE_HEIGHT is small enough that 6 stacked rows fit under the paddle', () => {
        // 6 rows × LINE_HEIGHT starting at BASE_Y_RATIO must stay above paddle.
        const baseY = GAME_CONFIG.HEIGHT * POWERUP_LEGEND.BASE_Y_RATIO;
        const lastRowY = baseY + (POWERUP_LEGEND.ENTRIES.length - 1) * POWERUP_LEGEND.LINE_HEIGHT;
        expect(lastRowY).toBeLessThan(GAME_CONFIG.PADDLE_Y);
      });
    });

    describe('showPowerUpLegend — cohort build', () => {
      it('creates exactly one Text per POWERUP_LEGEND entry', () => {
        const textSpy = vi.fn().mockImplementation(() => createMockText());
        scene.add.text = textSpy;
        call(scene, 'showPowerUpLegend', 'multiBall' as PowerUpType);
        expect(textSpy).toHaveBeenCalledTimes(POWERUP_LEGEND.ENTRIES.length);
      });

      it('stacks rows vertically at LINE_HEIGHT spacing from BASE_Y_RATIO', () => {
        const textSpy = vi.fn().mockImplementation(() => createMockText());
        scene.add.text = textSpy;
        call(scene, 'showPowerUpLegend', 'multiBall' as PowerUpType);
        const baseY = GAME_CONFIG.HEIGHT * POWERUP_LEGEND.BASE_Y_RATIO;
        POWERUP_LEGEND.ENTRIES.forEach((_, i) => {
          const [, y] = textSpy.mock.calls[i] as unknown[];
          expect(y).toBeCloseTo(baseY + i * POWERUP_LEGEND.LINE_HEIGHT, 6);
        });
      });

      it('populates this.powerUpLegend with one Text ref per entry', () => {
        call(scene, 'showPowerUpLegend', 'widePaddle' as PowerUpType);
        expect(scene.powerUpLegend).toHaveLength(POWERUP_LEGEND.ENTRIES.length);
      });

      it('schedules a hide after DISPLAY_MS', () => {
        const delayedCallSpy = vi.fn().mockReturnValue({ destroy: vi.fn() });
        scene.time.delayedCall = delayedCallSpy;
        call(scene, 'showPowerUpLegend', 'laser' as PowerUpType);
        const hideCall = delayedCallSpy.mock.calls.find(
          (args: unknown[]) => args[0] === POWERUP_LEGEND.DISPLAY_MS,
        );
        expect(hideCall).toBeDefined();
        expect(typeof hideCall?.[1]).toBe('function');
      });

      it('active entry renders at ACTIVE_ALPHA via a fade-in tween (target matches entry Text)', () => {
        const textMocks: ReturnType<typeof createMockText>[] = [];
        scene.add.text = vi.fn().mockImplementation(() => {
          const t = createMockText();
          textMocks.push(t);
          return t;
        });
        const tweenSpy = vi.fn().mockReturnValue({ destroy: vi.fn() });
        scene.tweens.add = tweenSpy;

        const activated: PowerUpType = 'bulletTime';
        call(scene, 'showPowerUpLegend', activated);

        const activeIdx = POWERUP_LEGEND.ENTRIES.findIndex((e) => e.type === activated);
        const activeText = textMocks[activeIdx];
        const activeTween = tweenSpy.mock.calls.find(
          (args: unknown[]) => (args[0] as { targets: unknown }).targets === activeText,
        );
        expect(activeTween).toBeDefined();
        expect((activeTween?.[0] as { alpha: number }).alpha).toBe(POWERUP_LEGEND.ACTIVE_ALPHA);
        expect((activeTween?.[0] as { duration: number }).duration).toBe(POWERUP_LEGEND.FADE_IN_MS);
      });

      it('inactive entries render at INACTIVE_ALPHA', () => {
        const textMocks: ReturnType<typeof createMockText>[] = [];
        scene.add.text = vi.fn().mockImplementation(() => {
          const t = createMockText();
          textMocks.push(t);
          return t;
        });
        const tweenSpy = vi.fn().mockReturnValue({ destroy: vi.fn() });
        scene.tweens.add = tweenSpy;

        call(scene, 'showPowerUpLegend', 'multiBall' as PowerUpType);

        POWERUP_LEGEND.ENTRIES.forEach((entry, i) => {
          if (entry.type === 'multiBall') return;
          const inactiveTweenForRow = tweenSpy.mock.calls.find(
            (args: unknown[]) => (args[0] as { targets: unknown }).targets === textMocks[i],
          );
          expect(inactiveTweenForRow).toBeDefined();
          expect((inactiveTweenForRow?.[0] as { alpha: number }).alpha).toBe(
            POWERUP_LEGEND.INACTIVE_ALPHA,
          );
        });
      });

      it('active entry Text is coloured with the power-up def colour (hex)', () => {
        const textSpy = vi.fn().mockImplementation(() => createMockText());
        scene.add.text = textSpy;
        call(scene, 'showPowerUpLegend', 'laser' as PowerUpType);

        const laserIdx = POWERUP_LEGEND.ENTRIES.findIndex((e) => e.type === 'laser');
        const callArgs = textSpy.mock.calls[laserIdx];
        const style = callArgs[3] as { color: string };
        const expectedHex = `#${POWERUP_DEFS.laser.color.toString(16).padStart(6, '0')}`;
        expect(style.color).toBe(expectedHex);
      });

      it('Text content uses "NAME · EFFECT · DURATION" format', () => {
        const textSpy = vi.fn().mockImplementation(() => createMockText());
        scene.add.text = textSpy;
        call(scene, 'showPowerUpLegend', 'multiBall' as PowerUpType);
        const multiIdx = POWERUP_LEGEND.ENTRIES.findIndex((e) => e.type === 'multiBall');
        const contents = textSpy.mock.calls[multiIdx][2] as string;
        const entry = POWERUP_LEGEND.ENTRIES[multiIdx];
        expect(contents).toBe(`${entry.name} · ${entry.effect} · ${entry.duration}`);
      });
    });

    describe('activatePowerUp integrates the legend', () => {
      it('calling activatePowerUp for each type surfaces the legend with that active entry', () => {
        for (const entry of POWERUP_LEGEND.ENTRIES) {
          scene.powerUpLegend = [];
          scene.powerUpLegendHideTimer = undefined;
          // Stub destructive side-effects (EMP brick clears, multiBall spawns)
          // so each activation path doesn't mutate unrelated state for the
          // next iteration.
          scene.activateMultiBall = vi.fn();
          scene.activateWidePaddle = vi.fn();
          scene.activateLaser = vi.fn();
          scene.activateBulletTimePowerUp = vi.fn();
          scene.activateFirewall = vi.fn();
          scene.activateEMP = vi.fn();
          call(scene, 'activatePowerUp', entry.type);
          expect(scene.powerUpLegend).toHaveLength(POWERUP_LEGEND.ENTRIES.length);
        }
      });

      it('does NOT fire the legend when activatePowerUp short-circuits on isGameOver', () => {
        scene.isGameOver = true;
        call(scene, 'activatePowerUp', 'multiBall' as PowerUpType);
        expect(scene.powerUpLegend).toHaveLength(0);
      });

      it('does NOT fire the legend when activatePowerUp short-circuits on isLevelComplete', () => {
        scene.isLevelComplete = true;
        call(scene, 'activatePowerUp', 'widePaddle' as PowerUpType);
        expect(scene.powerUpLegend).toHaveLength(0);
      });
    });

    describe('hidePowerUpLegend + clearPowerUpLegend lifecycle', () => {
      it('back-to-back activations destroy the old cohort and rebuild a fresh one', () => {
        // First activation — spy on first-cohort destroy calls.
        call(scene, 'showPowerUpLegend', 'multiBall' as PowerUpType);
        const firstCohort = [...scene.powerUpLegend];
        expect(firstCohort).toHaveLength(POWERUP_LEGEND.ENTRIES.length);
        const firstCohortDestroyCount = firstCohort.length;

        // Second activation before the 4s hide fires — clearPowerUpLegend
        // runs synchronously inside showPowerUpLegend(), destroying the
        // first-cohort nodes before building new ones.
        call(scene, 'showPowerUpLegend', 'laser' as PowerUpType);
        const secondCohort = scene.powerUpLegend;
        expect(secondCohort).toHaveLength(POWERUP_LEGEND.ENTRIES.length);
        // None of the second cohort is a re-used reference from the first.
        for (const t of secondCohort) {
          expect(firstCohort.includes(t)).toBe(false);
        }
        // First cohort was destroyed exactly once per node.
        for (const t of firstCohort) {
          expect((t.destroy as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
        }
        expect(firstCohortDestroyCount).toBe(POWERUP_LEGEND.ENTRIES.length);
      });

      it('clearPowerUpLegend removes the hide timer and empties the array', () => {
        const hideTimer = { remove: vi.fn() };
        scene.powerUpLegendHideTimer = hideTimer;
        scene.powerUpLegend = [createMockText(), createMockText()];
        call(scene, 'clearPowerUpLegend');
        expect(hideTimer.remove).toHaveBeenCalledWith(false);
        expect(scene.powerUpLegendHideTimer).toBeUndefined();
        expect(scene.powerUpLegend).toHaveLength(0);
      });

      it('hidePowerUpLegend with empty cohort is a no-op', () => {
        scene.powerUpLegend = [];
        const tweenSpy = vi.fn().mockReturnValue({ destroy: vi.fn() });
        scene.tweens.add = tweenSpy;
        call(scene, 'hidePowerUpLegend');
        expect(tweenSpy).not.toHaveBeenCalled();
      });

      it('hidePowerUpLegend schedules a fade-out tween on the current cohort', () => {
        const cohort = [createMockText(), createMockText(), createMockText()];
        scene.powerUpLegend = cohort;
        const tweenSpy = vi.fn().mockReturnValue({ destroy: vi.fn() });
        scene.tweens.add = tweenSpy;
        call(scene, 'hidePowerUpLegend');
        expect(tweenSpy).toHaveBeenCalledTimes(1);
        const arg = tweenSpy.mock.calls[0][0] as { targets: unknown; alpha: number; duration: number };
        expect(arg.targets).toBe(cohort);
        expect(arg.alpha).toBe(0);
        expect(arg.duration).toBe(POWERUP_LEGEND.FADE_OUT_MS);
      });

      it('hide onComplete destroys only the captured cohort, leaves a newer one alone', () => {
        const firstCohort = [createMockText(), createMockText(), createMockText()];
        scene.powerUpLegend = firstCohort;

        let capturedOnComplete: (() => void) | undefined;
        scene.tweens.add = vi.fn().mockImplementation((cfg: { onComplete?: () => void }) => {
          capturedOnComplete = cfg.onComplete;
          return { destroy: vi.fn() };
        });
        call(scene, 'hidePowerUpLegend');

        // Before the fade completes, a second activation rebuilds the cohort.
        const secondCohort = [createMockText(), createMockText()];
        scene.powerUpLegend = secondCohort;

        // Now let the stale tween's onComplete run.
        capturedOnComplete?.();

        // First cohort destroyed, second cohort untouched.
        for (const t of firstCohort) {
          expect((t.destroy as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
        }
        for (const t of secondCohort) {
          expect((t.destroy as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
        }
        // The live field still points at the newer cohort.
        expect(scene.powerUpLegend).toBe(secondCohort);
      });
    });

    describe('Reduced-motion branch', () => {
      it('instant-alpha on show when prefers-reduced-motion matches', () => {
        scene.prefersReducedMotion = vi.fn().mockReturnValue(true);
        const textMocks: ReturnType<typeof createMockText>[] = [];
        scene.add.text = vi.fn().mockImplementation(() => {
          const t = createMockText();
          textMocks.push(t);
          return t;
        });
        const tweenSpy = vi.fn().mockReturnValue({ destroy: vi.fn() });
        scene.tweens.add = tweenSpy;

        call(scene, 'showPowerUpLegend', 'multiBall' as PowerUpType);

        // No tweens on the per-entry Text objects — only the hide-timer
        // delayedCall remains.
        for (const t of textMocks) {
          const tweenForRow = tweenSpy.mock.calls.find(
            (args: unknown[]) => (args[0] as { targets: unknown }).targets === t,
          );
          expect(tweenForRow).toBeUndefined();
        }
        // Active entry ran setAlpha(ACTIVE_ALPHA) via instant branch.
        const activeIdx = POWERUP_LEGEND.ENTRIES.findIndex((e) => e.type === 'multiBall');
        expect(textMocks[activeIdx].setAlpha).toHaveBeenCalledWith(POWERUP_LEGEND.ACTIVE_ALPHA);
      });

      it('instant-destroy on hide when prefers-reduced-motion matches (no fade-out tween)', () => {
        scene.prefersReducedMotion = vi.fn().mockReturnValue(true);
        const cohort = [createMockText(), createMockText(), createMockText()];
        scene.powerUpLegend = cohort;
        const tweenSpy = vi.fn().mockReturnValue({ destroy: vi.fn() });
        scene.tweens.add = tweenSpy;

        call(scene, 'hidePowerUpLegend');
        // No fade-out tween — clearPowerUpLegend runs synchronously.
        expect(tweenSpy).not.toHaveBeenCalled();
        for (const t of cohort) {
          expect((t.destroy as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
        }
        expect(scene.powerUpLegend).toHaveLength(0);
      });
    });

    describe('shutdown + resetState cleanup', () => {
      it('resetState zeros the legend array + clears the hide-timer ref', () => {
        scene.powerUpLegend = [createMockText(), createMockText()];
        scene.powerUpLegendHideTimer = { remove: vi.fn() };
        call(scene, 'resetState');
        expect(scene.powerUpLegend).toHaveLength(0);
        expect(scene.powerUpLegendHideTimer).toBeUndefined();
      });

      it('shutdown flushes any in-flight legend via clearPowerUpLegend', () => {
        const cohort = [createMockText(), createMockText()];
        scene.powerUpLegend = cohort;
        const hideTimer = { remove: vi.fn() };
        scene.powerUpLegendHideTimer = hideTimer;
        // Scope the shutdown to just the legend-cleanup contract — stub
        // super.shutdown so we don't need a full BaseScene teardown.
        scene.stopBackgroundMusic = vi.fn();
        Object.getPrototypeOf(CodeBreakerGameScene.prototype).shutdown = vi.fn();
        call(scene, 'shutdown');
        expect(hideTimer.remove).toHaveBeenCalledWith(false);
        for (const t of cohort) {
          expect((t.destroy as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
        }
      });
    });
  });

  // --------------------------------------------------------------------
  // R87.K8 — brick-break SFX throttle.
  //
  // Tom's 2026-04-22 playtest: *"Need to reduce the amount of times that we
  // have the brick breaking sound effect."* Packed-grid multi-ball bursts
  // destroy 5-10 bricks per frame, and prior to K8 every one of those fired
  // both SCORE and GLASS_BREAK simultaneously. Throttle gates HIT + GLASS_BREAK
  // via a single shared timestamp bucket (BRICK_SFX_THROTTLE_MS=50 ms), while
  // SCORE stays un-throttled so the combo bleep still confirms every
  // destruction — if the throttle starts silencing SCORE the combo feedback
  // Tom relies on disappears.
  // --------------------------------------------------------------------
  describe('R87.K8 — brick-SFX throttle on HIT + GLASS_BREAK', () => {
    beforeEach(() => {
      // Throttle helper reads scene.time.now for deterministic gating; the
      // shared scene mock does not populate `now` so the default `?? 0`
      // fallback applies. Each test below sets scene.time.now explicitly.
      scene.time.now = 1000;
      scene.lastBrickSfxAt = Number.NEGATIVE_INFINITY;
    });

    describe('Config dial', () => {
      it('BRICK_SFX_THROTTLE_MS is defined as 50 ms', () => {
        expect(GAME_CONFIG.BRICK_SFX_THROTTLE_MS).toBe(50);
      });

      it('BRICK_SFX_THROTTLE_MS is a positive finite number', () => {
        expect(GAME_CONFIG.BRICK_SFX_THROTTLE_MS).toBeGreaterThan(0);
        expect(Number.isFinite(GAME_CONFIG.BRICK_SFX_THROTTLE_MS)).toBe(true);
      });

      it('BRICK_SFX_THROTTLE_MS sits in safe range [16, 200] ms', () => {
        // 16 ms ≈ one 60 fps frame — anything below makes the throttle
        // pointless (no frame can fire two brick SFX anyway). 200 ms is the
        // anti-regression ceiling: above this the throttle silences most
        // brick audio in a normal run and Tom's "feels deadened" complaint
        // would surface.
        expect(GAME_CONFIG.BRICK_SFX_THROTTLE_MS).toBeGreaterThanOrEqual(16);
        expect(GAME_CONFIG.BRICK_SFX_THROTTLE_MS).toBeLessThanOrEqual(200);
      });
    });

    describe('Initial state + reset', () => {
      it('lastBrickSfxAt starts at NEGATIVE_INFINITY so the first call always fires', () => {
        // Locks the "first brick hit of a run always plays" contract. If a
        // future refactor flips the initial value to 0, scene.time.now=0 on
        // the first update frame would suppress the opening chip sound.
        expect(scene.lastBrickSfxAt).toBe(Number.NEGATIVE_INFINITY);
      });

      it('resetState zeros lastBrickSfxAt back to NEGATIVE_INFINITY', () => {
        scene.lastBrickSfxAt = 5000;
        call(scene, 'resetState');
        expect(scene.lastBrickSfxAt).toBe(Number.NEGATIVE_INFINITY);
      });
    });

    describe('playBrickSfxThrottled — gate behaviour', () => {
      it('first call after reset plays the sound regardless of time.now', () => {
        scene.time.now = 0;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        expect(scene.playSound).toHaveBeenCalledWith('glassBreak');
      });

      it('first call sets lastBrickSfxAt to current time.now', () => {
        scene.time.now = 1234;
        call(scene, 'playBrickSfxThrottled', 'hit');
        expect(scene.lastBrickSfxAt).toBe(1234);
      });

      it('second call inside the throttle window is suppressed', () => {
        scene.time.now = 1000;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        scene.playSound.mockClear();
        scene.time.now = 1000 + GAME_CONFIG.BRICK_SFX_THROTTLE_MS - 1;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        expect(scene.playSound).not.toHaveBeenCalled();
      });

      it('suppressed call does NOT update lastBrickSfxAt (window anchored to last-played)', () => {
        scene.time.now = 1000;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        scene.time.now = 1030;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        expect(scene.lastBrickSfxAt).toBe(1000);
      });

      it('call at exactly the throttle boundary still fires (strict < gate)', () => {
        // Gate is `now - last < THRESHOLD`. When now-last === THRESHOLD the
        // next call should fire — locks the `<` operator vs a `<=` regression
        // that would turn the throttle into a one-frame-longer window.
        scene.time.now = 1000;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        scene.playSound.mockClear();
        scene.time.now = 1000 + GAME_CONFIG.BRICK_SFX_THROTTLE_MS;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        expect(scene.playSound).toHaveBeenCalledWith('glassBreak');
      });

      it('call beyond the throttle window fires again', () => {
        scene.time.now = 1000;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        scene.playSound.mockClear();
        scene.time.now = 1000 + GAME_CONFIG.BRICK_SFX_THROTTLE_MS * 2;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        expect(scene.playSound).toHaveBeenCalledWith('glassBreak');
      });

      it('different sound keys share the bucket (HIT then GLASS_BREAK inside window → second suppressed)', () => {
        // Documents the design tradeoff: a chip-HIT immediately followed by a
        // destroy-GLASS_BREAK inside the same 50 ms window silences the
        // shatter. SCORE still fires un-throttled on the destruction so the
        // player hears the kill — verified in the destroyBrick block below.
        scene.time.now = 1000;
        call(scene, 'playBrickSfxThrottled', 'hit');
        scene.playSound.mockClear();
        scene.time.now = 1020;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        expect(scene.playSound).not.toHaveBeenCalled();
      });
    });

    describe('hitBrick integration — chip-HIT throttled', () => {
      const makeBrick = (type: 'code' | 'agent' | 'sentinel' | 'unbreakable', health: number) => ({
        sprite: createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT),
        type,
        health,
        maxHealth: health,
        value: 10,
        row: 0,
        col: 0,
        width: C.BRICK_WIDTH,
        height: C.BRICK_HEIGHT,
      });

      it('unbreakable-brick HIT is throttled on rapid back-to-back hits', () => {
        scene.bricks = [makeBrick('unbreakable', 999), makeBrick('unbreakable', 999)];
        scene.time.now = 1000;
        call(scene, 'hitBrick', 0);
        scene.time.now = 1020;
        call(scene, 'hitBrick', 1);
        const hitCalls = scene.playSound.mock.calls.filter((args: unknown[]) => args[0] === 'hit');
        expect(hitCalls).toHaveLength(1);
      });

      it('non-destroy multi-hit chip HIT is throttled', () => {
        scene.bricks = [makeBrick('sentinel', 3), makeBrick('agent', 2)];
        scene.time.now = 1000;
        call(scene, 'hitBrick', 0);
        scene.time.now = 1020;
        call(scene, 'hitBrick', 1);
        const hitCalls = scene.playSound.mock.calls.filter((args: unknown[]) => args[0] === 'hit');
        expect(hitCalls).toHaveLength(1);
      });

      it('non-destroy HIT fires again after the throttle window expires', () => {
        scene.bricks = [makeBrick('sentinel', 3), makeBrick('agent', 2)];
        scene.time.now = 1000;
        call(scene, 'hitBrick', 0);
        scene.time.now = 1000 + GAME_CONFIG.BRICK_SFX_THROTTLE_MS + 1;
        call(scene, 'hitBrick', 1);
        const hitCalls = scene.playSound.mock.calls.filter((args: unknown[]) => args[0] === 'hit');
        expect(hitCalls).toHaveLength(2);
      });
    });

    describe('destroyBrick integration — SCORE always fires, GLASS_BREAK throttled', () => {
      const makeBrick = () => ({
        sprite: createMockRect(200, 100, C.BRICK_WIDTH, C.BRICK_HEIGHT),
        type: 'code' as const,
        health: 1,
        maxHealth: 1,
        value: 10,
        row: 0,
        col: 0,
        width: C.BRICK_WIDTH,
        height: C.BRICK_HEIGHT,
      });

      it('GLASS_BREAK is throttled on two destructions inside the same window', () => {
        scene.bricks = [makeBrick(), makeBrick()];
        scene.time.now = 1000;
        call(scene, 'destroyBrick', 0);
        scene.time.now = 1020;
        call(scene, 'destroyBrick', 0);
        const shatterCalls = scene.playSound.mock.calls.filter((args: unknown[]) => args[0] === 'glassBreak');
        expect(shatterCalls).toHaveLength(1);
      });

      it('SCORE still fires on every destruction even when GLASS_BREAK is throttled', () => {
        // Core contract: throttle must NOT starve the combo-beat feedback.
        scene.bricks = [makeBrick(), makeBrick(), makeBrick()];
        scene.time.now = 1000;
        call(scene, 'destroyBrick', 0);
        scene.time.now = 1010;
        call(scene, 'destroyBrick', 0);
        scene.time.now = 1020;
        call(scene, 'destroyBrick', 0);
        const scoreCalls = scene.playSound.mock.calls.filter((args: unknown[]) => args[0] === 'score');
        expect(scoreCalls).toHaveLength(3);
      });

      it('GLASS_BREAK fires again after the throttle window expires', () => {
        scene.bricks = [makeBrick(), makeBrick()];
        scene.time.now = 1000;
        call(scene, 'destroyBrick', 0);
        scene.time.now = 1000 + GAME_CONFIG.BRICK_SFX_THROTTLE_MS + 1;
        call(scene, 'destroyBrick', 0);
        const shatterCalls = scene.playSound.mock.calls.filter((args: unknown[]) => args[0] === 'glassBreak');
        expect(shatterCalls).toHaveLength(2);
      });
    });

    describe('Non-brick SFX still fire unthrottled', () => {
      it('loseLife HIT fires even when brick-SFX throttle was just tripped', () => {
        // loseLife uses playSound() directly, not playBrickSfxThrottled. A
        // death right after a brick destroy must still play its HIT — this
        // is the "I just died, I need to hear that" guarantee.
        scene.time.now = 1000;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        scene.playSound.mockClear();
        scene.time.now = 1020;
        call(scene, 'loseLife');
        expect(scene.playSound).toHaveBeenCalledWith('hit');
      });

      it('hitBoss HIT fires even when brick-SFX throttle was just tripped', () => {
        // Boss fights use hitBoss → playSound(HIT) directly. A routed-through-
        // throttle regression would silence boss-hit feedback while the
        // brick throttle cools down.
        scene.time.now = 1000;
        call(scene, 'playBrickSfxThrottled', 'glassBreak');
        scene.playSound.mockClear();
        scene.boss = {
          sprite: { ...createMockRect(400, 80, C.BOSS_WIDTH, C.BOSS_HEIGHT), setFillStyle: vi.fn().mockReturnThis() },
          healthBar: createMockGraphics(),
          healthBg: createMockGraphics(),
          health: 5,
          maxHealth: 10,
          value: C.BOSS_VALUE,
          width: C.BOSS_WIDTH,
          height: C.BOSS_HEIGHT,
          direction: 1,
          speed: 100,
          fireTimer: 0,
        };
        scene.time.now = 1020;
        call(scene, 'hitBoss', 1);
        expect(scene.playSound).toHaveBeenCalledWith('hit');
      });
    });
  });

  // -----------------------------------------------------------------------
  // R87.K9 — Coverage refresh + pre-Tom-tick tripwires
  //
  // K1-K8 locked behaviour through call-path tests, but four invariant
  // families remain only-implicitly covered. K9 adds explicit tripwires so
  // future refactors cannot silently revive a shipped bug:
  //   1. update() early-return contract — per-tick guards flush every
  //      side-effect pathway (Paused / GameOver / LevelComplete /
  //      CountingDown must all skip both livesLostThisFrame reset AND
  //      every sub-method downstream of it).
  //   2. Static regex tripwires on pre-fix bug strings — guards the
  //      *exact* symptom Tom logged (K3's `pointer.x !== this.paddle.x`
  //      miss) so a copy-paste revert is caught at test time.
  //   3. handleGameOver payload contract — locks the LEVEL row shape,
  //      the re-entry guard, the red-flash RGB literal, and the
  //      `/${TOTAL_LEVELS}` formatting (fixes a latent `/10` that K5
  //      missed — the game-over modal displayed "12/10" when all 12
  //      levels cleared).
  //   4. resetState completeness — every R87-introduced field must
  //      round-trip through resetState() (livesLostThisFrame,
  //      lastPointerX sentinel, lastBrickSfxAt NEGATIVE_INFINITY,
  //      bulletTimeMeter, powerUpLegend). A field missed here leaks
  //      state across a scene restart, which is exactly the shape of
  //      the K1-K2 soft-lock bugs.
  //   5. Bullet-time B-key wiring — K6 gated B on JustDown, but the
  //      Key-declared → addKey('B') → JustDown chain is across three
  //      sites and a refactor that only audits one would miss a break.
  // -----------------------------------------------------------------------
  describe('R87.K9 — Coverage refresh + pre-Tom-tick tripwires', () => {
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    // Stubs every update() sub-method that runs AFTER the isPaused /
    // isGameOver / isLevelComplete / isCountingDown guards. If any of
    // those flags are set, update() must hit zero of these spies. If the
    // guards are lifted, every one must be called exactly once per tick —
    // that's the ordering contract K1 relies on (reconcileBallState
    // can't run before the collision block without reviving the soft-lock).
    function stubUpdateBody(): Record<string, ReturnType<typeof vi.fn>> {
      const names = [
        'updateMatrixRain',
        'handlePaddleMovement',
        'handleLaunch',
        'handleBulletTime',
        'handleLaserFiring',
        'updateBalls',
        'updateAgents',
        'updateLasers',
        'updateFieldPowerUps',
        'updateParticles',
        'updateBoss',
        'updateBossBullets',
        'checkBallBrickCollisions',
        'checkBallPaddleCollisions',
        'checkBallWallCollisions',
        'checkBallBottomCollisions',
        'checkLaserBrickCollisions',
        'checkAgentPaddleCollisions',
        'checkBossBulletPaddleCollisions',
        'checkPowerUpCollisions',
        'checkPortalCollision',
        'reconcileBallState',
        'checkLevelComplete',
        'updateHUD',
        'checkAchievements',
      ];
      const spies: Record<string, ReturnType<typeof vi.fn>> = {};
      for (const name of names) {
        const spy = vi.fn();
        scene[name] = spy;
        spies[name] = spy;
      }
      return spies;
    }

    describe('update() early-return guards', () => {
      it('isPaused=true skips every downstream sub-method', () => {
        const spies = stubUpdateBody();
        scene.isPaused = true;
        scene.isGameOver = false;
        scene.isLevelComplete = false;
        scene.isCountingDown = false;

        scene.update(0, 16);

        for (const [name, spy] of Object.entries(spies)) {
          expect(spy, `${name} should not run when paused`).not.toHaveBeenCalled();
        }
      });

      it('isGameOver=true skips every downstream sub-method', () => {
        const spies = stubUpdateBody();
        scene.isPaused = false;
        scene.isGameOver = true;
        scene.isLevelComplete = false;
        scene.isCountingDown = false;

        scene.update(0, 16);

        for (const [name, spy] of Object.entries(spies)) {
          expect(spy, `${name} should not run after game-over`).not.toHaveBeenCalled();
        }
      });

      it('isLevelComplete=true skips every downstream sub-method', () => {
        const spies = stubUpdateBody();
        scene.isPaused = false;
        scene.isGameOver = false;
        scene.isLevelComplete = true;
        scene.isCountingDown = false;

        scene.update(0, 16);

        for (const [name, spy] of Object.entries(spies)) {
          expect(spy, `${name} should not run during level-complete banner`).not.toHaveBeenCalled();
        }
      });

      it('isCountingDown=true skips every downstream sub-method', () => {
        // Countdown is the pre-play 3-2-1 window shared by BaseScene; an
        // update leaking through here would let the ball start moving
        // before the player sees "GO!".
        const spies = stubUpdateBody();
        scene.isPaused = false;
        scene.isGameOver = false;
        scene.isLevelComplete = false;
        scene.isCountingDown = true;

        scene.update(0, 16);

        for (const [name, spy] of Object.entries(spies)) {
          expect(spy, `${name} should not run while counting down`).not.toHaveBeenCalled();
        }
      });

      it('all guards clear — every sub-method runs exactly once per tick', () => {
        const spies = stubUpdateBody();
        scene.isPaused = false;
        scene.isGameOver = false;
        scene.isLevelComplete = false;
        scene.isCountingDown = false;

        scene.update(0, 16);

        for (const [name, spy] of Object.entries(spies)) {
          expect(spy, `${name} must fire exactly once per tick`).toHaveBeenCalledTimes(1);
        }
      });

      it('livesLostThisFrame resets to false at top of every update tick', () => {
        // K2's guard relies on the reset running BEFORE any collision
        // path in this tick. A refactor that moves the reset to the
        // bottom of update() would silently re-open the double-debit
        // bug on the NEXT frame after the first life is lost.
        stubUpdateBody();
        scene.isPaused = false;
        scene.isGameOver = false;
        scene.isLevelComplete = false;
        scene.isCountingDown = false;
        scene.livesLostThisFrame = true;

        scene.update(0, 16);

        expect(scene.livesLostThisFrame).toBe(false);
      });
    });

    describe('Static regex tripwires on pre-fix bug strings', () => {
      it('source no longer contains K3 bug pattern `pointer.x !== this.paddle.x`', () => {
        // The exact condition that silently cancelled every keyboard
        // input. A copy-paste revert would compile cleanly and reopen
        // Tom's "keys get stuck" report, so lock the string absence.
        const src = readSceneSource();
        expect(src).not.toMatch(/pointer\.x\s*!==\s*this\.paddle\.x/);
      });

      it('lastPointerX sentinel is -1 (not 0 — 0 is a valid pointer.x)', () => {
        // Sentinel must be outside the valid pointer-range. `0` would
        // collide with "pointer is at the extreme left edge of the
        // canvas"; `-1` sits safely outside [0, WIDTH].
        const src = readSceneSource();
        expect(src).toMatch(/this\.lastPointerX\s*=\s*-1/);
        expect(src).not.toMatch(/private\s+lastPointerX\s*=\s*0\b/);
      });

      it('lastBrickSfxAt sentinel is NEGATIVE_INFINITY (not 0)', () => {
        // `0` would silence the very first brick hit of a run when
        // scene.time.now is also 0 on frame 1 (the `<` gate evaluates
        // `0 - 0 < 50` as true). NEGATIVE_INFINITY guarantees first-
        // hit audibility regardless of Phaser's time bootstrap.
        const src = readSceneSource();
        expect(src).toMatch(/Number\.NEGATIVE_INFINITY/);
        expect(src).toMatch(/lastBrickSfxAt\s*=\s*Number\.NEGATIVE_INFINITY/);
      });

      it('reconcileBallState() is called exactly once in update() body', () => {
        // K1's post-collision reconciliation must run after every
        // collision check and BEFORE checkLevelComplete. Any refactor
        // that duplicates the call (e.g. adding a defensive second
        // invocation for "safety") risks a double-loseLife on the
        // ball-empty scenario. A single source of truth per tick.
        const src = readSceneSource();
        const matches = src.match(/this\.reconcileBallState\(\)/g) ?? [];
        expect(matches).toHaveLength(1);
      });

      it('livesLostThisFrame reset happens at update()-top, set only in loseLife', () => {
        // Three writes total: declaration, resetState reset, update()
        // reset, loseLife set. Any additional write-site is suspect.
        const src = readSceneSource();
        const resetMatches = src.match(/livesLostThisFrame\s*=\s*false/g) ?? [];
        const setMatches = src.match(/livesLostThisFrame\s*=\s*true/g) ?? [];
        // 3 false-writes: initialiser, resetState, update-top
        expect(resetMatches).toHaveLength(3);
        // 1 true-write: loseLife guard
        expect(setMatches).toHaveLength(1);
      });

      it('playBrickSfxThrottled gate uses strict `<` (boundary-equal call fires)', () => {
        // R87.K8 commit body: "strict `<` gate so exactly-at-boundary
        // calls still fire (anti-regression against a `<=` drift that
        // would extend the throttle by one frame)". A `<=` drift would
        // extend the cooldown by one frame and stop-stutter the first
        // post-window fire. Locked via regex — the helper aliases
        // `this.time.now` to a local `now`, so match the delta against
        // the locally-named timestamp.
        const src = readSceneSource();
        const helperMatch = src.match(/private playBrickSfxThrottled\([\s\S]*?\n {2}\}/);
        expect(helperMatch).not.toBeNull();
        const body = helperMatch![0];
        // Must contain `<` comparison with the throttle dial, must NOT contain `<=`.
        expect(body).toMatch(/-\s*this\.lastBrickSfxAt\s*<[^=]/);
        expect(body).not.toMatch(/-\s*this\.lastBrickSfxAt\s*<=/);
        expect(body).toMatch(/GAME_CONFIG\.BRICK_SFX_THROTTLE_MS/);
      });
    });

    describe('handleGameOver payload contract', () => {
      beforeEach(() => {
        scene.score = 1500;
        scene.highScore = 2000;
        scene.level = 3;
        scene.agentsKilled = 4;
        scene.bulletTimeUses = 2;
        scene.getGameDuration = vi.fn().mockReturnValue(42_000);
      });

      it('LEVEL row renders as `N/TOTAL_LEVELS` (guards against `/10` regression)', () => {
        // K5 bumped TOTAL_LEVELS 10 → 12 but left the hardcoded "/10"
        // in the payload. K9 re-routes through the config dial; this
        // test locks the fix so any future retier auto-stays in sync.
        scene.level = GAME_CONFIG.TOTAL_LEVELS;
        call(scene, 'handleGameOver', 'escaped');

        const payload = scene.gameOver.mock.calls[0][3] as Array<{ label: string; value: string }>;
        const levelRow = payload.find(r => r.label === 'Level')!;
        expect(levelRow).toBeDefined();
        expect(levelRow.value).toBe(`${GAME_CONFIG.TOTAL_LEVELS}/${GAME_CONFIG.TOTAL_LEVELS}`);
        expect(levelRow.value).not.toContain('/10');
      });

      it('payload contains exactly Level + Agents + Bullet Time rows (3)', () => {
        // Locks the stats-row count so a future "helpful" addition
        // doesn't silently shift the HUD layout the GameOverScene
        // assumes. Three rows matches the game-over UI grid.
        call(scene, 'handleGameOver');
        const payload = scene.gameOver.mock.calls[0][3] as Array<{ label: string; value: unknown }>;
        expect(payload).toHaveLength(3);
        expect(payload.map(r => r.label)).toEqual(['Level', 'Agents', 'Bullet Time']);
      });

      it('re-entry guard blocks a second game-over call in the same run', () => {
        // defeatBoss on the final level and loseLife with 0 lives can
        // both try to end the game from adjacent frames. Second call
        // must no-op — ordering matters because GameOverScene mounts
        // at step 1 and would double-animate otherwise.
        call(scene, 'handleGameOver', 'escaped');
        const firstCallCount = scene.gameOver.mock.calls.length;
        expect(firstCallCount).toBe(1);

        call(scene, 'handleGameOver'); // second call
        expect(scene.gameOver.mock.calls).toHaveLength(firstCallCount);
      });

      it('fires red camera flash — not green (guards against achievement-flash copy-paste)', () => {
        // R86.F1 uses a GREEN flash for the finish-line-crossed beat
        // (0, 255, 0). Game-over must stay RED (255, 0, 0) so the
        // failure-vs-success feedback signals stay distinct. This is
        // the same guard R86.F6+++ added for Frogger.
        call(scene, 'handleGameOver');
        expect(scene.cameras.main.flash).toHaveBeenCalledWith(
          120, 255, 0, 0, false, undefined, undefined, 0.25,
        );
      });

      it('plays GAME_OVER sound exactly once per session', () => {
        call(scene, 'handleGameOver');
        const gameOverCalls = scene.playSound.mock.calls.filter(
          (args: unknown[]) => args[0] === 'gameOver',
        );
        expect(gameOverCalls).toHaveLength(1);
      });

      it('sets isGameOver=true synchronously (before gameOver() fires)', () => {
        // Guards the ordering: the flag must flip BEFORE gameOver()
        // emits, because GameOverScene's SessionStart handler reads
        // it from the registry to decide whether to mount. A later
        // flip would allow one extra update() tick and potentially a
        // stray loseLife/activatePowerUp firing into a dead scene.
        let flagWhenGameOverFired: boolean | null = null;
        scene.gameOver = vi.fn(() => {
          flagWhenGameOverFired = scene.isGameOver;
        });
        call(scene, 'handleGameOver');
        expect(flagWhenGameOverFired).toBe(true);
      });
    });

    describe('resetState completeness — every R87 field round-trips', () => {
      it('livesLostThisFrame resets to false', () => {
        scene.livesLostThisFrame = true;
        call(scene, 'resetState');
        expect(scene.livesLostThisFrame).toBe(false);
      });

      it('lastPointerX resets to the -1 sentinel', () => {
        scene.lastPointerX = 123;
        call(scene, 'resetState');
        expect(scene.lastPointerX).toBe(-1);
      });

      it('lastBrickSfxAt resets to NEGATIVE_INFINITY', () => {
        scene.lastBrickSfxAt = 1000;
        call(scene, 'resetState');
        expect(scene.lastBrickSfxAt).toBe(Number.NEGATIVE_INFINITY);
      });

      it('bulletTimeMeter resets to 0', () => {
        scene.bulletTimeMeter = GAME_CONFIG.BULLET_TIME_METER_MAX;
        call(scene, 'resetState');
        expect(scene.bulletTimeMeter).toBe(0);
      });

      it('bulletTimeActive resets to false', () => {
        // Belt-and-braces: if a scene restart happens mid-slow-mo, the
        // new session must not inherit the active flag or the first
        // frame reads `timeScale = BULLET_TIME_SCALE` and the ball
        // launches at 50% speed.
        scene.bulletTimeActive = true;
        call(scene, 'resetState');
        expect(scene.bulletTimeActive).toBe(false);
      });

      it('powerUpLegend array is emptied + hide timer nulled', () => {
        scene.powerUpLegend = [createMockText(), createMockText()];
        scene.powerUpLegendHideTimer = { remove: vi.fn() };
        call(scene, 'resetState');
        expect(scene.powerUpLegend).toEqual([]);
        expect(scene.powerUpLegendHideTimer).toBeUndefined();
      });
    });

    describe('Bullet-time B-key wiring', () => {
      it('handleBulletTime returns early when bulletTimeKey is unbound', () => {
        // Guards the `!this.bulletTimeKey` short-circuit. If a future
        // setupInput refactor removes the B-key addKey call, this
        // guard keeps the method NPE-safe instead of throwing on a
        // null `.bulletTimeKey` reference.
        scene.bulletTimeKey = null;
        (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
        expect(() => call(scene, 'handleBulletTime')).not.toThrow();
      });

      it('handleBulletTime no-ops when JustDown returns false', () => {
        // B-key must be JustDown, not isDown — holding B over multiple
        // frames must fire activation exactly once. This locks the
        // handleBulletTime → JustDown chain.
        scene.bulletTimeKey = { isDown: true };
        scene.bulletTimeMeter = GAME_CONFIG.BULLET_TIME_METER_MAX;
        (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(false);

        call(scene, 'handleBulletTime');

        expect(scene.bulletTimeActive).toBe(false);
        expect(scene.playSound).not.toHaveBeenCalledWith('specialAbility');
      });

      it('handleBulletTime activates on JustDown with full meter', () => {
        scene.bulletTimeKey = { isDown: true };
        scene.bulletTimeMeter = GAME_CONFIG.BULLET_TIME_METER_MAX;
        (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);

        call(scene, 'handleBulletTime');

        expect(scene.bulletTimeActive).toBe(true);
        expect(scene.bulletTimeMeter).toBe(0);
      });

      it('handleBulletTime refuses activation with empty meter (JustDown but not ready)', () => {
        // Tom's K6 brief: "fill meter, THEN press B to activate". A
        // refactor that drops the meter-full check would let the
        // player stack un-earned slow-mo bursts by spamming B.
        scene.bulletTimeKey = { isDown: true };
        scene.bulletTimeMeter = GAME_CONFIG.BULLET_TIME_METER_MAX - 1; // one shy
        (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);

        call(scene, 'handleBulletTime');

        expect(scene.bulletTimeActive).toBe(false);
      });
    });
  });
});
