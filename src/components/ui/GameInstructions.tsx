import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Info, Sparkles } from 'lucide-react';
import type { GameEntry } from '../../data/gameRegistry';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface GameInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameEntry;
  icon: React.ReactNode;
}

export const GameInstructions: React.FC<GameInstructionsProps> = ({
  isOpen,
  onClose,
  game,
  icon,
}) => {
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
          aria-labelledby="game-instructions-title"
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
              <h2 id="game-instructions-title" className="text-green-400 font-mono text-lg">{game.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-green-900/50 rounded-lg transition-colors"
              aria-label="Close instructions"
            >
              <X className="w-5 h-5 text-green-500/60 hover:text-green-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-green-500/60" />
                <span className="text-green-500/60 font-mono text-xs uppercase tracking-wider">About</span>
              </div>
              <p className="text-green-400/90 font-mono text-sm leading-relaxed">
                {game.description}
              </p>
            </div>

            {/* Controls */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gamepad2 className="w-4 h-4 text-green-500/60" />
                <span className="text-green-500/60 font-mono text-xs uppercase tracking-wider">Controls</span>
              </div>
              <div className="bg-black/50 border border-green-500/20 rounded-lg p-3">
                <p className="text-green-400/90 font-mono text-sm leading-relaxed">
                  {game.controls}
                </p>
              </div>
            </div>

            {/* Universal controls */}
            <div>
              <span className="text-green-500/60 font-mono text-xs uppercase tracking-wider mb-2 block">Universal Keys</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'ESC', action: 'Exit to menu' },
                  { key: 'P', action: 'Pause / Resume' },
                  { key: 'R', action: 'Restart' },
                  { key: 'M', action: 'Toggle mute' },
                ].map(({ key, action }) => (
                  <div key={key} className="flex items-center gap-2 bg-black/30 rounded px-2 py-1.5">
                    <kbd className="bg-green-500/15 border border-green-500/30 text-green-400 font-mono text-xs px-1.5 py-0.5 rounded min-w-[2rem] text-center">
                      {key}
                    </kbd>
                    <span className="text-green-400/70 font-mono text-xs">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspiration */}
            <div className="border-t border-green-500/15 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-green-500/60" />
                <span className="text-green-500/60 font-mono text-xs uppercase tracking-wider">Inspired By</span>
              </div>
              <p className="text-green-400/90 font-mono text-sm">{game.inspiration}</p>
              <p className="text-green-500/50 font-mono text-xs mt-1 leading-relaxed">{game.inspirationNote}</p>
            </div>
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

export default GameInstructions;
