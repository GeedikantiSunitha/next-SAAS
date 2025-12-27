/**
 * Layout Component
 * 
 * Wraps pages with consistent Header and Footer
 */

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export const Layout = ({ children, showHeader = true, showFooter = true }: LayoutProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && (
        <Header
          isAuthenticated={isAuthenticated}
          userEmail={user?.email}
          onLogout={handleLogout}
        />
      )}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

