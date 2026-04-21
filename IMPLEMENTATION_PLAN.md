# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: **R85 open** (2026-04-20 — Tom's playtest notes on Matrix Invaders + Metris filed). R85 = **Invaders + Metris polish + 2 NEW globals** carved out of the originally-planned 8-game polish phase because Tom wants to test the remaining 6 games first before committing to their scope. Loop cap: **20 iterations**. **Critical globals surfaced by Tom's test**: (G1) **high-score persistence broken globally** — scoreboard R77 no longer saves across sessions on Invaders or Metris, likely regressed post-R83/R84 save-system work, blocks all scoreboard value; (G2) **iPod dashbar trophy still shows wrong/stale high score** — R83.G6 was supposed to fix this but Metris testing-doc flags it as still broken. Once R85 ships, Tom plays the remaining 6 games (Frogger / NeoJump / AgentChase / Rhythm / CloudJumper / CodeBreaker) and **R86** becomes the final per-game polish phase. **R84 still awaiting sign-off** (R84.S7 `[DEFER]`, R84.CI bucket Tom-tick-only) — Ralph must NOT work on R84 items during R85; those stay pending until Tom ticks post-playtest-sign-off. R83.CTRLS umbrella also still pending Tom's CTRL-S end-to-end tick. Full R84 archive at [`COMPLETED_WORK.md § R84`](COMPLETED_WORK.md#r84--3-game-polish--verification-2026-04-19--2026-04-20).

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
- [ ] **R85.G2 [P1]** **iPod dashbar trophy still shows wrong/stale high score** — Metris testing doc: *"still error"* against R83.G6 (which was supposed to have fixed this). Likely cascade from G1 — if scores aren't saving, the dashbar read is stale by nature. After G1 ships, re-verify R83.G6 holds for ALL 12 games by checking each registry ID in `src/data/gameRegistry.ts` maps correctly to the save-data key being read by `GamePortal` dashbar. Fix any remaining ID mismatches. Add regression test asserting dashbar queries the same key the game writes.

**Stream I — Matrix Invaders polish (ship after Stream G, ~9 iterations):**

- [ ] **R85.I1 [P0]** **Enemy sprite redesign — pigs → UFOs/battleships**. Tom: *"The ships look like pigs. We need to make them look like ships or battleships. They just look like faces. We need to make them look like UFOs and just give the game more jazz, I guess. Matrix style."* Audit `src/components/games/phaser/MatrixInvaders/` asset loading — identify current enemy sprites + their source. Replace with UFO / invader silhouettes (lean into Matrix green + scanline aesthetic, not the "hologram interface" default that's reading as faces). Procedural sprite regen in BootScene OR swap to new sprite sheet if one exists under `public/assets/matrix-invaders/`. Per-row colour tint (R83-era PG6 — testing doc flags unchecked, verify + fix if still missing). Regen visual baseline after swap.
- [ ] **R85.I2 [P1]** **Bullet-time visibility — HUD indicator + key reminder**. Tom: *"bullet time (B) actually activates... yes it works but its hidden and hard to know about bullet time or when to use it"*. Add persistent HUD element showing (a) available bullet-time charge (bar or segmented meter), (b) key reminder "[B] BULLET TIME" near the meter, (c) brief "BULLET TIME READY" pulse when charge fills. During active bullet-time, the meter drains visibly (Tom's *"Bullet time drains visibly, refills correctly — nope"* finding).
- [ ] **R85.I3 [P1]** **Enemy bullets too small**. Tom: *"enemy bullets Needs to be bigger"*. Currently likely 4-6px; bump to 8-12px. Consider glow/trail to improve readability against the scanline backdrop.
- [ ] **R85.I4 [P1]** **Power-up makes shooter invisible**. Tom: *"When getting many power-ups, the shooter becomes invisible."* Bug: stacking power-ups probably alters player sprite alpha or replaces the sprite without restoring. Audit `PowerUpManager` / player-sprite mutation on each power-up activation; cap any alpha modulation at 1.0, use a separate shield/aura layer for visual effects instead of modifying the player sprite directly.
- [ ] **R85.I5 [P1]** **Menu start button overlaps control hints**. Tom: *"Need to move the start button up a little bit on the menu, as it's overlapping the arrow keys W, S, D, Move, Space, Fire, Bullet Time B."* Invaders MenuScene may override `BaseScene.MENU_START_BUTTON_Y_RATIO` or the controls hint sits higher than other games. Audit scene; bump either button up or hints down for clean gap. Same pattern as R83.G4 / R84.B1 menu fixes.
- [ ] **R85.I6 [P1]** **Power-up legend in HUD**. Tom: *"6 power-ups each collect + activate — need work and we need a key"*. Adopt the same legend-on-pickup pattern shipped for Snake (R83.S1) + Pong (R84.P5) — brief 4-line overlay showing name + effect + duration, fades after ~4s.
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
