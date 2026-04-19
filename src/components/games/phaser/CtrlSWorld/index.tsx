/**
 * CTRL-S World (Phaser) — React Component
 *
 * Phaser 3 narrative adventure. Pure Phaser-native rendering inside the iPod
 * canvas: puzzles and inventory are Phaser scenes (see PuzzleScene, InventoryScene),
 * no React overlays live inside the game container.
 *
 * React's remaining responsibilities:
 *  - Mount the Phaser game and bridge props via Phaser registry
 *  - Listen for game events and run save/achievement side effects
 *  - Sync GameStateContext → Phaser registry (so scenes read live progress)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG, ACHIEVEMENTS, CHAPTER_ACHIEVEMENTS, CTRLS_REGISTRY_KEYS, GAME_CONFIG } from './config';
import type { GameEvent } from '../../../../lib/phaser/types';
import { getItemRewardsForPuzzle, getItemById } from '../../../../data/items';
import { useGameState } from '../../../../contexts/GameStateContext';
import { useSoundSystem } from '../../../../hooks/useSoundSystem';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface CtrlSWorldPhaserProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
  autoStart?: boolean;
  onExit?: () => void;
}

interface ActivePuzzleRef {
  puzzleId: string;
  chapterIndex: number;
  paragraphIndex: number;
}

export default function CtrlSWorldPhaser({
  achievementManager,
  isMuted = false,
  autoStart = false,
  onExit,
}: CtrlSWorldPhaserProps) {
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const activePuzzleRef = useRef<ActivePuzzleRef | null>(null);
  const { playSFX } = useSoundSystem();
  const gameState = useGameState();

  const handleGameRef = useCallback((game: Phaser.Game | null) => {
    gameInstanceRef.current = game;
  }, []);

  // Sync GameStateContext → Phaser registry so scenes read live progress + inventory.
  useEffect(() => {
    const game = gameInstanceRef.current;
    if (!game) return;

    game.registry.set(CTRLS_REGISTRY_KEYS.COMPLETED_CHAPTERS, gameState.state.completedChapters);
    game.registry.set(CTRLS_REGISTRY_KEYS.COMPLETED_PUZZLES, gameState.state.completedPuzzles);
    game.registry.set(CTRLS_REGISTRY_KEYS.CURRENT_CHAPTER, gameState.state.currentChapter);
    game.registry.set(CTRLS_REGISTRY_KEYS.INVENTORY, gameState.state.inventory);
  }, [
    gameState.state.completedChapters,
    gameState.state.completedPuzzles,
    gameState.state.currentChapter,
    gameState.state.inventory,
  ]);

  const handleGameEvent = useCallback((event: GameEvent) => {
    if (event.type !== 'pause') return;

    const data = event.data as {
      action?: string;
      puzzleId?: string;
      chapterIndex?: number;
      paragraphIndex?: number;
      choiceId?: string;
      label?: string;
      success?: boolean;
      hintsUsed?: number;
      lifelinesUsed?: number;
    } | undefined;
    if (!data?.action) return;

    if (data.action === 'openPuzzle' && data.puzzleId) {
      activePuzzleRef.current = {
        puzzleId: data.puzzleId,
        chapterIndex: data.chapterIndex ?? 0,
        paragraphIndex: data.paragraphIndex ?? 0,
      };
    } else if (data.action === 'puzzleComplete' && data.puzzleId) {
      const active = activePuzzleRef.current;
      activePuzzleRef.current = null;

      if (!isMuted) {
        playSFX(data.success ? 'ctrlsPuzzleSolved' : 'ctrlsPuzzleFailed');
      }

      if (data.success && active) {
        achievementManager?.unlockAchievement('ctrlSWorld', ACHIEVEMENTS.FIRST_PUZZLE);

        const hintsUsed = data.hintsUsed ?? 0;
        const lifelinesUsed = data.lifelinesUsed ?? 0;
        if (hintsUsed === 0 && lifelinesUsed === 0) {
          achievementManager?.unlockAchievement('ctrlSWorld', ACHIEVEMENTS.NO_HINTS);
        }

        gameState.completePuzzle(active.puzzleId);

        const completedPuzzles = [...(gameState.state.completedPuzzles ?? []), active.puzzleId];
        if (completedPuzzles.length >= 10) {
          achievementManager?.unlockAchievement('ctrlSWorld', ACHIEVEMENTS.PUZZLE_MASTER);
        }

        const rewardIds = getItemRewardsForPuzzle(active.puzzleId);
        for (const itemId of rewardIds) {
          const itemData = getItemById(itemId);
          if (itemData) {
            gameState.addItem({ ...itemData, quantity: 1, acquiredAt: new Date().toISOString() });
          }
        }

        gameState.saveGame();
      }
    } else if (data.action === 'chapterComplete' && data.chapterIndex !== undefined) {
      gameState.completeChapter(data.chapterIndex);

      const chapterAchievement = CHAPTER_ACHIEVEMENTS[data.chapterIndex];
      if (chapterAchievement) {
        achievementManager?.unlockAchievement('ctrlSWorld', chapterAchievement);
      }

      if (data.chapterIndex === GAME_CONFIG.CHAPTERS.TOTAL - 1) {
        achievementManager?.unlockAchievement('ctrlSWorld', ACHIEVEMENTS.STORY_COMPLETE);
      }

      const completedChapters = [...(gameState.state.completedChapters ?? []), data.chapterIndex];
      const completedPuzzles = gameState.state.completedPuzzles ?? [];
      if (completedChapters.length >= GAME_CONFIG.CHAPTERS.TOTAL && completedPuzzles.length >= 10) {
        achievementManager?.unlockAchievement('ctrlSWorld', ACHIEVEMENTS.COMPLETIONIST);
      }

      gameState.saveGame();
    } else if (data.action === 'chapterLaunch' && data.chapterIndex !== undefined) {
      gameState.setChapter(data.chapterIndex);
      gameState.saveGame();
    } else if (data.action === 'choice' && data.choiceId && data.label) {
      gameState.makeChoice(data.choiceId, data.label);
      gameState.saveGame();
    }
  }, [achievementManager, gameState, isMuted, playSFX]);

  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        gameId="ctrlSWorld"
        config={PHASER_CONFIG}
        achievementManager={achievementManager}
        isMuted={isMuted}
        autoStart={autoStart}
        onExit={onExit}
        onGameEvent={handleGameEvent}
        gameRef={handleGameRef}
        className="w-full h-full"
      />
    </div>
  );
}
