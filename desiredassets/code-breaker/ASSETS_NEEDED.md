# Code Breaker — Asset Requirements (New Game)

## Source Mapping (from TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/)

| Asset Category | Source | Location | Details |
|---|---|---|---|
| Breakout/Brick Breaker Sprites | Block Breaker Pixel Art | INSPO/blockbreakerbrickbreaker/ | 27+ sprites (bricks, paddle, ball, backgrounds) |
| Laser Sprites | Lasers Bullets Pack | DUMP/Sprites - Lasers Bullets #1/ | Laser beam sprites for power-up |
| Robot/Agent Enemies | TopView Robot Asset Pack | DUMP/TopView_Robot_Asset_Pack/ | Robot enemy sprites for Agent Smith |
| Agent Smith Animations | Matrix Arcade Cyberpunk | DUMP/MatrixArcadeCyberPunkAssets/ | Character animations (walk/attack/death) |
| Explosion/Particle Effects | Matrix Arcade Fireworks | DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/ | Explosion/particle effects |
| Power-up Icons | Hologram Interface | DUMP/1. Free Hologram Interface Wenrexa/Icons/ | 6 power-up icons |
| Boss Health Bar | Hologram Interface | DUMP/1. Free Hologram Interface Wenrexa/Progress Bar/ | Health bar sprites |
| Sound Effects | Matrix Arcade Tracks | DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/ | SFX kit (bounces, hits, power-ups) |
| Background Music | Matrix Arcade Tracks | DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/ | Background music tracks |

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
- [~] Paddle with laser attachment (Laser power-up active) — SOURCE: DUMP/Sprites - Lasers Bullets #1/
- [ ] Paddle with shield/firewall glow (Firewall power-up active)
- [ ] Paddle hit flash effect

### Ball
- [x] Default ball — available (ball_default.png)
- [~] Ball trail particle — 4×4, fading green — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/
- [~] Multi-ball variant (different colour — cyan) — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/
- [~] Ball powered-up glow (EMP active) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/

### Bricks
- [x] 9 colour variants available — map to HP system:
  - 1HP = green bricks
  - 2HP = yellow bricks
  - 3HP = red bricks
- [x] Unbreakable brick — available
- [~] Brick crack overlay (for 2HP/3HP showing damage) — 32×16 or brick-sized — SOURCE: INSPO/blockbreakerbrickbreaker/ or DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/
- [~] Brick destruction animation — 4-6 frames (shatter / code dissolve) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/
- [~] Boss brick — 64×32 or 96×32, with Matrix face/pattern — SOURCE: DUMP/TopView_Robot_Asset_Pack/ or DUMP/MatrixArcadeCyberPunkAssets/
- [~] Code pattern bricks — arranged to look like source code lines — SOURCE: INSPO/blockbreakerbrickbreaker/

### Enemies
- [~] Agent Smith spawn animation — emerges from broken brick, 32×48, 4 frames — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/
- [~] Agent Smith walking down — 32×48, 4-frame walk cycle — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/ or DUMP/TopView_Robot_Asset_Pack/
- [~] Agent Smith death — 32×48, dissolve/shatter, 4 frames — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/ (effects) + DUMP/MatrixArcadeCyberPunkAssets/

### Power-ups (6 types, floating down after brick break)
- [~] Multi-ball icon — 24×24 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons/
- [~] Wide Paddle icon — 24×24 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons/
- [~] Laser icon — 24×24 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons/ or DUMP/Sprites - Lasers Bullets #1/
- [~] Bullet Time icon — 24×24 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons/
- [~] Firewall icon — 24×24 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons/
- [~] EMP icon — 24×24 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons/
- [~] Power-up glow/particle aura — 32×32 (shared effect) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/

### Laser (power-up active)
- [~] Laser beam sprite — 4×16 or 8×32, bright green — SOURCE: DUMP/Sprites - Lasers Bullets #1/
- [~] Laser impact on brick — spark effect, 16×16, 3 frames — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/

### Portal (win condition)
- [~] Portal sprite — revealed behind bricks, 64×64 or 96×96, swirling animation (4-6 frames) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/ or DUMP/MatrixArcadeCyberPunkAssets/
- [~] Portal glow effect — radial, pulsing — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/

### Environment
- [x] Background — available (Background1.png)
- [x] Frame — available (Frame.png)
- [~] Matrix-themed alternative background (code rain, dark) — SOURCE: DUMP/MatrixArcadeCyberPunkAssets/ or DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/
- [~] Level transition effect (code dissolve / wipe) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/

### UI
- [x] Game over panel — available
- [x] Play again button — available (+ pressed state)
- [~] Score display — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Card X*/
- [ ] Lives indicator
- [ ] Level indicator
- [~] Power-up active indicators (HUD bar showing active power-ups with timers) — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Progress Bar/
- [~] Boss health bar — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Progress Bar/

### Audio
- [~] Ball bounce off paddle (pitched by hit position) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Ball bounce off wall — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Brick hit (1HP) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Brick crack (2HP/3HP taking damage) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Brick destroy — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Power-up collect — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Laser fire — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Agent Smith spawn warning — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Agent Smith death — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Boss brick hit — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Boss brick destroyed — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Portal revealed fanfare — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Portal entered (victory) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Ball lost / life lost — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] EMP activation (electromagnetic pulse) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Bullet time activate / deactivate — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/
- [~] Background music (tense, building, electronic, loopable) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/
- [~] Boss level music variant (more intense) — SOURCE: DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/
