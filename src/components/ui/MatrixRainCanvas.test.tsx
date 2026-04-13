import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MatrixRainCanvas } from './MatrixRainCanvas';

describe('MatrixRainCanvas', () => {
  let rafCallback: ((ts: number) => void) | null = null;
  let rafId = 1;

  beforeEach(() => {
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
});
