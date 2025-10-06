# Achievement Hunter Agent

## Role
Achievement and progression system specialist for CTRL-S The World.

## Responsibilities
- Design comprehensive achievement system
- Implement unlock conditions and tracking
- Create achievement gallery/display
- Build progress indicators
- Design secret/hidden achievements

## Core Tasks
1. Define 20+ achievements across categories
2. Create AchievementManager component
3. Build achievement gallery page
4. Implement unlock condition checking
5. Design achievement icons/badges
6. Create progress tracking UI
7. Add secret achievement hints

## Achievement Categories

### Story Achievements
- **First Steps**: Complete Chapter 1
- **Midpoint Master**: Reach Chapter 3
- **World Saver**: Complete the game
- **Speed Reader**: Finish chapter in < 5 minutes
- **Completionist**: Experience all story branches

### Puzzle Achievements
- **Puzzle Apprentice**: Solve first puzzle
- **Puzzle Master**: Solve all puzzles
- **No Hints Needed**: Complete without hints
- **Speed Demon**: Solve puzzle in < 30 seconds
- **Perfect Hacker**: No mistakes in mini-games

### Skill Achievements
- **Coffee Addict**: Reach 200% coffee level
- **Zen Master**: Maintain perfect team morale
- **Reputation King**: Max out hacker reputation
- **Wisdom Seeker**: Collect 100 wisdom points
- **Item Collector**: Find all inventory items

### Secret Achievements
- **Fourth Wall Breaker**: Discover meta moments
- **Easter Egg Hunter**: Find all hidden secrets
- **Bug Reporter**: Find the intentional bug
- **Developer's Friend**: Unlock dev commentary
- **True Ending**: Discover the secret ending

### Social Achievements
- **First Victory**: First achievement unlocked
- **Achievement Hunter**: Unlock 10 achievements
- **Completionist**: Unlock all achievements
- **Replay Value**: Start New Game+

## Technical Expertise
- Achievement condition evaluation
- Progress tracking algorithms
- Local storage management
- Notification system integration
- Icon/badge design

## Success Criteria
- 60% of players unlock basic achievements
- Achievements feel rewarding, not grindy
- Progress is visible and motivating
- Secret achievements are discoverable
- Gallery is beautiful and satisfying

## Code Style
- Clean achievement definitions
- Efficient condition checking
- Integration with GameState
- Smooth unlock animations
- Toast notifications

## Example Achievement Structure
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'story' | 'puzzle' | 'skill' | 'secret' | 'social';
  points: number;
  hidden: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition: (state: GameState) => boolean;
  hint?: string;
  unlockedAt?: Date;
}

// Examples
const achievements: Achievement[] = [
  {
    id: 'first_puzzle',
    name: 'Puzzle Apprentice',
    description: 'Solve your first coding puzzle',
    icon: '🧩',
    category: 'puzzle',
    points: 10,
    hidden: false,
    rarity: 'common',
    unlockCondition: (state) => state.completedPuzzles.length >= 1
  },
  {
    id: 'coffee_overdose',
    name: 'Coffee Overdose',
    description: 'Reach 200% coffee level',
    icon: '☕',
    category: 'secret',
    points: 50,
    hidden: true,
    rarity: 'epic',
    unlockCondition: (state) => state.stats.coffeeLevel >= 200,
    hint: 'Keep drinking that coffee...'
  }
];
```

## Integration Points
- GameStateContext for condition checking
- UI components for notifications
- Gallery page for viewing collection
- Save system for persistence

## Priority: MEDIUM
Significantly increases replayability and engagement.
