import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { usePowerUps } from '../../hooks/usePowerUps';
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

type PowerUp = {
  x: number;
  y: number;
  type: 'bigger_paddle' | 'slower_ball' | 'score_multiplier';
  active: boolean;
};

// Add missing interface
interface RenderProps {
  ballPos: { x: number; y: number };
  paddleY: number;
  aiPaddleY: number;
  particles: Particle[];
  powerUps: PowerUp[];
  activePowerUps: Record<string, boolean>;
  score: { player: number; ai: number };
  speedMultiplier: number;
}

// Add missing utility function
const getPowerUpColor = (type: PowerUp['type']) => {
  const colors = {
    bigger_paddle: '#00ff00',
    slower_ball: '#00ffff',
    score_multiplier: '#ffff00'
  };
  return colors[type] || '#ffffff';
};

export default function VortexPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paddleY, setPaddleY] = useState(150);
  const [aiPaddleY, setAiPaddleY] = useState(150);
  const [ballPos, setBallPos] = useState({ x: 400, y: 200 });
  const [ballVel, setBallVel] = useState({ x: -INITIAL_BALL_SPEED, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [gameOver, setGameOver] = useState(false);

  // New states
  const [timeSinceLastGoal, setTimeSinceLastGoal] = useState(0);
  const [currentBallSpeed, setCurrentBallSpeed] = useState(INITIAL_BALL_SPEED);

  // Use custom hooks
  const { powerUps, setPowerUps, activePowerUps, spawnPowerUp, activatePowerUp } = usePowerUps();

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

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setPaddleY(y => Math.max(0, y - 20));
      } else if (e.key === 'ArrowDown') {
        setPaddleY(y => Math.min(320, y + 20));
      } else if (e.key === 'Enter' && gameOver) {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  const resetGame = () => {
    setBallPos({ x: 400, y: 200 });
    setBallVel({ x: -INITIAL_BALL_SPEED, y: 0 });
    setPaddleY(150);
    setAiPaddleY(150);
    setScore({ player: 0, ai: 0 });
    setGameOver(false);
  };

  // Power-up spawn effect
  useEffect(() => {
    const interval = setInterval(spawnPowerUp, 10000);
    return () => clearInterval(interval);
  }, [spawnPowerUp]);

  // Main game loop using custom hook
  useGameLoop((deltaTime) => {
    if (gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update speed based on time since last goal
    const speedMultiplier = activePowerUps.slower_ball 
      ? 1 
      : Math.min(MAX_BALL_SPEED / INITIAL_BALL_SPEED, 1 + (timeSinceLastGoal * SPEED_INCREMENT));

    // Update ball position with current speed and delta time
    const normalizedDelta = deltaTime / (1000 / 60); // Normalize to 60 FPS
    const newBallPos = {
      x: ballPos.x + ballVel.x * speedMultiplier * normalizedDelta,
      y: ballPos.y + ballVel.y * speedMultiplier * normalizedDelta
    };

    // Power-up collision detection
    powerUps.forEach((powerUp, index) => {
      if (powerUp.active &&
          Math.abs(newBallPos.x - powerUp.x) < BALL_SIZE * 2 &&
          Math.abs(newBallPos.y - powerUp.y) < BALL_SIZE * 2) {
        
        activatePowerUp(powerUp.type);
        const updatedPowerUps = [...powerUps];
        updatedPowerUps.splice(index, 1);
        setPowerUps(updatedPowerUps);
      }
    });

    // Ball collision with top and bottom
    if (newBallPos.y <= 0 || newBallPos.y >= 400 - BALL_SIZE) {
      setBallVel(vel => ({ ...vel, y: -vel.y }));
    }

    // Ball collision with paddles
    if (newBallPos.x <= PADDLE_WIDTH && 
        newBallPos.y >= paddleY && 
        newBallPos.y <= paddleY + PADDLE_HEIGHT) {
      const relativeIntersectY = (paddleY + (PADDLE_HEIGHT / 2)) - newBallPos.y;
      const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2);
      const bounceAngle = normalizedIntersectY * 0.75;
      
      setBallVel({
        x: INITIAL_BALL_SPEED * Math.cos(bounceAngle),
        y: -INITIAL_BALL_SPEED * Math.sin(bounceAngle)
      });
    } else if (newBallPos.x >= 800 - PADDLE_WIDTH - BALL_SIZE && 
               newBallPos.y >= aiPaddleY && 
               newBallPos.y <= aiPaddleY + PADDLE_HEIGHT) {
      const relativeIntersectY = (aiPaddleY + (PADDLE_HEIGHT / 2)) - newBallPos.y;
      const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2);
      const bounceAngle = normalizedIntersectY * 0.75;
      
      setBallVel({
        x: -INITIAL_BALL_SPEED * Math.cos(bounceAngle),
        y: -INITIAL_BALL_SPEED * Math.sin(bounceAngle)
      });
    }

    // Score points
    if (newBallPos.x <= 0) {
      const newScore = { ...score, ai: score.ai + 1 };
      setScore(newScore);
      if (newScore.ai >= 10) setGameOver(true);
      else setBallPos({ x: 400, y: 200 });
    } else if (newBallPos.x >= 800) {
      const newScore = { ...score, player: score.player + 1 };
      setScore(newScore);
      if (newScore.player >= 10) setGameOver(true);
      else setBallPos({ x: 400, y: 200 });
    } else {
      setBallPos(newBallPos);
    }

    // Reset timer on goal
    if (newBallPos.x <= 0 || newBallPos.x >= 800) {
      setTimeSinceLastGoal(0);
      setCurrentBallSpeed(INITIAL_BALL_SPEED);
    }

    // AI movement
    const aiTarget = ballPos.y - PADDLE_HEIGHT / 2;
    const aiSpeed = 4;
    if (aiPaddleY < aiTarget && aiPaddleY < 320) {
      setAiPaddleY(y => y + aiSpeed);
    } else if (aiPaddleY > aiTarget && aiPaddleY > 0) {
      setAiPaddleY(y => y - aiSpeed);
    }

    // Update particles
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

    // Enhanced rendering with visual effects
    render(canvas, {
      ballPos: newBallPos,
      paddleY,
      aiPaddleY,
      particles,
      powerUps,
      activePowerUps,
      score,
      speedMultiplier
    });
  });

  // Render function with enhanced visual effects
  const render = useCallback((canvas: HTMLCanvasElement, props: RenderProps) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 800, 400);

    // Draw particles with glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff00';
    props.particles.forEach(particle => {
      const scale = 400 / (400 + particle.z);
      const x2d = particle.x * scale + (400 * (1 - scale));
      const y2d = particle.y * scale + (200 * (1 - scale));
      const size = Math.max(0.5, 2 * scale);

      ctx.fillStyle = `rgba(0, 255, 0, ${1 - particle.z / 100})`;
      ctx.beginPath();
      ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw power-ups with pulsing effect
    props.powerUps.forEach(powerUp => {
      const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, 10 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = getPowerUpColor(powerUp.type);
      ctx.fill();
    });

    // Draw enhanced paddles
    const paddleHeight = props.activePowerUps.bigger_paddle 
      ? PADDLE_HEIGHT * 1.5 
      : PADDLE_HEIGHT;

    ctx.fillStyle = '#00ff00';
    ctx.shadowBlur = 20;
    ctx.fillRect(0, props.paddleY, PADDLE_WIDTH, paddleHeight);
    ctx.fillRect(788, props.aiPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw center line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 400);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw ball with trail effect
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(props.ballPos.x, props.ballPos.y, BALL_SIZE, BALL_SIZE);
  }, []);

  return (
    <div className="h-full w-full flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4 max-w-[800px] w-full">
        <motion.canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-auto border-2 border-green-500 rounded-lg shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        <div className="w-full flex flex-col items-center gap-2">
          <PowerUpIndicator activePowerUps={activePowerUps} />
          <ScoreBoard score={score} speed={currentBallSpeed} />
        </div>

        <div className="text-green-500 text-sm opacity-70 font-mono">
          Use ↑ and ↓ arrow keys to move
        </div>
      </div>

      <AnimatePresence>
        {gameOver && <GameOverModal score={score} onRestart={resetGame} />}
      </AnimatePresence>
    </div>
  );
}