import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { MatrixInvadersGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS, ROW_TINTS } from '../config';

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
  });
});
