/**
 * Connected Accounts Component
 * 
 * Displays and manages OAuth account linking (Google, GitHub)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { useOAuthMethods, useLinkOAuth, useUnlinkOAuth } from '../hooks/useOAuth';
import { useToast } from '../hooks/use-toast';
import { ConfirmDialog } from './ConfirmDialog';
import { Chrome, Github, CheckCircle, Link2, Unlink } from 'lucide-react';
import { initiateOAuth } from '../utils/oauth';

export const ConnectedAccounts = () => {
  const { data: linkedMethods, isLoading, error } = useOAuthMethods();
  const linkOAuthMutation = useLinkOAuth();
  const unlinkOAuthMutation = useUnlinkOAuth();
  const { toast } = useToast();
  
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [providerToUnlink, setProviderToUnlink] = useState<'google' | 'github' | null>(null);

  const isGoogleLinked = linkedMethods?.includes('google') || false;
  const isGitHubLinked = linkedMethods?.includes('github') || false;

  const handleLink = (provider: 'google' | 'github') => {
    try {
      // Store in sessionStorage that we're in linking mode
      sessionStorage.setItem('oauth_linking_mode', 'true');
      sessionStorage.setItem('oauth_linking_provider', provider);
      
      // Initiate OAuth flow
      initiateOAuth(provider);
    } catch (error: any) {
      toast({
        title: 'OAuth Error',
        description: error.message || `Failed to initiate ${provider} OAuth flow`,
        variant: 'error',
      });
    }
  };

  const handleUnlink = (provider: 'google' | 'github') => {
    setProviderToUnlink(provider);
    setShowUnlinkDialog(true);
  };

  const confirmUnlink = () => {
    if (providerToUnlink) {
      unlinkOAuthMutation.mutate(providerToUnlink, {
        onSuccess: () => {
          setShowUnlinkDialog(false);
          setProviderToUnlink(null);
          toast({
            title: 'Account Unlinked',
            description: `${providerToUnlink} account has been unlinked successfully.`,
            variant: 'success',
          });
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.response?.data?.error || `Failed to unlink ${providerToUnlink} account`,
            variant: 'error',
          });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Link your OAuth accounts for easier login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            Failed to load connected accounts. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Link your OAuth accounts to sign in with Google or GitHub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Account */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Chrome className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Google</div>
                <div className="text-sm text-muted-foreground">
                  {isGoogleLinked ? 'Connected' : 'Not connected'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGoogleLinked ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlink('google')}
                    disabled={unlinkOAuthMutation.isPending}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Unlink
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLink('google')}
                  disabled={linkOAuthMutation.isPending}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Link Account
                </Button>
              )}
            </div>
          </div>

          {/* GitHub Account */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              <div>
                <div className="font-medium">GitHub</div>
                <div className="text-sm text-muted-foreground">
                  {isGitHubLinked ? 'Connected' : 'Not connected'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGitHubLinked ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlink('github')}
                    disabled={unlinkOAuthMutation.isPending}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Unlink
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLink('github')}
                  disabled={linkOAuthMutation.isPending}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Link Account
                </Button>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2">
            Linking an account allows you to sign in using that provider in addition to your password.
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showUnlinkDialog}
        onOpenChange={setShowUnlinkDialog}
        onCancel={() => {
          setShowUnlinkDialog(false);
          setProviderToUnlink(null);
        }}
        title="Unlink Account"
        description={`Are you sure you want to unlink your ${providerToUnlink} account? You will no longer be able to sign in with ${providerToUnlink}.`}
        confirmText="Unlink"
        cancelText="Cancel"
        onConfirm={confirmUnlink}
        variant="destructive"
        loading={unlinkOAuthMutation.isPending}
      />
    </>
  );
};
