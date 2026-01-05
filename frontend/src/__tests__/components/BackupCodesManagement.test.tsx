/**
 * Backup Codes Management Component Tests (TDD)
 * 
 * Tests for backup codes management UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { BackupCodesManagement } from '../../components/BackupCodesManagement';
import * as useMfaHooks from '../../hooks/useMfa';

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

describe('BackupCodesManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render backup codes section', () => {
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

    vi.mocked(useMfaHooks.useGenerateBackupCodes).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      data: undefined,
    } as any);

    render(<BackupCodesManagement />, { wrapper: createWrapper() });

    // Check for title specifically (not description)
    expect(screen.getByRole('heading', { name: /backup codes/i })).toBeInTheDocument();
  });

  it('should show generate button when no codes displayed', () => {
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

    vi.mocked(useMfaHooks.useGenerateBackupCodes).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      data: undefined,
    } as any);

    render(<BackupCodesManagement />, { wrapper: createWrapper() });

    // Find button specifically, not description text
    const generateButton = screen.getByRole('button', { name: /generate backup codes/i });
    expect(generateButton).toBeInTheDocument();
  });

  it('should call generateBackupCodes when generate button is clicked', async () => {
    const user = userEvent.setup();
    const mockGenerate = vi.fn();

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

    vi.mocked(useMfaHooks.useGenerateBackupCodes).mockReturnValue({
      mutate: mockGenerate,
      isPending: false,
      isSuccess: false,
      data: undefined,
    } as any);

    render(<BackupCodesManagement />, { wrapper: createWrapper() });

    const generateButton = screen.getByRole('button', { name: /generate backup codes/i });
    await user.click(generateButton);

    expect(mockGenerate).toHaveBeenCalled();
  });

  it('should display generated backup codes', () => {
    const mockCodes = ['12345678', '87654321', '11223344'];

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

    vi.mocked(useMfaHooks.useGenerateBackupCodes).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: true,
      data: {
        success: true,
        data: {
          codes: mockCodes,
        },
      },
    } as any);

    render(<BackupCodesManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText('87654321')).toBeInTheDocument();
    expect(screen.getByText('11223344')).toBeInTheDocument();
  });

  it('should show copy button for backup codes', () => {
    const mockCodes = ['12345678', '87654321'];

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

    vi.mocked(useMfaHooks.useGenerateBackupCodes).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: true,
      data: {
        success: true,
        data: {
          codes: mockCodes,
        },
      },
    } as any);

    render(<BackupCodesManagement />, { wrapper: createWrapper() });

    expect(screen.getByText(/copy codes/i)).toBeInTheDocument();
  });

  it('should show warning about saving codes securely', () => {
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

    render(<BackupCodesManagement />, { wrapper: createWrapper() });

    expect(screen.getByText(/save these codes/i)).toBeInTheDocument();
  });

  it('should not show backup codes section when MFA is not enabled', () => {
    vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<BackupCodesManagement />, { wrapper: createWrapper() });

    expect(screen.queryByText(/backup codes/i)).not.toBeInTheDocument();
  });
});
