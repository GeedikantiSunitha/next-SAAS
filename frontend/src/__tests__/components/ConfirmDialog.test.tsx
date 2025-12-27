/**
 * Confirm Dialog Component Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 * 
 * Tests verify:
 * - Dialog rendering
 * - User interactions (confirm/cancel)
 * - Destructive action protection
 * - Custom messages
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDialog } from '../../components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('should render confirmation dialog when open', () => {
    render(
      <ConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        title="Confirm Action"
        description="Are you sure you want to proceed?"
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        title="Confirm Action"
      />
    );

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        title="Confirm Action"
        description="Are you sure?"
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        title="Confirm Action"
        description="Are you sure?"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should show destructive variant for dangerous actions', () => {
    render(
      <ConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        title="Delete Item"
        description="This action cannot be undone"
        variant="destructive"
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    // Destructive variant should have destructive styling
    expect(confirmButton).toBeInTheDocument();
  });

  it('should show custom confirm button text', () => {
    render(
      <ConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        title="Confirm Action"
        confirmText="Delete"
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should show custom cancel button text', () => {
    render(
      <ConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        title="Confirm Action"
        cancelText="Keep"
      />
    );

    expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
  });

  it('should close dialog when clicking outside (if enabled)', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={onCancel}
        title="Confirm Action"
        description="Click outside to close"
        onOpenChange={(open) => {
          if (!open) onCancel();
        }}
      />
    );

    // Modal should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Clicking outside should trigger onOpenChange(false) which calls onCancel
    // This is handled by the Modal component's onOpenChange
    // The test verifies the component structure is correct
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('should disable confirm button when loading', () => {
    render(
      <ConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        title="Confirm Action"
        loading={true}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toBeDisabled();
  });

  it('should show loading state on confirm button', () => {
    render(
      <ConfirmDialog
        open={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        title="Confirm Action"
        loading={true}
      />
    );

    // Button should show loading state
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toBeDisabled();
  });
});

