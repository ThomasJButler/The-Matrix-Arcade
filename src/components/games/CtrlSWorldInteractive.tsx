import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coffee, 
  Code, 
  Users, 
  Trophy, 
  Bug,
  GitBranch,
  Terminal,
  Zap,
  Brain,
  Maximize,
  Minimize,
} from 'lucide-react';
import { EPIC_STORY, INITIAL_STATE, GameState, Choice, calculateTeamMood, getRandomBugFact, INVENTORY_ITEMS } from './CtrlSWorldContent';
import { AdvancedVoiceControls } from '../ui/AdvancedVoiceControls';
import { useAdvancedVoice } from '../../hooks/useAdvancedVoice';

interface GameStatsProps {
  gameState: GameState;
}

const GameStats: React.FC<GameStatsProps> = ({ gameState }) => {
  const getStatColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const StatBar = ({ value, max = 100, label, icon }: { value: number; max?: number; label: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-xs text-green-400 min-w-[80px]">{label}:</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full ${getStatColor(value)} bg-current`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className={`text-xs ${getStatColor(value)} min-w-[30px]`}>{value}%</span>
    </div>
  );

  return (
    <div className="bg-black/50 border border-green-500/30 rounded-lg p-4 mb-4">
      <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
        <Terminal className="w-4 h-4" />
        Developer Stats
      </h3>
      
      <StatBar 
        value={gameState.coffeeLevel} 
        label="Caffeine" 
        icon={<Coffee className="w-4 h-4 text-yellow-600" />} 
      />
      
      <StatBar 
        value={Math.max(0, 100 - gameState.stressLevel)} 
        label="Sanity" 
        icon={<Brain className="w-4 h-4 text-blue-400" />} 
      />
      
      <StatBar 
        value={gameState.codeQuality} 
        label="Code Quality" 
        icon={<Code className="w-4 h-4 text-purple-400" />} 
      />
      
      <StatBar 
        value={gameState.teamMorale} 
        label="Team Morale" 
        icon={<Users className="w-4 h-4 text-pink-400" />} 
      />

      <div className="mt-3 text-xs text-green-300">
        Team Mood: {calculateTeamMood(gameState)}
      </div>
    </div>
  );
};

interface InventoryProps {
  inventory: string[];
}

const Inventory: React.FC<InventoryProps> = ({ inventory }) => (
  <div className="bg-black/50 border border-green-500/30 rounded-lg p-4 mb-4">
    <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
      <GitBranch className="w-4 h-4" />
      Developer Kit
    </h3>
    
    <div className="flex flex-wrap gap-2">
      {inventory.map((item, index) => {
        const itemData = INVENTORY_ITEMS[item as keyof typeof INVENTORY_ITEMS];
        return (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-green-900/30 border border-green-500/50 rounded px-2 py-1 text-xs flex items-center gap-1"
            title={itemData?.description || item}
          >
            <span>{itemData?.emoji || '📦'}</span>
            <span>{itemData?.name || item}</span>
          </motion.div>
        );
      })}
    </div>
    
    {inventory.length === 0 && (
      <p className="text-gray-500 text-xs italic">Your backpack is empty (like your soul after debugging for 8 hours)</p>
    )}
  </div>
);

interface AchievementNotificationProps {
  achievement: string;
  onClose: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ achievement, onClose }) => (
  <motion.div
    initial={{ x: 300, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 300, opacity: 0 }}
    className="fixed top-4 right-4 bg-yellow-600 text-black p-4 rounded-lg border-2 border-yellow-400 z-50"
  >
    <div className="flex items-center gap-2">
      <Trophy className="w-5 h-5" />
      <div>
        <div className="font-bold">Achievement Unlocked!</div>
        <div className="text-sm">{achievement}</div>
      </div>
    </div>
    <button 
      onClick={onClose}
      className="absolute top-1 right-1 text-black hover:text-red-600 text-lg leading-none"
    >
      ×
    </button>
  </motion.div>
);

interface ChoiceButtonProps {
  choice: Choice;
  onClick: () => void;
  gameState: GameState;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ choice, onClick, gameState }) => {
  const isDisabled = choice.requires && !choice.requires.every(item => gameState.inventory.includes(item));
  
  const getChoicePreview = () => {
    const effects = [];
    if (choice.coffeeLevel) effects.push(`☕ ${choice.coffeeLevel > 0 ? '+' : ''}${choice.coffeeLevel}`);
    if (choice.stressLevel) effects.push(`🧠 ${choice.stressLevel > 0 ? '+' : ''}${choice.stressLevel} stress`);
    if (choice.codeQuality) effects.push(`💻 ${choice.codeQuality > 0 ? '+' : ''}${choice.codeQuality} quality`);
    if (choice.gives?.length) effects.push(`📦 +${choice.gives.join(', ')}`);
    return effects.join(' | ');
  };

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full text-left p-4 border-2 rounded-lg transition-all duration-200 ${
        isDisabled
          ? 'border-gray-600 text-gray-500 bg-gray-900/20 cursor-not-allowed'
          : 'border-green-500 text-green-300 bg-green-900/20 hover:bg-green-900/40 hover:border-green-400'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Code className="w-4 h-4" />
        <span className="font-mono">{choice.text}</span>
      </div>
      
      {choice.requires && (
        <div className="text-xs text-yellow-400 mb-1">
          Requires: {choice.requires.join(', ')}
        </div>
      )}
      
      <div className="text-xs text-gray-400">
        {getChoicePreview()}
      </div>
    </motion.button>
  );
};

interface CoffeeMiniGameProps {
  onComplete: (coffeeGain: number) => void;
}

const CoffeeMiniGame: React.FC<CoffeeMiniGameProps> = ({ onComplete }) => {
  const [brewTime, setBrewTime] = useState(0);
  const [isBrewingOptimal, setIsBrewingOptimal] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    if (gameEnded) return;
    
    const interval = setInterval(() => {
      setBrewTime(prev => {
        const newTime = prev + 1;
        setIsBrewingOptimal(newTime >= 30 && newTime <= 50);
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameEnded]);

  const handleBrew = () => {
    setGameEnded(true);
    let coffeeGain = 20;
    
    if (isBrewingOptimal) {
      coffeeGain = 40;
    } else if (brewTime < 20) {
      coffeeGain = 10;
    } else if (brewTime > 60) {
      coffeeGain = 5;
    }
    
    setTimeout(() => onComplete(coffeeGain), 1000);
  };

  return (
    <div className="bg-black border-2 border-yellow-600 rounded-lg p-6 text-center">
      <h3 className="text-yellow-400 font-bold mb-4">☕ Coffee Brewing Mini-Game ☕</h3>
      
      <div className="mb-4">
        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
          <motion.div
            className={`h-full transition-colors duration-200 ${
              isBrewingOptimal ? 'bg-green-500' : brewTime > 60 ? 'bg-red-500' : 'bg-yellow-500'
            }`}
            animate={{ width: `${Math.min(100, brewTime)}%` }}
          />
        </div>
        <p className="text-xs mt-2">
          {isBrewingOptimal ? '🎯 Perfect brewing time!' : brewTime > 60 ? '🔥 Overbrewed!' : '⏰ Brewing...'}
        </p>
      </div>
      
      <button
        onClick={handleBrew}
        disabled={gameEnded}
        className="px-6 py-3 bg-yellow-600 text-black font-bold rounded hover:bg-yellow-500 disabled:opacity-50"
      >
        {gameEnded ? 'Brewing Complete!' : 'Stop Brewing'}
      </button>
    </div>
  );
};

export default function CtrlSWorldInteractive() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [currentParagraphs, setCurrentParagraphs] = useState<string[]>([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [showBugFact, setShowBugFact] = useState(false);
  const [bugFact, setBugFact] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const choicesRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  
  // Initialize advanced voice system
  const { 
    config: voiceConfig, 
    isSupported: voiceSupported,
    isSpeaking,
    speak: speakWithAdvancedVoice, 
    stop: stopVoice,
  } = useAdvancedVoice();

  const currentNode = EPIC_STORY[gameState.currentNode];

  // Handle voice narration with advanced features
  const handleVoiceNarration = useCallback((content: string | string[]) => {
    // Only speak if voice is supported and enabled
    if (voiceSupported && voiceConfig && voiceConfig.enabled && content) {
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        // Final check before speaking
        if (voiceConfig.enabled) {
          speakWithAdvancedVoice(content);
        }
      }, 500);
    }
  }, [voiceSupported, voiceConfig, speakWithAdvancedVoice]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Start typing when node changes
  useEffect(() => {
    setCurrentParagraphs([]);
    setCurrentParagraphIndex(0);
    setCurrentCharIndex(0);
    setIsTyping(true);
  }, [gameState.currentNode]);

  // Enhanced typing effect with paragraph support and Shatner voice
  useEffect(() => {
    if (!currentNode || !isTyping || !currentNode.content) return;

    const paragraphs = currentNode.content;
    const currentParagraph = paragraphs[currentParagraphIndex];
    
    if (!currentParagraph) {
      setIsTyping(false);
      // Start voice narration when typing is complete
      // Pass array of paragraphs for better pacing
      handleVoiceNarration(currentNode.content);
      return;
    }

    if (currentCharIndex < currentParagraph.length) {
      const timer = setTimeout(() => {
        setCurrentParagraphs(prev => {
          const newParagraphs = [...prev];
          if (!newParagraphs[currentParagraphIndex]) {
            newParagraphs[currentParagraphIndex] = '';
          }
          newParagraphs[currentParagraphIndex] = currentParagraph.slice(0, currentCharIndex + 1);
          return newParagraphs;
        });
        setCurrentCharIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    } else {
      // Move to next paragraph
      if (currentParagraphIndex < paragraphs.length - 1) {
        const timer = setTimeout(() => {
          setCurrentParagraphIndex(prev => prev + 1);
          setCurrentCharIndex(0);
        }, 800); // Pause between paragraphs
        return () => clearTimeout(timer);
      } else {
        setIsTyping(false);
        // Start voice narration when typing is complete
        handleVoiceNarration(currentNode.content);
      }
    }
  }, [currentNode, isTyping, currentParagraphIndex, currentCharIndex, handleVoiceNarration]);

  const makeChoice = useCallback((choice: Choice) => {
    // Stop any current narration when making a choice
    stopVoice();
    
    const newGameState = { ...gameState };
    
    // Apply choice effects
    if (choice.coffeeLevel) {
      newGameState.coffeeLevel = Math.max(0, Math.min(100, newGameState.coffeeLevel + choice.coffeeLevel));
    }
    if (choice.stressLevel) {
      newGameState.stressLevel = Math.max(0, Math.min(100, newGameState.stressLevel + choice.stressLevel));
    }
    if (choice.codeQuality) {
      newGameState.codeQuality = Math.max(0, Math.min(100, newGameState.codeQuality + choice.codeQuality));
    }
    if (choice.gives) {
      choice.gives.forEach(item => {
        if (!newGameState.inventory.includes(item)) {
          newGameState.inventory.push(item);
        }
      });
    }
    if (choice.removes) {
      choice.removes.forEach(item => {
        const index = newGameState.inventory.indexOf(item);
        if (index > -1) {
          newGameState.inventory.splice(index, 1);
        }
      });
    }
    
    // Track choices
    newGameState.choices.push(choice.text);
    newGameState.currentNode = choice.nextNode;
    
    // Check for achievements
    if (newGameState.coffeeLevel >= 100 && !newGameState.achievements.includes('Coffee Overdose')) {
      newGameState.achievements.push('Coffee Overdose');
      setNewAchievement('Coffee Overdose - Maximum caffeine achieved!');
    }
    
    if (newGameState.codeQuality >= 90 && !newGameState.achievements.includes('Clean Code Master')) {
      newGameState.achievements.push('Clean Code Master');
      setNewAchievement('Clean Code Master - Your code is poetry!');
    }
    
    setGameState(newGameState);
    
    // Random bug fact
    if (Math.random() < 0.3) {
      setBugFact(getRandomBugFact());
      setShowBugFact(true);
    }
  }, [gameState, stopVoice]);

  const handleCoffeeMiniGame = (coffeeGain: number) => {
    setShowMiniGame(false);
    setGameState(prev => ({
      ...prev,
      coffeeLevel: Math.min(100, prev.coffeeLevel + coffeeGain)
    }));
  };

  if (!currentNode) {
    return <div className="text-red-500">Error: Story node not found!</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-black text-green-500 font-mono flex ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 p-2 bg-green-900/80 hover:bg-green-800 border border-green-500/50 rounded backdrop-blur-sm transition-colors"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>
      
      {/* Main Story Panel */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Scrollable Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar">
          {/* Chapter Title */}
          <motion.h1 
            key={currentNode.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-green-400 mb-4 border-b border-green-500 pb-2 flex-shrink-0"
          >
            {currentNode.title}
          </motion.h1>
          
          {/* ASCII Art */}
          {currentNode.ascii && (
            <motion.pre 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-300 text-sm mb-4 text-center leading-tight flex-shrink-0"
            >
              {currentNode.ascii.join('\n')}
            </motion.pre>
          )}
          
          {/* Story Text */}
          <div 
            className="flex-1 mb-4 p-4 bg-gray-900/30 rounded-lg border border-green-500/30 min-h-[200px] cursor-pointer hover:bg-gray-900/40 transition-colors"
            onClick={() => {
              if (isTyping) {
                // Skip typing effect and show all content immediately
                setCurrentParagraphs(currentNode?.content || []);
                setIsTyping(false);
                // Start voice narration immediately when skipping
                if (voiceConfig.enabled && currentNode?.content) {
                  handleVoiceNarration(currentNode.content);
                }
              }
            }}
            title={isTyping ? 'Click to skip typing effect' : ''}
          >
            <div className="text-green-300 leading-relaxed space-y-4" ref={textContentRef}>
              {currentParagraphs.map((paragraph, index) => (
                <p key={index} className="text-green-300 leading-relaxed">
                  {voiceConfig.highlightText && isSpeaking && !isTyping ? (
                    paragraph.split(' ').map((word, wordIndex) => {
                      const globalWordIndex = currentParagraphs
                        .slice(0, index)
                        .join(' ')
                        .split(' ').length + wordIndex;
                      return (
                        <span
                          key={wordIndex}
                          className={`${
                            globalWordIndex === highlightedWord
                              ? 'bg-green-500/30 text-green-100 px-1 rounded'
                              : ''
                          } transition-all duration-200`}
                        >
                          {word}{' '}
                        </span>
                      );
                    })
                  ) : (
                    <>
                      {paragraph}
                      {isTyping && index === currentParagraphIndex && (
                        <span className="animate-pulse ml-1">▌</span>
                      )}
                    </>
                  )}
                </p>
              ))}
              {currentParagraphs.length === 0 && isTyping && (
                <p className="text-green-300 leading-relaxed">
                  <span className="animate-pulse">▌</span>
                </p>
              )}
              {isTyping && (
                <p className="text-xs text-green-500/70 italic mt-4">
                  → Click anywhere to skip typing effect
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Fixed Choices Area - Always visible at bottom */}
        {!isTyping && currentNode.choices && (
          <motion.div 
            ref={choicesRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 space-y-3 mt-4 pt-4 border-t border-green-500/30 bg-black/50 backdrop-blur-sm"
          >
            <div className="text-xs text-green-400 mb-2 flex items-center gap-2">
              <span className="animate-pulse">▶</span>
              Choose your path:
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {currentNode.choices.map((choice, index) => (
                <ChoiceButton
                  key={index}
                  choice={choice}
                  onClick={() => {
                    if (currentNode.minigame === 'coffee_brewing') {
                      setShowMiniGame(true);
                    } else {
                      makeChoice(choice);
                    }
                  }}
                  gameState={gameState}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Right Sidebar */}
      <div className="w-80 p-4 border-l border-green-500/50">
        <GameStats gameState={gameState} />
        <Inventory inventory={gameState.inventory} />
        
        {/* Advanced Voice Controls */}
        <AdvancedVoiceControls 
          text={currentNode.content}
          onTextHighlight={setHighlightedWord}
          className="mb-4"
        />
        
        {/* Random Developer Tip */}
        <div className="bg-black/50 border border-blue-500/30 rounded-lg p-3 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <Bug className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-bold">Developer Tip</span>
          </div>
          <p className="text-blue-300">
            "The best way to debug is to have good logs. The second best way is to ask the rubber duck."
          </p>
        </div>
      </div>
      
      {/* Mini-Game Modal */}
      <AnimatePresence>
        {showMiniGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <CoffeeMiniGame onComplete={handleCoffeeMiniGame} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Achievement Notification */}
      <AnimatePresence>
        {newAchievement && (
          <AchievementNotification
            achievement={newAchievement}
            onClose={() => setNewAchievement(null)}
          />
        )}
      </AnimatePresence>
      
      {/* Bug Fact Modal */}
      <AnimatePresence>
        {showBugFact && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 left-4 bg-yellow-900 border-2 border-yellow-500 rounded-lg p-4 max-w-md z-40"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold">Random Bug Fact!</span>
            </div>
            <p className="text-yellow-100 text-sm">{bugFact}</p>
            <button 
              onClick={() => setShowBugFact(false)}
              className="mt-2 text-xs text-yellow-300 hover:text-yellow-100"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}