export interface Game {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  component: React.ComponentType<{ onExit?: () => void }>;
}