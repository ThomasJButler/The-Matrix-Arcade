import React, { useState, useRef } from 'react';
import { X, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { ScoreTable } from './ScoreTable';
import { MatrixRainCanvas } from '../ui/MatrixRainCanvas';
import type { ScoreboardGameId, ScoreEntry } from '../../hooks/useSaveSystem';
import { SCOREBOARD_GAME_IDS } from '../../hooks/useSaveSystem';

const GAME_LABELS: Record<ScoreboardGameId, string> = {
  snakeClassic: 'Snake',
  vortexPong: 'Vortex Pong',
  matrixCloud: 'Matrix Bird',
  matrixInvaders: 'Invaders',
  metris: 'Metris',
  matrixFrogger: 'Frogger',
  neoJump: 'Neo Jump',
  agentChase: 'Agent Chase',
  rhythmHacker: 'Rhythm',
  cloudJumper: 'Cloud Jump',
  codeBreaker: 'Code Breaker',
};

interface ScoreboardProps {
  isOpen: boolean;
  onClose: () => void;
  scoreboards: Record<ScoreboardGameId, ScoreEntry[]>;
  lastInitials: string;
  onClearBoard?: (gameId: ScoreboardGameId) => void;
  playSound?: (key: string) => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  isOpen,
  onClose,
  scoreboards,
  lastInitials,
  onClearBoard,
  playSound,
}) => {
  const [activeTab, setActiveTab] = useState<ScoreboardGameId>(SCOREBOARD_GAME_IDS[0]);
  const [confirmWipe, setConfirmWipe] = useState<ScoreboardGameId | null>(null);
  const [wipeInput, setWipeInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useFocusTrap(containerRef, isOpen, onClose);

  const handleTabChange = (gameId: ScoreboardGameId) => {
    setActiveTab(gameId);
    setConfirmWipe(null);
    setWipeInput('');
    playSound?.('scoreboardTab');
  };

  const handleResetClick = (gameId: ScoreboardGameId) => {
    if (confirmWipe === gameId) {
      if (wipeInput.toUpperCase() === 'WIPE') {
        onClearBoard?.(gameId);
        setConfirmWipe(null);
        setWipeInput('');
      }
    } else {
      setConfirmWipe(gameId);
      setWipeInput('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div className="fixed inset-0 pointer-events-none opacity-30">
            <MatrixRainCanvas />
          </div>

          <motion.div
            ref={containerRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col mx-4 rounded-xl border border-green-500/50 bg-black/95 shadow-[0_0_30px_rgba(0,255,0,0.2)]"
            role="dialog"
            aria-modal="true"
            aria-label="High Scores"
          >
            {/* CRT scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-xl z-10"
              style={{
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)',
                mixBlendMode: 'overlay',
                opacity: 0.08,
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-green-500/30">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-mono text-green-400 tracking-wider phosphor-glow">
                  HIGH SCORES
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-green-400/60 hover:text-green-400 transition-colors"
                aria-label="Close scoreboard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div
              ref={tabsRef}
              className="flex overflow-x-auto border-b border-green-500/20 scrollbar-thin scrollbar-thumb-green-500/30"
            >
              {SCOREBOARD_GAME_IDS.map((gameId) => (
                <button
                  key={gameId}
                  onClick={() => handleTabChange(gameId)}
                  className={`flex-shrink-0 px-3 py-2 font-mono text-xs transition-colors border-b-2 ${
                    activeTab === gameId
                      ? 'border-green-400 text-green-400 bg-green-500/10'
                      : 'border-transparent text-green-400/40 hover:text-green-400/70 hover:bg-green-500/5'
                  }`}
                >
                  {GAME_LABELS[gameId]}
                </button>
              ))}
            </div>

            {/* Table body */}
            <div className="flex-1 overflow-y-auto p-4">
              <ScoreTable
                entries={scoreboards[activeTab] || []}
                lastInitials={lastInitials}
              />
            </div>

            {/* Footer with reset */}
            {onClearBoard && (
              <div className="flex items-center justify-end gap-2 p-3 border-t border-green-500/20">
                {confirmWipe === activeTab ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-red-400">Type WIPE to confirm:</span>
                    <input
                      value={wipeInput}
                      onChange={(e) => setWipeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleResetClick(activeTab); }}
                      className="w-20 px-2 py-1 text-xs font-mono bg-black border border-red-500/50 text-red-400 rounded focus:outline-none focus:border-red-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleResetClick(activeTab)}
                      className="px-2 py-1 text-xs font-mono text-red-400 border border-red-500/50 rounded hover:bg-red-500/10 transition-colors"
                    >
                      CONFIRM
                    </button>
                    <button
                      onClick={() => { setConfirmWipe(null); setWipeInput(''); }}
                      className="px-2 py-1 text-xs font-mono text-green-400/60 hover:text-green-400 transition-colors"
                    >
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleResetClick(activeTab)}
                    className="px-3 py-1 text-xs font-mono text-red-400/60 border border-red-500/30 rounded hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/5 transition-colors"
                  >
                    RESET
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
