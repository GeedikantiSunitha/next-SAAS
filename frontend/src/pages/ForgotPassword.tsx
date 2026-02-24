/**
 * Forgot Password Page
 * 
 * Allows users to request password reset
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Layout } from '../components/Layout';
import { authApi } from '../api/auth';
import { useToast } from '../hooks/use-toast';
import { usePublicFeatureFlag } from '../hooks/useFeatureFlag';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const { enabled: passwordResetEnabled } = usePublicFeatureFlag('password_reset');
  const { enabled: registrationEnabled } = usePublicFeatureFlag('registration');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first submit
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setMessage(null);
      
      const response = await authApi.forgotPassword(data.email);
      
      setMessage(response.message);
      toast({
        title: 'Success',
        description: response.message,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send reset email. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!passwordResetEnabled) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 py-12 px-4">
          <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg shadow-elegant border animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Password reset is currently disabled. Please contact support if you need assistance.
              </p>
            </div>
            <div className="text-center">
              <Link to="/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 py-12 px-4">
        <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg shadow-elegant border animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Enter your email address and we'll send you instructions to reset your password
            </p>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded" role="alert">
              {message}
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
          </form>

          <div className="text-center text-sm space-y-2">
            <div>
              <Link to="/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </div>
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

