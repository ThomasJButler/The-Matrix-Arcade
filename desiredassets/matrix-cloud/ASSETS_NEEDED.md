# Matrix Cloud — Asset Requirements (Full Redesign)

## Source Mapping

| Asset Category | Source |
|---|---|
| Flappy Bird core assets (birds, backgrounds, pipes) | `INSPO/matrixcloud/` (52 sprites total) |
| Particle effects & fireworks | `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/` |
| Sound effects | `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/` |
| Background music | `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/` |
| Power-up icons | `DUMP/1. Free Hologram Interface Wenrexa/Icons/` |

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/matrixcloud/)

- [x] Bird style 1 — 7 animation frames (Bird1-1 to Bird1-7) + AllBird1 spritesheet
- [x] Bird style 2 — 7 animation frames (Bird2-1 to Bird2-7) + AllBird2 spritesheet
- [x] 9 background variants (Background1-9)
- [x] 5 pipe/tile styles (PipeStyle, SimpleStyle, TileStyle per style)
- [x] Demo reference images
- [x] CC0 License (Endesga64 palette by Megacrash)

## Still Needed

### Player (Matrix-themed bird/avatar)
- [x] Flap animation spritesheet — 7 frames available in 2 styles — **SOURCE**: `INSPO/matrixcloud/`
- [ ] Player death animation — tumbling/falling, 4-6 frames, 32×32
- [ ] Player invincible variant (shield power-up active)
- [~] Player idle/glide frame (wings level) — **SOURCE**: `INSPO/matrixcloud/`

### Pipes / Obstacles
- [x] Pipe sprites — 5 styles available — **SOURCE**: `INSPO/matrixcloud/`
- [ ] Matrix-green recoloured pipe set (if original colours don't fit theme)
- [~] Pipe top cap sprite — **SOURCE**: `INSPO/matrixcloud/`
- [~] Pipe bottom cap sprite — **SOURCE**: `INSPO/matrixcloud/`
- [ ] Gap indicator (subtle glow showing where to fly through)

### Power-ups (floating collectibles)
- [~] Shield icon — 24×24 — **SOURCE**: `DUMP/1. Free Hologram Interface Wenrexa/Icons/`
- [~] Time slow icon — 24×24 — **SOURCE**: `DUMP/1. Free Hologram Interface Wenrexa/Icons/`
- [~] Extra life icon — 24×24 — **SOURCE**: `DUMP/1. Free Hologram Interface Wenrexa/Icons/`
- [~] Double points icon — 24×24 — **SOURCE**: `DUMP/1. Free Hologram Interface Wenrexa/Icons/`

### Bosses
- [ ] Agent Smith boss sprite — 64×64, idle animation (2-3 frames)
- [ ] Sentinel boss sprite — 64×64
- [ ] Architect boss sprite — 64×64
- [ ] Boss projectile: laser beam — 8×32 or tileable
- [~] Boss projectile: matrix rain attack — particle effect — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/`
- [~] Boss projectile: code bomb — 16×16, 4-frame explosion — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/`

### Environment
- [x] 9 backgrounds available — pick Matrix-appropriate ones or recolour — **SOURCE**: `INSPO/matrixcloud/`
- [~] Parallax layer: far clouds (wide, scrolling) — **SOURCE**: `INSPO/matrixcloud/`
- [~] Parallax layer: mid rain (matrix code falling) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/`
- [~] Parallax layer: near particles (foreground depth) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/`
- [~] Ground/floor tile (scrolling, for death reference) — **SOURCE**: `INSPO/matrixcloud/`

### UI
- [ ] Score counter position marker
- [ ] Combo display frame
- [~] Lives indicator (hearts or lives icons) — **SOURCE**: `DUMP/1. Free Hologram Interface Wenrexa/Icons/`
- [ ] Boss health bar frame

### Audio
- [~] Flap sound (short, light) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Pass through gap (satisfying score ding) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Hit pipe (crunch / impact) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Death fall — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Power-up collect — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Boss appear warning siren — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Boss defeated — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Background music (tense, electronic, loopable) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/`
