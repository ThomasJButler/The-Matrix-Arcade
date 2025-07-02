import { useState, useCallback } from 'react';

export type PowerUpType = 'bigger_paddle' | 'slower_ball' | 'score_multiplier' | 'multi_ball';

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  active: boolean;
}

export const usePowerUps = () => {
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<Record<PowerUpType, boolean>>({
    bigger_paddle: false,
    slower_ball: false,
    score_multiplier: false,
    multi_ball: false,
  });

  const spawnPowerUp = useCallback(() => {
    setPowerUps(prev => {
      if (prev.length >= 2) return prev;
      const types: PowerUpType[] = ['bigger_paddle', 'slower_ball', 'score_multiplier', 'multi_ball'];
      const newPowerUp: PowerUp = {
        id: Math.random().toString(),
        x: 200 + Math.random() * 400,
        y: 50 + Math.random() * 300,
        type: types[Math.floor(Math.random() * types.length)],
        active: true,
      };
      return [...prev, newPowerUp];
    });
  }, []);

  const activatePowerUp = useCallback((type: PowerUpType) => {
    setActivePowerUps(prev => ({ ...prev, [type]: true }));
    new Audio('/sounds/powerup.mp3').play().catch(() => {}); // Add sound effect
    
    setTimeout(() => {
      setActivePowerUps(prev => ({ ...prev, [type]: false }));
      new Audio('/sounds/powerdown.mp3').play().catch(() => {});
    }, 10000);
  }, []);

  return { powerUps, setPowerUps, activePowerUps, spawnPowerUp, activatePowerUp };
};
