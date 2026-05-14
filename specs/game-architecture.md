# Game Architecture Specification

This document defines the architectural patterns all Matrix Arcade games must follow.

## Game Component Requirements

### Props Interface

Every game component must accept these props:

```typescript
interface GameProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;   // Skip menu, jump straight to gameplay
  onExit?: () => void;   // Callback when player exits (ESC)
}
```

### Required Hook Integrations

| Hook | Purpose | Required |
|------|---------|----------|
| useSoundSystem | Audio playback | Yes |
| useSaveSystem | High scores & persistence | Yes |
| useGameLoop | Frame timing | Recommended |
| useParticleSystem | Visual effects | Optional |
| useObjectPool | Memory optimization | Optional |

### State Flow

All games must follow this state machine:

```
IDLE/MENU → PLAYING → PAUSED → PLAYING → GAME_OVER
     ↑                                        │
     └────────────────────────────────────────┘
                    (restart)
```

## Rendering Patterns

### Canvas Games (60fps)

```typescript
const FRAME_TIME = 1000 / 60; // 16.67ms

const gameLoop = useCallback((timestamp: number) => {
  if (!lastTimeRef.current) lastTimeRef.current = timestamp;

  const deltaTime = timestamp - lastTimeRef.current;

  if (deltaTime >= FRAME_TIME) {
    // Update game state
    update(deltaTime);

    // Render frame
    render(ctx);

    lastTimeRef.current = timestamp;
  }

  if (gameState === 'playing') {
    requestAnimationFrame(gameLoop);
  }
}, [gameState]);
```

### Decorative Effects (30fps)

Matrix rain and background effects should throttle to 30fps:

```typescript
const EFFECT_FRAME_TIME = 1000 / 30; // 33.33ms
```

### Canvas Cleanup

Always clear canvas with appropriate background:

```typescript
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
```

## Achievement Integration

### Unlocking Achievements

```typescript
// Always check if manager exists
if (achievementManager) {
  achievementManager.unlockAchievement('gameId', 'achievementId');
}

// Also persist via save system
unlockSaveAchievement('gameId', 'achievementId');
```

### Achievement Categories

Each game should have achievements for:

- First play / first score
- Score milestones (100, 500, 1000, etc.)
- Skill-based (no damage, perfect run, etc.)
- Hidden / discovery achievements

## Sound Integration

### Using the Sound System

```typescript
const { playSFX, playBackgroundMP3, stopAllAudio, config } = useSoundSystem();

// Check mute state before playing
if (!isMuted && config.sfx) {
  playSFX('score');
}

// Background music
if (!isMuted && config.music) {
  playBackgroundMP3('/audio/game-music.mp3');
}
```

### Required Sound Events

| Event | Sound | Notes |
|-------|-------|-------|
| Score/collect | `score` | Short, satisfying |
| Hit/damage | `hit` | Impact feedback |
| Game over | `gameOver` | Final, dramatic |
| Power-up | `powerup` | Positive, energizing |
| Level up | `levelUp` | Achievement feeling |
| Menu select | `select` | Menu hover/click feedback |

## Save System Integration

### High Scores

```typescript
const { saveHighScore, getHighScore } = useSaveSystem();

// Load on mount
useEffect(() => {
  const saved = getHighScore('gameId');
  if (saved) setHighScore(saved);
}, []);

// Save on game over
if (score > highScore) {
  saveHighScore('gameId', score);
}
```

### Game State Persistence

For games with progress (like CTRL-S World):

```typescript
const { saveGameState, loadGameState } = useSaveSystem();
```

## Input Handling

### Required Keyboard Support

| Key | Action | Required |
|-----|--------|----------|
| ESC | Exit to menu | Yes |
| P | Pause/resume | Yes (where applicable) |
| M | Toggle mute | Yes |
| R | Restart | On game over |
| Enter | Start/confirm | Yes |
| Arrow keys | Primary movement | Yes |
| WASD | Alt movement | Recommended |
| Space | Action/jump | Where applicable |

### Event Cleanup

Always remove event listeners on unmount:

```typescript
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## Performance Requirements

### Frame Budget

- Game logic: < 8ms
- Rendering: < 8ms
- Total: < 16ms (60fps)

### Memory Management

- Use object pooling for frequently created objects
- Clear intervals/timeouts on unmount
- Dispose of audio contexts when not needed

### Optimization Techniques

```typescript
// Object pooling for particles
const particlePool = useObjectPool<Particle>(100);

// Viewport culling
const isVisible = useViewportCulling(position, bounds);

// Memoize expensive calculations
const pathfinding = useMemo(() => calculatePath(grid), [grid]);
```

## File Organisation

### React/Canvas Games

```
src/components/games/
├── GameName.tsx           # Main component
├── GameName.test.tsx      # Tests
└── (optional helpers)
```

Game-specific hooks go in `src/hooks/useGameNameLogic.ts`.

### Phaser Games

```
src/components/games/phaser/GameName/
├── index.tsx              # React wrapper (mounts PhaserGame)
├── config.ts              # Phaser config + GAME_CONFIG constants
└── scenes/
    ├── BootScene.ts       # Asset loading
    ├── MenuScene.ts       # Title screen (optional if autoStart)
    ├── GameScene.ts       # Main gameplay
    └── GameOverScene.ts   # Score display + restart
```

Phaser scenes extend `BaseScene` from `src/lib/phaser/scenes/BaseScene.ts`.

## Reference Implementation

See `src/components/games/VortexPong.tsx` for a complete example implementing all patterns:

- Achievement integration
- Sound system usage
- Save system for high scores
- Canvas rendering at 60fps
- Particle effects
- Power-up system
- Proper state management
