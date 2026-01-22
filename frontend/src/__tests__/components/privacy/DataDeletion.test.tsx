/**
 * Tests for DataDeletion Component
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DataDeletion from '../../../components/privacy/DataDeletion';
import { privacyApi } from '../../../api/privacy';
import { vi } from 'vitest';

// Mock the API
vi.mock('../../../api/privacy', () => ({
  privacyApi: {
    requestAccountDeletion: vi.fn(),
  },
}));

describe('DataDeletion Component', () => {
  const mockDeletions = [
    {
      id: 'deletion-1',
      status: 'PENDING',
      requestedAt: '2024-01-01T10:00:00Z',
      scheduledFor: '2024-01-31T10:00:00Z',
    },
    {
      id: 'deletion-2',
      status: 'CANCELLED',
      requestedAt: '2023-12-15T14:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render section title', () => {
    render(<DataDeletion deletions={mockDeletions} onUpdate={vi.fn()} />);
    expect(screen.getByText('Data Deletion')).toBeInTheDocument();
  });

  it('should display warning message', () => {
    render(<DataDeletion deletions={mockDeletions} onUpdate={vi.fn()} />);
    expect(screen.getByText(/This action is irreversible/i)).toBeInTheDocument();
  });

  it('should display deletion request button', () => {
    render(<DataDeletion deletions={mockDeletions} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Request Account Deletion/i })).toBeInTheDocument();
  });

  it('should show deletion history', () => {
    render(<DataDeletion deletions={mockDeletions} onUpdate={vi.fn()} />);

    expect(screen.getByText(/Deletion Request #deletion-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Deletion Request #deletion-2/i)).toBeInTheDocument();
  });

  it('should display deletion status', () => {
    render(<DataDeletion deletions={mockDeletions} onUpdate={vi.fn()} />);

    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });

  it('should show scheduled deletion date', () => {
    render(<DataDeletion deletions={mockDeletions} onUpdate={vi.fn()} />);
    expect(screen.getByText(/Scheduled for:.*Jan 31, 2024/)).toBeInTheDocument();
  });

  it('should calculate days until deletion', () => {
    const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const deletions = [{
      id: 'deletion-1',
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      scheduledFor: futureDate,
    }];

    render(<DataDeletion deletions={deletions} onUpdate={vi.fn()} />);
    expect(screen.getByText(/15 days remaining/i)).toBeInTheDocument();
  });

  it('should show strong confirmation dialog', () => {
    // Use deletions without PENDING status so button is not disabled
    const completedDeletions = [
      {
        id: 'deletion-2',
        status: 'CANCELLED',
        requestedAt: '2023-12-15T14:00:00Z',
      },
    ];
    render(<DataDeletion deletions={completedDeletions} onUpdate={vi.fn()} />);

    const requestButton = screen.getByRole('button', { name: /Request Account Deletion/i });
    fireEvent.click(requestButton);

    // No need for waitFor as state change is synchronous
    expect(screen.getByText(/Are you absolutely sure/i)).toBeInTheDocument();
    expect(screen.getByText(/This will permanently delete/i)).toBeInTheDocument();
    expect(screen.getByText(/Type "DELETE" to confirm/i)).toBeInTheDocument();

    const confirmInput = screen.getByPlaceholderText(/Type DELETE/i);
    expect(confirmInput).toBeInTheDocument();
  });

  it('should require typing DELETE to confirm', () => {
    const noPendingDeletions = [
      {
        id: 'deletion-2',
        status: 'CANCELLED',
        requestedAt: '2023-12-15T14:00:00Z',
      },
    ];
    render(<DataDeletion deletions={noPendingDeletions} onUpdate={vi.fn()} />);

    const requestButton = screen.getByRole('button', { name: /Request Account Deletion/i });
    fireEvent.click(requestButton);

    const confirmButton = screen.getByRole('button', { name: /Confirm Deletion/i });
    expect(confirmButton).toBeDisabled();

    const confirmInput = screen.getByPlaceholderText(/Type DELETE/i);
    fireEvent.change(confirmInput, { target: { value: 'DELETE' } });

    expect(confirmButton).not.toBeDisabled();
  });

  it('should handle deletion request', async () => {
    const mockUpdate = vi.fn();
    (privacyApi.requestAccountDeletion as any).mockResolvedValue({
      id: 'deletion-3',
      message: 'Deletion scheduled',
    });

    const noPendingDeletions = [];
    render(<DataDeletion deletions={noPendingDeletions} onUpdate={mockUpdate} />);

    const requestButton = screen.getByRole('button', { name: /Request Account Deletion/i });
    fireEvent.click(requestButton);

    const confirmInput = screen.getByPlaceholderText(/Type DELETE/i);
    fireEvent.change(confirmInput, { target: { value: 'DELETE' } });

    const confirmButton = screen.getByRole('button', { name: /Confirm Deletion/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(privacyApi.requestAccountDeletion).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('should allow providing deletion reason', () => {
    const noPendingDeletions = [];
    render(<DataDeletion deletions={noPendingDeletions} onUpdate={vi.fn()} />);

    const requestButton = screen.getByRole('button', { name: /Request Account Deletion/i });
    fireEvent.click(requestButton);

    const reasonInput = screen.getByPlaceholderText(/Optional: Reason for deletion/i);
    expect(reasonInput).toBeInTheDocument();
  });

  it('should handle deletion errors', async () => {
    (privacyApi.requestAccountDeletion as any).mockRejectedValue(new Error('Deletion failed'));

    const noPendingDeletions = [];
    render(<DataDeletion deletions={noPendingDeletions} onUpdate={vi.fn()} />);

    const requestButton = screen.getByRole('button', { name: /Request Account Deletion/i });
    fireEvent.click(requestButton);

    const confirmInput = screen.getByPlaceholderText(/Type DELETE/i);
    fireEvent.change(confirmInput, { target: { value: 'DELETE' } });

    const confirmButton = screen.getByRole('button', { name: /Confirm Deletion/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to request deletion/i)).toBeInTheDocument();
    });
  });

  it('should disable request if pending deletion exists', () => {
    render(<DataDeletion deletions={mockDeletions} onUpdate={vi.fn()} />);

    const requestButton = screen.getByRole('button', { name: /Request Account Deletion/i });
    expect(requestButton).toBeDisabled();
    expect(screen.getByText(/You have a pending deletion request/i)).toBeInTheDocument();
  });

  it('should handle empty deletion history', () => {
    render(<DataDeletion deletions={[]} onUpdate={vi.fn()} />);
    expect(screen.getByText('No deletion requests')).toBeInTheDocument();
  });
});