/**
 * Header/Navigation Component Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from '../../components/Header';
import * as featureFlagsApi from '../../api/featureFlags';

vi.mock('../../api/featureFlags', () => ({
  getPublicFeatureFlag: vi.fn(),
  getFeatureFlag: vi.fn(),
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

const renderWithRouter = (component: React.ReactElement) => {
  return render(component, { wrapper: createWrapper() });
};

describe('Header Component', () => {
  beforeEach(() => {
    vi.mocked(featureFlagsApi.getPublicFeatureFlag).mockImplementation((flagName: string) =>
      Promise.resolve({ data: { enabled: true } })
    );
  });

  it('should render header with navigation', () => {
    renderWithRouter(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should display logo/home link', () => {
    renderWithRouter(<Header />);
    const homeLink = screen.getByRole('link', { name: /home|logo/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should display login link when not authenticated', () => {
    renderWithRouter(<Header isAuthenticated={false} />);
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
  });

  it('should display register link when not authenticated and registration flag enabled', async () => {
    renderWithRouter(<Header isAuthenticated={false} />);
    const registerLink = await screen.findByRole('link', { name: /register|sign up/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should not display register link when registration flag is disabled', async () => {
    vi.mocked(featureFlagsApi.getPublicFeatureFlag).mockImplementation((flagName: string) =>
      Promise.resolve({ data: { enabled: flagName !== 'registration' } })
    );
    renderWithRouter(<Header isAuthenticated={false} />);
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByRole('link', { name: /register|sign up/i })).not.toBeInTheDocument();
  });

  it('should display forgot password link when not authenticated and password_reset flag enabled', async () => {
    vi.mocked(featureFlagsApi.getPublicFeatureFlag).mockResolvedValue({
      data: { enabled: true },
    });
    renderWithRouter(<Header isAuthenticated={false} />);
    await screen.findByRole('link', { name: /forgot password/i });
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
  });

  it('should not display forgot password link when password_reset flag is disabled', async () => {
    vi.mocked(featureFlagsApi.getPublicFeatureFlag).mockResolvedValue({
      data: { enabled: false },
    });
    renderWithRouter(<Header isAuthenticated={false} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('link', { name: /forgot password/i })).not.toBeInTheDocument();
  });

  it('should display dashboard link when authenticated', () => {
    renderWithRouter(<Header isAuthenticated={true} userEmail="test@example.com" />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
  });

  it('should display profile link when authenticated', () => {
    renderWithRouter(<Header isAuthenticated={true} userEmail="test@example.com" />);
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile');
  });

  it('should display logout button when authenticated', () => {
    const onLogout = vi.fn();
    renderWithRouter(<Header isAuthenticated={true} userEmail="test@example.com" onLogout={onLogout} />);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should call onLogout when logout button is clicked', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderWithRouter(<Header isAuthenticated={true} userEmail="test@example.com" onLogout={onLogout} />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);
    
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('should display user email when authenticated', () => {
    renderWithRouter(<Header isAuthenticated={true} userEmail="test@example.com" />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});

