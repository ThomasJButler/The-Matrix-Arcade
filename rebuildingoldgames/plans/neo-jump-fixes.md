# Neo Jump — Bug Fixes & UX Redesign

## Status: RESEARCH NEEDED

## Already Phaser — needs major fixes and visual overhaul.

## Reference Images
- `../inspirationimagesandsprites/doodlejump/` (406 sprites — Doodle RPG pack with knight animations, tiles, UI, particles, items)

## Known Bugs (CRITICAL)
- [ ] Jetpack doesn't work
- [ ] Endless falling — should be instant death when fall below screen
- [ ] Current sprites are placeholder quality — need replacement

## Feature Requests
- [ ] Full UX redesign to match Doodle Jump feel
- [ ] Custom sprites (use knight/RPG pack or create new)
- [ ] Better enemies with distinct behaviours
- [ ] Platform variety (static, moving, breakable, spring — already partially implemented)
- [ ] Clean death: instant game over when player falls past camera, not endless fall

## Research Tasks
- [ ] Catalogue all 406 sprites in `doodlejump/` pack (knight animations, tiles, UI, particles)
- [ ] Decide on sprite style: use RPG knight pack or create Matrix-themed custom sprites
- [ ] Debug jetpack: trace from key handler → fuel → velocity application
- [ ] Design instant death system (camera threshold check)
- [ ] Plan enemy types with Doodle Jump-style behaviours
- [ ] Design platform generation improvements
- [ ] Plan visual overhaul (background, UI, HUD)
- [ ] Write test plan for fixed features
