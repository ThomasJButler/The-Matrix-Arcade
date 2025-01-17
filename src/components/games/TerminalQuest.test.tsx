import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TerminalQuest from './TerminalQuest';
import test from 'node:test';
import { describe } from 'yargs';

describe('TerminalQuest Component', () => {
  test('renders game title and description', () => {
    render(<TerminalQuest />);
    const titleElement = screen.getByText(/SYSTEM FAILURE/i);
    const descriptionElement = screen.getByText(/The system alarms start to chime/i);
    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
  });

  test('displays choices and navigates on selection', () => {
    render(<TerminalQuest />);
    const choiceButton = screen.getByRole('button', { name: /Run a cloaking script/i });
    fireEvent.click(choiceButton);
    const nextNodeElement = screen.getByText(/safe_zone/i);
    expect(nextNodeElement).toBeInTheDocument();
  });

  test('requires hack tool for specific choices', () => {
    render(<TerminalQuest />);
    const choiceButton = screen.getByRole('button', { name: /Run a cloaking script/i });
    // Initially, hack tool is not available
    expect(choiceButton).toHaveAttribute('disabled');
    // Simulate acquiring hack tool
    // This may require mocking state
    expect(true).toBe(true); // Replace with actual assertions
  });
});
