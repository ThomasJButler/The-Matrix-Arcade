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

  // Initialize state that create() would set
  scene.highestY = 500; // GAME_CONFIG.HEIGHT - 100
  scene.lastMaxAltitude = 0;

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
    main: { scrollY: 0, setDeadzone: vi.fn(), startFollow: vi.fn(), setBounds: vi.fn() },
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

    it('regenerates jetpack fuel by FUEL_REGEN (5)', () => {
      scene.jetpackFuel = 50;
      const platform = createMockPlatform('normal');
      scene.handlePlatformCollision(platform);

      expect(scene.jetpackFuel).toBe(55);
    });

    it('caps jetpack fuel at FUEL_MAX (100)', () => {
      scene.jetpackFuel = 98;
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

      expect(scene.playSound).toHaveBeenCalledWith('hit');
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
    it('starts at full fuel', () => {
      expect(scene.jetpackFuel).toBe(100);
    });

    it('drains fuel at FUEL_DRAIN (30) per second', () => {
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

      scene.handleInput(1000);

      // fuel should have decreased by 30
      expect(scene.jetpackFuel).toBe(70);
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

      // 1 second drain at 30/s with only 10 fuel remaining
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
      expect(scene.gameOver).toHaveBeenCalledWith(250, 'Altitude: 42m', undefined, expect.any(Array));
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

    it('config GAME_CONFIG values match expected defaults', () => {
      expect(GAME_CONFIG.PLAYER.JUMP_VELOCITY).toBe(-550);
      expect(GAME_CONFIG.PLAYER.SPRING_VELOCITY).toBe(-800);
      expect(GAME_CONFIG.PLAYER.JETPACK_THRUST).toBe(-300);
      expect(GAME_CONFIG.JETPACK.FUEL_MAX).toBe(100);
      expect(GAME_CONFIG.JETPACK.FUEL_DRAIN).toBe(30);
      expect(GAME_CONFIG.JETPACK.FUEL_REGEN).toBe(5);
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

      expect(scene.playSound).toHaveBeenCalledWith('powerup');
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
});
