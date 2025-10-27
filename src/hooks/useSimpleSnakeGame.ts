import { useState, useCallback, useRef, useEffect } from 'react';

export type Position = { x: number; y: number };
export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';
export type PowerUpType = 'speed' | 'double' | 'shield' | 'ghost';

export interface PowerUp {
  type: PowerUpType;
  position: Position;
  expiresAt: number;
}

export interface ActivePowerUps {
  speed?: number;      // expires timestamp
  double?: number;     // remaining food count
  shield?: boolean;    // one-time use
  ghost?: number;      // expires timestamp
}

export interface SnakeGameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction | null;
  score: number;
  highScore: number;
  gameState: GameState;
  speed: number; // milliseconds between moves
  foodEaten: number;  // track for head/tail unlock
  powerUp?: PowerUp;
  activePowerUps: ActivePowerUps;
}

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5; // Speed up by 5ms every 50 points
const MIN_SPEED = 50; // Fastest speed

export function useSimpleSnakeGame() {
  // Load high score from localStorage
  const loadHighScore = () => {
    try {
      return parseInt(localStorage.getItem('simpleSnakeHighScore') || '0', 10);
    } catch {
      return 0;
    }
  };

  // Initial state
  const [gameState, setGameState] = useState<SnakeGameState>({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 10 },
    direction: 'right',
    nextDirection: null,
    score: 0,
    highScore: loadHighScore(),
    gameState: 'menu',
    speed: INITIAL_SPEED,
    foodEaten: 0,
    powerUp: undefined,
    activePowerUps: {}
  });

  // Refs for game loop
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastMoveTime = useRef<number>(0);

  // Generate random food position
  const generateFood = useCallback((snake: Position[], powerUpPos?: Position): Position => {
    const available: Position[] = [];

    // Find all available positions
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const isSnake = snake.some(s => s.x === x && s.y === y);
        const isPowerUp = powerUpPos && powerUpPos.x === x && powerUpPos.y === y;
        if (!isSnake && !isPowerUp) {
          available.push({ x, y });
        }
      }
    }

    // Return random available position
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }

    // Fallback (should never happen in normal gameplay)
    return { x: 0, y: 0 };
  }, []);

  // Generate random power-up
  const generatePowerUp = useCallback((snake: Position[], food: Position): PowerUp | undefined => {
    // 15% chance to spawn a power-up
    if (Math.random() > 0.15) return undefined;

    const types: PowerUpType[] = ['speed', 'double', 'shield', 'ghost'];
    const type = types[Math.floor(Math.random() * types.length)];

    const available: Position[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const isSnake = snake.some(s => s.x === x && s.y === y);
        const isFood = food.x === x && food.y === y;
        if (!isSnake && !isFood) {
          available.push({ x, y });
        }
      }
    }

    if (available.length > 0) {
      const position = available[Math.floor(Math.random() * available.length)];
      return {
        type,
        position,
        expiresAt: Date.now() + 8000 // Expires in 8 seconds
      };
    }

    return undefined;
  }, []);

  // Get next position based on direction
  const getNextPosition = (head: Position, direction: Direction): Position => {
    switch (direction) {
      case 'up':
        return { x: head.x, y: head.y - 1 };
      case 'down':
        return { x: head.x, y: head.y + 1 };
      case 'left':
        return { x: head.x - 1, y: head.y };
      case 'right':
        return { x: head.x + 1, y: head.y };
    }
  };

  // Check if position is out of bounds
  const isOutOfBounds = (pos: Position | undefined): boolean => {
    if (!pos) return true;
    return pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE;
  };

  // Check if position collides with snake
  const isSnakeCollision = (pos: Position, snake: Position[]): boolean => {
    return snake.some(s => s.x === pos.x && s.y === pos.y);
  };

  // Move snake
  const moveSnake = useCallback(() => {
    setGameState(prev => {
      if (prev.gameState !== 'playing') return prev;

      // Check if snake exists and has segments
      if (!prev.snake || prev.snake.length === 0) {
        console.error('Snake array is empty');
        return prev;
      }

      // Clean up expired power-ups
      const now = Date.now();
      let activePowerUps = { ...prev.activePowerUps };
      let powerUp = prev.powerUp;

      // Remove expired active power-ups
      if (activePowerUps.speed && activePowerUps.speed < now) {
        delete activePowerUps.speed;
      }
      if (activePowerUps.ghost && activePowerUps.ghost < now) {
        delete activePowerUps.ghost;
      }

      // Remove expired power-up on field
      if (powerUp && powerUp.expiresAt < now) {
        powerUp = undefined;
      }

      // Use next direction if available, otherwise current direction
      const currentDirection = prev.nextDirection || prev.direction;
      const head = prev.snake[0];
      let nextPos = getNextPosition(head, currentDirection);

      // Handle ghost mode (wraparound walls)
      if (activePowerUps.ghost && activePowerUps.ghost > now) {
        if (nextPos.x < 0) nextPos.x = GRID_SIZE - 1;
        if (nextPos.x >= GRID_SIZE) nextPos.x = 0;
        if (nextPos.y < 0) nextPos.y = GRID_SIZE - 1;
        if (nextPos.y >= GRID_SIZE) nextPos.y = 0;
      }

      // Check collisions
      const selfCollision = prev.snake.length > 1 &&
        prev.snake.slice(0, -1).some(s => s.x === nextPos.x && s.y === nextPos.y);

      const wallCollision = !activePowerUps.ghost && isOutOfBounds(nextPos);

      if (wallCollision || selfCollision) {
        // Check if shield is active
        if (activePowerUps.shield && wallCollision) {
          // Use shield and continue
          delete activePowerUps.shield;
          // Bounce back to safe position
          nextPos = head;
        } else {
          // Game over
          const newHighScore = Math.max(prev.score, prev.highScore);
          if (newHighScore > prev.highScore) {
            localStorage.setItem('simpleSnakeHighScore', newHighScore.toString());
          }
          return {
            ...prev,
            gameState: 'gameOver',
            highScore: newHighScore,
            activePowerUps: {}
          };
        }
      }

      // Move snake
      let newSnake = [nextPos, ...prev.snake];
      let newFood = prev.food;
      let newScore = prev.score;
      let newSpeed = prev.speed;
      let newFoodEaten = prev.foodEaten;
      let newPowerUp = powerUp;

      // Check if power-up collected
      if (powerUp && nextPos.x === powerUp.position.x && nextPos.y === powerUp.position.y) {
        switch (powerUp.type) {
          case 'speed':
            activePowerUps.speed = now + 5000; // 5 seconds
            newSpeed = Math.min(INITIAL_SPEED + 30, prev.speed + 30); // Slow down temporarily
            break;
          case 'double':
            activePowerUps.double = 3; // Next 3 foods worth double
            break;
          case 'shield':
            activePowerUps.shield = true;
            break;
          case 'ghost':
            activePowerUps.ghost = now + 7000; // 7 seconds
            break;
        }
        newPowerUp = undefined; // Remove collected power-up
      }

      // Check if food eaten
      if (nextPos.x === prev.food.x && nextPos.y === prev.food.y) {
        // Don't remove tail (snake grows)
        newFoodEaten++;

        // Calculate points (with double power-up check)
        let points = 10;
        if (activePowerUps.double && activePowerUps.double > 0) {
          points = 20;
          activePowerUps.double--;
          if (activePowerUps.double === 0) {
            delete activePowerUps.double;
          }
        }
        newScore += points;

        newFood = generateFood(newSnake, newPowerUp?.position);

        // Maybe spawn a new power-up
        if (!newPowerUp) {
          newPowerUp = generatePowerUp(newSnake, newFood);
        }

        // Speed up every 50 points (unless speed power-up is active)
        if (!activePowerUps.speed && newScore % 50 === 0) {
          newSpeed = Math.max(MIN_SPEED, prev.speed - SPEED_INCREMENT);
        }
      } else {
        // Remove tail (snake moves)
        newSnake.pop();
      }

      // Restore normal speed if speed power-up expired
      if (!activePowerUps.speed && prev.activePowerUps.speed) {
        newSpeed = INITIAL_SPEED - Math.floor(newScore / 50) * SPEED_INCREMENT;
        newSpeed = Math.max(MIN_SPEED, newSpeed);
      }

      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        direction: currentDirection,
        nextDirection: null,
        score: newScore,
        speed: newSpeed,
        foodEaten: newFoodEaten,
        powerUp: newPowerUp,
        activePowerUps
      };
    });
  }, [generateFood, generatePowerUp]);

  // Start game
  const startGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    const initialFood = generateFood(initialSnake);

    setGameState(prev => ({
      snake: initialSnake,
      food: initialFood,
      direction: 'right',
      nextDirection: null,
      score: 0,
      highScore: prev.highScore,
      gameState: 'playing',
      speed: INITIAL_SPEED,
      foodEaten: 0,
      powerUp: undefined,
      activePowerUps: {}
    }));
  }, [generateFood]);

  // Pause/Resume game
  const togglePause = useCallback(() => {
    setGameState(prev => {
      if (prev.gameState === 'playing') {
        return { ...prev, gameState: 'paused' };
      } else if (prev.gameState === 'paused') {
        return { ...prev, gameState: 'playing' };
      }
      return prev;
    });
  }, []);

  // Change direction
  const changeDirection = useCallback((newDirection: Direction) => {
    setGameState(prev => {
      if (prev.gameState !== 'playing') return prev;

      const currentDir = prev.nextDirection || prev.direction;

      // Prevent 180-degree turns
      if (
        (currentDir === 'up' && newDirection === 'down') ||
        (currentDir === 'down' && newDirection === 'up') ||
        (currentDir === 'left' && newDirection === 'right') ||
        (currentDir === 'right' && newDirection === 'left')
      ) {
        return prev;
      }

      // Queue the direction change
      return { ...prev, nextDirection: newDirection };
    });
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameState: 'menu'
    }));
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState.gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        moveSnake();
      }, gameState.speed);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.gameState, gameState.speed, moveSnake]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }

      // Direction controls
      if (e.key === 'ArrowUp' || e.key === 'w') changeDirection('up');
      else if (e.key === 'ArrowDown' || e.key === 's') changeDirection('down');
      else if (e.key === 'ArrowLeft' || e.key === 'a') changeDirection('left');
      else if (e.key === 'ArrowRight' || e.key === 'd') changeDirection('right');

      // Game controls
      else if (e.key === ' ') {
        if (gameState.gameState === 'playing' || gameState.gameState === 'paused') {
          togglePause();
        }
      } else if (e.key === 'Enter') {
        if (gameState.gameState === 'menu' || gameState.gameState === 'gameOver') {
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.gameState, changeDirection, togglePause, startGame]);

  return {
    gameState,
    startGame,
    togglePause,
    resetGame,
    changeDirection,
    gridSize: GRID_SIZE
  };
}