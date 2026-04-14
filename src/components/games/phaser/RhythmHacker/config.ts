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
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';

/** Game constants */
export const GAME_CONFIG = {
  /** Game dimensions — widened from 600 to 800 to reduce pillarboxing in 16:9 container */
  WIDTH: 800,
  HEIGHT: 700,

  /** Lane configuration */
  LANES: {
    COUNT: 4,
    KEYS: ['D', 'F', 'J', 'K'],
    COLORS: [0x00ff00, 0x00ffff, 0x00cc00, 0xccffcc], // Green, Cyan, Dark Green, Light Green
    WIDTH: 100,
    SPACING: 15,
  },

  /** Note settings */
  NOTES: {
    HEIGHT: 30,
    SPEED: 400, // pixels per second
    SPAWN_HEIGHT: -50,
    HIT_LINE_Y: 640,
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
    EMPTY_HIT_PENALTY: 2,
    GOOD_HEAL: 1,
    GREAT_HEAL: 2,
    PERFECT_HEAL: 5,
  },

  /** Countdown timing (ms) */
  COUNTDOWN: {
    DURATION: 5000,
    GO_DISPLAY_END: 5500,
    NOTES_START: 6000,
  },

  /** Track settings */
  TRACKS: [
    { name: 'IN THE MOONLIGHT', bpm: 100, duration: 120, difficulty: 'easy', audioUrl: '/assets/rhythm-hacker/tracks/in-the-moonlight.mp3' },
    { name: "CYBERPUNKIN'", bpm: 120, duration: 150, difficulty: 'normal', audioUrl: '/assets/rhythm-hacker/tracks/cyberpunkin.mp3' },
    { name: 'CYBERPSYCHOTIC', bpm: 140, duration: 150, difficulty: 'hard', audioUrl: '/assets/rhythm-hacker/tracks/cyberpsychotic.mp3' },
    { name: 'ENHANCEMENTS', bpm: 160, duration: 200, difficulty: 'insane', audioUrl: '/assets/rhythm-hacker/tracks/enhancements.mp3' },
    { name: 'RESONANCE', bpm: 150, duration: 180, difficulty: 'insane', audioUrl: '/assets/rhythm-hacker/tracks/ostcrunch2-resonance.mp3' },
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
  scene: [RhythmHackerBootScene, RhythmHackerMenuScene, RhythmHackerGameScene, RhythmHackerGameOverScene, HighScoreEntryScene],
  input: {
    keyboard: true,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
};
