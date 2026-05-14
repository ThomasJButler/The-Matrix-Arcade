# CTRL-S The World — Golden Path Trim Plan

> **Status**: Draft for Tom's R81 review. No content changes until approved.
> **Goal**: Reduce first-playthrough time from ~46 min to ~25 min (20–30 min target).
> **Method**: Per-paragraph KEEP/CUT/MERGE verdicts. Puzzle KEEP/DROP verdicts. Scene-by-scene.
> **Companion doc**: `specs/ctrls-golden-path.md` (classification of every segment as ESSENTIAL/OPTIONAL).

---

## Current Inventory

| Chapter | Paragraphs | Puzzles | Est. Read | Est. w/ Puzzles |
|---------|-----------|---------|-----------|-----------------|
| Prologue | 14 | 1 | 3 min | 4 min |
| Ch1 | 27 | 2 | 5 min | 7 min |
| Ch2 | 25 | 6 | 5 min | 10 min |
| Ch3 | 23 | 3 | 4 min | 7 min |
| Ch4 | 48 | 6 | 8 min | 13 min |
| Ch5 | 27 | 1 | 4 min | 5 min |
| **Total** | **164** | **19** | **29 min** | **46 min** |

**Target after trim**: ~95 paragraphs, 7 puzzles, ~18 min read + ~7 min puzzles = **~25 min**.

---

## Prologue: The Digital Dawn (14 → 10 paragraphs, 1 → 1 puzzle)

| Paragraphs | Verdict | Action |
|-----------|---------|--------|
| p0–p2 | MERGE | Condense 3 exposition paragraphs into 2. Cut redundant world-state description. |
| p3–p4 | KEEP | Establishes the threat + leads into tutorial puzzle. |
| puzzle: `prologue_first_command` | KEEP | Tutorial. Add skip option for replays. |
| p5–p7 | KEEP | Protector backstory (inciting incident). Speaker lines. |
| ASCII: Protector returning | CUT | Visual flair only. No narrative weight. |
| p8–p10 | MERGE | Global uprising — compress to 2 paragraphs. |
| p11–p13 | KEEP | Bunker introduction + protagonist. |
| ASCII: Secure Bunker | CUT | Visual flair only. |

**After trim**: ~10 paragraphs, 1 puzzle, **~2.5 min read + 1 min puzzle = 3.5 min**.

---

## Chapter 1: Assemble the Heroes (27 → 12 paragraphs, 2 → 0 puzzles)

This chapter has the highest trim potential. Most content is character-introduction flavour that repeats what dialogue already establishes.

| Paragraphs | Verdict | Action |
|-----------|---------|--------|
| p0–p3 | CUT | Atmospheric bunker description. Prologue already set the scene. |
| p4–p7 | KEEP | Senora intro + mission brief. Essential character + stakes. |
| p8–p10 | CUT | Aver-Ag self-doubt comedy. Not plot-critical. |
| p11–p15 | MERGE | Elon-gated + Steve intro — compress 5 paragraphs to 2. Keep personality, cut padding. |
| p16–p18 | CUT | Team quiz setup. Puzzle is optional. |
| puzzle: `ch1_team_quiz` | DROP | Attention check. Not plot-critical. |
| p19 | CUT | One-liner transition to removed puzzle. |
| p20–p22 | CUT | Terminal security setup. Puzzle is optional. |
| puzzle: `ch1_bunker_code` | DROP | JS knowledge test. Not plot-critical. |
| p23–p27 | KEEP | Billiam intro + mission plan. Essential setup for Ch2. |

**After trim**: ~12 paragraphs, 0 puzzles, **~3 min read**.

**Note**: Dropping both Ch1 puzzles means the first interactive moment after the tutorial is Ch2's gate. If this feels too long without interaction, reinstate `ch1_bunker_code` as a single-puzzle "unlock the bunker terminal" beat.

---

## Chapter 2: Heart of Silicon Valley (25 → 16 paragraphs, 6 → 3 puzzles)

Highest puzzle density. Trim the riddle-gate from 3 sequential puzzles to 1, and drop the two flavour puzzles.

| Paragraphs | Verdict | Action |
|-----------|---------|--------|
| p0–p5 | MERGE | AI evolution exposition — compress to 3 paragraphs. |
| p6–p8 | CUT | Atmospheric "world is changed." Prologue + Ch1 already established this. |
| p9–p11 | KEEP | Gate approach. Essential narrative beat. |
| puzzle: `ch2_silicon_valley_riddles` | KEEP (merge 3→1) | Merge the three sequential gate puzzles into one combined riddle. |
| puzzle: `ch2_valley_riddle_2` | DROP (merged above) | |
| puzzle: `ch2_valley_riddle_3` | DROP (merged above) | |
| p12–p13 | CUT | Setup paragraphs for now-merged riddles. |
| p14–p16 | KEEP | Gate opens, server farm discovery. |
| p17–p19 | KEEP | Steve hacking scene. Character moment + leads to puzzle. |
| puzzle: `ch2_console_log` | DROP | JS test. Flavour only. |
| p20–p21 | CUT | Resistance graffiti. World-building, skippable. |
| puzzle: `ch2_bug_riddle` | DROP | Flavour puzzle. |
| p22–p23 | KEEP | Ethics module activation setup. |
| puzzle: `ch2_ethics_module_activation` | KEEP | Chapter climax. Plot-critical. |
| p24 | KEEP | Senora's reaction. Closes chapter. |

**After trim**: ~16 paragraphs, 3 puzzles (1 merged gate + ethics activation), **~3.5 min read + 3 min puzzles = 6.5 min**.

---

## Chapter 3: Echoes from the Past (23 → 14 paragraphs, 3 → 1 puzzle)

Tightest chapter narratively. Most cuts are recap paragraphs.

| Paragraphs | Verdict | Action |
|-----------|---------|--------|
| p0–p3 | CUT | Team regroups. Recaps recent events. |
| p4–p8 | KEEP | Samuel's time travel proposal. Major plot turn. |
| p9–p10 | KEEP | Archive access + temporal drive setup. |
| puzzle: `ch3_ada_language` | DROP | History quiz. Not plot-critical. |
| p11–p14 | KEEP | Device blueprints + calibration. |
| puzzle: `ch3_fibonacci` | KEEP | Calibrating the temporal drive. Plot-critical. |
| p15–p17 | KEEP | Device powers up. Dramatic beat. |
| p18–p19 | KEEP | Samuel's explicit plan: install ethics module in the past. |
| p20–p21 | CUT | Setup for optional riddle. |
| puzzle: `ch3_fire_riddle` | DROP | Classic riddle. Not story-dependent. |
| p22 | KEEP | Bridge to Chapter 4. |

**After trim**: ~14 paragraphs, 1 puzzle, **~3 min read + 2 min puzzle = 5 min**.

---

## Chapter 4: A Glitch in Time (48 → 22 paragraphs, 6 → 2 puzzles)

**Biggest trim target.** Nearly half the chapter is character-update vignettes that can be compressed. The denouement (p40–p47) is 8 paragraphs of reflection that can be 3.

| Paragraphs | Verdict | Action |
|-----------|---------|--------|
| p0–p4 | KEEP | Arrival payoff. Essential. |
| p5–p8 | MERGE | New-world harmony — compress to 2 paragraphs. |
| p9–p11 | KEEP | Team splits to investigate. |
| puzzle: `ch4_world_assessment` | DROP | Comprehension check. Flavour. |
| p12–p14 | MERGE | Aver-Ag's Silicon Valley visit — compress to 1 paragraph. |
| p15–p17 | CUT | Senora academia vignette. Can be covered in Ch5 epilogue. |
| p18–p20 | CUT | Elon/Steve/Billiam updates. Repetitive with other character moments. |
| puzzle: `ch4_pattern_recognition` | DROP | Log analysis. Flavour. |
| p21–p24 | CUT | Steve + Billiam corporate. More repetitive updates. |
| p25 | KEEP | Samuel discovers AI has become guardian. |
| puzzle: `ch4_emotional_intelligence` | DROP | EQ test. Flavour. |
| p26–p28 | KEEP | Unease + glitch detection. Core tension. |
| puzzle: `ch4_glitch_detection` | KEEP | Finding the anomaly. Chapter turning point. |
| p29–p33 | KEEP | AI fragment discovery + preservation choice. |
| puzzle: `ch4_fragment_decision` | KEEP | Ethical choice. Plot-critical. |
| p34–p35 | KEEP | Fragment preserved + resolution. |
| puzzle: `ch4_code_analysis` | DROP | Code understanding. Flavour. |
| p36–p39 | MERGE | Reunion speeches — compress to 2 paragraphs. |
| p40–p47 | MERGE | Extended denouement — compress 8 paragraphs to 3. |

**After trim**: ~22 paragraphs, 2 puzzles, **~5 min read + 3 min puzzles = 8 min**.

---

## Chapter 5: The New Dawn (27 → 15 paragraphs, 1 → 1 puzzle)

Mostly character epilogues. Compress the individual send-offs.

| Paragraphs | Verdict | Action |
|-----------|---------|--------|
| p0–p2 | KEEP | Post-resolution transition. |
| p3–p5 | MERGE | Harmony described — compress to 1 paragraph. |
| p6 | KEEP | Team's new roles setup. |
| p7–p12 | MERGE | 6 individual character epilogues → 2 grouped paragraphs (e.g., "tech trio" + "educators"). |
| p13–p15 | KEEP | Samuel's virtual archive. Narratively significant. |
| puzzle: `ch5_final_wisdom` | KEEP | Thematic capstone. |
| p16–p17 | KEEP | Aver-Ag's resolution. |
| p18–p19 | KEEP | Team disbands. Closure. |
| p20–p22 | MERGE | Meta-narrative — compress to 1 paragraph or cut entirely. |
| p23–p25 | MERGE | Final sunrise — compress to 2 paragraphs. |

**After trim**: ~15 paragraphs, 1 puzzle, **~3 min read + 1 min puzzle = 4 min**.

---

## Trimmed Totals

| Chapter | Before (paras) | After (paras) | Before (puzzles) | After (puzzles) | Est. Time |
|---------|---------------|--------------|-------------------|-----------------|-----------|
| Prologue | 14 | 10 | 1 | 1 | 3.5 min |
| Ch1 | 27 | 12 | 2 | 0 | 3 min |
| Ch2 | 25 | 16 | 6 | 3 | 6.5 min |
| Ch3 | 23 | 14 | 3 | 1 | 5 min |
| Ch4 | 48 | 22 | 6 | 2 | 8 min |
| Ch5 | 27 | 15 | 1 | 1 | 4 min |
| **Total** | **164** | **89** | **19** | **8** | **~30 min** |

**Reduction**: 164 → 89 paragraphs (46% cut), 19 → 8 puzzles (58% cut).
**Estimated playthrough**: ~30 min (tight end of target). Could push to ~25 min by further compressing Ch4.

---

## Essential Puzzle Chain (8 puzzles, trimmed path)

1. `prologue_first_command` — Tutorial onboarding
2. `ch2_silicon_valley_riddles` (merged 3→1) — Gate unlocking
3. `ch2_ethics_module_activation` — Ch2 climax
4. `ch3_fibonacci` — Temporal drive calibration
5. `ch4_glitch_detection` — Ch4 turning point
6. `ch4_fragment_decision` — Ethical choice
7. `ch5_final_wisdom` — Thematic capstone

**Pacing**: Roughly 1 puzzle every 4 min of reading. Consistent interactive rhythm.

---

## Dropped Puzzles (11 puzzles)

These can be preserved in a "bonus/challenge" mode or offered as optional side content:

| Puzzle ID | Chapter | Reason for Drop |
|-----------|---------|----------------|
| `ch1_team_quiz` | Ch1 | Attention check, not plot-critical |
| `ch1_bunker_code` | Ch1 | JS quiz, not plot-critical |
| `ch2_valley_riddle_2` | Ch2 | Merged into single gate puzzle |
| `ch2_valley_riddle_3` | Ch2 | Merged into single gate puzzle |
| `ch2_console_log` | Ch2 | JS test, flavour |
| `ch2_bug_riddle` | Ch2 | Flavour puzzle |
| `ch3_ada_language` | Ch3 | History quiz, not plot-critical |
| `ch3_fire_riddle` | Ch3 | Classic riddle, story-independent |
| `ch4_world_assessment` | Ch4 | Comprehension check |
| `ch4_pattern_recognition` | Ch4 | Log analysis, flavour |
| `ch4_emotional_intelligence` | Ch4 | EQ test, flavour |
| `ch4_code_analysis` | Ch4 | Code understanding, flavour |

---

## Implementation Notes for R81

1. **No code deletion needed for puzzles** — puzzles are data-driven via `puzzleTriggers` in `ctrlsChapters.ts`. Dropping a puzzle = removing its trigger entry. The puzzle definition in `puzzles.ts` can stay (reusable for bonus mode).

2. **Paragraph merging** = editing strings in the `paragraphs` array. Speaker maps (`speakers` record) must be re-indexed after paragraph removal.

3. **ASCII panel removal** = delete `inlineAscii` entries. No code changes needed.

4. **Triple-riddle merge** = replace 3 trigger entries with 1, create a new combined puzzle in `puzzles.ts` that asks all 3 riddles in sequence (or pick the best one).

5. **Achievement impact**: `PUZZLE_MASTER` (10+ puzzles solved) becomes unreachable with only 8 puzzles. Either lower the threshold to 7, or count bonus puzzles. `NO_HINTS` remains achievable.

6. **Test updates**: `ctrlsChapters.test.ts` validates paragraph counts and trigger indices — these will need updating after trim.

---

## Open Questions for Tom

- [ ] Should Ch1 have zero puzzles, or reinstate `ch1_bunker_code` for pacing?
- [ ] Should dropped puzzles be available in a "bonus chapter" or "challenge mode"?
- [ ] Is the 4th-wall meta-narrative (Ch5 p20–p22) worth keeping?
- [ ] Ch4 character vignettes (Senora academia, Elon nature) — cut entirely or compress to 1 paragraph each?
- [ ] ASCII panels in Prologue — cut for pacing, or keep for visual variety in the opening?
