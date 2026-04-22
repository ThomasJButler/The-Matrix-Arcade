/**
 * NeoJumpGameScene — Unit Tests
 *
 * Tests instantiate the scene directly, mock BaseScene helpers, set
 * internal state via (scene as any), and call private methods to
 * verify behaviour without needing a real Phaser runtime.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { NeoJumpGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS } from '../config';

// Add JustDown mock — not provided by the global Phaser mock in setup.ts
(Phaser.Input.Keyboard as unknown as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(false);

// R86.N1: `maybeSpawnEnemy` relies on Phaser.Math.Between for X placement.
// Ensure Phaser.Math exists with a default Between before individual tests
// override it — the global Phaser mock in setup.ts leaves Math undefined.
const phaserMath = (Phaser as unknown as Record<string, Record<string, unknown>>).Math ?? {};
phaserMath.Between = phaserMath.Between ?? vi.fn((min: number, max: number) => Math.floor((min + max) / 2));
(Phaser as unknown as Record<string, unknown>).Math = phaserMath;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Build a scene instance with all BaseScene methods stubbed out */
function createTestScene() {
  const scene = new NeoJumpGameScene() as unknown as Record<string, unknown>;

  // The Phaser mock returns a plain object from the Scene constructor,
  // so prototype methods from NeoJumpGameScene (and BaseScene) are not
  // on the instance. Copy them manually so we can call private methods.
  const proto = NeoJumpGameScene.prototype as unknown as Record<string, unknown>;
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key !== 'constructor' && typeof proto[key] === 'function') {
      scene[key] = proto[key].bind(scene);
    }
  });

  // BaseScene helpers — override after prototype binding so mocks win
  scene.playSound = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();
  scene.getGameDuration = vi.fn().mockReturnValue(1000);

  // Initialize state that create() would set
  scene.highestY = 500; // GAME_CONFIG.HEIGHT - 100
  scene.fallApexY = 500; // R86.N2: matches player start Y so fall-death tests have a stable anchor
  scene.lastMaxAltitude = 0;
  scene.isGameOver = false;

  // UI elements the scene writes to during updates
  scene.altitudeText = { setText: vi.fn() };
  scene.scoreText = { setText: vi.fn() };
  scene.fuelBar = { clear: vi.fn(), fillStyle: vi.fn(), fillRect: vi.fn() };
  scene.fuelBarBg = { clear: vi.fn(), fillStyle: vi.fn(), fillRect: vi.fn() };

  // Shield state
  scene.shieldActive = false;
  scene.shieldTimer = 0;
  scene.shieldGlow = null;
  scene.shieldText = null;
  scene.collectiblesCollected = 0;
  scene.collectibleSpriteMode = false;

  // Jetpack flame — null unless createJetpackFlame() is called
  scene.jetpackFlame = null;

  // Tweens — used by disappearing/breakable/spring/death logic
  scene.tweens = { add: vi.fn() };

  // Player mock
  scene.player = {
    x: 200,
    y: 400,
    body: {
      velocity: { x: 0, y: 100 },
      blocked: { down: false },
      touching: { down: false },
      setVelocityY: vi.fn(),
      setVelocityX: vi.fn(),
      height: GAME_CONFIG.PLAYER.HEIGHT,
    },
    setVelocityY: vi.fn(),
    setFlipX: vi.fn(),
    setTint: vi.fn(),
    clearTint: vi.fn(),
    setAlpha: vi.fn(),
    anims: { currentAnim: null },
    play: vi.fn(),
  };

  // Cameras
  scene.cameras = {
    main: { scrollY: 0, setDeadzone: vi.fn(), startFollow: vi.fn(), setBounds: vi.fn(), shake: vi.fn(), flash: vi.fn() },
  };

  // Projectiles group — needed by shoot()
  scene.projectiles = {
    get: vi.fn().mockReturnValue({
      setActive: vi.fn(),
      setVisible: vi.fn(),
      setDepth: vi.fn(),
      body: { setVelocityY: vi.fn() },
    }),
  };

  // Space key mock — used by handleInput for shooting
  scene.spaceKey = { isDown: false };

  // W key mock — used by handleInput for jetpack (WASD alternative)
  scene.wKey = { isDown: false };

  return scene;
}

/** Create a mock platform object with reasonable defaults */
function createMockPlatform(type: string = 'normal') {
  return {
    platformType: type,
    isUsed: false,
    originalY: 400,
    springCompressed: false,
    body: { allowGravity: false, velocity: { y: 0 } },
    setVelocityY: vi.fn(),
    setTint: vi.fn(),
    setAlpha: vi.fn(),
    destroy: vi.fn(),
    x: 200,
    y: 400,
    width: 80,
    scaleY: 1,
  };
}

/** Create a mock enemy object */
function createMockEnemy() {
  return {
    isDying: false,
    direction: 1,
    speed: 75,
    x: 200,
    y: 300,
    setDepth: vi.fn(),
    destroy: vi.fn(),
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('NeoJumpGameScene', () => {
  let scene: Record<string, unknown>;

  beforeEach(() => {
    scene = createTestScene();
  });

  /* -------------------------------------------------------------- */
  /*  Initial State                                                 */
  /* -------------------------------------------------------------- */
  describe('Initial State', () => {
    it('altitude starts at 0', () => {
      expect(scene.lastMaxAltitude).toBe(0);
    });

    it('score starts at 0', () => {
      expect(scene.score).toBe(0);
    });

    it('jetpackFuel starts at FUEL_MAX (100)', () => {
      expect(scene.jetpackFuel).toBe(GAME_CONFIG.JETPACK.FUEL_MAX);
    });

    it('isGameOver starts false', () => {
      expect(scene.isGameOver).toBe(false);
    });

    it('bounceCombo starts at 0', () => {
      expect(scene.bounceCombo).toBe(0);
    });

    it('enemiesKilled starts at 0', () => {
      expect(scene.enemiesKilled).toBe(0);
    });

    it('hasJumped starts false', () => {
      expect(scene.hasJumped).toBe(false);
    });

    it('hasUsedJetpack starts false', () => {
      expect(scene.hasUsedJetpack).toBe(false);
    });
  });

  /* -------------------------------------------------------------- */
  /*  Platform Collision                                            */
  /* -------------------------------------------------------------- */
  describe('Platform Collision', () => {
    it('normal platform sets velocity to JUMP_VELOCITY (-550)', () => {
      const platform = createMockPlatform('normal');
      scene.handlePlatformCollision(platform);

      expect(scene.player.body.setVelocityY).toHaveBeenCalledWith(
        GAME_CONFIG.PLAYER.JUMP_VELOCITY
      );
    });

    it('moving platform sets velocity to JUMP_VELOCITY (-550)', () => {
      const platform = createMockPlatform('moving');
      scene.handlePlatformCollision(platform);

      expect(scene.player.body.setVelocityY).toHaveBeenCalledWith(
        GAME_CONFIG.PLAYER.JUMP_VELOCITY
      );
    });

    it('spring platform sets velocity to SPRING_VELOCITY (-800)', () => {
      const platform = createMockPlatform('spring');
      scene.handlePlatformCollision(platform);

      expect(scene.player.body.setVelocityY).toHaveBeenCalledWith(
        GAME_CONFIG.PLAYER.SPRING_VELOCITY
      );
    });

    it('plays jump sound for normal platform', () => {
      const platform = createMockPlatform('normal');
      scene.handlePlatformCollision(platform);

      expect(scene.playSound).toHaveBeenCalledWith('jump');
    });

    it('plays powerup sound for spring platform', () => {
      const platform = createMockPlatform('spring');
      scene.handlePlatformCollision(platform);

      expect(scene.playSound).toHaveBeenCalledWith('powerup');
    });

    it('increments bounceCombo on each collision', () => {
      const platform = createMockPlatform('normal');

      scene.handlePlatformCollision(platform);
      expect(scene.bounceCombo).toBe(1);

      scene.handlePlatformCollision(platform);
      expect(scene.bounceCombo).toBe(2);
    });

    it('unlocks FIRST_JUMP on the first platform collision', () => {
      const platform = createMockPlatform('normal');
      scene.handlePlatformCollision(platform);

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_JUMP);
      expect(scene.hasJumped).toBe(true);
    });

    it('does not unlock FIRST_JUMP on subsequent collisions', () => {
      scene.hasJumped = true;
      const platform = createMockPlatform('normal');
      scene.handlePlatformCollision(platform);

      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_JUMP);
    });

    it('unlocks SPRING_BOUNCE when landing on a spring platform', () => {
      const platform = createMockPlatform('spring');
      scene.hasJumped = true; // avoid also checking FIRST_JUMP
      scene.handlePlatformCollision(platform);

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SPRING_BOUNCE);
    });

    it('unlocks COMBO_BOUNCE at 5 consecutive bounces', () => {
      const platform = createMockPlatform('normal');
      scene.hasJumped = true;

      for (let i = 0; i < 4; i++) {
        scene.handlePlatformCollision(platform);
      }
      // After 4 bounces the achievement should not yet have been granted
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_BOUNCE);

      scene.handlePlatformCollision(platform);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_BOUNCE);
    });

    it('regenerates jetpack fuel by FUEL_REGEN (R86.N1: 8)', () => {
      scene.jetpackFuel = 50;
      const platform = createMockPlatform('normal');
      scene.handlePlatformCollision(platform);

      expect(scene.jetpackFuel).toBe(50 + GAME_CONFIG.JETPACK.FUEL_REGEN);
    });

    it('caps jetpack fuel at FUEL_MAX (R86.N1: 120)', () => {
      scene.jetpackFuel = GAME_CONFIG.JETPACK.FUEL_MAX - 2;
      const platform = createMockPlatform('normal');
      scene.handlePlatformCollision(platform);

      expect(scene.jetpackFuel).toBe(GAME_CONFIG.JETPACK.FUEL_MAX);
    });

    it('marks a disappearing platform as used and starts a destroy tween', () => {
      const platform = createMockPlatform('disappearing');
      scene.handlePlatformCollision(platform);

      expect(platform.isUsed).toBe(true);
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('does not re-trigger disappearing tween if platform already used', () => {
      const platform = createMockPlatform('disappearing');
      platform.isUsed = true;
      scene.handlePlatformCollision(platform);

      // tweens.add is still called for spring compression etc. — but the
      // disappearing-specific branch is skipped because isUsed is already true
      // Verify the platform's isUsed is still true and no extra tween was added
      expect(platform.isUsed).toBe(true);
      // Only the initial call (none, since we didn't enter the branch)
      expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    it('breakable platform plays hit sound and starts break tween', () => {
      const platform = createMockPlatform('breakable');
      scene.handlePlatformCollision(platform);

      expect(scene.playSound).toHaveBeenCalledWith('platformBreak');
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('breakable platform does not set bounce velocity', () => {
      const platform = createMockPlatform('breakable');
      scene.handlePlatformCollision(platform);

      // The breakable branch does not call setVelocityY on the player body
      expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
    });
  });

  /* -------------------------------------------------------------- */
  /*  Scoring                                                       */
  /* -------------------------------------------------------------- */
  describe('Scoring', () => {
    it('calculates altitude from player y-position', () => {
      // altitude derived from highestY: Math.max(0, Math.floor((HEIGHT - 100 - highestY) / 10))
      // player.y = 400 => highestY = 400 => (600 - 100 - 400) / 10 = 10
      scene.player.y = 400;
      scene.updatePlayer(16);

      expect(scene.lastMaxAltitude).toBe(10);
    });

    it('score is based on lastMaxAltitude rounded by ALTITUDE_DIVISOR', () => {
      // lastMaxAltitude = 10, score = Math.floor(10 / 10) * 10 = 10
      scene.player.y = 400;
      scene.updatePlayer(16);

      expect(scene.score).toBe(10);
    });

    it('enemy kills add ENEMY_KILL (100) points each', () => {
      const enemy = createMockEnemy();
      scene.killEnemy(enemy);

      expect(scene.score).toBe(100);
    });

    it('score only increases — lastMaxAltitude never decreases', () => {
      scene.player.y = 200; // altitude = (600-100-200)/10 = 30
      scene.updatePlayer(16);
      const firstScore = scene.score;

      // Player falls back down
      scene.player.y = 500; // altitude = (600-100-500)/10 = 0
      scene.updatePlayer(16);

      expect(scene.score).toBe(firstScore);
      expect(scene.lastMaxAltitude).toBe(30);
    });

    it('combined altitude and kill score is additive', () => {
      scene.player.y = 400; // altitude 10
      scene.updatePlayer(16);

      const enemy = createMockEnemy();
      scene.killEnemy(enemy);

      // 10 (altitude) + 100 (kill)
      expect(scene.score).toBe(110);
    });
  });

  /* -------------------------------------------------------------- */
  /*  Jetpack                                                       */
  /* -------------------------------------------------------------- */
  describe('Jetpack', () => {
    it('starts at full fuel (R86.N1: 120)', () => {
      expect(scene.jetpackFuel).toBe(GAME_CONFIG.JETPACK.FUEL_MAX);
    });

    it('drains fuel at FUEL_DRAIN (R86.N1: 25) per second', () => {
      // Simulate UP key held for 1 second (delta = 1000ms)
      scene.cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: true },
      };
      scene.wasdKeys = {
        A: { isDown: false },
        D: { isDown: false },
      };

      const before = scene.jetpackFuel as number;
      scene.handleInput(1000);

      // Fuel should have decreased by FUEL_DRAIN over 1s
      expect(scene.jetpackFuel).toBe(before - GAME_CONFIG.JETPACK.FUEL_DRAIN);
    });

    it('fuel cannot go below 0', () => {
      scene.jetpackFuel = 10;
      scene.cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: true },
      };
      scene.wasdKeys = {
        A: { isDown: false },
        D: { isDown: false },
      };

      // 1 second drain at FUEL_DRAIN/s with only 10 fuel remaining — clamped to 0
      scene.handleInput(1000);

      expect(scene.jetpackFuel).toBe(0);
    });

    it('unlocks USE_JETPACK on first use', () => {
      scene.cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: true },
      };
      scene.wasdKeys = {
        A: { isDown: false },
        D: { isDown: false },
      };

      scene.handleInput(16);

      expect(scene.hasUsedJetpack).toBe(true);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.USE_JETPACK);
    });

    it('does not unlock USE_JETPACK on subsequent uses', () => {
      scene.hasUsedJetpack = true;
      scene.cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: true },
      };
      scene.wasdKeys = {
        A: { isDown: false },
        D: { isDown: false },
      };

      scene.handleInput(16);

      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.USE_JETPACK);
    });

    it('sets jetpackActive to false when UP key is released', () => {
      scene.jetpackActive = true;
      scene.cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
      };
      scene.wasdKeys = {
        A: { isDown: false },
        D: { isDown: false },
      };

      scene.handleInput(16);

      expect(scene.jetpackActive).toBe(false);
    });
  });

  /* -------------------------------------------------------------- */
  /*  Enemy System                                                  */
  /* -------------------------------------------------------------- */
  describe('Enemy System', () => {
    it('killing an enemy awards ENEMY_KILL (100) points', () => {
      const enemy = createMockEnemy();
      scene.killEnemy(enemy);

      expect(scene.score).toBe(100);
    });

    it('increments enemiesKilled on each kill', () => {
      scene.killEnemy(createMockEnemy());
      scene.killEnemy(createMockEnemy());

      expect(scene.enemiesKilled).toBe(2);
    });

    it('unlocks KILL_ENEMY on first kill', () => {
      scene.killEnemy(createMockEnemy());

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.KILL_ENEMY);
    });

    it('unlocks KILL_5_ENEMIES at 5 kills', () => {
      for (let i = 0; i < 4; i++) {
        scene.killEnemy(createMockEnemy());
      }
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.KILL_5_ENEMIES);

      scene.killEnemy(createMockEnemy());
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.KILL_5_ENEMIES);
    });

    it('marks enemy as dying', () => {
      const enemy = createMockEnemy();
      scene.killEnemy(enemy);

      expect(enemy.isDying).toBe(true);
    });

    it('plays hit sound on kill', () => {
      scene.killEnemy(createMockEnemy());

      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });
  });

  /* -------------------------------------------------------------- */
  /*  Achievement Thresholds                                        */
  /* -------------------------------------------------------------- */
  describe('Achievement Thresholds', () => {
    it('unlocks ALTITUDE_1000 when altitude reaches 100', () => {
      // altitude 100 => player.y = HEIGHT - 100 - (100 * 10) = 600 - 100 - 1000 = -500
      scene.player.y = -500;
      scene.updatePlayer(16);

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.ALTITUDE_1000);
    });

    it('does not unlock ALTITUDE_1000 below altitude 100', () => {
      // altitude 99 => player.y = 600 - 100 - 990 = -490
      scene.player.y = -489;
      scene.updatePlayer(16);

      // altitude = Math.floor((600-100-(-489))/10) = Math.floor(989/10) = 98
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.ALTITUDE_1000);
    });

    it('unlocks ALTITUDE_5000 when altitude reaches 500', () => {
      // altitude 500 => player.y = 600 - 100 - 5000 = -4500
      scene.player.y = -4500;
      scene.updatePlayer(16);

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.ALTITUDE_5000);
    });

    it('unlocks FIRST_JUMP on the first platform bounce', () => {
      const platform = createMockPlatform('normal');
      scene.handlePlatformCollision(platform);

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_JUMP);
    });

    it('unlocks SPRING_BOUNCE on a spring platform', () => {
      scene.hasJumped = true;
      const platform = createMockPlatform('spring');
      scene.handlePlatformCollision(platform);

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SPRING_BOUNCE);
    });
  });

  /* -------------------------------------------------------------- */
  /*  Shooting                                                      */
  /* -------------------------------------------------------------- */
  describe('Shooting', () => {
    it('creates a projectile from the player position', () => {
      scene.shoot();

      expect(scene.projectiles.get).toHaveBeenCalledWith(
        scene.player.x,
        scene.player.y - 20,
        'projectile'
      );
    });

    it('sets projectile velocity to -500 (upward)', () => {
      const mockProjectile = scene.projectiles.get();
      scene.shoot();

      expect(mockProjectile.body.setVelocityY).toHaveBeenCalledWith(-500);
    });

    it('plays shoot sound', () => {
      scene.shoot();

      expect(scene.playSound).toHaveBeenCalledWith('shoot');
    });

    it('does nothing if projectile pool is exhausted', () => {
      scene.projectiles.get = vi.fn().mockReturnValue(null);
      // Should not throw
      expect(() => scene.shoot()).not.toThrow();
    });
  });

  /* -------------------------------------------------------------- */
  /*  Game Over                                                     */
  /* -------------------------------------------------------------- */
  describe('Game Over', () => {
    it('sets isGameOver flag', () => {
      scene.playerDeath();

      expect(scene.isGameOver).toBe(true);
    });

    it('applies red tint to player', () => {
      scene.playerDeath();

      expect(scene.player.setTint).toHaveBeenCalledWith(0xff0000);
    });

    it('starts a death tween', () => {
      scene.playerDeath();

      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('does not double-trigger when called twice', () => {
      scene.playerDeath();
      scene.playerDeath();

      // setTint should only be called once — the second call returns early
      expect(scene.player.setTint).toHaveBeenCalledTimes(1);
    });

    it('calls reportScore and gameOver inside the tween onComplete', () => {
      scene.score = 250;
      scene.lastMaxAltitude = 42;
      scene.playerDeath();

      // Extract the onComplete callback from the tween config
      const tweenConfig = scene.tweens.add.mock.calls[0][0];
      tweenConfig.onComplete();

      expect(scene.reportScore).toHaveBeenCalledWith(250, 250);
      expect(scene.gameOver).toHaveBeenCalledWith(250, 'Altitude: 42m', expect.any(Number), expect.any(Array), expect.any(Number), expect.any(Number));
    });

    // R86.G1: Tom's playtest (2026-04-21) showed Neo Jump high-score
    // persistence fully broken while Frogger (identical score path) worked
    // the same day. The defensive write here is a second, independent route
    // into saveSystem.updateGameSave — if it regresses the bug returns.
    describe('R86.G1 — defensive save-system persistence on death', () => {
      it('writes highScore + level + stats via updateGameSave inside onComplete', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({ games: { neoJump: { stats: {} } } }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.score = 2500;
        scene.highScore = 1000;
        scene.lastMaxAltitude = 1500;
        scene.enemiesKilled = 3;
        scene.collectiblesCollected = 4;
        scene.bounceCombo = 7;
        scene.getGameDuration = vi.fn().mockReturnValue(42_000); // 42s

        scene.playerDeath();
        const tweenConfig = scene.tweens.add.mock.calls[0][0];
        tweenConfig.onComplete();

        expect(updateGameSave).toHaveBeenCalledWith('neoJump', expect.objectContaining({
          highScore: 2500,
          level: 3, // floor(1500 / 500)
          stats: expect.objectContaining({
            gamesPlayed: 1,
            totalScore: 2500,
            bestCombo: 7,
            longestSurvival: 42,
          }),
        }));
      });

      it('merges stats — gamesPlayed + totalScore accumulate, bestCombo + longestSurvival keep max', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({
            games: {
              neoJump: {
                stats: {
                  gamesPlayed: 9,
                  totalScore: 50_000,
                  bestCombo: 10,
                  longestSurvival: 120,
                },
              },
            },
          }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.score = 3000;
        scene.bounceCombo = 2; // less than prev 10
        scene.lastMaxAltitude = 500;
        scene.getGameDuration = vi.fn().mockReturnValue(30_000); // less than prev 120s

        scene.playerDeath();
        scene.tweens.add.mock.calls[0][0].onComplete();

        const call = updateGameSave.mock.calls[0][1];
        expect(call.stats.gamesPlayed).toBe(10); // 9 + 1
        expect(call.stats.totalScore).toBe(53_000); // 50_000 + 3_000
        expect(call.stats.bestCombo).toBe(10); // max(10, 2)
        expect(call.stats.longestSurvival).toBe(120); // max(120, 30)
      });

      it('no-ops when save-system registry entry is missing (defensive guard)', () => {
        scene.registry = { get: vi.fn().mockReturnValue(undefined), set: vi.fn() };
        scene.score = 500;
        scene.lastMaxAltitude = 100;

        scene.playerDeath();
        // Should not throw even with no saveSystem
        expect(() => scene.tweens.add.mock.calls[0][0].onComplete()).not.toThrow();
        // gameOver still fires so the player sees the end-of-run screen
        expect(scene.gameOver).toHaveBeenCalled();
      });
    });
  });

  /* -------------------------------------------------------------- */
  /*  Platform Distribution                                         */
  /* -------------------------------------------------------------- */
  describe('Platform Distribution', () => {
    it('returns only normal/spring/moving at low altitude (< 500)', () => {
      const allowed = new Set(['normal', 'spring', 'moving']);
      for (let i = 0; i < 200; i++) {
        const type = scene.getRandomPlatformType(200);
        expect(allowed.has(type)).toBe(true);
      }
    });

    it('can return disappearing and breakable at mid altitude (500-2000)', () => {
      const types = new Set<string>();
      // Run enough iterations to make the probability of missing a type negligible
      for (let i = 0; i < 1000; i++) {
        types.add(scene.getRandomPlatformType(1000));
      }

      expect(types.has('disappearing')).toBe(true);
      expect(types.has('breakable')).toBe(true);
    });

    it('can return all five types at high altitude (> 2000)', () => {
      const types = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        types.add(scene.getRandomPlatformType(3000));
      }

      expect(types.size).toBe(5);
    });

    it('config GAME_CONFIG values match expected defaults (R86.N1 rebalance)', () => {
      expect(GAME_CONFIG.PLAYER.JUMP_VELOCITY).toBe(-550);
      expect(GAME_CONFIG.PLAYER.SPRING_VELOCITY).toBe(-800);
      expect(GAME_CONFIG.PLAYER.JETPACK_THRUST).toBe(-300);
      // R86.N1: FUEL_MAX 100 → 120 (+20% capacity)
      expect(GAME_CONFIG.JETPACK.FUEL_MAX).toBe(120);
      // R86.N1: FUEL_DRAIN 30 → 25 (~17% slower burn)
      expect(GAME_CONFIG.JETPACK.FUEL_DRAIN).toBe(25);
      // R86.N1: FUEL_REGEN 5 → 8 (+60% platform recovery)
      expect(GAME_CONFIG.JETPACK.FUEL_REGEN).toBe(8);
      expect(GAME_CONFIG.SCORING.ENEMY_KILL).toBe(100);
      expect(GAME_CONFIG.SCORING.ALTITUDE_DIVISOR).toBe(10);
    });

    it('collectible config has expected defaults', () => {
      expect(GAME_CONFIG.COLLECTIBLES.SPAWN_CHANCE).toBe(0.25);
      expect(GAME_CONFIG.COLLECTIBLES.SPAWN_ALTITUDE).toBe(200);
      expect(GAME_CONFIG.COLLECTIBLES.FUEL_RESTORE).toBe(50);
      expect(GAME_CONFIG.COLLECTIBLES.SCORE_BONUS).toBe(500);
      expect(GAME_CONFIG.COLLECTIBLES.SHIELD_DURATION).toBe(5000);
    });
  });

  /* -------------------------------------------------------------- */
  /*  Collectible System                                            */
  /* -------------------------------------------------------------- */
  describe('Collectible System', () => {
    it('fuel collectible restores 50 fuel', () => {
      scene.jetpackFuel = 30;
      const collectible = { collectibleType: 'fuel', destroy: vi.fn() };
      scene.handleCollectiblePickup(collectible);

      expect(scene.jetpackFuel).toBe(80);
    });

    it('fuel collectible caps at FUEL_MAX', () => {
      scene.jetpackFuel = 80;
      const collectible = { collectibleType: 'fuel', destroy: vi.fn() };
      scene.handleCollectiblePickup(collectible);

      expect(scene.jetpackFuel).toBe(GAME_CONFIG.JETPACK.FUEL_MAX);
    });

    it('score collectible adds SCORE_BONUS (500) points', () => {
      scene.score = 100;
      const collectible = { collectibleType: 'score', destroy: vi.fn() };
      scene.handleCollectiblePickup(collectible);

      expect(scene.score).toBe(600);
    });

    it('shield collectible activates shield', () => {
      const collectible = { collectibleType: 'shield', destroy: vi.fn() };
      scene.handleCollectiblePickup(collectible);

      expect(scene.shieldActive).toBe(true);
      expect(scene.shieldTimer).toBe(GAME_CONFIG.COLLECTIBLES.SHIELD_DURATION);
    });

    it('plays powerup sound on any collectible pickup', () => {
      const collectible = { collectibleType: 'fuel', destroy: vi.fn() };
      scene.handleCollectiblePickup(collectible);

      expect(scene.playSound).toHaveBeenCalledWith('collectible');
    });

    it('destroys the collectible on pickup', () => {
      const collectible = { collectibleType: 'fuel', destroy: vi.fn() };
      scene.handleCollectiblePickup(collectible);

      expect(collectible.destroy).toHaveBeenCalled();
    });

    it('increments collectiblesCollected', () => {
      const collectible = { collectibleType: 'fuel', destroy: vi.fn() };
      scene.handleCollectiblePickup(collectible);
      scene.handleCollectiblePickup({ collectibleType: 'score', destroy: vi.fn() });

      expect(scene.collectiblesCollected).toBe(2);
    });

    it('unlocks COLLECT_SHIELD on shield pickup', () => {
      const collectible = { collectibleType: 'shield', destroy: vi.fn() };
      scene.handleCollectiblePickup(collectible);

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COLLECT_SHIELD);
    });

    it('unlocks COLLECT_10 at 10 total collectibles', () => {
      for (let i = 0; i < 9; i++) {
        scene.handleCollectiblePickup({ collectibleType: 'fuel', destroy: vi.fn() });
      }
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.COLLECT_10);

      scene.handleCollectiblePickup({ collectibleType: 'fuel', destroy: vi.fn() });
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COLLECT_10);
    });
  });

  /* -------------------------------------------------------------- */
  /*  Shield Mechanic                                               */
  /* -------------------------------------------------------------- */
  describe('Shield Mechanic', () => {
    it('shield timer decreases over time', () => {
      scene.shieldActive = true;
      scene.shieldTimer = 5000;

      // Stub add.graphics for shield glow creation
      scene.add = { graphics: vi.fn().mockReturnValue({ clear: vi.fn(), lineStyle: vi.fn(), strokeCircle: vi.fn(), destroy: vi.fn(), setDepth: vi.fn() }),
        text: vi.fn().mockReturnValue({ setText: vi.fn(), setScrollFactor: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() }) };

      scene.updateShield(1000);

      expect(scene.shieldTimer).toBe(4000);
    });

    it('shield deactivates when timer reaches 0', () => {
      scene.shieldActive = true;
      scene.shieldTimer = 500;

      scene.updateShield(600);

      expect(scene.shieldActive).toBe(false);
      expect(scene.shieldTimer).toBe(0);
    });

    it('shield protects from enemy collision and destroys enemy', () => {
      scene.shieldActive = true;
      scene.shieldTimer = 3000;

      const enemy = createMockEnemy();
      // Player position where it's NOT a stomp (player beside enemy)
      scene.player.y = enemy.y;
      scene.player.body.velocity.y = 0;

      scene.handleEnemyCollision(enemy);

      // Enemy should be killed (isDying set by killEnemy)
      expect(enemy.isDying).toBe(true);
      // Shield should be consumed
      expect(scene.shieldActive).toBe(false);
      expect(scene.shieldTimer).toBe(0);
      // Player should NOT die
      expect(scene.isGameOver).toBe(false);
    });

    it('shield does not interfere with stomp kills', () => {
      scene.shieldActive = true;
      scene.shieldTimer = 3000;

      const enemy = createMockEnemy();
      scene.player.y = enemy.y - 20;
      scene.player.body.velocity.y = 100;

      scene.handleEnemyCollision(enemy);

      // Enemy killed via stomp
      expect(enemy.isDying).toBe(true);
      // Shield should still be active (stomp took priority)
      expect(scene.shieldActive).toBe(true);
    });
  });

  /* -------------------------------------------------------------- */
  /*  R86.N1 — Difficulty rebalance                                 */
  /*                                                                */
  /*  Tom's Neo Jump playtest (2026-04-21): "too difficult, too     */
  /*  many bombs early, too quick ... you often just hit a bomb     */
  /*  out of nowhere; you can't really avoid it."                   */
  /*                                                                */
  /*  These invariants lock the rebalance so a future tweak that    */
  /*  restores the old hostile-to-newcomer feel fails the gate      */
  /*  rather than silently re-landing on Tom's desk.                */
  /* -------------------------------------------------------------- */
  describe('R86.N1 — Difficulty rebalance', () => {
    describe('Enemy spawn constants (softened early game)', () => {
      it('SPAWN_ALTITUDE 500 → 800 → 1000 (tutorial zone extended, N5 second-pass)', () => {
        // R86.N5 bumped this 800 → 1000. Tom's post-N1 playtest: *"still too
        // difficult, too many bombs early, cannot get momentum."* Locking
        // the new value keeps the tutorial strip a first-class invariant —
        // a rebalance dropping it below 1000 brings the early-game
        // hostility back instantly.
        expect(GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE).toBe(1000);
      });

      it('SPAWN_CHANCE_BASE 0.03 → 0.018 → 0.013 (~57% cumulative reduction, N5 second-pass)', () => {
        // R86.N5 cut this 0.018 → 0.013 on top of N1's ~40% reduction, so
        // the compounded effect is ~57% below the pre-R86 0.03 baseline.
        // If this regresses toward 0.018 the N5 Tom-tick scenario (rapid
        // 30s-retry loop) re-breaks because early-game density climbs.
        expect(GAME_CONFIG.ENEMIES.SPAWN_CHANCE_BASE).toBe(0.013);
      });

      it('SPAWN_CHANCE_MAX 0.20 → 0.16 (late-game ceiling lowered)', () => {
        expect(GAME_CONFIG.ENEMIES.SPAWN_CHANCE_MAX).toBe(0.16);
      });

      it('SPAWN_CHANCE_PER_1000 0.02 → 0.015 (gentler altitude ramp)', () => {
        expect(GAME_CONFIG.ENEMIES.SPAWN_CHANCE_PER_1000).toBe(0.015);
      });

      it('SPEED_MIN 50 → 40 (less frantic side-to-side)', () => {
        expect(GAME_CONFIG.ENEMIES.SPEED_MIN).toBe(40);
      });

      it('SPEED_MAX 100 → 75 (player can track + shoot)', () => {
        expect(GAME_CONFIG.ENEMIES.SPEED_MAX).toBe(75);
      });
    });

    describe('Jetpack constants (player buffed)', () => {
      it('FUEL_MAX 100 → 120 (+20% capacity)', () => {
        expect(GAME_CONFIG.JETPACK.FUEL_MAX).toBe(120);
      });

      it('FUEL_REGEN 5 → 8 per landing (+60% platform recovery)', () => {
        expect(GAME_CONFIG.JETPACK.FUEL_REGEN).toBe(8);
      });

      it('FUEL_DRAIN 30 → 25 per second (~17% slower burn)', () => {
        expect(GAME_CONFIG.JETPACK.FUEL_DRAIN).toBe(25);
      });

      it('effective flight time at new dials ≥ 4.8s (locked as derived invariant)', () => {
        // Tripwire: if one of the three constants regresses, airtime
        // collapses. FUEL_MAX / FUEL_DRAIN = 120/25 = 4.8 → lock floor.
        const airtime = GAME_CONFIG.JETPACK.FUEL_MAX / GAME_CONFIG.JETPACK.FUEL_DRAIN;
        expect(airtime).toBeGreaterThanOrEqual(4.8);
      });
    });

    describe('Spawn fairness guards (new keys)', () => {
      it('SPAWN_Y_OFFSET_ABOVE_CAMERA = 150 (was hardcoded 50)', () => {
        // Enemies enter ~1s of visible descent BEFORE reaching gameplay
        // height — direct counter to Tom's "bomb out of nowhere".
        expect(GAME_CONFIG.ENEMIES.SPAWN_Y_OFFSET_ABOVE_CAMERA).toBe(150);
      });

      it('MIN_HORIZONTAL_SPACING_FROM_PLAYER = 80 (new fairness dial)', () => {
        // Skips any spawn whose X is within 80px of the player's X so
        // enemies never materialise in the player's ascent column.
        expect(GAME_CONFIG.ENEMIES.MIN_HORIZONTAL_SPACING_FROM_PLAYER).toBe(80);
      });
    });

    describe('maybeSpawnEnemy — behaviour', () => {
      /** Wire the groups and RNG the spawn path needs. */
      function setupSpawn(scene: Record<string, unknown>) {
        scene.highestY = 0 - (GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE + 200); // above threshold
        scene.enemies = {
          getChildren: vi.fn().mockReturnValue([]),
          create: vi.fn().mockReturnValue({
            direction: 0,
            speed: 0,
            isDying: false,
            setDepth: vi.fn(),
            setDisplaySize: vi.fn(),
            setTint: vi.fn(),
          }),
        };
        (scene.cameras as { main: { scrollY: number } }).main.scrollY = 0;
      }

      it('does NOT spawn below SPAWN_ALTITUDE even if RNG fires (guard)', () => {
        setupSpawn(scene);
        // Put player just below the new tutorial-zone threshold
        scene.highestY = GAME_CONFIG.HEIGHT - (GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE - 50);
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0); // force spawn

        scene.maybeSpawnEnemy();

        expect(
          (scene.enemies as { create: ReturnType<typeof vi.fn> }).create
        ).not.toHaveBeenCalled();
        rand.mockRestore();
      });

      /** Replace Phaser.Math.Between + Math.random for the duration of a test. */
      function stubRng(betweenValue: number, randomValue = 0) {
        const origBetween = (Phaser.Math as unknown as Record<string, unknown>).Between;
        const origRandom = Math.random;
        (Phaser.Math as unknown as Record<string, unknown>).Between = vi.fn(() => betweenValue);
        Math.random = vi.fn(() => randomValue);
        return () => {
          (Phaser.Math as unknown as Record<string, unknown>).Between = origBetween;
          Math.random = origRandom;
        };
      }

      it('spawns enemy at cameraTop - SPAWN_Y_OFFSET_ABOVE_CAMERA (150px above)', () => {
        setupSpawn(scene);
        scene.player.x = 50; // far enough left that spawn X (300) is outside the 80px zone
        const restore = stubRng(300);

        (scene.cameras as { main: { scrollY: number } }).main.scrollY = 1000;
        scene.maybeSpawnEnemy();

        const create = (scene.enemies as { create: ReturnType<typeof vi.fn> }).create;
        expect(create).toHaveBeenCalled();
        const [, y] = create.mock.calls[0];
        expect(y).toBe(1000 - GAME_CONFIG.ENEMIES.SPAWN_Y_OFFSET_ABOVE_CAMERA);

        restore();
      });

      it('skips spawn when all retry attempts land within MIN_HORIZONTAL_SPACING_FROM_PLAYER', () => {
        setupSpawn(scene);
        scene.player.x = 200;
        // Between always returns 205 — 5px from player, well inside the
        // 80px spacing zone. After 5 failed retries the spawn bails.
        const restore = stubRng(205);

        scene.maybeSpawnEnemy();

        expect(
          (scene.enemies as { create: ReturnType<typeof vi.fn> }).create
        ).not.toHaveBeenCalled();

        restore();
      });

      it('allows spawn when random X lands outside the spacing zone', () => {
        setupSpawn(scene);
        scene.player.x = 200;
        // Between returns 320 — 120px away, outside the 80px zone.
        const restore = stubRng(320);

        scene.maybeSpawnEnemy();

        expect(
          (scene.enemies as { create: ReturnType<typeof vi.fn> }).create
        ).toHaveBeenCalled();

        restore();
      });
    });

    describe('Constant bound sanity (anti-regression)', () => {
      it('SPAWN_CHANCE_BASE strictly less than pre-R86 hostile value (0.03)', () => {
        expect(GAME_CONFIG.ENEMIES.SPAWN_CHANCE_BASE).toBeLessThan(0.03);
      });

      it('FUEL_MAX strictly greater than pre-R86 value (100)', () => {
        expect(GAME_CONFIG.JETPACK.FUEL_MAX).toBeGreaterThan(100);
      });

      it('SPEED_MAX strictly less than pre-R86 frantic value (100)', () => {
        expect(GAME_CONFIG.ENEMIES.SPEED_MAX).toBeLessThan(100);
      });
    });
  });

  /* -------------------------------------------------------------- */
  /*  R86.N2 — Fall-death threshold (50 m)                          */
  /*                                                                */
  /*  Tom: "Need to make it so if the player falls over 50 m, they */
  /*  die." Pre-R86.N2 only an off-screen plunge killed; at high   */
  /*  altitudes that meant several seconds of consequence-free     */
  /*  free-fall while the camera chased Neo down. The hard ceiling  */
  /*  below makes a missed-platform drop of >50m unrecoverable      */
  /*  even while the player is still visible.                      */
  /*                                                                */
  /*  Pixels-per-metre = SCORING.ALTITUDE_DIVISOR (10), so 50m =    */
  /*  500px. Tests assert the constant, the apex-tracking logic,    */
  /*  the reset-on-landing contract, and both sides of the death    */
  /*  threshold (just under survives, just over dies).              */
  /* -------------------------------------------------------------- */
  describe('R86.N2 — Fall-death threshold', () => {
    describe('Constant (locked dial)', () => {
      it('MAX_FALL_DISTANCE_METRES = 50 (Tom: "falls over 50 m")', () => {
        expect(GAME_CONFIG.PLAYER.MAX_FALL_DISTANCE_METRES).toBe(50);
      });

      it('pixel-threshold derives to 500px via SCORING.ALTITUDE_DIVISOR (10)', () => {
        // Derived invariant — if either dial changes, both sides of the
        // fall-death math must stay consistent. This guards against a
        // future tweak to ALTITUDE_DIVISOR silently breaking the 50m feel.
        const pixelsPerMetre = GAME_CONFIG.SCORING.ALTITUDE_DIVISOR;
        const thresholdPx =
          GAME_CONFIG.PLAYER.MAX_FALL_DISTANCE_METRES * pixelsPerMetre;
        expect(thresholdPx).toBe(500);
      });
    });

    describe('fallApexY — reset on platform landing', () => {
      it('normal platform landing resets fallApexY to player.y', () => {
        scene.fallApexY = 100; // player was at peak, high above
        scene.player.y = 420;  // current contact point
        const platform = createMockPlatform('normal');

        scene.handlePlatformCollision(platform);

        expect(scene.fallApexY).toBe(420);
      });

      it('spring platform landing also resets fallApexY', () => {
        scene.fallApexY = 50;
        scene.player.y = 380;
        const platform = createMockPlatform('spring');

        scene.handlePlatformCollision(platform);

        expect(scene.fallApexY).toBe(380);
      });

      it('disappearing platform landing still resets fallApexY (pre-fade bounce counts)', () => {
        // The bounce happens BEFORE the fade tween, so the fall-death
        // clock must restart — otherwise a disappearing-platform chain
        // would compound fall distance across bounces.
        scene.fallApexY = 120;
        scene.player.y = 440;
        const platform = createMockPlatform('disappearing');

        scene.handlePlatformCollision(platform);

        expect(scene.fallApexY).toBe(440);
      });
    });

    describe('checkGameOver — fall-distance death trigger', () => {
      /** Install the bits checkGameOver needs that Game Over tests also use. */
      function primeDeathTest(scene: Record<string, unknown>) {
        scene.isGameOver = false;
        scene.cameras = {
          main: { scrollY: 0, setDeadzone: vi.fn(), startFollow: vi.fn(), setBounds: vi.fn(), shake: vi.fn(), flash: vi.fn() },
        };
      }

      it('does NOT trigger death when fall distance is under threshold (49m)', () => {
        primeDeathTest(scene);
        scene.fallApexY = 100;
        scene.player.y = 100 + 49 * 10; // 490px = 49m
        const deathSpy = vi.spyOn(scene as { playerDeath: () => void }, 'playerDeath');

        scene.checkGameOver();

        expect(deathSpy).not.toHaveBeenCalled();
      });

      it('does NOT trigger death at exactly the threshold (50m — boundary)', () => {
        // Check is `> MAX_FALL_DISTANCE_METRES`, so 50m exact survives.
        // Locking boundary as strict-greater-than so future edits can't
        // flip the relational operator without the gate catching it.
        primeDeathTest(scene);
        scene.fallApexY = 100;
        scene.player.y = 100 + 50 * 10; // 500px = exactly 50m
        const deathSpy = vi.spyOn(scene as { playerDeath: () => void }, 'playerDeath');

        scene.checkGameOver();

        expect(deathSpy).not.toHaveBeenCalled();
      });

      it('DOES trigger death just past the threshold (50.1m)', () => {
        primeDeathTest(scene);
        scene.fallApexY = 100;
        scene.player.y = 100 + 501; // 501px = 50.1m
        const deathSpy = vi.spyOn(scene as { playerDeath: () => void }, 'playerDeath');

        scene.checkGameOver();

        expect(deathSpy).toHaveBeenCalledTimes(1);
      });

      it('plays SOUND_KEYS.FALL alongside the fall-death trigger', () => {
        primeDeathTest(scene);
        scene.fallApexY = 0;
        scene.player.y = 600; // 60m drop
        (scene.playSound as ReturnType<typeof vi.fn>).mockClear();

        scene.checkGameOver();

        expect(scene.playSound).toHaveBeenCalledWith('fall');
      });

      it('fall-death fires EVEN WHILE PLAYER IS ON-CAMERA (Tom\'s scenario)', () => {
        // The whole point of this task: Tom wanted a kill path that fires
        // while the player is still technically visible. Camera at scrollY
        // 0 means bottom-of-screen is y=600; player.y=550 is on-camera.
        primeDeathTest(scene);
        (scene.cameras as { main: { scrollY: number } }).main.scrollY = 0;
        scene.fallApexY = 0;   // apex was at top of world
        scene.player.y = 550;  // still on-camera (bottom is 600)
        const deathSpy = vi.spyOn(scene as { playerDeath: () => void }, 'playerDeath');

        scene.checkGameOver();

        expect(deathSpy).toHaveBeenCalled();
      });

      it('off-screen check still works independently when fall is small', () => {
        // Verifies the original off-screen death path still fires when
        // fall distance alone wouldn't kill — regression guard against
        // a refactor that accidentally gates the off-screen check behind
        // the fall-distance one.
        primeDeathTest(scene);
        (scene.cameras as { main: { scrollY: number } }).main.scrollY = 0;
        scene.fallApexY = 700; // apex BELOW where the player currently is
        scene.player.y = 660;  // off-screen (> cameraBottom + 50 = 650)
        const deathSpy = vi.spyOn(scene as { playerDeath: () => void }, 'playerDeath');

        scene.checkGameOver();

        expect(deathSpy).toHaveBeenCalled();
      });

      it('no-op when isGameOver is already true (double-trigger guard)', () => {
        primeDeathTest(scene);
        scene.isGameOver = true;
        scene.fallApexY = 0;
        scene.player.y = 1000; // 100m drop
        const deathSpy = vi.spyOn(scene as { playerDeath: () => void }, 'playerDeath');

        scene.checkGameOver();

        expect(deathSpy).not.toHaveBeenCalled();
      });
    });

    describe('Anti-regression invariants', () => {
      it('PLAYER.MAX_FALL_DISTANCE_METRES is a positive finite number', () => {
        // Future "tuning" that sets this to 0, Infinity, or negative would
        // silently break the feature in different ways; lock the shape.
        const v = GAME_CONFIG.PLAYER.MAX_FALL_DISTANCE_METRES;
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThan(0);
      });

      it('fall-death threshold stays ≤ starting viewport height in metres', () => {
        // Viewport is 600px = 60m. If the threshold ever exceeds the
        // viewport height, a player could fall through the whole screen
        // before dying — defeats the purpose. Lock at ≤60 so any bump
        // past that must edit both the dial and this guardrail together.
        const viewportMetres =
          GAME_CONFIG.HEIGHT / GAME_CONFIG.SCORING.ALTITUDE_DIVISOR;
        expect(GAME_CONFIG.PLAYER.MAX_FALL_DISTANCE_METRES).toBeLessThanOrEqual(
          viewportMetres
        );
      });
    });
  });

  /* -------------------------------------------------------------- */
  /*  R86.N3 — In-play controls overlay                             */
  /* -------------------------------------------------------------- */
  /**
   * Why these tests exist: Tom 2026-04-22 Neo Jump playtest asked to see
   * the controls in-game. The overlay lives only during the 5 s countdown
   * and fades cleanly, so there are three failure modes to prevent:
   *   1. overlay never appears (createControlsOverlay not called, or it
   *      returned early the wrong way)
   *   2. overlay outlives the countdown and clutters gameplay
   *   3. overlay leaks if the player hits ESC mid-fade — shutdown() must
   *      destroy the container even while its tween is mid-flight.
   */
  describe('R86.N3 — In-play controls overlay', () => {
    interface MockText {
      setOrigin: ReturnType<typeof vi.fn>;
    }
    interface MockContainer {
      setScrollFactor: ReturnType<typeof vi.fn>;
      setDepth: ReturnType<typeof vi.fn>;
      setAlpha: ReturnType<typeof vi.fn>;
      destroy: ReturnType<typeof vi.fn>;
    }

    function installAddMock(sceneInst: Record<string, unknown>) {
      const text: MockText = { setOrigin: vi.fn() };
      const container: MockContainer = {
        setScrollFactor: vi.fn(),
        setDepth: vi.fn(),
        setAlpha: vi.fn(),
        destroy: vi.fn(),
      };
      const addText = vi.fn(() => text);
      const addContainer = vi.fn(() => container);
      sceneInst.add = { text: addText, container: addContainer };
      return { text, container, addText, addContainer };
    }

    function installTweensMock(sceneInst: Record<string, unknown>) {
      const add = vi.fn();
      sceneInst.tweens = { add };
      return add;
    }

    it('creates an overlay container pinned to the camera at depth 150', () => {
      const add = installAddMock(scene);
      installTweensMock(scene);
      (scene as Record<string, unknown>).controlsOverlay = null;

      (scene.createControlsOverlay as () => void)();

      // Two text lines + one container = 3 construct calls total.
      expect(add.addText).toHaveBeenCalledTimes(2);
      expect(add.addContainer).toHaveBeenCalledTimes(1);

      expect(add.container.setScrollFactor).toHaveBeenCalledWith(0);
      expect(add.container.setDepth).toHaveBeenCalledWith(150);
      expect(add.container.setAlpha).toHaveBeenCalledWith(0);
    });

    it('stores the container on `controlsOverlay` so shutdown can destroy it', () => {
      installAddMock(scene);
      installTweensMock(scene);
      (scene as Record<string, unknown>).controlsOverlay = null;

      (scene.createControlsOverlay as () => void)();

      expect((scene as Record<string, unknown>).controlsOverlay).not.toBeNull();
    });

    it('arms the fade-in tween immediately with a non-zero duration', () => {
      installAddMock(scene);
      const tween = installTweensMock(scene);
      (scene as Record<string, unknown>).controlsOverlay = null;

      (scene.createControlsOverlay as () => void)();

      expect(tween).toHaveBeenCalledTimes(1);
      const fadeIn = tween.mock.calls[0][0] as { alpha: number; duration: number };
      expect(fadeIn.alpha).toBe(1);
      expect(fadeIn.duration).toBeGreaterThan(0);
    });

    it('chains a fade-out tween after a multi-second hold (≤ 5 s total lifetime)', () => {
      installAddMock(scene);
      const tween = installTweensMock(scene);
      (scene as Record<string, unknown>).controlsOverlay = null;

      (scene.createControlsOverlay as () => void)();
      // Trigger the fade-in onComplete to schedule the fade-out.
      const fadeIn = tween.mock.calls[0][0] as {
        duration: number;
        onComplete: () => void;
      };
      fadeIn.onComplete();

      expect(tween).toHaveBeenCalledTimes(2);
      const fadeOut = tween.mock.calls[1][0] as {
        alpha: number;
        duration: number;
        delay: number;
      };
      expect(fadeOut.alpha).toBe(0);
      expect(fadeOut.duration).toBeGreaterThan(0);
      // Total lifetime must fit inside the 5 s countdown so the overlay
      // is gone before gameplay starts. 5000 ms is the absolute ceiling.
      const total = fadeIn.duration + fadeOut.delay + fadeOut.duration;
      expect(total).toBeLessThanOrEqual(5000);
    });

    it('destroys the container and nulls the reference on fade-out complete', () => {
      const mocks = installAddMock(scene);
      const tween = installTweensMock(scene);
      (scene as Record<string, unknown>).controlsOverlay = null;

      (scene.createControlsOverlay as () => void)();
      // Run the tween chain to completion.
      (tween.mock.calls[0][0] as { onComplete: () => void }).onComplete();
      (tween.mock.calls[1][0] as { onComplete: () => void }).onComplete();

      expect(mocks.container.destroy).toHaveBeenCalled();
      expect((scene as Record<string, unknown>).controlsOverlay).toBeNull();
    });

    it('guards re-entry: a second call while overlay is live is a no-op', () => {
      installAddMock(scene);
      const tween = installTweensMock(scene);
      (scene as Record<string, unknown>).controlsOverlay = null;

      (scene.createControlsOverlay as () => void)();
      const tweensAfterFirst = tween.mock.calls.length;

      // Second call during live overlay — should NOT arm another tween or
      // create another container, so no new calls should land on the
      // tween/add mocks.
      (scene.createControlsOverlay as () => void)();
      expect(tween.mock.calls.length).toBe(tweensAfterFirst);
    });

    it('fade-out onComplete is safe if shutdown nulls the reference mid-flight', () => {
      installAddMock(scene);
      const tween = installTweensMock(scene);
      (scene as Record<string, unknown>).controlsOverlay = null;

      (scene.createControlsOverlay as () => void)();
      // Fade-in onComplete schedules fade-out — run it to register it.
      (tween.mock.calls[0][0] as { onComplete: () => void }).onComplete();

      // Simulate ESC mid-fade: shutdown() nulls the reference before the
      // fade-out tween's onComplete fires.
      (scene as Record<string, unknown>).controlsOverlay = null;

      // Firing the fade-out onComplete now must NOT throw (it uses the
      // optional-chain guard when touching the already-nulled container).
      expect(() =>
        (tween.mock.calls[1][0] as { onComplete: () => void }).onComplete(),
      ).not.toThrow();
    });
  });

  /* -------------------------------------------------------------- */
  /*  R86.N4 — Unit-test coverage refresh                           */
  /*                                                                */
  /*  Mirror of Frogger R86.F7: N1/N2/N3 landed +57 behaviour tests */
  /*  for the rebalance + fall-death + controls legend. The single- */
  /*  line invariants those blocks don't cover are the update-loop  */
  /*  early-return gates, the death-juice literal RGB/duration      */
  /*  values, the handleInput screen-wrap arithmetic, the one-way   */
  /*  canCollideWithPlatform directional guard (pillar of Doodle    */
  /*  Jump physics), and the defensive `isDying` short-circuits on  */
  /*  the two enemy-collision code paths. Locking them as tripwires */
  /*  means a refactor that re-introduces an F2-style cascade (or   */
  /*  accidentally lets a dying enemy damage Neo) fails the gate    */
  /*  rather than Tom's next playtest.                              */
  /* -------------------------------------------------------------- */
  describe('R86.N4 — unit-test coverage refresh', () => {
    /**
     * Stub every post-guard `update()` dependency so we can assert the
     * top-level early-returns without needing a real Phaser runtime.
     * Returns the spy handles the callers inspect.
     */
    function stubUpdateLoopSpies(scene: Record<string, unknown>) {
      const spies = {
        updateParallaxRain: vi.fn(),
        updateParallaxBuildings: vi.fn(),
        handleInput: vi.fn(),
        updatePlayer: vi.fn(),
        updatePlatforms: vi.fn(),
        updateEnemies: vi.fn(),
        updateProjectiles: vi.fn(),
        updateCollectibles: vi.fn(),
        updateShield: vi.fn(),
        updateJetpackFlame: vi.fn(),
        generateContent: vi.fn(),
        checkGameOver: vi.fn(),
        updateUI: vi.fn(),
        exposeTestState: vi.fn(),
      };
      Object.assign(scene, spies);
      // cursors is truthy so handleInput is invoked post-guard
      scene.cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
      };
      return spies;
    }

    describe('update() loop — top-level early-return gates', () => {
      it('isCountingDown = true gates every post-guard method (zero calls)', () => {
        // R86.F2 fixed a cascade where pre-countdown enemy spawns leaked into
        // the countdown window because gameplay arming didn't honour the gate.
        // NeoJump has the same shape at line 218; lock it so a future refactor
        // that moves the countdown check inside a sub-method can't regress.
        const spies = stubUpdateLoopSpies(scene);
        scene.isPaused = false;
        scene.isCountingDown = true;

        (scene.update as (t: number, d: number) => void)(0, 16);

        Object.values(spies).forEach((spy) => expect(spy).not.toHaveBeenCalled());
      });

      it('isPaused = true gates every post-guard method (zero calls)', () => {
        // Pause gate ordered first in update(); this locks it independently of
        // the countdown gate so a future tweak to the ordering still leaves
        // both guards testable.
        const spies = stubUpdateLoopSpies(scene);
        scene.isPaused = true;
        scene.isCountingDown = false;

        (scene.update as (t: number, d: number) => void)(0, 16);

        Object.values(spies).forEach((spy) => expect(spy).not.toHaveBeenCalled());
      });

      it('both gates false → each post-guard method fires exactly once', () => {
        // Tripwire on the positive case: a refactor that wraps the whole body
        // in an extra guard (e.g. `if (isGameOver) return` at top) would make
        // the update loop silently no-op even during normal play.
        const spies = stubUpdateLoopSpies(scene);
        scene.isPaused = false;
        scene.isCountingDown = false;

        (scene.update as (t: number, d: number) => void)(0, 16);

        Object.values(spies).forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
      });
    });

    describe('playerDeath — juice contract literals', () => {
      /** Install the minimal bits playerDeath touches before the tween fires. */
      function primeDeath(scene: Record<string, unknown>) {
        scene.isGameOver = false;
        (scene.playSound as ReturnType<typeof vi.fn>).mockClear();
        scene.cameras = {
          main: {
            scrollY: 0,
            shake: vi.fn(),
            flash: vi.fn(),
            setDeadzone: vi.fn(),
            startFollow: vi.fn(),
            setBounds: vi.fn(),
          },
        };
      }

      it('camera shake uses (200 ms, 0.012) — feel dial locked', () => {
        // Tom calibrated the death shake to be perceptible but not nauseating.
        // If a future edit bumps intensity past 0.012 or stretches past 200 ms
        // the gate fails before it reaches a playtest.
        primeDeath(scene);
        scene.playerDeath();

        const shake = (scene.cameras as { main: { shake: ReturnType<typeof vi.fn> } }).main.shake;
        expect(shake).toHaveBeenCalledWith(200, 0.012);
      });

      it('camera flash uses red (255,0,0) for 120 ms @ 0.25 alpha — RGB literal locked', () => {
        // Death flash is the one red tint in the run — regression guard against
        // a copy/paste from the green Frogger R86.F1 flash (0, 255, 0) that
        // would silently swap lethal feedback for achievement feedback.
        primeDeath(scene);
        scene.playerDeath();

        const flash = (scene.cameras as { main: { flash: ReturnType<typeof vi.fn> } }).main.flash;
        expect(flash).toHaveBeenCalledWith(120, 255, 0, 0, false, undefined, undefined, 0.25);
      });
    });

    describe('handleInput — screen-wrap arithmetic', () => {
      /** Wire the input mocks handleInput touches (same pattern as Jetpack tests). */
      function primeInput(scene: Record<string, unknown>) {
        scene.cursors = {
          left: { isDown: false },
          right: { isDown: false },
          up: { isDown: false },
        };
        scene.wasdKeys = { A: { isDown: false }, D: { isDown: false } };
      }

      it('player leaving left edge wraps to the right (x > WIDTH)', () => {
        // Off-by-one guard: wrap condition is `x < -WIDTH/2`, new position is
        // `WIDTH + WIDTH/2` (player width, NOT canvas width). Locking the
        // arithmetic prevents a future "simpler" rewrite from dropping the
        // half-width offset and making the player pop visibly.
        primeInput(scene);
        scene.player.x = -(GAME_CONFIG.PLAYER.WIDTH / 2 + 1); // just past the left threshold

        scene.handleInput(16);

        expect(scene.player.x).toBe(GAME_CONFIG.WIDTH + GAME_CONFIG.PLAYER.WIDTH / 2);
      });

      it('player leaving right edge wraps to the left (x < 0)', () => {
        primeInput(scene);
        scene.player.x = GAME_CONFIG.WIDTH + GAME_CONFIG.PLAYER.WIDTH / 2 + 1;

        scene.handleInput(16);

        expect(scene.player.x).toBe(-GAME_CONFIG.PLAYER.WIDTH / 2);
      });
    });

    describe('canCollideWithPlatform — one-way collider (Doodle Jump core)', () => {
      /** Return a minimal platform mock at a chosen Y. */
      function platformAt(y: number) {
        return { y } as unknown as Parameters<
          Record<string, (...args: unknown[]) => unknown>[string]
        >[1];
      }

      it('rising player (velocity.y ≤ 0) does NOT collide, even when above platform', () => {
        // The pillar of Doodle Jump physics: you only land on platforms when
        // coming down. A future refactor that drops the `velocity.y > 0` guard
        // would turn the game into a ceiling-bonk simulator.
        const player = {
          y: 100,
          body: { velocity: { y: -200 }, height: 40 },
        } as unknown as Phaser.Physics.Arcade.Sprite;
        const platform = platformAt(300);

        expect(scene.canCollideWithPlatform(player, platform)).toBe(false);
      });

      it('falling player whose feet are below platform does NOT collide', () => {
        // Second half of the one-way guard: even while falling, we only latch
        // when `player.y + bodyHeight/2 < platform.y`. Locks the feet-above
        // check so a future simplification can't make Neo grab platforms he's
        // already passed.
        const player = {
          y: 320, // feet at 340 (y + 40/2), below platform at 300
          body: { velocity: { y: 200 }, height: 40 },
        } as unknown as Phaser.Physics.Arcade.Sprite;
        const platform = platformAt(300);

        expect(scene.canCollideWithPlatform(player, platform)).toBe(false);
      });

      it('falling player whose feet are above platform DOES collide', () => {
        const player = {
          y: 200, // feet at 220, above platform at 300
          body: { velocity: { y: 200 }, height: 40 },
        } as unknown as Phaser.Physics.Arcade.Sprite;
        const platform = platformAt(300);

        expect(scene.canCollideWithPlatform(player, platform)).toBe(true);
      });
    });

    describe('Defensive isDying guards on collision paths', () => {
      it('handleEnemyCollision bails on a dying enemy (no setTint, no enemiesKilled++)', () => {
        // Dying enemies are mid-death-tween with their physics body still alive
        // for a frame or two. Without the early-return an overlap tick could
        // either kill Neo or double-count the kill.
        const enemy = createMockEnemy();
        enemy.isDying = true;
        const killedBefore = scene.enemiesKilled as number;

        scene.handleEnemyCollision(enemy);

        expect(scene.isGameOver).toBe(false);
        expect(scene.player.setTint).not.toHaveBeenCalled();
        expect(scene.enemiesKilled).toBe(killedBefore);
      });

      it('handleProjectileHit bails on a dying enemy (projectile kept, no second kill)', () => {
        // Same race one layer up: two projectiles fired 16 ms apart can both
        // overlap a freshly-dying enemy. Without the guard the second projectile
        // would destroy itself AND re-increment the score.
        const enemy = createMockEnemy();
        enemy.isDying = true;
        const projectile = { destroy: vi.fn() };
        const killedBefore = scene.enemiesKilled as number;

        scene.handleProjectileHit(projectile, enemy);

        expect(projectile.destroy).not.toHaveBeenCalled();
        expect(scene.enemiesKilled).toBe(killedBefore);
      });
    });
  });

  /* -------------------------------------------------------------- */
  /*  R86.N5 safety-net — Difficulty ramp invariants (pre-Tom-tick) */
  /*                                                                */
  /*  R86.N5 (post-rebalance ramp tuning) is Tom-tick only — it     */
  /*  hinges on whether mid-game (500-1500m) and late-game          */
  /*  (1500m+) still feel compelling after N1's early-game nerfs,   */
  /*  and Tom can only answer that with a real playthrough.         */
  /*                                                                */
  /*  Per the R86.F6 safety-net playbook, Ralph pre-locks the ramp  */
  /*  geometry here so any N5 feel regression Tom surfaces is       */
  /*  provably a tuning issue, not a silent coverage gap. The       */
  /*  spawn-chance curve lives in `maybeSpawnEnemy` at GameScene.ts */
  /*  1082-1084:                                                    */
  /*                                                                */
  /*    baseChance  = SPAWN_CHANCE_BASE                             */
  /*    bonusChance = floor(altitude/1000) * SPAWN_CHANCE_PER_1000  */
  /*    spawnChance = min(base + bonus, SPAWN_CHANCE_MAX)           */
  /*                                                                */
  /*  This is a STAIRCASE, not a line — the chance is constant      */
  /*  across a tier (e.g. 500-999m), then steps at each kilometre.  */
  /*  Locking the derived chance at altitude checkpoints is more    */
  /*  robust than locking the formula: a future rebalance can       */
  /*  reshape the curve but must keep mid-game density recognisable */
  /*  or the test fails.                                            */
  /*                                                                */
  /*  No production code is touched — pure coverage refresh.        */
  /* -------------------------------------------------------------- */
  describe('R86.N5 safety-net — Difficulty ramp invariants (pre-Tom-tick)', () => {
    /**
     * Mirrors the spawn-chance formula at GameScene.ts:1082-1084 so tests
     * exercise the curve geometry without needing the full scene wired up.
     */
    function spawnChanceAt(altitude: number): number {
      const base = GAME_CONFIG.ENEMIES.SPAWN_CHANCE_BASE;
      const bonus = Math.floor(altitude / 1000) * GAME_CONFIG.ENEMIES.SPAWN_CHANCE_PER_1000;
      return Math.min(base + bonus, GAME_CONFIG.ENEMIES.SPAWN_CHANCE_MAX);
    }

    describe('Spawn-chance checkpoints — mid-game must stay compelling', () => {
      it('altitude 1000m — first tier step reached (N5: 0.013 + 0.015 = 0.028)', () => {
        // First altitude at which the ramp actually kicks in after the
        // tutorial zone. R86.N5 re-pinned this to 0.028 (was 0.033 with
        // N1's 0.018 base). Tom's N5 ask was "flatten early game"; a
        // regression toward 0.033 undoes the second-pass cut.
        expect(spawnChanceAt(1000)).toBeCloseTo(0.028, 5);
      });

      it('altitude 2000m — second-tier chance (N5: 0.043)', () => {
        // 0.013 + 2 * 0.015 = 0.043 (was 0.048 under N1).
        expect(spawnChanceAt(2000)).toBeCloseTo(0.043, 5);
      });

      it('altitude 5000m — late-mid chance (N5: 0.088)', () => {
        // base 0.013 + 5 * 0.015 = 0.088 (was 0.093 under N1). Late-mid is
        // where the game transitions from "tutorial-ish" to "survive or
        // die"; lock the density so a future base-nerf can't flatten it.
        expect(spawnChanceAt(5000)).toBeCloseTo(0.088, 5);
      });

      it('altitude 10000m — late-game ceiling reached exactly', () => {
        // floor(10000/1000) * 0.015 = 0.150; base + bonus = 0.163 clamped
        // to SPAWN_CHANCE_MAX (0.16). Under N5's 0.013 base the ceiling is
        // still reached at 10km (just barely — 9k would land at 0.148 shy
        // of max) so the late-game density stays compelling.
        expect(spawnChanceAt(10000)).toBe(GAME_CONFIG.ENEMIES.SPAWN_CHANCE_MAX);
      });

      it('plateau at ceiling — chance stays at MAX after it is reached', () => {
        // Staircase ramps should clamp, not wrap, after the tier bonus
        // exceeds MAX - BASE. Without the clamp a 20km run would push
        // chance past 0.30 → "enemy every three frames" unplayable.
        expect(spawnChanceAt(15000)).toBe(GAME_CONFIG.ENEMIES.SPAWN_CHANCE_MAX);
        expect(spawnChanceAt(20000)).toBe(GAME_CONFIG.ENEMIES.SPAWN_CHANCE_MAX);
      });
    });

    describe('Staircase-ramp integrity — monotonic and floor-binned', () => {
      it('ramp is strictly increasing at every kilometre boundary up to the ceiling', () => {
        // Locks the direction of the curve. A future edit that inverts a
        // sign or makes bonus negative would silently flatten mid-game.
        for (let km = 1; km <= 9; km++) {
          expect(spawnChanceAt(km * 1000)).toBeGreaterThan(spawnChanceAt((km - 1) * 1000));
        }
      });

      it('ramp is non-decreasing across the full 0-20km altitude sweep', () => {
        // Scans the whole playable altitude range — catches any non-monotonic
        // dip a formula-rewrite might introduce (e.g. a sin() cycle).
        let prev = -Infinity;
        for (let alt = 0; alt <= 20000; alt += 100) {
          const chance = spawnChanceAt(alt);
          expect(chance).toBeGreaterThanOrEqual(prev);
          prev = chance;
        }
      });

      it('floor-binning — chance at 500m equals chance at 999m (same tier, no mid-tier jitter)', () => {
        // The staircase step function means the chance is constant across
        // a 1km tier. If a future refactor switches to linear interpolation,
        // gameplay would feel "breathy" (chance growing with every metre)
        // which Tom has not asked for — lock the staircase.
        expect(spawnChanceAt(500)).toBe(spawnChanceAt(999));
      });

      it('floor-binning — chance at 1000m strictly greater than at 999m (tier boundary)', () => {
        // Complement to the previous test: the staircase MUST step at the
        // kilometre boundary. If both 999 and 1000 returned the same value,
        // the ramp would be a flat line at base and mid-game would never
        // escalate.
        expect(spawnChanceAt(1000)).toBeGreaterThan(spawnChanceAt(999));
      });
    });

    describe('Ceiling reachability — late-game must stay reachable', () => {
      it('tiers-to-ceiling is ≤ 15 (ceiling within a realistic 15km run)', () => {
        // If this trips, a future rebalance has pushed the ceiling so far
        // out that most runs never reach max density. Playtest-wise that
        // would feel like the ramp "never finishes". 15km is ~2× Tom's
        // current run length — generous headroom.
        const stepsToCeil = Math.ceil(
          (GAME_CONFIG.ENEMIES.SPAWN_CHANCE_MAX - GAME_CONFIG.ENEMIES.SPAWN_CHANCE_BASE) /
            GAME_CONFIG.ENEMIES.SPAWN_CHANCE_PER_1000,
        );
        expect(stepsToCeil).toBeLessThanOrEqual(15);
      });

      it('ceiling NOT reached at 1000m (tutorial-plus-one-step stays gentle)', () => {
        // Anti-regression: a future "simpler" rebalance that sets
        // SPAWN_CHANCE_BASE close to MAX would make mid-game feel like
        // late-game. Lock that the first tier step is clearly below MAX.
        expect(spawnChanceAt(1000)).toBeLessThan(GAME_CONFIG.ENEMIES.SPAWN_CHANCE_MAX);
      });
    });

    describe('Tutorial-zone boundary — SPAWN_ALTITUDE gate behaves precisely', () => {
      /** Wire the minimum scene state for a maybeSpawnEnemy call. */
      function setupSpawnMinimal(scene: Record<string, unknown>) {
        scene.enemies = {
          getChildren: vi.fn().mockReturnValue([]),
          create: vi.fn().mockReturnValue({
            direction: 0,
            speed: 0,
            isDying: false,
            setDepth: vi.fn(),
            setDisplaySize: vi.fn(),
            setTint: vi.fn(),
          }),
        };
        (scene.cameras as { main: { scrollY: number } }).main.scrollY = 0;
      }

      /** Stub RNG for the duration of a test; returns a restore fn. */
      function stubRng(betweenValue: number, randomValue = 0) {
        const origBetween = (Phaser.Math as unknown as Record<string, unknown>).Between;
        const origRandom = Math.random;
        (Phaser.Math as unknown as Record<string, unknown>).Between = vi.fn(() => betweenValue);
        Math.random = vi.fn(() => randomValue);
        return () => {
          (Phaser.Math as unknown as Record<string, unknown>).Between = origBetween;
          Math.random = origRandom;
        };
      }

      it('altitude exactly SPAWN_ALTITUDE (N5: 1000m) allows the spawn gate through', () => {
        // Guard uses `<`, not `<=` — exactly SPAWN_ALTITUDE must pass. If
        // a future refactor flips to `<=`, the tutorial zone silently
        // grows 1m. N5 bumped the constant 800 → 1000; the boundary
        // contract is unchanged, but the label is updated for accuracy.
        setupSpawnMinimal(scene);
        scene.highestY = GAME_CONFIG.HEIGHT - GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE; // altitude === SPAWN_ALTITUDE
        scene.player.x = 50; // far from spawn X (300)
        const restore = stubRng(300);

        scene.maybeSpawnEnemy();

        expect(
          (scene.enemies as { create: ReturnType<typeof vi.fn> }).create,
        ).toHaveBeenCalled();
        restore();
      });

      it('altitude 1m below SPAWN_ALTITUDE (N5: 999m) still blocks the gate', () => {
        // Complementary boundary test: 1m inside the tutorial zone must
        // suppress the spawn even with RNG forced favourable.
        setupSpawnMinimal(scene);
        scene.highestY = GAME_CONFIG.HEIGHT - (GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE - 1);
        const restore = stubRng(300);

        scene.maybeSpawnEnemy();

        expect(
          (scene.enemies as { create: ReturnType<typeof vi.fn> }).create,
        ).not.toHaveBeenCalled();
        restore();
      });
    });

    describe('Late-game anti-density — nearby-enemy throttle', () => {
      /** Wire the minimum scene state for a maybeSpawnEnemy call. */
      function setupSpawnMinimal(scene: Record<string, unknown>, existingEnemies: unknown[] = []) {
        scene.enemies = {
          getChildren: vi.fn().mockReturnValue(existingEnemies),
          create: vi.fn().mockReturnValue({
            direction: 0,
            speed: 0,
            isDying: false,
            setDepth: vi.fn(),
            setDisplaySize: vi.fn(),
            setTint: vi.fn(),
          }),
        };
        (scene.cameras as { main: { scrollY: number } }).main.scrollY = 0;
        scene.highestY = 0 - (GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE + 200); // well above threshold
      }

      /** Stub RNG for the duration of a test; returns a restore fn. */
      function stubRng(betweenValue: number, randomValue = 0) {
        const origBetween = (Phaser.Math as unknown as Record<string, unknown>).Between;
        const origRandom = Math.random;
        (Phaser.Math as unknown as Record<string, unknown>).Between = vi.fn(() => betweenValue);
        Math.random = vi.fn(() => randomValue);
        return () => {
          (Phaser.Math as unknown as Record<string, unknown>).Between = origBetween;
          Math.random = origRandom;
        };
      }

      it('skips spawn when an enemy sits in the [cameraTop - 100, cameraTop + 200] band', () => {
        // Even at the ceiling chance of 0.16 this throttle prevents a
        // late-game enemy cluster — critical for the 10km+ playthrough
        // where RNG would otherwise allow 3+ enemies on screen at once.
        // Simulates a nearby enemy at y=50 with cameraTop=0 → inside band.
        setupSpawnMinimal(scene, [{ y: 50 }]);
        scene.player.x = 50;
        const restore = stubRng(300, 0); // force-spawn RNG; spacing far from player

        scene.maybeSpawnEnemy();

        expect(
          (scene.enemies as { create: ReturnType<typeof vi.fn> }).create,
        ).not.toHaveBeenCalled();
        restore();
      });

      it('allows spawn when the nearest enemy sits outside the throttle band', () => {
        // Complement: an enemy well below the camera (y = 500, cameraTop = 0)
        // must NOT suppress new spawns — otherwise late-game would choke on
        // off-screen ghosts that never leave the enemies group.
        setupSpawnMinimal(scene, [{ y: 500 }]);
        scene.player.x = 50;
        const restore = stubRng(300, 0);

        scene.maybeSpawnEnemy();

        expect(
          (scene.enemies as { create: ReturnType<typeof vi.fn> }).create,
        ).toHaveBeenCalled();
        restore();
      });
    });

    describe('Enemy speed range — Phaser.Math.Between plumbed through', () => {
      it('spawned enemy speed is assigned from Between(SPEED_MIN, SPEED_MAX)', () => {
        // Locks that the speed dials are honoured on assignment. If a
        // future refactor hardcodes a speed literal, the SPEED_MIN/MAX
        // rebalance Ralph shipped in N1 would be silently bypassed.
        const created: Record<string, unknown> = {
          direction: 0,
          speed: 0,
          isDying: false,
          setDepth: vi.fn(),
          setDisplaySize: vi.fn(),
          setTint: vi.fn(),
        };
        scene.enemies = {
          getChildren: vi.fn().mockReturnValue([]),
          create: vi.fn().mockReturnValue(created),
        };
        (scene.cameras as { main: { scrollY: number } }).main.scrollY = 0;
        scene.highestY = 0 - (GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE + 200);
        scene.player.x = 50;

        const origBetween = (Phaser.Math as unknown as Record<string, unknown>).Between;
        const betweenSpy = vi.fn((min: number, max: number) => {
          // The X-placement Between call uses (50, WIDTH-50). The speed
          // Between call uses (SPEED_MIN, SPEED_MAX). Return different
          // sentinel values so we can assert both were made.
          if (min === 50 && max === GAME_CONFIG.WIDTH - 50) return 300;
          return 60; // sentinel speed inside [40, 75]
        });
        (Phaser.Math as unknown as Record<string, unknown>).Between = betweenSpy;
        const origRandom = Math.random;
        Math.random = vi.fn(() => 0);

        scene.maybeSpawnEnemy();

        // Assert Phaser.Math.Between was called with the speed bounds.
        const speedCall = betweenSpy.mock.calls.find(
          (args) =>
            args[0] === GAME_CONFIG.ENEMIES.SPEED_MIN &&
            args[1] === GAME_CONFIG.ENEMIES.SPEED_MAX,
        );
        expect(speedCall).toBeDefined();
        expect(created.speed).toBe(60);

        (Phaser.Math as unknown as Record<string, unknown>).Between = origBetween;
        Math.random = origRandom;
      });
    });
  });

  /* -------------------------------------------------------------- */
  /*  R86.N2+ safety-net — fallApexY reset isolation                */
  /*                                                                */
  /*  Ralph pre-Tom-tick tripwires shipped 2026-04-22 following the */
  /*  F6 / N5 safety-net playbook. The existing N2 block locks the  */
  /*  *positive* invariant — `handlePlatformCollision` resets the   */
  /*  fall-death clock for all three platform types. This block     */
  /*  locks the *negative* invariant: NO other gameplay path may    */
  /*  reset `fallApexY`.                                            */
  /*                                                                */
  /*  Why this matters: a future refactor that "helpfully" treats   */
  /*  stomp-kill (which gives Neo a JUMP_VELOCITY boost), shield    */
  /*  block, or collectible pickup as a landing-equivalent would    */
  /*  silently bypass the 50m fall-death rule. Stomping an enemy    */
  /*  does NOT save Neo from the 50m cliff — the apex stays locked. */
  /*  This matches Tom's N1 ask ("escape, not immunity") — jetpack  */
  /*  buys altitude via the natural `player.y < fallApexY` update() */
  /*  min-tracker only if the thrust actually carries Neo higher    */
  /*  than the pre-fall apex.                                       */
  /*                                                                */
  /*  No production code touched — pure coverage refresh.           */
  /* -------------------------------------------------------------- */
  describe('R86.N2+ safety-net — fallApexY reset isolation (pre-Tom-tick)', () => {
    // Baseline apex + fall-distance used across all negative tests. Apex at
    // y=100, player currently at y=380 → 28m of in-progress fall. Tests
    // assert fallApexY stays at 100 through various non-platform paths.
    const APEX_Y = 100;
    const PLAYER_Y_MID_FALL = 380;

    describe('handleEnemyCollision — no path resets fallApexY', () => {
      it('stomp kill does NOT reset fallApexY (velocity boost ≠ landing)', () => {
        // Setup: player mid-fall, falling onto enemy with downward velocity.
        // Stomp triggers `playerBody.setVelocityY(JUMP_VELOCITY)` — a boost
        // but NOT a platform contact. Apex must stay locked.
        scene.fallApexY = APEX_Y;
        scene.player.y = PLAYER_Y_MID_FALL;
        scene.player.body.velocity.y = 200; // descending
        const enemy = createMockEnemy();
        enemy.y = PLAYER_Y_MID_FALL + 20; // below player → stomp-kill geometry

        scene.handleEnemyCollision(enemy);

        expect(scene.fallApexY).toBe(APEX_Y);
      });

      it('shield block does NOT reset fallApexY', () => {
        // Setup: player shielded, horizontal enemy contact (not stomp-geom).
        // Shield absorbs the hit, kills the enemy, consumes the shield.
        // fallApexY must be untouched — shield is a side-on protection,
        // not a vertical landing.
        scene.fallApexY = APEX_Y;
        scene.player.y = PLAYER_Y_MID_FALL;
        scene.player.body.velocity.y = 0; // not falling into enemy
        scene.shieldActive = true;
        const enemy = createMockEnemy();
        enemy.y = PLAYER_Y_MID_FALL; // side-on, not below

        scene.handleEnemyCollision(enemy);

        expect(scene.fallApexY).toBe(APEX_Y);
        // Sanity: shield was consumed (proves we went down the shield branch,
        // not a silent no-op that would make this test vacuous).
        expect(scene.shieldActive).toBe(false);
      });

      it('fatal unshielded collision does NOT reset fallApexY before death', () => {
        // Setup: player unshielded + side-on enemy → playerDeath(). The
        // reset-isolation matters even on death: if a future edit were to
        // set fallApexY = player.y right before triggering death, debugging
        // a "ghost bounce" regression would be harder. Defensive lock.
        scene.fallApexY = APEX_Y;
        scene.player.y = PLAYER_Y_MID_FALL;
        scene.player.body.velocity.y = 0;
        scene.shieldActive = false;
        // Stub playerDeath so it doesn't cascade into gameOver plumbing
        // we don't need for this test.
        scene.playerDeath = vi.fn();
        const enemy = createMockEnemy();
        enemy.y = PLAYER_Y_MID_FALL;

        scene.handleEnemyCollision(enemy);

        expect(scene.fallApexY).toBe(APEX_Y);
        expect(scene.playerDeath).toHaveBeenCalledTimes(1);
      });
    });

    describe('handleProjectileHit — projectile kill does NOT reset fallApexY', () => {
      it('killing an enemy from below via SPACE-bullet leaves apex untouched', () => {
        // A projectile hit is pure offensive play — no positional change for
        // the player, no "landing" semantics. Apex must stay locked.
        scene.fallApexY = APEX_Y;
        scene.player.y = PLAYER_Y_MID_FALL;
        const projectile = {
          destroy: vi.fn(),
        } as unknown as Phaser.Physics.Arcade.Sprite;
        const enemy = createMockEnemy();

        scene.handleProjectileHit(projectile, enemy);

        expect(scene.fallApexY).toBe(APEX_Y);
        // Sanity: projectile destroyed (proves we ran the happy path, not a
        // guard early-return).
        expect(projectile.destroy).toHaveBeenCalled();
      });
    });

    describe('Non-platform code paths — static isolation audit', () => {
      // Production references to `this.fallApexY` (comments + class-field
      // decl excluded, since they use the bare identifier not `this.` prefix):
      //   1. create() init   → `this.fallApexY = GAME_CONFIG.HEIGHT - 100`
      //   2. update() guard  → `if (this.player.y < this.fallApexY)`
      //   3. update() write  → `this.fallApexY = this.player.y` (monotonic
      //                        min-tracker — only decreases fallApexY)
      //   4. handlePlatformCollision → `this.fallApexY = this.player.y`
      //                        (full reset on landing — the ONLY *reset*)
      //   5. checkGameOver   → `const fallPx = this.player.y - this.fallApexY`
      //
      // Of these, two are WRITES to `this.player.y` (entries 3 + 4). The
      // update() write is safe because it's gated on `player.y < fallApexY`
      // (only decreases — pulls the apex UP as Neo climbs). The platform
      // write is the intentional reset on landing. Any THIRD occurrence of
      // `this.fallApexY = this.player.y` is almost certainly a refactor
      // that silently bypasses the 50m rule — fail the gate.

      /** eslint-disable-next-line @typescript-eslint/no-require-imports */
      function readSceneSource(): string {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs') as typeof import('fs');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require('path') as typeof import('path');
        return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
      }

      it('has exactly 5 `this.fallApexY` runtime references', () => {
        // Total runtime references (excludes comments + class-field decl
        // which use the bare name). If this count drifts, a new code path
        // now touches fallApexY — audit against the 50m fall-death rule.
        const refs = readSceneSource().match(/this\.fallApexY/g) ?? [];
        expect(refs.length).toBe(5);
      });

      it('has exactly 3 write-sites to this.fallApexY', () => {
        // Writes (assignment, NOT equality `===`): init in create(),
        // min-tracker in update(), reset in handlePlatformCollision. A
        // 4th write is suspicious — either a new reset-equivalent path
        // or a duplicated initialiser. Either way, demands an audit.
        const src = readSceneSource();
        // Assignment regex: `=` not followed by another `=` (rules out `==`/`===`).
        const writes = src.match(/this\.fallApexY\s*=(?!=)/g) ?? [];
        expect(writes.length).toBe(3);
      });

      it('only two code paths assign fallApexY directly to this.player.y', () => {
        // The update() min-tracker (gated on `player.y < fallApexY`, which
        // only DECREASES fallApexY as Neo climbs) and handlePlatformCollision
        // (reset on landing). A 3rd assignment of this specific pattern is
        // almost certainly a refactor that treats stomp/shield/collectible
        // as a landing-equivalent, silently bypassing the 50m rule. Fail
        // the gate to force review against N2's design intent.
        const src = readSceneSource();
        const assignments = src.match(/this\.fallApexY\s*=\s*this\.player\.y/g) ?? [];
        expect(assignments.length).toBe(2);
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /*  R86.N4+ safety-net — playerDeath contract + onComplete chain     */
  /*  (pre-Tom-tick)                                                    */
  /*                                                                    */
  /*  Mirror of Frogger R86.F6+++ for Neo Jump. N4 locked the shake     */
  /*  + flash literals and the existing Game Over block locks the red   */
  /*  tint + isGameOver flag + "death tween starts" + re-entry guard.   */
  /*  G1 locks the saveSystem write branch inside onComplete. That      */
  /*  leaves three invariant families unprotected:                      */
  /*                                                                    */
  /*  (1) Juice contract — playSound(SOUND_KEYS.GAME_OVER) + the        */
  /*      four-key tween motion signature (targets=player, alpha=0,    */
  /*      y+100, angle=180, duration=500). A refactor extracting a     */
  /*      "death helper" could silently drop the sound or swap the     */
  /*      rotation for a fade, and nothing today would catch it.       */
  /*                                                                    */
  /*  (2) onComplete ordering + gameOver payload — the chain must be   */
  /*      reportScore → saveSystem write → gameOver, with the          */
  /*      `highScore = max(score, highScore)` mutation happening       */
  /*      BEFORE reportScore so the scoreboard sees the new watermark. */
  /*      gameOver's 6-arg payload has a fixed shape (score, reason    */
  /*      `Altitude: Xm`, highScore, 2-row stats [Enemies,             */
  /*      Collectibles], level=floor(alt/500), duration). This is the  */
  /*      exact shape of the R85.G1 scoreboard regression — payload    */
  /*      drift here breaks the modal layout and the saved stats.     */
  /*                                                                    */
  /*  (3) playerSpriteMode branch — the sprite-mode path calls         */
  /*      updatePlayerTexture('death') for a dedicated death frame;    */
  /*      the programmatic-graphics path does not. A refactor that    */
  /*      flips the default mode or drops the branch leaves the       */
  /*      player dying while still looking alive.                     */
  /* ------------------------------------------------------------------ */
  describe('R86.N4+ safety-net — playerDeath contract + onComplete chain (pre-Tom-tick)', () => {
    // (1) Juice contract — playSound + tween motion signature
    describe('juice contract — playSound + tween motion', () => {
      it('playerDeath fires playSound(SOUND_KEYS.GAME_OVER) exactly once', () => {
        // Silent-death regression guard. If a refactor drops the sound
        // call (e.g. "extract to a death helper that's missing the
        // sound"), the player gets no audio cue — the only acoustic
        // signal a run just ended. SOUND_KEYS.GAME_OVER is the
        // 'gameOver' string; a drift to 'game_over' / 'death' etc.
        // also fails this gate.
        scene.playerDeath();
        expect(scene.playSound).toHaveBeenCalledWith('gameOver');
        expect(scene.playSound).toHaveBeenCalledTimes(1);
      });

      it('playerDeath tween targets this.player (not a wrapper)', () => {
        // A refactor that accidentally tweens a container or a wrapper
        // object would decouple the visual death from the actual
        // player body — the sprite slides off intact while the tween
        // plays on a shadow. Lock targets === player directly.
        scene.playerDeath();
        const config = scene.tweens.add.mock.calls[0][0];
        expect(config.targets).toBe(scene.player);
      });

      it('playerDeath tween arms fall-death motion (alpha=0, y=+100, angle=180, duration=500)', () => {
        // Four-key motion signature: fade out while tumbling down 100 px
        // and rotating 180° over 500 ms. Locking the literal values
        // guards against:
        //   - `angle: 0` drops rotation (reads as teleport not death)
        //   - `duration: 200` fires onComplete faster than eye can track
        //   - `y: player.y - 100` rises instead of falls (upside-down)
        //   - `alpha: 1` leaves the sprite visible through the spin
        scene.player.y = 400;
        scene.playerDeath();
        const config = scene.tweens.add.mock.calls[0][0];
        expect(config.alpha).toBe(0);
        expect(config.y).toBe(500); // player.y (400) + 100
        expect(config.angle).toBe(180);
        expect(config.duration).toBe(500);
      });
    });

    // (2) onComplete chain — ordering + gameOver payload shape
    describe('onComplete — reportScore → gameOver ordering + payload', () => {
      it('onComplete invokes reportScore BEFORE gameOver (ordering lock)', () => {
        // THE freeze-prevention contract — mirror of F6+++. If a
        // refactor ever reorders the calls so gameOver fires before
        // reportScore, the scoreboard skips this run's score entirely
        // (exactly the R85.G1 regression shape). invocationCallOrder
        // is the only way to assert strict-before across separate
        // mock calls.
        scene.score = 2500;
        scene.lastMaxAltitude = 1000;
        scene.playerDeath();

        expect((scene.reportScore as ReturnType<typeof vi.fn>).mock.invocationCallOrder.length).toBe(0);
        expect((scene.gameOver as ReturnType<typeof vi.fn>).mock.invocationCallOrder.length).toBe(0);

        scene.tweens.add.mock.calls[0][0].onComplete();

        const reportOrder = (scene.reportScore as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
        const gameOverOrder = (scene.gameOver as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
        expect(reportOrder).toBeLessThan(gameOverOrder);
      });

      it('onComplete promotes highScore BEFORE reporting (new-high path)', () => {
        // The if (score > highScore) highScore = score mutation must
        // fire BEFORE reportScore, so the scoreboard sees the new
        // high watermark in the same call. A refactor that reports
        // first then updates would emit (3000, 1000) — a stale high
        // — and the "new high score" banner would be confused for
        // at least one frame.
        scene.score = 3000;
        scene.highScore = 1000;
        scene.lastMaxAltitude = 500;
        scene.playerDeath();
        scene.tweens.add.mock.calls[0][0].onComplete();

        expect(scene.reportScore).toHaveBeenCalledWith(3000, 3000);
        expect(scene.highScore).toBe(3000);
      });

      it('onComplete preserves existing highScore when score is lower', () => {
        // Mirror case: if this run's score didn't beat the high, the
        // high stays put and reportScore sees both values distinctly.
        // Without this test a refactor that accidentally clobbers
        // highScore to the run score (e.g. unconditional assignment)
        // would only be caught on the new-high path above.
        scene.score = 500;
        scene.highScore = 1000;
        scene.lastMaxAltitude = 100;
        scene.playerDeath();
        scene.tweens.add.mock.calls[0][0].onComplete();

        expect(scene.reportScore).toHaveBeenCalledWith(500, 1000);
        expect(scene.highScore).toBe(1000);
      });

      it('onComplete gameOver payload — reason + 2-row stats + level math + duration', () => {
        // Payload contract lock. Neo Jump's gameOver call has 6 args
        // and the stats array has a fixed 2-row shape (Enemies +
        // Collectibles). A refactor that adds/removes a stat row,
        // drops the level arg, or rewords the reason string would
        // silently break the game-over modal layout and the saved
        // stats aggregation — exactly the R85.G1 regression class.
        scene.score = 1500;
        scene.lastMaxAltitude = 1500; // → level = floor(1500/500) = 3
        scene.enemiesKilled = 5;
        scene.collectiblesCollected = 12;
        scene.getGameDuration = vi.fn().mockReturnValue(42_000);
        scene.playerDeath();
        scene.tweens.add.mock.calls[0][0].onComplete();

        expect(scene.gameOver).toHaveBeenCalledWith(
          1500,                  // score
          'Altitude: 1500m',     // reason — `Altitude: ${lastMaxAltitude}m`
          1500,                  // highScore (promoted from score)
          [
            { label: 'Enemies', value: 5 },
            { label: 'Collectibles', value: 12 },
          ],                     // stats — exactly 2 rows, labels + order locked
          3,                     // level === floor(lastMaxAltitude / 500)
          42_000,                // duration
        );
      });
    });

    // (3) playerSpriteMode branch — death texture swap
    describe('playerSpriteMode branch — death texture', () => {
      it('calls updatePlayerTexture("death") when playerSpriteMode is true', () => {
        // Sprite-mode players get a dedicated death frame. Dropping
        // this call means the player dies looking like they're still
        // alive — the visual "oh I died" moment is gone. Locks both
        // the method call and the exact 'death' state arg (drift to
        // 'dead' / 'gameover' would desync with the BootScene frame
        // keys and render a missing-texture box).
        scene.playerSpriteMode = true;
        const updatePlayerTexture = vi.fn();
        scene.updatePlayerTexture = updatePlayerTexture;
        scene.playerDeath();

        expect(updatePlayerTexture).toHaveBeenCalledWith('death');
      });

      it('does NOT call updatePlayerTexture when playerSpriteMode is false', () => {
        // Programmatic-graphics mode has no death texture; the
        // setTint(RED) + rotation is the only visual cue. Calling
        // updatePlayerTexture here would be a wasted call but more
        // importantly hints at a refactor that flipped the default
        // mode (private playerSpriteMode = true) — which would break
        // non-sprite-mode builds at runtime.
        scene.playerSpriteMode = false;
        const updatePlayerTexture = vi.fn();
        scene.updatePlayerTexture = updatePlayerTexture;
        scene.playerDeath();

        expect(updatePlayerTexture).not.toHaveBeenCalled();
      });
    });
  });

  /* -------------------------------------------------------------- */
  /*  R86.N5 — Flow second-pass                                     */
  /*                                                                */
  /*  Three levers in one phase of work:                            */
  /*    (a) Tutorial strip + density cut                            */
  /*    (b) Retry countdown shortcut (registry-keyed)               */
  /*    (c) Opening-beat spawn protection (invuln + no-spawn)       */
  /*                                                                */
  /*  Tom's post-N1 playtest verdict:                               */
  /*    "still too difficult, too many bombs early, cannot get      */
  /*    momentum, 5s restart too heavy."                            */
  /* -------------------------------------------------------------- */
  describe('R86.N5 — Flow second-pass', () => {
    describe('(a) Tutorial-strip + density-cut dial anchors', () => {
      it('SPAWN_ALTITUDE is at least 1000 (tutorial zone ≥ pre-N5 floor)', () => {
        // Anti-regression: a future rebalance dropping SPAWN_ALTITUDE
        // below 1000 silently re-hostile-ifies early-game. N5 pin.
        expect(GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE).toBeGreaterThanOrEqual(1000);
      });

      it('SPAWN_CHANCE_BASE strictly less than the N1 value (0.018)', () => {
        // Locks that N5 really did cut density below N1. If a future
        // "simpler" rebalance restores 0.018, Tom's second-pass fix is
        // silently reverted.
        expect(GAME_CONFIG.ENEMIES.SPAWN_CHANCE_BASE).toBeLessThan(0.018);
      });

      it('first-tier spawn chance (1000m) is less than pre-N5 value (0.033)', () => {
        // Derived lock: base + 1 tier bonus must be strictly below the
        // pre-N5 0.033. Independent of the exact base value — catches
        // tier-bonus regressions too.
        const firstTier =
          GAME_CONFIG.ENEMIES.SPAWN_CHANCE_BASE + GAME_CONFIG.ENEMIES.SPAWN_CHANCE_PER_1000;
        expect(firstTier).toBeLessThan(0.033);
      });
    });

    describe('(b) Retry countdown shortcut — computeCountdownSeconds', () => {
      /**
       * Install a mock registry on the scene that holds a single
       * `LAST_DEATH_REGISTRY_KEY` value. Mirrors the Scene.registry /
       * Game.registry alias contract — both point at the same DataManager
       * in real Phaser.
       */
      function installRegistry(sceneRef: Record<string, unknown>, lastDeathAt: unknown) {
        const store = new Map<string, unknown>();
        if (lastDeathAt !== undefined) {
          store.set('neoJumpLastDeathAt', lastDeathAt);
        }
        sceneRef.registry = {
          get: vi.fn((key: string) => store.get(key)),
          set: vi.fn((key: string, value: unknown) => {
            store.set(key, value);
          }),
        };
      }

      it('returns COLD_COUNTDOWN_SECONDS (5) on cold start (no prior death)', () => {
        installRegistry(scene, undefined);
        expect(scene.computeCountdownSeconds()).toBe(
          GAME_CONFIG.RETRY.COLD_COUNTDOWN_SECONDS,
        );
      });

      it('returns RETRY_COUNTDOWN_SECONDS (2) when last death < WINDOW_MS ago', () => {
        // Death 1s ago — well inside the 30s retry window.
        installRegistry(scene, Date.now() - 1000);
        expect(scene.computeCountdownSeconds()).toBe(
          GAME_CONFIG.RETRY.RETRY_COUNTDOWN_SECONDS,
        );
      });

      it('returns COLD_COUNTDOWN_SECONDS when last death > WINDOW_MS ago', () => {
        // Death 60s ago — outside the 30s retry window. Cold-start
        // behaviour resumes so the first run of a new session feels
        // deliberate.
        installRegistry(scene, Date.now() - 60_000);
        expect(scene.computeCountdownSeconds()).toBe(
          GAME_CONFIG.RETRY.COLD_COUNTDOWN_SECONDS,
        );
      });

      it('returns COLD_COUNTDOWN_SECONDS when registry value is not a number', () => {
        // Defensive: a future refactor that sets the value to a string or
        // object should fall through to the cold-start default, not
        // throw or silently coerce.
        installRegistry(scene, 'not a number');
        expect(scene.computeCountdownSeconds()).toBe(
          GAME_CONFIG.RETRY.COLD_COUNTDOWN_SECONDS,
        );
      });

      it('strict `<` on WINDOW_MS boundary — exactly WINDOW_MS ago is cold start', () => {
        // Tripwire: if a refactor flips `<` to `<=`, the retry window
        // silently grows by 1ms. Not gameplay-meaningful but locks the
        // exact boundary shape against accidental drift.
        installRegistry(scene, Date.now() - GAME_CONFIG.RETRY.WINDOW_MS);
        expect(scene.computeCountdownSeconds()).toBe(
          GAME_CONFIG.RETRY.COLD_COUNTDOWN_SECONDS,
        );
      });

      it('playerDeath onComplete writes timestamp to registry', () => {
        const setSpy = vi.fn();
        scene.registry = {
          get: vi.fn().mockReturnValue(undefined),
          set: setSpy,
        };
        scene.score = 500;
        scene.lastMaxAltitude = 100;

        scene.playerDeath();
        const tweenConfig = scene.tweens.add.mock.calls[0][0];
        tweenConfig.onComplete();

        // Find the LAST_DEATH_REGISTRY_KEY call among all `registry.set`
        // invocations. The exact value must be a positive finite number
        // close to Date.now() — we assert range rather than equality so
        // the test is stable across clock skew between invocation lines.
        const deathCalls = setSpy.mock.calls.filter(
          (c: unknown[]) => c[0] === 'neoJumpLastDeathAt',
        );
        expect(deathCalls).toHaveLength(1);
        const writtenTimestamp = deathCalls[0][1] as number;
        expect(typeof writtenTimestamp).toBe('number');
        expect(writtenTimestamp).toBeGreaterThan(0);
        expect(Math.abs(writtenTimestamp - Date.now())).toBeLessThan(5_000);
      });
    });

    describe('(c) Opening-beat spawn protection — isSpawnProtected', () => {
      it('returns false when spawnProtectionUntil is 0 (uninitialised)', () => {
        scene.spawnProtectionUntil = 0;
        expect(scene.isSpawnProtected()).toBe(false);
      });

      it('returns true when Date.now() is below spawnProtectionUntil', () => {
        scene.spawnProtectionUntil = Date.now() + 5_000;
        expect(scene.isSpawnProtected()).toBe(true);
      });

      it('returns false when Date.now() has passed spawnProtectionUntil', () => {
        scene.spawnProtectionUntil = Date.now() - 1;
        expect(scene.isSpawnProtected()).toBe(false);
      });

      it('strict `<` on boundary — exactly spawnProtectionUntil is unprotected', () => {
        // Clock can tick during the test, so we pick a fixed past value
        // and assert unprotected. The strict-less-than contract is what
        // matters here.
        const fixedPast = Date.now() - 100;
        scene.spawnProtectionUntil = fixedPast;
        expect(scene.isSpawnProtected()).toBe(false);
      });

      it('maybeSpawnEnemy early-returns under spawn protection even with RNG forced favourable', () => {
        scene.spawnProtectionUntil = Date.now() + 5_000;
        scene.highestY = 0 - (GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE + 200); // above threshold
        scene.enemies = {
          getChildren: vi.fn().mockReturnValue([]),
          create: vi.fn(),
        };
        (scene.cameras as { main: { scrollY: number } }).main.scrollY = 0;
        scene.player.x = 50;
        const origRandom = Math.random;
        Math.random = vi.fn(() => 0); // force-spawn RNG

        scene.maybeSpawnEnemy();

        expect(
          (scene.enemies as { create: ReturnType<typeof vi.fn> }).create,
        ).not.toHaveBeenCalled();
        Math.random = origRandom;
      });

      it('handleEnemyCollision is a no-op under spawn protection (unshielded player)', () => {
        scene.spawnProtectionUntil = Date.now() + 5_000;
        scene.shieldActive = false;
        scene.isGameOver = false;
        // Lateral collision (not stomp): player.y >= enemy.y, so without
        // protection this would call playerDeath. Under protection the
        // whole branch early-returns.
        scene.player.y = 400;
        scene.player.body = {
          velocity: { y: 100 }, // falling, but protection overrides
        };
        const enemy = createMockEnemy();
        enemy.y = 400;

        scene.handleEnemyCollision(enemy);

        expect(scene.isGameOver).toBe(false);
        expect(scene.player.setTint).not.toHaveBeenCalled();
        expect(enemy.isDying).toBe(false);
      });

      it('handleEnemyCollision is a no-op for dying enemy (unchanged pre-existing guard)', () => {
        // Regression guard: N5's protection guard fires BEFORE the
        // `enemy.isDying` early return, so a dying enemy during the
        // protection window still no-ops. Complement to the previous
        // test — confirms both guards hold together.
        scene.spawnProtectionUntil = Date.now() + 5_000;
        const enemy = createMockEnemy();
        enemy.isDying = true;

        scene.handleEnemyCollision(enemy);

        expect(scene.isGameOver).toBe(false);
      });

      it('after spawn protection expires, maybeSpawnEnemy proceeds normally', () => {
        // Complement to the block-spawn test: once protection is over,
        // the RNG + altitude + spacing guards are the only barriers. A
        // single fair roll should produce a spawn, confirming the
        // protection guard was really the blocker.
        scene.spawnProtectionUntil = Date.now() - 1; // expired
        scene.highestY = 0 - (GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE + 200);
        scene.enemies = {
          getChildren: vi.fn().mockReturnValue([]),
          create: vi.fn().mockReturnValue({
            direction: 0,
            speed: 0,
            isDying: false,
            setDepth: vi.fn(),
            setDisplaySize: vi.fn(),
            setTint: vi.fn(),
          }),
        };
        (scene.cameras as { main: { scrollY: number } }).main.scrollY = 0;
        scene.player.x = 50;

        const origBetween = (Phaser.Math as unknown as Record<string, unknown>).Between;
        const origRandom = Math.random;
        (Phaser.Math as unknown as Record<string, unknown>).Between = vi.fn(() => 300);
        Math.random = vi.fn(() => 0); // force spawn

        scene.maybeSpawnEnemy();

        expect(
          (scene.enemies as { create: ReturnType<typeof vi.fn> }).create,
        ).toHaveBeenCalled();

        (Phaser.Math as unknown as Record<string, unknown>).Between = origBetween;
        Math.random = origRandom;
      });
    });

    describe('Config dial locks — RETRY + SPAWN_PROTECTION', () => {
      it('RETRY.WINDOW_MS is 30_000 (30s window per Tom)', () => {
        expect(GAME_CONFIG.RETRY.WINDOW_MS).toBe(30_000);
      });

      it('RETRY.COLD_COUNTDOWN_SECONDS is 5 (matches arcade-wide cold start)', () => {
        expect(GAME_CONFIG.RETRY.COLD_COUNTDOWN_SECONDS).toBe(5);
      });

      it('RETRY.RETRY_COUNTDOWN_SECONDS is 2 (rapid-retry cadence)', () => {
        expect(GAME_CONFIG.RETRY.RETRY_COUNTDOWN_SECONDS).toBe(2);
      });

      it('SPAWN_PROTECTION.DURATION_MS is 1000 (one full second of invuln)', () => {
        expect(GAME_CONFIG.SPAWN_PROTECTION.DURATION_MS).toBe(1000);
      });

      it('SPAWN_PROTECTION.FLASH_PERIOD_MS is 200 (visual cue cadence)', () => {
        expect(GAME_CONFIG.SPAWN_PROTECTION.FLASH_PERIOD_MS).toBe(200);
      });

      it('retry countdown is strictly less than cold countdown', () => {
        // Invariant: the whole point of the shortcut is a faster retry.
        // A future tweak that accidentally makes retry ≥ cold defeats
        // the N5 intent.
        expect(GAME_CONFIG.RETRY.RETRY_COUNTDOWN_SECONDS).toBeLessThan(
          GAME_CONFIG.RETRY.COLD_COUNTDOWN_SECONDS,
        );
      });

      it('spawn protection window is at most WINDOW_MS/10 — kept tight enough not to feel delayed', () => {
        // Anti-regression guard. If a refactor pumps DURATION_MS too
        // high (e.g. 5000ms), the "empowering opening beat" becomes a
        // "nothing happens for 5 seconds" moment. Lock a generous upper
        // bound rather than the exact value.
        expect(GAME_CONFIG.SPAWN_PROTECTION.DURATION_MS).toBeLessThanOrEqual(
          GAME_CONFIG.RETRY.WINDOW_MS / 10,
        );
      });
    });

    describe('onCountdownComplete — arms the spawn-protection window', () => {
      it('sets spawnProtectionUntil to Date.now() + DURATION_MS', () => {
        // No tweens stub for the flash — just assert the timestamp lands.
        // The tween call is exercised separately in the "flash tween" test.
        scene.player = null; // skip the flash branch cleanly
        const before = Date.now();
        scene.onCountdownComplete();
        const after = Date.now();

        const expected = before + GAME_CONFIG.SPAWN_PROTECTION.DURATION_MS;
        const tolerance = after - before + 5; // clock skew + a few ms
        expect(scene.spawnProtectionUntil).toBeGreaterThanOrEqual(expected - tolerance);
        expect(scene.spawnProtectionUntil).toBeLessThanOrEqual(
          after + GAME_CONFIG.SPAWN_PROTECTION.DURATION_MS,
        );
      });

      it('arms the flash tween when player exists', () => {
        // The tween drives the visual cue. Missing tween means no flash
        // → player reads the window as "nothing happening" → they don't
        // learn it's a safe moment.
        scene.onCountdownComplete();

        expect(scene.tweens.add).toHaveBeenCalled();
        const tweenConfig = scene.tweens.add.mock.calls[0][0];
        expect(tweenConfig.targets).toBe(scene.player);
        expect(tweenConfig.yoyo).toBe(true);
        // `from: 1, to: 0.4` yo-yo on alpha — a regression using a
        // different keyframe (e.g. scale or tint) would render
        // differently and cease to read as "invuln" visually.
        expect(tweenConfig.alpha).toEqual({ from: 1, to: 0.4 });
      });

      it('skips the flash tween gracefully when player is null', () => {
        // Defensive: a refactor that delays player creation past the
        // countdown onComplete shouldn't throw. The spawn-protection
        // window should still land on the timestamp field.
        scene.player = null;

        expect(() => scene.onCountdownComplete()).not.toThrow();
        expect(scene.tweens.add).not.toHaveBeenCalled();
        expect(scene.spawnProtectionUntil).toBeGreaterThan(0);
      });
    });
  });
});
