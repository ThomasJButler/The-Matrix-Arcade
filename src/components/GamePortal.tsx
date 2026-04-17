import React, { useRef, useCallback, useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LogOut, Pause, Trophy, VolumeX } from 'lucide-react';
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
  const game: GameWithRuntime | undefined = games[selectedGame];
  const hasComponent = typeof game?.component !== 'undefined';
  const zoneRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [wheelRotation, setWheelRotation] = useState<'left' | 'right' | null>(null);
  const rotationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const GameComponent = game?.component;
  const shouldReduceMotion = useReducedMotion();

  const layoutTransition = useMemo(
    () =>
      shouldReduceMotion
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 220, damping: 26, mass: 0.9 },
    [shouldReduceMotion],
  );
  const surfaceTransition = useMemo(
    () =>
      shouldReduceMotion
        ? { duration: 0 }
        : { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const },
    [shouldReduceMotion],
  );
  const slideTransition = useMemo(
    () =>
      shouldReduceMotion
        ? { duration: 0 }
        : { duration: 0.26, ease: [0.25, 0.1, 0.25, 1] as const },
    [shouldReduceMotion],
  );
  const slideVariants = useMemo(
    () =>
      shouldReduceMotion
        ? {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
          }
        : {
            initial: (dir: number) => ({ x: `${dir * 100}%`, opacity: 0 }),
            animate: { x: '0%', opacity: 1 },
            exit: (dir: number) => ({ x: `${-dir * 100}%`, opacity: 0 }),
          },
    [shouldReduceMotion],
  );
  const slideDirection = transitionDirection === 'right' ? 1 : -1;
  const infoEnter = useMemo(
    () =>
      shouldReduceMotion
        ? { initial: false as const, animate: { opacity: 1, y: 0 } }
        : {
            initial: { opacity: 0, y: 6 },
            animate: { opacity: 1, y: 0 },
          },
    [shouldReduceMotion],
  );

  const triggerRotation = useCallback((direction: 'left' | 'right') => {
    if (shouldReduceMotion) return;
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    setWheelRotation(null);
    requestAnimationFrame(() => {
      setWheelRotation(direction);
      rotationTimer.current = setTimeout(() => setWheelRotation(null), 320);
    });
  }, [shouldReduceMotion]);

  const triggerPressFlash = useCallback((index: number) => {
    if (shouldReduceMotion) return;
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setPressedIndex(null);
    requestAnimationFrame(() => {
      setPressedIndex(index);
      pressTimer.current = setTimeout(() => setPressedIndex(null), 200);
    });
  }, [shouldReduceMotion]);

  useEffect(() => {
    return () => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
      if (pressTimer.current) clearTimeout(pressTimer.current);
    };
  }, []);

  // R82.21: when play starts, scroll the iPod top into view so the wider
  // portal doesn't get clipped by the header. Only fires on the false→true
  // transition; exit lets the layout spring shrink back without scroll jank.
  const prevIsPlaying = useRef(isPlaying);
  useEffect(() => {
    if (!prevIsPlaying.current && isPlaying) {
      containerRef.current?.scrollIntoView({
        block: 'start',
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
    }
    prevIsPlaying.current = isPlaying;
  }, [isPlaying, shouldReduceMotion, containerRef]);

  const playClick = useCallback(() => playSFX?.('scoreboardTab'), [playSFX]);
  const playConfirm = useCallback(() => playSFX?.('scoreboardConfirm'), [playSFX]);

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const dashbarRef = useRef<HTMLDivElement | null>(null);
  const pendingSurfaceFocus = useRef<'wheel' | 'dashbar' | null>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  // Capture "focus should follow the surface swap" ONLY when the portal
  // surface currently owns focus — prevents stealing focus from modals
  // or unrelated UI that may have triggered an exit indirectly.
  const captureSurfaceFocusIntent = useCallback((target: 'wheel' | 'dashbar') => {
    const active = document.activeElement;
    if (containerRef.current && active instanceof Node && containerRef.current.contains(active)) {
      pendingSurfaceFocus.current = target;
    }
  }, [containerRef]);

  // Ref callbacks fire when AnimatePresence mounts the new surface — the
  // earliest deterministic moment we can transfer focus. A useEffect keyed
  // on isPlaying fires too early under `mode="wait"` (exit anim still running).
  const wheelRefCallback = useCallback((el: HTMLDivElement | null) => {
    wheelRef.current = el;
    if (el && pendingSurfaceFocus.current === 'wheel') {
      pendingSurfaceFocus.current = null;
      el.focus();
    }
  }, []);

  const dashbarRefCallback = useCallback((el: HTMLDivElement | null) => {
    dashbarRef.current = el;
    if (el && pendingSurfaceFocus.current === 'dashbar') {
      pendingSurfaceFocus.current = null;
      el.focus();
    }
  }, []);

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
      captureSurfaceFocusIntent('wheel');
      playClick();
      onExit();
    } else if (!isPlayDisabled && hasComponent) {
      captureSurfaceFocusIntent('dashbar');
      playConfirm();
      onPlay();
    }
  }, [isPlaying, onExit, isPlayDisabled, hasComponent, onPlay, playClick, playConfirm, captureSurfaceFocusIntent]);

  const handleScoresPress = useCallback(() => {
    if (isPlaying) return;
    playClick();
    onShowHighScores();
  }, [isPlaying, onShowHighScores, playClick]);

  const handleWheelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isPlaying) {
      if (e.key === 'Escape') {
        e.preventDefault();
        captureSurfaceFocusIntent('wheel');
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
      triggerPressFlash(mapping.index);
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
  }, [onShowInstructions, onNext, onPrev, handlePlayPress, handleScoresPress, isPlaying, onExit, triggerRotation, triggerPressFlash, playClick, onJumpToGame, games.length, captureSurfaceFocusIntent]);

  if (!game) {
    return (
      <motion.div
        layout
        transition={layoutTransition}
        className="relative w-full mx-auto flex flex-col justify-center h-full game-portal-container px-4 max-w-xl"
        data-testid="game-portal-empty"
      >
        <div className="sr-only" role="alert">
          No games are available to play. The arcade may be loading or unavailable.
        </div>
        <div className="digital-container game-portal-wrapper">
          <div className="ipod-body w-full mx-auto">
            <div className="ipod-screen">
              <div className="relative overflow-hidden aspect-[16/9] ipod-empty-screen">
                <div className="ipod-empty-glyph" aria-hidden="true">◉</div>
                <div className="ipod-empty-title">NO SIGNAL</div>
                <p className="ipod-empty-sub">
                  The arcade has no games loaded. Try reloading the page.
                </p>
              </div>
            </div>
            <div className="ipod-clickwheel-region mt-2 lg:mt-3">
              <div className="text-center mb-2 lg:mb-3">
                <p className="text-green-400/60 font-mono text-xs lg:text-sm px-2">
                  Waiting for the Matrix to reconnect…
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      transition={layoutTransition}
      className={`relative w-full mx-auto flex flex-col justify-center h-full game-portal-container px-4 ${isPlaying ? 'max-w-[min(95vw,1600px)]' : 'max-w-xl'}`}
    >
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
        {/* iPod Classic Device Body — during play, body shrinks to fit the
            16:9 screen so a 16:9 game (VortexPong, etc.) fills the bezel with
            zero pillarbox; the `w-full` static-mode fill is dropped in favour
            of `width: fit-content` declared in `.ipod-body--playing`. */}
        <div className={`ipod-body mx-auto ${isPlaying ? 'ipod-body--playing' : 'w-full'}`}>
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
                <AnimatePresence mode="wait" custom={slideDirection} initial={false}>
                  <motion.div
                    key={selectedGame}
                    custom={slideDirection}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={slideTransition}
                    className="w-full h-full"
                  >
                    <img
                      src={game.preview}
                      alt={game.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Title overlay rides with the slide */}
                    <div className="absolute top-0 left-0 right-0 ipod-title-overlay pointer-events-none">
                      <h2 className="sr-only">{game.title}</h2>
                      <pre
                        className="ipod-title-glyph text-green-500 font-mono text-[6px] lg:text-[8px] xl:text-[9px] leading-none text-center select-none overflow-hidden mx-auto py-1 lg:py-1.5"
                        aria-hidden="true"
                      >
                        {GAME_TITLES[game.id] || game.title}
                      </pre>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

            </div>
          </div>

          {/* Clickwheel region */}
          <div className={`ipod-clickwheel-region ${isPlaying ? 'mt-2 lg:mt-2' : 'mt-2 lg:mt-3'}`}>
            {/* Game info — hidden during play. Keyed on selectedGame so the
                block re-mounts with its enter animation each game switch,
                settling in sync with the sibling preview-image slide. */}
            {!isPlaying && (
              <motion.div
                key={selectedGame}
                className="text-center mb-2 lg:mb-3"
                initial={infoEnter.initial}
                animate={infoEnter.animate}
                transition={slideTransition}
              >
                {game.category && (
                  <span className="ipod-category-badge mb-1.5">
                    {game.category}
                  </span>
                )}
                <p className="text-green-400 font-mono text-xs lg:text-sm line-clamp-2 px-2">
                  {game.description}
                </p>
              </motion.div>
            )}

            {/* Control surface: clickwheel (static) ↔ dashbar (in-play) */}
            <AnimatePresence mode="wait" initial={false}>
              {isPlaying ? (
                <motion.div
                  key="dashbar"
                  ref={dashbarRefCallback}
                  className="ipod-dashbar"
                  role="toolbar"
                  aria-label="In-game controls"
                  tabIndex={0}
                  onKeyDown={handleWheelKeyDown}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
                  transition={surfaceTransition}
                >
                  <div className="dashbar-section dashbar-section--left">
                    <button
                      ref={(el) => { zoneRefs.current[0] = el; }}
                      className="dashbar-btn"
                      onClick={() => { captureSurfaceFocusIntent('wheel'); playClick(); onExit(); }}
                      tabIndex={-1}
                      aria-label="Exit game"
                    >
                      <LogOut className="dashbar-icon" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="dashbar-section dashbar-section--centre">
                    <button
                      ref={(el) => { zoneRefs.current[4] = el; }}
                      className="dashbar-btn dashbar-centre"
                      onClick={handlePlayPress}
                      tabIndex={-1}
                      aria-label="Stop game"
                    >
                      <Pause className="dashbar-icon dashbar-icon--centre" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="dashbar-section dashbar-section--right">
                    <button
                      ref={(el) => { zoneRefs.current[2] = el; }}
                      className="dashbar-btn"
                      tabIndex={-1}
                      aria-label="View high scores"
                      disabled
                    >
                      <Trophy className="dashbar-icon" aria-hidden="true" />
                    </button>
                    {isMuted && (
                      <div className="dashbar-mute" role="status" aria-label="Audio muted">
                        <VolumeX className="w-3 h-3" aria-hidden="true" />
                        <span>MUTED</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="wheel"
                  ref={wheelRefCallback}
                  className={`ipod-clickwheel${wheelRotation ? ` rotating-${wheelRotation}` : ''}`}
                  role="toolbar"
                  aria-label="Game navigation wheel — swipe left or right to navigate"
                  aria-describedby="ipod-wheel-instructions"
                  tabIndex={0}
                  onKeyDown={handleWheelKeyDown}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                  transition={surfaceTransition}
                >
                  <button
                    ref={(el) => { zoneRefs.current[0] = el; }}
                    className={`clickwheel-zone clickwheel-top${pressedIndex === 0 ? ' is-pressed' : ''}`}
                    onClick={() => { playClick(); onShowInstructions(); }}
                    tabIndex={-1}
                    aria-label="How to play"
                  >
                    <span>MENU</span>
                  </button>

                  <button
                    ref={(el) => { zoneRefs.current[3] = el; }}
                    className={`clickwheel-zone clickwheel-left${pressedIndex === 3 ? ' is-pressed' : ''}`}
                    onClick={() => { playClick(); triggerRotation('left'); onPrev(); }}
                    data-testid="carousel-prev"
                    tabIndex={-1}
                    aria-label="Previous game"
                  >
                    <span>◄◄</span>
                  </button>

                  <button
                    ref={(el) => { zoneRefs.current[1] = el; }}
                    className={`clickwheel-zone clickwheel-right${pressedIndex === 1 ? ' is-pressed' : ''}`}
                    onClick={() => { playClick(); triggerRotation('right'); onNext(); }}
                    data-testid="carousel-next"
                    tabIndex={-1}
                    aria-label="Next game"
                  >
                    <span>►►</span>
                  </button>

                  <button
                    ref={(el) => { zoneRefs.current[2] = el; }}
                    className={`clickwheel-zone clickwheel-bottom${pressedIndex === 2 ? ' is-pressed' : ''}`}
                    onClick={handleScoresPress}
                    tabIndex={-1}
                    aria-label="View high scores"
                  >
                    <span>●</span>
                  </button>

                  <button
                    ref={(el) => { zoneRefs.current[4] = el; }}
                    className={`clickwheel-centre${pressedIndex === 4 ? ' is-pressed' : ''}`}
                    onClick={handlePlayPress}
                    disabled={isPlayDisabled || !hasComponent}
                    tabIndex={-1}
                    aria-label="Play game"
                  >
                    ▶
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Keyboard hints — hidden during play */}
            {!isPlaying && (
              <>
                <span id="ipod-wheel-instructions" className="sr-only">
                  Arrow keys navigate: left and right switch games, up opens how to play, down opens high scores.
                  Enter or Space starts the selected game. Escape exits a running game.
                  Number keys 1 through {Math.min(9, games.length)} jump to that game.
                  Home returns to the first game, End jumps to the last.
                </span>
                <div
                  className="mt-2 text-xs lg:text-sm text-green-400/60 text-center space-y-0.5 font-mono"
                  aria-hidden="true"
                >
                  <p className="text-green-500/70">&larr;&rarr; NAVIGATE &bull; &uarr; MENU &bull; &darr; SCORES &bull; ENTER PLAY &bull; ESC EXIT</p>
                  <p className="text-green-500/50">1-{Math.min(9, games.length)} JUMP &bull; HOME/END &bull; SWIPE WHEEL &bull; I/H/A Keys</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
