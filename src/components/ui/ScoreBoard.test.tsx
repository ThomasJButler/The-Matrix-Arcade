import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScoreBoard } from './ScoreBoard';
import { test } from 'node:test';

describe('ScoreBoard Component', () => {
  test('displays player score correctly', () => {
    render(<ScoreBoard score={{ player: 10 }} speed={1.5} />);
    const playerScore = screen.getByText(/PLAYER/i);
    const scoreValue = screen.getByText('10');
    expect(playerScore).toBeInTheDocument();
    expect(scoreValue).toBeInTheDocument();
  });

  test('displays game speed', () => {
    render(<ScoreBoard score={{ player: 5 }} speed={2.0} />);
    const speedElement = screen.getByText(/Speed: 2.0x/i);
    expect(speedElement).toBeInTheDocument();
  });

  test('animates on mount', () => {
    render(<ScoreBoard score={{ player: 0 }} speed={1.0} />);
    const scoreboard = screen.getByTestId('scoreboard');
    expect(scoreboard).toHaveStyle('opacity: 1');
    // Additional checks for animations can be added
  });
});
