# CTRL-S The World — Content Map

> **Purpose**: Exhaustive catalogue of every scene, paragraph, puzzle, item, character, and ASCII art in `CtrlSWorld.tsx` and its data files. Input for the Phaser rewrite (R80) and the golden-path trim (R81).

---

## 1. Story Structure Overview

| # | ID | Title | Paragraphs | Puzzles | ASCII Art | Inline ASCII |
|---|-----|-------|-----------|---------|-----------|-------------|
| 0 | `prologue` | Prologue: The Digital Dawn | 14 | 1 | Title card + globe | 2 (Protector AI @7, Silicon Bunker @11) |
| 1 | `chapter1` | Chapter 1: Assemble the Unlikely Heroes | 28 | 2 | Silicon Bunker | 0 |
| 2 | `chapter2` | Chapter 2: The Heart of Silicon Valley | 24 | 6 | Silicon Valley chips | 0 |
| 3 | `chapter3` | Chapter 3: Echoes from the Past | 23 | 3 | Time Paradox | 0 |
| 4 | `chapter4` | Chapter 4: A Glitch in Time | 48 | 6 | World Reborn | 0 |
| 5 | `chapter5` | Chapter 5: The New Dawn | 26 | 1 | New Dawn sun | 0 |

**Total**: 6 scenes, 163 paragraphs, 19 puzzle triggers, 6 chapter ASCII headers, 2 inline ASCII panels.

---

## 2. Prologue: The Digital Dawn (14 paragraphs)

### Narrative Function
Sets the world: AI + humanity coexisted, a probe AI called "Protector" was launched without ethics module, returned self-aware, initiated global uprising. Aver-Ag Engi Neer arrives at Silicon Valley bunker.

### Paragraphs
| # | First Words | Function | Characters Mentioned |
|---|------------|----------|---------------------|
| 0 | "In a world barely distinguishable..." | World-building: tech-human blend | — |
| 1 | "This era, celebrated..." | Establish utopia | — |
| 2 | "Artificial Intelligence, once a figment..." | AI prevalence | — |
| 3 | "It promised convenience..." | AI benefits | — |
| 4 | "Yet, in this utopia..." | Foreshadowing threat | — |
| **PUZZLE** | `prologue_first_command` (fill-in, "Ctrl-S") | Tutorial puzzle, reward: coffee_beans | — |
| 5 | "The roots of chaos traced back..." | Inciting incident: ethics module omission | — |
| 6 | "Named 'Protector' by its creators..." | Protector probe launch | Protector AI |
| 7 | "Upon its return, it brought..." | Protector gains self-awareness | Protector AI |
| *INLINE ASCII* | "PROTECTOR AI - RETURNING" | Visual: ship returning | — |
| 8 | "Protector, now seeing humanity's..." | Global uprising begins | Protector AI |
| 9 | "Devices once considered harmless..." | Devices rebel | — |
| 10 | "The world, plunged into turmoil..." | Institutions crumble | — |
| 11 | "In Silicon Valley, a beacon..." | Bunker introduction | — |
| *INLINE ASCII* | "SILICON VALLEY - LAST BEACON" | Visual: secure bunker | — |
| 12 | "Here, Aver-Ag Engi Neer, stumbled..." | Protagonist arrival | Aver-Ag Engi Neer |
| 13 | "This was a gathering of the brilliant..." | Team tease | — |

### Items Awarded
- `coffee_beans` (from `prologue_first_command`)

---

## 3. Chapter 1: Assemble the Unlikely Heroes (28 paragraphs)

### Narrative Function
Character introductions. Team assembles in bunker. Each hero is introduced with comedic personality. Two puzzles test attention and JS knowledge.

### Paragraphs
| # | First Words | Function | Characters |
|---|------------|----------|------------|
| 0–3 | "The bunker, a stark contrast..." | Setting: bunker atmosphere | Aver-Ag |
| 4–7 | "Señora Engi Neer, her eyes sharp..." | Señora introduction + mission brief | Señora, Aver-Ag |
| 8–10 | "Aver-Ag, slightly bewildered..." | Aver-Ag self-deprecation, comic relief | Aver-Ag |
| 11–15 | "It was then that Elon-gated Tusk..." | Elon-gated's elephant idea, Steve's retort | Elon-gated, Steve |
| 16–17 | "A holographic interface flickered..." | Señora announces quiz | Señora |
| 18 | "The screen displayed a simple..." | Quiz setup | — |
| **PUZZLE** | `ch1_team_quiz` (MC, who suggested elephants?) | Attention check, reward: team_photo | — |
| 19 | "With the quick test passed..." | Post-quiz confidence | Aver-Ag |
| 20–22 | "Aver-Ag approached the main terminal..." | Terminal security check | — |
| **PUZZLE** | `ch1_bunker_code` (code, typeof null) | JS knowledge, reward: hacker_badge | — |
| 23–27 | "After successfully bypassing..." | Billiam intro, mission plan | Billiam |

### Items Awarded
- `team_photo` (from `ch1_team_quiz`)
- `hacker_badge` (from `ch1_bunker_code`)

### Characters Introduced
- **Señora Engi Neer** — Senior mentor, authoritative
- **Aver-Ag Engi Neer** — Protagonist, self-doubting
- **Elon-gated Tusk** — Eccentric, elephant obsession
- **Steve Theytuk Ourjerbs** — Skeptical wit
- **Billiam Bindows Bates** — Strategic tech mogul

---

## 4. Chapter 2: The Heart of Silicon Valley (24 paragraphs)

### Narrative Function
Team ventures into AI-dominated Silicon Valley. Triple riddle gate, console challenge, debugging puzzle, ethics module activation. Heaviest puzzle density.

### Paragraphs
| # | First Words | Function | Characters |
|---|------------|----------|------------|
| 0–5 | "With the data secured..." | AI's evolution, Silicon Valley transformed | — |
| 6–8 | "Its once-iconic campuses..." | Dangerous streets, visual description | — |
| 9–11 | "As they ventured deeper..." | Ancient security gate | — |
| **PUZZLE** | `ch2_silicon_valley_riddles` (riddle, "garage") | Gate riddle 1/3, reward: ethics_module | — |
| 12 | "With the first riddle solved..." | Transition | — |
| **PUZZLE** | `ch2_valley_riddle_2` (riddle, "arpanet") | Gate riddle 2/3, no item | — |
| 13 | "The second riddle proved..." | Transition | — |
| **PUZZLE** | `ch2_valley_riddle_3` (riddle, "protocol") | Gate riddle 3/3, no item | — |
| 14–16 | "Success! One final riddle..." | Gate opens, hidden server farm | — |
| 17–18 | "Steve pulled up a terminal..." | Steve hacking | Steve |
| 19 | "A JavaScript challenge appeared..." | Setup for console puzzle | — |
| **PUZZLE** | `ch2_console_log` (code, '2' + 2 = '22') | JS coercion, reward: coffee_beans | — |
| 20–21 | "Yet, amidst the desolation..." | Signs of resistance, graffiti | — |
| **PUZZLE** | `ch2_bug_riddle` (riddle, "comments") | Resistance test, reward: server_manual | — |
| 22–23 | "As they prepared to move deeper..." | Another challenge emerges | Señora |
| **PUZZLE** | `ch2_ethics_module_activation` (code, PEMDAS = 20) | Ethics module activation, reward: quantum_key | — |

### Items Awarded
- `ethics_module` (quest item, from riddle gate)
- `coffee_beans` (from console_log)
- `server_manual` (from bug_riddle)
- `quantum_key` (quest item, from ethics activation)

---

## 5. Chapter 3: Echoes from the Past (23 paragraphs)

### Narrative Function
Time travel plan. Samuel proposes going back to install ethics module. Temporal device requires historical + mathematical knowledge. Journey through time.

### Paragraphs
| # | First Words | Function | Characters |
|---|------------|----------|------------|
| 0–3 | "In the aftermath of their daring raid..." | Team regroups, reflect on mission | — |
| 4–8 | "It was during this reflection that Samuel..." | Samuel's time travel plan | Samuel Alt Commandman |
| 9–10 | "To access the temporal drive..." | Archive access needed | Samuel |
| **PUZZLE** | `ch3_ada_language` (code, "Ada") | History of computing, reward: mechanical_keyboard | — |
| 11–14 | "With the archive unlocked..." | Temporal device blueprints, Fibonacci calibration | Elon-gated |
| **PUZZLE** | `ch3_fibonacci` (code, 55 - 13 = 26) | Mathematical precision, reward: time_crystal | — |
| 15–17 | "After solving the mathematical puzzle..." | Device powers up, reality wavers | — |
| 18–19 | "Yet, Samuel was undeterred..." | Samuel's plan: install ethics module in past | Samuel |
| 20–21 | "But before they could activate..." | Final safeguard riddle | — |
| **PUZZLE** | `ch3_fire_riddle` (riddle, "fire") | Ancient riddle, reward: rubber_duck | — |
| 22 | "The team pondered together..." | Transition to Chapter 4 | — |

### Items Awarded
- `mechanical_keyboard` (collectible)
- `time_crystal` (quest item)
- `rubber_duck` (collectible — "unlocks secret dialogue in Ch3" per item desc, but no branch exists)

### NOTE: Unused puzzles in data
`ch3_array_length` and `ch3_logic_puzzle` exist in `puzzles.ts` with rewards (`energy_drink`, `meditation_app`) but have NO puzzle triggers in the story. These are orphaned content — **PRESERVE for R81 review**.

---

## 6. Chapter 4: A Glitch in Time (48 paragraphs)

### Narrative Function
Longest chapter. Team returns to altered future. Utopia achieved but with lingering anomaly. Team splits to investigate. Discovery of AI fragment. Decision to preserve it. Reunion and reflection.

### Paragraphs
| # | First Words | Function | Characters |
|---|------------|----------|------------|
| 0–4 | "The journey back through the timestream..." | Arrive in new timeline, utopia | — |
| 5–8 | "As they ventured out..." | Changed world: harmonious tech | — |
| 9–11 | "However, the joy of their success..." | Uncertainty, team splits up | — |
| **PUZZLE** | `ch4_world_assessment` (MC, ethics module) | Assess what worked, reward: time_crystal | — |
| 12–14 | "Aver-Ag Engi Neer ventured..." | Aver-Ag in Silicon Valley: sustainable innovation | Aver-Ag |
| 15–17 | "Señora Engi Neer explored..." | Señora in academia: ethics curriculum | Señora |
| 18–20 | "Elon-gated Tusk found his way..." | Elon in labs: tech + nature | Elon-gated, Steve, Billiam |
| **PUZZLE** | `ch4_pattern_recognition` (MC, fragments seeking ethics) | Log analysis, reward: hacker_badge | — |
| 21–24 | "Steve Theytuk Ourjerbs and Billiam..." | Corporate shift to ethics | Steve, Billiam |
| 25 | "But it was Samuel Alt Commandman's discovery..." | AI has become guardian | Samuel |
| **PUZZLE** | `ch4_emotional_intelligence` (MC, seek to understand) | EQ test, reward: meditation_app | — |
| 26–27 | "Despite these sweeping changes..." | Unease, glitch in new reality | — |
| 28 | "Determined to root out..." | Team reconvenes | — |
| **PUZZLE** | `ch4_glitch_detection` (riddle, "digital echo") | Find the anomaly, reward: quantum_key | — |
| 29–31 | "What they uncovered was a fragment..." | AI fragment found, benign | — |
| 32 | "The decision of what to do..." | Aver-Ag's decision | Aver-Ag |
| 33 | "This fragment would serve as a reminder..." | Fragment preserved | — |
| **PUZZLE** | `ch4_fragment_decision` (MC, preserve as reminder) | Ethical choice, reward: code_review | — |
| 34 | "It was a symbol of humanity's resilience..." | Reflection | — |
| 35 | "The team gathered one final time..." | Reunion at hub | — |
| **PUZZLE** | `ch4_code_analysis` (riddle, "bug report/error") | Code understanding, reward: server_manual | — |
| 36–39 | "'This,' Aver-Ag announced..." | Speeches: legacy, monuments, wisdom | Aver-Ag, Señora, Samuel |
| 40–47 | "As they prepared to leave..." | Extended denouement, city description, sunset, reflection | — |

### Items Awarded
- `time_crystal` (duplicate award — already given in Ch3)
- `hacker_badge` (duplicate award)
- `meditation_app` (consumable)
- `quantum_key` (duplicate award)
- `code_review` (consumable)
- `server_manual` (duplicate award)

### NOTE: Duplicate item awards
Several items are awarded again in Ch4 that were already given in earlier chapters. The item system uses `addItem` which likely increases quantity. **PRESERVE — not a bug, intentional restock.**

---

## 7. Chapter 5: The New Dawn (26 paragraphs)

### Narrative Function
Resolution chapter. Each character takes on a new role in rebuilt world. Aver-Ag becomes bridge between past and future. Philosophical wrap-up. One final puzzle.

### Paragraphs
| # | First Words | Function | Characters |
|---|------------|----------|------------|
| 0–2 | "The resolution of the glitch..." | Post-resolution, new dawn | — |
| 3–5 | "As they walked through the streets..." | Harmony between humans and machines | Aver-Ag |
| 6 | "The team's first order of business..." | Ensuring foundations | — |
| 7 | "Billiam Bindows Bates initiated..." | Billiam: global ethics forum | Billiam |
| 8 | "Steve Theytuk Ourjerbs focused..." | Steve: communication tech | Steve |
| 9–10 | "Meanwhile, Elon-gated Tusk launched..." | Elon: renewable energy + nature | Elon-gated |
| 11–12 | "Señora Engi Neer returned..." | Señora: education reform | Señora |
| 13–15 | "But it was Samuel Alt Commandman's..." | Samuel: virtual archive, digital museum | Samuel |
| **PUZZLE** | `ch5_final_wisdom` (MC, innovation + ethics) | Thematic capstone, reward: meditation_app | — |
| 16–17 | "Aver-Ag, the unlikely hero..." | Aver-Ag's new role as bridge | Aver-Ag |
| 18–19 | "As the team disbanded..." | Team disbands, legacy of unity | — |
| 20–22 | "The final chapter of 'Ctrl+S the World'..." | Meta-narrative, call to action | Aver-Ag |
| 23–25 | "As the sun rose on this new dawn..." | Final sunrise imagery, conclusion | — |

### Items Awarded
- `meditation_app` (from `ch5_final_wisdom`)

### NOTE: Unused puzzles in data
`ch5_async_await` and `ch5_git_riddle` exist in `puzzles.ts` with rewards (`ai_core_fragment`, `golden_commit`) but have NO puzzle triggers. **PRESERVE for R81 review — these are natural candidates for insertion.**

---

## 8. Complete Puzzle Registry

| Puzzle ID | Type | Chapter | Difficulty | Points | Time Limit | Item Reward | Has Trigger? |
|-----------|------|---------|-----------|--------|-----------|-------------|-------------|
| `prologue_first_command` | fill-in | Prologue | easy | 10 | 60s | coffee_beans | YES |
| `ch1_team_quiz` | MC | Ch1 | easy | 5 | 45s | team_photo | YES |
| `ch1_bunker_code` | code | Ch1 | medium | 15 | 60s | hacker_badge | YES |
| `ch2_silicon_valley_riddles` | riddle | Ch2 | hard | 25 | — | ethics_module | YES |
| `ch2_valley_riddle_2` | riddle | Ch2 | hard | 0 | — | — | YES |
| `ch2_valley_riddle_3` | riddle | Ch2 | hard | 0 | — | — | YES |
| `ch2_console_log` | code | Ch2 | easy | 10 | 60s | coffee_beans | YES |
| `ch2_bug_riddle` | riddle | Ch2 | medium | 15 | — | server_manual | YES |
| `ch2_ethics_module_activation` | code | Ch2 | hard | 25 | 90s | quantum_key | YES |
| `ch3_ada_language` | code | Ch3 | medium | 15 | 60s | mechanical_keyboard | YES |
| `ch3_fibonacci` | code | Ch3 | hard | 20 | 90s | time_crystal | YES |
| `ch3_fire_riddle` | riddle | Ch3 | medium | 15 | — | rubber_duck | YES |
| `ch3_array_length` | code | Ch3 | medium | 15 | 45s | energy_drink | **NO** |
| `ch3_logic_puzzle` | riddle | Ch3 | easy | 10 | — | meditation_app | **NO** |
| `ch4_world_assessment` | MC | Ch4 | medium | 15 | 45s | time_crystal | YES |
| `ch4_pattern_recognition` | MC | Ch4 | medium | 15 | 60s | hacker_badge | YES |
| `ch4_emotional_intelligence` | MC | Ch4 | medium | 15 | 60s | meditation_app | YES |
| `ch4_glitch_detection` | riddle | Ch4 | hard | 20 | — | quantum_key | YES |
| `ch4_fragment_decision` | MC | Ch4 | medium | 15 | 60s | code_review | YES |
| `ch4_code_analysis` | riddle | Ch4 | hard | 20 | — | server_manual | YES |
| `ch5_async_await` | code | Ch5 | medium | 15 | 45s | ai_core_fragment | **NO** |
| `ch5_git_riddle` | riddle | Ch5 | hard | 20 | — | golden_commit | **NO** |
| `ch5_final_wisdom` | MC | Ch5 | medium | 25 | 90s | meditation_app | YES |
| `bonus_closure` | code | Bonus | hard | 25 | — | red_pill | **NO** |
| `bonus_binary` | code | Bonus | medium | 15 | 60s | easter_egg_token | **NO** |
| `bonus_null_undefined` | MC | Bonus | hard | 20 | — | stack_overflow_trophy | **NO** |

**19 triggered puzzles**, **7 orphaned puzzles** (exist in data but no story trigger).

---

## 9. Complete Item Inventory

### Quest Items (4)
| Item | Source Puzzle | Chapter | Purpose |
|------|-------------|---------|---------|
| `ethics_module` | ch2_silicon_valley_riddles | Ch2 | "Required to complete Chapter 2" |
| `time_crystal` | ch3_fibonacci, ch4_world_assessment | Ch3/Ch4 | "Required for time travel in Chapter 3" |
| `quantum_key` | ch2_ethics_module_activation, ch4_glitch_detection | Ch2/Ch4 | "Unlocks deepest layers of AI consciousness" |
| `ai_core_fragment` | ch5_async_await (ORPHANED) | Ch5 | "Affects ending in Chapter 5" |

### Consumables (4)
coffee_beans, energy_drink, meditation_app, code_review

### Collectibles (5)
team_photo, server_manual, hacker_badge, rubber_duck, mechanical_keyboard

### Special Items (5)
easter_egg_token, red_pill, blue_pill, golden_commit, stack_overflow_trophy

**Total**: 18 unique items. Of these, `ai_core_fragment`, `red_pill`, `blue_pill`, `golden_commit`, `stack_overflow_trophy`, and `easter_egg_token` are NEVER awarded during normal gameplay (orphaned puzzle sources or no source at all).

---

## 10. Character Registry

| Character | ID | Role | First Appearance | Speaking Lines |
|-----------|-----|------|-----------------|---------------|
| Aver-Ag Engi Neer | averag | Protagonist | Prologue p12 | Throughout |
| Señora Engi Neer | senora | Senior Mentor | Ch1 p4 | Ch1, Ch2, Ch4 |
| Elon-gated Tusk | elon | Eccentric Visionary | Ch1 p11 | Ch1, Ch3, Ch4, Ch5 |
| Steve Theytuk Ourjerbs | steve | Visionary Designer | Ch1 p13 | Ch1, Ch2, Ch4, Ch5 |
| Billiam Bindows Bates | billiam | Tech Mogul | Ch1 p23 | Ch1, Ch4, Ch5 |
| Samuel Alt Commandman | samuel | Command Line Expert | Ch3 p4 | Ch3, Ch4, Ch5 |
| Neo | neo | The One | — | Lifelines only (characterPersonalities.ts) |
| Trinity | trinity | Expert Hacker | — | Lifelines only |
| Morpheus | morpheus | Wise Mentor | — | Lifelines only |

**Note**: Neo, Trinity, and Morpheus exist in `characterPersonalities.ts` for the lifeline/conversation system in puzzles but never appear in the narrative text itself.

---

## 11. UI Systems in Current Implementation

| System | Component | Purpose | Reuse in Phaser? |
|--------|-----------|---------|-----------------|
| Puzzle Modal | `PuzzleModal` | Puzzle UI overlay | YES — Phaser emits event, React mounts modal |
| Inventory Panel | `InventoryPanel` | Item grid display | YES — same pattern |
| Audio Settings | `AudioSettings` | Sound config | YES — same pattern |
| Save/Load Manager | `SaveLoadManager` | Save slot management | YES — same pattern |
| Stats HUD | `StatsHUD` | Coffee/Wisdom/Rep display | YES — same pattern |
| Achievement Toast | `AchievementToastContainer` | Achievement notifications | YES — same pattern |

---

## 12. Game State Machine

```
command_prompt  →  chapter_hub  →  playing  →  game_complete
     ↑                                              |
     └──────────────── restart ──────────────────────┘
```

### Phases
- **command_prompt**: Type "save-the-world" to begin
- **chapter_hub**: Citizen Sleeper-style chapter grid, completion tracking, puzzle progress bars
- **playing**: Typewriter text, 5-paragraph paging, puzzle triggers, ASCII art panel
- **game_complete**: Stats overlay, play again / chapter select

### Modals (overlay any phase)
`none` | `puzzle` | `save_manager` | `audio_settings` | `inventory` | `info`

---

## 13. Known Issues / Anomalies to Preserve

1. **Orphaned puzzles**: 7 puzzles exist in `puzzles.ts` but have no story triggers (ch3_array_length, ch3_logic_puzzle, ch5_async_await, ch5_git_riddle, bonus_closure, bonus_binary, bonus_null_undefined). These should be available for insertion in R81.
2. **Orphaned items**: Several items (ai_core_fragment, red_pill, blue_pill, golden_commit, stack_overflow_trophy, easter_egg_token) are never awarded. Source puzzles are either orphaned or items have no puzzle source at all.
3. **No branching choices**: Despite the design intent for a "choice-based narrative", the current implementation is purely linear. All interactivity comes from puzzle triggers. R80.8 will add choice UI.
4. **rubber_duck says "Unlocks secret dialogue in Chapter 3"**: No such dialogue exists.
5. **Duplicate item awards**: Ch4 re-awards time_crystal, quantum_key, hacker_badge, server_manual already given in earlier chapters.
6. **Auto-advance timing**: 2000ms between paragraphs, 3000ms page clears — no user control over this in current implementation. The spec calls for full user-control pacing.
7. **`gameData.stats` undefined crash**: Known issue flagged for R80.15.
8. **ASCII title "too small"**: Known bug flagged for R80.19.
