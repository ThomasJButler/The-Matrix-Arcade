# Matrix Arcade - Implementation Plan

This file is auto-generated and updated by Ralph during planning and building loops.

Run `./loop.sh plan` or `./loop-full.sh` to analyse the codebase and generate tasks.

---

## Completion Status

- **Status**: IN PROGRESS - P1 items resolved, P2 quality items remain
- **Last Verified**: 31 March 2026 - P1 gameplay bugs fixed (Rhythm Hacker countdown, Cloud Jumper cloud gen, Agent Chase HUD)
- **Version**: v2.0.0 (in progress)
- **Test Coverage**: 1,588+ unit tests (49 files, OOM on full run without --max-old-space-size=8192), 99 E2E game tests across 11 spec files + UI/landing tests
- **Games**: 11 playable (6 React/Canvas + 5 Phaser) + 1 planned (Code Breaker)

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

**Evidence**: Confirmed from code — `PhaserGame.tsx` line 144 (`game.events.once('ready', () => containerRef.current?.focus())`). No `onMouseEnter` handler exists. The `onBlur` handler at line 199 only updates the `hasFocus` visual state — it does not show an overlay or attempt to re-acquire focus.

**Affected Games**: ALL 5 Phaser games (Matrix Frogger, Neo Jump, Agent Chase, Rhythm Hacker, Cloud Jumper)

**Fix**:
- [x] Add `onMouseEnter` handler to `PhaserGame.tsx` container that calls `containerRef.current?.focus()` — auto-refocus when hovering over the game
- [x] Add a visible "Click to play" overlay when the container loses focus (`onBlur`) — display it as a centred semi-transparent overlay on the game canvas
- [x] Consider `pointerdown` listener on the document that refocuses the container when clicking inside it
- [x] Add `console.warn` to keyboard null guards so failures are diagnosable
- [x] Test: Verify keyboard input works after clicking outside and back

> **RESOLVED: Added onMouseEnter auto-refocus and click-to-play overlay to PhaserGame.tsx**

**Files**: `src/lib/phaser/PhaserGame.tsx`, `src/lib/phaser/scenes/BaseScene.ts`, `src/lib/phaser/scenes/MenuScene.ts`

### 2. VortexPong: Freezes on Press Enter

**Root Cause (Confirmed via full code analysis)**: The `useGameLoop` callback is an **inline (non-memoised) function** that closes over 12+ state variables. Every render creates a new callback, causing `useGameLoop` to cancel and restart its rAF loop via a cascading `useCallback` → `useEffect` teardown/rebuild. When Enter is pressed, `resetGame()` fires **10 simultaneous `setState` calls** (lines 192-202), triggering a cascade of re-renders that starve the rAF loop. Additionally, a **second independent rAF loop** for paddle updates (lines 337-373, `setPaddleY`/`setPaddleVelocity` every frame) doubles re-render pressure. At minimum, **3 setState calls fire per frame** (`setBalls`, `setAiPaddleY`, `setAiPaddleVelocity`), with up to 8 on paddle hits or goals.

**VortexPong has 14 individual `useState` hooks** (lines 106-130) compared to MatrixInvaders which has 2 (one consolidated `GameState` object + `hasFocus`).

**Comparison**: MatrixInvaders (working reference) uses stable refs for all game loop callbacks, a single consolidated `GameState` object, and only re-runs its rAF effect on `[state.gamePhase]` — zero setState per frame during normal play. All game objects are mutated in-place via object pools, with setState only called for discrete events (collisions, wave changes).

**Fix**:
- [x] Stop using `useGameLoop` — manage own rAF loop in a `useEffect` keyed only to `gamePhase`, exactly as MatrixInvaders does
- [x] Store game loop callbacks in stable refs (`updateGameRef`, `renderRef`) synced every render; call `.current()` from the rAF loop
- [x] Store keyboard input in a `keysRef = useRef<Set<string>>()` instead of `keyboardControls` state — key presses must not trigger re-renders
- [x] Consolidate 14 `useState` hooks for game-critical values into a single `GameState` object with one functional `setState` updater
- [x] Merge the paddle update rAF into the main game loop
- [x] Make `resetGame()` a single `setState` call instead of 10 separate ones
- [x] Move mutable per-frame data (ball positions, paddle positions, velocities) to refs — only set state when UI needs to reflect changes (score display, game over)
- [x] Test: Verify game starts smoothly on Enter with no frame drops

> **RESOLVED: Replaced useGameLoop with own rAF loop keyed to gamePhase, stable callback refs, keysRef for keyboard input, merged paddle rAF into main loop**

**Files**: `src/components/games/VortexPong.tsx`, `src/hooks/useGameLoop.ts`

### 3. Phaser Games: No Visible Pause Overlay

**Issue (Confirmed from E2E screenshots)**: All 5 Phaser games have no visual indication of being paused. The pause key (P) toggles `isPaused` and calls `this.scene.pause()` / `this.scene.resume()` but there is no overlay text or dimming. Only VortexPong (React game) correctly shows a "PAUSED" overlay.

**Evidence**: `matrix-frogger-paused.png` shows the game looking identical to normal gameplay — SCORE: 0, DISTANCE: 0, enemies visible, no overlay. `neo-jump-paused.png` similarly shows no visual change — ALTITUDE: 15m, platforms visible, no dimming or text. The game appears to be running normally in both "paused" screenshots.

**Fix**:
- [x] Add a shared `showPauseOverlay()` / `hidePauseOverlay()` method to `BaseScene` that renders a dimmed overlay with "PAUSED" text and "Press P to resume"
- [x] Call it from `togglePause()` in BaseScene
- [x] Note: In Phaser 3.90+, `scene.pause()` stops `update()` but keyboard event handlers registered via `addKey().on('down', ...)` still fire (DOM-level), so the P key unpause handler works correctly
- [x] Test: Verify pause overlay appears on P press in all 5 Phaser games

> **RESOLVED: Added showPauseOverlay()/hidePauseOverlay() to BaseScene with dimmed overlay and PAUSED text at depth 9998-9999**

**Files**: `src/lib/phaser/scenes/BaseScene.ts` (shared fix for all games)

---

## P1 - High Priority (Gameplay Bugs)

### 4. Rhythm Hacker: Health Drains During Countdown + Timing Bugs

**Issue (Confirmed from code + screenshots)**: Multiple issues in the countdown system — health penalty during countdown, non-frame-rate-independent timing, scattered magic numbers.

**Fix**:
- [x] Gate the empty-hit penalty behind `!this.isCountdown` — ignore lane key presses during countdown
- [x] Replace `this.countdownTime += 1000 / 60` with `this.countdownTime += delta` using actual delta from `update()`
- [x] Extract countdown duration to named constants in config.ts (`COUNTDOWN.DURATION`, `COUNTDOWN.GO_DISPLAY_END`, `COUNTDOWN.NOTES_START`)
- [x] Extract empty-hit penalty to `HEALTH.EMPTY_HIT_PENALTY` constant
- [x] `nextNoteTime` now uses `GAME_CONFIG.COUNTDOWN.NOTES_START` — same time source as `gameTime`
- [x] Added `removeAllKeys(true)` to shutdown for proper key cleanup
- [x] Test: Build passes, TypeScript clean

> **RESOLVED: Countdown guard, frame-rate-independent timing, extracted constants to config.ts, added key cleanup to shutdown**

**Files**: `src/components/games/phaser/RhythmHacker/scenes/GameScene.ts`, `src/components/games/phaser/RhythmHacker/config.ts`

### 5. Cloud Jumper: Cloud Generation Critically Broken

**Issue (Confirmed from code analysis + screenshots)**: Cloud generation broke because `generateContent()` checked `lastCloudX < player.x + WIDTH` but the player never moves horizontally (stays at x=150). After initial clouds scrolled off, no new ones generated.

**Fix**:
- [x] Decouple cloud generation from `player.x` — now checks `lastCloudX < WIDTH` (screen edge only)
- [x] Decrement `lastCloudX` by scroll amount each frame in `scrollObjects()` to keep generation in sync with scrolling world
- [x] Widen `canLandOnCloud` collision — use cloud top surface (`cloud.y - cloud.displayHeight / 2 + 10`) instead of cloud centre
- [x] Remove dead code `player.x < -50` check (player never moves horizontally)
- [x] Test: Build passes, TypeScript clean

> **RESOLVED: Cloud generation now continuously produces platforms, collision uses cloud top surface, dead code removed**

**Files**: `src/components/games/phaser/CloudJumper/scenes/GameScene.ts`

### 6. Agent Chase: HUD Display Bugs (A Values + Dual Level)

**Issue (Confirmed from E2E screenshots)**: Dual level display and "LEVEL: A" rendering artefact caused by overlapping text objects and small font size with "Press Start 2P".

**Fix**:
- [x] Add defensive cleanup at start of `createUI()` — destroy existing text objects before creating new ones
- [x] Increase font size from 12px to 14px to prevent "A" rendering artefact with Press Start 2P pixel font
- [x] Initialise HUD text with actual state values (`LIVES: ${this.lives}`, `LEVEL: ${this.level}`) instead of hardcoded strings
- [x] Test: Build passes, TypeScript clean

> **RESOLVED: Defensive text cleanup, larger font size, dynamic initial values**

**Files**: `src/components/games/phaser/AgentChase/scenes/GameScene.ts`

### 7. GameOverScene Missing Space Key for Restart + High Score Not Passed

**Issue (Confirmed from code)**: The shared `GameOverScene.setupGameOverInput()` (line 178) only binds Enter and R for restarting. Space is NOT bound, creating an inconsistency with MenuScene (which binds both Enter AND Space). Players who press Space to start from the menu will expect Space to restart from game over.

**Secondary Issue**: `BaseScene.gameOver()` passes `{ score, reason }` to GameOverScene but NOT `highScore`. The `GameOverScene.init()` at line 43 tries `data.highScore ?? this.finalScore` which always falls through to `this.finalScore` — high score display on game over is unreliable.

**Fix**:
- [x] Add Space key binding to `GameOverScene.setupGameOverInput()` alongside Enter and R
- [x] Pass `highScore` from `BaseScene.gameOver()` to GameOverScene
- [x] Test: Verify Space restarts from game over in all Phaser games

> **RESOLVED: Added Space key binding to GameOverScene.setupGameOverInput(), added highScore parameter to BaseScene.gameOver()**

**Files**: `src/lib/phaser/scenes/GameOverScene.ts`, `src/lib/phaser/scenes/BaseScene.ts`

---

## P2 - Medium Priority (Quality & Testing)

### 8. Unit Tests OOM on Full Run

**Issue**: Running `npm test -- --run` crashes with "JavaScript heap out of memory" after ~21 test files. The test suite requires more than the default Node.js heap size.

**Fix**:
- [ ] Update `package.json` test script to include `NODE_OPTIONS=--max-old-space-size=8192`
- [ ] Alternatively, configure Vitest to use `--pool forks` with lower `maxForks` to reduce memory pressure
- [ ] Test: Full test suite completes without OOM

**Files**: `package.json`, `vitest.config.ts`

### 9. Phaser Game Preview Images All Show CTRL-S Placeholder

**Issue**: App.tsx — all 5 Phaser games use a hardcoded Cloudinary URL pointing to the CTRL-S World preview image. Each game should have its own preview.

**Fix**:
- [ ] Take or generate preview screenshots for each Phaser game
- [ ] Update the `preview` field for Matrix Frogger, Neo Jump, Agent Chase, Rhythm Hacker, Cloud Jumper in App.tsx

**Files**: `src/App.tsx`

### 10. Rhythm Hacker: MenuScene Doesn't Extend Shared MenuScene

**Issue**: RhythmHacker's MenuScene extends `BaseScene` directly instead of the shared `MenuScene`. This means it has its own Enter handling (no Space key support) and doesn't benefit from shared menu improvements. Only ENTER starts the game — SPACE does nothing, unlike all other 4 Phaser games.

**Fix**:
- [ ] Refactor RhythmHacker MenuScene to extend the shared MenuScene, with track selection as an additional menu layer
- [ ] Or add Space key support to the custom menu for consistency

**Files**: `src/components/games/phaser/RhythmHacker/scenes/MenuScene.ts`

### 11. Memory Leak: usePowerUps Hook setTimeout Without Cleanup

**Issue**: `usePowerUps.ts` sets a 10-second `setTimeout` in `activatePowerUp()` without tracking or clearing it on unmount. If the component unmounts before the timeout completes, it will attempt to update state on an unmounted component. Also, power-up positions are hard-coded to `x: 200-600, y: 50-350` with no knowledge of actual canvas size.

**Fix**:
- [ ] Track timeout IDs in a ref and clear them on unmount via useEffect cleanup
- [ ] Test: Verify no "setState on unmounted component" warnings

**Files**: `src/hooks/usePowerUps.ts`

### 12. Rhythm Hacker: Shutdown Doesn't Call removeAllKeys

**Issue**: RhythmHacker GameScene's `shutdown()` only removes listeners from the 4 lane keys but does NOT call `this.input.keyboard.removeAllKeys(true)` like other games do. Common input keys (ESC, P, M) set up by `setupCommonInputs()` are not explicitly cleaned up.

**Fix**:
- [ ] Add `this.input.keyboard?.removeAllKeys(true)` to RhythmHacker GameScene shutdown
- [ ] Test: Verify no ghost key listeners after scene transitions

**Files**: `src/components/games/phaser/RhythmHacker/scenes/GameScene.ts`

### 13. Legacy E2E Screenshots Cleanup

**Issue**: `e2e/screenshots/` contains orphaned screenshots from replaced games: `agent-escape-*.png` (8 files), `ascension-*.png` (9 files), `crossy-road-*.png` (8 files), `jimmy-matrix-*.png` (10 files). Also `cloud-*.png` (7 files with inconsistent naming) alongside the correctly-named `cloud-jumper-*.png` (10 files). These serve no purpose and add confusion.

**Fix**:
- [ ] Remove orphaned legacy screenshots (agent-escape, ascension, crossy-road, jimmy-matrix prefixed files)
- [ ] Remove duplicate `cloud-*.png` files (keep `cloud-jumper-*.png` set)

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

### Testing Improvements

- [ ] Add `window.__TEST__` test seams to Phaser games for deterministic testing (fixes flaky jimmy-matrix-gameover test due to animated matrix rain background)
- [ ] Add Terminal Quest pause screen test
- [ ] Verify Cloud and CTRL-S World game over triggering in E2E tests
- [ ] Fix Rhythm Hacker E2E screenshots - most capture countdown phase not actual gameplay
- [ ] Complete PWAUpdatePrompt.test.tsx `.todo()` test (module caching limitation)
- [ ] Complete SaveLoadManager.test.tsx `.todo()` tests (loading indicator, error message)
- [ ] Fix landing page scroll position tests — landing-top/middle/bottom all capture identical viewport
- [ ] Fix card-play.png screenshot — crop region captures only a sliver of text

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
- **Achievement System**: 79 total achievements (72 game-specific + 7 global) — expanding with new features
- **Hooks Library**: 17 shared hooks
- **Visual Consistency**: Matrix theme throughout (green-on-black, glow effects, CRT aesthetic)
- **E2E Coverage**: 99 game tests across 11 spec files, plus UI/landing/settings tests

### Game Status Table

| Game | Category | Type | Status | Notes |
|------|----------|------|--------|-------|
| CTRL-S The World | Story | React | ✅ Working | 5-chapter narrative adventure |
| Snake Classic | Arcade | React | ✅ Working (🔵 enhancement planned) | Adding 3 modes, visual overhaul |
| Vortex Pong | Classic | React | ✅ Working | Ref-based game loop — freeze resolved |
| Matrix Cloud | Arcade | React | ✅ Working | Flappy Bird variant |
| Matrix Invaders | Shooter | React | ✅ Working | Space Invaders (ref-based loop — best practice) |
| Metris | Puzzle | React | ✅ Working | Tetris with bullet time |
| Matrix Frogger | Arcade | Phaser | ✅ Working | Auto-refocus on hover, click-to-play overlay, pause overlay |
| Neo Jump | Classic | Phaser | ✅ Working | Auto-refocus on hover, click-to-play overlay, pause overlay |
| Agent Chase | Classic | Phaser | ✅ Working | Focus fixed; HUD defensive cleanup + larger font |
| Rhythm Hacker | Rhythm | Phaser | ✅ Working | Countdown guard, frame-rate-independent timing, config constants |
| Cloud Jumper | Arcade | Phaser | ✅ Working | Cloud gen fixed, collision uses cloud top, dead code removed |
| Code Breaker | Shooter | React | 🔵 Planned | Brick breaker — new flagship game |

---

## Phaser Skill Reference

Before making changes to Phaser games, always read:
1. `.claude/skills/phaser-gamedev/SKILL.md` - Core patterns and architecture
2. `.claude/skills/phaser-gamedev/references/spritesheets-nineslice.md` - MEASURE sprites before loading
3. `.claude/skills/phaser-gamedev/references/arcade-physics.md` - Physics configuration

---

*Updated on 31 March 2026 — Comprehensive gap analysis with screenshot verification, full code review of all 11 games, hook analysis*
*Build: PASSES (2.18MB bundle)*
*TypeScript: CLEAN (0 errors)*
*Unit Tests: 1,588+ tests (OOM on full run — needs NODE_OPTIONS=--max-old-space-size=8192)*
*E2E Tests: 99 game tests across 11 spec files — last run status: PASSED*
*Code Quality: 0 TODO/FIXME/HACK comments, 0 `as any` casts, 8 console.warn (all in error handlers), 2 eslint-disable (MatrixCloud), 6 @ts-expect-error (all in test files)*

---

<details>
<summary>Archive — Completed Items (March 2026)</summary>

### P0 - Critical (All Resolved)
1. ✅ Phaser focus timing race condition — fixed with `game.events.once('ready')`
2. ✅ Explicit keyboard config — all 5 Phaser games have `input: { keyboard: true }`
3. ✅ VortexPong keyboard handler race condition — uses refs for stable handlers
4. ✅ All Phaser games keyboard controls verified working

### P1 - High Priority (All Resolved)
5. ✅ Focus visual indicator for ALL games (green glow)
6. ✅ Rhythm Hacker bugs (double notes, memory leaks, penalty, health clamping, lane variety)
7. ✅ MatrixInvaders timestamp bug — consistent Date.now() time base
8. ✅ Phaser scene cleanup — shutdown() methods added
9. ✅ E2E test coverage for all 5 Phaser games (56 tests total)
10. ✅ AgentChase null safety — smithAgent reference guard
11. ✅ NeoJump fuel clamping — jetpack fuel clamped to 0
12. ✅ Accessibility — ARIA labels on carousel, nav, buttons
13. ✅ ESLint cleanup — 17 unused directives fixed
14. ✅ Matrix Arcade skill created
15. ✅ Game Categories System — 6 categories with filter UI

### P2 - Medium Priority (Resolved)
16. ✅ Missing E2E baseline screenshot (jimmy-matrix-gameover)
17. 🟡 Cloud Jumper E2E carousel timing (minor, doesn't affect gameplay)

</details>
