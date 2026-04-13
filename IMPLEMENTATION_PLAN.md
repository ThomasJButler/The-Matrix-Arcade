# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

## Status: POLISHED — P0 keyboard fix verified in browser, all P0/P1/P2 closed

> **Last audit**: R57 (2026-04-13). All unit tests pass (1831/1831). Build clean. TypeScript clean. P0 keyboard bug **verified working** via Chrome DevTools MCP browser testing: arrow keys move Vortex Pong paddle (confirmed via pixel analysis), Enter launches games without freezing, ESC exits to portal, portal arrow navigation works. `input.keyboard.target: window` at PhaserGame.tsx:138 confirmed routing events correctly. All P0/P1/P2 items resolved. Git on `developmentv3.0`.
>
> **Codebase health**: Zero TODO/FIXME/HACK in src/. Zero @ts-ignore in production (6 in test files, all justified). TypeScript strict mode. 43 unit test files, 16 E2E specs (13 playthroughs + 3 visual suites). 86 visual baselines (74 playthrough + 12 UI). Zero unused hooks (6 deleted in R56). Zero unguarded `console.*` calls in production. All setTimeout/setInterval timers properly tracked and cleaned up on unmount.

## Reference Docs

- [`PLAYWRIGHT_BULKUP.md`](PLAYWRIGHT_BULKUP.md) — R50 test-infra overhaul (43/43 specs, ~91 baselines, test-mode seam, seeded RNG, DOM/Phaser ready markers). Source of the Phase 6 playwright residue below.
- [`rebuildingoldgames/bugs.md`](rebuildingoldgames/bugs.md) — user's hand-written playtest backlog. Most items shipped in R1–R49, but a few were re-surfaced and still need verification (see **Playtest Verification** below).
- [`rebuildingoldgames/plans/*.md`](rebuildingoldgames/plans) — 12 per-game rebuild research docs. Primary input for Phase 7 CTRL-S rewrite and any future per-game rebuilds. Don't re-research — read these first.
- [`rebuildingoldgames/inspirationimagesandsprites/`](rebuildingoldgames/inspirationimagesandsprites) — reference art/UX inspiration per game (Citizen Sleeper for CTRL-S, Doodle Jump for Neo Jump, Guitar Hero for Rhythm, Pac-Man for Agent Chase, etc.).

---

## Priority Legend

- **P0**: Critical/blocking — games unplayable, users cannot interact
- **P1**: High — bugs that degrade experience, failing tests
- **P2**: Medium — infrastructure, UX improvements, research
- **P3**: Low — rebuilds, new features, polish

---

## Open Work

### ~~P0 — Keyboard Controls Not Working In-Browser~~ ✓ VERIFIED (R57)

**Fixed R55, verified R57** via Chrome DevTools MCP live browser testing. Root cause: Phaser 3.90.0 defaulted keyboard input target to canvas element, not `window`. Fix: `input.keyboard.target: window` injected in PhaserGame.tsx:138 config merge + overlay `onKeyDown` guards at line 270.

**Browser verification results** (R57):
- Arrow keys move Vortex Pong paddle (confirmed via canvas pixel analysis — paddle centre shifted from y=90 to y=163 after ArrowDown events dispatched to window)
- Enter launches games from portal without freezing (Snake Classic confirmed)
- ESC exits games back to portal (both Vortex Pong and Snake Classic confirmed)
- Portal arrow key navigation between games works
- Events dispatched to `window` are received by Phaser; events to canvas are not (confirming `target: window` is active)

---

### ~~P1 — Commit Hygiene~~ ✓ RESOLVED

### ~~P2 — setTimeout Memory Leaks~~ ✓ RESOLVED (R56)

### ~~P2 — Unguarded console.\* Calls~~ ✓ RESOLVED (R56)

### ~~P2 — Unused Hooks Cleanup~~ ✓ RESOLVED (R56)

---

### Phase 0a — Global Asset Extraction (residue)

- [ ] Background textures, sci-fi UI panels, additional icon packs (still in ZIPs)

### Phase 0b — Per-Game Asset Deployment (residue)

Sprites/audio not yet deployed. CTRL-S World is intentionally deprioritised — its assets should be wired into the Phase 7 rewrite, not the existing DOM implementation.

**Critical gaps** (0% sprites deployed):
- [ ] **Rhythm Hacker**: All visual assets are procedural. 5 WAV music tracks need ffmpeg → MP3 conversion. Note charts (JSON timing data) must be authored from scratch — blocking for proper gameplay.
- [ ] **CTRL-S World**: Zero sprites. 7 character portraits, 8 backgrounds, full UI set. All sources exist in dump but need extraction. **Defer until Phase 7.**

**Partial deployment** (~25–75% done):
- [ ] **Snake Classic**: 4-directional sprite variants, Agent Smith, boss, grid tiles, 5 power-up icons
- [ ] **Matrix Cloud**: Player death anim, 3 boss sprites (must be created), power-up icons
- [ ] **Metris**: Ghost/variant tiles, UI panels (Hold/Next/Score), all effect animations
- [ ] **Matrix Invaders**: Boss sprite, death explosion, 6 power-up icons
- [ ] **Cloud Jumper**: Player 4-state sprite, 4 cloud variants, 3 collectibles, 3 obstacles, 3 backgrounds
- [ ] **Matrix Frogger**: Neo player sprite, chasing agents, environment tiles, power-up icons
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
- [ ] **Multi-viewport matrix** — currently single 1280×800. Add mobile (e.g. 375×667) and tablet (e.g. 768×1024) projects to `playwright.config.ts` if we want responsive coverage.
- [ ] **Per-game keyboard-only a11y playthroughs** — landing-page focus + aria-labels asserted, but no per-game keyboard-only walk. Adds real teeth to the Phase 6 accessibility residue above.
- [ ] **Performance budgets** — no LCP / frame-rate assertions yet. Could hook Playwright `performance.measure()` + a fixture check.

### Playtest Verification (from `rebuildingoldgames/bugs.md`)

Items the user re-flagged after the R50 playtest. R54 code audit confirms most are working correctly — but live browser verification is blocked by the P0 keyboard bug.

- [ ] **Metris**: `B` bullet-time key — **code-verified R54**: key is registered in `setupInput()` (line 223), polled via `JustDown` (line 747), activates when `bulletTimeMeter >= BULLET_TIME_MAX_METER`. HUD shows `'BULLET TIME [B]'` (line 193). Likely works fine once P0 keyboard fix lands. **Needs live browser verification after P0 fix.**
- [ ] **Matrix Cloud combo bug** — **code-verified R54**: combo increments only in `scorePipe()` (lines 402–406) when `!pipe.hit`. Pillar contact calls `handleCollision()` which resets `this.combo = 1.0` (line 545). Bug is not present in current code. **Needs live browser verification after P0 fix.**
- [ ] **High Scores panel** — **code-verified R54**: `GameHighScores.tsx` modal exists, shows per-game high score, stats grid (games played, total score, best combo, etc.), and per-game achievements. Opened via 'H' key (App.tsx line 434) or button in portal. No global leaderboard exists — user may want one. **Needs live browser verification + clarification on what "broken" means.**
- [ ] **Achievements panel redesign** — **code-verified R54**: `AchievementDisplay.tsx` is a full `max-w-6xl h-[90vh]` modal with global stats, search bar, per-game filter buttons, responsive grid of achievement cards. Opened via 'A' key. Already reasonably polished. User wants redesign — **needs user input on specific desired changes.**
- [ ] **Game card portal sizing** — **code-verified R54**: Portal is a single-game display with 16:9 aspect-ratio preview, not a multi-card carousel. LandingPage uses responsive 1–4 column grid with `h-44` (176px) fixed-height preview images. User wants bigger cards (reference: `rebuildingoldgames/inspirationimages/gamecardlayout.png`). **P3 — cosmetic, defer until P0 is fixed.**

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

All scenes that register keyboard input must handle the case where `this.input.keyboard` is not yet ready:

```typescript
protected setupInput(): void {
  if (!this.input.keyboard) {
    this.time.delayedCall(100, () => this.setupInput());
    return;
  }
  // ... register keys
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

---

## Test Coverage Status

| Game | Type | Unit Test | E2E Playthrough | E2E Visual |
|------|------|-----------|-----------------|------------|
| CtrlSWorld | DOM | Yes | Yes | — |
| SnakeClassic | Phaser | Yes | Yes | — |
| VortexPong | Phaser | Yes | Yes | — |
| MatrixCloud | Phaser | Yes | Yes | — |
| MatrixInvaders | Phaser | Yes | Yes | — |
| Metris | Phaser | Yes | Yes | — |
| MatrixFrogger | Phaser | Yes | Yes | — |
| NeoJump | Phaser | Yes | Yes | — |
| AgentChase | Phaser | Yes | Yes | — |
| RhythmHacker | Phaser | Yes | Yes | — |
| CloudJumper | Phaser | Yes | Yes | — |
| CodeBreaker | Phaser | Yes | Yes | — |

Visual regression baselines exist for landing page and shared UI (modals, portal, achievements, settings) under `e2e/visual/`.

All Phaser games expose test state via `exposeTestState()`. E2E fixtures support both React and Phaser games. E2E uses `?test=1` URL param for deterministic `Math.random` (seeded mulberry32) and DOM ready markers.

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
- 13 E2E playthrough specs + 5 visual specs all passing

### Open Gaps
- ~~**P0**: Keyboard controls~~ — **VERIFIED R57** via Chrome DevTools MCP browser testing. Fix confirmed working.
- **CTRL-S World**: only DOM/React game; current implementation is buggy and complex enough to warrant the Phase 7 rewrite rather than incremental fixes.
- Remaining sprite/audio assets per game (see Phase 0b above).
- Rhythm Hacker BPM values are estimates — may need tuning per track after playtesting.
- `useAdvancedVoice` AudioContext for visualisation never connected to speech output (always returns zeros).
- No global `AssetManager` yet — each game still owns its own asset loading.

---

## Ralph Loop Strategy (open phases only)

1. ~~**P0 — Controls bug**~~ ✓ VERIFIED R57.
2. ~~**P2 cleanup batch**~~ ✓ RESOLVED R56.
3. **Playtest Verification**: Verify/close the items re-flagged in `rebuildingoldgames/bugs.md` (Metris bullet-time, Matrix Cloud combo, High Scores, Achievements, card sizing). Now unblocked by P0 fix.
4. **Phase 6 Playwright residue**: Docker baseline regen is the single highest-value item — unlocks CI parity for every future change.
5. **Phase 0a/0b**: Per-game asset deployment (skip CTRL-S until Phase 7). Rhythm Hacker is the most impactful — game needs real music tracks and note charts.
6. **Phase 1/2**: Global `AssetManager` — optional, each game handles its own assets adequately for now.
7. **Phase 6 polish**: Performance profiling, accessibility residue (focus traps, form labels, per-game keyboard-only playthroughs), BPM tuning, voice AudioContext cleanup.
8. **Phase 7**: CTRL-S World Phaser rewrite — only after the above are closed. Start from `rebuildingoldgames/plans/ctrl-s-rebuild.md`.
9. Use `/matrix-arcade-gamedev` for game code, `/phaser-gamedev` for Phaser scenes, `/playwright-testing` for E2E.
10. Run `game-tester` agent after every code change. After any UI change, run `npm run test:visual` and commit updated baselines (both darwin + linux variants when possible).
