import { useState, useCallback, useRef, useEffect } from 'react';

export type Position = {
  x: number;
  y: number;
};

export type Direction = {
  x: number;
  y: number;
};

export type PowerUpType = 
  | 'speed' 
  | 'ghost' 
  | 'multiplier' 
  | 'slow' 
  | 'matrix_vision'
  | 'bullet_time'
  | 'digital_clone'
  | 'hack_mode'
  | 'data_stream'
  | null;

export type PowerUp = {
  position: Position;
  type: PowerUpType;
  id: string;
};

export type FoodType = {
  position: Position;
  points: number;
  color: string;
  type: 'normal' | 'bonus' | 'mega' | 'special';
  id: string;
};

export type GameMode = 'classic' | 'survival' | 'time_attack' | 'boss_battle';

export type GameState = 'menu' | 'playing' | 'paused' | 'game_over' | 'victory';

export interface SnakeGameState {
  snake: Position[];
  food: FoodType[];
  direction: Direction;
  score: number;
  highScore: number;
  level: number;
  lives: number;
  combo: number;
  gameState: GameState;
  gameMode: GameMode;
  powerUps: PowerUp[];
  activePowerUp: PowerUpType;
  powerUpTimer: number;
  obstacles: Position[];
  bossHealth?: number;
  achievements: string[];
  stats: {
    foodEaten: number;
    powerUpsCollected: number;
    obstaclesDestroyed: number;
    timePlayed: number;
  };
}

const GRID_SIZE = 30;
const INITIAL_SNAKE = [{ x: 15, y: 15 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const BASE_SPEED = 120;
const POWER_UP_DURATION = 5000;
const MAX_COMBO = 10;
const LIVES_PER_GAME = 3;

export function useSnakeGame() {
  const [gameState, setGameState] = useState<SnakeGameState>({
    snake: INITIAL_SNAKE,
    food: [],
    direction: INITIAL_DIRECTION,
    score: 0,
    highScore: parseInt(localStorage.getItem('snakeHighScore') || '0'),
    level: 1,
    lives: LIVES_PER_GAME,
    combo: 1,
    gameState: 'menu',
    gameMode: 'classic',
    powerUps: [],
    activePowerUp: null,
    powerUpTimer: 0,
    obstacles: [],
    achievements: JSON.parse(localStorage.getItem('snakeAchievements') || '[]'),
    stats: {
      foodEaten: 0,
      powerUpsCollected: 0,
      obstaclesDestroyed: 0,
      timePlayed: 0
    }
  });

  const directionRef = useRef(INITIAL_DIRECTION);
  const nextDirectionRef = useRef(INITIAL_DIRECTION);

  // Generate random position
  const getRandomPosition = useCallback((): Position => {
    let position: Position;
    do {
      position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (
      gameState.snake.some(s => s.x === position.x && s.y === position.y) ||
      gameState.obstacles.some(o => o.x === position.x && o.y === position.y)
    );
    return position;
  }, [gameState.snake, gameState.obstacles]);

  // Spawn food
  const spawnFood = useCallback(() => {
    const types: Array<{ type: FoodType['type']; weight: number; points: number; color: string }> = [
      { type: 'normal', weight: 0.7, points: 10, color: '#00FF00' },
      { type: 'bonus', weight: 0.2, points: 30, color: '#FFD700' },
      { type: 'mega', weight: 0.08, points: 50, color: '#FF00FF' },
      { type: 'special', weight: 0.02, points: 100, color: '#00FFFF' }
    ];

    const random = Math.random();
    let accumulator = 0;
    let selectedType = types[0];

    for (const foodType of types) {
      accumulator += foodType.weight;
      if (random <= accumulator) {
        selectedType = foodType;
        break;
      }
    }

    const newFood: FoodType = {
      position: getRandomPosition(),
      points: selectedType.points * gameState.level,
      color: selectedType.color,
      type: selectedType.type,
      id: `food-${Date.now()}-${Math.random()}`
    };

    setGameState(prev => ({
      ...prev,
      food: [...prev.food, newFood]
    }));
  }, [getRandomPosition, gameState.level]);

  // Spawn power-up
  const spawnPowerUp = useCallback(() => {
    const powerUpTypes: PowerUpType[] = [
      'speed', 'ghost', 'multiplier', 'slow',
      'matrix_vision', 'bullet_time', 'digital_clone',
      'hack_mode', 'data_stream'
    ];

    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    const newPowerUp: PowerUp = {
      position: getRandomPosition(),
      type,
      id: `powerup-${Date.now()}-${Math.random()}`
    };

    setGameState(prev => ({
      ...prev,
      powerUps: [...prev.powerUps, newPowerUp]
    }));
  }, [getRandomPosition]);

  // Generate obstacles for level
  const generateObstacles = useCallback((level: number) => {
    const obstacleCount = Math.min(level * 2, 20);
    const obstacles: Position[] = [];

    for (let i = 0; i < obstacleCount; i++) {
      obstacles.push(getRandomPosition());
    }

    setGameState(prev => ({
      ...prev,
      obstacles
    }));
  }, [getRandomPosition]);

  // Handle direction change
  const changeDirection = useCallback((newDirection: Direction) => {
    const currentDir = directionRef.current;
    
    // Prevent 180-degree turns
    if (
      (currentDir.x === -newDirection.x && currentDir.y === newDirection.y) ||
      (currentDir.y === -newDirection.y && currentDir.x === newDirection.x)
    ) {
      return;
    }

    nextDirectionRef.current = newDirection;
  }, []);

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameState.gameState !== 'playing') return;

    // Update direction from next direction
    directionRef.current = nextDirectionRef.current;

    setGameState(prev => {
      const head = prev.snake[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y
      };

      // Handle wraparound or wall collision based on game mode
      if (prev.gameMode === 'classic') {
        // Wraparound
        newHead.x = (newHead.x + GRID_SIZE) % GRID_SIZE;
        newHead.y = (newHead.y + GRID_SIZE) % GRID_SIZE;
      } else {
        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || 
            newHead.y < 0 || newHead.y >= GRID_SIZE) {
          return handleDeath(prev);
        }
      }

      // Check self collision (unless ghost mode)
      if (prev.activePowerUp !== 'ghost' && prev.activePowerUp !== 'hack_mode') {
        if (prev.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          return handleDeath(prev);
        }
      }

      // Check obstacle collision (unless hack mode)
      if (prev.activePowerUp !== 'hack_mode') {
        if (prev.obstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y)) {
          return handleDeath(prev);
        }
      }

      const newSnake = [newHead, ...prev.snake];
      let newState = { ...prev, snake: newSnake };

      // Check food collision
      const foodIndex = prev.food.findIndex(
        f => f.position.x === newHead.x && f.position.y === newHead.y
      );

      if (foodIndex !== -1) {
        const eatenFood = prev.food[foodIndex];
        const scoreMultiplier = prev.activePowerUp === 'multiplier' ? 3 : 1;
        const comboMultiplier = Math.min(prev.combo, MAX_COMBO);
        const totalScore = eatenFood.points * scoreMultiplier * comboMultiplier;

        newState = {
          ...newState,
          score: prev.score + totalScore,
          food: prev.food.filter((_, i) => i !== foodIndex),
          combo: Math.min(prev.combo + 0.1, MAX_COMBO),
          stats: {
            ...prev.stats,
            foodEaten: prev.stats.foodEaten + 1
          }
        };

        // Check for high score
        if (newState.score > newState.highScore) {
          newState.highScore = newState.score;
          localStorage.setItem('snakeHighScore', newState.score.toString());
        }

        // Check for level up
        if (newState.score >= newState.level * 500) {
          newState.level += 1;
          generateObstacles(newState.level);
        }

        // Immediately spawn new food if we're running low
        if (newState.food.length === 0) {
          // Generate at least one food immediately
          setTimeout(() => spawnFood(), 0);
        }
      } else {
        // Remove tail if no food eaten
        newState.snake.pop();
      }

      // Check power-up collision
      const powerUpIndex = prev.powerUps.findIndex(
        p => p.position.x === newHead.x && p.position.y === newHead.y
      );

      if (powerUpIndex !== -1) {
        const collectedPowerUp = prev.powerUps[powerUpIndex];
        newState = {
          ...newState,
          powerUps: prev.powerUps.filter((_, i) => i !== powerUpIndex),
          activePowerUp: collectedPowerUp.type,
          powerUpTimer: POWER_UP_DURATION,
          stats: {
            ...prev.stats,
            powerUpsCollected: prev.stats.powerUpsCollected + 1
          }
        };
      }

      return newState;
    });
  }, [gameState.gameState, generateObstacles, spawnFood]);

  // Handle death
  const handleDeath = (state: SnakeGameState): SnakeGameState => {
    const newLives = state.lives - 1;
    
    if (newLives <= 0) {
      return {
        ...state,
        lives: 0,
        gameState: 'game_over'
      };
    }

    return {
      ...state,
      lives: newLives,
      snake: INITIAL_SNAKE,
      direction: INITIAL_DIRECTION,
      combo: 1,
      activePowerUp: null,
      powerUpTimer: 0
    };
  };

  // Start new game
  const startGame = useCallback((mode: GameMode = 'classic') => {
    setGameState(prev => ({
      ...prev,
      snake: INITIAL_SNAKE,
      food: [],
      direction: INITIAL_DIRECTION,
      score: 0,
      level: 1,
      lives: LIVES_PER_GAME,
      combo: 1,
      gameState: 'playing',
      gameMode: mode,
      powerUps: [],
      activePowerUp: null,
      powerUpTimer: 0,
      obstacles: [],
      stats: {
        foodEaten: 0,
        powerUpsCollected: 0,
        obstaclesDestroyed: 0,
        timePlayed: 0
      }
    }));

    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;

    // Spawn initial food
    setTimeout(() => spawnFood(), 100);
  }, [spawnFood]);

  // Pause/Resume game
  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameState: prev.gameState === 'playing' ? 'paused' : 'playing'
    }));
  }, []);

  // Update power-up timer
  useEffect(() => {
    if (gameState.powerUpTimer > 0 && gameState.gameState === 'playing') {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          powerUpTimer: Math.max(0, prev.powerUpTimer - 100),
          activePowerUp: prev.powerUpTimer <= 100 ? null : prev.activePowerUp
        }));
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [gameState.powerUpTimer, gameState.gameState]);

  // Spawn food periodically
  useEffect(() => {
    if (gameState.gameState === 'playing') {
      if (gameState.food.length === 0) {
        // Immediately spawn food if none exists
        spawnFood();
      } else if (gameState.food.length < 3) {
        // Spawn more food after a delay
        const timer = setTimeout(() => spawnFood(), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.gameState, gameState.food.length, spawnFood]);

  // Spawn power-ups periodically
  useEffect(() => {
    if (gameState.gameState === 'playing' && gameState.powerUps.length === 0) {
      const timer = setTimeout(() => spawnPowerUp(), 10000);
      return () => clearTimeout(timer);
    }
  }, [gameState.gameState, gameState.powerUps.length, spawnPowerUp]);

  return {
    gameState,
    moveSnake,
    changeDirection,
    startGame,
    togglePause,
    getSpeed: () => {
      const levelSpeed = BASE_SPEED - (gameState.level - 1) * 10;
      if (gameState.activePowerUp === 'speed') return levelSpeed * 0.5;
      if (gameState.activePowerUp === 'slow') return levelSpeed * 2;
      if (gameState.activePowerUp === 'bullet_time') return levelSpeed * 4;
      return levelSpeed;
    }
  };
}