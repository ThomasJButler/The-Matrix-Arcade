/**
 * Neo Jump - React Component
 *
 * Wraps the Phaser game in a React component with proper integration.
 * Doodle Jump-style vertical platformer with Matrix theme.
 */

import React from 'react';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG } from './config';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface NeoJumpProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
  onExit?: () => void;
}

/**
 * Neo Jump - Vertical platformer
 *
 * Auto-bounce on platforms to reach the highest altitude.
 * Use jetpack and shoot enemies along the way!
 */
export default function NeoJump({
  achievementManager,
  isMuted = false,
  autoStart = false,
  onExit,
}: NeoJumpProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        gameId="neoJump"
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
