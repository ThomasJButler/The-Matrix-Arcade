// ============================================================================
// CHARACTER PERSONALITIES
// Defines how each character speaks and thinks for lifeline conversations
// ============================================================================

export interface CharacterPersonality {
  id: string;
  name: string;
  role: string;
  personality: string[];
  speakingStyle: string;
  confidence: 'high' | 'medium' | 'cautious';
  expertise: string[];
  catchphrases: string[];
}

export const CHARACTERS: Record<string, CharacterPersonality> = {
  averag: {
    id: 'averag',
    name: 'Aver-Ag Engi Neer',
    role: 'Protagonist - Average Engineer',
    personality: ['pragmatic', 'self-doubting', 'determined', 'relatable'],
    speakingStyle: 'Casual, uncertain at times, asks questions',
    confidence: 'medium',
    expertise: ['general_coding', 'problem_solving'],
    catchphrases: [
      'I think...',
      'Maybe it\'s...',
      'I\'m not 100% sure but...',
      'From my experience...',
      'Let me think about this...'
    ]
  },

  neo: {
    id: 'neo',
    name: 'Neo',
    role: 'The One - Matrix Expert',
    personality: ['confident', 'intuitive', 'philosophical', 'direct'],
    speakingStyle: 'Short, certain statements with Matrix references',
    confidence: 'high',
    expertise: ['code', 'patterns', 'truth', 'systems'],
    catchphrases: [
      'I see it in the code...',
      'The Matrix shows me...',
      'I know this',
      'Trust what you see',
      'There is no spoon, but there is...'
    ]
  },

  trinity: {
    id: 'trinity',
    name: 'Trinity',
    role: 'Expert Hacker',
    personality: ['sharp', 'precise', 'confident', 'action-oriented'],
    speakingStyle: 'Direct, technical, no-nonsense',
    confidence: 'high',
    expertise: ['hacking', 'code', 'systems', 'security'],
    catchphrases: [
      'I\'ve used this before...',
      'From my hacking experience...',
      'It\'s definitely...',
      'I know systems',
      'Trust me on this'
    ]
  },

  morpheus: {
    id: 'morpheus',
    name: 'Morpheus',
    role: 'Wise Mentor',
    personality: ['philosophical', 'cryptic', 'wise', 'patient'],
    speakingStyle: 'Poetic, asks rhetorical questions, speaks in riddles',
    confidence: 'high',
    expertise: ['wisdom', 'philosophy', 'teaching', 'truth'],
    catchphrases: [
      'What if I told you...',
      'The answer you seek...',
      'Do not try to find the answer. Only realize...',
      'There is a difference between knowing the path...',
      'Free your mind'
    ]
  },

  senora: {
    id: 'senora',
    name: 'Señora Engi Neer',
    role: 'Senior Engineer - Mentor',
    personality: ['authoritative', 'experienced', 'direct', 'supportive'],
    speakingStyle: 'Professional, clear, educational',
    confidence: 'high',
    expertise: ['engineering', 'architecture', 'best_practices', 'leadership'],
    catchphrases: [
      'Based on my years of experience...',
      'The correct approach is...',
      'As a senior engineer, I can tell you...',
      'It\'s clearly...',
      'Let me explain...'
    ]
  },

  billiam: {
    id: 'billiam',
    name: 'Billiam Bindows Bates',
    role: 'Tech Mogul',
    personality: ['strategic', 'business-minded', 'confident', 'analytical'],
    speakingStyle: 'Corporate-speak, data-driven, strategic',
    confidence: 'high',
    expertise: ['business', 'strategy', 'scalability', 'markets'],
    catchphrases: [
      'From a business perspective...',
      'The scalable solution is...',
      'Market research shows...',
      'Let\'s think strategically...',
      'The ROI here suggests...'
    ]
  },

  steve: {
    id: 'steve',
    name: 'Steve Theytuk Ourjerbs',
    role: 'Visionary Designer',
    personality: ['perfectionist', 'creative', 'passionate', 'demanding'],
    speakingStyle: 'Emotional, focused on elegance and simplicity',
    confidence: 'high',
    expertise: ['design', 'user_experience', 'simplicity', 'innovation'],
    catchphrases: [
      'It just works',
      'The elegant solution is...',
      'Think different',
      'One more thing...',
      'Design is not just what it looks like...'
    ]
  },

  elon: {
    id: 'elon',
    name: 'Elon-gated Tusk',
    role: 'Eccentric Visionary',
    personality: ['unconventional', 'bold', 'random', 'ambitious'],
    speakingStyle: 'Wild ideas, then pivots to practical, memetic',
    confidence: 'high',
    expertise: ['innovation', 'rockets', 'chaos', 'memes'],
    catchphrases: [
      'What if we genetically engineered...',
      'Okay but seriously...',
      'This is obviously...',
      'Let me ask the AI about this... oh wait',
      'To Mars! I mean, to the answer...'
    ]
  },

  samuel: {
    id: 'samuel',
    name: 'Samuel Alt Commandman',
    role: 'Command Line Expert',
    personality: ['technical', 'precise', 'methodical', 'traditional'],
    speakingStyle: 'Technical jargon, terminal references, precise',
    confidence: 'high',
    expertise: ['terminal', 'commands', 'systems', 'unix'],
    catchphrases: [
      'From my terminal experience...',
      'The command here is...',
      'sudo tells me...',
      'Executing logic... result:...',
      'In the shell, we trust'
    ]
  }
};

// Helper function to get random characters for a conversation
export const getRandomCharacters = (count: number = 5, exclude: string[] = []): CharacterPersonality[] => {
  const available = Object.values(CHARACTERS).filter(c => !exclude.includes(c.id));
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, available.length));
};

// Helper to generate character opinion based on answer
export const generateCharacterOpinion = (
  character: CharacterPersonality,
  answer: string,
  isCorrect: boolean,
  puzzleType: 'code' | 'riddle' | 'multiple-choice' | 'typing'
): string => {
  const catchphrase = character.catchphrases[Math.floor(Math.random() * character.catchphrases.length)];

  // Characters with high confidence are more assertive
  if (character.confidence === 'high') {
    if (isCorrect) {
      return `${catchphrase} it's ${answer}`;
    } else {
      // High confidence characters can be wrong with authority
      return `${catchphrase} it's ${answer}`;
    }
  } else {
    // Medium/cautious confidence hedge their bets
    if (isCorrect) {
      return `I think it's ${answer}... probably`;
    } else {
      return `Maybe ${answer}? I'm not sure...`;
    }
  }
};

// Get character consensus percentage (correct answer gets higher %)
export const generateConsensus = (
  options: string[],
  correctAnswer: string
): Record<string, number> => {
  const result: Record<string, number> = {};

  // Correct answer gets 55-80%
  const correctPercentage = Math.floor(Math.random() * 26) + 55; // 55-80
  result[correctAnswer] = correctPercentage;

  // Distribute remaining percentage among wrong answers
  let remaining = 100 - correctPercentage;
  const wrongOptions = options.filter(o => o !== correctAnswer);

  wrongOptions.forEach((option, index) => {
    if (index === wrongOptions.length - 1) {
      // Last option gets whatever is left
      result[option] = remaining;
    } else {
      // Random split of remaining
      const max = Math.floor(remaining / (wrongOptions.length - index));
      const amount = Math.floor(Math.random() * max) + 1;
      result[option] = amount;
      remaining -= amount;
    }
  });

  return result;
};
