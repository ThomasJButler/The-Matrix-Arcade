import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInterval } from '../../hooks/useInterval';
import { Zap, Shield, Star, Clock, Pause, Play, Volume2, VolumeX } from 'lucide-react';

type Position = {
  x: number;
  y: number;
};

type PowerUpType = 'speed' | 'ghost' | 'multiplier' | 'slow' | null;

type PowerUp = {
  position: Position;
  type: PowerUpType;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

type FoodType = {
  position: Position;
  points: number;
  color: string;
  type: 'normal' | 'bonus' | 'mega';
};

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const BASE_SPEED = 120;
const POWER_UP_DURATION = 5000; // 5 seconds

export default function SnakeClassic() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<FoodType | null>(null);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      const saved = localStorage.getItem('snakeHighScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [level, setLevel] = useState(1);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType>(null);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const directionRef = useRef(INITIAL_DIRECTION);

  // Initialize audio context
  useEffect(() => {
    try {
      audioContext.current = new AudioContext();
    } catch {
      console.warn('Audio context not available');
    }
    return () => {
      audioContext.current?.close();
    };
  }, []);

  // Play sound effect
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'square') => {
    if (!soundEnabled || !audioContext.current) return;
    
    try {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);
      
      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + duration);
    } catch {
      console.warn('Sound playback failed');
    }
  }, [soundEnabled]);

  // Generate random position avoiding snake and obstacles
  const generateRandomPosition = useCallback((currentSnake: Position[], currentObstacles: Position[]): Position => {
    const maxAttempts = 100;
    let attempts = 0;
    let position;
    
    do {
      position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
      
      if (attempts >= maxAttempts) {
        // Fallback: find first empty position
        for (let x = 0; x < GRID_SIZE; x++) {
          for (let y = 0; y < GRID_SIZE; y++) {
            const testPos = { x, y };
            if (!currentSnake.some(s => s.x === x && s.y === y) &&
                !currentObstacles.some(o => o.x === x && o.y === y)) {
              return testPos;
            }
          }
        }
        return { x: 0, y: 0 }; // Last resort
      }
    } while (
      currentSnake.some(segment => segment.x === position.x && segment.y === position.y) ||
      currentObstacles.some(obs => obs.x === position.x && obs.y === position.y)
    );
    
    return position;
  }, []);

  // Generate food with different types
  const generateFood = useCallback((currentSnake: Position[], currentObstacles: Position[], currentLevel: number): FoodType => {
    const position = generateRandomPosition(currentSnake, currentObstacles);
    const rand = Math.random();
    
    if (rand < 0.1 && currentLevel > 2) { // 10% chance for mega food after level 2
      return { position, points: 5, color: '#FFD700', type: 'mega' };
    } else if (rand < 0.3) { // 30% chance for bonus food
      return { position, points: 2, color: '#00FFFF', type: 'bonus' };
    } else {
      return { position, points: 1, color: '#00FF00', type: 'normal' };
    }
  }, [generateRandomPosition]);

  // Generate power-up
  const generatePowerUp = useCallback((currentSnake: Position[], currentObstacles: Position[], currentLevel: number): PowerUp | null => {
    if (Math.random() < 0.2 && currentLevel > 1) { // 20% chance after level 1
      const types: PowerUpType[] = ['speed', 'ghost', 'multiplier', 'slow'];
      return {
        position: generateRandomPosition(currentSnake, currentObstacles),
        type: types[Math.floor(Math.random() * types.length)]
      };
    }
    return null;
  }, [generateRandomPosition]);

  // Generate obstacles based on level
  const generateObstacles = useCallback((currentSnake: Position[], currentLevel: number): Position[] => {
    if (currentLevel < 3) return [];
    
    const obstacleCount = Math.min(currentLevel - 2, 8);
    const newObstacles: Position[] = [];
    
    for (let i = 0; i < obstacleCount; i++) {
      newObstacles.push(generateRandomPosition(currentSnake, newObstacles));
    }
    
    return newObstacles;
  }, [generateRandomPosition]);

  // Create particle explosion
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 2 + Math.random() * 3;
      newParticles.push({
        x: x * CELL_SIZE + CELL_SIZE / 2,
        y: y * CELL_SIZE + CELL_SIZE / 2,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Initialize game
  useEffect(() => {
    if (!food) {
      setFood(generateFood(snake, obstacles, level));
    }
  }, [food, snake, obstacles, level, generateFood]);

  // Update direction ref when direction changes
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Reset game
  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
    setLevel(1);
    setSpeed(BASE_SPEED);
    setPowerUp(null);
    setActivePowerUp(null);
    setPowerUpTimer(0);
    setScoreMultiplier(1);
    setParticles([]);
    setObstacles([]);
    setFood(generateFood(initialSnake, [], 1));
    playSound(440, 0.1);
  }, [generateFood, playSound]);

  // Activate power-up
  const activatePowerUp = useCallback((type: PowerUpType) => {
    if (!type) return;
    
    setActivePowerUp(type);
    setPowerUpTimer(POWER_UP_DURATION);
    playSound(1000, 0.2, 'sine');

    switch (type) {
      case 'speed':
        setSpeed(s => s / 2); // Double speed
        break;
      case 'multiplier':
        setScoreMultiplier(3);
        break;
      case 'slow':
        setSpeed(s => s * 1.5); // Slow down
        break;
    }
  }, [playSound]);

  // Move snake
  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake((currentSnake) => {
      const currentDirection = directionRef.current;
      const newHead = {
        x: (currentSnake[0].x + currentDirection.x + GRID_SIZE) % GRID_SIZE,
        y: (currentSnake[0].y + currentDirection.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check collision with self (unless ghost power-up is active)
      if (activePowerUp !== 'ghost' && 
          currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        playSound(100, 0.5, 'sawtooth');
        
        // Update high score
        if (score > highScore) {
          setHighScore(score);
          try {
            localStorage.setItem('snakeHighScore', score.toString());
          } catch {
            console.warn('Failed to save high score');
          }
        }
        return currentSnake;
      }

      // Check collision with obstacles
      if (obstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y)) {
        if (activePowerUp !== 'ghost') {
          setIsGameOver(true);
          playSound(100, 0.5, 'sawtooth');
          
          if (score > highScore) {
            setHighScore(score);
            try {
              localStorage.setItem('snakeHighScore', score.toString());
            } catch {
              console.warn('Failed to save high score');
            }
          }
          return currentSnake;
        }
      }

      const newSnake = [newHead, ...currentSnake];

      // Check if food is eaten
      if (food && newHead.x === food.position.x && newHead.y === food.position.y) {
        const points = food.points * scoreMultiplier;
        const newScore = score + points;
        setScore(newScore);
        createParticles(food.position.x, food.position.y, food.color, food.type === 'mega' ? 20 : 10);
        playSound(800 + points * 100, 0.1);
        
        // Level up every 10 points
        const newLevel = Math.floor(newScore / 10) + 1;
        if (newLevel > level) {
          setLevel(newLevel);
          setSpeed(s => Math.max(s - 10, 40)); // Increase speed
          setObstacles(generateObstacles(newSnake, newLevel));
          playSound(1200, 0.3, 'sine');
        }
        
        setFood(generateFood(newSnake, obstacles, level));
        
        // Chance to spawn power-up
        if (!powerUp && Math.random() < 0.3) {
          setPowerUp(generatePowerUp(newSnake, obstacles, level));
        }
      } else {
        newSnake.pop();
      }

      // Check if power-up is collected
      if (powerUp && newHead.x === powerUp.position.x && newHead.y === powerUp.position.y) {
        activatePowerUp(powerUp.type);
        createParticles(powerUp.position.x, powerUp.position.y, '#FFD700', 15);
        setPowerUp(null);
      }

      return newSnake;
    });
  }, [food, isGameOver, isPaused, activePowerUp, obstacles, score, highScore, 
      level, scoreMultiplier, powerUp, createParticles, generateFood, generatePowerUp, 
      generateObstacles, playSound, activatePowerUp]);

  // Handle power-up timer
  useEffect(() => {
    if (powerUpTimer > 0 && !isPaused) {
      const timer = setTimeout(() => {
        setPowerUpTimer(t => t - 100);
      }, 100);
      return () => clearTimeout(timer);
    } else if (powerUpTimer === 0 && activePowerUp) {
      // Deactivate power-up
      setActivePowerUp(null);
      if (activePowerUp === 'speed' || activePowerUp === 'slow') {
        setSpeed(BASE_SPEED - (level - 1) * 10);
      }
      if (activePowerUp === 'multiplier') {
        setScoreMultiplier(1);
      }
    }
  }, [powerUpTimer, activePowerUp, isPaused, level]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isGameOver) {
        if (e.key === 'Enter') resetGame();
        return;
      }

      if (e.key === ' ') {
        setIsPaused(p => !p);
        playSound(600, 0.1);
        return;
      }

      const keyDirections: { [key: string]: Position } = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };

      if (keyDirections[e.key]) {
        e.preventDefault();
        const newDirection = keyDirections[e.key];
        const currentDirection = directionRef.current;
        
        // Prevent 180-degree turns
        if (newDirection.x !== -currentDirection.x || newDirection.y !== -currentDirection.y) {
          setDirection(newDirection);
          directionRef.current = newDirection;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isGameOver, playSound, resetGame]);

  // Update particles
  useEffect(() => {
    const updateParticles = () => {
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3,
          life: p.life - 0.02
        }))
        .filter(p => p.life > 0)
      );
    };

    const interval = setInterval(updateParticles, 16);
    return () => clearInterval(interval);
  }, []);

  // Game loop
  useInterval(moveSnake, isPaused || isGameOver ? null : speed);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#00FF0020';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw obstacles
    ctx.shadowBlur = 10;
    obstacles.forEach(obs => {
      ctx.fillStyle = '#FF0000';
      ctx.shadowColor = '#FF0000';
      ctx.fillRect(obs.x * CELL_SIZE, obs.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // Draw snake with gradient
    snake.forEach((segment, index) => {
      const opacity = 1 - (index / snake.length) * 0.5;
      ctx.fillStyle = activePowerUp === 'ghost' 
        ? `rgba(255, 255, 255, ${opacity * 0.5})` 
        : `rgba(0, 255, 0, ${opacity})`;
      
      ctx.shadowBlur = activePowerUp ? 20 : 10;
      ctx.shadowColor = activePowerUp === 'ghost' ? '#FFFFFF' : '#00FF00';
      
      const padding = index === 0 ? 0 : 2;
      ctx.fillRect(
        segment.x * CELL_SIZE + padding,
        segment.y * CELL_SIZE + padding,
        CELL_SIZE - padding * 2,
        CELL_SIZE - padding * 2
      );
    });

    // Draw food with glow
    if (food) {
      ctx.fillStyle = food.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = food.color;
      
      const pulse = Math.sin(Date.now() * 0.005) * 2;
      ctx.fillRect(
        food.position.x * CELL_SIZE + pulse,
        food.position.y * CELL_SIZE + pulse,
        CELL_SIZE - pulse * 2,
        CELL_SIZE - pulse * 2
      );
    }

    // Draw power-up
    if (powerUp) {
      ctx.save();
      ctx.translate(
        powerUp.position.x * CELL_SIZE + CELL_SIZE / 2,
        powerUp.position.y * CELL_SIZE + CELL_SIZE / 2
      );
      ctx.rotate(Date.now() * 0.002);
      
      ctx.fillStyle = '#FFD700';
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#FFD700';
      
      // Draw star shape for power-up
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const x = Math.cos(angle) * CELL_SIZE / 2;
        const y = Math.sin(angle) * CELL_SIZE / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        const innerAngle = angle + Math.PI / 5;
        const innerX = Math.cos(innerAngle) * CELL_SIZE / 4;
        const innerY = Math.sin(innerAngle) * CELL_SIZE / 4;
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw particles
    particles.forEach(particle => {
      const alpha = Math.floor(particle.life * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = particle.color + alpha;
      ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    });

    ctx.shadowBlur = 0;
  });

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black p-2 relative">
      {/* HUD - Positioned absolutely at the top */}
      <div className="absolute top-2 left-0 right-0 font-mono text-green-500 flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm z-10">
        <div>Score: {score}</div>
        <div>High: {highScore}</div>
        <div>Level: {level}</div>
        {activePowerUp && (
          <div className="flex items-center gap-1 text-yellow-400">
            {activePowerUp === 'speed' && <Zap className="w-3 h-3" />}
            {activePowerUp === 'ghost' && <Shield className="w-3 h-3" />}
            {activePowerUp === 'multiplier' && <Star className="w-3 h-3" />}
            {activePowerUp === 'slow' && <Clock className="w-3 h-3" />}
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-400 transition-all"
                style={{ width: `${(powerUpTimer / POWER_UP_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}
        <button
          onClick={() => setSoundEnabled(s => !s)}
          className="p-1 hover:text-green-300"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Game Canvas - Centered in available space */}
      <div className="relative flex items-center justify-center flex-1">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-2 border-green-500 max-w-full max-h-full"
          style={{ imageRendering: 'pixelated', width: 'auto', height: 'auto' }}
        />
        
        {/* Pause Overlay */}
        {isPaused && !isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="text-center">
              <Pause className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-green-500 font-mono text-xl">PAUSED</p>
              <p className="text-green-400 font-mono text-sm mt-2">Press SPACE to continue</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Positioned at bottom */}
      <div className="absolute bottom-2 left-0 right-0 text-center font-mono text-green-400 text-xs">
        <p>Use ARROW KEYS or WASD to move | SPACE to pause</p>
      </div>

      {/* Game Over */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="text-center font-mono">
            <h2 className="text-4xl text-green-500 mb-4">GAME OVER</h2>
            <p className="text-2xl text-green-400 mb-2">Score: {score}</p>
            {score === highScore && score > 0 && (
              <p className="text-xl text-yellow-400 mb-4">NEW HIGH SCORE!</p>
            )}
            <button
              onClick={resetGame}
              className="mt-4 px-6 py-3 bg-green-500 text-black rounded hover:bg-green-400 transform hover:scale-105 transition-all flex items-center gap-2 mx-auto"
            >
              <Play className="w-4 h-4" />
              Play Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
}