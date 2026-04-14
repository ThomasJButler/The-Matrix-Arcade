# Snake Classic — Asset Requirements

## Source Mapping

| Asset Category | Source |
|---|---|
| Snake sprites & body parts | `INSPO/snake/snakesprites/png/` |
| Player character animations (idle/walk/run/attack) | `DUMP/MatrixArcadeCyberPunkAssets/` |
| Boss enemy sprites | `DUMP/Kings and Pigs/` |
| Sound effects & audio | `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/` |
| Background music | `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/` |
| Items, obstacles, wall tiles | `DUMP/32rogues/` |

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/snake/)

- [x] Snake head sprites — green_head, yellow_head (multiple sizes: default, 32px, 64px)
- [x] Snake body sprites — green_blob, yellow_blob (multiple sizes)
- [x] Snake eyes — green_eyes, yellow_eyes
- [x] Food — apple_red, apple_green, apple_alt (3 sizes each)
- [x] Special food — oliebol, easter_egg (3 sizes each)
- [x] Obstacles — bomb sprites (default, 32px, 64px)
- [x] Wall tiles — wall_block variants 0-6 (32px and 64px)

## Still Needed

### Player (Matrix-themed snake)
- [~] Snake head — 4 directions (up/down/left/right), Matrix-green glow, 32×32 — **SOURCE**: `INSPO/snake/snakesprites/png/`
- [~] Snake body straight — horizontal + vertical, 32×32 — **SOURCE**: `INSPO/snake/snakesprites/png/`
- [~] Snake body corner — 4 rotations, 32×32 — **SOURCE**: `INSPO/snake/snakesprites/png/`
- [~] Snake tail — 4 directions, 32×32 — **SOURCE**: `INSPO/snake/snakesprites/png/`
- [ ] Snake head powered-up variant (bullet time glow)
- [ ] Snake ghost mode variant (translucent)

### Food & Collectibles
- [~] Standard data fragment (green, pulsing) — 16×16 or 32×32 — **SOURCE**: `DUMP/32rogues/`
- [ ] Power-up: speed boost (yellow icon) — 32×32
- [ ] Power-up: score multiplier (cyan icon) — 32×32
- [ ] Power-up: shield (blue icon) — 32×32
- [ ] Power-up: ghost mode (magenta icon) — 32×32
- [ ] Power-up: bullet time (gold icon) — for Matrix Mode — 32×32
- [ ] Sequence digits 0 and 1 (for Hacker Mode) — 16×16

### Enemies (Matrix Mode)
- [~] Agent Smith sprite — walking, 32×32, 4 directional frames — **SOURCE**: `DUMP/MatrixArcadeCyberPunkAssets/`
- [~] Firewall obstacle — tileable, 32×32 — **SOURCE**: `DUMP/32rogues/`
- [~] Firewall animated (on/off cycle) — 32×32, 4 frames — **SOURCE**: `DUMP/32rogues/`

### Bosses
- [~] Boss sprite (every 5 levels) — 64×64 or 96×96 — **SOURCE**: `DUMP/Kings and Pigs/`
- [ ] Boss attack projectile — 16×16
- [ ] Boss defeated explosion — 64×64, 6-8 frames

### Environment
- [~] Grid background tile — subtle, dark, 32×32 tileable — **SOURCE**: `DUMP/32rogues/`
- [~] Grid border/wall — 32×32, matches theme — **SOURCE**: `DUMP/32rogues/`
- [ ] Matrix rain overlay (thin, subtle, for background)
- [ ] Mini-map frame (for levels 6+) — 128×128 or scalable

### UI
- [ ] Score display panel
- [ ] Combo counter popup
- [ ] Level indicator
- [ ] Mode selector icons (Classic / Matrix / Hacker)

### Audio
- [x] Eat food blip — covered by global SFX kit (sfx_blip.mp3) — R78.1
- [x] Power-up collect — covered by global SFX kit (sfx_ammo_drop.mp3 / sfx_spoon_bend.mp3) — R78.1
- [x] Death sound — covered by global SFX kit (sfx_power_down.mp3 / sfx_unplug.mp3) — R78.1
- [~] Boss appear warning — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Boss defeated fanfare — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Level complete chime — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Background music track (loopable, 8-bit / synth feel) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/`
