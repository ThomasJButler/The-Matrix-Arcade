import { useCallback, useEffect, useState, useMemo } from 'react';

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
  preferences?: Record<string, unknown>;
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
    matrixInvaders: GameSaveData;
    metris: GameSaveData;
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
    ctrlSWorld: createDefaultGameSave(),
    matrixInvaders: createDefaultGameSave(),
    metris: createDefaultGameSave()
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

// Achievement interface
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  game?: string;
  unlocked?: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

// Achievement definitions with icons
export const GAME_ACHIEVEMENTS: Record<string, Achievement[]> = {
  snakeClassic: [
    { id: 'snake_first_apple', name: 'First Bite', description: 'Eat your first data fragment', icon: '🍎', game: 'Snake Classic' },
    { id: 'snake_score_100', name: 'Century Mark', description: 'Score 100 points', icon: '💯', game: 'Snake Classic' },
    { id: 'snake_score_500', name: 'Data Hoarder', description: 'Score 500 points', icon: '💾', game: 'Snake Classic' },
    { id: 'snake_combo_10', name: 'Chain Reaction', description: 'Achieve 10x combo', icon: '⚡', game: 'Snake Classic' },
    { id: 'snake_power_master', name: 'Power User', description: 'Collect 10 power-ups in one game', icon: '🔋', game: 'Snake Classic' },
    { id: 'snake_survivor', name: 'Survival Expert', description: 'Survive for 5 minutes', icon: '⏱️', game: 'Snake Classic' },
    { id: 'snake_speed_demon', name: 'Speed Demon', description: 'Score 100 points on max speed', icon: '🚀', game: 'Snake Classic' }
  ],
  vortexPong: [
    { id: 'pong_first_point', name: 'First Strike', description: 'Score your first point', icon: '🎯', game: 'Vortex Pong' },
    { id: 'pong_beat_ai', name: 'AI Destroyer', description: 'Defeat the AI opponent', icon: '🤖', game: 'Vortex Pong' },
    { id: 'pong_perfect_game', name: 'Flawless Victory', description: 'Win without losing a point', icon: '✨', game: 'Vortex Pong' },
    { id: 'pong_multi_ball', name: 'Ball Juggler', description: 'Handle 3 balls simultaneously', icon: '🎱', game: 'Vortex Pong' },
    { id: 'pong_combo_king', name: 'Combo King', description: 'Score 5 consecutive paddle hits', icon: '👑', game: 'Vortex Pong' },
    { id: 'pong_rally_master', name: 'Rally Master', description: '20 hits in a single rally', icon: '🏓', game: 'Vortex Pong' }
  ],
  terminalQuest: [
    { id: 'quest_first_choice', name: 'Path Chosen', description: 'Make your first choice', icon: '🛤️', game: 'Terminal Quest' },
    { id: 'quest_tool_collector', name: 'Tool Collector', description: 'Collect 5 different items', icon: '🛠️', game: 'Terminal Quest' },
    { id: 'quest_survivor', name: 'Digital Survivor', description: 'Maintain 100% health for 10 choices', icon: '❤️', game: 'Terminal Quest' },
    { id: 'quest_code_master', name: 'Code Master', description: 'Achieve 90+ code quality', icon: '💻', game: 'Terminal Quest' },
    { id: 'quest_team_leader', name: 'Team Leader', description: 'Maintain 80+ team morale', icon: '👥', game: 'Terminal Quest' },
    { id: 'quest_combat_victor', name: 'Combat Victor', description: 'Win 10 battles', icon: '⚔️', game: 'Terminal Quest' },
    { id: 'quest_story_end', name: 'Story Complete', description: 'Reach any ending', icon: '📖', game: 'Terminal Quest' }
  ],
  matrixCloud: [
    { id: 'cloud_first_flight', name: 'Digital Pilot', description: 'Complete your first flight', icon: '✈️', game: 'Matrix Cloud' },
    { id: 'cloud_level_5', name: 'Matrix Navigator', description: 'Reach level 5', icon: '🧭', game: 'Matrix Cloud' },
    { id: 'cloud_boss_slayer', name: 'Agent Destroyer', description: 'Defeat your first boss', icon: '💀', game: 'Matrix Cloud' },
    { id: 'cloud_power_collector', name: 'Power Seeker', description: 'Collect 20 power-ups', icon: '⚡', game: 'Matrix Cloud' },
    { id: 'cloud_architect_defeat', name: 'Architect\'s Bane', description: 'Defeat the Architect', icon: '🏛️', game: 'Matrix Cloud' },
    { id: 'cloud_all_bosses', name: 'Boss Master', description: 'Defeat all three bosses', icon: '👾', game: 'Matrix Cloud' },
    { id: 'cloud_high_flyer', name: 'High Flyer', description: 'Reach altitude 1000', icon: '🌟', game: 'Matrix Cloud' }
  ],
  matrixInvaders: [
    { id: 'invaders_first_kill', name: 'Code Breaker', description: 'Destroy your first invader', icon: '💥', game: 'Matrix Invaders' },
    { id: 'invaders_wave_5', name: 'Wave Survivor', description: 'Reach wave 5', icon: '🌊', game: 'Matrix Invaders' },
    { id: 'invaders_combo_10', name: 'Combo Master', description: 'Achieve a 10x combo', icon: '🔥', game: 'Matrix Invaders' },
    { id: 'invaders_bullet_time', name: 'Time Bender', description: 'Use bullet time 5 times', icon: '⏱️', game: 'Matrix Invaders' },
    { id: 'invaders_perfect_wave', name: 'Flawless Defense', description: 'Complete a wave without taking damage', icon: '🛡️', game: 'Matrix Invaders' },
    { id: 'invaders_boss_defeat', name: 'System Override', description: 'Defeat a boss enemy', icon: '👾', game: 'Matrix Invaders' },
    { id: 'invaders_high_score', name: 'Elite Hacker', description: 'Score over 10,000 points', icon: '🏆', game: 'Matrix Invaders' }
  ],
  ctrlSWorld: [
    { id: 'ctrl_coffee_addict', name: 'Caffeine Dependent', description: 'Reach 100% coffee level', icon: '☕', game: 'CTRL-S World' },
    { id: 'ctrl_clean_coder', name: 'Clean Code Master', description: 'Achieve 90+ code quality', icon: '✨', game: 'CTRL-S World' },
    { id: 'ctrl_choice_master', name: 'Decision Maker', description: 'Make 50 choices', icon: '🎯', game: 'CTRL-S World' },
    { id: 'ctrl_story_complete', name: 'Epic Journey', description: 'Complete the main storyline', icon: '🏆', game: 'CTRL-S World' },
    { id: 'ctrl_collector', name: 'Item Hoarder', description: 'Collect 10 different items', icon: '🎒', game: 'CTRL-S World' },
    { id: 'ctrl_voice_master', name: 'Voice Commander', description: 'Use Shatner voice for 5 minutes', icon: '🎤', game: 'CTRL-S World' },
    { id: 'ctrl_bug_free', name: 'Bug Free', description: 'Achieve 0 bugs', icon: '🐛', game: 'CTRL-S World' }
  ],
  metris: [
    { id: 'first_line', name: 'First Steps', description: 'Clear your first line', icon: '📊', game: 'Metris' },
    { id: 'tetris', name: 'Tetris Master', description: 'Clear 4 lines at once', icon: '💎', game: 'Metris' },
    { id: 'level_10', name: 'Speed Demon', description: 'Reach level 10', icon: '🚀', game: 'Metris' },
    { id: 'high_roller', name: 'High Roller', description: 'Score 10,000 points', icon: '💰', game: 'Metris' },
    { id: 'neos_apprentice', name: 'Neo\'s Apprentice', description: 'Use Bullet Time 10 times', icon: '⏱️', game: 'Metris' },
    { id: 'line_clearer', name: 'Line Clearer', description: 'Clear 100 total lines', icon: '📈', game: 'Metris' },
    { id: 'marathon_runner', name: 'Marathon Runner', description: 'Survive for 10 minutes', icon: '⏲️', game: 'Metris' },
    { id: 'combo_king', name: 'Combo King', description: 'Achieve 5x combo multiplier', icon: '🔥', game: 'Metris' },
    { id: 'perfect_start', name: 'Perfect Start', description: 'No game over before level 5', icon: '✨', game: 'Metris' },
    { id: 'architect', name: 'Architect', description: 'Build to 18 rows without clearing', icon: '🏗️', game: 'Metris' },
    { id: 't_spin_master', name: 'T-Spin Master', description: 'Perform 5 T-spins', icon: '🔄', game: 'Metris' },
    { id: 'immortal', name: 'Immortal', description: 'Reach level 20', icon: '👑', game: 'Metris' }
  ]
};

// Global achievements (meta achievements)
export const GLOBAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'global_first_game', name: 'Welcome to the Matrix', description: 'Play your first game', icon: '🎮' },
  { id: 'global_all_games', name: 'Matrix Master', description: 'Play all 5 games', icon: '🌐' },
  { id: 'global_10_achievements', name: 'Achievement Hunter', description: 'Unlock 10 achievements', icon: '🏅' },
  { id: 'global_25_achievements', name: 'Achievement Expert', description: 'Unlock 25 achievements', icon: '🥇' },
  { id: 'global_50_achievements', name: 'Achievement Legend', description: 'Unlock 50 achievements', icon: '👑' },
  { id: 'global_night_owl', name: 'Night Owl', description: 'Play after midnight', icon: '🦉' },
  { id: 'global_dedicated', name: 'Dedicated Player', description: 'Play 7 days in a row', icon: '📅' }
];

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
      // Ensure the game data exists
      if (!prev.games[gameId]) {
        prev.games[gameId] = {
          highScore: 0,
          totalScore: 0,
          gamesPlayed: 0,
          achievements: [],
          lastPlayed: Date.now()
        };
      }

      const currentAchievements = prev.games[gameId].achievements || [];

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

  // Get all achievements with unlock status
  const achievements = useMemo(() => {
    const allAchievements: Achievement[] = [];
    
    // Add game achievements
    Object.entries(GAME_ACHIEVEMENTS).forEach(([gameId, gameAchievements]) => {
      gameAchievements.forEach(achievement => {
        const isUnlocked = saveData.games[gameId as keyof GlobalSaveData['games']]?.achievements.includes(achievement.id);
        const unlockedAt = isUnlocked ? saveData.games[gameId as keyof GlobalSaveData['games']].lastPlayed : undefined;
        
        allAchievements.push({
          ...achievement,
          unlocked: isUnlocked,
          unlockedAt
        });
      });
    });
    
    // Add global achievements
    GLOBAL_ACHIEVEMENTS.forEach(achievement => {
      const isUnlocked = saveData.globalStats.globalAchievements.includes(achievement.id);
      allAchievements.push({
        ...achievement,
        unlocked: isUnlocked,
        unlockedAt: isUnlocked ? Date.now() : undefined
      });
    });
    
    return allAchievements;
  }, [saveData]);

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
    achievements,
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