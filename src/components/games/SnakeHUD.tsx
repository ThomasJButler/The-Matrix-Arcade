import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Star, Clock, Heart, Trophy, 
  Target, Gauge, TrendingUp, Award,
  Eye, Timer, Users, Laptop, Radio
} from 'lucide-react';
import { PowerUpType, GameMode, GameState } from '../../hooks/useSnakeGame';

interface SnakeHUDProps {
  score: number;
  highScore: number;
  level: number;
  lives: number;
  combo: number;
  gameState: GameState;
  gameMode: GameMode;
  activePowerUp: PowerUpType;
  powerUpTimer: number;
  stats: {
    foodEaten: number;
    powerUpsCollected: number;
    obstaclesDestroyed: number;
    timePlayed: number;
  };
  onStartGame: (mode: GameMode) => void;
}

const POWER_UP_INFO: Record<NonNullable<PowerUpType>, { icon: React.ReactNode; name: string; color: string }> = {
  speed: { icon: <Zap className="w-4 h-4" />, name: 'Speed Boost', color: '#FF6B6B' },
  ghost: { icon: <Shield className="w-4 h-4" />, name: 'Ghost Mode', color: '#A8DADC' },
  multiplier: { icon: <Star className="w-4 h-4" />, name: '3x Score', color: '#FFD93D' },
  slow: { icon: <Clock className="w-4 h-4" />, name: 'Slow Time', color: '#6BCF7F' },
  matrix_vision: { icon: <Eye className="w-4 h-4" />, name: 'Matrix Vision', color: '#00FF00' },
  bullet_time: { icon: <Timer className="w-4 h-4" />, name: 'Bullet Time', color: '#FF00FF' },
  digital_clone: { icon: <Users className="w-4 h-4" />, name: 'Digital Clone', color: '#00FFFF' },
  hack_mode: { icon: <Laptop className="w-4 h-4" />, name: 'Hack Mode', color: '#FF8800' },
  data_stream: { icon: <Radio className="w-4 h-4" />, name: 'Data Stream', color: '#8B00FF' }
};

const GAME_MODE_INFO = {
  classic: { name: 'Classic', description: 'Traditional snake with wraparound walls' },
  survival: { name: 'Survival', description: 'No walls, limited lives, increasing difficulty' },
  time_attack: { name: 'Time Attack', description: 'Score as much as possible in 2 minutes' },
  boss_battle: { name: 'Boss Battle', description: 'Face off against giant snake bosses' }
};

export default function SnakeHUD({
  score,
  highScore,
  level,
  lives,
  combo,
  gameState,
  gameMode,
  activePowerUp,
  powerUpTimer,
  stats,
  onStartGame
}: SnakeHUDProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 text-green-500 font-mono">
      {/* Top Stats Bar */}
      <div className="flex justify-between items-start gap-4 p-4 bg-black/50 border border-green-500/30 rounded-lg backdrop-blur-sm">
        <div className="flex flex-col">
          <div className="text-xs text-green-400 mb-1">SCORE</div>
          <motion.div 
            className="text-2xl font-bold"
            key={score}
            initial={{ scale: 1.2, color: '#FFD700' }}
            animate={{ scale: 1, color: '#00FF00' }}
            transition={{ duration: 0.3 }}
          >
            {score.toLocaleString()}
          </motion.div>
          {combo > 1 && (
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {combo.toFixed(1)}x Combo
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div className="text-xs text-green-400 mb-1">HIGH SCORE</div>
          <div className="text-xl flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            {highScore.toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-xs text-green-400 mb-1">LEVEL</div>
          <div className="text-xl font-bold">{level}</div>
          <div className="w-20 h-1 bg-green-900 rounded-full overflow-hidden mt-1">
            <motion.div 
              className="h-full bg-green-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(score % 500) / 5}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-xs text-green-400 mb-1">LIVES</div>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart 
                key={i} 
                className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Power-up Display */}
      <AnimatePresence>
        {activePowerUp && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3 bg-black/50 border rounded-lg backdrop-blur-sm"
            style={{ borderColor: POWER_UP_INFO[activePowerUp].color }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {POWER_UP_INFO[activePowerUp].icon}
                <span className="font-bold">{POWER_UP_INFO[activePowerUp].name}</span>
              </div>
              <div className="relative w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0"
                  style={{ backgroundColor: POWER_UP_INFO[activePowerUp].color }}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: powerUpTimer / 1000, ease: 'linear' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game State Overlays */}
      <AnimatePresence>
        {gameState === 'menu' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/90 z-50"
          >
            <div className="flex flex-col items-center gap-6 p-8 bg-black border-2 border-green-500 rounded-lg">
              <h1 className="text-4xl font-bold text-green-500 mb-4">SNAKE CLASSIC</h1>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(GAME_MODE_INFO).map(([mode, info]) => (
                  <button
                    key={mode}
                    onClick={() => onStartGame(mode as GameMode)}
                    className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg hover:bg-green-900/40 transition-colors"
                  >
                    <h3 className="text-lg font-bold mb-1">{info.name}</h3>
                    <p className="text-xs text-green-400">{info.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'paused' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-40"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">PAUSED</h2>
              <p className="text-green-400">Press SPACE to continue</p>
            </div>
          </motion.div>
        )}

        {gameState === 'game_over' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/90 z-50"
          >
            <div className="text-center p-8 bg-black border-2 border-red-500 rounded-lg">
              <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
              <div className="grid grid-cols-2 gap-4 mb-6 text-left">
                <div>
                  <p className="text-sm text-green-400">Final Score</p>
                  <p className="text-2xl font-bold">{score.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-green-400">Level Reached</p>
                  <p className="text-2xl font-bold">{level}</p>
                </div>
                <div>
                  <p className="text-sm text-green-400">Food Eaten</p>
                  <p className="text-xl">{stats.foodEaten}</p>
                </div>
                <div>
                  <p className="text-sm text-green-400">Power-ups</p>
                  <p className="text-xl">{stats.powerUpsCollected}</p>
                </div>
              </div>
              {score > highScore && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="mb-4 text-yellow-400 flex items-center justify-center gap-2"
                >
                  <Award className="w-6 h-6" />
                  <span className="text-xl font-bold">NEW HIGH SCORE!</span>
                </motion.div>
              )}
              <button
                onClick={() => onStartGame(gameMode)}
                className="px-6 py-3 bg-green-500 text-black font-bold rounded hover:bg-green-400 transition-colors"
              >
                PLAY AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Stats */}
      <div className="flex justify-between text-xs text-green-400 px-2">
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          Food: {stats.foodEaten}
        </div>
        <div className="flex items-center gap-1">
          <Gauge className="w-3 h-3" />
          Mode: {GAME_MODE_INFO[gameMode].name}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(Math.floor(stats.timePlayed))}
        </div>
      </div>
    </div>
  );
}