/**
 * Rhythm Hacker - Game Configuration
 *
 * Guitar Hero-style rhythm game with Matrix theme.
 */

import Phaser from 'phaser';
import { MATRIX_COLORS, PHASER_RENDER_DEFAULTS } from '../../../../lib/phaser/types';
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
    KEYS: ['Q', 'W', 'O', 'P'],
    COLORS: [0x00ff00, 0x00ffff, MATRIX_COLORS.MEDIUM_GREEN, 0xccffcc], // Green, Cyan, Dark Green, Light Green
    WIDTH: 100,
    SPACING: 15,
  },

  /**
   * Note settings.
   *
   * R86.R2 — `HIT_LINE_Y` lifted from 640 → 560 (and `SPAWN_HEIGHT` dropped
   * from −50 → −130 to preserve note travel time at 1725 ms). The original
   * values placed the hit line + key indicators (HIT_LINE_Y + 35 = 675) inside
   * the bottom 25 px of the 700-tall canvas, where the iPod portal's dashbar
   * chrome (exit / help / pause / trophy icons) paints over the playfield.
   * Tom's 2026-04-22 verdict: *"the pause button II in the dashbar centre sits
   * squarely on top of lane 2/3 hit-zones"* — game literally unplayable.
   *
   * Lifting the hit line by 80 px places the entire interactive band
   * (hit line, key indicators, lane labels) in the canvas's clear top
   * 600 px, with the bottom 100 px reserved as a safe zone the dashbar can
   * paint over without obscuring play. `SPAWN_HEIGHT` shifts by the same
   * 80 px so `(HIT_LINE_Y - SPAWN_HEIGHT) / SPEED * 1000` stays at 1725 ms —
   * note approach feel is preserved exactly. Canvas `HEIGHT` stays at 700 to
   * avoid forcing a parallel MenuScene rework (R86.R3 covers that separately).
   */
  NOTES: {
    HEIGHT: 30,
    SPEED: 400, // pixels per second
    SPAWN_HEIGHT: -130,
    HIT_LINE_Y: 560,
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

  /**
   * R87.RH1 — Track-complete banner hold duration (ms).
   *
   * Why this exists: Tom finished a track and saw no "LEVEL COMPLETE" /
   * "TRACK COMPLETE" feedback before the scene transitioned — the hand-off
   * felt like a silent cut to the scoreboard. A 1800 ms hold is long enough
   * for the player to read the banner + feel the win moment but short enough
   * that impatient players aren't held hostage (mirrors Agent Chase's
   * `LEVEL_CLEAR_DELAY_MS = 1800` cadence after R87.AC1).
   *
   * Why the constant instead of a literal: future tuning against playtest
   * feel should not require grepping the scene body, and the regression test
   * that locks "banner holds before gameOver fires" reads `TRACK_COMPLETE.
   * BANNER_HOLD_MS` directly so any drift in the literal fails one obvious
   * assertion instead of being tracked across disparate sites.
   */
  TRACK_COMPLETE: {
    BANNER_HOLD_MS: 1800,
  },

  /**
   * R87.RH2 — Track duration cap (ms).
   *
   * Why this exists: Tom's 2026-04-23 playtest — *"we need to make the songs
   * 2 minutes at max, they are too long"*. Every track in `TRACKS` below
   * overruns 120 s (shortest is CYBERPSYCHOTIC at 148 s, longest is
   * ENHANCEMENTS at 252 s), and extended play sessions at full note density
   * sap engagement before the natural-end win feedback fires.
   *
   * Why a scene-side cap instead of trimming audio assets: keeps the asset
   * pipeline untouched (4 of the 5 tracks are already over the 5 MB PWA
   * precache threshold — re-rendering would churn the runtime CacheFirst
   * strategy), composes cleanly with the R87.RH1 win-flow (the same
   * `trackComplete()` banner + deferred gameOver path fires whether the
   * track ends naturally at a chart boundary OR at the 120 s guillotine),
   * and the regression test at the end-check boundary locks the `>=`
   * operator so a drift to `>` lets the track overrun by one frame.
   *
   * Why the HUD also scales to this value: if the TIME panel still counts
   * down from the underlying track duration (e.g. 228 s for IN THE
   * MOONLIGHT) but the scene ends at 120 s, the player sees "TIME 108s"
   * on their final frame before the TRACK COMPLETE banner — visually
   * confusing. Scaling the HUD to `min(trackDuration, MAX_DURATION_MS)`
   * means the countdown hits 0 exactly when the guillotine fires.
   */
  TRACK: {
    MAX_DURATION_MS: 120000,
  },

  /** Track settings — BPM verified via FL Studio project screenshots + multi-method onset detection */
  TRACKS: [
    { name: 'IN THE MOONLIGHT', bpm: 100, duration: 228, difficulty: 'easy', audioUrl: '/assets/rhythm-hacker/tracks/in-the-moonlight.mp3' },
    { name: "CYBERPUNKIN'", bpm: 118, duration: 200, difficulty: 'normal', audioUrl: '/assets/rhythm-hacker/tracks/cyberpunkin.mp3' },
    { name: 'CYBERPSYCHOTIC', bpm: 140, duration: 148, difficulty: 'hard', audioUrl: '/assets/rhythm-hacker/tracks/cyberpsychotic.mp3' },
    { name: 'ENHANCEMENTS', bpm: 160, duration: 252, difficulty: 'insane', audioUrl: '/assets/rhythm-hacker/tracks/enhancements.mp3' },
    { name: 'RESONANCE', bpm: 110, duration: 208, difficulty: 'insane', audioUrl: '/assets/rhythm-hacker/tracks/ostcrunch2-resonance.mp3' },
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
    ...PHASER_RENDER_DEFAULTS,
    pixelArt: false,
    antialias: true,
  },
};
