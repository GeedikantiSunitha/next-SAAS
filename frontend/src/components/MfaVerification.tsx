/**
 * MFA Verification Component
 * 
 * Used during login to verify MFA code when MFA is enabled
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LoadingButton } from './ui/loading';
import { Shield, Smartphone, Mail, Key } from 'lucide-react';

interface MfaVerificationProps {
  method: 'TOTP' | 'EMAIL';
  onVerify: (code: string, isBackupCode?: boolean) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  showBackupCodeOption?: boolean;
  error?: string | null;
}

export const MfaVerification = ({
  method,
  onVerify,
  onCancel,
  isLoading = false,
  showBackupCodeOption = true,
  error,
}: MfaVerificationProps) => {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === (useBackupCode ? 8 : 6)) {
      onVerify(code, useBackupCode);
    }
  };

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const maxLength = useBackupCode ? 8 : 6;
    setCode(numericValue.slice(0, maxLength));
  };

  const isCodeValid = code.length === (useBackupCode ? 8 : 6);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Multi-Factor Authentication
        </CardTitle>
        <CardDescription>
          {useBackupCode
            ? 'Enter your backup code to continue'
            : method === 'TOTP'
            ? 'Enter the 6-digit code from your authenticator app'
            : 'Enter the 6-digit code sent to your email'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="mfa-code">
              {useBackupCode ? 'Enter backup code' : 'Enter verification code'}
            </Label>
            <Input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder={useBackupCode ? '12345678' : '000000'}
              className="text-center text-2xl font-mono tracking-widest"
              autoFocus
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground text-center">
              {useBackupCode
                ? 'Enter an 8-digit backup code'
                : `Enter the ${method === 'TOTP' ? '6-digit' : '6-digit'} code`}
            </p>
          </div>

          {showBackupCodeOption && !useBackupCode && (
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUseBackupCode(true)}
                disabled={isLoading}
              >
                <Key className="h-4 w-4 mr-2" />
                Use Backup Code
              </Button>
            </div>
          )}

          {useBackupCode && (
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseBackupCode(false);
                  setCode('');
                }}
                disabled={isLoading}
              >
                Use Authenticator Code
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={isLoading}
              loadingText="Verifying..."
              disabled={!isCodeValid || isLoading}
              className="flex-1"
              data-testid="verify-button"
            >
              Verify
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
