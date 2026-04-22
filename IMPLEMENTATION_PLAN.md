# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: **R87 open — K1+K2+K3 shipped 2026-04-23** (2026-04-23 — CloudJumper + CodeBreaker polish + Agent Chase level-advance. Final per-game polish batch in the 4-batch cadence (R84 Pong/Snake/Bird → R85 Invaders/Metris → R86 Frogger/NeoJump/AgentChase/RhythmHacker → R87 last 2 games). Tom's 2026-04-22/23 hand-playtest notes surfaced **3 P0 blockers in CodeBreaker** — green-bomb power-up soft-lock (miss last ball + grab bomb → stuck, ball never respawns, Tom screenshot `codebreakerbug.png` confirms), green-bomb spontaneous mid-level game-over (same power-up terminates session), and dead keyboard/numpad paddle controls (only mouse works, Tom: *"keys get stuck"*). Plus **1 P1 Agent Chase level-advance** lifted from Tom's 2026-04-23 in-session screenshot (empty maze, 4 agents visible post-A2 release, SCORE 2570 / LVL 1, no level transition on dot-clear — Ralph's A2 release fix works but there's no dots-remaining=0 handler). Plus 5 P1 CodeBreaker polish (ball-speed rebound cap, L1→L3 difficulty retier, manual bullet-time on B key, power-up legend, brick-SFX dedup) and 5 P1 CloudJumper polish (single-jump gate only on cloud, jump-height cap off-screen prevention, braking mechanic, death SFX swap, movement-SFX removal) + C6 freeze-repro P2. Plus **2 P1 Rhythm Hacker** lifted 2026-04-23 late (RH1 track-complete / level-completed UX flow missing — Tom finished a track with no high-score or level-completed banner; RH2 cap all songs at 120s max). Stream order: **K1+K2+K3 P0 blockers FIRST** → K4-K8 polish → AC1 (1 iteration) → C1-C6 CloudJumper → RH1+RH2 Rhythm Hacker → K9+C7 coverage → V1 verification. Loop cap: 24 iterations. Ralph never auto-writes the terminator phrase. **R86 awaiting sign-off** (Tom-tick only — phrase lives in R86 stub). R85/R84/R83 all also awaiting sign-off. Full R86 archive at [`COMPLETED_WORK.md § R86`](COMPLETED_WORK.md#r86--frogger--neo-jump--agent-chase--rhythm-hacker--3-globals-2026-04-21--2026-04-22). Test baseline at phase entry: 3,115 unit tests / 60 files.

### Previous R86 Status (archive — see COMPLETED_WORK.md after phase closes)

R86 shipped G1-G3 + F1-F7 + N1-N4 + seven safety-net layers covering multi-level state persistence, timer isolation, difficulty-ramp arithmetic, playerDeath contracts, fallApexY reset isolation. R86 = **Frogger + Neo Jump polish + 3 global regressions** (Batch 2 of the 3-batch per-game polish cadence started by R85). Loop cap: **20 iterations**. **Stream G all `[x]`**. **Stream F F1/F2/F3/F4/F5/F7 `[x]`** (F6 Tom-tick only). **R86.N4+ safety-net (F6+++ safety-net+)** — Ralph pre-Tom-tick tripwires shipped 2026-04-22 following the F6+++ playbook. Neo Jump's mirror of F6+++: N4 locked `playerDeath`'s shake/flash literals and the existing Game Over block locks the red tint + `isGameOver` flag + "tween starts" + re-entry guard; G1 locks the `saveSystem.updateGameSave` branch. That leaves three invariant families unprotected on the death path: (1) **juice contract** — `playSound(SOUND_KEYS.GAME_OVER)` + the four-key tween motion signature (`targets=player, alpha=0, y=+100, angle=180, duration=500`); a refactor extracting a "death helper" could silently drop the sound or swap the rotation for a fade. (2) **onComplete ordering + gameOver payload** — the chain must be `reportScore → saveSystem write → gameOver` with `highScore = max(score, highScore)` firing BEFORE reportScore so the scoreboard sees the new watermark; `gameOver`'s 6-arg payload has a fixed shape (`score`, reason `Altitude: Xm`, highScore, 2-row stats `[Enemies, Collectibles]`, level=`floor(alt/500)`, duration) — exact shape of the R85.G1 scoreboard regression, so payload drift here breaks both the modal layout and saved stats. (3) **playerSpriteMode branch** — the sprite-mode path calls `updatePlayerTexture('death')`; the programmatic-graphics path does not; a refactor that flips the default mode leaves the player dying while still looking alive. **+9 regression tests** in a new `R86.N4+ safety-net — playerDeath contract + onComplete chain (pre-Tom-tick)` describe block at the end of `NeoJump/scenes/GameScene.test.ts`, split across three micro-blocks: (1) **juice contract — playSound + tween motion** ×3 — `playSound('gameOver')` called exactly once, tween `targets === scene.player`, four-key motion literals `alpha=0 + y=player.y+100 + angle=180 + duration=500`. (2) **onComplete — reportScore → gameOver ordering + payload** ×4 — `invocationCallOrder` lock (reportScore before gameOver), highScore promoted BEFORE reportScore on new-high path (`reportScore(3000, 3000)` not `(3000, 1000)`), highScore preserved when score is lower (`reportScore(500, 1000)`), full gameOver 6-arg payload (`1500, 'Altitude: 1500m', 1500, [Enemies/Collectibles 2-row stats], level=3, duration=42000`). (3) **playerSpriteMode branch — death texture** ×2 — `updatePlayerTexture('death')` called when `playerSpriteMode=true`, NOT called when `false`. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2966 tests pass + 2 todo** (+9 from R86.F6+++ safety-net's 2957), `npm run build` clean 7.63s. Pure coverage refresh — no production code touched. Previously: **R86.F6+++ safety-net (F6++ safety-net+)** — Ralph pre-Tom-tick tripwires shipped 2026-04-22 following the F6/F6+/F6++/N2+/N5 cadence. Previous F6 safety-nets lock state persistence + timer isolation + difficulty-ramp arithmetic, but three invariant families remain unlocked that map DIRECTLY onto Tom's F6 brief ("scene-reset artefacts... backdrop lingering"): (1) `playerDeath`'s tween→onComplete→gameOver chain — R86.F1 removed a 3-way tween race that previously stalled this onComplete (Tom's original "freeze on finish line" symptom); the existing Game-Over tests assert `isGameOver` flips + a tween gets added but do NOT lock `onComplete` actually reaching `reportScore + gameOver`, nor the stats payload shape — a refactor that simplifies `playerDeath` could silently break the chain and revive the freeze without tripping any gate. (2) `triggerLevelUp`'s COL reset + reset-tween feel dials — F1 tests ROW reset behaviourally but leaves `playerCol → START_COL` + `duration: 300` + `ease: 'Back.easeOut'` unverified; a refactor dropping the col reset would leave Neo stuck in the rightmost column after every level transition (direct multi-level artefact). (3) `showLevelUpText`'s self-cleanup via `onComplete → destroy` — without destroy, every finish-line cross leaves an orphaned depth-200 text node; a 5-level run stacks 5 dead text nodes on the scene graph ("backdrop lingering" made literal). **+9 regression tests** in a new `R86.F6+++ safety-net — playerDeath contract + level-up reset + banner cleanup` describe block at the end of `MatrixFrogger/scenes/GameScene.test.ts`, split across three micro-blocks: (1) **playerDeath juice + onComplete chain** ×5 — `shake(200, 0.012)` literal, `flash(120, 255, 0, 0, false, undefined, undefined, 0.25)` red-RGB literal (direct copy/paste guard against the triggerLevelUp GREEN flash), tween motion signature `alpha=0 + scale=0 + angle=360 + duration=500 + targets=player`, onComplete chains `reportScore(450, 450)` BEFORE `gameOver(450, 'Hit by AGENT', 450, [4-row stats], level, duration)` with `invocationCallOrder` ordering lock (the freeze-prevention contract — if onComplete breaks this chain the game-over screen never paints), enemy-less death ternary locks `reason='Game Over'` fallback. (2) **triggerLevelUp reset arithmetic** ×2 — `playerCol === START_COL` AND `playerRow === START_ROW` after checkProgress→triggerLevelUp (pairs col lock with existing row lock); reset tween filters tweens.add mock for `targets === scene.player` then asserts `duration: 300` + `ease: 'Back.easeOut'` feel dials. (3) **showLevelUpText banner cleanup** ×2 — `onComplete → text.destroy()` invocation (banner leak tripwire: destroy called exactly once after onComplete fires, NOT before), motion literals `alpha: 0 + scale: 1.5 + duration: 1000 + ease: 'Quad.easeOut' + y: HEIGHT/2 - 50` (50-px rise from centre). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2957 tests pass + 2 todo** (+9 from R86.F6++ safety-net's 2948), `npm run build` clean 7.68s. Pure coverage refresh — no production code touched. Previously: **R86.N4 `[x]`** — P1 Neo Jump unit-test coverage refresh. N1/N2/N3 already landed +57 behaviour tests; following the Frogger R86.F7 playbook, N4 targets the single-line invariants those blocks hit only implicitly. **+12 regression tests** under a new `R86.N4 — unit-test coverage refresh` describe block in `GameScene.test.ts`, split across five micro-blocks: (1) **`update()` loop early-return gates** ×3 — a new `stubUpdateLoopSpies` helper stubs all 14 post-guard methods and asserts zero-calls under `isCountingDown=true` / `isPaused=true` / exactly-one-call each when both flags are false (same ordering contract R86.F2 surfaced on Frogger, so a future refactor that moves the guard inside a sub-method can't regress countdown-window spawn safety). (2) **`playerDeath` juice literals** ×2 — locks `cameras.main.shake(200, 0.012)` feel dial + the red-RGB `flash(120, 255, 0, 0, false, undefined, undefined, 0.25)` literal (guards against a copy/paste from Frogger F1's green-flash that would silently swap lethal feedback for achievement feedback). (3) **`handleInput` screen-wrap arithmetic** ×2 — left-to-right at `x < -WIDTH/2` with new `x = WIDTH + WIDTH/2` (player half-width, NOT canvas width) and the mirror case. (4) **`canCollideWithPlatform` one-way collider** ×3 — the pillar of Doodle Jump physics: rising player never collides, falling player below platform never collides, falling player above platform collides. Each asserts a different bit of the compound guard `velocity.y > 0 && player.y + height/2 < platform.y` so future simplifications can't turn the game into a ceiling-bonk simulator. (5) **Defensive `isDying` guards on collision paths** ×2 — `handleEnemyCollision` on a dying enemy: no `setTint`, `isGameOver` stays false, no kill-count increment; `handleProjectileHit` on a dying enemy: projectile not destroyed, no double-score (two projectiles 16ms apart hitting a freshly-dying enemy must not double-kill). Pure coverage refresh — no production code touched. Previously: **R86.N1 `[x]`** — P1 Neo Jump difficulty rebalance. Tom's playtest complaint *"too difficult, too many bombs early, too quick, you often just hit a bomb out of nowhere; you can't really avoid it"* addressed on five axes: (1) **tutorial zone extended** — `ENEMIES.SPAWN_ALTITUDE` 500 → 800, so first ~1000m is enemy-free and new players learn platform rhythm uninterrupted. (2) **spawn density reduced** — `SPAWN_CHANCE_BASE` 0.03 → 0.018 (matches Tom's "40%"), `SPAWN_CHANCE_MAX` 0.20 → 0.16, `SPAWN_CHANCE_PER_1000` 0.02 → 0.015 (gentler altitude ramp). (3) **enemies slowed** — `SPEED_MIN/MAX` 50-100 → 40-75 so the player can actually line up a shot or dodge instead of reacting to unreadable lateral blurs. (4) **jetpack buffed** — `FUEL_MAX` 100 → 120 (+20%), `FUEL_REGEN` 5 → 8 (+60% platform recovery), `FUEL_DRAIN` 30 → 25 (~17% slower burn) → effective airtime 3.33s → **4.8s per full tank** (+44%); two landings now fully refill (was 20). (5) **spawn fairness guards (NEW)** — `SPAWN_Y_OFFSET_ABOVE_CAMERA` 150 replaces the old hardcoded `cameraTop - 50` so enemies enter ~1s of visible descent BEFORE reaching gameplay height; `MIN_HORIZONTAL_SPACING_FROM_PLAYER` 80 skips any spawn whose X lands within 80px of the player's X (5 retry attempts; bail-out denies the column entirely for this tick) — direct counter to Tom's "bomb out of nowhere" quote. Code: `config.ts` ENEMIES + JETPACK blocks restructured with full WHY comments; `GameScene.ts` `maybeSpawnEnemy()` updated with retry loop + new Y-offset constant. Tests: **+19 regression tests** in a new `R86.N1 — Difficulty rebalance` describe block covering all six spawn constants, all three jetpack constants + a derived airtime invariant (`FUEL_MAX/FUEL_DRAIN ≥ 4.8s` — tripwire that catches one-constant regressions where individual values still "feel" right), both new fairness keys, four `maybeSpawnEnemy` behaviour tests (below-SPAWN_ALTITUDE guard, Y-offset uses new 150 constant, retry-exhaustion skip, outside-zone allow), and three anti-regression ratchets (`SPAWN_CHANCE_BASE < 0.03`, `FUEL_MAX > 100`, `SPEED_MAX < 100` — future rebalances can tighten further but can't re-hostile the game without an explicit test delete). Updated 3 in-place existing tests to track new constants (fuel regen `+5 → +FUEL_REGEN`, FUEL_MAX literal `100 → constant`, drain delta `30 → FUEL_DRAIN`). Harness: added `Phaser.Math.Between` seed at file head (global Phaser mock in setup.ts leaves `Math` undefined) so `vi.spyOn(Phaser.Math, 'Between')` works in future tests; new `stubRng()` helper saves + restores both `Math.random` and `Phaser.Math.Between` per test. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2851 tests pass + 2 todo** (+19 from R86.F7's 2832), `npm run build` clean 7.94s. Tom-tick awaited on next playtest — early game should feel reachable, jetpack should feel like a real escape, and a bomb should never materialise directly above Neo's ascent column. **R86.N2 `[x]`** — P1 fall-death threshold at 50m. Tom's playtest complaint *"Need to make it so if the player falls over 50 m, they die"* addressed via a new `fallApexY` tracker and a `PLAYER.MAX_FALL_DISTANCE_METRES = 50` config dial. `fallApexY` tracks the smallest `player.y` seen since the last platform landing or game start (mirrors the existing `highestY` pattern except local-reset-on-land); `handlePlatformCollision` resets it to the contact `player.y` so a successful bounce restarts the fall clock. `checkGameOver` now computes `(player.y - fallApexY) / SCORING.ALTITUDE_DIVISOR` (10 px/metre) and triggers `playerDeath` + `SOUND_KEYS.FALL` if the drop exceeds 50m — importantly this fires while the player is still on-camera, which is the whole point of the task (previously only an off-screen plunge killed, and at high altitudes the camera chasing Neo downward meant several seconds of consequence-free free-fall). Check is ordered BEFORE the existing off-screen guard so the death animation plays while still visible. +13 regression tests in a new `R86.N2 — Fall-death threshold` describe block: (1) constant locked at 50 + derived pixel-threshold of 500 (2) `fallApexY` reset on normal/spring/disappearing platform landings (3) `checkGameOver` behaviour — 49m survives, exactly-50m boundary survives (strict `>` operator locked), 50.1m dies, correct `SOUND_KEYS.FALL` sound, fires while on-camera (Tom's direct scenario), off-screen path still works when fall is small (regression guard), no-op when `isGameOver` already true (4) anti-regression: positive-finite constant + threshold ≤ viewport-height-in-metres (60m) so a future bump past viewport can't hide fall-through-screen bugs. Test helper updated: `scene.fallApexY = 500` matches player start Y; `scene.isGameOver = false` made explicit (was previously relying on a class-field-initialiser-on-mocked-Scene runtime quirk). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2865 tests pass + 2 todo** (+14 from R86.N1's 2851), `npm run build` clean 7.66s. Tom-tick awaited on next playtest — a missed platform from any altitude should now kill inside 50m rather than letting Neo plunge indefinitely while the camera chases. **R86.N3 `[x]`** — P1 in-game controls legend. Tom's playtest: *"We need to show the player what the controls are."* Shipped option (c) — both a MenuScene panel AND an in-play countdown overlay (Snake R83.S1 / Frogger R86.F5 cadence). (1) MenuScene: new `CONTROLS` heading + 5-row keycap legend (← → MOVE / ↑ / W JETPACK / SPACE SHOOT / P PAUSE / ESC EXIT) via exported ratios `CONTROLS_HEADING_Y_RATIO=0.46` + `CONTROLS_FIRST_ROW_Y_RATIO=0.52` + `CONTROLS_ROW_SPACING_Y_RATIO=0.035`, all rows strictly <0.70 with ≥10-px clearance to the shared START button (same anti-regression tripwire as Frogger R86.F5 / Invaders R85.I5). Text-only (not icons) because NeoJump's 400-px canvas can't host Frogger's six-column icon layout and Tom's brief was specifically about controls. (2) In-play overlay: new `createControlsOverlay()` in `GameScene` fires right after `startCountdown(5, …)` — two stacked 10-px lines (cyan "← → MOVE · ↑ JETPACK" + green "SPACE SHOOT · P PAUSE") in a Phaser container at (WIDTH/2, 50) with scrollFactor 0 + depth 150 (under the countdown digit at 200, over the HUD at 100). Chained alpha tween: 300 ms fade-in → 3000 ms hold → 800 ms fade-out → destroy (total 4.1 s, fits inside the 5 s countdown so the overlay is gone before gameplay frame 1). Shutdown path explicitly destroys the container + nulls the ref so an ESC-mid-fade doesn't throw. +25 regression tests: new `MenuScene.test.ts` (18 — ratios, `CONTROLS_ITEMS` order/length/key-ceiling, 11-text-call wiring, two-column keycap invariant, canvas rescaling, shared-baseline per row) + `GameScene.test.ts` `R86.N3 — In-play controls overlay` block (7 — container wiring/depth/scrollFactor, tween arming + chained fade-out + ≤5000 ms lifetime ceiling, destroy-on-complete, re-entry guard, shutdown-mid-fade safety). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2890 tests pass + 2 todo** (+25 from R86.N2's 2865), `npm run build` clean 7.71s. Tom-tick awaited. **R86.F6 safety-net (F7+)** — Ralph pre-F6 tripwires shipped 2026-04-22. +8 regression tests in a new `R86.F6 safety-net — Multi-level state persistence invariants` describe block at the end of `MatrixFrogger/scenes/GameScene.test.ts`. Frogger is a continuous-flow game: crossing the finish-line resets the PLAYER but score/combo/maxDistance/kungFuCharges/activePowerUps/nearMissCount MUST all carry over — a future "reset-everything" refactor would silently break all six. These tests pre-lock that contract so Tom's F6 playtest surfaces only genuine feel issues, not coverage gaps. Coverage: (1) score survives (only CROSS_BONUS additive), (2) combo + lastComboTime preserved, (3) maxDistance preserved, (4) kungFuCharges NOT refilled on cross (one-way depletion lock — prevents "grind Level 1 for infinite charges"), (5) activePowerUps + shieldHits preserved (shield from row 3 still protects Neo on Level 2's row 3), (6) nearMissCount preserved (DODGE_MASTER achievement reachable across levels), (7) monotonic level increment across two sequential crossings (1 → 2 → 3 — no cool-down blocking chaser threshold), (8) `CHASING_AGENT_MIN_LEVEL ≥ 2` anti-regression ratchet (Level 1 MUST stay chaser-free — tutorial-level anchor). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2910 tests pass + 2 todo** (+8 from R86.N4's 2902). **R86.N5 safety-net (N4+)** — Ralph pre-N5 tripwires shipped 2026-04-22 following the F6 playbook. N5 is Tom-tick only (post-rebalance ramp feel), but the staircase spawn-chance curve at `GameScene.ts:1082-1084` (`min(BASE + floor(altitude/1000) * PER_1000, MAX)`) had no coverage locking the checkpoint densities the ramp-tuning ticket hinges on. **+16 regression tests** in a new `R86.N5 safety-net — Difficulty ramp invariants (pre-Tom-tick)` describe block at the end of `NeoJump/scenes/GameScene.test.ts`, split across five micro-blocks: (1) **spawn-chance checkpoints** ×5 — 1000m=0.033 / 2000m=0.048 / 5000m=0.093 / 10000m=MAX (ceiling reached) / plateau at 15000m+20000m (clamp stays, no wrap). (2) **staircase integrity** ×4 — strictly increasing at every km boundary up to ceiling, non-decreasing across 0-20km sweep, floor-binning within a tier (500m=999m), step at tier boundary (999m<1000m). (3) **ceiling reachability** ×2 — tiers-to-ceiling ≤15 (ceiling reachable inside ~2× typical run) + ceiling NOT reached at 1000m (tutorial-plus-one stays gentle). (4) **SPAWN_ALTITUDE boundary** ×2 — altitude === 800m passes guard (locks `<` not `<=`), altitude 799m blocks (1m-tutorial-zone-growth tripwire). (5) **late-game anti-density** ×2 — nearby-enemy throttle fires when enemy sits in [cameraTop-100, cameraTop+200] band (prevents late-game clusters even at 0.16 ceiling chance), allows spawn when enemy sits well below camera (no ghost-retention choke). (6) **speed-range plumbing** ×1 — `Phaser.Math.Between(SPEED_MIN, SPEED_MAX)` is called with N1-rebalanced bounds and the returned value lands on `enemy.speed` (locks the speed dial chain so a future refactor that hardcodes speed silently ignores N1). Helpers (`setupSpawnMinimal`, `stubRng`, `spawnChanceAt`) are scoped inside the N5 block for composability — deliberately self-contained so the block can be deleted cleanly if N5 ever supersedes the safety-net. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2926 tests pass + 2 todo** (+16 from R86.F6 safety-net's 2910), `npm run build` clean 7.61s. **R86.N2+ safety-net (N5+)** — Ralph pre-Tom-tick tripwires shipped 2026-04-22 following the F6/N5 playbook. N2's existing 13 tests lock the positive invariant (platform landings reset `fallApexY`) but not the negative invariant (NO other path resets it). Stomp-kill gives a `JUMP_VELOCITY` boost and shield block absorbs lateral enemy hits — both are plausible candidates for a future "helpful" refactor that treats them as landing-equivalents and silently bypasses the 50m rule. **+7 regression tests** in a new `R86.N2+ safety-net — fallApexY reset isolation (pre-Tom-tick)` describe block: (1) `handleEnemyCollision` ×3 — stomp-kill, shield-block, fatal unshielded all leave `fallApexY` untouched; (2) `handleProjectileHit` ×1 — SPACE-bullet kill leaves apex untouched; (3) static isolation audit ×3 via new `readSceneSource()` helper — exactly 5 `this.fallApexY` runtime refs, exactly 3 write-sites (`=(?!=)` regex excludes `===`), exactly 2 `= this.player.y` assignments (update() min-tracker + `handlePlatformCollision`). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2933 tests pass + 2 todo** (+7 from R86.N5 safety-net's 2926). **R86.F6+ safety-net (F6 safety-net+)** — Ralph pre-Tom-tick tripwires shipped 2026-04-22 following the N2+ playbook. The original F6 safety-net locks state PERSISTENCE across level-up (score / combo / kungFuCharges / etc all carry over) but does NOT lock the *timer-isolation* contract: `triggerLevelUp` must never touch the loop-true `Phaser.Time.TimerEvents` `armGameplay()` armed for enemy + pill spawning. A "helpful" refactor that calls `this.time.removeAllEvents()` on level-up to flush stale callbacks would silently break enemy spawn on Level 2+, which matches Tom's F6 brief verbatim ("agents not respawning"). The LEVEL_5 achievement boundary is also untested — the `if (this.level >= 5)` gate at `triggerLevelUp:1293` could silently drift to `=== 5` and break players who reach level 6+ via any future skip-level mechanic. **+7 regression tests** in a new `R86.F6+ safety-net — Level-up timer isolation + LEVEL_5 boundary` describe block: (1) `triggerLevelUp` does NOT call `this.time.removeAllEvents` / `removeEvent` (direct lock against Tom's "agents not respawning" risk); (2) `triggerLevelUp` does NOT call `this.time.addEvent` (mirror invariant — no duplicate spawn timers per level, would stack callbacks); (3) does NOT unlock LEVEL_5 at level 4 (locks `>= 5` lower bound — must not fire too early); (4) unlocks LEVEL_5 at exactly level 5 (locks the threshold — `>=` boundary equality); (5) still unlocks LEVEL_5 at higher levels — pre-increment 7 → 8 (locks `>=` operator vs `===` regression); (6) always unlocks FIRST_CROSS on every level-up (idempotent unlock contract — guards against a "first" rename → `if (level === 1)` refactor); (7) updates levelText post-increment via updateUI ("LEVEL: 3" after increment from 2, locks the increment-then-updateUI ordering). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2940 tests pass + 2 todo** (+7 from R86.N2+ safety-net's 2933), `npm run build` clean 7.68s. **R86.F6++ safety-net (F6+ safety-net+)** — Ralph pre-Tom-tick tripwires shipped 2026-04-22 following the F6+/N2+/N5 cadence. F6 + F6+ safety-nets lock state persistence and timer isolation, but the *difficulty-ramp arithmetic* stays unlocked — specifically the two single-line magic numbers shaping how Level 2 feels different from Level 1: the `(this.level - 1) * 15` per-level speed bonus at `GameScene.ts:1068` (primary ramp dial — a refactor promoting the literal to a config constant or dropping it silently flattens the escalation) and the `roll < 0.10 && this.level >= 2` NEO-pickup gate at line 1139 (drops the check → level-1 NEO drops break the tutorial; tightens to `=== 2` → Level 5+ runs mysteriously stop yielding NEO). The `ENEMY_COUNT_BASE * 2` first-wave multiplier at line 1083 is also untested (a drop would halve early-game density invisibly). **+8 regression tests** in a new `R86.F6++ safety-net — Difficulty-ramp arithmetic + NEO level-gate` describe block: (1) `spawnInitialEnemies` fires exactly `ENEMY_COUNT_BASE * 2` (= 6) times — locks the `*2` first-wave anchor via `vi.fn()` spy on `spawnEnemy`; (2) `spawnPills` at level 1 with `Math.random` forced to 0.05 → `pillType !== 'neo'` AND `pills.get` never called with `'neo_pickup'` (tutorial anchor locked — even a broken gate check that "mostly works" fails both assertions); (3) `spawnPills` at level 2 with same roll → NEO branch fires (`pillType === 'neo'`, texture key `'neo_pickup'` passed to `pills.get` — locks the `>= 2` threshold exactly); (4) `spawnPills` at level 7 with same roll → still fires NEO (locks `>=` vs `===` operator regression); (5) static source check: `/\(this\.level\s*-\s*1\)\s*\*\s*15/g` matches exactly once (locks the `+15 per level` magic number literal); (6) static source check: `/enemy\.baseSpeed\s*=[^;]*difficultyBonus[^;]*levelBonus/` matches (locks both bonus terms appearing together in the arithmetic chain — a refactor collapsing the two would silently drop per-level escalation while keeping distance scaling); (7) `SPEED_INCREASE_PER_100 === 10` (secondary distance-ramp multiplier — F6 state-persistence already locks maxDistance survives across levels, this anchors the weight); (8) `ENEMY_COUNT_BASE === 3` (first-wave anchor — the `*2` doubling test depends on this baseline). Harness addition: new `beforeEach` in the F6++ block seeds `Phaser.Math.Between` locally if undefined (the global Phaser mock leaves `Math` unset; mirrors the NeoJump test-file idiom) so `spawnPills`'s col/row lookups don't crash. Gates: tsc clean, lint 0 err (4 pre-existing warnings), **2948 tests pass + 2 todo** (+8 from R86.F6+ safety-net's 2940), `npm run build` clean 7.62s. **Remaining work**: R86.F6 (multi-level playtest — Tom-tick only) + R86.N5 (post-rebalance ramp tuning — contingent on N1 Tom tick) + R86.V1 (visual baseline regen + full gate battery — ships LAST after F6/N5 `[x]`). All Ralph-side code shipped; phase in Tom-tick wait state. Loop-sentinel rule preserved (no `\bCOMPLETE\b` on Status line mid-phase). **R85 awaiting sign-off** (Tom-tick only). R84.S7 `[DEFER]` + R84.CI bucket + R83.CTRLS umbrella also Tom-tick only. Full R85 archive at [`COMPLETED_WORK.md § R85`](COMPLETED_WORK.md#r85--invaders--metris-polish--2-globals-2026-04-20--2026-04-21).

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


## R87 — CloudJumper + CodeBreaker Polish (+ Agent Chase level-advance + Rhythm Hacker track-complete) — **CURRENT ACTIVE PHASE** (MEDIUM — ~20 tasks, 24-loop cap)

> **Scope source**: `manual-testing-sessions/MANUAL_TESTING_CHECKLIST_{Cloud_Jumper,Code_Breaker,Agent_Chase,Rhythm_Hacker}.md`. Every task below traces back to a specific line in those 4 docs plus Tom's 2026-04-23 in-session Agent Chase level-advance report + 2026-04-23 Rhythm Hacker track-complete report. When Ralph picks a task, re-read the corresponding doc first.
>
> **Why this phase exists**: Final per-game polish batch in the 4-batch cadence (R84 did Pong/Snake/Bird; R85 did Invaders/Metris; R86 did Frogger/NeoJump/AgentChase/RhythmHacker; R87 closes with the last 2 untested games + 2 lifted post-R86 bugs). After R87 ships, the 11-game arcade is fully polish-passed and focus shifts to R88+ performance/ship-readiness.
>
> **New for R87**: 2 P0 soft-locks in CodeBreaker (green-bomb power-up orphans ball or terminates game mid-level), 1 P0 dead-keyboard-input regression in CodeBreaker (only mouse controls paddle), 1 P1 Agent Chase level-advance bug (no transition on dot-clear — Tom 2026-04-23 screenshot confirms empty maze stuck on L1), 2 P1 Rhythm Hacker (track-complete flow missing post-R86.R4 + 120s song cap — Tom's 2026-04-23 late report), plus 5 P1 CodeBreaker polish items and 5 P1 CloudJumper polish items.

### R87 Ordering Rule (strict — do NOT jump ahead)

**K1 + K2 + K3 are P0 — CodeBreaker is LITERALLY UNPLAYABLE for keyboard users, and the green-bomb soft-lock bricks any session where a player grabs that power-up.** Prioritise them ahead of everything else in the phase.

1. **R87.K1 [P0]** CodeBreaker green-bomb soft-lock — bomb power-up activates after missing last ball → bomb triggers, no ball respawns, game stuck with paddle + bricks + lives remaining. Tom's screenshot confirms. Audit bomb `onComplete`: if `balls.length === 0 && lives > 0 && !isGameOver` → spawn new ball on paddle; if `balls.length === 0 && lives === 0` → trigger game-over.
2. **R87.K2 [P0]** CodeBreaker green-bomb spontaneous game-over — same bomb power-up occasionally terminates game with high-score screen mid-level. Likely shares a root cause with K1; treat as paired fix or split if audit surfaces two distinct race conditions.
3. **R87.K3 [P0]** CodeBreaker keyboard/numpad controls dead — arrow keys, A/D, numpad 4/6 all unresponsive; only mouse moves paddle. Tom: *"keyboard keys get stuck and cannot move unless use the mouse"*. Audit handler wiring on `create()` — compare against Vortex Pong / Metris patterns.
4. **R87.AC1 [P1]** Agent Chase level-advance — Tom 2026-04-23: *"there is no way to play the next level, I won and it just continued but nothing happened"* (screenshot shows empty maze, 4 agents visible post-A2 release, SCORE 2570 / LIVES 2 / LEVEL 1, no dot respawn, no level transition). Check `update()` for a `dotsRemaining === 0` hook; wire level-up flow (reset dots, clear power-pellets, increment level, reset agent positions, pause+countdown if appropriate, bump difficulty dial).
5. **R87.K4 [P1]** CodeBreaker ball-speed rebound cap — ball rebounds too fast, especially with packed grids. Tom asks for a slowdown. Audit paddle-bounce / brick-bounce velocity; clamp max speed + possibly add per-bounce easing on steep angles.
6. **R87.K5 [P1]** CodeBreaker level-1 difficulty retier — Tom: *"current level 1 should become level 3"*. Either reorder the level data or insert 2 new easier warm-up levels before the current L1. Adjust gate/progression dials so L3 still caps at the pre-R87 "L1" feel.
7. **R87.K6 [P1]** CodeBreaker manual bullet-time on B key — auto-activation makes one ball slow and is unhelpful. Move to manual: charge meter fills on brick-destroy, press B to activate, consumes charge. Mirrors the Metris R85.M3 pattern.
8. **R87.K7 [P1]** CodeBreaker power-up legend — Tom: *"we need some sort of info about this before we start playing the game"*. Add to MenuScene + on-pickup HUD overlay. Reuse Pong R84.P5 / Invaders R85.I6 legend pattern (4s display, 200/400ms fade, cancellation-token guard, prefers-reduced-motion branch).
9. **R87.K8 [P1]** CodeBreaker brick-SFX dedup — too loud/repetitive. Throttle repeat plays (e.g. ≥50ms between triggers, or only every Nth rapid hit). Similar asks landed in Snake R84.S-series and Pong R84.P-series.
10. **R87.C1 [P1]** CloudJumper single-jump gate — player can infinite-jump mid-air; should only jump when on a cloud. Classic Phaser 3 gate: set `canJump=true` on cloud-contact, consume on jump, reset only on next cloud contact. Regression test: fire `handleJump()` repeatedly without cloud contact → `velocity.y` changes only on the first call.
11. **R87.C2 [P1]** CloudJumper jump-height cap + off-screen fix — Tom: *"sometimes the player jumps too hard and he goes off screen"*. Either clamp jump velocity absolute max OR detect off-screen-above and pull player back to visible-top-safe-Y OR lower platform spacing. Pick whichever keeps the Doodle-Jump feel.
12. **R87.C3 [P1]** CloudJumper braking / stop — Tom: *"The player should be able to stop. This is to avoid hitting things by accident and provide more control"*. Add horizontal-velocity friction when no movement key held (or an explicit brake key). Audit current acceleration curve — may just need a damping coefficient.
13. **R87.C4 [P1]** CloudJumper death SFX swap — Tom: *"current sound is harrowing lol"*. Replace with something less jarring. Keep procedural / chip-tune style (no asset files).
14. **R87.C5 [P1]** CloudJumper movement-SFX removal — Tom: *"Remove the brick breaking sound effects when moving along, please"*. Wrong SFX hooked to lateral movement. Delete the hook; movement should be silent (or emit a softer wind-whoosh if already defined).
15. **R87.C6 [P2]** CloudJumper freeze repro — Tom: *"Sometimes the game freezes"*. Low-signal; needs repro case. Ralph audits update-loop for any unbounded-loop / re-entrancy / infinite-tween risk. If no smoking gun, log as R88+ perf-work.
16. **R87.RH1 [P1]** Rhythm Hacker track-complete flow — Tom 2026-04-23 post-R86: *"I have just completed a level and no high score came up or level completed"*. Audit `trackComplete()` (GameScene.ts:~1147): after R86.R4's highScore promotion fix the scoreboard writes correctly, but the UX hand-off (reportScore → gameOver with reason `"TRACK COMPLETE"` / initials-entry / "LEVEL COMPLETE" overlay) doesn't surface to the player. Compare against Metris M2 win-flow for the canonical pattern.
17. **R87.RH2 [P1]** Rhythm Hacker 120s song cap — Tom: *"we need to make the songs 2 minutes at max, they are too long"*. Cap all 5 tracks at 120s playback. Pick one: (a) audio-side edit (shortens the file; cleanest UX) — requires re-rendering BGM assets, (b) scene-side early-end at t=120000ms triggering `trackComplete()` via the post-RH1 win-flow. (b) is the procedural/safer option — keeps the asset pipeline untouched. Regression test locks the cap + trackComplete firing at the boundary.
18. **R87.K9 [P1]** CodeBreaker unit-test coverage refresh — closes Stream K.
19. **R87.C7 [P1]** CloudJumper unit-test coverage refresh — closes Stream C.
20. **R87.V1 [P1]** Visual baseline regen + full gate battery — ship LAST after all K/AC/C/RH `[x]`.

**Guardrails**:
- **R86 items OFF-LIMITS** — R86 is awaiting Tom's sign-off. Do NOT pick up R86 discovered-work entries.
- **R85 items OFF-LIMITS** — R85 awaiting Tom's sign-off. Do NOT pick up R85 discovered-work entries.
- **R84 items OFF-LIMITS** — R84.S7 + R84.CI bucket Tom-tick only.
- **CTRL-S OFF-LIMITS** — R83.CTRLS umbrella Tom-tick only.
- **8 other games OFF-LIMITS for per-game polish**: SnakeClassic, VortexPong, MatrixCloud/Bird, MatrixInvaders, Metris, MatrixFrogger, NeoJump. (Agent Chase is in R87 only for AC1; Rhythm Hacker is in R87 only for RH1+RH2 — do NOT revisit A1/A2/A3 or R1/R2/R3/R4.) Shared-infrastructure changes (BaseScene, useSoundSystem, useSaveSystem, GamePortal) are fine.
- **iPod portal (R82) locked** — no restructuring.
- **Existing tests must stay green** (~3,115 unit / 60 files). Any red gate blocks commit.
- **Loop-sentinel rule**: don't write `\bCOMPLETE\b` on Status line mid-phase (use "shipped" / "wrapped" / "all `[x]`" — `loop.sh` terminates on match at line 8).

### R87 Task List

**Stream K — CodeBreaker polish (ship FIRST, P0 blockers, ~8-9 iterations):**

- [x] **R87.K1 [P0]** **Green-bomb power-up soft-lock `[x]`** — Tom's 2026-04-22 playtest repro (paddle + bricks + 2 lives + 0 balls after "miss last ball + grab power-up") fixed via a new `reconcileBallState()` invariant run at the end of every `update()` tick, after all collision checks have settled. Guarantees: if the scene emerges from a frame with `balls.length === 0 && !isGameOver && !isLevelComplete` we either (a) respawn an attached ball when `isBallAttached === true` (defensive — covers any future code path that destroys the attached ball without a replacement) or (b) call `loseLife()` to treat it as a belated life-loss so the lives counter stays honest. The reconciler is call-ordered AFTER `checkPortalCollision` and BEFORE `checkLevelComplete` so a legitimate portal→completeLevel→delayedCall doesn't race it. Gated on the `livesLostThisFrame` guard shared with K2 so a reconciler-triggered loseLife can never double-debit on top of a collision-triggered one. Shipped alongside K2+K3 in one commit since all three are P0 blockers for keyboard-user playability + any green-bomb pickup session.
- [x] **R87.K2 [P0]** **Green-bomb spontaneous game-over mid-level `[x]`** — Tom: *"got the green bomb, and it closed the game, just terminated with a high score. I was almost finished level 1"*. Root cause shared with K1: `loseLife()` had no per-frame guard, so a chaotic frame (ball drops to firewall + agent lands on paddle + boss bullet hits paddle) could fire `loseLife()` 2-3 times in one `update()` tick, debiting lives all the way to zero → spontaneous game-over. Fixed via `livesLostThisFrame: boolean` tracked on the scene, reset at the top of every `update()` and set the first time `loseLife()` runs. `loseLife()` now early-returns if `livesLostThisFrame || isGameOver || isLevelComplete`. Second fix layer: `activatePowerUp()` gains a matching `if (isGameOver || isLevelComplete) return;` guard so a late-arriving power-up pickup can't fire side-effects (EMP destroying bricks, multiBall spawning balls, laser scheduling a delayedCall revert) into a scene that's already transitioning — if a bomb power-up was what flipped the state to game-over via K2's shared root cause, the same power-up must not then activate retroactively. Shipped with K1+K3.
- [x] **R87.K3 [P0]** **Keyboard + numpad controls dead `[x]`** — Tom: *"keyboard keys get stuck and cannot move unless use the mouse"*. Root cause: `handlePaddleMovement()` pointer-override condition was `pointer.isDown || pointer.x !== this.paddle.x`. The `pointer.x !== paddle.x` side was ALMOST ALWAYS TRUE — the cursor rarely sits exactly on paddle's numeric x position — so every frame the pointer-tracking branch fired and wrote over the keyboard's dx delta, snapping the paddle to the last-known mouse position. Fixed by comparing `pointer.x` against a new `lastPointerX: number` field (sentinel `-1` on first frame, sampled each frame). New condition: `!keyboardActive && pointerInCanvas && (pointer.isDown || pointerMoved)` where `pointerMoved = lastPointerX >= 0 && pointer.x !== lastPointerX`. Keyboard input now always wins when arrow/WASD/numpad keys are held; pointer takes over only when the mouse is actually being used (clicked or moved). Bonus: `pointerInCanvas` guard (0 ≤ pointer.x ≤ WIDTH) prevents an out-of-bounds cursor from dragging the paddle toward the edge on fullscreen / off-canvas hover. Numpad keys were already wired in `setupInput()` (NUMPAD_FOUR, NUMPAD_SIX) — they just couldn't beat the pointer. Added `numpadLeft: { isDown: false }` / `numpadRight: { isDown: false }` to the test mock's `beforeEach` (they were missing; existing coverage never exercised numpad). **+26 regression tests** in a new `R87.K1+K2+K3 — power-up soft-lock + multi-life guard + keyboard controls` describe block: K3 × 10 (arrow/WASD/numpad-4/numpad-6 keys move paddle even when pointer sits elsewhere; idle pointer at arbitrary x doesn't override keyboard; idle pointer with no keyboard leaves paddle still; moving pointer pulls paddle without keyboard; pressed pointer drives paddle even if stationary; out-of-canvas pointer no-ops; first-frame sentinel `-1` treats pointer as idle), K2 × 10 (loseLife fires once per frame for 2-call + 3-call sequences; no-op under isGameOver / isLevelComplete; livesLostThisFrame resets across ticks; 2 lives survive chaotic frame without game-over; activatePowerUp no-ops on isGameOver / isLevelComplete for multiBall / laser / EMP / playSound), K1 × 6 (reconcileBallState no-ops under isGameOver / isLevelComplete / balls-already-present; respawns attached ball when `isBallAttached && balls.length === 0`; calls loseLife when `!isBallAttached && balls.length === 0`; respects livesLostThisFrame guard). Gates: tsc clean, lint 0 err (4 pre-existing warnings), **3141 tests pass + 2 todo** (+26 from R86's 3115), `npm run build` clean 7.59s. Tom-tick awaited on next CodeBreaker hand-playtest — keyboard should now move paddle on every key; green-bomb pickup should never orphan a ball-less scene; lives should only tick down once per death moment.
- [ ] **R87.K4 [P1]** **Ball-speed rebound cap** — Tom: *"Ball speed is very, very quick when it rebounds. Needs to slow it down. Especially if we're going to have a lot of packed grids that we need to destroy."* Audit paddle-bounce (Breakout convention boosts speed on edge-hits), brick-bounce (some games speed-up per-brick), and the level-progression speed ramp. Cap max ball speed or add per-bounce easing on steep angles; preserve per-level speed progression but dampen the instantaneous rebound delta. Regression tests lock max-speed invariant + easing.
- [ ] **R87.K5 [P1]** **L1 difficulty retier (current L1 → L3)** — Tom: *"First level is a bit too difficult, as it's got too many blocks that take too many hits to destroy. Need to make the current level one, level three."* Either insert 2 new warm-up levels before current L1 OR reorder the existing level data so L1/L2 are simpler. Keep the hardest level as the hardest; just shift the curve down. Consider: (a) fewer bricks per row, (b) more standard (1-hit) vs tough (multi-hit) mix, (c) easier power-up drop rate in first 2 levels. Regression tests lock level-count + per-level brick-count.
- [ ] **R87.K6 [P1]** **Manual bullet-time on B** — Tom: *"Bullet time needs to be activated manually, as it comes on automatically and it's a bit pointless because it just makes one ball go really slow. The user should be able to activate this manually when they need it. So it needs to power up over time when you destroy blocks, and then eventually you get a power that you can use in the bullet time mode, and press B to activate it."* Mirror the Metris R85.M3 pattern: charge meter fills on brick-destroy (1 brick = N charge, cap at 100); HUD meter flips YELLOW when full-but-idle; B key activates → global time dilation for X seconds or until ball lost. Delete the auto-trigger in whatever path currently fires it. Regression tests lock charge accumulation + B-key gate + HUD colour transitions.
- [ ] **R87.K7 [P1]** **Power-up legend** — Tom: *"We need to know what the power-ups are, so we need some sort of info about this before we start playing the game, because it's a bit of guessing what power up is what."* Adopt the Pong R84.P5 / Invaders R85.I6 / Frogger R86.F5 pattern: MenuScene legend panel (icons + labels for all 6 power-ups: laser, wide paddle, multiball, slow, strong, extra life — plus the new bullet-time-charge from K6 if applicable) + on-pickup HUD overlay (4s display, 200/400ms fade, cancellation-token guard, prefers-reduced-motion branch). Regression tests: MenuScene layout invariants + pickup-overlay render+dismiss.
- [ ] **R87.K8 [P1]** **Brick-SFX dedup / throttle** — Tom: *"Need to reduce the amount of times that we have the brick breaking sound effect."* Similar pattern to Snake R84.S-series. Throttle repeat plays (e.g. ≥50ms between triggers) OR only every Nth rapid hit OR merge into a short burst. Pick whichever feels right. Regression tests lock throttle invariant.
- [ ] **R87.K9 [P1]** **CodeBreaker unit-test coverage refresh** — audit + tripwire single-line invariants surfaced during K1-K8. Follow F7/N4/A3/R4 playbook: update() early-return guards, game-over path contract (exactly-one-call per death route, highScore-promotion-before-report ordering), static regex tripwires on pre-fix bug strings. Closes Stream K.

**Stream AC — Agent Chase level-advance (lifted 2026-04-23, ~1 iteration):**

- [ ] **R87.AC1 [P1]** **Level-advance / level-clear flow missing** — Tom 2026-04-23 screenshot (SCORE 2570, LIVES 2, LEVEL 1, empty maze, all 4 agents visible post-R86.A2 release): *"on agent chase there is no way to play the next level, I won and it just continued but nothing happened"*. Audit `AgentChase/scenes/GameScene.ts` `update()` for a `dotsRemaining === 0` trigger; if missing, wire `triggerLevelClear()` that (a) pauses input, (b) shows "LEVEL CLEAR" overlay (mirror Frogger F1's level-up flow), (c) increments `this.level`, (d) respawns dots + power-pellets, (e) resets player + agent positions, (f) resets `dotsCollected` for the `RELEASE_DOT_THRESHOLDS` curve (important — A2's staggered release must re-arm from 0 each level), (g) bumps difficulty dials (agent speed, chase-AI weight, or spawn-count of power-pellets). State machine: add `isLevelingUp` flag gating collisions + input (same pattern as Frogger F1). Regression tests: dot-clear detection (`dotsRemaining === 0`), respawn-reset invariants (dots counted, power-pellets counted, agents at spawn positions, `agentReleaseIndex === 1` so smith stays out + brown/jones/johnson re-enter house for re-release), level increment, difficulty monotonicity.

**Stream C — CloudJumper polish (ship after K+AC, ~6-7 iterations):**

- [ ] **R87.C1 [P1]** **Single-jump gate — only jump when on cloud** — Tom: *"The player should not be able to jump unless they jump on a cloud. They can't jump again in mid-air."* Audit `CloudJumper/scenes/GameScene.ts` `handleJump()` — currently fires on any key-press. Canonical Phaser 3 gate: add `canJump: boolean` field, set to `true` in `handleCloudLanding()`, consume on successful jump (`canJump = false` + apply jump velocity), reset only on next cloud contact. Avoid `body.touching.down` alone — Cloud Jumper's "step through" cloud physics may have false-positive touching frames. Regression tests: `handleJump()` with `canJump=false` no-ops (velocity unchanged); with `canJump=true` fires once then no-ops on next call; `handleCloudLanding()` re-arms.
- [ ] **R87.C2 [P1]** **Jump-height cap + off-screen prevention** — Tom: *"Sometimes the player jumps too hard and he goes off screen. Need to make the platforms lower to account for this or make jumping less high."* Two candidate fixes (pick one after quick audit): (a) cap `JUMP_VELOCITY` absolute magnitude, (b) detect `player.y < -MARGIN` in `update()` and clamp / pull-back, (c) reduce vertical cloud spacing so a capped jump still reaches the next cloud. (a) is simplest and least likely to regress feel. Regression tests lock max jump height + no off-screen-above excursion over a realistic play trace.
- [ ] **R87.C3 [P1]** **Braking / stop mechanic** — Tom: *"The player should be able to stop. This is to avoid hitting things by accident and provide more control."* Audit horizontal movement: likely pure velocity-set on key-held with no damping. Add friction coefficient applied when no left/right key held (`velocity.x *= 0.85` per frame or similar) so release-to-stop feels controllable. Alternative: explicit brake on down-arrow / S. Pick the one that composes with C1's single-jump (pressing DOWN mid-air shouldn't do anything weird). Regression tests: key-hold maintains velocity, key-release decelerates, stop reached within N frames.
- [ ] **R87.C4 [P1]** **Death SFX swap** — Tom: *"need to change the deaf [death] sound effect as it's horrible"*. Procedural Web Audio replacement — softer descending arpeggio or a single soft thud (not the current harsh tone). Keep procedural / chip-tune; no asset files. Regression test: `SOUND_KEYS.DEATH` exists in `useSoundSystem` + fires exactly once from `playerDeath` path.
- [ ] **R87.C5 [P1]** **Remove brick-break SFX from movement** — Tom: *"Remove the brick breaking sound effects when moving along, please."* Audit movement handler — wrong SFX hooked to lateral movement. Delete the hook entirely. If a movement SFX is desired, replace with a quieter wind-whoosh tied to a velocity threshold (only plays above X px/s). Regression test: lateral-input does NOT call `playSound('brickBreak')` or equivalent.
- [ ] **R87.C6 [P2]** **Freeze repro + fix** — Tom: *"Sometimes the game freezes."* Low-signal, no known repro. Audit `update()` for: unbounded loops (while-with-no-increment-guard), re-entrancy on tween onComplete, infinite-tween loops without `repeat: N` cap, missed `shutdown()` cleanup. If nothing smoking-gun, add `exposeTestState` hooks for future debugging and log freeze-hunt as R88+ perf-work.
- [ ] **R87.C7 [P1]** **CloudJumper unit-test coverage refresh** — audit + tripwire single-line invariants surfaced during C1-C6. Follow F7/N4/A3/R4/K9 playbook. Closes Stream C.

**Stream RH — Rhythm Hacker track-complete + 120s cap (lifted 2026-04-23 late, ~2 iterations):**

- [ ] **R87.RH1 [P1]** **Track-complete / level-complete flow missing** — Tom 2026-04-23 post-R86: *"I have just completed a level and no high score came up or level completed"*. R86.R4 shipped a `processHit→miss→health-depleted` highScore-promotion fix but left the `trackComplete()` win-path UX hand-off unaudited. Audit `trackComplete()` (GameScene.ts:~1147 — route 3 of the game-over paths): after `reportScore` + `saveSystem.updateGameSave`, does it push a `'GameOverScene'` start with `reason='TRACK COMPLETE'` or equivalent? If the `gameOver()` call is there but the GameOverScene doesn't show on the Rhythm Hacker variant, audit `RhythmHacker/scenes/GameOverScene.ts` for a win-branch; if absent, add a `"LEVEL COMPLETE"` banner + initials-entry prompt on new-high-score (mirrors Metris / Frogger patterns). Regression tests: `trackComplete()` fires `gameOver(score, 'TRACK COMPLETE', highScore, stats, levelOrTrackNumber, durationMs)` once at natural track end, GameOverScene branches on `reason === 'TRACK COMPLETE'` for win-flavoured copy, initials-entry shows when score > prior highScore.
- [ ] **R87.RH2 [P1]** **Song cap at 120s (2 minutes max)** — Tom: *"we need to make the songs 2 minutes at max, they are too long"*. Tracks currently overrun 2 minutes and sap engagement. Two candidate fixes: (a) audio-side — shorten BGM asset files (cleanest UX but touches asset pipeline), (b) scene-side — early-end timer: when `audioStartTimestamp + 120000ms ≤ Date.now()` (or Phaser's `scene.time.now` equivalent), fire `trackComplete()` early via the post-RH1 win-flow. **Pick (b)** — keeps the existing asset pipeline untouched, composes cleanly with RH1's win-flow (the same UX path fires whether track ends naturally at a chart end OR at the 120s guillotine), and is trivially testable. Config: new `TRACK.MAX_DURATION_MS = 120000` in Rhythm Hacker's `config.ts` with a full WHY block explaining the motivation. Regression tests: guard fires at exactly 120s (strict-boundary lock — `>=` vs `>` regression guard), fires only once (re-entry guard identical to RH1), does NOT fire before 120s, HUD shows clean track-progress bar scaled to 120s max (not the underlying track length).

**Stream V — Verification + Baselines (ship last, 1 iteration):**

- [ ] **R87.V1 [P1]** **Visual baseline regen + full gate battery** — same playbook as R86.V1: tsc + lint + build + unit + chromium E2E + darwin baseline regen with explicit `--update-snapshots=all` (plain `--update-snapshots` no-ops in Playwright 1.58+). CodeBreaker + CloudJumper baselines will have visible diffs (menu legend panels, HUD meter, difficulty re-tier); Agent Chase gains a LEVEL CLEAR overlay; Rhythm Hacker gains a LEVEL COMPLETE / track-end UX frame.

### R87 Verification Plan

1. **Stream K P0s complete** → Tom plays CodeBreaker, confirms (a) green bomb grab with last ball missed does NOT soft-lock (respawns ball OR triggers game-over correctly), (b) green bomb mid-level does NOT spontaneously end the game, (c) keyboard + numpad move paddle.
2. **Stream K P1s complete** → Tom plays CodeBreaker L1, confirms difficulty feels warm-up (not overwhelming), ball speed controllable, manual B activates bullet-time on demand, power-up legend visible in menu + HUD-flash on pickup, brick-SFX not grating.
3. **AC1 complete** → Tom plays Agent Chase, eats all dots on L1, confirms LEVEL CLEAR overlay fires + L2 starts cleanly with dots respawned + agents re-housed for staggered release.
4. **Stream C complete** → Tom plays CloudJumper, confirms single-jump gate (no mid-air double-jump), capped jump never goes off-screen, braking feels responsive, death SFX acceptable, movement silent.
5. **Stream RH complete** → Tom plays Rhythm Hacker, confirms a track completion fires the LEVEL COMPLETE / initials-entry UX (not silent), AND that any track caps at ~2 minutes (guillotine fires the same UX if the chart would otherwise overrun).
6. **Stream V complete** → visual baselines reviewed + committed, full gate battery green.
7. **Automated gates per iteration**: `npx tsc --noEmit` + `npm run lint` + `npm run build` + `npm test --run`. Red blocks commit.
8. **Post-phase playtest**: Tom hand-plays CloudJumper + CodeBreaker + Agent Chase + Rhythm Hacker end-to-end, ticks Known Issues, writes R87 terminator phrase to Status.

### R87 Terminator

All of:
- R87.K1 – R87.K9 `[x]`
- R87.AC1 `[x]`
- R87.C1 – R87.C7 `[x]`
- R87.RH1, RH2 `[x]`
- R87.V1 `[x]`
- Gates green: lint + build + unit + E2E + visual
- Tom manually writes **"R87 COMPLETE — CloudJumper + CodeBreaker polish + Agent Chase level-advance + Rhythm Hacker track-complete shipped"** to Status

`loop.sh` hard cap: **24 iterations**. Ralph **never auto-writes** the terminator phrase — Tom's sign-off only.

### R87 Discovered Work

_(Ralph logs unexpected findings here during execution — do NOT create new R87.x tasks mid-iteration; log here for Tom's triage.)_

---

## R86 — Frogger + Neo Jump + Agent Chase + Rhythm Hacker + 3 Globals — **AWAITING TOM'S SIGN-OFF**

All 17 core sub-bullets + 14 safety-net commits shipped across 5 streams (G globals, F Frogger, N Neo Jump, A Agent Chase, R Rhythm Hacker, V verification). Full detail archived at [`COMPLETED_WORK.md § R86`](COMPLETED_WORK.md#r86--frogger--neo-jump--agent-chase--rhythm-hacker--3-globals-2026-04-21--2026-04-22).

- **Terminator phrase**: Tom manually writes `R86 COMPLETE — Frogger + Neo Jump polish + globals shipped` into the Status line at top. Ralph cannot self-write this.
- **If Tom's playthrough surfaces blocking bugs**: log under `### R87 Discovered Work` or add R86 `.*+` safety-net sub-bullets (scope-permitting). **Agent Chase level-advance bug surfaced 2026-04-23 → promoted to R87.AC1 Stream AC** (not lifted back into R86 since Ralph's already shipped Stream V).
- **Test count**: 3,115+ unit tests / 60 files.

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


## Deferred / Future Phases (post-R87)

These phases are scoped but NOT scheduled. Ralph does NOT touch them during R87.

### R88+ — Performance + ship-readiness

Tom's note: *"the rest of the work will be performance and getting the games perfect"* — post all per-game polish batches, focus shifts to performance profiling, final polish sweeps, and ship-readiness (Lighthouse audits, Web Vitals tuning, licensed asset-pack swap per Future Asset Strategy, PWA audits).

R87 closes out the 4-batch per-game polish cadence (R84 Pong/Snake/Bird → R85 Invaders/Metris → R86 Frogger/NeoJump/AgentChase/RhythmHacker → R87 CloudJumper/CodeBreaker + AgentChase AC1 level-advance). Post-R87 the 11-game arcade is fully polish-passed and R88+ is open for the performance + ship-readiness phase.

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
