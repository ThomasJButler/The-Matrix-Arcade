import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
            <div className="relative aspect-[16/9] overflow-hidden">
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

              {/* Title overlay on screen */}
              <div className="absolute top-0 left-0 right-0 ipod-title-overlay pointer-events-none">
                <h2 className="sr-only">{game.title}</h2>
                <pre
                  className="text-green-500 font-mono text-[6px] lg:text-[8px] xl:text-[9px] leading-none text-center select-none overflow-hidden mx-auto py-1.5 lg:py-2"
                  aria-hidden="true"
                  style={{ textShadow: '0 0 8px rgba(0,255,0,0.8), 0 0 20px rgba(0,255,0,0.3)' }}
                >
                  {GAME_TITLES[game.id] || game.title}
                </pre>
              </div>
            </div>
          </div>

          {/* Clickwheel region */}
          <div className="ipod-clickwheel-region mt-3 lg:mt-4">
            {/* Game info */}
            <div className="text-center mb-3 lg:mb-4">
              {game.category && (
                <span className="inline-block text-green-500/60 font-mono text-xs border border-green-500/30 px-2 py-0.5 rounded-full mb-2">
                  {game.category}
                </span>
              )}
              <p className="text-green-400 font-mono text-xs lg:text-sm">
                {game.description}
              </p>
            </div>

            {/* iPod Clickwheel */}
            <div className="ipod-clickwheel" role="group" aria-label="Game navigation wheel">
              <button
                className="clickwheel-zone clickwheel-top"
                onClick={onShowInstructions}
                aria-label="How to play"
              >
                <span>MENU</span>
              </button>

              <button
                className="clickwheel-zone clickwheel-left"
                onClick={onPrev}
                data-testid="carousel-prev"
                aria-label="Previous game"
              >
                <span>◄◄</span>
              </button>

              <button
                className="clickwheel-zone clickwheel-right"
                onClick={onNext}
                data-testid="carousel-next"
                aria-label="Next game"
              >
                <span>►►</span>
              </button>

              <button
                className="clickwheel-zone clickwheel-bottom"
                onClick={() => {
                  if (!isPlayDisabled && hasComponent) onPlay();
                }}
                disabled={isPlayDisabled || !hasComponent}
                aria-label="Play game"
              >
                <span>▶❚❚</span>
              </button>

              <button
                className="clickwheel-centre"
                onClick={onShowHighScores}
                aria-label="View high scores"
              >
                ●
              </button>
            </div>

            {/* Keyboard hints */}
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
