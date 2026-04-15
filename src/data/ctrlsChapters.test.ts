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

  describe('chapter 1 content integrity', () => {
    const ch1 = CHAPTERS[1];

    it('exists with correct id and index', () => {
      expect(ch1).toBeDefined();
      expect(ch1.id).toBe('chapter1');
      expect(ch1.index).toBe(1);
    });

    it('has 27 paragraphs matching original React version', () => {
      expect(ch1.paragraphs).toHaveLength(27);
    });

    it('starts with the correct opening line', () => {
      expect(ch1.paragraphs[0]).toBe(
        'The bunker, a stark contrast to the chaos above, buzzed with a tension that mirrored the uncertainty outside.',
      );
    });

    it('ends with the correct closing line', () => {
      expect(ch1.paragraphs[26]).toBe(
        "'We'll need to move fast, move smart, and most importantly\u2014move together.'",
      );
    });

    it('has chapter header ASCII art with SILICON BUNKER', () => {
      expect(ch1.ascii).toBeDefined();
      expect(ch1.ascii!.length).toBe(8);
      expect(ch1.ascii![1]).toContain('SILICON  BUNKER');
    });

    it('preserves Señora Engi Neer name', () => {
      expect(ch1.paragraphs[4]).toContain('Señora Engi Neer');
    });

    it('preserves Elon-gated Tusk name', () => {
      expect(ch1.paragraphs[11]).toContain('Elon-gated Tusk');
    });

    it('preserves Steve Theytuk Ourjerbs name', () => {
      expect(ch1.paragraphs[13]).toContain('Steve Theytuk Ourjerbs');
    });

    it('preserves Billiam Bindows Bates name', () => {
      expect(ch1.paragraphs[24]).toContain('Billiam Bindows Bates');
    });

    it('has no inline ASCII panels', () => {
      expect(ch1.inlineAscii).toBeUndefined();
    });
  });

  describe('chapter 1 puzzle triggers', () => {
    const ch1 = CHAPTERS[1];

    it('has two puzzle triggers', () => {
      expect(ch1.puzzleTriggers).toHaveLength(2);
    });

    it('triggers ch1_team_quiz after paragraph 18', () => {
      const trigger = getPuzzleTriggersForParagraph(ch1, 18);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch1_team_quiz');
    });

    it('triggers ch1_bunker_code after paragraph 22', () => {
      const trigger = getPuzzleTriggersForParagraph(ch1, 22);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch1_bunker_code');
    });

    it('returns undefined for non-trigger indices', () => {
      expect(getPuzzleTriggersForParagraph(ch1, 0)).toBeUndefined();
      expect(getPuzzleTriggersForParagraph(ch1, 17)).toBeUndefined();
      expect(getPuzzleTriggersForParagraph(ch1, 19)).toBeUndefined();
    });
  });

  describe('chapter 2 content integrity', () => {
    const ch2 = CHAPTERS[2];

    it('exists with correct id and index', () => {
      expect(ch2).toBeDefined();
      expect(ch2.id).toBe('chapter2');
      expect(ch2.index).toBe(2);
    });

    it('has 25 paragraphs matching original React version', () => {
      expect(ch2.paragraphs).toHaveLength(25);
    });

    it('starts with the correct opening line', () => {
      expect(ch2.paragraphs[0]).toBe(
        'With the data secured, the team gathered around the holographic displays in the bunker, their faces illuminated by the glow of progress and possibility.',
      );
    });

    it('ends with the correct closing line', () => {
      expect(ch2.paragraphs[24]).toBe(
        "'Looks like we're not the only ones fighting back,' Señora observed with a slight smile.",
      );
    });

    it('has chapter header ASCII art with SILICON VALLEY', () => {
      expect(ch2.ascii).toBeDefined();
      expect(ch2.ascii!.length).toBe(8);
      expect(ch2.ascii![1]).toContain('SILICON  VALLEY');
    });

    it('preserves Silicon Valley setting description', () => {
      expect(ch2.paragraphs[5]).toContain('Silicon Valley');
    });

    it('has no inline ASCII panels', () => {
      expect(ch2.inlineAscii).toBeUndefined();
    });
  });

  describe('chapter 2 puzzle triggers', () => {
    const ch2 = CHAPTERS[2];

    it('has six puzzle triggers', () => {
      expect(ch2.puzzleTriggers).toHaveLength(6);
    });

    it('triggers ch2_silicon_valley_riddles after paragraph 11', () => {
      const trigger = getPuzzleTriggersForParagraph(ch2, 11);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch2_silicon_valley_riddles');
    });

    it('triggers ch2_valley_riddle_2 after paragraph 12', () => {
      const trigger = getPuzzleTriggersForParagraph(ch2, 12);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch2_valley_riddle_2');
    });

    it('triggers ch2_valley_riddle_3 after paragraph 13', () => {
      const trigger = getPuzzleTriggersForParagraph(ch2, 13);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch2_valley_riddle_3');
    });

    it('triggers ch2_console_log after paragraph 19', () => {
      const trigger = getPuzzleTriggersForParagraph(ch2, 19);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch2_console_log');
    });

    it('triggers ch2_bug_riddle after paragraph 21', () => {
      const trigger = getPuzzleTriggersForParagraph(ch2, 21);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch2_bug_riddle');
    });

    it('triggers ch2_ethics_module_activation after paragraph 23', () => {
      const trigger = getPuzzleTriggersForParagraph(ch2, 23);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch2_ethics_module_activation');
    });

    it('returns undefined for non-trigger indices', () => {
      expect(getPuzzleTriggersForParagraph(ch2, 0)).toBeUndefined();
      expect(getPuzzleTriggersForParagraph(ch2, 10)).toBeUndefined();
      expect(getPuzzleTriggersForParagraph(ch2, 14)).toBeUndefined();
      expect(getPuzzleTriggersForParagraph(ch2, 20)).toBeUndefined();
    });
  });

  describe('getChapter', () => {
    it('returns the prologue for index 0', () => {
      const chapter = getChapter(0);
      expect(chapter).toBeDefined();
      expect(chapter!.id).toBe('prologue');
    });

    it('returns chapter 1 for index 1', () => {
      const chapter = getChapter(1);
      expect(chapter).toBeDefined();
      expect(chapter!.id).toBe('chapter1');
    });

    it('returns chapter 2 for index 2', () => {
      const chapter = getChapter(2);
      expect(chapter).toBeDefined();
      expect(chapter!.id).toBe('chapter2');
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

    it('returns chapter 1 paragraphs for index 1', () => {
      const paragraphs = getChapterParagraphs(1);
      expect(paragraphs).toHaveLength(27);
    });

    it('returns chapter 2 paragraphs for index 2', () => {
      const paragraphs = getChapterParagraphs(2);
      expect(paragraphs).toHaveLength(25);
    });

    it('returns empty array for missing chapter', () => {
      expect(getChapterParagraphs(99)).toEqual([]);
    });
  });

  describe('getChapterTitle', () => {
    it('returns prologue title for index 0', () => {
      expect(getChapterTitle(0)).toBe('Prologue: The Digital Dawn');
    });

    it('returns chapter 1 short title for index 1', () => {
      expect(getChapterTitle(1)).toBe('Ch1: Assemble the Heroes');
    });

    it('returns chapter 2 short title for index 2', () => {
      expect(getChapterTitle(2)).toBe('Ch2: Heart of Silicon Valley');
    });

    it('returns fallback for missing chapter', () => {
      expect(getChapterTitle(99)).toBe('Chapter 99');
    });
  });
});
