/**
 * Phaser game integration types
 * Shared types for React-Phaser bridge
 */

import type Phaser from 'phaser';

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
  | 'achievement'
  | 'gameOver'
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

/** Game over event data */
export interface GameOverEventData {
  score: number;
  reason?: string;
}

/** Registry keys for passing data between React and Phaser */
export const REGISTRY_KEYS = {
  ACHIEVEMENT_MANAGER: 'achievementManager',
  IS_MUTED: 'isMuted',
  ON_GAME_EVENT: 'onGameEvent',
  SOUND_SYSTEM: 'soundSystem',
  SAVE_SYSTEM: 'saveSystem',
  GAME_ID: 'gameId',
} as const;

/** Scene keys for consistent navigation */
export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
  UI: 'UIScene',
} as const;

/** Base scene class type with registry access helpers */
export interface BaseSceneHelpers {
  getAchievementManager(): AchievementManager | undefined;
  getIsMuted(): boolean;
  emitGameEvent(event: GameEvent): void;
  playSound(key: string): void;
}

/** Config for creating a Phaser game */
export interface PhaserGameConfig {
  gameId: string;
  width: number;
  height: number;
  scenes: typeof Phaser.Scene[];
  physics?: {
    gravity?: { x?: number; y?: number };
    debug?: boolean;
  };
  backgroundColor?: string;
}

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
} as const;

/** Sound effect keys (matching useSoundSystem) */
export const SOUND_KEYS = {
  JUMP: 'jump',
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
} as const;
