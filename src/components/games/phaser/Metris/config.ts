import Phaser from 'phaser';
import { MetrisBootScene } from './scenes/BootScene';
import { MetrisMenuScene } from './scenes/MenuScene';
import { MetrisGameScene } from './scenes/GameScene';
import { MetrisGameOverScene } from './scenes/GameOverScene';

export const TETROMINO_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;
export type TetrominoType = (typeof TETROMINO_TYPES)[number];

export interface TetrominoDef {
  shape: number[][];
  color: number;
  colorHex: string;
  char: string;
}

export const TETROMINO_DEFS: Record<TetrominoType, TetrominoDef> = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: 0x00ffff, colorHex: '#00FFFF', char: '01' },
  O: { shape: [[1, 1], [1, 1]], color: 0xffff00, colorHex: '#FFFF00', char: 'ア' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: 0xff00ff, colorHex: '#FF00FF', char: 'イ' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: 0x00ff00, colorHex: '#00FF00', char: 'ウ' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: 0xff0000, colorHex: '#FF0000', char: 'エ' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: 0x0000ff, colorHex: '#0000FF', char: 'オ' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: 0xffa500, colorHex: '#FFA500', char: 'カ' },
};

export interface CellData {
  type: TetrominoType;
  color: number;
  glow: number;
}

export interface PieceState {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
  rotation: number;
}

export interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  life: number;
  size: number;
}

// SRS wall kick offsets (y-down coordinate system, matching React version)
// Indexed by from-rotation state (0=spawn, 1=R, 2=180, 3=L)
export const WALL_KICKS_CW: [number, number][][] = [
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],   // 0→R
  [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],        // R→2
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],        // 2→L
  [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],      // L→0
];

export const WALL_KICKS_CCW: [number, number][][] = [
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],        // 0→L
  [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],          // R→0
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],      // 2→R
  [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],       // L→2
];

export const SCORE_TABLE = [0, 100, 300, 500, 800] as const;

export const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 450,

  COLS: 10,
  ROWS: 20,
  CELL_SIZE: 20,
  GRID_X: 300,
  GRID_Y: 25,

  INITIAL_DROP_SPEED: 400,
  SPEED_DECREASE: 30,
  MIN_DROP_SPEED: 100,
  SOFT_DROP_SPEED: 50,
  LINES_PER_LEVEL: 10,

  BULLET_TIME_DURATION: 8000,
  BULLET_TIME_SLOWDOWN: 0.4,
  BULLET_TIME_METER_PER_LINE: 20,
  BULLET_TIME_MAX_METER: 100,

  DAS_DELAY: 170,
  DAS_RATE: 50,

  HARD_DROP_POINTS_PER_CELL: 2,

  PARTICLE_COUNT_PER_CELL: 3,
  PARTICLE_SPEED_MIN: 80,
  PARTICLE_SPEED_MAX: 200,
  PARTICLE_GRAVITY: 300,
  PARTICLE_FADE: 0.95,

  GLOW_DECAY: 0.02,

  HOLD_X: 150,
  HOLD_Y: 30,
  NEXT_X: 650,
  NEXT_Y: 30,
  PREVIEW_CELL: 16,
} as const;

export const ACHIEVEMENTS = {
  FIRST_LINE: 'metris_first_line',
  TETRIS: 'metris_tetris',
  LEVEL_10: 'metris_level_10',
  HIGH_ROLLER: 'metris_high_roller',
  LINE_CLEARER: 'metris_line_clearer',
  COMBO_KING: 'metris_combo_king',
  IMMORTAL: 'metris_immortal',
  MARATHON_RUNNER: 'metris_marathon_runner',
  PERFECT_START: 'metris_perfect_start',
  ARCHITECT: 'metris_architect',
  T_SPIN_MASTER: 'metris_t_spin_master',
  NEOS_APPRENTICE: 'metris_neos_apprentice',
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
    MetrisBootScene,
    MetrisMenuScene,
    MetrisGameScene,
    MetrisGameOverScene,
  ],
};
