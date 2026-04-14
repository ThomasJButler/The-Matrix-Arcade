# Matrix Invaders — Asset Requirements

## Source Mapping

| Asset Category | Source |
|---|---|
| Space Invaders core sprites | `INSPO/matrixinvaders/` (16 assets) |
| Robot enemy sprites (18+ variants with death animations) | `DUMP/TopView_Robot_Asset_Pack/` |
| Sci-fi themed pixel art | `DUMP/PixelWhale_SF_Project/` (99 files) |
| Space runner sprites (CC0) | `DUMP/Space Runner Assets/` |
| Laser & bullet sprites | `DUMP/Sprites - Lasers Bullets #1/` |
| Sound effects & music | `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/` |
| Health & boss health bars | `DUMP/1. Free Hologram Interface Wenrexa/Progress Bar/` |

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/matrixinvaders/)

- [x] Player ship sprite (player.png)
- [x] Enemy sprites sheet (enemies.png)
- [x] Player bullet (player bullet.png)
- [x] Enemy bullet (enemy bullet.png)
- [x] Backdrop background (backdrop.png)
- [x] Score bar UI (ScoreBar.png)
- [x] UI buttons (play, quit)
- [x] Screen overlays (title, dead, win)
- [x] 4 reference/inspiration images

## Still Needed

### Player
- [x] Player ship — available — **SOURCE**: `INSPO/matrixinvaders/`
- [~] Player ship thrust animation — 2-3 frames, 32×32 — **SOURCE**: `DUMP/TopView_Robot_Asset_Pack/`
- [~] Player ship hit/damage flash — 1-2 frames — **SOURCE**: `DUMP/PixelWhale_SF_Project/`
- [ ] Player ship death explosion — 6-8 frames, 64×64
- [~] Player shield visual (when power-up active) — **SOURCE**: `DUMP/1. Free Hologram Interface Wenrexa/Progress Bar/`

### Enemies (5 types)
- [x] Basic enemy sheet — available (may need splitting into individual types) — **SOURCE**: `INSPO/matrixinvaders/`
- [~] Code enemy (1HP, green) — 2-frame idle animation, 32×32 — **SOURCE**: `DUMP/PixelWhale_SF_Project/`
- [~] Agent enemy (2HP, red) — 2-frame idle animation, 32×32 — **SOURCE**: `DUMP/TopView_Robot_Asset_Pack/`
- [~] Sentinel enemy (3HP, cyan) — 2-frame idle animation, 32×32 — **SOURCE**: `DUMP/PixelWhale_SF_Project/`
- [~] Virus enemy (1HP, splits) — 2-frame idle + split animation, 32×32 — **SOURCE**: `DUMP/Space Runner Assets/`
- [ ] Boss enemy (50HP) — 64×64 or 96×96, idle animation + attack frames
- [~] Enemy death explosion — 4-6 frames, 32×32 — **SOURCE**: `DUMP/TopView_Robot_Asset_Pack/`

### Projectiles
- [x] Player bullet — available — **SOURCE**: `INSPO/matrixinvaders/`
- [x] Enemy bullet — available — **SOURCE**: `INSPO/matrixinvaders/`
- [x] Player bullet glow sprite — green teardrop glow, display 8×20 — **SOURCE**: `DUMP/Sprites - Lasers Bullets #1/` (sprite 10)
- [x] Enemy bullet glow sprite — magenta teardrop glow, display 6×14 (boss 8×18) — **SOURCE**: `DUMP/Sprites - Lasers Bullets #1/` (sprite 03)
- [~] Boss special projectile — 16×16 — **SOURCE**: `DUMP/Sprites - Lasers Bullets #1/`

### Power-ups (currently scaffolded but not implemented)
- [ ] Rapid fire icon — 24×24
- [~] Shield icon — 24×24 — **SOURCE**: `DUMP/1. Free Hologram Interface Wenrexa/Progress Bar/`
- [ ] Bomb (screen clear) icon — 24×24
- [ ] Bullet time icon — 24×24
- [ ] Extra life icon — 24×24
- [ ] Score multiplier icon — 24×24

### Environment
- [x] Backdrop — available — **SOURCE**: `INSPO/matrixinvaders/`
- [~] Matrix-themed backdrop alternative (code rain, dark cityscape) — **SOURCE**: `DUMP/PixelWhale_SF_Project/`
- [~] Star field / parallax particles (subtle, behind enemies) — **SOURCE**: `DUMP/Space Runner Assets/`

### UI
- [x] Score bar — available — **SOURCE**: `INSPO/matrixinvaders/`
- [x] Screen overlays — available — **SOURCE**: `INSPO/matrixinvaders/`
- [ ] Wave counter display
- [ ] Bullet time meter/bar
- [~] Boss health bar — **SOURCE**: `DUMP/1. Free Hologram Interface Wenrexa/Progress Bar/`
- [ ] Combo counter popup

### Audio
- [x] Player shoot — covered by global SFX kit (sfx_laser_gun_*.mp3 from original kit) — R78.1
- [x] Enemy shoot — covered by global SFX kit (sfx_laser_gun_*.mp3 from original kit) — R78.1
- [x] Enemy destroyed — covered by global SFX kit (sfx_explosion_large.mp3 / sfx_glass_break.mp3) — R78.1
- [~] Boss destroyed (bigger explosion) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [x] Power-up collect — covered by global SFX kit (sfx_ammo_drop.mp3) — R78.1
- [~] Bullet time activate (slow-mo whoosh) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Bullet time deactivate — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Wave complete fanfare — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Background music (intense, electronic, increases with wave number) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/`
