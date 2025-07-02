import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Zap, Heart, AlertTriangle } from 'lucide-react';
import { Enemy } from './TerminalQuestContent';

interface CombatScreenProps {
  enemy: Enemy;
  playerHealth: number;
  playerInventory: string[];
  onCombatEnd: (victory: boolean, damageDealt: number, damageTaken: number) => void;
}

export default function TerminalQuestCombat({
  enemy,
  playerHealth,
  playerInventory,
  onCombatEnd
}: CombatScreenProps) {
  const [enemyHealth, setEnemyHealth] = useState(enemy.health);
  const [currentPlayerHealth, setCurrentPlayerHealth] = useState(playerHealth);
  const [combatLog, setCombatLog] = useState<string[]>([`${enemy.name} appears!`]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);

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
    
    setCombatLog(prev => [...prev, `You deal ${damage} damage!`]);
    setEnemyHealth(newEnemyHealth);
    
    if (newEnemyHealth <= 0) {
      setTimeout(() => {
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
      case 'health_pack':
        const healAmount = 50;
        setCurrentPlayerHealth(prev => Math.min(playerHealth, prev + healAmount));
        setCombatLog(prev => [...prev, `Health Pack used! +${healAmount} HP`]);
        break;
      case 'emp_device':
        const empDamage = 40;
        setEnemyHealth(prev => Math.max(0, prev - empDamage));
        setCombatLog(prev => [...prev, `EMP blast deals ${empDamage} damage!`]);
        break;
      case 'ally_beacon':
        const allyDamage = 25;
        setEnemyHealth(prev => Math.max(0, prev - allyDamage));
        setCombatLog(prev => [...prev, `Ally arrives and deals ${allyDamage} damage!`]);
        break;
    }
    
    setTimeout(() => enemyTurn(), 1500);
  };

  const enemyTurn = () => {
    if (enemyHealth <= 0) return;
    
    setIsPlayerTurn(false);
    const damage = Math.max(0, enemy.damage - getPlayerDefense() - Math.floor(Math.random() * 5));
    const newPlayerHealth = Math.max(0, currentPlayerHealth - damage);
    
    setShakeScreen(true);
    setTimeout(() => setShakeScreen(false), 300);
    
    setCombatLog(prev => [...prev, `${enemy.name} attacks for ${damage} damage!`]);
    setCurrentPlayerHealth(newPlayerHealth);
    
    if (newPlayerHealth <= 0) {
      setTimeout(() => {
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
        </button>
      </div>

      {/* Item Usage */}
      {playerInventory.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm text-green-400 mb-2">Combat Items:</h3>
          <div className="flex flex-wrap gap-2">
            {playerInventory.includes('health_pack') && (
              <button
                onClick={() => handleItem('health_pack')}
                disabled={!isPlayerTurn || isAnimating}
                className="text-xs px-2 py-1 bg-green-700 hover:bg-green-600 rounded disabled:bg-gray-700"
              >
                <Heart className="w-3 h-3 inline mr-1" />
                Health Pack
              </button>
            )}
            {playerInventory.includes('emp_device') && (
              <button
                onClick={() => handleItem('emp_device')}
                disabled={!isPlayerTurn || isAnimating}
                className="text-xs px-2 py-1 bg-yellow-700 hover:bg-yellow-600 rounded disabled:bg-gray-700"
              >
                <Zap className="w-3 h-3 inline mr-1" />
                EMP
              </button>
            )}
            {playerInventory.includes('ally_beacon') && (
              <button
                onClick={() => handleItem('ally_beacon')}
                disabled={!isPlayerTurn || isAnimating}
                className="text-xs px-2 py-1 bg-purple-700 hover:bg-purple-600 rounded disabled:bg-gray-700"
              >
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Call Ally
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}