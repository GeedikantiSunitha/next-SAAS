/**
 * OAuth Buttons Component Tests (TDD)
 * 
 * Tests for OAuth buttons component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OAuthButtons } from '../../components/OAuthButtons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { initiateOAuth } from '../../utils/oauth';
import * as React from 'react';

// Mock dependencies
vi.mock('../../contexts/AuthContext');
vi.mock('../../hooks/use-toast');
vi.mock('../../utils/oauth');
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => <>{children}</>;
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

  it('should render OAuth buttons', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-id');
    vi.stubEnv('VITE_GITHUB_CLIENT_ID', 'test-github-id');
    // Note: Microsoft OAuth is commented out in component (coming soon)

    render(<OAuthButtons />, { wrapper: createWrapper() });

    expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
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
