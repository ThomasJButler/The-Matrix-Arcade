# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: R78 open — Phase 0b per-game asset deployment + Phase 6 infrastructure polish (R76 + R77 archived)

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
> - **P1 — Over-broad cursor guards RE-CONFIRMED**: All 4 affected `update()` methods verified line-by-line. Guards at MatrixFrogger:207, NeoJump:189, AgentChase:159, VortexPong:110 still block ALL game logic — rain, physics, AI, animations, timers, UI updates, and `exposeTestState()` all freeze for ~500ms during keyboard init. No changes since R74.
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
> **R71 test audit**: Last E2E run passed (0 failures). ~~43 unit test files (1838 tests)~~ now 1,855 tests. ~~21 E2E spec files, ~87 visual baselines~~ now 69+ E2E specs with 86 darwin baselines. ~~4 hollow test cases in ShatnerVoiceControls.test.tsx~~ RESOLVED (R76.1). ~~Dead `enableTestMode` export in test-utils.ts~~ RESOLVED (R76.1). FPS budget test only runs with `PLAYWRIGHT_PERF=1` env var.
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

> **R76 + R77 fully shipped and archived.** See [`COMPLETED_WORK.md § R76`](COMPLETED_WORK.md#r76--final-polish-phase) and [`COMPLETED_WORK.md § R77`](COMPLETED_WORK.md#r77--retro-arcade-scoreboard). All R62–R75 resolved items also archived in the same doc.

### Tests + Gates Status (Post-R77)

- Unit tests: 1,855 / 1,855 pass
- E2E: 69+ specs (R76 64 + R77 5) all pass
- TypeScript: clean
- Lint: clean on all changed files (14 pre-existing react-hooks warnings remain (6 in CTRL-S World, 8 intentional patterns))
- PWA + build: green

---

## R78 — Assets + Infrastructure (NEW — current overnight target)

> **Tom's call (2026-04-15)**: Combined sweep of asset deployment and CI/infra polish. Ralph walks Phase 0b per-game asset items first (big grunt work), then Phase 6 residue. Terminator: `R78 COMPLETE — assets + infra shipped`.

### R78 Scope Summary

| Stream | Scope | Est. iters |
|--------|-------|-----------|
| Phase 0b — Asset Deployment | 10 games need sprite/audio deployment (CTRL-S excluded) | 8–15 |
| Phase 6 — Infrastructure | Docker baseline, multi-viewport, form labels, BPM tuning, flaky specs | 3–5 |
| **Total** | | **~12–20** |

### R78 Task Ordering

- [x] **R78.1 — [P1]** Phase 0b audio extraction sweep (biggest cross-cutting gap: only Matrix Frogger has deployed audio). Extract from `desiredassets/TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/.../SoundEffects/` + `LongTracks/`, place per-game, wire BootScene loads.
- [x] **R78.2 — [P1]** Per-game sprite deployment pass 1 (Snake, Matrix Cloud, Metris, Invaders) — core gameplay sprites. Flip `[~]` → `[x]` in each game's `ASSETS_NEEDED.md` as sprites land.
- [x] **R78.3 — [P1]** Per-game sprite deployment pass 2 (Cloud Jumper, Matrix Frogger, Code Breaker) — polish sprites.
- [x] **R78.4 — [P1]** Per-game sprite deployment pass 3 (Agent Chase, Neo Jump, Vortex Pong) — remaining items.
- [x] **R78.5 — [P2]** Visual regression baseline regen for all games post-deployment. Commit new `*-chromium-darwin.png` baselines separately with `R78.N-visual: baseline update` message.
- [ ] **R78.6 — [P2]** Phase 6: Docker baseline regen — `docker compose -f docker-compose.playwright.yml run --rm e2e-tests npx playwright test --update-snapshots`, commit `*-chromium-linux.png` for CI parity.
- [x] **R78.7 — [P2]** Phase 6: Multi-viewport matrix — add mobile (375×667) + tablet (768×1024) projects to `playwright.config.ts`, generate baselines.
- [x] **R78.8 — [P2]** Phase 6: Form input labels (a11y) — audit all `<input>` / `<textarea>` for associated `<label>` / `aria-label`. Fix gaps.
- [x] **R78.9 — [P2]** Phase 6: Rhythm Hacker BPM tuning — hand-tune per-track BPM values after playtest confirmation. Current values are estimates.
- [x] **R78.10 — [P2]** Phase 6: Flaky E2E stabilisation — fix `landing.spec.ts:40` 1px drift, code-breaker/invaders/cloud-jumper timeouts under 5-worker parallel. Root cause: dev-server contention.
- [ ] **R78.11 — [P3]** Continuous-improvement sweep — after R78.1–R78.10 complete, each remaining loop iteration finds ONE discovered-work item and ships it. Examples: sprite polish on an under-deployed game, an a11y fix uncovered while doing R78.8, a perf micro-optimisation, a UX nit caught during visual regression review. Log each in a running `### R78 Discovered Work` sub-section under this task. This task is **intentionally never marked `[x]`** until Tom manually does so — Ralph keeps polishing until the `loop.sh` iteration cap is hit.

### R78 Discovered Work

- [x] **AttractMode useCallback cycle** (found during R78.5): `resetIdle` included `active` in its `useCallback` deps, causing the effect to immediately deactivate the attract overlay on every `active` state change. Fixed by removing `active` from deps.
- [x] **Scoreboard E2E localStorage key mismatch** (found during R78.5): Tests seeded `matrix-arcade-save` but app reads `matrix-arcade-save-data`. Fixed key + added `version: '1.3.0'` to bypass migration. Also scoped `getByText('ACE')` → `getByRole('cell', { name: 'ACE' })` to avoid matching game card subtitles.
- [x] **E2E specs/baselines not in source control** (found during R78.5): Only 4 of 108 e2e files were tracked (fixtures only). Force-added all spec files and baseline PNGs.
- **R78.6 blocked — Docker daemon not running** (found during R78.8): Docker CLI v29.2.1 installed but daemon socket not present. Docker baseline regen requires a running daemon. Deferred to next session with Docker available.
- **CTRL-S World a11y inputs** `DEFERRED-CTRLS-DEDICATED-PHASE`: CtrlSWorld.tsx has 3 unlabelled inputs (terminal command, text speed select, font size select). Will be addressed in Phase 7 rewrite.
- **Rhythm Hacker BPM/duration tuning needs manual verification** (found during R78.9): Cyberpsychotic (140 BPM) and Enhancements (160 BPM) could not be confirmed algorithmically — detection returned ambiguous results across multiple methods. These should be verified by ear during playtest. In The Moonlight (100 BPM) is likely correct. All five track durations were significantly wrong (some missing over 100s of audio).
- [x] **Lint warning reduction (20→14)** (R78.11 continuous improvement): Fixed 6 lint warnings — 2 genuine ref-cleanup bugs in AudioSettings and PuzzleModal (`timersRef.current` captured in cleanup closures), 4 missing-dependency warnings in App.tsx resolved by memoising `games` array with `useMemo`. Remaining 14 warnings are all in CTRL-S World (fenced off) or intentional patterns (circular hooks deps, mount-only effects, onClose exclusions).
- [x] **RhythmHacker control hints invisible** (R78.11): Control hints text on MenuScene used `DARK_GREEN_HEX` (#003300) — nearly invisible on black. Changed to `PRIMARY_HEX` with `setAlpha(0.3)` matching base MenuScene pattern. Also closed 2 stale P2 plan items: Metris wKey (false positive — actively used as rotate alias) and useSoundSystem dead cleanup (already resolved).
- [x] **Dead collision library + stale plan cleanup** (R78.11): Removed `src/lib/collision.ts` — 67 lines of AABB/circle/grid collision utilities written for React canvas games, entirely unused since all 12 games migrated to Phaser (which has its own physics). Updated stale R71 test audit stats, struck through outdated R75 asset status, and annotated Phase 0b partial deployment items with R78.2–R78.4 progress.

### R78 Terminator Rule (IMPORTANT — differs from R76/R77)

**R78.11 is a perpetual polish bucket, not a finish line.** Ralph MUST NOT write `R78 COMPLETE — assets + infra shipped` to the Status line automatically. The only way R78 terminates is:
1. Tom manually edits Status to contain `R78 COMPLETE` and commits it, OR
2. `loop.sh` hits its iteration cap (hard safety net).

This is a deliberate deviation from the R76/R77 pattern. Reason: Tom wants "do it 30 times and keep improving", so an early self-terminator is a bug, not a feature.

If Ralph finds R78.1–R78.10 genuinely complete but the iteration cap hasn't been hit, Ralph MUST continue with R78.11 continuous-improvement work. The goal is **do NOT exit early**; pick small polish items and ship them one per iteration.

### R78 Guardrails

- **CTRL-S stays fenced off.** No CTRL-S asset deployment. Phase 7 CTRL-S rewrite stays deferred. Tag any CTRL-S-adjacent task `DEFERRED-CTRLS-DEDICATED-PHASE` and skip.
- **No new features.** This phase is pure content + infra. If Ralph notices a gameplay bug, log it under `### R78 Discovered Work` for a future phase — do not fix.
- **Asset pipeline discipline**: for each game, follow the existing pattern documented below (Phase 0b → Asset Integration Pattern, lines 147-153): extract → process → copy to `public/assets/[game]/` → update BootScene → flip `[~]` to `[x]` in `desiredassets/[game]/ASSETS_NEEDED.md`.
- **Visual regression baselines**: intentional visual diffs from sprite swaps MUST be committed separately with `R78.N-visual: baseline update` message. Do not mix baseline updates with code changes.
- **Docker parity**: after any visual baseline update, Ralph MUST also regen the Linux baselines for CI.
- **Audio first**: audio is the biggest cross-cutting gap per the plan audit. Land R78.1 before sprite work to minimise cross-commit churn.

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

- [ ] **Docker baseline regen for CI parity** — run `docker compose -f docker-compose.playwright.yml run --rm e2e-tests npx playwright test --update-snapshots` and commit `*-chromium-linux.png` alongside the darwin ones so CI matches local.
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

**Test infrastructure stats (R71)**: 43 unit test files (1838 tests), 21 E2E spec files, ~87 visual baselines. Categories: playthrough (12), visual (5), a11y (1), edge-cases (1), modals (1), performance (1). Last E2E run: all passed. 4 hollow tests in ShatnerVoiceControls.test.tsx. FPS budget test opt-in only (`PLAYWRIGHT_PERF=1`). All 12 games have E2E playthrough coverage; CTRL-S World missing dedicated exit-to-portal test.

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
- All 1838 unit tests passing, build clean
- All E2E tests passing (12 playthroughs + 5 visual specs + keyboard-only a11y + performance budgets + modal shortcuts)
- All 12 games have complete E2E playthrough coverage with 6-checkpoint visual baselines
- GAME_CONFIG TDZ crash resolved (commit `ee18028`)

### Open Gaps
- **P1 (R73, verified R74)**: Over-broad cursor guards in update() freeze ALL game logic for ~500ms (MatrixFrogger:207, NeoJump:189, AgentChase:159, VortexPong:110) — guards need narrowing to input-only. This is the root cause of "controls don't work / press ENTER freezes" reports.
- **P2 (R73)**: Metris wKey dead code — W bound but never read in handleInput()
- **P2 (R73)**: Control hints text (#003300) invisible against black background in MenuScene
- **P2 (R69)**: Dead `return () => {}` cleanup in `useSoundSystem.ts:807-811` inside `useCallback` (never called)
- **P2 (R71)**: Dead `enableTestMode` export in `e2e/fixtures/test-utils.ts` — unused since `?test=1` migration
- **P2 (R71)**: 4 hollow test cases in `ShatnerVoiceControls.test.tsx` — mock setup with no assertions
- **P2 (R71)**: E2E screenshot anomalies — Code Breaker ball never launches, Matrix Invaders never fires, Matrix Cloud instant death, Agent Chase never reaches end state. Likely test timing issues exacerbated by frozen game logic during keyboard init — re-check after guard narrowing.
- **E2E gap**: No test covers MenuScene "press ENTER to start" flow — all playthroughs use autoStart=true, bypassing the exact path users encounter
- **CTRL-S World**: only DOM/React game; current implementation too complex for incremental fixes — Phase 7 rewrite deferred
- Remaining sprite/audio assets per game (see Phase 0b). Audio is biggest cross-cutting gap — only Matrix Frogger has deployed audio (6 files). Rhythm Hacker has 5 music tracks.
- Rhythm Hacker BPM values are estimates — needs live playtesting
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

- All R78.1–R78.11 tasks marked `[x]` with iteration tag.
- All Phase 0b per-game `ASSETS_NEEDED.md` files have `[~]` items flipped to `[x]` where deployed (or `DEFERRED-CTRLS-DEDICATED-PHASE` for CTRL-S).
- All Phase 6 residue items closed: Docker baselines present as `*-chromium-linux.png`, multi-viewport projects live in `playwright.config.ts`, form input labels audited, Rhythm Hacker BPM tuned, flaky specs stabilised.
- `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`, `npm run test:visual` ALL green on a clean run.
- The `## Status` line contains the phrase **"R78 COMPLETE — assets + infra shipped"**.
- No `BLOCKED:` markers remain, OR every remaining blocker is tagged `BLOCKED-NEEDS-HUMAN` / `DEFERRED-CTRLS-DEDICATED-PHASE`.

**Execution order for this overnight run**:
1. R78.1 — Audio extraction sweep (biggest cross-cutting gap).
2. R78.2 → R78.4 — Per-game sprite deployment passes (Snake/Cloud/Metris/Invaders → CloudJumper/Frogger/CodeBreaker → AgentChase/NeoJump/VortexPong).
3. R78.5 — Visual regression baseline regen (darwin).
4. R78.6 — Docker baseline regen (linux) for CI parity.
5. R78.7 — Multi-viewport matrix in `playwright.config.ts`.
6. R78.8 — Form input labels a11y audit.
7. R78.9 — Rhythm Hacker BPM tuning.
8. R78.10 — Flaky E2E stabilisation.
9. R78.11 — Final verification + Status terminator.

When terminator is reached, write a final summary under `## R78 Completion Report` listing: iterations run, tasks closed, tasks blocked (including any `DEFERRED-CTRLS-DEDICATED-PHASE` items), tests passing, discovered-work items deferred to R79 (or CTRL-S phase). Then stop.

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

### Legacy Ralph Notes (R75 — superseded)

The below was the R75 plan. Kept for Ralph's reference only. **Do not execute from this list — use the R76 Global/Per-Game tables above instead.**

### Immediate (R75 — fix and verify)

1. **P1 — Narrow the update() guards** (HIGHEST PRIORITY): In MatrixFrogger, NeoJump, AgentChase, and VortexPong, move the cursor/key guard so it only wraps the `handleInput()` / input-reading call. All other game logic (physics, AI, rendering, scoring, rain effects) must run unconditionally from frame 1. This is the most impactful fix — games will visually come alive immediately instead of appearing frozen for ~500ms.

   **Exact fix locations**:
   - `MatrixFrogger/scenes/GameScene.ts:207` — move guard to wrap only `handleInput()` (line ~215). Rain (210), enemies, power-ups, combos, progress check must all run freely.
   - `NeoJump/scenes/GameScene.ts:189` — move guard to wrap only `handleInput(delta)`. Parallax rain, player physics, platforms, enemies, collectibles, content generation must run freely.
   - `AgentChase/scenes/GameScene.ts:159` — move guard to wrap only `handleInput()`. Animation timer, invulnerability blink, player movement, ghost AI, agent release must run freely.
   - `VortexPong/scenes/GameScene.ts:110` — move guard to wrap only `handlePlayerInput(dt)`. Rain, ball physics, AI paddle, power-ups, goals, impact effects must run freely.

2. **P2 — Metris wKey**: Wire W to rotate CW in `handleInput()`, matching WASD convention (same as UP arrow / X key).

3. **P2 — Control hints visibility**: Change MenuScene control hints from `MATRIX_COLORS.DARK_GREEN_HEX` (#003300) to `MATRIX_COLORS.PRIMARY_HEX` (#00ff00) at `setAlpha(0.3)`.

4. **Live-browser playtest**: Open all 12 games in Chrome via `npm run dev`. Confirm: ENTER starts game from menu, controls respond immediately during gameplay, ESC/P/M/R all work, no console TypeError. This closes the R69–R74 loop.

5. **Run full test suite**: `npm test` (1838 unit tests) + `npm run test:e2e` to verify no regressions.

### E2E Coverage (R76)

6. **Add MenuScene E2E tests**: Create playthrough variants that do NOT use autoStart — test the "press ENTER to start" flow via Playwright. At minimum: one game with ENTER start, one with SPACE start, one with click START button. This ensures the menu interaction bug cannot regress.

7. **Screenshot audit follow-up**: After guard fix, re-investigate E2E anomalies:
   - Code Breaker: ball never launches (Space key not triggering)
   - Matrix Invaders: player never fires (score stuck at 0)
   - Matrix Cloud: instant game-over on first frame
   - Agent Chase: test never reaches true end state
   These are likely test timing issues, not game bugs — but verify after the guard narrowing.

### Medium (P2 — code quality)

8. **P2 — Dead cleanup in useSoundSystem (R69)**: Remove dead `return () => {}` at lines 807-811 inside `useCallback`.
9. **P2 — Dead `enableTestMode` export**: Remove from `e2e/fixtures/test-utils.ts`.
10. **P2 — Hollow unit tests**: Fix 4 empty test cases in `ShatnerVoiceControls.test.tsx` (lines 131, 333, 356, 372).

### Infrastructure (Phase 6 residue)

11. **Phase 6 Playwright residue**: Docker baseline regen, multi-viewport, flake cluster.
12. **Phase 6 polish**: Form labels, BPM tuning, performance profiling.

### Asset pipeline (Phase 0b)

13. **Phase 0a/0b**: Per-game asset deployment (skip CTRL-S until Phase 7). Audio extraction is biggest bang-for-buck — only Matrix Frogger has deployed audio out of 12 games. Rhythm Hacker has 5 music tracks but all visuals are procedural.

### Future (Phase 1/2/7)

14. **Phase 1/2**: Global `AssetManager` — optional infrastructure.
15. **Phase 7**: CTRL-S World Phaser rewrite — only after all above are closed.

### Completed

- ~~P0 — Keyboard input race condition~~ Done R62, cursor guards R72, narrowing tracked in item 1.
- ~~P1 — Shutdown cleanup~~ DONE R62.
- ~~P1 — Controls descriptions~~ DONE R62.
- ~~P1 — Console guards~~ DONE — R70 verified all 6 calls are already guarded.
- ~~P2 — setTimeout tracking~~ DONE R63.
- ~~P2 — Dead types / broken registry~~ DONE R63.
- ~~P1 — M key conflict in GameOverScene~~ DONE R68.
- ~~P2 — High score not loaded from save~~ DONE R68.
- ~~P2 — VortexPong R key bypass~~ DONE R68.
- ~~P2 — Spec consistency~~ DONE R63.
- ~~P0 — All 4 game rebuilds~~ DONE: CrossyRoad→MatrixFrogger, MatrixAscension→NeoJump, AgentEscape→AgentChase, JimmyMatrix→RhythmHacker.
- ~~NEW game: Cloud Jumper~~ DONE.
- ~~NEW game: Code Breaker~~ DONE.
- ~~E2E for all 12 games~~ DONE (12 playthrough specs + edge cases + modals + a11y + performance).

**Skill usage**: `/matrix-arcade-gamedev` for game code, `/phaser-gamedev` for Phaser scenes, `/playwright-testing` for E2E.
Run `game-tester` agent after every code change. After any UI change, run `npm run test:visual` and commit updated baselines.
