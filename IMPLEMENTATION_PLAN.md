# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: **R86 open** (2026-04-22 — Stream F F1-F5/F7 shipped, Stream N up to N4 + N5 safety-net). R86 = **Frogger + Neo Jump polish + 3 global regressions** (Batch 2 of the 3-batch per-game polish cadence started by R85). Loop cap: **20 iterations**. **Stream G all `[x]`**. **Stream F F1/F2/F3/F4/F5/F7 `[x]`** (F6 Tom-tick only). **R86.N4 `[x]`** — P1 Neo Jump unit-test coverage refresh. N1/N2/N3 already landed +57 behaviour tests; following the Frogger R86.F7 playbook, N4 targets the single-line invariants those blocks hit only implicitly. **+12 regression tests** under a new `R86.N4 — unit-test coverage refresh` describe block in `GameScene.test.ts`, split across five micro-blocks: (1) **`update()` loop early-return gates** ×3 — a new `stubUpdateLoopSpies` helper stubs all 14 post-guard methods and asserts zero-calls under `isCountingDown=true` / `isPaused=true` / exactly-one-call each when both flags are false (same ordering contract R86.F2 surfaced on Frogger, so a future refactor that moves the guard inside a sub-method can't regress countdown-window spawn safety). (2) **`playerDeath` juice literals** ×2 — locks `cameras.main.shake(200, 0.012)` feel dial + the red-RGB `flash(120, 255, 0, 0, false, undefined, undefined, 0.25)` literal (guards against a copy/paste from Frogger F1's green-flash that would silently swap lethal feedback for achievement feedback). (3) **`handleInput` screen-wrap arithmetic** ×2 — left-to-right at `x < -WIDTH/2` with new `x = WIDTH + WIDTH/2` (player half-width, NOT canvas width) and the mirror case. (4) **`canCollideWithPlatform` one-way collider** ×3 — the pillar of Doodle Jump physics: rising player never collides, falling player below platform never collides, falling player above platform collides. Each asserts a different bit of the compound guard `velocity.y > 0 && player.y + height/2 < platform.y` so future simplifications can't turn the game into a ceiling-bonk simulator. (5) **Defensive `isDying` guards on collision paths** ×2 — `handleEnemyCollision` on a dying enemy: no `setTint`, `isGameOver` stays false, no kill-count increment; `handleProjectileHit` on a dying enemy: projectile not destroyed, no double-score (two projectiles 16ms apart hitting a freshly-dying enemy must not double-kill). Pure coverage refresh — no production code touched. Previously: **R86.N1 `[x]`** — P1 Neo Jump difficulty rebalance. Tom's playtest complaint *"too difficult, too many bombs early, too quick, you often just hit a bomb out of nowhere; you can't really avoid it"* addressed on five axes: (1) **tutorial zone extended** — `ENEMIES.SPAWN_ALTITUDE` 500 → 800, so first ~1000m is enemy-free and new players learn platform rhythm uninterrupted. (2) **spawn density reduced** — `SPAWN_CHANCE_BASE` 0.03 → 0.018 (matches Tom's "40%"), `SPAWN_CHANCE_MAX` 0.20 → 0.16, `SPAWN_CHANCE_PER_1000` 0.02 → 0.015 (gentler altitude ramp). (3) **enemies slowed** — `SPEED_MIN/MAX` 50-100 → 40-75 so the player can actually line up a shot or dodge instead of reacting to unreadable lateral blurs. (4) **jetpack buffed** — `FUEL_MAX` 100 → 120 (+20%), `FUEL_REGEN` 5 → 8 (+60% platform recovery), `FUEL_DRAIN` 30 → 25 (~17% slower burn) → effective airtime 3.33s → **4.8s per full tank** (+44%); two landings now fully refill (was 20). (5) **spawn fairness guards (NEW)** — `SPAWN_Y_OFFSET_ABOVE_CAMERA` 150 replaces the old hardcoded `cameraTop - 50` so enemies enter ~1s of visible descent BEFORE reaching gameplay height; `MIN_HORIZONTAL_SPACING_FROM_PLAYER` 80 skips any spawn whose X lands within 80px of the player's X (5 retry attempts; bail-out denies the column entirely for this tick) — direct counter to Tom's "bomb out of nowhere" quote. Code: `config.ts` ENEMIES + JETPACK blocks restructured with full WHY comments; `GameScene.ts` `maybeSpawnEnemy()` updated with retry loop + new Y-offset constant. Tests: **+19 regression tests** in a new `R86.N1 — Difficulty rebalance` describe block covering all six spawn constants, all three jetpack constants + a derived airtime invariant (`FUEL_MAX/FUEL_DRAIN ≥ 4.8s` — tripwire that catches one-constant regressions where individual values still "feel" right), both new fairness keys, four `maybeSpawnEnemy` behaviour tests (below-SPAWN_ALTITUDE guard, Y-offset uses new 150 constant, retry-exhaustion skip, outside-zone allow), and three anti-regression ratchets (`SPAWN_CHANCE_BASE < 0.03`, `FUEL_MAX > 100`, `SPEED_MAX < 100` — future rebalances can tighten further but can't re-hostile the game without an explicit test delete). Updated 3 in-place existing tests to track new constants (fuel regen `+5 → +FUEL_REGEN`, FUEL_MAX literal `100 → constant`, drain delta `30 → FUEL_DRAIN`). Harness: added `Phaser.Math.Between` seed at file head (global Phaser mock in setup.ts leaves `Math` undefined) so `vi.spyOn(Phaser.Math, 'Between')` works in future tests; new `stubRng()` helper saves + restores both `Math.random` and `Phaser.Math.Between` per test. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2851 tests pass + 2 todo** (+19 from R86.F7's 2832), `npm run build` clean 7.94s. Tom-tick awaited on next playtest — early game should feel reachable, jetpack should feel like a real escape, and a bomb should never materialise directly above Neo's ascent column. **R86.N2 `[x]`** — P1 fall-death threshold at 50m. Tom's playtest complaint *"Need to make it so if the player falls over 50 m, they die"* addressed via a new `fallApexY` tracker and a `PLAYER.MAX_FALL_DISTANCE_METRES = 50` config dial. `fallApexY` tracks the smallest `player.y` seen since the last platform landing or game start (mirrors the existing `highestY` pattern except local-reset-on-land); `handlePlatformCollision` resets it to the contact `player.y` so a successful bounce restarts the fall clock. `checkGameOver` now computes `(player.y - fallApexY) / SCORING.ALTITUDE_DIVISOR` (10 px/metre) and triggers `playerDeath` + `SOUND_KEYS.FALL` if the drop exceeds 50m — importantly this fires while the player is still on-camera, which is the whole point of the task (previously only an off-screen plunge killed, and at high altitudes the camera chasing Neo downward meant several seconds of consequence-free free-fall). Check is ordered BEFORE the existing off-screen guard so the death animation plays while still visible. +13 regression tests in a new `R86.N2 — Fall-death threshold` describe block: (1) constant locked at 50 + derived pixel-threshold of 500 (2) `fallApexY` reset on normal/spring/disappearing platform landings (3) `checkGameOver` behaviour — 49m survives, exactly-50m boundary survives (strict `>` operator locked), 50.1m dies, correct `SOUND_KEYS.FALL` sound, fires while on-camera (Tom's direct scenario), off-screen path still works when fall is small (regression guard), no-op when `isGameOver` already true (4) anti-regression: positive-finite constant + threshold ≤ viewport-height-in-metres (60m) so a future bump past viewport can't hide fall-through-screen bugs. Test helper updated: `scene.fallApexY = 500` matches player start Y; `scene.isGameOver = false` made explicit (was previously relying on a class-field-initialiser-on-mocked-Scene runtime quirk). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2865 tests pass + 2 todo** (+14 from R86.N1's 2851), `npm run build` clean 7.66s. Tom-tick awaited on next playtest — a missed platform from any altitude should now kill inside 50m rather than letting Neo plunge indefinitely while the camera chases. **R86.N3 `[x]`** — P1 in-game controls legend. Tom's playtest: *"We need to show the player what the controls are."* Shipped option (c) — both a MenuScene panel AND an in-play countdown overlay (Snake R83.S1 / Frogger R86.F5 cadence). (1) MenuScene: new `CONTROLS` heading + 5-row keycap legend (← → MOVE / ↑ / W JETPACK / SPACE SHOOT / P PAUSE / ESC EXIT) via exported ratios `CONTROLS_HEADING_Y_RATIO=0.46` + `CONTROLS_FIRST_ROW_Y_RATIO=0.52` + `CONTROLS_ROW_SPACING_Y_RATIO=0.035`, all rows strictly <0.70 with ≥10-px clearance to the shared START button (same anti-regression tripwire as Frogger R86.F5 / Invaders R85.I5). Text-only (not icons) because NeoJump's 400-px canvas can't host Frogger's six-column icon layout and Tom's brief was specifically about controls. (2) In-play overlay: new `createControlsOverlay()` in `GameScene` fires right after `startCountdown(5, …)` — two stacked 10-px lines (cyan "← → MOVE · ↑ JETPACK" + green "SPACE SHOOT · P PAUSE") in a Phaser container at (WIDTH/2, 50) with scrollFactor 0 + depth 150 (under the countdown digit at 200, over the HUD at 100). Chained alpha tween: 300 ms fade-in → 3000 ms hold → 800 ms fade-out → destroy (total 4.1 s, fits inside the 5 s countdown so the overlay is gone before gameplay frame 1). Shutdown path explicitly destroys the container + nulls the ref so an ESC-mid-fade doesn't throw. +25 regression tests: new `MenuScene.test.ts` (18 — ratios, `CONTROLS_ITEMS` order/length/key-ceiling, 11-text-call wiring, two-column keycap invariant, canvas rescaling, shared-baseline per row) + `GameScene.test.ts` `R86.N3 — In-play controls overlay` block (7 — container wiring/depth/scrollFactor, tween arming + chained fade-out + ≤5000 ms lifetime ceiling, destroy-on-complete, re-entry guard, shutdown-mid-fade safety). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2890 tests pass + 2 todo** (+25 from R86.N2's 2865), `npm run build` clean 7.71s. Tom-tick awaited. **R86.F6 safety-net (F7+)** — Ralph pre-F6 tripwires shipped 2026-04-22. +8 regression tests in a new `R86.F6 safety-net — Multi-level state persistence invariants` describe block at the end of `MatrixFrogger/scenes/GameScene.test.ts`. Frogger is a continuous-flow game: crossing the finish-line resets the PLAYER but score/combo/maxDistance/kungFuCharges/activePowerUps/nearMissCount MUST all carry over — a future "reset-everything" refactor would silently break all six. These tests pre-lock that contract so Tom's F6 playtest surfaces only genuine feel issues, not coverage gaps. Coverage: (1) score survives (only CROSS_BONUS additive), (2) combo + lastComboTime preserved, (3) maxDistance preserved, (4) kungFuCharges NOT refilled on cross (one-way depletion lock — prevents "grind Level 1 for infinite charges"), (5) activePowerUps + shieldHits preserved (shield from row 3 still protects Neo on Level 2's row 3), (6) nearMissCount preserved (DODGE_MASTER achievement reachable across levels), (7) monotonic level increment across two sequential crossings (1 → 2 → 3 — no cool-down blocking chaser threshold), (8) `CHASING_AGENT_MIN_LEVEL ≥ 2` anti-regression ratchet (Level 1 MUST stay chaser-free — tutorial-level anchor). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2910 tests pass + 2 todo** (+8 from R86.N4's 2902). **R86.N5 safety-net (N4+)** — Ralph pre-N5 tripwires shipped 2026-04-22 following the F6 playbook. N5 is Tom-tick only (post-rebalance ramp feel), but the staircase spawn-chance curve at `GameScene.ts:1082-1084` (`min(BASE + floor(altitude/1000) * PER_1000, MAX)`) had no coverage locking the checkpoint densities the ramp-tuning ticket hinges on. **+16 regression tests** in a new `R86.N5 safety-net — Difficulty ramp invariants (pre-Tom-tick)` describe block at the end of `NeoJump/scenes/GameScene.test.ts`, split across five micro-blocks: (1) **spawn-chance checkpoints** ×5 — 1000m=0.033 / 2000m=0.048 / 5000m=0.093 / 10000m=MAX (ceiling reached) / plateau at 15000m+20000m (clamp stays, no wrap). (2) **staircase integrity** ×4 — strictly increasing at every km boundary up to ceiling, non-decreasing across 0-20km sweep, floor-binning within a tier (500m=999m), step at tier boundary (999m<1000m). (3) **ceiling reachability** ×2 — tiers-to-ceiling ≤15 (ceiling reachable inside ~2× typical run) + ceiling NOT reached at 1000m (tutorial-plus-one stays gentle). (4) **SPAWN_ALTITUDE boundary** ×2 — altitude === 800m passes guard (locks `<` not `<=`), altitude 799m blocks (1m-tutorial-zone-growth tripwire). (5) **late-game anti-density** ×2 — nearby-enemy throttle fires when enemy sits in [cameraTop-100, cameraTop+200] band (prevents late-game clusters even at 0.16 ceiling chance), allows spawn when enemy sits well below camera (no ghost-retention choke). (6) **speed-range plumbing** ×1 — `Phaser.Math.Between(SPEED_MIN, SPEED_MAX)` is called with N1-rebalanced bounds and the returned value lands on `enemy.speed` (locks the speed dial chain so a future refactor that hardcodes speed silently ignores N1). Helpers (`setupSpawnMinimal`, `stubRng`, `spawnChanceAt`) are scoped inside the N5 block for composability — deliberately self-contained so the block can be deleted cleanly if N5 ever supersedes the safety-net. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2926 tests pass + 2 todo** (+16 from R86.F6 safety-net's 2910), `npm run build` clean 7.61s. **R86.N2+ safety-net (N5+)** — Ralph pre-Tom-tick tripwires shipped 2026-04-22 following the F6/N5 playbook. N2's existing 13 tests lock the positive invariant (platform landings reset `fallApexY`) but not the negative invariant (NO other path resets it). Stomp-kill gives a `JUMP_VELOCITY` boost and shield block absorbs lateral enemy hits — both are plausible candidates for a future "helpful" refactor that treats them as landing-equivalents and silently bypasses the 50m rule. **+7 regression tests** in a new `R86.N2+ safety-net — fallApexY reset isolation (pre-Tom-tick)` describe block: (1) `handleEnemyCollision` ×3 — stomp-kill, shield-block, fatal unshielded all leave `fallApexY` untouched; (2) `handleProjectileHit` ×1 — SPACE-bullet kill leaves apex untouched; (3) static isolation audit ×3 via new `readSceneSource()` helper — exactly 5 `this.fallApexY` runtime refs, exactly 3 write-sites (`=(?!=)` regex excludes `===`), exactly 2 `= this.player.y` assignments (update() min-tracker + `handlePlatformCollision`). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2933 tests pass + 2 todo** (+7 from R86.N5 safety-net's 2926). **Remaining work**: R86.F6 (multi-level playtest — Tom-tick only) + R86.N5 (post-rebalance ramp tuning — contingent on N1 Tom tick) + R86.V1 (visual baseline regen + full gate battery — ships LAST after F6/N5 `[x]`). All Ralph-side code shipped; phase in Tom-tick wait state. Loop-sentinel rule preserved (no `\bCOMPLETE\b` on Status line mid-phase). **R85 awaiting sign-off** (Tom-tick only). R84.S7 `[DEFER]` + R84.CI bucket + R83.CTRLS umbrella also Tom-tick only. Full R85 archive at [`COMPLETED_WORK.md § R85`](COMPLETED_WORK.md#r85--invaders--metris-polish--2-globals-2026-04-20--2026-04-21).

> **Archived phases** (full detail in [`COMPLETED_WORK.md`](COMPLETED_WORK.md)): R1–R75 (various), R76 final polish, R77 retro scoreboard, R78 assets + infrastructure, R79 residue closeout, R80 CTRL-S Phaser rewrite, R81 juice polish + repo trim, R82 iPod Classic portal redesign, R83 global polish + CTRL-S atmospheric rewrite, R84 3-game polish + verification, R85 Invaders + Metris polish + globals.

---

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


## R86 — Frogger + Neo Jump Polish + 3 Globals — **CURRENT ACTIVE PHASE** (MEDIUM — ~17 tasks, 20-loop cap)

> **Scope source**: `manual-testing-sessions/MANUAL_TESTING_CHECKLIST_{Matrix_Frogger,Neo_Jump}.md`. Every task below traces back to a specific line in those 2 docs. When Ralph picks a task, re-read the corresponding doc first — Tom's colloquial notes have reproduction detail the terse task summary here omits.
>
> **Why this phase exists**: Batch 2 of the 3-batch per-game polish cadence. Tom's Frogger + Neo Jump test surfaced 1 critical P0 (Frogger finish-line crash locking the game to Level 1) + 3 global regressions discovered only post-R85 (Neo Jump save path, click-to-focus pattern, WebGL warnings not globally fixed).

### R86 Ordering Rule (strict — do NOT jump ahead)

1. **Stream G — NEW Globals (R86.G1 → G3)**: blockers across multiple games, ship FIRST. G1 Neo-Jump-specific save path audit, G2 click-to-focus pattern (both games), G3 promote CTRL-S render config to shared Phaser baseline (affects all 8 `pixelArt: false` games).
2. **Stream F — Matrix Frogger polish (R86.F1 → F7)**: ONLY after Stream G `[x]`. **F1 is P0** — finish-line crash blocks multi-level play.
3. **Stream N — Neo Jump polish (R86.N1 → N5)**: parallel-safe with Stream F after G `[x]`. Main focus: difficulty rebalance (Tom: *"too difficult, too many bombs early, too quick"*).
4. **Stream V — Verification + baselines (R86.V1)**: ship LAST.

**Guardrails**:
- **R85 items OFF-LIMITS** — R85 is awaiting Tom's sign-off, DO NOT pick up R85 discovered-work entries during R86.
- **R84 items OFF-LIMITS** — R84.S7 (boss-snake `[DEFER]`) + R84.CI bucket both Tom-tick only.
- **CTRL-S OFF-LIMITS** — R83.CTRLS umbrella Tom-tick only.
- **4 untested games OFF-LIMITS for per-game polish**: AgentChase, Rhythm Hacker, CloudJumper, CodeBreaker. Shared-infrastructure changes (BaseScene, useSoundSystem, useSaveSystem, GamePortal, PHASER_CONFIG) that inherit through are fine — that IS the point of Stream G. What Ralph MUST NOT do is open any of those 4 game folders for per-game logic edits; wait for R87.
- **iPod portal (R82) locked** — no restructuring.
- **Existing tests must stay green** (~2,754 unit / 54 files). Any red gate blocks commit.
- **Loop-sentinel rule**: don't write `\bCOMPLETE\b` on Status line mid-phase (use "shipped" / "wrapped" / "all `[x]`" — `loop.sh` terminates on match at line 8).

### R86 Task List

**Stream G — NEW Globals (ship first, 3 iterations):**

- [x] **R86.G1 [P0]** **Neo Jump high-score persistence — defensive second write path** — static analysis confirmed Neo Jump's event-emission path (`reportScore` → `updateGameSave`) was structurally identical to Frogger's (which works). Chrome DevTools verification showed the *read* path works fine (injected `neoJump.highScore=2500` → Scoreboard modal displayed "TOM 2,500" correctly), which isolates the bug to a transient *write* hiccup — most likely a stale closure over `updateGameSave` in `PhaserGame.tsx`'s registered handler at the moment Neo Jump's death tween fires. Fix: mirror Metris's belt-and-suspenders pattern — call `saveSystem.updateGameSave('neoJump', {...})` directly inside the `playerDeath` onComplete (in addition to the existing `reportScore` event), so highScore + stats land via two independent routes. Added 3 regression tests in `GameScene.test.ts`: writes highScore+level+stats, merges stats correctly (gamesPlayed accumulates, bestCombo/longestSurvival keep max), no-ops gracefully when registry is empty. Gates: lint 0 err, 2757 tests pass, `tsc --noEmit` clean, `npm run build` clean. Tom-tick awaited on next playtest to confirm scoreboard integration now works.
- [x] **R86.G2 [P1]** **Click-to-focus required before Phaser game keys respond** — Tom: *"Keyboard controls all respond - need to click to use keys which could throw people off"* (flagged on both Frogger + Neo Jump). Root cause turned out to be more subtle than "canvas isn't focused": after R82's iPod portal redesign, `handlePlayPress` was capturing a `pendingSurfaceFocus` intent of `'dashbar'`, which routed post-play keyboard focus onto the dashbar toolbar. The dashbar's `onKeyDown={handleWheelKeyDown}` rove handler calls `event.stopPropagation()` on ArrowLeft/Right/Enter/Space/Home/End — and in React 17+, SyntheticEvent.stopPropagation also stops the *native* event, so Phaser's window-level keydown listener never fired until the user clicked into the canvas (which moved focus off the dashbar). Fix in three parts: (1) widened `pendingSurfaceFocus` ref type in `GamePortal.tsx` to include a `'game'` target; (2) `handlePlayPress` now captures `'game'` instead of `'dashbar'`; (3) new post-play `useEffect` with a `MutationObserver` watches the portal container for `[data-phaser-game="true"]` (handles React.lazy + Suspense late mount), focuses it with `preventScroll: true` the moment it appears, then disconnects. All three `PhaserGame.tsx` focus call-sites (`focusContainer`, `handleContainerClick`, `handleMouseEnter`) also upgraded to `preventScroll: true` so the iPod bezel's entry spring isn't double-animated by a `scrollIntoView` side-effect. Dashbar remains Tab-reachable for keyboard a11y; `:focus-visible` from R84.CI-6 continues to keep mouse users ring-free. Added 3 regression tests in `GamePortal.test.tsx`: dashbar does not auto-focus on play, container receives focus after mount, ESC → wheel path not regressed. Gates: 2760 tests pass (+3), `tsc --noEmit` clean, lint 0 err, `npm run build` clean.
- [x] **R86.G3 [P2]** **Promote WebGL render-config fix arcade-wide** — audit surfaced that the warnings fire on `pixelArt: true` games too (not just `pixelArt: false` as the task brief guessed), because `premultipliedAlpha` and `mipmapFilter` are WebGL-context-level settings, independent of sprite filtering. Fix: extracted both keys into a new `PHASER_RENDER_DEFAULTS` const in `src/lib/phaser/types.ts` with a full WHY block explaining the two Chrome / Firefox warnings each key silences. Spread the const into every game's `render` block (object-spread early so per-game `pixelArt` / `antialias` overrides still win): AgentChase, CloudJumper, CodeBreaker, CtrlSWorld (refactored — drops the R83.CTRLS.11 literal comment block in favour of the shared source of truth), MatrixCloud, MatrixFrogger, MatrixInvaders, Metris, NeoJump, RhythmHacker, SnakeClassic, VortexPong. For the five configs that previously only set top-level `pixelArt: true` (Invaders, MatrixCloud, Metris, CodeBreaker, Snake), added a fresh `render: { ...PHASER_RENDER_DEFAULTS }` block. New regression test at `src/lib/phaser/render-config.test.ts` enumerates all 12 configs with `it.each` and asserts `render.premultipliedAlpha === false` + `render.mipmapFilter === ''` — if a new Phaser game lands without the spread, the gate turns red instead of quietly regressing console hygiene. Gates: tsc clean, lint 0 err, build 7.73s, **2774 tests pass + 2 todo** (+14 from R86.G2's 2760). Tom-tick awaited: post-fix playtest of all 11 non-CTRL-S games should show a clean DevTools console.

**Stream F — Matrix Frogger polish (ship after Stream G, ~7 iterations):**

- [x] **R86.F1 [P0]** **Finish-line death / freeze crash — URGENT** — root cause was a three-way tween/physics/state-machine race in `MatrixFrogger/scenes/GameScene.ts`. `movePlayer()` sets `this.playerRow = 0` *before* its 150 ms hop tween starts, so `checkProgress()` — running in `update()` on the same frame — saw `playerRow === 0` and immediately spun up a second 300 ms reset tween on `this.player`, fighting the in-flight hop tween. Worse, the arcade physics body kept interpolating through road lanes 1-7 during the reset, firing `physics.add.overlap` → `handleEnemyCollision` → `playerDeath`, whose death tween (alpha=0, scale=0, angle=360) then *also* competed on `this.player`, stalling its onComplete and never reaching `gameOver()` — hence Tom's "get high score OR freezes and crashes". Fix: extracted the level-up flow into a new `triggerLevelUp()` method gated by an `isLevelingUp` state flag. The flow (1) sets the flag to block re-entry + input + collisions, (2) resets `playerRow` / `playerCol` synchronously so `checkProgress` can't re-fire next frame, (3) calls `this.tweens.killTweensOf(this.player)` to kill the in-flight hop tween, (4) disables the physics body (`body.enable = false`) so the reset tween's sprite interpolation can't trigger overlap damage, (5) runs the visual reset tween, (6) onComplete: re-enables the body, clears the flag. Belt-and-suspenders: `handleEnemyCollision` bails early on `isLevelingUp || isGameOver`, `handleInput` bails early on the same, and `bufferedInput` / `isMoving` are cleared on level-up entry. Added 8 regression tests in `GameScene.test.ts` under `Level-up safety (R86.F1)`: flag set, tweens killed, body disabled, reset onComplete re-arms everything, re-entry blocked, buffered input/isMoving cleared, collisions suppressed during level-up + game-over. Gates: `tsc --noEmit` clean, lint 0 err (4 pre-existing warnings), **2782 tests pass + 2 todo** (+8 from R86.G3's 2774), `npm run build` clean 7.73s. Tom-tick awaited on next playtest to confirm Level 2+ reachable without crash. Note: E2E Playwright test for the finish-line path is deferred to **R86.F7** (Frogger unit-test coverage refresh) since the current playthrough spec auto-dies before crossing; adding a deterministic finish-line E2E requires scene introspection hooks best batched with the test-coverage refresh pass.
- [x] **R86.F2 [P1]** **5-second countdown after MenuScene** — diagnosed as the **same cascade symptom R85.M2 fixed for Metris**, not a missing `startCountdown` call (Frogger already called `this.startCountdown(GAME_CONFIG.COUNTDOWN.DURATION, () => {})` at `GameScene.ts:215`). Root cause: `create()` armed `spawnInitialEnemies()` + `spawnPills()` + `time.addEvent({delay:2000, spawnEnemy, loop:true})` + `time.addEvent({delay:3000, spawnPills, loop:true})` **before** `startCountdown`, so new enemies appeared at t=2s/3s of the 5s countdown window — BaseScene did paint the digit at depth 200, but the board visually already had moving traffic, so Tom read the pre-game beat as "gameplay already running". Fix is a two-pronged defence-in-depth mirroring R85.M2: (a) gameplay arming is funnelled through a new `armGameplay()` method passed as `startCountdown`'s onComplete — the countdown now ticks on a clean board (lanes + labels + player only), and the first wave spawns the instant control returns; (b) `spawnEnemy()` and `spawnPills()` early-return on `this.isCountingDown || this.isGameOver || this.isLevelingUp` so a future refactor rearming the timer pre-countdown cannot resurrect the bug (also composes cleanly with R86.F1's `isLevelingUp` gate — no level-up spawn storms). Background music still starts immediately on `create()` so the menu→game handoff isn't silent. +9 regression tests in `R86.F2 — Countdown-gated spawn arming` describe block: guard-trip on spawnEnemy while `isCountingDown`/`isGameOver`/`isLevelingUp` (×3), same for spawnPills (×3), `armGameplay` spawns first wave + arms both interval timers with correct delays, `armGameplay` no-ops if player dies during countdown (isGameOver edge case), and a guard-flip tripwire proving `spawnEnemy` advances past its early-return once `isCountingDown` flips false. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2791 tests pass + 2 todo** (+9 from R86.F1's 2782), `npm run build` clean 7.76s. Tom-tick awaited on next playtest to confirm the countdown now reads as a distinct pre-game moment.
- [x] **R86.F3 [P1]** **Kung Fu HUD counter clipped** — Tom: *"cannot see this, needs moving up visually as its cut off, can see the 3 use limit though"*. Root cause was geometric, not stylistic: `createKungFuDisplay()` placed the 24×24 charge icons at `baseY = HEIGHT - 35 = 565` (centres), so icon bottoms rendered at y=589 — only 11px clear of the 600-tall canvas floor. Inside the iPod portal bezel that thin strip reads as "cut off". The 7px label at y=551 also sat inside the player's START safe row (y=512-592), fusing with the lane background and the depth-10 player sprite. Fix relocates the whole HUD into the top-left gutter alongside Score (y=10) / Distance (y=35) / Combo (y=55): label now at (10, 75) with fontSize bumped 7px → 10px and alpha 0.6 → 0.8 for parity with the other HUD labels; icons now at y=95. The placement exploits Frogger's 25° perspective taper: the left strip `x<120` stays dark through rows 0-2 (lane inset ≥120px), so the HUD never paints over traffic. Added 6 regression tests in `R86.F3 — Kung Fu HUD positioning` describe block: label-in-top-half, font-size-floor (≥10px), three-icons-share-baseline-in-left-gutter, clearance-from-canvas-floor tripwire requiring ≥100px gap (so portal bezel rounding can never clip again), label-above-icons ordering invariant, `kungFuIcons` array wiring preserved. Sprite mock upgraded from `mockReturnValue` → `mockImplementation` so each `add.sprite` call returns a fresh mock (required because `createKungFuDisplay` pushes multiple sprites into an array that tests then inspect independently). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2797 tests pass + 2 todo** (+6 from R86.F2's 2791), `npm run build` clean 7.72s. Tom-tick awaited on next playtest to confirm the full "KUNG FU [K] · ● ● ●" block is legible in the top-left at iPod portal scale.
- [x] **R86.F4 [P1]** **Object size vs safe-area hit-box audit** — Tom: *"Need to make sure the objects are not big enough to run into the safe area too"*. Audit quantified the encroachment: enemies render with `setOrigin(0.5, 1)` so their bottoms sit at `rowToY(row)` (lane centre) for the perspective lean, and Phaser's default `body.setSize(center=true)` anchors the body on the sprite's DISPLAY centre — `displayHeight/2` ABOVE the lane centre. At row 5 (cars, frame 16px × baseScale 3.0 × perspScale 0.85 → display 40.8px, laneH 66.6px) that puts `body.top` 7.5px past row 5's top, inside the row 4 middle safe zone (direct Tom repro). Rows 6+7 and the 64×64 agent/sentinel frames in the upper road lanes show the same pattern. Fix extracts body sizing into a new `applyEnemyBody(enemy, row)` helper invoked from `spawnEnemy`: (a) shrinks body width to `HITBOX.WIDTH_RATIO = 0.75` (lateral fairness — no ghost side-clips from scaled-up vehicles), (b) caps body height at `HITBOX.HEIGHT_RATIO = 0.85` of `laneH[row]` (body height source = `min(frame.h, (laneH * HEIGHT_RATIO) / scaleY)`), (c) calls `body.setOffset(offsetX, frame.height - bodyHeight/2)` so the body re-centres on `rowToY` rather than the displaced sprite centre. Chasers are exempt from the clamp because they cross lanes via `verticalSpeed` — constraining them to their "home" lane would shrink the hit-box mid-traversal. New `HITBOX` block in `config.ts` captures the WHY alongside the ratios so future asset-pack swaps don't silently regress the geometry. +6 regression tests in a new `R86.F4 — Hit-box clamped to lane bounds` describe block: lateral-shrink floor, row 5 car never extends past row 4 (direct Tom repro tripwire — derives `bodyTopRel` from the full Phaser body-offset formula `sprite.y - displayHeight + offsetY*scaleY`), body re-centres on rowToY, height-clamp engages under tight lanes, chaser keeps full-frame body + no setOffset call, HITBOX constants bounded in (0.5, 1]. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2803 tests pass + 2 todo** (+6 from R86.F3's 2797), `npm run build` clean 7.33s. Tom-tick awaited on next playtest — cars at row 5 should no longer phantom-hit Neo while he rests in the middle safe zone (row 4), and the upper-lane agents/sentinels should stay out of the finish-line row.
- [x] **R86.F5 [P1]** **Game-objects legend in menu + HUD** — Tom: *"we need to have what the different game objects are in the game menu"*. Fix adopts the Snake/Pong/Invaders legend pattern: `FroggerMenuScene` now exports `HOW_TO_PLAY_Y_RATIO=0.47`, `CONTROLS_Y_RATIO=0.52`, `LEGEND_HEADING_Y_RATIO=0.58`, `LEGEND_ICON_Y_RATIO=0.64`, `LEGEND_LABEL_Y_RATIO=0.675` + a `LEGEND_ITEMS` tuple of six `{ textureKey, label }` entries — **AGENT → SENTINEL → KUNG FU → POINTS → POWER-UP → NEO** (danger-first, reward-last scannable order). Icons are `setDisplaySize(22, 22)` so the heterogeneous sprite sources (16-px vehicles, 64-px agents, 32-px NEO) all normalise to the same menu column; columns are symmetric across the 800-px canvas width with 60-px side padding. Label ratio is 0.675 (tightened from 0.68) to preserve a ≥10-px clearance from the shared START button's top edge (y=425 on 600-px canvas) — the clearance is locked as an explicit test invariant so a future ratio drift fails the gate before it hits Tom's next playtest. +18 regression tests in a new `MenuScene.test.ts` cover: ratio-band membership, strict increase, button-clearance guard, anti-regression `< 0.70` tripwire (guards against the Invaders R85.I5 overlap), LEGEND_ITEMS length + textureKey-set membership (keys must match FroggerBootScene textures, so a BootScene edit can't silently orphan the legend), label-length ceiling, declared-order lock, heading/controls/LEGEND strings in order, headings on exported ratios, exactly 6 icons in declared order, shared icon baseline, symmetric X spacing invariant (`xs[0] + xs[last] === canvas width`), setDisplaySize(22,22) per icon, label-order lock, canvas-height scaling honoured. Test harness mirrors Invaders R85.I5: manual prototype-chain rebinding + `super.create()` stubbed via temporary prototype override. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2821 tests pass + 2 todo** (+18 from R86.F4's 2803), `npm run build` clean 7.62s. Tom-tick awaited on next playtest — menu should show the full object roster before a round begins. In-HUD power-up legend deferred to F6/F7 since the HUD refactor is bigger than F5's scope and F1 needs to unlock Level 2+ for a full pickup-sweep test anyway.
- [ ] **R86.F6 [P2]** **Multi-level polish** — contingent on F1 unlocking Level 2+. Once finish-line works, playtest subsequent levels for difficulty ramp feel + any scene-reset artefacts (e.g. agents not respawning, backdrop lingering). May balloon to 2 iterations if deeper polish needed post F1.
- [x] **R86.F7 [P1]** **Frogger unit-test coverage refresh** — +11 regression tests in `GameScene.test.ts` targeting single-line invariants that the existing 99-test suite only covered *behaviourally*. Three new describe blocks: (1) **Finish-line guards** ×5 — `checkProgress` short-circuits under `isGameOver`, `handleInput` early-returns under `isLevelingUp` / `isGameOver`, `triggerLevelUp` juice contract (`SOUND_KEYS.FROGGER_SCORE` + exact `cameras.main.flash(150, 0, 255, 0, false, undefined, undefined, 0.15)` RGB literal), `showLevelUpText` renders `LEVEL 2` after `this.level++`. (2) **update() countdown gate** ×2 — a `stubUpdateLoopSpies` helper stubs all post-guard update methods and asserts zero calls when `isCountingDown=true` / exactly-one when false, locking the top-level `update()` early-return that F2's spawn-guard depends on. (3) **Hit-box visible-bounds extensions** ×4 — X-offset symmetry (`offsetX === (frame.width - bodyWidth) / 2`), HEIGHT_RATIO clamp on 64×64 agents in tight upper lanes (extends F4's 16×16 coverage), `body=null` and `frame=null` defensive no-ops. Harness fix: `createTestScene()` now seeds `isLevelingUp: false` and `bufferedInput: null` defaults to mirror the real class fields — two F7 tests initially failed with `undefined` mismatches that would have quietly hidden state-machine regressions. No production code touched — pure coverage refresh. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2832 tests pass + 2 todo** (+11 from R86.F5's 2821), `npm run build` clean 7.59s. Legend render/dismiss coverage already landed in R86.F5's `MenuScene.test.ts` (+18) so F7 focuses where the real test-coverage gap was: invariant-level guards in GameScene.

**Stream N — Neo Jump polish (ship after Stream G, parallel with Stream F, ~5 iterations):**

- [x] **R86.N1 [P1]** **Difficulty rebalance** — Tom's playtest: *"too difficult, too many bombs early, too quick, you often just hit a bomb out of nowhere; you can't really avoid it."* Rebalance hits five axes simultaneously: (1) tutorial zone extended — `ENEMIES.SPAWN_ALTITUDE` 500 → 800, first ~1000m is now enemy-free; (2) spawn density reduced ~40% per Tom — `SPAWN_CHANCE_BASE` 0.03 → 0.018, `SPAWN_CHANCE_MAX` 0.20 → 0.16, `SPAWN_CHANCE_PER_1000` 0.02 → 0.015; (3) enemies slowed — `SPEED_MIN/MAX` 50-100 → 40-75 so they can be tracked + shot; (4) jetpack buffed — `FUEL_MAX` 100 → 120, `FUEL_REGEN` 5 → 8, `FUEL_DRAIN` 30 → 25 → airtime 3.33s → **4.8s per full tank** (+44%), two landings now fully refill; (5) NEW spawn fairness guards — `SPAWN_Y_OFFSET_ABOVE_CAMERA` 150 (was hardcoded 50, +100px visible descent) and `MIN_HORIZONTAL_SPACING_FROM_PLAYER` 80 with 5-retry bail-out so enemies never spawn in Neo's ascent column (direct counter to "bomb out of nowhere"). `config.ts` ENEMIES + JETPACK blocks restructured with full WHY blocks; `GameScene.ts` `maybeSpawnEnemy()` updated (retry loop + new Y-offset constant consumption). **+19 regression tests** in new `R86.N1 — Difficulty rebalance` describe block: all 9 constants + airtime invariant + both fairness keys + 4 behaviour tests (below-SPAWN_ALTITUDE guard, Y-offset arithmetic, retry exhaustion, outside-zone allow) + 3 anti-regression ratchets (`< 0.03`, `> 100`, `< 100`). Updated 3 in-place existing tests to use the constant instead of old literal. Harness: new `Phaser.Math.Between` seed at file head + `stubRng()` helper per-test. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2851 tests pass + 2 todo** (+19 from R86.F7's 2832), `npm run build` clean 7.94s. Tom-tick awaited on next playtest — early game should feel reachable, jetpack a real escape, bombs no longer spawn directly above Neo.
- [x] **R86.N2 [P1]** **Fall-death threshold at 50m** — Tom: *"Need to make it so if the player falls over 50 m, they die."* New `PLAYER.MAX_FALL_DISTANCE_METRES = 50` config dial (with full WHY block — units, reset semantics, motivation) + `fallApexY` field on `NeoJumpGameScene` tracking smallest `player.y` since last platform contact. Reset in `handlePlatformCollision` to `player.y` (contact point, not platform.y — anchors next bounce's 50m budget where Neo actually stood). Death check in `checkGameOver` fires BEFORE the existing off-screen guard so the player sees the death animation while still on-camera — which is Tom's scenario exactly: at high altitudes the camera chased Neo downward and a missed-platform fall was consequence-free for several seconds. +13 regression tests in a new `R86.N2 — Fall-death threshold` describe block: constant + derived 500px tripwire, reset-on-land for all three bouncing platform types, 49m survives / 50m exact survives (strict `>` operator boundary locked) / 50.1m dies, SOUND_KEYS.FALL played, on-camera trigger proof, off-screen fallback still works when fall is tiny, isGameOver double-trigger guard, plus anti-regression `positive-finite` + `≤ viewport-height-metres` bounds. Test helper updated: `scene.fallApexY = 500` + explicit `scene.isGameOver = false` (hardens the `isGameOver starts false` test that previously leaned on a mocked-Scene class-field quirk). Gates: tsc clean, lint 0 err, **2865 tests pass + 2 todo** (+14 from R86.N1's 2851), `npm run build` clean 7.66s. Tom-tick awaited on next playtest — falling past an apex with no platform below should now terminate the run inside 500px.
- [x] **R86.N3 [P1]** **In-game controls legend** — Tom: *"We need to show the player what the controls are."* Shipped option (c) — both a MenuScene panel AND a fading in-play overlay, matching the Snake R83.S1 / Frogger R86.F5 legend cadence. (1) **MenuScene** — `NeoJumpMenuScene` now exports `CONTROLS_HEADING_Y_RATIO=0.46`, `CONTROLS_FIRST_ROW_Y_RATIO=0.52`, `CONTROLS_ROW_SPACING_Y_RATIO=0.035` + a `CONTROLS_ITEMS` tuple of five `{ key, action }` entries — **← → MOVE · ↑ / W JETPACK · SPACE SHOOT · P PAUSE · ESC EXIT** (gameplay-frequency order). Layout is a two-column keycap list (key at centreX-40 in cyan, action at centreX+20 in primary green) — text-only rather than Frogger's icon columns because the 400-px NeoJump canvas can't host six 22-px sprites comfortably and Tom's ask was specifically about controls, not an object inventory. All five row Y positions land at 0.52 / 0.555 / 0.59 / 0.625 / 0.66 — strictly below the 0.70 invariant that Frogger R86.F5 + Invaders R85.I5 pin as anti-regression tripwires, with ≥10-px clearance to the START button (centre 0.75, ~50-px tall → top ≈0.708). (2) **In-play overlay** — new `createControlsOverlay()` method in `NeoJumpGameScene` fires right after `startCountdown(5, ...)` in `create()`. Two stacked 10-px cyan/green lines ("← → MOVE · ↑ JETPACK" + "SPACE SHOOT · P PAUSE") wrapped in a `Phaser.GameObjects.Container` at (WIDTH/2, 50) with scrollFactor 0 + depth 150 (under the countdown digit at 200, over the HUD at 100). Chained alpha tween: 300 ms fade-in → 3000 ms hold → 800 ms fade-out → destroy (total 4.1 s, comfortably inside the 5 s countdown so the overlay is gone before gameplay frame 1). Shutdown path explicitly destroys the container + nulls the reference to guard against a player hitting ESC mid-fade (otherwise the second tween would try to destroy an already-scene-killed object). Re-entry guard (`if (this.controlsOverlay) return`) prevents double-creation if a future refactor re-arms it. **+25 regression tests** split across two describe blocks: (a) `MenuScene.test.ts` — 18 tests covering the three ratio constants (band/strict-increase/heading-before-rows), last-row ≥10-px button-clearance tripwire, anti-regression `<0.70` lock, `CONTROLS_ITEMS` length + declared-order lock + 6-char key ceiling + N3 checklist sanity (arrow + jetpack + shoot cues present), 11-text-call wiring contract (1 heading + 5×2 rows), font-size assertion on the heading, derived-Y placement per row, key-left-of-action two-column invariant, canvas-height rescaling, and per-row shared-baseline lock. (b) `GameScene.test.ts` `R86.N3 — In-play controls overlay` block — 7 tests covering container wiring (scrollFactor 0 + depth 150 + alpha 0), `controlsOverlay` reference storage, fade-in tween arming, fade-out tween chained via onComplete with ≤5000 ms total lifetime ceiling, destroy + null on fade-out complete, re-entry guard no-op, and shutdown-mid-fade safety (firing fade-out onComplete after ref is nulled must NOT throw — exercises the `?.destroy()` optional-chain guard). Test harness uses the same prototype-rebinding pattern as Frogger R86.F5 (`BaseMenuScene.prototype.create = vi.fn()` stub + manual method binding because the global Phaser mock breaks the prototype chain). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2890 tests pass + 2 todo** (+25 from R86.N2's 2865), `npm run build` clean 7.71s. Tom-tick awaited on next playtest — menu should show the full control roster before a round begins, and the 5-second countdown should be a teaching moment with the overlay fading cleanly before gameplay starts.
- [x] **R86.N4 [P1]** **Neo Jump unit-test coverage refresh** — N1/N2/N3 already landed +57 behaviour tests spanning rebalance constants, fall-death threshold + apex tracking, and controls-legend render/dismiss. Following the Frogger R86.F7 playbook, N4 targets the single-line invariants those blocks hit only implicitly (or not at all). **+12 regression tests** under a new `R86.N4 — unit-test coverage refresh` describe block in `GameScene.test.ts`, split across five micro-blocks: (1) **`update()` loop early-return gates** ×3 — a new `stubUpdateLoopSpies` helper stubs all 14 post-guard methods (`updateParallaxRain` / `updateParallaxBuildings` / `handleInput` / `updatePlayer` / `updatePlatforms` / `updateEnemies` / `updateProjectiles` / `updateCollectibles` / `updateShield` / `updateJetpackFlame` / `generateContent` / `checkGameOver` / `updateUI` / `exposeTestState`) and asserts zero-calls under `isCountingDown=true` / zero-calls under `isPaused=true` / exactly-one-call each when both flags are false. Locks the same top-level ordering contract R86.F2 surfaced on Frogger, so a future refactor that moves the guard inside a sub-method can't regress the countdown-window spawn safety. (2) **`playerDeath` juice literals** ×2 — locks `cameras.main.shake(200, 0.012)` feel dial + the `cameras.main.flash(120, 255, 0, 0, false, undefined, undefined, 0.25)` red-RGB literal (direct regression guard against a copy/paste from Frogger F1's green-flash `(0, 255, 0, 0.15)` that would silently swap lethal feedback for achievement feedback). (3) **`handleInput` screen-wrap arithmetic** ×2 — Neo warps left-to-right at `x < -WIDTH/2` with new `x = WIDTH + WIDTH/2` (player half-width, NOT canvas width) and the mirror case right-to-left; locking the exact arithmetic prevents a "simpler" rewrite from dropping the half-width offset and making the player pop visibly at the seam. (4) **`canCollideWithPlatform` one-way collider** ×3 — pillar of Doodle Jump physics: rising player (velocity.y ≤ 0) never collides, falling player whose feet are below platform never collides, falling player whose feet are above platform collides. Each asserts a different bit of the compound guard `velocity.y > 0 && player.y + height/2 < platform.y` so future simplifications can't turn the game into a ceiling-bonk simulator. (5) **Defensive `isDying` guards on collision paths** ×2 — `handleEnemyCollision` on a dying enemy: no `setTint`, `isGameOver` stays false, `enemiesKilled` unchanged (race guard: overlap tick while death tween is still running must not re-kill Neo); `handleProjectileHit` on a dying enemy: projectile not destroyed, no kill-count increment (two projectiles 16ms apart hitting a freshly-dying enemy must not double-score). Harness: no new helpers other than `stubUpdateLoopSpies`; reuses existing `createTestScene` + `createMockEnemy`. No production code touched — pure coverage refresh. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2902 tests pass + 2 todo** (+12 from R86.N3's 2890), `npm run build` clean 7.66s.
- [ ] **R86.N5 [P2]** **Post-rebalance difficulty ramp tuning** — contingent on N1 landing. After Tom validates N1 feels right at early game, audit mid-game (500-1500m) and late-game (1500m+) difficulty ramps to ensure progression still feels compelling, not flattened by N1 nerfs.

**Stream V — Verification + Baselines (ship last, 1 iteration):**

- [ ] **R86.V1 [P1]** Visual baseline regen + full gate battery — after all G/F/N streams `[x]`. Commands: `npx tsc --noEmit` + `npm run lint` + `npm run build` + `npm test --run` + `npm run test:e2e` + `npm run test:visual -- --update-snapshots` (review diffs — Frogger finish-line fix + Neo Jump difficulty rebalance may invalidate baselines). Commit baseline regens separately as `R86.V1-visual: baseline update — Frogger + Neo Jump polish`. Verify WebGL warnings silenced across all 11 Phaser games post G3.

### R86 Verification Plan

1. **Stream G complete** → Tom plays Neo Jump, confirms high score saves (G1), both games' keys respond without clicking first (G2), browser console clean of WebGL warnings (G3).
2. **Streams F + N complete** → Tom plays each game 3-5 min: Frogger reaches Level 2+ without crash + Kung Fu HUD visible + cars stay in lanes + legend visible; Neo Jump feels fair + falls past 50m kill + controls shown.
3. **Stream V complete** → visual baselines reviewed + committed, full gate battery green.
4. **Automated gates per iteration**: `npx tsc --noEmit` + `npm run lint` + `npm run build` + `npm test --run`. Red blocks commit.
5. **Post-phase playtest**: Tom hand-plays Frogger + Neo Jump end-to-end, ticks Known Issues, writes R86 terminator phrase to Status.

### R86 Terminator

All of:
- R86.G1, G2, G3 `[x]`
- R86.F1 – R86.F7 `[x]`
- R86.N1 – R86.N5 `[x]`
- R86.V1 `[x]`
- Gates green: lint + build + unit + E2E + visual
- Tom manually writes **"R86 COMPLETE — Frogger + Neo Jump polish + globals shipped"** to Status

`loop.sh` hard cap: **20 iterations**. Ralph **never auto-writes** the terminator phrase — Tom's sign-off only.

### R86 Discovered Work

_(Ralph logs unexpected findings here during execution — do NOT create new R86.x tasks mid-iteration; log here for Tom's triage.)_

- **2026-04-22 — R86.F6 safety-net tripwires shipped ahead of Tom's F6 playtest** (logged as `F7+` rather than R86.F8 per the "no new tasks mid-iteration" rule). Ralph's reasoning: F6 is Tom-tick only (playtest-driven), but the plan's F6 description — *"scene-reset artefacts (e.g. agents not respawning, backdrop lingering)"* — hinges on a state-persistence contract the existing 110-test suite covered only implicitly. If Tom's playtest catches a multi-level bug, Ralph needs to know whether it's a genuinely new regression or a coverage gap Ralph should have closed pre-emptively. +8 regression tests in a new `R86.F6 safety-net — Multi-level state persistence invariants` describe block lock score / combo / maxDistance / kungFuCharges / activePowerUps / nearMissCount persistence, monotonic sequential level increment, and the `CHASING_AGENT_MIN_LEVEL ≥ 2` anti-regression ratchet. Gates all green (2910 unit tests, tsc clean, lint 0 err). No production code touched — pure coverage refresh.
- **2026-04-22 — R86.N5 safety-net tripwires shipped ahead of Tom's N5 playtest** (logged as `N4+` per the F6 playbook). Ralph's reasoning mirrors the F6 entry: N5 is Tom-tick only (does mid-game / late-game still feel compelling after N1's early-game nerfs?), but the staircase spawn-chance curve at `GameScene.ts:1082-1084` — `min(BASE + floor(altitude/1000) * PER_1000, MAX)` — had **zero coverage locking the density at altitude checkpoints**. A future rebalance that feels subjectively fine at 500m could silently flatten mid-game, and Tom's playtest would be the first signal. +16 regression tests in a new `R86.N5 safety-net — Difficulty ramp invariants (pre-Tom-tick)` describe block lock spawn chance at 1km/2km/5km/10km/15km/20km checkpoints, strict monotonicity at tier boundaries, non-decreasing behaviour across a 0-20km sweep, floor-binning integrity within a tier (500m=999m) plus the tier-boundary step (999m<1000m), tiers-to-ceiling ≤15 (reachable within a realistic run), SPAWN_ALTITUDE boundary behaviour (altitude 800m passes, 799m blocks — locks `<` not `<=`), the nearby-enemy throttle (late-game anti-cluster guard), and the Phaser.Math.Between(SPEED_MIN, SPEED_MAX) speed-dial plumbing. Gates all green (2926 unit tests, tsc clean, lint 0 err, build 7.61s). No production code touched — pure coverage refresh.
- **2026-04-22 — R86.N2+ safety-net tripwires shipped ahead of Tom's N2 playtest** (logged as `N5+` per the F6/N5 playbook). Ralph's reasoning: N2's existing 13 tests lock the *positive* invariant (`handlePlatformCollision` resets `fallApexY` for all three platform types) and the threshold-math behaviour, but nothing locks the *negative* invariant — that NO other gameplay path resets the fall-death clock. Stomp-kill gives Neo a `JUMP_VELOCITY` boost, and shield block absorbs a lateral enemy hit. Either is a plausible candidate for a future "helpful" refactor that treats the event as a landing-equivalent and silently bypasses the 50m rule. +7 regression tests in a new `R86.N2+ safety-net — fallApexY reset isolation (pre-Tom-tick)` describe block at the end of `NeoJump/scenes/GameScene.test.ts`. Coverage: (1) `handleEnemyCollision` ×3 — stomp-kill (descending onto enemy, fires `setVelocityY(JUMP_VELOCITY)` boost) leaves apex untouched; shield-block (lateral enemy contact while shielded) leaves apex untouched, shield consumed as sanity; fatal unshielded collision (side-on, no shield) still doesn't reset apex before `playerDeath` — locks defensive invariant. (2) `handleProjectileHit` ×1 — SPACE-bullet kill leaves apex untouched, projectile destroyed as sanity. (3) **Static isolation audit** ×3 — new `readSceneSource()` helper greps the production source via `fs.readFileSync`: exactly 5 `this.fallApexY` runtime references (excludes comments + class-field decl), exactly 3 write-sites (`this.fallApexY\s*=(?!=)` — regex excludes `===` false positives), exactly 2 assignments of pattern `this.fallApexY = this.player.y` (update() min-tracker + handlePlatformCollision reset). If any of these drift, a new code path touched the fall-death clock — the gate forces an audit against N2's "escape, not immunity" design intent. Gates all green (2933 unit tests, tsc clean, lint 0 err). No production code touched — pure coverage refresh.

---

## R85 — Invaders + Metris Polish + 2 Globals — **AWAITING TOM'S SIGN-OFF**

All 17 sub-bullets shipped across 4 streams (G globals, I Invaders, M Metris, V verification). Full detail archived at [`COMPLETED_WORK.md § R85`](COMPLETED_WORK.md#r85--invaders--metris-polish--2-globals-2026-04-20--2026-04-21).

- **Terminator phrase**: Tom manually writes `R85 COMPLETE — Invaders + Metris polish + globals shipped` into the Status line at top. Ralph cannot self-write this.
- **If Tom's playthrough surfaces blocking bugs**: log under `### R86 Discovered Work` or add R85 `.M6+/.I10+` sub-bullets (scope-permitting).
- **Test count**: 2,754+ unit tests / 54 files.

---

## R83 — Global Polish + CTRL-S Rewrite — **AWAITING TOM'S SIGN-OFF**

All 38 sub-bullets shipped across 3 rounds. Full detail archived at [`COMPLETED_WORK.md § R83`](COMPLETED_WORK.md#r83--global-polish--ctrl-s-rewrite-2026-04-19).

- [ ] **R83.CTRLS** (umbrella) — stays `[ ]` until Tom hand-plays CTRL-S from JACK IN → CTRL-S climax under Round 3 polish + Round 2 dread atmosphere + new ASCII library, without hitting a blocking bug. Tom-only tick.
- **Terminator phrase**: Tom manually writes `R83 COMPLETE — global polish + CTRL-S rewrite shipped` into the Status line at top. Ralph cannot self-write this.
- **If Tom's playthrough surfaces blocking bugs**: log under `### R86 Discovered Work` or add R83 Round 4 sub-bullets `.29+` (scope-permitting).

---

## R84 — 3-Game Polish + Verification — **AWAITING TOM'S SIGN-OFF**

54 commits shipped across 5 streams (A Verification, B Pong, C Snake, D Bird, U Upstream, E BL+CI). Full detail archived at [`COMPLETED_WORK.md § R84`](COMPLETED_WORK.md#r84--3-game-polish--verification-2026-04-19--2026-04-20).

- [ ] **R84.S7 `[DEFER]` to R85** — boss-snake prototype. Explicitly scoped as optional in original brief. Deferred to R85 (8-game polish phase). Tick here when R85 opens + carries it forward.
- [ ] **R84.CI** — continuous-improvement bucket. 15 iterations already shipped (CI-1 through CI-15: 9 a11y, 3 perf object-pool, 2 attract, 1 visual). **INTENTIONALLY never auto-ticked** (R82.13 pattern) — Tom ticks after playtest sign-off.
- **Terminator phrase** (Tom writes after 3-game playtest): `R84 COMPLETE — 3-game polish + verification shipped` in the Status line above.
- **Test count**: 2,459+ unit tests / 49 files (up from 1,927 / 45 pre-R84, +532 regression tripwires).

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


## Deferred / Future Phases (post-R86)

These phases are scoped but NOT scheduled. Ralph does NOT touch them during R86.

### R87 — Batch 3: AgentChase + Rhythm Hacker polish

The next batch in the batches-of-2 cadence. Contingent on Tom playtesting both games + filling their `MANUAL_TESTING_CHECKLIST_*.md` Known Issues blocks. R87 task list built from those notes the same way R85/R86 were.

### R88 — Batch 4 (final batch): CloudJumper + CodeBreaker polish

Final per-game polish batch covering the last 2 untested games. Same pattern — Tom playtests, fills testing docs, R88 scope emerges.

### R89+ — Performance + ship-readiness

Tom's note: *"the rest of the work will be performance and getting the games perfect"* — post all per-game polish batches, focus shifts to performance profiling, final polish sweeps, and ship-readiness (Lighthouse audits, Web Vitals tuning, licensed asset-pack swap per Future Asset Strategy, PWA audits).

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
