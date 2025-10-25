import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCw, Trophy, Shield, Wifi, Battery, Zap, Sparkles, Clock, Heart } from 'lucide-react';
import { useSoundSystem } from '../../hooks/useSoundSystem';
import { useSaveSystem } from '../../hooks/useSaveSystem';

// Game constants - Adjusted for higher difficulty
const GRAVITY = 0.25;           // Increased from 0.2
const JUMP_FORCE = -6;          // Increased from -5.5
const PIPE_SPEED = 3.2;         // Increased from 2.5
const PIPE_SPACING = 250;       // Decreased from 280
const PIPE_GAP = 150;          // Decreased from 170
const GROUND_HEIGHT = 50;
const PARTICLE_COUNT = 30; // Optimized for better performance
const INITIAL_LIVES = 3;
const SCORE_PER_PIPE = 10;
const COMBO_INCREMENT = 0.15;   // Decreased from 0.2
const LEVEL_THRESHOLD = 500;
const POWER_UP_CHANCE = 0.12;   // Decreased from 0.15
const POWER_UP_DURATION = 8000;
const MAX_COMBO = 5.0;

// Visual constants
const GLOW_COLORS = ['#00ff00', '#00cc00', '#009900'];
const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';
const POWER_UP_TYPES = ['shield', 'timeSlow', 'extraLife', 'doublePoints'] as const;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BOSS_TYPES = ['agent_smith', 'sentinel', 'architect'] as const;

type PowerUpType = typeof POWER_UP_TYPES[number];
type BossType = typeof BOSS_TYPES[number];

// Boss battle constants
const BOSS_SPAWN_LEVELS = [5, 10, 15]; // Levels where bosses appear
const BOSS_DURATION = 30000; // 30 seconds
const BOSS_ATTACK_INTERVAL = 2000; // 2 seconds between attacks

// Player ASCII art with different states
const PLAYER_STATES = {
  normal: [
    "▗▄▀▄▀▄▖",
    "█ ^‿^ █",
    "▝▀▀▀▀▀▘"
  ],
  powered: [
    "▗▄▀▄▀▄▖",
    "█ ⌐■_■ █",
    "▝▀▀▀▀▀▘"
  ],
  damaged: [
    "▗▄▀▄▀▄▖",
    "█ ╥﹏╥ █",
    "▝▀▀▀▀▀▘"
  ]
};

// Enhanced particle system
interface Particle {
  x: number;
  y: number;
  char: string;
  speed: number;
  opacity: number;
  scale: number;
  rotation: number;
  glowColor: string;
}

// Boss system interfaces
interface Boss {
  type: BossType;
  health: number;
  maxHealth: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  attackTimer: number;
  phase: number;
  active: boolean;
  defeated: boolean;
}

interface BossAttack {
  id: string;
  type: 'laser' | 'matrix_rain' | 'code_bomb';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
}

interface PowerUp {
  type: PowerUpType;
  x: number;
  y: number;
  collected: boolean;
  startTime?: number;
}

interface Pipe {
  x: number;
  height: number;
  passed: boolean;
  glowIntensity: number;
}

interface GameState {
  playerY: number;
  playerVelocity: number;
  pipes: Pipe[];
  particles: Particle[];
  powerUps: PowerUp[];
  activeEffects: Record<PowerUpType, boolean>;
  effectTimers: Record<PowerUpType, number | null>;
  score: number;
  highScore: number;
  combo: number;
  lives: number;
  level: number;
  gameOver: boolean;
  started: boolean;
  invulnerable: boolean;
  shakeIntensity: number;
  // Boss battle system
  boss: Boss | null;
  bossAttacks: BossAttack[];
  inBossBattle: boolean;
  bossTimer: number;
}

const initialGameState: GameState = {
  playerY: 200,
  playerVelocity: 0,
  pipes: [
    {
      x: 600, // First pipe visible on screen
      height: 100 + Math.random() * (200 - PIPE_GAP),
      passed: false,
      glowIntensity: 0
    },
    {
      x: 600 + PIPE_SPACING, // Second pipe at proper spacing
      height: 100 + Math.random() * (200 - PIPE_GAP),
      passed: false,
      glowIntensity: 0
    }
  ],
  particles: [],
  powerUps: [],
  activeEffects: {
    shield: false,
    timeSlow: false,
    extraLife: false,
    doublePoints: false
  },
  effectTimers: {
    shield: null,
    timeSlow: null,
    extraLife: null,
    doublePoints: null
  },
  score: 0,
  highScore: 0,
  combo: 1,
  lives: INITIAL_LIVES,
  level: 1,
  gameOver: false,
  started: false,
  invulnerable: false,
  shakeIntensity: 0,
  // Boss battle initialization
  boss: null,
  bossAttacks: [],
  inBossBattle: false,
  bossTimer: 0
};

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface MatrixCloudProps {
  achievementManager?: AchievementManager;
}

export default function MatrixCloud({ achievementManager }: MatrixCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const [paused, setPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  
  // Cache for performance
  const groundPatternRef = useRef<CanvasGradient | null>(null);
  
  // Sound system integration
  const { playSFX, playMusic, stopMusic } = useSoundSystem();
  
  // Save system integration
  const { saveData, updateGameSave } = useSaveSystem();
  
  // Track achievements
  const powerUpsCollected = useRef(0);
  const bossesDefeated = useRef(new Set<string>());
  const maxAltitude = useRef(0);
  
  // Initialize state with saved high score
  const [state, setState] = useState<GameState>(() => ({
    ...initialGameState,
    highScore: saveData?.games?.matrixCloud?.highScore || 0
  }));
  
  // Achievement function
  const unlockAchievement = useCallback((gameId: string, achievementId: string) => {
    if (achievementManager?.unlockAchievement) {
      achievementManager.unlockAchievement(gameId, achievementId);
    }
  }, [achievementManager]);

  // Start background music when game starts
  useEffect(() => {
    if (state.started && !state.gameOver) {
      playMusic('gameplay');
    } else {
      stopMusic();
    }
  }, [state.started, state.gameOver, playMusic, stopMusic]);

  const generateParticles = useCallback((): Particle[] => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 400,
      char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
      speed: 2 + Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.5,
      scale: 0.8 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      glowColor: GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)]
    }));
  }, []);

  // Boss creation and management
  const createBoss = useCallback((type: BossType): Boss => {
    const bossConfigs = {
      agent_smith: {
        health: 150,
        size: 60,
        speed: 2
      },
      sentinel: {
        health: 200,
        size: 80,
        speed: 1.5
      },
      architect: {
        health: 300,
        size: 100,
        speed: 1
      }
    };
    
    const config = bossConfigs[type];
    return {
      type,
      health: config.health,
      maxHealth: config.health,
      x: 600,
      y: 200,
      vx: -config.speed,
      vy: 0,
      size: config.size,
      attackTimer: 0,
      phase: 1,
      active: true,
      defeated: false
    };
  }, []);

  const addScreenShake = useCallback((intensity: number) => {
    setScreenShake({
      x: (Math.random() - 0.5) * intensity,
      y: (Math.random() - 0.5) * intensity
    });
    
    setTimeout(() => setScreenShake({ x: 0, y: 0 }), 50);
  }, []);

  const spawnBoss = useCallback((level: number) => {
    let bossType: BossType;
    if (level >= 15) bossType = 'architect';
    else if (level >= 10) bossType = 'sentinel';
    else bossType = 'agent_smith';
    
    const boss = createBoss(bossType);
    
    setState(prev => ({
      ...prev,
      boss,
      inBossBattle: true,
      bossTimer: BOSS_DURATION,
      pipes: [], // Clear pipes during boss battle
      powerUps: [] // Clear power-ups during boss battle
    }));
    
    playSFX('levelUp');
    addScreenShake(15);
  }, [createBoss, playSFX, addScreenShake]);

  const createBossAttack = useCallback((boss: Boss): BossAttack | null => {
    const attackTypes = {
      agent_smith: ['laser', 'code_bomb'],
      sentinel: ['matrix_rain', 'laser'],
      architect: ['code_bomb', 'matrix_rain', 'laser']
    };
    
    const availableAttacks = attackTypes[boss.type] as Array<'laser' | 'matrix_rain' | 'code_bomb'>;
    const attackType = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
    
    return {
      id: Math.random().toString(36),
      type: attackType,
      x: boss.x - boss.size,
      y: boss.y + (Math.random() - 0.5) * boss.size,
      vx: -4 - Math.random() * 2,
      vy: (Math.random() - 0.5) * 3,
      life: 1.0,
      damage: 20
    };
  }, []);

  const updateBoss = useCallback((boss: Boss, deltaTime: number): Boss => {
    if (!boss.active) return boss;
    
    // Boss movement patterns
    let newVx = boss.vx;
    let newVy = boss.vy;
    
    switch (boss.type) {
      case 'agent_smith':
        // Aggressive horizontal movement
        newVy = Math.sin(Date.now() / 1000) * 2;
        break;
      case 'sentinel':
        // Circular movement
        newVx = Math.sin(Date.now() / 1500) * 1.5;
        newVy = Math.cos(Date.now() / 1500) * 1.5;
        break;
      case 'architect':
        // Slow, deliberate movement
        newVy = Math.sin(Date.now() / 2000) * 1;
        break;
    }
    
    const newX = Math.max(400, Math.min(700, boss.x + newVx));
    const newY = Math.max(50, Math.min(350, boss.y + newVy));
    
    return {
      ...boss,
      x: newX,
      y: newY,
      vx: newVx,
      vy: newVy,
      attackTimer: boss.attackTimer + deltaTime
    };
  }, []);

  const spawnPowerUp = useCallback(() => {
    if (Math.random() > POWER_UP_CHANCE) return null;
    
    const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
    return {
      type,
      x: 800,
      y: 100 + Math.random() * 200,
      collected: false
    };
  }, []);

  const activatePowerUp = useCallback((type: PowerUpType) => {
    setState(prev => {
      const newEffectTimers = { ...prev.effectTimers };
      const newActiveEffects = { ...prev.activeEffects };
      
      // Clear existing timer if any
      if (newEffectTimers[type]) {
        window.clearTimeout(newEffectTimers[type]!);
      }
      
      // Set new timer
      newEffectTimers[type] = window.setTimeout(() => {
        setState(p => ({
          ...p,
          activeEffects: { ...p.activeEffects, [type]: false },
          effectTimers: { ...p.effectTimers, [type]: null }
        }));
      }, POWER_UP_DURATION) as unknown as number;
      
      newActiveEffects[type] = true;
      
      // Special handling for extraLife
      if (type === 'extraLife' && prev.lives < 5) {
        return {
          ...prev,
          lives: prev.lives + 1,
          activeEffects: newActiveEffects,
          effectTimers: newEffectTimers
        };
      }
      
      return {
        ...prev,
        activeEffects: newActiveEffects,
        effectTimers: newEffectTimers
      };
    });
    
    playSFX('powerup');
  }, [playSFX]);

  const jump = useCallback(() => {
    if (!state.gameOver && !paused) {
      setState(prev => {
        // First flight achievement
        if (!prev.started) {
          setTimeout(() => unlockAchievement('matrixCloud', 'first_flight'), 100);
        }
        
        return {
          ...prev,
          playerVelocity: JUMP_FORCE * (prev.activeEffects.timeSlow ? 0.7 : 1),
          started: true
        };
      });
      playSFX('jump');
      addScreenShake(3);
    }
  }, [state.gameOver, paused, playSFX, addScreenShake, unlockAchievement]);

  const reset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Clear all power-up timers
    setState(prev => {
      Object.values(prev.effectTimers).forEach(timer => {
        if (timer) window.clearTimeout(timer);
      });
      
      return {
        ...initialGameState,
        particles: generateParticles(),
        highScore: prev.highScore
      };
    });
    
    setShowTutorial(true);
    setPaused(false);
    setScreenShake({ x: 0, y: 0 });
  }, [generateParticles]);

  const handleCollision = useCallback((state: GameState): GameState => {
    if (state.invulnerable) return state;
    
    if (state.activeEffects.shield) {
      playSFX('hit');
      addScreenShake(5);
      return {
        ...state,
        activeEffects: { ...state.activeEffects, shield: false },
        invulnerable: true,
        shakeIntensity: 5
      };
    }

    const newLives = state.lives - 1;
    playSFX('hit');
    addScreenShake(10);

    if (newLives <= 0) {
      const newHighScore = Math.max(state.score, state.highScore);
      
      // Save game statistics when game ends
      setTimeout(() => {
        updateGameSave('matrixCloud', {
          highScore: newHighScore,
          level: state.level,
          stats: {
            gamesPlayed: (saveData?.games?.matrixCloud?.stats?.gamesPlayed || 0) + 1,
            totalScore: (saveData?.games?.matrixCloud?.stats?.totalScore || 0) + state.score,
            longestSurvival: Math.max(saveData?.games?.matrixCloud?.stats?.longestSurvival || 0, state.score),
            bossesDefeated: saveData?.games?.matrixCloud?.stats?.bossesDefeated || 0
          }
        });
      }, 100);
      
      return {
        ...state,
        lives: 0,
        gameOver: true,
        highScore: newHighScore,
        shakeIntensity: 10
      };
    }

    return {
      ...state,
      lives: newLives,
      combo: 1,
      invulnerable: true,
      shakeIntensity: 8
    };
  }, [playSFX, addScreenShake, updateGameSave, saveData]);

  const updateGame = useCallback((timestamp: number) => {
    if (paused) return;

    const deltaTime = timestamp - lastUpdateRef.current;
    lastUpdateRef.current = timestamp;

    // Skip frame if deltaTime is too large (tab was in background)
    if (deltaTime > 100) return;

    // Normalize to 60 FPS
    const frameDelta = Math.min(deltaTime / 16.67, 2); // Cap at 2x to prevent large jumps

    setState(prev => {
      if (prev.gameOver) return prev;

      const speedMultiplier = prev.activeEffects.timeSlow ? 0.6 : 1;
      let newY = prev.playerY + prev.playerVelocity * speedMultiplier * frameDelta;
      let newVelocity = prev.playerVelocity + GRAVITY * speedMultiplier * frameDelta;

      // Update pipes (only if not in boss battle)
      let newPipes = [...prev.pipes];
      if (!prev.inBossBattle) {
        if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < 800 - PIPE_SPACING) {
          newPipes.push({
            x: 800,
            height: 100 + Math.random() * (200 - PIPE_GAP),
            passed: false,
            glowIntensity: 0
          });
          
          // Chance to spawn power-up
          const powerUp = spawnPowerUp();
          if (powerUp) {
            prev.powerUps.push(powerUp);
          }
        }
      }

      // Update particles with improved effects
      const newParticles = prev.particles.map(particle => ({
        ...particle,
        y: particle.y + particle.speed * speedMultiplier * frameDelta,
        char: Math.random() < 0.1 ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)] : particle.char,
        opacity: particle.y > 400 ? 0.1 + Math.random() * 0.5 : particle.opacity,
        rotation: particle.rotation + 0.01 * speedMultiplier * frameDelta,
        ...(particle.y > 400 ? {
          y: 0,
          scale: 0.8 + Math.random() * 0.4,
          glowColor: GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)]
        } : {})
      }));

      // Update power-ups
      let newPowerUps = prev.powerUps
        .filter(p => !p.collected)
        .map(powerUp => ({
          ...powerUp,
          x: powerUp.x - PIPE_SPEED * speedMultiplier * frameDelta
        }));

      // Move pipes with glow effect
      newPipes = newPipes
        .map(pipe => ({
          ...pipe,
          x: pipe.x - PIPE_SPEED * speedMultiplier * frameDelta,
          glowIntensity: Math.max(0, pipe.glowIntensity - 0.05 * frameDelta)
        }))
        .filter(pipe => pipe.x > -60);

      // Collision detection with improved hitboxes
      const playerBox = {
        x: 50,
        y: newY,
        width: 35,
        height: 35
      };

      let newState = { ...prev };

      // Power-up collection
      newPowerUps = newPowerUps.map(powerUp => {
        if (!powerUp.collected && checkCollision(playerBox, {
          x: powerUp.x,
          y: powerUp.y,
          width: 30,
          height: 30
        })) {
          activatePowerUp(powerUp.type);
          
          // Track power-ups for achievement
          powerUpsCollected.current += 1;
          if (powerUpsCollected.current >= 20) {
            unlockAchievement('matrixCloud', 'cloud_power_collector');
          }
          
          return { ...powerUp, collected: true };
        }
        return powerUp;
      });

      // Check pipe collisions
      for (const pipe of newPipes) {
        const topPipe = {
          x: pipe.x,
          y: 0,
          width: 50,
          height: pipe.height
        };

        const bottomPipe = {
          x: pipe.x,
          y: pipe.height + PIPE_GAP,
          width: 50,
          height: 400 - (pipe.height + PIPE_GAP)
        };

        if (checkCollision(playerBox, topPipe) || checkCollision(playerBox, bottomPipe)) {
          newState = handleCollision(newState);
          if (newState.gameOver) return newState;
        }

        // Score points
        if (!pipe.passed && pipe.x < 50) {
          const baseScore = SCORE_PER_PIPE * Math.min(newState.combo, MAX_COMBO);
          const scoreMultiplier = newState.activeEffects.doublePoints ? 2 : 1;
          const scoreIncrement = Math.floor(baseScore * scoreMultiplier);
          const newScore = newState.score + scoreIncrement;
          const newLevel = Math.floor(newScore / LEVEL_THRESHOLD) + 1;

          if (newLevel > newState.level) {
            playSFX('levelUp');
            addScreenShake(7);
            
            // Unlock level achievements
            if (newLevel === 5) {
              unlockAchievement('matrixCloud', 'level_5');
            }
            
            // Check for boss spawns
            if (BOSS_SPAWN_LEVELS.includes(newLevel) && !newState.inBossBattle) {
              setTimeout(() => spawnBoss(newLevel), 1000);
            }
          }

          pipe.passed = true;
          pipe.glowIntensity = 1;
          playSFX('score');

          newState = {
            ...newState,
            score: newScore,
            combo: Math.min(newState.combo + COMBO_INCREMENT, MAX_COMBO),
            level: newLevel
          };
          
          // Track altitude for achievement (score represents altitude)
          maxAltitude.current = Math.max(maxAltitude.current, newScore);
          if (maxAltitude.current >= 1000) {
            unlockAchievement('matrixCloud', 'cloud_high_flyer');
          }
        }
      }

      // Ground and ceiling collision
      if (newY > 400 - GROUND_HEIGHT - 35) {
        newY = 400 - GROUND_HEIGHT - 35;
        newVelocity = 0;
        if (!newState.invulnerable) {
          newState = handleCollision(newState);
          if (newState.gameOver) return newState;
        }
      } else if (newY < 0) {
        newY = 0;
        newVelocity = 0;
      }

      // Boss battle logic
      let updatedBoss = newState.boss;
      let newBossAttacks = [...prev.bossAttacks];
      let newBossTimer = prev.bossTimer;
      
      if (newState.inBossBattle && updatedBoss) {
        // Update boss timer
        newBossTimer = Math.max(0, newBossTimer - deltaTime);
        
        // Update boss position and behavior
        updatedBoss = updateBoss(updatedBoss, deltaTime);
        
        // Boss attacks
        if (updatedBoss.attackTimer >= BOSS_ATTACK_INTERVAL) {
          const attack = createBossAttack(updatedBoss);
          if (attack) {
            newBossAttacks.push(attack);
          }
          updatedBoss.attackTimer = 0;
        }
        
        // Update boss attacks
        newBossAttacks = newBossAttacks
          .map(attack => ({
            ...attack,
            x: attack.x + attack.vx,
            y: attack.y + attack.vy,
            life: attack.life - 0.02
          }))
          .filter(attack => attack.life > 0 && attack.x > -50);
        
        // Check boss attack collisions with player
        for (const attack of newBossAttacks) {
          if (checkCollision(playerBox, {
            x: attack.x,
            y: attack.y,
            width: 20,
            height: 20
          })) {
            newState = handleCollision(newState);
            // Remove the attack that hit
            newBossAttacks = newBossAttacks.filter(a => a.id !== attack.id);
            break;
          }
        }
        
        // Check player collision with boss
        if (checkCollision(playerBox, {
          x: updatedBoss.x - updatedBoss.size/2,
          y: updatedBoss.y - updatedBoss.size/2,
          width: updatedBoss.size,
          height: updatedBoss.size
        })) {
          // Damage boss
          updatedBoss.health -= 10;
          playSFX('hit');
          addScreenShake(8);
          
          if (updatedBoss.health <= 0) {
            // Boss defeated
            updatedBoss.defeated = true;
            updatedBoss.active = false;
            const bossScore = updatedBoss.maxHealth * 2;
            newState.score += bossScore;
            playSFX('levelUp');
            addScreenShake(15);
            
            // Update boss defeat count
            updateGameSave('matrixCloud', {
              stats: {
                ...saveData?.games?.matrixCloud?.stats,
                bossesDefeated: (saveData?.games?.matrixCloud?.stats?.bossesDefeated || 0) + 1
              }
            });
            
            // Unlock boss achievements
            if (updatedBoss.type === 'agent_smith') {
              unlockAchievement('matrixCloud', 'boss_slayer');
            } else if (updatedBoss.type === 'architect') {
              unlockAchievement('matrixCloud', 'architect_defeat');
            }
            
            // Track all bosses defeated
            bossesDefeated.current.add(updatedBoss.type);
            if (bossesDefeated.current.size >= 3) {
              unlockAchievement('matrixCloud', 'cloud_all_bosses');
            }
            
            // End boss battle
            newState.inBossBattle = false;
            newState.boss = null;
            newBossAttacks = [];
          } else {
            // Player takes damage from collision
            newState = handleCollision(newState);
          }
        }
        
        // Boss battle timeout
        if (newBossTimer <= 0) {
          newState.inBossBattle = false;
          newState.boss = null;
          newBossAttacks = [];
          playSFX('hit'); // Failure sound
        }
      }
      
      // Reset invulnerability after a short time
      if (newState.invulnerable) {
        setTimeout(() => {
          setState(p => ({ ...p, invulnerable: false }));
        }, 1500);
      }

      return {
        ...newState,
        playerY: newY,
        playerVelocity: newVelocity,
        pipes: newPipes,
        particles: newParticles,
        powerUps: newPowerUps,
        shakeIntensity: Math.max(0, newState.shakeIntensity - 0.2),
        boss: updatedBoss,
        bossAttacks: newBossAttacks,
        bossTimer: newBossTimer
      };
    });
  }, [paused, spawnPowerUp, activatePowerUp, handleCollision, playSFX, addScreenShake, spawnBoss, updateBoss, createBossAttack, unlockAchievement]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (state.gameOver) {
          reset();
        } else {
          jump();
        }
      } else if (e.code === 'KeyP') {
        setPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.gameOver, jump, reset]);

  // Render game with enhanced visuals
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply screen shake
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 800, 400);

    // Draw particles with optimised rendering
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)'; // Single color for all particles
    
    state.particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.translate(particle.x, particle.y);
      ctx.fillText(particle.char, 0, 0);
      ctx.restore();
    });

    // Draw pipes with optimised rendering
    ctx.fillStyle = '#006600'; // Default pipe color
    
    state.pipes.forEach(pipe => {
      // Change color only if pipe is glowing
      if (pipe.glowIntensity > 0) {
        const green = Math.floor(102 + pipe.glowIntensity * 153);
        ctx.fillStyle = `rgb(0, ${green}, 0)`;
      } else {
        ctx.fillStyle = '#006600';
      }
      
      // Top pipe
      ctx.fillRect(pipe.x, 0, 50, pipe.height);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.height + PIPE_GAP, 50, 400 - (pipe.height + PIPE_GAP));
    });

    // Draw power-ups with optimised rendering
    ctx.fillStyle = '#00ff00';
    
    state.powerUps.forEach(powerUp => {
      if (powerUp.collected) return;
      
      ctx.save();
      ctx.translate(powerUp.x + 15, powerUp.y + 15);
      
      // Draw power-up symbol without shadow for performance
      switch (powerUp.type) {
        case 'shield':
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'timeSlow':
          ctx.fillRect(-8, -8, 16, 16);
          break;
        case 'extraLife':
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(8, 8);
          ctx.lineTo(-8, 8);
          ctx.closePath();
          ctx.fill();
          break;
        case 'doublePoints':
          ctx.fillRect(-8, -8, 6, 16);
          ctx.fillRect(2, -8, 6, 16);
          break;
      }
      
      ctx.restore();
    });

    // Draw boss and boss attacks
    if (state.boss && state.boss.active) {
      const boss = state.boss;
      
      // Remove boss shadow for performance
      
      // Boss body based on type
      ctx.save();
      ctx.translate(boss.x, boss.y);
      
      switch (boss.type) {
        case 'agent_smith':
          // Agent Smith - suit silhouette
          ctx.fillStyle = '#003300';
          ctx.fillRect(-boss.size/2, -boss.size/2, boss.size, boss.size);
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(-boss.size/4, -boss.size/3, boss.size/2, boss.size/6);
          ctx.fillRect(-boss.size/6, -boss.size/4, boss.size/3, boss.size/8);
          break;
          
        case 'sentinel':
          // Sentinel - mechanical tentacles
          ctx.fillStyle = '#330000';
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + boss.x * 0.01;
            const length = boss.size / 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#ff0000';
            ctx.stroke();
          }
          break;
          
        case 'architect':
          // Architect - geometric patterns
          ctx.fillStyle = '#004400';
          ctx.fillRect(-boss.size/2, -boss.size/2, boss.size, boss.size);
          ctx.fillStyle = '#00ff00';
          for (let i = 0; i < 5; i++) {
            const size = (boss.size / 5) * (i + 1);
            ctx.strokeRect(-size/2, -size/2, size, size);
          }
          break;
      }
      
      // Boss health bar
      const healthBarWidth = boss.size;
      const healthPercent = boss.health / boss.maxHealth;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-healthBarWidth/2, -boss.size/2 - 20, healthBarWidth, 8);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(-healthBarWidth/2, -boss.size/2 - 20, healthBarWidth * healthPercent, 8);
      
      ctx.restore();
      
      // Draw boss attacks
      state.bossAttacks.forEach(attack => {
        ctx.save();
        ctx.translate(attack.x, attack.y);
        
        const alpha = attack.life;
        ctx.globalAlpha = alpha;
        
        switch (attack.type) {
          case 'laser':
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-15, -2, 30, 4);
            break;
          case 'matrix_rain':
            ctx.fillStyle = '#00ff00';
            ctx.font = '16px monospace';
            ctx.fillText('01', -8, 8);
            break;
          case 'code_bomb':
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        
        ctx.restore();
      });
    }

    // Draw ground with cached pattern
    if (!groundPatternRef.current) {
      groundPatternRef.current = ctx.createLinearGradient(0, 400 - GROUND_HEIGHT, 0, 400);
      groundPatternRef.current.addColorStop(0, '#004400');
      groundPatternRef.current.addColorStop(1, '#003300');
    }
    ctx.fillStyle = groundPatternRef.current;
    ctx.fillRect(0, 400 - GROUND_HEIGHT, 800, GROUND_HEIGHT);

    // Draw player without shadow for performance
    ctx.fillStyle = state.activeEffects.shield ? '#00ff00' : 
                   state.invulnerable ? '#ff0000' : '#00cc00';
    
    const playerState = state.activeEffects.shield ? 'powered' :
                       state.invulnerable ? 'damaged' : 'normal';
    
    ctx.save();
    ctx.translate(50, state.playerY);
    
    PLAYER_STATES[playerState].forEach((line, i) => {
      ctx.fillText(line, 0, i * 10);
    });
    ctx.restore();

    // Draw HUD elements
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00ff00';
    
    
    // Draw combo meter
    const comboWidth = 100 * (state.combo / MAX_COMBO);
    ctx.fillStyle = '#003300';
    ctx.fillRect(20, 70, 100, 10);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(20, 70, comboWidth, 10);
    
    // Draw boss timer during boss battles
    if (state.inBossBattle && state.bossTimer > 0) {
      const timerWidth = 200 * (state.bossTimer / BOSS_DURATION);
      ctx.fillStyle = '#660000';
      ctx.fillRect(300, 20, 200, 15);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(300, 20, timerWidth, 15);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS BATTLE', 400, 32);
      ctx.textAlign = 'left';
    }

    // Draw lives
    for (let i = 0; i < state.lives; i++) {
      ctx.fillStyle = '#ff0000';
      ctx.fillText('♥', 700 + i * 25, 30);
    }

    ctx.restore();
  }, [state, screenShake]);

  // Game loop with timestamp
  useEffect(() => {
    if (state.started && !state.gameOver && !paused) {
      const gameLoop = (timestamp: number) => {
        updateGame(timestamp);
        render();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      };
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [state.started, state.gameOver, paused, updateGame, render]);

  // Initialize particles and render initial state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      particles: generateParticles()
    }));
    
    // Render initial state
    setTimeout(() => render(), 0);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [generateParticles, render]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <div className="relative w-full max-w-4xl mx-auto">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          role="img"
          aria-label="Matrix Cloud game canvas"
          className="w-full h-auto border-2 border-green-500 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.3)]"
          style={{ maxHeight: '70vh' }}
          onClick={jump}
        />
        
        {/* Enhanced HUD */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 bg-black bg-opacity-70 px-2 py-1 rounded">
            <Wifi className="w-4 h-4 text-green-400" />
            <span>Level: {state.level}</span>
          </div>
          <div className="flex items-center gap-2 bg-black bg-opacity-70 px-2 py-1 rounded">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>Combo: x{state.combo.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 bg-black bg-opacity-70 px-2 py-1 rounded">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>High Score: {state.highScore}</span>
          </div>
          {state.inBossBattle && state.boss && (
            <div className="flex items-center gap-2 bg-red-900 bg-opacity-70 px-3 py-1 rounded border border-red-500 animate-pulse">
              <Battery className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-bold">
                {state.boss.type.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Active Effects */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 text-sm">
          {state.activeEffects.shield && (
            <div className="flex items-center gap-2 bg-black bg-opacity-70 px-2 py-1 rounded animate-pulse">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Shield</span>
            </div>
          )}
          {state.activeEffects.timeSlow && (
            <div className="flex items-center gap-2 bg-black bg-opacity-70 px-2 py-1 rounded animate-pulse">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span>Slow</span>
            </div>
          )}
          {state.activeEffects.doublePoints && (
            <div className="flex items-center gap-2 bg-black bg-opacity-70 px-2 py-1 rounded animate-pulse">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>2x</span>
            </div>
          )}
          {state.inBossBattle && (
            <div className="flex items-center gap-2 bg-red-900 bg-opacity-70 px-3 py-1 rounded border border-red-500">
              <span className="text-red-400 text-sm">
                ⏱ {Math.ceil(state.bossTimer / 1000)}s
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={() => setPaused(p => !p)}
            className="p-2 bg-green-900 rounded hover:bg-green-800 transition-colors"
            type="button"
            aria-label={paused ? "Resume game" : "Pause game"}
          >
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={reset}
            className="p-2 bg-green-900 rounded hover:bg-green-800 transition-colors"
            type="button"
            aria-label="Restart game"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        {/* Game Over Screen */}
        {state.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
            <div className="text-center font-mono">
              <h2 className="text-3xl mb-4 text-red-500 animate-pulse">SYSTEM FAILURE</h2>
              <div className="space-y-2 mb-6">
                <p className="text-green-400">Final Score: {state.score}</p>
                <p className="text-green-400">High Score: {state.highScore}</p>
                <p className="text-green-400">Level Reached: {state.level}</p>
              </div>
              <button
                onClick={reset}
                className="px-6 py-3 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-all transform hover:scale-105"
                type="button"
              >
                REBOOT SYSTEM
              </button>
            </div>
          </div>
        )}

        {/* Tutorial */}
        {showTutorial && !state.started && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
            <div className="text-center font-mono text-green-400 max-w-lg p-8 border border-green-500 rounded-lg">
              <h2 className="text-3xl mb-6 font-bold">MATRIX PROTOCOL</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center gap-2">
                  <kbd className="px-2 py-1 bg-green-900 rounded">SPACE</kbd>
                  <span>to navigate the system</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <kbd className="px-2 py-1 bg-green-900 rounded">P</kbd>
                  <span>to pause simulation</span>
                </div>
                <div className="flex flex-col gap-4 mt-6">
                  <p className="text-sm">Power-Up Guide:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span>Shield Protection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span>Time Manipulation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span>Extra Life</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>Score Multiplier</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="animate-pulse">Click or press SPACE to initialize</p>
            </div>
          </div>
        )}

        {/* Pause Screen */}
        {paused && !state.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
            <div className="text-center font-mono text-green-500">
              <h2 className="text-3xl mb-4">SYSTEM PAUSED</h2>
              <div className="space-y-2 mb-4">
                <p>Current Score: {state.score}</p>
                <p>Level: {state.level}</p>
                <p>Lives: {state.lives}</p>
              </div>
              <p className="animate-pulse">Press P to resume</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Utility function for collision detection
function checkCollision(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}