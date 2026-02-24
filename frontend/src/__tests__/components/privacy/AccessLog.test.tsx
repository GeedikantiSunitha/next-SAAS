/**
 * Tests for AccessLog Component
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AccessLog from '../../../components/privacy/AccessLog';
import { privacyApi } from '../../../api/privacy';
import { vi } from 'vitest';

// Mock the API
vi.mock('../../../api/privacy', () => ({
  privacyApi: {
    getAccessLog: vi.fn(),
  },
}));

describe('AccessLog Component', () => {
  const mockAccessLog = [
    {
      id: 'log-1',
      accessedBy: 'admin@company.com',
      accessType: 'VIEW',
      dataCategory: 'PROFILE',
      purpose: 'Customer support request #123',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      timestamp: '2024-01-20T15:30:00Z',
    },
    {
      id: 'log-2',
      accessedBy: 'system',
      accessType: 'EXPORT',
      dataCategory: 'ALL',
      purpose: 'User requested data export',
      timestamp: '2024-01-19T10:00:00Z',
    },
    {
      id: 'log-3',
      accessedBy: 'user@example.com',
      accessType: 'UPDATE',
      dataCategory: 'PREFERENCES',
      purpose: 'Privacy settings update',
      timestamp: '2024-01-18T14:15:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (privacyApi.getAccessLog as any).mockResolvedValue({
      entries: mockAccessLog,
      pagination: {
        page: 1,
        pageSize: 10,
        total: 3,
        totalPages: 1,
      },
    });
  });

  it('should render section title', () => {
    render(<AccessLog initialData={mockAccessLog} />);
    expect(screen.getByText('Access Log')).toBeInTheDocument();
  });

  it('should display access log entries', () => {
    render(<AccessLog initialData={mockAccessLog} />);

    expect(screen.getByText('admin@company.com')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('should show access types', () => {
    render(<AccessLog initialData={mockAccessLog} />);

    expect(screen.getByText('VIEW')).toBeInTheDocument();
    expect(screen.getByText('EXPORT')).toBeInTheDocument();
    expect(screen.getByText('UPDATE')).toBeInTheDocument();
  });

  it('should display data categories', () => {
    render(<AccessLog initialData={mockAccessLog} />);

    expect(screen.getByText('PROFILE')).toBeInTheDocument();
    expect(screen.getByText('ALL')).toBeInTheDocument();
    expect(screen.getByText('PREFERENCES')).toBeInTheDocument();
  });

  it('should show access purpose', () => {
    render(<AccessLog initialData={mockAccessLog} />);

    expect(screen.getByText('Customer support request #123')).toBeInTheDocument();
    expect(screen.getByText('User requested data export')).toBeInTheDocument();
    expect(screen.getByText('Privacy settings update')).toBeInTheDocument();
  });

  it('should format timestamps', () => {
    render(<AccessLog initialData={mockAccessLog} />);

    expect(screen.getByText(/Jan 20, 2024.*3:30 PM/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 19, 2024.*10:00 AM/)).toBeInTheDocument();
  });

  it('should show filter controls', () => {
    render(<AccessLog initialData={mockAccessLog} />);

    expect(screen.getByLabelText(/Access Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data Category/i)).toBeInTheDocument();
  });

  it('should handle access type filter', async () => {
    render(<AccessLog initialData={mockAccessLog} />);

    const filterSelect = screen.getByLabelText(/Access Type/i);
    fireEvent.change(filterSelect, { target: { value: 'VIEW' } });

    await waitFor(() => {
      expect(privacyApi.getAccessLog).toHaveBeenCalledWith(
        expect.objectContaining({
          accessType: 'VIEW',
        })
      );
    });
  });

  it('should handle date range filter', async () => {
    render(<AccessLog initialData={mockAccessLog} />);

    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);

    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

    const applyButton = screen.getByRole('button', { name: /Apply Filters/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(privacyApi.getAccessLog).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
      );
    });
  });

  it('should show pagination controls', async () => {
    (privacyApi.getAccessLog as any).mockResolvedValue({
      entries: mockAccessLog,
      pagination: {
        page: 1,
        pageSize: 10,
        total: 30,
        totalPages: 3,
      },
    });

    render(<AccessLog />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/admin@company.com/)).toBeInTheDocument();
    });

    // Check pagination controls exist when multiple pages
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    (privacyApi.getAccessLog as any).mockResolvedValue({
      entries: mockAccessLog,
      pagination: {
        page: 1,
        pageSize: 10,
        total: 30,
        totalPages: 3,
      },
    });

    render(<AccessLog />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/admin@company.com/)).toBeInTheDocument();
    });

    // Test that the component can fetch data
    expect(privacyApi.getAccessLog).toHaveBeenCalled();
  });

  it('should show IP address details', () => {
    render(<AccessLog initialData={mockAccessLog} showDetails={true} />);
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should have export button', () => {
    render(<AccessLog initialData={mockAccessLog} />);
    expect(screen.getByRole('button', { name: /Export Log/i })).toBeInTheDocument();
  });

  it('should handle export action', () => {
    const mockOnExport = vi.fn();
    render(<AccessLog initialData={mockAccessLog} onExport={mockOnExport} />);

    const exportButton = screen.getByRole('button', { name: /Export Log/i });
    fireEvent.click(exportButton);

    expect(mockOnExport).toHaveBeenCalled();
  });

  it('should show loading state', async () => {
    // Mock a never-resolving promise to keep loading state
    (privacyApi.getAccessLog as any).mockImplementation(
      () => new Promise(() => {})
    );

    // Render without initialData so it triggers fetch
    const { container } = render(<AccessLog />);

    // Wait for loading state to appear
    await waitFor(() => {
      expect(screen.getByText(/Loading access log/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should handle empty log', () => {
    render(<AccessLog initialData={[]} />);
    expect(screen.getByText('No access log entries')).toBeInTheDocument();
  });

  it('should highlight suspicious activity', () => {
    const suspiciousLog = [
      {
        ...mockAccessLog[0],
        suspicious: true,
        suspicionReason: 'Unusual access pattern detected',
      },
    ];

    render(<AccessLog initialData={suspiciousLog} />);
    expect(screen.getByText(/Unusual access pattern/i)).toBeInTheDocument();
  });

  it('should allow searching the log', () => {
    render(<AccessLog initialData={mockAccessLog} />);

    const searchInput = screen.getByPlaceholderText(/Search access log/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'admin' } });

    expect(screen.getByText('admin@company.com')).toBeInTheDocument();
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
  });

  it('should include dataCategory in API call when data category filter changes', async () => {
    render(<AccessLog initialData={mockAccessLog} />);

    const dataCategorySelect = screen.getByLabelText(/Data Category/i);
    fireEvent.change(dataCategorySelect, { target: { value: 'PROFILE' } });

    await waitFor(() => {
      expect(privacyApi.getAccessLog).toHaveBeenCalledWith(
        expect.objectContaining({ dataCategory: 'PROFILE' })
      );
    });
  });

  it('should send page 1 when applying filters', async () => {
    (privacyApi.getAccessLog as any).mockResolvedValue({
      entries: mockAccessLog,
      pagination: { page: 1, pageSize: 10, total: 30, totalPages: 3 },
    });

    render(<AccessLog />);
    await waitFor(() => expect(screen.getByText('admin@company.com')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Start Date/i), {
      target: { value: '2024-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));

    await waitFor(() => {
      const calls = (privacyApi.getAccessLog as any).mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.page).toBe(1);
    });
  });

  it('should send correct page number when navigating to next page', async () => {
    (privacyApi.getAccessLog as any).mockResolvedValue({
      entries: mockAccessLog,
      pagination: { page: 1, pageSize: 10, total: 30, totalPages: 3 },
    });

    render(<AccessLog />);
    await waitFor(() => expect(screen.getByText('admin@company.com')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      const calls = (privacyApi.getAccessLog as any).mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.page).toBe(2);
    });
  });

  it('should show error message when API fails to load', async () => {
    (privacyApi.getAccessLog as any).mockRejectedValue(new Error('API error'));

    render(<AccessLog />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load access log/i)).toBeInTheDocument();
    });
  });
});