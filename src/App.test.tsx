import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders header with game title', () => {
    render(<App />);
    const headerElement = screen.getByText('THE MATRIX ARCADE');
    expect(headerElement).toBeInTheDocument();
  });

  it('renders game carousel navigation', () => {
    render(<App />);
    // Check for game navigation elements
    const prevButton = screen.getByTitle('Previous game');
    const nextButton = screen.getByTitle('Next game');
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('displays version number', () => {
    render(<App />);
    const versionText = screen.getByText(/SYSTEM v1.0.2/);
    expect(versionText).toBeInTheDocument();
  });

  it('renders games menu button', () => {
    render(<App />);
    const gamesButton = screen.getByText('Games');
    expect(gamesButton).toBeInTheDocument();
  });
});

