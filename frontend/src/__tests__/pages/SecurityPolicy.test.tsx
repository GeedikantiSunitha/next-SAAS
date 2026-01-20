/**
 * Security Policy Page Tests (TDD)
 *
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 *
 * Requirements:
 * - Display security measures and practices
 * - Include encryption standards
 * - Include access controls
 * - Include incident response
 * - Provide security contact information
 * - Last updated date
 * - Accessible and readable
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { SecurityPolicy } from '../../pages/SecurityPolicy';
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

describe('SecurityPolicy Page', () => {
  describe('Page Structure', () => {
    it('should render security policy page', () => {
      renderWithRouter(<SecurityPolicy />);
      expect(screen.getByRole('heading', { name: /security policy/i })).toBeInTheDocument();
    });

    it('should display last updated date', () => {
      renderWithRouter(<SecurityPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/last updated.*january 2026/i);
    });

    it('should have proper page title', () => {
      renderWithRouter(<SecurityPolicy />);
      expect(document.title).toContain('Security Policy');
    });
  });

  describe('Required Sections', () => {
    it('should have overview section', () => {
      renderWithRouter(<SecurityPolicy />);
      expect(screen.getByRole('heading', { name: /overview|introduction/i })).toBeInTheDocument();
    });

    it('should have encryption section', () => {
      renderWithRouter(<SecurityPolicy />);
      expect(screen.getByRole('heading', { name: /^data encryption$/i })).toBeInTheDocument();
    });

    it('should have access control section', () => {
      renderWithRouter(<SecurityPolicy />);
      expect(screen.getByRole('heading', { name: /^access control and authentication$/i })).toBeInTheDocument();
    });

    it('should have incident response section', () => {
      renderWithRouter(<SecurityPolicy />);
      expect(screen.getByRole('heading', { name: /^incident response \(security incident management\)$/i })).toBeInTheDocument();
    });

    it('should have vulnerability reporting section', () => {
      renderWithRouter(<SecurityPolicy />);
      expect(screen.getByRole('heading', { name: /^vulnerability reporting \(responsible disclosure\)$/i })).toBeInTheDocument();
    });
  });

  describe('Security Content', () => {
    it('should mention encryption in transit', () => {
      renderWithRouter(<SecurityPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/TLS|SSL|HTTPS|encryption.*transit/i);
    });

    it('should mention encryption at rest', () => {
      renderWithRouter(<SecurityPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/encryption.*rest|database encryption/i);
    });

    it('should mention password security', () => {
      renderWithRouter(<SecurityPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/password.*hash|bcrypt/i);
    });

    it('should mention multi-factor authentication', () => {
      renderWithRouter(<SecurityPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/multi-factor|MFA|two-factor|2FA/i);
    });

    it('should mention role-based access control', () => {
      renderWithRouter(<SecurityPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/RBAC|role-based.*access|access control/i);
    });
  });

  describe('Contact Information', () => {
    it('should provide security contact email', () => {
      renderWithRouter(<SecurityPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/security@/i);
    });

    it('should describe how to report vulnerabilities', () => {
      renderWithRouter(<SecurityPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/report.*vulnerability|report.*security/i);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<SecurityPolicy />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should have semantic HTML structure', () => {
      renderWithRouter(<SecurityPolicy />);
      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have link to privacy policy', () => {
      renderWithRouter(<SecurityPolicy />);
      const links = screen.getAllByRole('link', { name: /privacy policy/i });
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Content Quality', () => {
    it('should have substantive content (at least 400 characters)', () => {
      renderWithRouter(<SecurityPolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText.length).toBeGreaterThan(400);
    });

    it('should be well-structured with multiple sections', () => {
      renderWithRouter(<SecurityPolicy />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(5);
    });
  });
});
