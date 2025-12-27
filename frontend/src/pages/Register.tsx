import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { Layout } from '../components/Layout';
import { OAuthButtons } from '../components/OAuthButtons';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1, 'Name is required').optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit', // Validate on submit (default, but explicit)
    reValidateMode: 'onChange', // Re-validate on change after first submit
  });

  // Watch password field for strength indicator
  const passwordValue = watch('password');

  // Redirect if already authenticated (use useEffect to handle async state updates)
  // Only redirect if not currently submitting (to avoid redirect during form submission)
  useEffect(() => {
    if (isAuthenticated && !isSubmitting) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isSubmitting, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      setIsSubmitting(true);
      await registerUser(data.email, data.password, data.name);
      // State will update asynchronously, useEffect will handle redirect
      // But also navigate explicitly as a fallback
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      // Backend returns { success: false, error: "message" } on error
      // Axios errors have err.response.data.error for API errors
      // Rate limit errors (429) may have different structure
      let errorMessage = 'Registration failed. Please try again.';
      
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
          <h1 className="text-2xl font-bold text-center">Create Account</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign up for a new account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" data-testid="error-message" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register('name')}
              error={errors.name?.message}
            />
          </div>

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
            {passwordValue && (
              <div className="mt-2">
                <PasswordStrengthIndicator password={passwordValue} />
              </div>
            )}
            {!passwordValue && (
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
          </Button>
        </form>

        <OAuthButtons mode="register" onSuccess={() => navigate('/dashboard', { replace: true })} />

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
    </Layout>
  );
};

