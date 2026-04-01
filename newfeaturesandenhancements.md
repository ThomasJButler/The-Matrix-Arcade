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

- [ ] `src/lib/phaser/scenes/BaseScene.ts` — add `exposeTestState()` method
- [ ] `src/lib/phaser/PhaserGame.tsx` — expose game instance in test mode
- [ ] `src/components/games/phaser/AgentChase/scenes/GameScene.ts` — expose `score, lives, level, dotsCollected`
- [ ] `src/components/games/phaser/MatrixFrogger/scenes/GameScene.ts` — expose `score, maxDistance, combo, lives`
- [ ] `src/components/games/phaser/NeoJump/scenes/GameScene.ts` — expose `altitude, score, isGameOver, jetpackFuel`
- [ ] `src/components/games/phaser/RhythmHacker/scenes/GameScene.ts` — expose `score, combo, health, missCount`
- [ ] `src/components/games/phaser/CloudJumper/scenes/GameScene.ts` — expose `score, distance, bounceStreak`
- [ ] `src/components/games/SimpleSnake.tsx` — add `data-game-phase`, `data-score`
- [ ] `src/components/games/VortexPong.tsx` — add `data-game-phase`, `data-score`
- [ ] `src/components/games/Metris.tsx` — add `data-game-phase`, `data-score`
- [ ] `src/components/games/MatrixCloud.tsx` — add `data-game-phase`, `data-score`
- [ ] `src/components/games/MatrixInvaders.tsx` — add `data-game-phase`, `data-score`
- [ ] `src/components/games/CtrlSWorld.tsx` — add `data-game-phase`

#### Phase 2 — Test Infrastructure

- [ ] `e2e/fixtures/test-utils.ts` (new) — `enableTestMode()`, `getPhaserState()`, `getReactGamePhase()`, `getReactScore()`, `waitForPhaserState()`, `waitForScore()`, `waitForGameOver()`, `waitForPhaserScene()`, `ensurePhaserFocus()`, `loseFocus()`, `recoverFocus()`
- [ ] `e2e/fixtures/game-helpers.ts` (new) — per-game action functions: `startPhaserGame()`, `moveSnake()`, `triggerSnakeDeath()`, `dropPiece()`, `shootInvader()`, `flap()`, `movePaddle()`, `hopForward()`, `moveInMaze()`, `selectTrack()`, `hitNotes()`, `jump()`, etc.
- [ ] `e2e/fixtures/arcade.fixture.ts` — add `gameplayPage` fixture with auto-enabled test mode
- [ ] `package.json` — add `"test:gameplay": "npx playwright test e2e/gameplay/"` script

#### Phase 3 — Advanced Gameplay Specs (76 tests across 12 files)

Priority 1 — High Bug Surface Area (33 tests):
- [ ] `e2e/gameplay/snake.gameplay.spec.ts` (8 tests) — score on food, wall death, self-collision death, pause/resume, direction changes, restart, full lifecycle, focus loss/recovery
- [ ] `e2e/gameplay/agent-chase.gameplay.spec.ts` (10 tests) — dot collection scoring, lives on collision, game over on all lives lost, power pellet frightens agents, pause/resume, ESC exit, focus loss overlay, focus recovery, full lifecycle
- [ ] `e2e/gameplay/rhythm-hacker.gameplay.spec.ts` (8 tests) — health depletes on misses, health zero game over (60s timeout), note hit scoring, combo building, combo reset on miss, pause during countdown, track selection nav, empty hit penalty
- [ ] `e2e/gameplay/metris.gameplay.spec.ts` (7 tests) — piece placement, board-fill game over, hard drop, rotation, pause/resume, full lifecycle, rapid input stability

Priority 2 — Moderate Complexity (27 tests):
- [ ] `e2e/gameplay/matrix-frogger.gameplay.spec.ts` (7 tests) — forward movement scoring, enemy collision death, pill collection, power-ups, backward movement, pause/resume, full lifecycle
- [ ] `e2e/gameplay/neo-jump.gameplay.spec.ts` (6 tests) — altitude increases, horizontal movement, fall game over, jetpack fuel depletion, pause/resume, full lifecycle
- [ ] `e2e/gameplay/matrix-cloud.gameplay.spec.ts` (5 tests) — flap altitude, gravity pull, obstacle scoring, collision game over, pause/resume
- [ ] `e2e/gameplay/matrix-invaders.gameplay.spec.ts` (5 tests) — shooting scoring, player movement, wave progression, health depletion game over, pause/resume
- [ ] `e2e/gameplay/vortex-pong.gameplay.spec.ts` (4 tests) — paddle movement, score tracking, game over, pause/resume

Priority 3 — Edge Cases (16 tests):
- [ ] `e2e/gameplay/cloud-jumper.gameplay.spec.ts` (5 tests) — jump mechanics, distance tracking, cloud bounce scoring, storm cloud damage, pause/resume
- [ ] `e2e/gameplay/edge-cases.gameplay.spec.ts` (11 tests) — focus loss during Phaser play, focus recovery, double ESC, pause on game-over screen, rapid pause toggle, game over event propagation, high score preservation, mute toggle, window resize, portal navigation from game over, autoStart skips menu

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

- [ ] Rhythm Hacker: Actual audio file playback synchronised with notes
- [ ] Rhythm Hacker: Latency calibration option for different hardware
- [ ] Agent Chase: Continuous background siren (requires looping sound system)

### Gameplay

- [ ] Rhythm Hacker: Seed-based note generation for leaderboard fairness
- [ ] Rhythm Hacker: Replay recording/playback
- [ ] Agent Chase: Intermission screens between levels
- [ ] Agent Chase: Demo mode on menu (AI plays)
- [ ] All games: Difficulty level selector at game start
- [ ] All games: Tutorial overlay for first-time players
- [ ] MatrixFrogger: Input buffering for hop animation (JustDown + isMoving guard swallows key presses during 150ms animation)
- [ ] CloudJumper: Consolidate redundant jump input (SPACE polled via JustDown, UP/W via event callback)

### Visual Polish

- [ ] Cloud Jumper: Add Matrix-green tinting — current bright blue sky is inconsistent with arcade aesthetic

### Code Quality

- [ ] Neo Jump: Consolidate redundant altitude state variables
- [ ] Extract collision detection logic into reusable utility
- [ ] Add error boundaries around game components
- [ ] Code-splitting to reduce 2.18MB bundle size
- [ ] Improve E2E test reliability with explicit wait conditions instead of timeouts
- [ ] Remove `console.warn` from production code (useSoundSystem x5, useShatnerVoice x1, useAdvancedVoice x1, useLifelineManager x1)
- [ ] MatrixCloud: Fix `window.setTimeout()` cast to `unknown as number` — use `useRef` for timer IDs
- [ ] MatrixCloud: Remove dead code `BOSS_TYPES` constant (suppressed by eslint-disable)
- [ ] MatrixCloud: Review 2 eslint-disable comments (`@typescript-eslint/no-unused-vars` line 26, `react-hooks/exhaustive-deps` line 1248)
- [ ] useAchievementManager: Fix `saveGame`/`loadGame` passthrough (properties don't exist on useSaveSystem return value)
- [ ] useAchievementManager: Fix unreachable custom notification path (`unlockAchievement` returns void, so `if (success)` is always falsy)
- [ ] useAchievementManager: Duplicate notification bug — custom notification + useEffect both push notifications for same unlock
- [ ] useSaveSystem: Fix `unlockAchievement` mutating prev state directly inside `setSaveData` updater (violates React immutability contract)
- [ ] useParticleSystem: Switch from React state to refs for per-frame particle positions (avoids re-render per frame); RAF loop runs even with zero particles
- [ ] useSoundSynthesis: Close AudioContext on unmount (currently leaks); `crash` drum type has no implementation
- [ ] useProceduralAudio: Close AudioContext on unmount (currently leaks); `generateAdaptiveMusic` returns unscheduled sequence
- [ ] useObjectPool: `acquire` uses O(n) Array.find scan — consider free-list for hot-path performance
- [ ] useAdvancedVoice: AudioContext analyser never receives speech output (getVisualizationData returns zeroes)
- [ ] usePerformanceMonitor: FPS stats never updated when overlay is hidden
- [ ] useViewportCulling: `cullObjects` mutates `visible` property on input objects (side effect)
- [ ] MatrixCloud: `updateGame` calls `setState` inside RAF every frame — should use ref-dispatch pattern like VortexPong/MatrixInvaders
- [ ] CtrlSWorld: Pause is a separate `isPaused` boolean, not a `GamePhase` enum value — creates ambiguous compound states
- [ ] SimpleSnake: `achievementManager` prop accepted but aliased to `_achievementManager` and never used
- [ ] useSimpleSnakeGame: `_isSnakeCollision` method defined but never called — dead code
- [ ] useSoundSystem: `updateConfig` closes over stale `config` — rapid successive calls overwrite each other (should use functional updater)
- [ ] useGameLoop: No deltaTime capping — backgrounded tab delivers massive deltaTime spike on focus
- [ ] Metris: `getWallKickOffsets` ignores its `rotation` parameter — potential incorrect wall kicks
- [ ] App.tsx/LandingPage.tsx: Game data duplicated in two arrays — should share a central data source

### Testing Improvements

- [ ] Complete PWAUpdatePrompt.test.tsx `.todo()` test (module caching limitation)
- [ ] Complete SaveLoadManager.test.tsx `.todo()` tests (loading indicator, error message)
- [ ] Fix landing page scroll position tests — landing-top/middle/bottom all capture identical viewport
- [ ] Fix card-play.png screenshot — crop region captures only a sliver of text (1,196 bytes vs 80-130KB for others)

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
