/**
 * Cloud Jumper - Game Configuration
 *
 * Flappy Bird / Doodle Jump hybrid side-scroller.
 * Jump between clouds from airplane window POV.
 */

import Phaser from 'phaser';
import { CloudJumperBootScene } from './scenes/BootScene';
import { CloudJumperMenuScene } from './scenes/MenuScene';
import { CloudJumperGameScene } from './scenes/GameScene';
import { CloudJumperGameOverScene } from './scenes/GameOverScene';

/** Game constants */
export const GAME_CONFIG = {
  /** Game dimensions */
  WIDTH: 800,
  HEIGHT: 500,

  /** Player settings */
  PLAYER: {
    WIDTH: 32,
    HEIGHT: 32,
    JUMP_VELOCITY: -400,
    GRAVITY: 800,
    MAX_FALL_SPEED: 500,
    START_X: 150,
    START_Y: 250,
  },

  /** Cloud/platform settings */
  CLOUDS: {
    WIDTH_MIN: 80,
    WIDTH_MAX: 150,
    HEIGHT: 30,
    SPACING_MIN: 100,
    SPACING_MAX: 200,
    VERTICAL_RANGE: 150, // Max vertical distance from center
  },

  /** Cloud types */
  CLOUD_TYPES: {
    NORMAL: { weight: 0.6, color: 0xffffff },
    MOVING: { weight: 0.2, color: 0xaaddff },
    DISAPPEARING: { weight: 0.1, color: 0xffddaa },
    STORM: { weight: 0.1, color: 0x666699 },
  },

  /** Auto-scroll speed (increases over time) */
  SCROLL: {
    SPEED_BASE: 100,
    SPEED_MAX: 300,
    ACCELERATION: 5, // per second
  },

  /** Collectibles */
  COLLECTIBLES: {
    SPAWN_CHANCE: 0.3,
    POINT_VALUE: 100,
    TYPES: ['star', 'gem', 'coin'],
  },

  /** Obstacles */
  OBSTACLES: {
    SPAWN_DISTANCE: 500, // Start spawning after this distance
    SPAWN_CHANCE_BASE: 0.1,
    SPAWN_CHANCE_MAX: 0.3,
    TYPES: ['bird', 'plane'],
  },

  /** Scoring */
  SCORING: {
    DISTANCE_DIVISOR: 10, // Score = distance / 10
    CLOUD_BONUS: 10,
    COLLECTIBLE: 100,
  },
} as const;

/** Achievement IDs */
export const ACHIEVEMENTS = {
  FIRST_JUMP: 'cloud_first_jump',
  DISTANCE_500: 'cloud_distance_500',
  DISTANCE_2000: 'cloud_distance_2000',
  COLLECT_10: 'cloud_collect_10',
  SURVIVE_STORM: 'cloud_survive_storm',
  BOUNCE_STREAK: 'cloud_bounce_10', // 10 bounces without missing
  CLOSE_CALL: 'cloud_close_call', // Near miss with obstacle
} as const;

/** Phaser game configuration */
export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  backgroundColor: 0x87ceeb, // Sky blue
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GAME_CONFIG.PLAYER.GRAVITY },
      debug: false,
    },
  },
  scene: [CloudJumperBootScene, CloudJumperMenuScene, CloudJumperGameScene, CloudJumperGameOverScene],
  input: {
    keyboard: true,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
};
