/**
 * @file AgentEscape.tsx
 * @description Matrix-themed Pacman game - collect red pills while evading Agents
 * @author Ralph (AI Agent)
 *
 * A classic Pacman clone where the player navigates a maze collecting dots (red pills)
 * while avoiding four AI-controlled Agents with unique behaviours.
 *
 * Technical Implementation:
 * - Canvas: 560x620 (28x31 grid, 20px cells)
 * - Grid-based movement with queued direction changes
 * - 4 Agents with unique AI:
 *   - Smith (white): Targets player directly
 *   - Brown (brown): Targets 4 tiles ahead of player
 *   - Jones (blue): Random when far, targets when close
 *   - Johnson (gray): Flanks from the side
 * - Ghost AI modes: chase, scatter, frightened, eaten
 *
 * Controls:
 * - WASD/Arrows: Move
 * - P: Pause | R: Restart | Enter: Start
 * - ESC: Exit (handled by App.tsx)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play } from 'lucide-react';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import { useSoundSystem } from '../../hooks/useSoundSystem';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useParticleSystem } from '../../hooks/useParticleSystem';

// Constants
const CELL_SIZE = 20;
const GRID_COLS = 28;
const GRID_ROWS = 31;
const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;
const PLAYER_SPEED = 0.15;
const BASE_GHOST_SPEED = 0.12;
const BASE_FRIGHTENED_SPEED = 0.08;
const DOT_POINTS = 10;
const POWER_PELLET_POINTS = 50;
const GHOST_POINTS = [200, 400, 800, 1600];
const BASE_FRIGHTENED_DURATION = 10000;
const SCATTER_DURATION = 7000;
const CHASE_DURATION = 20000;

// Level-based difficulty scaling (authentic Pacman progression)
// Returns multiplier for ghost speed and adjusted frightened duration
const getLevelDifficulty = (level: number): { speedMult: number; frightenedDuration: number } => {
  // Ghost speed increases ~8% per level, capping at level 7
  const speedMult = 1 + Math.min(level - 1, 6) * 0.08;
  // Frightened duration decreases by 1s per level, minimum 3s
  const frightenedDuration = Math.max(3000, BASE_FRIGHTENED_DURATION - (level - 1) * 1000);
  return { speedMult, frightenedDuration };
};

// Direction vectors
const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

type Direction = keyof typeof DIRECTIONS;
type GhostMode = 'chase' | 'scatter' | 'frightened' | 'eaten';
type GamePhase = 'menu' | 'playing' | 'paused' | 'gameOver' | 'levelComplete';

// Cell types in maze
const WALL = 1;
const DOT = 2;
const POWER_PELLET = 3;
const EMPTY = 0;
const GHOST_HOUSE = 4;
const _TUNNEL = 5;

// Classic Pacman-style maze (28x31)
const INITIAL_MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [5,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,5],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Interfaces
interface Position {
  x: number;
  y: number;
}

interface Ghost {
  id: string;
  name: string;
  colour: string;
  frightenedColour: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: Direction;
  mode: GhostMode;
  scatterTarget: Position;
  homeTarget: Position;
  releaseTime: number; // Timestamp when ghost exits the house
  inHouse: boolean;    // Whether ghost is still in the starting house
}

interface Player {
  x: number;
  y: number;
  direction: Direction;
  nextDirection: Direction | null;
  mouthOpen: boolean;
}

// Fruit types with their point values
type FruitType = 'cherry' | 'apple' | 'orange';
const FRUIT_POINTS: Record<FruitType, number> = {
  cherry: 100,
  apple: 200,
  orange: 300
};
const FRUIT_COLOURS: Record<FruitType, string> = {
  cherry: '#FF0066',
  apple: '#FF0000',
  orange: '#FF8800'
};

interface Fruit {
  x: number;
  y: number;
  type: FruitType;
  spawnTime: number;
}

interface AgentEscapeProps {
  achievementManager?: {
    unlockAchievement: (gameId: string, achievementId: string) => void;
  };
  isMuted?: boolean;
  autoStart?: boolean;
}

// Matrix rain character
const getMatrixChar = () => String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));

export default function AgentEscape({ achievementManager, isMuted = false, autoStart = false }: AgentEscapeProps) {
  // Game state - start in 'menu' unless autoStart is true
  const [gamePhase, setGamePhase] = useState<GamePhase>(autoStart ? 'playing' : 'menu');
  const autoStartRef = useRef(autoStart);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [dotsRemaining, setDotsRemaining] = useState(0);

  // Player state
  const playerRef = useRef<Player>({
    x: 14,
    y: 23,
    direction: 'left',
    nextDirection: null,
    mouthOpen: true
  });

  // Ghost state
  const ghostsRef = useRef<Ghost[]>([]);
  const ghostModeRef = useRef<GhostMode>('scatter');
  const ghostModeTimerRef = useRef(0);
  const frightenedTimerRef = useRef(0);
  const ghostsEatenRef = useRef(0);

  // Maze state
  const mazeRef = useRef<number[][]>([]);

  // Achievement tracking
  const levelDeathsRef = useRef(0);
  const totalGhostsEatenRef = useRef(0);
  const fruitsCollectedRef = useRef(0);

  // Fruit state
  const fruitRef = useRef<Fruit | null>(null);
  const lastFruitSpawnRef = useRef(0);
  const dotsEatenRef = useRef(0);

  // Animation
  const mouthAnimationRef = useRef(0);
  const matrixDropsRef = useRef<Array<{ x: number; y: number; char: string; speed: number }>>([]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();
  const { playSFX } = useSoundSystem();
  const { explode, collectFood, render: renderParticles } = useParticleSystem();

  // Sound wrapper
  const playSound = useCallback((sound: string) => {
    if (!isMuted) playSFX(sound);
  }, [isMuted, playSFX]);

  // Achievement unlock
  const unlockGameAchievement = useCallback((achievementId: string) => {
    achievementManager?.unlockAchievement('agentEscape', achievementId);
    unlockSaveAchievement('agentEscape', achievementId);
  }, [achievementManager, unlockSaveAchievement]);

  // Load high score
  useEffect(() => {
    if (saveData?.games?.agentEscape?.highScore) {
      setHighScore(saveData.games.agentEscape.highScore);
    }
  }, [saveData]);

  // Check if cell is walkable
  const isWalkable = useCallback((x: number, y: number): boolean => {
    // Handle tunnel wrapping
    if (y === 14 && (x < 0 || x >= GRID_COLS)) return true;
    if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
    const cell = mazeRef.current[y]?.[x];
    return cell !== WALL && cell !== undefined;
  }, []);

  // Get opposite direction
  const getOpposite = (dir: Direction): Direction => {
    switch (dir) {
      case 'up': return 'down';
      case 'down': return 'up';
      case 'left': return 'right';
      case 'right': return 'left';
    }
  };

  // Calculate distance between two points
  const distance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  // Initialise ghosts with staggered release times
  // Smith starts outside immediately, others release after delay (like classic Pacman)
  const initGhosts = useCallback(() => {
    const now = Date.now();
    ghostsRef.current = [
      {
        id: 'smith',
        name: 'Smith',
        colour: '#FFFFFF',
        frightenedColour: '#0000FF',
        x: 14,
        y: 11,          // Starts outside ghost house
        targetX: 14,
        targetY: 23,
        direction: 'left',
        mode: 'scatter',
        scatterTarget: { x: GRID_COLS - 3, y: -2 },
        homeTarget: { x: 14, y: 14 },
        releaseTime: now, // Immediately active
        inHouse: false
      },
      {
        id: 'brown',
        name: 'Brown',
        colour: '#8B4513',
        frightenedColour: '#0000FF',
        x: 12,
        y: 14,          // Inside ghost house
        targetX: 14,
        targetY: 23,
        direction: 'up',
        mode: 'scatter',
        scatterTarget: { x: 2, y: -2 },
        homeTarget: { x: 12, y: 14 },
        releaseTime: now + 3000, // Release after 3 seconds
        inHouse: true
      },
      {
        id: 'jones',
        name: 'Jones',
        colour: '#0088FF',
        frightenedColour: '#0000FF',
        x: 14,
        y: 14,          // Inside ghost house
        targetX: 14,
        targetY: 23,
        direction: 'up',
        mode: 'scatter',
        scatterTarget: { x: GRID_COLS - 1, y: GRID_ROWS + 2 },
        homeTarget: { x: 14, y: 14 },
        releaseTime: now + 7000, // Release after 7 seconds
        inHouse: true
      },
      {
        id: 'johnson',
        name: 'Johnson',
        colour: '#808080',
        frightenedColour: '#0000FF',
        x: 16,
        y: 14,          // Inside ghost house
        targetX: 14,
        targetY: 23,
        direction: 'up',
        mode: 'scatter',
        scatterTarget: { x: 0, y: GRID_ROWS + 2 },
        homeTarget: { x: 16, y: 14 },
        releaseTime: now + 12000, // Release after 12 seconds
        inHouse: true
      }
    ];
    ghostModeRef.current = 'scatter';
    ghostModeTimerRef.current = now;
    frightenedTimerRef.current = 0;
    ghostsEatenRef.current = 0;
  }, []);

  // Initialise maze
  const initMaze = useCallback(() => {
    mazeRef.current = INITIAL_MAZE.map(row => [...row]);

    // Count dots
    let dots = 0;
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (mazeRef.current[y][x] === DOT || mazeRef.current[y][x] === POWER_PELLET) {
          dots++;
        }
      }
    }
    setDotsRemaining(dots);
  }, []);

  // Initialise game
  const initializeGame = useCallback(() => {
    // Reset player
    playerRef.current = {
      x: 14,
      y: 23,
      direction: 'left',
      nextDirection: null,
      mouthOpen: true
    };

    // Reset maze and ghosts
    initMaze();
    initGhosts();

    // Reset state
    setScore(0);
    setLevel(1);
    setLives(3);

    // Reset achievement tracking
    levelDeathsRef.current = 0;
    totalGhostsEatenRef.current = 0;
    fruitsCollectedRef.current = 0;

    // Reset fruit state
    fruitRef.current = null;
    lastFruitSpawnRef.current = 0;
    dotsEatenRef.current = 0;

    // Initialise matrix rain
    matrixDropsRef.current = [];
    for (let i = 0; i < 20; i++) {
      matrixDropsRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        char: getMatrixChar(),
        speed: 0.5 + Math.random() * 1.5
      });
    }
  }, [initMaze, initGhosts]);

  // Auto-start on mount if autoStart prop is true
  useEffect(() => {
    if (autoStartRef.current) {
      initializeGame();
    }
  }, [initializeGame]);

  // Reset after death
  const resetAfterDeath = useCallback(() => {
    playerRef.current = {
      x: 14,
      y: 23,
      direction: 'left',
      nextDirection: null,
      mouthOpen: true
    };
    initGhosts();
    levelDeathsRef.current++;
  }, [initGhosts]);

  // Start next level
  const startNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    initMaze();
    initGhosts();
    playerRef.current = {
      x: 14,
      y: 23,
      direction: 'left',
      nextDirection: null,
      mouthOpen: true
    };
    levelDeathsRef.current = 0;
    setGamePhase('playing');

    // Level achievements
    if (level + 1 >= 5) {
      unlockGameAchievement('pacman_level_5');
    }
  }, [initMaze, initGhosts, level, unlockGameAchievement]);

  // Update ghost target based on mode and AI
  const updateGhostTarget = useCallback((ghost: Ghost, player: Player) => {
    if (ghost.mode === 'frightened') {
      // Random target when frightened
      ghost.targetX = Math.floor(Math.random() * GRID_COLS);
      ghost.targetY = Math.floor(Math.random() * GRID_ROWS);
      return;
    }

    if (ghost.mode === 'eaten') {
      // Return to ghost house
      ghost.targetX = ghost.homeTarget.x;
      ghost.targetY = ghost.homeTarget.y;
      return;
    }

    if (ghost.mode === 'scatter') {
      ghost.targetX = ghost.scatterTarget.x;
      ghost.targetY = ghost.scatterTarget.y;
      return;
    }

    // Chase mode - unique AI per ghost
    switch (ghost.id) {
      case 'smith':
        // Directly targets player
        ghost.targetX = Math.floor(player.x);
        ghost.targetY = Math.floor(player.y);
        break;

      case 'brown': {
        // Targets 4 tiles ahead of player
        const dir = DIRECTIONS[player.direction];
        ghost.targetX = Math.floor(player.x) + dir.x * 4;
        ghost.targetY = Math.floor(player.y) + dir.y * 4;
        break;
      }

      case 'jones': {
        // Random when far, direct when close
        const dist = distance(ghost.x, ghost.y, player.x, player.y);
        if (dist > 8) {
          ghost.targetX = Math.floor(Math.random() * GRID_COLS);
          ghost.targetY = Math.floor(Math.random() * GRID_ROWS);
        } else {
          ghost.targetX = Math.floor(player.x);
          ghost.targetY = Math.floor(player.y);
        }
        break;
      }

      case 'johnson': {
        // Flanks from the side
        const playerDir = DIRECTIONS[player.direction];
        // Perpendicular direction
        ghost.targetX = Math.floor(player.x) + playerDir.y * 4;
        ghost.targetY = Math.floor(player.y) + playerDir.x * 4;
        break;
      }
    }
  }, []);

  // Move ghost
  const moveGhost = useCallback((ghost: Ghost, speed: number) => {
    const currentX = Math.floor(ghost.x);
    const currentY = Math.floor(ghost.y);

    // Check if at grid intersection
    const atIntersection = Math.abs(ghost.x - currentX) < 0.1 && Math.abs(ghost.y - currentY) < 0.1;

    if (atIntersection) {
      // Snap to grid
      ghost.x = currentX;
      ghost.y = currentY;

      // Find best direction
      const directions: Direction[] = ['up', 'down', 'left', 'right'];
      let bestDir: Direction = ghost.direction;
      let bestDist = Infinity;

      for (const dir of directions) {
        // Can't reverse direction
        if (dir === getOpposite(ghost.direction)) continue;

        const nextX = currentX + DIRECTIONS[dir].x;
        const nextY = currentY + DIRECTIONS[dir].y;

        if (isWalkable(nextX, nextY)) {
          // Ghosts can't enter ghost house unless eaten
          if (mazeRef.current[nextY]?.[nextX] === GHOST_HOUSE && ghost.mode !== 'eaten') continue;

          const dist = distance(nextX, nextY, ghost.targetX, ghost.targetY);
          if (dist < bestDist) {
            bestDist = dist;
            bestDir = dir;
          }
        }
      }

      ghost.direction = bestDir;
    }

    // Move
    const dir = DIRECTIONS[ghost.direction];
    ghost.x += dir.x * speed;
    ghost.y += dir.y * speed;

    // Tunnel wrap
    if (ghost.y === 14) {
      if (ghost.x < -1) ghost.x = GRID_COLS;
      else if (ghost.x > GRID_COLS) ghost.x = -1;
    }

    // Check if returned home (eaten mode)
    if (ghost.mode === 'eaten' &&
        Math.abs(ghost.x - ghost.homeTarget.x) < 0.5 &&
        Math.abs(ghost.y - ghost.homeTarget.y) < 0.5) {
      // Brief pause in house before re-emerging (1 second delay)
      ghost.inHouse = true;
      ghost.releaseTime = Date.now() + 1000;
      ghost.mode = ghostModeRef.current === 'scatter' ? 'scatter' : 'chase';
    }
  }, [isWalkable]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      switch (key) {
        case 'enter':
          if (gamePhase === 'menu' || gamePhase === 'gameOver') {
            initializeGame();
            setGamePhase('playing');
          } else if (gamePhase === 'levelComplete') {
            startNextLevel();
          }
          break;
        case 'p':
          if (gamePhase === 'playing') {
            setGamePhase('paused');
          } else if (gamePhase === 'paused') {
            setGamePhase('playing');
          }
          break;
        case 'r':
          if (gamePhase === 'gameOver' || gamePhase === 'paused') {
            initializeGame();
            setGamePhase('playing');
          }
          break;
        case 'w':
        case 'arrowup':
          e.preventDefault();
          if (gamePhase === 'playing') {
            playerRef.current.nextDirection = 'up';
          }
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          if (gamePhase === 'playing') {
            playerRef.current.nextDirection = 'down';
          }
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          if (gamePhase === 'playing') {
            playerRef.current.nextDirection = 'left';
          }
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          if (gamePhase === 'playing') {
            playerRef.current.nextDirection = 'right';
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, initializeGame, startNextLevel]);

  // Main game loop
  useGameLoop((_deltaTime) => {
    if (gamePhase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = playerRef.current;
    const now = Date.now();

    // Update mouth animation
    mouthAnimationRef.current = (mouthAnimationRef.current + 0.3) % (Math.PI * 2);
    player.mouthOpen = Math.sin(mouthAnimationRef.current) > 0;

    // Update ghost mode timer
    if (frightenedTimerRef.current > 0 && now > frightenedTimerRef.current) {
      // End frightened mode
      frightenedTimerRef.current = 0;
      ghostsRef.current.forEach(ghost => {
        if (ghost.mode === 'frightened') {
          ghost.mode = ghostModeRef.current;
        }
      });
      ghostsEatenRef.current = 0;
    }

    // Calculate time remaining in frightened mode (for flashing warning)
    const frightenedTimeRemaining = frightenedTimerRef.current > 0 ? frightenedTimerRef.current - now : 0;
    const isFrightenedFlashing = frightenedTimeRemaining > 0 && frightenedTimeRemaining < 3000;

    // Update scatter/chase mode
    const timeSinceMode = now - ghostModeTimerRef.current;
    if (ghostModeRef.current === 'scatter' && timeSinceMode > SCATTER_DURATION) {
      ghostModeRef.current = 'chase';
      ghostModeTimerRef.current = now;
      ghostsRef.current.forEach(ghost => {
        if (ghost.mode === 'scatter') ghost.mode = 'chase';
      });
    } else if (ghostModeRef.current === 'chase' && timeSinceMode > CHASE_DURATION) {
      ghostModeRef.current = 'scatter';
      ghostModeTimerRef.current = now;
      ghostsRef.current.forEach(ghost => {
        if (ghost.mode === 'chase') ghost.mode = 'scatter';
      });
    }

    // Update player position
    const currentX = Math.floor(player.x);
    const currentY = Math.floor(player.y);
    const atIntersection = Math.abs(player.x - currentX) < 0.1 && Math.abs(player.y - currentY) < 0.1;

    if (atIntersection) {
      player.x = currentX;
      player.y = currentY;

      // Try next direction
      if (player.nextDirection) {
        const nextDir = DIRECTIONS[player.nextDirection];
        const nextX = currentX + nextDir.x;
        const nextY = currentY + nextDir.y;
        if (isWalkable(nextX, nextY)) {
          player.direction = player.nextDirection;
          player.nextDirection = null;
        }
      }

      // Check current direction
      const dir = DIRECTIONS[player.direction];
      const targetX = currentX + dir.x;
      const targetY = currentY + dir.y;
      if (!isWalkable(targetX, targetY)) {
        // Stop at wall
      } else {
        player.x += dir.x * PLAYER_SPEED;
        player.y += dir.y * PLAYER_SPEED;
      }

      // Collect dots
      const cell = mazeRef.current[currentY]?.[currentX];
      if (cell === DOT) {
        mazeRef.current[currentY][currentX] = EMPTY;
        setScore(prev => {
          const newScore = prev + DOT_POINTS;
          if (newScore >= 10000) unlockGameAchievement('pacman_10000');
          return newScore;
        });
        setDotsRemaining(prev => prev - 1);
        unlockGameAchievement('pacman_first_dot');
        playSound('wakaWaka');
        collectFood(currentX * CELL_SIZE + CELL_SIZE / 2, currentY * CELL_SIZE + CELL_SIZE / 2, '#FF0000');

        // Track dots eaten for fruit spawning
        dotsEatenRef.current++;

        // Spawn fruit at 70 and 170 dots eaten (like classic Pacman)
        if ((dotsEatenRef.current === 70 || dotsEatenRef.current === 170) && !fruitRef.current) {
          const fruitTypes: FruitType[] = ['cherry', 'apple', 'orange'];
          // Higher level = better fruit chance
          const fruitIndex = Math.min(Math.floor((level - 1) / 2), fruitTypes.length - 1);
          fruitRef.current = {
            x: 14, // Centre of maze
            y: 17, // Below ghost house
            type: fruitTypes[fruitIndex],
            spawnTime: now
          };
          lastFruitSpawnRef.current = now;
        }
      } else if (cell === POWER_PELLET) {
        mazeRef.current[currentY][currentX] = EMPTY;
        setScore(prev => prev + POWER_PELLET_POINTS);
        setDotsRemaining(prev => prev - 1);
        playSound('powerup');

        // Frighten ghosts (duration scales with level)
        const { frightenedDuration } = getLevelDifficulty(level);
        frightenedTimerRef.current = now + frightenedDuration;
        ghostsEatenRef.current = 0;
        ghostsRef.current.forEach(ghost => {
          if (ghost.mode !== 'eaten') {
            ghost.mode = 'frightened';
            // Reverse direction
            ghost.direction = getOpposite(ghost.direction);
          }
        });
      }
    } else {
      // Continue moving
      const dir = DIRECTIONS[player.direction];
      player.x += dir.x * PLAYER_SPEED;
      player.y += dir.y * PLAYER_SPEED;
    }

    // Tunnel wrap
    if (player.y === 14) {
      if (player.x < -0.5) player.x = GRID_COLS - 0.5;
      else if (player.x > GRID_COLS - 0.5) player.x = -0.5;
    }

    // Update ghosts
    ghostsRef.current.forEach(ghost => {
      // Handle staggered ghost release from house
      if (ghost.inHouse) {
        if (now >= ghost.releaseTime) {
          // Time to exit the house
          ghost.inHouse = false;
          ghost.x = 14; // Move to house exit position
          ghost.y = 11; // Exit point above ghost house
          ghost.direction = 'left';
        } else {
          // Bob up and down while waiting in house
          const bobOffset = Math.sin(now / 300) * 0.3;
          ghost.y = ghost.homeTarget.y + bobOffset;
          return; // Skip normal movement and collision while in house
        }
      }

      updateGhostTarget(ghost, player);
      // Apply level-based speed scaling
      const { speedMult } = getLevelDifficulty(level);
      const baseSpeed = ghost.mode === 'frightened' ? BASE_FRIGHTENED_SPEED :
                        ghost.mode === 'eaten' ? BASE_GHOST_SPEED * 2 : BASE_GHOST_SPEED;
      const speed = baseSpeed * speedMult;
      moveGhost(ghost, speed);

      // Check collision with player
      const dx = Math.abs(ghost.x - player.x);
      const dy = Math.abs(ghost.y - player.y);
      if (dx < 0.8 && dy < 0.8) {
        if (ghost.mode === 'frightened') {
          // Eat ghost
          ghost.mode = 'eaten';
          const points = GHOST_POINTS[Math.min(ghostsEatenRef.current, 3)];
          setScore(prev => prev + points);
          ghostsEatenRef.current++;
          totalGhostsEatenRef.current++;
          playSound('ghostEat');
          explode(ghost.x * CELL_SIZE + CELL_SIZE / 2, ghost.y * CELL_SIZE + CELL_SIZE / 2, ghost.colour);
          unlockGameAchievement('pacman_eat_ghost');

          // Check all ghosts eaten
          if (ghostsEatenRef.current === 4) {
            unlockGameAchievement('pacman_all_ghosts');
          }
        } else if (ghost.mode !== 'eaten') {
          // Player dies
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGamePhase('gameOver');
              playSound('gameOver');
              const newHighScore = Math.max(score, highScore);
              setHighScore(newHighScore);
              updateGameSave('agentEscape', {
                highScore: newHighScore,
                level,
                stats: {
                  gamesPlayed: (saveData?.games?.agentEscape?.stats?.gamesPlayed || 0) + 1,
                  totalScore: (saveData?.games?.agentEscape?.stats?.totalScore || 0) + score,
                }
              });
            } else {
              resetAfterDeath();
              playSound('hit');
            }
            return newLives;
          });
        }
      }
    });

    // Handle fruit
    if (fruitRef.current) {
      const fruit = fruitRef.current;

      // Fruit despawns after 10 seconds
      if (now - fruit.spawnTime > 10000) {
        fruitRef.current = null;
      } else {
        // Check player collision with fruit
        const dx = Math.abs(player.x - fruit.x);
        const dy = Math.abs(player.y - fruit.y);
        if (dx < 0.8 && dy < 0.8) {
          // Collect fruit
          const points = FRUIT_POINTS[fruit.type];
          setScore(prev => prev + points);
          fruitsCollectedRef.current++;
          playSound('powerup');
          collectFood(fruit.x * CELL_SIZE + CELL_SIZE / 2, fruit.y * CELL_SIZE + CELL_SIZE / 2, FRUIT_COLOURS[fruit.type]);
          explode(fruit.x * CELL_SIZE + CELL_SIZE / 2, fruit.y * CELL_SIZE + CELL_SIZE / 2, FRUIT_COLOURS[fruit.type]);
          fruitRef.current = null;

          // Fruit achievements
          if (fruitsCollectedRef.current >= 5) {
            unlockGameAchievement('pacman_fruit_all');
          }
        }
      }
    }

    // Check level complete
    if (dotsRemaining <= 0) {
      setGamePhase('levelComplete');
      playSound('levelUp');
      unlockGameAchievement('pacman_level_1');

      // Flawless achievement
      if (levelDeathsRef.current === 0) {
        unlockGameAchievement('pacman_no_death');
      }
    }

    // Update matrix rain
    matrixDropsRef.current.forEach(drop => {
      drop.y += drop.speed;
      if (drop.y > CANVAS_HEIGHT) {
        drop.y = 0;
        drop.x = Math.random() * CANVAS_WIDTH;
        drop.char = getMatrixChar();
      }
    });

    // Render
    render(ctx, now, isFrightenedFlashing);
  });

  // Render function
  const render = useCallback((ctx: CanvasRenderingContext2D, timestamp: number, isFrightenedFlashing: boolean) => {
    const player = playerRef.current;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw matrix rain background
    ctx.font = '10px monospace';
    matrixDropsRef.current.forEach(drop => {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.fillText(drop.char, drop.x, drop.y);
    });

    // Draw maze
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const cell = mazeRef.current[y]?.[x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (cell === WALL) {
          ctx.fillStyle = '#003300';
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        } else if (cell === DOT) {
          // Red pill (dot)
          ctx.fillStyle = '#FF0000';
          ctx.shadowBlur = 3;
          ctx.shadowColor = '#FF0000';
          ctx.beginPath();
          ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (cell === POWER_PELLET) {
          // Power pellet (glowing)
          ctx.fillStyle = '#FF0000';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#FF0000';
          ctx.beginPath();
          ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw fruit
    if (fruitRef.current) {
      const fruit = fruitRef.current;
      const fx = fruit.x * CELL_SIZE;
      const fy = fruit.y * CELL_SIZE;
      const colour = FRUIT_COLOURS[fruit.type];

      ctx.shadowBlur = 12;
      ctx.shadowColor = colour;
      ctx.fillStyle = colour;

      if (fruit.type === 'cherry') {
        // Draw cherry (two circles with stems)
        ctx.beginPath();
        ctx.arc(fx + 6, fy + 12, 5, 0, Math.PI * 2);
        ctx.arc(fx + 14, fy + 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#006600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx + 6, fy + 7);
        ctx.quadraticCurveTo(fx + 10, fy + 2, fx + 14, fy + 7);
        ctx.stroke();
      } else if (fruit.type === 'apple') {
        // Draw apple (circle with indent)
        ctx.beginPath();
        ctx.arc(fx + 10, fy + 12, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#006600';
        ctx.beginPath();
        ctx.ellipse(fx + 10, fy + 4, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw orange (simple circle with highlight)
        ctx.beginPath();
        ctx.arc(fx + 10, fy + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFAA44';
        ctx.beginPath();
        ctx.arc(fx + 7, fy + 7, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
    }

    // Draw ghosts
    ghostsRef.current.forEach(ghost => {
      const gx = ghost.x * CELL_SIZE;
      const gy = ghost.y * CELL_SIZE;

      if (ghost.mode === 'eaten') {
        // Just eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(gx + 6, gy + 8, 4, 0, Math.PI * 2);
        ctx.arc(gx + 14, gy + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(gx + 7, gy + 9, 2, 0, Math.PI * 2);
        ctx.arc(gx + 15, gy + 9, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Full ghost - determine colour based on mode and flashing state
        let ghostColour: string;
        if (ghost.mode === 'frightened') {
          // Flash between blue and white in last 3 seconds of frightened mode
          if (isFrightenedFlashing && Math.floor(timestamp / 200) % 2 === 0) {
            ghostColour = '#FFFFFF'; // Flash white
          } else {
            ghostColour = ghost.frightenedColour; // Blue
          }
        } else {
          ghostColour = ghost.colour;
        }

        ctx.fillStyle = ghostColour;
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.fillStyle as string;

        // Body
        ctx.beginPath();
        ctx.arc(gx + CELL_SIZE / 2, gy + CELL_SIZE / 2, CELL_SIZE / 2 - 2, Math.PI, 0);
        ctx.lineTo(gx + CELL_SIZE - 2, gy + CELL_SIZE - 2);
        // Wavy bottom
        for (let i = 0; i < 3; i++) {
          ctx.lineTo(gx + CELL_SIZE - 2 - (i * 6) - 3, gy + CELL_SIZE - 5);
          ctx.lineTo(gx + CELL_SIZE - 2 - (i * 6) - 6, gy + CELL_SIZE - 2);
        }
        ctx.fill();

        // Eyes - also flash when frightened mode ending
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(gx + 6, gy + 8, 3, 0, Math.PI * 2);
        ctx.arc(gx + 14, gy + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        // Pupils - flash colour indicates frightened mode ending
        ctx.fillStyle = ghost.mode === 'frightened'
          ? (isFrightenedFlashing && Math.floor(timestamp / 200) % 2 === 0 ? '#FF0000' : '#FFFFFF')
          : '#0000FF';
        ctx.beginPath();
        ctx.arc(gx + 7, gy + 9, 1.5, 0, Math.PI * 2);
        ctx.arc(gx + 15, gy + 9, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }
    });

    // Draw player (Neo)
    const px = player.x * CELL_SIZE;
    const py = player.y * CELL_SIZE;

    ctx.fillStyle = '#00FF00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FF00';

    // Draw as Pacman-style circle with mouth
    ctx.beginPath();
    const mouthAngle = player.mouthOpen ? 0.3 : 0.05;
    let startAngle: number;
    let endAngle: number;

    switch (player.direction) {
      case 'right':
        startAngle = mouthAngle;
        endAngle = Math.PI * 2 - mouthAngle;
        break;
      case 'left':
        startAngle = Math.PI + mouthAngle;
        endAngle = Math.PI - mouthAngle;
        break;
      case 'up':
        startAngle = Math.PI * 1.5 + mouthAngle;
        endAngle = Math.PI * 1.5 - mouthAngle;
        break;
      case 'down':
        startAngle = Math.PI * 0.5 + mouthAngle;
        endAngle = Math.PI * 0.5 - mouthAngle;
        break;
    }

    ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE / 2 - 2, startAngle, endAngle);
    ctx.lineTo(px + CELL_SIZE / 2, py + CELL_SIZE / 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Draw particles
    renderParticles(ctx);
  }, [renderParticles]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black flex flex-col items-center justify-center font-mono relative"
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-green-500"
        style={{ boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)' }}
      />

      {/* Menu Overlay */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <h1 className="text-4xl font-bold text-green-500 mb-4" style={{ textShadow: '0 0 10px #00ff00' }}>
            AGENT ESCAPE
          </h1>
          <p className="text-green-400 mb-2">Collect Red Pills</p>
          <p className="text-green-300 text-sm mb-8">Evade the Agents</p>
          <button
            onClick={() => {
              initializeGame();
              setGamePhase('playing');
            }}
            className="px-6 py-3 bg-green-500 text-black font-bold hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto mb-4"
          >
            <Play className="w-5 h-5" />
            START GAME
          </button>
          <div className="text-green-500 text-sm mb-4">or press ENTER</div>
          <div className="mt-4 text-green-600 text-sm">
            <p>WASD or Arrows - Move</p>
            <p>P - Pause | R - Restart</p>
          </div>
          <div className="mt-4 text-green-700 text-xs">
            <p>Agents: Smith (white) • Brown • Jones (blue) • Johnson (gray)</p>
          </div>
          {highScore > 0 && (
            <p className="mt-4 text-green-400">High Score: {highScore}</p>
          )}
        </div>
      )}

      {/* Paused Overlay */}
      {gamePhase === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <h2 className="text-3xl font-bold text-green-500 mb-4">PAUSED</h2>
          <p className="text-green-400 mb-2">Score: {score}</p>
          <p className="text-green-400">Press P to Resume</p>
          <p className="text-green-400">Press R to Restart</p>
        </div>
      )}

      {/* Game Over Overlay */}
      {gamePhase === 'gameOver' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <h2 className="text-3xl font-bold text-red-500 mb-4">GAME OVER</h2>
          <p className="text-green-400 mb-2">Score: {score}</p>
          <p className="text-green-400 mb-2">Level: {level}</p>
          <p className="text-green-400 mb-4">High Score: {highScore}</p>
          {score >= highScore && score > 0 && (
            <p className="text-yellow-400 mb-4 animate-pulse">NEW HIGH SCORE!</p>
          )}
          <div className="text-green-500 animate-pulse">Press ENTER to Play Again</div>
        </div>
      )}

      {/* Level Complete Overlay */}
      {gamePhase === 'levelComplete' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <h2 className="text-3xl font-bold text-green-500 mb-4">LEVEL {level} COMPLETE</h2>
          <p className="text-green-400 mb-4">Score: {score}</p>
          {levelDeathsRef.current === 0 && (
            <p className="text-yellow-400 mb-4 animate-pulse">FLAWLESS!</p>
          )}
          <div className="text-green-500 animate-pulse">Press ENTER for Next Level</div>
        </div>
      )}

      {/* HUD */}
      {gamePhase === 'playing' && (
        <div className="absolute top-4 left-4 right-4 flex justify-between text-green-500">
          <div>
            <p className="text-lg">Score: {score}</p>
            <p className="text-sm text-green-600">Level: {level}</p>
          </div>
          <div className="text-right">
            <p>Lives: {'♥'.repeat(lives)}</p>
            <p className="text-sm text-green-600">High: {highScore}</p>
          </div>
        </div>
      )}

      {/* Footer Controls Hint */}
      <div className="absolute bottom-4 text-green-600 text-xs">
        ↑↓←→ or WASD to move • P to pause • ESC to exit
      </div>
    </div>
  );
}
