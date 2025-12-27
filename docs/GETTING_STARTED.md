# 🚀 Getting Started

This template is **production-ready**. Follow these steps to start building your application.

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed and running
- Resend API key (for emails)

---

## Quick Start (5 minutes)

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/app_db

# JWT Secrets (generate secure values)
JWT_SECRET=your-secure-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters

# Email (Get from resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
APP_NAME=Your App Name

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Setup Database

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run Tests

```bash
npm test
```

**Expected**: 89/89 tests passing ✅

### 5. Start Development Server

```bash
npm run dev
```

**Server running at**: `http://localhost:3000`

---

## Test the API

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Copy the `accessToken` from response.

### Get Current User

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Available Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Health
- `GET /api/health` - Health check
- `GET /api/health/db` - Database health

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Unread count
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all read
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences

### Audit
- `GET /api/audit` - Get audit logs
- `GET /api/audit/stats` - Get statistics
- `GET /api/audit/user/:userId` - User logs
- `GET /api/audit/:id` - Specific log

### RBAC
- `GET /api/rbac/me/role` - Get own role
- `GET /api/rbac/me/permissions` - Get permissions
- `GET /api/rbac/users/role/:role` - List by role (admin)
- `PUT /api/rbac/users/:userId/role` - Update role (super admin)

---

## What's Included

### ✅ Complete Features
- Authentication (JWT + Refresh tokens)
- Email notifications (Resend + templates)
- In-app notifications
- Audit logging
- RBAC & permissions
- Security hardening
- Error handling
- Structured logging

### ✅ Quality
- 89/89 tests passing
- TypeScript strict mode
- ESLint configured
- Zero technical debt
- Production-ready

---

## Next Steps

### Start Building Your App

1. **Add your business models** to `prisma/schema.prisma`
2. **Create services** in `src/services/`
3. **Add routes** in `src/routes/`
4. **Write tests** in `src/__tests__/`
5. **Use existing modules**: Email, Notifications, Audit, RBAC

### Example: Add a Blog Post Feature

```typescript
// 1. Add to schema
model Post {
  id        String   @id @default(uuid())
  userId    String
  title     String
  content   String
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}

// 2. Create service (src/services/postService.ts)
export const createPost = async (userId: string, data: any) => {
  const post = await prisma.post.create({
    data: { ...data, userId }
  });
  
  // Use audit logging
  await createAuditLog({
    userId,
    action: 'POST_CREATED',
    resource: 'posts',
    resourceId: post.id,
  });
  
  // Send notification
  await createNotification({
    userId,
    type: 'SUCCESS',
    channel: 'IN_APP',
    title: 'Post Published',
    message: 'Your post has been published!',
  });
  
  return post;
};

// 3. Add route (src/routes/posts.ts)
router.post('/', authenticate, async (req, res) => {
  const post = await createPost(req.user!.id, req.body);
  res.json({ success: true, data: post });
});
```

---

## Documentation

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Current status
- **[docs/PHASE2_FINAL.md](./docs/PHASE2_FINAL.md)** - Complete Phase 2 summary
- **[docs/IMPLEMENTATION_REVIEW.md](./docs/IMPLEMENTATION_REVIEW.md)** - Detailed review
- **[backend/docs/EMAIL_SERVICE.md](./backend/docs/EMAIL_SERVICE.md)** - Email API
- **[backend/docs/RBAC_SERVICE.md](./backend/docs/RBAC_SERVICE.md)** - RBAC API

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U YOUR_USERNAME -d app_db

# Verify DATABASE_URL in .env
# For macOS: postgresql://YOUR_MAC_USERNAME@localhost:5432/app_db
# For Linux: postgresql://postgres:password@localhost:5432/app_db
```

### Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests
npm test
```

### Build Errors

```bash
# Clean rebuild
rm -rf dist node_modules
npm install
npm run build
```

---

## Support

- Check [ISSUES_LOG.md](./docs/ISSUES_LOG.md) for common issues
- Review [docs/](./docs/) folder for detailed documentation
- All 13 previous issues documented with solutions

---

**Ready to build!** 🚀
