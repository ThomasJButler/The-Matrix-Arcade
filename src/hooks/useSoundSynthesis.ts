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
      const AudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
    startFreq: number = 1800,
    endFreq: number = 200,
    duration: number = 0.15
  ) => {
    const context = await initializeContext();
    if (!context || !compressorRef.current) return;

    const now = context.currentTime;

    // Create nodes
    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    // Configure oscillator - use triangle for softer laser
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    // Configure filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq * 1.5, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq * 2, now + duration);
    filter.Q.setValueAtTime(3, now);

    // Configure envelope with smoother attack/release
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
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
    const duration = 0.35 * size;

    // White noise for explosion
    const bufferSize = context.sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    // Reduce noise intensity
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() - 0.5) * 1.2;
    }

    const noise = context.createBufferSource();
    noise.buffer = buffer;

    // Filters for shaping
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(150 + brightness * 2000, now);
    lowpass.frequency.exponentialRampToValueAtTime(60, now + duration);

    // Sub bass for impact
    const sub = context.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(50 * size, now);
    sub.frequency.exponentialRampToValueAtTime(25, now + duration * 0.3);

    // Gains - reduced volumes
    const noiseGain = context.createGain();
    const subGain = context.createGain();
    const masterGain = context.createGain();

    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.1 * size, now + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.4);

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
        freqs: [523, 659, 784, 987], // C5, E5, G5, B5 (pentatonic)
        duration: 0.25,
        wave: 'triangle' as OscillatorType
      },
      activate: {
        freqs: [440, 554, 659, 880], // A4, C#5, E5, A5
        duration: 0.4,
        wave: 'triangle' as OscillatorType
      },
      expire: {
        freqs: [880, 659, 554, 440], // Reverse descending
        duration: 0.3,
        wave: 'sine' as OscillatorType
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
      filter.Q.setValueAtTime(4, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.008);
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
        osc.frequency.setValueAtTime(70 * (drum.pitch || 1), now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

        // Softer envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (drum.decay || 0.35));

        osc.connect(gain);
        gain.connect(compressorRef.current);

        osc.start(now);
        osc.stop(now + (drum.decay || 0.35));
        break;
      }

      case 'snare': {
        // Tone
        const osc = context.createOscillator();
        const oscGain = context.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180 * (drum.pitch || 1), now);

        // Noise
        const noise = context.createBufferSource();
        const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.15, context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);

        // Reduce noise intensity
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = (Math.random() - 0.5) * 1.2;
        }

        noise.buffer = noiseBuffer;

        const noiseFilter = context.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(900 * (drum.tone || 1), now);

        const noiseGain = context.createGain();
        const masterGain = context.createGain();

        // Softer envelopes
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.12, now + 0.01);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (drum.decay || 0.15));

        masterGain.gain.setValueAtTime(1, now);

        // Connect
        osc.connect(oscGain);
        oscGain.connect(masterGain);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        masterGain.connect(compressorRef.current);

        // Play
        osc.start(now);
        osc.stop(now + 0.15);
        noise.start(now);
        break;
      }

      case 'hihat': {
        const noise = context.createBufferSource();
        const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.04, context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);

        // Reduce noise intensity
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = (Math.random() - 0.5) * 0.8;
        }

        noise.buffer = noiseBuffer;

        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7500 * (drum.pitch || 1), now);

        const gain = context.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (drum.decay || 0.04));

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
    waveform: OscillatorType = 'triangle',
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
    filter.frequency.setValueAtTime(frequency * 2.5, context.currentTime);
    filter.Q.setValueAtTime(0.8, context.currentTime);

    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, context.currentTime + 0.01);

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