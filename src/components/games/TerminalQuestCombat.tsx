import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Zap, Heart, AlertTriangle } from 'lucide-react';
import { Enemy } from './TerminalQuestContent';
import { useSoundSystem } from '../../hooks/useSoundSystem';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface CombatScreenProps {
  enemy: Enemy;
  playerHealth: number;
  playerInventory: string[];
  onCombatEnd: (victory: boolean, damageDealt: number, damageTaken: number) => void;
  achievementManager?: AchievementManager;
  isMuted?: boolean;
}

export default function TerminalQuestCombat({
  enemy,
  playerHealth,
  playerInventory,
  onCombatEnd,
  achievementManager: _achievementManager,
  isMuted = false
}: CombatScreenProps) {
  const [enemyHealth, setEnemyHealth] = useState(enemy.health);
  const [currentPlayerHealth, setCurrentPlayerHealth] = useState(playerHealth);
  const [combatLog, setCombatLog] = useState<string[]>([`${enemy.name} appears!`]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);

  // Refs for keyboard handlers to avoid stale closures
  const handlersRef = useRef<{
    attack: () => void;
    defend: () => void;
    item: (item: string) => void;
  }>({ attack: () => {}, defend: () => {}, item: () => {} });

  // Sound system integration
  const { playSFX } = useSoundSystem();

  // Get available combat items for keyboard shortcuts
  const getCombatItems = useCallback(() => {
    const items: string[] = [];
    if (playerInventory.includes('health_pack')) items.push('health_pack');
    if (playerInventory.includes('emp_device')) items.push('emp_device');
    if (playerInventory.includes('ally_beacon')) items.push('ally_beacon');
    return items;
  }, [playerInventory]);

  // Calculate player damage based on inventory
  const getPlayerDamage = () => {
    let baseDamage = 15;
    if (playerInventory.includes('system_exploit')) baseDamage += 10;
    if (playerInventory.includes('performance_boost')) baseDamage += 5;
    if (playerInventory.includes('antivirus') && enemy.name.includes('Virus')) baseDamage += 15;
    return baseDamage + Math.floor(Math.random() * 10);
  };

  // Calculate player defense
  const getPlayerDefense = () => {
    let defense = 0;
    if (playerInventory.includes('firewall_boost')) defense += 5;
    if (playerInventory.includes('radiation_suit')) defense += 3;
    if (playerInventory.includes('invulnerability')) defense += 100;
    return defense;
  };

  const handleAttack = () => {
    if (!isPlayerTurn || isAnimating) return;

    setIsAnimating(true);
    const damage = getPlayerDamage();
    const newEnemyHealth = Math.max(0, enemyHealth - damage);

    if (!isMuted) {
      playSFX('hit');
    }

    setCombatLog(prev => [...prev, `You deal ${damage} damage!`]);
    setEnemyHealth(newEnemyHealth);

    if (newEnemyHealth <= 0) {
      setTimeout(() => {
        if (!isMuted) {
          playSFX('score');
        }
        setCombatLog(prev => [...prev, `${enemy.name} defeated!`]);
        onCombatEnd(true, enemy.health, playerHealth - currentPlayerHealth);
      }, 1000);
    } else {
      setTimeout(() => enemyTurn(), 1500);
    }
  };

  const handleDefend = () => {
    if (!isPlayerTurn || isAnimating) return;

    setIsAnimating(true);
    if (!isMuted) {
      playSFX('powerup');
    }
    setCombatLog(prev => [...prev, 'You take a defensive stance...']);

    // Heal a small amount
    const healAmount = 5 + getPlayerDefense();
    setCurrentPlayerHealth(prev => Math.min(playerHealth, prev + healAmount));

    setTimeout(() => enemyTurn(), 1500);
  };

  const handleItem = (item: string) => {
    if (!isPlayerTurn || isAnimating) return;

    setIsAnimating(true);

    switch (item) {
      case 'health_pack': {
        const healAmount = 50;
        setCurrentPlayerHealth(prev => Math.min(playerHealth, prev + healAmount));
        if (!isMuted) {
          playSFX('powerup');
        }
        setCombatLog(prev => [...prev, `Health Pack used! +${healAmount} HP`]);
        break;
      }
      case 'emp_device': {
        const empDamage = 40;
        setEnemyHealth(prev => Math.max(0, prev - empDamage));
        if (!isMuted) {
          playSFX('hit');
        }
        setCombatLog(prev => [...prev, `EMP blast deals ${empDamage} damage!`]);
        break;
      }
      case 'ally_beacon': {
        const allyDamage = 25;
        setEnemyHealth(prev => Math.max(0, prev - allyDamage));
        if (!isMuted) {
          playSFX('powerup');
        }
        setCombatLog(prev => [...prev, `Ally arrives and deals ${allyDamage} damage!`]);
        break;
      }
    }

    setTimeout(() => enemyTurn(), 1500);
  };

  // Keep handlers ref updated for keyboard event handler
  handlersRef.current = { attack: handleAttack, defend: handleDefend, item: handleItem };

  const enemyTurn = () => {
    if (enemyHealth <= 0) return;

    setIsPlayerTurn(false);
    const damage = Math.max(0, enemy.damage - getPlayerDefense() - Math.floor(Math.random() * 5));
    const newPlayerHealth = Math.max(0, currentPlayerHealth - damage);

    setShakeScreen(true);
    setTimeout(() => setShakeScreen(false), 300);

    if (!isMuted) {
      playSFX('hit');
    }

    setCombatLog(prev => [...prev, `${enemy.name} attacks for ${damage} damage!`]);
    setCurrentPlayerHealth(newPlayerHealth);

    if (newPlayerHealth <= 0) {
      setTimeout(() => {
        if (!isMuted) {
          playSFX('gameOver');
        }
        setCombatLog(prev => [...prev, 'You have been defeated...']);
        onCombatEnd(false, enemy.health - enemyHealth, playerHealth);
      }, 1000);
    } else {
      setTimeout(() => {
        setIsPlayerTurn(true);
        setIsAnimating(false);
      }, 1000);
    }
  };

  // Keyboard controls for combat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keys during player turn and when not animating
      if (!isPlayerTurn || isAnimating) return;

      switch (e.key) {
        case '1':
          e.preventDefault();
          handlersRef.current.attack();
          break;
        case '2':
          e.preventDefault();
          handlersRef.current.defend();
          break;
        case '3': {
          e.preventDefault();
          const items = getCombatItems();
          if (items.length >= 1) handlersRef.current.item(items[0]);
          break;
        }
        case '4': {
          e.preventDefault();
          const items = getCombatItems();
          if (items.length >= 2) handlersRef.current.item(items[1]);
          break;
        }
        case '5': {
          e.preventDefault();
          const items = getCombatItems();
          if (items.length >= 3) handlersRef.current.item(items[2]);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerTurn, isAnimating, getCombatItems]);

  // Health bar component
  const HealthBar = ({ current, max, label }: { current: number; max: number; label: string }) => (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-600 to-green-400"
          initial={{ width: `${(current / max) * 100}%` }}
          animate={{ width: `${(current / max) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );

  return (
    <motion.div 
      className={`bg-black/90 p-6 rounded-lg border-2 border-red-500`}
      animate={{ x: shakeScreen ? [-5, 5, -5, 5, 0] : 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Enemy Display */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-red-500 mb-4">{enemy.name}</h2>
        {enemy.ascii && (
          <motion.pre 
            className="text-green-500 text-xs mx-auto inline-block"
            animate={{ scale: isAnimating && !isPlayerTurn ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {enemy.ascii.join('\n')}
          </motion.pre>
        )}
      </div>

      {/* Health Bars */}
      <div className="space-y-4 mb-6">
        <HealthBar current={enemyHealth} max={enemy.health} label="Enemy HP" />
        <HealthBar current={currentPlayerHealth} max={playerHealth} label="Your HP" />
      </div>

      {/* Combat Log */}
      <div className="bg-gray-900 p-3 rounded mb-4 h-24 overflow-y-auto">
        <AnimatePresence initial={false}>
          {combatLog.slice(-4).map((log, i) => (
            <motion.div
              key={`${log}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-green-400"
            >
              {'>'} {log}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleAttack}
          disabled={!isPlayerTurn || isAnimating}
          className={`flex items-center justify-center gap-2 p-3 rounded ${
            isPlayerTurn && !isAnimating
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          } transition-colors`}
        >
          <Swords className="w-5 h-5" />
          Attack
          <span className="text-xs opacity-60">[1]</span>
        </button>

        <button
          onClick={handleDefend}
          disabled={!isPlayerTurn || isAnimating}
          className={`flex items-center justify-center gap-2 p-3 rounded ${
            isPlayerTurn && !isAnimating
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          } transition-colors`}
        >
          <Shield className="w-5 h-5" />
          Defend
          <span className="text-xs opacity-60">[2]</span>
        </button>
      </div>

      {/* Item Usage */}
      {getCombatItems().length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm text-green-400 mb-2">Combat Items:</h3>
          <div className="flex flex-wrap gap-2">
            {getCombatItems().map((item, index) => {
              const keyNumber = index + 3;
              let icon: React.ReactNode;
              let label: string;
              let bgClass: string;

              switch (item) {
                case 'health_pack':
                  icon = <Heart className="w-3 h-3 inline mr-1" />;
                  label = 'Health Pack';
                  bgClass = 'bg-green-700 hover:bg-green-600';
                  break;
                case 'emp_device':
                  icon = <Zap className="w-3 h-3 inline mr-1" />;
                  label = 'EMP';
                  bgClass = 'bg-yellow-700 hover:bg-yellow-600';
                  break;
                case 'ally_beacon':
                  icon = <AlertTriangle className="w-3 h-3 inline mr-1" />;
                  label = 'Call Ally';
                  bgClass = 'bg-purple-700 hover:bg-purple-600';
                  break;
                default:
                  return null;
              }

              return (
                <button
                  key={item}
                  onClick={() => handleItem(item)}
                  disabled={!isPlayerTurn || isAnimating}
                  className={`text-xs px-2 py-1 ${bgClass} rounded disabled:bg-gray-700`}
                >
                  {icon}
                  {label}
                  <span className="opacity-60 ml-1">[{keyNumber}]</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}