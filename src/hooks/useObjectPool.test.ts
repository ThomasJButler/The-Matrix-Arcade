import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useObjectPool,
  createParticle,
  createProjectile,
  createEnemy,
  Particle,
  Projectile,
  Enemy,
} from './useObjectPool';

// Helper to create a simple poolable object for testing
interface TestObject {
  active: boolean;
  value: number;
  reset?: () => void;
}

const createTestObject = (): TestObject => ({
  active: false,
  value: 0,
  reset: function() {
    this.value = 0;
  },
});

describe('useObjectPool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialisation', () => {
    it('returns all pool functions', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      expect(result.current.acquire).toBeDefined();
      expect(result.current.release).toBeDefined();
      expect(result.current.releaseAll).toBeDefined();
      expect(result.current.getStats).toBeDefined();
      expect(result.current.prewarm).toBeDefined();
      expect(result.current.activeObjects).toBeDefined();
    });

    it('starts with empty active objects array', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      expect(result.current.activeObjects).toEqual([]);
    });

    it('uses default initialSize of 10', () => {
      const createFn = vi.fn(createTestObject);
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createFn,
        })
      );

      // Pool initialises lazily on first acquire
      act(() => {
        result.current.acquire();
      });

      // Initial pool size should be 10 (default)
      const stats = result.current.getStats();
      expect(stats.total).toBe(10);
    });

    it('uses custom initialSize when provided', () => {
      const createFn = vi.fn(createTestObject);
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createFn,
          initialSize: 25,
        })
      );

      act(() => {
        result.current.acquire();
      });

      const stats = result.current.getStats();
      expect(stats.total).toBe(25);
    });

    it('initialises pool lazily on first acquire', () => {
      const createFn = vi.fn(createTestObject);
      renderHook(() =>
        useObjectPool<TestObject>({
          create: createFn,
        })
      );

      // No objects created before acquire
      expect(createFn).not.toHaveBeenCalled();
    });
  });

  describe('acquire function', () => {
    it('returns an object from the pool', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      let obj: TestObject | null = null;
      act(() => {
        obj = result.current.acquire();
      });

      expect(obj).not.toBeNull();
      expect(obj!.active).toBe(true);
    });

    it('marks acquired object as active', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      let obj: TestObject | null = null;
      act(() => {
        obj = result.current.acquire();
      });

      expect(obj!.active).toBe(true);
    });

    it('adds acquired object to activeObjects array', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      act(() => {
        result.current.acquire();
      });

      expect(result.current.activeObjects).toHaveLength(1);
    });

    it('calls custom reset function when acquiring', () => {
      const resetFn = vi.fn();
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          reset: resetFn,
        })
      );

      act(() => {
        result.current.acquire();
      });

      expect(resetFn).toHaveBeenCalledTimes(1);
    });

    it('calls object reset method when no custom reset provided', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      let obj: TestObject | null = null;
      act(() => {
        obj = result.current.acquire();
        obj!.value = 42;
      });

      // Release and reacquire
      act(() => {
        result.current.release(obj!);
      });

      let newObj: TestObject | null = null;
      act(() => {
        newObj = result.current.acquire();
      });

      // Object should be reset
      expect(newObj!.value).toBe(0);
    });

    it('expands pool when all objects are in use', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 5,
          expandSize: 3,
        })
      );

      // Acquire all initial objects
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.acquire();
        }
      });

      expect(result.current.getStats().total).toBe(5);

      // Acquire one more to trigger expansion
      act(() => {
        result.current.acquire();
      });

      expect(result.current.getStats().total).toBe(8); // 5 + 3
    });

    it('returns null when pool is at maxSize and all objects active', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 3,
          maxSize: 5,
          expandSize: 2,
        })
      );

      // Acquire all objects up to max
      const acquired: TestObject[] = [];
      act(() => {
        for (let i = 0; i < 5; i++) {
          const obj = result.current.acquire();
          if (obj) acquired.push(obj);
        }
      });

      expect(acquired).toHaveLength(5);

      // Try to acquire one more
      let extraObj: TestObject | null = null;
      act(() => {
        extraObj = result.current.acquire();
      });

      expect(extraObj).toBeNull();
    });

    it('reuses released objects instead of creating new ones', () => {
      const createFn = vi.fn(createTestObject);
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createFn,
          initialSize: 5,
        })
      );

      let obj: TestObject | null = null;
      act(() => {
        obj = result.current.acquire();
      });

      const initialCallCount = createFn.mock.calls.length;

      // Release the object
      act(() => {
        result.current.release(obj!);
      });

      // Acquire again - should reuse, not create new
      act(() => {
        result.current.acquire();
      });

      expect(createFn.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('release function', () => {
    it('marks object as inactive', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      let obj: TestObject | null = null;
      act(() => {
        obj = result.current.acquire();
      });

      expect(obj!.active).toBe(true);

      act(() => {
        result.current.release(obj!);
      });

      expect(obj!.active).toBe(false);
    });

    it('removes object from activeObjects array', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      let obj: TestObject | null = null;
      act(() => {
        obj = result.current.acquire();
      });

      expect(result.current.activeObjects).toHaveLength(1);

      act(() => {
        result.current.release(obj!);
      });

      expect(result.current.activeObjects).toHaveLength(0);
    });

    it('calls custom reset function when releasing', () => {
      const resetFn = vi.fn();
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          reset: resetFn,
        })
      );

      let obj: TestObject | null = null;
      act(() => {
        obj = result.current.acquire();
      });

      const callCountAfterAcquire = resetFn.mock.calls.length;

      act(() => {
        result.current.release(obj!);
      });

      expect(resetFn.mock.calls.length).toBe(callCountAfterAcquire + 1);
    });

    it('ignores null object', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      // Should not throw
      act(() => {
        result.current.release(null as unknown as TestObject);
      });
    });

    it('ignores already inactive object', () => {
      const resetFn = vi.fn();
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          reset: resetFn,
        })
      );

      let obj: TestObject | null = null;
      act(() => {
        obj = result.current.acquire();
      });

      act(() => {
        result.current.release(obj!);
      });

      const callCountAfterFirstRelease = resetFn.mock.calls.length;

      // Release again - should be ignored
      act(() => {
        result.current.release(obj!);
      });

      expect(resetFn.mock.calls.length).toBe(callCountAfterFirstRelease);
    });
  });

  describe('releaseAll function', () => {
    it('releases all active objects', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      act(() => {
        result.current.acquire();
        result.current.acquire();
        result.current.acquire();
      });

      expect(result.current.getStats().active).toBe(3);

      act(() => {
        result.current.releaseAll();
      });

      // Use getStats to check active count since activeRef is reassigned
      expect(result.current.getStats().active).toBe(0);
    });

    it('marks all objects as inactive', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      const objects: TestObject[] = [];
      act(() => {
        objects.push(result.current.acquire()!);
        objects.push(result.current.acquire()!);
      });

      expect(objects.every(o => o.active)).toBe(true);

      act(() => {
        result.current.releaseAll();
      });

      expect(objects.every(o => !o.active)).toBe(true);
    });

    it('calls reset on all objects', () => {
      const resetFn = vi.fn();
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          reset: resetFn,
        })
      );

      act(() => {
        result.current.acquire();
        result.current.acquire();
        result.current.acquire();
      });

      const callCountAfterAcquires = resetFn.mock.calls.length;

      act(() => {
        result.current.releaseAll();
      });

      expect(resetFn.mock.calls.length).toBe(callCountAfterAcquires + 3);
    });

    it('handles empty active objects array', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      // Should not throw
      act(() => {
        result.current.releaseAll();
      });

      expect(result.current.activeObjects).toHaveLength(0);
    });
  });

  describe('getStats function', () => {
    it('returns correct total count', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 15,
        })
      );

      act(() => {
        result.current.acquire();
      });

      const stats = result.current.getStats();
      expect(stats.total).toBe(15);
    });

    it('returns correct active count', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      act(() => {
        result.current.acquire();
        result.current.acquire();
        result.current.acquire();
      });

      const stats = result.current.getStats();
      expect(stats.active).toBe(3);
    });

    it('returns correct available count', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 10,
        })
      );

      act(() => {
        result.current.acquire();
        result.current.acquire();
      });

      const stats = result.current.getStats();
      expect(stats.available).toBe(8);
    });

    it('returns correct utilisation percentage', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 20,
        })
      );

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.acquire();
        }
      });

      const stats = result.current.getStats();
      expect(stats.utilization).toBe(50); // 10/20 = 50%
    });

    it('updates stats after release', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 10,
        })
      );

      let obj: TestObject | null = null;
      act(() => {
        obj = result.current.acquire();
        result.current.acquire();
      });

      expect(result.current.getStats().active).toBe(2);

      act(() => {
        result.current.release(obj!);
      });

      expect(result.current.getStats().active).toBe(1);
      expect(result.current.getStats().available).toBe(9);
    });
  });

  describe('prewarm function', () => {
    it('creates objects up to specified count', () => {
      const createFn = vi.fn(createTestObject);
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createFn,
          initialSize: 5,
        })
      );

      act(() => {
        result.current.prewarm(20);
      });

      expect(result.current.getStats().total).toBe(20);
    });

    it('does not exceed maxSize', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 5,
          maxSize: 15,
        })
      );

      act(() => {
        result.current.prewarm(30);
      });

      expect(result.current.getStats().total).toBe(15);
    });

    it('does nothing when pool already has enough objects', () => {
      const createFn = vi.fn(createTestObject);
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createFn,
          initialSize: 20,
        })
      );

      // Initialise pool
      act(() => {
        result.current.acquire();
      });

      const callCountAfterInit = createFn.mock.calls.length;

      act(() => {
        result.current.prewarm(10);
      });

      // No additional objects created
      expect(createFn.mock.calls.length).toBe(callCountAfterInit);
    });

    it('marks prewarmed objects as inactive', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 0,
        })
      );

      act(() => {
        result.current.prewarm(10);
      });

      expect(result.current.getStats().active).toBe(0);
      expect(result.current.getStats().available).toBe(10);
    });
  });

  describe('Pool Expansion', () => {
    it('expands by expandSize when pool is exhausted', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 5,
          expandSize: 3,
        })
      );

      // Exhaust initial pool
      act(() => {
        for (let i = 0; i < 6; i++) {
          result.current.acquire();
        }
      });

      expect(result.current.getStats().total).toBe(8); // 5 + 3
    });

    it('expands multiple times as needed', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 3,
          expandSize: 2,
          maxSize: 100,
        })
      );

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.acquire();
        }
      });

      // Should have expanded multiple times: 3 + 2 + 2 + 2 + 2 = 11
      expect(result.current.getStats().total).toBeGreaterThanOrEqual(10);
    });

    it('stops expanding at maxSize', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 5,
          expandSize: 10,
          maxSize: 12,
        })
      );

      act(() => {
        for (let i = 0; i < 12; i++) {
          result.current.acquire();
        }
      });

      expect(result.current.getStats().total).toBe(12);
    });

    it('expands by partial amount when near maxSize', () => {
      const { result } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
          initialSize: 8,
          expandSize: 5,
          maxSize: 10,
        })
      );

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.acquire();
        }
      });

      expect(result.current.getStats().total).toBe(10); // Should cap at 10
    });
  });

  describe('Function Stability', () => {
    it('returns stable acquire function reference', () => {
      const { result, rerender } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      const initialAcquire = result.current.acquire;
      rerender();
      expect(result.current.acquire).toBe(initialAcquire);
    });

    it('returns stable release function reference', () => {
      const { result, rerender } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      const initialRelease = result.current.release;
      rerender();
      expect(result.current.release).toBe(initialRelease);
    });

    it('returns stable releaseAll function reference', () => {
      const { result, rerender } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      const initialReleaseAll = result.current.releaseAll;
      rerender();
      expect(result.current.releaseAll).toBe(initialReleaseAll);
    });

    it('returns stable getStats function reference', () => {
      const { result, rerender } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      const initialGetStats = result.current.getStats;
      rerender();
      expect(result.current.getStats).toBe(initialGetStats);
    });

    it('returns stable prewarm function reference', () => {
      const { result, rerender } = renderHook(() =>
        useObjectPool<TestObject>({
          create: createTestObject,
        })
      );

      const initialPrewarm = result.current.prewarm;
      rerender();
      expect(result.current.prewarm).toBe(initialPrewarm);
    });
  });
});

describe('createParticle', () => {
  it('creates a particle with correct default properties', () => {
    const particle = createParticle();

    expect(particle.active).toBe(false);
    expect(particle.x).toBe(0);
    expect(particle.y).toBe(0);
    expect(particle.vx).toBe(0);
    expect(particle.vy).toBe(0);
    expect(particle.life).toBe(0);
    expect(particle.maxLife).toBe(1);
    expect(particle.size).toBe(4);
    expect(particle.color).toBe('#00ff00');
    expect(particle.alpha).toBe(1);
  });

  it('has a working reset method', () => {
    const particle = createParticle();

    // Modify properties
    particle.x = 100;
    particle.y = 200;
    particle.vx = 5;
    particle.vy = -3;
    particle.life = 0.5;
    particle.size = 10;
    particle.color = '#ff0000';
    particle.alpha = 0.5;

    // Reset
    particle.reset();

    expect(particle.x).toBe(0);
    expect(particle.y).toBe(0);
    expect(particle.vx).toBe(0);
    expect(particle.vy).toBe(0);
    expect(particle.life).toBe(0);
    expect(particle.maxLife).toBe(1);
    expect(particle.size).toBe(4);
    expect(particle.color).toBe('#00ff00');
    expect(particle.alpha).toBe(1);
  });

  it('can be used with useObjectPool', () => {
    const { result } = renderHook(() =>
      useObjectPool<Particle>({
        create: createParticle,
      })
    );

    let particle: Particle | null = null;
    act(() => {
      particle = result.current.acquire();
    });

    expect(particle).not.toBeNull();
    expect(particle!.active).toBe(true);
    expect(particle!.color).toBe('#00ff00');
  });
});

describe('createProjectile', () => {
  it('creates a projectile with correct default properties', () => {
    const projectile = createProjectile();

    expect(projectile.active).toBe(false);
    expect(projectile.x).toBe(0);
    expect(projectile.y).toBe(0);
    expect(projectile.vx).toBe(0);
    expect(projectile.vy).toBe(0);
    expect(projectile.damage).toBe(1);
    expect(projectile.width).toBe(4);
    expect(projectile.height).toBe(10);
    expect(projectile.type).toBe('bullet');
  });

  it('has a working reset method', () => {
    const projectile = createProjectile();

    // Modify properties
    projectile.x = 100;
    projectile.y = 200;
    projectile.vx = 0;
    projectile.vy = -10;
    projectile.damage = 5;
    projectile.width = 8;
    projectile.height = 16;
    projectile.type = 'missile';

    // Reset
    projectile.reset();

    expect(projectile.x).toBe(0);
    expect(projectile.y).toBe(0);
    expect(projectile.vx).toBe(0);
    expect(projectile.vy).toBe(0);
    expect(projectile.damage).toBe(1);
    expect(projectile.width).toBe(4);
    expect(projectile.height).toBe(10);
    expect(projectile.type).toBe('bullet');
  });

  it('can be used with useObjectPool', () => {
    const { result } = renderHook(() =>
      useObjectPool<Projectile>({
        create: createProjectile,
      })
    );

    let projectile: Projectile | null = null;
    act(() => {
      projectile = result.current.acquire();
    });

    expect(projectile).not.toBeNull();
    expect(projectile!.active).toBe(true);
    expect(projectile!.type).toBe('bullet');
  });
});

describe('createEnemy', () => {
  it('creates an enemy with correct default properties', () => {
    const enemy = createEnemy();

    expect(enemy.active).toBe(false);
    expect(enemy.x).toBe(0);
    expect(enemy.y).toBe(0);
    expect(enemy.vx).toBe(0);
    expect(enemy.vy).toBe(0);
    expect(enemy.health).toBe(1);
    expect(enemy.maxHealth).toBe(1);
    expect(enemy.width).toBe(32);
    expect(enemy.height).toBe(32);
    expect(enemy.type).toBe('basic');
    expect(enemy.value).toBe(10);
  });

  it('has a working reset method', () => {
    const enemy = createEnemy();

    // Modify properties
    enemy.x = 300;
    enemy.y = 100;
    enemy.vx = 2;
    enemy.vy = 1;
    enemy.health = 3;
    enemy.maxHealth = 5;
    enemy.width = 64;
    enemy.height = 48;
    enemy.type = 'elite';
    enemy.value = 50;

    // Reset
    enemy.reset();

    expect(enemy.x).toBe(0);
    expect(enemy.y).toBe(0);
    expect(enemy.vx).toBe(0);
    expect(enemy.vy).toBe(0);
    expect(enemy.health).toBe(1);
    expect(enemy.maxHealth).toBe(1);
    expect(enemy.width).toBe(32);
    expect(enemy.height).toBe(32);
    expect(enemy.type).toBe('basic');
    expect(enemy.value).toBe(10);
  });

  it('can be used with useObjectPool', () => {
    const { result } = renderHook(() =>
      useObjectPool<Enemy>({
        create: createEnemy,
      })
    );

    let enemy: Enemy | null = null;
    act(() => {
      enemy = result.current.acquire();
    });

    expect(enemy).not.toBeNull();
    expect(enemy!.active).toBe(true);
    expect(enemy!.type).toBe('basic');
  });
});

describe('Specialised Pool Usage Patterns', () => {
  describe('Particle Pool', () => {
    it('manages multiple particles efficiently', () => {
      const { result } = renderHook(() =>
        useObjectPool<Particle>({
          create: createParticle,
          initialSize: 50,
        })
      );

      const particles: Particle[] = [];
      act(() => {
        for (let i = 0; i < 20; i++) {
          const p = result.current.acquire();
          if (p) {
            p.x = i * 10;
            p.y = i * 5;
            p.vx = Math.random() * 2 - 1;
            p.vy = Math.random() * 2 - 1;
            particles.push(p);
          }
        }
      });

      expect(particles).toHaveLength(20);
      expect(result.current.getStats().active).toBe(20);
      expect(result.current.getStats().available).toBe(30);

      // Release half
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.release(particles[i]);
        }
      });

      expect(result.current.getStats().active).toBe(10);
      expect(result.current.getStats().available).toBe(40);
    });
  });

  describe('Projectile Pool', () => {
    it('handles rapid fire pattern', () => {
      const { result } = renderHook(() =>
        useObjectPool<Projectile>({
          create: createProjectile,
          initialSize: 20,
          expandSize: 10,
          maxSize: 100,
        })
      );

      // Simulate rapid firing
      const projectiles: Projectile[] = [];
      act(() => {
        for (let i = 0; i < 15; i++) {
          const p = result.current.acquire();
          if (p) {
            p.x = 400;
            p.y = 500;
            p.vy = -15;
            projectiles.push(p);
          }
        }
      });

      expect(projectiles).toHaveLength(15);

      // Simulate projectiles going off screen (release them)
      act(() => {
        projectiles.forEach(p => result.current.release(p));
      });

      // All projectiles should be available again
      expect(result.current.getStats().available).toBe(20);
    });
  });

  describe('Enemy Pool', () => {
    it('manages wave of enemies', () => {
      const { result } = renderHook(() =>
        useObjectPool<Enemy>({
          create: createEnemy,
          initialSize: 30,
        })
      );

      // Spawn a wave of enemies
      const wave: Enemy[] = [];
      act(() => {
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 8; col++) {
            const enemy = result.current.acquire();
            if (enemy) {
              enemy.x = 100 + col * 60;
              enemy.y = 50 + row * 50;
              enemy.type = row === 0 ? 'elite' : 'basic';
              enemy.value = row === 0 ? 30 : 10;
              wave.push(enemy);
            }
          }
        }
      });

      expect(wave).toHaveLength(24);
      expect(result.current.getStats().active).toBe(24);

      // Defeat some enemies
      act(() => {
        wave.slice(0, 10).forEach(e => result.current.release(e));
      });

      expect(result.current.getStats().active).toBe(14);
    });
  });
});

describe('Edge Cases', () => {
  it('handles zero initialSize', () => {
    const { result } = renderHook(() =>
      useObjectPool<TestObject>({
        create: createTestObject,
        initialSize: 0,
        expandSize: 5,
      })
    );

    // Should still be able to acquire (triggers expansion)
    let obj: TestObject | null = null;
    act(() => {
      obj = result.current.acquire();
    });

    expect(obj).not.toBeNull();
  });

  it('handles rapid acquire and release cycles', () => {
    const { result } = renderHook(() =>
      useObjectPool<TestObject>({
        create: createTestObject,
        initialSize: 5,
      })
    );

    for (let cycle = 0; cycle < 100; cycle++) {
      act(() => {
        const obj = result.current.acquire();
        if (obj) {
          result.current.release(obj);
        }
      });
    }

    // Pool size should remain stable
    expect(result.current.getStats().total).toBe(5);
    expect(result.current.getStats().active).toBe(0);
  });

  it('handles concurrent acquire calls', () => {
    const { result } = renderHook(() =>
      useObjectPool<TestObject>({
        create: createTestObject,
        initialSize: 10,
      })
    );

    const objects: TestObject[] = [];
    act(() => {
      for (let i = 0; i < 10; i++) {
        const obj = result.current.acquire();
        if (obj) objects.push(obj);
      }
    });

    // All objects should be unique
    const uniqueObjects = new Set(objects);
    expect(uniqueObjects.size).toBe(10);
  });

  it('handles objects without reset method', () => {
    interface SimpleObject {
      active: boolean;
      data: string;
    }

    const { result } = renderHook(() =>
      useObjectPool<SimpleObject>({
        create: () => ({ active: false, data: '' }),
      })
    );

    let obj: SimpleObject | null = null;
    act(() => {
      obj = result.current.acquire();
    });

    expect(obj).not.toBeNull();

    // Release should work even without reset method
    act(() => {
      result.current.release(obj!);
    });

    expect(obj!.active).toBe(false);
  });

  it('handles maxSize of 1', () => {
    const { result } = renderHook(() =>
      useObjectPool<TestObject>({
        create: createTestObject,
        initialSize: 1,
        maxSize: 1,
      })
    );

    let obj1: TestObject | null = null;
    act(() => {
      obj1 = result.current.acquire();
    });

    expect(obj1).not.toBeNull();

    // Second acquire should return null
    let obj2: TestObject | null = null;
    act(() => {
      obj2 = result.current.acquire();
    });

    expect(obj2).toBeNull();

    // After release, should be able to acquire again
    act(() => {
      result.current.release(obj1!);
    });

    let obj3: TestObject | null = null;
    act(() => {
      obj3 = result.current.acquire();
    });

    expect(obj3).not.toBeNull();
  });
});
