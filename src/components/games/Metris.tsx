/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Matrix-themed Tetris with bullet time mode, ghost piece, hold mechanic,
 *              and particle effects. Blocks display Matrix code that "compiles" on clear.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCw, Square, Clock, Trophy, Zap } from 'lucide-react';
import { useSoundSynthesis } from '../../hooks/useSoundSynthesis';
import { useSaveSystem } from '../../hooks/useSaveSystem';
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const INITIAL_DROP_SPEED = 400; // ms - normal drop speed (8s full drop)
const SPEED_DECREASE = 30; // ms per level decrease
const MIN_DROP_SPEED = 100; // minimum drop speed
const SOFT_DROP_SPEED = 50; // ms - fast drop when holding down
const LINES_PER_LEVEL = 10;
const PARTICLE_COUNT = 30;
const BULLET_TIME_COST = 5; // lines needed to fill bullet time meter
const BULLET_TIME_DURATION = 8000; // ms
const BULLET_TIME_SLOWDOWN = 0.4; // 40% speed
const DAS_DELAY = 170; // ms - Delayed Auto Shift initial delay
const DAS_REPEAT = 50; // ms - DAS repeat rate
const LOCK_DELAY = 500; // ms - time before piece locks when grounded
const MAX_LOCK_RESETS = 15; // maximum lock delay resets per piece

// Matrix characters for blocks
const MATRIX_CHARS = '01アイウエオカキクケコ';
const GLOW_COLORS = ['#00ff00', '#00cc00', '#009900', '#00ffaa'];

// Tetromino shapes (using SRS - Super Rotation System)
const TETROMINOES = {
  I: {
    shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    color: '#00FFFF',
    char: '01'
  },
  O: {
    shape: [[1, 1], [1, 1]],
    color: '#FFFF00',
    char: 'ア'
  },
  T: {
    shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    color: '#FF00FF',
    char: 'イ'
  },
  S: {
    shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    color: '#00FF00',
    char: 'ウ'
  },
  Z: {
    shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    color: '#FF0000',
    char: 'エ'
  },
  J: {
    shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    color: '#0000FF',
    char: 'オ'
  },
  L: {
    shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    color: '#FFA500',
    char: 'カ'
  }
};

type TetrominoType = keyof typeof TETROMINOES;
const TETROMINO_KEYS = Object.keys(TETROMINOES) as TetrominoType[];

// Particle interface
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  opacity: number;
  life: number;
  color: string;
  size: number;
}

// Block interface for the grid
interface Block {
  filled: boolean;
  color: string;
  char: string;
  glow?: number;
}

// Piece interface
interface Piece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
  rotation: number;
}

// Game state interface
interface GameState {
  grid: Block[][];
  currentPiece: Piece | null;
  nextPiece: Piece | null;
  holdPiece: Piece | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  combo: number;
  gameOver: boolean;
  paused: boolean;
  highScore: number;
  // particles removed from state - now in ref for 60fps updates
  bulletTimeMeter: number;
  bulletTimeActive: boolean;
  bulletTimeTimer: number;
  tSpins: number;
  waiting: boolean; // Waiting for spacebar to start
  softDropActive: boolean; // Down arrow held for fast drop
}

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface MetrisProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
}

export default function Metris({ achievementManager, isMuted }: MetrisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastDropTimeRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);
  const bulletTimeEndRef = useRef<number>(0);
  const dropIntervalRef = useRef<number>(INITIAL_DROP_SPEED);
  const keysRef = useRef<Set<string>>(new Set());
  const moveDelayRef = useRef<{ left: number; right: number; down: number }>({
    left: 0,
    right: 0,
    down: 0
  });
  const dropIntervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const particlesRef = useRef<Particle[]>([]); // Particles stored in ref for smooth 60fps animation

  // 7-Bag randomizer refs
  const pieceBagRef = useRef<TetrominoType[]>([]);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const totalLinesRef = useRef<number>(0);
  const tSpinsRef = useRef<number>(0);
  const lockDelayRef = useRef<number>(0);
  const lockDelayResets = useRef<number>(0);
  const lastGroundedTime = useRef<number>(0);
  const isGroundedRef = useRef<boolean>(false);

  // Hooks
  const { synthLaser, synthExplosion, synthPowerUp, synthDrum } = useSoundSynthesis();
  const { saveData, updateGameSave, unlockAchievement: unlockAchievementSave } = useSaveSystem();

  // Initialize empty grid
  const createEmptyGrid = (): Block[][] => {
    return Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({
        filled: false,
        color: '#000000',
        char: '',
        glow: 0
      }))
    );
  };

  // 7-Bag Randomizer: Ensures fair piece distribution
  const createPiece = useCallback((type?: TetrominoType): Piece => {
    let pieceType: TetrominoType;

    if (type) {
      pieceType = type;
    } else {
      // If bag is empty, refill and shuffle
      if (pieceBagRef.current.length === 0) {
        pieceBagRef.current = [...TETROMINO_KEYS];
        // Fisher-Yates shuffle
        for (let i = pieceBagRef.current.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pieceBagRef.current[i], pieceBagRef.current[j]] = [pieceBagRef.current[j], pieceBagRef.current[i]];
        }
      }
      // Pull from bag
      pieceType = pieceBagRef.current.pop()!;
    }

    const template = TETROMINOES[pieceType];

    return {
      type: pieceType,
      shape: template.shape.map(row => [...row]),
      x: Math.floor(COLS / 2) - Math.floor(template.shape[0].length / 2),
      y: 0,
      rotation: 0
    };
  }, []);

  // Initial state
  const [state, setState] = useState<GameState>(() => {
    const highScore = parseInt(localStorage.getItem('metris_highScore') || '0');
    return {
      grid: createEmptyGrid(),
      currentPiece: createPiece(),
      nextPiece: createPiece(),
      holdPiece: null,
      canHold: true,
      score: 0,
      level: 1,
      lines: 0,
      combo: 0,
      gameOver: false,
      paused: false,
      highScore,
      bulletTimeMeter: 0,
      bulletTimeActive: false,
      bulletTimeTimer: 0,
      tSpins: 0,
      waiting: true, // Start in waiting state
      softDropActive: false
    };
  });

  // Rotate matrix 90 degrees clockwise
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const n = matrix.length;
    const rotated = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        rotated[x][n - 1 - y] = matrix[y][x];
      }
    }
    return rotated;
  };

  // Check collision
  const checkCollision = useCallback((piece: Piece, grid: Block[][], offsetX = 0, offsetY = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;

          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }

          if (newY >= 0 && grid[newY][newX].filled) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Wall kick data for SRS
  const getWallKickOffsets = (rotation: number, direction: number): [number, number][] => {
    // Simplified wall kicks
    if (direction > 0) { // Clockwise
      return [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]];
    } else { // Counter-clockwise
      return [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]];
    }
  };

  // Rotate piece with wall kicks
  const rotatePiece = useCallback((piece: Piece, direction: number, grid: Block[][]): Piece | null => {
    const rotated = {
      ...piece,
      shape: direction > 0 ? rotateMatrix(piece.shape) :
             rotateMatrix(rotateMatrix(rotateMatrix(piece.shape))),
      rotation: (piece.rotation + direction + 4) % 4
    };

    // Try wall kicks
    const offsets = getWallKickOffsets(piece.rotation, direction);
    for (const [offsetX, offsetY] of offsets) {
      if (!checkCollision(rotated, grid, offsetX, offsetY)) {
        return { ...rotated, x: rotated.x + offsetX, y: rotated.y + offsetY };
      }
    }

    return null;
  }, [checkCollision]);

  // Get ghost piece position (where piece will land)
  const getGhostPosition = useCallback((piece: Piece, grid: Block[][]): number => {
    let ghostY = piece.y;
    while (!checkCollision({ ...piece, y: ghostY + 1 }, grid)) {
      ghostY++;
    }
    return ghostY;
  }, [checkCollision]);

  // Lock piece to grid
  const lockPiece = useCallback((piece: Piece, grid: Block[][]): Block[][] => {
    const newGrid = grid.map(row => [...row]);
    const template = TETROMINOES[piece.type];

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const gridY = piece.y + y;
          const gridX = piece.x + x;
          if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
            newGrid[gridY][gridX] = {
              filled: true,
              color: template.color,
              char: template.char,
              glow: 1
            };
          }
        }
      }
    }

    return newGrid;
  }, []);

  // Check and clear lines
  const clearLines = useCallback((grid: Block[][]): { newGrid: Block[][], linesCleared: number } => {
    const linesToClear: number[] = [];

    // Find full lines
    for (let y = 0; y < ROWS; y++) {
      if (grid[y].every(block => block.filled)) {
        linesToClear.push(y);
      }
    }

    if (linesToClear.length === 0) {
      return { newGrid: grid, linesCleared: 0 };
    }

    // Create particles for cleared lines and add directly to particlesRef
    linesToClear.forEach(y => {
      for (let x = 0; x < COLS; x++) {
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push({
            x: x * BLOCK_SIZE + BLOCK_SIZE / 2,
            y: y * BLOCK_SIZE + BLOCK_SIZE / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
            opacity: 1,
            life: 1,
            color: grid[y][x].color,
            size: 12 + Math.random() * 8
          });
        }
      }
    });

    // Remove cleared lines and add new empty lines at top
    const newGrid = grid.filter((_, index) => !linesToClear.includes(index));
    while (newGrid.length < ROWS) {
      newGrid.unshift(Array(COLS).fill(null).map(() => ({
        filled: false,
        color: '#000000',
        char: '',
        glow: 0
      })));
    }

    return { newGrid, linesCleared: linesToClear.length };
  }, []);

  // Calculate score
  const calculateScore = (linesCleared: number, level: number, combo: number): number => {
    const baseScores = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 lines
    return baseScores[linesCleared] * level * Math.max(1, combo);
  };

  // Move piece
  const movePiece = useCallback((dx: number, dy: number) => {
    setState(prev => {
      if (prev.gameOver || prev.paused || !prev.currentPiece) return prev;

      const newPiece = { ...prev.currentPiece, x: prev.currentPiece.x + dx, y: prev.currentPiece.y + dy };

      if (!checkCollision(newPiece, prev.grid)) {
        if (dx !== 0 && !isMuted) synthLaser(400, 300, 0.05);
        return { ...prev, currentPiece: newPiece };
      }

      return prev;
    });
  }, [checkCollision, synthLaser, isMuted]);

  // Rotate piece
  const handleRotate = useCallback((direction: number) => {
    setState(prev => {
      if (prev.gameOver || prev.paused || !prev.currentPiece) return prev;

      const rotated = rotatePiece(prev.currentPiece, direction, prev.grid);

      if (rotated) {
        if (!isMuted) synthLaser(600, 800, 0.08);
        return { ...prev, currentPiece: rotated };
      }

      return prev;
    });
  }, [rotatePiece, synthLaser, isMuted]);


  // Hold piece
  const holdPiece = useCallback(() => {
    setState(prev => {
      if (prev.gameOver || prev.paused || !prev.currentPiece || !prev.canHold) return prev;

      let newCurrentPiece: Piece;
      let newHoldPiece: Piece;

      if (prev.holdPiece) {
        // Swap with held piece
        newCurrentPiece = createPiece(prev.holdPiece.type);
        newHoldPiece = createPiece(prev.currentPiece.type);
      } else {
        // First hold - use next piece
        newCurrentPiece = prev.nextPiece || createPiece();
        newHoldPiece = createPiece(prev.currentPiece.type);
      }

      if (!isMuted) synthLaser(800, 1000, 0.1);

      return {
        ...prev,
        currentPiece: newCurrentPiece,
        holdPiece: newHoldPiece,
        nextPiece: prev.holdPiece ? prev.nextPiece : createPiece(),
        canHold: false
      };
    });
  }, [createPiece, synthLaser, isMuted]);

  // Toggle bullet time
  const toggleBulletTime = useCallback(() => {
    setState(prev => {
      if (prev.gameOver || prev.paused || prev.bulletTimeActive) return prev;

      if (prev.bulletTimeMeter >= 100) {
        if (!isMuted) {
          synthDrum({ type: 'kick', pitch: 0.5, decay: 1 });
          synthPowerUp('activate');
        }

        bulletTimeEndRef.current = Date.now() + BULLET_TIME_DURATION;

        // Achievement
        if (achievementManager) {
          const currentCount = (saveData.games.metris.preferences?.bulletTimeCount as number) || 0;
          const newBulletTimeCount = currentCount + 1;

          updateGameSave('metris', {
            preferences: {
              ...saveData.games.metris.preferences,
              bulletTimeCount: newBulletTimeCount
            }
          });

          if (newBulletTimeCount >= 10) {
            achievementManager.unlockAchievement('metris', 'neos_apprentice');
          }
        }

        return {
          ...prev,
          bulletTimeMeter: 0,
          bulletTimeActive: true,
          bulletTimeTimer: BULLET_TIME_DURATION
        };
      }

      return prev;
    });
  }, [achievementManager, saveData, updateGameSave, synthDrum, synthPowerUp, isMuted]);

  // Hard drop - instantly drop piece and lock
  const hardDrop = useCallback(() => {
    setState(prev => {
      if (prev.gameOver || prev.paused || prev.waiting || !prev.currentPiece) return prev;

      let dropDistance = 0;
      let testPiece = { ...prev.currentPiece };

      // Find how far the piece can drop
      while (!checkCollision({ ...testPiece, y: testPiece.y + 1 }, prev.grid)) {
        testPiece.y++;
        dropDistance++;
      }

      if (dropDistance === 0) return prev; // Already at bottom

      // Award 2 points per cell dropped
      const dropPoints = dropDistance * 2;

      // Lock the piece immediately at the drop position
      const newGrid = lockPiece(testPiece, prev.grid);
      const { newGrid: clearedGrid, linesCleared } = clearLines(newGrid);

      const newCombo = linesCleared > 0 ? prev.combo + 1 : 0;
      const scorePoints = calculateScore(linesCleared, prev.level, newCombo);
      const newScore = prev.score + scorePoints + dropPoints;
      const newLines = prev.lines + linesCleared;
      const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;

      // Sound
      if (!isMuted) {
        synthExplosion(1, 0.15);
        if (linesCleared > 0) synthPowerUp('collect');
      }

      const nextPiece = prev.nextPiece || createPiece();
      const gameOver = checkCollision(nextPiece, clearedGrid);

      return {
        ...prev,
        grid: clearedGrid,
        currentPiece: gameOver ? null : nextPiece,
        nextPiece: createPiece(),
        canHold: true,
        score: newScore,
        level: newLevel,
        lines: newLines,
        combo: newCombo,
        gameOver
      };
    });
  }, [checkCollision, lockPiece, clearLines, calculateScore, createPiece, synthExplosion, synthPowerUp, isMuted]);

  // Drop piece - called by setInterval at drop speed
  const dropPiece = useCallback(() => {
    setState(currentState => {
      if (currentState.gameOver || currentState.paused || currentState.waiting || !currentState.currentPiece) {
        return currentState;
      }

      // Try to move piece down
      const newY = currentState.currentPiece.y + 1;
      const newPiece = { ...currentState.currentPiece, y: newY };

      if (!checkCollision(newPiece, currentState.grid)) {
        // Piece can move down
        return {
          ...currentState,
          currentPiece: newPiece
        };
      } else {
        // Piece has landed - lock it
        const newGrid = lockPiece(currentState.currentPiece, currentState.grid);
        const { newGrid: clearedGrid, linesCleared } = clearLines(newGrid);

        const newCombo = linesCleared > 0 ? currentState.combo + 1 : 0;
        const points = calculateScore(linesCleared, currentState.level, newCombo);
        const newScore = currentState.score + points;
        const newLines = currentState.lines + linesCleared;
        const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;
        const newBulletTimeMeter = Math.min(100, currentState.bulletTimeMeter + linesCleared * 20);

        // Auto-activate bullet time when meter is full and lines were cleared
        let bulletTimeActivated = currentState.bulletTimeActive;
        let bulletTimeTimer = currentState.bulletTimeTimer;
        if (!currentState.bulletTimeActive && newBulletTimeMeter >= 100 && linesCleared > 0) {
          bulletTimeActivated = true;
          bulletTimeTimer = BULLET_TIME_DURATION;
          bulletTimeEndRef.current = Date.now() + BULLET_TIME_DURATION;

          // Sound effects for bullet time activation
          if (!isMuted) {
            synthDrum({ type: 'kick', pitch: 0.5, decay: 1 });
            synthPowerUp('activate');
          }
        }

        // Achievements
        if (achievementManager) {
          if (linesCleared === 1 && currentState.lines === 0) {
            achievementManager.unlockAchievement('metris', 'first_line');
          }
          if (linesCleared === 4) {
            achievementManager.unlockAchievement('metris', 'tetris');
          }
          if (newLevel >= 10) {
            achievementManager.unlockAchievement('metris', 'level_10');
          }
          if (newScore >= 10000) {
            achievementManager.unlockAchievement('metris', 'high_roller');
          }
          if (newLines >= 100) {
            achievementManager.unlockAchievement('metris', 'line_clearer');
          }
          if (newCombo >= 5) {
            achievementManager.unlockAchievement('metris', 'combo_king');
          }
          if (newLevel >= 20) {
            achievementManager.unlockAchievement('metris', 'immortal');
          }
        }

        // Sound
        if (!isMuted) {
          if (linesCleared === 4) {
            synthExplosion(1.5, 0.8);
          } else if (linesCleared > 0) {
            synthPowerUp('collect');
          }
          synthDrum({ type: 'kick', pitch: 1.2 });
        }

        const nextPiece = currentState.nextPiece || createPiece();
        const gameOver = checkCollision(nextPiece, clearedGrid);

        if (gameOver && !isMuted) {
          synthExplosion(2, 0.3);
        }

        const newHighScore = Math.max(currentState.highScore, newScore);

        // Save game stats on game over
        if (gameOver) {
          const sessionTime = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
          const previousGamesPlayed = saveData.games.metris.stats.gamesPlayed || 0;
          const previousTotalScore = saveData.games.metris.stats.totalScore || 0;
          const previousBestCombo = saveData.games.metris.stats.bestCombo || 0;
          const previousLongestSurvival = saveData.games.metris.stats.longestSurvival || 0;

          setTimeout(() => {
            updateGameSave('metris', {
              highScore: newHighScore,
              level: newLevel,
              stats: {
                gamesPlayed: previousGamesPlayed + 1,
                totalScore: previousTotalScore + newScore,
                bestCombo: Math.max(previousBestCombo, newCombo),
                longestSurvival: Math.max(previousLongestSurvival, sessionTime)
              }
            });
          }, 100);

          // Marathon achievement: Survive 10 minutes
          if (achievementManager && sessionTime >= 600) {
            achievementManager.unlockAchievement('metris', 'marathon_runner');
          }
        }

        return {
          ...currentState,
          grid: clearedGrid,
          currentPiece: gameOver ? null : nextPiece,
          nextPiece: createPiece(),
          canHold: true,
          score: newScore,
          level: newLevel,
          lines: newLines,
          combo: newCombo,
          gameOver,
          highScore: newHighScore,
          bulletTimeMeter: bulletTimeActivated ? 0 : newBulletTimeMeter,
          bulletTimeActive: bulletTimeActivated,
          bulletTimeTimer: bulletTimeTimer
        };
      }
    });
  }, [checkCollision, lockPiece, clearLines, createPiece, achievementManager, synthExplosion, synthPowerUp, synthDrum, isMuted]);

  // Bullet time countdown timer (updates every 100ms instead of 60fps)
  useEffect(() => {
    if (!state.bulletTimeActive) return;

    const bulletTimeInterval = setInterval(() => {
      setState(prev => {
        if (!prev.bulletTimeActive) return prev;

        const remaining = bulletTimeEndRef.current - Date.now();
        if (remaining <= 0) {
          if (!isMuted) synthPowerUp('expire');
          return { ...prev, bulletTimeActive: false, bulletTimeTimer: 0 };
        }

        return { ...prev, bulletTimeTimer: remaining };
      });
    }, 100); // Update every 100ms for smooth countdown display

    return () => clearInterval(bulletTimeInterval);
  }, [state.bulletTimeActive, isMuted, synthPowerUp]);

  // Start/stop drop interval based on game state
  useEffect(() => {
    if (state.gameOver || state.paused || state.waiting) {
      // Clear interval when not playing
      if (dropIntervalIdRef.current) {
        clearInterval(dropIntervalIdRef.current);
        dropIntervalIdRef.current = null;
      }
      return;
    }

    // Calculate drop speed based on level, bullet time, and soft drop
    const levelSpeed = Math.max(MIN_DROP_SPEED, INITIAL_DROP_SPEED - (state.level - 1) * SPEED_DECREASE);
    let currentSpeed = state.softDropActive ? SOFT_DROP_SPEED : levelSpeed;
    currentSpeed = state.bulletTimeActive ? currentSpeed / BULLET_TIME_SLOWDOWN : currentSpeed;

    // Clear old interval
    if (dropIntervalIdRef.current) {
      clearInterval(dropIntervalIdRef.current);
    }

    // Start new interval at current speed
    dropIntervalIdRef.current = setInterval(dropPiece, currentSpeed);

    return () => {
      if (dropIntervalIdRef.current) {
        clearInterval(dropIntervalIdRef.current);
        dropIntervalIdRef.current = null;
      }
    };
  }, [state.gameOver, state.paused, state.waiting, state.level, state.softDropActive, state.bulletTimeActive, dropPiece]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.gameOver) return;

      keysRef.current.add(e.key);

      // Start game with Enter when waiting
      if (state.waiting && e.key === 'Enter') {
        e.preventDefault();
        setState(prev => ({ ...prev, waiting: false }));
        lastDropTimeRef.current = performance.now();
        sessionStartTimeRef.current = Date.now();
        if (!isMuted) synthPowerUp('activate');
        return;
      }

      // Pause
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        // Reset timer when unpausing to prevent instant drop
        if (state.paused) {
          lastDropTimeRef.current = performance.now();
        }
        setState(prev => ({ ...prev, paused: !prev.paused }));
        return;
      }

      if (state.paused || state.waiting) return;

      // Prevent default for game keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'c', 'C', 'x', 'X', 'z', 'Z', 'Shift'].includes(e.key)) {
        e.preventDefault();
      }

      // Hard drop with spacebar
      if (e.key === ' ' && !keysRef.current.has('hardDropped')) {
        keysRef.current.add('hardDropped');
        hardDrop();
        return;
      }

      // Soft drop - activate fast drop
      if (e.key === 'ArrowDown') {
        setState(prev => ({ ...prev, softDropActive: true }));
      }

      const now = Date.now();

      // Movement with DAS
      if (e.key === 'ArrowLeft') {
        if (!keysRef.current.has('leftHeld')) {
          keysRef.current.add('leftHeld');
          moveDelayRef.current.left = now;
          movePiece(-1, 0);
        } else if (now - moveDelayRef.current.left > DAS_REPEAT) {
          moveDelayRef.current.left = now;
          movePiece(-1, 0);
        }
      }
      if (e.key === 'ArrowRight') {
        if (!keysRef.current.has('rightHeld')) {
          keysRef.current.add('rightHeld');
          moveDelayRef.current.right = now;
          movePiece(1, 0);
        } else if (now - moveDelayRef.current.right > DAS_REPEAT) {
          moveDelayRef.current.right = now;
          movePiece(1, 0);
        }
      }

      // Rotate
      if ((e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X') && !keysRef.current.has('rotated')) {
        keysRef.current.add('rotated');
        handleRotate(1);
      }
      if ((e.key === 'z' || e.key === 'Z' || e.key === 'Shift') && !keysRef.current.has('rotatedCCW')) {
        keysRef.current.add('rotatedCCW');
        handleRotate(-1);
      }

      // Hold
      if ((e.key === 'c' || e.key === 'C') && !keysRef.current.has('held')) {
        keysRef.current.add('held');
        holdPiece();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      keysRef.current.delete('rotated');
      keysRef.current.delete('rotatedCCW');
      keysRef.current.delete('held');
      keysRef.current.delete('hardDropped');
      keysRef.current.delete('leftHeld');
      keysRef.current.delete('rightHeld');

      // Deactivate soft drop when down arrow released
      if (e.key === 'ArrowDown') {
        setState(prev => ({ ...prev, softDropActive: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.gameOver, state.paused, state.waiting, movePiece, handleRotate, holdPiece, hardDrop, synthPowerUp, isMuted]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let renderAnimationId: number;

    const render = (timestamp: number) => {
      // Limit rendering to 60fps
      if (timestamp - lastRenderTimeRef.current < 16) {
        renderAnimationId = requestAnimationFrame(render);
        return;
      }
      lastRenderTimeRef.current = timestamp;

      // Update particles at 60fps (visual only, not in state)
      particlesRef.current = particlesRef.current
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3,
          opacity: p.opacity * 0.95,
          life: p.life * 0.95
        }))
        .filter(p => p.life > 0.1);

      // Clear canvas
      ctx.fillStyle = '#001100';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bullet time effect
      if (state.bulletTimeActive) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw grid background
      ctx.strokeStyle = '#003300';
      ctx.lineWidth = 1;
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
      }
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
      }

      // Draw locked blocks
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const block = state.grid[y][x];
          if (block.filled) {
            const blockX = x * BLOCK_SIZE;
            const blockY = y * BLOCK_SIZE;

            // Block fill
            ctx.fillStyle = block.color;
            ctx.fillRect(blockX + 2, blockY + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);

            // Glow effect
            if (block.glow && block.glow > 0) {
              ctx.shadowBlur = 20;
              ctx.shadowColor = block.color;
              ctx.fillStyle = block.color;
              ctx.fillRect(blockX + 2, blockY + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
              ctx.shadowBlur = 0;

              // Decay glow
              state.grid[y][x].glow = Math.max(0, block.glow - 0.02);
            }

            // Character
            ctx.fillStyle = '#000000';
            ctx.font = `${BLOCK_SIZE * 0.6}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(block.char, blockX + BLOCK_SIZE / 2, blockY + BLOCK_SIZE / 2);
          }
        }
      }

      // Draw ghost piece
      if (state.currentPiece) {
        const ghostY = getGhostPosition(state.currentPiece, state.grid);
        const template = TETROMINOES[state.currentPiece.type];

        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;

        for (let y = 0; y < state.currentPiece.shape.length; y++) {
          for (let x = 0; x < state.currentPiece.shape[y].length; x++) {
            if (state.currentPiece.shape[y][x]) {
              const blockX = (state.currentPiece.x + x) * BLOCK_SIZE;
              const blockY = (ghostY + y) * BLOCK_SIZE;
              ctx.strokeRect(blockX + 2, blockY + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
            }
          }
        }
      }

      // Draw current piece
      if (state.currentPiece) {
        const template = TETROMINOES[state.currentPiece.type];

        for (let y = 0; y < state.currentPiece.shape.length; y++) {
          for (let x = 0; x < state.currentPiece.shape[y].length; x++) {
            if (state.currentPiece.shape[y][x]) {
              const blockX = (state.currentPiece.x + x) * BLOCK_SIZE;
              const blockY = (state.currentPiece.y + y) * BLOCK_SIZE;

              // Block fill
              ctx.fillStyle = template.color;
              ctx.fillRect(blockX + 2, blockY + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);

              // Glow
              ctx.shadowBlur = 15;
              ctx.shadowColor = template.color;
              ctx.fillRect(blockX + 2, blockY + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
              ctx.shadowBlur = 0;

              // Character
              ctx.fillStyle = '#000000';
              ctx.font = `${BLOCK_SIZE * 0.6}px monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(template.char, blockX + BLOCK_SIZE / 2, blockY + BLOCK_SIZE / 2);
            }
          }
        }
      }

      // Draw particles from ref (updated at 60fps above)
      particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, p.x, p.y);
      });
      ctx.globalAlpha = 1;

      renderAnimationId = requestAnimationFrame(render);
    };

    renderAnimationId = requestAnimationFrame(render);

    return () => {
      if (renderAnimationId) {
        cancelAnimationFrame(renderAnimationId);
      }
    };
  }, [state.grid, state.currentPiece, state.bulletTimeActive, getGhostPosition]);

  // Restart game
  const restart = () => {
    const highScore = Math.max(state.highScore, state.score);
    localStorage.setItem('metris_highScore', highScore.toString());

    // Reset timing refs
    lastDropTimeRef.current = 0;
    dropIntervalRef.current = INITIAL_DROP_SPEED;

    // Reset session tracking refs
    pieceBagRef.current = [];
    sessionStartTimeRef.current = Date.now();
    totalLinesRef.current = 0;
    tSpinsRef.current = 0;
    lockDelayRef.current = 0;
    lockDelayResets.current = 0;
    lastGroundedTime.current = 0;
    isGroundedRef.current = false;

    // Clear particles
    particlesRef.current = [];

    setState({
      grid: createEmptyGrid(),
      currentPiece: createPiece(),
      nextPiece: createPiece(),
      holdPiece: null,
      canHold: true,
      score: 0,
      level: 1,
      lines: 0,
      combo: 0,
      gameOver: false,
      paused: false,
      highScore,
      bulletTimeMeter: 0,
      bulletTimeActive: false,
      bulletTimeTimer: 0,
      tSpins: 0,
      waiting: true,
      softDropActive: false
    });

    if (!isMuted) synthPowerUp('activate');
  };

  // Render piece preview
  const renderPreview = (piece: Piece | null, size: number = 60) => {
    if (!piece) return null;

    const template = TETROMINOES[piece.type];
    const previewSize = size / 4;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        {piece.shape.map((row, y) =>
          row.map((cell, x) => {
            if (!cell) return null;
            return (
              <div
                key={`${y}-${x}`}
                className="absolute"
                style={{
                  left: x * previewSize,
                  top: y * previewSize,
                  width: previewSize - 2,
                  height: previewSize - 2,
                  backgroundColor: template.color,
                  border: `1px solid ${template.color}`,
                  boxShadow: `0 0 10px ${template.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: previewSize * 0.6,
                  fontWeight: 'bold',
                  color: '#000'
                }}
              >
                {template.char}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black p-4">
      {/* Matrix rain background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute text-green-500 animate-matrix-rain"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 3}s`,
              fontSize: '14px'
            }}
          >
            {MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]}
          </div>
        ))}
      </div>

      <div className="relative flex gap-6 items-start">
        {/* Left panel - Stats */}
        <div className="flex flex-col gap-4">
          {/* Hold piece */}
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-3">
            <div className="text-green-400 text-sm font-mono mb-2 flex items-center gap-2">
              <Square className="w-4 h-4" />
              HOLD (C)
            </div>
            <div className="flex items-center justify-center h-16">
              {renderPreview(state.holdPiece)}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-3 space-y-2">
            <div className="text-green-400 font-mono text-sm">
              <div className="flex justify-between">
                <span>SCORE:</span>
                <span className="text-green-300">{state.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>LEVEL:</span>
                <span className="text-green-300">{state.level}</span>
              </div>
              <div className="flex justify-between">
                <span>LINES:</span>
                <span className="text-green-300">{state.lines}</span>
              </div>
              {state.combo > 0 && (
                <div className="flex justify-between text-yellow-400 animate-pulse">
                  <span>COMBO:</span>
                  <span>{state.combo}x</span>
                </div>
              )}
            </div>
          </div>

          {/* Bullet time meter */}
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-3">
            <div className="text-green-400 text-sm font-mono mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              BULLET TIME (B)
            </div>
            <div className="relative h-20 bg-gray-800 border border-green-700 rounded">
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-300 transition-all duration-300"
                style={{ height: `${state.bulletTimeMeter}%` }}
              />
              {state.bulletTimeActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            {state.bulletTimeActive && (
              <div className="text-center text-green-400 text-xs mt-1">
                {(state.bulletTimeTimer / 1000).toFixed(1)}s
              </div>
            )}
          </div>

          {/* High score */}
          <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-3">
            <div className="text-yellow-400 font-mono text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <div>
                <div>HIGH SCORE</div>
                <div className="text-lg">{state.highScore.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={COLS * BLOCK_SIZE}
            height={ROWS * BLOCK_SIZE}
            className="border-4 border-green-500 rounded-lg shadow-[0_0_30px_rgba(0,255,0,0.5)]"
            style={{
              imageRendering: 'crisp-edges',
              filter: state.bulletTimeActive ? 'hue-rotate(30deg) brightness(1.2)' : 'none'
            }}
          />

          {/* Waiting to start overlay */}
          {state.waiting && !state.gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <Play className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
                <div className="text-2xl font-mono text-green-500 mb-4">METRIS</div>
                <div className="text-lg text-green-400 animate-pulse">Press ENTER to start</div>
                <div className="text-sm text-green-500/70 mt-4">SPACE = Hard Drop | ↓ = Soft Drop | ← → = Move | ↑ = Rotate</div>
              </div>
            </div>
          )}

          {/* Paused overlay */}
          {state.paused && !state.gameOver && !state.waiting && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <Pause className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <div className="text-2xl font-mono text-green-500">PAUSED</div>
                <div className="text-sm text-green-400 mt-2">Press P or ESC to resume</div>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {state.gameOver && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center backdrop-blur-sm border-4 border-red-500 rounded-lg">
              <div className="text-center p-6">
                <div className="text-3xl font-mono text-red-500 mb-4 animate-pulse">GAME OVER</div>
                <div className="text-xl text-green-400 mb-2">Score: {state.score.toLocaleString()}</div>
                <div className="text-sm text-green-500 mb-4">Level: {state.level} | Lines: {state.lines}</div>
                {state.score === state.highScore && state.score > 0 && (
                  <div className="text-yellow-400 mb-4 flex items-center gap-2 justify-center">
                    <Trophy className="w-5 h-5" />
                    NEW HIGH SCORE!
                  </div>
                )}
                <button
                  onClick={restart}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-black font-mono rounded-lg flex items-center gap-2 mx-auto transition-colors"
                >
                  <RotateCw className="w-5 h-5" />
                  RESTART
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Next piece */}
        <div className="flex flex-col gap-4">
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-3">
            <div className="text-green-400 text-sm font-mono mb-2">NEXT</div>
            <div className="flex items-center justify-center h-16">
              {renderPreview(state.nextPiece)}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-3">
            <div className="text-green-400 text-xs font-mono space-y-1">
              <div className="font-bold mb-2">CONTROLS</div>
              <div>← → Move</div>
              <div>↑ X Rotate</div>
              <div>Z Rotate CCW</div>
              <div>C Hold</div>
              <div>P Pause</div>
              <div className="text-green-300 text-[10px] mt-2">* Blocks fall automatically</div>
              <div className="text-yellow-300 text-[10px]">* Bullet Time: Auto</div>
            </div>
          </div>

          {/* Pause button */}
          <button
            onClick={() => {
              // Reset timer when unpausing to prevent instant drop
              if (state.paused) {
                lastDropTimeRef.current = performance.now();
              }
              setState(prev => ({ ...prev, paused: !prev.paused }));
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-black font-mono rounded-lg flex items-center gap-2 transition-colors"
          >
            {state.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {state.paused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>
    </div>
  );
}
