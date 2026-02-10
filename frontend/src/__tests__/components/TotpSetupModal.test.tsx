/**
 * TotpSetupModal Component Tests (TDD)
 * Fix #5: Copy Backup Codes must copy codes from setup data, not empty state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TotpSetupModal } from '../../components/TotpSetupModal';
import * as useMfaHooks from '../../hooks/useMfa';

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('../../hooks/useMfa');

const mockBackupCodes = ['12345678', '87654321', '11223344'];

describe('TotpSetupModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('copies backup codes from setup data to clipboard when Copy Backup Codes is clicked', async () => {
    vi.mocked(useMfaHooks.useSetupTotp).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: true,
      isError: false,
      data: {
        data: {
          backupCodes: mockBackupCodes,
          qrCodeUrl: 'https://example.com/qr',
          secret: 'JBSWY3DPEHPK3PXP',
        },
      },
    } as any);

    vi.mocked(useMfaHooks.useEnableMfa).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const onOpenChange = vi.fn();
    render(<TotpSetupModal open={true} onOpenChange={onOpenChange} />);

    const copyButton = screen.getByRole('button', { name: /copy backup codes/i });
    await userEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockBackupCodes.join('\n'));
  });

  it('has scrollable content area when setup succeeds so verification input is reachable', () => {
    vi.mocked(useMfaHooks.useSetupTotp).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: true,
      isError: false,
      data: {
        data: {
          backupCodes: mockBackupCodes,
          qrCodeUrl: 'https://example.com/qr',
          secret: 'JBSWY3DPEHPK3PXP',
        },
      },
    } as any);

    vi.mocked(useMfaHooks.useEnableMfa).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<TotpSetupModal open={true} onOpenChange={vi.fn()} />);

    const contentArea = document.querySelector('[data-totp-modal-content]');
    expect(contentArea).toBeInTheDocument();
    expect(contentArea).toHaveClass('overflow-y-auto');
  });
});
