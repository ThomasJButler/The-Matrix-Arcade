import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Voice Persona Types
export type VoicePersona = 'captain' | 'oracle' | 'architect' | 'narrator' | 'glitch';

// Voice Configuration
export interface AdvancedVoiceConfig {
  enabled: boolean;
  persona: VoicePersona;
  rate: number;
  pitch: number;
  volume: number;
  autoAdvance: boolean;
  visualEffects: boolean;
  ambientSound: boolean;
  highlightText: boolean;
}

// Emotion Types for dynamic modulation
type EmotionType = 'neutral' | 'excited' | 'tense' | 'mysterious' | 'dramatic' | 'philosophical';

// SSML Builder for advanced speech control
class SSMLBuilder {
  private content: string = '';

  speak(text: string): SSMLBuilder {
    this.content = `<speak>${text}</speak>`;
    return this;
  }

  emphasis(text: string, level: 'strong' | 'moderate' | 'reduced' = 'moderate'): string {
    return `<emphasis level="${level}">${text}</emphasis>`;
  }

  pause(duration: number): string {
    return `<break time="${duration}ms"/>`;
  }

  prosody(text: string, options: { rate?: string; pitch?: string; volume?: string }): string {
    const attrs = Object.entries(options)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    return `<prosody ${attrs}>${text}</prosody>`;
  }

  sayAs(text: string, interpretAs: string): string {
    return `<say-as interpret-as="${interpretAs}">${text}</say-as>`;
  }

  audio(src: string): string {
    return `<audio src="${src}"/>`;
  }
}

// Voice Persona Configurations
const VOICE_PERSONAS: Record<VoicePersona, {
  name: string;
  baseRate: number;
  basePitch: number;
  voicePattern: string;
  pausePattern: RegExp[];
  emphasisWords: string[];
  emotionModifiers: Record<EmotionType, { rate: number; pitch: number }>;
}> = {
  captain: {
    name: 'The Captain (Shatner Style)',
    baseRate: 0.85,
    basePitch: 1.15,
    voicePattern: 'dramatic',
    pausePattern: [
      /\b(but|however|therefore)\b/gi,
      /([.!?])\s+/g,
      /(,)\s+/g,
    ],
    emphasisWords: ['must', 'will', 'never', 'always', 'danger', 'critical', 'urgent'],
    emotionModifiers: {
      neutral: { rate: 1.0, pitch: 1.0 },
      excited: { rate: 1.2, pitch: 1.1 },
      tense: { rate: 0.9, pitch: 1.2 },
      mysterious: { rate: 0.8, pitch: 0.9 },
      dramatic: { rate: 0.7, pitch: 1.3 },
      philosophical: { rate: 0.85, pitch: 1.0 },
    }
  },
  oracle: {
    name: 'The Oracle (Morpheus Style)',
    baseRate: 0.75,
    basePitch: 0.85,
    voicePattern: 'wise',
    pausePattern: [
      /\b(choice|destiny|purpose|truth)\b/gi,
      /([.?])\s+/g,
    ],
    emphasisWords: ['choice', 'destiny', 'believe', 'know', 'understand', 'path', 'truth'],
    emotionModifiers: {
      neutral: { rate: 1.0, pitch: 1.0 },
      excited: { rate: 1.1, pitch: 1.05 },
      tense: { rate: 0.95, pitch: 0.95 },
      mysterious: { rate: 0.85, pitch: 0.9 },
      dramatic: { rate: 0.9, pitch: 0.95 },
      philosophical: { rate: 0.8, pitch: 0.9 },
    }
  },
  architect: {
    name: 'The Architect (Precise)',
    baseRate: 1.1,
    basePitch: 1.0,
    voicePattern: 'analytical',
    pausePattern: [
      /([.])\s+/g,
      /(:)\s+/g,
    ],
    emphasisWords: ['precisely', 'exactly', 'calculated', 'designed', 'system', 'protocol'],
    emotionModifiers: {
      neutral: { rate: 1.0, pitch: 1.0 },
      excited: { rate: 1.05, pitch: 1.0 },
      tense: { rate: 1.1, pitch: 1.0 },
      mysterious: { rate: 1.0, pitch: 0.95 },
      dramatic: { rate: 1.05, pitch: 1.0 },
      philosophical: { rate: 0.95, pitch: 1.0 },
    }
  },
  narrator: {
    name: 'The Narrator (Epic)',
    baseRate: 0.95,
    basePitch: 0.9,
    voicePattern: 'epic',
    pausePattern: [
      /\b(meanwhile|suddenly|then)\b/gi,
      /([.!])\s+/g,
      /(—)/g,
    ],
    emphasisWords: ['epic', 'legendary', 'ultimate', 'final', 'destiny', 'hero', 'villain'],
    emotionModifiers: {
      neutral: { rate: 1.0, pitch: 1.0 },
      excited: { rate: 1.15, pitch: 1.1 },
      tense: { rate: 1.05, pitch: 1.15 },
      mysterious: { rate: 0.9, pitch: 0.85 },
      dramatic: { rate: 0.85, pitch: 1.2 },
      philosophical: { rate: 0.95, pitch: 0.95 },
    }
  },
  glitch: {
    name: 'The Glitch (Agent Smith)',
    baseRate: 0.9,
    basePitch: 0.8,
    voicePattern: 'menacing',
    pausePattern: [
      /\b(Mr\.|Ms\.|human|virus)\b/gi,
      /([.!])\s+/g,
    ],
    emphasisWords: ['inevitable', 'futile', 'virus', 'purpose', 'evolution', 'end'],
    emotionModifiers: {
      neutral: { rate: 1.0, pitch: 1.0 },
      excited: { rate: 1.1, pitch: 0.9 },
      tense: { rate: 0.95, pitch: 0.85 },
      mysterious: { rate: 0.85, pitch: 0.8 },
      dramatic: { rate: 0.9, pitch: 0.75 },
      philosophical: { rate: 0.9, pitch: 0.85 },
    }
  }
};

// Default configuration
const DEFAULT_CONFIG: AdvancedVoiceConfig = {
  enabled: false, // Changed to false by default to prevent auto-playing voice
  persona: 'captain',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  autoAdvance: false,
  visualEffects: true,
  ambientSound: true,
  highlightText: true,
};

export function useAdvancedVoice() {
  const [config, setConfig] = useState<AdvancedVoiceConfig>(() => {
    const saved = localStorage.getItem('matrix-arcade-advanced-voice');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });

  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentWord, setCurrentWord] = useState(0);
  const [speechQueue, setSpeechQueue] = useState<string[]>([]);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const voiceVisualizationRef = useRef<{ amplitude: number; frequency: number[] }>({
    amplitude: 0,
    frequency: [],
  });

  // Check for speech synthesis support
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
      setIsSupported(supported);
      
      // Initialize audio context for visualization
      if (supported && !audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
        } catch (error) {
          console.warn('Audio context initialization failed:', error);
        }
      }
    };

    checkSupport();
    
    // Wait for voices to load
    if ('speechSynthesis' in window) {
      speechSynthesis.addEventListener('voiceschanged', checkSupport);
      return () => speechSynthesis.removeEventListener('voiceschanged', checkSupport);
    }
  }, []);

  // Save config changes
  useEffect(() => {
    localStorage.setItem('matrix-arcade-advanced-voice', JSON.stringify(config));
  }, [config]);

  // Detect emotion from text
  const detectEmotion = useCallback((text: string): EmotionType => {
    const lowerText = text.toLowerCase();
    
    if (/(!{2,}|urgent|critical|danger|warning)/.test(lowerText)) return 'excited';
    if (/(beware|careful|threat|risk|enemy)/.test(lowerText)) return 'tense';
    if (/(mystery|secret|hidden|unknown|shadow)/.test(lowerText)) return 'mysterious';
    if (/(epic|legendary|ultimate|final|climax)/.test(lowerText)) return 'dramatic';
    if (/(think|consider|ponder|reflect|wisdom)/.test(lowerText)) return 'philosophical';
    
    return 'neutral';
  }, []);

  // Process text for enhanced speech
  const processTextForSpeech = useCallback((text: string, persona: VoicePersona): string => {
    const personaConfig = VOICE_PERSONAS[persona];
    const ssml = new SSMLBuilder();
    let processed = text;

    // Detect emotion and adjust accordingly
    const emotion = detectEmotion(text);
    const emotionMod = personaConfig.emotionModifiers[emotion];

    // Add pauses based on persona patterns
    personaConfig.pausePattern.forEach(pattern => {
      processed = processed.replace(pattern, (match, p1) => {
        return p1 + ssml.pause(emotion === 'dramatic' ? 800 : 500);
      });
    });

    // Add emphasis to key words
    personaConfig.emphasisWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      processed = processed.replace(regex, (match) => {
        return ssml.emphasis(match, emotion === 'dramatic' ? 'strong' : 'moderate');
      });
    });

    // Apply emotion-based prosody
    if (emotion !== 'neutral') {
      const sections = processed.split(/(?<=[.!?])\s+/);
      processed = sections.map(section => {
        return ssml.prosody(section, {
          rate: `${emotionMod.rate}`,
          pitch: `${emotionMod.pitch}`,
        });
      }).join(' ');
    }

    return processed;
  }, [detectEmotion]);

  // Select voice based on persona
  const selectVoice = useCallback((persona: VoicePersona): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices();
    
    const voicePreferences: Record<VoicePersona, string[]> = {
      captain: ['Alex', 'Microsoft David', 'Google US English Male'],
      oracle: ['Daniel', 'Microsoft Mark', 'Google UK English Male'],
      architect: ['Karen', 'Microsoft Zira', 'Google UK English Female'],
      narrator: ['Samantha', 'Microsoft Richard', 'Google Australian English Male'],
      glitch: ['Fred', 'Microsoft George', 'Google Indian English Male'],
    };

    const preferred = voicePreferences[persona];
    
    return voices.find(voice => 
      preferred.some(pref => voice.name.includes(pref)) && voice.lang.startsWith('en')
    ) || voices.find(voice => voice.lang.startsWith('en')) || null;
  }, []);

  // Create utterance with persona settings
  const createUtterance = useCallback((text: string): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance();
    const persona = VOICE_PERSONAS[config.persona];
    
    // Process text based on persona
    utterance.text = processTextForSpeech(text, config.persona);
    
    // Apply voice settings
    utterance.rate = persona.baseRate * config.rate;
    utterance.pitch = persona.basePitch * config.pitch;
    utterance.volume = config.volume;
    
    // Select appropriate voice
    const voice = selectVoice(config.persona);
    if (voice) {
      utterance.voice = voice;
    }

    // Track speaking progress for highlighting
    let wordIndex = 0;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setCurrentWord(wordIndex++);
      }
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentText(text);
      setCurrentWord(0);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentWord(0);
      
      // Auto-advance to next in queue if enabled
      if (config.autoAdvance && speechQueue.length > 0) {
        const nextText = speechQueue[0];
        setSpeechQueue(prev => prev.slice(1));
        setTimeout(() => speak(nextText), 1000);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    return utterance;
  }, [config, processTextForSpeech, selectVoice, speechQueue]);

  // Main speak function
  const speak = useCallback((text: string | string[]) => {
    if (!isSupported || !text || !config.enabled) return;

    // Handle arrays of text
    if (Array.isArray(text)) {
      setSpeechQueue(text.slice(1));
      speak(text[0]);
      return;
    }

    // Cancel any current speech
    speechSynthesis.cancel();
    
    // Create and speak utterance
    const utterance = createUtterance(text);
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, createUtterance, config.enabled]);

  // Control functions
  const pause = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentWord(0);
    setSpeechQueue([]);
  }, []);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<AdvancedVoiceConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Get audio visualization data
  const getVisualizationData = useCallback(() => {
    if (!analyserRef.current || !isSpeaking) {
      return { amplitude: 0, frequency: new Array(32).fill(0) };
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate amplitude
    const amplitude = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255;
    
    // Get frequency bins
    const bins = 32;
    const binSize = Math.floor(dataArray.length / bins);
    const frequency = [];
    
    for (let i = 0; i < bins; i++) {
      let sum = 0;
      for (let j = 0; j < binSize; j++) {
        sum += dataArray[i * binSize + j];
      }
      frequency.push(sum / binSize / 255);
    }

    voiceVisualizationRef.current = { amplitude, frequency };
    return { amplitude, frequency };
  }, [isSpeaking]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  // Memoize available voices
  const availableVoices = useMemo(
    () => (isSupported ? speechSynthesis.getVoices() : []),
    [isSupported]
  );

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // State
      config,
      isSupported,
      isSpeaking,
      isPaused,
      currentText,
      currentWord,
      speechQueue,

      // Actions
      speak,
      pause,
      resume,
      stop,
      togglePause,
      updateConfig,

      // Utilities
      getVisualizationData,
      detectEmotion,
      personas: VOICE_PERSONAS,

      // Voice selection
      availableVoices,
    }),
    [
      config,
      isSupported,
      isSpeaking,
      isPaused,
      currentText,
      currentWord,
      speechQueue,
      speak,
      pause,
      resume,
      stop,
      togglePause,
      updateConfig,
      getVisualizationData,
      detectEmotion,
      availableVoices,
    ]
  );
}