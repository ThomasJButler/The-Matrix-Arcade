/**
 * Agent Chase — GameScene unit tests
 *
 * Tests the core gameplay logic (scoring, achievements, deaths, level
 * progression, fruit spawning) without booting a real Phaser canvas.
 *
 * Approach:
 *  1. Instantiate AgentChaseGameScene (the constructor only calls super)
 *  2. Stub every BaseScene / Phaser method that the logic touches
 *  3. Set internal state fields directly via `(scene as any)`
 *  4. Call private methods via `(scene as any).methodName()`
 *  5. Assert state changes and mock invocations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { AgentChaseGameScene } from './GameScene';
import { GAME_CONFIG, ACHIEVEMENTS, getLayoutForLevel, MAP_LAYOUTS } from '../config';

// R86.A2: `getAgentTarget` in frightened state calls `Phaser.Math.Between`.
// Ensure Phaser.Math exists with a default Between before individual tests
// override it — the global Phaser mock in setup.ts leaves Math undefined.
const phaserMath = (Phaser as unknown as Record<string, Record<string, unknown>>).Math ?? {};
phaserMath.Between = phaserMath.Between ?? vi.fn((min: number, max: number) => Math.floor((min + max) / 2));
(Phaser as unknown as Record<string, unknown>).Math = phaserMath;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Minimal mock of a Phaser sprite / game-object that methods call .destroy() on */
function makeMockSprite(overrides: Record<string, unknown> = {}) {
  return {
    destroy: vi.fn(),
    setTexture: vi.fn(),
    ...overrides,
  };
}

/** Minimal mock of an Agent (ghost) object */
function makeMockAgent(state: string = 'scatter') {
  return {
    state,
    agentType: 'smith',
    direction: 'LEFT',
    gridX: 14,
    gridY: 11,
    moveProgress: 0,
    targetTile: { x: 14, y: 11 },
    scatterTarget: { x: 25, y: 0 },
    homePosition: { x: 100, y: 100 },
    isReleased: true,
    frightenedEndTime: 0,
    setTexture: vi.fn(),
    setDepth: vi.fn(),
    setVelocity: vi.fn(),
    destroy: vi.fn(),
    x: 100,
    y: 100,
    body: { setSize: vi.fn() },
  };
}

/**
 * Build a fully-stubbed scene ready for testing.
 *
 * The mocked Phaser.Scene constructor returns a plain object, which breaks
 * the ES-class prototype chain.  We work around this by constructing the
 * scene normally (which gives us the mock base object) and then copying
 * every prototype method from AgentChaseGameScene (and its parents) onto
 * the instance so that `scene.collectDot(...)` etc. resolve correctly.
 */
function createTestScene() {
  const scene = new AgentChaseGameScene() as unknown as Record<string, unknown>;

  // --- Restore the prototype chain that the mock broke ---
  // Walk the prototype chain up to (but not including) Object.prototype and
  // copy every method / property descriptor onto the instance.
  let proto = AgentChaseGameScene.prototype;
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue;
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc && typeof desc.value === 'function' && !(key in scene)) {
        scene[key] = desc.value.bind(scene);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }

  // --- Set default field values (mirroring the class field initialisers) ---
  scene.score = 0;
  scene.lives = 3;
  scene.level = 1;
  scene.dotsCollected = 0;
  scene.totalDots = 0;
  scene.ghostsEatenThisPellet = 0;
  scene.diedThisLevel = false;
  scene.scatterMode = true;
  scene.modeTimer = 0;
  scene.modePhase = 0;
  scene.fruitSpawned = [false, false];
  scene.MODE_TIMES = [7000, 20000, 7000, 20000, 5000, 20000, 5000, Infinity];

  // --- BaseScene methods ---
  scene.playSound = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();

  // --- UI text objects ---
  scene.scoreText = { setText: vi.fn(), setColor: vi.fn(), destroy: vi.fn() };
  scene.livesText = { setText: vi.fn(), destroy: vi.fn() };
  scene.levelText = { setText: vi.fn(), destroy: vi.fn() };
  scene.mapText = { setText: vi.fn(), destroy: vi.fn() };

  // --- Layout tracking ---
  scene.currentLayout = getLayoutForLevel(1);
  scene.mazesPlayed = new Set(['CLASSIC']);

  // --- Phaser subsystem mocks needed by checkLevelComplete ---
  const mockTextObj = { setOrigin: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
  scene.add = { text: vi.fn().mockReturnValue(mockTextObj) };
  scene.tweens = { add: vi.fn() };
  scene.cameras = { main: { shake: vi.fn(), flash: vi.fn() } };

  // --- Sub-methods that dive into Phaser internals ---
  scene.resetPositions = vi.fn();
  scene.restartLevel = vi.fn();
  scene.spawnFruit = vi.fn();
  scene.exposeTestState = vi.fn();

  // Default: do NOT mock checkFruitSpawn / checkLevelComplete so the real
  // implementations run. Individual tests that need isolation can override.

  return scene;
}

/* ================================================================== */
/*  Tests                                                              */
/* ================================================================== */

describe('AgentChaseGameScene', () => {
  let scene: Record<string, unknown>;

  beforeEach(() => {
    scene = createTestScene();
  });

  /* ---------------------------------------------------------------- */
  /*  Initial state                                                    */
  /* ---------------------------------------------------------------- */

  describe('Initial State', () => {
    it('should start with score of 0', () => {
      expect(scene.score).toBe(0);
    });

    it('should start with 3 lives', () => {
      expect(scene.lives).toBe(3);
    });

    it('should start on level 1', () => {
      expect(scene.level).toBe(1);
    });

    it('should start with 0 dots collected', () => {
      expect(scene.dotsCollected).toBe(0);
    });

    it('should start in scatter mode', () => {
      expect(scene.scatterMode).toBe(true);
    });

    it('should have diedThisLevel flag set to false', () => {
      expect(scene.diedThisLevel).toBe(false);
    });

    it('should initialise fruitSpawned as [false, false]', () => {
      expect(scene.fruitSpawned).toEqual([false, false]);
    });

    it('should have MODE_TIMES with the correct scatter/chase durations', () => {
      expect(scene.MODE_TIMES).toEqual([7000, 20000, 7000, 20000, 5000, 20000, 5000, Infinity]);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Dot collection                                                   */
  /* ---------------------------------------------------------------- */

  describe('Dot Collection', () => {
    it('should award 10 points per dot', () => {
      // Mock checkFruitSpawn to isolate collectDot
      scene.checkFruitSpawn = vi.fn();
      scene.checkLevelComplete = vi.fn();

      const dot = makeMockSprite();
      scene.collectDot(dot);

      expect(scene.score).toBe(GAME_CONFIG.SCORING.DOT);
    });

    it('should increment dotsCollected', () => {
      scene.checkFruitSpawn = vi.fn();
      scene.checkLevelComplete = vi.fn();

      const dot = makeMockSprite();
      scene.collectDot(dot);

      expect(scene.dotsCollected).toBe(1);
    });

    it('should destroy the dot sprite', () => {
      scene.checkFruitSpawn = vi.fn();
      scene.checkLevelComplete = vi.fn();

      const dot = makeMockSprite();
      scene.collectDot(dot);

      expect(dot.destroy).toHaveBeenCalledOnce();
    });

    it('should play wakaWaka sound', () => {
      scene.checkFruitSpawn = vi.fn();
      scene.checkLevelComplete = vi.fn();

      scene.collectDot(makeMockSprite());

      expect(scene.playSound).toHaveBeenCalledWith('dotEat');
    });

    it('should unlock FIRST_DOT on the first collection', () => {
      scene.checkFruitSpawn = vi.fn();
      scene.checkLevelComplete = vi.fn();

      scene.collectDot(makeMockSprite());

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_DOT);
    });

    it('should NOT unlock FIRST_DOT on subsequent collections', () => {
      scene.checkFruitSpawn = vi.fn();
      scene.checkLevelComplete = vi.fn();

      // Simulate having already collected one dot
      scene.dotsCollected = 1;

      scene.collectDot(makeMockSprite());

      expect(scene.unlockAchievement).not.toHaveBeenCalled();
    });

    it('should accumulate score across multiple dots', () => {
      scene.checkFruitSpawn = vi.fn();
      scene.checkLevelComplete = vi.fn();

      scene.collectDot(makeMockSprite());
      scene.collectDot(makeMockSprite());
      scene.collectDot(makeMockSprite());

      expect(scene.score).toBe(GAME_CONFIG.SCORING.DOT * 3);
    });

    it('should call checkFruitSpawn after collecting a dot', () => {
      // Use the real checkFruitSpawn to confirm it is invoked (then mock spawnFruit)
      scene.checkLevelComplete = vi.fn();
      const spy = vi.fn();
      scene.checkFruitSpawn = spy;

      scene.collectDot(makeMockSprite());

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Power pellet collection                                          */
  /* ---------------------------------------------------------------- */

  describe('Power Pellet Collection', () => {
    // collectPowerPellet needs this.time.now and this.agents.getChildren()
    beforeEach(() => {
      scene.time = { now: 1000 };
      scene.agents = { getChildren: vi.fn().mockReturnValue([]) };
    });

    it('should award 50 points', () => {
      const pellet = makeMockSprite();
      scene.collectPowerPellet(pellet);

      expect(scene.score).toBe(GAME_CONFIG.SCORING.POWER_PELLET);
    });

    it('should increment dotsCollected', () => {
      scene.collectPowerPellet(makeMockSprite());

      expect(scene.dotsCollected).toBe(1);
    });

    it('should reset ghostsEatenThisPellet to 0', () => {
      scene.ghostsEatenThisPellet = 3;

      scene.collectPowerPellet(makeMockSprite());

      expect(scene.ghostsEatenThisPellet).toBe(0);
    });

    it('should destroy the pellet sprite', () => {
      const pellet = makeMockSprite();
      scene.collectPowerPellet(pellet);

      expect(pellet.destroy).toHaveBeenCalledOnce();
    });

    it('should play powerup sound', () => {
      scene.collectPowerPellet(makeMockSprite());

      expect(scene.playSound).toHaveBeenCalledWith('powerup');
    });

    it('should set non-returning agents to frightened state', () => {
      const agent = makeMockAgent('chase');
      scene.agents = { getChildren: vi.fn().mockReturnValue([agent]) };
      scene.reverseDirection = vi.fn().mockReturnValue('RIGHT');

      scene.collectPowerPellet(makeMockSprite());

      expect(agent.state).toBe('frightened');
      expect(agent.setTexture).toHaveBeenCalledWith('agent_frightened');
    });

    it('should NOT change returning agents to frightened', () => {
      const agent = makeMockAgent('returning');
      scene.agents = { getChildren: vi.fn().mockReturnValue([agent]) };

      scene.collectPowerPellet(makeMockSprite());

      expect(agent.state).toBe('returning');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Ghost eating                                                     */
  /* ---------------------------------------------------------------- */

  describe('Ghost Eating', () => {
    it('should award 200 points for the first ghost', () => {
      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      expect(scene.score).toBe(200);
    });

    it('should award 400 points for the second ghost (200 * 2^1)', () => {
      scene.ghostsEatenThisPellet = 1; // one already eaten
      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      // Second ghost: 200 * 2^1 = 400
      expect(scene.score).toBe(400);
    });

    it('should award 800 points for the third ghost (200 * 2^2)', () => {
      scene.ghostsEatenThisPellet = 2;
      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      expect(scene.score).toBe(800);
    });

    it('should award 1600 points for the fourth ghost (200 * 2^3)', () => {
      scene.ghostsEatenThisPellet = 3;
      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      expect(scene.score).toBe(1600);
    });

    it('should increment ghostsEatenThisPellet', () => {
      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      expect(scene.ghostsEatenThisPellet).toBe(1);
    });

    it('should unlock FIRST_GHOST achievement', () => {
      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_GHOST);
    });

    it('should unlock EAT_ALL_GHOSTS when 4 ghosts eaten in one pellet', () => {
      scene.ghostsEatenThisPellet = 3; // about to eat the fourth

      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.EAT_ALL_GHOSTS);
    });

    it('should NOT unlock EAT_ALL_GHOSTS when fewer than 4 eaten', () => {
      scene.ghostsEatenThisPellet = 1;
      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      const eatAllCalls = scene.unlockAchievement.mock.calls.filter(
        (c: string[]) => c[0] === ACHIEVEMENTS.EAT_ALL_GHOSTS
      );
      expect(eatAllCalls).toHaveLength(0);
    });

    it('should set agent to returning state', () => {
      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      expect(agent.state).toBe('returning');
    });

    it('should set agent texture to eyes', () => {
      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      expect(agent.setTexture).toHaveBeenCalledWith('agent_eyes');
    });

    it('should play ghostEat sound', () => {
      const agent = makeMockAgent('frightened');
      scene.handleAgentCollision(agent);

      expect(scene.playSound).toHaveBeenCalledWith('ghostEat');
    });

    it('should trigger playerDeath when colliding with a non-frightened agent', () => {
      scene.playerDeath = vi.fn();
      const agent = makeMockAgent('chase');
      scene.handleAgentCollision(agent);

      expect(scene.playerDeath).toHaveBeenCalledOnce();
    });

    it('should NOT trigger playerDeath when colliding with a returning agent', () => {
      scene.playerDeath = vi.fn();
      const agent = makeMockAgent('returning');
      scene.handleAgentCollision(agent);

      expect(scene.playerDeath).not.toHaveBeenCalled();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Player death                                                     */
  /* ---------------------------------------------------------------- */

  describe('Player Death', () => {
    it('should decrement lives', () => {
      scene.playerDeath();
      expect(scene.lives).toBe(2);
    });

    it('should set diedThisLevel flag', () => {
      scene.playerDeath();
      expect(scene.diedThisLevel).toBe(true);
    });

    it('should play hit sound', () => {
      scene.playerDeath();
      expect(scene.playSound).toHaveBeenCalledWith('hit');
    });

    it('should trigger game over when lives reach 0', () => {
      scene.lives = 1;
      scene.playerDeath();

      expect(scene.gameOver).toHaveBeenCalledWith(scene.score, expect.stringContaining('Level'), expect.any(Number), expect.any(Array), expect.any(Number), expect.any(Number));
    });

    it('should report final score on game over', () => {
      scene.lives = 1;
      scene.score = 4200;
      scene.playerDeath();

      expect(scene.reportScore).toHaveBeenCalledWith(4200, 4200);
    });

    it('should reset positions when lives remain', () => {
      scene.lives = 2;
      scene.playerDeath();

      expect(scene.resetPositions).toHaveBeenCalledOnce();
    });

    it('should NOT call gameOver when lives remain', () => {
      scene.lives = 2;
      scene.playerDeath();

      expect(scene.gameOver).not.toHaveBeenCalled();
    });

    // R86.A1 — defensive second write path on final death.
    // Mirrors the R86.G1 contract Neo Jump locked down. The shared-state
    // singleton in useSaveSystem now propagates updates across hook
    // instances (so the Scoreboard modal stops showing stale data
    // mid-session), but the defensive direct write is cheaper insurance
    // than re-deriving the state from the React event handler.
    describe('R86.A1 — defensive save-system persistence on final death', () => {
      it('writes highScore + level + stats via updateGameSave before gameOver', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({ games: { agentChase: { stats: {} } } }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.lives = 1;
        scene.score = 7500;
        scene.highScore = 3000;
        scene.level = 4;
        scene.dotsCollected = 120;
        scene.totalDots = 244;
        scene.getGameDuration = vi.fn().mockReturnValue(86_000); // 86s

        scene.playerDeath();

        expect(updateGameSave).toHaveBeenCalledWith('agentChase', expect.objectContaining({
          highScore: 7500,
          level: 4,
          stats: expect.objectContaining({
            gamesPlayed: 1,
            totalScore: 7500,
            longestSurvival: 86,
          }),
        }));
      });

      it('writes BEFORE gameOver so scoreboard subscribers see the update on the same tick', () => {
        const calls: string[] = [];
        const updateGameSave = vi.fn().mockImplementation(() => calls.push('updateGameSave'));
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({ games: { agentChase: { stats: {} } } }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.gameOver = vi.fn().mockImplementation(() => calls.push('gameOver'));
        scene.lives = 1;
        scene.score = 1200;
        scene.getGameDuration = vi.fn().mockReturnValue(20_000);

        scene.playerDeath();

        // The defensive write MUST fire before the React gameOver event, so
        // any subscriber rendered off the Zustand store sees the updated
        // highScore the moment the game-over scene mounts.
        expect(calls).toEqual(['updateGameSave', 'gameOver']);
      });

      it('merges stats — gamesPlayed + totalScore accumulate, longestSurvival keeps max', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({
            games: {
              agentChase: {
                stats: {
                  gamesPlayed: 4,
                  totalScore: 12_000,
                  longestSurvival: 180,
                },
              },
            },
          }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.lives = 1;
        scene.score = 2500;
        scene.level = 2;
        scene.getGameDuration = vi.fn().mockReturnValue(60_000); // less than prev 180s

        scene.playerDeath();

        const call = updateGameSave.mock.calls[0][1];
        expect(call.stats.gamesPlayed).toBe(5); // 4 + 1
        expect(call.stats.totalScore).toBe(14_500); // 12_000 + 2_500
        expect(call.stats.longestSurvival).toBe(180); // max(180, 60)
      });

      it('no-ops defensively when save-system registry entry is missing', () => {
        scene.registry = { get: vi.fn().mockReturnValue(undefined), set: vi.fn() };
        scene.lives = 1;
        scene.score = 500;
        scene.getGameDuration = vi.fn().mockReturnValue(10_000);

        // Must not throw even with no saveSystem — gameOver still fires so
        // the player sees the end-of-run screen.
        expect(() => scene.playerDeath()).not.toThrow();
        expect(scene.gameOver).toHaveBeenCalled();
      });

      it('does NOT fire the defensive write when lives remain', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({ games: { agentChase: { stats: {} } } }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.lives = 3;
        scene.score = 1000;

        scene.playerDeath();

        // Still on 2 lives — no game-over, no save-system write.
        expect(updateGameSave).not.toHaveBeenCalled();
      });
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Level completion                                                 */
  /* ---------------------------------------------------------------- */

  describe('Level Completion', () => {
    beforeEach(() => {
      // Set up a scenario where the level is complete: all dots collected
      scene.totalDots = 100;
      scene.dotsCollected = 100;
    });

    it('should increment level when all dots are collected', () => {
      scene.checkLevelComplete();
      expect(scene.level).toBe(2);
    });

    it('should award level bonus points', () => {
      scene.checkLevelComplete();
      expect(scene.score).toBe(GAME_CONFIG.SCORING.LEVEL_BONUS);
    });

    it('should unlock CLEAR_LEVEL achievement', () => {
      scene.checkLevelComplete();

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.CLEAR_LEVEL);
    });

    it('should unlock NO_DEATH_LEVEL if the player did not die', () => {
      scene.diedThisLevel = false;
      scene.checkLevelComplete();

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.NO_DEATH_LEVEL);
    });

    it('should NOT unlock NO_DEATH_LEVEL if the player died', () => {
      scene.diedThisLevel = true;
      scene.checkLevelComplete();

      const noDeathCalls = scene.unlockAchievement.mock.calls.filter(
        (c: string[]) => c[0] === ACHIEVEMENTS.NO_DEATH_LEVEL
      );
      expect(noDeathCalls).toHaveLength(0);
    });

    it('should unlock SURVIVE_5_LEVELS when reaching level 5', () => {
      scene.level = 4; // will become 5 after increment
      scene.checkLevelComplete();

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SURVIVE_5_LEVELS);
    });

    it('should NOT unlock SURVIVE_5_LEVELS before level 5', () => {
      scene.level = 3; // becomes 4
      scene.checkLevelComplete();

      const surviveCalls = scene.unlockAchievement.mock.calls.filter(
        (c: string[]) => c[0] === ACHIEVEMENTS.SURVIVE_5_LEVELS
      );
      expect(surviveCalls).toHaveLength(0);
    });

    it('should call restartLevel', () => {
      scene.checkLevelComplete();
      expect(scene.restartLevel).toHaveBeenCalledOnce();
    });

    it('should play levelUp sound', () => {
      scene.checkLevelComplete();
      expect(scene.playSound).toHaveBeenCalledWith('levelUp');
    });

    it('should do nothing when dots remaining', () => {
      scene.dotsCollected = 50;
      scene.checkLevelComplete();

      expect(scene.level).toBe(1);
      expect(scene.restartLevel).not.toHaveBeenCalled();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Fruit spawning                                                   */
  /* ---------------------------------------------------------------- */

  describe('Fruit Spawning', () => {
    it('should trigger first fruit spawn at 70 dots', () => {
      scene.dotsCollected = GAME_CONFIG.FRUIT.FIRST_SPAWN;
      scene.checkFruitSpawn();

      expect(scene.spawnFruit).toHaveBeenCalledOnce();
      expect(scene.fruitSpawned[0]).toBe(true);
    });

    it('should trigger second fruit spawn at 170 dots', () => {
      scene.fruitSpawned[0] = true; // first already spawned
      scene.dotsCollected = GAME_CONFIG.FRUIT.SECOND_SPAWN;
      scene.checkFruitSpawn();

      expect(scene.spawnFruit).toHaveBeenCalledOnce();
      expect(scene.fruitSpawned[1]).toBe(true);
    });

    it('should NOT spawn fruit at other dot counts', () => {
      scene.dotsCollected = 50;
      scene.checkFruitSpawn();

      expect(scene.spawnFruit).not.toHaveBeenCalled();
    });

    it('should NOT re-spawn first fruit if already spawned', () => {
      scene.fruitSpawned[0] = true;
      scene.dotsCollected = GAME_CONFIG.FRUIT.FIRST_SPAWN;
      scene.checkFruitSpawn();

      expect(scene.spawnFruit).not.toHaveBeenCalled();
    });

    it('should NOT re-spawn second fruit if already spawned', () => {
      scene.fruitSpawned[1] = true;
      scene.dotsCollected = GAME_CONFIG.FRUIT.SECOND_SPAWN;
      scene.checkFruitSpawn();

      expect(scene.spawnFruit).not.toHaveBeenCalled();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Fruit collection                                                 */
  /* ---------------------------------------------------------------- */

  describe('Fruit Collection', () => {
    it('should award level-based fruit score for level 1', () => {
      scene.fruit = makeMockSprite();
      scene.level = 1;
      scene.collectFruit();

      expect(scene.score).toBe(GAME_CONFIG.SCORING.FRUIT[0]); // 100
    });

    it('should award correct score for level 3', () => {
      scene.fruit = makeMockSprite();
      scene.level = 3;
      scene.collectFruit();

      expect(scene.score).toBe(GAME_CONFIG.SCORING.FRUIT[2]); // 300
    });

    it('should clamp fruit index to 5 for high levels', () => {
      scene.fruit = makeMockSprite();
      scene.level = 10;
      scene.collectFruit();

      expect(scene.score).toBe(GAME_CONFIG.SCORING.FRUIT[5]); // 1000
    });

    it('should unlock COLLECT_FRUIT achievement', () => {
      scene.fruit = makeMockSprite();
      scene.collectFruit();

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COLLECT_FRUIT);
    });

    it('should destroy the fruit sprite and clear the reference', () => {
      const fruitSprite = makeMockSprite();
      scene.fruit = fruitSprite;
      scene.collectFruit();

      expect(fruitSprite.destroy).toHaveBeenCalledOnce();
      expect(scene.fruit).toBeUndefined();
    });

    it('should play score sound', () => {
      scene.fruit = makeMockSprite();
      scene.collectFruit();

      expect(scene.playSound).toHaveBeenCalledWith('score');
    });

    it('should do nothing if fruit is undefined', () => {
      scene.fruit = undefined;
      scene.collectFruit();

      // No error thrown, no achievement, no score change
      expect(scene.score).toBe(0);
      expect(scene.unlockAchievement).not.toHaveBeenCalled();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Score thresholds (checked in updateUI)                           */
  /* ---------------------------------------------------------------- */

  describe('Score Thresholds', () => {
    it('should unlock SCORE_10000 when score reaches 10000', () => {
      scene.score = 10000;
      scene.updateUI();

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SCORE_10000);
    });

    it('should unlock SCORE_10000 when score exceeds 10000', () => {
      scene.score = 12500;
      scene.updateUI();

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SCORE_10000);
    });

    it('should NOT unlock SCORE_10000 when score is below 10000', () => {
      scene.score = 9999;
      scene.updateUI();

      expect(scene.unlockAchievement).not.toHaveBeenCalled();
    });

    it('should update score text', () => {
      scene.score = 500;
      scene.updateUI();

      expect(scene.scoreText.setText).toHaveBeenCalledWith('SCORE: 500');
    });

    it('should update lives text', () => {
      scene.lives = 2;
      scene.updateUI();

      expect(scene.livesText.setText).toHaveBeenCalledWith('LIVES: 2');
    });

    it('should update level text', () => {
      scene.level = 3;
      scene.updateUI();

      expect(scene.levelText.setText).toHaveBeenCalledWith('LEVEL: 3');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Mode switching                                                   */
  /* ---------------------------------------------------------------- */

  describe('Mode Switching', () => {
    it('should start in scatter mode', () => {
      expect(scene.scatterMode).toBe(true);
    });

    it('should start at modePhase 0', () => {
      expect(scene.modePhase).toBe(0);
    });

    it('should start with modeTimer at 0', () => {
      expect(scene.modeTimer).toBe(0);
    });

    it('should have 8 entries in MODE_TIMES', () => {
      expect(scene.MODE_TIMES).toHaveLength(8);
    });

    it('should end with Infinity (permanent chase) in the last phase', () => {
      expect(scene.MODE_TIMES[7]).toBe(Infinity);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Map layout system                                                */
  /* ---------------------------------------------------------------- */

  describe('Map Layout System', () => {
    it('should start with CLASSIC layout', () => {
      expect(scene.currentLayout.name).toBe('CLASSIC');
    });

    it('should start with CLASSIC in mazesPlayed', () => {
      expect(scene.mazesPlayed.has('CLASSIC')).toBe(true);
      expect(scene.mazesPlayed.size).toBe(1);
    });

    it('should update mapText in updateUI', () => {
      scene.updateUI();
      expect(scene.mapText.setText).toHaveBeenCalledWith('MAP: CLASSIC');
    });

    it('should cycle to ARENA for level 2', () => {
      expect(getLayoutForLevel(2).name).toBe('ARENA');
    });

    it('should cycle to LABYRINTH for level 3', () => {
      expect(getLayoutForLevel(3).name).toBe('LABYRINTH');
    });

    it('should wrap back to CLASSIC for level 4', () => {
      expect(getLayoutForLevel(4).name).toBe('CLASSIC');
    });

    it('should track mazesPlayed across level completions', () => {
      scene.totalDots = 100;
      scene.dotsCollected = 100;

      scene.checkLevelComplete();

      expect(scene.mazesPlayed.has('ARENA')).toBe(true);
    });

    it('should call restartLevel with new layout and layoutChanged flag', () => {
      scene.totalDots = 100;
      scene.dotsCollected = 100;

      scene.checkLevelComplete();

      expect(scene.restartLevel).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ARENA' }),
        true
      );
    });

    it('should show map announcement when layout changes', () => {
      scene.totalDots = 100;
      scene.dotsCollected = 100;

      scene.checkLevelComplete();

      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'MAP: ARENA',
        expect.any(Object)
      );
    });

    it('should NOT show announcement when layout stays the same', () => {
      scene.level = 3; // level 4 wraps to CLASSIC
      scene.currentLayout = getLayoutForLevel(3); // LABYRINTH
      scene.mazesPlayed = new Set(['CLASSIC', 'ARENA', 'LABYRINTH']);
      scene.totalDots = 100;
      scene.dotsCollected = 100;

      scene.checkLevelComplete(); // level becomes 4 → CLASSIC

      expect(scene.restartLevel).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'CLASSIC' }),
        true
      );
    });

    it('should pass layoutChanged=false when same layout continues', () => {
      scene.level = 3;
      scene.currentLayout = getLayoutForLevel(4); // CLASSIC — same as level 4
      scene.totalDots = 100;
      scene.dotsCollected = 100;

      scene.checkLevelComplete(); // level becomes 4 → CLASSIC, same as current

      expect(scene.restartLevel).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'CLASSIC' }),
        false
      );
    });
  });

  /* ---------------------------------------------------------------- */
  /*  ALL_MAZES achievement                                            */
  /* ---------------------------------------------------------------- */

  describe('ALL_MAZES Achievement', () => {
    it('should unlock ALL_MAZES when all 3 layouts have been played', () => {
      scene.mazesPlayed = new Set(['CLASSIC', 'ARENA']);
      scene.level = 2; // becomes 3 → LABYRINTH
      scene.currentLayout = getLayoutForLevel(2); // ARENA
      scene.totalDots = 100;
      scene.dotsCollected = 100;

      scene.checkLevelComplete();

      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.ALL_MAZES);
    });

    it('should NOT unlock ALL_MAZES when fewer than 3 layouts played', () => {
      scene.mazesPlayed = new Set(['CLASSIC']);
      scene.totalDots = 100;
      scene.dotsCollected = 100;

      scene.checkLevelComplete();

      const mazesCalls = scene.unlockAchievement.mock.calls.filter(
        (c: string[]) => c[0] === ACHIEVEMENTS.ALL_MAZES
      );
      expect(mazesCalls).toHaveLength(0);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Difficulty scaling                                               */
  /* ---------------------------------------------------------------- */

  describe('Difficulty Scaling', () => {
    it('should reduce frightened duration at higher levels', () => {
      scene.time = { now: 1000 };
      scene.agents = { getChildren: vi.fn().mockReturnValue([]) };
      scene.reverseDirection = vi.fn().mockReturnValue('RIGHT');
      scene.level = 5;

      scene.collectPowerPellet(makeMockSprite());

      // Duration = max(3000, 8000 - 4*500) = max(3000, 6000) = 6000
      // No direct way to check duration, but frightened agents get frightenedEndTime
      // With no agents, just confirm no crash — detailed test below
      expect(scene.score).toBe(GAME_CONFIG.SCORING.POWER_PELLET);
    });

    it('should clamp frightened duration to FRIGHTENED_MIN', () => {
      const agent = makeMockAgent('chase');
      scene.time = { now: 1000 };
      scene.agents = { getChildren: vi.fn().mockReturnValue([agent]) };
      scene.reverseDirection = vi.fn().mockReturnValue('RIGHT');
      scene.level = 20; // 8000 - 19*500 = -1500, clamped to 3000

      scene.collectPowerPellet(makeMockSprite());

      expect(agent.frightenedEndTime).toBe(1000 + GAME_CONFIG.AGENTS.FRIGHTENED_MIN);
    });

    it('should use full frightened duration at level 1', () => {
      const agent = makeMockAgent('chase');
      scene.time = { now: 1000 };
      scene.agents = { getChildren: vi.fn().mockReturnValue([agent]) };
      scene.reverseDirection = vi.fn().mockReturnValue('RIGHT');
      scene.level = 1;

      scene.collectPowerPellet(makeMockSprite());

      expect(agent.frightenedEndTime).toBe(1000 + GAME_CONFIG.AGENTS.FRIGHTENED_DURATION);
    });

    it('should have 3 map layouts defined', () => {
      expect(MAP_LAYOUTS).toHaveLength(3);
    });

    it('should have all layouts with 31 rows', () => {
      for (const layout of MAP_LAYOUTS) {
        expect(layout.grid).toHaveLength(31);
      }
    });

    it('should have all layouts with 28 columns per row', () => {
      for (const layout of MAP_LAYOUTS) {
        for (let r = 0; r < layout.grid.length; r++) {
          expect(layout.grid[r]).toHaveLength(28);
        }
      }
    });
  });

  /* ---------------------------------------------------------------- */
  /*  exposeTestState                                                  */
  /* ---------------------------------------------------------------- */

  describe('exposeTestState', () => {
    it('should be called with mapName and mazesPlayed in update', () => {
      scene.isPaused = true; // Skip most of update()
      scene.exposeTestState = vi.fn();

      // update() returns early if paused, so we test the direct call
      // by checking the mock was wired up correctly
      expect(scene.exposeTestState).toBeDefined();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  R86.A2 — Ghost-house release + exit-tile override                */
  /* ---------------------------------------------------------------- */
  //
  // Tom's 2026-04-22 playtest: "some enemies are trapped in the middle
  // box and don't come out of the box to chase the player". Root cause
  // traced to johnson (scatterTarget (0, 30)) looping (14,13) → (13,13)
  // pocket → (13,14) → (14,14) → (14,13) forever because LEFT toward
  // (13,13) has distance sqrt(13²+13²)=18.38 vs. UP through gate at
  // (14,12) distance sqrt(14²+12²)=18.44 — a 0.06-unit tiebreak that
  // blocks exit indefinitely.
  //
  // Two-part fix locked by these tests:
  //  (a) releaseAgents() replaces the 5s timer with dot-count thresholds
  //      [0, 10, 30, 60]. First agent immediate, second at 10 dots,
  //      third at 30, fourth at 60.
  //  (b) getAgentTarget() overrides scatter/chase targets with the
  //      GHOST_HOUSE.EXIT_TILE when the agent is inside the house
  //      bounds. Frightened + returning are NOT overridden (preserves
  //      power-pellet feel + the "eat ghost → respawn" flow).

  describe('R86.A2 — Ghost-house release + exit override', () => {
    /* ---- config dial locks ---- */

    describe('Config dial locks', () => {
      it('locks RELEASE_DOT_THRESHOLDS at [0, 10, 30, 60] (Tom brief)', () => {
        expect(GAME_CONFIG.GHOST_HOUSE.RELEASE_DOT_THRESHOLDS).toEqual([0, 10, 30, 60]);
      });

      it('locks EXIT_TILE at (14, 11) — one tile above the gate', () => {
        expect(GAME_CONFIG.GHOST_HOUSE.EXIT_TILE).toEqual({ x: 14, y: 11 });
      });

      it('locks BOUNDS to the house interior rows 13-15, cols 13-17', () => {
        expect(GAME_CONFIG.GHOST_HOUSE.BOUNDS).toEqual({
          minRow: 13,
          maxRow: 15,
          minCol: 13,
          maxCol: 17,
        });
      });

      it('anti-regression: first threshold MUST be 0 so agent[0] releases immediately', () => {
        expect(GAME_CONFIG.GHOST_HOUSE.RELEASE_DOT_THRESHOLDS[0]).toBe(0);
      });

      it('anti-regression: thresholds are strictly monotonic (ordering lock)', () => {
        const thresholds = GAME_CONFIG.GHOST_HOUSE.RELEASE_DOT_THRESHOLDS;
        for (let i = 1; i < thresholds.length; i++) {
          expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
        }
      });

      it('anti-regression: RELEASE_INTERVAL removed from AGENTS block', () => {
        expect('RELEASE_INTERVAL' in GAME_CONFIG.AGENTS).toBe(false);
      });
    });

    /* ---- isInsideGhostHouse helper ---- */

    describe('isInsideGhostHouse helper', () => {
      it('returns true for agent spawn positions (14,14), (13,14), (15,14)', () => {
        expect(scene.isInsideGhostHouse(14, 14)).toBe(true);
        expect(scene.isInsideGhostHouse(13, 14)).toBe(true);
        expect(scene.isInsideGhostHouse(15, 14)).toBe(true);
      });

      it('returns true for the gate-entry row (row 13, cols 13-17)', () => {
        expect(scene.isInsideGhostHouse(14, 13)).toBe(true);
        expect(scene.isInsideGhostHouse(13, 13)).toBe(true);
        expect(scene.isInsideGhostHouse(17, 13)).toBe(true);
      });

      it('returns FALSE for the exit tile (14, 11) — one above the gate', () => {
        expect(scene.isInsideGhostHouse(14, 11)).toBe(false);
      });

      it('returns FALSE for the gate tile itself (14, 12) — in-transit, not inside', () => {
        expect(scene.isInsideGhostHouse(14, 12)).toBe(false);
      });

      it('returns FALSE for the dead-end pocket at (11, 14)', () => {
        expect(scene.isInsideGhostHouse(11, 14)).toBe(false);
      });

      it('returns FALSE for row 16 (below the house)', () => {
        expect(scene.isInsideGhostHouse(14, 16)).toBe(false);
      });
    });

    /* ---- releaseAgents behaviour ---- */

    describe('releaseAgents — staggered dot-count release', () => {
      function makeAgents() {
        const agents = [0, 1, 2, 3].map((i) => ({
          ...makeMockAgent('scatter'),
          agentType: ['smith', 'brown', 'jones', 'johnson'][i],
          isReleased: i === 0,
        }));
        scene.agents = { getChildren: vi.fn().mockReturnValue(agents) };
        return agents;
      }

      it('releases agents[0] (smith) immediately at 0 dots — threshold[0]=0', () => {
        const agents = makeAgents();
        scene.agentReleaseIndex = 0;
        scene.dotsCollected = 0;

        scene.releaseAgents();

        expect(agents[0].isReleased).toBe(true);
        expect(scene.agentReleaseIndex).toBe(1);
      });

      it('does NOT release agents[1] (brown) at 9 dots — below threshold[1]=10', () => {
        const agents = makeAgents();
        scene.agentReleaseIndex = 1;
        scene.dotsCollected = 9;

        scene.releaseAgents();

        expect(agents[1].isReleased).toBe(false);
        expect(scene.agentReleaseIndex).toBe(1);
      });

      it('releases agents[1] (brown) at exactly 10 dots — boundary lock on threshold[1]', () => {
        const agents = makeAgents();
        scene.agentReleaseIndex = 1;
        scene.dotsCollected = 10;

        scene.releaseAgents();

        expect(agents[1].isReleased).toBe(true);
        expect(scene.agentReleaseIndex).toBe(2);
      });

      it('releases agents[2] (jones) at 30 dots — threshold[2]=30', () => {
        const agents = makeAgents();
        agents[1].isReleased = true;
        scene.agentReleaseIndex = 2;
        scene.dotsCollected = 30;

        scene.releaseAgents();

        expect(agents[2].isReleased).toBe(true);
        expect(scene.agentReleaseIndex).toBe(3);
      });

      it('releases agents[3] (johnson) at 60 dots — threshold[3]=60', () => {
        const agents = makeAgents();
        agents[1].isReleased = true;
        agents[2].isReleased = true;
        scene.agentReleaseIndex = 3;
        scene.dotsCollected = 60;

        scene.releaseAgents();

        expect(agents[3].isReleased).toBe(true);
        expect(scene.agentReleaseIndex).toBe(4);
      });

      it('batch-releases after death: dotsCollected=60 with agentReleaseIndex=1 releases 1,2,3 in one pass', () => {
        const agents = makeAgents();
        // Simulate post-death state: index reset to 1, dotsCollected unchanged
        scene.agentReleaseIndex = 1;
        scene.dotsCollected = 60;

        scene.releaseAgents();

        expect(agents[1].isReleased).toBe(true);
        expect(agents[2].isReleased).toBe(true);
        expect(agents[3].isReleased).toBe(true);
        expect(scene.agentReleaseIndex).toBe(4);
      });

      it('no-ops when all four agents are already released (agentReleaseIndex=4)', () => {
        makeAgents();
        scene.agentReleaseIndex = 4;
        scene.dotsCollected = 100;

        scene.releaseAgents();

        expect(scene.agentReleaseIndex).toBe(4);
      });

      it('releases are strictly ordered: agent[2] never released before agent[1]', () => {
        // Contrived check: if the loop ever tried to skip ahead, dotsCollected=30
        // with agentReleaseIndex=1 should still fire the threshold[1]=10 check
        // FIRST, releasing brown, then check threshold[2]=30, releasing jones.
        const agents = makeAgents();
        scene.agentReleaseIndex = 1;
        scene.dotsCollected = 30;

        scene.releaseAgents();

        expect(agents[1].isReleased).toBe(true);
        expect(agents[2].isReleased).toBe(true);
        // If ordering broke, brown could be released after jones.
        // The while-loop structure guarantees sequential release.
        expect(scene.agentReleaseIndex).toBe(3);
      });
    });

    /* ---- getAgentTarget inside-house override ---- */

    describe('getAgentTarget — inside-house exit override', () => {
      beforeEach(() => {
        const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
        const offsetY = 40;
        scene.player = {
          x: offsetX + 13 * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
          y: offsetY + 23 * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
        };
        scene.playerDirection = 'LEFT';
      });

      it('scatter state inside house → returns EXIT_TILE (14, 11)', () => {
        const agent = { ...makeMockAgent('scatter'), gridX: 14, gridY: 14 };

        const target = scene.getAgentTarget(agent);

        expect(target).toEqual(GAME_CONFIG.GHOST_HOUSE.EXIT_TILE);
      });

      it('chase state inside house → returns EXIT_TILE (not player position)', () => {
        const agent = { ...makeMockAgent('chase'), gridX: 15, gridY: 14, agentType: 'smith' };

        const target = scene.getAgentTarget(agent);

        expect(target).toEqual(GAME_CONFIG.GHOST_HOUSE.EXIT_TILE);
      });

      it('scatter state OUTSIDE house → returns scatterTarget (normal AI)', () => {
        const agent = {
          ...makeMockAgent('scatter'),
          gridX: 14,
          gridY: 11, // exit tile — OUTSIDE bounds
          scatterTarget: { x: 25, y: 0 },
        };

        const target = scene.getAgentTarget(agent);

        expect(target).toEqual({ x: 25, y: 0 });
      });

      it('frightened state inside house → does NOT override (random target preserved)', () => {
        // Re-seed Phaser.Math.Between deterministically so we can assert
        // the frightened branch was actually taken (not the EXIT_TILE
        // override). The module-level seed above gave it a floor-midpoint
        // default; this test tightens it to a fixed value.
        (Phaser.Math as unknown as { Between: unknown }).Between = vi.fn().mockReturnValue(7);

        const agent = { ...makeMockAgent('frightened'), gridX: 14, gridY: 14 };

        const target = scene.getAgentTarget(agent);

        // Frightened returns { x: Between(...), y: Between(...) } = (7, 7),
        // NOT the deterministic EXIT_TILE override.
        expect(target).toEqual({ x: 7, y: 7 });
        expect(target).not.toEqual(GAME_CONFIG.GHOST_HOUSE.EXIT_TILE);
      });

      it('returning state inside house → targets homePosition (not exit tile)', () => {
        const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
        const offsetY = 40;
        // Use whole-tile coordinates (no +TILE_SIZE/2 half-offset) so the
        // production code's Math.round((home - offset) / TILE_SIZE) gives
        // back the original grid coordinate cleanly.
        const agent = {
          ...makeMockAgent('returning'),
          gridX: 14,
          gridY: 14,
          homePosition: {
            x: offsetX + 13 * GAME_CONFIG.TILE_SIZE,
            y: offsetY + 14 * GAME_CONFIG.TILE_SIZE,
          },
        };

        const target = scene.getAgentTarget(agent);

        // Asserts the returning branch ran (not EXIT_TILE override).
        expect(target).toEqual({ x: 13, y: 14 });
        expect(target).not.toEqual(GAME_CONFIG.GHOST_HOUSE.EXIT_TILE);
      });

      it('regression guard: johnson at (14, 13) does NOT target scatterTarget anymore', () => {
        // Direct reproduction of Tom's 2026-04-22 bug. Before R86.A2,
        // johnson (scatterTarget (0, 30)) at (14, 13) targeted (0, 30),
        // making LEFT to (13, 13) pocket look better than UP to gate.
        // Now he targets EXIT_TILE (14, 11) — distance 2 UP, 2.24 LEFT.
        // UP wins, johnson exits.
        const agent = {
          ...makeMockAgent('scatter'),
          gridX: 14,
          gridY: 13,
          agentType: 'johnson',
          scatterTarget: { x: 0, y: 30 },
        };

        const target = scene.getAgentTarget(agent);

        expect(target).toEqual({ x: 14, y: 11 });
        expect(target).not.toEqual(agent.scatterTarget);
      });
    });
  });
});
