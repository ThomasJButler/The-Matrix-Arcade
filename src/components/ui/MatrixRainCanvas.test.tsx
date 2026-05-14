import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// Mutable container hoisted so tests can flip reduced-motion mid-suite without
// re-mocking the module (vi.mock itself is hoisted). Mirrors the AttractMode
// test pattern so the project has a single shared idiom for reduced-motion mocks.
const framerMock = vi.hoisted(() => ({ reducedMotion: false as boolean | null }));

vi.mock('framer-motion', () => ({
  useReducedMotion: () => framerMock.reducedMotion,
}));

import { MatrixRainCanvas } from './MatrixRainCanvas';

describe('MatrixRainCanvas', () => {
  let rafCallback: ((ts: number) => void) | null = null;
  let rafId = 1;

  beforeEach(() => {
    framerMock.reducedMotion = false;
    rafCallback = null;
    rafId = 1;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return rafId++;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    framerMock.reducedMotion = false;
  });

  it('renders a canvas element', () => {
    const { container } = render(<MatrixRainCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('canvas is hidden from accessibility tree', () => {
    const { container } = render(<MatrixRainCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  });

  it('canvas has pointer-events none', () => {
    const { container } = render(<MatrixRainCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.className).toContain('pointer-events-none');
  });

  it('canvas has fixed positioning', () => {
    const { container } = render(<MatrixRainCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.className).toContain('fixed');
    expect(canvas?.className).toContain('inset-0');
  });

  it('applies custom opacity', () => {
    const { container } = render(<MatrixRainCanvas opacity={0.25} />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.style.opacity).toBe('0.25');
  });

  it('applies default opacity of 0.12', () => {
    const { container } = render(<MatrixRainCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.style.opacity).toBe('0.12');
  });

  it('starts animation on mount', () => {
    render(<MatrixRainCanvas />);
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('cancels animation on unmount', () => {
    const { unmount } = render(<MatrixRainCanvas />);
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('sets canvas dimensions to window size', () => {
    const { container } = render(<MatrixRainCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.width).toBe(800);
    expect(canvas?.height).toBe(600);
  });

  it('adds resize listener on mount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<MatrixRainCanvas />);
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('removes resize listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<MatrixRainCanvas />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('continues requesting animation frames', () => {
    render(<MatrixRainCanvas fps={30} />);

    const initialCalls = (window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length;

    // Trigger a frame — should request another
    if (rafCallback) rafCallback(0);
    expect((window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCalls);
  });

  describe('R84.CI-13 — reduced-motion gating', () => {
    it('reports data-reduced-motion="false" by default', () => {
      const { container } = render(<MatrixRainCanvas />);
      const canvas = container.querySelector('canvas');
      // Wiring tripwire: a refactor that drops the data attribute would lose
      // a downstream a11y test surface and the per-caller debugging signal.
      expect(canvas?.getAttribute('data-reduced-motion')).toBe('false');
    });

    it('reports data-reduced-motion="true" when prefers-reduced-motion is set', () => {
      framerMock.reducedMotion = true;
      const { container } = render(<MatrixRainCanvas />);
      const canvas = container.querySelector('canvas');
      expect(canvas?.getAttribute('data-reduced-motion')).toBe('true');
    });

    it('skips requestAnimationFrame loop entirely under reduced motion', () => {
      framerMock.reducedMotion = true;
      render(<MatrixRainCanvas />);
      // Load-bearing a11y contract: zero rAF calls when motion is suppressed.
      // A regression that re-enters the animation loop would silently
      // re-introduce continuous downward scroll for opt-out users.
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });

    it('uses requestAnimationFrame normally when motion allowed', () => {
      framerMock.reducedMotion = false;
      render(<MatrixRainCanvas />);
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('respects respectReducedMotion={false} escape hatch', () => {
      framerMock.reducedMotion = true;
      render(<MatrixRainCanvas respectReducedMotion={false} />);
      // Future caller (e.g. CTRL-S narrative atmospheric scenes) can argue
      // their rain is essential atmosphere, not decorative chrome — pin the
      // opt-out path so the contract stays stable.
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('reflects respectReducedMotion={false} in data attribute', () => {
      framerMock.reducedMotion = true;
      const { container } = render(<MatrixRainCanvas respectReducedMotion={false} />);
      const canvas = container.querySelector('canvas');
      // When the caller has explicitly overridden, the DOM signal must match
      // — debugging a "why is this still moving" report needs the attribute
      // to reflect the *effective* state, not the raw media-query result.
      expect(canvas?.getAttribute('data-reduced-motion')).toBe('false');
    });

    it('still wires resize listener under reduced motion for one-shot repaint', () => {
      framerMock.reducedMotion = true;
      const addSpy = vi.spyOn(window, 'addEventListener');
      render(<MatrixRainCanvas />);
      // The static frame still needs to re-paint on viewport change so the
      // glyph grid stays sized to the canvas — pin the resize wiring so a
      // future "no listeners under reduced motion" simplification doesn't
      // leave a stale frame at the wrong dimensions.
      expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('cleans up resize listener on unmount under reduced motion', () => {
      framerMock.reducedMotion = true;
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<MatrixRainCanvas />);
      unmount();
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('treats null hook return as motion-allowed (?? false coercion)', () => {
      // framer-motion's useReducedMotion returns null on first paint / SSR
      // before the media-query probe resolves — null must NOT be treated as
      // truthy "reduced motion". The ?? false coercion pins this default.
      framerMock.reducedMotion = null;
      render(<MatrixRainCanvas />);
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('does not start any rendering in test mode under reduced motion', () => {
      framerMock.reducedMotion = true;
      (window as unknown as { __TEST__?: boolean }).__TEST__ = true;
      render(<MatrixRainCanvas />);
      // The __TEST__ early return wins over the reduced-motion branch — pin
      // it so visual baselines stay deterministic regardless of motion mode.
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
      delete (window as unknown as { __TEST__?: boolean }).__TEST__;
    });
  });
});
