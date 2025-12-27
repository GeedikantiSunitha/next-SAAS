/**
 * Landing Page Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Landing } from '../../pages/Landing';
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

describe('Landing Page', () => {
  it('should render landing page', () => {
    renderWithRouter(<Landing />);
    // Layout provides main, so check for heading instead
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should display hero section with heading', () => {
    renderWithRouter(<Landing />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should display call-to-action buttons', () => {
    renderWithRouter(<Landing />);
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    // Footer also has login link, so get all and check at least one exists
    const loginLinks = screen.getAllByRole('link', { name: /login/i });
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it('should link to register page', () => {
    renderWithRouter(<Landing />);
    const registerLink = screen.getByRole('link', { name: /get started/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should link to login page', () => {
    renderWithRouter(<Landing />);
    // Footer also has login link, get the first one (from hero section)
    const loginLinks = screen.getAllByRole('link', { name: /login/i });
    expect(loginLinks[0]).toHaveAttribute('href', '/login');
  });

  it('should display features section', () => {
    renderWithRouter(<Landing />);
    // Features section should be present - check for heading or description
    expect(screen.getByText(/everything you need/i)).toBeInTheDocument();
  });

  it('should display footer', () => {
    renderWithRouter(<Landing />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});

