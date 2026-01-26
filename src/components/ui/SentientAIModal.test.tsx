import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { SentientAIModal } from './SentientAIModal';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Cpu: () => <div data-testid="cpu-icon">CPU</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
}));

// Mock AI responses
vi.mock('../../data/aiResponses', () => ({
  generateAIResponse: (_difficulty: string, _puzzleType: string, answer: string | string[]) => ({
    intro: 'After analysing the data patterns...',
    answer: Array.isArray(answer) ? answer[0] : answer,
    outro: 'Probability of accuracy: 95%',
  }),
  getThinkingState: () => 'Processing neural pathways...',
  AI_RESPONSES: {},
  PUZZLE_TYPE_RESPONSES: {},
  AI_THINKING_STATES: [],
}));

describe('SentientAIModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    difficulty: 'medium' as const,
    puzzleType: 'trivia',
    answer: 'The correct answer',
    onClose: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders nothing when closed', () => {
      const { container } = render(<SentientAIModal {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when open', () => {
      render(<SentientAIModal {...defaultProps} />);
      expect(screen.getByText(/Sentient AI/)).toBeInTheDocument();
    });

    it('displays CPU icon in header', () => {
      render(<SentientAIModal {...defaultProps} />);
      expect(screen.getByTestId('cpu-icon')).toBeInTheDocument();
    });

    it('displays robot emoji in title', () => {
      render(<SentientAIModal {...defaultProps} />);
      expect(screen.getByText(/🤖/)).toBeInTheDocument();
    });
  });

  describe('Thinking Stage', () => {
    it('shows thinking message initially', () => {
      render(<SentientAIModal {...defaultProps} />);
      expect(screen.getByText('Processing neural pathways...')).toBeInTheDocument();
    });

    it('shows loading dots animation', () => {
      const { container } = render(<SentientAIModal {...defaultProps} />);
      // Should have 3 loading dots
      const dots = container.querySelectorAll('.rounded-full.bg-cyan-400');
      expect(dots.length).toBe(3);
    });

    it('shows progress bar', () => {
      const { container } = render(<SentientAIModal {...defaultProps} />);
      const progressBar = container.querySelector('.bg-gradient-to-r.from-cyan-500');
      expect(progressBar).toBeTruthy();
    });

    it('updates thinking text periodically', () => {
      render(<SentientAIModal {...defaultProps} />);

      // Initial thinking text
      expect(screen.getByText('Processing neural pathways...')).toBeInTheDocument();

      // Advance time (thinking updates every 600ms)
      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Text should still be present (mocked to return same value)
      expect(screen.getByText('Processing neural pathways...')).toBeInTheDocument();
    });
  });

  describe('Revealing Stage', () => {
    it('transitions to revealing stage after 2 seconds', () => {
      render(<SentientAIModal {...defaultProps} />);

      // Advance past thinking stage (2s)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('After analysing the data patterns...')).toBeInTheDocument();
    });

    it('displays AI intro text', () => {
      render(<SentientAIModal {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('After analysing the data patterns...')).toBeInTheDocument();
    });

    it('displays the answer', () => {
      render(<SentientAIModal {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('The correct answer')).toBeInTheDocument();
    });

    it('displays ANSWER label', () => {
      render(<SentientAIModal {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('ANSWER:')).toBeInTheDocument();
    });

    it('displays AI outro text', () => {
      render(<SentientAIModal {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('Probability of accuracy: 95%')).toBeInTheDocument();
    });

    it('shows zap icon after revealing', () => {
      render(<SentientAIModal {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
    });

    it('shows auto-close message', () => {
      render(<SentientAIModal {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('Closing in 5 seconds...')).toBeInTheDocument();
    });

    it('shows close button in revealing stage', () => {
      render(<SentientAIModal {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText(/Close \[X\]/)).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<SentientAIModal {...defaultProps} onClose={onClose} />);

      // Advance to revealing stage
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const closeButton = screen.getByText(/Close \[X\]/);
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('auto-closes after 5 seconds in revealing stage', async () => {
      const onClose = vi.fn();
      render(<SentientAIModal {...defaultProps} onClose={onClose} />);

      // Advance to revealing stage (2s) + auto-close delay (5s) + close animation (0.5s)
      act(() => {
        vi.advanceTimersByTime(2000 + 5000 + 500);
      });

      expect(onClose).toHaveBeenCalled();
    });

    it('resets state when closed and reopened', async () => {
      const { rerender } = render(<SentientAIModal {...defaultProps} />);

      // Advance to revealing stage
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Close
      rerender(<SentientAIModal {...defaultProps} isOpen={false} />);

      // Reopen
      rerender(<SentientAIModal {...defaultProps} isOpen={true} />);

      // Should be back in thinking stage
      expect(screen.getByText('Processing neural pathways...')).toBeInTheDocument();
    });
  });

  describe('Different Props', () => {
    it('handles easy difficulty', () => {
      render(<SentientAIModal {...defaultProps} difficulty="easy" />);
      expect(screen.getByText(/Sentient AI/)).toBeInTheDocument();
    });

    it('handles hard difficulty', () => {
      render(<SentientAIModal {...defaultProps} difficulty="hard" />);
      expect(screen.getByText(/Sentient AI/)).toBeInTheDocument();
    });

    it('handles array answers', () => {
      render(<SentientAIModal {...defaultProps} answer={['A', 'B', 'C']} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('handles different puzzle types', () => {
      render(<SentientAIModal {...defaultProps} puzzleType="math" />);
      expect(screen.getByText(/Sentient AI/)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has high z-index', () => {
      const { container } = render(<SentientAIModal {...defaultProps} />);
      expect(container.querySelector('.z-\\[60\\]')).toBeTruthy();
    });

    it('has backdrop blur', () => {
      const { container } = render(<SentientAIModal {...defaultProps} />);
      expect(container.querySelector('.backdrop-blur-sm')).toBeTruthy();
    });

    it('has cyan border (AI theme)', () => {
      const { container } = render(<SentientAIModal {...defaultProps} />);
      expect(container.querySelector('.border-cyan-500')).toBeTruthy();
    });

    it('has cyan-themed header', () => {
      render(<SentientAIModal {...defaultProps} />);
      const title = screen.getByText(/Sentient AI/);
      expect(title).toHaveClass('text-cyan-400');
    });
  });

  describe('Footer Animation', () => {
    it('displays animated dots in footer', () => {
      const { container } = render(<SentientAIModal {...defaultProps} />);
      const footerDots = container.querySelectorAll('.bg-cyan-400\\/50');
      expect(footerDots.length).toBe(3);
    });
  });

  describe('Answer Highlight', () => {
    it('answer section has special styling', async () => {
      const { container } = render(<SentientAIModal {...defaultProps} />);

      // Advance past the 2 second thinking phase to trigger reveal
      act(() => {
        vi.advanceTimersByTime(2500);
      });

      // The answer box has classes: bg-cyan-900/40 border-2 border-cyan-400
      // After revealing stage, the element should be in the DOM
      const answerBox = container.querySelector('[class*="border-cyan-400"][class*="bg-cyan-900"]');
      expect(answerBox).toBeTruthy();
    });
  });
});
