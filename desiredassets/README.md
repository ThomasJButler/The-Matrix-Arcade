# Desired Assets — The Matrix Arcade v2.0

This folder documents every asset needed for the Phaser rebuild. Drop files into the relevant game folder and they'll be integrated during the build phase.

## How This Works

1. Each game folder has an `ASSETS_NEEDED.md` listing exactly what's required
2. Assets already available in `rebuildingoldgames/inspirationimagesandsprites/` are marked with a checkmark
3. Assets still needed are marked with empty checkboxes — source these and drop them in
4. During the build phase, assets will be copied to `public/assets/[game]/` and loaded by BootScene

## Folder Structure

```
desiredassets/
├── global/              # Shared across all games (fonts, UI, rain textures)
├── snake/               # Snake Classic rebuild
├── vortex-pong/         # Vortex Pong rebuild
├── matrix-cloud/        # Matrix Cloud rebuild (Flappy Bird)
├── matrix-invaders/     # Matrix Invaders rebuild
├── metris/              # Metris rebuild (Tetris)
├── ctrl-s-world/        # CTRL-S The World rebuild (Citizen Sleeper)
├── matrix-frogger/      # Matrix Frogger fixes (already Phaser)
├── neo-jump/            # Neo Jump fixes (already Phaser)
├── agent-chase/         # Agent Chase fixes (already Phaser)
├── rhythm-hacker/       # Rhythm Hacker fixes (already Phaser)
├── cloud-jumper/        # Cloud Jumper fixes (already Phaser)
└── code-breaker/        # Code Breaker new game
```

## Asset Naming Convention

- Sprites: `[object]_[state].png` (e.g. `player_idle.png`, `enemy_walk_01.png`)
- Spritesheets: `[object]_[action]_sheet.png` with accompanying `[object]_[action].json` atlas
- Backgrounds: `bg_[layer]_[name].png` (e.g. `bg_far_cityscape.png`)
- Audio SFX: `sfx_[action].wav` or `.ogg` (e.g. `sfx_jump.wav`, `sfx_explosion.ogg`)
- Music: `music_[name].ogg` (e.g. `music_gameplay.ogg`, `music_boss.ogg`)
- Fonts: `font_[name].ttf` or `.woff2`
- UI: `ui_[element].png` (e.g. `ui_button_play.png`, `ui_panel_score.png`)

## Size Guidelines

- Sprite frames: 16×16, 32×32, or 64×64 px (power of 2 preferred)
- Backgrounds: 800×600 or tileable
- UI panels: 9-slice compatible where possible
- All art: pixel art style, Matrix green/black/cyan palette preferred
