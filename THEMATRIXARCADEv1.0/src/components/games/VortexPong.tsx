import React, { useEffect, useRef, useState } from 'react';
import { useInterval } from '../../hooks/useInterval';

const PADDLE_HEIGHT = 60;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 6;
const PARTICLE_COUNT = 50;
const INITIAL_BALL_SPEED = 5;

type Particle = {
  x: number;
  y: number;
  z: number;
  speed: number;
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

  // Initialize particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      newParticles.push({
        x: Math.random() * 800 - 400,
        y: Math.random() * 400 - 200,
        z: Math.random() * 800,
        speed: 2 + Math.random() * 2
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
        setPaddleY(y => Math.min(340, y + 20));
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

  // Game loop
  useInterval(() => {
    if (gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update ball position
    const newBallPos = {
      x: ballPos.x + ballVel.x,
      y: ballPos.y + ballVel.y
    };

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
      if (newScore.ai >= 5) setGameOver(true);
      else setBallPos({ x: 400, y: 200 });
    } else if (newBallPos.x >= 800) {
      const newScore = { ...score, player: score.player + 1 };
      setScore(newScore);
      if (newScore.player >= 5) setGameOver(true);
      else setBallPos({ x: 400, y: 200 });
    } else {
      setBallPos(newBallPos);
    }

    // AI movement
    const aiTarget = ballPos.y - PADDLE_HEIGHT / 2;
    const aiSpeed = 4;
    if (aiPaddleY < aiTarget && aiPaddleY < 340) {
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
          z: 800,
          x: Math.random() * 800 - 400,
          y: Math.random() * 400 - 200
        } : {})
      }))
    );

    // Render
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 800, 400);

    // Draw particles
    particles.forEach(particle => {
      const scale = 400 / (400 + particle.z);
      const x2d = particle.x * scale + 400;
      const y2d = particle.y * scale + 200;
      const r = Math.max(0, (1 - particle.z / 800) * 255);
      
      ctx.fillStyle = `rgb(${r}, ${r}, ${r})`;
      ctx.beginPath();
      ctx.arc(x2d, y2d, scale * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw center line
    ctx.strokeStyle = '#00FF00';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 400);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(0, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(790, aiPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.fillRect(ballPos.x, ballPos.y, BALL_SIZE, BALL_SIZE);

    // Draw score
    ctx.font = '32px monospace';
    ctx.fillText(score.player.toString(), 350, 50);
    ctx.fillText(score.ai.toString(), 430, 50);
  }, 1000 / 60);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="border-2 border-green-500"
      />
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center font-mono text-green-500">
            <h2 className="text-2xl mb-4">
              {score.player > score.ai ? 'You Win!' : 'Game Over!'}
            </h2>
            <p className="mb-4">Final Score: {score.player} - {score.ai}</p>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}