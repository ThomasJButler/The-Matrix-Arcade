/**
 * CTRL-S World (Phaser) - React Component
 *
 * Phaser 3 rewrite of the narrative text adventure.
 * Feature-flagged alongside the old React version until R80.25 cut-over.
 *
 * Renders PuzzleModal and InventoryPanel as React overlays when NarrativeScene triggers them.
 * Bridges GameStateContext ↔ Phaser registry for save/load persistence.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Phaser from 'phaser';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG, CTRLS_SCENE_KEYS, CTRLS_REGISTRY_KEYS } from './config';
import type { GameEvent } from '../../../../lib/phaser/types';
import { PuzzleModal, type PuzzleData } from '../../../ui/PuzzleModal';
import { InventoryPanel } from '../../../ui/InventoryPanel';
import { getPuzzleById } from '../../../../data/puzzles';
import { getItemRewardsForPuzzle, getItemById } from '../../../../data/items';
import { useGameState } from '../../../../contexts/GameStateContext';
import { CtrlSNarrativeScene } from './scenes/NarrativeScene';
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

interface PuzzleOverlayState {
  puzzle: PuzzleData;
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
  const [activePuzzle, setActivePuzzle] = useState<PuzzleOverlayState | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const { playSFX } = useSoundSystem();
  const gameState = useGameState();

  const handleGameRef = useCallback((game: Phaser.Game | null) => {
    gameInstanceRef.current = game;
  }, []);

  // Sync GameStateContext → Phaser registry so scenes read live progress
  useEffect(() => {
    const game = gameInstanceRef.current;
    if (!game) return;

    game.registry.set(CTRLS_REGISTRY_KEYS.COMPLETED_CHAPTERS, gameState.state.completedChapters);
    game.registry.set(CTRLS_REGISTRY_KEYS.COMPLETED_PUZZLES, gameState.state.completedPuzzles);
    game.registry.set(CTRLS_REGISTRY_KEYS.CURRENT_CHAPTER, gameState.state.currentChapter);
  }, [
    gameState.state.completedChapters,
    gameState.state.completedPuzzles,
    gameState.state.currentChapter,
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
    } | undefined;
    if (!data?.action) return;

    if (data.action === 'openPuzzle' && data.puzzleId) {
      const puzzle = getPuzzleById(data.puzzleId);
      if (!puzzle) return;

      setActivePuzzle({
        puzzle,
        puzzleId: data.puzzleId,
        chapterIndex: data.chapterIndex ?? 0,
        paragraphIndex: data.paragraphIndex ?? 0,
      });
    } else if (data.action === 'openInventory') {
      setInventoryOpen(true);
    } else if (data.action === 'chapterComplete' && data.chapterIndex !== undefined) {
      gameState.completeChapter(data.chapterIndex);
      gameState.saveGame();
    } else if (data.action === 'chapterLaunch' && data.chapterIndex !== undefined) {
      gameState.setChapter(data.chapterIndex);
      gameState.saveGame();
    } else if (data.action === 'choice' && data.choiceId && data.label) {
      gameState.makeChoice(data.choiceId, data.label);
      gameState.saveGame();
    }
  }, [gameState]);

  const resumeNarrative = useCallback(() => {
    const game = gameInstanceRef.current;
    if (!game) return;

    const scene = game.scene.getScene(CTRLS_SCENE_KEYS.NARRATIVE) as CtrlSNarrativeScene | null;
    scene?.resumeAfterPuzzle();
  }, []);

  const handlePuzzleClose = useCallback(() => {
    setActivePuzzle(null);
    resumeNarrative();
  }, [resumeNarrative]);

  const handlePuzzleComplete = useCallback((success: boolean, _hintsUsed: number, _lifelinesUsed: number) => {
    if (success && activePuzzle) {
      achievementManager?.unlockAchievement('ctrlSWorld', 'ctrl_first_puzzle');

      gameState.completePuzzle(activePuzzle.puzzleId);

      const rewardIds = getItemRewardsForPuzzle(activePuzzle.puzzleId);
      for (const itemId of rewardIds) {
        const itemData = getItemById(itemId);
        if (itemData) {
          gameState.addItem({ ...itemData, quantity: 1, acquiredAt: new Date().toISOString() });
        }
      }

      gameState.saveGame();
    }
    setActivePuzzle(null);
    resumeNarrative();
  }, [achievementManager, resumeNarrative, activePuzzle, gameState]);

  const handleInventoryClose = useCallback(() => {
    setInventoryOpen(false);

    const game = gameInstanceRef.current;
    if (!game) return;
    const scene = game.scene.getScene(CTRLS_SCENE_KEYS.NARRATIVE) as CtrlSNarrativeScene | null;
    scene?.resumeAfterInventory();
  }, []);

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
      {activePuzzle && (
        <PuzzleModal
          isOpen={true}
          puzzle={activePuzzle.puzzle}
          onClose={handlePuzzleClose}
          onComplete={handlePuzzleComplete}
          playSFX={isMuted ? undefined : playSFX}
        />
      )}
      <InventoryPanel
        isOpen={inventoryOpen}
        onClose={handleInventoryClose}
      />
    </div>
  );
}
