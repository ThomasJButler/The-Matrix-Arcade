import React, { useEffect, useRef } from 'react';
import { useSimpleSnakeGame } from '../../hooks/useSimpleSnakeGame';
import SnakeCanvas from './SnakeCanvas';
import SnakeMenu from './SnakeMenu';
import { Trophy, Zap } from 'lucide-react';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface SimpleSnakeProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
}

export default function SimpleSnake({ achievementManager, isMuted }: SimpleSnakeProps) {
  const { gameState, startGame, togglePause, resetGame, changeDirection, gridSize } = useSimpleSnakeGame();
  const scoreRef = useRef(0);
  const playTimeRef = useRef<number>(Date.now());
  const prevScoreRef = useRef(0);

  // Track achievements
  useEffect(() => {
    if (achievementManager) {
      // Score achievements
      if (gameState.score >= 100 && scoreRef.current < 100) {
        achievementManager.unlockAchievement('snake', 'snake_score_100');
      }
      if (gameState.score >= 500 && scoreRef.current < 500) {
        achievementManager.unlockAchievement('snake', 'snake_score_500');
      }
      if (gameState.score >= 1000 && scoreRef.current < 1000) {
        achievementManager.unlockAchievement('snake', 'snake_master');
      }

      scoreRef.current = gameState.score;
    }
  }, [gameState.score, achievementManager]);

  // Track play time for achievements
  useEffect(() => {
    if (gameState.gameState === 'playing') {
      playTimeRef.current = Date.now();
    } else if (gameState.gameState === 'gameOver' && achievementManager) {
      const playTime = (Date.now() - playTimeRef.current) / 1000; // in seconds
      if (playTime >= 300) {
        // 5 minutes
        achievementManager.unlockAchievement('snake', 'snake_survivor');
      }
    }
  }, [gameState.gameState, achievementManager]);

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
      <div className="bg-black border-b border-green-500 p-2 sm:p-4">
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