/**
 * OAuth Buttons Component
 * 
 * Provides Google and GitHub OAuth login buttons
 * Uses OAuth 2.0 popup flow for authentication
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { Chrome, Github, Mail } from 'lucide-react';

interface OAuthButtonsProps {
  onSuccess?: () => void;
  mode?: 'login' | 'register';
}

export const OAuthButtons = ({ onSuccess, mode = 'login' }: OAuthButtonsProps) => {
  const [loading, setLoading] = useState<'google' | 'github' | 'microsoft' | null>(null);
  const { setUser } = useAuth();
  const { toast } = useToast();

  /**
   * Handle OAuth flow with provider
   * For now, this is a placeholder that shows how it would work
   * In production, you would:
   * 1. Open OAuth popup/redirect
   * 2. Get OAuth token from provider
   * 3. Send token to backend
   */
  const handleOAuth = async (provider: 'google' | 'github' | 'microsoft') => {
    try {
      setLoading(provider);

      // TODO: Implement OAuth popup/redirect flow
      // For Google: Use Google Identity Services (gsi)
      // For GitHub: Use GitHub OAuth App redirect
      // 
      // Example flow:
      // 1. Open popup with provider's OAuth URL
      // 2. User authorizes
      // 3. Get access token from callback
      // 4. Send token to backend: authApi.oauthLogin(provider, token)
      // 5. Backend verifies token and creates/logs in user
      // 6. Set user in auth context
      // 7. Redirect to dashboard

      toast({
        title: 'OAuth Not Implemented',
        description: `${provider} OAuth integration requires OAuth app setup. See documentation.`,
        variant: 'default',
      });

      // Placeholder for actual implementation
      // const token = await getOAuthToken(provider);
      // const response = await authApi.oauthLogin(provider, token);
      // setUser(response.data);
      // onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'OAuth Error',
        description: error.response?.data?.error || error.message || `Failed to authenticate with ${provider}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth('google')}
          disabled={loading !== null}
          className="w-full"
        >
          {loading === 'google' ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Chrome className="h-4 w-4" />
              Google
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth('github')}
          disabled={loading !== null}
          className="w-full"
        >
          {loading === 'github' ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth('microsoft')}
          disabled={loading !== null}
          className="w-full"
        >
          {loading === 'microsoft' ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Microsoft
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

