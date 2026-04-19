/**
 * PhaserGame - React wrapper for Phaser 3 games
 *
 * This component provides the bridge between React and Phaser:
 * - Mounts/unmounts Phaser game instance with React lifecycle
 * - Passes props (achievementManager, isMuted) via Phaser registry
 * - Handles events from Phaser scenes back to React
 * - Integrates with useSoundSystem for audio
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import Phaser from 'phaser';
import { useSoundSystem, type SoundEffect } from '../../hooks/useSoundSystem';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import { buildGameOverAnnouncement, buildScoreMilestoneAnnouncement, buildMatchPointAnnouncement } from './a11y';
import {
  GAME_TRANSITION_READY_EVENT,
  REGISTRY_KEYS,
  type AchievementManager,
  type GameEvent,
  type ScoreEventData,
  type ScoreMilestoneEventData,
  type MatchPointEventData,
  type AchievementEventData,
} from './types';

export interface PhaserGameWrapperProps {
  /** Unique game identifier for saves/achievements */
  gameId: string;
  /** Phaser game configuration */
  config: Phaser.Types.Core.GameConfig;
  /** Achievement manager for unlocking achievements */
  achievementManager?: AchievementManager;
  /** Whether sound is muted */
  isMuted?: boolean;
  /** Auto-start the game (skip menu) */
  autoStart?: boolean;
  /** Callback when player exits the game */
  onExit?: () => void;
  /** Additional class names for the container */
  className?: string;
  /** Callback for all game events (called alongside internal handling) */
  onGameEvent?: (event: GameEvent) => void;
  /** Ref callback to access the Phaser.Game instance */
  gameRef?: (game: Phaser.Game | null) => void;
}

/**
 * React wrapper component for Phaser games
 * Handles lifecycle, props passing, and event communication
 */
export function PhaserGame({
  gameId,
  config,
  achievementManager,
  isMuted = false,
  autoStart = false,
  onExit,
  className = '',
  onGameEvent: onGameEventProp,
  gameRef: gameRefProp,
}: PhaserGameWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hasFocus, setHasFocus] = useState(false);
  // R84.CI (a11y priority 1): screen-reader announcement for `gameOver`
  // events emitted by any Phaser scene. Nonce forces a fresh DOM update
  // even when a replay ends on the same score, so aria-live re-reads rather
  // than going silent on identical content. Landing grid + iPod portal
  // already own their own live regions (GamePortal.tsx:565) — this plugs the
  // in-game gap which was Phaser-emitting events with no SR surface.
  const [srAnnouncement, setSrAnnouncement] = useState<{ msg: string; nonce: number }>({
    msg: '',
    nonce: 0,
  });
  const { playSFX, playBackgroundMP3, stopBackgroundMP3, playAmbientDrone, stopAmbientDrone, toggleMute } = useSoundSystem();
  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement, addScore } = useSaveSystem();

  // Sound wrapper that respects mute state.
  // `customConfig` forwards through to `playSFX` so a scene can pass per-call
  // overrides (e.g. R83.B1(f) volumeScale for Matrix Bird) without needing to
  // reach into useSoundSystem directly.
  const playSound = useCallback(
    (key: string, customConfig?: Partial<SoundEffect>) => {
      if (!isMuted) {
        playSFX(key, customConfig);
      }
    },
    [isMuted, playSFX]
  );

  // Handle game events from Phaser scenes
  const handleGameEvent = useCallback(
    (event: GameEvent) => {
      onGameEventProp?.(event);

      switch (event.type) {
        case 'score': {
          const data = event.data as ScoreEventData;
          updateGameSave(gameId, { highScore: data.highScore ?? data.score });
          break;
        }
        case 'achievement': {
          const data = event.data as AchievementEventData;
          achievementManager?.unlockAchievement(gameId, data.achievementId);
          unlockSaveAchievement(gameId, data.achievementId);
          break;
        }
        case 'gameOver': {
          playSound('gameOver');
          setSrAnnouncement(prev => ({
            msg: buildGameOverAnnouncement(event.data as { score?: number; reason?: string } | undefined),
            nonce: prev.nonce + 1,
          }));
          break;
        }
        case 'scoreMilestone': {
          // R84.CI-2: broadcast the threshold crossing to the shared SR live
          // region so AT users hear `Score milestone 100.` alongside the
          // sighted player's COLLECTIBLE stinger. Builder returns '' for a
          // malformed payload so the region no-ops rather than announcing
          // garbage — matches the `buildGameOverAnnouncement` guard shape.
          const msg = buildScoreMilestoneAnnouncement(event.data as ScoreMilestoneEventData | undefined);
          if (msg) {
            setSrAnnouncement(prev => ({ msg, nonce: prev.nonce + 1 }));
          }
          break;
        }
        case 'matchPoint': {
          // R84.CI-5: Vortex Pong's win-condition-based scoring doesn't map
          // to numeric-threshold milestones, so its tension beat (either
          // side reaching WIN_SCORE - 1) travels on a dedicated event.
          // Same nonce-bumping pattern so replays re-announce on identical
          // sides, and the same '' → no-op guard on malformed payloads.
          const msg = buildMatchPointAnnouncement(event.data as MatchPointEventData | undefined);
          if (msg) {
            setSrAnnouncement(prev => ({ msg, nonce: prev.nonce + 1 }));
          }
          break;
        }
        case 'exit': {
          onExit?.();
          break;
        }
        case 'mute': {
          toggleMute();
          break;
        }
        case 'pause':
        case 'resume':
          break;
      }
    },
    [gameId, achievementManager, unlockSaveAchievement, updateGameSave, playSound, toggleMute, onExit, onGameEventProp]
  );

  // Create sound system interface for Phaser.
  // R83.CTRLS.17 — `playAmbientDrone`/`stopAmbientDrone` added for CTRL-S
  // narrative dread drone. Guards on `isMuted` so muting a chapter stops the
  // drone's fade-in without relying on masterGain silencing (masterGain=0
  // still routes, we want no scheduled audio at all when muted).
  const playAmbientDroneGuarded = useCallback(
    (options?: { volume?: number }) => {
      if (isMuted) return;
      playAmbientDrone(options);
    },
    [isMuted, playAmbientDrone]
  );

  const soundSystem = useCallback(
    () => ({
      play: playSound,
      playBgMusic: playBackgroundMP3,
      stopBgMusic: stopBackgroundMP3,
      playAmbientDrone: playAmbientDroneGuarded,
      stopAmbientDrone,
      isMuted,
    }),
    [playSound, playBackgroundMP3, stopBackgroundMP3, playAmbientDroneGuarded, stopAmbientDrone, isMuted]
  );

  const saveDataRef = useRef(saveData);
  saveDataRef.current = saveData;

  const saveSystem = useMemo(
    () => ({
      getSaveData: () => saveDataRef.current,
      updateGameSave,
      addScore,
    }),
    [updateGameSave, addScore]
  );

  // Initialize Phaser game on mount
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Create game with merged config
    // Ensure keyboard events target `window` so they reach Phaser's plugin
    // regardless of which element has DOM focus (container div vs canvas).
    const inputConfig = typeof config.input === 'object' && config.input !== null ? config.input : {};
    const kbConfig = 'keyboard' in inputConfig && typeof (inputConfig as Record<string, unknown>).keyboard === 'object'
      ? (inputConfig as Record<string, unknown>).keyboard as Record<string, unknown>
      : {};

    const gameConfig: Phaser.Types.Core.GameConfig = {
      ...config,
      parent: containerRef.current,
      input: {
        ...(inputConfig as Phaser.Types.Core.InputConfig),
        keyboard: {
          ...kbConfig,
          target: window,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: config.width ?? 800,
        height: config.height ?? 600,
        ...config.scale,
      },
      backgroundColor: config.backgroundColor ?? '#000000',
    };

    const game = new Phaser.Game(gameConfig);
    gameRef.current = game;
    gameRefProp?.(game);

    // Set up registry with React props/callbacks
    game.registry.set(REGISTRY_KEYS.GAME_ID, gameId);
    game.registry.set(REGISTRY_KEYS.ACHIEVEMENT_MANAGER, achievementManager);
    game.registry.set(REGISTRY_KEYS.IS_MUTED, isMuted);
    game.registry.set(REGISTRY_KEYS.ON_GAME_EVENT, handleGameEvent);
    game.registry.set(REGISTRY_KEYS.SOUND_SYSTEM, soundSystem());
    game.registry.set(REGISTRY_KEYS.SAVE_SYSTEM, saveSystem);

    // Store autoStart in registry for scenes to check
    game.registry.set(REGISTRY_KEYS.AUTO_START, autoStart);

    // Expose game instance for E2E testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).__TEST__) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__PHASER_GAME__ = game;
    }

    // Focus the container as early as possible — use multiple strategies
    // to handle browser/timing variance. Without focus, Phaser's keyboard
    // plugin receives no DOM events and all input silently fails.
    const focusContainer = () => containerRef.current?.focus();

    // Strategy 1: Focus immediately after game creation
    focusContainer();

    // Strategy 2: Focus after Phaser's 'ready' event (input system initialised)
    game.events.once('ready', () => {
      focusContainer();
      // Strategy 3: One more rAF after ready to ensure DOM is fully settled
      requestAnimationFrame(focusContainer);

      // R83.G9: signal the portal transition mask that the game instance is
      // live so it can lift the black cover. One rAF after `ready` means the
      // first scene tick has had a chance to paint, so revealing now shows a
      // populated canvas rather than an empty one. The portal layers a 500 ms
      // safety timeout on top so a scene that stalls can't pin the mask
      // open indefinitely.
      requestAnimationFrame(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(GAME_TRANSITION_READY_EVENT));
        }
      });
    });

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        gameRefProp?.(null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof window !== 'undefined' && (window as any).__PHASER_GAME__) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (window as any).__PHASER_GAME__;
        }
      }
    };
  }, [config, gameId]); // Only recreate game if config or gameId changes

  // Update mute state in registry when it changes
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set(REGISTRY_KEYS.IS_MUTED, isMuted);
      gameRef.current.registry.set(REGISTRY_KEYS.SOUND_SYSTEM, soundSystem());
    }
  }, [isMuted, soundSystem]);

  // Update achievement manager in registry when it changes
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set(REGISTRY_KEYS.ACHIEVEMENT_MANAGER, achievementManager);
    }
  }, [achievementManager]);

  // Update event handler in registry when it changes
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set(REGISTRY_KEYS.ON_GAME_EVENT, handleGameEvent);
    }
  }, [handleGameEvent]);

  // Click handler to restore focus when user clicks on the game container
  // (focus can be lost when clicking outside, this allows recovery)
  const handleContainerClick = useCallback(() => {
    containerRef.current?.focus();
  }, []);

  // Auto-refocus when hovering over the game — keyboard input silently
  // fails if the container loses focus, so recover focus on mouse re-entry.
  const handleMouseEnter = useCallback(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        data-phaser-game="true"
        role="application"
        aria-label={`${gameId} game`}
        className={`w-full h-full ${className}`}
        style={{
          minHeight: '400px',
          outline: '2px solid transparent',
          boxShadow: hasFocus ? '0 0 0 2px #00ff00' : 'none',
          transition: 'box-shadow 0.2s ease',
          position: 'relative',
        }}
        tabIndex={0}
        onClick={handleContainerClick}
        onMouseEnter={handleMouseEnter}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
      />
      <div
        data-testid="phaser-sr-announcement"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        key={srAnnouncement.nonce}
      >
        {srAnnouncement.msg}
      </div>
    </>
  );
}

export default PhaserGame;
