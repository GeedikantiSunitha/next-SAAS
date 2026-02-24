/**
 * Profile ConnectedAccounts Component Tests (TDD)
 *
 * Tests that OAuth provider rows are hidden when their feature flags are disabled.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectedAccounts } from '../../components/ConnectedAccounts';
import * as useOAuth from '../../hooks/useOAuth';
import * as React from 'react';

vi.mock('../../hooks/useOAuth');
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('../../utils/oauth', () => ({
  initiateOAuth: vi.fn(),
}));

const createWrapper = (googleEnabled: boolean, githubEnabled: boolean) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(['featureFlag', 'google_oauth'], { data: { enabled: googleEnabled } });
  queryClient.setQueryData(['featureFlag', 'github_oauth'], { data: { enabled: githubEnabled } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ConnectedAccounts (Profile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOAuth.useOAuthMethods).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(useOAuth.useLinkOAuth).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
    vi.mocked(useOAuth.useUnlinkOAuth).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it('should show both Google and GitHub rows when both flags are enabled', async () => {
    render(<ConnectedAccounts />, {
      wrapper: createWrapper(true, true),
    });

    await waitFor(() => {
      expect(screen.getByText('Connected Accounts')).toBeInTheDocument();
    });
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /link account/i })).toHaveLength(2);
  });

  it('should not show Google row when google_oauth flag is disabled', async () => {
    render(<ConnectedAccounts />, {
      wrapper: createWrapper(false, true),
    });

    await waitFor(() => {
      expect(screen.getByText('Connected Accounts')).toBeInTheDocument();
    });
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /link account/i })).toHaveLength(1);
  });

  it('should not show GitHub row when github_oauth flag is disabled', async () => {
    render(<ConnectedAccounts />, {
      wrapper: createWrapper(true, false),
    });

    await waitFor(() => {
      expect(screen.getByText('Connected Accounts')).toBeInTheDocument();
    });
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /link account/i })).toHaveLength(1);
  });

  it('should show only the card header when both OAuth flags are disabled', async () => {
    render(<ConnectedAccounts />, {
      wrapper: createWrapper(false, false),
    });

    await waitFor(() => {
      expect(screen.getByText('Connected Accounts')).toBeInTheDocument();
    });
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /link account/i })).not.toBeInTheDocument();
  });
});
