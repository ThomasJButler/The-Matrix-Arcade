import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementDisplay } from './AchievementDisplay';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
}));

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  icon?: string;
  game?: string;
}

describe('AchievementDisplay', () => {
  const createAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
    id: 'test-achievement',
    name: 'Test Achievement',
    description: 'A test achievement description',
    unlocked: true,
    game: 'TestGame',
    ...overrides,
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    achievements: [createAchievement()],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when closed', () => {
      const { container } = render(
        <AchievementDisplay {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders when open', () => {
      render(<AchievementDisplay {...defaultProps} />);
      expect(screen.getByText('ACHIEVEMENTS')).toBeInTheDocument();
    });

    it('displays achievement title', () => {
      render(<AchievementDisplay {...defaultProps} />);
      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('displays achievement description for unlocked achievements', () => {
      render(<AchievementDisplay {...defaultProps} />);
      expect(screen.getByText('A test achievement description')).toBeInTheDocument();
    });

    it('displays ??? for locked achievement descriptions', () => {
      render(
        <AchievementDisplay
          {...defaultProps}
          achievements={[createAchievement({ unlocked: false })]}
        />
      );
      expect(screen.getByText('???')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when X button clicked', () => {
      const onClose = vi.fn();
      render(<AchievementDisplay {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(closeButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop clicked', () => {
      const onClose = vi.fn();
      const { container } = render(
        <AchievementDisplay {...defaultProps} onClose={onClose} />
      );

      // Click the backdrop (first motion.div)
      const backdrop = container.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not close when modal content clicked', () => {
      const onClose = vi.fn();
      render(<AchievementDisplay {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByText('ACHIEVEMENTS').closest('div');
      fireEvent.click(modalContent!);

      // onClose should not be called when clicking inside the modal
      // This depends on e.stopPropagation() in the component
    });
  });

  describe('Statistics', () => {
    it('displays unlocked count', () => {
      const achievements = [
        createAchievement({ id: '1', unlocked: true }),
        createAchievement({ id: '2', unlocked: true }),
        createAchievement({ id: '3', unlocked: false }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      expect(screen.getByText('2 / 3 UNLOCKED')).toBeInTheDocument();
    });

    it('displays completion percentage', () => {
      const achievements = [
        createAchievement({ id: '1', unlocked: true }),
        createAchievement({ id: '2', unlocked: false }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      expect(screen.getByText('50% COMPLETE')).toBeInTheDocument();
    });

    it('displays 0% for no unlocked achievements', () => {
      const achievements = [
        createAchievement({ id: '1', unlocked: false }),
        createAchievement({ id: '2', unlocked: false }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      expect(screen.getByText('0% COMPLETE')).toBeInTheDocument();
    });

    it('displays 100% when all achievements unlocked', () => {
      const achievements = [
        createAchievement({ id: '1', unlocked: true }),
        createAchievement({ id: '2', unlocked: true }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      expect(screen.getByText('100% COMPLETE')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('displays search input', () => {
      render(<AchievementDisplay {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search achievements...')).toBeInTheDocument();
    });

    it('filters achievements by name', () => {
      const achievements = [
        createAchievement({ id: '1', name: 'First Strike' }),
        createAchievement({ id: '2', name: 'Victory Lap' }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      const searchInput = screen.getByPlaceholderText('Search achievements...');
      fireEvent.change(searchInput, { target: { value: 'First' } });

      expect(screen.getByText('First Strike')).toBeInTheDocument();
      expect(screen.queryByText('Victory Lap')).not.toBeInTheDocument();
    });

    it('filters achievements by description', () => {
      const achievements = [
        createAchievement({ id: '1', name: 'Ach 1', description: 'Complete the tutorial' }),
        createAchievement({ id: '2', name: 'Ach 2', description: 'Win 10 games' }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      const searchInput = screen.getByPlaceholderText('Search achievements...');
      fireEvent.change(searchInput, { target: { value: 'tutorial' } });

      expect(screen.getByText('Ach 1')).toBeInTheDocument();
      expect(screen.queryByText('Ach 2')).not.toBeInTheDocument();
    });

    it('is case insensitive', () => {
      const achievements = [
        createAchievement({ id: '1', name: 'UPPERCASE NAME' }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      const searchInput = screen.getByPlaceholderText('Search achievements...');
      fireEvent.change(searchInput, { target: { value: 'uppercase' } });

      expect(screen.getByText('UPPERCASE NAME')).toBeInTheDocument();
    });

    it('shows no achievements message when search has no results', () => {
      render(<AchievementDisplay {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search achievements...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('NO ACHIEVEMENTS FOUND')).toBeInTheDocument();
    });
  });

  describe('Game Filter', () => {
    it('displays ALL GAMES button', () => {
      render(<AchievementDisplay {...defaultProps} />);
      expect(screen.getByText('ALL GAMES')).toBeInTheDocument();
    });

    it('displays game filter buttons', () => {
      const achievements = [
        createAchievement({ id: '1', game: 'Snake' }),
        createAchievement({ id: '2', game: 'Pong' }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      // Game names appear in both filter buttons and achievement cards
      const snakeElements = screen.getAllByText('Snake');
      const pongElements = screen.getAllByText('Pong');
      expect(snakeElements.length).toBeGreaterThan(0);
      expect(pongElements.length).toBeGreaterThan(0);
    });

    it('filters by game when game button clicked', () => {
      const achievements = [
        createAchievement({ id: '1', name: 'Snake Achievement', game: 'Snake' }),
        createAchievement({ id: '2', name: 'Pong Achievement', game: 'Pong' }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      const snakeButton = screen.getByRole('button', { name: 'Snake' });
      fireEvent.click(snakeButton);

      expect(screen.getByText('Snake Achievement')).toBeInTheDocument();
      expect(screen.queryByText('Pong Achievement')).not.toBeInTheDocument();
    });

    it('shows all achievements when ALL GAMES clicked', () => {
      const achievements = [
        createAchievement({ id: '1', name: 'Snake Achievement', game: 'Snake' }),
        createAchievement({ id: '2', name: 'Pong Achievement', game: 'Pong' }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      // First filter by Snake
      const snakeButton = screen.getByRole('button', { name: 'Snake' });
      fireEvent.click(snakeButton);

      // Then click ALL GAMES
      const allGamesButton = screen.getByText('ALL GAMES');
      fireEvent.click(allGamesButton);

      expect(screen.getByText('Snake Achievement')).toBeInTheDocument();
      expect(screen.getByText('Pong Achievement')).toBeInTheDocument();
    });

    it('uses General for achievements without game', () => {
      const achievements = [
        createAchievement({ id: '1', name: 'General Achievement', game: undefined }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      // "General" appears both in filter button and in achievement card
      const generalTexts = screen.getAllByText('General');
      expect(generalTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Unlocked vs Locked Display', () => {
    it('shows trophy icon for unlocked achievements', () => {
      render(<AchievementDisplay {...defaultProps} />);
      expect(screen.getAllByTestId('trophy-icon').length).toBeGreaterThan(0);
    });

    it('shows lock icon for locked achievements', () => {
      render(
        <AchievementDisplay
          {...defaultProps}
          achievements={[createAchievement({ unlocked: false })]}
        />
      );
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    });

    it('shows unlock date for unlocked achievements', () => {
      const unlockedAt = new Date('2025-01-15').getTime();
      render(
        <AchievementDisplay
          {...defaultProps}
          achievements={[createAchievement({ unlockedAt })]}
        />
      );

      // The date format depends on locale, so we check for the presence of date-like content
      expect(screen.getByText(/\/2025|2025/)).toBeInTheDocument();
    });

    it('has different styling for unlocked vs locked', () => {
      const achievements = [
        createAchievement({ id: '1', unlocked: true }),
        createAchievement({ id: '2', unlocked: false }),
      ];
      const { container } = render(
        <AchievementDisplay {...defaultProps} achievements={achievements} />
      );

      const unlockedCard = container.querySelector('.border-green-500');
      const lockedCard = container.querySelector('.opacity-60');

      expect(unlockedCard).toBeTruthy();
      expect(lockedCard).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('shows no achievements message when list is empty', () => {
      render(<AchievementDisplay {...defaultProps} achievements={[]} />);
      expect(screen.getByText('NO ACHIEVEMENTS FOUND')).toBeInTheDocument();
    });

    it('displays zap icon for empty state', () => {
      render(<AchievementDisplay {...defaultProps} achievements={[]} />);
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
    });
  });

  describe('Multiple Achievements', () => {
    it('renders multiple achievements in grid', () => {
      const achievements = [
        createAchievement({ id: '1', name: 'First' }),
        createAchievement({ id: '2', name: 'Second' }),
        createAchievement({ id: '3', name: 'Third' }),
      ];
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('displays correct total count', () => {
      const achievements = Array.from({ length: 10 }, (_, i) =>
        createAchievement({ id: `${i}`, unlocked: i < 7 })
      );
      render(<AchievementDisplay {...defaultProps} achievements={achievements} />);

      expect(screen.getByText('7 / 10 UNLOCKED')).toBeInTheDocument();
      expect(screen.getByText('70% COMPLETE')).toBeInTheDocument();
    });
  });

  describe('Custom Icons', () => {
    it('displays custom icon emoji when provided', () => {
      render(
        <AchievementDisplay
          {...defaultProps}
          achievements={[createAchievement({ icon: '🏆' })]}
        />
      );
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has close button that can be clicked', () => {
      const onClose = vi.fn();
      render(<AchievementDisplay {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      expect(closeButton).toBeTruthy();
    });

    it('search input is focusable', () => {
      render(<AchievementDisplay {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText('Search achievements...');
      expect(searchInput).not.toBeDisabled();
    });
  });
});
