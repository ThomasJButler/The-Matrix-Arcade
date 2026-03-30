import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { usePowerUps } from '../../hooks/usePowerUps';
import { useParticleSystem } from '../../hooks/useParticleSystem';
import { useSoundSystem } from '../../hooks/useSoundSystem';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import { PowerUpIndicator } from '../ui/PowerUpIndicator';
import { ScoreBoard } from '../ui/ScoreBoard';
import { GameOverModal } from '../ui/GameOverModal';

// Constants
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 12;
const BALL_SIZE = 6;
const PARTICLE_COUNT = 15; // Reduced for better performance
const INITIAL_BALL_SPEED = 7;
const SPEED_INCREMENT = 0.1; // Speed increases over time
const MAX_BALL_SPEED = 15;
const MAX_IMPACT_EFFECTS = 10; // Limit impact effects for performance

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface VortexPongProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
}

// Game phase enum replaces 3 boolean flags (showMenu, gameOver, isPaused)
// This eliminates 5 invalid state combinations (8 possible → 4 valid states)
type GamePhase = 'menu' | 'playing' | 'paused' | 'gameOver';

type Particle = {
  x: number;
  y: number;
  z: number;
  speed: number;
};

type Ball = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
};

type PowerUp = {
  x: number;
  y: number;
  type: 'bigger_paddle' | 'slower_ball' | 'score_multiplier' | 'multi_ball';
  active: boolean;
};

// Enhanced interface with new features
interface RenderProps {
  balls: Ball[];
  paddleY: number;
  aiPaddleY: number;
  particles: Particle[];
  powerUps: PowerUp[];
  activePowerUps: Record<string, boolean>;
  score: { player: number; ai: number };
  speedMultiplier: number;
  screenShake: { x: number; y: number };
  impactEffects: Array<{ x: number; y: number; intensity: number; life: number }>;
  timestamp: number; // Added for performance optimization
  combo: number;
}

// Enhanced utility functions
const getPowerUpColor = (type: PowerUp['type']) => {
  const colors = {
    bigger_paddle: '#00ff00',
    slower_ball: '#00ffff',
    score_multiplier: '#ffff00',
    multi_ball: '#ff00ff'
  };
  return colors[type] || '#ffffff';
};

const createBall = (x: number, y: number, vx: number, vy: number): Ball => ({
  id: Math.random().toString(36).substr(2, 9),
  x,
  y,
  vx,
  vy,
  size: BALL_SIZE,
  color: '#ffffff'
});

const getScreenShake = (intensity: number) => ({
  x: (Math.random() - 0.5) * intensity,
  y: (Math.random() - 0.5) * intensity
});

export default function VortexPong({ achievementManager, isMuted = false, autoStart = false }: VortexPongProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paddleY, setPaddleY] = useState(150);
  const [paddleVelocity, setPaddleVelocity] = useState(0);
  const [keyboardControls, setKeyboardControls] = useState({ up: false, down: false });
  const [aiPaddleY, setAiPaddleY] = useState(150);
  const [aiPaddleVelocity, setAiPaddleVelocity] = useState(0);
  const [balls, setBalls] = useState<Ball[]>([createBall(400, 200, -INITIAL_BALL_SPEED, 0)]);
  // Use ref for particles to avoid recreating objects every frame (performance optimisation)
  const particlesRef = useRef<Particle[]>([]);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  // Single GamePhase enum replaces showMenu, gameOver, isPaused booleans
  // Auto-start directly into playing state if autoStart prop is true
  const [gamePhase, setGamePhase] = useState<GamePhase>(autoStart ? 'playing' : 'menu');
  const autoStartRef = useRef(autoStart);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  const [hasFocus, setHasFocus] = useState(false);
  // Use ref for impact effects to reduce GC pressure from frequent updates
  const impactEffectsRef = useRef<Array<{ x: number; y: number; intensity: number; life: number }>>([]);
  const [aiDifficulty, setAiDifficulty] = useState(2.5); // Adaptive AI speed - reduced for easier gameplay
  const frameCounter = useRef(0); // For performance optimization

  // Enhanced game states
  const [timeSinceLastGoal, setTimeSinceLastGoal] = useState(0);
  const [currentBallSpeed, setCurrentBallSpeed] = useState(INITIAL_BALL_SPEED);
  const [combo, setCombo] = useState(0);
  const [lastPaddleHit, setLastPaddleHit] = useState<'player' | 'ai' | null>(null);

  // Use custom hooks
  const { powerUps, setPowerUps, activePowerUps, spawnPowerUp, activatePowerUp } = usePowerUps();
  const { explode, createTrail, render: renderParticles } = useParticleSystem();
  const { playSFX: playSoundEffect } = useSoundSystem();
  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();

  // Sound wrapper function - encapsulates isMuted check for consistency
  const playSFX = useCallback((sound: Parameters<typeof playSoundEffect>[0]) => {
    if (!isMuted) {
      playSoundEffect(sound);
    }
  }, [isMuted, playSoundEffect]);

  // Achievement unlock function
  const unlockAchievement = useCallback((achievementId: string) => {
    if (achievementManager?.unlockAchievement) {
      achievementManager.unlockAchievement('vortexPong', achievementId);
    }
    unlockSaveAchievement('vortexPong', achievementId);
  }, [achievementManager, unlockSaveAchievement]);

  // Track rally count and session stats
  const rallyCount = useRef(0);
  const hasFirstPoint = useRef(false);
  const powerUpsUsed = useRef(0);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const maxComboRef = useRef(0);
  const maxRallyRef = useRef(0);

  // Timeout refs for cleanup - prevents memory leaks when component unmounts
  const screenShakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for stable keyboard handler references - prevents race conditions when
  // gamePhase changes (listeners aren't re-registered, avoiding missed key events)
  const gamePhaseRef = useRef(gamePhase);
  const resetGameRef = useRef<() => void>();

  // Initialize particles using ref (avoids state updates every frame)
  useEffect(() => {
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlesRef.current.push({
          x: Math.random() * 800,
          y: Math.random() * 400,
          z: Math.random() * 100,
          speed: Math.random() * 2 + 1,
        });
      }
    }
  }, []);

  // Auto-focus container on mount so ENTER key works immediately
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Removed duplicate keyboard handler - using velocity-based system below instead

  const resetGame = useCallback(() => {
    setBalls([createBall(400, 200, -INITIAL_BALL_SPEED, 0)]);
    setPaddleY(150);
    setAiPaddleY(150);
    setScore({ player: 0, ai: 0 });
    setGamePhase('playing');
    setScreenShake({ x: 0, y: 0 });
    impactEffectsRef.current = []; // Clear impact effects via ref
    setCombo(0);
    setAiDifficulty(2.5);
    setTimeSinceLastGoal(0);
    setCurrentBallSpeed(INITIAL_BALL_SPEED);

    // Reset session tracking
    sessionStartTimeRef.current = Date.now();
    rallyCount.current = 0;
    hasFirstPoint.current = false;
    powerUpsUsed.current = 0;
    maxComboRef.current = 0;
    maxRallyRef.current = 0;
  }, []);

  // Auto-start on mount if autoStart prop is true
  useEffect(() => {
    if (autoStartRef.current) {
      resetGame();
    }
  }, [resetGame]);

  // Screen shake effect
  const addScreenShake = useCallback((intensity: number) => {
    setScreenShake(getScreenShake(intensity));
    // Clear any existing shake timeout before setting new one
    if (screenShakeTimeoutRef.current) {
      clearTimeout(screenShakeTimeoutRef.current);
    }
    screenShakeTimeoutRef.current = setTimeout(() => {
      setScreenShake({ x: 0, y: 0 });
      screenShakeTimeoutRef.current = null;
    }, 100);
  }, []);

  // Impact effect system - uses ref to avoid GC pressure from state updates
  const addImpactEffect = useCallback((x: number, y: number, intensity: number) => {
    const effect = { x, y, intensity, life: 1.0 };
    // Add to ref, limiting to MAX_IMPACT_EFFECTS for performance
    if (impactEffectsRef.current.length < MAX_IMPACT_EFFECTS) {
      impactEffectsRef.current.push(effect);
    } else {
      // Reuse oldest slot to avoid array growth
      impactEffectsRef.current.shift();
      impactEffectsRef.current.push(effect);
    }
    explode(x, y, '#ffffff');
    addScreenShake(intensity * 2);
  }, [explode, addScreenShake]);

  // Mouse control support
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseY = ((e.clientY - rect.top) / rect.height) * 400;
      setPaddleY(Math.max(0, Math.min(320, mouseY - PADDLE_HEIGHT / 2)));
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => canvas.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  // Keep refs in sync with current values (refs update without re-registering listeners)
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);

  useEffect(() => {
    resetGameRef.current = resetGame;
  }, [resetGame]);

  // Keyboard control support - uses refs to avoid re-registering listeners
  // when gamePhase or resetGame change, preventing race conditions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setKeyboardControls(prev => ({ ...prev, up: true }));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setKeyboardControls(prev => ({ ...prev, down: true }));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // ENTER starts game from menu or restarts from game over
        const phase = gamePhaseRef.current;
        if (phase === 'menu' || phase === 'gameOver') {
          resetGameRef.current?.();
        }
      } else if (e.key === 'p' || e.key === 'P') {
        // P key to toggle pause (only during gameplay)
        const phase = gamePhaseRef.current;
        if (phase === 'playing') {
          setGamePhase('paused');
        } else if (phase === 'paused') {
          setGamePhase('playing');
        }
      } else if (e.key === 'r' || e.key === 'R') {
        // R key to restart game at any time
        resetGameRef.current?.();
      } else if (e.key === 'Escape') {
        // ESC to exit game (handled by parent component App.tsx)
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setKeyboardControls(prev => ({ ...prev, up: false }));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setKeyboardControls(prev => ({ ...prev, down: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Empty deps - never re-registers listeners

  // Cleanup timeout refs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (screenShakeTimeoutRef.current) {
        clearTimeout(screenShakeTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Update paddle position based on keyboard input - DIRECT control, no friction
  useEffect(() => {
    const paddleSpeed = 8; // Pixels per frame for smooth, precise movement

    const updatePaddle = () => {
      const paddleHeight = activePowerUps.bigger_paddle ? PADDLE_HEIGHT * 1.5 : PADDLE_HEIGHT;

      // Direct position update based on input - no velocity, no friction
      setPaddleY(prev => {
        let newY = prev;

        // Direct movement - instant response, instant stop
        if (keyboardControls.up) {
          newY = prev - paddleSpeed;
          setPaddleVelocity(-paddleSpeed); // Set velocity for ball physics
        } else if (keyboardControls.down) {
          newY = prev + paddleSpeed;
          setPaddleVelocity(paddleSpeed); // Set velocity for ball physics
        } else {
          setPaddleVelocity(0); // No movement = no velocity
        }
        // If no keys pressed, paddle stays exactly where it is (no momentum)

        // Clamp to screen bounds
        return Math.max(0, Math.min(400 - paddleHeight, newY));
      });
    };

    // Use requestAnimationFrame for smooth 60fps updates
    let animationId: number;
    const animate = () => {
      updatePaddle();
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [keyboardControls, activePowerUps.bigger_paddle]);

  // Power-up spawn effect with adaptive timing
  useEffect(() => {
    const baseInterval = Math.max(5000, 10000 - (score.player + score.ai) * 500);
    const interval = setInterval(spawnPowerUp, baseInterval);
    return () => clearInterval(interval);
  }, [spawnPowerUp, score]);

  // Enhanced main game loop with multi-ball support
  useGameLoop((deltaTime) => {
    if (gamePhase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update speed based on time since last goal
    const speedMultiplier = activePowerUps.slower_ball 
      ? 0.6 
      : Math.min(MAX_BALL_SPEED / INITIAL_BALL_SPEED, 1 + (timeSinceLastGoal * SPEED_INCREMENT));

    const normalizedDelta = deltaTime / (1000 / 60);

    // Collect new balls to add after map (for multi-ball power-up)
    const newBallsToAdd: Ball[] = [];

    // Update all balls
    const updatedBalls = balls.map(ball => {
      const newBall = {
        ...ball,
        x: ball.x + ball.vx * speedMultiplier * normalizedDelta,
        y: ball.y + ball.vy * speedMultiplier * normalizedDelta
      };

      // Ball trail effect - only every 3rd frame for performance
      if (frameCounter.current % 3 === 0) {
        createTrail(ball.x, ball.y, ball.color);
      }

      // Power-up collision detection
      powerUps.forEach((powerUp, index) => {
        if (powerUp.active &&
            Math.abs(newBall.x - powerUp.x) < BALL_SIZE * 2 &&
            Math.abs(newBall.y - powerUp.y) < BALL_SIZE * 2) {
          
          activatePowerUp(powerUp.type);
          const updatedPowerUps = [...powerUps];
          updatedPowerUps.splice(index, 1);
          setPowerUps(updatedPowerUps);

          // Track power-up usage
          powerUpsUsed.current += 1;

          // Power Master achievement: Collect 5 power-ups in one game
          if (powerUpsUsed.current >= 5) {
            unlockAchievement('pong_power_master');
          }
          
          // Special effects for multi-ball power-up
          if (powerUp.type === 'multi_ball' && balls.length < 3) {
            addImpactEffect(powerUp.x, powerUp.y, 15);
            playSFX('powerup');
            // Collect balls to spawn (add later, outside map)
            const ballsToSpawn = Math.min(2, 3 - balls.length);
            for (let i = 0; i < ballsToSpawn; i++) {
              // Ensure proper ball speed - randomly choose direction, then apply full speed
              const direction = Math.random() > 0.5 ? 1 : -1;
              const vx = direction * (INITIAL_BALL_SPEED + Math.random() * 2);
              const vy = (Math.random() - 0.5) * INITIAL_BALL_SPEED * 1.5;

              newBallsToAdd.push(createBall(
                400 + (Math.random() - 0.5) * 200,
                200 + (Math.random() - 0.5) * 200,
                vx,
                vy
              ));
            }
          } else {
            addImpactEffect(powerUp.x, powerUp.y, 8);
            playSFX('powerup');
          }
        }
      });

      // Wall collision with enhanced effects
      if (newBall.y <= 0 || newBall.y >= 400 - BALL_SIZE) {
        newBall.vy = -newBall.vy;
        addImpactEffect(newBall.x, newBall.y <= 0 ? 0 : 400, 5);
        playSFX('pongBounce');
      }

      // Enhanced paddle collision detection
      const paddleHeight = activePowerUps.bigger_paddle ? PADDLE_HEIGHT * 1.5 : PADDLE_HEIGHT;
      
      // Player paddle collision
      if (newBall.x <= PADDLE_WIDTH && 
          newBall.y >= paddleY && 
          newBall.y <= paddleY + paddleHeight &&
          newBall.vx < 0) {
        
        const relativeIntersectY = (paddleY + (paddleHeight / 2)) - newBall.y;
        const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
        const bounceAngle = normalizedIntersectY * 0.75;
        const speed = Math.sqrt(newBall.vx * newBall.vx + newBall.vy * newBall.vy);
        
        newBall.vx = Math.abs(speed * Math.cos(bounceAngle));
        newBall.vy = -speed * Math.sin(bounceAngle);
        
        // Enhanced effects
        addImpactEffect(newBall.x, newBall.y, 10);
        playSFX('pongBounce');
        setCombo(prev => {
          const newCombo = prev + 1;
          maxComboRef.current = Math.max(maxComboRef.current, newCombo);
          return newCombo;
        });
        setLastPaddleHit('player');

        // Track rally
        if (lastPaddleHit === 'ai') {
          rallyCount.current += 1;
          maxRallyRef.current = Math.max(maxRallyRef.current, rallyCount.current);

          // Rally achievements
          if (rallyCount.current === 5) {
            unlockAchievement('pong_combo_king');
          } else if (rallyCount.current === 20) {
            unlockAchievement('pong_rally_master');
          }
        }
        
        // Add slight velocity boost based on paddle movement
        newBall.vy += paddleVelocity * 0.1;

        // Increase AI difficulty based on player performance (reduced gain for easier gameplay)
        setAiDifficulty(prev => Math.min(5, prev + 0.05));
      }
      
      // AI paddle collision
      else if (newBall.x >= 800 - PADDLE_WIDTH - BALL_SIZE && 
               newBall.y >= aiPaddleY && 
               newBall.y <= aiPaddleY + PADDLE_HEIGHT &&
               newBall.vx > 0) {
        
        const relativeIntersectY = (aiPaddleY + (PADDLE_HEIGHT / 2)) - newBall.y;
        const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2);
        const bounceAngle = normalizedIntersectY * 0.75;
        const speed = Math.sqrt(newBall.vx * newBall.vx + newBall.vy * newBall.vy);
        
        newBall.vx = -Math.abs(speed * Math.cos(bounceAngle));
        newBall.vy = -speed * Math.sin(bounceAngle);
        
        addImpactEffect(newBall.x, newBall.y, 8);
        playSFX('pongBounce');
        setLastPaddleHit('ai');
      }

      return newBall;
    });

    // Handle scoring and ball removal
    const remainingBalls = [];
    let scoreChanged = false;
    
    updatedBalls.forEach(ball => {
      if (ball.x <= 0) {
        // AI scores
        const multiplier = activePowerUps.score_multiplier ? 2 : 1;
        setScore(prev => ({ ...prev, ai: prev.ai + multiplier }));
        addImpactEffect(0, ball.y, 20);
        playSFX('hit');
        setCombo(0);
        scoreChanged = true;
        
        // Reset rally count when AI scores
        rallyCount.current = 0;
      } else if (ball.x >= 800) {
        // Player scores
        const multiplier = activePowerUps.score_multiplier ? 2 : 1;
        const comboBonus = Math.floor(combo / 3);
        setScore(prev => ({ ...prev, player: prev.player + multiplier + comboBonus }));
        addImpactEffect(800, ball.y, 20);
        playSFX('score');
        if (comboBonus > 0) playSFX('combo');
        scoreChanged = true;
        
        // First point achievement
        if (!hasFirstPoint.current) {
          hasFirstPoint.current = true;
          unlockAchievement('pong_first_point');
        }
        
        // Rally count resets on score
        rallyCount.current = 0;
      } else {
        remainingBalls.push(ball);
      }
    });

    // Reset or maintain balls
    if (remainingBalls.length === 0) {
      // All balls scored, reset
      setBalls([createBall(400, 200, Math.random() > 0.5 ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED, 0)]);
      setTimeSinceLastGoal(0);
    } else {
      setBalls(remainingBalls);
      if (scoreChanged) {
        setTimeSinceLastGoal(prev => prev + deltaTime / 1000);
      }
    }

    // Add new balls from multi-ball power-up (outside of map)
    if (newBallsToAdd.length > 0) {
      setBalls(prev => [...prev, ...newBallsToAdd]);
    }

    // Increment frame counter for performance tracking
    frameCounter.current++;

    // Check win condition
    if (score.player >= 10 || score.ai >= 10) {
      setGamePhase('gameOver');
      playSFX(score.player >= 10 ? 'levelUp' : 'gameOver');
      addScreenShake(30);

      // Save game stats - session time tracked but not currently displayed
      const playerWon = score.player >= 10;
      const currentHighScore = saveData.games.vortexPong?.highScore || 0;
      const newHighScore = Math.max(currentHighScore, score.player);
      const previousGamesPlayed = saveData.games.vortexPong?.stats?.gamesPlayed || 0;
      const previousWins = saveData.games.vortexPong?.stats?.wins || 0;
      const previousTotalScore = saveData.games.vortexPong?.stats?.totalScore || 0;
      const previousBestCombo = saveData.games.vortexPong?.stats?.bestCombo || 0;
      const previousLongestRally = saveData.games.vortexPong?.stats?.longestRally || 0;

      // Clear any existing save timeout before setting new one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        updateGameSave('vortexPong', {
          highScore: newHighScore,
          level: 1,
          stats: {
            gamesPlayed: previousGamesPlayed + 1,
            wins: playerWon ? previousWins + 1 : previousWins,
            totalScore: previousTotalScore + score.player,
            bestCombo: Math.max(previousBestCombo, maxComboRef.current),
            longestRally: Math.max(previousLongestRally, maxRallyRef.current)
          }
        });
        saveTimeoutRef.current = null;
      }, 100);

      // Check achievements on game over
      if (score.player >= 10) {
        unlockAchievement('pong_beat_ai');

        // Perfect game achievement
        if (score.ai === 0) {
          unlockAchievement('pong_perfect_game');
        }
      }

      // Multi-ball achievement
      if (balls.length >= 3) {
        unlockAchievement('pong_multi_ball');
      }

      return;
    }

    // Enhanced AI movement with adaptive difficulty and smooth velocity
    const closestBall = balls.reduce((closest, ball) => 
      !closest || ball.x > closest.x ? ball : closest, null as Ball | null);
    
    if (closestBall) {
      const maxAiSpeed = Math.min(aiDifficulty, 3.5); // Cap AI speed - further reduced for easier gameplay

      // Add reaction delay when ball is far away
      const distanceFactor = closestBall.x < 400 ? 0.5 : 1.0; // Slower reaction when ball is on player's side
      const acceleration = closestBall.vx > 0 ? maxAiSpeed * 0.3 * distanceFactor : maxAiSpeed * 0.15 * distanceFactor;

      // Add random error to make AI less accurate - increased for easier gameplay
      const errorMargin = (Math.random() - 0.5) * 80; // Random offset of ±40 pixels (was ±15)
      const targetY = closestBall.y - PADDLE_HEIGHT / 2 + errorMargin;
      const diff = targetY - aiPaddleY;

      // Apply acceleration towards target with more damping
      let newVelocity = aiPaddleVelocity * 0.88; // Increased friction from 0.92 to 0.88

      // Add occasional "mistakes" - 20% chance AI moves wrong direction (was 10%)
      if (Math.random() < 0.2) {
        newVelocity *= -0.5; // Briefly move wrong way
      } else if (Math.abs(diff) > 10) {
        if (diff > 0) {
          newVelocity += acceleration;
        } else {
          newVelocity -= acceleration;
        }
      }

      // Clamp velocity
      newVelocity = Math.max(-maxAiSpeed * 2, Math.min(maxAiSpeed * 2, newVelocity));
      
      setAiPaddleVelocity(newVelocity);
      setAiPaddleY(prev => {
        const newY = prev + newVelocity;
        return Math.max(0, Math.min(320, newY));
      });
    }

    // Update impact effects in-place using ref (no object recreation)
    let writeIndex = 0;
    for (let i = 0; i < impactEffectsRef.current.length; i++) {
      const effect = impactEffectsRef.current[i];
      effect.life -= 0.05;
      if (effect.life > 0) {
        impactEffectsRef.current[writeIndex++] = effect;
      }
    }
    impactEffectsRef.current.length = writeIndex;

    // Update particle system in-place using ref (avoids GC pressure from object recreation)
    for (let i = 0; i < particlesRef.current.length; i++) {
      const particle = particlesRef.current[i];
      particle.z -= particle.speed;
      // Reset particle when it goes off-screen (reuse instead of recreate)
      if (particle.z <= 0) {
        particle.x = Math.random() * 800;
        particle.y = Math.random() * 400;
        particle.z = 100;
        particle.speed = 0.5 + Math.random() * 1;
      }
    }

    // Enhanced rendering - pass refs directly to avoid state updates
    render(canvas, {
      balls: updatedBalls,
      paddleY,
      paddleVelocity,
      aiPaddleY,
      particles: particlesRef.current,
      powerUps,
      activePowerUps,
      score,
      speedMultiplier,
      screenShake,
      impactEffects: impactEffectsRef.current,
      timestamp: Date.now(),
      combo
    });
  });

  // Enhanced render function with multi-ball and effects
  const render = useCallback((canvas: HTMLCanvasElement, props: RenderProps) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply screen shake
    ctx.save();
    ctx.translate(props.screenShake.x, props.screenShake.y);

    // Clear and draw background with subtle matrix effect
    ctx.fillStyle = '#000000';
    ctx.fillRect(-props.screenShake.x, -props.screenShake.y, 800, 400);

    // Draw background particles with depth (optimised - removed shadow for performance)
    // ctx.shadowBlur = 5; // Removed for performance
    ctx.shadowColor = '#00ff00';
    props.particles.forEach(particle => {
      const scale = 400 / (400 + particle.z);
      const x2d = particle.x * scale + (400 * (1 - scale));
      const y2d = particle.y * scale + (200 * (1 - scale));
      const size = Math.max(0.5, 2 * scale);

      ctx.fillStyle = `rgba(0, 255, 0, ${(1 - particle.z / 100) * 0.3})`;
      ctx.beginPath();
      ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render particle effects from particle system
    renderParticles(ctx);

    // Draw power-ups with enhanced pulsing effect
    props.powerUps.forEach(powerUp => {
      const pulse = Math.sin(props.timestamp / 200) * 0.3 + 0.7; // Use prop instead of Date.now()
      const size = 12 * pulse;
      
      // Outer glow (reduced for performance)
      ctx.shadowBlur = 10;
      ctx.shadowColor = getPowerUpColor(powerUp.type);
      
      // Power-up icon based on type
      ctx.fillStyle = getPowerUpColor(powerUp.type);
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(powerUp.x - size * 0.3, powerUp.y - size * 0.3, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw impact effects
    props.impactEffects.forEach(effect => {
      const alpha = effect.life;
      const size = (1 - effect.life) * effect.intensity;
      
      ctx.shadowBlur = 15; // Reduced for performance
      ctx.shadowColor = '#ffffff';
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Secondary ring
      ctx.strokeStyle = `rgba(0, 255, 0, ${alpha * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, size * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw enhanced paddles with glow and size effects
    const paddleHeight = props.activePowerUps.bigger_paddle 
      ? PADDLE_HEIGHT * 1.5 
      : PADDLE_HEIGHT;

    // Player paddle (left)
    ctx.shadowBlur = 12; // Reduced for performance
    ctx.shadowColor = '#00ff00';
    ctx.fillStyle = props.activePowerUps.bigger_paddle 
      ? '#00ffaa' 
      : '#00ff00';
    ctx.fillRect(0, props.paddleY, PADDLE_WIDTH, paddleHeight);
    
    // Paddle glow effect
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(-2, props.paddleY - 2, PADDLE_WIDTH + 4, paddleHeight + 4);

    // AI paddle (right) 
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(788, props.aiPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(786, props.aiPaddleY - 2, PADDLE_WIDTH + 4, PADDLE_HEIGHT + 4);

    // Draw animated center line
    const dashOffset = (props.timestamp / 100) % 20; // Use prop instead of Date.now()
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = dashOffset;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 400);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // Draw all balls with enhanced effects
    props.balls.forEach((ball, index) => {
      // Ball glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = ball.color;
      
      // Main ball
      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x + ball.size/2, ball.y + ball.size/2, ball.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball highlight
      ctx.shadowBlur = 0; // Keep shadows off for performance
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(
        ball.x + ball.size/2 - ball.size * 0.3, 
        ball.y + ball.size/2 - ball.size * 0.3, 
        ball.size * 0.3, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
      
      // Multi-ball indicator
      if (props.balls.length > 1) {
        ctx.fillStyle = `rgba(255, 0, 255, ${0.5 + Math.sin(props.timestamp / 200 + index) * 0.3})`;
        ctx.beginPath();
        ctx.arc(ball.x + ball.size/2, ball.y + ball.size/2, ball.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Speed indicator trails for fast balls
    if (props.speedMultiplier > 1.5) {
      props.balls.forEach(ball => {
        const trailLength = Math.min(50, props.speedMultiplier * 10);
        const trailX = ball.x - (ball.vx / Math.abs(ball.vx)) * trailLength;
        const trailY = ball.y - (ball.vy / Math.abs(ball.vy)) * trailLength;
        
        const gradient = ctx.createLinearGradient(ball.x, ball.y, trailX, trailY);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = ball.size;
        ctx.beginPath();
        ctx.moveTo(ball.x + ball.size/2, ball.y + ball.size/2);
        ctx.lineTo(trailX + ball.size/2, trailY + ball.size/2);
        ctx.stroke();
      });
    }

    // Combo indicator
    if (props.combo > 2) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffff00';
      ctx.fillStyle = `rgba(255, 255, 0, ${0.7 + Math.sin(props.timestamp / 100) * 0.3})`;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${props.combo}`, 400, 50);
    }

    ctx.restore();
  }, [renderParticles]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="h-full w-full flex items-center justify-center bg-black relative outline-none"
      style={{
        boxShadow: hasFocus ? '0 0 0 2px #00ff00' : 'none',
        transition: 'box-shadow 0.2s ease',
      }}
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
      onClick={() => containerRef.current?.focus()}
    >
      <div className="flex flex-col items-center gap-4 max-w-[800px] w-full">
        <motion.canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-auto border-2 border-green-500 rounded-lg shadow-lg cursor-crosshair"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            transform: `translate(${screenShake.x}px, ${screenShake.y}px)`,
          }}
        />

        {/* Controls Help (always visible during gameplay) */}
        {gamePhase === 'playing' && (
          <div className="text-center text-xs text-green-400/60 mt-2">
            <span>↑↓ or W/S to move • P to pause • R to restart</span>
          </div>
        )}

        <div className="w-full flex flex-col items-center gap-2">
          <PowerUpIndicator activePowerUps={activePowerUps} />
          <ScoreBoard score={score} speed={currentBallSpeed} />
          
          {/* Enhanced Game Stats */}
          <div className="flex flex-wrap justify-center gap-4 text-xs font-mono">
            <div className="text-green-400">
              Balls: <span className="text-white">{balls.length}</span>
            </div>
            <div className="text-green-400">
              Combo: <span className="text-yellow-400">{combo}</span>
            </div>
            <div className="text-green-400">
              AI Level: <span className="text-red-400">{Math.floor(aiDifficulty)}</span>
            </div>
            {lastPaddleHit && (
              <div className="text-green-400">
                Last Hit: <span className="text-cyan-400">{lastPaddleHit.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-green-500 text-sm opacity-70 font-mono text-center">
          <div>Controls: ↑↓ / WASD / Mouse to move • P pause • R restart</div>
          <div className="text-xs mt-1 opacity-50">
            Multi-ball, Screen shake, Adaptive AI
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gamePhase === 'gameOver' && <GameOverModal score={score} onRestart={resetGame} />}
      </AnimatePresence>

      {/* Menu overlay */}
      <AnimatePresence>
        {gamePhase === 'menu' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
          >
            <div className="text-center">
              <div className="text-green-500 text-4xl font-mono mb-6" style={{ textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00' }}>
                VORTEX PONG
              </div>
              <div className="text-green-400 text-lg font-mono mb-4">
                High Score: {saveData.games.vortexPong?.highScore || 0}
              </div>
              <div className="text-green-400/80 text-sm font-mono mb-6 space-y-1 border-t border-b border-green-500/40 py-3">
                <div className="font-bold text-green-500 mb-2">HOW TO PLAY</div>
                <div>↑↓ or W/S or Mouse to move paddle</div>
                <div>Beat the AI in an epic rally</div>
                <div>First to 10 points wins</div>
              </div>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-green-500 text-black font-bold hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto mb-4"
              >
                <Play className="w-5 h-5" />
                START GAME
              </button>
              <div className="text-green-500 text-sm font-mono mb-4">
                or press ENTER
              </div>
              <div className="text-green-400/40 text-xs font-mono">
                ESC to exit • P to pause during game
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause overlay */}
      <AnimatePresence>
        {gamePhase === 'paused' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
          >
            <div className="text-center">
              <div className="text-green-500 text-4xl font-mono mb-4 animate-pulse">
                PAUSED
              </div>
              <div className="text-green-400 text-lg font-mono mb-2">
                Score: {score.player} - {score.ai}
              </div>
              <div className="text-green-400/60 text-sm font-mono">
                Press P to resume
              </div>
              <div className="text-green-400/40 text-xs font-mono mt-2">
                ESC to exit • R to restart
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}