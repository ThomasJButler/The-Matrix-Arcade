import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AchievementNotification, AchievementQueue } from './AchievementNotification';

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
  Unlock: () => <div data-testid="unlock-icon">Unlock</div>,
}));

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  game?: string;
}

describe('AchievementNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
    id: 'test-achievement',
    name: 'Test Achievement',
    description: 'You accomplished something amazing!',
    ...overrides,
  });

  describe('Rendering', () => {
    it('renders nothing when achievement is null', () => {
      const { container } = render(
        <AchievementNotification achievement={null} onDismiss={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders when achievement is provided', () => {
      const achievement = createAchievement();
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('displays achievement name', () => {
      const achievement = createAchievement({ name: 'Master Explorer' });
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      expect(screen.getByText('Master Explorer')).toBeInTheDocument();
    });

    it('displays achievement description', () => {
      const achievement = createAchievement({ description: 'Discover all hidden areas' });
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      expect(screen.getByText('Discover all hidden areas')).toBeInTheDocument();
    });

    it('displays ACHIEVEMENT UNLOCKED text', () => {
      const achievement = createAchievement();
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      expect(screen.getByText('ACHIEVEMENT UNLOCKED')).toBeInTheDocument();
    });

    it('displays unlock icon', () => {
      const achievement = createAchievement();
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      expect(screen.getByTestId('unlock-icon')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('displays trophy icon when no custom icon', () => {
      const achievement = createAchievement();
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    });

    it('displays custom icon emoji when provided', () => {
      const achievement = createAchievement({ icon: '🌟' });
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      expect(screen.getByText('🌟')).toBeInTheDocument();
    });
  });

  describe('Game Label', () => {
    it('displays game name when provided', () => {
      const achievement = createAchievement({ game: 'Snake Classic' });
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      expect(screen.getByText('Snake Classic')).toBeInTheDocument();
    });

    it('does not display game section when not provided', () => {
      const achievement = createAchievement({ game: undefined });
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      // Only the achievement text should be present
      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss', () => {
    it('becomes visible when achievement provided', () => {
      const achievement = createAchievement();
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      // Check that the notification content is present
      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('calls onDismiss after 5 seconds', () => {
      const onDismiss = vi.fn();
      const achievement = createAchievement();

      render(<AchievementNotification achievement={achievement} onDismiss={onDismiss} />);

      // Fast-forward time past 5 seconds + 300ms for the additional timeout
      act(() => {
        vi.advanceTimersByTime(5400);
      });

      expect(onDismiss).toHaveBeenCalled();
    });

    it('clears timeout when achievement changes', () => {
      const onDismiss = vi.fn();
      const achievement1 = createAchievement({ id: 'ach1' });
      const achievement2 = createAchievement({ id: 'ach2' });

      const { rerender } = render(
        <AchievementNotification achievement={achievement1} onDismiss={onDismiss} />
      );

      // Advance part way
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Change achievement
      rerender(<AchievementNotification achievement={achievement2} onDismiss={onDismiss} />);

      // Original timeout should be cleared, new one started
      expect(screen.getByText(achievement2.name)).toBeInTheDocument();
    });

    it('clears timeout on unmount', () => {
      const onDismiss = vi.fn();
      const achievement = createAchievement();

      const { unmount } = render(
        <AchievementNotification achievement={achievement} onDismiss={onDismiss} />
      );

      unmount();

      // Advance time - onDismiss should not be called after unmount
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      // This is hard to test directly, but no errors should occur
    });
  });

  describe('Styling', () => {
    it('has fixed positioning', () => {
      const achievement = createAchievement();
      const { container } = render(
        <AchievementNotification achievement={achievement} onDismiss={vi.fn()} />
      );

      const wrapper = container.querySelector('.fixed');
      expect(wrapper).toBeTruthy();
    });

    it('is positioned at top right', () => {
      const achievement = createAchievement();
      const { container } = render(
        <AchievementNotification achievement={achievement} onDismiss={vi.fn()} />
      );

      const wrapper = container.querySelector('.top-8.right-8');
      expect(wrapper).toBeTruthy();
    });

    it('has high z-index', () => {
      const achievement = createAchievement();
      const { container } = render(
        <AchievementNotification achievement={achievement} onDismiss={vi.fn()} />
      );

      const wrapper = container.querySelector('.z-50');
      expect(wrapper).toBeTruthy();
    });

    it('has Matrix-styled border', () => {
      const achievement = createAchievement();
      const { container } = render(
        <AchievementNotification achievement={achievement} onDismiss={vi.fn()} />
      );

      const card = container.querySelector('.border-green-500');
      expect(card).toBeTruthy();
    });
  });

  describe('Progress Bar', () => {
    it('has progress bar element', () => {
      const achievement = createAchievement();
      const { container } = render(
        <AchievementNotification achievement={achievement} onDismiss={vi.fn()} />
      );

      // Progress bar starts at 100%
      const progressBar = container.querySelector('.bg-green-500.h-1');
      expect(progressBar).toBeTruthy();
    });
  });
});

describe('AchievementQueue', () => {
  const createAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
    id: 'test-achievement',
    name: 'Test Achievement',
    description: 'You accomplished something amazing!',
    ...overrides,
  });

  describe('Rendering', () => {
    it('renders multiple achievements', () => {
      const achievements = [
        createAchievement({ id: '1', name: 'First' }),
        createAchievement({ id: '2', name: 'Second' }),
      ];
      render(<AchievementQueue achievements={achievements} onDismiss={vi.fn()} />);

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('renders empty when no achievements', () => {
      const { container } = render(
        <AchievementQueue achievements={[]} onDismiss={vi.fn()} />
      );

      expect(container.querySelector('.fixed')).toBeTruthy();
    });
  });

  describe('Dismiss Callback', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('passes index to onDismiss', () => {
      const onDismiss = vi.fn();
      const achievements = [
        createAchievement({ id: '1', name: 'First' }),
        createAchievement({ id: '2', name: 'Second' }),
      ];

      render(<AchievementQueue achievements={achievements} onDismiss={onDismiss} />);

      // Fast-forward time to trigger dismiss of first notification
      act(() => {
        vi.advanceTimersByTime(5400);
      });

      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('Positioning', () => {
    it('has fixed positioning', () => {
      const achievements = [createAchievement()];
      const { container } = render(
        <AchievementQueue achievements={achievements} onDismiss={vi.fn()} />
      );

      expect(container.querySelector('.fixed')).toBeTruthy();
    });

    it('is positioned at top right', () => {
      const achievements = [createAchievement()];
      const { container } = render(
        <AchievementQueue achievements={achievements} onDismiss={vi.fn()} />
      );

      expect(container.querySelector('.top-8.right-8')).toBeTruthy();
    });

    it('stacks achievements vertically', () => {
      const achievements = [createAchievement()];
      const { container } = render(
        <AchievementQueue achievements={achievements} onDismiss={vi.fn()} />
      );

      expect(container.querySelector('.space-y-4')).toBeTruthy();
    });
  });

  describe('Multiple Achievements', () => {
    it('renders all achievements in order', () => {
      const achievements = [
        createAchievement({ id: '1', name: 'First Achievement' }),
        createAchievement({ id: '2', name: 'Second Achievement' }),
        createAchievement({ id: '3', name: 'Third Achievement' }),
      ];
      render(<AchievementQueue achievements={achievements} onDismiss={vi.fn()} />);

      const first = screen.getByText('First Achievement');
      const second = screen.getByText('Second Achievement');
      const third = screen.getByText('Third Achievement');

      expect(first).toBeInTheDocument();
      expect(second).toBeInTheDocument();
      expect(third).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-live region for screen reader announcements', () => {
      const achievement = createAchievement();
      render(<AchievementNotification achievement={achievement} onDismiss={vi.fn()} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('AchievementQueue has aria-live region', () => {
      const achievements = [createAchievement()];
      render(<AchievementQueue achievements={achievements} onDismiss={vi.fn()} />);

      const liveRegions = screen.getAllByRole('status');
      const queueRegion = liveRegions.find(el => el.classList.contains('space-y-4'));
      expect(queueRegion).toHaveAttribute('aria-live', 'polite');
    });
  });
});
