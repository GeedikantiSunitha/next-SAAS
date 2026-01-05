/**
 * Backup Codes Management Component
 * 
 * Allows users to generate and view backup codes for MFA
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useMfaMethods, useGenerateBackupCodes } from '../hooks/useMfa';
import { Key, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export const BackupCodesManagement = () => {
  const { data: methods, isLoading } = useMfaMethods();
  const generateBackupCodesMutation = useGenerateBackupCodes();
  const { toast } = useToast();
  const [codesCopied, setCodesCopied] = useState(false);

  const hasEnabledMfa = methods?.some((m) => m.isEnabled) || false;
  // Safely access codes from mutation data
  const mutationData = generateBackupCodesMutation.data;
  const generatedCodes = (mutationData?.data?.codes as string[]) || [];

  const handleCopyCodes = () => {
    if (generatedCodes.length > 0) {
      navigator.clipboard.writeText(generatedCodes.join('\n'));
      setCodesCopied(true);
      setTimeout(() => setCodesCopied(false), 2000);
      toast({
        title: 'Copied',
        description: 'Backup codes copied to clipboard',
      });
    }
  };

  if (isLoading) {
    return null;
  }

  if (!hasEnabledMfa) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Backup Codes
        </CardTitle>
        <CardDescription>
          Generate backup codes to access your account if you lose your authenticator device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {generatedCodes.length === 0 ? (
          <>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Save these codes securely</p>
                  <p className="text-xs text-muted-foreground">
                    Backup codes are single-use. Generate new codes if you've used all of them or
                    if you suspect they've been compromised.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => generateBackupCodesMutation.mutate()}
              disabled={generateBackupCodesMutation.isPending}
              className="w-full"
            >
              {generateBackupCodesMutation.isPending ? 'Generating...' : 'Generate Backup Codes'}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Save these codes securely</p>
                  <p className="text-xs text-muted-foreground">
                    These codes are shown only once. Save them in a safe place. Each code can only
                    be used once.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-sm mb-4">
                {generatedCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-3 bg-background rounded border text-center font-semibold"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCodes}
                  className="flex-1"
                >
                  {codesCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Codes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateBackupCodesMutation.mutate()}
                  disabled={generateBackupCodesMutation.isPending}
                  className="flex-1"
                >
                  {generateBackupCodesMutation.isPending ? 'Generating...' : 'Generate New Codes'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
