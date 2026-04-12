# Global Assets — Shared Across All Games

## Source Mapping (from unsorted dump)

| Dump Source | Usable For | Action Needed |
|-------------|-----------|---------------|
| `MatrixArcadeFontAssets/MatrixType_FontFamily_0_6.zip` | Matrix rain font, game titles | Unzip, extract TTF/WOFF2 |
| `MatrixArcadeFontAssets/AlphaProta_Font_2_00.zip` | ASCII art display font | Unzip, extract TTF |
| `MatrixArcadeFontAssets/PixelFont.zip` | Pixel score/UI font | Unzip, extract TTF |
| `NotJamFontPack/` (130 files, 13 families) | Bitmap fonts for HUD, titles, scores | Pick best 3-4 families, copy TTF + JSON |
| `NotJamChunkySans6/` | Chunky font for game titles | Copy TTF + JSON metadata |
| `1. Free Hologram Interface Wenrexa/` | Buttons, cards, progress bars, windows | Copy PNGs, apply green tint |
| `MatrixArcadeIconsBackroundsShaders/Matrix-Icons.zip` | UI icons (85MB — pick selectively) | Unzip, cherry-pick relevant icons |
| `MatrixArcadeIconsBackroundsShaders/background_set.zip` | Tileable backgrounds | Unzip, recolour to Matrix palette |
| `MatrixArcadeIconsBackroundsShaders/scifi-strategy-art-assets.zip` | Sci-fi UI panels | Unzip, extract panel sprites |
| `MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/chromed out (menu).mp3` | Menu ambient track | Convert to OGG, loop-trim |
| `MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip` | ALL global SFX (menu blips, whooshes, stings) | Unzip, catalogue, rename to convention |
| `MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/cruise control (game start).wav` | Game start whoosh / fanfare | Trim to 3-5s jingle, convert to OGG |
| `MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/a last embrace (credit roll).wav` | Victory/completion music | Trim intro as jingle, convert to OGG |
| `MatrixArcadeTracksSoundEffectsVisualEffects/firework/` | Particle sprites (pink/purple/yellow) | Recolour to green/cyan, use for explosions/sparkles |

## Fonts

- [x] Press Start 2P (Google Fonts — already loaded via index.html)
- [x] JetBrains Mono (Google Fonts — already loaded via index.html)
- [~] Pixel font for matrix rain characters — **SOURCE**: `MatrixArcadeFontAssets/MatrixType_FontFamily_0_6.zip` (extract, generate glyph atlas)
- [~] Additional pixel display font for ASCII art game titles — **SOURCE**: `MatrixArcadeFontAssets/AlphaProta_Font_2_00.zip` + `NotJamFontPack/` (multiple options)

## Three.js Matrix Rain

- [~] Glyph texture atlas (2048×2048) — **ACTION**: Generate from MatrixType font using canvas rendering at build time
- [~] Alternative: individual glyph PNGs at 16×16 — **ACTION**: Render from MatrixType TTF to PNG sprite sheet

## UI / Chrome

- [~] Game card background texture — **SOURCE**: `MatrixArcadeIconsBackroundsShaders/background_set.zip` (unzip, pick tileable option, recolour)
- [~] Button sprites (Play, Instructions, High Scores, Settings) — **SOURCE**: `1. Free Hologram Interface Wenrexa/Button 1/` (Normal/Hover/Active/Disable states ready, needs green tint)
- [~] Panel nine-slice for modals — **SOURCE**: `1. Free Hologram Interface Wenrexa/Window/` (window frame components, apply green border)
- [~] Achievement unlock toast sprite — **SOURCE**: `1. Free Hologram Interface Wenrexa/Card X1/` (card layouts, recolour)
- [~] Loading spinner / progress bar sprites — **SOURCE**: `1. Free Hologram Interface Wenrexa/Progress Bar/` (health/progress bar ready)
- [~] ASCII art font atlas for game titles — **SOURCE**: `NotJamFontPack/` (Bore Blasters or Not Jam Atomic families suit arcade titles)

## Audio — Global SFX Library

- [~] Menu navigate blip — **SOURCE**: `WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip` (unzip, find UI sounds)
- [~] Menu select / confirm — **SOURCE**: same SFX kit
- [~] Menu back / cancel — **SOURCE**: same SFX kit
- [~] Achievement unlock fanfare — **SOURCE**: same SFX kit or trim from `cruise control (game start).wav`
- [~] Game start whoosh — **SOURCE**: `LongTracks/cruise control (game start).wav` (trim first 3-5s)
- [~] Pause on / pause off — **SOURCE**: same SFX kit
- [~] High score celebration — **SOURCE**: trim from `a last embrace (credit roll).wav`

## Audio — Music

- [~] Arcade menu ambient track — **SOURCE**: `SoundEffects/chromed out (menu).mp3` (2.0MB, already labelled "menu"!)
- [~] Victory/completion jingle — **SOURCE**: trim intro of `a last embrace (credit roll).wav` to 3-5s
- [~] Game over sting — **SOURCE**: `WeirdoOnTheBus SFX kit` or synthesise from existing dramatic cues

## Shared Game Sprites

- [~] Matrix rain column particles — **ACTION**: Generate procedurally from MatrixType font glyphs, or use `firework/` particles recoloured green
- [~] Generic explosion sprite sheet — **SOURCE**: `firework/` folders (pink/purple/yellow × 7 frames each), recolour to green/cyan
- [~] Generic power-up glow effect — **SOURCE**: `firework/` particle frames, recolour and loop
- [ ] Screen flash / screen shake overlay — **ACTION**: Generate procedurally (simple white/green alpha overlay)
- [~] Star / sparkle particle — **SOURCE**: `firework/` smallest frame, crop to 8×8 or 16×16
