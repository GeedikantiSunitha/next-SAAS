/**
 * Cookie Consent Banner Component Tests (TDD)
 *
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 *
 * Requirements:
 * - Display banner when user hasn't consented
 * - Hide banner when user has consented
 * - Allow accepting all cookies
 * - Allow rejecting non-essential cookies
 * - Allow customizing cookie preferences
 * - Persist consent to backend API
 * - Display at bottom of screen (non-intrusive)
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CookieConsentBanner } from '../../components/gdpr/CookieConsentBanner';

// Mock GDPR API
vi.mock('../../api/gdpr', () => ({
  gdprApi: {
    getCookieConsent: vi.fn(),
    saveCookieConsent: vi.fn(),
  },
}));

import { gdprApi } from '../../api/gdpr';

describe('CookieConsentBanner Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('Visibility', () => {
    it('should render banner when no consent exists', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });
    });

    it('should not render banner when consent exists', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({
        success: true,
        data: {
          essential: true,
          analytics: true,
          marketing: false,
          functional: true,
        },
      });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      });
    });

    it('should hide banner after accepting', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      (gdprApi.saveCookieConsent as any).mockResolvedValue({ success: true });

      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });

      const acceptButton = screen.getByRole('button', { name: /accept all/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Content', () => {
    it('should display cookie notice message', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
      });
    });

    it('should display link to cookie policy', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        const policyLink = screen.getByRole('link', { name: /cookie policy|learn more/i });
        expect(policyLink).toBeInTheDocument();
      });
    });

    it('should display accept all button', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /accept all/i })).toBeInTheDocument();
      });
    });

    it('should display reject button', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reject|essential only/i })).toBeInTheDocument();
      });
    });

    it('should display customize button', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /customize|preferences/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accept All Cookies', () => {
    it('should send correct preferences when accepting all', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      (gdprApi.saveCookieConsent as any).mockResolvedValue({ success: true });

      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });

      const acceptButton = screen.getByRole('button', { name: /accept all/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(gdprApi.saveCookieConsent).toHaveBeenCalledWith(
          expect.objectContaining({
            essential: true,
            analytics: true,
            marketing: true,
            functional: true,
            version: expect.any(String),
          })
        );
      });
    });

    it('should hide banner after successful accept', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      (gdprApi.saveCookieConsent as any).mockResolvedValue({ success: true });

      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      const acceptButton = await screen.findByRole('button', { name: /accept all/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Reject Non-Essential Cookies', () => {
    it('should send correct preferences when rejecting', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      (gdprApi.saveCookieConsent as any).mockResolvedValue({ success: true });

      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });

      const rejectButton = screen.getByRole('button', { name: /reject|essential only/i });
      await user.click(rejectButton);

      await waitFor(() => {
        expect(gdprApi.saveCookieConsent).toHaveBeenCalledWith(
          expect.objectContaining({
            essential: true,
            analytics: false,
            marketing: false,
            functional: false,
            version: expect.any(String),
          })
        );
      });
    });

    it('should hide banner after successful reject', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      (gdprApi.saveCookieConsent as any).mockResolvedValue({ success: true });

      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      const rejectButton = await screen.findByRole('button', { name: /reject|essential only/i });
      await user.click(rejectButton);

      await waitFor(() => {
        expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully when fetching consent', async () => {
      (gdprApi.getCookieConsent as any).mockRejectedValue(new Error('Network error'));

      render(<CookieConsentBanner />);

      // Banner should still render even if API fails
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });
    });

    it('should handle API errors when saving consent', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });
      (gdprApi.saveCookieConsent as any).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      const acceptButton = await screen.findByRole('button', { name: /accept all/i });
      await user.click(acceptButton);

      // Banner should remain visible on error
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', async () => {
      (gdprApi.getCookieConsent as any).mockResolvedValue({ success: true, data: null });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
