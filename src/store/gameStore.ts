import { create } from 'zustand';

interface GameState {
  highScores: Record<string, number>;
  setHighScore: (game: string, score: number) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  currentGame: string | null;
  setCurrentGame: (game: string | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  highScores: {},
  setHighScore: (game, score) =>
    set((state) => ({
      highScores: {
        ...state.highScores,
        [game]: Math.max(score, state.highScores[game] || 0),
      },
    })),
  soundEnabled: true,
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  currentGame: null,
  setCurrentGame: (game) => set({ currentGame: game }),
}));