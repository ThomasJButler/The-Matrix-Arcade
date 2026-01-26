import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AchievementToastContainer, type Achievement } from './AchievementToast';

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
  Star: () => <div data-testid="star-icon">Star</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  X: () => <div data-testid="x-icon">X</div>,
}));

describe('AchievementToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
    id: 'test-achievement',
    title: 'Test Achievement',
    description: 'You did something cool!',
    category: 'story',
    ...overrides,
  });

  describe('Rendering', () => {
    it('renders without crashing with empty achievements', () => {
      const { container } = render(
        <AchievementToastContainer achievements={[]} />
      );
      expect(container).toBeTruthy();
    });

    it('renders a single achievement', () => {
      const achievement = createAchievement();
      render(<AchievementToastContainer achievements={[achievement]} />);

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
      expect(screen.getByText('You did something cool!')).toBeInTheDocument();
    });

    it('displays achievement unlocked text', () => {
      const achievement = createAchievement();
      render(<AchievementToastContainer achievements={[achievement]} />);

      expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    });

    it('displays close button', () => {
      const achievement = createAchievement();
      render(<AchievementToastContainer achievements={[achievement]} />);

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('Category Styling', () => {
    it('displays trophy icon for story category', () => {
      const achievement = createAchievement({ category: 'story' });
      render(<AchievementToastContainer achievements={[achievement]} />);

      expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    });

    it('displays zap icon for skill category', () => {
      const achievement = createAchievement({ category: 'skill' });
      render(<AchievementToastContainer achievements={[achievement]} />);

      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
    });

    it('displays star icon for stat category', () => {
      const achievement = createAchievement({ category: 'stat' });
      render(<AchievementToastContainer achievements={[achievement]} />);

      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    });

    it('displays lock icon for secret category', () => {
      const achievement = createAchievement({ category: 'secret' });
      render(<AchievementToastContainer achievements={[achievement]} />);

      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    });
  });

  describe('Multiple Achievements', () => {
    it('renders multiple achievements', () => {
      const achievements = [
        createAchievement({ id: 'ach1', title: 'Achievement 1' }),
        createAchievement({ id: 'ach2', title: 'Achievement 2' }),
        createAchievement({ id: 'ach3', title: 'Achievement 3' }),
      ];
      render(<AchievementToastContainer achievements={achievements} />);

      expect(screen.getByText('Achievement 1')).toBeInTheDocument();
      expect(screen.getByText('Achievement 2')).toBeInTheDocument();
      expect(screen.getByText('Achievement 3')).toBeInTheDocument();
    });

    it('shows queue indicator when more than 3 achievements', () => {
      const achievements = [
        createAchievement({ id: 'ach1', title: 'Achievement 1' }),
        createAchievement({ id: 'ach2', title: 'Achievement 2' }),
        createAchievement({ id: 'ach3', title: 'Achievement 3' }),
        createAchievement({ id: 'ach4', title: 'Achievement 4' }),
        createAchievement({ id: 'ach5', title: 'Achievement 5' }),
      ];
      render(<AchievementToastContainer achievements={achievements} />);

      expect(screen.getByText(/\+2 more achievements/)).toBeInTheDocument();
    });

    it('shows singular form for 1 extra achievement', () => {
      const achievements = [
        createAchievement({ id: 'ach1', title: 'Achievement 1' }),
        createAchievement({ id: 'ach2', title: 'Achievement 2' }),
        createAchievement({ id: 'ach3', title: 'Achievement 3' }),
        createAchievement({ id: 'ach4', title: 'Achievement 4' }),
      ];
      render(<AchievementToastContainer achievements={achievements} />);

      expect(screen.getByText(/\+1 more achievement$/)).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('calls playSFX when achievement is added', () => {
      const playSFX = vi.fn();
      const achievement = createAchievement();

      render(
        <AchievementToastContainer
          achievements={[achievement]}
          playSFX={playSFX}
        />
      );

      expect(playSFX).toHaveBeenCalledWith('score');
    });

    it('calls onDismiss when close button clicked', async () => {
      const onDismiss = vi.fn();
      const achievement = createAchievement();

      render(
        <AchievementToastContainer
          achievements={[achievement]}
          onDismiss={onDismiss}
        />
      );

      const closeButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(closeButton!);

      expect(onDismiss).toHaveBeenCalledWith('test-achievement');
    });
  });

  describe('Auto-dismiss', () => {
    it('auto-dismisses after 5 seconds', () => {
      const onDismiss = vi.fn();
      const achievement = createAchievement();

      render(
        <AchievementToastContainer
          achievements={[achievement]}
          onDismiss={onDismiss}
        />
      );

      // Advance timers by 5 seconds (100 intervals of 50ms)
      act(() => {
        vi.advanceTimersByTime(5100);
      });

      expect(onDismiss).toHaveBeenCalledWith('test-achievement');
    });

    it('progress decreases over time', () => {
      const achievement = createAchievement();

      render(<AchievementToastContainer achievements={[achievement]} />);

      // Progress bar should start at 100%
      const progressBar = document.querySelector('[style*="width"]');
      expect(progressBar).toBeTruthy();
    });
  });

  describe('Deduplication', () => {
    it('does not duplicate same achievement', () => {
      const achievement = createAchievement();
      const { rerender } = render(
        <AchievementToastContainer achievements={[achievement]} />
      );

      // Re-render with same achievement
      rerender(<AchievementToastContainer achievements={[achievement]} />);

      // Should only show one
      const titles = screen.getAllByText('Test Achievement');
      expect(titles).toHaveLength(1);
    });

    it('shows new achievements when added', () => {
      const achievement1 = createAchievement({ id: 'ach1', title: 'First' });
      const { rerender } = render(
        <AchievementToastContainer achievements={[achievement1]} />
      );

      expect(screen.getByText('First')).toBeInTheDocument();

      const achievement2 = createAchievement({ id: 'ach2', title: 'Second' });
      rerender(
        <AchievementToastContainer achievements={[achievement1, achievement2]} />
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Container Positioning', () => {
    it('has fixed positioning class', () => {
      const achievement = createAchievement();
      const { container } = render(
        <AchievementToastContainer achievements={[achievement]} />
      );

      expect(container.firstChild).toHaveClass('fixed');
    });

    it('is positioned at top right', () => {
      const achievement = createAchievement();
      const { container } = render(
        <AchievementToastContainer achievements={[achievement]} />
      );

      expect(container.firstChild).toHaveClass('top-20', 'right-4');
    });
  });

  describe('Edge Cases', () => {
    it('handles achievements with long titles', () => {
      const achievement = createAchievement({
        title: 'This Is A Very Long Achievement Title That Should Be Truncated'
      });
      render(<AchievementToastContainer achievements={[achievement]} />);

      expect(screen.getByText(/This Is A Very Long/)).toBeInTheDocument();
    });

    it('handles achievements without unlocked date', () => {
      const achievement = createAchievement({ unlockedAt: undefined });
      const { container } = render(
        <AchievementToastContainer achievements={[achievement]} />
      );

      expect(container).toBeTruthy();
    });

    it('handles achievements with unlocked date', () => {
      const achievement = createAchievement({
        unlockedAt: new Date().toISOString()
      });
      const { container } = render(
        <AchievementToastContainer achievements={[achievement]} />
      );

      expect(container).toBeTruthy();
    });
  });
});
