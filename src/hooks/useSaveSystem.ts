import { useCallback, useEffect, useState } from 'react';

// Save data structure for each game
export interface GameSaveData {
  highScore: number;
  level: number;
  achievements: string[];
  stats: {
    gamesPlayed: number;
    totalScore: number;
    bestCombo?: number;
    longestSurvival?: number;
    bossesDefeated?: number;
  };
  lastPlayed: number;
  preferences?: Record<string, any>;
}

// Global save data structure
export interface GlobalSaveData {
  version: string;
  games: {
    snakeClassic: GameSaveData;
    vortexPong: GameSaveData;
    terminalQuest: GameSaveData;
    matrixCloud: GameSaveData;
    ctrlSWorld: GameSaveData;
  };
  globalStats: {
    totalPlayTime: number;
    favoriteGame: string;
    globalAchievements: string[];
    firstPlayDate: number;
  };
  settings: {
    lastBackupDate?: number;
    autoSave: boolean;
  };
}

// Default save data
const createDefaultGameSave = (): GameSaveData => ({
  highScore: 0,
  level: 1,
  achievements: [],
  stats: {
    gamesPlayed: 0,
    totalScore: 0,
    bestCombo: 0,
    longestSurvival: 0,
    bossesDefeated: 0
  },
  lastPlayed: Date.now(),
  preferences: {}
});

const createDefaultGlobalSave = (): GlobalSaveData => ({
  version: '1.0.0',
  games: {
    snakeClassic: createDefaultGameSave(),
    vortexPong: createDefaultGameSave(),
    terminalQuest: createDefaultGameSave(),
    matrixCloud: createDefaultGameSave(),
    ctrlSWorld: createDefaultGameSave()
  },
  globalStats: {
    totalPlayTime: 0,
    favoriteGame: '',
    globalAchievements: [],
    firstPlayDate: Date.now()
  },
  settings: {
    autoSave: true
  }
});

// Achievement definitions
export const GAME_ACHIEVEMENTS = {
  snakeClassic: [
    { id: 'first_apple', name: 'First Bite', description: 'Eat your first data fragment' },
    { id: 'score_100', name: 'Century Mark', description: 'Score 100 points' },
    { id: 'score_500', name: 'Data Hoarder', description: 'Score 500 points' },
    { id: 'combo_10', name: 'Chain Reaction', description: 'Achieve 10x combo' },
    { id: 'power_master', name: 'Power User', description: 'Collect 10 power-ups in one game' }
  ],
  vortexPong: [
    { id: 'first_point', name: 'First Strike', description: 'Score your first point' },
    { id: 'beat_ai', name: 'AI Destroyer', description: 'Defeat the AI opponent' },
    { id: 'perfect_game', name: 'Flawless Victory', description: 'Win without losing a point' },
    { id: 'multi_ball_master', name: 'Ball Juggler', description: 'Handle 3 balls simultaneously' },
    { id: 'combo_king', name: 'Combo King', description: 'Score 5 consecutive paddle hits' }
  ],
  terminalQuest: [
    { id: 'first_choice', name: 'Path Chosen', description: 'Make your first choice' },
    { id: 'tool_collector', name: 'Tool Collector', description: 'Collect 5 different items' },
    { id: 'survivor', name: 'Digital Survivor', description: 'Maintain 100% health for 10 choices' },
    { id: 'code_master', name: 'Code Master', description: 'Achieve 90+ code quality' },
    { id: 'team_leader', name: 'Team Leader', description: 'Maintain 80+ team morale' }
  ],
  matrixCloud: [
    { id: 'first_flight', name: 'Digital Pilot', description: 'Complete your first flight' },
    { id: 'level_5', name: 'Matrix Navigator', description: 'Reach level 5' },
    { id: 'boss_slayer', name: 'Agent Destroyer', description: 'Defeat your first boss' },
    { id: 'power_collector', name: 'Power Seeker', description: 'Collect 20 power-ups' },
    { id: 'architect_defeat', name: 'Architect\'s Bane', description: 'Defeat the Architect' }
  ],
  ctrlSWorld: [
    { id: 'coffee_addict', name: 'Caffeine Dependent', description: 'Reach 100% coffee level' },
    { id: 'clean_coder', name: 'Clean Code Master', description: 'Achieve 90+ code quality' },
    { id: 'choice_master', name: 'Decision Maker', description: 'Make 50 choices' },
    { id: 'story_complete', name: 'Epic Journey', description: 'Complete the main storyline' },
    { id: 'collector', name: 'Item Hoarder', description: 'Collect 10 different items' }
  ]
};

const STORAGE_KEY = 'matrix-arcade-save-data';
const BACKUP_KEY = 'matrix-arcade-backup';

export function useSaveSystem() {
  const [saveData, setSaveData] = useState<GlobalSaveData>(createDefaultGlobalSave);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load save data from localStorage
  const loadSaveData = useCallback(() => {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored) as GlobalSaveData;
        
        // Version migration if needed
        if (parsed.version !== '1.0.0') {
          console.log('Migrating save data from version', parsed.version, 'to 1.0.0');
          // Add migration logic here in the future
        }
        
        // Merge with defaults to ensure all properties exist
        const mergedData = {
          ...createDefaultGlobalSave(),
          ...parsed,
          games: {
            ...createDefaultGlobalSave().games,
            ...parsed.games
          }
        };
        
        setSaveData(mergedData);
      } else {
        // First time setup
        const defaultData = createDefaultGlobalSave();
        setSaveData(defaultData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load save data:', err);
      setError('Failed to load save data');
      setSaveData(createDefaultGlobalSave());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save data to localStorage
  const saveToDisk = useCallback((data: GlobalSaveData) => {
    try {
      // Create backup before saving
      const currentData = localStorage.getItem(STORAGE_KEY);
      if (currentData) {
        localStorage.setItem(BACKUP_KEY, currentData);
      }
      
      // Save new data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      
      // Update backup date
      data.settings.lastBackupDate = Date.now();
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to save data:', err);
      setError('Failed to save data');
      return false;
    }
  }, []);

  // Update game save data
  const updateGameSave = useCallback((gameId: keyof GlobalSaveData['games'], updates: Partial<GameSaveData>) => {
    setSaveData(prev => {
      const newData = {
        ...prev,
        games: {
          ...prev.games,
          [gameId]: {
            ...prev.games[gameId],
            ...updates,
            lastPlayed: Date.now()
          }
        }
      };
      
      if (newData.settings.autoSave) {
        saveToDisk(newData);
      }
      
      return newData;
    });
  }, [saveToDisk]);

  // Unlock achievement
  const unlockAchievement = useCallback((gameId: keyof GlobalSaveData['games'], achievementId: string) => {
    setSaveData(prev => {
      const currentAchievements = prev.games[gameId].achievements;
      
      if (!currentAchievements.includes(achievementId)) {
        const newData = {
          ...prev,
          games: {
            ...prev.games,
            [gameId]: {
              ...prev.games[gameId],
              achievements: [...currentAchievements, achievementId],
              lastPlayed: Date.now()
            }
          }
        };
        
        if (newData.settings.autoSave) {
          saveToDisk(newData);
        }
        
        return newData;
      }
      
      return prev;
    });
  }, [saveToDisk]);

  // Update global stats
  const updateGlobalStats = useCallback((updates: Partial<GlobalSaveData['globalStats']>) => {
    setSaveData(prev => {
      const newData = {
        ...prev,
        globalStats: {
          ...prev.globalStats,
          ...updates
        }
      };
      
      if (newData.settings.autoSave) {
        saveToDisk(newData);
      }
      
      return newData;
    });
  }, [saveToDisk]);

  // Export save data
  const exportSaveData = useCallback(() => {
    try {
      const dataStr = JSON.stringify(saveData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `matrix-arcade-save-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Failed to export save data:', err);
      setError('Failed to export save data');
      return false;
    }
  }, [saveData]);

  // Import save data
  const importSaveData = useCallback((file: File) => {
    return new Promise<boolean>((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const imported = JSON.parse(content) as GlobalSaveData;
          
          // Validate imported data structure
          if (!imported.version || !imported.games) {
            throw new Error('Invalid save file format');
          }
          
          setSaveData(imported);
          saveToDisk(imported);
          resolve(true);
        } catch (err) {
          console.error('Failed to import save data:', err);
          setError('Failed to import save data: Invalid file format');
          resolve(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read save file');
        resolve(false);
      };
      
      reader.readAsText(file);
    });
  }, [saveToDisk]);

  // Clear all save data
  const clearSaveData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      const defaultData = createDefaultGlobalSave();
      setSaveData(defaultData);
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to clear save data:', err);
      setError('Failed to clear save data');
      return false;
    }
  }, []);

  // Restore from backup
  const restoreFromBackup = useCallback(() => {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const parsed = JSON.parse(backup) as GlobalSaveData;
        setSaveData(parsed);
        saveToDisk(parsed);
        setError(null);
        return true;
      } else {
        setError('No backup found');
        return false;
      }
    } catch (err) {
      console.error('Failed to restore from backup:', err);
      setError('Failed to restore from backup');
      return false;
    }
  }, [saveToDisk]);

  // Manual save
  const saveNow = useCallback(() => {
    return saveToDisk(saveData);
  }, [saveData, saveToDisk]);

  // Get achievements for a game
  const getGameAchievements = useCallback((gameId: keyof GlobalSaveData['games']) => {
    return GAME_ACHIEVEMENTS[gameId] || [];
  }, []);

  // Check if achievement is unlocked
  const isAchievementUnlocked = useCallback((gameId: keyof GlobalSaveData['games'], achievementId: string) => {
    return saveData.games[gameId].achievements.includes(achievementId);
  }, [saveData]);

  // Load data on mount
  useEffect(() => {
    loadSaveData();
  }, [loadSaveData]);

  return {
    saveData,
    isLoading,
    error,
    updateGameSave,
    unlockAchievement,
    updateGlobalStats,
    exportSaveData,
    importSaveData,
    clearSaveData,
    restoreFromBackup,
    saveNow,
    getGameAchievements,
    isAchievementUnlocked,
    loadSaveData
  };
}