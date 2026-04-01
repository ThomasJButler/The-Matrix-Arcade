# Code Breaker — New Flagship Game Plan

## Status: RESEARCH NEEDED

## Design Vision
Brick breaker meets Matrix. Break through a wall of code to escape the simulation. Phaser game, 800×600.

## Reference Images
- `../inspirationimagesandsprites/blockbreakerbrickbreaker/` (27 sprites — paddle, ball, 9 brick colours, frame, UI)

## Game Concept
- Code bricks arranged as code patterns (green 1HP, yellow 2HP, red 3HP)
- Agent Smiths spawn from broken bricks and move downward — dodge or shoot
- 6 power-ups: Multi-ball, Wide Paddle, Laser, Bullet Time, Firewall, EMP
- Level progression: simple rows → code patterns → boss bricks
- Win condition: break through to the portal behind the wall
- 10 achievements

## Research Tasks
- [ ] Study classic Breakout/Arkanoid physics (ball reflection angles, paddle hit zones)
- [ ] Catalogue all 27 sprites (paddle variants, ball, brick colours, UI elements)
- [ ] Design brick layout system (level editor or config-based patterns)
- [ ] Plan ball physics in Phaser Arcade (reflection, speed increase, spin)
- [ ] Plan paddle movement (mouse + keyboard)
- [ ] Design Agent Smith enemy spawning (triggered by brick destruction, moves down)
- [ ] Design 6 power-ups with visual effects
- [ ] Plan boss brick system (large bricks with HP, attack patterns)
- [ ] Design level progression (10+ levels with increasing complexity)
- [ ] Plan portal win condition (break through all bricks to reveal portal)
- [ ] Design achievement list (10 achievements)
- [ ] Write test plan
