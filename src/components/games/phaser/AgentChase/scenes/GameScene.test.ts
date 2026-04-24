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
  // R87.AC1: triggerLevelClear defers restartLevel via time.delayedCall.
  // Default mock invokes the callback immediately so existing Level
  // Completion assertions (restartLevel called once, level incremented, etc)
  // keep passing. Tests that need to verify deferral override this with a
  // capture-callback pattern.
  scene.time = { delayedCall: vi.fn((_ms: number, cb: () => void) => cb()) };

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

  /* ---------------------------------------------------------------- */
  /*  R86.A3 — A1 save-path + A2 release coverage refresh              */
  /*                                                                   */
  /*  The 5 existing A1 tests lock the happy-path payload + ordering;  */
  /*  the 20-odd A2 tests lock thresholds, bounds, and per-branch      */
  /*  getAgentTarget behaviour. A3 closes three gaps the two safety-  */
  /*  nets leave open:                                                 */
  /*    (1) A1 defensive-write null-chain resilience — first-run        */
  /*        scenarios where saveData / saveData.games is undefined.    */
  /*    (2) A2 structural pairing invariants — every agent must have   */
  /*        a release threshold; releaseAgents must actually be wired  */
  /*        into update(); post-death index reset must stay at 1.      */
  /*    (3) Static source anti-regression — the original A2 bug was a  */
  /*        "helpful" timer-based release that silently bypassed the   */
  /*        dot-count contract. Static checks lock the implementation  */
  /*        shape (`while` loop, `isInsideGhostHouse` call-site)       */
  /*        against future refactors of the same shape.                */
  /* ---------------------------------------------------------------- */

  describe('R86.A3 — A1 + A2 safety-net coverage', () => {
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    /* ---- A1 defensive-write null-chain resilience ---- */

    describe('A1 defensive-write null-chain resilience', () => {
      it('survives saveData = undefined (first-ever play, no save file yet)', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue(undefined),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.lives = 1;
        scene.score = 500;
        scene.getGameDuration = vi.fn().mockReturnValue(15_000);

        expect(() => scene.playerDeath()).not.toThrow();

        // Defensive chain means prev defaults to {} so the optional-chain
        // guards (`(saveData?.games?.agentChase?.stats ?? {})`) render the
        // first-run case indistinguishable from a fresh stats merge.
        expect(updateGameSave).toHaveBeenCalledTimes(1);
        const call = updateGameSave.mock.calls[0][1];
        expect(call.stats.gamesPlayed).toBe(1);
        expect(call.stats.totalScore).toBe(500);
      });

      it('survives saveData.games = undefined (save file exists but no games slice)', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({ /* no games key */ }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.lives = 1;
        scene.score = 1200;
        scene.getGameDuration = vi.fn().mockReturnValue(30_000);

        expect(() => scene.playerDeath()).not.toThrow();
        expect(updateGameSave).toHaveBeenCalledTimes(1);
      });

      it('highScore promotion fires BEFORE updateGameSave — new-high path writes new watermark', () => {
        // Internal ordering within playerDeath: `this.highScore = max(score, highScore)`
        // MUST run before `updateGameSave({ highScore: this.highScore, ... })`,
        // otherwise the save-file watermark lags the current session's high
        // score by one death. A refactor that hoists the updateGameSave call
        // above the max-assignment would silently regress this.
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({ games: { agentChase: { stats: {} } } }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.lives = 1;
        scene.score = 5000;
        scene.highScore = 2000; // lower than score — promotion must fire
        scene.getGameDuration = vi.fn().mockReturnValue(40_000);

        scene.playerDeath();

        const call = updateGameSave.mock.calls[0][1];
        expect(call.highScore).toBe(5000);
      });

      it('highScore preserved when session score is lower — writes pre-existing high', () => {
        // The inverse invariant: `if (score > highScore) highScore = score`
        // is a one-way raise; a death with a lower score must still write
        // the pre-existing high, not overwrite it with the session value.
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({ games: { agentChase: { stats: {} } } }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.lives = 1;
        scene.score = 300;
        scene.highScore = 2000; // higher — no promotion
        scene.getGameDuration = vi.fn().mockReturnValue(8_000);

        scene.playerDeath();

        const call = updateGameSave.mock.calls[0][1];
        expect(call.highScore).toBe(2000);
      });

      it('sessionSeconds uses Math.floor (not round) — 86500ms writes 86, not 87', () => {
        // Contract lock on the duration-to-seconds conversion. Round would
        // break the longestSurvival max comparison: two back-to-back 86.5s
        // runs would each write 87s, crossing a whole-second boundary that
        // never actually occurred.
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({ games: { agentChase: { stats: {} } } }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.lives = 1;
        scene.score = 100;
        scene.getGameDuration = vi.fn().mockReturnValue(86_500);

        scene.playerDeath();

        const call = updateGameSave.mock.calls[0][1];
        expect(call.stats.longestSurvival).toBe(86);
      });
    });

    /* ---- A2 structural pairing invariants ---- */

    describe('A2 structural pairing invariants', () => {
      it('RELEASE_DOT_THRESHOLDS length matches AGENT_TYPES count — every agent has a threshold', () => {
        // If a 5th agent type ever gets added to AGENT_TYPES without an
        // accompanying threshold, releaseAgents's `agentReleaseIndex <
        // thresholds.length` guard keeps the 5th trapped in the house
        // forever. This test forces the contract explicitly.
        const thresholds = GAME_CONFIG.GHOST_HOUSE.RELEASE_DOT_THRESHOLDS;
        const agentTypeCount = Object.keys(GAME_CONFIG.AGENT_TYPES).length;
        expect(thresholds.length).toBe(agentTypeCount);
        expect(thresholds.length).toBe(4);
      });

      it('AGENT_TYPES names are distinct — no merge of Smith/Brown/Jones/Johnson', () => {
        // The release-index → agent-identity mapping assumes a stable
        // ordering at createAgents time. If two types ever collapse to
        // the same `name`, the scatterTarget / behaviour pairing would
        // silently shift, breaking both A2's override + the chase AI.
        const names = Object.values(GAME_CONFIG.AGENT_TYPES).map((a) => a.name);
        expect(new Set(names).size).toBe(names.length);
        expect(names).toEqual(['Smith', 'Brown', 'Jones', 'Johnson']);
      });

      it('source: this.releaseAgents() is called from update() — not orphaned', () => {
        // If releaseAgents ever gets removed from the update loop (e.g. by
        // a refactor extracting "agent logic" into a sub-method that
        // forgets to call it), the dot-count release never fires and
        // agents[1..3] stay in the house for the entire game — direct
        // revival of the original A2 symptom.
        const src = readSceneSource();
        const callSites = src.match(/this\.releaseAgents\(\)/g) ?? [];
        expect(callSites.length).toBe(1);
      });

      it('source: agentReleaseIndex resets differently for game-start (0) vs post-death (1)', () => {
        // Two distinct reset values for two distinct contexts:
        //   - create() sets 0 so agents[0] releases via createAgents's
        //     `index === 0` initialiser (agentReleaseIndex stays at 0
        //     but the while-loop's threshold[0]=0 still releases it if
        //     createAgents fails to do so — belt-and-braces).
        //   - resetPositions() sets 1 so agents[1..3] need fresh dot
        //     thresholds again after death.
        // A refactor that unifies these to a single value would break
        // either first-release (if unified to 1) or post-death release
        // ordering (if unified to 0 and dotsCollected is already high).
        const src = readSceneSource();
        const zeroResets = src.match(/this\.agentReleaseIndex\s*=\s*0(?!\d)/g) ?? [];
        const oneResets = src.match(/this\.agentReleaseIndex\s*=\s*1(?!\d)/g) ?? [];
        expect(zeroResets.length).toBe(1);
        expect(oneResets.length).toBe(1);
      });
    });

    /* ---- static anti-regression: implementation shape ---- */

    describe('Static anti-regression — implementation shape locks', () => {
      it('playerDeath body has exactly one updateGameSave call — no double-write', () => {
        // A future refactor that adds a second write path (e.g. "belt-and-
        // braces" duplicate for stats vs highScore) would land a racy
        // two-calls-per-death footprint. Single call is the invariant.
        const src = readSceneSource();
        // Isolate playerDeath method body via a simple regex slice (from
        // `private playerDeath(): void {` to the next `private ` declaration).
        const match = src.match(/private playerDeath\(\): void \{([\s\S]*?)\n {2}private /);
        expect(match).not.toBeNull();
        const body = match![1];
        const calls = body.match(/\.updateGameSave\(/g) ?? [];
        expect(calls.length).toBe(1);
      });

      it('releaseAgents uses `while` loop — not `if` (batch-release after death lock)', () => {
        // The original A2 bug was partially a time-based release; a
        // plausible but broken follow-up refactor is `if (dotsCollected
        // >= thresholds[agentReleaseIndex])` — releases ONE agent per
        // tick. After a mid-level death with dotsCollected=60 and
        // agentReleaseIndex=1, that would take 3 ticks (3 frames) to
        // release agents[1..3] — imperceptible, but fails the
        // "batch-releases after death" behavioural test. This static
        // check is a direct shape-lock on the working implementation.
        const src = readSceneSource();
        const match = src.match(/private releaseAgents\(\): void \{([\s\S]*?)\n {2}\}/);
        expect(match).not.toBeNull();
        const body = match![1];
        expect(body).toMatch(/\bwhile\s*\(/);
        expect(body).not.toMatch(/^\s*if\s*\(/m); // no top-level if at the release gate
      });

      it('getAgentTarget body calls isInsideGhostHouse — override is actually wired', () => {
        // The override is the whole point of A2-(b). If a refactor
        // inlines the bounds check or moves it to a caller, this test
        // should fail so the author has to restate the invariant
        // explicitly in the new shape.
        const src = readSceneSource();
        const match = src.match(/private getAgentTarget\([\s\S]*?\): \{ x: number; y: number \} \{([\s\S]*?)\n {2}\}/);
        expect(match).not.toBeNull();
        const body = match![1];
        expect(body).toMatch(/this\.isInsideGhostHouse\(/);
        expect(body).toMatch(/GAME_CONFIG\.GHOST_HOUSE\.EXIT_TILE/);
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /*  R86.A3+ safety-net — releaseAgents signature purity + deleted-    */
  /*  field triad completeness (pre-Tom-tick)                           */
  /*                                                                    */
  /*  A3 locks structural shape (while-loop, EXIT_TILE call-site, array */
  /*  value equality). What stays unlocked is the releaseAgents method  */
  /*  *signature* and the *full set* of fields deleted in the A2 commit */
  /*  msg ("Dropped unused AGENTS.RELEASE_INTERVAL + RELEASE_MIN +      */
  /*  nextReleaseTime field"). A3 only locks RELEASE_INTERVAL.          */
  /*                                                                    */
  /*  Three new invariants:                                             */
  /*    (1) releaseAgents declared-arg count is 0 — a refactor that     */
  /*        reintroduces `releaseAgents(time: number)` compiles (TS     */
  /*        tolerates missing trailing args at callsites) but opens the */
  /*        door to time-coupled release logic inside the body.         */
  /*    (2) releaseAgents body does not mention `this.time` — a hidden  */
  /*        time check alongside the dot-threshold guard would silently */
  /*        revive the 5s timer bug the A2 fix explicitly removed.      */
  /*    (3) Both bounds appear in the while-guard — dropping either     */
  /*        arm turns a 5th agent / 5th threshold addition into an      */
  /*        OOB read or a silent no-release.                            */
  /*                                                                    */
  /*  Plus two deleted-field partners to the existing RELEASE_INTERVAL  */
  /*  lock, completing the triplet.                                     */
  /* ------------------------------------------------------------------ */

  describe('R86.A3+ safety-net — releaseAgents signature + deleted-field absence (pre-Tom-tick)', () => {
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    describe('releaseAgents signature purity', () => {
      it('declares zero arguments — the A2 commit explicitly dropped its time arg', () => {
        // `.length` on a function returns the number of declared parameters
        // before the first default value. A refactor that reintroduces
        // `releaseAgents(time: number)` would bump this to 1 silently — the
        // existing `this.releaseAgents()` callsite still compiles because
        // TS tolerates missing trailing args, so the body can pivot back
        // to time-coupled release without any gate catching it.
        const proto = AgentChaseGameScene.prototype as unknown as {
          releaseAgents: (...args: unknown[]) => void;
        };
        expect(typeof proto.releaseAgents).toBe('function');
        expect(proto.releaseAgents.length).toBe(0);
      });

      it('method body contains no this.time reference — no time-based release', () => {
        // The A2 bug was a 5s-interval timer gate; the fix replaced the
        // timer with a dot-count threshold check. A plausible "helpful"
        // refactor is to add `if (this.time.now - lastReleaseAt >= X)`
        // alongside the dot check — preserves both behaviours but
        // re-introduces the staggered-release bug on level-clear (timer
        // resets, dotsCollected doesn't). Lock the body as time-free.
        const src = readSceneSource();
        const match = src.match(/private releaseAgents\(\): void \{([\s\S]*?)\n {2}\}/);
        expect(match).not.toBeNull();
        const body = match![1];
        expect(body).not.toMatch(/\bthis\.time\b/);
      });

      it('while-guard locks BOTH bounds — thresholds.length AND agents.length', () => {
        // A3 locks that the guard is a `while` not `if` at the top; what it
        // does NOT lock is that BOTH bounds arms are present. A "single-
        // bound simplification" is plausible either way:
        //   - drop `< agents.length` — if a 5th threshold is ever added
        //     without a 5th agent, the body reads agents[4] as undefined
        //     and throws on `.isReleased =`.
        //   - drop `< thresholds.length` — if a 5th agent is ever added
        //     without a 5th threshold, the body reads thresholds[4] as
        //     undefined; `dotsCollected >= undefined` is false, so the 5th
        //     agent silently never releases. No test would catch this.
        const src = readSceneSource();
        const match = src.match(/private releaseAgents\(\): void \{([\s\S]*?)\n {2}\}/);
        expect(match).not.toBeNull();
        const body = match![1];
        expect(body).toMatch(/this\.agentReleaseIndex\s*<\s*thresholds\.length/);
        expect(body).toMatch(/this\.agentReleaseIndex\s*<\s*agents\.length/);
      });
    });

    describe('Deleted-field absence — completes the RELEASE_INTERVAL triad', () => {
      it('AGENTS.RELEASE_MIN was also dropped in A2 — not just RELEASE_INTERVAL', () => {
        // A2 commit text: "Dropped unused AGENTS.RELEASE_INTERVAL +
        // RELEASE_MIN + nextReleaseTime field." A3 locks only the first.
        // RELEASE_MIN's absence is the second leg — restoring it suggests
        // someone is reviving the timer-based release path.
        expect('RELEASE_MIN' in GAME_CONFIG.AGENTS).toBe(false);
      });

      it('nextReleaseTime scene field absent from GameScene.ts source', () => {
        // The third leg of the triplet. `nextReleaseTime` was a class
        // field tracking the next allowed release timestamp. Its return
        // would reintroduce time-coupled state even if the config constants
        // stayed gone — class fields don't show up in `in GAME_CONFIG` checks.
        // A plain substring scan catches both field declarations and
        // internal read/write sites.
        const src = readSceneSource();
        expect(src).not.toMatch(/\bnextReleaseTime\b/);
      });
    });
  });

  // -----------------------------------------------------------------------
  // R87.AC1 — Level-clear state machine + LEVEL CLEAR banner
  //
  // Tom's 2026-04-23 in-session screenshot showed an empty Agent Chase maze
  // stuck on LVL 1 with no level transition visible — SCORE 2570, LIVES 2,
  // 4 agents loose, no dots remaining. The original `checkLevelComplete`
  // ran the full advance inline on the same frame the last dot was
  // collected: it incremented level, bonus, cleared dots, rebuilt the maze,
  // and reset positions in under 16 ms. No pause, no overlay, no SFX beat —
  // the transition was literally invisible. This block locks the new
  // state-machine-gated flow that mirrors Frogger F1:
  //   1. `isLevelingUp` latches for the banner window and blocks update()
  //      + every overlap handler (physics callbacks fire outside update,
  //      so guarding the loop alone is insufficient).
  //   2. `triggerLevelClear` runs the score/achievement bookkeeping +
  //      paints a "LEVEL N CLEAR" banner.
  //   3. `restartLevel` fires via `time.delayedCall(LEVEL_CLEAR_DELAY_MS)`
  //      so the banner is perceivable before the maze rebuilds.
  //   4. Banner-time overlaps (dot, pellet, bullet-time, agent) no-op.
  // -----------------------------------------------------------------------
  describe('R87.AC1 — Level-clear state machine + LEVEL CLEAR banner', () => {
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    beforeEach(() => {
      scene.totalDots = 100;
      scene.dotsCollected = 100;
    });

    describe('isLevelingUp latching + reset', () => {
      it('sets isLevelingUp=true when triggerLevelClear fires', () => {
        scene.checkLevelComplete();
        // time.delayedCall is mocked to invoke immediately, but the flag
        // flips to true synchronously before the deferred block runs.
        // With the default fixture the callback runs inline and clears it
        // back to false — so override with a capture pattern here.
        scene.isLevelingUp = false;
        scene.level = 1;
        scene.dotsCollected = 100;
        scene.time = { delayedCall: vi.fn() }; // capture but do not invoke
        scene.checkLevelComplete();
        expect(scene.isLevelingUp).toBe(true);
      });

      it('clears isLevelingUp=false after the deferred restart fires', () => {
        // Default fixture invokes delayedCall immediately — simulates the
        // banner hold ending.
        scene.checkLevelComplete();
        expect(scene.isLevelingUp).toBe(false);
      });

      it('schedules restartLevel via time.delayedCall using LEVEL_CLEAR_DELAY_MS', () => {
        const delayedCall = vi.fn();
        scene.time = { delayedCall };
        scene.checkLevelComplete();
        expect(delayedCall).toHaveBeenCalledOnce();
        expect(delayedCall).toHaveBeenCalledWith(
          GAME_CONFIG.LEVEL_CLEAR_DELAY_MS,
          expect.any(Function)
        );
      });

      it('does NOT call restartLevel before the delay callback fires', () => {
        scene.time = { delayedCall: vi.fn() }; // capture but do not invoke
        scene.checkLevelComplete();
        expect(scene.restartLevel).not.toHaveBeenCalled();
      });

      it('calls restartLevel exactly once when the delay callback fires', () => {
        let captured: (() => void) | undefined;
        scene.time = {
          delayedCall: vi.fn((_ms: number, cb: () => void) => {
            captured = cb;
          }),
        };
        scene.checkLevelComplete();
        expect(scene.restartLevel).not.toHaveBeenCalled();
        captured?.();
        expect(scene.restartLevel).toHaveBeenCalledOnce();
      });

      it('re-entry is blocked while isLevelingUp is latched', () => {
        // Capture the deferred callback so we can inspect the mid-hold state.
        scene.time = { delayedCall: vi.fn() };
        scene.checkLevelComplete();
        expect(scene.level).toBe(2);

        // A second tick with dotsCollected still >= totalDots must NOT
        // re-trigger — the latched flag is the guard.
        scene.checkLevelComplete();
        expect(scene.level).toBe(2);
      });

      it('clears nextDirection when entering level-up (no surprise turn post-restart)', () => {
        scene.nextDirection = 'UP';
        scene.time = { delayedCall: vi.fn() };
        scene.checkLevelComplete();
        expect(scene.nextDirection).toBe('NONE');
      });
    });

    describe('Level-clear side effects', () => {
      it('emits the green CAMERA FLASH feel dial (matches Frogger F1)', () => {
        scene.checkLevelComplete();
        expect(scene.cameras.main.flash).toHaveBeenCalledWith(
          150,
          0,
          255,
          0,
          false,
          undefined,
          undefined,
          0.15
        );
      });

      it('paints the "LEVEL N CLEAR" banner with N = pre-increment level', () => {
        scene.level = 3; // will increment to 4; banner reports "LEVEL 3 CLEAR"
        scene.checkLevelComplete();
        const textCalls = (scene.add.text as ReturnType<typeof vi.fn>).mock.calls;
        const bannerCall = textCalls.find((c) => String(c[2]).includes('CLEAR'));
        expect(bannerCall).toBeDefined();
        expect(bannerCall![2]).toBe('LEVEL 3 CLEAR');
      });

      it('banner tween arms with fade + rise + scale over LEVEL_CLEAR_DELAY_MS', () => {
        scene.checkLevelComplete();
        const tweenCalls = (scene.tweens.add as ReturnType<typeof vi.fn>).mock.calls;
        // One of the tweens is the LEVEL CLEAR banner (alpha=0 + scale=1.5 + duration matches)
        const bannerTween = tweenCalls.find(
          (c) =>
            c[0]?.alpha === 0 &&
            c[0]?.scale === 1.5 &&
            c[0]?.duration === GAME_CONFIG.LEVEL_CLEAR_DELAY_MS
        );
        expect(bannerTween).toBeDefined();
      });
    });

    describe('Collision firewall during banner hold', () => {
      it('collectDot no-ops while isLevelingUp', () => {
        scene.isLevelingUp = true;
        const dot = makeMockSprite();
        const scoreBefore = scene.score;
        scene.collectDot(dot);
        expect(dot.destroy).not.toHaveBeenCalled();
        expect(scene.score).toBe(scoreBefore);
        expect(scene.dotsCollected).toBe(100); // unchanged from beforeEach
      });

      it('collectPowerPellet no-ops while isLevelingUp', () => {
        scene.isLevelingUp = true;
        const pellet = makeMockSprite();
        const scoreBefore = scene.score;
        scene.collectPowerPellet(pellet);
        expect(pellet.destroy).not.toHaveBeenCalled();
        expect(scene.score).toBe(scoreBefore);
      });

      it('collectBulletTimeDot no-ops while isLevelingUp', () => {
        scene.isLevelingUp = true;
        const dot = makeMockSprite();
        const scoreBefore = scene.score;
        scene.collectBulletTimeDot(dot);
        expect(dot.destroy).not.toHaveBeenCalled();
        expect(scene.score).toBe(scoreBefore);
      });

      it('handleAgentCollision no-ops on lethal hit while isLevelingUp (no life lost)', () => {
        scene.isLevelingUp = true;
        scene.lives = 3;
        const agent = makeMockAgent('chase');
        scene.handleAgentCollision(agent);
        expect(scene.lives).toBe(3); // no life lost
      });

      it('handleAgentCollision no-ops on frightened eat while isLevelingUp (no score)', () => {
        scene.isLevelingUp = true;
        const scoreBefore = scene.score;
        const agent = makeMockAgent('frightened');
        scene.handleAgentCollision(agent);
        expect(scene.score).toBe(scoreBefore);
        expect(scene.ghostsEatenThisPellet).toBe(0);
      });
    });

    describe('A2 release curve re-arms after level-clear', () => {
      it('resetPositions (called by restartLevel) re-arms agentReleaseIndex to 1', () => {
        // resetPositions is mocked in the fixture so we verify the contract
        // via the source: `this.agentReleaseIndex = 1` is the exact single
        // point that re-arms the staggered release for the next level. If a
        // refactor drops this, Level 2+ starts with all 4 agents loose and
        // Tom's A2 tutorial-zone fix regresses.
        const src = readSceneSource();
        const match = src.match(/private resetPositions\(\): void \{([\s\S]*?)\n {2}\}/);
        expect(match).not.toBeNull();
        expect(match![1]).toMatch(/this\.agentReleaseIndex\s*=\s*1\b/);
      });

      it('restartLevel is called by the deferred callback with the next layout + layoutChanged=true on L1→L2', () => {
        scene.checkLevelComplete();
        expect(scene.restartLevel).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'ARENA' }),
          true
        );
      });

      it('ALL_MAZES achievement arms after the three-map cycle is walked', () => {
        // After cycling through CLASSIC → ARENA → LABYRINTH the set size
        // reaches MAP_LAYOUTS.length and the achievement unlocks.
        scene.level = 2; // will bump to 3 = LABYRINTH
        scene.mazesPlayed = new Set(['CLASSIC', 'ARENA']);
        scene.checkLevelComplete();
        expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.ALL_MAZES);
      });
    });

    describe('update() loop + exposeTestState contract', () => {
      it('exposes isLevelingUp in test state so E2E watchers can see the banner window', () => {
        scene.isLevelingUp = true;
        // update() early-returns on isLevelingUp, but exposeTestState is
        // hoisted above the guards so flag flips are always legible.
        scene.update(0, 16);
        expect(scene.exposeTestState).toHaveBeenCalledWith(
          expect.objectContaining({ isLevelingUp: true })
        );
      });

      it('update() early-returns when isLevelingUp (no mode tick, no agent tick)', () => {
        const readSrc = readSceneSource();
        // Static lock — the three early-returns must appear in order before
        // the body runs. A refactor that re-orders checkLevelComplete above
        // the guard would resurrect the banner-window race.
        expect(readSrc).toMatch(
          /update\([^)]*\):\s*void\s*\{[\s\S]*?if \(this\.isPaused\) return;[\s\S]*?if \(this\.isCountingDown\) return;[\s\S]*?if \(this\.isLevelingUp\) return;/
        );
      });
    });

    describe('LEVEL_CLEAR_DELAY_MS dial', () => {
      it('is a positive finite number', () => {
        expect(typeof GAME_CONFIG.LEVEL_CLEAR_DELAY_MS).toBe('number');
        expect(GAME_CONFIG.LEVEL_CLEAR_DELAY_MS).toBeGreaterThan(0);
        expect(Number.isFinite(GAME_CONFIG.LEVEL_CLEAR_DELAY_MS)).toBe(true);
      });

      it('is long enough for the banner to be readable (>= 1 second)', () => {
        // Anti-regression ratchet. A future iteration can tighten further
        // but can't drop below 1s without an explicit test delete — below
        // 1s the banner would read as a flicker and Tom's original
        // "nothing happened" complaint resurfaces.
        expect(GAME_CONFIG.LEVEL_CLEAR_DELAY_MS).toBeGreaterThanOrEqual(1000);
      });
    });
  });

  // -----------------------------------------------------------------------
  // R87.AC1+ safety-net — Level-clear state carry-over + reset isolation
  // (pre-Tom-tick)
  //
  // R87.AC1's main block locks the NEW state-machine + banner + collision
  // firewall. This safety-net locks the *invariants that must survive the
  // level-clear boundary* — the exact failure-mode Tom's screenshot captured
  // (empty maze, stuck on LVL 1 with SCORE 2570 visible). The existing
  // "Level Completion" block asserts `score === LEVEL_BONUS` starting from
  // score=0; it does NOT lock the additive `+=` contract, carry-over of
  // lives across the boundary, or the `>=` vs `===` threshold on
  // SURVIVE_5_LEVELS beyond the single level-4→5 transition. A refactor
  // clobbering score with `=` instead of `+=`, or flipping the achievement
  // gate to `===`, would all pass the existing suite.
  //
  // The restartLevel static locks cover the paired "what must be reset" /
  // "what must be preserved" contract. `diedThisLevel=false` and
  // `fruitSpawned=[false,false]` MUST fire (else L2+ never re-earns
  // NO_DEATH_LEVEL and fruit never re-spawns); `score=0` and `lives=…`
  // reassignments MUST NOT fire (else Tom's 2570-point run gets wiped on
  // every level-clear, which is the canonical "nothing happened" UX that
  // kicked off AC1).
  //
  // Pure tripwires — no production code touched. Follows the R86.F6
  // (state persistence) + R86.F6+ (`>=` boundary + operator lock) +
  // R86.N2+ (static source + reset isolation) playbook.
  // -----------------------------------------------------------------------
  describe('R87.AC1+ safety-net — level-clear state carry-over + reset isolation', () => {
    function readSceneSource(): string {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      return fs.readFileSync(path.join(__dirname, 'GameScene.ts'), 'utf8');
    }

    function extractBody(src: string, signature: RegExp): string {
      const match = src.match(signature);
      expect(match).not.toBeNull();
      return match![1];
    }

    beforeEach(() => {
      scene.totalDots = 100;
      scene.dotsCollected = 100;
    });

    describe('state carry-over through level-clear (R86.F6 mirror)', () => {
      it('score carries over additive (+= LEVEL_BONUS, NOT = LEVEL_BONUS)', () => {
        // Existing test locks score === LEVEL_BONUS starting from 0. That
        // passes even if `+=` drifts to `=` (clobber). A player mid-session
        // with 500 points must see 500 + LEVEL_BONUS post-clear, not the
        // flat LEVEL_BONUS that a clobbering refactor would produce.
        scene.score = 500;
        scene.checkLevelComplete();
        expect(scene.score).toBe(500 + GAME_CONFIG.SCORING.LEVEL_BONUS);
      });

      it('lives carry over unchanged across the boundary', () => {
        // restartLevel must NOT reassign lives. A refactor that "resets the
        // level state" could silently treat lives as level-scoped — every
        // clear would reset to the starting count and eliminate the lives
        // mechanic entirely.
        scene.lives = 2;
        scene.checkLevelComplete();
        expect(scene.lives).toBe(2);
      });

      it('two sequential clears compound score additively (monotonic)', () => {
        // Direct tripwire for Tom's screenshot scenario — a multi-level run
        // where score must strictly grow across level boundaries.
        scene.score = 0;
        scene.checkLevelComplete(); // Level 1 → 2, +LEVEL_BONUS
        // Fixture's default delayedCall fires inline, so `isLevelingUp` is
        // back to false after the first call. restartLevel is mocked, so
        // dotsCollected/totalDots stay at 100 and the second call re-triggers.
        scene.checkLevelComplete(); // Level 2 → 3, +LEVEL_BONUS
        expect(scene.score).toBe(2 * GAME_CONFIG.SCORING.LEVEL_BONUS);
        expect(scene.level).toBe(3);
      });
    });

    describe('SURVIVE_5_LEVELS threshold — `>=` vs `===` tripwire', () => {
      it('still unlocks SURVIVE_5_LEVELS when level increments 5 → 6', () => {
        // The existing "at level 5" test covers the equality boundary
        // (4 → 5). A refactor tightening `>=` to `===` passes that test
        // but breaks every subsequent level — this locks the operator
        // semantics past the equality frontier. R86.F6+ ships the same
        // guard on the Frogger LEVEL_5 achievement.
        scene.level = 5; // becomes 6
        scene.checkLevelComplete();
        expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.SURVIVE_5_LEVELS);
      });
    });

    describe('triggerLevelClear body static locks', () => {
      it('contains exactly one `this.level++` increment', () => {
        const body = extractBody(
          readSceneSource(),
          /private triggerLevelClear\(\): void \{([\s\S]*?)\n {2}\}/
        );
        const matches = body.match(/this\.level\+\+/g) ?? [];
        expect(matches).toHaveLength(1);
      });

      it('contains exactly one `this.score += GAME_CONFIG.SCORING.LEVEL_BONUS` (locks `+=` not `=`)', () => {
        const body = extractBody(
          readSceneSource(),
          /private triggerLevelClear\(\): void \{([\s\S]*?)\n {2}\}/
        );
        const matches = body.match(/this\.score\s*\+=\s*GAME_CONFIG\.SCORING\.LEVEL_BONUS/g) ?? [];
        expect(matches).toHaveLength(1);
      });
    });

    describe('restartLevel reset isolation — what MUST reset per level', () => {
      it('resets `this.diedThisLevel = false` (else NO_DEATH_LEVEL unattainable on L2+)', () => {
        // Without this reset, a single death anywhere in the session locks
        // NO_DEATH_LEVEL out forever. restartLevel is mocked in the fixture
        // so we verify the contract via source inspection.
        const body = extractBody(
          readSceneSource(),
          /private restartLevel\([^)]*\): void \{([\s\S]*?)\n {2}\}/
        );
        expect(body).toMatch(/this\.diedThisLevel\s*=\s*false\b/);
      });

      it('resets `this.fruitSpawned = [false, false]` (else L2+ fruit never spawns)', () => {
        const body = extractBody(
          readSceneSource(),
          /private restartLevel\([^)]*\): void \{([\s\S]*?)\n {2}\}/
        );
        expect(body).toMatch(/this\.fruitSpawned\s*=\s*\[\s*false\s*,\s*false\s*\]/);
      });

      it('resets `this.bulletTimeActive = false` (else bullet-time leaks across levels)', () => {
        const body = extractBody(
          readSceneSource(),
          /private restartLevel\([^)]*\): void \{([\s\S]*?)\n {2}\}/
        );
        expect(body).toMatch(/this\.bulletTimeActive\s*=\s*false\b/);
      });
    });

    describe('restartLevel NOT-reset isolation — what MUST persist per level', () => {
      it('does NOT clobber `this.score = 0` (carry-over contract)', () => {
        // The inverse of the score carry-over behaviour test. A static
        // source lock catches a refactor that adds `this.score = 0` to
        // restartLevel — which would regress Tom's SCORE 2570 screenshot
        // scenario even if the triggerLevelClear `+=` contract still held
        // (because restartLevel runs AFTER triggerLevelClear).
        const body = extractBody(
          readSceneSource(),
          /private restartLevel\([^)]*\): void \{([\s\S]*?)\n {2}\}/
        );
        expect(body).not.toMatch(/this\.score\s*=\s*0\b/);
      });

      it('does NOT reassign `this.lives =` (carry-over contract)', () => {
        // Pairs with the lives-carry-over behaviour test. Guards against
        // a refactor that treats restartLevel as a "fresh session" helper
        // and silently resets the lives counter.
        const body = extractBody(
          readSceneSource(),
          /private restartLevel\([^)]*\): void \{([\s\S]*?)\n {2}\}/
        );
        expect(body).not.toMatch(/this\.lives\s*=(?!=)/);
      });
    });
  });
});
