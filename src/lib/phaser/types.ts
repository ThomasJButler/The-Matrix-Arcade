/**
 * Phaser game integration types
 * Shared types for React-Phaser bridge
 */

/** Achievement manager interface matching the arcade's pattern */
export interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

/** Standard props for all Phaser game components */
export interface PhaserGameProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
  onExit?: () => void;
}

/** Game events emitted from Phaser scenes to React */
export type GameEventType =
  | 'score'
  | 'scoreMilestone'
  | 'matchPoint'
  | 'achievement'
  | 'gameOver'
  | 'highScoreEntry'
  | 'pause'
  | 'resume'
  | 'mute'
  | 'exit';

export interface GameEvent {
  type: GameEventType;
  data?: unknown;
}

/** Score event data */
export interface ScoreEventData {
  score: number;
  highScore?: number;
}

/** Achievement event data */
export interface AchievementEventData {
  achievementId: string;
}

/** Single stat displayed on the game-over screen */
export interface GameOverStat {
  label: string;
  value: string | number;
}

/** Game over event data */
export interface GameOverEventData {
  score: number;
  reason?: string;
}

/**
 * Score milestone event data. Scenes emit one of these the first time a run
 * crosses each threshold it cares about (Matrix Bird: 50/100/250). The React
 * wrapper surfaces the milestone to screen readers so AT users get the same
 * beat-by-beat progression feedback sighted players get from the stinger SFX.
 */
export interface ScoreMilestoneEventData {
  /** The threshold value that was just crossed (e.g. 50, 100, 250). */
  value: number;
}

/**
 * R84.CI-5 — match-point event data. Vortex Pong's scoring is
 * win-condition-based (first to WIN_SCORE=10), so the cumulative-threshold
 * shape used by `scoreMilestone` doesn't map. Instead the scene emits one
 * of these the first time either side reaches WIN_SCORE - 1 in a run: the
 * "one away from winning" tension beat that sighted players see as the
 * score digit flipping to 9 but AT users had no surface for. `side` lets
 * the announcement disambiguate player vs opponent without the wrapper
 * needing to reach back into Pong-specific state.
 */
export interface MatchPointEventData {
  /** Who is one point from winning. */
  side: 'player' | 'opponent';
}

/**
 * Window-level custom event dispatched by the React portal dashbar to ask the
 * active Phaser scene to toggle pause. Decouples the React control surface
 * from individual game wrappers — BaseScene listens for this event and honours
 * it with the same `allowPause` guard used by the in-game P key.
 */
export const PAUSE_REQUEST_EVENT = 'matrix-arcade:pause-toggle';

/**
 * Reverse channel: BaseScene dispatches this whenever the active scene's pause
 * state actually changes (via P key, dashbar request, or any future trigger).
 * The portal listens so its dashbar centre button can swap between Pause and
 * Play icons in lockstep with true game state — no prop-drilling through the
 * 12 lazy-loaded game wrappers required.
 */
export const PAUSE_STATE_CHANGED_EVENT = 'matrix-arcade:pause-state-changed';

/** Detail shape carried on PAUSE_STATE_CHANGED_EVENT */
export interface PauseStateChangedDetail {
  isPaused: boolean;
}

/**
 * R83.G9 — dispatched by GamePortal the instant the user presses PLAY, BEFORE
 * the parent state flip that mounts the game component. Gives any visual
 * transition layer (current G5 boot overlay, future G10 Matrix-terminal
 * launcher) a hook to start covering the iPod screen synchronously with the
 * click, closing the 1-frame gap where the previous preview image briefly
 * showed through in the bottom-left as the bezel grew.
 */
export const GAME_TRANSITION_BEGIN_EVENT = 'matrix-arcade:game-transition-begin';

/**
 * R83.G9 — dispatched by PhaserGame.tsx once the Phaser.Game instance fires
 * its internal `ready` event (input system initialised, first scene booted).
 * The transition mask listens for this to lift itself at the earliest moment
 * the game canvas is safe to reveal, with a 500 ms safety timeout as a backstop
 * in case `ready` never arrives (e.g. a non-Phaser game wrapper in future).
 */
export const GAME_TRANSITION_READY_EVENT = 'matrix-arcade:game-transition-ready';

/** Registry keys for passing data between React and Phaser */
export const REGISTRY_KEYS = {
  ACHIEVEMENT_MANAGER: 'achievementManager',
  IS_MUTED: 'isMuted',
  ON_GAME_EVENT: 'onGameEvent',
  SOUND_SYSTEM: 'soundSystem',
  SAVE_SYSTEM: 'saveSystem',
  GAME_ID: 'gameId',
  AUTO_START: 'autoStart',
} as const;

/** Scene keys for consistent navigation */
export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
  HIGH_SCORE_ENTRY: 'HighScoreEntryScene',
  UI: 'UIScene',
} as const;

/** Matrix theme font families for Phaser text objects */
export const MATRIX_FONTS = {
  PRIMARY: '"Press Start 2P", monospace',
  MONO: '"Courier New", "Courier", monospace',
} as const;

/** Matrix theme colours */
export const MATRIX_COLORS = {
  PRIMARY: 0x00ff00,
  PRIMARY_HEX: '#00ff00',
  BACKGROUND: 0x000000,
  BACKGROUND_HEX: '#000000',
  CYAN: 0x00ffff,
  CYAN_HEX: '#00ffff',
  RED: 0xff0000,
  RED_HEX: '#ff0000',
  YELLOW: 0xffff00,
  YELLOW_HEX: '#ffff00',
  MAGENTA: 0xff00ff,
  MAGENTA_HEX: '#ff00ff',
  WHITE: 0xffffff,
  WHITE_HEX: '#ffffff',
  DARK_GREEN: 0x003300,
  DARK_GREEN_HEX: '#003300',
  MEDIUM_GREEN: 0x00cc00,
  MEDIUM_GREEN_HEX: '#00cc00',
  DIM_GREEN: 0x00aa00,
  DIM_GREEN_HEX: '#00aa00',
  // R83.CTRLS.17 — "dread green". Used for secondary / ambient terminal chrome
  // (hints, prompts, choice labels before selection). Darker than DIM_GREEN so
  // the reader's eye isn't fighting three near-equal greens in the same frame.
  // Keep it distinct from DEEP_GREEN (#006600, used elsewhere for panels).
  DREAD_GREEN: 0x007700,
  DREAD_GREEN_HEX: '#007700',
  DEEP_GREEN: 0x006600,
  DEEP_GREEN_HEX: '#006600',
  FOREST_GREEN: 0x009900,
  FOREST_GREEN_HEX: '#009900',
  DARK_GREY: 0x333333,
  DARK_GREY_HEX: '#333333',
  NEAR_BLACK: 0x0a1a0a,
  NEAR_BLACK_HEX: '#0a1a0a',
  MUTED_GREEN: 0x338833,
  MUTED_GREEN_HEX: '#338833',
} as const;

/** Sound effect keys (matching useSoundSystem) */
export const SOUND_KEYS = {
  JUMP: 'jump',
  BIRD_FLAP: 'birdFlap',
  HIT: 'hit',
  SCORE: 'score',
  POWERUP: 'powerup',
  LEVEL_UP: 'levelUp',
  COMBO: 'combo',
  GAME_OVER: 'gameOver',
  MENU: 'menu',
  SHOOT: 'shoot',
  RHYTHM_MISS: 'rhythmMiss',
  RHYTHM_GOOD: 'rhythmGood',
  RHYTHM_PERFECT: 'rhythmPerfect',
  RHYTHM_COMBO: 'rhythmCombo',
  WAKA_WAKA: 'wakaWaka',
  GHOST_EAT: 'ghostEat',
  POWERUP_BULLET_TIME: 'powerupBulletTime',
  POWERUP_GHOST: 'powerupGhost',
  POWERUP_SHIELD: 'powerupShield',
  POWERUP_MAGNET: 'powerupMagnet',
  FROGGER_DEATH: 'froggerDeath',
  FROGGER_MOVE: 'froggerMove',
  FROGGER_SCORE: 'froggerScore',
  FROGGER_PICKUP: 'froggerPickup',
  FROGGER_EXTRA_SCORE: 'froggerExtraScore',
  SCOREBOARD_TAB: 'scoreboardTab',
  SCOREBOARD_NEW_HIGH: 'scoreboardNewHigh',
  SCOREBOARD_LETTER_CYCLE: 'scoreboardLetterCycle',
  SCOREBOARD_CONFIRM: 'scoreboardConfirm',
  JACK_IN: 'jackIn',
  ACHIEVEMENT_UNLOCK: 'achievementUnlock',
  PLATFORM_BREAK: 'platformBreak',
  COLLECTIBLE: 'collectible',
  FALL: 'fall',
  BOSS_EXPLOSION: 'bossExplosion',
  ENEMY_ALERT: 'enemyAlert',
  DANGER_WARNING: 'dangerWarning',
  KUNG_FU_HIT: 'kungFuHit',
  GLASS_BREAK: 'glassBreak',
  POWER_DOWN: 'powerDown',
  DOT_EAT: 'dotEat',
  SPECIAL_ABILITY: 'specialAbility',
  UNPLUG: 'unplug',
} as const;
