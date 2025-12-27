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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit', // Validate on submit (default, but explicit)
    reValidateMode: 'onChange', // Re-validate on change after first submit
  });

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
      await login(data.email, data.password);
      // State will update asynchronously, useEffect will handle redirect
      // But also navigate explicitly as a fallback
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      // Backend returns { success: false, error: "message" } on error
      // Axios errors have err.response.data.error for API errors
      // Rate limit errors (429) may have different structure
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

        <div className="text-center text-sm space-y-2">
          <div>
            <Link to="/forgot-password" className="text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
          <div>
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
};

