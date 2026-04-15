import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  BookOpen,
  Trophy,
} from 'lucide-react';
import { GAME_TITLES } from '../lib/asciiArt';
import type { GameEntry } from '../data/gameRegistry';

interface GameWithRuntime extends GameEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  icon: React.ReactNode;
}

export interface GamePortalProps {
  games: GameWithRuntime[];
  selectedGame: number;
  isTransitioning: boolean;
  transitionDirection: 'left' | 'right';
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onShowInstructions: () => void;
  onShowHighScores: () => void;
  isPlayDisabled: boolean;
}

export function GamePortal({
  games,
  selectedGame,
  isTransitioning,
  transitionDirection,
  containerRef,
  onPrev,
  onNext,
  onPlay,
  onShowInstructions,
  onShowHighScores,
  isPlayDisabled,
}: GamePortalProps) {
  const game = games[selectedGame];
  const hasComponent = typeof game.component !== 'undefined';

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col justify-center h-full game-portal-container px-4">
      <div
        ref={containerRef}
        className={`
          digital-container game-portal-wrapper
          ${isTransitioning ? `transition-${transitionDirection}` : ''}
        `}
      >
        {/* iPod Classic Device Body */}
        <div className="ipod-body w-full mx-auto">
          {/* Screen Bezel */}
          <div className="ipod-screen">
            {/* Game Display */}
            <div className="relative aspect-[16/9]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedGame}
                  className="w-full h-full transition-enhanced"
                >
                  <img
                    src={game.preview}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Below-screen controls (clickwheel replaces this in R82.5) */}
          <div className="ipod-clickwheel-region mt-3 lg:mt-4">
            <div className="game-controls-enhanced">
              <button
                data-testid="carousel-prev"
                onClick={onPrev}
                className="p-1.5 lg:p-2 border border-green-500/30 bg-green-500/5 hover:bg-green-900 hover:border-green-500/60 rounded-full transition-colors transform hover:scale-110"
                title="Previous game"
                aria-label="Previous game"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex-1 text-center">
                <div className="mb-2">
                  <h2 className="sr-only">{game.title}</h2>
                  <pre
                    className="text-green-500 font-mono text-[7px] lg:text-[9px] xl:text-[10px] leading-none text-center select-none overflow-hidden mx-auto"
                    aria-hidden="true"
                    style={{ textShadow: '0 0 8px rgba(0,255,0,0.6), 0 0 20px rgba(0,255,0,0.15)' }}
                  >
                    {GAME_TITLES[game.id] || game.title}
                  </pre>
                </div>
                {game.category && (
                  <span className="inline-block text-green-500/60 font-mono text-xs border border-green-500/30 px-2 py-0.5 rounded-full mb-2">
                    {game.category}
                  </span>
                )}
                <p className="text-green-400 font-mono text-xs lg:text-sm mb-3 lg:mb-4">
                  {game.description}
                </p>
                {hasComponent && (
                  <button
                    onClick={() => {
                      if (isPlayDisabled) return;
                      onPlay();
                    }}
                    className="px-4 py-2 lg:px-6 lg:py-2.5 bg-green-500 text-black font-mono rounded-full hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto transform hover:scale-105 text-sm lg:text-base font-bold"
                    aria-label="Play game"
                  >
                    <Play className="w-4 h-4" />
                    PLAY
                  </button>
                )}
              </div>

              <button
                data-testid="carousel-next"
                onClick={onNext}
                className="p-1.5 lg:p-2 border border-green-500/30 bg-green-500/5 hover:bg-green-900 hover:border-green-500/60 rounded-full transition-colors transform hover:scale-110"
                title="Next game"
                aria-label="Next game"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Instructions & High Scores Buttons */}
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={onShowInstructions}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/60 rounded-lg transition-colors font-mono text-xs text-green-400 hover:text-green-300"
                aria-label="View instructions"
              >
                <BookOpen className="w-3.5 h-3.5" />
                HOW TO PLAY
              </button>
              <button
                onClick={onShowHighScores}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/60 rounded-lg transition-colors font-mono text-xs text-green-400 hover:text-green-300"
                aria-label="View high scores"
              >
                <Trophy className="w-3.5 h-3.5" />
                HIGH SCORE
              </button>
            </div>

            {/* Keyboard Hints */}
            <div className="mt-3 text-xs lg:text-sm text-green-400/60 text-center space-y-1 font-mono">
              <p className="text-green-500/70">&larr; &rarr; NAVIGATE &bull; ENTER PLAY &bull; ESC EXIT</p>
              <p className="text-green-500/50">I Instructions &bull; H Scores &bull; A Achievements &bull; B About &bull; V Mute</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
