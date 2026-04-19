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

export interface PipePair {
  topRect: PipeVisual;
  bottomRect: PipeVisual;
  x: number;
  gapY: number;
  passed: boolean;
  hit: boolean;
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
export const SLOW_MODE = {
  TRAIL_EMIT_INTERVAL_MS: 120,
  TRAIL_PARTICLE_RADIUS: 3,
  TRAIL_PARTICLE_ALPHA: 0.7,
  TRAIL_PARTICLE_LIFESPAN_MS: 600,
  TRAIL_COLOR: 0xffff00,
  TRAIL_DEPTH: 9,
} as const;

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
