import React, { useEffect, useCallback, useRef } from 'react';
import { useSnakeGame, Direction } from '../../hooks/useSnakeGame';
import { useParticleSystem } from '../../hooks/useParticleSystem';
import { useInterval } from '../../hooks/useInterval';
import SnakeRenderer from './SnakeRenderer';
import SnakeHUD from './SnakeHUD';
import { Gamepad2, Volume2, VolumeX } from 'lucide-react';

const GRID_SIZE = 30;
const CELL_SIZE = 20;

export default function SnakeClassicRefactored() {
  const {
    gameState,
    moveSnake,
    changeDirection,
    startGame,
    togglePause,
    getSpeed
  } = useSnakeGame();

  const particleSystem = useParticleSystem();
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [screenShake, setScreenShake] = React.useState(0);
  const audioContext = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize audio
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
  const playSound = useCallback((type: 'eat' | 'powerup' | 'collision' | 'levelup') => {
    if (!soundEnabled || !audioContext.current) return;

    try {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      const filter = audioContext.current.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      switch (type) {
        case 'eat':
          oscillator.frequency.value = 440;
          oscillator.type = 'square';
          gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
          break;
        case 'powerup':
          oscillator.frequency.value = 880;
          oscillator.type = 'sine';
          filter.type = 'lowpass';
          filter.frequency.value = 2000;
          gainNode.gain.setValueAtTime(0.2, audioContext.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.5);
          break;
        case 'collision':
          oscillator.frequency.value = 110;
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.3);
          setScreenShake(10);
          break;
        case 'levelup':
          oscillator.frequency.setValueAtTime(440, audioContext.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.current.currentTime + 0.2);
          oscillator.type = 'triangle';
          gainNode.gain.setValueAtTime(0.2, audioContext.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.3);
          break;
      }

      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.5);
    } catch {
      console.warn('Sound playback failed');
    }
  }, [soundEnabled]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.gameState === 'menu') return;

      const key = e.key.toLowerCase();
      
      // Movement controls
      const directions: Record<string, Direction> = {
        'arrowup': { x: 0, y: -1 },
        'arrowdown': { x: 0, y: 1 },
        'arrowleft': { x: -1, y: 0 },
        'arrowright': { x: 1, y: 0 },
        'w': { x: 0, y: -1 },
        's': { x: 0, y: 1 },
        'a': { x: -1, y: 0 },
        'd': { x: 1, y: 0 }
      };

      if (directions[key]) {
        e.preventDefault();
        changeDirection(directions[key]);
      }

      // Game controls
      if (key === ' ' || key === 'p') {
        e.preventDefault();
        togglePause();
      }

      if (key === 'enter' && gameState.gameState === 'game_over') {
        startGame(gameState.gameMode);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, changeDirection, togglePause, startGame]);

  // Game loop
  useInterval(
    () => {
      moveSnake();
    },
    gameState.gameState === 'playing' ? getSpeed() : null
  );

  // Handle collisions and effects
  const handleFoodCollected = useCallback((x: number, y: number, color: string) => {
    particleSystem.collectFood(x, y, color);
    playSound('eat');
  }, [particleSystem, playSound]);

  const handlePowerUpCollected = useCallback((x: number, y: number) => {
    particleSystem.activatePowerUp(x, y, '#FFD700');
    playSound('powerup');
  }, [particleSystem, playSound]);

  const handleCollision = useCallback((x: number, y: number) => {
    particleSystem.explode(x, y);
    playSound('collision');
  }, [particleSystem, playSound]);

  // Update screen shake
  useEffect(() => {
    if (screenShake > 0) {
      const timer = setTimeout(() => setScreenShake(s => Math.max(0, s - 1)), 50);
      return () => clearTimeout(timer);
    }
  }, [screenShake]);

  // Update stats timer
  useEffect(() => {
    if (gameState.gameState === 'playing') {
      const timer = setInterval(() => {
        // This would normally update play time in the game state
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState.gameState]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="matrix-rain" />
      </div>

      {/* Game Container */}
      <div 
        ref={containerRef}
        className="relative flex flex-col items-center justify-center h-full p-4 gap-4"
        style={{
          transform: screenShake > 0 
            ? `translate(${(Math.random() - 0.5) * screenShake}px, ${(Math.random() - 0.5) * screenShake}px)`
            : 'none'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-[800px]">
          <div className="flex items-center gap-2 text-green-500">
            <Gamepad2 className="w-6 h-6" />
            <h1 className="text-2xl font-bold font-mono">SNAKE CLASSIC</h1>
            <span className="text-xs text-green-400">ENHANCED EDITION</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 hover:bg-green-900/50 rounded transition-colors text-green-500"
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Main Game Area */}
        <div className="flex gap-6 items-start">
          {/* Game Canvas */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-transparent rounded-lg" />
            <div className="relative border-2 border-green-500 rounded-lg overflow-hidden shadow-2xl shadow-green-500/20">
              <SnakeRenderer
                snake={gameState.snake}
                food={gameState.food}
                obstacles={gameState.obstacles}
                powerUps={gameState.powerUps}
                activePowerUp={gameState.activePowerUp}
                gameState={gameState.gameState}
                gridSize={GRID_SIZE}
                cellSize={CELL_SIZE}
                level={gameState.level}
                combo={gameState.combo}
                onFoodCollected={handleFoodCollected}
                onPowerUpCollected={handlePowerUpCollected}
                onCollision={handleCollision}
              />
            </div>
          </div>

          {/* HUD */}
          <div className="w-80">
            <SnakeHUD
              score={gameState.score}
              highScore={gameState.highScore}
              level={gameState.level}
              lives={gameState.lives}
              combo={gameState.combo}
              gameState={gameState.gameState}
              gameMode={gameState.gameMode}
              activePowerUp={gameState.activePowerUp}
              powerUpTimer={gameState.powerUpTimer}
              stats={gameState.stats}
              onStartGame={startGame}
              onTogglePause={togglePause}
            />
          </div>
        </div>

        {/* Controls Info */}
        <div className="text-xs text-green-400 text-center space-y-1">
          <p>Use ARROW KEYS or WASD to move • SPACE to pause • ENTER to restart</p>
          <p className="text-green-500">
            Collect power-ups for special abilities • Chain food for combo multiplier
          </p>
        </div>
      </div>

      {/* CSS for Matrix Rain effect */}
      <style jsx>{`
        .matrix-rain {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.03) 2px,
              rgba(0, 255, 0, 0.03) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.03) 2px,
              rgba(0, 255, 0, 0.03) 4px
            );
          animation: matrix-move 20s linear infinite;
        }

        @keyframes matrix-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
      `}</style>
    </div>
  );
}