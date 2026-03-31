export type GameCategory = 'Arcade' | 'Puzzle' | 'Shooter' | 'Story' | 'Rhythm' | 'Classic';

export interface Game {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  component: React.ComponentType<{ onExit?: () => void }>;
  category?: GameCategory;
}