/**
 * Consent Management Component Tests (TDD)
 * 
 * Tests for GDPR consent management UI component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { ConsentManagement } from '../../components/ConsentManagement';
import * as useGdprHooks from '../../hooks/useGdpr';
import { ConsentType } from '../../api/gdpr';

// Mock toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock hooks
vi.mock('../../hooks/useGdpr');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return Wrapper;
};

const mockConsents = [
  {
    id: '1',
    userId: 'user1',
    consentType: 'MARKETING_EMAILS' as ConsentType,
    granted: true,
    grantedAt: '2025-01-05T00:00:00Z',
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user1',
    consentType: 'ANALYTICS' as ConsentType,
    granted: false,
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
  },
];

describe('ConsentManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render consent management section', () => {
    vi.mocked(useGdprHooks.useConsents).mockReturnValue({
      data: mockConsents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useGrantConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useGdprHooks.useRevokeConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<ConsentManagement />, { wrapper: createWrapper() });

    expect(screen.getByText(/consent management/i)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.mocked(useGdprHooks.useConsents).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<ConsentManagement />, { wrapper: createWrapper() });

    expect(screen.getByTestId('consents-loading')).toBeInTheDocument();
  });

  it('should display error state', () => {
    vi.mocked(useGdprHooks.useConsents).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load consents'),
    } as any);

    render(<ConsentManagement />, { wrapper: createWrapper() });

    expect(screen.getByText(/error loading consents/i)).toBeInTheDocument();
  });

  it('should display all consent types', () => {
    vi.mocked(useGdprHooks.useConsents).mockReturnValue({
      data: mockConsents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useGrantConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useGdprHooks.useRevokeConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<ConsentManagement />, { wrapper: createWrapper() });

    // Use more specific queries - check for labels
    expect(screen.getByLabelText(/marketing emails/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/analytics/i)).toBeInTheDocument();
  });

  it('should show granted status for granted consents', () => {
    vi.mocked(useGdprHooks.useConsents).mockReturnValue({
      data: mockConsents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useGrantConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useGdprHooks.useRevokeConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<ConsentManagement />, { wrapper: createWrapper() });

    // Marketing emails should be granted
    const marketingToggle = screen.getByLabelText(/marketing emails/i);
    expect(marketingToggle).toBeChecked();
  });

  it('should show revoked status for non-granted consents', () => {
    vi.mocked(useGdprHooks.useConsents).mockReturnValue({
      data: mockConsents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useGrantConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useGdprHooks.useRevokeConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<ConsentManagement />, { wrapper: createWrapper() });

    // Analytics should not be granted
    const analyticsToggle = screen.getByLabelText(/analytics/i);
    expect(analyticsToggle).not.toBeChecked();
  });

  it('should grant consent when toggle is clicked', async () => {
    const user = userEvent.setup();
    const mockGrantConsent = vi.fn();

    vi.mocked(useGdprHooks.useConsents).mockReturnValue({
      data: mockConsents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useGrantConsent).mockReturnValue({
      mutate: mockGrantConsent,
      isPending: false,
    } as any);

    vi.mocked(useGdprHooks.useRevokeConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<ConsentManagement />, { wrapper: createWrapper() });

    // Click analytics toggle (currently not granted)
    const analyticsToggle = screen.getByLabelText(/analytics/i);
    await user.click(analyticsToggle);

    expect(mockGrantConsent).toHaveBeenCalledWith('ANALYTICS');
  });

  it('should revoke consent when toggle is clicked', async () => {
    const user = userEvent.setup();
    const mockRevokeConsent = vi.fn();

    vi.mocked(useGdprHooks.useConsents).mockReturnValue({
      data: mockConsents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useGrantConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useGdprHooks.useRevokeConsent).mockReturnValue({
      mutate: mockRevokeConsent,
      isPending: false,
    } as any);

    render(<ConsentManagement />, { wrapper: createWrapper() });

    // Click marketing emails toggle (currently granted)
    const marketingToggle = screen.getByLabelText(/marketing emails/i);
    await user.click(marketingToggle);

    expect(mockRevokeConsent).toHaveBeenCalledWith('MARKETING_EMAILS');
  });

  it('should disable toggles when mutation is pending', () => {
    vi.mocked(useGdprHooks.useConsents).mockReturnValue({
      data: mockConsents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useGrantConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    vi.mocked(useGdprHooks.useRevokeConsent).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<ConsentManagement />, { wrapper: createWrapper() });

    const analyticsToggle = screen.getByLabelText(/analytics/i);
    expect(analyticsToggle).toBeDisabled();
  });
});
