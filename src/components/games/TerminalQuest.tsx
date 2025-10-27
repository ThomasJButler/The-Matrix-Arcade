import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal as TerminalIcon, Info, Shield, Wifi, Key, AlertTriangle, Cpu, Save, RotateCcw, Map as MapIcon } from 'lucide-react';
import { EXPANDED_GAME_NODES, Choice } from './TerminalQuestContent';
import { useSoundSystem } from '../../hooks/useSoundSystem';
import TerminalQuestCombat from './TerminalQuestCombat';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface TerminalQuestProps {
  achievementManager?: AchievementManager;
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

export default function TerminalQuest({ achievementManager }: TerminalQuestProps) {
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
  const [inCombat, setInCombat] = useState(false);
  const [saveExists, setSaveExists] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [shakeEffect, setShakeEffect] = useState(false); // Dynamic screen shake
  const [backgroundGlitch, setBackgroundGlitch] = useState(false);

  // Sound system integration
  const { playSFX, playMusic, stopMusic } = useSoundSystem();
  
  // Achievement unlock function
  const unlockAchievement = useCallback((achievementId: string) => {
    if (achievementManager?.unlockAchievement) {
      achievementManager.unlockAchievement('terminalQuest', achievementId);
    }
  }, [achievementManager]);
  
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
    setTimeout(() => setShakeEffect(false), 500); // Brief screen shake
  };

  const toggleBackgroundGlitch = () => {
    setBackgroundGlitch(!backgroundGlitch);
  };

  // Handler for choice actions
  const handleChoice = (choice: Choice) => {
    
    // Play sound effects based on choice type
    playSFX('terminalType');
    
    if (choice.damage && gameState.health <= choice.damage) {
      triggerShake(); // Big damage causes a shake
      playSFX('hit');
    }
    if (choice.security) {
      toggleBackgroundGlitch(); // Glitch background on security risks
      setTimeout(() => toggleBackgroundGlitch(), 1000);
      playSFX('hit');
    }
    if (choice.gives) {
      playSFX('powerup');
    }
    if (choice.heal) {
      playSFX('score');
    }

    // Core state update remains consistent
    const newState = applyChoiceEffects(gameState, choice);
    setGameState(newState);
  };

  // Function for calculating effects from a choice
  const applyChoiceEffects = (state: GameState, choice: Choice): GameState => {
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

    // Check achievements
    if (newXP >= 100 && !state.achievements.includes('first_100_xp')) {
      newAchievements.push('first_100_xp');
    }
    if (state.choiceCount === 0 && choice.nextNode.includes('combat')) {
      newAchievements.push('first_combat');
    }
    if (updatedInventory.length >= 10 && !state.achievements.includes('collector')) {
      newAchievements.push('collector');
    }
    
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
  };

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
    setInCombat(false);
    
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

  // Save/Load functionality
  const saveGame = () => {
    const saveData = {
      gameState,
      timestamp: Date.now()
    };
    localStorage.setItem('terminalQuestSave', JSON.stringify(saveData));
    setSaveExists(true);
  };

  const loadGame = () => {
    const savedData = localStorage.getItem('terminalQuestSave');
    if (savedData) {
      const { gameState: loadedState } = JSON.parse(savedData);
      setGameState(loadedState);
    }
  };

  // Check for save on mount
  useEffect(() => {
    setSaveExists(!!localStorage.getItem('terminalQuestSave'));
  }, []);

  const currentNode = GAME_NODES[gameState.currentNode];
  const typedDescription = useTypingEffect(currentNode?.description || '');

  // Handle combat nodes - moved to useEffect to avoid state update during render
  useEffect(() => {
    if (currentNode?.isCombat && currentNode.enemy && !inCombat) {
      setInCombat(true);
    }
  }, [currentNode, inCombat]);

  return (
    <div
      className={`relative w-full h-full bg-black text-green-500 font-mono flex flex-col ${shakeEffect ? 'shake-animation' : ''} ${backgroundGlitch ? 'bg-glitch-effect' : ''}`}
    >
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
        {inCombat && currentNode?.enemy ? (
          <TerminalQuestCombat
            enemy={currentNode.enemy}
            playerHealth={gameState.health}
            playerInventory={gameState.inventory}
            onCombatEnd={handleCombatEnd}
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