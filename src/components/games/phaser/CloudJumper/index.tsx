/**
 * Cloud Jumper - React Component
 *
 * Side-scrolling cloud hopping game.
 */

import React from 'react';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG } from './config';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface CloudJumperProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
  onExit?: () => void;
}

/**
 * Cloud Jumper - Side-scrolling platformer
 *
 * Jump between clouds, collect items, avoid obstacles!
 */
export default function CloudJumper({
  achievementManager,
  isMuted = false,
  autoStart = false,
  onExit,
}: CloudJumperProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        gameId="cloudJumper"
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
