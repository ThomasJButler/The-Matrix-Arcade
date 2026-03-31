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

// Game phase enum for state machine compliance
type GamePhase = 'menu' | 'playing' | 'paused' | 'gameOver';

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
  gamePhase: GamePhase;
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
  autoStart?: boolean;
}

export default function MatrixInvaders({ achievementManager, isMuted = false, autoStart = false }: MatrixInvadersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastFireRef = useRef<number>(0);
  const matrixRainRef = useRef<{ x: number; y: number; char: string; speed: number }[]>([]);
  const autoStartRef = useRef(autoStart);
  const renderTimeRef = useRef<number>(0); // Track animation time for render effects
  
  // State - auto-start directly into playing state if autoStart prop is true
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
    gamePhase: autoStart ? 'playing' : 'menu',
    combo: 0,
    highScore: 0,
    bulletTimeActive: false,
    timeScale: 1
  });
  const [hasFocus, setHasFocus] = useState(false);

  // Hooks
  const { synthLaser: playSynthLaser, synthExplosion: playSynthExplosion, synthDrum: playSynthDrum } = useSoundSynthesis();
  const projectilePool = useObjectPool({ create: createProjectile, maxSize: 100 });
  const enemyPool = useObjectPool({ create: createEnemy, maxSize: 100 });
  const particlePool = useObjectPool({ create: createParticle, maxSize: 500 });
  const { trackDrawCall, trackActiveObjects, PerformanceOverlay } = usePerformanceMonitor({ showOverlay: false });
  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();

  // Sound wrapper functions - encapsulate isMuted check for consistency
  const synthLaser = useCallback((freq: number, duration: number, volume: number) => {
    if (!isMuted) {
      playSynthLaser(freq, duration, volume);
    }
  }, [isMuted, playSynthLaser]);

  const synthExplosion = useCallback((volume: number, decay: number) => {
    if (!isMuted) {
      playSynthExplosion(volume, decay);
    }
  }, [isMuted, playSynthExplosion]);

  const synthDrum = useCallback((options: Parameters<typeof playSynthDrum>[0]) => {
    if (!isMuted) {
      playSynthDrum(options);
    }
  }, [isMuted, playSynthDrum]);

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

  // Stable refs for game loop callbacks — prevents useEffect re-registration every frame
  const updateGameRef = useRef<(dt: number) => void>(() => {});
  const updatePlayerRef = useRef<() => void>(() => {});
  const renderRef = useRef<(timestamp: number) => void>(() => {});
  const spawnWaveRef = useRef<(wave: number) => void>(() => {});
  const gamePhaseRef = useRef<GamePhase>(autoStart ? 'playing' : 'menu');
  const waveRef = useRef(1);
  const enemyPoolRef = useRef(enemyPool);
  const stateRef = useRef(state);
  const fireBulletRef = useRef<(x: number, y: number) => void>(() => {});
  const resetGameRef = useRef<() => void>(() => {});
  const startGameRef = useRef<() => void>(() => {});

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

              // Split virus enemies into two smaller code fragments
              if (enemy.type === 'virus' && ENEMY_TYPES.virus.splits) {
                for (let i = 0; i < 2; i++) {
                  const newEnemy = enemyPool.acquire();
                  if (newEnemy) {
                    newEnemy.x = Math.max(0, Math.min(CANVAS_WIDTH - 40, enemy.x + (i === 0 ? -20 : 20)));
                    newEnemy.y = enemy.y;
                    newEnemy.vx = enemy.vx;
                    newEnemy.vy = 0;
                    newEnemy.type = 'code';
                    newEnemy.health = 1;
                    newEnemy.maxHealth = 1;
                    newEnemy.value = 5;
                    newEnemy.width = 40;
                    newEnemy.height = 30;
                  }
                }
              }

              // Power-up drop scaffolding - state.player.powerUps ready for future use

              enemyPool.release(enemy);
            } else {
              synthDrum({ type: 'hihat' });
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
              gamePhase: newHealth <= 0 ? 'gameOver' : prev.gamePhase,
              combo: 0 // Reset combo on hit
            };
          });

          // Visual feedback for damage
          createExplosion(state.player.x + PLAYER_WIDTH / 2, state.player.y + PLAYER_HEIGHT / 2, '#ff0000');
          synthExplosion(0.3, 0.5);

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
    if (state.gamePhase !== 'playing') return;
    
    const scaledDelta = deltaTime * state.timeScale;
    
    // Update bullets
    projectilePool.activeObjects.forEach(bullet => {
      bullet.y += bullet.vy * scaledDelta;
      if (bullet.y < 0 || bullet.y > CANVAS_HEIGHT) {
        projectilePool.release(bullet);
      }
    });
    
    // Update enemies — classic Space Invaders movement pattern
    // Move all enemies, then check if ANY hit a wall, then reverse + descend as a group
    let shouldDescend = false;
    enemyPool.activeObjects.forEach(enemy => {
      enemy.x += enemy.vx * scaledDelta;

      // Clamp to boundaries to prevent enemies escaping the play area
      if (enemy.x <= 0) {
        enemy.x = 0;
        shouldDescend = true;
      } else if (enemy.x >= CANVAS_WIDTH - enemy.width) {
        enemy.x = CANVAS_WIDTH - enemy.width;
        shouldDescend = true;
      }

      // Enemy shooting - reduced firing rate for better gameplay balance
      if (enemy.type === 'boss') {
        // Boss fires more frequently and from multiple positions
        if (Math.random() < 0.002) {
          fireBullet(enemy.x + 20, enemy.y + enemy.height, true);
        }
        if (Math.random() < 0.002) {
          fireBullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, true);
        }
        if (Math.random() < 0.002) {
          fireBullet(enemy.x + enemy.width - 20, enemy.y + enemy.height, true);
        }
      } else if (Math.random() < 0.0003 * Math.min(state.wave, 10)) {
        fireBullet(enemy.x + enemy.width / 2, enemy.y + enemy.height, true);
      }
    });

    if (shouldDescend) {
      enemyPool.activeObjects.forEach(enemy => {
        enemy.vx *= -1;
        enemy.y += ENEMY_DESCENT;

        // Game over if enemies reach player
        if (enemy.y + enemy.height >= state.player.y) {
          setState(prev => ({ ...prev, gamePhase: 'gameOver' }));
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
    if (state.gamePhase !== 'gameOver') {
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
    // Use Date.now() for consistent timing with lastHitTime (both are milliseconds since epoch)
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
    if (state.gamePhase !== 'playing') return;

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
  }, [state.gamePhase]);

  // Sync stable refs — these update every render so the game loop always calls the latest version
  updateGameRef.current = updateGame;
  updatePlayerRef.current = updatePlayer;
  renderRef.current = render;
  spawnWaveRef.current = spawnWave;
  gamePhaseRef.current = state.gamePhase;
  waveRef.current = state.wave;
  enemyPoolRef.current = enemyPool;
  stateRef.current = state;
  fireBulletRef.current = fireBullet;

  // Start game from menu
  const startGame = useCallback(() => {
    setState(prev => ({ ...prev, gamePhase: 'playing' }));
    spawnWaveRef.current(1);
    sessionStartTimeRef.current = Date.now();
  }, []);

  // Auto-start on mount if autoStart prop is true
  useEffect(() => {
    if (autoStartRef.current) {
      startGame();
    }
  }, [startGame]);

  // Reset game
  const resetGame = useCallback(() => {
    projectilePool.releaseAll();
    enemyPool.releaseAll();
    particlePool.releaseAll();
    animationFrameRef.current = undefined; // Reset timestamp for clean restart

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
      gamePhase: 'playing',
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

    spawnWaveRef.current(1);
  }, [projectilePool, enemyPool, particlePool, saveData.games.matrixInvaders?.highScore]);

  // Sync callback refs after definition — read by keyboard handler via refs
  resetGameRef.current = resetGame;
  startGameRef.current = startGame;

  // Handle keyboard input — uses refs to avoid re-registering listeners every frame
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      const currentState = stateRef.current;
      const phase = gamePhaseRef.current;

      if (e.key === ' ' && phase === 'playing') {
        const now = Date.now();
        const fireRate = currentState.player.powerUps?.rapidFire ? 100 : 250;

        if (now - lastFireRef.current > fireRate) {
          fireBulletRef.current(currentState.player.x + PLAYER_WIDTH / 2, currentState.player.y);
          lastFireRef.current = now;
        }
      }

      if (e.key === 'b' && phase === 'playing' && !currentState.bulletTimeActive) {
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

      if (e.key === 'p' && (phase === 'playing' || phase === 'paused')) {
        // Reset timestamp when unpausing to prevent huge deltaTime spike
        if (phase === 'paused') {
          animationFrameRef.current = undefined;
        }
        setState(prev => ({
          ...prev,
          gamePhase: prev.gamePhase === 'paused' ? 'playing' : 'paused'
        }));
      }

      // R key to restart when game over
      if ((e.key === 'r' || e.key === 'R') && phase === 'gameOver') {
        resetGameRef.current();
      }

      // ENTER key to start from menu or restart from game over
      if (e.key === 'Enter') {
        if (phase === 'menu') {
          startGameRef.current();
        } else if (phase === 'gameOver') {
          resetGameRef.current();
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
  }, []); // Empty deps — never re-registers listeners; reads latest state via refs
  
  
  // Start game loop — only re-runs when gamePhase changes (not every render)
  // Uses refs for callbacks to avoid stale closures without causing useEffect churn
  useEffect(() => {
    if (state.gamePhase !== 'playing') return;

    // Initial spawn only if there are no active enemies
    if (enemyPoolRef.current.activeObjects.length === 0) {
      spawnWaveRef.current(waveRef.current);
    }

    // Reset timestamp on loop start so first frame gets zero deltaTime (not a huge jump)
    animationFrameRef.current = undefined;

    let animationId: number;
    const loop = (timestamp: number) => {
      const rawDelta = timestamp - (animationFrameRef.current || timestamp);
      animationFrameRef.current = timestamp;
      renderTimeRef.current = timestamp;

      // Cap deltaTime to prevent huge jumps after pause/resume or tab switch
      const deltaTime = Math.min(rawDelta, 33); // Cap at ~30fps equivalent

      updatePlayerRef.current();
      updateGameRef.current(deltaTime * 0.06); // Normalize to ~60fps
      renderRef.current(timestamp);

      if (gamePhaseRef.current === 'playing') {
        animationId = requestAnimationFrame(loop);
      }
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [state.gamePhase]);
  
  // Save game stats on game over
  useEffect(() => {
    if (state.gamePhase === 'gameOver') {
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
  }, [state.gamePhase, state.score, state.wave, state.highScore, saveData, updateGameSave, achievementManager, unlockSaveAchievement]);

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
    <div
      className="relative w-full h-full flex items-center justify-center bg-black outline-none"
      tabIndex={0}
      style={{
        boxShadow: hasFocus ? '0 0 0 2px #00ff00' : 'none',
        transition: 'box-shadow 0.2s ease'
      }}
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
      onClick={() => {}}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.5)]"
        />
        
        {/* Menu Overlay */}
        <AnimatePresence>
          {state.gamePhase === 'menu' && (
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
                <div className="text-green-400 font-mono text-sm mb-6 space-y-1 border-t border-b border-green-500/40 py-3">
                  <div className="font-bold text-green-500 mb-2">HOW TO PLAY</div>
                  <p>Move left/right, shoot to destroy invaders</p>
                  <p>Use bullet time for tactical advantage</p>
                  <p>Survive the waves before invaders reach you</p>
                  <div className="text-green-500/70 text-xs mt-2">MOVE: ← → or A/D | FIRE: SPACE | BULLET TIME: B | PAUSE: P</div>
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
          {state.gamePhase === 'gameOver' && (
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
          {state.gamePhase === 'paused' && (
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
        {state.gamePhase !== 'menu' && (
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