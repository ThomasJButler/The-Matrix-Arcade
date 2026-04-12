import { PhaserGame } from '@/lib/phaser/PhaserGame';
import { PHASER_CONFIG } from './config';
import type { PhaserGameProps } from '@/lib/phaser/types';

export default function MatrixCloud({ achievementManager, isMuted, autoStart, onExit }: PhaserGameProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        gameId="matrixCloud"
        config={PHASER_CONFIG}
        achievementManager={achievementManager}
        isMuted={isMuted}
        autoStart={autoStart}
        onExit={onExit}
      />
    </div>
  );
}
