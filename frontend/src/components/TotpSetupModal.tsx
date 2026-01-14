/**
 * TOTP Setup Modal Component
 * 
 * Handles TOTP MFA setup flow:
 * 1. Setup TOTP (get QR code and backup codes)
 * 2. Verify code from authenticator app
 * 3. Enable MFA
 */

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from './ui/modal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Skeleton } from './ui/skeleton';
import { useSetupTotp, useEnableMfa } from '../hooks/useMfa';
import { useToast } from '../hooks/use-toast';
import { Copy, CheckCircle, Info, AlertCircle } from 'lucide-react';

interface TotpSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TotpSetupModal = ({ open, onOpenChange }: TotpSetupModalProps) => {
  const { toast } = useToast();
  const setupTotpMutation = useSetupTotp();
  const enableMfaMutation = useEnableMfa();

  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [codesCopied, setCodesCopied] = useState(false);

  // Setup TOTP when modal opens
  useEffect(() => {
    if (open && step === 'setup') {
      setupTotpMutation.mutate();
    }
  }, [open]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setStep('setup');
      setVerificationCode('');
      setBackupCodes([]);
      setCodesCopied(false);
    }
  }, [open]);

  const handleVerify = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code from your authenticator app',
        variant: 'error',
      });
      return;
    }

    enableMfaMutation.mutate(
      {
        method: 'TOTP',
        code: verificationCode,
      },
      {
        onSuccess: () => {
          setStep('setup');
          setVerificationCode('');
          onOpenChange(false);
        },
      }
    );
  };

  const handleCopyBackupCodes = () => {
    if (backupCodes.length > 0) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setCodesCopied(true);
      setTimeout(() => setCodesCopied(false), 2000);
      toast({
        title: 'Copied',
        description: 'Backup codes copied to clipboard',
      });
    }
  };

  const setupData = setupTotpMutation.data?.data;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Setup Authenticator App (TOTP)</ModalTitle>
          <ModalDescription>
            {step === 'setup'
              ? 'Scan the QR code with your authenticator app (Google Authenticator, Authy, or similar), then enter the verification code'
              : 'Enter the 6-digit code from your authenticator app'}
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-6 py-4">
          {step === 'setup' && (
            <>
              {setupTotpMutation.isPending && (
                <div className="space-y-4">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}

              {setupTotpMutation.isSuccess && setupData && (
                <>
                  {/* Helpful Instructions */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          First time using MFA?
                        </p>
                        <p className="text-sm text-blue-800">
                          Install an authenticator app like <strong>Google Authenticator</strong> or <strong>Authy</strong> on your phone, 
                          then scan the QR code below. The app will generate 6-digit codes that change every 30 seconds.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-lg border p-4 bg-white">
                      <img
                        src={setupData.qrCodeUrl}
                        alt="TOTP QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>

                  {/* Secret Key (for manual entry) */}
                  <div className="space-y-2">
                    <Label>Secret Key (for manual entry)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={setupData.secret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(setupData.secret);
                          toast({
                            title: 'Copied',
                            description: 'Secret key copied to clipboard',
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Backup Codes */}
                  {setupData.backupCodes && setupData.backupCodes.length > 0 && (
                    <div className="space-y-2">
                      <Label>Backup Codes (save these securely)</Label>
                      <div className="rounded-lg border bg-muted p-4">
                        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                          {setupData.backupCodes.map((code, index) => (
                            <div key={index} className="p-2 bg-background rounded">
                              {code}
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 w-full"
                          onClick={handleCopyBackupCodes}
                        >
                          {codesCopied ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Backup Codes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Verification Code Input */}
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">
                      Enter verification code from your app
                    </Label>
                    <Input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                      }}
                      placeholder="000000"
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                  </div>
                </>
              )}

              {setupTotpMutation.isError && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive mb-1">
                        Setup Failed
                      </p>
                      <p className="text-sm text-destructive/90">
                        {setupTotpMutation.error?.response?.data?.error || 'Failed to setup TOTP. Please try again.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 'setup' && setupTotpMutation.isSuccess && (
            <Button
              onClick={handleVerify}
              disabled={
                !verificationCode ||
                verificationCode.length !== 6 ||
                enableMfaMutation.isPending
              }
            >
              {enableMfaMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
