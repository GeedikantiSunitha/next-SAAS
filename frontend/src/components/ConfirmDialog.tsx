/**
 * Confirm Dialog Component
 * 
 * A reusable confirmation dialog for destructive actions
 * Prevents accidental data loss by requiring explicit confirmation
 */

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
} from './ui/modal';
import { Button } from './ui/button';
import { LoadingButton } from './ui/loading';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ConfirmDialog = ({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  onOpenChange,
}: ConfirmDialogProps) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    onCancel();
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      handleCancel();
    }
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="sm:max-w-[425px]">
        <ModalHeader>
          <div className="flex items-center gap-3">
            {variant === 'destructive' && (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            <ModalTitle>{title}</ModalTitle>
          </div>
          {description && (
            <ModalDescription className="pt-2">
              {description}
            </ModalDescription>
          )}
        </ModalHeader>
        <ModalFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <LoadingButton
            type="button"
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {confirmText}
          </LoadingButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

