import { motion } from 'framer-motion';

interface PowerUpIndicatorProps {
  activePowerUps: Record<string, boolean>;
}

const getPowerUpDisplay = (type: string) => {
  const displays: Record<string, { text: string; color: string; emoji: string }> = {
    bigger_paddle: { text: 'BIG PADDLE', color: 'bg-green-500', emoji: '🏓' },
    slower_ball: { text: 'SLOW BALL', color: 'bg-cyan-500', emoji: '🐌' },
    score_multiplier: { text: 'SCORE x2', color: 'bg-yellow-500', emoji: '⭐' },
    multi_ball: { text: 'MULTI BALL', color: 'bg-purple-500', emoji: '⚽' }
  };
  return displays[type] || { text: type.replace('_', ' '), color: 'bg-gray-500', emoji: '❓' };
};

export const PowerUpIndicator = ({ activePowerUps }: PowerUpIndicatorProps) => {
  return (
    <div className="w-full flex flex-wrap justify-center gap-2 md:gap-4">
      {Object.entries(activePowerUps).map(([type, active]) => {
        if (!active) return null;
        
        const display = getPowerUpDisplay(type);
        
        return (
          <motion.div
            key={type}
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0, rotateY: -180 }}
            transition={{ type: "spring", damping: 15 }}
            className={`px-3 py-1 md:px-4 md:py-2 ${display.color} text-white rounded-full font-mono text-sm md:text-base flex items-center gap-2 shadow-lg`}
          >
            <span>{display.emoji}</span>
            <span>{display.text}</span>
          </motion.div>
        );
      })}
    </div>
  );
};
