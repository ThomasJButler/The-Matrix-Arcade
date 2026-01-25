import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShatnerVoice } from './useShatnerVoice';

// Mock speechSynthesis API
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockGetVoices = vi.fn(() => [
  { name: 'Alex', lang: 'en-US', default: true, voiceURI: 'alex', localService: true },
  { name: 'Microsoft David Desktop', lang: 'en-US', default: false, voiceURI: 'david', localService: true },
  { name: 'Voice Female', lang: 'en-GB', default: false, voiceURI: 'female', localService: true },
  { name: 'Daniel', lang: 'en-AU', default: false, voiceURI: 'daniel', localService: true },
]);

global.speechSynthesis = {
  speak: mockSpeak,
  cancel: mockCancel,
  getVoices: mockGetVoices,
  speaking: false,
  paused: false,
  pending: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  onvoiceschanged: null,
} as unknown as SpeechSynthesis;

// Create mock utterances with proper event handling
const createMockUtterance = () => ({
  text: '',
  rate: 1,
  pitch: 1,
  volume: 1,
  voice: null,
  lang: '',
  onstart: null as ((ev: SpeechSynthesisEvent) => void) | null,
  onend: null as ((ev: SpeechSynthesisEvent) => void) | null,
  onpause: null as ((ev: SpeechSynthesisEvent) => void) | null,
  onresume: null as ((ev: SpeechSynthesisEvent) => void) | null,
  onboundary: null as ((ev: SpeechSynthesisEvent) => void) | null,
  onerror: null as ((ev: SpeechSynthesisErrorEvent) => void) | null,
  onmark: null as ((ev: SpeechSynthesisEvent) => void) | null,
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

let mockUtteranceInstances: ReturnType<typeof createMockUtterance>[] = [];

global.SpeechSynthesisUtterance = vi.fn().mockImplementation(() => {
  const utterance = createMockUtterance();
  mockUtteranceInstances.push(utterance);
  return utterance;
}) as unknown as typeof SpeechSynthesisUtterance;

describe('useShatnerVoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    mockUtteranceInstances = [];
    mockSpeak.mockClear();
    mockCancel.mockClear();
    global.speechSynthesis.speaking = false;
    global.speechSynthesis.paused = false;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initialisation', () => {
    it('initialises with default config', () => {
      const { result } = renderHook(() => useShatnerVoice());

      expect(result.current.config).toEqual({
        enabled: true,
        rate: 1.00,
        pitch: 1.20,
        volume: 0.60,
        pauseMultiplier: 3.0,
        emphasisBoost: 1.5
      });
    });

    it('loads config from localStorage', () => {
      const savedConfig = {
        enabled: false,
        rate: 0.8,
        pitch: 1.5,
        volume: 0.9,
        pauseMultiplier: 2.0,
        emphasisBoost: 2.0
      };
      localStorage.setItem('matrix-arcade-shatner-voice', JSON.stringify(savedConfig));

      const { result } = renderHook(() => useShatnerVoice());

      expect(result.current.config).toEqual(savedConfig);
    });

    it('merges partial localStorage config with defaults', () => {
      const partialConfig = { rate: 0.5 };
      localStorage.setItem('matrix-arcade-shatner-voice', JSON.stringify(partialConfig));

      const { result } = renderHook(() => useShatnerVoice());

      expect(result.current.config.rate).toBe(0.5);
      expect(result.current.config.enabled).toBe(true); // Default value
      expect(result.current.config.pitch).toBe(1.20); // Default value
    });

    it('detects browser support correctly', () => {
      const { result } = renderHook(() => useShatnerVoice());
      expect(result.current.isSupported).toBe(true);
    });

    it('detects lack of browser support', () => {
      const originalSpeechSynthesis = global.speechSynthesis;
      // @ts-expect-error - Intentionally testing without speechSynthesis
      delete global.speechSynthesis;

      const { result } = renderHook(() => useShatnerVoice());
      expect(result.current.isSupported).toBe(false);

      global.speechSynthesis = originalSpeechSynthesis;
    });

    it('starts with isSpeaking false', () => {
      const { result } = renderHook(() => useShatnerVoice());
      expect(result.current.isSpeaking).toBe(false);
    });

    it('starts with empty speech queue', () => {
      const { result } = renderHook(() => useShatnerVoice());
      expect(result.current.speechQueue).toEqual([]);
    });
  });

  describe('Config Management', () => {
    it('saves config to localStorage on change', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.updateConfig({ rate: 0.75 });
      });

      const saved = JSON.parse(localStorage.getItem('matrix-arcade-shatner-voice') || '{}');
      expect(saved.rate).toBe(0.75);
    });

    it('updates individual config properties', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.updateConfig({ pitch: 1.8 });
      });

      expect(result.current.config.pitch).toBe(1.8);
      expect(result.current.config.rate).toBe(1.00); // Unchanged
    });

    it('updates multiple config properties at once', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.updateConfig({
          rate: 0.5,
          volume: 0.3,
          pauseMultiplier: 5.0
        });
      });

      expect(result.current.config.rate).toBe(0.5);
      expect(result.current.config.volume).toBe(0.3);
      expect(result.current.config.pauseMultiplier).toBe(5.0);
    });

    it('toggles enabled state', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.updateConfig({ enabled: false });
      });

      expect(result.current.config.enabled).toBe(false);

      act(() => {
        result.current.updateConfig({ enabled: true });
      });

      expect(result.current.config.enabled).toBe(true);
    });
  });

  describe('processShatnerText', () => {
    it('adds pauses after dramatic phrases', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('The Production Bug from Hell');
      // Note: Words get emphasis markers added (*word*), so check for the phrase with added ellipsis
      // The phrase is matched and "..." is added after it
      expect(processed).toContain('...');
      expect(processed).toContain('Hell');
    });

    it('adds pauses after pause words', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('However the code works');
      expect(processed).toContain('However...');
    });

    it('adds emphasis markers to dramatic words', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('the matrix is real');
      expect(processed).toContain('*the*');
      expect(processed).toContain('*matrix*');
    });

    it('adds pauses at sentence breaks', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('First sentence. Second sentence.');
      expect(processed).toContain('.... ');
    });

    it('adds pauses after commas', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('One, two, three');
      expect(processed).toContain(',... ');
    });

    it('adds dramatic breaks around conjunctions', () => {
      const { result } = renderHook(() => useShatnerVoice());

      // Use text where the words around 'and' aren't emphasis words
      const processed = result.current.processShatnerText('cat and dog');
      expect(processed).toContain('... and...');
    });

    it('adds pauses after modal verbs', () => {
      const { result } = renderHook(() => useShatnerVoice());

      // Use text where the word after 'must' isn't an emphasis word
      const processed = result.current.processShatnerText('You must try');
      expect(processed).toContain('must...');
    });

    it('handles empty text', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('');
      expect(processed).toBe('');
    });

    it('processes coding-specific dramatic phrases', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('A null pointer exception occurred');
      // The phrase "null pointer exception" is matched as a dramatic phrase
      // Individual words also get emphasis markers, so check for the pattern
      expect(processed).toContain('*null*');
      expect(processed).toContain('*pointer*');
      expect(processed).toContain('*exception*');
      expect(processed).toContain('...');
    });

    it('emphasises coding terminology', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('debug the legacy code');
      expect(processed).toContain('*debug*');
      expect(processed).toContain('*legacy*');
      expect(processed).toContain('*code*');
    });
  });

  describe('speak', () => {
    it('calls speechSynthesis.speak with processed text', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Hello world.');
      });

      expect(mockCancel).toHaveBeenCalled();
      expect(SpeechSynthesisUtterance).toHaveBeenCalled();
      expect(mockSpeak).toHaveBeenCalled();
    });

    it('sets isSpeaking to true when speaking starts', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Hello world.');
      });

      expect(result.current.isSpeaking).toBe(true);
    });

    it('splits text into sentences for the speech queue', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('First sentence. Second sentence! Third sentence?');
      });

      expect(result.current.speechQueue).toHaveLength(3);
    });

    it('does not speak when disabled', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.updateConfig({ enabled: false });
      });

      mockSpeak.mockClear();

      act(() => {
        result.current.speak('Hello world.');
      });

      expect(mockSpeak).not.toHaveBeenCalled();
    });

    it('does not speak when not supported', () => {
      const originalSpeechSynthesis = global.speechSynthesis;
      // @ts-expect-error - Intentionally testing without speechSynthesis
      delete global.speechSynthesis;

      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Hello world.');
      });

      expect(result.current.isSpeaking).toBe(false);

      global.speechSynthesis = originalSpeechSynthesis;
    });

    it('does not speak empty text', () => {
      const { result } = renderHook(() => useShatnerVoice());

      mockSpeak.mockClear();

      act(() => {
        result.current.speak('');
      });

      expect(mockSpeak).not.toHaveBeenCalled();
    });

    it('does not speak whitespace-only text', () => {
      const { result } = renderHook(() => useShatnerVoice());

      mockSpeak.mockClear();

      act(() => {
        result.current.speak('   ');
      });

      expect(mockSpeak).not.toHaveBeenCalled();
    });

    it('cancels previous speech before starting new', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('First.');
      });

      mockCancel.mockClear();

      act(() => {
        result.current.speak('Second.');
      });

      expect(mockCancel).toHaveBeenCalled();
    });

    it('applies config rate to utterance', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.updateConfig({ rate: 0.75 });
      });

      act(() => {
        result.current.speak('Test.');
      });

      const utterance = mockUtteranceInstances[mockUtteranceInstances.length - 1];
      expect(utterance.rate).toBe(0.75);
    });

    it('applies config pitch to utterance', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.updateConfig({ pitch: 1.5 });
      });

      act(() => {
        result.current.speak('Test.');
      });

      const utterance = mockUtteranceInstances[mockUtteranceInstances.length - 1];
      expect(utterance.pitch).toBe(1.5);
    });

    it('applies config volume to utterance', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.updateConfig({ volume: 0.9 });
      });

      act(() => {
        result.current.speak('Test.');
      });

      const utterance = mockUtteranceInstances[mockUtteranceInstances.length - 1];
      expect(utterance.volume).toBe(0.9);
    });

    it('removes emphasis markers from spoken text', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('The code has a bug.');
      });

      const utterance = mockUtteranceInstances[mockUtteranceInstances.length - 1];
      expect(utterance.text).not.toContain('*');
    });

    it('proceeds to next sentence after pause on utterance end', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('First sentence. Second sentence.');
      });

      // Simulate first utterance ending
      const firstUtterance = mockUtteranceInstances[0];
      act(() => {
        if (firstUtterance.onend) {
          firstUtterance.onend({} as SpeechSynthesisEvent);
        }
      });

      // Advance timer for pause between sentences
      act(() => {
        vi.advanceTimersByTime(1500); // pauseMultiplier (3.0) * 500
      });

      expect(mockSpeak).toHaveBeenCalledTimes(2);
    });

    it('sets isSpeaking to false when all sentences complete', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Single sentence.');
      });

      expect(result.current.isSpeaking).toBe(true);

      const utterance = mockUtteranceInstances[0];
      act(() => {
        if (utterance.onend) {
          utterance.onend({} as SpeechSynthesisEvent);
        }
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.speechQueue).toEqual([]);
    });

    it('continues to next sentence on error', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('First sentence. Second sentence.');
      });

      const firstUtterance = mockUtteranceInstances[0];
      act(() => {
        if (firstUtterance.onerror) {
          firstUtterance.onerror({} as SpeechSynthesisErrorEvent);
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith('Speech synthesis error, continuing to next sentence');
      consoleSpy.mockRestore();
    });
  });

  describe('Voice Selection', () => {
    it('prefers Alex voice', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Test.');
      });

      const utterance = mockUtteranceInstances[mockUtteranceInstances.length - 1];
      expect(utterance.voice).toEqual(
        expect.objectContaining({ name: 'Alex' })
      );
    });

    it('prefers Microsoft David Desktop voice when Alex unavailable', () => {
      // Override the default mock for this specific test
      const davidVoices = [
        { name: 'Microsoft David Desktop', lang: 'en-US', default: false, voiceURI: 'david', localService: true },
        { name: 'Voice Female', lang: 'en-GB', default: false, voiceURI: 'female', localService: true },
      ];
      mockGetVoices.mockImplementation(() => davidVoices);

      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Test.');
      });

      const utterance = mockUtteranceInstances[mockUtteranceInstances.length - 1];
      expect(utterance.voice).toEqual(
        expect.objectContaining({ name: 'Microsoft David Desktop' })
      );

      // Restore default mock
      mockGetVoices.mockImplementation(() => [
        { name: 'Alex', lang: 'en-US', default: true, voiceURI: 'alex', localService: true },
        { name: 'Microsoft David Desktop', lang: 'en-US', default: false, voiceURI: 'david', localService: true },
        { name: 'Voice Female', lang: 'en-GB', default: false, voiceURI: 'female', localService: true },
        { name: 'Daniel', lang: 'en-AU', default: false, voiceURI: 'daniel', localService: true },
      ]);
    });

    it('falls back to any male English voice', () => {
      const maleVoices = [
        { name: 'Random Male', lang: 'en-US', default: false, voiceURI: 'male', localService: true },
        { name: 'Female Voice', lang: 'en-US', default: false, voiceURI: 'female', localService: true },
      ];
      mockGetVoices.mockImplementation(() => maleVoices);

      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Test.');
      });

      const utterance = mockUtteranceInstances[mockUtteranceInstances.length - 1];
      expect(utterance.voice).toEqual(
        expect.objectContaining({ name: 'Random Male' })
      );

      // Restore default mock
      mockGetVoices.mockImplementation(() => [
        { name: 'Alex', lang: 'en-US', default: true, voiceURI: 'alex', localService: true },
        { name: 'Microsoft David Desktop', lang: 'en-US', default: false, voiceURI: 'david', localService: true },
        { name: 'Voice Female', lang: 'en-GB', default: false, voiceURI: 'female', localService: true },
        { name: 'Daniel', lang: 'en-AU', default: false, voiceURI: 'daniel', localService: true },
      ]);
    });

    it('falls back to any English voice when no male voice found', () => {
      const anyVoices = [
        { name: 'Any English', lang: 'en-AU', default: false, voiceURI: 'any', localService: true },
      ];
      mockGetVoices.mockImplementation(() => anyVoices);

      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Test.');
      });

      const utterance = mockUtteranceInstances[mockUtteranceInstances.length - 1];
      expect(utterance.voice).toEqual(
        expect.objectContaining({ name: 'Any English' })
      );

      // Restore default mock
      mockGetVoices.mockImplementation(() => [
        { name: 'Alex', lang: 'en-US', default: true, voiceURI: 'alex', localService: true },
        { name: 'Microsoft David Desktop', lang: 'en-US', default: false, voiceURI: 'david', localService: true },
        { name: 'Voice Female', lang: 'en-GB', default: false, voiceURI: 'female', localService: true },
        { name: 'Daniel', lang: 'en-AU', default: false, voiceURI: 'daniel', localService: true },
      ]);
    });
  });

  describe('stop', () => {
    it('cancels speechSynthesis', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Hello.');
      });

      act(() => {
        result.current.stop();
      });

      expect(mockCancel).toHaveBeenCalled();
    });

    it('sets isSpeaking to false', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Hello.');
      });

      expect(result.current.isSpeaking).toBe(true);

      act(() => {
        result.current.stop();
      });

      expect(result.current.isSpeaking).toBe(false);
    });

    it('clears the speech queue', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('One. Two. Three.');
      });

      expect(result.current.speechQueue.length).toBeGreaterThan(0);

      act(() => {
        result.current.stop();
      });

      expect(result.current.speechQueue).toEqual([]);
    });

    it('clears any pending timeouts', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('First. Second.');
      });

      // Trigger end of first utterance
      const firstUtterance = mockUtteranceInstances[0];
      act(() => {
        if (firstUtterance.onend) {
          firstUtterance.onend({} as SpeechSynthesisEvent);
        }
      });

      // Stop before timeout fires
      act(() => {
        result.current.stop();
      });

      // Advance timers - should not trigger second speak
      const speakCallsBefore = mockSpeak.mock.calls.length;
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockSpeak.mock.calls.length).toBe(speakCallsBefore);
    });
  });

  describe('testVoice', () => {
    it('speaks a test phrase', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.testVoice();
      });

      expect(mockSpeak).toHaveBeenCalled();
    });

    it('uses dramatic test phrase', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.testVoice();
      });

      const utterance = mockUtteranceInstances[mockUtteranceInstances.length - 1];
      expect(utterance.text).toContain('Production Bug');
    });
  });

  describe('availableVoices', () => {
    it('returns English voices only', () => {
      mockGetVoices.mockReturnValueOnce([
        { name: 'English Voice', lang: 'en-US', default: true, voiceURI: 'en', localService: true },
        { name: 'French Voice', lang: 'fr-FR', default: false, voiceURI: 'fr', localService: true },
        { name: 'British Voice', lang: 'en-GB', default: false, voiceURI: 'gb', localService: true },
      ]);

      const { result } = renderHook(() => useShatnerVoice());

      const voices = result.current.availableVoices;
      expect(voices).toHaveLength(2);
      expect(voices.every((v: SpeechSynthesisVoice) => v.lang.startsWith('en'))).toBe(true);
    });

    it('returns empty array when not supported', () => {
      const originalSpeechSynthesis = global.speechSynthesis;
      // @ts-expect-error - Intentionally testing without speechSynthesis
      delete global.speechSynthesis;

      const { result } = renderHook(() => useShatnerVoice());
      expect(result.current.availableVoices).toEqual([]);

      global.speechSynthesis = originalSpeechSynthesis;
    });
  });

  describe('Cleanup', () => {
    it('stops speech on unmount', () => {
      const { result, unmount } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('Hello world.');
      });

      mockCancel.mockClear();

      unmount();

      expect(mockCancel).toHaveBeenCalled();
    });

    it('clears timeouts on unmount', () => {
      const { result, unmount } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('First. Second.');
      });

      // Trigger end to set up timeout
      const firstUtterance = mockUtteranceInstances[0];
      act(() => {
        if (firstUtterance.onend) {
          firstUtterance.onend({} as SpeechSynthesisEvent);
        }
      });

      unmount();

      // Advance timers - should not cause errors or additional calls
      const speakCallsBefore = mockSpeak.mock.calls.length;
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockSpeak.mock.calls.length).toBe(speakCallsBefore);
    });
  });

  describe('Shatner Speech Patterns', () => {
    it('handles text with exclamation marks', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('This is amazing!');
      expect(processed).toContain('... !');
    });

    it('handles quotation marks', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('He said "hello"');
      expect(processed).toContain('... "');
    });

    it('processes multiple emphasis words', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText('the system has a critical error');
      expect(processed).toContain('*the*');
      expect(processed).toContain('*system*');
      expect(processed).toContain('*critical*');
      expect(processed).toContain('*error*');
    });

    it('handles multiple dramatic phrases in same text', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const processed = result.current.processShatnerText(
        'A null pointer exception caused an infinite loop detected'
      );
      // Both dramatic phrases get processed - words get emphasis markers
      // Check that both phrases contribute their ellipsis patterns
      expect(processed).toContain('*null*');
      expect(processed).toContain('*exception*');
      expect(processed).toContain('*infinite*');
      expect(processed).toContain('*loop*');
      // Should have multiple ellipsis from phrase processing
      const ellipsisCount = (processed.match(/\.\.\./g) || []).length;
      expect(ellipsisCount).toBeGreaterThanOrEqual(2);
    });

    it('handles all pause word types', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const pauseWords = ['but', 'however', 'suddenly', 'unfortunately', 'clearly'];

      pauseWords.forEach(word => {
        const processed = result.current.processShatnerText(`${word} it happened`);
        expect(processed).toContain(`${word}...`);
      });
    });

    it('handles connector words (and, or, but)', () => {
      const { result } = renderHook(() => useShatnerVoice());

      // Test 'and' with simple words around it
      const processed = result.current.processShatnerText('cat and dog');
      expect(processed).toContain('... and...');

      // The 'or' pattern only fires when there's a pattern like 'word or word'
      // Note: the regex replaces \w+ and \w+ or \w+ patterns
      const processed2 = result.current.processShatnerText('live or die');
      expect(processed2).toContain('... or...');
    });

    it('handles modal verbs for dramatic effect', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const modals = ['must', 'will', 'can', 'should', 'could', 'would'];

      modals.forEach(modal => {
        const processed = result.current.processShatnerText(`You ${modal} try`);
        expect(processed).toContain(`${modal}...`);
      });
    });
  });

  describe('Pause Multiplier', () => {
    it('respects pause multiplier for sentence pauses', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.updateConfig({ pauseMultiplier: 2.0 });
      });

      act(() => {
        result.current.speak('First. Second.');
      });

      const firstUtterance = mockUtteranceInstances[0];
      act(() => {
        if (firstUtterance.onend) {
          firstUtterance.onend({} as SpeechSynthesisEvent);
        }
      });

      // Should wait pauseMultiplier * 500ms = 1000ms
      expect(mockSpeak).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(999);
      });

      expect(mockSpeak).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(2);
      });

      expect(mockSpeak).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles very long text', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const longText = 'This is a sentence. '.repeat(50);

      act(() => {
        result.current.speak(longText);
      });

      expect(result.current.isSpeaking).toBe(true);
      expect(result.current.speechQueue.length).toBe(50);
    });

    it('handles text with special characters', () => {
      const { result } = renderHook(() => useShatnerVoice());

      const specialText = 'Error: "null" !== undefined & x > 0';

      act(() => {
        result.current.speak(specialText);
      });

      expect(mockSpeak).toHaveBeenCalled();
    });

    it('handles text with only punctuation', () => {
      const { result } = renderHook(() => useShatnerVoice());

      // Text with only punctuation should result in empty sentences after splitting
      const processed = result.current.processShatnerText('...');
      expect(processed).toBeDefined();
    });

    it('handles rapid speak calls', () => {
      const { result } = renderHook(() => useShatnerVoice());

      act(() => {
        result.current.speak('First.');
        result.current.speak('Second.');
        result.current.speak('Third.');
      });

      // Each speak call cancels the previous
      expect(mockCancel).toHaveBeenCalledTimes(3);
      // Only the last one should be speaking
      expect(result.current.speechQueue).toEqual(['Third.']);
    });
  });

  describe('Function Stability', () => {
    it('maintains stable speak function reference', () => {
      const { result, rerender } = renderHook(() => useShatnerVoice());

      const speakRef1 = result.current.speak;
      rerender();
      const speakRef2 = result.current.speak;

      expect(speakRef1).toBe(speakRef2);
    });

    it('maintains stable stop function reference', () => {
      const { result, rerender } = renderHook(() => useShatnerVoice());

      const stopRef1 = result.current.stop;
      rerender();
      const stopRef2 = result.current.stop;

      expect(stopRef1).toBe(stopRef2);
    });

    it('maintains stable updateConfig function reference', () => {
      const { result, rerender } = renderHook(() => useShatnerVoice());

      const updateRef1 = result.current.updateConfig;
      rerender();
      const updateRef2 = result.current.updateConfig;

      expect(updateRef1).toBe(updateRef2);
    });

    it('maintains stable testVoice function reference', () => {
      const { result, rerender } = renderHook(() => useShatnerVoice());

      const testRef1 = result.current.testVoice;
      rerender();
      const testRef2 = result.current.testVoice;

      expect(testRef1).toBe(testRef2);
    });

    it('maintains stable processShatnerText function reference', () => {
      const { result, rerender } = renderHook(() => useShatnerVoice());

      const processRef1 = result.current.processShatnerText;
      rerender();
      const processRef2 = result.current.processShatnerText;

      expect(processRef1).toBe(processRef2);
    });
  });
});
