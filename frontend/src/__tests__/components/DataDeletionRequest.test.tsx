/**
 * Data Deletion Request Component Tests (TDD)
 * 
 * Tests for GDPR data deletion request UI component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { DataDeletionRequest } from '../../components/DataDeletionRequest';
import * as useGdprHooks from '../../hooks/useGdpr';

// Mock toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock hooks
vi.mock('../../hooks/useGdpr');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return Wrapper;
};

const mockDeletionRequests = [
  {
    id: '1',
    userId: 'user1',
    status: 'PENDING' as const,
    deletionType: 'SOFT' as const,
    requestedAt: '2025-01-05T00:00:00Z',
  },
];

describe('DataDeletionRequest Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render data deletion request section', () => {
    vi.mocked(useGdprHooks.useDeletionRequests).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useRequestDeletion).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<DataDeletionRequest />, { wrapper: createWrapper() });

    expect(screen.getByText(/data deletion request/i)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.mocked(useGdprHooks.useDeletionRequests).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<DataDeletionRequest />, { wrapper: createWrapper() });

    expect(screen.getByTestId('deletions-loading')).toBeInTheDocument();
  });

  it('should display error state', () => {
    vi.mocked(useGdprHooks.useDeletionRequests).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load deletion requests'),
    } as any);

    render(<DataDeletionRequest />, { wrapper: createWrapper() });

    expect(screen.getByText(/error loading deletion requests/i)).toBeInTheDocument();
  });

  it('should show deletion form when no pending requests', () => {
    vi.mocked(useGdprHooks.useDeletionRequests).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useRequestDeletion).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<DataDeletionRequest />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/deletion type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request deletion/i })).toBeInTheDocument();
  });

  it('should show pending request status when request exists', () => {
    vi.mocked(useGdprHooks.useDeletionRequests).mockReturnValue({
      data: mockDeletionRequests,
      isLoading: false,
      error: null,
    } as any);

    render(<DataDeletionRequest />, { wrapper: createWrapper() });

    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/check your email to confirm/i)).toBeInTheDocument();
  });

  it('should submit deletion request with form data', async () => {
    const user = userEvent.setup();
    const mockRequestDeletion = vi.fn();

    vi.mocked(useGdprHooks.useDeletionRequests).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useRequestDeletion).mockReturnValue({
      mutate: mockRequestDeletion,
      isPending: false,
    } as any);

    render(<DataDeletionRequest />, { wrapper: createWrapper() });

    // Select deletion type
    const deletionTypeSelect = screen.getByLabelText(/deletion type/i);
    await user.selectOptions(deletionTypeSelect, 'HARD');

    // Enter reason
    const reasonInput = screen.getByLabelText(/reason/i);
    await user.type(reasonInput, 'No longer using the service');

    // Submit - this will show confirmation dialog
    const submitButton = screen.getByRole('button', { name: /request deletion/i });
    await user.click(submitButton);

    // Should show confirmation dialog
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    
    // Confirm in dialog
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    expect(mockRequestDeletion).toHaveBeenCalledWith({
      deletionType: 'HARD',
      reason: 'No longer using the service',
    });
  });

  it('should disable form when mutation is pending', () => {
    vi.mocked(useGdprHooks.useDeletionRequests).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useRequestDeletion).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    render(<DataDeletionRequest />, { wrapper: createWrapper() });

    // Button text changes to "Requesting..." when pending
    const submitButton = screen.getByRole('button', { name: /requesting/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show confirmation dialog before submitting', async () => {
    const user = userEvent.setup();
    const mockRequestDeletion = vi.fn();

    vi.mocked(useGdprHooks.useDeletionRequests).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGdprHooks.useRequestDeletion).mockReturnValue({
      mutate: mockRequestDeletion,
      isPending: false,
    } as any);

    render(<DataDeletionRequest />, { wrapper: createWrapper() });

    // Fill form
    const deletionTypeSelect = screen.getByLabelText(/deletion type/i);
    await user.selectOptions(deletionTypeSelect, 'HARD');

    // Submit
    const submitButton = screen.getByRole('button', { name: /request deletion/i });
    await user.click(submitButton);

    // Should show confirmation dialog
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();

    // Confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    expect(mockRequestDeletion).toHaveBeenCalled();
  });
});
