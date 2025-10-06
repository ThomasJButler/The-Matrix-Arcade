import { PuzzleData } from '../components/ui/PuzzleModal';

// ============================================================================
// PUZZLE DATABASE
// Ported from Python version and enhanced for React
// ============================================================================

export const PUZZLES: Record<string, PuzzleData> = {
  // ========== CHAPTER 2 PUZZLES ==========
  ch2_console_log: {
    id: 'ch2_console_log',
    type: 'code',
    question: "What's the output of: console.log('2' + 2)?",
    answer: ['22', '"22"'],
    hints: [
      'Think about JavaScript type coercion.',
      'The + operator can do two things: addition and concatenation.',
      'When one operand is a string, JavaScript converts the other to a string too.'
    ],
    timeLimit: 60,
    points: 10,
    difficulty: 'easy',
    context: 'Neo is testing your JavaScript knowledge. Type coercion is a fundamental concept!'
  },

  ch2_bug_riddle: {
    id: 'ch2_bug_riddle',
    type: 'riddle',
    question: 'I multiply without being a bug, desired but not a feature. What am I?',
    answer: ['comments', 'comment', 'documentation', 'code comments'],
    hints: [
      'Think about things developers write that aren\'t code.',
      'They explain what code does but don\'t execute.',
      'They "multiply" understanding across the team.'
    ],
    points: 15,
    difficulty: 'medium',
    context: 'Trinity challenges you with a classic developer riddle.'
  },

  // ========== CHAPTER 3 PUZZLES ==========
  ch3_array_length: {
    id: 'ch3_array_length',
    type: 'code',
    question: 'const arr = [1, 2, 3]; arr[10] = 99; What is arr.length?',
    answer: ['11'],
    hints: [
      'JavaScript arrays can have gaps.',
      'Setting an index creates all indices up to that point.',
      'Length is always the highest index + 1.'
    ],
    timeLimit: 45,
    points: 15,
    difficulty: 'medium',
    context: 'Morpheus wants to see if you understand JavaScript arrays deeply.'
  },

  ch3_logic_puzzle: {
    id: 'ch3_logic_puzzle',
    type: 'riddle',
    question: 'I am always coming but never arrive. What am I?',
    answer: ['tomorrow', 'the future'],
    hints: [
      'Think about time.',
      'It\'s always ahead of you.',
      'When it arrives, it becomes something else.'
    ],
    points: 10,
    difficulty: 'easy',
    context: 'The Oracle tests your wisdom with a philosophical puzzle.'
  },

  // ========== CHAPTER 4 PUZZLES ==========
  ch4_keyboard_shortcut: {
    id: 'ch4_keyboard_shortcut',
    type: 'multiple-choice',
    question: 'Which keyboard shortcut saves a file in most text editors?',
    answer: ['B'], // Correct answer is option B
    optionA: 'Ctrl+C',
    optionB: 'Ctrl+S',
    optionC: 'Ctrl+V',
    optionD: 'Ctrl+Z',
    hints: [
      'Think about the game title!',
      'It\'s literally in the name of this game.',
      'CTRL-S The World... what does the S stand for?'
    ],
    timeLimit: 30,
    points: 5,
    difficulty: 'easy',
    context: 'Agent Smith taunts you with an "easy" question. Or is it a trap?'
  },

  ch4_recursion: {
    id: 'ch4_recursion',
    type: 'code',
    question: 'A function calls itself. What is this technique called?',
    answer: ['recursion', 'recursive'],
    hints: [
      'It\'s when a function references itself.',
      'Common in tree traversal and divide-and-conquer algorithms.',
      'It needs a base case to avoid infinite loops.'
    ],
    points: 10,
    difficulty: 'medium',
    context: 'The Architect tests your understanding of fundamental programming concepts.'
  },

  // ========== CHAPTER 5 PUZZLES ==========
  ch5_async_await: {
    id: 'ch5_async_await',
    type: 'code',
    question: 'What keyword makes a function pause and wait for a Promise to resolve?',
    answer: ['await'],
    hints: [
      'It\'s used with async functions.',
      'It literally means "wait for this".',
      'Introduced in ES2017 as a cleaner alternative to .then()'
    ],
    timeLimit: 45,
    points: 15,
    difficulty: 'medium',
    context: 'The Keymaker challenges your knowledge of asynchronous JavaScript.'
  },

  ch5_git_riddle: {
    id: 'ch5_git_riddle',
    type: 'riddle',
    question: 'I track changes but am not a detective. I branch but have no leaves. What am I?',
    answer: ['git', 'version control', 'source control'],
    hints: [
      'Developers use this daily.',
      'It helps teams collaborate on code.',
      'Created by Linus Torvalds in 2005.'
    ],
    points: 20,
    difficulty: 'hard',
    context: 'The final test from Neo himself. Can you prove you\'re a true hacker?'
  },

  // ========== BONUS PUZZLES ==========
  bonus_closure: {
    id: 'bonus_closure',
    type: 'code',
    question: 'When a function remembers variables from its outer scope, what is this called?',
    answer: ['closure', 'closures', 'lexical scope'],
    hints: [
      'It\'s a fundamental JavaScript concept.',
      'It "closes over" the variables it needs.',
      'Commonly used for data privacy and function factories.'
    ],
    points: 25,
    difficulty: 'hard',
    context: 'A secret challenge has appeared! Only the wisest hackers can solve this.'
  },

  bonus_binary: {
    id: 'bonus_binary',
    type: 'code',
    question: 'What is 1010 in binary as a decimal number?',
    answer: ['10'],
    hints: [
      'Binary is base-2: powers of 2 from right to left.',
      '1010 = (1×8) + (0×4) + (1×2) + (0×1)',
      'Calculate: 8 + 0 + 2 + 0'
    ],
    timeLimit: 60,
    points: 15,
    difficulty: 'medium',
    context: 'Deep in the Matrix code, you must decode binary to proceed.'
  },

  bonus_null_undefined: {
    id: 'bonus_null_undefined',
    type: 'multiple-choice',
    question: 'In JavaScript, what is the difference between null and undefined?',
    answer: ['C'],
    optionA: 'They are exactly the same',
    optionB: 'undefined is intentional absence, null is accidental',
    optionC: 'null is intentional absence, undefined is uninitialized',
    optionD: 'There is no difference, both are false',
    hints: [
      'One is set by developers, one is set by JavaScript.',
      'undefined means "hasn\'t been assigned yet".',
      'null means "intentionally empty".'
    ],
    points: 20,
    difficulty: 'hard',
    context: 'The Oracle wants to know if you understand JavaScript\'s quirks.'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getPuzzlesByChapter = (chapter: number): PuzzleData[] => {
  const prefix = `ch${chapter}_`;
  return Object.values(PUZZLES).filter(p => p.id.startsWith(prefix));
};

export const getBonusPuzzles = (): PuzzleData[] => {
  return Object.values(PUZZLES).filter(p => p.id.startsWith('bonus_'));
};

export const getPuzzleById = (id: string): PuzzleData | undefined => {
  return PUZZLES[id];
};

export const getTotalPuzzles = (): number => {
  return Object.keys(PUZZLES).length;
};

export const getTotalPoints = (): number => {
  return Object.values(PUZZLES).reduce((sum, p) => sum + p.points, 0);
};
