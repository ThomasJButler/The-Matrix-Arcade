/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Space Invaders-style shooter with wave-based progression, power-ups,
 *              combo system, and particle effects. Uses object pooling for performance.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundSynthesis } from '../../hooks/useSoundSynthesis';
import { useObjectPool, createProjectile, createEnemy, createParticle } from '../../hooks/useObjectPool';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { useSaveSystem } from '../../hooks/useSaveSystem';
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
const BULLET_TIME_DURATION = 5000;

// Enemy types with Matrix theme
const ENEMY_TYPES = {
  code: { symbol: '01', health: 1, points: 10, speed: 1, color: '#00ff00' },
  agent: { symbol: 'A', health: 2, points: 30, speed: 1.5, color: '#00cc00' },
  sentinel: { symbol: 'S', health: 3, points: 50, speed: 1.2, color: '#009900' },
  virus: { symbol: 'V', health: 1, points: 20, speed: 2, color: '#ff0000', splits: true },
  boss: { symbol: '▓█▓', health: 50, points: 500, speed: 0.5, color: '#ff00ff', isBoss: true }
};

// Power-up types (scaffolding exists in state.player.powerUps for future implementation)

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
    health: number;
    maxHealth: number;
    powerUps: Record<string, number>;
    invulnerable: boolean;
    lastHitTime: number;
  };
  score: number;
  wave: number;
  menu: boolean;
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
  isMuted?: boolean;
}

export default function MatrixInvaders({ achievementManager, isMuted = false }: MatrixInvadersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastFireRef = useRef<number>(0);
  const matrixRainRef = useRef<{ x: number; y: number; char: string; speed: number }[]>([]);
  const renderTimeRef = useRef<number>(0); // Track animation time for render effects
  
  // State
  const [state, setState] = useState<GameState>({
    player: {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
      health: 100,
      maxHealth: 100,
      powerUps: {},
      invulnerable: false,
      lastHitTime: 0
    },
    score: 0,
    wave: 1,
    menu: true,
    gameOver: false,
    paused: false,
    combo: 0,
    highScore: 0,
    bulletTimeActive: false,
    timeScale: 1
  });

  // Hooks
  const { synthLaser, synthExplosion, synthDrum } = useSoundSynthesis();
  const projectilePool = useObjectPool({ create: createProjectile, maxSize: 100 });
  const enemyPool = useObjectPool({ create: createEnemy, maxSize: 100 });
  const particlePool = useObjectPool({ create: createParticle, maxSize: 500 });
  const { trackDrawCall, trackActiveObjects, PerformanceOverlay } = usePerformanceMonitor({ showOverlay: false });
  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();

  // Session tracking
  const sessionStartTimeRef = useRef<number>(Date.now());
  const maxWaveRef = useRef(0);
  const maxComboRef = useRef(0);
  const enemiesKilledRef = useRef(0);
  // Achievement tracking
  const bulletTimeUsedRef = useRef(0);
  const waveDamageTakenRef = useRef(false);  // Track if damage taken this wave
  const bulletTimeAchievementUnlockedRef = useRef(false);
  const perfectWaveAchievementUnlockedRef = useRef(false);
  const highScoreAchievementUnlockedRef = useRef(false);
  const bossDefeatedRef = useRef(false);  // Track if a boss has been defeated this session
  const bossAchievementUnlockedRef = useRef(false);  // Track if boss defeat achievement unlocked

  // Timeout tracking for cleanup (prevents memory leaks)
  const invulnerabilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulletTimeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waveSpawnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveGameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync high score from useSaveSystem on mount
  useEffect(() => {
    const savedHighScore = saveData.games.matrixInvaders?.highScore || 0;
    if (savedHighScore > 0) {
      setState(prev => ({ ...prev, highScore: savedHighScore }));
    }
  }, [saveData.games.matrixInvaders?.highScore]);

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
  
  // Check if a wave is a boss wave (every 5 waves)
  const isBossWave = useCallback((wave: number): boolean => {
    return wave > 0 && wave % 5 === 0;
  }, []);

  // Spawn boss enemy for boss waves
  const spawnBoss = useCallback((wave: number) => {
    const boss = enemyPool.acquire();
    if (boss) {
      const bossData = ENEMY_TYPES.boss;
      // Boss health scales with wave number (base 50 + 10 per boss encounter)
      const bossHealthMultiplier = Math.floor(wave / 5);
      const scaledHealth = bossData.health + (bossHealthMultiplier - 1) * 10;

      boss.x = CANVAS_WIDTH / 2 - 60;  // Centre the boss
      boss.y = 80;
      boss.vx = ENEMY_SPEED * bossData.speed;
      boss.vy = 0;
      boss.health = scaledHealth;
      boss.maxHealth = scaledHealth;
      boss.type = 'boss';
      boss.value = bossData.points * bossHealthMultiplier;  // Scale points with difficulty
      boss.width = 120;  // Larger hitbox for boss
      boss.height = 60;
    }
  }, [enemyPool]);

  // Spawn enemies for new wave
  const spawnWave = useCallback((wave: number) => {
    // Boss waves spawn a boss instead of regular enemies
    if (isBossWave(wave)) {
      spawnBoss(wave);
      return;
    }

    const enemyTypes = Object.keys(ENEMY_TYPES).filter(t => t !== 'boss');  // Exclude boss from random spawns
    const waveEnemyType = wave <= 2 ? 'code' :
                          wave <= 5 ? ['code', 'agent'][Math.floor(Math.random() * 2)] :
                          enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

    for (let row = 0; row < WAVE_ROWS; row++) {
      for (let col = 0; col < WAVE_SIZE; col++) {
        const enemy = enemyPool.acquire();
        if (enemy) {
          const type = row === 0 && wave > 10 ? 'sentinel' : waveEnemyType;
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
  }, [enemyPool, isBossWave, spawnBoss]);
  
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
      
      if (!isMuted) {
        synthLaser(isEnemy ? 500 : 1000, 100, 0.1);
      }
    }
  }, [projectilePool, synthLaser, isMuted]);
  
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
    if (!isMuted) {
      synthExplosion(0.5, 0.7);
    }
  }, [particlePool, synthExplosion, isMuted]);
  
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
              setState(prev => {
                const newCombo = prev.combo + 1;
                maxComboRef.current = Math.max(maxComboRef.current, newCombo);
                return {
                  ...prev,
                  score: prev.score + enemy.value * (1 + prev.combo * 0.1),
                  combo: newCombo
                };
              });

              enemiesKilledRef.current += 1;

              // Boss defeats get a massive explosion
              if (enemy.type === 'boss') {
                // Multiple explosions for dramatic effect
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff00ff');
                createExplosion(enemy.x + 20, enemy.y + 20, '#ff00ff');
                createExplosion(enemy.x + enemy.width - 20, enemy.y + 20, '#ff00ff');
                createExplosion(enemy.x + enemy.width / 2, enemy.y + 10, '#ffffff');
              } else {
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              }

              // Achievements
              if (achievementManager) {
                // First kill achievement
                if (enemiesKilledRef.current === 1) {
                  achievementManager.unlockAchievement('matrixInvaders', 'invaders_first_kill');
                  unlockSaveAchievement('matrixInvaders', 'invaders_first_kill');
                }

                // 100 enemies achievement
                if (enemiesKilledRef.current >= 100) {
                  achievementManager.unlockAchievement('matrixInvaders', 'invaders_100_enemies');
                  unlockSaveAchievement('matrixInvaders', 'invaders_100_enemies');
                }

                // Boss defeat achievement
                if (enemy.type === 'boss' && !bossAchievementUnlockedRef.current) {
                  bossDefeatedRef.current = true;
                  bossAchievementUnlockedRef.current = true;
                  achievementManager.unlockAchievement('matrixInvaders', 'invaders_boss_defeat');
                  unlockSaveAchievement('matrixInvaders', 'invaders_boss_defeat');
                }
              }

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

              // Power-up drop scaffolding - state.player.powerUps ready for future use

              enemyPool.release(enemy);
            } else {
              if (!isMuted) {
                synthDrum({ type: 'hihat' });
              }
            }
          }
        });
      } else if (bullet.type === 'enemy') {
        // Check enemy bullet-player collision
        if (!state.player.invulnerable && bullet.active &&
            bullet.x < state.player.x + PLAYER_WIDTH &&
            bullet.x + bullet.width > state.player.x &&
            bullet.y < state.player.y + PLAYER_HEIGHT &&
            bullet.y + bullet.height > state.player.y) {

          // Player takes damage - mark that damage was taken this wave
          waveDamageTakenRef.current = true;

          setState(prev => {
            const newHealth = Math.max(0, prev.player.health - 5);
            return {
              ...prev,
              player: {
                ...prev.player,
                health: newHealth,
                invulnerable: true,
                lastHitTime: Date.now()
              },
              gameOver: newHealth <= 0,
              combo: 0 // Reset combo on hit
            };
          });

          // Visual feedback for damage
          createExplosion(state.player.x + PLAYER_WIDTH / 2, state.player.y + PLAYER_HEIGHT / 2, '#ff0000');
          if (!isMuted) {
            synthExplosion(0.3, 0.5);
          }

          // Remove the bullet
          projectilePool.release(bullet);

          // Clear any existing invulnerability timer
          if (invulnerabilityTimeoutRef.current) {
            clearTimeout(invulnerabilityTimeoutRef.current);
          }

          // Set invulnerability timer
          invulnerabilityTimeoutRef.current = setTimeout(() => {
            setState(prev => ({
              ...prev,
              player: {
                ...prev.player,
                invulnerable: false
              }
            }));
            invulnerabilityTimeoutRef.current = null;
          }, 500); // 0.5 seconds of invulnerability
        }
      }
    });

    // Check if all enemies defeated
    if (enemies.filter(e => e.active).length === 0) {
      setState(prev => {
        const newWave = prev.wave + 1;
        maxWaveRef.current = Math.max(maxWaveRef.current, newWave);

        // Clear any existing wave spawn timeout
        if (waveSpawnTimeoutRef.current) {
          clearTimeout(waveSpawnTimeoutRef.current);
        }

        // Spawn next wave after state update
        waveSpawnTimeoutRef.current = setTimeout(() => {
          spawnWave(newWave);
          waveSpawnTimeoutRef.current = null;
        }, 100);
        // Reset health on new wave
        return {
          ...prev,
          wave: newWave,
          player: {
            ...prev.player,
            health: 100 // Full health restore on wave completion
          }
        };
      });

      // Achievement checks
      if (achievementManager) {
        if (state.wave === 5) {
          achievementManager.unlockAchievement('matrixInvaders', 'invaders_wave_5');
          unlockSaveAchievement('matrixInvaders', 'invaders_wave_5');
        }
        if (state.wave === 10) {
          achievementManager.unlockAchievement('matrixInvaders', 'invaders_wave_10');
          unlockSaveAchievement('matrixInvaders', 'invaders_wave_10');
        }
        if (state.wave === 20) {
          achievementManager.unlockAchievement('matrixInvaders', 'invaders_endless');
          unlockSaveAchievement('matrixInvaders', 'invaders_endless');
        }

        // Perfect wave achievement: Complete a wave without taking damage
        if (!waveDamageTakenRef.current && !perfectWaveAchievementUnlockedRef.current && state.wave > 1) {
          perfectWaveAchievementUnlockedRef.current = true;
          achievementManager.unlockAchievement('matrixInvaders', 'invaders_perfect_wave');
          unlockSaveAchievement('matrixInvaders', 'invaders_perfect_wave');
        }
      }

      // Reset damage tracking for next wave
      waveDamageTakenRef.current = false;
    }
  }, [projectilePool, enemyPool, state.wave, state.player, achievementManager, unlockSaveAchievement, createExplosion, synthDrum, synthExplosion, spawnWave, isMuted]);
  
  // Update game state
  const updateGame = useCallback((deltaTime: number) => {
    if (state.menu || state.gameOver || state.paused) return;
    
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

      // Enemy shooting - reduced firing rate for better gameplay balance
      if (enemy.type === 'boss') {
        // Boss fires more frequently and from multiple positions
        if (Math.random() < 0.002) {
          // Fire from left side
          fireBullet(enemy.x + 20, enemy.y + enemy.height, true);
        }
        if (Math.random() < 0.002) {
          // Fire from centre
          fireBullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, true);
        }
        if (Math.random() < 0.002) {
          // Fire from right side
          fireBullet(enemy.x + enemy.width - 20, enemy.y + enemy.height, true);
        }
      } else if (Math.random() < 0.0003 * Math.min(state.wave, 10)) { // Cap at wave 10 to prevent overwhelming fire
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
  
  // Render game - accepts timestamp from RAF for consistent animations
  const render = useCallback((timestamp: number) => {
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

      // Boss enemies have special rendering
      if (enemy.type === 'boss') {
        // Draw boss with larger font and glow effect
        ctx.font = '32px monospace';
        ctx.fillStyle = enemyData.color;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
        ctx.fillText(enemyData.symbol, enemy.x + 20, enemy.y + 35);
        ctx.shadowBlur = 0;

        // Large health bar for boss
        const healthPercent = enemy.health / enemy.maxHealth;
        const barWidth = enemy.width;
        const barHeight = 8;
        const barX = enemy.x;
        const barY = enemy.y - 15;

        // Health bar background
        ctx.fillStyle = '#330000';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health bar fill with colour gradient based on health
        if (healthPercent > 0.5) {
          ctx.fillStyle = '#ff00ff';  // Magenta when healthy
        } else if (healthPercent > 0.25) {
          ctx.fillStyle = '#ff6600';  // Orange when damaged
        } else {
          ctx.fillStyle = '#ff0000';  // Red when critical
        }
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Health bar border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Boss label
        ctx.font = '10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('BOSS', barX + barWidth / 2 - 15, barY - 3);

        ctx.font = '20px monospace';  // Reset font
      } else {
        // Regular enemy rendering
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
      // Flash effect during invulnerability - using RAF timestamp for frame-rate independent animation
      if (state.player.invulnerable) {
        ctx.globalAlpha = Math.sin(timestamp * 0.01) > 0 ? 0.3 : 1;
      }

      ctx.fillStyle = state.player.powerUps?.shield ? '#00ffff' : '#00ff00';
      ctx.font = '12px monospace';
      PLAYER_SHIP.forEach((line, i) => {
        ctx.fillText(line, state.player.x, state.player.y + i * 10);
      });

      ctx.globalAlpha = 1;

      // Shield effect
      if (state.player.powerUps?.shield) {
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
    // Draw health bar at the TOP
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px monospace';
    ctx.fillText('HEALTH:', 10, 30);
    const healthBarX = 85;
    const healthBarY = 18;
    const healthBarWidth = 200;
    const healthBarHeight = 15;
    const healthPercent = state.player.health / state.player.maxHealth;

    // Health bar background
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Health bar fill (color based on health)
    if (healthPercent > 0.5) {
      ctx.fillStyle = '#00ff00'; // Green
    } else if (healthPercent > 0.25) {
      ctx.fillStyle = '#ffff00'; // Yellow
    } else {
      ctx.fillStyle = '#ff0000'; // Red
      // Pulse effect when critical health - using RAF timestamp for frame-rate independent animation
      const pulse = Math.sin(timestamp * 0.005) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
    }

    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    ctx.globalAlpha = 1;

    // Health percentage text
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`${Math.floor(healthPercent * 100)}%`, healthBarX + healthBarWidth + 10, 30);

    // Other HUD elements below health bar
    ctx.font = '16px monospace';
    ctx.fillText(`SCORE: ${state.score}`, 10, 60);
    ctx.fillText(`WAVE: ${state.wave}`, 10, 80);
    ctx.fillText(`COMBO: x${state.combo}`, 10, 100);

    if (state.highScore > 0) {
      ctx.fillText(`HIGH: ${state.highScore}`, CANVAS_WIDTH - 150, 60);
    }

    // Bullet time indicator (moved lower to avoid health bar)
    if (state.bulletTimeActive) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillText('BULLET TIME ACTIVE', CANVAS_WIDTH / 2 - 80, 60);
    }

    // Wave complete message when health resets
    if (state.player.health === 100 && state.wave > 1 && Date.now() - state.player.lastHitTime < 2000) {
      ctx.fillStyle = '#00ff00';
      ctx.font = '24px monospace';
      ctx.fillText('WAVE COMPLETE - HEALTH RESTORED!', CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2 - 100);

      // Boss wave incoming warning
      if (isBossWave(state.wave)) {
        ctx.fillStyle = '#ff00ff';
        ctx.font = '28px monospace';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 20;
        ctx.fillText('⚠ BOSS INCOMING ⚠', CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT / 2 - 60);
        ctx.shadowBlur = 0;
      }
    }
    
    trackDrawCall();
  }, [state, projectilePool, enemyPool, particlePool, trackDrawCall]);
  
  // Update player position - integrated into main loop for consistent timing
  const updatePlayer = useCallback(() => {
    if (state.menu || state.gameOver || state.paused) return;

    setState(prev => {
      let newX = prev.player.x;

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newX = Math.max(0, newX - PLAYER_SPEED);
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newX = Math.min(CANVAS_WIDTH - PLAYER_WIDTH, newX + PLAYER_SPEED);
      }

      // Only update if position changed to avoid unnecessary re-renders
      if (newX === prev.player.x) return prev;

      return {
        ...prev,
        player: { ...prev.player, x: newX }
      };
    });
  }, [state.menu, state.gameOver, state.paused]);

  // Game loop - uses RAF timestamp for all timing to ensure frame-rate independent behaviour
  const gameLoop = useCallback(() => {
    let animationId: number;

    const loop = (timestamp: number) => {
      const deltaTime = timestamp - (animationFrameRef.current || timestamp);
      animationFrameRef.current = timestamp;
      renderTimeRef.current = timestamp;

      // Update player position in main loop (replaces setInterval)
      updatePlayer();

      updateGame(deltaTime * 0.06); // Normalize to ~60fps
      render(timestamp); // Pass timestamp for frame-rate independent animations

      if (!state.gameOver && !state.paused) {
        animationId = requestAnimationFrame(loop);
      }
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [updateGame, updatePlayer, render, state.gameOver, state.paused]);

  // Start game from menu
  const startGame = useCallback(() => {
    setState(prev => ({ ...prev, menu: false }));
    spawnWave(1);
    sessionStartTimeRef.current = Date.now();
  }, [spawnWave]);

  // Reset game
  const resetGame = useCallback(() => {
    projectilePool.releaseAll();
    enemyPool.releaseAll();
    particlePool.releaseAll();

    setState({
      player: {
        x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
        y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
        health: 100,
        maxHealth: 100,
        powerUps: {},
        invulnerable: false,
        lastHitTime: 0
      },
      score: 0,
      wave: 1,
      menu: false,
      gameOver: false,
      paused: false,
      combo: 0,
      highScore: saveData.games.matrixInvaders?.highScore || 0,
      bulletTimeActive: false,
      timeScale: 1
    });

    // Reset session tracking
    sessionStartTimeRef.current = Date.now();
    maxWaveRef.current = 0;
    maxComboRef.current = 0;
    enemiesKilledRef.current = 0;
    // Reset achievement tracking for new session
    bulletTimeUsedRef.current = 0;
    waveDamageTakenRef.current = false;
    bossDefeatedRef.current = false;
    // Note: Don't reset achievement unlocked flags - they persist across sessions via save system

    spawnWave(1);
  }, [projectilePool, enemyPool, particlePool, spawnWave, saveData.games.matrixInvaders?.highScore]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      
      if (e.key === ' ' && !state.menu && !state.gameOver && !state.paused) {
        const now = Date.now();
        const fireRate = state.player.powerUps?.rapidFire ? 100 : 250;
        
        if (now - lastFireRef.current > fireRate) {
          fireBullet(state.player.x + PLAYER_WIDTH / 2, state.player.y);
          lastFireRef.current = now;
        }
      }
      
      if (e.key === 'b' && !state.menu && !state.gameOver && !state.bulletTimeActive) {
        // Track bullet time usage for achievement
        bulletTimeUsedRef.current += 1;

        // Unlock achievement when bullet time is used 5 times
        if (bulletTimeUsedRef.current >= 5 && !bulletTimeAchievementUnlockedRef.current && achievementManager) {
          bulletTimeAchievementUnlockedRef.current = true;
          achievementManager.unlockAchievement('matrixInvaders', 'invaders_bullet_time');
          unlockSaveAchievement('matrixInvaders', 'invaders_bullet_time');
        }

        // Clear any existing bullet time timeout
        if (bulletTimeTimeoutRef.current) {
          clearTimeout(bulletTimeTimeoutRef.current);
        }

        setState(prev => ({
          ...prev,
          bulletTimeActive: true,
          timeScale: 0.3
        }));

        bulletTimeTimeoutRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            bulletTimeActive: false,
            timeScale: 1
          }));
          bulletTimeTimeoutRef.current = null;
        }, BULLET_TIME_DURATION);
      }
      
      if (e.key === 'p' && !state.menu && !state.gameOver) {
        setState(prev => ({ ...prev, paused: !prev.paused }));
      }

      // R key to restart when game over
      if ((e.key === 'r' || e.key === 'R') && state.gameOver) {
        resetGame();
      }

      // ENTER key to start from menu or restart from game over
      if (e.key === 'Enter') {
        if (state.menu) {
          startGame();
        } else if (state.gameOver) {
          resetGame();
        }
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
  }, [state, fireBullet, resetGame, startGame]);
  
  
  // Start game and handle restart
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (!state.menu && !state.gameOver && !state.paused) {
      // Initial spawn only if there are no active enemies
      if (enemyPool.activeObjects.length === 0) {
        spawnWave(state.wave);
      }
      cleanup = gameLoop();
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [state.menu, state.gameOver, state.paused, state.wave, enemyPool, spawnWave, gameLoop]);
  
  // Save game stats on game over
  useEffect(() => {
    if (state.gameOver) {
      // Session time tracked but not currently displayed in game over screen
      const currentHighScore = saveData.games.matrixInvaders?.highScore || 0;
      const newHighScore = Math.max(currentHighScore, state.score);
      const previousGamesPlayed = saveData.games.matrixInvaders?.stats?.gamesPlayed || 0;
      const previousTotalScore = saveData.games.matrixInvaders?.stats?.totalScore || 0;
      const previousBestWave = saveData.games.matrixInvaders?.stats?.bestWave || 0;
      const previousTotalKills = saveData.games.matrixInvaders?.stats?.totalKills || 0;
      const previousBestCombo = saveData.games.matrixInvaders?.stats?.bestCombo || 0;

      // Clear any existing save game timeout
      if (saveGameTimeoutRef.current) {
        clearTimeout(saveGameTimeoutRef.current);
      }

      saveGameTimeoutRef.current = setTimeout(() => {
        updateGameSave('matrixInvaders', {
          highScore: newHighScore,
          level: state.wave,
          stats: {
            gamesPlayed: previousGamesPlayed + 1,
            totalScore: previousTotalScore + state.score,
            bestWave: Math.max(previousBestWave, maxWaveRef.current),
            totalKills: previousTotalKills + enemiesKilledRef.current,
            bestCombo: Math.max(previousBestCombo, maxComboRef.current)
          }
        });
        saveGameTimeoutRef.current = null;
      }, 100);

      // Combo achievement: Get 10x combo
      if (maxComboRef.current >= 10 && achievementManager) {
        achievementManager.unlockAchievement('matrixInvaders', 'invaders_combo_10');
        unlockSaveAchievement('matrixInvaders', 'invaders_combo_10');
      }

      // High score achievement: Score over 10,000 points
      if (state.score >= 10000 && !highScoreAchievementUnlockedRef.current && achievementManager) {
        highScoreAchievementUnlockedRef.current = true;
        achievementManager.unlockAchievement('matrixInvaders', 'invaders_high_score');
        unlockSaveAchievement('matrixInvaders', 'invaders_high_score');
      }
    }
  }, [state.gameOver, state.score, state.wave, state.highScore, saveData, updateGameSave, achievementManager, unlockSaveAchievement]);

  // Cleanup all timeouts on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (invulnerabilityTimeoutRef.current) {
        clearTimeout(invulnerabilityTimeoutRef.current);
      }
      if (bulletTimeTimeoutRef.current) {
        clearTimeout(bulletTimeTimeoutRef.current);
      }
      if (waveSpawnTimeoutRef.current) {
        clearTimeout(waveSpawnTimeoutRef.current);
      }
      if (saveGameTimeoutRef.current) {
        clearTimeout(saveGameTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.5)]"
        />
        
        {/* Menu Overlay */}
        <AnimatePresence>
          {state.menu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/90"
            >
              <div className="text-center">
                <h1 className="text-5xl font-mono text-green-500 mb-4 drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]">
                  MATRIX INVADERS
                </h1>
                {state.highScore > 0 && (
                  <p className="text-xl font-mono text-green-400 mb-4">
                    High Score: {state.highScore}
                  </p>
                )}
                <div className="text-green-400 font-mono text-sm mb-6 space-y-1">
                  <p>MOVE: ← → or A/D</p>
                  <p>FIRE: SPACE</p>
                  <p>BULLET TIME: B</p>
                  <p>PAUSE: P</p>
                </div>
                <p className="text-2xl font-mono text-green-500 animate-pulse">
                  Press ENTER to Start
                </p>
                <button
                  onClick={startGame}
                  className="mt-4 px-6 py-3 bg-green-500 text-black font-mono rounded hover:bg-green-400 transition-colors"
                >
                  START GAME
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                <p className="text-xl font-mono text-green-400 mb-4">Wave: {state.wave}</p>
                {state.score > state.highScore && state.score > 0 && (
                  <p className="text-xl font-mono text-yellow-400 mb-4 animate-pulse">
                    NEW HIGH SCORE!
                  </p>
                )}
                <p className="text-lg font-mono text-green-400 mb-6">
                  Press R or ENTER to Restart
                </p>
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
        
        {/* Controls - only show during gameplay */}
        {!state.menu && (
          <div className="mt-4 text-center">
            <p className="text-green-400 font-mono text-sm">
              MOVE: ← → or A/D | FIRE: SPACE | BULLET TIME: B | PAUSE: P
            </p>
          </div>
        )}
      </div>
      
      <PerformanceOverlay />
    </div>
  );
}