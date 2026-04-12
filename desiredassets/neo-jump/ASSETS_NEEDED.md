# Neo Jump — Asset Requirements

## Source Mapping

| Asset Category | Source | Location |
|---|---|---|
| Complete sprite pack (406 files) | INSPO/doodlejump/Doodle RPG | Knight sprites, Particles, Pickups, Tiles, UI, HUD, Transitions, Debris, Fonts |
| Environment & platform assets (1,231 files) | DUMP/Treasure Hunters | Pirate-themed environments (can be re-themed to Matrix) |
| Character/enemy/item sprites (462 files) | DUMP/Tiny Swords (Free Pack) | Character variants, enemy sprites, collectibles |
| Platform tilesets | DUMP/Legacy-Fantasy - High Forest 2.3 | Platform and tileset assets (can be re-colored to Matrix green) |
| Neo character animations | DUMP/MatrixArcadeCyberPunkAssets | walk.zip, run.zip, attack.zip, slide.zip, idle.zip |
| Sound Effects & Music | DUMP/MatrixArcadeTracksSoundEffectsVisualEffects | SoundEffects/ and LongTracks/ directories |
| Doodle Jump reference images | INSPO/doodlejump | 4 reference images showing original game look |

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/doodlejump/)

- [x] Full Doodle RPG sprite pack — 406 files:
  - Knight character: 220+ frames (8-directional walk, sword swing, rolling, pushing, climbing, hurt, shield)
  - Environment: bushes, rocks, crates, push blocks, signs
  - UI: 23 transition frames, HUD elements (hearts, buttons, bars)
  - Particles, tiles, debris, pickups/items, fonts
- [x] 4 Doodle Jump reference images (original game look)

## Decision Needed: Sprite Style

**Option A**: Use the Doodle RPG knight pack (fantasy medieval → rethemed Matrix green)
**Option B**: Create custom Neo character sprites (Matrix coat, sunglasses, martial arts)
**Option C**: Procedural sprites with higher fidelity than current placeholder

Place chosen sprites in this folder.

## Still Needed

### Player (whichever style chosen)
- [~] Player idle — standing on platform, 32×32 or 32×40 — SOURCE: INSPO/doodlejump/Doodle RPG or DUMP/MatrixArcadeCyberPunkAssets/idle.zip
- [~] Player jump — legs tucked, going up, 32×40 — SOURCE: INSPO/doodlejump/Doodle RPG or DUMP/MatrixArcadeCyberPunkAssets
- [~] Player fall — arms/legs spread, falling down, 32×40 — SOURCE: INSPO/doodlejump/Doodle RPG or DUMP/MatrixArcadeCyberPunkAssets
- [~] Player death — tumble animation, 4-6 frames — SOURCE: INSPO/doodlejump/Doodle RPG
- [~] Player jetpack — flames below, ascending, 2-3 frames — SOURCE: INSPO/doodlejump/Doodle RPG/Particles
- [~] Player shoot — projectile launch pose, 1-2 frames — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/shoot.zip

### Platforms
- [~] Normal platform — green, solid, 80×16 — SOURCE: DUMP/Legacy-Fantasy - High Forest 2.3 or DUMP/Treasure Hunters
- [~] Moving platform — cyan, arrows/indicators, 80×16 — SOURCE: DUMP/Legacy-Fantasy - High Forest 2.3 or DUMP/Treasure Hunters
- [~] Spring platform — yellow, with spring coil, 80×16 (+ spring compress animation 2f) — SOURCE: DUMP/Treasure Hunters or INSPO/doodlejump/Doodle RPG
- [~] Disappearing platform — gray, cracking/fading, 80×16 (+ break animation 3-4f) — SOURCE: DUMP/Treasure Hunters or DUMP/Legacy-Fantasy - High Forest 2.3
- [~] Breakable platform — orange, crumbling, 80×16 (+ break animation 4f) — SOURCE: DUMP/Treasure Hunters

### Enemies
- [~] Basic enemy — distinct from player, menacing, 32×32, 2-frame idle — SOURCE: DUMP/Tiny Swords (Free Pack)/Units or INSPO/doodlejump/Doodle RPG
- [~] Flying enemy — winged/hovering, 40×32, 2-frame flap — SOURCE: DUMP/Tiny Swords (Free Pack)/Units or INSPO/doodlejump/Doodle RPG/Particles
- [~] Shooting enemy — armed, fires downward, 32×32 — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/shoot.zip

### Collectibles
- [~] Jetpack pickup — 24×24, glowing — SOURCE: INSPO/doodlejump/Doodle RPG/Pickups
- [~] Score bonus — 16×16 — SOURCE: INSPO/doodlejump/Doodle RPG/Pickups
- [~] Shield pickup — 24×24 — SOURCE: INSPO/doodlejump/Doodle RPG/Pickups

### Environment
- [~] Background — deep Matrix green void, parallax layers, 400×600 tileable vertically — SOURCE: DUMP/MatrixArcadeIconsBackroundsShaders
- [~] Parallax rain layer (matrix code columns) — SOURCE: DUMP/MatrixArcadeIconsBackroundsShaders
- [~] Altitude marker / milestone indicator — SOURCE: INSPO/doodlejump/Doodle RPG/UI

### UI
- [~] Altitude meter / progress bar — SOURCE: INSPO/doodlejump/Doodle RPG/HUD
- [~] Jetpack fuel bar (fill + frame) — SOURCE: INSPO/doodlejump/Doodle RPG/HUD
- [~] Score display — SOURCE: INSPO/doodlejump/Doodle RPG/Fonts
- [~] Lives/health indicator — SOURCE: INSPO/doodlejump/Doodle RPG/HUD

### Audio
- [~] Jump sound (boing / spring) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Land on platform — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Platform break / crumble — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Jetpack ignite + thrust loop — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Enemy killed — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Player death (dramatic fall) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Collectible pickup — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] New altitude milestone — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Background music (airy, ascending feel, electronic, loopable) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks
