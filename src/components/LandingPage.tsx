/**
 * @author Tom Butler
 * @description Landing page showcasing all games in The Matrix Arcade with
 *              descriptions and the classic arcade games that inspired them.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Monitor, Keyboard } from 'lucide-react';
import type { GameCategory } from '../types/game';
import { GAME_REGISTRY, type GameEntry } from '../data/gameRegistry';

const GAME_DATA: GameEntry[] = GAME_REGISTRY;

interface LandingPageProps {
  onSelectGame: (index: number) => void;
  onClose: () => void;
}

const ALL_CATEGORIES: GameCategory[] = ['Arcade', 'Classic', 'Shooter', 'Puzzle', 'Story', 'Rhythm'];

export default function LandingPage({ onSelectGame, onClose }: LandingPageProps) {
  const [activeCategory, setActiveCategory] = useState<GameCategory | 'All'>('All');
  const [showControls, setShowControls] = useState(false);

  const filteredGames = activeCategory === 'All'
    ? GAME_DATA
    : GAME_DATA.filter(g => g.category === activeCategory);

  const getOriginalIndex = (filteredIndex: number) => {
    const game = filteredGames[filteredIndex];
    return GAME_DATA.indexOf(game);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black overflow-y-auto"
    >
      {/* Matrix rain background effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-green-500 font-mono text-xs whitespace-nowrap animate-pulse"
            style={{
              left: `${i * 5}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          >
            {Array.from({ length: 30 }).map(() =>
              String.fromCharCode(0x30A0 + Math.random() * 96)
            ).join('')}
          </div>
        ))}
      </div>

      {/* Header with collapsible controls */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-green-500/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-green-400" />
            <h1 className="text-green-400 text-lg tracking-wider phosphor-glow" style={{ fontFamily: 'var(--matrix-font-title)' }}>
              THE MATRIX ARCADE
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowControls(!showControls)}
              className={`p-2 border rounded transition-colors ${
                showControls
                  ? 'border-green-500/50 text-green-400 bg-green-500/10'
                  : 'border-green-500/30 text-green-400/60 hover:bg-green-500/10 hover:text-green-400'
              }`}
              title="Keyboard controls"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-green-500/50 text-green-400 font-mono text-sm rounded hover:bg-green-500/10 transition-colors"
            >
              BACK TO ARCADE
            </button>
          </div>
        </div>
        {showControls && (
          <div className="border-t border-green-500/20 bg-black/60">
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap gap-x-6 gap-y-1 justify-center">
              {[
                ['P', 'Pause'],
                ['R', 'Restart'],
                ['ESC', 'Exit'],
                ['M', 'Mute'],
                ['Arrows', 'Move'],
                ['WASD', 'Alt Move'],
              ].map(([key, action]) => (
                <span key={key} className="font-mono text-xs text-green-500/60">
                  <kbd className="text-green-400/80 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 mr-1.5">{key}</kbd>
                  {action}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero + Category filter */}
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-green-400 text-2xl md:text-3xl tracking-wide phosphor-glow mb-1"
              style={{ fontFamily: 'var(--matrix-font-title)' }}
            >
              Choose Your Program
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-green-500/50 font-mono text-xs"
            >
              {GAME_DATA.length} programs recovered from terminals inside the simulation
            </motion.p>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-3 py-1 rounded-full font-mono text-xs transition-colors ${
                activeCategory === 'All'
                  ? 'bg-green-500 text-black font-bold'
                  : 'border border-green-500/30 text-green-500/60 hover:border-green-500/60 hover:text-green-400'
              }`}
            >
              All ({GAME_DATA.length})
            </button>
            {ALL_CATEGORIES.map(cat => {
              const count = GAME_DATA.filter(g => g.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full font-mono text-xs transition-colors ${
                    activeCategory === cat
                      ? 'bg-green-500 text-black font-bold'
                      : 'border border-green-500/30 text-green-500/60 hover:border-green-500/60 hover:text-green-400'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Games grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 + index * 0.03 }}
              onClick={() => onSelectGame(getOriginalIndex(index))}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectGame(getOriginalIndex(index)); } }}
              role="button"
              tabIndex={0}
              aria-label={`Play ${game.title}`}
              className="group cursor-pointer border border-green-500/25 rounded-lg bg-green-500/[0.03] hover:bg-green-500/10 hover:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/60 transition-all duration-300 overflow-hidden"
            >
              {/* Preview image with play overlay */}
              <div className="relative h-44 overflow-hidden bg-black">
                {game.preview ? (
                  <img
                    src={game.preview}
                    alt={game.title}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-black" />
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-5 h-5 text-green-400 ml-0.5" fill="currentColor" />
                  </div>
                </div>
                <span className="absolute top-2 right-2 bg-black/70 text-green-400/80 text-[9px] font-mono px-2 py-0.5 rounded border border-green-500/20 backdrop-blur-sm">
                  {game.category}
                </span>
              </div>

              <div className="p-3">
                <h3 className="text-green-400 font-mono text-sm mb-1.5 group-hover:text-green-300 transition-colors truncate">
                  {game.title}
                </h3>
                <p className="text-green-500/55 font-mono text-[11px] leading-relaxed line-clamp-2 mb-2">
                  {game.description}
                </p>
                <p className="text-green-500/35 font-mono text-[10px] truncate">
                  Inspired by {game.inspiration}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-500/20 py-6 text-center">
        <p className="text-green-500/30 font-mono text-xs">
          Built with love by Tom Butler — React + Phaser 3 + Web Audio API
        </p>
      </footer>
    </motion.div>
  );
}
