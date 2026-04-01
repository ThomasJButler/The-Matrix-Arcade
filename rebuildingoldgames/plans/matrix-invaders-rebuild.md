# Matrix Invaders — Phaser Rebuild Plan

## Status: RESEARCH NEEDED

## Design Vision
Good game, needs Phaser visual upgrade. Current object pooling and wave system will be dramatically simplified by Phaser's built-in Groups. Bullet time becomes a single `timeScale` call.

## Reference Images
- `../inspirationimagesandsprites/matrixinvaders/` (16 sprites + 4 inspiration images)

## Current State
- **File**: `src/components/games/MatrixInvaders.tsx` (1,191 lines)
- **Architecture**: Canvas 2D + RAF loop + manual object pooling (useObjectPool)
- **Features**: Waves (8 wide × 5 rows), 5 enemy types, bullet time, boss waves, combos
- **Enemy Types**: code (1hp), agent (2hp), sentinel (3hp), virus (splits), boss (50hp)
- **Achievements**: 5+
- **Test Coverage**: 770 lines (largest test file)

## Known Bugs
- None critical — game is solid
- Power-ups scaffolded but not implemented

## Research Tasks
- [ ] Map manual object pool to Phaser Physics Group recycling
- [ ] Plan bullet time using `scene.physics.world.timeScale`
- [ ] Plan wave system using Phaser Groups (createMultiple, spawn patterns)
- [ ] Catalogue sprites from `matrixinvaders/` (enemy types, player, bullets, effects)
- [ ] Plan boss wave mechanics in Phaser (tween-based movement patterns)
- [ ] Design power-up system (currently scaffolded — implement properly)
- [ ] Plan virus splitting mechanic using Group.create()
- [ ] Plan particle effects for explosions, bullet trails
- [ ] Design achievement list (expand to 10+)
- [ ] Write test plan (port 770-line test file)

## Notes
This game has the most to gain from Phaser — the manual object pooling, collision detection, and bullet time logic are all handled natively by the framework. Code reduction could be 40-50%.
