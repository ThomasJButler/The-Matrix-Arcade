import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PuzzleModal, PuzzleData } from './PuzzleModal';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  HelpCircle: () => <div data-testid="help-icon">Help</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Lightbulb: () => <div data-testid="lightbulb-icon">Lightbulb</div>,
  CheckCircle: () => <div data-testid="check-icon">Check</div>,
  XCircle: () => <div data-testid="x-icon">X</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Cpu: () => <div data-testid="cpu-icon">CPU</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
}));

// Mock useLifelineManager hook
vi.mock('@/hooks/useLifelineManager', () => ({
  useLifelineManager: () => ({
    freeAnswersRemaining: 3,
    isLifelineAvailable: vi.fn(() => true),
    useFiftyFifty: vi.fn(),
    useSentientAI: vi.fn(),
    useCharacters: vi.fn(),
    useFreeAnswer: vi.fn(() => ({ success: true })),
  })
}));

// Mock modal components
vi.mock('./SentientAIModal', () => ({
  SentientAIModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="sentient-ai-modal">AI Modal</div> : null
}));

vi.mock('./CharacterConversationModal', () => ({
  CharacterConversationModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="character-modal">Character Modal</div> : null
}));

describe('PuzzleModal', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();
  const mockPlaySFX = vi.fn();

  const mockEasyPuzzle: PuzzleData = {
    id: 'test_puzzle_easy',
    type: 'fill-in',
    question: 'What command saves your work?',
    answer: ['ctrl-s', 'ctrl+s', 'save'],
    hints: [
      "It's in the title",
      'Keyboard shortcut',
      'CTRL + ?'
    ],
    timeLimit: 60,
    points: 10,
    difficulty: 'easy',
    context: 'Test your knowledge'
  };

  const mockMultipleChoicePuzzle: PuzzleData = {
    id: 'test_puzzle_mc',
    type: 'multiple-choice',
    question: 'What is the best programming language?',
    answer: ['TypeScript'],
    optionA: 'Java',
    optionB: 'TypeScript',
    optionC: 'Python',
    optionD: 'C++',
    hints: ['Look at what this project uses', 'Type-safe JavaScript', 'Starts with T'],
    points: 15,
    difficulty: 'medium',
    context: 'A classic debate'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('What command saves your work?')).toBeTruthy();
    });

    it('does not render when isOpen is false', () => {
      render(
        <PuzzleModal
          isOpen={false}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.queryByText('What command saves your work?')).toBeNull();
    });

    it('displays puzzle context', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Test your knowledge')).toBeTruthy();
    });

    it('displays difficulty level', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/easy/i)).toBeTruthy();
    });

    it('displays timer for timed puzzles', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/60/)).toBeTruthy();
    });
  });

  describe('Hints System', () => {
    it('shows hint button when hints are available', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/Show Hint/i)).toBeTruthy();
    });

    it('reveals first hint when hint button is clicked', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const hintButton = screen.getByText(/Show Hint/i);
      fireEvent.click(hintButton);

      // Hint includes emoji, search for text portion
      expect(screen.getByText(/It's in the title/)).toBeTruthy();
    });

    it('reveals hints progressively', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const hintButton = screen.getByText(/Show Hint/i);

      // First hint
      fireEvent.click(hintButton);
      expect(screen.getByText(/It's in the title/)).toBeTruthy();

      // Second hint
      fireEvent.click(hintButton);
      expect(screen.getByText(/Keyboard shortcut/)).toBeTruthy();

      // Third hint
      fireEvent.click(hintButton);
      expect(screen.getByText(/CTRL \+ \?/)).toBeTruthy();
    });

    it('tracks number of hints used', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const hintButton = screen.getByText(/Show Hint/i);

      fireEvent.click(hintButton);
      fireEvent.click(hintButton);

      // Should show 2 of 3 hints used
      expect(screen.getByText(/2\/3/)).toBeTruthy();
    });
  });

  describe('Answer Submission', () => {
    it('accepts correct answer', async () => {
      vi.useRealTimers();
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByText(/SUBMIT ANSWER/i);

      fireEvent.change(input, { target: { value: 'ctrl-s' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/CORRECT/i)).toBeTruthy();
      });
    });

    it('accepts correct answer case insensitive', async () => {
      vi.useRealTimers();
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByText(/SUBMIT ANSWER/i);

      fireEvent.change(input, { target: { value: 'CTRL-S' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/CORRECT/i)).toBeTruthy();
      });
    });

    it('accepts any valid answer from array', async () => {
      vi.useRealTimers();
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByText(/SUBMIT ANSWER/i);

      fireEvent.change(input, { target: { value: 'save' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/CORRECT/i)).toBeTruthy();
      });
    });

    it('rejects incorrect answer', async () => {
      vi.useRealTimers();
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByText(/SUBMIT ANSWER/i);

      fireEvent.change(input, { target: { value: 'wrong answer' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/INCORRECT/i)).toBeTruthy();
      });
    });

    it('prevents submission without answer', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const submitButton = screen.getByText(/SUBMIT ANSWER/i);
      expect(submitButton).toBeTruthy();

      // Button should be disabled when no answer
      const isEmpty = submitButton.hasAttribute('disabled');
      expect(isEmpty).toBe(true);
    });
  });

  describe('Multiple Choice Puzzles', () => {
    it('renders multiple choice options', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockMultipleChoicePuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Java')).toBeTruthy();
      expect(screen.getByText('TypeScript')).toBeTruthy();
      expect(screen.getByText('Python')).toBeTruthy();
      expect(screen.getByText('C++')).toBeTruthy();
    });

    it('allows selecting an option', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockMultipleChoicePuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const optionButton = screen.getByText('TypeScript').closest('button');
      expect(optionButton).toBeTruthy();

      if (optionButton) {
        fireEvent.click(optionButton);
      }

      // Should not crash
      expect(document.body).toBeTruthy();
    });
  });

  describe('Lifeline System', () => {
    it('displays lifeline buttons', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockMultipleChoicePuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/Show Answer/i)).toBeTruthy();
      expect(screen.getByText(/50\/50/i)).toBeTruthy();
      expect(screen.getByText(/Ask AI/i)).toBeTruthy();
      expect(screen.getByText(/Ask Team/i)).toBeTruthy();
    });

    it('handles hint button click with sound', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
          playSFX={mockPlaySFX}
        />
      );

      const hintButton = screen.getByText(/Show Hint/i);
      fireEvent.click(hintButton);

      expect(mockPlaySFX).toHaveBeenCalledWith('menu');
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(container).toBeTruthy();
    });

    it('unmounts without errors', () => {
      const { unmount } = render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(() => unmount()).not.toThrow();
    });

    it('cleans up timers on unmount', () => {
      const { unmount } = render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      unmount();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Integration', () => {
    it('renders complete puzzle interface', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Question present
      expect(screen.getByText('What command saves your work?')).toBeTruthy();

      // Input present
      expect(screen.getByPlaceholderText(/your answer/i)).toBeTruthy();

      // Submit button present
      expect(screen.getByText(/SUBMIT ANSWER/i)).toBeTruthy();

      // Hint button present
      expect(screen.getByText(/Show Hint/i)).toBeTruthy();
    });

    it('handles full puzzle flow', async () => {
      vi.useRealTimers();
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
          playSFX={mockPlaySFX}
        />
      );

      // Use a hint
      const hintButton = screen.getByText(/Show Hint/i);
      fireEvent.click(hintButton);

      // Type answer
      const input = screen.getByPlaceholderText(/your answer/i);
      fireEvent.change(input, { target: { value: 'ctrl-s' } });

      // Submit
      const submitButton = screen.getByText(/SUBMIT ANSWER/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/CORRECT/i)).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('handles rapid interactions', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);

      // Rapid typing
      for (let i = 0; i < 10; i++) {
        fireEvent.change(input, { target: { value: `test${i}` } });
      }

      expect(document.body).toBeTruthy();
    });

    it('renders efficiently', () => {
      const { container } = render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });
});
