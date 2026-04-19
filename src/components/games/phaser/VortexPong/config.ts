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
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';

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

  // R84.P9 — Goal-flash epilepsy safety. R83.V1c already halved channel
  // intensity from 255 → 128; this block centralises the values so callers
  // cannot drift back up, and adds a PEAT-safe throttle floor.
  //
  // WCAG 2.3.1 General Flash Threshold caps flashes at ≤ 3/second; a
  // multi-ball 3-goal storm can fire three goal flashes in <500ms which
  // would breach that, so `MIN_INTERVAL_MS` suppresses back-to-back regular
  // flashes (the WIN/LOSS flash uses `overrideThrottle` so the game-over
  // moment still plays).
  //
  // `MAX_CHANNEL_VALUE` (160) is the observed ceiling across current
  // presets (the WIN flashes at 160, regular goals at 128). Clamping to
  // this cap in `goalFlash()` means a future caller passing e.g. 255
  // cannot re-introduce a full-brightness strobe. Only one channel is
  // saturated per preset — no white/yellow flashes — which keeps overall
  // relative luminance change well below the PEAT saturated-red + general
  // flash thresholds.
  //
  // `MAX_DURATION_MS` (200) caps the camera-flash fade so even the longest
  // win flash still decays within a single PEAT 1-second window. The
  // regular goal flashes (100ms) are well below this.
  GOAL_FLASH: {
    MAX_CHANNEL_VALUE: 160,
    MAX_DURATION_MS: 200,
    MIN_INTERVAL_MS: 334,
    PLAYER_GOAL: { rgb: [0, 128, 0] as const, durationMs: 100 },
    AI_GOAL:     { rgb: [128, 0, 0] as const, durationMs: 100 },
    PLAYER_WIN:  { rgb: [0, 160, 0] as const, durationMs: 200 },
    AI_WIN:      { rgb: [160, 0, 0] as const, durationMs: 150 },
  },

  // R84.P7 — paddle-hit particle trail tuning. R83.V1e shipped a flat
  // 10-particle burst; Tom's doc line 112 wants the top-tier speed to feel
  // like a hot rally. Count now ramps from BASE_COUNT (12 at mult=1.0) to
  // MAX_COUNT (20 at the game's BALL.MAX_SPEED / INITIAL_SPEED cap, ≈ 2.14x).
  PADDLE_TRAIL: {
    BASE_COUNT: 12,
    MAX_COUNT: 20,
    DURATION_MS: 300,
    PARTICLE_RADIUS: 2,
    PARTICLE_ALPHA: 0.85,
    SPEED_BASE: 30,
    SPEED_JITTER: 20,
  },

  MAX_IMPACT_EFFECTS: 10,

  // R84.P8 — top-centre rally counter. Plan line: "Small top-centre counter,
  // pulses per hit, resets on goal — feeds P2 High Score + is a satisfying
  // metric." Colour matches the MULTI power-up CYAN family so the HUD reads
  // as the "rally / multi-ball" metric cluster. Hidden (alpha 0) at
  // rallyCount 0 so a fresh serve doesn't show "RALLY x0"; fades in the
  // moment the first player return lands and pulses up on every subsequent
  // player hit. Reduced-motion skips the scale pulse but the text + alpha
  // still update so players who need the metric still see it.
  RALLY_COUNTER: {
    Y: 14,                         // top-centre, above the score digits at y=30
    FONT_SIZE: 14,
    COLOR: '#00ffff',              // MATRIX_COLORS.CYAN_HEX — rally family
    PULSE_FROM: 1.3,
    PULSE_TO: 1,
    PULSE_DURATION_MS: 180,
    PULSE_EASE: 'Back.easeOut',
  },

  // R84.P4 — vortex atmosphere amp-up. Tom's testing-doc verdict: the "vortex"
  // naming implied more depth than R83.V1's paddle-hit trail alone. This block
  // drives three procedural layers stacked beneath/between the existing rain +
  // paddle render: a rotating elliptical radial-gradient backdrop for depth,
  // a denser CRT scanline overlay (+30% alpha over Snake's R83.S1 0.18 base =
  // 0.23), and a paddle-glow pulse that brightens as the nearest ball closes
  // in. All layers are skipped (backdrop) or static (scanline) under
  // prefers-reduced-motion so sensitive players still read the vortex without
  // continuous movement.
  ATMOSPHERE: {
    VORTEX: {
      INNER_RADIUS: 40,
      OUTER_RADIUS: 560,
      RING_COUNT: 8,
      ROTATION_SECONDS: 45,      // plan: 30–60s full revolution
      ASPECT_X: 1.25,             // elliptical stretch so rotation is visible
      ASPECT_Y: 0.85,
      BASE_ALPHA: 0.35,           // overall opacity of the whole layer
      RING_INNER_ALPHA: 0.55,     // brightest (centre-most) ring
      RING_OUTER_ALPHA: 0.05,     // dimmest (outermost) ring
    },
    SCANLINE: {
      STRIDE_PX: 3,
      ALPHA: 0.23,                // Snake baseline 0.18 × 1.30
    },
    PADDLE_GLOW: {
      COLOR: 0x00ff00,            // MATRIX_COLORS.PRIMARY inlined to keep the
                                  // config block free of `Phaser` imports.
      MAX_ALPHA: 0.55,
      MIN_ALPHA: 0.08,            // faint halo even when ball is far
      THRESHOLD_PX: 260,          // ~1/3 of canvas width — approach distance
      WIDTH_PAD: 14,              // glow rect is bigger than the paddle
      HEIGHT_PAD: 24,
      SCALE_BOOST: 0.25,          // extra size swell on closest approach
    },
  },
} as const;

// R84.P9 — structural type for the four GOAL_FLASH preset entries. Scene
// code accepts `GoalFlashPreset` so the callsites read self-documenting
// (`goalFlash(GOAL_FLASH.PLAYER_WIN, ...)`). The rgb tuple is `readonly`
// so callers cannot mutate a shared preset in place.
export interface GoalFlashPreset {
  readonly rgb: readonly [number, number, number];
  readonly durationMs: number;
}

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

// R84.P5 — HUD legend shown for ~4s on every power-up pickup. Tom's testing
// doc: "he didn't know what each did". The legend lists all four so a novice
// player builds the mental model after two or three pickups. Duration values
// are copy-frozen against `GAME_CONFIG.POWERUP.DURATION` (10s) and multi_ball
// is flagged INSTANT because it has no expiry (see activatePowerUp switch).
export interface PowerUpLegendEntry {
  type: PowerUpType;
  name: string;
  effect: string;
  duration: string;
}

export const POWERUP_LEGEND: {
  readonly ENTRIES: readonly PowerUpLegendEntry[];
  readonly DISPLAY_MS: number;
  readonly FADE_IN_MS: number;
  readonly FADE_OUT_MS: number;
  readonly LINE_HEIGHT: number;
  readonly BASE_Y_RATIO: number;
  readonly ACTIVE_ALPHA: number;
  readonly INACTIVE_ALPHA: number;
} = {
  ENTRIES: [
    { type: 'bigger_paddle',    name: 'BIG',   effect: 'PADDLE +50%',    duration: '10s' },
    { type: 'slower_ball',      name: 'SLOW',  effect: 'BALL -40%',      duration: '10s' },
    { type: 'score_multiplier', name: '2X',    effect: 'SCORE BONUS',    duration: '10s' },
    { type: 'multi_ball',       name: 'MULTI', effect: '+2 BALLS',       duration: 'NOW' },
  ],
  DISPLAY_MS: 4000,
  FADE_IN_MS: 200,
  FADE_OUT_MS: 400,
  LINE_HEIGHT: 12,
  BASE_Y_RATIO: 0.72,     // ~324px on 450px canvas — below the arena, above
                          // the power-up indicator stack at HEIGHT - 20.
  ACTIVE_ALPHA: 1,
  INACTIVE_ALPHA: 0.55,   // non-activated entries dim so the active one reads
                          // but the player still sees the other three options.
};

// R84.P3 — AI difficulty second pass (Tom: "too easy" verdict survived R83.V1).
// Three tiers scale four AI params together so the feel differs by reaction
// speed *and* prediction accuracy, not just one knob. Normal mirrors the
// R83.V1a baseline (trackingMultiplier=1 keeps baseTracking at 4.0, etc.) so
// existing scene behaviour is unchanged when the default tier is active.
export type DifficultyTier = 'easy' | 'normal' | 'hard';

export interface DifficultyTierParams {
  label: string;
  trackingMultiplier: number;
  maxSpeedFactor: number;
  errorMultiplier: number;
  outgoingTrackingFactor: number;
}

export const DIFFICULTY_TIERS: Record<DifficultyTier, DifficultyTierParams> = {
  easy:   { label: 'EASY',   trackingMultiplier: 0.60, maxSpeedFactor: 0.75, errorMultiplier: 2.5, outgoingTrackingFactor: 0.25 },
  normal: { label: 'NORMAL', trackingMultiplier: 1.00, maxSpeedFactor: 0.95, errorMultiplier: 1.0, outgoingTrackingFactor: 0.45 },
  hard:   { label: 'HARD',   trackingMultiplier: 1.40, maxSpeedFactor: 1.15, errorMultiplier: 0.3, outgoingTrackingFactor: 0.60 },
};

export const DIFFICULTY_ORDER: DifficultyTier[] = ['easy', 'normal', 'hard'];
export const DEFAULT_DIFFICULTY: DifficultyTier = 'normal';
export const DIFFICULTY_STORAGE_KEY = 'matrixArcade.vortexPong.difficulty';

function isDifficultyTier(value: unknown): value is DifficultyTier {
  return value === 'easy' || value === 'normal' || value === 'hard';
}

export function readStoredDifficulty(): DifficultyTier {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_DIFFICULTY;
  try {
    const raw = window.localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    return isDifficultyTier(raw) ? raw : DEFAULT_DIFFICULTY;
  } catch {
    // localStorage access denied (private browsing, blocked cookies) —
    // fall through to default rather than crashing the scene load.
    return DEFAULT_DIFFICULTY;
  }
}

export function writeStoredDifficulty(tier: DifficultyTier): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(DIFFICULTY_STORAGE_KEY, tier);
  } catch {
    // Ignore write failures; selector still works in-session via registry.
  }
}

export function cycleDifficulty(current: DifficultyTier): DifficultyTier {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  return DIFFICULTY_ORDER[(idx + 1) % DIFFICULTY_ORDER.length];
}

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
    HighScoreEntryScene,
  ],
  render: {
    pixelArt: true,
    antialias: false,
  },
};
