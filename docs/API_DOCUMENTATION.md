# NextSaaS - API Documentation Guide

**Last Updated**: January 2025  
**Status**: Production Ready  
**Version**: 1.0.0

---

## 🎯 Overview

The NextSaaS backend API uses **Swagger/OpenAPI** for comprehensive API documentation. The documentation is automatically generated from JSDoc comments in the route files and is accessible via Swagger UI.

**Documentation Access**:
- **Development**: `http://localhost:3001/api-docs`
- **Production**: `https://your-backend-url/api-docs` (if `ENABLE_SWAGGER=true`)

---

## 📋 Current Status

### ✅ What's Working

1. **Swagger/OpenAPI Setup**: Fully configured
   - OpenAPI 3.0 specification
   - Swagger UI integrated
   - JSDoc annotation parsing
   - Automatic schema generation

2. **Documented Routes**: Many routes already have Swagger annotations
   - Profile routes (`/api/profile/*`)
   - Observability routes (`/api/observability/*`)
   - Feature Flags (`/api/feature-flags/*`)
   - Admin routes (`/api/admin/*`)
   - Health routes (`/api/health/*`)

3. **Documentation Features**:
   - Authentication documentation (cookie-based)
   - Request/response schemas
   - Error responses
   - Tag-based organization
   - Interactive testing via Swagger UI

### ⚠️ What Needs Work

1. **Route Coverage**: Not all routes have complete Swagger annotations
   - Auth routes (partial)
   - Payment routes (partial)
   - GDPR routes (partial)
   - Notification routes (needs verification)
   - Newsletter routes (needs verification)
   - RBAC routes (needs verification)

2. **Schema Definitions**: Could be expanded
   - More detailed request/response schemas
   - Reusable component schemas
   - Validation rules documentation

---

## 📖 How to Use API Documentation

### Accessing Swagger UI

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Open Swagger UI**:
   - Navigate to: `http://localhost:3001/api-docs`
   - You'll see the interactive API documentation

3. **Explore Endpoints**:
   - Click on any endpoint to expand details
   - View request parameters, request body, and responses
   - Try out endpoints directly from the UI (after authentication)

### Accessing OpenAPI JSON

The OpenAPI specification is available as JSON:

- **Endpoint**: `http://localhost:3001/api-docs/swagger.json`
- **Use Cases**:
  - Import into Postman/Insomnia
  - Generate client SDKs
  - Use with API testing tools
  - Documentation generators

### Using the Documentation

1. **Browse by Tags**:
   - Endpoints are organized by tags (Authentication, Profile, Admin, etc.)
   - Click on a tag to see all endpoints in that category

2. **Test Endpoints**:
   - Click "Try it out" on any endpoint
   - Fill in parameters
   - Execute the request
   - View response

3. **Authentication**:
   - Most endpoints require authentication
   - Authentication is cookie-based (HTTP-only cookies)
   - Login via `/api/auth/login` first to get cookies
   - Cookies are automatically sent with requests in browser

---

## 🔧 Enabling Documentation in Production

By default, Swagger UI is only available in development. To enable it in production:

1. **Set Environment Variable**:
   ```env
   ENABLE_SWAGGER=true
   ```

2. **Restart Service**:
   - Swagger UI will be available at `/api-docs`

3. **Security Consideration**:
   - Consider restricting access to `/api-docs` in production
   - Use authentication/authorization if exposing publicly
   - Or restrict to internal network/VPN only

---

## 📝 Adding Documentation to Routes

### Basic Swagger Annotation

Add JSDoc comments above route handlers:

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Get example data
 *     tags: [Example]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/example', authenticate, asyncHandler(async (req, res) => {
  // Route handler
}));
```

### Complete Example

```typescript
/**
 * @swagger
 * /api/example/{id}:
 *   get:
 *     summary: Get example by ID
 *     tags: [Example]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Example ID
 *     responses:
 *       200:
 *         description: Example data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "Example"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  // Route handler
}));
```

### POST/PUT/PATCH with Request Body

```typescript
/**
 * @swagger
 * /api/example:
 *   post:
 *     summary: Create example
 *     tags: [Example]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Example Name"
 *               description:
 *                 type: string
 *                 example: "Example description"
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, validate([...]), asyncHandler(async (req, res) => {
  // Route handler
}));
```

---

## 🏷️ Available Tags

Routes are organized by tags. Current tags (defined in `backend/src/config/swagger.ts`):

- **Authentication** - User authentication and authorization
- **Profile** - User profile management
- **Notifications** - Notification management
- **Admin** - Admin-only endpoints
- **Payments** - Payment processing
- **GDPR** - GDPR compliance features
- **Newsletter** - Newsletter management
- **Observability** - System monitoring and metrics

---

## 🔒 Authentication in Documentation

The API uses **cookie-based authentication**:

1. **Login** via `/api/auth/login` to get HTTP-only cookies
2. **Cookies are automatically sent** with subsequent requests in browser
3. **Swagger UI** handles cookies automatically when testing in browser

**Security Scheme**: `cookieAuth` (defined in swagger config)

---

## 📚 Available Schemas

Common schemas are defined in `backend/src/config/swagger.ts`:

- **Error** - Standard error response
- **Success** - Standard success response
- **User** - User object schema

Reference schemas in annotations:
```typescript
schema:
  $ref: '#/components/schemas/User'
```

---

## 🔄 Generating Documentation

Documentation is automatically generated when the server starts:

1. **Swagger JSdoc** scans route files for `@swagger` annotations
2. **OpenAPI spec** is generated
3. **Swagger UI** serves the documentation at `/api-docs`

No manual generation step required!

---

## 📋 Documentation Checklist

For each route, document:

- [ ] **Summary** - Brief description
- [ ] **Tags** - Route category
- [ ] **Security** - Authentication requirements
- [ ] **Parameters** - Path, query, header parameters
- [ ] **Request Body** - For POST/PUT/PATCH
- [ ] **Responses** - All possible responses (200, 400, 401, 403, 404, 500)
- [ ] **Examples** - Request/response examples

---

## 🐛 Troubleshooting

### Issue 1: Documentation Not Showing

**Symptom**: `/api-docs` returns 404 or doesn't load

**Check**:
- Server is running
- `NODE_ENV` is not `production` OR `ENABLE_SWAGGER=true`
- Swagger UI is enabled in `backend/src/app.ts`

**Solution**:
- Set `ENABLE_SWAGGER=true` if in production
- Check server logs for errors
- Verify Swagger dependencies are installed

### Issue 2: Routes Not Documented

**Symptom**: Some routes don't appear in Swagger UI

**Check**:
- Routes have `@swagger` annotations
- Annotations follow correct format
- Route files are in `backend/src/routes/` directory
- Swagger config includes route files in `apis` array

**Solution**:
- Add Swagger annotations to routes
- Verify annotation format is correct
- Check Swagger config includes route patterns

### Issue 3: Schema Errors

**Symptom**: Documentation shows errors or invalid schemas

**Check**:
- Schema references are correct (`$ref: '#/components/schemas/...'`)
- Schema names match definitions
- Schema syntax is valid OpenAPI 3.0

**Solution**:
- Verify schema definitions in `backend/src/config/swagger.ts`
- Check schema reference paths
- Validate OpenAPI spec syntax

---

## 📖 Resources

### OpenAPI/Swagger Documentation
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

### Tools
- **Postman**: Import OpenAPI spec from `/api-docs/swagger.json`
- **Insomnia**: Import OpenAPI spec
- **Redoc**: Generate beautiful API documentation
- **Stoplight**: API design and documentation platform

---

## 🚀 Next Steps

### Improving Documentation

1. **Add Annotations to Missing Routes**:
   - Auth routes (complete coverage)
   - Payment routes (complete coverage)
   - GDPR routes (complete coverage)
   - Notification routes
   - Newsletter routes
   - RBAC routes

2. **Expand Schema Definitions**:
   - Add more reusable schemas
   - Document validation rules
   - Add more examples

3. **Enhance Examples**:
   - Add request/response examples
   - Include error response examples
   - Add authentication examples

---

## 🔗 Related Documentation

- `backend/src/config/swagger.ts` - Swagger configuration
- `backend/src/app.ts` - Swagger UI setup
- `backend/src/routes/*.ts` - Route files with annotations
- `docs/DEPLOYMENT_BACKEND.md` - Backend deployment guide

---

**Document Version**: 1.0  
**Created**: January 2025  
**Status**: Production Ready  
**Maintained By**: NextSaaS Team
