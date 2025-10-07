import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PuzzleModal, PuzzleData } from './PuzzleModal';

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
      'It\'s in the title',
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
    answer: ['B'],
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

      expect(screen.getByText('What command saves your work?')).toBeInTheDocument();
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

      expect(screen.queryByText('What command saves your work?')).not.toBeInTheDocument();
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

      expect(screen.getByText('Test your knowledge')).toBeInTheDocument();
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

      expect(screen.getByText(/easy/i)).toBeInTheDocument();
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

      expect(screen.getByText(/60/)).toBeInTheDocument();
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

      expect(screen.getByRole('button', { name: /hint/i })).toBeInTheDocument();
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

      const hintButton = screen.getByRole('button', { name: /hint/i });
      fireEvent.click(hintButton);

      expect(screen.getByText('It\'s in the title')).toBeInTheDocument();
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

      const hintButton = screen.getByRole('button', { name: /hint/i });

      // First hint
      fireEvent.click(hintButton);
      expect(screen.getByText('It\'s in the title')).toBeInTheDocument();

      // Second hint
      fireEvent.click(hintButton);
      expect(screen.getByText('Keyboard shortcut')).toBeInTheDocument();

      // Third hint
      fireEvent.click(hintButton);
      expect(screen.getByText('CTRL + ?')).toBeInTheDocument();
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

      const hintButton = screen.getByRole('button', { name: /hint/i });

      fireEvent.click(hintButton);
      fireEvent.click(hintButton);

      expect(screen.getByText(/2.*3/)).toBeInTheDocument(); // "2 of 3 hints used"
    });
  });

  describe('Answer Submission', () => {
    it('accepts correct answer (exact match)', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'ctrl-s' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(true, 0);
      });
    });

    it('accepts correct answer (case insensitive)', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'CTRL-S' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(true, 0);
      });
    });

    it('accepts any valid answer from array', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'save' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(true, 0);
      });
    });

    it('rejects incorrect answer', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'wrong answer' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
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

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('passes hints used count on completion', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const hintButton = screen.getByRole('button', { name: /hint/i });
      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      // Use 2 hints
      fireEvent.click(hintButton);
      fireEvent.click(hintButton);

      // Submit correct answer
      fireEvent.change(input, { target: { value: 'ctrl-s' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(true, 2);
      });
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

      expect(screen.getByText('Java')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('C++')).toBeInTheDocument();
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

      const optionB = screen.getByLabelText(/TypeScript/i);
      fireEvent.click(optionB);

      expect(optionB).toBeChecked();
    });

    it('validates correct multiple choice answer', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockMultipleChoicePuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const optionB = screen.getByLabelText(/TypeScript/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.click(optionB);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(true, 0);
      });
    });
  });

  describe('Timer Functionality', () => {
    it('counts down timer every second', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/60/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/59/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/58/)).toBeInTheDocument();
    });

    it('auto-submits when timer reaches zero', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      act(() => {
        vi.advanceTimersByTime(60000); // 60 seconds
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(false, 0);
      });
    });

    it('shows warning when time is running low', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      act(() => {
        vi.advanceTimersByTime(50000); // 50 seconds, 10 remaining
      });

      const timer = screen.getByText(/10/);
      expect(timer).toHaveClass(/text-red/); // Warning color
    });
  });

  describe('Keyboard Navigation', () => {
    it('submits on Enter key press', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);

      fireEvent.change(input, { target: { value: 'ctrl-s' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(true, 0);
      });
    });

    it('closes on Escape key press', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('State Reset', () => {
    it('resets state when new puzzle opens', () => {
      const { rerender } = render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      fireEvent.change(input, { target: { value: 'test' } });

      const hintButton = screen.getByRole('button', { name: /hint/i });
      fireEvent.click(hintButton);

      // Render with new puzzle
      rerender(
        <PuzzleModal
          isOpen={true}
          puzzle={mockMultipleChoicePuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // State should be reset
      expect(screen.queryByText('It\'s in the title')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('focuses input when modal opens', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/your answer/i);
        expect(input).toHaveFocus();
      });
    });

    it('has proper ARIA labels', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Sound Effects', () => {
    it('plays sound on hint reveal', () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
          playSFX={mockPlaySFX}
        />
      );

      const hintButton = screen.getByRole('button', { name: /hint/i });
      fireEvent.click(hintButton);

      expect(mockPlaySFX).toHaveBeenCalledWith('hint');
    });

    it('plays sound on correct answer', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
          playSFX={mockPlaySFX}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'ctrl-s' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPlaySFX).toHaveBeenCalledWith('success');
      });
    });

    it('plays sound on incorrect answer', async () => {
      render(
        <PuzzleModal
          isOpen={true}
          puzzle={mockEasyPuzzle}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
          playSFX={mockPlaySFX}
        />
      );

      const input = screen.getByPlaceholderText(/your answer/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPlaySFX).toHaveBeenCalledWith('error');
      });
    });
  });
});
