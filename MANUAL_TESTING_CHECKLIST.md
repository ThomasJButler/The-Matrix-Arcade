# MAGIC DOC: [Manual Testing Checklist — The Matrix Arcade]

Hand-run testing checklist for all 12 games + shared arcade systems. **NOT for Ralph's loop** — this is Tom's personal QA aid. Duplicate + date-stamp for each testing session.

## How to use

1. Copy this file → rename with a date, e.g. `testing-sessions/2026-04-18.md`.
2. Play each game from a cold start (refresh browser before each session — catches first-load bugs).
3. Tick items as you go; leave notes inline.
4. After each game, fill the **Notes / improvement ideas** section while it's fresh.
5. Anything critical → log in `IMPLEMENTATION_PLAN.md` under `### R8X Discovered Work` for the next loop.

---

## Global Checks (all 12 games)

> For each game, run through this list. If an item fails, note which game(s).

### Launch & Menu Flow
- [ ] Loads without console errors (open DevTools, check)
- [ ] Launches from landing page card without freeze
- [ ] MenuScene appears first (does NOT skip to gameplay)
- [ ] Menu controls (ENTER/SPACE to start) respond
- [ ] 5-second countdown fires correctly after menu
- [ ] Gameplay begins cleanly post-countdown

### Controls
- [ ] Keyboard controls all respond
- [ ] Mouse controls work (where applicable — note games that support mouse)
- [ ] Numpad keys work (Code Breaker specifically)
- [ ] Alt keys (WASD vs arrows) both work
- [ ] No keys get "stuck" on rapid inputs

### Pause & Resume
- [ ] P key pauses — game logic freezes visibly (enemies stop, timers pause)
- [ ] Pause overlay renders correctly
- [ ] P again resumes — game logic actually resumes (not just overlay gone)
- [ ] Keyboard input still works after resume

### Death & Game Over
- [ ] Death triggers Game Over scene correctly
- [ ] Game Over screen shows correct final score
- [ ] If score qualifies top-25: initials entry prompt appears
- [ ] Initials entry: ↑↓ cycle A-Z, ←→ move slots, ENTER confirms
- [ ] R key restarts from Game Over
- [ ] Q key / menu button returns to portal

### Audio
- [ ] SFX fire at correct moments (no dead sounds, no missing triggers)
- [ ] Background music plays during game
- [ ] BGM stops when returning to landing page (no overlap)
- [ ] M key toggles mute (both SFX and BGM)
- [ ] Volume feels balanced — no clipping, no inaudibly quiet

### Visual & Performance
- [ ] Feels 60fps — no stutter, hitching, or slow zones
- [ ] No sprite flicker, no z-order issues (foreground/background correct)
- [ ] No off-screen rendering bugs
- [ ] Screen shake feels punchy, not nauseating (R81 juice pass)
- [ ] Particle effects don't obscure gameplay

### Scoreboard Integration (R77)
- [ ] High score persists across sessions (refresh, replay, verify)
- [ ] New high score correctly identified (triggers "NEW HIGH SCORE" only when earned)
- [ ] Score appears in Scoreboard modal (landing page → HIGH SCORES)
- [ ] Attract mode shows this game's scores when idle on landing

### Exit
- [ ] ESC exits to portal cleanly
- [ ] No lingering audio, no ghost scenes on next launch

---

## Per-Game Checklists

### 1. Snake Classic
**Location**: `src/components/games/phaser/SnakeClassic/`

- [ ] Arrow keys turn snake (NOT WASD only — both)
- [ ] Food pickup: score up, snake lengthens
- [ ] Self-collision kills
- [ ] Wall behaviour correct (death OR wrap — check config)
- [ ] Snake doesn't die on direct 180° input (rejects reverse)
- [ ] Speed tier transitions trigger (audio cue per R81)
- [ ] Food pickup juice feels satisfying (R81 pass)
- [ ] Power-ups collect + visibly activate (if any)
- [ ] Canvas size fits portal frame (PG1 fix from R76.3)

**Notes / improvement ideas**:
```
(your thoughts here)
```

---

### 2. Vortex Pong
**Location**: `src/components/games/phaser/VortexPong/`

- [ ] Player paddle moves with ↑↓ / W/S
- [ ] AI paddle actually tracks ball (PG2 fix from R76.2 — was broken)
- [ ] AI difficulty feels fair (not too easy, not unwinnable)
- [ ] Scoring works both sides
- [ ] Power-ups spawn and collect
- [ ] All 4 power-ups have distinct effects (verify: multiball, speed, enlarge, etc.)
- [ ] R key restart persists score correctly
- [ ] Paddle hit juice — shake + particle trail (R81)
- [ ] Goal scored: flash + pop animation

**Notes / improvement ideas**:
```
(your thoughts here)
```

---

### 3. Matrix Bird (formerly Matrix Cloud)
**Location**: `src/components/games/phaser/MatrixCloud/` (folder unchanged, display name only)

- [ ] Display name shows "Matrix Bird" everywhere (registry, card, game header)
- [ ] SPACE / click / ENTER all flap
- [ ] Pipes procedurally spawn with fair gaps
- [ ] Death on pipe collision
- [ ] Death on ground touch
- [ ] Score increments on pipe pass
- [ ] Power-ups spawn ≥80px from nearest pipe (PG4 fix)
- [ ] Obstacle ("troll") frequency feels fair — max 4 simultaneous (PG5 fix)
- [ ] Score milestone stinger audio (R81)
- [ ] Wing-flap SFX variation (R81)

**Notes / improvement ideas**:
```
(your thoughts here)
```

---

### 4. Matrix Invaders
**Location**: `src/components/games/phaser/MatrixInvaders/`

- [ ] Arrow / A+D move player left/right
- [ ] SPACE fires
- [ ] Bullet time (B) actually activates — slow-mo + audio filter (PG7 was null-guard bug, verify)
- [ ] Bullet time drains visibly, refills correctly
- [ ] Wave clears trigger next wave
- [ ] Enemy sprites visibly shrunk by 20% + per-row colour tint (PG6)
- [ ] Boss (if any) fires correctly
- [ ] 6 power-ups each collect + activate
- [ ] Enemy hit juice — shatter particles (R81)
- [ ] Muzzle flash on player fire (R81)

**Notes / improvement ideas**:
```
(your thoughts here)
```

---

### 5. Metris
**Location**: `src/components/games/phaser/Metris/`

- [ ] All 7 tetrominos rotate cleanly (↑ / X / W — all rotate CW)
- [ ] Z / SHIFT rotate CCW
- [ ] ← → move left/right, ↓ soft drop, SPACE hard drop
- [ ] C holds piece and swaps cleanly
- [ ] B key triggers bullet time (verify: PG7 was null-guard bug)
- [ ] Bullet-time meter fills on line clears
- [ ] Line clear cascade per row (R81 juice)
- [ ] Hard drop: impact shake + dust particles (R81)
- [ ] Level-up: colour shift + rank-up fanfare (R81)
- [ ] Game-over: flash white → fade (R81)

**Notes / improvement ideas**:
```
(your thoughts here)
```

---

### 6. Matrix Frogger
**Location**: `src/components/games/phaser/MatrixFrogger/`

- [ ] Arrows / WASD advance/retreat/side-step
- [ ] K key triggers Kung Fu (PG8 was null-guard bug, verify)
- [ ] Kung Fu has 3-use limit displayed
- [ ] Finish line triggers level-up
- [ ] Chasing agents pursue correctly
- [ ] 25° camera tilt reads as 3D (R76.9)
- [ ] Vehicle scale 0.6→1.0 across lanes
- [ ] Road dashes animate in alternating directions
- [ ] Water shimmer visible
- [ ] Row advance: score pop + whoosh (R81)
- [ ] Kung-fu hit: hitstop + impact flash (R81)
- [ ] Hit-boxes feel right — no ghost hits from scaled-back cars

**Notes / improvement ideas**:
```
(your thoughts here)
```

---

### 7. Neo Jump
**Location**: `src/components/games/phaser/NeoJump/`

- [ ] ←→ / A+D move horizontally
- [ ] UP / W triggers jetpack
- [ ] SPACE shoots projectile
- [ ] Platforms: auto-jump on landing
- [ ] **Falling off-screen kills player** (PG10 — was broken, verify fix holds)
- [ ] R key restart works post-death (PG11)
- [ ] Bombs visible but not oversized (PG12 — shrunk 30%)
- [ ] 5-layer parallax smooth at 60fps (R76.9)
- [ ] Altitude milestone chime (R81)
- [ ] Jump squash anim + puff on release (R81)

**Notes / improvement ideas**:
```
(your thoughts here)
```

---

### 8. Agent Chase
**Location**: `src/components/games/phaser/AgentChase/`

- [ ] Arrows / WASD move cleanly
- [ ] **No wall-stutter** — slides along wall, buffered turn on corners (PG14)
- [ ] Dot collection ticks up score
- [ ] Power pellets freeze/scare agents
- [ ] **Bullet-time dots** (cyan) freeze agents for 2s (PG15 unique mechanic)
- [ ] Agent catches player → game over with shake (R81)
- [ ] Player + agent sprites at 28px (PG16, not 20px)
- [ ] Maze feels navigable, no invisible walls

**Notes / improvement ideas**:
```
(your thoughts here)
```

---

### 9. Rhythm Hacker
**Location**: `src/components/games/phaser/RhythmHacker/`

- [ ] Q / W / O / P lane keys (NOT D/F/J/K — rebinding per PG's bugs.md)
- [ ] Perfect / Great / Miss grading visible
- [ ] Combo counter visible + animates
- [ ] Health bar drains on miss, heals on hit
- [ ] Screen shake at 10 / 25 / 50 combos (R76.3)
- [ ] Matrix rain burst on combo milestones (R76.3)
- [ ] Cyan lane tinting at 25+ combo (R76.3)
- [ ] All 5 tracks playable (track selector works)
- [ ] BPM sync feels accurate per track
- [ ] R81 addition: perfect hit brighter flash, miss screen darken
- [ ] Track ends correctly (no infinite loop on track finish)

**Notes / improvement ideas**:
```
(your thoughts here — especially BPM tuning: Cyberpsychotic 140, Enhancements 160 unverified)
```

---

### 10. Cloud Jumper
**Location**: `src/components/games/phaser/CloudJumper/`

- [ ] SPACE / UP / W actually makes player jump (PG19 — was broken)
- [ ] 300ms jump cooldown (no spam)
- [ ] Clouds spawn dense enough to play (PG20 — was too sparse)
- [ ] Falling off-screen triggers death
- [ ] Height milestone audio chime (R81)
- [ ] Cloud land: fluffy bounce + puff particle (R81)
- [ ] Jump: wind whoosh + arc trail (R81)

**Notes / improvement ideas**:
```
(your thoughts here)
```

---

### 11. Code Breaker
**Location**: `src/components/games/phaser/CodeBreaker/`

- [ ] Arrow / A+D move paddle
- [ ] **Numpad 4 / 6 also move paddle** (PG21)
- [ ] SPACE launches ball
- [ ] Paddle collides with ball cleanly (no tunneling)
- [ ] Level 1 uses all 6 brick colours (PG22)
- [ ] Brick types: standard / tough / explosive visible
- [ ] All 6 power-ups trigger + work (laser, wide paddle, multiball, slow, strong, extra life)
- [ ] Ball launch: ready-pulse animation (R81)
- [ ] Brick hit: particle colour matches brick (R81)
- [ ] Level clear cascade (R81)

**Notes / improvement ideas**:
```
(your thoughts here)
```

---

### 12. CTRL-S World
**Location**: `src/components/games/phaser/CtrlSWorld/` (R80 rebuild)

- [ ] Loads from landing page card
- [ ] ASCII title renders at correct (large) size — no longer tiny
- [ ] Menu → first choice → prologue begins
- [ ] **Typewriter text reveals paragraph, waits for input** (R80 pacing fix — no auto-advance)
- [ ] SPACE / ENTER / click advances to next paragraph
- [ ] Blinking cursor visible
- [ ] Choice UI: ↑↓ navigate, ENTER confirms
- [ ] Choice selection: particle FX + smooth transition (R80.24 juice)
- [ ] Character portraits appear left/right, fade between speakers
- [ ] Environmental backgrounds visible per scene with parallax
- [ ] Puzzle overlay launches parallel to story (reuse PuzzleModal)
- [ ] Inventory (I key) shows items, descriptions readable
- [ ] Chapter hub visual select shows completion state
- [ ] Save system works — no `gameData.stats` crash (R80.15 fix)
- [ ] Shatner TTS narrates — syncs with typewriter, mute toggle works
- [ ] Ambient music per chapter, transitions smooth
- [ ] Character-specific typewriter ticks (bass = antagonist, treble = protagonist)
- [ ] Achievement unlocks fire (11 total, verify 2-3 unlock in a single playthrough)
- [ ] Full playthrough completes without error
- [ ] Chapter transitions feel weighty (R80.24)

**Notes / improvement ideas**:
```
(your thoughts here — Tom's R80 iteration area)
```

---

## Arcade-Level Checks (not per-game)

### Landing Page
- [ ] Matrix rain renders smoothly
- [ ] All 12 game cards visible
- [ ] Cards equal size (R76 G4 fix)
- [ ] HOW TO PLAY / HIGH SCORE / PLAY buttons readable
- [ ] PLAY is the most prominent CTA
- [ ] ABOUT button opens About modal (R76.4 G7)
- [ ] HIGH SCORES button opens Scoreboard (R77.3)
- [ ] ACHIEVEMENTS button opens AchievementDisplay (no page crush — R76.1 G3)
- [ ] Header nav keyboard accessible (Tab cycles through)

### Scoreboard (R77)
- [ ] All 11 tabs visible (CTRL-S excluded intentionally)
- [ ] Tab switching plays chip-tune blip
- [ ] Top-25 table renders with rank, initials, score, level, time, date
- [ ] Own scores highlighted with 1UP flash
- [ ] CRT toggle visually flips scanlines on/off
- [ ] RESET per tab — "WIPE" confirm works, other tabs unaffected
- [ ] ESC closes modal

### Attract Mode (R77.6)
- [ ] 10s idle on landing triggers attract mode overlay
- [ ] Cycles through 11 games showing top-5
- [ ] 5s per game, matrix rain + CRT ON
- [ ] ANY keypress / click dismisses + resets idle timer

### About Page (R76.4 G7)
- [ ] Opens via B key or header button
- [ ] 3 sections visible: About / Inspirations / Why I Built This
- [ ] Keyboard accessible
- [ ] ESC closes

### Save Load Manager
- [ ] Opens without crash on legacy save data (R78.11 fix for `gameData.stats?.gamesPlayed`)
- [ ] Export / Import JSON works
- [ ] Total play-time displays correctly

### Achievements
- [ ] Modal opens without "crushing the page" (R76.1 G3 fix)
- [ ] Focus trap works (Tab cycles within)
- [ ] ESC closes
- [ ] Toast notifications announce unlocks (aria-live)

### Mobile Warning
- [ ] Opens on 375×667 viewport (mobile)
- [ ] "DESKTOP REQUIRED" message clear
- [ ] aria-modal + role=dialog (R78.11)

---

## Cross-Session Observations

Use this section to capture things that appear across multiple sessions — patterns worth elevating to R8X Discovered Work.

```
(patterns, regressions, or ideas that surface more than once)
```

---

## Session Footer

- **Date**:
- **Build tested**: (commit SHA from `git log -1 --oneline`)
- **Browser**: (Chrome 133 / Safari / etc.)
- **Viewport**: (1280×800 standard, or noted deviation)
- **Bugs logged to plan**: (list R8X.N IDs if any were created)
- **Overall feel**: (one-sentence vibe check)
