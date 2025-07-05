import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMobileDetection } from './useMobileDetection';

describe('useMobileDetection', () => {
  const originalUserAgent = navigator.userAgent;
  const originalMaxTouchPoints = navigator.maxTouchPoints;
  const originalOntouchstart = window.ontouchstart;

  beforeEach(() => {
    // Reset to default desktop state
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      configurable: true,
    });
    // Remove touch support
    delete (window as any).ontouchstart;
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: originalMaxTouchPoints,
      configurable: true,
    });
    // Restore ontouchstart if it existed
    if (originalOntouchstart !== undefined) {
      (window as any).ontouchstart = originalOntouchstart;
    } else {
      delete (window as any).ontouchstart;
    }
  });

  it('detects desktop correctly', () => {
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTouchDevice).toBe(false);
  });

  it('detects iPhone correctly', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isTouchDevice).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects iPad correctly', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isTouchDevice).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects Android phone correctly', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.93 Mobile Safari/537.36',
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isTouchDevice).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects Android tablet correctly', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10; SM-T860) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.93 Safari/537.36',
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isTouchDevice).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects touch support via maxTouchPoints', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 10,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isTouchDevice).toBe(true);
  });

  it('detects touch support via ontouchstart', () => {
    // @ts-ignore
    window.ontouchstart = () => {};

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isTouchDevice).toBe(true);

    // Clean up
    // @ts-ignore
    delete window.ontouchstart;
  });

  it('detects Windows Phone correctly', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; Microsoft; Lumia 950) AppleWebKit/537.36',
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects BlackBerry correctly', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+',
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects webOS correctly', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (webOS/1.3; U; en-US) AppleWebKit/525.27.1',
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('handles edge case with iPad Pro user agent', () => {
    // iPad Pro sometimes reports as desktop Safari
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15',
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    // Should detect as touch device due to maxTouchPoints
    expect(result.current.isTouchDevice).toBe(true);
    // But still classified as desktop due to user agent
    expect(result.current.isDesktop).toBe(true);
  });

  it('handles null/undefined navigator properties gracefully', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTouchDevice).toBe(false);
  });

  it('detects Kindle Fire correctly', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; U; Android 2.3.4; en-us; Kindle Fire) AppleWebKit/533.1',
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects Chrome on mobile correctly', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 9; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Mobile Safari/537.36',
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('returns consistent values across re-renders', () => {
    const { result, rerender } = renderHook(() => useMobileDetection());

    const firstResult = { ...result.current };
    
    rerender();
    
    expect(result.current).toEqual(firstResult);
  });
});