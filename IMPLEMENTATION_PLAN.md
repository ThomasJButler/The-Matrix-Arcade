# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: **R84 open** (2026-04-19 night). **R84.V3 Matrix Bird static audit shipped** — all 7 R83.B1 items code-verified LANDED with zero rename gaps (ground-death via dedicated `handleGroundDeath()`, 5s pause countdown via `resumeGame()` override, birdFlap = procedural triangle 800→400Hz/80ms tri-pluck, slow-powerup 0.6× jump scaling, scene-local SFX volume 0.75, iPod trophy fix via R83.G6 high-score lift, full "Matrix Bird" rename across registry + ASCII + saves + scoreboard + achievements). Four new discovered items logged: **D9** preview image still a vortex illustration → R84.B2 swap, **D10** Tom's "matrix cloud on iPod" complaint unreproducible statically → LIVE-RETEST, **D11** perf concerns → R84.CI bucket, **D12** MenuScene start-button Tom complaint → R84.B1 + LIVE-RETEST, **D13** dead `PARTICLE_COUNT: 30` constant → cleanup candidate. **R84.V2** (Snake) shipped prior — 4/5 R83.S1 items landed + D6/D7 rename gaps + D-S1 wall-spacing math. **R84.V1** (Pong) shipped earlier — all 5 R83.V1 fixes code-verified. **Stream A COMPLETE** — V1/V2/V3 all `[x]`. Next: **Stream B — Vortex Pong polish (R84.P1 → P12)** starting with R84.P1 (5s countdown — D-P1 noted it's already at `GameScene.ts:121`, so P1 is effectively a live-verify + tick). R83 fully shipped — 38 sub-bullets across 3 rounds archived to [`COMPLETED_WORK.md § R83`](COMPLETED_WORK.md#r83--global-polish--ctrl-s-rewrite-2026-04-19). Only `R83.CTRLS [ ]` umbrella remains `[ ]` pending Tom's end-to-end CTRL-S playthrough sign-off (by design — Ralph cannot self-tick). R84 = **3-game polish + verification** for Vortex Pong + Matrix Snake + Matrix Bird (`MatrixCloud/` folder). Scope built from the 3 testing docs at `manual-testing-sessions/MANUAL_TESTING_CHECKLIST_{Vortex_Pong,Snake_Classic,Matrix_Cloud}.md`: (a) verify R83.S1/V1/B1 shipped items actually work in-browser (Known Issues checkboxes in those docs were never re-ticked post-Ralph-loop), (b) ship new polish Tom flagged in prose notes not covered by the Round 1 umbrellas — Pong scoring-model overhaul + 5s countdown, Snake yellow-wall spacing + "more funkiness", Bird display-name full audit + performance pass. Loop cap: **50 iterations** (generous — verification playthroughs cost iterations). 8 untested games (Invaders, Metris, Frogger, NeoJump, AgentChase, Rhythm, CloudJumper, CodeBreaker) stay OFF-LIMITS for per-game polish (R85 territory). CTRL-S also off-limits — Tom's reviewable now, not further polish scope.

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
5. **Stream E — Baselines + continuous improvement (R84.BL, R84.CI)**: only after B+C+D all `[x]`. Regen visual baselines, then burn remaining iterations on CI polish bucket.

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

- [ ] **R84.P1 [P1]** 5-second countdown after MenuScene — Pong currently skips to gameplay. Adopt `BaseScene.startCountdown` pattern (Frogger/Bird already use this).
- [ ] **R84.P2 [P0]** Scoring model overhaul — Tom's prose: *"tight match score (10-4) but power-up-weighted high-score for competitive leaderboard"*. (a) Keep match result tight integer-pair (first to 10, Pong classic). (b) Introduce parallel **High Score** = `match_score_diff × 100 + powerups_collected × 50 + multi_ball_triggered × 200 + longest_rally × 10 + win_bonus (500 if first-to-10)`. Commit new High Score into `gameStore.setHighScore('vortex-pong', computed)` only on game-over. Doc formula for Tom tuning.
- [ ] **R84.P3 [P1]** AI difficulty second-pass — Tom's *"too easy"* verdict survived R83.V1. Add 3 difficulty tiers (Easy/Normal/Hard) from MenuScene; Hard so median player loses 2-3 points per game; Easy forgiving. Default Normal. Persist via `localStorage`.
- [ ] **R84.P4 [P1]** Vortex atmosphere amp-up — "vortex" naming implies more depth than R83.V1's trail. Rotating radial-gradient backdrop (30-60s rotation, `MATRIX_COLORS.DARK_GREEN` → `NEAR_BLACK`), scanline +30%, paddle-glow pulse on ball approach. All procedural, no new textures.
- [ ] **R84.P5 [P1]** Power-up in-HUD legend (Snake-style from R83.S1) — 4 power-ups exist; Tom's testing doc implies he didn't know what each did. 4-line legend on PICKUP for ~4s with name + effect + duration.
- [ ] **R84.P6 [P2]** Multi-ball visual distinction — Tom's P2 scoring weights multi-ball highly; multi-ball balls render identical to primary. Tint multi-ball balls `MATRIX_COLORS.CYAN`.
- [ ] **R84.P7 [P2]** Paddle-hit trail verification + amplify — R83.V1 shipped; verify + consider 20-particle count on top-tier ball speed (base 12).
- [ ] **R84.P8 [P2]** Ball rally counter UI — feeds P2 High Score + is a satisfying metric. Small top-centre counter, pulses per hit, resets on goal.
- [ ] **R84.P9 [P2]** Goal-flash verification — R83.V1 dimmed; re-verify epilepsy-safe.
- [ ] **R84.P10 [P1]** Double-pause-overlay regression check — should be fixed by R83.G3; verify on Pong specifically.
- [ ] **R84.P11 [P2]** Paddle-motion smoothing — R83.V1 velocity model; if feels "snappy", add 100ms ease-in ramp from 0 → max.
- [ ] **R84.P12 [P1]** Unit-test coverage refresh — +12-15 tests for scoring formula / difficulty tiers / countdown / power-up legend.

**Stream C — Matrix Snake polish (R84.S1 → S10, ~10 iterations):**

- [ ] **R84.S1 [P1]** Yellow wall spacing fix. Tom: *"no space at the top of the portal and a little bit of space at the bottom"*. Root-cause (a) Snake-scene wall anchoring vs (b) R82 portal embedding — investigate both. Fix for equal top/bottom margin.
- [ ] **R84.S2 [P1]** Matrix funkiness depth pass — after R83.S1 rain+scanline+chromatic. Ship (a) in-play-area Matrix-rain particles at 0.15 alpha (not just bg), (b) snake-head `setShadow` glow in `MATRIX_COLORS.PRIMARY` at 6-8px radius, (c) per-food-type visual variant — bonus food gets ASCII-glyph treatment so food reads as "code eaten by snake".
- [ ] **R84.S3 [P1]** Power-up variety expansion — 2-3 new types (reverse controls 5s, double-score 10s, glitch-rain 3s obscuring screen). Each: icon + SFX + legend copy. Split across sub-iterations S3a/S3b/S3c if needed.
- [ ] **R84.S4 [P1]** Speed-tier dread build-up — current tiers trigger audio cues (R81); add visual build-up: scanline intensifies, BGM bass thickens, subtle camera shake under top-tier speed.
- [ ] **R84.S5 [P2]** Snake death cinematic — 300ms glitch-cascade (4-6 red horizontal bars strobing, same pattern as R83.CTRLS.12 climax-failure) before Game Over.
- [ ] **R84.S6 [P2]** Food pickup juice verification post-S1 apple-shrink.
- [ ] **R84.S7 [P2]** Boss-snake prototype (optional) — triggers at score 500: antagonist snake appears, player survives 30s while both compete. If time-constrained, `[DEFER]` to R85.
- [ ] **R84.S8 [P2]** Food/power-up sprite polish — ensure all food sprites snap to grid + feel crisp.
- [ ] **R84.S9 [P2]** Pause-overlay regression check on Snake specifically.
- [ ] **R84.S10 [P1]** Unit-test coverage refresh — new power-ups + boss-snake (if shipped) + wall-spacing fix.

**Stream D — Matrix Bird polish (R84.B1 → B12, ~12 iterations):**

- [ ] **R84.B1 [P1]** Display-name full audit — Tom: only landing-grid card shows "Matrix Bird", other surfaces might not. Audit landing card, portal card, ASCII title, HighScores modal, Scoreboard tab, Attract mode, About, save-data key. Replace all "Matrix Cloud" / cloud imagery. Folder stays `MatrixCloud/` (R83.B1 stability call).
- [ ] **R84.B2 [P1]** Preview image swap (card + portal). Tom: *"text still says matrix cloud (on the ipod) and has a picture of a cloud lol"*. Replace preview.png / card image with bird sprite. Regen baselines under R84.BL.
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
- R84.S1 – R84.S10 `[x]`
- R84.B1 – R84.B12 `[x]`
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

- **D1 [P1, Pong+Snake]** M-key unmute reported broken by Tom in both Pong and Snake testing docs. Static audit of `useSoundSystem.ts:1208–1237` (R83.G1 commit `6540b52`) shows symmetric toggle: mute sets masterGain=0 + saves preMuteConfigRef; unmute restores gain, restores {music,sfx}, and nudges paused BGM element back into play. Logic looks correct. **Hypothesis**: Tom's 2026-04-19 testing-doc note was written against a build that predates the R83.G1 fix (also dated 2026-04-19 but earlier in the day). **Action needed**: live re-test post-R84.V2 Snake audit — if unmute still fails, instrument `toggleMute` with temporary console trace to confirm which branch executes and inspect `backgroundMusicRef.current.paused` + `muted` + `src` states. Candidate edge case: if a scene is started while muted, `playBackgroundMP3` returns early at line 976 (guarded by `config.music`), so no audio element ever exists — unmute then has nothing to resume. Not Tom's reported flow (he starts unmuted, mutes, can't unmute) but worth guarding.

- **D2 [P1, cross-game]** Click-to-play overlay still reported by Tom in Pong + Snake docs. Grep of the Pong chain + `BaseScene` returns zero "click to play" strings. Overlay (if any) lives upstream — probably `GamePortal.tsx` or the landing-page transition mask. **Action needed**: spot-check `src/App.tsx`, `src/components/GamePortal.tsx` (or wherever portal composition renders) for a click-to-play layer that should have been removed by R83.G2. Live repro will clarify.

- **D3 [P1, cross-game]** Pause-overlay stacking ("double" or "triple" overlays reported). `BaseScene.togglePause` is single-owner; no Pong-side duplicate pause overlay. Upstream GamePortal/App composition may still render an additional overlay on top of the scene's own. **Action needed**: live inspect DOM when paused — count overlay layers; if >1, root-cause lives in GamePortal.

- **D4 [P2, Pong]** MenuScene start button Y ratio = 0.75 via `BaseScene.MENU_START_BUTTON_Y_RATIO`; Pong HOW-TO-PLAY band occupies y = 0.52..0.63. Clean 12% gap. Tom's "still overlapping" playtest note likely stale vs. pre-R83.G4 layout. Low priority; verify at 1280×800 during R84.BL baseline review.

- **D5 [P2, cross-game]** R83.G5 "Matrix launcher" transition implemented as `GAME_TRANSITION_READY_EVENT` fired one rAF after Phaser `ready` (`PhaserGame.tsx:216–232`). This is the "launcher fires on play-press" mechanism — the portal mask listens for this event and reveals the canvas. **Action needed**: live-confirm the portal mask actually reveals when the event fires (and has the 500ms safety timeout working).

- **D-P1 [P2, scope]** R84.P1 (5-second countdown for Pong) is ALREADY IMPLEMENTED at `GameScene.ts:121`. Plan task description is stale. When R84.P1 is picked up under Stream B, it should be a quick live-verify + auto-tick rather than new scene work. Suggested: demote P1 to a verification sub-task or merge into R84.V1's evidence table.

**From R84.V2 (Matrix Snake static audit, 2026-04-19 night):**

- **D6 [P2, Snake]** R83.S1 rename did not cover the ASCII block-letter title. `src/lib/asciiArt.ts:62` still has `'snake-classic': ['SNAKE', 'CLASSIC']`; `GAME_TITLES` is pre-computed at module load from this map, imported by `src/components/GamePortal.tsx:4`, and rendered as a huge ASCII banner overlaid on the portal hero card at `GamePortal.tsx:658`. Users see "SNAKE / CLASSIC" in block letters even though the registry title is "Matrix Snake". **Fix**: change the array to `['MATRIX', 'SNAKE']`. Must re-run `src/lib/asciiArt.test.ts` (tests assert `GAME_TITLES['snake-classic']` exists, contains `█`, no row > 60 chars — all satisfied by `MATRIX` (6 chars × 5-per-glyph + padding ≈ 34 chars) + `SNAKE` (5 × 5 ≈ 29). Must also regen visual baselines touching the Snake portal card. **Assigned**: fold into R84.S1 iteration OR carve a dedicated `R84.Sx` rename sub-task. NOT fixed in V2 per "verification commits are doc-only" ordering rule.

- **D7 [P2, Snake]** R83.S1 rename missed the achievements panel. `src/hooks/useSaveSystem.ts:148–154` has 7 Snake achievement rows all hard-coded with `game: 'Snake Classic'`. These strings surface in the Achievements modal (grouped-by-game sections) and in `useAchievementManager.test.ts:279–297` as test expectations against `stats.byGame['Snake Classic']`. **Fix**: switch labels to `'Matrix Snake'` and update the test expectations in lockstep (tests are an internal source of truth — no migration). **Assigned**: same as D6, fold into Stream C rename sub-task. NOT fixed in V2.

- **D8 [P2, Snake]** `SnakeGameScene.createHUD` places text at `leftX=100` and `rightX=700` (`GameScene.ts:216–236`) but `GAME_CONFIG.WIDTH=640`, so `rightX=700` is 60px off-screen. At default `Phaser.Scale.NONE` this would clip; current visible HUD on the right hints at a scale-mode quirk OR intentional use of a wider camera bounds. **Action needed**: live-inspect where the POWER-UPS / FOOD / power-up-indicator texts actually render at 1280×800 portal viewport. If clipped, R84.S layout fix + update HUD positioning math. Low priority — not a blocker; possibly Tom never noticed because the right HUD column is rarely populated.

- **D-S1-math [P1, Snake, evidence]** Yellow wall asymmetry (Tom's reproduction note) confirmed by static geometry: `GRID_OFFSET_Y=20`, walls at grid-rows `-1` and `GRID_ROWS` with `CELL_SIZE=16`. Top wall pixel span 4..20 (margin=4), bottom wall pixel span 340..356 (margin=44) on a 400px canvas. Balanced target: `GRID_OFFSET_Y=40` → symmetric 24px margin top/bottom. This is NOT a new discovery (R84.S1 already scoped it) but the math wasn't in the plan; logging here so the fixer can start from the equation rather than re-derive it.

**From R84.V3 (Matrix Bird static audit, 2026-04-19 night):**

- **D9 [P2, Bird]** Preview image on portal card is NOT a bird. `src/data/gameRegistry.ts:55` points at Cloudinary URL `.../A_surreal_thumbnail_of_a_glowing_neon_green_vortex_spiraling..._gyatls.png` — filename self-describes as a vortex illustration, matches Tom's complaint *"still has a picture of a cloud lol"*. Cloudinary URLs are immutable, so the fix requires either (a) uploading a new bird-sprite preview and swapping the URL, or (b) moving to an import-based preview (like Matrix Invaders + Metris already do at `gameRegistry.ts:2–3`). Path (b) is more robust and removes the external dependency. **Assigned**: R84.B2 (preview image swap — explicitly scoped in plan). Regen visual baselines under R84.BL after swap.

- **D10 [P2, Bird]** Tom's *"text still says matrix cloud (on the ipod)"* complaint CANNOT be reproduced statically. Every portal surface Ralph audited resolves to "Matrix Bird": iPod card reads `GAME_TITLES['matrix-cloud']` which is `'MATRIX\nBIRD'` ASCII (asciiArt.ts:64), `GamePortal.tsx` consumes `GAME_REGISTRY` whose title is `'Matrix Bird'`, Scoreboard + AttractMode both label `matrixCloud: 'Matrix Bird'`. Hypothesis: Tom's 2026-04-19 testing-doc note predates the R83.B1 fix commits (same-day but earlier). **Action**: LIVE-RETEST at 1280×800 — if iPod card still reads "Matrix Cloud", grep for hardcoded `"Matrix Cloud"` strings and rebuild (stale dev-server cache also possible).

- **D11 [P2, Bird, perf]** Tom's verdict *"can be better with performance upgrades"* is directional, not a specific bug. No static perf measurement available. Scope marker for R84.CI bucket priority 2 (performance micro-optimisations). When R84.B4 (pipe variety) and R84.B5 (3-layer parallax) ship, keep an eye on frame budget — parallax layers tend to be the first thing to stutter on low-end hardware. Object-pool audit for pipes + power-ups is a candidate since the game currently `destroy()`s + recreates every off-screen element.

- **D12 [P2, Bird, menu]** Tom: *"start button needs to be further down and click to play removed"* on MenuScene. Flagged under R83.G4 (start-button overlap — SHIPPED globally) and R83.G2 (click-to-play removal — SHIPPED), but Tom's note implies the Bird-specific MenuScene still shows the issue. Not reproducible from static read; could be a Bird MenuScene override of `BaseScene.MENU_START_BUTTON_Y_RATIO`. **Action**: when R84.B1 iteration runs (display-name audit including MenuScene), also verify start-button Y-ratio matches Pong/Snake. LIVE-RETEST required.

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
