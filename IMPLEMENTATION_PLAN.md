# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: **R85 open** (2026-04-20 — Tom's playtest notes on Matrix Invaders + Metris filed). R85 = **Invaders + Metris polish + 2 NEW globals** carved out of the originally-planned 8-game polish phase because Tom wants to test the remaining 6 games first before committing to their scope. Loop cap: **20 iterations**. **Stream G globals — both shipped 2026-04-21** (G1 high-score persistence + G2 dashbar trophy). **R85.I1 (enemy sprite redesign) shipped 2026-04-21**. **R85.I2 bullet-time HUD shipped 2026-04-21**. **R85.I3 bigger enemy bullets shipped 2026-04-21**. **R85.I4 power-up shooter visibility invariant shipped 2026-04-21** — three contributing patterns identified and fixed: (a) `activatePowerUp('shield')` mutated `player.setTexture('player_shield')`/`setTint(MAGENTA)`, (b) `updateHUD()` re-asserted that mutation every frame (fighting with the damage-blink tween), (c) `spawnPowerUp()` created `repeat:-1` yoyo tweens with no cleanup on pickup — dangling tween targeting a destroyed sprite silently corrupted the shared tween manager, which over minutes of gameplay could leave the player sprite stuck invisible/tinted. Fix architecture: separation of concerns — player sprite is canonical and **never mutated** by power-ups; shield visual is its own `shieldAura` Graphics layer (depth 2, below player at depth 3, magenta fill α=0.12 + stroked ring α=0.9, pulsing 0.75→1.0 α over time) rendered as a halo around the ship. New `restorePlayerVisuals()` invariant centralises `setVisible(true) + setAlpha(1) + clearTint()` and is called at every state-window boundary (post-shield-break, post-blink-cleanup, end of every `activatePowerUp()` switch). Tween cleanup added at all three power-up destroy sites (`checkPowerUpCollisions`, `updateFieldPowerUps`, `shutdown`) via `this.tweens.killTweensOf(pu.sprite)` before destroy — kills the dangling `repeat:-1` yoyo before the sprite is gone. Removed the entire `spriteMode` tint / non-spriteMode setTexture block from `updateHUD` — that whole branch was re-writing player visuals every frame on the hope that the shield effect persisted correctly. Regression tripwire: 14 new tests in `GameScene.test.ts § R85.I4 Power-up Shooter Visibility Invariant` — outcome-based `assertPlayerVisibleAndOpaque()` helper checks visible=true + all setAlpha args=1 + all setVisible args=true + no setTexture call + no setTint call; tests for each power-up type (shield/rapidFire/scoreMultiplier/bomb) individually + the canonical Tom-repro "stacking every power-up type leaves the player visible and opaque" + 10-consecutive-shields stress test + shield aura show/hide/pin-to-player + shield-break + updateHUD non-mutation + pickup/offscreen tween-kill tripwires. All 2585 unit tests green (2 pre-existing todo — now 12 new net I4 tests on top of the base), tsc clean, lint clean (0 err, 4 pre-existing warnings unchanged), build green in 7.57s. **R85.I5 menu start-button / control-hint overlap shipped 2026-04-21** — subclass had stacked three hint lines at `height * 0.72 + i*22` (y = 324/346/368 on the 450-px canvas) which painted squarely on top of the shared START button centred at `BaseScene.MENU_START_BUTTON_Y_RATIO = 0.75` (~50 px tall → y band 312-362). Root-cause pattern: Invaders was the lone outlier; every other subclass (Snake, MatrixCloud, NeoJump, AgentChase, Frogger, CloudJumper, Pong) places hint lines in the conventional 0.52-0.64 instruction band that BaseScene's comment explicitly documents as the button's clear-air zone. Fix matches that convention — new exported `CONTROL_HINT_Y_RATIOS = [0.52, 0.58, 0.64]` tuple on the subclass, hints painted at those ratios, MATRIX green hex colour arg made explicit to match Snake/NeoJump signature. Regression tripwire: new `src/components/games/phaser/MatrixInvaders/scenes/MenuScene.test.ts` — 11 tests covering (a) static tuple invariants (length, in-band 0.52-0.64, strictly increasing, does-not-regress-to-0.72 tripwire), (b) button-clearance maths on both 450-px and 400-px canvases, (c) `create()` wiring — createMatrixText called 3× with correct y per ratio, correct hint strings in order, no hint y lands inside button band, ratios scale with canvas height rather than hard-coded pixels. Phaser prototype chain is broken by the mock Scene factory so tests use the `collectPrototypeMethods` rebind trick (same as VortexPongMenuScene.test.ts) plus a temporary `BaseMenuScene.prototype.create = vi.fn()` stub so only the subclass body runs. All 2596/2598 unit tests green (2 pre-existing todo — +11 net I5 tests), 54 test files, tsc clean, lint clean (0 err, 4 pre-existing warnings unchanged), build green in 13.16s. **R85.I6 power-up legend shipped 2026-04-21** — root cause was teaching-surface absence, not visual bug; players pick up a coloured orb, ACTIVE banner names the verb but does not explain effect or duration. Fix adopts Pong R84.P5's 3-method stack (show/hide/clear + `prefersReducedMotion`) because its "on every pickup" trigger matches Tom's *"each collect + activate"* phrasing better than Snake R83.S1's "once at startup" model. New `POWERUP_LEGEND` config in `MatrixInvaders/config.ts` — `ENTRIES` tuple with 4 rows (name · effect · duration), 4s display, 200/400ms fade, `BASE_Y_RATIO=0.70` (y=315-363, clear air between central banners at 0.30/0.40/0.45 and player at y=410). Active row paints at α=1 in `POWERUP_DEFS[type].color`, other 3 dim to α=0.55. Cancellation-token guard on fade-out onComplete (`if (this.powerUpLegend === targets)`) stops stale fades from wiping fresh legends when pickups queue within FADE_OUT_MS. `prefers-reduced-motion` skips fade tweens (alpha set directly). Wired into `checkPowerUpCollisions` after `activatePowerUp` plus `clearPowerUpLegend` into shutdown + resetState. Regression tripwire: 24 new tests in `GameScene.test.ts § R85.I6 Power-up Legend HUD` covering rendering contract (4 Text objects, correct depth/font/y-spacing), active-row highlighting, back-to-back refresh + cancellation-token guard, cleanup paths (shutdown/resetState/delayedCall auto-hide), reduced-motion (alpha set directly), pickup wiring. Bug found during test shakedown: `prefersReducedMotion` needed a second `?.` after the matchMedia call — `window.matchMedia?.('(reduce)')?.matches` — first `?.` protects the call site, second `?.` protects the dereference when matchMedia returns undefined. Discovered-work note logged: Tom mentioned *"6 power-ups"* but Invaders ships only 4 — legend covers all 4, scope extension requires lockstep `POWERUP_LEGEND.ENTRIES` + `POWERUP_DEFS` updates. All 2620/2622 unit tests green, tsc clean, lint clean (0 err, 4 pre-existing warnings unchanged), build green in 7.56s. Next: R85.I7 Matrix-style atmosphere amp-up. **R84 still awaiting sign-off** (R84.S7 `[DEFER]`, R84.CI bucket Tom-tick-only). R83.CTRLS umbrella also still pending Tom's CTRL-S end-to-end tick.

### Previous R84 Status (archived — superseded by R85)

R84 shipped 54 commits across 5 streams. R84 shipped 54 commits across 5 streams — full detail archived to [`COMPLETED_WORK.md § R84`](COMPLETED_WORK.md#r84--3-game-polish--verification-2026-04-19--2026-04-20). All task checkboxes `[x]` except (a) `R84.S7` boss-snake prototype which was explicitly `[DEFER]`-to-R85 in the original brief, and (b) `R84.CI` continuous-improvement bucket which stays `[ ]` by design (R82.13 pattern — Tom ticks post-playtest). 15 CI iterations were shipped under it (9 a11y, 3 perf object pools, 2 attract, 1 visual). Test count: ~1,927 → 2,459 (+532 regression tripwires). **Awaiting Tom**: (i) hand-play Pong/Snake/Bird with new polish, (ii) tick CI bucket if happy, (iii) write terminator `R84 COMPLETE — 3-game polish + verification shipped`. Also still pending: `R83.CTRLS [ ]` umbrella awaiting Tom's CTRL-S end-to-end playthrough sign-off. Next active phase after Tom ticks both: **R85 — 8-game polish** (Invaders, Metris, Frogger, NeoJump, AgentChase, Rhythm, CloudJumper, CodeBreaker), pending per-game testing docs getting filled in.

> **Archived phases** (full detail in [`COMPLETED_WORK.md`](COMPLETED_WORK.md)): R1–R75 (various), R76 final polish, R77 retro scoreboard, R78 assets + infrastructure, R79 residue closeout, R80 CTRL-S Phaser rewrite, R81 juice polish + repo trim, R82 iPod Classic portal redesign, R83 global polish + CTRL-S atmospheric rewrite, R84 3-game polish + verification.

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

## R85 — Invaders + Metris Polish + 2 Globals — **CURRENT ACTIVE PHASE** (MEDIUM — ~16 tasks, 20-loop cap)

> **Scope source**: `manual-testing-sessions/MANUAL_TESTING_CHECKLIST_{Matrix_Invaders,Metris}.md`. Every task below traces back to a specific line in those 2 docs. When Ralph picks a task, re-read the corresponding doc first — Tom's colloquial notes have reproduction detail the terse task summary here omits.
>
> **Why this phase exists**: After R84 shipped, Tom played Invaders + Metris (2 of the 8 still-untested games) and surfaced 2 new critical globals PLUS specific per-game polish. Tom wants these 2 games fixed BEFORE playing the remaining 6, so the 6-game follow-up (now R86) starts from a fully-polished-and-save-working baseline. R84.S7 and R84.CI stay untouched by design — those are Tom-tick bucket items, not R85 work.

### R85 Ordering Rule (strict — do NOT jump ahead)

1. **Stream G — NEW Globals (R85.G1 → G2)**: blockers for EVERY game, ship FIRST. G1 is the high-score-persistence regression (blocks scoreboard value across the entire arcade); G2 is the iPod dashbar trophy still-wrong bug. G1 before G2.
2. **Stream I — Matrix Invaders polish (R85.I1 → I9)**: ONLY after Stream G is `[x]` — fixing save-system first means any I-stream testing of high-score flows actually works. I-stream's biggest lift is the **enemy sprite redesign** (Tom: *"look like pigs... make them look like UFOs / battleships"*) + bullet-time HUD visibility.
3. **Stream M — Metris polish (R85.M1 → M5)**: ONLY after Stream G is `[x]` (I-stream and M-stream are parallel-safe after G). Smaller scope since Metris is "nicely polished" per Tom; first-block spawn fix is the key UX bug.
4. **Stream V — Verification + baselines (R85.V1)**: ship LAST, regen visual baselines for both games + run full gate battery.

**Guardrails**:
- **R84 items OFF-LIMITS**: R84.S7 boss-snake prototype and R84.CI continuous-improvement bucket stay `[ ]` — these are Tom-tick bucket items, not Ralph work during R85. If Ralph is tempted to pick these, STOP.
- **6 untested games OFF-LIMITS for per-game polish**: Matrix Frogger, NeoJump, AgentChase, Rhythm Hacker, CloudJumper, CodeBreaker. Shared-infrastructure changes (BaseScene, useSoundSystem, useSaveSystem, GamePortal) that inherit through are fine — that IS the point of Stream G. What Ralph MUST NOT do is open any of those 6 game folders for per-game logic edits; wait for R86.
- **CTRL-S OFF-LIMITS** — R83.CTRLS umbrella still Tom-tick only.
- **iPod portal (R82) locked** — no restructuring.
- **Existing tests must stay green** (2,459+ unit tests / 49 files). Any red gate blocks commit.

### R85 Task List

**Stream G — NEW Globals (ship first, 2 iterations):**

- [x] **R85.G1 [P0]** **High-score persistence broken** — **SHIPPED 2026-04-21**. Root cause: R77 layered a new `scoreboards[id]` top-25 slice on top of the legacy `games[id].highScore` field, but `useSaveSystem.addScore` only wrote to the new slice. `GameHighScores` modal, per-game iPod card readouts and the App.tsx totalScore aggregate still read the legacy field, so they showed 0 after refresh even though the scoreboards slice had the data. Tom's *"high scores are not saving any more"* was accurate from the surfaces he checked. Fix: `addScore` now mirrors the qualifying entry into `games[gameId].highScore` with a `Math.max(existing, entry.score)` guard so a top-25 entry that isn't a personal best can never lower the watermark. `lastPlayed` also gets stamped. Regression tripwire: `src/hooks/useSaveSystem.persistence-roundtrip.test.ts` — 7 cases covering mount/unmount refresh simulation, multi-score top tracking, downgrade guard, localStorage snapshot shape, and a parameterised sweep across all 11 scoreboard game IDs. All 2545 unit tests green, build green.
- [x] **R85.G2 [P1]** **iPod dashbar trophy still shows wrong/stale high score** — **SHIPPED 2026-04-21**. Audit across all 12 registry IDs (`src/data/gameRegistry.ts`) vs save keys (`GlobalSaveData['games']`) vs wrapper `gameId=` props in `src/components/games/phaser/*/index.tsx`: all three surfaces consistent, no ID drift. Tom's *"still error"* was a cascade symptom of G1 — `addScore` wasn't mirroring qualifying entries into `games[id].highScore`, so every surface that read the legacy slice (including the dashbar trophy via `GameHighScores.tsx`) showed 0. G1's write-path fix removed the root cause. Defensive hardening for G2: extracted the private `REGISTRY_TO_SAVE_KEY` map out of `GameHighScores.tsx` into a shared `src/lib/saveKeys.ts` module with a bijective inverse `SAVE_KEY_TO_REGISTRY`, a typed `getSaveKey()` helper, and an `as const satisfies Record<string, SaveKey>` compile-time guard — future rename of any registry ID or save key will fail tsc rather than silently route the modal to `undefined.highScore ?? 0`. Regression tripwire: `src/lib/saveKeys.test.ts` — 4 cases covering (a) every `GAME_REGISTRY` entry resolves to a save key, (b) registry/map bijection, (c) unknown-ID handling, (d) every Phaser wrapper's `gameId=` prop string-matches the mapped save key (fs-level tripwire across all 12 wrapper index.tsx files). All 2549 unit tests green, tsc clean, build green.

**Stream I — Matrix Invaders polish (ship after Stream G, ~9 iterations):**

- [x] **R85.I1 [P0]** **Enemy sprite redesign — pigs → UFOs/battleships** — **SHIPPED 2026-04-21**. Root cause was twofold: (a) the PNG fallbacks at `public/assets/matrix-invaders/enemy_*.png` are tiny sub-16px blobs that read as coloured smudges once `setDisplaySize(32, 24)` scaled them up, and (b) the procedural `BootScene.createEnemyTextures()` drew a rounded rectangle with two white eye-circles at `W*0.35`/`W*0.65` plus mouth details — unmistakable face geometry. Compounding factor: the old procedural path filled shapes in `def.color` (pure green), which meant R83's `ROW_TINTS` multiplication zeroed the non-green channels and left the tinted rows looking identical. Fix: `BootScene` now paints four distinct UFO/battleship silhouettes entirely in white (MATRIX_COLORS.WHITE) so `setTint(ROW_TINTS[row])` comes through as its pure hue — `code` flying saucer (dome + disc + 3 portholes), `agent` twin-pod battleship (V-fuselage + side gun pods + prow spike), `sentinel` armoured hex cruiser (spikes + central turret), `virus` crystalline diamond with 4 angular spike protrusions. `spriteMode` check dropped for enemies in `GameScene.spawnWave` + `spawnVirusChildren` — the PNG fallback route is dead code for enemies now (player/bullets still use it). `setScale(0.8)` applied at both enemy spawn sites closes the long-pending PG6 "visible 20% shrink" without touching grid spacing or the 32×24 collision bounds. Regression tripwire: 4 new tests in `src/components/games/phaser/MatrixInvaders/scenes/GameScene.test.ts` — texture-key contract (`enemy_<type>`, not `sprite_enemy_*`), per-row `ROW_TINTS[row]` bijection across all 40 wave-1 spawns, 0.8-scale invariant for every spawned enemy, and virus-child inheritance of both texture + shrink. Visual baseline regen deferred to R85.V1. All 2553/2555 unit tests green (2 pre-existing todo), tsc clean, lint clean, build green in 7.37s.
- [x] **R85.I2 [P1]** **Bullet-time visibility — HUD indicator + key reminder** — **SHIPPED 2026-04-21**. Root cause was twofold: (a) the only bullet-time HUD was the `BULLET TIME ACTIVE` mid-screen banner that appears *after* activation — players never learned the B-key verb existed because there was no persistent surface advertising it; (b) the ability was on an unlimited-free-cast timer (press B = 5s slow-mo, no cooldown, no charge concept), so Tom's *"drains visibly, refills correctly — nope"* was correct because there was nothing to drain or refill. Fix introduces a proper charge/cooldown loop: `bulletTimeCharge ∈ [0,1]` drains from 1→0 over `BULLET_TIME_DURATION` (5s) during active, then refills 0→1 over new `BULLET_TIME_COOLDOWN` (10s) while inactive. `handleBulletTime` now gates activation on `charge >= 1` — pressing B on a partial meter silently no-ops, so the meter becomes the source of truth. Persistent HUD in the left column below the combo readout: `[B] BULLET TIME` label in magenta + 140×6 meter bar (DARK_GREY bg, MAGENTA fill, 0.6α stroke). When the fill is ready-and-idle the fill alpha gently oscillates `0.75 + 0.25*sin(time*0.008)` so the eye catches it; during active/refill it's solid α=1 so the drain/refill motion is legible. `BULLET TIME READY` centre-screen pulse (0→1 alpha via 900ms Sine.easeOut tween) fires on the rising-edge of `charge < 1 → charge = 1`, guarded by an edge-latch `bulletTimeWasReady` so it only emits once per cooldown and never re-triggers while held at full. Regression tripwire: 9 new tests in `GameScene.test.ts` — initial-state latch armed, gate-below-full refuses activation + no use-counter increment, latch-disarmed on activation, drain rate matches 1/DURATION per ms, drain floor-clamps at 0, refill rate matches 1/COOLDOWN per ms, refill ceiling-clamps at 1 + pulse exactly once on edge, pulse suppressed on subsequent ticks at full, no-pulse-when-already-ready (no edge to trigger on). `bulletTimeCharge` added to the `getTestState` contract so E2E/visual harnesses can assert meter state deterministically. All 2562 unit tests green (2 pre-existing todo), tsc clean, lint clean, build green in 7.17s.
- [x] **R85.I3 [P1]** **Enemy bullets too small** — **SHIPPED 2026-04-21**. Root cause was twofold: (a) procedural `bullet_enemy` texture rendered at `ENEMY_BULLET_WIDTH=3, ENEMY_BULLET_HEIGHT=6` — 18px² of flat red, invisible against the scanline + matrix-rain backdrop; (b) a dual-path ternary in `handleEnemyShooting` + `updateBoss` sized bullets differently based on whether `laser_red.png` loaded vs `sprite_bullet_enemy.png` vs procedural fallback (three runtime sizes from one config), so the "bump the number" fix would only land on whichever path the deployed build happened to take. Fix: config bumped to `ENEMY_BULLET_WIDTH=8, ENEMY_BULLET_HEIGHT=18` (taller than `PLAYER_BULLET_HEIGHT=10` so threats visually dominate player fire), all three render paths collapsed to `setDisplaySize(ENEMY_BULLET_WIDTH, ENEMY_BULLET_HEIGHT)` with no ternary, boss bullets scale to `+2 × +4` preserving threat hierarchy. Procedural texture rewritten as three layers: outer red halo (rounded-rect, α=0.35) + solid red body (centre 60% width) + 2px bright white hot-core column — reads as anti-aliased threat against the busy backdrop instead of a flat blob. Added motion trail: `enemyBulletTrailAccum` scene field throttles spawns to once per `ENEMY_BULLET_TRAIL_INTERVAL=0.04s` (25Hz) per active bullet, trails push into the existing `particles` pool with `life=0.5, vy=0` so the existing `updateParticles` decay loop fades them out (zero new lifecycle machinery), spawn gated on `enemyBullets.length > 0` so idle scenes don't allocate. Collision hitbox kept at `ENEMY_BULLET_WIDTH+2 × ENEMY_BULLET_HEIGHT+2` (was absurdly generous at 5×8 for 3×6 bullets, now fair 10×20 for 8×18). Regression tripwire: 9 new tests in `GameScene.test.ts § R85.I3 Enemy Bullet Size + Trail` — (a) `ENEMY_BULLET_WIDTH >= 8` and `HEIGHT >= 16` floors lock minimum visibility, (b) `ENEMY_BULLET_HEIGHT > PLAYER_BULLET_HEIGHT` threat-hierarchy invariant, (c) spawned-bullet `displayWidth/displayHeight === config` parity (catches any future regression of the dual-path ternary), (d) trail spawn after single cross-interval tick, (e) sub-interval double-tick gates to ≤1 trail (catches accidental per-frame spawn), (f) idle scene with empty bullets spawns 0 trails even at huge dt, (g) trail x matches bullet x + y sits behind (smaller Y) bullet y, (h) trail uses particles pool lifetime contract (decays cleanly via `updateParticles`). All 2571/2573 unit tests green (2 pre-existing todo), tsc clean, lint clean, build green in 7.66s.
- [x] **R85.I4 [P1]** **Power-up makes shooter invisible** — **SHIPPED 2026-04-21**. Root cause triple: (a) `activatePowerUp('shield')` was mutating `player.setTexture('player_shield')` + `setTint(MATRIX_COLORS.MAGENTA)`; (b) `updateHUD()` re-asserted that same texture/tint every frame, fighting with the damage-blink tween for control of the player's visual state; (c) `spawnPowerUp()` created `repeat:-1` yoyo tweens that were never killed on pickup/offscreen/shutdown — the dangling tween targeted a destroyed sprite, silently corrupting the shared tween manager, which over multi-minute runs left the player sprite stuck invisible or tinted. Fix architecture: **separation of concerns** — player sprite is canonical, never touched by power-ups; shield visual is its own dedicated `shieldAura` Graphics layer (magenta fill α=0.12 + stroked ring α=0.9, pulsing 0.75→1.0 α over time, depth 2 under player depth 3 so the ring pokes out as a halo while the fill sits behind the ship). New `restorePlayerVisuals()` invariant (`setVisible(true) + setAlpha(1) + clearTint()`) called at every state-window boundary — end of each `activatePowerUp` switch, post-shield-break, post-blink-cleanup. Tween cleanup (`this.tweens.killTweensOf(pu.sprite)`) added to all three power-up destroy sites (pickup collision, offscreen fall-through, scene shutdown). Removed the entire `spriteMode` tint / non-spriteMode setTexture block from `updateHUD` — it was re-writing player visuals every frame hoping the shield effect would persist, and was the tightest coupling between shield state and player sprite. Regression tripwire: 14 new tests in `GameScene.test.ts § R85.I4 Power-up Shooter Visibility Invariant` — outcome-based `assertPlayerVisibleAndOpaque()` helper checks `visible=true`, all `setAlpha` args =1, all `setVisible` args =true, `setTexture` never called, `setTint` never called. Covers: each power-up type individually (shield/rapidFire/scoreMultiplier/bomb), the canonical Tom-repro "stacking every power-up type leaves the player visible and opaque", 10-consecutive-shields stress, shield aura show/hide/pin-to-player, shield-break non-mutation, `updateHUD` non-mutation, pickup/offscreen tween-kill. All 2585/2587 unit tests green (2 pre-existing todo), tsc clean, lint clean, build green in 7.57s.
- [x] **R85.I5 [P1]** **Menu start button overlaps control hints** — **SHIPPED 2026-04-21**. Root cause: Invaders alone among all 12 Phaser MenuScene subclasses stacked its three hint lines at `height * 0.72 + i*22` (y = 324/346/368 on the 450-px canvas), painting directly on top of the shared START button centred at `BaseScene.MENU_START_BUTTON_Y_RATIO = 0.75` (~50 px tall → y band 312-362). Every other game (Snake, MatrixCloud, NeoJump, AgentChase, Frogger, CloudJumper, Pong) places hints in the conventional 0.52-0.64 instruction band that BaseScene's own comment (lines 28-34) explicitly documents as the button's clear-air zone. Fix: subclass now exports a `CONTROL_HINT_Y_RATIOS = [0.52, 0.58, 0.64] as const` tuple and iterates it, matching the arcade-wide convention — same approach used by R83.G4 (originally promoting 0.75 as the shared START ratio) and R84.B1 menu fixes. Explicit MATRIX `PRIMARY_HEX` colour arg added to match the rest of the fleet's createMatrixText call signature. Regression tripwire: 11 new tests in `MatrixInvaders/scenes/MenuScene.test.ts` — static tuple invariants (length, in-band 0.52-0.64, strictly increasing, `r < 0.70` does-not-regress-to-0.72 tripwire naming the historic bug), button-clearance maths on 450-px and 400-px canvases (belt-and-braces — lowest hint y + 8 px must be < button top), create-wiring (createMatrixText called 3× with correct y per ratio, correct strings in order, no hint y inside button band, ratios scale with canvas height). Phaser prototype chain is broken under the global Scene mock so tests use the `collectPrototypeMethods` rebind + `BaseMenuScene.prototype.create = vi.fn()` temporary stub, exercising only the subclass body. All 2596/2598 unit tests green, tsc clean, lint clean (0 err, 4 pre-existing warnings), build green in 13.16s.
- [x] **R85.I6 [P1]** **Power-up legend in HUD** — **SHIPPED 2026-04-21**. Root cause: Invaders has no teaching surface for its power-up verbs — players pick up a magenta/cyan/yellow orb and the only feedback is the mid-screen ACTIVE banner which names the verb but does not explain *what it does* or *how long it lasts*, so Tom's *"need work and we need a key"* was a legend-absence problem, not a visual problem. Fix adopts Pong R84.P5's 3-method stack verbatim (show/hide/clear + `prefersReducedMotion` helper) because its "on every pickup" trigger model matches Tom's *"each collect + activate"* phrasing better than Snake R83.S1's "once at startup" model. New `POWERUP_LEGEND` config in `MatrixInvaders/config.ts` — `ENTRIES` tuple (1 row per power-up with `name · effect · duration`), `DISPLAY_MS=4000`, `FADE_IN_MS=200 / FADE_OUT_MS=400`, `LINE_HEIGHT=12`, `BASE_Y_RATIO=0.70`, `ACTIVE_ALPHA=1 / INACTIVE_ALPHA=0.55`. BASE_Y chosen by surveying existing HUD — y=315-363 on the 450-px canvas sits in clear air below the central active/ready banners (0.30/0.40/0.45) and above the player sprite zone (y=410). `GameScene.showPowerUpLegend(type)` rebuilds all 4 rows on every pickup with the active row painted at full alpha in that entry's `POWERUP_DEFS` colour and the other 3 dimmed to 0.55; tweens respect `prefers-reduced-motion` (alpha set directly, no fade). Auto-hide after 4s via `time.delayedCall` that stores its handle so back-to-back pickups cancel the pending hide and rebuild cleanly. Cancellation-token guard on the fade-out onComplete (`if (this.powerUpLegend === targets)`) stops a stale fade from wiping a fresh legend when pickups queue up within `FADE_OUT_MS`. Wired into `checkPowerUpCollisions` right after `activatePowerUp`, and `clearPowerUpLegend` into both `shutdown` and `resetState` so the text nodes don't leak across scene restarts. Regression tripwire: 24 new tests in `GameScene.test.ts § R85.I6 Power-up Legend HUD` — rendering contract (4 Text objects, correct fontSize/family/depth, centered x, y-spacing = LINE_HEIGHT), active-row highlighting (colour matches `POWERUP_DEFS[type].color`, active α=1 vs inactive α=0.55), back-to-back refresh (second pickup destroys first cohort + spawns fresh, cancellation-token blocks stale fade-out from clearing fresh legend), cleanup paths (shutdown clears, resetState clears, delayedCall auto-hide after 4s), reduced-motion (no tweens, alpha set directly via setAlpha), pickup wiring (showPowerUpLegend invoked from collision path). `prefersReducedMotion` helper uses `window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true` — both `?.` chains needed because the function may exist and still return undefined in some test-mocking or JSDOM contexts. All 2620/2622 unit tests green (2 pre-existing todo), tsc clean, lint clean (0 err, 4 pre-existing warnings unchanged), build green in 7.56s.
- [ ] **R85.I7 [P2]** **Matrix-style atmosphere amp-up**. Tom: *"just give the game more jazz, I guess. Matrix style."* Candidates: rain density bump, extra scanline pass behind the play field, muzzle-flash colour shifted toward MATRIX green on critical hits, slight camera micro-shake on wave clear. Keep procedural, no new textures.
- [ ] **R85.I8 [P2]** **Boss verify + polish**. Tom: *"Boss (if any) fires correctly — not got to boss yet"* — can't confirm mechanic live. Static audit: find boss-spawn condition (likely wave N), verify fire cadence + difficulty curve makes sense, ensure boss-hit juice scales with its size. If boss never fires due to null-guard bug, fix.
- [ ] **R85.I9 [P1]** **Unit-test coverage refresh** — new enemy sprite contract, bullet-time HUD + drain, power-up shooter-visibility invariant, menu button position, legend render/dismiss, boss fire cadence. Aim for +10-15 tests locking the new surface.

**Stream M — Metris polish (ship after Stream G, parallel with Stream I, ~5 iterations):**

- [ ] **R85.M1 [P0]** **First-block-spawn position**. Tom: *"the first block appears near the bottom and requires quick reactions, it needs to appeaar at the top and fall down, like the rest of the blocks do"*. Root cause likely in `Metris/scenes/GameScene.ts` `create()` — first tetromino is instantiated at bottom-of-board Y position instead of spawn-row (typically row 0 or 1). Fix: initialise first piece at the same spawn position subsequent pieces use, then run the normal gravity loop. One-place fix. Add regression test asserting first-piece Y < board-midpoint on scene start.
- [ ] **R85.M2 [P1]** **5-second countdown after menu**. Tom: *"5-second countdown fires correctly after menu — nope... We need a 5 second countdown too."* Metris currently skips to gameplay. Adopt `BaseScene.startCountdown` pattern (Frogger / Bird / Pong use this). Cross-cuts with M1 — after countdown ends, first piece spawns at the top per M1's fix.
- [ ] **R85.M3 [P1]** **Bullet-time B key manual activation**. Tom: *"B key triggers bullet time (verify: PG7 was null-guard bug) — nope. it activates automatically, needs to be activated by the user."* Currently B is wired to auto-activate on some threshold; switch to user-trigger-only (press B when meter full to consume). Matches Matrix Invaders' mental model so the arcade-wide bullet-time pattern is consistent.
- [ ] **R85.M4 [P2]** **Column spacing on right and left**. Tom: *"The spacing of the columns on the right and left Needs a bit of improvement."* Vague UX polish — audit Hold/Next side panels + score/level column, tighten padding if cramped OR spread if cluttered. Visual judgement call; regen baseline after.
- [ ] **R85.M5 [P1]** **Metris unit-test coverage** — first-piece-spawn invariant, countdown state transitions, bullet-time manual-activation gate, column-layout invariants.

**Stream V — Verification + Baselines (ship last, 1 iteration):**

- [ ] **R85.V1 [P1]** Visual baseline regen + full gate battery — after all G/I/M streams `[x]`. Commands: `npx tsc --noEmit` + `npm run lint` + `npm run build` + `npm test --run` + `npm run test:e2e` + `npm run test:visual -- --update-snapshots` (review diffs manually — Invaders enemy redesign will invalidate its baseline, Metris may too if M4 column spacing touched layout). Commit baseline regens separately as `R85.V1-visual: baseline update — Invaders + Metris polish`.

### R85 Verification Plan

1. **Stream G complete** → Tom plays a round of Invaders + a round of Metris, refreshes browser, confirms score persists (tick G1) AND iPod trophy reads correct score (tick G2).
2. **Streams I + M complete** → Tom plays each game 3-5 min, verifies new polish (UFO enemies, bullet-time HUD, first-block spawn, countdown, etc.) lands correctly.
3. **Stream V complete** → visual baselines reviewed + committed, full gate battery green.
4. **Automated gates per iteration**: `npx tsc --noEmit` + `npm run lint` + `npm run build` + `npm test --run`. Red blocks commit.
5. **Post-phase playtest**: Tom hand-plays Invaders + Metris end-to-end, ticks Known Issues, writes the R85 terminator phrase to Status.

### R85 Terminator

All of:
- R85.G1, G2 `[x]`
- R85.I1 – R85.I9 `[x]`
- R85.M1 – R85.M5 `[x]`
- R85.V1 `[x]`
- Gates green: lint + build + unit + E2E + visual
- Tom manually writes **"R85 COMPLETE — Invaders + Metris polish + globals shipped"** to Status

`loop.sh` hard cap: **20 iterations**. Ralph **never auto-writes** the terminator phrase — Tom's sign-off. **Remember the loop-sentinel rule**: don't write the word `COMPLETE` on the Status line mid-phase (use "shipped", "wrapped", "all `[x]`" instead) — `loop.sh` terminates on any `\bCOMPLETE\b` match on line 8.

### R85 Discovered Work

_(Ralph logs unexpected findings here during execution — do NOT create new R85.x tasks mid-iteration; log here for Tom's triage.)_

- **R85.I6 power-up count mismatch**: Tom's note says *"6 power-ups each collect + activate"* but Invaders currently ships only **4** (`rapidFire`, `shield`, `scoreMultiplier`, `bomb` in `POWERUP_DEFS`). The I6 legend covers all 4. If scope expands to 6, extend `POWERUP_LEGEND.ENTRIES` and `POWERUP_DEFS` in lockstep (a comment in `config.ts:88-97` names the two data structures that must move together) and top up the I6 regression tests that iterate over `ENTRIES.length`. Candidates Tom may have been thinking of: side-fire/spread, slow-time orb distinct from bullet-time B-verb, score shield, extra-life, or an enemy-freeze.

---

## R83 — Global Polish + CTRL-S Rewrite — **AWAITING TOM'S SIGN-OFF**

All 38 sub-bullets shipped across 3 rounds. Full detail archived at [`COMPLETED_WORK.md § R83`](COMPLETED_WORK.md#r83--global-polish--ctrl-s-rewrite-2026-04-19).

- [ ] **R83.CTRLS** (umbrella) — stays `[ ]` until Tom hand-plays CTRL-S from JACK IN → CTRL-S climax under Round 3 polish + Round 2 dread atmosphere + new ASCII library, without hitting a blocking bug. Tom-only tick.
- **Terminator phrase**: Tom manually writes `R83 COMPLETE — global polish + CTRL-S rewrite shipped` into the Status line at top. Ralph cannot self-write this.
- **If Tom's playthrough surfaces blocking bugs**: log under `### R85 Discovered Work` or add R83 Round 4 sub-bullets `.29+` (scope-permitting).

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


## Deferred / Future Phases (post-R84)

These phases are scoped but NOT scheduled. Ralph does NOT touch them during R85.

### R86 — Remaining 6-game polish

Per-game polish for Matrix Frogger, NeoJump, AgentChase, Rhythm Hacker, CloudJumper, CodeBreaker — the 6 games Tom hasn't yet playtested. Originally R85 was scoped as all 8 untested games, but Tom split the scope: Invaders + Metris got lifted into active R85 (2026-04-20) because Tom tested them first and surfaced critical globals (save persistence, trophy display) that block the whole arcade. Remaining 6 are contingent on Tom playtesting each + filling their `MANUAL_TESTING_CHECKLIST_*.md` Known Issues blocks (docs template-populated by R83.G7). R86 task list built from those notes the same way R83/R84/R85 were.

### R87+ — Performance + ship-readiness

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
