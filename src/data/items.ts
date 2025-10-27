import { GameItem } from '../contexts/GameStateContext';

// ============================================================================
// ITEMS DATABASE
// All collectible items in CTRL-S The World
// ============================================================================

export const ITEMS: Record<string, Omit<GameItem, 'quantity' | 'acquiredAt'>> = {
  // ========== QUEST ITEMS (Required for progression) ==========
  ethics_module: {
    id: 'ethics_module',
    name: 'Ethics Module Blueprint',
    description: 'The missing piece that could have prevented the AI uprising',
    type: 'quest',
    usable: false,
    effect: 'Required to complete Chapter 2'
  },

  time_crystal: {
    id: 'time_crystal',
    name: 'Time Crystal',
    description: 'A mysterious artifact that enables temporal manipulation',
    type: 'quest',
    usable: false,
    effect: 'Required for time travel in Chapter 3'
  },

  quantum_key: {
    id: 'quantum_key',
    name: 'Quantum Encryption Key',
    description: 'Unlocks the deepest layers of the AI\'s consciousness',
    type: 'quest',
    usable: false,
    effect: 'Required for Chapter 4 finale'
  },

  ai_core_fragment: {
    id: 'ai_core_fragment',
    name: 'AI Core Fragment',
    description: 'A piece of the original AI consciousness, preserved',
    type: 'quest',
    usable: false,
    effect: 'Affects ending in Chapter 5'
  },

  // ========== CONSUMABLES (Usable for stat boosts) ==========
  coffee_beans: {
    id: 'coffee_beans',
    name: 'Artisanal Coffee Beans',
    description: 'Premium beans from Silicon Valley\'s finest roastery',
    type: 'consumable',
    usable: true,
    effect: '+20 Coffee Level'
  },

  energy_drink: {
    id: 'energy_drink',
    name: 'Hacker Energy Drink',
    description: 'Questionable ingredients, undeniable results',
    type: 'consumable',
    usable: true,
    effect: '+30 Coffee Level (warning: jitters!)'
  },

  meditation_app: {
    id: 'meditation_app',
    name: 'Mindfulness App',
    description: 'Breathe in, breathe out, save the world',
    type: 'consumable',
    usable: true,
    effect: '+15 Team Morale, -10 Coffee'
  },

  code_review: {
    id: 'code_review',
    name: 'Perfect Code Review',
    description: 'Zero bugs, all praise, maximum satisfaction',
    type: 'consumable',
    usable: true,
    effect: '+10 Hacker Reputation'
  },

  // ========== COLLECTIBLES (Lore and achievements) ==========
  team_photo: {
    id: 'team_photo',
    name: 'Team Photo',
    description: 'A snapshot of the heroes before the chaos',
    type: 'collectible',
    usable: false,
    effect: '+15 Team Morale when acquired'
  },

  server_manual: {
    id: 'server_manual',
    name: 'Ancient Server Manual',
    description: 'Knowledge from the before times, written on actual paper',
    type: 'collectible',
    usable: false,
    effect: '+10 Wisdom Points when acquired'
  },

  hacker_badge: {
    id: 'hacker_badge',
    name: 'Elite Hacker Badge',
    description: 'Proof of legendary coding skills',
    type: 'collectible',
    usable: false,
    effect: '+5 Hacker Reputation when acquired'
  },

  rubber_duck: {
    id: 'rubber_duck',
    name: 'Debug Rubber Duck',
    description: 'The ultimate debugging companion, silently judging your code',
    type: 'collectible',
    usable: false,
    effect: 'Unlocks secret dialogue in Chapter 3'
  },

  mechanical_keyboard: {
    id: 'mechanical_keyboard',
    name: 'Vintage Mechanical Keyboard',
    description: 'Click-clack your way to victory',
    type: 'collectible',
    usable: false,
    effect: '+5 Hacker Reputation when acquired'
  },

  // ========== SPECIAL ITEMS (Easter eggs and secrets) ==========
  easter_egg_token: {
    id: 'easter_egg_token',
    name: 'Easter Egg Token',
    description: 'You found a secret! Collect all 5 for a surprise',
    type: 'special',
    usable: false,
    effect: 'Part of secret achievement'
  },

  red_pill: {
    id: 'red_pill',
    name: 'The Red Pill',
    description: 'See how deep the rabbit hole goes',
    type: 'special',
    usable: true,
    effect: 'Reveals hidden narrative paths'
  },

  blue_pill: {
    id: 'blue_pill',
    name: 'The Blue Pill',
    description: 'Ignorance is bliss',
    type: 'special',
    usable: true,
    effect: '+20 Team Morale, blocks certain story paths'
  },

  golden_commit: {
    id: 'golden_commit',
    name: 'The Golden Commit',
    description: 'A perfect, bug-free commit. Myth or reality?',
    type: 'special',
    usable: false,
    effect: 'Unlocks "Perfectionist" achievement'
  },

  stack_overflow_trophy: {
    id: 'stack_overflow_trophy',
    name: 'Stack Overflow Trophy',
    description: 'For answering 1000 questions... in your mind',
    type: 'special',
    usable: false,
    effect: '+25 Wisdom Points when acquired'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getItemById = (id: string): Omit<GameItem, 'quantity' | 'acquiredAt'> | undefined => {
  return ITEMS[id];
};

export const getQuestItems = (): Array<Omit<GameItem, 'quantity' | 'acquiredAt'>> => {
  return Object.values(ITEMS).filter(item => item.type === 'quest');
};

export const getConsumables = (): Array<Omit<GameItem, 'quantity' | 'acquiredAt'>> => {
  return Object.values(ITEMS).filter(item => item.type === 'consumable');
};

export const getCollectibles = (): Array<Omit<GameItem, 'quantity' | 'acquiredAt'>> => {
  return Object.values(ITEMS).filter(item => item.type === 'collectible');
};

export const getSpecialItems = (): Array<Omit<GameItem, 'quantity' | 'acquiredAt'>> => {
  return Object.values(ITEMS).filter(item => item.type === 'special');
};

export const getTotalItemCount = (): number => {
  return Object.keys(ITEMS).length;
};

// ============================================================================
// ITEM REWARDS FOR PUZZLES
// Maps puzzle IDs to item rewards
// ============================================================================

export const PUZZLE_REWARDS: Record<string, string[]> = {
  // Prologue puzzles
  'prologue_first_command': ['coffee_beans'],

  // Chapter 1 puzzles
  'ch1_team_quiz': ['team_photo'],
  'ch1_bunker_code': ['hacker_badge'],

  // Chapter 2 puzzles
  'ch2_silicon_valley_riddles': ['ethics_module'],
  'ch2_valley_riddle_2': [], // Part of silicon_valley_riddles
  'ch2_valley_riddle_3': [], // Part of silicon_valley_riddles
  'ch2_console_log': ['coffee_beans'],
  'ch2_bug_riddle': ['server_manual'],
  'ch2_ethics_module_activation': ['quantum_key'],

  // Chapter 3 puzzles
  'ch3_ada_language': ['mechanical_keyboard'],
  'ch3_fibonacci': ['time_crystal'],
  'ch3_fire_riddle': ['rubber_duck'],
  'ch3_array_length': ['energy_drink'],
  'ch3_logic_puzzle': ['meditation_app'],

  // Chapter 4 puzzles
  'ch4_world_assessment': ['time_crystal'],
  'ch4_glitch_detection': ['quantum_key'],
  'ch4_fragment_decision': ['code_review'],
  'ch4_pattern_recognition': ['hacker_badge'],
  'ch4_code_analysis': ['server_manual'],
  'ch4_emotional_intelligence': ['meditation_app'],

  // Chapter 5 puzzles
  'ch5_async_await': ['ai_core_fragment'],
  'ch5_git_riddle': ['golden_commit'],
  'ch5_final_wisdom': ['meditation_app'],

  // Bonus puzzles
  'bonus_closure': ['red_pill'],
  'bonus_binary': ['easter_egg_token'],
  'bonus_null_undefined': ['stack_overflow_trophy']
};

export const getItemRewardsForPuzzle = (puzzleId: string): string[] => {
  return PUZZLE_REWARDS[puzzleId] || [];
};
