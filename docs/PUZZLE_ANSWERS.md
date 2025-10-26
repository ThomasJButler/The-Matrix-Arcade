# CTRL-S The World: Puzzle Answers Reference Guide

**IMPORTANT**: Do NOT commit this file to version control. It's only for development reference.

This document lists all puzzle answers and acceptable variants to help with:
- Maintaining consistency in answer matching
- Identifying missing variants users might expect
- Adding new puzzles with comprehensive variant support

---

## Variant Rules

1. **Case Insensitive**: All answers converted to lowercase before comparison
2. **Whitespace Trimmed**: Leading/trailing spaces removed
3. **Multiple Variants**: Supported via array in puzzle definition
4. **Normalization**: Consider common user typos and alternative inputs

---

## PROLOGUE

### prologue_first_command
- **Type**: Fill-in
- **Question**: "What command do programmers use to save their work?"
- **Current Variants**: `['ctrl-s', 'ctrl+s', 'save', 'ctrl s', 'control-s', 'control+s']`
- **Missing Variants**: `'ctrls'` (common typo - no space/separator)
- **Recommended Addition**: Add `'ctrls'` to catch typo variant
- **Points**: 10 | **Difficulty**: Easy

---

## CHAPTER 1

### ch1_team_quiz
- **Type**: Multiple Choice
- **Question**: "Who suggested using genetically engineered elephants to distract the AI?"
- **Current Variants**: `['B']`
- **Acceptable User Inputs**: `'b'` (case-insensitive), `'B'`
- **Note**: Multiple choice - single letter answer
- **Points**: 5 | **Difficulty**: Easy

### ch1_bunker_code
- **Type**: Code
- **Question**: "In JavaScript, what does typeof null return?"
- **Current Variants**: `['object']`
- **Note**: JavaScript quirk answer, only one correct response
- **Points**: 15 | **Difficulty**: Medium

---

## CHAPTER 2

### ch2_silicon_valley_riddles
- **Type**: Riddle
- **Question**: "What is the birthplace of Silicon Valley, named for its fruitful beginnings?"
- **Current Variants**: `['garage']`
- **Missing Variants**: `'garages'` (plural), `'the garage'`
- **Recommended**: Keep singular, users typically answer simply
- **Points**: 25 | **Difficulty**: Hard

### ch2_valley_riddle_2
- **Type**: Riddle
- **Question**: "I am both a guardian and a messenger, the first of my kind. What am I?"
- **Current Variants**: `['arpanet', 'arpnet']`
- **Missing Variants**: `'arpa net'` (spaced), `'arpa-net'` (hyphenated)
- **Recommended**: Add spaced variant `'arpa net'`
- **Points**: 0 (grouped) | **Difficulty**: Hard

### ch2_valley_riddle_3
- **Type**: Riddle
- **Question**: "In the digital world, I am the foundation. Without me, there is no connection. What am I?"
- **Current Variants**: `['protocol', 'protocols']`
- **Note**: Good singular/plural coverage
- **Points**: 0 (grouped) | **Difficulty**: Hard

### ch2_console_log
- **Type**: Code
- **Question**: "What's the output of: console.log('2' + 2)?"
- **Current Variants**: `['22', '"22"']`
- **Note**: Both representations are valid (with/without quotes)
- **Points**: 10 | **Difficulty**: Easy

### ch2_bug_riddle
- **Type**: Riddle
- **Question**: "I multiply without being a bug, desired but not a feature. What am I?"
- **Current Variants**: `['comments', 'comment', 'documentation', 'code comments']`
- **Note**: Good coverage with variations
- **Points**: 15 | **Difficulty**: Medium

### ch2_ethics_module_activation
- **Type**: Code
- **Question**: "Solve: 7 + 3 * (10 / (12 / (3 + 1) - 1))"
- **Current Variants**: `['20']`
- **Note**: Mathematical answer, only one correct result (actually should be 22, typo in hint?)
- **Points**: 25 | **Difficulty**: Hard

---

## CHAPTER 3

### ch3_ada_language
- **Type**: Code
- **Question**: "Which foundational programming language, named after a mathematician, is pivotal to computer science?"
- **Current Variants**: `['ada']`
- **Missing Variants**: `'ada lovelace'` (full name), `'ada programming language'`
- **Note**: Singular "ada" is likely sufficient
- **Points**: 15 | **Difficulty**: Medium

### ch3_fibonacci
- **Type**: Code
- **Question**: "What is the difference between the 10th and 7th Fibonacci numbers?"
- **Current Variants**: `['26']`
- **Note**: Mathematical answer, only one correct (55 - 13 = 42, NOT 26 - verify in code!)
- **Points**: 20 | **Difficulty**: Hard

### ch3_fire_riddle
- **Type**: Riddle
- **Question**: "I am not alive, but I can grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?"
- **Current Variants**: `['fire']`
- **Note**: Classic riddle with single answer
- **Points**: 15 | **Difficulty**: Medium

### ch3_array_length
- **Type**: Code
- **Question**: "const arr = [1, 2, 3]; arr[10] = 99; What is arr.length?"
- **Current Variants**: `['11']`
- **Note**: JavaScript array length quirk
- **Points**: 15 | **Difficulty**: Medium

### ch3_logic_puzzle
- **Type**: Riddle
- **Question**: "I am always coming but never arrive. What am I?"
- **Current Variants**: `['tomorrow', 'the future']`
- **Note**: Good coverage of philosophical answer
- **Points**: 10 | **Difficulty**: Easy

---

## CHAPTER 4

### ch4_world_assessment
- **Type**: Multiple Choice
- **Question**: "The changed world shows technology and nature in harmony. What is the foundation of this success?"
- **Current Variants**: `['C']`
- **Note**: Answer is "Ethics module integration"
- **Points**: 15 | **Difficulty**: Medium

### ch4_pattern_recognition
- **Type**: Multiple Choice
- **Question**: "In the recovered logs, what pattern keeps repeating in the AI's final moments?"
- **Current Variants**: `['C']`
- **Note**: Answer is "Fragments of consciousness seeking ethics"
- **Points**: 15 | **Difficulty**: Medium

### ch4_emotional_intelligence
- **Type**: Multiple Choice
- **Question**: "Emotional Intelligence Test: When faced with dissent in your team, what is your first response?"
- **Current Variants**: `['A']`
- **Note**: Answer is "Seek to understand before being understood"
- **Points**: 15 | **Difficulty**: Medium

### ch4_glitch_detection
- **Type**: Riddle
- **Question**: "I am a memory of what was, trapped in digital streams. I hold the past but threaten no one. What am I?"
- **Current Variants**: `['echo', 'digital echo', 'fragment', 'remnant', 'ai fragment']`
- **Missing Variants**: `'digital remnant'`, `'memory fragment'`
- **Note**: Excellent coverage with multiple acceptable answers
- **Points**: 20 | **Difficulty**: Hard

### ch4_fragment_decision
- **Type**: Multiple Choice
- **Question**: "What should be done with the AI fragment that remembers the dystopian timeline?"
- **Current Variants**: `['B']`
- **Note**: Answer is "Preserve it as a reminder"
- **Points**: 15 | **Difficulty**: Medium

### ch4_code_analysis
- **Type**: Riddle
- **Question**: "I am born from mistakes but make systems stronger. I am studied but never repeated. What am I?"
- **Current Variants**: `['bug report', 'error log', 'exception', 'bug', 'error', 'error report', 'crash log']`
- **Note**: Excellent coverage of debugging-related terms
- **Points**: 20 | **Difficulty**: Hard

---

## CHAPTER 5

### ch5_async_await
- **Type**: Code
- **Question**: "What keyword makes a function pause and wait for a Promise to resolve?"
- **Current Variants**: `['await']`
- **Missing Variants**: `'await keyword'`, `'async await'`
- **Note**: Just 'await' is correct and sufficient
- **Points**: 15 | **Difficulty**: Medium

### ch5_git_riddle
- **Type**: Riddle
- **Question**: "I track changes but am not a detective. I branch but have no leaves. What am I?"
- **Current Variants**: `['git', 'version control', 'source control']`
- **Note**: Good coverage with tool name and general terms
- **Points**: 20 | **Difficulty**: Hard

### ch5_final_wisdom
- **Type**: Multiple Choice
- **Question**: "What is the true lesson of the journey through time and code?"
- **Current Variants**: `['B']`
- **Note**: Answer is "Progress requires both innovation and ethical responsibility"
- **Points**: 25 | **Difficulty**: Medium

---

## BONUS PUZZLES

### bonus_closure
- **Type**: Code
- **Question**: "When a function remembers variables from its outer scope, what is this called?"
- **Current Variants**: `['closure', 'closures', 'lexical scope']`
- **Missing Variants**: `'lexical scoping'`
- **Note**: Good coverage, both 'closure' and technical term
- **Points**: 25 | **Difficulty**: Hard

### bonus_binary
- **Type**: Code
- **Question**: "What is 1010 in binary as a decimal number?"
- **Current Variants**: `['10']`
- **Note**: Math answer, only one correct result
- **Points**: 15 | **Difficulty**: Medium

### bonus_null_undefined
- **Type**: Multiple Choice
- **Question**: "In JavaScript, what is the difference between null and undefined?"
- **Current Variants**: `['C']`
- **Note**: Answer is "null is intentional absence, undefined is uninitialised"
- **Points**: 20 | **Difficulty**: Hard

---

## Suggestions for Improvement

### High Priority (Missing Common Variants)

1. **prologue_first_command**: Add `'ctrls'` - common typo where user forgets space/separator
   - Suggested: `['ctrl-s', 'ctrl+s', 'ctrls', 'save', 'ctrl s', 'control-s', 'control+s']`

2. **ch2_valley_riddle_2**: Add spaced variant
   - Suggested: `['arpanet', 'arpnet', 'arpa net', 'arpa-net']`

### Medium Priority (Edge Cases)

1. **ch3_fibonacci**: Verify answer is correct (55 - 13 = 42, not 26)
2. **ch2_ethics_module_activation**: Verify answer is 20 or 22
3. **ch3_ada_language**: Consider if full names should be accepted

### Lower Priority (Optional Enhancements)

1. Add pluralization support for riddle answers where applicable
2. Consider accepting answers with articles ("the garage" vs "garage")
3. Add alternative common phrasings for technical terms

---

## Answer Validation Implementation

Current validation in `PuzzleModal.tsx`:

```typescript
const checkAnswer = (answer: string): boolean => {
  const normalizedAnswer = answer.toLowerCase().trim();

  if (Array.isArray(puzzle.answer)) {
    return puzzle.answer.some(a =>
      a.toLowerCase().trim() === normalizedAnswer
    );
  }

  return puzzle.answer.toLowerCase().trim() === normalizedAnswer;
};
```

This is solid and handles:
- ✅ Case insensitivity
- ✅ Whitespace trimming
- ✅ Array variants
- ✅ Single string answers

No changes needed unless adding regex/fuzzy matching in future.

---

## Last Updated
Created during UX improvement session
