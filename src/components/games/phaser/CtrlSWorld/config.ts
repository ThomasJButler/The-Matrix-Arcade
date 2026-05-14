/**
 * CTRL-S World - Game Configuration
 *
 * Narrative text adventure with Matrix theme.
 * Phaser rewrite of the React-based CtrlSWorld component.
 */

import Phaser from 'phaser';
import { MATRIX_COLORS, PHASER_RENDER_DEFAULTS } from '../../../../lib/phaser/types';
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

// R83.CTRLS.24 — speaker roles drive per-paragraph typewriter cadence.
// Protagonist reads faster (human urgency), antagonist slower (menace),
// system text mechanically fast, narrator/npc at baseline. When a paragraph
// has no speaker entry we fall back to 'narrator' and its 1.0× multiplier.
export type SpeakerRole = 'narrator' | 'protagonist' | 'antagonist' | 'npc' | 'system';

export const SPEAKER_SPEED_MULTIPLIERS: Record<SpeakerRole, number> = {
  narrator: 1.0,
  npc: 1.0,
  protagonist: 0.9,
  antagonist: 1.15,
  system: 0.7,
};

export interface CharacterDef {
  id: string;
  name: string;
  initial: string;
  portraitKey?: string;
  colour: number;
  colourHex: string;
  // R83.CTRLS.24 — classifies the character for the typewriter speed
  // multiplier. Roles double as a source-of-truth for future UI beats
  // (e.g. antagonist pulses, system glitch bands).
  role: SpeakerRole;
}

export const CHARACTERS: Record<string, CharacterDef> = {
  averag: {
    id: 'averag',
    name: 'Aver-Ag',
    initial: 'A',
    portraitKey: 'portrait-protagonist',
    colour: 0x00ff00,
    colourHex: '#00ff00',
    role: 'protagonist',
  },
  senora: {
    id: 'senora',
    name: 'Señora',
    initial: 'S',
    colour: 0x00ccff,
    colourHex: '#00ccff',
    role: 'npc',
  },
  elon: {
    id: 'elon',
    name: 'Elon-gated',
    initial: 'E',
    colour: 0xffcc00,
    colourHex: '#ffcc00',
    role: 'antagonist',
  },
  steve: {
    id: 'steve',
    name: 'Steve',
    initial: 'S',
    colour: 0xff6600,
    colourHex: '#ff6600',
    role: 'antagonist',
  },
  billiam: {
    id: 'billiam',
    name: 'Billiam',
    initial: 'B',
    colour: 0x9966ff,
    colourHex: '#9966ff',
    role: 'antagonist',
  },
  samuel: {
    id: 'samuel',
    name: 'Samuel',
    initial: 'S',
    colour: 0xff3366,
    colourHex: '#ff3366',
    role: 'npc',
  },
  protector: {
    id: 'protector',
    name: 'Protector',
    initial: 'P',
    colour: 0xff0000,
    colourHex: '#ff0000',
    role: 'antagonist',
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
  // R83.CTRLS.18 — kept for back-compat with the legacy single-pane layout
  // tests; the new two-pane LAYOUT block below is the source of truth for
  // narrative scene positioning. Body text now permanently lives in the
  // right pane and no longer tweens around the portrait, so this value is
  // no longer used at runtime.
  TEXT_INDENT: 130,
} as const;

// R83.CTRLS.25 — funky asymmetric layout. Tom's Round 2 verdict rejected the
// rigid 40/60 two-pane split from .18 in favour of a dynamic composition that
// implies diagonal visual flow through element placement (portrait low-left,
// title + text high-right, ambient scatter between).
//
// Anchor summary (canvas 800×600, MARGIN_X 40):
//   • TITLE_RIGHT_X    = 740            text right-edge, origin (1, 0)
//     TITLE_Y          = 24
//   • BODY_TEXT_X      = 300            37.5 % of canvas — top-right column
//     BODY_TEXT_Y      = 70             sits below the title band
//     BODY_TEXT_WRAP   = 440            55 % canvas width; right edge ≈ 740
//   • PORTRAIT_ZONE    x ∈ [120, 200]   0.15–0.25 × canvas width
//                      y ∈ [330, 390]   0.55–0.65 × canvas height
//     PORTRAIT_DEFAULT = (160, 360)     fallback centre when chapter seed is absent
//   • CHAPTER_SIGIL    = (120, 170)     top-left zone — above the portrait
//   • INLINE_ASCII     = (80, 240)      left edge, between sigil and portrait
//
// Ambient glyph atmosphere: 10 katakana/digit glyphs (range 8–14) scattered at
// 0.10–0.30 alpha with slow Y-drift (5–18 px/s). Biased away from the portrait
// and text zones so they read as background chatter, never competing with the
// narrative column.
//
// L-bracket zone borders at 30 % alpha, 1-px stroke in MATRIX_COLORS.PRIMARY:
// three corners hug the title band, the text column bottom, and the portrait
// zone so the composition reads as deliberate terminal chrome rather than
// free-floating elements. Full rectangles would feel boxy; 24-px arms imply
// the frame without caging content.
//
// Per-chapter seeded jitter: NarrativeScene feeds `chapterIndex` into
// `Phaser.Math.RandomDataGenerator` so chapter 0 always lands at the same
// jittered centre — and chapters 0 / 2 / 4 read visually distinct on replay
// without anything drifting outside its safe zone.
export const LAYOUT = {
  // Title zone
  TITLE_RIGHT_X: 740,
  TITLE_Y: 24,
  // Body text zone (top-right column)
  BODY_TEXT_X: 300,
  BODY_TEXT_Y: 70,
  BODY_TEXT_WRAP_WIDTH: 440,
  BODY_TEXT_RIGHT_X: 740,
  // Portrait zone (middle-left / lower-third)
  PORTRAIT_ZONE_X_MIN: 120,
  PORTRAIT_ZONE_X_MAX: 200,
  PORTRAIT_ZONE_Y_MIN: 330,
  PORTRAIT_ZONE_Y_MAX: 390,
  PORTRAIT_DEFAULT_X: 160,
  PORTRAIT_DEFAULT_Y: 360,
  // Left column atmosphere — chapter sigil + inline ASCII anchors
  CHAPTER_SIGIL_X: 120,
  CHAPTER_SIGIL_Y: 170,
  INLINE_ASCII_X: 80,
  INLINE_ASCII_Y: 240,
  // Ambient glyph scatter
  ATMOSPHERE_GLYPH_COUNT_MIN: 8,
  ATMOSPHERE_GLYPH_COUNT_MAX: 14,
  ATMOSPHERE_GLYPH_ALPHA_MIN: 0.1,
  ATMOSPHERE_GLYPH_ALPHA_MAX: 0.3,
  ATMOSPHERE_GLYPH_DRIFT_MIN: 5,
  ATMOSPHERE_GLYPH_DRIFT_MAX: 18,
  // L-bracket zone borders
  BORDER_ALPHA: 0.3,
  BORDER_BRACKET_LENGTH: 24,
  BORDER_STROKE_WIDTH: 1,
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
    ...PHASER_RENDER_DEFAULTS,
    pixelArt: false,
    antialias: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
