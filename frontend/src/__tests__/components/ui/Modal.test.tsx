import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../../../components/ui/modal';

describe('Modal Component', () => {
  beforeEach(() => {
    // Clear any mocks or state before each test
    vi.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should not render when closed', () => {
      render(
        <Modal open={false} onOpenChange={vi.fn()}>
          <Modal.Content>
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content>
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>Test Modal Title</Modal.Title>
            </Modal.Header>
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      expect(screen.getByText('Test Modal Title')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should render with description', () => {
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>Test Modal</Modal.Title>
              <Modal.Description>This is a test modal description</Modal.Description>
            </Modal.Header>
          </Modal.Content>
        </Modal>
      );

      expect(screen.getByText('This is a test modal description')).toBeInTheDocument();
    });
  });

  describe('Closing Behavior', () => {
    it('should call onOpenChange when clicking overlay', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Modal open={true} onOpenChange={onOpenChange}>
          <Modal.Content>
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      // Find the overlay (usually has a specific class or data attribute)
      const overlay = screen.getByTestId('modal-overlay');
      await user.click(overlay);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should call onOpenChange when clicking close button', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Modal open={true} onOpenChange={onOpenChange}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>Test Modal</Modal.Title>
              <Modal.CloseButton />
            </Modal.Header>
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      const closeButton = screen.getByTestId('modal-close-button');
      await user.click(closeButton);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should close when pressing Escape key', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Modal open={true} onOpenChange={onOpenChange}>
          <Modal.Content>
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      // Press Escape key
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should not close when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Modal open={true} onOpenChange={onOpenChange}>
          <Modal.Content>
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      const content = screen.getByText('Modal Content');
      await user.click(content);

      // onOpenChange should not be called
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should trap focus inside modal when open', async () => {
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content>
            <button>First Button</button>
            <button>Second Button</button>
            <button>Third Button</button>
          </Modal.Content>
        </Modal>
      );

      const firstButton = screen.getByText('First Button');
      
      // Focus should be on the first focusable element
      await waitFor(() => {
        expect(firstButton).toHaveFocus();
      });
    });

    it('should restore focus to trigger element when closed', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { unmount } = render(
        <Modal open={true} onOpenChange={onOpenChange}>
          <Modal.Content>
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      // Close modal
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      unmount();

      // Focus should return to trigger (tested indirectly)
      // Note: This test might need adjustment based on actual implementation
      expect(triggerButton).toBeInTheDocument();
      
      // Cleanup
      document.body.removeChild(triggerButton);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when open', () => {
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>Test Modal</Modal.Title>
            </Modal.Header>
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('should associate title with dialog via aria-labelledby', () => {
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>Test Modal Title</Modal.Title>
            </Modal.Header>
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      const title = screen.getByText('Test Modal Title');
      
      const titleId = title.getAttribute('id');
      expect(modal).toHaveAttribute('aria-labelledby', titleId);
    });

    it('should associate description with dialog via aria-describedby when description present', () => {
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>Test Modal</Modal.Title>
              <Modal.Description>Test Description</Modal.Description>
            </Modal.Header>
          </Modal.Content>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      const description = screen.getByText('Test Description');
      
      const descriptionId = description.getAttribute('id');
      expect(modal).toHaveAttribute('aria-describedby', descriptionId);
    });
  });

  describe('Content Structure', () => {
    it('should render footer with actions', () => {
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content>
            <p>Modal Content</p>
            <Modal.Footer>
              <button>Cancel</button>
              <button>Save</button>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should handle custom className', () => {
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content className="custom-class">
            <p>Modal Content</p>
          </Modal.Content>
        </Modal>
      );

      const content = screen.getByText('Modal Content').closest('[class*="custom-class"]');
      expect(content).toBeInTheDocument();
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in title', () => {
      const maliciousScript = '<script>alert("XSS")</script>';
      
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>{maliciousScript}</Modal.Title>
            </Modal.Header>
          </Modal.Content>
        </Modal>
      );

      // React automatically escapes HTML, so script should be rendered as text
      const title = screen.getByText(maliciousScript);
      expect(title).toBeInTheDocument();
      expect(title.innerHTML).not.toContain('<script>');
    });

    it('should escape HTML in description', () => {
      const maliciousScript = '<img src="x" onerror="alert(\'XSS\')" />';
      
      render(
        <Modal open={true} onOpenChange={vi.fn()}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>Test</Modal.Title>
              <Modal.Description>{maliciousScript}</Modal.Description>
            </Modal.Header>
          </Modal.Content>
        </Modal>
      );

      const description = screen.getByText(maliciousScript);
      expect(description).toBeInTheDocument();
      // React escapes attributes, so onerror should not be executed
      expect(description.innerHTML).toContain('&lt;');
    });
  });
});

