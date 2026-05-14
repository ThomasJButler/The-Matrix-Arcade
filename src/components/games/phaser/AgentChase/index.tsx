/**
 * Agent Chase - React Component
 *
 * Pacman-style maze game with Matrix theme.
 */

import React from 'react';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG } from './config';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface AgentChaseProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
  onExit?: () => void;
}

/**
 * Agent Chase - Pacman-style maze game
 *
 * Collect data, avoid Agents, use power pellets wisely!
 */
export default function AgentChase({
  achievementManager,
  isMuted = false,
  autoStart = false,
  onExit,
}: AgentChaseProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        gameId="agentChase"
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
