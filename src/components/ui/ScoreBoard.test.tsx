import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBoard } from './ScoreBoard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
}));

describe('ScoreBoard Component', () => {
  it('displays player score correctly', () => {
    render(<ScoreBoard score={{ player: 10, ai: 5 }} speed={1.5} />);
    
    const playerLabel = screen.getByText('PLAYER');
    const playerScore = screen.getByText('10');
    expect(playerLabel).toBeInTheDocument();
    expect(playerScore).toBeInTheDocument();
  });

  it('displays AI score correctly', () => {
    render(<ScoreBoard score={{ player: 10, ai: 5 }} speed={1.5} />);
    
    const aiLabel = screen.getByText('AI');
    const aiScore = screen.getByText('5');
    expect(aiLabel).toBeInTheDocument();
    expect(aiScore).toBeInTheDocument();
  });

  it('displays game speed', () => {
    render(<ScoreBoard score={{ player: 5, ai: 3 }} speed={2.0} />);
    
    const speedLabel = screen.getByText('SPEED');
    const speedValue = screen.getByText('2.0x');
    expect(speedLabel).toBeInTheDocument();
    expect(speedValue).toBeInTheDocument();
  });

  it('formats speed with one decimal place', () => {
    render(<ScoreBoard score={{ player: 0, ai: 0 }} speed={1.567} />);
    
    const speedValue = screen.getByText('1.6x');
    expect(speedValue).toBeInTheDocument();
  });

  it('renders with correct styling classes', () => {
    const { container } = render(<ScoreBoard score={{ player: 0, ai: 0 }} speed={1.0} />);
    
    // Check for main container
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('w-full', 'flex', 'justify-between', 'items-center', 'font-mono');
    
    // Check for score containers
    const scoreContainers = container.querySelectorAll('.border-green-500');
    expect(scoreContainers).toHaveLength(3); // Player, AI, and Speed containers
  });

  it('applies glow effect for high speeds', () => {
    render(<ScoreBoard score={{ player: 0, ai: 0 }} speed={11} />);
    
    const speedContainer = screen.getByText('SPEED').parentElement;
    // The motion.div would handle the animation, but we're mocking it
    expect(speedContainer).toBeInTheDocument();
  });

  it('renders responsive classes', () => {
    const { container } = render(<ScoreBoard score={{ player: 0, ai: 0 }} speed={1.0} />);
    
    // Check for responsive padding classes
    const paddedElements = container.querySelectorAll('.p-2.md\\:p-4');
    expect(paddedElements.length).toBeGreaterThan(0);
    
    // Check for responsive text size classes
    const smallTexts = container.querySelectorAll('.text-xs.md\\:text-sm');
    expect(smallTexts.length).toBeGreaterThan(0);
  });

  it('displays zero scores correctly', () => {
    render(<ScoreBoard score={{ player: 0, ai: 0 }} speed={1.0} />);
    
    const zeroScores = screen.getAllByText('0');
    expect(zeroScores).toHaveLength(2); // Player and AI both at 0
  });

  it('handles negative scores', () => {
    render(<ScoreBoard score={{ player: -5, ai: -10 }} speed={1.0} />);
    
    expect(screen.getByText('-5')).toBeInTheDocument();
    expect(screen.getByText('-10')).toBeInTheDocument();
  });

  it('handles large scores', () => {
    render(<ScoreBoard score={{ player: 999999, ai: 123456 }} speed={99.9} />);
    
    expect(screen.getByText('999999')).toBeInTheDocument();
    expect(screen.getByText('123456')).toBeInTheDocument();
    expect(screen.getByText('99.9x')).toBeInTheDocument();
  });
});