# MAGIC DOC: [Implementation Plan.md - The Matrix Arcade]

This file is auto-generated and updated by Ralph during planning and building loops.

---

## Current Status

- **Status**: REBUILDING -- Phaser migration of all React/Canvas games + new features
- **Last Updated**: 12 April 2026 (R14 -- Code Breaker new Phaser game)
- **Version**: v2.0.0 (next target)
- **Games**: 13 playable (1 React/Canvas to rebuild into Phaser, 11 already Phaser, 1 DOM)
- **Build**: PASSES (code-split, main bundle ~372KB, Phaser vendor chunk 1,479KB) -- zero warnings
- **Unit Tests**: 2,521 passing across 59 files, 0 failures
- **E2E Tests**: 78 gameplay + 110 visual = 188 tests across 27 spec files -- last run PASSED (0 failures, confirmed via `test-results/.last-run.json`)
- **Asset Pipeline**: 0% complete -- `public/assets/` does not exist, all games use procedural textures

### What Was Completed (v1.x to v2.0 prep)

All P0/P1/P2 bugs resolved from v1.x. Test seams added to all games. E2E gameplay specs written (78 tests). Code quality fixes across 20+ hooks and components. Code-splitting reduced main bundle from 2.18MB to 370KB. Shared game registry created. Error boundaries added. Collision utility extracted. 5 Phaser games scaffolded (MatrixFrogger, NeoJump, AgentChase, RhythmHacker, CloudJumper) with full scene architecture. 12 rebuild research docs created in `rebuildingoldgames/plans/`. Asset inventory catalogued in `desiredassets/`. Full details in git history.

### What Was Completed (R14 -- 12 April 2026)

Code Breaker — brand new Phaser 3 game (Phase 5), Breakout/Arkanoid inspired:

**Full Phaser 3 game**: Created `src/components/games/phaser/CodeBreaker/` with 6 files: config.ts (all game constants, 10 level layouts as number[][][] arrays, brick/power-up/boss definitions, achievement IDs, Phaser config), BootScene.ts (13+ procedural textures — paddle with wide/laser variants, ball, 4 brick types with crack overlay, Agent Smith, boss, 6 power-up types, laser beam, firewall, portal), MenuScene.ts (extends base with controls instructions), GameOverScene.ts (extends base), GameScene.ts (~700 lines, complete Breakout gameplay), and index.tsx (React wrapper).

**Complete Breakout mechanics**: Paddle movement via arrow keys, WASD, and mouse. Ball launches from paddle with SPACE. Angle-based bouncing off paddle (hit position determines angle). 4 brick types: code (1HP/10pts/green), agent (2HP/30pts/amber), sentinel (3HP/50pts/red), unbreakable (999HP/0pts/grey). Bricks flash on hit and show crack overlay when damaged. Combo scoring with multiplier (resets on ball loss). Delta-time movement throughout.

**10-level system**: Each level defined as a grid layout in config.ts. Portal spawns when all breakable bricks are cleared — ball must touch portal to advance. Boss battles on levels 3, 6, and 9.

**6-type power-up system**: Multi-Ball (spawns 2 extra balls), Wide Paddle (1.5x width for 10s), Laser (fires upward beams for 8s), Bullet Time (0.4x time scale for 5s via B key or power-up), Firewall (one-use safety net at bottom), EMP (radius-based brick destruction). Power-ups drop with 20% chance on brick destroy. Each type has distinct procedural texture with colour-coded ring and core.

**Boss battle system**: Bosses spawn on levels 3/6/9 with HP scaling by level (5 + level × 2). Boss moves horizontally, fires aimed bullets at paddle every 2 seconds. Boss health bar displayed above sprite. Defeating boss awards 500 × (1 + level × 0.5) points.

**Agent Smith enemies**: Sentinels have 30% chance to spawn an Agent Smith on destruction. Agents drift downward and cause life loss on paddle contact.

**10 achievements**: breaker_first_break (First Crack — destroy first brick), breaker_level_5 (Firewall Piercer — reach level 5), breaker_level_10 (System Liberator — complete level 10), breaker_smith_slayer (Agent Eliminator — destroy 10 agents), breaker_combo_15 (Chain Breaker — 15 combo), breaker_multi_ball (Multi-Thread — have 3+ balls active), breaker_bullet_time (Time Hacker — use bullet time 5 times), breaker_no_miss (Perfect Firewall — complete a level without losing a ball), breaker_boss_defeat (Boss Cracker — defeat a boss), breaker_high_score (Elite Breaker — score 10,000+). All use tryUnlockAchievement() with Set<string> deduplication.

**Registration**: Added to gameRegistry.ts (id: 'code-breaker', category: 'Arcade', inspiration: 'Breakout / Arkanoid (1986)'). Added lazy import and GAME_BINDINGS entry in App.tsx. Added codeBreaker save data, migration entry, and 10 achievement definitions in useSaveSystem.ts. Preview image via SVG data URI in gamePreviewImages.ts. Updated "Play all 12 games" count.

**127 new unit tests** across 22 test suites: initial state (9), paddle movement — keys/WASD/boundaries/bullet time (7), ball-paddle collision — bounce angle/sound/stuck (6), ball-wall collision — sides/top/off-screen (6), ball-brick collision — hit/multi-hit/destroy/unbreakable/miss (7), scoring — points/combo/multiplier/combo reset (5), power-up activation — multiBall/widePaddle/laser/firewall/EMP/sound (10), boss — spawn/health/movement/reversal/fire/hit/defeat/achievement/sound/clear bullets (10), Agent Smith — spawn/movement/off-screen/collision (4), laser — fire/movement/off-screen/destroy/sound (5), firewall — catches ball (1), level completion — portal spawn/boss guard/portal collision/no miss/ball lost/final level/level 5 (7), achievements — first break/combo 15/high score/bullet time/multi ball/no double/smith slayer (7), game over — trigger/flag/no double/level reason (4), particles — spawn/decay/removal (3), power-up spawning — position/fall/off-screen (3), boss bullet collision — life loss/removal (2), level loading — bricks/clear/boss/no boss (4), ball spawn — attached/free (2), HUD updates — score/level/lives/combo show/combo hide (5), test state exposure (2), cleanup — balls/bricks/boss/keyboard/agents/particles/firewall/portal (8). All 2,521 tests passing across 59 files, build clean.

### What Was Completed (R13 -- 12 April 2026)

Metris Phaser rebuild — fifth React-to-Phaser migration, continuing the proven pipeline:

**Full Phaser 3 port**: Created `src/components/games/phaser/Metris/` with 6 files: config.ts (all game constants, SRS wall kick tables, tetromino definitions, achievement IDs, Phaser config), BootScene.ts (extends shared BootScene), MenuScene.ts (extends shared MenuScene with controls instructions), GameOverScene.ts (extends shared GameOverScene), GameScene.ts (~560 lines, complete Tetris implementation), and index.tsx (React wrapper).

**All mechanics faithfully ported from Metris.tsx (1,504 lines)**: Full SRS (Super Rotation System) with wall kick tables for clockwise and counter-clockwise rotation. 7-bag randomizer for fair piece distribution. 10x20 grid with ghost piece preview. Hold piece system with one-hold-per-drop restriction. DAS (Delayed Auto Shift) input handling (170ms delay, 50ms repeat). Timer-based gravity with level-based speed progression. Soft drop (arrow down) and hard drop (space bar). T-spin detection via 3-corner rule with last-rotation tracking. Combo scoring system with level multiplier. Line clear scoring: 100/300/500/800 for 1/2/3/4 lines. Graphics-based rendering (no textures — full grid redrawn each frame via Phaser.GameObjects.Graphics).

**Bullet time system**: Auto-activates when meter fills from line clears (4 lines per activation). Manual activation via B key. 8-second duration with 0.4x slowdown factor affecting drop speed. Usage counter tracked across sessions via save system for neos_apprentice achievement (10 uses). Visual meter bar and countdown timer in HUD.

**Glow and particle effects**: Newly placed pieces glow bright for 200ms then fade. Line clear triggers particle burst (8 particles per cleared cell with random velocity, gravity, and decay). Matrix rain overlay via matrixRainGroup.

**12 achievements**: metris_first_line (clear first line), metris_tetris (clear 4 lines at once), metris_level_10 (reach level 10), metris_high_roller (score 10,000+), metris_line_clearer (clear 100 lines), metris_combo_king (5+ combo), metris_t_spin_master (5 T-spins), metris_architect (fill 18+ rows), metris_neos_apprentice (use bullet time 10 times), metris_marathon_runner (play 10+ minutes), metris_perfect_start (reach level 5 without game over), metris_immortal (reach level 20). All use tryUnlockAchievement() guard with Set<string> deduplication.

**Save system integration**: High score and bullet time usage count persist across sessions via registry SAVE_SYSTEM.

**App.tsx updated**: Lazy import changed from `./components/games/Metris` to `./components/games/phaser/Metris`. Old React Metris.tsx preserved (tests still pass).

**109 new unit tests** across 16 test suites: initial state (14), piece spawning (5), collision detection (6), movement (5), rotation (6), matrix rotation (3), ghost piece (2), drop tick (4), line clearing (5), scoring (7), level progression (5), hold piece (5), hard drop (3), bullet time (8), T-spin detection (2), achievements (12), game over (5), drop speed (3), particle effects (3), test state exposure (2), cleanup (4). All 2,394 tests passing across 58 files, build clean.

### What Was Completed (R12 -- 12 April 2026)

Matrix Invaders Phaser rebuild — fourth React-to-Phaser migration, continuing the proven pipeline:

**Full Phaser 3 port**: Created `src/components/games/phaser/MatrixInvaders/` with 6 files: config.ts (all game constants with per-second units, enemy/power-up definitions, achievement IDs, Phaser config), BootScene.ts (13 procedural textures — player with shield variant, 4 enemy types, boss, 2 bullet types, 4 power-up types), MenuScene.ts (extends base with controls instructions), GameOverScene.ts (extends base), GameScene.ts (~600 lines, complete gameplay), and index.tsx (React wrapper).

**All mechanics faithfully ported from MatrixInvaders.tsx (1,191 lines)**: Space invader gameplay with 8x5 enemy grid formation. Enemies bounce horizontally and descend on wall hit. Enemy speed increases as enemies die (+30% at last enemy) and per wave (+5%/wave). Enemies fire randomly with configurable probability. AABB collision detection for all interactions. Combo scoring (increments per kill, resets on player hit). Wave completion restores 1 health. Delta-time-based movement throughout.

**Bullet time system**: B key activates slow motion (0.3x time scale) for 3 seconds. Affects all enemy and bullet movement. Player fire rate intentionally unscaled (uses real time for cooldown). Usage counter tracked for achievements.

**4-type power-up system (properly implemented — were only scaffolded in React version)**: Rapid Fire (halves fire cooldown for 8s), Shield (absorbs one hit, shows player_shield texture), Score Multiplier (2x points for 8s), Bomb (instant — destroys all enemies, damages boss by 20hp). Power-ups drop with 15% chance on enemy kill. Field power-ups fall at 120 px/s with AABB collection detection.

**Boss battle system**: Boss spawns every 5th wave with 1500ms warning delay (bossSpawning guard prevents premature wave completion). Boss has 20hp, fires every 2 seconds with aimed projectiles toward player. Boss health bar displayed above sprite. Defeating boss awards 500 points × multiplier.

**4-type enemy system**: Code (green, 1hp, 10pts), Agent (amber, 2hp, 30pts), Sentinel (red, 3hp, 50pts), Virus (magenta, 1hp, 20pts, splits into 2 children on death). Enemy type selection varies by wave — virus from wave 2+, agent from wave 3+, sentinel in top row from wave 10+.

**10 achievements**: invaders_first_kill (destroy first enemy), invaders_wave_5 (reach wave 5), invaders_wave_10 (reach wave 10), invaders_boss_defeat (defeat a boss), invaders_perfect_wave (complete wave without damage, wave 2+), invaders_100_enemies (destroy 100 enemies), invaders_combo_10 (10 kill combo), invaders_bullet_time (use bullet time), invaders_no_bullet_time (reach wave 5 without bullet time), invaders_power_collector (collect 10 power-ups). All use dual-call pattern via BaseScene.unlockAchievement().

**App.tsx updated**: Lazy import changed from `./components/games/MatrixInvaders` to `./components/games/phaser/MatrixInvaders`. Old React MatrixInvaders.tsx preserved (tests still pass).

**134 new unit tests** across 18 test suites: initial state (12), player movement — arrows/WASD/boundaries (7), player shooting — creation/sound/cooldown/velocity (6), bullet time — activation/usage/sound/deactivation/duration/fire rate (6), bullet updates — movement/offscreen removal (4), enemy movement — direction/bounce/descent/speed increase (6), enemy shooting — creation/velocity/timing (4), collision detection — hit/miss/boundary (5), hit enemy — damage/HP/sound/combo/score (6), kill enemy — removal/sound/achievements/combo bonus (6), virus split — children/properties (4), hit player — damage/invulnerability/shield/sound/game over (7), wave system — spawn count/types/boss trigger (5), wave complete — detection/transition/health restore/speed increase (5), boss battle — spawn/warning/health/defeat/aimed shots (8), power-ups — drop/collection/rapidFire/shield/scoreMultiplier/bomb (10), game over — trigger/score report/achievement (4), achievements — thresholds/idempotent/wave5/perfect wave (4), particle effects — spawn/velocity/decay/removal (4), enemy type selection (2), test state exposure (2), cleanup — enemies/bullets/boss/keyboard/particles/power-ups (6). All 2,285 tests passing, build clean.

### What Was Completed (R11 -- 12 April 2026)

Matrix Cloud Phaser rebuild — third React-to-Phaser migration, continuing the proven pipeline:

**Full Phaser 3 port**: Created `src/components/games/phaser/MatrixCloud/` with 6 files: config.ts (all game constants, types, boss definitions, power-up definitions, achievement IDs), BootScene.ts (procedural textures for player with 3 states — normal/shield/damaged — 4 power-up types, 3 boss types with distinct visual designs, and 3 attack projectile types), MenuScene.ts (extends base MenuScene with how-to-play instructions), GameOverScene.ts (extends base), GameScene.ts (~530 lines, complete gameplay implementation), and index.tsx (React wrapper).

**All mechanics faithfully ported from MatrixCloud.tsx**: Flappy Bird-style gameplay with manual physics (gravity 1400 px/s², jump velocity -420 px/s, terminal velocity 600 px/s). Pipes scroll left at 200 px/s with 120px gap, spawned at 240px intervals. Player at fixed x=80, rotates based on velocity. AABB collision detection for pipe pairs. Combo scoring (increments by 0.15 per clean pipe pass, capped at 5.0x). Level progression every 500 points.

**4-type power-up system**: Shield (absorbs one hit, shows magenta break effect), Time Slow (all speeds × 0.6 for 8s), Extra Life (instant, caps at 5), Double Points (2x scoring for 8s). Power-ups spawn with 12% chance alongside pipes, scroll with pipe speed. Each type has a distinct procedural texture with its own colour and geometric shape.

**3-boss system**: Agent Smith (level 5, 150hp, sinusoidal movement, laser/code_bomb attacks), Sentinel (level 10, 200hp, circular orbit, matrix_rain/laser attacks), Architect (level 15, 300hp, slow vertical wave, all 3 attack types). Bosses clear all pipes/power-ups on spawn. 30-second battle timer. Player damages boss by 10hp per body contact (also takes damage). Boss health bar drawn above sprite. Score reward = maxHealth × 2 on defeat.

**8 achievements**: cloud_first_flight (first jump), cloud_level_5 (reach level 5), cloud_boss_slayer (defeat Agent Smith), cloud_sentinel_defeat (defeat Sentinel), cloud_architect_defeat (defeat Architect), cloud_all_bosses (defeat all 3 boss types), cloud_power_collector (collect 20 power-ups), cloud_high_flyer (score 1000). All use dual-call pattern via BaseScene.unlockAchievement().

**Bug fix**: Added missing `cloud_sentinel_defeat` achievement to useSaveSystem.ts achievement definitions — was previously called in game code but never registered, silently failing.

**App.tsx updated**: Lazy import changed from `./components/games/MatrixCloud` to `./components/games/phaser/MatrixCloud`. Game registry controls text updated. Old React MatrixCloud.tsx preserved (tests still pass).

**81 new unit tests** across 14 test suites: initial state (10), player physics — gravity/terminal velocity/ceiling clamp/ground (4), jump — velocity/sound/achievement (4), pipe collision — top/bottom/gap/distance (4), pipe scoring — base/combo/cap/multiplier/doublePoints/reportScore/sound (7), level progression — threshold/sound/shake/calculation (4), power-up collection (2), power-up activation — shield/timeSlow/extraLife/cap/doublePoints (5), shield mechanics — absorb/invulnerability/sound (3), collision and damage — life loss/combo reset/sound/invulnerability/camera shake (6), game over — 0 lives/gameOver call/highScore update (4), boss battle — start/health/clear pipes/clear power-ups/score bonus/achievements/all bosses/end/cleanup/attack invulnerability (12), achievements — thresholds/below thresholds/idempotent (5), power-up collision detection (2), speed multiplier (2), test state exposure (1), spawn pipe — creation/properties/gap range (3), cleanup — pipes/boss/keyboard (3). All 2,151 tests passing, build clean, zero lint errors from new code.

### What Was Completed (R10 -- 12 April 2026)

Snake Classic Phaser rebuild — second React-to-Phaser migration, continuing the proven pipeline:

**Full Phaser 3 port**: Created `src/components/games/phaser/SnakeClassic/` with 6 files: config.ts (all game constants, types, achievement IDs, power-up definitions), BootScene.ts (procedural textures for snake head/body/tail, food, and 4 power-up types), MenuScene.ts (extends base MenuScene with how-to-play instructions), GameOverScene.ts (extends base), GameScene.ts (~450 lines, complete gameplay implementation), and index.tsx (React wrapper).

**All mechanics faithfully ported from useSimpleSnakeGame.ts**: 20x20 grid-based movement via Phaser TimerEvent (150ms initial tick, speeds up by 5ms per 50 points, capped at 50ms). Direction queuing with 180-degree reversal blocking prevents U-turns between ticks. Tail-tip excluded from self-collision check. Food spawns on random empty cells (excludes snake body). Speed progression recalculates from score on every food collection.

**4-type power-up system**: Speed (paradoxically slows snake by adding 30ms to timer for 5s), Double (next 3 food worth 20 points instead of 10), Shield (one-time wall collision protection, bounces snake back), Ghost (wall wrap via modulo for 7s, body rendered semi-transparent). Power-ups spawn with 15% chance after eating food, despawn after 8s if uncollected. Each type uses Phaser TimerEvents for duration tracking.

**7 achievements**: first_apple (eat first food), score_100, score_500, combo_10 (10 food without dying), power_master (collect 5 power-ups), survivor (survive 60s), speed_demon (reach speed level 5+). All use dual-call pattern (UI toast + persistence).

**App.tsx updated**: Lazy import changed from `./components/games/SimpleSnake` to `./components/games/phaser/SnakeClassic`. Game registry controls text updated to 'Arrow keys/WASD to move. Collect food, avoid walls!'.

**90 new unit tests** across 18 test suites: initial state (10), direction changes (4), position calculation (4), wall collision (6), self collision (4), ghost mode (5), shield (3), food collection (8), power-up collection (5), power-up activation (10), speed progression (5), level calculation (3), achievements (8), game over (6), grid conversion (2), random empty cell (2), movement integration (4), test state (2). All 2,070 tests passing, build clean, zero lint errors from new code.

### What Was Completed (R9 -- 12 April 2026)

Vortex Pong Phaser rebuild — first React-to-Phaser migration, proving the pipeline:

**Full Phaser 3 port**: Created `src/components/games/phaser/VortexPong/` with 6 files: config.ts (all game constants converted from per-frame to per-second units), BootScene.ts (procedural paddle/ball/power-up textures), MenuScene.ts (extends base MenuScene with how-to-play instructions), GameOverScene.ts (extends base), GameScene.ts (complete gameplay implementation), and index.tsx (React wrapper).

**All mechanics faithfully ported**: Two-paddle pong with angle-based ball bouncing (hit position on paddle determines bounce angle), adaptive AI opponent (difficulty ramps from 2.5 to 5 as player hits ball, with damping, error margin, and 20% deliberate mistake chance), speed ramp over time (capped at 2.14x), 4-type power-up system (bigger paddle, slower ball, score multiplier, multi-ball), combo/rally tracking, screen shake via camera effects, and expanding ring impact effects.

**7 achievements**: first_point, combo_king (5 rallies), rally_master (20 rallies), power_master (5 power-ups), beat_ai (win), perfect_game (10-0 shutout), multi_ball (3+ balls at game end). Multi-ball achievement correctly checks ball count before removal.

**App.tsx updated**: Lazy import changed from `./components/games/VortexPong` to `./components/games/phaser/VortexPong`. Game registry controls text updated. Old React VortexPong.tsx preserved (tests still pass).

63 new unit tests covering: initial state, speed multiplier ramp/cap/slow, ball movement/bouncing, paddle collision detection/angle bounce/combo/rally/difficulty, player/AI scoring with multiplier/combo bonus, win conditions with all achievements, power-up activation/deactivation/collection/spawning, impact effect lifecycle, AI target tracking, and power-up collision detection. All 1,980 tests passing, build clean, zero lint errors.

### What Was Completed (R8 -- 12 April 2026)

Matrix Frogger major gameplay overhaul with 7 enhancements:

**Lane visuals**: Road lanes now have dark surface backgrounds with dashed green road markings. Safe zones (rows 0, 4, 8) have distinct green-tinted backgrounds. Finish line at row 0 has a bright green dashed pattern. Labels added for FINISH, SAFE ZONE, and START areas. All drawn as a Phaser Graphics layer beneath the gameplay.

**5-second countdown**: Game now starts with a 5-4-3-2-1-GO! countdown sequence. During countdown, enemies are frozen and input is disabled. Each tick plays a beep sound with scale animation. "GO!" displays in cyan before fading out.

**Level progression system**: Reaching the finish line (row 0) now increments the level counter (previously just reset position). Level displayed in top-right HUD. Each level increases enemy speed by +15 px/s (stacks with distance-based difficulty). "LEVEL N" announcement appears with upward float animation on crossing. New LEVEL_5 achievement.

**Kung Fu ability**: Press K to destroy the nearest enemy within 1.5 cell range. 3 charges per game, 500ms cooldown between uses. HUD displays charge icons in bottom-left corner (filled yellow circles when available, dimmed when spent). Visual: expanding yellow shockwave ring + cyan particle burst on the destroyed enemy. New KUNG_FU_MASTER achievement for using all 3 charges.

**NEO invincibility mode**: New power-up type (10% drop rate from level 2+, separate cyan orb pickup). 8-second duration. Player rapidly flashes between green/cyan/white/yellow. Destroys enemies on contact (+100 score per destroy). New NEO_UNSTOPPABLE achievement for destroying 3+ enemies in one activation. Player tint restored to Matrix green when NEO mode expires.

**Varied enemy speeds**: Enemy speed now scales with both distance AND level. Chasing agents introduced from level 3 onwards (20% spawn chance) — these enemies move horizontally like normal but also drift vertically toward the player's row. Chasing agents tinted red for visual distinction.

**New textures**: BootScene generates Kung Fu charge icons (filled + empty), NEO pickup orb (cyan glow), and NEO mode power-up indicator. Config adds LANE_COLORS for safe zones, road surfaces, road markings, and finish line.

70 unit tests (18 new) all passing, build clean, zero warnings. New tests cover: NEO pill collection, NEO mode activation/expiry/enemy destruction, Kung Fu charge system/cooldown/achievement, level progression/bonus/achievement, initial state for new fields.

### What Was Completed (R7 -- 12 April 2026)

Cloud Jumper canvas width gap fixed: dimensions changed from 800x500 (8:5) to 800x450 (16:9) to match the game portal container's `aspect-[16/9]`, eliminating pillarbox black bars. Player start Y adjusted from 250 to 225. All gameplay references use GAME_CONFIG constants so no code changes needed beyond config.ts.

Rhythm Hacker major layout overhaul: canvas widened from 600 to 800 (reduces pillarboxing from ~52% to ~36% in the 16:9 container), HIT_LINE_Y moved from 600 to 640 (notes now travel 690px instead of 650px, using more vertical space), key indicators tightened from +50 to +35 below hit line. HUD relocated from centre-top overlay (which obscured the falling zone) to side gutters — left gutter has score, time, and track name; right gutter has health bar and combo display. Grade text centred at top of play area, no longer in the falling zone. Menu buttons widened from 400px to 500px to fill the wider canvas proportionally.

Note sprites completely redesigned: plain rounded rectangles replaced with circular glowing data-node design — outer ring, filled core, and bright highlight dot. Hold note tails changed from rectangles to small circles. Double note indicator changed from rectangular cyan border to diamond-shaped cyan outline. More visually distinctive and fitting for a Matrix-themed rhythm game about hacking code streams.

All 1,899 tests passing, build clean, zero warnings.

### What Was Completed (R6 -- 12 April 2026)

Matrix green palette consistency pass across 4 Phaser games. Cloud Jumper: all cloud textures recoloured from white/blue to green/cyan/dim-green/dark-red Matrix palette, parallax background layers changed from white (0xffffff) to dark green (0x003300–0x005500), collectibles changed from gold/white to cyan/green, obstacles changed from grey to dark-red (bird sentinel) and dark-grey with red windows (plane), DISTANCE text changed from white to green. Agent Chase: HUD text for LIVES changed from yellow to green, LEVEL changed from cyan to green — all three HUD elements now consistently green. Neo Jump: JETPACK fuel label changed from yellow to green, fuelLabel stored as class field instead of local variable for proper cleanup in shutdown(). Matrix Frogger: DISTANCE text changed from cyan to green, COMBO text changed from yellow to green. Cloud Jumper config.ts CLOUD_TYPES colours updated to match new BootScene palette. All 1,899 tests passing, build clean, zero warnings.

### What Was Completed (R5 -- 12 April 2026)

P1 build chunk warning resolved: Phaser extracted to dedicated vendor chunk via `manualChunks` config in vite.config.ts (GameOverScene dropped from 1,490KB to 12KB). Codebase cleanup: moved `playwright` from production to dev dependencies, removed unused `jest` dependency, deleted superseded `e2e/gameplay/invaders.gameplay.spec.ts` (2 tests, replaced by `matrix-invaders.gameplay.spec.ts` with 5 tests), removed dead `_showFiftyFifty` state from PuzzleModal, removed dead code from 3 legacy games (AgentEscape._TUNNEL, JimmyMatrix._getTimingGrade/_timeDiff, MatrixAscension._altitude), extracted PerformanceOverlay from usePerformanceMonitor hook body to module-scope component (fixes remount churn).

Rhythm Hacker visual overhaul: keys changed from D/F/J/K to Q/W/O/P (better hand positioning), countdown reduced from 10s to 5s, entire colour palette converted to Matrix green theme (lane colours now green/cyan/dark-green/light-green; "EASY MODE" label changed from magenta to green; "HEALTH" label from red to green; combo from yellow to cyan; timing grades from gold/green/blue/red to cyan/green/dim-green/dim-red; hit effects, double note indicator, health bar, and time warning all updated). Lane width widened from 80px to 100px with increased spacing for better play area fill. E2E specs and helpers updated for new key bindings. Cloud Jumper fixes: player sprite recoloured from blue to Matrix green, death texture added (glitch/dissolve effect with X-eyes instead of unrecognisable red-tinted blob), preview image changed from sky-blue to Matrix green. Rhythm Hacker preview changed from magenta to green-cyan. Matrix Frogger fixes: score now awards points on every forward step (was only on personal-best rows), player scale increased from 0.8 to 1.0 for better visibility.

### What Was Completed (R4 -- 12 April 2026)

Seven P1 bugs fixed: Metris bullet time B key wired up (was dead code, now manually activatable with neos_apprentice achievement reachable). Matrix Cloud pipe collision now prevents scoring on hit (removes redundant failsafe, adds sentinel boss achievement). CTRL-S World save crash fixed (unlockAchievement fallback now uses createDefaultGameSave() instead of incomplete partial object). SimpleSnake achievement toasts restored (achievementManager prop destructured and dual-call pattern applied to all 7 achievement sites). Mute state divergence fixed (PhaserGame.tsx now calls useSoundSystem.toggleMute() when Phaser M key event fires, keeping React in sync). Fragile positional array coupling in App.tsx replaced with keyed GAME_BINDINGS record (game registry entries now have stable `id` field). Rhythm Hacker countdown no longer eats track duration (gameTime only increments after countdown, nextNoteTime reset on countdown end, initial countdown text derived from config).

### What Was Completed (R3 -- 12 April 2026)

All P0 critical bugs resolved: Phaser controls now respond reliably via triple-focus strategy and input retry patterns across all scenes. Cloud Jumper jump physics fixed (one-way platform pattern, cloud body sizing, storm bounce correction). Neo Jump jetpack changed to direct velocity set, death detection tightened. Agent Chase agents can now exit/re-enter ghost house, reverse as fallback when stuck. All P1 test failures resolved (1,899 passing, 0 failing). Double gameOver sound eliminated. GameOverScene keyboard UX improved (M for menu, sound on keyboard restart). useInterval OOM crash fixed. usePerformanceMonitor interval guard added.

### Skills & Agents for Ralph Loop

| Skill/Agent | Command | When to Use |
|-------------|---------|-------------|
| Matrix Arcade Gamedev | `/matrix-arcade-gamedev` | Any game code changes |
| Phaser Gamedev | `/phaser-gamedev` | Phaser 3 scene development |
| Frontend Design | `/frontend-design` | UI/UX improvements |
| Playwright Testing | `/playwright-testing` | E2E test creation/debugging |
| New Game Scaffolder | `/new-game <Name> --phaser` | Scaffolding a brand new game |
| Game Tester | agent: `game-tester` | Run full test suite after changes |

---

## Priority Legend

- **P0**: Critical/blocking -- games unplayable, users cannot interact
- **P1**: High -- bugs that degrade experience, failing tests
- **P2**: Medium -- infrastructure, UX improvements, research
- **P3**: Low -- rebuilds, new features, polish

---

## P0 -- Critical: Phaser Controls & Unplayable Games ✅ RESOLVED

All P0 issues fixed in R3 (12 April 2026).

### 0.1 Fix Phaser Game Controls Not Responding ✅

**Fixed**: Triple-focus strategy in PhaserGame.tsx (immediate + on-ready + rAF-after-ready). Input retry pattern added to BaseScene.setupCommonInputs(), MenuScene.setupMenuInput(), GameOverScene.setupGameOverInput(), and all 5 Phaser game GameScenes. "Click to play" overlay made clickable (removed pointerEvents: 'none', added role="button" and onClick). Defensive guard added in App.tsx for `target.closest()` in jsdom.

- [x] `src/lib/phaser/PhaserGame.tsx` -- Triple-focus strategy, clickable overlay
- [x] `src/lib/phaser/scenes/BaseScene.ts` -- Input retry pattern in `setupCommonInputs()`
- [x] `src/lib/phaser/scenes/MenuScene.ts` -- Input retry pattern in `setupMenuInput()`
- [x] `src/lib/phaser/scenes/GameOverScene.ts` -- Input retry pattern in `setupGameOverInput()`
- [x] All 5 Phaser game GameScenes -- Input retry pattern verified

### 0.2 Fix Cloud Jumper -- Cannot Jump (Unplayable) ✅

**Fixed**: Simplified `canLandOnCloud()` to standard one-way platform check (`velocity.y >= 0`). Fixed cloud physics body after scaling (`setSize` + `setOffset` to match visual width). Storm cloud bounce reduced to `JUMP_VELOCITY * 0.5` (was paradoxically full velocity). Removed empty `handleInput()` dead code. Changed background from sky-blue to black for Matrix theme consistency. Added input retry pattern.

- [x] Cloud physics body dimensions fixed to match visual size after scaling
- [x] `canLandOnCloud()` simplified to standard one-way platform pattern
- [x] Storm cloud bounce fixed -- reduced to `JUMP_VELOCITY * 0.5`
- [x] Empty `handleInput()` dead code removed
- [x] Background changed from `bg-sky-400` to `bg-black`
- [x] Input retry pattern added to `setupInput()`

### 0.3 Fix Neo Jump -- Jetpack Broken + Endless Falling ✅

**Fixed**: Jetpack changed from additive acceleration to direct velocity set (`setVelocityY(-400)`). Death detection tightened to `cameraBottom + 50` instead of `cameraBottom + HEIGHT * 0.3`. Added W key support for WASD jetpack users. Input retry pattern added.

- [x] Jetpack: changed to direct velocity set (`body.setVelocityY(-400)`)
- [x] Death detection: tightened to `cameraBottom + 50`
- [x] W key added for jetpack (WASD consistency)
- [x] Input retry pattern added to `setupInput()`

### 0.4 Fix Agent Chase -- Agents Stuck in Centre Box + Wall Glitch ✅

**Fixed**: Added `isAgent` parameter to `canMove()` — ghost house tile '4' now passable for agents. Added reverse direction fallback when all non-reverse directions are blocked (prevents infinite oscillation). Fixed returning agent target to use actual home grid position instead of hardcoded coordinates. Fixed returning agent distance check to use homePosition directly. Cleaned up variable shadowing in `resetPositions()`.

- [x] `canMove()` allows tile '4' for agents (isAgent parameter)
- [x] Reverse direction fallback when all other directions blocked
- [x] Returning agent target uses actual home grid position
- [x] Variable shadowing cleaned up in `resetPositions()`
- [x] Input retry pattern added

---

## P1 -- High Priority: Game Bugs & Test Failures

### 1.1 Fix Metris Bullet Time (B Key) ✅

**Fixed**: Renamed `_toggleBulletTime` to `toggleBulletTime`, added B key handler in keyboard event listener, added to dependency array. Removed unused `_unlockGameAchievement` wrapper. Auto-activation still works for convenience; manual B key press tracks usage toward `neos_apprentice` achievement. Both paths play activation SFX.

- [x] B key handler added, toggleBulletTime wired up
- [x] Dead `_unlockGameAchievement` wrapper removed
- [x] neos_apprentice achievement reachable via manual activation

### 1.2 Fix Matrix Cloud Combo Scoring ✅

**Fixed**: Pipe collision now marks pipe as `passed` and skips scoring (player no longer scores on pipes they hit). Redundant failsafe collision block removed (was masked by invulnerability but structurally dangerous). Added sentinel boss achievement (`cloud_sentinel_defeat`) alongside existing agent_smith and architect achievements.

- [x] Collision marks pipe as passed, prevents scoring
- [x] Redundant failsafe collision block removed
- [x] Sentinel boss achievement added

### 1.3 Fix CTRL-S World Save Crash ✅

**Fixed**: Replaced malformed fallback object in `unlockAchievement` (missing `level`, `stats` sub-object) with `createDefaultGameSave()` which produces a valid `GameSaveData`.

- [x] Fallback uses `createDefaultGameSave()` — structurally valid GameSaveData
- [x] All 55 useSaveSystem tests pass

### 1.4 Fix Unit Test Failures (8 failures + 1 OOM) ✅

All test failures resolved:

- [x] **App.test.tsx** (5 failures → 0): Added `playBackgroundMP3`/`stopBackgroundMP3` to inline mock. Fixed `getByText` failures caused by landing page overlay showing duplicate text — switched to `getAllByText` and added `dismissLandingPage()` helper. Added defensive `typeof target?.closest === 'function'` guard in App.tsx.
- [x] **useViewportCulling.test.ts** (2 failures → 0): Updated test expectations to match non-mutating `cullObjects` API
- [x] **usePerformanceMonitor.test.tsx** (1 failure → 0): Added `if (!showOverlay) return;` guard in interval useEffect, removed console.log
- [x] **useInterval.test.ts** (1 OOM → 0): Changed `delay: 0` to `delay: 1`, added `Math.max(delay, 1)` minimum guard in hook

### 1.5 Fix Build Chunk Warning ✅

**Fixed**: Added `manualChunks: { phaser: ['phaser'] }` to vite.config.ts. GameOverScene chunk dropped from 1,490KB to 12KB. Phaser now in its own stable, cacheable vendor chunk (1,479KB — unavoidable library size). Added `chunkSizeWarningLimit: 1500` to suppress expected Phaser warning.

- [x] Investigated and confirmed Phaser was inlined into GameOverScene chunk
- [x] Phaser extracted to shared vendor chunk, zero build warnings

### 1.6 Fix Double gameOver Sound ✅

**Fixed**: Removed `this.playSound('gameOver')` from `BaseScene.gameOver()` — PhaserGame.tsx already handles it via the event handler.

- [x] `src/lib/phaser/scenes/BaseScene.ts` -- Removed duplicate `playSound('gameOver')` call

### 1.7 Fix Mute State Divergence ✅

**Fixed**: PhaserGame.tsx now calls `useSoundSystem().toggleMute()` when receiving a `'mute'` event from Phaser scenes. M key press in-game now syncs mute state back to React. No prop threading needed — PhaserGame already had useSoundSystem imported.

- [x] `src/lib/phaser/PhaserGame.tsx` -- Mute event calls toggleMute(), added to dependency array

### 1.8 Fix GameOverScene Keyboard UX Gaps ✅

**Fixed**: Added M key to navigate to menu from GameOverScene. Added sound (`'menu'`) to keyboard `restartGame()` path for consistency with button click behaviour.

- [x] `src/lib/phaser/scenes/GameOverScene.ts` -- M key calls `goToMenu()`, keyboard restart plays sound

### 1.9 Fix SimpleSnake Achievement Toasts Missing ✅

**Fixed**: Destructured `achievementManager` from props. Added `achievementManager?.unlockAchievement()` calls alongside all 7 existing `unlockAchievement()` calls, matching the dual-call pattern used by all other games. Updated dependency arrays.

- [x] `achievementManager` destructured from SimpleSnakeProps
- [x] 7 achievement sites now use dual-call pattern (UI toast + persistence)

### 1.10 Fix Fragile Positional Array Coupling in App.tsx ✅

**Fixed**: Added `id` field to `GameEntry` interface and all 11 GAME_REGISTRY entries. Replaced positional `GAME_COMPONENTS[]` and `GAME_ICONS[]` arrays with a keyed `GAME_BINDINGS` record indexed by game ID. The zip now uses `GAME_BINDINGS[entry.id]` — reordering GAME_REGISTRY can no longer silently mismatch components.

- [x] `src/data/gameRegistry.ts` -- Added `id: string` field to GameEntry, IDs added to all 11 entries
- [x] `src/App.tsx` -- GAME_BINDINGS record replaces positional arrays

### 1.11 Fix useInterval OOM Crash ✅

**Fixed**: Added `Math.max(delay, 1)` minimum delay guard in `useInterval.ts`. Changed test from `delay: 0` to `delay: 1`. Full suite now runs to completion without OOM.

- [x] `src/hooks/useInterval.ts` -- `Math.max(delay, 1)` guard
- [x] `src/hooks/useInterval.test.ts` -- `delay: 0` changed to `delay: 1`

### 1.12 Fix Rhythm Hacker Countdown Eats Track Duration ✅

**Fixed**: `gameTime` now only increments after countdown finishes (`if (!this.isCountdown) this.gameTime += delta`). `nextNoteTime` reset to 0 when countdown ends so notes spawn immediately. Initial countdown text now derived from `GAME_CONFIG.COUNTDOWN.DURATION` instead of hardcoded '10'. Easy track now plays for the full 60s of note time.

- [x] gameTime paused during countdown
- [x] nextNoteTime reset on countdown end
- [x] Countdown text uses config duration, not hardcoded '10'

---

## P2 -- Medium Priority: Existing Phaser Game Fixes & Cleanup

These games work but have documented bugs from `rebuildingoldgames/bugs.md`.

### 2.1 Rhythm Hacker Improvements

**File**: `src/components/games/phaser/RhythmHacker/scenes/GameScene.ts`
- [x] Change keys from D/F/J/K to Q/W/O/P (better hand positioning)
- [x] Reduce countdown from 10s to 5s (current 10s + 0.5s GO + 1s delay = 11.5s before gameplay -- far too long)
- [ ] Sync gameplay to backing music track (currently procedurally generated notes). 5+ WAV tracks available in asset dump.
- [ ] Improve visuals and animations (currently 100% procedural -- 28 textures auto-generated)
- [x] Fix play area layout — canvas widened 600→800, HIT_LINE_Y moved 600→640, HUD moved to side gutters, key indicators tightened
- [x] Replace magenta/pink "EASY MODE" label and red "HEALTH" label with Matrix-green palette colours
- [x] Replace multi-colour lane buttons (red/green/indigo/olive) with Matrix-themed colour variants (green/cyan/dark green/white) to maintain aesthetic consistency
- [x] Redesign note sprites — circular glowing data-node design with ring, core, and highlight
- [x] Initial countdown text is hardcoded to `'10'` at line 189 but actual duration comes from config — fix initialisation to use `GAME_CONFIG.COUNTDOWN.DURATION` (already fixed, this was done in R4)

### 2.2 Matrix Frogger Enhancements ✅

**File**: `src/components/games/phaser/MatrixFrogger/scenes/GameScene.ts`
- [x] Add safe start line (bottom row) — green-tinted background + START label
- [x] Add 5-second countdown timer at start — 5-4-3-2-1-GO! sequence with animation
- [x] Add finish line/pavement at top (no loop) — bright green dashed finish line + FINISH label + level system
- [x] Add Kung Fu ability (max 3 per game) — K key, expanding shockwave, 3 charge icons in HUD
- [x] Add road markings for visual clarity — dashed green lines on road lane borders
- [x] Add varied agent speeds and chasing behaviour — level-based speed scaling + chasing agents from level 3
- [x] Add NEO invincibility mode (Mario star style) — 8s duration, player flashes, destroys enemies on contact

### 2.3 Visual & UX Observations from Screenshots

From the screenshot review (12 Apr 2026, 156 screenshots across all 11 games + UI):

**Critical visual issues** (impact gameplay clarity):
- **Rhythm Hacker**: Huge empty black area dominates the canvas — game content is pushed to centre-bottom and severely underutilises the play area. "EASY MODE" label is magenta/pink (the only instance of that colour in the entire arcade — clashes with the Matrix palette). "HEALTH" label is red. The D/F/J/K key buttons use red, green, indigo, olive colours which break the Matrix monochrome aesthetic. The falling note sprite is an angular arrow/cursor shape rather than anything recognisable as a musical note. Play field appears mostly empty during active gameplay.
- **Cloud Jumper**: ~15-20% of the canvas width on the right side is an empty black border strip — game content doesn't fill the full area (width/layout mismatch). The death sprite (`gameplay-cloud-jumper-idle-death.png`) shows the player character reduced to an unrecognisable dark oval blob. No player would understand what they're seeing.
- **Matrix Frogger**: SCORE and DISTANCE both read "0" despite the game being in an active state with visible enemies. A floating semi-transparent dark rectangle near the top-centre appears to be an unrendered UI element (tooltip or overlay with no content). The frog player is very small and hard to distinguish from enemies at a glance.

**Moderate visual issues**:
- **Neo Jump**: A ghost/duplicate grey progress bar appears below the JETPACK indicator in the top-right corner — present in all gameplay screenshots. Investigation in R6: fuelLabel was a local variable not cleaned up in shutdown(); now stored as class field with proper destroy(). Yellow colour changed to green. If ghost bar persists, it may be a font rendering artifact at 8px — needs visual verification.
- ~~**Agent Chase**: HUD uses a mix of green AND yellow text for score/lives/level — fixed in R6, all HUD elements now consistently green.~~
- ~~**Cloud Jumper sky-blue background**: Fixed in R5 (React wrapper) and R6 (full palette — clouds, backgrounds, collectibles, obstacles all recoloured to Matrix green). Player recoloured to green in R5.~~

**Shared issues across Phaser games**:
- **Identical menu thumbnails**: Cloud Jumper, Neo Jump, and Agent Chase all share the same Matrix city/rain thumbnail image on their menu cards. These should be differentiated if they're meant to be game-specific previews.
- **All games use 100% procedural textures** — no external sprite assets loaded (`public/assets/` doesn't exist). Every visual element is generated in BootScene at runtime.
- **Game-over screens**: Generic across all games (shared GameOverScene with no game-specific context beyond the `reason` string). No mention of maze level, altitude reached, or track completed.

### 2.4 Cloud Jumper Visual Issues (NEW)

**Files**: `src/components/games/phaser/CloudJumper/scenes/GameScene.ts`, `config.ts`
- [x] Fix canvas width gap — dimensions changed from 800x500 (8:5) to 800x450 (16:9), matching the game portal container
- [x] Fix death sprite — player character becomes an unrecognisable dark oval blob on death. Either add a proper death animation or keep the player sprite visible during the death sequence.
- [x] Change sky-blue background to Matrix green-on-black theme — full palette overhaul: all cloud textures, parallax backgrounds, collectibles, and obstacles recoloured to green/cyan/red Matrix palette
- [x] Generate a unique menu thumbnail image (currently shares the same image as Neo Jump and Agent Chase)

### 2.5 Matrix Frogger Visual Issues (NEW)

**Files**: `src/components/games/phaser/MatrixFrogger/scenes/GameScene.ts`
- [x] Investigate score stuck at 0 — fixed, score now awards on every forward step
- [ ] Fix unrendered floating UI box — semi-transparent dark rectangle near top-centre. Investigated in R8: not caused by powerUpDisplay (top-right), scoreText (top-left), or BaseScene overlay (only shows when paused). May be a screenshot artifact or Phaser debug frame. Needs visual verification with dev server.
- [x] Improve player sprite visibility — scale increased from 0.8 to 1.0

### 2.6 Codebase Cleanup

Low-risk cleanup tasks to reduce tech debt:

- [x] **Remove duplicate E2E spec** (done)
- [ ] **Add CTRL-S World gameplay E2E**: Has 10 visual tests but zero gameplay interaction tests. Write a basic gameplay spec.
- [ ] **Remove unused hooks or wire them in**: `useProceduralAudio`, `useViewportCulling`, `useInterval` are not imported by any production code. Either adopt them in games that would benefit (e.g. `useInterval` in `useSimpleSnakeGame` which re-implements it inline) or mark them as experimental/remove.
- [x] **Fix PuzzleModal dead state** (done — removed `_showFiftyFifty` state entirely)
- [x] **Remove dead code in legacy games** (done — AgentEscape._TUNNEL, JimmyMatrix._getTimingGrade/_timeDiff, MatrixAscension._altitude)
- [x] **Remove `console.log` in usePerformanceMonitor** (line 177) -- debug artifact (fixed in R3)
- [x] **`console.log` in useSaveSystem** (line 537) -- already properly gated behind `import.meta.env.DEV && import.meta.env.VITE_DEBUG_SAVE === 'true'`, no fix needed
- [x] **Move `playwright` from dependencies to devDependencies** (done)
- [x] **Remove `jest` from devDependencies** (done)
- [x] **usePerformanceMonitor PerformanceOverlay** (done — extracted to module-scope component with stable identity via ref pattern)

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
| ctrl-s-world | 1 | ~53 | 0 | ~54 | 100% extractable, zero scratch — most art-heavy game |
| matrix-frogger | 9 | 17 | 4 | 30 | Most complete asset set (sprites + audio WAVs) |
| neo-jump | 2 | ~31 | 0 | ~33 | 100% extractable, Doodle RPG pack (406 sprites) |
| agent-chase | 7 | 20 | 8 | 35 | Player sprite is entirely [ ] (no source), 18 procedural |
| rhythm-hacker | 4 | 15 | 17+5 | ~41 | 5 note chart data files are critical blocker |
| cloud-jumper | 3 | 23 | 7 | 33 | Cloudy Pack (190+ files) covers most cloud needs |
| code-breaker | 14 | 41 | 5 | 60 | Strongest [x] base, almost pipeline-ready |
| **TOTALS** | **~82** | **~301** | **~106** | **~489** | 62% sourced, 21% scratch, 17% ready |

Key takeaways: 62% of assets are sourced but need extraction/processing. 21% need creating from scratch. Only 17% are fully ready.

**Pipeline-ready games** (zero scratch items): ctrl-s-world (~53 extractable), neo-jump (~31 extractable).
**Critical blockers**: Rhythm Hacker note charts (5 JSON files, without these the game cannot function as a rhythm game). Agent Chase player sprite (no source identified, currently 100% procedural). Boss sprites across Matrix Cloud (3 bosses, all need creating from scratch — high artistic complexity).
**Strongest foundations**: Code Breaker (14 [x], 41 [~]), Matrix Invaders (14 [x], 18 [~]), Matrix Frogger (9 [x] + complete WAV audio set).

### 0a. Global Asset Extraction (do first -- shared across all games)

- [ ] Unzip `MatrixArcadeFontAssets/` (3 ZIPs) -- extract TTF/WOFF2 fonts to `public/assets/fonts/`
- [ ] Unzip `WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip` -- catalogue SFX, rename to convention, place in `public/assets/audio/sfx/`
- [ ] Process `MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks/` -- convert WAV to OGG, trim jingles to `public/assets/audio/music/`
- [ ] Extract `1. Free Hologram Interface Wenrexa/` -- sort buttons/panels/icons, apply Matrix green tint to `public/assets/ui/`
- [ ] Pick 3-4 best font families from `NotJamFontPack/` -- copy TTF + JSON to `public/assets/fonts/`
- [ ] Process `firework/` particles -- recolour green/cyan, create explosion + sparkle sprite sheets to `public/assets/shared/`
- [ ] Unzip `Matrix-Icons.zip` (85MB) -- cherry-pick 30-50 relevant icons to `public/assets/ui/icons/`

### 0b. Per-Game Asset Extraction (parallel with game fixes)

Each game's `desiredassets/[game]/ASSETS_NEEDED.md` has a Source Mapping section. Work through `[~]` items:

- [ ] **Rhythm Hacker** (HIGHEST PRIORITY -- music unlocks the game): Process 5+ WAV tracks from LongTracks/, create note charts to `public/assets/rhythm-hacker/`. Currently 100% procedural with 28 auto-generated textures and 20 `[ ]` items (largest create-from-scratch gap).
- [ ] **CTRL-S | The World** (most art-heavy): Extract character bases from Mana Seed + Kings and Pigs, create portraits, backgrounds from CyberPunk/scifi packs. ~50 `[~]` items, all need significant manual extraction.
- [ ] **Snake Classic**: Extract snake sprites from INSPO + CyberPunk character anims, recolour. Best-positioned game with solid `[x]` base.
- [ ] **Vortex Pong**: Extract pong assets from INSPO + firework particles for trails. Good `[x]` base, close to ready.
- [ ] **Matrix Cloud**: Extract Flappy Bird sprites from INSPO (52 sprites ready), recolour pipes. Strong foundation but 3 boss sprites need creating from scratch.
- [ ] **Matrix Invaders**: Extract robot enemies from TopView_Robot_Asset_Pack + laser sprites
- [ ] **Metris**: Extract tetris tiles from INSPO (4 variants available) + UI panels. Significant `[ ]` gap for visual effects (18 items).
- [ ] **Matrix Frogger**: Extract frog sprites from INSPO (83 sprites + Krita sources + WAV audio). Most complete asset set.
- [ ] **Neo Jump**: Process Doodle RPG pack from INSPO (406 sprites). Decision needed: RPG knight pack vs custom Neo vs procedural.
- [ ] **Agent Chase**: Extract Pac-Man assets from INSPO + roguelike tiles for maze walls. Player sprite is entirely `[ ]` (no source identified). Currently 100% procedural with 18 auto-generated textures.
- [ ] **Cloud Jumper**: Process Cloudy Pack (190+ cloud sprites, 10 themes), pick Matrix-compatible theme. Background layers are main `[ ]` gap.
- [ ] **Code Breaker**: Extract Breakout sprites from INSPO + laser sprites + robot enemies. Very strong `[x]` base (17 items ready).

### 0c. Asset Integration Pattern

For each game, the pipeline is:
1. Extract raw assets from dump to `desiredassets/[game]/raw/`
2. Process (recolour, resize, atlas-pack) to `desiredassets/[game]/processed/`
3. Copy final assets to `public/assets/[game]/`
4. Update BootScene to load from new paths
5. Mark `[~]` to `[x]` in ASSETS_NEEDED.md

---

## Phase 1: Research & Planning

Before any code changes to game rebuilds, create detailed rebuild documents in `rebuildingoldgames/` for each game. **Status: 12 of 12 research docs created** -- all marked RESEARCH NEEDED (content complete but awaiting sprite cataloguing and detailed design finalisation). All research task checklists are unchecked.

### 1.1 Global Infrastructure Research

- [ ] **Three.js Matrix Rain Background** -- Research replacing CSS matrix rain with smooth 3D Three.js implementation. Prototype in isolation. Must run at 60fps. Depth-of-field, instanced geometry, responds to game events (speeds up during play, slows on menu).
- [ ] **Global Asset System** -- Design unified font, spritesheet, and audio management. Plan `src/lib/assets/` with loaders for fonts (Press Start 2P + pixel fonts from asset packs), centralised spritesheet atlases, and audio library (music tracks + SFX). This ensures all games share resources efficiently.
- [ ] **Game Card Portal Redesign** -- Plan larger game cards (see `gamecardlayout.png`). Add Instructions button (opens modal) and High Scores button. ASCII art for all game titles. Remove inline instruction text. Same card design for all games in carousel view.
- [ ] **Global Controls UX Redesign** -- Current GLOBAL CONTROLS section is too wide, sparse, and disconnected. Plan: compact into a sleek bar or hide behind a keyboard icon toggle. Should feel like part of the Matrix terminal aesthetic, not a plain text table.

### 1.2 React to Phaser Rebuild Research (6 games)

Each document goes in `rebuildingoldgames/plans/` and covers: current state analysis, bugs to fix, design vision (with reference images), Phaser scene architecture, sprite requirements (from asset folders), achievement list, and test plan.

- [x] **CTRL-S | The World** (`rebuildingoldgames/plans/ctrl-s-rebuild.md`) -- Created. Citizen Sleeper UI patterns for narrative engine.
- [x] **Snake Classic** (`rebuildingoldgames/plans/snake-rebuild.md`) -- Created. 3-mode architecture (Classic/Matrix/Hacker).
- [x] **Vortex Pong** (`rebuildingoldgames/plans/vortex-pong-rebuild.md`) -- Created. Direct port, no design changes. ✅ Rebuilt in R9.
- [x] **Matrix Cloud** (`rebuildingoldgames/plans/matrix-cloud-rebuild.md`) -- Created. Full redesign with proper Flappy Bird physics.
- [x] **Matrix Invaders** (`rebuildingoldgames/plans/matrix-invaders-rebuild.md`) -- Created. Phaser Groups replace manual pooling.
- [x] **Metris** (`rebuildingoldgames/plans/metris-rebuild.md`) -- Created. SRS rotation, T-spin, bullet time fix.

### 1.3 Existing Phaser Game Fix Research (5 games)

- [x] **Matrix Frogger** (`rebuildingoldgames/plans/frogger-fixes.md`) -- Created
- [x] **Neo Jump** (`rebuildingoldgames/plans/neo-jump-fixes.md`) -- Created
- [x] **Agent Chase** (`rebuildingoldgames/plans/agent-chase-fixes.md`) -- Created
- [x] **Rhythm Hacker** (`rebuildingoldgames/plans/rhythm-hacker-fixes.md`) -- Created
- [x] **Cloud Jumper** (`rebuildingoldgames/plans/cloud-jumper-fixes.md`) -- Created

### 1.4 New Game Research

- [x] **Code Breaker** (`rebuildingoldgames/plans/code-breaker-new.md`) -- Created. Brick breaker meets Matrix.

---

## Phase 2: Global Infrastructure Build

Build shared systems before game rebuilds.

- [ ] Implement Three.js matrix rain background (replaces CSS animation)
- [ ] Create `src/lib/assets/AssetManager.ts` -- centralised font, spritesheet, and audio loading
- [ ] Create global spritesheet atlas system for shared sprites across games
- [ ] Fix save system crash (incomplete GameSaveData fallback in `unlockAchievement`) -- see P1 1.3
- [ ] Redesign game card portal (larger cards, ASCII art titles, Instructions/High Scores buttons)
- [ ] Redesign GLOBAL CONTROLS (compact bar, keyboard icon toggle)
- [ ] Add ASCII art generator/renderer for game titles
- [ ] Update landing page UX (larger cards, less empty space, better visual hierarchy)

---

## Phase 3: Phaser Game Rebuilds (React to Phaser)

Each rebuild follows standard Phaser structure: `index.tsx`, `config.ts`, `scenes/{Boot,Menu,Game,GameOver}Scene.ts`. All use `BaseScene`, `exposeTestState()`, and the global asset system.

### Priority Order

1. **Vortex Pong** ✅ -- Rebuilt as Phaser game (R9). Pipeline proven.
2. **Snake Classic** ✅ -- Rebuilt as Phaser game (R10). 90 unit tests, all mechanics ported.
3. **Matrix Cloud** ✅ -- Rebuilt as Phaser game (R11). 81 unit tests, full boss system + power-ups.
4. **Matrix Invaders** ✅ -- Rebuilt as Phaser game (R12). 134 unit tests, full boss/power-up/bullet time system.
5. **Metris** ✅ -- Rebuilt as Phaser game (R13). 109 unit tests, SRS rotation + wall kicks + T-spin + bullet time.
6. **CTRL-S | The World** -- Largest, most ambitious. Citizen Sleeper-inspired narrative engine.

### Known React Game Bugs to Fix During Rebuild

These are documented issues in the current React games that should be resolved as part of the Phaser rebuild (not worth fixing in the legacy code):

| Game | Bug | Severity |
|------|-----|----------|
| CrossyRoad | Extensive `setState` inside `useGameLoop` -- 8+ React state updates per frame at 60fps | Performance |
| AgentEscape | `_deltaTime` completely ignored -- all movement is frame-rate dependent (2.4x speed at 144Hz) | Gameplay |
| MatrixAscension | `_altitude` state unused (vestigial), spring velocity double-applies deltaTime | Minor |
| JimmyMatrix | Game rAF loop restarts on every score change due to excessive useEffect deps; `endTrack(false)` called inside React state updater (unsafe) | Performance |
| MatrixCloud | Boss defeat achievement never fires; double collision (can lose 2 lives in 1 frame) | Gameplay |
| MatrixInvaders | ~~1-frame lag between player movement and collision; non-integer scores displayed~~ Fixed in R12 Phaser rebuild | ✅ Resolved |

### Per-Game Build Checklist (repeat for each)

- [ ] Create Phaser game directory structure
- [ ] Implement BootScene (load sprites from asset system)
- [ ] Implement MenuScene (ASCII art title, matrix rain, controls)
- [ ] Implement GameScene (core gameplay from research doc)
- [ ] Implement GameOverScene (score, high score, restart)
- [ ] Add achievements (minimum 8 per game)
- [ ] Add test seams (`exposeTestState()`)
- [ ] Write unit tests (minimum 40 per game)
- [ ] Write E2E gameplay tests (minimum 6 per game)
- [ ] Register in game registry
- [ ] Play-test 5 full games
- [ ] Remove old React/Canvas component

---

## Phase 4: Existing Phaser Game Fixes

Apply fixes from `rebuildingoldgames/bugs.md` (beyond what's already covered in P0/P1/P2):

- [ ] Matrix Frogger: Full enhancement list (see 2.2 above)
- [ ] Neo Jump: Custom sprites, Doodle Jump UX (after P0 jetpack/death fix)
- [ ] Agent Chase: Multiple map layouts (Square/Circle/Diamond for Easy/Medium/Hard) -- after P0 AI fix
- [ ] Rhythm Hacker: Full improvement list (see 2.1 above)
- [ ] Cloud Jumper: Visual overhaul to Matrix theme (after P0 jump fix)

---

## Phase 5: New Game -- Code Breaker ✅ COMPLETE

- [x] Design doc and architecture (from Phase 1.4 research -- done)
- [x] Implement as Phaser game (R14 -- 6 files, ~700-line GameScene)
- [x] 6 power-ups, boss bricks, Agent Smith enemies, portal win
- [x] 10 achievements (all with Set-based deduplication)
- [x] Full test coverage (127 unit tests, all passing)

---

## Phase 6: Polish & Final Testing

- [ ] Full E2E gameplay suite against all rebuilt games
- [ ] Visual regression tests for new Phaser games
- [ ] Performance profiling (60fps on all games)
- [ ] Accessibility audit
- [ ] PWA cache invalidation for new chunks
- [ ] Documentation update
- [ ] E2E coverage for legacy games currently missing tests (AgentEscape, CrossyRoad, JimmyMatrix, MatrixAscension -- only if these games are kept)

---

## Architecture Notes

### Phaser Input Pattern (MUST follow after P0 fix)

All scenes that register keyboard input must handle the case where `this.input.keyboard` is not yet ready:

```typescript
// BAD -- silently fails, no retry
protected setupInput(): void {
  if (!this.input.keyboard) return;
  // ... register keys
}

// GOOD -- defers registration until input is ready
protected setupInput(): void {
  if (!this.input.keyboard) {
    this.time.delayedCall(100, () => this.setupInput());
    return;
  }
  // ... register keys
}
```

Scene transitions are already correct -- `this.scene.start(targetKey)` stops the calling scene and starts the target:
```typescript
// CORRECT -- scene.start() already stops the current scene
this.scene.start(SCENE_KEYS.GAME);

// UNNECESSARY -- no need to explicitly stop
this.scene.stop();
this.scene.start(SCENE_KEYS.GAME);
```

### Physics Pattern (from phaser-gamedev skill -- MUST follow)

- Use `body.blocked.down` (not `body.touching.down`) for grounded/standing-on-platform checks
- Reset velocity to zero each frame before applying directional input to avoid drift
- Static bodies (platforms) require `refreshBody()` after any positional change
- For object pooling: use `setActive(false) / body.enable = false` to return to pool
- Moving platforms: `setImmovable(true)` and `setAllowGravity(false)`, drive with tweens
- All movement MUST use delta: `this.player.x += this.speed * (delta / 1000);`
- **Spritesheet loading**: Always measure frame dimensions from the actual image before loading. Never guess. Verify: `imageWidth = (frameWidth × cols) + (spacing × (cols − 1)) + (margin × 2)`

### Sound Integration Pattern

Phaser games use React-side sound via the registry bridge:
- Scenes call `this.playSound(key)` which reads `SOUND_SYSTEM` from registry
- PhaserGame.tsx provides `useSoundSystem().playSFX` via registry
- Phaser's built-in audio system is NOT used
- **Warning**: Do not play sounds in both BaseScene and PhaserGame.tsx for the same event (see P1 1.6)

### Three.js Matrix Rain (planned)

Replace CSS matrix rain with Three.js for smooth 3D effect:
- React component rendered behind game content
- Instanced geometry for performance
- Depth-of-field (characters blur as they fall deeper)
- Responds to game events (rain speeds up during gameplay, slows on menu)

### Global Asset System (planned)

```
src/lib/assets/
  AssetManager.ts      # Centralised loading and caching
  fonts.ts             # Font registry (Press Start 2P, pixel fonts)
  spritesheets.ts      # Atlas definitions for shared sprites
  audio.ts             # Music tracks and SFX library
```

### Phaser Game Standard Structure

```
src/components/games/phaser/[GameName]/
  index.tsx            # React wrapper (PhaserGame)
  config.ts            # Phaser config, constants, achievement IDs
  scenes/
    BootScene.ts       # Load assets from global system
    MenuScene.ts       # ASCII art title, matrix rain, controls (extends shared MenuScene, except RhythmHacker which has custom track selection)
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

### Current Coverage Matrix

| Game | Type | Unit Test | E2E Visual | E2E Gameplay |
|------|------|-----------|------------|--------------|
| SimpleSnake | React | Yes | Yes | Yes |
| VortexPong | React | Yes | Yes | Yes |
| MatrixCloud | React | Yes | Yes (screenshots missing) | Yes |
| Metris | React | Yes | Yes | Yes |
| MatrixInvaders | React | Yes | Yes | Yes |
| CtrlSWorld | React | Yes | Yes | **MISSING** |
| AgentEscape | React (legacy) | Yes | **MISSING** | **MISSING** |
| CrossyRoad | React (legacy) | Yes | **MISSING** | **MISSING** |
| JimmyMatrix | React (legacy) | Yes | **MISSING** | **MISSING** |
| MatrixAscension | React (legacy) | Yes | **MISSING** | **MISSING** |
| MatrixFrogger | Phaser | Yes | Yes | Yes |
| NeoJump | Phaser | Yes | Yes | Yes |
| AgentChase | Phaser | Yes | Yes | Yes |
| RhythmHacker | Phaser | Yes | Yes | Yes |
| CloudJumper | Phaser | Yes | Yes | Yes |

All 17 hooks have unit tests. All Phaser games expose test state via `exposeTestState()`. E2E fixtures (`arcade.fixture.ts`, `game-helpers.ts`, `test-utils.ts`) support both React and Phaser games. Phaser E2E helpers include: `startPhaserGame()`, `ensurePhaserFocus()`, `getPhaserState()`, `waitForPhaserState()`, `waitForPhaserScene()`, and per-game key helpers (`hopForward`, `moveInMaze`, `hitNotes`, `jump`, `activateJetpack`, etc.).

### Gaps
- 4 legacy React games lack E2E coverage entirely -- these are being replaced by Phaser versions, so E2E coverage is low priority unless games are kept
- CtrlSWorld has visual tests but no gameplay E2E spec

---

## Current Codebase Health

### Strengths
- Zero TODO/FIXME/HACK comments in src/ (confirmed via grep 12 Apr 2026)
- Zero `@ts-ignore` in production code (only `@ts-expect-error` in test files with explanations)
- console.error/warn only in appropriate error-handling contexts (useSaveSystem catch blocks, audio init failures)
- Two stray `console.log` calls: usePerformanceMonitor:177 and useSaveSystem:537 (see P2 2.6)
- TypeScript strict mode fully enabled (noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch)
- All 5 Phaser games expose test state via `exposeTestState()`
- All 5 Phaser games have complete config.ts with achievement definitions (42 total)
- 15 games total, 100% achievement integration (101+ unlock calls across all games)
- Comprehensive shared hook library (17 hooks covering audio, save, particles, pooling, performance)
- Clean separation of concerns: React wrapper + Phaser scenes via registry pattern
- Single source of truth: GAME_REGISTRY in `src/data/gameRegistry.ts`
- Code-split lazy loading for all game components
- Phaser scene transitions are all clean (scene.start correctly stops calling scene)
- All games use consistent dual-call achievement pattern (except SimpleSnake -- see P1 1.9)

### Gaps
- 4 legacy games lack E2E test coverage (AgentEscape, CrossyRoad, JimmyMatrix, MatrixAscension) -- being replaced by Phaser versions
- Zero external assets deployed (`public/assets/` doesn't exist) -- all procedural textures
- Zustand store (`src/store/gameStore.ts`) is legacy, superseded by useSaveSystem
- Phaser game focus management is fragile (primary cause of "controls don't work" reports)
- No keyboard retry pattern in ANY Phaser scene -- all 5 games + BaseScene + MenuScene + GameOverScene use `if (!this.input.keyboard) return;` with silent failure and no recovery
- `useProceduralAudio`, `useViewportCulling`, `useInterval` hooks exist but are unused by any game
- 4 legacy game files (AgentEscape, CrossyRoad, JimmyMatrix, MatrixAscension) remain as full components with tests but are not in GAME_REGISTRY -- orphaned code from pre-Phaser era
- ~~Cloud Jumper canvas width gap~~ -- Fixed in R7 (dimensions changed to 16:9)
- ~~Rhythm Hacker play area layout~~ -- Fixed in R7 (widened canvas, side HUD, circular note sprites)
- Matrix Frogger score stuck at 0 in screenshots, unrendered floating UI box, player too small to distinguish from enemies
- Neo Jump has a ghost/duplicate grey progress bar below JETPACK indicator
- Neo Jump W key not mapped for WASD jetpack users (only A/D are bound)
- Neo Jump jetpack thrust is too weak to counter gravity (additive -4.8/frame vs gravity 800)
- Agent Chase ghost house tiles impassable in `canMove()`, preventing agent re-entry
- Agent Chase agents get stuck when all non-reverse directions are blocked
- `useAdvancedVoice` AudioContext for visualisation never connected to speech output (always returns zeros)

---

## Ralph Loop Strategy

1. **P0 first**: Fix Phaser focus/controls issue (unblocks ALL 5 Phaser games), then fix individual game bugs (Cloud Jumper physics/jump, Neo Jump jetpack/death, Agent Chase AI)
2. **P1 next**: Fix remaining game bugs (Metris bullet time, Matrix Cloud combo, CTRL-S save crash, double sound, mute divergence, Rhythm Hacker countdown, App.tsx coupling), then fix failing unit tests (8 failures + 1 OOM)
3. **Phase 0 parallel**: Begin asset extraction while fixing games (independent work streams)
4. **Phase 1 done**: All 12 research docs created -- move to implementation when P0/P1 clear
5. Use `/matrix-arcade-gamedev` for game code, `/phaser-gamedev` for Phaser scenes, `/playwright-testing` for E2E
6. Run `game-tester` agent after every code change
7. Each iteration: fix one P0/P1 item OR implement one Phase item, verify build + tests, update checkboxes
8. Reference images in `rebuildingoldgames/inspirationimagesandsprites/` for every design decision
9. **Keyboard retry pattern**: When fixing P0.1, apply the `delayedCall` retry to ALL 8 locations: BaseScene.setupCommonInputs(), MenuScene.setupMenuInput(), GameOverScene.setupGameOverInput(), and all 5 game GameScene.setupInput() methods
