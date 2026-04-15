# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: R80 open — CTRL-S flagship Phaser rewrite (26 tasks, 30-loop cap recommended, Tom collaborative design locked in 2026-04-16)

> **R78.7 complete (2026-04-14)**: Multi-viewport Playwright matrix — added `mobile` (375×667) and `tablet` (768×1024) projects to `playwright.config.ts`. Both viewports trigger the app's "DESKTOP REQUIRED" gate (MobileWarning component), so created dedicated `e2e/responsive/mobile-gate.spec.ts` with 2 tests × 2 viewports = 4 baselines. Scoped via `testMatch: /responsive\//` so only responsive specs run on those projects. Fixed pre-existing lint error (`addScore` unused in App.tsx). All 4 responsive tests pass, all 6 desktop visual tests pass, build clean.
>
> **R78.5 complete (2026-04-14)**: Visual regression baselines regenerated — 86 darwin PNG baselines across 14 visual specs + 12 game playthroughs updated post-sprite deployment. All E2E spec files and playthrough fixtures force-added to source control (previously gitignored). Fixed attract mode `useCallback` dependency cycle that prevented overlay from staying visible. Fixed scoreboard E2E localStorage key mismatch (`matrix-arcade-save` → `matrix-arcade-save-data`). 69/69 E2E tests pass, build clean, TypeScript clean.
>
> **R78.4 complete (2026-04-14)**: Per-game sprite deployment pass 3 — Agent Chase (frightened warning ghost from PacMan sheet, floating eyeball eyes, glowing dot + power pellet sprites), Neo Jump (flying enemy from Legacy Fantasy Small Bee, projectile energy bolt), Vortex Pong (4 power-up icons from Hologram Interface tinted per-type, cyan multi-ball variant, board background overlay at 15% opacity). 11 new sprite files across 3 games, BootScenes + GameScenes wired with sprite-mode fallbacks.
>
> **R78.3 complete (2026-04-14)**: Per-game sprite deployment pass 2 — Cloud Jumper (parallax background layers from cloud tileset, Treasure Hunters collectible sprites for coin/gem/star, Crabby + cannonball obstacle sprites), Matrix Frogger (Neo Cyberpunk player replacing frog, TopView Robot 64×64 agent + sentinel enemies replacing procedural fallbacks, hologram power-up icons), Code Breaker (breakout frame background overlay). 15 new sprite files across 3 games, BootScenes + GameScenes wired with sprite-mode fallbacks.
>
> **R78.2 complete (2026-04-14)**: Per-game sprite deployment pass 1 — Snake Classic (upgraded head/body to pixel art, added wall borders, bomb, food variant, eyes), Matrix Cloud (city skyline background with green tint, ground tile), Metris (hologram UI panel backdrops for Hold/Next), Matrix Invaders (glowing laser bullet sprites replacing solid rectangles). 14 new sprite files across 4 games, BootScenes + GameScenes wired up.
>
> **R78.1 complete (2026-04-14)**: Audio deployed cross-game — Global SFX wired into all games except CTRL-S World (deferred) and Rhythm Hacker (5 dedicated tracks already in place). Matrix Frogger retains its full set.

> **Last change (R78 planning, 2026-04-15)**: R77 retro-arcade scoreboard shipped overnight (`519edeb`, 10 iterations). R76 + R77 closed task bodies + completion reports moved to `COMPLETED_WORK.md § R76` and `§ R77`. Stale RESOLVED residue (R62-R75 duplicate items) also archived. Live plan slimmed from 991 → 551 lines. New phase R78 = **Phase 0b Asset Deployment + Phase 6 Infrastructure Polish** combined. Terminator: `R78 COMPLETE — assets + infra shipped`. CTRL-S remains fenced off for its own dedicated window (future phase).
>
> **R76 root-cause findings from pre-plan investigation**:
> - **`autoStart={true}` hard-coded at `src/App.tsx:595,644`** — the one-line root cause of "no start menu on launch" across every game. Flipping to `false` unlocks MenuScene for all 12 games.
> - **Global BGM overlap**: `matrixarcaderetrobeat.mp3` plays from `App.tsx:396` on mount and auto-resumes after every game exit (`:699`). Must be scoped to CTRL-S World + landing only.
> - **Countdown already exists in MatrixFrogger** (`MatrixFrogger/config.ts:76-79`, `GameScene.ts:63,196-212`) — promote the pattern to `BaseScene.startCountdown()` so every game reuses it.
> - **Pause/resume architecture sound** in `BaseScene:115-172` but individual games don't re-enable keyboard after `scene.resume()` — needs a consolidated `resumeGame()` helper, not per-game patches.
> - **NeoJump fall-death missing** — no `y > HEIGHT` check anywhere; `playerDeath()` only fires on collision.
> - **No About page exists** — new `src/components/About.tsx` needed.
>
> **Last change (R75)**: planning-only session. Full codebase re-audit with parallel research agents across specs, hooks, assets, E2E tests, and all 12 game source files. Lint clean, typecheck clean, 1838/1838 unit tests pass. All E2E tests pass (0 failures in last run). 12 games total. Git on `developmentv3.0`.
>
> **R75 planning findings**:
> - ~~**P1 — Over-broad cursor guards RE-CONFIRMED**~~ RESOLVED (R78.11): Guards narrowed to wrap only `handleInput()` in all 4 games. Physics, AI, rain, animations now run unconditionally from frame 1.
> - ~~**P2 — Metris wKey dead code**~~ FALSE POSITIVE — wKey IS actively used on GameScene.ts:752 as rotate-CW alias (W = Up = rotate). Declared line 80, bound line 243, read line 752. Closed.
> - ~~**P2 — Control hints invisible**~~ RESOLVED (R78.11) — RhythmHacker MenuScene line 44 changed from `DARK_GREEN_HEX` to `PRIMARY_HEX` with `setAlpha(0.3)`, matching the base MenuScene pattern. Control hints now readable.
> - ~~**P2 — Dead cleanup in useSoundSystem**~~ ALREADY RESOLVED — the redundant `return () => {}` cleanup no longer exists in the current file. Likely removed during earlier R78 lint work. Closed.
> - **Codebase health**: Zero TODO/FIXME/HACK comments. All console.error/warn properly DEV-gated. No commented-out code. All 12 games have unit + E2E tests. TypeScript strict mode fully enforced.
> - **E2E coverage COMPLETE**: All 12 games have dedicated playthrough specs + keyboard-only a11y tests. 18 total spec files across playthrough, a11y, performance, and visual categories. No new games need E2E tests created.
> - **E2E gap persists**: All playthrough tests use `autoStart=true`, bypassing MenuScene. The user-reported "press ENTER to start" bug is NOT tested. Adding `autoStart=false` E2E tests would catch this regression.
> - **onExit IS wired up**: App.tsx passes `onExit` to all game components (lines 595, 644). The R69 "onExit never passed" finding is outdated — this was fixed.
> - ~~**Asset status unchanged**~~ STALE (R78.1–R78.4 deployed sprites + global SFX across all 11 non-CTRL-S games). See R78 status entries for current per-game counts.
> - **Architecture note update**: The Architecture Notes section still documents Pattern 1 (guard in update) as the REQUIRED pattern, but the guard MUST be narrowed to wrap only `handleInput()`, not the entire `update()`. Pattern 2 (event-driven) remains preferred.
> - **All 4 old buggy games successfully rebuilt**: CrossyRoad→MatrixFrogger, MatrixAscension→NeoJump, AgentEscape→AgentChase, JimmyMatrix→RhythmHacker. Plus Cloud Jumper (new) and Code Breaker (new). Total: 12 games.
>
> **R73/R74 planning findings** (prior sessions):
> - Initial identification of over-broad cursor guards, Metris wKey dead code, control hints visibility issue.
> - Confirmed zero TODO/FIXME/HACK, all E2E using autoStart=true.
> - R74 re-confirmed all P1/P2 items unchanged.
>
> **R72 delta** (prior session):
> - `BaseScene.waitForKeyboard` now takes a `retries` recursion parameter instead of using a shared instance field.
> - Added `if (!this.cursors) return;` guard after `isPaused` check in `update()` for MatrixFrogger, NeoJump, AgentChase.
> - Added `if (!this.upKey || !this.downKey) return;` guard in VortexPong `update()`.
> - Removed `keyboardRetryCount` field and its `shutdown()` reset from BaseScene.
>
> **Previous audit (R71)**: All unit tests pass (1838/1838). Build clean. TypeScript clean. E2E tests pass in automated Playwright but **user reported controls do not work in live browser**. This P0 is the fix.
>
> **R71 planning findings**: Full codebase re-audit confirms all R69/R70 findings. P0 crash sites verified still present:
> - **MatrixFrogger** (`GameScene.ts:205→569`): `update()` has no cursor guard; `handleInput()` accesses `this.cursors.up` directly
> - **NeoJump** (`GameScene.ts:187→407`): `update()` has no cursor guard; `handleInput()` accesses `this.cursors.left.isDown` directly
> - **AgentChase** (`GameScene.ts:157→362`): `update()` has no cursor guard; `handleInput()` accesses `this.cursors.up.isDown` directly
> - All three declare cursors/wasdKeys with `!` (non-null assertion) but initialise them async in `waitForKeyboard`
> - **VortexPong** (lines 72-76): declares keys as `?` optional, uses `?.isDown` at lines 248-249 — safe from crashes but controls silently don't respond until callback fires
> - **CloudJumper** and **RhythmHacker** use event-driven `key.on('down', ...)` — immune to this bug
>
> **BaseScene.keyboardRetryCount** (line 31): Single instance field shared across all `waitForKeyboard` calls. Both `setupInput()` and `setupCommonInputs()` call `waitForKeyboard`, sharing the same counter. Each recursive retry increments it (line 50), effectively halving the retry budget from 10 to ~5 per callback. Reset only in `shutdown()` (line 105).
>
> **R71 screenshot audit** (from Playwright playthrough snapshots):
> - **Code Breaker**: Ball never launches in screenshots — Space key input not triggering. Game appears static.
> - **Matrix Invaders**: Player never fires — score stuck at 0 across all snapshots.
> - **Matrix Cloud**: Instant game-over on first run (Score: 0 on frame 2).
> - **Agent Chase**: Never reaches true end state — final snapshot identical to paused.
> - **Rhythm Hacker**: Very sparse notes visible, health draining to near-zero.
> - **Portal thumbnails**: ~5 games show blank/black preview canvases (Phaser canvas not rendered in time).
> - **UI screenshots**: All healthy — landing page, achievements, modals, settings all render correctly.
>
> **Test audit (R79)**: 47 unit test files (1,896 tests, 2 todo), 23 E2E spec files, 98 darwin + 85 linux baselines — all pass. FPS budget test only runs with `PLAYWRIGHT_PERF=1` env var.
>
> **Why E2E passes but live browser fails**: Playwright manages focus precisely — it clicks the game container, sends keyboard events directly, and has no competing focus targets. In a live browser, the user may click PLAY from the portal, focus might land on the portal container div rather than the Phaser canvas, and keyboard init timing may differ.

## Reference Docs

- [`PLAYWRIGHT_BULKUP.md`](PLAYWRIGHT_BULKUP.md) — R50 test-infra overhaul (43/43 specs, ~91 baselines, test-mode seam, seeded RNG, DOM/Phaser ready markers). Source of the Phase 6 playwright residue below.
- [`rebuildingoldgames/bugs.md`](rebuildingoldgames/bugs.md) — user's hand-written playtest backlog. Most items shipped in R1–R49, but a few were re-surfaced and still need verification (see **Playtest Verification** below).
- [`rebuildingoldgames/plans/*.md`](rebuildingoldgames/plans) — 12 per-game rebuild research docs. Primary input for Phase 7 CTRL-S rewrite and any future per-game rebuilds. Don't re-research — read these first.
- [`rebuildingoldgames/inspirationimagesandsprites/`](rebuildingoldgames/inspirationimagesandsprites) — reference art/UX inspiration per game (Citizen Sleeper for CTRL-S, Doodle Jump for Neo Jump, Guitar Hero for Rhythm, Pac-Man for Agent Chase, etc.).
- [`.claude/skills/phaser-gamedev/SKILL.md`](.claude/skills/phaser-gamedev/SKILL.md) — Phaser 3 gamedev skill with mandatory pre-work protocol (spritesheet measurement, arcade physics, tilemaps, performance).
- [`specs/phaser-games.md`](specs/phaser-games.md) — specs for all 5 Phaser game rebuilds + Cloud Jumper.
- [`specs/game-architecture.md`](specs/game-architecture.md) — mandatory interfaces, hooks, state machine, performance budgets.
- [`specs/ux-guidelines.md`](specs/ux-guidelines.md) — palette, typography, screen flows, accessibility, controls.

---

## Priority Legend

- **P0**: Critical/blocking — games unplayable, users cannot interact
- **P1**: High — bugs that degrade experience, failing tests, memory leaks
- **P2**: Medium — infrastructure, UX improvements, code quality
- **P3**: Low — rebuilds, new features, polish, assets

---

## Open Work

> **R76, R77, R78, R79 fully shipped and archived.** See [`COMPLETED_WORK.md § R76`](COMPLETED_WORK.md#r76--final-polish-phase), [`§ R77`](COMPLETED_WORK.md#r77--retro-arcade-scoreboard), [`§ R78`](COMPLETED_WORK.md#r78--assets--infrastructure), and [`§ R79`](COMPLETED_WORK.md#r79--r78-residue-closeout). All R62–R75 resolved items also archived.

### Tests + Gates Status (Post-R79)

- Unit tests: **1,896 pass** (up from 1,867 at end of R78)
- E2E: **73 specs pass** (up from 69)
- TypeScript: clean
- Lint: 0 errors, 14 intentional warnings (6 in CTRL-S `DEFERRED-CTRLS-DEDICATED-PHASE`, rest in circular hook deps / mount-only effects / context colocation)
- PWA + build: green
- Docker linux baselines: shipped R79.1 (daemon now available)

---

## R80 — CTRL-S World: Flagship Phaser Rewrite (HEAVY — 26 tasks, 30-loop cap)

> **Tom's call (2026-04-16)**: *"It makes more sense to complete the games and do testing together (and unit testing), as I am nearing the end of this project. It's almost perfect and once ctrl-s is done, the rest of the work will be performance and getting the games perfect."*

**CTRL-S is the flagship story-driven game.** Current implementation is a 1,845-line React DOM component with known UX problems: save crash (`gameData.stats` undefined), ASCII title too small, glitchy story screen, "too rushed, hard to get into flow state." This phase rewrites it in Phaser, consistent with the other 11 games, while preserving all existing story content.

### R80 Design Decisions (locked in 2026-04-16)

| Decision | Choice | Implication |
|----------|--------|-------------|
| **Stack** | Phaser 3 | Full rewrite under `src/components/games/phaser/CtrlSWorld/`. Reuses `BaseScene`, countdown, pause, scoreboard hooks (or skipped — narrative game has no score), save system, `useFocusTrap`. |
| **Content scope** | Port everything as-is, THEN plan golden-path trim separately | R80 = migration (code-heavy, Ralph-friendly). Content trim = later phase with Tom's editorial judgement. |
| **Pacing** | Full user control — click/SPACE/ENTER to advance each beat | Fixes the "rushed" bug directly. Citizen Sleeper-style. No auto-advance. Pause still available via P. |
| **Audio** | Full soundscape — ambient bed + Shatner TTS narration + character SFX | Rich experience. Reuses existing `useShatnerVoice` hook. Character-specific typewriter ticks. |
| **Visual target** | Citizen Sleeper | Reference images at `rebuildingoldgames/inspirationimagesandsprites/ctrlscitizensleeperimageinspiration/`. Character portrait panels, environmental backgrounds, smooth transitions. |

### R80 Architecture

```
src/components/games/phaser/CtrlSWorld/
├── index.tsx                # React wrapper (PhaserGame)
├── config.ts                # Phaser config + constants + achievement IDs
├── data/
│   ├── chapters.ts          # TS const story data (ported from CtrlSWorld.tsx)
│   ├── puzzles.ts           # Existing puzzle data ported
│   └── inventory.ts         # Item definitions
└── scenes/
    ├── BootScene.ts         # Load fonts, portraits, backgrounds, BGM
    ├── MenuScene.ts         # Matrix-themed title with proper-sized ASCII
    ├── ChapterHubScene.ts   # Visual chapter select (Citizen Sleeper-style)
    ├── NarrativeScene.ts    # Core story engine — typewriter, choices, portraits
    ├── PuzzleScene.ts       # Overlay on top of NarrativeScene
    ├── InventoryScene.ts    # Overlay
    └── GameOverScene.ts     # Completion screen
```

### R80 Task List (25 iterations)

- [x] **R80.1 — [P1]** Story audit + content map. Read `CtrlSWorld.tsx` end-to-end. Produced `specs/ctrls-content-map.md` (163 paragraphs, 19 triggered puzzles, 7 orphaned puzzles, 18 items, 9 characters catalogued) and `specs/ctrls-golden-path.md` (ESSENTIAL/OPTIONAL classification per segment, estimated ~46 min current playtime, ~25 min trim target). Key findings: story is 100% linear (no branching choices despite design intent), Chapter 4 is biggest trim target at 48 paragraphs, 6 items never awarded in gameplay, 7 puzzles have no story trigger.
- [ ] **R80.2 — [P1]** Phaser scaffold. Create `src/components/games/phaser/CtrlSWorld/` dir. BootScene + MenuScene + GameOverScene skeletons. Register via PhaserGame wrapper. Wire into landing page with a feature flag (new Phaser version alongside old React version until R80.25 cut-over). Unit test coverage for new scenes.
- [ ] **R80.3 — [P1]** Typewriter text engine. Build in `NarrativeScene`. Paragraph-by-paragraph reveal, blinking cursor, SPACE/ENTER/click advance. No auto-advance. Expose pacing via `exposeTestState()`. Unit tests for advance, skip-to-end-of-paragraph, pause handling.
- [ ] **R80.4 — [P1]** Story data format + prologue port. Design `data/chapters.ts` TS const schema (scenes, paragraphs, choices with branch routing, puzzle triggers, portrait assignments per line, background per scene). Port prologue as reference implementation. Render in NarrativeScene, verify feel.
- [ ] **R80.5 — [P1]** Chapter 1 + Chapter 2 content port. Every paragraph, choice, branch, item reward preserved. Unit tests.
- [ ] **R80.6 — [P1]** Chapter 3 + Chapter 4 content port.
- [ ] **R80.7 — [P1]** Chapter 5 content port + cross-chapter continuity check (items persist across chapters, flags honoured, alt paths reach correct end states).
- [ ] **R80.8 — [P2]** Choice UI system. Buttons with hover/select states, keyboard navigation (↑↓ + ENTER), particle FX on selection, smooth transitions. `juice-recipe` this moment for maximum feel.
- [ ] **R80.9 — [P1]** Asset sourcing from dump — **NEW TASK added 2026-04-16**. Ralph reads `desiredassets/ctrl-s-world/ASSETS_NEEDED.md` (40+ items, each with `DUMP/<path>` source mapping), then walks `desiredassets/TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/` (638 MB, gitignored) to select the best-matching asset per item. Processing pipeline per asset:
  - Pick the best candidate from the source path (e.g. for "Protagonist portrait" from `DUMP/FREE Mana Seed Character Base Demo 2` — pick the Neo-archetype variant).
  - Recolour to Matrix green where appropriate (backgrounds, UI frames, icons).
  - Resize to target dimensions in ASSETS_NEEDED.md.
  - Copy final files to `public/assets/ctrl-s/<category>/` (tracked).
  - Flip `[~]` → `[x]` in `ASSETS_NEEDED.md` with a short note on which source file was chosen.
  Scope: portraits (8), backgrounds (8), UI frames (~10), inventory icons (~10), puzzle assets (5), transitions (1), audio (5 music tracks + SFX). If any item genuinely has no good match, tag `BLOCKED-ART-NEEDED` with a note and move on — Tom can source custom art later. **This runs BEFORE all visual-dependent tasks** (R80.10 portraits, R80.11 backgrounds, R80.12 puzzle, R80.13 inventory, R80.14 chapter hub, R80.17-18 audio) — they depend on it.
- [ ] **R80.10 — [P2]** Character portrait panel system. Left/right slots per NarrativeScene, per-line character assignment, fade transitions between speakers. Load portraits from `public/assets/ctrl-s/portraits/` (sourced in R80.9).
- [ ] **R80.11 — [P2]** Environmental backgrounds + parallax. Per-scene BG with 2-3 parallax layers. Subtle particle effects (dust motes, data streams) per scene's theme. Backgrounds sourced in R80.9.
- [ ] **R80.12 — [P2]** PuzzleScene overlay. Launched parallel to NarrativeScene on puzzle trigger. Reuse existing puzzle logic/data from current CtrlSWorld. Return to NarrativeScene with item reward on completion.
- [ ] **R80.13 — [P2]** InventoryScene overlay. Item grid, descriptions, acquisition tracking. Accessible via I key during NarrativeScene.
- [ ] **R80.14 — [P2]** ChapterHubScene visual select. Grid of chapter tiles showing completion state (locked/in-progress/complete), replay support, smooth enter/exit transitions. Citizen Sleeper-inspired layout. Uses hub background + node icons sourced in R80.9.
- [ ] **R80.15 — [P1]** Save system integration. Fix `gameData.stats` undefined crash root cause. Migrate save format if needed. Chapter-based save points. Integrate with `useSaveSystem` following R77 scoreboard pattern.
- [ ] **R80.16 — [P2]** Shatner TTS integration. Wire `useShatnerVoice` hook through React bridge. Sync with typewriter pacing (voice starts on paragraph reveal, user can skip). Mute toggle in pause menu.
- [ ] **R80.17 — [P2]** Ambient music bed. Per-chapter track (5 tracks from R80.9 sourcing). Fade between chapters. Independent volume control.
- [ ] **R80.18 — [P2]** Character SFX. Distinct typewriter tick per speaker (bass = antagonist, treble = protagonist, etc.). Environmental stingers for key reveals (item unlock, puzzle solve, chapter transition). SFX sourced in R80.9.
- [ ] **R80.19 — [P2]** ASCII title + MenuScene polish. Fix ASCII size (known bug — "too small"). Matrix rain behind title. Citizen Sleeper-inspired menu treatment. `juice-audit` on the menu entrance.
- [ ] **R80.20 — [P3]** Achievement expansion. Current: 3 achievements. Target: 8+. Add per-chapter completion, secret-branch discovery, puzzle-without-hints, completionist.
- [ ] **R80.21 — [P1]** E2E smoke test. New `e2e/playthrough/ctrl-s-world-phaser.spec.ts`. Navigate landing → menu → prologue first choice → chapter 1 first scene. Keep existing React version's test for comparison until R80.25 cut-over.
- [ ] **R80.22 — [P2]** Visual regression baselines. Generate darwin + linux baselines for new NarrativeScene, ChapterHubScene, MenuScene, and 2-3 mid-story checkpoints.
- [ ] **R80.23 — [P2]** `juice-audit` pass on narrative transitions. Use the `juice:juice-audit` skill to diagnose any flatness between paragraph advances, choice selections, chapter transitions, puzzle launches. Log findings in `### R80 Discovered Work`.
- [ ] **R80.24 — [P2]** `juice-recipe` pass on flagged moments. Use `juice:juice-recipe` for each item flagged in R80.23 — ship specific feedback improvements (screen shake, particle burst, audio stinger, animation polish).
- [ ] **R80.25 — [P1]** Cut-over. Delete old `src/components/games/CtrlSWorld.tsx` + `CtrlSWorld.test.tsx`. Remove React version from `src/App.tsx` routing. Update landing page / game registry to use Phaser version only. Remove the feature flag.
- [ ] **R80.26 — [P1]** Golden-path trim design doc + terminator. Produce `specs/ctrls-golden-path-trim-plan.md` — concrete scene-by-scene recommendation for which to drop/merge to hit a ~20-30 min first-playthrough target. Includes estimated time per scene, narrative dependencies, trim vs preserve rationale. **This is a spec, not code** — Tom reviews + signs off content choices in R81. Also write `### R80 Completion Report`, update Status line to `R80 COMPLETE — CTRL-S flagship rewrite shipped`, run all gates.

### R80 Terminator

- All R80.1–R80.26 tasks `[x]`.
- Gates green: lint + build + test + e2e + visual.
- Old `CtrlSWorld.tsx` + `CtrlSWorld.test.tsx` deleted (R80.25 cut-over).
- `public/assets/ctrl-s/` populated with sourced assets (R80.9).
- Status line contains: **"R80 COMPLETE — CTRL-S flagship rewrite shipped"**.
- `specs/ctrls-golden-path-trim-plan.md` written for Tom's R81 review.

Standard complete-and-exit pattern (like R76/R77/R79). Auto-terminator is correct here.

### R80 Guardrails

- **Preserve all content**. Ralph does NOT drop scenes, paragraphs, choices, branches, or puzzles. If content seems broken, preserve it and flag in R80.1 content map.
- **No editorial edits**. Ralph does NOT rewrite dialogue, change character names, or "improve" story beats. Migration only. Content decisions = Tom's call in R81.
- **Feature-flag until cut-over**. Old React version stays live until R80.25 so Tom can A/B compare during development.
- **Reuse existing modal components** where feasible — `PuzzleModal`, `CharacterConversationModal`, `SentientAIModal` all have `useFocusTrap` + `aria-labelledby` from R64/R78.11. Can be kept as React overlays if the hybrid is cleaner than porting them to Phaser. Phaser scenes can emit events to trigger React modals.
- **CTRL-S guardrail is LIFTED for this phase only**. R76–R79 all fenced CTRL-S off; R80 is the dedicated window.
- **Test coverage must not drop**. Every iteration commits passing tests. Cut-over (R80.25) must keep E2E green.
- **Asset-sourcing discipline (R80.9)**. Ralph picks from the dump but does NOT commit the dump — only the chosen processed files under `public/assets/ctrl-s/`. Tom will delete the dump folder locally after R80 completes (it's gitignored, so no commit needed).
- **If asset has no match**: tag the item `BLOCKED-ART-NEEDED` in `ASSETS_NEEDED.md` and continue. Ralph does NOT attempt to generate art, and does NOT use placeholder ASCII or rectangles in final deliverables (OK during scaffolding, but must be replaced before cut-over).

### R80 Discovered Work

_(Ralph appends findings here during R80.23 juice-audit + any other discovered items during iterations)_

---

## R79 — Close R78 Residue (SMALL — 3 loops)

> **Tom's call (2026-04-15, post-R78 review)**: R78 shipped 35 commits of real value (sprites, audio, a11y, constants, bug fixes). Two items remained uncloseable last night: Docker baseline (needs Docker Desktop running) + Rhythm BPM verification (needs Tom's ear). R79 is a tight 3-loop sweep to close out R78 residue, archive R78 to `COMPLETED_WORK.md`, and handle any final stragglers.

### R79 Task List

- [x] **R79.1 — [P2]** Docker baseline regen for CI parity. 85 `*-chromium-linux.png` baselines generated via Docker (`mcr.microsoft.com/playwright:v1.58.0-noble`), 69/72 chromium tests passed (2 mobile-gate failures expected on desktop viewport, 1 skipped). Fixed Vite `allowedHosts` for Docker DNS (`Host: app`). Snapshots verified: 6.7K–672K, no empty/corrupt files.
- [x] **R79.2 — [P1]** Archive R78 to `COMPLETED_WORK.md`. Move R78 Scope Summary + Task List + Discovered Work (all 25 items) into a new `## R78 — Assets + Infrastructure` section in `COMPLETED_WORK.md`, preserving iteration tags. Replace in-plan content with a one-line back-reference: `R78 closed — see [COMPLETED_WORK.md § R78](COMPLETED_WORK.md#r78--assets--infrastructure)`. Keep R79 Terminator Rule + Guardrails evergreen note. Preserves the "pattern" knowledge that R78 was a continuous-improvement phase. ~1 iteration, doc-only.
- [x] **R79.3 — [P2]** Straggler sweep. Audit for any loose ends:
  - Remaining 14 lint warnings — document in plan which are intentional (CTRL-S fenced, circular hook deps, etc.) vs fixable. Fix any fixable ones.
  - TODO/FIXME/HACK comments in `src/` — grep and triage.
  - Orphan test files or fixtures no longer referenced.
  - Stale entries in `Open Gaps` / `Test Coverage Status` / `Current Codebase Health`.
  - Any `[~]` items in `desiredassets/*/ASSETS_NEEDED.md` that are actually deployed but not flipped.
  Log findings, fix what's quick, document what's intentional.

### R79 Terminator

- Status line contains: **"R79 COMPLETE — R78 residue closed"**
- All 3 tasks `[x]`, OR any remaining `[ ]` tagged `BLOCKED-NEEDS-DOCKER` (if Docker still not running when Ralph reaches R79.1).
- Gates green: lint + build + test + e2e.

Standard complete-and-exit pattern — NOT R78's continuous-improvement mode. If Ralph finishes all 3 tasks before the iteration cap, write the terminator phrase and stop cleanly.

### R79 Completion Report

- **Commits**: 2 (R79.1 Docker baselines, R79 closeout)
- **R79.1**: 85 `*-chromium-linux.png` baselines generated via Docker Playwright v1.58.0. Fixed Vite `allowedHosts` for Docker DNS, fixed Playwright config to exclude responsive specs from chromium project (`testIgnore: /responsive\//`).
- **R79.2**: R78 archived to COMPLETED_WORK.md (35 items: 10 task-list + 25 discovered-work). Live plan slimmed by ~136 lines.
- **R79.3**: 14 lint warnings documented as intentional. Zero TODO/FIXME/HACK. Test stats updated. Legacy Ralph Notes collapsed from ~140 lines to 4.
- **Final gate results**: lint 0 errors / 14 warnings, build clean (7.3s), 1,896 unit tests pass, 73 E2E pass + 1 skipped, 98 darwin + 85 linux baselines.
- **Discovered fix**: chromium project was running `e2e/responsive/mobile-gate.spec.ts` (mobile-only viewport tests) and always failing. Added `testIgnore: /responsive\//` to chromium project config.

### R79 Tom Manual TODOs (NOT Ralph's work)

These need Tom's direct attention, not an autonomous loop:

- **Rhythm Hacker BPM verification**: playtest `Cyberpsychotic` (140 BPM) and `Enhancements` (160 BPM) by ear. `In The Moonlight` (100 BPM) is likely correct. If any are off, update `src/components/games/phaser/RhythmHacker/config.ts`. Ralph's algorithmic detection was ambiguous — only your ear can confirm.
- **R78 browser playtest**: open the arcade fresh, verify all 11 games still feel right after the sprite deployment + BGM reshuffle. Any new bugs → log for R80.

---

R78 closed — see [COMPLETED_WORK.md § R78](COMPLETED_WORK.md#r78--assets--infrastructure).

---

### Phase 0a — Global Asset Extraction (residue)

- [ ] Background textures, sci-fi UI panels, additional icon packs (still in ZIPs)

### Phase 0b — Per-Game Asset Deployment (residue)

Sprites/audio not yet deployed. CTRL-S World is intentionally deprioritised — its assets should be wired into the Phase 7 rewrite, not the existing DOM implementation.

**Asset deployment status** (R61 full audit — sourced from ASSETS_NEEDED.md files):

| Game | Deployed Files | Real Art? | Audio? | Biggest Gap |
|------|---------------|-----------|--------|-------------|
| Matrix Frogger | 11 sprites + 6 audio | Core complete | **Full set** | Enhancement sprites (Neo, agents, tiles) |
| Vortex Pong | 10 sprites | Core complete | Global SFX | Power-up icons, audio |
| Neo Jump | 15 sprites | All states + platforms | Global SFX | Backgrounds, 2 enemy types, UI |
| Code Breaker | 14 sprites | Core + all 6 power-ups | Global SFX | Damage states, enemies, animations |
| Agent Chase | 13 sprites | All characters | Global SFX | Death anim, dots, audio |
| Metris | 7 sprites | Tetrominos only | Global SFX | Ghost piece, grid, backgrounds |
| Matrix Invaders | 7 sprites | Core functional | Global SFX | Boss, power-ups, animations |
| Cloud Jumper | 7 sprites | Player + 4 clouds | Global SFX | Backgrounds, collectibles, obstacles |
| Matrix Cloud | 3 sprites | Bare minimum | Global SFX | Bosses, power-ups, parallax |
| Snake Classic | 5 sprites | Minimal (no directions) | Global SFX | Directional variants, modes, boss |
| Rhythm Hacker | 5 audio tracks | 100% procedural visuals | 5 tracks | All visual assets, note charts |
| CTRL-S World | 0 | Nothing | Nothing | Everything (defer to Phase 7) |

**Critical gaps** (blocking for proper gameplay):
- [x] **Audio is the biggest cross-cutting gap**: Only Matrix Frogger has deployed audio. SFX kit and music tracks exist in the dump but none have been extracted per-game.
- [ ] **Rhythm Hacker**: 5 music tracks deployed but all visual assets are procedural. Note charts (timing data) are generated procedurally via `charts.ts` — works but could be improved with hand-authored charts.
- [ ] **CTRL-S World**: Zero assets. Everything sourced but needs extraction. **Defer until Phase 7.**

**Partial deployment** (~25–75% done — core sprites shipped in R78.2–R78.4, remaining items are polish):
- [~] **Snake Classic**: ~~head/body/food/bomb/eyes/wall sprites~~ (R78.2). Remaining: 4-directional variants, Agent Smith, boss, grid tiles, power-up icons
- [~] **Matrix Cloud**: ~~city skyline bg, ground tile~~ (R78.2). Remaining: player death anim, boss sprites, power-up icons
- [~] **Metris**: ~~hologram UI panels~~ (R78.2). Remaining: ghost/variant tiles, effect animations
- [~] **Matrix Invaders**: ~~laser bullet sprites~~ (R78.2). Remaining: boss, death explosion, power-up icons
- [~] **Cloud Jumper**: ~~parallax bg layers, collectibles, Crabby + cannonball obstacles~~ (R78.3). Remaining: player death anim, 3 backgrounds
- [~] **Matrix Frogger**: ~~Neo Cyberpunk player, TopView Robot enemies, hologram power-ups~~ (R78.3). Remaining: environment tiles, chasing agents
- [~] **Code Breaker**: ~~breakout frame bg~~ (R78.3). Remaining: Agent Smith anims, ball effects, portal
- [~] **Agent Chase**: ~~frightened ghost, eyeball eyes, dot/pellet sprites~~ (R78.4). Remaining: player death anim, map layouts
- [~] **Neo Jump**: ~~flying enemy, energy bolt projectile~~ (R78.4). Remaining: shooting enemy, backgrounds, altitude meter
- [~] **Vortex Pong**: ~~4 power-up icons, multi-ball, board bg~~ (R78.4). Remaining: goal flash, combo text

#### Asset Integration Pattern

For each game, the pipeline is:
1. Extract raw assets from dump to `desiredassets/[game]/raw/`
2. Process (recolour, resize, atlas-pack) to `desiredassets/[game]/processed/`
3. Copy final assets to `public/assets/[game]/`
4. Update BootScene to load from new paths
5. Mark `[~]` to `[x]` in ASSETS_NEEDED.md

---

### Phase 1/2 — Global Asset System

- [ ] Research `src/lib/assets/` design
- [ ] Create `src/lib/assets/AssetManager.ts` — centralised font, spritesheet, and audio loading
- [ ] Create global spritesheet atlas system for shared sprites across games

---

### Phase 6 — Polish Residue

- [ ] **Performance profiling** (60fps on all games) — requires manual browser testing
- [ ] **Accessibility residue**:
  - [x] ~~Focus traps on modals~~ RESOLVED (R64) — new `useFocusTrap` hook applied to all 5 modals (GameOverModal, AchievementDisplay, PuzzleModal, SentientAIModal, CharacterConversationModal). Added `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape-to-close, Tab cycling, and focus restoration.
  - [ ] CTRL-S World `aria-live` on story text (will be addressed by Phase 7 rewrite)
  - [x] ~~Form input labels~~ RESOLVED (R78.8) — added `id`/`htmlFor` pairs to 13 inputs across AudioSettings, ShatnerVoiceControls, AdvancedVoiceControls, PuzzleModal, Scoreboard; added `aria-label` to AchievementDisplay search. CTRL-S World inputs deferred to Phase 7.
- [x] ~~**Rhythm Hacker BPM tuning**~~ RESOLVED (R78.9) — Resonance corrected from 150→110 BPM (FL Studio confirmed), Cyberpunkin' from 120→118 (algorithmic consensus). All 5 track durations corrected to match actual audio lengths. Cyberpsychotic (140) and Enhancements (160) left for manual playtest verification.
- [x] ~~**`useAdvancedVoice` AudioContext** — never connected to speech output (always returns zeros). Either wire it up or delete the dead path.~~ RESOLVED (R64) — removed dead AudioContext, replaced with synthetic visualisation.

#### Phase 6 — Playwright E2E residue (from R50 bulk-up)

Baselines are committed as macOS `*-chromium-darwin.png`. Carried forward from [`PLAYWRIGHT_BULKUP.md`](PLAYWRIGHT_BULKUP.md):

- [x] ~~**Docker baseline regen for CI parity**~~ RESOLVED (R79.1) — 85 `*-chromium-linux.png` baselines generated and committed. Fixed Vite `allowedHosts` for Docker DNS.
- [x] ~~**Multi-viewport matrix**~~ RESOLVED (R78.7) — added mobile (375×667) + tablet (768×1024) projects. Both hit the "DESKTOP REQUIRED" gate; dedicated responsive spec covers this.
- [x] ~~**Per-game keyboard-only a11y playthroughs**~~ — done R58.
- [x] ~~**Performance budgets**~~ — done R58.
- [x] ~~**Flaky specs under full-suite parallelism**~~ RESOLVED (R78.10) — capped local workers at 4, increased game-over race timeout to 20s, bumped slow-game test timeouts to 90s, added focus-ring settle wait for landing card screenshot.

### Playtest Verification (from `rebuildingoldgames/bugs.md`)

Items the user re-flagged after the R50 playtest. R54 code audit confirms most are working correctly. P0 keyboard bug was fixed in R72 (cursor guards + waitForKeyboard retry).

- [ ] **Metris**: `B` bullet-time key — code-verified R54. **Needs live browser verification.**
- [ ] **Matrix Cloud combo bug** — code-verified R54. **Needs live browser verification.**
- [ ] **High Scores panel** — automated R58 via modals.spec.ts. **Needs user clarification on what the original "broken" report meant.**
- [ ] **Achievements panel redesign** — automated R58. **Needs user input on specific desired changes.**
- [ ] **Game card portal sizing** — code-verified R54. **P3 — cosmetic.**

---

### Phase 7 — CTRL-S World Rewrite (NEW, P3 — lowest priority)

> **Do not start until every Phase 0b / 1 / 2 / 6 item above is closed.**

**Why**: Current implementation is too buggy and too complex; accumulated state machine fragility and scope creep make piecemeal fixes unproductive. Specific re-flagged bugs from `rebuildingoldgames/bugs.md`: save crash (`gameData.stats is undefined`), ASCII title too small, story UX "glitchy and custom," pacing too rushed for flow state.

**Target stack**: **Phaser**, consistent with the other 11 games. Reuses the standard scene/input/audio patterns documented in Architecture Notes below, and will slot into the eventual `AssetManager` from Phase 1/2.

**Prior research to reuse (don't redo)**:
- [`rebuildingoldgames/plans/ctrl-s-rebuild.md`](rebuildingoldgames/plans/ctrl-s-rebuild.md) — existing Phase 1 research doc
- [`rebuildingoldgames/inspirationimagesandsprites/ctrlscitizensleeperimageinspiration/`](rebuildingoldgames/inspirationimagesandsprites) — **Citizen Sleeper** is the explicit design target for text UX, pacing, and player-in-control feel

**Content policy**: **Preserve the core story arc** — main narrative beats and key scenes stay. **Trim scope** — drop side branches, optional encounters, and any content currently broken. Cut is a deliberate design decision made during the audit, not a blanket "keep everything."

**Sub-tasks** (refine at start of phase):

1. [ ] **Audit pass** — read current `CTRLSWorld.tsx` (and any sub-files), list every scene/branch/state, tag each as `keep` / `trim` / `broken`. Commit the audit doc to `specs/` before writing any new code.
2. [ ] **Engine scaffold** — new Phaser project under `src/components/games/phaser/CtrlSWorld/` matching the layout used by Matrix Frogger / Neo Jump. BootScene, MenuScene, GameScene skeleton, GameOverScene, input handler, audio manager stub.
3. [ ] **Story engine** — data-driven scene/dialogue format (JSON or TS const) so story content is separable from engine code; port `keep`-tagged scenes.
4. [ ] **Core loop** — implement the core interaction mechanics identified in the audit (exploration + key choices + any mini-games that survive the trim).
5. [ ] **Asset wiring** — tie in the ~50 Phase 0b CTRL-S items (character bases, portraits, backgrounds).
6. [ ] **Accessibility** — rebuild satisfies the Phase 6 `aria-live` story-text requirement; do not reintroduce that gap.
7. [ ] **Tests** — unit tests for the story engine + a Playwright E2E smoke that walks the main arc end-to-end, matching coverage style of the other games.
8. [ ] **Cut-over** — remove the old DOM `CTRLSWorld.tsx` and its tests only once the new implementation passes E2E and is wired into the landing page.

---

## Deferred / Future Phases (NOT for R80)

These phases are designed + scoped but NOT scheduled. Ralph does NOT touch them during R80.

### R81 — CTRL-S Golden-Path Content Trim (SMALL, collaborative with Tom)

**Why**: R80 ports all 5 chapters + prologue as-is (migration only). Tom's call: *"The current game would take a long time to complete and test. It needs to be shortened."* R81 is the editorial pass where Tom + Ralph collaboratively trim to the golden path.

**Input**: `specs/ctrls-golden-path-trim-plan.md` (produced by R80.25).

**Expected shape**:
- Tom reviews trim plan, flags keep/cut/merge per scene
- Ralph ships trim commits per chapter (~5 iterations)
- Playtest after each chapter trim
- Target playtime: ~20-30 minutes first playthrough

### R82 — Retro iPod Classic Game-Card Redesign (MEDIUM — frontend-design heavy)

**Why**: Tom's 2026-04-16 note: *"Add that to future to plan out however it would be retro as fuuuuuck (and its what the windows are designed off in the first place and can be improved)"* — with a hand-drawn sketch showing game title overlaid on preview image, below an iPod Classic-style device body with clickwheel.

**Design brief**:
- Each portal game card becomes an **iPod Classic device visual** (rounded rectangle silhouette, metal body aesthetic in Matrix-green instead of chrome)
- **Screen area**: game preview image, with game title **overlaid on the image** (not in a separate band below) — confirmed by Tom's arrows pointing at the image-with-title
- **Clickwheel**: rendered below the screen with MENU (top), next (right), prev (left), play/pause (bottom), centre-select button. Tapping wheel segments navigates the carousel / enters the game.
- **Size reduction**: current cards are "too big" per Tom's feedback — e.g. see `e2e/playthrough/cloud-jumper.spec.ts-snapshots/cloud-jumper-01-portal-chromium-linux.png`. Target smaller footprint so grid density improves.
- **Aesthetic commitment**: *"retro as fuuuuuck"* — full iPod homage. Matrix green replaces chrome/white. Play/pause symbols in ASCII style. Clickwheel highlight uses Matrix pulse animation.
- **Imagery**: Tom will generate new/improved game preview images before R82 starts. Ralph does NOT attempt to create art; wait for Tom's image drop.

**Reference material**:
- Tom's sketch: shared 2026-04-16 (hand-drawn, iPod aesthetic)
- iPod Classic product shot: shared 2026-04-16 (for silhouette + clickwheel proportions)
- `frontend-design:frontend-design` skill — well-suited for this high-polish visual work

**Prerequisite**: Tom signs off on silhouette mockup before Ralph implements. Likely a `skill:frontend-design` mockup session first, then build.

**Acceptance**:
- All 12 game cards render as iPod devices on landing page
- Title overlays preview image as sketch specifies
- Clickwheel is interactive (keyboard + pointer) for carousel nav
- Current card size reduced by ~30%+
- Visual regression baselines regenerated
- Lighthouse a11y score maintained

**NOT in scope**:
- Changing game mechanics or content
- Touching the portal carousel logic (only the card visual)
- Mobile responsive reflow (desktop-first, noted for R83 if needed)

### R83+ (TBD)

Tom's note: *"the rest of the work will be performance and getting the games perfect"* — after CTRL-S + trim + card redesign, focus shifts to performance profiling, final polish sweeps, and ship-readiness. Planning deferred until R80/R81/R82 are closed.

---

## Architecture Notes (kept for Ralph's reference)

### Phaser Input Pattern (MUST follow)

All scenes that register keyboard input must use `waitForKeyboard()` from BaseScene:

```typescript
protected setupInput(): void {
  this.waitForKeyboard(() => {
    if (!this.input.keyboard) return;
    // ... register keys
  });
}
```

`waitForKeyboard()` polls every 50ms up to 10 times (500ms), then falls back to the scene's first `update` tick. This replaced the old single-retry `delayedCall(100)` pattern in R62.

**CRITICAL (R69, corrected R75)**: The `update()` method MUST guard against cursors/keys being undefined. Since `waitForKeyboard` is async, there is a window where `update()` fires before keys are registered. Two safe patterns:

```typescript
// Pattern 1: NARROW guard in update (REQUIRED for polling-based input)
// ⚠️ The guard MUST wrap ONLY input handling — NOT the entire update().
// Placing the guard at the top of update() freezes ALL game logic
// (physics, AI, rendering, animations) during the ~500ms keyboard init.
update(time: number, delta: number): void {
  if (this.isPaused) return;
  // Game logic runs unconditionally — no dependency on keyboard
  this.updatePhysics(delta);
  this.updateAI(delta);
  this.updateAnimations(delta);
  this.updateUI();
  // Input only when keys are ready
  if (this.cursors) {
    this.handleInput(delta);
  }
}

// Pattern 2: Event-driven input (PREFERRED — immune to race condition)
this.waitForKeyboard(() => {
  const key = this.input.keyboard!.addKey(KeyCodes.SPACE);
  key.on('down', () => this.jump());  // Fires only after key exists
});
```

**DO NOT** declare key fields with `!` (non-null assertion) and then read `.isDown` in `update()` without a guard — this throws a silent TypeError that kills the scene.

**DO NOT** place the cursor guard at the top of `update()` — this was the R72 mistake that caused the P1 freeze bug in 4 games.

### GAME_CONFIG Circular Import Pattern (CAUTION)

All Phaser games have a circular dependency: `config.ts` imports scene classes (for the Phaser config's scene array), and scene classes import `GAME_CONFIG` from `config.ts`. This is safe **only if** scene files never read `GAME_CONFIG` at module-evaluation time (i.e. at the top level of the file). All reads must be inside class methods, constructors, or lazy-evaluated functions.

**Bad** (TDZ crash):
```typescript
const { WIDTH, HEIGHT } = GAME_CONFIG;  // top-level — crashes
const C = GAME_CONFIG;                   // top-level alias — crashes
export const DATA = GAME_CONFIG.FOO.map(...);  // top-level computation — crashes
```

**Good** (safe):
```typescript
class GameScene extends BaseScene {
  private speed = GAME_CONFIG.SPEED;  // class field — evaluated at instantiation, not import
  create() {
    const { WIDTH } = GAME_CONFIG;    // inside method — safe
  }
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

### Shutdown Cleanup Pattern (MUST follow — updated R61)

All GameScene `shutdown()` methods MUST include:
```typescript
shutdown(): void {
  this.stopBackgroundMusic();
  this.time?.removeAllEvents();      // Kill all pending delayedCall/loopedCall
  this.tweens?.killAll();            // Kill all active tweens
  // ... game-specific cleanup (destroy sprites, clear arrays) ...
  if (this.input.keyboard) {
    this.input.keyboard.removeAllKeys(true);
  }
  super.shutdown();                   // Call base class cleanup
}
```

**R62**: `BaseScene.shutdown()` now handles common cleanup (pause overlay, common input keys). MenuScene, GameOverScene, and all 11 GameScenes call `super.shutdown()`. RhythmHacker MenuScene also has its own `shutdown()`.

---

## Test Coverage Status

| Game | Type | Unit Test | E2E Playthrough | E2E Visual |
|------|------|-----------|-----------------|------------|
| CtrlSWorld | DOM | Yes | Yes | -- |
| SnakeClassic | Phaser | Yes | Yes | -- |
| VortexPong | Phaser | Yes | Yes | -- |
| MatrixCloud | Phaser | Yes | Yes | -- |
| MatrixInvaders | Phaser | Yes | Yes | -- |
| Metris | Phaser | Yes | Yes | -- |
| MatrixFrogger | Phaser | Yes | Yes | -- |
| NeoJump | Phaser | Yes | Yes | -- |
| AgentChase | Phaser | Yes | Yes | -- |
| RhythmHacker | Phaser | Yes | Yes | -- |
| CloudJumper | Phaser | Yes | Yes | -- |
| CodeBreaker | Phaser | Yes | Yes | -- |

Visual regression baselines exist for landing page and shared UI (modals, portal, achievements, settings) under `e2e/visual/`.

All Phaser games expose test state via `exposeTestState()`. E2E fixtures support both React and Phaser games. E2E uses `?test=1` URL param for deterministic `Math.random` (seeded mulberry32) and DOM ready markers.

**Test infrastructure stats (R79)**: 47 unit test files, 23 E2E spec files, 98 darwin visual baselines. Categories: playthrough (12), visual (6+), a11y (1), edge-cases (1), modals (1), performance (1), responsive (1). All E2E pass. FPS budget test opt-in only (`PLAYWRIGHT_PERF=1`). All 12 games have E2E playthrough coverage; CTRL-S World missing dedicated exit-to-portal test.

---

## Current Codebase Health

### Strengths
- Zero TODO/FIXME/HACK comments in src/
- Zero `@ts-ignore` in production code (5 in test files, all justified)
- TypeScript strict mode fully enabled (noUnusedLocals, noUnusedParameters)
- All 11 Phaser games expose test state via `exposeTestState()`
- 12 games total, 100% achievement integration
- Clean separation of concerns: React wrapper + Phaser scenes via registry pattern
- Single source of truth: GAME_REGISTRY in `src/data/gameRegistry.ts`
- Code-split lazy loading for all game components
- No orphaned legacy code (cleaned up in R15)
- All unit tests passing (47 test files), build clean
- All E2E tests passing (23 spec files: 12 playthroughs + visual + a11y + performance + responsive + modal specs, 98 darwin + 85 linux baselines)
- All 12 games have complete E2E playthrough coverage with 6-checkpoint visual baselines
- GAME_CONFIG TDZ crash resolved (commit `ee18028`)

### Open Gaps
- ~~**P1 (R73)**: Over-broad cursor guards in update()~~ RESOLVED (R78.11, commit `2d27b09`) — guards narrowed to wrap only `handleInput()` in all 4 games.
- ~~**P2 (R73)**: Metris wKey dead code~~ FALSE POSITIVE — wKey IS used at `GameScene.ts:752` as rotate-CW alias. Closed R78.11.
- ~~**P2 (R73)**: Control hints text invisible in MenuScene~~ RESOLVED (R78.11, commit `05d94d7`) — changed to `PRIMARY_HEX` with `setAlpha(0.3)`.
- ~~**P2 (R69)**: Dead `return () => {}` in `useSoundSystem.ts`~~ ALREADY RESOLVED — code no longer present. Closed R78.11.
- ~~**P2 (R71)**: Dead `enableTestMode` in `e2e/fixtures/test-utils.ts`~~ ALREADY RESOLVED — symbol removed. Closed R78.11.
- ~~**P2 (R71)**: 4 hollow test cases in `ShatnerVoiceControls.test.tsx`~~ RESOLVED (R76.1) — all 30+ tests now have real assertions.
- ~~**P2 (R71)**: E2E screenshot anomalies~~ STALE — all 12 playthrough specs now pass with 6-checkpoint screenshots each. The R71 anomalies were observed before the playthrough runner was rebuilt (R78.5). Cursor guard narrowing (R78.11) also improved timing. Closed.
- ~~**E2E gap**: No test covers MenuScene "press ENTER to start" flow~~ STALE — all playthrough specs already use `autoStart=false` (App.tsx:627), capture a MenuScene screenshot (checkpoint 02), then press ENTER to transition to GameScene. The keyboard-only a11y spec also explicitly tests this path for all 11 Phaser games. Closed.
- **CTRL-S World**: only DOM/React game; current implementation too complex for incremental fixes — Phase 7 rewrite deferred
- Remaining sprite polish per game (see Phase 0b `[~]` items). ~~Audio is biggest cross-cutting gap~~ RESOLVED (R78.1) — global SFX deployed to all 11 non-CTRL-S games.
- Rhythm Hacker BPM values partially verified (R78.9) — Cyberpsychotic (140) and Enhancements (160) still need manual playtest confirmation
- No global `AssetManager` yet — each game owns its own asset loading
- Circular dependency in all Phaser games (`config.ts` <-> scene files) — fragile but functional; documented in Architecture Notes

---

## Ralph Overnight Loop Protocol (R76)

**Purpose**: Run unattended overnight. Each iteration picks ONE task, implements it, runs gates, and commits. Loop terminates only when the TERMINATOR CONDITION below is met.

### Per-Iteration Workflow

1. **READ** `IMPLEMENTATION_PLAN.md` fully. Locate the first unchecked `[ ]` task in this strict order:
   1. `R76 Global Items` (G1 → G9 in number order — G1 before anything else).
   2. `R76 Per-Game Items` (PG1 → PG22 in number order, **but P0 items take precedence**: PG2, PG7, PG8, PG10, PG14, PG19 are pulled forward ahead of lower-P items).
   3. `R76 E2E Coverage` (E1 → E2).
   4. `Phase 6 Polish Residue`.
   5. `Phase 0b Asset Deployment` (skip CTRL-S asset items — those are Phase 7).
   6. `Phase 1/2 Global Asset System`.
   7. `Phase 7 CTRL-S Rewrite` — **DO NOT open in this loop**. Stop loop instead.
2. If no unchecked task found in scopes 1–6 → see **TERMINATOR CONDITION**.
3. **Plan + implement** the task: write code, update/add tests, update docs if needed.
4. **Run gates** in this order, stop on first failure:
   - `npm run lint`
   - `npm run build`
   - `npm test`
   - `npm run test:e2e` — only if change touches gameplay, UI, routing, or scene flow.
5. **On gate failure**: fix the regression in the same iteration (max 3 fix attempts). If still red after 3 attempts, mark the task `BLOCKED: <reason>` in-place, revert the change (`git reset --hard HEAD`), and move to the next task.
6. **Update `IMPLEMENTATION_PLAN.md`**:
   - Mark the task `[x]` with iteration tag, e.g. `- [x] (R76.N) Fix ...`.
   - Append a one-line delta under `## Status`.
   - If new issues surfaced during implementation, append under a new `### Discovered Work` sub-heading — do NOT mix with the task you just closed.
7. **Commit** with conventional message: `R76.N: <task-id> <short summary>`. Use HEREDOC for multi-line bodies. Never skip hooks.
8. **Invoke the `game-tester` agent** to verify no cross-game regressions.
9. **Loop** back to step 1.

### TERMINATOR CONDITION (Ralph stops looping only when ALL of these are true)

- All R80.1 through R80.26 tasks marked `[x]`.
- `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`, `npm run test:visual` ALL green on a clean run.
- Old `src/components/games/CtrlSWorld.tsx` + `CtrlSWorld.test.tsx` deleted (verified via R80.25 cut-over).
- `public/assets/ctrl-s/` populated with sourced assets (R80.9).
- `specs/ctrls-golden-path-trim-plan.md` exists (R80.26 output for Tom's R81 review).
- The `## Status` line contains the phrase **"R80 COMPLETE — CTRL-S flagship rewrite shipped"**.
- `### R80 Completion Report` written under the R80 section with iterations/closed/discovered-work summary.

**Execution order for this run** (30-loop cap, 26 tasks — follow R80.1 → R80.26 strictly, dependencies exist):
1. R80.1 Content map (audit + spec) → 2. R80.2 Phaser scaffold → 3. R80.3 Typewriter engine → 4. R80.4 Story format + prologue
2. R80.5–7 Content ports (ch1-2, ch3-4, ch5)
3. R80.8 Choice UI
4. **R80.9 Asset sourcing from dump** (NEW — all visual/audio tasks depend on this)
5. R80.10–11 Visual systems (portraits, backgrounds)
6. R80.12–14 Overlay scenes (puzzle, inventory, chapter hub)
7. R80.15 Save integration (fix `gameData.stats` crash)
8. R80.16–18 Audio (Shatner TTS, ambient, character SFX)
9. R80.19 MenuScene polish (ASCII size)
10. R80.20 Achievement expansion
11. R80.21–22 E2E test + visual baselines
12. R80.23–24 Juice audit + recipe pass (use `juice:juice-audit` / `juice:juice-recipe` skills)
13. R80.25 Cut-over (delete old React version)
14. R80.26 Golden-path trim spec + terminator

**Pattern**: R80 uses standard complete-and-exit (like R76/R77/R79). Auto-terminator is correct. Do NOT use R78's never-terminate pattern.

**Stick-with-plan rule**: Don't invent new tasks. Discovered items → `### R80 Discovered Work` for Tom's R81+ triage, NOT into the active task list.

When terminator is reached, write `## R80 Completion Report` listing: iterations run, tasks closed, discovered-work items deferred to R81/R82, tests passing, lines of code shipped, and the verdict on whether the "rushed pacing" + "glitchy story screen" bugs are resolved in the new implementation. Then stop.

### Guardrails

- **DO NOT** open Phase 7 (CTRL-S rewrite) — deliberately deferred.
- **DO NOT** delete Phase 0b asset-pipeline work — it stays open post-R76.
- **DO NOT** skip gate steps even if the task "looks trivial".
- **DO NOT** commit on red. If a commit fails hooks, fix root cause — never `--no-verify`.
- **DO NOT** amend commits — always create a NEW commit for a fix (a failed hook means the commit didn't happen; amending would modify the PREVIOUS commit).
- Every 5 iterations: run full visual regression suite (`npm run test:visual`) and commit intentional baseline updates separately with message `R76.N-visual: baseline update`.
- If two consecutive tasks land `BLOCKED`, pause the loop and write a `⚠️ LOOP HEALTH ALERT` block under `## Status` before continuing — don't silently accumulate blockers.

### Task Ordering Rationale

- **G1–G3 first** because they are P0 global blockers (menu, BGM, achievements crash). G1 unblocks real playtesting.
- **G8 (countdown) directly after G1** — depends on MenuScene being visible.
- **G6 (pause/resume) next** — P1 but affects every game; landing it early means per-game P0s can be verified with reliable pause.
- **Per-game P0s (PG2, PG7, PG8, PG10, PG14, PG19) before P1s** — functional breakage over polish.
- **G4/G5 (card layout) and G7 (About page) slot whenever a per-game P0 is BLOCKED** — safe parallel fill-ins.
- **E1 E2E spec runs LAST** — requires everything above green. E2 visual baseline regen is absolute final step.

### Legacy Ralph Notes (R62–R75)

All items from the R75 plan have been resolved across R76–R78. See [COMPLETED_WORK.md](COMPLETED_WORK.md) for details. Items 1–13 were closed in R76–R78; items 14–15 remain as Phase 1/2 and Phase 7 entries in the active plan above.

**Skill usage**: `/matrix-arcade-gamedev` for game code, `/phaser-gamedev` for Phaser scenes, `/playwright-testing` for E2E.
Run `game-tester` agent after every code change. After any UI change, run `npm run test:visual` and commit updated baselines.
