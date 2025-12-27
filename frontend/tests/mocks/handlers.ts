import { http, HttpResponse } from 'msw';

/**
 * MSW Request Handlers for API Mocking
 * Used in tests to mock backend API responses
 */

export const handlers = [
  // Health check
  http.get('http://localhost:3001/api/health', () => {
    return HttpResponse.json({ success: true, data: { status: 'ok' } });
  }),

  // Register
  http.post('http://localhost:3001/api/auth/register', async ({ request }) => {
    const body = await request.json() as { email: string; password: string; name?: string };
    
    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'user-123',
          email: body.email,
          name: body.name,
          role: 'USER',
        },
        accessToken: 'mock-access-token',
      },
    });
  }),

  // Login
  http.post('http://localhost:3001/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === 'wrong@example.com' || body.password === 'wrong') {
      return HttpResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'user-123',
          email: body.email,
          name: 'Test User',
          role: 'USER',
        },
        accessToken: 'mock-access-token',
      },
    });
  }),

  // Get Me
  http.get('http://localhost:3001/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
      },
    });
  }),

  // Refresh Token
  http.post('http://localhost:3001/api/auth/refresh', () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-access-token',
      },
    });
  }),

  // Logout
  http.post('http://localhost:3001/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),
];

