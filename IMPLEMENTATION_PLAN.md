# Matrix Arcade - Implementation Plan

This file is auto-generated and updated by Ralph during planning and building loops.

Run `./loop.sh plan` to analyse the codebase and generate tasks.

---

## Current State Summary

- **Games Implemented**: 8 (exceeds 6+ goal)
- **Games in Main Menu**: 6 active games (CtrlSWorld, SimpleSnake, VortexPong, MatrixCloud, MatrixInvaders, Metris)
- **Hidden Games**: 2 (TerminalQuest, TerminalQuestCombat - fully implemented but not in menu)
- **Achievement System**: 46 game achievements + 7 global = 53 total (TerminalQuest achievements NOT defined in useSaveSystem)
- **Hooks Library**: 18 shared hooks for games to use (3 have tests)
- **Hooks Test Coverage**: 3/18 (17%) - significant gap
- **Game Test Coverage**: 7/8 games have test files (87.5%) - only TerminalQuestCombat missing
- **Visual Consistency**: Strong Matrix theme throughout (green-on-black, glow effects, CRT aesthetic)
- **Console.log Statements**: 11 debug statements across 6 files (9 to remove, 1 to convert)
- **Legacy localStorage Usage**: 11 storage keys across 8 files still use direct localStorage
- **State Machine Compliance**: 1/8 games (12.5%) - Only SimpleSnake fully compliant
- **isMuted Prop Gating**: VortexPong COMPLIANT (9/9 gated), MatrixCloud COMPLIANT (8/8 gated), Metris COMPLIANT (11/11 gated), others missing prop entirely
- **Critical State Mutations**: All fixed - MatrixCloud and Metris now use immutable state updates
- **Last Analysis**: 25 January 2026 (Round 23 - comprehensive verification, updated with fixes)

---

## Priority Tasks

### P0 - Critical (Blocking User Experience)

- [x] **Remove excessive console.log debugging** in CtrlSWorld.tsx - 13 debug statements removed
- [x] **TerminalQuestContent.ts line 427** - Reviewed: "// TODO: Remove before production" is intentional game content (secret developer room narrative), not actual dev TODO
- [x] **Resolve dead code** in MatrixInvaders.tsx - Removed commented POWER_UPS object and unused POWER_UP_CHANCE constant

### P1 - High Priority (Spec Compliance)

#### Critical State Mutation Bugs (React Anti-Patterns) - FIXED

All critical state mutation bugs have been resolved:

| Game | Issue | Line(s) | Status |
|------|-------|---------|--------|
| MatrixCloud | `prev.powerUps.push()` mutates state directly | 554 | **FIXED** - Now uses spread operator with new array |
| MatrixCloud | Direct mutation of `pipe.passed` and `pipe.glowIntensity` | 665-666 | **FIXED** - Now tracks pipe indices and updates immutably via map |
| MatrixCloud | Boss object direct mutations | 714, 723, 725, 751, 757-758, 760, 786-788, 797-799 | **FIXED** - Now creates new objects with spread operator and uses flags for state changes |
| Metris | `state.grid[y][x].glow` mutated in render effect | 921 | **FIXED** - Now uses a `glowRef` Map to track glow values separately from React state |

#### Sound System Gating - MatrixCloud FIXED

| Game | Issue | Line(s) | Status |
|------|-------|---------|--------|
| MatrixCloud | Ungated `playSFX` calls | 667, 752, 761, 800 | **FIXED** - All now have proper `if (!isMuted)` checks |

#### Keyboard Control Standardisation

All games MUST support ESC (exit - handled by App.tsx), P (pause), R (restart), ENTER (start) per specs. Current gaps:

| Game | ESC (exit) | P (pause) | R (restart) | ENTER (start) | State Machine |
|------|------------|-----------|-------------|---------------|---------------|
| SimpleSnake | App-level | Works | Works | Works | **COMPLIANT** |
| VortexPong | App-level | Works | Works | Works | PARTIAL (no MENU state) |
| MatrixCloud | App-level | Works | Works | Works | PARTIAL (boolean flags) |
| MatrixInvaders | App-level | Works | **MISSING** | **MISSING** (auto-starts) | NOT COMPLIANT |
| Metris | App-level | Works | **MISSING** | Works | PARTIAL |
| CtrlSWorld | App-level | Works | **MISSING** | PARTIAL | NOT COMPLIANT |
| TerminalQuest | App-level | **MISSING** | **MISSING** | N/A | PARTIAL |
| TerminalQuestCombat | App-level | **MISSING** | **MISSING** | N/A | N/A |

**Note:** ESC key is handled globally in App.tsx (lines 359-364) for all games - no per-game implementation needed.

**Tasks:**
- [x] **SimpleSnake**: Keyboard controls fully compliant (P, R, ENTER all work)
- [ ] **SimpleSnake**: Remove duplicate keyboard handler in useSimpleSnakeGame.ts (lines 383-410) - redundant with component handler
- [ ] **SimpleSnake**: Replace inline Web Audio API (lines 474-523) with useSoundSystem hook for consistency
- [ ] **SimpleSnake**: Review console.error at useSimpleSnakeGame.ts line 156 - consider removing or converting to proper error handling
- [ ] **SimpleSnake**: Remove direct localStorage usage (lines 44, 208) - use useSaveSystem exclusively
- [ ] **SimpleSnake**: Consolidate dual achievement system (uses both achievementManager and useSaveSystem with different IDs)
- [x] **VortexPong**: Keyboard controls compliant (P, R, ENTER all work)
- [x] **VortexPong**: Sound calls verified as properly gated (all 9 playSFX calls have `if (!isMuted)` checks)
- [ ] **VortexPong**: Add IDLE/MENU state - game currently starts immediately without "Press ENTER to start"
- [ ] **VortexPong**: Fix Date.now() call at line 778 - should use props.timestamp for consistent animation timing
- [x] **MatrixCloud**: Has P, R, ENTER keys implemented (lines 827-845)
- [x] **MatrixCloud**: All 8 sound calls now properly gated with `if (!isMuted)` checks
- [x] **MatrixCloud**: State mutation bug fixed - line 554 now uses spread operator instead of `prev.powerUps.push()`
- [x] **MatrixCloud**: State mutations fixed at lines 665-666 (pipe.passed and pipe.glowIntensity now updated immutably via map)
- [x] **MatrixCloud**: Boss state mutations fixed at lines 714, 723, 725, 751, 757-758, 760, 786-788, 797-799 (now uses spread operator and flags)
- [ ] **MatrixCloud**: Fix pause modal text overlap with power-up guide (visible in e2e/screenshots/cloud-paused.png) - add z-index or hide guide during pause
- [ ] **MatrixInvaders**: Add R key binding to resetGame() (keyboard handler around line 621)
- [ ] **MatrixInvaders**: Add ENTER key to start/restart game
- [ ] **MatrixInvaders**: Add isMuted prop to interface (lines 69-71) and gate all 4 synthesis calls (lines 168, 190, 259, 289)
- [ ] **MatrixInvaders**: Add explicit MENU state (currently auto-starts with no menu)
- [ ] **Metris**: Add R key for restart (keyboard handler lines 733-842)
- [ ] **Metris**: Add levelUp sound when level increases (check at lines 518, 570 when newLevel > currentState.level)
- [ ] **Metris**: Remove duplicate localStorage usage (lines 212, 1011) - already uses useSaveSystem
- [x] **Metris**: State mutation bug fixed at line 921 - now uses `glowRef` Map to track glow values separately from React state
- [ ] **CtrlSWorld**: Add R key for restart (reset story progress)
- [ ] **CtrlSWorld**: Add explicit gameOver state for story completion tracking
- [ ] **CtrlSWorld**: Add isMuted prop to interface (lines 18-20) and implement useSoundSystem (currently placeholder at lines 457-461)
- [ ] **TerminalQuest**: Add keyboard event handler (currently no keyboard handling at all)
- [ ] **TerminalQuest**: Add P key for pause
- [ ] **TerminalQuest**: Add R key for restart
- [ ] **TerminalQuest**: Add isMuted prop to interface (lines 11-13) and gate all 6 sound calls (lines 99, 116, 120, 125, 128, 131)
- [ ] **TerminalQuest**: Migrate localStorage (lines 305, 310, 319) to useSaveSystem
- [ ] **TerminalQuestCombat**: Add keyboard controls (1-3 for quick actions, Enter to confirm)
- [ ] **TerminalQuestCombat**: Add isMuted and achievementManager props to interface (lines 6-11)
- [ ] **TerminalQuest**: Pass isMuted and achievementManager props to TerminalQuestCombat (lines 374-379)

#### Sound System Standardisation

All games MUST use useSoundSystem or useSoundSynthesis with proper isMuted gating.

| Game | Sound System | isMuted Prop | Gated Calls | Ungated Calls | Compliance |
|------|--------------|--------------|-------------|---------------|------------|
| VortexPong | useSoundSystem | Yes | 9/9 | 0 | **COMPLIANT** |
| MatrixCloud | useSoundSystem | Yes | 8/8 | 0 | **COMPLIANT** |
| Metris | useSoundSynthesis | Yes | 11/11 gated | Missing levelUp | **COMPLIANT** |
| TerminalQuest | useSoundSystem | **Missing** | 0/6 | 6 | NOT COMPLIANT |
| MatrixInvaders | useSoundSynthesis | **Missing** | 0/4 | 4 | NOT COMPLIANT |
| SimpleSnake | Inline WebAudio | Yes | Gated | N/A | NOT STANDARD |
| CtrlSWorld | Placeholder | **Missing** | N/A | N/A | NOT COMPLIANT |
| TerminalQuestCombat | None | **Missing** | N/A | N/A | NOT COMPLIANT |

**Tasks:**
- [x] **MatrixCloud**: All 8 sound calls now properly gated
- [ ] **TerminalQuest**: Add isMuted prop and gate all 6 sound calls (includes playMusic)
- [ ] **MatrixInvaders**: Add isMuted prop and gate all 4 synthesis calls
- [ ] **Metris**: Add levelUp sound when level increases
- [ ] **SimpleSnake**: Replace inline Web Audio API (lines 474-523) with useSoundSystem hook
- [ ] **CtrlSWorld**: Replace placeholder playSFX (lines 457-461) with actual useSoundSystem integration
- [ ] **TerminalQuestCombat**: Add useSoundSystem for attack, hit, powerup, gameOver sounds

#### Visual Bugs (Confirmed from Screenshots)

| Game | Issue | Screenshot | Fix |
|------|-------|------------|-----|
| MatrixCloud | Pause modal text overlaps power-up guide | cloud-paused.png | Add z-index to modal OR hide power-up guide during pause |
| SimpleSnake | Paused state shows START screen instead of PAUSED overlay | snake-paused.png | Fix state-dependent rendering to show correct overlay |

### P2 - Medium Priority (Code Quality & Performance)

#### Console.log Cleanup (9 to remove, 1 to convert)

| File | Lines | Count | Action |
|------|-------|-------|--------|
| GameStateContext.tsx | 359, 368, 378 | 3 | Remove success messages |
| PWAUpdatePrompt.tsx | 12 | 1 | Remove SW registration log |
| PWAUpdatePrompt.tsx | 15 | 1 | Convert to console.error (SW registration error) |
| SaveLoadManager.tsx | 45, 58 | 2 | Remove success messages |
| PWAInstallPrompt.tsx | 56, 58 | 2 | Remove install/dismiss tracking logs |

**Keep (appropriate):**
- All `console.error` and `console.warn` statements - proper error handling
- useSaveSystem.ts line 184 - migration logging (useful for debugging save migrations)
- usePerformanceMonitor.tsx line 176 - intentional performance monitoring

#### App.tsx Hardcoded Values & Duplication

| Issue | Line(s) | Action |
|-------|---------|--------|
| Hardcoded gameNames array | 111 | Replace with `games.map(g => g.title)` |
| Hardcoded game count `=== 6` | 119 | Replace with `games.length` |
| Inconsistent game count check | 632 | Uses `games.length` correctly - inconsistent with line 119 |
| ESC handler missing play time tracking | 359-364 | Add play time tracking to match exit button (lines 511-523) |
| Duplicate play time calculation | 511-523, 644-658 | Extract to shared `handleGameExit()` function |
| Missing isMuted prop in preview render | 570 | Add isMuted prop to preview GameComponent |

#### useSaveSystem Gaps

| Issue | Line(s) | Action |
|-------|---------|--------|
| Missing terminalQuest in type | 20-29 | Add `terminalQuest: GameSaveData` to GlobalSaveData['games'] |
| Missing terminalQuest in defaults | 58-77 | Add `terminalQuest: createDefaultGameSave()` |
| Missing terminalQuest achievements | 93-152 | Add terminalQuest section to GAME_ACHIEVEMENTS with 7 achievements |
| Incorrect game count in description | 157 | Change "Play all 5 games" to "Play all 7 games" (including TerminalQuest) |

**TerminalQuest Achievement IDs to add:**
- `quest_first_choice` - First choice made
- `quest_tool_collector` - Collected tools
- `quest_survivor` - Survived encounter
- `quest_code_master` - Code mastery
- `quest_team_leader` - Team leadership
- `quest_story_end` - Story completion
- `quest_combat_victor` - Combat victory

#### Legacy localStorage Usage

| File | Lines | Current Usage | Action |
|------|-------|---------------|--------|
| Metris.tsx | 212, 1011 | localStorage for highScore | Remove duplicate (already uses useSaveSystem at lines 641-650) |
| MatrixInvaders.tsx | 96, 709, 742 | localStorage for highScore | Remove (already uses useSaveSystem at lines 694-710) |
| TerminalQuest.tsx | 305, 310, 319 | Direct localStorage for save/load | Migrate to useSaveSystem |
| useSimpleSnakeGame.ts | 44, 208 | localStorage for highScore | Migrate to useSaveSystem |
| useLifelineManager.ts | 29, 77 | localStorage for lifeline state | Consider migrating to useSaveSystem for consistency |
| useSoundSystem.ts | 217, 504 | Audio configuration | Keep - user preferences |
| useAdvancedVoice.ts | 179, 227 | Voice configuration | Keep - user preferences |
| useShatnerVoice.ts | 78, 95 | Shatner voice configuration | Keep - user preferences |
| GameStateContext.tsx | 143, 358, 363, 377 | CTRL-S World game state | Consider consolidating with useSaveSystem |

### P3 - Low Priority (Enhancements)

#### Missing Game Exposure

TerminalQuest is fully implemented but hidden from the main menu.

- [ ] **TerminalQuest**: Import in App.tsx and add to games array
- [ ] **App.tsx**: Update hardcoded gameNames array to include 'Terminal Quest'
- [ ] **App.tsx**: Derive game count from games.length instead of hardcoded numbers

**TerminalQuest Features Already Implemented:**
- ASCII art animations and typing effects
- Inventory system with items
- Turn-based combat system (TerminalQuestCombat.tsx)
- Health and security level tracking
- Multiple story paths and endings
- 7 achievement unlock calls (but IDs not defined in save system)
- Sound effects via useSoundSystem (but ungated)
- Manual save/load via localStorage (not useSaveSystem - needs migration)

#### Test Coverage Expansion

**Game Components (7/8 have tests - 87.5%):**
| Component | Test Status | Test Count |
|-----------|-------------|------------|
| SimpleSnake.tsx | Has tests | 37 |
| VortexPong.tsx | Has tests | 22 |
| MatrixCloud.tsx | Has tests | 60 |
| MatrixInvaders.tsx | Has tests | 72 |
| Metris.tsx | Has tests | 41 |
| CtrlSWorld.tsx | Has tests | 29 |
| TerminalQuest.tsx | Has tests | 29 |
| TerminalQuestCombat.tsx | **MISSING - CRITICAL** | 0 |

**Total Game Test Cases: 290**

**Hooks (3/18 have tests - 17%):**
| Hook | Test Status | Priority | LOC |
|------|-------------|----------|-----|
| useAdvancedVoice.ts | Has tests (19 tests) | - | 503 |
| useMobileDetection.ts | Has tests (15 tests) | - | 47 |
| useSoundSystem.ts | Has tests (21 tests) | - | 575 |
| useSaveSystem.ts | MISSING | **Critical** | 481 |
| useSimpleSnakeGame.ts | MISSING | **Critical** | 419 |
| useSoundSynthesis.ts | MISSING | **Critical** | 367 |
| useProceduralAudio.ts | MISSING | **Critical** | 360 |
| useParticleSystem.ts | MISSING | High | 304 |
| useShatnerVoice.ts | MISSING | High | 273 |
| useObjectPool.ts | MISSING | High | 267 |
| useAchievementManager.ts | MISSING | High | 176 |
| useViewportCulling.ts | MISSING | High | 168 |
| usePerformanceMonitor.tsx | MISSING | Medium | 213 |
| useLifelineManager.ts | MISSING | Medium | 219 |
| usePowerUps.ts | MISSING | Medium | 48 |
| useGameLoop.ts | MISSING | Medium | 24 |
| useInterval.ts | MISSING | Low | 15 |

**UI Components (7/23 have tests - 30%):**
Tested: MobileWarning, AdvancedVoiceControls, TransitionParticles, ScoreBoard, InventoryPanel, PuzzleModal, StatsHUD
Missing tests for: AchievementDisplay, AchievementNotification, AchievementToast, AudioSettings, CharacterConversationModal, GameOverModal, PWAInstallPrompt, PWAUpdatePrompt, PowerUpIndicator, SaveLoadManager, SentientAIModal, ShatnerVoiceControls, and 4 others

---

## Architecture Notes

### Hooks Available (use these, do not reinvent)

**Core Game Hooks (18 total):**
- `useGameLoop` - RAF with delta time, auto-cleanup
- `useSoundSystem` - Standard SFX library with 14 predefined effects (jump, hit, score, powerup, levelUp, combo, gameOver, menu, select, snakeEat, pongBounce, terminalType, matrixRain)
- `useSoundSynthesis` - Procedural audio (synthLaser, synthExplosion, synthPowerUp, synthDrum, synthVoice)
- `useSaveSystem` - High scores, achievements, game stats, export/import with automatic backup
- `useAchievementManager` - Achievement notifications and tracking with modal display

**Performance Hooks:**
- `useObjectPool` - Memory-efficient object reuse with specialised pools for particles/projectiles/enemies
- `useParticleSystem` - Pooled particle effects with 6 types (food, explosion, trail, powerup, matrix, impact)
- `useViewportCulling` - Off-screen object culling with spatial grid support
- `usePerformanceMonitor` - FPS tracking, memory usage, and optimisation suggestions

**Utility Hooks:**
- `useInterval` - Declarative setInterval with cleanup (null delay to pause)
- `usePowerUps` - Power-up spawning and activation for VortexPong
- `useMobileDetection` - Device type detection (mobile, tablet, desktop, touch)
- `useProceduralAudio` - Engine sounds, collisions, adaptive music, 3D spatial audio

**CtrlSWorld Specific:**
- `useShatnerVoice` - Dramatic TTS with pauses, emphasis words, theatrical patterns
- `useAdvancedVoice` - Multiple personas (captain, oracle, architect, narrator, glitch) with SSML and emotion detection
- `useLifelineManager` - Puzzle lifeline system (free answers, 50/50, AI, characters)

**Game-Specific:**
- `useSimpleSnakeGame` - Complete snake game logic with power-ups and state machine

### State Machine Pattern (all games MUST follow)
```
IDLE/MENU -> PLAYING -> PAUSED -> PLAYING -> GAME_OVER
                ^                             |
                +-------- RESTART ------------+
```

**Current State Machine Compliance:**
| Game | Implementation | States Present | Status |
|------|---------------|----------------|--------|
| SimpleSnake | String enum ('menu' \| 'playing' \| 'paused' \| 'gameOver') | All 4 | **COMPLIANT** |
| VortexPong | Boolean flags (gameOver, isPaused) | 3 of 4 (no menu) | PARTIAL |
| MatrixCloud | Multiple booleans (started, gameOver, paused) | All 4 | PARTIAL |
| MatrixInvaders | Multiple booleans (gameOver, paused) | 3 of 4 (no menu) | NOT COMPLIANT |
| Metris | Multiple booleans (waiting, gameOver, paused) | All 4 | PARTIAL |
| CtrlSWorld | Multiple booleans (isStarted, isPaused) | 3 of 4 (no gameOver) | NOT COMPLIANT |
| TerminalQuest | String nodes (currentNode) + booleans | 3 of 4 (no paused) | PARTIAL |
| TerminalQuestCombat | N/A - subcomponent | N/A | N/A |

### Required Keyboard Shortcuts
| Key | Action | Required |
|-----|--------|----------|
| ESC | Exit to menu | Yes (App-level, lines 359-364) |
| P | Pause/resume | Yes |
| R | Restart | Yes |
| ENTER | Start game | Yes |
| Arrow keys | Primary movement | Yes |
| WASD | Alt movement | Recommended |
| SPACE | Primary action | Where applicable |
| M | Toggle mute | Recommended |

### Required Props Interface
```typescript
interface GameProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;  // Default: false
}
```

### Reference Implementations
- **State machine pattern:** SimpleSnake.tsx / useSimpleSnakeGame.ts (proper 4-state enum)
- **Canvas rendering + hooks:** VortexPong.tsx (uses useGameLoop, useSoundSystem, useSaveSystem, usePowerUps) - All 9 sound calls properly gated
- **Immutable state updates:** MatrixCloud.tsx (uses spread operators and flags for state changes)
- **Sound synthesis:** MatrixInvaders.tsx, Metris.tsx (useSoundSynthesis)
- **Object pooling:** MatrixInvaders.tsx
- **Narrative game:** CtrlSWorld.tsx (useAdvancedVoice, useLifelineManager)
- **Text adventure:** TerminalQuest.tsx (useSoundSystem, node-based flow)

---

## Compliance Summary by Game

| Game | Controls | Sound | isMuted Prop | State Machine | Achievements | SaveSystem | Overall |
|------|----------|-------|--------------|---------------|--------------|------------|---------|
| SimpleSnake | 100% | Inline WebAudio | Yes | **COMPLIANT** | Dual system | Hybrid | 75% |
| VortexPong | 100% | 9/9 gated | Yes | PARTIAL | Integrated | 100% | **90%** |
| MatrixCloud | 100% | 8/8 gated | Yes | PARTIAL | Integrated | 100% | **85%** |
| MatrixInvaders | 50% | 0/4 gated | **Missing** | NOT COMPLIANT | Integrated | Hybrid | 40% |
| Metris | 65% | 11/11 gated | Yes | PARTIAL | Integrated | Hybrid | 75% |
| CtrlSWorld | 75% | Placeholder | **Missing** | NOT COMPLIANT | Integrated | 100% | 45% |
| TerminalQuest | 0% | 0/6 gated | **Missing** | PARTIAL | Partial | localStorage | 25% |
| TerminalQuestCombat | 0% | None | **Missing** | N/A | None | N/A | 15% |

---

## Quick Reference: Priority Order for Implementation

1. **P1 - High Priority (Spec Compliance)**:
   - ~~Fix critical state mutations in MatrixCloud (lines 554, 665-666, 714, 751, 757-760, 786-788, 797-799)~~ **DONE**
   - ~~Fix state mutation in Metris (line 921)~~ **DONE**
   - ~~Gate all MatrixCloud sound calls~~ **DONE**
   - Add isMuted prop to MatrixInvaders, TerminalQuest, TerminalQuestCombat, CtrlSWorld
   - Gate all ungated sound calls (MatrixInvaders 4, TerminalQuest 6)
   - Add R key to MatrixInvaders, Metris, CtrlSWorld
   - Add ENTER key to MatrixInvaders
   - Fix MatrixCloud pause modal text overlap
   - Fix SimpleSnake paused state showing start screen

2. **P2 - Medium Priority (Code Quality)**:
   - Console.log cleanup (9 to remove, 1 to convert)
   - App.tsx: Replace hardcoded gameNames and game count with dynamic values
   - App.tsx: Fix ESC handler missing play time tracking
   - App.tsx: Extract duplicate play time calculation to shared function
   - useSaveSystem: Add terminalQuest support and fix game count description

3. **P3 - Low Priority (Enhancements)**:
   - TerminalQuest menu integration
   - localStorage migration to useSaveSystem
   - Test coverage expansion (hooks priority: useSaveSystem, useSimpleSnakeGame, useSoundSynthesis, useProceduralAudio)
   - SimpleSnake sound system migration to useSoundSystem

---

## Completed Fixes Log

### 25 January 2026 - State Mutation & Sound Gating Fixes

**MatrixCloud State Mutations (FIXED):**
- Line 554: `prev.powerUps.push()` - Changed to use spread operator with a new array
- Lines 665-666: Direct mutation of `pipe.passed` and `pipe.glowIntensity` - Changed to track pipe indices and update immutably via map
- Lines 714, 723, 725, 751, 757-758, 760, 786-788, 797-799: Boss object mutations - Changed to create new objects with spread operator and use flags for state changes

**Metris State Mutation (FIXED):**
- Line 921: `state.grid[y][x].glow` mutated in render effect - Changed to use a `glowRef` Map to track glow values separately from React state

**MatrixCloud Sound Gating (FIXED):**
- Lines 667, 752, 761, 800 - All ungated `playSFX` calls now have proper `if (!isMuted)` checks

---

## Round 23 Verification Notes (25 January 2026)

### Analysis Method
- 20 parallel Opus and Sonnet subagents for comprehensive spec analysis
- Individual game compliance audits for all 8 games using Opus
- Full spec review (game-architecture.md, ux-guidelines.md, new-game-template.md)
- Complete hooks library inventory (18 hooks documented with full API reference)
- Console.log audit: 11 statements across 6 files
- localStorage usage audit: 51 operations across 13 files
- E2E screenshot review for visual bugs (71 screenshots analysed)
- TODO/FIXME/HACK comment search (1 found - intentional game content)
- Test coverage analysis (290 game tests, 55 hook tests, 7 UI component test files)

### Visual Bug Confirmation (from Screenshots)

| Screenshot | Issue | Confirmed |
|------------|-------|-----------|
| cloud-paused.png | Power-up guide text visible behind pause modal ("Shield Protec", "ime Manipulation", "Extra L", "ultiplier") | **YES** |
| snake-paused.png | Shows START screen ("Press ENTER or SPACE to start") instead of PAUSED overlay | **YES** |
| metris-paused.png | RESUME button correctly displayed, game properly paused | **PASS** |

### Key Findings - Status Update

1. **MatrixCloud State Mutations** - **FIXED**:
   - Line 554: Now uses spread operator
   - Lines 665-666: Now uses immutable map updates
   - Lines 714, 723, 725, 751, 757-758, 760, 786-788, 797-799: Now uses spread operator and flags

2. **Metris State Mutation** - **FIXED**:
   - Line 921: Now uses `glowRef` Map separate from React state

3. **MatrixCloud Sound Gating** - **FIXED**:
   - All 8 playSFX calls now properly gated with `if (!isMuted)` checks

4. **SimpleSnake Dual Keyboard Handler** (still pending):
   - Component handler at lines 351-398
   - Hook handler at lines 383-410 (redundant)
   - Should consolidate to avoid conflicts

5. **VortexPong Date.now() Issue** (line 778) (still pending):
   - Uses `Date.now()` directly in render for multi-ball indicator animation
   - Should use `props.timestamp` for consistency with other animations (lines 675, 739)

6. **TerminalQuest No Keyboard Handler** (still pending):
   - No useEffect with keydown listener at all
   - Missing P (pause), R (restart) functionality
   - Missing isMuted prop and sound gating

7. **useSaveSystem Missing TerminalQuest** (still pending):
   - Not in GlobalSaveData interface (lines 20-29)
   - Not in default save creation (lines 58-77)
   - Achievements not defined (lines 93-152)
   - Description says "Play all 5 games" instead of 7 (line 157)

### Compliance Metrics Summary

**Overall Spec Compliance:**
- State machine: 1/8 (12.5%)
- Keyboard controls: 2/8 (25%)
- Props interface (isMuted): 4/8 (50%)
- Sound gating: 3/8 (37.5%) - improved from 25%
- State mutations: 8/8 (100%) - improved from 75%
- Save system: 3/8 (37.5%)
- Matrix theme: 8/8 (100%)

**Average Game Compliance: 58%** (improved from 54%)

---

*Generated by Ralph on 25 January 2026 - Round 23 comprehensive verification*
*Updated with completed fixes for MatrixCloud and Metris state mutations and sound gating*
