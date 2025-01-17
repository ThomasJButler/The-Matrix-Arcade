import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import test from 'node:test';
import { describe } from 'yargs';

describe('App Component', () => {
  test('renders header with game title', () => {
    render(<App />);
    const headerElement = screen.getByText(/TheMatrixArcade/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders navigation to different games', () => {
    render(<App />);
    const terminalQuestLink = screen.getByRole('button', { name: /Terminal Quest/i });
    const matrixCloudLink = screen.getByRole('button', { name: /Matrix Cloud/i });
    expect(terminalQuestLink).toBeInTheDocument();
    expect(matrixCloudLink).toBeInTheDocument();
  });

  test('renders selected game component', () => {
    render(<App />);
    // Assuming default selected game is displayed
    const defaultGameCanvas = screen.getByTestId('matrix-cloud-canvas');
    expect(defaultGameCanvas).toBeInTheDocument();
  });
});
function expect(terminalQuestLink: HTMLElement) {
    throw new Error('Function not implemented.');
}

