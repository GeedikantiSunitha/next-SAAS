/**
 * MFA Settings Component
 * 
 * Displays and manages Multi-Factor Authentication settings
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { useMfaMethods, useDisableMfa } from '../hooks/useMfa';
import { TotpSetupModal } from './TotpSetupModal';
import { EmailMfaSetupModal } from './EmailMfaSetupModal';
import { ConfirmDialog } from './ConfirmDialog';
import { BackupCodesManagement } from './BackupCodesManagement';
import { useToast } from '../hooks/use-toast';
import { Shield, Smartphone, Mail, CheckCircle, XCircle } from 'lucide-react';

export const MfaSettings = () => {
  const { data: methods, isLoading, error } = useMfaMethods();
  const disableMfaMutation = useDisableMfa();
  const { toast } = useToast();
  
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [methodToDisable, setMethodToDisable] = useState<'TOTP' | 'EMAIL' | null>(null);

  const totpMethod = methods?.find((m) => m.method === 'TOTP');
  const emailMethod = methods?.find((m) => m.method === 'EMAIL');

  const handleDisable = (method: 'TOTP' | 'EMAIL') => {
    setMethodToDisable(method);
    setShowDisableDialog(true);
  };

  const confirmDisable = () => {
    if (methodToDisable) {
      disableMfaMutation.mutate(methodToDisable, {
        onSuccess: () => {
          setShowDisableDialog(false);
          setMethodToDisable(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multi-Factor Authentication</CardTitle>
          <CardDescription>Manage your MFA settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multi-Factor Authentication</CardTitle>
          <CardDescription>Manage your MFA settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load MFA settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Multi-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* TOTP MFA Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Authenticator App (TOTP)</h3>
                  <p className="text-sm text-muted-foreground">
                    Use an app like Google Authenticator or Authy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {totpMethod?.isEnabled ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Enabled</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisable('TOTP')}
                      disabled={disableMfaMutation.isPending}
                    >
                      Disable
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowTotpSetup(true)}
                  >
                    Setup TOTP
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Email MFA Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Email Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive verification codes via email
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {emailMethod?.isEnabled ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Enabled</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisable('EMAIL')}
                      disabled={disableMfaMutation.isPending}
                    >
                      Disable
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowEmailSetup(true)}
                  >
                    Setup Email MFA
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> MFA adds an extra layer of security. When enabled,
              you'll need to enter a verification code in addition to your password when logging in.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* TOTP Setup Modal */}
      {showTotpSetup && (
        <TotpSetupModal
          open={showTotpSetup}
          onOpenChange={setShowTotpSetup}
        />
      )}

      {/* Email MFA Setup Modal */}
      {showEmailSetup && (
        <EmailMfaSetupModal
          open={showEmailSetup}
          onOpenChange={setShowEmailSetup}
        />
      )}

      {/* Disable Confirmation Dialog */}
      <ConfirmDialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
        title="Disable MFA"
        description={`Are you sure you want to disable ${methodToDisable} MFA? This will reduce your account security.`}
        confirmText="Disable"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDisable}
        onCancel={() => {
          setShowDisableDialog(false);
          setMethodToDisable(null);
        }}
        loading={disableMfaMutation.isPending}
      />

      {/* Backup Codes Management */}
      {(totpMethod?.isEnabled || emailMethod?.isEnabled) && (
        <BackupCodesManagement />
      )}
    </>
  );
};
