import Phaser from 'phaser';
import { SnakeBootScene } from './scenes/BootScene';
import { SnakeMenuScene } from './scenes/MenuScene';
import { SnakeGameScene } from './scenes/GameScene';
import { SnakeGameOverScene } from './scenes/GameOverScene';
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type PowerUpType = 'speed' | 'double' | 'shield' | 'ghost';

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
} as const;

export const POWERUP_DEFS: Record<PowerUpType, { color: number; label: string }> = {
  speed: { color: 0xffff00, label: 'SLOW' },
  double: { color: 0x0099ff, label: '2X' },
  shield: { color: 0xff00ff, label: 'SHIELD' },
  ghost: { color: 0x00ffff, label: 'GHOST' },
};

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
