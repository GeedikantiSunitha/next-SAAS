/**
 * Header/Navigation Component
 * 
 * Consistent navigation bar across all pages
 * Shows different links based on authentication status
 */

import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  isAuthenticated?: boolean;
  userEmail?: string;
  userRole?: string;
  onLogout?: () => void;
  className?: string;
}

const isAdmin = (role?: string) => role === 'ADMIN' || role === 'SUPER_ADMIN';

export const Header = ({
  isAuthenticated = false,
  userEmail,
  userRole,
  onLogout,
  className,
}: HeaderProps) => {
  return (
    <header role="banner" className={cn('bg-card border-b shadow-sm sticky top-0 z-50', className)}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Home Link */}
          <div className="flex items-center">
            <Link
              to="/"
              className="text-xl font-semibold text-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Button asChild variant="ghost">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/register">Register</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/forgot-password">Forgot Password</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/profile">Profile</Link>
                </Button>
                {isAdmin(userRole) && (
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link to="/admin/dashboard">
                      <LayoutDashboard className="h-4 w-4" aria-hidden />
                      Admin Panel
                    </Link>
                  </Button>
                )}
                <NotificationBell />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{userEmail}</span>
                </div>
                {onLogout && (
                  <Button variant="outline" onClick={onLogout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

