# Vortex Pong — Phaser Rebuild Plan

## Status: RESEARCH NEEDED

## Design Vision
"Perfect, keep as-is, just rebuild." Direct port to Phaser with Arcade physics. The game design is solid — the rebuild is purely for framework consistency and rendering improvements.

## Reference Images
- `../inspirationimagesandsprites/vortexpong/` (3 images + GIF)

## Current State
- **File**: `src/components/games/VortexPong.tsx` (1,031 lines)
- **Architecture**: Canvas 2D + RAF loop with ref-based state
- **Features**: 2-paddle pong, adaptive AI, multi-ball, power-ups, screen shake, combos
- **Power-ups**: 4 (bigger paddle, slower ball, score multiplier, multi-ball)
- **Achievements**: 5

## Known Bugs
- None — game works well

## Research Tasks
- [ ] Map all physics calculations to Phaser Arcade equivalents
- [ ] Plan AI opponent using Phaser physics (velocity tracking)
- [ ] Plan power-up system using Phaser groups/sprites
- [ ] Plan multi-ball using Physics Group spawning
- [ ] Plan particle effects (ball trails, goal explosions)
- [ ] Plan screen shake using camera effects
- [ ] Catalogue sprites from `vortexpong/` folder
- [ ] Write test plan (port existing 296-line test file)

## Notes
This is the ideal first rebuild — lowest risk, highest confidence. The game design doesn't change at all. Use this to establish the React→Phaser migration pipeline that all subsequent rebuilds will follow.
