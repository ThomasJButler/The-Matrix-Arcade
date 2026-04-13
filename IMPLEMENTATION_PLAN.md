# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: ACTIVE — P0 keyboard fixed, P1 all resolved, P2 setTimeout/dead-types/registry resolved. Spec cleanup, assets, and polish remain.

> **Last audit**: R63 (2026-04-13). All unit tests pass (1831/1831). Build clean. TypeScript clean. All E2E tests pass. 12 games total, all with E2E playthrough coverage. Git on `developmentv3.0`.
>
> **R63 delta from R62**: Resolved P2 setTimeout leaks (4 files), P2 dead types, and P2 broken Metris save system registry key:
> - **P2 RESOLVED**: All 4 untracked `setTimeout` calls now tracked in refs and cleared on unmount (PuzzleModal, useAdvancedVoice, PWAInstallPrompt, AchievementNotification).
> - **P2 RESOLVED**: Removed dead `BaseSceneHelpers` and `PhaserGameConfig` interfaces from `types.ts`. Removed unused `Phaser` type import.
> - **P2 RESOLVED**: Fixed Metris save system — `registry.get('SAVE_SYSTEM')` was using wrong string (uppercase vs constant). Changed to `REGISTRY_KEYS.SAVE_SYSTEM` and wired up save system in `PhaserGame.tsx` registry. Metris high scores, stats, and bullet-time count now persist correctly.
>
> **R62 delta from R61**: Resolved P0 keyboard race condition (all 7 factors), P1 shutdown cleanup, P1 controls descriptions, and P1 console guards:
> - **P0 RESOLVED**: Replaced single 100ms `delayedCall` retry with `waitForKeyboard()` helper (50ms × 10 polling + scene `update` fallback). Applied to BaseScene, MenuScene, GameOverScene, RhythmHacker MenuScene, and all 11 GameScene `setupInput()` methods (16 locations total).
> - **P0 RESOLVED**: Added `shutdown()` to BaseScene (cleans up pause overlay + common keys), MenuScene, GameOverScene, and RhythmHacker MenuScene. All now call `super.shutdown()`.
> - **P0 RESOLVED**: Removed `tabIndex` and `stopPropagation` from PhaserGame.tsx click-to-play overlay so it cannot steal keyboard focus.
> - **P0 RESOLVED**: Fixed App.tsx `preventDefault` guard — now skips all keydown events when a `[data-phaser-game]` element exists in DOM, regardless of event target.
> - **P0 RESOLVED**: Wired up `onExit` prop at both render sites in App.tsx, making Phaser ESC → exit path functional.
> - **P1 RESOLVED**: Added `time.removeAllEvents()`, `tweens.killAll()`, and `super.shutdown()` to all 11 GameScenes that were missing them.
> - **P1 RESOLVED**: Fixed 5 HIGH/MEDIUM severity controls descriptions in gameRegistry (AgentChase, NeoJump, CloudJumper, MatrixFrogger, Metris).
> - **P1 RESOLVED**: Console guards were already in place (re-checked all 4 locations — all wrapped in `import.meta.env.DEV`).
> - **Test infra**: Added `removeAllEvents` and `tweens` mocks to shared Phaser test setup.
>
> **Codebase health**: Zero TODO/FIXME/HACK in src/. Zero @ts-ignore in production (5 in test files, all justified). TypeScript strict mode. 43 unit test files, 21 E2E specs. ~87 visual baselines. Zero unused hooks. All console calls guarded. 4 untracked setTimeout calls remain. GAME_CONFIG TDZ crash resolved. P0 keyboard race fully resolved.

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

### ~~P0 — Keyboard Input Race Condition~~ RESOLVED (R62)

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

### P2 — Spec Inconsistencies (NEW R61)

Gaps between `specs/phaser-games.md`, `specs/game-architecture.md`, and `specs/ux-guidelines.md`:

| Gap | Details |
|-----|---------|
| `autoStart` prop | Only defined in phaser-games.md; missing from game-architecture.md's `GameProps` interface |
| `M` key for mute | Listed in ux-guidelines and phaser-games but missing from game-architecture.md's input table |
| File structure | game-architecture.md specifies flat `src/components/games/GameName.tsx`; phaser-games.md specifies nested `src/components/games/phaser/GameName/`. No exception clause in architecture spec |
| `R` key for restart | Listed in architecture and UX but never mentioned in any individual game's controls table in phaser-games.md |
| Difficulty progression | Template has full level 1-10+ spec; none of the 5 Phaser games define difficulty scaling |
| Scoring values | Only high-level notes (e.g. "distance") — no concrete point values for any game |
| Achievement definitions | Architecture defines categories; no per-game achievements specified in phaser-games.md |
| Touch/mobile controls | UX guidelines require tablet touch; no Phaser game spec mentions touch at all |
| Background music | No game specifies a music track path or whether one should exist |

- [ ] Update specs to be internally consistent (focus on architecture.md alignment with actual Phaser project structure)

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
  - [ ] Focus traps on modals
  - [ ] CTRL-S World `aria-live` on story text (will be addressed by Phase 7 rewrite)
  - [ ] Form input labels
- [ ] **Rhythm Hacker BPM tuning** — current values are estimates; tune per track after playtesting
- [ ] **`useAdvancedVoice` AudioContext** — never connected to speech output (always returns zeros). Either wire it up or delete the dead path.

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

**Test infrastructure stats (R61)**: 43 unit test files (1831 tests), 21 E2E spec files, ~87 visual baselines. Categories: playthrough (12), visual (5), a11y (1), edge-cases (1), modals (1), performance (1). Last E2E run: all passed.

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
- All 1831 unit tests passing, build clean
- All E2E tests passing (12 playthroughs + 5 visual specs + keyboard-only a11y + performance budgets + modal shortcuts)
- All 12 games have complete E2E playthrough coverage with 6-checkpoint visual baselines
- GAME_CONFIG TDZ crash resolved (commit `ee18028`)

### Open Gaps
- **P2**: 4 untracked `setTimeout` calls (PuzzleModal:261 highest risk)
- **P2**: Dead types (`BaseSceneHelpers`, `PhaserGameConfig`) and broken `SAVE_SYSTEM` registry key (Metris save reads silently return undefined)
- **P2**: Spec inconsistencies between phaser-games.md, game-architecture.md, and ux-guidelines.md
- **CTRL-S World**: only DOM/React game; current implementation is buggy and complex enough to warrant the Phase 7 rewrite rather than incremental fixes
- Remaining sprite/audio assets per game (see Phase 0b above). Audio is the biggest cross-cutting gap — only Matrix Frogger has any deployed.
- Rhythm Hacker BPM values are estimates — may need tuning per track after playtesting
- `useAdvancedVoice` AudioContext for visualisation never connected to speech output (always returns zeros)
- No global `AssetManager` yet — each game still owns its own asset loading
- Circular dependency in all Phaser games (`config.ts` <-> scene files) — fragile but functional; documented in Architecture Notes

---

## Ralph Loop Strategy (open phases only)

1. ~~**P0 — Keyboard input race condition**~~ DONE R62.
2. ~~**P1 — Shutdown cleanup**~~ DONE R62.
3. ~~**P1 — Controls descriptions**~~ DONE R62.
4. ~~**P1 — Console guards**~~ Already done, verified R62.
5. **P2 — setTimeout tracking**: Track 4 untracked setTimeout calls in refs with cleanup. PuzzleModal:261 is highest risk — one-character fix.
6. **P2 — Dead types / broken registry**: Remove unused interfaces, fix Metris save system registry key.
7. **Playtest Verification**: After P0 fix lands, verify Metris bullet-time, Matrix Cloud combo, and other items via live browser testing.
8. **Phase 6 Playwright residue**: Docker baseline regen is the single highest-value remaining item. Multi-viewport and flake cluster are next.
9. **Phase 0a/0b**: Per-game asset deployment (skip CTRL-S until Phase 7). Audio extraction is the biggest bang-for-buck across all games.
10. **P2 — Spec consistency**: Align architecture.md with actual project structure.
11. **Phase 1/2**: Global `AssetManager` — optional, each game handles its own assets adequately for now.
12. **Phase 6 polish**: Remaining accessibility residue (focus traps, form labels), BPM tuning, voice AudioContext cleanup.
13. **Phase 7**: CTRL-S World Phaser rewrite — only after the above are closed. Start from `rebuildingoldgames/plans/ctrl-s-rebuild.md`.
14. Use `/matrix-arcade-gamedev` for game code, `/phaser-gamedev` for Phaser scenes, `/playwright-testing` for E2E.
15. Run `game-tester` agent after every code change. After any UI change, run `npm run test:visual` and commit updated baselines (both darwin + linux variants when possible).
