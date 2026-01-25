import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { FocusTrap } from '../../../components/accessibility/FocusTrap';

describe('FocusTrap Component', () => {
  it('should render children', () => {
    render(
      <FocusTrap active={true}>
        <div>Test Content</div>
      </FocusTrap>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should trap focus when active', () => {
    render(
      <FocusTrap active={true}>
        <div>
          <button>First Button</button>
          <button>Second Button</button>
          <button>Third Button</button>
        </div>
      </FocusTrap>
    );

    const buttons = screen.getAllByRole('button');
    const firstButton = buttons[0];
    const lastButton = buttons[2];

    // Focus last button and press Tab - should wrap to first
    lastButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', code: 'Tab' });
    expect(document.activeElement).toBe(firstButton);
  });

  it('should not trap focus when inactive', () => {
    render(
      <FocusTrap active={false}>
        <div>
          <button>Inside Button</button>
        </div>
      </FocusTrap>
    );

    const insideButton = screen.getByText('Inside Button');

    // When inactive, FocusTrap should not interfere with focus
    // The component should render but not trap focus
    expect(insideButton).toBeInTheDocument();

    // Focus should work normally
    insideButton.focus();
    expect(document.activeElement).toBe(insideButton);

    // Tab key should not be prevented (no trap behavior)
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    let defaultPrevented = false;
    Object.defineProperty(event, 'preventDefault', {
      value: () => { defaultPrevented = true; }
    });

    document.dispatchEvent(event);
    expect(defaultPrevented).toBe(false);
  });

  it('should handle Escape key when onEscape provided', () => {
    const onEscape = vi.fn();
    render(
      <FocusTrap active={true} onEscape={onEscape}>
        <div>
          <button>Test Button</button>
        </div>
      </FocusTrap>
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onEscape).toHaveBeenCalled();
  });

  it('should restore focus on unmount', () => {
    const previousFocus = document.createElement('button');
    previousFocus.textContent = 'Previous Focus';
    document.body.appendChild(previousFocus);
    previousFocus.focus();

    const { unmount } = render(
      <FocusTrap active={true} restoreFocus={true}>
        <div>
          <button>Trap Button</button>
        </div>
      </FocusTrap>
    );

    const trapButton = screen.getByText('Trap Button');
    trapButton.focus();

    unmount();

    expect(document.activeElement).toBe(previousFocus);
    document.body.removeChild(previousFocus);
  });
});