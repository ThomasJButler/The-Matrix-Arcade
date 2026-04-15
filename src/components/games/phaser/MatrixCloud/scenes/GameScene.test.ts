import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { MatrixCloudGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS } from '../config';

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

    it('ground collision triggers handleCollision', () => {
      const handleCollision = vi.spyOn(scene, 'handleCollision');
      scene.playerY = C.HEIGHT - C.GROUND_HEIGHT;
      scene.playerVelocity = 100;
      call(scene, 'updatePlayer', 1 / 60);
      expect(handleCollision).toHaveBeenCalled();
    });
  });

  describe('Jump', () => {
    it('sets velocity to JUMP_VELOCITY', () => {
      call(scene, 'jump');
      expect(scene.playerVelocity).toBe(C.JUMP_VELOCITY);
    });

    it('plays jump sound', () => {
      call(scene, 'jump');
      expect(scene.playSound).toHaveBeenCalledWith('jump');
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
});
