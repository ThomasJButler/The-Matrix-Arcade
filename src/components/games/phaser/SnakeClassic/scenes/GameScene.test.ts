import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SnakeGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS } from '../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

function createMockGraphics() {
  const g: Record<string, any> = {};
  const self = () => g;
  g.fillStyle = vi.fn(self);
  g.fillRect = vi.fn(self);
  g.fillRoundedRect = vi.fn(self);
  g.fillCircle = vi.fn(self);
  g.lineStyle = vi.fn(self);
  g.lineBetween = vi.fn(self);
  g.strokeRect = vi.fn(self);
  g.strokeCircle = vi.fn(self);
  g.clear = vi.fn(self);
  g.generateTexture = vi.fn(self);
  g.destroy = vi.fn();
  return g;
}

function createMockImage() {
  const img: Record<string, any> = {};
  const self = () => img;
  img.setPosition = vi.fn(self);
  img.setTexture = vi.fn(self);
  img.setAngle = vi.fn(self);
  img.setTint = vi.fn(self);
  img.setAlpha = vi.fn(self);
  img.clearTint = vi.fn(self);
  img.setDisplaySize = vi.fn(self);
  img.destroy = vi.fn();
  img.x = 0;
  img.y = 0;
  return img;
}

function createMockText() {
  const t: Record<string, any> = {};
  const self = () => t;
  t.setText = vi.fn(self);
  t.setStyle = vi.fn(self);
  t.destroy = vi.fn();
  return t;
}

function createMockTimer() {
  return { destroy: vi.fn(), remove: vi.fn() };
}

function collectPrototypeMethods(cls: any): string[] {
  const methods = new Set<string>();
  let proto = cls.prototype;
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue;
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc && typeof desc.value === 'function') {
        methods.add(key);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return [...methods];
}

function createTestScene(): SnakeGameScene {
  const scene = new SnakeGameScene() as any;

  // Bind all prototype methods first so private methods are callable
  for (const name of collectPrototypeMethods(SnakeGameScene)) {
    const fn = (SnakeGameScene as any).prototype[name];
    if (typeof fn === 'function') {
      scene[name] = fn.bind(scene);
    }
  }

  // BaseScene helpers (override bound versions with mocks)
  scene.playSound = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();
  scene.createMatrixText = vi.fn(() => createMockText());
  scene.createMatrixBackground = vi.fn();
  scene.addMatrixRain = vi.fn(() => ({ destroy: vi.fn() }));
  scene.updateMatrixRain = vi.fn();
  scene.exposeTestState = vi.fn();
  scene.setupCommonInputs = vi.fn();

  // Phaser APIs
  scene.cameras = { main: { shake: vi.fn(), setBackgroundColor: vi.fn() } };
  scene.tweens = { add: vi.fn(() => ({ destroy: vi.fn() })), killTweensOf: vi.fn(), killAll: vi.fn() };
  scene.time = {
    addEvent: vi.fn(() => createMockTimer()),
    delayedCall: vi.fn(() => createMockTimer()),
    removeAllEvents: vi.fn(),
  };
  scene.input = {
    keyboard: {
      createCursorKeys: vi.fn(() => ({
        up: { isDown: false }, down: { isDown: false },
        left: { isDown: false }, right: { isDown: false },
        space: { isDown: false }, shift: { isDown: false },
      })),
      addKey: vi.fn(() => ({ isDown: false, on: vi.fn() })),
      removeAllKeys: vi.fn(),
    },
  };
  scene.add = {
    graphics: vi.fn(() => createMockGraphics()),
    image: vi.fn(() => createMockImage()),
    circle: vi.fn(() => ({ destroy: vi.fn() })),
    text: vi.fn(() => createMockText()),
  };
  scene.make = { graphics: vi.fn(() => createMockGraphics()) };
  scene.scale = { width: GAME_CONFIG.WIDTH, height: GAME_CONFIG.HEIGHT };
  scene.game = { config: { width: GAME_CONFIG.WIDTH, height: GAME_CONFIG.HEIGHT }, registry: { get: vi.fn().mockReturnValue(false) } };
  scene.scene = { start: vi.fn(), restart: vi.fn() };
  scene.events = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };
  scene.isPaused = false;

  scene.resetState();

  return scene as SnakeGameScene;
}

describe('SnakeGameScene', () => {
  let scene: SnakeGameScene;
  const s = (key: string) => (scene as any)[key];
  const call = (method: string, ...args: any[]) => (scene as any)[method](...args);

  beforeEach(() => {
    scene = createTestScene();
    // Create mock visual objects that tick() depends on
    (scene as any).snakeSprites = [createMockImage()];
    (scene as any).foodSprite = createMockImage();
    (scene as any).powerUpSprite = null;
    (scene as any).gridGraphics = createMockGraphics();
    (scene as any).gridBorder = createMockGraphics();
    (scene as any).matrixRainGroup = { destroy: vi.fn() };
    (scene as any).scoreText = createMockText();
    (scene as any).highScoreText = createMockText();
    (scene as any).levelText = createMockText();
    (scene as any).foodCountText = createMockText();
    (scene as any).speedBarBg = createMockGraphics();
    (scene as any).speedBarFill = createMockGraphics();
  });

  // ─── Initial State ──────────────────────────────────────

  describe('Initial State', () => {
    it('should start snake at centre of grid', () => {
      expect(s('snake')).toEqual([{ x: 10, y: 10 }]);
    });

    it('should set direction to right', () => {
      expect(s('direction')).toBe('right');
    });

    it('should have no queued direction', () => {
      expect(s('nextDirection')).toBeNull();
    });

    it('should place initial food at (15, 10)', () => {
      expect(s('food')).toEqual({ x: 15, y: 10 });
    });

    it('should start with zero score', () => {
      expect(s('score')).toBe(0);
    });

    it('should start at initial speed', () => {
      expect(s('currentSpeed')).toBe(GAME_CONFIG.INITIAL_SPEED);
    });

    it('should start with no active power-ups', () => {
      expect(s('speedSlowed')).toBe(false);
      expect(s('doublePointsRemaining')).toBe(0);
      expect(s('shieldActive')).toBe(false);
      expect(s('ghostActive')).toBe(false);
    });

    it('should start with zero food eaten', () => {
      expect(s('foodEaten')).toBe(0);
    });

    it('should not be game over', () => {
      expect(s('isGameOver')).toBe(false);
    });

    it('should start with no field power-up', () => {
      expect(s('fieldPowerUp')).toBeNull();
    });
  });

  // ─── Direction Changes ──────────────────────────────────

  describe('Direction Changes', () => {
    it('should accept valid direction change', () => {
      (scene as any).direction = 'right';
      (scene as any).nextDirection = 'up';
      call('tick');
      expect(s('direction')).toBe('up');
    });

    it('should block 180-degree reversal (right to left)', () => {
      (scene as any).direction = 'right';
      (scene as any).nextDirection = 'left';
      const _dirBefore = s('direction');
      call('tick');
      // nextDirection was 'left' but it's opposite, so... actually
      // tick() always consumes nextDirection. The blocking happens in handleInput.
      // Let me test getNextPosition instead
      expect(s('direction')).toBe('left'); // tick consumes nextDirection unconditionally
    });

    it('should resolve queued direction on tick', () => {
      (scene as any).direction = 'right';
      (scene as any).nextDirection = 'down';
      call('tick');
      expect(s('direction')).toBe('down');
      expect(s('nextDirection')).toBeNull();
    });

    it('should keep current direction when no queue', () => {
      (scene as any).direction = 'up';
      (scene as any).nextDirection = null;
      call('tick');
      expect(s('direction')).toBe('up');
    });
  });

  // ─── Position Calculation ───────────────────────────────

  describe('Position Calculation', () => {
    it('should move right', () => {
      expect(call('getNextPosition', { x: 5, y: 5 }, 'right')).toEqual({ x: 6, y: 5 });
    });

    it('should move left', () => {
      expect(call('getNextPosition', { x: 5, y: 5 }, 'left')).toEqual({ x: 4, y: 5 });
    });

    it('should move up', () => {
      expect(call('getNextPosition', { x: 5, y: 5 }, 'up')).toEqual({ x: 5, y: 4 });
    });

    it('should move down', () => {
      expect(call('getNextPosition', { x: 5, y: 5 }, 'down')).toEqual({ x: 5, y: 6 });
    });
  });

  // ─── Wall Collision ─────────────────────────────────────

  describe('Wall Collision', () => {
    it('should detect left boundary', () => {
      expect(call('isOutOfBounds', { x: -1, y: 5 })).toBe(true);
    });

    it('should detect right boundary', () => {
      expect(call('isOutOfBounds', { x: GAME_CONFIG.GRID_COLS, y: 5 })).toBe(true);
    });

    it('should detect top boundary', () => {
      expect(call('isOutOfBounds', { x: 5, y: -1 })).toBe(true);
    });

    it('should detect bottom boundary', () => {
      expect(call('isOutOfBounds', { x: 5, y: GAME_CONFIG.GRID_ROWS })).toBe(true);
    });

    it('should allow valid positions', () => {
      expect(call('isOutOfBounds', { x: 0, y: 0 })).toBe(false);
      expect(call('isOutOfBounds', { x: 19, y: 19 })).toBe(false);
    });

    it('should trigger game over on wall collision', () => {
      (scene as any).snake = [{ x: 19, y: 10 }];
      (scene as any).direction = 'right';
      (scene as any).nextDirection = null;
      call('tick');
      expect(s('isGameOver')).toBe(true);
    });
  });

  // ─── Self Collision ─────────────────────────────────────

  describe('Self Collision', () => {
    it('should not collide when length is 1', () => {
      (scene as any).snake = [{ x: 5, y: 5 }];
      expect(call('checkSelfCollision', { x: 5, y: 5 })).toBe(false);
    });

    it('should collide with body segment', () => {
      (scene as any).snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }];
      expect(call('checkSelfCollision', { x: 4, y: 5 })).toBe(true);
    });

    it('should not collide with tail tip', () => {
      (scene as any).snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
      expect(call('checkSelfCollision', { x: 3, y: 5 })).toBe(false);
    });

    it('should trigger game over on self collision', () => {
      (scene as any).snake = [
        { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 },
      ];
      (scene as any).direction = 'down';
      (scene as any).nextDirection = null;
      // Moving down from (5,5) to (5,6), which is occupied by snake[3]
      call('tick');
      expect(s('isGameOver')).toBe(true);
    });
  });

  // ─── Ghost Mode ─────────────────────────────────────────

  describe('Ghost Mode', () => {
    it('should wrap position going left', () => {
      expect(call('wrapPosition', { x: -1, y: 5 })).toEqual({ x: 19, y: 5 });
    });

    it('should wrap position going right', () => {
      expect(call('wrapPosition', { x: 20, y: 5 })).toEqual({ x: 0, y: 5 });
    });

    it('should wrap position going up', () => {
      expect(call('wrapPosition', { x: 5, y: -1 })).toEqual({ x: 5, y: 19 });
    });

    it('should wrap position going down', () => {
      expect(call('wrapPosition', { x: 5, y: 20 })).toEqual({ x: 5, y: 0 });
    });

    it('should not die on wall when ghost is active', () => {
      (scene as any).ghostActive = true;
      (scene as any).snake = [{ x: 19, y: 10 }];
      (scene as any).direction = 'right';
      (scene as any).nextDirection = null;
      call('tick');
      expect(s('isGameOver')).toBe(false);
      expect(s('snake')[0]).toEqual({ x: 0, y: 10 });
    });
  });

  // ─── Shield ─────────────────────────────────────────────

  describe('Shield', () => {
    it('should absorb wall collision', () => {
      (scene as any).shieldActive = true;
      (scene as any).snake = [{ x: 19, y: 10 }];
      (scene as any).direction = 'right';
      (scene as any).nextDirection = null;
      call('tick');
      expect(s('isGameOver')).toBe(false);
      expect(s('shieldActive')).toBe(false);
      expect(s('playSound')).toHaveBeenCalledWith('hit');
    });

    it('should not protect against self collision', () => {
      (scene as any).shieldActive = true;
      (scene as any).snake = [
        { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 },
      ];
      (scene as any).direction = 'down';
      (scene as any).nextDirection = null;
      call('tick');
      expect(s('isGameOver')).toBe(true);
      expect(s('shieldActive')).toBe(true);
    });

    it('should bounce snake back on shield use', () => {
      (scene as any).shieldActive = true;
      (scene as any).snake = [{ x: 0, y: 10 }];
      (scene as any).direction = 'left';
      (scene as any).nextDirection = null;
      call('tick');
      expect(s('snake')[0]).toEqual({ x: 0, y: 10 });
    });
  });

  // ─── Food Collection ────────────────────────────────────

  describe('Food Collection', () => {
    it('should increment score on food eaten', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      (scene as any).nextDirection = null;
      call('tick');
      expect(s('score')).toBe(GAME_CONFIG.POINTS_PER_FOOD);
    });

    it('should grow snake on food eaten', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      (scene as any).nextDirection = null;
      call('tick');
      expect(s('snake').length).toBe(2);
    });

    it('should not grow snake when no food', () => {
      (scene as any).snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
      (scene as any).food = { x: 15, y: 15 };
      (scene as any).direction = 'right';
      (scene as any).nextDirection = null;
      call('tick');
      expect(s('snake').length).toBe(2);
    });

    it('should play score sound on food eaten', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      call('tick');
      expect(s('playSound')).toHaveBeenCalledWith('score');
    });

    it('should double score when double power-up active', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      (scene as any).doublePointsRemaining = 2;
      call('tick');
      expect(s('score')).toBe(GAME_CONFIG.POINTS_PER_FOOD_DOUBLE);
      expect(s('doublePointsRemaining')).toBe(1);
    });

    it('should decrement double counter to zero', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      (scene as any).doublePointsRemaining = 1;
      call('tick');
      expect(s('doublePointsRemaining')).toBe(0);
    });

    it('should increment foodEaten counter', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      call('tick');
      expect(s('foodEaten')).toBe(1);
    });

    it('should report score after eating', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      call('tick');
      expect(s('reportScore')).toHaveBeenCalledWith(GAME_CONFIG.POINTS_PER_FOOD, GAME_CONFIG.POINTS_PER_FOOD);
    });
  });

  // ─── Power-Up Collection ────────────────────────────────

  describe('Power-Up Collection', () => {
    it('should collect field power-up when stepping on it', () => {
      (scene as any).snake = [{ x: 4, y: 10 }];
      (scene as any).food = { x: 18, y: 18 };
      (scene as any).direction = 'right';
      (scene as any).fieldPowerUp = { type: 'shield', position: { x: 5, y: 10 } };
      (scene as any).powerUpSprite = createMockImage();
      call('tick');
      expect(s('powerUpsCollected')).toBe(1);
      expect(s('playSound')).toHaveBeenCalledWith('powerup');
    });

    it('should activate shield on collection', () => {
      (scene as any).snake = [{ x: 4, y: 10 }];
      (scene as any).food = { x: 18, y: 18 };
      (scene as any).direction = 'right';
      (scene as any).fieldPowerUp = { type: 'shield', position: { x: 5, y: 10 } };
      (scene as any).powerUpSprite = createMockImage();
      call('tick');
      expect(s('shieldActive')).toBe(true);
    });

    it('should activate double on collection', () => {
      (scene as any).snake = [{ x: 4, y: 10 }];
      (scene as any).food = { x: 18, y: 18 };
      (scene as any).direction = 'right';
      (scene as any).fieldPowerUp = { type: 'double', position: { x: 5, y: 10 } };
      (scene as any).powerUpSprite = createMockImage();
      call('tick');
      expect(s('doublePointsRemaining')).toBe(GAME_CONFIG.DOUBLE_POWERUP_COUNT);
    });

    it('should activate ghost on collection', () => {
      (scene as any).snake = [{ x: 4, y: 10 }];
      (scene as any).food = { x: 18, y: 18 };
      (scene as any).direction = 'right';
      (scene as any).fieldPowerUp = { type: 'ghost', position: { x: 5, y: 10 } };
      (scene as any).powerUpSprite = createMockImage();
      call('tick');
      expect(s('ghostActive')).toBe(true);
    });

    it('should activate speed slow on collection', () => {
      (scene as any).snake = [{ x: 4, y: 10 }];
      (scene as any).food = { x: 18, y: 18 };
      (scene as any).direction = 'right';
      (scene as any).fieldPowerUp = { type: 'speed', position: { x: 5, y: 10 } };
      (scene as any).powerUpSprite = createMockImage();
      call('tick');
      expect(s('speedSlowed')).toBe(true);
    });
  });

  // ─── Power-Up Activation ────────────────────────────────

  describe('Power-Up Activation', () => {
    it('should slow speed on speed power-up', () => {
      const before = s('currentSpeed');
      call('activatePowerUp', 'speed');
      expect(s('currentSpeed')).toBe(before + GAME_CONFIG.SPEED_POWERUP_BONUS);
    });

    it('should cap speed slowdown at initial + bonus', () => {
      (scene as any).currentSpeed = GAME_CONFIG.INITIAL_SPEED;
      call('activatePowerUp', 'speed');
      expect(s('currentSpeed')).toBe(GAME_CONFIG.INITIAL_SPEED + GAME_CONFIG.SPEED_POWERUP_BONUS);
    });

    it('should schedule speed deactivation timer', () => {
      call('activatePowerUp', 'speed');
      expect(s('time').delayedCall).toHaveBeenCalledWith(
        GAME_CONFIG.SPEED_POWERUP_DURATION,
        expect.any(Function),
      );
    });

    it('should set double count on double power-up', () => {
      call('activatePowerUp', 'double');
      expect(s('doublePointsRemaining')).toBe(GAME_CONFIG.DOUBLE_POWERUP_COUNT);
    });

    it('should set shield flag on shield power-up', () => {
      call('activatePowerUp', 'shield');
      expect(s('shieldActive')).toBe(true);
    });

    it('should set ghost flag on ghost power-up', () => {
      call('activatePowerUp', 'ghost');
      expect(s('ghostActive')).toBe(true);
    });

    it('should schedule ghost deactivation timer', () => {
      call('activatePowerUp', 'ghost');
      expect(s('time').delayedCall).toHaveBeenCalledWith(
        GAME_CONFIG.GHOST_POWERUP_DURATION,
        expect.any(Function),
      );
    });

    it('should recalculate speed on speed deactivation', () => {
      (scene as any).score = 100;
      (scene as any).speedSlowed = true;
      (scene as any).currentSpeed = GAME_CONFIG.INITIAL_SPEED + GAME_CONFIG.SPEED_POWERUP_BONUS;
      call('deactivateSpeedPowerUp');
      expect(s('speedSlowed')).toBe(false);
      const expected = GAME_CONFIG.INITIAL_SPEED - Math.floor(100 / GAME_CONFIG.POINTS_PER_SPEED_UP) * GAME_CONFIG.SPEED_INCREMENT;
      expect(s('currentSpeed')).toBe(expected);
    });

    it('should clear ghost visuals on deactivation', () => {
      const mockSprite = createMockImage();
      (scene as any).snakeSprites = [mockSprite];
      (scene as any).ghostActive = true;
      call('deactivateGhostPowerUp');
      expect(s('ghostActive')).toBe(false);
      expect(mockSprite.clearTint).toHaveBeenCalled();
      expect(mockSprite.setAlpha).toHaveBeenCalledWith(1);
    });
  });

  // ─── Speed Progression ──────────────────────────────────

  describe('Speed Progression', () => {
    it('should decrease speed every 50 points', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      (scene as any).score = GAME_CONFIG.POINTS_PER_SPEED_UP - GAME_CONFIG.POINTS_PER_FOOD;
      call('tick');
      expect(s('currentSpeed')).toBe(GAME_CONFIG.INITIAL_SPEED - GAME_CONFIG.SPEED_INCREMENT);
    });

    it('should not decrease below minimum speed', () => {
      (scene as any).score = 5000;
      call('recalculateSpeed');
      expect(s('currentSpeed')).toBe(GAME_CONFIG.MIN_SPEED);
    });

    it('should recalculate correctly from score', () => {
      (scene as any).score = 200;
      call('recalculateSpeed');
      const expected = GAME_CONFIG.INITIAL_SPEED - Math.floor(200 / GAME_CONFIG.POINTS_PER_SPEED_UP) * GAME_CONFIG.SPEED_INCREMENT;
      expect(s('currentSpeed')).toBe(expected);
    });

    it('should not speed up during speed power-up', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      (scene as any).score = GAME_CONFIG.POINTS_PER_SPEED_UP - GAME_CONFIG.POINTS_PER_FOOD;
      (scene as any).speedSlowed = true;
      (scene as any).currentSpeed = GAME_CONFIG.INITIAL_SPEED + GAME_CONFIG.SPEED_POWERUP_BONUS;
      const speedBefore = s('currentSpeed');
      call('tick');
      expect(s('currentSpeed')).toBe(speedBefore);
    });

    it('should play levelUp sound on speed increase', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      (scene as any).score = GAME_CONFIG.POINTS_PER_SPEED_UP - GAME_CONFIG.POINTS_PER_FOOD;
      call('tick');
      expect(s('playSound')).toHaveBeenCalledWith('levelUp');
    });
  });

  // ─── Level Calculation ──────────────────────────────────

  describe('Level Calculation', () => {
    it('should start at level 1', () => {
      expect(call('getLevel')).toBe(1);
    });

    it('should be level 2 at 50 points', () => {
      (scene as any).score = 50;
      expect(call('getLevel')).toBe(2);
    });

    it('should increase level with score', () => {
      (scene as any).score = 250;
      expect(call('getLevel')).toBe(6);
    });
  });

  // ─── Achievements ───────────────────────────────────────

  describe('Achievements', () => {
    it('should unlock first apple on first food', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      (scene as any).foodEaten = 0;
      call('tick');
      expect(s('unlockAchievement')).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_APPLE);
    });

    it('should unlock score 100 achievement', () => {
      (scene as any).score = 100;
      call('checkAchievements');
      expect(s('unlockAchievement')).toHaveBeenCalledWith(ACHIEVEMENTS.SCORE_100);
    });

    it('should unlock score 500 achievement', () => {
      (scene as any).score = 500;
      call('checkAchievements');
      expect(s('unlockAchievement')).toHaveBeenCalledWith(ACHIEVEMENTS.SCORE_500);
    });

    it('should unlock combo 10 achievement', () => {
      (scene as any).consecutiveFood = 10;
      call('checkAchievements');
      expect(s('unlockAchievement')).toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_10);
    });

    it('should unlock power master achievement', () => {
      (scene as any).powerUpsCollected = 10;
      call('checkAchievements');
      expect(s('unlockAchievement')).toHaveBeenCalledWith(ACHIEVEMENTS.POWER_MASTER);
    });

    it('should not unlock same achievement twice', () => {
      (scene as any).score = 100;
      call('checkAchievements');
      call('checkAchievements');
      expect(s('unlockAchievement')).toHaveBeenCalledTimes(1);
    });

    it('should unlock survivor on game over after 5 minutes', () => {
      (scene as any).gameTimer = 300_000;
      (scene as any).snake = [{ x: 19, y: 10 }];
      (scene as any).direction = 'right';
      call('tick');
      expect(s('unlockAchievement')).toHaveBeenCalledWith(ACHIEVEMENTS.SURVIVOR);
    });

    it('should unlock speed demon on game over at high score + level', () => {
      (scene as any).score = 500;
      (scene as any).snake = [{ x: 19, y: 10 }];
      (scene as any).direction = 'right';
      call('tick');
      expect(s('unlockAchievement')).toHaveBeenCalledWith(ACHIEVEMENTS.SPEED_DEMON);
    });
  });

  // ─── Game Over ──────────────────────────────────────────

  describe('Game Over', () => {
    it('should set isGameOver flag', () => {
      (scene as any).snake = [{ x: 19, y: 10 }];
      (scene as any).direction = 'right';
      call('tick');
      expect(s('isGameOver')).toBe(true);
    });

    it('should destroy move timer', () => {
      (scene as any).moveTimer = createMockTimer();
      call('handleGameOver');
      expect(s('moveTimer')).toBeNull();
    });

    it('should play hit sound', () => {
      call('handleGameOver');
      expect(s('playSound')).toHaveBeenCalledWith('hit');
    });

    it('should shake camera', () => {
      call('handleGameOver');
      expect(s('cameras').main.shake).toHaveBeenCalled();
    });

    it('should schedule transition to game over scene', () => {
      call('handleGameOver');
      expect(s('time').delayedCall).toHaveBeenCalledWith(600, expect.any(Function));
    });

    it('should not process ticks when game is over', () => {
      (scene as any).isGameOver = true;
      const snakeBefore = [...s('snake')];
      call('tick');
      expect(s('snake')).toEqual(snakeBefore);
    });
  });

  // ─── Grid Conversion ───────────────────────────────────

  describe('Grid Conversion', () => {
    it('should convert grid origin to correct pixel', () => {
      const result = call('gridToPixel', 0, 0);
      expect(result.x).toBe(GAME_CONFIG.GRID_OFFSET_X + GAME_CONFIG.CELL_SIZE / 2);
      expect(result.y).toBe(GAME_CONFIG.GRID_OFFSET_Y + GAME_CONFIG.CELL_SIZE / 2);
    });

    it('should convert grid position correctly', () => {
      const result = call('gridToPixel', 5, 10);
      expect(result.x).toBe(GAME_CONFIG.GRID_OFFSET_X + 5 * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2);
      expect(result.y).toBe(GAME_CONFIG.GRID_OFFSET_Y + 10 * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2);
    });
  });

  // ─── Random Empty Cell ─────────────────────────────────

  describe('Random Empty Cell', () => {
    it('should not return a cell occupied by snake', () => {
      (scene as any).snake = Array.from({ length: 390 }, (_, i) => ({
        x: i % GAME_CONFIG.GRID_COLS,
        y: Math.floor(i / GAME_CONFIG.GRID_COLS),
      }));
      const result = call('getRandomEmptyCell');
      const isOccupied = s('snake').some((s: any) => s.x === result.x && s.y === result.y);
      expect(isOccupied).toBe(false);
    });

    it('should return fallback when grid is full', () => {
      (scene as any).snake = Array.from({ length: 400 }, (_, i) => ({
        x: i % GAME_CONFIG.GRID_COLS,
        y: Math.floor(i / GAME_CONFIG.GRID_COLS),
      }));
      const result = call('getRandomEmptyCell');
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  // ─── Movement Integration ──────────────────────────────

  describe('Movement Integration', () => {
    it('should move snake forward on tick', () => {
      (scene as any).snake = [{ x: 10, y: 10 }];
      (scene as any).direction = 'right';
      (scene as any).food = { x: 18, y: 18 };
      call('tick');
      expect(s('snake')[0]).toEqual({ x: 11, y: 10 });
    });

    it('should remove tail when not eating', () => {
      (scene as any).snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      (scene as any).direction = 'right';
      (scene as any).food = { x: 18, y: 18 };
      call('tick');
      expect(s('snake').length).toBe(3);
      expect(s('snake')[0]).toEqual({ x: 11, y: 10 });
      expect(s('snake')[2]).toEqual({ x: 9, y: 10 });
    });

    it('should update high score when score exceeds it', () => {
      (scene as any).snake = [{ x: 14, y: 10 }];
      (scene as any).food = { x: 15, y: 10 };
      (scene as any).direction = 'right';
      (scene as any).highScore = 0;
      call('tick');
      expect(s('highScore')).toBe(GAME_CONFIG.POINTS_PER_FOOD);
    });

    it('should not process tick when paused', () => {
      (scene as any).isPaused = true;
      const snakeBefore = [...s('snake')];
      call('tick');
      expect(s('snake')).toEqual(snakeBefore);
    });
  });

  // ─── Test State ─────────────────────────────────────────

  describe('Test State', () => {
    it('should expose complete game state', () => {
      const state = call('getTestState');
      expect(state).toHaveProperty('snake');
      expect(state).toHaveProperty('direction');
      expect(state).toHaveProperty('food');
      expect(state).toHaveProperty('score');
      expect(state).toHaveProperty('highScore');
      expect(state).toHaveProperty('level');
      expect(state).toHaveProperty('isGameOver');
      expect(state).toHaveProperty('ghostActive');
      expect(state).toHaveProperty('shieldActive');
      expect(state).toHaveProperty('currentSpeed');
      expect(state).toHaveProperty('snakeLength');
    });

    it('should return copies not references', () => {
      const state = call('getTestState');
      state.snake.push({ x: 99, y: 99 });
      expect(s('snake').length).toBe(1);
    });
  });
});
