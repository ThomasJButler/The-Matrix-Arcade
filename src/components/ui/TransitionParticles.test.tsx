import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TransitionParticles from './TransitionParticles';

// Mock canvas context
const mockCanvasContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  globalAlpha: 1,
  fillStyle: '',
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as any;

// Mock requestAnimationFrame
let rafCallbacks: FrameRequestCallback[] = [];
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  rafCallbacks.push(callback);
  return rafCallbacks.length;
});

global.cancelAnimationFrame = vi.fn();

describe('TransitionParticles Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rafCallbacks = [];
    
    // Mock canvas offsetWidth/offsetHeight
    Object.defineProperty(HTMLCanvasElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 800
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600
    });
  });
  
  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders canvas for particles', () => {
    render(<TransitionParticles />);
    const canvasElement = screen.getByRole('img'); // Canvas has implicit img role
    expect(canvasElement).toBeInTheDocument();
    expect(canvasElement).toHaveClass('particle-container');
  });

  it('initializes canvas context', () => {
    render(<TransitionParticles />);
    
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
  });

  it('starts animation on mount', () => {
    render(<TransitionParticles />);
    
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });

  it('resizes canvas based on container size', () => {
    const { container } = render(<TransitionParticles />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    
    // Initial size should be set
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });

  it('handles window resize', () => {
    render(<TransitionParticles />);
    
    // Trigger resize event
    global.dispatchEvent(new Event('resize'));
    
    // Canvas should maintain responsive sizing
    const canvas = screen.getByRole('img') as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();
  });

  it('animates particles', () => {
    render(<TransitionParticles />);
    
    // Trigger animation frame
    if (rafCallbacks.length > 0) {
      rafCallbacks[0](16);
    }
    
    // Should clear and draw particles
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    expect(mockCanvasContext.beginPath).toHaveBeenCalled();
    expect(mockCanvasContext.arc).toHaveBeenCalled();
    expect(mockCanvasContext.fill).toHaveBeenCalled();
  });

  it('creates particles with varying properties', () => {
    render(<TransitionParticles />);
    
    // Particles should be created with random properties
    if (rafCallbacks.length > 0) {
      rafCallbacks[0](16);
    }
    
    // Check that multiple particles are drawn
    expect(mockCanvasContext.arc.mock.calls.length).toBeGreaterThan(0);
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<TransitionParticles />);
    
    const initialRafCalls = global.cancelAnimationFrame.mock.calls.length;
    
    unmount();
    
    // Should cancel animation frame
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
    expect(global.cancelAnimationFrame.mock.calls.length).toBeGreaterThan(initialRafCalls);
  });

  it('removes resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<TransitionParticles />);
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('handles missing canvas context gracefully', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;
    
    // Should not throw
    expect(() => render(<TransitionParticles />)).not.toThrow();
    
    // Restore mock
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as any;
  });

  it('updates particle positions on each frame', () => {
    render(<TransitionParticles />);
    
    // First frame
    if (rafCallbacks.length > 0) {
      rafCallbacks[0](16);
    }
    
    const firstDrawCalls = mockCanvasContext.arc.mock.calls.length;
    
    // Clear and trigger second frame
    mockCanvasContext.arc.mockClear();
    if (rafCallbacks.length > 0) {
      rafCallbacks[0](32);
    }
    
    // Should draw particles again with updated positions
    expect(mockCanvasContext.arc.mock.calls.length).toBe(firstDrawCalls);
  });
});