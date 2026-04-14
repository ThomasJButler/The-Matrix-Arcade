/**
 * Agent Chase - Game Configuration
 *
 * Pacman-style maze game with Matrix theme.
 * Navigate the maze, collect data, avoid Agents.
 * Three map layouts cycle each level for variety.
 */

import Phaser from 'phaser';
import { MATRIX_COLORS } from '../../../../lib/phaser/types';
import { AgentChaseBootScene } from './scenes/BootScene';
import { AgentChaseMenuScene } from './scenes/MenuScene';
import { AgentChaseGameScene } from './scenes/GameScene';
import { AgentChaseGameOverScene } from './scenes/GameOverScene';
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';

/** Game constants */
export const GAME_CONFIG = {
  WIDTH: 560,
  HEIGHT: 620,
  TILE_SIZE: 20,
  MAZE_COLS: 28,
  MAZE_ROWS: 31,

  PLAYER: {
    SPEED: 150,
    SIZE: 28,
  },

  AGENTS: {
    SPEED_NORMAL: 120,
    SPEED_FRIGHTENED: 60,
    SPEED_RETURNING: 200,
    FRIGHTENED_DURATION: 8000,
    FRIGHTENED_WARNING: 3000,
    FRIGHTENED_MIN: 3000,
    RELEASE_INTERVAL: 5000,
    RELEASE_MIN: 2000,
    SPEED_INCREASE_PER_LEVEL: 0.05,
  },

  AGENT_TYPES: {
    SMITH: { color: 0xff0000, name: 'Smith', behaviour: 'chase' },
    BROWN: { color: 0xffb8ff, name: 'Brown', behaviour: 'ambush' },
    JONES: { color: 0x00ffff, name: 'Jones', behaviour: 'patrol' },
    JOHNSON: { color: 0xffb852, name: 'Johnson', behaviour: 'flank' },
  },

  SCORING: {
    DOT: 10,
    POWER_PELLET: 50,
    BULLET_TIME_DOT: 100,
    GHOST_BASE: 200,
    FRUIT: [100, 200, 300, 500, 700, 1000],
    LEVEL_BONUS: 1000,
  },

  BULLET_TIME: {
    FREEZE_DURATION: 2000,  // ms agents stay frozen
    SPAWN_INTERVAL: 15000,  // ms between spawn attempts
    SPAWN_CHANCE: 0.5,      // 50% chance per attempt
    MAX_ON_MAP: 1,          // max bullet-time dots on the map
  },

  FRUIT: {
    FIRST_SPAWN: 70,
    SECOND_SPAWN: 170,
    DURATION: 10000,
  },
} as const;

/** Achievement IDs for Agent Chase */
export const ACHIEVEMENTS = {
  FIRST_DOT: 'agentchase_first_dot',
  FIRST_GHOST: 'agentchase_first_ghost',
  CLEAR_LEVEL: 'agentchase_clear_level',
  SCORE_10000: 'agentchase_score_10000',
  EAT_ALL_GHOSTS: 'agentchase_eat_all',
  COLLECT_FRUIT: 'agentchase_fruit',
  SURVIVE_5_LEVELS: 'agentchase_5_levels',
  NO_DEATH_LEVEL: 'agentchase_no_death',
  ALL_MAZES: 'agentchase_all_mazes',
} as const;

/** Phaser game configuration */
export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  backgroundColor: MATRIX_COLORS.BACKGROUND,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [AgentChaseBootScene, AgentChaseMenuScene, AgentChaseGameScene, AgentChaseGameOverScene, HighScoreEntryScene],
  input: {
    keyboard: true,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
};

/** Map layout definition */
export interface MapLayout {
  name: string;
  grid: string[];
  tunnelRow: number;
  playerStart: { x: number; y: number };
  agentHomes: Array<{
    type: 'smith' | 'brown' | 'jones' | 'johnson';
    gridX: number;
    gridY: number;
    scatterTarget: { x: number; y: number };
  }>;
  fruitPosition: { x: number; y: number };
}

/**
 * Ghost house section shared by all layouts (rows 9-19).
 * Identical across maps so agent AI, tunnel wrapping,
 * and release mechanics work consistently.
 */
const GHOST_HOUSE_SECTION = [
  '1111112111110110111112111111', // row 9
  '0000012111110110111112100000', // row 10
  '0000012110000000001112100000', // row 11
  '0000012110111441110112100000', // row 12  ghost house gate
  '1111112110100000010112111111', // row 13
  '5000002000100000010002000005', // row 14  tunnel
  '1111112110100000010112111111', // row 15
  '0000012110111111110112100000', // row 16
  '0000012110000000001112100000', // row 17
  '0000012110111111110112100000', // row 18
  '1111112110111111110112111111', // row 19
];

/** Shared agent configuration — ghost house is identical across layouts */
const SHARED_AGENT_HOMES: MapLayout['agentHomes'] = [
  { type: 'smith', gridX: 14, gridY: 11, scatterTarget: { x: 25, y: 0 } },
  { type: 'brown', gridX: 14, gridY: 14, scatterTarget: { x: 2, y: 0 } },
  { type: 'jones', gridX: 13, gridY: 14, scatterTarget: { x: 27, y: 30 } },
  { type: 'johnson', gridX: 15, gridY: 14, scatterTarget: { x: 0, y: 30 } },
];

/** Layout 1 — Classic (the original Pac-Man inspired layout) */
export const LAYOUT_CLASSIC: MapLayout = {
  name: 'CLASSIC',
  tunnelRow: 14,
  playerStart: { x: 13, y: 23 },
  agentHomes: SHARED_AGENT_HOMES,
  fruitPosition: { x: 14, y: 17 },
  grid: [
    '1111111111111111111111111111', // 0
    '1222222222222112222222222221', // 1
    '1211112111112112111121111121', // 2
    '1311112111112112111121111131', // 3
    '1211112111112112111121111121', // 4
    '1222222222222222222222222221', // 5
    '1211112112111111112112111121', // 6
    '1211112112111111112112111121', // 7
    '1222222112222112222112222221', // 8
    ...GHOST_HOUSE_SECTION,         // 9-19
    '1222222222222112222222222221', // 20
    '1211112111112112111121111121', // 21
    '1211112111112112111121111121', // 22
    '1322112222222002222222112231', // 23
    '1112112112111111112112112111', // 24
    '1112112112111111112112112111', // 25
    '1222222112222112222112222221', // 26
    '1211111111112112111111111121', // 27
    '1211111111112112111111111121', // 28
    '1222222222222222222222222221', // 29
    '1111111111111111111111111111', // 30
  ],
};

/** Layout 2 — Open Arena (wider corridors, agents have more room to chase) */
export const LAYOUT_ARENA: MapLayout = {
  name: 'ARENA',
  tunnelRow: 14,
  playerStart: { x: 13, y: 22 },
  agentHomes: SHARED_AGENT_HOMES,
  fruitPosition: { x: 14, y: 17 },
  grid: [
    '1111111111111111111111111111', // 0
    '1222222222222222222222222221', // 1
    '1212221221122112212212221121', // 2
    '1312221221122112212212221131', // 3
    '1212221221122112212212221121', // 4
    '1222222222222222222222222221', // 5
    '1212221112111111112111222121', // 6
    '1222222112222222222112222221', // 7
    '1222222112222112222112222221', // 8
    ...GHOST_HOUSE_SECTION,         // 9-19
    '1222222222222112222222222221', // 20
    '1212221221122112212212221121', // 21
    '1322222222222002222222222231', // 22
    '1212221112111111112111222121', // 23
    '1222222112222222222112222221', // 24
    '1212221221122112212212221121', // 25
    '1222222222222222222222222221', // 26
    '1212221221122112212212221121', // 27
    '1222222222222222222222222221', // 28
    '1212221221122112212212221121', // 29
    '1111111111111111111111111111', // 30
  ],
};

/** Layout 3 — Tight Maze (narrow corridors, harder to escape agents) */
export const LAYOUT_MAZE: MapLayout = {
  name: 'LABYRINTH',
  tunnelRow: 14,
  playerStart: { x: 13, y: 22 },
  agentHomes: SHARED_AGENT_HOMES,
  fruitPosition: { x: 14, y: 17 },
  grid: [
    '1111111111111111111111111111', // 0
    '1222222222222222222222222221', // 1
    '1211212112112112112112121121', // 2
    '1311212112112112112112121131', // 3
    '1211212112112112112112121121', // 4
    '1222222222222222222222222221', // 5
    '1211212112111111112112121121', // 6
    '1222212112222222222112122221', // 7
    '1222222112222112222112222221', // 8
    ...GHOST_HOUSE_SECTION,         // 9-19
    '1222222222222112222222222221', // 20
    '1211212112112112112112121121', // 21
    '1322212222222002222212222131', // 22
    '1211212112112112112112121121', // 23
    '1222222112222222222112222221', // 24
    '1211212112112112112112121121', // 25
    '1222222222222222222222222221', // 26
    '1211212112112112112112121121', // 27
    '1222222222222222222222222221', // 28
    '1211212112112112112112121121', // 29
    '1111111111111111111111111111', // 30
  ],
};

/** All available layouts, indexed by level cycle */
export const MAP_LAYOUTS: MapLayout[] = [LAYOUT_CLASSIC, LAYOUT_ARENA, LAYOUT_MAZE];

/** Get layout for a given level (cycles through all 3) */
export function getLayoutForLevel(level: number): MapLayout {
  return MAP_LAYOUTS[(level - 1) % MAP_LAYOUTS.length];
}
