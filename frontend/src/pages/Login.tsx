import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Layout } from '../components/Layout';
import { OAuthButtons } from '../components/OAuthButtons';
import { MfaVerification } from '../components/MfaVerification';
import { authApi } from '../api/auth';
import { useToast } from '../hooks/use-toast';
import { usePublicFeatureFlag } from '../hooks/useFeatureFlag';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<'TOTP' | 'EMAIL' | null>(null);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const { enabled: passwordResetEnabled } = usePublicFeatureFlag('password_reset');
  const { enabled: registrationEnabled } = usePublicFeatureFlag('registration');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first submit
  });

  // Demo accounts (must match backend seed: npm run seed:demo-users)
  const DEMO_ACCOUNTS = [
    { label: 'User', email: 'demo@example.com', password: 'DemoUser123!' },
    { label: 'Admin', email: 'demo-admin@example.com', password: 'DemoAdmin123!' },
    { label: 'Super Admin', email: 'demo-superadmin@example.com', password: 'DemoSuperAdmin123!' },
  ] as const;
  const fillDemo = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    setError(null);
  };

  // Redirect if already authenticated (use useEffect to handle async state updates)
  // Only redirect if not currently submitting (to avoid redirect during form submission)
  useEffect(() => {
    if (isAuthenticated && !isSubmitting) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isSubmitting, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setIsSubmitting(true);
      const response = await authApi.login({ email: data.email, password: data.password });
      
      // Check if MFA is required
      if (response.data && typeof response.data === 'object' && 'requiresMfa' in response.data) {
        const mfaData = response.data as { requiresMfa: boolean; mfaMethod: 'TOTP' | 'EMAIL'; user: any };
        if (mfaData.requiresMfa) {
          setRequiresMfa(true);
          setMfaMethod(mfaData.mfaMethod);
          setIsSubmitting(false);
          return;
        }
      }
      
      // No MFA required - backend has set cookies and returned user
      // Refresh auth state to verify cookie is set and update user state
      // This ensures isAuthenticated is true before navigating to dashboard
      await refreshUser();
      
      // Show success toast
      toast({
        title: 'Login Successful',
        description: 'Welcome back! You have been logged in successfully.',
        variant: 'success',
      });
      
      // Navigate to dashboard after auth state is updated
      // The ProtectedRoute will now see isAuthenticated = true
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaVerify = async (code: string, isBackupCode?: boolean) => {
    if (!mfaMethod) return;

    try {
      setMfaError(null);
      setIsVerifyingMfa(true);
      
      await authApi.loginWithMfa(code, mfaMethod, isBackupCode);
      
      // Backend sets cookies and returns user
      // Refresh auth state
      await refreshUser();
      
      // Show success toast
      toast({
        title: 'Login Successful',
        description: 'Welcome back! You have been logged in successfully.',
        variant: 'success',
      });
      
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      let errorMessage = 'Invalid verification code. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setMfaError(errorMessage);
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const handleMfaCancel = () => {
    setRequiresMfa(false);
    setMfaMethod(null);
    setMfaError(null);
  };

  // Show MFA verification if required
  if (requiresMfa && mfaMethod) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 py-12 px-4">
          <MfaVerification
            method={mfaMethod}
            onVerify={handleMfaVerify}
            onCancel={handleMfaCancel}
            isLoading={isVerifyingMfa}
            error={mfaError}
            showBackupCodeOption={true}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 py-12 px-4">
        <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg shadow-elegant border animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-center">Login</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" data-testid="error-message" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
              error={errors.password?.message}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <OAuthButtons mode="login" onSuccess={() => navigate('/dashboard', { replace: true })} />

        <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Demo logins</p>
          <p className="text-sm text-muted-foreground">Run <code className="text-xs bg-muted px-1 rounded">npm run seed:demo-users</code> in backend to create these accounts. If you get &quot;Invalid credentials&quot;, ensure the backend is running and re-run the seed.</p>
          <ul className="space-y-2 text-sm">
            {DEMO_ACCOUNTS.map(({ label, email, password }) => (
              <li key={email} className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground w-24">{label}:</span>
                <span className="text-muted-foreground">{email}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{password}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => fillDemo(email, password)}
                >
                  Fill
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center text-sm space-y-2">
          {passwordResetEnabled && (
          <div>
            <Link to="/forgot-password" className="text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
          )}
          {registrationEnabled && (
          <div>
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </div>
          )}
        </div>
      </div>
    </div>
    </Layout>
  );
};

