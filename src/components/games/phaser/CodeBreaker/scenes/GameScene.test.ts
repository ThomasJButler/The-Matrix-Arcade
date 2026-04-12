import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { CodeBreakerGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS, BRICK_DEFS, POWERUP_DEFS } from '../config';

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
    addEvent: vi.fn().mockReturnValue({ destroy: vi.fn(), delay: 0 }),
    delayedCall: vi.fn().mockReturnValue({ destroy: vi.fn() }),
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
    image: vi.fn().mockImplementation(() => ({ destroy: vi.fn() })),
  };
  scene.make = {
    graphics: vi.fn().mockImplementation(() => createMockGraphics()),
  };
  scene.game = { config: { width: C.WIDTH, height: C.HEIGHT }, renderer: { type: 1 } };
  scene.scene = { restart: vi.fn(), start: vi.fn(), stop: vi.fn() };
  scene.scale = { width: C.WIDTH, height: C.HEIGHT };
  scene.events = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };
  scene.sys = { game: scene.game };
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
      expect(scene.playSound).toHaveBeenCalledWith('powerup');
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
      expect(scene.playSound).toHaveBeenCalledWith('powerup');
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
      call(scene, 'loadLevel', 3);
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
});
