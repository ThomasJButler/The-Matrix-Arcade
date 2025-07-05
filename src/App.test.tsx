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
    const versionText = screen.getByText(/SYSTEM v1.0.5/);
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
    const muteButton = screen.getByTitle('Mute Sound');
    const settingsButton = screen.getByTitle('Audio Settings');
    
    expect(saveButton).toBeInTheDocument();
    expect(muteButton).toBeInTheDocument();
    expect(settingsButton).toBeInTheDocument();
  });

  it('shows volume slider on hover', async () => {
    render(<App />);
    const muteButton = screen.getByTitle('Mute Sound');
    
    // Volume slider container should have opacity-0 initially
    const volumeContainer = muteButton.parentElement?.querySelector('.group-hover\\:opacity-100');
    expect(volumeContainer).toHaveClass('opacity-0');
    
    // Hover over mute button parent
    fireEvent.mouseEnter(muteButton.parentElement!);
    
    // Volume slider should be in the DOM (even if not visible)
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('type', 'range');
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

  it('toggles mute state', () => {
    render(<App />);
    const muteButton = screen.getByTitle('Mute Sound');
    
    fireEvent.click(muteButton);
    expect(mockSoundSystem.toggleMute).toHaveBeenCalled();
  });

  it('renders responsive classes for desktop', () => {
    render(<App />);
    const container = screen.getByText('CTRL-S | The World').closest('.max-w-6xl');
    
    expect(container).toHaveClass('lg:py-8', 'lg:px-8');
  });

  it('shows correct keyboard hints', () => {
    render(<App />);
    
    expect(screen.getByText('← → Navigate Games • Enter to Play • ESC to Exit')).toBeInTheDocument();
    expect(screen.getByText('A for Achievements • V to Toggle Mute')).toBeInTheDocument();
  });

  it('renders footer with correct version', () => {
    render(<App />);
    
    expect(screen.getByText('THE MATRIX ARCADE v1.0.5')).toBeInTheDocument();
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
    
    // Navigate through all games
    const games = [
      'CTRL-S | The World',
      'Snake Classic',
      'Vortex Pong',
      'Terminal Quest',
      'Matrix Cloud',
      'Matrix Invaders'
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

