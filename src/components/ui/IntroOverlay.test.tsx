import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { IntroOverlay } from './IntroOverlay';

describe('IntroOverlay', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a dialog overlay with testid + aria wiring for screen readers', () => {
    render(<IntroOverlay onEnter={() => {}} />);
    const overlay = screen.getByTestId('intro-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('role', 'dialog');
    expect(overlay).toHaveAttribute('aria-modal', 'true');
    expect(overlay).toHaveAttribute('aria-label', 'Enter The Matrix Arcade');
  });

  it('renders both red and blue pill buttons', () => {
    render(<IntroOverlay onEnter={() => {}} />);
    expect(screen.getByRole('button', { name: /red pill/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /blue pill/i })).toBeInTheDocument();
  });

  it('fires onEnter when the red pill is clicked', () => {
    const onEnter = vi.fn();
    render(<IntroOverlay onEnter={onEnter} />);
    fireEvent.click(screen.getByRole('button', { name: /red pill/i }));
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('fires onEnter when the blue pill is clicked', () => {
    const onEnter = vi.fn();
    render(<IntroOverlay onEnter={onEnter} />);
    fireEvent.click(screen.getByRole('button', { name: /blue pill/i }));
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('fires onEnter on Escape + Enter keypress (keyboard fallback)', () => {
    const onEnter = vi.fn();
    render(<IntroOverlay onEnter={onEnter} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onEnter).toHaveBeenCalledTimes(2);
  });

  it('renders a looping muted autoplay video with playsInline for mobile Safari', () => {
    const { container } = render(<IntroOverlay onEnter={() => {}} />);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect((video as HTMLVideoElement).muted).toBe(true);
    // React maps `playsInline` to the `playsinline` HTML attribute.
    expect(video?.hasAttribute('playsinline')).toBe(true);
    expect(video?.getAttribute('src')).toMatch(/^https:\/\/res\.cloudinary\.com\//);
  });

  it('focuses the red pill on mount so keyboard users can immediately press Enter', () => {
    render(<IntroOverlay onEnter={() => {}} />);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /red pill/i }));
  });
});
