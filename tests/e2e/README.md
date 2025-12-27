# Full-Stack E2E Tests

These tests verify the complete integration between frontend and backend.

## Test Files

1. **`full-stack-auth.spec.ts`** - Complete authentication flows
   - Registration end-to-end
   - Login end-to-end
   - Protected routes
   - Token refresh
   - Logout
   - Error handling
   - Complete user journeys

2. **`full-stack-api.spec.ts`** - API integration tests
   - Health endpoints
   - CORS verification
   - API response formats
   - Error handling

3. **`full-stack-auth-cookies.spec.ts`** - Cookie-based authentication security
   - Access tokens in HTTP-only cookies
   - JavaScript cannot access tokens
   - Cookie-based authentication flows
   - Session persistence

4. **`full-stack-profile.spec.ts`** - User profile management
   - View profile page
   - Update profile (name, email)
   - Email validation
   - Duplicate email prevention
   - Change password
   - Password strength validation
   - Error handling
   - Complete profile management journey

5. **`full-stack-ui-components.spec.ts`** - Advanced UI components integration
   - Loading states during API calls
   - Toast notifications (success/error)
   - Skeleton loaders during data loading
   - Error handling and user-friendly messages
   - Form validation with inline errors
   - Complete user journey with UI components

## Running Tests

### Prerequisites

1. **Database must be set up**:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

2. **Environment variables configured**:
   - Backend `.env` file with database and JWT secrets
   - Frontend `.env.local` with `VITE_API_BASE_URL=http://localhost:3001`

### Run Tests

```bash
# From frontend directory
cd frontend
npm run test:e2e

# Or from root directory
cd tests/e2e
npx playwright test
```

### What Gets Tested

✅ **CORS Configuration**: Frontend can call backend API  
✅ **Authentication Flow**: Register → Login → Dashboard  
✅ **API Integration**: Frontend calls backend, backend responds correctly  
✅ **Token Management**: Tokens stored, sent, refreshed  
✅ **Protected Routes**: Unauthenticated users redirected  
✅ **Error Handling**: Errors displayed correctly from backend  
✅ **Complete Journeys**: Full user workflows work end-to-end  

## Test Configuration

The Playwright config automatically:
- Starts backend server on port 3001
- Starts frontend server on port 3000
- Waits for both to be ready
- Runs tests against both servers

## Notes

- Tests run sequentially to avoid database conflicts
- Each test cleans up (clears localStorage, cookies)
- Tests use unique emails to avoid conflicts
- Backend database should be in test/development mode

