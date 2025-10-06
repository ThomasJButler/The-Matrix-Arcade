import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Star, Brain, Heart, Eye, EyeOff } from 'lucide-react';
import { useGameState } from '../../contexts/GameStateContext';

// ============================================================================
// STATS HUD COMPONENT
// Displays player stats overlay in top-right corner
// ============================================================================

interface StatDisplayProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  maxValue: number;
  color: string;
  unit?: string;
  showDelta?: boolean;
  previousValue?: number;
}

const StatDisplay: React.FC<StatDisplayProps> = ({
  icon,
  label,
  value,
  maxValue,
  color,
  unit = '',
  showDelta = false,
  previousValue = 0
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const delta = value - previousValue;

  // Determine color intensity based on value
  const getColor = () => {
    if (label === 'Coffee') {
      if (value <= 100) return 'text-green-400';
      if (value <= 150) return 'text-yellow-400';
      return 'text-red-400 animate-pulse';
    }
    if (percentage < 30) return 'text-red-400';
    if (percentage < 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getBarColor = () => {
    if (label === 'Coffee') {
      if (value <= 100) return 'bg-green-500';
      if (value <= 150) return 'bg-yellow-500';
      return 'bg-red-500';
    }
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <motion.div
      className="bg-black/80 border border-green-500/50 rounded-lg p-2 backdrop-blur-sm"
      initial={{ scale: 1 }}
      animate={showDelta && delta !== 0 ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className={`${getColor()} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-green-400 font-mono uppercase tracking-wide truncate">
            {label}
          </div>
          <div className={`text-sm font-bold ${getColor()} font-mono flex items-baseline gap-1`}>
            <span>{value}{unit}</span>
            {showDelta && delta !== 0 && (
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {delta > 0 ? '+' : ''}{delta}
              </motion.span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getBarColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Tooltip on hover */}
      <div className="hidden group-hover:block absolute z-10 -bottom-16 left-0 bg-gray-900 border border-green-500 rounded p-2 text-xs text-green-300 whitespace-nowrap">
        {label === 'Coffee' && 'Affects typing speed and focus'}
        {label === 'Reputation' && 'Unlocks advanced options and dialogue'}
        {label === 'Wisdom' && 'Earned from solving puzzles'}
        {label === 'Morale' && 'Team spirit affects outcomes'}
      </div>
    </motion.div>
  );
};

export const StatsHUD: React.FC = () => {
  const gameState = useGameState();
  const [isVisible, setIsVisible] = useState(true);
  const [previousStats, setPreviousStats] = useState(gameState.state.stats);
  const [showDeltas, setShowDeltas] = useState(false);

  // Track stat changes for delta display
  useEffect(() => {
    const hasChanged =
      previousStats.coffeeLevel !== gameState.state.stats.coffeeLevel ||
      previousStats.hackerRep !== gameState.state.stats.hackerRep ||
      previousStats.wisdomPoints !== gameState.state.stats.wisdomPoints ||
      previousStats.teamMorale !== gameState.state.stats.teamMorale;

    if (hasChanged) {
      setShowDeltas(true);
      const timer = setTimeout(() => {
        setShowDeltas(false);
        setPreviousStats(gameState.state.stats);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.state.stats, previousStats]);

  // Keyboard shortcut to toggle visibility (S key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey &&
          e.target instanceof HTMLElement &&
          e.target.tagName !== 'INPUT' &&
          e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-40 p-2 bg-black/80 border border-green-500/50 rounded-lg backdrop-blur-sm hover:bg-green-900/50 transition-colors"
        title="Show Stats (S)"
      >
        <Eye className="w-5 h-5 text-green-400" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed top-4 right-4 z-40 space-y-2 w-48"
      >
        {/* Toggle Button */}
        <div className="flex justify-end mb-1">
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 bg-black/80 border border-green-500/50 rounded hover:bg-green-900/50 transition-colors text-green-400"
            title="Hide Stats (S)"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="space-y-2 group relative">
          <StatDisplay
            icon={<Coffee className="w-4 h-4" />}
            label="Coffee"
            value={gameState.state.stats.coffeeLevel}
            maxValue={200}
            color="green"
            unit="%"
            showDelta={showDeltas}
            previousValue={previousStats.coffeeLevel}
          />

          <StatDisplay
            icon={<Star className="w-4 h-4" />}
            label="Reputation"
            value={gameState.state.stats.hackerRep}
            maxValue={100}
            color="blue"
            showDelta={showDeltas}
            previousValue={previousStats.hackerRep}
          />

          <StatDisplay
            icon={<Brain className="w-4 h-4" />}
            label="Wisdom"
            value={gameState.state.stats.wisdomPoints}
            maxValue={100}
            color="purple"
            unit=" pts"
            showDelta={showDeltas}
            previousValue={previousStats.wisdomPoints}
          />

          <StatDisplay
            icon={<Heart className="w-4 h-4" />}
            label="Morale"
            value={gameState.state.stats.teamMorale}
            maxValue={100}
            color="red"
            showDelta={showDeltas}
            previousValue={previousStats.teamMorale}
          />
        </div>

        {/* Keyboard Hint */}
        <div className="text-xs text-green-400/50 text-center font-mono">
          Press S to toggle
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StatsHUD;
