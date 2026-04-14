/**
 * Phaser integration module
 *
 * Exports all components and utilities for building Phaser games
 * that integrate with the Matrix Arcade React application.
 */

// React wrapper
export { PhaserGame } from './PhaserGame';
export type { PhaserGameWrapperProps } from './PhaserGame';

// Base scenes
export { BaseScene } from './scenes/BaseScene';
export { BootScene } from './scenes/BootScene';
export type { BootSceneConfig } from './scenes/BootScene';
export { MenuScene } from './scenes/MenuScene';
export type { MenuSceneConfig } from './scenes/MenuScene';
export { GameOverScene } from './scenes/GameOverScene';
export type { GameOverSceneConfig, GameOverData } from './scenes/GameOverScene';

// Types and constants
export {
  REGISTRY_KEYS,
  SCENE_KEYS,
  MATRIX_COLORS,
  MATRIX_FONTS,
  SOUND_KEYS,
  type AchievementManager,
  type PhaserGameProps,
  type GameEvent,
  type GameEventType,
  type ScoreEventData,
  type AchievementEventData,
  type GameOverEventData,
} from './types';
