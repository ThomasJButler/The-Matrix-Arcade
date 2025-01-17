import React from 'react';
import { render, screen } from '@testing-library/react';
import VortexPong from './VortexPong';

describe('VortexPong Component', () => {
  test('renders canvas element', () => {
    render(<VortexPong />);
    const canvasElement = screen.getByTestId('vortex-pong-canvas');
    expect(canvasElement).toBeInTheDocument();
  });

  test('initializes with correct paddle positions', () => {
    render(<VortexPong />);
    // Assuming paddle elements have data-testid attributes
    const playerPaddle = screen.getByTestId('player-paddle');
    const aiPaddle = screen.getByTestId('ai-paddle');
    expect(playerPaddle).toHaveStyle('top: 150px');
    expect(aiPaddle).toHaveStyle('top: 150px');
  });

  test('initial ball position is correct', () => {
    render(<VortexPong />);
    const ball = screen.getByTestId('ball');
    expect(ball).toHaveStyle('left: 400px');
    expect(ball).toHaveStyle('top: 200px');
  });
});
