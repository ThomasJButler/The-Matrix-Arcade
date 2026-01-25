# Matrix Arcade - Implementation Plan

This file is auto-generated and updated by Ralph during planning and building loops.

Run `./loop.sh plan` to analyse the codebase and generate tasks.

---

## Current State Summary

- **Games Implemented**: 8 (exceeds 6+ goal)
- **Games in Main Menu**: 7 active games (CtrlSWorld, SimpleSnake, VortexPong, MatrixCloud, MatrixInvaders, Metris, TerminalQuest)
- **Hidden Games**: 1 (TerminalQuestCombat - combat subcomponent of TerminalQuest)
- **Achievement System**: 64 total achievements defined (57 game + 7 global) - added pong_power_master
- **Hooks Library**: 17 shared hooks for games to use
- **Hooks Test Coverage**: 11/17 (65%)
- **Game Test Coverage**: 8/8 games have test files (100%)
- **Visual Consistency**: Strong Matrix theme throughout (green-on-black, glow effects, CRT aesthetic)
- **Console Statements**: 21 total (2 wrapped with env checks, 18 in error/warn handlers - acceptable for debugging, 1 in quiz content)
- **Legacy localStorage Usage**: 4 files use direct localStorage (1 for game data, 3 for user preferences)
- **State Machine Compliance**: 6/8 games (75%) - SimpleSnake, VortexPong, MatrixInvaders, Metris, MatrixCloud, TerminalQuestCombat compliant
- **isMuted Prop Gating**: All 8 games have isMuted prop and gate sound calls properly
- **Achievement Persistence**: All games now persist achievements correctly (TerminalQuest fixed Round 50)
- **Keyboard Controls**: All 7 main games COMPLIANT with standard controls (P, R, ENTER, ESC) - ESC handled at App level and in-game
- **Last Analysis**: Round 58 - Migrated GameStateContext.tsx game state to useSaveSystem

---

## Priority Tasks

### P0 - Critical (Blocking User Experience)

#### 1. VortexPong ENTER Key Focus Issue

**Issue:** VortexPong displays "Press ENTER to start" but ENTER key may not work reliably due to focus management.

**Root Cause (Verified Round 47):**
- ENTER key handler IS correctly implemented at lines 223-227
- Handler calls `resetGame()` when `showMenu || gameOver` is true
- Event listener attached to `window` (lines 249-255) which should work
- **BUT**: ENTER key handler lacks `e.preventDefault()` unlike other key handlers
- Main game container at line 823 lacks `tabIndex` attribute
- No auto-focus on mount

**Recommended Fix:**
```typescript
// Line 223-227 - Add e.preventDefault()
} else if (e.key === 'Enter') {
  e.preventDefault();  // ADD THIS
  if (showMenu || gameOver) {
    resetGame();
  }
}

// Line 823 - Add tabIndex to main container
<div
  className="h-full w-full flex items-center justify-center bg-black relative"
  tabIndex={0}
  ref={containerRef}
>

// Add useEffect to auto-focus on mount
useEffect(() => {
  containerRef.current?.focus();
}, []);
```

**Additional Issues Found (Round 48):**
- 2 setTimeout calls without cleanup refs (lines 185, 530)
- `Date.now()` used in render function (line 641) - passed as timestamp prop

**Files Affected:**
- `src/components/games/VortexPong.tsx` (lines 185, 223-227, 530, 641, 823)

---

#### 2. CtrlSWorld UX Overhaul (USER REQUEST) - PARTIALLY COMPLETED

**User Request:** Have 5 chapters playable individually - game is too long and people get lost. Make it Citizen Sleeper-like.

**Status (Round 54):**
- [x] Chapter selection hub implemented (Citizen Sleeper-inspired visual chapter cards)
- [x] ESC key handler implemented for closing modals/panels
- [x] All sound calls standardised to use `playSFX` wrapper (4 direct calls fixed)
- [x] Chapter Select button added to settings panel during gameplay
- [x] Chapter Select option on game complete screen
- [ ] Full state machine refactor to unified UIState enum (P2 - still pending)

**Original Issues (Verified Round 47):**
- Game has 6 chapters (Prologue + 5 main) with 19 puzzles total
- ~~**No chapter selection menu** - must play from beginning (linear progression only)~~ **FIXED**
- **11 independent boolean states** create 2,048 possible (mostly invalid) state combinations:
  - Game State (4): `isTyping`, `isStarted`, `isPaused`, `isGameComplete`
  - UI State (7): `isFullscreen`, `showInfo`, `showPuzzle`, `showInventory`, `showAudioSettings`, `showSaveManager`, `userHasScrolled`
- ~~No hub-based navigation~~ **FIXED**
- ~~**ESC key NOT implemented** - UI promises it at line 1401 ("Press R to restart or ESC to exit") but no handler exists~~ **FIXED**
- ~~Cannot replay completed chapters without full restart~~ **FIXED**
- ~~**Inconsistent sound calls** - `playSFX` wrapper defined (lines 456-460) but bypassed 4 times~~ **FIXED**
- **Redundant achievement call** at line 835 - calls `gameState.unlockAchievement()` after wrapper

**Remaining Work (P2):**
1. Consolidate state machine (11 booleans -> unified UIState enum):
   ```typescript
   type GameUIState =
     | { mode: 'menu' }
     | { mode: 'hub'; selectedChapter?: number }
     | { mode: 'playing'; chapterId: number; paused: boolean }
     | { mode: 'puzzle'; puzzleId: string }
     | { mode: 'modal'; modalType: 'info' | 'audio' | 'save' | 'inventory' }
     | { mode: 'complete' };
   ```

**Files Affected:**
- `src/components/games/CtrlSWorld.tsx` (1500+ lines - state machine refactor pending)

---

#### 3. TerminalQuest Achievement Persistence Bug

**Issue:** Achievements are unlocked via `achievementManager` but NOT persisted to `useSaveSystem`. Players lose achievements between sessions.

**Verified (Round 47):**

**Line 90 - Current useSaveSystem destructuring:**
```typescript
const { saveData, updateGameSave } = useSaveSystem();
```
**Missing:** `unlockAchievement: unlockSaveAchievement`

**Lines 93-97 - Current unlockAchievement function (BROKEN):**
```typescript
const unlockAchievement = useCallback((achievementId: string) => {
  if (achievementManager?.unlockAchievement) {
    achievementManager.unlockAchievement('terminalQuest', achievementId);
  }
}, [achievementManager]);
```

**Required fix:**
```typescript
// Line 90 - Add unlockSaveAchievement to destructuring
const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();

// Lines 93-97 - Call both systems
const unlockAchievement = useCallback((achievementId: string) => {
  if (achievementManager?.unlockAchievement) {
    achievementManager.unlockAchievement('terminalQuest', achievementId);
  }
  unlockSaveAchievement('terminalQuest', achievementId);
}, [achievementManager, unlockSaveAchievement]);
```

**All 7 achievement unlock calls in TerminalQuest affected:**
| Line | Achievement ID | Trigger |
|------|----------------|---------|
| 157 | `quest_first_choice` | First choice made |
| 162 | `quest_tool_collector` | Inventory has 5+ items |
| 167 | `quest_survivor` | Full health after 10+ choices |
| 172 | `quest_code_master` | Security level >= 90 |
| 177 | `quest_team_leader` | Health >= 80 |
| 183 | `quest_story_end` | Reached ending node |
| 304 | `quest_combat_victor` | Won 10+ combats |

**Reference:** CtrlSWorld correctly calls BOTH achievementManager AND unlockSaveAchievement (lines 463-468).

**Files Affected:**
- `src/components/games/TerminalQuest.tsx` (lines 90, 93-97)

---

#### 4. Missing Achievement Definition - VortexPong

**Issue:** VortexPong.tsx:349 unlocks `pong_power_master` which is NOT defined in useSaveSystem.ts GAME_ACHIEVEMENTS.

**VortexPong achievement IDs used in code (7 total):**
| Line | Achievement ID | Defined? |
|------|----------------|----------|
| 349 | `pong_power_master` | **NO** |
| 419 | `pong_combo_king` | Yes |
| 421 | `pong_rally_master` | Yes |
| 483 | `pong_first_point` | Yes |
| 546 | `pong_beat_ai` | Yes |
| 550 | `pong_perfect_game` | Yes |
| 556 | `pong_multi_ball` | Yes |

**VortexPong achievements defined in useSaveSystem.ts (6 total, lines 105-111):**
- pong_first_point, pong_beat_ai, pong_perfect_game, pong_multi_ball, pong_combo_king, pong_rally_master

**Fix Required:** Add `pong_power_master` to `GAME_ACHIEVEMENTS['vortexPong']` in useSaveSystem.ts after line 111:
```typescript
{ id: 'pong_power_master', name: 'Power Master', description: 'Collect 5 power-ups in one game', game: 'Vortex Pong' },
```

**Files Affected:**
- `src/hooks/useSaveSystem.ts` (line 111)

---

#### 5. TerminalQuest Local-Only Achievements (NEW - Round 49)

**Issue:** Lines 143-151 track 3 achievements that never propagate to the global system:

```typescript
// Line 144 - Only stored in local gameState.achievements array
if (newGameState.stats.xp >= 100 && !gameState.achievements.includes('first_100_xp')) {
  newAchievements.push('first_100_xp');
}
// Line 147
if (newGameState.stats.combatsWon >= 1 && !gameState.achievements.includes('first_combat')) {
  newAchievements.push('first_combat');
}
// Line 150
if (newGameState.inventory.length >= 10 && !gameState.achievements.includes('collector')) {
  newAchievements.push('collector');
}
```

**Problem:** These are added to the component's internal `gameState.achievements` array but NEVER call:
- `achievementManager.unlockAchievement()` - no UI notification
- `unlockSaveAchievement()` - no persistence

**Options:**
1. Add these 3 achievement IDs to `GAME_ACHIEVEMENTS['terminalQuest']` in useSaveSystem.ts and call `unlockAchievement()` properly
2. Remove this dead code if the achievements are not intended

**Files Affected:**
- `src/components/games/TerminalQuest.tsx` (lines 143-151)
- `src/hooks/useSaveSystem.ts` (if adding definitions)

---

### P1 - High Priority (Spec Compliance & Memory Safety)

#### 5. Memory Leak - Untracked Timeouts (All Fixed)

**All setTimeout calls now have proper cleanup refs:**

| File | Lines | Count | Purpose | Status |
|------|-------|-------|---------|--------|
| TerminalQuest.tsx | 113, 219 | 2 | Screen shake, background glitch | **FIXED** |
| TerminalQuestCombat.tsx | 87, 95, 112, 150, 164, 174, 182 | 7 | Combat flow, enemy turns, victory/defeat | **FIXED** |
| CtrlSWorld.tsx | 608, 660, 723, 845, 898 | 5 | Page transitions, auto-advance, puzzle resume | **FIXED** |
| Metris.tsx | 720 | 1 | Save game stats | **FIXED** |
| VortexPong.tsx | 185, 530 | 2 | Screen shake reset, save delay | **FIXED** |
| MatrixCloud.tsx | 436, 495-506, 671, 825 | 4 | Achievement delay, save delay, boss spawn, invulnerability | **FIXED** |

**Total: 0 untracked setTimeout calls (was 21)**

**Reference Implementation (MatrixInvaders.tsx lines 129-132, 993-1008):**
```typescript
// Declare refs
const invulnerabilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const bulletTimeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// When setting timeout - clear before setting
if (invulnerabilityTimeoutRef.current) {
  clearTimeout(invulnerabilityTimeoutRef.current);
}
invulnerabilityTimeoutRef.current = setTimeout(() => {
  // ... logic
  invulnerabilityTimeoutRef.current = null;  // Clear ref after completion
}, delay);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (invulnerabilityTimeoutRef.current) clearTimeout(invulnerabilityTimeoutRef.current);
    if (bulletTimeTimeoutRef.current) clearTimeout(bulletTimeTimeoutRef.current);
  };
}, []);
```

**Files Affected:**
- `src/components/games/TerminalQuest.tsx` (2 timeouts)
- `src/components/games/TerminalQuestCombat.tsx` (7 timeouts)
- `src/components/games/CtrlSWorld.tsx` (5 timeouts)
- `src/components/games/Metris.tsx` (1 timeout)
- `src/components/games/VortexPong.tsx` (2 timeouts)
- `src/components/games/MatrixCloud.tsx` (4 timeouts: lines 436, 495-506, 671, 825)

---

#### 6. Performance Issue - Date.now() in Animation Loops (All Fixed)

| Game | Issue | Lines | Impact | Status |
|------|-------|-------|--------|--------|
| MatrixCloud | 4x `Date.now()` in boss movement calculations | 352, 356, 357, 361 | 60 FPS x 30s = 7,200+ syscalls per boss | **FIXED** |
| MatrixInvaders | `Date.now()` in render function for hit timing | 728 | Called every render frame | **FIXED** |

**MatrixCloud Fix Applied:**
- Added `elapsedTime` field to Boss interface
- Initialised `elapsedTime: 0` in `createBoss` function
- Updated `updateBoss` to increment `elapsedTime` by `deltaTime` each frame
- All boss movement patterns (agent_smith, sentinel, architect) now use `elapsedTime` for deterministic movement

**MatrixInvaders Fix Applied:**
- Changed `Date.now()` to use `timestamp` parameter already available in render function
- Hit timing calculation now uses consistent frame timestamp

**Files Affected:**
- `src/components/games/MatrixCloud.tsx` (Boss interface, createBoss, updateBoss)
- `src/components/games/MatrixInvaders.tsx` (render function)

---

#### 7. TerminalQuestCombat Stale Closure & State Issues (COMPLETED - Round 53)

**Fixed:**

**CombatPhase Discriminated Union Type Added:**
```typescript
type CombatPhase =
  | 'player_ready'
  | 'player_attacking'
  | 'player_defending'
  | 'player_using_item'
  | 'enemy_turn'
  | 'victory'
  | 'defeat';
```

**Refactoring Completed:**
- Replaced `isPlayerTurn` and `isAnimating` boolean flags with single `combatPhase` state
- Added derived state variables for backwards compatibility
- Fixed stale closure issues by capturing damage values before async callbacks
- All 48 TerminalQuestCombat tests pass
- Full test suite of 959 tests pass

**Files Affected:**
- `src/components/games/TerminalQuestCombat.tsx`

---

### P2 - Medium Priority (Code Quality & Architecture)

#### 8. localStorage Architecture - Direct Usage Outside useSaveSystem

**Files requiring migration to useSaveSystem:**

| File | Key | Lines | Category | Status |
|------|-----|-------|----------|--------|
| App.tsx | `matrix-arcade-play-dates` | 109, 119 | Global achievement data | **MIGRATED** |
| GameStateContext.tsx | `matrix-arcade-ctrls-save` | 143, 358, 362, 375 | CTRL-S World game state | **MIGRATED** |
| useLifelineManager.ts | `ctrlsworld_lifelines` | 29, 77 | CTRL-S World lifeline state | **MIGRATED** |

**Files correctly using separate localStorage (user preferences - no migration needed):**
- useSoundSystem.ts (`matrix-arcade-audio-config`)
- useAdvancedVoice.ts (`matrix-arcade-advanced-voice`)
- useShatnerVoice.ts (`matrix-arcade-shatner-voice`)

**Recommended Migration:**
1. ~~Add `playDates: string[]` to `GlobalSaveData.globalStats` for App.tsx~~ **DONE Round 56**
2. ~~Integrate CtrlSWorld saves into unified save system~~ **DONE Round 58**
3. ~~Add lifeline state to CtrlSWorld game save data~~ **DONE Round 57**

---

#### 9. VortexPong Missing useObjectPool Integration

**Issue:** VortexPong does not use `useObjectPool` hook despite creating/destroying balls and impact effects frequently.

**Current Pattern:**
- Balls created/destroyed dynamically
- Impact effects array managed manually
- Potential memory fragmentation

**Recommended:** Integrate `useObjectPool` for:
- Multi-ball management
- Impact effect particles

**Files Affected:**
- `src/components/games/VortexPong.tsx`

---

#### 10. Hook Standardisation Opportunities

| Pattern | Currently Used By | Could Also Use |
|---------|-------------------|----------------|
| useGameLoop | VortexPong only | MatrixCloud, MatrixInvaders (have custom RAF) |
| useParticleSystem | VortexPong only | MatrixCloud (has custom particles) |
| useObjectPool | MatrixInvaders only | VortexPong (multi-ball management) |

**Note:** Current implementations work; standardisation is nice-to-have for consistency.

---

### P3 - Low Priority (Enhancements & Polish)

#### 11. Test Coverage Expansion

**Hooks Without Tests (6/17):**

| Hook | Size | Priority | Complexity |
|------|------|----------|------------|
| useViewportCulling | 4.6 KB | High | Sophisticated spatial culling |
| usePerformanceMonitor | 6.4 KB | High | FPS tracking, suggestions |
| useLifelineManager | 5.8 KB | High | Lifeline state management |
| usePowerUps | 1.5 KB | Medium | Power-up spawning/activation |
| useGameLoop | 750 B | Low | Simple RAF wrapper |
| useInterval | 427 B | Low | Simple interval wrapper |

**Hooks With Tests (11/17):**
- useSimpleSnakeGame (81 tests)
- useSaveSystem (61 tests)
- useAchievementManager (64 tests)
- useShatnerVoice (81 tests)
- useObjectPool (74 tests)
- useParticleSystem (92 tests)
- useProceduralAudio (62 tests)
- useSoundSynthesis (75 tests)
- useAdvancedVoice (21 tests)
- useSoundSystem (22 tests)
- useMobileDetection (16 tests)

**Total hook tests: ~709**

**Game Test Coverage Assessment:**

| Game | Test Count | Quality |
|------|------------|---------|
| MatrixInvaders | 56 | Excellent - comprehensive mechanics testing |
| TerminalQuestCombat | 48 | Excellent - thorough combat flow testing |
| Metris | 39 | Good - covers core functionality |
| SimpleSnake | 32 | Good - controls and state well tested |
| CtrlSWorld | 24 | Moderate - mostly rendering/interaction |
| TerminalQuest | 22 | Minimal - shallow, needs expansion |
| MatrixCloud | 21 | Moderate - UI focused |
| VortexPong | 18 | Minimal - needs significant expansion |

**Priority for expansion:** VortexPong, TerminalQuest, MatrixCloud

---

#### 12. TODO Comments Review

**Only 1 TODO comment found in codebase:**
- `src/components/games/TerminalQuestContent.ts:427` - `// TODO: Remove before production`
- **Context:** Developer debug room with God Mode - intentional easter egg but should be reviewed before production deployment

---

#### 13. Unused Hooks Assessment

The following hooks are fully implemented but not integrated into any game:
- `useProceduralAudio` - Advanced procedural audio with granular synthesis
- `useViewportCulling` - Spatial partitioning for render optimisation
- `useMobileDetection` - Device detection (used in App.tsx for warning, could expand for touch controls)

Consider either integrating these or archiving them.

---

#### 14. Missing WASD Controls

| Game | WASD Support | Status |
|------|--------------|--------|
| Metris | Not implemented | Optional (uses arrows + Z/X/C for rotation) |

All other games support WASD as alternative movement.

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
| MatrixInvaders | Boolean flags with menu state | **COMPLIANT** |
| Metris | Boolean flags with waiting state | **COMPLIANT** |
| MatrixCloud | Boolean flags with started state | **COMPLIANT** |
| CtrlSWorld | 11 independent booleans | PARTIAL - needs refactoring |
| TerminalQuest | Node-based + booleans | PARTIAL - needs refactoring |
| TerminalQuestCombat | CombatPhase enum | **COMPLIANT** |

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
- **Timeout cleanup (reference):** MatrixInvaders.tsx (lines 129-132, 993-1008)
- **Achievement persistence (reference):** CtrlSWorld.tsx (lines 463-468)

---

## Compliance Summary by Game

| Game | Controls | Sound | isMuted | State Machine | Achievements | SaveSystem | Timeouts | Overall |
|------|----------|-------|---------|---------------|--------------|------------|----------|---------|
| SimpleSnake | 100% | Yes | Yes | **COMPLIANT** | Yes | Yes | Clean | **100%** |
| MatrixInvaders | 100% | Yes | Yes | **COMPLIANT** | Yes (10) | Yes | **Reference** | **98%** |
| Metris | 95% (no WASD) | Yes | Yes | **COMPLIANT** | Yes (12) | Yes | Clean | **95%** |
| VortexPong | 100% | Yes | Yes | **COMPLIANT** | Yes (7) | Yes | Clean | **95%** |
| MatrixCloud | 100% | Yes | Yes | **COMPLIANT** | Yes (7) | Yes | Clean | **93%** |
| TerminalQuest | 100% | Yes | Yes | PARTIAL | Yes (7) | Yes | Clean | **85%** |
| CtrlSWorld | 100% | Yes | Yes | PARTIAL | Yes (7) | Yes | Clean | **88%** |
| TerminalQuestCombat | N/A | Yes | Yes | **COMPLIANT** | N/A | N/A | Clean | **75%** |

**Average Game Compliance: 85%**

**Legend:**
- Controls: Keyboard shortcuts (ESC, P, R, ENTER, arrows, WASD)
- Sound: Uses useSoundSystem/useSoundSynthesis correctly
- isMuted: All sound calls gated with isMuted check
- State Machine: Follows IDLE/MENU → PLAYING → PAUSED → GAME_OVER pattern
- Achievements: Properly integrated with both achievementManager and useSaveSystem
- SaveSystem: Uses useSaveSystem for persistence
- Timeouts: All setTimeout calls have cleanup refs

---

## Quick Reference: Priority Order for Implementation

### P0 - Critical (Fix Immediately)
- [x] Fix VortexPong ENTER key focus (add e.preventDefault, tabIndex, auto-focus) - DONE
- [x] Improve CtrlSWorld UX/UI (Citizen Sleeper style, chapter selection hub) - PARTIALLY DONE (hub implemented, state refactor pending as P2)
- [x] Fix TerminalQuest achievement persistence (add unlockSaveAchievement call) - DONE
- [x] Add `pong_power_master` to useSaveSystem GAME_ACHIEVEMENTS - DONE
- [x] Fix TerminalQuest local-only achievements (lines 143-151) - removed dead code - DONE

### P1 - High Priority (Memory Safety & Performance)
- [x] Add timeout cleanup refs to TerminalQuest (lines 113, 219)
- [x] Add timeout cleanup refs to TerminalQuestCombat (7 timeouts: lines 87, 95, 112, 150, 164, 174, 182)
- [x] Add timeout cleanup refs to CtrlSWorld (5 timeouts: lines 608, 660, 723, 845, 898)
- [x] Add timeout cleanup ref to Metris (line 720)
- [x] Add timeout cleanup refs to VortexPong (lines 185, 530)
- [x] Add timeout cleanup refs to MatrixCloud (4 timeouts: lines 436, 495-506, 671, 825)
- [x] Fix MatrixCloud Date.now() in boss movement (add elapsedTime to Boss interface, lines 352, 356, 357, 361)
- [x] Fix MatrixInvaders Date.now() in render (use timestamp parameter, line 728)
- [x] Refactor TerminalQuestCombat stale closures (lines 92, 179) and boolean states to CombatPhase enum

### P2 - Medium Priority (Code Quality)
- [x] Migrate App.tsx play date tracking to useSaveSystem.globalStats - DONE Round 56
- [x] Migrate GameStateContext.tsx game state to useSaveSystem - DONE Round 58
- [x] Migrate useLifelineManager.ts state to useSaveSystem - DONE Round 57
- [ ] Refactor CtrlSWorld state to unified UIState enum (11 booleans -> single state)
- [x] Implement ESC key handler in CtrlSWorld (missing despite UI promise at line 1401) - DONE Round 54
- [x] Standardise CtrlSWorld sound calls to use playSFX wrapper (4 direct calls at lines 498, 671, 741, 767) - DONE Round 54
- [x] Remove redundant achievement call in CtrlSWorld (line 835)
- [ ] Integrate useObjectPool into VortexPong for multi-ball and impact effects

### P3 - Low Priority (Enhancements)
- [ ] Add tests for useViewportCulling (4.6 KB)
- [ ] Add tests for usePerformanceMonitor (6.4 KB)
- [ ] Add tests for useLifelineManager (5.8 KB)
- [ ] Add tests for usePowerUps (1.5 KB)
- [ ] Add tests for useGameLoop (750 B)
- [ ] Add tests for useInterval (427 B)
- [ ] Expand VortexPong tests (currently 18 - minimal)
- [ ] Expand TerminalQuest tests (currently 22 - minimal)
- [ ] Expand MatrixCloud tests (currently 21 - moderate)
- [ ] Review TerminalQuestContent.ts:427 TODO before production
- [ ] Consider integrating or archiving unused hooks
- [ ] Add WASD support to Metris (optional)

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

### 25 January 2026 - Round 28 Fixes

**Achievement ID System Overhaul:**
- SimpleSnake: Changed 5 achievement IDs to use `snake_` prefix
- MatrixCloud: Changed 4 achievement IDs to use `cloud_` prefix
- MatrixInvaders: Added 3 missing achievement definitions to useSaveSystem
- CtrlSWorld: Complete achievement ID system overhaul with `ctrl_` prefix
- Total achievements now: 63 (56 game + 7 global)

---

### 25 January 2026 - Round 29 Fixes

**Achievement Implementations Complete:**

*SimpleSnake:*
- `snake_combo_10` - eat 10 consecutive food items
- `snake_power_master` - collect 10 power-ups in one game

*MatrixInvaders:*
- `invaders_bullet_time` - use bullet time 5 times
- `invaders_perfect_wave` - complete wave without damage
- `invaders_high_score` - score 10,000+ points

*Metris:*
- `perfect_start` - reach level 5 or higher
- `architect` - build 18 rows without clearing
- `t_spin_master` - perform 5 T-spins

*Global Achievements (App.tsx):*
- All 7 global achievements implemented

---

### 25 January 2026 - Rounds 30-39 Fixes

**TerminalQuest ENTER Key Support:**
- ENTER skips typing, resumes pause, selects first choice

**MatrixCloud z-index Fix:**
- Added z-10 to HUD elements, pause overlay properly covers all

**MatrixInvaders Performance:**
- Fixed Date.now() usage in render loop (partial)
- Integrated player movement into RAF-based game loop
- Added proper timeout cleanup with refs (reference implementation)

**Console.log Cleanup:**
- Wrapped debug logs in environment checks (VITE_DEBUG_PERFORMANCE, VITE_DEBUG_SAVE)

**MatrixInvaders Boss System:**
- Boss waves every 5 waves with scaling health
- Achievement `invaders_boss_defeat` now unlockable

**Test Suite Additions:**
- useSoundSynthesis: 51 tests
- useProceduralAudio: 51 tests
- useParticleSystem: 66 tests
- useObjectPool: 85 tests
- useShatnerVoice: 93 tests
- useAchievementManager: 61 tests
- Total tests: ~1,000+

---

### 25 January 2026 - Rounds 40-47 Analysis

**Deep verification rounds with parallel Opus/Sonnet subagents confirming:**
- CtrlSWorld achievement persistence is CORRECT (lines 463-468)
- Console statement count: 20 (2 wrapped, 18 in handlers - acceptable)
- Timeout cleanup issues: 15 untracked setTimeout calls identified
- localStorage direct usage: 3 files need migration to useSaveSystem
- Hook test coverage: 11/17 with tests (65%)
- Game test coverage: 8/8 with tests (100%)
- VortexPong ENTER key issue: focus management, not code logic
- TerminalQuest achievement bug: missing unlockSaveAchievement call confirmed
- MatrixCloud Date.now(): 4 calls in boss movement confirmed
- TerminalQuestCombat: 7 untracked timeouts, stale closure issues confirmed

---

### 25 January 2026 - Round 48 Analysis

**Deep verification with 10 parallel Opus/Sonnet subagents confirming all previous findings:**

*VortexPong (Re-verified):*
- ENTER key handler lacks `e.preventDefault()` (line 223)
- No `tabIndex` on main container (line 823)
- No auto-focus on mount
- 2 additional setTimeout calls without cleanup (lines 185, 530)
- `Date.now()` in render loop (line 641) - minor performance concern
- All 7 achievement IDs match except `pong_power_master` which is NOT defined

*CtrlSWorld (Re-verified):*
- 11 independent boolean states confirmed
- ESC key handler completely missing
- 4 direct `playSoundEffect` calls bypass `playSFX` wrapper (lines 498, 671, 741, 767)
- 5 setTimeout calls without cleanup refs confirmed
- Achievement integration correct (calls both systems)

*TerminalQuest (Re-verified):*
- Achievement persistence bug confirmed - missing `unlockSaveAchievement` call
- Line 90: Only destructures `{ saveData, updateGameSave }` - missing `unlockAchievement`
- Lines 93-97: `unlockAchievement` wrapper only calls `achievementManager`, not `useSaveSystem`
- 2 setTimeout calls without cleanup (lines 113, 219)
- All 7 achievement IDs are valid but NOT persisted

*MatrixCloud (Re-verified):*
- 4x `Date.now()` in boss movement (lines 352, 356, 357, 361) - ignores deltaTime parameter
- Boss interface missing `elapsedTime` field
- 2 additional setTimeout without cleanup (lines 671, 825)
- Uses custom RAF instead of `useGameLoop` hook

*MatrixInvaders (Reference Implementation):*
- 98% spec-compliant - gold standard for timeout cleanup pattern
- Single minor issue: `Date.now()` at line 728 in render (should use timestamp parameter)
- All 4 timeout refs properly cleaned up (lines 129-132, 993-1008)
- All 10 achievements correctly integrated with dual system pattern

*Metris (Re-verified):*
- 1 setTimeout without cleanup (line 720)
- WASD not implemented (optional per spec)
- All 12 achievements properly integrated
- Z/X/C rotation keys fully implemented

*SimpleSnake (Reference Implementation):*
- 100% spec-compliant - gold standard for state machine pattern
- Proper `'menu' | 'playing' | 'paused' | 'gameOver'` enum
- All 7 achievements tracked with refs to prevent duplicates
- Sound gating exemplary with two-layer protection

*TerminalQuestCombat (Re-verified):*
- 7 setTimeout calls without cleanup (lines 87, 95, 112, 150, 164, 174, 182)
- 2 stale closure issues with `playerHealth` prop (lines 92, 179)
- 4 boolean flags create timing fragility
- Should use CombatPhase enum instead of booleans

*Console Statements (Corrected):*
- Only 3 console.log statements in codebase:
  - `src/data/puzzles.ts:116` - Quiz question content (not actual logging)
  - `src/hooks/useSaveSystem.ts:201` - Wrapped in `VITE_DEBUG_SAVE` env check
  - `src/hooks/usePerformanceMonitor.tsx:179` - Wrapped in `VITE_DEBUG_PERFORMANCE` env check
- All properly handled - no unprotected logging

*TODO Comments (Confirmed):*
- Only 1 TODO found: `src/components/games/TerminalQuestContent.ts:427`
- This is game content (fake TODO in developer_room dialogue), not actual code maintenance

*Achievement Mismatch (Confirmed):*
- VortexPong uses `pong_power_master` (line 349) but it's NOT defined in GAME_ACHIEVEMENTS
- All other games have perfect alignment between used and defined achievement IDs

---

### 25 January 2026 - Round 49 Analysis

**Deep verification with 24 parallel Opus/Sonnet subagents cross-referencing specs:**

*Spec Compliance Verification:*
- Reviewed `specs/game-architecture.md` - confirms required GameProps interface, state machine pattern, 60fps target
- Reviewed `specs/ux-guidelines.md` - confirms required keyboard controls (ESC, P, R, ENTER), sound effects, Matrix aesthetic
- Reviewed `specs/new-game-template.md` - confirms hook integration patterns and state management requirements

*MatrixCloud Additional Findings:*
- 2 additional setTimeout calls found without cleanup refs (lines 436, 495-506)
- Total MatrixCloud untracked timeouts now 4 (was 2)
- screenShakeTimeoutRef at line 296 IS properly cleaned up
- Power-up effect timers at lines 401-407 ARE properly cleaned up

*Console Statements (Corrected Count):*
- Total: 21 console statements in src/
- 8x `console.error` - error handling in save system, contexts (acceptable)
- 11x `console.warn` - warnings in sound system, voice hooks (acceptable)
- 2x `console.log` - properly wrapped with env checks (correct)
- All acceptable for production - error/warn handlers aid debugging

*localStorage Usage (Complete Inventory):*
| File | Key | Purpose | Migration Needed? |
|------|-----|---------|-------------------|
| App.tsx | `matrix-arcade-play-dates` | Global achievement tracking | Yes |
| GameStateContext.tsx | `matrix-arcade-ctrls-save` | CtrlSWorld story state | Consider |
| useLifelineManager.ts | `ctrlsworld_lifelines` | Puzzle lifeline state | Yes |
| useSoundSystem.ts | `matrix-arcade-audio-config` | Audio preferences | No |
| useAdvancedVoice.ts | `matrix-arcade-advanced-voice` | Voice preferences | No |
| useShatnerVoice.ts | `matrix-arcade-shatner-voice` | Shatner voice config | No |

*TerminalQuest Local-Only Achievements:*
- Lines 143-151 track 3 achievements locally but never propagate to global system:
  - `first_100_xp` - only in component state
  - `first_combat` - only in component state
  - `collector` - only in component state
- These should either be added to GAME_ACHIEVEMENTS or removed

*Hook API Summary (for reference):*
- `useGameLoop(callback)` - Returns nothing, runs callback with deltaTime (ms)
- `useSaveSystem()` - Returns saveData, updateGameSave, unlockAchievement, exportSaveData, etc.
- `useSoundSystem()` - Returns playSFX, playMusic, stopMusic, toggleMute, isMuted, config
- `useAchievementManager()` - Returns achievements, stats, unlockAchievement, notificationQueue
- `useParticleSystem()` - Returns particles, emit, explode, collectFood, createTrail, render, clear
- `useObjectPool({ create, reset, maxSize })` - Returns acquire, release, releaseAll, getStats, activeObjects

*Updated Total Untracked setTimeout Calls: 21*
| File | Count | Lines |
|------|-------|-------|
| TerminalQuestCombat.tsx | 7 | 87, 95, 112, 150, 164, 174, 182 |
| CtrlSWorld.tsx | 5 | 608, 660, 723, 845, 898 |
| MatrixCloud.tsx | 4 | 436, 495-506, 671, 825 |
| VortexPong.tsx | 2 | 185, 530 |
| TerminalQuest.tsx | 2 | 113, 219 |
| Metris.tsx | 1 | 720 |

---

### 25 January 2026 - Round 50 Fixes

**P0 Critical Fixes Completed:**

*VortexPong ENTER Key Focus Issue:*
- Added `containerRef` to track main container element
- Added `tabIndex={0}` to main container for keyboard focusability
- Added `outline-none` class to prevent focus ring
- Added `e.preventDefault()` to ENTER key handler (line 230)
- Added auto-focus `useEffect` to focus container on mount
- ENTER key now reliably starts game from menu or restarts from game over

*TerminalQuest Achievement Persistence Bug:*
- Added `unlockSaveAchievement` from useSaveSystem destructuring (line 90)
- Updated `unlockAchievement` callback to call BOTH:
  - `achievementManager.unlockAchievement()` for UI notifications
  - `unlockSaveAchievement()` for persistence across sessions
- All 7 TerminalQuest achievements now persist correctly

*Missing VortexPong Achievement Definition:*
- Added `pong_power_master` to `GAME_ACHIEVEMENTS['vortexPong']` in useSaveSystem.ts
- Description: "Collect 5 power-ups in one game"
- VortexPong now has 7 properly defined achievements

*TerminalQuest Local-Only Achievements:*
- Removed dead code at lines 143-151 that tracked 3 achievements (`first_100_xp`, `first_combat`, `collector`)
  only in local state without global system integration
- These were redundant as proper `quest_*` prefixed achievements already provide similar coverage
- Simplified code and eliminated confusion about local vs global achievements

**Build Status:** All 959 tests passing, production build successful.

---

### 25 January 2026 - Round 51 Fixes

**P1 Timeout Cleanup Completed:**

All 21 untracked setTimeout calls across 6 game files now have proper cleanup refs:

*TerminalQuest.tsx (2 timeouts):*
- Line 113: Screen shake timeout - added cleanup ref
- Line 219: Background glitch timeout - added cleanup ref

*TerminalQuestCombat.tsx (7 timeouts):*
- Lines 87, 95, 112, 150, 164, 174, 182: Combat flow, enemy turns, victory/defeat
- All timeouts now use refs with proper cleanup on unmount

*CtrlSWorld.tsx (5 timeouts):*
- Lines 608, 660, 723, 845, 898: Page transitions, auto-advance, puzzle resume
- All timeouts now tracked with refs and cleaned up properly

*Metris.tsx (1 timeout):*
- Line 720: Save game stats timeout - added cleanup ref

*VortexPong.tsx (2 timeouts):*
- Line 185: Screen shake reset - added cleanup ref
- Line 530: Save delay timeout - added cleanup ref

*MatrixCloud.tsx (4 timeouts):*
- Lines 436, 495-506, 671, 825: Achievement delay, save delay, boss spawn, invulnerability
- All timeouts now properly tracked and cleaned up

**Memory Safety:** All games now follow the MatrixInvaders reference implementation pattern for timeout cleanup.

---

### 25 January 2026 - Round 52 Fixes

**P1 Date.now() Performance Fixes Completed:**

*MatrixCloud Date.now() Fix:*
- Added `elapsedTime: number` field to Boss interface
- Initialised `elapsedTime: 0` in `createBoss` function
- Updated `updateBoss` to calculate `newElapsedTime = boss.elapsedTime + deltaTime`
- All boss movement patterns now use `elapsedTime` instead of `Date.now()`:
  - agent_smith: `Math.sin(elapsedTime / 1000) * 2`
  - sentinel: `Math.sin(elapsedTime / 1500) * 1.5` and `Math.cos(elapsedTime / 1500) * 1.5`
  - architect: `Math.sin(elapsedTime / 2000) * 1`
- Boss movement is now deterministic and pauses correctly when game is paused

*MatrixInvaders Date.now() Fix:*
- Changed render function to use `timestamp` parameter instead of `Date.now()`
- Hit timing calculation now uses consistent frame timestamp for invulnerability flash effect
- Eliminates syscall overhead in hot render path

**Performance:** Both games now avoid unnecessary Date.now() calls in animation loops.

---

### 25 January 2026 - Round 53 Fixes

**P1 TerminalQuestCombat Stale Closure & State Refactor Completed:**

*CombatPhase Discriminated Union:*
- Added `CombatPhase` type with 7 phases: `'player_ready'`, `'player_attacking'`, `'player_defending'`, `'player_using_item'`, `'enemy_turn'`, `'victory'`, `'defeat'`
- Replaced fragile boolean flags (`isPlayerTurn`, `isAnimating`) with single `combatPhase` state
- Added derived state variables for backwards compatibility with existing code

*Stale Closure Fixes:*
- Damage values now captured before async callbacks execute
- Victory/defeat calculations no longer use stale `playerHealth` prop values
- Combat flow timing is now deterministic and predictable

*Test Results:*
- All 48 TerminalQuestCombat tests pass
- Full test suite of 959 tests pass
- No regressions introduced

**State Machine Compliance:** TerminalQuestCombat now follows proper state machine pattern with explicit phase transitions.

---

### 25 January 2026 - Round 54 Fixes

**CtrlSWorld UX Overhaul (Partial Completion):**

*Chapter Selection Hub:*
- Added Citizen Sleeper-inspired chapter selection hub with visual chapter cards
- Each chapter card displays title, description, and completion status
- Hub accessible after initial save/load screen
- Players can now jump directly to any unlocked chapter

*ESC Key Handler:*
- Implemented ESC key handler for closing modals and panels
- ESC now properly closes settings panel, inventory, puzzle modal, etc.
- Fulfills UI promise at line 1401 ("Press R to restart or ESC to exit")

*Sound Call Standardisation:*
- Fixed 4 direct `playSoundEffect()` calls that bypassed `isMuted` check
- All sound calls now route through `playSFX()` wrapper for consistent muting behaviour
- Lines fixed: 498, 671, 741, 767

*Navigation Improvements:*
- Added "Chapter Select" button to settings panel during gameplay
- Added "Chapter Select" option on game complete screen
- Players can replay completed chapters without full restart

**Test Results:**
- All 959 tests passing
- No regressions introduced

**Remaining Work:**
- Full state machine refactor to unified UIState enum moved to P2
- 11 boolean states still need consolidation for cleaner code architecture

---

### 25 January 2026 - Round 55 Fixes

**P2 Redundant Achievement Call Removed:**

*CtrlSWorld Cleanup:*
- Removed redundant `gameState.unlockAchievement('ctrl_no_hints')` call at line 891
- The proper `unlockAchievement('ctrl_no_hints')` wrapper at line 883 already handles both:
  - `achievementManager.unlockAchievement()` for UI notifications
  - `unlockSaveAchievement()` for persistence across sessions
- Eliminates duplicate achievement unlock attempts and simplifies code flow

**Test Results:**
- All 959 tests passing
- Production build successful
- No regressions introduced

---

### 25 January 2026 - Round 56 Fixes

**P2 localStorage Consolidation - App.tsx Play Dates:**

*Changes Made:*
- Added `playDates: string[]` field to `GlobalSaveData.globalStats` interface in useSaveSystem.ts
- Added `playDates: []` to default global save data initialisation
- Updated `checkDedicatedAchievement` function in App.tsx to use useSaveSystem instead of direct localStorage
- Removed direct `localStorage.getItem/setItem` calls for 'matrix-arcade-play-dates' key
- Play date tracking now persists through the unified save system and benefits from automatic backup

*Why This Matters:*
- Single source of truth for all persistent data
- Play dates included in export/import functionality
- Automatic backup support for play date tracking
- Consistent data management across the application

**Test Results:**
- All 959 tests passing
- Production build successful
- No regressions introduced

---

### 25 January 2026 - Round 57 Fixes

**P2 localStorage Consolidation - useLifelineManager:**

*Changes Made:*
- Added `LifelineData` interface to useSaveSystem.ts for type-safe lifeline storage
- Added `createDefaultLifelineData()` helper function exported from useSaveSystem
- Extended `GameSaveData` interface with optional `lifelineData` field
- Initialised ctrlSWorld with default lifeline data in `createDefaultGlobalSave()`
- Refactored useLifelineManager.ts to use useSaveSystem internally instead of direct localStorage
- Added automatic one-time migration from legacy `ctrlsworld_lifelines` localStorage key
- Maintained same external API so PuzzleModal continues working unchanged

*Why This Matters:*
- Single source of truth for all persistent data (lifelines now included in unified save)
- Lifeline data included in export/import functionality
- Automatic backup support for lifeline tracking
- Legacy data automatically migrated and old key removed

**Test Results:**
- All 959 tests passing
- Production build successful
- No regressions introduced

---

### 25 January 2026 - Round 58 Fixes

**P2 localStorage Consolidation - GameStateContext:**

*Changes Made:*
- Added `CtrlSGameState` interface to useSaveSystem.ts with full type definitions for CTRL-S World game state
- Added `CtrlSPlayerStats` and `CtrlSGameItem` interfaces for type safety
- Added `createDefaultCtrlSGameState()` helper function exported from useSaveSystem
- Added optional `ctrlSGameState` field to `GameSaveData` interface
- Updated `createDefaultGlobalSave()` to include default ctrlSGameState for ctrlSWorld
- Refactored GameStateContext.tsx to use useSaveSystem internally instead of direct localStorage
- Added automatic one-time migration from legacy 'matrix-arcade-ctrls-save' localStorage key
- Updated GameStateContext tests to work with new architecture
- Updated App.test.tsx and CtrlSWorld.test.tsx mocks to include new exports

*Key Implementation Details:*
- GameStateContext now maintains local state that syncs with useSaveSystem
- Legacy localStorage key is automatically migrated on first load and then removed
- Same external API maintained for backwards compatibility
- All 960 tests pass

*Files Changed:*
- src/hooks/useSaveSystem.ts (added interfaces, createDefaultCtrlSGameState)
- src/contexts/GameStateContext.tsx (refactored to use useSaveSystem)
- src/contexts/GameStateContext.test.tsx (updated for new architecture)
- src/App.test.tsx (updated mock)
- src/components/games/CtrlSWorld.test.tsx (updated mock)

*Why This Matters:*
- Single source of truth for all persistent data (CTRL-S World game state now in unified save)
- Game state included in export/import functionality
- Automatic backup support for game state tracking
- Legacy data automatically migrated and old key removed
- All localStorage migrations complete (3/3 completed)

**Test Results:**
- All 960 tests passing
- Production build successful
- No regressions introduced

---

*Generated by Ralph on 25 January 2026 - Round 58*
*Migrated GameStateContext.tsx game state to useSaveSystem*
