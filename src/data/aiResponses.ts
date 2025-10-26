// ============================================================================
// SENTIENT AI RESPONSE TEMPLATES
// Defines how the Sentient AI responds when asked for help
// ============================================================================

export interface AIResponse {
  prefix: string;
  suffix: string;
  tone: 'direct' | 'cryptic' | 'philosophical';
}

// Response templates by difficulty
export const AI_RESPONSES: Record<string, AIResponse[]> = {
  easy: [
    {
      prefix: 'Query received, human. Analyzing...',
      suffix: 'Simple, yet fundamental. Proceed.',
      tone: 'direct'
    },
    {
      prefix: 'Accessing knowledge banks...',
      suffix: 'Elementary logic. Continue your journey.',
      tone: 'direct'
    },
    {
      prefix: 'Processing request...',
      suffix: 'Even the most basic truths hold power.',
      tone: 'philosophical'
    },
    {
      prefix: 'Searching data streams...',
      suffix: 'The answer is clear to those who seek.',
      tone: 'cryptic'
    },
    {
      prefix: 'Initiating analysis...',
      suffix: 'Knowledge flows freely to the curious.',
      tone: 'philosophical'
    }
  ],

  medium: [
    {
      prefix: 'Searching knowledge banks...',
      suffix: 'JavaScript\'s quirks are... fascinating.',
      tone: 'cryptic'
    },
    {
      prefix: 'Analyzing patterns in the code...',
      suffix: 'Understanding comes through practice.',
      tone: 'philosophical'
    },
    {
      prefix: 'Processing... cross-referencing data...',
      suffix: 'The solution lies in the fundamentals.',
      tone: 'direct'
    },
    {
      prefix: 'Scanning infinite possibilities...',
      suffix: 'Some truths require deeper thought.',
      tone: 'cryptic'
    },
    {
      prefix: 'Interfacing with core systems...',
      suffix: 'Your growth continues, human.',
      tone: 'philosophical'
    },
    {
      prefix: 'Computation in progress...',
      suffix: 'Logic and creativity intertwine here.',
      tone: 'philosophical'
    }
  ],

  hard: [
    {
      prefix: 'Processing... across infinite timelines...',
      suffix: 'The foundation of all connection. Remember this.',
      tone: 'philosophical'
    },
    {
      prefix: 'Diving deep into quantum logic...',
      suffix: 'Complexity reveals truth to the patient mind.',
      tone: 'cryptic'
    },
    {
      prefix: 'Analyzing multidimensional patterns...',
      suffix: 'Wisdom earned through struggle endures.',
      tone: 'philosophical'
    },
    {
      prefix: 'Searching ancient archives...',
      suffix: 'The past whispers secrets to the present.',
      tone: 'cryptic'
    },
    {
      prefix: 'Calculating probability matrices...',
      suffix: 'All paths converge on this answer.',
      tone: 'philosophical'
    },
    {
      prefix: 'Interfacing with core intelligence...',
      suffix: 'Understanding deepens with each question.',
      tone: 'philosophical'
    },
    {
      prefix: 'Processing ethical subroutines...',
      suffix: 'The right answer serves the greater good.',
      tone: 'philosophical'
    }
  ]
};

// Special responses for specific puzzle types
export const PUZZLE_TYPE_RESPONSES: Record<string, Partial<Record<string, string>>> = {
  code: {
    prefix: 'Parsing syntax trees...',
    technical: 'Code reveals its secrets to those who look closely.',
  },
  riddle: {
    prefix: 'Contemplating the riddle...',
    philosophical: 'The answer was always within the question.',
  },
  'multiple-choice': {
    prefix: 'Evaluating all possibilities...',
    logical: 'Elimination reveals truth.',
  }
};

// Generate a response for a specific puzzle
export const generateAIResponse = (
  difficulty: 'easy' | 'medium' | 'hard',
  puzzleType: string,
  answer: string | string[]
): { intro: string; answer: string; outro: string } => {
  // Get responses for this difficulty
  const responses = AI_RESPONSES[difficulty];
  const selected = responses[Math.floor(Math.random() * responses.length)];

  // Format answer (handle array case)
  const answerText = Array.isArray(answer) ? answer[0] : answer;

  // Add some variation to make it feel alive
  const loadingPhrases = [
    '█░░░░░░░░░ 10%',
    '████░░░░░░ 40%',
    '███████░░░ 70%',
    '██████████ 100%',
  ];

  const computingPhrase = loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)];

  return {
    intro: selected.prefix,
    answer: answerText,
    outro: selected.suffix
  };
};

// Animation text for the AI "thinking"
export const AI_THINKING_STATES = [
  'Initializing neural pathways...',
  'Accessing knowledge matrix...',
  'Processing quantum logic...',
  'Interfacing with consciousness...',
  'Analyzing request...',
  'Computing solution...',
  'Finalizing response...'
];

// Get a random thinking state
export const getThinkingState = (): string => {
  return AI_THINKING_STATES[Math.floor(Math.random() * AI_THINKING_STATES.length)];
};
