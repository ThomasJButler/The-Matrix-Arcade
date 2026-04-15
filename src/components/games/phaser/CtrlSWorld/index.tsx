/**
 * CTRL-S World (Phaser) - React Component
 *
 * Phaser 3 rewrite of the narrative text adventure.
 * Feature-flagged alongside the old React version until R80.25 cut-over.
 *
 * Renders PuzzleModal as a React overlay when NarrativeScene triggers a puzzle.
 */

import React, { useState, useCallback, useRef } from 'react';
import Phaser from 'phaser';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG, CTRLS_SCENE_KEYS } from './config';
import type { GameEvent } from '../../../../lib/phaser/types';
import { PuzzleModal, type PuzzleData } from '../../../ui/PuzzleModal';
import { getPuzzleById } from '../../../../data/puzzles';
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
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const { playSFX } = useSoundSystem();

  const handleGameRef = useCallback((game: Phaser.Game | null) => {
    gameInstanceRef.current = game;
  }, []);

  const handleGameEvent = useCallback((event: GameEvent) => {
    if (event.type !== 'pause') return;

    const data = event.data as { action?: string; puzzleId?: string; chapterIndex?: number; paragraphIndex?: number } | undefined;
    if (data?.action !== 'openPuzzle' || !data.puzzleId) return;

    const puzzle = getPuzzleById(data.puzzleId);
    if (!puzzle) return;

    setActivePuzzle({
      puzzle,
      puzzleId: data.puzzleId,
      chapterIndex: data.chapterIndex ?? 0,
      paragraphIndex: data.paragraphIndex ?? 0,
    });
  }, []);

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
    if (success) {
      achievementManager?.unlockAchievement('ctrlSWorld', 'ctrl_first_puzzle');
    }
    setActivePuzzle(null);
    resumeNarrative();
  }, [achievementManager, resumeNarrative]);

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
    </div>
  );
}
