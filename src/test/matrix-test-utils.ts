/**
 * @author Ralph (AI Agent)
 * @date 2026-01-25
 * @description Shared test utilities for Matrix Arcade game tests
 *              Provides mock implementations for achievement manager and other common test fixtures
 */

import { vi } from 'vitest';

/**
 * Creates a mock achievement manager for testing game components
 * The mock provides all methods expected by the AchievementManager interface
 */
export function createMockAchievementManager() {
  return {
    unlockAchievement: vi.fn(),
    isUnlocked: vi.fn().mockReturnValue(false),
    achievements: [],
    notificationQueue: [],
    dismissNotification: vi.fn(),
    clearNotifications: vi.fn(),
    toggleDisplay: vi.fn(),
    openDisplay: vi.fn(),
    closeDisplay: vi.fn(),
    isDisplayOpen: false,
    stats: {
      total: 0,
      unlocked: 0,
      percentage: 0,
      byGame: {}
    },
    getSaveData: vi.fn().mockReturnValue({
      version: '1.0',
      games: {},
      globalStats: {
        totalPlayTime: 0,
        favoriteGame: '',
        globalAchievements: [],
        firstPlayDate: Date.now()
      },
      settings: {
        autoSave: true
      }
    }),
    updateGlobalStats: vi.fn(),
    clearSaveData: vi.fn(),
    exportSaveData: vi.fn(),
    importSaveData: vi.fn()
  };
}

/**
 * Creates a mock save system for testing persistence features
 */
export function createMockSaveSystem() {
  return {
    saveData: {
      version: '1.0',
      games: {
        snakeClassic: {
          highScore: 0,
          level: 1,
          achievements: [],
          stats: {
            gamesPlayed: 0,
            totalScore: 0,
            longestSurvival: 0,
            bestLength: 0
          },
          lastPlayed: Date.now()
        },
        vortexPong: {
          highScore: 0,
          level: 1,
          achievements: [],
          stats: {
            gamesPlayed: 0,
            totalScore: 0,
            wins: 0,
            bestCombo: 0,
            longestRally: 0
          },
          lastPlayed: Date.now()
        },
        matrixCloud: {
          highScore: 0,
          level: 1,
          achievements: [],
          stats: {
            gamesPlayed: 0,
            totalScore: 0,
            bossesDefeated: 0
          },
          lastPlayed: Date.now()
        },
        ctrlSWorld: {
          highScore: 0,
          level: 1,
          achievements: [],
          stats: {
            gamesPlayed: 0,
            totalScore: 0,
            chaptersCompleted: 0,
            puzzlesSolved: 0
          },
          lastPlayed: Date.now()
        },
        matrixInvaders: {
          highScore: 0,
          level: 1,
          achievements: [],
          stats: {
            gamesPlayed: 0,
            totalScore: 0,
            bestWave: 0,
            totalKills: 0,
            bestCombo: 0
          },
          lastPlayed: Date.now()
        },
        metris: {
          highScore: 0,
          level: 1,
          achievements: [],
          stats: {
            gamesPlayed: 0,
            totalScore: 0,
            bestCombo: 0,
            longestSurvival: 0
          },
          lastPlayed: Date.now()
        }
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
    },
    isLoading: false,
    error: null,
    achievements: [],
    updateGameSave: vi.fn(),
    unlockAchievement: vi.fn(),
    updateGlobalStats: vi.fn(),
    exportSaveData: vi.fn().mockReturnValue(true),
    importSaveData: vi.fn().mockResolvedValue(true),
    clearSaveData: vi.fn().mockReturnValue(true),
    restoreFromBackup: vi.fn().mockReturnValue(true),
    saveNow: vi.fn().mockReturnValue(true),
    getGameAchievements: vi.fn().mockReturnValue([]),
    isAchievementUnlocked: vi.fn().mockReturnValue(false),
    loadSaveData: vi.fn()
  };
}

/**
 * Creates a mock sound system for testing audio features
 */
export function createMockSoundSystem() {
  return {
    config: {
      music: true,
      sfx: true,
      masterVolume: 1,
      musicVolume: 0.7,
      sfxVolume: 0.8
    },
    updateConfig: vi.fn(),
    playSFX: vi.fn().mockResolvedValue(undefined),
    playMusic: vi.fn().mockResolvedValue(undefined),
    stopMusic: vi.fn(),
    playBackgroundMP3: vi.fn().mockReturnValue(vi.fn()),
    stopBackgroundMP3: vi.fn(),
    toggleMute: vi.fn(),
    isMuted: false,
    isInitialized: true,
    soundLibrary: ['jump', 'hit', 'score', 'powerup', 'levelUp', 'combo', 'gameOver', 'menu'],
    musicSequences: ['menu', 'gameplay', 'intense']
  };
}

/**
 * Creates a mock canvas context for testing rendering
 */
export function createMockCanvasContext() {
  return {
    fillStyle: '',
    strokeStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    globalAlpha: 1,
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    createRadialGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn()
    }),
    createLinearGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn()
    }),
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1
    }),
    putImageData: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 })
  };
}
