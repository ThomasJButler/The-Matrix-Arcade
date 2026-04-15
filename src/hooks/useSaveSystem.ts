import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

// Lifeline data structure for CTRL-S World
export interface LifelineData {
  freeAnswersRemaining: number;
  usedLifelines: {
    fiftyFifty: string[];      // puzzle IDs where 50/50 was used (stored as array for JSON)
    sentientAI: string[];       // puzzle IDs where AI was asked
    characters: string[];       // puzzle IDs where characters were asked
  };
  stats: {
    totalFreeAnswersUsed: number;
    totalFiftyFiftyUsed: number;
    totalSentientAIUsed: number;
    totalCharactersUsed: number;
    totalPuzzlesCompletedWithHelp: number;
  };
}

// Player stats for CTRL-S World
export interface CtrlSPlayerStats {
  coffeeLevel: number;      // 0-200% (can go over 100!)
  hackerRep: number;        // 0-100
  wisdomPoints: number;     // Accumulates from choices
  teamMorale: number;       // 0-100
}

// Inventory item for CTRL-S World
export interface CtrlSGameItem {
  id: string;
  name: string;
  description: string;
  type: 'quest' | 'consumable' | 'collectible' | 'special';
  usable: boolean;
  effect?: string;
  quantity?: number;
  acquiredAt?: string;
}

// Full game state for CTRL-S World - enables single source of truth for all game data
export interface CtrlSGameState {
  // Progress tracking
  currentChapter: number;
  currentSection: string;
  completedPuzzles: string[];
  completedChapters: number[];

  // Player stats
  stats: CtrlSPlayerStats;

  // Inventory
  inventory: CtrlSGameItem[];

  // Story choices made
  storyChoices: Record<string, string>;

  // Achievements tracked locally (also synced to global achievements)
  unlockedAchievements: string[];
  achievementProgress: Record<string, number>;

  // Settings
  difficulty: 'easy' | 'normal' | 'hard';
  hintsEnabled: boolean;

  // Meta
  playtime: number; // in seconds
  startDate: string;
  lastSaved: string;
}

// Create default CTRL-S game state
export const createDefaultCtrlSGameState = (): CtrlSGameState => ({
  currentChapter: 1,
  currentSection: 'intro',
  completedPuzzles: [],
  completedChapters: [],

  stats: {
    coffeeLevel: 50,
    hackerRep: 0,
    wisdomPoints: 0,
    teamMorale: 50
  },

  inventory: [],
  storyChoices: {},

  unlockedAchievements: [],
  achievementProgress: {},

  difficulty: 'normal',
  hintsEnabled: true,

  playtime: 0,
  startDate: new Date().toISOString(),
  lastSaved: new Date().toISOString()
});

// Scoreboard entry for high-score tables
export interface ScoreEntry {
  initials: string;       // 3 chars [A-Z]
  score: number;
  level: number;
  durationMs: number;
  date: string;           // ISO
}

// Game IDs eligible for scoreboard (excludes CTRL-S World — story game, no score)
export type ScoreboardGameId =
  | 'snakeClassic' | 'vortexPong' | 'matrixCloud'
  | 'matrixInvaders' | 'metris' | 'matrixFrogger'
  | 'neoJump' | 'agentChase' | 'rhythmHacker'
  | 'cloudJumper' | 'codeBreaker';

export const SCOREBOARD_GAME_IDS: ScoreboardGameId[] = [
  'snakeClassic', 'vortexPong', 'matrixCloud',
  'matrixInvaders', 'metris', 'matrixFrogger',
  'neoJump', 'agentChase', 'rhythmHacker',
  'cloudJumper', 'codeBreaker',
];

export const MAX_BOARD_SIZE = 25;

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
  lifelineData?: LifelineData;  // CTRL-S World lifeline tracking
  ctrlSGameState?: CtrlSGameState;  // CTRL-S World full game state (story progress, inventory, etc.)
}

// Global save data structure
export interface GlobalSaveData {
  version: string;
  games: {
    snakeClassic: GameSaveData;
    vortexPong: GameSaveData;
    matrixCloud: GameSaveData;
    ctrlSWorld: GameSaveData;
    matrixInvaders: GameSaveData;
    metris: GameSaveData;
    // Phaser games
    matrixFrogger: GameSaveData;
    neoJump: GameSaveData;
    agentChase: GameSaveData;
    rhythmHacker: GameSaveData;
    cloudJumper: GameSaveData;
    codeBreaker: GameSaveData;
    // Legacy game IDs (kept for migration compatibility)
    crossyRoad: GameSaveData;
    matrixAscension: GameSaveData;
    agentEscape: GameSaveData;
    jimmyMatrix: GameSaveData;
  };
  globalStats: {
    totalPlayTime: number;
    favoriteGame: string;
    globalAchievements: string[];
    firstPlayDate: number;
    playDates: string[];  // Array of date strings for tracking consecutive play days
  };
  settings: {
    lastBackupDate?: number;
    autoSave: boolean;
  };
  scoreboards: Record<ScoreboardGameId, ScoreEntry[]>;
  lastInitials: string;
}

// Default lifeline data for CTRL-S World
export const createDefaultLifelineData = (): LifelineData => ({
  freeAnswersRemaining: 10,
  usedLifelines: {
    fiftyFifty: [],
    sentientAI: [],
    characters: []
  },
  stats: {
    totalFreeAnswersUsed: 0,
    totalFiftyFiftyUsed: 0,
    totalSentientAIUsed: 0,
    totalCharactersUsed: 0,
    totalPuzzlesCompletedWithHelp: 0
  }
});

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
  version: CURRENT_VERSION,
  games: {
    snakeClassic: createDefaultGameSave(),
    vortexPong: createDefaultGameSave(),
    matrixCloud: createDefaultGameSave(),
    ctrlSWorld: { ...createDefaultGameSave(), lifelineData: createDefaultLifelineData(), ctrlSGameState: createDefaultCtrlSGameState() },
    matrixInvaders: createDefaultGameSave(),
    metris: createDefaultGameSave(),
    matrixFrogger: createDefaultGameSave(),
    neoJump: createDefaultGameSave(),
    agentChase: createDefaultGameSave(),
    rhythmHacker: createDefaultGameSave(),
    cloudJumper: createDefaultGameSave(),
    codeBreaker: createDefaultGameSave(),
    crossyRoad: createDefaultGameSave(),
    matrixAscension: createDefaultGameSave(),
    agentEscape: createDefaultGameSave(),
    jimmyMatrix: createDefaultGameSave()
  },
  globalStats: {
    totalPlayTime: 0,
    favoriteGame: '',
    globalAchievements: [],
    firstPlayDate: Date.now(),
    playDates: []
  },
  settings: {
    autoSave: true
  },
  scoreboards: Object.fromEntries(SCOREBOARD_GAME_IDS.map(id => [id, []])) as Record<ScoreboardGameId, ScoreEntry[]>,
  lastInitials: 'AAA',
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
    { id: 'snake_first_apple', name: 'First Bite', description: 'Eat your first data fragment', game: 'Snake Classic' },
    { id: 'snake_score_100', name: 'Century Mark', description: 'Score 100 points', game: 'Snake Classic' },
    { id: 'snake_score_500', name: 'Data Hoarder', description: 'Score 500 points', game: 'Snake Classic' },
    { id: 'snake_combo_10', name: 'Chain Reaction', description: 'Achieve 10x combo', game: 'Snake Classic' },
    { id: 'snake_power_master', name: 'Power User', description: 'Collect 10 power-ups in one game', game: 'Snake Classic' },
    { id: 'snake_survivor', name: 'Survival Expert', description: 'Survive for 5 minutes', game: 'Snake Classic' },
    { id: 'snake_speed_demon', name: 'Speed Demon', description: 'Score 100 points on max speed', game: 'Snake Classic' }
  ],
  vortexPong: [
    { id: 'pong_first_point', name: 'First Strike', description: 'Score your first point', game: 'Vortex Pong' },
    { id: 'pong_beat_ai', name: 'AI Destroyer', description: 'Defeat the AI opponent', game: 'Vortex Pong' },
    { id: 'pong_perfect_game', name: 'Flawless Victory', description: 'Win without losing a point', game: 'Vortex Pong' },
    { id: 'pong_multi_ball', name: 'Ball Juggler', description: 'Handle 3 balls simultaneously', game: 'Vortex Pong' },
    { id: 'pong_combo_king', name: 'Combo King', description: 'Score 5 consecutive paddle hits', game: 'Vortex Pong' },
    { id: 'pong_rally_master', name: 'Rally Master', description: '20 hits in a single rally', game: 'Vortex Pong' },
    { id: 'pong_power_master', name: 'Power Master', description: 'Collect 5 power-ups in one game', game: 'Vortex Pong' }
  ],
  matrixCloud: [
    { id: 'cloud_first_flight', name: 'Digital Pilot', description: 'Complete your first flight', game: 'Matrix Bird' },
    { id: 'cloud_level_5', name: 'Matrix Navigator', description: 'Reach level 5', game: 'Matrix Bird' },
    { id: 'cloud_boss_slayer', name: 'Agent Destroyer', description: 'Defeat your first boss', game: 'Matrix Bird' },
    { id: 'cloud_power_collector', name: 'Power Seeker', description: 'Collect 20 power-ups', game: 'Matrix Bird' },
    { id: 'cloud_architect_defeat', name: 'Architect\'s Bane', description: 'Defeat the Architect', game: 'Matrix Bird' },
    { id: 'cloud_all_bosses', name: 'Boss Master', description: 'Defeat all three bosses', game: 'Matrix Bird' },
    { id: 'cloud_high_flyer', name: 'High Flyer', description: 'Reach altitude 1000', game: 'Matrix Bird' },
    { id: 'cloud_sentinel_defeat', name: 'Sentinel Slayer', description: 'Defeat the Sentinel', game: 'Matrix Bird' }
  ],
  matrixInvaders: [
    { id: 'invaders_first_kill', name: 'Code Breaker', description: 'Destroy your first invader', game: 'Matrix Invaders' },
    { id: 'invaders_wave_5', name: 'Wave Survivor', description: 'Reach wave 5', game: 'Matrix Invaders' },
    { id: 'invaders_wave_10', name: 'Matrix Veteran', description: 'Reach wave 10', game: 'Matrix Invaders' },
    { id: 'invaders_endless', name: 'Endless Defender', description: 'Reach wave 20', game: 'Matrix Invaders' },
    { id: 'invaders_100_enemies', name: 'Centurion', description: 'Destroy 100 enemies', game: 'Matrix Invaders' },
    { id: 'invaders_combo_10', name: 'Combo Master', description: 'Achieve a 10x combo', game: 'Matrix Invaders' },
    { id: 'invaders_bullet_time', name: 'Time Bender', description: 'Use bullet time 5 times', game: 'Matrix Invaders' },
    { id: 'invaders_perfect_wave', name: 'Flawless Defense', description: 'Complete a wave without taking damage', game: 'Matrix Invaders' },
    { id: 'invaders_boss_defeat', name: 'System Override', description: 'Defeat a boss enemy', game: 'Matrix Invaders' },
    { id: 'invaders_high_score', name: 'Elite Hacker', description: 'Score over 10,000 points', game: 'Matrix Invaders' }
  ],
  ctrlSWorld: [
    { id: 'ctrl_first_puzzle', name: 'First Steps', description: 'Complete your first puzzle', game: 'CTRL-S World' },
    { id: 'ctrl_no_hints', name: 'Quick Thinker', description: 'Complete a puzzle without hints or lifelines', game: 'CTRL-S World' },
    { id: 'ctrl_chapter_1', name: 'Chapter One', description: 'Complete Chapter 1', game: 'CTRL-S World' },
    { id: 'ctrl_chapter_2', name: 'Silicon Seeker', description: 'Complete Chapter 2', game: 'CTRL-S World' },
    { id: 'ctrl_chapter_3', name: 'Midway There', description: 'Complete Chapter 3', game: 'CTRL-S World' },
    { id: 'ctrl_chapter_4', name: 'Time Bender', description: 'Complete Chapter 4', game: 'CTRL-S World' },
    { id: 'ctrl_chapter_5', name: 'Dawn Breaker', description: 'Complete Chapter 5', game: 'CTRL-S World' },
    { id: 'ctrl_story_complete', name: 'Epic Journey', description: 'Complete the main storyline', game: 'CTRL-S World' },
    { id: 'ctrl_speed_reader', name: 'Speed Reader', description: 'Complete in under 30 minutes', game: 'CTRL-S World' },
    { id: 'ctrl_puzzle_master', name: 'Puzzle Master', description: 'Complete 10 or more puzzles', game: 'CTRL-S World' },
    { id: 'ctrl_completionist', name: 'Completionist', description: 'Complete every chapter and solve every puzzle', game: 'CTRL-S World' }
  ],
  metris: [
    { id: 'first_line', name: 'First Steps', description: 'Clear your first line', game: 'Metris' },
    { id: 'tetris', name: 'Tetris Master', description: 'Clear 4 lines at once', game: 'Metris' },
    { id: 'level_10', name: 'Speed Demon', description: 'Reach level 10', game: 'Metris' },
    { id: 'high_roller', name: 'High Roller', description: 'Score 10,000 points', game: 'Metris' },
    { id: 'neos_apprentice', name: 'Neo\'s Apprentice', description: 'Use Bullet Time 10 times', game: 'Metris' },
    { id: 'line_clearer', name: 'Line Clearer', description: 'Clear 100 total lines', game: 'Metris' },
    { id: 'marathon_runner', name: 'Marathon Runner', description: 'Survive for 10 minutes', game: 'Metris' },
    { id: 'combo_king', name: 'Combo King', description: 'Achieve 5x combo multiplier', game: 'Metris' },
    { id: 'perfect_start', name: 'Perfect Start', description: 'No game over before level 5', game: 'Metris' },
    { id: 'architect', name: 'Architect', description: 'Build to 18 rows without clearing', game: 'Metris' },
    { id: 't_spin_master', name: 'T-Spin Master', description: 'Perform 5 T-spins', game: 'Metris' },
    { id: 'immortal', name: 'Immortal', description: 'Reach level 20', game: 'Metris' }
  ],
  matrixFrogger: [
    { id: 'frogger_first_cross', name: 'First Crossing', description: 'Complete your first road crossing', game: 'Matrix Frogger' },
    { id: 'frogger_score_1000', name: 'Score Hacker', description: 'Score 1,000 points', game: 'Matrix Frogger' },
    { id: 'frogger_score_5000', name: 'Elite Hacker', description: 'Score 5,000 points', game: 'Matrix Frogger' },
    { id: 'frogger_dodge_10', name: 'Dodge Master', description: 'Achieve 10 near misses', game: 'Matrix Frogger' },
    { id: 'frogger_bullet_time', name: 'Bullet Time', description: 'Activate bullet time', game: 'Matrix Frogger' },
    { id: 'frogger_ghost', name: 'Ghost in the Machine', description: 'Use ghost mode', game: 'Matrix Frogger' },
    { id: 'frogger_shield_save', name: 'Shield Save', description: 'Survive a hit with a shield', game: 'Matrix Frogger' },
    { id: 'frogger_magnet_5', name: 'Magnet Collector', description: 'Collect 5 pills with magnet', game: 'Matrix Frogger' },
    { id: 'frogger_combo_10', name: 'Combo Master', description: 'Achieve a 10x combo', game: 'Matrix Frogger' },
    { id: 'frogger_distance_500', name: 'Long Distance', description: 'Travel 500 units', game: 'Matrix Frogger' }
  ],
  neoJump: [
    { id: 'neojump_first_jump', name: 'First Jump', description: 'Make your first jump', game: 'Neo Jump' },
    { id: 'neojump_altitude_1000', name: 'Rising Star', description: 'Reach 1,000 altitude', game: 'Neo Jump' },
    { id: 'neojump_altitude_5000', name: 'Sky Walker', description: 'Reach 5,000 altitude', game: 'Neo Jump' },
    { id: 'neojump_kill_enemy', name: 'Agent Slayer', description: 'Defeat an enemy', game: 'Neo Jump' },
    { id: 'neojump_kill_5', name: 'Agent Hunter', description: 'Defeat 5 enemies', game: 'Neo Jump' },
    { id: 'neojump_jetpack', name: 'Jetpack Rider', description: 'Use a jetpack', game: 'Neo Jump' },
    { id: 'neojump_spring', name: 'Spring Loaded', description: 'Use a spring platform', game: 'Neo Jump' },
    { id: 'neojump_combo_5', name: 'Bounce Combo', description: '5 bounces without touching ground', game: 'Neo Jump' }
  ],
  agentChase: [
    { id: 'agentchase_first_dot', name: 'First Pill', description: 'Collect your first red pill', game: 'Agent Chase' },
    { id: 'agentchase_first_ghost', name: 'First Ghost', description: 'Eat your first Agent', game: 'Agent Chase' },
    { id: 'agentchase_clear_level', name: 'Level Clear', description: 'Clear a level', game: 'Agent Chase' },
    { id: 'agentchase_score_10000', name: 'High Scorer', description: 'Score 10,000 points', game: 'Agent Chase' },
    { id: 'agentchase_eat_all', name: 'Agent Eliminator', description: 'Eat all 4 ghosts in one power pellet', game: 'Agent Chase' },
    { id: 'agentchase_fruit', name: 'Fruit Collector', description: 'Collect a bonus fruit', game: 'Agent Chase' },
    { id: 'agentchase_5_levels', name: 'Veteran', description: 'Survive 5 levels', game: 'Agent Chase' },
    { id: 'agentchase_no_death', name: 'Flawless Level', description: 'Complete a level without dying', game: 'Agent Chase' },
    { id: 'agentchase_all_mazes', name: 'Maze Runner', description: 'Play on all three map layouts', game: 'Agent Chase' }
  ],
  rhythmHacker: [
    { id: 'rhythm_first_perfect', name: 'Perfect Timing', description: 'Hit your first perfect note', game: 'Rhythm Hacker' },
    { id: 'rhythm_combo_50', name: 'Combo Starter', description: 'Achieve 50 combo', game: 'Rhythm Hacker' },
    { id: 'rhythm_combo_100', name: 'Combo Master', description: 'Achieve 100 combo', game: 'Rhythm Hacker' },
    { id: 'rhythm_full_combo', name: 'Full Combo', description: 'Complete a track with no misses', game: 'Rhythm Hacker' },
    { id: 'rhythm_complete_easy', name: 'Easy Clear', description: 'Complete an easy track', game: 'Rhythm Hacker' },
    { id: 'rhythm_complete_normal', name: 'Normal Clear', description: 'Complete a normal track', game: 'Rhythm Hacker' },
    { id: 'rhythm_complete_hard', name: 'Hard Clear', description: 'Complete a hard track', game: 'Rhythm Hacker' },
    { id: 'rhythm_complete_insane', name: 'Insane Clear', description: 'Complete an insane track', game: 'Rhythm Hacker' },
    { id: 'rhythm_no_miss', name: 'No Miss', description: 'Complete a track without missing', game: 'Rhythm Hacker' }
  ],
  cloudJumper: [
    { id: 'cloud_first_jump', name: 'First Jump', description: 'Make your first cloud jump', game: 'Cloud Jumper' },
    { id: 'cloud_distance_500', name: 'Cloud Hopper', description: 'Travel 500 distance', game: 'Cloud Jumper' },
    { id: 'cloud_distance_2000', name: 'Sky Traveller', description: 'Travel 2,000 distance', game: 'Cloud Jumper' },
    { id: 'cloud_collect_10', name: 'Data Collector', description: 'Collect 10 data packets', game: 'Cloud Jumper' },
    { id: 'cloud_survive_storm', name: 'Storm Survivor', description: 'Survive a storm phase', game: 'Cloud Jumper' },
    { id: 'cloud_bounce_10', name: 'Bounce Streak', description: '10 bounces without missing', game: 'Cloud Jumper' },
    { id: 'cloud_close_call', name: 'Close Call', description: 'Near miss with an obstacle', game: 'Cloud Jumper' }
  ],
  codeBreaker: [
    { id: 'breaker_first_break', name: 'First Crack', description: 'Break your first brick', game: 'Code Breaker' },
    { id: 'breaker_level_5', name: 'Firewall Piercer', description: 'Reach level 5', game: 'Code Breaker' },
    { id: 'breaker_level_10', name: 'System Liberator', description: 'Complete all 10 levels', game: 'Code Breaker' },
    { id: 'breaker_smith_slayer', name: 'Agent Eliminator', description: 'Destroy 10 Agent Smiths', game: 'Code Breaker' },
    { id: 'breaker_combo_15', name: 'Chain Breaker', description: 'Achieve a 15-brick combo', game: 'Code Breaker' },
    { id: 'breaker_multi_ball', name: 'Multi-Thread', description: 'Have 3 or more balls active', game: 'Code Breaker' },
    { id: 'breaker_bullet_time', name: 'Time Hacker', description: 'Use bullet time 5 times', game: 'Code Breaker' },
    { id: 'breaker_no_miss', name: 'Perfect Firewall', description: 'Complete a level without losing a ball', game: 'Code Breaker' },
    { id: 'breaker_boss_defeat', name: 'Boss Cracker', description: 'Defeat a boss brick', game: 'Code Breaker' },
    { id: 'breaker_high_score', name: 'Elite Breaker', description: 'Score over 10,000 points', game: 'Code Breaker' },
  ],
  // Legacy game achievements removed — crossyRoad, matrixAscension, agentEscape, jimmyMatrix
  // have been replaced by their Phaser equivalents above (matrixFrogger, neoJump, agentChase, rhythmHacker)
};

// Global achievements (meta achievements)
export const GLOBAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'global_first_game', name: 'Welcome to the Matrix', description: 'Play your first game' },
  { id: 'global_all_games', name: 'Matrix Master', description: 'Play all 12 games' },
  { id: 'global_10_achievements', name: 'Achievement Hunter', description: 'Unlock 10 achievements' },
  { id: 'global_25_achievements', name: 'Achievement Expert', description: 'Unlock 25 achievements' },
  { id: 'global_50_achievements', name: 'Achievement Legend', description: 'Unlock 50 achievements' },
  { id: 'global_night_owl', name: 'Night Owl', description: 'Play after midnight' },
  { id: 'global_dedicated', name: 'Dedicated Player', description: 'Play 7 days in a row' }
];

const STORAGE_KEY = 'matrix-arcade-save-data';
const BACKUP_KEY = 'matrix-arcade-backup';
const CURRENT_VERSION = '1.3.0';

/**
 * Migration functions for save data versions.
 * Each migration function transforms data from one version to the next.
 * Migrations are applied sequentially to bring old data up to the current version.
 */
type MigrationFunction = (data: GlobalSaveData) => GlobalSaveData;

const migrations: Record<string, MigrationFunction> = {
  /**
   * Migrate from 1.0.0 to 1.1.0:
   * - Ensures all game entries have proper default structures
   * - Adds missing ctrlSWorld-specific fields (lifelineData, ctrlSGameState)
   * - Adds playDates array if missing from globalStats
   * - Ensures stats objects are complete with all expected fields
   */
  '1.0.0': (data: GlobalSaveData): GlobalSaveData => {
    const migratedData = { ...data };

    // Ensure all game entries exist with proper defaults
    const defaultGameSave = createDefaultGameSave();
    const gameIds: Array<keyof GlobalSaveData['games']> = [
      'snakeClassic', 'vortexPong', 'matrixCloud',
      'ctrlSWorld', 'matrixInvaders', 'metris',
      'matrixFrogger', 'neoJump', 'agentChase', 'rhythmHacker', 'cloudJumper',
      'codeBreaker',
      'crossyRoad', 'matrixAscension', 'agentEscape', 'jimmyMatrix'
    ];

    for (const gameId of gameIds) {
      if (!migratedData.games[gameId]) {
        migratedData.games[gameId] = { ...defaultGameSave };
      } else {
        // Ensure stats object has all expected fields
        const currentStats = migratedData.games[gameId].stats || {};
        migratedData.games[gameId].stats = {
          gamesPlayed: currentStats.gamesPlayed ?? 0,
          totalScore: currentStats.totalScore ?? 0,
          bestCombo: currentStats.bestCombo ?? 0,
          longestSurvival: currentStats.longestSurvival ?? 0,
          bossesDefeated: currentStats.bossesDefeated ?? 0
        };

        // Ensure achievements array exists
        if (!migratedData.games[gameId].achievements) {
          migratedData.games[gameId].achievements = [];
        }
      }
    }

    // Ensure ctrlSWorld has lifelineData and ctrlSGameState
    if (!migratedData.games.ctrlSWorld.lifelineData) {
      migratedData.games.ctrlSWorld.lifelineData = createDefaultLifelineData();
    }
    if (!migratedData.games.ctrlSWorld.ctrlSGameState) {
      migratedData.games.ctrlSWorld.ctrlSGameState = createDefaultCtrlSGameState();
    }

    // Ensure globalStats has playDates array
    if (!migratedData.globalStats.playDates) {
      migratedData.globalStats.playDates = [];
    }

    // Ensure globalAchievements array exists
    if (!migratedData.globalStats.globalAchievements) {
      migratedData.globalStats.globalAchievements = [];
    }

    // Ensure settings exist
    if (!migratedData.settings) {
      migratedData.settings = { autoSave: true };
    }

    migratedData.version = '1.1.0';
    return migratedData;
  },

  /**
   * Migrate from 1.1.0 to 1.2.0:
   * - Adds Phaser game entries (matrixFrogger, neoJump, agentChase, rhythmHacker, cloudJumper)
   * - Copies high scores from legacy game IDs to new Phaser equivalents where applicable
   */
  '1.1.0': (data: GlobalSaveData): GlobalSaveData => {
    const migratedData = { ...data };
    const defaultGameSave = createDefaultGameSave();

    // Legacy → Phaser game ID mapping
    const legacyMapping: Array<[keyof GlobalSaveData['games'], keyof GlobalSaveData['games']]> = [
      ['crossyRoad', 'matrixFrogger'],
      ['matrixAscension', 'neoJump'],
      ['agentEscape', 'agentChase'],
      ['jimmyMatrix', 'rhythmHacker'],
    ];

    for (const [legacyId, newId] of legacyMapping) {
      if (!migratedData.games[newId]) {
        const legacyData = migratedData.games[legacyId];
        if (legacyData && legacyData.highScore > 0) {
          // Carry over high score and stats from legacy game
          migratedData.games[newId] = { ...defaultGameSave, highScore: legacyData.highScore, stats: { ...legacyData.stats } };
        } else {
          migratedData.games[newId] = { ...defaultGameSave };
        }
      }
    }

    // Cloud Jumper is new (no legacy equivalent)
    if (!migratedData.games.cloudJumper) {
      migratedData.games.cloudJumper = { ...defaultGameSave };
    }

    migratedData.version = '1.2.0';
    return migratedData;
  },

  '1.2.0': (data: GlobalSaveData): GlobalSaveData => {
    const migratedData = { ...data };

    const emptyBoards = Object.fromEntries(
      SCOREBOARD_GAME_IDS.map(id => [id, []])
    ) as Record<ScoreboardGameId, ScoreEntry[]>;

    migratedData.scoreboards = emptyBoards;
    migratedData.lastInitials = 'AAA';

    for (const gameId of SCOREBOARD_GAME_IDS) {
      const gameData = migratedData.games[gameId];
      if (gameData && gameData.highScore > 0) {
        migratedData.scoreboards[gameId] = [{
          initials: '???',
          score: gameData.highScore,
          level: gameData.level ?? 1,
          durationMs: 0,
          date: new Date(gameData.lastPlayed || Date.now()).toISOString(),
        }];
      }
    }

    migratedData.version = '1.3.0';
    return migratedData;
  }
};

/**
 * Apply all necessary migrations to bring save data to the current version.
 * Migrations are applied sequentially in version order.
 *
 * @param data - The save data to migrate
 * @returns The migrated save data at the current version
 */
export function migrateSaveData(data: GlobalSaveData): GlobalSaveData {
  let migratedData = { ...data };
  const versionOrder = ['1.0.0', '1.1.0', '1.2.0', '1.3.0'];

  // Handle legacy data without version (pre-1.0.0)
  if (!migratedData.version) {
    migratedData.version = '1.0.0';
  }

  // Find current version index and apply migrations sequentially
  let currentIndex = versionOrder.indexOf(migratedData.version);

  // If version not found, assume it's very old and start from beginning
  if (currentIndex === -1) {
    currentIndex = 0;
    migratedData.version = '1.0.0';
  }

  // Apply each migration from current version to latest
  while (currentIndex < versionOrder.length - 1) {
    const currentVersion = versionOrder[currentIndex];
    const migration = migrations[currentVersion];

    if (migration) {
      migratedData = migration(migratedData);
    }

    currentIndex++;
  }

  return migratedData;
}

export function useSaveSystem() {
  const [saveData, setSaveData] = useState<GlobalSaveData>(createDefaultGlobalSave);
  const saveDataRef = useRef(saveData);
  saveDataRef.current = saveData;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load save data from localStorage
  const loadSaveData = useCallback(() => {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        let parsed = JSON.parse(stored) as GlobalSaveData;

        // Version migration if needed
        if (parsed.version !== CURRENT_VERSION) {
          // Migration logging disabled in production. Enable by setting DEBUG_SAVE=true in development.
          if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_SAVE === 'true') {
             
            console.log('Migrating save data from version', parsed.version, 'to', CURRENT_VERSION);
          }
          parsed = migrateSaveData(parsed);
        }

        const defaults = createDefaultGlobalSave();
        const mergedData = {
          ...defaults,
          ...parsed,
          games: {
            ...defaults.games,
            ...parsed.games
          },
          scoreboards: {
            ...defaults.scoreboards,
            ...(parsed.scoreboards || {})
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
      if (import.meta.env.DEV) {
         
        console.error('Failed to load save data:', err);
      }
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
      if (import.meta.env.DEV) {
         
        console.error('Failed to save data:', err);
      }
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
      const gameData = prev.games[gameId] ?? createDefaultGameSave();

      const currentAchievements = gameData.achievements || [];

      if (!currentAchievements.includes(achievementId)) {
        const newData = {
          ...prev,
          games: {
            ...prev.games,
            [gameId]: {
              ...gameData,
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
      if (import.meta.env.DEV) {
         
        console.error('Failed to export save data:', err);
      }
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
          if (import.meta.env.DEV) {
             
            console.error('Failed to import save data:', err);
          }
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
      if (import.meta.env.DEV) {
         
        console.error('Failed to clear save data:', err);
      }
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
      if (import.meta.env.DEV) {
         
        console.error('Failed to restore from backup:', err);
      }
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

  const addScore = useCallback((gameId: ScoreboardGameId, entry: ScoreEntry): { qualified: boolean; rank: number | null } => {
    const prev = saveDataRef.current;
    const board = [...(prev.scoreboards[gameId] || []), entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_BOARD_SIZE);

    const idx = board.findIndex(e => e === entry);
    const qualified = idx !== -1;
    const rank = qualified ? idx + 1 : null;

    if (qualified) {
      const newData: GlobalSaveData = {
        ...prev,
        scoreboards: { ...prev.scoreboards, [gameId]: board },
        lastInitials: entry.initials,
      };
      saveDataRef.current = newData;
      setSaveData(newData);
      if (newData.settings.autoSave) {
        saveToDisk(newData);
      }
    }

    return { qualified, rank };
  }, [saveToDisk]);

  const clearBoard = useCallback((gameId: ScoreboardGameId) => {
    setSaveData(prev => {
      const newData: GlobalSaveData = {
        ...prev,
        scoreboards: { ...prev.scoreboards, [gameId]: [] },
      };
      if (newData.settings.autoSave) {
        saveToDisk(newData);
      }
      return newData;
    });
  }, [saveToDisk]);

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
    loadSaveData,
    addScore,
    clearBoard
  };
}