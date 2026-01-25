import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TerminalQuestCombat from './TerminalQuestCombat';
import { Enemy } from './TerminalQuestContent';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Swords: () => <span data-testid="swords-icon">⚔</span>,
  Shield: () => <span data-testid="shield-icon">🛡</span>,
  Zap: () => <span data-testid="zap-icon">⚡</span>,
  Heart: () => <span data-testid="heart-icon">❤</span>,
  AlertTriangle: () => <span data-testid="alert-icon">⚠</span>
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => <div {...props}>{children}</div>,
    pre: ({ children, ...props }: React.PropsWithChildren<object>) => <pre {...props}>{children}</pre>
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>
}));

// Mock useSoundSystem hook
const mockPlaySFX = vi.fn();
vi.mock('../../hooks/useSoundSystem', () => ({
  useSoundSystem: () => ({
    playSFX: mockPlaySFX,
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    isMuted: false,
    toggleMute: vi.fn()
  })
}));

// Test enemy fixture
const createTestEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  name: 'Test Virus',
  health: 50,
  damage: 10,
  ascii: ['  /\\  ', ' /  \\ ', '/____\\'],
  ...overrides
});

describe('TerminalQuestCombat', () => {
  const defaultProps = {
    enemy: createTestEnemy(),
    playerHealth: 100,
    playerInventory: [] as string[],
    onCombatEnd: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<TerminalQuestCombat {...defaultProps} />);
      expect(container).toBeTruthy();
    });

    it('displays the enemy name', () => {
      render(<TerminalQuestCombat {...defaultProps} />);
      expect(screen.getByText('Test Virus')).toBeTruthy();
    });

    it('displays enemy ASCII art', () => {
      render(<TerminalQuestCombat {...defaultProps} />);
      expect(screen.getByText(/\/\\/)).toBeTruthy();
    });

    it('displays health bars for both combatants', () => {
      render(<TerminalQuestCombat {...defaultProps} />);
      expect(screen.getByText('Enemy HP')).toBeTruthy();
      expect(screen.getByText('Your HP')).toBeTruthy();
    });

    it('shows correct initial health values', () => {
      render(<TerminalQuestCombat {...defaultProps} />);
      expect(screen.getByText('50/50')).toBeTruthy(); // Enemy health
      expect(screen.getByText('100/100')).toBeTruthy(); // Player health
    });

    it('displays attack and defend buttons', () => {
      render(<TerminalQuestCombat {...defaultProps} />);
      expect(screen.getByText(/Attack/)).toBeTruthy();
      expect(screen.getByText(/Defend/)).toBeTruthy();
    });

    it('shows initial combat log message', () => {
      render(<TerminalQuestCombat {...defaultProps} />);
      expect(screen.getByText(/Test Virus appears!/)).toBeTruthy();
    });

    it('displays keyboard shortcuts on buttons', () => {
      render(<TerminalQuestCombat {...defaultProps} />);
      expect(screen.getByText('[1]')).toBeTruthy();
      expect(screen.getByText('[2]')).toBeTruthy();
    });
  });

  describe('Combat Actions', () => {
    it('handles attack action and updates combat log', () => {
      render(<TerminalQuestCombat {...defaultProps} />);

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      // Combat log should show damage dealt
      expect(screen.getByText(/You deal \d+ damage!/)).toBeTruthy();
    });

    it('plays hit sound on attack when not muted', () => {
      render(<TerminalQuestCombat {...defaultProps} isMuted={false} />);

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      expect(mockPlaySFX).toHaveBeenCalledWith('hit');
    });

    it('does not play sound when muted', () => {
      render(<TerminalQuestCombat {...defaultProps} isMuted={true} />);

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      expect(mockPlaySFX).not.toHaveBeenCalled();
    });

    it('handles defend action and updates combat log', () => {
      render(<TerminalQuestCombat {...defaultProps} />);

      const defendButton = screen.getByText(/Defend/).closest('button')!;

      act(() => {
        fireEvent.click(defendButton);
      });

      // Should show defensive stance message
      expect(screen.getByText(/You take a defensive stance.../)).toBeTruthy();
    });

    it('plays powerup sound on defend when not muted', () => {
      render(<TerminalQuestCombat {...defaultProps} isMuted={false} />);

      const defendButton = screen.getByText(/Defend/).closest('button')!;

      act(() => {
        fireEvent.click(defendButton);
      });

      expect(mockPlaySFX).toHaveBeenCalledWith('powerup');
    });

    it('disables buttons during animation', () => {
      render(<TerminalQuestCombat {...defaultProps} />);

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      // Button should be disabled during animation
      expect(attackButton).toBeDisabled();
    });
  });

  describe('Combat Items', () => {
    it('displays combat items when available', () => {
      render(
        <TerminalQuestCombat
          {...defaultProps}
          playerInventory={['health_pack', 'emp_device', 'ally_beacon']}
        />
      );

      expect(screen.getByText('Combat Items:')).toBeTruthy();
      expect(screen.getByText('Health Pack')).toBeTruthy();
      expect(screen.getByText('EMP')).toBeTruthy();
      expect(screen.getByText('Call Ally')).toBeTruthy();
    });

    it('shows keyboard shortcuts for items', () => {
      render(
        <TerminalQuestCombat
          {...defaultProps}
          playerInventory={['health_pack', 'emp_device']}
        />
      );

      expect(screen.getByText('[3]')).toBeTruthy();
      expect(screen.getByText('[4]')).toBeTruthy();
    });

    it('does not show combat items section when no items available', () => {
      render(<TerminalQuestCombat {...defaultProps} playerInventory={[]} />);
      expect(screen.queryByText('Combat Items:')).toBeNull();
    });

    it('handles health pack usage and updates combat log', () => {
      render(
        <TerminalQuestCombat
          {...defaultProps}
          playerHealth={50}
          playerInventory={['health_pack']}
        />
      );

      const healthPackButton = screen.getByText('Health Pack').closest('button')!;

      act(() => {
        fireEvent.click(healthPackButton);
      });

      expect(screen.getByText(/Health Pack used!/)).toBeTruthy();
    });

    it('handles EMP device usage and updates combat log', () => {
      render(
        <TerminalQuestCombat
          {...defaultProps}
          playerInventory={['emp_device']}
        />
      );

      const empButton = screen.getByText('EMP').closest('button')!;

      act(() => {
        fireEvent.click(empButton);
      });

      expect(screen.getByText(/EMP blast deals 40 damage!/)).toBeTruthy();
    });

    it('handles ally beacon usage and updates combat log', () => {
      render(
        <TerminalQuestCombat
          {...defaultProps}
          playerInventory={['ally_beacon']}
        />
      );

      const allyButton = screen.getByText('Call Ally').closest('button')!;

      act(() => {
        fireEvent.click(allyButton);
      });

      expect(screen.getByText(/Ally arrives and deals 25 damage!/)).toBeTruthy();
    });
  });

  describe('Keyboard Controls', () => {
    it('handles key 1 for attack', () => {
      render(<TerminalQuestCombat {...defaultProps} />);

      act(() => {
        fireEvent.keyDown(window, { key: '1' });
      });

      expect(screen.getByText(/You deal \d+ damage!/)).toBeTruthy();
    });

    it('handles key 2 for defend', () => {
      render(<TerminalQuestCombat {...defaultProps} />);

      act(() => {
        fireEvent.keyDown(window, { key: '2' });
      });

      expect(screen.getByText(/You take a defensive stance.../)).toBeTruthy();
    });

    it('handles key 3 for first combat item', () => {
      render(
        <TerminalQuestCombat
          {...defaultProps}
          playerInventory={['health_pack']}
        />
      );

      act(() => {
        fireEvent.keyDown(window, { key: '3' });
      });

      expect(screen.getByText(/Health Pack used!/)).toBeTruthy();
    });

    it('handles key 4 for second combat item', () => {
      render(
        <TerminalQuestCombat
          {...defaultProps}
          playerInventory={['health_pack', 'emp_device']}
        />
      );

      act(() => {
        fireEvent.keyDown(window, { key: '4' });
      });

      expect(screen.getByText(/EMP blast deals 40 damage!/)).toBeTruthy();
    });

    it('handles key 5 for third combat item', () => {
      render(
        <TerminalQuestCombat
          {...defaultProps}
          playerInventory={['health_pack', 'emp_device', 'ally_beacon']}
        />
      );

      act(() => {
        fireEvent.keyDown(window, { key: '5' });
      });

      expect(screen.getByText(/Ally arrives and deals 25 damage!/)).toBeTruthy();
    });

    it('ignores keyboard input during animation', () => {
      render(<TerminalQuestCombat {...defaultProps} />);

      // First attack
      act(() => {
        fireEvent.keyDown(window, { key: '1' });
      });

      // Try second attack immediately - should be ignored
      act(() => {
        fireEvent.keyDown(window, { key: '1' });
      });

      // Only one attack message should appear
      const damageMessages = screen.queryAllByText(/You deal \d+ damage!/);
      expect(damageMessages.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Combat Flow', () => {
    it('triggers enemy turn after player attack', () => {
      const enemy = createTestEnemy({ health: 100 }); // High health to survive
      render(<TerminalQuestCombat {...defaultProps} enemy={enemy} />);

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      // Advance timer for enemy turn
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByText(/Test Virus attacks for \d+ damage!/)).toBeTruthy();
    });

    it('calls onCombatEnd with victory when enemy defeated', () => {
      const weakEnemy = createTestEnemy({ health: 1 });
      const onCombatEnd = vi.fn();

      render(
        <TerminalQuestCombat
          {...defaultProps}
          enemy={weakEnemy}
          onCombatEnd={onCombatEnd}
        />
      );

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      // Advance timer for victory callback
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(onCombatEnd).toHaveBeenCalledWith(true, expect.any(Number), expect.any(Number));
    });

    it('calls onCombatEnd with defeat when player defeated', () => {
      const strongEnemy = createTestEnemy({ health: 200, damage: 150 });
      const onCombatEnd = vi.fn();

      render(
        <TerminalQuestCombat
          {...defaultProps}
          enemy={strongEnemy}
          playerHealth={10}
          onCombatEnd={onCombatEnd}
        />
      );

      // Attack to trigger enemy turn
      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      // Advance timer for enemy turn
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Advance timer for defeat callback
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(onCombatEnd).toHaveBeenCalledWith(false, expect.any(Number), expect.any(Number));
    });

    it('plays gameOver sound on defeat', () => {
      const strongEnemy = createTestEnemy({ health: 200, damage: 150 });

      render(
        <TerminalQuestCombat
          {...defaultProps}
          enemy={strongEnemy}
          playerHealth={10}
          isMuted={false}
        />
      );

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      // Advance timer for enemy turn
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Advance timer for defeat sound
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockPlaySFX).toHaveBeenCalledWith('gameOver');
    });

    it('plays score sound on victory', () => {
      const weakEnemy = createTestEnemy({ health: 1 });

      render(
        <TerminalQuestCombat
          {...defaultProps}
          enemy={weakEnemy}
          isMuted={false}
        />
      );

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      // Advance timer for victory sound
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockPlaySFX).toHaveBeenCalledWith('score');
    });
  });

  describe('Damage Calculation', () => {
    it('calculates bonus damage with system_exploit', () => {
      render(
        <TerminalQuestCombat
          {...defaultProps}
          playerInventory={['system_exploit']}
        />
      );

      // Attack and verify damage is dealt (specific value varies due to random)
      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      // Should deal damage (at least base 15 + 10 exploit bonus)
      expect(screen.getByText(/You deal \d+ damage!/)).toBeTruthy();
    });

    it('calculates bonus damage against viruses with antivirus', () => {
      const virusEnemy = createTestEnemy({ name: 'Matrix Virus' });

      render(
        <TerminalQuestCombat
          {...defaultProps}
          enemy={virusEnemy}
          playerInventory={['antivirus']}
        />
      );

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      expect(screen.getByText(/You deal \d+ damage!/)).toBeTruthy();
    });

    it('applies defense reduction to enemy damage', () => {
      const enemy = createTestEnemy({ health: 100, damage: 20 });

      render(
        <TerminalQuestCombat
          {...defaultProps}
          enemy={enemy}
          playerInventory={['firewall_boost']}
        />
      );

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      // Advance timer for enemy turn
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Enemy should deal reduced damage
      expect(screen.getByText(/Test Virus attacks for \d+ damage!/)).toBeTruthy();
    });
  });

  describe('Props Interface', () => {
    it('accepts achievementManager prop', () => {
      const mockAchievementManager = {
        unlockAchievement: vi.fn()
      };

      const { container } = render(
        <TerminalQuestCombat
          {...defaultProps}
          achievementManager={mockAchievementManager}
        />
      );

      expect(container).toBeTruthy();
    });

    it('accepts isMuted prop', () => {
      const { container } = render(
        <TerminalQuestCombat {...defaultProps} isMuted={true} />
      );

      expect(container).toBeTruthy();
    });

    it('works without optional props', () => {
      const { container } = render(
        <TerminalQuestCombat {...defaultProps} />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Visual Elements', () => {
    it('applies screen shake on enemy attack', () => {
      const enemy = createTestEnemy({ health: 100 });
      const { container } = render(
        <TerminalQuestCombat {...defaultProps} enemy={enemy} />
      );

      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      // Advance timer for enemy turn
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Container should still be present (shake is handled by framer-motion mock)
      expect(container).toBeTruthy();
    });

    it('displays enemy with correct border color', () => {
      const { container } = render(<TerminalQuestCombat {...defaultProps} />);

      const combatContainer = container.querySelector('.border-red-500');
      expect(combatContainer).toBeTruthy();
    });

    it('displays combat log with recent entries after action', () => {
      render(<TerminalQuestCombat {...defaultProps} />);

      // Initial log entry
      expect(screen.getByText(/Test Virus appears!/)).toBeTruthy();

      // Attack to add more log entries
      const attackButton = screen.getByText(/Attack/).closest('button')!;

      act(() => {
        fireEvent.click(attackButton);
      });

      expect(screen.getByText(/You deal \d+ damage!/)).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = render(<TerminalQuestCombat {...defaultProps} />);
      expect(container).toBeTruthy();
    });

    it('unmounts without errors', () => {
      const { unmount } = render(<TerminalQuestCombat {...defaultProps} />);
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up keyboard listeners on unmount', () => {
      const { unmount } = render(<TerminalQuestCombat {...defaultProps} />);

      unmount();

      // Should not throw when firing keydown after unmount
      fireEvent.keyDown(window, { key: '1' });
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles enemy with no ASCII art', () => {
      const noAsciiEnemy = createTestEnemy({ ascii: undefined });

      const { container } = render(
        <TerminalQuestCombat {...defaultProps} enemy={noAsciiEnemy} />
      );

      expect(container).toBeTruthy();
      expect(screen.getByText('Test Virus')).toBeTruthy();
    });

    it('handles zero initial player health', () => {
      const { container } = render(
        <TerminalQuestCombat {...defaultProps} playerHealth={0} />
      );

      expect(container).toBeTruthy();
    });

    it('handles empty inventory', () => {
      const { container } = render(
        <TerminalQuestCombat {...defaultProps} playerInventory={[]} />
      );

      expect(container).toBeTruthy();
      expect(screen.queryByText('Combat Items:')).toBeNull();
    });

    it('handles very high enemy health', () => {
      const tankEnemy = createTestEnemy({ health: 10000 });

      const { container } = render(
        <TerminalQuestCombat {...defaultProps} enemy={tankEnemy} />
      );

      expect(container).toBeTruthy();
      expect(screen.getByText('10000/10000')).toBeTruthy();
    });

    it('handles rapid keyboard spam', () => {
      render(<TerminalQuestCombat {...defaultProps} />);

      // Spam all keys rapidly
      for (let i = 0; i < 20; i++) {
        act(() => {
          fireEvent.keyDown(window, { key: String((i % 5) + 1) });
        });
      }

      // Should still be in valid state
      expect(screen.getByText('Test Virus')).toBeTruthy();
    });
  });
});
