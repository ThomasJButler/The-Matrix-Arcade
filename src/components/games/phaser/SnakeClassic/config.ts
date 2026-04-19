import Phaser from 'phaser';
import { SnakeBootScene } from './scenes/BootScene';
import { SnakeMenuScene } from './scenes/MenuScene';
import { SnakeGameScene } from './scenes/GameScene';
import { SnakeGameOverScene } from './scenes/GameOverScene';
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type PowerUpType =
  | 'speed'
  | 'double'
  | 'shield'
  | 'ghost'
  | 'reverse'
  | 'hyper'
  | 'glitch';

export interface Position {
  x: number;
  y: number;
}

export const GAME_CONFIG = {
  WIDTH: 640,
  HEIGHT: 400,

  CELL_SIZE: 16,
  GRID_COLS: 20,
  GRID_ROWS: 20,
  GRID_OFFSET_X: 180,
  // Top/bottom walls live at grid-rows -1 and GRID_ROWS. With CELL_SIZE=16 and
  // HEIGHT=400, offset 40 gives symmetric 24px margins above the top wall and
  // below the bottom wall. See R84.S1.
  GRID_OFFSET_Y: 40,

  INITIAL_SPEED: 150,
  SPEED_INCREMENT: 5,
  MIN_SPEED: 50,
  POINTS_PER_SPEED_UP: 50,

  POINTS_PER_FOOD: 10,
  POINTS_PER_FOOD_DOUBLE: 20,

  POWERUP_SPAWN_CHANCE: 0.15,
  POWERUP_FIELD_DURATION: 8000,
  SPEED_POWERUP_DURATION: 5000,
  SPEED_POWERUP_BONUS: 30,
  DOUBLE_POWERUP_COUNT: 3,
  GHOST_POWERUP_DURATION: 7000,
  // R84.S3 — Power-up variety expansion. Tom: "needs more power-up variety".
  // Durations chosen to match the plan brief (reverse 5s, hyper 10s, glitch 3s)
  // and to stay inside the short feedback loop of a Snake run — a 10s hyper
  // is long enough to rack up meaningful 2× points, a 5s reverse is long
  // enough to sting but short enough to recover from, and a 3s glitch is
  // short enough that obscuring the screen reads as "risk sacrifice for
  // bonus points" rather than "unplayable".
  REVERSE_POWERUP_DURATION: 5000,
  HYPER_POWERUP_DURATION: 10000,
  GLITCH_POWERUP_DURATION: 3000,
  GLITCH_PICKUP_BONUS: 100,
  REVERSE_PICKUP_BONUS: 50,
} as const;

export const POWERUP_DEFS: Record<PowerUpType, { color: number; label: string }> = {
  speed: { color: 0xffff00, label: 'SLOW' },
  double: { color: 0x0099ff, label: '2X' },
  shield: { color: 0xff00ff, label: 'SHIELD' },
  ghost: { color: 0x00ffff, label: 'GHOST' },
  // R84.S3 — reverse (RED 0xff3333 — signals "challenge/danger"),
  // hyper (GOLD 0xffaa00 — distinct from YELLOW used by SLOW),
  // glitch (VIOLET 0xaa00ff — distinct from shield's MAGENTA).
  reverse: { color: 0xff3333, label: 'REVERSE' },
  hyper: { color: 0xffaa00, label: 'HYPER' },
  glitch: { color: 0xaa00ff, label: 'GLITCH' },
};

// R84.S3 — Glitch rain overlay parameters. Denser than the R84.S2 play-area
// rain and higher alpha so the 3s effect reads as "screen momentarily taken
// over by raw code" — the risk/reward tradeoff for the +GLITCH_PICKUP_BONUS
// score bump is that gameplay continues behind the overlay (grid collisions
// unchanged) and the player must remember the snake's trajectory.
export const GLITCH_RAIN = {
  DENSITY: 80,
  ALPHA: 0.55,
  FONT_SIZE: 14,
  DEPTH: 200,
  SPEED_MIN: 120,
  SPEED_MAX: 260,
  GLYPHS: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ0123456789',
} as const;

// R84.S2 — Matrix funkiness depth pass. Three atmospheric layers stacked on
// top of the R83.S1 background rain + scanline + chromatic aberration. Tom's
// 2026-04-19 note: "needs more matrix funkiness as it's a bit generic".
//
// (a) Play-area rain — 8 extra glyphs confined inside the grid at 0.15 alpha
//     so it reads as "the playfield is made of code" without fighting the
//     snake sprites for attention (depth -1: below snake at depth 0).
// (b) Snake-head glow — twin concentric PRIMARY-green fillCircles under the
//     head sprite, 8px outer / 6px inner, reads as a headlamp cast across
//     the playfield.
// (c) Bonus food — every Nth food pickup flags the next spawn as a bonus,
//     rendered as a Matrix ASCII glyph (instead of the apple sprite) that
//     awards 2× points. Makes food read as "code eaten by the snake".
export const MATRIX_FUNKINESS = {
  PLAY_AREA_RAIN_DENSITY: 8,
  PLAY_AREA_RAIN_ALPHA: 0.15,
  PLAY_AREA_RAIN_DEPTH: -1,
  PLAY_AREA_RAIN_FONT_SIZE: 12,
  PLAY_AREA_RAIN_SPEED_MIN: 30,
  PLAY_AREA_RAIN_SPEED_MAX: 80,

  HEAD_GLOW_OUTER_RADIUS: 8,
  HEAD_GLOW_INNER_RADIUS: 6,
  HEAD_GLOW_OUTER_ALPHA: 0.22,
  HEAD_GLOW_INNER_ALPHA: 0.5,
  HEAD_GLOW_DEPTH: -1,

  BONUS_FOOD_INTERVAL: 5,
  BONUS_FOOD_POINTS_MULTIPLIER: 2,
  BONUS_FOOD_GLYPHS: 'アイウエオカキクケコサシスセソタチツ0123456789',
  BONUS_FOOD_FONT_SIZE: 18,
  BONUS_FOOD_DEPTH: 5,
} as const;

// R84.S4 — Speed-tier dread build-up. Tom's Snake testing doc flagged the
// top-tier speed feeling under-telegraphed: the game quietly gets faster but
// the sensory envelope stays the same as at level 1. Three synchronised
// effects tied to a single intensity ramp address it:
//
//   (a) Scanline intensification — a second overlay above the baseline
//       scanline fades in proportional to intensity, up to +0.20 extra alpha
//       at full dread (total ~0.38 incl. the 0.18 baseline). Reads as the
//       CRT "tightening" as the run gets dangerous.
//   (b) BGM bass thickening — `BaseScene.playAmbientDrone()` starts under
//       the track when dread kicks in (55 Hz saw+sine through 180 Hz
//       lowpass). The drone is an amplitude-felt layer, not a melodic one,
//       so it doesn't clash with `cruise-control.mp3`'s existing arrangement.
//       Built-in 2 s fade-in + 1 s fade-out so activation/deactivation is
//       smooth; no need to re-implement envelopes here.
//   (c) Camera micro-shake — a periodic `cameras.main.shake()` pulses every
//       `SHAKE_INTERVAL_MS` at intensity-scaled amplitude. Kept well below
//       the death-shake (0.012) so it reads as "pulse under the skin"
//       rather than "thing crashing". Skipped under prefers-reduced-motion
//       (nauseating for sensitive users; audio + scanline still convey the
//       state change).
//
// Thresholds: dread engages once `currentSpeed` drops below START_SPEED (80,
// ≈ level 15 / score 700) and fully peaks at MAX_SPEED (50 = MIN_SPEED, level
// 21 / score 1000). The linear ramp means the earliest dread is barely
// perceptible and the final tiers feel genuinely tense — matches the
// gameplay arc where runs start survivable and end knife-edge.
export const DREAD_BUILDUP = {
  START_SPEED: 80,
  MAX_SPEED: GAME_CONFIG.MIN_SPEED,
  SCANLINE_MAX_ALPHA: 0.2,
  SCANLINE_STRIDE: 3,
  SCANLINE_DEPTH: 101,
  DRONE_VOLUME: 0.08,
  SHAKE_INTERVAL_MS: 450,
  SHAKE_DURATION_MS: 40,
  SHAKE_MAX_INTENSITY: 0.003,
} as const;

// R84.S5 — Snake death cinematic. 300 ms glitch-cascade bridging the moment
// of collision and the Game Over screen, mirroring the R83.CTRLS.12
// "buffer-flushed" failure juice in `CtrlSWorld/scenes/NarrativeScene.ts`
// so the Matrix-collapse visual language stays consistent across the arcade.
//
// Why a cinematic at all: prior to S5, Snake snapped straight from the last
// frame into `gameOver()` after a 600 ms pause filled only by a flat red
// camera flash + shake. Tom's testing doc note "could be more dramatic when
// dying" (line 137 prose) flagged it as under-telegraphed — the eye hasn't
// had time to register WHAT killed the snake before the Game Over panel
// takes over. The cascade occupies the first 300 ms of that 600 ms buffer
// so the dead-head freeze-frame is still visible underneath the bars
// (visual parity with R83.CTRLS.12 which leaves the terminal UI visible
// behind its cascade).
//
// Design choices:
//  - 5 bars (mid of Tom's 4-6 range) evenly spaced vertically. Even spacing
//    (not random Y like CTRLS.12) reads as a top-to-bottom "buffer flush"
//    rather than sparse noise, which suits Snake's shorter 300 ms window.
//  - BAR_COLOR `0xff2040` matches CTRLS.12 exactly — same red hue forms the
//    arcade's "catastrophic failure" palette across both games.
//  - BAR_ALPHA `0.65` slightly above CTRLS.12's 0.6 because the shorter
//    window needs a touch more density to read in half the duration.
//  - Each bar strobes via a yoyo alpha tween (fade-in 60 ms → fade-out 60 ms
//    = 120 ms per bar). Stagger step = (300 - 120) / (5 - 1) = 45 ms so
//    delays are [0, 45, 90, 135, 180] and the last bar ends at exactly
//    300 ms — hits the plan brief to the millisecond.
//  - DEPTH 110 sits above both the baseline scanline (100) and the dread
//    scanline (101) so the bars read *on top* of the CRT mesh, not beneath.
//  - prefers-reduced-motion skips the whole cinematic. Death is already
//    conveyed by GAME_OVER sound, red camera flash, snake head tint → dead
//    sprite; the cascade is supplemental juice that strobes fast enough to
//    warrant a11y-gating for sensitive users.
export const DEATH_CINEMATIC = {
  BAR_COUNT: 5,
  TOTAL_DURATION_MS: 300,
  BAR_STROBE_MS: 120,
  BAR_ALPHA: 0.65,
  BAR_COLOR: 0xff2040,
  BAR_HEIGHT: 5,
  DEPTH: 110,
  MARGIN_Y: 40,
} as const;

export const ACHIEVEMENTS = {
  FIRST_APPLE: 'snake_first_apple',
  SCORE_100: 'snake_score_100',
  SCORE_500: 'snake_score_500',
  COMBO_10: 'snake_combo_10',
  POWER_MASTER: 'snake_power_master',
  SURVIVOR: 'snake_survivor',
  SPEED_DEMON: 'snake_speed_demon',
} as const;

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [SnakeBootScene, SnakeMenuScene, SnakeGameScene, SnakeGameOverScene, HighScoreEntryScene],
};
