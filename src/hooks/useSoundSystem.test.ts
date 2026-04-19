import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoundSystem } from './useSoundSystem';

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
  },
  Q: {
    value: 1,
    setValueAtTime: vi.fn(),
  },
};

const mockConvolver = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  buffer: null as AudioBuffer | null,
};

const mockAudioContext = {
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGainNode),
  createBiquadFilter: vi.fn(() => mockFilter),
  createConvolver: vi.fn(() => mockConvolver),
  createBuffer: vi.fn((channels, length, sampleRate) => ({
    length,
    sampleRate,
    numberOfChannels: channels,
    getChannelData: vi.fn(() => new Float32Array(length)),
  })),
  currentTime: 0,
  destination: {},
  state: 'running' as AudioContextState,
  close: vi.fn(),
  resume: vi.fn(() => Promise.resolve()),
  suspend: vi.fn(() => Promise.resolve()),
  sampleRate: 48000,
};

(global as unknown as Record<string, unknown>).AudioContext = vi.fn(() => mockAudioContext);

describe('useSoundSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAudioContext.state = 'running';
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('initializes with default config', () => {
    const { result } = renderHook(() => useSoundSystem());

    expect(result.current.config).toEqual({
      music: true,
      sfx: true,
      masterVolume: 0.7,
      musicVolume: 0.4,
      sfxVolume: 0.25,
    });
  });

  it('loads config from localStorage', () => {
    const savedConfig = {
      music: false,
      sfx: true,
      masterVolume: 0.5,
      musicVolume: 0.3,
      sfxVolume: 0.8,
    };
    localStorage.setItem('matrix-arcade-audio-config', JSON.stringify(savedConfig));

    const { result } = renderHook(() => useSoundSystem());

    expect(result.current.config).toEqual(savedConfig);
  });

  it('plays sound effects when enabled', async () => {
    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playSFX('jump');
    });

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
    expect(mockOscillator.stop).toHaveBeenCalled();
  });

  it('does not play sound effects when sfx is disabled', async () => {
    const { result } = renderHook(() => useSoundSystem());

    act(() => {
      result.current.updateConfig({ sfx: false });
    });

    await act(async () => {
      await result.current.playSFX('jump');
    });

    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('applies correct sound effect parameters', async () => {
    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playSFX('powerup');
    });

    expect(mockOscillator.type).toBe('triangle');
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(659, 0);
    expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(900, 0.3);
  });

  it('plays background music when enabled', async () => {
    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playMusic('menu');
    });

    // Should create oscillators for music notes
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it('stops music correctly', async () => {
    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playMusic('menu');
    });

    act(() => {
      result.current.stopMusic();
    });

    // Should stop the music source
    expect(mockOscillator.stop).toHaveBeenCalled();
  });

  it('toggles mute state correctly', () => {
    const { result } = renderHook(() => useSoundSystem());

    expect(result.current.isMuted).toBe(false);

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isMuted).toBe(true);
    expect(result.current.config.music).toBe(false);
    expect(result.current.config.sfx).toBe(false);

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isMuted).toBe(false);
    expect(result.current.config.music).toBe(true);
    expect(result.current.config.sfx).toBe(true);
  });

  // R83.G1 — mute/unmute round-trip regression cover. Before the fix, the
  // second toggleMute() left BGM paused and SFX inaudible because stopMusic()
  // had rewound HTMLAudio and no path resumed it. Guards against re-breaking.
  it('plays SFX again after mute -> unmute cycle', async () => {
    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playSFX('jump');
    });
    expect(mockOscillator.start).toHaveBeenCalled();

    act(() => {
      result.current.toggleMute();
    });
    expect(result.current.isMuted).toBe(true);

    vi.clearAllMocks();

    act(() => {
      result.current.toggleMute();
    });
    expect(result.current.isMuted).toBe(false);

    await act(async () => {
      await result.current.playSFX('jump');
    });
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('silences masterGain on mute and restores it on unmute', async () => {
    const { result } = renderHook(() => useSoundSystem());

    // Initialise audio graph so masterGainRef is populated.
    await act(async () => {
      await result.current.playSFX('menu');
    });

    vi.clearAllMocks();

    act(() => {
      result.current.toggleMute();
    });
    // At least one setValueAtTime(0, ...) call on a gain — masterGain ramps to 0.
    const muteCalls = mockGainNode.gain.setValueAtTime.mock.calls;
    expect(muteCalls.some(([v]) => v === 0)).toBe(true);

    vi.clearAllMocks();

    act(() => {
      result.current.toggleMute();
    });
    // Restoration must push masterVolume (default 0.7) back onto the gain node.
    const unmuteCalls = mockGainNode.gain.setValueAtTime.mock.calls;
    expect(unmuteCalls.some(([v]) => v === 0.7)).toBe(true);
  });

  it('keeps BGM resumable through mute -> unmute cycle', async () => {
    // Mock HTMLAudioElement — track pause/play/muted transitions so we can
    // assert the round-trip leaves the element audible again.
    type MockAudio = {
      src: string;
      paused: boolean;
      muted: boolean;
      volume: number;
      loop: boolean;
      currentTime: number;
      play: ReturnType<typeof vi.fn>;
      pause: ReturnType<typeof vi.fn>;
    };
    const mockAudio: MockAudio = {
      src: '',
      paused: true,
      muted: false,
      volume: 0,
      loop: false,
      currentTime: 0,
      play: vi.fn(),
      pause: vi.fn(),
    };
    mockAudio.play.mockImplementation(() => {
      mockAudio.paused = false;
      return Promise.resolve();
    });
    mockAudio.pause.mockImplementation(() => {
      mockAudio.paused = true;
    });
    const originalAudio = (global as unknown as Record<string, unknown>).Audio;
    (global as unknown as Record<string, unknown>).Audio = vi.fn(() => mockAudio);

    try {
      const { result } = renderHook(() => useSoundSystem());

      act(() => {
        result.current.playBackgroundMP3('/audio/track.mp3');
      });
      expect(mockAudio.play).toHaveBeenCalled();
      expect(mockAudio.paused).toBe(false);

      // Mute: BGM must go silent but stay resumable (muted=true, not paused
      // with currentTime=0 as the pre-fix code did).
      act(() => {
        result.current.toggleMute();
      });
      expect(result.current.isMuted).toBe(true);

      // Unmute: BGM must be audible again. Either it stayed playing with
      // muted flipped back to false, OR toggleMute called play() to resume.
      act(() => {
        result.current.toggleMute();
      });
      expect(result.current.isMuted).toBe(false);
      expect(mockAudio.muted).toBe(false);
      expect(mockAudio.paused).toBe(false);
    } finally {
      (global as unknown as Record<string, unknown>).Audio = originalAudio;
    }
  });

  it('resumes a suspended audio context on unmute', async () => {
    const { result } = renderHook(() => useSoundSystem());

    // Initialise audio context with a real (mocked) sound.
    await act(async () => {
      await result.current.playSFX('jump');
    });

    act(() => {
      result.current.toggleMute();
    });

    // Simulate the browser suspending the context while muted (tab blur,
    // autoplay policy, etc.) — this is the exact scenario Tom reported.
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockClear();

    act(() => {
      result.current.toggleMute();
    });

    expect(mockAudioContext.resume).toHaveBeenCalled();

    mockAudioContext.state = 'running';
  });

  it('updates config and saves to localStorage', () => {
    const { result } = renderHook(() => useSoundSystem());

    act(() => {
      result.current.updateConfig({ masterVolume: 0.5, musicVolume: 0.3 });
    });

    expect(result.current.config.masterVolume).toBe(0.5);
    expect(result.current.config.musicVolume).toBe(0.3);

    const saved = JSON.parse(localStorage.getItem('matrix-arcade-audio-config') || '{}');
    expect(saved.masterVolume).toBe(0.5);
    expect(saved.musicVolume).toBe(0.3);
  });

  it('updates gain nodes when volumes change', async () => {
    const { result } = renderHook(() => useSoundSystem());

    // Initialize audio context
    await act(async () => {
      await result.current.playSFX('menu');
    });

    vi.clearAllMocks();

    act(() => {
      result.current.updateConfig({ masterVolume: 0.8 });
    });

    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.8, 0);
  });

  it('handles custom sound effect config', async () => {
    const { result } = renderHook(() => useSoundSystem());

    const customConfig = {
      frequency: { start: 1000, end: 2000 },
      duration: 0.5,
    };

    await act(async () => {
      await result.current.playSFX('jump', customConfig);
    });

    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(1000, 0);
    expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(2000, 0.5);
  });

  it('applies filters when specified', async () => {
    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playSFX('jump');
    });

    expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    expect(mockFilter.type).toBe('lowpass');
    expect(mockFilter.frequency.setValueAtTime).toHaveBeenCalledWith(800, 0);
  });

  it('adds reverb effect when specified', async () => {
    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playSFX('powerup');
    });

    expect(mockAudioContext.createConvolver).toHaveBeenCalled();
    expect(mockConvolver.connect).toHaveBeenCalled();
  });

  it('handles audio context suspended state', async () => {
    const { result } = renderHook(() => useSoundSystem());
    
    // Initialize context first
    await act(async () => {
      await result.current.playSFX('jump');
    });
    
    // Now set it to suspended and clear the resume mock
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockClear();

    // Try to play another sound - should resume
    await act(async () => {
      await result.current.playSFX('menu');
    });

    expect(mockAudioContext.resume).toHaveBeenCalled();
    
    // Reset state
    mockAudioContext.state = 'running';
  });

  it('handles audio context errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
(global as unknown as Record<string, unknown>).AudioContext = vi.fn(() => {
      throw new Error('Audio not supported');
    });

    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playSFX('jump');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize audio context:', expect.any(Error));

    // Restore
    (global as unknown as Record<string, unknown>).AudioContext = vi.fn(() => mockAudioContext);
    consoleSpy.mockRestore();
  });

  it('loops background music correctly', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSoundSystem());

    // Clear any previous calls
    mockAudioContext.createOscillator.mockClear();

    await act(async () => {
      await result.current.playMusic('menu');
    });

    // Should have created oscillators for first play
    const firstLoopCalls = mockAudioContext.createOscillator.mock.calls.length;
    expect(firstLoopCalls).toBeGreaterThan(0);

    // Fast forward to trigger loop (need to calculate actual loop duration)
    // Menu has 7 notes with rhythm [0.5, 0.25, 0.5, 0.25, 0.5, 0.25, 1.0] at tempo 120
    // Total beats = 3.25, at 120 BPM = 1.625 seconds
    act(() => {
      vi.advanceTimersByTime(2000); // Advance past first loop
    });

    // Should create more oscillators for next loop
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(firstLoopCalls * 2);
    
    vi.useRealTimers();
  });

  it('handles unknown sound effect', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playSFX('unknownSound');
    });

    expect(consoleSpy).toHaveBeenCalledWith("Sound effect 'unknownSound' not found in library");
    
    consoleSpy.mockRestore();
  });

  it('cleans up audio context on unmount', async () => {
    const { result, unmount } = renderHook(() => useSoundSystem());

    // Initialize the audio context first
    await act(async () => {
      await result.current.playSFX('jump');
    });

    unmount();

    expect(mockAudioContext.close).toHaveBeenCalled();
  });

  it('provides sound library and music sequences', () => {
    const { result } = renderHook(() => useSoundSystem());

    expect(result.current.soundLibrary).toContain('jump');
    expect(result.current.soundLibrary).toContain('powerup');
    expect(result.current.soundLibrary).toContain('gameOver');

    expect(result.current.musicSequences).toContain('menu');
    expect(result.current.musicSequences).toContain('gameplay');
    expect(result.current.musicSequences).toContain('intense');
  });

  // R83.CTRLS.10: chapter-cut whoosh is mapped to an MP3 but must also have a
  // procedural synth fallback — without it, the cold-start window (before
  // preloadAudioFiles finishes) warned "Sound effect 'ctrlsTransition' not
  // found in library" on every JACK IN and chapter-complete transition.
  it('includes ctrlsTransition synth fallback for the cold-start window', () => {
    const { result } = renderHook(() => useSoundSystem());
    expect(result.current.soundLibrary).toContain('ctrlsTransition');
  });

  // R83.CTRLS.10: plays cleanly without warning even if the AudioBuffer cache
  // is empty (simulating the race between scene start and preload completion).
  it('plays ctrlsTransition via synth without warnings when the buffer cache is cold', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playSFX('ctrlsTransition');
    });

    expect(
      warnSpy.mock.calls.some(
        ([msg]) => typeof msg === 'string' && msg.includes("'ctrlsTransition'") && msg.includes('not found')
      )
    ).toBe(false);
    expect(mockOscillator.start).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('handles closed audio context gracefully', async () => {
    const { result } = renderHook(() => useSoundSystem());
    
    mockAudioContext.state = 'closed';

    await act(async () => {
      await result.current.playSFX('jump');
    });

    // Should not throw error
    expect(mockOscillator.start).not.toHaveBeenCalled();
  });

  it('creates reverb buffer correctly', async () => {
    const { result } = renderHook(() => useSoundSystem());

    await act(async () => {
      await result.current.playSFX('powerup');
    });

    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(2, expect.any(Number), mockAudioContext.sampleRate);
  });
});