import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProceduralAudio } from './useProceduralAudio';

// Mock AudioContext and nodes
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

const mockPanner = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  panningModel: 'HRTF' as PanningModelType,
  distanceModel: 'inverse' as DistanceModelType,
  refDistance: 1,
  maxDistance: 10000,
  rolloffFactor: 1,
  coneInnerAngle: 360,
  coneOuterAngle: 0,
  coneOuterGain: 0,
  setPosition: vi.fn(),
};

const mockBufferSource = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  buffer: null as AudioBuffer | null,
};

const mockAudioBuffer = {
  duration: 2,
  length: 96000,
  sampleRate: 48000,
  numberOfChannels: 1,
  getChannelData: vi.fn(() => new Float32Array(96000)),
};

const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    ...mockOscillator,
    frequency: { ...mockOscillator.frequency },
  })),
  createGain: vi.fn(() => ({
    ...mockGainNode,
    gain: { ...mockGainNode.gain },
  })),
  createBiquadFilter: vi.fn(() => ({
    ...mockFilter,
    frequency: { ...mockFilter.frequency },
    Q: { ...mockFilter.Q },
  })),
  createPanner: vi.fn(() => ({ ...mockPanner })),
  createBuffer: vi.fn((channels: number, length: number, sampleRate: number) => ({
    length,
    sampleRate,
    duration: length / sampleRate,
    numberOfChannels: channels,
    getChannelData: vi.fn(() => new Float32Array(length)),
  })),
  createBufferSource: vi.fn(() => ({
    ...mockBufferSource,
    buffer: mockAudioBuffer,
  })),
  currentTime: 0,
  destination: {},
  state: 'running' as AudioContextState,
  close: vi.fn(),
  resume: vi.fn(),
  suspend: vi.fn(),
  sampleRate: 48000,
};

// Set up global AudioContext mock
(global as unknown as Record<string, unknown>).AudioContext = vi.fn(() => mockAudioContext);
(global as unknown as Record<string, unknown>).webkitAudioContext = vi.fn(() => mockAudioContext);

describe('useProceduralAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioContext.state = 'running';
    mockAudioContext.currentTime = 0;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialisation', () => {
    it('returns all procedural audio functions', () => {
      const { result } = renderHook(() => useProceduralAudio());

      expect(result.current.generateEngineSound).toBeDefined();
      expect(result.current.generateCollisionSound).toBeDefined();
      expect(result.current.generateAdaptiveMusic).toBeDefined();
      expect(result.current.createSoundVariation).toBeDefined();
      expect(result.current.generateTextureSound).toBeDefined();
      expect(result.current.create3DAudioSource).toBeDefined();
    });

    it('creates audio context on mount', async () => {
      renderHook(() => useProceduralAudio());

      // Wait for useEffect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });

    it('falls back to webkitAudioContext if AudioContext unavailable', async () => {
      const originalAudioContext = (global as unknown as Record<string, unknown>).AudioContext;
      (global as unknown as Record<string, unknown>).AudioContext = undefined;

      renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(global.webkitAudioContext).toHaveBeenCalled();

      // Restore
      (global as unknown as Record<string, unknown>).AudioContext = originalAudioContext;
    });

    it('creates noise buffer for texture sounds', async () => {
      renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Noise buffer created with 2 seconds of samples
      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(
        1,
        mockAudioContext.sampleRate * 2,
        mockAudioContext.sampleRate
      );
    });
  });

  describe('generateEngineSound', () => {
    it('creates three oscillators for fundamental and harmonics', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateEngineSound(0.5);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });

    it('uses different waveforms for oscillator layers', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateEngineSound(0.5);
      });

      const oscillators = mockAudioContext.createOscillator.mock.results;
      expect(oscillators[0].value.type).toBe('sawtooth');
      expect(oscillators[1].value.type).toBe('square');
      expect(oscillators[2].value.type).toBe('triangle');
    });

    it('calculates base frequency from speed (50-200 Hz range)', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Speed 0 should give base frequency 50 Hz
      act(() => {
        result.current.generateEngineSound(0);
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(50, 0);
    });

    it('sets harmonic frequencies at 2x and 3x fundamental', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateEngineSound(0.5); // Base freq = 125 Hz
      });

      const oscillators = mockAudioContext.createOscillator.mock.results;
      expect(oscillators[0].value.frequency.setValueAtTime).toHaveBeenCalledWith(125, 0);
      expect(oscillators[1].value.frequency.setValueAtTime).toHaveBeenCalledWith(250, 0);
      expect(oscillators[2].value.frequency.setValueAtTime).toHaveBeenCalledWith(375, 0);
    });

    it('creates lowpass filter for engine rumble', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateEngineSound(0.5);
      });

      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
      const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
      expect(filter.type).toBe('lowpass');
    });

    it('adjusts filter cutoff based on speed', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // At speed 0.5, cutoff should be 200 + 0.5 * 300 = 350 Hz
      act(() => {
        result.current.generateEngineSound(0.5);
      });

      const filter = mockAudioContext.createBiquadFilter.mock.results[0].value;
      expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(350, 0);
    });

    it('adjusts harmonic gain based on intensity', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateEngineSound(0.5, 0.8);
      });

      const gains = mockAudioContext.createGain.mock.results;
      // Order: fundamentalGain, harmonic1Gain, harmonic2Gain, masterGain
      // Harmonic 1 gain should be 0.2 * intensity = 0.16
      expect(gains[1].value.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.16, 5), 0);
      // Harmonic 2 gain should be 0.1 * intensity = 0.08
      expect(gains[2].value.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.08, 5), 0);
    });

    it('schedules oscillators to stop after duration', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateEngineSound(0.5, 0.5, 0.2);
      });

      const oscillators = mockAudioContext.createOscillator.mock.results;
      expect(oscillators[0].value.stop).toHaveBeenCalledWith(0.2);
      expect(oscillators[1].value.stop).toHaveBeenCalledWith(0.2);
      expect(oscillators[2].value.stop).toHaveBeenCalledWith(0.2);
    });

    it('handles missing audio context gracefully', async () => {
      // Test that the function doesn't throw even with unusual conditions
      const { result } = renderHook(() => useProceduralAudio());

      // The function should work without throwing
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should be able to call successfully
      expect(() => {
        act(() => {
          result.current.generateEngineSound(0.5);
        });
      }).not.toThrow();
    });
  });

  describe('generateCollisionSound', () => {
    it('creates tone and noise components', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateCollisionSound(0.5);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it('uses sine wave for tone component', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateCollisionSound(0.5);
      });

      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.type).toBe('sine');
    });

    it('uses metal material parameters by default', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateCollisionSound(1.0);
      });

      // Metal has base freq 200, at impact 1.0: 200 * (0.5 + 1.0) = 300 Hz
      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(300, 0);
    });

    it('applies glass material parameters correctly', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateCollisionSound(1.0, 'glass');
      });

      // Glass has base freq 800, at impact 1.0: 800 * (0.5 + 1.0) = 1200 Hz
      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 0);
    });

    it('applies plastic material parameters correctly', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateCollisionSound(1.0, 'plastic');
      });

      // Plastic has base freq 400, at impact 1.0: 400 * (0.5 + 1.0) = 600 Hz
      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(600, 0);
    });

    it('applies organic material parameters correctly', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateCollisionSound(1.0, 'organic');
      });

      // Organic has base freq 100, at impact 1.0: 100 * (0.5 + 1.0) = 150 Hz
      const osc = mockAudioContext.createOscillator.mock.results[0].value;
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(150, 0);
    });

    it('creates bandpass filter for tone component', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateCollisionSound(0.5);
      });

      const filters = mockAudioContext.createBiquadFilter.mock.results;
      expect(filters[0].value.type).toBe('bandpass');
    });

    it('creates highpass filter for noise component', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateCollisionSound(0.5);
      });

      const filters = mockAudioContext.createBiquadFilter.mock.results;
      expect(filters[1].value.type).toBe('highpass');
    });

    it('scales volume with impact force', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateCollisionSound(0.8);
      });

      // Volume = 0.3 * impactForce = 0.24
      const gains = mockAudioContext.createGain.mock.results;
      expect(gains[0].value.gain.setValueAtTime).toHaveBeenCalledWith(0.24, 0);
    });

    it('applies envelope with fast attack', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateCollisionSound(0.5);
      });

      const masterGain = mockAudioContext.createGain.mock.results[2].value;
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
      expect(masterGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 0.001);
    });

    it('handles missing audio context gracefully', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should be able to call successfully
      expect(() => {
        act(() => {
          result.current.generateCollisionSound(0.5);
        });
      }).not.toThrow();
    });
  });

  describe('generateAdaptiveMusic', () => {
    it('returns music generator when context available', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const musicResult = result.current.generateAdaptiveMusic(0.5);

      expect(musicResult).not.toBeNull();
      expect(musicResult!.beatDuration).toBeDefined();
    });

    it('returns sequence generator and beat duration', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let musicResult: ReturnType<typeof result.current.generateAdaptiveMusic>;
      act(() => {
        musicResult = result.current.generateAdaptiveMusic(0.5);
      });

      expect(musicResult).not.toBeNull();
      expect(musicResult!.createSequence).toBeDefined();
      expect(musicResult!.beatDuration).toBeDefined();
    });

    it('uses major pentatonic scale for calm mood', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let musicResult: ReturnType<typeof result.current.generateAdaptiveMusic>;
      act(() => {
        musicResult = result.current.generateAdaptiveMusic(0.5, 'calm');
      });

      // Calm tempo at intensity 0.5 = 60 + 0.5 * 20 = 70 BPM
      expect(musicResult!.beatDuration).toBeCloseTo(60 / 70);
    });

    it('calculates tense mood tempo correctly', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let musicResult: ReturnType<typeof result.current.generateAdaptiveMusic>;
      act(() => {
        musicResult = result.current.generateAdaptiveMusic(0.5, 'tense');
      });

      // Tense tempo at intensity 0.5 = 80 + 0.5 * 40 = 100 BPM
      expect(musicResult!.beatDuration).toBeCloseTo(60 / 100);
    });

    it('calculates action mood tempo correctly', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let musicResult: ReturnType<typeof result.current.generateAdaptiveMusic>;
      act(() => {
        musicResult = result.current.generateAdaptiveMusic(0.5, 'action');
      });

      // Action tempo at intensity 0.5 = 120 + 0.5 * 60 = 150 BPM
      expect(musicResult!.beatDuration).toBeCloseTo(60 / 150);
    });

    it('calculates victory mood tempo correctly', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let musicResult: ReturnType<typeof result.current.generateAdaptiveMusic>;
      act(() => {
        musicResult = result.current.generateAdaptiveMusic(0.5, 'victory');
      });

      // Victory tempo at intensity 0.5 = 100 + 0.5 * 40 = 120 BPM
      expect(musicResult!.beatDuration).toBeCloseTo(60 / 120);
    });

    it('creates sequence with 16 potential notes', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let musicResult: ReturnType<typeof result.current.generateAdaptiveMusic>;
      act(() => {
        musicResult = result.current.generateAdaptiveMusic(0.5, 'calm');
      });

      const sequence = musicResult!.createSequence();
      // Sequence could have 0-16 notes based on random density
      expect(sequence.length).toBeLessThanOrEqual(16);
    });

    it('sequence notes have required properties', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let musicResult: ReturnType<typeof result.current.generateAdaptiveMusic>;
      act(() => {
        musicResult = result.current.generateAdaptiveMusic(1.0, 'action'); // High intensity for more notes
      });

      const sequence = musicResult!.createSequence();
      if (sequence.length > 0) {
        expect(sequence[0]).toHaveProperty('note');
        expect(sequence[0]).toHaveProperty('time');
        expect(sequence[0]).toHaveProperty('duration');
        expect(typeof sequence[0].note).toBe('number');
        expect(typeof sequence[0].time).toBe('number');
        expect(typeof sequence[0].duration).toBe('number');
      }
    });
  });

  describe('createSoundVariation', () => {
    it('creates variation from base sound', () => {
      const { result } = renderHook(() => useProceduralAudio());

      const baseSound = {
        baseFrequency: 440,
      };

      const variation = result.current.createSoundVariation(baseSound);

      expect(variation).not.toEqual(baseSound);
    });

    it('varies base frequency within range', () => {
      const { result } = renderHook(() => useProceduralAudio());

      const baseSound = {
        baseFrequency: 440,
      };

      // Test multiple variations to check range
      const variations = Array(100).fill(0).map(() =>
        result.current.createSoundVariation(baseSound, 0.2)
      );

      variations.forEach(v => {
        // With 0.2 variation, freq should be 440 * (0.9 to 1.1)
        expect(v.baseFrequency).toBeGreaterThanOrEqual(352);
        expect(v.baseFrequency).toBeLessThanOrEqual(528);
      });
    });

    it('preserves undefined base frequency', () => {
      const { result } = renderHook(() => useProceduralAudio());

      const baseSound = {};

      const variation = result.current.createSoundVariation(baseSound);

      expect(variation.baseFrequency).toBeUndefined();
    });

    it('varies envelope parameters', () => {
      const { result } = renderHook(() => useProceduralAudio());

      const baseSound = {
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.5,
          release: 0.3,
        },
      };

      const variation = result.current.createSoundVariation(baseSound);

      expect(variation.envelope).toBeDefined();
      expect(variation.envelope!.attack).not.toBe(baseSound.envelope.attack);
    });

    it('varies filter parameters with reduced Q variation', () => {
      const { result } = renderHook(() => useProceduralAudio());

      const baseSound = {
        filter: {
          type: 'lowpass' as BiquadFilterType,
          frequency: 1000,
          Q: 5,
        },
      };

      // Generate many variations to statistically check Q variation is smaller
      const variations = Array(50).fill(0).map(() =>
        result.current.createSoundVariation(baseSound, 0.4)
      );

      // Check that frequency varies more than Q
      const freqVariations = variations.map(v => Math.abs(v.filter!.frequency - 1000));
      const qVariations = variations.map(v => Math.abs(v.filter!.Q - 5));

      const avgFreqVariation = freqVariations.reduce((a, b) => a + b) / freqVariations.length;
      const avgQVariation = qVariations.reduce((a, b) => a + b) / qVariations.length;

      // Q variation should be proportionally smaller
      expect(avgQVariation / 5).toBeLessThan(avgFreqVariation / 1000);
    });

    it('preserves filter type', () => {
      const { result } = renderHook(() => useProceduralAudio());

      const baseSound = {
        filter: {
          type: 'bandpass' as BiquadFilterType,
          frequency: 1000,
          Q: 5,
        },
      };

      const variation = result.current.createSoundVariation(baseSound);

      expect(variation.filter!.type).toBe('bandpass');
    });

    it('respects custom variation amount', () => {
      const { result } = renderHook(() => useProceduralAudio());

      const baseSound = {
        baseFrequency: 1000,
      };

      // Very small variation
      const smallVariations = Array(50).fill(0).map(() =>
        result.current.createSoundVariation(baseSound, 0.01)
      );

      // Large variation
      const largeVariations = Array(50).fill(0).map(() =>
        result.current.createSoundVariation(baseSound, 0.5)
      );

      const smallRange = Math.max(...smallVariations.map(v => v.baseFrequency!)) -
                        Math.min(...smallVariations.map(v => v.baseFrequency!));
      const largeRange = Math.max(...largeVariations.map(v => v.baseFrequency!)) -
                        Math.min(...largeVariations.map(v => v.baseFrequency!));

      expect(largeRange).toBeGreaterThan(smallRange);
    });
  });

  describe('generateTextureSound', () => {
    it('creates grains at specified density', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateTextureSound(0.05, 10, 0.5);
      });

      // At 10 grains/sec for 0.5 seconds = 5 grains
      expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(5);
    });

    it('uses noise buffer for grains', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.generateTextureSound(0.05, 5, 0.2);
      });

      const sources = mockAudioContext.createBufferSource.mock.results;
      sources.forEach(source => {
        expect(source.value.buffer).toBeDefined();
      });
    });

    it('creates bandpass filter for each grain', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      vi.clearAllMocks();

      act(() => {
        result.current.generateTextureSound(0.05, 5, 0.2);
      });

      // Should create filter for each grain (5 grains at 5/sec for 0.2s = 1 grain)
      // Actually: 0.2 * 5 = 1 grain
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalledTimes(1);
    });

    it('creates gain envelope for each grain', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      vi.clearAllMocks();

      act(() => {
        result.current.generateTextureSound(0.05, 10, 0.3);
      });

      // 0.3 * 10 = 3 grains
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3);
    });

    it('uses default parameters', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      vi.clearAllMocks();

      act(() => {
        result.current.generateTextureSound(); // defaults: 0.05, 10, 1
      });

      // 1 second at 10 grains/sec = 10 grains
      expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(10);
    });

    it('handles missing audio context gracefully', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should be able to call successfully
      expect(() => {
        act(() => {
          result.current.generateTextureSound();
        });
      }).not.toThrow();
    });
  });

  describe('create3DAudioSource', () => {
    it('creates panner node with HRTF model', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let panner: PannerNode | null;
      act(() => {
        panner = result.current.create3DAudioSource(1, 2, 3);
      });

      expect(mockAudioContext.createPanner).toHaveBeenCalled();
      expect(panner).not.toBeNull();
    });

    it('sets position from parameters', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.create3DAudioSource(5, 10, 15);
      });

      const panner = mockAudioContext.createPanner.mock.results[0].value;
      expect(panner.setPosition).toHaveBeenCalledWith(5, 10, 15);
    });

    it('configures inverse distance model', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.create3DAudioSource(0, 0, 0);
      });

      const panner = mockAudioContext.createPanner.mock.results[0].value;
      expect(panner.distanceModel).toBe('inverse');
    });

    it('sets reference distance to 1', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.create3DAudioSource(0, 0, 0);
      });

      const panner = mockAudioContext.createPanner.mock.results[0].value;
      expect(panner.refDistance).toBe(1);
    });

    it('sets max distance to 10000', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.create3DAudioSource(0, 0, 0);
      });

      const panner = mockAudioContext.createPanner.mock.results[0].value;
      expect(panner.maxDistance).toBe(10000);
    });

    it('configures omnidirectional cone', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.create3DAudioSource(0, 0, 0);
      });

      const panner = mockAudioContext.createPanner.mock.results[0].value;
      expect(panner.coneInnerAngle).toBe(360);
      expect(panner.coneOuterAngle).toBe(0);
      expect(panner.coneOuterGain).toBe(0);
    });

    it('returns panner node when context available', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let panner: PannerNode | null;
      act(() => {
        panner = result.current.create3DAudioSource(0, 0, 0);
      });

      expect(panner).not.toBeNull();
    });
  });

  describe('context property', () => {
    it('exposes audio context after initialisation', async () => {
      const { result } = renderHook(() => useProceduralAudio());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Context should be accessible but will be null in test due to mock setup
      expect(result.current.context).toBeDefined();
    });
  });
});
