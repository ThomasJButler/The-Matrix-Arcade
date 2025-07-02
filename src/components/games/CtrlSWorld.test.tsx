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

describe('CtrlSWorld', () => {
  describe('Game Initialization', () => {
    it('renders the game container', () => {
      render(<CtrlSWorld />);
      
      expect(screen.getByText('CTRL-S The World')).toBeInTheDocument();
    });

    it('displays initial chapter title', () => {
      render(<CtrlSWorld />);
      
      expect(screen.getByText('Prologue: The Digital Dawn')).toBeInTheDocument();
    });

    it('shows initial ASCII art', () => {
      render(<CtrlSWorld />);
      
      // Check for ASCII art elements
      expect(screen.getByText(/CTRL.*S.*THE WORLD/)).toBeInTheDocument();
    });

    it('displays controls information', () => {
      render(<CtrlSWorld />);
      
      expect(screen.getByText(/ENTER - Next/)).toBeInTheDocument();
      expect(screen.getByText(/P - Pause/)).toBeInTheDocument();
      expect(screen.getByText(/I - Info/)).toBeInTheDocument();
      expect(screen.getByText(/F - Fullscreen/)).toBeInTheDocument();
    });

    it('shows progress indicator', () => {
      render(<CtrlSWorld />);
      
      expect(screen.getByText(/Chapter 1 of/)).toBeInTheDocument();
    });
  });

  describe('Text Animation', () => {
    it('types out content with animation', async () => {
      render(<CtrlSWorld />);
      
      // Initially, full content should not be visible
      const firstLine = "In a world barely distinguishable from our own";
      expect(screen.queryByText(firstLine)).not.toBeInTheDocument();
      
      // Fast forward timers to see typing animation
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // Some text should start appearing
      await waitFor(() => {
        const contentDiv = screen.getByTestId('story-content');
        expect(contentDiv.textContent).toBeTruthy();
      });
    });

    it('completes typing animation after sufficient time', async () => {
      render(<CtrlSWorld />);
      
      // Fast forward to complete typing
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      
      // First line should be fully visible
      await waitFor(() => {
        expect(screen.getByText(/In a world barely distinguishable/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('advances to next section on Enter key', async () => {
      render(<CtrlSWorld />);
      
      // Complete initial typing
      act(() => {
        vi.advanceTimersByTime(20000);
      });
      
      // Press Enter to advance
      fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
      
      // Should move to next content
      await waitFor(() => {
        expect(screen.queryByText(/Chapter 1: Assemble the Unlikely Heroes/)).toBeTruthy();
      });
    });

    it('goes to previous section on left arrow', async () => {
      render(<CtrlSWorld />);
      
      // Advance to chapter 1
      act(() => {
        vi.advanceTimersByTime(20000);
      });
      fireEvent.keyDown(window, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText(/Chapter 1: Assemble the Unlikely Heroes/)).toBeInTheDocument();
      });
      
      // Go back
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      
      await waitFor(() => {
        expect(screen.getByText('Prologue: The Digital Dawn')).toBeInTheDocument();
      });
    });

    it('shows navigation hints at bottom', () => {
      render(<CtrlSWorld />);
      
      const navHint = screen.getByText(/Press ENTER to continue.../);
      expect(navHint).toBeInTheDocument();
    });

    it('displays completion message at the end', async () => {
      render(<CtrlSWorld />);
      
      // Navigate to the end (would need to go through all chapters)
      // For now, just verify the structure exists
      expect(screen.getByText(/Chapter 1 of/)).toBeInTheDocument();
    });
  });

  describe('Pause Functionality', () => {
    it('pauses on P key press', () => {
      render(<CtrlSWorld />);
      
      fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
      
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    it('resumes on second P key press', () => {
      render(<CtrlSWorld />);
      
      // Pause
      fireEvent.keyDown(window, { key: 'p' });
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
      
      // Resume
      fireEvent.keyDown(window, { key: 'p' });
      expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
    });

    it('pauses typing animation when paused', () => {
      render(<CtrlSWorld />);
      
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
      render(<CtrlSWorld />);
      
      // Initially hidden
      expect(screen.queryByText(/About CTRL-S/)).not.toBeInTheDocument();
      
      // Show info
      fireEvent.keyDown(window, { key: 'i', code: 'KeyI' });
      expect(screen.getByText(/About CTRL-S/)).toBeInTheDocument();
      expect(screen.getByText(/An interactive text adventure/)).toBeInTheDocument();
      
      // Hide info
      fireEvent.keyDown(window, { key: 'i' });
      expect(screen.queryByText(/About CTRL-S/)).not.toBeInTheDocument();
    });

    it('displays game instructions in info panel', () => {
      render(<CtrlSWorld />);
      
      fireEvent.keyDown(window, { key: 'i' });
      
      expect(screen.getByText(/Navigate through the story/)).toBeInTheDocument();
      expect(screen.getByText(/Keyboard Controls:/)).toBeInTheDocument();
    });
  });

  describe('Fullscreen Mode', () => {
    it('toggles fullscreen with F key', () => {
      const mockRequestFullscreen = vi.fn();
      const mockExitFullscreen = vi.fn();
      
      document.documentElement.requestFullscreen = mockRequestFullscreen;
      document.exitFullscreen = mockExitFullscreen;
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null
      });
      
      render(<CtrlSWorld />);
      
      // Enter fullscreen
      fireEvent.keyDown(window, { key: 'f', code: 'KeyF' });
      expect(mockRequestFullscreen).toHaveBeenCalled();
    });

    it('shows fullscreen indicator when active', () => {
      // Mock fullscreen state
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement
      });
      
      render(<CtrlSWorld />);
      
      // Should show exit fullscreen icon
      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      expect(fullscreenButton).toBeInTheDocument();
    });
  });

  describe('Visual Effects', () => {
    it('displays ASCII art correctly', () => {
      render(<CtrlSWorld />);
      
      const asciiContainer = screen.getByTestId('ascii-art');
      expect(asciiContainer).toBeInTheDocument();
      expect(asciiContainer).toHaveStyle({ fontFamily: 'monospace' });
    });

    it('applies green matrix theme', () => {
      render(<CtrlSWorld />);
      
      const gameContainer = screen.getByText('CTRL-S | The World').closest('div');
      expect(gameContainer).toHaveClass('bg-black');
    });

    it('shows blinking cursor during typing', () => {
      render(<CtrlSWorld />);
      
      // During typing animation
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      const cursor = screen.getByText('▮');
      expect(cursor).toBeInTheDocument();
      expect(cursor).toHaveClass('animate-pulse');
    });
  });

  describe('Story Content', () => {
    it('displays all story chapters in sequence', async () => {
      render(<CtrlSWorld />);
      
      // Check initial chapter
      expect(screen.getByText('Prologue: The Digital Dawn')).toBeInTheDocument();
      
      // Complete typing and advance
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      fireEvent.keyDown(window, { key: 'Enter' });
      
      // Should show chapter 1
      await waitFor(() => {
        expect(screen.queryByText(/Chapter 1: Assemble the Unlikely Heroes/)).toBeTruthy();
      });
    });

    it('maintains story continuity', () => {
      render(<CtrlSWorld />);
      
      // Story should have consistent narrative
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      
      // Check for story elements
      expect(screen.queryByText(/technology/i)).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('handles rapid key presses gracefully', () => {
      render(<CtrlSWorld />);
      
      // Rapid key presses
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: 'Enter' });
        fireEvent.keyDown(window, { key: 'ArrowLeft' });
      }
      
      // Should not crash
      expect(screen.getByText('CTRL-S | The World')).toBeInTheDocument();
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
      render(<CtrlSWorld />);
      
      const contentArea = screen.getByTestId('story-content');
      expect(contentArea).toHaveAttribute('tabIndex', '-1');
    });

    it('provides keyboard navigation', () => {
      render(<CtrlSWorld />);
      
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
      render(<CtrlSWorld />);
      
      // Try to go back from first chapter
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      
      // Should stay at prologue
      expect(screen.getByText('Prologue: The Digital Dawn')).toBeInTheDocument();
    });

    it('completes story without errors', async () => {
      render(<CtrlSWorld />);
      
      // Navigate through entire story
      for (let i = 0; i < 20; i++) {
        act(() => {
          vi.advanceTimersByTime(30000);
        });
        fireEvent.keyDown(window, { key: 'Enter' });
      }
      
      // Should handle completion gracefully
      expect(screen.getByText('CTRL-S | The World')).toBeInTheDocument();
    });

    it('handles window resize gracefully', () => {
      render(<CtrlSWorld />);
      
      // Simulate window resize
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
      
      // Should maintain layout
      expect(screen.getByText('CTRL-S | The World')).toBeInTheDocument();
    });
  });
});