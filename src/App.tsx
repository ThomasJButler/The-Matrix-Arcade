import { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Gamepad2,
  Terminal,
  Code2,
  ChevronLeft,
  ChevronRight,
  Play,
  Disc3,
  Keyboard,
  LucideClipboardSignature,
} from 'lucide-react';
import SnakeClassic from './components/games/SnakeClassic';
import CodeBreaker from './components/games/CodeBreaker';
import VortexPong from './components/games/VortexPong';
import TerminalQuest from './components/games/TerminalQuest';
import CtrlSWorld from './components/games/CtrlSWorld';
import MatrixCloud from './components/games/MatrixCloud';

function App() {
  const [selectedGame, setSelectedGame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<
    'left' | 'right'
  >('right');
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const games = [
    {
      title: 'Matrix Cloud',
      icon: <Gamepad2 className="w-8 h-8" />,
      description: 'Navigate through the digital storm',
      preview:
        'https://res.cloudinary.com/depqttzlt/image/upload/v1737071594/matrixcloud_rw8hsa.png',
      component: MatrixCloud,
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
      title: 'Code Breaker',
      icon: <Code2 className="w-8 h-8" />,
      description: "Decrypt the system's core algorithms",
      preview:
        'https://res.cloudinary.com/depqttzlt/image/upload/v1737071592/codebreaker_sda03k.png',
      component: CodeBreaker,
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
      title: 'CTRL-S | The World',
      icon: <Keyboard className="w-8 h-8" />,
      description: 'A hilarious text adventure about saving the digital world',
      preview:
        'https://res.cloudinary.com/depqttzlt/image/upload/v1737071600/ctrlsthegame_m1tg5l.png',
      component: CtrlSWorld,
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

  const handlePrevious = () => {
    selectGame(selectedGame === 0 ? games.length - 1 : selectedGame - 1);
  };

  const handleNext = () => {
    selectGame(selectedGame === games.length - 1 ? 0 : selectedGame + 1);
  };

  const selectGame = (index: number) => {
    const direction = index > selectedGame ? 'right' : 'left';
    setTransitionDirection(direction);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 600);
    setShowNav(false);
    setSelectedGame(index);
    setIsPlaying(false);
  };

  const GameComponent = games[selectedGame].component;

  return (
    <div className="min-h-screen flex flex-col bg-black text-green-500">
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
              <h1 className="text-2xl font-mono font-bold tracking-wider group-hover:text-green-400 transition-colors">
                THE MATRIX ARCADE
              </h1>
              <p className="text-xs text-green-400 tracking-widest">
                SYSTEM v1.0.2
              </p>
            </div>
          </div>
          <div>
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
        <div className="relative w-full max-w-4xl mx-auto h-full flex flex-col">
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
              <div className="relative bg-gray-900 rounded-3xl p-8 border-4 border-green-500 shadow-[0_0_50px_rgba(0,255,0,0.3)]">
                {/* Game Display */}
                <div className="relative aspect-video mb-6 rounded-lg overflow-hidden border-2 border-green-500">
                  {isPlaying && GameComponent ? (
                    <GameComponent />
                  ) : (
                    <img
                      src={games[selectedGame].preview}
                      alt={games[selectedGame].title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={handlePrevious}
                    className="p-2 hover:bg-green-900 rounded-full transition-colors transform hover:scale-110"
                    title="Previous game"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>

                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      {games[selectedGame].icon}
                      <h2 className="text-xl font-mono">
                        {games[selectedGame].title}
                      </h2>
                    </div>
                    <p className="text-green-400 font-mono text-sm mb-4">
                      {games[selectedGame].description}
                    </p>
                    {typeof GameComponent !== 'undefined' && (
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="px-6 py-2 bg-green-500 text-black font-mono rounded-full hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto transform hover:scale-105"
                      >
                        <Play className="w-4 h-4" />
                        {isPlaying ? 'STOP' : 'PLAY'}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-2 hover:bg-green-900 rounded-full transition-colors transform hover:scale-110"
                    title="Next game"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer
        ref={footerRef}
        className="relative border-t border-green-500/50 p-4 overflow-hidden backdrop-blur-sm fixed bottom-0 w-full"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <div className="font-mono text-sm flex items-center gap-4">
            <p className="tracking-wider">THE MATRIX ARCADE v1.0.2</p>
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

        .transition-left .game-container,
        .transition-right .game-container {
          animation: digital-glitch 0.6s ease-out forwards;
        }

        @keyframes digital-glitch {
          0% {
            clip-path: inset(0 0 0 0);
            transform: translate3d(0, 0, 0) scale(1);
            filter: brightness(1) contrast(1);
          }
          20% {
            clip-path: inset(20% -10px 30% 50%);
            transform: translate3d(-10px, 5px, 50px) scale(1.02);
            filter: brightness(1.2) contrast(1.3);
          }
          40% {
            clip-path: inset(10% 30% 50% 0);
            transform: translate3d(10px, -5px, -50px) scale(0.98);
            filter: brightness(0.8) contrast(1.5);
          }
          60% {
            clip-path: inset(40% 0 20% 30%);
            transform: translate3d(-15px, 10px, 100px) scale(1.03);
            filter: brightness(1.3) contrast(0.7);
          }
          80% {
            clip-path: inset(15% 40% 10% 10%);
            transform: translate3d(15px, -10px, -100px) scale(0.97);
            filter: brightness(0.9) contrast(1.2);
          }
          100% {
            clip-path: inset(0 0 0 0);
            transform: translate3d(0, 0, 0) scale(1);
            filter: brightness(1) contrast(1);
          }
        }

        .transition-left {
          transform: translateX(100%);
          opacity: 0;
        }

        .transition-right {
          transform: translateX(-100%);
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

export default App;
