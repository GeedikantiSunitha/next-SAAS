import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LoadingButton } from '../components/ui/loading';
import { Skeleton } from '../components/ui/skeleton';
import { Layout } from '../components/Layout';
import { useToast } from '../hooks/use-toast';
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useProfile';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { MfaSettings } from '../components/MfaSettings';
import { ConnectedAccounts } from '../components/ConnectedAccounts';
import { AccessibilitySettings } from '../components/accessibility/AccessibilitySettings';
import { Shield, Settings } from 'lucide-react';

// Profile update schema - email validation when provided
const profileSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    email: z.string().optional(),
  })
  .refine(
    (data) => {
      // If email is provided and not empty, validate format
      if (data.email && data.email.trim() !== '') {
        return z.string().email().safeParse(data.email).success;
      }
      // Empty string or undefined is valid (optional field)
      return true;
    },
    {
      message: 'Invalid email address',
      path: ['email'],
    }
  );

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#]/, 'Password must contain at least one special character (@$!%*?&#)'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const Profile = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // React Query hooks
  const { data: profileData, isLoading: profileLoading, error: profileError } = useProfile();
  const { enabled: passwordResetEnabled } = useFeatureFlag('password_reset');
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first submit
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange',
  });


  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !profileLoading) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, profileLoading, navigate]);

  // Load profile data into form when React Query data is available
  useEffect(() => {
    if (profileData) {
      const formData: { name?: string; email?: string } = {};
      if (profileData.name) formData.name = profileData.name;
      if (profileData.email) formData.email = profileData.email;
      resetProfile(formData);
    }
  }, [profileData, resetProfile]);

  // Show error toast if profile fetch fails
  useEffect(() => {
    if (profileError) {
      toast({
        title: 'Error',
        description: 'Failed to load profile. Please try again.',
        variant: 'error',
      });
    }
  }, [profileError, toast]);

  const onSubmitProfile = async (data: ProfileFormData) => {
    if (!profileData) return;

    try {
      setIsSubmittingProfile(true);

      // Only send fields that have changed
      const updates: { name?: string; email?: string } = {};
      
      // Check if name changed
      if (data.name !== undefined && data.name !== profileData.name) {
        updates.name = data.name;
      }
      
      // Check if email changed
      if (data.email !== undefined && data.email !== profileData.email) {
        updates.email = data.email;
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await updateProfileMutation.mutateAsync(updates);
        
        // Show success toast
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
          variant: 'success',
        });
      } else {
        // Show info toast if no changes
        toast({
          title: 'No changes',
          description: 'No changes to save',
          variant: 'default',
        });
      }
    } catch (err: any) {
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Reset form to original profile data after error
      if (profileData) {
        resetProfile({
          name: profileData.name,
          email: profileData.email,
        });
      }
      
      // Show error toast
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      setIsSubmittingPassword(true);

      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      // Show success toast
      toast({
        title: 'Success',
        description: 'Password changed successfully',
        variant: 'success',
      });
      
      resetPassword(); // Clear password fields
    } catch (err: any) {
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show error toast
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (profileLoading) {
    return (
      <Layout>
        <div className="bg-gradient-to-br from-background to-muted/20">
          <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-56 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-36" />
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
            {/* Profile Update Card */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      {...registerProfile('name')}
                      error={profileErrors.name?.message}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      {...registerProfile('email')}
                      error={profileErrors.email?.message}
                    />
                  </div>

                  <LoadingButton 
                    type="submit" 
                    loading={isSubmittingProfile || updateProfileMutation.isPending}
                    loadingText="Saving..."
                  >
                    Save Profile
                  </LoadingButton>
                </form>
              </CardContent>
            </Card>

            {/* Password Change Card - only show when password reset is enabled */}
            {passwordResetEnabled && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      {...registerPassword('currentPassword')}
                      error={passwordErrors.currentPassword?.message}
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      {...registerPassword('newPassword')}
                      error={passwordErrors.newPassword?.message}
                    />
                  </div>

                  <LoadingButton 
                    type="submit" 
                    loading={isSubmittingPassword || changePasswordMutation.isPending}
                    loadingText="Changing..."
                  >
                    Change Password
                  </LoadingButton>
                </form>
              </CardContent>
            </Card>
            )}

            {/* MFA Settings Card */}
            <MfaSettings />

            {/* Connected Accounts Card */}
            <ConnectedAccounts />

            {/* GDPR Settings Card */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Privacy & Data Rights</CardTitle>
                <CardDescription>
                  Manage your GDPR rights: data export, deletion, and consent preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/gdpr" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    GDPR Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Accessibility Settings Card */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Accessibility</CardTitle>
                <CardDescription>
                  Customize accessibility features to improve your experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccessibilitySettings />
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

