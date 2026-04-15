/**
 * CTRL-S World - Game Configuration
 *
 * Narrative text adventure with Matrix theme.
 * Phaser rewrite of the React-based CtrlSWorld component.
 */

import Phaser from 'phaser';
import { MATRIX_COLORS } from '../../../../lib/phaser/types';
import { CtrlSBootScene } from './scenes/BootScene';
import { CtrlSMenuScene } from './scenes/MenuScene';
import { CtrlSChapterHubScene } from './scenes/ChapterHubScene';
import { CtrlSNarrativeScene } from './scenes/NarrativeScene';
import { CtrlSGameOverScene } from './scenes/GameOverScene';

export const CTRLS_SCENE_KEYS = {
  BOOT: 'CtrlSBootScene',
  MENU: 'CtrlSMenuScene',
  CHAPTER_HUB: 'CtrlSChapterHubScene',
  NARRATIVE: 'CtrlSNarrativeScene',
  GAME_OVER: 'CtrlSGameOverScene',
} as const;

export const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,

  TEXT: {
    TYPEWRITER_SPEED_FAST: 5,
    TYPEWRITER_SPEED_MEDIUM: 15,
    TYPEWRITER_SPEED_SLOW: 30,
    LINE_HEIGHT: 24,
    MARGIN_X: 40,
    MARGIN_Y: 80,
    MAX_WIDTH: 520,
  },

  CHAPTERS: {
    TOTAL: 6,
  },
} as const;

export const ACHIEVEMENTS = {
  FIRST_PUZZLE: 'ctrl_first_puzzle',
  NO_HINTS: 'ctrl_no_hints',
  CHAPTER_1: 'ctrl_chapter_1',
  CHAPTER_3: 'ctrl_chapter_3',
  STORY_COMPLETE: 'ctrl_story_complete',
  SPEED_READER: 'ctrl_speed_reader',
  PUZZLE_MASTER: 'ctrl_puzzle_master',
} as const;

export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  backgroundColor: MATRIX_COLORS.BACKGROUND,
  scene: [
    CtrlSBootScene,
    CtrlSMenuScene,
    CtrlSChapterHubScene,
    CtrlSNarrativeScene,
    CtrlSGameOverScene,
  ],
  input: {
    keyboard: true,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
