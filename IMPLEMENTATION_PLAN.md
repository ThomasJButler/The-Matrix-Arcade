# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

> **Completed work (R1–R50) is archived in [`COMPLETED_WORK.md`](COMPLETED_WORK.md).**
> This live plan tracks only open / remaining work. Status snapshot, finished phases, and resolved bugs live in the archive.

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

> All P0 / P1 / P2 items are resolved (see archive). Remaining open work is P3 unless promoted.

---

## Open Work

### Phase 0a — Global Asset Extraction (residue)

- [ ] Background textures, sci-fi UI panels, additional icon packs (still in ZIPs)

### Phase 0b — Per-Game Asset Deployment (residue)

Sprites/audio not yet deployed. CTRL-S World is intentionally deprioritised here — its assets should be wired into the Phase 7 rewrite, not the existing DOM implementation.

- [ ] **CTRL-S World**: ~50 extractable items (character bases, portraits, backgrounds). **Defer until Phase 7 engine choice is final** to avoid wiring sprites into code about to be replaced.
- [ ] **Snake Classic**: bomb, walls, power-up icons
- [ ] **Vortex Pong**: power-up icons, goal explosion particles, audio SFX
- [ ] **Matrix Cloud**: background, 3 boss sprites (scratch), power-up icons
- [ ] **Matrix Invaders**: boss sprite, power-up icons, enemy death explosion
- [ ] **Metris**: UI panels (Hold/Next/Score), audio SFX, line-clear effects
- [ ] **Matrix Frogger**: frog death animation, Neo player sprite, power-up icons, WAV→MP3 audio integration
- [ ] **Neo Jump**: flying/shooting enemy types, background layers, audio SFX
- [ ] **Agent Chase**: agent death animation, audio SFX
- [ ] **Cloud Jumper**: collectible sprites, obstacle sprites, background layers
- [ ] **Code Breaker**: laser sprites, agent enemies, portal

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

Items the user re-flagged after the R50 playtest. Many overlap with earlier P1 fixes (R4–R5) but deserve a fresh eye on live code before closing:

- [ ] **Metris**: `B` bullet-time key — user reports it doesn't work. Was listed resolved in R4–R5; verify keybinding still wired in current `Metris/scenes/GameScene.ts`.
- [ ] **Matrix Cloud combo bug** — confirm combo only triggers on pillar-gap passage, not on any pillar contact. R4–R5 fix may not have covered the "sit still and combo up" case the user described.
- [ ] **High Scores panel** — user reports it's broken. Audit the shared portal modal (`LandingPage` / `App.tsx` high-score surface) end-to-end.
- [ ] **Achievements panel redesign** — user wants it reworked now that all 11 games share the Phaser foundation (consistent event surface makes a unified list feasible).
- [ ] **Game card portal sizing** — user wants bigger cards in the left/right carousel view (reference: `rebuildingoldgames/inspirationimages/gamecardlayout.png`). Builds on the R32/R33/R41 portal work.

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

| Game | Type | Unit Test | E2E Visual | E2E Gameplay |
|------|------|-----------|------------|--------------|
| CtrlSWorld | DOM | Yes | Yes | Yes |
| SnakeClassic | Phaser | Yes | Yes | Yes |
| VortexPong | Phaser | Yes | Yes | Yes |
| MatrixCloud | Phaser | Yes | Yes | Yes |
| MatrixInvaders | Phaser | Yes | Yes | Yes |
| Metris | Phaser | Yes | Yes | Yes |
| MatrixFrogger | Phaser | Yes | Yes | Yes |
| NeoJump | Phaser | Yes | Yes | Yes |
| AgentChase | Phaser | Yes | Yes | Yes |
| RhythmHacker | Phaser | Yes | Yes | Yes |
| CloudJumper | Phaser | Yes | Yes | Yes |
| CodeBreaker | Phaser | Yes | Yes | Yes |

All Phaser games expose test state via `exposeTestState()`. E2E fixtures support both React and Phaser games.

---

## Current Codebase Health

### Strengths
- Zero TODO/FIXME/HACK comments in src/
- Zero `@ts-ignore` in production code
- TypeScript strict mode fully enabled (noUnusedLocals, noUnusedParameters)
- All 11 Phaser games expose test state via `exposeTestState()`
- 12 games total, 100% achievement integration
- Clean separation of concerns: React wrapper + Phaser scenes via registry pattern
- Single source of truth: GAME_REGISTRY in `src/data/gameRegistry.ts`
- Code-split lazy loading for all game components
- No orphaned legacy code (cleaned up in R15)

### Open Gaps
- **CTRL-S World**: only DOM/React game; current implementation is buggy and complex enough to warrant the Phase 7 rewrite rather than incremental fixes.
- Remaining sprite/audio assets per game (see Phase 0b above).
- Rhythm Hacker BPM values are estimates — may need tuning per track after playtesting.
- `useAdvancedVoice` AudioContext for visualisation never connected to speech output (always returns zeros).
- No global `AssetManager` yet — each game still owns its own asset loading.

---

## Ralph Loop Strategy (open phases only)

1. **Playtest Verification**: Quick pass — verify/close the items re-flagged in `rebuildingoldgames/bugs.md` (Metris bullet-time, Matrix Cloud combo, High Scores, Achievements, card sizing). Cheapest wins first.
2. **Phase 6 Playwright residue**: Docker baseline regen is the single highest-value item — unlocks CI parity for every future change.
3. **Phase 0a/0b**: Per-game asset deployment (skip CTRL-S until Phase 7).
4. **Phase 1/2**: Global `AssetManager` — optional, each game handles its own assets adequately for now.
5. **Phase 6 polish**: Performance profiling, accessibility residue (focus traps, form labels, per-game keyboard-only playthroughs), BPM tuning, voice AudioContext cleanup.
6. **Phase 7**: CTRL-S World Phaser rewrite — only after the above are closed. Start from `rebuildingoldgames/plans/ctrl-s-rebuild.md`.
7. Use `/matrix-arcade-gamedev` for game code, `/phaser-gamedev` for Phaser scenes, `/playwright-testing` for E2E.
8. Run `game-tester` agent after every code change. After any UI change, run `npm run test:visual` and commit updated baselines (both darwin + linux variants when possible).
