/**
 * Vortex Pong — Game Configuration
 *
 * Faithful Phaser 3 rebuild of the React/Canvas Vortex Pong.
 * All physics values are in pixels/second (converted from the
 * original per-frame-at-60fps values by multiplying by 60).
 */

import Phaser from 'phaser';
import { MATRIX_COLORS } from '../../../../lib/phaser/types';
import { VortexPongBootScene } from './scenes/BootScene';
import { VortexPongMenuScene } from './scenes/MenuScene';
import { VortexPongGameScene } from './scenes/GameScene';
import { VortexPongGameOverScene } from './scenes/GameOverScene';

export const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 450,

  PADDLE: {
    WIDTH: 12,
    HEIGHT: 80,
    OFFSET_X: 10,
    SPEED: 480,
    BIGGER_MULTIPLIER: 1.5,
  },

  BALL: {
    RADIUS: 6,
    INITIAL_SPEED: 420,
    MAX_SPEED: 900,
    SPEED_RAMP_PER_SECOND: 0.1,
    MAX_BOUNCE_ANGLE: 0.75,
    SPIN_TRANSFER: 0.1,
  },

  AI: {
    INITIAL_DIFFICULTY: 2.5,
    MAX_DIFFICULTY: 5,
    DIFFICULTY_INCREMENT: 0.05,
    MAX_SPEED_FACTOR: 3.5,
    ERROR_MARGIN: 80,
    DAMPING: 0.88,
    MISTAKE_CHANCE: 0.2,
    NEAR_ACCELERATION: 0.3,
    FAR_ACCELERATION: 0.15,
  },

  WIN_SCORE: 10,

  POWERUP: {
    BASE_INTERVAL: 10000,
    MIN_INTERVAL: 5000,
    INTERVAL_REDUCTION: 500,
    DURATION: 10000,
    MAX_ON_FIELD: 2,
    SPAWN_MARGIN: { x: 200, y: 50 },
    COLLISION_RADIUS: 12,
    DISPLAY_RADIUS: 10,
  },

  SHAKE: {
    WALL:      { intensity: 0.003, duration: 100 },
    AI_HIT:    { intensity: 0.005, duration: 100 },
    PLAYER_HIT:{ intensity: 0.006, duration: 100 },
    MULTI_BALL: { intensity: 0.009, duration: 100 },
    GOAL:      { intensity: 0.012, duration: 100 },
    GAME_OVER: { intensity: 0.018, duration: 150 },
  },

  MAX_IMPACT_EFFECTS: 10,
} as const;

export const ACHIEVEMENTS = {
  FIRST_POINT: 'pong_first_point',
  COMBO_KING: 'pong_combo_king',
  RALLY_MASTER: 'pong_rally_master',
  POWER_MASTER: 'pong_power_master',
  BEAT_AI: 'pong_beat_ai',
  PERFECT_GAME: 'pong_perfect_game',
  MULTI_BALL: 'pong_multi_ball',
} as const;

export type PowerUpType = 'bigger_paddle' | 'slower_ball' | 'score_multiplier' | 'multi_ball';

export const POWERUP_DEFS: Record<PowerUpType, { color: number; label: string }> = {
  bigger_paddle:    { color: 0x00ff00, label: 'BIG' },
  slower_ball:      { color: 0x00ffff, label: 'SLOW' },
  score_multiplier: { color: 0xffff00, label: '2X' },
  multi_ball:       { color: 0xff00ff, label: 'MULTI' },
};

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
  scene: [
    VortexPongBootScene,
    VortexPongMenuScene,
    VortexPongGameScene,
    VortexPongGameOverScene,
  ],
  render: {
    pixelArt: true,
    antialias: false,
  },
};
