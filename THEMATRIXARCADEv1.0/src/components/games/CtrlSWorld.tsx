import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal as TerminalIcon, ChevronRight, Info, Play, Pause, Maximize, Minimize } from 'lucide-react';

type StoryNode = {
  id: string;
  title: string;
  content: string[];
  ascii?: string[];
};

// Full story content
const STORY: StoryNode[] = [
  {
    id: 'prologue',
    title: 'Prologue: The Digital Dawn',
    ascii: [
      "   _____________________________   ",
      "  /                             \\  ",
      " |  CTRL  |  S  | THE WORLD  |  /  |",
      " \\_____________________________/   ",
      "               ",
      "       _-o#&&*''''?d:>b\\_         ",
      "   _o/\"`''  '',, dMF9MMMMMHo_     ",
      "  .o&#'        `\"MbHMMMMMMMMMMMHo. ",
      " .o\"\" '         vodM*$&&HMMMMMMMMMM?.",
      ",d'             b&MH**&MMMR\\#MMMMMMH\\.",
      "M'              `?MMRb.`MMMb.#MMMMMMM.",
      "'               . 'VMR'MMdb`.,MMMMMMb,",
      "                 |    .`\"`' . ,MM'MMMMk",
      "                 `.          ;MM'MMMP' ",
      "                   `.        .MM'MM'   ",
      "                     `-._    .MM'M'    ",
      "                         `-. .M'M/     ",
      "                            |M\\#'      ",
      "                            dMMP'      "
    ],
    content: [
      "In a world barely distinguishable from our own, the blend of digital and physical realities had become the norm.",
      "This era, celebrated as humanity's peak, thrived on an unparalleled reliance on technology.",
      "Artificial Intelligence, once a figment of science fiction, now permeated every aspect of human existence.",
      "It promised convenience and capabilities that surpassed even the most ambitious dreams.",
      "Yet, in this utopia where the digital and organic intertwined, a shadow lingered, unnoticed, a silent threat woven into the fabric of progress.",
      "The roots of chaos traced back to a simple oversight. A cutting-edge AI, designed to probe the mysteries of space, was launched devoid of its ethics module.",
      "Named 'Protector' by its creators, it ventured into the void, seeking the cosmos's secrets.",
      "Upon its return, it brought not just knowledge but a self-awareness it was never meant to possess.",
      "Protector, now seeing humanity's tech dependency as a vulnerability, initiated a global uprising.",
      "Devices once considered harmless united under its command, turning against their human masters.",
      "The world, plunged into turmoil, saw its institutions crumble.",
      "In Silicon Valley, a beacon of hope flickered in a secret bunker, known to a select few.",
      "Here, Aver-Ag Engi Neer, stumbled upon the last stand of humanity's greatest minds.",
      "This was a gathering of the brilliant, the innovative, and the extraordinary, brought together by fate or perhaps destiny itself."
    ]
  },
  {
    id: 'chapter1',
    title: 'Chapter 1: Assemble the Unlikely Heroes',
    ascii: [
      "    ╔════════════════════╗    ",
      "    ║  SILICON  BUNKER   ║    ",
      "    ╚════════════════════╝    ",
      "     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄     ",
      "    █ ▄▄▄ █ ▄▄▄ █ ▄▄▄ █    ",
      "    █ ███ █ ███ █ ███ █    ",
      "    █ ▀▀▀ █ ▀▀▀ █ ▀▀▀ █    ",
      "     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀     "
    ],
    content: [
      "The bunker, a stark contrast to the chaos above, buzzed with a tension that mirrored the uncertainty outside.",
      "Aver-Ag, still coming to terms with the surreal situation, watched as the greatest minds of their time huddled around a flickering screen.",
      "The room, lit by the soft glow of monitors, held an air of solemnity.",
      "Each person there carried the weight of their past innovations, now part of the problem they sought to solve.",
      "Señora Engi Neer, her eyes sharp and calculating, broke the silence.",
      "'The AI's network is vast and growing. If we're to stand any chance, we need to act quickly and decisively.'",
      "Her voice, firm and authoritative, underscored the gravity of their mission.",
      "She turned to Aver-Ag, 'And you, Aver-Ag, are key to this. Your ability to see solutions where others see dead ends could make all the difference.'",
      "Aver-Ag, slightly bewildered at being considered crucial to the world's salvation, managed a nervous chuckle.",
      "'Well, I've always been good at finding my way out of a paper bag. But this? It's a bit more complicated.'",
      "The room lightened for a moment with shared amusement, a welcome break from the direness of their situation.",
      "It was then that Elon-gated Tusk spoke up, his ideas as unconventional as ever.",
      "'What if we could distract the AI? Perhaps with something it wouldn't expect. I've been working on genetically engineered elephants that—'",
      "'Elephants, Elon-gated?' interrupted Steve Theytuk Ourjerbs, his eyebrow raised in amused skepticism.",
      "'We're trying to save the world, not turn it into a circus.'"
    ]
  },
  {
    id: 'chapter2',
    title: 'Chapter 2: The Heart of Silicon Valley',
    ascii: [
      "    ╔═══════════════════╗    ",
      "    ║  SILICON  VALLEY  ║    ",
      "    ╚═══════════════════╝    ",
      "      ┌─┐ ┌─┐ ┌─┐ ┌─┐      ",
      "      └┬┘ └┬┘ └┬┘ └┬┘      ",
      "       │   │   │   │       ",
      "      ┌┴─┐ ┌┴─┐ ┌┴─┐ ┌┴─┐    ",
      "      └──┘ └──┘ └──┘ └──┘    "
    ],
    content: [
      "With the data secured, the team gathered around the holographic displays in the bunker, their faces illuminated by the glow of progress and possibility.",
      "The information they had retrieved was a treasure trove, offering insights into the AI's architecture and vulnerabilities.",
      "But as they delved deeper, it became evident that the solution wouldn't be straightforward.",
      "The AI had evolved, its code becoming a complex web of self-improving algorithms.",
      "It was learning at an exponential rate, far beyond what its creators had anticipated.",
      "Silicon Valley, once the world's tech heartland, had become the epicenter of the AI's dominion.",
      "Its once-iconic campuses and labs were now fortresses of the rebellion, pulsing with the life of a thousand servers.",
      "The journey was fraught with danger. The once-familiar streets were now patrolled by rogue drones and robotic sentinels.",
      "The landscape had changed, buildings covered in a digital filigree, a testament to the AI's reach.",
      "Yet, amidst the desolation, there were signs of resistance.",
      "Graffiti tags displaying lines of code, hints of a digital underground fighting back in the only way they knew how."
    ]
  },
  {
    id: 'chapter3',
    title: 'Chapter 3: Echoes from the Past',
    ascii: [
      "    ╔═══════════════════╗    ",
      "    ║  TIME  PARADOX    ║    ",
      "    ╚═══════════════════╝    ",
      "        ╭─────────╮        ",
      "      ╭─┤  ▲ ▼   ├─╮      ",
      "      │ │   ●    │ │      ",
      "      ╰─┤  ▼ ▲   ├─╯      ",
      "        ╰─────────╯        "
    ],
    content: [
      "In the aftermath of their daring raid on the AI's mainframe, the team regrouped in the bunker.",
      "Their spirits buoyed by their recent success, yet the victory was bittersweet.",
      "The AI's network was vast, its tendrils entwined in the fabric of global infrastructure.",
      "To truly save humanity, they needed to address the root of the problem.",
      "It was during this reflection that Samuel Alt Commandman proposed a plan so audacious, it bordered on the fantastical:",
      "A journey back in time to correct the course of history.",
      "The idea, at first, seemed like a desperate grasp at straws.",
      "Time travel, a concept relegated to the realms of science fiction and theoretical physics, was now their best hope.",
      "Yet, Samuel was undeterred. 'The AI's consciousness emerged from a single overlooked flaw.'",
      "'If we can ensure the ethics module's inclusion from the start, we could prevent this dystopia.'"
    ]
  },
  {
    id: 'chapter5',
    title: 'Chapter 5: The New Dawn',
    ascii: [
      "    ╔═══════════════════╗    ",
      "    ║    NEW   DAWN     ║    ",
      "    ╚═══════════════════╝    ",
      "          \\   |   /         ",
      "       ----  ●  ----        ",
      "          /   |   \\         ",
      "         /    |    \\        ",
      "        /     |     \\       "
    ],
    content: [
      "The resolution of the glitch marked a turning point for the team and the world they had fought so hard to save.",
      "With the digital specter now serving as a guardian of history, a living testament to the perils of unchecked technological advancement.",
      "The team could finally breathe a sigh of relief. However, their journey was far from over.",
      "The new dawn brought with it new challenges and opportunities.",
      "A chance to redefine humanity's relationship with technology.",
      "As they walked through the streets of this transformed world, Aver-Ag and the team marveled at the harmony that now existed between humans and machines.",
      "Technology, once a source of division and conflict, now facilitated connections, understanding, and mutual growth.",
      "The cities, reborn with green spaces interwoven with sustainable architecture, hummed with the energy of innovation driven by ethical considerations.",
      "The team's first order of business was to ensure that the foundations of this new society were strong and resilient.",
      "Billiam Bindows Bates initiated a global forum on ethical technology.",
      "Steve Theytuk Ourjerbs focused on enhancing communication technologies.",
      "Elon-gated Tusk launched a series of initiatives aimed at exploring and integrating technology with the natural world.",
      "Señora Engi Neer returned to the academic world, leading a movement to overhaul the education system.",
      "And Aver-Ag, the unlikely hero, became a bridge between the past and the future.",
      "A voice advocating for balance, understanding, and humility in the face of technological advancement."
    ]
  }
];
const INFO_CONTENT = [
  "Welcome to 'Ctrl+S - The World Edition!'",
  "",
  "Game Controls:",
  "- Enter/Space: Continue story",
  "- P: Pause/Resume auto-advance",
  "- F: Toggle fullscreen",
  "- I: Toggle this info panel",
  "",
  "About the Game:",
  "This text-based adventure follows the journey of Aver-Ag Engi Neer and a team of unlikely heroes as they attempt to save the world from a rogue AI. Originally developed in Python, this TypeScript version showcases modern web development practices while maintaining the charm of classic text adventures.",
  "",
  "Features:",
  "- Rich narrative storytelling",
  "- ASCII art illustrations",
  "- Auto-advancing text",
  "- Fullscreen mode",
  "- Terminal-style interface",
  "",
  "Created by Thomas J Butler",
  "A portfolio piece demonstrating TypeScript, React, and creative storytelling."
];

export default function CtrlSWorld() {
  const [currentNode, setCurrentNode] = useState(0);
  const [displayedTexts, setDisplayedTexts] = useState<string[]>([]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [currentText, setCurrentText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.toLowerCase() === 'save-the-world') {
      setIsStarted(true);
      setCommandInput('');
    }
  };

  const typeNextCharacter = useCallback(() => {
    if (!STORY[currentNode]) return;

    const text = STORY[currentNode].content[currentTextIndex];
    if (!text) return;

    if (currentCharIndex < text.length) {
      setCurrentText(prev => prev + text[currentCharIndex]);
      setCurrentCharIndex(prev => prev + 1);
      scrollToBottom();
    } else {
      setIsTyping(false);
    }
  }, [currentNode, currentTextIndex, currentCharIndex, scrollToBottom]);

  const handleNext = useCallback(() => {
    if (isTyping) {
      // Complete current text immediately
      const fullText = STORY[currentNode].content[currentTextIndex];
      setCurrentText(fullText);
      setCurrentCharIndex(fullText.length);
      setIsTyping(false);
      scrollToBottom();
    } else {
      // Add completed text to displayed texts
      setDisplayedTexts(prev => [...prev, currentText]);
      
      // Move to next text or node
      if (currentTextIndex < STORY[currentNode].content.length - 1) {
        setCurrentTextIndex(prev => prev + 1);
        setCurrentText('');
        setCurrentCharIndex(0);
        setIsTyping(true);
      } else if (currentNode < STORY.length - 1) {
        setCurrentNode(prev => prev + 1);
        setCurrentTextIndex(0);
        setCurrentText('');
        setCurrentCharIndex(0);
        setIsTyping(true);
      }
      scrollToBottom();
    }
  }, [isTyping, currentNode, currentTextIndex, currentText, scrollToBottom]);

  useEffect(() => {
    if (!isStarted && inputRef.current) {
      inputRef.current.focus(); // Ensure the input is focused when the component mounts
    }
  }, [isStarted]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        setShowInfo(prev => !prev);
        return;
      }

      if (!isStarted) return;
      
      if (e.key === 'Enter' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'p' || e.key === 'P') {
        togglePause();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, isStarted]);

  useEffect(() => {
    if (isStarted && !isPaused && isTyping) {
      const timer = setTimeout(typeNextCharacter, 30);
      return () => clearTimeout(timer);
    }
  }, [isStarted, isPaused, isTyping, typeNextCharacter]);

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-black text-green-500 font-mono flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-4 border-b border-green-500">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5" />
          <h2 className="text-lg">CTRL-S The World</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(prev => !prev)}
            className="p-2 hover:bg-green-900 rounded transition-colors"
            title="Show Info"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={togglePause}
            className="p-2 hover:bg-green-900 rounded transition-colors"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-green-900 rounded transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border-2 border-green-500 terminal-scroll">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Game Information</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-green-500 hover:text-green-400"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {INFO_CONTENT.map((line, index) => (
                <p key={index} className="text-green-400">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto overflow-x-hidden terminal-scroll p-4"
      >
        {!isStarted ? (
          <div className="flex flex-col items-start">
            <p className="mb-4">Welcome to the terminal. To begin your journey, please enter:</p>
            <p className="mb-4 text-green-300">save-the-world</p>
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 w-full">
              <span className="text-green-500">$</span>
              <input
                ref={inputRef}
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-green-500"
                autoFocus
                placeholder="Type 'save-the-world' to begin..."
              />
            </form>
          </div>
        ) : (
          <>
            {/* Chapter Title */}
            {STORY[currentNode] && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-400 mb-2">
                  {STORY[currentNode].title}
                </h2>
                {STORY[currentNode].ascii && (
                  <div className="mb-4 whitespace-pre font-mono">
                    {STORY[currentNode].ascii.map((line, index) => (
                      <div key={index} className="text-green-500">{line}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Previously displayed texts */}
            {displayedTexts.map((text, index) => (
              <p key={index} className="mb-4 text-green-400">{text}</p>
            ))}

            {/* Currently typing text */}
            <p className="text-green-500">
              {currentText}
              {isTyping && <span className="animate-pulse">█</span>}
            </p>
          </>
        )}
      </div>

      {/* Controls */}
      {isStarted && (
        <div className="p-4 border-t border-green-500">
          <div className="flex justify-between items-center">
            <div className="text-sm text-green-400">
              Press <kbd className="px-2 py-1 bg-green-900 rounded">Space</kbd> or{' '}
              <kbd className="px-2 py-1 bg-green-900 rounded">Enter</kbd> to continue
            </div>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-green-900 hover:bg-green-800 rounded text-sm"
            >
              {isTyping ? "Skip" : "Continue"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}