/**
 * Cloud Jumper - Game Configuration
 *
 * Flappy Bird / Doodle Jump hybrid side-scroller.
 * Jump between clouds from airplane window POV.
 */

import Phaser from 'phaser';
import { CloudJumperBootScene } from './scenes/BootScene';
import { CloudJumperMenuScene } from './scenes/MenuScene';
import { CloudJumperGameScene } from './scenes/GameScene';
import { CloudJumperGameOverScene } from './scenes/GameOverScene';
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';
import { MATRIX_COLORS, PHASER_RENDER_DEFAULTS } from '../../../../lib/phaser/types';

/** Game constants */
export const GAME_CONFIG = {
  /** Game dimensions — 16:9 to match the game portal container */
  WIDTH: 800,
  HEIGHT: 450,

  /** Player settings */
  PLAYER: {
    WIDTH: 32,
    HEIGHT: 32,
    JUMP_VELOCITY: -400,
    GRAVITY: 800,
    MAX_FALL_SPEED: 500,
    START_X: 150,
    START_Y: 225,

    /**
     * R87.C3 — lateral movement speed.
     *
     * Tom's 2026-04-22 playtest: *"The player also needs a bit more control
     * over their speed and jumping height"* + *"The player should be able
     * to stop. This is to avoid hitting things by accident and provide more
     * control."* Cloud Jumper pre-R87.C3 locked the player at `START_X=150`
     * with zero lateral agency — the world auto-scrolled past and obstacles
     * arrived at a fixed column, so "dodging" wasn't really a thing.
     *
     * 200 px/s is ~2× the base scroll (SPEED_BASE=100) so the player can
     * meaningfully outrun or stall the world, but under `SPEED_MAX=300` so
     * lateral movement alone can't carry the player fully past the camera
     * frame (preserves the side-scroller feel).
     */
    HORIZONTAL_SPEED: 200,

    /**
     * R87.C3 — lateral drag when no movement key is held.
     *
     * Phaser arcade `setDrag(HORIZONTAL_DRAG, 0)` applies this deceleration
     * each frame to the X axis only (Y stays gravity-driven). With
     * `HORIZONTAL_SPEED=200`, a `HORIZONTAL_DRAG=800` gives a full-speed
     * → 0 decay in 0.25 s — crisp enough to read as "stop" when Tom
     * releases the key, but not so instant that the release feels robotic.
     * While a move key is held, `setVelocityX(±HORIZONTAL_SPEED)` overrides
     * drag each frame so the player maintains speed.
     */
    HORIZONTAL_DRAG: 800,

    /**
     * R87.C2 — top-of-canvas ceiling for the player.
     *
     * Tom's 2026-04-22 playtest: *"Sometimes the player jumps too hard and
     * he goes off screen. Need to make the platforms lower to account for
     * this or make jumping less high."*
     *
     * Root cause is a compound corner case: `CLOUDS.VERTICAL_RANGE = 100`
     * puts the lowest-Y cloud at y=125 (HEIGHT/2 - 100), moving clouds
     * oscillate ±VERTICAL_RANGE/2 down to y=75, and `JUMP_VELOCITY = -400`
     * at `GRAVITY = 800` yields a 100-px rise. Chaining a manual SPACE
     * press within the 300 ms cloud-contact cooldown from a y=75 moving
     * cloud gives peak y = -25 — demonstrably off-screen.
     *
     * Fix is option (b) from the R87.C2 plan — detect-and-clamp in
     * `update()`. Chosen over option (a) (cap `JUMP_VELOCITY`) because it
     * is a no-op for any jump that wouldn't otherwise escape the canvas,
     * preserving feel for the ~95% of the play area that's well below
     * this line. The clamp pulls `player.y` back to `CEILING_Y` and zeroes
     * upward velocity so gravity immediately pulls the player back into
     * play — the classic Doodle-Jump "sticky ceiling" beat.
     *
     * 20 px sits at the very top of the canvas while keeping the full
     * 32-px player sprite visible (centre at 20 → top edge at 4, bottom
     * edge at 36). Brief overlap with the score HUD at y=20 is cosmetic
     * and only happens during the pathological corner case that this
     * clamp exists to handle.
     */
    CEILING_Y: 20,
  },

  /** Cloud/platform settings */
  CLOUDS: {
    WIDTH_MIN: 80,
    WIDTH_MAX: 150,
    HEIGHT: 30,
    SPACING_MIN: 60,
    SPACING_MAX: 120,
    VERTICAL_RANGE: 100, // Max vertical distance from center
  },

  /** Cloud types — Matrix green palette */
  CLOUD_TYPES: {
    NORMAL: { weight: 0.6, color: MATRIX_COLORS.MEDIUM_GREEN },
    MOVING: { weight: 0.2, color: 0x00dddd },
    DISAPPEARING: { weight: 0.1, color: 0x338833 },
    STORM: { weight: 0.1, color: 0x663333 },
  },

  /** Auto-scroll speed (increases over time) */
  SCROLL: {
    SPEED_BASE: 100,
    SPEED_MAX: 300,
    ACCELERATION: 5, // per second
  },

  /** Collectibles */
  COLLECTIBLES: {
    SPAWN_CHANCE: 0.3,
    POINT_VALUE: 100,
    TYPES: ['star', 'gem', 'coin'],
  },

  /** Obstacles */
  OBSTACLES: {
    SPAWN_DISTANCE: 500, // Start spawning after this distance
    SPAWN_CHANCE_BASE: 0.1,
    SPAWN_CHANCE_MAX: 0.3,
    TYPES: ['bird', 'plane'],
  },

  /** Scoring */
  SCORING: {
    DISTANCE_DIVISOR: 10, // Score = distance / 10
    CLOUD_BONUS: 10,
    COLLECTIBLE: 100,
  },
} as const;

/** Achievement IDs */
export const ACHIEVEMENTS = {
  FIRST_JUMP: 'cloud_first_jump',
  DISTANCE_500: 'cloud_distance_500',
  DISTANCE_2000: 'cloud_distance_2000',
  COLLECT_10: 'cloud_collect_10',
  SURVIVE_STORM: 'cloud_survive_storm',
  BOUNCE_STREAK: 'cloud_bounce_10', // 10 bounces without missing
  CLOSE_CALL: 'cloud_close_call', // Near miss with obstacle
} as const;

/** Phaser game configuration */
export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  backgroundColor: MATRIX_COLORS.NEAR_BLACK, // Dark Matrix-green sky
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GAME_CONFIG.PLAYER.GRAVITY },
      debug: false,
    },
  },
  scene: [CloudJumperBootScene, CloudJumperMenuScene, CloudJumperGameScene, CloudJumperGameOverScene, HighScoreEntryScene],
  input: {
    keyboard: true,
  },
  render: {
    ...PHASER_RENDER_DEFAULTS,
    pixelArt: true,
    antialias: false,
  },
};
