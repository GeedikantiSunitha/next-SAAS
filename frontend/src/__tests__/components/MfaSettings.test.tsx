/**
 * MFA Settings Component Tests (TDD)
 * 
 * Comprehensive tests for MFA settings UI component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { MfaSettings } from '../../components/MfaSettings';
import * as useMfaHooks from '../../hooks/useMfa';

// Mock toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock hooks
vi.mock('../../hooks/useMfa');
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('MfaSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render MFA settings section', () => {
    vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useMfaHooks.useDisableMfa).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useMfaHooks.useSetupTotp).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    } as any);

    vi.mocked(useMfaHooks.useGenerateBackupCodes).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      data: undefined,
    } as any);

    render(<MfaSettings />, { wrapper: createWrapper() });

    expect(screen.getByText(/multi-factor authentication/i)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<MfaSettings />, { wrapper: createWrapper() });

    // Should show skeleton or loading indicator
    expect(screen.queryByText(/multi-factor authentication/i)).toBeInTheDocument();
  });

  it('should display TOTP setup button when TOTP not enabled', () => {
    vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useMfaHooks.useDisableMfa).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useMfaHooks.useSetupTotp).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    } as any);

    vi.mocked(useMfaHooks.useGenerateBackupCodes).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      data: undefined,
    } as any);

    render(<MfaSettings />, { wrapper: createWrapper() });

    expect(screen.getByText(/setup totp/i)).toBeInTheDocument();
  });

  it('should display TOTP enabled status when TOTP is enabled', () => {
    vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
      data: [
        {
          id: '1',
          method: 'TOTP',
          isEnabled: true,
          isPrimary: true,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useMfaHooks.useDisableMfa).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useMfaHooks.useSetupTotp).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    } as any);

    vi.mocked(useMfaHooks.useGenerateBackupCodes).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      data: undefined,
    } as any);

    render(<MfaSettings />, { wrapper: createWrapper() });

    // Check for enabled status and disable button
    const enabledText = screen.getAllByText(/enabled/i);
    expect(enabledText.length).toBeGreaterThan(0);
    const disableButtons = screen.getAllByRole('button', { name: /disable/i });
    expect(disableButtons.length).toBeGreaterThan(0);
  });

  it('should display Email MFA setup button when Email MFA not enabled', () => {
    vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useMfaHooks.useSetupEmailMfa).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    } as any);

    render(<MfaSettings />, { wrapper: createWrapper() });

    expect(screen.getByText(/setup email mfa/i)).toBeInTheDocument();
  });

  it('should display Email MFA enabled status when Email MFA is enabled', () => {
    vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
      data: [
        {
          id: '2',
          method: 'EMAIL',
          isEnabled: true,
          isPrimary: false,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useMfaHooks.useDisableMfa).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useMfaHooks.useSetupEmailMfa).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    } as any);

    vi.mocked(useMfaHooks.useGenerateBackupCodes).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      data: undefined,
    } as any);

    render(<MfaSettings />, { wrapper: createWrapper() });

    // Check for enabled status
    const enabledText = screen.getAllByText(/enabled/i);
    expect(enabledText.length).toBeGreaterThan(0);
  });

  it('should open TOTP setup modal when setup button is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useMfaHooks.useSetupTotp).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    } as any);

    render(<MfaSettings />, { wrapper: createWrapper() });

    const setupButton = screen.getByText(/setup totp/i);
    await user.click(setupButton);

    // Should show TOTP setup modal
    expect(screen.getByText(/setup authenticator app/i)).toBeInTheDocument();
  });

  it('should open confirmation dialog when disable button is clicked', async () => {
    const user = userEvent.setup();
    const mockDisableMfa = vi.fn();

    vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
      data: [
        {
          id: '1',
          method: 'TOTP',
          isEnabled: true,
          isPrimary: true,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useMfaHooks.useDisableMfa).mockReturnValue({
      mutate: mockDisableMfa,
      isPending: false,
    } as any);

    vi.mocked(useMfaHooks.useSetupTotp).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    } as any);

    vi.mocked(useMfaHooks.useGenerateBackupCodes).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      data: undefined,
    } as any);

    render(<MfaSettings />, { wrapper: createWrapper() });

    // Find disable button
    const disableButtons = screen.getAllByRole('button', { name: /disable/i });
    const disableButton = disableButtons[0];
    
    await user.click(disableButton);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
    
    // Find and click confirm button in dialog
    const dialog = screen.getByRole('dialog');
    const dialogButtons = dialog.querySelectorAll('button');
    // The last button should be the confirm button
    const confirmButton = dialogButtons[dialogButtons.length - 1];
    
    await user.click(confirmButton);
    
    // The mutation is called with (method, options), so check first argument
    await waitFor(() => {
      expect(mockDisableMfa).toHaveBeenCalled();
      expect(mockDisableMfa.mock.calls[0][0]).toBe('TOTP');
    });
  });

  it('should display error message when API fails', () => {
    vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load MFA methods'),
    } as any);

    render(<MfaSettings />, { wrapper: createWrapper() });

    expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
  });
});
