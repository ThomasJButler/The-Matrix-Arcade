import React, { useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, BarChart3, Clock, Target, Lock } from 'lucide-react';
import type { GameEntry } from '../../data/gameRegistry';
import type { GameSaveData, GlobalSaveData } from '../../hooks/useSaveSystem';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const REGISTRY_TO_SAVE_KEY: Record<string, keyof GlobalSaveData['games']> = {
  'ctrl-s-world': 'ctrlSWorld',
  'snake-classic': 'snakeClassic',
  'vortex-pong': 'vortexPong',
  'matrix-cloud': 'matrixCloud',
  'matrix-invaders': 'matrixInvaders',
  'metris': 'metris',
  'matrix-frogger': 'matrixFrogger',
  'neo-jump': 'neoJump',
  'agent-chase': 'agentChase',
  'rhythm-hacker': 'rhythmHacker',
  'cloud-jumper': 'cloudJumper',
  'code-breaker': 'codeBreaker',
};

interface GameHighScoresProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameEntry;
  icon: React.ReactNode;
  saveData: GlobalSaveData;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    game?: string;
  }>;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(timestamp: number): string {
  if (!timestamp || timestamp === 0) return 'Never';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const GameHighScores: React.FC<GameHighScoresProps> = ({
  isOpen,
  onClose,
  game,
  icon,
  saveData,
  achievements,
}) => {
  const saveKey = REGISTRY_TO_SAVE_KEY[game.id];
  const gameSave: GameSaveData | undefined = saveKey ? saveData.games[saveKey] : undefined;

  const gameAchievements = useMemo(() => {
    const saveKeyForAchievements = saveKey;
    return achievements.filter(a => a.game === saveKeyForAchievements);
  }, [achievements, saveKey]);

  const unlockedCount = gameAchievements.filter(a => a.unlocked).length;

  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen, onClose);

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
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-highscores-title"
          className="relative w-full max-w-lg bg-gray-900 border border-green-500 rounded-xl shadow-[0_0_30px_rgba(0,255,0,0.2)] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="text-green-400">{icon}</div>
              <h2 id="game-highscores-title" className="text-green-400 font-mono text-lg">{game.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-green-900/50 rounded-lg transition-colors"
              aria-label="Close high scores"
            >
              <X className="w-5 h-5 text-green-500/60 hover:text-green-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* High Score */}
            <div className="text-center py-4">
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
              <p className="text-green-500/60 font-mono text-xs uppercase tracking-wider mb-1">High Score</p>
              <p className="text-green-400 font-mono text-4xl phosphor-glow">
                {formatNumber(gameSave?.highScore ?? 0)}
              </p>
            </div>

            {/* Stats */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-green-500/60" />
                <span className="text-green-500/60 font-mono text-xs uppercase tracking-wider">Statistics</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Games Played"
                  value={formatNumber(gameSave?.stats?.gamesPlayed ?? 0)}
                  icon={<Target className="w-4 h-4" />}
                />
                <StatCard
                  label="Total Score"
                  value={formatNumber(gameSave?.stats?.totalScore ?? 0)}
                  icon={<BarChart3 className="w-4 h-4" />}
                />
                {(gameSave?.stats?.bestCombo ?? 0) > 0 && (
                  <StatCard
                    label="Best Combo"
                    value={`${formatNumber(gameSave?.stats?.bestCombo ?? 0)}x`}
                    icon={<Target className="w-4 h-4" />}
                  />
                )}
                {(gameSave?.stats?.longestSurvival ?? 0) > 0 && (
                  <StatCard
                    label="Best Survival"
                    value={formatTime(gameSave?.stats?.longestSurvival ?? 0)}
                    icon={<Clock className="w-4 h-4" />}
                  />
                )}
                {(gameSave?.stats?.bossesDefeated ?? 0) > 0 && (
                  <StatCard
                    label="Bosses Defeated"
                    value={formatNumber(gameSave?.stats?.bossesDefeated ?? 0)}
                    icon={<Target className="w-4 h-4" />}
                  />
                )}
                <StatCard
                  label="Last Played"
                  value={formatDate(gameSave?.lastPlayed ?? 0)}
                  icon={<Clock className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Achievements */}
            {gameAchievements.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-green-500/60" />
                    <span className="text-green-500/60 font-mono text-xs uppercase tracking-wider">Achievements</span>
                  </div>
                  <span className="text-green-400/70 font-mono text-xs">
                    {unlockedCount}/{gameAchievements.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-green-500/10 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${gameAchievements.length > 0 ? (unlockedCount / gameAchievements.length) * 100 : 0}%` }}
                  />
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {gameAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        achievement.unlocked
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-black/30 border border-green-500/10 opacity-60'
                      }`}
                    >
                      {achievement.unlocked ? (
                        <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-green-500/30 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-green-400 font-mono text-xs truncate">{achievement.name}</p>
                        <p className="text-green-500/50 font-mono text-[10px] truncate">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-green-500/20 text-center">
            <p className="text-green-500/40 font-mono text-xs">Press ESC or click outside to close</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-black/40 border border-green-500/15 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1 text-green-500/50">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-green-400 font-mono text-sm">{value}</p>
    </div>
  );
}

export default GameHighScores;
