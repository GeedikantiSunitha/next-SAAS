# Frontend Quick Start Guide

**Date**: December 22, 2025  
**Status**: Ready to Use

---

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites Check
```bash
# Check Node.js version (need 18+)
node --version

# Check if backend is running
curl http://localhost:3001/api/health
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env file (usually no changes needed for local dev)
# VITE_API_BASE_URL=http://localhost:3001
```

### 4. Start Development Server
```bash
# Make sure backend is running first!
cd backend
npm run dev

# In a new terminal, start frontend
cd frontend
npm run dev
```

### 5. Open Browser
Navigate to: **http://localhost:3000**

---

## ✅ Verify Installation

### Test 1: Can You See the Login Page?
1. Open `http://localhost:3000`
2. Should see login form
3. Should see "Login" heading
4. Should see email and password fields

### Test 2: Can You Register?
1. Click "Register" link
2. Fill in form:
   - Email: `test@example.com`
   - Password: `Password123!`
3. Click "Register"
4. Should redirect to dashboard

### Test 3: Can You Logout?
1. On dashboard, click "Logout"
2. Should redirect to login page

**If all 3 tests pass → ✅ Frontend is working!**

---

## 🧪 Run Tests

### Unit Tests
```bash
cd frontend
npm test
```
**Expected**: 15/15 tests passing

### E2E Tests
```bash
# From project root
npx playwright test
```
**Expected**: 13/15 tests passing (2 known E2E timing issues)

---

## 📚 Next Steps

1. **Manual Testing**: See [FRONTEND_MANUAL_TESTING.md](./FRONTEND_MANUAL_TESTING.md)
2. **Status Overview**: See [FRONTEND_STATUS.md](./FRONTEND_STATUS.md)
3. **Full Documentation**: See [FRONTEND_TEMPLATE_PLAN.md](./FRONTEND_TEMPLATE_PLAN.md)

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### CORS Errors
- Check backend is running on port 3001
- Check `backend/.env` has `FRONTEND_URL=http://localhost:3000`

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf dist node_modules/.vite
npm run build
```

---

## 📖 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues
```

---

**Need Help?** Check [FRONTEND_STATUS.md](./FRONTEND_STATUS.md) for detailed status and [ISSUES_LOG.md](./ISSUES_LOG.md) for known issues.

