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

export interface CharacterDef {
  id: string;
  name: string;
  initial: string;
  portraitKey?: string;
  colour: number;
  colourHex: string;
}

export const CHARACTERS: Record<string, CharacterDef> = {
  averag: {
    id: 'averag',
    name: 'Aver-Ag',
    initial: 'A',
    portraitKey: 'portrait-protagonist',
    colour: 0x00ff00,
    colourHex: '#00ff00',
  },
  senora: {
    id: 'senora',
    name: 'Señora',
    initial: 'S',
    colour: 0x00ccff,
    colourHex: '#00ccff',
  },
  elon: {
    id: 'elon',
    name: 'Elon-gated',
    initial: 'E',
    colour: 0xffcc00,
    colourHex: '#ffcc00',
  },
  steve: {
    id: 'steve',
    name: 'Steve',
    initial: 'S',
    colour: 0xff6600,
    colourHex: '#ff6600',
  },
  billiam: {
    id: 'billiam',
    name: 'Billiam',
    initial: 'B',
    colour: 0x9966ff,
    colourHex: '#9966ff',
  },
  samuel: {
    id: 'samuel',
    name: 'Samuel',
    initial: 'S',
    colour: 0xff3366,
    colourHex: '#ff3366',
  },
  protector: {
    id: 'protector',
    name: 'Protector',
    initial: 'P',
    colour: 0xff0000,
    colourHex: '#ff0000',
  },
} as const;

export const PORTRAIT_CONFIG = {
  SIZE: 70,
  PANEL_WIDTH: 100,
  PANEL_PADDING: 10,
  NAME_OFFSET_Y: 8,
  FADE_DURATION: 300,
  TEXT_INDENT: 130,
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
