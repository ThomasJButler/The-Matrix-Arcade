/**
 * Rhythm Hacker - React Component
 *
 * Guitar Hero-style rhythm game with Matrix theme.
 */

import React from 'react';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG } from './config';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface RhythmHackerProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
  onExit?: () => void;
}

/**
 * Rhythm Hacker - Rhythm game
 *
 * Hit notes as they reach the line. Build combos!
 */
export default function RhythmHacker({
  achievementManager,
  isMuted = false,
  autoStart = false,
  onExit,
}: RhythmHackerProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        gameId="rhythmHacker"
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
