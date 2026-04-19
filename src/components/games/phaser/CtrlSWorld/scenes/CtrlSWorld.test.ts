/**
 * CTRL-S World (Phaser) — scaffold unit tests
 *
 * Verifies scene construction, config validity, and scene key consistency.
 * Phaser is fully mocked in jsdom (no WebGL), so we test scene classes
 * can instantiate and that config wiring is correct.
 */

import { describe, it, expect } from 'vitest';
import { PHASER_CONFIG, CTRLS_SCENE_KEYS, CTRLS_REGISTRY_KEYS, GAME_CONFIG, CHARACTERS, PORTRAIT_CONFIG, HUB_CONFIG, MUSIC_TRACKS, CHARACTER_TICK_MAP, NARRATOR_TICK, STINGER_KEYS, type ChapterStatus } from '../config';
import { getPuzzleById } from '../../../../../data/puzzles';
import { getChapter, getPuzzleTriggersForParagraph } from '../../../../../data/ctrlsChapters';
import { CtrlSBootScene } from './BootScene';
import { CtrlSMenuScene } from './MenuScene';
import { CtrlSChapterHubScene } from './ChapterHubScene';
import { CtrlSNarrativeScene } from './NarrativeScene';
import { CtrlSGameOverScene } from './GameOverScene';

describe('CTRL-S World Phaser — Config', () => {
  it('has valid Phaser config with correct dimensions', () => {
    expect(PHASER_CONFIG.width).toBe(800);
    expect(PHASER_CONFIG.height).toBe(600);
    // 7 scenes: Boot, Menu, ChapterHub, Narrative, GameOver, Puzzle, Inventory.
    // Puzzle + Inventory added R83.CTRLS.1 — Phaser-native replacements for
    // the stripped React PuzzleModal / InventoryPanel overlays.
    expect(PHASER_CONFIG.scene).toHaveLength(7);
  });

  it('defines all scene keys', () => {
    expect(CTRLS_SCENE_KEYS.BOOT).toBe('CtrlSBootScene');
    expect(CTRLS_SCENE_KEYS.MENU).toBe('CtrlSMenuScene');
    expect(CTRLS_SCENE_KEYS.CHAPTER_HUB).toBe('CtrlSChapterHubScene');
    expect(CTRLS_SCENE_KEYS.NARRATIVE).toBe('CtrlSNarrativeScene');
    expect(CTRLS_SCENE_KEYS.GAME_OVER).toBe('CtrlSGameOverScene');
    expect(CTRLS_SCENE_KEYS.PUZZLE).toBe('CtrlSPuzzleScene');
    expect(CTRLS_SCENE_KEYS.INVENTORY).toBe('CtrlSInventoryScene');
  });

  it('has game config with text rendering settings', () => {
    expect(GAME_CONFIG.TEXT.TYPEWRITER_SPEED_MEDIUM).toBe(15);
    expect(GAME_CONFIG.TEXT.MAX_WIDTH).toBeGreaterThan(0);
    expect(GAME_CONFIG.CHAPTERS.TOTAL).toBe(6);
  });

  it('explicitly opts out of WebGL mipmap generation and context PMA (R83.CTRLS.11)', () => {
    // CTRL-S loaded textures are all NPOT, and Phaser's internal Graphics /
    // text canvases are the source of the `generateMipmap: … lazy initialization`
    // Firefox warning + Chrome's `Alpha-premult and y-flip are deprecated` chatter.
    // The pair below silences both. If either value drifts, the console goes
    // noisy again on CTRL-S launch.
    const render = PHASER_CONFIG.render as { premultipliedAlpha?: boolean; mipmapFilter?: string };
    expect(render.premultipliedAlpha).toBe(false);
    expect(render.mipmapFilter).toBe('');
  });

});

describe('CTRL-S World Phaser — Scene Construction', () => {
  it('constructs BootScene without errors', () => {
    const scene = new CtrlSBootScene();
    expect(scene).toBeDefined();
  });

  it('constructs MenuScene without errors', () => {
    const scene = new CtrlSMenuScene();
    expect(scene).toBeDefined();
  });

  it('constructs ChapterHubScene without errors', () => {
    const scene = new CtrlSChapterHubScene();
    expect(scene).toBeDefined();
  });

  it('constructs NarrativeScene without errors', () => {
    const scene = new CtrlSNarrativeScene();
    expect(scene).toBeDefined();
  });

  it('constructs GameOverScene without errors', () => {
    const scene = new CtrlSGameOverScene();
    expect(scene).toBeDefined();
  });
});

describe('CTRL-S World Phaser — Character Registry', () => {
  it('defines all seven characters', () => {
    expect(Object.keys(CHARACTERS)).toHaveLength(7);
    expect(CHARACTERS.averag).toBeDefined();
    expect(CHARACTERS.senora).toBeDefined();
    expect(CHARACTERS.elon).toBeDefined();
    expect(CHARACTERS.steve).toBeDefined();
    expect(CHARACTERS.billiam).toBeDefined();
    expect(CHARACTERS.samuel).toBeDefined();
    expect(CHARACTERS.protector).toBeDefined();
  });

  it('each character has required display properties', () => {
    Object.values(CHARACTERS).forEach((char) => {
      expect(char.id).toBeTruthy();
      expect(char.name).toBeTruthy();
      expect(char.initial).toHaveLength(1);
      expect(char.colour).toBeGreaterThan(0);
      expect(char.colourHex).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it('protagonist has a portrait key', () => {
    expect(CHARACTERS.averag.portraitKey).toBe('portrait-protagonist');
  });

  it('NPC characters have no portrait key (BLOCKED-ART-NEEDED)', () => {
    expect(CHARACTERS.senora.portraitKey).toBeUndefined();
    expect(CHARACTERS.elon.portraitKey).toBeUndefined();
    expect(CHARACTERS.steve.portraitKey).toBeUndefined();
    expect(CHARACTERS.billiam.portraitKey).toBeUndefined();
    expect(CHARACTERS.samuel.portraitKey).toBeUndefined();
  });

  it('each character has a unique colour', () => {
    const colours = Object.values(CHARACTERS).map((c) => c.colour);
    expect(new Set(colours).size).toBe(colours.length);
  });
});

describe('CTRL-S World Phaser — Portrait Config', () => {
  it('has valid portrait dimensions', () => {
    expect(PORTRAIT_CONFIG.SIZE).toBeGreaterThan(0);
    expect(PORTRAIT_CONFIG.PANEL_WIDTH).toBeGreaterThan(PORTRAIT_CONFIG.SIZE);
    expect(PORTRAIT_CONFIG.TEXT_INDENT).toBeGreaterThan(PORTRAIT_CONFIG.PANEL_WIDTH);
  });

  it('text indent leaves enough room for text', () => {
    const remainingWidth = GAME_CONFIG.WIDTH - PORTRAIT_CONFIG.TEXT_INDENT - GAME_CONFIG.TEXT.MARGIN_X;
    expect(remainingWidth).toBeGreaterThan(400);
  });
});

describe('CTRL-S World Phaser — Scene Key Consistency', () => {
  it('all scene classes are registered in PHASER_CONFIG.scene', () => {
    const sceneClasses = PHASER_CONFIG.scene as Array<new () => Phaser.Scene>;
    expect(sceneClasses).toContain(CtrlSBootScene);
    expect(sceneClasses).toContain(CtrlSMenuScene);
    expect(sceneClasses).toContain(CtrlSChapterHubScene);
    expect(sceneClasses).toContain(CtrlSNarrativeScene);
    expect(sceneClasses).toContain(CtrlSGameOverScene);
  });
});

describe('CTRL-S World Phaser — Hub Config', () => {
  it('has valid grid dimensions that fit within game width', () => {
    const gridW = HUB_CONFIG.COLS * HUB_CONFIG.TILE_W + (HUB_CONFIG.COLS - 1) * HUB_CONFIG.GAP_X;
    expect(gridW).toBeLessThan(GAME_CONFIG.WIDTH);
  });

  it('grid fits within game height with header and button space', () => {
    const rows = Math.ceil(GAME_CONFIG.CHAPTERS.TOTAL / HUB_CONFIG.COLS);
    const gridH = rows * HUB_CONFIG.TILE_H + (rows - 1) * HUB_CONFIG.GAP_Y;
    const totalH = HUB_CONFIG.GRID_TOP_Y + gridH + HUB_CONFIG.START_BUTTON_BOTTOM_MARGIN;
    expect(totalH).toBeLessThanOrEqual(GAME_CONFIG.HEIGHT);
  });

  it('first chapter tile row clears the MISSION SELECT header and subtitle', () => {
    // Header at HEADER_Y with 18px font (origin 0.5) → bottom ≈ HEADER_Y + 9.
    // Subtitle at SUBTITLE_Y with 9px font (origin 0.5) → bottom ≈ SUBTITLE_Y + 5.
    // First tile row container sits at y = GRID_TOP_Y; tile top edge = y - TILE_H / 2.
    const firstTileTopY = HUB_CONFIG.GRID_TOP_Y - HUB_CONFIG.TILE_H / 2;
    const subtitleBottomY = HUB_CONFIG.SUBTITLE_Y + 5;
    expect(firstTileTopY).toBeGreaterThan(subtitleBottomY);
  });

  it('start button clears the last chapter tile row', () => {
    const rows = Math.ceil(GAME_CONFIG.CHAPTERS.TOTAL / HUB_CONFIG.COLS);
    const lastRowCentreY = HUB_CONFIG.GRID_TOP_Y + (rows - 1) * (HUB_CONFIG.TILE_H + HUB_CONFIG.GAP_Y);
    const lastRowBottomY = lastRowCentreY + HUB_CONFIG.TILE_H / 2;
    const buttonCentreY = GAME_CONFIG.HEIGHT - HUB_CONFIG.START_BUTTON_BOTTOM_MARGIN;
    const buttonTopY = buttonCentreY - HUB_CONFIG.START_BUTTON_HEIGHT / 2;
    expect(buttonTopY).toBeGreaterThan(lastRowBottomY);
  });

  it('start button sits fully inside the canvas with bottom breathing room', () => {
    // The iPod portal chrome overlaps the lower canvas band; keep the button
    // centred at least START_BUTTON_HEIGHT above the canvas edge so half of it
    // cannot drift into the system-shell pause strip.
    const buttonCentreY = GAME_CONFIG.HEIGHT - HUB_CONFIG.START_BUTTON_BOTTOM_MARGIN;
    const buttonBottomY = buttonCentreY + HUB_CONFIG.START_BUTTON_HEIGHT / 2;
    expect(buttonBottomY).toBeLessThan(GAME_CONFIG.HEIGHT);
    expect(HUB_CONFIG.START_BUTTON_BOTTOM_MARGIN).toBeGreaterThanOrEqual(HUB_CONFIG.START_BUTTON_HEIGHT);
  });

  it('has positive stagger and fade durations', () => {
    expect(HUB_CONFIG.STAGGER_DELAY).toBeGreaterThan(0);
    expect(HUB_CONFIG.TILE_FADE_DURATION).toBeGreaterThan(0);
    expect(HUB_CONFIG.LAUNCH_ZOOM_DURATION).toBeGreaterThan(0);
  });

  it('progress bar fits within a tile', () => {
    expect(HUB_CONFIG.PROGRESS_BAR_W).toBeLessThan(HUB_CONFIG.TILE_W - 60);
    expect(HUB_CONFIG.PROGRESS_BAR_H).toBeLessThan(HUB_CONFIG.TILE_H);
  });
});

describe('CTRL-S World Phaser — Save System Registry Keys', () => {
  it('defines registry keys for progress state', () => {
    expect(CTRLS_REGISTRY_KEYS.COMPLETED_CHAPTERS).toBe('completedChapters');
    expect(CTRLS_REGISTRY_KEYS.COMPLETED_PUZZLES).toBe('completedPuzzles');
    expect(CTRLS_REGISTRY_KEYS.CURRENT_CHAPTER).toBe('currentChapter');
  });

  it('registry keys are distinct from each other', () => {
    const values = Object.values(CTRLS_REGISTRY_KEYS);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('CTRL-S World Phaser — Chapter Status Logic', () => {
  const statuses: ChapterStatus[] = ['locked', 'available', 'in-progress', 'complete'];

  it('all ChapterStatus values are valid', () => {
    statuses.forEach(s => {
      expect(['locked', 'available', 'in-progress', 'complete']).toContain(s);
    });
  });

  it('chapter status types cover all hub tile states', () => {
    expect(statuses).toHaveLength(4);
  });
});

describe('CTRL-S World Phaser — Puzzle Overlay Integration', () => {
  it('every puzzle trigger in story data resolves to a valid puzzle', () => {
    for (let chapterIdx = 0; chapterIdx < GAME_CONFIG.CHAPTERS.TOTAL; chapterIdx++) {
      const chapter = getChapter(chapterIdx);
      if (!chapter?.puzzleTriggers) continue;

      for (const trigger of chapter.puzzleTriggers) {
        const puzzle = getPuzzleById(trigger.puzzleId);
        expect(puzzle, `Puzzle "${trigger.puzzleId}" in chapter ${chapterIdx} not found in puzzles.ts`).toBeDefined();
        expect(puzzle!.question).toBeTruthy();
        expect(puzzle!.answer).toBeTruthy();
      }
    }
  });

  it('puzzle triggers fire at valid paragraph indices', () => {
    for (let chapterIdx = 0; chapterIdx < GAME_CONFIG.CHAPTERS.TOTAL; chapterIdx++) {
      const chapter = getChapter(chapterIdx);
      if (!chapter?.puzzleTriggers) continue;

      for (const trigger of chapter.puzzleTriggers) {
        expect(
          trigger.afterParagraphIndex,
          `Trigger for "${trigger.puzzleId}" has index out of bounds`,
        ).toBeLessThan(chapter.paragraphs.length);
        expect(trigger.afterParagraphIndex).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('getPuzzleTriggersForParagraph returns correct trigger', () => {
    const prologue = getChapter(0)!;
    const trigger = getPuzzleTriggersForParagraph(prologue, 4);
    expect(trigger).toBeDefined();
    expect(trigger!.puzzleId).toBe('prologue_first_command');
  });

  it('getPuzzleTriggersForParagraph returns undefined for non-trigger paragraphs', () => {
    const prologue = getChapter(0)!;
    expect(getPuzzleTriggersForParagraph(prologue, 0)).toBeUndefined();
    expect(getPuzzleTriggersForParagraph(prologue, 1)).toBeUndefined();
  });

  it('NarrativeScene prototype has resumeAfterPuzzle method', () => {
    expect(typeof CtrlSNarrativeScene.prototype.resumeAfterPuzzle).toBe('function');
  });

  it('NarrativeScene prototype has resumeAfterInventory method', () => {
    expect(typeof CtrlSNarrativeScene.prototype.resumeAfterInventory).toBe('function');
  });

  it('CTRLS_SCENE_KEYS.NARRATIVE matches the scene key used in config', () => {
    const sceneClasses = PHASER_CONFIG.scene as Array<new () => Phaser.Scene>;
    expect(sceneClasses).toContain(CtrlSNarrativeScene);
    expect(CTRLS_SCENE_KEYS.NARRATIVE).toBe('CtrlSNarrativeScene');
  });
});

describe('CTRL-S World Phaser — Music Tracks', () => {
  it('defines all 8 music tracks', () => {
    expect(Object.keys(MUSIC_TRACKS)).toHaveLength(8);
    expect(MUSIC_TRACKS.MENU).toMatch(/\.mp3$/);
    expect(MUSIC_TRACKS.PROLOGUE).toMatch(/\.mp3$/);
    expect(MUSIC_TRACKS.CH1).toMatch(/\.mp3$/);
    expect(MUSIC_TRACKS.CH2).toMatch(/\.mp3$/);
    expect(MUSIC_TRACKS.CH3).toMatch(/\.mp3$/);
    expect(MUSIC_TRACKS.CH4).toMatch(/\.mp3$/);
    expect(MUSIC_TRACKS.CH5).toMatch(/\.mp3$/);
    expect(MUSIC_TRACKS.CREDITS).toMatch(/\.mp3$/);
  });

  it('each chapter has a musicTrack assigned', () => {
    for (let i = 0; i < 6; i++) {
      const ch = getChapter(i);
      expect(ch).toBeDefined();
      expect(ch!.musicTrack).toBeDefined();
      expect(ch!.musicTrack).toMatch(/\.mp3$/);
    }
  });

  it('each chapter has a unique music track', () => {
    const tracks = new Set<string>();
    for (let i = 0; i < 6; i++) {
      const ch = getChapter(i)!;
      expect(tracks.has(ch.musicTrack!)).toBe(false);
      tracks.add(ch.musicTrack!);
    }
  });

  it('all track paths point to a valid audio asset under /assets/', () => {
    const values = Object.values(MUSIC_TRACKS);
    for (const track of values) {
      expect(track).toMatch(/^\/assets\/.+\.(mp3|ogg|wav)$/);
    }
  });

  it('does not reference the retired brothers-and-sisters track', () => {
    const values = Object.values(MUSIC_TRACKS);
    for (const track of values) {
      expect(track).not.toMatch(/brothers/i);
    }
  });
});

describe('CTRL-S World Phaser — Character SFX', () => {
  it('every character in CHARACTERS has a tick mapping', () => {
    for (const charId of Object.keys(CHARACTERS)) {
      expect(CHARACTER_TICK_MAP[charId]).toBeDefined();
    }
  });

  it('tick mappings use valid sound keys', () => {
    const validKeys = ['ctrlsTickProtagonist', 'ctrlsTickAntagonist', 'ctrlsTickNpc', 'ctrlsTickNarrator'];
    for (const tickKey of Object.values(CHARACTER_TICK_MAP)) {
      expect(validKeys).toContain(tickKey);
    }
    expect(validKeys).toContain(NARRATOR_TICK);
  });

  it('protagonist uses high-pitch tick', () => {
    expect(CHARACTER_TICK_MAP['averag']).toBe('ctrlsTickProtagonist');
  });

  it('antagonists use bass tick', () => {
    expect(CHARACTER_TICK_MAP['elon']).toBe('ctrlsTickAntagonist');
    expect(CHARACTER_TICK_MAP['protector']).toBe('ctrlsTickAntagonist');
  });

  it('defines all 8 stinger keys', () => {
    expect(Object.keys(STINGER_KEYS)).toHaveLength(8);
    expect(STINGER_KEYS.PUZZLE_APPEAR).toBe('ctrlsPuzzleAppear');
    expect(STINGER_KEYS.CHAPTER_COMPLETE).toBe('ctrlsChapterComplete');
  });
});
