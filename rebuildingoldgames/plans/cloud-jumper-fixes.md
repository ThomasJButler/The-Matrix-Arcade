# Cloud Jumper — Critical Bug Fix

## Status: RESEARCH NEEDED

## Already Phaser — CRITICAL: cannot jump at all, game is unplayable.

## Reference Images
- `../inspirationimagesandsprites/cloudjumper/` (237 cloud sprites across 10 themes + tileset)

## Known Bugs (CRITICAL)
- [ ] **Cannot jump at all** — game is completely unplayable
- [ ] Jump input was recently consolidated to event callbacks — may have broken something
- [ ] Background was changed from sky-blue to dark Matrix-green — verify visuals still work

## Research Tasks
- [ ] Debug jump mechanic: trace from key handler → jump() → body.touching.down check
- [ ] Check if `isNearCloud()` helper is too restrictive
- [ ] Check if physics body setup is correct (gravity, collision bounds)
- [ ] Catalogue all 237 sprites (10 cloud themes: Sunny, Cherry, Desert, Firey, Frosty, GameBoy, Gloomy, Pale, Pico8, Purpley + Time Fantasy tileset)
- [ ] Plan cloud visual variety (use different themes for different levels/moods)
- [ ] Design level progression with cloud themes
- [ ] Verify the Matrix-green background works with cloud sprites (contrast)
- [ ] Write test plan — especially test that jump actually works!
