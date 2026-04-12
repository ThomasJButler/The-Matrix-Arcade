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

## Decision: Sprite Style ✅ RESOLVED (R29)

**Chosen**: CyberPunk character sprites (24×24 pixel art, same pack as Cloud Jumper) for player. Doodle RPG tiles for platforms. Doodle RPG Bomba for enemy. All scaled via `setDisplaySize()` with Matrix-palette tinting.

## Still Needed

### Player (CyberPunk 24×24 pixel art — same pack as Cloud Jumper)
- [x] Player idle — `public/assets/neo-jump/player-idle.png` (24×24, scaled to 32×40 via setDisplaySize)
- [x] Player jump — `public/assets/neo-jump/player-jump.png` (24×24, run frame2 = ascending pose)
- [x] Player fall — `public/assets/neo-jump/player-fall.png` (24×24, slide frame3 = falling pose)
- [x] Player death — `public/assets/neo-jump/player-death.png` (24×24, attack frame5)
- [x] Player jetpack flame — `public/assets/neo-jump/jetpack-flame.png` (Particle1_0, 50×53, Doodle RPG, tinted orange, flicker effect)
- [x] Player shoot — `public/assets/neo-jump/player-shoot.png` (24×24, shoot frame4)

### Platforms (Doodle RPG tiles, scaled to 80×16 via setDisplaySize with per-type tinting)
- [x] Normal platform — `public/assets/neo-jump/platform-normal.png` (Log1_0, 200×100, tinted green)
- [x] Moving platform — `public/assets/neo-jump/platform-moving.png` (PushBlock1, 100×100, tinted cyan)
- [x] Spring platform — `public/assets/neo-jump/platform-spring.png` (Pedestal_0, 100×100, tinted yellow)
- [x] Disappearing platform — `public/assets/neo-jump/platform-disappearing.png` (Barrel_0, 100×100, tinted grey)
- [x] Breakable platform — `public/assets/neo-jump/platform-breakable.png` (Crate, 100×100, tinted orange)

### Enemies
- [x] Basic enemy — `public/assets/neo-jump/enemy.png` (Bomba, 71×79, scaled to 40×40 via setDisplaySize, tinted red)
- [~] Flying enemy — winged/hovering, 40×32, 2-frame flap — SOURCE: DUMP/Tiny Swords (Free Pack)/Units or INSPO/doodlejump/Doodle RPG/Particles
- [~] Shooting enemy — armed, fires downward, 32×32 — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/shoot.zip

### Collectibles
- [x] Jetpack fuel pickup — `public/assets/neo-jump/collectible-fuel.png` (Loot_0, 49×50, Doodle RPG, scaled to 24×24 via setDisplaySize)
- [x] Score bonus pickup — `public/assets/neo-jump/collectible-score.png` (Loot_1, 49×50, Doodle RPG, scaled to 24×24 via setDisplaySize)
- [x] Shield pickup — `public/assets/neo-jump/collectible-shield.png` (Heart, 49×50, Doodle RPG, scaled to 24×24 via setDisplaySize)

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
