# Snake Classic — Phaser Rebuild Plan

## Status: RESEARCH NEEDED

## Design Vision
Transform from basic snake into a flagship 3-mode game. Nokia Snake II nostalgia meets Matrix action. Grid-based movement with sprite-based rendering, particle trails, boss encounters, and a level system.

## Reference Images
- `../inspirationimagesandsprites/snake/` (4 reference images + sprite pack)
- Snake II Nokia screenshots show: high score display, multiplayer option, clean grid

## Current State
- **File**: `src/components/games/SimpleSnake.tsx` (666 lines) + `src/hooks/useSimpleSnakeGame.ts`
- **Architecture**: Canvas 2D with custom hook
- **Features**: Grid movement, food, 4 power-ups (speed, XP, shield, ghost)
- **Achievements**: 6

## Known Bugs
- Too basic — needs more depth and visual appeal

## Research Tasks
- [ ] Study Snake II Nokia UI (score display, menu structure)
- [ ] Design 3-mode architecture (Classic / Matrix / Hacker)
- [ ] Plan Classic Mode: existing gameplay + visual enhancements
- [ ] Plan Matrix Mode: firewall obstacles, Agent Smith enemies, bullet time
- [ ] Plan Hacker Mode: sequence collection (1-0-1-0), decryption puzzles
- [ ] Design level system (progressive difficulty, grid size changes)
- [ ] Design boss encounters (every 5 levels)
- [ ] Plan mini-map for larger grids (levels 6+)
- [ ] Catalogue available sprites from `snake/snakesprites/` folder
- [ ] Design particle trail system
- [ ] Design death/food spawn animations
- [ ] Plan achievement list (expand to 16+)
- [ ] Write test plan

## Sprite Requirements
- Snake head (4 directions)
- Snake body segments (straight, corner, tail)
- Food items (standard, power-up variants)
- Boss sprites
- Firewall/obstacle sprites (Matrix Mode)
- Agent Smith enemy sprite (Matrix Mode)
- Background tiles (grid pattern)
