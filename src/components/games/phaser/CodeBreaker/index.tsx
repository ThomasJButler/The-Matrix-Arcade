import { PhaserGame } from '@/lib/phaser/PhaserGame';
import { PHASER_CONFIG } from './config';
import type { AchievementManager } from '@/lib/phaser/types';

interface CodeBreakerProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
  onExit?: () => void;
}

export default function CodeBreaker({
  achievementManager,
  isMuted,
  autoStart,
  onExit,
}: CodeBreakerProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        config={PHASER_CONFIG}
        gameId="codeBreaker"
        achievementManager={achievementManager}
        isMuted={isMuted}
        autoStart={autoStart}
        onExit={onExit}
      />
    </div>
  );
}
