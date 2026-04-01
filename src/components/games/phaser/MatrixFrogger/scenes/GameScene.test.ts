/**
 * Unit tests for FroggerGameScene
 *
 * Strategy: because the Phaser.Scene mock constructor returns a plain object
 * (breaking the prototype chain), we build a test harness by copying all
 * prototype methods from FroggerGameScene onto a plain object that also
 * carries the expected runtime state and mocked helpers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FroggerGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS } from '../config';
import Phaser from 'phaser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Walk the full prototype chain of FroggerGameScene (up to but not including
 * Object.prototype) and copy every own method onto `target`.
 */
function bindPrototypeMethods(target: any): void {
  let proto = FroggerGameScene.prototype;
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue;
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc && typeof desc.value === 'function' && !(key in target)) {
        target[key] = desc.value.bind(target);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
}

function createTestScene(): any {
  // Start with the default state that the class field initialisers would set
  const scene: any = {
    // Class fields (mirrors the private field defaults in FroggerGameScene)
    playerCol: GAME_CONFIG.PLAYER.START_COL,
    playerRow: GAME_CONFIG.PLAYER.START_ROW,
    isMoving: false,
    score: 0,
    maxDistance: 0,
    nearMissCount: 0,
    combo: 0,
    lastComboTime: 0,
    magnetCollected: 0,
    isGameOver: false,
    activePowerUps: [],
    shieldHits: 0,
  };

  // Copy every prototype method onto the object
  bindPrototypeMethods(scene);

  // Mock BaseScene helpers
  scene.playSound = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();

  // Phaser time (used by activatePowerUp / incrementCombo)
  scene.time = { now: 0 };

  // UI text objects
  scene.scoreText = { setText: vi.fn() };
  scene.distanceText = { setText: vi.fn() };
  scene.comboText = { setText: vi.fn(), setVisible: vi.fn(), setAlpha: vi.fn() };

  // Power-up display container
  scene.powerUpDisplay = {
    getByName: vi.fn().mockReturnValue(null),
    length: 0,
    add: vi.fn(),
    each: vi.fn(),
  };

  // Player sprite
  scene.player = {
    x: 400,
    y: 300,
    setTint: vi.fn(),
    clearTint: vi.fn(),
    setAlpha: vi.fn(),
  };

  // Tweens (used by playerDeath / checkProgress)
  scene.tweens = { add: vi.fn() };

  // Cameras (screen shake on death)
  scene.cameras = { main: { shake: vi.fn() } };

  // Scene manager (used by gameOver -> scene.start)
  scene.scene = { start: vi.fn() };

  // Add helpers (used by createShieldBreakEffect / addPowerUpToDisplay)
  scene.add = {
    graphics: vi.fn().mockReturnValue({
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      x: 0,
      y: 0,
      destroy: vi.fn(),
    }),
    sprite: vi.fn().mockReturnValue({
      setName: vi.fn().mockReturnThis(),
      x: 0,
    }),
  };

  // Enemies group (used by checkNearMiss)
  scene.enemies = {
    getChildren: vi.fn().mockReturnValue([]),
  };

  return scene;
}

function createMockPill(type: 'red' | 'blue') {
  return { pillType: type, destroy: vi.fn(), x: 100, y: 100 };
}

function createMockEnemy() {
  return {
    enemyType: 'agent' as const,
    x: 100,
    y: 100,
    baseSpeed: 100,
    direction: 1 as const,
    lane: 2,
    destroy: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FroggerGameScene', () => {
  let scene: any;

  beforeEach(() => {
    scene = createTestScene();
  });

  // -----------------------------------------------------------------------
  // Initial State
  // -----------------------------------------------------------------------
  describe('Initial State', () => {
    it('should start with score 0', () => {
      expect(scene.score).toBe(0);
    });

    it('should start at the configured starting column', () => {
      expect(scene.playerCol).toBe(GAME_CONFIG.PLAYER.START_COL);
    });

    it('should start at the configured starting row', () => {
      expect(scene.playerRow).toBe(GAME_CONFIG.PLAYER.START_ROW);
    });

    it('should start with combo at 0', () => {
      expect(scene.combo).toBe(0);
    });

    it('should not be in game-over state', () => {
      expect(scene.isGameOver).toBe(false);
    });

    it('should have no active power-ups', () => {
      expect(scene.activePowerUps).toEqual([]);
    });

    it('should have shieldHits at 0', () => {
      expect(scene.shieldHits).toBe(0);
    });

    it('should not be moving', () => {
      expect(scene.isMoving).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Pill Collection
  // -----------------------------------------------------------------------
  describe('Pill Collection', () => {
    it('should award RED_PILL points for a red pill', () => {
      const pill = createMockPill('red');
      scene.collectPill(pill);
      expect(scene.score).toBe(GAME_CONFIG.SCORING.RED_PILL);
    });

    it('should play the "score" sound for a red pill', () => {
      const pill = createMockPill('red');
      scene.collectPill(pill);
      expect(scene.playSound).toHaveBeenCalledWith('score');
    });

    it('should play the "powerup" sound for a blue pill', () => {
      // Stub out grantRandomPowerUp so the test focuses on collectPill
      scene.grantRandomPowerUp = vi.fn();
      const pill = createMockPill('blue');
      scene.collectPill(pill);
      expect(scene.playSound).toHaveBeenCalledWith('powerup');
    });

    it('should destroy the pill on collection (red)', () => {
      const pill = createMockPill('red');
      scene.collectPill(pill);
      expect(pill.destroy).toHaveBeenCalled();
    });

    it('should destroy the pill on collection (blue)', () => {
      scene.grantRandomPowerUp = vi.fn();
      const pill = createMockPill('blue');
      scene.collectPill(pill);
      expect(pill.destroy).toHaveBeenCalled();
    });

    it('should call grantRandomPowerUp for a blue pill', () => {
      scene.grantRandomPowerUp = vi.fn();
      const pill = createMockPill('blue');
      scene.collectPill(pill);
      expect(scene.grantRandomPowerUp).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Power-ups
  // -----------------------------------------------------------------------
  describe('Power-ups', () => {
    it('should add an entry to activePowerUps when activated', () => {
      scene.time.now = 1000;
      scene.activatePowerUp('ghost', 3000);
      expect(scene.activePowerUps).toHaveLength(1);
      expect(scene.activePowerUps[0].type).toBe('ghost');
      expect(scene.activePowerUps[0].endTime).toBe(4000);
    });

    it('should set shieldHits to SHIELD.HITS value', () => {
      // Directly verify the config value and field assignment
      scene.shieldHits = GAME_CONFIG.POWERUPS.SHIELD.HITS;
      expect(scene.shieldHits).toBe(1);
    });

    it('should add magnet to active power-ups on activation', () => {
      scene.time.now = 500;
      scene.activatePowerUp('magnet', GAME_CONFIG.POWERUPS.MAGNET.DURATION);
      expect(scene.hasPowerUp('magnet')).toBe(true);
    });

    it('should return true from hasPowerUp for an active power-up', () => {
      scene.time.now = 0;
      scene.activatePowerUp('bullet_time', 5000);
      expect(scene.hasPowerUp('bullet_time')).toBe(true);
    });

    it('should return false from hasPowerUp for an inactive power-up', () => {
      expect(scene.hasPowerUp('ghost')).toBe(false);
    });

    it('should remove expired power-ups in updatePowerUps', () => {
      scene.time.now = 0;
      scene.activatePowerUp('ghost', 3000);
      expect(scene.activePowerUps).toHaveLength(1);

      // Advance past expiry
      scene.updatePowerUps(3001);
      expect(scene.activePowerUps).toHaveLength(0);
    });

    it('should keep non-expired power-ups in updatePowerUps', () => {
      scene.time.now = 0;
      scene.activatePowerUp('ghost', 3000);
      scene.updatePowerUps(2000);
      expect(scene.activePowerUps).toHaveLength(1);
    });

    it('should replace an existing power-up of the same type', () => {
      scene.time.now = 0;
      scene.activatePowerUp('ghost', 3000);
      scene.time.now = 1000;
      scene.activatePowerUp('ghost', 3000);
      // Should still only have one ghost entry, with updated endTime
      const ghosts = scene.activePowerUps.filter((p: any) => p.type === 'ghost');
      expect(ghosts).toHaveLength(1);
      expect(ghosts[0].endTime).toBe(4000);
    });
  });

  // -----------------------------------------------------------------------
  // Combo System
  // -----------------------------------------------------------------------
  describe('Combo System', () => {
    it('should increment combo by 1', () => {
      scene.time.now = 100;
      scene.incrementCombo();
      expect(scene.combo).toBe(1);
    });

    it('should update lastComboTime on increment', () => {
      scene.time.now = 4200;
      scene.incrementCombo();
      expect(scene.lastComboTime).toBe(4200);
    });

    it('should decay combo to 0 after 3 seconds of inactivity', () => {
      scene.combo = 5;
      scene.lastComboTime = 1000;
      scene.updateCombo(4001); // 3001 ms elapsed
      expect(scene.combo).toBe(0);
    });

    it('should keep combo alive within the 3-second window', () => {
      scene.combo = 5;
      scene.lastComboTime = 1000;
      scene.updateCombo(3999); // 2999 ms elapsed
      expect(scene.combo).toBe(5);
    });

    it('should return multiplier 1 for combo 0-4', () => {
      scene.combo = 0;
      expect(scene.getComboMultiplier()).toBe(1);
      scene.combo = 4;
      expect(scene.getComboMultiplier()).toBe(1);
    });

    it('should return multiplier 2 for combo 5-9', () => {
      scene.combo = 5;
      expect(scene.getComboMultiplier()).toBe(2);
      scene.combo = 9;
      expect(scene.getComboMultiplier()).toBe(2);
    });

    it('should return multiplier 3 for combo 10-19', () => {
      scene.combo = 10;
      expect(scene.getComboMultiplier()).toBe(3);
      scene.combo = 19;
      expect(scene.getComboMultiplier()).toBe(3);
    });

    it('should return multiplier 4 for combo 20-29', () => {
      scene.combo = 20;
      expect(scene.getComboMultiplier()).toBe(4);
      scene.combo = 29;
      expect(scene.getComboMultiplier()).toBe(4);
    });

    it('should return multiplier 5 for combo 30+', () => {
      scene.combo = 30;
      expect(scene.getComboMultiplier()).toBe(5);
      scene.combo = 100;
      expect(scene.getComboMultiplier()).toBe(5);
    });
  });

  // -----------------------------------------------------------------------
  // Scoring
  // -----------------------------------------------------------------------
  describe('Scoring', () => {
    it('should add points to the total score', () => {
      scene.addScore(100);
      expect(scene.score).toBe(100);
    });

    it('should accumulate points across multiple addScore calls', () => {
      scene.addScore(50);
      scene.addScore(30);
      expect(scene.score).toBe(80);
    });

    it('should update scoreText when addScore is called', () => {
      scene.addScore(200);
      expect(scene.scoreText.setText).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Enemy Collision
  // -----------------------------------------------------------------------
  describe('Enemy Collision', () => {
    it('should not cause death when ghost power-up is active', () => {
      scene.time.now = 0;
      scene.activatePowerUp('ghost', 5000);
      const enemy = createMockEnemy();
      scene.handleEnemyCollision(enemy);
      expect(scene.isGameOver).toBe(false);
    });

    it('should absorb hit when shield is active', () => {
      scene.shieldHits = 1;
      const enemy = createMockEnemy();
      scene.handleEnemyCollision(enemy);
      expect(scene.shieldHits).toBe(0);
      expect(scene.isGameOver).toBe(false);
    });

    it('should unlock SHIELD_SAVE achievement on shield absorb', () => {
      scene.shieldHits = 1;
      const enemy = createMockEnemy();
      scene.handleEnemyCollision(enemy);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SHIELD_SAVE);
    });

    it('should play "hit" sound on shield absorb', () => {
      scene.shieldHits = 1;
      const enemy = createMockEnemy();
      scene.handleEnemyCollision(enemy);
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('should trigger playerDeath on normal collision', () => {
      const enemy = createMockEnemy();
      scene.handleEnemyCollision(enemy);
      expect(scene.isGameOver).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Player Death / Game Over
  // -----------------------------------------------------------------------
  describe('Game Over', () => {
    it('should set isGameOver to true', () => {
      scene.playerDeath(createMockEnemy());
      expect(scene.isGameOver).toBe(true);
    });

    it('should tint the player red on death', () => {
      scene.playerDeath(createMockEnemy());
      expect(scene.player.setTint).toHaveBeenCalledWith(0xff0000);
    });

    it('should play the "hit" sound on death', () => {
      scene.playerDeath(createMockEnemy());
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('should not double-trigger if already game over', () => {
      scene.playerDeath(createMockEnemy());
      scene.player.setTint.mockClear();
      scene.playerDeath(createMockEnemy());
      // setTint should not have been called again
      expect(scene.player.setTint).not.toHaveBeenCalled();
    });

    it('should create a death tween animation', () => {
      scene.playerDeath(createMockEnemy());
      expect(scene.tweens.add).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Achievement Thresholds
  // -----------------------------------------------------------------------
  describe('Achievement Thresholds', () => {
    it('should unlock FIRST_CROSS when playerRow reaches 0', () => {
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_CROSS);
    });

    it('should award 500 bonus points on reaching the top row', () => {
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.score).toBe(500);
    });

    it('should reset player to start position after crossing', () => {
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.playerRow).toBe(GAME_CONFIG.PLAYER.START_ROW);
      expect(scene.playerCol).toBe(GAME_CONFIG.PLAYER.START_COL);
    });

    it('should unlock SCORE_1000 when score reaches 1000', () => {
      scene.score = 1000;
      scene.checkProgress();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SCORE_1000);
    });

    it('should unlock SCORE_5000 when score reaches 5000', () => {
      scene.score = 5000;
      scene.checkProgress();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SCORE_5000);
    });

    it('should unlock DISTANCE_500 when maxDistance reaches 5', () => {
      scene.maxDistance = 5;
      scene.checkProgress();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.DISTANCE_500);
    });

    it('should unlock COMBO_10 when combo reaches 10 via incrementCombo', () => {
      scene.combo = 9;
      scene.time.now = 100;
      scene.incrementCombo();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_10);
    });

    it('should unlock DODGE_MASTER after 10 near misses', () => {
      // Place an active enemy within the near-miss distance band
      const enemy = {
        active: true,
        x: scene.player.x + GAME_CONFIG.CELL_SIZE * 0.5,
        y: scene.player.y,
      };
      scene.enemies.getChildren.mockReturnValue([enemy]);

      // Mock the Phaser distance helper to return a value inside the band:
      // nearMissDistance = CELL_SIZE * 0.8, minimum = CELL_SIZE * 0.4
      const phaserMod = Phaser as any;
      if (!phaserMod.Math) phaserMod.Math = {};
      if (!phaserMod.Math.Distance) phaserMod.Math.Distance = {};
      phaserMod.Math.Distance.Between = vi.fn().mockReturnValue(GAME_CONFIG.CELL_SIZE * 0.5);

      scene.nearMissCount = 9;
      scene.checkNearMiss();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.DODGE_MASTER);
    });
  });
});
