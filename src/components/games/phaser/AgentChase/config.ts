/**
 * Agent Chase - Game Configuration
 *
 * Pacman-style maze game with Matrix theme.
 * Navigate the maze, collect data, avoid Agents.
 */

import Phaser from 'phaser';
import { MATRIX_COLORS } from '../../../../lib/phaser/types';
import { AgentChaseBootScene } from './scenes/BootScene';
import { AgentChaseMenuScene } from './scenes/MenuScene';
import { AgentChaseGameScene } from './scenes/GameScene';
import { AgentChaseGameOverScene } from './scenes/GameOverScene';

/** Game constants */
export const GAME_CONFIG = {
  /** Game dimensions */
  WIDTH: 560,
  HEIGHT: 620,

  /** Tile/cell size */
  TILE_SIZE: 20,

  /** Maze dimensions (28x31 classic) */
  MAZE_COLS: 28,
  MAZE_ROWS: 31,

  /** Player settings */
  PLAYER: {
    SPEED: 150,
    SIZE: 18,
  },

  /** Ghost/Agent settings */
  AGENTS: {
    SPEED_NORMAL: 120,
    SPEED_FRIGHTENED: 60,
    SPEED_RETURNING: 200,
    FRIGHTENED_DURATION: 8000,
    FRIGHTENED_WARNING: 3000, // Start flashing
    RELEASE_INTERVAL: 5000, // Time between releasing agents from house
  },

  /** Agent types with their AI behaviours */
  AGENT_TYPES: {
    SMITH: { color: 0xff0000, name: 'Smith', behaviour: 'chase' },
    BROWN: { color: 0xffb8ff, name: 'Brown', behaviour: 'ambush' },
    JONES: { color: 0x00ffff, name: 'Jones', behaviour: 'patrol' },
    JOHNSON: { color: 0xffb852, name: 'Johnson', behaviour: 'flank' },
  },

  /** Scoring */
  SCORING: {
    DOT: 10,
    POWER_PELLET: 50,
    GHOST_BASE: 200, // Doubles each ghost: 200, 400, 800, 1600
    FRUIT: [100, 200, 300, 500, 700, 1000],
    LEVEL_BONUS: 1000,
  },

  /** Fruit spawn timing */
  FRUIT: {
    FIRST_SPAWN: 70, // Dots eaten
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
  EAT_ALL_GHOSTS: 'agentchase_eat_all', // 4 ghosts in one power pellet
  COLLECT_FRUIT: 'agentchase_fruit',
  SURVIVE_5_LEVELS: 'agentchase_5_levels',
  NO_DEATH_LEVEL: 'agentchase_no_death',
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
  scene: [AgentChaseBootScene, AgentChaseMenuScene, AgentChaseGameScene, AgentChaseGameOverScene],
  input: {
    keyboard: true,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
};

/** Classic Pacman maze layout (1 = wall, 0 = path, 2 = dot, 3 = power pellet, 4 = ghost house, 5 = tunnel) */
export const MAZE_LAYOUT = [
  '1111111111111111111111111111',
  '1222222222222112222222222221',
  '1211112111112112111121111121',
  '1311112111112112111121111131',
  '1211112111112112111121111121',
  '1222222222222222222222222221',
  '1211112112111111112112111121',
  '1211112112111111112112111121',
  '1222222112222112222112222221',
  '1111112111110110111112111111',
  '0000012111110110111112100000',
  '0000012110000000001112100000',
  '0000012110111441110112100000',
  '1111112110100000010112111111',
  '5000002000100000010002000005',
  '1111112110100000010112111111',
  '0000012110111111110112100000',
  '0000012110000000001112100000',
  '0000012110111111110112100000',
  '1111112110111111110112111111',
  '1222222222222112222222222221',
  '1211112111112112111121111121',
  '1211112111112112111121111121',
  '1322112222222002222222112231',
  '1112112112111111112112112111',
  '1112112112111111112112112111',
  '1222222112222112222112222221',
  '1211111111112112111111111121',
  '1211111111112112111111111121',
  '1222222222222222222222222221',
  '1111111111111111111111111111',
];
