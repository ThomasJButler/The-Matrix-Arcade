import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/theme.css'; // Custom theme.css for the insane styling
import './styles/animations.css';
import {
  Monitor,
  Gamepad2,
  Terminal,
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
} from 'lucide-react';
import SnakeClassic from './components/games/SnakeClassic';
import VortexPong from './components/games/VortexPong';
import TerminalQuest from './components/games/TerminalQuest';
import CtrlSWorld from './components/games/CtrlSWorld';
import MatrixCloud from './components/games/MatrixCloud';
import MatrixInvaders from './components/games/MatrixInvaders';
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
  const { playSFX, playMusic, stopMusic, toggleMute, isMuted, config: soundConfig, updateConfig } = useSoundSystem();
  const achievementManager = useAchievementManager();
  
  // Mobile detection
  const { isMobile, isTablet } = useMobileDetection();
  const showMobileWarning = isMobile || isTablet;
  
  // Track global achievements
  const gamesPlayed = useRef(new Set<string>());
  const playStartTime = useRef<number | null>(null);
  const totalPlayTime = useRef(0);
  
  // Check achievement milestones
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
      component: SnakeClassic,
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
      title: 'Terminal Quest',
      icon: <Terminal className="w-8 h-8" />,
      description: 'Text-based adventure in the digital realm',
      preview:
        'https://res.cloudinary.com/depqttzlt/image/upload/v1737071600/terminalquest_ddvjkf.png',
      component: TerminalQuest,
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
      preview:
        'https://res.cloudinary.com/depqttzlt/image/upload/v1737071594/matrixcloud_rw8hsa.png',
      component: MatrixInvaders,
    },
  ];

  // Matrix rain effect
  useEffect(() => {
    const createMatrixRain = (element: HTMLDivElement) => {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '0';
      canvas.style.opacity = '0.15';
      element.insertBefore(canvas, element.firstChild);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const chars =
        'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
      const fontSize = 14;
      const columns = Math.floor(width / fontSize);
      const drops: number[] = Array(columns).fill(1);

      const draw = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#0F0';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(char, i * fontSize, drops[i] * fontSize);
          if (drops[i] * fontSize > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      };

      return setInterval(draw, 33);
    };

    const headerInterval =
      headerRef.current && createMatrixRain(headerRef.current);
    const footerInterval =
      footerRef.current && createMatrixRain(footerRef.current);

    return () => {
      if (headerInterval) clearInterval(headerInterval);
      if (footerInterval) clearInterval(footerInterval);
    };
  }, []);

  // Prevent scrolling when games are active
  useEffect(() => {
    const preventDefault = (e: Event) => {
      const target = e.target as HTMLElement;
      // Only prevent if isPlaying, and the user isn't typing in an input/textarea
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
  
  // Game selection functions
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
  
  // Keyboard shortcuts
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
        setTimeout(() => playMusic('gameplay'), 500);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, achievementManager, stopMusic, playSFX, showMobileWarning, playMusic, handlePrevious, handleNext]);

  const GameComponent = games[selectedGame].component;

  return (
    <>
      {/* Mobile Warning */}
      {showMobileWarning && <MobileWarning />}
      
      <div className="h-screen flex flex-col bg-black text-green-500 overflow-hidden">
      {/* Header */}
      <header
        ref={headerRef}
        className="relative border-b border-green-500/50 p-4 overflow-hidden backdrop-blur-sm"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Monitor className="w-8 h-8 relative z-10" />
              <div className="absolute inset-0 bg-green-500/20 rounded-full filter blur-sm animate-pulse"></div>
            </div>
            <div>
            <a
              href="https://tomatic.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors group"
            >
              <h1 className="text-2xl font-mono font-bold tracking-wider group-hover:text-green-400 transition-colors">
                THE MATRIX ARCADE
              </h1>
              <p className="text-xs text-green-400 tracking-widest">
                SYSTEM v1.0.5
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
            <div className="relative group">
              <button
                onClick={toggleMute}
                className={`p-2 rounded transition-colors border backdrop-blur-sm ${
                  isMuted 
                    ? 'bg-red-900/50 hover:bg-red-800 border-red-500/30' 
                    : 'bg-green-900/50 hover:bg-green-800 border-green-500/30'
                }`}
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              {/* Volume Slider Popup */}
              <div className="absolute top-full right-0 mt-2 p-3 bg-gray-900 border border-green-500/30 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity shadow-xl z-50">
                <div className="flex items-center gap-2 min-w-[150px]">
                  <Volume2 className="w-4 h-4 text-green-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundConfig.masterVolume}
                    onChange={(e) => updateConfig({ masterVolume: parseFloat(e.target.value) })}
                    className="flex-1 slider"
                  />
                  <span className="text-xs text-green-400 min-w-[3ch]">{Math.round(soundConfig.masterVolume * 100)}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAudioSettings(!showAudioSettings)}
              className="p-2 bg-green-900/50 rounded hover:bg-green-800 transition-colors border border-green-500/30 backdrop-blur-sm"
              title="Audio Settings"
            >
              <Settings className="w-5 h-5" />
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
      <main className="flex-1 overflow-hidden">
        {/* Fullscreen Game View */}
        {isPlaying && GameComponent ? (
          <div className="relative w-full h-full">
            <GameComponent achievementManager={achievementManager} />
            
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
          <div className="relative w-full max-w-6xl mx-auto h-full flex flex-col justify-center py-4 px-4 lg:py-8 lg:px-8">
          {/* Matrix Rain Effect */}
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
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
              digital-container
              ${isTransitioning ? `transition-${transitionDirection}` : ''}
            `}
          >
            {/*  */}
            <div className="game-container">
              <div className="relative bg-gray-900 rounded-3xl p-6 lg:p-10 border-4 border-green-500 shadow-[0_0_50px_rgba(0,255,0,0.3)]">
                {/* Game Display */}
                <div className="relative aspect-video mb-4 lg:mb-6 rounded-lg overflow-hidden border-2 border-green-500">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedGame}
                      className="game-container transition-enhanced"
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
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={handlePrevious}
                    className="p-2 lg:p-3 hover:bg-green-900 rounded-full transition-colors transform hover:scale-110"
                    title="Previous game"
                  >
                    <ChevronLeft className="w-8 h-8 lg:w-10 lg:h-10" />
                  </button>

                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="lg:scale-125 xl:scale-150">
                        {games[selectedGame].icon}
                      </div>
                      <h2 className="text-xl lg:text-2xl xl:text-3xl font-mono">
                        {games[selectedGame].title}
                      </h2>
                    </div>
                    <p className="text-green-400 font-mono text-sm lg:text-base mb-4 lg:mb-6">
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
                            setTimeout(() => playMusic('gameplay'), 500);
                            
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
                        className="px-6 py-2 lg:px-8 lg:py-3 bg-green-500 text-black font-mono rounded-full hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto transform hover:scale-105 text-base lg:text-lg"
                      >
                        <Play className="w-4 h-4" />
                        {isPlaying ? 'STOP' : 'PLAY'}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-2 lg:p-3 hover:bg-green-900 rounded-full transition-colors transform hover:scale-110"
                    title="Next game"
                  >
                    <ChevronRight className="w-8 h-8 lg:w-10 lg:h-10" />
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
        </div>
        )}
      </main>

      {/* Enhanced Footer */}
      <footer
        ref={footerRef}
        className="relative border-t border-green-500/50 p-4 overflow-hidden backdrop-blur-sm bottom-0 w-full"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <div className="font-mono text-sm flex items-center gap-4">
            <p className="tracking-wider">THE MATRIX ARCADE v1.0.5</p>
            <div className="h-4 w-px bg-green-500/30"></div>
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

        .game-container {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: inherit;
          padding: 1rem;
        }
      `}</style>
    </div>
    </>
  );
}

export default App;
