import { useCallback, useRef, useState, useEffect, useMemo } from 'react';

export interface SoundConfig {
  music: boolean;
  sfx: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export interface SoundEffect {
  type: string;
  frequency: { start: number; end: number };
  oscillatorType: OscillatorType;
  duration: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  delay?: number;
  reverb?: boolean;
}

const DEFAULT_CONFIG: SoundConfig = {
  music: true,
  sfx: true,
  masterVolume: 0.7,
  musicVolume: 0.4,
  sfxVolume: 0.6
};

// Pre-defined sound effects library
const SOUND_LIBRARY: Record<string, SoundEffect> = {
  // Game Actions
  jump: {
    type: 'jump',
    frequency: { start: 440, end: 220 },
    oscillatorType: 'sine',
    duration: 0.2,
    attack: 0.01,
    decay: 0.1,
    sustain: 0.3,
    release: 0.1,
    filterType: 'lowpass',
    filterFreq: 800
  },
  hit: {
    type: 'hit',
    frequency: { start: 200, end: 50 },
    oscillatorType: 'sawtooth',
    duration: 0.3,
    attack: 0.001,
    decay: 0.05,
    sustain: 0.1,
    release: 0.24,
    filterType: 'lowpass',
    filterFreq: 400
  },
  score: {
    type: 'score',
    frequency: { start: 523, end: 784 },
    oscillatorType: 'square',
    duration: 0.25,
    attack: 0.02,
    decay: 0.08,
    sustain: 0.6,
    release: 0.15,
    filterType: 'bandpass',
    filterFreq: 1500
  },
  powerup: {
    type: 'powerup',
    frequency: { start: 659, end: 1046 },
    oscillatorType: 'triangle',
    duration: 0.4,
    attack: 0.05,
    decay: 0.1,
    sustain: 0.7,
    release: 0.25,
    filterType: 'highpass',
    filterFreq: 500,
    reverb: true
  },
  levelUp: {
    type: 'levelUp',
    frequency: { start: 880, end: 1760 },
    oscillatorType: 'square',
    duration: 0.6,
    attack: 0.1,
    decay: 0.2,
    sustain: 0.8,
    release: 0.3,
    filterType: 'bandpass',
    filterFreq: 2000,
    reverb: true
  },
  combo: {
    type: 'combo',
    frequency: { start: 349, end: 523 },
    oscillatorType: 'triangle',
    duration: 0.15,
    attack: 0.01,
    decay: 0.05,
    sustain: 0.5,
    release: 0.09,
    filterType: 'bandpass',
    filterFreq: 1200
  },
  gameOver: {
    type: 'gameOver',
    frequency: { start: 220, end: 110 },
    oscillatorType: 'sawtooth',
    duration: 1.0,
    attack: 0.1,
    decay: 0.3,
    sustain: 0.4,
    release: 0.6,
    filterType: 'lowpass',
    filterFreq: 300,
    reverb: true
  },
  menu: {
    type: 'menu',
    frequency: { start: 440, end: 523 },
    oscillatorType: 'sine',
    duration: 0.1,
    attack: 0.02,
    decay: 0.03,
    sustain: 0.3,
    release: 0.05,
    filterType: 'bandpass',
    filterFreq: 1000
  },
  
  // Game-specific sounds
  snakeEat: {
    type: 'snakeEat',
    frequency: { start: 800, end: 1200 },
    oscillatorType: 'square',
    duration: 0.15,
    attack: 0.01,
    decay: 0.04,
    sustain: 0.4,
    release: 0.1,
    filterType: 'bandpass',
    filterFreq: 1600
  },
  pongBounce: {
    type: 'pongBounce',
    frequency: { start: 300, end: 600 },
    oscillatorType: 'triangle',
    duration: 0.1,
    attack: 0.005,
    decay: 0.02,
    sustain: 0.3,
    release: 0.065,
    filterType: 'bandpass',
    filterFreq: 900
  },
  terminalType: {
    type: 'terminalType',
    frequency: { start: 1000, end: 1000 },
    oscillatorType: 'square',
    duration: 0.05,
    attack: 0.001,
    decay: 0.01,
    sustain: 0.2,
    release: 0.039,
    filterType: 'highpass',
    filterFreq: 800
  },
  matrixRain: {
    type: 'matrixRain',
    frequency: { start: 220, end: 330 },
    oscillatorType: 'sine',
    duration: 0.8,
    attack: 0.2,
    decay: 0.2,
    sustain: 0.3,
    release: 0.3,
    filterType: 'lowpass',
    filterFreq: 600
  }
};

// Background music sequences using Web Audio synthesis
const MUSIC_SEQUENCES = {
  menu: {
    notes: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392], // A3 to G4
    rhythm: [0.5, 0.25, 0.5, 0.25, 0.5, 0.25, 1.0],
    tempo: 120,
    loop: true
  },
  gameplay: {
    notes: [174.61, 196, 220, 246.94, 261.63, 293.66], // F3 to D4
    rhythm: [0.5, 0.5, 0.25, 0.25, 0.5, 0.5],
    tempo: 100,
    loop: true
  },
  intense: {
    notes: [130.81, 146.83, 164.81, 174.61, 196, 220], // C3 to A3
    rhythm: [0.25, 0.25, 0.25, 0.25, 0.5, 0.5],
    tempo: 140,
    loop: true
  }
};

export function useSoundSystem() {
  const [config, setConfig] = useState<SoundConfig>(() => {
    const saved = localStorage.getItem('matrix-arcade-audio-config');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  const currentMusicRef = useRef<string | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);

  // Create reverb impulse response
  const createReverbBuffer = useCallback((
    audioContext: AudioContext,
    channels: number,
    sampleRate: number,
    length: number
  ): AudioBuffer => {
    const buffer = audioContext.createBuffer(channels, sampleRate * length, sampleRate);
    
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const decay = Math.pow(1 - i / channelData.length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.3;
      }
    }
    return buffer;
  }, []);

  // Initialize audio context and setup
  const initializeAudio = useCallback(async () => {
    // Check if context exists and its state
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      if (audioContextRef.current.state === 'closed') {
        audioContextRef.current = null;
        return null;
      }
      return audioContextRef.current;
    }

    try {
      const AudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create master gain node
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(config.masterVolume, audioContext.currentTime);
      masterGain.connect(audioContext.destination);
      masterGainRef.current = masterGain;

      // Create music gain node
      const musicGain = audioContext.createGain();
      musicGain.gain.setValueAtTime(config.musicVolume, audioContext.currentTime);
      musicGain.connect(masterGain);
      musicGainRef.current = musicGain;

      // Create SFX gain node
      const sfxGain = audioContext.createGain();
      sfxGain.gain.setValueAtTime(config.sfxVolume, audioContext.currentTime);
      sfxGain.connect(masterGain);
      sfxGainRef.current = sfxGain;

      // Create reverb node
      const convolver = audioContext.createConvolver();
      const reverbBuffer = createReverbBuffer(audioContext, 2, audioContext.sampleRate, 1.5);
      convolver.buffer = reverbBuffer;
      reverbRef.current = convolver;

      return audioContext;
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
      return null;
    }
  }, [config.masterVolume, config.musicVolume, config.sfxVolume, createReverbBuffer]);

  // Play sound effect
  const playSFX = useCallback(async (soundType: string, customConfig?: Partial<SoundEffect>) => {
    if (!config.sfx) return;

    const audioContext = await initializeAudio();
    if (!audioContext || !sfxGainRef.current) return;

    const soundConfig = customConfig 
      ? { ...SOUND_LIBRARY[soundType], ...customConfig }
      : SOUND_LIBRARY[soundType];
    
    if (!soundConfig) {
      console.warn(`Sound effect '${soundType}' not found in library`);
      return;
    }

    try {
      // Check if context is still valid
      if (audioContext.state === 'closed') return;
      
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      oscillator.type = soundConfig.oscillatorType;
      oscillator.frequency.setValueAtTime(soundConfig.frequency.start, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        soundConfig.frequency.end,
        audioContext.currentTime + soundConfig.duration
      );

      // Create envelope
      const envelope = audioContext.createGain();
      envelope.gain.setValueAtTime(0, audioContext.currentTime);
      envelope.gain.linearRampToValueAtTime(1, audioContext.currentTime + soundConfig.attack);
      envelope.gain.linearRampToValueAtTime(
        soundConfig.sustain,
        audioContext.currentTime + soundConfig.attack + soundConfig.decay
      );
      envelope.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + soundConfig.duration
      );

      // Create filter if specified
      if (soundConfig.filterType && soundConfig.filterFreq) {
        const filter = audioContext.createBiquadFilter();
        filter.type = soundConfig.filterType;
        filter.frequency.setValueAtTime(soundConfig.filterFreq, audioContext.currentTime);
        filter.Q.setValueAtTime(1, audioContext.currentTime);
        
        oscillator.connect(filter);
        filter.connect(envelope);
      } else {
        oscillator.connect(envelope);
      }

      // Add reverb if specified
      if (soundConfig.reverb && reverbRef.current) {
        const reverbGain = audioContext.createGain();
        reverbGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        const dryGain = audioContext.createGain();
        dryGain.gain.setValueAtTime(0.7, audioContext.currentTime);
        
        envelope.connect(dryGain);
        envelope.connect(reverbGain);
        reverbGain.connect(reverbRef.current);
        reverbRef.current.connect(sfxGainRef.current);
        dryGain.connect(sfxGainRef.current);
      } else {
        envelope.connect(sfxGainRef.current);
      }

      // Start and stop oscillator
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + soundConfig.duration);

    } catch (error) {
      console.warn('Error playing sound effect:', error);
    }
  }, [config.sfx, initializeAudio]);

  // Play background music
  const playMusic = useCallback(async (sequenceType: keyof typeof MUSIC_SEQUENCES) => {
    if (!config.music) return;
    
    // Stop current music if playing
    if (musicSourceRef.current) {
      musicSourceRef.current.stop();
      musicSourceRef.current = null;
    }

    const audioContext = await initializeAudio();
    if (!audioContext || !musicGainRef.current) return;

    currentMusicRef.current = sequenceType;
    const sequence = MUSIC_SEQUENCES[sequenceType];
    
    try {
      const playSequence = () => {
        if (currentMusicRef.current !== sequenceType) return; // Check if music changed
        if (audioContext.state === 'closed') return; // Check if context is closed
        
        let time = audioContext.currentTime;
        const noteDuration = 60 / sequence.tempo; // Base note duration

        sequence.notes.forEach((frequency, index) => {
          const rhythm = sequence.rhythm[index];
          const duration = noteDuration * rhythm;

          // Create oscillator for each note
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(frequency, time);

          // Create envelope for musical note
          const noteGain = audioContext.createGain();
          noteGain.gain.setValueAtTime(0, time);
          noteGain.gain.linearRampToValueAtTime(0.1, time + 0.02);
          noteGain.gain.linearRampToValueAtTime(0.05, time + duration * 0.7);
          noteGain.gain.linearRampToValueAtTime(0, time + duration);

          // Add subtle filter for warmth
          const filter = audioContext.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1200, time);
          filter.Q.setValueAtTime(0.5, time);

          oscillator.connect(filter);
          filter.connect(noteGain);
          noteGain.connect(musicGainRef.current!);

          oscillator.start(time);
          oscillator.stop(time + duration);

          time += duration;
        });

        // Schedule next loop if enabled
        if (sequence.loop && currentMusicRef.current === sequenceType) {
          const totalDuration = sequence.rhythm.reduce((sum, r) => sum + r * noteDuration, 0);
          setTimeout(playSequence, totalDuration * 1000);
        }
      };

      playSequence();
    } catch (error) {
      console.warn('Error playing background music:', error);
    }
  }, [config.music, initializeAudio]);

  // Stop music
  const stopMusic = useCallback(() => {
    currentMusicRef.current = null;
    if (musicSourceRef.current) {
      musicSourceRef.current.stop();
      musicSourceRef.current = null;
    }
  }, []);

  // Update config
  const updateConfig = useCallback((newConfig: Partial<SoundConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    localStorage.setItem('matrix-arcade-audio-config', JSON.stringify(updated));

    // Update gain nodes if they exist
    if (masterGainRef.current && updated.masterVolume !== config.masterVolume) {
      masterGainRef.current.gain.setValueAtTime(updated.masterVolume, 0);
    }
    if (musicGainRef.current && updated.musicVolume !== config.musicVolume) {
      musicGainRef.current.gain.setValueAtTime(updated.musicVolume, 0);
    }
    if (sfxGainRef.current && updated.sfxVolume !== config.sfxVolume) {
      sfxGainRef.current.gain.setValueAtTime(updated.sfxVolume, 0);
    }
  }, [config]);

  // Toggle mute for all sounds
  const toggleMute = useCallback(() => {
    const newConfig = {
      music: !config.music && !config.sfx ? true : false,
      sfx: !config.music && !config.sfx ? true : false
    };
    updateConfig(newConfig);
    
    // Stop music if muting
    if (config.music && !newConfig.music) {
      stopMusic();
    }
  }, [config.music, config.sfx, updateConfig, stopMusic]);

  // Check if muted
  const isMuted = !config.music && !config.sfx;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopMusic]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      config,
      updateConfig,
      playSFX,
      playMusic,
      stopMusic,
      toggleMute,
      isMuted,
      isInitialized: !!audioContextRef.current,
      soundLibrary: Object.keys(SOUND_LIBRARY),
      musicSequences: Object.keys(MUSIC_SEQUENCES)
    }),
    [config, updateConfig, playSFX, playMusic, stopMusic, toggleMute, isMuted]
  );
}