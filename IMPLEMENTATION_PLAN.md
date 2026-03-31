# Matrix Arcade - Implementation Plan

This file is auto-generated and updated by Ralph during planning and building loops.

Run `./loop.sh plan` or `./loop-full.sh` to analyse the codebase and generate tasks.

---

## Completion Status

- **Status**: IN PROGRESS - New features being added
- **Last Verified**: 31 March 2026 - TypeScript clean, 1,588+ unit tests PASS
- **Version**: v2.0.0 (in progress)
- **Test Coverage**: 1,588+ unit tests PASS (49 test files), 167 E2E visual baseline screenshots across 16 game suites
- **Games**: 11 playable (7 React/Canvas + 5 Phaser) + 1 new game in progress (Code Breaker)

### Available Skills & Slash Commands

| Skill | Slash Command | When to Use |
|-------|---------------|-------------|
| Matrix Arcade Gamedev | `/matrix-arcade-gamedev` | Any game code changes |
| Phaser Gamedev | `/phaser-gamedev` | Phaser 3 scene development |
| Playwright Testing | `/playwright-testing` | E2E test creation/debugging |
| New Game Scaffolder | `/new-game <Name> [--phaser]` | Scaffolding a brand new game |
| Game Tester | `/game-tester` | Run full test suite after changes |

---

## P1 - New Features (In Progress)

### 1. ✅ Game Categories System (COMPLETE)

Added `GameCategory` type (`Arcade | Puzzle | Shooter | Story | Rhythm | Classic`) with:
- Category field on all 11 games in App.tsx and LandingPage.tsx
- Filter tabs on LandingPage (filter by category with counts)
- Category badge on each game card
- Grouped side nav with category headers
- Category badge in carousel portal view

**Files**: `src/types/game.ts`, `src/App.tsx`, `src/components/LandingPage.tsx`

### 2. 🔵 Epic Snake Enhancement (PLANNED)

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

### 3. 🔵 Code Breaker - New Flagship Game (PLANNED)

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

### Code Quality (Future)

- [ ] Neo Jump: Consolidate redundant altitude state variables
- [ ] Extract collision detection logic into reusable utility
- [ ] Add error boundaries around game components
- [ ] Consider code-splitting to reduce 2.18MB bundle size
- [ ] Improve E2E test reliability with explicit wait conditions instead of timeouts

### Testing Improvements

- [ ] Add `window.__TEST__` test seams to Phaser games for deterministic testing (fixes flaky jimmy-matrix-gameover test due to animated matrix rain background)
- [ ] Add Terminal Quest pause screen test
- [ ] Verify Cloud and CTRL-S World game over triggering in E2E tests

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
| Arrow keys | Primary movement | Yes |
| WASD | Alt movement | Recommended |
| SPACE | Primary action | Where applicable |
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

- **Games Implemented**: 11 playable + 1 in progress (Code Breaker)
- **Game Categories**: 6 categories (Arcade, Classic, Shooter, Puzzle, Story, Rhythm) with filter UI
- **Phaser Games**: 5 (Matrix Frogger, Neo Jump, Agent Chase, Rhythm Hacker, Cloud Jumper)
- **React/Canvas Games**: 6 (CTRL-S World, Snake Classic, Vortex Pong, Matrix Cloud, Matrix Invaders, Metris)
- **Achievement System**: 79 total achievements (72 game-specific + 7 global) — expanding with new features
- **Hooks Library**: 17 shared hooks
- **Visual Consistency**: Matrix theme throughout (green-on-black, glow effects, CRT aesthetic)
- **E2E Coverage**: 167 visual baseline screenshots across 16 game suites

### Game Status Table

| Game | Category | Type | Status | Notes |
|------|----------|------|--------|-------|
| CTRL-S The World | Story | React | ✅ Working | 5-chapter narrative adventure |
| Snake Classic | Arcade | React | 🔵 Enhancing | Adding 3 modes, visual overhaul |
| Vortex Pong | Classic | React | ✅ Working | Paddle/ball with AI |
| Matrix Cloud | Arcade | React | ✅ Working | Flappy Bird variant |
| Matrix Invaders | Shooter | React | ✅ Working | Space Invaders |
| Metris | Puzzle | React | ✅ Working | Tetris with bullet time |
| Matrix Frogger | Arcade | Phaser | ✅ Working | Grid-based crossing |
| Neo Jump | Classic | Phaser | ✅ Working | Doodle Jump-style |
| Agent Chase | Classic | Phaser | ✅ Working | Pac-Man maze |
| Rhythm Hacker | Rhythm | Phaser | ✅ Working | Guitar Hero-style |
| Cloud Jumper | Arcade | Phaser | ✅ Working | Side-scroller |
| Code Breaker | Shooter | React | 🔵 Planned | Brick breaker — new flagship game |

---

## Phaser Skill Reference

Before making changes to Phaser games, always read:
1. `.claude/skills/phaser-gamedev/SKILL.md` - Core patterns and architecture
2. `.claude/skills/phaser-gamedev/references/spritesheets-nineslice.md` - MEASURE sprites before loading
3. `.claude/skills/phaser-gamedev/references/arcade-physics.md` - Physics configuration

---

*Updated on 31 March 2026 — Game categories added, Snake enhancement and Code Breaker planned*
*Build: PASSES (2.18MB bundle)*
*TypeScript: CLEAN (0 errors)*
*Unit Tests: PASS (1,588+ tests across 49 files)*

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

### P2 - Medium Priority (Resolved)
15. ✅ Missing E2E baseline screenshot (jimmy-matrix-gameover)
16. 🟡 Cloud Jumper E2E carousel timing (minor, doesn't affect gameplay)

</details>
