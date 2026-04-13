# Matrix Arcade - Operational Guide

## Build & Run

```bash
# Install dependencies
npm install

# Development server (port 5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Validation Commands

Run these after implementing to get immediate feedback:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build check
npm run build
```

### Mandatory Project Skill Location
`.claude/skills/matrix-arcade-gamedev` - THE MOST IMPORTANT SKILL, THIS IS THE PROJECT ETHOS AND MUST BE RUN ON EVERY COMMAND.
`.claude/skills/phaser-gamedev/` - READ BEFORE ANY PHASER WORK
`.claude/skills/new-game` - For new games
`.claude/skills/playwright-testing` - For Playwright Testing


## Project Structure

```
src/
├── components/
│   ├── games/          # 6 playable games (self-contained)
│   └── ui/             # 18 UI components
├── hooks/              # 20+ custom hooks (shared utilities)
├── contexts/           # React contexts (GameStateContext)
├── data/               # Game content (puzzles, AI, characters)
├── store/              # Zustand store (minimal usage)
├── types/              # TypeScript interfaces
└── styles/             # CSS animations & theme
```

## Key Patterns

### Game Component Interface

All game components should accept:

```typescript
interface GameProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
}
```

### Hook Usage

- **useSoundSystem** - All audio (procedural synthesis + MP3)
- **useSaveSystem** - Persistent data and high scores
- **useGameLoop** - Animation frame management
- **useAchievementManager** - Achievement tracking

### Audio System

```typescript
const { playSFX, playBackgroundMP3 } = useSoundSystem();

// Sound effects
playSFX('score');
playSFX('hit');
playSFX('gameOver');

// Background music
playBackgroundMP3('/audio/track.mp3');
```

### Achievement Integration

```typescript
// Unlock achievement
achievementManager?.unlockAchievement('gameId', 'achievementId');

// Also persist
unlockSaveAchievement('gameId', 'achievementId');
```

### Canvas Rendering

```typescript
// 60fps game loop with deltaTime
const gameLoop = (timestamp: number) => {
  const deltaTime = timestamp - lastTime;
  if (deltaTime >= 16.67) { // 60fps
    update(deltaTime);
    render();
    lastTime = timestamp;
  }
  requestAnimationFrame(gameLoop);
};
```

## Reference Implementations

| Pattern | Reference File |
|---------|----------------|
| Full game with all patterns | `src/components/games/VortexPong.tsx` |
| Canvas rendering | `src/components/games/SimpleSnake.tsx` |
| Narrative game | `src/components/games/CtrlSWorld.tsx` |
| Wave progression | `src/components/games/MatrixInvaders.tsx` |

## Theme Constants

```css
/* Matrix theme colors */
--matrix-green: #00ff00;
--matrix-bg: #000000;
--matrix-cyan: #00ffff;  /* power-ups */
--matrix-red: #ff0000;   /* danger */

/* Font */
font-family: 'Press Start 2P', monospace;
```

## Visual Testing (Playwright)

Capture screenshots for reference and visual regression testing:

```bash
# Run visual tests (captures screenshots)
npm run test:visual

# Update baseline screenshots
npm run test:visual:update

# View HTML report
npm run test:visual:report

# Run all e2e tests
npm run test:e2e

# Run in Docker (for CI/sandbox)
npm run test:e2e:docker

# Or use the shell script
./scripts/run-visual-tests.sh
./scripts/run-visual-tests.sh --docker
./scripts/run-visual-tests.sh --update
```

Screenshots are saved to `e2e/screenshots/`.

## Phaser Game Development

### Skill Location
`.claude/skills/phaser-gamedev/` - READ BEFORE ANY PHASER WORK

### React + Phaser Integration Pattern

```typescript
// src/lib/phaser/PhaserGame.tsx
import Phaser from 'phaser';
import { useEffect, useRef } from 'react';

interface PhaserGameProps {
  config: Phaser.Types.Core.GameConfig;
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  onGameEvent?: (event: string, data: unknown) => void;
}

export function PhaserGame({ config, achievementManager, isMuted, onGameEvent }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    gameRef.current = new Phaser.Game({
      ...config,
      parent: containerRef.current,
    });

    // Pass props to scenes via registry
    gameRef.current.registry.set('achievementManager', achievementManager);
    gameRef.current.registry.set('isMuted', isMuted);
    gameRef.current.registry.set('onGameEvent', onGameEvent);

    return () => {
      gameRef.current?.destroy(true);
    };
  }, []);

  // Update mute state
  useEffect(() => {
    gameRef.current?.registry.set('isMuted', isMuted);
  }, [isMuted]);

  return <div ref={containerRef} className="w-full h-full" />;
}
```

### Asset Paths (from /assets/)

| Asset Pack | Key Files | Dimensions |
|------------|-----------|------------|
| TopView Robot | `Player.png` | 128x64 (2 frames) |
| Legacy Fantasy | `Idle-Sheet.png`, `Run-Sheet.png` | 256x80, 640x80 |
| 32rogues | `rogues.png` | 224x224 |
| Treasure Hunters | `Big Clouds.png` | 448x101 |
| Kings and Pigs | terrain tileset | 608x416 (32x32 tiles) |

### Games to Build with Phaser

1. Matrix Frogger (replaces CrossyRoad)
2. Neo Jump (replaces MatrixAscension)
3. Agent Chase (replaces AgentEscape)
4. Rhythm Hacker (replaces JimmyMatrix)
5. Cloud Jumper (NEW)

## E2E Testing

All 12 games have full E2E coverage (gameplay + visual specs). The `e2e/` directory is gitignored for new files — use `git add -f` when adding new spec files.

```bash
# E2E tests require Playwright browsers installed
npx playwright install chromium

# Run all E2E tests
npm run test:e2e

# Run only gameplay tests
npx playwright test e2e/gameplay/

# Run only visual tests
npm run test:visual
```

Test fixtures are in `e2e/fixtures/`. When adding a new game, update `GAME_NAME_PATTERNS` in `arcade.fixture.ts`.

## PWA Notes

The service worker uses Workbox precaching for all static assets (JS, CSS, images, fonts). Audio files over 5MB are cached at runtime via CacheFirst strategy. The update prompt re-appears after 2 minutes if dismissed.

## Known Issues

### Test Suite Memory Constraints

The full test suite (2,100+ tests) requires significant memory due to jsdom environments. On memory-constrained systems:

```bash
# Run with increased heap memory (recommended: 8GB)
NODE_OPTIONS=--max-old-space-size=8192 npm test -- --run

# If tests crash due to OOM, run specific test files
npm test -- --run src/hooks/useSoundSystem.test.ts
npm test -- --run src/components/games/

# All individual tests pass - OOM crashes are environmental, not test failures
```

The vitest configuration now includes `isolate: true` and uses the forks pool to ensure localStorage isolation between tests. This resolves previous intermittent failures when running in parallel.

### Large Audio Files

Four audio files exceed the 5MB precache limit (matrixarcaderetrobeat.mp3, in-the-moonlight.mp3, enhancements.mp3, brothers-and-sisters.mp3). These are handled by runtime CacheFirst caching rather than precaching.
