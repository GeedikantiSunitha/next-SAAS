import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { AccessibilitySettings } from '../../../components/accessibility/AccessibilitySettings';

describe('AccessibilitySettings Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render accessibility settings', () => {
    render(<AccessibilitySettings />);
    expect(screen.getByText(/Accessibility Settings/i)).toBeInTheDocument();
  });

  it('should have high contrast mode toggle', () => {
    render(<AccessibilitySettings />);
    const toggle = screen.getByLabelText(/High Contrast Mode/i);
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('role', 'switch');
  });

  it('should have reduced motion toggle', () => {
    render(<AccessibilitySettings />);
    const toggle = screen.getByLabelText(/Reduce Motion/i);
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('role', 'switch');
  });

  it('should have font size controls', () => {
    render(<AccessibilitySettings />);
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decrease font size/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Increase font size/i })).toBeInTheDocument();
  });

  it('should toggle high contrast mode', () => {
    render(<AccessibilitySettings />);
    const toggle = screen.getByLabelText(/High Contrast Mode/i);

    fireEvent.click(toggle);
    expect(document.documentElement).toHaveClass('high-contrast');

    fireEvent.click(toggle);
    expect(document.documentElement).not.toHaveClass('high-contrast');
  });

  it('should toggle reduced motion', () => {
    render(<AccessibilitySettings />);
    const toggle = screen.getByLabelText(/Reduce Motion/i);

    fireEvent.click(toggle);
    expect(document.documentElement).toHaveClass('reduce-motion');

    fireEvent.click(toggle);
    expect(document.documentElement).not.toHaveClass('reduce-motion');
  });

  it('should adjust font size', () => {
    render(<AccessibilitySettings />);
    const increaseBtn = screen.getByRole('button', { name: /Increase font size/i });
    const decreaseBtn = screen.getByRole('button', { name: /Decrease font size/i });

    const initialFontSize = parseFloat(
      window.getComputedStyle(document.documentElement).fontSize
    );

    fireEvent.click(increaseBtn);
    const increasedFontSize = parseFloat(
      window.getComputedStyle(document.documentElement).fontSize
    );
    expect(increasedFontSize).toBeGreaterThan(initialFontSize);

    fireEvent.click(decreaseBtn);
    const decreasedFontSize = parseFloat(
      window.getComputedStyle(document.documentElement).fontSize
    );
    expect(decreasedFontSize).toBeLessThan(increasedFontSize);
  });

  it('should persist settings in localStorage', () => {
    render(<AccessibilitySettings />);
    const highContrastToggle = screen.getByLabelText(/High Contrast Mode/i);

    fireEvent.click(highContrastToggle);

    const savedSettings = JSON.parse(
      localStorage.getItem('accessibility-settings') || '{}'
    );
    expect(savedSettings.highContrast).toBe(true);
  });

  it('should load saved settings on mount', () => {
    const savedSettings = {
      highContrast: true,
      reduceMotion: true,
      fontSize: 'large'
    };
    localStorage.setItem('accessibility-settings', JSON.stringify(savedSettings));

    render(<AccessibilitySettings />);

    expect(document.documentElement).toHaveClass('high-contrast');
    expect(document.documentElement).toHaveClass('reduce-motion');
  });

  it('should have keyboard shortcuts info', () => {
    render(<AccessibilitySettings />);
    expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument();
  });

  it('should be fully keyboard navigable', () => {
    render(<AccessibilitySettings />);
    const firstToggle = screen.getByLabelText(/High Contrast Mode/i);

    // Test that the toggle is focusable
    firstToggle.focus();
    expect(firstToggle).toHaveFocus();

    // Test that other controls are also focusable
    const decreaseButton = screen.getByRole('button', { name: /Decrease font size/i });
    decreaseButton.focus();
    expect(decreaseButton).toHaveFocus();
  });
});