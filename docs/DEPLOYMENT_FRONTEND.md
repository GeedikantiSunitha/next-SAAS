# NextSaaS - Frontend Deployment Guide

**Last Updated**: January 2025  
**Status**: Production Ready  
**Version**: 1.0.0

---

## 🎯 Overview

This guide provides comprehensive step-by-step instructions for deploying the NextSaaS frontend to production environments. The frontend is built with React + Vite and can be deployed to various platforms.

**Prerequisites**:
- ✅ Backend deployed and accessible
- ✅ Backend URL known
- ✅ Frontend build tested locally
- ✅ Environment variables documented

**Important**: Vite environment variables are **build-time only**. They must be set during the Docker build process, not at runtime.

---

## 📋 Pre-Deployment Checklist

### 1. Backend Status ✅
- [ ] Backend deployed successfully
- [ ] Backend URL accessible (e.g., `https://api.yourdomain.com`)
- [ ] Health endpoint working (`/api/health`)
- [ ] CORS configured (or ready to update after frontend deployment)
- [ ] Database connected

### 2. Frontend Configuration ✅
- [ ] `VITE_API_BASE_URL` value determined
- [ ] Dockerfile exists in `frontend/` directory
- [ ] `nginx.conf` configured for SPA routing
- [ ] Build tested locally (`npm run build`)

### 3. Build Configuration ✅
- [ ] Dockerfile uses build arguments
- [ ] Multi-stage build configured
- [ ] Nginx serving static files
- [ ] Health check configured

---

## 🔧 Step 1: Determine Backend URL

Before deploying frontend, ensure you have:

1. **Backend URL**: The full URL where your backend is accessible
   - Example: `https://api.yourdomain.com`
   - Example: `https://backend-xxxxx.railway.app`
   - Example: `https://backend-xxxxx.render.com`

2. **API Base Path**: Usually `/api` (default)
   - Full API URL: `https://api.yourdomain.com/api`

**Note**: The frontend will make API calls to `${VITE_API_BASE_URL}/api/...`

---

## 📝 Step 2: Environment Variables

### Build-Time Variables (Required)

These must be set as **Docker build arguments**, not runtime environment variables:

```bash
VITE_API_BASE_URL=https://your-backend-domain.com
```

**Important**: 
- Vite environment variables are injected at build time
- They cannot be changed after the image is built
- Must be set as build arguments in your deployment platform
- The code uses `VITE_API_BASE_URL` (not `VITE_API_URL`)

### Runtime Variables (None Required)

The frontend is a static SPA - no runtime environment variables needed.

---

## 🚀 Step 3: Platform-Specific Deployment

### Option A: Docker-Based Deployment (Recommended)

Works for: Railway, Render, DigitalOcean App Platform, AWS ECS, Google Cloud Run, Azure Container Instances

#### 3.1: Prepare Dockerfile

Ensure `frontend/Dockerfile` exists and includes:
- Multi-stage build (Node.js builder + nginx production)
- Build argument for `VITE_API_URL`
- Nginx configuration for SPA routing
- Health check endpoint

#### 3.2: Configure Platform

**Railway / Render / DigitalOcean**:
1. Connect your Git repository
2. Set root directory to `frontend/`
3. Set Dockerfile path to `frontend/Dockerfile` (or auto-detect)
4. Set port to `80` (nginx default)
5. **Add build argument**:
   ```
   VITE_API_BASE_URL=https://your-backend-domain.com
   ```
6. Deploy

**AWS ECS / Google Cloud Run / Azure**:
1. Build Docker image with build argument:
   ```bash
   docker build \
     --build-arg VITE_API_BASE_URL=https://your-backend-domain.com \
     -t nextsaas-frontend \
     ./frontend
   ```
2. Push to container registry
3. Create service/container instance
4. Set port to 80
5. Deploy

---

### Option B: Static Hosting (Recommended for Simple Deployments)

Works for: Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront, GitHub Pages

#### 3.1: Build Locally

```bash
cd frontend

# Set environment variable
export VITE_API_BASE_URL=https://your-backend-domain.com

# Build
npm run build

# Output will be in frontend/dist/
```

#### 3.2: Deploy to Platform

**Vercel**:
1. Install Vercel CLI: `npm i -g vercel`
2. In `frontend/` directory, run: `vercel`
3. Set environment variable during setup:
   - Variable: `VITE_API_BASE_URL`
   - Value: `https://your-backend-domain.com`
4. Vercel will build and deploy automatically

**Netlify**:
1. Connect repository in Netlify dashboard
2. Set build directory: `frontend`
3. Set build command: `npm run build`
4. Set publish directory: `frontend/dist`
5. Add environment variable:
   - Variable: `VITE_API_BASE_URL`
   - Value: `https://your-backend-domain.com`
6. Deploy

**Cloudflare Pages**:
1. Connect repository in Cloudflare dashboard
2. Set build directory: `frontend`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable:
   - Variable: `VITE_API_BASE_URL`
   - Value: `https://your-backend-domain.com`
6. Deploy

**AWS S3 + CloudFront**:
1. Build locally (see Step 3.1)
2. Upload `frontend/dist/` contents to S3 bucket
3. Configure S3 bucket for static website hosting
4. Set up CloudFront distribution
5. Configure CloudFront to serve `index.html` for all routes (SPA routing)

---

### Option C: Traditional Server Deployment

Works for: VPS, dedicated servers, EC2, DigitalOcean Droplets

#### 3.1: Build Locally or on Server

```bash
cd frontend

# Set environment variable
export VITE_API_BASE_URL=https://your-backend-domain.com

# Install dependencies
npm install

# Build
npm run build
```

#### 3.2: Serve with Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/nextsaas-frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

## ✅ Step 4: Verify Deployment

### 4.1: Check Frontend Loads

1. **Open frontend URL** in browser
2. **Check browser console** for errors
3. **Verify no 404 errors** for assets (CSS, JS, images)

### 4.2: Test API Connectivity

1. **Open browser DevTools** → Network tab
2. **Navigate through the app** (login, register, etc.)
3. **Check API calls**:
   - API calls should go to your backend URL
   - No CORS errors
   - Responses are successful (200, 201, etc.)

### 4.3: Test Authentication Flow

1. **Register a new user**
2. **Login with credentials**
3. **Verify dashboard loads**
4. **Check profile page**
5. **Test logout**

### 4.4: Test SPA Routing

1. **Navigate to a route** (e.g., `/profile`)
2. **Refresh the page** - should still load (not 404)
3. **Test direct URL access** - should work

---

## 🔧 Step 5: Update Backend CORS

Once frontend is deployed, update backend CORS:

1. **Get Frontend URL** from your deployment platform
   - Example: `https://nextsaas-frontend-xxxxx.railway.app`
   - Example: `https://yourdomain.com`

2. **Go to Backend Service** → Environment Variables

3. **Update**:
   ```env
   FRONTEND_URL=https://your-frontend-url
   ALLOWED_ORIGINS=https://your-frontend-url
   ```

4. **Restart/Redeploy Backend** (CORS changes require restart)

**Important**: CORS errors will occur until backend is updated and restarted.

---

## 🐛 Troubleshooting

### Issue 1: API Calls Fail - Wrong URL

**Symptom**: API calls go to wrong backend URL or fail

**Check**:
- Verify `VITE_API_BASE_URL` build argument was set correctly
- Check browser console Network tab to see actual API URL being called
- Verify `frontend/src/api/client.ts` uses `import.meta.env.VITE_API_BASE_URL`

**Solution**:
- Rebuild frontend with correct `VITE_API_BASE_URL` build argument
- For static hosting, ensure environment variable is set in platform settings

### Issue 2: CORS Errors

**Symptom**:
```
Access to XMLHttpRequest blocked by CORS policy
Origin 'https://frontend-url' is not allowed by Access-Control-Allow-Origin
```

**Solution**:
1. Get frontend URL from deployment platform
2. Update backend `FRONTEND_URL` and `ALLOWED_ORIGINS` environment variables
3. Restart/redeploy backend
4. Clear browser cache and retry

### Issue 3: 404 Errors on Routes

**Symptom**: Direct URL access (e.g., `/profile`) returns 404

**Check**:
- Verify nginx configuration has SPA routing (`try_files $uri $uri/ /index.html`)
- For static hosting, check platform SPA routing configuration
- Verify `index.html` is served for all routes

**Solution**:
- For Docker: Check `frontend/nginx.conf` configuration
- For static hosting: Configure platform to serve `index.html` for all routes
- For Vercel: Create `vercel.json` with rewrites
- For Netlify: Create `_redirects` file in `public/` directory

### Issue 4: Build Fails

**Symptom**: Docker build or platform build fails

**Check**:
- Build argument `VITE_API_BASE_URL` is set
- Node version compatibility (requires Node 18+)
- Package.json scripts are correct
- No TypeScript errors

**Solution**:
- Verify build argument is set in platform settings
- Check build logs for specific errors
- Test build locally first: `npm run build`

### Issue 5: Assets Not Loading (404)

**Symptom**: CSS, JS, or image files return 404

**Check**:
- Build output directory is correct (`dist/`)
- Assets are in the correct location
- Base path configuration (if using subdirectory)

**Solution**:
- Verify build output: `ls frontend/dist/`
- Check nginx/static host configuration serves assets correctly
- For subdirectory deployments, configure `base` in `vite.config.ts`

### Issue 6: Environment Variable Not Working

**Symptom**: `VITE_API_BASE_URL` not being used, API calls go to wrong URL

**Check**:
- Variable name must start with `VITE_`
- Build argument was set during build (not runtime)
- Code uses `import.meta.env.VITE_API_BASE_URL`

**Solution**:
- Rebuild with correct build argument
- For static hosting, set environment variable in platform settings before build
- Verify variable is accessible: `console.log(import.meta.env.VITE_API_BASE_URL)`

---

## 📊 Deployment Verification Checklist

After deployment, verify:

- [ ] Frontend service is "Running" or "Active"
- [ ] Frontend URL accessible in browser
- [ ] No console errors
- [ ] No 404 errors for assets
- [ ] API calls working (check Network tab)
- [ ] No CORS errors
- [ ] Authentication flow working
- [ ] SPA routing working (refresh on routes)
- [ ] Backend CORS updated with frontend URL
- [ ] Backend restarted (if CORS updated)
- [ ] Complete user workflows tested

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

**Railway / Render / DigitalOcean**:
1. Go to frontend service → Settings → Auto Deploy
2. Enable "Auto Deploy on Push"
3. Select branch: `main` (or your production branch)
4. **Important**: If `VITE_API_BASE_URL` changes, update build argument in platform settings

**Vercel / Netlify / Cloudflare Pages**:
- Auto-deploy is usually enabled by default
- Environment variables persist across deployments
- Update `VITE_API_BASE_URL` in platform settings if backend URL changes

### Manual Redeploy

1. Go to service dashboard
2. Click "Redeploy" or trigger new build
3. Monitor build logs
4. Verify deployment

---

## 📝 Platform-Specific Notes

### Vercel

- Environment variables are set in project settings (use `VITE_API_BASE_URL`)
- Automatic builds on git push
- SPA routing handled automatically
- Custom domain support

### Netlify

- Environment variables in site settings (use `VITE_API_BASE_URL`)
- Build hooks available
- SPA routing via `_redirects` file
- Custom domain support

### Railway / Render

- Build arguments set in service settings
- Docker-based deployment
- Custom domain support
- Auto-deploy on git push

### AWS S3 + CloudFront

- Manual upload or CI/CD pipeline
- CloudFront handles caching
- SPA routing via CloudFront functions or Lambda@Edge
- Custom domain via Route 53

---

## 📝 Next Steps

After frontend is deployed:

1. **Update Backend CORS** with frontend URL
2. **Test Complete Flow**:
   - User registration
   - User login
   - Profile management
   - Admin features
   - Payment processing (if enabled)
3. **Set Up Custom Domain** (optional)
4. **Configure SSL/TLS** (if using custom domain)
5. **Set Up Monitoring** (optional - error tracking, analytics)

---

## 🔗 Related Documentation

- `docs/DEPLOYMENT_BACKEND.md` - Backend deployment guide
- `docs/ACTION_PLAN_8_TO_10.md` - Improvement roadmap
- `frontend/README.md` - Frontend setup and development
- `frontend/Dockerfile` - Docker configuration
- `frontend/nginx.conf` - Nginx configuration
- `frontend/.env.example` - Environment variable template

---

## 📋 Key Points

1. **Build Arguments**: `VITE_API_BASE_URL` must be set as build argument, not runtime env var
2. **Variable Name**: The code uses `VITE_API_BASE_URL` (not `VITE_API_URL`)
3. **CORS**: Update backend CORS after frontend deployment
4. **SPA Routing**: Configure platform to serve `index.html` for all routes
5. **Health Check**: Frontend has health check at `/health` (if using Docker)
6. **Static Assets**: Cache static assets (1 year), don't cache HTML
7. **Environment Variables**: Only `VITE_*` variables are available in frontend code

---

**Document Version**: 1.0  
**Created**: January 2025  
**Status**: Production Ready  
**Maintained By**: NextSaaS Team
