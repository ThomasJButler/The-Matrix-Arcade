import { GameCategory } from '../types/game';
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
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1776588235/Tom_the_most_epic_logo_in_the_entire_world_matrix_green_style_5ce1742c-0357-4606-b29e-ad80e9a5d79f_3_db4csn.png',
    category: 'Story',
    inspiration: 'Zork / Text Adventures',
    inspirationNote: 'Classic interactive fiction meets Matrix lore — type commands, make choices, save reality.',
    controls: 'Type commands, use arrow keys to navigate, ENTER to confirm choices',
  },
  {
    id: 'snake-classic',
    title: 'Matrix Snake',
    description: 'Slither through the cascade — devour data fragments, dodge walls, grow longer.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1737071599/matrixsnake2_jw29w1.png',
    category: 'Arcade',
    inspiration: 'Nokia Snake (1998)',
    inspirationNote: 'The game that defined a generation of mobile gaming — now dripping in Matrix green.',
    controls: 'Arrow keys/WASD to move. Collect food, avoid walls!',
  },
  {
    id: 'vortex-pong',
    title: 'Vortex Pong',
    description: 'Battle a ruthless AI opponent in a hypnotic arena with power-ups.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1737071596/vortexpong2_hkjn4k.png',
    category: 'Classic',
    inspiration: 'Pong (1972)',
    inspirationNote: 'The original video game, reimagined with vortex physics and Matrix aesthetics.',
    controls: 'Arrow keys / WASD / Mouse: Move paddle | First to 10 wins',
  },
  {
    id: 'matrix-cloud',
    title: 'Matrix Bird',
    description: 'Flap between pipes in the code cascade — one missed beat and gravity wins.',
    preview: '/assets/matrix-cloud/preview.svg',
    category: 'Arcade',
    inspiration: 'Flappy Bird (2013)',
    inspirationNote: 'The brutally addictive one-tap classic, wrapped in cascading code rain.',
    controls: 'SPACE/Click to flap. Fly through gaps, collect power-ups, defeat bosses!',
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
    controls: 'Arrows/WASD to move, Z/X to rotate, C to hold, SPACE to hard drop, B for bullet time',
  },
  {
    id: 'matrix-frogger',
    title: 'Matrix Frogger',
    description: 'Cross dangerous lanes packed with Agents and Sentinels to reach safety.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1776588056/A_cascading_stream_of_neon_green_code_over_a_deep_black_backg_b0de650f-ac85-4ab9-bffb-b86402bee8b1_0_gec8cu.png',
    category: 'Arcade',
    inspiration: 'Frogger (1981)',
    inspirationNote: "Konami's road-crossing classic, but the traffic is Agent Smith and his clones.",
    controls: 'Arrow keys/WASD to move, K to Kung Fu attack',
  },
  {
    id: 'neo-jump',
    title: 'Neo Jump',
    description: 'Jump through simulation layers, collect power-ups, and reach The Source.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1776587193/A_surreal_neon_green_vortex_spiraling_into_an_endless_black_h_599acb93-cc05-4f73-aee9-8c95b57d3366_3_nbsgez.png',
    category: 'Classic',
    inspiration: 'Doodle Jump (2009)',
    inspirationNote: 'The endless vertical platformer — with jetpacks, springs, and Matrix platforms.',
    controls: 'Left/Right/A/D to move, UP/W for jetpack, SPACE to shoot',
  },
  {
    id: 'agent-chase',
    title: 'Agent Chase',
    description: 'Navigate a maze collecting data pills while evading the relentless Agent Smith.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1776587994/A_cascading_stream_of_neon_green_code_over_a_deep_black_backg_33b4ea50-9a04-47ec-8444-710686600395_1_mc7nwg.png',
    category: 'Classic',
    inspiration: 'Pac-Man (1980)',
    inspirationNote: "Namco's dot-munching legend — you're Neo, the ghosts are Agents, the dots are data.",
    controls: 'Arrow keys/WASD to move. Eat power pellets to frighten agents!',
  },
  {
    id: 'rhythm-hacker',
    title: 'Rhythm Hacker',
    description: 'Hack through streams of falling code by hitting keys in time with the beat.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1776587194/A_surreal_neon_green_vortex_spiraling_into_an_endless_black_h_599acb93-cc05-4f73-aee9-8c95b57d3366_1_fvqse1.png',
    category: 'Rhythm',
    inspiration: 'Guitar Hero / Dance Dance Revolution',
    inspirationNote: 'The rhythm game genre, reimagined as a Matrix hacking sequence with 4 lanes.',
    controls: 'D F J K to hit notes in each lane, hold for hold notes',
  },
  {
    id: 'cloud-jumper',
    title: 'Cloud Jumper',
    description: 'Leap between clouds in the digital sky, collecting fragments and avoiding the void.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1776587197/A_fun_matrix-themed_thumbnail_featuring_a_glowing_green_cloud_d08dbf00-8288-43ca-a253-6f35b99efeea_1_hzg1el.png',
    category: 'Arcade',
    inspiration: 'Doodle Jump / Platformers',
    inspirationNote: 'Side-scrolling cloud hopping through the Matrix skyline.',
    controls: 'SPACE/UP/W to jump between clouds',
  },
  {
    id: 'code-breaker',
    title: 'Code Breaker',
    description: 'Smash through firewalls of encrypted code to escape the simulation.',
    preview: 'https://res.cloudinary.com/depqttzlt/image/upload/v1776587188/A_hackers_console_glowing_in_neon_green_fragmented_codes_and__92d98883-0478-47e8-be6c-bfcd655b657d_2_dpmtan.png',
    category: 'Arcade',
    inspiration: 'Breakout / Arkanoid (1986)',
    inspirationNote: "Atari's brick-smashing classic, reimagined as a hacker breaking through layers of Matrix firewall code.",
    controls: 'Arrow keys / Mouse: Move paddle | SPACE: Launch ball | B: Bullet time',
  },
];
