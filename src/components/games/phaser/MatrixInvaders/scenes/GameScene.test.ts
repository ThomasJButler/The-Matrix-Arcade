import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { MatrixInvadersGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS, POWERUP_DEFS, POWERUP_LEGEND, ROW_TINTS } from '../config';

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
    x: 0,
    y: 0,
    visible: true,
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    fillRoundedRect: vi.fn().mockReturnThis(),
    fillTriangle: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    lineBetween: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    strokeRoundedRect: vi.fn().mockReturnThis(),
    strokeCircle: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setPosition: vi.fn(function (this: Record<string, unknown>, px: number, py: number) { this.x = px; this.y = py; return this; }),
    setVisible: vi.fn(function (this: Record<string, unknown>, v: boolean) { this.visible = v; return this; }),
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
    setX: vi.fn(function (this: Record<string, unknown>, v: number) { this.x = v; return this; }),
    setY: vi.fn(function (this: Record<string, unknown>, v: number) { this.y = v; return this; }),
    setPosition: vi.fn(function (this: Record<string, unknown>, px: number, py: number) { this.x = px; this.y = py; return this; }),
    setAlpha: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
    setVisible: vi.fn(function (this: Record<string, unknown>, v: boolean) { this.visible = v; return this; }),
    setScale: vi.fn().mockReturnThis(),
    setTint: vi.fn().mockReturnThis(),
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
    destroy: vi.fn(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTestScene(): any {
  const scene = new MatrixInvadersGameScene();

  for (const name of collectPrototypeMethods(MatrixInvadersGameScene)) {
    const fn = MatrixInvadersGameScene.prototype[name as keyof typeof MatrixInvadersGameScene.prototype];
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
    // R85.I6: each delayedCall returns a fresh TimerEvent-like mock that
    // captures the callback + delay so tests can fire the timer directly and
    // assert its arguments. `remove` is included so clearPowerUpLegend's
    // `timer.remove(false)` path is exercised rather than throwing.
    delayedCall: vi.fn().mockImplementation((delay: number, callback: () => void) => ({
      destroy: vi.fn(),
      remove: vi.fn(),
      callback,
      delay,
    })),
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
    activePointer: { isDown: false },
  };
  scene.add = {
    graphics: vi.fn().mockImplementation(() => createMockGraphics()),
    rectangle: vi.fn().mockImplementation((x: number, y: number, w: number, h: number) => createMockRect(x, y, w, h)),
    sprite: vi.fn().mockImplementation((x: number, y: number) => createMockSprite(x, y)),
    text: vi.fn().mockImplementation(() => createMockText()),
    circle: vi.fn().mockImplementation(() => ({ destroy: vi.fn() })),
    image: vi.fn().mockImplementation((x: number, y: number) => {
      const img: Record<string, unknown> = {
        x: x ?? 0,
        y: y ?? 0,
        displayWidth: 10,
        displayHeight: 10,
        setDisplaySize: vi.fn(function (this: Record<string, unknown>, w: number, h: number) {
          this.displayWidth = w;
          this.displayHeight = h;
          return this;
        }),
        setDepth: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setAngle: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      };
      return img;
    }),
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

describe('MatrixInvadersGameScene', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let scene: any;

  beforeEach(() => {
    scene = createTestScene();

    scene.player = createMockSprite(C.WIDTH / 2, C.HEIGHT - C.PLAYER_Y_OFFSET);
    scene.scoreText = createMockText();
    scene.waveText = createMockText();
    scene.comboText = createMockText();
    scene.highScoreText = createMockText();
    scene.healthLabel = createMockText();
    scene.healthBarBg = createMockGraphics();
    scene.healthBarFill = createMockGraphics();
    scene.bulletTimeText = createMockText();
    scene.bulletTimeLabel = createMockText();
    scene.bulletTimeChargeBg = createMockGraphics();
    scene.bulletTimeChargeFill = createMockGraphics();
    scene.bulletTimeReadyPulse = createMockText();
    scene.waveCompleteText = createMockText();
    scene.bossWarningText = { ...createMockText(), visible: false };
    scene.matrixRainGroup = { getChildren: () => [] };
    // R85.I4: shieldAura is created by createPlayer() in production; in tests
    // we inject a mock Graphics directly so handler unit tests don't need the
    // full create() lifecycle. Must carry x/y/visible state to survive round
    // trips through updateShieldAura().
    scene.shieldAura = createMockGraphics();

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

    it('starts with wave 1', () => {
      expect(s(scene, 'wave')).toBe(1);
    });

    it('starts with combo 0', () => {
      expect(s(scene, 'combo')).toBe(0);
    });

    it('starts with full health', () => {
      expect(s(scene, 'playerHealth')).toBe(C.PLAYER_MAX_HEALTH);
    });

    it('starts with no invulnerability', () => {
      expect(s(scene, 'isInvulnerable')).toBe(false);
    });

    it('starts with no shield', () => {
      expect(s(scene, 'shieldActive')).toBe(false);
    });

    it('starts with bullet time inactive', () => {
      expect(s(scene, 'bulletTimeActive')).toBe(false);
    });

    it('starts with bullet-time charge full', () => {
      expect(s(scene, 'bulletTimeCharge')).toBe(1);
    });

    it('starts with bullet-time ready-latch armed', () => {
      // `wasReady` guards the pulse edge — initially true so no pulse on spawn.
      expect(s(scene, 'bulletTimeWasReady')).toBe(true);
    });

    it('starts with 0 enemies killed', () => {
      expect(s(scene, 'enemiesKilled')).toBe(0);
    });

    it('starts with empty enemy array', () => {
      expect(s(scene, 'enemies')).toHaveLength(0);
    });

    it('starts with no bullets', () => {
      expect(s(scene, 'playerBullets')).toHaveLength(0);
      expect(s(scene, 'enemyBullets')).toHaveLength(0);
    });

    it('starts not transitioning', () => {
      expect(s(scene, 'waveTransitioning')).toBe(false);
    });

    it('starts not game over', () => {
      expect(s(scene, 'isGameOver')).toBe(false);
    });
  });

  describe('Player Movement', () => {
    it('moves left when left arrow pressed', () => {
      scene.cursors.left.isDown = true;
      const startX = scene.player.x;
      call(scene, 'handleMovement', 1 / 60);
      expect(scene.player.x).toBeLessThan(startX);
    });

    it('moves right when right arrow pressed', () => {
      scene.cursors.right.isDown = true;
      const startX = scene.player.x;
      call(scene, 'handleMovement', 1 / 60);
      expect(scene.player.x).toBeGreaterThan(startX);
    });

    it('moves left with A key', () => {
      scene.wasdA.isDown = true;
      const startX = scene.player.x;
      call(scene, 'handleMovement', 1 / 60);
      expect(scene.player.x).toBeLessThan(startX);
    });

    it('moves right with D key', () => {
      scene.wasdD.isDown = true;
      const startX = scene.player.x;
      call(scene, 'handleMovement', 1 / 60);
      expect(scene.player.x).toBeGreaterThan(startX);
    });

    it('clamps player to left boundary', () => {
      scene.player.x = 5;
      scene.cursors.left.isDown = true;
      call(scene, 'handleMovement', 1);
      expect(scene.player.x).toBe(C.PLAYER_WIDTH / 2);
    });

    it('clamps player to right boundary', () => {
      scene.player.x = C.WIDTH - 5;
      scene.cursors.right.isDown = true;
      call(scene, 'handleMovement', 1);
      expect(scene.player.x).toBe(C.WIDTH - C.PLAYER_WIDTH / 2);
    });

    it('does not move when no keys pressed', () => {
      const startX = scene.player.x;
      call(scene, 'handleMovement', 1 / 60);
      expect(scene.player.x).toBe(startX);
    });
  });

  describe('Player Shooting', () => {
    it('creates bullet when space is pressed', () => {
      scene.spaceKey.isDown = true;
      call(scene, 'handleShooting', 1000);
      expect(s(scene, 'playerBullets')).toHaveLength(1);
    });

    it('plays shoot sound', () => {
      scene.spaceKey.isDown = true;
      call(scene, 'handleShooting', 1000);
      expect(scene.playSound).toHaveBeenCalledWith('shoot');
    });

    it('respects fire cooldown', () => {
      scene.spaceKey.isDown = true;
      call(scene, 'handleShooting', 1000);
      call(scene, 'handleShooting', 1100);
      expect(s(scene, 'playerBullets')).toHaveLength(1);
    });

    it('fires again after cooldown expires', () => {
      scene.spaceKey.isDown = true;
      call(scene, 'handleShooting', 1000);
      call(scene, 'handleShooting', 1000 + C.FIRE_COOLDOWN);
      expect(s(scene, 'playerBullets')).toHaveLength(2);
    });

    it('does not fire when space is not pressed', () => {
      call(scene, 'handleShooting', 1000);
      expect(s(scene, 'playerBullets')).toHaveLength(0);
    });

    it('bullet has upward velocity', () => {
      scene.spaceKey.isDown = true;
      call(scene, 'handleShooting', 1000);
      expect(s(scene, 'playerBullets')[0].vy).toBe(-C.PLAYER_BULLET_SPEED);
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

    it('does not activate twice', () => {
      scene.bulletTimeActive = true;
      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      scene.bulletTimeKey = { isDown: true };
      call(scene, 'handleBulletTime');
      expect(s(scene, 'bulletTimeUses')).toBe(0);
    });

    it('schedules deactivation', () => {
      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      scene.bulletTimeKey = { isDown: true };
      call(scene, 'handleBulletTime');
      expect(scene.time.delayedCall).toHaveBeenCalledWith(C.BULLET_TIME_DURATION, expect.any(Function));
    });

    // R85.I2 — charge gate, drain, refill, READY pulse edge.
    it('refuses activation while charge is below full', () => {
      scene.bulletTimeCharge = 0.5;
      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      scene.bulletTimeKey = { isDown: true };
      call(scene, 'handleBulletTime');
      expect(s(scene, 'bulletTimeActive')).toBe(false);
      expect(s(scene, 'bulletTimeUses')).toBe(0);
    });

    it('arms the ready-latch (wasReady→false) on activation so the next refill can pulse', () => {
      (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(true);
      scene.bulletTimeKey = { isDown: true };
      call(scene, 'handleBulletTime');
      expect(s(scene, 'bulletTimeWasReady')).toBe(false);
    });

    it('drains charge during active at 1 / BULLET_TIME_DURATION per ms', () => {
      scene.bulletTimeActive = true;
      scene.bulletTimeCharge = 1;
      call(scene, 'updateBulletTimeCharge', C.BULLET_TIME_DURATION / 2);
      expect(s(scene, 'bulletTimeCharge')).toBeCloseTo(0.5, 5);
    });

    it('drain clamps at 0', () => {
      scene.bulletTimeActive = true;
      scene.bulletTimeCharge = 0.1;
      call(scene, 'updateBulletTimeCharge', C.BULLET_TIME_DURATION);
      expect(s(scene, 'bulletTimeCharge')).toBe(0);
    });

    it('refills charge while inactive at 1 / BULLET_TIME_COOLDOWN per ms', () => {
      scene.bulletTimeActive = false;
      scene.bulletTimeCharge = 0;
      scene.bulletTimeWasReady = false;
      call(scene, 'updateBulletTimeCharge', C.BULLET_TIME_COOLDOWN / 4);
      expect(s(scene, 'bulletTimeCharge')).toBeCloseTo(0.25, 5);
    });

    it('refill clamps at 1 and fires READY pulse exactly once on the edge', () => {
      scene.bulletTimeActive = false;
      scene.bulletTimeCharge = 0.95;
      scene.bulletTimeWasReady = false;
      call(scene, 'updateBulletTimeCharge', C.BULLET_TIME_COOLDOWN); // overshoot
      expect(s(scene, 'bulletTimeCharge')).toBe(1);
      expect(s(scene, 'bulletTimeWasReady')).toBe(true);
      expect(scene.tweens.add).toHaveBeenCalledTimes(1);

      // Subsequent ticks at full charge must not re-trigger the pulse.
      call(scene, 'updateBulletTimeCharge', 16);
      expect(scene.tweens.add).toHaveBeenCalledTimes(1);
    });

    it('skips pulse when already ready (no edge to trigger on)', () => {
      scene.bulletTimeActive = false;
      scene.bulletTimeCharge = 1;
      scene.bulletTimeWasReady = true;
      call(scene, 'updateBulletTimeCharge', 100);
      expect(scene.tweens.add).not.toHaveBeenCalled();
    });
  });

  describe('Bullet Updates', () => {
    it('moves player bullets upward', () => {
      scene.playerBullets = [{ sprite: createMockRect(400, 200), vy: -C.PLAYER_BULLET_SPEED, damage: 1, isPlayer: true }];
      call(scene, 'updatePlayerBullets', 1 / 60);
      expect(scene.playerBullets[0].sprite.y).toBeLessThan(200);
    });

    it('removes off-screen player bullets', () => {
      scene.playerBullets = [{ sprite: createMockRect(400, -5), vy: -C.PLAYER_BULLET_SPEED, damage: 1, isPlayer: true }];
      call(scene, 'updatePlayerBullets', 1 / 60);
      expect(scene.playerBullets).toHaveLength(0);
    });

    it('moves enemy bullets downward', () => {
      scene.enemyBullets = [{ sprite: createMockRect(400, 200, 3, 6), vy: C.ENEMY_BULLET_SPEED, damage: 5, isPlayer: false }];
      call(scene, 'updateEnemyBullets', 1 / 60);
      expect(scene.enemyBullets[0].sprite.y).toBeGreaterThan(200);
    });

    it('removes off-screen enemy bullets', () => {
      scene.enemyBullets = [{ sprite: createMockRect(400, C.HEIGHT + 15, 3, 6), vy: C.ENEMY_BULLET_SPEED, damage: 5, isPlayer: false }];
      call(scene, 'updateEnemyBullets', 1 / 60);
      expect(scene.enemyBullets).toHaveLength(0);
    });
  });

  describe('Enemy Movement', () => {
    it('moves enemies horizontally', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      call(scene, 'updateEnemies', 1 / 60);
      expect(sprite.x).not.toBe(200);
    });

    it('reverses direction on wall hit', () => {
      const sprite = createMockSprite(C.WIDTH - 10, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      scene.enemyDirection = 1;
      call(scene, 'updateEnemies', 0.5);
      expect(s(scene, 'enemyDirection')).toBe(-1);
    });

    it('descends on wall hit', () => {
      const sprite = createMockSprite(C.WIDTH - 10, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      scene.enemyDirection = 1;
      call(scene, 'updateEnemies', 0.5);
      expect(sprite.y).toBe(100 + C.ENEMY_DESCENT);
    });

    it('does nothing with empty enemies', () => {
      scene.enemies = [];
      expect(() => call(scene, 'updateEnemies', 1 / 60)).not.toThrow();
    });
  });

  describe('Enemy Shooting', () => {
    it('fires bullets probabilistically', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      vi.spyOn(Math, 'random').mockReturnValue(0);
      call(scene, 'handleEnemyShooting', 1 / 60);
      expect(s(scene, 'enemyBullets').length).toBeGreaterThanOrEqual(1);
      vi.restoreAllMocks();
    });

    it('enemy bullets have downward velocity', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      vi.spyOn(Math, 'random').mockReturnValue(0);
      call(scene, 'handleEnemyShooting', 1 / 60);
      expect(s(scene, 'enemyBullets')[0].vy).toBe(C.ENEMY_BULLET_SPEED);
      vi.restoreAllMocks();
    });
  });

  // R85.I3: Tom's playtest — "enemy bullets Needs to be bigger". These
  // tests lock the contract so a future config tweak can't silently shrink
  // them back to the pre-R85 3×6 pigeon-pellets. Size invariants first,
  // then spawn-dimension parity, then the trail-ghost cadence.
  describe('R85.I3 Enemy Bullet Size + Trail', () => {
    it('enemy bullet width >= 8 (visibility floor)', () => {
      expect(C.ENEMY_BULLET_WIDTH).toBeGreaterThanOrEqual(8);
    });

    it('enemy bullet height >= 16 (visibility floor)', () => {
      expect(C.ENEMY_BULLET_HEIGHT).toBeGreaterThanOrEqual(16);
    });

    it('enemy bullet is taller than player bullet (threat hierarchy)', () => {
      // Players read "incoming threat" partly from size; enemy projectiles
      // must dominate their own visually.
      expect(C.ENEMY_BULLET_HEIGHT).toBeGreaterThan(C.PLAYER_BULLET_HEIGHT);
    });

    it('spawned enemy bullet displaySize matches config exactly', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      vi.spyOn(Math, 'random').mockReturnValue(0);
      call(scene, 'handleEnemyShooting', 1 / 60);
      const bullet = s(scene, 'enemyBullets')[0].sprite;
      expect(bullet.displayWidth).toBe(C.ENEMY_BULLET_WIDTH);
      expect(bullet.displayHeight).toBe(C.ENEMY_BULLET_HEIGHT);
      vi.restoreAllMocks();
    });

    it('spawns a trail particle once per interval when bullets alive', () => {
      scene.enemyBullets = [{ sprite: createMockRect(400, 200, C.ENEMY_BULLET_WIDTH, C.ENEMY_BULLET_HEIGHT), vy: C.ENEMY_BULLET_SPEED, damage: 5, isPlayer: false }];
      scene.particles = [];
      // First tick: accumulator crosses the interval, expect 1 trail.
      call(scene, 'updateEnemyBullets', C.ENEMY_BULLET_TRAIL_INTERVAL + 0.001);
      expect(scene.particles.length).toBe(1);
    });

    it('does not double-spawn trails within one interval', () => {
      scene.enemyBullets = [{ sprite: createMockRect(400, 200, C.ENEMY_BULLET_WIDTH, C.ENEMY_BULLET_HEIGHT), vy: C.ENEMY_BULLET_SPEED, damage: 5, isPlayer: false }];
      scene.particles = [];
      // Two sub-interval ticks should spawn AT MOST one trail, not two.
      const half = C.ENEMY_BULLET_TRAIL_INTERVAL * 0.4;
      call(scene, 'updateEnemyBullets', half);
      call(scene, 'updateEnemyBullets', half);
      expect(scene.particles.length).toBeLessThanOrEqual(1);
    });

    it('does not spawn trails when no enemy bullets alive', () => {
      scene.enemyBullets = [];
      scene.particles = [];
      // Even with a huge dt, an idle scene should allocate nothing.
      call(scene, 'updateEnemyBullets', C.ENEMY_BULLET_TRAIL_INTERVAL * 10);
      expect(scene.particles.length).toBe(0);
    });

    it('trail spawned below bullet follows bullet position', () => {
      scene.enemyBullets = [{ sprite: createMockRect(400, 200, C.ENEMY_BULLET_WIDTH, C.ENEMY_BULLET_HEIGHT), vy: C.ENEMY_BULLET_SPEED, damage: 5, isPlayer: false }];
      scene.particles = [];
      call(scene, 'updateEnemyBullets', C.ENEMY_BULLET_TRAIL_INTERVAL + 0.001);
      expect(scene.particles[0].rect.x).toBe(400);
      // Trail is nudged upward by HEIGHT/2 so it sits "behind" the downward-moving bullet.
      expect(scene.particles[0].rect.y).toBeLessThan(scene.enemyBullets[0].sprite.y);
    });

    it('trail rect uses particles pool (decays through updateParticles)', () => {
      scene.enemyBullets = [{ sprite: createMockRect(400, 200, C.ENEMY_BULLET_WIDTH, C.ENEMY_BULLET_HEIGHT), vy: C.ENEMY_BULLET_SPEED, damage: 5, isPlayer: false }];
      scene.particles = [];
      call(scene, 'updateEnemyBullets', C.ENEMY_BULLET_TRAIL_INTERVAL + 0.001);
      expect(scene.particles[0].life).toBeGreaterThan(0);
      // Existing decay loop must strip the trail cleanly — no orphaned rects.
      call(scene, 'updateParticles', 10);
      expect(scene.particles.length).toBe(0);
    });
  });

  describe('Collision Detection', () => {
    it('detects AABB overlap', () => {
      const result = call(scene, 'aabbOverlap', 100, 100, 20, 20, 110, 110, 20, 20);
      expect(result).toBe(true);
    });

    it('detects no overlap when far apart', () => {
      const result = call(scene, 'aabbOverlap', 100, 100, 20, 20, 200, 200, 20, 20);
      expect(result).toBe(false);
    });
  });

  describe('Hit Enemy', () => {
    it('reduces enemy health', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'agent', health: 2, maxHealth: 2, value: 30, speedMultiplier: 1.5, width: 40, height: 30 }];
      call(scene, 'hitEnemy', 0, 1);
      expect(scene.enemies[0].health).toBe(1);
    });

    it('plays hit sound on damage', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'agent', health: 2, maxHealth: 2, value: 30, speedMultiplier: 1.5, width: 40, height: 30 }];
      call(scene, 'hitEnemy', 0, 1);
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('flashes enemy white on hit', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'agent', health: 2, maxHealth: 2, value: 30, speedMultiplier: 1.5, width: 40, height: 30 }];
      call(scene, 'hitEnemy', 0, 1);
      expect(sprite.setTint).toHaveBeenCalledWith(0xffffff);
    });
  });

  describe('Kill Enemy', () => {
    it('adds score with combo multiplier', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      scene.combo = 5;
      call(scene, 'killEnemy', 0);
      expect(s(scene, 'score')).toBe(Math.floor(10 * (1 + 5 * C.COMBO_MULTIPLIER)));
    });

    it('doubles score with score multiplier active', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      scene.scoreMultiplierActive = true;
      call(scene, 'killEnemy', 0);
      expect(s(scene, 'score')).toBe(20);
    });

    it('increments combo', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(s(scene, 'combo')).toBe(1);
    });

    it('increments enemies killed', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(s(scene, 'enemiesKilled')).toBe(1);
    });

    it('reports score', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(scene.reportScore).toHaveBeenCalled();
    });

    it('plays score sound', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(scene.playSound).toHaveBeenCalledWith('score');
    });

    it('removes enemy from array', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(scene.enemies).toHaveLength(0);
    });

    it('destroys enemy sprite', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(sprite.destroy).toHaveBeenCalled();
    });

    it('unlocks first kill achievement', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_KILL);
    });

    it('updates high score when exceeded', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'sentinel', health: 1, maxHealth: 3, value: 50, speedMultiplier: 1.2, width: 40, height: 30 }];
      scene.highScore = 0;
      call(scene, 'killEnemy', 0);
      expect(s(scene, 'highScore')).toBe(s(scene, 'score'));
    });
  });

  describe('Virus Split', () => {
    it('spawns 2 children on virus kill', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'virus', health: 1, maxHealth: 1, value: 20, speedMultiplier: 2.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(scene.enemies).toHaveLength(2);
    });

    it('children are code type', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'virus', health: 1, maxHealth: 1, value: 20, speedMultiplier: 2.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(scene.enemies[0].type).toBe('code');
      expect(scene.enemies[1].type).toBe('code');
    });

    it('children have reduced value', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'virus', health: 1, maxHealth: 1, value: 20, speedMultiplier: 2.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(scene.enemies[0].value).toBe(C.VIRUS_CHILD_VALUE);
    });

    it('children positioned at offsets', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'virus', health: 1, maxHealth: 1, value: 20, speedMultiplier: 2.0, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(scene.enemies[0].sprite.x).toBe(180);
      expect(scene.enemies[1].sprite.x).toBe(220);
    });
  });

  describe('Hit Player', () => {
    it('reduces health', () => {
      call(scene, 'hitPlayer');
      expect(s(scene, 'playerHealth')).toBe(C.PLAYER_MAX_HEALTH - C.PLAYER_HIT_DAMAGE);
    });

    it('resets combo', () => {
      scene.combo = 5;
      call(scene, 'hitPlayer');
      expect(s(scene, 'combo')).toBe(0);
    });

    it('sets wave damage taken', () => {
      call(scene, 'hitPlayer');
      expect(s(scene, 'waveDamageTaken')).toBe(true);
    });

    it('plays hit sound', () => {
      call(scene, 'hitPlayer');
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('shakes camera', () => {
      call(scene, 'hitPlayer');
      expect(scene.cameras.main.shake).toHaveBeenCalled();
    });

    it('sets invulnerability', () => {
      call(scene, 'hitPlayer');
      expect(s(scene, 'isInvulnerable')).toBe(true);
    });

    it('does not reduce health when invulnerable', () => {
      scene.isInvulnerable = true;
      call(scene, 'hitPlayer');
      expect(s(scene, 'playerHealth')).toBe(C.PLAYER_MAX_HEALTH);
    });

    it('triggers game over at 0 health', () => {
      scene.playerHealth = C.PLAYER_HIT_DAMAGE;
      call(scene, 'hitPlayer');
      expect(scene.gameOver).toHaveBeenCalled();
    });

    it('does not go below 0 health', () => {
      scene.playerHealth = 3;
      call(scene, 'hitPlayer');
      expect(s(scene, 'playerHealth')).toBe(0);
    });
  });

  describe('Shield Mechanics', () => {
    it('absorbs hit without health loss', () => {
      scene.shieldActive = true;
      call(scene, 'hitPlayer');
      expect(s(scene, 'playerHealth')).toBe(C.PLAYER_MAX_HEALTH);
    });

    it('deactivates shield on hit', () => {
      scene.shieldActive = true;
      call(scene, 'hitPlayer');
      expect(s(scene, 'shieldActive')).toBe(false);
    });

    it('grants invulnerability after shield break', () => {
      scene.shieldActive = true;
      call(scene, 'hitPlayer');
      expect(s(scene, 'isInvulnerable')).toBe(true);
    });

    it('plays hit sound on shield break', () => {
      scene.shieldActive = true;
      call(scene, 'hitPlayer');
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });
  });

  describe('Wave System', () => {
    it('spawns 40 enemies for non-boss wave', () => {
      call(scene, 'spawnWave');
      expect(s(scene, 'enemies')).toHaveLength(C.WAVE_COLS * C.WAVE_ROWS);
    });

    it('spawns only code enemies on wave 1', () => {
      scene.wave = 1;
      call(scene, 'spawnWave');
      expect(s(scene, 'enemies').every((e: { type: string }) => e.type === 'code')).toBe(true);
    });

    it('forces sentinel in top row from wave 10', () => {
      scene.wave = 10;
      call(scene, 'spawnWave');
      const topRowEnemies = s(scene, 'enemies').filter(
        (_: unknown, i: number) => i < C.WAVE_COLS
      );
      expect(topRowEnemies.every((e: { type: string }) => e.type === 'sentinel')).toBe(true);
    });

    it('spawns boss wave on wave 5', () => {
      scene.wave = 5;
      call(scene, 'spawnWave');
      expect(s(scene, 'isBossWave')).toBe(true);
    });

    it('spawns boss wave on wave 10', () => {
      scene.wave = 10;
      scene.enemies = [];
      call(scene, 'spawnBossWave');
      expect(s(scene, 'isBossWave')).toBe(true);
      expect(s(scene, 'bossSpawning')).toBe(true);
    });

    it('shows boss warning', () => {
      scene.wave = 5;
      call(scene, 'spawnWave');
      expect(scene.bossWarningText.setVisible).toHaveBeenCalledWith(true);
    });
  });

  // R85.I1 — enemy sprite contract regression tripwire.
  //
  // Guards three invariants that Tom's 2026-04-20 playtest surfaced:
  //   1. Enemies use the procedural UFO textures (`enemy_<type>`) regardless
  //      of `spriteMode`. The PNG fallbacks scaled as face-like blobs.
  //   2. Per-row tint from ROW_TINTS applies for PG6 colour variation.
  //   3. 20% visible shrink (PG6) lands via setScale(0.8), without touching
  //      grid spacing or collision width/height.
  // Virus children inherit the same contract so split enemies stay consistent.
  describe('R85.I1 enemy sprite contract', () => {
    it('spawns enemies with procedural enemy_<type> texture keys (not sprite_enemy_*)', () => {
      scene.wave = 1;
      scene._spriteMode = true; // even with sprite-mode on, enemies stay procedural
      scene.add.sprite.mockClear();
      call(scene, 'spawnWave');

      const enemyCalls = scene.add.sprite.mock.calls.filter(
        (args: unknown[]) => typeof args[2] === 'string' && String(args[2]).startsWith('enemy_')
      );
      expect(enemyCalls).toHaveLength(C.WAVE_COLS * C.WAVE_ROWS);
      for (const args of enemyCalls) {
        const key = String(args[2]);
        expect(key).toMatch(/^enemy_(code|agent|sentinel|virus)$/);
        expect(key.startsWith('sprite_enemy_')).toBe(false);
      }
    });

    it('applies ROW_TINTS[row] to every spawned enemy', () => {
      scene.wave = 1;
      call(scene, 'spawnWave');
      const enemies = s(scene, 'enemies') as Array<{ sprite: { setTint: ReturnType<typeof vi.fn> } }>;
      for (let i = 0; i < enemies.length; i++) {
        const row = Math.floor(i / C.WAVE_COLS);
        expect(enemies[i].sprite.setTint).toHaveBeenCalledWith(ROW_TINTS[row % ROW_TINTS.length]);
      }
    });

    it('shrinks every spawned enemy to 80% via setScale (PG6 20% shrink)', () => {
      scene.wave = 1;
      call(scene, 'spawnWave');
      const enemies = s(scene, 'enemies') as Array<{ sprite: { setScale: ReturnType<typeof vi.fn> } }>;
      for (const e of enemies) {
        expect(e.sprite.setScale).toHaveBeenCalledWith(0.8);
      }
    });

    it('virus split children use enemy_code texture with 20% shrink', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'virus', health: 1, maxHealth: 1, value: 20, speedMultiplier: 2.0, width: 40, height: 30 }];
      scene.add.sprite.mockClear();
      call(scene, 'killEnemy', 0);

      const childCalls = scene.add.sprite.mock.calls.filter(
        (args: unknown[]) => args[2] === 'enemy_code'
      );
      expect(childCalls).toHaveLength(2);
      for (const child of s(scene, 'enemies') as Array<{ sprite: { setScale: ReturnType<typeof vi.fn> } }>) {
        expect(child.sprite.setScale).toHaveBeenCalledWith(0.8);
      }
    });
  });

  describe('Wave Complete', () => {
    it('triggers when all enemies dead', () => {
      scene.enemies = [];
      scene.boss = null;
      scene.isBossWave = false;
      scene.bossSpawning = false;
      call(scene, 'checkWaveComplete');
      expect(s(scene, 'waveTransitioning')).toBe(true);
    });

    it('restores health on complete', () => {
      scene.enemies = [];
      scene.playerHealth = 50;
      call(scene, 'checkWaveComplete');
      expect(s(scene, 'playerHealth')).toBe(C.PLAYER_MAX_HEALTH);
    });

    it('plays level-up sound', () => {
      scene.enemies = [];
      call(scene, 'checkWaveComplete');
      expect(scene.playSound).toHaveBeenCalledWith('levelUp');
    });

    it('shows wave complete text', () => {
      scene.enemies = [];
      call(scene, 'checkWaveComplete');
      expect(scene.waveCompleteText.setVisible).toHaveBeenCalledWith(true);
    });

    it('does not trigger during transition', () => {
      scene.enemies = [];
      scene.waveTransitioning = true;
      call(scene, 'checkWaveComplete');
      expect(scene.playSound).not.toHaveBeenCalled();
    });

    it('does not trigger during boss spawning', () => {
      scene.enemies = [];
      scene.bossSpawning = true;
      call(scene, 'checkWaveComplete');
      expect(s(scene, 'waveTransitioning')).toBe(false);
    });

    it('does not trigger with boss alive', () => {
      scene.enemies = [];
      scene.isBossWave = true;
      scene.boss = { health: 50 };
      call(scene, 'checkWaveComplete');
      expect(s(scene, 'waveTransitioning')).toBe(false);
    });
  });

  describe('Boss Battle', () => {
    function createBoss() {
      scene.boss = {
        sprite: createMockSprite(C.WIDTH / 2, C.BOSS_Y),
        healthBar: createMockGraphics(),
        healthBg: createMockGraphics(),
        health: 50,
        maxHealth: 50,
        value: 500,
        width: C.BOSS_WIDTH,
        height: C.BOSS_HEIGHT,
        barrelOffsets: [-30, 0, 30],
      };
      scene.isBossWave = true;
    }

    it('reduces boss health on hit', () => {
      createBoss();
      call(scene, 'hitBoss', 1);
      expect(scene.boss.health).toBe(49);
    });

    it('plays hit sound on boss damage', () => {
      createBoss();
      call(scene, 'hitBoss', 1);
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('defeats boss when health reaches 0', () => {
      createBoss();
      scene.boss.health = 1;
      call(scene, 'hitBoss', 1);
      expect(s(scene, 'boss')).toBeNull();
    });

    it('awards score on boss defeat', () => {
      createBoss();
      scene.boss.health = 1;
      call(scene, 'hitBoss', 1);
      expect(s(scene, 'score')).toBe(500);
    });

    it('unlocks boss defeat achievement', () => {
      createBoss();
      scene.boss.health = 1;
      call(scene, 'hitBoss', 1);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.BOSS_DEFEAT);
    });

    it('clears boss flag on defeat', () => {
      createBoss();
      scene.boss.health = 1;
      call(scene, 'hitBoss', 1);
      expect(s(scene, 'isBossWave')).toBe(false);
    });

    it('creates explosion on defeat', () => {
      createBoss();
      scene.boss.health = 1;
      call(scene, 'hitBoss', 1);
      expect(s(scene, 'particles').length).toBeGreaterThan(0);
    });

    it('destroys boss graphics on defeat', () => {
      createBoss();
      const healthBar = scene.boss.healthBar;
      const healthBg = scene.boss.healthBg;
      const bossSprite = scene.boss.sprite;
      scene.boss.health = 1;
      call(scene, 'hitBoss', 1);
      expect(bossSprite.destroy).toHaveBeenCalled();
      expect(healthBar.destroy).toHaveBeenCalled();
      expect(healthBg.destroy).toHaveBeenCalled();
    });

    it('boss moves sinusoidally', () => {
      createBoss();
      const startX = scene.boss.sprite.x;
      call(scene, 'updateBoss', 0.5);
      expect(scene.boss.sprite.x).not.toBe(startX);
    });
  });

  describe('Power-up System', () => {
    it('spawns power-up with falling velocity', () => {
      call(scene, 'spawnPowerUp', 200, 100);
      expect(s(scene, 'fieldPowerUps')).toHaveLength(1);
      expect(s(scene, 'fieldPowerUps')[0].vy).toBe(C.POWERUP_FALL_SPEED);
    });

    it('power-ups fall downward', () => {
      const sprite = createMockSprite(200, 100);
      scene.fieldPowerUps = [{ sprite, type: 'shield', vy: C.POWERUP_FALL_SPEED }];
      call(scene, 'updateFieldPowerUps', 1 / 60);
      expect(sprite.y).toBeGreaterThan(100);
    });

    it('removes off-screen power-ups', () => {
      const sprite = createMockSprite(200, C.HEIGHT + 20);
      scene.fieldPowerUps = [{ sprite, type: 'shield', vy: C.POWERUP_FALL_SPEED }];
      call(scene, 'updateFieldPowerUps', 1 / 60);
      expect(scene.fieldPowerUps).toHaveLength(0);
    });
  });

  describe('Power-up Activation', () => {
    it('activates rapid fire', () => {
      call(scene, 'activatePowerUp', 'rapidFire');
      expect(s(scene, 'rapidFireActive')).toBe(true);
    });

    it('activates shield', () => {
      call(scene, 'activatePowerUp', 'shield');
      expect(s(scene, 'shieldActive')).toBe(true);
    });

    it('activates score multiplier', () => {
      call(scene, 'activatePowerUp', 'scoreMultiplier');
      expect(s(scene, 'scoreMultiplierActive')).toBe(true);
    });

    it('bomb clears all enemies', () => {
      scene.enemies = [
        { sprite: createMockSprite(100, 100), type: 'code' as const, health: 1, maxHealth: 1, value: 10, speedMultiplier: 1, width: 40, height: 30 },
        { sprite: createMockSprite(200, 100), type: 'code' as const, health: 1, maxHealth: 1, value: 10, speedMultiplier: 1, width: 40, height: 30 },
      ];
      call(scene, 'activatePowerUp', 'bomb');
      expect(scene.enemies).toHaveLength(0);
    });

    it('bomb adds score for killed enemies', () => {
      scene.enemies = [
        { sprite: createMockSprite(100, 100), type: 'code' as const, health: 1, maxHealth: 1, value: 10, speedMultiplier: 1, width: 40, height: 30 },
      ];
      call(scene, 'activatePowerUp', 'bomb');
      expect(s(scene, 'score')).toBe(10);
    });

    it('bomb flashes camera', () => {
      scene.enemies = [];
      call(scene, 'activatePowerUp', 'bomb');
      expect(scene.cameras.main.flash).toHaveBeenCalled();
    });

    it('plays power-up sound', () => {
      call(scene, 'activatePowerUp', 'shield');
      expect(scene.playSound).toHaveBeenCalledWith('powerup');
    });

    it('rapid fire reduces fire cooldown', () => {
      scene.rapidFireActive = true;
      scene.spaceKey.isDown = true;
      call(scene, 'handleShooting', 1000);
      call(scene, 'handleShooting', 1000 + C.RAPID_FIRE_COOLDOWN);
      expect(s(scene, 'playerBullets')).toHaveLength(2);
    });
  });

  describe('Game Over', () => {
    it('calls gameOver on health depletion', () => {
      scene.playerHealth = C.PLAYER_HIT_DAMAGE;
      call(scene, 'hitPlayer');
      expect(scene.gameOver).toHaveBeenCalledWith(0, 'Ship destroyed', 0, expect.any(Array), expect.any(Number), expect.any(Number));
    });

    it('calls gameOver when enemy reaches player', () => {
      scene.enemies = [{
        sprite: createMockSprite(200, C.HEIGHT - C.PLAYER_Y_OFFSET - 10),
        type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1,
        width: 40, height: 30,
      }];
      call(scene, 'checkGameOverConditions');
      expect(scene.gameOver).toHaveBeenCalled();
    });

    it('sets isGameOver flag', () => {
      call(scene, 'handleGameOver');
      expect(s(scene, 'isGameOver')).toBe(true);
    });

    it('checks remaining achievements on game over', () => {
      scene.combo = 15;
      scene.bulletTimeUses = 6;
      scene.score = 15000;
      call(scene, 'handleGameOver');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_10);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.BULLET_TIME);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.HIGH_SCORE);
    });

    it('does not trigger twice', () => {
      scene.isGameOver = true;
      call(scene, 'handleGameOver');
      expect(scene.gameOver).not.toHaveBeenCalled();
    });
  });

  describe('Achievements', () => {
    it('unlocks first kill on first enemy', () => {
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_KILL);
    });

    it('unlocks 100 enemies achievement', () => {
      scene.enemiesKilled = 99;
      const sprite = createMockSprite(200, 100);
      scene.enemies = [{ sprite, type: 'code', health: 1, maxHealth: 1, value: 10, speedMultiplier: 1, width: 40, height: 30 }];
      call(scene, 'killEnemy', 0);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.ENEMIES_100);
    });

    it('unlocks combo 10 achievement', () => {
      scene.combo = 10;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_10);
    });

    it('unlocks high score achievement', () => {
      scene.score = 10000;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.HIGH_SCORE);
    });

    it('unlocks bullet time achievement', () => {
      scene.bulletTimeUses = 5;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.BULLET_TIME);
    });

    it('does not unlock below threshold', () => {
      scene.combo = 9;
      scene.score = 9999;
      scene.bulletTimeUses = 4;
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).not.toHaveBeenCalled();
    });

    it('is idempotent', () => {
      scene.combo = 10;
      call(scene, 'checkAchievements');
      call(scene, 'checkAchievements');
      expect(scene.unlockAchievement).toHaveBeenCalledTimes(1);
    });

    it('unlocks wave 5 on wave complete', () => {
      scene.wave = 5;
      scene.enemies = [];
      call(scene, 'checkWaveComplete');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.WAVE_5);
    });

    it('unlocks perfect wave when no damage taken', () => {
      scene.wave = 3;
      scene.waveDamageTaken = false;
      scene.enemies = [];
      call(scene, 'checkWaveComplete');
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.PERFECT_WAVE);
    });

    it('does not unlock perfect wave on first wave', () => {
      scene.wave = 1;
      scene.waveDamageTaken = false;
      scene.enemies = [];
      call(scene, 'checkWaveComplete');
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.PERFECT_WAVE);
    });
  });

  describe('Particle Effects', () => {
    it('spawns explosion particles', () => {
      call(scene, 'spawnExplosion', 200, 100, 0x00ff00, 10);
      expect(s(scene, 'particles')).toHaveLength(10);
    });

    it('particles have velocity', () => {
      call(scene, 'spawnExplosion', 200, 100, 0x00ff00, 5);
      const p = s(scene, 'particles')[1];
      expect(p.vx).not.toBe(0);
      expect(p.vy).not.toBe(0);
    });

    it('particles decay over time', () => {
      call(scene, 'spawnExplosion', 200, 100, 0x00ff00, 5);
      const initialLife = s(scene, 'particles')[0].life;
      call(scene, 'updateParticles', 0.1);
      expect(s(scene, 'particles')[0].life).toBeLessThan(initialLife);
    });

    it('removes dead particles', () => {
      call(scene, 'spawnExplosion', 200, 100, 0x00ff00, 5);
      for (const p of s(scene, 'particles')) p.life = 0.01;
      call(scene, 'updateParticles', 1);
      expect(s(scene, 'particles')).toHaveLength(0);
    });
  });

  describe('Enemy Type Selection', () => {
    it('returns code for early waves', () => {
      scene.wave = 1;
      expect(call(scene, 'getEnemyType', 2)).toBe('code');
    });

    it('returns sentinel for top row on wave 10+', () => {
      scene.wave = 10;
      expect(call(scene, 'getEnemyType', 0)).toBe('sentinel');
    });
  });

  describe('Test State Exposure', () => {
    it('returns all required fields', () => {
      const state = call(scene, 'getTestState');
      expect(state).toHaveProperty('score');
      expect(state).toHaveProperty('highScore');
      expect(state).toHaveProperty('wave');
      expect(state).toHaveProperty('combo');
      expect(state).toHaveProperty('playerHealth');
      expect(state).toHaveProperty('playerX');
      expect(state).toHaveProperty('isInvulnerable');
      expect(state).toHaveProperty('shieldActive');
      expect(state).toHaveProperty('rapidFireActive');
      expect(state).toHaveProperty('scoreMultiplierActive');
      expect(state).toHaveProperty('bulletTimeActive');
      expect(state).toHaveProperty('bulletTimeUses');
      expect(state).toHaveProperty('bulletTimeCharge');
      expect(state).toHaveProperty('enemiesKilled');
      expect(state).toHaveProperty('isGameOver');
      expect(state).toHaveProperty('isBossWave');
      expect(state).toHaveProperty('bossHealth');
      expect(state).toHaveProperty('enemyCount');
      expect(state).toHaveProperty('playerBulletCount');
      expect(state).toHaveProperty('enemyBulletCount');
      expect(state).toHaveProperty('fieldPowerUpCount');
      expect(state).toHaveProperty('waveTransitioning');
    });

    it('reflects current enemy count', () => {
      scene.enemies = [
        { sprite: createMockSprite(), type: 'code' },
        { sprite: createMockSprite(), type: 'code' },
      ];
      const state = call(scene, 'getTestState');
      expect(state.enemyCount).toBe(2);
    });
  });

  describe('Cleanup', () => {
    it('destroys all enemies on shutdown', () => {
      const sprite1 = createMockSprite();
      const sprite2 = createMockSprite();
      scene.enemies = [{ sprite: sprite1 }, { sprite: sprite2 }];
      call(scene, 'shutdown');
      expect(sprite1.destroy).toHaveBeenCalled();
      expect(sprite2.destroy).toHaveBeenCalled();
      expect(scene.enemies).toHaveLength(0);
    });

    it('destroys all bullets on shutdown', () => {
      const pb = createMockRect();
      const eb = createMockRect();
      scene.playerBullets = [{ sprite: pb }];
      scene.enemyBullets = [{ sprite: eb }];
      call(scene, 'shutdown');
      expect(pb.destroy).toHaveBeenCalled();
      expect(eb.destroy).toHaveBeenCalled();
    });

    it('destroys boss on shutdown', () => {
      scene.boss = {
        sprite: createMockSprite(),
        healthBar: createMockGraphics(),
        healthBg: createMockGraphics(),
      };
      const bossSprite = scene.boss.sprite;
      call(scene, 'shutdown');
      expect(bossSprite.destroy).toHaveBeenCalled();
      expect(scene.boss).toBeNull();
    });

    it('removes keyboard listeners on shutdown', () => {
      call(scene, 'shutdown');
      expect(scene.input.keyboard.removeAllKeys).toHaveBeenCalledWith(true);
    });

    it('destroys particles on shutdown', () => {
      const rect = createMockRect();
      scene.particles = [{ rect }];
      call(scene, 'shutdown');
      expect(rect.destroy).toHaveBeenCalled();
      expect(scene.particles).toHaveLength(0);
    });

    it('destroys power-ups on shutdown', () => {
      const sprite = createMockSprite();
      scene.fieldPowerUps = [{ sprite }];
      call(scene, 'shutdown');
      expect(sprite.destroy).toHaveBeenCalled();
      expect(scene.fieldPowerUps).toHaveLength(0);
    });

    // R85.I4: shutdown must also kill the infinite yoyo tween the pickup
    // sprite was running. If the tween outlives the scene, the next run
    // inherits a dangling target that the tween manager keeps ticking.
    it('kills power-up tweens on shutdown', () => {
      const sprite = createMockSprite();
      scene.fieldPowerUps = [{ sprite }];
      call(scene, 'shutdown');
      expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(sprite);
    });
  });

  // R85.I4 regression tripwires — "when getting many power-ups, the shooter
  // becomes invisible" (Tom's Matrix Invaders playtest, 2026-04-20). Root
  // cause was that the shield power-up mutated the player sprite itself
  // (setTexture/setTint in activatePowerUp + re-asserted every frame in
  // updateHUD), leaving the player one bug away from vanishing if any other
  // effect also touched alpha/visibility. The fix gives the shield its own
  // Graphics aura layer; these tests lock in the invariant that power-up
  // activation can never mutate the player's visual state.
  describe('R85.I4 Power-up Shooter Visibility Invariant', () => {
    // Outcome-based invariant: the restorePlayerVisuals() helper is allowed
    // to call setVisible(true) / setAlpha(1) / clearTint() — what's
    // forbidden is leaving the player in any non-visible / non-opaque /
    // tinted / re-textured state after a power-up activation.
    const assertPlayerVisibleAndOpaque = (player: { visible: boolean; setAlpha: { mock: { calls: unknown[][] } }; setVisible: { mock: { calls: unknown[][] } }; setTexture: { mock: { calls: unknown[][] } }; setTint: { mock: { calls: unknown[][] } } }) => {
      expect(player.visible).toBe(true);
      // Every setAlpha call must be with 1 (no dim/fade effects on the player).
      for (const c of player.setAlpha.mock.calls) expect(c[0]).toBe(1);
      // Every setVisible call must be with true (no hide effects on the player).
      for (const c of player.setVisible.mock.calls) expect(c[0]).toBe(true);
      // No texture swap, no tint — shield visuals live on the aura layer.
      expect(player.setTexture).not.toHaveBeenCalled();
      expect(player.setTint).not.toHaveBeenCalled();
    };

    it('shield activation leaves player visible, opaque, untinted, untextured', () => {
      call(scene, 'activatePowerUp', 'shield');
      assertPlayerVisibleAndOpaque(scene.player);
    });

    it('rapidFire activation leaves player visible, opaque, untinted, untextured', () => {
      call(scene, 'activatePowerUp', 'rapidFire');
      assertPlayerVisibleAndOpaque(scene.player);
    });

    it('scoreMultiplier activation leaves player visible, opaque, untinted, untextured', () => {
      call(scene, 'activatePowerUp', 'scoreMultiplier');
      assertPlayerVisibleAndOpaque(scene.player);
    });

    it('bomb activation leaves player visible, opaque, untinted, untextured', () => {
      call(scene, 'activatePowerUp', 'bomb');
      assertPlayerVisibleAndOpaque(scene.player);
    });

    // The canonical repro for Tom's note: collect every power-up type in
    // rapid succession. After the stack, the player must still be visible
    // with alpha = 1 and no residual tint.
    it('stacking every power-up type leaves the player visible and opaque', () => {
      call(scene, 'activatePowerUp', 'rapidFire');
      call(scene, 'activatePowerUp', 'shield');
      call(scene, 'activatePowerUp', 'scoreMultiplier');
      call(scene, 'activatePowerUp', 'bomb');
      assertPlayerVisibleAndOpaque(scene.player);
      // clearTint is part of the invariant — called at least once via
      // restorePlayerVisuals to guarantee no residual tint.
      expect(scene.player.clearTint).toHaveBeenCalled();
    });

    // Repeated shield pickups exercise the pathological case where a
    // per-activation mutation would accumulate. The aura layer owns the
    // visual, so repeats are idempotent.
    it('10 consecutive shield activations never hide the player', () => {
      for (let i = 0; i < 10; i++) {
        call(scene, 'activatePowerUp', 'shield');
      }
      assertPlayerVisibleAndOpaque(scene.player);
    });

    it('shield aura shows when shield is active', () => {
      scene.shieldActive = true;
      call(scene, 'updateShieldAura', 0);
      expect(scene.shieldAura.visible).toBe(true);
    });

    it('shield aura hides when shield is inactive', () => {
      scene.shieldActive = false;
      scene.shieldAura.visible = true;
      call(scene, 'updateShieldAura', 0);
      expect(scene.shieldAura.visible).toBe(false);
    });

    it('shield aura pins to the player position', () => {
      scene.player.x = 420;
      scene.player.y = 240;
      call(scene, 'updateShieldAura', 0);
      expect(scene.shieldAura.x).toBe(420);
      expect(scene.shieldAura.y).toBe(240);
    });

    // Shield-break via hitPlayer must clear shieldActive (so the next
    // updateShieldAura tick hides the aura) and must not mutate the player
    // sprite itself.
    it('shield-break does not mutate player texture or tint', () => {
      scene.shieldActive = true;
      call(scene, 'hitPlayer');
      expect(scene.shieldActive).toBe(false);
      expect(scene.player.setTexture).not.toHaveBeenCalled();
      expect(scene.player.setTint).not.toHaveBeenCalled();
    });

    // updateHUD used to re-assert shield texture/tint every frame. Locking
    // in that it no longer touches the player stops a future regression
    // from re-introducing the exact shape of Tom's bug.
    it('updateHUD does not mutate player texture or tint', () => {
      scene.shieldActive = true;
      call(scene, 'updateHUD', 0);
      expect(scene.player.setTexture).not.toHaveBeenCalled();
      expect(scene.player.setTint).not.toHaveBeenCalled();
    });

    // Pickup destroys the power-up sprite; the yoyo tween must die with it.
    it('power-up pickup kills the pickup tween before destroy', () => {
      const sprite = createMockSprite(scene.player.x, scene.player.y);
      scene.fieldPowerUps = [{ sprite, type: 'shield', vy: 0 }];
      call(scene, 'checkPowerUpCollisions');
      expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(sprite);
      expect(sprite.destroy).toHaveBeenCalled();
    });

    // Off-screen cleanup destroys the sprite; the tween must die with it.
    it('off-screen power-up kills its tween before destroy', () => {
      const sprite = createMockSprite(100, C.HEIGHT + 20);
      scene.fieldPowerUps = [{ sprite, type: 'shield', vy: 0 }];
      call(scene, 'updateFieldPowerUps', 0);
      expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(sprite);
      expect(sprite.destroy).toHaveBeenCalled();
    });
  });

  // R85.I6 regression tripwires — "6 power-ups each collect + activate — need
  // work and we need a key" (Tom's Matrix Invaders playtest, 2026-04-20). The
  // legend teaches the power-up verbs on every pickup: the row for the picked
  // type paints in its own colour at ACTIVE_ALPHA, the other rows dim to
  // INACTIVE_ALPHA so the player still sees every option. Tests lock in the
  // render contract (4 rows, colours, positions, depth), the cleanup contract
  // (hide timer, tween kill, back-to-back refresh), and the reduced-motion
  // contract (no fade tweens under `prefers-reduced-motion: reduce`).
  describe('R85.I6 Power-up Legend HUD', () => {
    beforeEach(() => {
      scene.add.text.mockClear();
      scene.tweens.add.mockClear();
      scene.time.delayedCall.mockClear();
    });

    // Small helper: trigger showPowerUpLegend and return the mock.calls args
    // array for `add.text`. Each call = [x, y, text, style].
     
    const show = (type: string) => {
      call(scene, 'showPowerUpLegend', type);
      return scene.add.text.mock.calls as [number, number, string, Record<string, unknown>][];
    };

    describe('rendering contract', () => {
      it('spawns exactly 4 text instances per pickup (one per entry)', () => {
        const calls = show('rapidFire');
        expect(calls).toHaveLength(POWERUP_LEGEND.ENTRIES.length);
        expect(scene.powerUpLegend).toHaveLength(4);
      });

      it('centres every row horizontally on canvas mid-x', () => {
        const calls = show('bomb');
        const cx = C.WIDTH / 2;
        for (const callArgs of calls) {
          expect(callArgs[0]).toBe(cx);
        }
      });

      it('stacks rows vertically at LINE_HEIGHT spacing', () => {
        const calls = show('shield');
        const ys = calls.map((c) => c[1]);
        expect(ys[1] - ys[0]).toBe(POWERUP_LEGEND.LINE_HEIGHT);
        expect(ys[2] - ys[0]).toBe(POWERUP_LEGEND.LINE_HEIGHT * 2);
        expect(ys[3] - ys[0]).toBe(POWERUP_LEGEND.LINE_HEIGHT * 3);
      });

      it('anchors the first row at BASE_Y_RATIO × canvas height', () => {
        const calls = show('shield');
        expect(calls[0][1]).toBeCloseTo(C.HEIGHT * POWERUP_LEGEND.BASE_Y_RATIO);
      });

      it('each row uses its power-up colour from POWERUP_DEFS', () => {
        const calls = show('rapidFire');
        const expectedColours = POWERUP_LEGEND.ENTRIES.map(
          (e) => `#${POWERUP_DEFS[e.type].color.toString(16).padStart(6, '0')}`,
        );
        const actualColours = calls.map((c) => c[3].color);
        expect(actualColours).toEqual(expectedColours);
      });

      it('row text includes name · effect · duration for each entry', () => {
        const calls = show('bomb');
        POWERUP_LEGEND.ENTRIES.forEach((entry, i) => {
          expect(calls[i][2]).toContain(entry.name);
          expect(calls[i][2]).toContain(entry.effect);
          expect(calls[i][2]).toContain(entry.duration);
        });
      });

      it('row order matches POWERUP_LEGEND.ENTRIES exactly (consistency guard)', () => {
        const calls = show('shield');
        const names = calls.map((c) => c[2].split(' · ')[0]);
        expect(names).toEqual(POWERUP_LEGEND.ENTRIES.map((e) => e.name));
      });

      it('centres each row via setOrigin(0.5, 0.5)', () => {
        show('rapidFire');
        for (const t of scene.powerUpLegend) {
          expect(t.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
        }
      });

      it('paints rows at render depth 100 (above gameplay)', () => {
        show('bomb');
        for (const t of scene.powerUpLegend) {
          expect(t.setDepth).toHaveBeenCalledWith(100);
        }
      });

      it('schedules an auto-hide timer for DISPLAY_MS', () => {
        show('rapidFire');
        const legendCall = scene.time.delayedCall.mock.calls.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any[]) => c[0] === POWERUP_LEGEND.DISPLAY_MS,
        );
        expect(legendCall).toBeTruthy();
      });
    });

    describe('active-row highlighting', () => {
      it('fades activated row to ACTIVE_ALPHA via tween', () => {
        show('scoreMultiplier');
        const activeTweens = scene.tweens.add.mock.calls.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any[]) => c[0].alpha === POWERUP_LEGEND.ACTIVE_ALPHA,
        );
        expect(activeTweens).toHaveLength(1);
      });

      it('fades the other 3 rows to INACTIVE_ALPHA', () => {
        show('scoreMultiplier');
        const inactiveTweens = scene.tweens.add.mock.calls.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any[]) => c[0].alpha === POWERUP_LEGEND.INACTIVE_ALPHA,
        );
        expect(inactiveTweens).toHaveLength(3);
      });

      it('each power-up type highlights a single distinct row', () => {
        for (const entry of POWERUP_LEGEND.ENTRIES) {
          call(scene, 'clearPowerUpLegend');
          scene.tweens.add.mockClear();
          call(scene, 'showPowerUpLegend', entry.type);
          const activeTweens = scene.tweens.add.mock.calls.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any[]) => c[0].alpha === POWERUP_LEGEND.ACTIVE_ALPHA,
          );
          expect(activeTweens).toHaveLength(1);
        }
      });
    });

    describe('back-to-back pickup refresh', () => {
      it('clears prior cohort before spawning a new one', () => {
        show('rapidFire');
        const firstCohort = scene.powerUpLegend;
        const firstDestroy = firstCohort.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t: any) => t.destroy,
        );
        call(scene, 'showPowerUpLegend', 'shield');
         
        for (const d of firstDestroy) expect(d).toHaveBeenCalled();
        expect(scene.powerUpLegend).not.toBe(firstCohort);
        expect(scene.powerUpLegend).toHaveLength(4);
      });

      it('cancels the prior hide timer so it cannot fire on new cohort', () => {
        show('rapidFire');
        const firstTimer = scene.powerUpLegendHideTimer;
        expect(firstTimer).toBeTruthy();
        call(scene, 'showPowerUpLegend', 'shield');
        expect(firstTimer.remove).toHaveBeenCalledWith(false);
        expect(scene.powerUpLegendHideTimer).not.toBe(firstTimer);
      });
    });

    describe('cleanup + shutdown', () => {
      it('clearPowerUpLegend kills tweens + destroys all text', () => {
        show('rapidFire');
        const cohort = scene.powerUpLegend;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const destroyFns = cohort.map((t: any) => t.destroy);
        call(scene, 'clearPowerUpLegend');
         
        for (const d of destroyFns) expect(d).toHaveBeenCalled();
        expect(scene.powerUpLegend).toHaveLength(0);
        expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(cohort);
      });

      it('hidePowerUpLegend is a no-op when no legend is visible', () => {
        scene.tweens.add.mockClear();
        call(scene, 'hidePowerUpLegend');
        expect(scene.tweens.add).not.toHaveBeenCalled();
      });

      it('hide-timer callback destroys the cohort via the fade onComplete', () => {
        show('rapidFire');
        const cohort = scene.powerUpLegend;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const destroyFns = cohort.map((t: any) => t.destroy);
        scene.tweens.add.mockClear();
        // Fire the delayedCall callback — this is what the Phaser scheduler
        // would do at DISPLAY_MS.
        const timer = scene.powerUpLegendHideTimer;
        expect(typeof timer.callback).toBe('function');
        timer.callback();
        // Default-motion path: hidePowerUpLegend schedules a fade tween.
        const fadeCall = scene.tweens.add.mock.calls.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any[]) => c[0].alpha === 0 && c[0].targets === cohort,
        );
        expect(fadeCall).toBeTruthy();
        // Simulate fade completion — this is the terminal destroy path.
        fadeCall[0].onComplete?.();
         
        for (const d of destroyFns) expect(d).toHaveBeenCalled();
      });

      it('mid-fade onComplete does NOT destroy a newer cohort (cancellation-token guard)', () => {
        show('rapidFire');
        const staleCohort = scene.powerUpLegend;
        // Fire the stale timer to schedule a fade tween against staleCohort.
        scene.powerUpLegendHideTimer.callback();
        const staleFade = scene.tweens.add.mock.calls.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any[]) => c[0].alpha === 0 && c[0].targets === staleCohort,
        );
        expect(staleFade).toBeTruthy();
        // Before the stale fade lands, a new pickup rebuilds the cohort. We
        // explicitly clear the stale fade's destroy mocks so we can observe
        // that firing the stale onComplete does NOT touch the fresh cohort.
        call(scene, 'showPowerUpLegend', 'shield');
        const freshCohort = scene.powerUpLegend;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const freshDestroy = freshCohort.map((t: any) => t.destroy);
        for (const d of freshDestroy) d.mockClear();
        // Now fire the stale fade's onComplete — it should NOT destroy the
        // fresh cohort (only the stale targets, which it already captured).
        staleFade[0].onComplete?.();
         
        for (const d of freshDestroy) expect(d).not.toHaveBeenCalled();
        // Fresh cohort still tracked by the scene.
        expect(scene.powerUpLegend).toBe(freshCohort);
      });

      it('shutdown tears down any active legend cohort', () => {
        show('rapidFire');
        const cohort = scene.powerUpLegend;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const destroyFns = cohort.map((t: any) => t.destroy);
        // Provide a boss stub so shutdown's boss branch doesn't NPE; use
        // `as any` because the test mocks stand in for a BossState.
        scene.boss = null;
        call(scene, 'shutdown');
         
        for (const d of destroyFns) expect(d).toHaveBeenCalled();
        expect(scene.powerUpLegend).toHaveLength(0);
      });

      it('resetState clears any pre-existing legend (restart safety)', () => {
        show('rapidFire');
        const cohort = scene.powerUpLegend;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const destroyFns = cohort.map((t: any) => t.destroy);
        call(scene, 'resetState');
         
        for (const d of destroyFns) expect(d).toHaveBeenCalled();
        expect(scene.powerUpLegend).toHaveLength(0);
      });
    });

    describe('reduced-motion handling', () => {
      // Override window.matchMedia for the duration of a callback.
      const withReducedMotion = (fn: () => void) => {
        const original = window.matchMedia;
        // @ts-expect-error overriding for test
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        try { fn(); } finally { window.matchMedia = original; }
      };

      it('skips fade-in tweens and sets alpha directly', () => {
        withReducedMotion(() => {
          scene.tweens.add.mockClear();
          call(scene, 'showPowerUpLegend', 'rapidFire');
          expect(scene.tweens.add).not.toHaveBeenCalled();
          // Active row set to ACTIVE_ALPHA; others to INACTIVE_ALPHA.
          expect(scene.powerUpLegend[0].setAlpha).toHaveBeenCalledWith(POWERUP_LEGEND.ACTIVE_ALPHA);
          expect(scene.powerUpLegend[1].setAlpha).toHaveBeenCalledWith(POWERUP_LEGEND.INACTIVE_ALPHA);
        });
      });

      it('hidePowerUpLegend clears synchronously under reduced motion', () => {
        withReducedMotion(() => {
          call(scene, 'showPowerUpLegend', 'rapidFire');
          const cohort = scene.powerUpLegend;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const destroyFns = cohort.map((t: any) => t.destroy);
          scene.tweens.add.mockClear();
          call(scene, 'hidePowerUpLegend');
          expect(scene.tweens.add).not.toHaveBeenCalled();
           
          for (const d of destroyFns) expect(d).toHaveBeenCalled();
          expect(scene.powerUpLegend).toHaveLength(0);
        });
      });
    });

    describe('pickup wiring', () => {
      it('checkPowerUpCollisions triggers showPowerUpLegend for the picked type', () => {
        const sprite = createMockSprite(scene.player.x, scene.player.y);
        scene.fieldPowerUps = [{ sprite, type: 'rapidFire', vy: 0 }];
        scene.add.text.mockClear();
        call(scene, 'checkPowerUpCollisions');
        // 4 legend rows spawned by the pickup path.
        expect(scene.add.text).toHaveBeenCalledTimes(POWERUP_LEGEND.ENTRIES.length);
        expect(scene.powerUpLegend).toHaveLength(POWERUP_LEGEND.ENTRIES.length);
        // Active row is `rapidFire` — its tween alpha target must be ACTIVE_ALPHA.
        // Row index for rapidFire comes from the config order.
        const activeIdx = POWERUP_LEGEND.ENTRIES.findIndex((e) => e.type === 'rapidFire');
        // Tween whose target is the rapidFire row should use ACTIVE_ALPHA.
        const activeRow = scene.powerUpLegend[activeIdx];
        const activeTween = scene.tweens.add.mock.calls.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any[]) => c[0].targets === activeRow,
        );
        expect(activeTween[0].alpha).toBe(POWERUP_LEGEND.ACTIVE_ALPHA);
      });
    });
  });
});
