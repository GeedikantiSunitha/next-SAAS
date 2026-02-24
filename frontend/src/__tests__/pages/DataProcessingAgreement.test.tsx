/**
 * Data Processing Agreement (DPA) Page Tests (TDD)
 *
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 *
 * Requirements:
 * - Display DPA overview/summary
 * - Include GDPR Article 28 compliance
 * - Define controller vs processor roles
 * - List sub-processors
 * - Provide download link to full DPA (PDF)
 * - Include contact information
 * - Last updated date
 * - Accessible and readable
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataProcessingAgreement } from '../../pages/DataProcessingAgreement';
import { createPageWrapper } from '../utils/testWrapper';

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
  return render(component, { wrapper: createPageWrapper() });
};

describe('DataProcessingAgreement Page', () => {
  describe('Page Structure', () => {
    it('should render data processing agreement page', () => {
      renderWithRouter(<DataProcessingAgreement />);
      expect(screen.getByRole('heading', { name: /data processing agreement/i })).toBeInTheDocument();
    });

    it('should display last updated date', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/last updated.*january 2026/i);
    });

    it('should have proper page title', () => {
      renderWithRouter(<DataProcessingAgreement />);
      expect(document.title).toContain('Data Processing Agreement');
    });
  });

  describe('Required Sections', () => {
    it('should have introduction/overview section', () => {
      renderWithRouter(<DataProcessingAgreement />);
      expect(screen.getByRole('heading', { name: /introduction|overview/i })).toBeInTheDocument();
    });

    it('should have roles and responsibilities section', () => {
      renderWithRouter(<DataProcessingAgreement />);
      expect(screen.getByRole('heading', { name: /roles.*responsibilities|controller.*processor/i })).toBeInTheDocument();
    });

    it('should have data processing section', () => {
      renderWithRouter(<DataProcessingAgreement />);
      expect(screen.getByRole('heading', { name: /^data processing \(scope of processing\)$/i })).toBeInTheDocument();
    });

    it('should have sub-processors section', () => {
      renderWithRouter(<DataProcessingAgreement />);
      expect(screen.getByRole('heading', { name: /sub-processors|third.*parties/i })).toBeInTheDocument();
    });

    it('should have security measures section', () => {
      renderWithRouter(<DataProcessingAgreement />);
      expect(screen.getByRole('heading', { name: /security|technical.*organizational/i })).toBeInTheDocument();
    });

    it('should have data breach section', () => {
      renderWithRouter(<DataProcessingAgreement />);
      expect(screen.getByRole('heading', { name: /data breach|breach notification/i })).toBeInTheDocument();
    });
  });

  describe('GDPR Article 28 Compliance', () => {
    it('should mention GDPR Article 28', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/GDPR.*article 28|article 28.*GDPR/i);
    });

    it('should define controller role', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/controller|data controller/i);
    });

    it('should define processor role', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/processor|data processor/i);
    });
  });

  describe('Sub-Processors Content', () => {
    it('should list cloud infrastructure provider', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/AWS|cloud.*infrastructure/i);
    });

    it('should list payment processors', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/Stripe|Razorpay|Cashfree|payment.*processor/i);
    });

    it('should list email service provider', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/Resend|email.*service/i);
    });
  });

  describe('Download Functionality', () => {
    it('should have download DPA button/link', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/download.*DPA|download.*agreement/i);
    });

    it('should mention PDF format', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/PDF/i);
    });
  });

  describe('Contact Information', () => {
    it('should provide contact email for DPA inquiries', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/legal@|dpo@|privacy@/i);
    });

    it('should describe how to request DPA', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/request.*DPA|contact.*DPA/i);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should have semantic HTML structure', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have link to privacy policy', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const links = screen.getAllByRole('link', { name: /privacy policy/i });
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have link to terms of service', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const links = screen.getAllByRole('link', { name: /terms of service/i });
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Content Quality', () => {
    it('should have substantive content (at least 500 characters)', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const bodyText = document.body.textContent || '';
      expect(bodyText.length).toBeGreaterThan(500);
    });

    it('should be well-structured with multiple sections', () => {
      renderWithRouter(<DataProcessingAgreement />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(5);
    });
  });
});
