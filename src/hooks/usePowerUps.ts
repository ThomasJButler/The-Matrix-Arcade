import { useState, useCallback, useRef, useEffect } from 'react';

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
  const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(id => clearTimeout(id));
      timeoutIdsRef.current.clear();
    };
  }, []);

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

    const timeoutId = setTimeout(() => {
      setActivePowerUps(prev => ({ ...prev, [type]: false }));
      timeoutIdsRef.current.delete(timeoutId);
    }, 10000);
    timeoutIdsRef.current.add(timeoutId);
  }, []);

  return { powerUps, setPowerUps, activePowerUps, spawnPowerUp, activatePowerUp };
};
