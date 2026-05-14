import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameErrorBoundary } from './GameErrorBoundary';

const ThrowingChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test crash');
  return <div>Game content</div>;
};

describe('GameErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </GameErrorBoundary>
    );
    expect(screen.getByText('Game content')).toBeInTheDocument();
  });

  it('renders error state when child throws', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    expect(screen.getByText('SYSTEM ERROR')).toBeInTheDocument();
    expect(screen.getByText('Test crash')).toBeInTheDocument();
  });

  it('shows game name in crash message when provided', () => {
    render(
      <GameErrorBoundary gameName="Matrix Frogger">
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    expect(screen.getByText('Matrix Frogger crashed')).toBeInTheDocument();
  });

  it('shows generic crash message when no game name', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    expect(screen.getByText('Game crashed')).toBeInTheDocument();
  });

  it('calls onReset when restart button is clicked', () => {
    const onReset = vi.fn();
    render(
      <GameErrorBoundary onReset={onReset}>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    fireEvent.click(screen.getByRole('button', { name: /restart game/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('has role="alert" and aria-live="assertive" on error container', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    const alertRegion = screen.getByRole('alert');
    expect(alertRegion).toHaveAttribute('aria-live', 'assertive');
  });

  it('restart button has aria-label', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /restart game/i })).toBeInTheDocument();
  });
});
