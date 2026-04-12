# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

---

## Current Status

- **Status**: REBUILDING -- Phaser migration complete, asset pipeline bootstrapped, per-game sprite integration in progress, Rhythm Hacker music integrated
- **Last Updated**: 12 April 2026 (R23 -- Matrix Cloud bird sprite integration)
- **Version**: v2.0.0 (next target)
- **Games**: 12 playable (11 Phaser, 1 DOM)
- **Build**: PASSES (code-split, main bundle ~372KB, Phaser vendor chunk 1,479KB) -- zero warnings
- **Unit Tests**: 2,051 passing across 46 files, 0 failures
- **E2E Tests**: 88 gameplay + 110 visual = 198 tests across 28 spec files -- last run PASSED (new screeenshots in TheMatrixArcade-/e2e, user manually ran the playwright test. 
- **Asset Pipeline**: Phase 0a COMPLETE -- `public/assets/` deployed with fonts, audio, UI chrome, particles, icons (117 files, ~40MB)

### Completed Work Summary

All P0/P1/P2 bugs resolved across R1-R14 (12 April 2026). Key milestones:

- **Phaser migration** (R9-R14): All 6 React/Canvas games rebuilt as Phaser 3 games (Vortex Pong, Snake Classic, Matrix Cloud, Matrix Invaders, Metris, Code Breaker). Each has full scene architecture, procedural textures, comprehensive unit tests (63-134 tests each), and achievement integration.
- **New game** (R14): Code Breaker -- Breakout/Arkanoid inspired, 10 levels, 6 power-ups, boss battles, Agent Smith enemies, 10 achievements.
- **Existing Phaser fixes** (R3-R8): All 5 original Phaser games fixed -- controls, physics, AI, visuals. Matrix Frogger received 7 gameplay enhancements (countdown, levels, Kung Fu, NEO mode, road markings, chasing agents, lane visuals). Rhythm Hacker overhauled (new key bindings, layout, note sprites, Matrix palette). Cloud Jumper palette and dimensions fixed.
- **Infrastructure** (R1-R5): Code-splitting (2.18MB → 370KB), Phaser vendor chunk, shared game registry, error boundaries, E2E framework (188 tests).
- **R15 cleanup**: Removed 9 orphaned legacy React game files, 4 unused hooks, 1 dead Zustand store, and 13 associated test files (11,386 lines of dead production code + ~5,000 lines of dead tests). Updated sound system comments from legacy game names. Test count: 2,521 → 2,019 (502 tests were testing only dead code).
- **R16 Agent Chase map layouts**: Three distinct maze layouts (Classic, Arena, Labyrinth) cycle each level. Shared ghost house section (rows 9-19) keeps agent AI consistent. Difficulty scaling: agent speed increases 5% per level, frightened duration decreases 500ms per level (min 3s). New ALL_MAZES achievement for playing all three layouts. 20 new unit tests (96 total for Agent Chase).
- **R17 Focus overlay fix + CTRL-S World E2E**: Fixed "floating dark rectangle" bug caused by PhaserGame.tsx click-to-play overlay rendering before auto-focus resolved — overlay now deferred until container has had focus at least once. Added 10 gameplay E2E tests for CTRL-S World covering command prompt entry, chapter navigation, story advancement, pause/resume, keyboard shortcuts, and full lifecycle.
- **R19 Code Breaker brick sprite integration**: First per-game asset integration. Copied 4 brick sprites (code, agent, sentinel, unbreakable) from BBreaker asset pack to `public/assets/code-breaker/`. Updated BootScene to load sprites in preload with procedural texture fallbacks. Changed GameScene brick rendering from `Phaser.GameObjects.Rectangle` to `Phaser.GameObjects.Image` with `setDisplaySize()`. Fixed circular dependency TDZ crash in both BootScene and GameScene by removing module-level `const C = GAME_CONFIG` aliases (deferred to runtime access). All 127 unit tests pass.
- **R20 Matrix Frogger vehicle sprite integration**: Second per-game asset integration. Copied 5 vehicle sprites (car1, car2, car3, truck, tractor) plus 2 flower ground tiles and frog sprites from frogger INSPO pack to `public/assets/matrix-frogger/`. Updated BootScene to load vehicle sprites with procedural rectangle fallbacks. Changed GameScene road lane rendering: bottom lanes (rows 5-7) now spawn pixel art vehicle sprites instead of Matrix agent textures, creating a gameplay progression from traffic to Matrix agents. Vehicles are 16x16 pixel art scaled 3x with pixelArt mode. Upper lanes (rows 1-3) retain agent/sentinel sprites. All 70 unit tests pass, 2,039 total.
- **R21 Agent Chase roguelike sprite integration**: Third per-game asset integration. Extracted 7 sprites from 32rogues pixel art pack (rogues.png, monsters.png, tiles.png) using sips: player (rogue), 4 agents (death knight, reaper, lich, zombie), frightened state (small slime), wall tile (stone brick). Deployed to `public/assets/agent-chase/`. Updated BootScene with `loadCommonAssets()` override, `resizeLoadedSprite()` canvas-based downscaling to match game dimensions (32→18/20px), and `textures.exists()` fallback checks. Updated GameScene `updatePlayerRotation()` to use flipX in sprite mode vs angle rotation for procedural Pac-Man. All 96 unit tests pass, 2,039 total.
- **R22 Rhythm Hacker music integration**: Installed ffmpeg via Homebrew (unblocking WAV→MP3 conversion). Converted 5 music tracks from WAV to MP3 at 192kbps with loudnorm normalisation: In The Moonlight (easy, 120s), Cyberpunkin' (normal, 150s), Cyberpsychotic (hard, 150s), Enhancements (insane, 200s), Resonance (insane, 180s). Deployed to `public/assets/rhythm-hacker/tracks/`. Also converted 3 additional global music tracks (cruise-control, a-last-embrace, ostcrunch2-epic) to `public/assets/audio/music/`. Updated config.ts with real track names, BPMs, durations, and audioUrl paths. Integrated HTML5 Audio playback into GameScene: music starts after countdown, pauses/resumes with game, stops on game over/track complete, respects mute state. Added togglePause override for audio sync. 8 new unit tests (58 total for Rhythm Hacker). All 2,047 tests pass. Build clean.
- **R18 Global asset extraction + font integration**: Bootstrapped `public/assets/` from zero. Extracted 3 font families from ZIP archives (MatrixType 4 variants WOFF2+TTF, AlphaProta 2 variants WOFF2+TTF, 5 NotJam pixel fonts). Deployed 4 music tracks (MP3), 20 Matrix Trilogy SFX (WAV), hologram UI chrome (4 buttons, 5 card panels, 15 icons), 25 Matrix node icons (green+purple, PNG+WEBP+GIF), 21 firework particle frames (3 colours × 7 frames). Added `@font-face` declarations for all custom fonts with WOFF2→TTF fallback chain. Created 5 new CSS variables (`--matrix-font-title`, `--matrix-font-matrix`, `--matrix-font-cyber`, `--matrix-font-pixel`, `--matrix-font-hud`). Applied MatrixType Display to arcade title in App.tsx and LandingPage.tsx. Updated global ASSETS_NEEDED.md with deployment status. Total: 117 files, ~40MB. Blocker: WAV music tracks (7 files, ~280MB total) need ffmpeg for OGG/MP3 conversion.
- **R23 Matrix Cloud bird sprite integration**: Extracted green bird sprite (4 frames, 16×16 pixel art) from Flappy Bird Assets pack, plus green pipe and pipe-cap sprites. Deployed to `public/assets/matrix-cloud/`. Updated BootScene with `loadCommonAssets()` override to load bird spritesheet, creates `bird_flap` animation (4 frames at 10fps), sets `spriteMode` registry flag. GameScene `createPlayer()` uses animated bird sprite with `setDisplaySize()` scaling when available, procedural fallback when not. `updatePlayerTexture()` uses tint-based state changes (red=damaged, magenta=shield) in sprite mode vs texture-swap in fallback mode. 4 new unit tests (85 total for Matrix Cloud). All 2,051 tests pass.

Full details in git history (`git log --oneline`).

---

## Priority Legend

- **P0**: Critical/blocking -- games unplayable, users cannot interact
- **P1**: High -- bugs that degrade experience, failing tests
- **P2**: Medium -- infrastructure, UX improvements, research
- **P3**: Low -- rebuilds, new features, polish

---

## P0 -- All Resolved ✅

All P0 items fixed in R3 (Phaser controls, Cloud Jumper jump physics, Neo Jump jetpack, Agent Chase AI).

## P1 -- All Resolved ✅

All 12 P1 items fixed in R4-R5 (Metris bullet time, Matrix Cloud combo, CTRL-S save crash, SimpleSnake achievements, mute divergence, App.tsx coupling, Rhythm Hacker countdown, double gameOver sound, GameOverScene keyboard UX, useInterval OOM, build chunk warning, unit test failures).

---

## P2 -- Medium Priority: Remaining Items

### 2.1 Rhythm Hacker Improvements

**File**: `src/components/games/phaser/RhythmHacker/scenes/GameScene.ts`
- [x] Music tracks integrated (5 tracks with HTML5 Audio playback, BPM-synced procedural notes)
- [ ] Sync gameplay to backing music track (currently procedurally generated notes). 5+ WAV tracks available in asset dump.
- [ ] Improve visuals and animations (currently 100% procedural -- 28 textures auto-generated)

### 2.3 Visual & UX Observations from Screenshots

**Shared issues across Phaser games**:
- **Identical menu thumbnails**: Cloud Jumper, Neo Jump, and Agent Chase all share the same Matrix city/rain thumbnail image. These should be differentiated.
- **All games use 100% procedural textures** -- no external sprite assets loaded. Every visual element is generated in BootScene at runtime.
- **Game-over screens**: Generic across all games (shared GameOverScene with no game-specific context beyond the `reason` string).

### 2.5 Matrix Frogger Visual Issues ✅

- [x] Fix unrendered floating UI box -- root cause: PhaserGame.tsx click-to-play overlay (`rgba(0,0,0,0.5)`) rendered before auto-focus resolved. Fixed in R17 by deferring overlay until container has had focus at least once.

### 2.6 Codebase Cleanup

- [x] **Remove orphaned legacy React games** (done R15 -- AgentEscape, CrossyRoad, JimmyMatrix, MatrixAscension + old React versions of 5 Phaser games)
- [x] **Remove unused hooks** (done R15 -- useProceduralAudio, useViewportCulling, useInterval, useSimpleSnakeGame)
- [x] **Remove dead Zustand store** (done R15 -- src/store/gameStore.ts)
- [x] **Add CTRL-S World gameplay E2E**: 10 tests covering command prompt, chapter hub, story advance, pause/resume, keyboard shortcuts, restart, ESC navigation, and full lifecycle (done R17).

---

## Phase 0: Asset Pipeline (pre-requisite for polished visuals)

The `desiredassets/` folder contains a complete asset inventory with source mappings. The unsorted dump (`desiredassets/TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/`, ~4,900 files, ~750MB) has been catalogued and cross-referenced against every game's `ASSETS_NEEDED.md`. Currently **zero game assets are deployed** -- `public/assets/` doesn't exist. All games use procedural textures from BootScene.

**Asset Inventory Summary** (across all 13 ASSETS_NEEDED.md files):

| Game / Scope | [x] Have | [~] Sourced | [ ] Need | Total | Notes |
|---|---|---|---|---|---|
| global | 2 | 22 | 1 | 25 | Fonts + UI chrome + shared SFX |
| snake | 7 | 14 | 14 | 35 | Power-up icons + bosses need creating |
| vortex-pong | 8 | 14 | 6 | 28 | Close to ready with good [x] base |
| matrix-cloud | 8 | 16 | 11 | 35 | 3 boss sprites need creating from scratch |
| matrix-invaders | 14 | 18 | 11 | 43 | Strong foundation, boss + effects need work |
| metris | 3 | 17 | 17 | 37 | Largest scratch gap (all VFX + grid/playfield) |
| ctrl-s-world | 1 | ~53 | 0 | ~54 | 100% extractable, zero scratch |
| matrix-frogger | 9 | 17 | 4 | 30 | Most complete asset set (sprites + audio WAVs) |
| neo-jump | 2 | ~31 | 0 | ~33 | 100% extractable, Doodle RPG pack (406 sprites) |
| agent-chase | 7 | 20 | 8 | 35 | Player sprite is entirely [ ] (no source) |
| rhythm-hacker | 4 | 15 | 17+5 | ~41 | 5 note chart data files are critical blocker |
| cloud-jumper | 3 | 23 | 7 | 33 | Cloudy Pack (190+ files) covers most cloud needs |
| code-breaker | 14 | 41 | 5 | 60 | Strongest [x] base, almost pipeline-ready |
| **TOTALS** | **~82** | **~301** | **~106** | **~489** | 62% sourced, 21% scratch, 17% ready |

**Pipeline-ready games** (zero scratch items): ctrl-s-world (~53 extractable), neo-jump (~31 extractable).
**Critical blockers**: Rhythm Hacker note charts (5 JSON files). Agent Chase player sprite (no source). Matrix Cloud bosses (3 need creating from scratch).
**Strongest foundations**: Code Breaker (14 [x], 41 [~]), Matrix Invaders (14 [x], 18 [~]), Matrix Frogger (9 [x] + complete WAV audio set).

### 0a. Global Asset Extraction ✅ COMPLETE (R18)

- [x] Unzip `MatrixArcadeFontAssets/` (3 ZIPs) -- MatrixType (4 WOFF2 + 4 TTF), AlphaProta (2 WOFF2 + 2 TTF), PixelFont (bitmap PNGs only, no TTF)
- [x] Unzip `WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip` -- 20 game-relevant SFX selected, renamed to `sfx_*.wav` convention
- [x] Copy MP3 music tracks: menu-theme, stage-theme, boss-theme, brothers-and-sisters
- [x] Extract `1. Free Hologram Interface Wenrexa/` -- 4 button states, 5 card/panel variants, 15 icons
- [x] Pick 4 best font families from `NotJamFontPack/` -- Sci Mono, Mono Clean, UI, Pixel 5, Chunky Sans
- [x] Copy `firework/` particles -- 3 colours × 7 frames = 21 PNGs
- [x] Copy `Matrix-Icons/` (already extracted) -- 5 green + 5 purple node icons in PNG/WEBP/GIF
- [x] WAV music tracks converted to MP3 via ffmpeg (installed via Homebrew in R22). 5 rhythm tracks + 3 global tracks deployed.
- [ ] ⚠️ **REMAINING**: Background textures, sci-fi UI panels, additional icon packs (still in ZIPs)

### 0b. Per-Game Asset Extraction (parallel with game fixes)

Each game's `desiredassets/[game]/ASSETS_NEEDED.md` has a Source Mapping section. Work through `[~]` items:

- [x] **Rhythm Hacker** music tracks: 5 WAV→MP3 conversions deployed, audio playback integrated into GameScene. Remaining: hand-crafted note charts for per-beat sync (currently BPM-based procedural), visual sprite upgrades.
- [ ] **CTRL-S | The World**: Extract character bases from Mana Seed + Kings and Pigs, create portraits, backgrounds from CyberPunk/scifi packs. ~50 `[~]` items.
- [ ] **Snake Classic**: Extract snake sprites from INSPO + CyberPunk character anims, recolour.
- [ ] **Vortex Pong**: Extract pong assets from INSPO + firework particles for trails.
- [x] **Matrix Cloud** bird sprite: Green bird (4 frames) from Flappy Bird Assets pack deployed with animation. Remaining: pipe sprites, background, 3 boss sprites (scratch), power-up icons.
- [ ] **Matrix Invaders**: Extract robot enemies from TopView_Robot_Asset_Pack + laser sprites.
- [ ] **Metris**: Extract tetris tiles from INSPO (4 variants available) + UI panels.
- [x] **Matrix Frogger**: Vehicle sprites integrated (5 types: car1, car2, car3, truck, tractor). Remaining: frog death animation, environment tiles, power-up icons, WAV audio integration.
- [ ] **Neo Jump**: Process Doodle RPG pack from INSPO (406 sprites).
- [x] **Agent Chase**: Player (rogue), 4 agent monsters, frightened slime, wall brick sprites integrated from 32rogues pack. Remaining: agent death animation, fruit icons, audio SFX.
- [x] **Cloud Jumper**: 4 cloud sprites (wide, compact, small, peak) deployed with per-type tinting and display-size physics bodies. Remaining: player sprite, collectible sprites, obstacle sprites, background layers.
- [x] **Code Breaker**: Brick sprites integrated (4 types: code, agent, sentinel, unbreakable). Remaining: laser sprites, paddle sprites, agent enemies, power-up icons, portal.

### 0c. Asset Integration Pattern

For each game, the pipeline is:
1. Extract raw assets from dump to `desiredassets/[game]/raw/`
2. Process (recolour, resize, atlas-pack) to `desiredassets/[game]/processed/`
3. Copy final assets to `public/assets/[game]/`
4. Update BootScene to load from new paths
5. Mark `[~]` to `[x]` in ASSETS_NEEDED.md

---

## Phase 1: Research & Planning ✅ COMPLETE

12 of 12 research docs created in `rebuildingoldgames/plans/`. All game rebuilds researched.

### 1.1 Global Infrastructure Research (remaining)

- [ ] **Three.js Matrix Rain Background** -- Replace CSS matrix rain with smooth 3D Three.js implementation.
- [ ] **Global Asset System** -- Design unified font, spritesheet, and audio management in `src/lib/assets/`.
- [ ] **Game Card Portal Redesign** -- Larger game cards (see `gamecardlayout.png`), Instructions/High Scores buttons, ASCII art titles.
- [ ] **Global Controls UX Redesign** -- Compact into a sleek bar or hide behind a keyboard icon toggle.

---

## Phase 2: Global Infrastructure Build

- [ ] Implement Three.js matrix rain background (replaces CSS animation)
- [ ] Create `src/lib/assets/AssetManager.ts` -- centralised font, spritesheet, and audio loading
- [ ] Create global spritesheet atlas system for shared sprites across games
- [ ] Redesign game card portal (larger cards, ASCII art titles, Instructions/High Scores buttons)
- [ ] Redesign GLOBAL CONTROLS (compact bar, keyboard icon toggle)
- [ ] Add ASCII art generator/renderer for game titles
- [ ] Update landing page UX (larger cards, less empty space, better visual hierarchy)

---

## Phase 3: Phaser Game Rebuilds ✅ COMPLETE (5/6)

Vortex Pong (R9), Snake Classic (R10), Matrix Cloud (R11), Matrix Invaders (R12), Metris (R13) all rebuilt as Phaser games with comprehensive unit tests.

### Remaining

- [ ] **CTRL-S | The World** -- Citizen Sleeper-inspired narrative engine rebuild (largest, most ambitious).

---

## Phase 4: Game Enhancements

- [x] Agent Chase: Multiple map layouts (Classic/Arena/Labyrinth cycling per level, difficulty scaling) -- done R16
- [ ] Neo Jump: Custom sprites, Doodle Jump UX polish
- [ ] Rhythm Hacker: Music sync + visual improvements (see P2 2.1)

---

## Phase 5: New Game -- Code Breaker ✅ COMPLETE

Built in R14. Breakout/Arkanoid inspired, 10 levels, 6 power-ups, boss battles, 127 unit tests.

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

### Phaser Input Pattern (MUST follow)

All scenes that register keyboard input must handle the case where `this.input.keyboard` is not yet ready:

```typescript
protected setupInput(): void {
  if (!this.input.keyboard) {
    this.time.delayedCall(100, () => this.setupInput());
    return;
  }
  // ... register keys
}
```

### Physics Pattern (from phaser-gamedev skill)

- Use `body.blocked.down` (not `body.touching.down`) for grounded checks
- Reset velocity to zero each frame before applying directional input
- Static bodies require `refreshBody()` after positional change
- All movement MUST use delta: `this.player.x += this.speed * (delta / 1000);`
- **Spritesheet loading**: Always measure frame dimensions from the actual image before loading

### Sound Integration Pattern

Phaser games use React-side sound via the registry bridge:
- Scenes call `this.playSound(key)` which reads `SOUND_SYSTEM` from registry
- PhaserGame.tsx provides `useSoundSystem().playSFX` via registry
- Phaser's built-in audio system is NOT used

### Phaser Game Standard Structure

```
src/components/games/phaser/[GameName]/
  index.tsx            # React wrapper (PhaserGame)
  config.ts            # Phaser config, constants, achievement IDs
  scenes/
    BootScene.ts       # Load assets (procedural textures or from asset system)
    MenuScene.ts       # Title screen, controls (extends shared MenuScene)
    GameScene.ts       # Core gameplay (extends BaseScene)
    GameOverScene.ts   # Score, high score, restart (extends shared GameOverScene)
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

## Test Coverage Status

| Game | Type | Unit Test | E2E Visual | E2E Gameplay |
|------|------|-----------|------------|--------------|
| CtrlSWorld | DOM | Yes | Yes | Yes |
| SnakeClassic | Phaser | Yes | Yes | Yes |
| VortexPong | Phaser | Yes | Yes | Yes |
| MatrixCloud | Phaser | Yes | Yes | Yes |
| MatrixInvaders | Phaser | Yes | Yes | Yes |
| Metris | Phaser | Yes | Yes | Yes |
| MatrixFrogger | Phaser | Yes | Yes | Yes |
| NeoJump | Phaser | Yes | Yes | Yes |
| AgentChase | Phaser | Yes | Yes | Yes |
| RhythmHacker | Phaser | Yes | Yes | Yes |
| CloudJumper | Phaser | Yes | Yes | Yes |
| CodeBreaker | Phaser | Yes | Yes | Yes |

All Phaser games expose test state via `exposeTestState()`. E2E fixtures support both React and Phaser games.

### Gaps
- None — all 12 games have unit, visual, and gameplay E2E coverage

---

## Current Codebase Health

### Strengths
- Zero TODO/FIXME/HACK comments in src/
- Zero `@ts-ignore` in production code
- TypeScript strict mode fully enabled (noUnusedLocals, noUnusedParameters)
- All 11 Phaser games expose test state via `exposeTestState()`
- 12 games total, 100% achievement integration
- Clean separation of concerns: React wrapper + Phaser scenes via registry pattern
- Single source of truth: GAME_REGISTRY in `src/data/gameRegistry.ts`
- Code-split lazy loading for all game components
- No orphaned legacy code (cleaned up in R15)

### Gaps
- Most games still use procedural textures -- Code Breaker has brick sprites, Matrix Frogger has vehicle sprites, Agent Chase has roguelike sprites, Matrix Cloud has bird sprite, Rhythm Hacker has music tracks, but remaining 7 games are fully procedural
- Rhythm Hacker BPM values are estimates — may need tuning per track after playtesting
- `useAdvancedVoice` AudioContext for visualisation never connected to speech output (always returns zeros)

---

## Ralph Loop Strategy

1. **Phase 0b**: Per-game asset extraction (sprites, audio per game) -- biggest remaining effort
2. **Phase 2**: Global infrastructure (Three.js rain, AssetManager, game card redesign) -- now unblocked by font deployment
3. **P2 remaining**: Rhythm Hacker music sync (needs MP3 music tracks), visual improvements
4. **Phase 3.6**: CTRL-S World narrative engine rebuild
5. **Phase 4**: Game enhancements (Neo Jump UX -- Agent Chase maps done R16)
6. **Phase 6**: Final polish and testing pass
7. Use `/matrix-arcade-gamedev` for game code, `/phaser-gamedev` for Phaser scenes, `/playwright-testing` for E2E
8. Run `game-tester` agent after every code change
9. ffmpeg installed via Homebrew (R22) — WAV conversion unblocked
