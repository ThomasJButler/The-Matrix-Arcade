# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: R76 OPEN — User playtest (2026-04-14) surfaced 8 global + 22 per-game items across 12 games. R75 P1 guards confirmed resolved in live browser. Next phase = final polish loop (overnight Ralph run).

> **Last change**: R76 (2026-04-14) — planning-only session. Tom completed full hands-on playtest in live browser ("Brilliant implementation so far, well done!"). R75 P1 cursor-guard work is now playtest-confirmed resolved. New findings logged below as `R76 Playtest Findings` — these supersede R75's open items in priority. Ralph Loop Strategy rewritten as an **overnight autonomous protocol** with a defined terminator condition (see bottom of file). Intended outcome: single unattended loop closes all R76 items before morning.
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
> - **P2 — Metris wKey dead code**: Still present. Field declared at line 80, bound at line 228, never read anywhere.
> - **P2 — Control hints invisible**: Still present. MenuScene:55-61 uses `MATRIX_COLORS.DARK_GREEN_HEX` (#003300) — nearly invisible against black.
> - **P2 — Dead cleanup in useSoundSystem**: Still present at lines 806-812. The `return () => {}` inside the `useEffect` merely re-sets the volume to the same value the effect body just set — completely redundant.
> - **Codebase health**: Zero TODO/FIXME/HACK comments. All console.error/warn properly DEV-gated. No commented-out code. All 12 games have unit + E2E tests. TypeScript strict mode fully enforced.
> - **E2E coverage COMPLETE**: All 12 games have dedicated playthrough specs + keyboard-only a11y tests. 18 total spec files across playthrough, a11y, performance, and visual categories. No new games need E2E tests created.
> - **E2E gap persists**: All playthrough tests use `autoStart=true`, bypassing MenuScene. The user-reported "press ENTER to start" bug is NOT tested. Adding `autoStart=false` E2E tests would catch this regression.
> - **onExit IS wired up**: App.tsx passes `onExit` to all game components (lines 595, 644). The R69 "onExit never passed" finding is outdated — this was fixed.
> - **Asset status unchanged**: 12 games have deployed sprites. Only Matrix Frogger has deployed audio. 5 music tracks for Rhythm Hacker. All other games use procedural audio only.
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
> **R71 test audit**: Last E2E run passed (0 failures). 43 unit test files (1838 tests), 21 E2E spec files, ~87 visual baselines. 4 hollow test cases in ShatnerVoiceControls.test.tsx (mock setup but no assertions). Dead `enableTestMode` export in test-utils.ts (migration complete, can remove). FPS budget test only runs with `PLAYWRIGHT_PERF=1` env var.
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

---

## R76 Playtest Findings (NEW — HIGH PRIORITY)

These are the items surfaced by Tom's hands-on playtest (2026-04-14). Every item has: severity, file paths, proposed fix, and acceptance criteria. Ralph's overnight loop walks this list top-to-bottom. Global items first; per-game second. **All R75 P1/P2 items are now either resolved in live browser or folded into `R75 P2 Cleanup Batch` below.**

### R76 — Global Items

#### G1 — [P0] No start menu on launch (all 12 games)
- [ ] **Fix**: Change `autoStart={true}` → `autoStart={false}` at `src/App.tsx:595` and `src/App.tsx:644`.
- **Why**: Currently every game boots straight into `GameScene`, skipping `MenuScene`. User expects to manually press START.
- **Cascading impact**: Breaks 12 playthrough E2E specs that rely on `autoStart=true` — address via new menu-first spec (see Section R76 E2E below).
- **Acceptance**: Launch any game via portal → MenuScene visible with title + "Press ENTER" hint. ENTER transitions into countdown (G8), then gameplay.

#### G2 — [P0] Global BGM (`matrixarcaderetrobeat.mp3`) overlaps per-game music
- [ ] **Fix**: Scope `playBackgroundMP3()` so it only plays when (a) on landing page or (b) inside CTRL-S World. Stop it on entry to ANY Phaser game; resume only when the user is back on the landing page.
- **Files**: `src/App.tsx:396` (mount play), `src/App.tsx:699` (resume-on-exit), `src/hooks/useSoundSystem.ts:774-812` (playback logic).
- **Acceptance**: Snake Classic, Rhythm Hacker, etc. play only their own track — no overlap. CTRL-S retains retrobeat. Landing page retains retrobeat.

#### G3 — [P0] Achievements modal "crushes the page"
- [ ] **Fix**: Audit grid overflow at 1280×800 and 375×667. Likely culprit: `h-[90vh]` + nested scroll + focus trap interaction. Constrain modal to `max-h-[90vh] overflow-hidden` with inner scroller only. Add visual regression baselines for open-achievements state.
- **File**: `src/components/ui/AchievementDisplay.tsx` (currently `fixed inset-0 z-50 max-w-6xl h-[90vh] overflow-y-auto`, grid `md:grid-cols-2 lg:grid-cols-3` at line 193).
- **Acceptance**: Open achievements on landing + post-game — layout stable, no layout shift on open/close, no overlap with surrounding UI.

#### G4 — [P1] Landing page grid card sizes inconsistent
- [ ] **Fix**: Set each card to `aspect-[4/3] h-full` within the grid; equalise content-area heights with `min-h-[Npx]` for title + description blocks so cards of different text lengths still bound-box identically.
- **File**: `src/components/LandingPage.tsx:187` (grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`) + the card component it renders.
- **Acceptance**: All cards in grid identical bounding box at every breakpoint.

#### G5 — [P1] Card layout — only PLAY button stands out; instructions/high scores/nav hard to see
- [ ] **Fix**: In the carousel (portal view in `src/App.tsx`) + card components, add consistent section headers ("HOW TO PLAY", "HIGH SCORE", "NAVIGATE"), bump contrast on secondary text to Matrix green at alpha 0.7, keep PLAY as the only solid-filled button. PLAY remains the single clear CTA.
- **Acceptance**: Visual hierarchy: PLAY most prominent; instructions/scores/nav readable in <1s glance.

#### G6 — [P1] Pause/resume often fails to resume (all Phaser games; CTRL-S fine)
- [ ] **Fix**: Promote a `BaseScene.resumeGame()` that (1) destroys the pause overlay via existing `hidePauseOverlay()`, (2) sets `this.input.keyboard.enabled = true`, (3) re-asserts focus on the Phaser canvas, (4) calls `this.scene.resume()`. Replace 11 ad-hoc pKey toggle bodies with a single call to this helper.
- **Files**: `src/lib/phaser/scenes/BaseScene.ts:115-172` (existing `togglePause` + `hidePauseOverlay`), every `GameScene.ts` pKey handler.
- **Acceptance**: Press P-P across all games — instant resume, all controls live. Covered by new E2E spec.

#### G7 — [P2] New "About / Inspiration / Passion" tab
- [ ] **Fix**: Create `src/components/About.tsx` with 3 sections: "About the Arcade", "Game Inspirations" (one short blurb per game with reference image from `rebuildingoldgames/inspirationimagesandsprites/`), "Why I Built This" (personal note from Tom — leave placeholder for him to fill). Wire into landing header nav. Keyboard accessible. ESC returns to landing.
- **Acceptance**: Accessible from landing, readable, no impact on game paths, passes keyboard-only a11y test.

#### G8 — [P1] 5-second countdown before gameplay starts (all games)
- [ ] **Fix**: Promote the pattern from `MatrixFrogger/config.ts:76-79` + `GameScene.ts:63,196-212` into `BaseScene.startCountdown(seconds: number, onComplete: () => void)`. Call from every `GameScene.create()` after MenuScene hands off. Expose `countdownValue` via `exposeTestState()` for E2E.
- **Dependency**: Lands after G1.
- **Acceptance**: Unified 5-4-3-2-1-GO overlay on all 12 games. Input during countdown does NOT affect gameplay. Test exposes countdown value.

#### G9 — [P2] R75 P2 Cleanup Batch (swept up during overnight loop)
- [ ] Metris `wKey` dead code — wire W to CW rotation in `Metris/scenes/GameScene.ts:80,228` alongside UP/X.
- [ ] Control hints nearly invisible — change `MenuScene.ts:55-61` from `MATRIX_COLORS.DARK_GREEN_HEX` to `MATRIX_COLORS.PRIMARY_HEX` at `setAlpha(0.3)`.
- [ ] Dead cleanup in `useSoundSystem.ts:806-811` — remove the `return () => {}` inside the `useCallback`.
- [ ] Dead `enableTestMode` export in `e2e/fixtures/test-utils.ts`.
- [ ] 4 hollow test cases in `ShatnerVoiceControls.test.tsx` (lines 131, 333, 356, 372).

### R76 — Per-Game Items

Every item is tagged with its P-level. `[P0]` = game-breaking in playtest.

#### PG1 — [P1] Snake Classic: app area exceeds 1 grid square
- [ ] Drop `CELL_SIZE` from 20→16 OR reduce canvas to 640×400 in `SnakeClassic/config.ts:19` to match portal frame.

#### PG2 — [P0] VortexPong: AI paddle doesn't move → unwinnable
- [ ] AI logic in `VortexPong/GameScene.ts:293-312` exists but accel likely never exceeds friction. Re-tune with minimum speed floor + ball-Y tracking every frame; add difficulty ramp. Verify paddle actually moves in playtest after fix.

#### PG3 — [P2] MatrixCloud → rename display to **"Matrix Bird"**
- [ ] Update display name in `src/data/gameRegistry.ts`, `MatrixCloud/config.ts` title, and portal card. **Keep folder name `MatrixCloud/`** to avoid large refactor — display-string change only.

#### PG4 — [P1] MatrixCloud: power-ups spawn too close to pipes
- [ ] In `MatrixCloud/GameScene.ts` power-up spawn logic, enforce minimum X-distance from nearest pipe (≥ 80px).

#### PG5 — [P2] MatrixCloud: "trolls need fine tuning" (obstacle balance pass)
- [ ] Reduce spawn frequency, cap simultaneous count at a reasonable number. File: `MatrixCloud/GameScene.ts`.

#### PG6 — [P2] MatrixInvaders: characters plain + slightly too big
- [ ] Shrink invader sprites ~20%, add colour palette variation per row. File: `MatrixInvaders/scenes/BootScene.ts` (sprite generation).

#### PG7 — [P0] Metris: `B` bullet-time key doesn't work
- [ ] Debug `Metris/GameScene.ts:231` — `bKey` binding + `tryManualBulletTime()` handler. Likely the `bKey` reference is null when `handleInput` reads it (fallout from R72 `waitForKeyboard` refactor). Apply narrow guard pattern from R75.
- [ ] Live-browser verify after fix.

#### PG8 — [P0] MatrixFrogger: Kung Fu (`K`) doesn't work
- [ ] Same root cause class as PG7. Verify `kungFuKey` binding at `MatrixFrogger/GameScene.ts:471` after async keyboard init, ensure `activateKungFu()` actually triggers from line 486.
- [ ] Live-browser verify.

#### PG9 — [P2] MatrixFrogger: better 3D visuals
- [ ] Pseudo-3D: parallax lane shadows + perspective scaling on vehicles. Defer if non-quick.

#### PG10 — [P0] NeoJump: falling off-screen doesn't kill player
- [ ] Add `if (this.player.y > GAME_CONFIG.HEIGHT + 50) this.playerDeath('fall')` check in `NeoJump/GameScene.ts` `update()` loop.

#### PG11 — [P1] NeoJump: can't restart after death (blocked by PG10)
- [ ] Verify `GameOverScene` transition fires once PG10 lands. R key + menu restart must both work.

#### PG12 — [P1] NeoJump: bomb sprites too large
- [ ] Shrink bomb sprite ~30% in bomb texture generation (check `BootScene`).

#### PG13 — [P2] NeoJump: better 3D visuals
- [ ] Parallax + scale depth. Defer if non-quick.

#### PG14 — [P0] AgentChase: wall-collision glitch (stutter into walls)
- [ ] Replace "stop at wall" with Pac-Man-style "slide along wall + buffered turn": carry momentum perpendicular; on corner, auto-turn if input direction becomes clear. File: `AgentChase/GameScene.ts` movement handler.

#### PG15 — [P1] AgentChase: too similar to Pac-Man — add Matrix twist
- [ ] Add ONE small unique mechanic: e.g. "Bullet-time dot" freezes agents 2s, OR "code fragments" that rebuild a key phrase. Choose the quicker of the two.

#### PG16 — [P1] AgentChase: sprites too small
- [ ] Increase player + agent sprites from ~20px to 28px. Adjust physics hitbox accordingly.

#### PG17 — [P1] RhythmHacker: BG music conflicts (likely G2 fallout)
- [ ] Verify auto-resolves after G2. Re-test in playtest after G2 lands.

#### PG18 — [P1] RhythmHacker: more "matrix chaos" animations on combos
- [ ] Add screen-shake + matrix-rain burst on 10/25/50 combos; colour shift on streak. File: `RhythmHacker/GameScene.ts` combo handlers.

#### PG19 — [P0] CloudJumper: cannot jump manually
- [ ] Verify/add SPACE + UP jump binding in `CloudJumper/GameScene.ts` input. This game uses event-driven `key.on('down', ...)` — preferred pattern.

#### PG20 — [P1] CloudJumper: not enough clouds — unplayable
- [ ] Double cloud spawn rate; reduce vertical gap floor in cloud spawn loop.

#### PG21 — [P1] CodeBreaker: numpad keys don't control paddle
- [ ] Add numpad 4/6 bindings alongside arrow + A/D. File: `CodeBreaker/GameScene.ts` input setup.

#### PG22 — [P1] CodeBreaker: level 1 lacks brick colour variety
- [ ] Use all 6 colours on level 1 (row-by-row) instead of 2. File: `CodeBreaker/config.ts` or level gen.

### R76 — E2E Coverage for Menu-First Flow

#### E1 — [P0] Add `menu-first-flow.spec.ts`
- [ ] Create `e2e/playthrough/menu-first-flow.spec.ts`. Parametrised over all 12 games: navigate from landing → portal → game, assert MenuScene title visible, press ENTER, assert 5s countdown visible, wait for countdown, assert GameScene active + controls responsive. Use `test.describe.parallel` for speed.
- **Why**: Once G1 lands (`autoStart=false`), every existing playthrough spec that relied on `autoStart=true` must now pass through MenuScene. This spec covers the new path and prevents regression.

#### E2 — [P2] Regenerate visual baselines
- [ ] After all R76 items land: `npm run test:visual:update`, review diffs carefully, commit intentional baseline updates separately under message `R76.N-visual: baseline update`.

---

### ~~P1 — Over-Broad update() Guards Freeze Game Logic (R73)~~ RESOLVED R76 (playtest-confirmed)

Tom's 2026-04-14 playtest confirms: "Brilliant implementation so far, well done! We've made stellar progress, and it's just about tweaking now and getting the final gameplay on point." All controls respond in live browser across all 12 games. The R75 narrow-guard work shipped successfully.

<details>
<summary>Original R75 analysis (preserved for history)</summary>

### P1 — Over-Broad update() Guards Freeze Game Logic (NEW R73)

R72's cursor guards prevent crashes but are too aggressive — they block the **entire** `update()` method, not just input handling. During the ~500ms keyboard init window:

| Game | Guard | What gets frozen |
|------|-------|-----------------|
| MatrixFrogger | `if (!this.cursors) return;` (line 207) | Enemy vehicle movement, obstacle spawning, countdown, lane collision, matrix rain |
| NeoJump | `if (!this.cursors) return;` (line 189) | Platform generation, parallax rain, gravity, enemy spawning, camera follow |
| AgentChase | `if (!this.cursors) return;` (line 159) | Ghost AI movement, dot collision, animation timer, power pellet timing |
| VortexPong | `if (!this.upKey \|\| !this.downKey) return;` (line 110) | Ball physics, AI paddle, power-up spawning, scoring, impact effects |

**Fix**: Narrow the guard to wrap only the input-reading call, not the full update. Everything else (physics, AI, rendering, scoring) should run immediately:

```typescript
update(time: number, delta: number): void {
  if (this.isPaused) return;
  // Game logic runs unconditionally
  this.updateEnemies(delta);
  this.updatePhysics(delta);
  // Input only when keys are ready
  if (this.cursors) {
    this.handleInput(delta);
  }
}
```

**Files**: `MatrixFrogger/scenes/GameScene.ts:207`, `NeoJump/scenes/GameScene.ts:189`, `AgentChase/scenes/GameScene.ts:159`, `VortexPong/scenes/GameScene.ts:110`

</details>

### ~~P0 — Unguarded Cursor Access in 3 Phaser Games~~ RESOLVED (R72)

R72 added `if (!this.cursors) return;` guard after the `isPaused` check in MatrixFrogger, NeoJump, and AgentChase `update()` methods. Also refactored `BaseScene.waitForKeyboard` to take a per-callback `retries` parameter instead of using the shared `keyboardRetryCount` instance field, restoring the full 10-retry budget per callback. Lint, typecheck, and 1838/1838 unit tests all pass. **Superseded by R73 P1 (guards too broad) — see above.**

<details>
<summary>Original analysis (R69–R71)</summary>

### P0 — Unguarded Cursor Access in 3 Phaser Games (R69, verified R70)

**User report**: "Phaser games controls don't work — they play but controls don't work. Press enter freezes." Legacy (React canvas) games work fine.

**Root cause**: `waitForKeyboard()` was added in R62 to delay key registration until `input.keyboard` is ready. However, the `handleInput()` methods in 3 games access the cursor/WASD keys **without null guards**. If `update()` fires before the callback completes, accessing `this.cursors.up` throws a silent `TypeError` that kills Phaser's update loop — the scene renders but all controls are dead.

**R70 verification** — exact crash sites confirmed with line numbers:

| Game | File | update() | handleInput() | Pattern |
|------|------|----------|---------------|---------|
| MatrixFrogger | `scenes/GameScene.ts` | Line 205: no guard, only `isPaused`+`isCountdown` | Line 569: `Phaser.Input.Keyboard.JustDown(this.cursors.up)` | `!` declaration, no guard |
| NeoJump | `scenes/GameScene.ts` | Line 187: no guard, only `isPaused` | Line 407: `this.cursors.left.isDown` | `!` declaration, no guard |
| AgentChase | `scenes/GameScene.ts` | Line 157: no guard, only `isPaused` | Line 362: `this.cursors.up.isDown` | `!` declaration, no guard |

**VortexPong** declares keys as `?` optional (lines 72-76), uses `?.isDown` (lines 248-249) — no crash, but controls silently don't respond until callback fires. **CloudJumper** and **RhythmHacker** use event-driven `key.on('down', ...)` — immune.

**Fix approach** (two-pronged):

1. **Defensive guard in `update()`**: Add an early return guard before calling `handleInput()` in all 3 games:
   ```typescript
   update(time: number, delta: number): void {
     if (this.isPaused) return;
     if (!this.cursors) return;  // Wait for keyboard init
     // ... rest of update
   }
   ```

2. **Per-callback retry counter in BaseScene**: Currently `keyboardRetryCount` (line 31) is a single instance field shared across all `waitForKeyboard` calls. Each scene calls it twice (`setupInput` + `setupCommonInputs`), effectively halving the retry budget from 10 to ~5 per callback. Fix by passing a local counter through the recursive calls:
   ```typescript
   protected waitForKeyboard(callback: () => void, retries = 0): void {
     if (this.input.keyboard) { callback(); return; }
     if (retries < BaseScene.MAX_KEYBOARD_RETRIES) {
       this.time.delayedCall(BaseScene.KEYBOARD_RETRY_MS, () => this.waitForKeyboard(callback, retries + 1));
     } else {
       this.events.once('update', () => { if (this.input.keyboard) callback(); });
     }
   }
   ```

3. **Optional: refactor to event-driven input** (like RhythmHacker/CloudJumper) to eliminate the race entirely. Lower priority — the guard in step 1 is sufficient.

**Files to modify**:
- `src/components/games/phaser/MatrixFrogger/scenes/GameScene.ts` — add `if (!this.cursors) return;` guard in `update()`
- `src/components/games/phaser/NeoJump/scenes/GameScene.ts` — same guard
- `src/components/games/phaser/AgentChase/scenes/GameScene.ts` — same guard
- `src/lib/phaser/scenes/BaseScene.ts` — refactor `waitForKeyboard` to use per-callback counter (remove shared `keyboardRetryCount` field)

</details>

### ~~P1 — VortexPong Controls Delayed Response~~ RESOLVED (R72)

R72 added `if (!this.upKey || !this.downKey) return;` after the `isPaused` check in VortexPong's `update()`. Silent unresponsiveness is now a visibly brief waiting state, matching the other three games' behaviour.

### P2 — E2E Tests Bypass MenuScene (NEW R75)

All 12 playthrough E2E tests use `autoStart=true`, which skips `MenuScene` entirely. This means the user-reported "press ENTER to start doesn't work" bug is NOT caught by any test. After the P1 guard fix, add at least one E2E spec (or a parametrised test across all Phaser games) that tests the full `MenuScene → ENTER → GameScene` flow with `autoStart=false`.

**How to test**: Navigate to a Phaser game via the portal, ensure MenuScene renders with title + "Press ENTER to start" text, press Enter, verify GameScene starts and controls respond.

**Files**: `e2e/playthrough/` — add a new spec or extend an existing one.

### P2 — Dead Cleanup Code in useSoundSystem (NEW R69)

`useSoundSystem.ts:806-811` contains a `return () => { ... }` inside a `useCallback`. The return value of `useCallback` is ignored by React — this cleanup function is never called. It appears to be a copy-paste artefact from a `useEffect`. Either move the cleanup logic into a `useEffect` or remove the dead code.

**File**: `src/hooks/useSoundSystem.ts:806-811`

### P2 — Metris W Key Dead Code (NEW R73)

`wKey` is declared at `Metris/scenes/GameScene.ts:80`, bound at line 228, but never read anywhere in `handleInput()` or any other method. The W key does nothing in Metris. Following WASD convention (W=up=rotate CW), it should map to clockwise rotation (same as UP arrow). Currently UP rotates CW, X rotates CW, Z/SHIFT rotate CCW — W should join the CW group.

**File**: `src/components/games/phaser/Metris/scenes/GameScene.ts` — add `this.wKey?.isDown` check alongside `this.upKey?.isDown` for CW rotation.

### P2 — Control Hints Nearly Invisible (NEW R73)

`MenuScene.ts:55-61` renders "ESC: Exit  P: Pause  M: Mute" using `MATRIX_COLORS.DARK_GREEN_HEX` (#003300) — a colour almost indistinguishable from the #000000 background. Users who need to discover exit/pause/mute controls cannot read this text. Change to a mid-green with reduced alpha (e.g. `MATRIX_COLORS.PRIMARY_HEX` at `setAlpha(0.3)`).

**File**: `src/lib/phaser/scenes/MenuScene.ts:55-61`

### ~~P2 — Unguarded console.warn/error in Production~~ RESOLVED (R70 — already guarded)

R69 reported 6 unguarded `console.warn`/`console.error` calls. **R70 code verification confirms all 6 are already properly wrapped in `if (import.meta.env.DEV)` guards.** The R69 report was incorrect. Specifically:
- `useSoundSystem.ts` lines 541, 610, 678 — all guarded
- `useShatnerVoice.ts` line 218 — guarded
- `useAdvancedVoice.ts` line 338 — guarded
- `useLifelineManager.ts` line 80 — guarded

---

### ~~P0 — Keyboard Input Race Condition~~ PARTIALLY RESOLVED (R62, re-opened R69)

**User report**: "Phaser games freeze when pressing Enter to start and controls don't work." Legacy games work fine.

**Root cause analysis** (R59 deep investigation, R61 expanded — 7 contributing factors identified):

#### Factor 1: Keyboard setup deferred 100ms when `input.keyboard` is null (CRITICAL)
Every scene's `setupInput()` and `setupCommonInputs()` uses this guard:
```typescript
if (!this.input.keyboard) {
  this.time.delayedCall(100, () => this.setupInput());
  return;
}
```
If Phaser's keyboard plugin hasn't initialised when `create()` fires, input setup is deferred 100ms via `delayedCall`. No max retry count, no timeout, no error logging. If the keyboard plugin never initialises (e.g. due to a focus issue), the game appears "frozen" — the scene renders but **no controls respond**. 16 locations across BaseScene, MenuScene, GameOverScene, and all 11 game GameScenes.

**Files**: `src/lib/phaser/scenes/BaseScene.ts:41-43`, `src/lib/phaser/scenes/MenuScene.ts:135-137`, `src/lib/phaser/scenes/GameOverScene.ts:223-225`, all `GameScene.setupInput()` methods.

#### Factor 2: "Click to play" overlay intercepts Enter/Space (HIGH)
When the overlay appears (`hasEverFocused && !hasFocus && !isHovering`), its `onKeyDown` handler calls `e.preventDefault()` and `e.stopPropagation()` for Enter and Space keys (PhaserGame.tsx:270). If the overlay receives focus (it has `tabIndex={0}`), these keypresses never reach Phaser. The overlay sits at `z-index: 10` covering the entire game area, blocking all pointer events.

**File**: `src/lib/phaser/PhaserGame.tsx:267-296`.

#### Factor 3: autoStart={true} skips MenuScene — no "Enter to start" in Phaser (LOW)
App.tsx always passes `autoStart={true}` (lines 593, 642). `BootScene.create()` reads this and jumps directly to `GameScene`, skipping `MenuScene` entirely. There is no Phaser-side "Press Enter to start" prompt — the carousel's Enter key is handled by App.tsx's React global handler, not by Phaser. This is by design but means the user's "Enter to start doesn't work" perception comes from the initialisation delay (Factor 1), not a missing handler. However, after game-over, `GameOverScene.goToMenu()` goes back to MenuScene which DOES require Enter — so players encounter the race condition on restart.

**Files**: `src/App.tsx:593,642`, `src/lib/phaser/scenes/BootScene.ts:43-46`.

#### Factor 4: Lazy loading adds initialisation delay (MEDIUM)
Game components are lazy-loaded via `React.lazy()`. On first play, the chunk must download before `PhaserGame` can mount. This adds 100-500ms where the user sees "Loading..." but input is not being captured. Combined with Factor 1, total time from Enter-press to responsive game can exceed 1 second.

**File**: `src/App.tsx:37-48`.

#### Factor 5: `onExit` is never passed from App.tsx (LOW — functional but dead code)
App.tsx renders `<GameComponent achievementManager={...} isMuted={...} autoStart={true} />` without `onExit`. Phaser's `BaseScene.handleExit()` calls `emitGameEvent({ type: 'exit' })` → `onExit?.()` → no-op. ESC works only because App.tsx has its own global `window.addEventListener('keydown')` that checks for ESC and sets `isPlaying = false`. The Phaser ESC path is completely dead code.

**File**: `src/App.tsx:593,642`.

#### Factor 6: App.tsx global `preventDefault` may block Phaser keyboard events (HIGH — NEW R61)
App.tsx lines 301-327 add a global `keydown` listener that calls `e.preventDefault()` when `isPlaying` is true, unless the event target is inside `[data-phaser-game]`, or is an INPUT/TEXTAREA/CANVAS element. But since Phaser's keyboard plugin targets `window` (set in PhaserGame.tsx:138), keyboard events may have `document.body` as their target — not the canvas or game container. The guard logic does not account for `window`-targeted events, so `preventDefault()` fires, potentially interfering with Phaser's keyboard processing.

**File**: `src/App.tsx:301-327`.

#### Factor 7: Missing shutdown() in MenuScene and GameOverScene (HIGH — NEW R61)
Neither `MenuScene` nor `GameOverScene` has a `shutdown()` method. Keyboard keys registered by these scenes (Enter, Space, ESC, P, M, R) are never cleaned up on scene transition. This causes ghost key handlers from previous scenes to linger during the new scene, leading to potential double-firing and memory leaks from accumulated key objects.

**Files**: `src/lib/phaser/scenes/MenuScene.ts` (no shutdown), `src/lib/phaser/scenes/GameOverScene.ts` (no shutdown).

**All 7 factors resolved in R62.** See R62 delta above for details. The "GET READY" overlay (item 6) was deferred as low-value — the polling fix eliminates the perceptible delay.

---

### ~~P1 — Shutdown Cleanup Gaps~~ RESOLVED (R62)

**R61 full audit**: 10 of 11 Phaser GameScenes are missing `super.shutdown()`. Six are missing `this.time.removeAllEvents()`. Five are missing `this.tweens.killAll()`. Only SnakeClassic calls `super.shutdown()`.

**Note**: `BaseScene` does not currently define its own `shutdown()` method — `super.shutdown()` calls Phaser's native `Scene.shutdown()`. However, BaseScene creates pause overlay graphics/text that are only cleaned up in `hidePauseOverlay()`. If a scene shuts down while paused, these leak.

| Game | Missing `time.removeAllEvents()` | Missing `tweens.killAll()` | Missing `super.shutdown()` | File |
|------|----------------------------------|---------------------------|---------------------------|------|
| MatrixInvaders | **Yes** | **Yes** | **Yes** | `GameScene.ts:1032` |
| MatrixCloud | **Yes** | **Yes** | **Yes** | `GameScene.ts:906` |
| NeoJump | **Yes** | Has killAll | **Yes** | `GameScene.ts:1224` |
| CodeBreaker | **Yes** | **Yes** | **Yes** | `GameScene.ts:1246` |
| VortexPong | **Yes** | **Yes** | **Yes** | `GameScene.ts:136` |
| SnakeClassic | **Yes** | **Yes** | Has super.shutdown() | `GameScene.ts:99` |
| AgentChase | Has removeAllEvents | Has killAll | **Yes** | `GameScene.ts:1026` |
| CloudJumper | Has removeAllEvents | Has killAll | **Yes** | `GameScene.ts:777` |
| MatrixFrogger | Has removeAllEvents | Has killAll | **Yes** | `GameScene.ts:1326` |
| Metris | **Yes** | **Yes** | **Yes** | `GameScene.ts:1014` |
| RhythmHacker | Has removeAllEvents | Has killAll | **Yes** | `GameScene.ts:1246` |

**All resolved in R62.** BaseScene.shutdown() added. All 11 GameScenes now have complete cleanup (time.removeAllEvents, tweens.killAll, super.shutdown).

---

### ~~P1 — Inaccurate Controls Descriptions in gameRegistry~~ RESOLVED (R62)

**R61 full audit** revealed 8 games with mismatched controls descriptions. Three are high-severity (factually wrong), two medium (major feature omitted), three low (WASD alternatives omitted).

| Game | Severity | Registry Says | Actual Behaviour | Fix |
|------|----------|---------------|-----------------|-----|
| AgentChase | **HIGH** | `'Arrow keys to move, SPACE to use power-up'` | Arrow keys/WASD move; **no SPACE handler exists**; power pellets activate on collection | Change to `'Arrow keys/WASD to move. Eat power pellets to frighten agents!'` |
| NeoJump | **HIGH** | `'Arrow keys to move left/right, SPACE to jump'` | Left/Right + A/D move; **SPACE shoots** (not jump); UP/W for jetpack; jumping is automatic on platforms | Change to `'Left/Right/A/D to move, UP/W for jetpack, SPACE to shoot'` |
| CloudJumper | **HIGH** | `'Arrow keys to move, SPACE to jump'` | **No horizontal movement exists**; SPACE/UP/W/click all jump | Change to `'SPACE/UP/W to jump between clouds'` |
| MatrixFrogger | **MEDIUM** | `'Arrow keys to move between lanes'` | Arrow keys + full WASD; **K key for Kung Fu attack** (3 charges) | Change to `'Arrow keys/WASD to move, K to Kung Fu attack'` |
| Metris | **MEDIUM** | `'Arrow keys to move, Z/X to rotate, SPACE to drop, B for bullet time'` | Also has UP rotate, **C for hold piece**, SHIFT rotate CCW, full WASD | Change to `'Arrows/WASD to move, Z/X to rotate, C to hold, SPACE to hard drop, B for bullet time'` |
| MatrixInvaders | LOW | `'Arrow keys to move, SPACE to fire, B to activate bullet time'` | Also has A/D for lateral movement | Add WASD mention |
| CodeBreaker | LOW | `'Arrow keys / Mouse: Move paddle \| SPACE: Launch ball \| B: Bullet time'` | Also has A/D for paddle | Add WASD mention |
| MatrixCloud | LOW | `'SPACE/Click to flap...'` | Also has ENTER to flap | Minor — acceptable as-is |

**All 5 HIGH/MEDIUM fixed in R62.** 3 LOW severity items (WASD mentions for Invaders/CodeBreaker/MatrixCloud) remain optional.

---

### ~~P1 — Unguarded console.warn/error Calls~~ RESOLVED (R62 verified already guarded)

**R60 incorrectly marked as fully resolved.** R61 audit found 4 remaining unguarded calls:

| File | Line | Call |
|------|------|------|
| `src/hooks/useShatnerVoice.ts` | 218 | `console.warn('Speech synthesis error, continuing to next sentence')` |
| `src/hooks/useAdvancedVoice.ts` | 213 | `console.warn('Audio context initialization failed:', error)` |
| `src/hooks/useAdvancedVoice.ts` | 354 | `console.error('Speech synthesis error:', event)` |
| `src/hooks/useLifelineManager.ts` | 80 | `console.warn('Failed to migrate legacy lifeline data:', error)` |

The 5 calls in `useSoundSystem` and `useSaveSystem` are correctly guarded. These 4 were missed.

All 4 already wrapped in `if (import.meta.env.DEV)` guards — R61 report was incorrect.

---

### ~~P0 — GAME_CONFIG TDZ Crash~~ RESOLVED (commit `ee18028`)

Three games (Rhythm Hacker, Matrix Cloud, Vortex Pong) were crashing with "Cannot access 'GAME_CONFIG' before initialization". Root cause: module-level `const` reads of `GAME_CONFIG` during circular import resolution hit the Temporal Dead Zone. Fix: moved all reads into method bodies or lazy singletons (`getTrackCharts()` for RhythmHacker).

**Remaining risk**: The circular dependency (`config.ts` importing scene classes, scene classes importing from `config.ts`) still exists in all games. If anyone adds a new module-level `const` that reads `GAME_CONFIG` in any scene file, the crash returns. `charts.ts:211-212` documents this.

---

### ~~P0 — Keyboard Controls Not Working In-Browser~~ VERIFIED (R57)

**Fixed R55, verified R57**. Root cause: Phaser 3.90.0 defaulted keyboard input target to canvas element, not `window`. Fix: `input.keyboard.target: window` in PhaserGame.tsx:138.

---

### ~~P1 — Commit Hygiene~~ RESOLVED

### ~~P2 — setTimeout Memory Leaks~~ RESOLVED (R56)

### ~~P2 — Unguarded console.\* Calls~~ ~~FULLY RESOLVED (R60)~~ RE-OPENED (R61) — see P1 above

### ~~P2 — Unused Hooks Cleanup~~ RESOLVED (R56)

---

### ~~P2 — Untracked setTimeout Calls~~ RESOLVED (R63)

All 4 untracked setTimeout calls now properly tracked in refs and cleared on unmount:
- **PuzzleModal.tsx**: Added to existing `timersRef.current.push()` pattern
- **useAdvancedVoice.ts**: New `autoAdvanceTimerRef` cleared in cleanup effect
- **PWAInstallPrompt.tsx**: New `promptTimerRef` cleared in useEffect cleanup
- **AchievementNotification.tsx**: Inner dismiss timer tracked via `dismissTimerRef`

---

### ~~P2 — Dead Types and Broken Registry Key~~ RESOLVED (R63)

- Removed dead `BaseSceneHelpers` and `PhaserGameConfig` interfaces from `types.ts` (and unused `Phaser` type import)
- Removed `PhaserGameConfig` re-export from `index.ts`
- Fixed Metris `registry.get('SAVE_SYSTEM')` → `registry.get(REGISTRY_KEYS.SAVE_SYSTEM)` (3 call sites)
- Wired up `REGISTRY_KEYS.SAVE_SYSTEM` in `PhaserGame.tsx` — save system now properly registered with `getSaveData()` and `updateGameSave()` methods, making Metris high scores, stats, and bullet-time persistence functional

---

### ~~P2 — Spec Inconsistencies~~ RESOLVED (R63)

Fixed cross-spec alignment between `game-architecture.md`, `phaser-games.md`, and `ux-guidelines.md`:
- Added `autoStart` and `onExit` to architecture GameProps interface
- Added `M` key (mute toggle) to architecture input table
- Added `select` sound to architecture required sound events
- Added Phaser file structure alongside React/Canvas structure in architecture spec
- Added `R` key (restart) to phaser-games.md integration requirements
- Added `onExit` to phaser-games.md GameProps

Remaining gaps intentionally left open (too speculative to define without playtesting): difficulty progression values, per-game scoring tables, per-game achievement lists, touch/mobile controls, music track assignments.

---

### ~~P1 — M Key Conflict in GameOverScene~~ RESOLVED (R68)

Changed menu shortcut from M to Q in `GameOverScene.setupGameOverInput()`. M is now exclusively the mute toggle from BaseScene. All 11 Phaser games no longer double-fire on M keypress.

---

### ~~P2 — High Score Not Loaded From Save~~ RESOLVED (R68)

Added save system reads to `resetState()` in MatrixInvaders, MatrixCloud, and CodeBreaker. Follows the Metris pattern: `registry.get(REGISTRY_KEYS.SAVE_SYSTEM).getSaveData()`. High scores now persist across sessions correctly. Updated test mocks to include `scene.registry`.

---

### ~~P2 — VortexPong R Key Bypasses Game Over Flow~~ RESOLVED (R68)

Added `this.reportScore(this.playerScore)` before `this.scene.restart()` so the score is persisted to React before the scene resets. Phaser's scene lifecycle handles `shutdown()` cleanup automatically on restart.

---

### Phase 0a — Global Asset Extraction (residue)

- [ ] Background textures, sci-fi UI panels, additional icon packs (still in ZIPs)

### Phase 0b — Per-Game Asset Deployment (residue)

Sprites/audio not yet deployed. CTRL-S World is intentionally deprioritised — its assets should be wired into the Phase 7 rewrite, not the existing DOM implementation.

**Asset deployment status** (R61 full audit — sourced from ASSETS_NEEDED.md files):

| Game | Deployed Files | Real Art? | Audio? | Biggest Gap |
|------|---------------|-----------|--------|-------------|
| Matrix Frogger | 11 sprites + 6 audio | Core complete | **Full set** | Enhancement sprites (Neo, agents, tiles) |
| Vortex Pong | 10 sprites | Core complete | None | Power-up icons, audio |
| Neo Jump | 15 sprites | All states + platforms | None | Backgrounds, 2 enemy types, UI |
| Code Breaker | 14 sprites | Core + all 6 power-ups | None | Damage states, enemies, animations |
| Agent Chase | 13 sprites | All characters | None | Death anim, dots, audio |
| Metris | 7 sprites | Tetrominos only | None | Ghost piece, grid, backgrounds |
| Matrix Invaders | 7 sprites | Core functional | None | Boss, power-ups, animations |
| Cloud Jumper | 7 sprites | Player + 4 clouds | None | Backgrounds, collectibles, obstacles |
| Matrix Cloud | 3 sprites | Bare minimum | None | Bosses, power-ups, parallax |
| Snake Classic | 5 sprites | Minimal (no directions) | None | Directional variants, modes, boss |
| Rhythm Hacker | 5 audio tracks | 100% procedural visuals | 5 tracks | All visual assets, note charts |
| CTRL-S World | 0 | Nothing | Nothing | Everything (defer to Phase 7) |

**Critical gaps** (blocking for proper gameplay):
- [ ] **Audio is the biggest cross-cutting gap**: Only Matrix Frogger has deployed audio. SFX kit and music tracks exist in the dump but none have been extracted per-game.
- [ ] **Rhythm Hacker**: 5 music tracks deployed but all visual assets are procedural. Note charts (timing data) are generated procedurally via `charts.ts` — works but could be improved with hand-authored charts.
- [ ] **CTRL-S World**: Zero assets. Everything sourced but needs extraction. **Defer until Phase 7.**

**Partial deployment** (~25–75% done):
- [ ] **Snake Classic**: 4-directional sprite variants, Agent Smith, boss, grid tiles, 5 power-up icons
- [ ] **Matrix Cloud**: Player death anim, 3 boss sprites (must be created), power-up icons
- [ ] **Metris**: Ghost/variant tiles, UI panels (Hold/Next/Score), all effect animations
- [ ] **Matrix Invaders**: Boss sprite, death explosion, 6 power-up icons
- [ ] **Cloud Jumper**: Player death anim, collectibles, obstacles, 3 backgrounds
- [ ] **Matrix Frogger**: Neo player sprite replacing frog, chasing agents, environment tiles, power-up icons
- [ ] **Code Breaker**: Agent Smith animations, ball effects, portal sprite
- [ ] **Agent Chase**: Player death anim, dot/pellet sprites, map layout PNGs
- [ ] **Neo Jump**: Flying/shooting enemies, 3 background layers, altitude meter
- [ ] **Vortex Pong**: Power-up icons, goal flash, combo text

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
  - [ ] Form input labels
- [ ] **Rhythm Hacker BPM tuning** — current values are estimates; tune per track after playtesting
- [x] ~~**`useAdvancedVoice` AudioContext** — never connected to speech output (always returns zeros). Either wire it up or delete the dead path.~~ RESOLVED (R64) — removed dead AudioContext, replaced with synthetic visualisation.

#### Phase 6 — Playwright E2E residue (from R50 bulk-up)

Baselines are committed as macOS `*-chromium-darwin.png`. Carried forward from [`PLAYWRIGHT_BULKUP.md`](PLAYWRIGHT_BULKUP.md):

- [ ] **Docker baseline regen for CI parity** — run `docker compose -f docker-compose.playwright.yml run --rm e2e-tests npx playwright test --update-snapshots` and commit `*-chromium-linux.png` alongside the darwin ones so CI matches local.
- [ ] **Multi-viewport matrix** — currently single 1280x800. Add mobile (e.g. 375x667) and tablet (e.g. 768x1024) projects to `playwright.config.ts` if we want responsive coverage.
- [x] ~~**Per-game keyboard-only a11y playthroughs**~~ — done R58.
- [x] ~~**Performance budgets**~~ — done R58.
- [ ] **Flaky specs under full-suite parallelism** — `e2e/visual/landing.spec.ts:40` shows 1px height drift. `code-breaker`, `matrix-invaders`, `cloud-jumper` playthroughs occasionally time out under heavy parallel load. Root cause is dev-server contention under 5 workers.

### Playtest Verification (from `rebuildingoldgames/bugs.md`)

Items the user re-flagged after the R50 playtest. R54 code audit confirms most are working correctly — but live browser verification is blocked by the P0 keyboard bug.

- [ ] **Metris**: `B` bullet-time key — code-verified R54. **Needs live browser verification after P0 fix.**
- [ ] **Matrix Cloud combo bug** — code-verified R54. **Needs live browser verification after P0 fix.**
- [ ] **High Scores panel** — automated R58 via modals.spec.ts. **Still needs user clarification on what the original "broken" report meant.**
- [ ] **Achievements panel redesign** — automated R58. **Still needs user input on specific desired changes.**
- [ ] **Game card portal sizing** — code-verified R54. **P3 — cosmetic, defer until P0 is fixed.**

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

- Zero unchecked `[ ]` items under `R76 Global Items`.
- Zero unchecked `[ ]` items under `R76 Per-Game Items`.
- Zero unchecked `[ ]` items under `R76 E2E Coverage`.
- `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e` ALL green on a clean run.
- The `## Status` line contains the phrase **"R76 COMPLETE — final polish achieved"**.
- No `BLOCKED:` markers remain, OR every remaining blocker is tagged `BLOCKED-NEEDS-HUMAN` (Ralph cannot resolve unaided).

When terminator is reached, write a final summary under a new top-level section `## R76 Completion Report` listing: iterations run, tasks closed, tasks blocked, tests passing, discovered-work items deferred to R77. Then stop.

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
