import { useCallback, useRef } from 'react';

interface SynthVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  id: string;
}

interface DrumSound {
  type: 'kick' | 'snare' | 'hihat' | 'crash';
  pitch?: number;
  decay?: number;
  tone?: number;
}

export function useSoundSynthesis() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef<Map<string, SynthVoice>>(new Map());
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  // Initialize audio context with compression
  const initializeContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContext();
      audioContextRef.current = context;

      // Master compressor for consistent volume
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, context.currentTime);
      compressor.knee.setValueAtTime(30, context.currentTime);
      compressor.ratio.setValueAtTime(12, context.currentTime);
      compressor.attack.setValueAtTime(0.003, context.currentTime);
      compressor.release.setValueAtTime(0.25, context.currentTime);
      compressor.connect(context.destination);
      compressorRef.current = compressor;
    }
    return audioContextRef.current;
  }, []);

  // Synthesize laser sound
  const synthLaser = useCallback(async (
    startFreq: number = 2000,
    endFreq: number = 100,
    duration: number = 0.2
  ) => {
    const context = await initializeContext();
    if (!context || !compressorRef.current) return;

    const now = context.currentTime;
    
    // Create nodes
    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    
    // Configure oscillator
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    
    // Configure filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq * 2, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq * 2, now + duration);
    filter.Q.setValueAtTime(5, now);
    
    // Configure envelope
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    // Connect and play
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(compressorRef.current);
    
    osc.start(now);
    osc.stop(now + duration);
  }, [initializeContext]);

  // Synthesize explosion
  const synthExplosion = useCallback(async (
    size: number = 1, // 0.5 to 2
    brightness: number = 0.5 // 0 to 1
  ) => {
    const context = await initializeContext();
    if (!context || !compressorRef.current) return;

    const now = context.currentTime;
    const duration = 0.5 * size;
    
    // White noise for explosion
    const bufferSize = context.sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() - 0.5) * 2;
    }
    
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    
    // Filters for shaping
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(200 + brightness * 3000, now);
    lowpass.frequency.exponentialRampToValueAtTime(50, now + duration);
    
    // Sub bass for impact
    const sub = context.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(40 * size, now);
    sub.frequency.exponentialRampToValueAtTime(20, now + duration * 0.3);
    
    // Gains
    const noiseGain = context.createGain();
    const subGain = context.createGain();
    const masterGain = context.createGain();
    
    noiseGain.gain.setValueAtTime(0.4, now);
    subGain.gain.setValueAtTime(0.3 * size, now);
    masterGain.gain.setValueAtTime(1, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    // Connect
    noise.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(masterGain);
    
    sub.connect(subGain);
    subGain.connect(masterGain);
    
    masterGain.connect(compressorRef.current);
    
    // Play
    noise.start(now);
    sub.start(now);
    sub.stop(now + duration);
  }, [initializeContext]);

  // Synthesize power-up sound
  const synthPowerUp = useCallback(async (
    type: 'collect' | 'activate' | 'expire' = 'collect'
  ) => {
    const context = await initializeContext();
    if (!context || !compressorRef.current) return;

    const now = context.currentTime;
    
    const configs = {
      collect: {
        freqs: [523, 659, 784, 1047], // C5, E5, G5, C6
        duration: 0.3,
        wave: 'triangle' as OscillatorType
      },
      activate: {
        freqs: [440, 554, 659, 880], // A4, C#5, E5, A5
        duration: 0.5,
        wave: 'square' as OscillatorType
      },
      expire: {
        freqs: [880, 659, 554, 440], // Reverse
        duration: 0.4,
        wave: 'sawtooth' as OscillatorType
      }
    };
    
    const config = configs[type];
    const noteLength = config.duration / config.freqs.length;
    
    config.freqs.forEach((freq, i) => {
      const startTime = now + i * noteLength;
      
      const osc = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      
      osc.type = config.wave;
      osc.frequency.setValueAtTime(freq, startTime);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, startTime);
      filter.Q.setValueAtTime(5, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(compressorRef.current);
      
      osc.start(startTime);
      osc.stop(startTime + noteLength);
    });
  }, [initializeContext]);

  // Synthesize drum sounds
  const synthDrum = useCallback(async (drum: DrumSound) => {
    const context = await initializeContext();
    if (!context || !compressorRef.current) return;

    const now = context.currentTime;
    
    switch (drum.type) {
      case 'kick': {
        const osc = context.createOscillator();
        const gain = context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60 * (drum.pitch || 1), now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (drum.decay || 0.5));
        
        osc.connect(gain);
        gain.connect(compressorRef.current);
        
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }
      
      case 'snare': {
        // Tone
        const osc = context.createOscillator();
        const oscGain = context.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200 * (drum.pitch || 1), now);
        
        // Noise
        const noise = context.createBufferSource();
        const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = noiseBuffer;
        
        const noiseFilter = context.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000 * (drum.tone || 1), now);
        
        const noiseGain = context.createGain();
        const masterGain = context.createGain();
        
        // Envelopes
        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (drum.decay || 0.2));
        
        masterGain.gain.setValueAtTime(0.7, now);
        
        // Connect
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        
        masterGain.connect(compressorRef.current);
        
        // Play
        osc.start(now);
        osc.stop(now + 0.2);
        noise.start(now);
        break;
      }
      
      case 'hihat': {
        const noise = context.createBufferSource();
        const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.05, context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = noiseBuffer;
        
        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000 * (drum.pitch || 1), now);
        
        const gain = context.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (drum.decay || 0.05));
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(compressorRef.current);
        
        noise.start(now);
        break;
      }
    }
  }, [initializeContext]);

  // Create a polyphonic synthesizer voice
  const synthVoice = useCallback(async (
    frequency: number,
    waveform: OscillatorType = 'sawtooth',
    voiceId: string = Math.random().toString()
  ) => {
    const context = await initializeContext();
    if (!context || !compressorRef.current) return null;

    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    
    osc.type = waveform;
    osc.frequency.setValueAtTime(frequency, context.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 3, context.currentTime);
    filter.Q.setValueAtTime(1, context.currentTime);
    
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(compressorRef.current);
    
    osc.start();
    
    const voice: SynthVoice = { oscillator: osc, gain, filter, id: voiceId };
    voicesRef.current.set(voiceId, voice);
    
    return voiceId;
  }, [initializeContext]);

  // Stop a synthesizer voice
  const stopVoice = useCallback(async (voiceId: string, fadeTime: number = 0.1) => {
    const voice = voicesRef.current.get(voiceId);
    if (!voice) return;

    const context = audioContextRef.current;
    if (!context) return;

    voice.gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + fadeTime);
    voice.oscillator.stop(context.currentTime + fadeTime);
    
    setTimeout(() => {
      voicesRef.current.delete(voiceId);
    }, fadeTime * 1000);
  }, []);

  return {
    synthLaser,
    synthExplosion,
    synthPowerUp,
    synthDrum,
    synthVoice,
    stopVoice,
    context: audioContextRef.current
  };
}