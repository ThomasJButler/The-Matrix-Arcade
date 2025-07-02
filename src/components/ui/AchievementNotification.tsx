import React, { useEffect, useState } from 'react';
import { Trophy, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  game?: string;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-8 right-8 z-50 pointer-events-none"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div 
            className="relative bg-black/90 border-2 border-green-500 rounded-lg p-6 
                       shadow-[0_0_30px_rgba(0,255,0,0.5)] backdrop-blur-md
                       min-w-[320px] max-w-[400px]"
          >
            {/* Matrix rain effect background */}
            <div className="absolute inset-0 overflow-hidden rounded-lg opacity-20">
              <div className="matrix-rain" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-start gap-4">
              {/* Icon */}
              <motion.div
                className="flex-shrink-0"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360, 0]
                }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center
                              border-2 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.5)]">
                  {achievement.icon ? (
                    <span className="text-3xl">{achievement.icon}</span>
                  ) : (
                    <Trophy className="w-8 h-8 text-green-500" />
                  )}
                </div>
              </motion.div>

              {/* Text content */}
              <div className="flex-1">
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-green-500 font-mono text-sm mb-1 flex items-center gap-2">
                    <Unlock className="w-4 h-4" />
                    ACHIEVEMENT UNLOCKED
                  </h3>
                  <h2 className="text-white font-mono text-xl mb-2 tracking-wider">
                    {achievement.name}
                  </h2>
                  <p className="text-green-300/80 font-mono text-sm leading-relaxed">
                    {achievement.description}
                  </p>
                  {achievement.game && (
                    <p className="text-green-500/60 font-mono text-xs mt-2">
                      {achievement.game}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-green-500"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
            />

            {/* Glitch effect */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="w-full h-full"
                animate={{
                  clipPath: [
                    'inset(0 0 100% 0)',
                    'inset(0 0 90% 0)',
                    'inset(0 0 100% 0)',
                  ],
                  opacity: [0, 0.1, 0]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                style={{
                  background: 'linear-gradient(180deg, transparent, rgba(0,255,0,0.1), transparent)',
                  filter: 'blur(1px)'
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Achievement notification queue component
interface AchievementQueueProps {
  achievements: Achievement[];
  onDismiss: (index: number) => void;
}

export const AchievementQueue: React.FC<AchievementQueueProps> = ({
  achievements,
  onDismiss
}) => {
  return (
    <div className="fixed top-8 right-8 z-50 space-y-4">
      {achievements.map((achievement, index) => (
        <motion.div
          key={`${achievement.id}-${index}`}
          initial={{ x: 400, opacity: 0 }}
          animate={{ 
            x: 0, 
            opacity: 1,
            y: index * 10
          }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            damping: 20, 
            stiffness: 300,
            delay: index * 0.1
          }}
        >
          <AchievementNotification
            achievement={achievement}
            onDismiss={() => onDismiss(index)}
          />
        </motion.div>
      ))}
    </div>
  );
};