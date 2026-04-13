# Phaser Game Specifications

These games replace the buggy React/Canvas implementations with proper Phaser 3 architecture.

## CRITICAL: Before Building

1. Read `.claude/skills/phaser-gamedev/SKILL.md`
2. Read `.claude/skills/phaser-gamedev/references/spritesheets-nineslice.md` - MEASURE sprites first
3. Read `.claude/skills/phaser-gamedev/references/arcade-physics.md`

---

## Game 1: Matrix Frogger

**Replaces**: CrossyRoad (buggy collision, broken power-ups)

**Type**: Frogger-style lane crossing

**Gameplay**:
- Player moves up through lanes of obstacles
- Dodge Agents (walk back and forth) and Sentinels (fast, cross screen)
- Collect red pills for points, blue pills for power-ups
- Power-ups: Bullet Time (slow-mo), Ghost (invincible), Shield (1 hit), Magnet (attract pills)
- Score based on distance travelled

**Assets**:
- Player: `assets/TopView Robot Asset Pack/Player.png` (128x64, 2 frames)
- Enemies: `assets/TopView Robot Asset Pack/Enemy*.png`
- Background: Cyberpunk city scrolling

**Controls**:
- Arrow keys / WASD: Move (grid-based, hop forward/back/left/right)
- P: Pause
- M: Mute
- ESC: Exit

**Phaser Config**:
- Physics: Arcade (AABB collision)
- Scene flow: Boot → Menu → Game → GameOver

---

## Game 2: Neo Jump

**Replaces**: MatrixAscension (broken physics, deltaTime issues)

**Type**: Doodle Jump vertical platformer

**Gameplay**:
- Auto-bounce on platforms, reach maximum altitude
- Platform types: Normal, Moving, Spring (high bounce), Disappearing, Breakable
- Enemies spawn at higher altitudes
- Jetpack power-up for controlled flight
- Shoot projectiles upward to kill enemies
- Camera follows player upward (no going back down)
- Game over when falling below camera

**Assets**:
- Player: `assets/Legacy-Fantasy - High Forest 2.3/Character/`
  - `Idle-Sheet.png` (256x80, 4 frames at 64x80)
  - `Run-Sheet.png` (640x80, 8 frames at 80x80)
  - `Jump-Start-Sheet.png`, `Jump-End-Sheet.png`
- Platforms: Simple coloured rectangles with Matrix glow
- Background: Parallax matrix rain (3 layers)

**Controls**:
- Left/Right arrows or A/D: Move horizontally
- Space or Up: Shoot / Activate jetpack
- P: Pause
- M: Mute
- ESC: Exit

**Phaser Config**:
- Physics: Arcade with gravity (300-500)
- Camera: Follow player Y, bounded to not go down

---

## Game 3: Agent Chase

**Replaces**: AgentEscape (broken ghost AI, collision issues)

**Type**: Pacman-style maze game

**Gameplay**:
- Navigate maze collecting dots
- 4 Agent ghosts with unique AI behaviours:
  - Smith (red): Direct chase
  - Brown (pink): Ambush (targets ahead of player)
  - Jones (cyan): Patrol/scatter
  - Johnson (orange): Flanking
- Power pellets make ghosts vulnerable (eat them for bonus)
- Fruit spawns for bonus points
- Clear all dots to advance level

**Assets**:
- Player: Yellow Pacman shape (can use `assets/32rogues/rogues.png` character)
- Ghosts: Coloured sprites from 32rogues or simple shapes
- Maze: `assets/Kings and Pigs/Terrain/` tileset (32x32 tiles)

**Controls**:
- Arrow keys / WASD: Move in maze
- P: Pause
- M: Mute
- ESC: Exit

**Phaser Config**:
- Physics: Arcade
- Tilemap: JSON exported from Tiled or procedurally generated
- Ghost AI: State machine (chase/scatter/frightened)

---

## Game 4: Rhythm Hacker

**Replaces**: JimmyMatrix (broken hit detection, hold notes don't work)

**Type**: Guitar Hero / rhythm game

**Gameplay**:
- 4 lanes (D, F, J, K keys)
- Notes fall from top, hit when they reach the line
- Note types:
  - Normal: Single tap
  - Hold: Press and hold for duration
  - Double: Two lanes simultaneously
- Timing grades: Perfect (40ms), Great (80ms), Good (120ms), Miss
- Combo system with multiplier
- Health decreases on miss, game over at 0

**Assets**:
- UI: `assets/1. Free Hologram Interface Wenrexa/` for panels and buttons
- Fonts: `assets/NotJamFontPack/` for retro text
- Notes: Simple geometric shapes with glow effects

**Controls**:
- D, F, J, K: Hit notes in lanes 1-4
- P: Pause
- M: Mute
- ESC: Exit

**Phaser Config**:
- Physics: None (timing-based, not physics-based)
- Use Phaser's clock for precise timing
- Hit detection based on note.y position vs hit line

---

## Game 5: Cloud Jumper (NEW)

**Type**: Flappy Bird / Doodle Jump hybrid side-scroller

**Theme**: View from airplane window, jumping on clouds

**Gameplay**:
- Side-scrolling (camera moves right automatically)
- Player jumps between clouds (platforms)
- Clouds scroll from right to left
- Different cloud types: Normal, Moving up/down, Disappearing, Storm (damages)
- Collect items floating in sky for points
- Avoid birds/planes as obstacles
- Score based on distance travelled

**Assets**:
- Player: `assets/PixelWhale SF Project/` soldier (64x64) or similar small character
- Clouds: `assets/Treasure Hunters/Big Clouds.png` (448x101)
- Background: Sky gradient with parallax cloud layers
- UI: Hologram Interface elements

**Controls**:
- Space / Up / Click: Jump
- P: Pause
- M: Mute
- ESC: Exit

**Phaser Config**:
- Physics: Arcade with gravity
- Camera: Auto-scroll right, follow player Y loosely
- Parallax: 3+ background layers at different speeds

---

## Integration Requirements

All games must:

1. **Use PhaserGame React wrapper** at `src/lib/phaser/PhaserGame.tsx`
2. **Accept standard props**:
   ```typescript
   interface GameProps {
     achievementManager?: AchievementManager;
     isMuted?: boolean;
     autoStart?: boolean;
     onExit?: () => void;
   }
   ```
3. **Integrate with useSoundSystem** for audio
4. **Integrate with useSaveSystem** for high scores
5. **Support keyboard shortcuts**: ESC (exit), P (pause), M (mute), R (restart on game over)
6. **Follow Matrix theme**: Green (#00ff00), black background, glow effects

## File Structure

```
src/components/games/phaser/
├── MatrixFrogger/
│   ├── index.tsx
│   ├── config.ts
│   └── scenes/
│       ├── BootScene.ts
│       ├── GameScene.ts
│       └── GameOverScene.ts
├── NeoJump/
├── AgentChase/
├── RhythmHacker/
└── CloudJumper/
```
