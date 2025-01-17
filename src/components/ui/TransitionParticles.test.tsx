import React from 'react';
import { render } from '@testing-library/react';
import TransitionParticles from './TransitionParticles';

describe('TransitionParticles Component', () => {
  test('renders canvas for particles', () => {
    const { getByTestId } = render(<TransitionParticles />);
    const canvasElement = getByTestId('transition-particles-canvas');
    expect(canvasElement).toBeInTheDocument();
  });

  test('initializes correct number of particles', () => {
    const { container } = render(<TransitionParticles />);
    const particles = container.querySelectorAll('circle');
    expect(particles.length).toBeGreaterThan(0);
  });

  test('clears particles on unmount', () => {
    const { unmount, getByTestId } = render(<TransitionParticles />);
    const canvasElement = getByTestId('transition-particles-canvas');
    unmount();
    expect(canvasElement).not.toBeInTheDocument();
  });
});
