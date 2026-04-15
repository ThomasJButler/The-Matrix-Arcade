/**
 * CTRL-S World (Phaser) — scaffold unit tests
 *
 * Verifies scene construction, config validity, and scene key consistency.
 * Phaser is fully mocked in jsdom (no WebGL), so we test scene classes
 * can instantiate and that config wiring is correct.
 */

import { describe, it, expect } from 'vitest';
import { PHASER_CONFIG, CTRLS_SCENE_KEYS, CTRLS_REGISTRY_KEYS, GAME_CONFIG, ACHIEVEMENTS, CHARACTERS, PORTRAIT_CONFIG, HUB_CONFIG, type ChapterStatus } from '../config';
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
    expect(PHASER_CONFIG.scene).toHaveLength(5);
  });

  it('defines all scene keys', () => {
    expect(CTRLS_SCENE_KEYS.BOOT).toBe('CtrlSBootScene');
    expect(CTRLS_SCENE_KEYS.MENU).toBe('CtrlSMenuScene');
    expect(CTRLS_SCENE_KEYS.CHAPTER_HUB).toBe('CtrlSChapterHubScene');
    expect(CTRLS_SCENE_KEYS.NARRATIVE).toBe('CtrlSNarrativeScene');
    expect(CTRLS_SCENE_KEYS.GAME_OVER).toBe('CtrlSGameOverScene');
  });

  it('has game config with text rendering settings', () => {
    expect(GAME_CONFIG.TEXT.TYPEWRITER_SPEED_MEDIUM).toBe(15);
    expect(GAME_CONFIG.TEXT.MAX_WIDTH).toBeGreaterThan(0);
    expect(GAME_CONFIG.CHAPTERS.TOTAL).toBe(6);
  });

  it('has all achievement IDs defined', () => {
    expect(ACHIEVEMENTS.FIRST_PUZZLE).toBe('ctrl_first_puzzle');
    expect(ACHIEVEMENTS.NO_HINTS).toBe('ctrl_no_hints');
    expect(ACHIEVEMENTS.STORY_COMPLETE).toBe('ctrl_story_complete');
    expect(ACHIEVEMENTS.SPEED_READER).toBe('ctrl_speed_reader');
    expect(ACHIEVEMENTS.PUZZLE_MASTER).toBe('ctrl_puzzle_master');
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
    const totalH = HUB_CONFIG.GRID_TOP_Y + gridH + 60;
    expect(totalH).toBeLessThanOrEqual(GAME_CONFIG.HEIGHT);
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
