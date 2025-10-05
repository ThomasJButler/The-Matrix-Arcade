import { useState, useCallback, useRef, useEffect } from 'react';

export type Position = { x: number; y: number };
export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';

export interface SnakeGameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction | null;
  score: number;
  highScore: number;
  gameState: GameState;
  speed: number; // milliseconds between moves
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
    speed: INITIAL_SPEED
  });

  // Refs for game loop
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastMoveTime = useRef<number>(0);

  // Generate random food position
  const generateFood = useCallback((snake: Position[]): Position => {
    const available: Position[] = [];

    // Find all available positions
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const isSnake = snake.some(s => s.x === x && s.y === y);
        if (!isSnake) {
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
  const isOutOfBounds = (pos: Position): boolean => {
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

      // Use next direction if available, otherwise current direction
      const currentDirection = prev.nextDirection || prev.direction;
      const head = prev.snake[0];
      const nextPos = getNextPosition(head, currentDirection);

      // Check collisions
      // Only check self-collision if snake has more than 1 segment (exclude the tail that will be removed)
      const selfCollision = prev.snake.length > 1 &&
        prev.snake.slice(0, -1).some(s => s.x === nextPos.x && s.y === nextPos.y);

      if (isOutOfBounds(nextPos) || selfCollision) {
        // Game over
        const newHighScore = Math.max(prev.score, prev.highScore);
        if (newHighScore > prev.highScore) {
          localStorage.setItem('simpleSnakeHighScore', newHighScore.toString());
        }
        return {
          ...prev,
          gameState: 'gameOver',
          highScore: newHighScore
        };
      }

      // Move snake
      let newSnake = [nextPos, ...prev.snake];
      let newFood = prev.food;
      let newScore = prev.score;
      let newSpeed = prev.speed;

      // Check if food eaten
      if (nextPos.x === prev.food.x && nextPos.y === prev.food.y) {
        // Don't remove tail (snake grows)
        newScore += 10;
        newFood = generateFood(newSnake);

        // Speed up every 50 points
        if (newScore % 50 === 0) {
          newSpeed = Math.max(MIN_SPEED, prev.speed - SPEED_INCREMENT);
        }
      } else {
        // Remove tail (snake moves)
        newSnake.pop();
      }

      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        direction: currentDirection,
        nextDirection: null,
        score: newScore,
        speed: newSpeed
      };
    });
  }, [generateFood]);

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
      speed: INITIAL_SPEED
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