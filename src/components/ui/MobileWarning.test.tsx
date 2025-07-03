import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileWarning } from './MobileWarning';

describe('MobileWarning', () => {
  it('renders warning message correctly', () => {
    render(<MobileWarning />);

    expect(screen.getByText('DESKTOP REQUIRED')).toBeInTheDocument();
    expect(screen.getByText(/The Matrix Arcade games require a desktop computer/)).toBeInTheDocument();
    expect(screen.getByText(/Please visit us on your desktop browser/)).toBeInTheDocument();
  });

  it('displays warning icon', () => {
    render(<MobileWarning />);

    // Check for alert triangle icon
    const alertIcon = document.querySelector('.lucide-alert-triangle');
    expect(alertIcon).toBeInTheDocument();
  });

  it('displays computer icon', () => {
    render(<MobileWarning />);

    // Check for monitor icon
    const monitorIcon = document.querySelector('.lucide-monitor');
    expect(monitorIcon).toBeInTheDocument();
  });

  it('renders dismiss button when onDismiss prop is provided', () => {
    const mockDismiss = vi.fn();
    render(<MobileWarning onDismiss={mockDismiss} />);

    const dismissButton = screen.getByText('I UNDERSTAND');
    expect(dismissButton).toBeInTheDocument();
  });

  it('does not render dismiss button when onDismiss prop is not provided', () => {
    render(<MobileWarning />);

    const dismissButton = screen.queryByText('I UNDERSTAND');
    expect(dismissButton).not.toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const mockDismiss = vi.fn();
    render(<MobileWarning onDismiss={mockDismiss} />);

    const dismissButton = screen.getByText('I UNDERSTAND');
    fireEvent.click(dismissButton);

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders matrix rain effect elements', () => {
    render(<MobileWarning />);

    const matrixChars = document.querySelectorAll('.animate-matrix-rain');
    expect(matrixChars.length).toBe(30);
  });

  it('applies correct animation classes', () => {
    const { container } = render(<MobileWarning />);

    // Check for motion wrapper
    const motionWrapper = container.querySelector('[style*="opacity"]');
    expect(motionWrapper).toBeInTheDocument();
  });

  it('renders ASCII art decoration', () => {
    render(<MobileWarning />);

    // Check for ASCII art in pre tag
    const asciiArt = screen.getByText((content, element) => {
      return element?.tagName === 'PRE' && content.includes('□');
    });
    expect(asciiArt).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    const { container } = render(<MobileWarning />);

    const warningBox = container.querySelector('.bg-gray-900.border-green-500');
    expect(warningBox).toBeInTheDocument();
    expect(warningBox).toHaveClass('rounded-lg', 'p-8', 'shadow-[0_0_50px_rgba(0,255,0,0.3)]');
  });

  it('renders with full screen overlay', () => {
    const { container } = render(<MobileWarning />);

    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('bg-black', 'z-50');
  });

  it('centers content properly', () => {
    const { container } = render(<MobileWarning />);

    const centerWrapper = container.querySelector('.flex.items-center.justify-center');
    expect(centerWrapper).toBeInTheDocument();
  });

  it('has pulse animation on warning icon', () => {
    render(<MobileWarning />);

    const warningIcon = document.querySelector('.lucide-alert-triangle');
    expect(warningIcon).toHaveClass('animate-pulse');
  });

  it('renders with proper text styling', () => {
    render(<MobileWarning />);

    const title = screen.getByText('DESKTOP REQUIRED');
    expect(title).toHaveClass('text-2xl', 'font-mono', 'text-green-400');

    const message = screen.getByText(/The Matrix Arcade games require a desktop computer/);
    expect(message).toHaveClass('text-green-300');
  });

  it('maintains aspect ratio on different screen sizes', () => {
    const { container } = render(<MobileWarning />);

    const contentBox = container.querySelector('.max-w-md');
    expect(contentBox).toBeInTheDocument();
    expect(contentBox).toHaveClass('w-full');
  });
});