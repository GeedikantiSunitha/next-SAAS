/**
 * API Client for Frontend
 * Handles all API communication with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An unexpected error occurred',
      }));
      throw new Error(error.message || response.statusText);
    }

    return response.json();
  }

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async post(endpoint: string, data?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse(response);
  }

  async put(endpoint: string, data?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse(response);
  }

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async patch(endpoint: string, data?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse(response);
  }
}

export const api = new ApiClient();

// Security API functions for Task 3.4
export interface VulnerabilityScanRequest {
  scanType: 'FULL_SCAN' | 'QUICK_SCAN' | 'API_SCAN' | 'OWASP_SCAN' | 'DEPENDENCY_SCAN' | 'CUSTOM_SCAN';
  targetUrl?: string;
  checkTypes?: string[];
}

export interface VulnerabilityScanResponse {
  id: string;
  scanType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  targetUrl?: string;
  initiatedBy?: string;
  totalChecks?: number;
  completedChecks?: number;
  criticalVulnerabilities?: number;
  highVulnerabilities?: number;
  mediumVulnerabilities?: number;
  lowVulnerabilities?: number;
  infoFindings?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScanProgressResponse {
  scanId: string;
  status: string;
  progress: number;
  totalChecks: number;
  completedChecks: number;
  vulnerabilitiesFound: number;
}

export interface ThreatIndicatorsResponse {
  failedLogins: number;
  bruteForceAttempts: number;
  rateLimitViolations: number;
  unauthorizedAccess: number;
  suspiciousActivity: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Vulnerability Scanning APIs
export const startVulnerabilityScan = async (data: VulnerabilityScanRequest): Promise<VulnerabilityScanResponse> => {
  const response = await api.post('/api/security/scans/start', data);
  return response.scan;
};

export const getScanProgress = async (scanId: string): Promise<ScanProgressResponse> => {
  const response = await api.get(`/api/security/scans/progress/${scanId}`);
  return response.progress;
};

export const getScanReport = async (scanId: string) => {
  return api.get(`/api/security/scans/report/${scanId}`);
};

export const getActiveScans = async (): Promise<VulnerabilityScanResponse[]> => {
  const response = await api.get('/api/security/scans/active');
  return response.scans;
};

export const getRecentScans = async (limit: number = 10): Promise<VulnerabilityScanResponse[]> => {
  const response = await api.get(`/api/security/scans/recent?limit=${limit}`);
  return response.scans;
};

export const resolveVulnerability = async (vulnerabilityId: string) => {
  return api.post(`/api/security/vulnerabilities/${vulnerabilityId}/resolve`);
};

export const exportScanReport = async (scanId: string) => {
  // For CSV download, we need to handle it differently
  const response = await fetch(`${API_BASE_URL}/api/security/scans/export/${scanId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export report');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scan-report-${scanId}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const getSecurityMetrics = async (timeRange: '24h' | '7d' | '30d' = '24h') => {
  return api.get(`/api/security/metrics?timeRange=${timeRange}`);
};

export const getSecurityEvents = async (hoursBack: number = 24, limit: number = 100) => {
  return api.get(`/api/security/events?hoursBack=${hoursBack}&limit=${limit}`);
};

export const getThreatIndicators = async (hoursBack: number = 24): Promise<ThreatIndicatorsResponse> => {
  const response = await api.get(`/api/security/threat-indicators?hoursBack=${hoursBack}`);
  return response;
};

export const startOWASPTest = async (targetUrl: string) => {
  return api.post('/api/security/test/owasp', { targetUrl });
};

export const startPenetrationTest = async (targetUrl: string, testType: string = 'FULL_SCAN') => {
  return api.post('/api/security/test/penetration', { targetUrl, testType });
};