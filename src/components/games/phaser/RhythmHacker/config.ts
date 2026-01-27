/**
 * Rhythm Hacker - Game Configuration
 *
 * Guitar Hero-style rhythm game with Matrix theme.
 */

import Phaser from 'phaser';
import { MATRIX_COLORS } from '../../../../lib/phaser/types';
import { RhythmHackerBootScene } from './scenes/BootScene';
import { RhythmHackerMenuScene } from './scenes/MenuScene';
import { RhythmHackerGameScene } from './scenes/GameScene';
import { RhythmHackerGameOverScene } from './scenes/GameOverScene';

/** Game constants */
export const GAME_CONFIG = {
  /** Game dimensions */
  WIDTH: 600,
  HEIGHT: 700,

  /** Lane configuration */
  LANES: {
    COUNT: 4,
    KEYS: ['D', 'F', 'J', 'K'],
    COLORS: [0xff0000, 0x00ff00, 0x0088ff, 0xffff00], // Red, Green, Blue, Yellow
    WIDTH: 80,
    SPACING: 10,
  },

  /** Note settings */
  NOTES: {
    HEIGHT: 30,
    SPEED: 400, // pixels per second
    SPAWN_HEIGHT: -50,
    HIT_LINE_Y: 600,
    HOLD_WIDTH: 60,
  },

  /** Timing windows (ms) */
  TIMING: {
    PERFECT: 40,
    GREAT: 80,
    GOOD: 120,
  },

  /** Scoring */
  SCORING: {
    PERFECT: 300,
    GREAT: 200,
    GOOD: 100,
    MISS: 0,
    COMBO_MULTIPLIER: 0.1, // 10% bonus per 10 combo
  },

  /** Health */
  HEALTH: {
    MAX: 100,
    MISS_DAMAGE: 10,
    GOOD_HEAL: 1,
    GREAT_HEAL: 2,
    PERFECT_HEAL: 5,
  },

  /** Track settings */
  TRACKS: [
    { name: 'EASY MODE', bpm: 100, duration: 60, difficulty: 'easy' },
    { name: 'NORMAL MODE', bpm: 120, duration: 90, difficulty: 'normal' },
    { name: 'HARD MODE', bpm: 140, duration: 120, difficulty: 'hard' },
    { name: 'INSANE MODE', bpm: 180, duration: 150, difficulty: 'insane' },
  ],
} as const;

/** Note type probabilities by difficulty */
export const NOTE_PROBABILITIES = {
  easy: { normal: 1.0, hold: 0.0, double: 0.0 },
  normal: { normal: 0.9, hold: 0.1, double: 0.0 },
  hard: { normal: 0.75, hold: 0.15, double: 0.1 },
  insane: { normal: 0.6, hold: 0.25, double: 0.15 },
} as const;

/** Achievement IDs */
export const ACHIEVEMENTS = {
  FIRST_PERFECT: 'rhythm_first_perfect',
  COMBO_50: 'rhythm_combo_50',
  COMBO_100: 'rhythm_combo_100',
  FULL_COMBO: 'rhythm_full_combo',
  COMPLETE_EASY: 'rhythm_complete_easy',
  COMPLETE_NORMAL: 'rhythm_complete_normal',
  COMPLETE_HARD: 'rhythm_complete_hard',
  COMPLETE_INSANE: 'rhythm_complete_insane',
  NO_MISS: 'rhythm_no_miss',
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
  scene: [RhythmHackerBootScene, RhythmHackerMenuScene, RhythmHackerGameScene, RhythmHackerGameOverScene],
  render: {
    pixelArt: false,
    antialias: true,
  },
};
