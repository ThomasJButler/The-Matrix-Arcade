/**
 * PhaserGame - React wrapper for Phaser 3 games
 *
 * This component provides the bridge between React and Phaser:
 * - Mounts/unmounts Phaser game instance with React lifecycle
 * - Passes props (achievementManager, isMuted) via Phaser registry
 * - Handles events from Phaser scenes back to React
 * - Integrates with useSoundSystem for audio
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import Phaser from 'phaser';
import { useSoundSystem } from '../../hooks/useSoundSystem';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import {
  REGISTRY_KEYS,
  type AchievementManager,
  type GameEvent,
  type ScoreEventData,
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
}: PhaserGameWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasEverFocused, setHasEverFocused] = useState(false);
  const { playSFX, playBackgroundMP3, stopBackgroundMP3, toggleMute } = useSoundSystem();
  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();

  // Sound wrapper that respects mute state
  const playSound = useCallback(
    (key: string) => {
      if (!isMuted) {
        playSFX(key);
      }
    },
    [isMuted, playSFX]
  );

  // Handle game events from Phaser scenes
  const handleGameEvent = useCallback(
    (event: GameEvent) => {
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
          break;
        }
        case 'exit': {
          onExit?.();
          break;
        }
        case 'mute': {
          // Sync Phaser's mute toggle back to React state
          toggleMute();
          break;
        }
        case 'pause':
        case 'resume':
          // These are handled by the scene internally
          break;
      }
    },
    [gameId, achievementManager, unlockSaveAchievement, updateGameSave, playSound, toggleMute, onExit]
  );

  // Create sound system interface for Phaser
  const soundSystem = useCallback(
    () => ({
      play: playSound,
      playBgMusic: playBackgroundMP3,
      stopBgMusic: stopBackgroundMP3,
      isMuted,
    }),
    [playSound, playBackgroundMP3, stopBackgroundMP3, isMuted]
  );

  const saveDataRef = useRef(saveData);
  saveDataRef.current = saveData;

  const saveSystem = useMemo(
    () => ({
      getSaveData: () => saveDataRef.current,
      updateGameSave,
    }),
    [updateGameSave]
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

    // Set up registry with React props/callbacks
    game.registry.set(REGISTRY_KEYS.GAME_ID, gameId);
    game.registry.set(REGISTRY_KEYS.ACHIEVEMENT_MANAGER, achievementManager);
    game.registry.set(REGISTRY_KEYS.IS_MUTED, isMuted);
    game.registry.set(REGISTRY_KEYS.ON_GAME_EVENT, handleGameEvent);
    game.registry.set(REGISTRY_KEYS.SOUND_SYSTEM, soundSystem());
    game.registry.set(REGISTRY_KEYS.SAVE_SYSTEM, saveSystem);

    // Store autoStart in registry for scenes to check
    game.registry.set('autoStart', autoStart);

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
    });

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
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

  // Auto-refocus when hovering over the game — prevents keyboard input
  // from silently failing after the user clicks outside the game area
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    containerRef.current?.focus();
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
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
      onMouseLeave={handleMouseLeave}
      onFocus={() => {
        setHasFocus(true);
        setHasEverFocused(true);
      }}
      onBlur={() => setHasFocus(false)}
    >
      {/* Click-to-play overlay shown only after the container has had focus
          at least once and subsequently lost it — prevents the overlay from
          flashing on initial mount before auto-focus resolves, which was
          reported as a "floating dark rectangle near top-centre." */}
      {hasEverFocused && !hasFocus && !isHovering && (
        <div
          onClick={handleContainerClick}
          role="button"
          aria-label="Click to play"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10,
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '16px',
              color: '#00ff00',
              textShadow: '0 0 10px #00ff00',
            }}
          >
            Click to play
          </span>
        </div>
      )}
    </div>
  );
}

export default PhaserGame;
