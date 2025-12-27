# Production vs Development: Critical Differences

## Why Code Works in Dev/Local But Fails in Production

This document explains common reasons why code works locally but fails in production, and how our template addresses these issues.

---

## Common Production Failures & Our Solutions

### 1. Environment Variables Missing

**Problem**: Code works locally because `.env` file exists, but production doesn't have these variables set.

**Our Solution**:
- ✅ Backend: Validates required env vars on startup (throws error if missing)
- ✅ Frontend: Uses fallback values for optional vars
- ✅ Documentation: `.env.example` files show all required variables
- ⚠️ **Gap**: `.env.example` files were not created initially (Issue #32)

**Prevention**:
- Always create `.env.example` files
- Document all required environment variables
- Use validation on startup (backend does this)
- Use CI/CD to check for required env vars before deployment

---

### 2. CORS Configuration

**Problem**: Local development uses `http://localhost:3000`, but production uses a real domain. CORS fails if `FRONTEND_URL` is not set correctly.

**Our Solution**:
- ✅ Backend: Uses `FRONTEND_URL` env var for CORS origin
- ✅ Frontend: Uses `VITE_API_BASE_URL` for API calls
- ✅ Development: Defaults to `http://localhost:3000`
- ⚠️ **Production Risk**: Must set `FRONTEND_URL` correctly in production

**Production Checklist**:
```env
# Backend .env
FRONTEND_URL=https://yourdomain.com
COOKIE_DOMAIN=yourdomain.com
COOKIE_SECURE=true  # CRITICAL: Must be true in production
```

---

### 3. Database Connection

**Problem**: Local database is accessible, but production database might have:
- Different connection string
- Network restrictions
- SSL requirements
- Connection pooling limits

**Our Solution**:
- ✅ Prisma: Handles connection pooling automatically
- ✅ Environment variable: `DATABASE_URL` is required
- ✅ Validation: Backend validates `DATABASE_URL` on startup

**Production Checklist**:
```env
# Production DATABASE_URL format
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

---

### 4. JWT Secrets

**Problem**: Using weak or default secrets in production exposes security vulnerabilities.

**Our Solution**:
- ✅ Validation: Backend validates JWT secrets are 32+ characters
- ✅ Separate secrets: Different secrets for access and refresh tokens
- ⚠️ **Production Risk**: Must use strong, unique secrets

**Production Checklist**:
```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

```env
JWT_SECRET=<generated-secret-32-chars-minimum>
JWT_REFRESH_SECRET=<generated-secret-32-chars-minimum>
```

---

### 5. Cookie Settings

**Problem**: Cookies work in development but fail in production due to:
- `secure` flag not set (required for HTTPS)
- Wrong `domain` setting
- `sameSite` policy issues

**Our Solution**:
- ✅ Environment-based: `COOKIE_SECURE` defaults to `false` (dev), must be `true` (prod)
- ✅ Domain configurable: `COOKIE_DOMAIN` env var
- ✅ SameSite: Set to `strict` for security

**Production Checklist**:
```env
COOKIE_SECURE=true  # CRITICAL: Must be true for HTTPS
COOKIE_DOMAIN=yourdomain.com  # Without protocol
```

---

### 6. API Timeouts

**Problem**: Production network latency is higher than local, causing timeouts.

**Our Solution**:
- ✅ Frontend: Configurable timeout via `VITE_API_TIMEOUT` (default: 10000ms)
- ✅ Backend: No explicit timeout (uses Express defaults)

**Production Consideration**:
- Increase timeout if API calls are slow
- Monitor API response times
- Consider implementing retry logic

---

### 7. Build Process Differences

**Problem**: Development uses source maps, hot reload, etc. Production build might:
- Have different file paths
- Missing assets
- Different base URLs

**Our Solution**:
- ✅ Vite: Handles production builds correctly
- ✅ Environment variables: Prefixed with `VITE_` for frontend
- ✅ Base URL: Configurable via `VITE_API_BASE_URL`

**Production Build**:
```bash
cd frontend
npm run build  # Creates optimized production build
```

---

### 8. Error Handling

**Problem**: Development shows detailed errors, but production should hide sensitive information.

**Our Solution**:
- ✅ Backend: Different error messages based on `NODE_ENV`
- ✅ Logging: Winston logs errors but doesn't expose to users
- ✅ Validation: User-friendly error messages

**Production Behavior**:
- Generic error messages for users
- Detailed errors in logs only
- No stack traces in API responses (when `NODE_ENV=production`)

---

### 9. Rate Limiting

**Problem**: Development might not hit rate limits, but production will.

**Our Solution**:
- ✅ Configurable: Rate limits via environment variables
- ✅ Different limits: Auth endpoints have stricter limits
- ✅ Headers: Rate limit info in response headers

**Production Tuning**:
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Per window
AUTH_RATE_LIMIT_MAX=5  # Auth endpoints
```

---

### 10. Logging

**Problem**: Console.log works in development but should use proper logging in production.

**Our Solution**:
- ✅ Winston: Structured logging with levels
- ✅ File rotation: Logs rotate daily
- ✅ PII masking: Sensitive data is masked
- ✅ Log levels: Configurable via `LOG_LEVEL`

**Production Logging**:
```env
LOG_LEVEL=warn  # Only warnings and errors in production
```

---

## Production Deployment Checklist

### Backend

- [ ] Set `NODE_ENV=production`
- [ ] Set `DATABASE_URL` with production database
- [ ] Generate and set strong `JWT_SECRET` (32+ chars)
- [ ] Generate and set strong `JWT_REFRESH_SECRET` (32+ chars)
- [ ] Set `FRONTEND_URL` to production frontend URL
- [ ] Set `COOKIE_SECURE=true`
- [ ] Set `COOKIE_DOMAIN` to your domain
- [ ] Set `RESEND_API_KEY` if using email
- [ ] Run database migrations: `npm run prisma:migrate deploy`
- [ ] Build: `npm run build`
- [ ] Start: `npm start` (not `npm run dev`)

### Frontend

- [ ] Set `VITE_API_BASE_URL` to production backend URL
- [ ] Build: `npm run build`
- [ ] Deploy `dist/` folder to hosting (Vercel, Netlify, etc.)
- [ ] Ensure environment variables are set in hosting platform

---

## Testing Production Readiness

### Before Deployment

1. **Test with production-like environment**:
   ```bash
   NODE_ENV=production npm run build
   NODE_ENV=production npm start
   ```

2. **Verify environment variables**:
   - All required vars are set
   - No default/placeholder values
   - Secrets are strong and unique

3. **Test CORS**:
   - Frontend can call backend API
   - Cookies are set correctly
   - No CORS errors in console

4. **Test authentication flow**:
   - Register works
   - Login works
   - Token refresh works
   - Logout works

5. **Check error handling**:
   - Errors don't expose sensitive info
   - User-friendly error messages
   - Proper HTTP status codes

---

## Monitoring in Production

### What to Monitor

1. **API Response Times**: Should be < 500ms for most endpoints
2. **Error Rates**: Should be < 1%
3. **Rate Limit Hits**: Monitor for abuse
4. **Database Connections**: Watch for connection pool exhaustion
5. **JWT Token Issues**: Monitor 401 errors (might indicate token refresh issues)

### Logs to Watch

- Error logs: `logs/error-*.log`
- Combined logs: `logs/combined-*.log`
- Application logs: Check for patterns indicating issues

---

## Common Production Issues & Fixes

### Issue: "Missing required environment variable"

**Fix**: Set all required environment variables in production environment.

### Issue: CORS errors in production

**Fix**: Set `FRONTEND_URL` correctly in backend `.env`.

### Issue: Cookies not working in production

**Fix**: Set `COOKIE_SECURE=true` and `COOKIE_DOMAIN` correctly.

### Issue: Database connection fails

**Fix**: Check `DATABASE_URL` format, SSL requirements, network access.

### Issue: JWT validation fails

**Fix**: Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set and match between instances.

---

## Summary

Our template addresses most production concerns, but **you must**:

1. ✅ Set all environment variables correctly
2. ✅ Use strong secrets (32+ characters)
3. ✅ Enable `COOKIE_SECURE=true` in production
4. ✅ Set correct `FRONTEND_URL` and `COOKIE_DOMAIN`
5. ✅ Run database migrations
6. ✅ Build and deploy correctly
7. ✅ Monitor logs and errors

**The code is production-ready, but configuration is critical.**

