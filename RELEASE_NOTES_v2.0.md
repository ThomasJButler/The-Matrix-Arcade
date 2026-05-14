# Release Notes — v2.0

**Range:** `v1.1-Domain-Switch` → `v2.0`
**Window:** 25 Jan 2026 → 14 May 2026 (~3.5 months)
**Scale:** 536 commits, 810 files changed (+92,221 / −30,510)

v2.0 is a top-to-bottom polish pass on the entire arcade. Twelve games went from "playable demos" to deliberate, balanced, audio-rich experiences, with a new landing page, persistent music, accessibility work, and a full E2E test suite underneath it all.

---

## New experiences

- **Landing page** — a proper front door listing every game and its arcade inspiration, with keyboard navigation, ARIA roles, and an "Arcade" nav button to return.
- **Rhythm Hacker** — new music/rhythm game with double notes, empty-hit penalties, varied lane patterns, a 120-second track-duration cap, and a green-titled win-flow banner.
- **Agent Chase** — Pac-Man-style maze game gained a proper level-advance state machine, "LEVEL CLEAR" banner, ghost-release fix on the middle-box dot thresholds, and exit-tile pathfinding override.
- **CTRL-S: The World** — text pacing reworked (28–38 ms/char + beat pauses), source-material alignment fixes, round-3 cinematic capture, full E2E playthrough coverage.
- **Removed Terminal Quest** — deleted from the arcade along with its save data, achievements, migration entries, and tests.

## Per-game polish (12 games)

- **Snake** — keyboard controls standardised, juice sweep pass.
- **Matrix Invaders** — fixed floating enemies via deltaTime cap + position clamps; virus split hitboxes fixed; timestamps reset on start/pause/restart.
- **Matrix Cloud** — font reset after boss text (was bleeding into player), missing font set before player fillText.
- **Matrix Frogger** — multi-level state persistence, difficulty-ramp tuning, level-up reset guards, NEO level gate.
- **Neo Jump** — tutorial strip, retry countdown, opening-beat spawn protection, fall-apex reset isolation, full difficulty-ramp rebalance.
- **Metris** — HOLD + NEXT preview panels now use matched constants.
- **Cloud Jumper** — single-jump gate (canJump armed on cloud contact, consumed on jump), ceiling clamp, drag-based braking, swapped death SFX from harrowing EMP blast to a soft cloudJumperDeath, removed brick-break SFX from disappearing-cloud traversal, freeze-hunt defences (collectible cleanup + generateContent cap + shutdown tween/timer kill), proper shutdown() cleanup.
- **Code Breaker** — P0 soft-lock + game-over + keyboard fixes, ball-speed rebound cap, L1 difficulty retier (two warm-up levels added), manual bullet-time with charge meter on B-key, power-up legend (menu panel + on-pickup overlay), 50 ms brick-SFX throttle, coverage refresh.
- **Vortex Pong** — keyboard OR-merge so both arrow keys + WASD register simultaneously.

## Audio & atmosphere

- **Persistent background music** across game exits (no more restart-on-re-enter).
- New soundtrack tracks woven into CTRL-S and Rhythm Hacker (Moonlight, Cyberpunkin, Resonance, Cyberpsychotic, ostcrunch2-epic, A Last Embrace).
- Procedural SFX cleanup + AttractMode pluck cue.
- Music persistence guards against empty `src` in `playBackgroundMP3`.

## How-to-play & onboarding

- **How to Play** controls + instructions added to all 11 game menus.
- Power-up legends, tutorial strips, retry-countdown overlays where appropriate.

## Accessibility & UX

- **a11y** — `aria-keyshortcuts` + `aria-roledescription` on wheel/dashbar, keyboard nav + ARIA on landing page game cards, tap-target audits.
- **Mute pill** — `disabled={!onToggleMute}` fallback so the toggle never silently no-ops.
- **NEW HIGH SCORE** — base-condition fix so the banner only shows when it's actually true (was always firing).

## Reliability & memory

- **Memory-leak prevention pass** — `shutdown()` cleanup added to MatrixFrogger, NeoJump, AgentChase, CloudJumper game scenes; pointer + keyboard listener teardown.
- **`useSaveSystem` singleton** so save state can't fork across instances.
- **Achievement system** — `all-games` threshold updated from a hardcoded `6` to `games.length` (12) so the achievement actually unlocks at completion.
- Hundreds of safety-net tripwires across the 12 games (state ordering, write-site isolation, deferred-callback integrity) to catch regressions early in CI.

## Infrastructure

- **Phaser 3 migration** continued across more games (scene-based architecture, BaseScene contracts, event-bus to React).
- **Full E2E test suite** — Playwright fixtures (`arcadePage`, `gameplayPage`), per-game playthrough specs (Agent Chase, Cloud Jumper, Code Breaker, CTRL-S round 3, Matrix Cloud, Matrix Frogger, edge cases), visual regression snapshots for landing + chrome, accessibility specs, performance budgets.
- **MATRIX_COLORS** centralised — ~50 hardcoded hex literals replaced with the design-token palette.
- **Visual-baseline regen** — 68 darwin baselines refreshed across all 12 games.
- **ESLint hygiene** — redundant `eslint-disable` directives removed where the underlying calls were already gated behind `import.meta.env.DEV`.

## Docs

- New `CLAUDE.md`, `IMPLEMENTATION_PLAN.md`, `COMPLETED_WORK.md`, `LEARNINGS.md`, `PLAYWRIGHT_BULKUP.md`, `AGENTS.md` to document the project's architecture, plan, and lessons learned.
- Asset spec catalogues per game under `desiredassets/`.

## Removed

- **Terminal Quest** — game, save data, achievement defs, migration array, test mocks/assertions, component files.
- Stale prototype directory `rebuildingoldgames/` deleted.

---

## Looking forward

The codebase is now in a state where:

- All 12 games are deliberately polished, not just functional.
- Audio is consistent and persistent.
- The E2E + visual harness will catch regressions in CI.
- Memory leaks have been hunted and shutdown contracts documented.

Next chapter is professional sprites + sound packs, then performance + CDN cost work.
