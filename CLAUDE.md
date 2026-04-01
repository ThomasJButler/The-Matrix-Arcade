# MAGIC DOC: [Claude.md - The Matrix Arcade]

React 18 + Phaser 3 browser arcade with Matrix-themed games, procedural audio, achievements, and PWA support.

## Commands
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — Vitest unit/integration tests
- `npm run test:e2e` — Playwright E2E tests
- `npm run test:visual` — visual regression tests
- `npm run test:visual:update` — update visual snapshots

## Architecture
- **Phaser games** (`src/components/games/phaser/`) — Phaser 3 scene-based games
- **React games** (`src/components/games/`) — React canvas-rendered games
- **Landing page**: `src/components/LandingPage.tsx` — grid of all games, opens game portal on click
- **Game portal**: carousel view in `src/App.tsx` with prev/next arrows and PLAY button
- **Phaser-React bridge**: `src/lib/phaser/PhaserGame.tsx` — passes props via Phaser Registry
- **Base scene**: `src/lib/phaser/scenes/BaseScene.ts` — all Phaser game scenes extend this
- **Event system**: scenes emit `GameEvent` objects to React (score, achievement, gameOver, pause, exit)
- **State**: Zustand store (`src/store/gameStore.ts`) for high scores/settings, React Context for CTRL-S World
- **Save system**: `src/hooks/useSaveSystem.ts` — unified persistence for all games
- **Audio**: procedural synthesis via Web Audio API (`src/hooks/useProceduralAudio.ts`, `src/hooks/useSoundSystem.ts`)

## Path alias
`@/*` maps to `./src/*`

## Testing notes
- Phaser is fully mocked in unit tests (jsdom can't do WebGL) — see `src/test/setup.ts`
- Tests use fork-based isolation to prevent localStorage bleed
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`

## E2E testing notes
- Playwright specs in `e2e/visual/` — fixture at `e2e/fixtures/arcade.fixture.ts`
- App starts on landing page grid; `navigateToGame()` clicks cards via `[role="button"][aria-label*="Play"]`
- Games list is in `src/App.tsx` (search `title: '`) — keep test specs in sync when adding/removing games
- Rhythm game-over tests need `test.setTimeout(60000)` for health drain
- Docker: `npm run test:e2e:docker` uses `Dockerfile.playwright` (Playwright version must match `package.json`)
