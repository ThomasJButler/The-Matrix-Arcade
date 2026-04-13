import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CharacterConversationModal } from './CharacterConversationModal';
import type { PuzzleData } from './PuzzleModal';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => <div ref={ref} {...props}>{children}</div>),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Radio: () => <div data-testid="radio-icon">Radio</div>,
  BarChart3: () => <div data-testid="barchart-icon">BarChart</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
}));

// Mock character personalities
vi.mock('../../data/characterPersonalities', () => ({
  getRandomCharacters: () => [
    { name: 'Neo', personality: 'determined' },
    { name: 'Trinity', personality: 'focused' },
    { name: 'Morpheus', personality: 'wise' },
  ],
  generateCharacterOpinion: (_char: unknown, answer: string, _isCorrect: boolean) => `I think the answer is ${answer}`,
  generateConsensus: (options: string[], correctAnswer: string) => {
    const result: Record<string, number> = {};
    options.forEach((opt) => {
      result[opt] = opt === correctAnswer ? 60 : 40 / (options.length - 1);
    });
    return result;
  },
}));

describe('CharacterConversationModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createPuzzle = (overrides: Partial<PuzzleData> = {}): PuzzleData => ({
    id: 'test-puzzle',
    category: 'tech',
    title: 'Test Puzzle',
    content: 'What is 2+2?',
    type: 'multiple-choice',
    answer: 'A',
    optionA: '4',
    optionB: '5',
    optionC: '3',
    optionD: '6',
    difficulty: 'easy',
    ...overrides,
  });

  describe('Rendering', () => {
    it('renders nothing when closed', () => {
      const { container } = render(
        <CharacterConversationModal
          isOpen={false}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders when open', () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText(/Intercepted Team Communication/)).toBeInTheDocument();
    });

    it('displays radio icon in header', () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByTestId('radio-icon')).toBeInTheDocument();
    });
  });

  describe('Intercepting Stage', () => {
    it('shows intercepting message initially', () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText(/Intercepting team communications/)).toBeInTheDocument();
    });

    it('displays users icon during intercepting', () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });

    it('shows loading animation bars', () => {
      const { container } = render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );
      // Should have 4 loading bars
      const loadingBars = container.querySelectorAll('.bg-green-400.rounded');
      expect(loadingBars.length).toBe(4);
    });
  });

  describe('Conversation Stage', () => {
    it('transitions to conversation stage after intercepting', async () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );

      // Advance past intercepting stage (1.5s)
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Should start showing conversation lines
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Character initials should be visible
      expect(screen.queryByText(/Intercepting team communications/)).not.toBeInTheDocument();
    });

    it('shows character names in conversation', async () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );

      // Advance to conversation stage
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      // Should show at least one character name
      const neoText = screen.queryByText('Neo');
      const trinityText = screen.queryByText('Trinity');
      const morpheusText = screen.queryByText('Morpheus');

      expect(neoText || trinityText || morpheusText).toBeTruthy();
    });
  });

  describe('Consensus Stage', () => {
    it('shows consensus section after conversation', async () => {
      const onClose = vi.fn();
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={onClose}
        />
      );

      // Advance through all stages
      // Intercepting: 1.5s
      // Each line: 1.2s * 3 = 3.6s
      // Delay to consensus: 1s
      act(() => {
        vi.advanceTimersByTime(1500 + 3600 + 1000);
      });

      expect(screen.getByText('Team Consensus')).toBeInTheDocument();
    });

    it('displays barchart icon in consensus', async () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1500 + 3600 + 1000);
      });

      expect(screen.getByTestId('barchart-icon')).toBeInTheDocument();
    });

    it('shows majority answer', async () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1500 + 3600 + 1000);
      });

      expect(screen.getByText(/Most characters agree on/)).toBeInTheDocument();
    });

    it('shows close button in consensus stage', async () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1500 + 3600 + 1000);
      });

      expect(screen.getByText(/Close \[X\]/)).toBeInTheDocument();
    });

    it('shows auto-close message', async () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1500 + 3600 + 1000);
      });

      expect(screen.getByText(/Closing in 8 seconds/)).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', async () => {
      const onClose = vi.fn();
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={onClose}
        />
      );

      // Advance to consensus stage
      act(() => {
        vi.advanceTimersByTime(1500 + 3600 + 1000);
      });

      const closeButton = screen.getByText(/Close \[X\]/);
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('auto-closes after 8 seconds in consensus', async () => {
      const onClose = vi.fn();
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={onClose}
        />
      );

      // Advance to consensus stage
      act(() => {
        vi.advanceTimersByTime(1500 + 3600 + 1000);
      });

      // Advance 8 more seconds for auto-close
      act(() => {
        vi.advanceTimersByTime(8000);
      });

      expect(onClose).toHaveBeenCalled();
    });

    it('resets state when closed and reopened', async () => {
      const onClose = vi.fn();
      const { rerender } = render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={onClose}
        />
      );

      // Advance to conversation stage
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Close
      rerender(
        <CharacterConversationModal
          isOpen={false}
          puzzle={createPuzzle()}
          onClose={onClose}
        />
      );

      // Reopen
      rerender(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={onClose}
        />
      );

      // Should be back in intercepting stage
      expect(screen.getByText(/Intercepting team communications/)).toBeInTheDocument();
    });
  });

  describe('Different Puzzle Types', () => {
    it('handles multiple-choice puzzles', () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle({ type: 'multiple-choice' })}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText(/Intercepted Team Communication/)).toBeInTheDocument();
    });

    it('handles text puzzles', () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle({ type: 'text', answer: 'correct answer' })}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText(/Intercepted Team Communication/)).toBeInTheDocument();
    });

    it('handles array answers', () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle({ answer: ['A', 'B'] })}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText(/Intercepted Team Communication/)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has backdrop blur effect', () => {
      const { container } = render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );
      expect(container.querySelector('.backdrop-blur-sm')).toBeTruthy();
    });

    it('has green border on modal', () => {
      const { container } = render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );
      expect(container.querySelector('.border-green-500')).toBeTruthy();
    });

    it('has high z-index', () => {
      const { container } = render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );
      expect(container.querySelector('.z-\\[60\\]')).toBeTruthy();
    });
  });

  describe('Conversation Lines', () => {
    it('shows character initials', async () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1500 + 1200);
      });

      // Should show at least one character initial (N, T, or M)
      const initials = ['N', 'T', 'M'];
      const foundInitial = initials.some(initial =>
        screen.queryByText(initial)
      );
      expect(foundInitial).toBe(true);
    });

    it('wraps opinions in quotes', async () => {
      render(
        <CharacterConversationModal
          isOpen={true}
          puzzle={createPuzzle()}
          onClose={vi.fn()}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1500 + 1200);
      });

      // The opinion should be wrapped in quotes
      const quotedContent = screen.queryByText(/^".*"$/);
      expect(quotedContent).toBeTruthy();
    });
  });
});
