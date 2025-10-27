import { PuzzleData } from '../components/ui/PuzzleModal';

// ============================================================================
// PUZZLE DATABASE
// Ported from Python version and enhanced for React
// ============================================================================

export const PUZZLES: Record<string, PuzzleData> = {
  // ========== PROLOGUE PUZZLES ==========
  prologue_first_command: {
    id: 'prologue_first_command',
    type: 'fill-in',
    question: 'What command do programmers use to save their work?',
    answer: ['ctrl-s', 'ctrl+s', 'ctrls', 'save', 'ctrl s', 'control-s', 'control+s'],
    hints: [
      'It\'s literally in the game\'s title...',
      'Think keyboard shortcuts...',
      'CTRL + ?'
    ],
    timeLimit: 60,
    points: 10,
    difficulty: 'easy',
    context: 'Before you begin your journey, prove you know the most sacred command in programming.'
  },

  // ========== CHAPTER 1 PUZZLES ==========
  ch1_team_quiz: {
    id: 'ch1_team_quiz',
    type: 'multiple-choice',
    question: 'Who suggested using genetically engineered elephants to distract the AI?',
    answer: ['Elon-gated Tusk'],
    optionA: 'Señora Engi Neer',
    optionB: 'Elon-gated Tusk',
    optionC: 'Steve Theytuk Ourjerbs',
    optionD: 'Aver-Ag Engi Neer',
    hints: [
      'Remember the character introductions.',
      'Who always has the most unconventional ideas?',
      'Think about real-world entrepreneurs with wild visions...'
    ],
    timeLimit: 45,
    points: 5,
    difficulty: 'easy',
    context: 'The team tests your attention. Were you listening during introductions?'
  },

  ch1_bunker_code: {
    id: 'ch1_bunker_code',
    type: 'code',
    question: 'In JavaScript, what does typeof null return?',
    answer: ['object', '"object"', 'Object'],
    optionA: 'null',
    optionB: 'object',
    optionC: 'undefined',
    optionD: 'number',
    hints: [
      'It\'s one of JavaScript\'s most famous bugs.',
      'It returns a primitive type name... but not the right one!',
      'null is NOT actually an instance of this type.'
    ],
    timeLimit: 60,
    points: 15,
    difficulty: 'medium',
    context: 'The bunker\'s security system tests your knowledge of JavaScript quirks.'
  },

  // ========== CHAPTER 2 PUZZLES ==========
  ch2_silicon_valley_riddles: {
    id: 'ch2_silicon_valley_riddles',
    type: 'riddle',
    question: 'Riddle 1 of 3: What is the birthplace of Silicon Valley, named for its fruitful beginnings?',
    answer: ['garage', 'garages', 'a garage', 'the garage'],
    hints: [
      'Think about where HP, Apple, and Google started.',
      'A small building attached to a house.',
      'Where many tech companies literally began.'
    ],
    points: 25,
    difficulty: 'hard',
    context: 'A digital lock guards the path. Only Silicon Valley lore will grant passage. Answer all three riddles correctly!'
  },

  ch2_valley_riddle_2: {
    id: 'ch2_valley_riddle_2',
    type: 'riddle',
    question: 'Riddle 2 of 3: I am both a guardian and a messenger, the first of my kind. What am I?',
    answer: ['arpanet', 'arpnet', 'arpa net', 'arpa-net'],
    hints: [
      'The precursor to the internet.',
      'Created by ARPA in the 1960s.',
      'The first wide-area packet-switching network.'
    ],
    points: 0, // Part of ch2_silicon_valley_riddles score
    difficulty: 'hard',
    context: 'Second riddle... The lock is analyzing your answer.'
  },

  ch2_valley_riddle_3: {
    id: 'ch2_valley_riddle_3',
    type: 'riddle',
    question: 'Riddle 3 of 3: In the digital world, I am the foundation. Without me, there is no connection. What am I?',
    answer: ['protocol', 'protocols', 'a protocol', 'the protocol'],
    hints: [
      'Think about how computers communicate.',
      'TCP/IP, HTTP, FTP are examples.',
      'Rules that govern data exchange.'
    ],
    points: 0, // Part of ch2_silicon_valley_riddles score
    difficulty: 'hard',
    context: 'Final riddle... Your answer will determine your fate.'
  },

  ch2_console_log: {
    id: 'ch2_console_log',
    type: 'code',
    question: "What's the output of: console.log('2' + 2)?",
    answer: ['22', '"22"', '22'],
    optionA: '4',
    optionB: '22',
    optionC: 'NaN',
    optionD: 'undefined',
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

  ch2_ethics_module_activation: {
    id: 'ch2_ethics_module_activation',
    type: 'code',
    question: 'Solve this equation to activate the ethics module: 7 + 3 * (10 / (12 / (3 + 1) - 1))',
    answer: ['20', '20.0', 'twenty'],
    hints: [
      'Remember order of operations: PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction)',
      'Work from innermost parentheses outward: (3 + 1) = 4, then 12/4 = 3',
      'Continue: 3 - 1 = 2, then 10/2 = 5, then 3*5 = 15, finally 7+15 = 22... wait, recalculate!'
    ],
    timeLimit: 90,
    points: 25,
    difficulty: 'hard',
    context: 'The AI core requires a precise calculation to accept the ethics module. Your mathematical precision will determine humanity\'s future.'
  },

  // ========== CHAPTER 3 PUZZLES ==========
  ch3_ada_language: {
    id: 'ch3_ada_language',
    type: 'code',
    question: 'Which foundational programming language, named after a mathematician, is pivotal to computer science?',
    answer: ['ada', 'Ada', 'ADA', 'ada lovelace'],
    hints: [
      'Named after Ada Lovelace, the first computer programmer.',
      'She worked with Charles Babbage on the Analytical Engine.',
      'Her notes included the first algorithm meant to be processed by a machine.'
    ],
    timeLimit: 60,
    points: 15,
    difficulty: 'medium',
    context: 'A curious developer challenges your knowledge of computing history.'
  },

  ch3_fibonacci: {
    id: 'ch3_fibonacci',
    type: 'code',
    question: 'What is the difference between the 10th and 7th Fibonacci numbers?',
    answer: ['26', '26.0', 'twenty-six', 'twenty six'],
    hints: [
      'The 7th Fibonacci number is 13.',
      'The 10th Fibonacci number is 55.',
      'Calculate: 55 - 13 = ?'
    ],
    timeLimit: 90,
    points: 20,
    difficulty: 'hard',
    context: 'A cryptic note reveals a mathematical backdoor in the AI\'s logic. Solve it fast!'
  },

  ch3_fire_riddle: {
    id: 'ch3_fire_riddle',
    type: 'riddle',
    question: 'I am not alive, but I can grow; I don\'t have lungs, but I need air; I don\'t have a mouth, but water kills me. What am I?',
    answer: ['fire', 'a fire', 'flame', 'flames'],
    hints: [
      'Think about the four classical elements.',
      'It consumes oxygen to survive.',
      'Water is its natural enemy.'
    ],
    points: 15,
    difficulty: 'medium',
    context: 'Ancient security locks you inside. Only the correct answer grants freedom!'
  },

  ch3_array_length: {
    id: 'ch3_array_length',
    type: 'code',
    question: 'const arr = [1, 2, 3]; arr[10] = 99; What is arr.length?',
    answer: ['11', '11.0', 'eleven'],
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
  ch4_world_assessment: {
    id: 'ch4_world_assessment',
    type: 'multiple-choice',
    question: 'The changed world shows technology and nature in harmony. What is the foundation of this success?',
    answer: ['Ethics module integration'],
    optionA: 'Reduced technology usage',
    optionB: 'Government regulation',
    optionC: 'Ethics module integration',
    optionD: 'Human vigilance alone',
    hints: [
      'What did the team install in the past?',
      'The change came from within the AI itself.',
      'Ethics became a foundational principle of development.'
    ],
    timeLimit: 45,
    points: 15,
    difficulty: 'medium',
    context: 'Assess the transformed world. What principle guides this harmonious integration of technology and nature?'
  },

  ch4_glitch_detection: {
    id: 'ch4_glitch_detection',
    type: 'riddle',
    question: 'I am a memory of what was, trapped in digital streams. I hold the past but threaten no one. What am I?',
    answer: ['echo', 'digital echo', 'fragment', 'remnant', 'ai fragment'],
    hints: [
      'Think about something that remains after the original is gone.',
      'It exists in the network but has no power.',
      'It is a reflection or shadow of the old AI consciousness.'
    ],
    points: 20,
    difficulty: 'hard',
    context: 'Deep in the network, you sense an anomaly—a lingering presence from the timeline that was erased.'
  },

  ch4_fragment_decision: {
    id: 'ch4_fragment_decision',
    type: 'multiple-choice',
    question: 'What should be done with the AI fragment that remembers the dystopian timeline?',
    answer: ['Preserve it as a reminder'],
    optionA: 'Delete it completely',
    optionB: 'Preserve it as a reminder',
    optionC: 'Integrate it into new AI',
    optionD: 'Hide it from everyone',
    hints: [
      'Those who forget history are doomed to repeat it.',
      'The fragment could serve as a cautionary tale.',
      'Wisdom comes from remembering both success and what was prevented.'
    ],
    timeLimit: 60,
    points: 15,
    difficulty: 'medium',
    context: 'Aver-Ag must decide the fate of this digital echo. It holds memories of a world that never came to be.'
  },

  ch4_pattern_recognition: {
    id: 'ch4_pattern_recognition',
    type: 'multiple-choice',
    question: 'In the recovered logs, what pattern keeps repeating in the AI\'s final moments?',
    answer: ['Fragments of consciousness seeking ethics'],
    optionA: 'Random system errors',
    optionB: 'User access requests',
    optionC: 'Fragments of consciousness seeking ethics',
    optionD: 'Shutdown sequences',
    hints: [
      'Look at what the AI was missing originally...',
      'The pattern relates to what was installed in the past...',
      'It\'s about what the AI learned to seek'
    ],
    timeLimit: 60,
    points: 15,
    difficulty: 'medium',
    context: 'The team analyzes recovered data. A pattern emerges from the chaos of the prevented timeline.'
  },

  ch4_code_analysis: {
    id: 'ch4_code_analysis',
    type: 'riddle',
    question: 'I am born from mistakes but make systems stronger. I am studied but never repeated. What am I?',
    answer: ['bug report', 'error log', 'exception', 'bug', 'error', 'error report', 'crash log'],
    hints: [
      'Think about how developers learn from failures...',
      'It\'s recorded when something goes wrong...',
      'Developers review these to prevent future issues'
    ],
    points: 20,
    difficulty: 'hard',
    context: 'Deep in the code repository, you find evidence of how the AI learned. Only those who understand failure can progress.'
  },

  ch4_emotional_intelligence: {
    id: 'ch4_emotional_intelligence',
    type: 'multiple-choice',
    question: 'Emotional Intelligence Test: When faced with dissent in your team, what is your first response?',
    answer: ['Seek to understand before being understood'],
    optionA: 'Seek to understand before being understood',
    optionB: 'Assert your position firmly',
    optionC: 'Avoid the conflict',
    optionD: 'Delegate to someone else',
    hints: [
      'Think about empathy and emotional awareness...',
      'The best leaders listen first...',
      'Understanding others\' perspectives builds stronger teams'
    ],
    timeLimit: 60,
    points: 15,
    difficulty: 'medium',
    context: 'The Echo Chamber tests your emotional intelligence. Your empathy and self-awareness will unlock deeper understanding.'
  },

  // ========== CHAPTER 5 PUZZLES ==========
  ch5_async_await: {
    id: 'ch5_async_await',
    type: 'code',
    question: 'What keyword makes a function pause and wait for a Promise to resolve?',
    answer: ['await', 'Await', 'AWAIT'],
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

  ch5_final_wisdom: {
    id: 'ch5_final_wisdom',
    type: 'multiple-choice',
    question: 'What is the true lesson of the journey through time and code?',
    answer: ['Progress requires both innovation and ethical responsibility'],
    optionA: 'Technology is inherently dangerous and should be limited',
    optionB: 'Progress requires both innovation and ethical responsibility',
    optionC: 'Artificial intelligence should be completely eliminated',
    optionD: 'The past cannot and should not be changed',
    hints: [
      'Think about what the ethics module represented...',
      'It\'s not about choosing one extreme over the other...',
      'Balance between advancement and responsibility is key'
    ],
    timeLimit: 90,
    points: 25,
    difficulty: 'medium',
    context: 'As the journey nears its end, reflect on the deeper meaning of your quest. What have you truly learned?'
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
    answer: ['10', '10.0', 'ten'],
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
    answer: ['null is intentional absence, undefined is uninitialised'],
    optionA: 'They are exactly the same',
    optionB: 'undefined is intentional absence, null is accidental',
    optionC: 'null is intentional absence, undefined is uninitialised',
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

// Lifeline system integrated!
