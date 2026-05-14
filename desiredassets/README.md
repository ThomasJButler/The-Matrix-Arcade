# Desired Assets — The Matrix Arcade v2.0

This folder documents every asset needed for the Phaser rebuild. Drop files into the relevant game folder and they'll be integrated during the build phase.

## How This Works

1. Each game folder has an `ASSETS_NEEDED.md` listing exactly what's required
2. Assets marked `[x]` are already available (in inspiration folders or procedurally generated)
3. Assets marked `[~]` have a **source candidate** in the unsorted dump — needs extracting/recolouring
4. Assets marked `[ ]` still need sourcing or creating from scratch
5. During the build phase, assets will be copied to `public/assets/[game]/` and loaded by BootScene

## Unsorted Asset Dump

`TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/` contains ~4,900 files (~750MB) of raw assets. Each game's `ASSETS_NEEDED.md` now includes a **Source Mapping** section that maps dump contents to that game's needs. The dump is organised as:

| Dump Folder | Contents | Maps To |
|-------------|----------|---------|
| `MatrixArcadeTracksSoundEffectsVisualEffects/` | 10 music tracks (WAV/MP3), Matrix SFX kit (ZIP), firework particles | Global audio, Rhythm Hacker music, all game SFX |
| `MatrixArcadeFontAssets/` | MatrixType, AlphaProta, PixelFont (3 ZIPs) | Global fonts |
| `MatrixArcadeCyberPunkAssets/` | Character animations (idle/walk/run/attack/shoot/slide), menu BG | Snake, Frogger, Code Breaker player sprites |
| `MatrixArcadeIconsBackroundsShaders/` | Matrix-Icons (85MB), scifi backgrounds, dot matrix shader | Global UI, all game backgrounds |
| `1. Free Hologram Interface Wenrexa/` | Buttons, cards, icons, progress bars, switches, windows | Global UI chrome, all game HUD panels |
| `NotJamFontPack/` | 130 bitmap font files (13 families, multiple sizes) | Global fonts, game title text |
| `NotJamChunkySans6/` | Chunky pixel font (TTF + JSON) | Game titles, score displays |
| `inspirationimagesandsprites/` | Game-specific reference art for all 12 games | Per-game — see individual ASSETS_NEEDED.md |
| `TopView_Robot_Asset_Pack/` | Robot enemies, player sprites, weapons, death animations | Matrix Frogger, Matrix Invaders, Code Breaker |
| `Kings and Pigs/` | Character sprites (King, Pig) with full action sets | Agent Chase, Snake (boss sprites) |
| `Tiny Swords (Free Pack)/` | 462 pixel art game assets (characters, enemies, UI) | Neo Jump, Code Breaker, general sprites |
| `Tiny Swords (Update 010)/` | 288 updated sprites | Same as above |
| `Treasure Hunters/` | 1,231 files — complete game asset library | Cloud Jumper, Neo Jump environments |
| `FREE Mana Seed Character Base Demo 2/` | Character customisation sprites | CTRL-S character portraits base |
| `PixelWhale_SF_Project/` | 99 sci-fi pixel art files | Matrix Invaders, global backgrounds |
| `Space Runner Assets/` | Space runner sprites (CC0 public domain) | Matrix Invaders, Cloud Jumper |
| `32rogues/` + `32rogues-2/` | Roguelike tilesets (tiles, monsters, items) | Agent Chase maze tiles |
| `Sprites - Lasers Bullets #1/` | Laser and bullet sprites | Matrix Invaders, Code Breaker |
| `Legacy-Fantasy - High Forest 2.3/` | RPG forest tilesets | Neo Jump platforms |

## Folder Structure

```
desiredassets/
├── README.md                           # This file
├── TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/  # UNSORTED DUMP (~750MB)
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

## Asset Pipeline (for Ralph loop)

1. **Extract**: Unzip relevant ZIPs from the dump into game folders
2. **Audit**: Measure sprite dimensions, check colour palettes, verify frame counts
3. **Recolour**: Apply Matrix green/black/cyan palette to non-Matrix assets
4. **Rename**: Follow naming convention below
5. **Atlas**: Pack related sprites into texture atlases with JSON metadata
6. **Convert**: WAV → OGG for web, resize oversized sprites to target dimensions
7. **Integrate**: Copy final assets to `public/assets/[game]/`, update BootScene loaders

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
