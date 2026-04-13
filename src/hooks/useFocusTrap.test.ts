import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let button3: HTMLButtonElement;

  beforeEach(() => {
    container = document.createElement('div');
    button1 = document.createElement('button');
    button1.textContent = 'First';
    button2 = document.createElement('button');
    button2.textContent = 'Second';
    button3 = document.createElement('button');
    button3.textContent = 'Third';
    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('focuses the first focusable element when active', () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));
    expect(document.activeElement).toBe(button1);
  });

  it('does nothing when inactive', () => {
    const previousFocus = document.activeElement;
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, false));
    expect(document.activeElement).toBe(previousFocus);
  });

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true, onEscape));

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    container.dispatchEvent(event);

    expect(onEscape).toHaveBeenCalledOnce();
  });

  it('wraps focus from last to first on Tab', () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    button3.focus();
    expect(document.activeElement).toBe(button3);

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    Object.defineProperty(event, 'shiftKey', { value: false });
    container.dispatchEvent(event);

    expect(document.activeElement).toBe(button1);
  });

  it('wraps focus from first to last on Shift+Tab', () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    button1.focus();
    expect(document.activeElement).toBe(button1);

    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    container.dispatchEvent(event);

    expect(document.activeElement).toBe(button3);
  });

  it('restores focus on unmount', () => {
    const outsideButton = document.createElement('button');
    document.body.appendChild(outsideButton);
    outsideButton.focus();
    expect(document.activeElement).toBe(outsideButton);

    const ref = { current: container };
    const { unmount } = renderHook(() => useFocusTrap(ref, true));
    expect(document.activeElement).toBe(button1);

    unmount();
    expect(document.activeElement).toBe(outsideButton);

    document.body.removeChild(outsideButton);
  });

  it('skips disabled buttons', () => {
    button1.disabled = true;
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));
    expect(document.activeElement).toBe(button2);
  });
});
