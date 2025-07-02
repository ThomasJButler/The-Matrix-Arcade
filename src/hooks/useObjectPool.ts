import { useRef, useCallback } from 'react';

interface PoolableObject {
  active: boolean;
  reset?: () => void;
}

interface ObjectPoolOptions<T> {
  create: () => T;
  reset?: (obj: T) => void;
  initialSize?: number;
  maxSize?: number;
  expandSize?: number;
}

export function useObjectPool<T extends PoolableObject>({
  create,
  reset,
  initialSize = 10,
  maxSize = 1000,
  expandSize = 10
}: ObjectPoolOptions<T>) {
  const poolRef = useRef<T[]>([]);
  const activeRef = useRef<T[]>([]);
  const sizeRef = useRef(0);

  // Initialize pool
  const initializePool = useCallback(() => {
    if (poolRef.current.length === 0) {
      for (let i = 0; i < initialSize; i++) {
        const obj = create();
        obj.active = false;
        poolRef.current.push(obj);
      }
      sizeRef.current = initialSize;
    }
  }, [create, initialSize]);

  // Expand pool when needed
  const expandPool = useCallback(() => {
    const currentSize = sizeRef.current;
    if (currentSize >= maxSize) return;

    const expandBy = Math.min(expandSize, maxSize - currentSize);
    
    for (let i = 0; i < expandBy; i++) {
      const obj = create();
      obj.active = false;
      poolRef.current.push(obj);
    }
    
    sizeRef.current += expandBy;
  }, [create, expandSize, maxSize]);

  // Get object from pool
  const acquire = useCallback((): T | null => {
    initializePool();

    // Find inactive object
    let obj = poolRef.current.find(o => !o.active);
    
    // If no inactive objects, try to expand pool
    if (!obj) {
      expandPool();
      obj = poolRef.current.find(o => !o.active);
    }
    
    // If still no object available, return null
    if (!obj) return null;
    
    // Activate and track object
    obj.active = true;
    activeRef.current.push(obj);
    
    // Reset object state
    if (reset) {
      reset(obj);
    } else if (obj.reset) {
      obj.reset();
    }
    
    return obj;
  }, [initializePool, expandPool, reset]);

  // Return object to pool
  const release = useCallback((obj: T) => {
    if (!obj || !obj.active) return;
    
    obj.active = false;
    
    // Remove from active list
    const index = activeRef.current.indexOf(obj);
    if (index > -1) {
      activeRef.current.splice(index, 1);
    }
    
    // Reset object state
    if (reset) {
      reset(obj);
    } else if (obj.reset) {
      obj.reset();
    }
  }, [reset]);

  // Release all active objects
  const releaseAll = useCallback(() => {
    activeRef.current.forEach(obj => {
      obj.active = false;
      if (reset) {
        reset(obj);
      } else if (obj.reset) {
        obj.reset();
      }
    });
    activeRef.current = [];
  }, [reset]);

  // Get pool statistics
  const getStats = useCallback(() => ({
    total: sizeRef.current,
    active: activeRef.current.length,
    available: poolRef.current.filter(o => !o.active).length,
    utilization: (activeRef.current.length / sizeRef.current) * 100
  }), []);

  // Pre-warm pool
  const prewarm = useCallback((count: number) => {
    const needed = count - poolRef.current.length;
    if (needed <= 0) return;
    
    const toCreate = Math.min(needed, maxSize - sizeRef.current);
    for (let i = 0; i < toCreate; i++) {
      const obj = create();
      obj.active = false;
      poolRef.current.push(obj);
    }
    sizeRef.current += toCreate;
  }, [create, maxSize]);

  return {
    acquire,
    release,
    releaseAll,
    getStats,
    prewarm,
    activeObjects: activeRef.current
  };
}

// Specialized particle pool
export interface Particle extends PoolableObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  reset: () => void;
}

export function createParticle(): Particle {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 4,
    color: '#00ff00',
    alpha: 1,
    reset() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.life = 0;
      this.maxLife = 1;
      this.size = 4;
      this.color = '#00ff00';
      this.alpha = 1;
    }
  };
}

// Specialized projectile pool
export interface Projectile extends PoolableObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  width: number;
  height: number;
  type: string;
  reset: () => void;
}

export function createProjectile(): Projectile {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    damage: 1,
    width: 4,
    height: 10,
    type: 'bullet',
    reset() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.damage = 1;
      this.width = 4;
      this.height = 10;
      this.type = 'bullet';
    }
  };
}

// Specialized enemy pool
export interface Enemy extends PoolableObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  width: number;
  height: number;
  type: string;
  value: number;
  reset: () => void;
}

export function createEnemy(): Enemy {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    health: 1,
    maxHealth: 1,
    width: 32,
    height: 32,
    type: 'basic',
    value: 10,
    reset() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.health = 1;
      this.maxHealth = 1;
      this.width = 32;
      this.height = 32;
      this.type = 'basic';
      this.value = 10;
    }
  };
}