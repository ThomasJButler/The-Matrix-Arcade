import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PWAInstallPrompt } from './PWAInstallPrompt';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Download: () => <div data-testid="download-icon">Download</div>,
  X: () => <div data-testid="x-icon">X</div>,
}));

describe('PWAInstallPrompt', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;
  let eventListeners: Record<string, EventListener>;

  beforeEach(() => {
    vi.useFakeTimers();

    // Setup event listeners storage
    eventListeners = {};

    mockAddEventListener = vi.fn((event: string, handler: EventListener) => {
      eventListeners[event] = handler;
    });

    mockRemoveEventListener = vi.fn((event: string) => {
      delete eventListeners[event];
    });

    // Mock window methods
    vi.spyOn(window, 'addEventListener').mockImplementation(mockAddEventListener);
    vi.spyOn(window, 'removeEventListener').mockImplementation(mockRemoveEventListener);

    // Mock matchMedia for standalone check
    mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    });
    window.matchMedia = mockMatchMedia;

    // Clear sessionStorage
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Initial State', () => {
    it('renders nothing initially', () => {
      const { container } = render(<PWAInstallPrompt />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when in standalone mode', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      const { container } = render(<PWAInstallPrompt />);
      expect(container.firstChild).toBeNull();
    });

    it('registers beforeinstallprompt event listener', () => {
      render(<PWAInstallPrompt />);
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      );
    });

    it('registers appinstalled event listener', () => {
      render(<PWAInstallPrompt />);
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'appinstalled',
        expect.any(Function)
      );
    });
  });

  describe('BeforeInstallPrompt Event', () => {
    it('shows prompt after beforeinstallprompt event and delay', () => {
      render(<PWAInstallPrompt />);

      // Trigger beforeinstallprompt
      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        eventListeners['beforeinstallprompt']?.(mockEvent);
      });

      // Advance past the 2 second delay
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('INSTALL MATRIX ARCADE')).toBeInTheDocument();
    });

    it('prevents default on beforeinstallprompt', () => {
      render(<PWAInstallPrompt />);

      const mockEvent = new Event('beforeinstallprompt');
      const preventDefault = vi.fn();
      Object.assign(mockEvent, {
        preventDefault,
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        eventListeners['beforeinstallprompt']?.(mockEvent);
      });

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('Prompt Content', () => {
    const triggerPrompt = () => {
      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        eventListeners['beforeinstallprompt']?.(mockEvent);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      return mockEvent;
    };

    it('displays download icon', () => {
      render(<PWAInstallPrompt />);
      triggerPrompt();
      expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    });

    it('displays install title', () => {
      render(<PWAInstallPrompt />);
      triggerPrompt();
      expect(screen.getByText('INSTALL MATRIX ARCADE')).toBeInTheDocument();
    });

    it('displays install description', () => {
      render(<PWAInstallPrompt />);
      triggerPrompt();
      expect(screen.getByText(/Install The Matrix Arcade to your device/)).toBeInTheDocument();
    });

    it('displays INSTALL NOW button', () => {
      render(<PWAInstallPrompt />);
      triggerPrompt();
      expect(screen.getByText('INSTALL NOW')).toBeInTheDocument();
    });

    it('displays LATER button', () => {
      render(<PWAInstallPrompt />);
      triggerPrompt();
      expect(screen.getByText('LATER')).toBeInTheDocument();
    });

    it('displays close X button', () => {
      render(<PWAInstallPrompt />);
      triggerPrompt();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('Install Action', () => {
    it('calls prompt() when INSTALL NOW clicked', async () => {
      render(<PWAInstallPrompt />);

      const mockPrompt = vi.fn().mockResolvedValue(undefined);
      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        preventDefault: vi.fn(),
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        eventListeners['beforeinstallprompt']?.(mockEvent);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const installButton = screen.getByText('INSTALL NOW');
      await act(async () => {
        fireEvent.click(installButton);
      });

      expect(mockPrompt).toHaveBeenCalled();
    });

    it('hides prompt after install button clicked', async () => {
      render(<PWAInstallPrompt />);

      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        eventListeners['beforeinstallprompt']?.(mockEvent);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const installButton = screen.getByText('INSTALL NOW');
      await act(async () => {
        fireEvent.click(installButton);
      });

      // Prompt should be hidden
      expect(screen.queryByText('INSTALL MATRIX ARCADE')).not.toBeInTheDocument();
    });
  });

  describe('Dismiss Action', () => {
    const triggerPrompt = () => {
      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        eventListeners['beforeinstallprompt']?.(mockEvent);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });
    };

    it('hides prompt when X button clicked', () => {
      render(<PWAInstallPrompt />);
      triggerPrompt();

      const closeButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(closeButton!);

      expect(screen.queryByText('INSTALL MATRIX ARCADE')).not.toBeInTheDocument();
    });

    it('hides prompt when LATER button clicked', () => {
      render(<PWAInstallPrompt />);
      triggerPrompt();

      const laterButton = screen.getByText('LATER');
      fireEvent.click(laterButton);

      expect(screen.queryByText('INSTALL MATRIX ARCADE')).not.toBeInTheDocument();
    });

    it('saves dismissed state to sessionStorage', () => {
      render(<PWAInstallPrompt />);
      triggerPrompt();

      const laterButton = screen.getByText('LATER');
      fireEvent.click(laterButton);

      expect(sessionStorage.getItem('pwa-prompt-dismissed')).toBe('true');
    });

    it('does not show if previously dismissed', () => {
      // Set dismissed state before render
      sessionStorage.setItem('pwa-prompt-dismissed', 'true');

      render(<PWAInstallPrompt />);

      // The component checks sessionStorage in a useEffect, need to let it run
      act(() => {
        vi.runAllTimers();
      });

      // Even if beforeinstallprompt fires, should not show due to sessionStorage
      expect(screen.queryByText('INSTALL MATRIX ARCADE')).not.toBeInTheDocument();
    });
  });

  describe('App Installed Event', () => {
    it('hides prompt when app is installed', () => {
      render(<PWAInstallPrompt />);

      // First trigger beforeinstallprompt
      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        eventListeners['beforeinstallprompt']?.(mockEvent);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('INSTALL MATRIX ARCADE')).toBeInTheDocument();

      // Then trigger appinstalled
      act(() => {
        eventListeners['appinstalled']?.(new Event('appinstalled'));
      });

      expect(screen.queryByText('INSTALL MATRIX ARCADE')).not.toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('removes event listeners on unmount', () => {
      const { unmount } = render(<PWAInstallPrompt />);
      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      );
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'appinstalled',
        expect.any(Function)
      );
    });
  });

  describe('Styling', () => {
    it('has fixed positioning', () => {
      render(<PWAInstallPrompt />);

      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        eventListeners['beforeinstallprompt']?.(mockEvent);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const wrapper = screen.getByText('INSTALL MATRIX ARCADE').closest('.fixed');
      expect(wrapper).toBeTruthy();
    });

    it('is positioned at bottom left', () => {
      render(<PWAInstallPrompt />);

      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        eventListeners['beforeinstallprompt']?.(mockEvent);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const wrapper = screen.getByText('INSTALL MATRIX ARCADE').closest('.bottom-8.left-8');
      expect(wrapper).toBeTruthy();
    });

    it('has Matrix green border', () => {
      render(<PWAInstallPrompt />);

      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        eventListeners['beforeinstallprompt']?.(mockEvent);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const card = screen.getByText('INSTALL MATRIX ARCADE').closest('.border-green-500');
      expect(card).toBeTruthy();
    });
  });
});
