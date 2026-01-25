import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkipToContent } from '../../../components/accessibility/SkipToContent';

describe('SkipToContent Component', () => {
  it('should render skip to content link', () => {
    render(<SkipToContent targetId="main-content" />);
    const link = screen.getByText('Skip to main content');
    expect(link).toBeInTheDocument();
  });

  it('should have correct href attribute', () => {
    render(<SkipToContent targetId="main-content" />);
    const link = screen.getByText('Skip to main content');
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('should be accessible via keyboard', () => {
    render(<SkipToContent targetId="main-content" />);
    const link = screen.getByText('Skip to main content');

    // Should be focusable
    link.focus();
    expect(link).toHaveFocus();
  });

  it('should have sr-only class by default but visible on focus', () => {
    render(<SkipToContent targetId="main-content" />);
    const link = screen.getByText('Skip to main content');

    // Should have sr-only class initially
    expect(link).toHaveClass('sr-only');

    // Should add focus:not-sr-only class for visibility on focus
    expect(link).toHaveClass('focus:not-sr-only');
  });

  it('should accept custom text', () => {
    render(<SkipToContent targetId="navigation" text="Skip to navigation" />);
    const link = screen.getByText('Skip to navigation');
    expect(link).toBeInTheDocument();
  });

  it('should handle click and focus main content', () => {
    const mainContent = document.createElement('div');
    mainContent.id = 'main-content';
    mainContent.tabIndex = -1;
    document.body.appendChild(mainContent);

    render(<SkipToContent targetId="main-content" />);
    const link = screen.getByText('Skip to main content');

    fireEvent.click(link);
    expect(mainContent).toHaveFocus();

    document.body.removeChild(mainContent);
  });
});