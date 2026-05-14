import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { IpodBootOverlay } from './IpodBootOverlay';

describe('IpodBootOverlay', () => {
  let rafCallback: ((ts: number) => void) | null = null;
  let rafId = 1;
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rafCallback = null;
    rafId = 1;
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return rafId++;
    });
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  // Only restore the two local spies; `vi.restoreAllMocks()` would also wipe
  // the global `window.matchMedia` vi.fn() set up in `src/test/setup.ts`,
  // stripping its `.mockImplementation(...)` and leaving the next test with
  // a mock that returns `undefined` — which the reduced-motion guard then
  // trips on as `Cannot read properties of undefined (reading 'matches')`.
  afterEach(() => {
    cleanup();
    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  it('renders overlay with testid + aria-hidden (hook for GamePortal mount/unmount gate)', () => {
    render(<IpodBootOverlay title="Snake Classic" />);
    const overlay = screen.getByTestId('ipod-boot-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the game title inside the overlay', () => {
    render(<IpodBootOverlay title="Vortex Pong" />);
    expect(screen.getByTestId('ipod-boot-overlay')).toHaveTextContent('Vortex Pong');
  });

  it('renders the INITIALISING MATRIX status label', () => {
    render(<IpodBootOverlay title="Any Game" />);
    expect(screen.getByTestId('ipod-boot-overlay')).toHaveTextContent(/INITIALISING MATRIX/);
  });

  it('mounts a canvas layer for the procedural launcher sequence', () => {
    const { container } = render(<IpodBootOverlay title="Any Game" />);
    const canvas = container.querySelector('canvas.ipod-boot-canvas');
    expect(canvas).toBeTruthy();
    // Canvas is redundant in the a11y tree — the overlay itself is aria-hidden.
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  });

  it('starts the rAF loop on mount so the glyph sweep can render', () => {
    render(<IpodBootOverlay title="Any Game" />);
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('cancels the rAF loop on unmount so rapid re-entry does not leak frames', () => {
    const { unmount } = render(<IpodBootOverlay title="Any Game" />);
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('keeps requesting frames while the 450 ms sequence runs', () => {
    render(<IpodBootOverlay title="Any Game" />);
    const initial = (window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length;
    if (rafCallback) rafCallback(0);
    expect((window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length)
      .toBeGreaterThan(initial);
  });

  it('stops requesting frames after the 450 ms sequence total elapses', () => {
    // Pin `performance.now()` to 0 at mount so we can drive the frame loop
    // with an absolute timestamp (500 ms > 450 ms TOTAL_MS) that's reliably
    // past the end of the sequence. Without this, the real wall-clock value
    // captured at mount time would make `now - start` negative for a small
    // rAF `now`, and the stop-cap would never trip.
    const perfSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    render(<IpodBootOverlay title="Any Game" />);
    const before = (window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length;
    if (rafCallback) rafCallback(500);
    expect((window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length)
      .toBe(before);
    perfSpy.mockRestore();
  });

  it('skips the rAF loop entirely under prefers-reduced-motion', () => {
    // Override the global matchMedia mock for this test only.
    const mql = {
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    const mmSpy = vi.spyOn(window, 'matchMedia').mockReturnValue(
      mql as unknown as MediaQueryList,
    );
    render(<IpodBootOverlay title="Any Game" />);
    // The overlay still mounts (CSS provides the solid black fade) but the
    // animated launcher is suppressed so motion-sensitive users get a
    // plain 100 ms fade instead.
    expect(screen.getByTestId('ipod-boot-overlay')).toBeInTheDocument();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    mmSpy.mockRestore();
  });
});
