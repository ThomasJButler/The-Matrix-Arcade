import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCw, Trophy, Shield, Wifi, Battery, Zap, Sparkles, Clock, Heart } from 'lucide-react';

// Game constants - Fine-tuned for optimal gameplay
const GRAVITY = 0.2;
const JUMP_FORCE = -5.5;
const PIPE_SPEED = 2.5;
const PIPE_SPACING = 280;
const PIPE_GAP = 170;
const GROUND_HEIGHT = 50;
const PARTICLE_COUNT = 100;
const INITIAL_LIVES = 3;
const SCORE_PER_PIPE = 10;
const COMBO_INCREMENT = 0.2;
const LEVEL_THRESHOLD = 500;
const POWER_UP_CHANCE = 0.15;
const POWER_UP_DURATION = 8000;
const MAX_COMBO = 5.0;

// Visual constants
const GLOW_COLORS = ['#00ff00', '#00cc00', '#009900'];
const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';
const POWER_UP_TYPES = ['shield', 'timeSlow', 'extraLife', 'doublePoints'] as const;

type PowerUpType = typeof POWER_UP_TYPES[number];

// Player ASCII art with different states
const PLAYER_STATES = {
  normal: [
    "  ▄███▄  ",
    " █▀▄▄▄▀█ ",
    "█▄▀▀▀▀▄█",
    " ▀▄▄▄▄▀ "
  ],
  powered: [
    " ▄█████▄ ",
    "██▀▄▄▄▀██",
    "██▄███▄██",
    " ▀█████▀ "
  ],
  damaged: [
    "  ▄▀▀▀▄  ",
    " █▄▀▀▀▄█ ",
    "█▀▄███▄▀█",
    " ▀▄▄▄▄▀ "
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
}

const initialGameState: GameState = {
  playerY: 200,
  playerVelocity: 0,
  pipes: [],
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
  shakeIntensity: 0
};

export default function MatrixCloud() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const [state, setState] = useState<GameState>(initialGameState);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });

  // Enhanced sound system with synthesizer and effects
  const playSound = useCallback((type: 'jump' | 'score' | 'hit' | 'powerup' | 'combo' | 'levelUp') => {
    if (muted) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filterNode = audioContext.createBiquadFilter();
      const delayNode = audioContext.createDelay();
      
      oscillator.connect(filterNode);
      filterNode.connect(delayNode);
      delayNode.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const soundConfigs = {
        jump: {
          type: 'sine' as OscillatorType,
          frequency: { start: 400, end: 200 },
          filterFreq: 1000,
          delay: 0.1
        },
        score: {
          type: 'square' as OscillatorType,
          frequency: { start: 600, end: 800 },
          filterFreq: 2000,
          delay: 0.05
        },
        hit: {
          type: 'sawtooth' as OscillatorType,
          frequency: { start: 200, end: 100 },
          filterFreq: 500,
          delay: 0.15
        },
        powerup: {
          type: 'square' as OscillatorType,
          frequency: { start: 800, end: 1200 },
          filterFreq: 3000,
          delay: 0.08
        },
        combo: {
          type: 'triangle' as OscillatorType,
          frequency: { start: 500, end: 700 },
          filterFreq: 2500,
          delay: 0.12
        },
        levelUp: {
          type: 'square' as OscillatorType,
          frequency: { start: 1000, end: 1500 },
          filterFreq: 4000,
          delay: 0.2
        }
      };
      
      const config = soundConfigs[type];
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency.start, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(config.frequency.end, audioContext.currentTime + 0.2);
      
      filterNode.type = 'bandpass';
      filterNode.frequency.setValueAtTime(config.filterFreq, audioContext.currentTime);
      
      delayNode.delayTime.value = config.delay;
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.warn('Audio context failed to initialize:', error);
    }
  }, [muted]);

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

  const addScreenShake = useCallback((intensity: number) => {
    setScreenShake({
      x: (Math.random() - 0.5) * intensity,
      y: (Math.random() - 0.5) * intensity
    });
    
    setTimeout(() => setScreenShake({ x: 0, y: 0 }), 50);
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
    
    playSound('powerup');
  }, [playSound]);

  const jump = useCallback(() => {
    if (!state.gameOver && !paused) {
      setState(prev => ({
        ...prev,
        playerVelocity: JUMP_FORCE * (prev.activeEffects.timeSlow ? 0.7 : 1),
        started: true
      }));
      playSound('jump');
      addScreenShake(3);
    }
  }, [state.gameOver, paused, playSound, addScreenShake]);

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
      playSound('hit');
      addScreenShake(5);
      return {
        ...state,
        activeEffects: { ...state.activeEffects, shield: false },
        invulnerable: true,
        shakeIntensity: 5
      };
    }

    const newLives = state.lives - 1;
    playSound('hit');
    addScreenShake(10);

    if (newLives <= 0) {
      return {
        ...state,
        lives: 0,
        gameOver: true,
        highScore: Math.max(state.score, state.highScore),
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
  }, [playSound, addScreenShake]);

  const updateGame = useCallback((timestamp: number) => {
    if (paused) return;

    const deltaTime = timestamp - lastUpdateRef.current;
    lastUpdateRef.current = timestamp;

    setState(prev => {
      if (prev.gameOver) return prev;

      const speedMultiplier = prev.activeEffects.timeSlow ? 0.6 : 1;
      let newY = prev.playerY + prev.playerVelocity * speedMultiplier;
      let newVelocity = prev.playerVelocity + GRAVITY * speedMultiplier;

      // Update pipes
      let newPipes = [...prev.pipes];
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

      // Update particles with improved effects
      const newParticles = prev.particles.map(particle => ({
        ...particle,
        y: particle.y + particle.speed * speedMultiplier,
        char: Math.random() < 0.1 ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)] : particle.char,
        opacity: particle.y > 400 ? 0.1 + Math.random() * 0.5 : particle.opacity,
        rotation: particle.rotation + 0.01 * speedMultiplier,
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
          x: powerUp.x - PIPE_SPEED * speedMultiplier
        }));

      // Move pipes with glow effect
      newPipes = newPipes
        .map(pipe => ({
          ...pipe,
          x: pipe.x - PIPE_SPEED * speedMultiplier,
          glowIntensity: Math.max(0, pipe.glowIntensity - 0.05)
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
            playSound('levelUp');
            addScreenShake(7);
          }

          pipe.passed = true;
          pipe.glowIntensity = 1;
          playSound('score');

          newState = {
            ...newState,
            score: newScore,
            combo: Math.min(newState.combo + COMBO_INCREMENT, MAX_COMBO),
            level: newLevel
          };
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
        shakeIntensity: Math.max(0, newState.shakeIntensity - 0.2)
      };
    });
  }, [paused, spawnPowerUp, activatePowerUp, handleCollision, playSound, addScreenShake]);

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

  // Game loop with timestamp
  useEffect(() => {
    if (state.started && !state.gameOver && !paused) {
      const gameLoop = (timestamp: number) => {
        updateGame(timestamp);
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      };
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [state.started, state.gameOver, paused, updateGame]);

  // Initialize particles
  useEffect(() => {
    setState(prev => ({
      ...prev,
      particles: generateParticles()
    }));
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [generateParticles]);

  // Render game with enhanced visuals
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply screen shake
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, 800, 400);

    // Draw particles with glow
    ctx.font = '12px monospace';
    state.particles.forEach(particle => {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.scale(particle.scale, particle.scale);
      
      // Particle glow
      ctx.shadowColor = particle.glowColor;
      ctx.shadowBlur = 5;
      ctx.fillStyle = `rgba(0, 255, 0, ${particle.opacity})`;
      ctx.fillText(particle.char, 0, 0);
      ctx.restore();
    });

    // Draw pipes with glow effect
    state.pipes.forEach(pipe => {
      const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + 50, 0);
      gradient.addColorStop(0, `rgba(0, ${102 + pipe.glowIntensity * 153}, 0, 1)`);
      gradient.addColorStop(1, '#006600');
      
      ctx.fillStyle = gradient;
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = pipe.glowIntensity * 10;
      
      // Top pipe
      ctx.fillRect(pipe.x, 0, 50, pipe.height);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.height + PIPE_GAP, 50, 400 - (pipe.height + PIPE_GAP));
    });

    // Draw power-ups
    state.powerUps.forEach(powerUp => {
      if (powerUp.collected) return;
      
      ctx.save();
      ctx.translate(powerUp.x + 15, powerUp.y + 15);
      ctx.rotate(Date.now() / 1000);
      
      // Power-up glow
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00ff00';
      
      // Draw power-up symbol
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

    // Draw ground with pattern
    const groundPattern = ctx.createLinearGradient(0, 400 - GROUND_HEIGHT, 0, 400);
    groundPattern.addColorStop(0, '#004400');
    groundPattern.addColorStop(1, '#003300');
    ctx.fillStyle = groundPattern;
    ctx.fillRect(0, 400 - GROUND_HEIGHT, 800, GROUND_HEIGHT);

    // Draw player with effects
    ctx.fillStyle = state.activeEffects.shield ? '#00ff00' : 
                   state.invulnerable ? '#ff0000' : '#00cc00';
    
    const playerState = state.activeEffects.shield ? 'powered' :
                       state.invulnerable ? 'damaged' : 'normal';
    
    ctx.save();
    ctx.translate(50, state.playerY);
    
    // Player glow effect
    ctx.shadowColor = state.activeEffects.shield ? '#00ff00' : 
                     state.invulnerable ? '#ff0000' : '#00cc00';
    ctx.shadowBlur = 10;
    
    PLAYER_STATES[playerState].forEach((line, i) => {
      ctx.fillText(line, 0, i * 10);
    });
    ctx.restore();

    // Draw HUD elements
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00ff00';
    ctx.fillText(`Score: ${state.score}`, 20, 30);
    ctx.fillText(`Level: ${state.level}`, 20, 60);
    
    // Draw combo meter
    const comboWidth = 100 * (state.combo / MAX_COMBO);
    ctx.fillStyle = '#003300';
    ctx.fillRect(20, 70, 100, 10);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(20, 70, comboWidth, 10);

    // Draw lives
    for (let i = 0; i < state.lives; i++) {
      ctx.fillStyle = '#ff0000';
      ctx.fillText('♥', 700 + i * 25, 30);
    }

    ctx.restore();
  }, [state, screenShake]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="border-2 border-green-500 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.3)]"
          onClick={jump}
        />
        
        {/* Enhanced HUD */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-green-400">Score: {state.score}</span>
          </div>
          <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-green-400">Combo: x{state.combo.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded">
            <Wifi className="w-5 h-5 text-green-400" />
            <span className="text-green-400">Level: {state.level}</span>
          </div>
        </div>

        {/* Active Effects */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {state.activeEffects.shield && (
            <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded animate-pulse">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-green-400">Shield Active</span>
            </div>
          )}
          {state.activeEffects.timeSlow && (
            <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded animate-pulse">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-green-400">Time Slow</span>
            </div>
          )}
          {state.activeEffects.doublePoints && (
            <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded animate-pulse">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-green-400">Double Points</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={() => setMuted(m => !m)}
            className="p-2 bg-green-900 rounded hover:bg-green-800 transition-colors"
            type="button"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setPaused(p => !p)}
            className="p-2 bg-green-900 rounded hover:bg-green-800 transition-colors"
            type="button"
          >
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={reset}
            className="p-2 bg-green-900 rounded hover:bg-green-800 transition-colors"
            type="button"
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