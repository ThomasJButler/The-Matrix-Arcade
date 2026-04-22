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
import { MATRIX_COLORS } from '../../../../../lib/phaser/types';
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
    // New state fields — mirror real FroggerGameScene class-field defaults.
    isLevelingUp: false,
    bufferedInput: null,
    level: 1,
    neoDestroyCount: 0,
    neoFlashTimer: 0,
    kungFuCharges: GAME_CONFIG.KUNG_FU.MAX_CHARGES,
    kungFuTotalUsed: 0,
    lastKungFuTime: 0,
    kungFuIcons: [],
    isCountingDown: true,
    countdownValue: GAME_CONFIG.COUNTDOWN.DURATION,
  };

  // Copy every prototype method onto the object
  bindPrototypeMethods(scene);

  // Mock BaseScene helpers
  scene.playSound = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();

  // Phaser time (used by activatePowerUp / incrementCombo / kungFu)
  scene.time = { now: 0 };

  // UI text objects
  scene.scoreText = { setText: vi.fn() };
  scene.distanceText = { setText: vi.fn() };
  scene.comboText = { setText: vi.fn(), setVisible: vi.fn(), setAlpha: vi.fn() };
  scene.levelText = { setText: vi.fn() };

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
  scene.cameras = { main: { shake: vi.fn(), flash: vi.fn() } };

  // Scene manager (used by gameOver -> scene.start)
  scene.scene = { start: vi.fn() };

  // Add helpers (used by createShieldBreakEffect / addPowerUpToDisplay / effects)
  scene.add = {
    graphics: vi.fn().mockReturnValue({
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      x: 0,
      y: 0,
      destroy: vi.fn(),
    }),
    sprite: vi.fn().mockImplementation(() => ({
      setName: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      x: 0,
      y: 0,
    })),
    text: vi.fn().mockReturnValue({
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    }),
  };

  // Enemies group (used by checkNearMiss / useKungFu)
  scene.enemies = {
    getChildren: vi.fn().mockReturnValue([]),
  };

  return scene;
}

function createMockPill(type: 'red' | 'blue' | 'neo') {
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
    setActive: vi.fn(),
    setVisible: vi.fn(),
    verticalSpeed: 0,
    active: true,
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

    it('should start at level 1', () => {
      expect(scene.level).toBe(1);
    });

    it('should start with full Kung Fu charges', () => {
      expect(scene.kungFuCharges).toBe(GAME_CONFIG.KUNG_FU.MAX_CHARGES);
    });

    it('should start in countdown mode', () => {
      expect(scene.isCountingDown).toBe(true);
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

    it('should play the frogger pickup sound for a red pill', () => {
      const pill = createMockPill('red');
      scene.collectPill(pill);
      expect(scene.playSound).toHaveBeenCalledWith('froggerPickup');
    });

    it('should play the "powerup" sound for a blue pill', () => {
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

    it('should activate NEO mode for a neo pill', () => {
      const pill = createMockPill('neo');
      scene.collectPill(pill);
      expect(scene.hasPowerUp('neo_mode')).toBe(true);
    });

    it('should reset neoDestroyCount when collecting neo pill', () => {
      scene.neoDestroyCount = 5;
      const pill = createMockPill('neo');
      scene.collectPill(pill);
      expect(scene.neoDestroyCount).toBe(0);
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
      const ghosts = scene.activePowerUps.filter((p: any) => p.type === 'ghost');
      expect(ghosts).toHaveLength(1);
      expect(ghosts[0].endTime).toBe(4000);
    });

    it('should activate NEO mode power-up', () => {
      scene.time.now = 0;
      scene.activatePowerUp('neo_mode', GAME_CONFIG.POWERUPS.NEO_MODE.DURATION);
      expect(scene.hasPowerUp('neo_mode')).toBe(true);
    });

    it('should restore player tint when NEO mode expires', () => {
      scene.time.now = 0;
      scene.activatePowerUp('neo_mode', 3000);
      scene.updatePowerUps(3001);
      expect(scene.player.setTint).toHaveBeenCalledWith(MATRIX_COLORS.PRIMARY);
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
      scene.updateCombo(4001);
      expect(scene.combo).toBe(0);
    });

    it('should keep combo alive within the 3-second window', () => {
      scene.combo = 5;
      scene.lastComboTime = 1000;
      scene.updateCombo(3999);
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

    it('should destroy enemy when NEO mode is active', () => {
      scene.time.now = 0;
      scene.activatePowerUp('neo_mode', 8000);
      const enemy = createMockEnemy();
      scene.handleEnemyCollision(enemy);
      expect(scene.isGameOver).toBe(false);
      expect(enemy.setActive).toHaveBeenCalledWith(false);
      expect(enemy.setVisible).toHaveBeenCalledWith(false);
    });

    it('should award NEO_DESTROY score when destroying enemy in NEO mode', () => {
      scene.time.now = 0;
      scene.activatePowerUp('neo_mode', 8000);
      const enemy = createMockEnemy();
      scene.handleEnemyCollision(enemy);
      expect(scene.score).toBe(GAME_CONFIG.SCORING.NEO_DESTROY);
    });

    it('should unlock NEO_UNSTOPPABLE after 3 kills in NEO mode', () => {
      scene.time.now = 0;
      scene.activatePowerUp('neo_mode', 8000);
      for (let i = 0; i < 3; i++) {
        scene.handleEnemyCollision(createMockEnemy());
      }
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.NEO_UNSTOPPABLE);
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

    it('should play the frogger death sound on death', () => {
      scene.playerDeath(createMockEnemy());
      expect(scene.playSound).toHaveBeenCalledWith('froggerDeath');
    });

    it('should not double-trigger if already game over', () => {
      scene.playerDeath(createMockEnemy());
      scene.player.setTint.mockClear();
      scene.playerDeath(createMockEnemy());
      expect(scene.player.setTint).not.toHaveBeenCalled();
    });

    it('should create a death tween animation', () => {
      scene.playerDeath(createMockEnemy());
      expect(scene.tweens.add).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Kung Fu Ability
  // -----------------------------------------------------------------------
  describe('Kung Fu Ability', () => {
    it('should start with MAX_CHARGES', () => {
      expect(scene.kungFuCharges).toBe(GAME_CONFIG.KUNG_FU.MAX_CHARGES);
    });

    it('should not fire when no enemies in range', () => {
      scene.enemies.getChildren.mockReturnValue([]);
      scene.time.now = 1000;
      scene.useKungFu();
      expect(scene.kungFuCharges).toBe(GAME_CONFIG.KUNG_FU.MAX_CHARGES);
    });

    it('should decrement charges when destroying an enemy', () => {
      const enemy = createMockEnemy();
      enemy.x = scene.player.x + 30;
      enemy.y = scene.player.y;
      scene.enemies.getChildren.mockReturnValue([enemy]);

      const phaserMod = Phaser as any;
      if (!phaserMod.Math) phaserMod.Math = {};
      if (!phaserMod.Math.Distance) phaserMod.Math.Distance = {};
      phaserMod.Math.Distance.Between = vi.fn().mockReturnValue(30);

      scene.time.now = 1000;
      scene.updateKungFuDisplay = vi.fn();
      scene.useKungFu();
      expect(scene.kungFuCharges).toBe(GAME_CONFIG.KUNG_FU.MAX_CHARGES - 1);
    });

    it('should not fire when no charges remain', () => {
      scene.kungFuCharges = 0;
      scene.time.now = 1000;
      scene.useKungFu();
      expect(scene.playSound).not.toHaveBeenCalled();
    });

    it('should respect cooldown', () => {
      const enemy = createMockEnemy();
      enemy.x = scene.player.x + 30;
      enemy.y = scene.player.y;
      scene.enemies.getChildren.mockReturnValue([enemy]);

      const phaserMod = Phaser as any;
      if (!phaserMod.Math) phaserMod.Math = {};
      if (!phaserMod.Math.Distance) phaserMod.Math.Distance = {};
      phaserMod.Math.Distance.Between = vi.fn().mockReturnValue(30);

      scene.time.now = 1000;
      scene.updateKungFuDisplay = vi.fn();
      scene.useKungFu();
      expect(scene.kungFuCharges).toBe(GAME_CONFIG.KUNG_FU.MAX_CHARGES - 1);

      // Try again within cooldown
      scene.time.now = 1100;
      scene.useKungFu();
      expect(scene.kungFuCharges).toBe(GAME_CONFIG.KUNG_FU.MAX_CHARGES - 1);
    });

    it('should unlock KUNG_FU_MASTER when all charges used', () => {
      const enemy = createMockEnemy();
      enemy.x = scene.player.x + 30;
      enemy.y = scene.player.y;
      scene.enemies.getChildren.mockReturnValue([enemy]);

      const phaserMod = Phaser as any;
      if (!phaserMod.Math) phaserMod.Math = {};
      if (!phaserMod.Math.Distance) phaserMod.Math.Distance = {};
      phaserMod.Math.Distance.Between = vi.fn().mockReturnValue(30);

      scene.updateKungFuDisplay = vi.fn();

      for (let i = 0; i < GAME_CONFIG.KUNG_FU.MAX_CHARGES; i++) {
        scene.time.now = 1000 + i * (GAME_CONFIG.KUNG_FU.COOLDOWN + 100);
        scene.useKungFu();
      }

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.KUNG_FU_MASTER);
    });
  });

  // -----------------------------------------------------------------------
  // Level Progression
  // -----------------------------------------------------------------------
  describe('Level Progression', () => {
    it('should increment level when reaching row 0', () => {
      scene.playerRow = 0;
      scene.showLevelUpText = vi.fn();
      scene.checkProgress();
      expect(scene.level).toBe(2);
    });

    it('should award CROSS_BONUS when reaching the top row', () => {
      scene.playerRow = 0;
      scene.showLevelUpText = vi.fn();
      scene.checkProgress();
      expect(scene.score).toBe(GAME_CONFIG.SCORING.CROSS_BONUS);
    });

    it('should reset player to start position after crossing', () => {
      scene.playerRow = 0;
      scene.showLevelUpText = vi.fn();
      scene.checkProgress();
      expect(scene.playerRow).toBe(GAME_CONFIG.PLAYER.START_ROW);
      expect(scene.playerCol).toBe(GAME_CONFIG.PLAYER.START_COL);
    });

    it('should unlock LEVEL_5 when level reaches 5', () => {
      scene.level = 4;
      scene.playerRow = 0;
      scene.showLevelUpText = vi.fn();
      scene.checkProgress();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.LEVEL_5);
    });

    // -------------------------------------------------------------------------
    // R86.F1 — finish-line death/freeze regression tripwires.
    //
    // The original bug: movePlayer() set playerRow = 0 before its tween started,
    // so checkProgress fired on the same frame and spun up a second competing
    // tween. The player's physics body then slid through road lanes 1-7 during
    // the 300 ms reset, triggering an enemy overlap → playerDeath → a third
    // tween that fought the reset and stalled, freezing the game on Level 1.
    //
    // These tests lock in the state-machine fix: while isLevelingUp is true
    // the scene must refuse re-entry, refuse collision damage, refuse input,
    // and re-arm itself only once the reset tween's onComplete fires.
    // -------------------------------------------------------------------------
    describe('Level-up safety (R86.F1)', () => {
      it('should set isLevelingUp while the reset tween is in flight', () => {
        scene.tweens = { add: vi.fn(), killTweensOf: vi.fn() };
        scene.playerRow = 0;
        scene.showLevelUpText = vi.fn();
        scene.checkProgress();
        expect(scene.isLevelingUp).toBe(true);
      });

      it('should kill any in-flight player tweens before starting the reset', () => {
        const killSpy = vi.fn();
        scene.tweens = { add: vi.fn(), killTweensOf: killSpy };
        scene.playerRow = 0;
        scene.showLevelUpText = vi.fn();
        scene.checkProgress();
        expect(killSpy).toHaveBeenCalledWith(scene.player);
      });

      it('should disable the player physics body for the duration of the reset', () => {
        scene.tweens = { add: vi.fn(), killTweensOf: vi.fn() };
        scene.player.body = { enable: true };
        scene.playerRow = 0;
        scene.showLevelUpText = vi.fn();
        scene.checkProgress();
        expect(scene.player.body.enable).toBe(false);
      });

      it('should re-enable physics and clear isLevelingUp when the reset tween completes', () => {
        let capturedOnComplete: (() => void) | undefined;
        scene.tweens = {
          add: vi.fn((config: { onComplete?: () => void }) => {
            capturedOnComplete = config.onComplete;
          }),
          killTweensOf: vi.fn(),
        };
        scene.player.body = { enable: true };
        scene.applyPlayerPerspective = vi.fn();
        scene.playerRow = 0;
        scene.showLevelUpText = vi.fn();
        scene.checkProgress();

        expect(scene.isLevelingUp).toBe(true);
        expect(scene.player.body.enable).toBe(false);

        capturedOnComplete?.();
        expect(scene.isLevelingUp).toBe(false);
        expect(scene.player.body.enable).toBe(true);
        expect(scene.applyPlayerPerspective).toHaveBeenCalled();
      });

      it('should not re-fire triggerLevelUp if checkProgress runs again mid-reset', () => {
        scene.tweens = { add: vi.fn(), killTweensOf: vi.fn() };
        scene.isLevelingUp = true;
        scene.playerRow = 0;
        scene.showLevelUpText = vi.fn();
        const prevLevel = scene.level;
        scene.checkProgress();
        expect(scene.level).toBe(prevLevel);
      });

      it('should clear bufferedInput and isMoving when entering level-up', () => {
        scene.tweens = { add: vi.fn(), killTweensOf: vi.fn() };
        scene.bufferedInput = { col: 1, row: 1 };
        scene.isMoving = true;
        scene.playerRow = 0;
        scene.showLevelUpText = vi.fn();
        scene.checkProgress();
        expect(scene.bufferedInput).toBeNull();
        expect(scene.isMoving).toBe(false);
      });

      it('should suppress enemy collisions while isLevelingUp is true', () => {
        scene.isLevelingUp = true;
        const enemy = createMockEnemy();
        scene.handleEnemyCollision(enemy);
        expect(scene.isGameOver).toBe(false);
        expect(scene.player.setTint).not.toHaveBeenCalledWith(MATRIX_COLORS.RED);
      });

      it('should suppress enemy collisions once isGameOver is set (belt-and-suspenders)', () => {
        scene.isGameOver = true;
        const enemy = createMockEnemy();
        scene.handleEnemyCollision(enemy);
        // Tint should not have been re-applied during the guard-blocked call
        expect(scene.player.setTint).not.toHaveBeenCalled();
      });
    });
  });

  // -----------------------------------------------------------------------
  // R86.F2 — Countdown-gated spawn arming
  //
  // Tom repro (MANUAL_TESTING_CHECKLIST_Matrix_Frogger.md line 44):
  // *"5-second countdown fires correctly after menu - no 5 second countdown"*
  //
  // Root cause (same cascade R85.M2 fixed for Metris): create() pre-spawned
  // enemies + pills and armed 2s/3s interval spawn timers BEFORE calling
  // startCountdown(). The countdown digit painted at depth 200 but the board
  // already had moving traffic visible underneath, so the pre-game moment
  // visually read as "gameplay already running" — even though `update()`
  // gated enemy movement, new spawns fired mid-countdown, defeating the
  // pre-game pause.
  //
  // Fix is two-pronged defence-in-depth: (a) gameplay arming is funnelled
  // through `armGameplay()` which is passed as startCountdown's onComplete,
  // so no spawn timer arms during the 5s window; (b) spawnEnemy/spawnPills
  // themselves early-return on `isCountingDown || isGameOver || isLevelingUp`
  // so a future refactor that rearms the timer pre-countdown cannot
  // resurrect the original bug.
  // -----------------------------------------------------------------------
  describe('R86.F2 — Countdown-gated spawn arming', () => {
    it('spawnEnemy no-ops while isCountingDown (pre-game moment is clean)', () => {
      scene.isCountingDown = true;
      scene.lanes = undefined; // would throw past the guard
      scene.enemies = { get: vi.fn() };
      expect(() => scene.spawnEnemy()).not.toThrow();
      expect(scene.enemies.get).not.toHaveBeenCalled();
    });

    it('spawnEnemy no-ops while isGameOver (stray timer tick after death)', () => {
      scene.isGameOver = true;
      scene.lanes = undefined;
      scene.enemies = { get: vi.fn() };
      expect(() => scene.spawnEnemy()).not.toThrow();
      expect(scene.enemies.get).not.toHaveBeenCalled();
    });

    it('spawnEnemy no-ops while isLevelingUp (pairs with R86.F1 level-up gate)', () => {
      scene.isLevelingUp = true;
      scene.lanes = undefined;
      scene.enemies = { get: vi.fn() };
      expect(() => scene.spawnEnemy()).not.toThrow();
      expect(scene.enemies.get).not.toHaveBeenCalled();
    });

    it('spawnPills no-ops while isCountingDown', () => {
      const getSpy = vi.fn();
      scene.pills = { get: getSpy };
      scene.isCountingDown = true;
      scene.spawnPills();
      expect(getSpy).not.toHaveBeenCalled();
    });

    it('spawnPills no-ops while isGameOver', () => {
      const getSpy = vi.fn();
      scene.pills = { get: getSpy };
      scene.isGameOver = true;
      scene.spawnPills();
      expect(getSpy).not.toHaveBeenCalled();
    });

    it('spawnPills no-ops while isLevelingUp', () => {
      const getSpy = vi.fn();
      scene.pills = { get: getSpy };
      scene.isLevelingUp = true;
      scene.spawnPills();
      expect(getSpy).not.toHaveBeenCalled();
    });

    it('armGameplay spawns the first wave and arms both interval timers', () => {
      scene.isGameOver = false;
      scene.spawnInitialEnemies = vi.fn();
      scene.spawnPills = vi.fn();
      const addEventSpy = vi.fn();
      scene.time = { addEvent: addEventSpy };

      scene.armGameplay();

      expect(scene.spawnInitialEnemies).toHaveBeenCalledTimes(1);
      expect(scene.spawnPills).toHaveBeenCalledTimes(1);
      expect(addEventSpy).toHaveBeenCalledTimes(2);
      const [enemyTimer, pillTimer] = addEventSpy.mock.calls.map((c: any[]) => c[0]);
      expect(enemyTimer.delay).toBe(2000);
      expect(enemyTimer.loop).toBe(true);
      expect(pillTimer.delay).toBe(3000);
      expect(pillTimer.loop).toBe(true);
    });

    it('armGameplay no-ops if the player dies during the countdown (isGameOver edge case)', () => {
      scene.isGameOver = true;
      scene.spawnInitialEnemies = vi.fn();
      scene.spawnPills = vi.fn();
      const addEventSpy = vi.fn();
      scene.time = { addEvent: addEventSpy };

      scene.armGameplay();

      expect(scene.spawnInitialEnemies).not.toHaveBeenCalled();
      expect(scene.spawnPills).not.toHaveBeenCalled();
      expect(addEventSpy).not.toHaveBeenCalled();
    });

    it('spawnEnemy guard flips with isCountingDown (regression tripwire)', () => {
      // With the guard tripped, spawnEnemy must short-circuit before reading
      // `this.lanes`. With the guard off, it must proceed to `this.lanes.map()`.
      // Using undefined `lanes` as the canary: bail-out = no throw, advance =
      // TypeError. The post-guard body depends on `Phaser.Utils.Array.GetRandom`
      // which is mocked out in jsdom, so a full end-to-end spawn is not testable
      // here — but the guard transition IS, and that's what R86.F2 needs to lock.
      scene.isCountingDown = true;
      scene.isGameOver = false;
      scene.isLevelingUp = false;
      scene.lanes = undefined;
      expect(() => scene.spawnEnemy()).not.toThrow();

      scene.isCountingDown = false;
      expect(() => scene.spawnEnemy()).toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // Achievement Thresholds
  // -----------------------------------------------------------------------
  describe('Achievement Thresholds', () => {
    it('should unlock FIRST_CROSS when playerRow reaches 0', () => {
      scene.playerRow = 0;
      scene.showLevelUpText = vi.fn();
      scene.checkProgress();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_CROSS);
    });

    it('should unlock SCORE_1000 when score reaches 1000', () => {
      scene.score = 1000;
      scene.showLevelUpText = vi.fn();
      scene.checkProgress();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SCORE_1000);
    });

    it('should unlock SCORE_5000 when score reaches 5000', () => {
      scene.score = 5000;
      scene.showLevelUpText = vi.fn();
      scene.checkProgress();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SCORE_5000);
    });

    it('should unlock DISTANCE_500 when maxDistance reaches 5', () => {
      scene.maxDistance = 5;
      scene.showLevelUpText = vi.fn();
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
      const enemy = {
        active: true,
        x: scene.player.x + GAME_CONFIG.CELL_SIZE * 0.5,
        y: scene.player.y,
      };
      scene.enemies.getChildren.mockReturnValue([enemy]);

      const phaserMod = Phaser as any;
      if (!phaserMod.Math) phaserMod.Math = {};
      if (!phaserMod.Math.Distance) phaserMod.Math.Distance = {};
      phaserMod.Math.Distance.Between = vi.fn().mockReturnValue(GAME_CONFIG.CELL_SIZE * 0.5);

      scene.nearMissCount = 9;
      scene.checkNearMiss();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.DODGE_MASTER);
    });
  });

  // -----------------------------------------------------------------------
  // R86.F3 — Kung Fu HUD positioning (regression tripwire)
  //
  // Tom's R86 playtest: the Kung Fu charge icons were "cut off" along the
  // canvas floor (old baseY = HEIGHT-35 → icon bottoms at y=589, 11px clear
  // of 600) and the 7px label fused with the START safe-zone backdrop. Fix
  // moves the HUD into the top-left gutter alongside Score/Distance/Combo.
  // These assertions pin the new layout so any future regression that drops
  // the HUD back under the play area turns the gate red.
  // -----------------------------------------------------------------------
  describe('R86.F3 — Kung Fu HUD positioning', () => {
    function addTextCalls(): Array<[number, number, string, Record<string, unknown>]> {
      return (scene.add.text as any).mock.calls;
    }
    function addSpriteCalls(): Array<[number, number, string]> {
      return (scene.add.sprite as any).mock.calls;
    }
    function parseFontPx(value: string | undefined): number | null {
      const match = (value ?? '').match(/(\d+)px/);
      return match ? Number(match[1]) : null;
    }

    it('renders the label in the top-left HUD stack, not the bottom', () => {
      scene.createKungFuDisplay();
      const labelCall = addTextCalls().find((c) => c[2] === 'KUNG FU [K]');
      expect(labelCall).toBeDefined();
      const [x, y] = labelCall!;
      expect(x).toBe(10); // left gutter column (matches Score/Distance/Combo)
      expect(y).toBeGreaterThanOrEqual(60); // below Combo (y=55)
      expect(y).toBeLessThan(GAME_CONFIG.HEIGHT / 2); // squarely in top half
    });

    it('paints the label at a readable font size (>=10px)', () => {
      scene.createKungFuDisplay();
      const labelCall = addTextCalls().find((c) => c[2] === 'KUNG FU [K]');
      const style = labelCall![3] as { fontSize?: string };
      const px = parseFontPx(style.fontSize);
      expect(px).not.toBeNull();
      expect(px!).toBeGreaterThanOrEqual(10);
    });

    it('stacks all three charge icons in the top-left HUD gutter', () => {
      scene.createKungFuDisplay();
      const iconCalls = addSpriteCalls().filter((c) => c[2] === 'kung_fu_icon');
      expect(iconCalls).toHaveLength(GAME_CONFIG.KUNG_FU.MAX_CHARGES);

      const ys = iconCalls.map((c) => c[1]);
      expect(new Set(ys).size).toBe(1); // all icons share a baseline

      for (const [x, y] of iconCalls) {
        // The 25° perspective taper keeps x<120 dark through rows 0-2, so
        // icons here never paint over a road lane.
        expect(x).toBeLessThan(120);
        expect(y).toBeLessThan(GAME_CONFIG.HEIGHT / 2);
      }
    });

    it('keeps every icon clear of the canvas floor (regression: no more clipping)', () => {
      scene.createKungFuDisplay();
      const iconCalls = addSpriteCalls().filter((c) => c[2] === 'kung_fu_icon');
      // 24×24 icons, default origin 0.5/0.5 → bottom edge = centre y + 12.
      // Require ≥100px of clearance from the canvas floor so that portal
      // frame rounding / bezel padding cannot ever clip the HUD again.
      for (const [, y] of iconCalls) {
        expect(y + 12).toBeLessThanOrEqual(GAME_CONFIG.HEIGHT - 100);
      }
    });

    it('orders label above icons (label.y < icon.y)', () => {
      scene.createKungFuDisplay();
      const labelCall = addTextCalls().find((c) => c[2] === 'KUNG FU [K]');
      const iconCalls = addSpriteCalls().filter((c) => c[2] === 'kung_fu_icon');
      const labelY = labelCall![1];
      for (const [, iconY] of iconCalls) {
        expect(iconY).toBeGreaterThan(labelY);
      }
    });

    it('populates kungFuIcons with MAX_CHARGES sprites (wiring preserved)', () => {
      scene.createKungFuDisplay();
      expect(scene.kungFuIcons).toHaveLength(GAME_CONFIG.KUNG_FU.MAX_CHARGES);
    });
  });

  // -----------------------------------------------------------------------
  // R86.F4 — Hit-box clamped to lane bounds
  //
  // Tom repro (MANUAL_TESTING_CHECKLIST_Matrix_Frogger.md line 135):
  // *"Need to make sure the objects are not big enough to run into the
  // safe area too."*
  //
  // Root cause (geometry, not art): enemies render with origin(0.5, 1) so
  // their bottoms sit at the lane centre (rowToY) for the perspective lean.
  // Phaser's body.setSize(center=true) then anchors the body on the
  // sprite's DISPLAY centre — displayHeight/2 above the lane centre. For
  // the cars at row 5 (baseScale 3.0 × perspScale 0.85 → display 40.8px,
  // lane height 66.6px) that body.top lands 7.5px past row 5's top, inside
  // the row 4 middle safe zone. Player resting on row 4 takes a "ghost"
  // hit from a lane they aren't in.
  //
  // Fix: applyEnemyBody clamps body width to HITBOX.WIDTH_RATIO for lateral
  // forgiveness, caps body height so it can never exceed HITBOX.HEIGHT_RATIO
  // of the lane, and re-offsets the body so it centres on rowToY rather than
  // the displaced sprite centre. Chasers are exempt (they legitimately
  // cross lanes via verticalSpeed).
  // -----------------------------------------------------------------------
  describe('R86.F4 — Hit-box clamped to lane bounds', () => {
    function buildMockEnemy(opts: {
      frameWidth: number;
      frameHeight: number;
      scaleX: number;
      scaleY: number;
      enemyType: 'agent' | 'sentinel' | 'chaser';
    }) {
      const body = {
        size: { width: opts.frameWidth, height: opts.frameHeight },
        offset: { x: 0, y: 0 },
        setSize: vi.fn(function (this: any, w: number, h: number) {
          this.size = { width: w, height: h };
          return this;
        }),
        setOffset: vi.fn(function (this: any, x: number, y: number) {
          this.offset = { x, y };
          return this;
        }),
      };
      return {
        body,
        frame: { width: opts.frameWidth, height: opts.frameHeight },
        scaleX: opts.scaleX,
        scaleY: opts.scaleY,
        enemyType: opts.enemyType,
      };
    }

    it('clamps body width below frame.width for non-chasers (lateral forgiveness)', () => {
      const enemy = buildMockEnemy({
        frameWidth: 16,
        frameHeight: 16,
        scaleX: 2.55,
        scaleY: 2.55,
        enemyType: 'agent',
      });
      scene.laneH = Array(GAME_CONFIG.GRID_ROWS).fill(66.6);

      scene.applyEnemyBody(enemy, 5);

      expect(enemy.body.setSize).toHaveBeenCalledTimes(1);
      const [width] = enemy.body.setSize.mock.calls[0];
      expect(width).toBeCloseTo(16 * GAME_CONFIG.HITBOX.WIDTH_RATIO);
      expect(width).toBeLessThan(16);
    });

    it('row 5 car body never extends past row 4 (Tom repro: safe-zone ghost hit)', () => {
      // Measured lane geometry: row 4 bottom lands at rowToY(5) - row5H/2 =
      // rowToY(5) - 33.3. With origin(0.5, 1) the enemy sits at rowToY(5)
      // so body.top (world) = rowToY(5) - displayHeight + offsetY*scaleY.
      const frame = { width: 16, height: 16 };
      const scale = 2.55; // baseScale 3.0 × perspScale(row5) 0.85
      const laneH5 = 66.6;
      const enemy = buildMockEnemy({
        frameWidth: frame.width,
        frameHeight: frame.height,
        scaleX: scale,
        scaleY: scale,
        enemyType: 'agent',
      });
      scene.laneH = Array(GAME_CONFIG.GRID_ROWS).fill(66.6);
      scene.laneH[5] = laneH5;

      scene.applyEnemyBody(enemy, 5);

      const [, bodyHeightSource] = enemy.body.setSize.mock.calls[0];
      const [, offsetY] = enemy.body.setOffset.mock.calls[0];
      const displayHeight = frame.height * scale;
      const bodyHeightWorld = bodyHeightSource * scale;

      // Body top relative to sprite.y (= rowToY(5)):
      //   body.position.y = sprite.y - displayHeight + offsetY * scale
      const bodyTopRel = -displayHeight + offsetY * scale;
      const bodyBottomRel = bodyTopRel + bodyHeightWorld;

      // Row 5 occupies [rowToY - laneH5/2, rowToY + laneH5/2] relative to sprite.y=rowToY.
      const rowTopRel = -laneH5 / 2;
      const rowBottomRel = laneH5 / 2;

      expect(bodyTopRel).toBeGreaterThanOrEqual(rowTopRel - 0.01);
      expect(bodyBottomRel).toBeLessThanOrEqual(rowBottomRel + 0.01);
    });

    it('re-centres body on rowToY (lane centre), not sprite display centre', () => {
      // With offsetY = frame.height - bodyHeight/2, Phaser's body world y is
      //   sprite.y - displayHeight + offsetY * scaleY
      // Body centre world y = body.top + bodyHeight*scale/2. For the body
      // to centre on sprite.y (= rowToY), that must equal sprite.y.
      const frame = { width: 16, height: 16 };
      const scale = 2.55;
      const enemy = buildMockEnemy({
        frameWidth: frame.width,
        frameHeight: frame.height,
        scaleX: scale,
        scaleY: scale,
        enemyType: 'agent',
      });
      scene.laneH = Array(GAME_CONFIG.GRID_ROWS).fill(66.6);

      scene.applyEnemyBody(enemy, 5);

      const [, bodyHeightSource] = enemy.body.setSize.mock.calls[0];
      const [, offsetY] = enemy.body.setOffset.mock.calls[0];
      const displayHeight = frame.height * scale;
      const bodyHeightWorld = bodyHeightSource * scale;

      const bodyTopRel = -displayHeight + offsetY * scale;
      const bodyCentreRel = bodyTopRel + bodyHeightWorld / 2;

      expect(bodyCentreRel).toBeCloseTo(0, 5); // 0 == sprite.y == rowToY
    });

    it('clamps body height below frame when the lane is smaller than displayed sprite', () => {
      // Force a tight lane: laneH * HEIGHT_RATIO < displayHeight so the
      // clamp actually bites (otherwise bodyHeight defaults to frame.height).
      const frame = { width: 32, height: 32 };
      const scale = 3.0;
      const tightLane = 40; // 40 * 0.85 = 34 < 32*3 = 96 display → clamp triggers
      const enemy = buildMockEnemy({
        frameWidth: frame.width,
        frameHeight: frame.height,
        scaleX: scale,
        scaleY: scale,
        enemyType: 'agent',
      });
      scene.laneH = Array(GAME_CONFIG.GRID_ROWS).fill(tightLane);

      scene.applyEnemyBody(enemy, 2);

      const [, bodyHeightSource] = enemy.body.setSize.mock.calls[0];
      const expected = (tightLane * GAME_CONFIG.HITBOX.HEIGHT_RATIO) / scale;
      expect(bodyHeightSource).toBeCloseTo(expected);
      expect(bodyHeightSource).toBeLessThan(frame.height);
    });

    it('keeps full-frame body for chasers (they cross lanes legitimately)', () => {
      const enemy = buildMockEnemy({
        frameWidth: 64,
        frameHeight: 64,
        scaleX: 0.6,
        scaleY: 0.6,
        enemyType: 'chaser',
      });
      scene.laneH = Array(GAME_CONFIG.GRID_ROWS).fill(40); // intentionally tight

      scene.applyEnemyBody(enemy, 3);

      expect(enemy.body.setSize).toHaveBeenCalledWith(64, 64);
      expect(enemy.body.setOffset).not.toHaveBeenCalled();
    });

    it('exposes HITBOX constants for the hit-box contract (prevents silent drift)', () => {
      expect(GAME_CONFIG.HITBOX.WIDTH_RATIO).toBeLessThanOrEqual(1);
      expect(GAME_CONFIG.HITBOX.WIDTH_RATIO).toBeGreaterThan(0.5);
      expect(GAME_CONFIG.HITBOX.HEIGHT_RATIO).toBeLessThanOrEqual(1);
      expect(GAME_CONFIG.HITBOX.HEIGHT_RATIO).toBeGreaterThan(0.5);
    });
  });

  // -----------------------------------------------------------------------
  // R86.F7 — Coverage refresh
  //
  // F1–F5 each locked a specific polish fix. F7 sweeps the cross-cutting
  // *guards* that keep those fixes closed — the single-line checks scattered
  // through checkProgress / handleInput / update() that F1 relied on but
  // never directly asserted. If any one of these guards is removed in a
  // future refactor the game reverts to the Level-1 freeze Tom reported; the
  // existing behaviour tests would still pass (because the side-channel they
  // exercise re-blocks via a different guard). These tripwires pin each
  // guard on its own, so a silent guard removal turns the gate red.
  // -----------------------------------------------------------------------
  describe('R86.F7 — Finish-line guards', () => {
    // --- checkProgress must respect isGameOver as well as isLevelingUp -----
    it('checkProgress does not trigger level-up when isGameOver is already true', () => {
      // If the player's death tween lands them on row 0 (via reset-tween
      // position) we must not double-trigger: the death path owns the scene.
      scene.tweens = { add: vi.fn(), killTweensOf: vi.fn() };
      scene.showLevelUpText = vi.fn();
      scene.isGameOver = true;
      scene.playerRow = 0;
      const prevLevel = scene.level;
      scene.checkProgress();
      expect(scene.level).toBe(prevLevel);
      expect(scene.isLevelingUp).toBe(false);
    });

    // --- handleInput must bail on both isLevelingUp AND isGameOver ---------
    // These guards are what stop the player from re-hopping mid-reset-tween
    // (which would stack a third tween onto the player sprite — the exact
    // R86.F1 cascade). The existing F1 tests only verify indirect effects;
    // these two lock the guard itself.
    function makeCursors() {
      // JustDown reads .isDown on a key; default false so no movement fires.
      const key = { isDown: false };
      return {
        cursors: { up: key, down: key, left: key, right: key },
        wasd: {
          W: { isDown: false },
          A: { isDown: false },
          S: { isDown: false },
          D: { isDown: false },
        },
      };
    }

    it('handleInput early-returns when isLevelingUp is true (no movePlayer, no bufferedInput)', () => {
      const { cursors, wasd } = makeCursors();
      scene.cursors = cursors;
      scene.wasdKeys = wasd;
      scene.movePlayer = vi.fn();
      scene.isLevelingUp = true;
      // If the guard is removed, the body below would read cursor.up etc. and
      // potentially call movePlayer — assert neither happens.
      scene.handleInput();
      expect(scene.movePlayer).not.toHaveBeenCalled();
      expect(scene.bufferedInput).toBeNull();
    });

    it('handleInput early-returns when isGameOver is true (input silenced)', () => {
      const { cursors, wasd } = makeCursors();
      scene.cursors = cursors;
      scene.wasdKeys = wasd;
      scene.movePlayer = vi.fn();
      scene.isGameOver = true;
      scene.handleInput();
      expect(scene.movePlayer).not.toHaveBeenCalled();
    });

    // --- triggerLevelUp's juice --------------------------------------------
    it('triggerLevelUp plays FROGGER_SCORE sound and flashes the camera green', () => {
      // Juice was lost once in a refactor (commit pre-R86.F1) and never tested.
      // Lock both signals: the celebratory sound + the green camera flash
      // (r=0, g=255, b=0).
      scene.tweens = { add: vi.fn(), killTweensOf: vi.fn() };
      scene.showLevelUpText = vi.fn();
      scene.playerRow = 0;
      scene.checkProgress();

      expect(scene.playSound).toHaveBeenCalledWith('froggerScore');
      expect(scene.cameras.main.flash).toHaveBeenCalledWith(
        150,
        0,
        255,
        0,
        false,
        undefined,
        undefined,
        0.15,
      );
    });

    // --- showLevelUpText reads POST-increment level number -----------------
    it('renders LEVEL N banner with the post-increment number (lock R86.F1 ordering)', () => {
      // The order inside triggerLevelUp is critical: this.level++ MUST run
      // before showLevelUpText() so the banner displays the NEW level. If a
      // future refactor flips the order, the first cross would show "LEVEL 1"
      // instead of "LEVEL 2".
      scene.tweens = { add: vi.fn(), killTweensOf: vi.fn() };
      scene.level = 1;
      scene.playerRow = 0;
      // Let the real showLevelUpText run — scene.add.text is already mocked.
      scene.checkProgress();

      const textCalls = (scene.add.text as any).mock.calls;
      const levelBanner = textCalls.find(
        (c: unknown[]) => typeof c[2] === 'string' && (c[2] as string).startsWith('LEVEL '),
      );
      expect(levelBanner).toBeDefined();
      expect(levelBanner![2]).toBe('LEVEL 2');
    });
  });

  // -----------------------------------------------------------------------
  // R86.F7 — update-loop countdown gate
  //
  // F2 tests spawnEnemy / spawnPills guards directly. That catches one class
  // of regression (spawn timers firing pre-game). But the top-level update()
  // has ITS OWN `if (this.isCountingDown) return;` early-return before it
  // calls updateEnemies / checkProgress / handleInput. Without this guard,
  // enemies already on the board at countdown-start would still tick their
  // positions and checkProgress could re-fire immediately. Pin both:
  //   (a) update() short-circuits gameplay during the countdown.
  //   (b) update() resumes gameplay once isCountingDown flips false.
  // -----------------------------------------------------------------------
  describe('R86.F7 — update() countdown gate', () => {
    function stubUpdateLoopSpies(s: any) {
      // Gameplay-tick methods that update() calls AFTER the isCountingDown guard.
      s.updateMatrixRain = vi.fn();
      s.rainGroup = {};
      s.roadDashSprites = [];
      s.cursors = { up: {}, down: {}, left: {}, right: {} };
      s.handleInput = vi.fn();
      s.updateEnemies = vi.fn();
      s.updatePowerUps = vi.fn();
      s.updateNeoFlash = vi.fn();
      s.applyMagnetEffect = vi.fn();
      s.updateCombo = vi.fn();
      s.checkProgress = vi.fn();
      s.exposeTestState = vi.fn();
      s.isPaused = false;
    }

    it('update() skips gameplay ticks while isCountingDown is true', () => {
      stubUpdateLoopSpies(scene);
      scene.isCountingDown = true;
      scene.update(1000, 16);

      // Pre-guard side-effects still run (rain + road dashes are cosmetic).
      expect(scene.updateMatrixRain).toHaveBeenCalled();

      // Post-guard gameplay calls MUST all short-circuit.
      expect(scene.handleInput).not.toHaveBeenCalled();
      expect(scene.updateEnemies).not.toHaveBeenCalled();
      expect(scene.updatePowerUps).not.toHaveBeenCalled();
      expect(scene.updateNeoFlash).not.toHaveBeenCalled();
      expect(scene.applyMagnetEffect).not.toHaveBeenCalled();
      expect(scene.updateCombo).not.toHaveBeenCalled();
      expect(scene.checkProgress).not.toHaveBeenCalled();
      expect(scene.exposeTestState).not.toHaveBeenCalled();
    });

    it('update() resumes gameplay ticks once isCountingDown flips false', () => {
      stubUpdateLoopSpies(scene);
      scene.isCountingDown = false;
      scene.update(1000, 16);

      // All the post-guard methods must have been invoked exactly once.
      expect(scene.handleInput).toHaveBeenCalledTimes(1);
      expect(scene.updateEnemies).toHaveBeenCalledTimes(1);
      expect(scene.updatePowerUps).toHaveBeenCalledTimes(1);
      expect(scene.checkProgress).toHaveBeenCalledTimes(1);
      expect(scene.exposeTestState).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // R86.F7 — Hit-box visible-bounds extensions
  //
  // F4 covers ratio + row-5 car geometry (16×16 frame at scale 2.55). F7
  // extends coverage to:
  //   • the 64×64 agent frames that populate the upper road lanes (rows 1-3)
  //     at perspScale ≈ 0.6 — a materially different clamp regime
  //   • the X-offset recentre maths (lateral forgiveness symmetry)
  //   • defensive null-guards that have never had a test
  // -----------------------------------------------------------------------
  describe('R86.F7 — Hit-box visible-bounds extensions', () => {
    function buildMockEnemy(opts: {
      frameWidth: number;
      frameHeight: number;
      scaleX: number;
      scaleY: number;
      enemyType: 'agent' | 'sentinel' | 'chaser';
    }) {
      const body = {
        size: { width: opts.frameWidth, height: opts.frameHeight },
        offset: { x: 0, y: 0 },
        setSize: vi.fn(function (this: any, w: number, h: number) {
          this.size = { width: w, height: h };
          return this;
        }),
        setOffset: vi.fn(function (this: any, x: number, y: number) {
          this.offset = { x, y };
          return this;
        }),
      };
      return {
        body,
        frame: { width: opts.frameWidth, height: opts.frameHeight },
        scaleX: opts.scaleX,
        scaleY: opts.scaleY,
        enemyType: opts.enemyType,
      };
    }

    it('re-centres body laterally — offsetX equals (frame.width - bodyWidth) / 2', () => {
      // Symmetric lateral forgiveness: the 0.75 width ratio takes equal bites
      // off the left and right edges of the sprite, so the body stays
      // horizontally centred on the sprite's own centre.
      const enemy = buildMockEnemy({
        frameWidth: 16,
        frameHeight: 16,
        scaleX: 2.55,
        scaleY: 2.55,
        enemyType: 'agent',
      });
      scene.laneH = Array(GAME_CONFIG.GRID_ROWS).fill(66.6);

      scene.applyEnemyBody(enemy, 5);

      const [bodyWidth] = enemy.body.setSize.mock.calls[0];
      const [offsetX] = enemy.body.setOffset.mock.calls[0];
      expect(offsetX).toBeCloseTo((16 - bodyWidth) / 2);
    });

    it('64×64 agent in a tight upper lane clamps body height via HEIGHT_RATIO', () => {
      // Rows 1-3 carry the 64×64 agent/sentinel sprites at perspScale ~0.6,
      // so display height ≈ 38.4 px. Upper-lane heights post-normalise to
      // the mid-30s-to-40s range, so the lane × 0.85 clamp can bite below
      // frame height (64). Lock that the clamp actually engages.
      const frame = { width: 64, height: 64 };
      const scale = 0.6; // laneScale(row 1) ≈ 0.6 + 1/8 * (1-0.6) = 0.65, use 0.6 for clarity
      const tightLane = 40;
      const enemy = buildMockEnemy({
        frameWidth: frame.width,
        frameHeight: frame.height,
        scaleX: scale,
        scaleY: scale,
        enemyType: 'agent',
      });
      scene.laneH = Array(GAME_CONFIG.GRID_ROWS).fill(tightLane);

      scene.applyEnemyBody(enemy, 1);

      const [, bodyHeightSource] = enemy.body.setSize.mock.calls[0];
      const expected = (tightLane * GAME_CONFIG.HITBOX.HEIGHT_RATIO) / scale;
      expect(bodyHeightSource).toBeCloseTo(expected);
      expect(bodyHeightSource).toBeLessThan(frame.height);
    });

    it('applyEnemyBody no-ops defensively when enemy.body is missing', () => {
      // Phaser leaves body undefined until physics is added. If spawnEnemy
      // ever pulls an object-pooled enemy that hasn't been attached to the
      // arcade group yet, we must not throw — the guard `if (!body || !frame)
      // return;` is the only thing that protects us.
      const enemy = buildMockEnemy({
        frameWidth: 16,
        frameHeight: 16,
        scaleX: 1,
        scaleY: 1,
        enemyType: 'agent',
      });
      const setSizeSpy = enemy.body.setSize;
      (enemy as any).body = null;
      scene.laneH = Array(GAME_CONFIG.GRID_ROWS).fill(60);

      expect(() => scene.applyEnemyBody(enemy, 5)).not.toThrow();
      expect(setSizeSpy).not.toHaveBeenCalled();
    });

    it('applyEnemyBody no-ops defensively when enemy.frame is missing', () => {
      // A sprite without a live texture frame (e.g. destroyed mid-pool) will
      // report frame=null. The guard must short-circuit before reading
      // frame.width.
      const enemy = buildMockEnemy({
        frameWidth: 16,
        frameHeight: 16,
        scaleX: 1,
        scaleY: 1,
        enemyType: 'agent',
      });
      (enemy as any).frame = null;
      scene.laneH = Array(GAME_CONFIG.GRID_ROWS).fill(60);

      expect(() => scene.applyEnemyBody(enemy, 5)).not.toThrow();
      expect(enemy.body.setSize).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // R86.F6 safety-net — Multi-level state persistence invariants.
  //
  // R86.F6 (multi-level polish) is Tom-tick only; these tests pre-lock the
  // state-persistence contract that a "scene-reset artefact" bug would
  // violate. Frogger is a continuous-flow game: crossing the finish line
  // resets the PLAYER position but everything else — score, combo, distance,
  // kung-fu charges, in-flight power-ups — must carry over. If a future
  // refactor accidentally re-initialises any of these on level-up, the
  // game would feel like a reset at each cross instead of an escalating
  // Frogger ascent, and Tom's playtest would catch it only after a slow
  // manual read-back.
  //
  // Anti-regression ratchets live at the bottom of the block so future
  // rebalances can tighten (but not remove) the level-gate boundaries.
  // -----------------------------------------------------------------------
  describe('R86.F6 safety-net — Multi-level state persistence invariants', () => {
    beforeEach(() => {
      // triggerLevelUp calls tweens.killTweensOf + tweens.add. Stub both so
      // the tween doesn't try to dispatch real callbacks against mocks.
      scene.tweens = { add: vi.fn(), killTweensOf: vi.fn() };
      scene.showLevelUpText = vi.fn();
    });

    it('preserves score across level-up (CROSS_BONUS adds, does NOT reset)', () => {
      // Regression guard: a naive "reset everything on level-up" refactor
      // would zero the score. Frogger is continuous — score accumulates.
      scene.score = 250;
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.score).toBe(250 + GAME_CONFIG.SCORING.CROSS_BONUS);
    });

    it('preserves combo across level-up (dodge streak is NOT broken by crossing)', () => {
      // The 30-combo ascent streak is a major score multiplier. If combo
      // zeroed on level-up, the 5× multiplier would be unreachable in
      // practice. Lock that combo + lastComboTime survive the transition.
      scene.combo = 12;
      scene.lastComboTime = 4321;
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.combo).toBe(12);
      expect(scene.lastComboTime).toBe(4321);
    });

    it('preserves maxDistance across level-up (distance bonus keeps accumulating)', () => {
      // Distance drives enemy speed via difficultyBonus in spawnEnemy; if it
      // zeroed on cross, Level 2 would start at Level 1 difficulty and the
      // game would feel like it restarted.
      scene.maxDistance = 7;
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.maxDistance).toBe(7);
    });

    it('does NOT refill kungFuCharges on level-up (charges are earned, not gifted)', () => {
      // Kung Fu has MAX_CHARGES = 3 per RUN, not per level. If crossing the
      // finish-line refilled them, the 3-charge economy would collapse to
      // "grind Level 1 for infinite charges". Lock the one-way depletion.
      scene.kungFuCharges = 1;
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.kungFuCharges).toBe(1);
    });

    it('preserves activePowerUps across level-up (buffs keep ticking)', () => {
      // A shield picked up at row 3 should still protect Neo on Level 2's
      // row 3. Power-up timers run on scene.time, which level-up doesn't
      // touch, so the array reference must survive.
      const pu = { type: 'shield', expiresAt: 9999 };
      scene.activePowerUps = [pu];
      scene.shieldHits = 1;
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.activePowerUps).toHaveLength(1);
      expect(scene.activePowerUps[0]).toBe(pu);
      expect(scene.shieldHits).toBe(1);
    });

    it('preserves nearMissCount across level-up (dodge-master progress is cumulative)', () => {
      // The DODGE_MASTER achievement needs 10 near-misses across a RUN. If
      // level-up zeroed the counter, the achievement would be unreachable
      // for anyone hitting the threshold at e.g. misses 7 + 8 + 9 spread
      // across three levels.
      scene.nearMissCount = 7;
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.nearMissCount).toBe(7);
    });

    it('increments level monotonically across two sequential crossings (level 1 → 2 → 3)', () => {
      // Each crossing is independent: no "cool-down" that blocks level
      // progression. Tom repro for F6 would need to reach Level 3+ and
      // see chasers; this locks the arithmetic prerequisite.
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.level).toBe(2);

      // Simulate the reset tween landing + next finish-line cross.
      scene.isLevelingUp = false;
      scene.playerRow = 0;
      scene.checkProgress();
      expect(scene.level).toBe(3);
    });

    it('CHASING_AGENT_MIN_LEVEL is ≥ 2 (Level 1 MUST be chaser-free — difficulty-ramp anchor)', () => {
      // Level 1 is the tutorial level; chasers (vertical-crossing agents)
      // would turn the first 30 seconds into a panic response. Lock the
      // minimum gate so a future rebalance can tighten (level 3, level 4)
      // but never drop chasers into Level 1.
      expect(GAME_CONFIG.DIFFICULTY.CHASING_AGENT_MIN_LEVEL).toBeGreaterThanOrEqual(2);
    });
  });
});
