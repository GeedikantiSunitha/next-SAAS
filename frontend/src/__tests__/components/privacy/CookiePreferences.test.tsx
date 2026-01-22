/**
 * Tests for CookiePreferences Component
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CookiePreferences from '../../../components/privacy/CookiePreferences';
import { privacyApi } from '../../../api/privacy';
import { vi } from 'vitest';

// Mock the API
vi.mock('../../../api/privacy', () => ({
  privacyApi: {
    updateCookiePreferences: vi.fn(),
  },
}));

describe('CookiePreferences Component', () => {
  const mockPreferences = {
    essential: true,
    analytics: false,
    marketing: false,
    functional: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render section title', () => {
    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
  });

  it('should display all cookie categories', () => {
    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);

    expect(screen.getByText('Essential Cookies')).toBeInTheDocument();
    expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
    expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
    expect(screen.getByText('Functional Cookies')).toBeInTheDocument();
  });

  it('should show cookie descriptions', () => {
    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);

    expect(screen.getByText(/Required for the website to function/i)).toBeInTheDocument();
    expect(screen.getByText(/Help us understand how you use/i)).toBeInTheDocument();
    expect(screen.getByText(/Used to show relevant advertisements/i)).toBeInTheDocument();
    expect(screen.getByText(/Enable enhanced functionality/i)).toBeInTheDocument();
  });

  it('should show toggle switches for preferences', () => {
    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);

    const essentialToggle = screen.getByRole('switch', { name: /Essential Cookies/i });
    const analyticsToggle = screen.getByRole('switch', { name: /Analytics Cookies/i });
    const marketingToggle = screen.getByRole('switch', { name: /Marketing Cookies/i });
    const functionalToggle = screen.getByRole('switch', { name: /Functional Cookies/i });

    expect(essentialToggle).toBeChecked();
    expect(analyticsToggle).not.toBeChecked();
    expect(marketingToggle).not.toBeChecked();
    expect(functionalToggle).toBeChecked();
  });

  it('should disable essential cookies toggle', () => {
    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);

    const essentialToggle = screen.getByRole('switch', { name: /Essential Cookies/i });
    expect(essentialToggle).toBeDisabled();
    expect(screen.getByText(/Always enabled/i)).toBeInTheDocument();
  });

  it('should handle preference toggle', async () => {
    const mockUpdate = vi.fn();
    (privacyApi.updateCookiePreferences as any).mockResolvedValue({ success: true });

    render(<CookiePreferences preferences={mockPreferences} onUpdate={mockUpdate} />);

    const analyticsToggle = screen.getByRole('switch', { name: /Analytics Cookies/i });
    fireEvent.click(analyticsToggle);

    await waitFor(() => {
      expect(privacyApi.updateCookiePreferences).toHaveBeenCalledWith({
        analytics: true,
      });
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('should show save all button', () => {
    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Save All Preferences/i })).toBeInTheDocument();
  });

  it('should have accept all button', () => {
    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Accept All/i })).toBeInTheDocument();
  });

  it('should have reject all button', () => {
    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Reject All/i })).toBeInTheDocument();
  });

  it('should handle accept all', async () => {
    const mockUpdate = vi.fn();
    (privacyApi.updateCookiePreferences as any).mockResolvedValue({ success: true });

    render(<CookiePreferences preferences={mockPreferences} onUpdate={mockUpdate} />);

    const acceptAllButton = screen.getByRole('button', { name: /Accept All/i });
    fireEvent.click(acceptAllButton);

    await waitFor(() => {
      expect(privacyApi.updateCookiePreferences).toHaveBeenCalledWith({
        essential: true,
        analytics: true,
        marketing: true,
        functional: true,
      });
    });
  });

  it('should handle reject all', async () => {
    const mockUpdate = vi.fn();
    (privacyApi.updateCookiePreferences as any).mockResolvedValue({ success: true });

    render(<CookiePreferences preferences={mockPreferences} onUpdate={mockUpdate} />);

    const rejectAllButton = screen.getByRole('button', { name: /Reject All/i });
    fireEvent.click(rejectAllButton);

    await waitFor(() => {
      expect(privacyApi.updateCookiePreferences).toHaveBeenCalledWith({
        essential: true, // Always enabled
        analytics: false,
        marketing: false,
        functional: false,
      });
    });
  });

  it('should show loading state during update', async () => {
    (privacyApi.updateCookiePreferences as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);

    const toggle = screen.getByRole('switch', { name: /Analytics Cookies/i });
    fireEvent.click(toggle);

    expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
  });

  it('should handle update errors', async () => {
    (privacyApi.updateCookiePreferences as any).mockRejectedValue(new Error('Update failed'));

    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);

    const toggle = screen.getByRole('switch', { name: /Analytics Cookies/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update preferences/i)).toBeInTheDocument();
    });
  });

  it('should show cookie policy link', () => {
    render(<CookiePreferences preferences={mockPreferences} onUpdate={vi.fn()} />);
    expect(screen.getByRole('link', { name: /Cookie Policy/i })).toBeInTheDocument();
  });
});