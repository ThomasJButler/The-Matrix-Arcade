import { useState, useEffect, useCallback, useRef } from 'react';

export interface ShatnerVoiceConfig {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  pauseMultiplier: number;
  emphasisBoost: number;
}

const DEFAULT_CONFIG: ShatnerVoiceConfig = {
  enabled: true,
  rate: 1.00, // Perfect Shatner commanding pace
  pitch: 1.20, // Higher, more dramatic and commanding
  volume: 0.60, // 60% - Perfect balance for dramatic effect
  pauseMultiplier: 3.0, // MAXIMUM dramatic pauses for ultimate Shatner
  emphasisBoost: 1.5 // Enhanced boost for emphasized words
};

// Shatner's distinctive speech patterns - ULTIMATE EDITION
const SHATNER_PATTERNS = {
  // Words that get dramatic emphasis
  emphasisWords: [
    'the', 'world', 'production', 'bug', 'code', 'debug', 'error', 'critical',
    'system', 'reality', 'matrix', 'Jenkins', 'team', 'coffee', 'deploy',
    'friday', 'weekend', 'disaster', 'legendary', 'epic', 'ultimate',
    // Matrix/Coding dramatic additions
    'null', 'pointer', 'exception', 'stack', 'overflow', 'refactor', 'legacy',
    'technical', 'debt', 'merge', 'conflict', 'rollback', 'hotfix', 'commit',
    'repository', 'database', 'server', 'crash', 'infinite', 'loop', 'memory',
    'leak', 'deprecated', 'breaking', 'change', 'regression', 'pipeline',
    'deployment', 'container', 'kubernetes', 'microservice', 'api', 'endpoint'
  ],
  
  // Phrases that get extra dramatic pauses
  dramaticPhrases: [
    'Production Bug from Hell',
    'Friday afternoon deployment',
    'Stack Overflow has gone down',
    'merge to main without tests',
    'debug the world',
    'save humanity',
    'ultimate debugging session',
    // Ultimate Matrix coding drama
    'null pointer exception',
    'infinite loop detected',
    'memory leak catastrophe',
    'database connection failed',
    'server crashed spectacularly',
    'merge conflict nightmare',
    'technical debt apocalypse',
    'legacy code from hell',
    'breaking change disaster',
    'pipeline deployment failure',
    'stack overflow error',
    'segmentation fault',
    'out of memory',
    'connection timeout',
    'authentication failed',
    'permission denied',
    'file not found'
  ],
  
  // Words that trigger mid-sentence pauses
  pauseWords: [
    'but', 'however', 'suddenly', 'meanwhile', 'unfortunately', 'thankfully',
    'clearly', 'obviously', 'naturally', 'inevitably', 'surprisingly',
    // Coding-specific pause triggers
    'therefore', 'consequently', 'furthermore', 'nevertheless', 'moreover',
    'specifically', 'particularly', 'essentially', 'basically', 'literally',
    'apparently', 'definitely', 'absolutely', 'completely', 'entirely'
  ]
};

export function useShatnerVoice() {
  const [config, setConfig] = useState<ShatnerVoiceConfig>(() => {
    const saved = localStorage.getItem('matrix-arcade-shatner-voice');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });
  
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechQueue, setSpeechQueue] = useState<string[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for Web Speech API support
  useEffect(() => {
    setIsSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
  }, []);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem('matrix-arcade-shatner-voice', JSON.stringify(config));
  }, [config]);

  // Process text to add ULTIMATE Shatner-style pauses and emphasis
  const processShatnerText = useCallback((text: string): string => {
    if (!text) return '';

    let processed = text;

    // Add dramatic pauses after specific phrases
    SHATNER_PATTERNS.dramaticPhrases.forEach(phrase => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      processed = processed.replace(regex, `$1... `);
    });

    // Add pauses after certain words
    SHATNER_PATTERNS.pauseWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      processed = processed.replace(regex, `$1... `);
    });

    // Add emphasis markers for dramatic words
    SHATNER_PATTERNS.emphasisWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      processed = processed.replace(regex, `*$1*`);
    });

    // ULTIMATE SHATNER ENHANCEMENTS
    // Add dramatic pauses at sentence breaks
    processed = processed.replace(/([.!?])\s+/g, '$1... ');
    
    // Add pauses before quotation marks
    processed = processed.replace(/(['"])/g, '... $1');
    
    // Add pauses after commas for maximum drama
    processed = processed.replace(/(,)\s+/g, '$1... ');
    
    // Add dramatic emphasis to exclamations
    processed = processed.replace(/(!+)/g, '... $1');
    
    // Split long sentences with strategic pauses
    processed = processed.replace(/(\w+)\s+(and|or|but|yet|so)\s+(\w+)/gi, '$1... $2... $3');
    
    // Add Captain Kirk-style dramatic breaks
    processed = processed.replace(/\b(must|will|can|should|could|would)\s+(\w+)/gi, '$1... $2');

    return processed;
  }, []);

  // Create speech utterance with Shatner characteristics
  const createShatnerUtterance = useCallback((text: string): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance();
    
    // Process text for Shatner patterns
    const processedText = processShatnerText(text);
    
    // Remove emphasis markers for actual speech (they're just for processing)
    utterance.text = processedText.replace(/\*/g, '');
    
    // Apply Shatner voice characteristics
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;
    
    // Try to find a voice that sounds somewhat like Shatner
    const voices = speechSynthesis.getVoices();
    const preferredVoices = [
      'Alex', // macOS Alex voice
      'Microsoft David Desktop',
      'Google US English Male',
      'en-US-Standard-D', // Google Cloud TTS
      'Daniel', // macOS Daniel
    ];
    
    const selectedVoice = voices.find(voice => 
      preferredVoices.some(preferred => 
        voice.name.includes(preferred) && voice.lang.startsWith('en')
      )
    ) || voices.find(voice => voice.lang.startsWith('en') && voice.name.includes('Male')) 
      || voices.find(voice => voice.lang.startsWith('en'));
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    return utterance;
  }, [config, processShatnerText]);

  // Speak text with Shatner style
  const speak = useCallback((text: string) => {
    if (!isSupported || !config.enabled || !text.trim()) return;

    // Stop any current speech
    speechSynthesis.cancel();
    
    // Split text into sentences for better pacing
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    
    if (sentences.length === 0) return;

    setIsSpeaking(true);
    setSpeechQueue(sentences);

    const speakSentence = (sentenceIndex: number) => {
      if (sentenceIndex >= sentences.length) {
        setIsSpeaking(false);
        setSpeechQueue([]);
        return;
      }

      const sentence = sentences[sentenceIndex];
      const utterance = createShatnerUtterance(sentence);

      utterance.onend = () => {
        // Add Shatner-style pause between sentences
        timeoutRef.current = setTimeout(() => {
          speakSentence(sentenceIndex + 1);
        }, config.pauseMultiplier * 500);
      };

      utterance.onerror = () => {
        console.warn('Speech synthesis error, continuing to next sentence');
        speakSentence(sentenceIndex + 1);
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    };

    speakSentence(0);
  }, [isSupported, config, createShatnerUtterance]);

  // Stop speaking
  const stop = useCallback(() => {
    speechSynthesis.cancel();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsSpeaking(false);
    setSpeechQueue([]);
  }, []);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<ShatnerVoiceConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Test voice with a classic Shatner phrase
  const testVoice = useCallback(() => {
    const testPhrase = "The Production Bug... from Hell... has infected... the fundamental APIs... of existence itself!";
    speak(testPhrase);
  }, [speak]);

  // Get available voices for selection
  const getAvailableVoices = useCallback(() => {
    if (!isSupported) return [];
    return speechSynthesis.getVoices().filter(voice => voice.lang.startsWith('en'));
  }, [isSupported]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    config,
    updateConfig,
    speak,
    stop,
    testVoice,
    isSupported,
    isSpeaking,
    speechQueue,
    availableVoices: getAvailableVoices(),
    processShatnerText
  };
}