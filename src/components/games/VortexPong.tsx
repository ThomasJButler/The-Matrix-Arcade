import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
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
const PADDLE_SPEED = 8; // Pixels per frame for smooth, precise movement

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

  // UI state — only values that React DOM needs to render overlays and stats.
  // Per-frame game data lives in refs to avoid re-renders and rAF restarts.
  const [gamePhase, setGamePhase] = useState<GamePhase>(autoStart ? 'playing' : 'menu');
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [hasFocus, setHasFocus] = useState(false);
  const [combo, setCombo] = useState(0);
  const [aiDifficulty, setAiDifficulty] = useState(2.5);
  const [lastPaddleHit, setLastPaddleHit] = useState<'player' | 'ai' | null>(null);
  const [ballCount, setBallCount] = useState(1);

  // Per-frame mutable game data — refs so the rAF loop never restarts
  const ballsRef = useRef<Ball[]>([createBall(400, 200, -INITIAL_BALL_SPEED, 0)]);
  const paddleYRef = useRef(150);
  const aiPaddleYRef = useRef(150);
  const paddleVelocityRef = useRef(0);
  const aiPaddleVelocityRef = useRef(0);
  const keysRef = useRef(new Set<string>());
  const screenShakeRef = useRef({ x: 0, y: 0 });
  const timeSinceLastGoalRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const impactEffectsRef = useRef<Array<{ x: number; y: number; intensity: number; life: number }>>([]);
  const frameCounter = useRef(0);
  const scoreRef = useRef({ player: 0, ai: 0 });

  // Stable callback refs — synced every render so the rAF loop always
  // calls the latest closure without needing to tear down and rebuild
  const updateGameRef = useRef<(deltaTime: number) => void>();
  const renderRef = useRef<(canvas: HTMLCanvasElement, timestamp: number) => void>();
  const gamePhaseRef = useRef(gamePhase);
  const resetGameRef = useRef<() => void>();
  const autoStartRef = useRef(autoStart);

  // Hook data refs — so the game loop can read current hook values
  const activePowerUpsRef = useRef<Record<string, boolean>>({});
  const powerUpsRef = useRef<PowerUp[]>([]);

  // Session tracking refs
  const rallyCount = useRef(0);
  const hasFirstPoint = useRef(false);
  const powerUpsUsed = useRef(0);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const maxComboRef = useRef(0);
  const maxRallyRef = useRef(0);

  // Timeout refs for cleanup — prevents memory leaks when component unmounts
  const screenShakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Custom hooks
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

  // Auto-focus container on mount and when gamePhase changes
  useEffect(() => {
    containerRef.current?.focus();
  }, [gamePhase]);

  // Screen shake — updates ref only, rendered via canvas ctx.translate
  const addScreenShake = useCallback((intensity: number) => {
    screenShakeRef.current = getScreenShake(intensity);
    if (screenShakeTimeoutRef.current) {
      clearTimeout(screenShakeTimeoutRef.current);
    }
    screenShakeTimeoutRef.current = setTimeout(() => {
      screenShakeRef.current = { x: 0, y: 0 };
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

  // Reset game — ref mutations + single batch of setState calls
  const resetGame = useCallback(() => {
    // Reset all per-frame refs
    ballsRef.current = [createBall(400, 200, -INITIAL_BALL_SPEED, 0)];
    paddleYRef.current = 150;
    aiPaddleYRef.current = 150;
    paddleVelocityRef.current = 0;
    aiPaddleVelocityRef.current = 0;
    impactEffectsRef.current = [];
    timeSinceLastGoalRef.current = 0;
    screenShakeRef.current = { x: 0, y: 0 };
    scoreRef.current = { player: 0, ai: 0 };

    // Reset session tracking
    sessionStartTimeRef.current = Date.now();
    rallyCount.current = 0;
    hasFirstPoint.current = false;
    powerUpsUsed.current = 0;
    maxComboRef.current = 0;
    maxRallyRef.current = 0;

    // Single batch of UI state updates
    setScore({ player: 0, ai: 0 });
    setCombo(0);
    setAiDifficulty(2.5);
    setLastPaddleHit(null);
    setBallCount(1);
    setGamePhase('playing');
  }, []);

  // Auto-start on mount if autoStart prop is true
  useEffect(() => {
    if (autoStartRef.current) {
      resetGame();
    }
  }, [resetGame]);

  // Mouse control support — updates ref directly
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseY = ((e.clientY - rect.top) / rect.height) * 400;
      paddleYRef.current = Math.max(0, Math.min(320, mouseY - PADDLE_HEIGHT / 2));
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => canvas.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  // Keyboard — uses keysRef (Set) so key presses never trigger re-renders.
  // Enter/P/R read gamePhaseRef for the latest phase without stale closures.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const phase = gamePhaseRef.current;
        if (phase === 'menu' || phase === 'gameOver') {
          resetGameRef.current?.();
        }
      } else if (e.key === 'p' || e.key === 'P') {
        const phase = gamePhaseRef.current;
        if (phase === 'playing') {
          setGamePhase('paused');
        } else if (phase === 'paused') {
          setGamePhase('playing');
        }
      } else if (e.key === 'r' || e.key === 'R') {
        resetGameRef.current?.();
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
  }, []); // Empty deps — never re-registers listeners

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

  // Power-up spawn effect with adaptive timing
  useEffect(() => {
    const s = scoreRef.current;
    const baseInterval = Math.max(5000, 10000 - (s.player + s.ai) * 500);
    const interval = setInterval(spawnPowerUp, baseInterval);
    return () => clearInterval(interval);
  }, [spawnPowerUp, score]);

  // --- Game update function ---
  // Defined as a regular function (not useCallback) so it always has a fresh
  // closure with the latest state. Synced to updateGameRef every render.
  const updateGame = (deltaTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const curActivePowerUps = activePowerUpsRef.current;
    const curPowerUps = powerUpsRef.current;

    // --- Paddle update (merged from separate rAF loop) ---
    const paddleHeight = curActivePowerUps.bigger_paddle ? PADDLE_HEIGHT * 1.5 : PADDLE_HEIGHT;
    const keys = keysRef.current;

    if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) {
      paddleYRef.current = Math.max(0, paddleYRef.current - PADDLE_SPEED);
      paddleVelocityRef.current = -PADDLE_SPEED;
    } else if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) {
      paddleYRef.current = Math.min(400 - paddleHeight, paddleYRef.current + PADDLE_SPEED);
      paddleVelocityRef.current = PADDLE_SPEED;
    } else {
      paddleVelocityRef.current = 0;
    }

    // --- Speed calculation ---
    const speedMultiplier = curActivePowerUps.slower_ball
      ? 0.6
      : Math.min(MAX_BALL_SPEED / INITIAL_BALL_SPEED, 1 + (timeSinceLastGoalRef.current * SPEED_INCREMENT));

    const normalizedDelta = deltaTime / (1000 / 60);

    // Collect new balls to add after map (for multi-ball power-up)
    const newBallsToAdd: Ball[] = [];
    const currentBalls = ballsRef.current;
    const localScore = { ...scoreRef.current };
    let scoreChanged = false;

    // --- Update all balls ---
    const updatedBalls = currentBalls.map(ball => {
      const newBall = {
        ...ball,
        x: ball.x + ball.vx * speedMultiplier * normalizedDelta,
        y: ball.y + ball.vy * speedMultiplier * normalizedDelta
      };

      // Ball trail effect — only every 3rd frame for performance
      if (frameCounter.current % 3 === 0) {
        createTrail(ball.x, ball.y, ball.color);
      }

      // Power-up collision detection
      curPowerUps.forEach((powerUp, index) => {
        if (powerUp.active &&
            Math.abs(newBall.x - powerUp.x) < BALL_SIZE * 2 &&
            Math.abs(newBall.y - powerUp.y) < BALL_SIZE * 2) {

          activatePowerUp(powerUp.type);
          const updatedPowerUps = [...curPowerUps];
          updatedPowerUps.splice(index, 1);
          setPowerUps(updatedPowerUps);

          // Track power-up usage
          powerUpsUsed.current += 1;

          // Power Master achievement: Collect 5 power-ups in one game
          if (powerUpsUsed.current >= 5) {
            unlockAchievement('pong_power_master');
          }

          // Special effects for multi-ball power-up
          if (powerUp.type === 'multi_ball' && currentBalls.length < 3) {
            addImpactEffect(powerUp.x, powerUp.y, 15);
            playSFX('powerup');
            // Collect balls to spawn (add later, outside map)
            const ballsToSpawn = Math.min(2, 3 - currentBalls.length);
            for (let i = 0; i < ballsToSpawn; i++) {
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
      const ph = curActivePowerUps.bigger_paddle ? PADDLE_HEIGHT * 1.5 : PADDLE_HEIGHT;

      // Player paddle collision
      if (newBall.x <= PADDLE_WIDTH &&
          newBall.y >= paddleYRef.current &&
          newBall.y <= paddleYRef.current + ph &&
          newBall.vx < 0) {

        const relativeIntersectY = (paddleYRef.current + (ph / 2)) - newBall.y;
        const normalizedIntersectY = relativeIntersectY / (ph / 2);
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
        newBall.vy += paddleVelocityRef.current * 0.1;

        // Increase AI difficulty based on player performance
        setAiDifficulty(prev => Math.min(5, prev + 0.05));
      }

      // AI paddle collision
      else if (newBall.x >= 800 - PADDLE_WIDTH - BALL_SIZE &&
               newBall.y >= aiPaddleYRef.current &&
               newBall.y <= aiPaddleYRef.current + PADDLE_HEIGHT &&
               newBall.vx > 0) {

        const relativeIntersectY = (aiPaddleYRef.current + (PADDLE_HEIGHT / 2)) - newBall.y;
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

    // --- Handle scoring and ball removal ---
    const remainingBalls: Ball[] = [];

    updatedBalls.forEach(ball => {
      if (ball.x <= 0) {
        // AI scores
        const multiplier = curActivePowerUps.score_multiplier ? 2 : 1;
        localScore.ai += multiplier;
        addImpactEffect(0, ball.y, 20);
        playSFX('hit');
        setCombo(0);
        scoreChanged = true;

        // Reset rally count when AI scores
        rallyCount.current = 0;
      } else if (ball.x >= 800) {
        // Player scores
        const multiplier = curActivePowerUps.score_multiplier ? 2 : 1;
        const comboBonus = Math.floor(combo / 3);
        localScore.player += multiplier + comboBonus;
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
      ballsRef.current = [createBall(400, 200, Math.random() > 0.5 ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED, 0)];
      timeSinceLastGoalRef.current = 0;
    } else {
      ballsRef.current = remainingBalls;
      if (scoreChanged) {
        timeSinceLastGoalRef.current += deltaTime / 1000;
      }
    }

    // Add new balls from multi-ball power-up (outside of map)
    if (newBallsToAdd.length > 0) {
      ballsRef.current = [...ballsRef.current, ...newBallsToAdd];
    }

    // Sync score to ref and state only when changed
    if (scoreChanged) {
      scoreRef.current = localScore;
      setScore({ ...localScore });
      setBallCount(ballsRef.current.length);
    }

    // Increment frame counter for performance tracking
    frameCounter.current++;

    // --- Win condition — uses localScore which is always current ---
    if (localScore.player >= 10 || localScore.ai >= 10) {
      setGamePhase('gameOver');
      playSFX(localScore.player >= 10 ? 'levelUp' : 'gameOver');
      addScreenShake(30);

      // Save game stats
      const playerWon = localScore.player >= 10;
      const currentHighScore = saveData.games.vortexPong?.highScore || 0;
      const newHighScore = Math.max(currentHighScore, localScore.player);
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
            totalScore: previousTotalScore + localScore.player,
            bestCombo: Math.max(previousBestCombo, maxComboRef.current),
            longestRally: Math.max(previousLongestRally, maxRallyRef.current)
          }
        });
        saveTimeoutRef.current = null;
      }, 100);

      // Check achievements on game over
      if (localScore.player >= 10) {
        unlockAchievement('pong_beat_ai');

        // Perfect game achievement
        if (localScore.ai === 0) {
          unlockAchievement('pong_perfect_game');
        }
      }

      // Multi-ball achievement
      if (ballsRef.current.length >= 3) {
        unlockAchievement('pong_multi_ball');
      }

      return;
    }

    // --- Enhanced AI movement with adaptive difficulty ---
    const closestBall = ballsRef.current.reduce((closest, ball) =>
      !closest || ball.x > closest.x ? ball : closest, null as Ball | null);

    if (closestBall) {
      const maxAiSpeed = Math.min(aiDifficulty, 3.5); // Cap AI speed

      // Add reaction delay when ball is far away
      const distanceFactor = closestBall.x < 400 ? 0.5 : 1.0;
      const acceleration = closestBall.vx > 0 ? maxAiSpeed * 0.3 * distanceFactor : maxAiSpeed * 0.15 * distanceFactor;

      // Add random error to make AI less accurate
      const errorMargin = (Math.random() - 0.5) * 80;
      const targetY = closestBall.y - PADDLE_HEIGHT / 2 + errorMargin;
      const diff = targetY - aiPaddleYRef.current;

      // Apply acceleration towards target with damping
      let newVelocity = aiPaddleVelocityRef.current * 0.88;

      // Occasional mistakes — 20% chance AI moves wrong direction
      if (Math.random() < 0.2) {
        newVelocity *= -0.5;
      } else if (Math.abs(diff) > 10) {
        if (diff > 0) {
          newVelocity += acceleration;
        } else {
          newVelocity -= acceleration;
        }
      }

      // Clamp velocity
      newVelocity = Math.max(-maxAiSpeed * 2, Math.min(maxAiSpeed * 2, newVelocity));

      aiPaddleVelocityRef.current = newVelocity;
      aiPaddleYRef.current = Math.max(0, Math.min(320, aiPaddleYRef.current + newVelocity));
    }

    // --- Update impact effects in-place ---
    let writeIndex = 0;
    for (let i = 0; i < impactEffectsRef.current.length; i++) {
      const effect = impactEffectsRef.current[i];
      effect.life -= 0.05;
      if (effect.life > 0) {
        impactEffectsRef.current[writeIndex++] = effect;
      }
    }
    impactEffectsRef.current.length = writeIndex;

    // --- Update background particles in-place ---
    for (let i = 0; i < particlesRef.current.length; i++) {
      const particle = particlesRef.current[i];
      particle.z -= particle.speed;
      if (particle.z <= 0) {
        particle.x = Math.random() * 800;
        particle.y = Math.random() * 400;
        particle.z = 100;
        particle.speed = 0.5 + Math.random() * 1;
      }
    }

    // Sync ball count to state if changed
    if (ballsRef.current.length !== ballCount) {
      setBallCount(ballsRef.current.length);
    }

    // Render this frame
    renderRef.current?.(canvas, Date.now());
  };

  // --- Render function — reads directly from refs ---
  const renderGame = (canvas: HTMLCanvasElement, timestamp: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const curActivePowerUps = activePowerUpsRef.current;
    const curPowerUps = powerUpsRef.current;
    const shake = screenShakeRef.current;

    // Apply screen shake
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // Clear and draw background with subtle matrix effect
    ctx.fillStyle = '#000000';
    ctx.fillRect(-shake.x, -shake.y, 800, 400);

    // Draw background particles with depth
    ctx.shadowColor = '#00ff00';
    particlesRef.current.forEach(particle => {
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
    curPowerUps.forEach(powerUp => {
      const pulse = Math.sin(timestamp / 200) * 0.3 + 0.7;
      const size = 12 * pulse;

      // Outer glow
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
    impactEffectsRef.current.forEach(effect => {
      const alpha = effect.life;
      const size = (1 - effect.life) * effect.intensity;

      ctx.shadowBlur = 15;
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
    const currentPaddleHeight = curActivePowerUps.bigger_paddle
      ? PADDLE_HEIGHT * 1.5
      : PADDLE_HEIGHT;

    // Player paddle (left)
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00ff00';
    ctx.fillStyle = curActivePowerUps.bigger_paddle
      ? '#00ffaa'
      : '#00ff00';
    ctx.fillRect(0, paddleYRef.current, PADDLE_WIDTH, currentPaddleHeight);

    // Paddle glow effect
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(-2, paddleYRef.current - 2, PADDLE_WIDTH + 4, currentPaddleHeight + 4);

    // AI paddle (right)
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(788, aiPaddleYRef.current, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(786, aiPaddleYRef.current - 2, PADDLE_WIDTH + 4, PADDLE_HEIGHT + 4);

    // Draw animated center line
    const dashOffset = (timestamp / 100) % 20;
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
    const currentBalls = ballsRef.current;
    currentBalls.forEach((ball, index) => {
      // Ball glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = ball.color;

      // Main ball
      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x + ball.size / 2, ball.y + ball.size / 2, ball.size, 0, Math.PI * 2);
      ctx.fill();

      // Ball highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(
        ball.x + ball.size / 2 - ball.size * 0.3,
        ball.y + ball.size / 2 - ball.size * 0.3,
        ball.size * 0.3,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Multi-ball indicator
      if (currentBalls.length > 1) {
        ctx.fillStyle = `rgba(255, 0, 255, ${0.5 + Math.sin(timestamp / 200 + index) * 0.3})`;
        ctx.beginPath();
        ctx.arc(ball.x + ball.size / 2, ball.y + ball.size / 2, ball.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Speed indicator trails for fast balls
    const speedMult = curActivePowerUps.slower_ball
      ? 0.6
      : Math.min(MAX_BALL_SPEED / INITIAL_BALL_SPEED, 1 + (timeSinceLastGoalRef.current * SPEED_INCREMENT));
    if (speedMult > 1.5) {
      currentBalls.forEach(ball => {
        const trailLength = Math.min(50, speedMult * 10);
        const trailX = ball.x - (ball.vx / Math.abs(ball.vx)) * trailLength;
        const trailY = ball.y - (ball.vy / Math.abs(ball.vy)) * trailLength;

        const gradient = ctx.createLinearGradient(ball.x, ball.y, trailX, trailY);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = ball.size;
        ctx.beginPath();
        ctx.moveTo(ball.x + ball.size / 2, ball.y + ball.size / 2);
        ctx.lineTo(trailX + ball.size / 2, trailY + ball.size / 2);
        ctx.stroke();
      });
    }

    // Combo indicator
    if (combo > 2) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffff00';
      ctx.fillStyle = `rgba(255, 255, 0, ${0.7 + Math.sin(timestamp / 100) * 0.3})`;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${combo}`, 400, 50);
    }

    ctx.restore();
  };

  // --- Sync refs every render — keeps game loop calling the latest closure ---
  updateGameRef.current = updateGame;
  renderRef.current = renderGame;
  gamePhaseRef.current = gamePhase;
  resetGameRef.current = resetGame;
  activePowerUpsRef.current = activePowerUps;
  powerUpsRef.current = powerUps;

  // --- Own rAF loop — only restarts when gamePhase changes to/from 'playing' ---
  // This is the key fix: the loop is stable across re-renders because it calls
  // through updateGameRef.current, which is synced every render. No more
  // teardown/rebuild cascade when state changes.
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    let animationId: number;
    let previousTime: number | undefined;

    const loop = (timestamp: number) => {
      const delta = timestamp - (previousTime ?? timestamp);
      previousTime = timestamp;

      if (delta > 0) {
        updateGameRef.current?.(delta);
      }

      if (gamePhaseRef.current === 'playing') {
        animationId = requestAnimationFrame(loop);
      }
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [gamePhase]);

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
      onMouseEnter={() => containerRef.current?.focus()}
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
        />

        {/* Controls Help (always visible during gameplay) */}
        {gamePhase === 'playing' && (
          <div className="text-center text-xs text-green-400/60 mt-2">
            <span>↑↓ or W/S to move • P to pause • R to restart</span>
          </div>
        )}

        <div className="w-full flex flex-col items-center gap-2">
          <PowerUpIndicator activePowerUps={activePowerUps} />
          <ScoreBoard score={score} speed={INITIAL_BALL_SPEED} />

          {/* Enhanced Game Stats */}
          <div className="flex flex-wrap justify-center gap-4 text-xs font-mono">
            <div className="text-green-400">
              Balls: <span className="text-white">{ballCount}</span>
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
