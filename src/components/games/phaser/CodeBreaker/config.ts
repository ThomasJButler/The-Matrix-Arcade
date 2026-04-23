import Phaser from 'phaser';
import { MATRIX_COLORS, PHASER_RENDER_DEFAULTS } from '../../../../lib/phaser/types';
import { CodeBreakerBootScene } from './scenes/BootScene';
import { CodeBreakerMenuScene } from './scenes/MenuScene';
import { CodeBreakerGameScene } from './scenes/GameScene';
import { CodeBreakerGameOverScene } from './scenes/GameOverScene';
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';

// -- Brick types --
export type BrickType = 'code' | 'agent' | 'sentinel' | 'unbreakable';
export type PowerUpType = 'multiBall' | 'widePaddle' | 'laser' | 'bulletTime' | 'firewall' | 'emp';

export interface BrickDef {
  health: number;
  value: number;
  color: number;
}

export const BRICK_DEFS: Record<BrickType, BrickDef> = {
  code:        { health: 1, value: 10,  color: 0x00ff00 },
  agent:       { health: 2, value: 30,  color: 0xccaa00 },
  sentinel:    { health: 3, value: 50,  color: 0xff0000 },
  unbreakable: { health: 999, value: 0, color: 0x666666 },
};

export interface PowerUpDef {
  color: number;
  label: string;
  duration: number;
}

export const POWERUP_DEFS: Record<PowerUpType, PowerUpDef> = {
  multiBall:  { color: 0x00ffff, label: 'MULTI',    duration: 0 },
  widePaddle: { color: 0xffff00, label: 'WIDE',     duration: 10000 },
  laser:      { color: 0xff00ff, label: 'LASER',    duration: 8000 },
  bulletTime: { color: 0xff8800, label: 'SLOW',     duration: 5000 },
  firewall:   { color: 0x00ff88, label: 'WALL',     duration: 0 },
  emp:        { color: 0xffffff, label: 'EMP',      duration: 0 },
};

// -- State interfaces --
export interface BrickState {
  sprite: Phaser.GameObjects.Image;
  type: BrickType;
  health: number;
  maxHealth: number;
  value: number;
  row: number;
  col: number;
  width: number;
  height: number;
}

export interface BallState {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
}

export interface AgentState {
  sprite: Phaser.GameObjects.Sprite;
  vy: number;
  width: number;
  height: number;
}

export interface LaserState {
  sprite: Phaser.GameObjects.Rectangle;
  vy: number;
}

export interface FieldPowerUp {
  sprite: Phaser.GameObjects.Sprite;
  type: PowerUpType;
  vy: number;
}

export interface ParticleState {
  rect: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
  life: number;
}

export interface BossState {
  sprite: Phaser.GameObjects.Rectangle;
  healthBar: Phaser.GameObjects.Graphics;
  healthBg: Phaser.GameObjects.Graphics;
  health: number;
  maxHealth: number;
  value: number;
  width: number;
  height: number;
  direction: number;
  speed: number;
  fireTimer: number;
}

// -- Level layouts --
// 0=empty, 1=code, 2=agent, 3=sentinel, 9=unbreakable, 5=boss row marker
const BRICK_MAP: Record<number, BrickType | null> = {
  0: null,
  1: 'code',
  2: 'agent',
  3: 'sentinel',
  9: 'unbreakable',
};

export const LEVELS: number[][][] = [
  // Level 1: Simple rows with colour variety (code=1 green, agent=2 gold, sentinel=3 red)
  [
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Level 2: Mixed with agents
  [
    [2, 1, 1, 2, 1, 1, 2, 1, 1, 2],
    [1, 2, 1, 1, 2, 2, 1, 1, 2, 1],
    [1, 1, 2, 1, 1, 1, 1, 2, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Level 3: Boss level - V pattern with sentinels
  [
    [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    [0, 2, 0, 0, 0, 0, 0, 0, 2, 0],
    [0, 0, 2, 0, 0, 0, 0, 2, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  ],
  // Level 4: Fortress with unbreakable walls
  [
    [9, 1, 1, 1, 1, 1, 1, 1, 1, 9],
    [1, 2, 2, 1, 1, 1, 1, 2, 2, 1],
    [1, 2, 3, 2, 1, 1, 2, 3, 2, 1],
    [1, 1, 2, 1, 1, 1, 1, 2, 1, 1],
    [9, 1, 1, 1, 1, 1, 1, 1, 1, 9],
  ],
  // Level 5: Diamond pattern
  [
    [0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
    [0, 0, 0, 2, 1, 1, 2, 0, 0, 0],
    [0, 0, 2, 1, 1, 1, 1, 2, 0, 0],
    [0, 2, 1, 1, 1, 1, 1, 1, 2, 0],
    [0, 0, 2, 1, 1, 1, 1, 2, 0, 0],
    [0, 0, 0, 2, 1, 1, 2, 0, 0, 0],
    [0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
  ],
  // Level 6: Boss level - dense grid
  [
    [3, 2, 3, 2, 3, 3, 2, 3, 2, 3],
    [2, 1, 2, 1, 2, 2, 1, 2, 1, 2],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [9, 0, 9, 0, 9, 9, 0, 9, 0, 9],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [2, 1, 2, 1, 2, 2, 1, 2, 1, 2],
  ],
  // Level 7: Zigzag
  [
    [3, 3, 0, 0, 0, 0, 0, 0, 3, 3],
    [0, 2, 2, 0, 0, 0, 0, 2, 2, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 2, 2, 2, 2, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 2, 2, 0, 0, 0, 0, 2, 2, 0],
    [3, 3, 0, 0, 0, 0, 0, 0, 3, 3],
  ],
  // Level 8: Checkerboard
  [
    [3, 0, 3, 0, 3, 0, 3, 0, 3, 0],
    [0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
    [3, 0, 3, 0, 3, 0, 3, 0, 3, 0],
    [0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
    [3, 0, 3, 0, 3, 0, 3, 0, 3, 0],
    [0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
  ],
  // Level 9: Boss level - The Architect
  [
    [9, 3, 3, 3, 3, 3, 3, 3, 3, 9],
    [9, 0, 0, 0, 0, 0, 0, 0, 0, 9],
    [9, 0, 3, 2, 2, 2, 2, 3, 0, 9],
    [9, 0, 2, 1, 1, 1, 1, 2, 0, 9],
    [9, 0, 2, 1, 1, 1, 1, 2, 0, 9],
    [9, 0, 3, 2, 2, 2, 2, 3, 0, 9],
    [9, 0, 0, 0, 0, 0, 0, 0, 0, 9],
    [9, 3, 3, 3, 3, 3, 3, 3, 3, 9],
  ],
  // Level 10: The Source - final gauntlet
  [
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 9, 2, 2, 2, 2, 2, 2, 9, 3],
    [3, 2, 9, 1, 1, 1, 1, 9, 2, 3],
    [3, 2, 1, 9, 1, 1, 9, 1, 2, 3],
    [3, 2, 1, 1, 9, 9, 1, 1, 2, 3],
    [3, 2, 1, 9, 1, 1, 9, 1, 2, 3],
    [3, 2, 9, 1, 1, 1, 1, 9, 2, 3],
    [3, 9, 2, 2, 2, 2, 2, 2, 9, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  ],
];

export function getBrickType(code: number): BrickType | null {
  return BRICK_MAP[code] ?? null;
}

// -- Achievement IDs --
export const ACHIEVEMENTS = {
  FIRST_BREAK: 'breaker_first_break',
  LEVEL_5: 'breaker_level_5',
  LEVEL_10: 'breaker_level_10',
  SMITH_SLAYER: 'breaker_smith_slayer',
  COMBO_15: 'breaker_combo_15',
  MULTI_BALL: 'breaker_multi_ball',
  BULLET_TIME: 'breaker_bullet_time',
  NO_MISS: 'breaker_no_miss',
  BOSS_DEFEAT: 'breaker_boss_defeat',
  HIGH_SCORE: 'breaker_high_score',
} as const;

// -- Game config constants --
export const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 450,

  // Paddle
  PADDLE_WIDTH: 100,
  PADDLE_WIDE_WIDTH: 160,
  PADDLE_HEIGHT: 14,
  PADDLE_Y: 420,
  PADDLE_SPEED: 500,

  // Ball
  BALL_RADIUS: 6,
  BALL_SPEED: 300,
  // R87.K4 — rebound cap. Previous ceiling 550 (+83% over BALL_SPEED) made
  // packed-grid play feel uncontrollable on paddle-fresh balls that carried
  // a hot speed across 20+ inter-brick bounces. Tightened to 460 (+53%) so
  // the top of the progression curve is still perceptibly faster than the
  // fresh-ball baseline but no longer outstrips player reaction time.
  BALL_MAX_SPEED: 460,
  // R87.K4 — per-paddle-hit increment softened (10 → 6). Previous value
  // ramped BALL_SPEED → BALL_MAX_SPEED in ~25 paddle hits (a couple of
  // levels); 6 stretches that to ~27 hits at the new ceiling so the
  // progression is slower and feels earned rather than accidental. Preserves
  // the classic Breakout "ball gets faster as you play" progression beat.
  BALL_SPEED_INCREMENT: 6,
  // R87.K4 — per-brick rebound dampen. Brick collisions flip velocity sign
  // but historically did not touch magnitude, so a packed grid with 20+
  // inter-brick bounces kept the ball at whatever hot speed the paddle
  // imparted. 1.5% speed loss per brick is imperceptible on a single hit
  // but over 10 rapid bounces converges to a noticeable ~14% slowdown
  // specifically where Tom's "packed grids feel too quick" complaint
  // originated. Must be <= 1 (never adds speed from a brick hit).
  BALL_BRICK_REBOUND_DAMPEN: 0.985,
  // R87.K4 — near-vertical rebound softener. |vy|/speed above this is
  // treated as a "darty" steep rebound that visually reads faster than a
  // 45° rebound at identical speed (more pixels per frame along one axis).
  // Paired with BALL_STEEP_ANGLE_DAMPEN below to scrub the visual shock.
  BALL_STEEP_ANGLE_THRESHOLD: 0.92,
  // R87.K4 — steep-angle dampen factor. Applied on top of the brick-rebound
  // dampen when the post-reflect trajectory is near-vertical. ~7% extra
  // speed loss specifically softens the "darts off a brick into the paddle
  // before you can react" feel in stacked rows. Must be <= 1.
  BALL_STEEP_ANGLE_DAMPEN: 0.93,

  // Bricks
  BRICK_WIDTH: 64,
  BRICK_HEIGHT: 18,
  BRICK_PADDING: 4,
  BRICK_OFFSET_X: 60,
  BRICK_OFFSET_Y: 50,

  // Gameplay
  LIVES: 3,
  TOTAL_LEVELS: 10,
  COMBO_MULTIPLIER: 0.1,
  POWERUP_DROP_CHANCE: 0.15,
  POWERUP_FALL_SPEED: 120,
  POWERUP_SIZE: 20,

  // Agent Smith enemies
  AGENT_SPAWN_CHANCE: 0.12,
  AGENT_SPEED: 90,
  AGENT_WIDTH: 20,
  AGENT_HEIGHT: 30,

  // Boss (levels 3, 6, 9)
  BOSS_LEVELS: [3, 6, 9] as readonly number[],
  BOSS_BASE_HEALTH: 15,
  BOSS_HEALTH_PER_LEVEL: 5,
  BOSS_WIDTH: 120,
  BOSS_HEIGHT: 24,
  BOSS_SPEED: 100,
  BOSS_FIRE_INTERVAL: 2.5,
  BOSS_BULLET_SPEED: 200,
  BOSS_VALUE: 500,

  // Laser power-up
  LASER_SPEED: 400,
  LASER_FIRE_INTERVAL: 0.25,
  LASER_WIDTH: 4,
  LASER_HEIGHT: 14,

  // Bullet time
  BULLET_TIME_SCALE: 0.4,

  // Firewall
  FIREWALL_Y: 440,
  FIREWALL_HEIGHT: 4,

  // EMP
  EMP_RADIUS: 120,

  // Particles
  PARTICLE_COUNT: 8,
  PARTICLE_SPEED_MIN: 80,
  PARTICLE_SPEED_MAX: 200,
  PARTICLE_DECAY: 1.5,

  // Invulnerability after hit
  INVULNERABLE_DURATION: 1500,

  // Wave delay
  LEVEL_TRANSITION_DELAY: 2000,
} as const;

const C = GAME_CONFIG;

// -- Phaser game config --
export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: C.WIDTH,
  height: C.HEIGHT,
  backgroundColor: MATRIX_COLORS.BACKGROUND_HEX,
  pixelArt: true,
  render: { ...PHASER_RENDER_DEFAULTS },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    CodeBreakerBootScene,
    CodeBreakerMenuScene,
    CodeBreakerGameScene,
    CodeBreakerGameOverScene,
    HighScoreEntryScene,
  ],
  input: {
    keyboard: true,
  },
};
