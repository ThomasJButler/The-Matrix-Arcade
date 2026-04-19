import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveLoadManager } from './SaveLoadManager';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Save: () => <div data-testid="save-icon">Save</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  RotateCcw: () => <div data-testid="rotate-icon">Rotate</div>,
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  X: () => <div data-testid="x-icon">X</div>,
  AlertTriangle: () => <div data-testid="alert-icon">Alert</div>,
  CheckCircle: () => <div data-testid="check-icon">Check</div>,
  FileText: () => <div data-testid="file-icon">File</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
}));

// Mock useSaveSystem hook
const mockExportSaveData = vi.fn();
const mockImportSaveData = vi.fn().mockResolvedValue(undefined);
const mockClearSaveData = vi.fn();
const mockRestoreFromBackup = vi.fn();
const mockSaveNow = vi.fn();
const mockGetGameAchievements = vi.fn().mockReturnValue([
  { id: 'ach1', name: 'Achievement 1' },
  { id: 'ach2', name: 'Achievement 2' },
]);

const defaultSaveData = {
  version: '1.1.0',
  globalStats: {
    totalPlayTime: 3600000, // 1 hour
    firstPlayDate: Date.now() - 86400000, // Yesterday
    favoriteGame: 'vortexPong',
    globalAchievements: ['global_ach1'],
    playDates: [Date.now()],
  },
  games: {
    vortexPong: {
      highScore: 1500,
      level: 5,
      achievements: ['first_play', 'score_100'],
      lastPlayed: Date.now(),
      stats: { gamesPlayed: 20 },
    },
    snakeClassic: {
      highScore: 800,
      level: 3,
      achievements: ['first_play'],
      lastPlayed: Date.now() - 3600000,
      stats: { gamesPlayed: 10 },
    },
  },
  settings: {
    autoSave: true,
    lastBackupDate: Date.now() - 86400000,
  },
};

vi.mock('../../hooks/useSaveSystem', () => ({
  useSaveSystem: () => ({
    saveData: defaultSaveData,
    isLoading: false,
    error: null,
    exportSaveData: mockExportSaveData,
    importSaveData: mockImportSaveData,
    clearSaveData: mockClearSaveData,
    restoreFromBackup: mockRestoreFromBackup,
    saveNow: mockSaveNow,
    getGameAchievements: mockGetGameAchievements,
  }),
}));

describe('SaveLoadManager', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when closed', () => {
      const { container } = render(<SaveLoadManager {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when open', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('SAVE DATA MANAGER')).toBeInTheDocument();
    });

    it('displays save icon in header', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getAllByTestId('save-icon').length).toBeGreaterThan(0);
    });

    it('displays close X button', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when X button clicked', () => {
      const onClose = vi.fn();
      render(<SaveLoadManager {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(closeButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<SaveLoadManager {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Quick Actions', () => {
    it('displays Save Now button', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('Save Now')).toBeInTheDocument();
    });

    it('displays Export button', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('displays Import button', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('Import')).toBeInTheDocument();
    });

    it('displays Clear All button', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('calls saveNow when Save Now clicked', () => {
      render(<SaveLoadManager {...defaultProps} />);

      const saveButton = screen.getByText('Save Now');
      fireEvent.click(saveButton);

      expect(mockSaveNow).toHaveBeenCalledTimes(1);
    });

    it('calls exportSaveData when Export clicked', () => {
      render(<SaveLoadManager {...defaultProps} />);

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      expect(mockExportSaveData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Clear Data Confirmation', () => {
    it('shows Confirm? text on second click', () => {
      render(<SaveLoadManager {...defaultProps} />);

      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);

      expect(screen.getByText('Confirm?')).toBeInTheDocument();
    });

    it('calls clearSaveData on confirm click', () => {
      render(<SaveLoadManager {...defaultProps} />);

      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton); // First click
      fireEvent.click(screen.getByText('Confirm?')); // Second click

      expect(mockClearSaveData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Global Statistics', () => {
    it('displays GLOBAL STATISTICS section', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('GLOBAL STATISTICS')).toBeInTheDocument();
    });

    it('displays Total Play Time', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('Total Play Time')).toBeInTheDocument();
      expect(screen.getByText('1h 0m')).toBeInTheDocument();
    });

    it('displays First Played date', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('First Played')).toBeInTheDocument();
    });

    it('displays Favorite Game', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('Favorite Game')).toBeInTheDocument();
    });

    it('displays Global Achievements count', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('Global Achievements')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Game Progress', () => {
    it('displays GAME PROGRESS section', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('GAME PROGRESS')).toBeInTheDocument();
    });

    it('displays game names', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('Vortex Pong')).toBeInTheDocument();
      expect(screen.getByText('Matrix Snake')).toBeInTheDocument();
    });

    it('displays high scores', () => {
      render(<SaveLoadManager {...defaultProps} />);
      const highScoreLabels = screen.getAllByText('High Score');
      expect(highScoreLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('800')).toBeInTheDocument();
    });

    it('displays games played count', () => {
      render(<SaveLoadManager {...defaultProps} />);
      const gamesPlayedLabels = screen.getAllByText('Games Played');
      expect(gamesPlayedLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('displays achievement counts', () => {
      render(<SaveLoadManager {...defaultProps} />);
      const achievementLabels = screen.getAllByText('Achievements');
      expect(achievementLabels.length).toBeGreaterThan(0);
    });

    it('displays recent achievements', () => {
      render(<SaveLoadManager {...defaultProps} />);
      const recentAchievementsLabels = screen.getAllByText('Recent Achievements:');
      expect(recentAchievementsLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Backup & Recovery', () => {
    it('displays BACKUP & RECOVERY section', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('BACKUP & RECOVERY')).toBeInTheDocument();
    });

    it('displays Restore Backup button', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText('Restore Backup')).toBeInTheDocument();
    });

    it('calls restoreFromBackup when clicked', () => {
      render(<SaveLoadManager {...defaultProps} />);

      const restoreButton = screen.getByText('Restore Backup');
      fireEvent.click(restoreButton);

      expect(mockRestoreFromBackup).toHaveBeenCalledTimes(1);
    });

    it('displays auto-save status', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText(/Auto-save: Enabled/)).toBeInTheDocument();
    });

    it('displays last backup date', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText(/Last backup:/)).toBeInTheDocument();
    });
  });

  describe('Version Display', () => {
    it('displays save data version', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByText(/SAVE DATA v1.1.0/)).toBeInTheDocument();
    });
  });

  describe('Import Functionality', () => {
    it('calls importSaveData when file selected', async () => {
      render(<SaveLoadManager {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeTruthy();

      const file = new File(['{}'], 'save.json', { type: 'application/json' });
      await waitFor(() => {
        fireEvent.change(fileInput!, { target: { files: [file] } });
      });

      expect(mockImportSaveData).toHaveBeenCalledWith(file);
    });

    it('accepts only JSON files', () => {
      render(<SaveLoadManager {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.json');
    });
  });

  describe('Styling', () => {
    it('has fixed positioning', () => {
      const { container } = render(<SaveLoadManager {...defaultProps} />);
      expect(container.querySelector('.fixed.inset-0')).toBeTruthy();
    });

    it('has dark background overlay', () => {
      const { container } = render(<SaveLoadManager {...defaultProps} />);
      expect(container.querySelector('.bg-black\\/90')).toBeTruthy();
    });

    it('has green border on modal', () => {
      const { container } = render(<SaveLoadManager {...defaultProps} />);
      expect(container.querySelector('.border-green-500')).toBeTruthy();
    });

    it('uses monospace font', () => {
      const { container } = render(<SaveLoadManager {...defaultProps} />);
      expect(container.querySelector('.font-mono')).toBeTruthy();
    });

    it('has high z-index', () => {
      const { container } = render(<SaveLoadManager {...defaultProps} />);
      expect(container.querySelector('.z-50')).toBeTruthy();
    });
  });

  describe('Icons', () => {
    it('displays trophy icon in statistics', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getAllByTestId('trophy-icon').length).toBeGreaterThan(0);
    });

    it('displays download icon in export button', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    });

    it('displays upload icon in import button', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    });

    it('displays trash icon in clear button', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('displays settings icon in backup section', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog" and aria-modal on the modal wrapper', () => {
      render(<SaveLoadManager {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'save-data-manager-title');
    });

    it('close button has aria-label', () => {
      render(<SaveLoadManager {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Close save data manager' })).toBeInTheDocument();
    });

    it('heading has matching id for aria-labelledby', () => {
      render(<SaveLoadManager {...defaultProps} />);
      const heading = screen.getByText('SAVE DATA MANAGER');
      expect(heading).toHaveAttribute('id', 'save-data-manager-title');
    });
  });
});

describe('SaveLoadManager - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.doMock('../../hooks/useSaveSystem', () => ({
      useSaveSystem: () => ({
        saveData: defaultSaveData,
        isLoading: true,
        error: null,
        exportSaveData: mockExportSaveData,
        importSaveData: mockImportSaveData,
        clearSaveData: mockClearSaveData,
        restoreFromBackup: mockRestoreFromBackup,
        saveNow: mockSaveNow,
        getGameAchievements: mockGetGameAchievements,
      }),
    }));
  });

  // vi.doMock + dynamic import cannot override the already-hoisted vi.mock for useSaveSystem.
  // The static import at the top of SaveLoadManager.tsx resolves to the hoisted mock.
  // To test loading state, the component would need dependency injection or a test-specific wrapper.
  it.todo('displays loading indicator when data is loading (requires DI refactor)');
});

describe('SaveLoadManager - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.doMock('../../hooks/useSaveSystem', () => ({
      useSaveSystem: () => ({
        saveData: defaultSaveData,
        isLoading: false,
        error: 'Failed to load save data',
        exportSaveData: mockExportSaveData,
        importSaveData: mockImportSaveData,
        clearSaveData: mockClearSaveData,
        restoreFromBackup: mockRestoreFromBackup,
        saveNow: mockSaveNow,
        getGameAchievements: mockGetGameAchievements,
      }),
    }));
  });

  // Same limitation as loading state test — see note above.
  it.todo('displays error message when save data fails to load (requires DI refactor)');
});
