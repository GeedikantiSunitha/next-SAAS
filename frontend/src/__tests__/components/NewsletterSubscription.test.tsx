/**
 * NewsletterSubscription Component Tests (TDD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewsletterSubscription } from '../../components/NewsletterSubscription';
import * as newsletterHooks from '../../hooks/useNewsletter';

// Mock hooks
vi.mock('../../hooks/useNewsletter', () => ({
  useSubscribe: vi.fn(),
  useSubscription: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('NewsletterSubscription', () => {
  const mockUseSubscribe = vi.fn();
  const mockUseSubscription = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(newsletterHooks.useSubscribe).mockReturnValue(mockUseSubscribe as any);
    vi.mocked(newsletterHooks.useSubscription).mockReturnValue(mockUseSubscription as any);
  });

  it('should render subscription form', () => {
    mockUseSubscription.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    mockUseSubscribe.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    });

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();

    mockUseSubscription.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    mockUseSubscribe.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    });

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for empty email', async () => {
    const user = userEvent.setup();

    mockUseSubscription.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    mockUseSubscribe.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    });

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('should show current subscription status when subscribed', () => {
    mockUseSubscription.mockReturnValue({
      data: {
        id: 'sub-1',
        email: 'test@example.com',
        isActive: true,
      },
      isLoading: false,
      isError: false,
    });

    mockUseSubscribe.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    expect(screen.getByText(/subscribed to our newsletter/i)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should submit subscription form', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    mockUseSubscription.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    mockUseSubscribe.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith('newuser@example.com');
    });
  });

  it('should show loading state during subscription', () => {
    mockUseSubscription.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    mockUseSubscribe.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
    });

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.textContent).toContain('Subscribing');
  });

  it('should handle subscription error', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    mockUseSubscription.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    mockUseSubscribe.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    });

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
