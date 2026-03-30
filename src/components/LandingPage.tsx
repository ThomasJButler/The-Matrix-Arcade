/**
 * @author Tom Butler
 * @description Landing page showcasing all games in The Matrix Arcade with
 *              descriptions and the classic arcade games that inspired them.
 */

import { motion } from 'framer-motion';
import { ChevronRight, Monitor } from 'lucide-react';

interface GameInfo {
  title: string;
  description: string;
  inspiration: string;
  inspirationNote: string;
  preview: string;
}

const GAME_DATA: GameInfo[] = [
  {
    title: 'CTRL-S | The World',
    description: 'A hilarious text adventure about saving the digital world across 5 chapters.',
    inspiration: 'Zork / Text Adventures',
    inspirationNote: 'Classic interactive fiction meets Matrix lore — type commands, make choices, save reality.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1737071600/ctrlsthegame_m1tg5l.png',
  },
  {
    title: 'Snake Classic',
    description: 'Navigate through the matrix collecting data fragments to grow longer.',
    inspiration: 'Nokia Snake (1998)',
    inspirationNote: 'The game that defined a generation of mobile gaming — now dripping in Matrix green.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1737071599/matrixsnake2_jw29w1.png',
  },
  {
    title: 'Vortex Pong',
    description: 'Battle a ruthless AI opponent in a hypnotic arena with power-ups.',
    inspiration: 'Pong (1972)',
    inspirationNote: 'The original video game, reimagined with vortex physics and Matrix aesthetics.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1737071596/vortexpong2_hkjn4k.png',
  },
  {
    title: 'Matrix Cloud',
    description: 'Navigate through gaps in the digital storm — one wrong move and you crash.',
    inspiration: 'Flappy Bird (2013)',
    inspirationNote: 'The brutally addictive one-tap classic, wrapped in cascading code rain.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1737071594/matrixcloud_rw8hsa.png',
  },
  {
    title: 'Matrix Invaders',
    description: 'Defend against waves of code invaders with bullet time and combo chains.',
    inspiration: 'Space Invaders (1978)',
    inspirationNote: 'Taito\'s genre-defining shooter — now with virus splitting, boss waves, and power-ups.',
    preview: '',
  },
  {
    title: 'Metris',
    description: 'Stack falling code blocks, clear lines, and activate bullet time mode.',
    inspiration: 'Tetris (1985)',
    inspirationNote: 'Alexey Pajitnov\'s masterpiece gets a Matrix makeover with slow-motion mechanics.',
    preview: '',
  },
  {
    title: 'Matrix Frogger',
    description: 'Cross dangerous lanes packed with Agents and Sentinels to reach safety.',
    inspiration: 'Frogger (1981)',
    inspirationNote: 'Konami\'s road-crossing classic, but the traffic is Agent Smith and his clones.',
    preview: '',
  },
  {
    title: 'Neo Jump',
    description: 'Jump through simulation layers, collect power-ups, and reach The Source.',
    inspiration: 'Doodle Jump (2009)',
    inspirationNote: 'The endless vertical platformer — with jetpacks, springs, and Matrix platforms.',
    preview: '',
  },
  {
    title: 'Agent Chase',
    description: 'Navigate a maze collecting data pills while evading the relentless Agent Smith.',
    inspiration: 'Pac-Man (1980)',
    inspirationNote: 'Namco\'s dot-munching legend — you\'re Neo, the ghosts are Agents, the dots are data.',
    preview: '',
  },
  {
    title: 'Rhythm Hacker',
    description: 'Hack through streams of falling code by hitting keys in time with the beat.',
    inspiration: 'Guitar Hero / Dance Dance Revolution',
    inspirationNote: 'The rhythm game genre, reimagined as a Matrix hacking sequence with 4 lanes.',
    preview: '',
  },
  {
    title: 'Cloud Jumper',
    description: 'Leap between clouds in the digital sky, collecting fragments and avoiding the void.',
    inspiration: 'Doodle Jump / Platformers',
    inspirationNote: 'Side-scrolling cloud hopping through the Matrix skyline.',
    preview: '',
  },
];

interface LandingPageProps {
  onSelectGame: (index: number) => void;
  onClose: () => void;
}

export default function LandingPage({ onSelectGame, onClose }: LandingPageProps) {
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

      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-green-500/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-green-400" />
            <h1 className="text-green-400 font-mono text-lg tracking-wider">
              THE MATRIX ARCADE
            </h1>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-green-500/50 text-green-400 font-mono text-sm rounded hover:bg-green-500/10 transition-colors"
          >
            BACK TO ARCADE
          </button>
        </div>
      </header>

      {/* Hero section */}
      <section className="max-w-6xl mx-auto px-4 py-12 text-center">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-green-400 font-mono text-3xl md:text-4xl mb-4 tracking-wide"
        >
          Welcome to the Arcade
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-green-500/70 font-mono text-sm max-w-2xl mx-auto leading-relaxed"
        >
          {GAME_DATA.length} games inspired by the classics that defined gaming — rebuilt
          from the ground up with the visual language of The Matrix. Every game
          was discovered on a hidden terminal inside the simulation.
        </motion.p>
      </section>

      {/* Games grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAME_DATA.map((game, index) => (
            <motion.div
              key={game.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => onSelectGame(index)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectGame(index); } }}
              role="button"
              tabIndex={0}
              aria-label={`Play ${game.title}`}
              className="group cursor-pointer border border-green-500/20 rounded-lg bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/60 transition-all duration-300 overflow-hidden"
            >
              {/* Preview image */}
              {game.preview ? (
                <div className="h-36 overflow-hidden bg-black">
                  <img
                    src={game.preview}
                    alt={game.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  />
                </div>
              ) : (
                <div className="h-36 bg-gradient-to-br from-green-900/20 to-black flex items-center justify-center">
                  <span className="text-green-500/30 font-mono text-4xl">{'>'}_</span>
                </div>
              )}

              <div className="p-4">
                {/* Title */}
                <h3 className="text-green-400 font-mono text-sm mb-2 group-hover:text-green-300 transition-colors flex items-center gap-2">
                  {game.title}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>

                {/* Description */}
                <p className="text-green-500/60 font-mono text-xs mb-3 leading-relaxed">
                  {game.description}
                </p>

                {/* Inspiration tag */}
                <div className="border-t border-green-500/10 pt-3">
                  <span className="text-green-500/40 font-mono text-[10px] uppercase tracking-wider">
                    Inspired by
                  </span>
                  <p className="text-green-400/80 font-mono text-xs mt-1">
                    {game.inspiration}
                  </p>
                  <p className="text-green-500/40 font-mono text-[10px] mt-1 leading-relaxed">
                    {game.inspirationNote}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-500/20 py-8 text-center">
        <p className="text-green-500/30 font-mono text-xs">
          Built with love by Tom Butler — React + Phaser 3 + Web Audio API
        </p>
      </footer>
    </motion.div>
  );
}
