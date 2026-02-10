/**
 * Tests for DataExport Component
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DataExport from '../../../components/privacy/DataExport';
import { privacyApi } from '../../../api/privacy';
import { vi } from 'vitest';

// Mock the API
vi.mock('../../../api/privacy', () => ({
  privacyApi: {
    requestDataExport: vi.fn(),
  },
}));

describe('DataExport Component', () => {
  const mockExports = [
    {
      id: 'export-1',
      status: 'COMPLETED',
      requestedAt: '2024-01-01T10:00:00Z',
      completedAt: '2024-01-01T10:30:00Z',
      downloadUrl: '/api/gdpr/exports/export-1/download',
    },
    {
      id: 'export-2',
      status: 'PENDING',
      requestedAt: '2024-01-15T14:00:00Z',
    },
    {
      id: 'export-3',
      status: 'FAILED',
      requestedAt: '2024-01-10T09:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render section title', () => {
    render(<DataExport exports={mockExports} onUpdate={vi.fn()} />);
    expect(screen.getByText('Data Export')).toBeInTheDocument();
  });

  it('should display request button', () => {
    render(<DataExport exports={mockExports} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Request Data Export/i })).toBeInTheDocument();
  });

  it('should display export history', () => {
    render(<DataExport exports={mockExports} onUpdate={vi.fn()} />);

    expect(screen.getByText(/Export #export-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Export #export-2/i)).toBeInTheDocument();
    expect(screen.getByText(/Export #export-3/i)).toBeInTheDocument();
  });

  it('should show export status badges', () => {
    render(<DataExport exports={mockExports} onUpdate={vi.fn()} />);

    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  it('should display download button for completed exports (credentialed fetch)', () => {
    render(<DataExport exports={mockExports} onUpdate={vi.fn()} />);

    const downloadButton = screen.getByRole('button', { name: /Download/i });
    expect(downloadButton).toBeInTheDocument();
    // Download uses button + fetch(credentials) not <a href>
  });

  it('should not show download for pending exports', () => {
    render(<DataExport exports={[mockExports[1]]} onUpdate={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Download/i })).not.toBeInTheDocument();
  });

  it('should handle new export request', async () => {
    const mockUpdate = vi.fn();
    (privacyApi.requestDataExport as any).mockResolvedValue({
      id: 'export-4',
      message: 'Export requested successfully',
    });

    render(<DataExport exports={mockExports} onUpdate={mockUpdate} />);

    const requestButton = screen.getByRole('button', { name: /Request Data Export/i });
    fireEvent.click(requestButton);

    // Wait for confirmation dialog to appear
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to request a data export/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(privacyApi.requestDataExport).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('should show confirmation dialog before request', async () => {
    render(<DataExport exports={mockExports} onUpdate={vi.fn()} />);

    const requestButton = screen.getByRole('button', { name: /Request Data Export/i });
    fireEvent.click(requestButton);

    expect(screen.getByText(/Are you sure you want to request a data export/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    expect(confirmButton).toBeInTheDocument();
  });

  it('should show loading state during request', async () => {
    (privacyApi.requestDataExport as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<DataExport exports={mockExports} onUpdate={vi.fn()} />);

    const requestButton = screen.getByRole('button', { name: /Request Data Export/i });
    fireEvent.click(requestButton);

    // Confirm the dialog
    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
  });

  it('should handle request errors', async () => {
    (privacyApi.requestDataExport as any).mockRejectedValue(new Error('Export failed'));

    render(<DataExport exports={mockExports} onUpdate={vi.fn()} />);

    const requestButton = screen.getByRole('button', { name: /Request Data Export/i });
    fireEvent.click(requestButton);

    // Confirm the dialog
    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to request export/i)).toBeInTheDocument();
    });
  });

  it('should format dates correctly', () => {
    render(<DataExport exports={mockExports} onUpdate={vi.fn()} />);
    expect(screen.getByText(/Requested:.*Jan 1, 2024/)).toBeInTheDocument();
  });

  it('should handle empty export history', () => {
    render(<DataExport exports={[]} onUpdate={vi.fn()} />);
    expect(screen.getByText('No export history')).toBeInTheDocument();
  });

  it('should show export processing time', () => {
    render(<DataExport exports={[mockExports[0]]} onUpdate={vi.fn()} />);
    expect(screen.getByText(/Completed in.*30 minutes/i)).toBeInTheDocument();
  });
});