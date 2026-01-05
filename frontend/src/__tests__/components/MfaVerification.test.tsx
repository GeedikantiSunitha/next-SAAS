/**
 * MFA Verification Component Tests (TDD)
 * 
 * Tests for MFA verification step during login
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { MfaVerification } from '../../components/MfaVerification';
import { mfaApi } from '../../api/mfa';

// Mock the MFA API
vi.mock('../../api/mfa');
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

describe('MfaVerification Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render MFA verification form', () => {
    render(
      <MfaVerification
        method="TOTP"
        onVerify={vi.fn()}
        onCancel={vi.fn()}
        isLoading={false}
      />,
      { wrapper: createWrapper() }
    );

    // Check for label text using getByLabelText (more specific)
    const input = screen.getByLabelText(/^enter verification code$/i);
    expect(input).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/000000/i)).toBeInTheDocument();
  });

  it('should render TOTP method correctly', () => {
    render(
      <MfaVerification
        method="TOTP"
        onVerify={vi.fn()}
        onCancel={vi.fn()}
        isLoading={false}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/authenticator app/i)).toBeInTheDocument();
  });

  it('should render Email method correctly', () => {
    render(
      <MfaVerification
        method="EMAIL"
        onVerify={vi.fn()}
        onCancel={vi.fn()}
        isLoading={false}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/email/i)).toBeInTheDocument();
  });

  it('should call onVerify with code when form is submitted', async () => {
    const user = userEvent.setup();
    const onVerify = vi.fn();

    render(
      <MfaVerification
        method="TOTP"
        onVerify={onVerify}
        onCancel={vi.fn()}
        isLoading={false}
      />,
      { wrapper: createWrapper() }
    );

    const codeInput = screen.getByPlaceholderText(/000000/i);
    await user.type(codeInput, '123456');

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(onVerify).toHaveBeenCalledWith('123456', false);
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <MfaVerification
        method="TOTP"
        onVerify={vi.fn()}
        onCancel={onCancel}
        isLoading={false}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('should show loading state when verifying', () => {
    render(
      <MfaVerification
        method="TOTP"
        onVerify={vi.fn()}
        onCancel={vi.fn()}
        isLoading={true}
      />,
      { wrapper: createWrapper() }
    );

    const verifyButton = screen.getByRole('button', { name: /verifying/i });
    expect(verifyButton).toBeDisabled();
  });

  it('should show option to use backup code', () => {
    render(
      <MfaVerification
        method="TOTP"
        onVerify={vi.fn()}
        onCancel={vi.fn()}
        isLoading={false}
        showBackupCodeOption={true}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/use backup code/i)).toBeInTheDocument();
  });

  it('should switch to backup code input when backup code option is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MfaVerification
        method="TOTP"
        onVerify={vi.fn()}
        onCancel={vi.fn()}
        isLoading={false}
        showBackupCodeOption={true}
      />,
      { wrapper: createWrapper() }
    );

    const backupCodeLink = screen.getByText(/use backup code/i);
    await user.click(backupCodeLink);

    expect(screen.getByText(/enter backup code/i)).toBeInTheDocument();
  });

  it('should validate code length (6 digits)', async () => {
    const user = userEvent.setup();
    const onVerify = vi.fn();

    render(
      <MfaVerification
        method="TOTP"
        onVerify={onVerify}
        onCancel={vi.fn()}
        isLoading={false}
      />,
      { wrapper: createWrapper() }
    );

    const codeInput = screen.getByPlaceholderText(/000000/i);
    await user.type(codeInput, '12345'); // Only 5 digits

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    expect(verifyButton).toBeDisabled();

    await user.type(codeInput, '6'); // Now 6 digits
    expect(verifyButton).not.toBeDisabled();
  });
});
