# Matrix Frogger — Asset Requirements

## Source Mapping

| Asset Category | Source | Location |
|---|---|---|
| Krita source files & PNG exports | INSPO/matrixfrogger/frogger_visual_assets | 83 sprites: Animals, Cars, Frog, Ground, Icons, Letters, Logs |
| WAV audio files | INSPO/matrixfrogger/froggerWAVFiles | death, pickup, move, score, extra_score, soundtrack |
| Robot enemies (Agent Smith) | DUMP/TopView_Robot_Asset_Pack | Robot sprites with variants |
| Player Neo sprite variants | DUMP/MatrixArcadeCyberPunkAssets | Character animations: walk/run/attack/slide |
| Road & environment tiles | DUMP/32rogues | Road tiles, environment tiles, character sprites |
| Power-up icons | DUMP/1. Free Hologram Interface Wenrexa/Icons | Icon assets |
| Sound Effects kit | DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects | SFX kit |

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/matrixfrogger/)

- [x] Frog player — 2 animation frames + blue variant + 7-frame death animation
- [x] Vehicles — car_1, car_2, car_3, truck, tractor
- [x] Animals — crocodile (2f), snake (3f), turtle (5f), otter (2f)
- [x] Environment — flower grounds, log segments (left/middle/right)
- [x] UI icons — menu, sound on/off, F-R-O-G-G-E-R letter sprites
- [x] Krita source files (.kra) for all above — editable
- [x] WAV audio files (death, pickup, move, score, extra_score, soundtrack)

## Still Needed

### Player Upgrades
- [~] Neo player sprite (Matrix-themed frog/character) — replace generic frog, 64×64, 2+ frames — SOURCE: DUMP/MatrixArcadeCyberPunkAssets
- [~] Kung Fu attack animation — 4-6 frames, 64×64 — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/attack.zip
- [~] NEO mode glow effect (invincibility — multicolour flash overlay) — SOURCE: DUMP/MatrixArcadeIconsBackroundsShaders
- [~] Shield effect sprite (when shielded) — SOURCE: DUMP/MatrixArcadeIconsBackroundsShaders

### Environment
- [~] Safe zone / start line tile — visually distinct pavement, 64×64 tileable — SOURCE: DUMP/32rogues/tiles.png
- [~] Finish line / top pavement — destination area, 64×64 tileable — SOURCE: DUMP/32rogues/tiles.png
- [~] Road markings — lane divider lines, dashed, tileable — SOURCE: DUMP/32rogues/animated-tiles.png
- [~] Road surface tile — dark asphalt, 64×64 tileable — SOURCE: DUMP/32rogues/tiles.png
- [~] Grass/sidewalk tile variants — SOURCE: DUMP/32rogues/tiles.png

### Enemies — Enhancements
- [~] Chasing agent sprite — Agent Smith running, 64×64, 4-frame walk cycle — SOURCE: DUMP/TopView_Robot_Asset_Pack
- [~] Sentinel sprite — flying, 64×64, 2-frame hover — SOURCE: DUMP/TopView_Robot_Asset_Pack
- [~] Speed variants — same sprites work, just config-based speed changes — SOURCE: DUMP/TopView_Robot_Asset_Pack

### Power-ups
- [~] Kung Fu ability icon — 32×32 (HUD indicator, max 3 shown) — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons
- [~] NEO mode pickup — 32×32 (floating collectible) — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons
- [~] Speed boost pickup — 32×32 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons
- [~] Shield pickup — 32×32 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons

### UI
- [ ] Countdown timer display (5, 4, 3, 2, 1, GO!)
- [ ] Kung Fu charges indicator (3 icons in HUD)
- [ ] Lives display
- [ ] Score with multiplier indicator

### Audio
- [x] Core sounds available (death, pickup, move, score, soundtrack WAVs)
- [~] Kung Fu attack sound — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] NEO mode activation — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Countdown beeps (5 beeps + GO) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Chasing agent warning — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
- [~] Level complete fanfare — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects
