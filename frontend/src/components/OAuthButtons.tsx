/**
 * OAuth Buttons Component
 * 
 * Provides Google and GitHub OAuth login buttons
 * Uses OAuth 2.0 redirect flow for authentication
 * 
 * Note: Microsoft OAuth support is coming soon (code is commented out)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { Chrome, Github } from 'lucide-react';
import { initiateOAuth } from '../utils/oauth';

interface OAuthButtonsProps {
  onSuccess?: () => void;
  mode?: 'login' | 'register';
}

export const OAuthButtons = ({}: OAuthButtonsProps) => {
  const [loading, setLoading] = useState<'google' | 'github' | 'microsoft' | null>(null);
  const { toast } = useToast();

  /**
   * Handle OAuth flow with provider
   * Initiates OAuth redirect flow
   */
  const handleOAuth = async (provider: 'google' | 'github' | 'microsoft') => {
    try {
      setLoading(provider);

      // Check if client ID is configured
      const clientIdEnvVar = `VITE_${provider.toUpperCase()}_CLIENT_ID`;
      const clientId = import.meta.env[clientIdEnvVar];

      if (!clientId) {
        toast({
          title: 'OAuth Not Configured',
          description: `${provider} OAuth is not configured. Please set ${clientIdEnvVar} environment variable.`,
          variant: 'error',
        });
        setLoading(null);
        return;
      }

      // Initiate OAuth flow (redirects to provider)
      initiateOAuth(provider);
    } catch (error: any) {
      toast({
        title: 'OAuth Error',
        description: error.message || `Failed to initiate ${provider} OAuth`,
        variant: 'error',
      });
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

      <div className="grid grid-cols-2 gap-3">
        {/* Note: Changed from grid-cols-3 to grid-cols-2 since Microsoft is commented out */}
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

        {/* Microsoft OAuth - Coming Soon (commented out for now) */}
        {/* 
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
        */}
      </div>
    </div>
  );
};

/**
 * OAuth Callback Handler Component
 * 
 * Handles OAuth callbacks from providers
 * Should be mounted on callback routes
 */
export const OAuthCallbackHandler = () => {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // This will be called by callback pages
  const handleOAuthCallback = async (
    provider: 'google' | 'github' | 'microsoft',
    tokenOrCode: string,
    isCode: boolean = false
  ) => {
    try {
      let token = tokenOrCode;

      // If it's a GitHub code, exchange it for token
      if (provider === 'github' && isCode) {
        const exchangeResponse = await authApi.exchangeGitHubCode(tokenOrCode);
        token = exchangeResponse.data.token;
      }

      // Send token to backend for authentication
      await authApi.oauthLogin(provider, token);

      // Backend sets cookies and returns user
      // Refresh auth state
      await refreshUser();

      toast({
        title: 'Login Successful',
        description: `Successfully logged in with ${provider}`,
        variant: 'success',
      });

      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast({
        title: 'OAuth Error',
        description: error.response?.data?.error || error.message || `Failed to authenticate with ${provider}`,
        variant: 'error',
      });
      navigate('/login', { replace: true });
    }
  };

  // Export handleOAuthCallback for use in callback pages
  return { handleOAuthCallback };
};
