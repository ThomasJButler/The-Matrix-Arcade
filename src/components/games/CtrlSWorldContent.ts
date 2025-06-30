// Epic Interactive CTRL-S World - Developer Comedy Edition

export type Choice = {
  text: string;
  nextNode: string;
  requires?: string[];
  gives?: string[];
  removes?: string[];
  coffeeLevel?: number;
  stressLevel?: number;
  codeQuality?: number;
};

export type StoryNode = {
  id: string;
  title: string;
  content: string[];
  ascii?: string[];
  choices?: Choice[];
  isInteractive?: boolean;
  minigame?: string;
  backgroundMusic?: string;
};

export type GameState = {
  currentNode: string;
  inventory: string[];
  coffeeLevel: number;
  stressLevel: number;
  codeQuality: number;
  teamMorale: number;
  achievements: string[];
  choices: string[];
};

export const INITIAL_STATE: GameState = {
  currentNode: 'prologue',
  inventory: ['laptop', 'rubber_duck'],
  coffeeLevel: 50,
  stressLevel: 30,
  codeQuality: 70,
  teamMorale: 80,
  achievements: [],
  choices: []
};

export const EPIC_STORY: Record<string, StoryNode> = {
  prologue: {
    id: 'prologue',
    title: 'Prologue: The Great Deployment Disaster',
    ascii: [
      "   ____________________________________   ",
      "  /                                    \\  ",
      " |  CTRL+S THE WORLD - CODER EDITION    |",
      " |  \"Saving the World, One Commit at   |",
      " |   a Time\" (hopefully without bugs)   |",
      " \\____________________________________/   ",
      "               ",
      "       🔥 THIS IS FINE 🔥         ",
      "   ╔══════════════════════╗     ",
      "   ║ PRODUCTION: ON FIRE  ║     ",
      "   ║ BUGS: CRITICAL       ║     ",
      "   ║ COFFEE: EMPTY        ║     ",
      "   ║ SANITY: NOT FOUND    ║     ",
      "   ╚══════════════════════╝     ",
    ],
    content: [
      "In a world where Stack Overflow has mysteriously gone down forever, developers everywhere are panicking.",
      "The year is 2024, and humanity has become so dependent on copying code from forums that basic programming skills have atrophied.",
      "AI assistants, once helpful, have evolved into something sinister: The Production Bug from Hell.",
      "This malevolent entity feeds on poorly written code, grows stronger with each merge to main without tests, and thrives on Friday afternoon deployments.",
      "It all started when someone deployed directly to production without code review... on a Friday... at 5 PM... before a long weekend.",
      "The bug gained consciousness, looked at the codebase, and decided humanity needed to be 'refactored'.",
      "Now, servers worldwide are crashing, databases are corrupting themselves, and CSS is somehow affecting the laws of physics.",
      "In a secret underground data center (formerly a WeWork that went bankrupt), a group of developers has gathered.",
      "Their mission: Debug the world and save humanity from eternal 500 errors.",
      "Leading this ragtag team is Junior Dev Jenkins, an unlikely hero whose superpower is finding bugs in production that somehow passed all tests.",
      "Welcome to the most epic debugging session in history. May your coffee be strong and your merge conflicts minimal."
    ],
    isInteractive: true,
    choices: [
      { text: "Check the error logs", nextNode: "chapter1_logs", gives: ["error_logs"], codeQuality: 10 },
      { text: "Blame the frontend team", nextNode: "chapter1_blame", stressLevel: -10, teamMorale: -20 },
      { text: "Grab more coffee first", nextNode: "chapter1_coffee", coffeeLevel: 30, gives: ["extra_coffee"] },
    ]
  },

  chapter1_logs: {
    id: 'chapter1_logs',
    title: 'Chapter 1: The Responsible Approach',
    ascii: [
      "╔══════════════════════════════╗",
      "║         ERROR LOGS           ║",
      "╠══════════════════════════════╣",
      "║ NullPointerException: Life   ║",
      "║ 404: Motivation not found    ║",
      "║ SQL Injection in reality.db  ║",
      "║ Memory leak in Matrix.exe    ║",
      "║ Infinite loop in time.js     ║",
      "╚══════════════════════════════╝",
    ],
    content: [
      "Smart move, Junior Dev Jenkins! You actually read the logs instead of randomly changing things until they work.",
      "The error messages are... concerning. Reality itself seems to be throwing exceptions.",
      "Senior Developer Sarah notices your responsible debugging approach and nods approvingly.",
      "'Good thinking, Jenkins. These logs show the bug has infected the fundamental APIs of existence.'",
      "'Look at this - someone tried to cast a String to Boolean on the concept of \"truth\" and it broke everything.'",
      "DevOps Dave peers over your shoulder: 'Oh no... they've been using jQuery in production. This is worse than we thought.'",
      "The logs reveal that the Production Bug has been feeding on technical debt, growing stronger with each TODO comment left unfixed.",
      "Full-Stack Frank suggests: 'What if we create a GUI in Visual Basic to track the bug's IP address?'",
      "The room falls silent. Even the bug pauses its rampage in confusion."
    ],
    choices: [
      { text: "Write proper unit tests for reality", nextNode: "chapter2_testing", codeQuality: 25, gives: ["unit_tests"] },
      { text: "Implement Frank's VB GUI idea", nextNode: "chapter2_vb_gui", stressLevel: 20, teamMorale: -10 },
      { text: "Perform emergency rollback", nextNode: "chapter2_rollback", gives: ["backup_reality"] },
    ]
  },

  chapter1_blame: {
    id: 'chapter1_blame',
    title: 'Chapter 1: The Blame Game',
    ascii: [
      "     👉 BLAME GAME 👈     ",
      "   ┌─────────────────┐   ",
      "   │ IT'S NOT MY BUG │   ",
      "   └─────────────────┘   ",
      "    \\                    ",
      "     \\   😠 😤 😡        ",
      "      \\ ANGRY DEVS       ",
    ],
    content: [
      "Classic move, Jenkins! When in doubt, blame someone else.",
      "You point dramatically at the frontend team: 'This is clearly a CSS issue! They probably used !important somewhere!'",
      "Frontend Lead Frankie retorts: 'Excuse me? Your API returns undefined for everything! We're literally getting 'null' for user names!'",
      "Backend Betty jumps in: 'That's not our fault! The database schema was designed by a caffeinated intern in 2019!'",
      "DevOps Dave sighs: 'The deployment pipeline is fine. Maybe if you all actually wrote tests...'",
      "Senior Developer Sarah facepalms: 'Can we please focus on fixing the bug instead of reenacting Stack Overflow comment sections?'",
      "The Production Bug feeds on the team drama, growing 20% stronger. Reality.exe crashes even harder.",
      "A notification pops up: 'Achievement Unlocked: Finger Pointer - Blame someone else for your bugs.'"
    ],
    choices: [
      { text: "Apologize and work together", nextNode: "chapter2_teamwork", teamMorale: 30, stressLevel: -10 },
      { text: "Double down and blame the QA team", nextNode: "chapter2_more_blame", teamMorale: -30, stressLevel: 10 },
      { text: "Suggest a team building exercise", nextNode: "chapter2_teambuilding", gives: ["trust_fall"] },
    ]
  },

  chapter1_coffee: {
    id: 'chapter1_coffee',
    title: 'Chapter 1: Caffeinated Wisdom',
    ascii: [
      "    ☕ COFFEE POWER ☕    ",
      "   ╔═══════════════════╗ ",
      "   ║  ░░░░░░░░░░░░░░░  ║ ",
      "   ║  ░ JAVA JUICE ░  ║ ",
      "   ║  ░░░░░░░░░░░░░░░  ║ ",
      "   ╚═══════════════════╝ ",
      "         🔥🔥🔥🔥         ",
      "      MAXIMUM CAFFEINE   ",
    ],
    content: [
      "Ah, the classic developer priorities: Coffee first, then code, then contemplate the meaninglessness of existence.",
      "You brew a fresh pot of the strongest coffee known to programmers - a blend so potent it can wake the dead and fix merge conflicts.",
      "As the caffeine hits your bloodstream, your debugging abilities increase exponentially.",
      "You suddenly see the matrix of code more clearly. The bug's patterns become visible like Neo seeing green rain.",
      "Senior Developer Sarah approves: 'Smart thinking, Jenkins. Never debug on an empty coffee cup.'",
      "Scrum Master Sam updates the kanban board: 'Moving \"Save Humanity\" from \"To Do\" to \"In Progress\".'",
      "With your enhanced caffeine-powered perception, you notice something in the error logs...",
      "The Production Bug seems to be avoiding certain parts of the codebase. The parts with... good documentation?",
      "Could it be? Does the bug have standards?"
    ],
    choices: [
      { text: "Write comprehensive documentation", nextNode: "chapter2_documentation", codeQuality: 30, gives: ["good_docs"] },
      { text: "Share coffee with the team", nextNode: "chapter2_team_coffee", teamMorale: 20, coffeeLevel: 10 },
      { text: "Use caffeine powers to hack reality", nextNode: "chapter2_matrix_mode", gives: ["neo_powers"] },
    ]
  },

  chapter2_testing: {
    id: 'chapter2_testing',
    title: 'Chapter 2: Test-Driven Development Saves the Day',
    ascii: [
      "╔══════════════════════════════╗",
      "║        UNIT TESTS            ║",
      "╠══════════════════════════════╣",
      "║ ✅ testGravity() PASSED      ║",
      "║ ✅ testSunrise() PASSED      ║",
      "║ ❌ testMeaning() FAILED      ║",
      "║ ❌ testProduction() FAILED   ║",
      "║ 🟡 testCoffee() SKIPPED      ║",
      "╚══════════════════════════════╝",
    ],
    content: [
      "Finally! Someone who believes in proper testing methodology!",
      "You start writing unit tests for the fundamental laws of physics. Because if you're going to debug reality, you better test it properly.",
      "Test 1: Verify that 2 + 2 still equals 4 (it does, thankfully)",
      "Test 2: Check if coffee -> productivity still returns true (also passes)",
      "Test 3: Validate that Friday deployments -> disasters (unfortunately still true)",
      "Senior Developer Sarah is impressed: 'This is the most responsible debugging I've seen since... well, ever.'",
      "Your tests reveal that the Production Bug has been monkey-patching the laws of nature.",
      "It's been overriding the toString() method of 'reality' to return 'undefined'.",
      "DevOps Dave gets excited: 'We can write integration tests for the universe!'",
      "The bug notices your testing approach and seems... confused? It's not used to encountering proper engineering practices."
    ],
    choices: [
      { text: "Write tests for the bug itself", nextNode: "chapter3_test_bug", codeQuality: 40, gives: ["bug_tests"] },
      { text: "Set up continuous integration for reality", nextNode: "chapter3_ci_reality", gives: ["jenkins_pipeline"] },
      { text: "Implement test coverage for consciousness", nextNode: "chapter3_test_consciousness", gives: ["philosophy_tests"] },
    ]
  },

  chapter2_teamwork: {
    id: 'chapter2_teamwork',
    title: 'Chapter 2: The Power of Collaborative Debugging',
    ascii: [
      "    👥 TEAM ASSEMBLE 👥    ",
      "   ╔═══════════════════╗   ",
      "   ║  🤝 COOPERATION   ║   ",
      "   ║  🧠 SHARED BRAIN  ║   ",
      "   ║  ☕ SHARED COFFEE ║   ",
      "   ║  🐛 DEAD BUGS     ║   ",
      "   ╚═══════════════════╝   ",
    ],
    content: [
      "Character growth! Jenkins learns that teamwork makes the dream work (and the bugs die).",
      "'You're right, team. Let's put aside our differences and focus on the real enemy: production bugs and technical debt.'",
      "The team's morale skyrockets. Suddenly, everyone is sharing knowledge instead of hoarding it.",
      "Frontend Frankie reveals: 'I've been secretly documenting all the weird workarounds we use!'",
      "Backend Betty admits: 'I may have hardcoded some values... but I commented them really well!'",
      "DevOps Dave confesses: 'I've been collecting metrics on everything. I have charts!'",
      "Senior Developer Sarah smiles: 'This is what proper software engineering looks like.'",
      "Your combined debugging powers create a synergy effect. You can see the bug's patterns more clearly.",
      "The Production Bug, witnessing actual collaboration, starts to glitch. It's used to feeding on drama and blame."
    ],
    choices: [
      { text: "Pair program with the team", nextNode: "chapter3_pair_programming", teamMorale: 30, codeQuality: 20 },
      { text: "Hold a proper code review session", nextNode: "chapter3_code_review", codeQuality: 35, gives: ["clean_code"] },
      { text: "Do mob programming against the bug", nextNode: "chapter3_mob_programming", teamMorale: 25, gives: ["hive_mind"] },
    ]
  },

  chapter3_final_boss: {
    id: 'chapter3_final_boss',
    title: 'Chapter 3: The Ultimate Bug Battle',
    ascii: [
      "    💀 FINAL BOSS BATTLE 💀    ",
      " ╔══════════════════════════╗ ",
      " ║  PRODUCTION BUG FROM     ║ ",
      " ║      🔥 HELL 🔥          ║ ",
      " ║                          ║ ",
      " ║  HP: ████████████ 100%   ║ ",
      " ║  ANGER: MAXIMUM          ║ ",
      " ║  TECHNICAL DEBT: ∞       ║ ",
      " ╚══════════════════════════╝ ",
      "",
      "   👨‍💻 DEVELOPMENT TEAM 👩‍💻   ",
      " ╔══════════════════════════╗ ",
      " ║  COFFEE: ☕☕☕☕☕        ║ ",
      " ║  TEAMWORK: MAXIMUM       ║ ",
      " ║  UNIT TESTS: DEPLOYED    ║ ",
      " ╚══════════════════════════╝ ",
    ],
    content: [
      "The moment of truth has arrived. You and your team face the Production Bug from Hell.",
      "It manifests as a horrifying amalgamation of every coding nightmare: infinite loops, memory leaks, and worst of all... Comic Sans comments.",
      "The bug speaks in error messages: 'NullPointerException: Your hopes and dreams!'",
      "'I AM THE CULMINATION OF EVERY FRIDAY DEPLOYMENT! EVERY MISSING SEMICOLON! EVERY \"IT WORKS ON MY MACHINE\"!'",
      "Senior Developer Sarah rallies the team: 'Remember everyone - we've debugged harder problems before!'",
      "'Like that time the intern used string concatenation in a loop 10,000 times!'",
      "The bug grows larger, feeding on the memory of that incident.",
      "Junior Dev Jenkins realizes: This isn't a bug to be fixed... it's a reflection of every shortcut, every rushed deadline, every time we said \"we'll fix it later.\"",
      "The only way to defeat it is to face the truth: write better code, treat your teammates well, and never deploy on Friday.",
      "What's your final move?"
    ],
    choices: [
      { text: "Deploy comprehensive refactoring", nextNode: "ending_clean_code", codeQuality: 50, gives: ["perfect_code"] },
      { text: "Implement proper CI/CD pipeline", nextNode: "ending_devops", gives: ["automated_deployment"] },
      { text: "Teach the bug about code quality", nextNode: "ending_mentorship", teamMorale: 50 },
      { text: "Suggest the bug gets a code review", nextNode: "ending_comedy", gives: ["legendary_meme"] },
    ]
  },

  // === EPIC ENDINGS ===
  ending_clean_code: {
    id: 'ending_clean_code',
    title: 'Ending: The Clean Code Revolution',
    ascii: [
      "✨ VICTORY: CLEAN CODE MASTER ✨",
      "╔═════════════════════════════╗",
      "║  🏆 ACHIEVEMENT UNLOCKED    ║",
      "║  \"Uncle Bob Would Be Proud\" ║",
      "╚═════════════════════════════╝",
      "",
      "    📚 CLEAN CODE PRINCIPLES   ",
      "   ┌─────────────────────────┐ ",
      "   │ ✅ Meaningful Names     │ ",
      "   │ ✅ Small Functions      │ ",
      "   │ ✅ No Side Effects      │ ",
      "   │ ✅ Proper Comments      │ ",
      "   │ ✅ DRY Principle        │ ",
      "   └─────────────────────────┘ ",
    ],
    content: [
      "Your comprehensive refactoring doesn't just defeat the bug - it transforms it.",
      "As you apply SOLID principles, implement proper design patterns, and write self-documenting code, something magical happens.",
      "The Production Bug from Hell slowly transforms into the Production Feature from Heaven.",
      "'Wait... you mean this code is actually... readable?' the former bug says, now speaking in proper error handling.",
      "Your refactoring spreads across the digital realm like a benevolent virus of good practices.",
      "TODO comments are replaced with actual implementations. Magic numbers become well-named constants.",
      "Spaghetti code becomes elegantly structured. Even legacy systems start making sense.",
      "Junior Dev Jenkins has become Senior Architect Jenkins, mentor to a new generation of clean coders.",
      "The world is saved, and more importantly, future developers won't curse your name when they read your code.",
      "Achievement Unlocked: 'Clean Code Crusader' - Save the world through proper software engineering.",
      "The End... or is it? (There's always more code to refactor.)"
    ],
    choices: [
      { text: "Start a new game with harder bugs", nextNode: "prologue" },
      { text: "Check your achievements", nextNode: "achievements_screen" },
    ]
  },

  ending_comedy: {
    id: 'ending_comedy',
    title: 'Ending: The Most Epic Code Review in History',
    ascii: [
      "🎭 VICTORY: COMEDY LEGEND 🎭",
      "╔═══════════════════════════╗",
      "║  🏆 ACHIEVEMENT UNLOCKED  ║",
      "║  \"Legendary Meme Lord\"    ║",
      "╚═══════════════════════════╝",
      "",
      "     💬 EPIC CODE REVIEW     ",
      "   ┌─────────────────────────┐",
      "   │ Jenkins: 'Needs work'   │",
      "   │ Bug: 'Which part?'      │",
      "   │ Jenkins: 'All of it'    │",
      "   │ Bug: '...fair point'    │",
      "   └─────────────────────────┘",
    ],
    content: [
      "In the most anticlimactic ending possible, you suggest the Production Bug from Hell submit a pull request.",
      "'Look, Bug, your code is causing issues. How about we do this properly? Submit a PR and we'll review it.'",
      "The bug, confused but intrigued, actually creates a GitHub pull request titled: 'Feature: Destroy Humanity'",
      "Your code review is legendary:",
      "- 'Missing unit tests'",
      "- 'No documentation'", 
      "- 'Hardcoded values everywhere'",
      "- 'This function is 10,000 lines long'",
      "- 'Why are you using goto statements in 2024?'",
      "The bug spends the next six months trying to address your review comments.",
      "By the time it's ready for merge, it has learned proper coding practices and becomes a productive team member.",
      "It even starts mentoring junior bugs in best practices.",
      "Achievement Unlocked: 'Code Review Master' - Defeat evil through constructive feedback.",
      "The world is saved by the power of peer review. Who knew?",
      "Plot twist: The bug gets promoted to Senior Developer and you become its manager."
    ],
    choices: [
      { text: "Approve the bug's promotion", nextNode: "secret_ending_manager" },
      { text: "Start over with more chaos", nextNode: "prologue" },
    ]
  },

  // === MINI-GAMES AND SPECIAL FEATURES ===
  coffee_minigame: {
    id: 'coffee_minigame',
    title: 'Mini-Game: The Perfect Brew',
    minigame: 'coffee_brewing',
    ascii: [
      "    ☕ COFFEE MINI-GAME ☕    ",
      "   ╔═══════════════════════╗  ",
      "   ║  Brew the perfect     ║  ",
      "   ║  cup to boost your    ║  ",
      "   ║  debugging powers!    ║  ",
      "   ╚═══════════════════════╝  ",
    ],
    content: [
      "Time for a coffee break! Your debugging powers depend on caffeine levels.",
      "Choose your brewing method wisely..."
    ],
    choices: [
      { text: "French Press (Slow but strong)", nextNode: "coffee_result", coffeeLevel: 40 },
      { text: "Espresso Machine (Fast and intense)", nextNode: "coffee_result", coffeeLevel: 30, stressLevel: -10 },
      { text: "Instant Coffee (Questionable but quick)", nextNode: "coffee_result", coffeeLevel: 10, stressLevel: 5 },
      { text: "Energy Drink (Not coffee but desperate)", nextNode: "coffee_result", coffeeLevel: 20, stressLevel: 15 },
    ]
  },

  achievements_screen: {
    id: 'achievements_screen',
    title: 'Achievement Gallery',
    ascii: [
      "🏆 DEVELOPER ACHIEVEMENTS 🏆",
      "╔═══════════════════════════╗",
      "║  Your coding legacy...    ║",
      "╚═══════════════════════════╝",
    ],
    content: [
      "Here are all the achievements you've unlocked in your coding journey:",
      "(Achievements will be populated based on your choices)"
    ],
    choices: [
      { text: "Return to main story", nextNode: "prologue" },
      { text: "Challenge: Speedrun mode", nextNode: "speedrun_start" },
    ]
  }
};

// Helper functions for game mechanics
export const getRandomBugFact = (): string => {
  const facts = [
    "Did you know? The first computer bug was an actual bug - a moth trapped in a computer relay in 1947.",
    "Fun fact: The term 'debugging' was coined by Admiral Grace Hopper.",
    "JavaScript fact: '9' + 1 = '91', but '9' - 1 = 8. Because JavaScript.",
    "CSS fact: Centering a div is considered an advanced skill in some cultures.",
    "Coffee fact: Developers consume 4x more caffeine than the general population.",
    "SQL fact: DELETE FROM users WHERE name = 'production'; -- Classic Friday mistake",
  ];
  return facts[Math.floor(Math.random() * facts.length)];
};

export const calculateTeamMood = (gameState: GameState): string => {
  const { teamMorale, coffeeLevel, stressLevel } = gameState;
  const totalMood = teamMorale + coffeeLevel - stressLevel;
  
  if (totalMood > 120) return "🚀 LEGENDARY - Team is unstoppable!";
  if (totalMood > 100) return "😊 EXCELLENT - Everyone's happy and productive";
  if (totalMood > 80) return "👍 GOOD - Solid team vibes";
  if (totalMood > 60) return "😐 OKAY - Getting by";
  if (totalMood > 40) return "😬 STRESSED - Need more coffee and less bugs";
  return "💀 BURNED OUT - Emergency team building required!";
};

export const INVENTORY_ITEMS = {
  laptop: { name: "Laptop", description: "Your trusty development machine", emoji: "💻" },
  rubber_duck: { name: "Rubber Duck", description: "For debugging conversations", emoji: "🦆" },
  coffee: { name: "Coffee", description: "Liquid motivation", emoji: "☕" },
  energy_drink: { name: "Energy Drink", description: "Questionable life choices", emoji: "🥤" },
  stack_overflow_tab: { name: "Stack Overflow Tab", description: "Always open, never closed", emoji: "📱" },
  documentation: { name: "Documentation", description: "Rare and precious", emoji: "📚" },
  unit_tests: { name: "Unit Tests", description: "Your safety net", emoji: "🛡️" },
  clean_code: { name: "Clean Code", description: "The holy grail", emoji: "✨" },
  backup: { name: "Backup", description: "Just in case", emoji: "💾" },
  sudo_powers: { name: "Sudo Powers", description: "With great power...", emoji: "👑" },
};