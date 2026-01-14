/**
 * Email MFA Setup Modal Component
 * 
 * Handles Email MFA setup flow:
 * 1. Setup Email MFA (sends OTP to email)
 * 2. Verify OTP from email
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
import { useSetupEmailMfa, useEnableMfa, useSendEmailOtp } from '../hooks/useMfa';
import { useToast } from '../hooks/use-toast';
import { Mail, RefreshCw, AlertCircle, Info } from 'lucide-react';

interface EmailMfaSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmailMfaSetupModal = ({ open, onOpenChange }: EmailMfaSetupModalProps) => {
  const { toast } = useToast();
  const setupEmailMfaMutation = useSetupEmailMfa();
  const sendEmailOtpMutation = useSendEmailOtp();
  const enableMfaMutation = useEnableMfa();

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Setup Email MFA when modal opens
  useEffect(() => {
    if (open) {
      setupEmailMfaMutation.mutate();
      setOtpSent(false);
      setOtp('');
    }
  }, [open]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setOtp('');
      setOtpSent(false);
    }
  }, [open]);

  // Mark OTP as sent when setup succeeds
  useEffect(() => {
    if (setupEmailMfaMutation.isSuccess) {
      // If setup succeeded, OTP was sent
      setOtpSent(true);
    }
  }, [setupEmailMfaMutation.isSuccess]);

  const handleResendOtp = () => {
    sendEmailOtpMutation.mutate();
  };

  const handleVerify = () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit code from your email',
        variant: 'error',
      });
      return;
    }

    enableMfaMutation.mutate(
      {
        method: 'EMAIL',
        code: otp,
      },
      {
        onSuccess: () => {
          setOtp('');
          setOtpSent(false);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Setup Email MFA</ModalTitle>
          <ModalDescription>
            {otpSent
              ? 'Enter the verification code sent to your email'
              : 'We will send a verification code to your email address'}
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-6 py-4">
          {setupEmailMfaMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Setting up Email MFA...</p>
              </div>
            </div>
          )}

          {otpSent && (
            <>
              <div className="flex items-center justify-center py-4">
                <div className="rounded-full bg-green-100 p-3">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                We've sent a verification code to your email address.
                <br />
                Please check your inbox (and spam folder) and enter the code below.
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  The code expires in 10 minutes.
                </span>
              </p>

              <div className="space-y-2">
                <Label htmlFor="email-otp">Verification Code</Label>
                <Input
                  id="email-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={sendEmailOtpMutation.isPending}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      sendEmailOtpMutation.isPending ? 'animate-spin' : ''
                    }`}
                  />
                  {sendEmailOtpMutation.isPending ? 'Sending...' : 'Resend Code'}
                </Button>
              </div>
            </>
          )}

          {setupEmailMfaMutation.isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Failed to setup Email MFA
                  </p>
                  <p className="text-sm text-destructive/90">
                    {setupEmailMfaMutation.error?.response?.data?.error?.toLowerCase().includes('email') ||
                    setupEmailMfaMutation.error?.response?.data?.error?.toLowerCase().includes('resend') ||
                    setupEmailMfaMutation.error?.response?.data?.error?.toLowerCase().includes('configure')
                      ? 'Email service is not configured. Please contact your administrator or use TOTP MFA instead.'
                      : setupEmailMfaMutation.error?.response?.data?.error || 'Please try again or use TOTP MFA as an alternative.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!setupEmailMfaMutation.isError && !setupEmailMfaMutation.isPending && !otpSent && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    How Email MFA Works
                  </p>
                  <p className="text-sm text-blue-800">
                    We'll send a 6-digit verification code to your email address. 
                    You'll need to enter this code to complete setup and use it for future logins.
                  </p>
                </div>
              </div>
            </div>
          )}

          {enableMfaMutation.isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Verification Failed
                  </p>
                  <p className="text-sm text-destructive/90">
                    {enableMfaMutation.error?.response?.data?.error || 'Invalid verification code. Please check the code and try again, or request a new code.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {otpSent && (
            <Button
              onClick={handleVerify}
              disabled={!otp || otp.length !== 6 || enableMfaMutation.isPending}
            >
              {enableMfaMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
