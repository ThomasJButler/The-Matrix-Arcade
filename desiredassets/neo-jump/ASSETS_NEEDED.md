# Neo Jump — Asset Requirements

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
- [ ] Player idle — standing on platform, 32×32 or 32×40
- [ ] Player jump — legs tucked, going up, 32×40
- [ ] Player fall — arms/legs spread, falling down, 32×40
- [ ] Player death — tumble animation, 4-6 frames
- [ ] Player jetpack — flames below, ascending, 2-3 frames
- [ ] Player shoot — projectile launch pose, 1-2 frames

### Platforms
- [ ] Normal platform — green, solid, 80×16
- [ ] Moving platform — cyan, arrows/indicators, 80×16
- [ ] Spring platform — yellow, with spring coil, 80×16 (+ spring compress animation 2f)
- [ ] Disappearing platform — gray, cracking/fading, 80×16 (+ break animation 3-4f)
- [ ] Breakable platform — orange, crumbling, 80×16 (+ break animation 4f)

### Enemies
- [ ] Basic enemy — distinct from player, menacing, 32×32, 2-frame idle
- [ ] Flying enemy — winged/hovering, 40×32, 2-frame flap
- [ ] Shooting enemy — armed, fires downward, 32×32

### Collectibles
- [ ] Jetpack pickup — 24×24, glowing
- [ ] Score bonus — 16×16
- [ ] Shield pickup — 24×24

### Environment
- [ ] Background — deep Matrix green void, parallax layers, 400×600 tileable vertically
- [ ] Parallax rain layer (matrix code columns)
- [ ] Altitude marker / milestone indicator

### UI
- [ ] Altitude meter / progress bar
- [ ] Jetpack fuel bar (fill + frame)
- [ ] Score display
- [ ] Lives/health indicator

### Audio
- [ ] Jump sound (boing / spring)
- [ ] Land on platform
- [ ] Platform break / crumble
- [ ] Jetpack ignite + thrust loop
- [ ] Enemy killed
- [ ] Player death (dramatic fall)
- [ ] Collectible pickup
- [ ] New altitude milestone
- [ ] Background music (airy, ascending feel, electronic, loopable)
