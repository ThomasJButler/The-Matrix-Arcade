import { useState, useCallback, useEffect, useRef } from 'react';

export type Particle = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'food' | 'explosion' | 'trail' | 'powerup' | 'matrix' | 'impact';
  gravity?: number;
  fade?: boolean;
  glow?: boolean;
};

export type ParticleEmitter = {
  x: number;
  y: number;
  count: number;
  type: Particle['type'];
  color?: string;
  spread?: number;
  speed?: number;
  life?: number;
  size?: number;
};

const MAX_PARTICLES = 500;

export function useParticleSystem() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdCounter = useRef(0);

  // Create particles
  const emit = useCallback((emitter: ParticleEmitter) => {
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < emitter.count; i++) {
      const angle = (Math.PI * 2 * i) / emitter.count + (Math.random() - 0.5) * (emitter.spread || 0.5);
      const speed = (emitter.speed || 2) * (0.5 + Math.random() * 0.5);
      
      let color = emitter.color || '#00FF00';
      let size = emitter.size || 3;
      let life = emitter.life || 1;
      let gravity = 0;
      let fade = true;
      let glow = false;

      // Customize by type
      switch (emitter.type) {
        case 'food':
          color = emitter.color || '#FFD700';
          size = 2 + Math.random() * 2;
          speed *= 1.5;
          glow = true;
          break;
        
        case 'explosion':
          color = ['#FF0000', '#FF6600', '#FFFF00'][Math.floor(Math.random() * 3)];
          size = 4 + Math.random() * 4;
          speed *= 2;
          gravity = 0.3;
          glow = true;
          break;
        
        case 'trail':
          color = emitter.color || '#00FF0080';
          size = 2;
          life = 0.5;
          fade = true;
          break;
        
        case 'powerup':
          color = emitter.color || '#FFD700';
          size = 3 + Math.sin(Date.now() * 0.01) * 2;
          speed *= 0.5;
          glow = true;
          break;
        
        case 'matrix':
          color = '#00FF00';
          size = 1 + Math.random() * 2;
          speed = 0.5 + Math.random() * 2;
          gravity = -0.5;
          fade = false;
          break;
        
        case 'impact':
          color = '#FFFFFF';
          size = 5 + Math.random() * 5;
          speed *= 3;
          life = 0.3;
          glow = true;
          break;
      }

      newParticles.push({
        id: `particle-${particleIdCounter.current++}`,
        x: emitter.x,
        y: emitter.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        life,
        maxLife: life,
        color,
        type: emitter.type,
        gravity,
        fade,
        glow
      });
    }

    setParticles(prev => {
      const combined = [...prev, ...newParticles];
      // Keep only MAX_PARTICLES
      return combined.slice(-MAX_PARTICLES);
    });
  }, []);

  // Emit explosion effect
  const explode = useCallback((x: number, y: number, color?: string) => {
    emit({
      x,
      y,
      count: 20,
      type: 'explosion',
      color,
      spread: Math.PI * 2,
      speed: 5,
      life: 1
    });
  }, [emit]);

  // Emit food collection effect
  const collectFood = useCallback((x: number, y: number, color: string) => {
    emit({
      x,
      y,
      count: 15,
      type: 'food',
      color,
      spread: Math.PI * 2,
      speed: 3,
      life: 0.8
    });
  }, [emit]);

  // Emit power-up effect
  const activatePowerUp = useCallback((x: number, y: number, color: string) => {
    emit({
      x,
      y,
      count: 30,
      type: 'powerup',
      color,
      spread: Math.PI * 2,
      speed: 4,
      life: 1.5
    });
  }, [emit]);

  // Emit trail effect
  const createTrail = useCallback((x: number, y: number, color?: string) => {
    emit({
      x,
      y,
      count: 3,
      type: 'trail',
      color,
      spread: 0.5,
      speed: 0.5,
      life: 0.5
    });
  }, [emit]);

  // Emit matrix rain
  const createMatrixRain = useCallback((width: number) => {
    const x = Math.random() * width;
    emit({
      x,
      y: -10,
      count: 1,
      type: 'matrix',
      spread: 0,
      speed: 2,
      life: 3
    });
  }, [emit]);

  // Update particles
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(particle => {
            const newLife = particle.life - 0.016; // ~60fps
            if (newLife <= 0) return null;

            return {
              ...particle,
              x: particle.x + particle.vx,
              y: particle.y + particle.vy + (particle.gravity || 0),
              vy: particle.vy + (particle.gravity || 0),
              life: newLife,
              size: particle.fade 
                ? particle.size * (newLife / particle.maxLife)
                : particle.size
            };
          })
          .filter((p): p is Particle => p !== null)
      );
    }, 16);

    return () => clearInterval(updateInterval);
  }, []);

  // Clear all particles
  const clear = useCallback(() => {
    setParticles([]);
  }, []);

  // Render particles on canvas
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    particles.forEach(particle => {
      ctx.save();
      
      const opacity = particle.fade 
        ? particle.life / particle.maxLife
        : 1;
      
      if (particle.glow) {
        ctx.shadowBlur = particle.size * 2;
        ctx.shadowColor = particle.color;
      }
      
      ctx.fillStyle = particle.color.includes('rgba') 
        ? particle.color 
        : `${particle.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      
      if (particle.type === 'matrix') {
        // Render as matrix character
        ctx.font = `${particle.size * 10}px monospace`;
        ctx.fillText(
          String.fromCharCode(0x30A0 + Math.random() * 96),
          particle.x,
          particle.y
        );
      } else {
        // Render as circle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
  }, [particles]);

  return {
    particles,
    emit,
    explode,
    collectFood,
    activatePowerUp,
    createTrail,
    createMatrixRain,
    clear,
    render,
    count: particles.length
  };
}