# Cloud Jumper — Asset Requirements

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
- [ ] Player sprite — Matrix-themed jumper character, 32×32
- [ ] Player jump animation — legs tucked, ascending, 2 frames
- [ ] Player fall animation — arms spread, descending, 2 frames
- [ ] Player idle / standing on cloud — 1 frame
- [ ] Player death — tumbling, 4 frames

### Clouds (platforms)
- [x] Multiple cloud themes available (10 themes × dithered + smooth)
- [ ] Matrix-green cloud variant (recoloured from available packs)
- [ ] Normal cloud — white/green, solid, 120×30
- [ ] Moving cloud — blue/cyan tint, with motion lines, 120×30
- [ ] Disappearing cloud — fading/transparent, 120×30 (+ fade animation 3f)
- [ ] Storm cloud — dark purple/gray, with lightning crackle, 120×30

### Collectibles
- [ ] Data star — 24×24, yellow/gold, spinning (4 frames)
- [ ] Code gem — 24×24, cyan diamond
- [ ] Matrix coin — 24×24, green, rotating (4 frames)

### Obstacles
- [ ] Bird obstacle — 40×32, flapping (2 frames)
- [ ] Drone/plane obstacle — 60×40
- [ ] Falling debris — 16×16 (hazard from above)

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
- [ ] Jump / bounce sound
- [ ] Land on cloud
- [ ] Cloud break / disappear
- [ ] Storm cloud damage
- [ ] Collectible pickup (3 variants for star/gem/coin)
- [ ] Bird/obstacle warning
- [ ] Player death fall
- [ ] Background music (airy, floating, electronic, loopable)
