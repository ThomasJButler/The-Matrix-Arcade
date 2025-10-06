# CTRL-S The World: Task Breakdown & Agent Assignments

## 🤖 Sub-Agent Responsibilities

### Agent 1: Game State Architect
**Role**: Foundation and persistence layer
**Priority**: HIGH - Must complete first

#### Tasks:
- [ ] Create `GameStateContext.tsx` with React Context
- [ ] Implement `GameStateProvider` wrapper component
- [ ] Build save/load functions with localStorage
- [ ] Create inventory management system
- [ ] Design achievement tracking structure
- [ ] Implement chapter progress tracking
- [ ] Add stats management (coffee, reputation, etc.)
- [ ] Create state migration system for updates

#### Deliverables:
```typescript
// contexts/GameStateContext.tsx
interface GameState {
  currentChapter: number;
  inventory: Item[];
  stats: PlayerStats;
  choices: StoryChoices;
  achievements: Achievement[];
}
```

---

### Agent 2: Puzzle Master
**Role**: Interactive challenges and mini-games
**Priority**: HIGH - Core gameplay element

#### Tasks:
- [ ] Port Python puzzle: "console.log('2' + 2)"
- [ ] Port Python riddle: "I am not a bug..."
- [ ] Create `PuzzleEngine.tsx` component
- [ ] Build `PuzzleModal` with input validation
- [ ] Implement hint system with 3 hints per puzzle
- [ ] Create timer component for timed challenges
- [ ] Design scoring algorithm

#### Mini-Game Tasks:
- [ ] **Terminal Hacker**: WPM typing challenge
- [ ] **Memory Matrix**: Pattern memorization
- [ ] **Code Defusal**: Debug code in 60 seconds
- [ ] **Binary Decoder**: Convert binary messages

#### Puzzle Examples from Python:
```python
# Chapter 2: Algorithm Challenge
"What's the output of: console.log('2' + 2)?"
Answer: "22"

# Chapter 3: Logic Riddle
"I multiply without being a bug, desired but not a feature"
Answer: "Code comments"
```

---

### Agent 3: Story Weaver
**Role**: Narrative branching and choices
**Priority**: MEDIUM - Enhances engagement

#### Tasks:
- [ ] Create `ChoiceModal.tsx` component
- [ ] Design choice card UI with hover effects
- [ ] Implement branching logic system
- [ ] Build consequence tracker
- [ ] Create dialogue variation based on stats
- [ ] Design 3 different endings
- [ ] Add "What If?" scenarios for replay

#### Choice Structure:
```typescript
interface StoryChoice {
  id: string;
  question: string;
  options: {
    text: string;
    consequence: StateChange;
    unlocksPath: string;
  }[];
  timed?: boolean;
  timeLimit?: number;
}
```

---

### Agent 4: UI/UX Enhancer
**Role**: Visual polish and user experience
**Priority**: HIGH - Immediate impact

#### Immediate Tasks:
- [x] Add Save Settings button to AudioSettings
- [ ] Create visual feedback for save action
- [ ] Build `InventoryPanel` slide-out drawer
- [ ] Design `AchievementToast` notifications
- [ ] Create `StatsHUD` overlay component
- [ ] Add progress bars for all stats

#### Visual Effects:
- [ ] Matrix rain intensification during choices
- [ ] Screen glitch effect for hacking
- [ ] Shake effect for dramatic moments
- [ ] Typing speed variation based on coffee level
- [ ] Glow effects for interactive elements

---

### Agent 5: Achievement Hunter
**Role**: Progress tracking and rewards
**Priority**: MEDIUM - Increases replayability

#### Tasks:
- [ ] Define 20+ achievements
- [ ] Create `AchievementManager.tsx`
- [ ] Build achievement gallery page
- [ ] Implement unlock conditions
- [ ] Design achievement icons
- [ ] Create progress tracking for each
- [ ] Add secret achievements

#### Achievement Categories:
```typescript
const achievements = {
  story: [
    'first_puzzle',      // Solve your first puzzle
    'chapter_complete',  // Finish a chapter
    'all_choices_made'   // Make every choice
  ],
  skill: [
    'speed_demon',       // Complete chapter in < 5 min
    'no_hints',          // Solve without hints
    'perfect_hacker'     // No mistakes in mini-game
  ],
  secret: [
    'coffee_overdose',   // 200% coffee level
    'easter_egg_hunter', // Find all secrets
    'fourth_wall'        // Discover meta moment
  ]
};
```

---

### Agent 6: Audio Engineer
**Role**: Enhanced sound experience
**Priority**: LOW - Nice to have

#### Tasks:
- [ ] Create puzzle success/fail sounds
- [ ] Add typing sound variations
- [ ] Implement dynamic music tempo
- [ ] Create tension tracks for timed events
- [ ] Add choice selection sounds
- [ ] Design victory fanfares
- [ ] Implement adaptive volume based on action

---

## 📋 Sprint Planning

### Sprint 1 (Current Week)
**Goal**: Foundation + First Playable

Day 1-2:
- Agent 1: GameStateContext setup
- Agent 4: Save Settings button

Day 3-4:
- Agent 1: Save/load system
- Agent 2: First puzzle implementation

Day 5:
- Integration testing
- Bug fixes

### Sprint 2 (Week 2)
**Goal**: Core Gameplay Loop

- Agent 2: 3 puzzles per chapter
- Agent 3: First choice implementation
- Agent 4: InventoryPanel UI
- Agent 1: Stats tracking

### Sprint 3 (Week 3)
**Goal**: Engagement Features

- Agent 2: 2 mini-games
- Agent 5: Achievement system
- Agent 3: Branching paths
- Agent 6: Dynamic audio

### Sprint 4 (Week 4)
**Goal**: Polish & Ship

- Agent 3: Multiple endings
- Agent 4: Visual effects
- Agent 5: Secret content
- All: Testing & optimization

---

## 🎯 Definition of Done

### Per Feature:
- [ ] Code reviewed
- [ ] Unit tested
- [ ] Integrated with GameState
- [ ] Saves properly
- [ ] Responsive design
- [ ] Keyboard accessible
- [ ] Sound effects added

### Per Sprint:
- [ ] All features playable
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Save/load works
- [ ] Achievements trigger

---

## 📊 Success Metrics

### Week 1:
- Save button works
- 1 puzzle playable
- Game state persists

### Week 2:
- 3+ puzzles working
- Choices affect story
- Inventory visible

### Week 3:
- Mini-games fun
- Achievements unlock
- Music enhances mood

### Week 4:
- Multiple endings reachable
- 20+ minutes gameplay
- Players want more

---

## 🚨 Blockers & Risks

### Technical Risks:
- State management complexity
- Save system corruption
- Performance with animations

### Mitigation:
- Incremental saves
- State validation
- Performance profiling

---

## 🎉 Completion Criteria

The enhancement is complete when:
1. All puzzles from Python are ported
2. 3 distinct endings are reachable
3. Save/load works reliably
4. 15+ achievements are unlockable
5. Players call it "a real game"

---

*Agent assignments are flexible - collaborate when needed!*