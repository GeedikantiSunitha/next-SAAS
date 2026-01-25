/**
 * Tests for Admin Security Dashboard
 *
 * Task 3.3: Security Monitoring & Alerting
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn()
  }
}));

vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn()
  }
}));

// Mock the components to avoid complexity
vi.mock('@/components/SecurityEventTimeline', () => ({
  default: ({ events }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'security-event-timeline' }, `${events?.length || 0} events`);
  }
}));

vi.mock('@/components/ThreatIndicators', () => ({
  default: ({ hoursBack }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'threat-indicators' }, `Threat indicators for ${hoursBack} hours`);
  }
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Import component and api after mocks
import AdminSecurityDashboard from '../../../pages/admin/AdminSecurityDashboard';
import { api } from '../../../lib/api';

describe('AdminSecurityDashboard', () => {
  const mockStatistics = {
    data: {
      data: {
        totalEvents: 150,
        eventsBySeverity: {
          critical: 2,
          high: 10,
          medium: 30,
          low: 50,
          info: 58,
        },
        threatLevel: 'MEDIUM',
        failedLogins: 25,
        bruteForceAttempts: 2,
        rateLimitViolations: 5,
        unauthorizedAccess: 3,
        suspiciousActivity: 8,
        timeRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-02'),
        },
      }
    },
  };

  const mockEvents = {
    data: {
      data: [
        {
          id: '1',
          timestamp: new Date(),
          type: 'FAILED_LOGIN',
          severity: 'LOW',
          user: {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Test User',
          },
          ipAddress: '192.168.1.1',
          resource: '/api/auth/login',
          action: 'POST',
          outcome: 'FAILURE',
          details: {},
          alertSent: false,
        },
        {
          id: '2',
          timestamp: new Date(),
          type: 'BRUTE_FORCE_DETECTED',
          severity: 'HIGH',
          user: null,
          ipAddress: '10.0.0.1',
          resource: null,
          action: null,
          outcome: 'BLOCKED',
          details: {},
          alertSent: true,
        },
      ]
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default successful responses
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/statistics')) {
        return Promise.resolve(mockStatistics);
      }
      if (url.includes('/timeline')) {
        return Promise.resolve(mockEvents);
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('should render the dashboard title', async () => {
    await act(async () => {
      render(<AdminSecurityDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Real-time security monitoring and threat analysis')).toBeInTheDocument();
    });
  });

  it('should fetch and display security statistics', async () => {
    render(<AdminSecurityDashboard />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/security/statistics?hoursBack=24');
      expect(api.get).toHaveBeenCalledWith('/api/security/timeline?hoursBack=24&limit=50');
    });

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total events
      expect(screen.getByText('25')).toBeInTheDocument(); // Failed logins
      expect(screen.getByText('5')).toBeInTheDocument(); // Rate limit violations
      expect(screen.getByText('8')).toBeInTheDocument(); // Suspicious activity
    });
  });

  it('should display threat level alert when not LOW', async () => {
    render(<AdminSecurityDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Current Threat Level: MEDIUM/)).toBeInTheDocument();
    });
  });

  it('should not display threat level alert when LOW', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/statistics')) {
        return Promise.resolve({
          data: {
            data: {
              ...mockStatistics.data.data,
              threatLevel: 'LOW',
            }
          },
        });
      }
      return Promise.resolve(mockEvents);
    });

    render(<AdminSecurityDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Current Threat Level:/)).not.toBeInTheDocument();
  });

  it('should allow changing time range', async () => {
    await act(async () => {
      render(<AdminSecurityDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');

    // Clear previous calls
    vi.mocked(api.get).mockClear();

    await act(async () => {
      fireEvent.change(select, { target: { value: '6' } });
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/security/statistics?hoursBack=6');
      expect(api.get).toHaveBeenCalledWith('/api/security/timeline?hoursBack=6&limit=50');
    });
  });

  it('should display severity breakdown', async () => {
    render(<AdminSecurityDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Event Severity Distribution')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Critical count
      expect(screen.getByText('10')).toBeInTheDocument(); // High count
    });
  });

  it('should render tabs correctly', async () => {
    render(<AdminSecurityDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Event Timeline' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Threat Indicators' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Recent Alerts' })).toBeInTheDocument();
    });
  });

  it('should show SecurityEventTimeline component in timeline tab', async () => {
    render(<AdminSecurityDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('security-event-timeline')).toBeInTheDocument();
      expect(screen.getByText('2 events')).toBeInTheDocument();
    });
  });

  it('should show ThreatIndicators component when switching tabs', async () => {
    render(<AdminSecurityDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Threat Indicators' })).toBeInTheDocument();
    });

    const indicatorsTab = screen.getByRole('tab', { name: 'Threat Indicators' });
    fireEvent.click(indicatorsTab);

    expect(screen.getByTestId('threat-indicators')).toBeInTheDocument();
    expect(screen.getByText('Threat indicators for 24 hours')).toBeInTheDocument();
  });

  it('should show recent alerts in alerts tab', async () => {
    render(<AdminSecurityDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Recent Alerts' })).toBeInTheDocument();
    });

    const alertsTab = screen.getByRole('tab', { name: 'Recent Alerts' });
    fireEvent.click(alertsTab);

    expect(screen.getByText('Recent Security Alerts')).toBeInTheDocument();
    expect(screen.getByText('BRUTE FORCE DETECTED')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.get).mockRejectedValue(new Error('API Error'));

    const { container } = render(<AdminSecurityDashboard />);

    await waitFor(() => {
      // Component should show loading spinner when there's an error and no data
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should show loading state', () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AdminSecurityDashboard />);

    // Should show loading spinner initially
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should toggle auto-refresh', async () => {
    await act(async () => {
      render(<AdminSecurityDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
    });

    const autoRefreshButton = screen.getByText('Auto-Refresh');

    await act(async () => {
      fireEvent.click(autoRefreshButton);
    });

    // Just verify the button state changed
    expect(screen.getByText('Auto-Refreshing')).toBeInTheDocument();
  });

  it('should manually refresh data', async () => {
    render(<AdminSecurityDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
    });

    const initialCallCount = vi.mocked(api.get).mock.calls.length;

    // Get the specific Refresh button (not Auto-Refresh)
    const buttons = screen.getAllByRole('button');
    const refreshButton = buttons.find(btn => btn.textContent === 'Refresh');

    if (refreshButton) {
      fireEvent.click(refreshButton);

      // Just verify that new API calls were made
      await waitFor(() => {
        expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    }
  });
});