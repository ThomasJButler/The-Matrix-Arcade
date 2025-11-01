/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Main application orchestrator for Matrix Arcade. Manages game selection,
 *              navigation, sound system, achievements, and PWA features.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Volume2,
  VolumeX,
  Blocks,
} from 'lucide-react';
import SimpleSnake from './components/games/SimpleSnake';
import VortexPong from './components/games/VortexPong';
import CtrlSWorld from './components/games/CtrlSWorld';
import MatrixCloud from './components/games/MatrixCloud';
import MatrixInvaders from './components/games/MatrixInvaders';
import Metris from './components/games/Metris';
import AudioSettings from './components/ui/AudioSettings';
import SaveLoadManager from './components/ui/SaveLoadManager';
import { AchievementQueue } from './components/ui/AchievementNotification';
import { AchievementDisplay } from './components/ui/AchievementDisplay';
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt';
import { PWAUpdatePrompt } from './components/ui/PWAUpdatePrompt';
import { MobileWarning } from './components/ui/MobileWarning';
import { useSoundSystem } from './hooks/useSoundSystem';
import { useAchievementManager } from './hooks/useAchievementManager';
import { useMobileDetection } from './hooks/useMobileDetection';
import { useSaveSystem } from './hooks/useSaveSystem';
import { GameStateProvider } from './contexts/GameStateContext';
import matrixInvadersPreview from './images/matrixinvaders.webp';
import metrisPreview from './images/metris.webp';

function App() {
  const [selectedGame, setSelectedGame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<
    'left' | 'right'
  >('right');
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  
  // Initialize sound system and achievement manager
  const { playSFX, playMusic, stopMusic, playBackgroundMP3, stopBackgroundMP3, toggleMute, isMuted, config: soundConfig, updateConfig } = useSoundSystem();
  const achievementManager = useAchievementManager();
  const { saveData } = useSaveSystem();

  // Mobile detection
  const { isMobile, isTablet } = useMobileDetection();
  const showMobileWarning = isMobile || isTablet;

  // Track global achievements
  const gamesPlayed = useRef(new Set<string>());
  const playStartTime = useRef<number | null>(null);
  const totalPlayTime = useRef(0);
  const appStartTime = useRef(Date.now());

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
    if (selectedGame !== null) {
      const gameNames = ['CTRL-S | The World', 'Snake Classic', 'Vortex Pong', 'Matrix Cloud', 'Matrix Invaders', 'Metris'];
      const gameName = gameNames[selectedGame] || '';

      if (!gamesPlayed.current.has(gameName)) {
        gamesPlayed.current.add(gameName);

        // Check if all games have been played
        const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];
        if (gamesPlayed.current.size === 6 && !currentGlobalAchievements.includes('global_all_games')) {
          achievementManager.updateGlobalStats({
            globalAchievements: [...currentGlobalAchievements, 'global_all_games']
          });
        }
      }
    }
  }, [selectedGame, achievementManager]);

  /**
   * Track cross-game statistics and achievements
   */
  useEffect(() => {
    const currentGlobalAchievements = achievementManager.getSaveData()?.globalStats.globalAchievements || [];

    // Calculate total score across all games
    const totalScore = Object.values(saveData.games || {}).reduce((sum, game: any) => sum + (game.highScore || 0), 0);

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
    const totalGamesPlayed = Object.values(saveData.games || {}).reduce((sum, game: any) => sum + (game.stats?.gamesPlayed || 0), 0);

    if (totalGamesPlayed >= 100 && !currentGlobalAchievements.includes('global_100_plays')) {
      achievementManager.updateGlobalStats({
        globalAchievements: [...currentGlobalAchievements, 'global_100_plays']
      });
    }
  }, [saveData, achievementManager]);

  const games = [
    {
      title: 'CTRL-S | The World',
      icon: <Keyboard className="w-8 h-8" />,
      description: 'A hilarious text adventure about saving the digital world',
      preview:
        'https://res.cloudinary.com/depqttzlt/image/upload/v1737071600/ctrlsthegame_m1tg5l.png',
      component: CtrlSWorld,
    },
    {
      title: 'Snake Classic',
      icon: <Gamepad2 className="w-8 h-8" />,
      description: 'Navigate through the matrix collecting data fragments',
      preview:
        'https://res.cloudinary.com/depqttzlt/image/upload/v1737071599/matrixsnake2_jw29w1.png',
      component: SimpleSnake,
    },
    {
      title: 'Vortex Pong',
      icon: <Disc3 className="w-8 h-8" />,
      description: 'Battle the AI in a hypnotic 3D arena',
      preview:
        'https://res.cloudinary.com/depqttzlt/image/upload/v1737071596/vortexpong2_hkjn4k.png',
      component: VortexPong,
    },
    {
      title: 'Matrix Cloud',
      icon: <Gamepad2 className="w-8 h-8" />,
      description: 'Navigate through the digital storm',
      preview:
        'https://res.cloudinary.com/depqttzlt/image/upload/v1737071594/matrixcloud_rw8hsa.png',
      component: MatrixCloud,
    },
    {
      title: 'Matrix Invaders',
      icon: <Crosshair className="w-8 h-8" />,
      description: 'Defend against the code invasion',
      preview: matrixInvadersPreview,
      component: MatrixInvaders,
    },
    {
      title: 'Metris',
      icon: <Blocks className="w-8 h-8" />,
      description: 'Stack the code blocks and break the Matrix',
      preview: metrisPreview,
      component: Metris,
    },
  ];

  /**
   * @constructs - Initialises Matrix rain effect using RequestAnimationFrame
   *               Limited to 30 FPS for performance optimisation
   */
  useEffect(() => {
    const createMatrixRain = (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const parent = canvas.parentElement;
      if (!parent) return null;

      // Set canvas size
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;

      const chars =
        'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
      const fontSize = 14;
      const columns = Math.floor(canvas.width / fontSize);
      const drops: number[] = Array(columns).fill(1);

      let animationId: number;
      let lastTime = 0;

      const draw = (timestamp: number) => {
        // Throttle to 30 FPS to reduce CPU usage
        if (timestamp - lastTime < 33) {
          animationId = requestAnimationFrame(draw);
          return;
        }
        lastTime = timestamp;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0F0';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(char, i * fontSize, drops[i] * fontSize);
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }

        animationId = requestAnimationFrame(draw);
      };

      animationId = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(animationId);
    };

    // Create canvases for header and footer
    let headerCleanup: (() => void) | null = null;
    let footerCleanup: (() => void) | null = null;

    if (headerRef.current) {
      const canvas = headerRef.current.querySelector('canvas.matrix-rain');
      if (canvas instanceof HTMLCanvasElement) {
        headerCleanup = createMatrixRain(canvas);
      }
    }

    if (footerRef.current) {
      const canvas = footerRef.current.querySelector('canvas.matrix-rain');
      if (canvas instanceof HTMLCanvasElement) {
        footerCleanup = createMatrixRain(canvas);
      }
    }

    return () => {
      if (headerCleanup) headerCleanup();
      if (footerCleanup) footerCleanup();
    };
  }, []);

  /**
   * @listens isPlaying - Prevents page scrolling during active gameplay
   *                       whilst allowing input in text fields
   */
  useEffect(() => {
    const preventDefault = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        isPlaying &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA'
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
    setTimeout(() => setIsTransitioning(false), 600);
    setShowNav(false);
    setSelectedGame(index);
    setIsPlaying(false);
    playSFX('menu');
  }, [selectedGame, playSFX]);

  const handlePrevious = useCallback(() => {
    selectGame(selectedGame === 0 ? games.length - 1 : selectedGame - 1);
  }, [selectedGame, selectGame]);

  const handleNext = useCallback(() => {
    selectGame(selectedGame === games.length - 1 ? 0 : selectedGame + 1);
  }, [selectedGame, selectGame]);

  /**
   * @listens isPlaying, achievementManager, stopMusic, playSFX, showMobileWarning, playBackgroundMP3, handlePrevious, handleNext, toggleMute
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
      
      // ESC key to exit games
      if (e.key === 'Escape' && isPlaying) {
        e.preventDefault();
        setIsPlaying(false);
        stopMusic();
        playSFX('menu');
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
        setTimeout(() => playBackgroundMP3('/matrixarcaderetrobeat.mp3'), 500);
      }
      
      // V key to toggle mute
      if (e.key.toLowerCase() === 'v' && !isPlaying &&
          e.target instanceof HTMLElement &&
          e.target.tagName !== 'INPUT' && 
          e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleMute();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, achievementManager, stopMusic, playSFX, showMobileWarning, playBackgroundMP3, handlePrevious, handleNext, toggleMute]);

  const GameComponent = games[selectedGame].component;

  return (
    <GameStateProvider>
      {/* Mobile Warning */}
      {showMobileWarning && <MobileWarning />}
      
      <div className="h-screen flex flex-col bg-black text-green-500 overflow-hidden">
      {/* Header */}
      <header
        ref={headerRef}
        className="relative border-b border-green-500/50 p-2 lg:p-3 overflow-hidden backdrop-blur-sm"
      >
        <canvas
          className="matrix-rain absolute top-0 left-0 w-full h-full opacity-15 z-0"
          style={{ pointerEvents: 'none' }}
        />
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
              <h1 className="text-xl lg:text-2xl font-mono font-bold tracking-wider group-hover:text-green-400 transition-colors">
                THE MATRIX ARCADE
              </h1>
              <p className="text-xs text-green-400 tracking-widest hidden sm:block">
                SYSTEM v1.1
              </p>
            </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveManager(!showSaveManager)}
              className="p-2 bg-green-900/50 rounded hover:bg-green-800 transition-colors border border-green-500/30 backdrop-blur-sm"
              title="Save Data Manager"
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
            >
              <Settings className={`w-5 h-5 ${isMuted ? 'text-red-400' : ''}`} />
            </button>
            <button
              onClick={() => setShowNav(!showNav)}
              className="flex items-center gap-2 px-4 py-2 bg-green-900/50 rounded hover:bg-green-800 transition-colors border border-green-500/30 backdrop-blur-sm group"
            >
              Games
            </button>
          </div>
        </div>
      </header>

      {/* Side Nav */}
      {showNav && (
        <div
          className="absolute left-0 top-0 h-full w-64 bg-black/90 border-r border-green-500/50 z-50 backdrop-blur-sm"
          style={{ paddingTop: '5rem' }} // offset from header
        >
          <div className="flex flex-col gap-2 p-4">
            {games.map((game, index) => (
              <button
                key={index}
                onClick={() => selectGame(index)}
                className="w-full flex items-center gap-2 p-3 hover:bg-green-900/50 transition-colors text-left"
              >
                {game.icon}
                <span>{game.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex items-center justify-center p-2 lg:p-4">
        {/* Fullscreen Game View */}
        {isPlaying && GameComponent ? (
          <div className="relative w-full h-full">
            <GameComponent achievementManager={achievementManager} isMuted={isMuted} />

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
                stopMusic();
                playSFX('menu');
                
                // Track play time
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
              }}
              className="absolute top-4 right-4 z-50 p-3 bg-red-900/90 hover:bg-red-700 rounded-lg border-2 border-red-500/80 backdrop-blur-sm transition-all group shadow-lg hover:shadow-red-500/50 hover:scale-110"
              title="Exit Game (ESC)"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              <span className="absolute -bottom-6 right-0 text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">ESC</span>
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-2xl mx-auto flex flex-col justify-center h-full game-portal-container px-4">
          {/* Matrix Rain Effect - Reduced for performance */}
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute text-green-500 animate-matrix-rain"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 3}s`,
                }}
              >
                {String.fromCharCode(0x30a0 + Math.random() * 96)}
              </div>
            ))}
          </div>

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
                        <GameComponent achievementManager={achievementManager} />
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
                    onClick={handlePrevious}
                    className="p-1.5 lg:p-2 hover:bg-green-900 rounded-full transition-colors transform hover:scale-110"
                    title="Previous game"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="lg:scale-110">
                        {games[selectedGame].icon}
                      </div>
                      <h2 className="text-lg lg:text-xl xl:text-2xl font-mono">
                        {games[selectedGame].title}
                      </h2>
                    </div>
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
                            // Start ambient music when game starts
                            setTimeout(() => playBackgroundMP3('/matrixarcaderetrobeat.mp3'), 500);

                            // Track game played
                            const gameName = games[selectedGame].title;
                            gamesPlayed.current.add(gameName);
                            playStartTime.current = Date.now();
                            
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
                            stopMusic();
                            
                            // Track play time
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
                          }
                        }}
                        className="px-4 py-2 lg:px-6 lg:py-2.5 bg-green-500 text-black font-mono rounded-full hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto transform hover:scale-105 text-sm lg:text-base font-bold"
                      >
                        <Play className="w-4 h-4" />
                        {isPlaying ? 'STOP' : 'PLAY'}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-1.5 lg:p-2 hover:bg-green-900 rounded-full transition-colors transform hover:scale-110"
                    title="Next game"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Keyboard Hints */}
                <div className="mt-4 text-xs lg:text-sm text-green-400/70 text-center space-y-1">
                  <p>← → Navigate Games • Enter to Play • ESC to Exit</p>
                  <p>A for Achievements • V to Toggle Mute</p>
                </div>
              </div>
          </div>
        </div>
        )}
      </main>

      {/* Enhanced Footer */}
      <footer
        ref={footerRef}
        className="relative border-t border-green-500/50 p-2 lg:p-3 overflow-hidden backdrop-blur-sm bottom-0 w-full"
      >
        <canvas
          className="matrix-rain absolute top-0 left-0 w-full h-full opacity-15 z-0"
          style={{ pointerEvents: 'none' }}
        />
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="font-mono text-xs lg:text-sm flex items-center gap-2 lg:gap-4">
            <p className="tracking-wider hidden lg:block">THE MATRIX ARCADE v1.1</p>
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

      {/* Audio Settings Modal */}
      <AudioSettings
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
        isMuted={isMuted}
        toggleMute={toggleMute}
      />
      
      {/* Save/Load Manager Modal */}
      <SaveLoadManager 
        isOpen={showSaveManager} 
        onClose={() => setShowSaveManager(false)} 
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
