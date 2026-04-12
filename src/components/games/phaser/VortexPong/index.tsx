/**
 * Vortex Pong — React Component
 *
 * Phaser 3 rebuild of the classic Pong with adaptive AI and power-ups.
 */

import React from 'react';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG } from './config';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface VortexPongPhaserProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
  onExit?: () => void;
}

export default function VortexPongPhaser({
  achievementManager,
  isMuted = false,
  autoStart = false,
  onExit,
}: VortexPongPhaserProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        gameId="vortexPong"
        config={PHASER_CONFIG}
        achievementManager={achievementManager}
        isMuted={isMuted}
        autoStart={autoStart}
        onExit={onExit}
        className="w-full h-full"
      />
    </div>
  );
}
