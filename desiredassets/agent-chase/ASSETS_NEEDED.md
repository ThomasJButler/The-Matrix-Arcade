# Agent Chase — Asset Requirements

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/pacman/)

- [x] Pac-Man sprite (PacManAssets-PacMan.png)
- [x] Ghost sprites (PacManAssets-Ghosts.png)
- [x] Item sprites (PacManAssets-Items.png)
- [x] Map tileset (PacManAssets_Map_TileSet.png)
- [x] 3 map layout variations (Map_1, Map_2, Map_3)
- [x] Map with background (Map_Back&Maze.png)

## Currently Procedural (in BootScene — 100% generated)

All 18 textures are procedurally generated (player open/closed mouth, 4 agent ghosts, frightened states, eyes, dots, power pellets, 6 fruit types, wall tile). No external files loaded.

## Still Needed

### Player (Neo as Pac-Man)
- [ ] Player sprite — open mouth, 4 directions, 18×18 or 32×32
- [ ] Player sprite — closed mouth, 4 directions
- [ ] Player death animation — 6-8 frames (shrink / dissolve)
- [ ] Player powered-up variant (glow after power pellet)

### Agents (Ghosts → Agent Smiths)
- [ ] Agent Smith (Blinky/red) — 2-frame walk, 4 directions, 18×18 or 32×32
- [ ] Agent Brown (Pinky/pink) — 2-frame walk, 4 directions
- [ ] Agent Jones (Inky/cyan) — 2-frame walk, 4 directions
- [ ] Agent Johnson (Clyde/orange) — 2-frame walk, 4 directions
- [ ] Frightened agent (blue mode) — 2-frame wobble
- [ ] Frightened warning (white flash) — 2-frame
- [ ] Eyes only (returning to box) — directional

### Dots & Collectibles
- [ ] Data dot — small, 8×8, pulsing glow
- [ ] Power pellet — large, 16×16, bright glow
- [ ] Fruit/bonus items — 6 types, 20×20 each (cherry, strawberry, orange, apple, grape, banana — or Matrix-themed equivalents like red pill, blue pill, phone, key, sunglasses, code fragment)

### Maps (3 layouts for difficulty modes)
- [x] Map tileset available — may need Matrix-green recolour
- [ ] Square map layout (Easy) — classic Pac-Man grid
- [ ] Circle map layout (Medium) — circular paths, more open
- [ ] Diamond map layout (Hard) — diamond shape, tight corridors
- [ ] Wall tile — Matrix-green border, 20×20 or 32×32
- [ ] Ghost house / agent spawn box tiles

### UI
- [ ] Lives indicator (player icon × remaining)
- [ ] Score display
- [ ] Level indicator
- [ ] Ready/Start text overlay

### Audio
- [ ] Dot eat (wakka wakka — classic, fast)
- [ ] Power pellet eat (dramatic shift)
- [ ] Agent eaten (score popup sound)
- [ ] Fruit eat
- [ ] Death jingle
- [ ] Level start jingle
- [ ] Intermission music (between levels)
- [ ] Ghost siren ambient (continuous, pitch increases with fewer dots)
