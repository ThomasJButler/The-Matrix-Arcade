# Code Breaker — Asset Requirements (New Game)

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/blockbreakerbrickbreaker/)

- [x] BBreaker pack: Player.png, Player_flash.png, Ball_small-blue.png
- [x] BBreaker pack: 9 brick colour variants (Brick1_4 through Brick9_4)
- [x] BBreaker pack: Brick_unbreakable2.png, Background1.png, Frame.png
- [x] Breakout pixel art: paddle.png, paddle_small.png, paddle_wide.png
- [x] Breakout pixel art: ball_default.png
- [x] Breakout pixel art: block_blue, block_brown, block_green, block_pink
- [x] Breakout pixel art: game_over_panel.png, button_play_again.png (+ pressed)

## Still Needed

### Paddle
- [x] Normal paddle — available (paddle.png)
- [x] Wide paddle variant — available (paddle_wide.png)
- [x] Small paddle variant — available (paddle_small.png)
- [ ] Paddle with laser attachment (Laser power-up active)
- [ ] Paddle with shield/firewall glow (Firewall power-up active)
- [ ] Paddle hit flash effect

### Ball
- [x] Default ball — available (ball_default.png)
- [ ] Ball trail particle — 4×4, fading green
- [ ] Multi-ball variant (different colour — cyan)
- [ ] Ball powered-up glow (EMP active)

### Bricks
- [x] 9 colour variants available — map to HP system:
  - 1HP = green bricks
  - 2HP = yellow bricks
  - 3HP = red bricks
- [x] Unbreakable brick — available
- [ ] Brick crack overlay (for 2HP/3HP showing damage) — 32×16 or brick-sized
- [ ] Brick destruction animation — 4-6 frames (shatter / code dissolve)
- [ ] Boss brick — 64×32 or 96×32, with Matrix face/pattern
- [ ] Code pattern bricks — arranged to look like source code lines

### Enemies
- [ ] Agent Smith spawn animation — emerges from broken brick, 32×48, 4 frames
- [ ] Agent Smith walking down — 32×48, 4-frame walk cycle
- [ ] Agent Smith death — 32×48, dissolve/shatter, 4 frames

### Power-ups (6 types, floating down after brick break)
- [ ] Multi-ball icon — 24×24
- [ ] Wide Paddle icon — 24×24
- [ ] Laser icon — 24×24
- [ ] Bullet Time icon — 24×24
- [ ] Firewall icon — 24×24
- [ ] EMP icon — 24×24
- [ ] Power-up glow/particle aura — 32×32 (shared effect)

### Laser (power-up active)
- [ ] Laser beam sprite — 4×16 or 8×32, bright green
- [ ] Laser impact on brick — spark effect, 16×16, 3 frames

### Portal (win condition)
- [ ] Portal sprite — revealed behind bricks, 64×64 or 96×96, swirling animation (4-6 frames)
- [ ] Portal glow effect — radial, pulsing

### Environment
- [x] Background — available (Background1.png)
- [x] Frame — available (Frame.png)
- [ ] Matrix-themed alternative background (code rain, dark)
- [ ] Level transition effect (code dissolve / wipe)

### UI
- [x] Game over panel — available
- [x] Play again button — available (+ pressed state)
- [ ] Score display
- [ ] Lives indicator
- [ ] Level indicator
- [ ] Power-up active indicators (HUD bar showing active power-ups with timers)
- [ ] Boss health bar

### Audio
- [ ] Ball bounce off paddle (pitched by hit position)
- [ ] Ball bounce off wall
- [ ] Brick hit (1HP)
- [ ] Brick crack (2HP/3HP taking damage)
- [ ] Brick destroy
- [ ] Power-up collect
- [ ] Laser fire
- [ ] Agent Smith spawn warning
- [ ] Agent Smith death
- [ ] Boss brick hit
- [ ] Boss brick destroyed
- [ ] Portal revealed fanfare
- [ ] Portal entered (victory)
- [ ] Ball lost / life lost
- [ ] EMP activation (electromagnetic pulse)
- [ ] Bullet time activate / deactivate
- [ ] Background music (tense, building, electronic, loopable)
- [ ] Boss level music variant (more intense)
