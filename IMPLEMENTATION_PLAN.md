# Matrix Arcade - Implementation Plan

This file is auto-generated and updated by Ralph during planning and building loops.

Run `./loop.sh plan` or `./loop-full.sh` to analyse the codebase and generate tasks.

---

## Completion Status

- **Status**: POLISHED — All P0/P1/P2 bugs resolved; only optional P2.5 features and P3 enhancements remain
- **Last Verified**: 31 March 2026 — Full gap analysis with code verification of all open items (re-verified same day; all P2 items resolved)
- **Version**: v2.0.0 (polished)
- **Test Coverage**: ~1,607 unit tests (48 files), 127 E2E tests across 15 spec files (11 games + landing + settings + modals + achievements)
- **Games**: 11 playable (6 React/Canvas + 5 Phaser) + 1 planned (Code Breaker)
- **Build**: PASSES (2.18MB bundle, chunk size warning)

### Available Skills & Slash Commands

| Skill | Slash Command | When to Use |
|-------|---------------|-------------|
| Matrix Arcade Gamedev | `/matrix-arcade-gamedev` | Any game code changes |
| Phaser Gamedev | `/phaser-gamedev` | Phaser 3 scene development |
| Playwright Testing | `/playwright-testing` | E2E test creation/debugging |
| New Game Scaffolder | `/new-game <Name> [--phaser]` | Scaffolding a brand new game |
| Game Tester | `/game-tester` | Run full test suite after changes |

---

## P0 - Critical (Controls & Playability Broken)

### 1. Phaser Games: Keyboard Controls Not Working (Focus Loss)

**Root Cause (Confirmed via code review + screenshots)**: `PhaserGame.tsx` sets focus once on the `'ready'` event (line 144), but focus is easily lost when clicking any surrounding React UI (carousel arrows, achievement toasts, header buttons). Once focus is lost, ALL keyboard input silently fails because Phaser's KeyboardPlugin requires DOM focus on the container div. The only recovery is clicking on the game — there is no visual "Click to play" overlay or auto-refocus on mouse hover.

**Compounding Factor**: All keyboard setup methods (`setupCommonInputs()`, `setupMenuInput()`, game-specific `setupInput()`) have a silent `if (!this.input.keyboard) return;` guard — if keyboard is null, no error is logged and all input is silently disabled.

**Fix**:
- [x] Add `onMouseEnter` handler to `PhaserGame.tsx` container that calls `containerRef.current?.focus()` — auto-refocus when hovering over the game
- [x] Add a visible "Click to play" overlay when the container loses focus (`onBlur`) — display it as a centred semi-transparent overlay on the game canvas
- [x] Consider `pointerdown` listener on the document that refocuses the container when clicking inside it
- [x] Add `console.warn` to keyboard null guards so failures are diagnosable
- [x] Test: Verify keyboard input works after clicking outside and back

> **RESOLVED: Added onMouseEnter auto-refocus and click-to-play overlay to PhaserGame.tsx**

**Files**: `src/lib/phaser/PhaserGame.tsx`, `src/lib/phaser/scenes/BaseScene.ts`, `src/lib/phaser/scenes/MenuScene.ts`

### 2. VortexPong: Freezes on Press Enter

**Root Cause (Confirmed via full code analysis)**: The `useGameLoop` callback is an **inline (non-memoised) function** that closes over 12+ state variables. Every render creates a new callback, causing `useGameLoop` to cancel and restart its rAF loop via a cascading `useCallback` → `useEffect` teardown/rebuild.

**Fix**:
- [x] Stop using `useGameLoop` — manage own rAF loop in a `useEffect` keyed only to `gamePhase`
- [x] Store game loop callbacks in stable refs
- [x] Store keyboard input in a `keysRef = useRef<Set<string>>()`
- [x] Consolidate 14 `useState` hooks into a single `GameState` object
- [x] Merge the paddle update rAF into the main game loop
- [x] Make `resetGame()` a single `setState` call

> **RESOLVED: Replaced useGameLoop with own rAF loop keyed to gamePhase, stable callback refs, keysRef for keyboard input, merged paddle rAF into main loop**

**Files**: `src/components/games/VortexPong.tsx`, `src/hooks/useGameLoop.ts`

### 3. Phaser Games: No Visible Pause Overlay

**Fix**:
- [x] Add a shared `showPauseOverlay()` / `hidePauseOverlay()` method to `BaseScene`
- [x] Call it from `togglePause()` in BaseScene

> **RESOLVED: Added showPauseOverlay()/hidePauseOverlay() to BaseScene with dimmed overlay and PAUSED text at depth 9998-9999**

**Files**: `src/lib/phaser/scenes/BaseScene.ts` (shared fix for all games)

---

## P1 - High Priority (Gameplay Bugs)

### 4. Rhythm Hacker: Health Drains During Countdown + Timing Bugs

**Fix**:
- [x] Gate the empty-hit penalty behind `!this.isCountdown`
- [x] Replace `this.countdownTime += 1000 / 60` with `this.countdownTime += delta`
- [x] Extract countdown duration to named constants in config.ts
- [x] Extract empty-hit penalty to `HEALTH.EMPTY_HIT_PENALTY` constant
- [x] Added `removeAllKeys(true)` to shutdown for proper key cleanup

> **RESOLVED: Countdown guard, frame-rate-independent timing, extracted constants to config.ts, added key cleanup to shutdown**

**Files**: `src/components/games/phaser/RhythmHacker/scenes/GameScene.ts`, `src/components/games/phaser/RhythmHacker/config.ts`

### 5. Cloud Jumper: Cloud Generation Critically Broken

**Fix**:
- [x] Decouple cloud generation from `player.x`
- [x] Widen `canLandOnCloud` collision
- [x] Remove dead code `player.x < -50` check

> **RESOLVED: Cloud generation now continuously produces platforms, collision uses cloud top surface, dead code removed**

**Files**: `src/components/games/phaser/CloudJumper/scenes/GameScene.ts`

### 6. Agent Chase: HUD Display Bugs (A Values + Dual Level)

**Fix**:
- [x] Add defensive cleanup at start of `createUI()`
- [x] Increase font size from 12px to 14px
- [x] Initialise HUD text with actual state values

> **RESOLVED: Defensive text cleanup, larger font size, dynamic initial values**

**Files**: `src/components/games/phaser/AgentChase/scenes/GameScene.ts`

### 7. GameOverScene Missing Space Key for Restart + High Score Not Passed

**Fix**:
- [x] Add Space key binding to `GameOverScene.setupGameOverInput()`
- [x] Pass `highScore` from `BaseScene.gameOver()` to GameOverScene

> **RESOLVED: Added Space key binding to GameOverScene.setupGameOverInput(), added highScore parameter to BaseScene.gameOver()**

**Files**: `src/lib/phaser/scenes/GameOverScene.ts`, `src/lib/phaser/scenes/BaseScene.ts`

### 17. CloudJumper: No isGameOver Guard — Double Death Sequence

**Issue**: `checkGameOver()` and `hitObstacle()` had no guard to prevent multiple death triggers.

**Fix**:
- [x] Functionally resolved via scene transition architecture — `playerDeath()` immediately calls `this.scene.start(SCENE_KEYS.GAME_OVER)`, which transitions the scene and naturally prevents subsequent triggers
- [x] Phaser's scene manager stops the current scene on `scene.start()`, so duplicate calls are safely ignored

> **RESOLVED: Scene transition architecture prevents double death — no explicit flag needed**

**Files**: `src/components/games/phaser/CloudJumper/scenes/GameScene.ts`

### 18. AgentChase & RhythmHacker: gameOver() Shadows BaseScene — No Sound or Event

**Issue (Confirmed via code review — verified 31 March)**: Both AgentChase (line 583) and RhythmHacker (line 816) define a `private gameOver()` method that shadows `BaseScene.gameOver()`. The private versions call `reportScore()` and `this.scene.start()` directly but do NOT call `this.playSound('gameOver')` or `this.emitGameEvent({ type: 'gameOver' })`. This means:
- No game-over sound effect plays in these two games
- The React layer is not notified of the game-over event

**AgentChase line 583**:
```typescript
private gameOver(): void {
  this.reportScore(this.score, this.score);
  this.scene.start(SCENE_KEYS.GAME_OVER, { score: this.score, highScore: this.score, reason: `Level ${this.level}` });
}
```

**RhythmHacker line 816**:
```typescript
private gameOver(): void {
  this.reportScore(this.score, this.score);
  this.scene.start(SCENE_KEYS.GAME_OVER, { score: this.score, highScore: this.score, reason: 'Health depleted' });
}
```

**Fix**:
- [x] AgentChase: Removed private `gameOver()` shadow, call sites now use inherited `BaseScene.gameOver(score, reason)` with `reportScore()` before it
- [x] RhythmHacker: Same — removed private shadow, updated call sites including `levelComplete()` which had the same bypass
- [x] Test: TypeScript compiles, build passes

> **RESOLVED: Removed private gameOver() shadows from both games — now use BaseScene.gameOver() which plays sound and emits event to React**

**Files**: `src/components/games/phaser/AgentChase/scenes/GameScene.ts`, `src/components/games/phaser/RhythmHacker/scenes/GameScene.ts`

### 19. CloudJumper: Menu Background Override Bug

**Issue (Re-verified 31 March)**: `CloudJumperMenuScene.create()` at line 20 sets `this.cameras.main.setBackgroundColor(0x87ceeb)` (sky blue) BEFORE calling `super.create()` at line 21. The shared `MenuScene.create()` (MenuScene.ts line 36-37) calls `this.createMatrixBackground()` which calls `this.cameras.main.setBackgroundColor(MATRIX_COLORS.BACKGROUND)` (BaseScene.ts line 250), immediately overriding the sky-blue colour. The menu displays with a black background instead of the intended sky-blue theme.

**Fix**:
- [x] Moved `setBackgroundColor(0x87ceeb)` to after `super.create()` so it overrides the Matrix black background
- [x] Test: TypeScript compiles, build passes

> **RESOLVED: Background colour now applied after super.create() — sky-blue menu displays correctly**

**Files**: `src/components/games/phaser/CloudJumper/scenes/MenuScene.ts`

### 25. Save System Missing Phaser Game IDs (NEW)

**Issue (Found via code verification — 31 March)**: `GlobalSaveData.games` interface in `useSaveSystem.ts` (lines 120-131) only has 10 game IDs — 6 active React games plus 4 legacy games (`crossyRoad`, `matrixAscension`, `agentEscape`, `jimmyMatrix`). The 5 Phaser games pass their IDs (`matrixFrogger`, `neoJump`, `agentChase`, `rhythmHacker`, `cloudJumper`) via PhaserGame.tsx's `gameId` prop, but these IDs are NOT in the `GlobalSaveData.games` interface.

This means:
- High scores for Phaser games may not persist correctly
- Achievement unlocks via `unlockSaveAchievement(gameId, ...)` may silently fail
- `GAME_ACHIEVEMENTS` dictionary has no entries for any Phaser game — their achievements are defined in per-game config.ts files but never registered centrally

Additionally, the `GAME_ACHIEVEMENTS` dictionary contains achievement entries for the 4 legacy games that have been removed from the UI.

**Fix**:
- [x] Added `matrixFrogger`, `neoJump`, `agentChase`, `rhythmHacker`, `cloudJumper` to `GlobalSaveData.games` interface
- [x] Legacy game IDs kept in interface for migration compatibility, legacy achievements removed from `GAME_ACHIEVEMENTS` (replaced by Phaser equivalents)
- [x] Added all 42 Phaser game achievements to `GAME_ACHIEVEMENTS` (10 MatrixFrogger, 8 NeoJump, 8 AgentChase, 9 RhythmHacker, 7 CloudJumper)
- [x] Added 1.1.0→1.2.0 migration that copies high scores from legacy game IDs to Phaser equivalents
- [x] Updated `createDefaultGlobalSave()` with Phaser game entries
- [x] Updated tests to reflect version 1.2.0 — all 55 tests pass

> **RESOLVED: Save system now supports all 5 Phaser games with full achievement tracking and migration from legacy data**

**Files**: `src/hooks/useSaveSystem.ts`, `src/hooks/useSaveSystem.test.ts`

---

## P2 - Medium Priority (Quality & Testing)

All P2 bugs resolved. Remaining open items are cosmetic/tooling only.

### 9. Phaser Game Preview Images All Show CTRL-S Placeholder

**Issue (Verified 31 March)**: App.tsx — all 5 Phaser games use the same hardcoded Cloudinary URL pointing to the CTRL-S World preview image (`ctrlsthegame_m1tg5l.png`). Each game should have its own preview.

**Fix**:
- [ ] Take or generate preview screenshots for each Phaser game
- [ ] Update the `preview` field for Matrix Frogger, Neo Jump, Agent Chase, Rhythm Hacker, Cloud Jumper in App.tsx

**Files**: `src/App.tsx`

### 13. Legacy E2E Screenshots Cleanup

**Issue**: `e2e/screenshots/` contains 54+ orphaned screenshots from replaced/removed games:
- `terminal-quest-*.png` (10 files) — game removed entirely
- `agent-escape-*.png` (10 files) — replaced by Agent Chase (Phaser)
- `ascension-*.png` (9 files) — replaced by Neo Jump (Phaser)
- `crossy-road-*.png` (8 files) — replaced by Matrix Frogger (Phaser)
- `jimmy-matrix-*.png` (10 files) — replaced by Rhythm Hacker (Phaser)
- `cloud-*.png` (7 files) — duplicate of `cloud-jumper-*.png` set (inconsistent naming)
- `saveload-area.png` — stale

**Fix**:
- [ ] Remove all orphaned screenshots listed above
- [ ] Verify remaining 130+ screenshots are current and correctly named

**Files**: `e2e/screenshots/`

---

## P2.5 - New Features (In Progress)

### 14. Game Categories System (COMPLETE)

Added `GameCategory` type (`Arcade | Puzzle | Shooter | Story | Rhythm | Classic`) with:
- Category field on all 11 games in App.tsx and LandingPage.tsx
- Filter tabs on LandingPage (filter by category with counts)
- Category badge on each game card
- Grouped side nav with category headers
- Category badge in carousel portal view

**Files**: `src/types/game.ts`, `src/App.tsx`, `src/components/LandingPage.tsx`

### 15. Epic Snake Enhancement (PLANNED)

Transform Snake Classic into a flagship game with 3 modes:

- **Classic Mode** - existing gameplay with visual enhancements
- **Matrix Mode** - firewall obstacles, Agent Smith enemies, bullet time power-up
- **Hacker Mode** - sequence collection (collect 1-0-1-0 in order), decryption puzzles

Visual enhancements (all modes):
- Matrix rain background, particle trails, death animation
- Food spawn animation, screen shake, combo counter
- Level system with progressive difficulty
- Boss encounters every 5 levels
- Mini-map for larger grids (levels 6+)

Achievements expanded from 7 to 16+.

**Files**: `src/hooks/useSimpleSnakeGame.ts`, `src/components/games/SimpleSnake.tsx`, `src/hooks/useSaveSystem.ts`

### 16. Code Breaker - New Flagship Game (PLANNED)

Brick breaker meets Matrix. Break through a wall of code to escape. React Canvas, 800x600.

- Code bricks (1HP green, 2HP yellow, 3HP red) arranged as code patterns
- Agent Smiths spawn from broken bricks, move downward - dodge or shoot
- 6 power-ups: Multi-ball, Wide Paddle, Laser, Bullet Time, Firewall, EMP
- Level progression: simple rows -> code patterns -> boss bricks
- Win: break through to the portal behind the wall
- 10 achievements

**Files (new)**: `src/hooks/useCodeBreakerGame.ts`, `src/components/games/CodeBreaker.tsx`

### 17. Gameplay E2E Test Suite (PLANNED)

Upgrade Playwright tests from visual-regression-only to actual gameplay testing that catches bugs and edge cases. Current tests press random keys and take screenshots — new tests send deliberate inputs, observe game state, and assert correct behavior.

**Phase 1 — Test Seams (~25 lines, gated behind `window.__TEST__`)**

Add `exposeTestState()` to `BaseScene.ts` — writes game state (score, lives, health, combo, etc.) to `window.__PHASER_GAME_STATE__` each frame when `__TEST__` flag is set. Each Phaser GameScene calls it at end of `update()`. React games get `data-game-phase` and `data-score` attributes on root divs. `PhaserGame.tsx` exposes game instance on `window.__PHASER_GAME__` in test mode.

Source changes:
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

**Phase 2 — Test Infrastructure**

- [ ] `e2e/fixtures/test-utils.ts` (new) — `enableTestMode()`, `getPhaserState()`, `getReactGamePhase()`, `getReactScore()`, `waitForPhaserState()`, `waitForScore()`, `waitForGameOver()`, `waitForPhaserScene()`, `ensurePhaserFocus()`, `loseFocus()`, `recoverFocus()`
- [ ] `e2e/fixtures/game-helpers.ts` (new) — per-game action functions: `startPhaserGame()`, `moveSnake()`, `triggerSnakeDeath()`, `dropPiece()`, `shootInvader()`, `flap()`, `movePaddle()`, `hopForward()`, `moveInMaze()`, `selectTrack()`, `hitNotes()`, `jump()`, etc.
- [ ] `e2e/fixtures/arcade.fixture.ts` — add `gameplayPage` fixture with auto-enabled test mode
- [ ] `package.json` — add `"test:gameplay": "npx playwright test e2e/gameplay/"` script

**Phase 3 — Gameplay Test Specs (76 tests across 12 files)**

Priority 1 — High Bug Surface Area (33 tests):
- [ ] `e2e/gameplay/snake.gameplay.spec.ts` (8 tests) — score on food, wall death, self-collision death, pause/resume, direction changes, restart, full lifecycle, focus loss/recovery
- [ ] `e2e/gameplay/agent-chase.gameplay.spec.ts` (10 tests) — dot collection scoring, lives decrease on collision, game over on all lives lost, power pellet frightens agents, pause/resume, ESC exit, focus loss overlay, focus recovery, full lifecycle
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

**Reliability Strategy**

| Problem | Solution |
|---------|----------|
| Phaser canvas can't be DOM-queried | `window.__PHASER_GAME_STATE__` test seam |
| Random spawning | Test behaviors ("score increased") not positions |
| Timing sensitivity | `page.waitForFunction()` polling, not fixed timeouts |
| Focus management | `ensurePhaserFocus()` before every Phaser keyboard test |
| Long games (Rhythm Hacker) | `test.setTimeout(60000)` for health-drain tests |

**Expected Result**: 76 new gameplay tests across 12 spec files, covering all 11 games + cross-game edge cases. Total E2E coverage grows from ~116 to ~192 tests.

---

## P3 - Low Priority (Future Enhancements)

### Feature Enhancements

**Audio**:
- Rhythm Hacker: Actual audio file playback synchronised with notes
- Rhythm Hacker: Latency calibration option for different hardware
- Agent Chase: Continuous background siren (requires looping sound system)

**Gameplay**:
- Rhythm Hacker: Seed-based note generation for leaderboard fairness
- Rhythm Hacker: Replay recording/playback
- Agent Chase: Intermission screens between levels
- Agent Chase: Demo mode on menu (AI plays)
- All games: Difficulty level selector at game start
- All games: Tutorial overlay for first-time players
- MatrixFrogger: JustDown + isMoving guard swallows key presses during 150ms hop animation — consider input buffering
- NeoJump: Space key fires projectile AND activates jetpack simultaneously — clarify or separate these actions
- CloudJumper: Redundant jump input (SPACE polled via JustDown, UP/W via event callback) — consolidate

**Visual Polish**:
- Cloud Jumper: Visual style is bright blue sky - consider adding Matrix-green tinting for consistency with arcade aesthetic

### Code Quality (Future)

- [ ] Neo Jump: Consolidate redundant altitude state variables
- [ ] Extract collision detection logic into reusable utility
- [ ] Add error boundaries around game components
- [ ] Consider code-splitting to reduce 2.18MB bundle size
- [ ] Improve E2E test reliability with explicit wait conditions instead of timeouts
- [ ] Remove `console.warn` statements from production code (useSoundSystem ×5, useShatnerVoice ×1, useAdvancedVoice ×1, useLifelineManager ×1)
- [ ] MatrixCloud: Fix `window.setTimeout()` cast to `unknown as number` — use `useRef` for timer IDs
- [ ] MatrixCloud: Remove dead code `BOSS_TYPES` constant (suppressed by eslint-disable)
- [ ] MatrixCloud: Review 2 eslint-disable comments (`@typescript-eslint/no-unused-vars` line 26, `react-hooks/exhaustive-deps` line 1248)
- [ ] useAchievementManager: Fix `saveGame`/`loadGame` passthrough (properties don't exist on useSaveSystem return value)
- [ ] useAchievementManager: Fix unreachable custom notification path (`unlockAchievement` returns void, so `if (success)` is always falsy)
- [ ] useSaveSystem: Fix `unlockAchievement` mutating prev state directly inside `setSaveData` updater (violates React immutability contract)
- [ ] useParticleSystem: Consider switching from React state to refs for per-frame particle positions (avoids re-render per frame); also RAF loop runs even with zero particles
- [ ] useSoundSynthesis: Close AudioContext on unmount (currently leaks); `crash` drum type has no implementation
- [ ] useProceduralAudio: Close AudioContext on unmount (currently leaks); `generateAdaptiveMusic` returns unscheduled sequence
- [ ] useObjectPool: `acquire` uses O(n) Array.find scan — consider free-list for hot-path performance
- [ ] useAdvancedVoice: AudioContext analyser never receives speech output (getVisualizationData returns zeroes)
- [ ] usePerformanceMonitor: FPS stats never updated when overlay is hidden
- [ ] useViewportCulling: `cullObjects` mutates `visible` property on input objects (side effect)
- [ ] MatrixCloud: `updateGame` calls `setState` inside RAF every frame — should use ref-dispatch pattern like VortexPong/MatrixInvaders
- [ ] CtrlSWorld: Pause is a separate `isPaused` boolean, not a `GamePhase` enum value — creates ambiguous compound states
- [ ] SimpleSnake: `achievementManager` prop accepted but aliased to `_achievementManager` and never used — all achievements go through useSaveSystem only
- [ ] useSimpleSnakeGame: `_isSnakeCollision` method defined but never called — dead code (collision check is inlined)
- [ ] useSoundSystem: `updateConfig` closes over stale `config` — rapid successive calls overwrite each other (should use functional updater)
- [ ] useGameLoop: No deltaTime capping — backgrounded tab delivers a massive deltaTime spike on focus
- [ ] Metris: `getWallKickOffsets` ignores its `rotation` parameter — potential incorrect wall kicks
- [ ] useAchievementManager: Duplicate notification bug — custom notification + useEffect both push notifications for the same unlock
- [ ] App.tsx/LandingPage.tsx: Game data duplicated in two arrays — should share a central data source

### Testing Improvements

- [ ] ~~Add `window.__TEST__` test seams to Phaser games~~ — Moved to P2.5 #17 (Gameplay E2E Test Suite)
- [ ] ~~Verify Cloud and CTRL-S World game over triggering in E2E tests~~ — Covered by P2.5 #17
- [ ] ~~Fix Rhythm Hacker E2E screenshots - most capture countdown phase not actual gameplay~~ — Covered by P2.5 #17
- [ ] Complete PWAUpdatePrompt.test.tsx `.todo()` test (module caching limitation)
- [ ] Complete SaveLoadManager.test.tsx `.todo()` tests (loading indicator, error message)
- [ ] Fix landing page scroll position tests — landing-top/middle/bottom all capture identical viewport
- [ ] Fix card-play.png screenshot — crop region captures only a sliver of text (1,196 bytes vs 80-130KB for other card screenshots)

---

## Architecture Notes

### Hooks Available (use these, do not reinvent)

**Core Game Hooks (17 total):**
- `useGameLoop` - RAF with delta time, auto-cleanup
- `useSoundSystem` - Standard SFX library with 25+ predefined effects including reverb
- `useSoundSynthesis` - Procedural audio (synthLaser, synthExplosion, etc.)
- `useSaveSystem` - High scores, achievements, game stats, export/import with version migration
- `useAchievementManager` - Achievement notifications and tracking
- `useParticleSystem` - Pooled particle effects with 6 types, max 500 particles
- `useObjectPool` - Memory-efficient object reuse with pre-configured pools
- `useViewportCulling` - Off-screen object culling with spatial grid support
- `usePerformanceMonitor` - FPS tracking, draw calls, optimisation suggestions
- `useInterval` - Declarative setInterval with React lifecycle
- `usePowerUps` - Power-up management (4 types)
- `useMobileDetection` - Device type detection (mobile/tablet/desktop/touch)
- `useProceduralAudio` - Engine sounds, collisions, adaptive music by mood
- `useShatnerVoice` - Dramatic TTS for CtrlSWorld
- `useAdvancedVoice` - Multiple personas with SSML
- `useLifelineManager` - Puzzle lifeline system for CTRL-S World
- `useSimpleSnakeGame` - Complete snake game logic

### State Machine Pattern (all games MUST follow)

```typescript
type GamePhase = 'menu' | 'playing' | 'paused' | 'gameOver';
const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
```

### Required Keyboard Shortcuts

| Key | Action | Required |
|-----|--------|----------|
| ESC | Exit to menu | Yes (App-level) |
| P | Pause/resume | Yes |
| R | Restart | Yes |
| ENTER | Start game | Yes |
| SPACE | Start game / primary action | Yes (MenuScene + GameOverScene) |
| Arrow keys | Primary movement | Yes |
| WASD | Alt movement | Recommended |
| M | Toggle mute | Recommended |

### Required Props Interface

```typescript
interface GameProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;  // Default: false
  autoStart?: boolean; // Default: false - skips menu when true
}
```

### Phaser Game Structure

```
src/components/games/phaser/[GameName]/
├── index.tsx          # React wrapper
├── config.ts          # Phaser config and constants
└── scenes/
    ├── BootScene.ts   # Asset generation (procedural textures)
    ├── MenuScene.ts   # Game-specific menu
    ├── GameScene.ts   # Core gameplay
    └── GameOverScene.ts
```

### Reference Implementations

- **Grid-based movement:** SimpleSnake.tsx / useSimpleSnakeGame.ts
- **Canvas rendering + physics:** VortexPong.tsx
- **Object pooling:** MatrixInvaders.tsx
- **Scrolling obstacles:** MatrixCloud.tsx
- **Timing-based gameplay:** Metris.tsx
- **Ghost AI (Pacman-style):** AgentChase GameScene.ts
- **Rhythm game timing:** RhythmHacker GameScene.ts
- **Phaser + React integration:** src/lib/phaser/PhaserGame.tsx
- **Ref-based game loop (avoids stale closures):** MatrixInvaders.tsx (best practice for complex state)

### Working Game Patterns (from analysis of all 4 React games)

| Pattern | Best Practice | Anti-Pattern |
|---------|--------------|--------------|
| Game loop keyed to | `[state.gamePhase]` only | `[state, updateGame, render]` (tears down every frame) |
| Key tracking | `keysRef = useRef<Set<string>>()` | `useState(keyboardControls)` (re-renders per keypress) |
| Per-frame data | Refs mutated in loop, state set only for UI | `useState` per variable (3+ setState per frame) |
| Game loop callbacks | Stable refs synced every render | Inline functions as useGameLoop argument |
| Reset game | Single consolidated `setState` call | 10+ separate `setState` calls |
| Sound guard | Wrapper `useCallback` checking `isMuted` | Inline `if (!isMuted)` at every call site |
| Save on game over | `setTimeout` debounce (100ms) | Direct `updateGameSave` in tight loop |
| State hooks | 1-2 consolidated `GameState` objects | 14 individual `useState` hooks |

---

## Troubleshooting

### Games Appear Frozen / Press Enter Not Working

1. **Click on game canvas**: Phaser games need focus - click inside the game area (look for green glow)
2. **Hard refresh browser**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
3. **Restart dev server**: `pkill -f vite && npm run dev`
4. **Clear browser cache**: DevTools (F12) → Application → Storage → "Clear site data"
5. **Try incognito window**: Ensures no cached code is used
6. **Check console for errors**: DevTools (F12) → Console tab

### Test Suite Memory Constraints

The full test suite requires significant memory. On memory-constrained systems:
```bash
# Run with increased heap memory
NODE_OPTIONS=--max-old-space-size=8192 npm test -- --run

# Or run specific test files
npm test -- --run src/hooks/useSaveSystem.test.ts
npm test -- --run src/components/games/
```

### E2E Test Local Run

```bash
# Run specific failing tests
npx playwright test e2e/visual/games/jimmy-matrix.spec.ts

# Run all game E2E tests
npx playwright test e2e/visual/games/

# Update snapshots after visual changes
npx playwright test --update-snapshots
```

### Missing Baseline Screenshots

If an E2E test fails because a baseline screenshot is missing:
```bash
# Generate missing baseline
npx playwright test --update-snapshots e2e/visual/games/jimmy-matrix.spec.ts

# Or copy from test-results
cp test-results/<folder>/test-failed-1.png e2e/screenshots/<expected-name>.png
```

---

## Current State Summary

- **Games Implemented**: 11 playable + 1 planned (Code Breaker)
- **Game Categories**: 6 categories (Arcade, Classic, Shooter, Puzzle, Story, Rhythm) with filter UI
- **Phaser Games**: 5 (Matrix Frogger, Neo Jump, Agent Chase, Rhythm Hacker, Cloud Jumper)
- **React/Canvas Games**: 6 (CTRL-S World, Snake Classic, Vortex Pong, Matrix Cloud, Matrix Invaders, Metris)
- **Achievement System**: 79 total achievements (72 game-specific + 7 global) — all Phaser game achievements registered in GAME_ACHIEVEMENTS (#25 resolved)
- **Save System**: All 5 Phaser game IDs registered in GlobalSaveData.games interface (#25 resolved)
- **Open Bugs**: 0 P0, 0 P1, 0 P2 bugs — only P2.5 features and P3 enhancements remain
- **Hooks Library**: 17 shared hooks
- **Visual Consistency**: Matrix theme throughout (green-on-black, glow effects, CRT aesthetic)
- **E2E Coverage**: 91+ tests across 15 spec files (11 games + landing + settings + modals + achievements) — all 11 games covered, last run passed
- **Code Quality**: 0 TODO/FIXME/HACK, 0 `as any`, 0 unguarded console.log, game lists consistent between App.tsx and LandingPage.tsx

### Game Status Table

| Game | Category | Type | Status | Notes |
|------|----------|------|--------|-------|
| CTRL-S The World | Story | React | ✅ Working | 5-chapter narrative adventure |
| Snake Classic | Arcade | React | ✅ Working (🔵 enhancement planned) | Adding 3 modes, visual overhaul |
| Vortex Pong | Classic | React | ✅ Working | Focus restored on phase transitions + Space key support (#26 resolved) |
| Matrix Cloud | Arcade | React | ✅ Working | Flappy Bird variant (setState-per-frame pattern) |
| Matrix Invaders | Shooter | React | ✅ Working | Test fragility fixed (#20), keyboard useEffect stabilised (#24) |
| Metris | Puzzle | React | ✅ Working | Tetris with bullet time |
| Matrix Frogger | Arcade | Phaser | ✅ Working | MAGNET_COLLECTOR achievement implemented (#23); save system fully registered (#25) |
| Neo Jump | Classic | Phaser | ✅ Working | Save system fully registered (#25) |
| Agent Chase | Classic | Phaser | ✅ Working | gameOver() shadow removed (#18); save system fully registered (#25) |
| Rhythm Hacker | Rhythm | Phaser | ✅ Working | gameOver() shadow removed (#18); Space key added (#10); array reset fixed (#22) |
| Cloud Jumper | Arcade | Phaser | ✅ Working | Menu bg override fixed (#19); bounceStreak resets on storm hits (#21) |
| Code Breaker | Shooter | React | 🔵 Planned | Brick breaker — new flagship game |

---

## Phaser Skill Reference

Before making changes to Phaser games, always read:
1. `.claude/skills/phaser-gamedev/SKILL.md` - Core patterns and architecture
2. `.claude/skills/phaser-gamedev/references/spritesheets-nineslice.md` - MEASURE sprites before loading
3. `.claude/skills/phaser-gamedev/references/arcade-physics.md` - Physics configuration

---

*Updated on 31 March 2026 — All P2 items resolved: #8 (OOM), #10 (Space key), #11 (memory leak), #20 (test fragility), #21 (bounceStreak), #22 (array reset), #23 (MAGNET_COLLECTOR), #24 (keyboard useEffect), #26 (VortexPong focus)*
*Build: PASSES (2.18MB bundle)*
*TypeScript: CLEAN (0 errors)*
*Unit Tests: ~1,607 tests across 48 files — OOM fixed (NODE_OPTIONS=--max-old-space-size=8192 in package.json)*
*E2E Tests: 91+ tests across 15 spec files (11 games + 4 UI) — all 11 games covered, last run passed*
*Code Quality: 0 TODO/FIXME/HACK, 0 `as any`, 0 unguarded console.log, 2 eslint-disable (MatrixCloud), 6 @ts-expect-error (test files only)*
*Screenshots: 187 files in e2e/screenshots/ — 54+ orphaned from removed/renamed games (#13)*

---

<details>
<summary>Archive — Completed Items (March 2026)</summary>

### P0 - Critical (All Resolved)
1. ✅ Phaser focus timing race condition — fixed with `game.events.once('ready')`
2. ✅ Explicit keyboard config — all 5 Phaser games have `input: { keyboard: true }`
3. ✅ VortexPong keyboard handler race condition — uses refs for stable handlers
4. ✅ All Phaser games keyboard controls verified working
5. ✅ Phaser focus loss — onMouseEnter auto-refocus + click-to-play overlay
6. ✅ VortexPong freeze on Enter — ref-based game loop, consolidated state
7. ✅ Phaser pause overlay — shared showPauseOverlay/hidePauseOverlay in BaseScene

### P1 - High Priority (Resolved)
7b. ✅ CloudJumper isGameOver guard — functionally resolved via scene transition architecture
8. ✅ Rhythm Hacker countdown health drain — countdown guard, frame-rate-independent timing
9. ✅ Cloud Jumper cloud generation — decoupled from player.x, continuous generation
10. ✅ Agent Chase HUD display bugs — defensive cleanup, larger font, dynamic values
11. ✅ GameOverScene Space key + high score — Space binding added, highScore passed
12. ✅ Focus visual indicator for ALL games (green glow)
13. ✅ Rhythm Hacker bugs (double notes, memory leaks, penalty, health clamping, lane variety)
14. ✅ MatrixInvaders timestamp bug — consistent Date.now() time base
15. ✅ Phaser scene cleanup — shutdown() methods added
16. ✅ E2E test coverage for all 5 Phaser games (56 tests total)
17. ✅ AgentChase null safety — smithAgent reference guard
18. ✅ NeoJump fuel clamping — jetpack fuel clamped to 0
19. ✅ Accessibility — ARIA labels on carousel, nav, buttons
20. ✅ ESLint cleanup — 17 unused directives fixed
21. ✅ Matrix Arcade skill created
22. ✅ Game Categories System — 6 categories with filter UI
23. ✅ Rhythm Hacker shutdown removeAllKeys — already present at GameScene.ts:872

### P2 - Medium Priority (Resolved)
24. ✅ Missing E2E baseline screenshot (jimmy-matrix-gameover)
25. 🟡 Cloud Jumper E2E carousel timing (minor, doesn't affect gameplay)
26. ✅ Unit Tests OOM (#8) — Added `NODE_OPTIONS=--max-old-space-size=8192` to `test` script in package.json
27. ✅ RhythmHacker MenuScene Space key (#10) — Added Space key binding alongside Enter in `setupInput()`
28. ✅ usePowerUps memory leak (#11) — Tracked timeout IDs in `timeoutIdsRef`, cleared on unmount via useEffect cleanup
29. ✅ MatrixInvaders test fragility (#20) — Changed `getByText(/MOVE/i)` (and FIRE, PAUSE) to `getAllByText(...).length > 0` at all 3 locations
30. ✅ CloudJumper bounceStreak (#21) — Storm cloud hits now reset `bounceStreak = 0`; BOUNCE_STREAK requires 10 consecutive clean bounces
31. ✅ RhythmHacker arrays not reset (#22) — Added `this.laneBackgrounds = []`, `this.keyIndicators = []`, `this.recentLanes = []` at start of GameScene `create()`; `this.trackButtons = []` at start of MenuScene `create()`
32. ✅ MatrixFrogger MAGNET_COLLECTOR (#23) — Increments `magnetCollected` on red pill collection while magnet active; unlocks at >= 5
33. ✅ MatrixInvaders keyboard useEffect (#24) — Reads from `stateRef.current`/`gamePhaseRef.current`; stable `fireBulletRef`/`resetGameRef`/`startGameRef`; dependency array is `[]`
34. ✅ VortexPong focus (#26) — `onMouseEnter` auto-refocus; focus useEffect depends on `[gamePhase]`; Space key added as alternative to Enter

</details>
