import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundSynthesis } from '../../hooks/useSoundSynthesis';
import { useObjectPool, createProjectile, createEnemy, createParticle } from '../../hooks/useObjectPool';
import { useViewportCulling } from '../../hooks/useViewportCulling';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 30;
const BULLET_SPEED = 10;
const ENEMY_SPEED = 1;
const ENEMY_DESCENT = 20;
const WAVE_SIZE = 8;
const WAVE_ROWS = 5;
const POWER_UP_CHANCE = 0.05;
const BULLET_TIME_DURATION = 5000;

// Enemy types with Matrix theme
const ENEMY_TYPES = {
  code: { symbol: '01', health: 1, points: 10, speed: 1, color: '#00ff00' },
  agent: { symbol: 'A', health: 2, points: 30, speed: 1.5, color: '#00cc00' },
  sentinel: { symbol: 'S', health: 3, points: 50, speed: 1.2, color: '#009900' },
  virus: { symbol: 'V', health: 1, points: 20, speed: 2, color: '#ff0000', splits: true }
};

// Power-up types
// const POWER_UPS = {
//   rapidFire: { icon: '⚡', duration: 5000, color: '#ffff00' },
//   shield: { icon: '🛡️', duration: 8000, color: '#00ffff' },
//   timeSlow: { icon: '⏱️', duration: 5000, color: '#ff00ff' },
//   codeBomb: { icon: '💣', instant: true, color: '#ff8800' }
// };

// Player ship ASCII art
const PLAYER_SHIP = [
  "  ▲  ",
  " ███ ",
  "█████"
];

// Game state interface
interface GameState {
  player: {
    x: number;
    y: number;
    lives: number;
    powerUps: Record<string, number>;
  };
  score: number;
  wave: number;
  gameOver: boolean;
  paused: boolean;
  combo: number;
  highScore: number;
  bulletTimeActive: boolean;
  timeScale: number;
}

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface MatrixInvadersProps {
  achievementManager?: AchievementManager;
}

export default function MatrixInvaders({ achievementManager }: MatrixInvadersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastFireRef = useRef<number>(0);
  const matrixRainRef = useRef<{ x: number; y: number; char: string; speed: number }[]>([]);
  
  // State
  const [state, setState] = useState<GameState>({
    player: {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
      lives: 3,
      powerUps: {}
    },
    score: 0,
    wave: 1,
    gameOver: false,
    paused: false,
    combo: 0,
    highScore: parseInt(localStorage.getItem('matrixInvaders_highScore') || '0'),
    bulletTimeActive: false,
    timeScale: 1
  });
  
  // Hooks
  const { synthLaser, synthExplosion, synthDrum } = useSoundSynthesis();
  const projectilePool = useObjectPool({ create: createProjectile, maxSize: 100 });
  const enemyPool = useObjectPool({ create: createEnemy, maxSize: 100 });
  const particlePool = useObjectPool({ create: createParticle, maxSize: 500 });
  useViewportCulling(CANVAS_WIDTH, CANVAS_HEIGHT);
  const { trackDrawCall, trackActiveObjects, PerformanceOverlay } = usePerformanceMonitor({ showOverlay: false });
  
  // Initialize Matrix rain
  useEffect(() => {
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < 50; i++) {
      matrixRainRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        char: chars[Math.floor(Math.random() * chars.length)],
        speed: 1 + Math.random() * 2
      });
    }
  }, []);
  
  // Spawn enemies for new wave
  const spawnWave = useCallback(() => {
    const enemyTypes = Object.keys(ENEMY_TYPES);
    const waveEnemyType = state.wave <= 2 ? 'code' : 
                          state.wave <= 5 ? ['code', 'agent'][Math.floor(Math.random() * 2)] :
                          enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    for (let row = 0; row < WAVE_ROWS; row++) {
      for (let col = 0; col < WAVE_SIZE; col++) {
        const enemy = enemyPool.acquire();
        if (enemy) {
          const type = row === 0 && state.wave > 10 ? 'sentinel' : waveEnemyType;
          const enemyData = ENEMY_TYPES[type as keyof typeof ENEMY_TYPES];
          
          enemy.x = 50 + col * 80;
          enemy.y = 50 + row * 50;
          enemy.vx = ENEMY_SPEED * enemyData.speed;
          enemy.vy = 0;
          enemy.health = enemyData.health;
          enemy.maxHealth = enemyData.health;
          enemy.type = type;
          enemy.value = enemyData.points;
          enemy.width = 40;
          enemy.height = 30;
        }
      }
    }
  }, [state.wave, enemyPool]);
  
  // Fire bullet
  const fireBullet = useCallback((x: number, y: number, isEnemy: boolean = false) => {
    const bullet = projectilePool.acquire();
    if (bullet) {
      bullet.x = x;
      bullet.y = y;
      bullet.vx = 0;
      bullet.vy = isEnemy ? BULLET_SPEED / 2 : -BULLET_SPEED;
      bullet.type = isEnemy ? 'enemy' : 'player';
      bullet.damage = 1;
      
      synthLaser(isEnemy ? 500 : 1000, 100, 0.1);
    }
  }, [projectilePool, synthLaser]);
  
  // Create explosion particles
  const createExplosion = useCallback((x: number, y: number, color: string = '#00ff00') => {
    for (let i = 0; i < 20; i++) {
      const particle = particlePool.acquire();
      if (particle) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 2 + Math.random() * 3;
        
        particle.x = x;
        particle.y = y;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.life = 1;
        particle.maxLife = 1;
        particle.color = color;
        particle.size = 2 + Math.random() * 4;
      }
    }
    synthExplosion(0.5, 0.7);
  }, [particlePool, synthExplosion]);
  
  // Handle collisions
  const checkCollisions = useCallback(() => {
    const bullets = projectilePool.activeObjects;
    const enemies = enemyPool.activeObjects;
    
    // Check bullet-enemy collisions
    bullets.forEach(bullet => {
      if (bullet.type === 'player') {
        enemies.forEach(enemy => {
          if (bullet.active && enemy.active &&
              bullet.x < enemy.x + enemy.width &&
              bullet.x + bullet.width > enemy.x &&
              bullet.y < enemy.y + enemy.height &&
              bullet.y + bullet.height > enemy.y) {
            
            enemy.health -= bullet.damage;
            projectilePool.release(bullet);
            
            if (enemy.health <= 0) {
              setState(prev => ({
                ...prev,
                score: prev.score + enemy.value * (1 + prev.combo * 0.1),
                combo: prev.combo + 1
              }));
              
              createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              
              // Split virus enemies
              if (enemy.type === 'virus' && ENEMY_TYPES.virus.splits) {
                for (let i = 0; i < 2; i++) {
                  const newEnemy = enemyPool.acquire();
                  if (newEnemy) {
                    newEnemy.x = enemy.x + (i === 0 ? -20 : 20);
                    newEnemy.y = enemy.y;
                    newEnemy.type = 'code';
                    newEnemy.health = 1;
                    newEnemy.value = 5;
                    newEnemy.vx = enemy.vx;
                  }
                }
              }
              
              // Drop power-up chance
              if (Math.random() < POWER_UP_CHANCE) {
                // Power-up implementation would go here
              }
              
              enemyPool.release(enemy);
            } else {
              synthDrum({ type: 'hihat' });
            }
          }
        });
      }
    });
    
    // Check if all enemies defeated
    if (enemies.filter(e => e.active).length === 0) {
      setState(prev => ({ ...prev, wave: prev.wave + 1 }));
      spawnWave();
      
      // Achievement check
      if (state.wave === 5 && achievementManager) {
        achievementManager.unlockAchievement('matrixInvaders', 'invaders_wave_5');
      }
    }
  }, [projectilePool, enemyPool, state.wave, achievementManager, createExplosion, synthDrum, spawnWave]);
  
  // Update game state
  const updateGame = useCallback((deltaTime: number) => {
    if (state.gameOver || state.paused) return;
    
    const scaledDelta = deltaTime * state.timeScale;
    
    // Update bullets
    projectilePool.activeObjects.forEach(bullet => {
      bullet.y += bullet.vy * scaledDelta;
      if (bullet.y < 0 || bullet.y > CANVAS_HEIGHT) {
        projectilePool.release(bullet);
      }
    });
    
    // Update enemies
    let shouldDescend = false;
    enemyPool.activeObjects.forEach(enemy => {
      enemy.x += enemy.vx * scaledDelta;
      
      if (enemy.x <= 0 || enemy.x >= CANVAS_WIDTH - enemy.width) {
        shouldDescend = true;
      }
      
      // Enemy shooting
      if (Math.random() < 0.001 * state.wave) {
        fireBullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, true);
      }
    });
    
    if (shouldDescend) {
      enemyPool.activeObjects.forEach(enemy => {
        enemy.vx *= -1;
        enemy.y += ENEMY_DESCENT;
        
        // Game over if enemies reach player
        if (enemy.y + enemy.height >= state.player.y) {
          setState(prev => ({ ...prev, gameOver: true }));
        }
      });
    }
    
    // Update particles
    particlePool.activeObjects.forEach(particle => {
      particle.x += particle.vx * scaledDelta;
      particle.y += particle.vy * scaledDelta;
      particle.life -= 0.02 * scaledDelta;
      particle.alpha = particle.life;
      
      if (particle.life <= 0) {
        particlePool.release(particle);
      }
    });
    
    // Update Matrix rain
    matrixRainRef.current.forEach(drop => {
      drop.y += drop.speed * scaledDelta;
      if (drop.y > CANVAS_HEIGHT) {
        drop.y = -20;
        drop.x = Math.random() * CANVAS_WIDTH;
      }
    });
    
    // Check collisions
    checkCollisions();
    
    // Track performance
    trackActiveObjects(
      projectilePool.activeObjects.length + 
      enemyPool.activeObjects.length + 
      particlePool.activeObjects.length
    );
  }, [state, projectilePool, enemyPool, particlePool, checkCollisions, fireBullet, trackActiveObjects]);
  
  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    trackDrawCall();
    
    // Draw Matrix rain
    ctx.font = '14px monospace';
    ctx.fillStyle = '#003300';
    matrixRainRef.current.forEach(drop => {
      ctx.fillText(drop.char, drop.x, drop.y);
    });
    trackDrawCall();
    
    // Draw particles
    particlePool.activeObjects.forEach(particle => {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
    trackDrawCall();
    
    // Draw enemies
    ctx.font = '20px monospace';
    enemyPool.activeObjects.forEach(enemy => {
      const enemyData = ENEMY_TYPES[enemy.type as keyof typeof ENEMY_TYPES];
      ctx.fillStyle = enemyData.color;
      ctx.fillText(enemyData.symbol, enemy.x + 10, enemy.y + 20);
      
      // Health bar for multi-hit enemies
      if (enemy.maxHealth > 1) {
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x, enemy.y - 5, enemy.width, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(enemy.x, enemy.y - 5, enemy.width * healthPercent, 3);
      }
    });
    trackDrawCall();
    
    // Draw bullets
    ctx.fillStyle = '#00ff00';
    projectilePool.activeObjects.forEach(bullet => {
      if (bullet.type === 'player') {
        ctx.fillRect(bullet.x, bullet.y, 3, 10);
      } else {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(bullet.x, bullet.y, 3, 6);
        ctx.fillStyle = '#00ff00';
      }
    });
    trackDrawCall();
    
    // Draw player
    if (!state.gameOver) {
      ctx.fillStyle = state.player.powerUps.shield ? '#00ffff' : '#00ff00';
      ctx.font = '12px monospace';
      PLAYER_SHIP.forEach((line, i) => {
        ctx.fillText(line, state.player.x, state.player.y + i * 10);
      });
      
      // Shield effect
      if (state.player.powerUps.shield) {
        ctx.strokeStyle = '#00ffff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(state.player.x + PLAYER_WIDTH / 2, state.player.y + PLAYER_HEIGHT / 2, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    trackDrawCall();
    
    // Draw HUD
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px monospace';
    ctx.fillText(`SCORE: ${state.score}`, 10, 30);
    ctx.fillText(`WAVE: ${state.wave}`, 10, 50);
    ctx.fillText(`LIVES: ${state.player.lives}`, 10, 70);
    ctx.fillText(`COMBO: x${state.combo}`, 10, 90);
    
    if (state.highScore > 0) {
      ctx.fillText(`HIGH: ${state.highScore}`, CANVAS_WIDTH - 150, 30);
    }
    
    // Bullet time indicator
    if (state.bulletTimeActive) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillText('BULLET TIME ACTIVE', CANVAS_WIDTH / 2 - 80, 30);
    }
    
    trackDrawCall();
  }, [state, projectilePool, enemyPool, particlePool, trackDrawCall]);
  
  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = timestamp - (animationFrameRef.current || timestamp);
    animationFrameRef.current = timestamp;
    
    updateGame(deltaTime * 0.06); // Normalize to ~60fps
    render();
    
    if (!state.gameOver && !state.paused) {
      requestAnimationFrame(gameLoop);
    }
  }, [updateGame, render, state.gameOver, state.paused]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      
      if (e.key === ' ' && !state.gameOver && !state.paused) {
        const now = Date.now();
        const fireRate = state.player.powerUps.rapidFire ? 100 : 250;
        
        if (now - lastFireRef.current > fireRate) {
          fireBullet(state.player.x + PLAYER_WIDTH / 2, state.player.y);
          lastFireRef.current = now;
        }
      }
      
      if (e.key === 'b' && !state.bulletTimeActive) {
        setState(prev => ({ 
          ...prev, 
          bulletTimeActive: true,
          timeScale: 0.3
        }));
        
        setTimeout(() => {
          setState(prev => ({ 
            ...prev, 
            bulletTimeActive: false,
            timeScale: 1
          }));
        }, BULLET_TIME_DURATION);
      }
      
      if (e.key === 'p') {
        setState(prev => ({ ...prev, paused: !prev.paused }));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state, fireBullet]);
  
  // Update player position
  useEffect(() => {
    const updatePlayer = () => {
      if (state.gameOver || state.paused) return;
      
      setState(prev => {
        let newX = prev.player.x;
        
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
          newX = Math.max(0, newX - PLAYER_SPEED);
        }
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
          newX = Math.min(CANVAS_WIDTH - PLAYER_WIDTH, newX + PLAYER_SPEED);
        }
        
        return {
          ...prev,
          player: { ...prev.player, x: newX }
        };
      });
    };
    
    const interval = setInterval(updatePlayer, 16);
    return () => clearInterval(interval);
  }, [state.gameOver, state.paused]);
  
  // Start game
  useEffect(() => {
    if (!state.gameOver && !state.paused) {
      spawnWave();
      requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.gameOver, state.paused, gameLoop, spawnWave]);
  
  // Save high score
  useEffect(() => {
    if (state.score > state.highScore) {
      localStorage.setItem('matrixInvaders_highScore', state.score.toString());
    }
  }, [state.score, state.highScore]);
  
  // Reset game
  const resetGame = useCallback(() => {
    projectilePool.releaseAll();
    enemyPool.releaseAll();
    particlePool.releaseAll();
    
    setState({
      player: {
        x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
        y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
        lives: 3,
        powerUps: {}
      },
      score: 0,
      wave: 1,
      gameOver: false,
      paused: false,
      combo: 0,
      highScore: parseInt(localStorage.getItem('matrixInvaders_highScore') || '0'),
      bulletTimeActive: false,
      timeScale: 1
    });
    
    spawnWave();
    requestAnimationFrame(gameLoop);
  }, [projectilePool, enemyPool, particlePool, spawnWave, gameLoop]);
  
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.5)]"
        />
        
        {/* Game Over Overlay */}
        <AnimatePresence>
          {state.gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80"
            >
              <div className="text-center">
                <h2 className="text-4xl font-mono text-green-500 mb-4">GAME OVER</h2>
                <p className="text-2xl font-mono text-green-400 mb-2">Score: {state.score}</p>
                <p className="text-xl font-mono text-green-400 mb-6">Wave: {state.wave}</p>
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-green-500 text-black font-mono rounded hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto"
                >
                  <RotateCw className="w-5 h-5" />
                  RESTART
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pause Overlay */}
        <AnimatePresence>
          {state.paused && !state.gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60"
            >
              <div className="text-center">
                <h2 className="text-4xl font-mono text-green-500 mb-4">PAUSED</h2>
                <p className="text-xl font-mono text-green-400">Press P to Resume</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Controls */}
        <div className="mt-4 text-center">
          <p className="text-green-400 font-mono text-sm">
            MOVE: ← → or A/D | FIRE: SPACE | BULLET TIME: B | PAUSE: P
          </p>
        </div>
      </div>
      
      <PerformanceOverlay />
    </div>
  );
}