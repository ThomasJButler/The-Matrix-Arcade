import Phaser from 'phaser';
import { MatrixCloudBootScene } from './scenes/BootScene';
import { MatrixCloudMenuScene } from './scenes/MenuScene';
import { MatrixCloudGameScene } from './scenes/GameScene';
import { MatrixCloudGameOverScene } from './scenes/GameOverScene';
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';
import { MATRIX_COLORS } from '@/lib/phaser/types';

export type PowerUpType = 'shield' | 'timeSlow' | 'extraLife' | 'doublePoints';
export type BossType = 'agent_smith' | 'sentinel' | 'architect';
export type AttackType = 'laser' | 'matrix_rain' | 'code_bomb';

export type PipeVisual = Phaser.GameObjects.Rectangle | Phaser.GameObjects.TileSprite;

// R84.B4: pipe variants. A discriminated field on PipePair (rather than a
// subclass hierarchy) keeps the existing single-array iteration cheap and
// lets the Jest-free hand-crafted mocks in GameScene.test.ts stay valid with
// just `kind: undefined → 'normal'` by virtue of the optional fields below.
export type PipeKind = 'normal' | 'moving' | 'zapper' | 'bonus';

export interface PipePair {
  topRect: PipeVisual;
  bottomRect: PipeVisual;
  x: number;
  gapY: number;
  passed: boolean;
  hit: boolean;
  // R84.B4 variant state — all optional so pre-variant constructions
  // (including the hand-written test doubles) remain type-compatible.
  kind?: PipeKind;
  // Per-pipe gap height — bonus pipes override to a narrower window.
  gap?: number;
  // Moving-pipe drift parameters.
  baseGapY?: number;
  driftAmp?: number;
  driftFreqHz?: number;
  driftPhase?: number;
  elapsedMs?: number;
  // Zapper arc graphic + pulse cycle state.
  arc?: Phaser.GameObjects.Graphics;
  arcElapsedMs?: number;
  arcActive?: boolean;
  arcTelegraphed?: boolean;
  // Bonus pipe tracks whether its gap-centre power-up has already been
  // emitted — spawn happens once in spawnPipe.
  bonusSpawned?: boolean;
}

export interface FieldPowerUp {
  sprite: Phaser.GameObjects.Sprite;
  type: PowerUpType;
  x: number;
  y: number;
}

export interface BossState {
  sprite: Phaser.GameObjects.Sprite;
  healthBar: Phaser.GameObjects.Graphics;
  healthBg: Phaser.GameObjects.Graphics;
  type: BossType;
  health: number;
  maxHealth: number;
  x: number;
  y: number;
  elapsedTime: number;
}

export interface BossAttackState {
  sprite: Phaser.GameObjects.Sprite;
  vx: number;
  vy: number;
  life: number;
}

export const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 450,

  PLAYER_X: 80,
  PLAYER_WIDTH: 28,
  PLAYER_HEIGHT: 32,
  GRAVITY: 1400,
  JUMP_VELOCITY: -420,
  TERMINAL_VELOCITY: 600,
  INVULNERABLE_DURATION: 1500,

  PIPE_WIDTH: 50,
  PIPE_SPEED: 200,
  PIPE_SPACING: 240,
  PIPE_GAP: 120,
  PIPE_MIN_HEIGHT: 50,
  GROUND_HEIGHT: 40,

  SCORE_PER_PIPE: 10,
  COMBO_INCREMENT: 0.15,
  MAX_COMBO: 5.0,
  LEVEL_THRESHOLD: 500,

  INITIAL_LIVES: 3,
  MAX_LIVES: 5,

  POWERUP_CHANCE: 0.12,
  POWERUP_SIZE: 24,
  POWERUP_DURATION: 8000,
  TIME_SLOW_FACTOR: 0.6,
  POWERUP_MIN_PIPE_DISTANCE: 80,

  PIPE_SPACING_INITIAL: 320,
  PIPE_SPACING_MIN: 240,
  PIPE_SPACING_RAMP_SCORE: 400,
  PIPE_MAX_ACTIVE: 4,

  BOSS_ATTACK_INTERVAL: 2,
  BOSS_DURATION: 30,
  BOSS_DAMAGE_PER_HIT: 10,
  BOSS_ATTACK_SIZE: 16,
  BOSS_ATTACK_SPEED: 300,

  PARTICLE_COUNT: 30,
} as const;

export const BOSS_DEFS: Record<BossType, { health: number; size: number; speed: number; attacks: AttackType[] }> = {
  agent_smith: { health: 150, size: 60, speed: 120, attacks: ['laser', 'code_bomb'] },
  sentinel: { health: 200, size: 80, speed: 90, attacks: ['matrix_rain', 'laser'] },
  architect: { health: 300, size: 100, speed: 60, attacks: ['code_bomb', 'matrix_rain', 'laser'] },
};

export const BOSS_LEVELS: Record<number, BossType> = {
  5: 'agent_smith',
  10: 'sentinel',
  15: 'architect',
};

export const POWERUP_DEFS: Record<PowerUpType, { color: number; label: string }> = {
  shield: { color: 0xff00ff, label: 'SHIELD' },
  timeSlow: { color: 0xffff00, label: 'SLOW' },
  extraLife: { color: 0xff0000, label: '+LIFE' },
  doublePoints: { color: 0x00ffff, label: '2X' },
};

// R84.B3: SLOW_MODE — single-source-of-truth for how the slow power-up
// communicates its "time-dilated" feel. Two complementary behaviours the
// scene hangs off this block:
//
//   (a) Player-physics time-dilation (no config constant of its own — the
//       player re-uses GAME_CONFIG.TIME_SLOW_FACTOR so the player and the
//       world slow at exactly the same rate). Pre-R84.B3 the scene scaled
//       pipes / field power-ups / boss by TIME_SLOW_FACTOR but let the
//       player run at full-rate gravity + integration, so the bird fell
//       fast while the world crept — exactly the "not enough momentum"
//       feel Tom flagged in the 2026-04-19 testing doc (line 115). Scaling
//       the player's gravity accumulation and vertical integration by the
//       same 0.6× gives coherent 1.67× hang-time that matches pipe scroll.
//       Combined with the existing R83.B1(e) 0.6× impulse scaling, apparent
//       peak height stays invariant — gaps remain equally navigable — but
//       the bird now drifts through them rather than dropping through.
//
//   (b) Yellow trail breadcrumbs behind the bird while slow-mode is active
//       — an unmistakable visual state-change signal, so the player reads
//       the dilation at a glance. Colour matches POWERUP_DEFS.timeSlow
//       YELLOW so the HUD indicator and the trail tell the same story.
//       Emit cadence (120 ms) + lifespan (600 ms) gives a five-particle
//       visible tail without cluttering the small 800×450 canvas.
// R84.B4: pipe-variant tuning. Single-source-of-truth for score gates, drift
// amplitude/frequency, zapper cycle timings, bonus gap/score scaling, and the
// colour palette that differentiates hazard kinds at a glance. Changing any
// one of these numbers here is enough to re-balance the variant roll-out —
// every read path in GameScene.ts + the unit tests references this block.
//
//   • Score gates map 1:1 to Tom's spec in the R84.B4 brief (moving @ 200,
//     zapper @ 500, bonus @ 1000). Unlocks are cumulative: once a kind
//     unlocks, it enters the weighted spawn bag and stays there.
//   • WEIGHTS are relative picks — at 1000+ the bag is {normal 10, moving 3,
//     zapper 2, bonus 1} → ~62% normal, ~19% moving, ~13% zapper, ~6% bonus.
//     Normal always dominates so the core Flappy feel survives the mid-game.
//   • MOVING drift is 30 px peak-to-peak over ~3.3 s period → the gap centre
//     breathes gently rather than yanking left-right. Drift time advances by
//     delta × speedMult so the time-slow power-up correctly dampens it.
//   • ZAPPER cycle is 2000 ms with 40% active fraction, so the player gets
//     a ~1.2 s safe window per cycle — tight but fair once the unlock score
//     is reached. Telegraph flash 300 ms before activating so the player can
//     read the "about to zap" state instead of being ambushed.
//   • BONUS narrows the gap to 70% and triples the scored points on pass —
//     risk/reward phrasing: thread a tighter needle for more runs up the
//     leaderboard.
export const PIPE_VARIANTS = {
  MOVING_UNLOCK_SCORE: 200,
  ZAPPER_UNLOCK_SCORE: 500,
  BONUS_UNLOCK_SCORE: 1000,

  WEIGHT_NORMAL: 10,
  WEIGHT_MOVING: 3,
  WEIGHT_ZAPPER: 2,
  WEIGHT_BONUS: 1,

  MOVING_DRIFT_AMP: 30,
  MOVING_DRIFT_FREQ_HZ: 0.3,
  MOVING_FILL: 0x664400,
  MOVING_STROKE: 0xffaa00,

  ZAPPER_CYCLE_MS: 2000,
  ZAPPER_ACTIVE_FRACTION: 0.4,
  ZAPPER_TELEGRAPH_MS: 300,
  ZAPPER_FILL: 0x330000,
  ZAPPER_STROKE: 0xff3333,
  ZAPPER_ARC_COLOR: 0xff5555,
  ZAPPER_ARC_ALPHA: 0.9,
  ZAPPER_ARC_SEGMENTS: 6,
  ZAPPER_ARC_JITTER: 6,

  BONUS_GAP_SCALE: 0.7,
  BONUS_SCORE_MULT: 3,
  BONUS_FILL: 0x003355,
  BONUS_STROKE: 0x00ccff,
} as const;

export const SLOW_MODE = {
  TRAIL_EMIT_INTERVAL_MS: 120,
  TRAIL_PARTICLE_RADIUS: 3,
  TRAIL_PARTICLE_ALPHA: 0.7,
  TRAIL_PARTICLE_LIFESPAN_MS: 600,
  TRAIL_COLOR: 0xffff00,
  TRAIL_DEPTH: 9,
} as const;

// R84.B5: 3-layer parallax deepening. Horizontal scroll rates sit on the same
// PIPE_SPEED reference axis the pipes travel, so the backdrop moves through
// the frame at the same cadence the gameplay does — just fractionally, per
// layer, to give the "far things are far, near things are near" illusion. A
// single dreadIntensity-style scroll mult isn't used here because each layer
// has its own inner motion (rain falls vertically at its own speed regardless
// of horizontal drift), so per-layer SCROLL_FACTOR is the right handle.
//
//   • FAR layer re-uses the existing `bg_city` texture (already loaded in
//     BootScene as the static silhouette behind the gameplay) but promoted
//     to a TileSprite so `tilePositionX` advances can scroll horizontally for
//     free — one field write per frame, no per-pixel work. 0.1× scrollFactor
//     → 20 px/s drift at default PIPE_SPEED=200, slow enough that the player
//     reads the skyline as "way off in the distance".
//   • MID layer is a Matrix-rain character cohort: falls vertically like the
//     BaseScene helper, but also drifts LEFT at 0.3× = 60 px/s. Density 16,
//     font 11 px, alpha 0.22 — meaningfully denser than FAR but dimmer and
//     smaller than NEAR so the three layers read as depth bands.
//   • NEAR layer is the densest rain band, closest to the gameplay plane:
//     0.7× drift = 140 px/s (matches roughly how fast pipes move across the
//     screen in the player's peripheral vision). Density 10, font 15 px,
//     alpha 0.38 — larger, brighter characters that read as "right in front
//     of me". Density is intentionally less than MID because bigger glyphs
//     need more breathing room to avoid visual crowding.
//   • Depth ordering 0 → 1 → 2 puts FAR behind MID behind NEAR, all beneath
//     pipes (3), power-ups (4), ground (5), arcs/boss (6-9), player (10).
//   • Vertical speed ranges scale with layer depth: FAR has none (TileSprite),
//     MID falls slowly (35-75 px/s, dreamy), NEAR falls fast (80-140 px/s,
//     urgent) — another "closer = faster" depth cue riding on top of the
//     horizontal drift.
//   • TIME_SLOW_FACTOR dampens horizontal drift in lockstep with pipe scroll
//     and R84.B3's player physics, keeping the "time slowed together" feel
//     coherent. Vertical rain fall intentionally does NOT scale — rain is an
//     atmosphere effect independent of the player's time-dilation frame.
export const PARALLAX = {
  FAR: {
    SCROLL_FACTOR: 0.1,
    DEPTH: 0,
    ALPHA: 0.15,
  },
  MID: {
    SCROLL_FACTOR: 0.3,
    DEPTH: 1,
    ALPHA: 0.22,
    DENSITY: 16,
    FONT_SIZE: 11,
    VERTICAL_SPEED_MIN: 35,
    VERTICAL_SPEED_MAX: 75,
  },
  NEAR: {
    SCROLL_FACTOR: 0.7,
    DEPTH: 2,
    ALPHA: 0.38,
    DENSITY: 10,
    FONT_SIZE: 15,
    VERTICAL_SPEED_MIN: 80,
    VERTICAL_SPEED_MAX: 140,
  },
} as const;

export type ParallaxRainLayerConfig = typeof PARALLAX.MID;

export const ACHIEVEMENTS = {
  FIRST_FLIGHT: 'cloud_first_flight',
  LEVEL_5: 'cloud_level_5',
  BOSS_SLAYER: 'cloud_boss_slayer',
  SENTINEL_DEFEAT: 'cloud_sentinel_defeat',
  ARCHITECT_DEFEAT: 'cloud_architect_defeat',
  ALL_BOSSES: 'cloud_all_bosses',
  POWER_COLLECTOR: 'cloud_power_collector',
  HIGH_FLYER: 'cloud_high_flyer',
} as const;

export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  backgroundColor: MATRIX_COLORS.BACKGROUND,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [MatrixCloudBootScene, MatrixCloudMenuScene, MatrixCloudGameScene, MatrixCloudGameOverScene, HighScoreEntryScene],
};
