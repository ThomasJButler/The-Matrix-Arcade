# MAGIC DOC: [Learnings — The Matrix Arcade Journey]

A personal log of what I learned building this project, from v1.0 (January 2025) to present. Written retrospectively from git history, implementation plan archaeology, and the scar tissue of bugs I won't make twice.

**Purpose**: Reference doc for me to revisit when I want to understand *how* something got built, or *why* a decision was made. Also a CV-grade artefact — concrete evidence of engineering thinking, not just features shipped.

**How to use**: Read top-to-bottom for narrative. Ctrl-F for a specific era or learning. Add to the "Ongoing Learnings" section as new ones surface.

---

## Timeline at a glance

| Era | Dates | What happened |
|-----|-------|---------------|
| **v1.0 weekend burst** | Jan 16–17, 2025 | Initial build, 30+ commits in one weekend, FlappyLink cut within hours |
| **Hotfix + hibernation** | Jan 20 – June 2025 | One hotfix (TransitionParticles removed), then quiet |
| **Return & depth** | June 28–30, 2025 | Test suite, Snake refactor, Terminal Quest 40+ nodes, CTRL-S World "epic interactive comedy" |
| **Metris + lifelines** | Oct 25–27, 2025 | Metris 10x upgrade, save system rollout, lifeline + sentient AI modals, v1.1 release |
| **Phaser migration** | Jan 26–27, 2026 | Rebuilt 5 buggy React-canvas games in Phaser 3, added autoStart, v1.9.8–v1.9.11 |
| **Round 2 polish** | Mar 30–31, 2026 | Fixed invaders, landing page, soft audio, **deleted Terminal Quest** |
| **The R-phase era** | Apr 1–15, 2026 | R62→R82 in ~15 days. Structured phases, autonomous loops, 435 commits total by now |

## Games that lived and died

What ships isn't what you start with. Games I cut or merged:

- **FlappyLink** — cut Jan 17, 2025 (day 2 of the project). Too narrow a concept, duplicate of Matrix Cloud
- **TerminalQuest + TerminalQuestCombat** — deleted March 30, 2026. Was the "text adventure" game, replaced by the richer CTRL-S World. This is the game that got confusingly referenced in R76.5's broken completion report
- **SimpleSnake, SnakeRenderer, SnakeHUD, SnakeClassic.old, SnakeClassicRefactored** — five different Snake implementations before settling on one
- **CrossyRoad → Matrix Frogger**, **AgentEscape → Agent Chase**, **MatrixAscension → Neo Jump**, **JimmyMatrix → Rhythm Hacker** — renamed during Phaser rebuilds
- **CtrlSWorldInteractive / CtrlSWorldContent.ts** — CTRL-S went through multiple architectures before the R80 Phaser rewrite

**Learning**: scope cuts are signals of discipline, not failure. Every deletion made the arcade better. Keep a mental budget for "games I'll cut later" when starting.

---

## Era 1 — The weekend burst (Jan 16–17, 2025)

I shipped v1.0 → v1.0.2 in one weekend. The repo went from "Initial commit" to a playable multi-game arcade with a merge-to-main PR in ~48 hours.

**What got built**:
- React + Vite + Tailwind foundation
- Matrix rain background
- First 6 games (Snake, Pong, CTRL-S, CrossyRoad, etc.)
- Landing page + game navigation
- Box-sizing CSS fix for layout

**The bumps**:
- **FlappyLink cut within hours**. Started as a separate game, turned out to overlap with Matrix Cloud. Gone.
- **Scaling hack on the HTML element**. Committed `apply scaling to HTML element` as a layout workaround — not proud of this in retrospect but it worked

**What I learned**:
- Shipping fast on a playground project is a feature, not a bug. It gave me 6 games to evaluate instead of 2 over-designed ones
- React is fine for canvas games at small scale — becomes a problem at larger scale (foreshadowing the Phaser migration)
- A single-weekend burst is sustainable ONCE — don't expect it twice

---

## Era 2 — The Feb hotfix and the lesson of TransitionParticles (Feb 27, 2025)

One hotfix commit in February: *"Hotfix - Removed TransitionParticles from the site, it was ruining the UX."*

I'd added particle transitions between games thinking it'd feel premium. Played it myself → it was nauseating. Cut it the same day.

**What I learned**:
- **Playtesting your own work is not optional**. Fancy effects don't survive contact with actual use
- Ship → playtest → be willing to cut → ship again. This is the feedback loop
- "Ruining the UX" is a valid commit message. Engineering is partly taste

This lesson came up again in R81 `juice-consultant`, which explicitly says: *"over-juice nauseates"*. I didn't know that principle had a name back in Feb 2025. I found it empirically.

---

## Era 3 — The first expansion (June 28–30, 2025)

After months of silence, I came back and added real weight:
- **Comprehensive unit test suite** — first time I'd tested this codebase properly
- **Snake Classic refactor** — 5 separate Snake implementations landed and got consolidated
- **Terminal Quest expansion** — 40+ story nodes
- **"Epic interactive CTRL-S World with developer comedy"** — the narrative game took its first serious shape

**The bumps**:
- **Five versions of Snake living in the repo simultaneously** (SimpleSnake, SnakeRenderer, SnakeHUD, SnakeClassic.old, SnakeClassicRefactored). This is what happens when you refactor without deleting the previous version "just in case"
- `useTypingEffect` had a memory leak — fixed in commit `5edd617` with improved character typing logic and cleanup

**What I learned**:
- **Delete old versions when you refactor**. The "just in case" backup is a trap — git has it, that's enough. Having 5 Snake files confused me when I came back to the code
- **Memory leaks in custom hooks are invisible until they're not**. If a hook sets up any recurring operation (setInterval, event listener, typewriter), it MUST return cleanup. This bit me multiple times later (R63 setTimeout leaks)
- Tests give you courage to refactor. I didn't refactor Metris confidently until I had tests

---

## Era 4 — The October 2025 maturity pass (Oct 25–27)

v1.1 released. Big quality-of-life additions:
- **Metris "10x upgrade"** — full Tetris mechanics (ghost piece, hold, T-spin)
- **Save system rollout across all games** — localStorage-backed, versioned
- **Lifeline system** — hints, skip, 50/50 for puzzle modals
- **SentientAI and CharacterConversation modals** — character dialogue inside CTRL-S World
- **PWA bumped** — installable on desktop
- **UK English spellings sweep** — discipline around localisation

**The bumps**:
- **Metris block-drop timing broken** — first with `setInterval`, then with `setTimeout` + ref pattern (`fc02595`), eventually with `setInterval` again (`08f5b33`). Classic "ref pattern vs interval" confusion in React hooks
- **Lifeline infinite loops** — `f4ab110` fix. Modal state + effect deps fighting each other
- **Landing page displays wrong game names in save manager** — `97ce209`. This becomes a bigger story later (R78.11 stale naming cleanup)

**What I learned**:
- **Timing-sensitive React hooks are genuinely hard**. The `useRef + setInterval` pattern is the right answer, but I got there via three wrong answers first
- **Versioned save data from day one is worth it**. Not having versions would have blocked the R80 save migration that fixed the `gameData.stats` crash
- Modal components with `onClose` in deps → infinite render loops → this becomes a recurring theme I eventually capture as a lint-warning exemption in R78.11

---

## Era 5 — The Phaser migration (Jan 26–27, 2026)

Five games had persistent bugs in React canvas — controls, rendering glitches, physics inconsistency. I rebuilt them in **Phaser 3**:
- CrossyRoad → **Matrix Frogger**
- MatrixAscension → **Neo Jump**
- AgentEscape → **Agent Chase**
- JimmyMatrix → **Rhythm Hacker**
- Plus **Cloud Jumper** (new)

**The bumps**:
- **Enter key UX issue** (`aeffd9c`). Had to add clickable START buttons because Enter wasn't reliably starting games. Later fixed properly with `autoStart` prop in `f0a686a`
- **autoStart prop regression** — added autoStart for 3 games, then 2 games froze on launch because they didn't have the prop (`5d9e3e5`). Bug introduced by the fix for the previous bug. Classic partial rollout
- **Phaser test mocks missing** — tests broke in jsdom because jsdom can't do WebGL. Had to stub all Phaser APIs (`1050b28`)
- **Keyboard focus race conditions** (`4e18b54`) — first glimpse of what became the full-blown R59–R72 keyboard saga

**What I learned**:
- **React canvas games are a trap at scale**. Phaser 3 gives you physics, scene lifecycle, input handling for free. Rebuilding 5 games in Phaser paid off 10x vs fighting React canvas
- **Progressive rollouts create asymmetric bug exposure**. When I added `autoStart` to some games but not others, the missing ones crashed. Either go all-in or not at all
- **Jsdom cannot run WebGL**. Mock Phaser at the module boundary (`src/test/setup.ts`) — this pattern survives to today
- **When a bug seems environmental** (Enter key not working in a specific browser state), look at focus management. Keyboard bugs usually trace to focus, not to the key handler itself

---

## Era 6 — Round 2 polish + the Terminal Quest deletion (Mar 30–31, 2026)

Pre-Ralph era, manual polish sweep. Noteworthy commits:
- `20774cc` — **"Remove Terminal Quest: delete game, save data, achievements, and tests"** — deleted the text adventure game entirely
- `0fa2cae` — **"Soften audio: switch to triangle oscillators and reduce volumes"** — audio was too harsh, switched from sine/square to triangle waves
- `ca52813` — **"Round 2 polish: fix invaders, persistent music, how-to-play, landing page"** — persistent music bug (music never stopping on game exit) was a thing long before R76 G2 codified the fix

**The bumps**:
- **Terminal Quest was in production for 9 months before I cut it**. I kept it because "I spent time on it" — classic sunk cost fallacy. Once I deleted it, CTRL-S World got clearer design space
- **Rhythm Hacker double notes** — `4347459` fix. Two notes firing for one user input. This class of bug comes up repeatedly in rhythm games — input deduplication matters
- **Terminal Quest's ghost haunted R76.5 months later** — Ralph's completion report incorrectly referenced "Terminal Quest visual polish" as a blocker when the game had been deleted months earlier. Ralph synthesised from old design docs that still mentioned it. Lesson: stale docs are hallucination fuel for LLMs

**What I learned**:
- **Delete games that don't earn their keep**. Terminal Quest was a sunk cost. The arcade is stronger without it
- **Procedural audio needs soft waveforms**. Triangle > sine > square > sawtooth for tolerable listening. I had to discover this by making it harsh first
- **When you delete something, delete EVERY reference**: save data, achievements, tests, docs, ALL of it. Half-deletions create ghosts

---

## Era 7 — The R-phase era begins (April 2026)

This is where the project shifted from "Tom codes on weekends" to "structured phases, documented, with autonomous execution". Every R-phase has a distinct personality.

### R62-R72 — The keyboard saga (days 1-5)

**The problem**: Phaser games had intermittent "controls don't work" reports. Enter to start would freeze. This spanned R59 (first report) through R72 (claimed fix) and was the hardest bug in the project.

**R61 identified 7 contributing factors** across different layers:
1. `setupInput()` deferred 100ms when `input.keyboard` null — no retry limit
2. "Click to play" overlay intercepted Enter/Space via `stopPropagation`
3. `autoStart={true}` skipped MenuScene entirely (this became a deliberate UX choice later)
4. Lazy loading delay + keyboard init race
5. `onExit` prop wasn't wired through
6. App.tsx global `preventDefault` blocked `window`-targeted events
7. Missing `shutdown()` in MenuScene/GameOverScene → ghost key handlers

**R62 fixed them all**, but...

**R69 re-opened the same bug** — scenes were accessing cursor keys without null guards. `this.cursors.up` threw silent TypeError → Phaser's update loop died → scene rendered but controls were dead. No console error visible because Phaser swallowed the exception.

**R72 added `if (!this.cursors) return;` guards** — fixed the crash.

**R75 revealed the guards were TOO BROAD** — they returned early from the entire `update()` method, freezing ALL game logic (physics, AI, rendering) for the ~500ms keyboard init window. Games looked frozen.

**R76.11 narrowed the guards** — wrap only the input-reading call, not the whole update. Physics/AI/rendering run unconditionally.

**What I learned**:
- **Silent TypeErrors are the worst bug class**. Phaser's update loop catches exceptions quietly. If your update tick starts throwing, the scene just stops without warning. Always guard async-initialised properties before reading them
- **Asynchronous initialisation needs defensive reads everywhere, not just at the entry point**. `waitForKeyboard()` was an async init; every single consumer of `this.cursors` needed a null guard
- **A fix that's too aggressive becomes a new bug**. R72 fixed the crash by returning early from ALL of update. That's a correct fix for input safety and a wrong fix for game liveness
- **Document the "Why" on every non-obvious guard**. Future you reading `if (!this.cursors) return` will want to know if this is a race-condition guard or a reachability check — they need different treatment

### R73-R75 — The planning maturation

Not a code era, but notable: this is when the implementation plan started getting Ralph-executable structure. Per-phase status lines, terminator grep patterns, checkbox-tracked tasks. Most of the Ralph infrastructure was built here.

**What I learned**:
- **Turning messy ambition into trackable tasks is its own craft**. Ralph's success rate depends on how well I scope each task
- **A terminator condition is the difference between "keep trying" and "we're done"**. Having an explicit machine-readable stop signal (Status line + grep) prevents the loop from spinning forever

### R76 — The playtest marathon (April 14)

Tom (me, writing retrospectively) did a comprehensive hand-playtest and surfaced 22 per-game issues + 6 global ones. R76 shipped **31 tasks across 5 iterations**, with 2 legitimately blocked on design input (PG9 + PG13 "better 3D visuals" needed my call on aesthetics).

**The bumps**:
- **"Always NEW HIGH SCORE!" bug across 7 games** — all games passed `undefined` as `highScore` to `gameOver()`, so `BaseScene` fell back to `highScore ?? score` (self-comparison always true). Ralph found this unaided during the R78.11 polish
- **Pause/resume regression re-opened in R76.8** — R76.1 thought it fixed pause/resume by adding `BaseScene.resumeGame()`, but the real bug was that `scene.pause()` suspends Phaser's input system so the P key couldn't fire to unpause. Replaced with `physics.pause()` + `tweens.pauseAll()` + `time.paused`
- **"Terminal Quest" in the completion report** — Ralph wrote PG9/PG13 as "Terminal Quest visual polish" in the R76 report. Terminal Quest had been deleted months earlier. Ralph hallucinated from design docs that still mentioned it

**What I learned**:
- **Playtesting AFTER autonomous work is non-negotiable**. Ralph can ship 31 tasks; I still need to play every game to find what's actually broken
- **Blocked-on-design-input is a healthy state**. Two tasks rightly stopped because they needed my taste. That's the system working as intended
- **LLMs hallucinate from stale docs**. Old design docs that reference deleted things become confusion fuel. Keep docs current or archive them

### R77 — Retro scoreboard shipped in a single commit (April 14)

A focused feature: 11 tabs, top-25 scores, 3-letter initials entry, attract mode, CRT filter, chip-tune SFX. Tom's design call was a delightful **"Matrix of course 😉"** — every detail was green.

Shipped as **one 10-task consolidated commit (`519edeb`)**. Ralph batched the whole feature rather than breaking into 10 individual commits.

**The bumps**:
- **Persistence layer deviation**: plan said `gameStore.ts` (Zustand), Ralph shipped on `useSaveSystem.ts`. Both are valid; the divergence just needed documenting in the archive
- **11 tabs, not 12** — CTRL-S excluded because narrative games have no meaningful scoreboard. Scope discipline

**What I learned**:
- **Big-bang consolidated commits are fine when the feature is cohesive**. Reviewability comes from good commit messages, not from splitting artificially
- **Let Ralph make architectural pivots** if they're better than the plan. My `gameStore` proposal wasn't wrong; Ralph's `useSaveSystem` choice was *more right*
- **Scope discipline at feature boundary**. Excluding CTRL-S from the scoreboard was correct. Including it "for completeness" would have been a worse feature

### R78 — The great no-op bug (April 14)

The bug that taught me more about autonomous orchestration than anything else.

**What happened**: I set up R78 as a 30-iteration overnight polish run. Kicked it off. 30 iterations completed. **ZERO commits landed**. Ralph iterated 30 times doing nothing useful.

**Why**: I wrote the R78 task list with `1.` `2.` numbered bullets instead of `- [ ]` checkboxes. Ralph's completion check in `PROMPT_build.md` grepped for unchecked `[ ]` items to find work. Found zero. Concluded "no work remaining". Exited iteration 1 with "R78_COMPLETE" in memory but never wrote it to the Status line. `loop.sh` kept looping because Status didn't contain the terminator phrase. 30 iterations of "read plan → nothing to do → exit → restart → nothing to do → exit".

**The fix** (R78 revival): replaced `1.` → `- [ ]` across all R78 tasks. Also added explicit rules:
1. Ralph's completion check uses checkbox count as its source of truth
2. Loop.sh uses Status line grep as ITS source of truth
3. If these two disagree → infinite no-op loop

**What I learned**:
- **Two sources of truth for "done" is a bug** — unify on one signal. Now every phase has BOTH checkbox tasks + an explicit terminator phrase, and the completion check writes the terminator when checkboxes hit zero
- **Test your loop harness with a known-good run before committing to 30 iterations**. One iteration would have caught this
- **"Kept running" is a distinct failure mode from "crashed"**. Silent compliance with no output is worse than a visible error — no breadcrumb trail
- **Autonomous loop orchestration is a craft**. The difference between R78 burning 30 iterations and R80 shipping a full flagship rewrite in 13 iterations was the task format, not the model

After the fix, R78.11 (continuous-improvement mode) ran beautifully — 22 polish commits including the "always NEW HIGH SCORE" fix and the cursor guard narrowing.

### R79 — Closeout pattern proven (April 15)

Tiny 3-task phase: Docker linux baselines, archive R78, straggler sweep. Ralph closed all 3 tasks in a single iteration with the terminator phrase auto-written. Loop.sh caught it and stopped immediately.

**What I learned**:
- **Small phases work**. Not every phase needs 25 tasks. A 3-task "closeout" phase is a valid shape
- **The "opposite pattern" design works**: R78 used continuous-improvement (never auto-terminate); R79 used complete-and-exit (auto-terminate on zero remaining tasks). Same `loop.sh`, same Ralph — different completion rules. This flexibility is what makes the orchestrator useful

### R80 — The CTRL-S flagship rewrite (April 15)

Biggest single phase in the project: full Phaser rewrite of CTRL-S World. 26 tasks, 13 iterations, 26 atomic commits. Shipped in one overnight run.

**Key design decisions** (collaborative pre-planning):
- **Stack**: Phaser 3 (consistent with 11 other games)
- **Content**: Port everything first, plan trim separately (migration vs editing — two different risks)
- **Pacing**: Full user control (SPACE/ENTER to advance each beat — fixed the "rushed" bug)
- **Audio**: Full soundscape (ambient + Shatner TTS + character SFX)
- **Hybrid modal architecture**: Phaser scenes + existing React modals via event bridge

**The bumps**:
- **R80.9 asset sourcing task inserted mid-plan**. I forgot this was needed until after the plan was written. Had to renumber 16 tasks downstream. Lesson: remember asset needs during planning
- **R80 "deviated" on architecture**: planned a pure Phaser game, shipped a Phaser+React hybrid because the existing modals had too much accessibility work invested
- **48 assets deployed from 40+ items** — Ralph sourced MORE than minimum from the dump folder. Not a bug but notable

**What I learned**:
- **Big tasks ship in small atomic commits**. Ralph batched ~2 tasks per shell iteration but committed each task separately. Result: readable history, efficient runtime. That's the pattern
- **Editorial judgment stays with humans**. The content-trim work got deferred to R81 because "which scenes to cut" is taste, not engineering. Ralph handles migration, I handle taste
- **Existing investment is a reason to stay hybrid**. If a React modal has `useFocusTrap` + proper ARIA, porting to Phaser would throw away 40 hours of accessibility work. Keep it, bridge to it
- **The content map (R80.1) was the highest-leverage task**. Getting the scene/branch/choice structure documented before porting made the 5 chapter ports (R80.5-7) fast. Planning tasks before coding tasks = compounding returns

### R81 — Juice polish across the arcade (April 15)

Applied `juice:juice-audit` + `juice:juice-recipe` plugin patterns to all 11 non-CTRL-S games. 14 tasks, closed in single overnight run.

**What got added across 11 games** (~55 micro-improvements total):
- Screen shake on impacts (80ms / 0.008 intensity — the "satisfying" sweet spot)
- Particle bursts on collectibles/kills (lifespan 400ms, scale easeOut)
- Hitstop on big hits (50-80ms time-freeze)
- Audio stingers per key moment (< 200ms procedural chip-tune)
- Score pop animations
- Death shake + slow-mo + distort patterns

**What I learned**:
- **"Juice" is a real engineering craft, not fluff**. Each game feels noticeably better because of it. I didn't know what "juice" meant as a technical term before this project
- **The `juice-audit` → `juice-recipe` pattern is powerful**: diagnose what's flat, get a specific recipe, ship it. This is repeatable
- **Over-juice nauseates**. Screen shake > 200ms / 0.015 intensity is the nausea threshold. Respect the ceiling
- **Juice compounds**. A game with five small polish moments feels 10x better than one with five separate features

### R82 — iPod Classic card redesign (in progress as I write this)

Current phase. 12 tasks. Using `frontend-design:frontend-design` skill explicitly for production-grade visuals, avoiding generic AI aesthetics. Goal: landing page cards become iPod Classic device visuals with clickwheel navigation.

---

## Meta-learnings (cross-cutting themes)

### On autonomous loops
- **Checkbox state is a cheap orchestration signal** — `- [ ]` vs `- [x]` gives Ralph a clear task queue without needing complex state
- **Terminator phrases are machine-checkable stop signals** — grep for a specific phrase on the Status line; either phase-specific or cross-phase pattern (`\bCOMPLETE\b`)
- **Two-pattern orchestration works**: complete-and-exit (small, defined phases) vs continuous-improvement (open-ended polish). Same infrastructure, different prompts
- **Ralph needs scoping, not commanding**: give him a task list with clear file paths + acceptance criteria, not step-by-step instructions. He fills in the steps
- **Iteration caps are safety nets, not targets**. Most phases finish well under cap. 30-loop caps for 25-task phases give breathing room

### On engineering discipline
- **Delete old versions when you refactor** — 5 Snakes in the repo at once was a smell
- **Version your save data from day one** — migrations are easy; un-versioned data is impossible
- **Guard async-initialised properties everywhere they're read** — not just at init
- **Two sources of truth = bug factory** — unify on one signal (Status line, not checkbox count + Status line disagreement)
- **Stale docs hallucinate** — archive or update, never leave design docs lying around with outdated content

### On game development
- **Procedural SFX > audio files for prototyping** — iteration is free, licensing is free, mixing is easy
- **Phaser > React canvas at game scale** — physics, scene lifecycle, input are solved problems; don't reinvent
- **Triangle > sine > square > sawtooth for tolerable procedural audio** — harshness order
- **"Feel" is a real engineering output** — juice isn't fluff; it's the difference between "works" and "feels good"
- **Hybrid Phaser+React is valid** — you don't have to pick one

### On personal workflow
- **Playtesting your own work is non-optional** — fancy effects don't survive real use (TransitionParticles taught me this)
- **Scope cuts are discipline, not failure** — FlappyLink, Terminal Quest, achievements system (partial cut) all made the arcade stronger
- **Pairing with AI is a skill, not a shortcut** — scoping tasks for Ralph is its own craft; my fundamentals got better by learning to hand work off well
- **Playground projects teach more than serious ones** — because I could experiment, break things, take risks

---

## Technical concepts this project taught me

| Concept | Where I learned it | Why it matters |
|---------|-------------------|----------------|
| React concurrent hooks timing (useRef vs setInterval) | Metris block-drop bug, Oct 2025 | Timing-sensitive hooks need refs, not state |
| Phaser scene lifecycle (Boot → Menu → Game → Over) | Phaser migration, Jan 2026 | Scene state machines beat React-canvas spaghetti |
| Focus management in complex UIs | Enter key bug, Jan 2026 | Focus bugs masquerade as keyboard bugs |
| Async-init null guards | R69–R72 cursor guards | Silent TypeErrors kill loops invisibly |
| Save migrations with versioning | R80 `gameData.stats` crash | Schema evolves; plan for it |
| Event-bridge between engines | CTRL-S hybrid in R80 | Don't port working code just for purity |
| Procedural Web Audio | useSoundSystem throughout | Iteration speed beats asset licensing |
| Visual regression with Playwright | R76 playthrough specs | Catches rendering drift no unit test will |
| Accessibility for modals (focus trap, aria-labelledby) | R64 useFocusTrap + R78.11 sweep | Shipping without it = limiting audience |
| Autonomous loop orchestration (Ralph) | R62–R82 | Craft of delegating to AI reliably |
| Juice as a named technical craft | R81 + juice plugin | Feel is engineerable, not mystical |
| Game feel diagnostics (audit → recipe → ship) | R80.23/24 + R81 | Repeatable pattern for polish |

---

## Ongoing Learnings (add as they surface)

> Rolling log. New things I learn go here, dated. Moves to the chronological sections above as each era closes.

*(empty — add here as you learn)*

---

## What I'd tell my past self

1. **Use Phaser for canvas games from day one**. You'll rebuild them in Phaser eventually — save the effort
2. **Version your save data in v1.0**. Migrations are cheap when you plan for them, crashes are expensive when you didn't
3. **Checkbox your task lists, not numbered bullets**. When you get to R78, you'll understand
4. **Delete old versions aggressively**. Git has them; your brain shouldn't have to
5. **Playtest after every significant change**. Not at the end — after every change
6. **Scope cuts are wins**. FlappyLink was a cut on day 2 and the arcade is stronger for it
7. **Your "playground" is a portfolio**. Don't dismiss the projects you do for fun — they're the ones that show real craft
8. **Top 5% AI skill + solid fundamentals is a rare combo**. Name it; don't apologise for it
