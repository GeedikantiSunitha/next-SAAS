/**
 * Terms of Service Page Tests (TDD)
 *
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 *
 * Requirements:
 * - Display comprehensive terms of service
 * - Legal sections (acceptance, user obligations, service terms, etc.)
 * - Proper headings and structure
 * - Links to related pages
 * - Last updated date
 * - Accessible and readable
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { TermsOfService } from '../../pages/TermsOfService';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('TermsOfService Page', () => {
  describe('Page Structure', () => {
    it('should render terms of service page', () => {
      renderWithRouter(<TermsOfService />);
      expect(screen.getByRole('heading', { name: /terms of service|terms and conditions/i })).toBeInTheDocument();
    });

    it('should display last updated date', () => {
      renderWithRouter(<TermsOfService />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/last updated.*january 2026/i);
    });

    it('should have proper page title', () => {
      renderWithRouter(<TermsOfService />);
      expect(document.title).toContain('Terms of Service');
    });
  });

  describe('Legal Sections', () => {
    it('should have acceptance of terms section', () => {
      renderWithRouter(<TermsOfService />);
      expect(screen.getByRole('heading', { name: /acceptance|agreement to terms/i })).toBeInTheDocument();
    });

    it('should have user accounts section', () => {
      renderWithRouter(<TermsOfService />);
      expect(screen.getByRole('heading', { name: /^user accounts$/i })).toBeInTheDocument();
    });

    it('should have user obligations section', () => {
      renderWithRouter(<TermsOfService />);
      const headings = screen.getAllByRole('heading');
      const hasObligationsSection = headings.some(h =>
        /user obligations|your obligations/i.test(h.textContent || '')
      );
      expect(hasObligationsSection).toBe(true);
    });

    it('should have intellectual property section', () => {
      renderWithRouter(<TermsOfService />);
      const headings = screen.getAllByRole('heading');
      const hasIPSection = headings.some(h =>
        /intellectual property|ownership/i.test(h.textContent || '')
      );
      expect(hasIPSection).toBe(true);
    });

    it('should have service availability section', () => {
      renderWithRouter(<TermsOfService />);
      expect(screen.getByRole('heading', { name: /service availability|modifications|changes to service/i })).toBeInTheDocument();
    });

    it('should have payment and subscriptions section', () => {
      renderWithRouter(<TermsOfService />);
      const headings = screen.getAllByRole('heading');
      const hasPaymentSection = headings.some(h =>
        /payment.*subscriptions|billing/i.test(h.textContent || '')
      );
      expect(hasPaymentSection).toBe(true);
    });

    it('should have termination section', () => {
      renderWithRouter(<TermsOfService />);
      expect(screen.getByRole('heading', { name: /termination|account suspension/i })).toBeInTheDocument();
    });

    it('should have disclaimers section', () => {
      renderWithRouter(<TermsOfService />);
      expect(screen.getByRole('heading', { name: /disclaimer|warranties/i })).toBeInTheDocument();
    });

    it('should have limitation of liability section', () => {
      renderWithRouter(<TermsOfService />);
      expect(screen.getByRole('heading', { name: /limitation of liability|liability/i })).toBeInTheDocument();
    });

    it('should have governing law section', () => {
      renderWithRouter(<TermsOfService />);
      expect(screen.getByRole('heading', { name: /governing law|jurisdiction/i })).toBeInTheDocument();
    });

    it('should have contact section', () => {
      renderWithRouter(<TermsOfService />);
      expect(screen.getByRole('heading', { name: /contact|questions/i })).toBeInTheDocument();
    });
  });

  describe('Links and Navigation', () => {
    it('should link to privacy policy', () => {
      renderWithRouter(<TermsOfService />);
      const privacyLinks = screen.getAllByRole('link', { name: /privacy policy/i });
      expect(privacyLinks.length).toBeGreaterThan(0);
      expect(privacyLinks[0]).toHaveAttribute('href', '/privacy-policy');
    });

    it('should link to cookie policy', () => {
      renderWithRouter(<TermsOfService />);
      const cookiePolicyLinks = screen.getAllByRole('link', { name: /cookie policy/i });
      expect(cookiePolicyLinks.length).toBeGreaterThan(0);
      expect(cookiePolicyLinks[0]).toHaveAttribute('href', '/cookie-policy');
    });
  });

  describe('Contact Information', () => {
    it('should display contact email', () => {
      renderWithRouter(<TermsOfService />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/support@nextsaas.com|legal@nextsaas.com/i);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<TermsOfService />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(5);
    });
  });

  describe('Content Quality', () => {
    it('should have substantial content', () => {
      renderWithRouter(<TermsOfService />);
      const bodyText = document.body.textContent || '';
      expect(bodyText.length).toBeGreaterThan(1000);
    });

    it('should mention service provider name', () => {
      renderWithRouter(<TermsOfService />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/NextSaaS/i);
    });
  });
});
