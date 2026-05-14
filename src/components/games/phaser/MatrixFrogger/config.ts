/**
 * Matrix Frogger - Game Configuration
 *
 * Frogger-style lane crossing game with Matrix theme.
 * Player navigates through lanes of Agents and Sentinels.
 */

import Phaser from 'phaser';
import { MATRIX_COLORS, PHASER_RENDER_DEFAULTS } from '../../../../lib/phaser/types';
import { FroggerBootScene } from './scenes/BootScene';
import { FroggerMenuScene } from './scenes/MenuScene';
import { FroggerGameScene } from './scenes/GameScene';
import { FroggerGameOverScene } from './scenes/GameOverScene';
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';

/** Game constants */
export const GAME_CONFIG = {
  /** Game dimensions */
  WIDTH: 800,
  HEIGHT: 600,

  /** Grid settings - 64x64 sprites */
  CELL_SIZE: 64,
  GRID_COLS: 12,
  GRID_ROWS: 9,

  /** Player settings */
  PLAYER: {
    START_COL: 6,
    START_ROW: 8,
    MOVE_SPEED: 150, // ms per hop
  },

  /** Lane types */
  LANE_TYPES: {
    SAFE: 'safe',
    ROAD: 'road',
    RIVER: 'river',
  },

  /** Enemy types */
  ENEMIES: {
    AGENT: {
      SPEED_MIN: 80,
      SPEED_MAX: 150,
      FRAME: 0,
    },
    SENTINEL: {
      SPEED_MIN: 200,
      SPEED_MAX: 350,
      FRAME: 1,
    },
  },

  /** Power-up settings */
  POWERUPS: {
    BULLET_TIME: {
      DURATION: 5000,
      SLOW_FACTOR: 0.3,
    },
    GHOST: {
      DURATION: 3000,
    },
    SHIELD: {
      HITS: 1,
    },
    MAGNET: {
      DURATION: 8000,
      RANGE: 3, // cells
    },
    NEO_MODE: {
      DURATION: 8000,
      SCORE_PER_DESTROY: 100,
    },
  },

  /** Countdown before gameplay */
  COUNTDOWN: {
    DURATION: 5,
  },

  /** Kung Fu ability */
  KUNG_FU: {
    MAX_CHARGES: 3,
    RANGE: 1.5, // cells
    COOLDOWN: 500, // ms
  },

  /** Scoring */
  SCORING: {
    STEP_FORWARD: 10,
    RED_PILL: 50,
    BLUE_PILL: 100,
    DODGE_NEAR_MISS: 25,
    COMBO_MULTIPLIER: [1, 2, 3, 4, 5], // at combo 0, 5, 10, 20, 30
    CROSS_BONUS: 500,
    NEO_DESTROY: 100,
  },

  /** Difficulty scaling */
  DIFFICULTY: {
    ENEMY_COUNT_BASE: 3,
    ENEMY_COUNT_PER_100: 1,
    ENEMY_COUNT_MAX: 10,
    SPEED_INCREASE_PER_100: 10,
    CHASING_AGENT_MIN_LEVEL: 3,
    CHASING_AGENT_VERTICAL_SPEED: 30,
  },

  /** Lane visual colours */
  LANE_COLORS: {
    SAFE_ZONE: 0x001a00,
    ROAD_SURFACE: 0x0a0a0a,
    ROAD_MARKING: 0x003300,
    FINISH_LINE: 0x00ff00,
    START_ZONE: 0x001100,
  },

  /** Perspective / pseudo-3D settings */
  PERSPECTIVE: {
    TILT_DEGREES: 25,
    VEHICLE_SCALE_MIN: 0.6,
    VEHICLE_SCALE_MAX: 1.0,
    VEHICLE_ROTATION_DEG: -12,
    LANE_DASH_SPEED: 40,
    WATER_SHIMMER_SPEED: 15,
  },

  /**
   * R86.F4: Hit-box clamping for non-chaser enemies.
   *
   * Why this exists: enemies render with origin(0.5, 1) so their bottoms sit
   * at the lane centre for the perspective lean. Phaser's body.setSize with
   * center=true then anchors the body on the sprite's DISPLAY centre — which
   * is displayHeight/2 ABOVE the lane centre — and at the bigger road lanes
   * this pushes the hit-box past the lane top into the adjacent safe row
   * (e.g. row 5 cars: 40.8px tall display, 66.6px lane → 7.5px poke into the
   * row 4 middle safe zone). WIDTH_RATIO gives lateral forgiveness;
   * HEIGHT_RATIO caps body height at 85% of lane height so it physically
   * cannot exceed the lane. GameScene.spawnEnemy then re-offsets the body so
   * it re-centres on rowToY (the lane centre), not the displaced sprite
   * centre. Chasers are excluded — they cross lanes via verticalSpeed and
   * need their full body.
   */
  HITBOX: {
    WIDTH_RATIO: 0.75,
    HEIGHT_RATIO: 0.85,
  },
} as const;

/** Achievement IDs for Matrix Frogger */
export const ACHIEVEMENTS = {
  FIRST_CROSS: 'frogger_first_cross',
  SCORE_1000: 'frogger_score_1000',
  SCORE_5000: 'frogger_score_5000',
  DODGE_MASTER: 'frogger_dodge_10', // 10 near misses
  BULLET_TIME: 'frogger_bullet_time',
  GHOST_MODE: 'frogger_ghost',
  SHIELD_SAVE: 'frogger_shield_save',
  MAGNET_COLLECTOR: 'frogger_magnet_5', // collect 5 pills with magnet
  COMBO_10: 'frogger_combo_10',
  DISTANCE_500: 'frogger_distance_500',
  KUNG_FU_MASTER: 'frogger_kung_fu_master', // use all 3 kung fu charges
  NEO_UNSTOPPABLE: 'frogger_neo_unstoppable', // destroy 3+ enemies in one NEO activation
  LEVEL_5: 'frogger_level_5', // reach level 5
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
  scene: [FroggerBootScene, FroggerMenuScene, FroggerGameScene, FroggerGameOverScene, HighScoreEntryScene],
  input: {
    keyboard: true,
  },
  render: {
    ...PHASER_RENDER_DEFAULTS,
    pixelArt: true,
    antialias: false,
  },
};
