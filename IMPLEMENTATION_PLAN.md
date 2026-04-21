# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: **R86 open** (2026-04-21 — Tom's playtest notes on Matrix Frogger + Neo Jump filed). R86 = **Frogger + Neo Jump polish + 3 global regressions** (Batch 2 of the 3-batch per-game polish cadence started by R85). Loop cap: **20 iterations**. **R86.G1 + G2 shipped** — G1: defensive second write-path on Neo Jump death (mirrors Metris pattern, +3 tests). G2: click-to-focus fix traced to React 17+ SyntheticEvent.stopPropagation on the dashbar rove handler killing Phaser's native window keydown; fix reroutes `handlePlayPress` focus intent from `'dashbar'` to a new `'game'` target that a `MutationObserver` lands on `[data-phaser-game="true"]` once it mounts. All PhaserGame focus calls now use `preventScroll: true` so the iPod bezel entry spring isn't double-animated. +3 regression tests (2760 total). Remaining criticals: (G3) **WebGL warnings returned arcade-wide** — R83.CTRLS.11 fixed `premultipliedAlpha` + `mipmapFilter` for CTRL-S's render config, but Frogger + Neo Jump logs show the same warnings — the fix needs promoting to the shared Phaser baseline. **P0 blocker**: Frogger's finish-line triggers death/freeze crash (game-only, portal still responsive) — only Level 1 is playable. Loop-sentinel rule preserved (no `\bCOMPLETE\b` on Status line mid-phase — use "shipped" / "wrapped" / "all `[x]`"). **R85 awaiting sign-off** (Tom-tick only — terminator phrase lives in the R85 stub below). R84.S7 `[DEFER]` + R84.CI bucket also Tom-tick only. R83.CTRLS umbrella pending Tom's CTRL-S end-to-end tick. Full R85 archive at [`COMPLETED_WORK.md § R85`](COMPLETED_WORK.md#r85--invaders--metris-polish--2-globals-2026-04-20--2026-04-21).

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
- [ ] **R86.G3 [P2]** **Promote WebGL render-config fix arcade-wide** — Frogger + Neo Jump console dumps show the same `texImage: Alpha-premult and y-flip are deprecated` + `generateMipmap: lazy initialization` warnings that R83.CTRLS.11 silenced for CTRL-S. The fix (`premultipliedAlpha: false` + `mipmapFilter: ''` in Phaser render config) was applied only to CTRL-S's `PHASER_CONFIG`. Promote to a shared baseline: move to `src/lib/phaser/types.ts` `PHASER_CONFIG_DEFAULTS` or add to each `pixelArt: false` game's config (NeoJump, Frogger, VortexPong, MatrixCloud — check which currently lack it). Verify console is clean on all 11 Phaser games post-fix.

**Stream F — Matrix Frogger polish (ship after Stream G, ~7 iterations):**

- [ ] **R86.F1 [P0]** **Finish-line death / freeze crash — URGENT**. Tom: *"get death after going over the finish line - the game also freezes when hit the finish line, urgent fix for this... get high score or freezes and crashes (not the site, but the game, so need to back out to portal)"*. Result: only Level 1 is playable. Audit `MatrixFrogger/scenes/GameScene.ts` finish-line handler — suspect either (a) the finish-line hit-box is firing the death path instead of level-up, (b) the level-transition handler fails to clean up before `scene.restart()` / `scene.start(nextLevel)` leaving the scene in a deadlocked state, (c) async finish-line animation tween holding a reference that prevents GC. Fix whatever's broken so Level 2+ are reachable. Add E2E Playwright test that reaches the finish line and asserts level advances (not freezes).
- [ ] **R86.F2 [P1]** **5-second countdown after MenuScene** — Tom: *"no 5 second countdown"*. Adopt `BaseScene.startCountdown` pattern (Invaders/Metris/Bird/Pong use it post-R85).
- [ ] **R86.F3 [P1]** **Kung Fu HUD counter clipped** — Tom: *"cannot see this, needs moving up visually as its cut off, can see the 3 use limit though"*. HUD element painted below visible canvas or behind another UI element. Bump Y-position up, confirm visible at 1280×800 portal scale.
- [ ] **R86.F4 [P1]** **Object size vs safe-area hit-box audit** — Tom: *"Need to make sure the objects are not big enough to run into the safe area too"*. Cars and vehicles encroach into resting/safe rows, making the game feel unfair. Audit each vehicle sprite's hit-box — ensure it doesn't extend past the lane boundary into the adjacent safe row. Tune hit-box to match visible sprite, not an over-inflated bounding box.
- [ ] **R86.F5 [P1]** **Game-objects legend in menu + HUD** — Tom: *"we need to have what the different game objects are in the game menu"*. Adopt the legend pattern Snake/Pong/Invaders got in R83-R85 — a brief panel in MenuScene showing object icons + meanings (car, log, power-up types). Consider also brief in-HUD legend on power-up pickup (matches Pong R84.P5 / Invaders R85.I6).
- [ ] **R86.F6 [P2]** **Multi-level polish** — contingent on F1 unlocking Level 2+. Once finish-line works, playtest subsequent levels for difficulty ramp feel + any scene-reset artefacts (e.g. agents not respawning, backdrop lingering). May balloon to 2 iterations if deeper polish needed post F1.
- [ ] **R86.F7 [P1]** **Frogger unit-test coverage refresh** — finish-line contract (death-path vs level-up gate), Kung Fu HUD position invariants, hit-box matches visible sprite bounds, countdown state transitions, legend render/dismiss. Aim for +10-15 tests.

**Stream N — Neo Jump polish (ship after Stream G, parallel with Stream F, ~5 iterations):**

- [ ] **R86.N1 [P1]** **Difficulty rebalance** — Tom: *"too difficult. There are too many bombs early on. We should make the game a bit easier. A bit slower as well. Give more power to the player... you often just hit a bomb out of nowhere; you can't really avoid it."* Concrete dials: (a) reduce bomb spawn density in the first 0-500m altitude band by ~40%, (b) slow global camera-rise speed in early game so platforms are more reactive-findable, (c) increase jetpack fuel or reduce cooldown, (d) bump jump-squash forgiveness window, (e) maybe give the player a brief invuln post-bomb-miss to survive near-misses. Tune until a median player can reach 500m on first try without frustration.
- [ ] **R86.N2 [P1]** **Fall-death threshold at 50m** — Tom: *"Need to make it so if the player falls over 50 m, they die."* Currently only falls off-screen kill (PG10); Tom wants secondary threshold where falling >50m triggers death even if player is still on-camera. Add `fallDistance` tracking to player state; reset on any platform land; kill-path triggers at `fallDistance > 50` (scale appropriately if game uses pixels not metres).
- [ ] **R86.N3 [P1]** **In-game controls legend** — Tom: *"We need to show the player what the controls are."* Can be (a) MenuScene control panel (left/right arrow, UP jetpack, SPACE shoot, R restart) before game starts, (b) brief in-play overlay in the first 3 seconds that fades out, or (c) both. Match the style of Snake's R83.S1 power-up legend — Matrix green panel, short lines, fades cleanly.
- [ ] **R86.N4 [P1]** **Neo Jump unit-test coverage refresh** — difficulty constants (bomb density curves, camera-rise speed, jetpack fuel cap), fall-distance tracking + reset-on-land, death-path at 50m+ threshold, controls-legend render/dismiss. Aim for +10-12 tests.
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
