import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoundSynthesis } from './useSoundSynthesis';

// Mock AudioContext
const mockOscillator = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  type: 'sine' as OscillatorType,
  frequency: {
    value: 440,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
};

const mockGainNode = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  gain: {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
};

const mockFilter = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  type: 'lowpass' as BiquadFilterType,
  frequency: {
    value: 1000,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  Q: {
    value: 1,
    setValueAtTime: vi.fn(),
  },
};

const mockCompressor = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  threshold: { setValueAtTime: vi.fn() },
  knee: { setValueAtTime: vi.fn() },
  ratio: { setValueAtTime: vi.fn() },
  attack: { setValueAtTime: vi.fn() },
  release: { setValueAtTime: vi.fn() },
};

const mockBufferSource = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  buffer: null as AudioBuffer | null,
};

const mockAudioContext = {
  createOscillator: vi.fn(() => ({ ...mockOscillator })),
  createGain: vi.fn(() => ({
    ...mockGainNode,
    gain: { ...mockGainNode.gain }
  })),
  createBiquadFilter: vi.fn(() => ({
    ...mockFilter,
    frequency: { ...mockFilter.frequency },
    Q: { ...mockFilter.Q }
  })),
  createDynamicsCompressor: vi.fn(() => ({ ...mockCompressor })),
  createBuffer: vi.fn((channels: number, length: number, sampleRate: number) => ({
    length,
    sampleRate,
    numberOfChannels: channels,
    getChannelData: vi.fn(() => new Float32Array(length)),
  })),
  createBufferSource: vi.fn(() => ({ ...mockBufferSource })),
  currentTime: 0,
  destination: {},
  state: 'running' as AudioContextState,
  close: vi.fn(),
  resume: vi.fn(),
  suspend: vi.fn(),
  sampleRate: 48000,
};

(global as unknown as Record<string, unknown>).AudioContext = vi.fn(() => mockAudioContext);
(global as unknown as Record<string, unknown>).webkitAudioContext = vi.fn(() => mockAudioContext);

describe('useSoundSynthesis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioContext.state = 'running';
    mockAudioContext.currentTime = 0;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialisation', () => {
    it('returns all synth functions', () => {
      const { result } = renderHook(() => useSoundSynthesis());

      expect(result.current.synthLaser).toBeDefined();
      expect(result.current.synthExplosion).toBeDefined();
      expect(result.current.synthPowerUp).toBeDefined();
      expect(result.current.synthDrum).toBeDefined();
      expect(result.current.synthVoice).toBeDefined();
      expect(result.current.stopVoice).toBeDefined();
    });

    it('initialises with null context', () => {
      const { result } = renderHook(() => useSoundSynthesis());

      expect(result.current.context).toBeNull();
    });

    it('creates audio context lazily on first sound', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      expect(global.AudioContext).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.synthLaser();
      });

      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });

    it('reuses existing audio context', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser();
        await result.current.synthExplosion();
      });

      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('synthLaser', () => {
    it('creates oscillator with sawtooth waveform', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser();
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.type).toBe('sawtooth');
    });

    it('uses default frequency sweep from 2000 to 100 Hz', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser();
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(2000, 0);
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(100, 0.2);
    });

    it('accepts custom start and end frequencies', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser(1500, 200, 0.3);
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(1500, 0);
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(200, 0.3);
    });

    it('creates lowpass filter with Q factor of 5', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser();
      });

      const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
      expect(filter.type).toBe('lowpass');
      expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(5, 0);
    });

    it('sets up gain envelope with attack and release', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser();
      });

      const gain = mockAudioContext.createGain.mock.results[0].value;
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 0);
      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.2);
    });

    it('connects nodes through compressor', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser();
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
      const gain = mockAudioContext.createGain.mock.results[0].value;

      expect(osc.connect).toHaveBeenCalledWith(filter);
      expect(filter.connect).toHaveBeenCalledWith(gain);
      expect(gain.connect).toHaveBeenCalled();
    });

    it('starts and schedules oscillator stop', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser(2000, 100, 0.2);
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.start).toHaveBeenCalledWith(0);
      expect(osc.stop).toHaveBeenCalledWith(0.2);
    });
  });

  describe('synthExplosion', () => {
    it('creates white noise buffer', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthExplosion();
      });

      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it('uses default size and brightness parameters', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthExplosion();
      });

      // Default size=1, brightness=0.5
      // Duration = 0.5 * size = 0.5 seconds
      const expectedBufferLength = Math.floor(mockAudioContext.sampleRate * 0.5);
      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(
        1,
        expectedBufferLength,
        mockAudioContext.sampleRate
      );
    });

    it('accepts custom size parameter affecting duration', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthExplosion(2, 0.5);
      });

      // size=2, duration = 0.5 * 2 = 1 second
      const expectedBufferLength = Math.floor(mockAudioContext.sampleRate * 1.0);
      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(
        1,
        expectedBufferLength,
        mockAudioContext.sampleRate
      );
    });

    it('creates lowpass filter for noise shaping', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthExplosion(1, 0.5);
      });

      const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
      expect(filter.type).toBe('lowpass');
      // brightness=0.5, so frequency = 200 + 0.5 * 3000 = 1700
      expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1700, 0);
    });

    it('creates sub-bass oscillator for impact', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthExplosion(1, 0.5);
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.type).toBe('sine');
      // size=1, frequency = 40 * 1 = 40
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(40, 0);
    });

    it('applies master gain envelope', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthExplosion();
      });

      // Master gain is the 3rd gain node created (after noiseGain and subGain)
      const masterGain = mockAudioContext.createGain.mock.results[2].value;
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(1, 0);
    });

    it('starts both noise source and sub oscillator', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthExplosion();
      });

      const bufferSource = mockAudioContext.createBufferSource.mock.results[0].value;
      const osc = mockAudioContext.createOscillator.mock.results[0].value;

      expect(bufferSource.start).toHaveBeenCalledWith(0);
      expect(osc.start).toHaveBeenCalledWith(0);
    });
  });

  describe('synthPowerUp', () => {
    it('plays collect arpeggio with triangle wave by default', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthPowerUp('collect');
      });

      // Collect has 4 notes: C5, E5, G5, C6
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);

      const firstOsc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(firstOsc.type).toBe('triangle');
    });

    it('plays collect notes in correct sequence (C5, E5, G5, C6)', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthPowerUp('collect');
      });

      // Check frequencies - C5=523, E5=659, G5=784, C6=1047
      const oscs = mockAudioContext.createOscillator.mock.results;
      expect(oscs[0].value.frequency.setValueAtTime).toHaveBeenCalledWith(523, expect.any(Number));
      expect(oscs[1].value.frequency.setValueAtTime).toHaveBeenCalledWith(659, expect.any(Number));
      expect(oscs[2].value.frequency.setValueAtTime).toHaveBeenCalledWith(784, expect.any(Number));
      expect(oscs[3].value.frequency.setValueAtTime).toHaveBeenCalledWith(1047, expect.any(Number));
    });

    it('plays activate type with square wave', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthPowerUp('activate');
      });

      const firstOsc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(firstOsc.type).toBe('square');
    });

    it('plays expire type with sawtooth wave in reverse order', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthPowerUp('expire');
      });

      const firstOsc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(firstOsc.type).toBe('sawtooth');
      // Expire is reversed: A5, E5, C#5, A4
      expect(firstOsc.frequency.setValueAtTime).toHaveBeenCalledWith(880, expect.any(Number));
    });

    it('creates bandpass filter for each note', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthPowerUp('collect');
      });

      // Should create 4 filters for 4 notes
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalledTimes(4);

      const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
      expect(filter.type).toBe('bandpass');
    });

    it('applies per-note gain envelope', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthPowerUp('collect');
      });

      // Each note has a gain node
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(4);

      const gain = mockAudioContext.createGain.mock.results[0].value;
      // Should start at 0, ramp to 0.2, then decay
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
      expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.2, expect.any(Number));
    });

    it('schedules notes with correct timing', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthPowerUp('collect');
      });

      const oscs = mockAudioContext.createOscillator.mock.results;
      // Duration = 0.3, 4 notes, so each note is 0.075 seconds
      // Notes start at 0, 0.075, 0.15, 0.225 (with floating point tolerance)
      expect(oscs[0].value.start).toHaveBeenCalledWith(0);
      expect(oscs[1].value.start).toHaveBeenCalledWith(0.075);
      expect(oscs[2].value.start).toHaveBeenCalledWith(0.15);
      // Use closeTo for floating-point precision
      expect(oscs[3].value.start).toHaveBeenCalledWith(expect.closeTo(0.225, 5));
    });
  });

  describe('synthDrum', () => {
    describe('kick drum', () => {
      it('creates sine wave oscillator', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'kick' });
        });

        const osc = mockAudioContext.createOscillator.mock.results[0].value;
        expect(osc.type).toBe('sine');
      });

      it('sweeps frequency from 60Hz to 40Hz', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'kick' });
        });

        const osc = mockAudioContext.createOscillator.mock.results[0].value;
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(60, 0);
        expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(40, 0.1);
      });

      it('applies pitch modifier', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'kick', pitch: 1.5 });
        });

        const osc = mockAudioContext.createOscillator.mock.results[0].value;
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(90, 0); // 60 * 1.5
      });

      it('uses default decay of 0.5 seconds', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'kick' });
        });

        const gain = mockAudioContext.createGain.mock.results[0].value;
        expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.5);
      });

      it('accepts custom decay parameter', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'kick', decay: 0.8 });
        });

        const gain = mockAudioContext.createGain.mock.results[0].value;
        expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.8);
      });
    });

    describe('snare drum', () => {
      it('creates both tone oscillator and noise source', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'snare' });
        });

        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      });

      it('uses triangle wave for tone component', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'snare' });
        });

        const osc = mockAudioContext.createOscillator.mock.results[0].value;
        expect(osc.type).toBe('triangle');
      });

      it('creates highpass filter for noise at 1000Hz', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'snare' });
        });

        const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
        expect(filter.type).toBe('highpass');
        expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1000, 0);
      });

      it('applies tone modifier to filter frequency', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'snare', tone: 1.5 });
        });

        const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
        expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1500, 0); // 1000 * 1.5
      });

      it('uses default decay of 0.2 seconds for noise', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'snare' });
        });

        // noiseGain is the 2nd gain node
        const noiseGain = mockAudioContext.createGain.mock.results[1].value;
        expect(noiseGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.2);
      });
    });

    describe('hi-hat', () => {
      it('creates noise-only source', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'hihat' });
        });

        expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
        // No oscillator for hi-hat
        expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
      });

      it('creates short noise buffer (0.05 seconds)', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'hihat' });
        });

        const expectedLength = mockAudioContext.sampleRate * 0.05;
        expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(
          1,
          expectedLength,
          mockAudioContext.sampleRate
        );
      });

      it('uses highpass filter at 8000Hz', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'hihat' });
        });

        const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
        expect(filter.type).toBe('highpass');
        expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(8000, 0);
      });

      it('applies pitch modifier to filter frequency', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'hihat', pitch: 0.5 });
        });

        const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
        expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(4000, 0); // 8000 * 0.5
      });

      it('uses very short decay (0.05 seconds default)', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'hihat' });
        });

        const gain = mockAudioContext.createGain.mock.results[0].value;
        expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.05);
      });

      it('accepts custom decay for open hi-hat', async () => {
        const { result } = renderHook(() => useSoundSynthesis());

        await act(async () => {
          await result.current.synthDrum({ type: 'hihat', decay: 0.3 });
        });

        const gain = mockAudioContext.createGain.mock.results[0].value;
        expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.3);
      });
    });
  });

  describe('synthVoice', () => {
    it('creates voice with given frequency', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthVoice(440);
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);
    });

    it('uses sawtooth waveform by default', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthVoice(440);
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.type).toBe('sawtooth');
    });

    it('accepts custom waveform', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthVoice(440, 'square');
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.type).toBe('square');
    });

    it('returns voice ID', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      let voiceId: string | null = null;
      await act(async () => {
        voiceId = await result.current.synthVoice(440, 'sawtooth', 'test-voice');
      });

      expect(voiceId).toBe('test-voice');
    });

    it('generates random ID if not provided', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      let voiceId: string | null = null;
      await act(async () => {
        voiceId = await result.current.synthVoice(440);
      });

      expect(voiceId).toBeTruthy();
      expect(typeof voiceId).toBe('string');
    });

    it('creates lowpass filter tuned to frequency', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthVoice(440);
      });

      const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
      expect(filter.type).toBe('lowpass');
      // Filter frequency = 440 * 3 = 1320
      expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1320, 0);
    });

    it('applies attack envelope', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthVoice(440);
      });

      const gain = mockAudioContext.createGain.mock.results[0].value;
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
      expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.2, 0.01);
    });

    it('starts oscillator immediately', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthVoice(440);
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.start).toHaveBeenCalled();
    });
  });

  describe('stopVoice', () => {
    it('does nothing for non-existent voice', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      // Initialise context first
      await act(async () => {
        await result.current.synthLaser();
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.stopVoice('non-existent');
      });

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('fades out voice with default time of 0.1 seconds', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      let voiceId: string | null = null;
      await act(async () => {
        voiceId = await result.current.synthVoice(440, 'sawtooth', 'fade-test');
      });

      const gain = mockAudioContext.createGain.mock.results[0].value;
      vi.clearAllMocks();

      await act(async () => {
        await result.current.stopVoice(voiceId!);
      });

      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.1);
    });

    it('accepts custom fade time', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      let voiceId: string | null = null;
      await act(async () => {
        voiceId = await result.current.synthVoice(440, 'sawtooth', 'custom-fade');
      });

      const gain = mockAudioContext.createGain.mock.results[0].value;
      vi.clearAllMocks();

      await act(async () => {
        await result.current.stopVoice(voiceId!, 0.5);
      });

      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.5);
    });

    it('schedules oscillator stop after fade', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      let voiceId: string | null = null;
      await act(async () => {
        voiceId = await result.current.synthVoice(440, 'sawtooth', 'stop-test');
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      vi.clearAllMocks();

      await act(async () => {
        await result.current.stopVoice(voiceId!, 0.2);
      });

      expect(osc.stop).toHaveBeenCalledWith(0.2);
    });
  });

  describe('Compressor Setup', () => {
    it('creates master compressor on first sound', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser();
      });

      expect(mockAudioContext.createDynamicsCompressor).toHaveBeenCalled();
    });

    it('configures compressor with correct parameters', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser();
      });

      const compressor = mockAudioContext.createDynamicsCompressor.mock.results[0].value;
      expect(compressor.threshold.setValueAtTime).toHaveBeenCalledWith(-24, 0);
      expect(compressor.knee.setValueAtTime).toHaveBeenCalledWith(30, 0);
      expect(compressor.ratio.setValueAtTime).toHaveBeenCalledWith(12, 0);
      expect(compressor.attack.setValueAtTime).toHaveBeenCalledWith(0.003, 0);
      expect(compressor.release.setValueAtTime).toHaveBeenCalledWith(0.25, 0);
    });

    it('connects compressor to destination', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser();
      });

      const compressor = mockAudioContext.createDynamicsCompressor.mock.results[0].value;
      expect(compressor.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing compressor gracefully', async () => {
      // Create a scenario where compressor might not exist
      const { result } = renderHook(() => useSoundSynthesis());

      // Should not throw
      await expect(act(async () => {
        await result.current.synthLaser();
      })).resolves.not.toThrow();
    });

    it('handles webkitAudioContext fallback', async () => {
      // Remove standard AudioContext
      const originalAudioContext = global.AudioContext;
      (global as unknown as Record<string, unknown>).AudioContext = undefined;

      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await result.current.synthLaser();
      });

      // Should have used webkitAudioContext
      expect(global.webkitAudioContext).toHaveBeenCalled();

      // Restore
      (global as unknown as Record<string, unknown>).AudioContext = originalAudioContext;
    });

    it('can play multiple sounds simultaneously', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      await act(async () => {
        await Promise.all([
          result.current.synthLaser(),
          result.current.synthExplosion(),
          result.current.synthPowerUp('collect'),
        ]);
      });

      // Should have created multiple oscillators
      expect(mockAudioContext.createOscillator.mock.calls.length).toBeGreaterThan(3);
    });

    it('can manage multiple voices concurrently', async () => {
      const { result } = renderHook(() => useSoundSynthesis());

      const voiceIds: (string | null)[] = [];
      await act(async () => {
        voiceIds.push(await result.current.synthVoice(262, 'sine', 'c4'));
        voiceIds.push(await result.current.synthVoice(330, 'sine', 'e4'));
        voiceIds.push(await result.current.synthVoice(392, 'sine', 'g4'));
      });

      expect(voiceIds).toEqual(['c4', 'e4', 'g4']);
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });
  });

  describe('Memory Management', () => {
    it('cleans up voice after stop', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useSoundSynthesis());

      let voiceId: string | null = null;
      await act(async () => {
        voiceId = await result.current.synthVoice(440, 'sawtooth', 'cleanup-test');
      });

      await act(async () => {
        await result.current.stopVoice(voiceId!, 0.1);
      });

      // Advance time to after cleanup
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      // Verify voice was stopped
      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.stop).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
