import React, { useRef, useCallback, useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, VolumeX } from 'lucide-react';
import { GAME_TITLES } from '../lib/asciiArt';
import { GameErrorBoundary } from './ui/GameErrorBoundary';
import type { GameEntry } from '../data/gameRegistry';
import type { AchievementManager } from '../lib/phaser/types';

interface GameWithRuntime extends GameEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  icon: React.ReactNode;
}

export interface GamePortalProps {
  games: GameWithRuntime[];
  selectedGame: number;
  isTransitioning: boolean;
  transitionDirection: 'left' | 'right';
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onExit: () => void;
  onShowInstructions: () => void;
  onShowHighScores: () => void;
  onJumpToGame: (index: number) => void;
  isPlayDisabled: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  achievementManager: AchievementManager | null;
  playSFX?: (soundType: string) => void;
}

export function GamePortal({
  games,
  selectedGame,
  isTransitioning,
  transitionDirection,
  containerRef,
  onPrev,
  onNext,
  onPlay,
  onExit,
  onShowInstructions,
  onShowHighScores,
  onJumpToGame,
  isPlayDisabled,
  isPlaying,
  isMuted,
  achievementManager,
  playSFX,
}: GamePortalProps) {
  const game = games[selectedGame];
  const hasComponent = typeof game.component !== 'undefined';
  const zoneRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [wheelRotation, setWheelRotation] = useState<'left' | 'right' | null>(null);
  const rotationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const GameComponent = game.component;

  const triggerRotation = useCallback((direction: 'left' | 'right') => {
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    setWheelRotation(null);
    requestAnimationFrame(() => {
      setWheelRotation(direction);
      rotationTimer.current = setTimeout(() => setWheelRotation(null), 320);
    });
  }, []);

  const playClick = useCallback(() => playSFX?.('scoreboardTab'), [playSFX]);
  const playConfirm = useCallback(() => playSFX?.('scoreboardConfirm'), [playSFX]);

  const wheelRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 40;
    const SWIPE_MAX_TIME = 500;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current || isPlaying) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const elapsed = Date.now() - touchStart.current.time;
      touchStart.current = null;

      if (elapsed > SWIPE_MAX_TIME || Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx)) return;

      e.preventDefault();
      if (dx < 0) {
        playClick();
        triggerRotation('right');
        onNext();
      } else {
        playClick();
        triggerRotation('left');
        onPrev();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isPlaying, onNext, onPrev, playClick, triggerRotation]);

  const handlePlayPress = useCallback(() => {
    if (isPlaying) {
      playClick();
      onExit();
    } else if (!isPlayDisabled && hasComponent) {
      playConfirm();
      onPlay();
    }
  }, [isPlaying, onExit, isPlayDisabled, hasComponent, onPlay, playClick, playConfirm]);

  const handleScoresPress = useCallback(() => {
    if (isPlaying) return;
    playClick();
    onShowHighScores();
  }, [isPlaying, onShowHighScores, playClick]);

  const handleWheelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isPlaying) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
      }
      return;
    }

    const actionMap: Record<string, { index: number; action: () => void }> = {
      ArrowUp:    { index: 0, action: () => { playClick(); onShowInstructions(); } },
      ArrowRight: { index: 1, action: () => { playClick(); triggerRotation('right'); onNext(); } },
      ArrowDown:  { index: 2, action: handleScoresPress },
      ArrowLeft:  { index: 3, action: () => { playClick(); triggerRotation('left'); onPrev(); } },
      Enter:      { index: 4, action: handlePlayPress },
      ' ':        { index: 4, action: handlePlayPress },
    };

    const mapping = actionMap[e.key];
    if (mapping) {
      e.preventDefault();
      e.stopPropagation();
      zoneRefs.current[mapping.index]?.focus();
      mapping.action();
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      playClick();
      onJumpToGame(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      playClick();
      onJumpToGame(games.length - 1);
    } else if (e.key >= '1' && e.key <= '9') {
      const idx = parseInt(e.key, 10) - 1;
      if (idx < games.length) {
        e.preventDefault();
        playClick();
        onJumpToGame(idx);
      }
    }
  }, [onShowInstructions, onNext, onPrev, handlePlayPress, handleScoresPress, isPlaying, onExit, triggerRotation, playClick, onJumpToGame, games.length]);

  return (
    <div className={`relative w-full mx-auto flex flex-col justify-center h-full game-portal-container px-4 transition-all duration-300 ${isPlaying ? 'max-w-5xl' : 'max-w-xl'}`}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isPlaying
          ? `Now playing ${game.title}`
          : `${game.title} — game ${selectedGame + 1} of ${games.length}`}
      </div>
      <div
        ref={containerRef}
        className={`
          digital-container game-portal-wrapper
          ${isTransitioning ? `transition-${transitionDirection}` : ''}
        `}
      >
        {/* iPod Classic Device Body */}
        <div className={`ipod-body w-full mx-auto ${isPlaying ? 'ipod-body--playing' : ''}`}>
          {/* Screen Bezel */}
          <div className="ipod-screen">
            {/* Game Display */}
            <div className={`relative overflow-hidden ${isPlaying ? 'ipod-screen--playing' : 'aspect-[16/9]'}`}>
              {isPlaying && GameComponent ? (
                <GameErrorBoundary gameName={game.title} onReset={onExit}>
                  <Suspense fallback={
                    <div className="ipod-loading-screen">
                      <div className="ipod-loading-scanline" />
                      <div className="ipod-loading-title">{game.title}</div>
                      <div className="ipod-loading-chars">
                        {'LOADING'.split('').map((ch, i) => (
                          <span key={i} className="ipod-loading-char">{ch}</span>
                        ))}
                      </div>
                      <div className="ipod-loading-status">INITIALISING MATRIX</div>
                    </div>
                  }>
                    <GameComponent
                      achievementManager={achievementManager}
                      isMuted={isMuted}
                      autoStart={false}
                      onExit={onExit}
                    />
                  </Suspense>
                </GameErrorBoundary>
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedGame}
                      className="w-full h-full transition-enhanced"
                    >
                      <img
                        src={game.preview}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Title overlay on screen */}
                  <div className="absolute top-0 left-0 right-0 ipod-title-overlay pointer-events-none">
                    <h2 className="sr-only">{game.title}</h2>
                    <pre
                      className="text-green-500 font-mono text-[6px] lg:text-[8px] xl:text-[9px] leading-none text-center select-none overflow-hidden mx-auto py-1 lg:py-1.5"
                      aria-hidden="true"
                      style={{ textShadow: '0 0 6px rgba(0,255,0,0.9), 0 0 16px rgba(0,255,0,0.4), 0 0 30px rgba(0,255,0,0.15), 0 1px 2px rgba(0,0,0,0.8)' }}
                    >
                      {GAME_TITLES[game.id] || game.title}
                    </pre>
                  </div>
                </>
              )}

              {/* Floating indicators during play */}
              {isPlaying && isMuted && (
                <div className="absolute top-3 left-3 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 border border-red-400 rounded-lg animate-pulse-red pointer-events-none shadow-lg shadow-red-500/50">
                  <VolumeX className="w-4 h-4 text-white" />
                  <span className="text-white font-mono text-xs font-bold">MUTED</span>
                </div>
              )}

              {isPlaying && (
                <button
                  onClick={onExit}
                  className="absolute top-3 right-3 z-50 p-2 bg-red-900/90 hover:bg-red-700 rounded-lg border border-red-500/80 backdrop-blur-sm transition-all group shadow-lg hover:shadow-red-500/50 hover:scale-110"
                  title="Exit Game (ESC)"
                  aria-label="Exit Game"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Clickwheel region */}
          <div className={`ipod-clickwheel-region ${isPlaying ? 'mt-2 lg:mt-2' : 'mt-2 lg:mt-3'}`}>
            {/* Game info — hidden during play */}
            {!isPlaying && (
              <div className="text-center mb-2 lg:mb-3">
                {game.category && (
                  <span
                    className="inline-block text-green-500/70 font-mono text-[10px] tracking-widest uppercase border border-green-500/25 px-3 py-0.5 rounded-full mb-1.5"
                    style={{ textShadow: '0 0 6px rgba(0,255,0,0.3)', boxShadow: 'inset 0 0 8px rgba(0,255,0,0.05), 0 0 6px rgba(0,255,0,0.05)' }}
                  >
                    {game.category}
                  </span>
                )}
                <p className="text-green-400 font-mono text-xs lg:text-sm line-clamp-2 px-2">
                  {game.description}
                </p>
              </div>
            )}

            {/* iPod Clickwheel */}
            <div
              ref={wheelRef}
              className={`ipod-clickwheel${wheelRotation ? ` rotating-${wheelRotation}` : ''}${isPlaying ? ' ipod-clickwheel--compact' : ''}`}
              role="toolbar"
              aria-label="Game navigation wheel — swipe left or right to navigate"
              tabIndex={0}
              onKeyDown={handleWheelKeyDown}
            >
              <button
                ref={(el) => { zoneRefs.current[0] = el; }}
                className="clickwheel-zone clickwheel-top"
                onClick={() => { playClick(); isPlaying ? onExit() : onShowInstructions(); }}
                tabIndex={-1}
                aria-label={isPlaying ? 'Exit game' : 'How to play'}
              >
                <span>{isPlaying ? 'EXIT' : 'MENU'}</span>
              </button>

              <button
                ref={(el) => { zoneRefs.current[3] = el; }}
                className="clickwheel-zone clickwheel-left"
                onClick={() => { if (!isPlaying) { playClick(); triggerRotation('left'); onPrev(); } }}
                data-testid="carousel-prev"
                tabIndex={-1}
                aria-label="Previous game"
                disabled={isPlaying}
              >
                <span>◄◄</span>
              </button>

              <button
                ref={(el) => { zoneRefs.current[1] = el; }}
                className="clickwheel-zone clickwheel-right"
                onClick={() => { if (!isPlaying) { playClick(); triggerRotation('right'); onNext(); } }}
                data-testid="carousel-next"
                tabIndex={-1}
                aria-label="Next game"
                disabled={isPlaying}
              >
                <span>►►</span>
              </button>

              <button
                ref={(el) => { zoneRefs.current[2] = el; }}
                className="clickwheel-zone clickwheel-bottom"
                onClick={handleScoresPress}
                disabled={isPlaying}
                tabIndex={-1}
                aria-label="View high scores"
              >
                <span>●</span>
              </button>

              <button
                ref={(el) => { zoneRefs.current[4] = el; }}
                className="clickwheel-centre"
                onClick={handlePlayPress}
                disabled={!isPlaying && (isPlayDisabled || !hasComponent)}
                tabIndex={-1}
                aria-label={isPlaying ? 'Stop game' : 'Play game'}
              >
                {isPlaying ? '❚❚' : '▶'}
              </button>
            </div>

            {/* Keyboard hints — hidden during play */}
            {!isPlaying && (
              <div className="mt-2 text-xs lg:text-sm text-green-400/60 text-center space-y-0.5 font-mono">
                <p className="text-green-500/70">&larr;&rarr; NAVIGATE &bull; &uarr; MENU &bull; &darr; SCORES &bull; ENTER PLAY &bull; ESC EXIT</p>
                <p className="text-green-500/50">1-{Math.min(9, games.length)} JUMP &bull; HOME/END &bull; SWIPE WHEEL &bull; I/H/A Keys</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
