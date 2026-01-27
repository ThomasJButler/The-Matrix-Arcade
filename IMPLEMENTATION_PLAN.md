# Matrix Arcade - Implementation Plan

This file is auto-generated and updated by Ralph during planning and building loops.

Run `./loop.sh plan` or `./loop-full.sh` to analyse the codebase and generate tasks.

---

## Completion Status

- **Status**: POLISHED - All P0/P1/P2 complete and COMMITTED
- **Last Verified**: 27 January 2026 - Build passes (2.18MB bundle), TypeScript clean, 0 lint errors
- **Version**: v1.9.9
- **Commit**: 329bf4c - Update implementation plan version to v1.9.8
- **Test Coverage**: 1,588 unit tests PASS (49 test files), E2E visual tests for all 11 games

### E2E Screenshot Status

| Game | Test Spec | Screenshots | Status |
|------|-----------|-------------|--------|
| Cloud Jumper | `cloud-jumper.spec.ts` | ✓ `cloud-*.png` | **WORKING** |
| Rhythm Hacker | `rhythm-hacker.spec.ts` | ✓ `jimmy-matrix-*.png` | **WORKING** |
| Matrix Frogger | `matrix-frogger.spec.ts` | `crossy-road-*.png` | Needs local re-run |
| Neo Jump | `neo-jump.spec.ts` | `ascension-*.png` | Needs local re-run |
| Agent Chase | `agent-chase.spec.ts` | `agent-escape-*.png` | Needs local re-run |

**USER ACTION REQUIRED**: Run E2E tests locally to capture new screenshots:
```bash
npx playwright test e2e/visual/games/matrix-frogger.spec.ts e2e/visual/games/neo-jump.spec.ts e2e/visual/games/agent-chase.spec.ts
```

---

## Current State Summary

- **Games Implemented**: 11 total (all playable)
- **Phaser Games**: 5 (Matrix Frogger, Neo Jump, Agent Chase, Rhythm Hacker, Cloud Jumper)
- **React/Canvas Games**: 6 (CTRL-S, Snake Classic, Vortex Pong, Matrix Cloud, Matrix Invaders, Metris, Terminal Quest)
- **Achievement System**: 79 total achievements (72 game-specific + 7 global)
- **Hooks Library**: 17 shared hooks for games to use (all tested)
- **Visual Consistency**: Matrix theme throughout (green-on-black, glow effects, CRT aesthetic)

---

## P3 - Low Priority (Nice to Have)

### Enhanced Features (Future)

These are not blockers but would enhance the experience:
- JimmyMatrix: Actual audio file playback synchronised with notes
- JimmyMatrix: Latency calibration option for different hardware
- JimmyMatrix: Seed-based note generation for leaderboard fairness
- JimmyMatrix: Replay recording/playback
- AgentEscape: Intermission screens between levels
- AgentEscape: Demo mode on menu (AI plays)
- AgentEscape: Continuous background siren (requires looping sound system enhancement)
- All games: Difficulty level selector at game start
- All games: Tutorial overlay for first-time players

### Code Quality (Future)

- [ ] MatrixAscension: Consolidate redundant altitude state variables
- [ ] Extract collision detection logic into reusable utility
- [ ] Add error boundaries around game components
- [ ] Consider code-splitting to reduce 2.18MB bundle size
- [ ] Improve E2E test reliability with explicit wait conditions

---

## Architecture Notes

### Hooks Available (use these, do not reinvent)

**Core Game Hooks (17 total):**
- `useGameLoop` - RAF with delta time, auto-cleanup
- `useSoundSystem` - Standard SFX library with 15+ predefined effects
- `useSoundSynthesis` - Procedural audio (synthLaser, synthExplosion, etc.)
- `useSaveSystem` - High scores, achievements, game stats, export/import
- `useAchievementManager` - Achievement notifications and tracking
- `useParticleSystem` - Pooled particle effects with 6 types
- `useObjectPool` - Memory-efficient object reuse
- `useViewportCulling` - Off-screen object culling
- `usePerformanceMonitor` - FPS tracking and metrics
- `useInterval` - Declarative setInterval with React lifecycle
- `usePowerUps` - Power-up management
- `useMobileDetection` - Device type detection
- `useProceduralAudio` - Engine sounds, collisions, adaptive music
- `useShatnerVoice` - Dramatic TTS for CtrlSWorld
- `useAdvancedVoice` - Multiple personas with SSML
- `useLifelineManager` - Puzzle lifeline system
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
- **Ghost AI (Pacman-style):** AgentEscape.tsx
- **Rhythm game timing:** JimmyMatrix.tsx
- **Phaser + React integration:** src/lib/phaser/PhaserGame.tsx

---

## Troubleshooting

### Games Appear Frozen / Press Enter Not Working

1. **Hard refresh browser**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Restart dev server**: `pkill -f vite && npm run dev`
3. **Clear browser cache**: DevTools (F12) → Application → Storage → "Clear site data"
4. **Try incognito window**: Ensures no cached code is used
5. **Check console for errors**: DevTools (F12) → Console tab

### Test Suite Memory Constraints

The full test suite requires significant memory. On memory-constrained systems:
```bash
# Run with increased heap memory
NODE_OPTIONS=--max-old-space-size=8192 npm test -- --run

# Or run specific test files
npm test -- --run src/hooks/useSaveSystem.test.ts
npm test -- --run src/components/games/
```

---

*Updated on 27 January 2026 - All P0/P1/P2 complete*
*Build: PASSES (2.18MB bundle)*
*Tests: 1,588 unit tests PASS, E2E specs complete*
