/**
 * CTRL-S World (Phaser) — React Component
 *
 * Phaser 3 narrative adventure. Pure Phaser-native rendering inside the iPod
 * canvas: puzzles and inventory are Phaser scenes (see PuzzleScene, InventoryScene),
 * no React overlays live inside the game container.
 *
 * R83.CTRLS.8: save system removed. CTRL-S is a linear session-only playthrough —
 * progress lives in component state and is torn down when the portal closes. No
 * persistence, no migration, no "Continue" entry point.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { PhaserGame } from '../../../../lib/phaser/PhaserGame';
import { PHASER_CONFIG, CTRLS_REGISTRY_KEYS } from './config';
import type { GameEvent } from '../../../../lib/phaser/types';
import { getItemRewardsForPuzzle, getItemById } from '../../../../data/items';
import { createDefaultCtrlSSessionState, type CtrlSSessionState } from './types';
import { useSoundSystem } from '../../../../hooks/useSoundSystem';

interface CtrlSWorldPhaserProps {
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
  isMuted = false,
  autoStart = false,
  onExit,
}: CtrlSWorldPhaserProps) {
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const activePuzzleRef = useRef<ActivePuzzleRef | null>(null);
  const { playSFX } = useSoundSystem();
  const [session, setSession] = useState<CtrlSSessionState>(createDefaultCtrlSSessionState);

  const handleGameRef = useCallback((game: Phaser.Game | null) => {
    gameInstanceRef.current = game;
  }, []);

  // Mirror session state into the Phaser registry so scenes read live progress.
  useEffect(() => {
    const game = gameInstanceRef.current;
    if (!game) return;

    game.registry.set(CTRLS_REGISTRY_KEYS.COMPLETED_CHAPTERS, session.completedChapters);
    game.registry.set(CTRLS_REGISTRY_KEYS.COMPLETED_PUZZLES, session.completedPuzzles);
    game.registry.set(CTRLS_REGISTRY_KEYS.CURRENT_CHAPTER, session.currentChapter);
    game.registry.set(CTRLS_REGISTRY_KEYS.INVENTORY, session.inventory);
  }, [
    session.completedChapters,
    session.completedPuzzles,
    session.currentChapter,
    session.inventory,
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
        const rewardIds = getItemRewardsForPuzzle(active.puzzleId);
        const rewards = rewardIds
          .map((id) => getItemById(id))
          .filter((item): item is NonNullable<ReturnType<typeof getItemById>> => Boolean(item))
          .map((item) => ({ ...item, quantity: 1, acquiredAt: new Date().toISOString() }));

        setSession((prev) => ({
          ...prev,
          completedPuzzles: prev.completedPuzzles.includes(active.puzzleId)
            ? prev.completedPuzzles
            : [...prev.completedPuzzles, active.puzzleId],
          inventory: rewards.length > 0 ? [...prev.inventory, ...rewards] : prev.inventory,
        }));
      }
    } else if (data.action === 'chapterComplete' && data.chapterIndex !== undefined) {
      const chapterIndex = data.chapterIndex;
      setSession((prev) => ({
        ...prev,
        completedChapters: prev.completedChapters.includes(chapterIndex)
          ? prev.completedChapters
          : [...prev.completedChapters, chapterIndex],
      }));
    } else if (data.action === 'chapterLaunch' && data.chapterIndex !== undefined) {
      const chapterIndex = data.chapterIndex;
      setSession((prev) => ({ ...prev, currentChapter: chapterIndex }));
    } else if (data.action === 'choice' && data.choiceId && data.label) {
      const { choiceId, label } = data;
      setSession((prev) => ({
        ...prev,
        storyChoices: { ...prev.storyChoices, [choiceId]: label },
      }));
    }
  }, [isMuted, playSFX]);

  return (
    <div className="relative w-full h-full bg-black">
      <PhaserGame
        gameId="ctrlSWorld"
        config={PHASER_CONFIG}
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
