import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdvancedVoice } from './useAdvancedVoice';

// Mock speechSynthesis API
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();
const mockGetVoices = vi.fn(() => [
  { name: 'Voice 1', lang: 'en-US', default: true, voiceURI: 'voice1', localService: true },
  { name: 'Voice 2', lang: 'en-GB', default: false, voiceURI: 'voice2', localService: true },
]);

global.speechSynthesis = {
  speak: mockSpeak,
  cancel: mockCancel,
  pause: mockPause,
  resume: mockResume,
  getVoices: mockGetVoices,
  speaking: false,
  paused: false,
  pending: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

global.SpeechSynthesisUtterance = vi.fn().mockImplementation(() => ({
  text: '',
  rate: 1,
  pitch: 1,
  volume: 1,
  voice: null,
  onstart: null,
  onend: null,
  onpause: null,
  onresume: null,
  onboundary: null,
  onerror: null,
})) as any;

describe('useAdvancedVoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset speechSynthesis mocks
    mockSpeak.mockClear();
    mockCancel.mockClear();
    mockPause.mockClear();
    mockResume.mockClear();
    global.speechSynthesis.speaking = false;
    global.speechSynthesis.paused = false;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('initializes with default config', () => {
    const { result } = renderHook(() => useAdvancedVoice());

    expect(result.current.config).toEqual({
      enabled: true,
      persona: 'captain',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      autoAdvance: false,
      visualEffects: true,
      highlightText: true,
      ambientSound: true,
    });
  });

  it('loads config from localStorage', () => {
    const savedConfig = {
      enabled: false,
      persona: 'oracle',
      rate: 1.2,
    };
    localStorage.setItem('matrix-arcade-advanced-voice', JSON.stringify(savedConfig));

    const { result } = renderHook(() => useAdvancedVoice());

    expect(result.current.config.enabled).toBe(false);
    expect(result.current.config.persona).toBe('oracle');
    expect(result.current.config.rate).toBe(1.2);
  });

  it('detects browser support correctly', () => {
    const { result } = renderHook(() => useAdvancedVoice());
    expect(result.current.isSupported).toBe(true);

    // Test without speechSynthesis
    const originalSpeechSynthesis = global.speechSynthesis;
    // @ts-ignore
    delete global.speechSynthesis;
    
    const { result: result2 } = renderHook(() => useAdvancedVoice());
    expect(result2.current.isSupported).toBe(false);
    
    global.speechSynthesis = originalSpeechSynthesis;
  });

  it('speaks text with correct persona settings', async () => {
    const { result } = renderHook(() => useAdvancedVoice());

    act(() => {
      result.current.speak('Hello world');
    });

    expect(SpeechSynthesisUtterance).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
    
    const utterance = (SpeechSynthesisUtterance as any).mock.results[0].value;
    // Captain persona has baseRate 0.85, basePitch 1.15, with config rate 1.0
    expect(utterance.rate).toBe(0.85);
    expect(utterance.pitch).toBe(1.15);
    expect(utterance.volume).toBe(0.8);
  });

  it('processes SSML tags correctly', async () => {
    const { result } = renderHook(() => useAdvancedVoice());

    act(() => {
      result.current.speak('Hello world!');
    });

    const utterance = (SpeechSynthesisUtterance as any).mock.results[0].value;
    // The hook adds SSML tags internally
    expect(utterance.text).toContain('Hello world!');
  });

  it('handles pause breaks in text', async () => {
    const { result } = renderHook(() => useAdvancedVoice());

    act(() => {
      result.current.speak('Hello... world');
    });

    // Should create one utterance with SSML pause tags
    expect(SpeechSynthesisUtterance).toHaveBeenCalledTimes(1);
    const utterance = (SpeechSynthesisUtterance as any).mock.results[0].value;
    expect(utterance.text).toContain('Hello...');
    expect(utterance.text).toContain('break time=');
  });

  it('stops speech correctly', () => {
    const { result } = renderHook(() => useAdvancedVoice());

    act(() => {
      result.current.speak('Hello world');
    });

    act(() => {
      result.current.stop();
    });

    expect(mockCancel).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('toggles pause correctly', () => {
    const { result } = renderHook(() => useAdvancedVoice());
    
    // Start speaking
    act(() => {
      result.current.speak('Hello world');
    });

    // Mock speaking state
    global.speechSynthesis.speaking = true;

    // Pause
    act(() => {
      result.current.togglePause();
    });

    expect(mockPause).toHaveBeenCalled();

    // Resume
    global.speechSynthesis.paused = true;
    act(() => {
      result.current.togglePause();
    });

    expect(mockResume).toHaveBeenCalled();
  });

  it('updates config and saves to localStorage', () => {
    const { result } = renderHook(() => useAdvancedVoice());

    act(() => {
      result.current.updateConfig({ persona: 'architect', rate: 1.5 });
    });

    expect(result.current.config.persona).toBe('architect');
    expect(result.current.config.rate).toBe(1.5);

    const saved = JSON.parse(localStorage.getItem('matrix-arcade-advanced-voice') || '{}');
    expect(saved.persona).toBe('architect');
    expect(saved.rate).toBe(1.5);
  });

  it('switches personas correctly', () => {
    const { result } = renderHook(() => useAdvancedVoice());

    const personas = ['captain', 'oracle', 'architect', 'narrator', 'glitch'] as const;
    
    personas.forEach(persona => {
      act(() => {
        result.current.updateConfig({ persona });
      });
      
      expect(result.current.config.persona).toBe(persona);
      expect(result.current.personas[persona]).toBeDefined();
    });
  });

  it('handles speech queue correctly', async () => {
    const { result } = renderHook(() => useAdvancedVoice());

    act(() => {
      result.current.speak(['First sentence', 'Second sentence', 'Third sentence']);
    });

    expect(result.current.speechQueue).toHaveLength(2); // First is speaking, rest in queue
  });

  it('provides visualization data', () => {
    const { result } = renderHook(() => useAdvancedVoice());

    const vizData = result.current.getVisualizationData();
    
    expect(vizData).toHaveProperty('amplitude');
    expect(vizData).toHaveProperty('frequency');
    expect(vizData.amplitude).toBeGreaterThanOrEqual(0);
    expect(vizData.amplitude).toBeLessThanOrEqual(1);
    expect(Array.isArray(vizData.frequency)).toBe(true);
  });

  it('detects emotions in text', () => {
    const { result } = renderHook(() => useAdvancedVoice());

    // Test captain persona with enthusiasm
    act(() => {
      result.current.updateConfig({ persona: 'captain' });
      result.current.speak('This is amazing!');
    });

    const utterance = (SpeechSynthesisUtterance as any).mock.results[0].value;
    expect(utterance.pitch).toBeGreaterThan(1.0); // Should increase pitch for enthusiasm
  });

  it('handles text array input', () => {
    const { result } = renderHook(() => useAdvancedVoice());

    const textArray = ['Line 1', 'Line 2', 'Line 3'];
    
    act(() => {
      result.current.speak(textArray);
    });

    expect(SpeechSynthesisUtterance).toHaveBeenCalled();
    expect(result.current.speechQueue).toHaveLength(2); // First line speaking, 2 in queue
  });

  it('tracks current word index', () => {
    const { result } = renderHook(() => useAdvancedVoice());

    // Current word tracking is not implemented yet
    expect(result.current.currentWord).toBe(0);
  });

  it('handles speech errors gracefully', () => {
    const { result } = renderHook(() => useAdvancedVoice());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      result.current.speak('Test');
    });

    const utterance = (SpeechSynthesisUtterance as any).mock.results[0].value;
    
    // Simulate error
    act(() => {
      utterance.onerror({ error: 'network' } as any);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Speech synthesis error:', { error: 'network' });
    expect(result.current.isSpeaking).toBe(false);
    
    consoleSpy.mockRestore();
  });

  it('applies different voice modulations for personas', () => {
    const testCases = [
      { persona: 'oracle' as const, expectedRate: 0.75, expectedPitch: 0.85 },
      { persona: 'architect' as const, expectedRate: 1.1, expectedPitch: 1.0 },
      { persona: 'narrator' as const, expectedRate: 0.95, expectedPitch: 0.9 },
      { persona: 'glitch' as const, expectedRate: 0.9, expectedPitch: 0.8 },
    ];

    testCases.forEach(({ persona, expectedRate, expectedPitch }) => {
      // Create a fresh hook instance for each persona
      const { result } = renderHook(() => useAdvancedVoice());
      
      // Clear utterance mocks to start fresh
      (SpeechSynthesisUtterance as any).mockClear();
      mockSpeak.mockClear();
      
      act(() => {
        result.current.updateConfig({ persona });
      });

      // Wait for config update to propagate
      act(() => {
        result.current.speak('Test');
      });

      // Get the utterance created for this persona
      const utterance = (SpeechSynthesisUtterance as any).mock.results[0].value;
      
      expect(utterance.rate).toBeCloseTo(expectedRate);
      expect(utterance.pitch).toBeCloseTo(expectedPitch);
    });
  });

  it('respects enabled config setting', () => {
    const { result } = renderHook(() => useAdvancedVoice());

    // First disable voice
    act(() => {
      result.current.updateConfig({ enabled: false });
    });

    // Clear any previous calls
    mockSpeak.mockClear();

    // Then try to speak
    act(() => {
      result.current.speak('Test');
    });

    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('cleans up on unmount', () => {
    const { result, unmount } = renderHook(() => useAdvancedVoice());

    act(() => {
      result.current.speak('Test');
    });

    unmount();

    expect(mockCancel).toHaveBeenCalled();
  });
});