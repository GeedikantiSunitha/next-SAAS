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
import { Mail, RefreshCw } from 'lucide-react';

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
        variant: 'destructive',
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
                Please check your inbox and enter the code below.
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
              <p className="text-sm text-destructive">
                Failed to setup Email MFA. Please try again.
              </p>
            </div>
          )}

          {enableMfaMutation.isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                Invalid verification code. Please try again.
              </p>
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
