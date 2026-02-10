/**
 * Data Export Component Tests (TDD)
 *
 * Tests for GDPR data export UI component
 * Following TDD: Write tests FIRST, then implement improvements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { DataExport } from '../../components/gdpr/DataExport';
import * as useGdprHooks from '../../hooks/useGdpr';
import type { DataExportRequest } from '../../api/gdpr';

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

const mockExportRequests: DataExportRequest[] = [
  {
    id: '1',
    userId: 'user1',
    status: 'COMPLETED' as const,
    requestedAt: '2025-01-05T00:00:00Z',
    downloadUrl: 'https://example.com/download/data.zip',
    expiresAt: '2025-01-12T00:00:00Z',
  },
];

const mockPendingExport: DataExportRequest[] = [
  {
    id: '2',
    userId: 'user1',
    status: 'PENDING' as const,
    requestedAt: '2025-01-10T00:00:00Z',
  },
];

describe('DataExport Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Structure', () => {
    it('should render data export section', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: [] },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      const headings = screen.getAllByText(/data export/i);
      expect(headings.length).toBeGreaterThan(0);
      expect(screen.getByText(/request a copy of all your personal data/i)).toBeInTheDocument();
    });

    it('should display loading state', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      expect(screen.getByTestId('exports-loading')).toBeInTheDocument();
    });

    it('should display error state', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load export requests'),
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      expect(screen.getByText(/error loading export requests/i)).toBeInTheDocument();
    });
  });

  describe('Completed Export State', () => {
    it('should show download button when export is completed', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: mockExportRequests },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      const completedText = screen.getAllByText(/completed/i);
      expect(completedText.length).toBeGreaterThan(0);
      expect(screen.getByText(/download data export/i)).toBeInTheDocument();
    });

    it('should show expiration notice for completed exports', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: mockExportRequests },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      expect(screen.getByText(/expires in 7 days/i)).toBeInTheDocument();
    });

    it('should show download button for completed export (triggers credentialed fetch)', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: mockExportRequests },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      const downloadButton = screen.getByRole('button', { name: /download data export/i });
      expect(downloadButton).toBeInTheDocument();
      expect(screen.getByTestId('export-download-section')).toBeInTheDocument();
    });
  });

  describe('Pending/Processing Export State', () => {
    it('should show pending status when export is being prepared', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: mockPendingExport },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      expect(screen.getByText(/pending/i)).toBeInTheDocument();
      // Verify the component renders with pending status
      expect(screen.getByRole('button', { name: /request data export/i })).toBeInTheDocument();
    });

    it('should disable request button when export is pending', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: mockPendingExport },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      const requestButton = screen.getByRole('button', { name: /request data export/i });
      expect(requestButton).toBeDisabled();
    });
  });

  describe('Request Export Functionality', () => {
    it('should show request button when no pending exports', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: [] },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /request data export/i })).toBeInTheDocument();
    });

    it('should call mutate when request button is clicked', async () => {
      const user = userEvent.setup();
      const mockRequestExport = vi.fn();

      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: [] },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: mockRequestExport,
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      const requestButton = screen.getByRole('button', { name: /request data export/i });
      await user.click(requestButton);

      expect(mockRequestExport).toHaveBeenCalled();
    });

    it('should show requesting state when mutation is pending', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: [] },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      expect(screen.getByText(/requesting/i)).toBeInTheDocument();
    });
  });

  describe('Export History', () => {
    it('should show export history when multiple exports exist', () => {
      const multipleExports: DataExportRequest[] = [
        mockExportRequests[0],
        {
          id: '3',
          userId: 'user1',
          status: 'EXPIRED' as const,
          requestedAt: '2024-12-01T00:00:00Z',
        },
      ];

      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: multipleExports },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      expect(screen.getByText(/export history/i)).toBeInTheDocument();
    });

    it('should not show export history when only one export exists', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: mockExportRequests },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      expect(screen.queryByText(/export history/i)).not.toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('should show correct icon for completed status', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: mockExportRequests },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      const { container } = render(<DataExport />, { wrapper: createWrapper() });

      // Check for completed status
      const completedElements = screen.getAllByText(/completed/i);
      expect(completedElements.length).toBeGreaterThan(0);
    });

    it('should show relative time for export requests', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: mockExportRequests },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      // Should show "Requested X ago"
      expect(screen.getByText(/requested.*ago/i)).toBeInTheDocument();
    });
  });

  describe('Information and Help Text', () => {
    it('should show help text about requesting new export', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: [] },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      expect(screen.getByText(/you can request a new export/i)).toBeInTheDocument();
    });

    it('should show GDPR right to access description', () => {
      vi.mocked(useGdprHooks.useExportRequests).mockReturnValue({
        data: { success: true, data: [] },
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useGdprHooks.useRequestExport).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<DataExport />, { wrapper: createWrapper() });

      expect(screen.getByText(/gdpr right to access/i)).toBeInTheDocument();
    });
  });
});
