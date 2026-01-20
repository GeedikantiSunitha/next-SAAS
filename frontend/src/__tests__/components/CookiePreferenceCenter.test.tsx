/**
 * Cookie Preference Center Component Tests (TDD)
 *
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 *
 * Requirements:
 * - Modal/dialog that opens when "Customize" is clicked
 * - Display individual toggles for each cookie category
 * - Essential cookies always enabled (non-toggleable)
 * - Allow users to toggle analytics, marketing, functional cookies
 * - Load current preferences from backend
 * - Save preferences to backend API
 * - Close modal on save or cancel
 * - Keyboard accessible (ESC to close)
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CookiePreferenceCenter } from '../../components/gdpr/CookiePreferenceCenter';

// Mock GDPR API
vi.mock('../../api/gdpr', () => ({
  gdprApi: {
    getCookieConsent: vi.fn(),
    saveCookieConsent: vi.fn(),
  },
}));

import { gdprApi } from '../../api/gdpr';

describe('CookiePreferenceCenter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should not render modal when isOpen is false', () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={false} onClose={() => {}} onSave={() => {}} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<CookiePreferenceCenter isOpen={true} onClose={onClose} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close|cancel/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when ESC key is pressed', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<CookiePreferenceCenter isOpen={true} onClose={onClose} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Content', () => {
    it('should display title', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /cookie preferences/i })).toBeInTheDocument();
      });
    });

    it('should display essential cookies toggle (disabled)', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        const essentialSwitch = screen.getByRole('checkbox', { name: /essential/i });
        expect(essentialSwitch).toBeInTheDocument();
        expect(essentialSwitch).toBeChecked();
        expect(essentialSwitch).toBeDisabled();
      });
    });

    it('should display analytics cookies toggle', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        const analyticsSwitch = screen.getByRole('checkbox', { name: /analytics/i });
        expect(analyticsSwitch).toBeInTheDocument();
        expect(analyticsSwitch).not.toBeDisabled();
      });
    });

    it('should display marketing cookies toggle', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        const marketingSwitch = screen.getByRole('checkbox', { name: /marketing/i });
        expect(marketingSwitch).toBeInTheDocument();
        expect(marketingSwitch).not.toBeDisabled();
      });
    });

    it('should display functional cookies toggle', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        const functionalSwitch = screen.getByRole('checkbox', { name: /functional/i });
        expect(functionalSwitch).toBeInTheDocument();
        expect(functionalSwitch).not.toBeDisabled();
      });
    });

    it('should display save button', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save preferences|save/i })).toBeInTheDocument();
      });
    });

    it('should display cancel button', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel|close/i })).toBeInTheDocument();
      });
    });
  });

  describe('Load Existing Preferences', () => {
    it('should load existing preferences from API', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({
        success: true,
        data: {
          essential: true,
          analytics: true,
          marketing: false,
          functional: true,
        },
      });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        const analyticsSwitch = screen.getByRole('checkbox', { name: /analytics/i });
        const marketingSwitch = screen.getByRole('checkbox', { name: /marketing/i });
        const functionalSwitch = screen.getByRole('checkbox', { name: /functional/i });

        expect(analyticsSwitch).toBeChecked();
        expect(marketingSwitch).not.toBeChecked();
        expect(functionalSwitch).toBeChecked();
      });
    });

    it('should default all to false when no existing preferences', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({
        success: true,
        data: null,
      });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        const analyticsSwitch = screen.getByRole('checkbox', { name: /analytics/i });
        const marketingSwitch = screen.getByRole('checkbox', { name: /marketing/i });
        const functionalSwitch = screen.getByRole('checkbox', { name: /functional/i });

        expect(analyticsSwitch).not.toBeChecked();
        expect(marketingSwitch).not.toBeChecked();
        expect(functionalSwitch).not.toBeChecked();
      });
    });
  });

  describe('Toggle Preferences', () => {
    it('should toggle analytics preference', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      const user = userEvent.setup();

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const analyticsSwitch = screen.getByRole('checkbox', { name: /analytics/i });
      expect(analyticsSwitch).not.toBeChecked();

      await user.click(analyticsSwitch);
      expect(analyticsSwitch).toBeChecked();

      await user.click(analyticsSwitch);
      expect(analyticsSwitch).not.toBeChecked();
    });

    it('should toggle marketing preference', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      const user = userEvent.setup();

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const marketingSwitch = screen.getByRole('checkbox', { name: /marketing/i });
      expect(marketingSwitch).not.toBeChecked();

      await user.click(marketingSwitch);
      expect(marketingSwitch).toBeChecked();
    });

    it('should toggle functional preference', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      const user = userEvent.setup();

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const functionalSwitch = screen.getByRole('checkbox', { name: /functional/i });
      expect(functionalSwitch).not.toBeChecked();

      await user.click(functionalSwitch);
      expect(functionalSwitch).toBeChecked();
    });

    it('should not allow toggling essential cookies', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      const user = userEvent.setup();

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const essentialSwitch = screen.getByRole('checkbox', { name: /essential/i });
      expect(essentialSwitch).toBeChecked();
      expect(essentialSwitch).toBeDisabled();

      // Try to click (should not work)
      await user.click(essentialSwitch);
      expect(essentialSwitch).toBeChecked();
    });
  });

  describe('Save Preferences', () => {
    it('should save custom preferences to API', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      (gdprApi.saveCookieConsent as any).mockResolvedValue({ success: true });
      const onSave = vi.fn();
      const user = userEvent.setup();

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={onSave} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Toggle analytics and functional
      const analyticsSwitch = screen.getByRole('checkbox', { name: /analytics/i });
      const functionalSwitch = screen.getByRole('checkbox', { name: /functional/i });

      await user.click(analyticsSwitch);
      await user.click(functionalSwitch);

      // Save
      const saveButton = screen.getByRole('button', { name: /save preferences|save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(gdprApi.saveCookieConsent).toHaveBeenCalledWith(
          expect.objectContaining({
            essential: true,
            analytics: true,
            marketing: false,
            functional: true,
            version: expect.any(String),
          })
        );
      });
    });

    it('should call onSave callback after successful save', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      (gdprApi.saveCookieConsent as any).mockResolvedValue({ success: true });
      const onSave = vi.fn();
      const user = userEvent.setup();

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={onSave} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save preferences|save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onSave if API save fails', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      (gdprApi.saveCookieConsent as any).mockRejectedValue(new Error('Network error'));
      const onSave = vi.fn();
      const user = userEvent.setup();

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={onSave} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save preferences|save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(gdprApi.saveCookieConsent).toHaveBeenCalled();
      });

      // Wait a bit and confirm onSave was NOT called
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors when loading preferences', async () => {
      (gdprApi.getCookieConsent as any).mockRejectedValue(new Error('Network error'));

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      // Should still render with default values
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const analyticsSwitch = screen.getByRole('checkbox', { name: /analytics/i });
      expect(analyticsSwitch).not.toBeChecked();
    });

    it('should show error message when save fails', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      (gdprApi.saveCookieConsent as any).mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save preferences|save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should have accessible labels for all switches', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /essential/i })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /analytics/i })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /marketing/i })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /functional/i })).toBeInTheDocument();
      });
    });

    it('should have focusable interactive elements', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify there are focusable elements (buttons and inputs)
      const buttons = screen.getAllByRole('button');
      const checkboxes = screen.getAllByRole('checkbox');
      expect(buttons.length).toBeGreaterThan(0);
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Descriptions', () => {
    it('should display description for essential cookies', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText(/required for the website to function/i)).toBeInTheDocument();
      });
    });

    it('should display description for analytics cookies', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText(/understand how visitors interact/i)).toBeInTheDocument();
      });
    });

    it('should display description for marketing cookies', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText(/deliver personalized advertisements/i)).toBeInTheDocument();
      });
    });

    it('should display description for functional cookies', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookiePreferenceCenter isOpen={true} onClose={() => {}} onSave={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText(/enable enhanced functionality and personalization/i)).toBeInTheDocument();
      });
    });
  });
});
