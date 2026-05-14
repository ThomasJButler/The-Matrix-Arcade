# Metris — Asset Requirements

## Source Mapping

| Asset Category | Source | Location |
|---|---|---|
| Tetris tile variants | INSPO/metris/tetrissprites | 4 styles: 1-bit B&W, 1-bit green, 1-bit inverted, 8-bit coloured |
| UI panels (Hold/Next/Score) | DUMP/1. Free Hologram Interface Wenrexa | Card X* directories for panels |
| Sound Effects | DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects | SFX kit for all game sounds |
| Background Music | DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks | Tetris tempo-based tracks |
| Score Display Fonts | DUMP/NotJamFontPack | Multiple font families available |

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/metris/)

- [x] Tetris tile set — 4 variants (1-bit B&W, 1-bit green, 1-bit inverted, 8-bit coloured) by Zro Dfects
- [x] Reference images: modern and retro Tetris screenshots
- [x] License: free for commercial/non-commercial use

## Still Needed

### Blocks / Tetrominoes (7 pieces × unique colour each)
- [x] Coloured tile sprites — 8-bit coloured variant available
- [x] Individual tile sprites per tetromino colour (I=cyan, O=yellow, T=purple, S=green, Z=red, J=blue, L=orange) — 32×32 each — deployed to `public/assets/metris/tile_*.png` (R36)
- [ ] Ghost piece tile (translucent/outline version of each colour) — 32×32
- [ ] Locked/placed tile variant (slightly darker, settled look)
- [ ] Line clear flash tile — bright white/gold version, 32×32
- [ ] Bullet time tile variant (glowing edges when bullet time active)

### Grid / Playfield
- [ ] Grid background tile — subtle dark squares, 32×32, tileable
- [ ] Grid border frame — left, right, bottom edges
- [ ] Grid top fade (pieces enter from above)

### UI Panels
- [x] Hold piece panel background — panel_green.png + panel_tall.png (30% alpha backdrop) — loaded in BootScene — R78.2
- [x] Next piece preview panel — panel_tall.png (30% alpha backdrop) — loaded in BootScene — R78.2
- [x] Score panel background — panel_wide.png — loaded in BootScene — R78.2
- [~] Level display panel — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Card X*
- [ ] Combo counter popup
- [ ] Bullet time meter bar (fill + frame)
- [ ] T-spin indicator flash

### Effects
- [ ] Line clear particle burst — 16×16, 4-6 frames
- [ ] Hard drop impact effect — bottom sparkle, 32×32
- [ ] Bullet time activation flash (screen tint overlay)
- [ ] Level up celebration effect
- [ ] T-spin celebration effect

### Background
- [ ] Playfield background — dark Matrix theme, 800×600
- [ ] Matrix rain subtle overlay for background area
- [ ] Level-based background variants (optional — gets more intense at higher levels)

### Audio
- [x] Piece move (soft click) — covered by global SFX kit (sfx_blip.mp3) — R78.1
- [~] Piece rotate — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [x] Piece hard drop (impact thud) — covered by global SFX kit (sfx_elevator_drop.mp3) — R78.1
- [~] Piece soft drop — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [x] Single line clear — covered by global SFX kit (sfx_glass_break.mp3 / sfx_statue_break.mp3) — R78.1
- [x] Double/triple line clear (bigger sound) — covered by global SFX kit (sfx_explosion_large.mp3) — R78.1
- [~] Tetris (4 lines) fanfare — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] T-spin sound — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Bullet time activate — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Bullet time deactivate — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Level up jingle — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Game over dramatic sting — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Background music (electronic, tempo increases with level, loopable) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks
