/**
 * CTRL-S World (Phaser) — scaffold unit tests
 *
 * Verifies scene construction, config validity, and scene key consistency.
 * Phaser is fully mocked in jsdom (no WebGL), so we test scene classes
 * can instantiate and that config wiring is correct.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PHASER_CONFIG, CTRLS_SCENE_KEYS, GAME_CONFIG, ACHIEVEMENTS } from '../config';
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
