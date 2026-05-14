/**
 * Matrix Frogger - React Component
 *
 * Wraps the Phaser game in a React component with proper integration:
 * - Achievement manager
 * - Sound system (mute)
 * - Auto-start support
 * - Exit callback
 */

import React from 'react';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG } from './config';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface MatrixFroggerProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
  onExit?: () => void;
}

/**
 * Matrix Frogger - Frogger-style lane crossing game
 *
 * Navigate through lanes of Agents and Sentinels.
 * Collect pills, use power-ups, reach the top!
 */
export default function MatrixFrogger({
  achievementManager,
  isMuted = false,
  autoStart = false,
  onExit,
}: MatrixFroggerProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        gameId="matrixFrogger"
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
