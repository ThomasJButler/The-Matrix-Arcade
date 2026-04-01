# Metris — Phaser Rebuild Plan

## Status: RESEARCH NEEDED

## Design Vision
Modern Tetris with Matrix aesthetics. SRS rotation, T-spin detection, ghost piece, hold mechanic. Bullet time mode actually working. Sprite-based block rendering instead of canvas rectangles. Line clear animations with tweens.

## Reference Images
- `../inspirationimagesandsprites/metris/` (13 sprites — complete Tetris tile pack from Zro Dfects)

## Current State
- **File**: `src/components/games/Metris.tsx` (1,504 lines)
- **Architecture**: Canvas 2D + interval-based drop (not RAF)
- **Features**: SRS rotation, wall kicks, ghost piece, hold, T-spin, bullet time, levels
- **Tetrominoes**: 7 standard (I, O, T, S, Z, J, L)
- **Bullet Time**: 8s at 40% speed (CURRENTLY BROKEN)
- **Achievements**: 3+

## Known Bugs
- **BULLET TIME (B) DOES NOT WORK** — critical feature is broken
- Visual presentation is dated compared to modern Tetris implementations

## Research Tasks
- [ ] Debug bullet time: trace from key handler through to speed modification
- [ ] Catalogue sprites from `metris/` (tile colours, backgrounds, UI elements)
- [ ] Plan SRS rotation in Phaser tile grid (Tilemap or manual grid)
- [ ] Plan wall kick system port (rotation-aware offsets already fixed)
- [ ] Plan ghost piece as transparent sprite overlay
- [ ] Plan hold mechanic UI (preview panel)
- [ ] Plan next-piece preview (queue of 3-5)
- [ ] Plan T-spin detection (last move type + rotation check)
- [ ] Design line clear animations (flash, slide, particles)
- [ ] Plan level progression (speed curve, background changes)
- [ ] Design achievement list (expand to 10+)
- [ ] Write test plan (port 419-line test file)

## Sprite Requirements
From `metris/` pack:
- 7 block colours for tetrominoes
- Grid background tile
- Ghost piece tint
- UI panel backgrounds
- Line clear effect sprites
