# Microservices Support: Dual Architecture Template

## Can One Template Support Both Monolith and Microservices?

**Answer: Yes, with careful design.** This document outlines how to design a template that works for both architectures.

---

## 🎯 Core Strategy

### The Key Insight

**Make modules truly independent**. Each module should be able to run as:
- **Monolith**: All modules in one service (in-process)
- **Microservices**: Each module as separate service (inter-process)

---

## 📊 Architecture Comparison

### Monolith Architecture

```
┌─────────────────────────────────────┐
│         Monolith Service            │
│  ┌─────────┬─────────┬──────────┐  │
│  │  Auth   │ Payment │ Email    │  │
│  │ Module  │ Module  │ Module   │  │
│  └─────────┴─────────┴──────────┘  │
│         (All in-process)            │
└─────────────────────────────────────┘
```

### Microservices Architecture

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Auth    │  │ Payment  │  │  Email   │
│ Service  │  │ Service  │  │ Service  │
│          │  │          │  │          │
│ Port:    │  │ Port:    │  │ Port:    │
│  3001    │  │  3002    │  │  3003    │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┴─────────────┘
              │
     ┌────────▼────────┐
     │  API Gateway    │
     │   (Optional)    │
     └─────────────────┘
```

---

## 🏗️ Required Design Changes

### 1. Module Independence

**Requirement**: Each module must be **completely independent**.

**Current (Monolith)**:
```javascript
// modules/auth/service.js
const userService = require('../users/service'); // Direct import
```

**Microservices-Ready**:
```javascript
// modules/auth/service.js
const userService = require('../core/serviceClient')('users'); // Abstracted
```

**Implementation**:
- Create **Service Client Abstraction Layer**
- In monolith: Service client resolves to in-process module
- In microservices: Service client makes HTTP/gRPC calls

---

### 2. Service Communication Abstraction

**Create Communication Layer** (`core/communication/`):

```javascript
// core/communication/serviceClient.js
class ServiceClient {
  constructor(serviceName, config) {
    this.serviceName = serviceName;
    this.mode = config.MODE; // 'monolith' or 'microservices'
    this.baseUrl = config[`${serviceName.toUpperCase()}_SERVICE_URL`];
  }

  async call(method, path, data) {
    if (this.mode === 'monolith') {
      // In-process call (same process)
      return this.inProcessCall(method, path, data);
    } else {
      // HTTP/gRPC call (different service)
      return this.httpCall(method, path, data);
    }
  }

  async inProcessCall(method, path, data) {
    // Load module from same process
    const module = require(`../modules/${this.serviceName}`);
    return module.handle(method, path, data);
  }

  async httpCall(method, path, data) {
    // Make HTTP request to another service
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

module.exports = ServiceClient;
```

---

### 3. Service Discovery (Microservices Only)

**Requirement**: Services need to find each other.

**Implementation Options**:

#### Option A: Environment Variables (Simple)
```env
AUTH_SERVICE_URL=http://auth-service:3001
PAYMENT_SERVICE_URL=http://payment-service:3002
EMAIL_SERVICE_URL=http://email-service:3003
```

#### Option B: Service Registry (Advanced)
```javascript
// core/communication/serviceRegistry.js
class ServiceRegistry {
  constructor() {
    this.services = new Map();
  }

  register(name, url) {
    this.services.set(name, url);
  }

  discover(name) {
    return this.services.get(name);
  }
}
```

---

### 4. Cross-Service Authentication

**Requirement**: Services need to authenticate with each other.

**Implementation**:

```javascript
// core/auth/serviceAuth.js
class ServiceAuth {
  generateServiceToken(serviceName) {
    // Generate JWT token for service-to-service communication
    return jwt.sign(
      { service: serviceName, type: 'service' },
      process.env.SERVICE_SECRET,
      { expiresIn: '1h' }
    );
  }

  verifyServiceToken(token) {
    // Verify service token
    return jwt.verify(token, process.env.SERVICE_SECRET);
  }
}

// Middleware for service authentication
const serviceAuth = (req, res, next) => {
  const token = req.headers['x-service-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'Service token required' });
  }

  try {
    const decoded = serviceAuth.verifyServiceToken(token);
    req.service = decoded.service;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid service token' });
  }
};
```

---

### 5. Distributed Tracing

**Requirement**: Track requests across multiple services.

**Implementation**:

```javascript
// core/tracing/requestContext.js
class RequestContext {
  constructor(req) {
    this.requestId = req.headers['x-request-id'] || uuidv4();
    this.traceId = req.headers['x-trace-id'] || uuidv4();
    this.spanId = uuidv4();
    this.parentSpanId = req.headers['x-span-id'];
  }

  propagate() {
    return {
      'x-request-id': this.requestId,
      'x-trace-id': this.traceId,
      'x-span-id': this.spanId
    };
  }
}

// Middleware to propagate context
const propagateContext = (req, res, next) => {
  req.context = new RequestContext(req);
  res.setHeader('X-Request-ID', req.context.requestId);
  next();
};
```

---

### 6. Configuration Management

**Requirement**: Different config for monolith vs microservices.

**Implementation**:

```javascript
// config/index.js
const mode = process.env.ARCHITECTURE_MODE || 'monolith'; // 'monolith' or 'microservices'

const config = {
  mode,
  services: {
    auth: {
      url: mode === 'monolith' 
        ? 'internal' 
        : process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'
    },
    payment: {
      url: mode === 'monolith'
        ? 'internal'
        : process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3002'
    },
    email: {
      url: mode === 'monolith'
        ? 'internal'
        : process.env.EMAIL_SERVICE_URL || 'http://email-service:3003'
    }
  }
};

module.exports = config;
```

---

### 7. Independent Databases (Optional)

**Requirement**: Each service can have its own database (microservices pattern).

**Implementation**:

```javascript
// config/database.js
const mode = process.env.ARCHITECTURE_MODE || 'monolith';

const databases = {
  monolith: {
    url: process.env.DATABASE_URL // Single database
  },
  microservices: {
    auth: {
      url: process.env.AUTH_DATABASE_URL
    },
    payment: {
      url: process.env.PAYMENT_DATABASE_URL
    },
    email: {
      url: process.env.EMAIL_DATABASE_URL
    }
  }
};

module.exports = databases[mode];
```

---

## 📦 Module Structure Redesign

### Current Structure (Monolith-Only)

```
modules/
├── auth/
│   ├── routes.js
│   ├── service.js
│   └── repository.js
├── payments/
│   ├── routes.js
│   ├── service.js
│   └── repository.js
```

### Dual-Mode Structure (Monolith + Microservices)

```
modules/
├── auth/
│   ├── server.js          # HTTP server (microservices mode)
│   ├── routes.js          # API routes
│   ├── service.js         # Business logic
│   ├── repository.js      # Data access
│   └── index.js           # Export (monolith mode)
├── payments/
│   ├── server.js
│   ├── routes.js
│   ├── service.js
│   ├── repository.js
│   └── index.js
├── core/
│   ├── communication/
│   │   ├── serviceClient.js    # Abstraction layer
│   │   └── serviceRegistry.js
│   ├── auth/
│   │   └── serviceAuth.js      # Service-to-service auth
│   └── tracing/
│       └── requestContext.js   # Distributed tracing
```

---

## 🔧 Implementation Pattern

### Example: Auth Module (Dual-Mode)

```javascript
// modules/auth/index.js (Monolith Mode)
const authService = require('./service');
const authRoutes = require('./routes');

module.exports = {
  service: authService,
  routes: authRoutes,
  handle: async (method, path, data) => {
    // Handle in-process calls
    return authService.handleRequest(method, path, data);
  }
};
```

```javascript
// modules/auth/server.js (Microservices Mode)
const express = require('express');
const authRoutes = require('./routes');
const { serviceAuth } = require('../core/auth/serviceAuth');

const app = express();
app.use(express.json());
app.use(serviceAuth); // Service-to-service auth
app.use('/api', authRoutes);

const PORT = process.env.AUTH_SERVICE_PORT || 3001;

if (require.main === module) {
  // Run as standalone service
  app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
  });
}

module.exports = app;
```

---

## 🚀 Deployment Configurations

### Monolith Deployment (docker-compose.monolith.yml)

```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      - ARCHITECTURE_MODE=monolith
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: app_db
```

### Microservices Deployment (docker-compose.microservices.yml)

```yaml
version: '3.8'

services:
  auth-service:
    build: .
    command: node modules/auth/server.js
    environment:
      - ARCHITECTURE_MODE=microservices
      - AUTH_DATABASE_URL=postgresql://user:pass@auth-db:5432/auth_db
      - PORT=3001
    ports:
      - "3001:3001"
    depends_on:
      - auth-db

  payment-service:
    build: .
    command: node modules/payment/server.js
    environment:
      - ARCHITECTURE_MODE=microservices
      - PAYMENT_DATABASE_URL=postgresql://user:pass@payment-db:5432/payment_db
      - AUTH_SERVICE_URL=http://auth-service:3001
      - PORT=3002
    ports:
      - "3002:3002"
    depends_on:
      - payment-db
      - auth-service

  email-service:
    build: .
    command: node modules/email/server.js
    environment:
      - ARCHITECTURE_MODE=microservices
      - EMAIL_DATABASE_URL=postgresql://user:pass@email-db:5432/email_db
      - PORT=3003
    ports:
      - "3003:3003"
    depends_on:
      - email-db

  # Databases (one per service)
  auth-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: auth_db

  payment-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: payment_db

  email-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: email_db

  # Optional: API Gateway
  api-gateway:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

---

## 📋 Required New Modules

### 1. Service Client Abstraction (`core/communication/serviceClient.js`)

**Purpose**: Abstract service-to-service communication.

**Features**:
- In-process calls (monolith)
- HTTP calls (microservices)
- Retry logic
- Circuit breaker pattern
- Request/response logging

---

### 2. Service Authentication (`core/auth/serviceAuth.js`)

**Purpose**: Authenticate service-to-service calls.

**Features**:
- Service token generation
- Service token verification
- Token rotation
- Service registry integration

---

### 3. Distributed Tracing (`core/tracing/requestContext.js`)

**Purpose**: Track requests across services.

**Features**:
- Request ID propagation
- Trace ID generation
- Span tracking
- Integration with OpenTelemetry/Jaeger

---

### 4. Configuration Manager (`config/index.js`)

**Purpose**: Manage configuration for both architectures.

**Features**:
- Architecture mode detection
- Service URL resolution
- Database URL resolution
- Feature flags per architecture

---

## 🎯 Usage Patterns

### Starting in Monolith Mode

```bash
# .env
ARCHITECTURE_MODE=monolith
DATABASE_URL=postgresql://localhost:5432/app_db

# Run
npm start
# All modules run in one process
```

### Starting in Microservices Mode

```bash
# docker-compose up
docker-compose -f docker-compose.microservices.yml up

# Or individually
ARCHITECTURE_MODE=microservices node modules/auth/server.js
ARCHITECTURE_MODE=microservices node modules/payment/server.js
```

---

## ✅ Benefits of Dual-Mode Design

1. **Flexibility**: Use monolith for development, microservices for production
2. **Scalability**: Start simple, scale when needed
3. **Learning**: Easier to understand monolith, then migrate to microservices
4. **Cost**: Monolith is cheaper initially, microservices when scaling

---

## ⚠️ Challenges & Considerations

### 1. **Complexity**

**Challenge**: Supporting both architectures increases complexity.

**Solution**: 
- Keep abstraction layer minimal
- Default to monolith (simpler)
- Microservices is opt-in via config

### 2. **Testing**

**Challenge**: Need to test both modes.

**Solution**:
- Test modules independently (unit tests)
- Test monolith integration (integration tests)
- Test microservices separately (E2E tests)

### 3. **Development Experience**

**Challenge**: Different dev workflows for each mode.

**Solution**:
- Default to monolith for local dev (faster)
- Provide scripts for microservices dev
- Clear documentation for both modes

### 4. **Performance**

**Challenge**: Network calls in microservices add latency.

**Solution**:
- Use connection pooling
- Implement caching
- Use async/event-driven patterns
- Monitor and optimize

---

## 📊 Decision Matrix

| Scenario | Recommended Mode | Reason |
|----------|-----------------|---------|
| Small team, simple app | Monolith | Faster development, less complexity |
| High traffic, need scaling | Microservices | Independent scaling |
| Different release cycles | Microservices | Deploy services independently |
| Tight coupling | Monolith | Easier to manage |
| Multiple teams | Microservices | Teams own different services |
| Startup/MVP | Monolith | Faster to market |

---

## 🚀 Migration Path

### Phase 1: Start with Monolith

1. Build all modules in monolith mode
2. Test thoroughly
3. Deploy as monolith

### Phase 2: Identify Boundaries

1. Identify modules that need independent scaling
2. Identify modules with different release cycles
3. Identify performance bottlenecks

### Phase 3: Extract Services

1. Extract one module to microservice
2. Update service client configuration
3. Test in microservices mode
4. Deploy both (gradual migration)

### Phase 4: Full Microservices (Optional)

1. Extract all modules
2. Add API Gateway
3. Add service mesh (if needed)
4. Optimize for distributed system

---

## 📝 Implementation Checklist

### Core Infrastructure

- [ ] Service Client Abstraction Layer
- [ ] Service Authentication System
- [ ] Distributed Tracing Support
- [ ] Configuration Manager
- [ ] Request Context Propagation

### Module Updates

- [ ] Each module has `server.js` (microservices)
- [ ] Each module has `index.js` (monolith)
- [ ] Modules use Service Client (not direct imports)
- [ ] Modules support both modes

### Deployment

- [ ] Docker Compose for monolith
- [ ] Docker Compose for microservices
- [ ] Kubernetes manifests (optional)
- [ ] Environment configuration templates

### Documentation

- [ ] Architecture decision record
- [ ] Migration guide (monolith → microservices)
- [ ] Development setup for both modes
- [ ] Deployment guide for both modes

### Testing

- [ ] Unit tests (module-independent)
- [ ] Integration tests (monolith mode)
- [ ] E2E tests (microservices mode)
- [ ] Performance tests (both modes)

---

## 🎯 Recommended Approach

### Start Simple

1. **Build monolith first** (easier, faster)
2. **Make modules independent** (use service client abstraction)
3. **Test thoroughly** (ensure modules work independently)
4. **Add microservices support later** (when needed)

### Key Principle

**Design for microservices, deploy as monolith initially.**

This means:
- ✅ Use service client abstraction from start
- ✅ Keep modules independent
- ✅ Avoid tight coupling
- ✅ But deploy everything in one process initially

---

## 💡 Quick Reference

### Monolith Mode
```bash
ARCHITECTURE_MODE=monolith npm start
```

### Microservices Mode
```bash
docker-compose -f docker-compose.microservices.yml up
```

### Switch Between Modes
Just change `ARCHITECTURE_MODE` environment variable. No code changes needed!

---

**Remember**: Start with monolith, add microservices support as an option. Don't over-engineer upfront. Build it when you need it.


