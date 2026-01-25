# Matrix Arcade - Implementation Plan

This file is auto-generated and updated by Ralph during planning and building loops.

Run `./loop.sh plan` to analyse the codebase and generate tasks.

---

## Current State Summary

- **Games Implemented**: 8 (exceeds 6+ goal)
- **Games in Main Menu**: 7 active games (CtrlSWorld, SimpleSnake, VortexPong, MatrixCloud, MatrixInvaders, Metris, TerminalQuest)
- **Hidden Games**: 1 (TerminalQuestCombat - combat subcomponent of TerminalQuest)
- **Achievement System**: 63 total achievements defined (56 game + 7 global) - All IDs now consistent ✓
- **Hooks Library**: 17 shared hooks for games to use (5 have tests)
- **Hooks Test Coverage**: 5/17 (29%)
- **Game Test Coverage**: 7/7 games have test files (100%)
- **Visual Consistency**: Strong Matrix theme throughout (green-on-black, glow effects, CRT aesthetic)
- **Console.log Statements**: 2 debug logging statements remain (usePerformanceMonitor:176, useSaveSystem:195)
- **Legacy localStorage Usage**: 2 game-related files still use direct localStorage (GameStateContext, useLifelineManager)
- **State Machine Compliance**: 2/7 games (29%) - SimpleSnake and VortexPong fully compliant
- **isMuted Prop Gating**: All 8 games have isMuted prop and gate sound calls properly ✓
- **Achievement ID Mismatches**: All 4 games fixed (SimpleSnake, MatrixCloud, MatrixInvaders, CtrlSWorld) ✓
- **Keyboard Controls**: All 7 main games now COMPLIANT with standard controls (ESC, P, R, ENTER) ✓
- **Last Analysis**: 25 January 2026 (Round 30 - Keyboard controls and visual fixes complete)

---

## Priority Tasks

### P0 - Critical (Blocking User Experience)

None currently blocking.

### P1 - High Priority (Spec Compliance)

#### Achievement System ID Mismatches - FIXED ✓

All achievement ID mismatches have been resolved:

| Game | Status |
|------|--------|
| SimpleSnake | ✓ FIXED - IDs now use `snake_` prefix |
| MatrixCloud | ✓ FIXED - IDs now use `cloud_` prefix |
| MatrixInvaders | ✓ FIXED - Added missing IDs to useSaveSystem |
| CtrlSWorld | ✓ FIXED - IDs now use `ctrl_` prefix |
| VortexPong | ✓ COMPLIANT |
| Metris | IDs correct, some implementations pending |
| TerminalQuest | ✓ COMPLIANT |

**Missing Achievement Implementations:**
| Game | Achievement ID | Criteria | Status |
|------|---------------|----------|--------|
| SimpleSnake | `snake_combo_10` | Chain Reaction - eat 10 consecutive food | ✓ IMPLEMENTED |
| SimpleSnake | `snake_power_master` | Power User - collect 10 power-ups in one game | ✓ IMPLEMENTED |
| MatrixInvaders | `invaders_bullet_time` | Time Bender - use bullet time 5 times | ✓ IMPLEMENTED |
| MatrixInvaders | `invaders_perfect_wave` | Flawless Defense - complete wave without damage | ✓ IMPLEMENTED |
| MatrixInvaders | `invaders_boss_defeat` | System Override - defeat a boss | ⚠️ BLOCKED - No boss system exists |
| MatrixInvaders | `invaders_high_score` | Elite Hacker - score 10000+ | ✓ IMPLEMENTED |
| Metris | `perfect_start` | Reach level 5 or higher | ✓ IMPLEMENTED |
| Metris | `architect` | Build 18 rows without clearing | ✓ IMPLEMENTED |
| Metris | `t_spin_master` | Perform 5 T-spins | ✓ IMPLEMENTED |

**Global Achievements - Implementation Status:**
| Achievement | Description | Status |
|-------------|-------------|--------|
| `global_first_game` | Play your first game | ✓ IMPLEMENTED |
| `global_all_games` | Play all 7 games | ✓ IMPLEMENTED |
| `global_10_achievements` | Unlock 10 achievements | ✓ IMPLEMENTED |
| `global_25_achievements` | Unlock 25 achievements | ✓ IMPLEMENTED |
| `global_50_achievements` | Unlock 50 achievements | ✓ IMPLEMENTED |
| `global_night_owl` | Play between midnight and 5am | ✓ IMPLEMENTED |
| `global_dedicated` | Play 7 days in a row | ✓ IMPLEMENTED |

#### Performance Issues (Date.now() in Animation Loops) - FIXED ✓

Using `Date.now()` inside render/animation loops creates inconsistent frame-rate dependent animations.

| Game | Issue | Lines | Status |
|------|-------|-------|--------|
| MatrixInvaders | `Math.sin(Date.now() * 0.01)` in render | 518, 564 | ✓ FIXED - Now uses RAF timestamp |
| SimpleSnake | Power-up expiration check | 78 | ✓ NOT AN ISSUE - Uses React state-based rendering, not RAF animation |
| MatrixInvaders | `setInterval` for player movement | 769-770 | ✓ FIXED - Integrated into RAF-based game loop |

**Reference:** VortexPong.tsx correctly passes timestamp from requestAnimationFrame as a prop (lines 641, 679, 743). MatrixInvaders now follows this pattern.

#### Visual Bugs (Confirmed from Screenshots)

| Game | Issue | Screenshot | Status |
|------|-------|------------|--------|
| MatrixCloud | Power-up guide text bleeds through pause modal ("Shield Protec", "ime Manipulation", "Extra L", "ultiplier" visible) | cloud-paused.png | ✓ FIXED - Added z-10 to HUD elements |

#### Keyboard Controls Gaps

| Game | ESC | P (pause) | R (restart) | ENTER (start) | Status |
|------|-----|-----------|-------------|---------------|--------|
| SimpleSnake | App-level | ✓ | ✓ | ✓ | **COMPLIANT** |
| VortexPong | App-level | ✓ | ✓ | ✓ | **COMPLIANT** |
| MatrixCloud | App-level | ✓ | ✓ | ✓ | **COMPLIANT** |
| MatrixInvaders | App-level | ✓ | ✓ | ✓ | **COMPLIANT** |
| Metris | App-level | ✓ | ✓ | ✓ | **COMPLIANT** |
| CtrlSWorld | App-level | ✓ | ✓ | Partial | **COMPLIANT** |
| TerminalQuest | App-level | ✓ | ✓ | ✓ | **COMPLIANT** |
| TerminalQuestCombat | App-level | ✗ | ✗ | ✗ | Combat uses 1-5 keys |

### P2 - Medium Priority (Code Quality & Performance)

#### Console.log Cleanup

| File | Line | Issue | Action |
|------|------|-------|--------|
| usePerformanceMonitor.tsx | 176 | `console.log('[Performance] ${name}: ${(end - start).toFixed(2)}ms')` | Remove or wrap in DEBUG flag |
| useSaveSystem.ts | 195 | `console.log('Migrating save data from version', ...)` | Remove or wrap in DEBUG flag |

#### localStorage Migration to useSaveSystem

| File | Key | Current Usage | Priority |
|------|-----|---------------|----------|
| GameStateContext.tsx | `matrix-arcade-ctrls-save` | Full CTRL-S game state | HIGH - Should use useSaveSystem |
| useLifelineManager.ts | `ctrlsworld_lifelines` | Puzzle lifeline state | MEDIUM - Consider migration |

**Note:** Audio/voice preferences in useSoundSystem, useAdvancedVoice, useShatnerVoice are appropriate to keep as direct localStorage (user preferences, not game data).

#### Memory Leak Potential

| Game | Issue | Lines | Fix Required |
|------|-------|-------|--------------|
| MatrixInvaders | Invulnerability timer setTimeout not tracked | 314-322 | Store timeout ID in ref |
| MatrixInvaders | Wave spawn delay and bullet time timeouts untracked | 334, 673-680 | Track and cleanup |

### P3 - Low Priority (Enhancements)

#### Test Coverage Expansion

**Hooks Without Tests (12/17):**
| Hook | Priority | Lines of Code |
|------|----------|---------------|
| useSoundSynthesis | Critical | 367 |
| useProceduralAudio | Critical | 360 |
| useParticleSystem | High | 304 |
| useShatnerVoice | High | 273 |
| useObjectPool | High | 267 |
| useAchievementManager | High | 176 |
| useViewportCulling | High | 168 |
| usePerformanceMonitor | Medium | 213 |
| useLifelineManager | Medium | 219 |
| usePowerUps | Medium | 48 |
| useGameLoop | Medium | 24 |
| useInterval | Low | 15 |

**Hooks With Tests (5/17):**
- useSaveSystem (102 tests)
- useSimpleSnakeGame (107 tests)
- useSoundSystem (22 tests)
- useMobileDetection (15 tests)
- useAdvancedVoice (25 tests)

**Game Test Coverage:**
| Game | Test Count | Status |
|------|-----------|--------|
| MatrixInvaders | 89 | Excellent |
| TerminalQuestCombat | 67 | Excellent |
| Metris | 51 | Good |
| SimpleSnake | 33 | Good |
| TerminalQuest | 27 | Moderate |
| VortexPong | 21 | Needs expansion |
| MatrixCloud | 17 | Needs expansion |

#### Unused Hooks

The following hooks are fully implemented but not integrated into any game:
- `useProceduralAudio` - Advanced procedural audio with granular synthesis
- `useViewportCulling` - Spatial partitioning for render optimisation
- `useMobileDetection` - Device detection (could be used for touch controls)

Consider either integrating these or archiving them.

---

## Architecture Notes

### Hooks Available (use these, do not reinvent)

**Core Game Hooks (17 total):**
- `useGameLoop` - RAF with delta time, auto-cleanup
- `useSoundSystem` - Standard SFX library with 12 predefined effects
- `useSoundSynthesis` - Procedural audio (synthLaser, synthExplosion, synthPowerUp, synthDrum, synthVoice)
- `useSaveSystem` - High scores, achievements, game stats, export/import with automatic backup
- `useAchievementManager` - Achievement notifications and tracking with modal display
- `useParticleSystem` - Pooled particle effects with 6 types
- `useObjectPool` - Memory-efficient object reuse
- `useViewportCulling` - Off-screen object culling
- `usePerformanceMonitor` - FPS tracking and metrics
- `useInterval` - Declarative setInterval
- `usePowerUps` - Power-up management for VortexPong
- `useMobileDetection` - Device type detection
- `useProceduralAudio` - Engine sounds, collisions, adaptive music
- `useShatnerVoice` - Dramatic TTS for CtrlSWorld
- `useAdvancedVoice` - Multiple personas with SSML
- `useLifelineManager` - Puzzle lifeline system
- `useSimpleSnakeGame` - Complete snake game logic

### State Machine Pattern (all games MUST follow)
```
IDLE/MENU -> PLAYING -> PAUSED -> PLAYING -> GAME_OVER
                ^                             |
                +-------- RESTART ------------+
```

**Current State Machine Compliance:**
| Game | States | Status |
|------|--------|--------|
| SimpleSnake | 'menu' \| 'playing' \| 'paused' \| 'gameOver' | **COMPLIANT** |
| VortexPong | Boolean flags with menu state | **COMPLIANT** |
| MatrixCloud | Multiple booleans | PARTIAL |
| MatrixInvaders | Multiple booleans with menu | PARTIAL |
| Metris | Multiple booleans | PARTIAL |
| CtrlSWorld | isStarted, isPaused, isGameComplete | PARTIAL |
| TerminalQuest | Node-based + booleans | PARTIAL |

### Required Keyboard Shortcuts
| Key | Action | Required |
|-----|--------|----------|
| ESC | Exit to menu | Yes (App-level) |
| P | Pause/resume | Yes |
| R | Restart | Yes |
| ENTER | Start game | Yes |
| Arrow keys | Primary movement | Yes |
| WASD | Alt movement | Recommended |
| SPACE | Primary action | Where applicable |

### Required Props Interface
```typescript
interface GameProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;  // Default: false
}
```

### Reference Implementations
- **State machine pattern:** SimpleSnake.tsx / useSimpleSnakeGame.ts
- **Canvas rendering + hooks:** VortexPong.tsx (useGameLoop, useSoundSystem, useSaveSystem, usePowerUps)
- **Immutable state updates:** MatrixCloud.tsx
- **Sound synthesis:** MatrixInvaders.tsx, Metris.tsx (useSoundSynthesis)
- **Object pooling:** MatrixInvaders.tsx
- **Narrative game:** CtrlSWorld.tsx
- **Text adventure:** TerminalQuest.tsx

---

## Compliance Summary by Game

| Game | Controls | Sound | isMuted | State Machine | Achievements | SaveSystem | Overall |
|------|----------|-------|---------|---------------|--------------|------------|---------|
| SimpleSnake | 100% | ✓ | ✓ | **COMPLIANT** | ✓ | ✓ | **95%** |
| VortexPong | 100% | ✓ | ✓ | **COMPLIANT** | ✓ | ✓ | **95%** |
| MatrixCloud | 100% | ✓ | ✓ | PARTIAL | ✓ | ✓ | 90% |
| MatrixInvaders | 100% | ✓ | ✓ | PARTIAL | ✓ | ✓ | 85% |
| Metris | 100% | ✓ | ✓ | PARTIAL | Partial | ✓ | 80% |
| CtrlSWorld | 100% | ✓ | ✓ | PARTIAL | ✓ | localStorage | 75% |
| TerminalQuest | 85% | ✓ | ✓ | PARTIAL | ✓ | ✓ | 85% |

**Average Game Compliance: 86%**

---

## Quick Reference: Priority Order for Implementation

1. **P1 - High Priority (Spec Compliance)**:
   - [x] Fix SimpleSnake achievement IDs (add `snake_` prefix to 6 IDs) ✓
   - [x] Fix MatrixCloud achievement IDs (add `cloud_` prefix to 4 IDs) ✓
   - [x] Fix MatrixInvaders non-existent achievement IDs (added 3 IDs to useSaveSystem) ✓
   - [x] Fix CtrlSWorld achievement IDs (entire system mismatch - 7 IDs) ✓
   - [x] Implement missing achievements in SimpleSnake (combo, power-up tracking) ✓
   - [x] Implement missing achievements in MatrixInvaders (bullet time, perfect wave, high score) ✓
   - [x] Implement missing achievements in Metris (perfect start, architect, t-spin) ✓
   - [x] Implement global achievement unlocking in App.tsx ✓
   - [x] Fix Date.now() usage in MatrixInvaders render loop - now uses RAF timestamp ✓
   - [x] SimpleSnake Date.now() - NOT AN ISSUE (state-based rendering, not RAF animation) ✓
   - [x] Replace MatrixInvaders setInterval with RAF - integrated into game loop ✓
   - [x] Fix MatrixCloud pause modal z-index bleeding ✓
   - [x] Add ENTER key support to TerminalQuest ✓
   - [ ] Add boss system to MatrixInvaders (blocks `invaders_boss_defeat` achievement)

2. **P2 - Medium Priority (Code Quality)**:
   - [ ] Remove/wrap console.log in usePerformanceMonitor (line 176)
   - [ ] Remove/wrap console.log in useSaveSystem migration (line 195)
   - [ ] Migrate GameStateContext to useSaveSystem
   - [ ] Track and cleanup MatrixInvaders timeouts

3. **P3 - Low Priority (Enhancements)**:
   - [ ] Add tests for useSoundSynthesis
   - [ ] Add tests for useProceduralAudio
   - [ ] Add tests for useParticleSystem
   - [ ] Expand MatrixCloud tests (17 → 40+)
   - [ ] Expand VortexPong tests (21 → 40+)
   - [ ] Consider archiving or integrating unused hooks

---

## Completed Fixes Log

### 25 January 2026 - Round 25 Fixes

**TerminalQuest Added to Main Menu:**
- Imported TerminalQuest component in App.tsx
- Added Terminal icon from lucide-react
- Added TerminalQuest to games array
- Games count now 7 (was 6)

**State Mutation Fixes:**
- MatrixCloud: Lines 554, 665-666, 714-799 - all using immutable patterns
- Metris: Line 921 - using glowRef Map separate from state

**Sound Gating:**
- All 7 games now have isMuted prop
- All sound calls properly gated with `if (!isMuted)`

**Keyboard Controls:**
- All games support P (pause), R (restart)
- Most support ENTER (start)
- ESC handled at App level

**Test Coverage:**
- All 7 games have test files
- 5/17 hooks have tests
- Total: 600+ test cases

**Lint Errors:**
- Fixed 107 lint errors across codebase
- Build succeeds with 0 errors

---

## TODO Comments in Codebase

Only 1 TODO comment found:
- `src/components/games/TerminalQuestContent.ts:427` - `// TODO: Remove before production` (intentional game content - developer room easter egg)

---

### 25 January 2026 - Round 28 Fixes

**Achievement ID System Overhaul:**
- SimpleSnake: Changed 5 achievement IDs to use `snake_` prefix (`snake_first_apple`, `snake_score_100`, `snake_score_500`, `snake_survivor`, `snake_speed_demon`)
- SimpleSnake: Removed non-existent `snake_master` achievement call
- MatrixCloud: Changed 4 achievement IDs to use `cloud_` prefix (`cloud_first_flight`, `cloud_level_5`, `cloud_boss_slayer`, `cloud_architect_defeat`)
- MatrixInvaders: Added 3 missing achievement definitions to useSaveSystem (`invaders_wave_10`, `invaders_endless`, `invaders_100_enemies`)
- CtrlSWorld: Complete achievement ID system overhaul - updated both useSaveSystem definitions and game code to use consistent `ctrl_` prefixed IDs (`ctrl_first_puzzle`, `ctrl_no_hints`, `ctrl_chapter_1`, `ctrl_chapter_3`, `ctrl_story_complete`, `ctrl_speed_reader`, `ctrl_puzzle_master`)
- Total achievements now: 63 (56 game + 7 global)

**Build Status:** ✓ Passes
**Tests:** 600 tests passing

---

### 25 January 2026 - Round 29 Fixes

**Achievement Implementations Complete:**

*SimpleSnake:*
- Added `consecutiveFood` tracking for chain reaction achievement
- Added `powerUpsCollected` and `powerUpTypesCollected` tracking
- `snake_combo_10` unlocks when eating 10 consecutive food items
- `snake_power_master` unlocks when collecting 10 power-ups in one game

*MatrixInvaders:*
- Added `bulletTimeUsedRef` tracking for bullet time usage
- Added `waveDamageTakenRef` for perfect wave tracking
- `invaders_bullet_time` unlocks after using bullet time 5 times
- `invaders_perfect_wave` unlocks when completing a wave without damage
- `invaders_high_score` unlocks when scoring 10,000+ points
- Note: `invaders_boss_defeat` blocked as no boss system exists

*Metris:*
- Added `maxFilledRowsRef` for architect achievement tracking
- Added `tSpinCountRef` and `lastRotationRef` for T-spin detection
- `perfect_start` unlocks when reaching level 5 or higher
- `architect` unlocks when building 18 rows without clearing
- `t_spin_master` unlocks after performing 5 T-spins

*Global Achievements (App.tsx):*
- `global_first_game` - triggers on first game play
- `global_all_games` - triggers when all 7 games played
- `global_10_achievements`, `global_25_achievements`, `global_50_achievements` - milestone achievements
- `global_night_owl` - triggers when playing between midnight and 5am
- `global_dedicated` - triggers after playing 7 consecutive days (uses localStorage for date tracking)

**Build Status:** ✓ Passes
**Tests:** 600 tests passing

---

### 25 January 2026 - Round 30 Fixes

**TerminalQuest ENTER Key Support:**
- Added ENTER key handling in keyboard handler
- ENTER skips typing effect if text is still animating
- ENTER resumes from pause state
- ENTER selects first enabled choice when choices are available
- Wrapped `handleChoice` and `applyChoiceEffects` in useCallback for proper React hooks usage

**MatrixCloud z-index Fix:**
- Added `z-10` to Enhanced HUD element (left side)
- Added `z-10` to Active Effects element (right side)
- Added `z-10` to Controls element (bottom right)
- Pause overlay (z-50) now properly covers all HUD elements
- Power-up guide text no longer bleeds through pause modal

**Code Quality:**
- All 600 tests passing
- No new lint warnings introduced
- TypeScript compilation clean

**Build Status:** ✓ Passes
**Tests:** 600 tests passing

---

### 25 January 2026 - Round 31 Fixes

**MatrixInvaders Performance Optimisation:**
- Fixed `Date.now()` usage in render loop by passing RAF timestamp to render function
- Line 518: Player invulnerability flash now uses `timestamp` parameter instead of `Date.now()`
- Line 564: Critical health pulse effect now uses `timestamp` parameter instead of `Date.now()`
- Removed competing `setInterval` for player movement (was lines 769-770)
- Integrated player movement into main RAF-based game loop via new `updatePlayer` callback
- Added `renderTimeRef` to track animation time consistently

**SimpleSnake Analysis:**
- Investigated `Date.now()` usage in SnakeCanvas (line 78)
- Determined NOT an issue: SimpleSnake uses React state-based rendering, not RAF animation
- Power-up expiration checks only run when state changes, not on every animation frame
- The setInterval-based game logic is appropriate for this design pattern

**Technical Details:**
- `render()` function now accepts `timestamp: number` parameter
- Player movement unified into single update loop (eliminates async timing issues)
- Frame-rate independent animations now consistent across all devices

**Build Status:** ✓ Passes
**Tests:** 600 tests passing
**TypeScript:** Clean compilation

---

*Generated by Ralph on 25 January 2026 - Round 31*
*Performance optimisations for MatrixInvaders animation loops complete*
