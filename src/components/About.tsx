/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description About page overlay for The Matrix Arcade. Shows project info,
 *              game inspirations, and a placeholder for creator notes.
 */

import React, { useRef } from 'react';
import { X, Info, Gamepad2, Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface AboutProps {
  isOpen: boolean;
  onClose: () => void;
}

const GAME_INSPIRATIONS = [
  { name: 'Snake', inspiration: 'Snake', description: 'The classic snake game reimagined in the Matrix universe.' },
  { name: 'VortexPong', inspiration: 'Pong', description: 'Atari\'s legendary paddle game with a digital vortex twist.' },
  { name: 'Matrix Bird', inspiration: 'Flappy Bird', description: 'Navigate through the Matrix code rain, one flap at a time.' },
  { name: 'MatrixInvaders', inspiration: 'Space Invaders', description: 'Defend the system against waves of rogue programs.' },
  { name: 'Metris', inspiration: 'Tetris', description: 'Stack falling code blocks before the buffer overflows.' },
  { name: 'MatrixFrogger', inspiration: 'Frogger', description: 'Cross the digital highway of streaming data.' },
  { name: 'NeoJump', inspiration: 'Doodle Jump', description: 'Leap between platforms in a vertical escape from the system.' },
  { name: 'AgentChase', inspiration: 'Pac-Man', description: 'Evade agents through the maze of the construct.' },
  { name: 'RhythmHacker', inspiration: 'Guitar Hero', description: 'Hack the mainframe to the beat of the Matrix soundtrack.' },
  { name: 'CloudJumper', inspiration: 'Flappy Bird / Doodle Jump', description: 'A hybrid platformer through the cloud layer of the Matrix.' },
  { name: 'CodeBreaker', inspiration: 'Breakout', description: 'Shatter firewalls one brick at a time.' },
  { name: 'CTRL-S World', inspiration: 'Text Adventure', description: 'A narrative journey through the Matrix, told in text.' },
];

const About: React.FC<AboutProps> = ({ isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 rounded-xl border border-green-500/50 bg-black shadow-[0_0_30px_rgba(0,255,0,0.2)] p-6 lg:p-8"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="About The Matrix Arcade"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg border border-green-500/30 bg-green-900/30 hover:bg-green-800 transition-colors"
              aria-label="Close about page"
            >
              <X className="w-5 h-5 text-green-500" />
            </button>

            {/* Section 1: About the Arcade */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-6 h-6 text-green-500 flex-shrink-0" />
                <h2 className="text-lg lg:text-xl text-green-500 tracking-wider" style={{ textShadow: '0 0 10px rgba(0,255,0,0.5)' }}>
                  ABOUT THE ARCADE
                </h2>
              </div>
              <p className="text-green-400 text-xs lg:text-sm leading-relaxed font-mono">
                The Matrix Arcade is a browser-based arcade featuring 12 Matrix-themed games.
                Built with React, Phaser 3, and the Web Audio API, every game runs entirely
                in your browser with procedural audio, achievements, and PWA support. No
                downloads, no installs -- just take the red pill and play.
              </p>
            </section>

            {/* Section 2: Game Inspirations */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <Gamepad2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <h2 className="text-lg lg:text-xl text-green-500 tracking-wider" style={{ textShadow: '0 0 10px rgba(0,255,0,0.5)' }}>
                  GAME INSPIRATIONS
                </h2>
              </div>
              <div className="grid gap-3">
                {GAME_INSPIRATIONS.map((game) => (
                  <div
                    key={game.name}
                    className="border border-green-500/20 rounded-lg p-3 bg-green-900/10 hover:bg-green-900/20 transition-colors"
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-green-500 text-xs lg:text-sm font-bold">{game.name}</span>
                      <span className="text-green-500/50 text-[10px] lg:text-xs">
                        inspired by {game.inspiration}
                      </span>
                    </div>
                    <p className="text-green-400/70 text-[10px] lg:text-xs font-mono leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Why I Built This */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-green-500 flex-shrink-0" />
                <h2 className="text-lg lg:text-xl text-green-500 tracking-wider" style={{ textShadow: '0 0 10px rgba(0,255,0,0.5)' }}>
                  WHY I BUILT THIS
                </h2>
              </div>
              <p className="text-green-400/70 text-xs lg:text-sm leading-relaxed font-mono italic">
                This section is waiting for the creator&apos;s personal note. Check back soon!
              </p>
            </section>

            {/* Keyboard hint */}
            <div className="mt-8 pt-4 border-t border-green-500/20 text-center">
              <p className="text-green-500/40 text-[10px] font-mono">
                ESC to close &bull; B to toggle
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default About;
