import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal as TerminalIcon, ChevronRight, Info, Play, Pause, Maximize, Minimize, Shield, Wifi, Key, AlertTriangle, Cpu } from 'lucide-react';

type GameState = {
  currentNode: string;
  inventory: string[];
  health: number;
  securityLevel: number;
  discovered: string[];
};

type Choice = {
  text: string;
  nextNode: string;
  requires?: string[];
  gives?: string[];
  removes?: string[];
  damage?: number;
  security?: number;
};

type GameNode = {
  id: string;
  ascii: string[];
  description: string;
  choices: Choice[];
};

const INFO_CONTENT = [
  "Welcome to Terminal Quest - Code Warriors Edition",
  "",
  "✨ Controls:",
  "- Click choices to navigate the digital labyrinth",
  "- F: Enter/Exit fullscreen mode",
  "- I: Toggle the system information panel",
  "",
  "🔰 Status Indicators:",
  "- 🛡️ Digital Integrity: Tracks your health and endurance",
  "- 📶 Signal Strength: Your stealth rating (lower is better!)",
  "",
  "🎒 Inventory Items:",
  "- Hack Tool: Access restricted nodes with advanced capabilities",
  "- Support Team: Provides additional defenses when traced",
  "- Red Pill: Grants recruits the ability to escape the Matrix",
  "- EMP: Temporarily disables system defenses and agents",
  "",
  "🎯 Mission:",
  "Navigate the simulated Matrix, guide recruits to freedom, and survive.",
  "Carefully balance stealth, resources, and risk-taking as you make choices.",
  "",
  "⚠️ Tip:",
  "Beware of unexplored paths and unforeseen consequences. The system evolves."
];

const GAME_NODES: Record<string, GameNode> = {
  start: {
    id: 'start',
    ascii: [
      "########  ##     ## ########   #######   ######  ##    ##",
      "##     ## ##     ## ##     ## ##     ## ##    ## ##   ## ",
      "##     ## ##     ## ##     ## ##     ## ##       ##  ##  ",
      "########  ##     ## ########  ##     ## ##       #####   ",
      "##        ##     ## ##        ##     ## ##       ##  ##  ",
      "##        ##     ## ##        ##     ## ##    ## ##   ## ",
      "##         #######  ##         #######   ######  ##    ##",
    ],
    description: "You wake up in a cold, dark terminal, with the light of data streams faintly illuminating the surroundings. What will you do?",
    choices: [
      { text: "Explore the terminal's inner code", nextNode: "explore" },
      { text: "Attempt to summon assistance", nextNode: "help" },
    ],
  },
  explore: {
    id: 'explore',
    ascii: [
      "░█▀▀█ ░█▀▀▄ ░█▀▀▀ ▀▀█▀▀ ░█─░█ ",
      "░█▀▀▄ ░█─░█ ░█▀▀▀ ─░█── ░█▀▀█ ",
      "░█▄▄█ ░█▄▄▀ ░█▄▄▄ ─░█── ░█─░█ ",
    ],
    description: "The faint glow of a data path reveals fragments of encrypted code streams ahead. The line between discovery and danger narrows.",
    choices: [
      { text: "Follow the glowing data path", nextNode: "deeper" },
      { text: "Retreat and recalibrate your priorities", nextNode: "start" },
    ],
  },
  help: {
    id: 'help',
    ascii: [
      "█▀▀ █▀▀ █▀▀█ █▀▄▀█ █▀▀█ ░█▀▀█ ░█──░█ ",
      "▀▀█ █▀▀ █──█ █─▀─█ █──█ ░█▄▄█ ░█░█░█ ",
      "▀▀▀ ▀▀▀ ▀▀▀▀ ▀───▀ ▀▀▀▀ ░█─░█ ░█▄▀▄█ ",
    ],
    description: "As your plea for aid echoes into the system, a voice answers: 'Do you seek the key to enlightenment, or the darkness of despair?'",
    choices: [
      { text: "Heed the voice's cryptic advice", nextNode: "voice_guidance" },
      { text: "Reject its riddles and proceed alone", nextNode: "start" },
    ],
  },
  voice_guidance: {
    id: 'voice_guidance',
    ascii: [
      "────█▀▄─▄▀▀▀█─▀─▀▄────█",
      "────█─▀─█──█─█─█─▀─▄──█",
      "────▀───▀──▀─▀─▀───▀▀─▀",
    ],
    description: "The voice speaks riddles of freedom, warning of unseen traps and choices. It offers coordinates to a secure route. Do you trust it?",
    choices: [
      { text: "Follow the voice's suggestion", nextNode: "deeper" },
      { text: "Discard the advice and blaze your trail", nextNode: "start" },
    ],
  },
  deeper: {
    id: 'deeper',
    ascii: [
      "─████████████████───██████████████─ ",
      "─██▒▒▒▒▒▒▒▒▒▒▒██───██▒▒▒▒▒▒▒▒▒▒▒██─ ",
      "─██▒▒████▒▒████▒▒───██▒▒████▒▒████▒▒ ",
      "─██▒▒██▓▓██▓▓██▒▒───██▒▒██▓▓██▓▓██▒▒ ",
    ],
    description: "As you step deeper into the matrix of code, the static flickers and strange distortions ripple through the terminal. Do you proceed?",
    choices: [
      { text: "Venture further into the unknown", nextNode: "deeper_branch" },
      { text: "Stop and analyze your surroundings", nextNode: "analyze" },
    ],
  },
  deeper_branch: {
    id: 'deeper_branch',
    ascii: [
      "▀█▀─█▀▀█ ─█▀▀█ █▀▄▀█ ",
      "─█──█▄▄█ █▄▄▀▀ █─▀─█ ",
      "─█──█▄▄█ █▄▄▄▄ ▀───▀ ",
    ],
    description: "The system alarms start to chime. Your signal strength begins to drop as firewalls attempt to locate you. What’s your move?",
    choices: [
      { text: "Run a cloaking script (requires Hack Tool)", nextNode: "safe_zone", requires: ["hack_tool"] },
      { text: "Try to brute force past the firewalls", nextNode: "firewall_fight" },
    ],
  },
  analyze: {
    id: 'analyze',
    ascii: [
      "────────█───▄▀█▀▀█▀▄▄───▐█──█──█▄▄▄▄▀▀▄█───█ ",
      "───────▄▀▀▀▀─▄▀─▐█▌▀▄──▐██──▀▄──────▄▀──▀▄ ",
      "──────▐▀▄───▐▄▀▌▐▀▌──▄▀─▀▄──▐▀▀▄────▀▄──▌ ",
    ],
    description: "You pause to assess the intricate system code and realize patterns to help move further without alarming Agents.",
    choices: [
      { text: "Continue with newfound knowledge", nextNode: "deeper_branch", gives: ["hack_tool"] },
    ],
  },
  firewall_fight: {
    id: 'firewall_fight',
    ascii: [
      "████████─▄█ █▀─",
      "─█▄▀█ █▀█ █ █▀─",
      "─▀▀ ▀▀▀█▀▀█▄█▄─",
    ],
    description: "The system has locked onto your signal! Alarms are blaring, and agents are en route. Digital chaos ensues.",
    choices: [
      { text: "Brace for the fight (Lose Health)", nextNode: "system_failure", damage: 50 },
      { text: "Use EMP to reset the matrix", nextNode: "safe_zone", requires: ["emp"] },
    ],
  },
  safe_zone: {
    id: 'safe_zone',
    ascii: [
      "█▀▄▀█ ▀█─█▀─▄▀▀█ █▀▄▀█ ",
      "█─▀─█ ─█▄█──▀▀█ █─▀─█ ",
      "▀───▀ ──▀── ▀▀▀ ▀───▀ ",
    ],
    description: "The system's signal fades as you retreat to a safe zone. You are momentarily out of harm’s way. Time to strategize your next move.",
    choices: [
      { text: "Rest and plan", nextNode: "start", gives: ["health"] },
    ],
  },
};

const Indicator = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1">
        {icon}
        <span className="text-sm">{title}</span>
      </span>
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i < Math.round((value / 100) * 5) ? 'bg-green-500' : 'bg-gray-700'}`}
          />
        ))}
      </div>
    </div>
  );
};

const InventoryBadge = ({ item }: { item: string }) => {
  const icons: Record<string, JSX.Element> = {
    hack_tool: <Key className="w-4 h-4" />,
    support_team: <Shield className="w-4 h-4" />,
    red_pill: <AlertTriangle className="w-4 h-4" />,
    emp: <Cpu className="w-4 h-4" />,
  };

  return (
    <div className="bg-green-900 text-white flex items-center gap-2 px-3 py-1 rounded shadow-md">
      {icons[item] || <Info className="w-4 h-4" />}
      <span>{item.replace('_', ' ').toUpperCase()}</span>
    </div>
  );
};

export default function TerminalQuest() {
  const [gameState, setGameState] = useState<GameState>({
    currentNode: 'start',
    inventory: [],
    health: 100,
    securityLevel: 50,
    discovered: ['start']
  });
  const [isTyping, setIsTyping] = useState(false);
  const [shakeEffect, setShakeEffect] = useState(false); // Dynamic screen shake
  const [backgroundGlitch, setBackgroundGlitch] = useState(false); // Glitch effect

  const triggerShake = () => {
    setShakeEffect(true);
    setTimeout(() => setShakeEffect(false), 500); // Brief screen shake
  };

  const toggleBackgroundGlitch = () => {
    setBackgroundGlitch(!backgroundGlitch);
  };

  // Handler for choice actions
  const handleChoice = (choice: Choice) => {
    if (choice.damage && gameState.health <= choice.damage) {
      triggerShake(); // Big damage causes a shake
    }
    if (choice.security) {
      toggleBackgroundGlitch(); // Glitch background on security risks
      setTimeout(() => toggleBackgroundGlitch(), 1000);
    }

    // Core state update remains consistent
    const newState = applyChoiceEffects(gameState, choice);
    setGameState(newState);
  };

  // Function for calculating effects from a choice
  const applyChoiceEffects = (state: GameState, choice: Choice): GameState => {
    const updatedInventory = [...state.inventory];

    if (choice.gives) {
      choice.gives.forEach(item => {
        if (!updatedInventory.includes(item)) {
          updatedInventory.push(item);
        }
      });
    }

    if (choice.removes) {
      choice.removes.forEach(item => {
        const idx = updatedInventory.indexOf(item);
        if (idx !== -1) updatedInventory.splice(idx, 1);
      });
    }

    const newHealth = Math.max(0, state.health - (choice.damage || 0));
    const newSecurity = Math.max(0, Math.min(100, state.securityLevel + (choice.security || 0)));

    return {
      ...state,
      currentNode: choice.nextNode,
      inventory: updatedInventory,
      health: newHealth,
      securityLevel: newSecurity,
      discovered: state.discovered.includes(choice.nextNode)
        ? state.discovered
        : [...state.discovered, choice.nextNode]
    };
  };

  // Custom hook for ASCII typing
  const useTypingEffect = (text: string) => {
    const [typedText, setTypedText] = useState('');
    
    useEffect(() => {
      let isMounted = true;
      let index = -1; // Start at -1 to handle first character properly
      
      setTypedText('');
      setIsTyping(true);

      const interval = setInterval(() => {
        if (!isMounted) return;
        
        index++;
        if (index < text.length) {
          setTypedText(text.substring(0, index + 1));
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 30);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }, [text]);

    return typedText;
  };

  const currentNode = GAME_NODES[gameState.currentNode];
  const typedDescription = useTypingEffect(currentNode.description);

  return (
    <div
      className={`relative w-full h-full bg-black text-green-500 font-mono flex flex-col ${shakeEffect ? 'shake-animation' : ''} ${backgroundGlitch ? 'bg-glitch-effect' : ''}`}
    >
      {/* Header with Dynamic Indicators */}
      <header className="flex justify-between items-center p-4 bg-black border-b border-green-500">
        <h2 className="text-lg tracking-wide flex items-center gap-2">
          <TerminalIcon className="w-5 h-5" />
          TERMINAL QUEST
        </h2>
        <div className="flex gap-6">
          <Indicator title="Health" value={gameState.health} icon={<Shield />} />
          <Indicator title="Signal Strength" value={100 - gameState.securityLevel} icon={<Wifi />} />
        </div>
      </header>

      {/* Main Terminal Content */}
      <main className="flex-1 p-4 overflow-y-auto bg-opacity-90">
        {/* ASCII Animation */}
        <pre className="mb-4 leading-snug text-green-500 whitespace-pre-wrap">
          {currentNode.ascii.join('\n')}
        </pre>

        {/* Typing Description */}
        <div className="mb-4 min-h-[80px] p-3 border border-green-700 rounded bg-opacity-75 bg-black relative">
          <p className="text-green-400">
            {typedDescription}
            {isTyping && <span className="animate-pulse">█</span>}
          </p>
        </div>

        {/* Choices List */}
        <div className="space-y-4">
          {!isTyping &&
            currentNode.choices.map((choice, index) => {
              const isDisabled =
                choice.requires &&
                !choice.requires.every(req => gameState.inventory.includes(req));

              return (
                <button
                  key={index}
                  onClick={() => handleChoice(choice)}
                  disabled={isDisabled}
                  className={`block w-full text-left p-3 border ${
                    isDisabled
                      ? 'border-gray-600 text-gray-700'
                      : 'border-green-500 hover:bg-green-900 hover:text-white'
                  } rounded transition-colors`}
                >
                  ➤ {choice.text}
                </button>
              );
            })}
        </div>
      </main>

      {/* Inventory Panel */}
      <footer className="p-4 bg-black border-t border-green-500 flex flex-wrap gap-2">
        {gameState.inventory.map((item, index) => (
          <InventoryBadge key={index} item={item} />
        ))}
      </footer>

      {/* Background Glitch Styles */}
      <style jsx>{
        `
        @keyframes glitch {
          0% {
            clip-path: inset(10% 0 20% 0);
          }
          10% {
            clip-path: inset(15% 0 25% 0);
          }
          20% {
            clip-path: inset(5% 0 10% 0);
          }
          30% {
            clip-path: inset(10% 0 15% 0);
          }
          100% {
            clip-path: inset(10% 0 20% 0);
          }
        }
        .bg-glitch-effect {
          animation: glitch 0.3s steps(2, end) infinite;
        }
        .shake-animation {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes shake {
          10%, 90% {
            transform: translateX(-1px);
          }
          20%, 80% {
            transform: translateX(2px);
          }
          30%, 50%, 70% {
            transform: translateX(-4px);
          }
          40%, 60% {
            transform: translateX(4px);
          }
        }
        `
      }</style>
    </div>
  );
}