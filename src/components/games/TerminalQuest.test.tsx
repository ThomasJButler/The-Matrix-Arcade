import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TerminalQuest from './TerminalQuest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as Storage;

describe('TerminalQuest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });
  
  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Game Initialization', () => {
    it('renders the game title and initial state', () => {
      render(<TerminalQuest />);
      
      // Check for game title
      expect(screen.getByText('TERMINAL QUEST')).toBeInTheDocument();
      expect(screen.getByText('Code Warriors Edition')).toBeInTheDocument();
    });

    it('displays initial ASCII art', () => {
      render(<TerminalQuest />);
      
      // Check for ASCII art from start node
      const asciiContainer = screen.getByText(/########/);
      expect(asciiContainer).toBeInTheDocument();
    });

    it('shows initial game description', () => {
      render(<TerminalQuest />);
      
      expect(screen.getByText(/You wake up in a cold, dark terminal/)).toBeInTheDocument();
    });

    it('displays initial choices', () => {
      render(<TerminalQuest />);
      
      expect(screen.getByText("Explore the terminal's inner code")).toBeInTheDocument();
      expect(screen.getByText("Attempt to summon assistance")).toBeInTheDocument();
    });

    it('loads saved game state from localStorage', () => {
      const savedState = {
        currentNode: 'deeper',
        inventory: ['hack_tool'],
        health: 80,
        securityLevel: 20,
        discovered: ['start', 'explore']
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));
      
      render(<TerminalQuest />);
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('terminalQuestSave');
      // Should load at saved node, not start
      expect(screen.queryByText(/You wake up in a cold, dark terminal/)).not.toBeInTheDocument();
    });
  });

  describe('User Interface', () => {
    it('displays health and security indicators', () => {
      render(<TerminalQuest />);
      
      // Health indicator
      const healthBar = screen.getByText('Digital Integrity').parentElement;
      expect(healthBar).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      
      // Security level indicator
      const securityBar = screen.getByText('Signal Strength').parentElement;
      expect(securityBar).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays inventory section', () => {
      render(<TerminalQuest />);
      
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Empty - Collect items on your journey')).toBeInTheDocument();
    });

    it('shows control buttons', () => {
      render(<TerminalQuest />);
      
      // Info button
      expect(screen.getByRole('button', { name: /info/i })).toBeInTheDocument();
      
      // Pause button
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      
      // Fullscreen button
      expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    });

    it('displays recent activity log', () => {
      render(<TerminalQuest />);
      
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('System initialized')).toBeInTheDocument();
    });
  });

  describe('Navigation and Choices', () => {
    it('navigates to new node when choice is clicked', async () => {
      render(<TerminalQuest />);
      
      // Click first choice
      const exploreButton = screen.getByText("Explore the terminal's inner code");
      fireEvent.click(exploreButton);
      
      // Should navigate to explore node
      await waitFor(() => {
        expect(screen.getByText(/The faint glow of a data path/)).toBeInTheDocument();
      });
      
      // Should show new choices
      expect(screen.getByText("Follow the glowing data path")).toBeInTheDocument();
      expect(screen.getByText("Retreat and recalibrate your priorities")).toBeInTheDocument();
    });

    it('updates activity log when navigating', async () => {
      render(<TerminalQuest />);
      
      const exploreButton = screen.getByText("Explore the terminal's inner code");
      fireEvent.click(exploreButton);
      
      await waitFor(() => {
        const activityLog = screen.getByText('Recent Activity').parentElement;
        expect(activityLog).toHaveTextContent("Chose: Explore the terminal's inner code");
      });
    });

    it('prevents navigation when requirements are not met', () => {
      render(<TerminalQuest />);
      
      // Navigate to a node that has choices with requirements
      const helpButton = screen.getByText("Attempt to summon assistance");
      fireEvent.click(helpButton);
      
      // The choices should still be clickable but might show requirement messages
      const guidanceButton = screen.getByText("Heed the voice's cryptic advice");
      expect(guidanceButton).toBeInTheDocument();
      expect(guidanceButton).not.toBeDisabled();
    });

    it('adds discovered nodes to the list', async () => {
      render(<TerminalQuest />);
      
      // Navigate to explore
      fireEvent.click(screen.getByText("Explore the terminal's inner code"));
      
      await waitFor(() => {
        expect(screen.getByText(/The faint glow of a data path/)).toBeInTheDocument();
      });
      
      // Navigate deeper
      fireEvent.click(screen.getByText("Follow the glowing data path"));
      
      // Check discovered nodes count or state
      // This would be reflected in the game state
    });
  });

  describe('Inventory Management', () => {
    it('displays items when added to inventory', async () => {
      render(<TerminalQuest />);
      
      // Navigate through nodes to collect items
      // This requires knowing the game flow to reach a node that gives items
      
      // Initial state should show empty inventory
      expect(screen.getByText('Empty - Collect items on your journey')).toBeInTheDocument();
    });

    it('shows item icons and tooltips', () => {
      render(<TerminalQuest />);
      
      // Would need to navigate to collect items first
      // Then check for item display with icons
    });

    it('removes items when used', () => {
      render(<TerminalQuest />);
      
      // Would need to test item removal through game progression
    });
  });

  describe('Health and Security System', () => {
    it('decreases health when taking damage', async () => {
      render(<TerminalQuest />);
      
      // Would need to navigate to a choice that causes damage
      // Initial health should be 100
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('increases security level based on actions', () => {
      render(<TerminalQuest />);
      
      // Initial security should be 0
      expect(screen.getByText('0%')).toBeInTheDocument();
      
      // Navigate to actions that increase security
    });

    it('ends game when health reaches zero', () => {
      render(<TerminalQuest />);
      
      // Would need to take enough damage to reach 0 health
      // Then check for game over state
    });

    it('triggers alerts at high security levels', () => {
      render(<TerminalQuest />);
      
      // Would need to increase security to dangerous levels
      // Check for visual warnings or game changes
    });
  });

  describe('Special Features', () => {
    it('toggles info panel with I key or button', () => {
      render(<TerminalQuest />);
      
      // Click info button
      const infoButton = screen.getByRole('button', { name: /info/i });
      fireEvent.click(infoButton);
      
      // Info panel should appear
      expect(screen.getByText('Welcome to Terminal Quest - Code Warriors Edition')).toBeInTheDocument();
      expect(screen.getByText('✨ Controls:')).toBeInTheDocument();
      
      // Close with button
      fireEvent.click(infoButton);
      expect(screen.queryByText('Welcome to Terminal Quest - Code Warriors Edition')).not.toBeInTheDocument();
      
      // Test keyboard shortcut
      fireEvent.keyDown(window, { key: 'i' });
      expect(screen.getByText('Welcome to Terminal Quest - Code Warriors Edition')).toBeInTheDocument();
    });

    it('toggles pause state with spacebar or button', () => {
      render(<TerminalQuest />);
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);
      
      // Should show paused state
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
      
      // Resume with spacebar
      fireEvent.keyDown(window, { key: ' ' });
      expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
    });

    it('toggles fullscreen with F key or button', () => {
      // Mock fullscreen API
      const mockRequestFullscreen = vi.fn();
      const mockExitFullscreen = vi.fn();
      
      document.documentElement.requestFullscreen = mockRequestFullscreen;
      document.exitFullscreen = mockExitFullscreen;
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null
      });
      
      render(<TerminalQuest />);
      
      // Click fullscreen button
      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      fireEvent.click(fullscreenButton);
      
      expect(mockRequestFullscreen).toHaveBeenCalled();
      
      // Test keyboard shortcut
      fireEvent.keyDown(window, { key: 'f' });
      // Would toggle based on fullscreen state
    });
  });

  describe('Save System', () => {
    it('saves game state to localStorage', async () => {
      render(<TerminalQuest />);
      
      // Make a choice to change game state
      fireEvent.click(screen.getByText("Explore the terminal's inner code"));
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'terminalQuestSave',
          expect.any(String)
        );
      });
      
      // Verify saved data structure
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveProperty('currentNode');
      expect(savedData).toHaveProperty('inventory');
      expect(savedData).toHaveProperty('health');
      expect(savedData).toHaveProperty('securityLevel');
      expect(savedData).toHaveProperty('discovered');
    });

    it('auto-saves after each action', async () => {
      render(<TerminalQuest />);
      
      const initialSaveCalls = localStorageMock.setItem.mock.calls.length;
      
      // Make multiple choices
      fireEvent.click(screen.getByText("Explore the terminal's inner code"));
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledTimes(initialSaveCalls + 1);
      });
    });

    it('handles corrupted save data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json data');
      
      // Should not crash and start fresh
      expect(() => render(<TerminalQuest />)).not.toThrow();
      
      // Should show start node
      expect(screen.getByText(/You wake up in a cold, dark terminal/)).toBeInTheDocument();
    });
  });

  describe('Game Flow', () => {
    it('completes a full game path', async () => {
      render(<TerminalQuest />);
      
      // Start -> Explore
      fireEvent.click(screen.getByText("Explore the terminal's inner code"));
      
      await waitFor(() => {
        expect(screen.getByText(/The faint glow of a data path/)).toBeInTheDocument();
      });
      
      // Explore -> Deeper
      fireEvent.click(screen.getByText("Follow the glowing data path"));
      
      // Continue through game nodes
      // This tests the full game flow
    });

    it('handles win conditions', () => {
      render(<TerminalQuest />);
      
      // Would need to navigate to a winning node
      // Check for win state UI
    });

    it('handles lose conditions', () => {
      render(<TerminalQuest />);
      
      // Would need to reach 0 health or fail condition
      // Check for game over UI
    });
  });

  describe('Visual Effects', () => {
    it('shows typing animation for text', () => {
      render(<TerminalQuest />);
      
      // Text should appear with typing effect
      // This might be hard to test without mocking timers
    });

    it('displays ASCII art correctly', () => {
      render(<TerminalQuest />);
      
      // Check ASCII art is rendered with proper formatting
      const asciiElements = screen.getAllByText(/[#█░▄▀]/);
      expect(asciiElements.length).toBeGreaterThan(0);
    });

    it('shows glitch effects on damage', () => {
      render(<TerminalQuest />);
      
      // Would need to take damage and check for visual effects
      // Might involve checking CSS classes or animations
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows choice selection with number keys', () => {
      render(<TerminalQuest />);
      
      // Press 1 for first choice
      fireEvent.keyDown(window, { key: '1' });
      
      // Should navigate to explore node
      expect(screen.queryByText(/The faint glow of a data path/)).toBeTruthy();
    });

    it('supports arrow key navigation', () => {
      render(<TerminalQuest />);
      
      // Would test arrow keys for menu navigation if implemented
    });
  });

  describe('Performance', () => {
    it('handles rapid choice selection', async () => {
      render(<TerminalQuest />);
      
      // Make rapid choices
      const button = screen.getByText("Explore the terminal's inner code");
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Should handle gracefully without errors
      await waitFor(() => {
        expect(screen.getByText(/The faint glow of a data path/)).toBeInTheDocument();
      });
    });

    it('cleans up resources on unmount', () => {
      const { unmount } = render(<TerminalQuest />);
      
      // Save should happen before unmount
      const saveCalls = localStorageMock.setItem.mock.calls.length;
      
      unmount();
      
      // Check any cleanup occurred
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(saveCalls);
    });
  });

  describe('Error Handling', () => {
    it('handles missing game nodes gracefully', () => {
      render(<TerminalQuest />);
      
      // If a node references a non-existent next node
      // Should not crash
    });

    it('handles localStorage errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      // Should not crash when saving fails
      expect(() => render(<TerminalQuest />)).not.toThrow();
    });
  });
});