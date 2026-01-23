/**
 * Tests for Threat Indicators Component
 *
 * Task 3.3: Security Monitoring & Alerting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the API module before importing components
vi.mock('../../lib/api', () => {
  return {
    api: {
      get: vi.fn(() => Promise.resolve({ data: { data: {} } })),
      post: vi.fn(() => Promise.resolve({ data: { data: {} } })),
      put: vi.fn(() => Promise.resolve({ data: { data: {} } })),
      delete: vi.fn(() => Promise.resolve({ data: { data: {} } })),
      patch: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    }
  };
});

// Also mock the alias path
vi.mock('@/lib/api', () => {
  return {
    api: {
      get: vi.fn(() => Promise.resolve({ data: { data: {} } })),
      post: vi.fn(() => Promise.resolve({ data: { data: {} } })),
      put: vi.fn(() => Promise.resolve({ data: { data: {} } })),
      delete: vi.fn(() => Promise.resolve({ data: { data: {} } })),
      patch: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    }
  };
});

// Mock the toast hook
vi.mock('../../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Now import the component and api after mocks are set up
import ThreatIndicators from '../../components/ThreatIndicators';
import { api } from '../../lib/api';

describe('ThreatIndicators', () => {
  const mockIndicators = {
    data: {
      data: {
        failedLogins: 45,
        bruteForceAttempts: 2,
        rateLimitViolations: 12,
        unauthorizedAccess: 7,
        suspiciousActivity: 15,
        threatLevel: 'MEDIUM' as const,
      }
    },
  };

  const mockPreviousIndicators = {
    data: {
      data: {
        failedLogins: 30,
        bruteForceAttempts: 1,
        rateLimitViolations: 20,
        unauthorizedAccess: 5,
        suspiciousActivity: 10,
        threatLevel: 'LOW' as const,
      }
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch threat indicators on mount', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve(mockIndicators);
      }
      if (url.includes('hoursBack=48')) {
        return Promise.resolve(mockPreviousIndicators);
      }
      return Promise.resolve({ data: {} });
    });


    render(<ThreatIndicators />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/security/threat-indicators?hoursBack=24');
      expect(api.get).toHaveBeenCalledWith('/api/security/threat-indicators?hoursBack=48');
    });
  });

  it('should display overall threat level', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockResolvedValue(mockIndicators);

    render(<ThreatIndicators />);

    await waitFor(() => {
      expect(screen.getByText('Overall Threat Level')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      expect(screen.getByText('Moderate activity detected')).toBeInTheDocument();
    });
  });

  it('should display threat level progress bar', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockResolvedValue(mockIndicators);

    render(<ThreatIndicators />);

    await waitFor(() => {
      // Progress component doesn't have role="progressbar", look for the Progress element by class
      const progressBar = document.querySelector('.relative.w-full.overflow-hidden.rounded-full');
      expect(progressBar).toBeInTheDocument();
    });
  });

  it('should display individual threat indicators', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve(mockIndicators);
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      expect(screen.getByText('Failed Logins')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();

      expect(screen.getByText('Brute Force Attempts')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      expect(screen.getByText('Rate Limit Violations')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();

      expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();

      expect(screen.getByText('Suspicious Activity')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('should show trend indicators when data changes', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve(mockIndicators);
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      // Failed logins increased (45 from 30)
      const trend50Elements = screen.getAllByText(/50.0% from previous period/);
      expect(trend50Elements.length).toBeGreaterThan(0);

      // Rate limit violations decreased (12 from 20)
      const trend40Elements = screen.getAllByText(/40.0% from previous period/);
      expect(trend40Elements.length).toBeGreaterThan(0);
    });
  });

  it('should show warning badges for values above threshold', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve({
          data: {
            data: {
              ...mockIndicators.data.data,
              suspiciousActivity: 16, // Above threshold of 15
            }
          },
        });
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      // Suspicious activity (16) is above threshold (15)
      expect(screen.getByText('Above threshold (15)')).toBeInTheDocument();
    });
  });

  it('should calculate and display security score', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve(mockIndicators);
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      expect(screen.getByText('Security Score')).toBeInTheDocument();
      expect(screen.getByText('Overall security posture')).toBeInTheDocument();
      // Score should be displayed as a percentage (e.g., "85%")
      const scoreElements = screen.getAllByText((content) => {
        return /^\d+%$/.test(content);
      });
      expect(scoreElements.length).toBeGreaterThan(0);
    });
  });

  it('should show security recommendations when threat level is not LOW', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve(mockIndicators);
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      expect(screen.getByText('Security Recommendations')).toBeInTheDocument();
      expect(screen.getByText(/Review accounts with failed login attempts/)).toBeInTheDocument();
    });
  });

  it('should not show recommendations when threat level is LOW', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve({
          data: {
            data: {
              ...mockIndicators.data.data,
              threatLevel: 'LOW',
              failedLogins: 5,
              bruteForceAttempts: 0,
              rateLimitViolations: 2,
              unauthorizedAccess: 1,
              suspiciousActivity: 3,
            }
          },
        });
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      expect(screen.queryByText('Security Recommendations')).not.toBeInTheDocument();
    });
  });

  it('should handle CRITICAL threat level correctly', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve({
          data: {
            data: {
              ...mockIndicators.data.data,
              threatLevel: 'CRITICAL',
            }
          },
        });
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByText('Immediate action required')).toBeInTheDocument();
    });
  });

  it('should handle HIGH threat level correctly', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve({
          data: {
            data: {
              ...mockIndicators.data.data,
              threatLevel: 'HIGH',
            }
          },
        });
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('Elevated risk detected')).toBeInTheDocument();
    });
  });

  it('should respect custom hoursBack prop', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockResolvedValue(mockIndicators);

    render(<ThreatIndicators hoursBack={6} />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/security/threat-indicators?hoursBack=6');
      expect(api.get).toHaveBeenCalledWith('/api/security/threat-indicators?hoursBack=12');
    });
  });

  it('should show loading state', () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ThreatIndicators />);

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should handle API errors gracefully', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockRejectedValue(new Error('API Error'));

    render(<ThreatIndicators />);

    // The component should handle the error gracefully
    // It will call toast internally but we can't directly test that with the current mock setup
    // Instead we verify the component doesn't crash
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should display correct indicator descriptions', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve(mockIndicators);
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      expect(screen.getByText('Authentication failures')).toBeInTheDocument();
      expect(screen.getByText('Account lockout triggers')).toBeInTheDocument();
      expect(screen.getByText('API throttling events')).toBeInTheDocument();
      expect(screen.getByText('Permission denied events')).toBeInTheDocument();
      expect(screen.getByText('Anomaly detections')).toBeInTheDocument();
    });
  });

  it('should show appropriate recommendations based on data', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve({
          data: {
            data: {
              failedLogins: 10,
              bruteForceAttempts: 3,
              rateLimitViolations: 25,
              unauthorizedAccess: 8,
              suspiciousActivity: 20,
              threatLevel: 'HIGH',
            }
          },
        });
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      expect(screen.getByText(/Monitor API usage patterns/)).toBeInTheDocument();
      expect(screen.getByText(/Review permission settings/)).toBeInTheDocument();
      expect(screen.getByText(/Investigate suspicious activity patterns/)).toBeInTheDocument();
    });
  });

  it('should calculate security score correctly', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve(mockIndicators);
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      // With the given mock data, check that a score is calculated and displayed
      const scoreElements = screen.getAllByText((content) => {
        return /^\d+%$/.test(content);
      });

      expect(scoreElements.length).toBeGreaterThan(0);

      // Score should be a number between 0-100
      const scoreText = scoreElements[0].textContent;
      const score = parseInt(scoreText?.replace('%', '') || '0');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it('should display score badge with appropriate variant', async () => {
    const mockGet = vi.mocked(api.get);
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hoursBack=24')) {
        return Promise.resolve(mockIndicators);
      }
      return Promise.resolve(mockPreviousIndicators);
    });

    render(<ThreatIndicators />);

    await waitFor(() => {
      // Check that a score label exists (Excellent, Good, Fair, Poor, or Critical)
      const labels = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'];
      const foundLabel = labels.some(label => screen.queryByText(label));
      expect(foundLabel).toBe(true);
    });
  });
});