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
import { CtrlSPuzzleScene } from './scenes/PuzzleScene';
import { CtrlSInventoryScene } from './scenes/InventoryScene';

export const CTRLS_SCENE_KEYS = {
  BOOT: 'CtrlSBootScene',
  MENU: 'CtrlSMenuScene',
  CHAPTER_HUB: 'CtrlSChapterHubScene',
  NARRATIVE: 'CtrlSNarrativeScene',
  GAME_OVER: 'CtrlSGameOverScene',
  PUZZLE: 'CtrlSPuzzleScene',
  INVENTORY: 'CtrlSInventoryScene',
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
  CHAPTER_2: 'ctrl_chapter_2',
  CHAPTER_3: 'ctrl_chapter_3',
  CHAPTER_4: 'ctrl_chapter_4',
  CHAPTER_5: 'ctrl_chapter_5',
  STORY_COMPLETE: 'ctrl_story_complete',
  SPEED_READER: 'ctrl_speed_reader',
  PUZZLE_MASTER: 'ctrl_puzzle_master',
  COMPLETIONIST: 'ctrl_completionist',
} as const;

export const CHAPTER_ACHIEVEMENTS: Record<number, string> = {
  1: ACHIEVEMENTS.CHAPTER_1,
  2: ACHIEVEMENTS.CHAPTER_2,
  3: ACHIEVEMENTS.CHAPTER_3,
  4: ACHIEVEMENTS.CHAPTER_4,
  5: ACHIEVEMENTS.CHAPTER_5,
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

export type ChapterStatus = 'locked' | 'available' | 'in-progress' | 'complete';

export const CTRLS_REGISTRY_KEYS = {
  COMPLETED_CHAPTERS: 'completedChapters',
  COMPLETED_PUZZLES: 'completedPuzzles',
  CURRENT_CHAPTER: 'currentChapter',
  INVENTORY: 'inventory',
} as const;

export const HUB_CONFIG = {
  COLS: 2,
  TILE_W: 340,
  TILE_H: 130,
  GAP_X: 24,
  GAP_Y: 18,
  HEADER_Y: 38,
  SUBTITLE_Y: 64,
  GRID_TOP_Y: 100,
  STAGGER_DELAY: 80,
  TILE_FADE_DURATION: 400,
  SELECT_PULSE_DURATION: 1200,
  LAUNCH_ZOOM_DURATION: 350,
  PROGRESS_BAR_W: 120,
  PROGRESS_BAR_H: 6,
} as const;

export const PARALLAX_CONFIG = {
  BG_ALPHA: 0.12,
  BG_DRIFT_SPEED: 4,
  BG_DRIFT_AMPLITUDE: 15,
  PARTICLE_COUNT: 20,
  PARTICLE_MIN_SPEED: 8,
  PARTICLE_MAX_SPEED: 30,
  PARTICLE_MIN_ALPHA: 0.1,
  PARTICLE_MAX_ALPHA: 0.4,
} as const;

export const PORTRAIT_CONFIG = {
  SIZE: 70,
  PANEL_WIDTH: 100,
  PANEL_PADDING: 10,
  NAME_OFFSET_Y: 8,
  FADE_DURATION: 300,
  TEXT_INDENT: 130,
} as const;

export const CHARACTER_TICK_MAP: Record<string, string> = {
  averag: 'ctrlsTickProtagonist',
  senora: 'ctrlsTickNpc',
  elon: 'ctrlsTickAntagonist',
  steve: 'ctrlsTickAntagonist',
  billiam: 'ctrlsTickAntagonist',
  samuel: 'ctrlsTickNpc',
  protector: 'ctrlsTickAntagonist',
} as const;

export const NARRATOR_TICK = 'ctrlsTickNarrator';

export const STINGER_KEYS = {
  PUZZLE_APPEAR: 'ctrlsPuzzleAppear',
  PUZZLE_SOLVED: 'ctrlsPuzzleSolved',
  PUZZLE_FAILED: 'ctrlsPuzzleFailed',
  CHAPTER_START: 'ctrlsChapterStart',
  CHAPTER_COMPLETE: 'ctrlsChapterComplete',
  DRAMATIC_STING: 'ctrlsDramaticSting',
  REVEAL: 'ctrlsReveal',
  TRANSITION: 'ctrlsTransition',
} as const;

export const MUSIC_TRACKS = {
  MENU: '/assets/ctrl-s/audio/music/menu-theme.mp3',
  PROLOGUE: '/assets/ctrl-s/audio/music/prologue-brothers.mp3',
  CH1: '/assets/ctrl-s/audio/music/ch1-moonlight.mp3',
  CH2: '/assets/ctrl-s/audio/music/ch2-cyberpsychotic.mp3',
  CH3: '/assets/ctrl-s/audio/music/ch3-resonance.mp3',
  CH4: '/assets/ctrl-s/audio/music/ch4-epic.mp3',
  CH5: '/assets/ctrl-s/audio/music/ch5-cyberpunkin.mp3',
  CREDITS: '/assets/ctrl-s/audio/music/credits.mp3',
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
    CtrlSPuzzleScene,
    CtrlSInventoryScene,
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
