import Phaser from 'phaser';
import { MatrixCloudBootScene } from './scenes/BootScene';
import { MatrixCloudMenuScene } from './scenes/MenuScene';
import { MatrixCloudGameScene } from './scenes/GameScene';
import { MatrixCloudGameOverScene } from './scenes/GameOverScene';
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
  scene: [MatrixCloudBootScene, MatrixCloudMenuScene, MatrixCloudGameScene, MatrixCloudGameOverScene],
};
