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
- [~] Player paddle sprite — Matrix green glow, elongated, 16×80 — or use existing — **SOURCE**: `INSPO/vortexpong/`
- [~] AI paddle sprite — Red/orange tint, same dimensions — **SOURCE**: `INSPO/vortexpong/`
- [ ] Paddle powered-up variant (wider paddle power-up) — 16×120

### Ball
- [~] Ball sprite — glowing Matrix green, 16×16 — **SOURCE**: `INSPO/vortexpong/`
- [~] Ball trail particle — small, fading, 8×8 — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/`
- [~] Multi-ball variant (different colour — cyan?) — 16×16 — **SOURCE**: `DUMP/Sprites - Lasers Bullets #1/`

### Power-ups
- [ ] Bigger paddle icon — 32×32
- [ ] Slower ball icon — 32×32
- [ ] Score multiplier icon — 32×32
- [~] Multi-ball icon — 32×32 — **SOURCE**: `DUMP/Sprites - Lasers Bullets #1/`

### Arena
- [~] Arena background — dark with subtle grid lines, 800×400 — **SOURCE**: `INSPO/vortexpong/`
- [~] Centre line — dashed, vertical — **SOURCE**: `DUMP/1. Free Hologram Interface Wenrexa/`
- [~] Goal flash effect — full-width horizontal line, 2-3 frames — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/`
- [~] Arena border glow (when ball is near edge) — **SOURCE**: `DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/firework/`

### Effects
- [x] Fireball trail — 5 frames available, may need Matrix-green recolour
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
