import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyPanel, parseControlsString, STATIC_CONTROLS } from './KeyPanel';
import type { GameEntry } from '../data/gameRegistry';

function makeGame(overrides: Partial<GameEntry> = {}): GameEntry {
  return {
    id: 'snake-classic',
    title: 'Snake Classic',
    description: 'desc',
    preview: '',
    category: 'Arcade',
    inspiration: '',
    inspirationNote: '',
    controls: 'Arrow keys/WASD to move. Collect food, avoid walls!',
    ...overrides,
  };
}

describe('parseControlsString fallback parser', () => {
  it('returns an empty array for an empty string', () => {
    expect(parseControlsString('')).toEqual([]);
  });

  it('splits comma-delimited "KEY to MEANING" patterns', () => {
    const hints = parseControlsString('Arrow keys to move, SPACE to fire');
    expect(hints).toEqual([
      { key: 'ARROW KEYS', meaning: 'move' },
      { key: 'SPACE', meaning: 'fire' },
    ]);
  });

  it('handles colon-delimited "KEY: MEANING" patterns', () => {
    const hints = parseControlsString('Arrow keys / Mouse: Move paddle | SPACE: Launch ball');
    expect(hints).toContainEqual({ key: 'ARROW KEYS / MOUSE', meaning: 'Move paddle' });
    expect(hints).toContainEqual({ key: 'SPACE', meaning: 'Launch ball' });
  });

  it('falls through to meaning-only rows when no key pattern is recognised', () => {
    const hints = parseControlsString('Collect food');
    expect(hints).toEqual([{ key: '', meaning: 'Collect food' }]);
  });
});

describe('KeyPanel rendering', () => {
  it('renders the static arcade controls when no game is playing', () => {
    render(<KeyPanel isPlaying={false} />);

    const panel = screen.getByTestId('key-panel');
    expect(panel).toHaveAttribute('data-mode', 'static');
    expect(screen.getByText('ARCADE KEYS')).toBeInTheDocument();

    STATIC_CONTROLS.forEach((hint) => {
      expect(screen.getAllByText(hint.meaning).length).toBeGreaterThan(0);
    });
  });

  it('renders per-game in-play controls from the curated map when playing', () => {
    const game = makeGame({ id: 'metris' });
    render(<KeyPanel isPlaying={true} game={game} />);

    const panel = screen.getByTestId('key-panel');
    expect(panel).toHaveAttribute('data-mode', 'in-play');
    expect(screen.getByText('NOW PLAYING')).toBeInTheDocument();
    expect(screen.getByText(game.title)).toBeInTheDocument();

    expect(screen.getByText('Rotate')).toBeInTheDocument();
    expect(screen.getByText('Hard drop')).toBeInTheDocument();
    expect(screen.getByText('Bullet time')).toBeInTheDocument();
  });

  it('falls back to parseControlsString for games missing from the curated map', () => {
    const game = makeGame({
      id: 'unknown-id',
      title: 'Unknown Game',
      controls: 'SPACE to jump, B to attack',
    });

    render(<KeyPanel isPlaying={true} game={game} />);

    expect(screen.getByText('jump')).toBeInTheDocument();
    expect(screen.getByText('attack')).toBeInTheDocument();
  });

  it('defaults to static controls when playing but no game is provided', () => {
    render(<KeyPanel isPlaying={true} />);

    const panel = screen.getByTestId('key-panel');
    expect(panel).toHaveAttribute('data-mode', 'static');
    expect(screen.getByText('ARCADE KEYS')).toBeInTheDocument();
  });

  it('exposes accessible labelling reflecting the current mode', () => {
    const { rerender } = render(<KeyPanel isPlaying={false} />);
    expect(
      screen.getByRole('complementary', { name: /arcade navigation controls/i }),
    ).toBeInTheDocument();

    rerender(<KeyPanel isPlaying={true} game={makeGame()} />);
    expect(
      screen.getByRole('complementary', { name: /game controls reference/i }),
    ).toBeInTheDocument();
  });
});
