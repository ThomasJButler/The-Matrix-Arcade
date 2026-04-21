/**
 * Neo Jump - Game Configuration
 *
 * Doodle Jump-style vertical platformer with Matrix theme.
 * Auto-bounce on platforms, reach maximum altitude.
 */

import Phaser from 'phaser';
import { MATRIX_COLORS, PHASER_RENDER_DEFAULTS } from '../../../../lib/phaser/types';
import { NeoJumpBootScene } from './scenes/BootScene';
import { NeoJumpMenuScene } from './scenes/MenuScene';
import { NeoJumpGameScene } from './scenes/GameScene';
import { NeoJumpGameOverScene } from './scenes/GameOverScene';
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';

/** Game constants */
export const GAME_CONFIG = {
  /** Game dimensions */
  WIDTH: 400,
  HEIGHT: 600,

  /** Player settings */
  PLAYER: {
    WIDTH: 32,
    HEIGHT: 40,
    JUMP_VELOCITY: -550,
    SPRING_VELOCITY: -800,
    JETPACK_THRUST: -300,
    MOVE_SPEED: 300,
    MAX_VELOCITY_Y: 600,
  },

  /** Platform settings */
  PLATFORMS: {
    WIDTH: 80,
    HEIGHT: 16,
    SPACING_MIN: 50,
    SPACING_MAX: 100,
    HORIZONTAL_PADDING: 50,
  },

  /** Platform types and their probabilities at different altitudes */
  PLATFORM_TYPES: {
    NORMAL: 'normal',
    MOVING: 'moving',
    SPRING: 'spring',
    DISAPPEARING: 'disappearing',
    BREAKABLE: 'breakable',
  },

  /** Enemy settings */
  ENEMIES: {
    SPAWN_ALTITUDE: 500,
    SPAWN_CHANCE_BASE: 0.03,
    SPAWN_CHANCE_MAX: 0.20,
    SPAWN_CHANCE_PER_1000: 0.02,
    SPEED_MIN: 50,
    SPEED_MAX: 100,
  },

  /** Jetpack settings */
  JETPACK: {
    FUEL_MAX: 100,
    FUEL_REGEN: 5, // per second on platform
    FUEL_DRAIN: 30, // per second while flying
  },

  /** Physics */
  PHYSICS: {
    GRAVITY: 800,
  },

  /** Collectibles */
  COLLECTIBLES: {
    SPAWN_CHANCE: 0.25,
    SPAWN_ALTITUDE: 200,
    SIZE: 24,
    FUEL_RESTORE: 50,
    SCORE_BONUS: 500,
    SHIELD_DURATION: 5000,
  },

  /** Scoring */
  SCORING: {
    ALTITUDE_DIVISOR: 10, // score = altitude / 10
    ENEMY_KILL: 100,
  },

  /** Parallax depth layers */
  PARALLAX: {
    LAYERS: [
      { key: 'skyline',       scrollFactor: 0.3, depth: -40, color: 0x004400 },
      { key: 'mid_buildings', scrollFactor: 0.5, depth: -30, color: MATRIX_COLORS.DEEP_GREEN },
      { key: 'near_arches',   scrollFactor: 0.7, depth: -20, color: MATRIX_COLORS.DIM_GREEN },
    ],
    RAIN_DEPTH: -50,
  },
} as const;

/** Achievement IDs for Neo Jump */
export const ACHIEVEMENTS = {
  FIRST_JUMP: 'neojump_first_jump',
  ALTITUDE_1000: 'neojump_altitude_1000',
  ALTITUDE_5000: 'neojump_altitude_5000',
  KILL_ENEMY: 'neojump_kill_enemy',
  KILL_5_ENEMIES: 'neojump_kill_5',
  USE_JETPACK: 'neojump_jetpack',
  SPRING_BOUNCE: 'neojump_spring',
  COMBO_BOUNCE: 'neojump_combo_5', // 5 bounces without touching ground
  COLLECT_SHIELD: 'neojump_shield',
  COLLECT_10: 'neojump_collect_10',
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
      gravity: { x: 0, y: GAME_CONFIG.PHYSICS.GRAVITY },
      debug: false,
    },
  },
  scene: [NeoJumpBootScene, NeoJumpMenuScene, NeoJumpGameScene, NeoJumpGameOverScene, HighScoreEntryScene],
  input: {
    keyboard: true,
  },
  render: {
    ...PHASER_RENDER_DEFAULTS,
    pixelArt: true,
    antialias: false,
  },
};
