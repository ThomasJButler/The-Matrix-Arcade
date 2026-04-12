# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

---

## Current Status

- **Status**: REBUILDING -- Phaser migration of all React/Canvas games + new features
- **Last Updated**: 12 April 2026 (R5 -- P1 build chunk fixed, codebase cleanup, dead code removed)
- **Version**: v2.0.0 (next target)
- **Games**: 11 playable (6 React/Canvas to rebuild into Phaser, 5 already Phaser) + 1 planned (Code Breaker)
- **Build**: PASSES (code-split, main bundle 370KB, Phaser vendor chunk 1,479KB) -- zero warnings
- **Unit Tests**: 1,899 passing across 53 files, 0 failures, 0 OOM crashes
- **E2E Tests**: 78 gameplay + 110 visual = 188 tests across 27 spec files -- last run PASSED (0 failures, confirmed via `test-results/.last-run.json`)
- **Asset Pipeline**: 0% complete -- `public/assets/` does not exist, all games use procedural textures

### What Was Completed (v1.x to v2.0 prep)

All P0/P1/P2 bugs resolved from v1.x. Test seams added to all games. E2E gameplay specs written (78 tests). Code quality fixes across 20+ hooks and components. Code-splitting reduced main bundle from 2.18MB to 370KB. Shared game registry created. Error boundaries added. Collision utility extracted. 5 Phaser games scaffolded (MatrixFrogger, NeoJump, AgentChase, RhythmHacker, CloudJumper) with full scene architecture. 12 rebuild research docs created in `rebuildingoldgames/plans/`. Asset inventory catalogued in `desiredassets/`. Full details in git history.

### What Was Completed (R5 -- 12 April 2026)

P1 build chunk warning resolved: Phaser extracted to dedicated vendor chunk via `manualChunks` config in vite.config.ts (GameOverScene dropped from 1,490KB to 12KB). Codebase cleanup: moved `playwright` from production to dev dependencies, removed unused `jest` dependency, deleted superseded `e2e/gameplay/invaders.gameplay.spec.ts` (2 tests, replaced by `matrix-invaders.gameplay.spec.ts` with 5 tests), removed dead `_showFiftyFifty` state from PuzzleModal, removed dead code from 3 legacy games (AgentEscape._TUNNEL, JimmyMatrix._getTimingGrade/_timeDiff, MatrixAscension._altitude), extracted PerformanceOverlay from usePerformanceMonitor hook body to module-scope component (fixes remount churn).

Rhythm Hacker visual overhaul: keys changed from D/F/J/K to Q/W/O/P (better hand positioning), countdown reduced from 10s to 5s, entire colour palette converted to Matrix green theme (lane colours now green/cyan/dark-green/light-green; "EASY MODE" label changed from magenta to green; "HEALTH" label from red to green; combo from yellow to cyan; timing grades from gold/green/blue/red to cyan/green/dim-green/dim-red; hit effects, double note indicator, health bar, and time warning all updated). Lane width widened from 80px to 100px with increased spacing for better play area fill. E2E specs and helpers updated for new key bindings. Cloud Jumper fixes: player sprite recoloured from blue to Matrix green, death texture added (glitch/dissolve effect with X-eyes instead of unrecognisable red-tinted blob), preview image changed from sky-blue to Matrix green. Rhythm Hacker preview changed from magenta to green-cyan. Matrix Frogger fixes: score now awards points on every forward step (was only on personal-best rows), player scale increased from 0.8 to 1.0 for better visibility.

### What Was Completed (R4 -- 12 April 2026)

Seven P1 bugs fixed: Metris bullet time B key wired up (was dead code, now manually activatable with neos_apprentice achievement reachable). Matrix Cloud pipe collision now prevents scoring on hit (removes redundant failsafe, adds sentinel boss achievement). CTRL-S World save crash fixed (unlockAchievement fallback now uses createDefaultGameSave() instead of incomplete partial object). SimpleSnake achievement toasts restored (achievementManager prop destructured and dual-call pattern applied to all 7 achievement sites). Mute state divergence fixed (PhaserGame.tsx now calls useSoundSystem.toggleMute() when Phaser M key event fires, keeping React in sync). Fragile positional array coupling in App.tsx replaced with keyed GAME_BINDINGS record (game registry entries now have stable `id` field). Rhythm Hacker countdown no longer eats track duration (gameTime only increments after countdown, nextNoteTime reset on countdown end, initial countdown text derived from config).

### What Was Completed (R3 -- 12 April 2026)

All P0 critical bugs resolved: Phaser controls now respond reliably via triple-focus strategy and input retry patterns across all scenes. Cloud Jumper jump physics fixed (one-way platform pattern, cloud body sizing, storm bounce correction). Neo Jump jetpack changed to direct velocity set, death detection tightened. Agent Chase agents can now exit/re-enter ghost house, reverse as fallback when stuck. All P1 test failures resolved (1,899 passing, 0 failing). Double gameOver sound eliminated. GameOverScene keyboard UX improved (M for menu, sound on keyboard restart). useInterval OOM crash fixed. usePerformanceMonitor interval guard added.

### Skills & Agents for Ralph Loop

| Skill/Agent | Command | When to Use |
|-------------|---------|-------------|
| Matrix Arcade Gamedev | `/matrix-arcade-gamedev` | Any game code changes |
| Phaser Gamedev | `/phaser-gamedev` | Phaser 3 scene development |
| Frontend Design | `/frontend-design` | UI/UX improvements |
| Playwright Testing | `/playwright-testing` | E2E test creation/debugging |
| New Game Scaffolder | `/new-game <Name> --phaser` | Scaffolding a brand new game |
| Game Tester | agent: `game-tester` | Run full test suite after changes |

---

## Priority Legend

- **P0**: Critical/blocking -- games unplayable, users cannot interact
- **P1**: High -- bugs that degrade experience, failing tests
- **P2**: Medium -- infrastructure, UX improvements, research
- **P3**: Low -- rebuilds, new features, polish

---

## P0 -- Critical: Phaser Controls & Unplayable Games ✅ RESOLVED

All P0 issues fixed in R3 (12 April 2026).

### 0.1 Fix Phaser Game Controls Not Responding ✅

**Fixed**: Triple-focus strategy in PhaserGame.tsx (immediate + on-ready + rAF-after-ready). Input retry pattern added to BaseScene.setupCommonInputs(), MenuScene.setupMenuInput(), GameOverScene.setupGameOverInput(), and all 5 Phaser game GameScenes. "Click to play" overlay made clickable (removed pointerEvents: 'none', added role="button" and onClick). Defensive guard added in App.tsx for `target.closest()` in jsdom.

- [x] `src/lib/phaser/PhaserGame.tsx` -- Triple-focus strategy, clickable overlay
- [x] `src/lib/phaser/scenes/BaseScene.ts` -- Input retry pattern in `setupCommonInputs()`
- [x] `src/lib/phaser/scenes/MenuScene.ts` -- Input retry pattern in `setupMenuInput()`
- [x] `src/lib/phaser/scenes/GameOverScene.ts` -- Input retry pattern in `setupGameOverInput()`
- [x] All 5 Phaser game GameScenes -- Input retry pattern verified

### 0.2 Fix Cloud Jumper -- Cannot Jump (Unplayable) ✅

**Fixed**: Simplified `canLandOnCloud()` to standard one-way platform check (`velocity.y >= 0`). Fixed cloud physics body after scaling (`setSize` + `setOffset` to match visual width). Storm cloud bounce reduced to `JUMP_VELOCITY * 0.5` (was paradoxically full velocity). Removed empty `handleInput()` dead code. Changed background from sky-blue to black for Matrix theme consistency. Added input retry pattern.

- [x] Cloud physics body dimensions fixed to match visual size after scaling
- [x] `canLandOnCloud()` simplified to standard one-way platform pattern
- [x] Storm cloud bounce fixed -- reduced to `JUMP_VELOCITY * 0.5`
- [x] Empty `handleInput()` dead code removed
- [x] Background changed from `bg-sky-400` to `bg-black`
- [x] Input retry pattern added to `setupInput()`

### 0.3 Fix Neo Jump -- Jetpack Broken + Endless Falling ✅

**Fixed**: Jetpack changed from additive acceleration to direct velocity set (`setVelocityY(-400)`). Death detection tightened to `cameraBottom + 50` instead of `cameraBottom + HEIGHT * 0.3`. Added W key support for WASD jetpack users. Input retry pattern added.

- [x] Jetpack: changed to direct velocity set (`body.setVelocityY(-400)`)
- [x] Death detection: tightened to `cameraBottom + 50`
- [x] W key added for jetpack (WASD consistency)
- [x] Input retry pattern added to `setupInput()`

### 0.4 Fix Agent Chase -- Agents Stuck in Centre Box + Wall Glitch ✅

**Fixed**: Added `isAgent` parameter to `canMove()` — ghost house tile '4' now passable for agents. Added reverse direction fallback when all non-reverse directions are blocked (prevents infinite oscillation). Fixed returning agent target to use actual home grid position instead of hardcoded coordinates. Fixed returning agent distance check to use homePosition directly. Cleaned up variable shadowing in `resetPositions()`.

- [x] `canMove()` allows tile '4' for agents (isAgent parameter)
- [x] Reverse direction fallback when all other directions blocked
- [x] Returning agent target uses actual home grid position
- [x] Variable shadowing cleaned up in `resetPositions()`
- [x] Input retry pattern added

---

## P1 -- High Priority: Game Bugs & Test Failures

### 1.1 Fix Metris Bullet Time (B Key) ✅

**Fixed**: Renamed `_toggleBulletTime` to `toggleBulletTime`, added B key handler in keyboard event listener, added to dependency array. Removed unused `_unlockGameAchievement` wrapper. Auto-activation still works for convenience; manual B key press tracks usage toward `neos_apprentice` achievement. Both paths play activation SFX.

- [x] B key handler added, toggleBulletTime wired up
- [x] Dead `_unlockGameAchievement` wrapper removed
- [x] neos_apprentice achievement reachable via manual activation

### 1.2 Fix Matrix Cloud Combo Scoring ✅

**Fixed**: Pipe collision now marks pipe as `passed` and skips scoring (player no longer scores on pipes they hit). Redundant failsafe collision block removed (was masked by invulnerability but structurally dangerous). Added sentinel boss achievement (`cloud_sentinel_defeat`) alongside existing agent_smith and architect achievements.

- [x] Collision marks pipe as passed, prevents scoring
- [x] Redundant failsafe collision block removed
- [x] Sentinel boss achievement added

### 1.3 Fix CTRL-S World Save Crash ✅

**Fixed**: Replaced malformed fallback object in `unlockAchievement` (missing `level`, `stats` sub-object) with `createDefaultGameSave()` which produces a valid `GameSaveData`.

- [x] Fallback uses `createDefaultGameSave()` — structurally valid GameSaveData
- [x] All 55 useSaveSystem tests pass

### 1.4 Fix Unit Test Failures (8 failures + 1 OOM) ✅

All test failures resolved:

- [x] **App.test.tsx** (5 failures → 0): Added `playBackgroundMP3`/`stopBackgroundMP3` to inline mock. Fixed `getByText` failures caused by landing page overlay showing duplicate text — switched to `getAllByText` and added `dismissLandingPage()` helper. Added defensive `typeof target?.closest === 'function'` guard in App.tsx.
- [x] **useViewportCulling.test.ts** (2 failures → 0): Updated test expectations to match non-mutating `cullObjects` API
- [x] **usePerformanceMonitor.test.tsx** (1 failure → 0): Added `if (!showOverlay) return;` guard in interval useEffect, removed console.log
- [x] **useInterval.test.ts** (1 OOM → 0): Changed `delay: 0` to `delay: 1`, added `Math.max(delay, 1)` minimum guard in hook

### 1.5 Fix Build Chunk Warning ✅

**Fixed**: Added `manualChunks: { phaser: ['phaser'] }` to vite.config.ts. GameOverScene chunk dropped from 1,490KB to 12KB. Phaser now in its own stable, cacheable vendor chunk (1,479KB — unavoidable library size). Added `chunkSizeWarningLimit: 1500` to suppress expected Phaser warning.

- [x] Investigated and confirmed Phaser was inlined into GameOverScene chunk
- [x] Phaser extracted to shared vendor chunk, zero build warnings

### 1.6 Fix Double gameOver Sound ✅

**Fixed**: Removed `this.playSound('gameOver')` from `BaseScene.gameOver()` — PhaserGame.tsx already handles it via the event handler.

- [x] `src/lib/phaser/scenes/BaseScene.ts` -- Removed duplicate `playSound('gameOver')` call

### 1.7 Fix Mute State Divergence ✅

**Fixed**: PhaserGame.tsx now calls `useSoundSystem().toggleMute()` when receiving a `'mute'` event from Phaser scenes. M key press in-game now syncs mute state back to React. No prop threading needed — PhaserGame already had useSoundSystem imported.

- [x] `src/lib/phaser/PhaserGame.tsx` -- Mute event calls toggleMute(), added to dependency array

### 1.8 Fix GameOverScene Keyboard UX Gaps ✅

**Fixed**: Added M key to navigate to menu from GameOverScene. Added sound (`'menu'`) to keyboard `restartGame()` path for consistency with button click behaviour.

- [x] `src/lib/phaser/scenes/GameOverScene.ts` -- M key calls `goToMenu()`, keyboard restart plays sound

### 1.9 Fix SimpleSnake Achievement Toasts Missing ✅

**Fixed**: Destructured `achievementManager` from props. Added `achievementManager?.unlockAchievement()` calls alongside all 7 existing `unlockAchievement()` calls, matching the dual-call pattern used by all other games. Updated dependency arrays.

- [x] `achievementManager` destructured from SimpleSnakeProps
- [x] 7 achievement sites now use dual-call pattern (UI toast + persistence)

### 1.10 Fix Fragile Positional Array Coupling in App.tsx ✅

**Fixed**: Added `id` field to `GameEntry` interface and all 11 GAME_REGISTRY entries. Replaced positional `GAME_COMPONENTS[]` and `GAME_ICONS[]` arrays with a keyed `GAME_BINDINGS` record indexed by game ID. The zip now uses `GAME_BINDINGS[entry.id]` — reordering GAME_REGISTRY can no longer silently mismatch components.

- [x] `src/data/gameRegistry.ts` -- Added `id: string` field to GameEntry, IDs added to all 11 entries
- [x] `src/App.tsx` -- GAME_BINDINGS record replaces positional arrays

### 1.11 Fix useInterval OOM Crash ✅

**Fixed**: Added `Math.max(delay, 1)` minimum delay guard in `useInterval.ts`. Changed test from `delay: 0` to `delay: 1`. Full suite now runs to completion without OOM.

- [x] `src/hooks/useInterval.ts` -- `Math.max(delay, 1)` guard
- [x] `src/hooks/useInterval.test.ts` -- `delay: 0` changed to `delay: 1`

### 1.12 Fix Rhythm Hacker Countdown Eats Track Duration ✅

**Fixed**: `gameTime` now only increments after countdown finishes (`if (!this.isCountdown) this.gameTime += delta`). `nextNoteTime` reset to 0 when countdown ends so notes spawn immediately. Initial countdown text now derived from `GAME_CONFIG.COUNTDOWN.DURATION` instead of hardcoded '10'. Easy track now plays for the full 60s of note time.

- [x] gameTime paused during countdown
- [x] nextNoteTime reset on countdown end
- [x] Countdown text uses config duration, not hardcoded '10'

---

## P2 -- Medium Priority: Existing Phaser Game Fixes & Cleanup

These games work but have documented bugs from `rebuildingoldgames/bugs.md`.

### 2.1 Rhythm Hacker Improvements

**File**: `src/components/games/phaser/RhythmHacker/scenes/GameScene.ts`
- [x] Change keys from D/F/J/K to Q/W/O/P (better hand positioning)
- [x] Reduce countdown from 10s to 5s (current 10s + 0.5s GO + 1s delay = 11.5s before gameplay -- far too long)
- [ ] Sync gameplay to backing music track (currently procedurally generated notes). 5+ WAV tracks available in asset dump.
- [ ] Improve visuals and animations (currently 100% procedural -- 28 textures auto-generated)
- [ ] Fix play area layout — game content is crammed into centre-bottom of the canvas, leaving huge empty black regions. Notes/lanes should fill more of the vertical space.
- [x] Replace magenta/pink "EASY MODE" label and red "HEALTH" label with Matrix-green palette colours
- [x] Replace multi-colour lane buttons (red/green/indigo/olive) with Matrix-themed colour variants (green/cyan/dark green/white) to maintain aesthetic consistency
- [ ] Redesign note sprites — current angular arrow shape is unrecognisable as a musical note
- [x] Initial countdown text is hardcoded to `'10'` at line 189 but actual duration comes from config — fix initialisation to use `GAME_CONFIG.COUNTDOWN.DURATION` (already fixed, this was done in R4)

### 2.2 Matrix Frogger Enhancements

**File**: `src/components/games/phaser/MatrixFrogger/scenes/GameScene.ts`
- [ ] Add safe start line (bottom row)
- [ ] Add 5-second countdown timer at start
- [ ] Add finish line/pavement at top (no loop)
- [ ] Add Kung Fu ability (max 3 per game)
- [ ] Add road markings for visual clarity
- [ ] Add varied agent speeds and chasing behaviour
- [ ] Add NEO invincibility mode (Mario star style)

### 2.3 Visual & UX Observations from Screenshots

From the screenshot review (12 Apr 2026, 156 screenshots across all 11 games + UI):

**Critical visual issues** (impact gameplay clarity):
- **Rhythm Hacker**: Huge empty black area dominates the canvas — game content is pushed to centre-bottom and severely underutilises the play area. "EASY MODE" label is magenta/pink (the only instance of that colour in the entire arcade — clashes with the Matrix palette). "HEALTH" label is red. The D/F/J/K key buttons use red, green, indigo, olive colours which break the Matrix monochrome aesthetic. The falling note sprite is an angular arrow/cursor shape rather than anything recognisable as a musical note. Play field appears mostly empty during active gameplay.
- **Cloud Jumper**: ~15-20% of the canvas width on the right side is an empty black border strip — game content doesn't fill the full area (width/layout mismatch). The death sprite (`gameplay-cloud-jumper-idle-death.png`) shows the player character reduced to an unrecognisable dark oval blob. No player would understand what they're seeing.
- **Matrix Frogger**: SCORE and DISTANCE both read "0" despite the game being in an active state with visible enemies. A floating semi-transparent dark rectangle near the top-centre appears to be an unrendered UI element (tooltip or overlay with no content). The frog player is very small and hard to distinguish from enemies at a glance.

**Moderate visual issues**:
- **Neo Jump**: A ghost/duplicate grey progress bar appears below the JETPACK indicator in the top-right corner — present in all gameplay screenshots. Purpose unclear (may be an unstyled or conditional bar that should be hidden).
- **Agent Chase**: HUD uses a mix of green AND yellow text for score/lives/level — inconsistent with other games that use green-only HUD elements. (Gameplay itself looks best of all Phaser games — good maze, clear dots, distinct ghost colours.)
- **Cloud Jumper sky-blue background**: Doesn't match the Matrix green-on-black theme. Player is a small blue figure with cape.

**Shared issues across Phaser games**:
- **Identical menu thumbnails**: Cloud Jumper, Neo Jump, and Agent Chase all share the same Matrix city/rain thumbnail image on their menu cards. These should be differentiated if they're meant to be game-specific previews.
- **All games use 100% procedural textures** — no external sprite assets loaded (`public/assets/` doesn't exist). Every visual element is generated in BootScene at runtime.
- **Game-over screens**: Generic across all games (shared GameOverScene with no game-specific context beyond the `reason` string). No mention of maze level, altitude reached, or track completed.

### 2.4 Cloud Jumper Visual Issues (NEW)

**Files**: `src/components/games/phaser/CloudJumper/scenes/GameScene.ts`, `config.ts`
- [ ] Fix canvas width gap — ~15-20% of right-side is empty black border. Game content doesn't fill the full canvas. Check PHASER_CONFIG width vs actual game world width.
- [x] Fix death sprite — player character becomes an unrecognisable dark oval blob on death. Either add a proper death animation or keep the player sprite visible during the death sequence.
- [ ] Change sky-blue background to Matrix green-on-black theme (0x0a1a0a or darker)
- [x] Generate a unique menu thumbnail image (currently shares the same image as Neo Jump and Agent Chase)

### 2.5 Matrix Frogger Visual Issues (NEW)

**Files**: `src/components/games/phaser/MatrixFrogger/scenes/GameScene.ts`
- [x] Investigate score stuck at 0 — fixed, score now awards on every forward step
- [ ] Fix unrendered floating UI box — semi-transparent dark rectangle near top-centre of play area with no visible content (likely an empty text/tooltip overlay)
- [x] Improve player sprite visibility — scale increased from 0.8 to 1.0

### 2.6 Codebase Cleanup

Low-risk cleanup tasks to reduce tech debt:

- [x] **Remove duplicate E2E spec** (done)
- [ ] **Add CTRL-S World gameplay E2E**: Has 10 visual tests but zero gameplay interaction tests. Write a basic gameplay spec.
- [ ] **Remove unused hooks or wire them in**: `useProceduralAudio`, `useViewportCulling`, `useInterval` are not imported by any production code. Either adopt them in games that would benefit (e.g. `useInterval` in `useSimpleSnakeGame` which re-implements it inline) or mark them as experimental/remove.
- [x] **Fix PuzzleModal dead state** (done — removed `_showFiftyFifty` state entirely)
- [x] **Remove dead code in legacy games** (done — AgentEscape._TUNNEL, JimmyMatrix._getTimingGrade/_timeDiff, MatrixAscension._altitude)
- [x] **Remove `console.log` in usePerformanceMonitor** (line 177) -- debug artifact (fixed in R3)
- [ ] **Remove `console.log` in useSaveSystem** (line 537) -- migration debug log, should be removed or gated behind a debug flag
- [x] **Move `playwright` from dependencies to devDependencies** (done)
- [x] **Remove `jest` from devDependencies** (done)
- [x] **usePerformanceMonitor PerformanceOverlay** (done — extracted to module-scope component with stable identity via ref pattern)

---

## Phase 0: Asset Pipeline (pre-requisite for polished visuals)

The `desiredassets/` folder contains a complete asset inventory with source mappings. The unsorted dump (`desiredassets/TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/`, ~4,900 files, ~750MB) has been catalogued and cross-referenced against every game's `ASSETS_NEEDED.md`. Currently **zero game assets are deployed** -- `public/assets/` doesn't exist. All games use procedural textures from BootScene.

**Asset Inventory Summary** (across all 13 ASSETS_NEEDED.md files):

| Game / Scope | [x] Have | [~] Sourced | [ ] Need | Total | Notes |
|---|---|---|---|---|---|
| global | 2 | 22 | 1 | 25 | Fonts + UI chrome + shared SFX |
| snake | 7 | 14 | 14 | 35 | Power-up icons + bosses need creating |
| vortex-pong | 8 | 14 | 6 | 28 | Close to ready with good [x] base |
| matrix-cloud | 8 | 16 | 11 | 35 | 3 boss sprites need creating from scratch |
| matrix-invaders | 14 | 18 | 11 | 43 | Strong foundation, boss + effects need work |
| metris | 3 | 17 | 17 | 37 | Largest scratch gap (all VFX + grid/playfield) |
| ctrl-s-world | 1 | ~53 | 0 | ~54 | 100% extractable, zero scratch — most art-heavy game |
| matrix-frogger | 9 | 17 | 4 | 30 | Most complete asset set (sprites + audio WAVs) |
| neo-jump | 2 | ~31 | 0 | ~33 | 100% extractable, Doodle RPG pack (406 sprites) |
| agent-chase | 7 | 20 | 8 | 35 | Player sprite is entirely [ ] (no source), 18 procedural |
| rhythm-hacker | 4 | 15 | 17+5 | ~41 | 5 note chart data files are critical blocker |
| cloud-jumper | 3 | 23 | 7 | 33 | Cloudy Pack (190+ files) covers most cloud needs |
| code-breaker | 14 | 41 | 5 | 60 | Strongest [x] base, almost pipeline-ready |
| **TOTALS** | **~82** | **~301** | **~106** | **~489** | 62% sourced, 21% scratch, 17% ready |

Key takeaways: 62% of assets are sourced but need extraction/processing. 21% need creating from scratch. Only 17% are fully ready.

**Pipeline-ready games** (zero scratch items): ctrl-s-world (~53 extractable), neo-jump (~31 extractable).
**Critical blockers**: Rhythm Hacker note charts (5 JSON files, without these the game cannot function as a rhythm game). Agent Chase player sprite (no source identified, currently 100% procedural). Boss sprites across Matrix Cloud (3 bosses, all need creating from scratch — high artistic complexity).
**Strongest foundations**: Code Breaker (14 [x], 41 [~]), Matrix Invaders (14 [x], 18 [~]), Matrix Frogger (9 [x] + complete WAV audio set).

### 0a. Global Asset Extraction (do first -- shared across all games)

- [ ] Unzip `MatrixArcadeFontAssets/` (3 ZIPs) -- extract TTF/WOFF2 fonts to `public/assets/fonts/`
- [ ] Unzip `WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip` -- catalogue SFX, rename to convention, place in `public/assets/audio/sfx/`
- [ ] Process `MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/` -- convert WAV to OGG, trim jingles to `public/assets/audio/music/`
- [ ] Extract `1. Free Hologram Interface Wenrexa/` -- sort buttons/panels/icons, apply Matrix green tint to `public/assets/ui/`
- [ ] Pick 3-4 best font families from `NotJamFontPack/` -- copy TTF + JSON to `public/assets/fonts/`
- [ ] Process `firework/` particles -- recolour green/cyan, create explosion + sparkle sprite sheets to `public/assets/shared/`
- [ ] Unzip `Matrix-Icons.zip` (85MB) -- cherry-pick 30-50 relevant icons to `public/assets/ui/icons/`

### 0b. Per-Game Asset Extraction (parallel with game fixes)

Each game's `desiredassets/[game]/ASSETS_NEEDED.md` has a Source Mapping section. Work through `[~]` items:

- [ ] **Rhythm Hacker** (HIGHEST PRIORITY -- music unlocks the game): Process 5+ WAV tracks from LongTracks/, create note charts to `public/assets/rhythm-hacker/`. Currently 100% procedural with 28 auto-generated textures and 20 `[ ]` items (largest create-from-scratch gap).
- [ ] **CTRL-S | The World** (most art-heavy): Extract character bases from Mana Seed + Kings and Pigs, create portraits, backgrounds from CyberPunk/scifi packs. ~50 `[~]` items, all need significant manual extraction.
- [ ] **Snake Classic**: Extract snake sprites from INSPO + CyberPunk character anims, recolour. Best-positioned game with solid `[x]` base.
- [ ] **Vortex Pong**: Extract pong assets from INSPO + firework particles for trails. Good `[x]` base, close to ready.
- [ ] **Matrix Cloud**: Extract Flappy Bird sprites from INSPO (52 sprites ready), recolour pipes. Strong foundation but 3 boss sprites need creating from scratch.
- [ ] **Matrix Invaders**: Extract robot enemies from TopView_Robot_Asset_Pack + laser sprites
- [ ] **Metris**: Extract tetris tiles from INSPO (4 variants available) + UI panels. Significant `[ ]` gap for visual effects (18 items).
- [ ] **Matrix Frogger**: Extract frog sprites from INSPO (83 sprites + Krita sources + WAV audio). Most complete asset set.
- [ ] **Neo Jump**: Process Doodle RPG pack from INSPO (406 sprites). Decision needed: RPG knight pack vs custom Neo vs procedural.
- [ ] **Agent Chase**: Extract Pac-Man assets from INSPO + roguelike tiles for maze walls. Player sprite is entirely `[ ]` (no source identified). Currently 100% procedural with 18 auto-generated textures.
- [ ] **Cloud Jumper**: Process Cloudy Pack (190+ cloud sprites, 10 themes), pick Matrix-compatible theme. Background layers are main `[ ]` gap.
- [ ] **Code Breaker**: Extract Breakout sprites from INSPO + laser sprites + robot enemies. Very strong `[x]` base (17 items ready).

### 0c. Asset Integration Pattern

For each game, the pipeline is:
1. Extract raw assets from dump to `desiredassets/[game]/raw/`
2. Process (recolour, resize, atlas-pack) to `desiredassets/[game]/processed/`
3. Copy final assets to `public/assets/[game]/`
4. Update BootScene to load from new paths
5. Mark `[~]` to `[x]` in ASSETS_NEEDED.md

---

## Phase 1: Research & Planning

Before any code changes to game rebuilds, create detailed rebuild documents in `rebuildingoldgames/` for each game. **Status: 12 of 12 research docs created** -- all marked RESEARCH NEEDED (content complete but awaiting sprite cataloguing and detailed design finalisation). All research task checklists are unchecked.

### 1.1 Global Infrastructure Research

- [ ] **Three.js Matrix Rain Background** -- Research replacing CSS matrix rain with smooth 3D Three.js implementation. Prototype in isolation. Must run at 60fps. Depth-of-field, instanced geometry, responds to game events (speeds up during play, slows on menu).
- [ ] **Global Asset System** -- Design unified font, spritesheet, and audio management. Plan `src/lib/assets/` with loaders for fonts (Press Start 2P + pixel fonts from asset packs), centralised spritesheet atlases, and audio library (music tracks + SFX). This ensures all games share resources efficiently.
- [ ] **Game Card Portal Redesign** -- Plan larger game cards (see `gamecardlayout.png`). Add Instructions button (opens modal) and High Scores button. ASCII art for all game titles. Remove inline instruction text. Same card design for all games in carousel view.
- [ ] **Global Controls UX Redesign** -- Current GLOBAL CONTROLS section is too wide, sparse, and disconnected. Plan: compact into a sleek bar or hide behind a keyboard icon toggle. Should feel like part of the Matrix terminal aesthetic, not a plain text table.

### 1.2 React to Phaser Rebuild Research (6 games)

Each document goes in `rebuildingoldgames/plans/` and covers: current state analysis, bugs to fix, design vision (with reference images), Phaser scene architecture, sprite requirements (from asset folders), achievement list, and test plan.

- [x] **CTRL-S | The World** (`rebuildingoldgames/plans/ctrl-s-rebuild.md`) -- Created. Citizen Sleeper UI patterns for narrative engine.
- [x] **Snake Classic** (`rebuildingoldgames/plans/snake-rebuild.md`) -- Created. 3-mode architecture (Classic/Matrix/Hacker).
- [x] **Vortex Pong** (`rebuildingoldgames/plans/vortex-pong-rebuild.md`) -- Created. Direct port, no design changes.
- [x] **Matrix Cloud** (`rebuildingoldgames/plans/matrix-cloud-rebuild.md`) -- Created. Full redesign with proper Flappy Bird physics.
- [x] **Matrix Invaders** (`rebuildingoldgames/plans/matrix-invaders-rebuild.md`) -- Created. Phaser Groups replace manual pooling.
- [x] **Metris** (`rebuildingoldgames/plans/metris-rebuild.md`) -- Created. SRS rotation, T-spin, bullet time fix.

### 1.3 Existing Phaser Game Fix Research (5 games)

- [x] **Matrix Frogger** (`rebuildingoldgames/plans/frogger-fixes.md`) -- Created
- [x] **Neo Jump** (`rebuildingoldgames/plans/neo-jump-fixes.md`) -- Created
- [x] **Agent Chase** (`rebuildingoldgames/plans/agent-chase-fixes.md`) -- Created
- [x] **Rhythm Hacker** (`rebuildingoldgames/plans/rhythm-hacker-fixes.md`) -- Created
- [x] **Cloud Jumper** (`rebuildingoldgames/plans/cloud-jumper-fixes.md`) -- Created

### 1.4 New Game Research

- [x] **Code Breaker** (`rebuildingoldgames/plans/code-breaker-new.md`) -- Created. Brick breaker meets Matrix.

---

## Phase 2: Global Infrastructure Build

Build shared systems before game rebuilds.

- [ ] Implement Three.js matrix rain background (replaces CSS animation)
- [ ] Create `src/lib/assets/AssetManager.ts` -- centralised font, spritesheet, and audio loading
- [ ] Create global spritesheet atlas system for shared sprites across games
- [ ] Fix save system crash (incomplete GameSaveData fallback in `unlockAchievement`) -- see P1 1.3
- [ ] Redesign game card portal (larger cards, ASCII art titles, Instructions/High Scores buttons)
- [ ] Redesign GLOBAL CONTROLS (compact bar, keyboard icon toggle)
- [ ] Add ASCII art generator/renderer for game titles
- [ ] Update landing page UX (larger cards, less empty space, better visual hierarchy)

---

## Phase 3: Phaser Game Rebuilds (React to Phaser)

Each rebuild follows standard Phaser structure: `index.tsx`, `config.ts`, `scenes/{Boot,Menu,Game,GameOver}Scene.ts`. All use `BaseScene`, `exposeTestState()`, and the global asset system.

### Priority Order

1. **Vortex Pong** -- Simplest rebuild (keep design, just port). Proves the pipeline.
2. **Snake Classic** -- Medium complexity, 3-mode system adds depth.
3. **Matrix Cloud** -- Full redesign with proper Flappy Bird physics.
4. **Matrix Invaders** -- Complex (waves, pooling, bullet time) but huge Phaser gains.
5. **Metris** -- SRS rotation system needs careful porting.
6. **CTRL-S | The World** -- Largest, most ambitious. Citizen Sleeper-inspired narrative engine.

### Known React Game Bugs to Fix During Rebuild

These are documented issues in the current React games that should be resolved as part of the Phaser rebuild (not worth fixing in the legacy code):

| Game | Bug | Severity |
|------|-----|----------|
| CrossyRoad | Extensive `setState` inside `useGameLoop` -- 8+ React state updates per frame at 60fps | Performance |
| AgentEscape | `_deltaTime` completely ignored -- all movement is frame-rate dependent (2.4x speed at 144Hz) | Gameplay |
| MatrixAscension | `_altitude` state unused (vestigial), spring velocity double-applies deltaTime | Minor |
| JimmyMatrix | Game rAF loop restarts on every score change due to excessive useEffect deps; `endTrack(false)` called inside React state updater (unsafe) | Performance |
| MatrixCloud | Boss defeat achievement never fires; double collision (can lose 2 lives in 1 frame) | Gameplay |
| MatrixInvaders | 1-frame lag between player movement and collision; non-integer scores displayed | Minor |

### Per-Game Build Checklist (repeat for each)

- [ ] Create Phaser game directory structure
- [ ] Implement BootScene (load sprites from asset system)
- [ ] Implement MenuScene (ASCII art title, matrix rain, controls)
- [ ] Implement GameScene (core gameplay from research doc)
- [ ] Implement GameOverScene (score, high score, restart)
- [ ] Add achievements (minimum 8 per game)
- [ ] Add test seams (`exposeTestState()`)
- [ ] Write unit tests (minimum 40 per game)
- [ ] Write E2E gameplay tests (minimum 6 per game)
- [ ] Register in game registry
- [ ] Play-test 5 full games
- [ ] Remove old React/Canvas component

---

## Phase 4: Existing Phaser Game Fixes

Apply fixes from `rebuildingoldgames/bugs.md` (beyond what's already covered in P0/P1/P2):

- [ ] Matrix Frogger: Full enhancement list (see 2.2 above)
- [ ] Neo Jump: Custom sprites, Doodle Jump UX (after P0 jetpack/death fix)
- [ ] Agent Chase: Multiple map layouts (Square/Circle/Diamond for Easy/Medium/Hard) -- after P0 AI fix
- [ ] Rhythm Hacker: Full improvement list (see 2.1 above)
- [ ] Cloud Jumper: Visual overhaul to Matrix theme (after P0 jump fix)

---

## Phase 5: New Game -- Code Breaker

- [ ] Design doc and architecture (from Phase 1.4 research -- done)
- [ ] Implement as Phaser game
- [ ] 6 power-ups, boss bricks, Agent Smith enemies, portal win
- [ ] 10 achievements
- [ ] Full test coverage

---

## Phase 6: Polish & Final Testing

- [ ] Full E2E gameplay suite against all rebuilt games
- [ ] Visual regression tests for new Phaser games
- [ ] Performance profiling (60fps on all games)
- [ ] Accessibility audit
- [ ] PWA cache invalidation for new chunks
- [ ] Documentation update
- [ ] E2E coverage for legacy games currently missing tests (AgentEscape, CrossyRoad, JimmyMatrix, MatrixAscension -- only if these games are kept)

---

## Architecture Notes

### Phaser Input Pattern (MUST follow after P0 fix)

All scenes that register keyboard input must handle the case where `this.input.keyboard` is not yet ready:

```typescript
// BAD -- silently fails, no retry
protected setupInput(): void {
  if (!this.input.keyboard) return;
  // ... register keys
}

// GOOD -- defers registration until input is ready
protected setupInput(): void {
  if (!this.input.keyboard) {
    this.time.delayedCall(100, () => this.setupInput());
    return;
  }
  // ... register keys
}
```

Scene transitions are already correct -- `this.scene.start(targetKey)` stops the calling scene and starts the target:
```typescript
// CORRECT -- scene.start() already stops the current scene
this.scene.start(SCENE_KEYS.GAME);

// UNNECESSARY -- no need to explicitly stop
this.scene.stop();
this.scene.start(SCENE_KEYS.GAME);
```

### Physics Pattern (from phaser-gamedev skill -- MUST follow)

- Use `body.blocked.down` (not `body.touching.down`) for grounded/standing-on-platform checks
- Reset velocity to zero each frame before applying directional input to avoid drift
- Static bodies (platforms) require `refreshBody()` after any positional change
- For object pooling: use `setActive(false) / body.enable = false` to return to pool
- Moving platforms: `setImmovable(true)` and `setAllowGravity(false)`, drive with tweens
- All movement MUST use delta: `this.player.x += this.speed * (delta / 1000);`
- **Spritesheet loading**: Always measure frame dimensions from the actual image before loading. Never guess. Verify: `imageWidth = (frameWidth × cols) + (spacing × (cols − 1)) + (margin × 2)`

### Sound Integration Pattern

Phaser games use React-side sound via the registry bridge:
- Scenes call `this.playSound(key)` which reads `SOUND_SYSTEM` from registry
- PhaserGame.tsx provides `useSoundSystem().playSFX` via registry
- Phaser's built-in audio system is NOT used
- **Warning**: Do not play sounds in both BaseScene and PhaserGame.tsx for the same event (see P1 1.6)

### Three.js Matrix Rain (planned)

Replace CSS matrix rain with Three.js for smooth 3D effect:
- React component rendered behind game content
- Instanced geometry for performance
- Depth-of-field (characters blur as they fall deeper)
- Responds to game events (rain speeds up during gameplay, slows on menu)

### Global Asset System (planned)

```
src/lib/assets/
  AssetManager.ts      # Centralised loading and caching
  fonts.ts             # Font registry (Press Start 2P, pixel fonts)
  spritesheets.ts      # Atlas definitions for shared sprites
  audio.ts             # Music tracks and SFX library
```

### Phaser Game Standard Structure

```
src/components/games/phaser/[GameName]/
  index.tsx            # React wrapper (PhaserGame)
  config.ts            # Phaser config, constants, achievement IDs
  scenes/
    BootScene.ts       # Load assets from global system
    MenuScene.ts       # ASCII art title, matrix rain, controls (extends shared MenuScene, except RhythmHacker which has custom track selection)
    GameScene.ts       # Core gameplay (extends BaseScene)
    GameOverScene.ts   # Score, high score, restart (extends shared GameOverScene)
```

### Required Keyboard Controls (all games)

| Key | Action | Required |
|-----|--------|----------|
| ESC | Exit to menu | Yes |
| P | Pause/resume | Yes |
| R | Restart | Yes |
| ENTER/SPACE | Start game | Yes |
| Arrow keys | Primary movement | Yes |
| WASD | Alt movement | Recommended |
| M | Toggle mute | Recommended |

---

## Test Coverage Status

### Current Coverage Matrix

| Game | Type | Unit Test | E2E Visual | E2E Gameplay |
|------|------|-----------|------------|--------------|
| SimpleSnake | React | Yes | Yes | Yes |
| VortexPong | React | Yes | Yes | Yes |
| MatrixCloud | React | Yes | Yes (screenshots missing) | Yes |
| Metris | React | Yes | Yes | Yes |
| MatrixInvaders | React | Yes | Yes | Yes |
| CtrlSWorld | React | Yes | Yes | **MISSING** |
| AgentEscape | React (legacy) | Yes | **MISSING** | **MISSING** |
| CrossyRoad | React (legacy) | Yes | **MISSING** | **MISSING** |
| JimmyMatrix | React (legacy) | Yes | **MISSING** | **MISSING** |
| MatrixAscension | React (legacy) | Yes | **MISSING** | **MISSING** |
| MatrixFrogger | Phaser | Yes | Yes | Yes |
| NeoJump | Phaser | Yes | Yes | Yes |
| AgentChase | Phaser | Yes | Yes | Yes |
| RhythmHacker | Phaser | Yes | Yes | Yes |
| CloudJumper | Phaser | Yes | Yes | Yes |

All 17 hooks have unit tests. All Phaser games expose test state via `exposeTestState()`. E2E fixtures (`arcade.fixture.ts`, `game-helpers.ts`, `test-utils.ts`) support both React and Phaser games. Phaser E2E helpers include: `startPhaserGame()`, `ensurePhaserFocus()`, `getPhaserState()`, `waitForPhaserState()`, `waitForPhaserScene()`, and per-game key helpers (`hopForward`, `moveInMaze`, `hitNotes`, `jump`, `activateJetpack`, etc.).

### Gaps
- 4 legacy React games lack E2E coverage entirely -- these are being replaced by Phaser versions, so E2E coverage is low priority unless games are kept
- CtrlSWorld has visual tests but no gameplay E2E spec

---

## Current Codebase Health

### Strengths
- Zero TODO/FIXME/HACK comments in src/ (confirmed via grep 12 Apr 2026)
- Zero `@ts-ignore` in production code (only `@ts-expect-error` in test files with explanations)
- console.error/warn only in appropriate error-handling contexts (useSaveSystem catch blocks, audio init failures)
- Two stray `console.log` calls: usePerformanceMonitor:177 and useSaveSystem:537 (see P2 2.6)
- TypeScript strict mode fully enabled (noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch)
- All 5 Phaser games expose test state via `exposeTestState()`
- All 5 Phaser games have complete config.ts with achievement definitions (42 total)
- 15 games total, 100% achievement integration (101+ unlock calls across all games)
- Comprehensive shared hook library (17 hooks covering audio, save, particles, pooling, performance)
- Clean separation of concerns: React wrapper + Phaser scenes via registry pattern
- Single source of truth: GAME_REGISTRY in `src/data/gameRegistry.ts`
- Code-split lazy loading for all game components
- Phaser scene transitions are all clean (scene.start correctly stops calling scene)
- All games use consistent dual-call achievement pattern (except SimpleSnake -- see P1 1.9)

### Gaps
- 4 legacy games lack E2E test coverage (AgentEscape, CrossyRoad, JimmyMatrix, MatrixAscension) -- being replaced by Phaser versions
- Zero external assets deployed (`public/assets/` doesn't exist) -- all procedural textures
- Zustand store (`src/store/gameStore.ts`) is legacy, superseded by useSaveSystem
- Phaser game focus management is fragile (primary cause of "controls don't work" reports)
- No keyboard retry pattern in ANY Phaser scene -- all 5 games + BaseScene + MenuScene + GameOverScene use `if (!this.input.keyboard) return;` with silent failure and no recovery
- `useProceduralAudio`, `useViewportCulling`, `useInterval` hooks exist but are unused by any game
- 4 legacy game files (AgentEscape, CrossyRoad, JimmyMatrix, MatrixAscension) remain as full components with tests but are not in GAME_REGISTRY -- orphaned code from pre-Phaser era
- Cloud Jumper canvas has ~15-20% empty right border (width mismatch), death sprite is an unrecognisable blob
- Rhythm Hacker play area severely underutilised (game content crammed into centre-bottom), non-Matrix colour scheme (magenta/red/multi-colour lane buttons)
- Matrix Frogger score stuck at 0 in screenshots, unrendered floating UI box, player too small to distinguish from enemies
- Neo Jump has a ghost/duplicate grey progress bar below JETPACK indicator
- Neo Jump W key not mapped for WASD jetpack users (only A/D are bound)
- Neo Jump jetpack thrust is too weak to counter gravity (additive -4.8/frame vs gravity 800)
- Agent Chase ghost house tiles impassable in `canMove()`, preventing agent re-entry
- Agent Chase agents get stuck when all non-reverse directions are blocked
- `useAdvancedVoice` AudioContext for visualisation never connected to speech output (always returns zeros)

---

## Ralph Loop Strategy

1. **P0 first**: Fix Phaser focus/controls issue (unblocks ALL 5 Phaser games), then fix individual game bugs (Cloud Jumper physics/jump, Neo Jump jetpack/death, Agent Chase AI)
2. **P1 next**: Fix remaining game bugs (Metris bullet time, Matrix Cloud combo, CTRL-S save crash, double sound, mute divergence, Rhythm Hacker countdown, App.tsx coupling), then fix failing unit tests (8 failures + 1 OOM)
3. **Phase 0 parallel**: Begin asset extraction while fixing games (independent work streams)
4. **Phase 1 done**: All 12 research docs created -- move to implementation when P0/P1 clear
5. Use `/matrix-arcade-gamedev` for game code, `/phaser-gamedev` for Phaser scenes, `/playwright-testing` for E2E
6. Run `game-tester` agent after every code change
7. Each iteration: fix one P0/P1 item OR implement one Phase item, verify build + tests, update checkboxes
8. Reference images in `rebuildingoldgames/inspirationimagesandsprites/` for every design decision
9. **Keyboard retry pattern**: When fixing P0.1, apply the `delayedCall` retry to ALL 8 locations: BaseScene.setupCommonInputs(), MenuScene.setupMenuInput(), GameOverScene.setupGameOverInput(), and all 5 game GameScene.setupInput() methods
