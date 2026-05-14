/**
 * CTRL-S World — shared type definitions.
 *
 * The save system was removed in R83.CTRLS.8, so these types live alongside
 * the game rather than in the global `useSaveSystem` module. They describe
 * the in-memory progress/inventory shape that React tracks for one playthrough.
 */

export interface PuzzleData {
  id: string;
  type: 'code' | 'riddle' | 'multiple-choice' | 'typing' | 'fill-in';
  question: string;
  answer: string | string[];
  hints: string[];
  timeLimit?: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  context?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
}

export interface CtrlSGameItem {
  id: string;
  name: string;
  description: string;
  type: 'quest' | 'consumable' | 'collectible' | 'special';
  usable: boolean;
  effect?: string;
  quantity?: number;
  acquiredAt?: string;
}

export interface CtrlSSessionState {
  currentChapter: number;
  completedChapters: number[];
  completedPuzzles: string[];
  inventory: CtrlSGameItem[];
  storyChoices: Record<string, string>;
}

export const createDefaultCtrlSSessionState = (): CtrlSSessionState => ({
  currentChapter: 0,
  completedChapters: [],
  completedPuzzles: [],
  inventory: [],
  storyChoices: {},
});
