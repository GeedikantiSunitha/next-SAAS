# Frontend Template

Production-ready frontend template that works seamlessly with the backend template.

## Features

✅ **React 18 + TypeScript** - Type-safe frontend  
✅ **Vite** - Fast development and build  
✅ **React Router** - Client-side routing  
✅ **React Query** - Server state management  
✅ **React Hook Form + Zod** - Form validation  
✅ **Tailwind CSS + shadcn/ui** - Modern UI components  
✅ **Axios** - HTTP client with interceptors  
✅ **Authentication** - Complete auth flow with token refresh  

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your backend URL:

```env
VITE_API_BASE_URL=http://localhost:3001
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Start Backend

In a separate terminal:

```bash
cd ../backend
npm run dev
```

Backend should run on `http://localhost:3001`

## Testing Integration

1. **Start both servers** (frontend on :3000, backend on :3001)
2. **Open browser** to `http://localhost:3000`
3. **Try to register** a new user
4. **Check browser console** for any CORS or API errors
5. **Verify login** works and redirects to dashboard

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client & services
│   │   ├── client.ts      # Axios instance with interceptors
│   │   ├── auth.ts        # Auth API calls
│   │   └── types.ts       # API response types
│   ├── components/        # React components
│   │   ├── ui/            # shadcn/ui components
│   │   └── auth/          # Auth components
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/             # Custom React hooks
│   ├── lib/                # Utilities
│   ├── pages/              # Page components
│   ├── routes/             # Route configuration
│   └── types/              # TypeScript types
├── tests/                  # Test files
├── .env.example           # Environment variables template
└── package.json
```

## API Integration

The API client (`src/api/client.ts`) is configured to:

- ✅ **Handle CORS** - Uses `withCredentials: true` for cookies
- ✅ **Auto-add auth token** - Adds Bearer token to all requests
- ✅ **Auto-refresh token** - Refreshes token on 401 errors
- ✅ **Error handling** - Centralized error handling

## Authentication Flow

1. User logs in → receives `accessToken` in response
2. Access token stored in `localStorage`
3. Refresh token stored as HTTP-only cookie (set by backend)
4. On 401 error → automatically refreshes token using cookie
5. On refresh failure → redirects to login

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run test:ui      # Run tests with UI
npm run test:e2e     # Run E2E tests
npm run lint         # Run linter
npm run lint:fix     # Fix linting issues
```

## Troubleshooting

### CORS Errors

1. Check `FRONTEND_URL` in backend `.env` matches frontend URL
2. Ensure backend CORS config allows your frontend origin
3. Verify `withCredentials: true` in API client

### Authentication Not Working

1. Check browser console for errors
2. Verify backend is running on correct port
3. Check `VITE_API_BASE_URL` in frontend `.env.local`
4. Verify token is being stored in localStorage

### API Calls Failing

1. Check network tab in browser dev tools
2. Verify backend is running
3. Check API endpoint URLs match backend routes
4. Verify request/response format matches backend API

## Next Steps

1. Add more pages and features
2. Integrate with backend API endpoints
3. Add more UI components as needed
4. Write tests for your features

## Documentation

- [Frontend Template Plan](../docs/FRONTEND_TEMPLATE_PLAN.md) - Complete implementation plan
- [Backend README](../backend/README.md) - Backend API documentation

