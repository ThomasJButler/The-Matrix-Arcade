import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal as TerminalIcon, Info, Shield, Wifi, Key, AlertTriangle, Cpu, Save, RotateCcw, Map as MapIcon } from 'lucide-react';
import { EXPANDED_GAME_NODES, Choice } from './TerminalQuestContent';
import { useSoundSystem } from '../../hooks/useSoundSystem';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import TerminalQuestCombat from './TerminalQuestCombat';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface TerminalQuestProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
}

type GameState = {
  currentNode: string;
  inventory: string[];
  health: number;
  maxHealth: number;
  securityLevel: number;
  discovered: string[];
  experience: number;
  achievements: string[];
  choiceCount: number;
};

// Use expanded content from TerminalQuestContent.ts
const GAME_NODES = EXPANDED_GAME_NODES;

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

// Game phase enum - replaces independent inCombat/isPaused booleans
// This eliminates 4 invalid state combinations (e.g., combat AND paused simultaneously)
type GamePhase = 'exploring' | 'combat' | 'paused';

export default function TerminalQuest({ achievementManager, isMuted = false }: TerminalQuestProps) {
  const [gameState, setGameState] = useState<GameState>({
    currentNode: 'start',
    inventory: [],
    health: 100,
    maxHealth: 100,
    securityLevel: 50,
    discovered: ['start'],
    experience: 0,
    achievements: [],
    choiceCount: 0
  });
  // Unified game phase - replaces inCombat and isPaused booleans
  const [gamePhase, setGamePhase] = useState<GamePhase>('exploring');
  // Transient UI effect states - kept as independent booleans
  const [isTyping, setIsTyping] = useState(false);
  const [shakeEffect, setShakeEffect] = useState(false); // Dynamic screen shake
  const [backgroundGlitch, setBackgroundGlitch] = useState(false);

  // Timeout refs for cleanup - prevents memory leaks when component unmounts
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sound system integration
  const { playSFX: playSoundEffect, playMusic: playMusicEffect, stopMusic } = useSoundSystem();

  // Save system integration - replaces direct localStorage usage
  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();

  // Sound wrapper functions - encapsulate isMuted check for consistency
  const playSFX = useCallback((sound: Parameters<typeof playSoundEffect>[0]) => {
    if (!isMuted) {
      playSoundEffect(sound);
    }
  }, [isMuted, playSoundEffect]);

  const playMusic = useCallback((track: Parameters<typeof playMusicEffect>[0]) => {
    if (!isMuted) {
      playMusicEffect(track);
    }
  }, [isMuted, playMusicEffect]);

  // Achievement unlock function - calls BOTH achievementManager (for UI notification) AND useSaveSystem (for persistence)
  const unlockAchievement = useCallback((achievementId: string) => {
    if (achievementManager?.unlockAchievement) {
      achievementManager.unlockAchievement('terminalQuest', achievementId);
    }
    // Also persist via useSaveSystem - this was previously missing and caused achievements to be lost between sessions
    unlockSaveAchievement('terminalQuest', achievementId);
  }, [achievementManager, unlockSaveAchievement]);
  
  // Track various achievement conditions
  const hasFirstChoice = React.useRef(false);
  const combatVictories = React.useRef(0);
  
  // Start background music when component mounts
  useEffect(() => {
    playMusic('menu');
    return () => stopMusic();
  }, [playMusic, stopMusic]);

  const triggerShake = () => {
    setShakeEffect(true);
    // Clear any existing shake timeout before setting new one
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    shakeTimeoutRef.current = setTimeout(() => {
      setShakeEffect(false);
      shakeTimeoutRef.current = null;
    }, 500); // Brief screen shake
  };

  // Function for calculating effects from a choice
  const applyChoiceEffects = useCallback((state: GameState, choice: Choice): GameState => {
    const updatedInventory = [...state.inventory];
    const newXP = state.experience + (choice.xp || 0);
    const newAchievements = [...state.achievements];

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

    const healAmount = choice.heal || 0;
    const damageAmount = choice.damage || 0;
    const newHealth = Math.max(0, Math.min(state.maxHealth, state.health - damageAmount + healAmount));
    const newSecurity = Math.max(0, Math.min(100, state.securityLevel + (choice.security || 0)));

    // Global achievement system checks
    // First choice achievement
    if (!hasFirstChoice.current && state.choiceCount === 0) {
      hasFirstChoice.current = true;
      unlockAchievement('quest_first_choice');
    }

    // Tool collector achievement (5 different items)
    if (updatedInventory.length >= 5) {
      unlockAchievement('quest_tool_collector');
    }

    // Survivor achievement - check health maintained
    if (newHealth === state.maxHealth && state.choiceCount >= 10) {
      unlockAchievement('quest_survivor');
    }

    // Code quality achievement (assuming security level represents code quality)
    if (newSecurity >= 90) {
      unlockAchievement('quest_code_master');
    }

    // Team morale achievement (assuming health represents team morale in context)
    if (newHealth >= 80) {
      unlockAchievement('quest_team_leader');
    }

    // Check if reaching an ending
    const endingNodes = ['ending_hero', 'ending_sacrifice', 'ending_neutral', 'ending_villain'];
    if (endingNodes.includes(choice.nextNode)) {
      unlockAchievement('quest_story_end');
    }

    return {
      ...state,
      currentNode: choice.nextNode,
      inventory: updatedInventory,
      health: newHealth,
      securityLevel: newSecurity,
      experience: newXP,
      achievements: newAchievements,
      choiceCount: state.choiceCount + 1,
      discovered: state.discovered.includes(choice.nextNode)
        ? state.discovered
        : [...state.discovered, choice.nextNode]
    };
  }, [unlockAchievement]);

  // Handler for choice actions
  const handleChoice = useCallback((choice: Choice) => {

    // Play sound effects based on choice type
    playSFX('terminalType');

    // Check damage effects - use current state via setter
    setGameState(prev => {
      if (choice.damage && prev.health <= choice.damage) {
        triggerShake(); // Big damage causes a shake
        playSFX('hit');
      }
      if (choice.security) {
        setBackgroundGlitch(b => !b); // Glitch background on security risks
        // Clear any existing glitch timeout before setting new one
        if (glitchTimeoutRef.current) {
          clearTimeout(glitchTimeoutRef.current);
        }
        glitchTimeoutRef.current = setTimeout(() => {
          setBackgroundGlitch(b => !b);
          glitchTimeoutRef.current = null;
        }, 1000);
        playSFX('hit');
      }
      if (choice.gives) {
        playSFX('powerup');
      }
      if (choice.heal) {
        playSFX('score');
      }

      // Core state update remains consistent
      return applyChoiceEffects(prev, choice);
    });
  }, [playSFX, applyChoiceEffects]);

  // Custom hook for ASCII typing - optimised with RAF
  const useTypingEffect = (text: string) => {
    const [typedText, setTypedText] = useState('');
    const indexRef = useRef(0);
    const lastTimeRef = useRef(0);

    useEffect(() => {
      let animationId: number;
      let isMounted = true;

      // Reset state
      setTypedText('');
      setIsTyping(true);
      indexRef.current = 0;
      lastTimeRef.current = 0;

      const animate = (timestamp: number) => {
        if (!isMounted) return;

        // Control typing speed (30ms per character)
        if (timestamp - lastTimeRef.current >= 30) {
          lastTimeRef.current = timestamp;

          if (indexRef.current < text.length) {
            indexRef.current++;
            // Use slice for better performance than substring
            setTypedText(text.slice(0, indexRef.current));
            animationId = requestAnimationFrame(animate);
          } else {
            setIsTyping(false);
          }
        } else {
          animationId = requestAnimationFrame(animate);
        }
      };

      animationId = requestAnimationFrame(animate);

      return () => {
        isMounted = false;
        cancelAnimationFrame(animationId);
      };
    }, [text]);

    return typedText;
  };

  // Combat handler
  const handleCombatEnd = (victory: boolean, damageDealt: number, damageTaken: number) => {
    setGamePhase('exploring');

    if (victory) {
      const xpGain = Math.floor(damageDealt / 2);
      setGameState(prev => ({
        ...prev,
        experience: prev.experience + xpGain,
        health: Math.max(0, prev.health - damageTaken),
        currentNode: 'hub_main' // Return to hub after combat
      }));
      triggerShake();
      
      // Track combat victories
      combatVictories.current += 1;
      if (combatVictories.current >= 10) {
        unlockAchievement('quest_combat_victor');
      }
    } else {
      setGameState(prev => ({
        ...prev,
        health: 0,
        currentNode: 'game_over'
      }));
    }
  };

  // Save/Load functionality using useSaveSystem
  const saveGame = useCallback(() => {
    updateGameSave('terminalQuest', {
      highScore: gameState.experience,
      stats: {
        gamesPlayed: saveData.games.terminalQuest?.stats?.gamesPlayed || 0,
        totalScore: (saveData.games.terminalQuest?.stats?.totalScore || 0) + gameState.experience,
        longestSurvival: Math.max(
          saveData.games.terminalQuest?.stats?.longestSurvival || 0,
          gameState.health
        )
      },
      preferences: {
        savedGameState: gameState
      }
    });
  }, [gameState, updateGameSave, saveData.games.terminalQuest]);

  const loadGame = useCallback(() => {
    const savedState = saveData.games.terminalQuest?.preferences?.savedGameState as GameState | undefined;
    if (savedState) {
      setGameState(savedState);
    }
  }, [saveData.games.terminalQuest]);

  // Derive saveExists from saveData - no need for separate state
  const saveExists = !!saveData.games.terminalQuest?.preferences?.savedGameState;

  // Restart game function
  const restartGame = useCallback(() => {
    setGameState({
      currentNode: 'start',
      inventory: [],
      health: 100,
      maxHealth: 100,
      securityLevel: 50,
      discovered: ['start'],
      experience: 0,
      achievements: [],
      choiceCount: 0
    });
    setGamePhase('exploring');
    hasFirstChoice.current = false;
    combatVictories.current = 0;
  }, []);

  // Keyboard handler for P (pause), R (restart), and ENTER (confirm/start)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        // Toggle pause - only allowed when exploring or already paused
        setGamePhase(prev => prev === 'paused' ? 'exploring' : prev === 'exploring' ? 'paused' : prev);
      } else if (e.key === 'r' || e.key === 'R') {
        restartGame();
      } else if (e.key === 'Enter') {
        // Skip typing effect if still typing
        if (isTyping) {
          setIsTyping(false);
          return;
        }

        // If paused, resume
        if (gamePhase === 'paused') {
          setGamePhase('exploring');
          return;
        }

        // If there are choices available and not in combat, select the first one
        const node = GAME_NODES[gameState.currentNode];
        if (gamePhase === 'exploring' && node?.choices && node.choices.length > 0) {
          const firstEnabledChoice = node.choices.find(choice => {
            const isDisabled = choice.requires &&
              !choice.requires.every(req => gameState.inventory.includes(req));
            return !isDisabled;
          });

          if (firstEnabledChoice) {
            handleChoice(firstEnabledChoice);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [restartGame, isTyping, gamePhase, gameState.currentNode, gameState.inventory, handleChoice]);

  // Cleanup timeout refs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
      if (glitchTimeoutRef.current) {
        clearTimeout(glitchTimeoutRef.current);
      }
    };
  }, []);

  const currentNode = GAME_NODES[gameState.currentNode];
  const typedDescription = useTypingEffect(currentNode?.description || '');

  // Handle combat nodes - moved to useEffect to avoid state update during render
  useEffect(() => {
    if (currentNode?.isCombat && currentNode.enemy && gamePhase === 'exploring') {
      setGamePhase('combat');
    }
  }, [currentNode, gamePhase]);

  return (
    <div
      className={`relative w-full h-full bg-black text-green-500 font-mono flex flex-col ${shakeEffect ? 'shake-animation' : ''} ${backgroundGlitch ? 'bg-glitch-effect' : ''}`}
    >
      {/* Pause Overlay */}
      {gamePhase === 'paused' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center p-8 border-2 border-green-500 bg-black rounded-lg shadow-[0_0_20px_#00ff00]">
            <h2 className="text-3xl font-bold text-green-500 mb-4" style={{ textShadow: '0 0 10px #00ff00' }}>
              PAUSED
            </h2>
            <p className="text-green-400 mb-2">XP: {gameState.experience}</p>
            <p className="text-green-400 mb-4">Health: {gameState.health}/{gameState.maxHealth}</p>
            <p className="text-sm text-green-300">Press P to resume</p>
            <p className="text-sm text-green-300">Press R to restart</p>
            <p className="text-sm text-green-300">Press ESC to exit</p>
          </div>
        </div>
      )}
      {/* Header with Dynamic Indicators */}
      <header className="flex justify-between items-center p-4 bg-black border-b border-green-500">
        <h2 className="text-lg tracking-wide flex items-center gap-2">
          <TerminalIcon className="w-5 h-5" />
          TERMINAL QUEST - XP: {gameState.experience}
        </h2>
        <div className="flex gap-4 items-center">
          <Indicator title="Health" value={gameState.health} icon={<Shield />} />
          <Indicator title="Signal" value={100 - gameState.securityLevel} icon={<Wifi />} />
          <button
            onClick={saveGame}
            className="p-2 hover:bg-green-900 rounded transition-colors"
            title="Save Game"
          >
            <Save className="w-4 h-4" />
          </button>
          {saveExists && (
            <button
              onClick={loadGame}
              className="p-2 hover:bg-green-900 rounded transition-colors"
              title="Load Game"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setGameState({...gameState, currentNode: 'hub_main'})}
            className="p-2 hover:bg-green-900 rounded transition-colors"
            title="Return to Hub"
          >
            <MapIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Terminal Content */}
      <main className="flex-1 p-4 overflow-y-auto bg-opacity-90">
        {gamePhase === 'combat' && currentNode?.enemy ? (
          <TerminalQuestCombat
            enemy={currentNode.enemy}
            playerHealth={gameState.health}
            playerInventory={gameState.inventory}
            onCombatEnd={handleCombatEnd}
            achievementManager={achievementManager}
            isMuted={isMuted}
          />
        ) : (
          <>
            {/* ASCII Animation */}
            <pre className="mb-4 leading-snug text-green-500 whitespace-pre-wrap">
              {currentNode?.ascii.join('\n') || 'ERROR: NODE NOT FOUND'}
            </pre>

            {/* Typing Description */}
            <div 
              className="mb-4 min-h-[80px] p-3 border border-green-700 rounded bg-opacity-75 bg-black relative cursor-pointer hover:bg-green-900/20 transition-colors"
              onClick={() => {
                if (isTyping) {
                  setIsTyping(false);
                  // Force complete the typing immediately
                  const input = document.querySelector('.typing-target') as HTMLParagraphElement;
                  if (input && currentNode?.description) {
                    input.textContent = currentNode.description;
                  }
                }
              }}
              title={isTyping ? "Click to skip typing" : ""}
            >
              <p className="text-green-400 typing-target">
                {typedDescription}
                {isTyping && <span className="animate-pulse">█</span>}
              </p>
              {isTyping && (
                <p className="text-xs text-green-500/70 italic mt-2">
                  → Click to skip typing effect
                </p>
              )}
            </div>

            {/* Choices List */}
            <div className="space-y-4">
              {!isTyping && currentNode?.choices &&
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
                      <div className="flex justify-between items-center">
                        <span>➤ {choice.text}</span>
                        {choice.requires && (
                          <span className="text-xs text-yellow-400">
                            Requires: {choice.requires.join(', ')}
                          </span>
                        )}
                      </div>
                      {(choice.damage || choice.heal || choice.xp) && (
                        <div className="text-xs mt-1 flex gap-4">
                          {choice.damage && <span className="text-red-400">-{choice.damage} HP</span>}
                          {choice.heal && <span className="text-green-400">+{choice.heal} HP</span>}
                          {choice.xp && <span className="text-yellow-400">+{choice.xp} XP</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </>
        )}
      </main>

      {/* Inventory Panel */}
      <footer className="p-4 bg-black border-t border-green-500 flex flex-wrap gap-2">
        {gameState.inventory.map((item, index) => (
          <InventoryBadge key={index} item={item} />
        ))}
      </footer>

      
      {/* Background Glitch Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
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
      }} />
    </div>
  );
}