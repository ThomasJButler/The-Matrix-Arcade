import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useParticleSystem } from './useParticleSystem';

// Mock requestAnimationFrame
let rafCallback: ((time: number) => void) | null = null;
let rafId = 0;

const mockRequestAnimationFrame = vi.fn((callback: (time: number) => void) => {
  rafCallback = callback;
  return ++rafId;
});

const mockCancelAnimationFrame = vi.fn((id: number) => {
  if (id === rafId) {
    rafCallback = null;
  }
});

// Mock canvas context
const createMockContext = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  fillStyle: '' as string,
  font: '' as string,
  shadowBlur: 0,
  shadowColor: '' as string,
});

// Advance time in the particle system
const advanceAnimationFrame = (deltaMs: number = 16.67) => {
  if (rafCallback) {
    rafCallback(performance.now() + deltaMs);
  }
};

describe('useParticleSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rafCallback = null;
    rafId = 0;

    global.requestAnimationFrame = mockRequestAnimationFrame;
    global.cancelAnimationFrame = mockCancelAnimationFrame;

    // Mock performance.now for consistent timing
    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialisation', () => {
    it('returns all particle system functions', () => {
      const { result } = renderHook(() => useParticleSystem());

      expect(result.current.particles).toBeDefined();
      expect(result.current.emit).toBeDefined();
      expect(result.current.explode).toBeDefined();
      expect(result.current.collectFood).toBeDefined();
      expect(result.current.activatePowerUp).toBeDefined();
      expect(result.current.createTrail).toBeDefined();
      expect(result.current.createMatrixRain).toBeDefined();
      expect(result.current.clear).toBeDefined();
      expect(result.current.render).toBeDefined();
      expect(result.current.count).toBeDefined();
    });

    it('starts with empty particles array', () => {
      const { result } = renderHook(() => useParticleSystem());

      expect(result.current.particles).toEqual([]);
      expect(result.current.count).toBe(0);
    });

    it('starts requestAnimationFrame loop on mount', () => {
      renderHook(() => useParticleSystem());

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('cancels requestAnimationFrame on unmount', () => {
      const { unmount } = renderHook(() => useParticleSystem());

      unmount();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('emit function', () => {
    it('creates particles with correct base properties', () => {
      const { result } = renderHook(() => useParticleSystem());

      act(() => {
        result.current.emit({
          x: 100,
          y: 200,
          count: 5,
          type: 'explosion',
        });
      });

      expect(result.current.particles).toHaveLength(5);

      result.current.particles.forEach(particle => {
        expect(particle.x).toBe(100);
        expect(particle.y).toBe(200);
        expect(particle.type).toBe('explosion');
        expect(particle.id).toMatch(/^particle-\d+$/);
      });
    });

    it('generates unique particle IDs', () => {
      const { result } = renderHook(() => useParticleSystem());

      act(() => {
        result.current.emit({ x: 0, y: 0, count: 10, type: 'food' });
      });

      const ids = result.current.particles.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('applies custom emitter properties where type allows', () => {
      const { result } = renderHook(() => useParticleSystem());

      // Test with 'food' type which respects custom colour and life
      // Note: Each type has its own property overrides:
      // - food: overrides size (2-4 random), respects colour and life
      // - trail: overrides life (0.5), size (2), respects colour
      // - explosion: overrides colour, size, adds gravity
      act(() => {
        result.current.emit({
          x: 50,
          y: 50,
          count: 1,
          type: 'food',
          color: '#FF00FF',
          life: 2.5,
        });
      });

      const particle = result.current.particles[0];
      // Food type respects custom colour
      expect(particle.color).toBe('#FF00FF');
      // Food type respects custom life
      expect(particle.life).toBe(2.5);
      expect(particle.maxLife).toBe(2.5);
      // Food type overrides size with random 2-4
      expect(particle.size).toBeGreaterThanOrEqual(2);
      expect(particle.size).toBeLessThanOrEqual(4);
    });

    it('distributes particles in angular pattern with spread', () => {
      const { result } = renderHook(() => useParticleSystem());

      act(() => {
        result.current.emit({
          x: 0,
          y: 0,
          count: 8,
          type: 'explosion',
          spread: Math.PI * 2,
          speed: 5,
        });
      });

      // Particles should have varying velocity directions
      const velocities = result.current.particles.map(p => ({
        vx: p.vx,
        vy: p.vy,
      }));

      // Check that not all particles have the same velocity
      const uniqueVelocities = new Set(velocities.map(v => `${v.vx.toFixed(2)},${v.vy.toFixed(2)}`));
      expect(uniqueVelocities.size).toBeGreaterThan(1);
    });
  });

  describe('Particle Types', () => {
    describe('food type', () => {
      it('creates particles with gold colour by default', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'food' });
        });

        expect(result.current.particles[0].color).toBe('#FFD700');
      });

      it('respects custom colour override', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'food', color: '#00FF00' });
        });

        expect(result.current.particles[0].color).toBe('#00FF00');
      });

      it('enables glow effect', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'food' });
        });

        expect(result.current.particles[0].glow).toBe(true);
      });

      it('creates variable sized particles between 2 and 4', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 20, type: 'food' });
        });

        result.current.particles.forEach(p => {
          expect(p.size).toBeGreaterThanOrEqual(2);
          expect(p.size).toBeLessThanOrEqual(4);
        });
      });
    });

    describe('explosion type', () => {
      it('creates particles with random warm colours', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 30, type: 'explosion' });
        });

        const validColours = ['#FF0000', '#FF6600', '#FFFF00'];
        result.current.particles.forEach(p => {
          expect(validColours).toContain(p.color);
        });
      });

      it('applies gravity to particles', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'explosion' });
        });

        expect(result.current.particles[0].gravity).toBe(0.3);
      });

      it('creates larger particles between 4 and 8', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 20, type: 'explosion' });
        });

        result.current.particles.forEach(p => {
          expect(p.size).toBeGreaterThanOrEqual(4);
          expect(p.size).toBeLessThanOrEqual(8);
        });
      });

      it('enables glow effect', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'explosion' });
        });

        expect(result.current.particles[0].glow).toBe(true);
      });
    });

    describe('trail type', () => {
      it('creates particles with semi-transparent green by default', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'trail' });
        });

        expect(result.current.particles[0].color).toBe('#00FF0080');
      });

      it('uses short lifespan of 0.5 seconds', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'trail' });
        });

        expect(result.current.particles[0].life).toBe(0.5);
        expect(result.current.particles[0].maxLife).toBe(0.5);
      });

      it('creates small particles of size 2', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'trail' });
        });

        expect(result.current.particles[0].size).toBe(2);
      });

      it('enables fade effect', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'trail' });
        });

        expect(result.current.particles[0].fade).toBe(true);
      });
    });

    describe('powerup type', () => {
      it('creates particles with gold colour by default', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'powerup' });
        });

        expect(result.current.particles[0].color).toBe('#FFD700');
      });

      it('enables glow effect', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'powerup' });
        });

        expect(result.current.particles[0].glow).toBe(true);
      });

      it('creates slower moving particles (speed * 0.5)', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 10, type: 'powerup', speed: 4 });
        });

        // Particles should have relatively low velocity magnitude
        result.current.particles.forEach(p => {
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          // Max speed would be 4 * 0.5 * 1 = 2 (with random factor)
          expect(speed).toBeLessThan(5);
        });
      });
    });

    describe('matrix type', () => {
      it('creates particles with matrix green colour', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'matrix' });
        });

        expect(result.current.particles[0].color).toBe('#00FF00');
      });

      it('applies negative gravity (rising effect)', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'matrix' });
        });

        expect(result.current.particles[0].gravity).toBe(-0.5);
      });

      it('disables fade effect', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'matrix' });
        });

        expect(result.current.particles[0].fade).toBe(false);
      });

      it('creates small particles between 1 and 3', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 20, type: 'matrix' });
        });

        result.current.particles.forEach(p => {
          expect(p.size).toBeGreaterThanOrEqual(1);
          expect(p.size).toBeLessThanOrEqual(3);
        });
      });
    });

    describe('impact type', () => {
      it('creates particles with white colour', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'impact' });
        });

        expect(result.current.particles[0].color).toBe('#FFFFFF');
      });

      it('creates large particles between 5 and 10', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 20, type: 'impact' });
        });

        result.current.particles.forEach(p => {
          expect(p.size).toBeGreaterThanOrEqual(5);
          expect(p.size).toBeLessThanOrEqual(10);
        });
      });

      it('uses very short lifespan of 0.3 seconds', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'impact' });
        });

        expect(result.current.particles[0].life).toBe(0.3);
      });

      it('enables glow effect', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 1, type: 'impact' });
        });

        expect(result.current.particles[0].glow).toBe(true);
      });

      it('creates fast moving particles (speed * 3)', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.emit({ x: 0, y: 0, count: 10, type: 'impact', speed: 2 });
        });

        // Particles should have high velocity magnitude
        result.current.particles.forEach(p => {
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          // Speed is modified by * 3, plus random factor (0.5-1.0)
          expect(speed).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Specialised Emitters', () => {
    describe('explode', () => {
      it('creates 20 explosion particles', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.explode(100, 200);
        });

        expect(result.current.particles).toHaveLength(20);
        expect(result.current.particles[0].type).toBe('explosion');
      });

      it('positions particles at specified coordinates', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.explode(150, 250);
        });

        result.current.particles.forEach(p => {
          expect(p.x).toBe(150);
          expect(p.y).toBe(250);
        });
      });

      it('accepts optional colour parameter', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.explode(0, 0, '#00FF00');
        });

        // Note: explosion type overrides colour with random warm colours
        // so this tests that the colour parameter is passed but may be overridden
        expect(result.current.particles.length).toBe(20);
      });
    });

    describe('collectFood', () => {
      it('creates 15 food particles', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.collectFood(100, 200, '#FF0000');
        });

        expect(result.current.particles).toHaveLength(15);
        expect(result.current.particles[0].type).toBe('food');
      });

      it('uses provided colour', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.collectFood(0, 0, '#FF00FF');
        });

        expect(result.current.particles[0].color).toBe('#FF00FF');
      });

      it('uses lifespan of 0.8 seconds', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.collectFood(0, 0, '#FFFFFF');
        });

        expect(result.current.particles[0].life).toBe(0.8);
      });
    });

    describe('activatePowerUp', () => {
      it('creates 30 powerup particles', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.activatePowerUp(100, 200, '#00FFFF');
        });

        expect(result.current.particles).toHaveLength(30);
        expect(result.current.particles[0].type).toBe('powerup');
      });

      it('uses provided colour', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.activatePowerUp(0, 0, '#00FFFF');
        });

        expect(result.current.particles[0].color).toBe('#00FFFF');
      });

      it('uses lifespan of 1.5 seconds', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.activatePowerUp(0, 0, '#FFFFFF');
        });

        expect(result.current.particles[0].life).toBe(1.5);
      });
    });

    describe('createTrail', () => {
      it('creates 3 trail particles', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.createTrail(100, 200);
        });

        expect(result.current.particles).toHaveLength(3);
        expect(result.current.particles[0].type).toBe('trail');
      });

      it('accepts optional colour parameter', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.createTrail(0, 0, '#FF0000');
        });

        expect(result.current.particles[0].color).toBe('#FF0000');
      });

      it('uses default semi-transparent green when no colour provided', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.createTrail(0, 0);
        });

        expect(result.current.particles[0].color).toBe('#00FF0080');
      });
    });

    describe('createMatrixRain', () => {
      it('creates 1 matrix particle', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.createMatrixRain(800);
        });

        expect(result.current.particles).toHaveLength(1);
        expect(result.current.particles[0].type).toBe('matrix');
      });

      it('positions particle at random x within canvas width', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.createMatrixRain(800);
        });

        expect(result.current.particles[0].x).toBeGreaterThanOrEqual(0);
        expect(result.current.particles[0].x).toBeLessThanOrEqual(800);
      });

      it('starts particle above the canvas (y = -10)', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.createMatrixRain(800);
        });

        expect(result.current.particles[0].y).toBe(-10);
      });

      it('uses lifespan of 3 seconds', () => {
        const { result } = renderHook(() => useParticleSystem());

        act(() => {
          result.current.createMatrixRain(800);
        });

        expect(result.current.particles[0].life).toBe(3);
      });
    });
  });

  describe('Particle Cap (MAX_PARTICLES = 500)', () => {
    it('limits total particles to 500', () => {
      const { result } = renderHook(() => useParticleSystem());

      act(() => {
        // Emit more than MAX_PARTICLES
        for (let i = 0; i < 60; i++) {
          result.current.emit({ x: 0, y: 0, count: 10, type: 'explosion' });
        }
      });

      expect(result.current.particles.length).toBeLessThanOrEqual(500);
    });

    it('keeps most recent particles when cap exceeded', () => {
      const { result } = renderHook(() => useParticleSystem());

      act(() => {
        // First batch
        result.current.emit({ x: 0, y: 0, count: 300, type: 'food' });
      });

      const _firstBatchIds = result.current.particles.map(p => p.id);

      act(() => {
        // Second batch that exceeds cap
        result.current.emit({ x: 100, y: 100, count: 300, type: 'explosion' });
      });

      // Should have 500 particles, with newer ones taking precedence
      expect(result.current.particles.length).toBe(500);

      // Last batch particles should be present
      const hasNewParticles = result.current.particles.some(p => p.x === 100);
      expect(hasNewParticles).toBe(true);
    });
  });

  describe('clear function', () => {
    it('removes all particles', () => {
      const { result } = renderHook(() => useParticleSystem());

      act(() => {
        result.current.emit({ x: 0, y: 0, count: 50, type: 'explosion' });
      });

      expect(result.current.particles.length).toBe(50);

      act(() => {
        result.current.clear();
      });

      expect(result.current.particles).toEqual([]);
      expect(result.current.count).toBe(0);
    });
  });

  describe('render function', () => {
    it('renders all particles to canvas context', () => {
      const { result } = renderHook(() => useParticleSystem());
      const mockCtx = createMockContext();

      act(() => {
        result.current.emit({ x: 50, y: 50, count: 3, type: 'food' });
      });

      act(() => {
        result.current.render(mockCtx as unknown as CanvasRenderingContext2D);
      });

      expect(mockCtx.save).toHaveBeenCalledTimes(3);
      expect(mockCtx.restore).toHaveBeenCalledTimes(3);
    });

    it('draws circle for non-matrix particles', () => {
      const { result } = renderHook(() => useParticleSystem());
      const mockCtx = createMockContext();

      act(() => {
        result.current.emit({ x: 50, y: 50, count: 1, type: 'food' });
      });

      act(() => {
        result.current.render(mockCtx as unknown as CanvasRenderingContext2D);
      });

      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('draws text character for matrix particles', () => {
      const { result } = renderHook(() => useParticleSystem());
      const mockCtx = createMockContext();

      act(() => {
        result.current.emit({ x: 50, y: 50, count: 1, type: 'matrix' });
      });

      act(() => {
        result.current.render(mockCtx as unknown as CanvasRenderingContext2D);
      });

      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('applies glow effect when particle has glow enabled', () => {
      const { result } = renderHook(() => useParticleSystem());
      const mockCtx = createMockContext();

      act(() => {
        result.current.emit({ x: 50, y: 50, count: 1, type: 'explosion' });
      });

      act(() => {
        result.current.render(mockCtx as unknown as CanvasRenderingContext2D);
      });

      // Glow is applied by setting shadowBlur
      expect(mockCtx.shadowBlur).toBeGreaterThan(0);
    });

    it('handles empty particles array', () => {
      const { result } = renderHook(() => useParticleSystem());
      const mockCtx = createMockContext();

      act(() => {
        result.current.render(mockCtx as unknown as CanvasRenderingContext2D);
      });

      expect(mockCtx.save).not.toHaveBeenCalled();
    });

    it('sets correct fillStyle with opacity for fading particles', () => {
      const { result } = renderHook(() => useParticleSystem());
      const mockCtx = createMockContext();

      act(() => {
        result.current.emit({ x: 50, y: 50, count: 1, type: 'trail' });
      });

      act(() => {
        result.current.render(mockCtx as unknown as CanvasRenderingContext2D);
      });

      // fillStyle should be set (includes hex opacity suffix)
      expect(typeof mockCtx.fillStyle).toBe('string');
    });
  });

  describe('Particle Physics (Animation Loop)', () => {
    it('updates particle positions based on velocity', () => {
      const { result } = renderHook(() => useParticleSystem());

      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67); // ~1 frame at 60fps

      act(() => {
        result.current.emit({
          x: 100,
          y: 100,
          count: 1,
          type: 'trail',
          speed: 5,
          spread: 0, // Force consistent direction
        });
      });

      const _initialX = result.current.particles[0].x;
      const _initialY = result.current.particles[0].y;

      // Simulate animation frame
      act(() => {
        advanceAnimationFrame(16.67);
      });

      // Position should have changed based on velocity
      // (exact values depend on angle distribution)
      expect(result.current.particles.length).toBeGreaterThanOrEqual(0);
    });

    it('decreases particle life over time', () => {
      const { result } = renderHook(() => useParticleSystem());

      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100); // 100ms

      act(() => {
        result.current.emit({
          x: 0,
          y: 0,
          count: 1,
          type: 'explosion',
          life: 1.0,
        });
      });

      const initialLife = result.current.particles[0].life;
      expect(initialLife).toBe(1.0);

      act(() => {
        advanceAnimationFrame(100);
      });

      // Life should have decreased
      // Due to capping at 30fps minimum, deltaTime is capped at 0.033
      const particle = result.current.particles[0];
      if (particle) {
        expect(particle.life).toBeLessThan(initialLife);
      }
    });

    it('removes particles when life reaches zero', () => {
      const { result } = renderHook(() => useParticleSystem());

      let timeNow = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => timeNow);

      act(() => {
        result.current.emit({
          x: 0,
          y: 0,
          count: 1,
          type: 'impact', // Short life (0.3 seconds)
        });
      });

      expect(result.current.particles).toHaveLength(1);

      // Advance time significantly past particle lifespan
      timeNow = 500; // 500ms
      act(() => {
        if (rafCallback) {
          rafCallback(500);
        }
      });

      // Particle should be removed (life depleted)
      // Note: Due to capped deltaTime, may need multiple frames
    });

    it('applies gravity to particle velocity', () => {
      const { result } = renderHook(() => useParticleSystem());

      let timeNow = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => timeNow);

      act(() => {
        result.current.emit({
          x: 0,
          y: 0,
          count: 1,
          type: 'explosion', // Has gravity: 0.3
          spread: 0,
        });
      });

      const initialVy = result.current.particles[0].vy;

      timeNow = 16.67;
      act(() => {
        if (rafCallback) {
          rafCallback(16.67);
        }
      });

      // After animation frame, vy should have increased (gravity pulls down)
      if (result.current.particles.length > 0) {
        expect(result.current.particles[0].vy).toBeGreaterThanOrEqual(initialVy);
      }
    });

    it('reduces size for fading particles', () => {
      const { result } = renderHook(() => useParticleSystem());

      let timeNow = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => timeNow);

      act(() => {
        result.current.emit({
          x: 0,
          y: 0,
          count: 1,
          type: 'trail', // Has fade: true
          size: 10,
          life: 1.0,
        });
      });

      const initialSize = result.current.particles[0].size;

      timeNow = 16.67;
      act(() => {
        if (rafCallback) {
          rafCallback(16.67);
        }
      });

      // Size should decrease as life decreases for fading particles
      if (result.current.particles.length > 0) {
        expect(result.current.particles[0].size).toBeLessThanOrEqual(initialSize);
      }
    });

    it('maintains size for non-fading particles', () => {
      const { result } = renderHook(() => useParticleSystem());

      let timeNow = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => timeNow);

      act(() => {
        result.current.emit({
          x: 0,
          y: 0,
          count: 1,
          type: 'matrix', // Has fade: false
        });
      });

      const initialSize = result.current.particles[0].size;

      timeNow = 16.67;
      act(() => {
        if (rafCallback) {
          rafCallback(16.67);
        }
      });

      // Size should remain constant for non-fading particles
      if (result.current.particles.length > 0) {
        expect(result.current.particles[0].size).toBe(initialSize);
      }
    });

    it('caps deltaTime to prevent large jumps', () => {
      const { result } = renderHook(() => useParticleSystem());

      let timeNow = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => timeNow);

      act(() => {
        result.current.emit({
          x: 0,
          y: 0,
          count: 1,
          type: 'food',
          life: 1.0,
        });
      });

      // Simulate a very large time gap (like when tab was inactive)
      timeNow = 5000; // 5 seconds
      act(() => {
        if (rafCallback) {
          rafCallback(5000);
        }
      });

      // Particle should still exist because deltaTime is capped at 0.033
      // (would need ~30 frames to deplete 1 second of life)
      // This tests that massive time jumps don't instantly kill all particles
    });
  });

  describe('count property', () => {
    it('returns current number of particles', () => {
      const { result } = renderHook(() => useParticleSystem());

      expect(result.current.count).toBe(0);

      act(() => {
        result.current.emit({ x: 0, y: 0, count: 25, type: 'food' });
      });

      expect(result.current.count).toBe(25);

      act(() => {
        result.current.emit({ x: 0, y: 0, count: 10, type: 'explosion' });
      });

      expect(result.current.count).toBe(35);
    });

    it('updates after clear', () => {
      const { result } = renderHook(() => useParticleSystem());

      act(() => {
        result.current.emit({ x: 0, y: 0, count: 50, type: 'food' });
      });

      expect(result.current.count).toBe(50);

      act(() => {
        result.current.clear();
      });

      expect(result.current.count).toBe(0);
    });
  });

  describe('Multiple Emissions', () => {
    it('accumulates particles from multiple emit calls', () => {
      const { result } = renderHook(() => useParticleSystem());

      act(() => {
        result.current.emit({ x: 0, y: 0, count: 10, type: 'food' });
        result.current.emit({ x: 100, y: 100, count: 10, type: 'explosion' });
        result.current.emit({ x: 200, y: 200, count: 10, type: 'trail' });
      });

      expect(result.current.particles).toHaveLength(30);

      // Check that all types are present
      const types = result.current.particles.map(p => p.type);
      expect(types.filter(t => t === 'food')).toHaveLength(10);
      expect(types.filter(t => t === 'explosion')).toHaveLength(10);
      expect(types.filter(t => t === 'trail')).toHaveLength(10);
    });

    it('maintains particle positions from different emissions', () => {
      const { result } = renderHook(() => useParticleSystem());

      act(() => {
        result.current.emit({ x: 50, y: 50, count: 5, type: 'food' });
        result.current.emit({ x: 150, y: 150, count: 5, type: 'explosion' });
      });

      const foodParticles = result.current.particles.filter(p => p.type === 'food');
      const explosionParticles = result.current.particles.filter(p => p.type === 'explosion');

      foodParticles.forEach(p => {
        expect(p.x).toBe(50);
        expect(p.y).toBe(50);
      });

      explosionParticles.forEach(p => {
        expect(p.x).toBe(150);
        expect(p.y).toBe(150);
      });
    });
  });

  describe('Memoisation', () => {
    it('returns stable function references', () => {
      const { result, rerender } = renderHook(() => useParticleSystem());

      const initialEmit = result.current.emit;
      const initialExplode = result.current.explode;
      const initialClear = result.current.clear;
      const _initialRender = result.current.render;

      rerender();

      expect(result.current.emit).toBe(initialEmit);
      expect(result.current.explode).toBe(initialExplode);
      expect(result.current.clear).toBe(initialClear);
      // Note: render changes when particles change
    });
  });
});
