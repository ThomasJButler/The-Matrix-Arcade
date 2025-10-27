import React, { useEffect, useRef, useMemo } from 'react';
import { useSimpleSnakeGame } from '../../hooks/useSimpleSnakeGame';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import { Trophy, Zap, Play, RotateCcw } from 'lucide-react';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface SimpleSnakeProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface SnakeCanvasProps {
  snake: Position[];
  food: Position;
  gridSize: number;
  gameState: string;
  foodEaten: number;
  powerUp?: any; // PowerUp type from the hook
  activePowerUps: any; // ActivePowerUps type from the hook
  direction: string;
}

const SnakeCanvas: React.FC<SnakeCanvasProps> = ({
  snake,
  food,
  gridSize,
  gameState,
  foodEaten,
  powerUp,
  activePowerUps,
  direction
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matrixChars = useRef<{ [key: string]: string }>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellSize = canvas.width / gridSize;

    // Draw faint grid
    ctx.strokeStyle = '#00ff0010';
    ctx.lineWidth = 0.5;
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

    // Set font for Matrix-style text
    const fontSize = cellSize * 0.7;
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Check if ghost mode is active for transparency
    const isGhostActive = activePowerUps.ghost && activePowerUps.ghost > Date.now();

    // Draw snake with 1s and 0s (and special head/tail)
    snake.forEach((segment, index) => {
      const key = `${segment.x}_${segment.y}`;
      const isHead = index === 0;
      const isTail = index === snake.length - 1 && snake.length > 1;
      const showHeadTail = foodEaten >= 3;

      // Assign a random character if not already assigned (for consistency)
      if (!matrixChars.current[key]) {
        matrixChars.current[key] = Math.random() > 0.5 ? '1' : '0';
      }

      // Draw background glow for snake segment
      const gradient = ctx.createRadialGradient(
        segment.x * cellSize + cellSize / 2,
        segment.y * cellSize + cellSize / 2,
        0,
        segment.x * cellSize + cellSize / 2,
        segment.y * cellSize + cellSize / 2,
        cellSize
      );

      // Apply ghost mode transparency
      ctx.globalAlpha = isGhostActive ? 0.5 : 1.0;

      if (isHead) {
        // Head is brighter
        const glowColor = isGhostActive ? '#00ffff40' : '#00ff0040';
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize);

        ctx.fillStyle = isGhostActive ? '#00ffff' : '#00ff00';
        ctx.shadowColor = isGhostActive ? '#00ffff' : '#00ff00';
        ctx.shadowBlur = isGhostActive ? 15 : 10;

        // Draw head character
        let headChar = matrixChars.current[key];
        if (showHeadTail) {
          switch (direction) {
            case 'up': headChar = '▲'; break;
            case 'down': headChar = '▼'; break;
            case 'left': headChar = '◄'; break;
            case 'right': headChar = '►'; break;
          }
        }
        ctx.fillText(headChar, segment.x * cellSize + cellSize / 2, segment.y * cellSize + cellSize / 2);
      } else if (isTail && showHeadTail) {
        // Tail is dimmer
        gradient.addColorStop(0, '#00880020');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize);

        ctx.fillStyle = '#008800';
        ctx.shadowColor = '#008800';
        ctx.shadowBlur = 2;
        ctx.globalAlpha = isGhostActive ? 0.3 : 0.5;

        // Draw tail character
        ctx.fillText('○', segment.x * cellSize + cellSize / 2, segment.y * cellSize + cellSize / 2);
      } else {
        // Body segments
        gradient.addColorStop(0, isGhostActive ? '#00cccc20' : '#00cc0030');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize);

        ctx.fillStyle = isGhostActive ? '#00cccc' : '#00cc00';
        ctx.shadowColor = isGhostActive ? '#00cccc' : '#00cc00';
        ctx.shadowBlur = 5;

        // Draw the 1 or 0 character
        ctx.fillText(
          matrixChars.current[key],
          segment.x * cellSize + cellSize / 2,
          segment.y * cellSize + cellSize / 2
        );
      }
    });

    // Reset global alpha
    ctx.globalAlpha = 1.0;

    // Clean up keys that are no longer part of the snake
    const snakeKeys = snake.map(s => `${s.x}_${s.y}`);
    Object.keys(matrixChars.current).forEach(key => {
      if (!snakeKeys.includes(key) && key !== `${food.x}_${food.y}`) {
        delete matrixChars.current[key];
      }
    });

    // Draw food as a glowing red 1
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;

    // Draw background glow for food
    const foodGradient = ctx.createRadialGradient(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      0,
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize
    );
    foodGradient.addColorStop(0, '#ff000040');
    foodGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = foodGradient;
    ctx.fillRect(food.x * cellSize, food.y * cellSize, cellSize, cellSize);

    // Draw the food character (always 1)
    ctx.fillStyle = '#ff0000';
    ctx.fillText(
      '1',
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2
    );

    // Draw power-up if present
    if (powerUp) {
      let powerUpChar = '';
      let powerUpColor = '';
      let glowColor = '';

      switch (powerUp.type) {
        case 'speed':
          powerUpChar = '⚡';
          powerUpColor = '#ffff00';
          glowColor = '#ffff0080';
          break;
        case 'double':
          powerUpChar = 'XP+';
          powerUpColor = '#0099ff';
          glowColor = '#0099ff80';
          break;
        case 'shield':
          powerUpChar = '🛡️';
          powerUpColor = '#ff00ff';
          glowColor = '#ff00ff80';
          break;
        case 'ghost':
          powerUpChar = '👻';
          powerUpColor = '#00ffff';
          glowColor = '#00ffff80';
          break;
      }

      // Draw power-up glow
      const powerUpGradient = ctx.createRadialGradient(
        powerUp.position.x * cellSize + cellSize / 2,
        powerUp.position.y * cellSize + cellSize / 2,
        0,
        powerUp.position.x * cellSize + cellSize / 2,
        powerUp.position.y * cellSize + cellSize / 2,
        cellSize * 1.5
      );
      powerUpGradient.addColorStop(0, glowColor);
      powerUpGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = powerUpGradient;
      ctx.fillRect(
        powerUp.position.x * cellSize - cellSize / 2,
        powerUp.position.y * cellSize - cellSize / 2,
        cellSize * 2,
        cellSize * 2
      );

      // Draw power-up character
      ctx.fillStyle = powerUpColor;
      ctx.shadowColor = powerUpColor;
      ctx.shadowBlur = 15;

      // Adjust font size for emoji/text
      const oldFont = ctx.font;
      if (powerUp.type === 'double') {
        ctx.font = `${fontSize * 0.6}px monospace`;
      } else if (powerUp.type === 'shield' || powerUp.type === 'ghost') {
        ctx.font = `${fontSize * 0.8}px monospace`;
      }

      ctx.fillText(
        powerUpChar,
        powerUp.position.x * cellSize + cellSize / 2,
        powerUp.position.y * cellSize + cellSize / 2
      );

      ctx.font = oldFont;
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }, [snake, food, gridSize, powerUp, activePowerUps, foodEaten, direction]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      className="w-full h-full border border-green-500 bg-black"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
};

interface SnakeMenuProps {
  gameState: string;
  score: number;
  highScore: number;
  onStart: () => void;
  onReset: () => void;
}

const SnakeMenu: React.FC<SnakeMenuProps> = ({ gameState, score, highScore, onStart, onReset }) => {
  if (gameState === 'playing') return null;

  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
      <div className="text-center p-8 border-2 border-green-500 bg-black">
        {gameState === 'menu' && (
          <>
            <h1 className="text-4xl font-bold text-green-400 mb-4">SNAKE</h1>
            <p className="text-green-500 mb-6">Press SPACE to start</p>
            <button
              onClick={onStart}
              className="px-6 py-3 bg-green-500 text-black font-bold hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              START GAME
            </button>
          </>
        )}

        {gameState === 'gameOver' && (
          <>
            <h2 className="text-3xl font-bold text-red-500 mb-4">GAME OVER</h2>
            <div className="text-green-400 mb-2">Score: {score}</div>
            <div className="text-yellow-400 mb-6">High Score: {highScore}</div>
            <button
              onClick={onReset}
              className="px-6 py-3 bg-green-500 text-black font-bold hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-5 h-5" />
              PLAY AGAIN
            </button>
          </>
        )}

        {gameState === 'paused' && (
          <>
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">PAUSED</h2>
            <p className="text-green-500">Press SPACE to continue</p>
          </>
        )}
      </div>
    </div>
  );
};

export default function SimpleSnake({ achievementManager, isMuted }: SimpleSnakeProps) {
  const { gameState, startGame, togglePause, resetGame, changeDirection, gridSize } = useSimpleSnakeGame();
  const { saveData, updateGameSave, unlockAchievement } = useSaveSystem();
  const scoreRef = useRef(0);
  const playTimeRef = useRef<number>(Date.now());
  const prevScoreRef = useRef(0);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const foodEatenRef = useRef(0);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.gameState === 'playing') {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            changeDirection('up');
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            changeDirection('down');
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            changeDirection('left');
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            changeDirection('right');
            break;
          case ' ':
            togglePause();
            break;
        }
      } else if (gameState.gameState === 'menu' && e.key === ' ') {
        startGame();
      } else if (gameState.gameState === 'paused' && e.key === ' ') {
        togglePause();
      } else if (gameState.gameState === 'gameOver' && e.key === ' ') {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.gameState, changeDirection, startGame, togglePause, resetGame]);

  // Track achievements
  useEffect(() => {
    if (achievementManager) {
      // First Apple: First food collected
      if (gameState.score > 0 && foodEatenRef.current === 0) {
        unlockAchievement('snakeClassic', 'first_apple');
        foodEatenRef.current = 1;
      }

      // Score achievements
      if (gameState.score >= 100 && scoreRef.current < 100) {
        unlockAchievement('snakeClassic', 'score_100');
        achievementManager.unlockAchievement('snake', 'snake_score_100');
      }
      if (gameState.score >= 500 && scoreRef.current < 500) {
        unlockAchievement('snakeClassic', 'score_500');
        achievementManager.unlockAchievement('snake', 'snake_score_500');
      }
      if (gameState.score >= 1000 && scoreRef.current < 1000) {
        unlockAchievement('snakeClassic', 'snake_master');
        achievementManager.unlockAchievement('snake', 'snake_master');
      }

      scoreRef.current = gameState.score;
    }
  }, [gameState.score, achievementManager, unlockAchievement]);

  // Track play time and save on game over
  useEffect(() => {
    if (gameState.gameState === 'playing') {
      playTimeRef.current = Date.now();
      sessionStartTimeRef.current = Date.now();
    } else if (gameState.gameState === 'gameOver') {
      const playTime = (Date.now() - playTimeRef.current) / 1000; // in seconds
      const sessionTime = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);

      // Save game stats
      const currentHighScore = saveData.games.snakeClassic?.highScore || 0;
      const newHighScore = Math.max(currentHighScore, gameState.score);
      const previousGamesPlayed = saveData.games.snakeClassic?.stats?.gamesPlayed || 0;
      const previousTotalScore = saveData.games.snakeClassic?.stats?.totalScore || 0;
      const previousLongestSurvival = saveData.games.snakeClassic?.stats?.longestSurvival || 0;
      const previousBestLength = saveData.games.snakeClassic?.stats?.bestLength || 0;

      setTimeout(() => {
        updateGameSave('snakeClassic', {
          highScore: newHighScore,
          level: gameState.level || 1,
          stats: {
            gamesPlayed: previousGamesPlayed + 1,
            totalScore: previousTotalScore + gameState.score,
            longestSurvival: Math.max(previousLongestSurvival, sessionTime),
            bestLength: Math.max(previousBestLength, gameState.snake.length)
          }
        });
      }, 100);

      // Achievements
      if (achievementManager) {
        // Survivor: Play for 5 minutes
        if (playTime >= 300) {
          unlockAchievement('snakeClassic', 'survivor');
          achievementManager.unlockAchievement('snake', 'snake_survivor');
        }

        // Speed Demon: Score 100+ at max speed
        if (gameState.score >= 100 && (gameState.level || 1) >= 10) {
          unlockAchievement('snakeClassic', 'speed_demon');
        }
      }
    }
  }, [gameState.gameState, gameState.score, gameState.level, gameState.snake, achievementManager, saveData, updateGameSave, unlockAchievement]);

  // Simple sound effects (only if not muted)
  useEffect(() => {
    if (isMuted) return;

    if (gameState.score > prevScoreRef.current && gameState.score > 0) {
      // Food eaten sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        gainNode.gain.value = 0.1;
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (e) {
        // Ignore audio errors
      }
    }
    prevScoreRef.current = gameState.score;
  }, [gameState.score, isMuted]);

  // Game over sound
  useEffect(() => {
    if (gameState.gameState === 'gameOver' && !isMuted) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        gainNode.gain.value = 0.15;
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        // Ignore audio errors
      }
    }
  }, [gameState.gameState, isMuted]);

  return (
    <div className="w-full h-full bg-black flex flex-col font-mono relative">
      {/* Header */}
      <div className="bg-black border-b border-green-500 p-2 sm:p-4 pr-16 sm:pr-24">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="text-green-400 text-lg sm:text-2xl font-bold">SNAKE</div>
            <div className="text-green-500 text-xs sm:text-sm">[MATRIX EDITION]</div>
          </div>

          {/* Score Display */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Current Score */}
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <div>
                <div className="text-green-500 text-xs">SCORE</div>
                <div className="text-green-400 text-lg sm:text-2xl font-bold tabular-nums">
                  {gameState.score.toString().padStart(5, '0')}
                </div>
              </div>
            </div>

            {/* High Score */}
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <div>
                <div className="text-yellow-500 text-xs">HIGH</div>
                <div className="text-yellow-400 text-lg sm:text-2xl font-bold tabular-nums">
                  {gameState.highScore.toString().padStart(5, '0')}
                </div>
              </div>
            </div>

            {/* Active Power-ups Indicators */}
            {gameState.gameState === 'playing' && (
              <div className="flex items-center gap-2 sm:gap-3 border-l border-green-500/30 pl-4">
                {gameState.activePowerUps.speed && gameState.activePowerUps.speed > Date.now() && (
                  <div className="flex items-center gap-1 text-yellow-400 animate-pulse">
                    <Zap className="w-3 h-3" />
                    <span className="text-xs hidden sm:inline">SLOW</span>
                  </div>
                )}
                {gameState.activePowerUps.double && gameState.activePowerUps.double > 0 && (
                  <div className="flex items-center gap-1 text-blue-400 animate-pulse">
                    <span className="text-xs">2X</span>
                    <span className="text-xs">×{gameState.activePowerUps.double}</span>
                  </div>
                )}
                {gameState.activePowerUps.shield && (
                  <div className="flex items-center gap-1 text-purple-400 animate-pulse">
                    <span className="text-sm">🛡</span>
                    <span className="text-xs hidden sm:inline">SHIELD</span>
                  </div>
                )}
                {gameState.activePowerUps.ghost && gameState.activePowerUps.ghost > Date.now() && (
                  <div className="flex items-center gap-1 text-cyan-400 animate-pulse">
                    <span className="text-sm">👻</span>
                    <span className="text-xs hidden sm:inline">GHOST</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Speed Indicator */}
        {gameState.gameState === 'playing' && (
          <div className="max-w-6xl mx-auto mt-2">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xs">SPEED</span>
              <div className="flex-1 bg-green-900/30 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                  style={{
                    width: `${Math.max(20, 100 - ((gameState.speed - 50) / 100) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full h-full max-w-[600px] max-h-[600px] relative">
          <SnakeCanvas
            snake={gameState.snake}
            food={gameState.food}
            gridSize={gridSize}
            gameState={gameState.gameState}
            foodEaten={gameState.foodEaten}
            powerUp={gameState.powerUp}
            activePowerUps={gameState.activePowerUps}
            direction={gameState.direction}
          />

          {/* Menu Overlay */}
          <SnakeMenu
            gameState={gameState.gameState}
            score={gameState.score}
            highScore={gameState.highScore}
            onStart={startGame}
            onReset={resetGame}
          />
        </div>
      </div>

      {/* Controls Help (bottom) */}
      {gameState.gameState === 'playing' && (
        <div className="bg-black border-t border-green-500/30 p-2">
          <div className="flex items-center justify-center gap-4 text-xs text-green-400/60">
            <span>↑↓←→ or WASD to move</span>
            <span>•</span>
            <span>SPACE to pause</span>
          </div>
        </div>
      )}
    </div>
  );
}