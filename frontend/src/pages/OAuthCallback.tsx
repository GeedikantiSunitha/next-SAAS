/**
 * OAuth Callback Page
 * 
 * Handles OAuth callbacks from providers (Google, GitHub, Microsoft)
 * Extracts token/code from URL and completes authentication
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useLinkOAuth } from '../hooks/useOAuth';
import {
  getGoogleTokenFromCallback,
  getGitHubCodeFromCallback,
  getMicrosoftTokenFromCallback,
} from '../utils/oauth';
import { Loader2 } from 'lucide-react';

export const OAuthCallback = () => {
  const { provider } = useParams<{ provider: 'google' | 'github' | 'microsoft' }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const linkOAuthMutation = useLinkOAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (!provider || !['google', 'github', 'microsoft'].includes(provider)) {
        setError('Invalid OAuth provider');
        setStatus('error');
        return;
      }

      try {
        let token: string;

        if (provider === 'google') {
          // Google uses implicit flow - token in URL fragment
          const result = getGoogleTokenFromCallback();
          if (!result) {
            throw new Error('No token found in callback URL');
          }
          token = result.token;
        } else if (provider === 'github') {
          // GitHub uses authorization code flow - need to exchange code for token
          const codeResult = getGitHubCodeFromCallback();
          if (!codeResult) {
            throw new Error('No authorization code found in callback URL');
          }
          const exchangeResponse = await authApi.exchangeGitHubCode(codeResult.code);
          token = exchangeResponse.data.token;
        } else if (provider === 'microsoft') {
          // Microsoft uses implicit flow - token in URL fragment
          const result = getMicrosoftTokenFromCallback();
          if (!result) {
            throw new Error('No token found in callback URL');
          }
          token = result.token;
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }

        // Check if we're in linking mode
        const isLinkingMode = sessionStorage.getItem('oauth_linking_mode') === 'true';
        const linkingProvider = sessionStorage.getItem('oauth_linking_provider');

        if (isLinkingMode && linkingProvider === provider && (provider === 'google' || provider === 'github')) {
          // Link OAuth account to existing user (only Google and GitHub supported for linking)
          await linkOAuthMutation.mutateAsync({ provider: provider as 'google' | 'github', token });

          // Clean up sessionStorage
          sessionStorage.removeItem('oauth_linking_mode');
          sessionStorage.removeItem('oauth_linking_provider');

          setStatus('success');
          toast({
            title: 'Account Linked',
            description: `Successfully linked your ${provider} account`,
            variant: 'success',
          });

          // Redirect to profile page
          setTimeout(() => {
            navigate('/profile', { replace: true });
          }, 1000);
        } else {
          // Normal OAuth login flow
          await authApi.oauthLogin(provider, token);

          // Backend sets cookies and returns user
          // Refresh auth state
          await refreshUser();

          setStatus('success');
          toast({
            title: 'Login Successful',
            description: `Successfully logged in with ${provider}`,
            variant: 'success',
          });

          // Redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || `Failed to authenticate with ${provider}`;
        setError(errorMessage);
        setStatus('error');
        toast({
          title: 'OAuth Error',
          description: errorMessage,
          variant: 'error',
        });

        // Redirect to login after delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [provider, navigate, refreshUser, toast]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 py-12 px-4">
        <div className="w-full max-w-md space-y-4 p-8 bg-card rounded-lg shadow-elegant border text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Completing authentication...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we complete your {provider} login.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Authentication Successful!</h2>
              <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Authentication Failed</h2>
              <p className="text-sm text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};
