import { motion } from 'framer-motion';

interface PowerUpIndicatorProps {
  activePowerUps: Record<string, boolean>;
}

export const PowerUpIndicator = ({ activePowerUps }: PowerUpIndicatorProps) => {
  return (
    <div className="w-full flex flex-wrap justify-center gap-2 md:gap-4">
      {Object.entries(activePowerUps).map(([type, active]) => (
        active && (
          <motion.div
            key={type}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="px-3 py-1 md:px-4 md:py-2 bg-green-500 text-black rounded-full font-mono text-sm md:text-base"
          >
            {type.replace('_', ' ')}
          </motion.div>
        )
      ))}
    </div>
  );
};
