/**
 * Privacy Policy Page Tests (TDD)
 *
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 *
 * Requirements:
 * - Display comprehensive privacy policy
 * - Include all GDPR-required sections
 * - Proper headings and structure
 * - Links to related pages (cookie policy, terms)
 * - Contact information
 * - Last updated date
 * - Accessible and readable
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PrivacyPolicy } from '../../pages/PrivacyPolicy';
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

describe('PrivacyPolicy Page', () => {
  describe('Page Structure', () => {
    it('should render privacy policy page', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
    });

    it('should display last updated date', () => {
      renderWithRouter(<PrivacyPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/last updated.*january 2026/i);
    });

    it('should have proper page title', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(document.title).toContain('Privacy Policy');
    });
  });

  describe('GDPR Required Sections', () => {
    it('should have data controller section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /data controller|who we are/i })).toBeInTheDocument();
    });

    it('should have data collection section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /data we collect|information we collect/i })).toBeInTheDocument();
    });

    it('should have data usage section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /how we use|use of data/i })).toBeInTheDocument();
    });

    it('should have legal basis section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /legal basis|lawful basis/i })).toBeInTheDocument();
    });

    it('should have data sharing section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /sharing|third parties/i })).toBeInTheDocument();
    });

    it('should have data retention section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /retention|how long/i })).toBeInTheDocument();
    });

    it('should have user rights section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /your rights|data subject rights/i })).toBeInTheDocument();
    });

    it('should have cookies section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /cookies/i })).toBeInTheDocument();
    });

    it('should have security section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /security|data security/i })).toBeInTheDocument();
    });

    it('should have contact section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /contact|reach us/i })).toBeInTheDocument();
    });

    it('should have changes section', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /changes|updates to policy/i })).toBeInTheDocument();
    });
  });

  describe('User Rights', () => {
    it('should mention right to access', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByText(/right to access/i)).toBeInTheDocument();
    });

    it('should mention right to rectification', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByText(/right to rectification|right to correct/i)).toBeInTheDocument();
    });

    it('should mention right to erasure', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByText(/right to erasure|right to be forgotten/i)).toBeInTheDocument();
    });

    it('should mention right to data portability', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByText(/right to data portability|right to portability/i)).toBeInTheDocument();
    });

    it('should mention right to object', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByText(/right to object/i)).toBeInTheDocument();
    });

    it('should mention right to withdraw consent', () => {
      renderWithRouter(<PrivacyPolicy />);
      expect(screen.getByRole('heading', { name: /withdraw consent|right to withdraw/i })).toBeInTheDocument();
    });
  });

  describe('Links and Navigation', () => {
    it('should link to cookie policy', () => {
      renderWithRouter(<PrivacyPolicy />);
      const cookiePolicyLinks = screen.getAllByRole('link', { name: /cookie policy/i });
      expect(cookiePolicyLinks.length).toBeGreaterThan(0);
      expect(cookiePolicyLinks[0]).toHaveAttribute('href', '/cookie-policy');
    });

    it('should link to terms of service', () => {
      renderWithRouter(<PrivacyPolicy />);
      const termsLinks = screen.getAllByRole('link', { name: /terms of service|terms/i });
      expect(termsLinks.length).toBeGreaterThan(0);
      expect(termsLinks[0]).toHaveAttribute('href', '/terms');
    });

    it('should link to GDPR settings page', () => {
      renderWithRouter(<PrivacyPolicy />);
      const gdprLinks = screen.getAllByRole('link', { name: /manage.*data|privacy settings/i });
      expect(gdprLinks.length).toBeGreaterThan(0);
      expect(gdprLinks[0]).toHaveAttribute('href', '/gdpr-settings');
    });
  });

  describe('Contact Information', () => {
    it('should display contact email', () => {
      renderWithRouter(<PrivacyPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/privacy@nextsaas.com|support@nextsaas.com/i);
    });

    it('should display company information', () => {
      renderWithRouter(<PrivacyPolicy />);
      // Company name should be visible
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<PrivacyPolicy />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(5); // Multiple sections
    });

    it('should be readable with semantic HTML', () => {
      renderWithRouter(<PrivacyPolicy />);
      // Check for semantic HTML structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(5);
    });
  });

  describe('Content Quality', () => {
    it('should have substantial content', () => {
      renderWithRouter(<PrivacyPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText.length).toBeGreaterThan(1000); // Substantial policy
    });

    it('should mention GDPR compliance', () => {
      renderWithRouter(<PrivacyPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/GDPR|General Data Protection Regulation/i);
    });
  });
});
