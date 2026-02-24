/**
 * OAuth Buttons Component Tests (TDD)
 * 
 * Tests for OAuth buttons component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OAuthButtons } from '../../components/OAuthButtons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { initiateOAuth } from '../../utils/oauth';
import * as featureFlagsApi from '../../api/featureFlags';
import * as React from 'react';

vi.mock('../../api/featureFlags', () => ({
  getFeatureFlag: vi.fn(),
  getPublicFeatureFlag: vi.fn().mockResolvedValue({ data: { enabled: true } }),
}));

// Mock dependencies
vi.mock('../../contexts/AuthContext');
vi.mock('../../hooks/use-toast');
vi.mock('../../utils/oauth');
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(['featureFlag', 'public', 'google_oauth'], { data: { enabled: true } });
  queryClient.setQueryData(['featureFlag', 'public', 'github_oauth'], { data: { enabled: true } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('OAuthButtons Component', () => {
  const mockSetUser = vi.fn();
  const mockRefreshUser = vi.fn();
  const mockToast = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: mockSetUser,
      refreshUser: mockRefreshUser,
    } as any);
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    } as any);
    vi.mocked(initiateOAuth).mockImplementation(() => {
      // Mock redirect (doesn't actually redirect in tests)
    });
  });

  it('should not render OAuth section when both google_oauth and github_oauth flags are disabled', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['featureFlag', 'public', 'google_oauth'], { data: { enabled: false } });
    queryClient.setQueryData(['featureFlag', 'public', 'github_oauth'], { data: { enabled: false } });

    render(
      <QueryClientProvider client={queryClient}>
        <OAuthButtons />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/or continue with/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/github/i)).not.toBeInTheDocument();
    });
  });

  it('should not render Google button when google_oauth flag is disabled', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['featureFlag', 'public', 'google_oauth'], { data: { enabled: false } });
    queryClient.setQueryData(['featureFlag', 'public', 'github_oauth'], { data: { enabled: true } });

    render(
      <QueryClientProvider client={queryClient}>
        <OAuthButtons />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
      expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
      expect(screen.getByText(/github/i)).toBeInTheDocument();
    });
  });

  it('should not render GitHub button when github_oauth flag is disabled', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['featureFlag', 'public', 'google_oauth'], { data: { enabled: true } });
    queryClient.setQueryData(['featureFlag', 'public', 'github_oauth'], { data: { enabled: false } });

    render(
      <QueryClientProvider client={queryClient}>
        <OAuthButtons />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
      expect(screen.getByText(/google/i)).toBeInTheDocument();
      expect(screen.queryByText(/github/i)).not.toBeInTheDocument();
    });
  });

  it('should render OAuth buttons', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-id');
    vi.stubEnv('VITE_GITHUB_CLIENT_ID', 'test-github-id');
    // Note: Microsoft OAuth is commented out in component (coming soon)

    render(<OAuthButtons />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/google/i)).toBeInTheDocument();
    expect(screen.getByText(/github/i)).toBeInTheDocument();
    // Microsoft button is not rendered (commented out in component)
  });

  it('should call initiateOAuth when Google button is clicked', async () => {
    const user = userEvent.setup();
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-id');

    render(<OAuthButtons />, { wrapper: createWrapper() });

    const googleButton = screen.getByText(/google/i).closest('button');
    expect(googleButton).toBeInTheDocument();

    await user.click(googleButton!);

    expect(initiateOAuth).toHaveBeenCalledWith('google');
  });

  it('should call initiateOAuth when GitHub button is clicked', async () => {
    const user = userEvent.setup();
    vi.stubEnv('VITE_GITHUB_CLIENT_ID', 'test-github-id');

    render(<OAuthButtons />, { wrapper: createWrapper() });

    const githubButton = screen.getByText(/github/i).closest('button');
    expect(githubButton).toBeInTheDocument();

    await user.click(githubButton!);

    expect(initiateOAuth).toHaveBeenCalledWith('github');
  });

  // Note: Microsoft OAuth button is commented out in component (coming soon)
  // This test is skipped until Microsoft OAuth is implemented
  it.skip('should call initiateOAuth when Microsoft button is clicked', async () => {
    const user = userEvent.setup();
    vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', 'test-microsoft-id');

    render(<OAuthButtons />, { wrapper: createWrapper() });

    const microsoftButton = screen.getByText(/microsoft/i).closest('button');
    expect(microsoftButton).toBeInTheDocument();

    await user.click(microsoftButton!);

    expect(initiateOAuth).toHaveBeenCalledWith('microsoft');
  });

  it('should show error toast if OAuth is not configured', async () => {
    const user = userEvent.setup();
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');

    render(<OAuthButtons />, { wrapper: createWrapper() });

    const googleButton = screen.getByText(/google/i).closest('button');
    await user.click(googleButton!);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'OAuth Not Configured',
          variant: 'error',
        })
      );
    });
  });

  it('should show loading state when OAuth is initiated', async () => {
    const user = userEvent.setup();
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-id');

    // Mock initiateOAuth to not redirect immediately
    vi.mocked(initiateOAuth).mockImplementation(() => {
      // Simulate async operation
      return new Promise(() => {});
    });

    render(<OAuthButtons />, { wrapper: createWrapper() });

    const googleButton = screen.getByText(/google/i).closest('button');
    await user.click(googleButton!);

    // Button should be disabled during loading
    await waitFor(() => {
      expect(googleButton).toBeDisabled();
    });
  });

  it('should disable all buttons when one is loading', async () => {
    const user = userEvent.setup();
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-id');
    vi.stubEnv('VITE_GITHUB_CLIENT_ID', 'test-github-id');

    // Mock initiateOAuth to not redirect immediately
    vi.mocked(initiateOAuth).mockImplementation(() => {
      return new Promise(() => {});
    });

    render(<OAuthButtons />, { wrapper: createWrapper() });

    const googleButton = screen.getByText(/google/i).closest('button');
    const githubButton = screen.getByText(/github/i).closest('button');

    await user.click(googleButton!);

    // All buttons should be disabled
    await waitFor(() => {
      expect(googleButton).toBeDisabled();
      expect(githubButton).toBeDisabled();
    });
  });
});
