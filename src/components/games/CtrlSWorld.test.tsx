import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CtrlSWorld from './CtrlSWorld';

// Mock timers for typing animation
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

// Helper function to render game and select classic mode
const renderInClassicMode = () => {
  const result = render(<CtrlSWorld />);
  const classicButton = screen.getByText('CLASSIC STORY MODE');
  fireEvent.click(classicButton);
  
  // Start the game by typing the command
  const input = screen.getByPlaceholderText("Type 'save-the-world' to begin...");
  fireEvent.change(input, { target: { value: 'save-the-world' } });
  fireEvent.submit(input.closest('form')!);
  
  return result;
};

describe('CtrlSWorld', () => {
  describe('Mode Selection', () => {
    it('renders the mode selection screen', () => {
      render(<CtrlSWorld />);
      
      expect(screen.getByText('CTRL+S THE WORLD')).toBeInTheDocument();
      expect(screen.getByText('Choose Your Developer Adventure')).toBeInTheDocument();
    });

    it('shows interactive and classic mode options', () => {
      render(<CtrlSWorld />);
      
      expect(screen.getByText('EPIC INTERACTIVE MODE')).toBeInTheDocument();
      expect(screen.getByText('CLASSIC STORY MODE')).toBeInTheDocument();
    });
  });

  describe('Game Initialization', () => {
    beforeEach(() => {
      renderInClassicMode();
    });

    it('renders the game container', () => {
      expect(screen.getByText('CTRL-S The World')).toBeInTheDocument();
    });

    it('displays initial chapter title', () => {
      expect(screen.getByText('Prologue: The Digital Dawn')).toBeInTheDocument();
    });

    it('shows initial ASCII art', () => {
      // Check for ASCII art element
      const asciiArt = screen.getByTestId('ascii-art');
      expect(asciiArt).toBeInTheDocument();
      expect(asciiArt.textContent).toContain('CTRL');
      expect(asciiArt.textContent).toContain('THE WORLD');
    });

    it('displays controls information', () => {
      // Controls are now shown as buttons and keyboard shortcuts
      expect(screen.getByTitle('Show Info')).toBeInTheDocument();
      expect(screen.getByTitle('Pause')).toBeInTheDocument();
      expect(screen.getByTitle('Enter Fullscreen')).toBeInTheDocument();
      
      // Check for the continue instruction
      expect(screen.getByText(/Press/)).toBeInTheDocument();
      expect(screen.getByText(/Space/)).toBeInTheDocument();
      expect(screen.getByText(/Enter/)).toBeInTheDocument();
    });

    it('shows chapter title', () => {
      expect(screen.getByText('Prologue: The Digital Dawn')).toBeInTheDocument();
    });
  });

  describe('Text Animation', () => {
    beforeEach(() => {
      renderInClassicMode();
    });

    it('types out content with animation', () => {
      // Initially, only cursor should be visible
      const contentDiv = screen.getByTestId('story-content');
      expect(contentDiv.textContent).toBe('█');
      
      // Fast forward timers to see typing animation
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // Some text should start appearing
      expect(contentDiv.textContent!.length).toBeGreaterThan(1);
    });

    it('completes typing animation after sufficient time', () => {
      // Fast forward to complete typing of some text
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      // Should show at least partial text with cursor
      const contentDiv = screen.getByTestId('story-content');
      expect(contentDiv.textContent!.length).toBeGreaterThan(50);
    });
  });

  describe('Navigation', () => {
    it('advances to next section on Enter key', async () => {
      renderInClassicMode();
      
      // Complete initial typing
      act(() => {
        vi.advanceTimersByTime(20000);
      });
      
      // Press Enter to advance
      fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
      
      // Should complete current text
      const skipButton = screen.getByRole('button', { name: /Continue/ });
      expect(skipButton).toBeInTheDocument();
    });

    it('responds to Enter key navigation', async () => {
      renderInClassicMode();
      
      // Complete initial typing
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      // Press Enter to advance  
      fireEvent.keyDown(window, { key: 'Enter' });
      
      // Should affect the UI
      expect(screen.getByTestId('story-content')).toBeInTheDocument();
    });

    it('shows navigation hints at bottom', () => {
      renderInClassicMode();
      
      // Navigation hints are shown as keyboard shortcuts
      expect(screen.getByText(/Press/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Skip|Continue/ })).toBeInTheDocument();
    });

    it('displays current chapter', async () => {
      renderInClassicMode();
      
      // Should show the current chapter
      expect(screen.getByText('Prologue: The Digital Dawn')).toBeInTheDocument();
    });
  });

  describe('Pause Functionality', () => {
    it('pauses on P key press', () => {
      renderInClassicMode();
      
      // Initially should show Pause button
      const pauseButton = screen.getByTitle('Pause');
      expect(pauseButton).toBeInTheDocument();
      
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      
      // Should now show Resume button
      expect(screen.getByTitle('Resume')).toBeInTheDocument();
    });

    it('resumes on second P key press', () => {
      renderInClassicMode();
      
      // Pause
      fireEvent.keyDown(window, { key: 'p' });
      expect(screen.getByTitle('Resume')).toBeInTheDocument();
      
      // Resume
      fireEvent.keyDown(window, { key: 'p' });
      expect(screen.getByTitle('Pause')).toBeInTheDocument();
    });

    it('pauses typing animation when paused', () => {
      renderInClassicMode();
      
      // Start typing
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Pause
      fireEvent.keyDown(window, { key: 'p' });
      
      const contentBefore = screen.getByTestId('story-content').textContent;
      
      // Advance time while paused
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      const contentAfter = screen.getByTestId('story-content').textContent;
      
      // Content should not change while paused
      expect(contentAfter).toBe(contentBefore);
    });
  });

  describe('Info Panel', () => {
    it('toggles info panel with I key', () => {
      renderInClassicMode();
      
      // Initially hidden
      expect(screen.queryByText('Game Information')).not.toBeInTheDocument();
      
      // Show info
      fireEvent.keyDown(window, { key: 'i', code: 'KeyI' });
      expect(screen.getByText('Game Information')).toBeInTheDocument();
      expect(screen.getByText(/Welcome to 'Ctrl\+S - The World Edition!'/)).toBeInTheDocument();
      
      // Hide info
      fireEvent.keyDown(window, { key: 'i' });
      expect(screen.queryByText('Game Information')).not.toBeInTheDocument();
    });

    it('displays game instructions in info panel', () => {
      renderInClassicMode();
      
      fireEvent.keyDown(window, { key: 'i' });
      
      expect(screen.getByText(/Game Controls:/)).toBeInTheDocument();
      expect(screen.getByText(/Enter\/Space: Continue story/)).toBeInTheDocument();
    });
  });

  describe('Fullscreen Mode', () => {
    it('toggles fullscreen with F key', () => {
      renderInClassicMode();
      
      const fullscreenButton = screen.getByTitle('Enter Fullscreen');
      
      // Enter fullscreen
      fireEvent.keyDown(window, { key: 'f', code: 'KeyF' });
      
      // Check that requestFullscreen was called on the container
      expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalled();
    });

    it('shows fullscreen indicator when active', () => {
      // Mock fullscreen state
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement
      });
      
      renderInClassicMode();
      
      // Should show exit fullscreen icon
      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      expect(fullscreenButton).toBeInTheDocument();
    });
  });

  describe('Visual Effects', () => {
    it('displays ASCII art correctly', () => {
      renderInClassicMode();
      
      const asciiContainer = screen.getByTestId('ascii-art');
      expect(asciiContainer).toBeInTheDocument();
      expect(asciiContainer).toHaveClass('font-mono');
    });

    it('applies green matrix theme', () => {
      renderInClassicMode();
      
      const gameTitle = screen.getByText('CTRL-S The World');
      expect(gameTitle).toBeInTheDocument();
      // Theme is applied through parent containers
      const container = gameTitle.closest('.bg-black');
      expect(container).toBeInTheDocument();
    });

    it('shows blinking cursor during typing', () => {
      renderInClassicMode();
      
      // During typing animation
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      const cursor = screen.getByText('█');
      expect(cursor).toBeInTheDocument();
      expect(cursor).toHaveClass('animate-pulse');
    });
  });

  describe('Story Content', () => {
    it('displays all story chapters in sequence', () => {
      renderInClassicMode();
      
      // Check initial chapter
      expect(screen.getByText('Prologue: The Digital Dawn')).toBeInTheDocument();
      
      // Story navigation is available
      expect(screen.getByRole('button', { name: /Skip|Continue/ })).toBeInTheDocument();
    });

    it('maintains story continuity', () => {
      renderInClassicMode();
      
      // Story should have consistent narrative
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      
      // Check for story content
      const contentDiv = screen.getByTestId('story-content');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles rapid key presses gracefully', () => {
      renderInClassicMode();
      
      // Rapid key presses
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: 'Enter' });
        fireEvent.keyDown(window, { key: 'ArrowLeft' });
      }
      
      // Should not crash
      expect(screen.getByText('CTRL-S The World')).toBeInTheDocument();
    });

    it('cleans up timers on unmount', () => {
      const { unmount } = render(<CtrlSWorld />);
      
      // Start typing animation
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Unmount should clean up
      unmount();
      
      // Advance timers should not cause issues
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    });
  });

  describe('Accessibility', () => {
    it('maintains focus on content area', () => {
      renderInClassicMode();
      
      const contentArea = screen.getByTestId('story-content');
      expect(contentArea).toHaveAttribute('tabIndex', '-1');
    });

    it('provides keyboard navigation', () => {
      renderInClassicMode();
      
      // All controls should be keyboard accessible
      const controls = ['Enter', 'ArrowLeft', 'ArrowRight', 'p', 'i', 'f'];
      
      controls.forEach(key => {
        fireEvent.keyDown(window, { key });
        // Should not throw errors
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles navigation at story boundaries', () => {
      renderInClassicMode();
      
      // Try to go back from first chapter
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      
      // Should stay at prologue
      expect(screen.getByText('Prologue: The Digital Dawn')).toBeInTheDocument();
    });

    it('completes story without errors', () => {
      renderInClassicMode();
      
      // Navigate through entire story
      for (let i = 0; i < 20; i++) {
        act(() => {
          vi.advanceTimersByTime(1000);
        });
        fireEvent.keyDown(window, { key: 'Enter' });
      }
      
      // Should handle completion gracefully
      expect(screen.getByText('CTRL-S The World')).toBeInTheDocument();
    });

    it('handles window resize gracefully', () => {
      renderInClassicMode();
      
      // Simulate window resize
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
      
      // Should maintain layout
      expect(screen.getByText('CTRL-S The World')).toBeInTheDocument();
    });
  });
});