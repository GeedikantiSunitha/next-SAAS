# Frontend Components
## NextSaaS - React Components, Hooks, and Pages

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes all frontend components, their purpose, props, usage, and implementation details.

---

## Component Architecture

### Component Structure

```
frontend/src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   ├── auth/            # Authentication components
│   ├── admin/           # Admin-specific components
│   └── [shared]         # Shared components
├── pages/               # Page components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
└── api/                 # API client
```

---

## UI Components (`components/ui/`)

### Button Component

**Location**: `components/ui/button.tsx`

**Purpose**: Reusable button component with variants

**Props**:
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  className?: string;
  // ... standard button HTML attributes
}
```

**Variants**:
- `default`: Primary button (blue background)
- `destructive`: Destructive action (red background)
- `outline`: Outlined button
- `secondary`: Secondary button
- `ghost`: Ghost button (transparent)
- `link`: Link-style button

**Usage**:
```tsx
<Button variant="primary" size="lg">Click Me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
```

---

### Input Component

**Location**: `components/ui/input.tsx`

**Purpose**: Reusable input field component

**Props**:
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}
```

**Features**:
- Error message display
- Label support
- Type-safe props

**Usage**:
```tsx
<Input 
  type="email" 
  placeholder="Email" 
  error={errors.email}
/>
```

---

### Card Components

**Location**: `components/ui/card.tsx`

**Purpose**: Card container components

**Components**:
- `Card`: Main container
- `CardHeader`: Card header section
- `CardTitle`: Card title
- `CardDescription`: Card description
- `CardContent`: Card content section

**Usage**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

---

### Modal Component

**Location**: `components/ui/modal.tsx`

**Purpose**: Modal dialog component

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Modal isOpen={isOpen} onClose={handleClose} title="Confirm">
  <p>Are you sure?</p>
</Modal>
```

---

### Toast Component

**Location**: `components/ui/toast.tsx`, `components/ui/toaster.tsx`

**Purpose**: Toast notification system

**Components**:
- `Toast`: Individual toast notification
- `Toaster`: Toast container/provider

**Usage**:
```tsx
const { toast } = useToast();

toast({
  title: "Success",
  description: "Profile updated",
  variant: "default" // or "destructive"
});
```

---

### Loading Component

**Location**: `components/ui/loading.tsx`

**Purpose**: Loading spinner component

**Usage**:
```tsx
<Loading />
<Loading size="lg" />
```

---

### Skeleton Component

**Location**: `components/ui/skeleton.tsx`

**Purpose**: Skeleton loader for content placeholders

**Usage**:
```tsx
<Skeleton className="h-4 w-32" />
<Skeleton className="h-8 w-full" />
```

---

### Dropdown Menu Component

**Location**: `components/ui/dropdown-menu.tsx`

**Purpose**: Dropdown menu component

**Components**:
- `DropdownMenu`: Main container
- `DropdownMenuTrigger`: Trigger button
- `DropdownMenuContent`: Menu content
- `DropdownMenuItem`: Menu item
- `DropdownMenuSeparator`: Separator

**Usage**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Authentication Components

### ProtectedRoute Component

**Location**: `components/auth/ProtectedRoute.tsx`

**Purpose**: Route guard for authenticated routes

**Props**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Behavior**:
- Checks if user is authenticated
- Redirects to `/login` if not authenticated
- Renders children if authenticated

**Usage**:
```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

### OAuthButtons Component

**Location**: `components/OAuthButtons.tsx`

**Purpose**: OAuth authentication buttons

**Props**:
```typescript
interface OAuthButtonsProps {
  onSuccess?: () => void;
  mode?: 'login' | 'register';
}
```

**Features**:
- Google OAuth button
- GitHub OAuth button
- Microsoft OAuth button
- Loading states
- Error handling

**Usage**:
```tsx
<OAuthButtons onSuccess={() => navigate('/dashboard')} />
```

---

### PasswordStrengthIndicator Component

**Location**: `components/PasswordStrengthIndicator.tsx`

**Purpose**: Real-time password strength indicator

**Props**:
```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
}
```

**Features**:
- Real-time strength calculation
- Visual progress bar
- Strength levels: WEAK, FAIR, GOOD, STRONG
- Feedback messages

**Usage**:
```tsx
<PasswordStrengthIndicator password={password} />
```

---

## Admin Components

### AdminLayout Component

**Location**: `components/admin/AdminLayout.tsx`

**Purpose**: Layout wrapper for admin pages

**Features**:
- Sidebar navigation
- Header with user menu
- Responsive design
- Navigation items:
  - Dashboard
  - Users
  - Audit Logs
  - Feature Flags
  - Payments
  - Settings

**Usage**:
```tsx
<AdminLayout>
  <AdminDashboard />
</AdminLayout>
```

---

### AdminRoute Component

**Location**: `components/admin/AdminRoute.tsx`

**Purpose**: Route guard for admin routes

**Behavior**:
- Checks if user has ADMIN or SUPER_ADMIN role
- Redirects if not authorized
- Renders children if authorized

**Usage**:
```tsx
<Route
  path="/admin/dashboard"
  element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  }
/>
```

---

## Shared Components

### Header Component

**Location**: `components/Header.tsx`

**Purpose**: Application header/navigation bar

**Features**:
- Logo/branding
- Navigation links
- User menu (if authenticated)
- Logout button

---

### Footer Component

**Location**: `components/Footer.tsx`

**Purpose**: Application footer

**Features**:
- Copyright information
- Links (privacy, terms, etc.)
- Social media links (if applicable)

---

### Layout Component

**Location**: `components/Layout.tsx`

**Purpose**: Main layout wrapper

**Features**:
- Header
- Main content area
- Footer
- Consistent across pages

---

### ErrorBoundary Component

**Location**: `components/ErrorBoundary.tsx`

**Purpose**: Catches React errors and displays fallback UI

**Features**:
- Catches render errors
- Displays user-friendly error message
- "Try Again" button
- Error logging to Sentry

**Usage**:
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

### ConfirmDialog Component

**Location**: `components/ConfirmDialog.tsx`

**Purpose**: Confirmation dialog for destructive actions

**Props**:
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'default' | 'destructive';
}
```

**Usage**:
```tsx
<ConfirmDialog
  isOpen={showDialog}
  onClose={handleClose}
  onConfirm={handleDelete}
  title="Delete User"
  message="Are you sure you want to delete this user?"
  variant="destructive"
/>
```

---

## Page Components (`pages/`)

### Landing Page

**Location**: `pages/Landing.tsx`

**Purpose**: Public landing page

**Features**:
- Hero section
- Features overview
- Call-to-action buttons
- Navigation to login/register

---

### Login Page

**Location**: `pages/Login.tsx`

**Purpose**: User login page

**Features**:
- Email/password form
- OAuth buttons
- "Forgot Password" link
- Form validation
- Error display

---

### Register Page

**Location**: `pages/Register.tsx`

**Purpose**: User registration page

**Features**:
- Registration form (name, email, password)
- Password strength indicator
- OAuth buttons
- Form validation
- Error display

---

### Dashboard Page

**Location**: `pages/Dashboard.tsx`

**Purpose**: User dashboard

**Features**:
- User information display
- Quick actions
- Recent activity
- Logout button

---

### Profile Page

**Location**: `pages/Profile.tsx`

**Purpose**: User profile management

**Features**:
- Profile information form
- Password change form
- Loading states
- Toast notifications

---

### ForgotPassword Page

**Location**: `pages/ForgotPassword.tsx`

**Purpose**: Password reset request

**Features**:
- Email input form
- Submit button
- Success/error messages

---

### ResetPassword Page

**Location**: `pages/ResetPassword.tsx`

**Purpose**: Password reset with token

**Features**:
- New password form
- Password strength indicator
- Token validation
- Success/error messages

---

## Admin Pages (`pages/admin/`)

### AdminDashboard

**Location**: `pages/admin/AdminDashboard.tsx`

**Purpose**: Admin dashboard overview

**Features**:
- Statistics cards (users, sessions, errors, latency)
- System metrics
- Quick actions
- Recent activity

---

### AdminUsers

**Location**: `pages/admin/AdminUsers.tsx`

**Purpose**: User management interface

**Features**:
- User list table
- Search functionality
- Filters (role, status)
- Pagination
- Create/edit/delete users
- Role management

---

### AdminAuditLogs

**Location**: `pages/admin/AdminAuditLogs.tsx`

**Purpose**: Audit log viewer

**Features**:
- Audit log table
- Filters (user, action, date range)
- Pagination
- Export functionality
- Log details view

---

### AdminFeatureFlags

**Location**: `pages/admin/AdminFeatureFlags.tsx`

**Purpose**: Feature flag management

**Features**:
- Feature flag list
- Toggle switches
- Flag history
- Create custom flags

---

### AdminPayments

**Location**: `pages/admin/AdminPayments.tsx`

**Purpose**: Payment management

**Features**:
- Payment list
- Filters (user, status, date)
- Payment details
- Refund functionality

---

### AdminSettings

**Location**: `pages/admin/AdminSettings.tsx`

**Purpose**: System settings management

**Features**:
- Settings form
- Email settings
- Payment settings
- General settings

---

## Contexts (`contexts/`)

### AuthContext

**Location**: `contexts/AuthContext.tsx`

**Purpose**: Global authentication state management

**State**:
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}
```

**Usage**:
```tsx
const { user, isAuthenticated, login, logout } = useAuth();
```

**Features**:
- User state management
- Authentication methods
- Auto-check on mount
- Session persistence

---

## Custom Hooks (`hooks/`)

### useProfile Hook

**Location**: `hooks/useProfile.ts`

**Purpose**: Profile data fetching and management

**Returns**:
```typescript
{
  profile: User | undefined;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}
```

**Usage**:
```tsx
const { profile, isLoading, updateProfile } = useProfile();
```

---

### useFeatureFlag Hook

**Location**: `hooks/useFeatureFlag.ts`

**Purpose**: Feature flag checking

**Returns**:
```typescript
{
  isEnabled: boolean;
  isLoading: boolean;
}
```

**Usage**:
```tsx
const { isEnabled } = useFeatureFlag('NEW_FEATURE');
if (isEnabled) {
  // Show feature
}
```

---

### useToast Hook

**Location**: `hooks/use-toast.ts`

**Purpose**: Toast notification management

**Returns**:
```typescript
{
  toast: (options: ToastOptions) => void;
}
```

**Usage**:
```tsx
const { toast } = useToast();
toast({ title: "Success", description: "Saved!" });
```

---

## API Client (`api/`)

### API Client Structure

**Location**: `api/client.ts`

**Purpose**: Centralized HTTP client

**Features**:
- Axios instance
- Request/response interceptors
- Error handling
- Cookie handling (withCredentials)

---

### Auth API

**Location**: `api/auth.ts`

**Endpoints**:
- `login(email, password)`
- `register(email, password, name)`
- `logout()`
- `me()` - Get current user
- `refreshToken()`
- `forgotPassword(email)`
- `resetPassword(token, password)`
- `oauthLogin(provider, token)`

---

### Profile API

**Location**: `api/profile.ts`

**Endpoints**:
- `getProfile()`
- `updateProfile(data)`
- `changePassword(currentPassword, newPassword)`

---

### Admin API

**Location**: `api/admin.ts`

**Endpoints**:
- `getDashboard()`
- `getUsers(params)`
- `getUserById(id)`
- `createUser(data)`
- `updateUser(id, data)`
- `deleteUser(id)`
- `getAuditLogs(filters)`
- `getFeatureFlags()`
- `updateFeatureFlag(key, enabled)`
- `getPayments(filters)`
- `getSettings()`
- `updateSettings(settings)`

---

## Component Patterns

### 1. Compound Components

**Example**: Card components
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### 2. Controlled Components

**Example**: Form inputs
```tsx
<Input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
/>
```

### 3. Render Props

**Example**: ErrorBoundary
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

---

## Styling

### Tailwind CSS

**Configuration**: `tailwind.config.ts`

**Features**:
- Utility-first CSS
- Custom color palette
- Responsive breakpoints
- Dark mode support (if implemented)

### Component Styling

**Pattern**: Class Variance Authority (CVA)
- Type-safe variants
- Composable styles
- Consistent design system

---

## State Management

### Server State (React Query)

**Usage**: Data fetching, caching, mutations

**Example**:
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['profile'],
  queryFn: () => profileApi.getProfile()
});
```

### Client State (Context API)

**Usage**: Authentication state, UI state

**Example**:
```tsx
const { user } = useAuth();
```

---

## Component Testing

### Testing Approach

- **Unit Tests**: Component rendering, props, events
- **Integration Tests**: Component interactions
- **E2E Tests**: Full user flows

### Testing Tools

- **Vitest**: Unit testing
- **React Testing Library**: Component testing
- **Playwright**: E2E testing

---

## Component Best Practices

### 1. Single Responsibility
- Each component has one clear purpose

### 2. Reusability
- Components are reusable across pages

### 3. Type Safety
- All components use TypeScript
- Props are type-checked

### 4. Accessibility
- Components follow WCAG guidelines
- Keyboard navigation supported

### 5. Performance
- Components are optimized
- Lazy loading for pages
- Code splitting

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
