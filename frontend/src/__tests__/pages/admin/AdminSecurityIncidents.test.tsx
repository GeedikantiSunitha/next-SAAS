/**
 * Admin Security Incidents Page Tests (TDD Red)
 *
 * Tests GDPR breach notification management UI
 * Admin-only page for managing security incidents
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminSecurityIncidents } from '../../../pages/admin/AdminSecurityIncidents';
import { AuthProvider } from '../../../contexts/AuthContext';
import * as adminApi from '../../../api/admin';
import * as useToastHook from '../../../hooks/use-toast';

// Mock admin API
vi.mock('../../../api/admin', () => ({
  adminApi: {
    getSecurityIncidents: vi.fn(),
    getSecurityIncident: vi.fn(),
    reportSecurityIncident: vi.fn(),
    updateSecurityIncident: vi.fn(),
    notifyAffectedUsers: vi.fn(),
    reportToICO: vi.fn(),
    getIncidentDeadline: vi.fn(),
  },
}));

// Mock useToast
vi.mock('../../../hooks/use-toast');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderAdminSecurityIncidents = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AdminSecurityIncidents />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminSecurityIncidents', () => {
  const mockToast = vi.fn();

  const mockIncidents = [
    {
      id: 'incident-1',
      type: 'DATA_BREACH',
      severity: 'HIGH',
      status: 'REPORTED',
      title: 'Customer Data Exposure',
      description: 'Unauthorized access to customer database',
      affectedDataTypes: ['email', 'name', 'phone'],
      affectedUserCount: 1500,
      detectedAt: new Date('2026-01-15T10:00:00Z').toISOString(),
      icoNotificationRequired: true,
      icoNotifiedAt: null,
      icoReferenceNumber: null,
      containedAt: null,
      resolvedAt: null,
      createdAt: new Date('2026-01-15T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-01-15T10:00:00Z').toISOString(),
    },
    {
      id: 'incident-2',
      type: 'UNAUTHORIZED_ACCESS',
      severity: 'MEDIUM',
      status: 'INVESTIGATING',
      title: 'Suspicious Login Attempts',
      description: 'Multiple failed login attempts from unknown IP',
      affectedDataTypes: ['login_attempts'],
      affectedUserCount: 5,
      detectedAt: new Date('2026-01-18T14:30:00Z').toISOString(),
      icoNotificationRequired: false,
      icoNotifiedAt: null,
      icoReferenceNumber: null,
      containedAt: null,
      resolvedAt: null,
      createdAt: new Date('2026-01-18T14:30:00Z').toISOString(),
      updatedAt: new Date('2026-01-18T14:30:00Z').toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.stubGlobal('confirm', vi.fn(() => true));

    // Mock useToast
    vi.mocked(useToastHook.useToast).mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    } as any);

    // Default mock for getSecurityIncidents
    (adminApi.adminApi.getSecurityIncidents as any).mockResolvedValue({
      success: true,
      data: mockIncidents,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Page Rendering', () => {
    it('should render security incidents page', () => {
      renderAdminSecurityIncidents();

      expect(screen.getByRole('heading', { name: /security incidents/i, level: 1 })).toBeInTheDocument();
    });

    it('should display page description', () => {
      renderAdminSecurityIncidents();

      expect(
        screen.getByText(/Manage GDPR-compliant security incident reporting and breach notifications/i)
      ).toBeInTheDocument();
    });

    it('should have report new incident button', () => {
      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Incidents List', () => {
    it('should fetch and display security incidents', async () => {
      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(adminApi.adminApi.getSecurityIncidents).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
        expect(screen.getByText('Suspicious Login Attempts')).toBeInTheDocument();
      });
    });

    it('should display incident severity badges', async () => {
      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('HIGH')).toBeInTheDocument();
        expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      });
    });

    it('should display incident status', async () => {
      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('REPORTED')).toBeInTheDocument();
        expect(screen.getByText('INVESTIGATING')).toBeInTheDocument();
      });
    });

    it('should display affected user count', async () => {
      renderAdminSecurityIncidents();

      await waitFor(() => {
        const userCountElements = screen.getAllByText(/users affected/i);
        expect(userCountElements.length).toBeGreaterThan(0);
        expect(screen.getByText(/1500 users affected/i)).toBeInTheDocument();
      });
    });

    it('should show ICO notification badge for reportable incidents', async () => {
      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText(/ICO notification required/i)).toBeInTheDocument();
      });
    });

    it('should handle empty incidents list', async () => {
      (adminApi.adminApi.getSecurityIncidents as any).mockResolvedValue({
        success: true,
        data: [],
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText(/no security incidents found/i)).toBeInTheDocument();
      });
    });

    it('should display loading state while fetching incidents', () => {
      (adminApi.adminApi.getSecurityIncidents as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderAdminSecurityIncidents();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display error message on fetch failure', async () => {
      (adminApi.adminApi.getSecurityIncidents as any).mockRejectedValue(
        new Error('Failed to fetch incidents')
      );

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText(/failed to load security incidents/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should support filtering by status', async () => {
      (adminApi.adminApi.getSecurityIncidents as any).mockResolvedValue({
        success: true,
        data: [mockIncidents[0]],
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(adminApi.adminApi.getSecurityIncidents).toHaveBeenCalled();
      });

      // Clear previous calls
      vi.clearAllMocks();
      (adminApi.adminApi.getSecurityIncidents as any).mockResolvedValue({
        success: true,
        data: [mockIncidents[0]],
      });

      const statusFilter = screen.getAllByRole('combobox')[0]; // First select is status
      fireEvent.click(statusFilter);

      // Wait for dropdown to open and click the option
      await waitFor(() => {
        const reportedOption = screen.getByText('Reported');
        fireEvent.click(reportedOption);
      });

      // Verify API was called with filter
      await waitFor(() => {
        expect(adminApi.adminApi.getSecurityIncidents).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'REPORTED' })
        );
      });
    });

    it('should support filtering by severity', async () => {
      (adminApi.adminApi.getSecurityIncidents as any).mockResolvedValue({
        success: true,
        data: mockIncidents,
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(adminApi.adminApi.getSecurityIncidents).toHaveBeenCalled();
      });

      vi.clearAllMocks();
      (adminApi.adminApi.getSecurityIncidents as any).mockResolvedValue({
        success: true,
        data: [mockIncidents[0]],
      });

      const severityFilter = screen.getAllByRole('combobox')[1]; // Second select is severity
      fireEvent.click(severityFilter);

      await waitFor(() => {
        const highOption = screen.getByText('High');
        fireEvent.click(highOption);
      });

      await waitFor(() => {
        expect(adminApi.adminApi.getSecurityIncidents).toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'HIGH' })
        );
      });
    });

    it('should support filtering by type', async () => {
      (adminApi.adminApi.getSecurityIncidents as any).mockResolvedValue({
        success: true,
        data: mockIncidents,
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(adminApi.adminApi.getSecurityIncidents).toHaveBeenCalled();
      });

      vi.clearAllMocks();
      (adminApi.adminApi.getSecurityIncidents as any).mockResolvedValue({
        success: true,
        data: [mockIncidents[0]],
      });

      const typeFilter = screen.getAllByRole('combobox')[2]; // Third select is type
      fireEvent.click(typeFilter);

      await waitFor(() => {
        const dataBreachOption = screen.getByText('Data Breach');
        fireEvent.click(dataBreachOption);
      });

      await waitFor(() => {
        expect(adminApi.adminApi.getSecurityIncidents).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'DATA_BREACH' })
        );
      });
    });

    it('should support clearing filters', async () => {
      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(adminApi.adminApi.getSecurityIncidents).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Report New Incident', () => {
    it('should open report incident dialog when button clicked', () => {
      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      fireEvent.click(button);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/report new security incident/i)).toBeInTheDocument();
    });

    it('should display incident type selection', () => {
      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      fireEvent.click(button);

      expect(screen.getByLabelText(/incident type/i)).toBeInTheDocument();
    });

    it('should display severity selection', () => {
      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      fireEvent.click(button);

      // Look for the Label element in the dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Check for select trigger with "Select severity"
      const severitySelects = screen.getAllByText(/severity/i);
      expect(severitySelects.length).toBeGreaterThan(0);
    });

    it('should display title input', () => {
      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      fireEvent.click(button);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    it('should display description textarea', () => {
      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      fireEvent.click(button);

      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should display affected data types input', () => {
      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      fireEvent.click(button);

      expect(screen.getByLabelText(/affected data types/i)).toBeInTheDocument();
    });

    it('should display affected user count input', () => {
      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      fireEvent.click(button);

      expect(screen.getByLabelText(/affected user count/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      fireEvent.click(button);

      const submitButton = screen.getAllByRole('button', { name: /submit/i })[0];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Validation Error',
            description: 'Title is required',
          })
        );
      });
    });

    it('should submit new incident', async () => {
      (adminApi.adminApi.reportSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      fireEvent.click(button);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form - use inputs instead of labels
      const titleInput = screen.getByPlaceholderText(/brief incident title/i);
      const descInput = screen.getByPlaceholderText(/detailed incident description/i);
      const userCountInput = screen.getByPlaceholderText(/number of affected users/i);

      fireEvent.change(titleInput, {
        target: { value: 'Customer Data Exposure' },
      });
      fireEvent.change(descInput, {
        target: { value: 'Unauthorized access to customer database' },
      });
      fireEvent.change(userCountInput, {
        target: { value: '1500' },
      });

      const submitButtons = screen.getAllByRole('button', { name: /submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(adminApi.adminApi.reportSecurityIncident).toHaveBeenCalled();
      });
    });

    it('should display success message after reporting', async () => {
      (adminApi.adminApi.reportSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      renderAdminSecurityIncidents();

      const button = screen.getByRole('button', { name: /report incident/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill required fields
      const titleInput = screen.getByPlaceholderText(/brief incident title/i);
      const descInput = screen.getByPlaceholderText(/detailed incident description/i);
      fireEvent.change(titleInput, { target: { value: 'Test Incident' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });

      const submitButtons = screen.getAllByRole('button', { name: /submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            description: expect.stringContaining('reported successfully'),
          })
        );
      });
    });
  });

  describe('Incident Details', () => {
    it('should open incident details when clicking on incident', async () => {
      (adminApi.adminApi.getSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer Data Exposure'));

      await waitFor(() => {
        expect(adminApi.adminApi.getSecurityIncident).toHaveBeenCalledWith('incident-1');
      });
    });

    it('should display full incident details in dialog', async () => {
      (adminApi.adminApi.getSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer Data Exposure'));

      await waitFor(() => {
        const descriptions = screen.getAllByText(/unauthorized access to customer database/i);
        expect(descriptions.length).toBeGreaterThan(0);
        expect(screen.getByText(/email, name, phone/i)).toBeInTheDocument();
      });
    });

    it('should show update status button', async () => {
      (adminApi.adminApi.getSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer Data Exposure'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update status/i })).toBeInTheDocument();
      });
    });

    it('should show notify users button', async () => {
      (adminApi.adminApi.getSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer Data Exposure'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notify users/i })).toBeInTheDocument();
      });
    });

    it('should show report to ICO button for reportable incidents', async () => {
      (adminApi.adminApi.getSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer Data Exposure'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report to ico/i })).toBeInTheDocument();
      });
    });

    it('should display 72-hour deadline for ICO notification', async () => {
      (adminApi.adminApi.getSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      const deadline = new Date('2026-01-18T10:00:00Z');
      (adminApi.adminApi.getIncidentDeadline as any).mockResolvedValue({
        success: true,
        data: {
          deadline: deadline.toISOString(),
          hoursRemaining: 48,
        },
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer Data Exposure'));

      await waitFor(() => {
        expect(screen.getByText(/48.*hours remaining/i)).toBeInTheDocument();
      });
    });
  });

  describe('Update Incident Status', () => {
    beforeEach(async () => {
      (adminApi.adminApi.getSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer Data Exposure'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update status/i })).toBeInTheDocument();
      });
    });

    it('should open status update dialog', () => {
      const button = screen.getByRole('button', { name: /update status/i });
      fireEvent.click(button);

      expect(screen.getByText(/update incident status/i)).toBeInTheDocument();
    });

    it('should allow updating to CONTAINED status', async () => {
      (adminApi.adminApi.updateSecurityIncident as any).mockResolvedValue({
        success: true,
        data: { ...mockIncidents[0], status: 'CONTAINED' },
      });

      const updateButtons = screen.getAllByRole('button', { name: /update status/i });
      fireEvent.click(updateButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
      });

      // Click on the select and choose CONTAINED
      const selects = screen.getAllByRole('combobox');
      const statusSelect = selects[selects.length - 1]; // Last select in the update dialog
      fireEvent.click(statusSelect);

      await waitFor(() => {
        const containedOption = screen.getByText('Contained');
        fireEvent.click(containedOption);
      });

      const updateSubmitButtons = screen.getAllByRole('button', { name: /update/i });
      fireEvent.click(updateSubmitButtons[0]);

      await waitFor(() => {
        expect(adminApi.adminApi.updateSecurityIncident).toHaveBeenCalled();
      });
    });

    it('should allow updating to RESOLVED status', async () => {
      (adminApi.adminApi.updateSecurityIncident as any).mockResolvedValue({
        success: true,
        data: { ...mockIncidents[0], status: 'RESOLVED' },
      });

      const updateButtons = screen.getAllByRole('button', { name: /update status/i });
      fireEvent.click(updateButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
      });

      const selects = screen.getAllByRole('combobox');
      const statusSelect = selects[selects.length - 1];
      fireEvent.click(statusSelect);

      await waitFor(() => {
        const resolvedOption = screen.getByText('Resolved');
        fireEvent.click(resolvedOption);
      });

      const updateSubmitButtons = screen.getAllByRole('button', { name: /update/i });
      fireEvent.click(updateSubmitButtons[0]);

      await waitFor(() => {
        expect(adminApi.adminApi.updateSecurityIncident).toHaveBeenCalled();
      });
    });

    it('should display success message after status update', async () => {
      (adminApi.adminApi.updateSecurityIncident as any).mockResolvedValue({
        success: true,
        data: { ...mockIncidents[0], status: 'CONTAINED' },
      });

      const button = screen.getByRole('button', { name: /update status/i });
      fireEvent.click(button);

      const submitButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            description: expect.stringContaining('updated'),
          })
        );
      });
    });
  });

  describe('Notify Affected Users', () => {
    beforeEach(async () => {
      (adminApi.adminApi.getSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer Data Exposure'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notify users/i })).toBeInTheDocument();
      });
    });

    it('should open notify users dialog', () => {
      const button = screen.getByRole('button', { name: /notify users/i });
      fireEvent.click(button);

      expect(screen.getByText(/notify affected users/i)).toBeInTheDocument();
    });

    it('should display confirmation message about email notifications', () => {
      const button = screen.getByRole('button', { name: /notify users/i });
      fireEvent.click(button);

      expect(screen.getByText(/1500.*users will be notified/i)).toBeInTheDocument();
    });

    it('should send notifications when confirmed', async () => {
      (adminApi.adminApi.notifyAffectedUsers as any).mockResolvedValue({
        success: true,
        data: { notificationsSent: 1500 },
      });

      const button = screen.getByRole('button', { name: /notify users/i });
      fireEvent.click(button);

      const confirmButton = screen.getByRole('button', { name: /send notifications/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(adminApi.adminApi.notifyAffectedUsers).toHaveBeenCalledWith('incident-1');
      });
    });

    it('should display success message after sending notifications', async () => {
      (adminApi.adminApi.notifyAffectedUsers as any).mockResolvedValue({
        success: true,
        data: { notificationsSent: 1500 },
      });

      const button = screen.getByRole('button', { name: /notify users/i });
      fireEvent.click(button);

      const confirmButton = screen.getByRole('button', { name: /send notifications/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            description: expect.stringContaining('1500'),
          })
        );
      });
    });
  });

  describe('Report to ICO', () => {
    beforeEach(async () => {
      (adminApi.adminApi.getSecurityIncident as any).mockResolvedValue({
        success: true,
        data: mockIncidents[0],
      });

      renderAdminSecurityIncidents();

      await waitFor(() => {
        expect(screen.getByText('Customer Data Exposure')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer Data Exposure'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report to ico/i })).toBeInTheDocument();
      });
    });

    it('should open ICO reporting dialog', () => {
      const buttons = screen.getAllByRole('button', { name: /report to ico/i });
      fireEvent.click(buttons[0]);

      const dialogs = screen.getAllByRole('dialog');
      expect(dialogs.length).toBeGreaterThan(0);
    });

    it('should display ICO reference number input', () => {
      const button = screen.getByRole('button', { name: /report to ico/i });
      fireEvent.click(button);

      expect(screen.getByLabelText(/ico reference number/i)).toBeInTheDocument();
    });

    it('should submit ICO report with reference number', async () => {
      (adminApi.adminApi.reportToICO as any).mockResolvedValue({
        success: true,
        data: {
          ...mockIncidents[0],
          icoNotifiedAt: new Date().toISOString(),
          icoReferenceNumber: 'ICO-2026-123456',
        },
      });

      const button = screen.getByRole('button', { name: /report to ico/i });
      fireEvent.click(button);

      const input = screen.getByLabelText(/ico reference number/i);
      fireEvent.change(input, { target: { value: 'ICO-2026-123456' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(adminApi.adminApi.reportToICO).toHaveBeenCalledWith('incident-1', {
          icoReferenceNumber: 'ICO-2026-123456',
        });
      });
    });

    it('should display success message after ICO reporting', async () => {
      (adminApi.adminApi.reportToICO as any).mockResolvedValue({
        success: true,
        data: {
          ...mockIncidents[0],
          icoNotifiedAt: new Date().toISOString(),
          icoReferenceNumber: 'ICO-2026-123456',
        },
      });

      const button = screen.getByRole('button', { name: /report to ico/i });
      fireEvent.click(button);

      const input = screen.getByLabelText(/ico reference number/i);
      fireEvent.change(input, { target: { value: 'ICO-2026-123456' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            description: expect.stringContaining('ICO'),
          })
        );
      });
    });

    it('should validate ICO reference number format', async () => {
      const buttons = screen.getAllByRole('button', { name: /report to ico/i });
      fireEvent.click(buttons[0]);

      await waitFor(() => {
        expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
      });

      const input = screen.getByPlaceholderText(/ICO-2026-123456/i);
      fireEvent.change(input, { target: { value: 'invalid' } });

      const submitButtons = screen.getAllByRole('button', { name: /submit/i });
      fireEvent.click(submitButtons[submitButtons.length - 1]); // Last submit button

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Validation Error',
            description: expect.stringContaining('Invalid format'),
          })
        );
      });
    });
  });
});
