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
});
