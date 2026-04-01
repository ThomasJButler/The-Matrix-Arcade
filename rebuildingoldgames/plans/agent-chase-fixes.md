# Agent Chase — Bug Fixes & Enhancements

## Status: RESEARCH NEEDED

## Already Phaser — needs AI fixes and map expansion.

## Reference Images
- `../inspirationimagesandsprites/pacman/` (11 sprites)

## Known Bugs
- [ ] Agent Smiths stuck in centre box — only one actually chases player
- [ ] Wall collision glitch — player doesn't auto-turn on wall hit, looks glitchy
- [ ] Map too constrained — needs more open paths

## Feature Requests
- [ ] Multiple map layouts: Square (Easy), Circle (Medium), Diamond (Hard)
- [ ] All agents should actively chase (proper scatter/chase AI like Pac-Man)
- [ ] Auto-turn on wall collision (continue in last valid direction)
- [ ] More power pellet effects
- [ ] Better ghost/agent release timing from centre box

## Research Tasks
- [ ] Study Pac-Man ghost AI patterns (Blinky chase, Pinky ambush, Inky flank, Clyde shy)
- [ ] Catalogue sprites from `pacman/` folder
- [ ] Debug agent spawn/release logic in current GameScene
- [ ] Design auto-turn wall collision (buffer last direction, slide along wall)
- [ ] Design 3 map layouts (tilemap-based or procedural)
- [ ] Plan difficulty curve across map variants
- [ ] Write test plan for AI fixes
