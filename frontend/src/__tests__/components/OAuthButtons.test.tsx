import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OAuthButtons } from '../../components/OAuthButtons';
import { AuthProvider } from '../../contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useToast } from '../../hooks/use-toast';

// Mock toast
vi.mock('../../hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderOAuthButtons = (props = {}) => {
  const mockToast = vi.fn();
  (useToast as any).mockReturnValue({ toast: mockToast });

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <OAuthButtons {...props} />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    ),
    mockToast,
  };
};

describe('OAuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render OAuth buttons', () => {
    renderOAuthButtons();

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
    expect(screen.getByText(/Or continue with/i)).toBeInTheDocument();
  });

  it('should render with login mode', () => {
    renderOAuthButtons({ mode: 'login' });
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
  });

  it('should render with register mode', () => {
    renderOAuthButtons({ mode: 'register' });
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
  });

  it('should have clickable buttons', () => {
    renderOAuthButtons();

    const googleButton = screen.getByText('Google').closest('button');
    const githubButton = screen.getByText('GitHub').closest('button');
    const microsoftButton = screen.getByText('Microsoft').closest('button');

    expect(googleButton).toBeInTheDocument();
    expect(githubButton).toBeInTheDocument();
    expect(microsoftButton).toBeInTheDocument();
    expect(googleButton).not.toBeDisabled();
    expect(githubButton).not.toBeDisabled();
    expect(microsoftButton).not.toBeDisabled();
  });
});
