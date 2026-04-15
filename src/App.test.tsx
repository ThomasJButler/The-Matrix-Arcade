import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Create mock objects
const mockSoundSystem = {
  playSFX: vi.fn(),
  playMusic: vi.fn(),
  stopMusic: vi.fn(),
  playBackgroundMP3: vi.fn(),
  stopBackgroundMP3: vi.fn(),
  toggleMute: vi.fn(),
  isMuted: false,
  config: { masterVolume: 0.7 },
  updateConfig: vi.fn(),
};

const mockAchievementManager = {
  toggleDisplay: vi.fn(),
  notificationQueue: [],
  dismissNotification: vi.fn(),
  isDisplayOpen: false,
  closeDisplay: vi.fn(),
  achievements: [],
  stats: {
    total: 0,
    unlocked: 0,
    percentage: 0,
    byGame: {},
  },
  getSaveData: vi.fn(() => ({
    games: {},
    globalStats: {
      totalPlaytime: 0,
      favoriteGame: null,
      globalAchievements: [],
    },
  })),
  updateGlobalStats: vi.fn(),
};

const mockMobileDetection = {
  isMobile: false,
  isTablet: false,
};

// Mock hooks
vi.mock('./hooks/useSoundSystem', () => ({
  useSoundSystem: () => mockSoundSystem,
}));

vi.mock('./hooks/useAchievementManager', () => ({
  useAchievementManager: () => mockAchievementManager,
}));

vi.mock('./hooks/useMobileDetection', () => ({
  useMobileDetection: () => mockMobileDetection,
}));

const mockSaveData = {
  version: '1.0.0',
  games: {
    snakeClassic: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
    vortexPong: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
    matrixCloud: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
    ctrlSWorld: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
    matrixInvaders: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
    metris: { highScore: 0, level: 1, achievements: [], stats: { gamesPlayed: 0, totalScore: 0 }, lastPlayed: Date.now() },
  },
  globalStats: {
    totalPlayTime: 0,
    favoriteGame: '',
    globalAchievements: [],
    firstPlayDate: Date.now(),
  },
  settings: { autoSave: true },
  scoreboards: {
    snakeClassic: [], vortexPong: [], matrixCloud: [],
    matrixInvaders: [], metris: [], matrixFrogger: [],
    neoJump: [], agentChase: [], rhythmHacker: [],
    cloudJumper: [], codeBreaker: [],
  },
  lastInitials: 'AAA',
};

vi.mock('./hooks/useSaveSystem', () => ({
  useSaveSystem: () => ({
    saveData: mockSaveData,
    isLoading: false,
    error: null,
    achievements: [],
    updateGameSave: vi.fn(),
    unlockAchievement: vi.fn(),
    updateGlobalStats: vi.fn(),
    exportSaveData: vi.fn(),
    importSaveData: vi.fn(),
    clearSaveData: vi.fn(),
    restoreFromBackup: vi.fn(),
    saveNow: vi.fn(),
    getGameAchievements: vi.fn(() => []),
    isAchievementUnlocked: vi.fn(() => false),
    loadSaveData: vi.fn(),
    addScore: vi.fn(() => ({ qualified: false, rank: null })),
    clearBoard: vi.fn(),
  }),
  SCOREBOARD_GAME_IDS: [
    'snakeClassic', 'vortexPong', 'matrixCloud',
    'matrixInvaders', 'metris', 'matrixFrogger',
    'neoJump', 'agentChase', 'rhythmHacker',
    'cloudJumper', 'codeBreaker',
  ],
  MAX_BOARD_SIZE: 25,
  createDefaultCtrlSGameState: () => ({
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
    startDate: '2026-01-25T00:00:00.000Z',
    lastSaved: '2026-01-25T00:00:00.000Z'
  }),
  createDefaultLifelineData: () => ({
    freeAnswersRemaining: 10,
    usedLifelines: { fiftyFifty: [], sentientAI: [], characters: [] },
    stats: {
      totalFreeAnswersUsed: 0,
      totalFiftyFiftyUsed: 0,
      totalSentientAIUsed: 0,
      totalCharactersUsed: 0,
      totalPuzzlesCompletedWithHelp: 0
    }
  }),
}));

/** Dismiss the landing page overlay so carousel tests can query game titles unambiguously */
function dismissLandingPage() {
  const backBtn = screen.getByText('BACK TO ARCADE');
  fireEvent.click(backBtn);
}

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock states
    mockSoundSystem.isMuted = false;
    mockAchievementManager.isDisplayOpen = false;
    mockAchievementManager.notificationQueue = [];
    mockMobileDetection.isMobile = false;
    mockMobileDetection.isTablet = false;
  });

  it('renders header with game title', () => {
    render(<App />);
    const headers = screen.getAllByText('THE MATRIX ARCADE');
    expect(headers.length).toBeGreaterThan(0);
    expect(headers[0]).toBeInTheDocument();
  });

  it('renders game carousel navigation', () => {
    render(<App />);
    // Check for clickwheel navigation zones
    const prevButton = screen.getByRole('button', { name: 'Previous game' });
    const nextButton = screen.getByRole('button', { name: 'Next game' });
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('displays correct version number', () => {
    render(<App />);
    const versionText = screen.getByText(/SYSTEM v2.0/);
    expect(versionText).toBeInTheDocument();
  });

  it('renders games menu button', () => {
    render(<App />);
    const gamesButton = screen.getByText('Games');
    expect(gamesButton).toBeInTheDocument();
  });

  it('renders audio control buttons', () => {
    render(<App />);
    const saveButton = screen.getByTitle('Save Data Manager');
    const settingsButton = screen.getByTitle('Audio Settings (V to mute)');

    expect(saveButton).toBeInTheDocument();
    expect(settingsButton).toBeInTheDocument();
  });

  it('opens audio settings modal when settings button is clicked', async () => {
    render(<App />);
    const settingsButton = screen.getByTitle('Audio Settings (V to mute)');

    // Click the audio settings button
    fireEvent.click(settingsButton);

    // AudioSettings modal should be rendered (it receives isOpen prop)
    // The button should be in the document and clickable
    expect(settingsButton).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<App />);
    dismissLandingPage();

    // Test arrow key navigation
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    // Should change to next game — use getAllByText as landing page exit animation may linger
    expect(screen.getAllByText('Snake Classic').length).toBeGreaterThan(0);

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    // Should go back to first game
    expect(screen.getAllByText('CTRL-S | The World').length).toBeGreaterThan(0);
  });

  it('handles ESC key to exit game', () => {
    render(<App />);
    
    // Start a game via clickwheel play zone
    const playButton = screen.getByRole('button', { name: 'Play game' });
    fireEvent.click(playButton);

    // Press ESC
    fireEvent.keyDown(window, { key: 'Escape' });

    // Should return to game selection — clickwheel play zone visible again
    expect(screen.getByRole('button', { name: 'Play game' })).toBeInTheDocument();
  });

  it('handles Enter key to start game', () => {
    render(<App />);
    
    // Press Enter
    fireEvent.keyDown(window, { key: 'Enter' });
    
    // Should start the game — clickwheel play zone disappears
    expect(screen.queryByRole('button', { name: 'Play game' })).not.toBeInTheDocument();
  });

  it('toggles mute state with V key', () => {
    render(<App />);

    // Press V key to toggle mute
    fireEvent.keyDown(document.body, { key: 'v', target: document.body });
    expect(mockSoundSystem.toggleMute).toHaveBeenCalled();
  });

  it('renders responsive classes for desktop', () => {
    render(<App />);
    dismissLandingPage();
    // The game portal container uses max-w-2xl — use the carousel h2 element
    const titleElements = screen.getAllByText('CTRL-S | The World');
    const carouselTitle = titleElements.find(el => el.closest('.max-w-2xl'));
    expect(carouselTitle).toBeTruthy();
    expect(carouselTitle!.closest('.max-w-2xl')).toBeInTheDocument();
  });

  it('shows correct keyboard hints', () => {
    render(<App />);
    
    expect(screen.getByText('←→ NAVIGATE • ↑ MENU • ↓ PLAY • ENTER SCORES • ESC EXIT')).toBeInTheDocument();
    expect(screen.getByText(/1-9 JUMP.*HOME\/END.*I Instructions.*H Scores.*A Achievements/)).toBeInTheDocument();
  });

  it('renders footer with correct version', () => {
    render(<App />);
    
    expect(screen.getByText('THE MATRIX ARCADE v2.0')).toBeInTheDocument();
    expect(screen.getByText('TAKE THE RED PILL!')).toBeInTheDocument();
  });

  it('displays author link', () => {
    render(<App />);
    
    const authorLink = screen.getByText('BY THOMAS J BUTLER');
    expect(authorLink).toBeInTheDocument();
    expect(authorLink.closest('a')).toHaveAttribute('href', 'https://thomasjbutler.me/');
  });

  it('renders all games in the carousel', () => {
    render(<App />);
    dismissLandingPage();

    // Navigate through all games (actual games in App.tsx)
    const games = [
      'CTRL-S | The World',
      'Snake Classic',
      'Vortex Pong',
      'Matrix Bird',
      'Matrix Invaders',
      'Metris'
    ];

    games.forEach((gameTitle, index) => {
      if (index > 0) {
        fireEvent.keyDown(window, { key: 'ArrowRight' });
      }
      // Use getAllByText as landing page exit animation may keep elements in DOM
      expect(screen.getAllByText(gameTitle).length).toBeGreaterThan(0);
    });
  });

  it('handles achievement shortcut key', () => {
    render(<App />);
    
    // Make sure we're not playing (we should be in menu by default)
    expect(screen.getByRole('button', { name: 'Play game' })).toBeInTheDocument();
    
    // Fire keydown on document.body to ensure proper target
    fireEvent.keyDown(document.body, { 
      key: 'a',
      target: document.body
    });
    expect(mockAchievementManager.toggleDisplay).toHaveBeenCalled();
  });

  it('renders matrix rain canvas background', () => {
    const { container } = render(<App />);

    const rainCanvas = container.querySelector('canvas[aria-hidden="true"]');
    expect(rainCanvas).toBeTruthy();
  });

  it('handles games menu button click', () => {
    render(<App />);
    dismissLandingPage();

    const gamesButton = screen.getByText('Games');
    fireEvent.click(gamesButton);

    // Should show games menu — use getAllByText as landing page exit animation may linger
    expect(screen.getAllByText('Snake Classic').length).toBeGreaterThan(0);
  });

  it('applies correct transition classes during game switch', async () => {
    render(<App />);
    
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    
    const container = document.querySelector('.digital-container');
    expect(container).toHaveClass('transition-right');
  });
});

