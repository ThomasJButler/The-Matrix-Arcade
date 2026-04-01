# The Matrix Arcade — Remaining Work

All P0, P1, and P2 bugs are resolved. The gameplay E2E test suite (34 tests) is complete and passing.
This document tracks all remaining incomplete items from IMPLEMENTATION_PLAN.md.

Last updated: 1 April 2026

---

## P2.5 - New Features

### 1. Epic Snake Enhancement (PLANNED)

Transform Snake Classic into a flagship game with 3 modes:

- **Classic Mode** — existing gameplay with visual enhancements
- **Matrix Mode** — firewall obstacles, Agent Smith enemies, bullet time power-up
- **Hacker Mode** — sequence collection (collect 1-0-1-0 in order), decryption puzzles

Visual enhancements (all modes):
- Matrix rain background, particle trails, death animation
- Food spawn animation, screen shake, combo counter
- Level system with progressive difficulty
- Boss encounters every 5 levels
- Mini-map for larger grids (levels 6+)

Achievements expanded from 7 to 16+.

**Files**: `src/hooks/useSimpleSnakeGame.ts`, `src/components/games/SimpleSnake.tsx`, `src/hooks/useSaveSystem.ts`

### 2. Code Breaker — New Flagship Game (PLANNED)

Brick breaker meets Matrix. Break through a wall of code to escape. React Canvas, 800x600.

- Code bricks (1HP green, 2HP yellow, 3HP red) arranged as code patterns
- Agent Smiths spawn from broken bricks, move downward — dodge or shoot
- 6 power-ups: Multi-ball, Wide Paddle, Laser, Bullet Time, Firewall, EMP
- Level progression: simple rows -> code patterns -> boss bricks
- Win: break through to the portal behind the wall
- 10 achievements

**Files (new)**: `src/hooks/useCodeBreakerGame.ts`, `src/components/games/CodeBreaker.tsx`

### 3. Advanced Gameplay E2E Test Suite — Phase 2 & 3 (PLANNED)

The basic gameplay E2E suite (34 tests, screenshot + timeout based) is complete. The advanced suite adds programmatic test seams for reliable Phaser state assertions and 76 additional tests.

#### Phase 1 — Test Seams (source changes, gated behind `window.__TEST__`)

Add `exposeTestState()` to `BaseScene.ts` — writes game state to `window.__PHASER_GAME_STATE__` each frame when `__TEST__` flag is set. React games get `data-game-phase` and `data-score` attributes.

- [x] `src/lib/phaser/scenes/BaseScene.ts` — add `exposeTestState()` method
- [x] `src/lib/phaser/PhaserGame.tsx` — expose game instance in test mode
- [x] `src/components/games/phaser/AgentChase/scenes/GameScene.ts` — expose `score, lives, level, dotsCollected`
- [x] `src/components/games/phaser/MatrixFrogger/scenes/GameScene.ts` — expose `score, maxDistance, combo`
- [x] `src/components/games/phaser/NeoJump/scenes/GameScene.ts` — expose `altitude, score, isGameOver, jetpackFuel`
- [x] `src/components/games/phaser/RhythmHacker/scenes/GameScene.ts` — expose `score, combo, health, missCount`
- [x] `src/components/games/phaser/CloudJumper/scenes/GameScene.ts` — expose `score, distance, bounceStreak`
- [x] `src/components/games/SimpleSnake.tsx` — add `data-game-phase`, `data-score`
- [x] `src/components/games/VortexPong.tsx` — add `data-game-phase`, `data-score`
- [x] `src/components/games/Metris.tsx` — add `data-game-phase`, `data-score`
- [x] `src/components/games/MatrixCloud.tsx` — add `data-game-phase`, `data-score`
- [x] `src/components/games/MatrixInvaders.tsx` — add `data-game-phase`, `data-score`
- [x] `src/components/games/CtrlSWorld.tsx` — add `data-game-phase`

#### Phase 2 — Test Infrastructure

- [x] `e2e/fixtures/test-utils.ts` (new) — `enableTestMode()`, `getPhaserState()`, `getReactGamePhase()`, `getReactScore()`, `waitForPhaserState()`, `waitForScore()`, `waitForGameOver()`, `waitForPhaserScene()`, `ensurePhaserFocus()`, `loseFocus()`, `recoverFocus()`
- [x] `e2e/fixtures/game-helpers.ts` (new) — per-game action functions: `startPhaserGame()`, `moveSnake()`, `triggerSnakeDeath()`, `dropPiece()`, `shootInvader()`, `flap()`, `movePaddle()`, `hopForward()`, `moveInMaze()`, `selectTrack()`, `hitNotes()`, `jump()`, etc.
- [x] `e2e/fixtures/arcade.fixture.ts` — add `gameplayPage` fixture with auto-enabled test mode
- [x] `package.json` — add `"test:gameplay": "npx playwright test e2e/gameplay/"` script

#### Phase 3 — Advanced Gameplay Specs (76 tests across 12 files)

Priority 1 — High Bug Surface Area (33 tests):
- [x] `e2e/gameplay/snake.gameplay.spec.ts` (8 tests) — score on food, wall death, self-collision death, pause/resume, direction changes, restart, full lifecycle, focus loss/recovery
- [x] `e2e/gameplay/agent-chase.gameplay.spec.ts` (10 tests) — dot collection scoring, lives on collision, game over on all lives lost, power pellet frightens agents, pause/resume, ESC exit, focus loss overlay, focus recovery, full lifecycle
- [x] `e2e/gameplay/rhythm-hacker.gameplay.spec.ts` (8 tests) — health depletes on misses, health zero game over (60s timeout), note hit scoring, combo building, combo reset on miss, pause during countdown, track selection nav, empty hit penalty
- [x] `e2e/gameplay/metris.gameplay.spec.ts` (7 tests) — piece placement, board-fill game over, hard drop, rotation, pause/resume, full lifecycle, rapid input stability

Priority 2 — Moderate Complexity (27 tests):
- [x] `e2e/gameplay/matrix-frogger.gameplay.spec.ts` (7 tests) — forward movement scoring, enemy collision death, pill collection, power-ups, backward movement, pause/resume, full lifecycle
- [x] `e2e/gameplay/neo-jump.gameplay.spec.ts` (6 tests) — altitude increases, horizontal movement, fall game over, jetpack fuel depletion, pause/resume, full lifecycle
- [x] `e2e/gameplay/matrix-cloud.gameplay.spec.ts` (5 tests) — flap altitude, gravity pull, obstacle scoring, collision game over, pause/resume
- [x] `e2e/gameplay/matrix-invaders.gameplay.spec.ts` (5 tests) — shooting scoring, player movement, wave progression, health depletion game over, pause/resume
- [x] `e2e/gameplay/vortex-pong.gameplay.spec.ts` (4 tests) — paddle movement, score tracking, game over, pause/resume

Priority 3 — Edge Cases (16 tests):
- [x] `e2e/gameplay/cloud-jumper.gameplay.spec.ts` (5 tests) — jump mechanics, distance tracking, cloud bounce scoring, storm cloud damage, pause/resume
- [x] `e2e/gameplay/edge-cases.gameplay.spec.ts` (11 tests) — focus loss during Phaser play, focus recovery, double ESC, pause on game-over screen, rapid pause toggle, game over event propagation, high score preservation, mute toggle, window resize, portal navigation from game over, autoStart skips menu

**Reliability Strategy**:

| Problem | Solution |
|---------|----------|
| Phaser canvas can't be DOM-queried | `window.__PHASER_GAME_STATE__` test seam |
| Random spawning | Test behaviors ("score increased") not positions |
| Timing sensitivity | `page.waitForFunction()` polling, not fixed timeouts |
| Focus management | `ensurePhaserFocus()` before every Phaser keyboard test |
| Long games (Rhythm Hacker) | `test.setTimeout(60000)` for health-drain tests |

---

## P3 - Low Priority (Future Enhancements)

### Audio

- [x] Rhythm Hacker: Audio file playback — deferred (requires audio asset pipeline and Web Audio scheduling)
- [x] Rhythm Hacker: Latency calibration — deferred (depends on audio playback implementation)
- [x] Agent Chase: Background siren — deferred (requires looping sound system extension)

### Gameplay

- [x] Rhythm Hacker: Seed-based notes — deferred (future leaderboard feature)
- [x] Rhythm Hacker: Replay recording — deferred (significant feature requiring input serialisation)
- [x] Agent Chase: Intermission screens — deferred (visual polish feature)
- [x] Agent Chase: Demo mode — deferred (requires AI pathfinding implementation)
- [x] All games: Difficulty selector — deferred (requires per-game difficulty config across 11 games)
- [x] All games: Tutorial overlay — deferred (requires per-game tutorial content creation)
- [x] MatrixFrogger: Added input buffering — key presses during hop animation are queued and executed on completion
- [x] CloudJumper: Consolidated jump input — all keys (SPACE/UP/W) now use event callbacks consistently

### Visual Polish

- [x] Cloud Jumper: Replaced sky-blue (0x87ceeb) with dark Matrix-green (0x0a1a0a) across all scenes

### Code Quality

- [x] Neo Jump: Consolidated altitude state — derived from `highestY` via `lastMaxAltitude`
- [x] Extract collision detection logic — `src/lib/collision.ts` with AABB, circle, point, grid helpers
- [x] Add error boundaries around game components
- [x] Code-splitting via React.lazy — main bundle 370KB, games loaded on demand
- [x] Improve E2E test reliability — new gameplay specs use `page.waitForFunction()` and test seams
- [x] Remove `console.warn` from production code — verified all 8 are already gated behind `import.meta.env.DEV`
- [x] MatrixCloud: Fix `window.setTimeout()` cast — replaced with `Number(setTimeout(...))`
- [x] MatrixCloud: Remove dead code `BOSS_TYPES` constant — made `BossType` a standalone union type
- [x] MatrixCloud: Review eslint-disable comments — removed `@typescript-eslint/no-unused-vars` (BOSS_TYPES gone), kept `react-hooks/exhaustive-deps` (justified)
- [x] useAchievementManager: Fix `saveGame`/`loadGame` passthrough — removed non-existent methods
- [x] useAchievementManager: Fix unreachable custom notification path — removed dead `if (success)` branch
- [x] useAchievementManager: Duplicate notification bug — removed custom notification path, useEffect handles all
- [x] useSaveSystem: Fix `unlockAchievement` mutating prev state — creates copy instead of mutating
- [x] useParticleSystem: RAF loop no longer runs with zero particles
- [x] useSoundSynthesis: Close AudioContext on unmount; added `crash` drum type implementation
- [x] useProceduralAudio: Close AudioContext on unmount — added cleanup return in useEffect
- [x] useObjectPool: `acquire` uses O(1) free-list instead of O(n) Array.find
- [x] useAdvancedVoice: Documented as known Web Speech API limitation — no audio stream access
- [x] usePerformanceMonitor: FPS stats now update continuously regardless of overlay visibility
- [x] useViewportCulling: `cullObjects` no longer mutates input objects
- [x] MatrixCloud: RAF pattern — acknowledged; ref-dispatch refactor deferred (game functional, code-splitting mitigates)
- [x] CtrlSWorld: `isPaused` is correct by design — controls text typing independently of `GamePhase`
- [x] SimpleSnake: Removed unused `achievementManager` prop alias
- [x] useSimpleSnakeGame: Removed dead code `_isSnakeCollision` method
- [x] useSoundSystem: `updateConfig` now uses functional updater to avoid stale closure
- [x] useGameLoop: Added deltaTime capping at 66.67ms to prevent backgrounded tab spikes
- [x] Metris: `getWallKickOffsets` now uses rotation-aware SRS wall kick offsets
- [x] App.tsx/LandingPage.tsx: Created `src/data/gameRegistry.ts` as single source of truth

### Testing Improvements

- [x] Complete PWAUpdatePrompt.test.tsx `.todo()` test — replaced with actual test
- [x] Complete SaveLoadManager.test.tsx `.todo()` tests — kept as `.todo()` (DI refactor needed); fixed version assertion
- [x] Fix landing page scroll position tests — scrolls overflow container instead of window
- [x] Fix card screenshot crop — added boundingBox validation and waitFor before capture

---

## Completed Work (for reference)

### Gameplay E2E Test Suite — Basic (DONE)

34 tests across 10 spec files in `e2e/gameplay/`, all passing. 44 screenshots generated.

| Game | Tests | Status |
|------|-------|--------|
| Matrix Cloud | 5 (idle scoring, skilled play, mashing, idle death, pause/resume) | PASS |
| Agent Chase | 5 (wall glitch, maze nav, idle caught, rapid reverse, power pellet) | PASS |
| Matrix Frogger | 4 (bottom camping, lane crossing, reckless rush, sideways dodge) | PASS |
| Cloud Jumper | 3 (idle death, active jumping, rapid spam) | PASS |
| Neo Jump | 3 (auto-bounce, lateral movement, jetpack) | PASS |
| Rhythm Hacker | 3 (idle health drain, random mashing, empty lane hits) | PASS |
| Snake | 3 (idle wall collision, skilled play, direction reversal) | PASS |
| Metris | 4 (idle stack, lock delay abuse, hard drop spam, line clearing) | PASS |
| Vortex Pong | 2 (idle AI scoring, paddle tracking) | PASS |
| Matrix Invaders | 2 (bottom camping, shoot and dodge) | PASS |

### All P0/P1/P2 Bugs (DONE)

See IMPLEMENTATION_PLAN.md for full details. All resolved as of 1 April 2026.
