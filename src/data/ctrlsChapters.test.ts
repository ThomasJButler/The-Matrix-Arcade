import { describe, it, expect } from 'vitest';
import {
  CHAPTERS,
  TOTAL_CHAPTERS,
  getChapter,
  getChapterParagraphs,
  getChapterTitle,
  getPuzzleTriggersForParagraph,
  getAsciiPanelForParagraph,
  getChoiceTriggerForParagraph,
  getSpeakerForParagraph,
  type Chapter,
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

    it('returns chapter 3 short title for index 3', () => {
      expect(getChapterTitle(3)).toBe('Ch3: Echoes from the Past');
    });

    it('returns chapter 4 short title for index 4', () => {
      expect(getChapterTitle(4)).toBe('Ch4: A Glitch in Time');
    });

    it('returns chapter 5 short title for index 5', () => {
      expect(getChapterTitle(5)).toBe('Ch5: The New Dawn');
    });

    it('returns fallback for missing chapter', () => {
      expect(getChapterTitle(99)).toBe('Chapter 99');
    });
  });

  describe('chapter 3 content integrity', () => {
    const ch3 = CHAPTERS[3];

    it('exists with correct id and index', () => {
      expect(ch3).toBeDefined();
      expect(ch3.id).toBe('chapter3');
      expect(ch3.index).toBe(3);
    });

    it('has 23 paragraphs matching original React version', () => {
      expect(ch3.paragraphs).toHaveLength(23);
    });

    it('starts with the correct opening line', () => {
      expect(ch3.paragraphs[0]).toContain(
        'In the aftermath of their daring raid',
      );
    });

    it('ends with the correct closing line', () => {
      expect(ch3.paragraphs[22]).toContain(
        'last barrier before their journey through time',
      );
    });

    it('has chapter header ASCII art with TIME PARADOX', () => {
      expect(ch3.ascii).toBeDefined();
      expect(ch3.ascii!.length).toBe(8);
      expect(ch3.ascii![1]).toContain('TIME  PARADOX');
    });

    it('preserves Samuel Alt Commandman name', () => {
      const hasSamuel = ch3.paragraphs.some((p) =>
        p.includes('Samuel Alt Commandman'),
      );
      expect(hasSamuel).toBe(true);
    });

    it('has no inline ASCII panels', () => {
      expect(ch3.inlineAscii).toBeUndefined();
    });
  });

  describe('chapter 3 puzzle triggers', () => {
    const ch3 = CHAPTERS[3];

    it('has three puzzle triggers', () => {
      expect(ch3.puzzleTriggers).toHaveLength(3);
    });

    it('triggers ch3_ada_language after paragraph 10', () => {
      const trigger = getPuzzleTriggersForParagraph(ch3, 10);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch3_ada_language');
    });

    it('triggers ch3_fibonacci after paragraph 14', () => {
      const trigger = getPuzzleTriggersForParagraph(ch3, 14);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch3_fibonacci');
    });

    it('triggers ch3_fire_riddle after paragraph 21', () => {
      const trigger = getPuzzleTriggersForParagraph(ch3, 21);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch3_fire_riddle');
    });
  });

  describe('chapter 4 content integrity', () => {
    const ch4 = CHAPTERS[4];

    it('exists with correct id and index', () => {
      expect(ch4).toBeDefined();
      expect(ch4.id).toBe('chapter4');
      expect(ch4.index).toBe(4);
    });

    it('has the expected paragraph count', () => {
      expect(ch4.paragraphs.length).toBeGreaterThanOrEqual(45);
    });

    it('starts with the correct opening line', () => {
      expect(ch4.paragraphs[0]).toContain(
        'The journey back through the timestream',
      );
    });

    it('has chapter header ASCII art with WORLD REBORN', () => {
      expect(ch4.ascii).toBeDefined();
      expect(ch4.ascii!.length).toBe(8);
      expect(ch4.ascii![1]).toContain('WORLD REBORN');
    });

    it('preserves Aver-Ag Engi Neer name', () => {
      const hasAverag = ch4.paragraphs.some((p) =>
        p.includes('Aver-Ag Engi Neer'),
      );
      expect(hasAverag).toBe(true);
    });

    it('preserves Señora Engi Neer name', () => {
      const hasSenora = ch4.paragraphs.some((p) =>
        p.includes('Señora Engi Neer'),
      );
      expect(hasSenora).toBe(true);
    });

    it('has no inline ASCII panels', () => {
      expect(ch4.inlineAscii).toBeUndefined();
    });
  });

  describe('chapter 4 puzzle triggers', () => {
    const ch4 = CHAPTERS[4];

    it('has six puzzle triggers', () => {
      expect(ch4.puzzleTriggers).toHaveLength(6);
    });

    it('triggers ch4_world_assessment after paragraph 11', () => {
      const trigger = getPuzzleTriggersForParagraph(ch4, 11);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch4_world_assessment');
    });

    it('triggers ch4_pattern_recognition after paragraph 20', () => {
      const trigger = getPuzzleTriggersForParagraph(ch4, 20);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch4_pattern_recognition');
    });

    it('triggers ch4_code_analysis after paragraph 35', () => {
      const trigger = getPuzzleTriggersForParagraph(ch4, 35);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch4_code_analysis');
    });
  });

  describe('chapter 5 content integrity', () => {
    const ch5 = CHAPTERS[5];

    it('exists with correct id and index', () => {
      expect(ch5).toBeDefined();
      expect(ch5.id).toBe('chapter5');
      expect(ch5.index).toBe(5);
    });

    it('has 26 paragraphs matching original React version', () => {
      expect(ch5.paragraphs).toHaveLength(26);
    });

    it('starts with the correct opening line', () => {
      expect(ch5.paragraphs[0]).toContain(
        'The resolution of the glitch',
      );
    });

    it('ends with the correct closing line', () => {
      expect(ch5.paragraphs[25]).toContain(
        'the indomitable spirit of those willing to stand in the breach',
      );
    });

    it('has chapter header ASCII art with NEW DAWN', () => {
      expect(ch5.ascii).toBeDefined();
      expect(ch5.ascii!.length).toBe(8);
      expect(ch5.ascii![1]).toContain('NEW   DAWN');
    });

    it('preserves Billiam Bindows Bates name', () => {
      const hasBilliam = ch5.paragraphs.some((p) =>
        p.includes('Billiam Bindows Bates'),
      );
      expect(hasBilliam).toBe(true);
    });

    it('preserves Steve Theytuk Ourjerbs name', () => {
      const hasSteve = ch5.paragraphs.some((p) =>
        p.includes('Steve Theytuk Ourjerbs'),
      );
      expect(hasSteve).toBe(true);
    });

    it('preserves Elon-gated Tusk name', () => {
      const hasElon = ch5.paragraphs.some((p) =>
        p.includes('Elon-gated Tusk'),
      );
      expect(hasElon).toBe(true);
    });

    it('preserves Señora Engi Neer name', () => {
      const hasSenora = ch5.paragraphs.some((p) =>
        p.includes('Señora Engi Neer'),
      );
      expect(hasSenora).toBe(true);
    });

    it('preserves Samuel Alt Commandman name', () => {
      const hasSamuel = ch5.paragraphs.some((p) =>
        p.includes('Samuel Alt Commandman'),
      );
      expect(hasSamuel).toBe(true);
    });

    it('preserves Aver-Ag character name', () => {
      const hasAverag = ch5.paragraphs.some((p) => p.includes('Aver-Ag'));
      expect(hasAverag).toBe(true);
    });

    it('has no inline ASCII panels', () => {
      expect(ch5.inlineAscii).toBeUndefined();
    });
  });

  describe('chapter 5 puzzle triggers', () => {
    const ch5 = CHAPTERS[5];

    it('has one puzzle trigger', () => {
      expect(ch5.puzzleTriggers).toHaveLength(1);
    });

    it('triggers ch5_final_wisdom after paragraph 15', () => {
      const trigger = getPuzzleTriggersForParagraph(ch5, 15);
      expect(trigger).toBeDefined();
      expect(trigger!.puzzleId).toBe('ch5_final_wisdom');
    });

    it('returns undefined for non-trigger indices', () => {
      expect(getPuzzleTriggersForParagraph(ch5, 0)).toBeUndefined();
      expect(getPuzzleTriggersForParagraph(ch5, 14)).toBeUndefined();
      expect(getPuzzleTriggersForParagraph(ch5, 16)).toBeUndefined();
    });
  });

  describe('cross-chapter continuity', () => {
    it('all TOTAL_CHAPTERS chapters are present', () => {
      expect(CHAPTERS).toHaveLength(TOTAL_CHAPTERS);
    });

    it('chapter indices are sequential from 0 to TOTAL_CHAPTERS-1', () => {
      CHAPTERS.forEach((ch, i) => {
        expect(ch.index).toBe(i);
      });
    });

    it('chapter IDs follow the expected naming convention', () => {
      expect(CHAPTERS[0].id).toBe('prologue');
      for (let i = 1; i < CHAPTERS.length; i++) {
        expect(CHAPTERS[i].id).toBe(`chapter${i}`);
      }
    });

    it('every chapter has a non-empty title and shortTitle', () => {
      CHAPTERS.forEach((ch) => {
        expect(ch.title.length).toBeGreaterThan(0);
        expect(ch.shortTitle.length).toBeGreaterThan(0);
      });
    });

    it('every chapter has at least one paragraph', () => {
      CHAPTERS.forEach((ch) => {
        expect(ch.paragraphs.length).toBeGreaterThan(0);
      });
    });

    it('no chapter has empty paragraphs', () => {
      CHAPTERS.forEach((ch) => {
        ch.paragraphs.forEach((p) => {
          expect(p.trim().length).toBeGreaterThan(0);
        });
      });
    });

    it('puzzle trigger indices are within paragraph bounds', () => {
      CHAPTERS.forEach((ch) => {
        ch.puzzleTriggers?.forEach((trigger) => {
          expect(trigger.afterParagraphIndex).toBeGreaterThanOrEqual(0);
          expect(trigger.afterParagraphIndex).toBeLessThan(
            ch.paragraphs.length,
          );
        });
      });
    });

    it('inline ASCII panel indices are within paragraph bounds', () => {
      CHAPTERS.forEach((ch) => {
        ch.inlineAscii?.forEach((panel) => {
          expect(panel.afterParagraphIndex).toBeGreaterThanOrEqual(0);
          expect(panel.afterParagraphIndex).toBeLessThan(
            ch.paragraphs.length,
          );
        });
      });
    });

    it('puzzle trigger IDs are unique within each chapter', () => {
      CHAPTERS.forEach((ch) => {
        const ids = ch.puzzleTriggers?.map((t) => t.puzzleId) ?? [];
        expect(new Set(ids).size).toBe(ids.length);
      });
    });

    it('all recurring characters appear across multiple chapters', () => {
      const characters = [
        'Aver-Ag',
        'Señora Engi Neer',
        'Elon-gated Tusk',
        'Steve Theytuk Ourjerbs',
        'Billiam Bindows Bates',
        'Samuel Alt Commandman',
      ];

      characters.forEach((name) => {
        const chaptersWithChar = CHAPTERS.filter((ch) =>
          ch.paragraphs.some((p) => p.includes(name)),
        );
        expect(chaptersWithChar.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('getChapter returns valid data for all indices', () => {
      for (let i = 0; i < TOTAL_CHAPTERS; i++) {
        const ch = getChapter(i);
        expect(ch).toBeDefined();
        expect(ch!.index).toBe(i);
      }
    });

    it('getChapterParagraphs returns non-empty arrays for all chapters', () => {
      for (let i = 0; i < TOTAL_CHAPTERS; i++) {
        const paragraphs = getChapterParagraphs(i);
        expect(paragraphs.length).toBeGreaterThan(0);
      }
    });

    it('choice trigger indices are within paragraph bounds', () => {
      CHAPTERS.forEach((ch) => {
        ch.choiceTriggers?.forEach((trigger) => {
          expect(trigger.afterParagraphIndex).toBeGreaterThanOrEqual(0);
          expect(trigger.afterParagraphIndex).toBeLessThan(
            ch.paragraphs.length,
          );
        });
      });
    });

    it('choice triggers have at least two options', () => {
      CHAPTERS.forEach((ch) => {
        ch.choiceTriggers?.forEach((trigger) => {
          expect(trigger.choices.length).toBeGreaterThanOrEqual(2);
        });
      });
    });
  });

  describe('getChoiceTriggerForParagraph', () => {
    const testChapter: Chapter = {
      id: 'test',
      index: 99,
      title: 'Test Chapter',
      shortTitle: 'Test',
      paragraphs: ['Para 1', 'Para 2', 'Para 3', 'Para 4'],
      choiceTriggers: [
        {
          afterParagraphIndex: 1,
          prompt: 'What do you do?',
          choices: [
            { label: 'Option A', choiceId: 'test_a' },
            { label: 'Option B', choiceId: 'test_b', nextParagraphIndex: 3 },
          ],
        },
      ],
    };

    it('returns choice trigger at the correct paragraph index', () => {
      const trigger = getChoiceTriggerForParagraph(testChapter, 1);
      expect(trigger).toBeDefined();
      expect(trigger!.prompt).toBe('What do you do?');
      expect(trigger!.choices).toHaveLength(2);
    });

    it('returns undefined for paragraphs without choice triggers', () => {
      expect(getChoiceTriggerForParagraph(testChapter, 0)).toBeUndefined();
      expect(getChoiceTriggerForParagraph(testChapter, 2)).toBeUndefined();
    });

    it('choice options have required fields', () => {
      const trigger = getChoiceTriggerForParagraph(testChapter, 1)!;
      trigger.choices.forEach((choice) => {
        expect(choice.label.length).toBeGreaterThan(0);
        expect(choice.choiceId.length).toBeGreaterThan(0);
      });
    });

    it('nextParagraphIndex is optional', () => {
      const trigger = getChoiceTriggerForParagraph(testChapter, 1)!;
      expect(trigger.choices[0].nextParagraphIndex).toBeUndefined();
      expect(trigger.choices[1].nextParagraphIndex).toBe(3);
    });

    it('returns undefined for chapters without choice triggers', () => {
      const noChoiceChapter: Chapter = {
        id: 'bare',
        index: 98,
        title: 'Bare',
        shortTitle: 'Bare',
        paragraphs: ['Hello'],
      };
      expect(getChoiceTriggerForParagraph(noChoiceChapter, 0)).toBeUndefined();
    });
  });

  describe('getSpeakerForParagraph', () => {
    it('returns speaker ID for a tagged paragraph', () => {
      const prologue = CHAPTERS[0];
      expect(getSpeakerForParagraph(prologue, 12)).toBe('averag');
    });

    it('returns undefined for narrator paragraphs', () => {
      const prologue = CHAPTERS[0];
      expect(getSpeakerForParagraph(prologue, 0)).toBeUndefined();
      expect(getSpeakerForParagraph(prologue, 5)).toBeUndefined();
    });

    it('returns undefined for chapters without speakers', () => {
      const bare: Chapter = {
        id: 'bare',
        index: 98,
        title: 'Bare',
        shortTitle: 'Bare',
        paragraphs: ['Hello'],
      };
      expect(getSpeakerForParagraph(bare, 0)).toBeUndefined();
    });

    it('chapter 1 has correct speaker assignments', () => {
      const ch1 = CHAPTERS[1];
      expect(getSpeakerForParagraph(ch1, 4)).toBe('senora');
      expect(getSpeakerForParagraph(ch1, 8)).toBe('averag');
      expect(getSpeakerForParagraph(ch1, 11)).toBe('elon');
      expect(getSpeakerForParagraph(ch1, 13)).toBe('steve');
      expect(getSpeakerForParagraph(ch1, 24)).toBe('billiam');
    });

    it('chapter 3 has Samuel as speaker', () => {
      const ch3 = CHAPTERS[3];
      expect(getSpeakerForParagraph(ch3, 4)).toBe('samuel');
      expect(getSpeakerForParagraph(ch3, 9)).toBe('samuel');
    });

    it('chapter 5 has all six characters as speakers', () => {
      const ch5 = CHAPTERS[5];
      const speakerIds = new Set(
        Object.values(ch5.speakers ?? {}),
      );
      expect(speakerIds).toContain('averag');
      expect(speakerIds).toContain('billiam');
      expect(speakerIds).toContain('steve');
      expect(speakerIds).toContain('elon');
      expect(speakerIds).toContain('senora');
      expect(speakerIds).toContain('samuel');
    });
  });

  describe('speaker data integrity', () => {
    const validCharacterIds = [
      'averag', 'senora', 'elon', 'steve',
      'billiam', 'samuel', 'protector',
    ];

    it('all speaker IDs reference valid characters', () => {
      CHAPTERS.forEach((ch) => {
        if (!ch.speakers) return;
        Object.values(ch.speakers).forEach((id) => {
          expect(validCharacterIds).toContain(id);
        });
      });
    });

    it('speaker indices are within paragraph bounds', () => {
      CHAPTERS.forEach((ch) => {
        if (!ch.speakers) return;
        Object.keys(ch.speakers).forEach((key) => {
          const idx = Number(key);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(ch.paragraphs.length);
        });
      });
    });

    it('every chapter has speaker annotations', () => {
      CHAPTERS.forEach((ch) => {
        expect(ch.speakers).toBeDefined();
        expect(Object.keys(ch.speakers!).length).toBeGreaterThan(0);
      });
    });

    it('averag appears as speaker in at least 3 chapters', () => {
      const chaptersWithAverag = CHAPTERS.filter((ch) =>
        Object.values(ch.speakers ?? {}).includes('averag'),
      );
      expect(chaptersWithAverag.length).toBeGreaterThanOrEqual(3);
    });
  });
});
