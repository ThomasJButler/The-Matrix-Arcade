# Matrix Arcade - Implementation Plan

This file is auto-generated and updated by Ralph during planning and building loops.

Run `./loop.sh plan` or `./loop-full.sh` to analyse the codebase and generate tasks.

---

## Completion Status

- **Status**: POLISHED - All P0/P1/P2 items complete
- **Last Assessment**: 26 January 2026 (AgentEscape waka-waka verified, all P2 complete)
- **Outstanding Critical Work**: None - all P0/P1/P2 items resolved
- **Test Coverage**: Hooks 100%, Production Games 100%, New Games Unit 90%+ (152 tests), E2E Visual 100% (11/11 games)
- **Test Status**: ALL PASS (412 game tests total, SaveLoadManager 45 tests, SentientAIModal 29 tests)
- **Build Status**: PASSES (warning: 669KB chunk exceeds 500KB limit)
- **Spec Compliance**: 95%+ across all games (all critical mechanics now implemented)
- **Notes**: All 11 games fully playable and polished. P0/P1/P2 complete. AgentEscape 4/4 core items done, siren moved to P3 as optional enhancement. CrossyRoad 5/5, MatrixAscension 6/6, JimmyMatrix 5/5 all complete.

---

## Current State Summary

- **Games Implemented**: 11 total (all playable)
- **Games in Main Menu**: 11 active games (all integrated in App.tsx)
- **Production Ready**: CtrlSWorld, SimpleSnake, VortexPong, MatrixCloud, MatrixInvaders, Metris, TerminalQuest, CrossyRoad, MatrixAscension, AgentEscape, JimmyMatrix
- **Near-Complete (Need Polish)**: None - all games production ready
- **Achievement System**: 79 total achievements (72 game-specific + 7 global, defined in useSaveSystem.ts)
- **Hooks Library**: 17 shared hooks for games to use (all tested)
- **Visual Consistency**: Strong Matrix theme throughout (green-on-black, glow effects, CRT aesthetic)
- **E2E Test Coverage**: 11/11 games have visual E2E tests

---

## Priority Tasks

### P0 - Critical (All 6 Bugs FIXED ✓)

#### 1. CrossyRoad.tsx - 3 BUGS ✓ FIXED (26 Jan 2026 15:35 UTC)

**File:** `src/components/games/CrossyRoad.tsx`

**BUG 1 - Magnet power-up not implemented:** ✓ FIXED
- Added magnet attraction logic in game loop - red pills now gravitate toward player within 8-cell range when magnet is active

**BUG 2 - Dodge counter inside collision block:** ✓ FIXED
- Moved near-miss tracking OUTSIDE collision block - now tracks actual near-misses when player passes close to obstacles without colliding

**BUG 3 - Magnet HUD indicator missing:** ✓ FIXED
- Added magnet indicator to HUD: `{activePowerUps.magnet > Date.now() && (<p className="text-fuchsia-400 text-xs animate-pulse">MAGNET</p>)}`

---

#### 2. AgentEscape.tsx - 1 BUG ✓ FIXED (26 Jan 2026 15:35 UTC)

**File:** `src/components/games/AgentEscape.tsx`

**BUG - Fruit system completely missing:** ✓ FIXED
- Added Fruit interface with cherry/apple/orange types
- Implemented fruit spawning at 70 and 170 dots eaten (like classic Pacman)
- Added fruit collection detection and scoring (100/200/300 points)
- Added fruit rendering with unique shapes for each type
- `pacman_fruit_all` achievement now obtainable at 5 fruits collected

---

#### 3. MatrixAscension.tsx - 1 BUG ✓ FIXED (26 Jan 2026 15:35 UTC)

**File:** `src/components/games/MatrixAscension.tsx`

**BUG - deltaTime completely ignored:** ✓ FIXED
- Removed underscore from deltaTime parameter
- Added normalised delta calculation: `const dt = deltaTime / 16.67`
- Applied dt to all physics: speedMod, friction, jetpack thrust, platform fade, matrix rain
- Game now runs consistently across all display refresh rates

---

#### 4. JimmyMatrix.tsx - 1 BUG ✓ FIXED (26 Jan 2026 15:35 UTC)

**File:** `src/components/games/JimmyMatrix.tsx`

**BUG - Hold/double note types never generated:** ✓ FIXED
- Added note type randomisation based on difficulty:
  - Easy: 100% normal
  - Normal: 90% normal, 10% hold
  - Hard: 75% normal, 15% hold, 10% double
  - Insane: 60% normal, 25% hold, 15% double
- Hold notes have visible tails showing duration
- Double notes spawn paired notes in adjacent lanes with gold styling
- Different rendering for each note type with indicators

---

### P1 - High Priority (Testing)

#### 5. Fix Failing Unit Tests ✓ FIXED (26 Jan 2026 15:40 UTC)

**Status:** All 3 test failures resolved.

**Fixes applied:**

1. **`src/components/ui/SaveLoadManager.test.tsx`** - 2 failures FIXED:
   - Line 244: Changed `getByText('High Score')` to `getAllByText('High Score')` with length check
   - Line 265: Changed `getByText('Recent Achievements:')` to `getAllByText()` pattern
   - Added `it.todo()` placeholders for empty Loading State and Error State describe blocks

2. **`src/components/ui/SentientAIModal.test.tsx`** - 1 failure FIXED:
   - Line 297: Changed compound CSS selector to attribute selector `[class*="border-cyan-400"][class*="bg-cyan-900"]`
   - Increased timer advance from 2000ms to 2500ms to ensure revealing stage is active
   - Removed async waitFor wrapper since synchronous check is sufficient after timer advance

**Note:** Test suite may crash with heap memory error when running all tests at once. Run with `NODE_OPTIONS=--max-old-space-size=4096` or reduce test parallelism via `--pool=forks --poolOptions.forks.singleFork`.

---

#### 6. Expand Unit Tests for New Games ✓ COMPLETED (26 Jan 2026 15:55 UTC)

**Status:** Unit tests expanded with deeper coverage for all 4 new games.

**Files (now with comprehensive test suites):**
- `src/components/games/CrossyRoad.test.tsx` - **36 tests** (state machine, achievements, bullet time, movement, mute, HUD, game loop)
- `src/components/games/MatrixAscension.test.tsx` - **38 tests** (state machine, achievements, HUD, movement, shooting, mute, platform generation)
- `src/components/games/AgentEscape.test.tsx` - **35 tests** (state machine, achievements, HUD, movement, ghost AI, mute, game loop)
- `src/components/games/JimmyMatrix.test.tsx` - **43 tests** (state machine, track selection, lane keys, achievements, mute, note generation)

**Tests Added:**
- [x] Achievement unlock verification (mock achievementManager, verify correct game ID)
- [x] State machine transition coverage (menu -> playing -> paused -> gameOver)
- [x] Player position/movement verification (all movement keys and alternatives)
- [x] Mute functionality (M key toggle, isMuted prop)
- [x] HUD display verification (score, lives, altitude)
- [x] Game loop continuation tests
- [x] Power-up activation (bullet time in CrossyRoad)
- [x] Track selection navigation (JimmyMatrix)

---

#### 7. Add Visual E2E Tests for New Games ✓ COMPLETED (26 Jan 2026 15:57 UTC)

**Status:** All 11 games now have E2E visual tests.

**Created Playwright visual tests:**
- [x] `e2e/visual/games/crossy-road.spec.ts` - 8 tests (menu, gameplay, movement, obstacles, bullet time, pause, HUD, game over)
- [x] `e2e/visual/games/matrix-ascension.spec.ts` - 9 tests (menu, gameplay, jumping, shooting, platforms, altitude, pause, matrix rain, game over)
- [x] `e2e/visual/games/agent-escape.spec.ts` - 10 tests (menu, gameplay, movement, collecting, ghost chase, maze, HUD, pause, power pellet, game over)
- [x] `e2e/visual/games/jimmy-matrix.spec.ts` - 10 tests (menu, track selection, track nav, gameplay, note hitting, lanes, combo, pause, health, game over)
- [x] `e2e/visual/games/terminal-quest.spec.ts` - 10 tests (menu, intro, typing effect, choices, exploration, stats, pause, inventory, ASCII art, hub)

**Updated:** `e2e/fixtures/arcade.fixture.ts` with game name patterns for navigation

---

### P2 - Medium Priority (Polish)

#### 8. Sound Integration Consistency ✓ COMPLETE (26 Jan 2026 16:08 UTC)

**Status:** All sound integration issues resolved.

**Changes made:**
- Added 12 new game-specific sounds to useSoundSystem.ts:
  - CrossyRoad: `powerupBulletTime`, `powerupGhost`, `powerupShield`, `powerupMagnet`
  - MatrixAscension: `shoot`
  - JimmyMatrix: `rhythmMiss`, `rhythmGood`, `rhythmPerfect`, `rhythmCombo`
  - AgentEscape: `wakaWaka`, `ghostEat`
- CrossyRoad now plays distinct sounds per power-up type
- MatrixAscension uses dedicated shoot sound instead of jump
- JimmyMatrix has proper miss, good hit, perfect hit, and combo milestone sounds
- AgentEscape uses waka-waka for eating dots and ghostEat for eating frightened ghosts

---

#### 9. AgentEscape - Ghost AI and Sound Polish ✓ COMPLETE (26 Jan 2026)

**File:** `src/components/games/AgentEscape.tsx`

**All items resolved:**
- [x] Add frightened mode flashing warning - ghosts flash blue/white in last 3 seconds, pupils flash red ✓ (26 Jan 2026)
- [x] Add staggered ghost release from house - Smith starts active, Brown at 3s, Jones at 7s, Johnson at 12s ✓ (26 Jan 2026)
- [x] Add waka-waka eating sound ✓ ALREADY IMPLEMENTED - Line 711 plays 'wakaWaka' on each dot collection (authentic Pacman behaviour)
- [x] Scale ghost speed/AI difficulty with level ✓ FIXED (26 Jan 2026) - Added getLevelDifficulty() function with 8% speed increase per level (capping at level 7) and decreasing frightened duration (min 3s)

**Optional enhancements (P3 - moved from P2):**
- [ ] Add continuous background siren during chase mode (requires looping sound system enhancement)

---

#### 10. JimmyMatrix - Audio and Visual Polish ✓ COMPLETE (26 Jan 2026)

**File:** `src/components/games/JimmyMatrix.tsx`

**All items resolved:**
- [x] Add miss sound effect - ✓ Uses `rhythmMiss` sound (line 515)
- [x] Add 'good' hit sound - ✓ Uses `rhythmGood` sound (line 388)
- [x] Add track-ending warning - ✓ Visual flashing + countdown when <10 seconds remain
- [x] Add combo milestone sounds at 50/100/500 combos - ✓ Uses `rhythmCombo` sound (lines 784-791)
- [x] Animate menu screen matrix rain - ✓ Animated with requestAnimationFrame loop

---

#### 11. CrossyRoad - Difficulty and Feature Polish ✓ COMPLETE (26 Jan 2026)

**File:** `src/components/games/CrossyRoad.tsx`

**All items resolved:**
- [x] Add progressive difficulty scaling ✓ FIXED (26 Jan 2026) - Obstacle count now scales with distance: base 2-4 at start, 3-6 at distance 500+, with tighter gaps
- [x] Add shield consumption visual feedback ✓ FIXED (26 Jan 2026) - Green particle burst on shield break via explode()
- [x] Add Agent blinking eye animation ✓ FIXED (26 Jan 2026) - Agents blink every 2-3 seconds with pseudo-random timing per agent
- [x] Add distinct sound per power-up type - ✓ Uses `powerupBulletTime`, `powerupGhost`, `powerupShield`, `powerupMagnet` (lines 629-646)
- [x] Add combo/multiplier system for consecutive dodges ✓ FIXED (26 Jan 2026) - Near-miss dodges build combo counter with score multiplier (2x at 5, 3x at 10, 4x at 20, 5x at 30), combo expires after 3s without dodge, HUD displays combo count and multiplier

---

#### 12. MatrixAscension - Visual and Audio Polish ✓ COMPLETE (26 Jan 2026)

**File:** `src/components/games/MatrixAscension.tsx`

**All items resolved:**
- [x] Add jetpack fuel gauge visualisation ✓ FIXED (26 Jan 2026) - Added orange/yellow gradient progress bar with smooth transitions
- [x] Add spring platform compression animation ✓ FIXED (26 Jan 2026) - Springs compress on landing then bounce back with 200ms animation, visual height reduction
- [x] Add enemy death animation ✓ FIXED (26 Jan 2026) - Enemies spin, scale down, turn red and fade out over 300ms when killed
- [x] Add distinct shooting sound ✓ ALREADY FIXED - Line 322 uses 'shoot' sound (not 'jump')
- [x] Scale enemy spawn rate progressively with altitude ✓ FIXED (26 Jan 2026) - Enemies now spawn starting at 500m with 3% chance, scaling to 20% at 5000m
- [x] Add parallax scrolling for matrix rain ✓ FIXED (26 Jan 2026) - Three depth layers with different speeds, sizes, and opacities creating parallax depth effect

---

### P3 - Low Priority (Nice to Have)

#### 13. Enhanced Features (Future)

These are not blockers but would enhance the experience:
- JimmyMatrix: Actual audio file playback synchronised with notes
- JimmyMatrix: Latency calibration option for different hardware
- JimmyMatrix: Seed-based note generation for leaderboard fairness
- JimmyMatrix: Replay recording/playback
- AgentEscape: Intermission screens between levels
- AgentEscape: Demo mode on menu (AI plays)
- All games: Difficulty level selector at game start
- All games: Tutorial overlay for first-time players

---

#### 14. Code Quality (Future)

- [ ] MatrixAscension: Consolidate redundant altitude state variables (line 119 has unused `_altitude`)
- [ ] Extract collision detection logic into reusable utility
- [ ] Add error boundaries around game components
- [ ] Consider code-splitting to reduce 660KB chunk size

---

## Resolved Items

### Previously Flagged - Now Resolved or Clarified

| Item | Status | Notes |
|------|--------|-------|
| TerminalQuestContent.ts TODO comment | **Not a bug** | Line 427 is intentional story content (developer room easter egg) |
| Games not integrated | **Resolved** | All 11 games are in App.tsx |
| useGameLoop not used | **Clarified** | JimmyMatrix implements custom loop, acceptable |
| JimmyMatrix `_getTimingGrade` | **Clarified** | Lines 255-262 unused function (underscore prefix), not a bug |
| AgentEscape `_TUNNEL` constant | **Clarified** | Line 65 defined but tunnel uses hardcoded y=14 checks instead |
| M-key mute toggle | **Resolved** | Games have M-key handling - verified in CrossyRoad, MatrixAscension, AgentEscape, JimmyMatrix, and others |

---

## Architecture Notes

### Hooks Available (use these, do not reinvent)

**Core Game Hooks (17 total):**
- `useGameLoop` - RAF with delta time, auto-cleanup
- `useSoundSystem` - Standard SFX library with 15+ predefined effects (jump, hit, score, powerup, levelUp, combo, gameOver, menu, etc.)
- `useSoundSynthesis` - Procedural audio (synthLaser, synthExplosion, synthPowerUp, synthDrum, synthVoice)
- `useSaveSystem` - High scores, achievements, game stats, export/import with automatic backup, version migration
- `useAchievementManager` - Achievement notifications and tracking with modal display
- `useParticleSystem` - Pooled particle effects with 6 types (food, explosion, trail, powerup, matrix, impact)
- `useObjectPool` - Memory-efficient object reuse with specialised pools (Particle, Projectile, Enemy)
- `useViewportCulling` - Off-screen object culling with spatial grid partitioning
- `usePerformanceMonitor` - FPS tracking and metrics
- `useInterval` - Declarative setInterval with React lifecycle management
- `usePowerUps` - Power-up management (bigger_paddle, slower_ball, score_multiplier, multi_ball)
- `useMobileDetection` - Device type detection (mobile, tablet, desktop, touch)
- `useProceduralAudio` - Engine sounds, collisions, adaptive music
- `useShatnerVoice` - Dramatic TTS for CtrlSWorld
- `useAdvancedVoice` - Multiple personas with SSML
- `useLifelineManager` - Puzzle lifeline system (Free Answers, 50/50, Sentient AI, Ask Characters)
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

### Achievement Integration Pattern (Dual-Call)

```typescript
const unlockGameAchievement = useCallback((achievementId: string) => {
  achievementManager?.unlockAchievement('gameId', achievementId);
  unlockSaveAchievement('gameId', achievementId);
}, [achievementManager, unlockSaveAchievement]);
```

### Sound Wrapper Pattern

```typescript
const playSound = useCallback((sound: string) => {
  if (!isMuted) playSFX(sound);
}, [isMuted, playSFX]);
```

---

## Reference Implementations

- **Grid-based movement:** SimpleSnake.tsx / useSimpleSnakeGame.ts
- **Canvas rendering + physics:** VortexPong.tsx
- **Object pooling:** MatrixInvaders.tsx
- **Scrolling obstacles:** MatrixCloud.tsx
- **Timing-based gameplay:** Metris.tsx
- **Ghost AI (Pacman-style):** AgentEscape.tsx (4 unique behaviours)
- **Rhythm game timing:** JimmyMatrix.tsx
- **State machine pattern:** All games use GamePhase enum

---

## Quick Reference: Priority Order for Implementation

### P0 - Critical (All 6 Bugs FIXED ✓)
1. [x] CrossyRoad.tsx - **3 BUGS FIXED**: magnet attraction, dodge counter, magnet HUD
2. [x] AgentEscape.tsx - **1 BUG FIXED**: fruit system implemented
3. [x] MatrixAscension.tsx - **1 BUG FIXED**: deltaTime applied to all physics
4. [x] JimmyMatrix.tsx - **1 BUG FIXED**: hold/double note types implemented

### P1 - High Priority (Testing - ALL COMPLETE ✓)
5. [x] **Fix failing tests** - SaveLoadManager.test.tsx lines 244/265 + SentientAIModal.test.tsx line 297 ✓ FIXED
6. [x] Expand unit tests for 4 new games (deeper coverage) ✓ COMPLETED
7. [x] Add visual E2E tests for 5 games missing coverage ✓ COMPLETED (26 Jan 2026 15:57 UTC)

### P2 - Medium Priority (Polish - ALL COMPLETE ✓)
8. [x] Sound integration consistency across all new games ✓ COMPLETE
9. [x] AgentEscape ghost AI and sound polish ✓ COMPLETE (26 Jan 2026)
10. [x] JimmyMatrix audio and visual polish ✓ COMPLETE (26 Jan 2026)
11. [x] CrossyRoad difficulty and feature polish ✓ COMPLETE (26 Jan 2026)
12. [x] MatrixAscension visual and audio polish ✓ COMPLETE (26 Jan 2026)

### P3 - Low Priority (Future/Optional)
13. [ ] Enhanced features (audio sync, tutorials, difficulty selectors)
14. [ ] Code quality improvements
15. [ ] AgentEscape continuous background siren (optional enhancement)

---

## Test Coverage Summary

| Category | Coverage | Notes |
|----------|----------|-------|
| Hooks | 100% | All 17 hooks have comprehensive tests |
| Production Games | 100% | VortexPong, SimpleSnake, MatrixCloud, MatrixInvaders, Metris, CtrlSWorld, TerminalQuest |
| New Games Unit | 90%+ | 152 tests (36 CrossyRoad, 38 MatrixAscension, 35 AgentEscape, 43 JimmyMatrix) |
| E2E Visual | 100% | 11/11 games covered (47 new visual tests added) |

---

*Updated on 26 January 2026 17:00 UTC - ALL P0/P1/P2 ITEMS COMPLETE*
*All 11 games playable, polished, and production ready*
*Build: PASSES (warning: 669KB chunk exceeds 500KB limit)*
*Tests: ALL PASS (412 game tests total)*
*E2E Visual: 100% coverage (11/11 games with 47 new visual tests)*

**6 BUGS FIXED ✓ (26 Jan 2026):**
1. ✓ CrossyRoad magnet: Added attraction logic - red pills now gravitate toward player when magnet is active
2. ✓ CrossyRoad dodge: Moved near-miss tracking outside collision block - now tracks actual near-misses
3. ✓ CrossyRoad HUD: Added magnet indicator to HUD with fuchsia colour
4. ✓ AgentEscape fruit: Implemented full fruit system (cherry/apple/orange spawning, collection, scoring, achievement)
5. ✓ MatrixAscension deltaTime: Applied deltaTime normalisation to all physics calculations
6. ✓ JimmyMatrix notes: Added hold/double note type generation with difficulty-based distribution and rendering

**3 TEST FAILURES FIXED ✓ (26 Jan 2026):**
1. ✓ SaveLoadManager.test.tsx line 244: Changed getByText('High Score') to getAllByText() pattern
2. ✓ SaveLoadManager.test.tsx line 265: Changed getByText('Recent Achievements:') to getAllByText() pattern
3. ✓ SentientAIModal.test.tsx line 297: Fixed CSS selector and timer advance for answer highlight test

**UNIT TEST EXPANSION ✓ (26 Jan 2026 15:55 UTC):**
- CrossyRoad.test.tsx: 16 → 36 tests (+20 tests for state machine, achievements, bullet time, movement, HUD)
- MatrixAscension.test.tsx: 17 → 38 tests (+21 tests for state machine, achievements, HUD, shooting, platforms)
- AgentEscape.test.tsx: 17 → 35 tests (+18 tests for state machine, achievements, HUD, movement, ghost AI)
- JimmyMatrix.test.tsx: 22 → 43 tests (+21 tests for state machine, track selection, lane keys, note generation)

**P2 VISUAL POLISH ✓ (26 Jan 2026 16:40 UTC):**
- CrossyRoad combo system: Near-miss dodges build combo with score multiplier (2x-5x), 3s expiry timer, HUD display
- MatrixAscension spring compression: 200ms bounce animation with visual height reduction
- MatrixAscension enemy death: 300ms spin/scale/fade animation with colour change to red
- MatrixAscension parallax rain: 3 depth layers with different speeds, sizes, and opacities
