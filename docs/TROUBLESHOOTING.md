# Troubleshooting Guide

**Purpose**: Common issues and solutions for NextSaaS setup and development.

**Last Updated**: January 2025

---

## Quick Fixes

### Database Connection Issues

**Problem**: `Can't reach database server` or `Connection refused`

**Solutions**:
1. **Check database is running**:
   ```bash
   # PostgreSQL
   pg_isready -h localhost -p 5432
   ```

2. **Verify DATABASE_URL**:
   ```bash
   # Check .env file
   cat backend/.env | grep DATABASE_URL
   # Should be: postgresql://user:password@localhost:5432/dbname
   ```

3. **Check connection pool settings**:
   ```bash
   # Add to DATABASE_URL if needed:
   ?connection_limit=20&pool_timeout=20
   ```

4. **Reset database**:
   ```bash
   cd backend
   npx prisma migrate reset
   npx prisma migrate dev
   ```

---

### Authentication Issues

**Problem**: `Invalid token` or `Unauthorized` errors

**Solutions**:
1. **Check JWT_SECRET is set**:
   ```bash
   # Backend .env must have:
   JWT_SECRET=your-secret-key-here
   ```

2. **Clear cookies/localStorage**:
   - Clear browser cookies for localhost
   - Clear localStorage: `localStorage.clear()` in browser console

3. **Check token expiry**:
   - Access tokens: 15 minutes (default)
   - Refresh tokens: 30 days
   - If expired, login again

4. **Verify CORS settings**:
   ```typescript
   // backend/src/app.ts
   // CORS origin should match frontend URL
   origin: process.env.FRONTEND_URL || 'http://localhost:5173'
   ```

---

### Email Service Issues

**Problem**: Emails not sending

**Solutions**:
1. **Check RESEND_API_KEY**:
   ```bash
   # Backend .env must have:
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

2. **Verify email configuration**:
   ```bash
   # Check email service is configured
   curl http://localhost:3000/api/health
   # Should show email service status
   ```

3. **Test email sending**:
   ```bash
   # Use the email test endpoint (if available)
   # Or check logs for email service errors
   ```

4. **Check email templates**:
   - Templates should be in `backend/src/templates/`
   - Verify template files exist and are valid Handlebars

---

### Frontend Build Issues

**Problem**: `Module not found` or build errors

**Solutions**:
1. **Clear node_modules and reinstall**:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check TypeScript errors**:
   ```bash
   npm run type-check
   # or
   npx tsc --noEmit
   ```

3. **Verify environment variables**:
   ```bash
   # Frontend .env must have:
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Clear Vite cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

---

### Test Failures

**Problem**: Tests failing locally

**Solutions**:
1. **Reset test database**:
   ```bash
   cd backend
   NODE_ENV=test npx prisma migrate reset --force
   ```

2. **Check test environment variables**:
   ```bash
   # Tests use .env.test or test-specific config
   # Verify test database is separate from dev
   ```

3. **Run tests in isolation**:
   ```bash
   # Backend
   npm test -- --testPathPattern=specific-test
   
   # Frontend
   npm test -- specific-test
   ```

4. **Check for port conflicts**:
   ```bash
   # Make sure test server isn't conflicting with dev server
   lsof -i :3000
   ```

---

### Payment Provider Issues

**Problem**: Payment integration not working

**Solutions**:
1. **Check provider API keys**:
   ```bash
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   
   # Razorpay
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```

2. **Verify webhook endpoints**:
   - Stripe: Configure webhook URL in Stripe dashboard
   - Razorpay: Configure webhook in Razorpay dashboard
   - Use ngrok for local testing: `ngrok http 3000`

3. **Check provider logs**:
   - Payment providers have dashboards with transaction logs
   - Check for failed webhook deliveries

4. **Test with test mode**:
   - Use test API keys (not production)
   - Use test card numbers provided by payment provider

---

### Docker Issues

**Problem**: Docker build or run failures

**Solutions**:
1. **Check Dockerfile exists**:
   ```bash
   ls backend/Dockerfile
   ls frontend/Dockerfile
   ```

2. **Rebuild images**:
   ```bash
   docker-compose build --no-cache
   ```

3. **Check container logs**:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

4. **Verify environment variables**:
   ```bash
   # Docker uses .env file or docker-compose.yml env vars
   docker-compose config
   ```

---

### Port Conflicts

**Problem**: `Port already in use`

**Solutions**:
1. **Find process using port**:
   ```bash
   # macOS/Linux
   lsof -i :3000
   lsof -i :5173
   
   # Kill process
   kill -9 <PID>
   ```

2. **Change port in config**:
   ```bash
   # Backend: Change PORT in .env
   PORT=3001
   
   # Frontend: Change in vite.config.ts
   server: { port: 5174 }
   ```

---

### Prisma Migration Issues

**Problem**: Migration errors or schema sync issues

**Solutions**:
1. **Reset database** (⚠️ **WARNING**: Deletes all data):
   ```bash
   npx prisma migrate reset
   ```

2. **Create new migration**:
   ```bash
   npx prisma migrate dev --name descriptive-name
   ```

3. **Check schema syntax**:
   ```bash
   npx prisma validate
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Format schema**:
   ```bash
   npx prisma format
   ```

---

### Environment Variable Issues

**Problem**: `Environment variable X is required`

**Solutions**:
1. **Check .env file exists**:
   ```bash
   ls backend/.env
   ls frontend/.env
   ```

2. **Verify .env.example**:
   ```bash
   # Copy example if missing
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Check variable names**:
   - Backend: Check `backend/src/config/env.ts`
   - Frontend: Variables must start with `VITE_`

4. **Restart server after .env changes**:
   ```bash
   # .env changes require server restart
   # Stop and restart dev server
   ```

---

## Common Error Messages

### `JWT_SECRET is required`
- **Fix**: Add `JWT_SECRET=your-secret-key` to `backend/.env`

### `Database connection failed`
- **Fix**: Check PostgreSQL is running and DATABASE_URL is correct

### `CORS policy blocked`
- **Fix**: Verify `FRONTEND_URL` in backend .env matches frontend URL

### `Module not found: Can't resolve '@/...'`
- **Fix**: Check `tsconfig.json` path aliases are configured correctly

### `Prisma Client not generated`
- **Fix**: Run `npx prisma generate` in backend directory

---

## Getting Help

1. **Check logs**:
   - Backend: `backend/logs/` directory
   - Check console output for detailed errors

2. **Review documentation**:
   - [GETTING_STARTED.md](./GETTING_STARTED.md)
   - [ISSUES_LOG.md](./ISSUES_LOG.md) - Past issues and solutions

3. **Verify setup**:
   - Follow [GETTING_STARTED.md](./GETTING_STARTED.md) step-by-step
   - Check all prerequisites are installed

4. **Check GitHub Issues** (if applicable):
   - Search for similar issues
   - Create new issue with error details and logs

---

## Prevention Tips

1. **Always check .env files** before starting
2. **Run migrations** after pulling code changes
3. **Clear caches** when seeing strange errors
4. **Check logs first** - they usually contain the solution
5. **Verify database is running** before starting backend
6. **Use test mode** for payment providers during development

---

**Last Updated**: January 2025  
**Maintained by**: NextSaaS Team
