# Completed Work — The Matrix Arcade (R1–R50)

Archived from `IMPLEMENTATION_PLAN.md` on 2026-04-13. This file is the durable record of everything Ralph completed across the planning/build loops. The live plan now tracks only open work.

---

## R50 — Playwright Test Suite Bulk-Up (2026-04-13)

Full write-up in [`PLAYWRIGHT_BULKUP.md`](PLAYWRIGHT_BULKUP.md). Summary:

- **43/43 specs passing** in ~4m 12s (1 worker × Chromium × 1280×800).
- **~91 committed baselines** = 72 game (6 checkpoints × 12 games) + 19 UI/chrome.
- **Deterministic test seam** added: `src/lib/test-mode.ts` activated via `?test=1&seed=N`. Seeds `Math.random` (mulberry32), disables animated Matrix rain, zero runtime cost when flag absent.
- **Ready markers** published from app: `body[data-landing-ready|-portal-ready|-portal-game-id|-portal-is-playing|-game-ready]`, `window.__PHASER_GAME_STATE__.scene`, `window.__CTRLS_STATE__`.
- **Visual regression now real**: replaced inert `takeScreenshot()` helper with `expect(page).toHaveScreenshot()` across every visual spec.
- **Fixture hardening**: per-test console-error guard (any `pageerror` / `console.error` fails), fresh localStorage via `?test=1&seed=42`.
- **Legacy cleanup**: deleted 13 stale `e2e/gameplay/*.spec.ts` + 12 `e2e/visual/games/*.spec.ts`; replaced with 12 unified `e2e/playthrough/<game>.spec.ts` driven by shared `runPlaythrough()`.
- **Source seams** (all no-op in prod): `BaseScene`, `MenuScene`, `GameOverScene`, `MatrixRainCanvas`, `LandingPage`, `CtrlSWorld`, `App.tsx`, `main.tsx`.
- **Viewport fix**: 1920×1080 → 1280×800 (portal was lost in black margins at the old size).
- **Open items carried to live plan**: Docker baseline regen for CI parity, multi-viewport matrix, per-game keyboard-only a11y, performance budgets.

---

## Frozen Status Snapshot (as of 2026-04-13)

- **Status**: POLISHED — all 12 games playable, all Phaser migrations complete, all P0/P1/P2 resolved, full E2E coverage (213 tests), WCAG 2.1 AA accessibility audit done, PWA caching complete.
- **Last Verified**: 13 April 2026 (R49 — sanity check: 2,109 unit tests pass, 0 lint errors, build OK, no regressions)
- **Last Updated**: 13 April 2026 (R48 — PWA build fix)
- **Version**: v2.0.0 (next target)
- **Games**: 12 playable (11 Phaser, 1 DOM)
- **Build**: PASSES (code-split, main bundle ~385KB, Phaser vendor chunk 1,479KB) — zero lint errors
- **Unit Tests**: 2,109 passing across 49 files, 0 failures
- **E2E Tests**: 94 gameplay + 119 visual = 213 tests across 30 spec files (Code Breaker coverage added R44)
- **Asset Pipeline**: Phase 0a COMPLETE — `public/assets/` deployed with fonts, audio, UI chrome, particles, icons (117 files, ~40MB)

---

## Completed Work Summary (R1–R48)

All P0/P1/P2 bugs resolved across R1-R14 (12 April 2026). Key milestones:

- **Phaser migration** (R9-R14): All 6 React/Canvas games rebuilt as Phaser 3 games (Vortex Pong, Snake Classic, Matrix Cloud, Matrix Invaders, Metris, Code Breaker). Each has full scene architecture, procedural textures, comprehensive unit tests (63-134 tests each), and achievement integration.
- **New game** (R14): Code Breaker — Breakout/Arkanoid inspired, 10 levels, 6 power-ups, boss battles, Agent Smith enemies, 10 achievements.
- **Existing Phaser fixes** (R3-R8): All 5 original Phaser games fixed — controls, physics, AI, visuals. Matrix Frogger received 7 gameplay enhancements (countdown, levels, Kung Fu, NEO mode, road markings, chasing agents, lane visuals). Rhythm Hacker overhauled (new key bindings, layout, note sprites, Matrix palette). Cloud Jumper palette and dimensions fixed.
- **Infrastructure** (R1-R5): Code-splitting (2.18MB → 370KB), Phaser vendor chunk, shared game registry, error boundaries, E2E framework (188 tests).
- **R15 cleanup**: Removed 9 orphaned legacy React game files, 4 unused hooks, 1 dead Zustand store, and 13 associated test files (11,386 lines of dead production code + ~5,000 lines of dead tests). Updated sound system comments from legacy game names. Test count: 2,521 → 2,019 (502 tests were testing only dead code).
- **R16 Agent Chase map layouts**: Three distinct maze layouts (Classic, Arena, Labyrinth) cycle each level. Shared ghost house section (rows 9-19) keeps agent AI consistent. Difficulty scaling: agent speed increases 5% per level, frightened duration decreases 500ms per level (min 3s). New ALL_MAZES achievement for playing all three layouts. 20 new unit tests (96 total for Agent Chase).
- **R17-R31**: Sprite integration across all games (Code Breaker bricks/paddle/ball/power-ups, Matrix Frogger vehicles/frog/flowers/fly, Agent Chase roguelike+fruits, Matrix Cloud bird, Snake Classic tail+dead, Cloud Jumper player, Matrix Invaders bullets, Neo Jump player/platforms/enemies/collectibles, Vortex Pong paddles/ball/board/fireball), real gameplay screenshots replacing SVG placeholders, focus overlay fix, CTRL-S World E2E tests, Rhythm Hacker music integration, global asset extraction (fonts/SFX/UI chrome/particles). Neo Jump collectibles, jetpack, and shield mechanics.
- **R32-R36**: Game portal UX (Instructions/High Scores modals, ASCII art titles, landing page redesign), Metris tile sprite rendering rewrite (Graphics→Image pool architecture), Vortex Pong sprite integration.
- **R37-R40**: Audio system upgrade (file-based SFX with procedural fallback), background music for all 11 Phaser games, Rhythm Hacker beat-locked charts (D/F/J/K controls), visual overhaul (diamond notes, highway grid, combo glow).
- **R41-R43**: ASCII art block-letter titles, full-screen Matrix rain canvas (replacing 3 scattered implementations), per-game game-over stats grids.
- **R44**: Code Breaker E2E coverage (6 gameplay + 9 visual tests), fixed unused import lint error.
- **R45**: WCAG 2.1 AA accessibility fixes — text contrast, skip-to-content, ARIA attributes, prefers-reduced-motion, Phaser container role + keyboard-accessible overlay.
- **R46**: PWA cache improvements — extended precache to cover audio/images/JSON, runtime CacheFirst for large audio files, update prompt snooze-on-dismiss.
- **R39**: Playtest bug fixes — TDZ crashes (4 games), Agent Chase lives underflow, pause stacking on GameOver, Matrix Frogger asset errors, achievement toast setState-in-render.
- **R48**: Fixed PWA build failure — removed audio from precache glob (large MP3s exceeded 5MB limit), audio handled by runtime CacheFirst strategy instead.

Full details in `git log --oneline`.

---

## P0 / P1 / P2 — All Resolved

### P0 — Resolved (R3)
Phaser controls, Cloud Jumper jump physics, Neo Jump jetpack, Agent Chase AI.

### P1 — All 12 items resolved (R4–R5)
Metris bullet time, Matrix Cloud combo, CTRL-S save crash, SimpleSnake achievements, mute divergence, App.tsx coupling, Rhythm Hacker countdown, double gameOver sound, GameOverScene keyboard UX, useInterval OOM, build chunk warning, unit test failures.

### P2.1 Rhythm Hacker Improvements
- [x] Music tracks integrated (5 tracks with HTML5 Audio playback, BPM-synced procedural notes)
- [x] Sync gameplay to backing music track — beat-locked chart system with audio-time sync (R35). Lane keys changed from Q/W/O/P to D/F/J/K to fix P-key pause conflict.
- [x] Improve visuals and animations — R40: diamond note gems, highway grid, multi-layer hit line, lane dividers, star-burst effects, scrolling grid overlay, note approach scaling, combo glow, beat-reactive hit line

### P2.3 Visual & UX Observations from Screenshots
- [x] **Identical menu thumbnails**: Fixed in R30 — all 6 Phaser games now have distinct gameplay screenshots replacing SVG placeholders.
- [x] **Game-over screens**: Enhanced with per-game stats grid (R43) — each game now passes relevant gameplay statistics to the shared GameOverScene.

### P2.5 Matrix Frogger Visual Issues
- [x] Fix unrendered floating UI box — root cause: PhaserGame.tsx click-to-play overlay (`rgba(0,0,0,0.5)`) rendered before auto-focus resolved. Fixed in R17 by deferring overlay until container has had focus at least once.

### P2.7 Playtest Report Fixes (13 April 2026)
All bugs from PLAYTEST_REPORT_2026-04-13.md resolved in R39:
- [x] **B1**: TDZ crashes in Vortex Pong, Matrix Cloud, Matrix Invaders, Rhythm Hacker — deferred GAME_CONFIG access to runtime
- [x] **B2**: Agent Chase lives underflow to -2 — floor guard + respawn invulnerability
- [x] **Q2**: P-pause stacking on GameOver scene — allowPause flag in BaseScene
- [x] **Q1**: Matrix Frogger 4 asset load errors — removed missing sprite references, added procedural fallbacks
- [x] **Q3**: Achievement toast setState-in-render — separated state updates to avoid cross-component render-phase mutation

### P2.6 Codebase Cleanup
- [x] **Remove orphaned legacy React games** (done R15 — AgentEscape, CrossyRoad, JimmyMatrix, MatrixAscension + old React versions of 5 Phaser games)
- [x] **Remove unused hooks** (done R15 — useProceduralAudio, useViewportCulling, useInterval, useSimpleSnakeGame)
- [x] **Remove dead Zustand store** (done R15 — src/store/gameStore.ts)
- [x] **Add CTRL-S World gameplay E2E**: 10 tests covering command prompt, chapter hub, story advance, pause/resume, keyboard shortcuts, restart, ESC navigation, and full lifecycle (done R17).

---

## Phase 0a — Global Asset Extraction COMPLETE (R18)

- [x] Unzip `MatrixArcadeFontAssets/` (3 ZIPs) — MatrixType (4 WOFF2 + 4 TTF), AlphaProta (2 WOFF2 + 2 TTF), PixelFont (bitmap PNGs only, no TTF)
- [x] Unzip `WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip` — 20 game-relevant SFX selected, renamed to `sfx_*.wav` convention
- [x] Copy MP3 music tracks: menu-theme, stage-theme, boss-theme, brothers-and-sisters
- [x] Extract `1. Free Hologram Interface Wenrexa/` — 4 button states, 5 card/panel variants, 15 icons
- [x] Pick 4 best font families from `NotJamFontPack/` — Sci Mono, Mono Clean, UI, Pixel 5, Chunky Sans
- [x] Copy `firework/` particles — 3 colours × 7 frames = 21 PNGs
- [x] Copy `Matrix-Icons/` (already extracted) — 5 green + 5 purple node icons in PNG/WEBP/GIF
- [x] WAV music tracks converted to MP3 via ffmpeg (installed via Homebrew in R22). 5 rhythm tracks + 3 global tracks deployed.

---

## Phase 0b — Per-Game Asset Extraction (completed items)

### Rhythm Hacker
- [x] 5 WAV→MP3 music conversions deployed, audio playback integrated into GameScene. All 16 shared SFX keys mapped to pre-recorded Matrix Trilogy MP3 files via the upgraded useSoundSystem (R37) — file-based SFX with automatic procedural fallback.

### Snake Classic
- [x] Head, body, apple, dead, and tail sprites (32px) deployed with display-size scaling.

### Vortex Pong
- [x] Paddle sprites (player + AI, 17×120), ball (30×30), ball motion trail (46×46), board background (802×455), fireball frames (5 × 64×32) deployed. All recoloured to Matrix green via PIL. Paddles refactored from Rectangle to Image with setDisplaySize() scaling.

### Matrix Cloud
- [x] Green bird sprite (4 frames) from Flappy Bird Assets pack deployed with animation. Pipe sprites integrated as tiling textures.

### Matrix Invaders
- [x] Player and 4 enemy sprites (classic pixel art, recoloured to Matrix palette) deployed with display-size scaling and tint-based shield feedback. Bullet glow sprites integrated (green player, magenta enemy/boss) from laser sprite pack with display-size scaling.

### Metris
- [x] Rendering rewrite complete (R36) — refactored from Graphics.fillRect() to Image-pool architecture. 7 beveled tile sprites deployed. BootScene loads sprites with procedural fallback.

### Matrix Frogger
- [x] Vehicle sprites integrated (5 types: car1, car2, car3, truck, tractor). Frog player sprites (idle + hop, 16×16) replace robot player with `frogSpriteMode` flag and directional rotation. Flower ground tiles added to safe zones. Fly sprite added as animated finish line decoration.

### Neo Jump
- [x] Player character sprites (CyberPunk 24×24, 5 states), platform sprites (Doodle RPG tiles, 5 types), and enemy sprite (Bomba 71×79) integrated with `setDisplaySize` scaling and per-type tinting. Collectible sprites (fuel, score, shield from Doodle RPG Pickups) and jetpack flame particle deployed. Collectible pickup system with shield mechanic.

### Agent Chase
- [x] Player (rogue), 4 agent monsters, frightened slime, wall brick sprites integrated from 32rogues pack. Fruit collectible sprites (6 types) integrated from PacManAssets pixel art pack with canvas-based resizing to 20×20.

### Cloud Jumper
- [x] 4 cloud sprites (wide, compact, small, peak) deployed with per-type tinting and display-size physics bodies. Player character sprites (idle, jump, fall, 24×24 CyberPunk pixel art) integrated with `playerSpriteMode` flag.

### Code Breaker
- [x] Brick sprites integrated (4 types: code, agent, sentinel, unbreakable). Paddle sprites (normal + wide), ball sprite, and 6 power-up icons integrated with display-size scaling.

---

## Phase 1 — Research & Planning COMPLETE

12 of 12 research docs created in `rebuildingoldgames/plans/`. All game rebuilds researched.

### 1.1 Global Infrastructure Research (completed items)
- [x] **Matrix Rain Background** — Replaced CSS/canvas strips with full-screen Canvas 2D rain component (chose Canvas 2D over Three.js to avoid ~600KB dependency). Done R42.
- [x] **Game Card Portal Redesign** — Instructions/High Scores buttons (R32), ASCII art titles (R41). Landing page redesigned (R33).
- [x] **Global Controls UX Redesign** — Collapsible keyboard icon strip (R33).

---

## Phase 2 — Global Infrastructure Build (completed items)

- [x] Implement full-screen Matrix rain canvas background (replaces CSS animation) — done R42, Canvas 2D chosen over Three.js
- [x] Add Instructions/High Scores buttons to game card portal (done R32)
- [x] Redesign landing page grid (larger previews, cleaner cards, play overlay, collapsible controls, xl:grid-cols-4) — done R33
- [x] Redesign game card portal carousel (ASCII art titles, larger card) — done R41: ASCII art block-letter titles with green glow replace plain text titles
- [x] Add ASCII art generator/renderer for game titles — done R41: `src/lib/asciiArt.ts` with 5-row block font, variable-width glyphs, multi-line centring

---

## Phase 3 — Phaser Game Rebuilds COMPLETE

Vortex Pong (R9), Snake Classic (R10), Matrix Cloud (R11), Matrix Invaders (R12), Metris (R13) all rebuilt as Phaser games with comprehensive unit tests.

> Historical note: At time of archival, CTRL-S | The World was kept as a DOM/React game (text adventure / visual novel). This decision is **superseded** by the Phase 7 rewrite in `IMPLEMENTATION_PLAN.md`, which targets a Phaser rebuild with trimmed scope.

---

## Phase 4 — Game Enhancements COMPLETE

- [x] Agent Chase: Multiple map layouts (Classic/Arena/Labyrinth cycling per level, difficulty scaling) — done R16
- [x] Neo Jump: Custom sprites (R29), collectibles/jetpack/shield mechanics (R31), Doodle Jump UX polish
- [x] Rhythm Hacker: Beat-locked chart sync (R35), D/F/J/K controls (R35), diamond notes + highway visuals (R40)

---

## Phase 5 — New Game: Code Breaker COMPLETE

Built in R14. Breakout/Arkanoid inspired, 10 levels, 6 power-ups, boss battles, 127 unit tests.

---

## Phase 6 — Polish & Final Testing (completed items)

- [x] Full E2E gameplay suite against all 12 games — 94 gameplay tests across 13 spec files (Code Breaker added R44)
- [x] Visual regression tests for all Phaser games — 119 visual tests across 15 spec files (Code Breaker added R44)
- [x] Accessibility audit (R45) — Text contrast fixes (WCAG 1.4.3), skip-to-content link (2.4.1), ARIA attributes on buttons/filters (4.1.2), Phaser container role + keyboard-accessible overlay (2.1.1), aria-live mute announcements (4.1.3), prefers-reduced-motion media query (2.3.3).
- [x] PWA cache improvements (R46) — Extended precache glob to cover mp3/ogg/wav/jpg/webp/gif/json; added CacheFirst runtime caching for large audio files (>5MB) with range request support; update prompt snoozes on dismiss and re-appears after 2 minutes
- [x] Documentation update — AGENTS.md updated with E2E, PWA, and audio notes (R47)

---

## Asset Inventory Snapshot (as of archival)

The `desiredassets/` folder contains a complete asset inventory with source mappings. The unsorted dump (`desiredassets/TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/`, ~4,900 files, ~750MB) has been catalogued and cross-referenced against every game's `ASSETS_NEEDED.md`.

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
