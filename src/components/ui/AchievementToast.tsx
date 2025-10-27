import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Lock, X } from 'lucide-react';

// ============================================================================
// ACHIEVEMENT TOAST SYSTEM
// Shows achievement unlock notifications with queue system
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'story' | 'skill' | 'stat' | 'secret';
  unlockedAt?: string;
}

interface ToastItem {
  achievement: Achievement;
  id: string;
}

interface AchievementToastProps {
  achievements: Achievement[];
  onDismiss?: (achievementId: string) => void;
  playSFX?: (sound: string) => void;
}

const AchievementCard: React.FC<{
  achievement: Achievement;
  onClose: () => void;
}> = ({ achievement, onClose }) => {
  const [progress, setProgress] = useState(100);

  // Auto-dismiss timer
  useEffect(() => {
    const duration = 5000; // 5 seconds
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - step;
        if (newProgress <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  // Get icon and colors based on category
  const getCategoryStyle = () => {
    switch (achievement.category) {
      case 'story':
        return {
          icon: <Trophy className="w-6 h-6" />,
          borderColor: 'border-green-500',
          bgColor: 'bg-green-900/30',
          iconColor: 'text-green-400',
          progressColor: 'bg-green-500'
        };
      case 'skill':
        return {
          icon: <Zap className="w-6 h-6" />,
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-900/30',
          iconColor: 'text-blue-400',
          progressColor: 'bg-blue-500'
        };
      case 'stat':
        return {
          icon: <Star className="w-6 h-6" />,
          borderColor: 'border-yellow-500',
          bgColor: 'bg-yellow-900/30',
          iconColor: 'text-yellow-400',
          progressColor: 'bg-yellow-500'
        };
      case 'secret':
        return {
          icon: <Lock className="w-6 h-6" />,
          borderColor: 'border-purple-500',
          bgColor: 'bg-purple-900/30',
          iconColor: 'text-purple-400',
          progressColor: 'bg-purple-500'
        };
    }
  };

  const style = getCategoryStyle();

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className={`
        relative w-80 ${style.bgColor} ${style.borderColor} border-2 rounded-lg
        shadow-[0_0_20px_rgba(0,255,0,0.3)] backdrop-blur-sm overflow-hidden
      `}
    >
      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
        <motion.div
          className={`h-full ${style.progressColor}`}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`${style.iconColor} flex-shrink-0 mt-0.5`}>
            {style.icon}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-green-400/70 font-mono uppercase tracking-wider mb-0.5">
              Achievement Unlocked!
            </div>
            <h3 className="text-sm font-bold text-green-100 font-mono mb-1 truncate">
              {achievement.title}
            </h3>
            <p className="text-xs text-green-300/80 leading-relaxed">
              {achievement.description}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors text-green-400/70 hover:text-green-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Glow effect */}
      <div className={`absolute inset-0 ${style.borderColor.replace('border-', 'bg-')} opacity-10 blur-xl pointer-events-none`} />
    </motion.div>
  );
};

export const AchievementToastContainer: React.FC<AchievementToastProps> = ({
  achievements,
  onDismiss,
  playSFX
}) => {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [displayedIds, setDisplayedIds] = useState<Set<string>>(new Set());
  const maxVisible = 3;

  // Add new achievements to queue
  useEffect(() => {
    achievements.forEach(achievement => {
      if (!displayedIds.has(achievement.id)) {
        setQueue(prev => [...prev, {
          achievement,
          id: `${achievement.id}-${Date.now()}`
        }]);
        setDisplayedIds(prev => new Set(prev).add(achievement.id));

        // Play sound effect
        playSFX?.('score');
      }
    });
  }, [achievements, displayedIds, playSFX]);

  // Handle toast dismissal
  const handleDismiss = useCallback((toastId: string, achievementId: string) => {
    setQueue(prev => prev.filter(item => item.id !== toastId));
    onDismiss?.(achievementId);
  }, [onDismiss]);

  // Get visible toasts (max 3)
  const visibleToasts = queue.slice(0, maxVisible);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((item, index) => (
          <div
            key={item.id}
            className="pointer-events-auto"
            style={{
              marginTop: index > 0 ? '12px' : '0'
            }}
          >
            <AchievementCard
              achievement={item.achievement}
              onClose={() => handleDismiss(item.id, item.achievement.id)}
            />
          </div>
        ))}
      </AnimatePresence>

      {/* Queue indicator */}
      {queue.length > maxVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center text-green-400/70 text-xs font-mono bg-black/80 border border-green-500/50 rounded-lg py-2 px-3 pointer-events-auto"
        >
          +{queue.length - maxVisible} more achievement{queue.length - maxVisible !== 1 ? 's' : ''}
        </motion.div>
      )}
    </div>
  );
};

export default AchievementToastContainer;
