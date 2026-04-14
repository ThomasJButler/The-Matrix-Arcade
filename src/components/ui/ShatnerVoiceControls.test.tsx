import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShatnerVoiceControls } from './ShatnerVoiceControls';

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
  Square: () => <div data-testid="square-icon">Square</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  TestTube: () => <div data-testid="testtube-icon">TestTube</div>,
  Mic: () => <div data-testid="mic-icon">Mic</div>,
}));

// Mock useShatnerVoice hook
const mockSpeak = vi.fn();
const mockStop = vi.fn();
const mockTestVoice = vi.fn();
const mockUpdateConfig = vi.fn();

const defaultConfig = {
  enabled: true,
  rate: 1.0,
  pitch: 1.2,
  volume: 0.6,
  pauseMultiplier: 3.0,
  emphasisBoost: 1.5,
};

vi.mock('../../hooks/useShatnerVoice', () => ({
  useShatnerVoice: () => ({
    config: defaultConfig,
    updateConfig: mockUpdateConfig,
    speak: mockSpeak,
    stop: mockStop,
    testVoice: mockTestVoice,
    isSupported: true,
    isSpeaking: false,
  }),
}));

describe('ShatnerVoiceControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<ShatnerVoiceControls />);
      expect(container).toBeTruthy();
    });

    it('displays SHATNER VOICE label', () => {
      render(<ShatnerVoiceControls />);
      expect(screen.getByText('SHATNER VOICE')).toBeInTheDocument();
    });

    it('displays mic icon', () => {
      render(<ShatnerVoiceControls />);
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();
    });

    it('displays enable/disable toggle', () => {
      render(<ShatnerVoiceControls />);
      expect(screen.getByTestId('volume2-icon')).toBeInTheDocument();
    });

    it('displays test voice button', () => {
      render(<ShatnerVoiceControls />);
      expect(screen.getByTestId('testtube-icon')).toBeInTheDocument();
    });

    it('displays settings button when onToggleExpanded provided', () => {
      render(<ShatnerVoiceControls onToggleExpanded={vi.fn()} />);
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('does not display settings button when onToggleExpanded not provided', () => {
      render(<ShatnerVoiceControls />);
      expect(screen.queryByTestId('settings-icon')).not.toBeInTheDocument();
    });
  });

  describe('Enable/Disable Toggle', () => {
    it('shows volume icon when enabled', () => {
      render(<ShatnerVoiceControls />);
      expect(screen.getByTestId('volume2-icon')).toBeInTheDocument();
    });

    it('toggles enabled state when clicked', () => {
      render(<ShatnerVoiceControls />);

      const toggleButton = screen.getByTestId('volume2-icon').closest('button');
      fireEvent.click(toggleButton!);

      expect(mockUpdateConfig).toHaveBeenCalledWith({ enabled: false });
    });
  });

  describe('Test Voice Button', () => {
    it('calls testVoice when clicked', () => {
      render(<ShatnerVoiceControls />);

      const testButton = screen.getByTestId('testtube-icon').closest('button');
      fireEvent.click(testButton!);

      expect(mockTestVoice).toHaveBeenCalledTimes(1);
    });

    it('is enabled when voice is enabled', () => {
      render(<ShatnerVoiceControls />);

      const testButton = screen.getByTestId('testtube-icon').closest('button');
      expect(testButton).not.toBeDisabled();
    });
  });

  describe('Settings Toggle', () => {
    it('calls onToggleExpanded when settings clicked', () => {
      const onToggleExpanded = vi.fn();
      render(<ShatnerVoiceControls onToggleExpanded={onToggleExpanded} />);

      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      fireEvent.click(settingsButton!);

      expect(onToggleExpanded).toHaveBeenCalledTimes(1);
    });
  });

  describe('Expanded Settings', () => {
    it('shows rate slider when expanded', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('Speech Rate (Shatner Pace)')).toBeInTheDocument();
    });

    it('shows pitch slider when expanded', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('Voice Pitch')).toBeInTheDocument();
    });

    it('shows volume slider when expanded', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('Volume')).toBeInTheDocument();
    });

    it('shows pause multiplier slider when expanded', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('Dramatic Pauses')).toBeInTheDocument();
    });

    it('shows current rate value', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('1.00x')).toBeInTheDocument();
    });

    it('shows current pitch value', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('1.20')).toBeInTheDocument();
    });

    it('shows current volume percentage', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('shows current pause multiplier', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('3.0x')).toBeInTheDocument();
    });

    it('hides settings when not expanded', () => {
      render(<ShatnerVoiceControls isExpanded={false} />);
      expect(screen.queryByText('Speech Rate (Shatner Pace)')).not.toBeInTheDocument();
    });
  });

  describe('Slider Controls', () => {
    it('updates rate when slider changes', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);

      const sliders = screen.getAllByRole('slider');
      const rateSlider = sliders[0]; // First slider is rate

      fireEvent.change(rateSlider, { target: { value: '0.5' } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ rate: 0.5 });
    });

    it('updates pitch when slider changes', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);

      const sliders = screen.getAllByRole('slider');
      const pitchSlider = sliders[1]; // Second slider is pitch

      fireEvent.change(pitchSlider, { target: { value: '0.8' } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ pitch: 0.8 });
    });

    it('updates volume when slider changes', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);

      const sliders = screen.getAllByRole('slider');
      const volumeSlider = sliders[2]; // Third slider is volume

      fireEvent.change(volumeSlider, { target: { value: '0.9' } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ volume: 0.9 });
    });

    it('updates pause multiplier when slider changes', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);

      const sliders = screen.getAllByRole('slider');
      const pauseSlider = sliders[3]; // Fourth slider is pause multiplier

      fireEvent.change(pauseSlider, { target: { value: '2.0' } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ pauseMultiplier: 2.0 });
    });
  });

  describe('Test Phrases', () => {
    it('displays test phrases when expanded', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('ULTIMATE Test Phrases:')).toBeInTheDocument();
    });

    it('displays multiple test phrase buttons', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText(/"The Production Bug/)).toBeInTheDocument();
      expect(screen.getByText(/"Friday afternoon/)).toBeInTheDocument();
    });

    it('calls speak when test phrase clicked', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);

      const phraseButton = screen.getByText(/"The Production Bug/);
      fireEvent.click(phraseButton);

      expect(mockSpeak).toHaveBeenCalledWith('The Production Bug... from Hell!');
    });
  });

  describe('Reset Button', () => {
    it('displays reset button when expanded', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('Reset to ULTIMATE Shatner')).toBeInTheDocument();
    });

    it('resets config to defaults when clicked', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);

      const resetButton = screen.getByText('Reset to ULTIMATE Shatner');
      fireEvent.click(resetButton);

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        rate: 1.00,
        pitch: 1.20,
        volume: 0.60,
        pauseMultiplier: 3.0,
        emphasisBoost: 1.5,
      });
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<ShatnerVoiceControls className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeTruthy();
    });

    it('has green border', () => {
      const { container } = render(<ShatnerVoiceControls />);
      expect(container.querySelector('.border-green-500\\/30')).toBeTruthy();
    });
  });

  describe('Helper Text', () => {
    it('shows slower = more dramatic hint', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('Slower = More dramatic')).toBeInTheDocument();
    });

    it('shows lower = more commanding hint', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('Lower = More commanding')).toBeInTheDocument();
    });

    it('shows pause hint', () => {
      render(<ShatnerVoiceControls isExpanded={true} />);
      expect(screen.getByText('Higher = More dramatic pauses')).toBeInTheDocument();
    });
  });
});

describe('ShatnerVoiceControls - Unsupported Browser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows normal controls when speech synthesis is supported', () => {
    render(<ShatnerVoiceControls />);

    // With isSupported: true (default mock), the normal controls render
    expect(screen.getByText('SHATNER VOICE')).toBeInTheDocument();
    expect(screen.queryByText('Speech synthesis not supported in this browser')).not.toBeInTheDocument();
  });
});

describe('ShatnerVoiceControls - Speaking State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show speaking indicator when not speaking', () => {
    render(<ShatnerVoiceControls />);

    // With isSpeaking: false (default mock), the speaking indicator is absent
    expect(screen.queryByText('SHATNER SPEAKING...')).not.toBeInTheDocument();
  });

  it('does not show stop button when not speaking', () => {
    render(<ShatnerVoiceControls />);

    // With isSpeaking: false (default mock), the stop button is absent
    expect(screen.queryByTestId('square-icon')).not.toBeInTheDocument();
  });
});
