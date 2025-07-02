import { useCallback, useRef, useEffect } from 'react';
import { useSoundSystem } from './useSoundSystem';

interface ProceduralSoundParams {
  baseFrequency?: number;
  harmonics?: number[];
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  modulation?: {
    frequency: number;
    depth: number;
    type: OscillatorType;
  };
  filter?: {
    type: BiquadFilterType;
    frequency: number;
    Q: number;
  };
  effects?: {
    delay?: number;
    reverb?: number;
    distortion?: number;
    compression?: boolean;
  };
}

export function useProceduralAudio() {
  const { playSFX } = useSoundSystem();
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  // Initialize audio context
  useEffect(() => {
    const initContext = async () => {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        // Create noise buffer for texture sounds
        noiseBufferRef.current = createNoiseBuffer(audioContextRef.current);
      }
    };
    initContext();
  }, []);

  // Create white noise buffer
  const createNoiseBuffer = (context: AudioContext): AudioBuffer => {
    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  };

  // Generate engine sound based on speed/intensity
  const generateEngineSound = useCallback((
    speed: number, // 0-1
    intensity: number = 0.5, // 0-1
    duration: number = 0.1
  ) => {
    const context = audioContextRef.current;
    if (!context) return;

    const baseFreq = 50 + speed * 150; // 50-200 Hz
    const now = context.currentTime;

    // Create oscillators for engine layers
    const fundamental = context.createOscillator();
    const harmonic1 = context.createOscillator();
    const harmonic2 = context.createOscillator();
    
    fundamental.type = 'sawtooth';
    harmonic1.type = 'square';
    harmonic2.type = 'triangle';
    
    fundamental.frequency.setValueAtTime(baseFreq, now);
    harmonic1.frequency.setValueAtTime(baseFreq * 2, now);
    harmonic2.frequency.setValueAtTime(baseFreq * 3, now);

    // Create gains
    const fundamentalGain = context.createGain();
    const harmonic1Gain = context.createGain();
    const harmonic2Gain = context.createGain();
    const masterGain = context.createGain();
    
    fundamentalGain.gain.setValueAtTime(0.4, now);
    harmonic1Gain.gain.setValueAtTime(0.2 * intensity, now);
    harmonic2Gain.gain.setValueAtTime(0.1 * intensity, now);
    masterGain.gain.setValueAtTime(0.3, now);

    // Add filter for engine rumble
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200 + speed * 300, now);
    filter.Q.setValueAtTime(5, now);

    // Connect nodes
    fundamental.connect(fundamentalGain);
    harmonic1.connect(harmonic1Gain);
    harmonic2.connect(harmonic2Gain);
    
    fundamentalGain.connect(filter);
    harmonic1Gain.connect(filter);
    harmonic2Gain.connect(filter);
    
    filter.connect(masterGain);
    masterGain.connect(context.destination);

    // Start and stop
    fundamental.start(now);
    harmonic1.start(now);
    harmonic2.start(now);
    
    fundamental.stop(now + duration);
    harmonic1.stop(now + duration);
    harmonic2.stop(now + duration);

    // Envelope
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  }, []);

  // Generate collision sound based on impact force
  const generateCollisionSound = useCallback((
    impactForce: number, // 0-1
    materialType: 'metal' | 'glass' | 'plastic' | 'organic' = 'metal'
  ) => {
    const context = audioContextRef.current;
    const noiseBuffer = noiseBufferRef.current;
    if (!context || !noiseBuffer) return;

    const now = context.currentTime;
    
    // Material-specific parameters
    const materials = {
      metal: { freq: 200, decay: 0.3, brightness: 0.8 },
      glass: { freq: 800, decay: 0.5, brightness: 1.0 },
      plastic: { freq: 400, decay: 0.2, brightness: 0.6 },
      organic: { freq: 100, decay: 0.1, brightness: 0.3 }
    };
    
    const material = materials[materialType];
    const baseFreq = material.freq * (0.5 + impactForce);

    // Tone component
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + material.decay);

    // Noise component
    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Filters
    const toneFilter = context.createBiquadFilter();
    toneFilter.type = 'bandpass';
    toneFilter.frequency.setValueAtTime(baseFreq, now);
    toneFilter.Q.setValueAtTime(10, now);

    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(baseFreq * 2, now);

    // Gains
    const toneGain = context.createGain();
    const noiseGain = context.createGain();
    const masterGain = context.createGain();

    const volume = 0.3 * impactForce;
    toneGain.gain.setValueAtTime(volume, now);
    noiseGain.gain.setValueAtTime(volume * material.brightness, now);
    masterGain.gain.setValueAtTime(1, now);

    // Envelope
    const attackTime = 0.001;
    const decayTime = material.decay;
    
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(1, now + attackTime);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);

    // Connect
    osc.connect(toneFilter);
    toneFilter.connect(toneGain);
    toneGain.connect(masterGain);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    masterGain.connect(context.destination);

    // Start
    osc.start(now);
    noiseSource.start(now);
    osc.stop(now + decayTime);
    noiseSource.stop(now + decayTime);
  }, []);

  // Generate adaptive background music
  const generateAdaptiveMusic = useCallback((
    intensity: number, // 0-1
    mood: 'calm' | 'tense' | 'action' | 'victory' = 'calm'
  ) => {
    const context = audioContextRef.current;
    if (!context) return null;

    const scales = {
      calm: [0, 2, 4, 7, 9],      // Major pentatonic
      tense: [0, 1, 3, 5, 7, 8],  // Minor with tension
      action: [0, 3, 5, 7, 10],    // Minor pentatonic
      victory: [0, 4, 7, 11]       // Major with 7th
    };

    const tempos = {
      calm: 60 + intensity * 20,
      tense: 80 + intensity * 40,
      action: 120 + intensity * 60,
      victory: 100 + intensity * 40
    };

    const scale = scales[mood];
    const tempo = tempos[mood];
    const beatDuration = 60 / tempo;

    // Create a sequence of notes
    const createSequence = () => {
      const sequence: { note: number; time: number; duration: number }[] = [];
      let currentTime = 0;
      
      for (let i = 0; i < 16; i++) {
        if (Math.random() > 0.3 - intensity * 0.2) {
          const noteIndex = Math.floor(Math.random() * scale.length);
          const octave = Math.floor(Math.random() * 2) + 3;
          const note = scale[noteIndex] + octave * 12;
          
          sequence.push({
            note: 440 * Math.pow(2, (note - 69) / 12),
            time: currentTime,
            duration: beatDuration * (Math.random() > 0.7 ? 2 : 1)
          });
        }
        currentTime += beatDuration;
      }
      
      return sequence;
    };

    return { createSequence, beatDuration };
  }, []);

  // Sound variation system
  const createSoundVariation = useCallback((
    baseSound: ProceduralSoundParams,
    variationAmount: number = 0.2
  ): ProceduralSoundParams => {
    const vary = (value: number, amount: number) => 
      value * (1 + (Math.random() - 0.5) * amount);

    return {
      ...baseSound,
      baseFrequency: baseSound.baseFrequency ? vary(baseSound.baseFrequency, variationAmount) : undefined,
      envelope: baseSound.envelope ? {
        attack: vary(baseSound.envelope.attack, variationAmount),
        decay: vary(baseSound.envelope.decay, variationAmount),
        sustain: vary(baseSound.envelope.sustain, variationAmount),
        release: vary(baseSound.envelope.release, variationAmount)
      } : undefined,
      filter: baseSound.filter ? {
        ...baseSound.filter,
        frequency: vary(baseSound.filter.frequency, variationAmount),
        Q: vary(baseSound.filter.Q, variationAmount * 0.5)
      } : undefined
    };
  }, []);

  // Granular synthesis for texture sounds
  const generateTextureSound = useCallback((
    grainSize: number = 0.05, // seconds
    grainDensity: number = 10, // grains per second
    duration: number = 1 // seconds
  ) => {
    const context = audioContextRef.current;
    const noiseBuffer = noiseBufferRef.current;
    if (!context || !noiseBuffer) return;

    const now = context.currentTime;
    const grainInterval = 1 / grainDensity;
    
    for (let i = 0; i < duration * grainDensity; i++) {
      const startTime = now + i * grainInterval + (Math.random() - 0.5) * grainInterval * 0.5;
      
      // Create grain
      const grainSource = context.createBufferSource();
      grainSource.buffer = noiseBuffer;
      
      const grainGain = context.createGain();
      const grainFilter = context.createBiquadFilter();
      
      // Randomize grain parameters
      grainFilter.type = 'bandpass';
      grainFilter.frequency.setValueAtTime(200 + Math.random() * 2000, startTime);
      grainFilter.Q.setValueAtTime(1 + Math.random() * 5, startTime);
      
      // Grain envelope
      grainGain.gain.setValueAtTime(0, startTime);
      grainGain.gain.linearRampToValueAtTime(0.1, startTime + grainSize * 0.1);
      grainGain.gain.exponentialRampToValueAtTime(0.001, startTime + grainSize);
      
      // Connect
      grainSource.connect(grainFilter);
      grainFilter.connect(grainGain);
      grainGain.connect(context.destination);
      
      // Play grain
      const offset = Math.random() * (noiseBuffer.duration - grainSize);
      grainSource.start(startTime, offset, grainSize);
    }
  }, []);

  // 3D spatial audio
  const create3DAudioSource = useCallback((
    x: number,
    y: number,
    z: number
  ) => {
    const context = audioContextRef.current;
    if (!context) return null;

    const panner = context.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;
    
    panner.setPosition(x, y, z);
    
    return panner;
  }, []);

  return {
    generateEngineSound,
    generateCollisionSound,
    generateAdaptiveMusic,
    createSoundVariation,
    generateTextureSound,
    create3DAudioSource,
    context: audioContextRef.current
  };
}