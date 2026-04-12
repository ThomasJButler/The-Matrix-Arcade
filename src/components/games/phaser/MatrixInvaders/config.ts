import Phaser from 'phaser';
import { MatrixInvadersBootScene } from './scenes/BootScene';
import { MatrixInvadersMenuScene } from './scenes/MenuScene';
import { MatrixInvadersGameScene } from './scenes/GameScene';
import { MatrixInvadersGameOverScene } from './scenes/GameOverScene';

export type EnemyType = 'code' | 'agent' | 'sentinel' | 'virus';
export type PowerUpType = 'rapidFire' | 'shield' | 'scoreMultiplier' | 'bomb';

export interface EnemyState {
  sprite: Phaser.GameObjects.Sprite;
  type: EnemyType;
  health: number;
  maxHealth: number;
  value: number;
  speedMultiplier: number;
  width: number;
  height: number;
}

export interface BossState {
  sprite: Phaser.GameObjects.Sprite;
  healthBar: Phaser.GameObjects.Graphics;
  healthBg: Phaser.GameObjects.Graphics;
  health: number;
  maxHealth: number;
  value: number;
  width: number;
  height: number;
  barrelOffsets: number[];
}

export interface BulletState {
  sprite: Phaser.GameObjects.Image;
  vy: number;
  damage: number;
  isPlayer: boolean;
}

export interface ParticleState {
  rect: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
  life: number;
}

export interface FieldPowerUp {
  sprite: Phaser.GameObjects.Sprite;
  type: PowerUpType;
  vy: number;
}

export const ENEMY_DEFS: Record<EnemyType, {
  health: number;
  value: number;
  speedMultiplier: number;
  color: number;
  splits?: boolean;
}> = {
  code:     { health: 1, value: 10,  speedMultiplier: 1.0, color: 0x00ff00 },
  agent:    { health: 2, value: 30,  speedMultiplier: 1.5, color: 0x00cc00 },
  sentinel: { health: 3, value: 50,  speedMultiplier: 1.2, color: 0x009900 },
  virus:    { health: 1, value: 20,  speedMultiplier: 2.0, color: 0xff0000, splits: true },
};

export const POWERUP_DEFS: Record<PowerUpType, { color: number; label: string; duration: number }> = {
  rapidFire:       { color: 0xffff00, label: 'RAPID',  duration: 8000 },
  shield:          { color: 0xff00ff, label: 'SHIELD', duration: 0 },
  scoreMultiplier: { color: 0x00ffff, label: '2X',     duration: 8000 },
  bomb:            { color: 0xff4400, label: 'BOMB',   duration: 0 },
};

export const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 450,

  PLAYER_WIDTH: 40,
  PLAYER_HEIGHT: 30,
  PLAYER_SPEED: 300,
  PLAYER_Y_OFFSET: 40,
  PLAYER_MAX_HEALTH: 100,
  PLAYER_HIT_DAMAGE: 5,
  INVULNERABLE_DURATION: 500,

  PLAYER_BULLET_SPEED: 600,
  ENEMY_BULLET_SPEED: 300,
  PLAYER_BULLET_WIDTH: 3,
  PLAYER_BULLET_HEIGHT: 10,
  ENEMY_BULLET_WIDTH: 3,
  ENEMY_BULLET_HEIGHT: 6,
  FIRE_COOLDOWN: 250,
  RAPID_FIRE_COOLDOWN: 100,

  WAVE_COLS: 8,
  WAVE_ROWS: 5,
  ENEMY_WIDTH: 40,
  ENEMY_HEIGHT: 30,
  GRID_START_X: 60,
  GRID_START_Y: 35,
  GRID_COL_SPACING: 80,
  GRID_ROW_SPACING: 38,
  ENEMY_BASE_SPEED: 60,
  ENEMY_DESCENT: 15,
  ENEMY_FIRE_CHANCE: 0.001,
  WAVE_SPEED_BONUS: 0.05,

  BOSS_WIDTH: 120,
  BOSS_HEIGHT: 60,
  BOSS_BASE_HEALTH: 50,
  BOSS_HEALTH_PER_ENCOUNTER: 10,
  BOSS_BASE_VALUE: 500,
  BOSS_SPEED: 1.5,
  BOSS_FIRE_CHANCE: 0.002,
  BOSS_Y: 60,

  BULLET_TIME_DURATION: 5000,
  BULLET_TIME_SCALE: 0.3,

  POWERUP_DROP_CHANCE: 0.05,
  POWERUP_SIZE: 20,
  POWERUP_FALL_SPEED: 80,

  PARTICLE_COUNT: 20,
  PARTICLE_SPEED_MIN: 120,
  PARTICLE_SPEED_MAX: 300,
  PARTICLE_DECAY: 1.2,

  WAVE_DELAY: 1500,
  COMBO_MULTIPLIER: 0.1,
  VIRUS_CHILD_VALUE: 5,
} as const;

export const ACHIEVEMENTS = {
  FIRST_KILL: 'invaders_first_kill',
  ENEMIES_100: 'invaders_100_enemies',
  BOSS_DEFEAT: 'invaders_boss_defeat',
  WAVE_5: 'invaders_wave_5',
  WAVE_10: 'invaders_wave_10',
  WAVE_20: 'invaders_endless',
  PERFECT_WAVE: 'invaders_perfect_wave',
  COMBO_10: 'invaders_combo_10',
  BULLET_TIME: 'invaders_bullet_time',
  HIGH_SCORE: 'invaders_high_score',
} as const;

export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  pixelArt: true,
  transparent: false,
  input: { keyboard: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [
    MatrixInvadersBootScene,
    MatrixInvadersMenuScene,
    MatrixInvadersGameScene,
    MatrixInvadersGameOverScene,
  ],
};
