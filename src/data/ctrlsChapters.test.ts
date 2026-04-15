import { describe, it, expect } from 'vitest';
import {
  CHAPTERS,
  TOTAL_CHAPTERS,
  getChapter,
  getChapterParagraphs,
  getChapterTitle,
  getPuzzleTriggersForParagraph,
  getAsciiPanelForParagraph,
} from './ctrlsChapters';

describe('ctrlsChapters', () => {
  describe('CHAPTERS array', () => {
    it('has the prologue as first entry', () => {
      expect(CHAPTERS[0]).toBeDefined();
      expect(CHAPTERS[0].id).toBe('prologue');
      expect(CHAPTERS[0].index).toBe(0);
    });

    it('TOTAL_CHAPTERS reflects target chapter count', () => {
      expect(TOTAL_CHAPTERS).toBe(6);
    });
  });

  describe('prologue content integrity', () => {
    const prologue = CHAPTERS[0];

    it('has 14 paragraphs matching original React version', () => {
      expect(prologue.paragraphs).toHaveLength(14);
    });

    it('starts with the correct opening line', () => {
      expect(prologue.paragraphs[0]).toBe(
        'In a world barely distinguishable from our own, the blend of digital and physical realities had become the norm.',
      );
    });

    it('ends with the correct closing line', () => {
      expect(prologue.paragraphs[13]).toBe(
        'This was a gathering of the brilliant, the innovative, and the extraordinary, brought together by fate or perhaps destiny itself.',
      );
    });

    it('has chapter header ASCII art', () => {
      expect(prologue.ascii).toBeDefined();
      expect(prologue.ascii!.length).toBeGreaterThan(10);
      expect(prologue.ascii![0]).toContain('_____');
    });

    it('has full title', () => {
      expect(prologue.title).toBe('Prologue: The Digital Dawn');
    });

    it('preserves Protector AI name in paragraph 6', () => {
      expect(prologue.paragraphs[6]).toContain('Protector');
    });

    it('preserves Aver-Ag character name in paragraph 12', () => {
      expect(prologue.paragraphs[12]).toContain('Aver-Ag Engi Neer');
    });
  });

  describe('prologue puzzle triggers', () => {
    const prologue = CHAPTERS[0];

    it('has one puzzle trigger', () => {
      expect(prologue.puzzleTriggers).toHaveLength(1);
    });

    it('triggers prologue_first_command after paragraph 4', () => {
      expect(prologue.puzzleTriggers![0]).toEqual({
        afterParagraphIndex: 4,
        puzzleId: 'prologue_first_command',
      });
    });

    it('getPuzzleTriggersForParagraph returns the trigger at index 4', () => {
      const trigger = getPuzzleTriggersForParagraph(prologue, 4);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('prologue_first_command');
    });

    it('getPuzzleTriggersForParagraph returns undefined for non-trigger indices', () => {
      expect(getPuzzleTriggersForParagraph(prologue, 0)).toBeUndefined();
      expect(getPuzzleTriggersForParagraph(prologue, 3)).toBeUndefined();
      expect(getPuzzleTriggersForParagraph(prologue, 5)).toBeUndefined();
    });
  });

  describe('prologue inline ASCII panels', () => {
    const prologue = CHAPTERS[0];

    it('has two inline ASCII panels', () => {
      expect(prologue.inlineAscii).toHaveLength(2);
    });

    it('Protector AI panel appears after paragraph 7', () => {
      const panel = getAsciiPanelForParagraph(prologue, 7);
      expect(panel).toBeDefined();
      expect(panel!.art[1]).toContain('PROTECTOR AI');
    });

    it('Silicon Valley bunker panel appears after paragraph 11', () => {
      const panel = getAsciiPanelForParagraph(prologue, 11);
      expect(panel).toBeDefined();
      expect(panel!.art[1]).toContain('SILICON VALLEY');
    });

    it('returns undefined for paragraphs without ASCII', () => {
      expect(getAsciiPanelForParagraph(prologue, 0)).toBeUndefined();
      expect(getAsciiPanelForParagraph(prologue, 6)).toBeUndefined();
    });
  });

  describe('getChapter', () => {
    it('returns the prologue for index 0', () => {
      const chapter = getChapter(0);
      expect(chapter).toBeDefined();
      expect(chapter!.id).toBe('prologue');
    });

    it('returns undefined for out-of-range indices', () => {
      expect(getChapter(-1)).toBeUndefined();
      expect(getChapter(99)).toBeUndefined();
    });
  });

  describe('getChapterParagraphs', () => {
    it('returns prologue paragraphs for index 0', () => {
      const paragraphs = getChapterParagraphs(0);
      expect(paragraphs).toHaveLength(14);
    });

    it('returns empty array for missing chapter', () => {
      expect(getChapterParagraphs(99)).toEqual([]);
    });
  });

  describe('getChapterTitle', () => {
    it('returns prologue title for index 0', () => {
      expect(getChapterTitle(0)).toBe('Prologue: The Digital Dawn');
    });

    it('returns fallback for missing chapter', () => {
      expect(getChapterTitle(99)).toBe('Chapter 99');
    });
  });
});
