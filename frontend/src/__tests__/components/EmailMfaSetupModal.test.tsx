/**
 * EmailMfaSetupModal Component Tests (TDD)
 * Fix #6: When email service is not configured (e.g. Resend sandbox), show clear message.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmailMfaSetupModal } from '../../components/EmailMfaSetupModal';
import * as useMfaHooks from '../../hooks/useMfa';

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('../../hooks/useMfa');

describe('EmailMfaSetupModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows email not configured message when setup fails with configure/email error (Fix #6)', () => {
    vi.mocked(useMfaHooks.useSetupEmailMfa).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: true,
      error: {
        response: {
          data: { error: 'Email service is not configured' },
        },
      },
    } as any);

    vi.mocked(useMfaHooks.useSendEmailOtp).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useMfaHooks.useEnableMfa).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<EmailMfaSetupModal open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText(/email service is not configured/i)).toBeInTheDocument();
    expect(screen.getByText(/contact your administrator or use totp mfa/i)).toBeInTheDocument();
  });
});
