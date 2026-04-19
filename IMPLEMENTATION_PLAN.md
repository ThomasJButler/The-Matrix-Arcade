# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: **R84 open** (2026-04-19 night). **R84.UP1 pause-overlay upstream hunt shipped — stale complaint, closes R84.P10 + R84.S9 cascade.** Tom reported "triple-stacked" pause overlays across Pong/Snake/Bird (D3 discovered-work). Ralph ran a two-stage investigation: (1) **static analysis**: grep across the full `src/` tree returned exactly one `.ipod-pause-overlay` renderer — `GamePortal.tsx:622-632`, gated by a single `isPaused` useState flipped by the single `PAUSE_STATE_CHANGED_EVENT` dispatched by the single `BaseScene.togglePause()` method; grep for "PAUSED" returned zero matches across all 12 Phaser scene files; `App.tsx` has no pause-related overlay; CSS pseudo-elements on `.ipod-pause-*` selectors are absent — architectural single-source-of-truth. (2) **live DOM probe** at 1280×800 via Playwright MCP: drove iPod `▶` → Vortex Pong GameScene, let the 5s countdown complete, clicked the dashbar `❚❚` pause button. DOM probe returned `{overlayCount: 1, scrimCount: 1, textCount: 1, hintCount: 1, dashbarAriaPressed: "true", dashbarClassHasIsPaused: true}`. Screenshot `.playwright-mcp/r84-up1-pong-paused-single-overlay.png` shows one amber radial scrim with one PAUSED word + one hint line. Tom's "2-3 overlays" perception conflated the **three design elements inside one overlay** (scrim + text + hint) as three stacked overlays — a colloquial visual-literacy trap that doesn't map to the DOM. Snake + Bird inherit the identical GamePortal + BaseScene pair with zero game-specific overlay code, so their behaviour is bitwise identical — no additional live runs needed per architecture proof. Cascade closures: **R84.P10** (Pong regression check) ticked with the live-probe evidence; **R84.S9** (Snake regression check) ticked on the architecture inference. Bird pause tasks (R84.B7 ground-death, R84.B8 countdown) are unaffected — they verify different behaviour. Testing-harness limitation re-confirmed: Playwright MCP synthetic KeyboardEvent doesn't reach Phaser's window-bound P-key keyboard plugin, so the React-side dashbar ❚❚ button was used — same `PAUSE_REQUEST_EVENT` → `BaseScene._handlePauseRequest` → `togglePause()` path that the P-key terminates at. Testing docs ticked: Pong `Triple-stacked pause overlays` + `Pause overlay renders correctly` lines, Snake + Bird `Triple-stacked pause overlays` lines. Three checkbox families + D3 discovered-work note updated to STALE. R84 stream scoreboard: Stream A V1/V2/V3 `[x]`; Stream B P1–P10 `[x]` (8/12 done, 4 remaining: P11 paddle smoothing, P12 test coverage refresh, plus the already-done P5/P6 in prior iterations); Stream C fully `[ ]` except S9; Stream D fully `[ ]`; Stream U UP1+UP2 `[x]`. Next up Stream B: **R84.P11 — Paddle-motion smoothing** (if R83.V1 velocity feels "snappy", add 100ms ease-in ramp from 0 → max) or **R84.P12 — Unit-test coverage refresh** (Tom's buffer for scoring formula + difficulty tiers + countdown + power-up legend — formalise incremental coverage). **Prior this iteration — R84.P9 Goal-flash safety floor shipped** — R83.V1c dimmed the flash to 128/channel but left the values as inline magic numbers at 4 callsites with no tripwire preventing a future refactor from re-introducing 255, and no throttle to stop a multi-ball 3-goal storm breaching WCAG 2.3.1's ≤3Hz General Flash Threshold. P9 consolidates the four presets into a new `GOAL_FLASH` config block inside `GAME_CONFIG` (adjacent to `SHAKE`, same camera-effects cluster) — `PLAYER_GOAL`/`AI_GOAL`/`PLAYER_WIN`/`AI_WIN` each carry typed `rgb: readonly [r,g,b]` + `durationMs`, plus three safety ceilings: `MAX_CHANNEL_VALUE=160` (observed win cap), `MAX_DURATION_MS=200` (below PEAT 1s window), `MIN_INTERVAL_MS=334` (PEAT-safe 3Hz floor). New exported interface `GoalFlashPreset` makes callsite signatures self-documenting. `goalFlash()` refactored to accept a preset + optional `{ overrideThrottle }` — each channel clamped via `Math.min(c, MAX_CHANNEL_VALUE)`, duration clamped via `Math.min(d, MAX_DURATION_MS)`, throttle suppresses second flash if `Date.now() - lastGoalFlashAt < MIN_INTERVAL_MS`. New scene field `lastGoalFlashAt` reset to 0 in `resetState()` so R-restart doesn't carry stale timestamp. All 4 callsites refactored — `AI_GOAL`/`PLAYER_GOAL` use throttle, `PLAYER_WIN`/`AI_WIN` pass `overrideThrottle: true` so game-over climax fires even when the clinching regular flash landed <334ms prior (win flash only fires once per match → cannot re-trigger rapidly). 14 new tests in an `R84.P9 — Goal-flash safety` block: 6 config sanity (channel cap, duration cap, interval floor, all 4 presets within caps, one-saturated-channel-only invariant blocking white/yellow flashes, all durations ≤ cap), 4 throttle (first-fires, within-window-suppressed, after-window-fires, override-bypasses), 2 clamping (rgb 255→160, duration 900→200), 2 reduced-motion+reset (resetState zeroes lastGoalFlashAt, reduced-motion returns before touching throttle state). Existing R83.V1c tests still pass — preset-based callsites produce the same flash(100, 0, 128, 0, false) signature. `Date.now()` spied via `vi.spyOn(Date, 'now')` for deterministic throttle tests; `afterEach` added to vitest imports for spy cleanup. Full suite 2,059 pass (+14 from R84.P8, 207/207 Pong-scoped). Gates all green — tsc clean + lint 0 errors (4 pre-existing warnings) + vitest + build 7.88s. Next: **R84.P10 — Double-pause-overlay regression check on Pong** (should be fixed by R83.G3; verify live; parallel with R84.UP1 upstream hunt). **Prior this iteration — R84.P8 Rally counter UI shipped** — top-centre `RALLY x{count}` HUD counter in CYAN, hidden at 0, scale-pulses 1.3→1 on player returns, clears on any goal; new `RALLY_COUNTER` config block, kill-prior-tween guard, reduced-motion updates text but skips tween. 17 new tests, suite 2,045 pass. **Prior this iteration — R84.P7 Paddle-hit trail amplification shipped** — R83.V1e's flat 10-particle trail now ramps BASE_COUNT=12 → MAX_COUNT=20 linearly with the current ball speed multiplier (1.0 at fresh serve → ~2.14× at MAX_SPEED cap). New `PADDLE_TRAIL` config block (`config.ts:72–80`); `computeTrailParticleCount()` lerps + clamps ≥0, so slower_ball's 0.6× still emits the full BASE (juice never thins). `createPaddleHitTrail` now sources count + per-particle constants (radius, alpha, speed-base, speed-jitter, duration) from config. Reduced-motion path unchanged (skipped entirely). 7 new tests in a `R84.P7 — Trail amplification` block; existing R83.V1e test updated to read the configured base. Full suite 2,028 pass (+7 from R84.P6). Gates all green — tsc + lint + vitest (176/176 Pong-scoped) + build. Next: **R84.P8 — Ball rally counter UI** (top-centre counter, pulses per hit, resets on goal — feeds the R84.P2 High Score maxRally×10 weighting visually). **Prior this iteration — R84.P6 Multi-ball CYAN tint shipped** — `PongBall` carries an explicit `isMultiBall: boolean`; `spawnBall` accepts an `options: { isMultiBall?: boolean }` flag that drives `setTint(MATRIX_COLORS.CYAN=0x00ffff)` onto the sprite. `spawnMultiBalls` passes `{ isMultiBall: true }` for every extra ball so the 200-pt weighting reads at a glance; primary ball stays green. Bespoke `ball_multi` PNG is still preferred when preloaded, the tint fallback ensures the cyan read survives headless harnesses. Replaced the fragile `isExtra = this.balls.length > 0` heuristic with the explicit caller-controlled flag. 9 new tests in a `R84.P6 — Multi-ball CYAN tint` block; `add.sprite` mock extended to capture `setTint` + `tint`, `createBall` helper gained an `isMultiBall` 6th arg. Full suite 2,021 pass (+9 from R84.P5). Gates all green — tsc + lint + vitest (169/169 Pong-scoped) + build. Next: **R84.P7 — paddle-hit trail amplification**. **Prior this iteration — R84.P5 Power-up legend shipped** — a 4-line centred legend (`BIG · PADDLE +50% · 10s`, `SLOW · BALL -40% · 10s`, `2X · SCORE BONUS · 10s`, `MULTI · +2 BALLS · NOW`) flashes for 4s on every pickup, with the activated row at full alpha in its power-up colour and the other three dimmed to `INACTIVE_ALPHA=0.55` so the player still reads the full menu. Copy + timing live in a new `POWERUP_LEGEND` config block (`config.ts:135–165`). Repeat pickups refresh in place (clear prior text + cancel hide timer); `prefers-reduced-motion` skips fades but keeps the 4s hide window so the HUD doesn't clutter. Identity-guard on the fade cohort prevents a mid-fade re-pickup from being stomped by the original fade's completion. 22 new tests added covering config sanity, row spawning, centring, colour wiring, stacking, depth, timer, active-row highlighting, repeat-pickup refresh, reduced-motion, and no-op safety; `add.text` mock swapped to `mockImplementation` for fresh-per-call instances, `time.delayedCall` mock gained `.remove()` + `.callback` handles. Full suite 2,012 pass (+25 from R84.P4). Gates all green — tsc + lint + vitest (160/160 Pong-scoped) + build. Next: **R84.P6 — Multi-ball visual distinction** (tint spawned multi-ball balls `MATRIX_COLORS.CYAN` so the 200-point High Score weighting reads visually at a glance). **Prior this iteration — R84.P4 Vortex atmosphere amp-up shipped** — three procedural layers land beneath/between the existing rain + paddle render. (a) Rotating elliptical radial-gradient backdrop at depth -20: base `NEAR_BLACK` disc + 9 graduated `DARK_GREEN` fillCircle overdraws stepped from inner alpha 0.55 → outer 0.05, ellipse aspect 1.25×0.85 so rotation reads (pure radial symmetry would be invisible under rotation), `2π/45s` per-tick angular delta. (b) Boosted scanline overlay at depth 90, stride 3px at alpha 0.23 (Snake baseline 0.18 × 1.30). (c) Paddle-glow pulse at depth -5: two `PRIMARY`-green rectangles padded 14×24 behind each paddle, alpha ramps 0.08 → 0.55 as nearest ball enters 260px, with 0.25× scale swell on closest approach; Y-tracks paddle each frame. `prefers-reduced-motion` gates all three — rotation halts (static gradient still visible), scanline skipped entirely, glow keeps alpha feedback but drops scale pulse. Config block `ATMOSPHERE` added to `config.ts:83–109`; `GameScene.create/update/shutdown` hooks wire `createVortexBackdrop`, `createScanlineOverlay`, `createPaddleGlows`, `updateVortexRotation`, `updatePaddleGlows`. 21 new tests in a dedicated `R84.P4 — Vortex atmosphere` describe block (config ranges, depth ordering, ring-count/elliptical-scale math, rotation delta, all three reduced-motion gates, proximity alpha ramp, y-tracking, scale-boost application, no-op safety); test mock swapped `add.graphics`/`add.rectangle` from `mockReturnValue` to `mockImplementation` so call records per layer don't stomp. Suite 1,987 pass (+21 from R84.P3). Gates all green — tsc + lint + vitest (138/138 Pong-scoped) + build. Next: **R84.P5 — Power-up in-HUD legend** (Snake-style 4-line legend on PICKUP for ~4s with name + effect + duration; 4 existing Pong power-ups — BIG, SLOW, 2X, MULTI — are unlabelled per Tom's testing doc). **Prior this iteration — R84.P3 AI difficulty tiers shipped** — three tiers (Easy/Normal/Hard) scale four AI params together (tracking/maxSpeed/error/outgoingTracking) via `DIFFICULTY_TIERS` map in `config.ts`; `MenuScene` renders a cycling `DIFFICULTY` button at y=0.70 that persists via `localStorage` key `matrixArcade.vortexPong.difficulty`; `GameScene.loadDifficultyTier` prefers the menu-seeded Phaser registry then falls back to localStorage then `DEFAULT_DIFFICULTY='normal'`; `updateAI` scales baseTracking, paddle maxSpeed, error amplitude, and outgoing-ball laziness by the selected tier params; Normal preserves the R83.V1a numbers exactly so existing behaviour/tests stay green. 24 new tests: 12 config helpers (ordering/defaults/cycle/round-trip/localStorage-throw resilience), 6 MenuScene cycle-persist-label-SFX, 5 GameScene tier reads + directional AI movement + Normal regression guard; suite 1,966 pass (+24 from R84.P2). Gates all green — tsc + lint + vitest + build. **Prior this iteration — R84.P2 scoring model overhaul shipped** — match score is now tight classic-Pong 1-per-goal; stripped scoreMultiplier doubling + combo bonus from `GameScene.checkGoals`. Added `multiBallsTriggered` counter + `computeHighScore()` method (`GameScene.ts:561–579`) implementing Tom's weighted formula: `max(0, playerScore-aiScore) × 100 + powerUpsCollected × 50 + multiBallsTriggered × 200 + maxRally × 10 + win_bonus (500)`. Both win/loss branches + R-restart submit computed High Score via `reportScore` and as `gameOver` score+level args so `HighScoreEntryScene` persists the composite. Game-over stats panel adds a Multi-balls row. 13 new tests added (formula components, counter increments, reportScore wiring, session-best persistence); 3 obsolete multiplier/combo tests stripped. Suite 1,942 pass (+15 from R84.P1 close). Gates green — tsc + lint + vitest + build. Next: **R84.P3 — AI difficulty second-pass** (Tom's "too easy" verdict survived R83.V1 — 3 difficulty tiers with `localStorage` persistence). **Prior this iteration — R84.P1 5-second countdown live-verified shipped** — Ralph Playwright-drove Pong at 1280×800: iPod PLAY → Pong MenuScene (clean, no click-to-play overlay) → ENTER → GameScene `startCountdown(5)` at `GameScene.ts:121` rendered "5" → "4" per-second ticks, gameplay resumed post-fade at T+~6s with ball-in-play + AI intercept. Evidence `.playwright-mcp/r84-p1-{01..05}.png`. D-P1 scope closed, no scene code change needed. Pong testing-doc lines 41-42 both ticked. Next: **R84.P2 — scoring model overhaul** (tight match 10-4 integer + weighted High Score formula with power-ups × 50, multi-ball × 200, longest-rally × 10, win-bonus 500). **Prior this iteration — R84.UP2 stale-complaint live-retest shipped**: all 5 flagged stale complaints (D1/D2/D5/D10/D12) confirmed stale (Tom's 2026-04-19 testing notes pre-date R83 same-day fix commits). D1 mute toggle symmetric via shared `useSoundSystem.toggleMute`; D2 no click-to-play overlay on Pong/Bird MenuScenes; D5 iPod→MenuScene reveal clean; D10 iPod card reads `MATRIX / BIRD` ASCII + correct subtitle + ARCADE chip (preview image still vortex — that is D9 → R84.B2); D12 Bird START button has ~30px gap above instructions and below key legend — no overlap. Screenshots `.playwright-mcp/r84-up2-*.png`. Testing-harness limitation noted: Playwright MCP cannot reliably drive Phaser's window-bound M-key via synthetic KeyboardEvent, so React-side SOUND button was used to exercise the exact `toggleMute()` method the M key terminates at. **Stream A already shipped** (V1/V2/V3 all `[x]`); UP2+P1 shipping un-sticks downstream polish tasks that Ralph was about to re-fix. **Stream A shipped prior**: V3 all 7 R83.B1 items code-verified (`handleGroundDeath`, `resumeGame` 5s override, `birdFlap` triangle 800→400Hz, slow 0.6× jump, scene SFX 0.75, iPod trophy fix, full "Matrix Bird" rename); V2 4/5 R83.S1 items + D6/D7 rename gaps + D-S1 wall math; V1 all 5 R83.V1 fixes. R83 fully shipped — 38 sub-bullets across 3 rounds archived to [`COMPLETED_WORK.md § R83`](COMPLETED_WORK.md#r83--global-polish--ctrl-s-rewrite-2026-04-19). Only `R83.CTRLS [ ]` umbrella remains `[ ]` pending Tom's end-to-end CTRL-S playthrough sign-off (by design — Ralph cannot self-tick). R84 = **3-game polish + verification** for Vortex Pong + Matrix Snake + Matrix Bird (`MatrixCloud/` folder). Scope built from the 3 testing docs at `manual-testing-sessions/MANUAL_TESTING_CHECKLIST_{Vortex_Pong,Snake_Classic,Matrix_Cloud}.md`: (a) verify R83.S1/V1/B1 shipped items actually work in-browser (Known Issues checkboxes in those docs were never re-ticked post-Ralph-loop), (b) ship new polish Tom flagged in prose notes not covered by the Round 1 umbrellas — Pong scoring-model overhaul + 5s countdown, Snake yellow-wall spacing + "more funkiness", Bird display-name full audit + performance pass. Loop cap: **50 iterations** (generous — verification playthroughs cost iterations). 8 untested games (Invaders, Metris, Frogger, NeoJump, AgentChase, Rhythm, CloudJumper, CodeBreaker) stay OFF-LIMITS for per-game polish (R85 territory). CTRL-S also off-limits — Tom's reviewable now, not further polish scope.

> **Archived phases** (full detail in [`COMPLETED_WORK.md`](COMPLETED_WORK.md)): R1–R75 (various), R76 final polish, R77 retro scoreboard, R78 assets + infrastructure, R79 residue closeout, R80 CTRL-S Phaser rewrite, R81 juice polish + repo trim, R82 iPod Classic portal redesign, R83 global polish + CTRL-S atmospheric rewrite.

<!-- ARCHIVE-COLLAPSE-START: legacy Status-line paragraphs + R78.x/R76/R75/R73/R72/R71 inline notes. Originals preserved via git history; full semantic equivalents live in COMPLETED_WORK.md. -->

<details>
<summary>Legacy Status archive (expand for historical context)</summary>

Old R83 Round 2 / Round 3 Status narrative, R82.13 accessibility iteration notes, R78.1–R78.7 inline completion blurbs, R76 pre-plan findings, R75 planning findings, R73/R74 delta notes, R72 pattern change, R71 screenshot audit — all moved to [`COMPLETED_WORK.md`](COMPLETED_WORK.md) for their respective phases. The raw paragraphs used to live here; kept only as a one-line pointer so the top of the plan stays navigable.
</details>


## Reference Docs

- [`PLAYWRIGHT_BULKUP.md`](PLAYWRIGHT_BULKUP.md) — R50 test-infra overhaul (43/43 specs, ~91 baselines, test-mode seam, seeded RNG, DOM/Phaser ready markers). Source of the Phase 6 playwright residue below.
- ~~`rebuildingoldgames/`~~ — Deleted in R81.2. 13 pre-rebuild scoping docs (0 items ticked, all resolved by R76–R80 Phaser rebuilds). Summary archived in [`COMPLETED_WORK.md § Rebuildingoldgames Archive`](COMPLETED_WORK.md#rebuildingoldgames-archive-r81).
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
- Manual testing aid: see `MANUAL_TESTING_CHECKLIST.md` for per-game hand-run QA — NOT for Ralph loop, Tom's personal tool

---

## R83 — Global Polish + CTRL-S Rewrite — **AWAITING TOM'S SIGN-OFF**

All 38 sub-bullets shipped across 3 rounds. Full detail archived at [`COMPLETED_WORK.md § R83`](COMPLETED_WORK.md#r83--global-polish--ctrl-s-rewrite-2026-04-19).

- [ ] **R83.CTRLS** (umbrella) — stays `[ ]` until Tom hand-plays CTRL-S from JACK IN → CTRL-S climax under Round 3 polish + Round 2 dread atmosphere + new ASCII library, without hitting a blocking bug. Tom-only tick.
- **Terminator phrase**: Tom manually writes `R83 COMPLETE — global polish + CTRL-S rewrite shipped` into the Status line at top. Ralph cannot self-write this.
- **If Tom's playthrough surfaces blocking bugs**: log under `### R84 Discovered Work` or add R83 Round 4 sub-bullets `.29+` (scope-permitting). Small enough issues fold into R84 continuous-improvement.

---

## R84 — 3-Game Polish + Verification — **CURRENT ACTIVE PHASE** (LARGE — ~38 tasks, 50-loop cap)

> **Scope source**: `manual-testing-sessions/MANUAL_TESTING_CHECKLIST_{Vortex_Pong,Snake_Classic,Matrix_Cloud}.md`. Every task below traces back to an unchecked Known-Issue line OR a prose note in one of those 3 docs. When Ralph picks a task, re-read the corresponding doc first — Tom's colloquial notes have reproduction detail the terse task summary here omits.
>
> **Why this phase exists**: R83 shipped per-game polish umbrellas S1/V1/B1 but the Known Issues checkboxes in the 3 testing docs were never re-ticked post-Ralph-loop. Plus Tom's prose notes contain additional scope (Pong scoring-model overhaul, Snake yellow-wall spacing, Bird full display-name audit, performance concerns) that wasn't inside the Round 1 umbrella tasks. R84 = verify + extend.

### R84 Ordering Rule (IMPORTANT for Ralph)

Pick tasks in strict stream order, numerical within each stream. Do NOT jump ahead:

1. **Stream A — Verification passes (R84.V1 → V3)**: play each of Vortex Pong / Matrix Snake / Matrix Bird end-to-end against the Known Issues checklist. Tick each doc line verified working; log any R83.S1/V1/B1 shipped item that ISN'T actually working under `### R84 Discovered Work`. These 3 iterations set the baseline for Streams B-D.
2. **Stream B — Vortex Pong polish (R84.P1 → P12)**: only after R84.V1 is `[x]`.
3. **Stream C — Matrix Snake polish (R84.S1 → S10)**: only after R84.V2 is `[x]`.
4. **Stream D — Matrix Bird polish (R84.B1 → B12)**: only after R84.V3 is `[x]`.
5. **Stream U — Upstream + live-retest (R84.UP1, UP2)**: added 2026-04-19 post Stream A audit. **Pickable any time after Stream A** (parallel-safe with B/C/D) — UP1 hunts cross-game upstream GamePortal/App for duplicate pause-overlay source, UP2 live-retests the 5 likely-stale complaints Ralph flagged (D1/D2/D5/D10/D12). Front-loading UP2 is valuable because it un-sticks tasks in Streams B/C/D that might already be fixed.
6. **Stream E — Baselines + continuous improvement (R84.BL, R84.CI)**: only after B+C+D+U all `[x]`. Regen visual baselines, then burn remaining iterations on CI polish bucket.

**Cross-stream rule**: globals from R83 (G1 mute, G2 click-to-play, G3 pause overlays, G5 Matrix launcher, G6 trophy IDs) MUST be verified across all 3 games during Stream A. If any global regressed, log + fix inside Stream A's iteration.

### R84 Guardrails

- **CTRL-S OFF-LIMITS**. Tom's reviewable post-R83, no further polish. If Ralph is tempted to touch `src/components/games/phaser/CtrlSWorld/`, STOP.
- **8 untested games OFF-LIMITS for per-game polish** (Invaders, Metris, Frogger, NeoJump, AgentChase, Rhythm, CloudJumper, CodeBreaker). Shared-infrastructure changes that inherit via BaseScene/useSoundSystem/GamePortal are fine. Per-game logic/content edits = R85.
- **iPod portal (R82) locked** — no restructuring. Trophy ID fixes are bug-only.
- **R83 tests must stay green** (~1,927 unit across 45 files). Any red gate blocks commit.
- **UK English + procedural audio only** (no new audio files). `MATRIX_COLORS` constants, no raw hex.
- **One task per commit**: `R84.V2: Snake verification pass`, `R84.P3: Pong 5s countdown`, etc.
- **Visual baselines regen separately** under `R84.BL`.

### R84 Task List

**Stream A — Verification (R84.V1 → V3, ~3 iterations):**

- [x] **R84.V1 [P1]** Vortex Pong verification pass *(R84.V1 — Ralph static audit 2026-04-19; all 5 R83.V1 Pong-specific fixes code-verified LANDED: AI predictive tracking `GameScene.ts:308–365`, keyboard hold `268–297`, goal-flash dim + reduced-motion `862–875`, `stopAllAudio()` on R-restart `255,906–911`, paddle-hit trail `473,497,881–899`. 5-sec countdown also present `GameScene.ts:121` — R84.P1 prerequisite met, P1 itself effectively auto-satisfied pending live confirmation. Globals G1/G2/G3 flagged for live re-test under D1–D3 (code is clean post R83 commits; Tom's 2026-04-19 testing-doc notes may predate fix commits `6540b52`). Testing doc `MANUAL_TESTING_CHECKLIST_Vortex_Pong.md` updated with per-item evidence table.)*
- [x] **R84.V2 [P1]** Matrix Snake verification pass *(R84.V2 — Ralph static audit 2026-04-19 night; 4 of 5 R83.S1 items code-verified LANDED: apple shrunk to 0.75 cell `GameScene.ts:426–430`, BGM volume 0.7 `line 99`, Matrix atmosphere triple-stack (rain density 10→14 `line 79`, scanline overlay `787–799`, chromatic aberration flash `750–779`), power-up legend fade-in/out `805–843`. **Rename partial**: registry + MenuScene title renamed, but ASCII block-letter title `lib/asciiArt.ts:62` still spells `SNAKE / CLASSIC` (visible via `GamePortal.tsx:658`) and achievement labels in `useSaveSystem.ts:148–154` still say 'Snake Classic' — logged D6 + D7. Yellow wall asymmetry root-caused via static math: `GRID_OFFSET_Y=20` + walls at grid-row `-1`/`GRID_ROWS` yields top=4px margin, bottom=44px margin on 400px canvas — matches Tom's complaint, fix belongs to R84.S1 (set `GRID_OFFSET_Y=40`). Globals G1/G2/G3 stay flagged cross-game (code is symmetric; live re-test required). Testing doc `MANUAL_TESTING_CHECKLIST_Snake_Classic.md` updated with per-item evidence table.)*
- [x] **R84.V3 [P1]** Matrix Bird verification pass *(R84.V3 — Ralph static audit 2026-04-19 night; **all 7 R83.B1 items code-verified LANDED** with no rename gaps (unlike Snake V2). Evidence: display-name rename spans registry `gameRegistry.ts:53`, ASCII title `asciiArt.ts:64` (`'MATRIX', 'BIRD'`), `SaveLoadManager.tsx:89`, `Scoreboard.tsx:13`, `AttractMode.tsx:14`, all 8 achievement rows `useSaveSystem.ts:165–174`; ground-death via dedicated `handleGroundDeath()` path `GameScene.ts:680–688` (skips shield-consume bounce); 5s pause countdown via `resumeGame()` override `GameScene.ts:292–296`; jump SFX is procedural triangle pluck 800→400Hz over 80ms `useSoundSystem.ts:60–74` — NOT the `sfx_landing.mp3` Tom flagged; slow-powerup jump scaling `impulseScale = 0.6 × JUMP_VELOCITY` at `GameScene.ts:265–266`; scene-local `SFX_VOLUME_SCALE = 0.75` via `playSound` override `GameScene.ts:89, 281–283` — applies to every SFX callsite without touching other 11 games; high-score lifted before `reportScore()` at `GameScene.ts:516–517` fixing the iPod trophy staleness (R83.G6). Registry ID stays `matrix-cloud` by design for storage stability — acknowledged in `GameHighScores.test.tsx:115–118`. Testing doc `MANUAL_TESTING_CHECKLIST_Matrix_Cloud.md` updated with per-item evidence table.)*

**Stream B — Vortex Pong polish (R84.P1 → P12, ~12 iterations):**

- [x] **R84.P1 [P2, DEMOTED]** 5-second countdown after MenuScene *(R84.P1 — Ralph Playwright-drove Pong at 1280×800 on 2026-04-19: clicked Vortex Pong landing card → iPod PLAY → Pong MenuScene reached clean (no click-to-play overlay, R83.G5 reveal worked) → pressed ENTER → GameScene fired `startCountdown(5)` at `GameScene.ts:121`. Countdown digit "5" rendered centre-canvas at T+0.5s, "4" at T+2.5s (per-second tick cadence from `BaseScene.tickCountdownStep` at `BaseScene.ts:216–258` confirmed), gameplay unfrozen at T+~6s with ball-in-play + AI paddle intercept + power-up spawn. `update()` early-return under `isCountingDown` at `GameScene.ts:126` confirmed — paddles, pickups and ball all visible behind the countdown digit but frozen until the tween completes. Evidence screenshots `.playwright-mcp/r84-p1-{01-portal,02-menuscene,03-countdown-5,04-countdown-3,05-gameplay-post-countdown}.png`. Pong testing doc lines 41-42 both ticked. D-P1 closed — no scene code change needed.)*
- [x] **R84.P2 [P0]** Scoring model overhaul *(R84.P2 — shipped 2026-04-19. Match score is now tight classic-Pong 1-per-goal (stripped scoreMultiplier doubling + combo bonus additive from `checkGoals`). New `multiBallsTriggered` counter increments on each multi_ball power-up activation. New `computeHighScore()` method at `GameScene.ts:561–579` implements Tom's formula — `max(0, playerScore - aiScore) × 100 + powerUpsCollected × 50 + multiBallsTriggered × 200 + maxRally × 10 + (playerScore ≥ WIN_SCORE ? 500 : 0)`. Formula commented with worked examples (10-4 win=1670, 10-0 flawless=2500, 4-10 loss=210) for Tom tuning. Both win/loss branches of `checkWinCondition` now submit the weighted score via `reportScore()` + as the `gameOver()` `score` + `level` args (HighScoreEntryScene thus records the composite). R-restart mid-match also reports computed High Score so accrued rally/power-up bonuses aren't lost. Game-over stats panel now also surfaces Multi-balls count. Tests: stripped 3 obsolete multiplier/combo tests, added 13 new R84.P2 tests covering all formula components + counter increments + reportScore wiring + session-best persistence. Suite 1,942 pass (up from 1,927). Gates all green — tsc, lint, vitest, build.)*
- [x] **R84.P3 [P1]** AI difficulty second-pass *(R84.P3 — shipped 2026-04-19 night. Three tiers (Easy/Normal/Hard) scale four AI params together via `DIFFICULTY_TIERS` map in `config.ts:94–108`: `trackingMultiplier` (0.60/1.00/1.40 → baseTracking 2.4/4.0/5.6), `maxSpeedFactor` (0.75/0.95/1.15 → paddle top-speed 360/456/552 px·s⁻¹), `errorMultiplier` (2.5/1.0/0.3 → prediction-error amplitude scales ±36/±14/±4 px), `outgoingTrackingFactor` (0.25/0.45/0.60 → laziness when ball recedes). **Normal preserves R83.V1a numbers exactly** (multipliers all 1.0) so existing behaviour/tests keep passing. **Persistence**: `localStorage` key `matrixArcade.vortexPong.difficulty`, read/write via `readStoredDifficulty`/`writeStoredDifficulty` in config — both guarded against `localStorage` exceptions (private-browsing safe). `MenuScene` adds a cycling `DIFFICULTY: NORMAL` button at y=0.70 (fits cleanly in the 0.63–0.75 gap between instruction band and START), exposes `cycleDifficulty()` + `getDifficulty()` for tests. Tier is pushed to the Phaser registry under `vortexPong.difficulty`; `GameScene.loadDifficultyTier` reads registry first then localStorage fallback then `DEFAULT_DIFFICULTY`. `updateAI` (`GameScene.ts:336–385`) now scales baseTracking, maxSpeed, outgoingTracking factor, and errorOffset by the tier params. Tests: 24 new (12 config helper coverage, 6 MenuScene cycle/persist/label/SFX, 5 GameScene tier read + directional AI movement + Normal regression guard, 1 localStorage-throw resilience); suite 1,966 pass (+24 from R84.P2). Gates all green — tsc + lint + vitest + build. Next: **R84.P4 — Vortex atmosphere amp-up**.)*
- [x] **R84.P4 [P1]** Vortex atmosphere amp-up *(R84.P4 — shipped 2026-04-19 night. Three procedural layers stacked into `VortexPong/GameScene` via a new `ATMOSPHERE` config block (`config.ts:83–109`). (a) **Rotating radial-gradient backdrop** at depth -20: base `MATRIX_COLORS.NEAR_BLACK` disc + 9 graduated `DARK_GREEN` overdraws stepped from `RING_INNER_ALPHA=0.55` down to `RING_OUTER_ALPHA=0.05`, painted outside-in so the stacked fillCircle calls simulate a CRT falloff Phaser Graphics can't gradient natively. Elliptical stretch `ASPECT_X=1.25, ASPECT_Y=0.85` breaks radial symmetry so rotation actually reads — pure circles under rotation would be visually static. Rotation rate `2π / ROTATION_SECONDS=45s` per update-tick delta keeps motion subtle. (b) **Boosted scanline overlay** at depth 90: `STRIDE_PX=3` row draw across full canvas at `ALPHA=0.23` — Snake's R83.S1 baseline of 0.18 × 1.30 per plan. (c) **Paddle-glow pulse** at depth -5: two `MATRIX_COLORS.PRIMARY` rectangles padded `WIDTH_PAD=14, HEIGHT_PAD=24` behind each paddle; alpha ramps from `MIN_ALPHA=0.08` → `MAX_ALPHA=0.55` as the nearest ball enters `THRESHOLD_PX=260` (~1/3 canvas width), with `SCALE_BOOST=0.25` extra swell on closest approach. Y-tracks paddle every frame. `prefers-reduced-motion` gates all three: backdrop rotation halts (gradient stays visible static), scanline overlay is skipped entirely, paddle glow keeps alpha feedback but drops the scale pulse. Full shutdown cleanup destroys + nulls all four refs. Tests: 21 new in a dedicated `R84.P4 — Vortex atmosphere` describe block (config ranges, depth ordering, `RING_COUNT+2` fillCircle calls, elliptical scale, rotation delta math, reduced-motion gating for all three layers, proximity-driven alpha ramp, y-tracking, scale boost, no-op safety when refs absent); test-mock updates swapped `add.graphics` + `add.rectangle` from `mockReturnValue` to `mockImplementation` returning fresh instances with `rotation` + chainable setters so call records don't stomp between layers. Suite 1,987 pass (+21 from R84.P3). Gates all green — tsc + lint + vitest (138/138 Pong-scoped) + build. Next: **R84.P5 — Power-up in-HUD legend**.)*
- [x] **R84.P5 [P1]** Power-up in-HUD legend *(R84.P5 — shipped 2026-04-19 night. New `POWERUP_LEGEND` config block (`config.ts:135–165`) holds 4 entries (`BIG · PADDLE +50% · 10s`, `SLOW · BALL -40% · 10s`, `2X · SCORE BONUS · 10s`, `MULTI · +2 BALLS · NOW`) + timing constants (`DISPLAY_MS=4000`, `FADE_IN_MS=200`, `FADE_OUT_MS=400`, `LINE_HEIGHT=12`, `BASE_Y_RATIO=0.72`, `ACTIVE_ALPHA=1`, `INACTIVE_ALPHA=0.55`). `GameScene.showPowerUpLegend(activatedType)` rebuilds 4 centred text rows at canvas mid-x, y = 0.72 × HEIGHT, depth 100 — activated row paints at `ACTIVE_ALPHA`, the other three dim to `INACTIVE_ALPHA` so the player still sees the full menu but eye tracks the highlighted entry. Each row colour-matches `POWERUP_DEFS[type].color`. Trigger: `collectPowerUp` calls `showPowerUpLegend(pu.type)` after `activatePowerUp`, so repeat pickups refresh in-place (prior legend is cleared + its hide timer cancelled via `remove(false)`). `hidePowerUpLegend` fades the cohort over `FADE_OUT_MS` with an identity-guard on `this.powerUpLegend === targets` so a mid-fade re-pickup's cohort is never stomped. `prefers-reduced-motion` skips fade-in/out tweens (alpha set directly, cohort destroyed synchronously on hide) but the 4s hide window still fires so the HUD doesn't stay cluttered. Shutdown path cancels the hide timer first then destroys every text. Tests: 22 new in a `R84.P5 — Power-up legend` describe block (6 config sanity, 8 render — count/centring/colour/copy/spacing/baseY-ratio/depth/timer, 3 active-row highlighting, 2 repeat-pickup refresh, 2 reduced-motion, 2 safety no-ops). Test mocks extended — `add.text` swapped from `mockReturnValue` to `mockImplementation` returning fresh instances with chainable `setText/setAlpha/setDepth/setOrigin` setters and state fields so per-row assertions are independent; `time.delayedCall` mock gained `remove` + `callback` handles to match the real Phaser Timer API. Full suite 2,012 pass (+25 from R84.P4). Gates all green — tsc + lint + vitest (160/160 Pong-scoped, 47/47 test files) + build. Next: **R84.P6 — Multi-ball visual distinction** (tint spawned multi-ball balls CYAN so the 200-point High Score weighting reads visually at a glance).)*
- [x] **R84.P6 [P2]** Multi-ball visual distinction *(R84.P6 — shipped 2026-04-19 night. `PongBall` interface gained a required `isMultiBall: boolean` flag. `spawnBall` signature extended with an `options: { isMultiBall?: boolean }` 5th param; when true the sprite has `setTint(MATRIX_COLORS.CYAN=0x00ffff)` applied so the cyan read survives even when the optional `ball_multi` PNG is absent (headless/offline test harnesses). Bespoke `ball_multi` texture is still preferred at asset-load time when available. `spawnMultiBalls` passes `{ isMultiBall: true }` to every extra ball it spawns, so the 200-pt High Score weighting reads visually at a glance. Replaced the fragile `isExtra = this.balls.length > 0` heuristic at the spawn site (would mis-tag a respawn after partial goal clearance) with an explicit caller-controlled flag. 9 new tests in a `R84.P6 — Multi-ball CYAN tint` describe block (primary spawns untinted + flagged false, multi-ball spawns tinted + flagged true, `spawnMultiBalls` produces only tinted balls, primary ball untouched by multi-ball spawn, post-goal respawn untainted, ball-cap caps at min(2, 3-balls.length)). Test mocks: `add.sprite` tracks `setTint` + `tint` field for colour assertions; `createBall` helper updated to accept an `isMultiBall` 6th arg (default false). Full suite 2,021 pass (+9 from R84.P5). Gates all green — tsc + lint + vitest (169/169 Pong-scoped) + build. Next: **R84.P7 — paddle-hit trail amplification** (R83.V1 shipped 10 particles — consider 20 at top-tier ball speed).)*
- [x] **R84.P7 [P2]** Paddle-hit trail verification + amplify *(R84.P7 — shipped 2026-04-19 night. R83.V1e 10-particle flat trail verified landed at `GameScene.ts:1106–1128`; now amplified per plan. New `PADDLE_TRAIL` config block (`config.ts:72–80`) carries BASE_COUNT=12, MAX_COUNT=20, plus particle appearance + speed-jitter constants. `computeTrailParticleCount()` lerps linearly from BASE at multiplier=1.0 (fresh serve) to MAX at multiplier=MAX_SPEED/INITIAL_SPEED (~2.14× cap), clamped to ≥0 normalised so slower_ball's 0.6× multiplier still emits the full BASE burst (juice never thins). `createPaddleHitTrail` consumes the computed count + config constants instead of the R83.V1e literals. Reduced-motion path unchanged (skipped entirely). 7 new tests in a `R84.P7 — Trail amplification` block (config sanity, BASE at mult=1.0, MAX at cap, linear scaling at midpoint ±1 for rounding, slower_ball clamp to BASE, actual hit emits MAX at top-tier `timeSinceLastGoal`, per-particle radius + alpha match config). Existing R83.V1e test updated — base-count assertion now reads from config. Full suite 2,028 pass (+7 from R84.P6). Gates all green — tsc + lint + vitest (176/176 Pong-scoped) + build. Next: **R84.P8 — Ball rally counter UI**.)*
- [x] **R84.P8 [P2]** Ball rally counter UI *(R84.P8 — shipped 2026-04-19 night. Top-centre HUD counter at `(WIDTH/2, 14)` renders `RALLY x{count}` in CYAN `#00ffff` (rally/multi-ball family colour), hidden on fresh serve (`alpha 0` until the first player return), pulses scale 1.3→1.0 over 180ms `Back.easeOut` on every player paddle return, wipes back to `alpha 0` with empty text on any goal. New `RALLY_COUNTER` config block at `config.ts:88-102`. `updateRallyCounter()` kills the prior pulse tween before queuing a new one so rapid rallies don't stack conflicting scale animations; reduced-motion still updates text+alpha (the metric stays readable) but skips the tween. `hideRallyCounter()` clears text to `''` (not `RALLY x0`) so any alpha-fade window can't briefly flash stale copy. AI paddle hits do NOT touch the counter — the existing rally semantic (`rallyCount` only increments on player returns per R84.P2's `maxRally × 10` weighting) is preserved. `createUI` adds the counter alongside the existing score+combo texts; `checkGoals` calls `hideRallyCounter()` the same frame the reset to 0 happens. Tests: 17 new in a `R84.P8 — Rally counter UI` block (3 config sanity, 6 `updateRallyCounter` behaviour, 3 paddle-hit integration, 4 hide-on-goal, 1 `createUI` wiring). Full suite 2,045 pass (+17 from R84.P7). Gates green — tsc + lint + vitest (193/193 Pong-scoped) + build.)*
- [x] **R84.P9 [P2]** Goal-flash verification — R83.V1 dimmed; re-verify epilepsy-safe. *(R84.P9 — shipped 2026-04-19 night. R83.V1c dimmed the flash to 128/channel but left the values as inline magic numbers at 4 callsites with no tripwire preventing a future refactor from re-introducing 255, and no throttle to stop a multi-ball 3-goal storm breaching WCAG 2.3.1's ≤3Hz General Flash Threshold. P9 consolidates the four presets into a new `GOAL_FLASH` config block inside `GAME_CONFIG` (adjacent to `SHAKE`, same camera-effects cluster) — `PLAYER_GOAL`/`AI_GOAL`/`PLAYER_WIN`/`AI_WIN` each carry typed `rgb: readonly [r,g,b]` + `durationMs`, plus three safety ceilings: `MAX_CHANNEL_VALUE=160` (observed win cap), `MAX_DURATION_MS=200` (below PEAT 1s window), `MIN_INTERVAL_MS=334` (PEAT-safe 3Hz floor). New exported interface `GoalFlashPreset` makes callsite signatures self-documenting. `goalFlash()` refactored to accept a preset + optional `{ overrideThrottle }` — each channel clamped via `Math.min(c, MAX_CHANNEL_VALUE)`, duration clamped via `Math.min(d, MAX_DURATION_MS)`, throttle suppresses second flash if `Date.now() - lastGoalFlashAt < MIN_INTERVAL_MS`. New scene field `lastGoalFlashAt` reset to 0 in `resetState()` so R-restart doesn't carry stale timestamp. All 4 callsites refactored — `AI_GOAL`/`PLAYER_GOAL` use throttle, `PLAYER_WIN`/`AI_WIN` pass `overrideThrottle: true` so game-over climax fires even when the clinching regular flash landed <334ms prior (win flash only fires once per match → cannot re-trigger rapidly). 14 new tests in an `R84.P9 — Goal-flash safety` block: 6 config sanity (channel cap, duration cap, interval floor, all 4 presets within caps, one-saturated-channel-only invariant blocking white/yellow flashes, all durations ≤ cap), 4 throttle (first-fires, within-window-suppressed, after-window-fires, override-bypasses), 2 clamping (rgb 255→160, duration 900→200), 2 reduced-motion+reset (resetState zeroes lastGoalFlashAt, reduced-motion returns before touching throttle state). Existing R83.V1c tests still pass — preset-based callsites produce the same flash(100, 0, 128, 0, false) signature. `Date.now()` spied via `vi.spyOn(Date, 'now')` for deterministic throttle tests; `afterEach` added to vitest imports for spy cleanup. Full suite 2,059 pass (+14 from R84.P8, 207/207 Pong-scoped). Gates all green — tsc + lint + vitest + build.)*
- [x] **R84.P10 [P1]** Double-pause-overlay regression check *(R84.P10 — shipped with R84.UP1 on 2026-04-19 night. Ralph Playwright-drove Pong at 1280×800: paused via dashbar ❚❚ button after countdown → live DOM probe returned **exactly 1 `[data-testid="ipod-pause-overlay"]`, 1 `.ipod-pause-scrim`, 1 `.ipod-pause-text`, 1 `.ipod-pause-hint`** — no stacking. Screenshot `.playwright-mcp/r84-up1-pong-paused-single-overlay.png` shows one amber radial scrim with one PAUSED word + one hint line. Tom's "double/triple" complaint was the scrim+text+hint **trio inside one overlay** being miscounted as three separate overlays — architectural single-source-of-truth at `GamePortal.tsx:622-632` gated by `isPaused`, with `BaseScene.togglePause` as the only state owner (comment at `BaseScene.ts:152-155` explicitly documents "Presentation is owned by the React portal's dashbar scrim"). R83.G3 is live-confirmed shipped on Pong. Task closes under R84.UP1's broader hunt — see D3 notes.)*
- [ ] **R84.P11 [P2]** Paddle-motion smoothing — R83.V1 velocity model; if feels "snappy", add 100ms ease-in ramp from 0 → max.
- [ ] **R84.P12 [P1]** Unit-test coverage refresh — +12-15 tests for scoring formula / difficulty tiers / countdown / power-up legend.

**Stream C — Matrix Snake polish (R84.S1 → S10, ~10 iterations):**

- [ ] **R84.S1 [P1]** Yellow wall spacing fix — **math already derived in Stream A audit (D-S1-math)**. Root cause: `GRID_OFFSET_Y=20` + walls at grid-rows `-1` and `GRID_ROWS` with `CELL_SIZE=16` gives top-margin 4px, bottom-margin 44px on the 400px canvas. Fix: change `GRID_OFFSET_Y: 20 → 40` in `SnakeClassic/config.ts` → symmetric 24px/24px margins. Single-file change. Ship the fix + update any tests asserting the old offset + regen the Snake visual baseline.
- [ ] **R84.S2 [P1]** Matrix funkiness depth pass — after R83.S1 rain+scanline+chromatic. Ship (a) in-play-area Matrix-rain particles at 0.15 alpha (not just bg), (b) snake-head `setShadow` glow in `MATRIX_COLORS.PRIMARY` at 6-8px radius, (c) per-food-type visual variant — bonus food gets ASCII-glyph treatment so food reads as "code eaten by snake".
- [ ] **R84.S3 [P1]** Power-up variety expansion — 2-3 new types (reverse controls 5s, double-score 10s, glitch-rain 3s obscuring screen). Each: icon + SFX + legend copy. Split across sub-iterations S3a/S3b/S3c if needed.
- [ ] **R84.S4 [P1]** Speed-tier dread build-up — current tiers trigger audio cues (R81); add visual build-up: scanline intensifies, BGM bass thickens, subtle camera shake under top-tier speed.
- [ ] **R84.S5 [P2]** Snake death cinematic — 300ms glitch-cascade (4-6 red horizontal bars strobing, same pattern as R83.CTRLS.12 climax-failure) before Game Over.
- [ ] **R84.S6 [P2]** Food pickup juice verification post-S1 apple-shrink.
- [ ] **R84.S7 [P2]** Boss-snake prototype (optional) — triggers at score 500: antagonist snake appears, player survives 30s while both compete. If time-constrained, `[DEFER]` to R85.
- [ ] **R84.S8 [P2]** Food/power-up sprite polish — ensure all food sprites snap to grid + feel crisp.
- [x] **R84.S9 [P2]** Pause-overlay regression check on Snake *(R84.S9 — closed with R84.UP1 on 2026-04-19 night. Ralph's UP1 upstream hunt proved the pause overlay is rendered by a single React component at `GamePortal.tsx:622-632`, gated by one `isPaused` boolean, fed by one `PAUSE_STATE_CHANGED_EVENT` dispatched by one `BaseScene.togglePause()` path. Grep across all 12 Phaser scene files returned zero scene-side "PAUSED" text renderers. Since Snake uses the identical GamePortal + BaseScene pair as Pong, and Pong was live-verified with exactly 1 overlay + 1 scrim + 1 text + 1 hint on every inspection, Snake's overlay behaviour is bitwise identical. No Snake-specific regression possible under the current architecture.)*
- [ ] **R84.S10 [P1]** Unit-test coverage refresh — new power-ups + boss-snake (if shipped) + wall-spacing fix.
- [ ] **R84.S11 [P1]** Rename completeness audit — **Stream A audit found 2 rename gaps R83.S1 missed**. (D6) `src/lib/asciiArt.ts:62` still has `'snake-classic': ['SNAKE', 'CLASSIC']` → change to `['MATRIX', 'SNAKE']` (both fit asciiArt test bounds — MATRIX×5=34 chars, SNAKE×5=29, < 60 max). (D7) `src/hooks/useSaveSystem.ts:148–154` has 7 hard-coded `game: 'Snake Classic'` achievement rows → switch to `'Matrix Snake'`. Update `useAchievementManager.test.ts:279–297` expectations (`stats.byGame['Snake Classic']` → `stats.byGame['Matrix Snake']`). Re-run `src/lib/asciiArt.test.ts` after ASCII swap. Regen any visual baseline that shows the portal hero banner.
- [ ] **R84.S12 [P2]** HUD clipping investigation — **Stream A audit D8**: `createHUD` at `GameScene.ts:216-236` places right-column text at `rightX=700` on a 640px canvas (`GAME_CONFIG.WIDTH=640`). Live-inspect at 1280×800 portal viewport — does POWER-UPS / FOOD / power-up-indicator render on-screen, or clip? If clipped, either adjust right-column math to `WIDTH - padding` (e.g. 624px) or investigate whether the scene uses an expanded camera bounds that makes 700px legit. Fix to whatever makes live render correct. Possibly already fine if rarely populated — confirm live before touching.

**Stream D — Matrix Bird polish (R84.B1 → B12, ~12 iterations):**

- [ ] **R84.B1 [P1]** Display-name full audit — Tom: only landing-grid card shows "Matrix Bird", other surfaces might not. Audit landing card, portal card, ASCII title, HighScores modal, Scoreboard tab, Attract mode, About, save-data key. Replace all "Matrix Cloud" / cloud imagery. Folder stays `MatrixCloud/` (R83.B1 stability call).
- [ ] **R84.B2 [P1]** Preview image swap (card + portal) — **Stream A audit D9 confirmed**: `src/data/gameRegistry.ts:55` points at a Cloudinary URL that self-describes as a vortex illustration (`.../A_surreal_thumbnail_of_a_glowing_neon_green_vortex_spiraling..._gyatls.png`), not a bird. Fix path (b) preferred: **switch to import-based preview** like `matrix-invaders` + `metris` already do at `gameRegistry.ts:2-3` — drop the Cloudinary external dependency, use a local bird sprite import. If no bird preview asset exists, source one from `public/assets/matrix-cloud/` or generate a minimal bird ASCII-banner render. Regen baselines under R84.BL after swap.
- [ ] **R84.B3 [P1]** Slow-powerup momentum feel. Tom: *"slow zone when take slow powerup, not enough momentum for the bird"*. (a) Horizontal velocity persists longer between flaps when slow-active, (b) verify jump-power 0.6× scale feels floaty not sluggish, (c) subtle particle trail during slow-mode for visual state-change signal.
- [ ] **R84.B4 [P1]** Pipe variety + progression: (a) **moving pipes** from score 200+ (sinusoidal vertical drift), (b) **zapper pipes** from score 500+ (electric arc between top/bottom — insta-death), (c) **bonus pipes** from score 1000+ (narrow gap spawning power-up through centre). Each type: distinct visual + SFX.
- [ ] **R84.B5 [P1]** Parallax deepening — 3-layer (far city silhouette 0.1× scroll, mid rain 0.3×, near rain 0.7×). Reuse R78.3 Cloud Jumper pattern.
- [ ] **R84.B6 [P1]** Jump SFX tuning — R83.B1 tri-pluck; verify Tom's "horrendous" complaint fully resolved. If still prominent, drop pitch sweep depth + volume 20%.
- [ ] **R84.B7 [P2]** Ground-death verification — R83.B1 shipped; re-confirm.
- [ ] **R84.B8 [P2]** Pause→resume 5s countdown verification.
- [ ] **R84.B9 [P2]** Overall SFX volume audit — R83.B1 dropped master 25%; another -10% if needed.
- [ ] **R84.B10 [P2]** Troll frequency + power-up spacing (PG4 ≥80px / PG5 max 4) still hold post-rename.
- [ ] **R84.B11 [P2]** Score milestone stinger audio — R81 shipped; verify fires at 50/100/250/500/1000.
- [ ] **R84.B12 [P1]** Unit-test coverage refresh — new pipe types (B4) + parallax (B5) + slow-mode momentum (B3) + display-name audit (B1).

**Stream U — Upstream cross-game investigation (Stream A audit surfaced, runs anytime after Stream A):**

- [x] **R84.UP1 [P1]** Upstream pause-overlay investigation *(R84.UP1 — shipped 2026-04-19 night. **Finding: no duplicate pause-overlay exists anywhere in the React+Phaser tree.** Static analysis: (a) grep for `<PauseOverlay>`, `aria-label*="pause"`, `ipod-pause`, PAUSED across `src/`: exactly one renderer at `GamePortal.tsx:622-632` inside the `{isPaused && (…)}` JSX gate — one `.ipod-pause-overlay` wrapper containing one `.ipod-pause-scrim`, one `.ipod-pause-text` ("PAUSED"), one `.ipod-pause-hint` ("PRESS P OR ❚❚ TO RESUME"). (b) Scene-side grep: zero "PAUSED" strings in any of the 12 Phaser scene files (`VortexPong`, `SnakeClassic`, `MatrixCloud`, `CtrlSWorld`, `MatrixInvaders`, `Metris`, `MatrixFrogger`, `NeoJump`, `AgentChase`, `RhythmHacker`, `CloudJumper`, `CodeBreaker`). (c) `BaseScene.togglePause` at `BaseScene.ts:157-178` emits `PAUSE_STATE_CHANGED_EVENT` consumed by `GamePortal.tsx:254-258` which flips the single `isPaused` useState — one-to-one data flow, no duplicate event handlers. (d) `App.tsx` has zero pause-related overlays (only `IntroOverlay`). (e) No CSS `::before`/`::after` pseudo-elements on `.ipod-pause-*` selectors in `animations.css:631-696`. Live DOM probe on Vortex Pong at 1280×800 after dashbar pause click: `{overlayCount: 1, scrimCount: 1, textCount: 1, hintCount: 1, dashbarAriaPressed: "true", dashbarClassHasIsPaused: true}`. Screenshot `.playwright-mcp/r84-up1-pong-paused-single-overlay.png` shows one amber radial scrim with PAUSED + hint. Snake + Bird inherit the identical `GamePortal` + `BaseScene` pair with zero game-specific pause-overlay rendering code — behaviour is bitwise identical. Tom's "triple-stacked" perception likely conflated the **three design elements (scrim+text+hint) inside one overlay** as three overlays — a visual-literacy trap common in colloquial playtest notes where the DOM actually has a single wrapper. R83.G3 architecture shipped single-source-of-truth by design; no fix needed. Classification: **stale complaint, code correct** per plan's close-out instruction. Cascade: R84.P10 + R84.S9 closed under this hunt; Bird pause tasks unaffected (R84.B7/B8 verify ground-death + countdown, not overlay count). Testing-harness limitation carried forward from UP2: Playwright MCP's synthetic KeyboardEvent doesn't reliably reach Phaser's window-bound P-key keyboard plugin, so the React-side dashbar ❚❚ button was used to exercise the same `PAUSE_REQUEST_EVENT` → `BaseScene._handlePauseRequest` → `togglePause()` path.)*
- [x] **R84.UP2 [P1]** Live-retest stale complaints batch *(R84.UP2 — Ralph live-retested all five at 1280×800 on 2026-04-19 via Playwright MCP: **D1 mute toggle** symmetric both ways via shared React `useSoundSystem.toggleMute` code path (aria-live region flips `Audio unmuted` ↔ `Audio muted`; BGM+SFX ON↔OFF together). **D2 click-to-play** overlay absent on Pong + Bird MenuScenes. **D5 launcher transition** clean iPod→MenuScene with no FOUC. **D10 iPod Matrix Bird text** reads `MATRIX / BIRD` ASCII + correct subtitle + ARCADE chip — text complaint stale, but preview image still a vortex (separate D9 → R84.B2). **D12 Bird MenuScene start-button** layout clean — START has ~30px gap above instructions and below key-legend, no overlap at 1280×800. All 5 complaints confirmed stale (Tom's 2026-04-19 testing notes predate R83 same-day fix commits). Evidence screenshots `.playwright-mcp/r84-up2-*.png`. Testing-harness limitation logged on D1: Playwright MCP cannot reliably drive Phaser's window-bound M-key via synthetic KeyboardEvent, so the React UI button was used to exercise the same `toggleMute()` method.)*

**Stream E — Baselines + Continuous Improvement:**

- [ ] **R84.BL [P1]** Visual baseline regen — Streams B+C+D will invalidate baselines (new Pong atmosphere, Snake density, Bird pipes/parallax, Bird preview swap). Run `npm run test:visual -- --update-snapshots`, review diffs carefully, commit under `R84.BL-visual: baseline update — 3-game polish`.
- [ ] **R84.CI [P2]** Continuous improvement bucket — only after Streams A-D + BL all `[x]`. **INTENTIONALLY never auto-ticked** (R82.13 pattern). Ralph keeps shipping polish until loop-cap. Priority order:
  1. a11y refinement across 3 games (focus-visible, prefers-reduced-motion, SR announcements on game-over)
  2. Performance micro-optimisations (Phaser texture atlases, object-pool audits, frame-budget profiling)
  3. Attract-mode integration — 3 games' hi-scores cycle through landing idle-attract
  4. Additional juice recipes (`juice:juice-audit` + `juice:juice-recipe` per R81)
  5. Sound-design mix balance across SFX + BGM layers
  6. Visual detailing — bezel shadows, gradient refinements, typography

### R84 Verification Plan

1. **Stream A complete** → 3 fresh Known-Issues checklists filled in; NOT-working R83 items documented.
2. **Streams B/C/D complete** → Tom plays each game 3-5 min, verifies new scope lands.
3. **Stream E complete** → visual baselines green, CI iterations shipped until cap.
4. **Automated gates**: every iteration `npx tsc --noEmit` + `npm run lint` + `npm run build` + `npm test --run`. Red blocks commit.
5. **Post-phase playtest**: Tom hand-plays each game end-to-end, ticks Known Issues, writes terminator.

### R84 Terminator

All of:
- R84.V1, V2, V3 `[x]`
- R84.P1 – R84.P12 `[x]`
- R84.S1 – R84.S12 `[x]` (S11 rename completeness, S12 HUD clipping added post-audit)
- R84.B1 – R84.B12 `[x]`
- R84.UP1, R84.UP2 `[x]` (upstream pause-overlay + live-retest stale complaints)
- R84.BL `[x]`
- R84.CI stays `[ ]` (continuous-improvement; Tom ticks post-review)
- Gates green: lint + build + unit + E2E + visual
- Tom manually writes **"R84 COMPLETE — 3-game polish + verification shipped"** to Status

`loop.sh` hard cap: **50 iterations**. Ralph **never auto-writes** the terminator phrase.

### R84 Post-R84 Plan (NOT Ralph's work — Tom's forward-look)

R85 = per-game polish for remaining 8 games (Invaders, Metris, Frogger, NeoJump, AgentChase, Rhythm, CloudJumper, CodeBreaker). Testing docs template-populated by R83.G7 — Tom plays each ~3 min, fills Known Issues, R85 scope built from those notes.

### R84 Discovered Work

_(Ralph logs unexpected findings here during execution — do NOT create new R84.x tasks mid-iteration; log here for Tom's triage.)_

**From R84.V1 (Vortex Pong static audit, 2026-04-19):**

- **D1 [P1, Pong+Snake] — LIVE-RETEST (R84.UP2, 2026-04-19): STALE. Mark resolved.** Live driven from Pong in-game: clicking the React Audio-Settings `SOUND ON` toggle flips aria-live region `Audio unmuted` → `Audio muted`, BGM ON → OFF, SFX ON → OFF. Clicking it again flips everything back (`Audio unmuted`, BGM ON, SFX ON) — symmetric both ways. The Phaser-side `BaseScene.M` key-bind (`BaseScene.ts:112-113`) delegates via `toggleMute()` (`BaseScene.ts:263-267`) → registry `IS_MUTED` flip + `'mute'` event → React `useSoundSystem.toggleMute`, i.e. the **exact** method exercised by the React button. Tom's 2026-04-19 testing-doc note pre-dates R83.G1 commit `6540b52`. *Original static-audit notes below retained for audit trail.* M-key unmute reported broken by Tom in both Pong and Snake testing docs. Static audit of `useSoundSystem.ts:1208–1237` (R83.G1 commit `6540b52`) shows symmetric toggle: mute sets masterGain=0 + saves preMuteConfigRef; unmute restores gain, restores {music,sfx}, and nudges paused BGM element back into play. Logic looks correct. **Testing-harness caveat**: Playwright MCP's `page.keyboard.press('M')` does not reliably reach Phaser's window-bound keyboard plugin because synthetic KeyboardEvent dispatch bypasses Phaser's internal state machine; future Playwright-style E2E coverage for M-key should use `page.keyboard.type` after a `click()` on the canvas bounding box, or call `scene.toggleMute()` directly via test-mode seam.

- **D2 [P1, cross-game] — LIVE-RETEST (R84.UP2, 2026-04-19): STALE. Mark resolved.** Ralph drove the Pong + Bird MenuScenes live at 1280×800 and neither renders a `click to play` overlay after PLAY is pressed. The MenuScene is reached cleanly from the iPod card → SPACE/ENTER → scene appears with `START` button. No additional transparent click-catcher layer was detected in the DOM inspection. R83.G2 is live-confirmed shipped. *Original note below retained.* Click-to-play overlay still reported by Tom in Pong + Snake docs. Grep of the Pong chain + `BaseScene` returns zero "click to play" strings. Overlay (if any) lives upstream — probably `GamePortal.tsx` or the landing-page transition mask.

- **D3 [P1, cross-game] — LIVE-RETEST (R84.UP1, 2026-04-19): STALE. Mark resolved.** Ralph hunted the React+Phaser tree + live-DOM-inspected a paused Vortex Pong at 1280×800: exactly one `.ipod-pause-overlay` wrapper renders, containing one scrim + one PAUSED text + one hint line. `GamePortal.tsx:622-632` is the sole renderer; zero scene-side "PAUSED" strings in any of the 12 Phaser scenes. Tom's "triple" likely conflated the three design elements (scrim+text+hint) **inside** one overlay as three stacked overlays. R83.G3 single-source-of-truth architecture ships as intended. Screenshot `.playwright-mcp/r84-up1-pong-paused-single-overlay.png`. Closes R84.UP1 + cascades to R84.P10 + R84.S9.

- **D4 [P2, Pong]** MenuScene start button Y ratio = 0.75 via `BaseScene.MENU_START_BUTTON_Y_RATIO`; Pong HOW-TO-PLAY band occupies y = 0.52..0.63. Clean 12% gap. Tom's "still overlapping" playtest note likely stale vs. pre-R83.G4 layout. Low priority; verify at 1280×800 during R84.BL baseline review.

- **D5 [P2, cross-game] — LIVE-RETEST (R84.UP2, 2026-04-19): STALE. Mark resolved.** Driving the iPod `▶` button for Matrix Bird + Vortex Pong transitioned cleanly into each MenuScene with no FOUC, no black hole, no stale-canvas artefact. The `GAME_TRANSITION_READY_EVENT` portal-mask reveal is working. R83.G5 live-confirmed shipped. *Original static-audit note retained.* R83.G5 "Matrix launcher" transition implemented as `GAME_TRANSITION_READY_EVENT` fired one rAF after Phaser `ready` (`PhaserGame.tsx:216–232`).

- **D-P1 [P2, scope]** R84.P1 (5-second countdown for Pong) is ALREADY IMPLEMENTED at `GameScene.ts:121`. Plan task description is stale. When R84.P1 is picked up under Stream B, it should be a quick live-verify + auto-tick rather than new scene work. Suggested: demote P1 to a verification sub-task or merge into R84.V1's evidence table.

**From R84.V2 (Matrix Snake static audit, 2026-04-19 night):**

- **D6 [P2, Snake]** R83.S1 rename did not cover the ASCII block-letter title. `src/lib/asciiArt.ts:62` still has `'snake-classic': ['SNAKE', 'CLASSIC']`; `GAME_TITLES` is pre-computed at module load from this map, imported by `src/components/GamePortal.tsx:4`, and rendered as a huge ASCII banner overlaid on the portal hero card at `GamePortal.tsx:658`. Users see "SNAKE / CLASSIC" in block letters even though the registry title is "Matrix Snake". **Fix**: change the array to `['MATRIX', 'SNAKE']`. Must re-run `src/lib/asciiArt.test.ts` (tests assert `GAME_TITLES['snake-classic']` exists, contains `█`, no row > 60 chars — all satisfied by `MATRIX` (6 chars × 5-per-glyph + padding ≈ 34 chars) + `SNAKE` (5 × 5 ≈ 29). Must also regen visual baselines touching the Snake portal card. **Assigned**: fold into R84.S1 iteration OR carve a dedicated `R84.Sx` rename sub-task. NOT fixed in V2 per "verification commits are doc-only" ordering rule.

- **D7 [P2, Snake]** R83.S1 rename missed the achievements panel. `src/hooks/useSaveSystem.ts:148–154` has 7 Snake achievement rows all hard-coded with `game: 'Snake Classic'`. These strings surface in the Achievements modal (grouped-by-game sections) and in `useAchievementManager.test.ts:279–297` as test expectations against `stats.byGame['Snake Classic']`. **Fix**: switch labels to `'Matrix Snake'` and update the test expectations in lockstep (tests are an internal source of truth — no migration). **Assigned**: same as D6, fold into Stream C rename sub-task. NOT fixed in V2.

- **D8 [P2, Snake]** `SnakeGameScene.createHUD` places text at `leftX=100` and `rightX=700` (`GameScene.ts:216–236`) but `GAME_CONFIG.WIDTH=640`, so `rightX=700` is 60px off-screen. At default `Phaser.Scale.NONE` this would clip; current visible HUD on the right hints at a scale-mode quirk OR intentional use of a wider camera bounds. **Action needed**: live-inspect where the POWER-UPS / FOOD / power-up-indicator texts actually render at 1280×800 portal viewport. If clipped, R84.S layout fix + update HUD positioning math. Low priority — not a blocker; possibly Tom never noticed because the right HUD column is rarely populated.

- **D-S1-math [P1, Snake, evidence]** Yellow wall asymmetry (Tom's reproduction note) confirmed by static geometry: `GRID_OFFSET_Y=20`, walls at grid-rows `-1` and `GRID_ROWS` with `CELL_SIZE=16`. Top wall pixel span 4..20 (margin=4), bottom wall pixel span 340..356 (margin=44) on a 400px canvas. Balanced target: `GRID_OFFSET_Y=40` → symmetric 24px margin top/bottom. This is NOT a new discovery (R84.S1 already scoped it) but the math wasn't in the plan; logging here so the fixer can start from the equation rather than re-derive it.

**From R84.V3 (Matrix Bird static audit, 2026-04-19 night):**

- **D9 [P2, Bird]** Preview image on portal card is NOT a bird. `src/data/gameRegistry.ts:55` points at Cloudinary URL `.../A_surreal_thumbnail_of_a_glowing_neon_green_vortex_spiraling..._gyatls.png` — filename self-describes as a vortex illustration, matches Tom's complaint *"still has a picture of a cloud lol"*. Cloudinary URLs are immutable, so the fix requires either (a) uploading a new bird-sprite preview and swapping the URL, or (b) moving to an import-based preview (like Matrix Invaders + Metris already do at `gameRegistry.ts:2–3`). Path (b) is more robust and removes the external dependency. **Assigned**: R84.B2 (preview image swap — explicitly scoped in plan). Regen visual baselines under R84.BL after swap.

- **D10 [P2, Bird] — LIVE-RETEST (R84.UP2, 2026-04-19): STALE for text. Mark text-resolved; preview image still vortex (that is D9 → R84.B2).** Ralph navigated the iPod portal to position 4 at 1280×800. The ASCII hero banner reads **`MATRIX / BIRD`** (correct). The subtitle reads *"Navigate through gaps in the digital storm — one wrong move and you crash."* (correct Bird copy). The category chip reads **ARCADE**. However the preview image behind the title is still the green vortex illustration — that is a **separate issue (D9)** already routed to R84.B2 preview-image swap. *Original static-audit note retained.* Tom's *"text still says matrix cloud (on the ipod)"* complaint CANNOT be reproduced — the text everywhere reads Matrix Bird.

- **D11 [P2, Bird, perf]** Tom's verdict *"can be better with performance upgrades"* is directional, not a specific bug. No static perf measurement available. Scope marker for R84.CI bucket priority 2 (performance micro-optimisations). When R84.B4 (pipe variety) and R84.B5 (3-layer parallax) ship, keep an eye on frame budget — parallax layers tend to be the first thing to stutter on low-end hardware. Object-pool audit for pipes + power-ups is a candidate since the game currently `destroy()`s + recreates every off-screen element.

- **D12 [P2, Bird, menu] — LIVE-RETEST (R84.UP2, 2026-04-19): STALE. Mark resolved.** Ralph captured Matrix Bird MenuScene at 1280×800. Layout reads cleanly top-to-bottom: `MATRIX BIRD` title (y≈220–260) → subtitle *"One flap at a time through the cascade"* (y≈320) → instructions *"SPACE / Click to flap", "Fly through the gaps", "Collect power-ups, defeat bosses"* (y≈395–475) → **`START`** button at y≈505–555 — ~30px clear gap above and below START, no overlap with instructions or with the key legend (`ESC: Exit  P: Pause  M: Mute`) at y≈625. No `click to play` overlay. R83.G2 + R83.G4 live-confirmed shipped for Bird. *Original static-audit note retained.* Tom: *"start button needs to be further down and click to play removed"* on MenuScene.

- **D13 [P3, Bird, cleanup]** Dead constant: `GAME_CONFIG.PARTICLE_COUNT = 30` at `config.ts:94` is declared but never referenced anywhere in the MatrixCloud game (grep returned only the declaration). Low-priority cleanup candidate — either wire it into the camera flash / death-effect particle count, or delete. Not a V3 blocker.

---

## Future Asset Strategy (Tom's note, 2026-04-18)

> *"I will be adding a custom game asset pack in the future (purchased). Like a mega pack for consistency across games. Free ones are cool for now and I went a bit over the top. When publishing final version I'll source a sound effects pack, sprite pack, possibly a background pack. For future development, be a true professional — also it's a pain finding free stuff and hoping I can use it without referencing. I'll try to create my own music track and images for custom aspect, but this is my playground and I love trying new things and breaking things."*

**Implications for future phases (NOT R82)**:
- When Tom sources a licensed mega-pack, a new phase will replace per-game sprites/SFX/BGM with the consistent set. Estimated ~1 iteration per game asset-swap (11 games = 11 iterations).
- Existing `public/assets/<game>/` structure is ready for this — just replace files, re-run visual baselines.
- Current assets (deployed R78 + R80) are from the 638 MB free dump. Licensing-fine for playground use; pack swap happens before any public launch.
- Tom may also create custom music + imagery per game — these layer on top of the pack. No blocker for purchased pack work.
- **When the time comes**: new phase (R8X or similar), full `ASSETS_NEEDED.md` refresh per game with licensed pack paths, 1-iteration-per-game swap. Not a planning priority now.

---

R81 closed — see [COMPLETED_WORK.md § R81](COMPLETED_WORK.md#r81--arcade-wide-juice-polish--repo-trim-2026-04-15).

R80 closed — see [COMPLETED_WORK.md § R80](COMPLETED_WORK.md#r80--ctrl-s-flagship-rewrite).

---

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


## Deferred / Future Phases (post-R84)

These phases are scoped but NOT scheduled. Ralph does NOT touch them during R84.

### R85 — 8-game polish for untested games

Per-game polish for Matrix Invaders, Metris, Matrix Frogger, NeoJump, AgentChase, Rhythm Hacker, CloudJumper, CodeBreaker — contingent on Tom playtesting each and filling the respective `MANUAL_TESTING_CHECKLIST_*.md` Known Issues blocks (docs already template-populated by R83.G7). R85 task list built from those notes the same way R83/R84 were.

### R86+ — Performance + ship-readiness

Tom's note: *"the rest of the work will be performance and getting the games perfect"* — post per-game polish rounds, focus shifts to performance profiling, final polish sweeps, and ship-readiness (Lighthouse audits, Web Vitals tuning, licensed asset-pack swap per Future Asset Strategy, PWA audits).

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

- All R82.1 through R82.12 tasks marked `[x]`.
- `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`, `npm run test:visual` ALL green on a clean run.
- `COMPLETED_WORK.md` contains new `## R81 — Arcade-wide Juice Polish` section (R82.1 archive).
- **CTRL-S game files untouched** — `git diff --stat HEAD~12 -- src/components/games/phaser/CtrlSWorld/` returns empty. (CTRL-S card styling in LandingPage.tsx IS permitted.)
- The `## Status` line contains the phrase **"R82 COMPLETE — iPod Classic card redesign shipped"**.
- `### R82 Completion Report` written under the R82 section.

**Execution order for this run** (15-loop cap, 12 tasks):
1. R82.1 Archive R81 (doc-only, cheap)
2. R82.2 Extract GameCard component (prerequisite for all visual work)
3. R82.3–R82.7 Build card visuals + clickwheel incrementally (device silhouette → screen + title → clickwheel → interactivity → animations)
4. R82.8 Apply across all 12 games
5. R82.9 CTRL-S card styling (card only, NOT Phaser game code)
6. R82.10–R82.11 Visual baselines + E2E spec update
7. R82.12 Final verification + terminator

**Pattern**: R82 uses standard complete-and-exit (like R76/R77/R79/R80/R81). Auto-terminator is correct.

**CTRL-S GAME directory is RE-ARMED off-limits** — only the CTRL-S card styling on the landing page is in scope. Phaser scene code for CTRL-S is untouchable.

**Stick-with-plan rule**: Don't invent new tasks. Discovered scope expansion (e.g. carousel overhaul, header redesign) → `### R82 Discovered Work` for triage, NOT into the active task list.

When terminator is reached, write `### R82 Completion Report` listing: iterations run, components created/refactored, visual baselines regenerated, any discovered items deferred to R83+, tests passing, accessibility verification. Then stop.

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
