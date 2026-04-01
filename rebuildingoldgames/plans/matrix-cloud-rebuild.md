# Matrix Cloud — Phaser Rebuild Plan

## Status: RESEARCH NEEDED

## Design Vision
Complete redesign as proper Flappy Bird clone with Matrix aesthetics. Current version has fundamental collision/scoring bugs. New version needs proper physics-based flight, correct gap scoring, and polished sprites.

## Reference Images
- `../inspirationimagesandsprites/matrixcloud/` (52 sprites — Flappy Bird pixel art pack, CC0 license)

## Current State
- **File**: `src/components/games/MatrixCloud.tsx` (1,451 lines)
- **Architecture**: Canvas 2D + RAF loop, state machine
- **Features**: Flappy Bird variant, boss battles (3 types), power-ups, lives, combos, levels
- **Power-ups**: 4 (shield, time slow, extra life, double points)
- **Bosses**: 3 types (agent_smith, sentinel, architect)

## Known Bugs (CRITICAL)
- **Combo awarded without passing through gap** — scores just by existing near pillars
- **Sprite quality poor** — needs replacement with pixel art assets
- Should be: pass through gap = score + combo, touch pipe = lose life

## Research Tasks
- [ ] Study Flappy Bird physics model (gravity constant, tap impulse, terminal velocity)
- [ ] Catalogue all 52 sprites in `matrixcloud/` (bird variants, pipe sprites, backgrounds)
- [ ] Design proper gap collision system (only score on clean pass-through)
- [ ] Plan pipe generation (gap height, spacing, difficulty curve)
- [ ] Plan boss system port (attack patterns, health bars)
- [ ] Plan power-up integration with Phaser physics
- [ ] Design lives/combo system (reset combo on damage, maintain on clean pass)
- [ ] Plan background parallax layers
- [ ] Design achievement list (8+)
- [ ] Write test plan — especially test that combo ONLY awards on gap pass-through

## Core Physics (draft)
```
GRAVITY = 1200 (pixels/sec²)
TAP_IMPULSE = -400 (pixels/sec, upward)
TERMINAL_VELOCITY = 600 (pixels/sec, downward)
PIPE_SPEED = 200 (pixels/sec, leftward)
GAP_HEIGHT = 150 (pixels, shrinks with level)
```
