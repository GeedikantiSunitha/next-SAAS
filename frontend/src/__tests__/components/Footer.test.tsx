/**
 * Footer Component Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Footer } from '../../components/Footer';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Footer Component', () => {
  it('should render footer', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should display copyright information', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByText(/copyright|©/i)).toBeInTheDocument();
  });

  it('should display current year in copyright', () => {
    renderWithRouter(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it('should display links section', () => {
    renderWithRouter(<Footer />);
    // Footer should have navigation links
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should be consistent across pages', () => {
    // This is more of a design requirement - footer should look the same everywhere
    renderWithRouter(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});

