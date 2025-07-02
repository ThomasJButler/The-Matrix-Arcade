import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedVoiceControls } from './AdvancedVoiceControls';

// Create a mock implementation
const mockUseAdvancedVoice = {
  config: {
    enabled: true,
    persona: 'captain',
    rate: 0.8,
    pitch: 1.0,
    volume: 0.9,
    pauseMultiplier: 2.0,
    autoAdvance: true,
    visualEffects: true,
    highlightText: true,
    ambientSound: false,
  },
  isSupported: true,
  isSpeaking: false,
  isPaused: false,
  currentWord: 0,
  speechQueue: [],
  speak: vi.fn(),
  stop: vi.fn(),
  togglePause: vi.fn(),
  updateConfig: vi.fn(),
  getVisualizationData: vi.fn(() => ({
    amplitude: 0.5,
    frequency: Array(32).fill(0.3),
  })),
  personas: {
    captain: { name: 'The Captain (Shatner Style)', baseRate: 0.8, basePitch: 1.0 },
    oracle: { name: 'The Oracle (Morpheus Style)', baseRate: 0.7, basePitch: 0.9 },
    architect: { name: 'The Architect (Precise)', baseRate: 0.95, basePitch: 1.1 },
    narrator: { name: 'The Narrator (Epic)', baseRate: 0.85, basePitch: 0.95 },
    glitch: { name: 'The Glitch (Agent Smith)', baseRate: 1.2, basePitch: 1.3 },
  },
};

// Mock the useAdvancedVoice hook
vi.mock('../../hooks/useAdvancedVoice', () => ({
  useAdvancedVoice: () => mockUseAdvancedVoice,
}));

describe('AdvancedVoiceControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockUseAdvancedVoice.isSupported = true;
    mockUseAdvancedVoice.isSpeaking = false;
    mockUseAdvancedVoice.isPaused = false;
    mockUseAdvancedVoice.currentWord = 0;
    mockUseAdvancedVoice.speechQueue = [];
    mockUseAdvancedVoice.config.enabled = true;
    mockUseAdvancedVoice.config.persona = 'captain';
  });

  it('renders when speech synthesis is supported', () => {
    render(<AdvancedVoiceControls />);

    expect(screen.getByText('VOICE MODE')).toBeInTheDocument();
  });

  it('shows not supported message when speech synthesis is unavailable', () => {
    mockUseAdvancedVoice.isSupported = false;

    render(<AdvancedVoiceControls />);

    expect(screen.getByText('Advanced voice synthesis not supported')).toBeInTheDocument();
  });

  it('displays current persona', () => {
    render(<AdvancedVoiceControls />);

    expect(screen.getByText('The Captain (Shatner Style)')).toBeInTheDocument();
  });

  it('opens persona dropdown when clicked', async () => {
    render(<AdvancedVoiceControls />);

    const personaButton = screen.getByText('The Captain (Shatner Style)').closest('button');
    fireEvent.click(personaButton!);

    await waitFor(() => {
      expect(screen.getByText('The Oracle (Morpheus Style)')).toBeInTheDocument();
      expect(screen.getByText('The Architect (Precise)')).toBeInTheDocument();
      expect(screen.getByText('The Narrator (Epic)')).toBeInTheDocument();
      expect(screen.getByText('The Glitch (Agent Smith)')).toBeInTheDocument();
    });
  });

  it('changes persona when option is selected', async () => {
    render(<AdvancedVoiceControls />);

    // Open dropdown
    const personaButton = screen.getByText('The Captain (Shatner Style)').closest('button');
    fireEvent.click(personaButton!);

    // Select new persona
    const oracleOption = await screen.findByText('The Oracle (Morpheus Style)');
    fireEvent.click(oracleOption);

    expect(mockUseAdvancedVoice.updateConfig).toHaveBeenCalledWith({ persona: 'oracle' });
  });

  it('shows play button when not speaking', () => {
    render(<AdvancedVoiceControls text="Test text" />);

    const playButton = screen.getByTitle('Play (Space)');
    expect(playButton).toBeInTheDocument();
  });

  it('shows pause/stop buttons when speaking', () => {
    mockUseAdvancedVoice.isSpeaking = true;

    render(<AdvancedVoiceControls />);

    expect(screen.getByTitle('Pause (Space)')).toBeInTheDocument();
    expect(screen.getByTitle('Stop (Esc)')).toBeInTheDocument();
  });

  it('calls speak when play button is clicked', () => {
    render(<AdvancedVoiceControls text="Test text" />);

    const playButton = screen.getByTitle('Play (Space)');
    fireEvent.click(playButton);

    expect(mockUseAdvancedVoice.speak).toHaveBeenCalledWith('Test text');
  });

  it('toggles voice enabled state', () => {
    render(<AdvancedVoiceControls />);

    const toggleButton = screen.getByTitle('Disable Voice (V)');
    fireEvent.click(toggleButton);

    expect(mockUseAdvancedVoice.updateConfig).toHaveBeenCalledWith({ enabled: false });
  });

  it('expands settings panel when clicked', async () => {
    render(<AdvancedVoiceControls />);

    const settingsButton = screen.getByTitle('Settings (Ctrl+S)');
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('QUICK PRESETS')).toBeInTheDocument();
      expect(screen.getByText('Speech Rate')).toBeInTheDocument();
      expect(screen.getByText('Voice Pitch')).toBeInTheDocument();
      expect(screen.getByText('Volume')).toBeInTheDocument();
    });
  });

  it('applies preset configurations', async () => {
    render(<AdvancedVoiceControls />);

    // Expand settings
    const settingsButton = screen.getByTitle('Settings (Ctrl+S)');
    fireEvent.click(settingsButton);

    // Click dramatic preset
    const dramaticButton = await screen.findByText('Dramatic');
    fireEvent.click(dramaticButton);

    expect(mockUseAdvancedVoice.updateConfig).toHaveBeenCalledWith({
      rate: 0.7,
      pitch: 1.2,
      pauseMultiplier: 3.0,
    });
  });

  it('updates speech rate with slider', async () => {
    render(<AdvancedVoiceControls />);

    // Expand settings
    const settingsButton = screen.getByTitle('Settings (Ctrl+S)');
    fireEvent.click(settingsButton);

    // Find rate slider
    const rateSlider = await screen.findByLabelText(/Speech Rate/);
    fireEvent.change(rateSlider, { target: { value: '1.5' } });

    expect(mockUseAdvancedVoice.updateConfig).toHaveBeenCalledWith({ rate: 1.5 });
  });

  it('displays speech queue indicator', () => {
    mockUseAdvancedVoice.speechQueue = ['Text 1', 'Text 2', 'Text 3'];

    render(<AdvancedVoiceControls />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows current word stats when speaking', () => {
    mockUseAdvancedVoice.isSpeaking = true;
    mockUseAdvancedVoice.currentWord = 5;
    mockUseAdvancedVoice.speechQueue = ['Text 1'];

    render(<AdvancedVoiceControls />);

    expect(screen.getByText('Word 6 • Queue: 1')).toBeInTheDocument();
  });

  it('handles keyboard shortcuts', () => {
    render(<AdvancedVoiceControls text="Test" />);

    // Test 'v' key toggles voice
    fireEvent.keyDown(window, { key: 'v' });
    expect(mockUseAdvancedVoice.updateConfig).toHaveBeenCalledWith({ enabled: false });

    // Clear previous calls
    vi.clearAllMocks();

    // Test space key starts speaking
    fireEvent.keyDown(window, { key: ' ' });
    expect(mockUseAdvancedVoice.speak).toHaveBeenCalledWith('Test');

    // Test escape key stops
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockUseAdvancedVoice.stop).toHaveBeenCalled();

    // Test number keys for persona selection
    fireEvent.keyDown(window, { key: '2' });
    expect(mockUseAdvancedVoice.updateConfig).toHaveBeenCalledWith({ persona: 'oracle' });
  });

  it('toggles feature checkboxes', async () => {
    render(<AdvancedVoiceControls />);

    // Expand settings
    const settingsButton = screen.getByTitle('Settings (Ctrl+S)');
    fireEvent.click(settingsButton);

    // Toggle auto-advance
    const autoAdvanceCheckbox = await screen.findByLabelText(/Auto-advance/);
    fireEvent.click(autoAdvanceCheckbox);

    expect(mockUseAdvancedVoice.updateConfig).toHaveBeenCalledWith({ autoAdvance: false });
  });

  it('renders visualization canvas when enabled', () => {
    render(<AdvancedVoiceControls />);

    const canvas = screen.getByRole('img', { hidden: true }); // Canvas has implicit img role
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '120');
    expect(canvas).toHaveAttribute('height', '40');
  });

  it('shows keyboard shortcuts in settings', async () => {
    render(<AdvancedVoiceControls />);

    // Expand settings
    const settingsButton = screen.getByTitle('Settings (Ctrl+S)');
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText(/V - Toggle voice/)).toBeInTheDocument();
      expect(screen.getByText(/Space - Play\/Pause/)).toBeInTheDocument();
      expect(screen.getByText(/Esc - Stop/)).toBeInTheDocument();
      expect(screen.getByText(/1-5 - Select persona/)).toBeInTheDocument();
      expect(screen.getByText(/Ctrl\+S - Settings/)).toBeInTheDocument();
    });
  });

  it('shows speaking indicator with animation', () => {
    mockUseAdvancedVoice.isSpeaking = true;

    render(<AdvancedVoiceControls />);

    const speakingIndicator = screen.getByText('SPEAKING...');
    expect(speakingIndicator).toBeInTheDocument();
    
    const radioIcon = document.querySelector('.lucide-radio');
    expect(radioIcon).toHaveClass('animate-pulse');
  });

  it('disables play button when no text provided', () => {
    render(<AdvancedVoiceControls />);

    const playButton = screen.getByTitle('Play (Space)');
    expect(playButton).toBeDisabled();
  });

  it('calls text highlight callback', () => {
    const mockHighlight = vi.fn();
    mockUseAdvancedVoice.isSpeaking = true;
    mockUseAdvancedVoice.currentWord = 3;

    render(<AdvancedVoiceControls onTextHighlight={mockHighlight} />);

    expect(mockHighlight).toHaveBeenCalledWith(3);
  });
});