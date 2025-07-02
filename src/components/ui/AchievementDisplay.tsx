import React, { useState, useMemo } from 'react';
import { Trophy, Lock, X, Search, Star, Target, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  icon?: string;
  game?: string;
}

interface AchievementDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

const gameIcons: Record<string, string> = {
  'Snake Classic': '🐍',
  'Vortex Pong': '🏓',
  'Terminal Quest': '💻',
  'CTRL-S World': '💾',
  'Matrix Cloud': '☁️'
};

export const AchievementDisplay: React.FC<AchievementDisplayProps> = ({
  isOpen,
  onClose,
  achievements
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // Group achievements by game
  const achievementsByGame = useMemo(() => {
    const grouped = achievements.reduce((acc, achievement) => {
      const game = achievement.game || 'General';
      if (!acc[game]) acc[game] = [];
      acc[game].push(achievement);
      return acc;
    }, {} as Record<string, Achievement[]>);
    return grouped;
  }, [achievements]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let filtered = achievements;
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedGame) {
      filtered = filtered.filter(a => a.game === selectedGame);
    }
    
    return filtered;
  }, [achievements, searchTerm, selectedGame]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.unlocked).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { total, unlocked, percentage };
  }, [achievements]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-6xl h-[90vh] bg-black/95 border-2 border-green-500 
                     rounded-lg shadow-[0_0_50px_rgba(0,255,0,0.3)] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Matrix rain background */}
          <div className="absolute inset-0 opacity-10">
            <div className="matrix-rain" />
          </div>

          {/* Header */}
          <div className="relative z-10 bg-black/80 border-b-2 border-green-500/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Trophy className="w-8 h-8 text-green-500" />
                <h1 className="text-3xl font-mono text-green-500 tracking-wider">
                  ACHIEVEMENTS
                </h1>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-green-500/20 rounded transition-colors"
              >
                <X className="w-6 h-6 text-green-500" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 text-green-300 font-mono">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span>{stats.unlocked} / {stats.total} UNLOCKED</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span>{stats.percentage}% COMPLETE</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-green-900/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-600 to-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${stats.percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="relative z-10 bg-black/60 border-b border-green-500/30 p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500/50" />
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/50 border border-green-500/30 
                           rounded text-green-300 font-mono placeholder-green-500/30
                           focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Game filter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedGame(null)}
                  className={`px-3 py-2 rounded font-mono text-sm transition-colors ${
                    !selectedGame 
                      ? 'bg-green-500/20 text-green-300 border border-green-500' 
                      : 'bg-black/50 text-green-500/50 border border-green-500/30 hover:border-green-500/50'
                  }`}
                >
                  ALL GAMES
                </button>
                {Object.keys(achievementsByGame).map(game => (
                  <button
                    key={game}
                    onClick={() => setSelectedGame(game)}
                    className={`px-3 py-2 rounded font-mono text-sm transition-colors flex items-center gap-2 ${
                      selectedGame === game
                        ? 'bg-green-500/20 text-green-300 border border-green-500' 
                        : 'bg-black/50 text-green-500/50 border border-green-500/30 hover:border-green-500/50'
                    }`}
                  >
                    <span>{gameIcons[game] || '🎮'}</span>
                    {game}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Achievements grid */}
          <div className="relative z-10 overflow-y-auto h-[calc(100%-280px)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                    achievement.unlocked
                      ? 'bg-green-900/20 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.3)]'
                      : 'bg-black/50 border-green-500/20 opacity-60'
                  }`}
                >
                  {/* Icon */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center
                                  ${achievement.unlocked 
                                    ? 'bg-green-500/30 border-2 border-green-500' 
                                    : 'bg-black/50 border-2 border-green-500/30'}`}>
                      {achievement.unlocked ? (
                        achievement.icon || <Trophy className="w-6 h-6 text-green-500" />
                      ) : (
                        <Lock className="w-6 h-6 text-green-500/50" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className={`font-mono text-lg mb-1 ${
                        achievement.unlocked ? 'text-green-300' : 'text-green-500/50'
                      }`}>
                        {achievement.name}
                      </h3>
                      <p className={`font-mono text-sm mb-2 ${
                        achievement.unlocked ? 'text-green-400/80' : 'text-green-500/30'
                      }`}>
                        {achievement.unlocked ? achievement.description : '???'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-green-500/50">
                          {achievement.game || 'General'}
                        </span>
                        {achievement.unlocked && achievement.unlockedAt && (
                          <span className="font-mono text-xs text-green-500/50">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unlock animation */}
                  {achievement.unlocked && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <div className="w-full h-full bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {filteredAchievements.length === 0 && (
              <div className="text-center py-20">
                <Zap className="w-16 h-16 mx-auto text-green-500/30 mb-4" />
                <p className="text-green-500/50 font-mono">NO ACHIEVEMENTS FOUND</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};