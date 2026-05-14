# Cloud Jumper — Asset Requirements

## Source Mapping (from TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/)

| Asset Category | Source | Location | Details |
|---|---|---|---|
| Cloud Themes (10) | Cloudy Pack Free | INSPO/cloudjumper/Cloudy-Pack-Free/ | Cherry, Desert, Firey, Frosty, GameBoy, Gloomy, Pale, Pico8, Purpley, Sunny (dithered + smooth variants) |
| Cloud RPG Tilesets | Cloud Tileset | INSPO/cloudjumper/cloud_tileset/ | RPG Maker MV, VX, generic formats |
| Platform Assets | Treasure Hunters | DUMP/Treasure Hunters/ | 1,231 environment/platform assets |
| Obstacle Sprites | Space Runner Assets | DUMP/Space Runner Assets/ | Space runner sprites (CC0) for obstacles |
| Player Character | Matrix Arcade Cyberpunk | DUMP/MatrixArcadeCyberPunkAssets/ | Player character animations |
| Sound Effects + Music | Matrix Arcade Tracks | DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/ | SFX + music tracks |

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/cloudjumper/)

- [x] Time Fantasy Cloud City tileset (bg_bluesky, bg_cloud1/2, cloud_tileset, RPGMaker variants)
- [x] Cloudy Pack Free — 190+ files across 10 themes:
  - Sunny, Cherry, Desert, Firey, Frosty, GameBoy, Gloomy, Pale, Pico8, Purpley
  - Each theme: dithered + smooth variants
  - Includes: character sprites, tiles, backgrounds
- [x] License: personal use (Cloudy Pack), free (Time Fantasy)

## Currently Procedural (in BootScene — 15 textures)

Player (stick figure), 4 cloud types (ellipses), star/gem/coin collectibles, bird/plane obstacles, 3 parallax background layers. All generated with Phaser Graphics API.

## Still Needed

### Player
- [~] Player sprite — Matrix-themed jumper character, 32×32 — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/
- [~] Player jump animation — legs tucked, ascending, 2 frames — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/
- [~] Player fall animation — arms spread, descending, 2 frames — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/
- [~] Player idle / standing on cloud — 1 frame — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/
- [~] Player death — tumbling, 4 frames — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/

### Clouds (platforms)
- [x] Multiple cloud themes available (10 themes × dithered + smooth)
- [~] Matrix-green cloud variant (recoloured from available packs) — SOURCE: INSPO/cloudjumper/Cloudy-Pack-Free/
- [~] Normal cloud — white/green, solid, 120×30 — SOURCE: INSPO/cloudjumper/Cloudy-Pack-Free/ or INSPO/cloudjumper/cloud_tileset/
- [~] Moving cloud — blue/cyan tint, with motion lines, 120×30 — SOURCE: INSPO/cloudjumper/Cloudy-Pack-Free/
- [~] Disappearing cloud — fading/transparent, 120×30 (+ fade animation 3f) — SOURCE: DUMP/Treasure Hunters/
- [~] Storm cloud — dark purple/gray, with lightning crackle, 120×30 — SOURCE: INSPO/cloudjumper/Cloudy-Pack-Free/ (Gloomy theme)

### Collectibles
- [~] Data star — 24×24, yellow/gold, spinning (4 frames) — SOURCE: DUMP/Treasure Hunters/
- [~] Code gem — 24×24, cyan diamond — SOURCE: DUMP/Treasure Hunters/
- [~] Matrix coin — 24×24, green, rotating (4 frames) — SOURCE: DUMP/Treasure Hunters/

### Obstacles
- [~] Bird obstacle — 40×32, flapping (2 frames) — SOURCE: DUMP/Space Runner Assets/
- [~] Drone/plane obstacle — 60×40 — SOURCE: DUMP/Space Runner Assets/
- [~] Falling debris — 16×16 (hazard from above) — SOURCE: DUMP/Treasure Hunters/

### Environment
- [ ] Far background — Matrix dark sky with faint rain columns, 1600×500 tileable
- [ ] Mid background — cloud layer, 1600×300 tileable
- [ ] Near foreground particles — rain/code fragments
- [ ] Background should work with dark Matrix-green theme (0x0a1a0a base)

### UI
- [ ] Score display
- [ ] Distance meter
- [ ] Bounce streak counter

### Audio
- [x] Jump / bounce sound — covered by global SFX kit (sfx_power_surge.mp3) — R78.1
- [x] Land on cloud — covered by global SFX kit (sfx_landing from original kit / sfx_hit_ground) — R78.1
- [~] Cloud break / disappear — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Storm cloud damage — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [x] Collectible pickup (3 variants for star/gem/coin) — covered by global SFX kit (sfx_blip.mp3, sfx_ammo_drop.mp3) — R78.1
- [~] Bird/obstacle warning — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Player death fall — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Background music (airy, floating, electronic, loopable) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/
