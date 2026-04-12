import { GameCategory } from '../types/game';
import {
  matrixFroggerPreview,
  neoJumpPreview,
  agentChasePreview,
  rhythmHackerPreview,
  cloudJumperPreview,
} from '../lib/gamePreviewImages';
import matrixInvadersPreview from '../images/matrixinvaders.webp';
import metrisPreview from '../images/metris.webp';

export interface GameEntry {
  id: string;
  title: string;
  description: string;
  preview: string;
  category: GameCategory;
  inspiration: string;
  inspirationNote: string;
  controls: string;
}

/**
 * Central game registry — single source of truth for all game metadata.
 * App.tsx and LandingPage.tsx both consume this data.
 */
export const GAME_REGISTRY: GameEntry[] = [
  {
    id: 'ctrl-s-world',
    title: 'CTRL-S | The World',
    description: 'A hilarious text adventure about saving the digital world across 5 chapters.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1737071600/ctrlsthegame_m1tg5l.png',
    category: 'Story',
    inspiration: 'Zork / Text Adventures',
    inspirationNote: 'Classic interactive fiction meets Matrix lore — type commands, make choices, save reality.',
    controls: 'Type commands, use arrow keys to navigate, ENTER to confirm choices',
  },
  {
    id: 'snake-classic',
    title: 'Snake Classic',
    description: 'Navigate through the matrix collecting data fragments to grow longer.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1737071599/matrixsnake2_jw29w1.png',
    category: 'Arcade',
    inspiration: 'Nokia Snake (1998)',
    inspirationNote: 'The game that defined a generation of mobile gaming — now dripping in Matrix green.',
    controls: 'Arrow keys to move, SPACE to toggle direction mode',
  },
  {
    id: 'vortex-pong',
    title: 'Vortex Pong',
    description: 'Battle a ruthless AI opponent in a hypnotic arena with power-ups.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1737071596/vortexpong2_hkjn4k.png',
    category: 'Classic',
    inspiration: 'Pong (1972)',
    inspirationNote: 'The original video game, reimagined with vortex physics and Matrix aesthetics.',
    controls: 'Mouse to move paddle, SPACE to hit ball',
  },
  {
    id: 'matrix-cloud',
    title: 'Matrix Cloud',
    description: 'Navigate through gaps in the digital storm — one wrong move and you crash.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1737071594/matrixcloud_rw8hsa.png',
    category: 'Arcade',
    inspiration: 'Flappy Bird (2013)',
    inspirationNote: 'The brutally addictive one-tap classic, wrapped in cascading code rain.',
    controls: 'SPACE or Click to flap, avoid obstacles',
  },
  {
    id: 'matrix-invaders',
    title: 'Matrix Invaders',
    description: 'Defend against waves of code invaders with bullet time and combo chains.',
    preview: matrixInvadersPreview,
    category: 'Shooter',
    inspiration: 'Space Invaders (1978)',
    inspirationNote: "Taito's genre-defining shooter — now with virus splitting, boss waves, and power-ups.",
    controls: 'Arrow keys to move, SPACE to fire, B to activate bullet time',
  },
  {
    id: 'metris',
    title: 'Metris',
    description: 'Stack falling code blocks, clear lines, and activate bullet time mode.',
    preview: metrisPreview,
    category: 'Puzzle',
    inspiration: 'Tetris (1985)',
    inspirationNote: "Alexey Pajitnov's masterpiece gets a Matrix makeover with slow-motion mechanics.",
    controls: 'Arrow keys to move, Z/X to rotate, SPACE to drop, B for bullet time',
  },
  {
    id: 'matrix-frogger',
    title: 'Matrix Frogger',
    description: 'Cross dangerous lanes packed with Agents and Sentinels to reach safety.',
    preview: matrixFroggerPreview,
    category: 'Arcade',
    inspiration: 'Frogger (1981)',
    inspirationNote: "Konami's road-crossing classic, but the traffic is Agent Smith and his clones.",
    controls: 'Arrow keys to move between lanes',
  },
  {
    id: 'neo-jump',
    title: 'Neo Jump',
    description: 'Jump through simulation layers, collect power-ups, and reach The Source.',
    preview: neoJumpPreview,
    category: 'Classic',
    inspiration: 'Doodle Jump (2009)',
    inspirationNote: 'The endless vertical platformer — with jetpacks, springs, and Matrix platforms.',
    controls: 'Arrow keys to move left/right, SPACE to jump',
  },
  {
    id: 'agent-chase',
    title: 'Agent Chase',
    description: 'Navigate a maze collecting data pills while evading the relentless Agent Smith.',
    preview: agentChasePreview,
    category: 'Classic',
    inspiration: 'Pac-Man (1980)',
    inspirationNote: "Namco's dot-munching legend — you're Neo, the ghosts are Agents, the dots are data.",
    controls: 'Arrow keys to move, SPACE to use power-up',
  },
  {
    id: 'rhythm-hacker',
    title: 'Rhythm Hacker',
    description: 'Hack through streams of falling code by hitting keys in time with the beat.',
    preview: rhythmHackerPreview,
    category: 'Rhythm',
    inspiration: 'Guitar Hero / Dance Dance Revolution',
    inspirationNote: 'The rhythm game genre, reimagined as a Matrix hacking sequence with 4 lanes.',
    controls: 'Press keys (1, 2, 3, 4) or Arrow keys to hit notes',
  },
  {
    id: 'cloud-jumper',
    title: 'Cloud Jumper',
    description: 'Leap between clouds in the digital sky, collecting fragments and avoiding the void.',
    preview: cloudJumperPreview,
    category: 'Arcade',
    inspiration: 'Doodle Jump / Platformers',
    inspirationNote: 'Side-scrolling cloud hopping through the Matrix skyline.',
    controls: 'Arrow keys to move, SPACE to jump',
  },
];
