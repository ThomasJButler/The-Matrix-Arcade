# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

---

## Current Status

- **Status**: REBUILDING -- Phaser migration complete, asset pipeline bootstrapped, per-game sprite integration in progress, Metris tile sprite rendering rewrite complete, Rhythm Hacker music synced to beat charts + visual overhaul, game portal UX improved, landing page redesigned, Vortex Pong sprite integration complete, audio system upgraded with file-based SFX, background music integrated across all 11 Phaser games. R41: ASCII art titles for game portal carousel. R42: Full-screen Matrix rain canvas background, AudioSettings timer cleanup, dead CSS removal.
- **Last Updated**: 13 April 2026 (R42 -- full-screen Matrix rain canvas)
- **Version**: v2.0.0 (next target)
- **Games**: 12 playable (11 Phaser, 1 DOM)
- **Build**: PASSES (code-split, main bundle ~386KB, Phaser vendor chunk 1,479KB) -- zero warnings
- **Unit Tests**: 2,109 passing across 48 files, 0 failures
- **E2E Tests**: 88 gameplay + 110 visual = 198 tests across 28 spec files -- last run PASSED (new screeenshots in TheMatrixArcade-/e2e, user manually ran the playwright test. 
- **Asset Pipeline**: Phase 0a COMPLETE -- `public/assets/` deployed with fonts, audio, UI chrome, particles, icons (117 files, ~40MB)

### Completed Work Summary

All P0/P1/P2 bugs resolved across R1-R14 (12 April 2026). Key milestones:

- **Phaser migration** (R9-R14): All 6 React/Canvas games rebuilt as Phaser 3 games (Vortex Pong, Snake Classic, Matrix Cloud, Matrix Invaders, Metris, Code Breaker). Each has full scene architecture, procedural textures, comprehensive unit tests (63-134 tests each), and achievement integration.
- **New game** (R14): Code Breaker -- Breakout/Arkanoid inspired, 10 levels, 6 power-ups, boss battles, Agent Smith enemies, 10 achievements.
- **Existing Phaser fixes** (R3-R8): All 5 original Phaser games fixed -- controls, physics, AI, visuals. Matrix Frogger received 7 gameplay enhancements (countdown, levels, Kung Fu, NEO mode, road markings, chasing agents, lane visuals). Rhythm Hacker overhauled (new key bindings, layout, note sprites, Matrix palette). Cloud Jumper palette and dimensions fixed.
- **Infrastructure** (R1-R5): Code-splitting (2.18MB → 370KB), Phaser vendor chunk, shared game registry, error boundaries, E2E framework (188 tests).
- **R15 cleanup**: Removed 9 orphaned legacy React game files, 4 unused hooks, 1 dead Zustand store, and 13 associated test files (11,386 lines of dead production code + ~5,000 lines of dead tests). Updated sound system comments from legacy game names. Test count: 2,521 → 2,019 (502 tests were testing only dead code).
- **R16 Agent Chase map layouts**: Three distinct maze layouts (Classic, Arena, Labyrinth) cycle each level. Shared ghost house section (rows 9-19) keeps agent AI consistent. Difficulty scaling: agent speed increases 5% per level, frightened duration decreases 500ms per level (min 3s). New ALL_MAZES achievement for playing all three layouts. 20 new unit tests (96 total for Agent Chase).
- **R17 Focus overlay fix + CTRL-S World E2E**: Fixed "floating dark rectangle" bug caused by PhaserGame.tsx click-to-play overlay rendering before auto-focus resolved — overlay now deferred until container has had focus at least once. Added 10 gameplay E2E tests for CTRL-S World covering command prompt entry, chapter navigation, story advancement, pause/resume, keyboard shortcuts, and full lifecycle.
- **R19 Code Breaker brick sprite integration**: First per-game asset integration. Copied 4 brick sprites (code, agent, sentinel, unbreakable) from BBreaker asset pack to `public/assets/code-breaker/`. Updated BootScene to load sprites in preload with procedural texture fallbacks. Changed GameScene brick rendering from `Phaser.GameObjects.Rectangle` to `Phaser.GameObjects.Image` with `setDisplaySize()`. Fixed circular dependency TDZ crash in both BootScene and GameScene by removing module-level `const C = GAME_CONFIG` aliases (deferred to runtime access). All 127 unit tests pass.
- **R20 Matrix Frogger vehicle sprite integration**: Second per-game asset integration. Copied 5 vehicle sprites (car1, car2, car3, truck, tractor) plus 2 flower ground tiles and frog sprites from frogger INSPO pack to `public/assets/matrix-frogger/`. Updated BootScene to load vehicle sprites with procedural rectangle fallbacks. Changed GameScene road lane rendering: bottom lanes (rows 5-7) now spawn pixel art vehicle sprites instead of Matrix agent textures, creating a gameplay progression from traffic to Matrix agents. Vehicles are 16x16 pixel art scaled 3x with pixelArt mode. Upper lanes (rows 1-3) retain agent/sentinel sprites. All 70 unit tests pass, 2,039 total.
- **R21 Agent Chase roguelike sprite integration**: Third per-game asset integration. Extracted 7 sprites from 32rogues pixel art pack (rogues.png, monsters.png, tiles.png) using sips: player (rogue), 4 agents (death knight, reaper, lich, zombie), frightened state (small slime), wall tile (stone brick). Deployed to `public/assets/agent-chase/`. Updated BootScene with `loadCommonAssets()` override, `resizeLoadedSprite()` canvas-based downscaling to match game dimensions (32→18/20px), and `textures.exists()` fallback checks. Updated GameScene `updatePlayerRotation()` to use flipX in sprite mode vs angle rotation for procedural Pac-Man. All 96 unit tests pass, 2,039 total.
- **R22 Rhythm Hacker music integration**: Installed ffmpeg via Homebrew (unblocking WAV→MP3 conversion). Converted 5 music tracks from WAV to MP3 at 192kbps with loudnorm normalisation: In The Moonlight (easy, 120s), Cyberpunkin' (normal, 150s), Cyberpsychotic (hard, 150s), Enhancements (insane, 200s), Resonance (insane, 180s). Deployed to `public/assets/rhythm-hacker/tracks/`. Also converted 3 additional global music tracks (cruise-control, a-last-embrace, ostcrunch2-epic) to `public/assets/audio/music/`. Updated config.ts with real track names, BPMs, durations, and audioUrl paths. Integrated HTML5 Audio playback into GameScene: music starts after countdown, pauses/resumes with game, stops on game over/track complete, respects mute state. Added togglePause override for audio sync. 8 new unit tests (58 total for Rhythm Hacker). All 2,047 tests pass. Build clean.
- **R18 Global asset extraction + font integration**: Bootstrapped `public/assets/` from zero. Extracted 3 font families from ZIP archives (MatrixType 4 variants WOFF2+TTF, AlphaProta 2 variants WOFF2+TTF, 5 NotJam pixel fonts). Deployed 4 music tracks (MP3), 20 Matrix Trilogy SFX (WAV), hologram UI chrome (4 buttons, 5 card panels, 15 icons), 25 Matrix node icons (green+purple, PNG+WEBP+GIF), 21 firework particle frames (3 colours × 7 frames). Added `@font-face` declarations for all custom fonts with WOFF2→TTF fallback chain. Created 5 new CSS variables (`--matrix-font-title`, `--matrix-font-matrix`, `--matrix-font-cyber`, `--matrix-font-pixel`, `--matrix-font-hud`). Applied MatrixType Display to arcade title in App.tsx and LandingPage.tsx. Updated global ASSETS_NEEDED.md with deployment status. Total: 117 files, ~40MB. Blocker: WAV music tracks (7 files, ~280MB total) need ffmpeg for OGG/MP3 conversion.
- **R23 Matrix Cloud bird sprite integration**: Extracted green bird sprite (4 frames, 16×16 pixel art) from Flappy Bird Assets pack, plus green pipe and pipe-cap sprites. Deployed to `public/assets/matrix-cloud/`. Updated BootScene with `loadCommonAssets()` override to load bird spritesheet, creates `bird_flap` animation (4 frames at 10fps), sets `spriteMode` registry flag. GameScene `createPlayer()` uses animated bird sprite with `setDisplaySize()` scaling when available, procedural fallback when not. `updatePlayerTexture()` uses tint-based state changes (red=damaged, magenta=shield) in sprite mode vs texture-swap in fallback mode. 4 new unit tests (85 total for Matrix Cloud). All 2,051 tests pass.
- **R24 Code Breaker paddle, ball, and power-up sprite integration**: Deployed 10 new sprites to `public/assets/code-breaker/`: paddle (BBreaker Player.png, 74×26), paddle_wide (breakout_pixel_art, 96×8), ball (BBreaker Ball_small-blue.png, 13×12), and 6 hologram power-up icons (multiBall=nodes, widePaddle=bars, laser=crosshair, bulletTime=circular, firewall=shield, emp=lightning). Updated BootScene with `textures.exists()` guards so loaded sprites take priority over procedural fallbacks. Changed GameScene ball rendering from `add.circle()` to `add.image()` with `setDisplaySize()` scaling. Added `setDisplaySize()` to paddle creation and texture switching for consistent sizing across sprite/procedural modes. All 127 unit tests pass, 2,053 total.
- **R25 Snake Classic tail sprite + Cloud Jumper player character sprite integration**: Snake Classic: deployed tail sprite (snake_green_blob_32.png, 32×32) to `public/assets/snake/tail.png`. Added `snake_sprite_tail` to BootScene SPRITE_ASSETS. Modified GameScene `updateSnakeSprites()` to render tail sprite in both sprite mode and fallback mode (previously tail only rendered in fallback). Cloud Jumper: extracted 3 CyberPunk character frames (idle, jump/run, slide/fall, 24×24 pixel art) from MatrixArcadeCyberPunkAssets ZIP pack. Deployed to `public/assets/cloud-jumper/` as player-idle.png, player-jump.png, player-fall.png. Added PLAYER_SPRITES loading to BootScene with `playerSpriteMode` registry flag. GameScene uses sprite textures with `setDisplaySize(32,32)` scaling when available: idle pose on cloud landing, jump pose on jump, fall pose when falling (velocity > 100), procedural glitch death texture retained. Fixed test helper `collectPrototypeMethods()` to use `Object.getOwnPropertyDescriptor` instead of `typeof proto[key]` to avoid triggering getters during prototype method collection. All 2,053 tests pass.
- **R26 Matrix Invaders bullet sprite integration**: Deployed 2 glow sprites from Lasers Bullets pack to `public/assets/matrix-invaders/`: bullet_player.png (green teardrop glow, sprite 10) and bullet_enemy.png (magenta teardrop glow, sprite 03). Added `sprite_bullet_player` and `sprite_bullet_enemy` to BootScene SPRITE_ASSETS with `textures.exists()` guard so procedural bullet textures are only created when sprites are unavailable. Changed BulletState interface from `Phaser.GameObjects.Rectangle` to `Phaser.GameObjects.Image`. Refactored GameScene bullet creation from `add.rectangle()` to `add.image()` with `setDisplaySize()` scaling across three methods: `handleShooting()` (player bullets 8×20 in sprite mode), `handleEnemyShooting()` (enemy bullets 6×14), and `updateBoss()` (boss bullets 8×18). Updated enemy bullet collision detection to use config constants instead of sprite dimensions. Updated test mock for `add.image` to support `setDisplaySize`, `setDepth`, and position tracking. All 2,053 tests pass.
- **R27 Frog sprite + Snake Classic visual improvements**: Matrix Frogger: integrated 5 previously unused sprites from `public/assets/matrix-frogger/`. Replaced robot player (TopView_Robot_Asset_Pack) with pixel art frog sprites (frog_idle.png, frog_hop.png, 16×16 scaled to 64×64 via `setDisplaySize`). Added `frogSpriteMode` registry flag with robot fallback. Frog rotates to face movement direction (0/90/180/270° angles). Added flower ground tiles (flower_ground_1/2.png) as Matrix-green-tinted safe zone decoration at 25% alpha. Added animated fly sprite on finish line as visual target (oscillating tween). All texture swaps use `setTexture()` pattern (not animations) since sprites are individual images. Snake Classic: activated previously loaded but unused `snake_sprite_dead` texture — head switches to dead sprite with red tint on game over. Added `setSegmentAngle()` method for body/tail directional rotation based on adjacent segment positions — body and tail segments now rotate to follow the snake's path instead of fixed angle 0. All 2,053 tests pass.
- **R28 Agent Chase fruit collectible sprite integration**: Extracted 6 pixel art fruit sprites from PacManAssets-Items.png spritesheet (128×32, 8 frames) using PIL bounding-box cropping: cherry (11×25), strawberry (12×12), orange (10×27), apple/melon (13×15), grape/galaxian (16×14), banana/key (12×13). Deployed to `public/assets/agent-chase/` as fruit_cherry.png through fruit_banana.png. Added 6 fruit entries to BootScene SPRITE_ASSETS array for preloading. Added fruit resize targets (20×20) to `resizeSpritesToGameSize()` using existing `resizeLoadedSprite()` canvas-scaling method. Added per-fruit `textures.exists()` guard in `createFruitTextures()` so procedural circle-with-leaf fallbacks are only generated when sprites are unavailable. No GameScene changes required — fruit texture keys unchanged, physics body sizing preserved at 20×20. All 2,053 tests pass.
- **R29 Neo Jump player, platform, and enemy sprite integration**: Deployed 11 sprites to `public/assets/neo-jump/`: 5 CyberPunk character sprites (idle, jump, fall, shoot, death, 24×24 pixel art — same pack as Cloud Jumper) and 5 Doodle RPG platform sprites (Log1 for normal 200×100, PushBlock for moving 100×100, Pedestal for spring 100×100, Barrel for disappearing 100×100, Crate for breakable 100×100) plus Bomba enemy sprite (71×79). Rewrote BootScene: removed broken Legacy Fantasy spritesheet loading (paths never existed), replaced with `loadCommonAssets()` override loading 11 individual images with `textures.exists()` guards and registry flags (`playerSpriteMode`, `platformSpriteMode`, `enemySpriteMode`). Updated GameScene: added `updatePlayerTexture()` method for sprite-mode texture swapping (idle/jump/fall/shoot/death) vs animation-mode fallback; platforms use `setDisplaySize(80, 16)` with per-type tinting in sprite mode; enemies use `setDisplaySize(40, 40)` with red tint; shoot action briefly shows shoot texture before reverting. All 2,053 tests pass.
- **R30 Replace SVG placeholder thumbnails with real gameplay screenshots**: Captured gameplay screenshots for all 6 Phaser games that previously used identical SVG data URI placeholders (Matrix Frogger, Neo Jump, Agent Chase, Rhythm Hacker, Cloud Jumper, Code Breaker). Used Playwright to navigate into each game, start gameplay, and screenshot the viewport with 2× device scale. Saved as PNG to `src/images/`. Updated `gameRegistry.ts` to import the PNG screenshots directly instead of calling `makePhaserPreview()` SVG generator. Removed `src/lib/gamePreviewImages.ts` (no longer imported). Landing page grid now shows distinct, recognisable gameplay imagery for every game. All 2,053 tests pass.
- **R31 Neo Jump collectibles, jetpack flame, shield mechanic, and score display**: Added collectible pickup system with 3 types: fuel canister (restores 50 jetpack fuel), score bonus (+500 points), and shield (5-second invincibility absorbing one enemy hit). Deployed 4 new sprites from Doodle RPG pack to `public/assets/neo-jump/`: collectible-fuel.png (Loot_0, 49×50), collectible-score.png (Loot_1, 49×50), collectible-shield.png (Heart, 49×50), and jetpack-flame.png (Particle1_0, 50×53). Collectibles spawn above platforms with 25% chance above altitude 200, never on breakable platforms. Added jetpack flame visual (flickering image that follows player when jetpack active). Added live score display to HUD alongside altitude. Added shield glow effect (magenta circle around player, flashes when expiring). Shield absorbs enemy contact and destroys the enemy. Added 2 new achievements: COLLECT_SHIELD and COLLECT_10. BootScene loads sprites with `textures.exists()` guards and procedural fallback textures. 18 new unit tests (73 total for Neo Jump). All 2,069 tests pass.

- **R32 Game portal Instructions and High Scores buttons**: Added two new UI modal components (`GameInstructions`, `GameHighScores`) to the game portal carousel, matching the `gamecardlayout.png` reference design. Instructions modal displays game description, controls (game-specific + universal keys grid), and inspiration info. High Scores modal shows high score with trophy display, play statistics grid (games played, total score, best combo, longest survival, bosses defeated, last played), per-game achievement progress bar, and individual achievement unlock/lock status. Added keyboard shortcuts I (instructions) and H (high scores) alongside existing A/V shortcuts. Updated keyboard hints bar to show all shortcuts. Modals auto-close on game navigation or play start. ESC closes open modals. All 2,067 tests pass.

- **R33 Landing page UX redesign**: Overhauled landing page grid layout for better visual hierarchy. Enlarged preview images (h-36→h-44) so gameplay screenshots are the focal point. Added play icon overlay with hover scale-up animation. Moved category badge onto image with backdrop blur. Removed per-card controls section (duplicated global controls) and collapsed inspiration to a single subtle line — cards are now scannable at a glance. Replaced full-width global controls panel with a collapsible strip behind a keyboard icon in the header. Merged hero section and category filter into a single compact row. Added xl:grid-cols-4 breakpoint for wider screens. Widened content from max-w-6xl to max-w-7xl. Removed dead `generateGamePlaceholder` SVG function (all games have real previews since R30). Net: 120 insertions, 241 deletions. All 2,067 tests pass.

- **R36 Metris tile sprite integration and rendering rewrite**: Deployed 7 beveled tile sprites (32×32, one per tetromino type: I=cyan, O=yellow, T=purple, S=green, Z=red, J=blue, L=orange) to `public/assets/metris/`. Rewrote BootScene with `loadCommonAssets()` override to load sprite PNGs and `generateFallbackTiles()` for procedural beveled textures when sprites are unavailable. Refactored GameScene rendering architecture from single `Phaser.GameObjects.Graphics` with `fillRect()` calls to a layered Image-pool approach: 200 pre-positioned `Phaser.GameObjects.Image` objects for the 10×20 grid (depth 2), 4 ghost piece Images (depth 1, alpha 0.25), 4 active piece Images (depth 3), background on `gridGraphics` (depth 0), and glow/grid-lines/border/particles on new `overlayGraphics` (depth 10). Each frame, cell Images update texture key and visibility; ghost/active Images also update position. Preview panels (HOLD/NEXT) remain Graphics-based. Updated test mock infrastructure: added `createMockImage()` helper, upgraded `add.image` mock from shared `mockReturnValue` to per-call `mockImplementation`, pre-populated `cellImages`/`ghostImages`/`activeImages` arrays in `beforeEach`. Metris was previously the only Phaser game with zero sprite assets — now has full tile textures. All 2,088 tests pass.

- **R40 Rhythm Hacker visual overhaul**: Replaced all circle-based note textures with diamond/gem shapes (layered glow halo, filled diamond body, white specular core) for a proper rhythm-game aesthetic. Upgraded lane backgrounds with horizontal grid lines for highway feel and brighter edge accents. Enhanced hit line from 8px to 14px with multi-layered glow (soft fringe, medium band, bright core, white specular centre). Added lane divider texture between lanes for visual separation. Replaced basic effect particles with star-burst (perfect) and diamond (other grades) shapes. Added four GameScene visual effects: (1) scrolling grid overlay — horizontal lines moving downward at 30fps creating highway motion, (2) note approach scaling — notes grow 15% larger as they near the hit line for depth, (3) combo glow — ambient glow behind hit line that intensifies with combo (green→cyan at 50+), (4) beat-reactive hit line — hit line scales vertically and brightens on each beat. Hold note tails changed from ring-with-dot to matching diamond shape. All 2,088 tests pass.

- **R41 ASCII art titles for game portal carousel**: Created `src/lib/asciiArt.ts` with a 5-row block pixel font (A-Z, 0-9, symbols) using █ characters, variable-width glyphs (3-5 columns per character). Font renderer composes characters with 1-space gaps and centres multi-line titles. Pre-computed `GAME_TITLES` map for all 12 games with two-line layout (word per line, centred). Replaced icon + plain text `<h2>` in App.tsx carousel with `<pre>` element rendering block-letter ASCII art titles, styled with green glow (`text-shadow`), responsive font sizing (`text-[7px] lg:text-[9px] xl:text-[10px]`), and `sr-only` h2 for accessibility. Each game now has a dramatic Matrix-terminal-style title banner in the portal carousel. 9 new unit tests (2,097 total). All tests pass.

- **R42 Full-screen Matrix rain canvas background**: Created `MatrixRainCanvas` component (`src/components/ui/MatrixRainCanvas.tsx`) — a single full-screen Canvas 2D element at 30fps replacing three scattered implementations: header/footer canvas strips (inline useEffect in App.tsx), CSS keyframe rain divs in the game portal carousel, and unused `.matrix-rain-bg` CSS class. The new canvas renders behind the entire app as a fixed-position element with bright leading characters (#aaffaa) and standard green trails (#00ff00), Katakana + digit glyphs, responsive resize handling, and proper cleanup on unmount. Chose Canvas 2D over Three.js to avoid adding ~600KB bundle dependency for a 2D effect. Also fixed AudioSettings setTimeout leak (3 timers firing after component unmount) by adding useRef-based timer tracking with useEffect cleanup. Removed dead `.matrix-rain-bg` CSS class and keyframe from theme.css. Removed `headerRef`/`footerRef` refs from App.tsx. Net: 26 insertions, 136 deletions. 12 new unit tests (2,109 total). All tests pass, zero unhandled errors.

- **R39 Playtest bug fixes**: Fixed all 5 bugs identified in PLAYTEST_REPORT_2026-04-13.md. **B1 TDZ crashes** (4 games): Vortex Pong, Matrix Cloud, Matrix Invaders — removed module-level `const C = GAME_CONFIG` aliases that triggered Temporal Dead Zone errors due to circular config↔scene imports; replaced with direct `GAME_CONFIG.` access in methods. Rhythm Hacker — made `TRACK_CHARTS` lazy via `getTrackCharts()` singleton function since charts.ts evaluated `GAME_CONFIG.TRACKS.map(...)` at module top level. **B2 Agent Chase lives underflow**: Added `Math.max(0, lives - 1)` floor guard, invulnerability check in `playerDeath()`, and 2-second post-death invulnerability with blinking visual feedback to prevent spawn-camping. **Q2 P-pause on GameOver**: Added `allowPause` flag to BaseScene (default true), overridden to `false` in GameOverScene and MenuScene. **Q1 Matrix Frogger asset errors**: Removed 4 references to non-existent TopView_Robot_Asset_Pack sprites; added procedural enemy_agent and enemy_sentinel fallback textures. **Q3 Achievement toast setState-in-render**: Replaced nested `setQueue` call inside `setProgress` updater with separate `dismissed` state + `useEffect` to defer parent state update; replaced `displayedIds` state with `useRef` to avoid render-phase cross-component updates. All 2,088 tests pass.

- **R38 Background music for all Phaser games**: Wired looping background music into all 11 Phaser games using the 7 pre-deployed Matrix Trilogy music tracks from `public/assets/audio/music/`. Track assignments: VortexPong→stage-theme, SnakeClassic→cruise-control, MatrixCloud→a-last-embrace, MatrixInvaders→ostcrunch2-epic, Metris→brothers-and-sisters, AgentChase→boss-theme, NeoJump→menu-theme, CloudJumper→a-last-embrace, CodeBreaker→ostcrunch2-epic (MatrixFrogger and RhythmHacker already had game-specific music). Added `this.stopBackgroundMusic()` to every game's `shutdown()` for clean scene-exit audio teardown, and to BaseScene's `gameOver()` for universal game-over cleanup. Added defensive `?.` on registry access in `stopBackgroundMusic()` to prevent test-environment crashes when scenes are partially mocked. All 2,088 tests pass.

- **R37 Audio system upgrade and Matrix Frogger audio integration**: Enhanced useSoundSystem with AudioBuffer-based file playback — pre-recorded Matrix Trilogy SFX (MP3) now take priority over procedural synthesis, with lazy preloading and automatic fallback. Converted 20 global SFX from WAV to MP3 (14MB → 1MB) and mapped all 16 shared sound keys to their corresponding audio files. Converted 6 Matrix Frogger audio files (5 SFX + soundtrack) from WAV to MP3 and deployed to `public/assets/matrix-frogger/audio/`. Added 5 game-specific sound keys (froggerDeath, froggerMove, froggerScore, froggerPickup, froggerExtraScore) with synthesis fallbacks. Extended PhaserGame.tsx registry bridge with playBgMusic/stopBgMusic methods, added playBackgroundMusic/stopBackgroundMusic to BaseScene. Matrix Frogger now has distinct hop, death, pickup, score, and level-complete audio plus looping background music. All 2,088 tests pass.

- **R35 Rhythm Hacker beat-locked chart sync and control fix**: Replaced random-jitter procedural note spawning with deterministic, musically-structured beat charts. Created `charts.ts` with seeded PRNG chart generator that divides each track into musical sections (intro/verse/chorus/bridge/outro) with per-section lane patterns and difficulty-scaled note density. Notes now land on exact beat subdivisions — no random timing jitter. Added audio-time sync via `getTrackTime()` method that uses `trackAudio.currentTime` as authoritative time source (preventing drift between game clock and music). Chart-driven `spawnNotes()` pre-spawns notes based on travel time so they arrive at the hit line in sync with the beat. Fixed critical P-key conflict: changed lane keys from Q/W/O/P to D/F/J/K (industry-standard rhythm game layout) since P was shared with the universal pause key, making the game unplayable. Updated MenuScene help text, config, and gameRegistry controls description. Procedural fallback preserved for any tracks without chart data. 14 new chart unit tests, 7 new GameScene integration tests (79 total for Rhythm Hacker). All 2,088 tests pass.

- **R34 Vortex Pong paddle, ball, and board sprite integration**: Deployed 10 sprites to `public/assets/vortex-pong/`: paddle_player.png (17×120), paddle_ai.png (17×120), ball.png (30×30), ball_motion.png (46×46), board.png (802×455), and fireball_1 through fireball_5 (64×32 each). All sprites sourced from Simple Ping Pong 2D Game Assets pack and fireball frames, recoloured to Matrix green palette via Python PIL (grayscale luminance mapped to green channel). Refactored GameScene paddles from `Phaser.GameObjects.Rectangle` to `Phaser.GameObjects.Image` with `setDisplaySize()` scaling — the existing procedural paddle textures (`paddle_player`, `paddle_ai`) were already generated in BootScene but never used. Updated `resizePlayerPaddle()` from `setSize()` to `setDisplaySize()`. Widened `clampPaddle()` and `ballHitsPaddle()` type signatures from `Phaser.GameObjects.Rectangle` to structural types. Added `loadCommonAssets()` override with `textures.exists()` guards so loaded sprites take priority over procedural fallbacks. Switched BootScene from `this.add.graphics()` to `this.make.graphics()` for off-screen texture baking. Updated test mock paddles from `setSize` to `setDisplaySize` and added `add.image` mock. All 2,067 tests pass.

Full details in git history (`git log --oneline`).

---

## Priority Legend

- **P0**: Critical/blocking -- games unplayable, users cannot interact
- **P1**: High -- bugs that degrade experience, failing tests
- **P2**: Medium -- infrastructure, UX improvements, research
- **P3**: Low -- rebuilds, new features, polish

---

## P0 -- All Resolved ✅

All P0 items fixed in R3 (Phaser controls, Cloud Jumper jump physics, Neo Jump jetpack, Agent Chase AI).

## P1 -- All Resolved ✅

All 12 P1 items fixed in R4-R5 (Metris bullet time, Matrix Cloud combo, CTRL-S save crash, SimpleSnake achievements, mute divergence, App.tsx coupling, Rhythm Hacker countdown, double gameOver sound, GameOverScene keyboard UX, useInterval OOM, build chunk warning, unit test failures).

---

## P2 -- Medium Priority: Remaining Items

### 2.1 Rhythm Hacker Improvements

**File**: `src/components/games/phaser/RhythmHacker/scenes/GameScene.ts`
- [x] Music tracks integrated (5 tracks with HTML5 Audio playback, BPM-synced procedural notes)
- [x] Sync gameplay to backing music track — beat-locked chart system with audio-time sync (R35). Lane keys changed from Q/W/O/P to D/F/J/K to fix P-key pause conflict.
- [x] Improve visuals and animations — R40: diamond note gems, highway grid, multi-layer hit line, lane dividers, star-burst effects, scrolling grid overlay, note approach scaling, combo glow, beat-reactive hit line

### 2.3 Visual & UX Observations from Screenshots

**Shared issues across Phaser games**:
- [x] **Identical menu thumbnails**: Fixed in R30 — all 6 Phaser games now have distinct gameplay screenshots replacing SVG placeholders.
- **All games use 100% procedural textures** -- no external sprite assets loaded. Every visual element is generated in BootScene at runtime. (Note: 9 of 12 games now have sprite assets integrated as of R29.)
- **Game-over screens**: Generic across all games (shared GameOverScene with no game-specific context beyond the `reason` string).

### 2.5 Matrix Frogger Visual Issues ✅

- [x] Fix unrendered floating UI box -- root cause: PhaserGame.tsx click-to-play overlay (`rgba(0,0,0,0.5)`) rendered before auto-focus resolved. Fixed in R17 by deferring overlay until container has had focus at least once.

### 2.7 Playtest Report Fixes (13 April 2026) ✅

All bugs from PLAYTEST_REPORT_2026-04-13.md resolved in R39:
- [x] **B1**: TDZ crashes in Vortex Pong, Matrix Cloud, Matrix Invaders, Rhythm Hacker — deferred GAME_CONFIG access to runtime
- [x] **B2**: Agent Chase lives underflow to -2 — floor guard + respawn invulnerability
- [x] **Q2**: P-pause stacking on GameOver scene — allowPause flag in BaseScene
- [x] **Q1**: Matrix Frogger 4 asset load errors — removed missing sprite references, added procedural fallbacks
- [x] **Q3**: Achievement toast setState-in-render — separated state updates to avoid cross-component render-phase mutation

### 2.6 Codebase Cleanup

- [x] **Remove orphaned legacy React games** (done R15 -- AgentEscape, CrossyRoad, JimmyMatrix, MatrixAscension + old React versions of 5 Phaser games)
- [x] **Remove unused hooks** (done R15 -- useProceduralAudio, useViewportCulling, useInterval, useSimpleSnakeGame)
- [x] **Remove dead Zustand store** (done R15 -- src/store/gameStore.ts)
- [x] **Add CTRL-S World gameplay E2E**: 10 tests covering command prompt, chapter hub, story advance, pause/resume, keyboard shortcuts, restart, ESC navigation, and full lifecycle (done R17).

---

## Phase 0: Asset Pipeline (pre-requisite for polished visuals)

The `desiredassets/` folder contains a complete asset inventory with source mappings. The unsorted dump (`desiredassets/TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/`, ~4,900 files, ~750MB) has been catalogued and cross-referenced against every game's `ASSETS_NEEDED.md`. Currently **zero game assets are deployed** -- `public/assets/` doesn't exist. All games use procedural textures from BootScene.

**Asset Inventory Summary** (across all 13 ASSETS_NEEDED.md files):

| Game / Scope | [x] Have | [~] Sourced | [ ] Need | Total | Notes |
|---|---|---|---|---|---|
| global | 2 | 22 | 1 | 25 | Fonts + UI chrome + shared SFX |
| snake | 7 | 14 | 14 | 35 | Power-up icons + bosses need creating |
| vortex-pong | 8 | 14 | 6 | 28 | Close to ready with good [x] base |
| matrix-cloud | 8 | 16 | 11 | 35 | 3 boss sprites need creating from scratch |
| matrix-invaders | 14 | 18 | 11 | 43 | Strong foundation, boss + effects need work |
| metris | 3 | 17 | 17 | 37 | Largest scratch gap (all VFX + grid/playfield) |
| ctrl-s-world | 1 | ~53 | 0 | ~54 | 100% extractable, zero scratch |
| matrix-frogger | 9 | 17 | 4 | 30 | Most complete asset set (sprites + audio WAVs) |
| neo-jump | 2 | ~31 | 0 | ~33 | 100% extractable, Doodle RPG pack (406 sprites) |
| agent-chase | 7 | 20 | 8 | 35 | Player sprite is entirely [ ] (no source) |
| rhythm-hacker | 4 | 15 | 17+5 | ~41 | 5 note chart data files are critical blocker |
| cloud-jumper | 3 | 23 | 7 | 33 | Cloudy Pack (190+ files) covers most cloud needs |
| code-breaker | 14 | 41 | 5 | 60 | Strongest [x] base, almost pipeline-ready |
| **TOTALS** | **~82** | **~301** | **~106** | **~489** | 62% sourced, 21% scratch, 17% ready |

**Pipeline-ready games** (zero scratch items): ctrl-s-world (~53 extractable), neo-jump (~31 extractable).
**Critical blockers**: Rhythm Hacker note charts (5 JSON files). Agent Chase player sprite (no source). Matrix Cloud bosses (3 need creating from scratch).
**Strongest foundations**: Code Breaker (14 [x], 41 [~]), Matrix Invaders (14 [x], 18 [~]), Matrix Frogger (9 [x] + complete WAV audio set).

### 0a. Global Asset Extraction ✅ COMPLETE (R18)

- [x] Unzip `MatrixArcadeFontAssets/` (3 ZIPs) -- MatrixType (4 WOFF2 + 4 TTF), AlphaProta (2 WOFF2 + 2 TTF), PixelFont (bitmap PNGs only, no TTF)
- [x] Unzip `WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip` -- 20 game-relevant SFX selected, renamed to `sfx_*.wav` convention
- [x] Copy MP3 music tracks: menu-theme, stage-theme, boss-theme, brothers-and-sisters
- [x] Extract `1. Free Hologram Interface Wenrexa/` -- 4 button states, 5 card/panel variants, 15 icons
- [x] Pick 4 best font families from `NotJamFontPack/` -- Sci Mono, Mono Clean, UI, Pixel 5, Chunky Sans
- [x] Copy `firework/` particles -- 3 colours × 7 frames = 21 PNGs
- [x] Copy `Matrix-Icons/` (already extracted) -- 5 green + 5 purple node icons in PNG/WEBP/GIF
- [x] WAV music tracks converted to MP3 via ffmpeg (installed via Homebrew in R22). 5 rhythm tracks + 3 global tracks deployed.
- [ ] ⚠️ **REMAINING**: Background textures, sci-fi UI panels, additional icon packs (still in ZIPs)

### 0b. Per-Game Asset Extraction (parallel with game fixes)

Each game's `desiredassets/[game]/ASSETS_NEEDED.md` has a Source Mapping section. Work through `[~]` items:

- [x] **Rhythm Hacker** music tracks: 5 WAV→MP3 conversions deployed, audio playback integrated into GameScene. Note: all 16 shared SFX keys are now mapped to pre-recorded Matrix Trilogy MP3 files via the upgraded useSoundSystem (R37) — all games including Rhythm Hacker benefit from file-based SFX with automatic procedural fallback. Remaining: hand-crafted note charts for per-beat sync (currently BPM-based procedural), visual sprite upgrades.
- [ ] **CTRL-S | The World**: Extract character bases from Mana Seed + Kings and Pigs, create portraits, backgrounds from CyberPunk/scifi packs. ~50 `[~]` items.
- [x] **Snake Classic**: Head, body, apple, dead, and tail sprites (32px) deployed with display-size scaling. Remaining: bomb sprite, wall sprites, power-up icons.
- [x] **Vortex Pong**: Paddle sprites (player + AI, 17×120), ball (30×30), ball motion trail (46×46), board background (802×455), and fireball frames (5 × 64×32) deployed. All recoloured to Matrix green via PIL. Paddles refactored from Rectangle to Image with setDisplaySize() scaling. Remaining: power-up icons, goal explosion particles, audio SFX.
- [x] **Matrix Cloud** bird sprite: Green bird (4 frames) from Flappy Bird Assets pack deployed with animation. Pipe sprites integrated as tiling textures. Remaining: background, 3 boss sprites (scratch), power-up icons.
- [x] **Matrix Invaders**: Player and 4 enemy sprites (classic pixel art, recoloured to Matrix palette) deployed with display-size scaling and tint-based shield feedback. Bullet glow sprites integrated (green player, magenta enemy/boss) from laser sprite pack with display-size scaling. Remaining: boss sprite, power-up icons, enemy death explosion.
- [x] **Metris**: Rendering rewrite complete (R36) — refactored from Graphics.fillRect() to Image-pool architecture. 7 beveled tile sprites deployed. BootScene loads sprites with procedural fallback. Remaining: UI panels (Hold/Next/Score), audio SFX, line-clear effects.
- [x] **Matrix Frogger**: Vehicle sprites integrated (5 types: car1, car2, car3, truck, tractor). Frog player sprites (idle + hop, 16×16) replace robot player with `frogSpriteMode` flag and directional rotation. Flower ground tiles added to safe zones. Fly sprite added as animated finish line decoration. Remaining: frog death animation, Neo player sprite, power-up icons, WAV audio integration.
- [x] **Neo Jump**: Player character sprites (CyberPunk 24×24, 5 states), platform sprites (Doodle RPG tiles, 5 types), and enemy sprite (Bomba 71×79) integrated with `setDisplaySize` scaling and per-type tinting. Collectible sprites (fuel, score, shield from Doodle RPG Pickups) and jetpack flame particle deployed. Collectible pickup system with shield mechanic. Remaining: flying/shooting enemy types, background layers, audio SFX.
- [x] **Agent Chase**: Player (rogue), 4 agent monsters, frightened slime, wall brick sprites integrated from 32rogues pack. Fruit collectible sprites (6 types) integrated from PacManAssets pixel art pack with canvas-based resizing to 20×20. Remaining: agent death animation, audio SFX.
- [x] **Cloud Jumper**: 4 cloud sprites (wide, compact, small, peak) deployed with per-type tinting and display-size physics bodies. Player character sprites (idle, jump, fall, 24×24 CyberPunk pixel art) integrated with `playerSpriteMode` flag. Remaining: collectible sprites, obstacle sprites, background layers.
- [x] **Code Breaker**: Brick sprites integrated (4 types: code, agent, sentinel, unbreakable). Paddle sprites (normal + wide), ball sprite, and 6 power-up icons integrated with display-size scaling. Remaining: laser sprites, agent enemies, portal.

### 0c. Asset Integration Pattern

For each game, the pipeline is:
1. Extract raw assets from dump to `desiredassets/[game]/raw/`
2. Process (recolour, resize, atlas-pack) to `desiredassets/[game]/processed/`
3. Copy final assets to `public/assets/[game]/`
4. Update BootScene to load from new paths
5. Mark `[~]` to `[x]` in ASSETS_NEEDED.md

---

## Phase 1: Research & Planning ✅ COMPLETE

12 of 12 research docs created in `rebuildingoldgames/plans/`. All game rebuilds researched.

### 1.1 Global Infrastructure Research (remaining)

- [x] **Matrix Rain Background** -- Replaced CSS/canvas strips with full-screen Canvas 2D rain component (chose Canvas 2D over Three.js to avoid ~600KB dependency). Done R42.
- [ ] **Global Asset System** -- Design unified font, spritesheet, and audio management in `src/lib/assets/`.
- [x] **Game Card Portal Redesign** -- Instructions/High Scores buttons (R32), ASCII art titles (R41). Landing page redesigned (R33).
- [x] **Global Controls UX Redesign** -- Collapsible keyboard icon strip (R33).

---

## Phase 2: Global Infrastructure Build

- [x] Implement full-screen Matrix rain canvas background (replaces CSS animation) -- done R42, Canvas 2D chosen over Three.js
- [ ] Create `src/lib/assets/AssetManager.ts` -- centralised font, spritesheet, and audio loading
- [ ] Create global spritesheet atlas system for shared sprites across games
- [x] Add Instructions/High Scores buttons to game card portal (done R32)
- [x] Redesign landing page grid (larger previews, cleaner cards, play overlay, collapsible controls, xl:grid-cols-4) -- done R33
- [x] Redesign game card portal carousel (ASCII art titles, larger card) -- done R41: ASCII art block-letter titles with green glow replace plain text titles
- [x] Add ASCII art generator/renderer for game titles -- done R41: `src/lib/asciiArt.ts` with 5-row block font, variable-width glyphs, multi-line centring

---

## Phase 3: Phaser Game Rebuilds ✅ COMPLETE (5/6)

Vortex Pong (R9), Snake Classic (R10), Matrix Cloud (R11), Matrix Invaders (R12), Metris (R13) all rebuilt as Phaser games with comprehensive unit tests.

### Remaining

- [ ] **CTRL-S | The World** -- Citizen Sleeper-inspired narrative engine rebuild (largest, most ambitious).

---

## Phase 4: Game Enhancements

- [x] Agent Chase: Multiple map layouts (Classic/Arena/Labyrinth cycling per level, difficulty scaling) -- done R16
- [ ] Neo Jump: Custom sprites, Doodle Jump UX polish
- [ ] Rhythm Hacker: Music sync + visual improvements (see P2 2.1)

---

## Phase 5: New Game -- Code Breaker ✅ COMPLETE

Built in R14. Breakout/Arkanoid inspired, 10 levels, 6 power-ups, boss battles, 127 unit tests.

---

## Phase 6: Polish & Final Testing

- [ ] Full E2E gameplay suite against all rebuilt games
- [ ] Visual regression tests for new Phaser games
- [ ] Performance profiling (60fps on all games)
- [ ] Accessibility audit
- [ ] PWA cache invalidation for new chunks
- [ ] Documentation update

---

## Architecture Notes

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

### Gaps
- None — all 12 games have unit, visual, and gameplay E2E coverage

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

### Gaps
- Most games now have sprite assets -- Code Breaker has brick, paddle, ball, and power-up sprites, Matrix Frogger has vehicle + frog + flower + fly sprites, Agent Chase has roguelike + fruit sprites, Matrix Cloud has bird sprite, Snake Classic has head/body/tail/dead/apple sprites with directional rotation, Cloud Jumper has cloud and player sprites, Rhythm Hacker has music tracks, Matrix Invaders has player/enemy/bullet sprites, Neo Jump has player/platform/enemy/collectible/jetpack sprites, Vortex Pong has paddle, ball, board, and fireball sprites, Metris has beveled tile sprites (7 types), but CTRL-S World remains fully procedural
- All games now benefit from pre-recorded Matrix Trilogy SFX (MP3) via the upgraded useSoundSystem — file-based audio takes priority over procedural synthesis with automatic fallback. All 11 Phaser games now have looping background music (R38) using 7 Matrix Trilogy tracks, with clean shutdown/game-over teardown. Matrix Frogger additionally has 5 game-specific SFX.
- Rhythm Hacker BPM values are estimates — may need tuning per track after playtesting
- `useAdvancedVoice` AudioContext for visualisation never connected to speech output (always returns zeros)
- ~~AudioSettings setTimeout leak (3 timers firing after unmount)~~ — fixed R42 via useRef-based timer tracking with useEffect cleanup

---

## Ralph Loop Strategy

1. **Phase 0b**: Per-game asset extraction (sprites, audio per game) -- biggest remaining effort
2. **Phase 2**: Global infrastructure (Three.js rain, AssetManager, game card redesign) -- now unblocked by font deployment
3. **P2 remaining**: Rhythm Hacker music sync (needs MP3 music tracks), visual improvements
4. **Phase 3.6**: CTRL-S World narrative engine rebuild
5. **Phase 4**: Game enhancements (Neo Jump UX -- Agent Chase maps done R16)
6. **Phase 6**: Final polish and testing pass
7. Use `/matrix-arcade-gamedev` for game code, `/phaser-gamedev` for Phaser scenes, `/playwright-testing` for E2E
8. Run `game-tester` agent after every code change
9. ffmpeg installed via Homebrew (R22) — WAV conversion unblocked
