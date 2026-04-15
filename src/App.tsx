/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Main application orchestrator for Matrix Arcade. Manages game selection,
 *              navigation, sound system, achievements, and PWA features.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/theme.css';
import './styles/animations.css';
import {
  Monitor,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  Play,
  Disc3,
  Keyboard,
  LucideClipboardSignature,
  Settings,
  Save,
  Crosshair,
  X,
  VolumeX,
  Blocks,
  Footprints,
  ArrowUp,
  Circle,
  Music,
  Cloud,
  Zap,
  BookOpen,
  Trophy,
} from 'lucide-react';
// Lazy-loaded game components for code-splitting
const SimpleSnake = React.lazy(() => import('./components/games/phaser/SnakeClassic'));
const VortexPong = React.lazy(() => import('./components/games/phaser/VortexPong'));
const CtrlSWorld = React.lazy(() => import('./components/games/phaser/CtrlSWorld'));
const MatrixCloud = React.lazy(() => import('./components/games/phaser/MatrixCloud'));
const MatrixInvaders = React.lazy(() => import('./components/games/phaser/MatrixInvaders'));
const Metris = React.lazy(() => import('./components/games/phaser/Metris'));
const MatrixFrogger = React.lazy(() => import('./components/games/phaser/MatrixFrogger'));
const NeoJump = React.lazy(() => import('./components/games/phaser/NeoJump'));
const AgentChase = React.lazy(() => import('./components/games/phaser/AgentChase'));
const RhythmHacker = React.lazy(() => import('./components/games/phaser/RhythmHacker'));
const CloudJumper = React.lazy(() => import('./components/games/phaser/CloudJumper'));
const CodeBreaker = React.lazy(() => import('./components/games/phaser/CodeBreaker'));
import AudioSettings from './components/ui/AudioSettings';
import SaveLoadManager from './components/ui/SaveLoadManager';
import { AchievementQueue } from './components/ui/AchievementNotification';
import { AchievementDisplay } from './components/ui/AchievementDisplay';
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt';
import { PWAUpdatePrompt } from './components/ui/PWAUpdatePrompt';
import { MobileWarning } from './components/ui/MobileWarning';
import { GameErrorBoundary } from './components/ui/GameErrorBoundary';
import { GameInstructions } from './components/ui/GameInstructions';
import { GameHighScores } from './components/ui/GameHighScores';
import { MatrixRainCanvas } from './components/ui/MatrixRainCanvas';
import { useSoundSystem } from './hooks/useSoundSystem';
import { useAchievementManager } from './hooks/useAchievementManager';
import { useMobileDetection } from './hooks/useMobileDetection';
import { useSaveSystem } from './hooks/useSaveSystem';
import { GameStateProvider } from './contexts/GameStateContext';
import About from './components/About';
import { Scoreboard } from './components/scoreboard/Scoreboard';
import { AttractMode } from './components/scoreboard/AttractMode';
import LandingPage from './components/LandingPage';
import { GAME_REGISTRY } from './data/gameRegistry';
import { GAME_TITLES } from './lib/asciiArt';

function App() {
  const [selectedGame, setSelectedGame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showHighScores, setShowHighScores] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<
    'left' | 'right'
  >('right');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize sound system and achievement manager
  const { config: soundConfig, updateConfig: updateSoundConfig, playSFX, playBackgroundMP3, stopBackgroundMP3, toggleMute, isMuted } = useSoundSystem();
  const achievementManager = useAchievementManager();
  const { saveData, updateGlobalStats, clearBoard } = useSaveSystem();
  const [showScoreboard, setShowScoreboard] = useState(false);

  // Mobile detection
  const { isMobile, isTablet } = useMobileDetection();
  const showMobileWarning = isMobile || isTablet;

  // Track global achievements
  const gamesPlayed = useRef(new Set<string>());
  const playStartTime = useRef<number | null>(null);
  const totalPlayTime = useRef(0);
  const nightOwlCheckedRef = useRef(false);
  const dedicatedCheckedRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mp3TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Runtime bindings keyed by game ID — prevents silent mismatch if registry order changes.
  // Memoised so `games` is referentially stable across renders.
  const games = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bindings: Record<string, { component: React.ComponentType<any>; icon: React.ReactNode }> = {
      'ctrl-s-world':    { component: CtrlSWorld,         icon: <Keyboard className="w-8 h-8" /> },
      'snake-classic':   { component: SimpleSnake,    icon: <Gamepad2 className="w-8 h-8" /> },
      'vortex-pong':     { component: VortexPong,     icon: <Disc3 className="w-8 h-8" /> },
      'matrix-cloud':    { component: MatrixCloud,    icon: <Gamepad2 className="w-8 h-8" /> },
      'matrix-invaders': { component: MatrixInvaders, icon: <Crosshair className="w-8 h-8" /> },
      'metris':          { component: Metris,         icon: <Blocks className="w-8 h-8" /> },
      'matrix-frogger':  { component: MatrixFrogger,  icon: <Footprints className="w-8 h-8" /> },
      'neo-jump':        { component: NeoJump,        icon: <ArrowUp className="w-8 h-8" /> },
      'agent-chase':     { component: AgentChase,     icon: <Circle className="w-8 h-8" /> },
      'rhythm-hacker':   { component: RhythmHacker,   icon: <Music className="w-8 h-8" /> },
      'cloud-jumper':    { component: CloudJumper,    icon: <Cloud className="w-8 h-8" /> },
      'code-breaker':    { component: CodeBreaker,    icon: <Zap className="w-8 h-8" /> },
    };
    return GAME_REGISTRY.map(entry => ({ ...entry, ...bindings[entry.id] }));
  }, []);

  /**
   * Check for Night Owl achievement (playing between midnight and 5am)
   */
  const checkNightOwlAchievement = useCallback(() => {
    if (nightOwlCheckedRef.current) return;

    const currentHour = new Date().getHours();
    // Night owl: play between midnight (0) and 5am (5)
    if (currentHour >= 0 && currentHour < 5) {
      const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];
      if (!currentGlobalAchievements.includes('global_night_owl')) {
        nightOwlCheckedRef.current = true;
        achievementManager.updateGlobalStats({
          globalAchievements: [...currentGlobalAchievements, 'global_night_owl']
        });
      }
    }
  }, [achievementManager]);

  /**
   * Check for Dedicated Player achievement (play 7 days in a row)
   * Uses useSaveSystem globalStats.playDates for persistence
   */
  const checkDedicatedAchievement = useCallback(() => {
    if (dedicatedCheckedRef.current) return;

    const today = new Date().toDateString();
    let playDates: string[] = [...(saveData.globalStats.playDates || [])];

    // Add today if not already in list
    if (!playDates.includes(today)) {
      playDates.push(today);
      // Only keep last 7 days
      if (playDates.length > 7) {
        playDates = playDates.slice(-7);
      }
      // Persist via save system
      updateGlobalStats({ playDates });
    }

    // Check if played 7 consecutive days
    if (playDates.length >= 7) {
      // Verify they are consecutive
      const dates = playDates.map(d => new Date(d).getTime()).sort((a, b) => a - b);
      let consecutive = true;
      for (let i = 1; i < dates.length; i++) {
        const dayDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
        if (dayDiff > 1) {
          consecutive = false;
          break;
        }
      }

      if (consecutive) {
        const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];
        if (!currentGlobalAchievements.includes('global_dedicated')) {
          dedicatedCheckedRef.current = true;
          achievementManager.updateGlobalStats({
            globalAchievements: [...currentGlobalAchievements, 'global_dedicated']
          });
        }
      }
    }
  }, [achievementManager, saveData.globalStats.playDates, updateGlobalStats]);

  /**
   * Track play time and check for marathon gamer achievement
   * Extracted to avoid duplication in ESC handler, exit button, and play button
   */
  const trackPlayTime = useCallback(() => {
    if (playStartTime.current) {
      totalPlayTime.current += (Date.now() - playStartTime.current) / 1000 / 60; // in minutes
      playStartTime.current = null;

      // Marathon gamer achievement (60 minutes total)
      if (totalPlayTime.current >= 60) {
        const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];
        if (!currentGlobalAchievements.includes('global_marathon_gamer')) {
          achievementManager.updateGlobalStats({
            globalAchievements: [...currentGlobalAchievements, 'global_marathon_gamer']
          });
        }
      }
    }
  }, [achievementManager]);

  /**
   * @listens achievementManager.stats.unlocked, achievementManager
   * Tracks achievement milestones for 10, 25, and 50 unlocked achievements
   */
  useEffect(() => {
    const totalUnlocked = achievementManager.stats.unlocked;
    const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];
    
    if (totalUnlocked >= 10 && !currentGlobalAchievements.includes('global_10_achievements')) {
      achievementManager.updateGlobalStats({
        globalAchievements: [...currentGlobalAchievements, 'global_10_achievements']
      });
    }
    
    if (totalUnlocked >= 25 && !currentGlobalAchievements.includes('global_25_achievements')) {
      achievementManager.updateGlobalStats({
        globalAchievements: [...currentGlobalAchievements, 'global_25_achievements']
      });
    }
    
    if (totalUnlocked >= 50 && !currentGlobalAchievements.includes('global_50_achievements')) {
      achievementManager.updateGlobalStats({
        globalAchievements: [...currentGlobalAchievements, 'global_50_achievements']
      });
    }
  }, [achievementManager.stats.unlocked, achievementManager]);

  /**
   * Track when a game is played and check for "play all games" achievement
   */
  useEffect(() => {
    if (selectedGame !== null && selectedGame < games.length) {
      const gameName = games[selectedGame].title;

      if (!gamesPlayed.current.has(gameName)) {
        gamesPlayed.current.add(gameName);

        // Check if all games have been played - uses dynamic games.length
        const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];
        if (gamesPlayed.current.size === games.length && !currentGlobalAchievements.includes('global_all_games')) {
          achievementManager.updateGlobalStats({
            globalAchievements: [...currentGlobalAchievements, 'global_all_games']
          });
        }
      }
    }
  }, [selectedGame, achievementManager, games]);

  /**
   * Track cross-game statistics and achievements
   */
  useEffect(() => {
    const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];

    // Calculate total score across all games
    const totalScore = Object.values(saveData.games || {}).reduce((sum, game) => sum + ((game as { highScore?: number }).highScore || 0), 0);

    // Total Score achievements
    if (totalScore >= 10000 && !currentGlobalAchievements.includes('global_score_10k')) {
      achievementManager.updateGlobalStats({
        globalAchievements: [...currentGlobalAchievements, 'global_score_10k']
      });
    }

    if (totalScore >= 50000 && !currentGlobalAchievements.includes('global_score_50k')) {
      achievementManager.updateGlobalStats({
        globalAchievements: [...currentGlobalAchievements, 'global_score_50k']
      });
    }

    if (totalScore >= 100000 && !currentGlobalAchievements.includes('global_score_100k')) {
      achievementManager.updateGlobalStats({
        globalAchievements: [...currentGlobalAchievements, 'global_score_100k']
      });
    }

    // Total games played achievement
    const totalGamesPlayed = Object.values(saveData.games || {}).reduce((sum, game) => sum + ((game as { stats?: { gamesPlayed?: number } }).stats?.gamesPlayed || 0), 0);

    if (totalGamesPlayed >= 100 && !currentGlobalAchievements.includes('global_100_plays')) {
      achievementManager.updateGlobalStats({
        globalAchievements: [...currentGlobalAchievements, 'global_100_plays']
      });
    }
  }, [saveData, achievementManager]);


  /**
   * @listens isPlaying - Prevents page scrolling during active gameplay
   *                       whilst allowing input in text fields
   */
  useEffect(() => {
    const preventDefault = (e: Event) => {
      if (!isPlaying) return;
      // When a Phaser game is mounted, never block keyboard events —
      // Phaser targets `window` so event.target is often document.body,
      // not the canvas or game container.
      if (e.type === 'keydown' && document.querySelector('[data-phaser-game]')) return;
      const target = e.target as HTMLElement;
      const isPhaserGame = typeof target?.closest === 'function' && target.closest('[data-phaser-game]');
      if (
        !isPhaserGame &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        target.tagName !== 'CANVAS'
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', preventDefault, false);
    window.addEventListener('wheel', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      window.removeEventListener('keydown', preventDefault);
      window.removeEventListener('wheel', preventDefault);
      window.removeEventListener('touchmove', preventDefault);
    };
  }, [isPlaying]);

  /**
   * Handles game selection with transition animation
   * @param {number} index - Game index to select from games array
   */
  const selectGame = useCallback((index: number) => {
    const direction = index > selectedGame ? 'right' : 'left';
    setTransitionDirection(direction);
    setIsTransitioning(true);
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => setIsTransitioning(false), 600);
    setShowNav(false);
    setShowInstructions(false);
    setShowHighScores(false);
    setSelectedGame(index);
    setIsPlaying(false);
    playSFX('menu');
  }, [selectedGame, playSFX]);

  const handlePrevious = useCallback(() => {
    selectGame(selectedGame === 0 ? games.length - 1 : selectedGame - 1);
  }, [selectedGame, selectGame, games.length]);

  const handleNext = useCallback(() => {
    selectGame(selectedGame === games.length - 1 ? 0 : selectedGame + 1);
  }, [selectedGame, selectGame, games.length]);

  /**
   * @listens isPlaying, achievementManager, playSFX, showMobileWarning, playBackgroundMP3, handlePrevious, handleNext, toggleMute
   * Global keyboard shortcuts: ESC (exit), Arrow keys (navigate), Enter (play), A (achievements), V (mute)
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Achievement display shortcut (A key)
      if (e.key.toLowerCase() === 'a' && !isPlaying && 
          e.target instanceof HTMLElement &&
          e.target.tagName !== 'INPUT' && 
          e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        achievementManager.toggleDisplay();
      }
      
      // ESC key to exit games — resume landing BGM
      if (e.key === 'Escape' && isPlaying) {
        e.preventDefault();
        setIsPlaying(false);
        playSFX('menu');
        trackPlayTime();
        playBackgroundMP3('/matrixarcaderetrobeat.mp3');
      }
      
      // Arrow keys for game navigation (when not playing)
      if (!isPlaying && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') {
          handlePrevious();
        } else {
          handleNext();
        }
      }
      
      // Enter key to start game
      if (!isPlaying && e.key === 'Enter' && !showMobileWarning) {
        e.preventDefault();
        setIsPlaying(true);
        playSFX('score');
        if (mp3TimerRef.current) clearTimeout(mp3TimerRef.current);
        stopBackgroundMP3();

        // Track game played and check achievements (same as button click)
        const gameName = games[selectedGame].title;
        gamesPlayed.current.add(gameName);
        playStartTime.current = Date.now();
        checkNightOwlAchievement();
        checkDedicatedAchievement();

        // First game achievement
        if (gamesPlayed.current.size === 1) {
          const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];
          if (!currentGlobalAchievements.includes('global_first_game')) {
            achievementManager.updateGlobalStats({
              globalAchievements: [...currentGlobalAchievements, 'global_first_game']
            });
          }
        }
      }
      
      // V key to toggle mute
      if (e.key.toLowerCase() === 'v' && !isPlaying &&
          e.target instanceof HTMLElement &&
          e.target.tagName !== 'INPUT' &&
          e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleMute();
      }

      // I key for instructions
      if (e.key.toLowerCase() === 'i' && !isPlaying &&
          e.target instanceof HTMLElement &&
          e.target.tagName !== 'INPUT' &&
          e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowInstructions(prev => !prev);
        setShowHighScores(false);
      }

      // H key for high scores
      if (e.key.toLowerCase() === 'h' && !isPlaying &&
          e.target instanceof HTMLElement &&
          e.target.tagName !== 'INPUT' &&
          e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowHighScores(prev => !prev);
        setShowInstructions(false);
      }

      // B key for about page
      if (e.key.toLowerCase() === 'b' && !isPlaying &&
          e.target instanceof HTMLElement &&
          e.target.tagName !== 'INPUT' &&
          e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowAbout(prev => !prev);
      }

      // ESC also closes modals
      if (e.key === 'Escape' && !isPlaying) {
        if (showInstructions) { setShowInstructions(false); e.preventDefault(); }
        if (showHighScores) { setShowHighScores(false); e.preventDefault(); }
        if (showAbout) { setShowAbout(false); e.preventDefault(); }
        if (showScoreboard) { setShowScoreboard(false); e.preventDefault(); }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, achievementManager, playSFX, showMobileWarning, playBackgroundMP3, stopBackgroundMP3, handlePrevious, handleNext, toggleMute, trackPlayTime, checkNightOwlAchievement, checkDedicatedAchievement, selectedGame, showInstructions, showHighScores, showAbout, showScoreboard, games]);

  const GameComponent = games[selectedGame].component;

  // E2E ready markers — let Playwright wait on these instead of arbitrary settle delays.
  useEffect(() => {
    document.body.dataset.portalReady = (!showLandingPage).toString();
  }, [showLandingPage]);
  useEffect(() => {
    document.body.dataset.portalGameId = games[selectedGame]?.id ?? '';
    document.body.dataset.portalIsPlaying = isPlaying.toString();
  }, [selectedGame, isPlaying, games]);

  return (
    <GameStateProvider>
      {/* Mobile Warning */}
      {showMobileWarning && <MobileWarning />}
      
      <MatrixRainCanvas />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-green-500 focus:text-black focus:font-mono focus:rounded"
      >
        Skip to content
      </a>
      <div className="h-screen flex flex-col bg-black text-green-500 overflow-hidden crt-effect relative z-10">
      {/* Header */}
      <header
        className="relative border-b border-green-500/50 p-2 lg:p-3 overflow-hidden backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Monitor className="w-8 h-8 relative z-10" />
              <div className="absolute inset-0 bg-green-500/20 rounded-full filter blur-sm animate-pulse"></div>
            </div>
            <div>
            <a
              href="https://the-matrix-arcade.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors group"
            >
              <h1 className="text-xl lg:text-2xl font-bold tracking-wider group-hover:text-green-400 transition-colors phosphor-glow" style={{ fontFamily: 'var(--matrix-font-title)' }}>
                THE MATRIX ARCADE
              </h1>
              <p className="text-xs text-green-400 tracking-widest hidden sm:block">
                SYSTEM v2.0
              </p>
            </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="p-2 bg-green-900/50 rounded hover:bg-green-800 transition-colors border border-green-500/30 backdrop-blur-sm"
              title="About (B)"
              aria-label="About"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowScoreboard(!showScoreboard)}
              className="p-2 bg-green-900/50 rounded hover:bg-green-800 transition-colors border border-green-500/30 backdrop-blur-sm"
              title="High Scores"
              aria-label="High Scores"
            >
              <Trophy className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSaveManager(!showSaveManager)}
              className="p-2 bg-green-900/50 rounded hover:bg-green-800 transition-colors border border-green-500/30 backdrop-blur-sm"
              title="Save Data Manager"
              aria-label="Save Data Manager"
            >
              <Save className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowAudioSettings(!showAudioSettings)}
              className={`p-2 rounded transition-colors border backdrop-blur-sm ${
                isMuted
                  ? 'bg-red-900/50 hover:bg-red-800 border-red-500/30'
                  : 'bg-green-900/50 hover:bg-green-800 border-green-500/30'
              }`}
              title="Audio Settings (V to mute)"
              aria-label="Audio Settings"
            >
              <Settings className={`w-5 h-5 ${isMuted ? 'text-red-400' : ''}`} />
            </button>
            <button
              onClick={() => setShowLandingPage(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-900/50 rounded hover:bg-green-800 transition-colors border border-green-500/30 backdrop-blur-sm group"
              title="View all games"
              aria-label="View all games"
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Arcade</span>
            </button>
            <button
              onClick={() => setShowNav(!showNav)}
              aria-expanded={showNav}
              aria-controls="game-nav"
              className="flex items-center gap-2 px-4 py-2 bg-green-900/50 rounded hover:bg-green-800 transition-colors border border-green-500/30 backdrop-blur-sm group"
            >
              Games
            </button>
          </div>
        </div>
      </header>

      {/* Side Nav */}
      {showNav && (
        <nav
          id="game-nav"
          className="absolute left-0 top-0 h-full w-64 bg-black/90 border-r border-green-500/50 z-50 backdrop-blur-sm overflow-y-auto"
          style={{ paddingTop: '5rem' }} // offset from header
          role="navigation"
          aria-label="Game selection"
        >
          <div className="flex flex-col gap-1 p-4">
            {(() => {
              const categories = [...new Set(games.map(g => g.category || 'Arcade'))];
              return categories.map(cat => (
                <div key={cat}>
                  <div className="text-green-500/50 text-xs font-mono uppercase tracking-wider px-3 pt-3 pb-1">
                    {cat}
                  </div>
                  {games.map((game, index) => (
                    (game.category || 'Arcade') === cat && (
                      <button
                        key={index}
                        onClick={() => selectGame(index)}
                        className="w-full flex items-center gap-2 p-2 pl-3 hover:bg-green-900/50 transition-colors text-left text-sm"
                      >
                        {game.icon}
                        <span>{game.title}</span>
                      </button>
                    )
                  ))}
                </div>
              ));
            })()}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div aria-live="polite" className="sr-only">
        {isMuted ? 'Audio muted' : 'Audio unmuted'}
      </div>
      <main id="main-content" className="flex-1 overflow-hidden flex items-center justify-center p-2 lg:p-4">
        {/* Fullscreen Game View */}
        {isPlaying && GameComponent ? (
          <div className="relative w-full h-full">
            <GameErrorBoundary gameName={games[selectedGame].title} onReset={() => setIsPlaying(false)}>
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-black text-green-500 font-mono">Loading...</div>}>
                <GameComponent achievementManager={achievementManager} isMuted={isMuted} autoStart={false} onExit={() => { setIsPlaying(false); playSFX('menu'); trackPlayTime(); playBackgroundMP3('/matrixarcaderetrobeat.mp3'); }} />
              </Suspense>
            </GameErrorBoundary>

            {/* Floating Mute Indicator - More Visible */}
            {isMuted && (
              <div className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-red-600/90 border-2 border-red-400 rounded-lg animate-pulse-red pointer-events-none shadow-lg shadow-red-500/50">
                <VolumeX className="w-5 h-5 text-white" />
                <span className="text-white font-mono text-sm font-bold">MUTED</span>
              </div>
            )}

            {/* Floating Exit Button */}
            <button
              onClick={() => {
                setIsPlaying(false);
                playSFX('menu');
                trackPlayTime();
                playBackgroundMP3('/matrixarcaderetrobeat.mp3');
              }}
              className="absolute top-4 right-4 z-50 p-3 bg-red-900/90 hover:bg-red-700 rounded-lg border-2 border-red-500/80 backdrop-blur-sm transition-all group shadow-lg hover:shadow-red-500/50 hover:scale-110"
              title="Exit Game (ESC)"
              aria-label="Exit Game"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              <span className="absolute -bottom-6 right-0 text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">ESC</span>
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-2xl mx-auto flex flex-col justify-center h-full game-portal-container px-4">
          {/* Digital Transformation Container */}
          <div
            ref={containerRef}
            className={`
              digital-container game-portal-wrapper
              ${isTransitioning ? `transition-${transitionDirection}` : ''}
            `}
          >
            {/* Game Portal */}
            <div className="relative bg-gray-900 rounded-xl p-3 lg:p-4 border border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.3)] w-full mx-auto">
                {/* Game Display */}
                <div className="relative aspect-[16/9] mb-2 lg:mb-3 rounded-lg overflow-hidden border border-green-500">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedGame}
                      className="w-full h-full transition-enhanced"
                    >
                      {isPlaying && GameComponent ? (
                        <GameErrorBoundary gameName={games[selectedGame].title} onReset={() => setIsPlaying(false)}>
                          <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-black text-green-500 font-mono">Loading...</div>}>
                            <GameComponent achievementManager={achievementManager} isMuted={isMuted} autoStart={false} onExit={() => { setIsPlaying(false); playSFX('menu'); trackPlayTime(); playBackgroundMP3('/matrixarcaderetrobeat.mp3'); }} />
                          </Suspense>
                        </GameErrorBoundary>
                      ) : (
                        <img
                          src={games[selectedGame].preview}
                          alt={games[selectedGame].title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <div className="game-controls-enhanced">
                  <button
                    data-testid="carousel-prev"
                    onClick={handlePrevious}
                    className="p-1.5 lg:p-2 border border-green-500/30 bg-green-500/5 hover:bg-green-900 hover:border-green-500/60 rounded-full transition-colors transform hover:scale-110"
                    title="Previous game"
                    aria-label="Previous game"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="flex-1 text-center">
                    <div className="mb-2">
                      <h2 className="sr-only">{games[selectedGame].title}</h2>
                      <pre
                        className="text-green-500 font-mono text-[7px] lg:text-[9px] xl:text-[10px] leading-none text-center select-none overflow-hidden mx-auto"
                        aria-hidden="true"
                        style={{ textShadow: '0 0 8px rgba(0,255,0,0.6), 0 0 20px rgba(0,255,0,0.15)' }}
                      >
                        {GAME_TITLES[games[selectedGame].id] || games[selectedGame].title}
                      </pre>
                    </div>
                    {games[selectedGame].category && (
                      <span className="inline-block text-green-500/60 font-mono text-xs border border-green-500/30 px-2 py-0.5 rounded-full mb-2">
                        {games[selectedGame].category}
                      </span>
                    )}
                    <p className="text-green-400 font-mono text-xs lg:text-sm mb-3 lg:mb-4">
                      {games[selectedGame].description}
                    </p>
                    {typeof GameComponent !== 'undefined' && (
                      <button
                        onClick={() => {
                          // Don't allow playing on mobile
                          if (showMobileWarning) return;

                          setIsPlaying(!isPlaying);
                          playSFX(isPlaying ? 'menu' : 'score');
                          if (!isPlaying) {
                            if (mp3TimerRef.current) clearTimeout(mp3TimerRef.current);
                            stopBackgroundMP3();

                            // Track game played
                            const gameName = games[selectedGame].title;
                            gamesPlayed.current.add(gameName);
                            playStartTime.current = Date.now();

                            // Check time-based global achievements
                            checkNightOwlAchievement();
                            checkDedicatedAchievement();

                            // Check global achievements
                            if (gamesPlayed.current.size === 1) {
                              // First game achievement
                              const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];
                              if (!currentGlobalAchievements.includes('global_first_game')) {
                                achievementManager.updateGlobalStats({
                                  globalAchievements: [...currentGlobalAchievements, 'global_first_game']
                                });
                              }
                            }

                            if (gamesPlayed.current.size === games.length) {
                              // All games played achievement
                              const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];
                              if (!currentGlobalAchievements.includes('global_all_games')) {
                                achievementManager.updateGlobalStats({
                                  globalAchievements: [...currentGlobalAchievements, 'global_all_games']
                                });
                              }
                            }
                          } else {
                            trackPlayTime();
                          }
                        }}
                        className="px-4 py-2 lg:px-6 lg:py-2.5 bg-green-500 text-black font-mono rounded-full hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto transform hover:scale-105 text-sm lg:text-base font-bold"
                        aria-label={isPlaying ? 'Stop game' : 'Play game'}
                      >
                        <Play className="w-4 h-4" />
                        {isPlaying ? 'STOP' : 'PLAY'}
                      </button>
                    )}
                  </div>

                  <button
                    data-testid="carousel-next"
                    onClick={handleNext}
                    className="p-1.5 lg:p-2 border border-green-500/30 bg-green-500/5 hover:bg-green-900 hover:border-green-500/60 rounded-full transition-colors transform hover:scale-110"
                    title="Next game"
                    aria-label="Next game"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Instructions & High Scores Buttons */}
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    onClick={() => { setShowInstructions(true); setShowHighScores(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/60 rounded-lg transition-colors font-mono text-xs text-green-400 hover:text-green-300"
                    aria-label="View instructions"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    HOW TO PLAY
                  </button>
                  <button
                    onClick={() => { setShowHighScores(true); setShowInstructions(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/60 rounded-lg transition-colors font-mono text-xs text-green-400 hover:text-green-300"
                    aria-label="View high scores"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    HIGH SCORE
                  </button>
                </div>

                {/* Keyboard Hints */}
                <div className="mt-3 text-xs lg:text-sm text-green-400/60 text-center space-y-1 font-mono">
                  <p className="text-green-500/70">← → NAVIGATE • ENTER PLAY • ESC EXIT</p>
                  <p className="text-green-500/50">I Instructions • H Scores • A Achievements • B About • V Mute</p>
                </div>
              </div>
          </div>
        </div>
        )}
      </main>

      {/* Enhanced Footer */}
      <footer
        className="relative border-t border-green-500/50 p-2 lg:p-3 overflow-hidden backdrop-blur-sm bottom-0 w-full"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="font-mono text-xs lg:text-sm flex items-center gap-2 lg:gap-4">
            <p className="tracking-wider hidden lg:block">THE MATRIX ARCADE v2.0</p>
            <div className="h-4 w-px bg-green-500/30 hidden lg:block"></div>
            <p className="text-green-400">TAKE THE RED PILL!</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://thomasjbutler.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors group"
            >
              <span>BY THOMAS J BUTLER</span>
              <LucideClipboardSignature className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </a>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Landing Page */}
      <AnimatePresence>
        {showLandingPage && (
          <LandingPage
            onSelectGame={(index) => {
              setSelectedGame(index);
              setShowLandingPage(false);
            }}
            onClose={() => setShowLandingPage(false)}
            onShowScoreboard={() => setShowScoreboard(true)}
          />
        )}
      </AnimatePresence>

      {/* Game Instructions Modal */}
      <GameInstructions
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        game={GAME_REGISTRY[selectedGame]}
        icon={games[selectedGame].icon}
      />

      {/* Game High Scores Modal */}
      <GameHighScores
        isOpen={showHighScores}
        onClose={() => setShowHighScores(false)}
        game={GAME_REGISTRY[selectedGame]}
        icon={games[selectedGame].icon}
        saveData={saveData}
        achievements={achievementManager.achievements}
      />

      {/* Audio Settings Modal */}
      <AudioSettings
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
        isMuted={isMuted}
        toggleMute={toggleMute}
        soundConfig={soundConfig}
        onUpdateConfig={updateSoundConfig}
        onPlaySFX={playSFX}
        onPlayBackgroundMP3={playBackgroundMP3}
        onStopBackgroundMP3={stopBackgroundMP3}
      />
      
      {/* Save/Load Manager Modal */}
      <SaveLoadManager
        isOpen={showSaveManager}
        onClose={() => setShowSaveManager(false)}
      />

      {/* About Page */}
      <About isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {/* Global Scoreboard */}
      <Scoreboard
        isOpen={showScoreboard}
        onClose={() => setShowScoreboard(false)}
        scoreboards={saveData.scoreboards}
        lastInitials={saveData.lastInitials}
        onClearBoard={clearBoard}
        playSound={playSFX}
      />
      
      {/* Attract Mode — idle scoreboard cycle on landing page */}
      <AttractMode
        scoreboards={saveData.scoreboards}
        lastInitials={saveData.lastInitials}
        enabled={showLandingPage && !isPlaying && !showScoreboard}
      />

      {/* Achievement System */}
      <AchievementQueue 
        achievements={achievementManager.notificationQueue}
        onDismiss={achievementManager.dismissNotification}
      />
      
      <AchievementDisplay
        isOpen={achievementManager.isDisplayOpen}
        onClose={achievementManager.closeDisplay}
        achievements={achievementManager.achievements}
      />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* PWA Update Prompt */}
      <PWAUpdatePrompt />

      <style>{`

        
        .perspective {
          perspective: 2000px;
          perspective-origin: 50% 50%;
        }

        .digital-container {
          position: relative;
          transform-style: preserve-3d;
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* Removed conflicting game-container styles that were causing nesting issues */
      `}</style>
    </div>
    </GameStateProvider>
  );
}

export default App;
