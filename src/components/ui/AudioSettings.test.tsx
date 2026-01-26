import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioSettings } from './AudioSettings';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Volume2: () => <div data-testid="volume2-icon">Volume2</div>,
  VolumeX: () => <div data-testid="volumex-icon">VolumeX</div>,
  Volume1: () => <div data-testid="volume1-icon">Volume1</div>,
  Music: () => <div data-testid="music-icon">Music</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Play: () => <div data-testid="play-icon">Play</div>,
  Save: () => <div data-testid="save-icon">Save</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
}));

// Mock useSoundSystem hook
const mockPlaySFX = vi.fn();
const mockPlayBackgroundMP3 = vi.fn();
const mockStopBackgroundMP3 = vi.fn();
const mockUpdateConfig = vi.fn();

const defaultConfig = {
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  music: true,
  sfx: true,
};

vi.mock('../../hooks/useSoundSystem', () => ({
  useSoundSystem: () => ({
    config: defaultConfig,
    updateConfig: mockUpdateConfig,
    playSFX: mockPlaySFX,
    playBackgroundMP3: mockPlayBackgroundMP3,
    stopBackgroundMP3: mockStopBackgroundMP3,
  }),
}));

describe('AudioSettings', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - Full Modal', () => {
    it('renders nothing when closed', () => {
      const { container } = render(<AudioSettings {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when open', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText('AUDIO SETTINGS')).toBeInTheDocument();
    });

    it('displays master volume slider', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText('MASTER VOLUME')).toBeInTheDocument();
    });

    it('displays background music section', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText('BACKGROUND MUSIC')).toBeInTheDocument();
    });

    it('displays sound effects section', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText('SOUND EFFECTS')).toBeInTheDocument();
    });

    it('displays sound test section', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText('SOUND TEST')).toBeInTheDocument();
    });

    it('displays save settings button', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText('SAVE SETTINGS')).toBeInTheDocument();
    });

    it('displays version info', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText('MATRIX AUDIO v2.0')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when X button clicked', () => {
      const onClose = vi.fn();
      render(<AudioSettings {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(closeButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<AudioSettings {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Volume Controls', () => {
    it('displays current master volume percentage', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('displays music volume percentage', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('displays SFX volume percentage', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('updates config when master volume slider changes', () => {
      render(<AudioSettings {...defaultProps} />);

      const sliders = screen.getAllByRole('slider');
      const masterSlider = sliders[0]; // First slider is master volume

      fireEvent.change(masterSlider, { target: { value: '0.5' } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ masterVolume: 0.5 });
    });

    it('updates config when music volume slider changes', () => {
      render(<AudioSettings {...defaultProps} />);

      const sliders = screen.getAllByRole('slider');
      const musicSlider = sliders[1]; // Second slider is music volume

      fireEvent.change(musicSlider, { target: { value: '0.3' } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ musicVolume: 0.3 });
    });

    it('updates config when SFX volume slider changes', () => {
      render(<AudioSettings {...defaultProps} />);

      const sliders = screen.getAllByRole('slider');
      const sfxSlider = sliders[2]; // Third slider is SFX volume

      fireEvent.change(sfxSlider, { target: { value: '0.9' } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ sfxVolume: 0.9 });
    });
  });

  describe('Toggle Controls', () => {
    it('displays music toggle button', () => {
      render(<AudioSettings {...defaultProps} />);
      const musicButtons = screen.getAllByText('ON');
      expect(musicButtons.length).toBeGreaterThan(0);
    });

    it('toggles music when button clicked', () => {
      render(<AudioSettings {...defaultProps} />);

      const musicToggle = screen.getAllByText('ON')[0];
      fireEvent.click(musicToggle);

      expect(mockUpdateConfig).toHaveBeenCalledWith({ music: false });
    });

    it('toggles SFX when button clicked', () => {
      render(<AudioSettings {...defaultProps} />);

      const sfxToggle = screen.getAllByText('ON')[1];
      fireEvent.click(sfxToggle);

      expect(mockUpdateConfig).toHaveBeenCalledWith({ sfx: false });
    });
  });

  describe('Sound Test', () => {
    it('displays test sound buttons', () => {
      render(<AudioSettings {...defaultProps} />);

      expect(screen.getByText('JUMP')).toBeInTheDocument();
      expect(screen.getByText('HIT')).toBeInTheDocument();
      expect(screen.getByText('SCORE')).toBeInTheDocument();
      expect(screen.getByText('POWERUP')).toBeInTheDocument();
      expect(screen.getByText('LEVELUP')).toBeInTheDocument();
      expect(screen.getByText('COMBO')).toBeInTheDocument();
    });

    it('plays sound when test button clicked', () => {
      render(<AudioSettings {...defaultProps} />);

      const jumpButton = screen.getByText('JUMP');
      fireEvent.click(jumpButton);

      expect(mockPlaySFX).toHaveBeenCalledWith('jump');
    });

    it('plays different sounds for different buttons', () => {
      render(<AudioSettings {...defaultProps} />);

      fireEvent.click(screen.getByText('HIT'));
      expect(mockPlaySFX).toHaveBeenCalledWith('hit');

      fireEvent.click(screen.getByText('SCORE'));
      expect(mockPlaySFX).toHaveBeenCalledWith('score');

      fireEvent.click(screen.getByText('POWERUP'));
      expect(mockPlaySFX).toHaveBeenCalledWith('powerup');
    });
  });

  describe('Music Test', () => {
    it('has music test button', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    });

    it('plays music preview when test button clicked', () => {
      render(<AudioSettings {...defaultProps} />);

      const playButton = screen.getByTestId('play-icon').closest('button');
      fireEvent.click(playButton!);

      expect(mockPlayBackgroundMP3).toHaveBeenCalledWith('/matrixarcaderetrobeat.mp3');
    });
  });

  describe('Save Settings', () => {
    it('plays sound when save clicked', () => {
      render(<AudioSettings {...defaultProps} />);

      const saveButton = screen.getByText('SAVE SETTINGS');
      fireEvent.click(saveButton);

      expect(mockPlaySFX).toHaveBeenCalledWith('score');
    });
  });

  describe('Master Mute Toggle', () => {
    it('displays master mute button when toggleMute provided', () => {
      const toggleMute = vi.fn();
      render(
        <AudioSettings {...defaultProps} toggleMute={toggleMute} isMuted={false} />
      );

      expect(screen.getByText('SOUND ON')).toBeInTheDocument();
    });

    it('displays muted state correctly', () => {
      const toggleMute = vi.fn();
      render(
        <AudioSettings {...defaultProps} toggleMute={toggleMute} isMuted={true} />
      );

      expect(screen.getByText('SOUND MUTED')).toBeInTheDocument();
    });

    it('calls toggleMute when master mute clicked', () => {
      const toggleMute = vi.fn();
      render(
        <AudioSettings {...defaultProps} toggleMute={toggleMute} isMuted={false} />
      );

      const muteButton = screen.getByText('SOUND ON').closest('button');
      fireEvent.click(muteButton!);

      expect(toggleMute).toHaveBeenCalledTimes(1);
    });

    it('displays keyboard hint for mute toggle', () => {
      const toggleMute = vi.fn();
      render(
        <AudioSettings {...defaultProps} toggleMute={toggleMute} isMuted={false} />
      );

      expect(screen.getByText(/Press V to quickly toggle mute/)).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders compact controls when compact prop is true', () => {
      render(<AudioSettings {...defaultProps} compact={true} />);

      // Should not show full modal content
      expect(screen.queryByText('AUDIO SETTINGS')).not.toBeInTheDocument();
    });

    it('has SFX toggle button in compact mode', () => {
      render(<AudioSettings {...defaultProps} compact={true} />);
      expect(screen.getByTestId('volume2-icon')).toBeInTheDocument();
    });

    it('has music toggle button in compact mode', () => {
      render(<AudioSettings {...defaultProps} compact={true} />);
      expect(screen.getByTestId('music-icon')).toBeInTheDocument();
    });

    it('toggles SFX in compact mode', () => {
      render(<AudioSettings {...defaultProps} compact={true} />);

      const sfxButton = screen.getByTestId('volume2-icon').closest('button');
      fireEvent.click(sfxButton!);

      expect(mockUpdateConfig).toHaveBeenCalledWith({ sfx: false });
    });

    it('toggles music in compact mode', () => {
      render(<AudioSettings {...defaultProps} compact={true} />);

      const musicButton = screen.getByTestId('music-icon').closest('button');
      fireEvent.click(musicButton!);

      expect(mockUpdateConfig).toHaveBeenCalledWith({ music: false });
    });
  });

  describe('Styling', () => {
    it('has fixed positioning in full mode', () => {
      const { container } = render(<AudioSettings {...defaultProps} />);
      expect(container.querySelector('.fixed.inset-0')).toBeTruthy();
    });

    it('has green border on modal', () => {
      const { container } = render(<AudioSettings {...defaultProps} />);
      expect(container.querySelector('.border-green-500')).toBeTruthy();
    });

    it('uses monospace font', () => {
      const { container } = render(<AudioSettings {...defaultProps} />);
      expect(container.querySelector('.font-mono')).toBeTruthy();
    });
  });

  describe('Info Text', () => {
    it('displays Web Audio API info', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText(/Advanced Web Audio API synthesis/)).toBeInTheDocument();
    });

    it('displays auto-save info', () => {
      render(<AudioSettings {...defaultProps} />);
      expect(screen.getByText(/Settings auto-save/)).toBeInTheDocument();
    });
  });
});
