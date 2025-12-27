/**
 * Footer Component
 * 
 * Consistent footer across all pages
 */

import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface FooterProps {
  className?: string;
}

export const Footer = ({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className={cn('bg-card border-t mt-auto py-8 px-4', className)}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {currentYear} Your Company. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link
              to="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

