/**
 * CTRL-S World (Phaser) - React Component
 *
 * Phaser 3 rewrite of the narrative text adventure.
 * Feature-flagged alongside the old React version until R80.25 cut-over.
 */

import React from 'react';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG } from './config';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface CtrlSWorldPhaserProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
  onExit?: () => void;
}

export default function CtrlSWorldPhaser({
  achievementManager,
  isMuted = false,
  autoStart = false,
  onExit,
}: CtrlSWorldPhaserProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        gameId="ctrlSWorld"
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
