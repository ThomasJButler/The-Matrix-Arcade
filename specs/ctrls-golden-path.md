# CTRL-S The World — Golden Path Analysis

> **Purpose**: Classify every scene/segment as ESSENTIAL (main arc) or OPTIONAL (side branch / trim candidate) to inform the future content-trim phase (R81). This is Tom's decision input — no content is deleted in R80.

---

## Classification Key

- **ESSENTIAL** — Required for narrative coherence. Removing breaks the story arc.
- **OPTIONAL** — Enriches the experience but can be trimmed/merged without breaking the arc.
- **PUZZLE-ESSENTIAL** — The puzzle is required for story logic (e.g., gate that must be opened).
- **PUZZLE-OPTIONAL** — Puzzle adds flavour/testing but story works without it.

---

## Prologue: The Digital Dawn

| Segment | Paragraphs | Classification | Rationale |
|---------|-----------|---------------|-----------|
| World-building | p0–p4 | ESSENTIAL | Establishes premise: AI-human coexistence, hidden threat |
| `prologue_first_command` puzzle | after p4 | PUZZLE-OPTIONAL | Tutorial puzzle, nice onboarding but story doesn't depend on it |
| Protector backstory | p5–p7 | ESSENTIAL | Inciting incident: ethics module omission, self-awareness |
| *Inline ASCII: Protector returning* | after p7 | OPTIONAL | Visual flair, no narrative content |
| Global uprising | p8–p10 | ESSENTIAL | Stakes: world falls apart |
| Bunker introduction | p11–p13 | ESSENTIAL | Introduces setting and protagonist |
| *Inline ASCII: Secure Bunker* | after p11 | OPTIONAL | Visual flair |

**Estimated read time**: ~3 minutes  
**Trim potential**: Merge p0–p4 into 2–3 paragraphs (heavy exposition). Tutorial puzzle is skippable.

---

## Chapter 1: Assemble the Unlikely Heroes

| Segment | Paragraphs | Classification | Rationale |
|---------|-----------|---------------|-----------|
| Bunker atmosphere | p0–p3 | OPTIONAL | Atmospheric, but restates what prologue established |
| Señora intro + mission brief | p4–p7 | ESSENTIAL | Key character, establishes mission |
| Aver-Ag self-doubt / comedy | p8–p10 | OPTIONAL | Character flavour, trimmable |
| Elon-gated elephant bit | p11–p15 | OPTIONAL | Comedy relief, introduces Elon + Steve but wordy |
| Team quiz setup | p16–p18 | OPTIONAL | Setup for optional puzzle |
| `ch1_team_quiz` puzzle | after p18 | PUZZLE-OPTIONAL | Attention check, not plot-critical |
| Post-quiz transition | p19 | OPTIONAL | One-liner transition |
| Terminal security | p20–p22 | OPTIONAL | Setup for optional puzzle |
| `ch1_bunker_code` puzzle | after p22 | PUZZLE-OPTIONAL | JS knowledge, not plot-critical |
| Billiam intro + mission plan | p23–p27 | ESSENTIAL | Introduces Billiam, sets up Silicon Valley mission |

**Estimated read time**: ~5 minutes  
**Trim potential**: HIGH. p0–p3 + p8–p15 are largely flavour. Could compress to Señora intro → team sketch → mission brief. Drop or merge both puzzles into one.

---

## Chapter 2: The Heart of Silicon Valley

| Segment | Paragraphs | Classification | Rationale |
|---------|-----------|---------------|-----------|
| Data analysis + AI evolution | p0–p5 | ESSENTIAL | Establishes AI's growth, raises stakes |
| Silicon Valley transformed | p6–p8 | OPTIONAL | Atmospheric, restates "world is changed" |
| Riddle gate approach | p9–p11 | ESSENTIAL | Gate is a narrative beat |
| `ch2_silicon_valley_riddles` (3 puzzles) | after p11/12/13 | PUZZLE-ESSENTIAL | Gate unlocking is plot-critical; but 3 riddles could be 1 |
| Gate opens + server farm | p14–p16 | ESSENTIAL | Discovery of hidden infrastructure |
| Steve hacking | p17–p19 | ESSENTIAL | Steve's moment, leads to console puzzle |
| `ch2_console_log` puzzle | after p19 | PUZZLE-OPTIONAL | JS test, not plot-critical |
| Resistance graffiti | p20–p21 | OPTIONAL | World-building, skippable |
| Debugging challenge | p22–p23 | OPTIONAL | Setup for optional puzzle |
| `ch2_bug_riddle` puzzle | after p21 | PUZZLE-OPTIONAL | Flavour puzzle |
| `ch2_ethics_module_activation` puzzle | after p23 | PUZZLE-ESSENTIAL | Activating the ethics module IS the chapter's climax |

**Estimated read time**: ~5 minutes  
**Trim potential**: MEDIUM. Compress triple riddle gate to single gate puzzle. Drop ch2_bug_riddle, ch2_console_log. Keep ethics activation as climax.

---

## Chapter 3: Echoes from the Past

| Segment | Paragraphs | Classification | Rationale |
|---------|-----------|---------------|-----------|
| Team regroups | p0–p3 | OPTIONAL | Transition, restates recent events |
| Samuel's time travel proposal | p4–p8 | ESSENTIAL | Major plot turn: time travel plan |
| Archive access | p9–p10 | ESSENTIAL | Setup for temporal drive |
| `ch3_ada_language` puzzle | after p10 | PUZZLE-OPTIONAL | History quiz, not plot-critical |
| Temporal device blueprints | p11–p14 | ESSENTIAL | Device discovery + calibration |
| `ch3_fibonacci` puzzle | after p14 | PUZZLE-ESSENTIAL | Calibrating the temporal drive is plot-critical |
| Device powers up | p15–p17 | ESSENTIAL | Dramatic moment, reality wavers |
| Samuel's plan | p18–p19 | ESSENTIAL | Explicit mission: install ethics module in past |
| Final safeguard | p20–p21 | OPTIONAL | Setup for optional riddle |
| `ch3_fire_riddle` puzzle | after p21 | PUZZLE-OPTIONAL | Classic riddle, not story-dependent |
| Transition | p22 | ESSENTIAL | Bridge to Chapter 4 |

**Estimated read time**: ~4 minutes  
**Trim potential**: MEDIUM. Drop p0–p3 recap, merge p20–p22. Keep Samuel's proposal + Fibonacci calibration as core beats.

---

## Chapter 4: A Glitch in Time (LONGEST)

| Segment | Paragraphs | Classification | Rationale |
|---------|-----------|---------------|-----------|
| Arrival in new timeline | p0–p4 | ESSENTIAL | Payoff: utopia achieved |
| Exploring the new world | p5–p8 | OPTIONAL | Extended description of harmony, could be shorter |
| Uncertainty + team splits | p9–p11 | ESSENTIAL | Sets up investigation |
| `ch4_world_assessment` puzzle | after p11 | PUZZLE-OPTIONAL | Comprehension check, not plot-critical |
| Aver-Ag in Silicon Valley | p12–p14 | ESSENTIAL | Shows ethics module's impact |
| Señora in academia | p15–p17 | OPTIONAL | Character moment, could merge with others |
| Elon/Steve/Billiam updates | p18–p20 | OPTIONAL | Character moments, could be a single paragraph |
| `ch4_pattern_recognition` puzzle | after p20 | PUZZLE-OPTIONAL | Log analysis, flavour |
| Steve + Billiam corporate | p21–p24 | OPTIONAL | More character updates, repetitive |
| Samuel's discovery | p25 | ESSENTIAL | AI has become guardian |
| `ch4_emotional_intelligence` puzzle | after p25 | PUZZLE-OPTIONAL | EQ test, flavour |
| Unease + glitch | p26–p28 | ESSENTIAL | Core tension: something's wrong |
| `ch4_glitch_detection` puzzle | after p28 | PUZZLE-ESSENTIAL | Finding the anomaly IS the chapter's turning point |
| AI fragment found | p29–p33 | ESSENTIAL | Discovery + preservation decision |
| `ch4_fragment_decision` puzzle | after p33 | PUZZLE-ESSENTIAL | Ethical choice: preserve or destroy |
| Fragment preserved | p34 | ESSENTIAL | Resolution of decision |
| `ch4_code_analysis` puzzle | after p35 | PUZZLE-OPTIONAL | Code understanding, flavour |
| Reunion speeches | p36–p39 | ESSENTIAL | Character moments at climax |
| Extended denouement | p40–p47 | OPTIONAL | Very long ending, could be 2–3 paragraphs |

**Estimated read time**: ~8 minutes  
**Trim potential**: VERY HIGH. This is the longest chapter by far. Compress character-update segments (p12–p24) from ~13 paragraphs to ~5. Trim denouement (p40–p47) from 8 to 3. Drop 3 optional puzzles.

---

## Chapter 5: The New Dawn

| Segment | Paragraphs | Classification | Rationale |
|---------|-----------|---------------|-----------|
| Post-resolution | p0–p2 | ESSENTIAL | Transition from Ch4 resolution |
| Harmony described | p3–p5 | OPTIONAL | Restates utopia theme |
| Team's new roles | p6 | ESSENTIAL | Setup for character epilogues |
| Billiam: ethics forum | p7 | OPTIONAL | Character epilogue |
| Steve: communication | p8 | OPTIONAL | Character epilogue |
| Elon: nature + tech | p9–p10 | OPTIONAL | Character epilogue |
| Señora: education | p11–p12 | OPTIONAL | Character epilogue |
| Samuel: virtual archive | p13–p15 | ESSENTIAL | The digital museum is narratively significant |
| `ch5_final_wisdom` puzzle | after p15 | PUZZLE-ESSENTIAL | Thematic capstone — tests if player understood the message |
| Aver-Ag's new role | p16–p17 | ESSENTIAL | Protagonist's resolution |
| Team disbands | p18–p19 | ESSENTIAL | Closure |
| Meta-narrative | p20–p22 | OPTIONAL | Breaks fourth wall, could trim |
| Final sunrise | p23–p25 | ESSENTIAL | Closing imagery |

**Estimated read time**: ~4 minutes  
**Trim potential**: MEDIUM. Compress character epilogues (p7–p12) from 6 paragraphs to 2–3. Keep Samuel's archive + final wisdom puzzle + Aver-Ag's resolution.

---

## Summary: Estimated Play Time

| Chapter | Current (est.) | With Puzzles | After Trim (est.) |
|---------|---------------|-------------|-------------------|
| Prologue | 3 min | +1 min | 2 min |
| Chapter 1 | 5 min | +2 min | 3 min |
| Chapter 2 | 5 min | +5 min | 3 min (+2 min puzzles) |
| Chapter 3 | 4 min | +3 min | 3 min (+2 min puzzles) |
| Chapter 4 | 8 min | +5 min | 4 min (+2 min puzzles) |
| Chapter 5 | 4 min | +1 min | 3 min (+1 min puzzle) |
| **Total** | **29 min** | **+17 min** | **~18 min (+7 min puzzles) = ~25 min** |

**Target**: 20–30 min first playthrough. Current reading time alone is ~29 min without puzzles. With puzzles, it's ~46 min. Trim target should aim for ~18 min reading + ~7 min puzzles = **~25 min total**.

---

## Essential Puzzles (Keep in Trim)

1. `prologue_first_command` — Tutorial (consider making skippable)
2. `ch2_silicon_valley_riddles` — Gate (merge 3 into 1)
3. `ch2_ethics_module_activation` — Chapter 2 climax
4. `ch3_fibonacci` — Temporal drive calibration
5. `ch4_glitch_detection` — Chapter 4 turning point
6. `ch4_fragment_decision` — Ethical choice
7. `ch5_final_wisdom` — Thematic capstone

**7 essential puzzles** from 19 triggered. That's a good density for a 25-min playthrough.

---

## Recommendations for R81 Review

1. **Chapter 4 is the biggest trim target** — 48 paragraphs, 6 puzzles. Could be halved.
2. **Chapter 1 character intros** — Funny but wordy. A single "meet the team" paragraph per character would suffice.
3. **Orphaned puzzles** (ch3_array_length, ch3_logic_puzzle, ch5_async_await, ch5_git_riddle, bonus_*) — Consider inserting ch5_async_await and ch5_git_riddle as they'd add interactivity to the lightest chapter.
4. **Choice points** — The story is currently 100% linear. Adding 2–3 meaningful choices (e.g., at the fragment decision in Ch4, or "which team member to follow" in Ch4's split) would dramatically increase replayability.
5. **Auto-advance removal** — Per Tom's design lock-in, full user-control pacing. Remove all setTimeout-based auto-advance.
