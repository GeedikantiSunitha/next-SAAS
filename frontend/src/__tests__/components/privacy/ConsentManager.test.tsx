/**
 * Tests for ConsentManager Component
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConsentManager from '../../../components/privacy/ConsentManager';
import { privacyApi } from '../../../api/privacy';
import { vi } from 'vitest';

// Mock the API
vi.mock('../../../api/privacy', () => ({
  privacyApi: {
    updateConsent: vi.fn(),
  },
}));

describe('ConsentManager Component', () => {
  const mockConsents = [
    {
      type: 'MARKETING_EMAILS',
      granted: true,
      version: '2.0.0',
      grantedAt: '2024-01-01',
      expiresAt: '2025-01-01',
    },
    {
      type: 'COOKIES',
      granted: false,
      version: '1.0.0',
    },
    {
      type: 'DATA_SHARING',
      granted: true,
      version: '1.5.0',
      grantedAt: '2024-01-15',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render section title', () => {
    render(<ConsentManager consents={mockConsents} onUpdate={vi.fn()} />);
    expect(screen.getByText('Consent Management')).toBeInTheDocument();
  });

  it('should display all consents', () => {
    render(<ConsentManager consents={mockConsents} onUpdate={vi.fn()} />);

    expect(screen.getByText('Marketing Emails')).toBeInTheDocument();
    expect(screen.getByText('Cookies')).toBeInTheDocument();
    expect(screen.getByText('Data Sharing')).toBeInTheDocument();
  });

  it('should show consent status with toggle switches', () => {
    render(<ConsentManager consents={mockConsents} onUpdate={vi.fn()} />);

    const marketingToggle = screen.getByRole('switch', { name: /Marketing Emails/i });
    expect(marketingToggle).toBeChecked();

    const cookiesToggle = screen.getByRole('switch', { name: /Cookies/i });
    expect(cookiesToggle).not.toBeChecked();
  });

  it('should display consent version', () => {
    render(<ConsentManager consents={mockConsents} onUpdate={vi.fn()} />);

    expect(screen.getByText('Version: 2.0.0')).toBeInTheDocument();
    expect(screen.getByText('Version: 1.0.0')).toBeInTheDocument();
  });

  it('should display consent dates', () => {
    render(<ConsentManager consents={mockConsents} onUpdate={vi.fn()} />);

    // Dates are formatted using toLocaleDateString() which produces MM/DD/YYYY format
    expect(screen.getByText(/Granted: .*1\/1\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/Expires: .*1\/1\/2025/)).toBeInTheDocument();
  });

  it('should handle consent toggle', async () => {
    const mockUpdate = vi.fn();
    (privacyApi.updateConsent as any).mockResolvedValue({ success: true });

    render(<ConsentManager consents={mockConsents} onUpdate={mockUpdate} />);

    const cookiesToggle = screen.getByRole('switch', { name: /Cookies/i });
    fireEvent.click(cookiesToggle);

    await waitFor(() => {
      expect(privacyApi.updateConsent).toHaveBeenCalledWith('COOKIES', true);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('should show loading state during update', async () => {
    (privacyApi.updateConsent as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<ConsentManager consents={mockConsents} onUpdate={vi.fn()} />);

    const toggle = screen.getByRole('switch', { name: /Cookies/i });
    fireEvent.click(toggle);

    expect(screen.getByText(/Updating.../i)).toBeInTheDocument();
  });

  it('should handle update errors', async () => {
    (privacyApi.updateConsent as any).mockRejectedValue(new Error('Update failed'));

    render(<ConsentManager consents={mockConsents} onUpdate={vi.fn()} />);

    const toggle = screen.getByRole('switch', { name: /Cookies/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update consent/i)).toBeInTheDocument();
    });
  });

  it('should show expiry warnings', () => {
    const expiringConsents = [
      {
        type: 'MARKETING_EMAILS',
        granted: true,
        version: '2.0.0',
        grantedAt: '2024-01-01',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      },
    ];

    render(<ConsentManager consents={expiringConsents} onUpdate={vi.fn()} />);
    expect(screen.getByText(/Expires soon/i)).toBeInTheDocument();
  });

  it('should handle empty consents', () => {
    render(<ConsentManager consents={[]} onUpdate={vi.fn()} />);
    expect(screen.getByText('No consents configured')).toBeInTheDocument();
  });
});