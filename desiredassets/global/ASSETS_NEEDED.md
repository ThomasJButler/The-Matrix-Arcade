# Global Assets — Shared Across All Games

## Source Mapping (from unsorted dump)

| Dump Source | Usable For | Action Needed |
|-------------|-----------|---------------|
| `MatrixArcadeFontAssets/MatrixType_FontFamily_0_6.zip` | Matrix rain font, game titles | ✅ Extracted to `public/assets/fonts/` |
| `MatrixArcadeFontAssets/AlphaProta_Font_2_00.zip` | ASCII art display font | ✅ Extracted to `public/assets/fonts/` |
| `MatrixArcadeFontAssets/PixelFont.zip` | Pixel score/UI font | Bitmap PNGs only, no TTF — skipped |
| `NotJamFontPack/` (130 files, 13 families) | Bitmap fonts for HUD, titles, scores | ✅ Best 4 families copied to `public/assets/fonts/` |
| `NotJamChunkySans6/` | Chunky font for game titles | ✅ Copied to `public/assets/fonts/` |
| `1. Free Hologram Interface Wenrexa/` | Buttons, cards, progress bars, windows | ✅ Buttons + cards + 15 icons extracted to `public/assets/ui/` |
| `MatrixArcadeIconsBackroundsShaders/Matrix-Icons.zip` | UI icons (85MB — pick selectively) | Unzip, cherry-pick relevant icons |
| `MatrixArcadeIconsBackroundsShaders/background_set.zip` | Tileable backgrounds | Unzip, recolour to Matrix palette |
| `MatrixArcadeIconsBackroundsShaders/scifi-strategy-art-assets.zip` | Sci-fi UI panels | Unzip, extract panel sprites |
| `MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/chromed out (menu).mp3` | Menu ambient track | ✅ Copied to `public/assets/audio/music/menu-theme.mp3` |
| `MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip` | ALL global SFX (menu blips, whooshes, stings) | ✅ 34 game-relevant SFX extracted to `public/assets/audio/sfx/` (20 original + 14 new from R78.1) |
| `MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/cruise control (game start).wav` | Game start whoosh / fanfare | Needs ffmpeg to convert WAV→OGG/MP3 |
| `MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/a last embrace (credit roll).wav` | Victory/completion music | Needs ffmpeg to convert WAV→OGG/MP3 |
| `MatrixArcadeTracksSoundEffectsVisualEffects/firework/` | Particle sprites (pink/purple/yellow) | ✅ All 21 frames copied to `public/assets/shared/particles/` |
| `Matrix-Icons/` (already extracted, not zipped) | Animated Matrix node icons | ✅ Green + purple sets copied to `public/assets/ui/icons/` |

## Fonts

- [x] Press Start 2P (Google Fonts — already loaded via index.html)
- [x] JetBrains Mono (Google Fonts — already loaded via index.html)
- [x] MatrixType Regular + Bold + Display (WOFF2 + TTF) — `public/assets/fonts/MatrixType*.woff2`
- [x] AlphaProta Regular + Italic (WOFF2 + TTF) — `public/assets/fonts/AlphaProta*.woff2`
- [x] NotJam Sci Mono 10/13 — `public/assets/fonts/NotJamSciMono*.ttf`
- [x] NotJam Mono Clean 8 — `public/assets/fonts/NotJamMonoClean8.ttf`
- [x] NotJam UI 12 — `public/assets/fonts/NotJamUI12.ttf`
- [x] NotJam Pixel 5 — `public/assets/fonts/NotJamPixel5.ttf`
- [x] NotJam Chunky Sans 6 — `public/assets/fonts/NotJamChunkySans6.ttf`

## Three.js Matrix Rain

- [~] Glyph texture atlas (2048×2048) — **ACTION**: Generate from MatrixType font using canvas rendering at build time
- [~] Alternative: individual glyph PNGs at 16×16 — **ACTION**: Render from MatrixType TTF to PNG sprite sheet

## UI / Chrome

- [x] Button sprites (Play, Instructions, High Scores, Settings) — `public/assets/ui/buttons/hologram-button-*.png`
- [x] Card panels — `public/assets/ui/cards/hologram-card-*.png` + `hologram-panel-*.png`
- [x] Hologram icons (15 selected) — `public/assets/ui/icons/hologram-icon-*.png`
- [x] Matrix node icons (green + purple, animated) — `public/assets/ui/icons/matrix-node-*.png`
- [~] Game card background texture — **SOURCE**: `MatrixArcadeIconsBackroundsShaders/background_set.zip` (unzip, pick tileable option, recolour)
- [~] Panel nine-slice for modals — **SOURCE**: `1. Free Hologram Interface Wenrexa/Window/` (window frame components, apply green border)
- [~] Achievement unlock toast sprite — could use `hologram-card-x1.png` as base
- [~] Loading spinner / progress bar sprites — **SOURCE**: `1. Free Hologram Interface Wenrexa/Progress Bar/`
- [~] ASCII art font atlas for game titles — **SOURCE**: `NotJamFontPack/` (Bore Blasters or Not Jam Atomic families suit arcade titles)

## Audio — Global SFX Library

- [x] Button click — `public/assets/audio/sfx/sfx_button_click.mp3` (deployed + active in useSoundSystem)
- [x] Beeps — `public/assets/audio/sfx/sfx_beeps.mp3` (deployed + active in useSoundSystem)
- [x] Light flicker — `public/assets/audio/sfx/sfx_light_flicker.mp3` (deployed + active in useSoundSystem)
- [x] Blown fuse — `public/assets/audio/sfx/sfx_blown_fuse.mp3` (deployed + active in useSoundSystem)
- [x] Matrix code 1 & 2 — `public/assets/audio/sfx/sfx_matrix_code_*.mp3` (deployed + active in useSoundSystem)
- [x] Laser gun 1 & 2 — `public/assets/audio/sfx/sfx_laser_gun_*.mp3` (deployed + active in useSoundSystem)
- [x] Agent dies — `public/assets/audio/sfx/sfx_agent_dies.mp3` (deployed + active in useSoundSystem)
- [x] Charge ignitor — `public/assets/audio/sfx/sfx_charge_ignitor.mp3` (deployed + active in useSoundSystem)
- [x] Bullet time — `public/assets/audio/sfx/sfx_bullet_time.mp3` (deployed + active in useSoundSystem)
- [x] Bullets drop — `public/assets/audio/sfx/sfx_bullets_drop.mp3` (deployed + active in useSoundSystem)
- [x] Impact small/medium — `public/assets/audio/sfx/sfx_impact_*.mp3` (deployed + active in useSoundSystem)
- [x] Landing — `public/assets/audio/sfx/sfx_landing.mp3` (deployed + active in useSoundSystem)
- [x] Hit ground — `public/assets/audio/sfx/sfx_hit_ground.mp3` (deployed + active in useSoundSystem)
- [x] Explosion EMP — `public/assets/audio/sfx/sfx_explosion_emp.mp3` (deployed + active in useSoundSystem)
- [x] Burst — `public/assets/audio/sfx/sfx_burst.mp3` (deployed + active in useSoundSystem)
- [x] Ambient beeps — `public/assets/audio/sfx/sfx_ambient_beeps.mp3` (deployed + active in useSoundSystem)
- [x] Door open — `public/assets/audio/sfx/sfx_door_open.mp3` (deployed + active in useSoundSystem)
- [x] Jacking in — `public/assets/audio/sfx/sfx_jacking_in.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Power surge — `public/assets/audio/sfx/sfx_power_surge.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Statue break — `public/assets/audio/sfx/sfx_statue_break.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Ammo drop — `public/assets/audio/sfx/sfx_ammo_drop.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Elevator drop — `public/assets/audio/sfx/sfx_elevator_drop.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Explosion large — `public/assets/audio/sfx/sfx_explosion_large.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Sentinel search — `public/assets/audio/sfx/sfx_sentinel_search.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Sentinel swarm — `public/assets/audio/sfx/sfx_sentinel_swarm.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Kung fu hit — `public/assets/audio/sfx/sfx_kung_fu_hit.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Glass break — `public/assets/audio/sfx/sfx_glass_break.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Power down — `public/assets/audio/sfx/sfx_power_down.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Blip — `public/assets/audio/sfx/sfx_blip.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Spoon bend — `public/assets/audio/sfx/sfx_spoon_bend.mp3` (R78.1 — wired to all 10 Phaser games)
- [x] Unplug — `public/assets/audio/sfx/sfx_unplug.mp3` (R78.1 — wired to all 10 Phaser games)
- [~] Achievement unlock fanfare — trim from `cruise control (game start).wav` (needs ffmpeg)
- [~] High score celebration — trim from `a last embrace (credit roll).wav` (needs ffmpeg)

## Audio — Music

- [x] Arcade menu theme — `public/assets/audio/music/menu-theme.mp3` (2.0MB)
- [x] Stage/gameplay theme — `public/assets/audio/music/stage-theme.mp3` (2.1MB)
- [x] Boss theme — `public/assets/audio/music/boss-theme.mp3` (2.2MB)
- [x] Brothers and Sisters — `public/assets/audio/music/brothers-and-sisters.mp3` (12.1MB)
- [~] Victory/completion jingle — trim intro of `a last embrace (credit roll).wav` to 3-5s (needs ffmpeg)
- [~] Game over sting — from SFX kit or synthesise (needs ffmpeg)
- [ ] WAV tracks need ffmpeg conversion: Cyberpsychotic, Cyberpunkin', Enhancements, In The Moonlight, ostcrunch2 epic, ostcrunch2 resonance

## Shared Game Sprites

- [x] Firework explosion frames (3 colours × 7 frames) — `public/assets/shared/particles/firework-*.png`
- [~] Matrix rain column particles — generate from MatrixType font glyphs
- [~] Generic power-up glow effect — recolour firework frames
- [ ] Screen flash / screen shake overlay — generate procedurally
- [~] Star / sparkle particle — crop from firework frames to 8×8 or 16×16
