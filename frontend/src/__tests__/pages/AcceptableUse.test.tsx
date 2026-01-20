/**
 * Acceptable Use Policy Page Tests (TDD)
 *
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 *
 * Requirements:
 * - Display comprehensive acceptable use policy
 * - Include prohibited activities
 * - Include account suspension policy
 * - Include consequences of violations
 * - Include reporting mechanisms
 * - Proper headings and structure
 * - Contact information for abuse reports
 * - Last updated date
 * - Accessible and readable
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AcceptableUse } from '../../pages/AcceptableUse';
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

describe('AcceptableUse Page', () => {
  describe('Page Structure', () => {
    it('should render acceptable use policy page', () => {
      renderWithRouter(<AcceptableUse />);
      expect(screen.getByRole('heading', { name: /acceptable use policy/i })).toBeInTheDocument();
    });

    it('should display last updated date', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/last updated.*january 2026/i);
    });

    it('should have proper page title', () => {
      renderWithRouter(<AcceptableUse />);
      expect(document.title).toContain('Acceptable Use Policy');
    });
  });

  describe('Required Sections', () => {
    it('should have introduction/overview section', () => {
      renderWithRouter(<AcceptableUse />);
      expect(screen.getByRole('heading', { name: /introduction|overview/i })).toBeInTheDocument();
    });

    it('should have prohibited activities section', () => {
      renderWithRouter(<AcceptableUse />);
      expect(screen.getByRole('heading', { name: /prohibited activities|unacceptable use/i })).toBeInTheDocument();
    });

    it('should have account suspension section', () => {
      renderWithRouter(<AcceptableUse />);
      expect(screen.getByRole('heading', { name: /account suspension and termination/i })).toBeInTheDocument();
    });

    it('should have consequences section', () => {
      renderWithRouter(<AcceptableUse />);
      expect(screen.getByRole('heading', { name: /consequences of violations/i })).toBeInTheDocument();
    });

    it('should have reporting section', () => {
      renderWithRouter(<AcceptableUse />);
      expect(screen.getByRole('heading', { name: /reporting violations/i })).toBeInTheDocument();
    });
  });

  describe('Prohibited Activities Content', () => {
    it('should mention illegal activities prohibition', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/illegal|unlawful/i);
    });

    it('should mention spam prohibition', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/spam|unsolicited/i);
    });

    it('should mention harmful content prohibition', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/harmful|malicious|malware/i);
    });

    it('should mention harassment prohibition', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/harassment|abuse|threatening/i);
    });

    it('should mention intellectual property violation', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/intellectual property|copyright|trademark/i);
    });
  });

  describe('Enforcement Content', () => {
    it('should describe account suspension process', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/suspend|suspension/i);
    });

    it('should describe account termination', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/terminat|delete.*account/i);
    });

    it('should mention right to investigate', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/investigate|investigation/i);
    });
  });

  describe('Reporting Mechanism', () => {
    it('should provide contact email for abuse reports', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/abuse@|report@|support@/i);
    });

    it('should describe how to report violations', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/report.*violation|report.*abuse/i);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<AcceptableUse />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should have semantic HTML structure', () => {
      renderWithRouter(<AcceptableUse />);
      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have link to privacy policy', () => {
      renderWithRouter(<AcceptableUse />);
      const links = screen.getAllByRole('link', { name: /privacy policy/i });
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have link to terms of service', () => {
      renderWithRouter(<AcceptableUse />);
      const links = screen.getAllByRole('link', { name: /terms of service/i });
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Content Quality', () => {
    it('should have substantive content (at least 500 characters)', () => {
      renderWithRouter(<AcceptableUse />);
      const bodyText = document.body.textContent || '';
      expect(bodyText.length).toBeGreaterThan(500);
    });

    it('should be well-structured with multiple sections', () => {
      renderWithRouter(<AcceptableUse />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(5);
    });
  });
});
