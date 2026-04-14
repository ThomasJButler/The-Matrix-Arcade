# MAGIC DOC: [Completed Work — The Matrix Arcade (R1–R61)]

Archived from `IMPLEMENTATION_PLAN.md` on 2026-04-13. This file is the durable record of everything Ralph completed across the planning/build loops. The live plan now tracks only open work. Please reference this file and update this file with completed items, which in turn frees up context for the plan agent and build agents. They can easily referenece what was completed in more detail than git logs. 

---

## R61 — Deep Multi-Agent Audit (2026-04-13)

Planning-only round. 8 parallel research agents audited the full codebase against specs. Key outcomes:

**Resolved items confirmed:**
- **GAME_CONFIG TDZ crash** (Rhythm Hacker, Matrix Cloud, Vortex Pong) — already fixed in commit `ee18028`. Circular import caused module-level `const` reads to hit TDZ. Fix moved reads into method bodies / lazy singletons.

**New findings added to live plan:**
- **P0 Factor 6 (NEW)**: App.tsx global `preventDefault` on keydown may block Phaser events — guard doesn't account for `window`-targeted keyboard events.
- **P0 Factor 7 (NEW)**: MenuScene and GameOverScene have no `shutdown()` — ghost key handlers leak across scene transitions.
- **P1 Controls descriptions (EXPANDED)**: Full audit found 8 games with mismatches (3 HIGH, 2 MEDIUM, 3 LOW) vs original plan's 1 game.
- **P1 Console guards (RE-OPENED)**: 4 unguarded `console.warn`/`console.error` calls found in `useShatnerVoice`, `useAdvancedVoice`, `useLifelineManager` — R60 had incorrectly marked as fully resolved.
- **P2 Dead types**: `BaseSceneHelpers`, `PhaserGameConfig` interfaces never imported. `REGISTRY_KEYS.SAVE_SYSTEM` declared but never set. Metris uses wrong key string — save reads silently broken.
- **P2 Spec inconsistencies**: 9 gaps between phaser-games.md, game-architecture.md, and ux-guidelines.md documented.
- **Asset audit**: Full per-game deployment status with file counts. Audio is the biggest cross-cutting gap — only Matrix Frogger has any deployed.

No code changes. No files modified beyond IMPLEMENTATION_PLAN.md and COMPLETED_WORK.md.

---

## R58 — Playwright E2E Residue: A11y, Perf Budgets, Modal Coverage (2026-04-13)

Closes two Phase 6 Playwright residue items carried over from R50 and adds automated coverage for the Playtest Verification modals.

**New specs (22 tests, all green in isolation):**
- `e2e/a11y/keyboard-only.spec.ts` — per-game keyboard-only playthroughs: Tab through landing to locate `aria-label="Play <title>"`, Enter → portal, ArrowRight walks carousel to target game, Enter starts, assert `data-game-ready`, Escape exits. 12 games + 2 focus-visibility tests (outline or box-shadow present on focused card; `role="button"` + `tabIndex=0` + aria-label contract).
- `e2e/performance/budgets.spec.ts` — landing LCP < 10000ms via `PerformanceObserver('largest-contentful-paint')` attached before navigation through `addInitScript` (measured ~1.4s on laptop); Snake Classic FPS ≥ 25 over a 2s rAF-counted sample (measured ~119 FPS in isolation, ~72 under moderate parallelism). FPS test gated behind `PLAYWRIGHT_PERF=1` — too flaky under full-suite 5-worker parallelism where rAF scheduling competes across workers.
- `e2e/playthrough/modals.spec.ts` — H opens `GameHighScores` and Escape closes (keyed off `aria-label="Close high scores"` which is unique to the open modal); A opens `AchievementDisplay` and backdrop-click closes (no Escape handler wired for it); I opens `GameInstructions` and Escape closes; V toggles mute (asserts the Audio Settings button's class changes); settings button opens the AudioSettings panel with volume sliders. Plus a focus-restoration probe that currently logs `<BODY>` — documents the Phase 6 "focus traps on modals" gap without failing.

**Debugging iterations:**
- LCP test first hit `Execution context was destroyed` because the evaluate ran across the navigation boundary. Fix: use `addInitScript` so the PerformanceObserver registers in the fresh page context before first paint.
- Modal locators first collided with always-visible toolbar buttons (`getByText(/high scores/i)` matched the "View high scores" button, not the modal heading). Fix: key off the modal's close-button `aria-label` which only exists when the modal is open.
- `I` modal heading triggered strict-mode violation (3 matches — `h2 sr-only`, card `h3`, modal `h2`). Fix: use the same close-button aria-label pattern plus "Universal Keys" text which is unique to the instructions modal.

**Budgets rationale:** Sized to survive full-suite parallel load, not benchmark real hardware. In isolation LCP is ~1.4s and FPS is ~119 — both logged via `console.log` so regressions are visible even when assertions pass. If real regressions push past 10s LCP or below 25 FPS, something is seriously broken.

**Unrelated pre-existing flakes surfaced** (not regressions from R58, confirmed by rerunning in isolation):
- `e2e/visual/landing.spec.ts:40` — 1px height drift (297×288 baseline vs 297×287 actual) under parallel load, passes in isolation.
- `code-breaker` / `matrix-invaders` / `cloud-jumper` full playthroughs occasionally time out under heavy parallel load. All four pass cleanly when run alone. Captured as new Phase 6 residue item.

**Files created:**
- `e2e/a11y/keyboard-only.spec.ts`
- `e2e/performance/budgets.spec.ts`
- `e2e/playthrough/modals.spec.ts`

No source files modified. No config changes (multi-viewport was de-scoped for this round).

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

---

## R76 — Final Polish Phase

> **Completed**: 2026-04-14. Tom's full playtest confirmed R75 work; R76 closed all remaining polish items.

### R76 Gate Results
- Lint: 0 errors, 20 warnings (all pre-existing react-hooks/exhaustive-deps)
- Build: clean (7s)
- Unit tests: 1842/1842 pass
- TypeScript: 0 errors

### R76 Summary

#### Global Items (G1–G9)

~~G1 — [P0] No start menu on launch (all 12 games)~~ RESOLVED (R76.1)
- Changed `autoStart={true}` → `autoStart={false}` at both App.tsx GameComponent sites.

~~G2 — [P0] Global BGM (`matrixarcaderetrobeat.mp3`) overlaps per-game music~~ RESOLVED (R76.1)
- Replaced `playBackgroundMP3` on game entry with `stopBackgroundMP3`. Added `playBackgroundMP3` resume on all exit paths (ESC, exit button, onExit callback).

~~G3 — [P0] Achievements modal "crushes the page"~~ RESOLVED (R76.1)
- Changed `h-[90vh]` → `max-h-[90vh]`, added `flex flex-col` to modal container, `shrink-0` to header, `flex-1 min-h-0` to scrollable grid area.

~~G4 — [P1] Landing page grid card sizes inconsistent~~ RESOLVED (R76.1)
- Added `flex flex-col h-full` to card container, `flex-1` to description paragraph so all cards stretch to equal height.

~~G5 — [P1] Card layout — only PLAY button stands out~~ RESOLVED (R76.1)
- Bumped button contrast (bg-green-500/10, text-green-400), renamed buttons to "HOW TO PLAY" / "HIGH SCORE", improved keyboard hints formatting.

~~G6 — [P1] Pause/resume often fails to resume~~ RESOLVED (R76.8)
- Added `BaseScene.resumeGame()` that re-enables keyboard, re-focuses canvas, hides overlay, then calls `scene.resume()`.
- Root cause: `scene.pause()` suspends Phaser's input processing. Fix: replaced `scene.pause()`/`scene.resume()` with granular `physics.pause()`/`physics.resume()` + `tweens.pauseAll()`/`tweens.resumeAll()` + `time.paused`. Scene stays active so input listeners keep working.

~~G7 — [P2] New "About / Inspiration / Passion" tab~~ RESOLVED (R76.4)
- Created `src/components/About.tsx` with 3 sections (About, Inspirations, Why I Built This). Wired into header nav with B keyboard shortcut. Focus-trapped, ESC closes.

~~G8 — [P1] 5-second countdown before gameplay starts (all games)~~ RESOLVED (R76.1)
- Promoted countdown to `BaseScene.startCountdown(seconds, onComplete)`. Added to all 11 Phaser games. RhythmHacker retains its own ms-precision countdown. MatrixFrogger refactored to use BaseScene's version.

~~G9 — [P2] R75 P2 Cleanup Batch~~ RESOLVED (R76.1)
- Metris `wKey` wired to CW rotation. MenuScene control hints changed to `PRIMARY_HEX` at `setAlpha(0.3)`. Dead `return () => {}` removed from `useSoundSystem.ts`. Dead `enableTestMode` export removed from `test-utils.ts`. 4 hollow test cases in `ShatnerVoiceControls.test.tsx` given real assertions.

#### Per-Game Items (PG1–PG22)

~~PG1 — [P1] Snake Classic: app area exceeds 1 grid square~~ RESOLVED (R76.3)
- Reduced canvas to 640×400, CELL_SIZE 20→16. Grid remains 20×20.

~~PG2 — [P0] VortexPong: AI paddle doesn't move → unwinnable~~ RESOLVED (R76.2)
- Replaced broken acceleration/damping AI with direct tracking. Min speed floor 30px/s, difficulty ramp based on player score, max speed clamped to 85% of player speed.

~~PG3 — [P2] MatrixCloud → renamed to "Matrix Bird"~~ RESOLVED (R76.3)
- Updated display name in gameRegistry, useSaveSystem, SaveLoadManager, App.test, E2E fixtures. Folder remains `MatrixCloud/`.

~~PG4 — [P1] Matrix Bird: power-ups spawn too close to pipes~~ RESOLVED (R76.3)
- Power-ups now spawn within safe window 80px clear of both neighbouring pipes.

~~PG5 — [P2] Matrix Bird: obstacle balance~~ RESOLVED (R76.3)
- Active pipe cap of 4, dynamic spacing ramp from 320→240 based on score, gentler early game.

~~PG6 — [P2] MatrixInvaders: characters plain + slightly too big~~ RESOLVED (R76.3)
- Enemy sprites reduced 40×30→32×24 (~20%). Per-row tinting added (cyan→green→yellow palette).

~~PG7 — [P0] Metris: `B` bullet-time key doesn't work~~ RESOLVED (R76.2)
- Added null guard before `JustDown(this.bKey!)` — changed to `this.bKey && JustDown(this.bKey)`.

~~PG8 — [P0] MatrixFrogger: Kung Fu (`K`) doesn't work~~ RESOLVED (R76.2)
- Changed `kungFuKey!` non-null assertion to optional `kungFuKey?`, added null guard before `JustDown()` call.

~~PG9 — [P2] MatrixFrogger: 3D tilt camera + perspective + lane textures~~ RESOLVED (R76.9)
- Full pseudo-3D perspective: precomputed variable lane heights via `computeLaneLayout()`, X convergence with `colToX(col, row)`, trapezoid lane backgrounds via Graphics path API, vehicle/entity scale+rotation by perspective depth, animated road dashes (128×4 texture, 40px/s), lane-aware spawn/despawn bounds.

~~PG10 — [P0] NeoJump: falling off-screen doesn't kill player~~ RESOLVED (R76.2)
- Root cause: `checkGameOver()` set `isGameOver=true` before `playerDeath()` (which guards on that flag). Removed premature flag set — death sequence fires correctly.

~~PG11 — [P1] NeoJump: can't restart after death~~ RESOLVED (R76.2)
- Auto-resolved by PG10 fix. GameOverScene transition now fires; R key and menu restart work.

~~PG12 — [P1] NeoJump: bomb sprites too large~~ RESOLVED (R76.3)
- Enemy texture reduced from 40×40 to 28×28 (~30%), display size matched.

~~PG13 — [P2] NeoJump: 5-layer parallax depth~~ RESOLVED (R76.9)
- 5-layer parallax: rain at depth -50, 3 procedural building TileSprite layers (depths -40/-30/-20, scrollFactors 0.3/0.5/0.7), platforms+player at depth 0. Procedural textures in BootScene: building silhouettes, windowed mid-rises, rounded arch columns — all Matrix-green value-graded.

~~PG14 — [P0] AgentChase: wall-collision glitch (stutter into walls)~~ RESOLVED (R76.2)
- Implemented Pac-Man-style buffered turn + slide-along-wall. Post-advance turn check at tile boundaries, guarded progress advancement, clamped interpolation when blocked.

~~PG15 — [P1] AgentChase: add Matrix twist~~ RESOLVED (R76.3)
- Added "Bullet-time dot" mechanic: cyan collectibles spawn every 15s, freeze all agents for 2s with cyan overlay, 100 bonus points.

~~PG16 — [P1] AgentChase: sprites too small~~ RESOLVED (R76.3)
- Player/agent sprites increased from 18→28px. Physics hitboxes unchanged (use TILE_SIZE).

~~PG17 — [P1] RhythmHacker: BG music conflicts~~ RESOLVED (R76.2 — G2 fallout)
- Auto-resolved by G2 fix — global BGM now stops on game entry.

~~PG18 — [P1] RhythmHacker: matrix chaos combo effects~~ RESOLVED (R76.3)
- Screen shake at 10/25/50 combos (scaling intensity), matrix rain burst of katakana, lane tint to cyan at 25+ combo.

~~PG19 — [P0] CloudJumper: cannot jump manually~~ RESOLVED (R76.2)
- Removed grounded check from `jump()` — game is Flappy Bird style, not platformer. Added 300ms cooldown to prevent spam.

~~PG20 — [P1] CloudJumper: not enough clouds~~ RESOLVED (R76.3)
- Halved cloud spacing (60–120 from 100–200), reduced vertical range 150→100.

~~PG21 — [P1] CodeBreaker: numpad keys don't control paddle~~ RESOLVED (R76.3)
- Added NUMPAD_FOUR and NUMPAD_SIX bindings alongside arrow/A/D.

~~PG22 — [P1] CodeBreaker: level 1 lacks brick colour variety~~ RESOLVED (R76.3)
- Level 1 now cycles through all 3 brick types across 6 rows.

#### E2E Coverage Items (E1–E2)

~~E1 — [P0] Menu-first E2E flow support~~ RESOLVED (R76.4)
- Added `waitForCountdownComplete()` to test-utils. Updated playthrough runner to wait for countdown after GameScene ready. Updated CTRL-S World spec to handle command_prompt phase. Added `isCountingDown` to BaseScene's exposeTestState.

~~E2 — [P2] Regenerate visual baselines~~ RESOLVED (R76.4)
- All 14 visual tests pass against existing baselines. UI changes (card layout, button labels) within threshold — no baseline regeneration needed.

### R76 Completion Report

All R76 playtest findings resolved:
- G1-G9: autoStart=false, BGM scoping, achievements modal, card layout, pause/resume, countdown, About page, P2 cleanup
- PG1-PG22: Per-game fixes across all 11 Phaser games + CTRL-S excluded per guardrail
- E1-E2: Menu-first E2E flow, visual baselines verified
- R76.8: Pause/resume regression fixed by removing scene.pause() in favour of granular physics/tweens/time pause
- PG9: MatrixFrogger pseudo-3D perspective with trapezoid lanes, entity scaling, animated road dashes
- PG13: NeoJump 5-layer parallax with 3 procedural building textures

---

### Historical Analysis (preserved from IMPLEMENTATION_PLAN.md)

#### Original R75 Analysis — Over-Broad update() Guards

R72's cursor guards prevent crashes but are too aggressive — they block the entire `update()` method, not just input handling. During the ~500ms keyboard init window:

| Game | Guard | What gets frozen |
|------|-------|-----------------|
| MatrixFrogger | `if (!this.cursors) return;` (line 207) | Enemy vehicle movement, obstacle spawning, countdown, lane collision, matrix rain |
| NeoJump | `if (!this.cursors) return;` (line 189) | Platform generation, parallax rain, gravity, enemy spawning, camera follow |
| AgentChase | `if (!this.cursors) return;` (line 159) | Ghost AI movement, dot collision, animation timer, power pellet timing |
| VortexPong | `if (!this.upKey \|\| !this.downKey) return;` (line 110) | Ball physics, AI paddle, power-up spawning, scoring, impact effects |

Fix (shipped R75): Narrow the guard to wrap only the input-reading call. Everything else (physics, AI, rendering, scoring) runs unconditionally.

Tom's 2026-04-14 playtest confirmed this resolved: "Brilliant implementation so far, well done! We've made stellar progress, and it's just about tweaking now and getting the final gameplay on point."

#### Original Analysis (R69–R71) — Unguarded Cursor Access

Root cause: `waitForKeyboard()` defers key registration asynchronously. Three games accessed cursor fields without null guards in `update()`, causing silent TypeErrors that killed Phaser's update loop — the scene rendered but all controls were dead.

Crash sites (R70):
- **MatrixFrogger** `GameScene.ts:205→569`: `Phaser.Input.Keyboard.JustDown(this.cursors.up)` — `!` declaration, no guard
- **NeoJump** `GameScene.ts:187→407`: `this.cursors.left.isDown` — `!` declaration, no guard
- **AgentChase** `GameScene.ts:157→362`: `this.cursors.up.isDown` — `!` declaration, no guard

R72 fix: Added `if (!this.cursors) return;` guard after `isPaused` check in all three `update()` methods. Refactored `BaseScene.waitForKeyboard` to take per-callback `retries` parameter, restoring full 10-retry budget per callback. R75 then narrowed the guards to wrap only `handleInput()`, not the entire `update()`.
