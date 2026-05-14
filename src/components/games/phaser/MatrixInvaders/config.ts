import Phaser from 'phaser';
import { MatrixInvadersBootScene } from './scenes/BootScene';
import { MatrixInvadersMenuScene } from './scenes/MenuScene';
import { MatrixInvadersGameScene } from './scenes/GameScene';
import { MatrixInvadersGameOverScene } from './scenes/GameOverScene';
import { HighScoreEntryScene } from '../../../../lib/phaser/scenes/HighScoreEntryScene';
import { MATRIX_COLORS, PHASER_RENDER_DEFAULTS } from '../../../../lib/phaser/types';

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
  // R85.I8: 1-indexed encounter counter (wave 5 = 1, wave 10 = 2, ...).
  // Lets updateBoss/defeatBoss scale fire cadence + particle count without
  // re-reading `this.wave` — keeps boss behaviour determined by its own
  // state, not a scene-level wave counter that might drift post-respawn.
  encounter: number;
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
  code:     { health: 1, value: 10,  speedMultiplier: 1.0, color: MATRIX_COLORS.PRIMARY },
  agent:    { health: 2, value: 30,  speedMultiplier: 1.5, color: MATRIX_COLORS.MEDIUM_GREEN },
  sentinel: { health: 3, value: 50,  speedMultiplier: 1.2, color: MATRIX_COLORS.FOREST_GREEN },
  virus:    { health: 1, value: 20,  speedMultiplier: 2.0, color: MATRIX_COLORS.RED, splits: true },
};

/**
 * Per-row tint colours for invader sprites.
 * Row 0 = top row, Row 4 = bottom row.
 * Uses Matrix palette: bright green → cyan → yellow shades.
 */
export const ROW_TINTS: readonly number[] = [
  0x00ffff, // row 0 — cyan
  0x00ff88, // row 1 — green-cyan
  0x00ff00, // row 2 — matrix green
  0xaaff00, // row 3 — yellow-green
  0xffff00, // row 4 — yellow
] as const;

export const POWERUP_DEFS: Record<PowerUpType, { color: number; label: string; duration: number }> = {
  rapidFire:       { color: 0xffff00, label: 'RAPID',  duration: 8000 },
  shield:          { color: 0xff00ff, label: 'SHIELD', duration: 0 },
  scoreMultiplier: { color: 0x00ffff, label: '2X',     duration: 8000 },
  bomb:            { color: 0xff4400, label: 'BOMB',   duration: 0 },
};

// R85.I6 — On-pickup 4-line HUD legend that teaches the player what each
// power-up does. Tom's playtest note: *"6 power-ups each collect + activate —
// need work and we need a key"*. Pattern copied from Vortex Pong's R84.P5:
// the row for the picked-up power-up paints at ACTIVE_ALPHA in that entry's
// colour, the other three dim to INACTIVE_ALPHA so the player sees all
// options but the eye tracks the highlighted row. Legend rebuilds on every
// pickup (not stack) and auto-hides after DISPLAY_MS so it does not clutter
// the HUD. Tom mentioned six power-ups; Invaders currently ships four — the
// legend covers every implemented one. If R85.I6-follow-up or R86 adds the
// other two, extend ENTRIES here and POWERUP_DEFS above in lockstep.
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
    { type: 'rapidFire',       name: 'RAPID',  effect: 'FIRE RATE 2.5X', duration: '8s'    },
    { type: 'shield',          name: 'SHIELD', effect: 'BLOCKS 1 HIT',   duration: '1 HIT' },
    { type: 'scoreMultiplier', name: '2X',     effect: 'SCORE DOUBLE',   duration: '8s'    },
    { type: 'bomb',            name: 'BOMB',   effect: 'CLEAR SCREEN',   duration: 'NOW'   },
  ],
  DISPLAY_MS: 4000,
  FADE_IN_MS: 200,
  FADE_OUT_MS: 400,
  LINE_HEIGHT: 12,
  // ~315px on the 450px canvas — below the central active/ready banners
  // (y=0.30, 0.40, 0.45) and above the player sprite zone (y=410). Leaves
  // clear air for the 4-line block (~48px tall, spans y≈315-363).
  BASE_Y_RATIO: 0.70,
  ACTIVE_ALPHA: 1,
  INACTIVE_ALPHA: 0.55,
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
  // R85.I3: enemy bullets bumped from 3×6 → 8×18 (Tom's playtest: *"enemy
  // bullets Needs to be bigger"*). Height > PLAYER_BULLET_HEIGHT so threats
  // read as distinct from player fire at a glance, and the procedural
  // texture gets a halo that reads against scanline + matrix-rain backdrop.
  // Single source of truth — GameScene no longer branches on sprite-mode
  // or laser_red presence when sizing enemy bullets.
  ENEMY_BULLET_WIDTH: 8,
  ENEMY_BULLET_HEIGHT: 18,
  // R85.I3: trail ghost rects spawn once every ~40ms per active enemy
  // bullet to give peripheral-vision motion salience without drowning the
  // particle pool (worst case ≈ 25 trails/sec × ~8 bullets = 200 rects/s,
  // all lifetimes < 1s).
  ENEMY_BULLET_TRAIL_INTERVAL: 0.04,
  FIRE_COOLDOWN: 250,
  RAPID_FIRE_COOLDOWN: 100,

  WAVE_COLS: 8,
  WAVE_ROWS: 5,
  ENEMY_WIDTH: 32,
  ENEMY_HEIGHT: 24,
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
  // R85.I8: bumped 0.002 → 0.006 per barrel (3×). Pre-R85.I8 the boss fired
  // ~0.36 shots/sec across 3 barrels — *less* than a regular wave of 40
  // enemies (2.4 shots/sec via ENEMY_FIRE_CHANCE=0.001). Post-bump: ~1.08
  // shots/sec at encounter 1, which is half-ish of a regular wave and feels
  // like a credible climax. The per-encounter multiplier below then ramps it
  // further so wave-25 bosses are materially nastier than wave-5 bosses.
  BOSS_FIRE_CHANCE: 0.006,
  // R85.I8: every encounter adds this fraction to the fire-rate multiplier.
  // encounter 1 = 1.0×, encounter 2 = 1.3×, encounter 3 = 1.6×, encounter 5
  // = 2.2×. Linear curve chosen (not exponential) so the wall never becomes
  // unfair — a skilled player should still be able to dodge at wave 25.
  BOSS_FIRE_CHANCE_PER_ENCOUNTER: 0.3,
  // R85.I8: when boss HP drops below this ratio the fire rate multiplies
  // by ENRAGE_FIRE_MULTIPLIER. Matches the RED healthbar colour threshold
  // in drawBossHealthBar() so the visual warning the player already sees
  // (bar flips red) now carries a real mechanical consequence — classic
  // enrage phase, telegraphed via colour before it activates.
  BOSS_ENRAGE_THRESHOLD: 0.25,
  BOSS_ENRAGE_FIRE_MULTIPLIER: 2.0,
  // R85.I8: camera shake on boss hit — small but consistent. Pre-fix the
  // boss absorbed every hit with only a 100ms white tint, lost against
  // its 120×60 sprite. 50ms × 0.003 is the quietest shake that still
  // registers; anything stronger chains into nausea territory at rapid
  // fire rates.
  BOSS_HIT_SHAKE_DURATION: 50,
  BOSS_HIT_SHAKE_INTENSITY: 0.003,
  // R85.I8: defeat camera juice — parity with wave-complete (150ms, 0.006
  // shake / 0.15 flash) but stronger because this is a multi-minute
  // encounter's climax. 350ms shake + 300ms green flash at α=0.3 tops the
  // wave-complete punctuation without overtaking game-over (500ms, 0.25α).
  BOSS_DEFEAT_SHAKE_DURATION: 350,
  BOSS_DEFEAT_SHAKE_INTENSITY: 0.012,
  BOSS_DEFEAT_FLASH_DURATION: 300,
  BOSS_DEFEAT_FLASH_ALPHA: 0.3,
  // R85.I8: defeat explosion particle count scales with encounter — bigger
  // bosses (wave 25 = encounter 5) get bigger death throes. Base 40 matches
  // pre-fix main burst; per-encounter bonus of 8 keeps wave-25 at ~72 main
  // particles (side bursts scale separately via spawnExplosion count args).
  BOSS_DEFEAT_MAIN_PARTICLES_BASE: 40,
  BOSS_DEFEAT_PARTICLES_PER_ENCOUNTER: 8,
  BOSS_Y: 60,

  BULLET_TIME_DURATION: 5000,
  BULLET_TIME_SCALE: 0.3,
  // R85.I2: cooldown between activations drives the HUD meter's refill so
  // players can see when the ability is ready again. 10s keeps the verb rare
  // enough to feel earned but not so rare that the meter reads as broken.
  BULLET_TIME_COOLDOWN: 10000,

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

// R85.I7 — Matrix-style atmosphere amp-up. Tom's playtest: *"just give the
// game more jazz, I guess. Matrix style."* Before R85.I7 the backdrop was a
// black fill + 10-char-rain only — the play field felt like a blank canvas
// instead of a terminal inside the Matrix. This config centralises the four
// procedural uplifts (rain density, CRT scanline overlay, per-kill Matrix-
// green flash, combo-milestone camera pulse) so designer-level tweaks live
// in one place rather than scattered magic numbers across the scene.
//
// Values were picked in pairs: each stat has a floor that makes the effect
// land (tested via the unit specs below) and a ceiling that keeps gameplay
// legible — pushing alpha/density past the ceiling drowns bullets or makes
// the background compete with enemies for attention.
export const ATMOSPHERE = {
  // 30 is the sweet spot: the dead-black regions between enemy rows fill
  // with drifting glyphs, but the screen doesn't look like a wall of rain
  // that competes with bullet motion. < 20 looks sparse; > 40 starts
  // choking readability on the 800×450 canvas.
  RAIN_DENSITY: 30,
  // CRT scanline overlay pixel constants. Spacing 3 keeps visible gaps so
  // rain + gameplay read through; 2 reads as matte tint, 4 reads as stripes.
  // Alpha 0.06 is below the threshold where bullets lose contrast (≥ 0.12
  // starts hurting enemy-bullet reads from R85.I3) but above the vanishing
  // threshold (≤ 0.03 reads as a rendering bug).
  SCANLINE_SPACING: 3,
  SCANLINE_ALPHA: 0.06,
  // Scanline overlay depth: above gameplay (3-6) so the CRT effect sits
  // on top like a real phosphor screen, below HUD text (100) so banners
  // stay crisp. 8 leaves room for the kill-flash particle layer at 7.
  SCANLINE_DEPTH: 8,
  // Green kill flash spawned at enemy position on kill. Piggybacks on the
  // particles[] decay loop — vx=vy=0 so it stays put, life=0.3 gives ~250ms
  // fade with PARTICLE_DECAY=1.2 (0.3 / 1.2 × 1000 ≈ 250ms). Size 28 is
  // slightly larger than the 25.6×19.2 scaled enemy sprite so the flash
  // reads as a halo, not a silhouette replacement. Initial alpha 0.9 so
  // the first frame pops before the decay loop takes over.
  KILL_FLASH_SIZE: 28,
  KILL_FLASH_LIFE: 0.3,
  KILL_FLASH_INITIAL_ALPHA: 0.9,
  KILL_FLASH_DEPTH: 7,
  // Combo milestone pulse: every Nth combo kill fires a Matrix-green camera
  // flash. Too frequent (every kill) → nausea / seizure risk; too rare
  // (> 10) → the reward shaping disappears. 5 matches the COMBO_10 achievement
  // halfway marker so players see a pulse exactly mid-achievement.
  COMBO_PULSE_EVERY: 5,
  COMBO_PULSE_DURATION: 80,
  // 0.08 α keeps the pulse as ambience, not a full-screen flash. Compare
  // to wave-clear flash (0.15) and game-over flash (0.25) — combo pulse
  // intentionally sits below both so the wave-complete punctuation remains
  // the strongest feedback moment.
  COMBO_PULSE_ALPHA: 0.08,
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
  render: { ...PHASER_RENDER_DEFAULTS },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [
    MatrixInvadersBootScene,
    MatrixInvadersMenuScene,
    MatrixInvadersGameScene,
    MatrixInvadersGameOverScene,
    HighScoreEntryScene,
  ],
};
