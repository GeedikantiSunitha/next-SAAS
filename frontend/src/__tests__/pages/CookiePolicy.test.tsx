/**
 * Cookie Policy Page Tests (TDD)
 *
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 *
 * Requirements:
 * - Display comprehensive cookie policy
 * - Explain what cookies are and why we use them
 * - List all cookie categories (essential, analytics, marketing, functional)
 * - Detail specific cookies used
 * - Explain how users can control cookies
 * - Link to privacy policy and GDPR settings
 * - Last updated date
 * - Accessible and readable
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { CookiePolicy } from '../../pages/CookiePolicy';
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

describe('CookiePolicy Page', () => {
  describe('Page Structure', () => {
    it('should render cookie policy page', () => {
      renderWithRouter(<CookiePolicy />);
      expect(screen.getByRole('heading', { name: /^cookie policy$/i })).toBeInTheDocument();
    });

    it('should display last updated date', () => {
      renderWithRouter(<CookiePolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/last updated.*january 2026/i);
    });

    it('should have proper page title', () => {
      renderWithRouter(<CookiePolicy />);
      expect(document.title).toContain('Cookie Policy');
    });
  });

  describe('Cookie Information Sections', () => {
    it('should have what are cookies section', () => {
      renderWithRouter(<CookiePolicy />);
      expect(screen.getByRole('heading', { name: /what are cookies/i })).toBeInTheDocument();
    });

    it('should have why we use cookies section', () => {
      renderWithRouter(<CookiePolicy />);
      const headings = screen.getAllByRole('heading');
      const hasWhySection = headings.some(h =>
        /why we use|how we use.*cookies/i.test(h.textContent || '')
      );
      expect(hasWhySection).toBe(true);
    });

    it('should have types of cookies section', () => {
      renderWithRouter(<CookiePolicy />);
      const headings = screen.getAllByRole('heading');
      const hasTypesSection = headings.some(h =>
        /types of cookies|cookies we use/i.test(h.textContent || '')
      );
      expect(hasTypesSection).toBe(true);
    });
  });

  describe('Cookie Categories', () => {
    it('should describe essential cookies', () => {
      renderWithRouter(<CookiePolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/essential|strictly necessary/i);
    });

    it('should describe analytics cookies', () => {
      renderWithRouter(<CookiePolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/analytics|performance/i);
    });

    it('should describe marketing cookies', () => {
      renderWithRouter(<CookiePolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/marketing|advertising/i);
    });

    it('should describe functional cookies', () => {
      renderWithRouter(<CookiePolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/functional|preference/i);
    });
  });

  describe('Cookie Management', () => {
    it('should have cookie control section', () => {
      renderWithRouter(<CookiePolicy />);
      const headings = screen.getAllByRole('heading');
      const hasControlSection = headings.some(h =>
        /manage|control.*cookies/i.test(h.textContent || '')
      );
      expect(hasControlSection).toBe(true);
    });

    it('should explain browser controls', () => {
      renderWithRouter(<CookiePolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/browser.*settings|browser.*preferences/i);
    });
  });

  describe('Links and Navigation', () => {
    it('should link to privacy policy', () => {
      renderWithRouter(<CookiePolicy />);
      const privacyLinks = screen.getAllByRole('link', { name: /privacy policy/i });
      expect(privacyLinks.length).toBeGreaterThan(0);
      expect(privacyLinks[0]).toHaveAttribute('href', '/privacy-policy');
    });

    it('should link to cookie settings or GDPR settings', () => {
      renderWithRouter(<CookiePolicy />);
      const settingsLinks = screen.getAllByRole('link', { name: /cookie.*settings|manage.*preferences|gdpr.*settings/i });
      expect(settingsLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Third-Party Cookies', () => {
    it('should mention third-party cookies', () => {
      renderWithRouter(<CookiePolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/third.?party/i);
    });
  });

  describe('Updates Section', () => {
    it('should have policy updates section', () => {
      renderWithRouter(<CookiePolicy />);
      const headings = screen.getAllByRole('heading');
      const hasUpdatesSection = headings.some(h =>
        /changes|updates.*policy/i.test(h.textContent || '')
      );
      expect(hasUpdatesSection).toBe(true);
    });
  });

  describe('Contact Information', () => {
    it('should have contact section', () => {
      renderWithRouter(<CookiePolicy />);
      const headings = screen.getAllByRole('heading');
      const hasContactSection = headings.some(h =>
        /contact|reach.*us|questions/i.test(h.textContent || '')
      );
      expect(hasContactSection).toBe(true);
    });

    it('should display contact email', () => {
      renderWithRouter(<CookiePolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/privacy@nextsaas.com|support@nextsaas.com/i);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<CookiePolicy />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(5);
    });
  });

  describe('Content Quality', () => {
    it('should have substantial content', () => {
      renderWithRouter(<CookiePolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText.length).toBeGreaterThan(800);
    });

    it('should mention company name', () => {
      renderWithRouter(<CookiePolicy />);
      const bodyText = document.body.textContent || '';
      expect(bodyText).toMatch(/NextSaaS/i);
    });
  });
});
