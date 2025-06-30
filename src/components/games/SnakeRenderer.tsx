import React, { useEffect, useRef, useCallback } from 'react';
import { Position, PowerUpType, FoodType, GameState } from '../../hooks/useSnakeGame';
import { useParticleSystem } from '../../hooks/useParticleSystem';

interface SnakeRendererProps {
  snake: Position[];
  food: FoodType[];
  obstacles: Position[];
  powerUps: Array<{ position: Position; type: PowerUpType; id: string }>;
  activePowerUp: PowerUpType;
  gameState: GameState;
  gridSize: number;
  cellSize: number;
  level: number;
  combo: number;
  onFoodCollected?: (x: number, y: number, color: string) => void;
  onPowerUpCollected?: (x: number, y: number) => void;
  onCollision?: (x: number, y: number) => void;
}

const POWER_UP_COLORS: Record<NonNullable<PowerUpType>, string> = {
  speed: '#FF6B6B',
  ghost: '#A8DADC',
  multiplier: '#FFD93D',
  slow: '#6BCF7F',
  matrix_vision: '#00FF00',
  bullet_time: '#FF00FF',
  digital_clone: '#00FFFF',
  hack_mode: '#FF8800',
  data_stream: '#8B00FF'
};

const POWER_UP_ICONS: Record<NonNullable<PowerUpType>, string> = {
  speed: '⚡',
  ghost: '👻',
  multiplier: '×3',
  slow: '🐌',
  matrix_vision: '👁',
  bullet_time: '⏱',
  digital_clone: '👥',
  hack_mode: '💻',
  data_stream: '📡'
};

export default function SnakeRenderer({
  snake,
  food,
  obstacles,
  powerUps,
  activePowerUp,
  gameState,
  gridSize,
  cellSize,
  level,
  combo,
  onFoodCollected,
  onPowerUpCollected,
  onCollision
}: SnakeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystem = useParticleSystem();
  const frameRef = useRef(0);
  const lastTrailRef = useRef<Position>({ x: -1, y: -1 });

  // Draw matrix rain background
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let matrixInterval: NodeJS.Timeout;

    const drawMatrixRain = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn new matrix characters
      if (Math.random() < 0.1) {
        particleSystem.createMatrixRain(canvas.width);
      }
    };

    matrixInterval = setInterval(drawMatrixRain, 50);

    return () => {
      clearInterval(matrixInterval);
    };
  }, [particleSystem]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    if (!ctx || !bgCtx) return;

    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid overlay
    ctx.strokeStyle = activePowerUp === 'matrix_vision' ? '#00FF0040' : '#00FF0010';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw obstacles with effects
    obstacles.forEach(obs => {
      ctx.save();
      
      if (activePowerUp === 'hack_mode') {
        ctx.globalAlpha = 0.3;
      }
      
      const pulse = Math.sin(Date.now() * 0.002 + obs.x + obs.y) * 2;
      
      ctx.fillStyle = '#FF0000';
      ctx.shadowBlur = 15 + pulse;
      ctx.shadowColor = '#FF0000';
      
      ctx.fillRect(
        obs.x * cellSize + 2,
        obs.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );
      
      // Draw warning pattern
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        obs.x * cellSize + 2,
        obs.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );
      ctx.setLineDash([]);
      
      ctx.restore();
    });

    // Draw food with enhanced effects
    food.forEach(f => {
      ctx.save();
      
      const pulse = Math.sin(Date.now() * 0.005) * 3;
      const rotation = Date.now() * 0.002;
      
      ctx.translate(
        f.position.x * cellSize + cellSize / 2,
        f.position.y * cellSize + cellSize / 2
      );
      ctx.rotate(rotation);
      
      // Outer glow
      ctx.shadowBlur = 20 + pulse;
      ctx.shadowColor = f.color;
      
      // Draw based on type
      switch (f.type) {
        case 'special':
          // Animated star
          drawStar(ctx, 0, 0, cellSize / 3, cellSize / 6, 8);
          break;
        case 'mega':
          // Diamond shape
          ctx.beginPath();
          ctx.moveTo(0, -cellSize / 3);
          ctx.lineTo(cellSize / 3, 0);
          ctx.lineTo(0, cellSize / 3);
          ctx.lineTo(-cellSize / 3, 0);
          ctx.closePath();
          break;
        case 'bonus':
          // Hexagon
          drawPolygon(ctx, 0, 0, cellSize / 3, 6);
          break;
        default:
          // Circle
          ctx.beginPath();
          ctx.arc(0, 0, cellSize / 3, 0, Math.PI * 2);
          ctx.closePath();
      }
      
      ctx.fillStyle = f.color;
      ctx.fill();
      
      // Inner shine
      ctx.fillStyle = '#FFFFFF40';
      ctx.beginPath();
      ctx.arc(-cellSize / 8, -cellSize / 8, cellSize / 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw power-ups with special effects
    powerUps.forEach(powerUp => {
      if (!powerUp.type) return;
      
      ctx.save();
      
      const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
      const float = Math.sin(Date.now() * 0.002) * 3;
      
      ctx.translate(
        powerUp.position.x * cellSize + cellSize / 2,
        powerUp.position.y * cellSize + cellSize / 2 + float
      );
      ctx.scale(pulse, pulse);
      ctx.rotate(Date.now() * 0.001);
      
      // Outer ring
      ctx.strokeStyle = POWER_UP_COLORS[powerUp.type];
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = POWER_UP_COLORS[powerUp.type];
      ctx.beginPath();
      ctx.arc(0, 0, cellSize / 2.5, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner icon
      ctx.font = `${cellSize * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(POWER_UP_ICONS[powerUp.type], 0, 0);
      
      ctx.restore();
    });

    // Draw snake with enhanced effects
    snake.forEach((segment, index) => {
      ctx.save();
      
      const isHead = index === 0;
      const opacity = 1 - (index / snake.length) * 0.3;
      
      // Create trail particles for head
      if (isHead && gameState === 'playing') {
        if (segment.x !== lastTrailRef.current.x || segment.y !== lastTrailRef.current.y) {
          particleSystem.createTrail(
            segment.x * cellSize + cellSize / 2,
            segment.y * cellSize + cellSize / 2,
            activePowerUp ? POWER_UP_COLORS[activePowerUp] : '#00FF00'
          );
          lastTrailRef.current = segment;
        }
      }
      
      // Set snake color based on power-up
      let snakeColor = '#00FF00';
      if (activePowerUp === 'ghost') {
        snakeColor = '#FFFFFF';
        ctx.globalAlpha = 0.5 * opacity;
      } else if (activePowerUp === 'hack_mode') {
        snakeColor = '#FF8800';
      } else if (activePowerUp === 'matrix_vision') {
        snakeColor = '#00FFFF';
      } else {
        ctx.globalAlpha = opacity;
      }
      
      // Glow effect
      ctx.shadowBlur = isHead ? 20 : 10;
      ctx.shadowColor = snakeColor;
      
      // Draw segment
      const segmentSize = isHead ? cellSize - 2 : cellSize - 4;
      const offset = isHead ? 1 : 2;
      
      if (isHead) {
        // Draw head with eyes
        ctx.fillStyle = snakeColor;
        ctx.fillRect(
          segment.x * cellSize + offset,
          segment.y * cellSize + offset,
          segmentSize,
          segmentSize
        );
        
        // Draw eyes
        ctx.fillStyle = '#000000';
        const eyeSize = cellSize / 8;
        const eyeOffset = cellSize / 4;
        ctx.fillRect(
          segment.x * cellSize + eyeOffset,
          segment.y * cellSize + eyeOffset,
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          segment.x * cellSize + cellSize - eyeOffset - eyeSize,
          segment.y * cellSize + eyeOffset,
          eyeSize,
          eyeSize
        );
      } else {
        // Draw body segment
        ctx.fillStyle = snakeColor;
        ctx.fillRect(
          segment.x * cellSize + offset,
          segment.y * cellSize + offset,
          segmentSize,
          segmentSize
        );
      }
      
      ctx.restore();
    });

    // Render particles
    particleSystem.render(ctx);

    // Draw UI overlay effects
    if (gameState === 'game_over') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    frameRef.current++;
    requestAnimationFrame(render);
  }, [snake, food, obstacles, powerUps, activePowerUp, gameState, gridSize, cellSize, particleSystem]);

  // Start render loop
  useEffect(() => {
    const animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [render]);

  // Helper functions
  function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerRadius: number, innerRadius: number, points: number) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawPolygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, sides: number) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={backgroundCanvasRef}
        width={gridSize * cellSize}
        height={gridSize * cellSize}
        className="absolute inset-0 opacity-30"
      />
      <canvas
        ref={canvasRef}
        width={gridSize * cellSize}
        height={gridSize * cellSize}
        className="relative z-10"
      />
    </div>
  );
}