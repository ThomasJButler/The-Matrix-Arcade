/**
 * CloudJumperGameScene - Unit Tests
 *
 * Phaser is fully mocked (jsdom cannot do WebGL). Because the mock Scene
 * constructor returns a plain object, prototype methods from the subclass
 * are lost. We work around this by manually binding every private method
 * from CloudJumperGameScene.prototype onto the mock-constructed instance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
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
      // R87.C3 — lateral movement body mock. The real body applies this
      // via Phaser arcade physics; for tests we track calls so assertions
      // can verify the direction/magnitude without running a physics tick.
      setVelocityX: vi.fn(),
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

  // R87.C1 — default to canJump=true for pre-existing jump tests that assume
  // the player has landed on a cloud before jumping. R87.C1 gate-specific
  // tests override this explicitly to exercise the off path.
  scene.canJump = true;

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

    it('allows jump after cooldown expires (when re-armed by cloud contact)', () => {
      // R87.C1: the player must land on a cloud to re-arm canJump between
      // jumps. Simulate that contact in the test so the second jump fires.
      scene.time.now = 1000;
      scene.jump();

      // Simulate landing on a cloud mid-cooldown — re-arms canJump.
      scene.canJump = true;

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

  // -----------------------------------------------------------------------
  // R87.C1 — Single-jump gate (only jump when on a cloud)
  // -----------------------------------------------------------------------
  //
  // Tom's 2026-04-22 playtest: *"The player should not be able to jump
  // unless they jump on a cloud. They can't jump again in mid-air."*
  //
  // Contract:
  //  • `canJump` is armed in `handleCloudCollision` on every cloud type.
  //  • `jump()` consumes it — second call in mid-air is a no-op.
  //  • Scene-state guards (countdown, game-over) short-circuit WITHOUT
  //    consuming the gate so a stray SPACE press during countdown doesn't
  //    swallow the first jump opportunity.
  //  • Cooldown ALSO short-circuits without consuming — a key held past
  //    300 ms must not silently eat the gate.
  //  • Gate is consumed LAST, after velocity/sound/texture, so a refactor
  //    that extracts a "jump helper" can't swap the order without tripping
  //    the ordering tripwires below.
  // -----------------------------------------------------------------------
  describe('R87.C1 — Single-jump gate', () => {
    // -------------------------------------------------------------------
    // Source helper — static regex tripwires lock the contract at the
    // text level so a re-ordering refactor can't silently bypass the gate.
    // -------------------------------------------------------------------
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    // -------------------------------------------------------------------
    // Sub-block 1: Gate blocks mid-air jumps
    // -------------------------------------------------------------------
    describe('gate blocks mid-air jumps', () => {
      it('second jump call in mid-air is a no-op (canJump consumed on first call)', () => {
        scene.canJump = true;
        scene.time.now = 1000;
        scene.jump();
        expect(scene.player.body.setVelocityY).toHaveBeenCalledTimes(1);

        // Past cooldown, mid-air (canJump consumed) → must NOT fire again
        scene.time.now = 1500;
        scene.jump();
        expect(scene.player.body.setVelocityY).toHaveBeenCalledTimes(1);
      });

      it('third spam press past cooldown still a no-op', () => {
        scene.canJump = true;
        scene.time.now = 1000;
        scene.jump();

        // Three more attempts at 500 ms intervals — none should fire
        for (const t of [1500, 2000, 2500]) {
          scene.time.now = t;
          scene.jump();
        }
        expect(scene.player.body.setVelocityY).toHaveBeenCalledTimes(1);
      });

      it('canJump=false at entry → jump is a no-op even past cooldown', () => {
        scene.canJump = false;
        scene.time.now = 10_000;
        scene.jump();
        expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
        expect(scene.playSound).not.toHaveBeenCalledWith('jump');
      });

      it('canJump=false does NOT unlock FIRST_JUMP achievement', () => {
        // Direct Tom-regression guard: mid-air SPACE must not count as
        // "first jump" in the achievement ledger.
        scene.canJump = false;
        scene.hasJumped = false;
        scene.jump();
        expect(scene.unlockAchievement).not.toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_JUMP);
        expect(scene.hasJumped).toBe(false);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 2: Cloud contact re-arms the gate
    // -------------------------------------------------------------------
    describe('cloud contact re-arms the gate', () => {
      it('handleCloudCollision on NORMAL cloud sets canJump=true', () => {
        scene.canJump = false;
        scene.handleCloudCollision(createMockCloud('normal'));
        expect(scene.canJump).toBe(true);
      });

      it('handleCloudCollision on MOVING cloud sets canJump=true', () => {
        scene.canJump = false;
        scene.handleCloudCollision(createMockCloud('moving'));
        expect(scene.canJump).toBe(true);
      });

      it('handleCloudCollision on DISAPPEARING cloud sets canJump=true', () => {
        scene.canJump = false;
        scene.handleCloudCollision(createMockCloud('disappearing'));
        expect(scene.canJump).toBe(true);
      });

      it('handleCloudCollision on STORM cloud sets canJump=true', () => {
        // Storm clouds still re-arm — Tom's rule is about mid-air,
        // not about cloud "quality". A hostile cloud contact is still
        // a legitimate cloud contact.
        scene.canJump = false;
        scene.handleCloudCollision(createMockCloud('storm'));
        expect(scene.canJump).toBe(true);
      });

      it('land-jump-land-jump cycle: gate re-arms on every cloud contact', () => {
        // Full gameplay loop: land → jump (consume) → mid-air (blocked)
        // → land again → jump (fires). Proves the gate isn't sticky.
        // Counts are asserted via the JUMP_VELOCITY argument specifically
        // — handleCloudCollision uses JUMP_VELOCITY * 0.8 for its auto-
        // bounce, so filtering by the unscaled magnitude isolates the
        // manual-jump velocity applications.
        const unscaled = GAME_CONFIG.PLAYER.JUMP_VELOCITY;
        const countManualJumps = () =>
          scene.player.body.setVelocityY.mock.calls.filter(
            (args: [number]) => args[0] === unscaled
          ).length;

        scene.canJump = false;
        scene.time.now = 1000;

        // Land 1 → arms
        scene.handleCloudCollision(createMockCloud('normal'));
        expect(scene.canJump).toBe(true);

        // Manual jump → consumes, fires exactly one unscaled velocity
        scene.jump();
        expect(scene.canJump).toBe(false);
        expect(countManualJumps()).toBe(1);

        // Mid-air spam (past cooldown) → blocked
        scene.time.now = 2000;
        scene.jump();
        expect(countManualJumps()).toBe(1);

        // Land 2 → re-arms
        scene.handleCloudCollision(createMockCloud('normal'));
        expect(scene.canJump).toBe(true);

        // Manual jump → fires again
        scene.time.now = 3000;
        scene.jump();
        expect(countManualJumps()).toBe(2);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 3: Scene-state guards don't consume the gate
    // -------------------------------------------------------------------
    describe('scene-state guards preserve canJump', () => {
      it('isCountingDown blocks without consuming canJump', () => {
        scene.canJump = true;
        scene.isCountingDown = true;
        scene.jump();
        expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
        expect(scene.canJump).toBe(true);

        // After countdown ends, the first press still fires.
        scene.isCountingDown = false;
        scene.time.now = 1000;
        scene.jump();
        expect(scene.player.body.setVelocityY).toHaveBeenCalledWith(
          GAME_CONFIG.PLAYER.JUMP_VELOCITY
        );
      });

      it('isGameOver blocks without consuming canJump', () => {
        scene.canJump = true;
        scene.isGameOver = true;
        scene.jump();
        expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
        expect(scene.canJump).toBe(true);
      });

      it('cooldown blocks without consuming canJump', () => {
        // A held key past the cooldown window can re-enter jump(). If
        // cooldown blocks, canJump must NOT be consumed — otherwise the
        // player's one legitimate jump silently evaporates while they hold
        // SPACE. Belt-and-braces ordering against the Tom regression.
        scene.canJump = true;
        scene.time.now = 1000;
        scene.jump();
        expect(scene.canJump).toBe(false); // consumed by successful jump

        // Re-arm via cloud, then fire inside cooldown
        scene.handleCloudCollision(createMockCloud('normal'));
        expect(scene.canJump).toBe(true);

        scene.time.now = 1100; // 100 ms < 300 ms cooldown
        scene.jump();
        // Cooldown blocks: setVelocityY from handleCloudCollision bounce
        // means we need to count fresh jump() calls. Check velocity count.
        // handleCloudCollision called setVelocityY once (auto-bounce) +
        // the first jump() once = 2. Cooldown-blocked jump() should NOT
        // add a third call, and canJump must stay armed.
        expect(scene.player.body.setVelocityY).toHaveBeenCalledTimes(2);
        expect(scene.canJump).toBe(true);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 4: Consumption ordering (canJump set to false LAST)
    // -------------------------------------------------------------------
    describe('canJump consumption ordering', () => {
      it('canJump is still true while velocity is applied (consumed AFTER)', () => {
        // Hijack setVelocityY so we can snapshot canJump at the moment
        // the jump actually fires. If the consume ran BEFORE velocity,
        // this snapshot would read false — breaking the ordering contract.
        let canJumpAtVelocityFire: boolean | null = null;
        scene.canJump = true;
        scene.time.now = 1000;
        scene.player.body.setVelocityY = vi.fn(() => {
          canJumpAtVelocityFire = scene.canJump;
        });

        scene.jump();

        expect(canJumpAtVelocityFire).toBe(true);
        expect(scene.canJump).toBe(false); // consumed after velocity
      });

      it('successful jump DOES consume canJump', () => {
        scene.canJump = true;
        scene.time.now = 1000;
        scene.jump();
        expect(scene.canJump).toBe(false);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 5: Static source tripwires
    // -------------------------------------------------------------------
    describe('static source invariants', () => {
      it('jump() contains the `!this.canJump` early-return', () => {
        // Locks the existence of the gate check so a future refactor
        // can't silently drop it. Matches `if (!this.canJump) return;`
        // with flexible whitespace.
        const src = readSceneSource();
        expect(src).toMatch(/if\s*\(\s*!\s*this\.canJump\s*\)\s*return\s*;?/);
      });

      it('jump() consumes canJump via `this.canJump = false`', () => {
        const src = readSceneSource();
        // Extract the jump() method body (between its opening brace and
        // the next private method declaration) and assert the consume.
        const jumpBlock = src.match(
          /private\s+jump\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s)/
        );
        expect(jumpBlock).not.toBeNull();
        expect(jumpBlock![0]).toMatch(/this\.canJump\s*=\s*false/);
      });

      it('handleCloudCollision arms the gate with `this.canJump = true`', () => {
        const src = readSceneSource();
        const handleBlock = src.match(
          /private\s+handleCloudCollision\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s)/
        );
        expect(handleBlock).not.toBeNull();
        expect(handleBlock![0]).toMatch(/this\.canJump\s*=\s*true/);
      });

      it('exactly one write-site sets canJump=true (in handleCloudCollision)', () => {
        // A second "= true" write-site would be suspicious — either a
        // new re-arm path (e.g., a mid-air power-up, near-cloud helper)
        // that's not audited against Tom's rule, or a duplicated reset.
        // Either way, demands review.
        const src = readSceneSource();
        const writes = src.match(/this\.canJump\s*=\s*true/g) ?? [];
        expect(writes.length).toBe(1);
      });
    });
  });

  // -----------------------------------------------------------------------
  // R87.C2 — Ceiling clamp (off-screen-above prevention)
  // -----------------------------------------------------------------------
  //
  // Tom's 2026-04-22 playtest: *"Sometimes the player jumps too hard and he
  // goes off screen. Need to make the platforms lower to account for this
  // or make jumping less high."*
  //
  // Root cause: with `VERTICAL_RANGE = 100` and `JUMP_VELOCITY = -400` at
  // `GRAVITY = 800`, landing on a high-Y moving cloud (y as low as 75) and
  // chaining a manual SPACE press within the 300 ms cloud-contact window
  // gives peak y ≈ -25 — off-screen.
  //
  // Contract: `enforceCeiling()` is a no-op on any jump landing below
  // `CEILING_Y = 20` so normal-feel jumps are untouched. When the player
  // would escape the canvas-top, it pulls `y` back to the ceiling and
  // zeroes upward velocity so gravity immediately reels them back in.
  // -----------------------------------------------------------------------
  describe('R87.C2 — Ceiling clamp (off-screen-above prevention)', () => {
    // Static source helper — same pattern as the R87.C1 block above so
    // tripwires on the clamp's structure survive text-level refactors.
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    // -------------------------------------------------------------------
    // Sub-block 1: Config dial contract
    // -------------------------------------------------------------------
    describe('CEILING_Y config dial', () => {
      it('is exactly 20', () => {
        expect(GAME_CONFIG.PLAYER.CEILING_Y).toBe(20);
      });

      it('is a positive finite number', () => {
        expect(Number.isFinite(GAME_CONFIG.PLAYER.CEILING_Y)).toBe(true);
        expect(GAME_CONFIG.PLAYER.CEILING_Y).toBeGreaterThan(0);
      });

      it('sits above START_Y (ceiling is higher on screen than spawn)', () => {
        // Sanity: if someone set CEILING_Y >= START_Y, every game would
        // start with the player already clamped. Locks the ordering so a
        // future tuning pass can't silently flip the relation.
        expect(GAME_CONFIG.PLAYER.CEILING_Y).toBeLessThan(GAME_CONFIG.PLAYER.START_Y);
      });

      it('sits within the canvas (< HEIGHT)', () => {
        expect(GAME_CONFIG.PLAYER.CEILING_Y).toBeLessThan(GAME_CONFIG.HEIGHT);
      });

      it('is low enough to keep the full player sprite visible', () => {
        // Player body is centred on y; half-height = 16 + a 4 px guard
        // below any HUD chrome gives a safe minimum of 20. Locks the
        // "keep the player visible when clamped" invariant — a future
        // drop to 0 or a negative value would violate it.
        expect(GAME_CONFIG.PLAYER.CEILING_Y).toBeGreaterThanOrEqual(
          GAME_CONFIG.PLAYER.HEIGHT / 2
        );
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 2: Clamp behaviour — position + velocity
    // -------------------------------------------------------------------
    describe('enforceCeiling behaviour', () => {
      it('is a no-op when player is well below the ceiling', () => {
        scene.player.y = 200;
        scene.player.body.velocity.y = -100;
        scene.enforceCeiling();
        expect(scene.player.y).toBe(200);
        expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
      });

      it('is a no-op at exactly y === CEILING_Y (>= comparison)', () => {
        // Strict `>=` lock — a `>` refactor would clamp-then-unclamp at
        // exactly the boundary every frame and feel jittery.
        scene.player.y = GAME_CONFIG.PLAYER.CEILING_Y;
        scene.player.body.velocity.y = -50;
        scene.enforceCeiling();
        expect(scene.player.y).toBe(GAME_CONFIG.PLAYER.CEILING_Y);
        expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
      });

      it('clamps position back to CEILING_Y when player is above', () => {
        scene.player.y = 10;
        scene.player.body.velocity.y = -50;
        scene.enforceCeiling();
        expect(scene.player.y).toBe(GAME_CONFIG.PLAYER.CEILING_Y);
      });

      it('clamps even from far off-screen', () => {
        scene.player.y = -100;
        scene.player.body.velocity.y = -300;
        scene.enforceCeiling();
        expect(scene.player.y).toBe(GAME_CONFIG.PLAYER.CEILING_Y);
      });

      it('zeroes upward (negative) velocity on clamp', () => {
        scene.player.y = 10;
        scene.player.body.velocity.y = -200;
        scene.enforceCeiling();
        expect(scene.player.body.setVelocityY).toHaveBeenCalledWith(0);
      });

      it('does NOT touch downward (positive) velocity on clamp', () => {
        // Defensive: if the player somehow ends up above ceiling while
        // already falling (e.g., teleport / scene reset corner case),
        // we clamp position only and let gravity + existing momentum
        // carry them back without interference.
        scene.player.y = 10;
        scene.player.body.velocity.y = 120;
        scene.enforceCeiling();
        expect(scene.player.y).toBe(GAME_CONFIG.PLAYER.CEILING_Y);
        expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
      });

      it('does NOT touch zero velocity on clamp', () => {
        // Edge case: player resting exactly at vy=0 above ceiling. Clamp
        // position but don't issue a zero-velocity write (no-op).
        scene.player.y = 10;
        scene.player.body.velocity.y = 0;
        scene.enforceCeiling();
        expect(scene.player.y).toBe(GAME_CONFIG.PLAYER.CEILING_Y);
        expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 3: Scene-state guards
    // -------------------------------------------------------------------
    describe('scene-state guards', () => {
      it('isGameOver=true short-circuits (death tween preserved)', () => {
        // The death tween animates y by +100 over 600 ms. The clamp must
        // not interfere: even if a mid-tween frame reads a y < ceiling,
        // we let the tween finish to its onComplete.
        scene.isGameOver = true;
        scene.player.y = -50;
        scene.player.body.velocity.y = -200;
        scene.enforceCeiling();
        expect(scene.player.y).toBe(-50); // unchanged
        expect(scene.player.body.setVelocityY).not.toHaveBeenCalled();
      });

      it('missing player short-circuits (no NPE)', () => {
        scene.player = null;
        expect(() => scene.enforceCeiling()).not.toThrow();
      });

      it('missing body short-circuits (no NPE)', () => {
        scene.player = { y: 10, body: null };
        expect(() => scene.enforceCeiling()).not.toThrow();
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 4: Real-world scenario (high-cloud + manual-jump chain)
    // -------------------------------------------------------------------
    describe('high-cloud + manual-jump scenario', () => {
      it('prevents off-screen peak from a y=75 cloud + manual jump', () => {
        // Simulate the worst-case: player sitting on a moving cloud at
        // y=75, JUMP_VELOCITY peak rise of 100 px would land them at
        // y=-25 without a clamp. The clamp pulls them back to CEILING_Y.
        scene.player.y = 75 - 100; // where they'd be at apex
        scene.player.body.velocity.y = 0; // apex — velocity momentarily zero
        scene.enforceCeiling();
        expect(scene.player.y).toBe(GAME_CONFIG.PLAYER.CEILING_Y);
      });

      it('still fires correctly while rising hard (mid-ascent clamp)', () => {
        // Mid-ascent from a y=90 cloud with vy=-350: immediately above
        // ceiling → clamp + zero vy so gravity pulls them back down.
        scene.player.y = 15;
        scene.player.body.velocity.y = -350;
        scene.enforceCeiling();
        expect(scene.player.y).toBe(GAME_CONFIG.PLAYER.CEILING_Y);
        expect(scene.player.body.setVelocityY).toHaveBeenCalledWith(0);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 5: Static source tripwires
    // -------------------------------------------------------------------
    describe('static source invariants', () => {
      it('enforceCeiling method is defined on the class', () => {
        const src = readSceneSource();
        expect(src).toMatch(/private\s+enforceCeiling\s*\(\s*\)\s*:\s*void/);
      });

      it('update() calls enforceCeiling()', () => {
        // Locks the wiring so a future refactor can't silently drop the
        // call and resurrect the off-screen bug.
        const src = readSceneSource();
        expect(src).toMatch(/this\.enforceCeiling\s*\(\s*\)/);
      });

      it('enforceCeiling uses >= comparison (no jitter at boundary)', () => {
        const src = readSceneSource();
        const block = src.match(
          /private\s+enforceCeiling[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\s{2}shutdown\s|\n\s{2}}\s*$|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/player\.y\s*>=\s*GAME_CONFIG\.PLAYER\.CEILING_Y/);
      });

      it('enforceCeiling only zeroes negative velocity', () => {
        const src = readSceneSource();
        const block = src.match(
          /private\s+enforceCeiling[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\s{2}shutdown\s|\n\s{2}}\s*$|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        // Locks the `if (body.velocity.y < 0)` guard — a refactor dropping
        // this guard would zero vy even on a falling player, breaking
        // the defensive corner case test above.
        expect(block![0]).toMatch(/body\.velocity\.y\s*<\s*0/);
      });
    });
  });

  // -----------------------------------------------------------------------
  // R87.C3 — Lateral movement with release-to-stop deceleration.
  //
  // Tom's 2026-04-22 playtest: *"The player should be able to stop. This is
  // to avoid hitting things by accident and provide more control."*
  // Pre-R87.C3 the player was locked at `START_X=150` with no LEFT/RIGHT
  // controls; Tom wants horizontal agency plus a "stop" when the key releases.
  //
  // Contract: LEFT/A sets vx = -HORIZONTAL_SPEED, RIGHT/D sets +HORIZONTAL_SPEED,
  // no key held leaves it to Phaser arcade drag (HORIZONTAL_DRAG on the X axis
  // via createPlayer → body.setDrag) to decelerate vx → 0 over ~0.25 s. The
  // countdown window and game-over state both short-circuit the handler so
  // late input can't perturb the countdown or the death tween. `player.x` is
  // clamped to `[WIDTH/2, CANVAS_WIDTH - WIDTH/2]` with into-wall velocity
  // zeroed so a held key against a boundary doesn't accumulate impossible
  // momentum that would fire the moment the wall was gone.
  // -----------------------------------------------------------------------
  describe('R87.C3 — Lateral movement + release-to-stop', () => {
    // Static source helper — mirrors R87.C1/C2 so tripwires on the handler's
    // structure survive text-level refactors.
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    /** Attach optional keyboard keys with `isDown` flags for polling tests. */
    function stubMoveKeys(s: any, opts: { left?: boolean; a?: boolean; right?: boolean; d?: boolean } = {}) {
      s.moveLeftKey = { isDown: opts.left === true };
      s.moveLeftKeyA = { isDown: opts.a === true };
      s.moveRightKey = { isDown: opts.right === true };
      s.moveRightKeyD = { isDown: opts.d === true };
    }

    // -------------------------------------------------------------------
    // Sub-block 1: Config dial contract
    // -------------------------------------------------------------------
    describe('HORIZONTAL_SPEED + HORIZONTAL_DRAG config dials', () => {
      it('HORIZONTAL_SPEED is exactly 200', () => {
        expect(GAME_CONFIG.PLAYER.HORIZONTAL_SPEED).toBe(200);
      });

      it('HORIZONTAL_DRAG is exactly 800', () => {
        expect(GAME_CONFIG.PLAYER.HORIZONTAL_DRAG).toBe(800);
      });

      it('both dials are positive finite numbers', () => {
        expect(Number.isFinite(GAME_CONFIG.PLAYER.HORIZONTAL_SPEED)).toBe(true);
        expect(Number.isFinite(GAME_CONFIG.PLAYER.HORIZONTAL_DRAG)).toBe(true);
        expect(GAME_CONFIG.PLAYER.HORIZONTAL_SPEED).toBeGreaterThan(0);
        expect(GAME_CONFIG.PLAYER.HORIZONTAL_DRAG).toBeGreaterThan(0);
      });

      it('HORIZONTAL_SPEED stays under SCROLL.SPEED_MAX so lateral alone cannot beat the camera', () => {
        // Anti-regression: a tuning pass that pushed lateral speed above
        // the scroll cap would let the player outrun the world entirely,
        // breaking the side-scroller feel. Locks the ordering.
        expect(GAME_CONFIG.PLAYER.HORIZONTAL_SPEED).toBeLessThan(GAME_CONFIG.SCROLL.SPEED_MAX);
      });

      it('HORIZONTAL_SPEED is above SCROLL.SPEED_BASE so the player can meaningfully outrun the world', () => {
        // Lower-bound anti-regression: if lateral speed drifted below base
        // scroll, keys would feel ineffective — the world would always win.
        expect(GAME_CONFIG.PLAYER.HORIZONTAL_SPEED).toBeGreaterThan(GAME_CONFIG.SCROLL.SPEED_BASE);
      });

      it('HORIZONTAL_DRAG delivers a sub-second full-speed stop (drag ≥ 4 × speed)', () => {
        // Stop time = speed / drag. Drag ≥ 4 × speed ⇒ stop ≤ 0.25 s, which
        // is the "crisp stop" feel Tom asked for. A refactor that halved
        // drag would push stop time past 0.5 s and re-introduce the
        // "can't stop" complaint via a back door.
        expect(GAME_CONFIG.PLAYER.HORIZONTAL_DRAG).toBeGreaterThanOrEqual(
          GAME_CONFIG.PLAYER.HORIZONTAL_SPEED * 4
        );
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 2: Key-held → velocity set
    // -------------------------------------------------------------------
    describe('key-held velocity writes', () => {
      it('LEFT key held → setVelocityX(-HORIZONTAL_SPEED)', () => {
        stubMoveKeys(scene, { left: true });
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).toHaveBeenCalledWith(-GAME_CONFIG.PLAYER.HORIZONTAL_SPEED);
      });

      it('A key held → setVelocityX(-HORIZONTAL_SPEED) (WASD parity)', () => {
        stubMoveKeys(scene, { a: true });
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).toHaveBeenCalledWith(-GAME_CONFIG.PLAYER.HORIZONTAL_SPEED);
      });

      it('RIGHT key held → setVelocityX(+HORIZONTAL_SPEED)', () => {
        stubMoveKeys(scene, { right: true });
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).toHaveBeenCalledWith(GAME_CONFIG.PLAYER.HORIZONTAL_SPEED);
      });

      it('D key held → setVelocityX(+HORIZONTAL_SPEED) (WASD parity)', () => {
        stubMoveKeys(scene, { d: true });
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).toHaveBeenCalledWith(GAME_CONFIG.PLAYER.HORIZONTAL_SPEED);
      });

      it('LEFT+A both held → single negative velocity write (no doubled magnitude)', () => {
        stubMoveKeys(scene, { left: true, a: true });
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).toHaveBeenCalledTimes(1);
        expect(scene.player.body.setVelocityX).toHaveBeenCalledWith(-GAME_CONFIG.PLAYER.HORIZONTAL_SPEED);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 3: Release-to-stop — no key held leaves it to drag
    // -------------------------------------------------------------------
    describe('release-to-stop (drag handles deceleration)', () => {
      it('no key held → handler does NOT call setVelocityX (drag runs un-overridden)', () => {
        stubMoveKeys(scene); // all false
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).not.toHaveBeenCalled();
      });

      it('both LEFT and RIGHT held → handler does NOT call setVelocityX (cancels out to drag)', () => {
        // Conflict policy: no-op rather than arbitrarily pick one side.
        // A player pressing both keys can't accumulate invisible velocity.
        stubMoveKeys(scene, { left: true, right: true });
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).not.toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 4: Scene-state guards
    // -------------------------------------------------------------------
    describe('scene-state guards', () => {
      it('isCountingDown short-circuits — no velocity write on held key', () => {
        scene.isCountingDown = true;
        stubMoveKeys(scene, { right: true });
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).not.toHaveBeenCalled();
      });

      it('isGameOver short-circuits — death tween is not interrupted', () => {
        scene.isGameOver = true;
        stubMoveKeys(scene, { left: true });
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).not.toHaveBeenCalled();
      });

      it('missing player body does not NPE', () => {
        scene.player.body = null;
        stubMoveKeys(scene, { right: true });
        expect(() => scene.handleHorizontalMovement()).not.toThrow();
      });

      it('missing player does not NPE', () => {
        scene.player = null;
        stubMoveKeys(scene, { right: true });
        expect(() => scene.handleHorizontalMovement()).not.toThrow();
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 5: Boundary clamp
    // -------------------------------------------------------------------
    describe('canvas boundary clamp', () => {
      const halfWidth = GAME_CONFIG.PLAYER.WIDTH / 2;
      const maxX = GAME_CONFIG.WIDTH - halfWidth;

      it('player.x < halfWidth is pulled back to halfWidth', () => {
        scene.player.x = -20;
        stubMoveKeys(scene);
        scene.handleHorizontalMovement();
        expect(scene.player.x).toBe(halfWidth);
      });

      it('player.x > maxX is pulled back to maxX', () => {
        scene.player.x = GAME_CONFIG.WIDTH + 20;
        stubMoveKeys(scene);
        scene.handleHorizontalMovement();
        expect(scene.player.x).toBe(maxX);
      });

      it('into-wall negative velocity zeroed at left boundary', () => {
        scene.player.x = -20;
        scene.player.body.velocity.x = -200;
        stubMoveKeys(scene);
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).toHaveBeenCalledWith(0);
      });

      it('into-wall positive velocity zeroed at right boundary', () => {
        scene.player.x = GAME_CONFIG.WIDTH + 20;
        scene.player.body.velocity.x = 200;
        stubMoveKeys(scene);
        scene.handleHorizontalMovement();
        expect(scene.player.body.setVelocityX).toHaveBeenCalledWith(0);
      });

      it('away-from-wall positive velocity at left boundary is NOT zeroed', () => {
        // Player pressed against the left wall but moving right should keep
        // their momentum — only into-wall velocity gets cancelled.
        scene.player.x = -20;
        scene.player.body.velocity.x = 200;
        stubMoveKeys(scene);
        scene.handleHorizontalMovement();
        // setVelocityX(0) should NOT be called for the clamp-velocity branch
        // (the position clamp still runs, but velocity stays).
        const zeroCalls = scene.player.body.setVelocityX.mock.calls.filter(
          (c: unknown[]) => c[0] === 0
        );
        expect(zeroCalls).toHaveLength(0);
      });

      it('player at valid x does NOT trigger boundary clamp', () => {
        scene.player.x = 400; // mid-canvas
        stubMoveKeys(scene);
        scene.handleHorizontalMovement();
        // Neither the position clamp (unchanged) nor the velocity clamp fires.
        expect(scene.player.x).toBe(400);
        expect(scene.player.body.setVelocityX).not.toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 6: Static source tripwires
    // -------------------------------------------------------------------
    describe('static source invariants', () => {
      it('handleHorizontalMovement() method defined as private', () => {
        const src = readSceneSource();
        expect(src).toMatch(/private\s+handleHorizontalMovement\s*\(\s*\)\s*:\s*void/);
      });

      it('update() wires handleHorizontalMovement()', () => {
        // Wiring tripwire: a refactor that drops the call resurrects the
        // "no lateral control" regression.
        const src = readSceneSource();
        expect(src).toMatch(/this\.handleHorizontalMovement\s*\(\s*\)/);
      });

      it('createPlayer sets X drag via PLAYER.HORIZONTAL_DRAG', () => {
        // Locks the `body.setDrag(PLAYER.HORIZONTAL_DRAG, 0)` call so a
        // refactor that reverts to `setDrag(0, 0)` breaks the release-to-stop
        // beat even if handleHorizontalMovement stays intact.
        const src = readSceneSource();
        expect(src).toMatch(/setDrag\s*\(\s*PLAYER\.HORIZONTAL_DRAG\s*,\s*0\s*\)/);
      });

      it('setupInput binds LEFT, RIGHT, A, D keys', () => {
        const src = readSceneSource();
        expect(src).toMatch(/KeyCodes\.LEFT/);
        expect(src).toMatch(/KeyCodes\.RIGHT/);
        // LEFT/RIGHT tests above cover cursor keys; A/D cover WASD. Check
        // both are wired so neither WASD nor arrow players get stranded.
        expect(src).toMatch(/moveLeftKeyA\s*=\s*this\.input\.keyboard\.addKey\s*\(\s*Phaser\.Input\.Keyboard\.KeyCodes\.A\s*\)/);
        expect(src).toMatch(/moveRightKeyD\s*=\s*this\.input\.keyboard\.addKey\s*\(\s*Phaser\.Input\.Keyboard\.KeyCodes\.D\s*\)/);
      });

      it('handleHorizontalMovement uses countdown + game-over early-return guards', () => {
        const src = readSceneSource();
        const block = src.match(
          /private\s+handleHorizontalMovement[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\s{2}shutdown\s|\n\s{2}}\s*$|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/isCountingDown/);
        expect(block![0]).toMatch(/isGameOver/);
      });
    });
  });

  // =======================================================================
  // R87.C4 — Death SFX swap (soft procedural arpeggio replaces harrowing
  // sfx_explosion_emp.mp3 that SOUND_KEYS.GAME_OVER routed to). Tom's
  // 2026-04-22 playtest: "current sound is harrowing lol".
  //
  // Contract:
  // 1) The library contains a procedural `cloudJumperDeath` envelope.
  // 2) `playerDeath()` fires exactly that key exactly once on the death
  //    path — never falls back to GAME_OVER.
  // 3) The fall-path fires FALL once (thematic elevator drop stays) then
  //    CLOUD_JUMPER_DEATH exactly once via playerDeath; no duplicate death
  //    SFX, no GAME_OVER leak.
  // =======================================================================
  describe('R87.C4 — Death SFX swap (procedural cloudJumperDeath)', () => {
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    function readSoundSystemSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(
        path.join(__dirname, '..', '..', '..', '..', '..', 'hooks', 'useSoundSystem.ts'),
        'utf8'
      );
    }

    // ---------------------------------------------------------------------
    // Sub-block 1: Sound library contract (procedural-only)
    // ---------------------------------------------------------------------
    describe('cloudJumperDeath library entry', () => {
      it('SOUND_KEYS.CLOUD_JUMPER_DEATH === "cloudJumperDeath"', async () => {
        const { SOUND_KEYS } = await import('../../../../../lib/phaser/types');
        expect(SOUND_KEYS.CLOUD_JUMPER_DEATH).toBe('cloudJumperDeath');
      });

      it('procedural envelope is defined in SOUND_LIBRARY', () => {
        // Static source tripwire: a refactor that renames or deletes the
        // entry silently breaks the death path (playSound falls back to a
        // no-op when the key is missing). This anchors the shape.
        const src = readSoundSystemSource();
        expect(src).toMatch(/cloudJumperDeath:\s*\{/);
        // Soft sine descent — the core reason Tom called the old one harrowing.
        expect(src).toMatch(/cloudJumperDeath:\s*\{[\s\S]*?oscillatorType:\s*'sine'/);
        // Lowpass + reverb cushion the tail so the death registers gently.
        expect(src).toMatch(/cloudJumperDeath:\s*\{[\s\S]*?filterType:\s*'lowpass'/);
        expect(src).toMatch(/cloudJumperDeath:\s*\{[\s\S]*?reverb:\s*true/);
      });

      it('cloudJumperDeath is procedural-only (NOT in AUDIO_FILE_MAP)', () => {
        // Critical: if a future maintainer adds a `cloudJumperDeath:` key
        // to AUDIO_FILE_MAP the soft procedural arpeggio is silently replaced
        // by whatever MP3 they chose — reviving Tom's original complaint.
        // This is the direct safeguard.
        const src = readSoundSystemSource();
        const audioMapMatch = src.match(/AUDIO_FILE_MAP:\s*Record[^=]*=\s*\{[\s\S]*?\n\};/);
        expect(audioMapMatch).not.toBeNull();
        expect(audioMapMatch![0]).not.toMatch(/cloudJumperDeath\s*:/);
      });
    });

    // ---------------------------------------------------------------------
    // Sub-block 2: playerDeath SFX routing
    // ---------------------------------------------------------------------
    describe('playerDeath SFX invocation', () => {
      let scene: any;
      beforeEach(() => {
        scene = createTestScene();
      });

      it('fires cloudJumperDeath exactly once', () => {
        scene.playerDeath();
        const calls = (scene.playSound as any).mock.calls.filter(
          (c: any[]) => c[0] === 'cloudJumperDeath'
        );
        expect(calls.length).toBe(1);
      });

      it('does NOT fire SOUND_KEYS.GAME_OVER on death', () => {
        // Direct anti-regression against the pre-R87.C4 code.
        scene.playerDeath();
        const calls = (scene.playSound as any).mock.calls.filter(
          (c: any[]) => c[0] === 'gameOver'
        );
        expect(calls.length).toBe(0);
      });

      it('does not fire cloudJumperDeath on re-entry (isGameOver guard)', () => {
        scene.isGameOver = true;
        scene.playerDeath();
        const calls = (scene.playSound as any).mock.calls.filter(
          (c: any[]) => c[0] === 'cloudJumperDeath'
        );
        expect(calls.length).toBe(0);
      });

      it('cloudJumperDeath fires BEFORE the death tween is added', () => {
        // Ordering lock: the player needs to hear the soft descent as the
        // tween starts, not after it resolves. If a future refactor hoists
        // the tween before the playSound call the beat feels disconnected.
        const events: string[] = [];
        scene.playSound = vi.fn((key: string) => events.push(`sfx:${key}`));
        scene.tweens.add = vi.fn(() => events.push('tween'));
        scene.playerDeath();
        const sfxIdx = events.indexOf('sfx:cloudJumperDeath');
        const tweenIdx = events.indexOf('tween');
        expect(sfxIdx).toBeGreaterThanOrEqual(0);
        expect(tweenIdx).toBeGreaterThanOrEqual(0);
        expect(sfxIdx).toBeLessThan(tweenIdx);
      });
    });

    // ---------------------------------------------------------------------
    // Sub-block 3: Static source tripwires
    // ---------------------------------------------------------------------
    describe('GameScene static source contract', () => {
      it('playerDeath body references SOUND_KEYS.CLOUD_JUMPER_DEATH', () => {
        const src = readSceneSource();
        const block = src.match(
          /private\s+playerDeath\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\s{2}shutdown\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/SOUND_KEYS\.CLOUD_JUMPER_DEATH/);
      });

      it('playerDeath body does NOT reference SOUND_KEYS.GAME_OVER', () => {
        // Explicit tripwire against Tom's harrowing sound sneaking back in.
        const src = readSceneSource();
        const block = src.match(
          /private\s+playerDeath\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\s{2}shutdown\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).not.toMatch(/SOUND_KEYS\.GAME_OVER/);
        // Also catches a literal-string regression where someone bypasses
        // the SOUND_KEYS constant and types 'gameOver' directly.
        expect(block![0]).not.toMatch(/playSound\s*\(\s*['"]gameOver['"]/);
      });
    });
  });

  // =======================================================================
  // R87.C5 — Brick-break SFX removal from cloud traversal
  // =======================================================================
  // Tom 2026-04-22 playtest: "Remove the brick breaking sound effects when
  // moving along, please." Root cause: `handleCloudCollision`'s
  // `disappearing` branch fired `playSound(SOUND_KEYS.PLATFORM_BREAK)` on
  // every first-touch of a disappearing cloud. PLATFORM_BREAK routes to
  // `sfx_statue_break.mp3` — the "brick breaking" Tom referenced. After
  // R87.C3 added lateral movement the player now traverses several
  // disappearing clouds per second, chaining shatter sounds into a
  // cacophony that clashes with the soft-sky atmosphere.
  //
  // Fix: delete the PLATFORM_BREAK call entirely from the branch. The
  // existing 500ms alpha-fade tween + `jump` bounce SFX already provide
  // clear "cloud collapsed" feedback; the shatter layer is gratuitous.
  //
  // Contract:
  // 1) `handleCloudCollision` on a disappearing cloud must NOT fire
  //    `platformBreak` / `PLATFORM_BREAK` — neither via the constant nor
  //    a string literal.
  // 2) The bounce `jump` SFX still fires (the feel beat players rely on).
  // 3) The destroy tween still fires (visual feedback preserved).
  // 4) No other cloud type has PLATFORM_BREAK added as a replacement.
  // 5) Static source tripwire: `handleCloudCollision` body no longer
  //    references PLATFORM_BREAK, catching both a constant revival and
  //    a literal-string bypass.
  // =======================================================================
  describe('R87.C5 — Brick-break SFX removed from disappearing-cloud traversal', () => {
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    // ---------------------------------------------------------------------
    // Sub-block 1: Runtime SFX invocation
    // ---------------------------------------------------------------------
    describe('handleCloudCollision runtime SFX contract', () => {
      let scene: any;
      beforeEach(() => {
        scene = createTestScene();
      });

      it('does NOT call playSound with PLATFORM_BREAK on a disappearing cloud', () => {
        const cloud = createMockCloud('disappearing');
        scene.handleCloudCollision(cloud);
        const calls = (scene.playSound as any).mock.calls.filter(
          (c: any[]) => c[0] === 'platformBreak'
        );
        expect(calls.length).toBe(0);
      });

      it('does NOT call playSound with PLATFORM_BREAK on a normal cloud', () => {
        const cloud = createMockCloud('normal');
        scene.handleCloudCollision(cloud);
        const calls = (scene.playSound as any).mock.calls.filter(
          (c: any[]) => c[0] === 'platformBreak'
        );
        expect(calls.length).toBe(0);
      });

      it('does NOT call playSound with PLATFORM_BREAK on a moving cloud', () => {
        const cloud = createMockCloud('moving');
        scene.handleCloudCollision(cloud);
        const calls = (scene.playSound as any).mock.calls.filter(
          (c: any[]) => c[0] === 'platformBreak'
        );
        expect(calls.length).toBe(0);
      });

      it('does NOT call playSound with PLATFORM_BREAK on a storm cloud', () => {
        const cloud = createMockCloud('storm');
        scene.handleCloudCollision(cloud);
        const calls = (scene.playSound as any).mock.calls.filter(
          (c: any[]) => c[0] === 'platformBreak'
        );
        expect(calls.length).toBe(0);
      });

      it('still fires the jump SFX on a disappearing-cloud landing (feel-beat preserved)', () => {
        // Anti-regression: the delete-the-hook fix must not accidentally
        // drop the core bounce feedback. The `jump` SFX is the beat
        // players read as "I bounced"; removing it would make the scene
        // feel silent-on-jump.
        const cloud = createMockCloud('disappearing');
        scene.handleCloudCollision(cloud);
        const calls = (scene.playSound as any).mock.calls.filter(
          (c: any[]) => c[0] === 'jump'
        );
        expect(calls.length).toBe(1);
      });

      it('still starts the destroy tween on a fresh disappearing cloud (visual feedback preserved)', () => {
        // Tween is now the sole feedback for "this cloud collapsed"; it
        // must not regress alongside the SFX removal.
        const cloud = createMockCloud('disappearing');
        scene.handleCloudCollision(cloud);
        expect(scene.tweens.add).toHaveBeenCalled();
        expect(cloud.isUsed).toBe(true);
      });

      it('does not fire PLATFORM_BREAK even when C3 lateral movement chains three disappearing clouds in one tick', () => {
        // Direct Tom-scenario tripwire. Pre-fix: three chained shatters
        // per tick. Post-fix: zero. The counter compares against the
        // total `platformBreak` call count across all three overlaps.
        const clouds = [
          createMockCloud('disappearing'),
          createMockCloud('disappearing'),
          createMockCloud('disappearing'),
        ];
        clouds.forEach((c) => scene.handleCloudCollision(c));
        const shatterCalls = (scene.playSound as any).mock.calls.filter(
          (c: any[]) => c[0] === 'platformBreak'
        );
        expect(shatterCalls.length).toBe(0);
      });
    });

    // ---------------------------------------------------------------------
    // Sub-block 2: Static source tripwires
    // ---------------------------------------------------------------------
    describe('GameScene static source contract', () => {
      it('handleCloudCollision body does NOT reference SOUND_KEYS.PLATFORM_BREAK', () => {
        // Regex extracts the full method body so the assertion scopes to
        // the correct call-site. Tolerates the comment block that
        // documents the C5 deletion because the comment is prose, not a
        // runtime call — the prose tolerance is only for
        // `PLATFORM_BREAK` as a bare word in the code path, which the
        // `playSound(…)` wrapper regex guards against.
        const src = readSceneSource();
        const block = src.match(
          /private\s+handleCloudCollision\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).not.toMatch(/playSound\s*\(\s*SOUND_KEYS\.PLATFORM_BREAK\s*\)/);
      });

      it('handleCloudCollision body does NOT contain a playSound literal-string bypass', () => {
        // Catches a refactor that hardcodes `'platformBreak'` instead of
        // re-adding the constant.
        const src = readSceneSource();
        const block = src.match(
          /private\s+handleCloudCollision\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).not.toMatch(/playSound\s*\(\s*['"]platformBreak['"]/);
      });

      it('handleCloudCollision body still contains the jump SFX call (feel-beat tripwire)', () => {
        // A "simplify" refactor that strips all playSound calls from the
        // branch would silently break the bounce-feedback contract.
        const src = readSceneSource();
        const block = src.match(
          /private\s+handleCloudCollision\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/this\.playSound\(['"]jump['"]\)/);
      });
    });

    // ---------------------------------------------------------------------
    // Sub-block 3: Lateral-movement handler has no SFX calls
    // ---------------------------------------------------------------------
    describe('handleHorizontalMovement is silent', () => {
      it('LEFT key press does not call playSound', () => {
        const scene = createTestScene();
        scene.moveLeftKey = { isDown: true };
        scene.moveLeftKeyA = { isDown: false };
        scene.moveRightKey = { isDown: false };
        scene.moveRightKeyD = { isDown: false };
        scene.handleHorizontalMovement();
        expect((scene.playSound as any).mock.calls.length).toBe(0);
      });

      it('RIGHT key press does not call playSound', () => {
        const scene = createTestScene();
        scene.moveLeftKey = { isDown: false };
        scene.moveLeftKeyA = { isDown: false };
        scene.moveRightKey = { isDown: true };
        scene.moveRightKeyD = { isDown: false };
        scene.handleHorizontalMovement();
        expect((scene.playSound as any).mock.calls.length).toBe(0);
      });

      it('static source: handleHorizontalMovement body contains no playSound calls', () => {
        // Direct Tom-phrasing tripwire: "Remove the brick breaking sound
        // effects when moving along." A future tempt to attach ANY SFX
        // to lateral movement must go through a code review that decides
        // on the velocity-gated wind-whoosh alternative — not silently
        // revive the shatter.
        const src = readSceneSource();
        const block = src.match(
          /private\s+handleHorizontalMovement\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).not.toMatch(/playSound/);
      });
    });
  });

  // =========================================================================
  // R87.C6 — Freeze-hunt defences
  //
  // Tom's 2026-04-22 playtest: *"Sometimes the game freezes."* Low-signal,
  // no known repro. Audit surfaced three accumulative-leak candidates that
  // combine into a progressive-slowdown-to-freeze signature on long
  // sessions:
  //
  //   1. Collectibles never cleaned up when scrolling off-screen (clouds +
  //      obstacles both have symmetric cleanup; collectibles don't). Each
  //      orphan keeps its sprite AND a `repeat: -1` yoyo tween running
  //      forever.
  //   2. `generateContent()`'s catch-up while-loop has no upper iteration
  //      cap — a tab-suspension resume with huge `delta` can drive
  //      200+ iterations in a single frame.
  //   3. `shutdown()` relied on Phaser's implicit scene-sweep for tween +
  //      timer cleanup — deterministic on most platforms but not
  //      bulletproof on restart-heavy sessions.
  //
  // Shipped fixes + these tripwires:
  //   • `cleanupOffScreenCollectibles()` wired into `update()`, symmetric
  //     with `updateClouds` + `updateObstacles` cleanup.
  //   • `CLOUDS.MAX_PER_TICK = 20` defensive cap on `generateContent`.
  //   • `tweens.killAll()` + `time.removeAllEvents()` in `shutdown()`.
  //   • `cloudsAlive` / `collectiblesAlive` / `obstaclesAlive` exposed via
  //     `exposeTestState` for future freeze diagnostics.
  // =========================================================================
  describe('R87.C6 — Freeze-hunt defences', () => {
    // -------------------------------------------------------------------
    // Source helper — regex tripwires lock the wiring at the text level
    // so a refactor that deletes the call-site can't silently re-enable
    // the leak.
    // -------------------------------------------------------------------
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    // -------------------------------------------------------------------
    // Sub-block 1: Config dial contract
    // -------------------------------------------------------------------
    describe('CLOUDS.MAX_PER_TICK config dial', () => {
      it('is exactly 20 (exact-value lock so a refactor to a different cap value surfaces for review)', () => {
        expect(GAME_CONFIG.CLOUDS.MAX_PER_TICK).toBe(20);
      });

      it('is a positive finite integer', () => {
        const cap = GAME_CONFIG.CLOUDS.MAX_PER_TICK;
        expect(Number.isFinite(cap)).toBe(true);
        expect(cap).toBeGreaterThan(0);
        expect(Number.isInteger(cap)).toBe(true);
      });

      it('is comfortably above the steady-state per-frame spawn rate (≥ 5)', () => {
        // Anti-regression ratchet: a unilateral drop below 5 would start
        // throttling normal gameplay, producing visible gaps between clouds
        // on fast-scroll sessions. Must stay well above ~1-2/frame steady.
        expect(GAME_CONFIG.CLOUDS.MAX_PER_TICK).toBeGreaterThanOrEqual(5);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 2: cleanupOffScreenCollectibles behaviour
    // -------------------------------------------------------------------
    describe('cleanupOffScreenCollectibles', () => {
      it('destroys collectibles with x < -100', () => {
        const item1 = { x: -150, destroy: vi.fn() };
        const item2 = { x: -101, destroy: vi.fn() };
        scene.collectibles = {
          getChildren: vi.fn().mockReturnValue([item1, item2]),
        };
        scene.cleanupOffScreenCollectibles();
        expect(item1.destroy).toHaveBeenCalledTimes(1);
        expect(item2.destroy).toHaveBeenCalledTimes(1);
      });

      it('leaves on-screen collectibles alone', () => {
        const onscreen = { x: 200, destroy: vi.fn() };
        const edge = { x: -100, destroy: vi.fn() }; // exact boundary: `<` not `<=`, so survives
        scene.collectibles = {
          getChildren: vi.fn().mockReturnValue([onscreen, edge]),
        };
        scene.cleanupOffScreenCollectibles();
        expect(onscreen.destroy).not.toHaveBeenCalled();
        expect(edge.destroy).not.toHaveBeenCalled();
      });

      it('handles an empty collectibles group without throwing', () => {
        scene.collectibles = {
          getChildren: vi.fn().mockReturnValue([]),
        };
        expect(() => scene.cleanupOffScreenCollectibles()).not.toThrow();
      });

      it('destroys a mixed batch, keeping only the on-screen items', () => {
        // Direct long-session simulation: 4 off-screen ghosts + 2 live items.
        const ghosts = [
          { x: -500, destroy: vi.fn() },
          { x: -300, destroy: vi.fn() },
          { x: -200, destroy: vi.fn() },
          { x: -101, destroy: vi.fn() },
        ];
        const live = [
          { x: 0, destroy: vi.fn() },
          { x: 500, destroy: vi.fn() },
        ];
        scene.collectibles = {
          getChildren: vi.fn().mockReturnValue([...ghosts, ...live]),
        };
        scene.cleanupOffScreenCollectibles();
        ghosts.forEach((g) => expect(g.destroy).toHaveBeenCalledTimes(1));
        live.forEach((l) => expect(l.destroy).not.toHaveBeenCalled());
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 3: generateContent per-tick cap
    // -------------------------------------------------------------------
    describe('generateContent per-tick cap', () => {
      /**
       * Seed Phaser.Math so generateContent's Between() calls return a
       * deterministic value. Uses a SPACING_MIN constant so each iteration
       * advances lastCloudX by exactly SPACING_MIN pixels. Uses the mocked
       * Phaser namespace (setup.ts vi.mock('phaser', …)) — `require()`
       * bypasses vitest's resolver, so we must mutate the imported binding.
       */
      function seedPhaserMath(betweenReturn: number) {
        const PhaserAny = Phaser as unknown as { Math?: { Between?: unknown } };
        if (!PhaserAny.Math) PhaserAny.Math = {};
        PhaserAny.Math.Between = vi.fn().mockReturnValue(betweenReturn);
      }

      it('caps at CLOUDS.MAX_PER_TICK even when lastCloudX is deeply negative', () => {
        // Simulate tab-suspension resume: scrollObjects has decremented
        // lastCloudX to -10000, forcing a massive catch-up.
        seedPhaserMath(GAME_CONFIG.CLOUDS.SPACING_MIN);
        scene.lastCloudX = -10000;
        scene.distance = 0;

        // Stub the heavy work so the loop can spin without side effects.
        scene.createCloud = vi.fn();
        scene.spawnCollectible = vi.fn();
        scene.spawnObstacle = vi.fn();
        scene.getRandomCloudType = vi.fn().mockReturnValue('normal');

        scene.generateContent();

        // MAX_PER_TICK clouds spawn this frame — no more, regardless of gap.
        expect(scene.createCloud).toHaveBeenCalledTimes(GAME_CONFIG.CLOUDS.MAX_PER_TICK);
      });

      it('does not cap on a healthy per-frame advance (well below MAX_PER_TICK)', () => {
        // Steady-state case: lastCloudX trails WIDTH by just under
        // SPACING_MIN (10 px). With Between stubbed to SPACING_MIN=60,
        // one iteration lands at WIDTH-10 (still < WIDTH) and a second
        // iteration lands safely past WIDTH. Terminates naturally at 2.
        // The cap must not fire on normal gameplay.
        seedPhaserMath(GAME_CONFIG.CLOUDS.SPACING_MIN);
        scene.lastCloudX = GAME_CONFIG.WIDTH - GAME_CONFIG.CLOUDS.SPACING_MIN - 10;
        scene.distance = 0;

        scene.createCloud = vi.fn();
        scene.spawnCollectible = vi.fn();
        scene.spawnObstacle = vi.fn();
        scene.getRandomCloudType = vi.fn().mockReturnValue('normal');

        scene.generateContent();

        const calls = (scene.createCloud as any).mock.calls.length;
        expect(calls).toBeGreaterThanOrEqual(1);
        expect(calls).toBeLessThan(GAME_CONFIG.CLOUDS.MAX_PER_TICK);
      });

      it('lastCloudX advances past WIDTH when cap is not reached (normal termination)', () => {
        // Ensures the natural termination condition still works — the cap
        // is a ceiling, not a floor.
        seedPhaserMath(GAME_CONFIG.CLOUDS.SPACING_MIN);
        scene.lastCloudX = GAME_CONFIG.WIDTH - 100;
        scene.distance = 0;

        scene.createCloud = vi.fn();
        scene.spawnCollectible = vi.fn();
        scene.spawnObstacle = vi.fn();
        scene.getRandomCloudType = vi.fn().mockReturnValue('normal');

        scene.generateContent();

        expect(scene.lastCloudX).toBeGreaterThanOrEqual(GAME_CONFIG.WIDTH);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 4: shutdown kills tweens + timers
    // -------------------------------------------------------------------
    describe('shutdown hardening', () => {
      it('calls tweens.killAll() to stop any running infinite tweens', () => {
        // Belt-and-braces: collectible + bird tweens use `repeat: -1`.
        // Phaser typically sweeps scene-scoped tweens on shutdown, but
        // explicit killAll() makes the teardown deterministic regardless
        // of internal sweep ordering. The direct-call assertion guards
        // against a refactor that re-orders the super.shutdown() call
        // ahead of this cleanup.
        scene.tweens = { killAll: vi.fn() };
        scene.time = { removeAllEvents: vi.fn() };
        scene.stopBackgroundMusic = vi.fn();
        scene.input = { off: vi.fn(), keyboard: { removeAllKeys: vi.fn() } };
        // Preserve BaseScene shutdown via a noop spy — the scene binds
        // prototype methods, so super.shutdown() is the next prototype up.
        const baseShutdownSpy = vi
          .spyOn(Object.getPrototypeOf(CloudJumperGameScene.prototype), 'shutdown')
          .mockImplementation(() => {});

        scene.shutdown();

        expect(scene.tweens.killAll).toHaveBeenCalledTimes(1);
        baseShutdownSpy.mockRestore();
      });

      it('calls time.removeAllEvents() to cancel the storm-cloud tint-clear delayedCall', () => {
        scene.tweens = { killAll: vi.fn() };
        scene.time = { removeAllEvents: vi.fn() };
        scene.stopBackgroundMusic = vi.fn();
        scene.input = { off: vi.fn(), keyboard: { removeAllKeys: vi.fn() } };
        const baseShutdownSpy = vi
          .spyOn(Object.getPrototypeOf(CloudJumperGameScene.prototype), 'shutdown')
          .mockImplementation(() => {});

        scene.shutdown();

        expect(scene.time.removeAllEvents).toHaveBeenCalledTimes(1);
        baseShutdownSpy.mockRestore();
      });

      it('still calls super.shutdown() after tween/timer cleanup (pre-existing contract preserved)', () => {
        scene.tweens = { killAll: vi.fn() };
        scene.time = { removeAllEvents: vi.fn() };
        scene.stopBackgroundMusic = vi.fn();
        scene.input = { off: vi.fn(), keyboard: { removeAllKeys: vi.fn() } };
        const baseShutdownSpy = vi
          .spyOn(Object.getPrototypeOf(CloudJumperGameScene.prototype), 'shutdown')
          .mockImplementation(() => {});

        scene.shutdown();

        expect(baseShutdownSpy).toHaveBeenCalledTimes(1);
        baseShutdownSpy.mockRestore();
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 5: Static source tripwires — lock wiring at text level
    // so a refactor that deletes the call-site can't silently revive the
    // leak.
    // -------------------------------------------------------------------
    describe('static source contract', () => {
      it('update() body wires cleanupOffScreenCollectibles()', () => {
        const src = readSceneSource();
        const block = src.match(
          /update\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/this\.cleanupOffScreenCollectibles\(\)/);
      });

      it('generateContent() while-loop uses the MAX_PER_TICK cap', () => {
        const src = readSceneSource();
        const block = src.match(
          /private\s+generateContent\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/CLOUDS\.MAX_PER_TICK/);
        expect(block![0]).toMatch(/spawned\s*<\s*CLOUDS\.MAX_PER_TICK/);
      });

      it('shutdown() calls both tweens.killAll() and time.removeAllEvents()', () => {
        const src = readSceneSource();
        // Anchor the end at `super.shutdown();` — the final statement of the
        // method — to avoid matching the inner `if (this.input.keyboard)`
        // block's closing brace.
        const block = src.match(
          /shutdown\s*\(\s*\)\s*:\s*void\s*\{[\s\S]*?super\.shutdown\(\);/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/this\.tweens\.killAll\(\)/);
        expect(block![0]).toMatch(/this\.time\.removeAllEvents\(\)/);
      });

      it('cleanupOffScreenCollectibles uses the same < -100 threshold as the cloud/obstacle cleanup', () => {
        // Symmetry tripwire: the three cleanup paths must all use the
        // same off-screen threshold so an audit of one applies to all.
        const src = readSceneSource();
        const block = src.match(
          /private\s+cleanupOffScreenCollectibles\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/item\.x\s*<\s*-100/);
        expect(block![0]).toMatch(/item\.destroy\(\)/);
      });

      it('update() exposes cloudsAlive / collectiblesAlive / obstaclesAlive for freeze diagnostics', () => {
        // These keys are the diagnostic surface for a future freeze
        // investigation — a runaway accumulation shows up here before it
        // becomes a visible freeze. Losing them silently would blind
        // future R88+ perf-work.
        const src = readSceneSource();
        const block = src.match(
          /update\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/cloudsAlive\s*:/);
        expect(block![0]).toMatch(/collectiblesAlive\s*:/);
        expect(block![0]).toMatch(/obstaclesAlive\s*:/);
      });
    });
  });

  // =========================================================================
  // R87.C7 — Unit-test coverage refresh (closes Stream C)
  //
  // Follows the F7/N4/A3/R4/K9 playbook: pure tripwires on feel dials,
  // payload contracts, and wiring points surfaced during C1-C6 that a
  // future refactor could silently drift without breaking a behaviour
  // test. No production code touched — these are anti-regression rivets.
  //
  // Five micro-blocks covering the gaps left by C1-C6:
  //
  //  1. playerDeath juice + tween motion literals — extends C4 so a
  //     "simplify the death helper" refactor can't silently drop the
  //     camera shake (200, 0.012), red flash (255,0,0,…,0.25), +100
  //     fall-through motion, or 600ms duration. All degrade the
  //     soft-sky death feel Tom signed off on.
  //  2. playerDeath onComplete ordering + 6-arg gameOver payload —
  //     mirrors the R86.N4+/F6+++ pattern: lock reportScore-before-
  //     gameOver, highScore-promoted-before-reportScore, and the exact
  //     6-arg payload shape (score / "Distance: Xm" / highScore /
  //     3-row stats / level / duration). R85.G1 shipped the scoreboard
  //     regression fix on this exact shape; payload drift would revive it.
  //  3. Single-line feel dials + thresholds — JUMP_COOLDOWN_MS=300 (C1
  //     belt-and-braces cap), checkGameOver HEIGHT+50 off-screen slack,
  //     updateUI fall-texture >100 vy threshold, handleCloudCollision's
  //     0.8 non-storm and 0.5 storm bounce multipliers. Exact literal
  //     locks so a drift surfaces for review.
  //  4. Infinite-tween accumulation vectors — `repeat: -1` yoyo on
  //     spawnCollectible, `repeat: -1` flap on spawnObstacle's bird
  //     branch. These are the exact leak vectors C6's cleanup fixed;
  //     locking their shape means a future simplification can't remove
  //     the tween AND the cleanup in one untracked change. Also pins
  //     the off-screen `-100` threshold symmetry across all three
  //     cleanup paths (clouds / obstacles / collectibles).
  //  5. Shutdown input teardown + scrollObjects accounting — the
  //     `input.off('pointerdown')` and `removeAllKeys(true)` steps not
  //     covered by existing C6 shutdown tests (which only cover
  //     tweens.killAll + time.removeAllEvents), plus the lastCloudX
  //     decrement inside scrollObjects that feeds generateContent. If
  //     a refactor drops the decrement, the `while (lastCloudX < WIDTH)`
  //     stops firing after frame 1 and no new clouds ever spawn.
  // =========================================================================
  describe('R87.C7 — Unit-test coverage refresh (closes Stream C)', () => {
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    // -------------------------------------------------------------------
    // Sub-block 1: playerDeath juice + tween motion literals
    // -------------------------------------------------------------------
    describe('playerDeath juice + tween motion literals', () => {
      let s: any;
      beforeEach(() => {
        s = createTestScene();
        // Stub BaseScene's duration helper so we don't read NaN from
        // an unset gameStartTime. The existing C4 tests don't exercise
        // the onComplete fully so they never tripped on NaN, but the
        // new payload tests in sub-block 2 assert exact values.
        s.getGameDuration = vi.fn().mockReturnValue(0);
      });

      it('camera shake fires with the exact 200ms / 0.012 intensity literal', () => {
        // Soft feedback sized to the melancholic arpeggio — a harder
        // shake would clash with the death SFX Tom approved in C4.
        s.playerDeath();
        expect(s.cameras.main.shake).toHaveBeenCalledWith(200, 0.012);
      });

      it('camera flash fires with the full 8-arg red-RGB payload (120ms / 255,0,0 / 0.25 alpha)', () => {
        // Red-RGB locks the tint direction — a future refactor using
        // green (matching the scene palette) would look like an
        // achievement unlock rather than death. 0.25 alpha is the
        // translucent "reminder" flash, not an opaque white-out.
        s.playerDeath();
        expect(s.cameras.main.flash).toHaveBeenCalledWith(
          120,
          255,
          0,
          0,
          false,
          undefined,
          undefined,
          0.25
        );
      });

      it('death tween targets the player and fades alpha 1 → 0 over 600ms', () => {
        s.player.y = 250;
        s.playerDeath();
        const cfg = s.tweens.add.mock.calls[0][0];
        expect(cfg.targets).toBe(s.player);
        expect(cfg.alpha).toBe(0);
        expect(cfg.duration).toBe(600);
      });

      it('death tween motion literal: y = player.y + 100 (fall-through below camera)', () => {
        // The +100 is the fall-through beat: player visibly drops off
        // the cloud deck before the scene transitions. A refactor that
        // tweens to a fixed y-coordinate (e.g. HEIGHT + 50) would
        // animate to the same end-state but lose the relative
        // "fall-from-where-I-was" signal.
        s.player.y = 250;
        s.playerDeath();
        const cfg = s.tweens.add.mock.calls[0][0];
        expect(cfg.y).toBe(350);
      });

      it('relative +100 motion holds from different starting heights', () => {
        // Sanity check on the relativity: if the refactor hardcoded
        // +100 as a bare 350 literal, this test catches the drift.
        s.player.y = 75;
        s.playerDeath();
        const cfg = s.tweens.add.mock.calls[0][0];
        expect(cfg.y).toBe(175);
      });

      it('player.clearTint fires on death so a stale storm-tint does not bleed into the fade', () => {
        // Storm clouds set a red tint that's cleared after 200ms. If
        // the player dies inside that window, the fade-out would
        // start tinted — breaking the soft descent feel.
        s.playerDeath();
        expect(s.player.clearTint).toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 2: playerDeath onComplete ordering + 6-arg gameOver payload
    // -------------------------------------------------------------------
    describe('playerDeath onComplete — reportScore → gameOver ordering + payload', () => {
      let s: any;
      beforeEach(() => {
        s = createTestScene();
        s.getGameDuration = vi.fn().mockReturnValue(42000);
      });

      it('reportScore fires BEFORE gameOver in the onComplete chain (ordering lock)', () => {
        // The scoreboard needs to see the new watermark before the
        // game-over screen paints it. A swap would show a stale
        // high-score in the modal.
        s.playerDeath();
        const cfg = s.tweens.add.mock.calls[0][0];
        cfg.onComplete();
        const reportOrder = (s.reportScore as any).mock.invocationCallOrder[0];
        const gameOverOrder = (s.gameOver as any).mock.invocationCallOrder[0];
        expect(reportOrder).toBeLessThan(gameOverOrder);
      });

      it('highScore is promoted to max(score, highScore) BEFORE reportScore fires', () => {
        // Direct R85.G1 regression guard: if the promotion runs AFTER
        // reportScore, the scoreboard receives the old watermark.
        s.score = 3000;
        s.highScore = 1000;
        s.playerDeath();
        const cfg = s.tweens.add.mock.calls[0][0];
        cfg.onComplete();
        expect(s.reportScore).toHaveBeenCalledWith(3000, 3000);
      });

      it('highScore preserved when score is below the existing high-score (no regression)', () => {
        s.score = 500;
        s.highScore = 1000;
        s.playerDeath();
        const cfg = s.tweens.add.mock.calls[0][0];
        cfg.onComplete();
        expect(s.reportScore).toHaveBeenCalledWith(500, 1000);
      });

      it('gameOver 6-arg payload shape: score / "Distance: Xm" / promoted highScore / 3-row stats / level / duration', () => {
        // Direct R85.G1 scoreboard shape lock. Any refactor that
        // reorders args or drops a stat row breaks the modal layout.
        s.score = 500;
        s.distance = 1234.7;
        s.collectiblesCount = 8;
        s.bounceStreak = 15;
        s.stormCloudsSurvived = 2;
        s.playerDeath();
        const cfg = s.tweens.add.mock.calls[0][0];
        cfg.onComplete();
        expect(s.gameOver).toHaveBeenCalledWith(
          500,
          'Distance: 1234m',
          500,
          [
            { label: 'Collectibles', value: 8 },
            { label: 'Bounce Streak', value: 15 },
            { label: 'Storms', value: 2 },
          ],
          12,
          42000
        );
      });

      it('stats payload row order is Collectibles → Bounce Streak → Storms (UI layout contract)', () => {
        // Row-order drift would reorder the modal panel and would not
        // be caught by a toHaveBeenCalledWith-with-expect.any test.
        s.playerDeath();
        const cfg = s.tweens.add.mock.calls[0][0];
        cfg.onComplete();
        const stats = (s.gameOver as any).mock.calls[0][3];
        expect(stats.map((r: { label: string }) => r.label)).toEqual([
          'Collectibles',
          'Bounce Streak',
          'Storms',
        ]);
      });

      it('level is computed as floor(distance / 100)', () => {
        // The /100 divisor is distinct from the /10 SCORING.DISTANCE_DIVISOR
        // used for score. A refactor that reused the score divisor would
        // produce inflated level numbers on the game-over panel.
        s.score = 0;
        s.distance = 399;
        s.playerDeath();
        const cfg = s.tweens.add.mock.calls[0][0];
        cfg.onComplete();
        const levelArg = (s.gameOver as any).mock.calls[0][4];
        expect(levelArg).toBe(3);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 3: Single-line feel dials + threshold constants
    // -------------------------------------------------------------------
    describe('single-line feel dials + thresholds', () => {
      it('JUMP_COOLDOWN_MS === 300 (private static, locked via source)', () => {
        // 300ms is the belt-and-braces guard on held-key fire within a
        // single cloud-contact window. Dropping to 100ms would let key-
        // repeat swallow the C1 gate; bumping to 600ms would make the
        // jump feel sluggish on intentional bounces.
        const src = readSceneSource();
        expect(src).toMatch(/JUMP_COOLDOWN_MS\s*=\s*300/);
      });

      it('checkGameOver threshold is player.y > HEIGHT + 50 (off-screen slack)', () => {
        // The +50 gives the death tween's +100 motion room to finish
        // without re-triggering checkGameOver. Dropping the slack would
        // kill the player as soon as they left the visible canvas.
        const src = readSceneSource();
        const block = src.match(
          /private\s+checkGameOver\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/player\.y\s*>\s*GAME_CONFIG\.HEIGHT\s*\+\s*50/);
      });

      it('updateUI switches to player_fall texture when body.velocity.y > 100', () => {
        // 100 px/s is the visual "falling" threshold — below it the
        // player still reads as "airborne but in control". A refactor
        // flipping to > 0 would show the fall sprite on every apex
        // (mid-air flip-book flicker); to > MAX_FALL_SPEED would never
        // show it.
        const src = readSceneSource();
        const block = src.match(
          /private\s+updateUI\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/body\.velocity\.y\s*>\s*100/);
      });

      it('handleCloudCollision non-storm bounce is exactly JUMP_VELOCITY * 0.8 (2 branches: normal+moving, disappearing)', () => {
        // Both non-storm bounce branches use 0.8 — lock both occurrences
        // so a refactor that tunes one branch without auditing the
        // other silently diverges the feel between cloud types.
        const src = readSceneSource();
        const block = src.match(
          /private\s+handleCloudCollision\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        const occurrences = block![0].match(/JUMP_VELOCITY\s*\*\s*0\.8/g) ?? [];
        expect(occurrences.length).toBeGreaterThanOrEqual(2);
      });

      it('handleCloudCollision storm bounce is exactly JUMP_VELOCITY * 0.5 (hostile-cloud dampening)', () => {
        // 0.5 is half the normal bounce — storms are a punishment, not
        // a reward. Tuning up to 0.8 makes storms indistinguishable
        // from normal clouds (breaks the SURVIVE_STORM achievement's
        // "you chose to risk it" framing).
        const src = readSceneSource();
        const block = src.match(
          /private\s+handleCloudCollision\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/JUMP_VELOCITY\s*\*\s*0\.5/);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 4: Infinite-tween accumulation vectors + cleanup symmetry
    // -------------------------------------------------------------------
    describe('infinite-tween accumulation vectors + cleanup symmetry', () => {
      it('spawnCollectible adds the repeat: -1 yoyo tween (the exact leak vector C6 cleans up)', () => {
        // Lock the shape so a refactor can't remove the tween AND
        // cleanupOffScreenCollectibles in one go without audit.
        const src = readSceneSource();
        const block = src.match(
          /private\s+spawnCollectible\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/repeat:\s*-1/);
        expect(block![0]).toMatch(/yoyo:\s*true/);
      });

      it('spawnObstacle bird branch adds the repeat: -1 flap tween (second leak vector)', () => {
        // Birds flap on a `repeat: -1` tween just like collectibles yoyo.
        // If the cleanup symmetry is ever broken, birds become the next
        // leak vector instead of collectibles — same freeze signature.
        const src = readSceneSource();
        const block = src.match(
          /private\s+spawnObstacle\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/type\s*===\s*['"]bird['"][\s\S]*?repeat:\s*-1/);
      });

      it('all three off-screen cleanup paths use the same < -100 threshold (symmetric audit)', () => {
        // An audit of one path applies to all three only if the
        // threshold stays identical. A drift in one threshold invites
        // the leak back through the asymmetry.
        const src = readSceneSource();
        expect(src).toMatch(/cloud\.x\s*<\s*-100/);
        expect(src).toMatch(/obstacle\.x\s*<\s*-100/);
        expect(src).toMatch(/item\.x\s*<\s*-100/);
      });

      it('collectItem tween literals: scale=1.5, alpha=0, duration=200 (snappy collect feedback)', () => {
        // Pickup feedback: 200ms is the "crisp" feel — slower would
        // make rapid collects feel muddy. Scale+alpha combination
        // is the "pop and vanish" beat.
        const src = readSceneSource();
        const block = src.match(
          /private\s+collectItem\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/scale:\s*1\.5/);
        expect(block![0]).toMatch(/alpha:\s*0/);
        expect(block![0]).toMatch(/duration:\s*200/);
      });

      it('collectItem destroys the sprite in onComplete (prevents tween-survives-sprite orphan)', () => {
        // If the onComplete destroy is dropped, the 200ms pop-tween
        // resolves but the now-invisible sprite lingers with any
        // physics body still live. Adds to the freeze signature.
        const src = readSceneSource();
        const block = src.match(
          /private\s+collectItem\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/item\.destroy\(\)/);
      });
    });

    // -------------------------------------------------------------------
    // Sub-block 5: Shutdown input teardown + scrollObjects accounting
    // -------------------------------------------------------------------
    describe('shutdown input teardown + scrollObjects catch-up accounting', () => {
      it('shutdown removes the pointerdown listener (no lingering click-to-jump hook)', () => {
        // Pointer is wired in setupInput via `this.input.on('pointerdown', …)`
        // and must be torn down on scene exit — otherwise a click on
        // the main menu after returning from CloudJumper would still
        // trigger a ghost jump on the next scene.
        const src = readSceneSource();
        const block = src.match(
          /shutdown\s*\(\s*\)\s*:\s*void\s*\{[\s\S]*?super\.shutdown\(\);/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/this\.input\.off\(['"]pointerdown['"]\)/);
      });

      it('shutdown removes all keyboard keys with destroy=true (complete teardown)', () => {
        // The `true` arg is important — without it the keys are only
        // deactivated, not destroyed, and their handlers survive into
        // the next scene. A plain `removeAllKeys()` call would look
        // superficially correct but leak listeners.
        const src = readSceneSource();
        const block = src.match(
          /shutdown\s*\(\s*\)\s*:\s*void\s*\{[\s\S]*?super\.shutdown\(\);/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/removeAllKeys\(\s*true\s*\)/);
      });

      it('scrollObjects decrements lastCloudX by scrollAmount (feeds generateContent spawn loop)', () => {
        // Critical wiring: generateContent's `while (lastCloudX < WIDTH)`
        // depends on lastCloudX trailing the world. If this decrement
        // is dropped, the first frame's spawn burst is the only one
        // that ever fires — no new clouds appear as the world scrolls.
        const src = readSceneSource();
        const block = src.match(
          /private\s+scrollObjects\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/this\.lastCloudX\s*-=\s*scrollAmount/);
      });

      it('scrollObjects decrements x on clouds, collectibles, AND obstacles (symmetric world scroll)', () => {
        // All three entity groups must scroll together or the visual
        // continuity breaks — a dropped decrement on any one group
        // strands that entity class in world-space while the rest
        // moves left.
        const src = readSceneSource();
        const block = src.match(
          /private\s+scrollObjects\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).toMatch(/cloud\.x\s*-=\s*scrollAmount/);
        expect(block![0]).toMatch(/item\.x\s*-=\s*scrollAmount/);
        // Obstacles add per-obstacle speed to the scroll amount, so
        // the decrement form is slightly different. Lock the additive
        // pattern — a refactor that drops the scrollAmount component
        // would make birds/planes float through the world relative to
        // clouds instead of scrolling with them.
        expect(block![0]).toMatch(/obstacle\.x\s*-=\s*scrollAmount\s*\+/);
      });
    });
  });

  // =========================================================================
  // R87.C1+ safety-net — canJump write-site isolation + cross-method gate
  // integrity + C4/C5 SFX file-scope isolation (pre-Tom-tick)
  //
  // Lineage: R87.RH1+ item 2 (`isTrackComplete` write-site isolation) +
  // R87.AC1+ reset-isolation inverse audits, adapted for the single-jump
  // gate. The existing R87.C1 static-source block already locks three
  // things inside the gate's primary call-sites: the `!this.canJump`
  // early-return in `jump()`, the `= false` consume inside `jump()`, and
  // the `= true` arm inside `handleCloudCollision` (plus a count-check of
  // exactly 1 `= true` write). That covers the gate's INTERIOR — but
  // leaves two refactor risks unlocked that map directly onto Tom's
  // original C1 brief ("only jump on cloud contact"):
  //
  //   1. A tidy-up that extracts the arm into a helper (e.g.
  //      `armJumpGate()`) and calls it from `enforceCeiling` or
  //      `handleHorizontalMovement` — both plausible targets since C2/C3
  //      added them post-gate. A future dev might think "re-arm when
  //      player is stationary / clamped at the ceiling" is a feature. The
  //      existing count-check would fail, but the failure message
  //      ("expected 2, got 1") would not surface the regression intent.
  //      Explicit negative assertions on each sibling method body pin the
  //      rule to the code that could break it.
  //
  //   2. A refactor that deletes the `create()`-time `this.canJump =
  //      false` reset (thinking "the class-field initialiser already sets
  //      it") would make restart-after-game-over start with `canJump`
  //      still armed from the prior session — infinite-jump on the first
  //      frame of the next run. The existing tests don't cover restart;
  //      the `= false`-count check would drop from 2 to 1 and still pass
  //      if both writes happened to land inside `jump()`. Locking exact
  //      per-call-site counts rules this out.
  //
  // Family 4 extends the audit to C4/C5's SFX cross-method isolation. The
  // existing C4 tests lock `playerDeath` uses `CLOUD_JUMPER_DEATH`; C5
  // locks `handleCloudCollision` doesn't use `PLATFORM_BREAK`; but there
  // is no file-scope audit proving those keys are absent from EVERY other
  // method body. A refactor that moves the shatter to `updateClouds`
  // (when the alpha tween completes) or a new "cloud decay" helper would
  // slip past C5's scope-specific regex. File-scope locks close that gap.
  // =========================================================================
  describe('R87.C1+ safety-net — canJump write-site isolation + cross-method gate integrity (pre-Tom-tick)', () => {
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    // -------------------------------------------------------------------
    // Family 1: canJump write-site isolation (mirror of RH1+ item 2)
    // -------------------------------------------------------------------
    describe('Family 1 — canJump write-site isolation', () => {
      it('exactly one `private canJump = false` class-field initialiser', () => {
        // A second class-field declaration would be a syntax error in
        // TS strict; a change to `public` would break encapsulation but
        // pass runtime. Lock visibility + default literal so the
        // field's identity is stable against "clean up state" refactors.
        const src = readSceneSource();
        const matches = src.match(/private\s+canJump\s*=\s*false/g) ?? [];
        expect(matches.length).toBe(1);
      });

      it('exactly two runtime `this.canJump = false` assignments (create-reset + jump-consume)', () => {
        // One lives in create() alongside other state resets — so a
        // restart-from-game-over lands with canJump=false (player must
        // touch a cloud before their first jump, same as a fresh
        // session). The other lives in jump() consuming the gate.
        // A drop to 1 indicates one path was deleted: either restart
        // infinite-jumps, or jump() stops consuming the gate.
        const src = readSceneSource();
        const matches = src.match(/this\.canJump\s*=\s*false/g) ?? [];
        expect(matches.length).toBe(2);
      });

      it('exactly one `this.canJump = true` write-site (handleCloudCollision only)', () => {
        // The R87.C1 block asserts this via its own static audit; keeping
        // it inline here makes the isolation family self-contained — if
        // the C1 block is ever refactored away, this family still locks
        // the invariant.
        const src = readSceneSource();
        const matches = src.match(/this\.canJump\s*=\s*true/g) ?? [];
        expect(matches.length).toBe(1);
      });

      it('exactly two `this.canJump` reads (jump() gate check + exposeTestState)', () => {
        // Read-site count catches a refactor that adds a new consumer
        // (e.g. a "near-cloud" lenient jump helper) bypassing jump()'s
        // single consume path. Current reads: `if (!this.canJump)` in
        // jump() + `canJump: this.canJump,` in exposeTestState. The
        // `(?!\s*=)` negative lookahead excludes the three write sites
        // so this audit isolates reads.
        const src = readSceneSource();
        const reads = src.match(/this\.canJump(?!\s*=)/g) ?? [];
        expect(reads.length).toBe(2);
      });
    });

    // -------------------------------------------------------------------
    // Family 2: Cross-method gate integrity — no sibling method re-arms
    // -------------------------------------------------------------------
    describe('Family 2 — cross-method gate integrity (no sibling re-arms canJump)', () => {
      it('enforceCeiling body does NOT contain `this.canJump = true`', () => {
        // Tom's original C2 complaint was "jumps too hard" — the clamp
        // pulls the player back in-canvas. If a future tidy-up re-arms
        // the gate when the clamp fires (thinking "clamp = player
        // landed on ceiling"), the mid-air infinite-jump bug that C1
        // fixed comes back for any player who chains enough high-cloud
        // jumps to trip the clamp.
        const src = readSceneSource();
        const block = src.match(
          /private\s+enforceCeiling\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).not.toMatch(/this\.canJump\s*=\s*true/);
      });

      it('handleHorizontalMovement body does NOT contain `this.canJump = true`', () => {
        // C3's braking / drag-stop behaviour is lateral only — it must
        // never re-arm the vertical gate. A plausible "QoL" bug: "when
        // player stops moving, re-arm jump" — feels like a player win
        // but silently breaks C1's cloud-contact contract.
        const src = readSceneSource();
        const block = src.match(
          /private\s+handleHorizontalMovement\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).not.toMatch(/this\.canJump\s*=\s*true/);
      });

      it('update() body does NOT contain a direct `this.canJump = true` write', () => {
        // update() dispatches to handleCloudCollision via the physics
        // collider callback wired in setupCollisions. It must NOT
        // bypass that route with a direct re-arm each tick — that
        // would defeat the gate entirely.
        const src = readSceneSource();
        const block = src.match(
          /\bupdate\s*\(\s*time\s*:\s*number\s*,\s*delta\s*:\s*number\s*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).not.toMatch(/this\.canJump\s*=\s*true/);
      });

      it('checkGameOver body does NOT contain `this.canJump = true`', () => {
        // Death path cleanup should not touch the gate. A refactor
        // that resets state on game-over could inadvertently flip
        // canJump=true; combined with `isGameOver`'s guard in jump()
        // this wouldn't visibly break anything — until someone edits
        // the guard, at which point the bug is latent.
        const src = readSceneSource();
        const block = src.match(
          /private\s+checkGameOver\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(?=\n\s{2}\/\*\*|\n\s{2}private\s|\n\}\s*$)/
        );
        expect(block).not.toBeNull();
        expect(block![0]).not.toMatch(/this\.canJump\s*=\s*true/);
      });
    });

    // -------------------------------------------------------------------
    // Family 3: Behaviour preservation — sibling invocations preserve state
    // -------------------------------------------------------------------
    describe('Family 3 — sibling-method invocations preserve canJump state', () => {
      it('enforceCeiling preserves canJump=false (below-ceiling no-op path)', () => {
        const s = createTestScene();
        s.canJump = false;
        s.player.y = GAME_CONFIG.PLAYER.CEILING_Y + 100;
        s.enforceCeiling();
        expect(s.canJump).toBe(false);
      });

      it('enforceCeiling preserves canJump=true (below-ceiling no-op path)', () => {
        const s = createTestScene();
        s.canJump = true;
        s.player.y = GAME_CONFIG.PLAYER.CEILING_Y + 100;
        s.enforceCeiling();
        expect(s.canJump).toBe(true);
      });

      it('enforceCeiling preserves canJump=false when the clamp actually fires (above-ceiling)', () => {
        // The critical C1+C2 composition test: even when the ceiling
        // clamp fires and snaps the player back into the canvas, the
        // gate stays un-armed. This is the exact scenario that would
        // revive infinite-jump for players who chain enough manual
        // jumps to escape the canvas top.
        const s = createTestScene();
        s.canJump = false;
        s.player.y = GAME_CONFIG.PLAYER.CEILING_Y - 10;
        s.player.body.velocity.y = -200;
        s.enforceCeiling();
        expect(s.player.y).toBe(GAME_CONFIG.PLAYER.CEILING_Y);
        expect(s.canJump).toBe(false);
      });

      it('handleHorizontalMovement preserves canJump=false (LEFT key held)', () => {
        const s = createTestScene();
        s.canJump = false;
        s.moveLeftKey = { isDown: true };
        s.moveLeftKeyA = { isDown: false };
        s.moveRightKey = { isDown: false };
        s.moveRightKeyD = { isDown: false };
        s.handleHorizontalMovement();
        expect(s.canJump).toBe(false);
      });

      it('handleHorizontalMovement preserves canJump=false on drag path (no key held)', () => {
        // C3's drag-based stop: when no key is held, the function
        // leaves velocity to Phaser's drag. Must not accidentally
        // re-arm the vertical gate as part of the player-slowing-down
        // state change.
        const s = createTestScene();
        s.canJump = false;
        s.moveLeftKey = { isDown: false };
        s.moveLeftKeyA = { isDown: false };
        s.moveRightKey = { isDown: false };
        s.moveRightKeyD = { isDown: false };
        s.handleHorizontalMovement();
        expect(s.canJump).toBe(false);
      });
    });

    // -------------------------------------------------------------------
    // Family 4: C4/C5 SFX cross-method isolation (file-scope audit)
    // -------------------------------------------------------------------
    describe('Family 4 — C4/C5 SFX cross-method isolation (file-scope)', () => {
      it('playSound(SOUND_KEYS.PLATFORM_BREAK) is absent from every method body', () => {
        // Existing R87.C5 block locks the disappearing-cloud branch of
        // handleCloudCollision only. A refactor could move the shatter
        // call to updateClouds (on alpha-tween onComplete) or to a new
        // "cloud decay" helper — C5's scope-specific regex would miss
        // either move. File-scope lock closes that gap. Prose comments
        // referencing PLATFORM_BREAK are fine (the regex only matches
        // the `playSound(…)` call expression).
        const src = readSceneSource();
        expect(src).not.toMatch(/playSound\s*\(\s*SOUND_KEYS\.PLATFORM_BREAK\s*\)/);
        expect(src).not.toMatch(/playSound\s*\(\s*['"]platformBreak['"]/);
      });

      it('playSound(SOUND_KEYS.GAME_OVER) is absent from every method body', () => {
        // Existing R87.C4 block locks playerDeath only. Tom's
        // "harrowing" complaint was about the explosion SFX routed
        // through SOUND_KEYS.GAME_OVER. If a future refactor moves the
        // key into a shared "finalise game" helper (e.g. a BaseScene
        // override), C4's scope-specific test wouldn't catch it.
        // File-scope audit guarantees the key is completely absent
        // from CloudJumper's runtime path. The `playSound(…)` wrapper
        // regex ignores the SOUND_KEYS import line and prose comments.
        const src = readSceneSource();
        expect(src).not.toMatch(/playSound\s*\(\s*SOUND_KEYS\.GAME_OVER\s*\)/);
        expect(src).not.toMatch(/playSound\s*\(\s*['"]gameOver['"]/);
      });

      it('playSound(SOUND_KEYS.CLOUD_JUMPER_DEATH) appears exactly once (file-scope usage anchor)', () => {
        // Complementary positive lock: the C4 replacement SFX is wired
        // at exactly one call-site (in playerDeath). A duplicate — for
        // example, a second reference added in a cleanup helper —
        // would play the soft arpeggio twice per death, restacking the
        // envelope Tom approved in C4. Locking the count here + C4's
        // scope-specific positive test together pin both identity and
        // multiplicity.
        const src = readSceneSource();
        const matches = src.match(/playSound\s*\(\s*SOUND_KEYS\.CLOUD_JUMPER_DEATH\s*\)/g) ?? [];
        expect(matches.length).toBe(1);
      });
    });
  });
});
