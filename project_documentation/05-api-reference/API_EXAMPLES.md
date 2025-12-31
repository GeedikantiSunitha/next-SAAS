# API Examples
## NextSaaS - API Usage Examples

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

Practical examples of using the NextSaaS API with cURL, JavaScript, and TypeScript.

---

## Authentication Examples

### Register User

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }' \
  -c cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    name: 'John Doe',
  }),
});

const data = await response.json();
```

**TypeScript**:
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

const register = async (data: RegisterRequest) => {
  const response = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return response.json();
};
```

---

### Login

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
  }),
});

const data = await response.json();
```

---

### Get Current User

**cURL**:
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/auth/me', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
```

---

### Refresh Token

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/auth/refresh', {
  method: 'POST',
  credentials: 'include',
});

const data = await response.json();
```

---

### Logout

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
});

const data = await response.json();
```

---

## Profile Examples

### Get Profile

**cURL**:
```bash
curl -X GET http://localhost:3001/api/profile/me \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/profile/me', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
```

---

### Update Profile

**cURL**:
```bash
curl -X PUT http://localhost:3001/api/profile/me \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com"
  }' \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/profile/me', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Jane Doe',
    email: 'jane@example.com',
  }),
});

const data = await response.json();
```

---

### Change Password

**cURL**:
```bash
curl -X PUT http://localhost:3001/api/profile/password \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewSecurePass123!"
  }' \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/profile/password', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    currentPassword: 'OldPass123!',
    newPassword: 'NewSecurePass123!',
  }),
});

const data = await response.json();
```

---

## OAuth Examples

### OAuth Login (Token-based)

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/oauth/google \
  -H "Content-Type: application/json" \
  -d '{
    "token": "oauth-access-token-from-provider"
  }' \
  -c cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/auth/oauth/google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    token: 'oauth-access-token-from-provider',
  }),
});

const data = await response.json();
```

### Get OAuth Methods

**cURL**:
```bash
curl -X GET http://localhost:3001/api/auth/oauth/methods \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/auth/oauth/methods', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
// data.data - array of linked providers
```

### Link OAuth Provider

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/oauth/link \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "token": "oauth-access-token"
  }' \
  -b cookies.txt
```

### Unlink OAuth Provider

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/oauth/unlink \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google"
  }' \
  -b cookies.txt
```

---

## MFA Examples

### Setup TOTP MFA

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/mfa/setup/totp \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/auth/mfa/setup/totp', {
  method: 'POST',
  credentials: 'include',
});

const data = await response.json();
// data.data.secret - TOTP secret
// data.data.qrCode - QR code data URL
```

### Setup Email MFA

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/mfa/setup/email \
  -b cookies.txt
```

### Verify MFA Code

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "method": "TOTP",
    "code": "123456"
  }' \
  -b cookies.txt
```

### Enable MFA

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/mfa/enable \
  -H "Content-Type: application/json" \
  -d '{
    "method": "TOTP",
    "code": "123456"
  }' \
  -b cookies.txt
```

### Disable MFA

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/mfa/disable \
  -H "Content-Type: application/json" \
  -d '{
    "method": "TOTP"
  }' \
  -b cookies.txt
```

### Generate Backup Codes

**cURL**:
```bash
curl -X POST http://localhost:3001/api/auth/mfa/backup-codes \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/auth/mfa/backup-codes', {
  method: 'POST',
  credentials: 'include',
});

const data = await response.json();
// data.data.codes - array of backup codes (save these!)
```

### Get MFA Methods

**cURL**:
```bash
curl -X GET http://localhost:3001/api/auth/mfa/methods \
  -b cookies.txt
```

---

## RBAC Examples

### Get User Role

**cURL**:
```bash
curl -X GET http://localhost:3001/api/rbac/me/role \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/rbac/me/role', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
// data.data.role - USER, ADMIN, or SUPER_ADMIN
```

### Get User Permissions

**cURL**:
```bash
curl -X GET http://localhost:3001/api/rbac/me/permissions \
  -b cookies.txt
```

### Check Role

**cURL**:
```bash
curl -X GET http://localhost:3001/api/rbac/check/role/ADMIN \
  -b cookies.txt
```

### Check Resource Access

**cURL**:
```bash
curl -X POST http://localhost:3001/api/rbac/check/access \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "payment",
    "resourceOwnerId": "user-id"
  }' \
  -b cookies.txt
```

### List Users by Role (Admin)

**cURL**:
```bash
curl -X GET http://localhost:3001/api/rbac/users/role/USER \
  -b cookies.txt
```

### Update User Role (Super Admin)

**cURL**:
```bash
curl -X PUT http://localhost:3001/api/rbac/users/user-id/role \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ADMIN"
  }' \
  -b cookies.txt
```

---

## Audit Examples

### Get Audit Logs

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/audit?userId=user-id&action=USER_LOGIN&limit=20" \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/audit?userId=user-id&limit=20', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
```

### Get Audit Stats

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/audit/stats?startDate=2025-01-01&endDate=2025-12-31" \
  -b cookies.txt
```

### Get User Audit Logs

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/audit/user/user-id?limit=50" \
  -b cookies.txt
```

### Get Resource Audit Logs

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/audit/resource/payments?resourceId=payment-id" \
  -b cookies.txt
```

---

## GDPR Examples

### Request Data Export

**cURL**:
```bash
curl -X POST http://localhost:3001/api/gdpr/export \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/gdpr/export', {
  method: 'POST',
  credentials: 'include',
});

const data = await response.json();
// data.data.downloadUrl - download link (expires in 7 days)
```

### Get Export Requests

**cURL**:
```bash
curl -X GET http://localhost:3001/api/gdpr/exports \
  -b cookies.txt
```

### Request Data Deletion

**cURL**:
```bash
curl -X POST http://localhost:3001/api/gdpr/deletion \
  -H "Content-Type: application/json" \
  -d '{
    "deletionType": "HARD",
    "reason": "No longer using service"
  }' \
  -b cookies.txt
```

### Confirm Data Deletion

**cURL**:
```bash
curl -X POST http://localhost:3001/api/gdpr/deletion/confirm/confirmation-token
```

### Grant Consent

**cURL**:
```bash
curl -X POST http://localhost:3001/api/gdpr/consents \
  -H "Content-Type: application/json" \
  -d '{
    "consentType": "MARKETING_EMAILS"
  }' \
  -b cookies.txt
```

### Revoke Consent

**cURL**:
```bash
curl -X DELETE http://localhost:3001/api/gdpr/consents/MARKETING_EMAILS \
  -b cookies.txt
```

### Check Consent

**cURL**:
```bash
curl -X GET http://localhost:3001/api/gdpr/consents/MARKETING_EMAILS/check \
  -b cookies.txt
```

---

## Feature Flags Examples

### Get All Feature Flags

**cURL**:
```bash
curl -X GET http://localhost:3001/api/feature-flags \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/feature-flags', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
// data.data - object with all feature flags
```

### Get Specific Feature Flag

**cURL**:
```bash
curl -X GET http://localhost:3001/api/feature-flags/NEW_FEATURE \
  -b cookies.txt
```

---

## Health Examples

### Health Check

**cURL**:
```bash
curl -X GET http://localhost:3001/api/health
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/health');
const data = await response.json();
// data.status - 'healthy' or 'degraded'
// data.database - 'healthy' or 'unhealthy'
```

### Readiness Probe

**cURL**:
```bash
curl -X GET http://localhost:3001/api/health/ready
```

---

## Payment Examples

### Create Payment

**cURL**:
```bash
curl -X POST http://localhost:3001/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "description": "Subscription payment"
  }' \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    amount: 100.00,
    currency: 'USD',
    description: 'Subscription payment',
  }),
});

const data = await response.json();
// data.data.clientSecret - use for payment confirmation
```

---

### List Payments

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/payments?page=1&limit=20" \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/payments?page=1&limit=20', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
```

---

### Get Payment

**cURL**:
```bash
curl -X GET http://localhost:3001/api/payments/payment-id \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/payments/payment-id', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
```

---

## Notification Examples

### List Notifications

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/notifications?page=1&limit=20" \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/notifications?page=1&limit=20', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
```

---

### Mark as Read

**cURL**:
```bash
curl -X PUT http://localhost:3001/api/notifications/notification-id/read \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/notifications/notification-id/read', {
  method: 'PUT',
  credentials: 'include',
});

const data = await response.json();
```

### Mark All as Read

**cURL**:
```bash
curl -X PUT http://localhost:3001/api/notifications/read-all \
  -b cookies.txt
```

### Create Notification

**cURL**:
```bash
curl -X POST http://localhost:3001/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INFO",
    "channel": "IN_APP",
    "title": "Welcome!",
    "message": "Thanks for joining"
  }' \
  -b cookies.txt
```

---

### Get Unread Count

**cURL**:
```bash
curl -X GET http://localhost:3001/api/notifications/unread-count \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/notifications/unread-count', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
// data.data.count - unread count
```

---

## Admin Examples

### List Users

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/admin/users?page=1&limit=20&role=USER" \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/admin/users?page=1&limit=20&role=USER', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
```

---

### Create User

**cURL**:
```bash
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "name": "New User",
    "role": "USER"
  }' \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/admin/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'SecurePass123!',
    name: 'New User',
    role: 'USER',
  }),
});

const data = await response.json();
```

---

### Get Dashboard

**cURL**:
```bash
curl -X GET http://localhost:3001/api/admin/dashboard \
  -b cookies.txt
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/admin/dashboard', {
  method: 'GET',
  credentials: 'include',
});

const data = await response.json();
```

### Get User Activity

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/admin/users/user-id/activity?page=1&limit=20" \
  -b cookies.txt
```

### Get System Metrics

**cURL**:
```bash
curl -X GET http://localhost:3001/api/admin/metrics/system \
  -b cookies.txt
```

### Get Database Metrics

**cURL**:
```bash
curl -X GET http://localhost:3001/api/admin/metrics/database \
  -b cookies.txt
```

### Get API Metrics

**cURL**:
```bash
curl -X GET http://localhost:3001/api/admin/metrics/api \
  -b cookies.txt
```

### Get Recent Errors

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/admin/errors/recent?limit=50" \
  -b cookies.txt
```

### Get Audit Logs (Admin)

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/admin/audit-logs?userId=user-id&action=USER_LOGIN&page=1&limit=20" \
  -b cookies.txt
```

### Export Audit Logs

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/admin/audit-logs/export?format=csv&startDate=2025-01-01" \
  -b cookies.txt \
  -o audit-logs.csv
```

### Get Feature Flags (Admin)

**cURL**:
```bash
curl -X GET http://localhost:3001/api/admin/feature-flags \
  -b cookies.txt
```

### Update Feature Flag

**cURL**:
```bash
curl -X PUT http://localhost:3001/api/admin/feature-flags/NEW_FEATURE \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true
  }' \
  -b cookies.txt
```

### Get Payments (Admin)

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/admin/payments?userId=user-id&status=SUCCEEDED&page=1&limit=20" \
  -b cookies.txt
```

### Get Subscriptions (Admin)

**cURL**:
```bash
curl -X GET "http://localhost:3001/api/admin/subscriptions?userId=user-id&status=ACTIVE" \
  -b cookies.txt
```

### Get Settings

**cURL**:
```bash
curl -X GET http://localhost:3001/api/admin/settings \
  -b cookies.txt
```

### Update Settings

**cURL**:
```bash
curl -X PUT http://localhost:3001/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "emailEnabled": true,
      "maintenanceMode": false
    }
  }' \
  -b cookies.txt
```

---

## Error Handling Examples

### Handle 401 (Unauthorized)

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3001/api/profile/me', {
  method: 'GET',
  credentials: 'include',
});

if (response.status === 401) {
  // Try to refresh token
  const refreshResponse = await fetch('http://localhost:3001/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (refreshResponse.ok) {
    // Retry original request
    return fetch('http://localhost:3001/api/profile/me', {
      method: 'GET',
      credentials: 'include',
    });
  } else {
    // Redirect to login
    window.location.href = '/login';
  }
}
```

---

### Handle 429 (Rate Limit)

**JavaScript**:
```javascript
const makeRequest = async (url, options, retries = 3) => {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const resetTime = parseInt(response.headers.get('X-RateLimit-Reset'));
    const waitTime = (resetTime * 1000) - Date.now();

    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return makeRequest(url, options, retries - 1);
    }
  }

  return response;
};
```

---

## React Query Examples

### Fetch Profile

```typescript
import { useQuery } from '@tanstack/react-query';

const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/profile/me', {
        credentials: 'include',
      });
      const data = await response.json();
      return data.data;
    },
  });
};
```

---

### Update Profile

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await fetch('http://localhost:3001/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
```

---

## Axios Examples

### Setup Axios Instance

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Add custom headers if needed
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await apiClient.post('/auth/refresh');
        // Retry original request
        return apiClient.request(error.config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

### Use Axios Client

```typescript
// Get profile
const profile = await apiClient.get('/profile/me');

// Update profile
const updated = await apiClient.put('/profile/me', {
  name: 'Jane Doe',
});

// Create payment
const payment = await apiClient.post('/payments', {
  amount: 100.00,
  currency: 'USD',
});
```

---

## TypeScript API Client

### Complete API Client

```typescript
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data;
  }

  // Auth
  async register(email: string, password: string, name?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Profile
  async getProfile() {
    return this.request('/profile/me');
  }

  async updateProfile(data: UpdateProfileData) {
    return this.request('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Payments
  async createPayment(data: CreatePaymentData) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayments(page = 1, limit = 20) {
    return this.request(`/payments?page=${page}&limit=${limit}`);
  }
}

// Usage
const api = new ApiClient('http://localhost:3001/api');
const profile = await api.getProfile();
```

---

## Testing Examples

### Test Registration

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Auth API', () => {
  it('should register a new user', async () => {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('test@example.com');
  });
});
```

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
