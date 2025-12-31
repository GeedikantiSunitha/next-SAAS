# Design Patterns
## NextSaaS - Design Patterns Used and Rationale

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes the design patterns used in NextSaaS, their implementation, and the rationale for their use.

---

## Creational Patterns

### 1. Factory Pattern

**Pattern**: Factory Method Pattern

**Location**: `backend/src/providers/PaymentProviderFactory.ts`

**Implementation**:
```typescript
export class PaymentProviderFactory {
  private static instance: IPaymentProvider | null = null;

  static getProvider(config?: ProviderConfig): IPaymentProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = config?.provider || paymentConfig.provider;

    let provider: IPaymentProvider;

    switch (providerType) {
      case 'STRIPE':
        provider = new StripeProvider();
        break;
      case 'RAZORPAY':
        provider = new RazorpayProvider();
        break;
      case 'CASHFREE':
        provider = new CashfreeProvider();
        break;
      default:
        throw new Error(`Unsupported provider: ${providerType}`);
    }

    provider.initialize(config);
    this.instance = provider;
    return provider;
  }
}
```

**Rationale**:
- ✅ Encapsulates provider creation logic
- ✅ Easy to add new payment providers
- ✅ Single point of provider instantiation
- ✅ Configuration-driven provider selection

**Benefits**:
- No need to modify code when adding new providers
- Provider selection based on environment configuration
- Consistent provider interface

---

### 2. Singleton Pattern

**Pattern**: Singleton Pattern

**Location**: `PaymentProviderFactory` (combined with Factory pattern)

**Implementation**:
```typescript
private static instance: IPaymentProvider | null = null;

static getProvider(): IPaymentProvider {
  if (this.instance) {
    return this.instance; // Return existing instance
  }
  // Create new instance
  this.instance = new StripeProvider();
  return this.instance;
}
```

**Rationale**:
- ✅ Single payment provider instance per application
- ✅ Prevents multiple provider initializations
- ✅ Efficient resource usage
- ✅ Consistent provider state

**Benefits**:
- Reduces memory usage
- Prevents connection pool exhaustion
- Ensures consistent provider configuration

---

## Structural Patterns

### 3. Repository Pattern

**Pattern**: Repository Pattern (via Prisma)

**Location**: Throughout codebase (implicit via Prisma)

**Implementation**:
```typescript
// Prisma acts as repository layer
const user = await prisma.user.findUnique({
  where: { id: userId }
});

const users = await prisma.user.findMany({
  where: { role: 'ADMIN' }
});

await prisma.user.create({
  data: { email, password, name }
});
```

**Rationale**:
- ✅ Abstracts database access
- ✅ Type-safe queries
- ✅ Easy to test (can mock Prisma)
- ✅ Database-agnostic business logic

**Benefits**:
- Business logic doesn't depend on database implementation
- Easy to switch databases (if needed)
- Type-safe database operations
- Automatic query optimization

---

### 4. Adapter Pattern

**Pattern**: Adapter Pattern

**Location**: Payment providers (`StripeProvider`, `RazorpayProvider`, `CashfreeProvider`)

**Implementation**:
```typescript
interface IPaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<PaymentIntent>;
  capturePayment(params: CapturePaymentParams): Promise<PaymentIntent>;
  refundPayment(params: RefundPaymentParams): Promise<RefundResult>;
}

// Each provider adapts its API to common interface
class StripeProvider implements IPaymentProvider {
  createPayment(params) {
    // Adapts Stripe API to common interface
    return stripe.paymentIntents.create(...);
  }
}
```

**Rationale**:
- ✅ Unified interface for different payment providers
- ✅ Easy to switch providers
- ✅ Consistent API across providers
- ✅ Provider-specific logic encapsulated

**Benefits**:
- Business logic doesn't depend on specific provider
- Easy to add new providers
- Consistent error handling
- Simplified testing

---

## Behavioral Patterns

### 5. Middleware Pattern

**Pattern**: Middleware Pattern (Chain of Responsibility)

**Location**: `backend/src/middleware/`

**Implementation**:
```typescript
// Express middleware chain
app.use(securityHeaders);      // 1. Security headers
app.use(corsConfig);            // 2. CORS
app.use(express.json());        // 3. Body parsing
app.use(cookieParser());        // 4. Cookie parsing
app.use(requestId);             // 5. Request ID
app.use(metricsMiddleware);     // 6. Metrics
app.use(apiVersioning);         // 7. API versioning
app.use(apiLimiter);            // 8. Rate limiting
app.use('/api', routes);        // 9. Routes
app.use(errorHandler);          // 10. Error handling
```

**Rationale**:
- ✅ Separation of cross-cutting concerns
- ✅ Reusable middleware components
- ✅ Easy to add/remove middleware
- ✅ Consistent request/response handling

**Benefits**:
- Security, validation, logging handled consistently
- Easy to test middleware independently
- Clear request processing pipeline
- Modular architecture

---

### 6. Strategy Pattern

**Pattern**: Strategy Pattern

**Location**: Password strength validation, payment providers

**Implementation**:
```typescript
// Password strength strategies
function checkPasswordStrength(password: string): PasswordStrength {
  // Strategy 1: Check length
  if (password.length < 8) return 'WEAK';
  
  // Strategy 2: Check complexity
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  // Strategy 3: Calculate strength
  if (password.length >= 13 && hasUpper && hasLower && hasNumber && hasSpecial) {
    return 'STRONG';
  }
  // ... more strategies
}
```

**Rationale**:
- ✅ Encapsulates algorithms
- ✅ Easy to change validation rules
- ✅ Testable strategies
- ✅ Flexible validation

**Benefits**:
- Validation logic is modular
- Easy to update rules
- Can combine multiple strategies
- Clear validation flow

---

### 7. Observer Pattern

**Pattern**: Observer Pattern (via React Context)

**Location**: `frontend/src/contexts/AuthContext.tsx`

**Implementation**:
```typescript
// AuthContext provides state to observers
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Components observe context changes
function useAuth() {
  const context = useContext(AuthContext);
  return context;
}

// Provider notifies observers on state change
function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  
  // When user changes, all observers are notified
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Rationale**:
- ✅ Decouples components from state management
- ✅ Centralized authentication state
- ✅ Automatic re-renders on state change
- ✅ Easy to access auth state anywhere

**Benefits**:
- No prop drilling
- Consistent auth state across app
- Easy to update auth state
- React handles observer notifications

---

## Architectural Patterns

### 8. Layered Architecture

**Pattern**: Layered Architecture

**Location**: Entire backend structure

**Layers**:
```
Routes Layer (HTTP handling)
    ↓
Services Layer (Business logic)
    ↓
Repository Layer (Data access via Prisma)
    ↓
Database Layer (PostgreSQL)
```

**Rationale**:
- ✅ Clear separation of concerns
- ✅ Easy to test each layer
- ✅ Maintainable codebase
- ✅ Scalable architecture

**Benefits**:
- Each layer has single responsibility
- Changes isolated to specific layers
- Easy to understand code flow
- Testable components

---

### 9. Service-Oriented Architecture (SOA)

**Pattern**: Service-Oriented Architecture

**Location**: `backend/src/services/`

**Implementation**:
```typescript
// Each service handles specific domain
authService.ts        // Authentication domain
paymentService.ts     // Payment domain
notificationService.ts // Notification domain
profileService.ts      // Profile domain
```

**Rationale**:
- ✅ Domain-driven design
- ✅ Reusable business logic
- ✅ Easy to test services
- ✅ Clear service boundaries

**Benefits**:
- Business logic is organized by domain
- Services can be reused across routes
- Easy to understand service responsibilities
- Can extract services to microservices later

---

### 10. Dependency Injection

**Pattern**: Dependency Injection (via function parameters)

**Location**: Throughout services

**Implementation**:
```typescript
// Dependencies injected via parameters
export const createPayment = async (
  userId: string,
  amount: number,
  provider: IPaymentProvider = PaymentProviderFactory.getProvider()
) => {
  // Use injected provider
  return provider.createPayment({ userId, amount });
};
```

**Rationale**:
- ✅ Loose coupling
- ✅ Easy to test (can inject mocks)
- ✅ Flexible dependencies
- ✅ Clear dependencies

**Benefits**:
- Services don't create their own dependencies
- Easy to swap implementations
- Testable with mocks
- Clear dependency requirements

---

## Frontend Patterns

### 11. Component Composition

**Pattern**: Component Composition

**Location**: `frontend/src/components/`

**Implementation**:
```typescript
// Small, reusable components
<Button variant="primary">Click</Button>
<Input type="email" placeholder="Email" />
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**Rationale**:
- ✅ Reusable UI components
- ✅ Consistent design
- ✅ Easy to maintain
- ✅ Composable interfaces

**Benefits**:
- DRY principle (Don't Repeat Yourself)
- Consistent UI across app
- Easy to update design
- Faster development

---

### 12. Custom Hooks Pattern

**Pattern**: Custom Hooks Pattern

**Location**: `frontend/src/hooks/`

**Implementation**:
```typescript
// Reusable logic in hooks
function useProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile()
  });
  
  return { profile: data, isLoading, error };
}

// Used in components
function ProfilePage() {
  const { profile, isLoading } = useProfile();
  // ...
}
```

**Rationale**:
- ✅ Reusable logic
- ✅ Separation of concerns
- ✅ Easy to test
- ✅ Clean component code

**Benefits**:
- Logic separated from UI
- Reusable across components
- Easy to test hooks
- Cleaner component code

---

### 13. Error Boundary Pattern

**Pattern**: Error Boundary Pattern

**Location**: `frontend/src/components/ErrorBoundary.tsx`

**Implementation**:
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to Sentry
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Rationale**:
- ✅ Graceful error handling
- ✅ Prevents app crashes
- ✅ User-friendly error messages
- ✅ Error logging

**Benefits**:
- App doesn't crash on errors
- Better user experience
- Errors are logged
- Can recover from errors

---

## Testing Patterns

### 14. Test-Driven Development (TDD)

**Pattern**: TDD Pattern (Red-Green-Refactor)

**Location**: All test files

**Implementation**:
```typescript
// 1. RED: Write failing test
test('should register new user', async () => {
  const result = await authService.register('test@example.com', 'password');
  expect(result.email).toBe('test@example.com');
});

// 2. GREEN: Write minimal code to pass
export const register = async (email: string, password: string) => {
  return { email };
};

// 3. REFACTOR: Improve code while keeping tests green
export const register = async (email: string, password: string) => {
  const hashedPassword = await hashPassword(password);
  return await prisma.user.create({ data: { email, password: hashedPassword } });
};
```

**Rationale**:
- ✅ Tests drive design
- ✅ High test coverage
- ✅ Confidence in refactoring
- ✅ Living documentation

**Benefits**:
- Code is testable by design
- High confidence in code quality
- Easy to refactor
- Tests serve as documentation

---

## Security Patterns

### 15. Defense in Depth

**Pattern**: Defense in Depth

**Location**: Multiple layers

**Implementation**:
```
1. Network Layer: HTTPS (TLS)
2. Application Layer: Security headers (Helmet)
3. Authentication Layer: JWT tokens
4. Authorization Layer: RBAC middleware
5. Input Layer: Validation, sanitization
6. Database Layer: Parameterized queries
7. Rate Limiting: Brute force protection
```

**Rationale**:
- ✅ Multiple security layers
- ✅ If one layer fails, others protect
- ✅ Comprehensive security
- ✅ Defense against multiple attack vectors

**Benefits**:
- Strong security posture
- Multiple attack vectors covered
- Redundant protection
- Industry best practices

---

## Pattern Selection Rationale

### Why These Patterns?

1. **Factory Pattern**: Needed for payment provider abstraction
2. **Singleton Pattern**: Prevents multiple provider instances
3. **Repository Pattern**: Prisma provides this naturally
4. **Adapter Pattern**: Needed for multiple payment providers
5. **Middleware Pattern**: Express.js uses this pattern
6. **Strategy Pattern**: Flexible validation and algorithms
7. **Observer Pattern**: React Context for state management
8. **Layered Architecture**: Clear separation of concerns
9. **Service-Oriented**: Domain-driven design
10. **Dependency Injection**: Testability and flexibility

### Pattern Benefits Summary

- ✅ **Maintainability**: Patterns make code easier to understand and modify
- ✅ **Testability**: Patterns enable easy testing and mocking
- ✅ **Scalability**: Patterns support growth and changes
- ✅ **Reusability**: Patterns promote code reuse
- ✅ **Flexibility**: Patterns allow easy modifications

---

## Anti-Patterns Avoided

### 1. God Object
**Avoided**: No single class/object does everything
**Solution**: Layered architecture with clear responsibilities

### 2. Spaghetti Code
**Avoided**: Clear structure and organization
**Solution**: Modular design, clear dependencies

### 3. Tight Coupling
**Avoided**: Services don't depend on specific implementations
**Solution**: Interfaces, dependency injection

### 4. Code Duplication
**Avoided**: Reusable components and services
**Solution**: DRY principle, shared utilities

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
