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
  TILE_H: 114,
  GAP_X: 24,
  GAP_Y: 14,
  HEADER_Y: 42,
  SUBTITLE_Y: 70,
  GRID_TOP_Y: 148,
  STAGGER_DELAY: 80,
  TILE_FADE_DURATION: 400,
  SELECT_PULSE_DURATION: 1200,
  LAUNCH_ZOOM_DURATION: 350,
  PROGRESS_BAR_W: 120,
  PROGRESS_BAR_H: 6,
  START_BUTTON_HEIGHT: 36,
  START_BUTTON_BOTTOM_MARGIN: 60,
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
  PROLOGUE: '/assets/rhythm-hacker/tracks/enhancements.mp3',
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
    // R83.CTRLS.11 — silence the two WebGL console warnings on CTRL-S launch.
    // `premultipliedAlpha: false` disables the WebGL context's UNPACK_PREMULTIPLY_ALPHA
    // default; Chrome has been deprecating non-DOM-Element uploads with premult+y-flip,
    // which surfaced as `texImage: Alpha-premult and y-flip are deprecated…`.
    // `mipmapFilter: ''` is the Phaser 3.60+ explicit opt-out of mipmap generation —
    // CTRL-S's loaded textures are all NPOT (24×24 portraits, 800×600 backdrops,
    // ~32px icons) so mipmaps would never sample anyway, and the empty string
    // stops Firefox's `generateMipmap: Tex image TEXTURE_2D level 0 is incurring
    // lazy initialization` chatter on the internal Graphics/text canvases.
    premultipliedAlpha: false,
    mipmapFilter: '',
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
