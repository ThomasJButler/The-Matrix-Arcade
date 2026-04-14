# Agent Chase — Asset Requirements

## Source Mapping (from TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/)

| Asset Category | Source | Location |
|---|---|---|
| Player Sprite | Pac-Man Assets | INSPO/pacman/PacManAssets/ |
| Agent Ghosts | Pac-Man Assets | INSPO/pacman/PacManAssets/ |
| Dot Collectibles | Pac-Man Assets | INSPO/pacman/PacManAssets/ |
| Map Tileset | Pac-Man Assets + Roguelike | INSPO/pacman/PacManAssets/ + DUMP/32rogues/ |
| Agent Smith Variants | Kings and Pigs | DUMP/Kings and Pigs/ |
| Bonus Items / UI Icons | Hologram Interface | DUMP/1. Free Hologram Interface Wenrexa/Icons/ |
| Audio (SFX Kit) | Matrix Arcade Tracks | DUMP/MatrixArcadeTracksSoundEffects/ |

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/pacman/)

- [x] Pac-Man sprite (PacManAssets-PacMan.png)
- [x] Ghost sprites (PacManAssets-Ghosts.png)
- [x] Item sprites (PacManAssets-Items.png)
- [x] Map tileset (PacManAssets_Map_TileSet.png)
- [x] 3 map layout variations (Map_1, Map_2, Map_3)
- [x] Map with background (Map_Back&Maze.png)

## Currently Procedural (in BootScene — fallback generated)

8 sprites loaded from files (player, 4 agents, frightened, wall, 6 fruit). Remaining procedural: player open/closed mouth variants, frightened warning, agent eyes, dots, power pellets. Procedural fallbacks exist for all textures.

## Still Needed

### Player (Neo as Pac-Man)
- [x] Player sprite — open mouth, 4 directions, 18×18 or 32×32
- [ ] Player sprite — closed mouth, 4 directions
- [ ] Player death animation — 6-8 frames (shrink / dissolve)
- [ ] Player powered-up variant (glow after power pellet)

### Agents (Ghosts → Agent Smiths)
- [x] Agent Smith (Blinky/red) — 2-frame walk, 4 directions, 18×18 or 32×32 — SOURCE: DUMP/Kings and Pigs/ (pig variants as agents)
- [x] Agent Brown (Pinky/pink) — 2-frame walk, 4 directions — SOURCE: DUMP/Kings and Pigs/
- [x] Agent Jones (Inky/cyan) — 2-frame walk, 4 directions — SOURCE: DUMP/Kings and Pigs/
- [x] Agent Johnson (Clyde/orange) — 2-frame walk, 4 directions — SOURCE: DUMP/Kings and Pigs/
- [x] Frightened agent (blue mode) — 2-frame wobble — SOURCE: DUMP/Kings and Pigs/
- [~] Frightened warning (white flash) — 2-frame — SOURCE: DUMP/Kings and Pigs/
- [~] Eyes only (returning to box) — directional — SOURCE: INSPO/pacman/PacManAssets/Ghosts

### Dots & Collectibles
- [~] Data dot — small, 8×8, pulsing glow — SOURCE: INSPO/pacman/PacManAssets/Items
- [~] Power pellet — large, 16×16, bright glow — SOURCE: INSPO/pacman/PacManAssets/Items
- [x] Fruit/bonus items — 6 types, 20×20 each (cherry, strawberry, orange, apple, grape, banana) — extracted from PacManAssets-Items.png spritesheet with PIL bbox cropping, deployed to public/assets/agent-chase/

### Maps (3 layouts for difficulty modes)
- [x] Map tileset available — may need Matrix-green recolour
- [~] Square map layout (Easy) — classic Pac-Man grid — SOURCE: INSPO/pacman/PacManAssets/Maps (Map_1, Map_2, Map_3)
- [~] Circle map layout (Medium) — circular paths, more open — SOURCE: INSPO/pacman/PacManAssets/Maps
- [~] Diamond map layout (Hard) — diamond shape, tight corridors — SOURCE: DUMP/32rogues/ (roguelike maze variants)
- [x] Wall tile — Matrix-green border, 20×20 or 32×32 — SOURCE: INSPO/pacman/PacManAssets/ + DUMP/32rogues/
- [~] Ghost house / agent spawn box tiles — SOURCE: DUMP/32rogues/

### UI
- [ ] Lives indicator (player icon × remaining)
- [ ] Score display
- [ ] Level indicator
- [ ] Ready/Start text overlay

### Audio
- [x] Dot eat (wakka wakka — classic, fast) — covered by global SFX kit (sfx_blip.mp3) — R78.1
- [x] Power pellet eat (dramatic shift) — covered by global SFX kit (sfx_power_surge.mp3) — R78.1
- [x] Agent eaten (score popup sound) — covered by global SFX kit (sfx_kung_fu_hit.mp3) — R78.1
- [x] Fruit eat — covered by global SFX kit (sfx_blip.mp3) — R78.1
- [~] Death jingle — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Level start jingle — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Intermission music (between levels) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/
- [~] Ghost siren ambient (continuous, pitch increases with fewer dots) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
