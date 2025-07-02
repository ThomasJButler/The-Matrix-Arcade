import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { usePowerUps } from '../../hooks/usePowerUps';
import { useParticleSystem } from '../../hooks/useParticleSystem';
import { useSoundSystem } from '../../hooks/useSoundSystem';
import { PowerUpIndicator } from '../ui/PowerUpIndicator';
import { ScoreBoard } from '../ui/ScoreBoard';
import { GameOverModal } from '../ui/GameOverModal';

// Constants
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 12;
const BALL_SIZE = 6;
const PARTICLE_COUNT = 100;
const INITIAL_BALL_SPEED = 7;
const SPEED_INCREMENT = 0.1; // Speed increases over time
const MAX_BALL_SPEED = 15;

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

export default function VortexPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paddleY, setPaddleY] = useState(150);
  const [aiPaddleY, setAiPaddleY] = useState(150);
  const [balls, setBalls] = useState<Ball[]>([createBall(400, 200, -INITIAL_BALL_SPEED, 0)]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  const [impactEffects, setImpactEffects] = useState<Array<{ x: number; y: number; intensity: number; life: number }>>([]);
  const [aiDifficulty, setAiDifficulty] = useState(4); // Adaptive AI speed

  // Enhanced game states
  const [timeSinceLastGoal, setTimeSinceLastGoal] = useState(0);
  const [currentBallSpeed, setCurrentBallSpeed] = useState(INITIAL_BALL_SPEED);
  const [combo, setCombo] = useState(0);
  const [lastPaddleHit, setLastPaddleHit] = useState<'player' | 'ai' | null>(null);

  // Use custom hooks
  const { powerUps, setPowerUps, activePowerUps, spawnPowerUp, activatePowerUp } = usePowerUps();
  const { explode, createTrail, render: renderParticles } = useParticleSystem();
  const { playSFX, stopMusic } = useSoundSystem();

  // Initialize particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      newParticles.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        z: Math.random() * 100,
        speed: Math.random() * 2 + 1,
      });
    }
    setParticles(newParticles);
  }, []);

  // Enhanced keyboard input with WASD support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setPaddleY(y => Math.max(0, y - 20));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setPaddleY(y => Math.min(320, y + 20));
      } else if (e.key === 'Enter' && gameOver) {
        resetGame();
      } else if (e.key === ' ' && !gameOver) {
        e.preventDefault();
        // Space bar for extra ball if multi-ball is active
        if (activePowerUps.multi_ball && balls.length < 3) {
          const newBall = createBall(
            400 + (Math.random() - 0.5) * 100,
            200 + (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * INITIAL_BALL_SPEED * 2,
            (Math.random() - 0.5) * INITIAL_BALL_SPEED
          );
          setBalls(prev => [...prev, newBall]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, activePowerUps.multi_ball, balls.length]);

  const resetGame = () => {
    setBalls([createBall(400, 200, -INITIAL_BALL_SPEED, 0)]);
    setPaddleY(150);
    setAiPaddleY(150);
    setScore({ player: 0, ai: 0 });
    setGameOver(false);
    setScreenShake({ x: 0, y: 0 });
    setImpactEffects([]);
    setCombo(0);
    setAiDifficulty(4);
    setTimeSinceLastGoal(0);
    setCurrentBallSpeed(INITIAL_BALL_SPEED);
  };

  // Screen shake effect
  const addScreenShake = useCallback((intensity: number) => {
    setScreenShake(getScreenShake(intensity));
    setTimeout(() => setScreenShake({ x: 0, y: 0 }), 100);
  }, []);

  // Impact effect system
  const addImpactEffect = useCallback((x: number, y: number, intensity: number) => {
    const effect = { x, y, intensity, life: 1.0 };
    setImpactEffects(prev => [...prev, effect]);
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

  // Power-up spawn effect with adaptive timing
  useEffect(() => {
    const baseInterval = Math.max(5000, 10000 - (score.player + score.ai) * 500);
    const interval = setInterval(spawnPowerUp, baseInterval);
    return () => clearInterval(interval);
  }, [spawnPowerUp, score]);

  // Enhanced main game loop with multi-ball support
  useGameLoop((deltaTime) => {
    if (gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update speed based on time since last goal
    const speedMultiplier = activePowerUps.slower_ball 
      ? 0.6 
      : Math.min(MAX_BALL_SPEED / INITIAL_BALL_SPEED, 1 + (timeSinceLastGoal * SPEED_INCREMENT));

    const normalizedDelta = deltaTime / (1000 / 60);
    
    // Update all balls
    const updatedBalls = balls.map(ball => {
      const newBall = {
        ...ball,
        x: ball.x + ball.vx * speedMultiplier * normalizedDelta,
        y: ball.y + ball.vy * speedMultiplier * normalizedDelta
      };

      // Ball trail effect
      createTrail(ball.x, ball.y, ball.color);

      // Power-up collision detection
      powerUps.forEach((powerUp, index) => {
        if (powerUp.active &&
            Math.abs(newBall.x - powerUp.x) < BALL_SIZE * 2 &&
            Math.abs(newBall.y - powerUp.y) < BALL_SIZE * 2) {
          
          activatePowerUp(powerUp.type);
          const updatedPowerUps = [...powerUps];
          updatedPowerUps.splice(index, 1);
          setPowerUps(updatedPowerUps);
          
          // Special effects for multi-ball power-up
          if (powerUp.type === 'multi_ball') {
            addImpactEffect(powerUp.x, powerUp.y, 15);
            playSFX('powerup');
            // Spawn additional balls
            const extraBalls = [];
            for (let i = 0; i < 2; i++) {
              extraBalls.push(createBall(
                400 + (Math.random() - 0.5) * 200,
                200 + (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * INITIAL_BALL_SPEED * 2,
                (Math.random() - 0.5) * INITIAL_BALL_SPEED
              ));
            }
            setBalls(prev => [...prev, ...extraBalls]);
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
        setCombo(prev => prev + 1);
        setLastPaddleHit('player');
        
        // Increase AI difficulty based on player performance
        setAiDifficulty(prev => Math.min(8, prev + 0.1));
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
      } else if (ball.x >= 800) {
        // Player scores
        const multiplier = activePowerUps.score_multiplier ? 2 : 1;
        const comboBonus = Math.floor(combo / 3);
        setScore(prev => ({ ...prev, player: prev.player + multiplier + comboBonus }));
        addImpactEffect(800, ball.y, 20);
        playSFX('score');
        if (comboBonus > 0) playSFX('combo');
        scoreChanged = true;
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

    // Check win condition
    if (score.player >= 10 || score.ai >= 10) {
      setGameOver(true);
      stopMusic();
      playSFX(score.player >= 10 ? 'levelUp' : 'gameOver');
      addScreenShake(30);
      return;
    }

    // Enhanced AI movement with adaptive difficulty
    const closestBall = balls.reduce((closest, ball) => 
      !closest || ball.x > closest.x ? ball : closest, null as Ball | null);
    
    if (closestBall) {
      const maxAiSpeed = Math.min(aiDifficulty, 7); // Cap AI speed
      const aiSpeed = closestBall.vx > 0 ? maxAiSpeed : maxAiSpeed * 0.7; // Slower when ball moving away
      
      if (Math.abs(aiPaddleY + PADDLE_HEIGHT / 2 - closestBall.y) > 20) {
        if (aiPaddleY + PADDLE_HEIGHT / 2 < closestBall.y && aiPaddleY < 320) {
          setAiPaddleY(y => Math.min(320, y + aiSpeed));
        } else if (aiPaddleY + PADDLE_HEIGHT / 2 > closestBall.y && aiPaddleY > 0) {
          setAiPaddleY(y => Math.max(0, y - aiSpeed));
        }
      }
    }

    // Update impact effects
    setImpactEffects(prev => 
      prev.map(effect => ({ ...effect, life: effect.life - 0.05 }))
          .filter(effect => effect.life > 0)
    );

    // Update particle system
    setParticles(prevParticles => 
      prevParticles.map(particle => ({
        ...particle,
        z: particle.z - particle.speed,
        ...(particle.z <= 0 ? {
          z: 100,
          x: Math.random() * 800,
          y: Math.random() * 400
        } : {})
      }))
    );

    // Enhanced rendering
    render(canvas, {
      balls: updatedBalls,
      paddleY,
      aiPaddleY,
      particles,
      powerUps,
      activePowerUps,
      score,
      speedMultiplier,
      screenShake,
      impactEffects
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

    // Draw background particles with depth
    ctx.shadowBlur = 10;
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
      const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
      const size = 12 * pulse;
      
      // Outer glow
      ctx.shadowBlur = 20;
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
      
      ctx.shadowBlur = 30;
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
    ctx.shadowBlur = 25;
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
    const dashOffset = (Date.now() / 100) % 20;
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
      ctx.shadowBlur = 0;
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
        ctx.fillStyle = `rgba(255, 0, 255, ${0.5 + Math.sin(Date.now() / 200 + index) * 0.3})`;
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
    if (combo > 2) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffff00';
      ctx.fillStyle = `rgba(255, 255, 0, ${0.7 + Math.sin(Date.now() / 100) * 0.3})`;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${combo}`, 400, 50);
    }

    ctx.restore();
  }, [renderParticles, combo]);

  return (
    <div className="h-full w-full flex items-center justify-center bg-black">
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
          <div>Controls: ↑↓ / WASD / Mouse to move</div>
          <div className="text-xs mt-1 opacity-50">
            {activePowerUps.multi_ball && "SPACE: Launch extra ball | "}
            Multi-ball, Screen shake, Adaptive AI
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameOver && <GameOverModal score={score} onRestart={resetGame} />}
      </AnimatePresence>
    </div>
  );
}