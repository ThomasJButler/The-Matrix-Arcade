/**
 * CloudJumperGameScene - Unit Tests
 *
 * Phaser is fully mocked (jsdom cannot do WebGL). Because the mock Scene
 * constructor returns a plain object, prototype methods from the subclass
 * are lost. We work around this by manually binding every private method
 * from CloudJumperGameScene.prototype onto the mock-constructed instance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudJumperGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS } from '../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Collect all own method names from a prototype chain, stopping before Object.
 * This lets us copy the real GameScene / BaseScene methods onto the mock instance.
 */
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

/** Build a scene instance with all BaseScene / Phaser hooks stubbed out. */
function createTestScene() {
  const scene = new CloudJumperGameScene() as any;

  // Bind every prototype method onto the mock-constructed instance so that
  // private method calls like scene.handleCloudCollision() work correctly.
  for (const name of collectPrototypeMethods(CloudJumperGameScene)) {
    const fn = CloudJumperGameScene.prototype[name as keyof typeof CloudJumperGameScene.prototype];
    if (typeof fn === 'function') {
      scene[name] = (fn as any).bind(scene);
    }
  }

  // Game registry mock (needed by playerSpriteMode getter)
  scene.game = {
    registry: {
      get: vi.fn().mockReturnValue(false),
      set: vi.fn(),
    },
  };

  // BaseScene helpers — override after binding so our mocks win
  scene.playSound = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();

  // UI text objects
  scene.scoreText = { setText: vi.fn() };
  scene.distanceText = { setText: vi.fn() };

  // Camera effects
  scene.cameras = { main: { shake: vi.fn(), flash: vi.fn() } };

  // Tweens (used by handleCloudCollision for disappearing clouds and playerDeath)
  scene.tweens = { add: vi.fn(), killAll: vi.fn() };

  // Time helper (used by storm cloud tint reset and jump cooldown)
  scene.time = { delayedCall: vi.fn(), removeAllEvents: vi.fn(), now: 0 };

  // Player with a minimal physics body
  scene.player = {
    x: 100,
    y: 250,
    body: {
      velocity: { x: 0, y: 0 },
      blocked: { down: false },
      touching: { down: false },
      setVelocityY: vi.fn(),
      height: GAME_CONFIG.PLAYER.HEIGHT,
    },
    setVelocityY: vi.fn(),
    setTexture: vi.fn(),
    setTint: vi.fn(),
    clearTint: vi.fn(),
  };

  // Clouds group (needed by isNearCloud)
  scene.clouds = {
    getChildren: vi.fn().mockReturnValue([]),
  };

  return scene;
}

/** Create a mock cloud object matching the Cloud interface shape. */
function createMockCloud(type: string = 'normal') {
  return {
    cloudType: type,
    isUsed: false,
    body: { velocity: { y: 0 } },
    setVelocityY: vi.fn(),
    setImmovable: vi.fn(),
    setTint: vi.fn(),
    setDepth: vi.fn(),
    setScale: vi.fn(),
    x: 200,
    y: 300,
    width: 100,
    displayHeight: 30,
    destroy: vi.fn(),
    baseY: 300,
  };
}

/** Create a mock collectible item. */
function createMockItem() {
  return {
    collectType: 'star',
    destroy: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CloudJumperGameScene', () => {
  let scene: any;

  beforeEach(() => {
    scene = createTestScene();
  });

  // -----------------------------------------------------------------------
  // Initial State
  // -----------------------------------------------------------------------
  describe('Initial State', () => {
    it('distance starts at 0', () => {
      expect(scene.distance).toBe(0);
    });

    it('score starts at 0', () => {
      expect(scene.score).toBe(0);
    });

    it('bounceStreak starts at 0', () => {
      expect(scene.bounceStreak).toBe(0);
    });

    it('scrollSpeed starts at SPEED_BASE', () => {
      expect(scene.scrollSpeed).toBe(GAME_CONFIG.SCROLL.SPEED_BASE);
    });

    it('isGameOver starts as false', () => {
      expect(scene.isGameOver).toBe(false);
    });

    it('hasJumped starts as false', () => {
      expect(scene.hasJumped).toBe(false);
    });

    it('collectiblesCount starts at 0', () => {
      expect(scene.collectiblesCount).toBe(0);
    });

    it('stormCloudsSurvived starts at 0', () => {
      expect(scene.stormCloudsSurvived).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Cloud Collision
  // -----------------------------------------------------------------------
  describe('Cloud Collision', () => {
    it('increments bounceStreak on a normal cloud', () => {
      const cloud = createMockCloud('normal');
      scene.handleCloudCollision(cloud);
      expect(scene.bounceStreak).toBe(1);
    });

    it('increments bounceStreak on a moving cloud', () => {
      const cloud = createMockCloud('moving');
      scene.handleCloudCollision(cloud);
      expect(scene.bounceStreak).toBe(1);
    });

    it('increments bounceStreak on a disappearing cloud', () => {
      const cloud = createMockCloud('disappearing');
      scene.handleCloudCollision(cloud);
      expect(scene.bounceStreak).toBe(1);
    });

    it('resets bounceStreak on a storm cloud', () => {
      scene.bounceStreak = 5;
      const cloud = createMockCloud('storm');
      scene.handleCloudCollision(cloud);
      expect(scene.bounceStreak).toBe(0);
    });

    it('awards CLOUD_BONUS points on normal cloud', () => {
      const cloud = createMockCloud('normal');
      scene.handleCloudCollision(cloud);
      expect(scene.score).toBe(GAME_CONFIG.SCORING.CLOUD_BONUS);
    });

    it('awards CLOUD_BONUS points on moving cloud', () => {
      const cloud = createMockCloud('moving');
      scene.handleCloudCollision(cloud);
      expect(scene.score).toBe(GAME_CONFIG.SCORING.CLOUD_BONUS);
    });

    it('does not award CLOUD_BONUS on storm cloud', () => {
      const cloud = createMockCloud('storm');
      scene.handleCloudCollision(cloud);
      expect(scene.score).toBe(0);
    });

    it('plays jump sound on non-storm clouds', () => {
      const cloud = createMockCloud('normal');
      scene.handleCloudCollision(cloud);
      expect(scene.playSound).toHaveBeenCalledWith('jump');
    });

    it('plays hit sound on storm clouds', () => {
      const cloud = createMockCloud('storm');
      scene.handleCloudCollision(cloud);
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('increments stormCloudsSurvived on storm', () => {
      const cloud = createMockCloud('storm');
      scene.handleCloudCollision(cloud);
      expect(scene.stormCloudsSurvived).toBe(1);
    });

    it('marks disappearing cloud as used', () => {
      const cloud = createMockCloud('disappearing');
      scene.handleCloudCollision(cloud);
      expect(cloud.isUsed).toBe(true);
    });

    it('starts destroy tween on disappearing cloud', () => {
      const cloud = createMockCloud('disappearing');
      scene.handleCloudCollision(cloud);
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('does not re-trigger tween on an already-used disappearing cloud', () => {
      const cloud = createMockCloud('disappearing');
      cloud.isUsed = true;
      scene.handleCloudCollision(cloud);
      expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    it('sets bounce velocity to JUMP_VELOCITY * 0.8 on normal cloud', () => {
      const cloud = createMockCloud('normal');
      scene.handleCloudCollision(cloud);
      expect(scene.player.body.setVelocityY).toHaveBeenCalledWith(
        GAME_CONFIG.PLAYER.JUMP_VELOCITY * 0.8
      );
    });

    it('sets weaker bounce velocity on storm cloud (half of JUMP_VELOCITY)', () => {
      const cloud = createMockCloud('storm');
      scene.handleCloudCollision(cloud);
      expect(scene.player.body.setVelocityY).toHaveBeenCalledWith(
        GAME_CONFIG.PLAYER.JUMP_VELOCITY * 0.5
      );
    });
  });

  // -----------------------------------------------------------------------
  // Collectibles
  // -----------------------------------------------------------------------
  describe('Collectibles', () => {
    it('awards 100 points per item', () => {
      scene.collectItem(createMockItem());
      expect(scene.score).toBe(GAME_CONFIG.SCORING.COLLECTIBLE);
    });

    it('increments collectiblesCount', () => {
      scene.collectItem(createMockItem());
      expect(scene.collectiblesCount).toBe(1);
    });

    it('plays score sound on collection', () => {
      scene.collectItem(createMockItem());
      expect(scene.playSound).toHaveBeenCalledWith('collectible');
    });

    it('unlocks COLLECT_10 at 10 items', () => {
      scene.collectiblesCount = 9; // one away
      scene.collectItem(createMockItem());
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COLLECT_10);
    });

    it('does NOT unlock COLLECT_10 at 9 items', () => {
      scene.collectiblesCount = 8;
      scene.collectItem(createMockItem());
      expect(scene.unlockAchievement).not.toHaveBeenCalled();
    });

    it('accumulates score across multiple collectibles', () => {
      scene.collectItem(createMockItem());
      scene.collectItem(createMockItem());
      scene.collectItem(createMockItem());
      expect(scene.score).toBe(GAME_CONFIG.SCORING.COLLECTIBLE * 3);
    });
  });

  // -----------------------------------------------------------------------
  // Jumping
  // -----------------------------------------------------------------------
  describe('Jumping', () => {
    it('sets hasJumped on first jump', () => {
      scene.jump();
      expect(scene.hasJumped).toBe(true);
    });

    it('unlocks FIRST_JUMP achievement on first jump', () => {
      scene.jump();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_JUMP);
    });

    it('does not unlock FIRST_JUMP on subsequent jumps', () => {
      scene.hasJumped = true;
      scene.jump();
      expect(scene.unlockAchievement).not.toHaveBeenCalled();
    });

    it('sets vertical velocity to JUMP_VELOCITY', () => {
      scene.jump();
      expect(scene.player.body.setVelocityY).toHaveBeenCalledWith(
        GAME_CONFIG.PLAYER.JUMP_VELOCITY
      );
    });

    it('plays jump sound', () => {
      scene.jump();
      expect(scene.playSound).toHaveBeenCalledWith('jump');
    });

    it('jumps regardless of grounded state (Flappy Bird style)', () => {
      scene.player.body.touching.down = false;
      scene.player.body.blocked.down = false;
      scene.jump();
      expect(scene.player.body.setVelocityY).toHaveBeenCalledWith(
        GAME_CONFIG.PLAYER.JUMP_VELOCITY
      );
    });

    it('does not jump while counting down', () => {
      scene.isCountingDown = true;
      scene.jump();
      expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
    });

    it('does not jump after game over', () => {
      scene.isGameOver = true;
      scene.jump();
      expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
    });

    it('respects cooldown — second call within cooldown window is ignored', () => {
      scene.time.now = 1000;
      scene.jump();
      expect(scene.player.body.setVelocityY).toHaveBeenCalledTimes(1);

      // Still within cooldown window
      scene.time.now = 1100;
      scene.jump();
      expect(scene.player.body.setVelocityY).toHaveBeenCalledTimes(1);
    });

    it('allows jump after cooldown expires', () => {
      scene.time.now = 1000;
      scene.jump();

      scene.time.now = 1400; // 400ms later, past 300ms cooldown
      scene.jump();
      expect(scene.player.body.setVelocityY).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // Achievement Thresholds (via checkAchievements)
  // -----------------------------------------------------------------------
  describe('Achievement Thresholds', () => {
    it('unlocks DISTANCE_500 when distance >= 500', () => {
      scene.distance = 500;
      scene.checkAchievements();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.DISTANCE_500);
    });

    it('does not unlock DISTANCE_500 below 500', () => {
      scene.distance = 499;
      scene.checkAchievements();
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.DISTANCE_500);
    });

    it('unlocks DISTANCE_2000 when distance >= 2000', () => {
      scene.distance = 2000;
      scene.checkAchievements();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.DISTANCE_2000);
    });

    it('unlocks BOUNCE_STREAK at streak of 10', () => {
      scene.bounceStreak = 10;
      scene.checkAchievements();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.BOUNCE_STREAK);
    });

    it('does not unlock BOUNCE_STREAK at streak of 9', () => {
      scene.bounceStreak = 9;
      scene.checkAchievements();
      expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.BOUNCE_STREAK);
    });

    it('unlocks SURVIVE_STORM on first storm cloud collision', () => {
      const cloud = createMockCloud('storm');
      scene.handleCloudCollision(cloud);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SURVIVE_STORM);
    });
  });

  // -----------------------------------------------------------------------
  // Scroll Speed
  // -----------------------------------------------------------------------
  describe('Scroll Speed', () => {
    it('starts at base speed', () => {
      expect(scene.scrollSpeed).toBe(GAME_CONFIG.SCROLL.SPEED_BASE);
    });

    it('increases by ACCELERATION per second', () => {
      // Simulate 1 second (1000ms delta)
      scene.updateScrollSpeed(1000);
      expect(scene.scrollSpeed).toBeCloseTo(
        GAME_CONFIG.SCROLL.SPEED_BASE + GAME_CONFIG.SCROLL.ACCELERATION,
        5
      );
    });

    it('is capped at SPEED_MAX', () => {
      scene.scrollSpeed = GAME_CONFIG.SCROLL.SPEED_MAX;
      scene.updateScrollSpeed(1000);
      expect(scene.scrollSpeed).toBe(GAME_CONFIG.SCROLL.SPEED_MAX);
    });

    it('does not exceed SPEED_MAX even with large delta', () => {
      scene.updateScrollSpeed(1_000_000);
      expect(scene.scrollSpeed).toBeLessThanOrEqual(GAME_CONFIG.SCROLL.SPEED_MAX);
    });
  });

  // -----------------------------------------------------------------------
  // Game Over
  // -----------------------------------------------------------------------
  describe('Game Over', () => {
    it('triggers playerDeath when player falls below screen boundary', () => {
      scene.player.y = GAME_CONFIG.HEIGHT + 51;
      scene.checkGameOver();
      expect(scene.isGameOver).toBe(true);
    });

    it('does not trigger when player is within bounds', () => {
      scene.player.y = GAME_CONFIG.HEIGHT;
      scene.checkGameOver();
      expect(scene.isGameOver).toBe(false);
    });

    it('sets isGameOver flag via playerDeath', () => {
      scene.playerDeath();
      expect(scene.isGameOver).toBe(true);
    });

    it('switches to death texture on death', () => {
      scene.playerDeath();
      expect(scene.player.setTexture).toHaveBeenCalledWith('player_dead');
      expect(scene.player.clearTint).toHaveBeenCalled();
    });

    it('starts death animation tween', () => {
      scene.playerDeath();
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('does not double-trigger if isGameOver is already true', () => {
      scene.isGameOver = true;
      scene.playerDeath();
      // Should not add a tween because the guard returns early
      expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    it('reports score in death tween onComplete callback', () => {
      scene.score = 42;
      scene.playerDeath();

      // Extract the onComplete callback from the tween config
      const tweenConfig = scene.tweens.add.mock.calls[0][0];
      tweenConfig.onComplete();

      expect(scene.reportScore).toHaveBeenCalledWith(42, 42);
    });

    it('calls gameOver with score and distance reason', () => {
      scene.score = 50;
      scene.distance = 123.7;
      scene.playerDeath();

      const tweenConfig = scene.tweens.add.mock.calls[0][0];
      tweenConfig.onComplete();

      expect(scene.gameOver).toHaveBeenCalledWith(50, 'Distance: 123m', expect.any(Number), expect.any(Array), expect.any(Number), expect.any(Number));
    });
  });

  // -----------------------------------------------------------------------
  // Sprite Mode
  // -----------------------------------------------------------------------
  describe('Sprite Mode', () => {
    it('CLOUD_TINTS has entries for all four cloud types', () => {
      const tints = (CloudJumperGameScene as any).CLOUD_TINTS;
      expect(tints).toEqual({
        normal: 0xffffff,
        moving: 0x66ffff,
        disappearing: 0xaaaaaa,
        storm: 0xff6666,
      });
    });

    it('normal cloud tint is white (no tint)', () => {
      const tints = (CloudJumperGameScene as any).CLOUD_TINTS;
      expect(tints.normal).toBe(0xffffff);
    });
  });

  // -----------------------------------------------------------------------
  // Scoring
  // -----------------------------------------------------------------------
  describe('Scoring', () => {
    it('config has DISTANCE_DIVISOR of 10', () => {
      expect(GAME_CONFIG.SCORING.DISTANCE_DIVISOR).toBe(10);
    });

    it('config has CLOUD_BONUS of 10', () => {
      expect(GAME_CONFIG.SCORING.CLOUD_BONUS).toBe(10);
    });

    it('config has COLLECTIBLE of 100', () => {
      expect(GAME_CONFIG.SCORING.COLLECTIBLE).toBe(100);
    });

    it('combined score accumulates cloud bonuses and collectibles', () => {
      // Land on two normal clouds (10 each) and collect one item (100)
      scene.handleCloudCollision(createMockCloud('normal'));
      scene.handleCloudCollision(createMockCloud('normal'));
      scene.collectItem(createMockItem());
      expect(scene.score).toBe(10 + 10 + 100);
    });
  });
});
