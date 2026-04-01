# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

---

## Current Status

- **Status**: REBUILDING — Phaser migration of all React/Canvas games + new features
- **Last Updated**: 1 April 2026
- **Version**: v2.0.0 (next target)
- **Games**: 11 playable (6 React/Canvas → rebuilding to Phaser, 5 already Phaser) + 1 planned (Code Breaker)
- **Build**: PASSES (code-split, main bundle 370KB)
- **Unit Tests**: ~1,901 across 53 files
- **E2E Tests**: 76 gameplay + 51 visual = 127 tests across 26 spec files

### What Was Completed (v1.x → v2.0 prep)

All P0/P1/P2 bugs resolved. Test seams added to all games. E2E gameplay specs written (76 tests). Code quality fixes across 20+ hooks and components. Code-splitting reduced main bundle from 2.18MB to 370KB. Shared game registry created. Error boundaries added. Collision utility extracted. Full details in git history.

### Skills & Agents for Ralph Loop

| Skill/Agent | Command | When to Use |
|-------------|---------|-------------|
| Matrix Arcade Gamedev | `/matrix-arcade-gamedev` | Any game code changes |
| Phaser Gamedev | `/phaser-gamedev` | Phaser 3 scene development |
| Frontend Design | `/frontend-design` | UI/UX improvements |
| Playwright Testing | `/playwright-testing` | E2E test creation/debugging |
| New Game Scaffolder | `/new-game <Name> --phaser` | Scaffolding a brand new game |
| Game Tester | agent: `game-tester` | Run full test suite after changes |

---

## Phase 1: Research & Planning

Before any code changes, create detailed rebuild documents in `rebuildingoldgames/` for each game. Use reference images from `rebuildingoldgames/inspirationimagesandsprites/`, the user's bug notes in `rebuildingoldgames/bugs.md`, and analysis of existing code.

### 1.1 Global Infrastructure Research

- [ ] **Three.js Matrix Rain Background** — Research replacing CSS matrix rain with smooth 3D Three.js implementation. Prototype in isolation. Must run at 60fps. Depth-of-field, instanced geometry, responds to game events (speeds up during play, slows on menu).
- [ ] **Global Asset System** — Design unified font, spritesheet, and audio management. Plan `src/lib/assets/` with loaders for fonts (Press Start 2P + pixel fonts from asset packs), centralised spritesheet atlases, and audio library (music tracks + SFX). This ensures all games share resources efficiently.
- [ ] **Game Card Portal Redesign** — Plan larger game cards (see `gamecardlayout.png`). Add Instructions button (opens modal) and High Scores button. ASCII art for all game titles. Remove inline instruction text. Same card design for all games in carousel view.
- [ ] **Save System Crash Fix** — Root cause: `unlockAchievement` fallback creates incomplete `GameSaveData` (missing `level`, `stats` sub-object). Plan: fix fallback to use `createDefaultGameSave()`. Also add migration for pre-1.0 data with flat `gamesPlayed` field.
- [ ] **Global Controls UX Redesign** — Current GLOBAL CONTROLS section is too wide, sparse, and disconnected (see user screenshot). Plan: compact into a sleek bar or hide behind a keyboard icon toggle. Should feel like part of the Matrix terminal aesthetic, not a plain text table.

### 1.2 React → Phaser Rebuild Research (6 games)

Each document goes in `rebuildingoldgames/plans/` and covers: current state analysis, bugs to fix, design vision (with reference images), Phaser scene architecture, sprite requirements (from asset folders), achievement list, and test plan.

- [ ] **CTRL-S | The World** (`rebuildingoldgames/plans/ctrl-s-rebuild.md`) — The largest rebuild. Currently 1,826 lines of React DOM. Research Citizen Sleeper UI patterns for narrative engine. Plan: Phaser scene graph for text rendering, animated backgrounds, character art panels, choice UI with particle effects, inventory panel, puzzle modals, chapter navigation with smooth transitions. Design vision: `ctrlscitizensleeperimageinspiration/` folder shows the target — illustrated character panels, environmental art backgrounds, clean narrative text with CONTINUE buttons, skill/attribute systems. This needs more care than any other game.

- [ ] **Snake Classic** (`rebuildingoldgames/plans/snake-rebuild.md`) — Currently 666 lines. Plan 3-mode architecture (Classic/Matrix/Hacker). Grid system in Phaser, particle trail sprites, boss encounter design, level progression config, mini-map overlay for levels 6+. 16+ achievements. Reference: `snake/` folder (Snake II Nokia style + sprite assets).

- [ ] **Vortex Pong** (`rebuildingoldgames/plans/vortex-pong-rebuild.md`) — "Perfect, keep as-is, just rebuild." 1,031 lines. Plan: direct port to Phaser Arcade physics for ball/paddle, AI opponent, power-ups, multi-ball. Minimal design changes. Reference: `vortexpong/` folder.

- [ ] **Matrix Cloud** (`rebuildingoldgames/plans/matrix-cloud-rebuild.md`) — Full redesign needed. 1,451 lines. Current bugs: combo awarded without passing through gap, poor sprites. Plan: proper Flappy Bird physics (gravity + tap impulse), pipe gap collision (only score on pass-through, die on any pipe touch), new sprites from `matrixcloud/` folder, lives system, boss encounters. Reference: `matrixcloud/` (52 sprites available).

- [ ] **Matrix Invaders** (`rebuildingoldgames/plans/matrix-invaders-rebuild.md`) — Good game, needs Phaser visual upgrade. 1,191 lines. Plan: enemy wave system using Physics Groups, Phaser's built-in group recycling (replaces manual object pool), bullet time via `scene.physics.world.timeScale`, boss waves, particle effects. Reference: `matrixinvaders/` (16 sprites).

- [ ] **Metris** (`rebuildingoldgames/plans/metris-rebuild.md`) — Bullet time (B) broken. 1,504 lines. Plan: SRS rotation in Phaser tile grid, T-spin detection, ghost piece, hold mechanic, bullet time fix, line clear animations with tweens. Reference: `metris/` (13 sprites including complete tile pack).

### 1.3 Existing Phaser Game Fix Research (5 games)

These are already Phaser but need fixes documented in `rebuildingoldgames/bugs.md`:

- [ ] **Matrix Frogger** (`rebuildingoldgames/plans/frogger-fixes.md`) — Safe start line, 5-second countdown, finish line/pavement (no loop), Kung Fu ability (max 3), road markings, varied agent speeds, chasing agents, NEO mode (invincibility power-up). Reference: `matrixfrogger/` (83 sprites + Krita source files + WAV audio).

- [ ] **Neo Jump** (`rebuildingoldgames/plans/neo-jump-fixes.md`) — Jetpack broken, endless falling (should be instant death), remove current sprites and create custom ones, full UX redesign to match Doodle Jump feel. Reference: `doodlejump/` (406 sprites — complete knight/RPG pack with animations, tiles, UI).

- [ ] **Agent Chase** (`rebuildingoldgames/plans/agent-chase-fixes.md`) — Agent AI: all should chase (not stuck in box), auto-turn on wall collision (no glitch), multiple map layouts (square/circle/diamond for Easy/Medium/Hard). Reference: `pacman/` (11 sprites).

- [ ] **Rhythm Hacker** (`rebuildingoldgames/plans/rhythm-hacker-fixes.md`) — Sync gameplay to backing music track, change keys QW OP (not DF JK), reduce countdown from 10s to 5s, improve visuals and animations. Reference: `guitarhero/` (3 UI reference images).

- [ ] **Cloud Jumper** (`rebuildingoldgames/plans/cloud-jumper-fixes.md`) — CRITICAL: cannot jump at all (unplayable). Debug jump mechanics, potentially rewrite GameScene from scratch. Reference: `cloudjumper/` (237 cloud sprites across 10 themes + tileset).

### 1.4 New Game Research

- [ ] **Code Breaker** (`rebuildingoldgames/plans/code-breaker-new.md`) — Brick breaker meets Matrix. Plan: paddle physics, ball reflection, brick HP system (1/2/3HP green/yellow/red), Agent Smith spawning from broken bricks, 6 power-ups (Multi-ball, Wide Paddle, Laser, Bullet Time, Firewall, EMP), level progression (rows → patterns → bosses), portal win condition, 10 achievements. Reference: `blockbreakerbrickbreaker/` (27 sprites).

---

## Phase 2: Global Infrastructure Build

Build shared systems before game rebuilds.

- [ ] Implement Three.js matrix rain background (replaces CSS animation)
- [ ] Create `src/lib/assets/AssetManager.ts` — centralised font, spritesheet, and audio loading
- [ ] Create global spritesheet atlas system for shared sprites across games
- [ ] Fix save system crash (incomplete GameSaveData fallback in `unlockAchievement`)
- [ ] Redesign game card portal (larger cards, ASCII art titles, Instructions/High Scores buttons)
- [ ] Redesign GLOBAL CONTROLS (compact bar, keyboard icon toggle)
- [ ] Add ASCII art generator/renderer for game titles
- [ ] Update landing page UX (larger cards, less empty space, better visual hierarchy)

---

## Phase 3: Phaser Game Rebuilds (React → Phaser)

Each rebuild follows standard Phaser structure: `index.tsx`, `config.ts`, `scenes/{Boot,Menu,Game,GameOver}Scene.ts`. All use `BaseScene`, `exposeTestState()`, and the global asset system.

### Priority Order

1. **Vortex Pong** — Simplest rebuild (keep design, just port). Proves the pipeline.
2. **Snake Classic** — Medium complexity, 3-mode system adds depth.
3. **Matrix Cloud** — Full redesign with proper Flappy Bird physics.
4. **Matrix Invaders** — Complex (waves, pooling, bullet time) but huge Phaser gains.
5. **Metris** — SRS rotation system needs careful porting.
6. **CTRL-S | The World** — Largest, most ambitious. Citizen Sleeper-inspired narrative engine.

### Per-Game Build Checklist (repeat for each)

- [ ] Create Phaser game directory structure
- [ ] Implement BootScene (load sprites from asset system)
- [ ] Implement MenuScene (ASCII art title, matrix rain, controls)
- [ ] Implement GameScene (core gameplay from research doc)
- [ ] Implement GameOverScene (score, high score, restart)
- [ ] Add achievements (minimum 8 per game)
- [ ] Add test seams (`exposeTestState()`)
- [ ] Write unit tests (minimum 40 per game)
- [ ] Write E2E gameplay tests (minimum 6 per game)
- [ ] Register in game registry
- [ ] Play-test 5 full games
- [ ] Remove old React/Canvas component

---

## Phase 4: Existing Phaser Game Fixes

Apply fixes from `rebuildingoldgames/bugs.md`:

- [ ] Matrix Frogger: Start line, countdown, finish line, Kung Fu, NEO mode, road markings
- [ ] Neo Jump: Fix jetpack, instant death on fall, custom sprites, Doodle Jump UX
- [ ] Agent Chase: Fix agent AI, auto-turn on wall, multiple map layouts
- [ ] Rhythm Hacker: Music sync, QW OP keys, 5s countdown, visual improvements
- [ ] Cloud Jumper: Fix jump (critical — currently unplayable)

---

## Phase 5: New Game — Code Breaker

- [ ] Design doc and architecture (from Phase 1.4 research)
- [ ] Implement as Phaser game
- [ ] 6 power-ups, boss bricks, Agent Smith enemies, portal win
- [ ] 10 achievements
- [ ] Full test coverage

---

## Phase 6: Polish & Final Testing

- [ ] Full E2E gameplay suite against all rebuilt games
- [ ] Visual regression tests for new Phaser games
- [ ] Performance profiling (60fps on all games)
- [ ] Accessibility audit
- [ ] PWA cache invalidation for new chunks
- [ ] Documentation update

---

## Architecture Notes

### Three.js Matrix Rain (planned)

Replace CSS matrix rain with Three.js for smooth 3D effect:
- React component rendered behind game content
- Instanced geometry for performance
- Depth-of-field (characters blur as they fall deeper)
- Responds to game events (rain speeds up during gameplay, slows on menu)

### Global Asset System (planned)

```
src/lib/assets/
├── AssetManager.ts      # Centralised loading and caching
├── fonts.ts             # Font registry (Press Start 2P, pixel fonts)
├── spritesheets.ts      # Atlas definitions for shared sprites
└── audio.ts             # Music tracks and SFX library
```

### Phaser Game Standard Structure

```
src/components/games/phaser/[GameName]/
├── index.tsx            # React wrapper (PhaserGame)
├── config.ts            # Phaser config, constants, achievement IDs
└── scenes/
    ├── BootScene.ts     # Load assets from global system
    ├── MenuScene.ts     # ASCII art title, matrix rain, controls
    ├── GameScene.ts     # Core gameplay (extends BaseScene)
    └── GameOverScene.ts # Score, high score, restart
```

### Required Keyboard Controls (all games)

| Key | Action | Required |
|-----|--------|----------|
| ESC | Exit to menu | Yes |
| P | Pause/resume | Yes |
| R | Restart | Yes |
| ENTER/SPACE | Start game | Yes |
| Arrow keys | Primary movement | Yes |
| WASD | Alt movement | Recommended |
| M | Toggle mute | Recommended |

---

## Ralph Loop Strategy

1. **Phase 1 first**: Create ALL research docs before writing any game code
2. Use `/matrix-arcade-gamedev` for game code, `/frontend-design` for UI/UX, `/phaser-gamedev` for Phaser scenes
3. Run `game-tester` agent after every code change
4. Each iteration: research one item OR implement one item, verify build, check the checkbox
5. Reference images in `rebuildingoldgames/inspirationimagesandsprites/` for every design decision
