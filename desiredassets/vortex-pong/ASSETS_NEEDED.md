# Vortex Pong — Asset Requirements

## Source Mapping

| Asset Category | Source |
|---|---|
| Base pong assets (paddles, ball, arena) | `INSPO/vortexpong/` |
| Particle effects & fireworks | `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/` |
| UI panels & score display | `DUMP/1. Free Hologram Interface Wenrexa/` |
| Sound effects | `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/` |
| Bullet & projectile sprites | `DUMP/Sprites - Lasers Bullets #1/` |

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/vortexpong/)

- [x] Ball sprite (Ball.png, BallMotion.png)
- [x] Player paddle (Player.png)
- [x] AI paddle (Computer.png)
- [x] Arena board (Board.png)
- [x] Score bar UI (ScoreBar.png)
- [x] Fireball effect animation (5 frames — FB001-FB005.png)
- [x] Reference images (pong1.png, pong2.png, pong.gif)

## Still Needed

### Player & Opponents
- [x] Player paddle sprite — Matrix green glow, elongated, 16×80 — or use existing — **SOURCE**: `INSPO/vortexpong/` — deployed as `paddle_player.png` (17×120, recoloured to Matrix green)
- [x] AI paddle sprite — Red/orange tint, same dimensions — **SOURCE**: `INSPO/vortexpong/` — deployed as `paddle_ai.png` (17×120, recoloured to darker Matrix green)
- [ ] Paddle powered-up variant (wider paddle power-up) — 16×120

### Ball
- [x] Ball sprite — glowing Matrix green, 16×16 — **SOURCE**: `INSPO/vortexpong/` — deployed as `ball.png` (30×30, recoloured to Matrix green)
- [x] Ball trail particle — small, fading, 8×8 — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/` — deployed as `ball_motion.png` (46×46, recoloured to Matrix green)
- [~] Multi-ball variant (different colour — cyan?) — 16×16 — **SOURCE**: `DUMP/Sprites - Lasers Bullets #1/`

### Power-ups
- [ ] Bigger paddle icon — 32×32
- [ ] Slower ball icon — 32×32
- [ ] Score multiplier icon — 32×32
- [~] Multi-ball icon — 32×32 — **SOURCE**: `DUMP/Sprites - Lasers Bullets #1/`

### Arena
- [x] Arena background — dark with subtle grid lines, 800×400 — **SOURCE**: `INSPO/vortexpong/` — deployed as `board.png` (802×455, green-tinted centre line)
- [x] Centre line — dashed, vertical — **SOURCE**: `DUMP/1. Free Hologram Interface Wenrexa/` — integrated into `board.png`
- [~] Goal flash effect — full-width horizontal line, 2-3 frames — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/`
- [~] Arena border glow (when ball is near edge) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/`

### Effects
- [x] Fireball trail — 5 frames deployed as `fireball_1-5.png` (64×32 each, recoloured to Matrix green)
- [~] Goal explosion particle — 32×32, 4-6 frames — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/`
- [ ] Screen shake overlay (or handle procedurally)
- [ ] Combo text popup sprite (or render procedurally)

### Audio
- [~] Ball hit paddle — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Ball hit wall — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Goal scored — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Power-up collect — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Rally building tension (optional ambient) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
- [~] Match point dramatic sting — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects/`
