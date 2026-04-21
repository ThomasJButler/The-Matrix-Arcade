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
      it('SPAWN_ALTITUDE 500 → 800 (tutorial zone extended +300m)', () => {
        expect(GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE).toBe(800);
      });

      it('SPAWN_CHANCE_BASE 0.03 → 0.018 (~40% reduction per Tom)', () => {
        expect(GAME_CONFIG.ENEMIES.SPAWN_CHANCE_BASE).toBe(0.018);
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
});
