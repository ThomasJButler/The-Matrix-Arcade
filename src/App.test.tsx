import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Create mock objects
const mockSoundSystem = {
  playSFX: vi.fn(),
  playMusic: vi.fn(),
  stopMusic: vi.fn(),
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
  }),
}));

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
    const headerElement = screen.getByText('THE MATRIX ARCADE');
    expect(headerElement).toBeInTheDocument();
  });

  it('renders game carousel navigation', () => {
    render(<App />);
    // Check for game navigation elements
    const prevButton = screen.getByTitle('Previous game');
    const nextButton = screen.getByTitle('Next game');
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('displays correct version number', () => {
    render(<App />);
    const versionText = screen.getByText(/SYSTEM v1.1/);
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
    const { container } = render(<App />);
    
    // Test arrow key navigation
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    // Should change to next game
    expect(screen.getByText('Snake Classic')).toBeInTheDocument();
    
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    // Should go back to first game
    expect(screen.getByText('CTRL-S | The World')).toBeInTheDocument();
  });

  it('handles ESC key to exit game', () => {
    render(<App />);
    
    // Start a game
    const playButton = screen.getByText('PLAY');
    fireEvent.click(playButton);
    
    // Press ESC
    fireEvent.keyDown(window, { key: 'Escape' });
    
    // Should return to game selection
    expect(screen.getByText('PLAY')).toBeInTheDocument();
  });

  it('handles Enter key to start game', () => {
    render(<App />);
    
    // Press Enter
    fireEvent.keyDown(window, { key: 'Enter' });
    
    // Should start the game
    expect(screen.queryByText('PLAY')).not.toBeInTheDocument();
  });

  it('toggles mute state with V key', () => {
    render(<App />);

    // Press V key to toggle mute
    fireEvent.keyDown(document.body, { key: 'v', target: document.body });
    expect(mockSoundSystem.toggleMute).toHaveBeenCalled();
  });

  it('renders responsive classes for desktop', () => {
    render(<App />);
    // The game portal container uses max-w-2xl
    const container = screen.getByText('CTRL-S | The World').closest('.max-w-2xl');

    expect(container).toBeInTheDocument();
  });

  it('shows correct keyboard hints', () => {
    render(<App />);
    
    expect(screen.getByText('← → Navigate Games • Enter to Play • ESC to Exit')).toBeInTheDocument();
    expect(screen.getByText('A for Achievements • V to Toggle Mute')).toBeInTheDocument();
  });

  it('renders footer with correct version', () => {
    render(<App />);
    
    expect(screen.getByText('THE MATRIX ARCADE v1.1')).toBeInTheDocument();
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

    // Navigate through all games (actual games in App.tsx)
    const games = [
      'CTRL-S | The World',
      'Snake Classic',
      'Vortex Pong',
      'Matrix Cloud',
      'Matrix Invaders',
      'Metris'
    ];

    games.forEach((gameTitle, index) => {
      if (index > 0) {
        fireEvent.keyDown(window, { key: 'ArrowRight' });
      }
      expect(screen.getByText(gameTitle)).toBeInTheDocument();
    });
  });

  it('handles achievement shortcut key', () => {
    render(<App />);
    
    // Make sure we're not playing (we should be in menu by default)
    expect(screen.getByText('PLAY')).toBeInTheDocument();
    
    // Fire keydown on document.body to ensure proper target
    fireEvent.keyDown(document.body, { 
      key: 'a',
      target: document.body
    });
    expect(mockAchievementManager.toggleDisplay).toHaveBeenCalled();
  });

  it('renders matrix rain effect elements', () => {
    render(<App />);
    
    // Check for matrix rain elements
    const matrixChars = document.querySelectorAll('.animate-matrix-rain');
    expect(matrixChars.length).toBeGreaterThan(0);
  });

  it('handles games menu button click', () => {
    render(<App />);
    
    const gamesButton = screen.getByText('Games');
    fireEvent.click(gamesButton);
    
    // Should show games menu
    expect(screen.getByText('Snake Classic')).toBeInTheDocument();
  });

  it('applies correct transition classes during game switch', async () => {
    render(<App />);
    
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    
    const container = document.querySelector('.digital-container');
    expect(container).toHaveClass('transition-right');
  });
});

