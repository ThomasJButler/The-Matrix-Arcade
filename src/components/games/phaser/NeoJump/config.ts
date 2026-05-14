/**
 * Neo Jump - Game Configuration
 *
 * Doodle Jump-style vertical platformer with Matrix theme.
 * Auto-bounce on platforms, reach maximum altitude.
 */

import Phaser from 'phaser';
import { MATRIX_COLORS, PHASER_RENDER_DEFAULTS } from '../../../../lib/phaser/types';
import { NeoJumpBootScene } from './scenes/BootScene';
import { NeoJumpMenuScene } from './scenes/MenuScene';
import { NeoJumpGameScene } from './scenes/GameScene';
import { NeoJumpGameOverScene } from './scenes/GameOverScene';
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';

/** Game constants */
export const GAME_CONFIG = {
  /** Game dimensions */
  WIDTH: 400,
  HEIGHT: 600,

  /**
   * Player settings.
   *
   * **R86.N2 (2026-04-22)** — new `MAX_FALL_DISTANCE_METRES` dial. Tom's
   * playtest: *"Need to make it so if the player falls over 50 m, they die."*
   *
   * Before R86.N2, only an off-screen plunge (`player.y > cameraBottom + 50`)
   * killed Neo. At high altitudes the camera followed him downward, so a
   * missed-platform fall could last several seconds of free-fall with no
   * consequence — Tom wanted a hard ceiling instead.
   *
   * Units: pixels-per-metre = `SCORING.ALTITUDE_DIVISOR` (10). The death
   * check computes `(player.y - fallApexY) / 10` and triggers when the
   * drop exceeds this value. `fallApexY` resets to `player.y` on every
   * platform collision, so a successful bounce restarts the 50m clock.
   * Picking the threshold in metres (not pixels) keeps the dial honest
   * against the altitude HUD the player is already reading.
   */
  PLAYER: {
    WIDTH: 32,
    HEIGHT: 40,
    JUMP_VELOCITY: -550,
    SPRING_VELOCITY: -800,
    JETPACK_THRUST: -300,
    MOVE_SPEED: 300,
    MAX_VELOCITY_Y: 600,
    MAX_FALL_DISTANCE_METRES: 50,
  },

  /** Platform settings */
  PLATFORMS: {
    WIDTH: 80,
    HEIGHT: 16,
    SPACING_MIN: 50,
    SPACING_MAX: 100,
    HORIZONTAL_PADDING: 50,
  },

  /** Platform types and their probabilities at different altitudes */
  PLATFORM_TYPES: {
    NORMAL: 'normal',
    MOVING: 'moving',
    SPRING: 'spring',
    DISAPPEARING: 'disappearing',
    BREAKABLE: 'breakable',
  },

  /**
   * Enemy settings.
   *
   * **R86.N1 rebalance (2026-04-22)** — Tom's playtest: *"too many bombs early,
   * too quick, you often just hit a bomb out of nowhere; you can't really
   * avoid it."*
   *
   * **R86.N5 second-pass (2026-04-22 late)** — Tom's post-N1 playtest:
   * *"neo jump is still too difficult and there is too many bombs early in
   * the game, meaning the player cannot get momentum and a feel for the
   * game before they die."* Two more dial moves on top of N1:
   *
   * - `SPAWN_ALTITUDE` 800 → 1000 (N5): tutorial zone extended another 200
   *   pixels so the first ~90m of HUD altitude are enemy-free. The N5 tests
   *   re-pin the new boundary.
   * - `SPAWN_CHANCE_BASE` 0.018 → 0.013 (N5): ~28% further reduction on top
   *   of the N1 ~40% cut — compounded, early-game density is now ~57% below
   *   the pre-R86 baseline. The N5 safety-net checkpoint tests re-pin the
   *   new ramp values (1km=0.028, 2km=0.043, 5km=0.088, 10km=MAX).
   *
   * **R86.N1 history (2026-04-22)**:
   * - `SPAWN_ALTITUDE` 500 → 800: tutorial zone extended +300m.
   * - `SPAWN_CHANCE_BASE` 0.03 → 0.018: ~40% reduction, matching Tom's quote.
   * - `SPAWN_CHANCE_MAX` 0.20 → 0.16: ceiling lowered so even late-game the
   *   density never becomes a frame-rate enemy storm.
   * - `SPAWN_CHANCE_PER_1000` 0.02 → 0.015: gentler altitude ramp.
   * - `SPEED_MIN/MAX` 50-100 → 40-75: less frantic lateral motion so the
   *   player can actually line up a shot or dodge.
   * - `SPAWN_Y_OFFSET_ABOVE_CAMERA` NEW 150: enemies now enter 150px above
   *   the camera edge (was hardcoded 50) → ~1s of visible reaction time
   *   before they reach gameplay height.
   * - `MIN_HORIZONTAL_SPACING_FROM_PLAYER` NEW 80: skip any spawn whose X
   *   sits within 80px of the player's X — direct "bomb out of nowhere"
   *   countermeasure so enemies never materialise in the player's ascent
   *   column.
   */
  ENEMIES: {
    SPAWN_ALTITUDE: 1000,
    SPAWN_CHANCE_BASE: 0.013,
    SPAWN_CHANCE_MAX: 0.16,
    SPAWN_CHANCE_PER_1000: 0.015,
    SPEED_MIN: 40,
    SPEED_MAX: 75,
    SPAWN_Y_OFFSET_ABOVE_CAMERA: 150,
    MIN_HORIZONTAL_SPACING_FROM_PLAYER: 80,
  },

  /**
   * Retry countdown dial.
   *
   * **R86.N5 (2026-04-22 late)** — Tom: *"5 seconds between rounds is too
   * heavy when I die in 30s and want to retry fast."* Cold start keeps the
   * established 5-second beat so the first run of a session feels
   * deliberate (matches every other arcade game). Within
   * `RETRY_WINDOW_MS` of a death, the next countdown shortens to
   * `RETRY_COUNTDOWN` so rapid-retry flow stays tight.
   *
   * Persistence is via `game.registry` keyed by `retryLastDeathAt` — the
   * registry outlives scene restarts but dies with the root Phaser.Game
   * instance, so the shortcut resets when the player leaves the portal.
   */
  RETRY: {
    WINDOW_MS: 30_000,
    COLD_COUNTDOWN_SECONDS: 5,
    RETRY_COUNTDOWN_SECONDS: 2,
  },

  /**
   * Opening-beat spawn protection.
   *
   * **R86.N5 (2026-04-22 late)** — Tom's third lever: *"a bomb out of nowhere
   * in the first second of a run is the worst feeling."* The N1 guard
   * (`MIN_HORIZONTAL_SPACING_FROM_PLAYER`) stops new spawns landing in the
   * player's column, but an enemy already in flight during countdown can
   * still be sitting directly above Neo when gameplay frame 1 fires. This
   * block adds a *time* barrier on top of the existing *space* barrier:
   *
   * - `DURATION_MS` 1000: first second of gameplay is fully protected. No
   *   enemy spawns fire inside the window, and enemy collisions on the
   *   player are no-ops (brief invuln). Window starts when the countdown
   *   finishes, not when `create()` runs — so the countdown itself doesn't
   *   count toward the budget.
   * - `FLASH_PERIOD_MS` 200: visual cue so the player reads "I'm safe for
   *   a moment" — alpha yo-yos 1.0 ↔ 0.4 on a 200ms cycle. Chosen loose
   *   enough not to feel strobing but crisp enough to register.
   */
  SPAWN_PROTECTION: {
    DURATION_MS: 1000,
    FLASH_PERIOD_MS: 200,
  },

  /**
   * Jetpack settings.
   *
   * **R86.N1 rebalance (2026-04-22)** — Tom: *"give more power to the
   * player."* Flight budget widened so the jetpack is a real panic escape,
   * not a 3s sputter:
   *
   * - `FUEL_MAX` 100 → 120 (+20% capacity)
   * - `FUEL_REGEN` 5 → 8 per landing (+60% platform recovery)
   * - `FUEL_DRAIN` 30 → 25 per second (~17% slower burn)
   *
   * Effective flight-time-per-full-tank: was 100/30 ≈ 3.33s → now 120/25 =
   * **4.8s** (+44% airtime). Two platform landings now fully refill (was
   * 20 landings from empty; now 15). Locked as an invariant test below so
   * a future edit can't regress just one of the three values.
   */
  JETPACK: {
    FUEL_MAX: 120,
    FUEL_REGEN: 8,
    FUEL_DRAIN: 25,
  },

  /** Physics */
  PHYSICS: {
    GRAVITY: 800,
  },

  /** Collectibles */
  COLLECTIBLES: {
    SPAWN_CHANCE: 0.25,
    SPAWN_ALTITUDE: 200,
    SIZE: 24,
    FUEL_RESTORE: 50,
    SCORE_BONUS: 500,
    SHIELD_DURATION: 5000,
  },

  /** Scoring */
  SCORING: {
    ALTITUDE_DIVISOR: 10, // score = altitude / 10
    ENEMY_KILL: 100,
  },

  /** Parallax depth layers */
  PARALLAX: {
    LAYERS: [
      { key: 'skyline',       scrollFactor: 0.3, depth: -40, color: 0x004400 },
      { key: 'mid_buildings', scrollFactor: 0.5, depth: -30, color: MATRIX_COLORS.DEEP_GREEN },
      { key: 'near_arches',   scrollFactor: 0.7, depth: -20, color: MATRIX_COLORS.DIM_GREEN },
    ],
    RAIN_DEPTH: -50,
  },
} as const;

/** Achievement IDs for Neo Jump */
export const ACHIEVEMENTS = {
  FIRST_JUMP: 'neojump_first_jump',
  ALTITUDE_1000: 'neojump_altitude_1000',
  ALTITUDE_5000: 'neojump_altitude_5000',
  KILL_ENEMY: 'neojump_kill_enemy',
  KILL_5_ENEMIES: 'neojump_kill_5',
  USE_JETPACK: 'neojump_jetpack',
  SPRING_BOUNCE: 'neojump_spring',
  COMBO_BOUNCE: 'neojump_combo_5', // 5 bounces without touching ground
  COLLECT_SHIELD: 'neojump_shield',
  COLLECT_10: 'neojump_collect_10',
} as const;

/** Phaser game configuration */
export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  backgroundColor: MATRIX_COLORS.BACKGROUND,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GAME_CONFIG.PHYSICS.GRAVITY },
      debug: false,
    },
  },
  scene: [NeoJumpBootScene, NeoJumpMenuScene, NeoJumpGameScene, NeoJumpGameOverScene, HighScoreEntryScene],
  input: {
    keyboard: true,
  },
  render: {
    ...PHASER_RENDER_DEFAULTS,
    pixelArt: true,
    antialias: false,
  },
};
