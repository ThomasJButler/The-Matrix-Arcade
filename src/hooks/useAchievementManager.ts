import { useState, useCallback, useEffect, useRef } from 'react';
import { useSaveSystem } from './useSaveSystem';

interface AchievementNotification {
  id: string;
  name: string;
  description: string;
  icon?: string;
  game?: string;
  timestamp: number;
}

export const useAchievementManager = () => {
  const saveSystem = useSaveSystem();
  const [notificationQueue, setNotificationQueue] = useState<AchievementNotification[]>([]);
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const previousAchievements = useRef<Set<string>>(new Set());

  // Initialize previous achievements
  useEffect(() => {
    const unlockedIds = saveSystem.achievements
      .filter(a => a.unlocked)
      .map(a => a.id);
    previousAchievements.current = new Set(unlockedIds);
  }, []);

  // Check for new achievements
  useEffect(() => {
    const currentUnlocked = saveSystem.achievements.filter(a => a.unlocked);
    
    currentUnlocked.forEach(achievement => {
      if (!previousAchievements.current.has(achievement.id)) {
        // New achievement unlocked!
        previousAchievements.current.add(achievement.id);
        
        // Add to notification queue
        const notification: AchievementNotification = {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          game: achievement.game,
          timestamp: Date.now()
        };
        
        setNotificationQueue(prev => [...prev, notification]);
      }
    });
  }, [saveSystem.achievements]);

  // Remove notification from queue
  const dismissNotification = useCallback((index: number) => {
    setNotificationQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotificationQueue([]);
  }, []);

  // Toggle achievement display
  const toggleDisplay = useCallback(() => {
    setIsDisplayOpen(prev => !prev);
  }, []);

  // Open achievement display
  const openDisplay = useCallback(() => {
    setIsDisplayOpen(true);
  }, []);

  // Close achievement display
  const closeDisplay = useCallback(() => {
    setIsDisplayOpen(false);
  }, []);

  // Get achievement stats
  const getStats = useCallback(() => {
    const total = saveSystem.achievements.length;
    const unlocked = saveSystem.achievements.filter(a => a.unlocked).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    
    const byGame = saveSystem.achievements.reduce((acc, achievement) => {
      const game = achievement.game || 'General';
      if (!acc[game]) {
        acc[game] = { total: 0, unlocked: 0 };
      }
      acc[game].total++;
      if (achievement.unlocked) {
        acc[game].unlocked++;
      }
      return acc;
    }, {} as Record<string, { total: number; unlocked: number }>);
    
    return {
      total,
      unlocked,
      percentage,
      byGame
    };
  }, [saveSystem.achievements]);

  // Enhanced unlock achievement method with custom notification
  const unlockAchievement = useCallback((
    gameId: keyof typeof saveSystem.saveData.games,
    achievementId: string, 
    customNotification?: Partial<AchievementNotification>
  ) => {
    const success = saveSystem.unlockAchievement(gameId, achievementId);
    
    if (success && customNotification) {
      // If custom notification provided, use it instead of auto-detection
      const achievement = saveSystem.achievements.find(a => a.id === achievementId);
      if (achievement) {
        const notification: AchievementNotification = {
          id: achievement.id,
          name: customNotification.name || achievement.name,
          description: customNotification.description || achievement.description,
          icon: customNotification.icon || achievement.icon,
          game: customNotification.game || achievement.game,
          timestamp: Date.now()
        };
        setNotificationQueue(prev => [...prev, notification]);
      }
    }
    
    return success;
  }, [saveSystem]);

  // Check if achievement is unlocked
  const isUnlocked = useCallback((achievementId: string) => {
    const achievement = saveSystem.achievements.find(a => a.id === achievementId);
    return achievement?.unlocked || false;
  }, [saveSystem.achievements]);

  // Get all achievements with enhanced data
  const getAchievements = useCallback(() => {
    return saveSystem.achievements.map(achievement => ({
      ...achievement,
      progress: achievement.progress || 0,
      maxProgress: achievement.maxProgress || 1,
      percentComplete: achievement.maxProgress 
        ? Math.round((achievement.progress || 0) / achievement.maxProgress * 100)
        : achievement.unlocked ? 100 : 0
    }));
  }, [saveSystem.achievements]);

  return {
    // Achievement data
    achievements: getAchievements(),
    stats: getStats(),
    
    // Notification system
    notificationQueue,
    dismissNotification,
    clearNotifications,
    
    // Display modal
    isDisplayOpen,
    toggleDisplay,
    openDisplay,
    closeDisplay,
    
    // Achievement methods
    unlockAchievement,
    isUnlocked,
    
    // Save system methods (pass through)
    saveGame: saveSystem.saveGame,
    loadGame: saveSystem.loadGame,
    getSaveData: saveSystem.getSaveData,
    clearSaveData: saveSystem.clearSaveData,
    exportSaveData: saveSystem.exportSaveData,
    importSaveData: saveSystem.importSaveData
  };
};